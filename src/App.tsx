import React, { useState, useEffect } from 'react';
import { StatusFeed } from './components/StatusFeed';
import { WarmingCenters } from './components/WarmingCenters';
import { LandingPage } from './components/LandingPage';
import { MediaTools } from './components/MediaTools';
import { Assistant } from './components/Assistant';
import { AppView } from './types';
import { Home, Map as MapIcon, Zap, LogOut, Camera, MessageCircle } from 'lucide-react';

interface UserInfo {
  name: string;
  email: string;
  picture?: string;
}

const App: React.FC = () => {
    const [user, setUser] = useState<UserInfo | null>(null);
    const [view, setView] = useState<AppView>(AppView.MAP); 
    const [userLocation, setUserLocation] = useState<{ lat: number, lng: number } | null>(null);

    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setUserLocation({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    });
                },
                (error) => {
                    console.error("Error getting location", error);
                    setUserLocation({ lat: 36.1627, lng: -86.7816 });
                }
            );
        } else {
             setUserLocation({ lat: 36.1627, lng: -86.7816 });
        }
    }, []);

    const handleLogin = (credential: string) => {
        console.warn("Legacy handleLogin called.");
    };

    const handleAdminLogin = (adminUser: UserInfo) => {
        setUser(adminUser);
    };

    if (!user) {
        return <LandingPage onLogin={handleLogin} onAdminLogin={handleAdminLogin} />;
    }

    return (
        <div className="flex flex-col h-screen bg-black text-white overflow-hidden w-full relative">
            {/* Header */}
            <div className="flex justify-between items-center p-4 bg-surface border-b border-white/5 z-20">
                <div className="flex items-center gap-3">
                    <div className="bg-primary/20 p-2 rounded-lg">
                        <Zap size={20} className="text-primary fill-primary" />
                    </div>
                    <div>
                        <h1 className="font-bold text-lg leading-none">GridWatch</h1>
                        <p className="text-[10px] text-subtext font-medium tracking-wider uppercase">Live Updates</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {user.picture ? (
                         <img src={user.picture} alt="Profile" className="w-8 h-8 rounded-full border border-white/10" />
                    ) : (
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                            {user.name.charAt(0)}
                        </div>
                    )}
                    <button onClick={() => setUser(null)} className="text-subtext hover:text-danger transition-colors">
                        <LogOut size={18} />
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto no-scrollbar relative bg-black">
                {view === AppView.FEED && <StatusFeed userLocation={userLocation} />}
                {view === AppView.MAP && <WarmingCenters userLocation={userLocation} />}
                {view === AppView.MEDIA && <MediaTools />}
                {view === AppView.ASSISTANT && <Assistant />}
            </div>

            {/* Navigation */}
            <div className="bg-surface/90 backdrop-blur-md border-t border-white/5 p-4 z-20 absolute bottom-0 w-full">
                <div className="flex justify-around items-center px-2 max-w-2xl mx-auto">
                    <button 
                        onClick={() => setView(AppView.FEED)}
                        className={`flex flex-col items-center gap-1 transition-all ${view === AppView.FEED ? 'text-primary scale-105' : 'text-subtext hover:text-white'}`}
                    >
                        <Home size={24} fill={view === AppView.FEED ? "currentColor" : "none"} />
                        <span className="text-[10px] font-bold">Updates</span>
                    </button>
                    <button 
                        onClick={() => setView(AppView.MAP)}
                        className={`flex flex-col items-center gap-1 transition-all ${view === AppView.MAP ? 'text-primary scale-105' : 'text-subtext hover:text-white'}`}
                    >
                        <MapIcon size={24} fill={view === AppView.MAP ? "currentColor" : "none"} />
                        <span className="text-[10px] font-bold">Map</span>
                    </button>
                     <button 
                        onClick={() => setView(AppView.MEDIA)}
                        className={`flex flex-col items-center gap-1 transition-all ${view === AppView.MEDIA ? 'text-primary scale-105' : 'text-subtext hover:text-white'}`}
                    >
                        <Camera size={24} fill={view === AppView.MEDIA ? "currentColor" : "none"} />
                        <span className="text-[10px] font-bold">Media</span>
                    </button>
                     <button 
                        onClick={() => setView(AppView.ASSISTANT)}
                        className={`flex flex-col items-center gap-1 transition-all ${view === AppView.ASSISTANT ? 'text-primary scale-105' : 'text-subtext hover:text-white'}`}
                    >
                        <MessageCircle size={24} fill={view === AppView.ASSISTANT ? "currentColor" : "none"} />
                        <span className="text-[10px] font-bold">Assistant</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default App;
