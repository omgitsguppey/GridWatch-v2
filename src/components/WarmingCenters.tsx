import React, { useState, useRef, useEffect } from 'react';
import { findWarmingCenters, findOutageClusters } from '../services/geminiService';
import { WarmingCenter, GroundingChunk } from '../types';
import { MapPin, Navigation, RefreshCw, Zap, Shield, Flame, X, Locate } from 'lucide-react';

interface MapViewProps {
    userLocation: { lat: number, lng: number } | null;
    onRequestLocation: () => void;
}

const DEFAULT_MAP_CENTER = { lat: 36.1627, lng: -86.7816 };

export const WarmingCenters: React.FC<MapViewProps> = ({ userLocation, onRequestLocation }) => {
    const [centers, setCenters] = useState<WarmingCenter[]>([]);
    const [outageInfo, setOutageInfo] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'STATUS' | 'SERVICES'>('STATUS');
    
    const [selectedCenter, setSelectedCenter] = useState<WarmingCenter | null>(null);
    const [zoom, setZoom] = useState(1);
    const mapRef = useRef<HTMLDivElement>(null);
    const [mapCenter, setMapCenter] = useState<{lat: number, lng: number} | null>(DEFAULT_MAP_CENTER);

    useEffect(() => {
        if (userLocation) {
            setMapCenter(userLocation);
        }
    }, [userLocation]);

    const fetchData = async () => {
        if (!mapCenter) return;
        setLoading(true);
        try {
            const [centerData, outageData] = await Promise.all([
                findWarmingCenters(mapCenter.lat, mapCenter.lng),
                findOutageClusters(mapCenter.lat, mapCenter.lng)
            ]);

            setCenters(centerData.centers);
            setOutageInfo(outageData.text);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const getPinStyle = (targetLat: number, targetLng: number) => {
        if (!mapCenter) return { display: 'none' };
        const latDiff = targetLat - mapCenter.lat;
        const lngDiff = targetLng - mapCenter.lng;
        const scale = 1000 * zoom; 
        const top = 50 + (latDiff * scale * -1); 
        const left = 50 + (lngDiff * scale);
        if (top < -10 || top > 110 || left < -10 || left > 110) return { display: 'none' };
        return { top: `${top}%`, left: `${left}%` };
    };

    return (
        <div className="flex flex-col h-full bg-black relative overflow-hidden">
            {/* Tab Switcher */}
            <div className="absolute top-4 left-4 right-4 z-20">
                 <div className="bg-black/80 backdrop-blur-md p-1 rounded-2xl flex border border-white/10 shadow-lg">
                    <button 
                        onClick={() => setActiveTab('STATUS')}
                        className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'STATUS' ? 'bg-surface text-white border border-white/10 shadow-sm' : 'text-subtext'}`}
                    >
                        <Zap size={14} className={activeTab === 'STATUS' ? "text-primary" : ""} />
                        Live Map
                    </button>
                    <button 
                        onClick={() => setActiveTab('SERVICES')}
                        className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'SERVICES' ? 'bg-surface text-white border border-white/10 shadow-sm' : 'text-subtext'}`}
                    >
                        <Shield size={14} className={activeTab === 'SERVICES' ? "text-warning" : ""} />
                        Open Services
                    </button>
                </div>
            </div>

            {/* Interactive Map */}
            <div 
                ref={mapRef}
                className="relative w-full h-full bg-[#0A0A0A] overflow-hidden cursor-crosshair group"
            >
                <div className="absolute inset-0 opacity-20 pointer-events-none" 
                     style={{ 
                         backgroundImage: `radial-gradient(circle at 2px 2px, #333 1px, transparent 0)`,
                         backgroundSize: `${40 * zoom}px ${40 * zoom}px`
                     }} 
                />
                
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                     <div className="w-4 h-4 bg-primary rounded-full border-2 border-white shadow-[0_0_20px_#0A84FF] relative">
                        <div className="absolute inset-0 bg-primary rounded-full animate-ping opacity-75"></div>
                     </div>
                </div>

                {centers.map((center, idx) => {
                     if (!center.latitude || !center.longitude) return null;
                     const style = getPinStyle(center.latitude, center.longitude);
                     return (
                         <button
                            key={idx}
                            onClick={() => setSelectedCenter(center)}
                            className="absolute -translate-x-1/2 -translate-y-1/2 hover:scale-110 active:scale-95 transition-transform z-10 group"
                            style={{ ...style, position: 'absolute' }}
                         >
                            <div className="w-8 h-8 bg-[#FF9F0A] rounded-full flex items-center justify-center border-2 border-white shadow-lg shadow-orange-500/30">
                                <Flame size={16} className="text-white fill-white" />
                            </div>
                         </button>
                     );
                })}

                <div className="absolute bottom-32 right-4 flex flex-col gap-3 z-10">
                    <button 
                        onClick={() => mapCenter && fetchData()}
                        className="bg-surface/80 backdrop-blur-md p-3 rounded-full border border-white/10 text-white hover:bg-surface active:scale-95 transition-all shadow-xl"
                    >
                        <RefreshCw size={24} className={loading ? "animate-spin" : ""} />
                    </button>
                    <button 
                        onClick={() => {
                            if (userLocation) {
                                setMapCenter(userLocation);
                                return;
                            }
                            onRequestLocation();
                        }}
                        className="bg-surface/80 backdrop-blur-md p-3 rounded-full border border-white/10 text-primary hover:bg-surface active:scale-95 transition-all shadow-xl"
                    >
                        <Locate size={24} />
                    </button>
                </div>
            </div>

            {/* Bottom Panel */}
            {selectedCenter && (
                <div className="absolute bottom-24 left-4 right-4 z-30 animate-in slide-in-from-bottom-10 duration-300">
                    <div className="bg-surface/95 backdrop-blur-xl border border-white/10 rounded-3xl p-5 shadow-2xl relative overflow-hidden">
                        <div className={`absolute top-0 left-0 w-1 h-full ${
                             selectedCenter.status === 'OPEN' ? 'bg-success' : selectedCenter.status === 'FULL' ? 'bg-warning' : 'bg-danger'
                        }`} />
                        <div className="flex justify-between items-start mb-2 pl-2">
                            <div>
                                <h3 className="text-lg font-bold text-white pr-8 leading-tight">{selectedCenter.name}</h3>
                                <p className="text-subtext text-sm mt-1 flex items-center gap-1">
                                    <MapPin size={12} /> {selectedCenter.address}
                                </p>
                            </div>
                            <button onClick={() => setSelectedCenter(null)} className="p-1 rounded-full text-subtext hover:text-white">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="mt-6 flex gap-3 pl-2">
                            <button 
                                onClick={() => {
                                    const url = `https://www.google.com/maps/dir/?api=1&destination=${selectedCenter.latitude},${selectedCenter.longitude}`;
                                    window.open(url, '_blank');
                                }}
                                className="flex-1 bg-primary hover:bg-blue-600 text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg"
                            >
                                <Navigation size={18} fill="currentColor" />
                                Get Directions
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            {activeTab === 'STATUS' && !selectedCenter && (
                <div className="absolute bottom-24 left-4 right-4 pointer-events-none">
                     <div className="bg-black/60 backdrop-blur border border-white/10 rounded-2xl p-4 pointer-events-auto">
                        <div className="flex items-center gap-2 mb-2">
                            <Zap size={16} className="text-warning" fill="currentColor" />
                            <span className="font-bold text-sm">Local Status</span>
                        </div>
                         <p className="text-xs text-subtext leading-relaxed">
                            {outageInfo || "Refresh to update status in your area."}
                         </p>
                     </div>
                </div>
            )}
        </div>
    );
};
