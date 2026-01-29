import React, { useState, useRef } from 'react';
import { generateDamageReportVideo, editImage } from '../services/geminiService';
import { Camera, Video, Wand2, Upload, Play, Image as ImageIcon } from 'lucide-react';

export const MediaTools: React.FC = () => {
    const [mode, setMode] = useState<'VEO' | 'EDIT'>('VEO');
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [prompt, setPrompt] = useState('');
    const [result, setResult] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64 = reader.result as string;
                // Strip prefix for API usage if needed, but often data URIs work or need simple stripping
                // The API needs raw base64 usually, but let's handle it in service
                // Just keeping the full data URI for display
                setSelectedImage(base64);
                setResult(null);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleAction = async () => {
        if (!selectedImage || !prompt) return;
        setLoading(true);
        setResult(null);
        
        // Extract base64 content
        const base64Content = selectedImage.split(',')[1];

        try {
            if (mode === 'VEO') {
                const videoUrl = await generateDamageReportVideo(base64Content, prompt);
                setResult(videoUrl);
            } else {
                const editedImage = await editImage(base64Content, prompt);
                setResult(editedImage);
            }
        } catch (e) {
            alert("Generation failed. Please try again.");
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="pb-24 px-4 pt-4 h-full flex flex-col">
            <h2 className="text-xl font-bold text-white mb-4">Visual Intelligence</h2>
            
            <div className="flex bg-surface rounded-xl p-1 mb-6 border border-white/10">
                <button 
                    onClick={() => setMode('VEO')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all ${mode === 'VEO' ? 'bg-white text-black' : 'text-subtext hover:text-white'}`}
                >
                    <Video size={16} />
                    Veo Simulation
                </button>
                <button 
                    onClick={() => setMode('EDIT')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all ${mode === 'EDIT' ? 'bg-white text-black' : 'text-subtext hover:text-white'}`}
                >
                    <Wand2 size={16} />
                    Image Edit
                </button>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar">
                {!selectedImage ? (
                    <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-white/20 rounded-2xl h-64 flex flex-col items-center justify-center text-subtext bg-surface hover:bg-white/5 transition-colors cursor-pointer"
                    >
                        <Camera size={48} className="mb-4 text-white/50" />
                        <p className="font-medium">Upload Scene Photo</p>
                        <p className="text-xs opacity-60 mt-1">Tap to select</p>
                    </div>
                ) : (
                    <div className="relative rounded-2xl overflow-hidden mb-6 bg-surface">
                        <img src={selectedImage} alt="Source" className="w-full h-auto max-h-80 object-cover opacity-80" />
                        <button 
                            onClick={() => setSelectedImage(null)}
                            className="absolute top-2 right-2 bg-black/60 text-white p-2 rounded-full"
                        >
                            <Upload size={14} />
                        </button>
                    </div>
                )}
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />

                <div className="mt-4">
                    <label className="text-xs font-bold text-subtext uppercase tracking-widest mb-2 block">
                        {mode === 'VEO' ? 'Simulation Prompt' : 'Edit Instruction'}
                    </label>
                    <div className="relative">
                        <textarea 
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder={mode === 'VEO' ? "e.g., Show heavy snowfall accumulating on this street..." : "e.g., Remove the debris from the driveway..."}
                            className="w-full bg-surface border border-white/10 rounded-xl p-4 text-white focus:border-primary focus:outline-none min-h-[100px]"
                        />
                        <button 
                            disabled={!selectedImage || !prompt || loading}
                            onClick={handleAction}
                            className={`absolute bottom-3 right-3 p-3 rounded-full flex items-center justify-center transition-all ${!selectedImage || !prompt || loading ? 'bg-white/10 text-white/30' : 'bg-primary text-white shadow-lg shadow-primary/30'}`}
                        >
                            {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Play size={20} fill="currentColor" />}
                        </button>
                    </div>
                </div>

                {result && (
                    <div className="mt-8 mb-8">
                         <h3 className="text-white font-bold mb-3 flex items-center gap-2">
                            {mode === 'VEO' ? <Video size={18} className="text-primary"/> : <ImageIcon size={18} className="text-primary"/>}
                            Generated Result
                        </h3>
                        <div className="rounded-2xl overflow-hidden border border-white/10 bg-black">
                            {mode === 'VEO' ? (
                                <video src={result} controls className="w-full h-auto" autoPlay loop />
                            ) : (
                                <img src={result} alt="Edited result" className="w-full h-auto" />
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
