import { client } from "@hyperfix/libs";

export async function getConversations(workspaceId: string) {
  const response = await client.ai.conversations.$get({
    query: { workspaceId },
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return await response.json();
}

export async function getConversation(id: string) {
  const response = await client.ai.conversations[":id"].$get({
    param: { id },
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return await response.json();
}

export async function deleteConversation(id: string) {
  const response = await client.ai.conversations[":id"].$delete({
    param: { id },
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return await response.json();
}
