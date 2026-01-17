
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Message, RenderSize, AspectRatio, ModelTier } from "../types";

/**
 * renderWithGemini
 */
export const renderWithGemini = async (
  prompt: string, 
  imageBase64: string, 
  mimeType: string,
  size: RenderSize = '1K',
  aspectRatio: AspectRatio = '16:9',
  modelTier: ModelTier = 'pro'
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // เลือก Model ตาม Tier
  // gemini-2.5-flash-image สำหรับงานทั่วไป (Free Tier)
  // gemini-3-pro-image-preview สำหรับงานคุณภาพสูง (Pro Tier)
  const selectedModel = modelTier === 'pro' ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image';

  let apiSize: "1K" | "2K" | "4K" = "1K";
  if (size === 'Full HD' || size === '2K') apiSize = "2K";
  else if (size === '4K') apiSize = "4K";
  else apiSize = "1K";
  
  const response = await ai.models.generateContent({
    model: selectedModel,
    contents: {
      parts: [
        {
          inlineData: {
            data: imageBase64,
            mimeType: mimeType
          }
        },
        { 
          text: `You are an expert architectural visualization engine. 
          Transform this SketchUp screenshot into a photorealistic architectural render. 
          Focus on realistic lighting, high-quality materials, and cinematic atmosphere.
          Architecture Style/Prompt: ${prompt}` 
        }
      ],
    },
    config: {
      imageConfig: {
        aspectRatio: aspectRatio,
        // imageSize มีผลเฉพาะรุ่น Pro (gemini-3-pro-image-preview)
        ...(modelTier === 'pro' ? { imageSize: apiSize } : {})
      }
    }
  });

  let imageUrl = '';
  if (response.candidates && response.candidates[0].content.parts) {
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        imageUrl = `data:image/jpeg;base64,${part.inlineData.data}`;
        break;
      }
    }
  }

  if (!imageUrl) throw new Error("Rendering failed");
  return imageUrl;
};

/**
 * editImageWithGemini
 */
export const editImageWithGemini = async (
  baseImageBase64: string,
  mimeType: string,
  editPrompt: string,
  maskBase64?: string,
  aspectRatio: AspectRatio = '16:9'
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const parts: any[] = [
    {
      inlineData: {
        data: baseImageBase64,
        mimeType: mimeType
      }
    }
  ];

  if (maskBase64) {
    parts.push({
      inlineData: {
        data: maskBase64,
        mimeType: 'image/png'
      }
    });
    parts.push({
      text: `Specifically focus the following modification on the area highlighted in the provided mask image: ${editPrompt}. Keep everything else identical to the original architectural render.`
    });
  } else {
    parts.push({
      text: `Focus only on the following modifications to this architectural render while keeping the rest identical: ${editPrompt}` 
    });
  }
  
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: { parts },
    config: {
      imageConfig: {
        aspectRatio: aspectRatio
      }
    }
  });

  let imageUrl = '';
  if (response.candidates && response.candidates[0].content.parts) {
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        imageUrl = `data:image/jpeg;base64,${part.inlineData.data}`;
        break;
      }
    }
  }

  if (!imageUrl) throw new Error("Image editing failed");
  return imageUrl;
};

export const generateImageWithGemini = async (prompt: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        { text: prompt },
      ],
    },
    config: {
      imageConfig: {
        aspectRatio: "1:1",
      },
    },
  });

  let imageUrl = '';
  if (response.candidates && response.candidates[0].content.parts) {
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        imageUrl = `data:image/png;base64,${part.inlineData.data}`;
        break;
      }
    }
  }

  if (!imageUrl) throw new Error("Image generation failed");
  return imageUrl;
};

export const chatWithGemini = async (
  messages: Message[],
  onChunk: (text: string) => void
): Promise<void> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const chat = ai.chats.create({
    model: 'gemini-3-pro-preview',
    config: {
      systemInstruction: "คุณคือ AtomRender Specialist ผู้เชี่ยวชาญด้านการเรนเดอร์และสถาปัตยกรรม",
    }
  });
  const lastUserMessage = messages.filter(m => m.role === 'user').pop();
  if (!lastUserMessage) return;
  const stream = await chat.sendMessageStream({ message: lastUserMessage.content });
  let accumulatedText = '';
  for await (const chunk of stream) {
    const c = chunk as GenerateContentResponse;
    accumulatedText += c.text || '';
    onChunk(accumulatedText);
  }
};
