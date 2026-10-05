"use server";

import { ENVIRONMENT } from "@/config/environment";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: ENVIRONMENT.googleGenAIKey });

export async function handleChat(message: string): Promise<string> {
  // const response = await ai.models.generateContent({
  //   model: "gemini-3-flash-preview",
  //   contents: message,
  //   config: {},
  // });

  // return response.text;

  const interaction = await ai.interactions.create({
    model: "gemini-3-flash-preview",
    input: message,
  });

  const text = interaction.output_text?.trim();

  if (!text) {
    throw new Error("AI didn't returning text response.");
  }

  return text;
}
