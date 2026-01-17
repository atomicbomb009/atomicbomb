
import React, { useState, useEffect } from 'react';
import { 
  Box, 
  History, 
  Key,
  Zap,
  CheckCircle2,
  Cloud,
  Activity,
  Shield,
  LogOut,
  BarChart3,
  Clock
} from 'lucide-react';
import { AppTab, UsageStats } from '../types';

interface SidebarProps {
  currentTab: AppTab;
  setTab: (tab: AppTab) => void;
  onOpenKey: () => void;
  onLogout: () => void;
  isApiActive?: boolean;
  usage: UsageStats;
  user: {
    name: string;
    email: string;
    avatar: string;
    role: string;
  };
}

const Sidebar: React.FC<SidebarProps> = ({ 
  currentTab, 
  setTab,
  onOpenKey,
  onLogout,
  isApiActive,
  usage,
  user
}) => {
  const [hasKey, setHasKey] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const checkKey = async () => {
      const selected = await (window as any).aistudio?.hasSelectedApiKey();
      setHasKey(!!selected);
    };
    checkKey();
    const interval = setInterval(checkKey, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const updateTime = () => {
      const now = Date.now();
      const resetTime = usage.lastReset + (24 * 60 * 60 * 1000);
      const diff = resetTime - now;
      
      if (diff <= 0) {
        setTimeLeft('Resetting...');
        return;
      }
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      setTimeLeft(`${hours}h ${mins}m left`);
    };

    updateTime();
    const timer = setInterval(updateTime, 60000);
    return () => clearInterval(timer);
  }, [usage.lastReset]);

  return (
    <div className="w-64 h-full glass-card flex flex-col border-r border-white/5">
      <div className="p-6 overflow-y-auto no-scrollbar flex-1">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
            <Box size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight italic">AtomRender</h1>
            <div className="flex items-center gap-1.5 text-[8px] text-indigo-400 font-bold uppercase tracking-widest">
              <Cloud size={8} /> GCP Infrastructure
            </div>
          </div>
        </div>

        <nav className="space-y-1 mb-8">
          <SidebarItem icon={<Zap size={16} />} label="Visual Engine" active={currentTab === AppTab.RENDER} onClick={() => setTab(AppTab.RENDER)} />
          <SidebarItem icon={<History size={16} />} label="Usage History" active={currentTab === AppTab.HISTORY} onClick={() => setTab(AppTab.HISTORY)} />
        </nav>

        <div className="space-y-4">
          {/* Daily Resource Monitor */}
          <div className="p-4 bg-zinc-900/50 rounded-2xl border border-white/5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-bold text-zinc-500 uppercase flex items-center gap-1.5">
                <BarChart3 size={10} /> Daily Monitor
              </span>
              <span className="text-[8px] text-zinc-600 flex items-center gap-1">
                <Clock size={8} /> {timeLeft}
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-[10px] mb-1.5">
                  <span className="text-zinc-400">Total Renders</span>
                  <span className="text-white font-mono">{usage.renderCount}</span>
                </div>
                <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-indigo-500 transition-all duration-1000" 
                    style={{ width: `${Math.min(100, (usage.renderCount / 50) * 100)}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[10px] mb-1.5">
                  <span className="text-zinc-400">Total Cost</span>
                  <span className="text-emerald-400 font-mono font-bold">฿{usage.totalCost.toFixed(2)}</span>
                </div>
                <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 transition-all duration-1000" 
                    style={{ width: `${Math.min(100, (usage.totalCost / 500) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {isApiActive && (
            <div className="p-4 bg-indigo-500/10 border border-indigo-500/30 rounded-2xl animate-pulse">
              <div className="flex items-center gap-2 text-[10px] font-bold text-indigo-400 uppercase tracking-widest">
                <Activity size={12} /> API Active
              </div>
              <p className="text-[8px] text-zinc-500 mt-1">Processing request via Google Cloud...</p>
            </div>
          )}

          {/* Connection Status Card */}
          <div className="p-4 bg-zinc-900/50 rounded-2xl border border-white/5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-bold text-zinc-500 uppercase flex items-center gap-1.5">
                <Shield size={10} /> Cloud Connection
              </span>
              <div className={`w-1.5 h-1.5 rounded-full ${hasKey ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-zinc-700'}`}></div>
            </div>
            
            <div 
              onClick={onOpenKey}
              className="group cursor-pointer bg-black/40 p-3 rounded-xl border border-white/5 font-mono text-[10px] flex items-center justify-between hover:border-indigo-500/30 transition-all overflow-hidden"
            >
              <span className={hasKey ? 'text-zinc-400 truncate pr-2' : 'text-zinc-700 italic'}>
                {hasKey ? 'SECURE_CONNECTION_STABLE' : 'LINK_GCP_PROJECT'}
              </span>
              <Key size={12} className={`shrink-0 transition-colors ${hasKey ? 'text-indigo-400 group-hover:text-indigo-300' : 'text-zinc-700'}`} />
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 border-t border-white/5 bg-white/[0.01]">
        <div className="flex items-center justify-between group mb-4">
          <div className="flex items-center gap-3 overflow-hidden">
            <img src={user.avatar} className="w-8 h-8 rounded-lg bg-zinc-800 border border-white/5" alt="Avatar" />
            <div className="overflow-hidden">
              <p className="text-[10px] font-bold text-white truncate capitalize">{user.name}</p>
              <p className="text-[8px] text-zinc-500 truncate">{user.email}</p>
            </div>
          </div>
          <button 
            onClick={onLogout}
            title="Sign Out"
            className="p-2 text-zinc-700 hover:text-red-500 transition-colors"
          >
            <LogOut size={14} />
          </button>
        </div>

        <button 
          onClick={onOpenKey}
          disabled={hasKey}
          className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-[9px] font-bold uppercase border transition-all ${
            hasKey ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400' : 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-500'
          }`}
        >
          {hasKey ? <CheckCircle2 size={12} /> : <Cloud size={12} />}
          {hasKey ? 'Identity Verified' : 'Link Identity Key'}
        </button>
      </div>
    </div>
  );
};

const SidebarItem = ({ icon, label, active, onClick }: { icon: any, label: string, active: boolean, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${
      active ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-zinc-500 hover:text-white hover:bg-white/5'
    }`}
  >
    {icon}
    {label}
  </button>
);

export default Sidebar;
