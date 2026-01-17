
import React, { useState } from 'react';
import { Box, ShieldCheck, Mail, ArrowRight, Loader2, Cloud } from 'lucide-react';

interface LoginScreenProps {
  onLogin: (user: {name: string, email: string, avatar: string}) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes('@')) return alert('กรุณาระบุอีเมลที่ถูกต้อง');
    
    setIsLoading(true);
    // จำลองการ Login
    setTimeout(() => {
      onLogin({
        name: email.split('@')[0],
        email: email,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`
      });
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-6 overflow-hidden">
      {/* Background Decor */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/10 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-600/10 blur-[120px] rounded-full"></div>
      </div>

      <div className="w-full max-w-md relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
        <div className="glass-card p-10 rounded-[40px] border border-white/5 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5">
             <Box size={160} />
          </div>

          <div className="flex flex-col items-center text-center mb-10">
            <div className="w-16 h-16 bg-indigo-600 rounded-[22px] flex items-center justify-center shadow-2xl shadow-indigo-600/30 mb-6">
              <Box size={32} className="text-white" />
            </div>
            <h1 className="text-3xl font-black text-white italic tracking-tighter mb-2">AtomRender</h1>
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-[0.2em] flex items-center gap-2">
              <Cloud size={10} /> Cloud Identity Auth
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-4">GCP Linked Email</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-5 flex items-center text-zinc-500 group-focus-within:text-indigo-400 transition-colors">
                  <Mail size={16} />
                </div>
                <input 
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="yourname@domain.com"
                  className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 pl-12 pr-6 text-sm text-white placeholder:text-zinc-700 outline-none focus:border-indigo-500/30 transition-all shadow-inner"
                />
              </div>
            </div>

            <button 
              disabled={isLoading}
              className="w-full py-4 bg-white text-black rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:bg-zinc-200 transition-all active:scale-95 disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <>Sign In with Identity <ArrowRight size={16} /></>
              )}
            </button>
          </form>

          <div className="mt-10 pt-8 border-t border-white/5 flex flex-col items-center gap-4">
            <div className="flex items-center gap-2 text-[10px] text-zinc-600 font-bold uppercase">
              <ShieldCheck size={12} className="text-emerald-500" /> Secure GCP Gateway v3.1
            </div>
            <p className="text-[9px] text-zinc-700 max-w-[240px] text-center leading-relaxed">
              กรุณาใช้อีเมลที่ผูกกับ API Key ในโปรเจกต์ Google Cloud ของคุณเพื่อสิทธิ์ในการเรนเดอร์ระดับ Pro
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
