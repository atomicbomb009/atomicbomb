
import React, { useState } from 'react';
import { Sparkles, Download, RefreshCw, Loader2, Wand2, ImageIcon } from 'lucide-react';
import { generateImageWithGemini } from '../services/geminiService';

const ImageGenerator: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    try {
      const url = await generateImageWithGemini(prompt);
      setGeneratedImages(prev => [url, ...prev]);
    } catch (error) {
      console.error(error);
      alert('ไม่สามารถสร้างรูปภาพได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadImage = (url: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `fast-ai-gen-${Date.now()}.png`;
    link.click();
  };

  return (
    <div className="max-w-4xl mx-auto p-8 h-full flex flex-col pt-12">
      <div className="flex items-center gap-5 mb-12">
        <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-600 rounded-2xl flex items-center justify-center shadow-lg shadow-pink-500/20">
          <Wand2 size={24} className="text-white" />
        </div>
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white">คลังรูปภาพอัจฉริยะ</h2>
          <p className="text-zinc-500">เปลี่ยนคำบรรยายของคุณให้เป็นผลงานศิลปะด้วย Gemini Flash</p>
        </div>
      </div>

      <div className="mb-12">
        <div className="input-glass p-2.5 rounded-[32px] flex items-center gap-2 shadow-2xl group-focus-within:border-pink-500/30">
          <div className="pl-4 text-zinc-500">
            <ImageIcon size={20} />
          </div>
          <input 
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
            placeholder="ลองพิมพ์ 'นักรบไซเบอร์พังค์ในชุดเกราะนีออน'..."
            className="flex-1 bg-transparent border-none focus:ring-0 text-zinc-100 placeholder:text-zinc-700 px-3 py-3 text-lg"
          />
          <button 
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim()}
            className="px-8 py-4 bg-white hover:bg-zinc-200 disabled:bg-zinc-800 disabled:text-zinc-600 text-black rounded-[24px] font-bold transition-all shadow-xl active:scale-95 flex items-center gap-2"
          >
            {isGenerating ? <Loader2 size={20} className="animate-spin" /> : <Sparkles size={20} />}
            {isGenerating ? 'กำลังรังสรรค์...' : 'สร้างภาพ'}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar pb-20">
        {generatedImages.length === 0 && !isGenerating ? (
          <div className="h-80 flex flex-col items-center justify-center border-2 border-dashed border-zinc-800/50 rounded-[40px] text-zinc-700 bg-zinc-900/20">
            <Sparkles size={64} className="mb-6 opacity-10" />
            <p className="text-lg font-medium">เริ่มต้นสร้างสรรค์จินตนาการของคุณ</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {isGenerating && (
              <div className="aspect-square bg-zinc-900/50 rounded-[40px] border border-white/5 flex items-center justify-center flex-col gap-5 animate-pulse overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-t from-pink-500/10 to-transparent"></div>
                <div className="w-16 h-16 bg-pink-500/10 rounded-full flex items-center justify-center">
                  <Loader2 size={32} className="text-pink-500 animate-spin" />
                </div>
                <p className="text-sm font-bold text-pink-500 tracking-[0.3em] uppercase">Processing</p>
              </div>
            )}
            {generatedImages.map((img, i) => (
              <div key={i} className="group relative aspect-square bg-zinc-900 rounded-[40px] border border-white/10 overflow-hidden shadow-2xl transition-all hover:scale-[1.03] hover:shadow-pink-500/5">
                <img src={img} className="w-full h-full object-cover" alt="AI Generated" />
                <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-6 backdrop-blur-sm">
                  <button 
                    onClick={() => downloadImage(img)}
                    className="p-5 bg-white text-black rounded-3xl hover:scale-110 transition-transform shadow-xl"
                    title="ดาวน์โหลด"
                  >
                    <Download size={24} />
                  </button>
                  <button 
                    onClick={() => {
                      setPrompt(prompt);
                      handleGenerate();
                    }}
                    className="p-5 bg-zinc-800 text-white rounded-3xl border border-white/10 hover:scale-110 transition-transform shadow-xl"
                    title="สร้างอีกครั้ง"
                  >
                    <RefreshCw size={24} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageGenerator;
