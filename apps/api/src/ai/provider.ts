import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createVertex } from "@ai-sdk/google-vertex";
import { createOpenAI } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";
import { HTTPException } from "hono/http-exception";

export function getModel(): LanguageModel {
  const provider = process.env.AI_PROVIDER;
  const apiKey = process.env.AI_API_KEY;

  if (!provider || (provider !== "google-vertex" && !apiKey)) {
    throw new HTTPException(503, {
      message: "AI Assistant is not configured on this server.",
    });
  }

  switch (provider) {
    case "openai": {
      const openai = createOpenAI({
        apiKey: apiKey || "",
        baseURL: process.env.AI_BASE_URL,
      });
      return openai.chat(process.env.AI_MODEL || "gpt-4o-mini");
    }
    case "google-vertex": {
      const vertex = createVertex({
        project: process.env.VERTEX_PROJECT,
        location: process.env.VERTEX_LOCATION || "us-central1",
      });
      return vertex.chat(process.env.AI_MODEL || "gemini-2.0-flash");
    }
    default: {
      const google = createGoogleGenerativeAI({
        apiKey: apiKey || "",
      });
      return google.chat(process.env.AI_MODEL || "gemini-2.0-flash");
    }
  }
}
