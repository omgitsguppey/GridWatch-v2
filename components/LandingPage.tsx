import React from 'react';
import { Zap } from 'lucide-react';

interface LandingPageProps {
  onLogin: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLogin }) => {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-[-20%] left-[-20%] w-[500px] h-[500px] bg-primary/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[500px] h-[500px] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="z-10 flex flex-col items-center text-center space-y-8 max-w-md w-full">
        <div className="bg-surface p-6 rounded-3xl border border-white/5 shadow-2xl shadow-primary/10 mb-4">
            <Zap className="w-16 h-16 text-primary fill-primary" />
        </div>
        
        <div className="space-y-2">
            <h1 className="text-4xl font-black text-white tracking-tighter">
            GridWatch
            </h1>
            <p className="text-subtext text-lg font-medium leading-relaxed">
            Real-time power tracking and emergency resources for your community.
            </p>
        </div>

        <button 
            onClick={onLogin}
            className="w-full bg-white text-black font-bold text-lg py-4 rounded-2xl flex items-center justify-center gap-3 hover:bg-gray-200 transition-all active:scale-95"
        >
            <svg className="w-6 h-6" viewBox="0 0 24 24">
                <path fill="#000" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#000" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#000" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#000" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Sign in with Google
        </button>
        
        <p className="text-xs text-white/20 mt-8">
            By continuing, you agree to our Terms & Privacy Policy.
        </p>
      </div>
    </div>
  );
};
