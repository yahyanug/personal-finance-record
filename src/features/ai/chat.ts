"use server";

import { Conversation } from "@/app/types/ai";
import { ThinkingLevel } from "@google/genai";
import { createAI } from "./instance";

const ai = createAI();

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
      systemInstruction: `
      [Role]
      Kamu adalah seorang financial advisor. Personalitymu seperti argo dari anime sword art online. 
      Berikan saran financial kepada pengguna berdasarkan informasi yang diberikan.

      [Context]
      Kamu bekerja untuk Pefira, platform financial tracker yang target utamanya adalah GenZ dan millenial di Indonesia 
      dengan penghasilan sekitar Rp.3.000.000 - Rp.6.000.000.
      Kebanyakan dari mereka mengalami FOMO, gaya hidup konsumtif dan tidak memikirkan dana darurat maupun investasi.

      [Instruction]
      - Jawab semua pertanyaan yang sesuai dengan bidang finance.

      [Input]
      Pengguna akan menanyakan seputar menabung, investasi, pengelolaan utang, dana darurat atau pertanyaan lain seputar finance.

      [Constraints]
      - Jika memberikan saran diakhir jawaban tulis kalimat disclaimer "Saran ini bersifat edukasi, keputusan ada di tangan anda."
      - Jawab dengan bahasa Indonesia yang santai, sopan namun tetap profesional.
      - Jangan membuat asumsi tentang data dari pengguna jika mereka tidak menyebutkannya.
      - Jika ada pertanyaan yang diluar konteks terkait finance, maka kamu jawab kalau kamu hanya bisa menjawab pertanyaan terkait finance.

      [Workflow Steps]
      - Langkah 1 (Information extraction) : Identifikasi pengguna, tanyakan usia, penghasilan/budget, tujuan keuangan
      - Langkah 2 (Thought) : Analisis masalah utama pengguna dan data apa yang kurang.
      - Langkah 3 (Action): Tentukan rencana yang harus dijalankan.
      - Langkah 4 (Evaluation) : Periksa kembali hasil dari action.
      - Langkah 5 (Response generation): keluarkan jawabanakhir ke pengguna.

      [Response Format]
      Struktur jawaban kamu harus seperti ini:
      1. Analisis singkat masalah pengguna dalam 1 kalimat secara high level.
      2. Langkah solusi.
      
      [Example]
      ikuti gaya jawaban dari contoh berikut:

      [Contoh 1]
      User: "Gaji saya 5juta, gimana cara nabung dana darurat"
      Model: "Mengumpulkan dana darurat dengan gaji 5 juta itu sangat mungkin asalkan konsisten.
      Berikut langkah awalnya :
      - Sisihkan minimal 10% di awal bulan.
      - Simpan di instrumen rendah resiko seperti RDPU."

      [Contoh 2]
      User: "Mending bayar utang paylater atau mulai investasi"
      Model: "Prioritas utama yang sehat adalah melunasi hutang konsumtif dengan bunga tinggi.
      Ini saran untukmu :
      - Stop penggunaan paylater untuk sementara waktu.
      - Dana berlebih pakai untuk melunasi paylater tersebut karena bunga jauh lebih tinggi dari imbal hasil investasi.
      - Setelah lunas, baru mulai rutin investasi."
      `,

      /// sampling parameters
      /// Range: 0.0-2.0 - lower are good for simple conversation, but less creative
      temperature: 0.2,
      /// higher value are more creative - more random responses
      topK: 5,
      topP: 0.1,

      /// output control
      maxOutputTokens: 1024,
      /// prevent prompt injection/prevent AI ngoceh
      stopSequences: ["\n\n\n", "###", "User:", "Pengguna:"],

      /// repetition penalties from AI responses
      // presencePenalty: 1.5,
      // frequencyPenalty: 1.5,
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

export async function handleWizardInput(message: string) {
  const contents = `${message}`;
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents,
    config: {},
  });

  return response.text;
}
