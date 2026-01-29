import React, { useEffect, useState } from 'react';
import { findWarmingCenters, findOutageClusters } from '../services/geminiService';
import { WarmingCenter, GroundingChunk } from '../types';
import { MapPin, Navigation, ExternalLink, RefreshCw } from 'lucide-react';

interface WarmingCentersProps {
    userLocation: { lat: number, lng: number } | null;
}

export const WarmingCenters: React.FC<WarmingCentersProps> = ({ userLocation }) => {
    const [centers, setCenters] = useState<WarmingCenter[]>([]);
    const [outageInfo, setOutageInfo] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [groundingLinks, setGroundingLinks] = useState<GroundingChunk[]>([]);

    const fetchData = async () => {
        if (!userLocation) return;
        setLoading(true);
        try {
            const [centerData, outageData] = await Promise.all([
                findWarmingCenters(userLocation.lat, userLocation.lng),
                findOutageClusters(userLocation.lat, userLocation.lng)
            ]);

            setCenters(centerData.centers);
            setOutageInfo(outageData.text);
            setGroundingLinks([...centerData.chunks, ...outageData.chunks]);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
         // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userLocation]);

    return (
        <div className="pb-24 px-4 pt-4">
             <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-white">Emergency Map Data</h2>
                <button onClick={fetchData} disabled={!userLocation} className="p-2 bg-surface rounded-full text-primary hover:bg-white/10 transition-colors disabled:opacity-50">
                    <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
                </button>
            </div>

            {/* Outage Intelligence Card */}
            <div className="bg-surface rounded-2xl p-5 mb-6 border border-white/5">
                <h3 className="text-warning font-semibold flex items-center gap-2 mb-2">
                    <MapPin size={18} />
                    Local Grid Intelligence
                </h3>
                <p className="text-gray-300 text-sm leading-relaxed">
                    {!userLocation ? "Waiting for location..." : outageInfo || "Analyzing outage clusters..."}
                </p>
            </div>

            <h3 className="text-lg font-bold text-white mb-3">Nearest Warming Centers</h3>
            
            {loading && centers.length === 0 && (
                 <div className="flex flex-col gap-4">
                    {[1,2,3].map(i => <div key={i} className="h-24 bg-surface rounded-2xl animate-pulse"></div>)}
                 </div>
            )}

            {!loading && centers.length === 0 && userLocation && (
                <p className="text-subtext text-sm">No specific warming centers found nearby.</p>
            )}

            <div className="flex flex-col gap-4">
                {centers.map((center, idx) => (
                    <div key={idx} className="bg-surface rounded-2xl p-5 border border-white/5 relative overflow-hidden group">
                        <div className={`absolute top-0 right-0 px-3 py-1 text-xs font-bold uppercase tracking-wider ${
                            center.status === 'OPEN' ? 'bg-success text-black' : center.status === 'FULL' ? 'bg-warning text-black' : 'bg-danger text-white'
                        }`}>
                            {center.status}
                        </div>
                        <h4 className="font-bold text-lg text-white mt-2">{center.name}</h4>
                        <p className="text-subtext text-sm mb-4">{center.address}</p>
                        
                        <div className="flex gap-3">
                             <button className="flex-1 bg-white/10 hover:bg-white/20 text-white py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all">
                                <Navigation size={16} />
                                Directions
                             </button>
                             {center.sourceUrl && (
                                <a href={center.sourceUrl} target="_blank" rel="noreferrer" className="flex-1 bg-black/40 hover:bg-black/60 text-subtext py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all">
                                    <ExternalLink size={16} />
                                    Details
                                </a>
                             )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Grounding Sources */}
            {groundingLinks.length > 0 && (
                <div className="mt-8 pt-6 border-t border-white/10">
                    <h4 className="text-xs font-bold text-subtext uppercase tracking-widest mb-3">Verified Sources</h4>
                    <div className="flex flex-wrap gap-2">
                        {groundingLinks.map((chunk, i) => {
                            const uri = chunk.web?.uri || chunk.maps?.uri;
                            const title = chunk.web?.title || chunk.maps?.title || "Source";
                            if (!uri) return null;
                            return (
                                <a key={i} href={uri} target="_blank" rel="noopener noreferrer" className="text-[10px] bg-surface border border-white/10 text-primary px-2 py-1 rounded truncate max-w-[150px]">
                                    {title}
                                </a>
                            )
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};