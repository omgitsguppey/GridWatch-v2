import { WarmingCenter, GroundingChunk } from "../types";

// In production, this should point to your hosted backend url.
// For local development, it points to the local node server.
// Here we use the backend url as defined in StatusFeed.tsx, or a relative path
// if we're proxying, but let's just use the direct URL since we also use it in StatusFeed.
const BACKEND_URL = 'http://localhost:8080'; // Using localhost for local testing. Wait, StatusFeed.tsx uses a hardcoded remote URL.
// We should determine the correct URL. Let's make it configurable or relative.
// Using a simple fallback logic:
const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:8080' : 'https://gridwatch-323159573006.us-west1.run.app';
const WS_BASE = window.location.hostname === 'localhost' ? 'ws://localhost:8080' : 'wss://gridwatch-323159573006.us-west1.run.app';

export const findWarmingCenters = async (lat: number, lng: number): Promise<{ centers: WarmingCenter[]; chunks: GroundingChunk[] }> => {
  const response = await fetch(`${API_BASE}/api/gemini/warming-centers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lat, lng })
  });
  if (!response.ok) throw new Error("Failed to fetch warming centers");
  const data = await response.json();
  const text = data.text || "[]";
  let centers: WarmingCenter[] = [];
  try {
    centers = JSON.parse(text);
  } catch (e) { console.error(e); }
  return { centers, chunks: [] };
};

export const findOutageClusters = async (lat: number, lng: number): Promise<{ text: string; chunks: GroundingChunk[] }> => {
  const response = await fetch(`${API_BASE}/api/gemini/outage-clusters`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lat, lng })
  });
  if (!response.ok) throw new Error("Failed to fetch outage clusters");
  const data = await response.json();
  return { text: data.text || "Scanning for updates...", chunks: [] };
};

export const chatWithAssistant = async (history: {role: string, parts: {text: string}[]}[], message: string): Promise<string> => {
    const response = await fetch(`${API_BASE}/api/gemini/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ history, message })
    });
    if (!response.ok) throw new Error("Failed to chat with assistant");
    const data = await response.json();
    return data.text || "";
};

export const connectToLiveApi = async (onAudioData: (base64: string) => void, onClose: () => void) => {
    return new Promise<any>((resolve, reject) => {
        const ws = new WebSocket(`${WS_BASE}/api/gemini/live`);

        ws.onopen = () => {
            console.log("WebSocket connected");
            // Resolve with an object that matches the expected interface in Assistant.tsx
            resolve({
                sendRealtimeInput: (input: any) => {
                    if (ws.readyState === WebSocket.OPEN && input?.media?.data) {
                        ws.send(JSON.stringify({ type: 'input', b64: input.media.data }));
                    }
                },
                close: () => ws.close()
            });
        };

        ws.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                if (message.type === 'open') {
                    console.log("Voice mode ready");
                } else if (message.type === 'audio') {
                    onAudioData(message.data);
                } else if (message.type === 'close') {
                    onClose();
                } else if (message.type === 'error') {
                    console.error("Live API Error:", message.message);
                    onClose();
                }
            } catch (e) {
                console.error("Error parsing WS message:", e);
            }
        };

        ws.onclose = () => {
            onClose();
        };

        ws.onerror = (e) => {
            console.error("WebSocket error", e);
            onClose();
            reject(e);
        };
    });
};

export const generateDamageReportVideo = async (imageBytes: string, prompt: string): Promise<string> => {
    const response = await fetch(`${API_BASE}/api/gemini/video`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBytes, prompt })
    });
    if (!response.ok) throw new Error("Failed to generate video");
    const blob = await response.blob();
    return URL.createObjectURL(blob);
};

export const editImage = async (imageBytes: string, prompt: string): Promise<string> => {
    const response = await fetch(`${API_BASE}/api/gemini/edit-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBytes, prompt })
    });
    if (!response.ok) throw new Error("Failed to edit image");
    const data = await response.json();
    if (data.error) throw new Error(data.error);
    return data.result;
};
