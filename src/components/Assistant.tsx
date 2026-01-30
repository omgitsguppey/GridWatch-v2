import React, { useState, useEffect, useRef } from 'react';
import { chatWithAssistant, connectToLiveApi } from '../services/geminiService';
import { Mic, Send, MessageSquare, StopCircle, Volume2 } from 'lucide-react';

export const Assistant: React.FC = () => {
    const [messages, setMessages] = useState<{role: string, parts: {text: string}[]}[]>([]);
    const [input, setInput] = useState('');
    const [isLive, setIsLive] = useState(false);
    const [loading, setLoading] = useState(false);
    
    // Live API refs
    const audioContextRef = useRef<AudioContext | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const liveSessionRef = useRef<any>(null); // Keep track of session to send data

    const handleSend = async () => {
        if (!input.trim()) return;
        const newMsg = { role: 'user', parts: [{ text: input }] };
        const updatedHistory = [...messages, newMsg];
        setMessages(updatedHistory);
        setInput('');
        setLoading(true);

        try {
            const responseText = await chatWithAssistant(messages, input);
            setMessages([...updatedHistory, { role: 'model', parts: [{ text: responseText || "I'm having trouble connecting." }] }]);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    // Audio Helpers for Live API
    const startLiveSession = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;
            
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            const ctx = new AudioContextClass({ sampleRate: 16000 });
            audioContextRef.current = ctx;

            // Output context for playing response
            const outCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

            let nextStartTime = 0;

            const sessionPromise = connectToLiveApi(async (base64Audio) => {
                // Play audio response
                const binaryString = atob(base64Audio);
                const bytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                }
                
                // Decode raw PCM - simplified for example (assuming 16 bit PCM from model)
                // The model returns raw PCM. We need to wrap it in AudioBuffer.
                // NOTE: Real implementation needs careful PCM decoding (Int16 -> Float32).
                const dataInt16 = new Int16Array(bytes.buffer);
                const audioBuffer = outCtx.createBuffer(1, dataInt16.length, 24000);
                const channelData = audioBuffer.getChannelData(0);
                for(let i=0; i<dataInt16.length; i++) {
                    channelData[i] = dataInt16[i] / 32768.0;
                }

                const source = outCtx.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(outCtx.destination);
                
                nextStartTime = Math.max(outCtx.currentTime, nextStartTime);
                source.start(nextStartTime);
                nextStartTime += audioBuffer.duration;

            }, () => setIsLive(false));

            liveSessionRef.current = sessionPromise;

            // Setup Input Stream
            const source = ctx.createMediaStreamSource(stream);
            const processor = ctx.createScriptProcessor(4096, 1, 1);
            
            processor.onaudioprocess = (e) => {
                const inputData = e.inputBuffer.getChannelData(0);
                // Downsample/convert to PCM 16kHz Int16
                const l = inputData.length;
                const int16 = new Int16Array(l);
                for (let i = 0; i < l; i++) {
                    int16[i] = inputData[i] * 32768;
                }
                
                // Base64 encode
                let binary = '';
                const len = int16.byteLength;
                const bytes = new Uint8Array(int16.buffer);
                for (let i = 0; i < len; i++) {
                    binary += String.fromCharCode(bytes[i]);
                }
                const b64 = btoa(binary);

                sessionPromise.then(session => {
                    session.sendRealtimeInput({
                        media: {
                            mimeType: 'audio/pcm;rate=16000',
                            data: b64
                        }
                    });
                });
            };

            source.connect(processor);
            processor.connect(ctx.destination); // needed for chrome to fire event
            
            sourceRef.current = source;
            processorRef.current = processor;
            setIsLive(true);

        } catch (e) {
            console.error("Live init failed", e);
            alert("Microphone access failed.");
        }
    };

    const stopLiveSession = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop());
        }
        if (processorRef.current) processorRef.current.disconnect();
        if (sourceRef.current) sourceRef.current.disconnect();
        if (audioContextRef.current) audioContextRef.current.close();
        // In a real implementation we would call session.close() if exposed, 
        // but current SDK wrapper might handle it on disconnect or we just drop local refs.
        setIsLive(false);
    };

    return (
        <div className="pb-24 px-4 pt-4 h-full flex flex-col">
            <h2 className="text-xl font-bold text-white mb-4">GridWatch AI Assistant</h2>

            <div className="flex-1 overflow-y-auto no-scrollbar mb-4 space-y-4">
                {messages.length === 0 && (
                    <div className="text-center text-subtext mt-20">
                        <MessageSquare size={48} className="mx-auto mb-4 opacity-20" />
                        <p>Ask about warming centers, report issues, or get safety tips.</p>
                    </div>
                )}
                {messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] p-4 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-primary text-white' : 'bg-surface text-gray-200'}`}>
                            {msg.parts[0].text}
                        </div>
                    </div>
                ))}
                {loading && (
                    <div className="flex justify-start">
                         <div className="bg-surface px-4 py-3 rounded-2xl">
                            <div className="flex gap-1">
                                <div className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                                <div className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                                <div className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Live Mode Toggle */}
            <div className="mb-4">
                {!isLive ? (
                    <button onClick={startLiveSession} className="w-full bg-surface hover:bg-white/5 border border-white/10 text-white p-4 rounded-xl flex items-center justify-center gap-3 transition-all">
                        <Mic className="text-primary" />
                        <span className="font-semibold">Start Voice Mode</span>
                    </button>
                ) : (
                    <button onClick={stopLiveSession} className="w-full bg-danger/20 border border-danger/50 text-danger p-4 rounded-xl flex items-center justify-center gap-3 animate-pulse">
                        <StopCircle fill="currentColor" />
                        <span className="font-semibold">End Voice Session</span>
                    </button>
                )}
            </div>

            {/* Text Input */}
            <div className="relative">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Type a message..."
                    className="w-full bg-surface border border-white/10 rounded-full pl-5 pr-12 py-3 text-white focus:border-primary focus:outline-none"
                    disabled={isLive}
                />
                <button 
                    onClick={handleSend}
                    disabled={!input.trim() || isLive}
                    className="absolute right-2 top-2 p-1.5 bg-primary rounded-full text-white disabled:opacity-50"
                >
                    <Send size={18} />
                </button>
            </div>
        </div>
    );
};
