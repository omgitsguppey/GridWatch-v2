import React, { useState, useCallback } from 'react';
import { Zap, ArrowRight, Loader2, Mail, Lock, AlertCircle, WifiOff, CheckCircle2 } from 'lucide-react';

interface LandingPageProps {
  onAdminLogin: (user: { name: string; email: string; picture?: string }) => void;
}

const AUTH_ENDPOINT = '/api/auth/login';

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null;
};

const normalizeUser = (value: unknown): { name: string; email: string; picture?: string } | null => {
  if (!isRecord(value)) {
    return null;
  }

  const user = value.user;
  if (!isRecord(user)) {
    return null;
  }

  const name = user.name;
  const email = user.email;
  const picture = user.picture;

  if (typeof name !== 'string' || typeof email !== 'string') {
    return null;
  }

  const trimmedName = name.trim();
  const trimmedEmail = email.trim();
  if (!trimmedName || !trimmedEmail) {
    return null;
  }

  const normalizedUser: { name: string; email: string; picture?: string } = {
    name: trimmedName,
    email: trimmedEmail,
  };

  if (typeof picture === 'string' && picture.trim()) {
    normalizedUser.picture = picture.trim();
  }

  return normalizedUser;
};

export const LandingPage: React.FC<LandingPageProps> = ({ onAdminLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isOffline, setIsOffline] = useState(false);
  const handleLogin = useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);
    setError('');
    setIsOffline(false);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const response = await fetch(AUTH_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const data = await response.json().catch(() => null);

      if (response.ok) {
        const normalizedUser = normalizeUser(data);
        if (!normalizedUser) {
          setError("Unable to validate your account response.");
          setLoading(false);
          return;
        }
        setLoading(false);
        setIsOffline(false);
        onAdminLogin(normalizedUser);
        return;
      }

      if (response.status === 401) {
        if (isRecord(data) && typeof data.message === 'string') {
          setError(data.message);
        } else {
          setError("Invalid login details.");
        }
        setLoading(false);
        return;
      }

      throw new Error("Connection failed.");
    } catch (err: any) {
      setIsOffline(true);
      setError("Synchronization lost. Please retry your uplink.");
      setLoading(false);
    }
  }, [email, password, onAdminLogin]);

  return (
    <div className="min-h-screen bg-[#000000] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-[-25%] left-[-25%] w-[800px] h-[800px] bg-primary/10 blur-[180px] rounded-full pointer-events-none animate-pulse" />
      <div className="absolute bottom-[-25%] right-[-25%] w-[800px] h-[800px] bg-primary/5 blur-[180px] rounded-full pointer-events-none" />

      <div className="z-10 flex flex-col items-center text-center space-y-12 max-w-md w-full animate-in fade-in zoom-in-95 duration-1000">
        <div className="bg-[#111111]/50 p-10 rounded-[3rem] border border-white/5 shadow-2xl relative group overflow-hidden">
          <Zap className="w-20 h-20 text-primary fill-primary relative z-10 filter drop-shadow-[0_0_15px_rgba(10,132,255,0.4)]" />
          <div className="absolute inset-0 bg-primary/10 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
        </div>
        
        <div className="space-y-4">
          <h1 className="text-6xl font-black text-white tracking-tightest">
            GridWatch
          </h1>
          <p className="text-subtext text-xl font-medium px-8 leading-snug">
            Real-time status updates and local help in your community.
          </p>
        </div>

        <div className="w-full bg-[#111111]/40 backdrop-blur-2xl p-10 rounded-[3.5rem] border border-white/10 shadow-3xl relative overflow-hidden">
            <form onSubmit={handleLogin} className="space-y-6 pt-2">
                {error && (
                    <div className={`p-5 border rounded-2xl text-[13px] font-bold text-center animate-in slide-in-from-top-2 flex items-center justify-center gap-2 ${isOffline ? 'bg-warning/5 border-warning/20 text-warning' : 'bg-danger/5 border-danger/20 text-danger'}`}>
                        {isOffline ? <WifiOff size={16} /> : <AlertCircle size={16} />}
                        {error}
                    </div>
                )}
                
                <div className="space-y-3 text-left group">
                    <label className="text-[11px] font-black text-subtext/40 ml-5 uppercase tracking-[0.2em] group-focus-within:text-primary transition-colors">Email Address</label>
                    <div className="relative">
                        <Mail size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-subtext/40 group-focus-within:text-white transition-colors" />
                        <input 
                            type="email" 
                            disabled={loading}
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="w-full bg-[#000000] border border-white/20 rounded-2xl pl-14 pr-6 py-5 text-white placeholder-white/10 focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 transition-all disabled:opacity-50 font-semibold text-base tracking-tight"
                            placeholder="name@example.com"
                            required
                        />
                    </div>
                </div>

                <div className="space-y-3 text-left group">
                    <label className="text-[11px] font-black text-subtext/40 ml-5 uppercase tracking-[0.2em] group-focus-within:text-primary transition-colors">Password</label>
                    <div className="relative">
                        <Lock size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-subtext/40 group-focus-within:text-white transition-colors" />
                        <input 
                            type="password" 
                            disabled={loading}
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="w-full bg-[#000000] border border-white/20 rounded-2xl pl-14 pr-6 py-5 text-white placeholder-white/10 focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 transition-all disabled:opacity-50 font-semibold text-base tracking-tight"
                            placeholder="••••••••"
                            required
                        />
                    </div>
                </div>

                <div className="space-y-4">
                  <button 
                      type="submit" 
                      disabled={loading}
                      className="w-full bg-white text-black font-black py-5 rounded-2xl hover:bg-white/90 active:scale-[0.98] transition-all duration-200 shadow-[0_24px_70px_rgba(255,255,255,0.2)] mt-2 flex items-center justify-center gap-3 disabled:opacity-30 disabled:pointer-events-none text-[12px] sm:text-[13px] uppercase tracking-[0.25em]"
                  >
                      {loading ? (
                          <Loader2 size={22} className="animate-spin" />
                      ) : (
                          <>
                              Establish Uplink <ArrowRight size={20} />
                          </>
                      )}
                  </button>

                  {isOffline && (
                    <div className="flex items-center justify-center gap-2 text-warning animate-pulse">
                        <CheckCircle2 size={14} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Awaiting Uplink</span>
                    </div>
                  )}

                  <div className="text-center pt-2">
                    <button 
                      type="button"
                      className="text-[12px] font-bold text-subtext hover:text-white transition-colors tracking-wide"
                      onClick={() => alert("Registration is currently invited only.")}
                    >
                      Need an account? <span className="text-primary">Join now</span>
                    </button>
                  </div>
                </div>
            </form>
        </div>
        
        <p className="text-[10px] text-center text-white/5 font-mono tracking-tighter truncate opacity-20 select-none">
            GRIDWATCH_APP_V3
        </p>
      </div>
    </div>
  );
};
