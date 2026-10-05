"use server";

import { Conversation } from "@/app/types/ai";
import { ENVIRONMENT } from "@/config/environment";
import { GoogleGenAI, ThinkingLevel } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: ENVIRONMENT.googleGenAIKey });

/// Google AI still under develop for ai.interactions, not recommended for prod
// export async function handleChat(message: string): Promise<string> {
//   const interaction = await ai.interactions.create({
//     model: "gemini-3-flash-preview",
//     input: message,
//   });

//   const text = interaction.output_text?.trim();

//   if (!text) {
//     throw new Error("AI didn't returning text response.");
//   }

//   return text;
// }

export async function handleChat(
  conversation: Conversation[],
  isThinking: boolean,
) {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [...conversation],
    config: {
      thinkingConfig: {
        includeThoughts: isThinking,
        // thinkingBudget: 0,
        thinkingLevel: ThinkingLevel.LOW,
      },
    },
  });

  const result = {
    thought: "",
    answer: "",
  };

  if (isThinking) {
    const parts = response.candidates?.[0]?.content?.parts;
    if (!parts) {
      return;
    }

    for (const part of parts) {
      if (!part.text) {
        continue;
      } else if (part.thought) {
        result.thought += part.text;
      } else {
        result.answer += part.text;
      }
    }
  } else {
    result.answer = `${response.text}`;
  }

  return result;
}

export async function handleChatStreaming(
  conversation: Conversation[],
  isThinking: boolean,
) {
  const response = await ai.models.generateContentStream({
    model: "gemini-3-flash-preview",
    contents: [...conversation],
    config: {
      thinkingConfig: {
        includeThoughts: isThinking,
        thinkingLevel: isThinking ? ThinkingLevel.HIGH : ThinkingLevel.MINIMAL,
        // thinkingBudget: isThinking ? -1 : 0,
      },
    },
  });

  return (async function* () {
    if (isThinking) {
      for await (const chunk of response) {
        const parts = chunk.candidates?.[0]?.content?.parts;
        if (parts) {
          for (const part of parts) {
            if (!part.text) {
              continue;
            } else if (part.thought) {
              yield `[thought]${part.text}`;
            } else {
              yield part.text;
            }
          }
        }
      }
    } else {
      for await (const chunk of response) {
        if (chunk.text) {
          yield chunk.text;
        }
      }
    }
  })();
}
