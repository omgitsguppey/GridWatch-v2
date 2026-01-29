import { GoogleGenAI, Type, LiveServerMessage, Modality, Content } from "@google/genai";
import { WarmingCenter, GroundingChunk } from "../types";

const API_KEY = process.env.API_KEY || '';

const getAiInstance = async () => {
    return new GoogleGenAI({ apiKey: API_KEY });
};

export const findWarmingCenters = async (lat: number, lng: number): Promise<{ centers: WarmingCenter[]; chunks: GroundingChunk[] }> => {
  const ai = await getAiInstance();
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Find open public services like warming centers, libraries, and public community centers near latitude ${lat}, longitude ${lng}. Return a JSON list with name, address, status (OPEN, FULL, or CLOSED), and coordinates.`,
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            address: { type: Type.STRING },
            status: { type: Type.STRING, enum: ['OPEN', 'FULL', 'CLOSED'] },
            latitude: { type: Type.NUMBER },
            longitude: { type: Type.NUMBER }
          },
          required: ['name', 'address', 'status', 'latitude', 'longitude']
        }
      }
    }
  });

  const text = response.text || "[]";
  let centers: WarmingCenter[] = [];
  try {
    centers = JSON.parse(text);
  } catch (e) { console.error(e); }
  return { centers, chunks: [] };
};

export const findOutageClusters = async (lat: number, lng: number): Promise<{ text: string; chunks: GroundingChunk[] }> => {
  const ai = await getAiInstance();
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: "What are the latest community status reports or issues reported near this location? Summarize in 2 sentences.",
    config: {
      tools: [{ googleMaps: {} }],
      toolConfig: { retrievalConfig: { latLng: { latitude: lat, longitude: lng } } }
    }
  });
  return { text: response.text || "Scanning for updates...", chunks: [] };
};

export const chatWithAssistant = async (history: {role: string, parts: {text: string}[]}[], message: string): Promise<string> => {
    const ai = await getAiInstance();
    const contents: Content[] = [
        ...history.map(h => ({ role: h.role, parts: h.parts })),
        { role: 'user', parts: [{ text: message }] }
    ];
    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: contents,
        config: { systemInstruction: "You are a helpful community assistant for GridWatch. Answer user questions about local services and safety." }
    });
    return response.text || "";
};

export const connectToLiveApi = async (onAudioData: (base64: string) => void, onClose: () => void) => {
    const ai = await getAiInstance();
    return ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
            onopen: () => console.log("Voice mode ready"),
            onmessage: (message: LiveServerMessage) => {
                const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                if (base64Audio) onAudioData(base64Audio);
            },
            onclose: onClose,
            onerror: onClose
        },
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } }
        }
    });
};

export const generateDamageReportVideo = async (imageBytes: string, prompt: string): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: prompt,
        image: { imageBytes, mimeType: 'image/jpeg' },
        config: { numberOfVideos: 1, resolution: '720p', aspectRatio: '16:9' }
    });
    while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await ai.operations.getVideosOperation({operation});
    }
    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    const videoRes = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    const blob = await videoRes.blob();
    return URL.createObjectURL(blob);
};

export const editImage = async (imageBytes: string, prompt: string): Promise<string> => {
    const ai = await getAiInstance();
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ inlineData: { data: imageBytes, mimeType: 'image/jpeg' } }, { text: prompt }] }
    });
    for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    }
    throw new Error("Edit failed");
};