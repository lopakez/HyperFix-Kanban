import { streamText } from "ai";
import { eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import db from "../../database";
import { aiConversationTable, aiMessageTable } from "../../database/schema";
import { SYSTEM_PROMPT } from "../prompt";
import { getModel } from "../provider";
import { getAiTools } from "../tools";

export async function chat({
  userId,
  workspaceId,
  conversationId,
  message,
}: {
  userId: string;
  workspaceId: string;
  conversationId?: string;
  message: string;
}) {
  let convId = conversationId;

  // 1. Si pas d'ID de conversation, on crée une nouvelle conversation. Sinon on vérifie la sécurité.
  if (convId) {
    const [existingConv] = await db
      .select()
      .from(aiConversationTable)
      .where(eq(aiConversationTable.id, convId))
      .limit(1);

    if (!existingConv || existingConv.userId !== userId) {
      throw new HTTPException(404, { message: "Conversation not found" });
    }
  } else {
    const [conv] = await db
      .insert(aiConversationTable)
      .values({
        userId,
        workspaceId,
        title: message.slice(0, 50) + (message.length > 50 ? "..." : ""),
      })
      .returning();
    convId = conv.id;
  }

  // 2. Sauvegarder le message de l'utilisateur
  await db.insert(aiMessageTable).values({
    conversationId: convId,
    role: "user",
    content: message,
  });

  // 3. Charger l'historique complet de la conversation
  const rawHistory = await db
    .select()
    .from(aiMessageTable)
    .where(eq(aiMessageTable.conversationId, convId))
    .orderBy(aiMessageTable.createdAt);

  // 4. Formater les messages pour le Vercel AI SDK
  const formattedMessages = rawHistory.map((m) => {
    // biome-ignore lint/suspicious/noExplicitAny: Vercel AI SDK compatibility
    const msg: any = {
      id: m.id,
      role: m.role as "user" | "assistant" | "system" | "tool",
      content: m.content,
    };
    if (m.toolCalls) {
      // Vercel AI SDK s'attend à "toolInvocations" pour l'historique côté client
      msg.toolInvocations = m.toolCalls;
    }
    return msg;
  });

  // 5. Appeler streamText avec function-calling récursif (maxSteps)
  const result = streamText({
    model: getModel(),
    system: SYSTEM_PROMPT,
    messages: formattedMessages,
    tools: getAiTools(userId),
    maxSteps: 5,
    onFinish: async (summary) => {
      // 6. Sauvegarder récursivement toutes les étapes intermédiaires d'appel d'outils et de résultats
      for (const step of summary.steps) {
        if (step.toolCalls.length > 0) {
          // Enregistrer l'appel de l'assistant avec les toolCalls
          await db.insert(aiMessageTable).values({
            conversationId: convId,
            role: "assistant",
            content: step.text || "",
            toolCalls: step.toolCalls,
          });

          // Enregistrer les réponses d'outils correspondantes (role: "tool")
          for (const res of step.toolResults) {
            await db.insert(aiMessageTable).values({
              conversationId: convId,
              role: "tool",
              content:
                typeof res.result === "string"
                  ? res.result
                  : JSON.stringify(res.result),
              // biome-ignore lint/suspicious/noExplicitAny: Vercel AI SDK compatibility
              toolCalls: [res] as any, // Stocker le détail de l'invocation pour référence
            });
          }
        }
      }

      // Enregistrer le message de texte final s'il existe
      if (summary.text) {
        await db.insert(aiMessageTable).values({
          conversationId: convId,
          role: "assistant",
          content: summary.text,
        });
      }
    },
  });

  // Renvoyer le flux avec l'en-tête de l'ID de conversation
  return result.toDataStreamResponse({
    headers: {
      "X-Conversation-Id": convId,
      "Access-Control-Expose-Headers": "X-Conversation-Id", // Permettre d'y accéder côté client
    },
  });
}
