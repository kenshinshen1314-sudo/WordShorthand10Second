
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { WordData, Category } from "./types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function fetchWordBatch(category: Category, count: number = 5): Promise<WordData[]> {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Generate ${count} random high-frequency ${category} vocabulary words for a 10-second memorization app. 
    For each word, provide:
    1. Phonetics and Chinese translation.
    2. English definition.
    3. Exactly 3 distinct example sentences (English and Chinese translation).
    4. At least 3 synonyms (the word and its Chinese translation).
    5. A creative mnemonic memory aid in Chinese.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            word: { type: Type.STRING },
            phonetic: { type: Type.STRING },
            translation: { type: Type.STRING },
            definition: { type: Type.STRING },
            examples: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  en: { type: Type.STRING },
                  zh: { type: Type.STRING }
                },
                required: ["en", "zh"]
              },
              description: "Exactly 3 example sentences."
            },
            synonyms: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  word: { type: Type.STRING },
                  translation: { type: Type.STRING }
                },
                required: ["word", "translation"]
              },
              description: "List of synonyms with translations."
            },
            mnemonic: { type: Type.STRING }
          },
          required: ["word", "phonetic", "translation", "definition", "examples", "synonyms", "mnemonic"]
        }
      }
    }
  });

  const responseText = response.text || '[]';
  const words: WordData[] = JSON.parse(responseText);
  
  if (words.length === 0) return [];

  // Generate visual mnemonic images for each word in parallel
  await Promise.all(words.map(async (word) => {
    try {
      const imgResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [{ 
            text: `A professional, minimalist 2D vector illustration acting as a visual mnemonic for the word "${word.word}". 
            Definition: ${word.definition}. 
            Mnemonic Concept: ${word.mnemonic}. 
            Visual style: Clean, high-contrast, symbolic, isolated on a pure white background. No text in image.` 
          }]
        },
        config: {
          imageConfig: { aspectRatio: "1:1" }
        }
      });

      const candidates = imgResponse.candidates || [];
      if (candidates.length > 0 && candidates[0].content?.parts) {
        for (const part of candidates[0].content.parts) {
          if (part.inlineData) {
            word.imageUrl = `data:image/png;base64,${part.inlineData.data}`;
            break;
          }
        }
      }
    } catch (e) {
      console.warn(`Image generation failed for word: ${word.word}`, e);
    }
  }));

  return words;
}

export async function generateWordAudio(word: string): Promise<string | undefined> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Say clearly: ${word}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Charon' },
          },
        },
      },
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  } catch (e) {
    console.error("AI Audio generation failed", e);
    return undefined;
  }
}
