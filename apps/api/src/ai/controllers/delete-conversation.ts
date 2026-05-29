import { eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import db from "../../database";
import { aiConversationTable } from "../../database/schema";

export async function deleteConversation(
  conversationId: string,
  userId: string,
) {
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

  await db
    .delete(aiConversationTable)
    .where(eq(aiConversationTable.id, conversationId));

  return { success: true };
}
export default deleteConversation;
