import { useQuery } from "@tanstack/react-query";
import { getConversation } from "@/fetchers/ai/conversations";

export function useGetConversation(conversationId: string | null) {
  return useQuery({
    queryKey: ["ai-conversation", conversationId],
    queryFn: () => getConversation(conversationId as string),
    enabled: !!conversationId,
  });
}
