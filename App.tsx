import React, { useState, useEffect } from 'react';
import { StatusFeed } from './components/StatusFeed';
import { WarmingCenters } from './components/WarmingCenters';
import { AppView } from './types';
import { Home, Map as MapIcon, Zap, BatteryCharging, Thermometer } from 'lucide-react';

const App: React.FC = () => {
    const [view, setView] = useState<AppView>(AppView.FEED);
    const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);

    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                (err) => console.error("Location denied", err)
            );
        }
    }, []);

    const renderView = () => {
        switch (view) {
            case AppView.FEED: return <StatusFeed userLocation={location} />;
            case AppView.MAP: return <WarmingCenters userLocation={location} />;
            default: return <StatusFeed userLocation={location} />;
        }
    };

    return (
        <div className="min-h-screen bg-background text-text font-sans selection:bg-primary/30">
            {/* Header / Big Status Input (Only on Feed) */}
            {view === AppView.FEED && (
                <div className="pt-6 px-4 pb-2 bg-gradient-to-b from-black to-transparent sticky top-0 z-10 backdrop-blur-xl">
                    <header className="flex justify-between items-center mb-6">
                        <div>
                            <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
                                <Zap className="text-primary fill-primary" size={24} />
                                GridWatch
                            </h1>
                            <p className="text-subtext text-xs font-medium tracking-wide">NASHVILLE EMERGENCY NETWORK</p>
                        </div>
                        <div className="w-2 h-2 bg-success rounded-full animate-pulse shadow-[0_0_10px_#30D158]"></div>
                    </header>

                    {/* Quick Status Actions */}
                    <div className="grid grid-cols-3 gap-3 mb-2">
                        <button className="flex flex-col items-center justify-center gap-2 bg-surface hover:bg-white/10 active:scale-95 transition-all p-4 rounded-2xl border border-white/5 group">
                            <div className="bg-black p-3 rounded-full border border-white/10 group-hover:border-danger/50 transition-colors">
                                <Zap className="text-danger" size={24} />
                            </div>
                            <span className="text-xs font-bold text-center leading-tight">I'm<br/>Dark</span>
                        </button>
                        <button className="flex flex-col items-center justify-center gap-2 bg-surface hover:bg-white/10 active:scale-95 transition-all p-4 rounded-2xl border border-white/5 group">
                            <div className="bg-black p-3 rounded-full border border-white/10 group-hover:border-success/50 transition-colors">
                                <BatteryCharging className="text-success" size={24} />
                            </div>
                            <span className="text-xs font-bold text-center leading-tight">Power<br/>Back</span>
                        </button>
                        <button className="flex flex-col items-center justify-center gap-2 bg-surface hover:bg-white/10 active:scale-95 transition-all p-4 rounded-2xl border border-white/5 group">
                            <div className="bg-black p-3 rounded-full border border-white/10 group-hover:border-primary/50 transition-colors">
                                <Thermometer className="text-primary" size={24} />
                            </div>
                            <span className="text-xs font-bold text-center leading-tight">Need<br/>Warming</span>
                        </button>
                    </div>
                </div>
            )}

            {/* Main Content Area */}
            <main className="h-full">
                {renderView()}
            </main>

            {/* Bottom Navigation */}
            <nav className="fixed bottom-0 left-0 right-0 bg-surface/90 backdrop-blur-lg border-t border-white/5 pb-safe pt-2 px-6 z-50">
                <div className="flex justify-around items-center max-w-md mx-auto h-16">
                    <button 
                        onClick={() => setView(AppView.FEED)}
                        className={`flex flex-col items-center gap-1 w-20 transition-colors ${view === AppView.FEED ? 'text-primary' : 'text-subtext'}`}
                    >
                        <Home size={24} strokeWidth={view === AppView.FEED ? 2.5 : 2} />
                        <span className="text-[10px] font-medium">Status</span>
                    </button>
                    <button 
                        onClick={() => setView(AppView.MAP)}
                        className={`flex flex-col items-center gap-1 w-20 transition-colors ${view === AppView.MAP ? 'text-primary' : 'text-subtext'}`}
                    >
                        <MapIcon size={24} strokeWidth={view === AppView.MAP ? 2.5 : 2} />
                        <span className="text-[10px] font-medium">Map</span>
                    </button>
                </div>
            </nav>
        </div>
    );
};

export default App;
