"use server";

import { ENVIRONMENT } from "@/config/environment";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: ENVIRONMENT.googleGenAIKey });

export async function handleChat() {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: "bwaaaaa",
    config: {},
  });

  return response.text;
}
