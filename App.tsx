
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import RenderInterface from './components/RenderInterface';
import LoginScreen from './components/LoginScreen';
import { AppTab, RenderHistoryItem, UsageStats } from './types';
import { Download } from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.RENDER);
  const [history, setHistory] = useState<RenderHistoryItem[]>([]);
  const [isApiActive, setIsApiActive] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<{name: string, email: string, avatar: string} | null>(null);
  
  const [usage, setUsage] = useState<UsageStats>({
    renderCount: 0,
    totalCost: 0,
    lastReset: Date.now()
  });

  useEffect(() => {
    const savedHistory = localStorage.getItem('atomrender_history');
    if (savedHistory) setHistory(JSON.parse(savedHistory));

    const savedUser = localStorage.getItem('atomrender_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
      setIsLoggedIn(true);
    }

    const savedUsage = localStorage.getItem('atomrender_usage');
    if (savedUsage) {
      const parsedUsage: UsageStats = JSON.parse(savedUsage);
      const now = Date.now();
      const twentyFourHours = 24 * 60 * 60 * 1000;
      
      // ตรวจสอบว่าครบรอบ 24 ชม. หรือยัง
      if (now - parsedUsage.lastReset > twentyFourHours) {
        const newUsage = { renderCount: 0, totalCost: 0, lastReset: now };
        setUsage(newUsage);
        localStorage.setItem('atomrender_usage', JSON.stringify(newUsage));
      } else {
        setUsage(parsedUsage);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('atomrender_history', JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    localStorage.setItem('atomrender_usage', JSON.stringify(usage));
  }, [usage]);

  const handleLogin = (userData: {name: string, email: string, avatar: string}) => {
    setUser(userData);
    setIsLoggedIn(true);
    localStorage.setItem('atomrender_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUser(null);
    localStorage.removeItem('atomrender_user');
  };

  const handleAddHistory = (item: RenderHistoryItem) => {
    setHistory(prev => [item, ...prev]);
    setUsage(prev => ({
      ...prev,
      renderCount: prev.renderCount + 1,
      totalCost: prev.totalCost + item.cost
    }));
  };

  if (!isLoggedIn) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-screen overflow-hidden animate-in fade-in duration-700">
      <Sidebar 
        currentTab={activeTab} 
        setTab={setActiveTab}
        onOpenKey={() => (window as any).aistudio?.openSelectKey()}
        onLogout={handleLogout}
        isApiActive={isApiActive}
        usage={usage}
        user={user!}
      />
      
      <main className="flex-1 flex flex-col min-w-0">
        {activeTab === AppTab.RENDER && (
          <RenderInterface 
            onAddHistory={handleAddHistory} 
            setApiStatus={setIsApiActive}
            usage={usage}
          />
        )}
        
        {activeTab === AppTab.HISTORY && (
          <div className="flex-1 p-10 overflow-y-auto no-scrollbar">
            <div className="max-w-6xl mx-auto">
              <div className="flex items-center justify-between mb-10">
                <div>
                  <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">Render History</h2>
                  <div className="flex items-center gap-4 text-zinc-500">
                    <p>ประวัติการสร้างผลงานทั้งหมด</p>
                    <div className="h-4 w-[1px] bg-zinc-800"></div>
                    <span className="text-indigo-400 font-bold uppercase text-[10px] tracking-widest">{history.length} Renders</span>
                  </div>
                </div>
              </div>

              {history.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center border border-zinc-800 rounded-[32px] text-zinc-600 italic">
                  No renders yet
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
                  {history.map((item) => (
                    <div key={item.id} className="glass-card rounded-[24px] overflow-hidden border border-white/5 flex flex-col group transition-all hover:border-white/10">
                      <div className="aspect-video relative overflow-hidden">
                        <img src={item.imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        <div className="absolute top-3 right-3 px-2 py-1 bg-black/60 backdrop-blur-md rounded-lg text-[10px] font-bold text-white border border-white/10 uppercase">
                          {item.cost === 0 ? 'FREE' : `฿${item.cost?.toFixed(2)}`}
                        </div>
                      </div>
                      <div className="p-5 flex-1">
                        <div className="text-[9px] text-zinc-500 font-mono mb-2">{new Date(item.timestamp).toLocaleString('th-TH')}</div>
                        <p className="text-xs text-zinc-400 line-clamp-2 italic mb-4">"{item.prompt}"</p>
                        <button 
                          onClick={() => {
                            const a = document.createElement('a');
                            a.href = item.imageUrl;
                            a.download = `render-${item.id}.jpg`;
                            a.click();
                          }}
                          className="w-full py-2 bg-white text-black rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2"
                        >
                          <Download size={12} /> Download
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
