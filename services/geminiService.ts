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
    contents: `Find the current active list of warming centers near latitude ${lat}, longitude ${lng}. Include fire stations, police stations, and community centers. Return a list with names, addresses, and current status if available.`,
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
            capacity: { type: Type.STRING }
          },
          required: ['name', 'address', 'status']
        }
      }
    }
  });

  const text = response.text || "[]";
  let centers: WarmingCenter[] = [];
  try {
    centers = JSON.parse(text);
  } catch (e) {
    console.error("Failed to parse warming centers", e);
  }

  const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks as GroundingChunk[] || [];
  return { centers, chunks };
};

export const findOutageClusters = async (lat: number, lng: number): Promise<{ text: string; chunks: GroundingChunk[] }> => {
  const ai = await getAiInstance();
  // Using gemini-2.5-flash for Maps Grounding as per guidelines
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: "What are the current power outage clusters nearby? Are there reports of restored power in this neighborhood?",
    config: {
      tools: [{ googleMaps: {} }],
      toolConfig: {
        retrievalConfig: {
            latLng: {
                latitude: lat,
                longitude: lng
            }
        }
      }
    }
  });

  return {
    text: response.text || "No data available.",
    chunks: response.candidates?.[0]?.groundingMetadata?.groundingChunks as GroundingChunk[] || []
  };
};

export const generateDamageReportVideo = async (imageBytes: string, prompt: string): Promise<string> => {
    // Veo API Key Selection Logic
    if (typeof window !== 'undefined' && (window as any).aistudio) {
        const aistudio = (window as any).aistudio;
        const hasKey = await aistudio.hasSelectedApiKey();
        if (!hasKey) {
            const success = await aistudio.openSelectKey();
            if (!success) {
                throw new Error("API Key selection is required for video generation.");
            }
        }
    }

    // Always create new instance for Veo to pick up potential new key from window.aistudio
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: prompt,
        image: {
            imageBytes: imageBytes,
            mimeType: 'image/jpeg', 
        },
        config: {
            numberOfVideos: 1,
            resolution: '720p',
            aspectRatio: '16:9'
        }
    });

    while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await ai.operations.getVideosOperation({operation: operation});
    }

    if (operation.error) {
        throw new Error(operation.error.message);
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) throw new Error("Failed to generate video.");

    // The response.body contains the MP4 bytes. Append API key.
    const videoRes = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    const blob = await videoRes.blob();
    return URL.createObjectURL(blob);
};

export const editImage = async (imageBytes: string, prompt: string): Promise<string> => {
    const ai = await getAiInstance();
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
            parts: [
                {
                    inlineData: {
                        data: imageBytes,
                        mimeType: 'image/jpeg',
                    },
                },
                {
                    text: prompt,
                },
            ],
        },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
            return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
    }
    throw new Error("Could not edit image.");
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
        config: {
            systemInstruction: "You are a helpful emergency response assistant.",
        }
    });

    return response.text || "";
};

export const connectToLiveApi = async (onAudioData: (base64: string) => void, onClose: () => void) => {
    const ai = await getAiInstance();
    return ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
            onopen: () => {
                console.log("Live API Connected");
            },
            onmessage: (message: LiveServerMessage) => {
                const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                if (base64Audio) {
                    onAudioData(base64Audio);
                }
            },
            onclose: () => {
                onClose();
            },
            onerror: (e) => {
                console.error("Live API Error", e);
                onClose();
            }
        },
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } }
            }
        }
    });
};