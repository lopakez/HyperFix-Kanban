import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";

export function getModel(): LanguageModel {
  const provider = process.env.AI_PROVIDER || "google";

  switch (provider) {
    case "openai": {
      const openai = createOpenAI({
        apiKey: process.env.AI_API_KEY || "",
        baseURL: process.env.AI_BASE_URL,
      });
      return openai.chat(process.env.AI_MODEL || "gpt-4o-mini");
    }
    default: {
      const google = createGoogleGenerativeAI({
        apiKey: process.env.AI_API_KEY || "",
      });
      return google.chat(process.env.AI_MODEL || "gemini-2.0-flash");
    }
  }
}
