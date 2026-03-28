const express = require('express');
const { OAuth2Client } = require('google-auth-library');
const cors = require('cors');
const { GoogleGenAI, Type, Modality } = require('@google/genai');
const http = require('http');
const WebSocket = require('ws');

const app = express();
app.use(cors()); // Critical for cross-origin requests from the web app
// Increase limit for image bytes
app.use(express.json({ limit: '50mb' }));

// Match the Client ID used in the frontend
const CLIENT_ID = '323159573006-cgt7goaad3tsp3vf62gvligd6sg8cqq0.apps.googleusercontent.com';
const client = new OAuth2Client(CLIENT_ID);

const API_KEY = process.env.API_KEY || process.env.GEMINI_API_KEY || '';
let ai;
if (API_KEY) {
    ai = new GoogleGenAI({ apiKey: API_KEY });
} else {
    console.warn("API_KEY or GEMINI_API_KEY not set in environment.");
}

/**
 * GOOGLE AUTH VERIFICATION ENDPOINT
 * Resolves the 404 error on the Cloud Run backend.
 */
app.post('/api/auth/google', async (req, res) => {
    const { credential } = req.body;

    if (!credential) {
        return res.status(400).json({ error: 'Missing credential in request body' });
    }

    try {
        const ticket = await client.verifyIdToken({
            idToken: credential,
            audience: CLIENT_ID,
        });

        const payload = ticket.getPayload();

        // Return structured user info as expected by LandingPage.tsx
        res.json({
            success: true,
            user: {
                name: payload.name,
                email: payload.email,
                picture: payload.picture
            }
        });

        console.log(`Auth Success: ${payload.email}`);
    } catch (error) {
        console.error('Google ID Token verification failed:', error);
        res.status(401).json({
            success: false,
            message: 'Invalid Google credential'
        });
    }
});

/**
 * IDENTIFIER/PASSWORD FALLBACK ENDPOINT
 */
app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    // Implement production-grade auth here
    if (email && password) {
        res.json({
            user: {
                name: email.split('@')[0],
                email: email
            }
        });
    } else {
        res.status(401).json({ message: 'Invalid credentials' });
    }
});

/**
 * REPORTS ENDPOINT (For StatusFeed)
 */
app.get('/api/reports', (req, res) => {
    // Return sample data or fetch from database
    res.json({
        reports: [
            {
                id: '1',
                type: 'OUTAGE',
                timestamp: Date.now(),
                location: { lat: 36.1627, lng: -86.7816, address: 'Downtown Nashville' },
                description: 'Transformer blew on 2nd Ave.',
                verified: true
            }
        ]
    });
});

/**
 * GEMINI ENDPOINTS
 */

app.post('/api/gemini/warming-centers', async (req, res) => {
    if (!ai) return res.status(500).json({ error: 'AI not configured' });
    const { lat, lng } = req.body;
    try {
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
        res.json({ text });
    } catch (error) {
        console.error("Warming centers error:", error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/gemini/outage-clusters', async (req, res) => {
    if (!ai) return res.status(500).json({ error: 'AI not configured' });
    const { lat, lng } = req.body;
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: "What are the latest community status reports or issues reported near this location? Summarize in 2 sentences.",
            config: {
                tools: [{ googleMaps: {} }],
                toolConfig: { retrievalConfig: { latLng: { latitude: lat, longitude: lng } } }
            }
        });
        res.json({ text: response.text || "Scanning for updates..." });
    } catch (error) {
        console.error("Outage clusters error:", error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/gemini/chat', async (req, res) => {
    if (!ai) return res.status(500).json({ error: 'AI not configured' });
    const { history, message } = req.body;
    try {
        const contents = [
            ...(history || []).map(h => ({ role: h.role, parts: h.parts })),
            { role: 'user', parts: [{ text: message }] }
        ];
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: contents,
            config: { systemInstruction: "You are a helpful community assistant for GridWatch. Answer user questions about local services and safety." }
        });
        res.json({ text: response.text || "" });
    } catch (error) {
        console.error("Chat error:", error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/gemini/video', async (req, res) => {
    if (!ai) return res.status(500).json({ error: 'AI not configured' });
    const { imageBytes, prompt } = req.body;
    try {
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
        // The backend fetches the video as blob and returns as buffer
        const videoRes = await fetch(`${downloadLink}&key=${API_KEY}`);
        const buffer = await videoRes.arrayBuffer();
        res.set('Content-Type', 'video/mp4'); // Assume mp4
        res.send(Buffer.from(buffer));
    } catch (error) {
        console.error("Video error:", error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/gemini/edit-image', async (req, res) => {
    if (!ai) return res.status(500).json({ error: 'AI not configured' });
    const { imageBytes, prompt } = req.body;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [{ inlineData: { data: imageBytes, mimeType: 'image/jpeg' } }, { text: prompt }] }
        });
        let result = "";
        for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
                result = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                break;
            }
        }
        if (!result) throw new Error("Edit failed to return inlineData");
        res.json({ result });
    } catch (error) {
        console.error("Edit image error:", error);
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 8080;
const server = http.createServer(app);

// WebSocket Proxy for Live API
const wss = new WebSocket.Server({ noServer: true });

server.on('upgrade', (request, socket, head) => {
    if (request.url.startsWith('/api/gemini/live')) {
        wss.handleUpgrade(request, socket, head, (ws) => {
            wss.emit('connection', ws, request);
        });
    } else {
        socket.destroy();
    }
});

wss.on('connection', async (ws) => {
    if (!ai) {
        ws.close(1011, "AI not configured");
        return;
    }

    try {
        const session = await ai.live.connect({
            model: 'gemini-2.5-flash-native-audio-preview-12-2025',
            callbacks: {
                onopen: () => {
                    ws.send(JSON.stringify({ type: 'open' }));
                },
                onmessage: (message) => {
                    const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                    if (base64Audio) {
                        ws.send(JSON.stringify({ type: 'audio', data: base64Audio }));
                    }
                },
                onclose: () => {
                    ws.send(JSON.stringify({ type: 'close' }));
                    ws.close();
                },
                onerror: (e) => {
                    ws.send(JSON.stringify({ type: 'error', message: e.message || 'Unknown error' }));
                    ws.close();
                }
            },
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } }
            }
        });

        ws.on('message', (message) => {
            try {
                const data = JSON.parse(message);
                if (data.type === 'input') {
                    session.sendRealtimeInput({
                        media: {
                            mimeType: 'audio/pcm;rate=16000',
                            data: data.b64
                        }
                    });
                }
            } catch (err) {
                console.error("Live WS message error:", err);
            }
        });

        ws.on('close', () => {
             // Clean up if needed, though session might self-terminate or garbage collect
        });

    } catch (error) {
        console.error("Live API connect error:", error);
        ws.close(1011, "Failed to connect to Live API");
    }
});


server.listen(PORT, () => {
    console.log(`GridWatch Backend Service running on port ${PORT}`);
});
