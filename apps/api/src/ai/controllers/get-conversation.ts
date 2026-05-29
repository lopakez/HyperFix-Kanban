import { eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import db from "../../database";
import { aiConversationTable, aiMessageTable } from "../../database/schema";

export async function getConversation(conversationId: string, userId: string) {
  const [conversation] = await db
    .select()
    .from(aiConversationTable)
    .where(eq(aiConversationTable.id, conversationId))
    .limit(1);

  if (!conversation) {
    throw new HTTPException(404, { message: "Conversation not found" });
  }

  if (conversation.userId !== userId) {
    throw new HTTPException(403, {
      message: "Access denied to this conversation",
    });
  }

  const messages = await db
    .select()
    .from(aiMessageTable)
    .where(eq(aiMessageTable.conversationId, conversationId))
    .orderBy(aiMessageTable.createdAt);

  return {
    ...conversation,
    messages: messages.map((m) => ({
      id: m.id,
      role: m.role as "user" | "assistant" | "system" | "tool",
      content: m.content,
      createdAt: m.createdAt,
      ...(m.toolCalls ? { toolInvocations: m.toolCalls } : {}),
    })),
  };
}
