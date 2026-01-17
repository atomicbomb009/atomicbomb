
import React, { useState, useRef, useEffect } from 'react';
import { Upload, Sparkles, Download, Loader2, Box, Wand2, ArrowLeftRight, Eraser, Paintbrush, X, Layout, Shield, Zap, AlertCircle } from 'lucide-react';
import { RenderSize, RenderHistoryItem, AspectRatio, ModelTier, UsageStats } from '../types';
import { renderWithGemini, editImageWithGemini } from '../services/geminiService';

interface RenderInterfaceProps {
  onAddHistory: (item: RenderHistoryItem) => void;
  setApiStatus?: (active: boolean) => void;
  usage: UsageStats;
}

const FREE_DAILY_LIMIT = 5; // จำกัด 5 ภาพต่อวันสำหรับสายฟรี

const RenderInterface: React.FC<RenderInterfaceProps> = ({ 
  onAddHistory, 
  setApiStatus,
  usage
}) => {
  const [sketch, setSketch] = useState<{ url: string; base64: string; type: string } | null>(null);
  const [prompt, setPrompt] = useState('');
  const [editPrompt, setEditPrompt] = useState('');
  const [size, setSize] = useState<RenderSize>('Full HD');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
  const [modelTier, setModelTier] = useState<ModelTier>('free');
  const [isRendering, setIsRendering] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [result, setResult] = useState<{ url: string; base64: string; cost: number } | null>(null);
  const [editMode, setEditMode] = useState<boolean>(false);
  
  const [brushSize, setBrushSize] = useState(40);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<'brush' | 'eraser'>('brush');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // เมื่อเปลี่ยน Tier เป็น Free ให้ปรับ Resolution ลงมาที่ Full HD อัตโนมัติถ้าเลือกตัวสูงไว้
  useEffect(() => {
    if (modelTier === 'free' && (size === '1K' || size === '2K' || size === '4K')) {
      setSize('Full HD');
    }
  }, [modelTier]);

  // จำลองโครงสร้างราคา GCP
  const calculateCost = (targetSize: RenderSize, isEdit: boolean = false): number => {
    if (modelTier === 'free') return 0; // Basic Tier ฟรีเสมอ

    let base = 1.45; 
    switch (targetSize) {
      case 'Mini HD': base = 0.50; break;
      case 'Full HD': base = 1.45; break;
      case '1K': base = 2.15; break;
      case '2K': base = 4.25; break;
      case '4K': base = 8.50; break;
    }
    return isEdit ? base * 0.5 : base;
  };

  const currentEstimatedCost = calculateCost(size, editMode);
  const isFreeLimitReached = modelTier === 'free' && usage.renderCount >= FREE_DAILY_LIMIT;

  useEffect(() => {
    const updateCanvasSize = () => {
      if (editMode && canvasRef.current && containerRef.current) {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        canvas.width = container.offsetWidth;
        canvas.height = container.offsetHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
        }
      }
    };
    const timer = setTimeout(updateCanvasSize, 100);
    window.addEventListener('resize', updateCanvasSize);
    return () => {
      window.removeEventListener('resize', updateCanvasSize);
      clearTimeout(timer);
    };
  }, [editMode, result, aspectRatio]);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (!editMode || !canvasRef.current) return;
    setIsDrawing(true);
    draw(e);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : (e as React.MouseEvent).clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : (e as React.MouseEvent).clientY - rect.top;
    ctx.lineWidth = brushSize;
    ctx.globalCompositeOperation = tool === 'brush' ? 'source-over' : 'destination-out';
    ctx.strokeStyle = 'rgba(99, 102, 241, 0.6)'; 
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    canvasRef.current?.getContext('2d')?.beginPath();
  };

  const clearMask = () => {
    if (!canvasRef.current) return;
    canvasRef.current.getContext('2d')?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setSketch({
        url: URL.createObjectURL(file),
        base64: (reader.result as string).split(',')[1],
        type: file.type
      });
      setResult(null);
      setEditMode(false);
    };
    reader.readAsDataURL(file);
  };

  const handleRender = async () => {
    if (!sketch || isRendering) return;
    if (isFreeLimitReached) return alert(`คุณใช้งานครบโควตาฟรี ${FREE_DAILY_LIMIT} ภาพต่อวันแล้ว กรุณาอัปเกรดเป็น Pro หรือรอรีเซ็ตในวันถัดไป`);

    setIsRendering(true);
    setApiStatus?.(true);
    try {
      const renderedUrl = await renderWithGemini(
        prompt || 'Architectural render', 
        sketch.base64, 
        sketch.type, 
        size,
        aspectRatio,
        modelTier
      );
      const cost = calculateCost(size);
      setResult({ url: renderedUrl, base64: renderedUrl.split(',')[1], cost });
      onAddHistory({
        id: Date.now().toString(),
        prompt: prompt || 'Render',
        size: size,
        imageUrl: renderedUrl,
        timestamp: Date.now(),
        cost: cost,
        aspectRatio: aspectRatio,
        modelTier: modelTier
      });
    } catch (error: any) {
      alert('Error: ' + error.message);
    } finally {
      setIsRendering(false);
      setApiStatus?.(false);
    }
  };

  const handleSmartEdit = async () => {
    if (!result || !editPrompt || isEditing) return;
    if (isFreeLimitReached) return alert('โควตาฟรีของคุณหมดลงแล้ว');

    setIsEditing(true);
    setApiStatus?.(true);
    try {
      let maskBase64: string | undefined = undefined;
      if (canvasRef.current) {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvasRef.current.width;
        tempCanvas.height = canvasRef.current.height;
        const tempCtx = tempCanvas.getContext('2d');
        if (tempCtx) {
          tempCtx.fillStyle = 'black';
          tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
          tempCtx.drawImage(canvasRef.current, 0, 0);
          const imgData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
          for (let i = 0; i < imgData.data.length; i += 4) {
            const isMasked = imgData.data[i + 3] > 0;
            imgData.data[i] = isMasked ? 255 : 0;
            imgData.data[i + 1] = isMasked ? 255 : 0;
            imgData.data[i + 2] = isMasked ? 255 : 0;
            imgData.data[i + 3] = 255;
          }
          tempCtx.putImageData(imgData, 0, 0);
          maskBase64 = tempCanvas.toDataURL('image/png').split(',')[1];
        }
      }
      const updatedUrl = await editImageWithGemini(result.base64, 'image/jpeg', editPrompt, maskBase64, aspectRatio);
      const cost = calculateCost(size, true);
      setResult({ url: updatedUrl, base64: updatedUrl.split(',')[1], cost });
      onAddHistory({
        id: Date.now().toString(),
        prompt: `[Edit] ${editPrompt}`,
        size: size,
        imageUrl: updatedUrl,
        timestamp: Date.now(),
        cost: cost,
        aspectRatio: aspectRatio,
        modelTier: modelTier
      });
      setEditPrompt('');
      clearMask();
    } catch (error: any) {
      alert('Error: ' + error.message);
    } finally {
      setIsEditing(false);
      setApiStatus?.(false);
    }
  };

  const aspectRatioClass = aspectRatio === '16:9' ? 'aspect-video' : 'aspect-[4/3]';

  return (
    <div className="max-w-7xl mx-auto p-8 flex flex-col h-full overflow-y-auto no-scrollbar pb-24">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-2xl font-bold text-white italic">Cloud Vision Console</h2>
            <div className="flex bg-zinc-900 border border-white/5 p-1 rounded-xl gap-1">
              <button onClick={() => setModelTier('free')} className={`px-3 py-1 text-[8px] font-bold uppercase rounded-lg transition-all ${modelTier === 'free' ? 'bg-zinc-100 text-black shadow-lg' : 'text-zinc-500'}`}><Zap size={10} /> Basic (Free)</button>
              <button onClick={() => setModelTier('pro')} className={`px-3 py-1 text-[8px] font-bold uppercase rounded-lg transition-all ${modelTier === 'pro' ? 'bg-emerald-600 text-white shadow-lg' : 'text-zinc-500'}`}><Shield size={10} /> Pro</button>
            </div>
          </div>
          <p className="text-zinc-500 text-xs italic">Architectural Intelligence Engine (Connected to GCP)</p>
        </div>
        
        {modelTier === 'free' && (
          <div className="px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-center gap-3">
             <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Free Daily Quota</div>
             <div className="flex items-center gap-1.5">
                {[...Array(FREE_DAILY_LIMIT)].map((_, i) => (
                  <div key={i} className={`w-1.5 h-1.5 rounded-full ${i < usage.renderCount ? 'bg-zinc-800' : 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.4)]'}`}></div>
                ))}
             </div>
             <span className="text-[10px] font-mono text-zinc-500">{usage.renderCount}/{FREE_DAILY_LIMIT}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1">
        <div className="lg:col-span-4 space-y-6">
          {result && (
            <div className="flex p-1 bg-zinc-900 rounded-xl border border-white/5">
              <button onClick={() => setEditMode(false)} className={`flex-1 py-2 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all ${!editMode ? 'bg-zinc-800 text-white' : 'text-zinc-600'}`}>New Space</button>
              <button onClick={() => setEditMode(true)} className={`flex-1 py-2 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all ${editMode ? 'bg-indigo-600 text-white' : 'text-zinc-600'}`}>Cloud Edit</button>
            </div>
          )}

          {!editMode ? (
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest flex items-center justify-between">
                  <span className="flex items-center gap-2"><Box size={10} /> 1. Sketch Source</span>
                  <div className="flex bg-zinc-900 rounded p-0.5 border border-white/5">
                    {(['16:9', '4:3'] as AspectRatio[]).map(r => (
                      <button key={r} onClick={() => { setAspectRatio(r); setResult(null); }} className={`px-2 py-0.5 text-[7px] font-bold rounded transition-all ${aspectRatio === r ? 'bg-white text-black' : 'text-zinc-500'}`}>{r}</button>
                    ))}
                  </div>
                </label>
                <div onClick={() => fileInputRef.current?.click()} className={`w-full glass-card border-2 border-dashed border-zinc-800 rounded-[24px] flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500/50 transition-all group overflow-hidden relative bg-black ${aspectRatioClass}`}>
                  {!sketch ? (
                    <>
                      <Upload size={20} className="text-indigo-500 mb-2 group-hover:scale-110 transition-transform" />
                      <p className="text-zinc-500 font-bold text-[8px] uppercase tracking-widest">Select Image</p>
                    </>
                  ) : (
                    <img src={sketch.url} className="w-full h-full object-cover" />
                  )}
                  {sketch && <button onClick={(e) => { e.stopPropagation(); setSketch(null); setResult(null); }} className="absolute top-2 right-2 p-1.5 bg-red-500/80 text-white rounded-lg hover:bg-red-600 z-10"><X size={12} /></button>}
                </div>
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
              </div>

              <div className="space-y-3">
                <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2"><Sparkles size={10} /> 2. Style Prompt</label>
                <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Modern architectural style, realistic materials..." className="w-full h-24 bg-zinc-900 border border-white/5 rounded-[18px] p-4 text-white placeholder:text-zinc-700 text-xs outline-none focus:border-indigo-500/30 transition-colors resize-none shadow-inner" />
              </div>

              <div className="space-y-3 animate-in slide-in-from-top-2 duration-300">
                <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2"><ArrowLeftRight size={10} /> 3. Quality & Resolution</label>
                <div className="grid grid-cols-5 gap-1.5">
                  {(['Mini HD', 'Full HD', '1K', '2K', '4K'] as RenderSize[]).map((s) => {
                    const isRestricted = modelTier === 'free' && (s === '1K' || s === '2K' || s === '4K');
                    return (
                      <button 
                        key={s} 
                        disabled={isRestricted}
                        onClick={() => setSize(s)} 
                        className={`py-2 rounded-lg font-bold border transition-all flex flex-col items-center justify-center gap-0.5 relative ${
                          isRestricted ? 'opacity-30 grayscale cursor-not-allowed' :
                          size === s ? 'bg-white border-white text-zinc-950 shadow-lg' : 'bg-zinc-900 border-white/5 text-zinc-600 hover:text-zinc-400'
                        }`}
                      >
                        <span className="text-[8px]">{s}</span>
                        {isRestricted && <Shield size={8} className="absolute -top-1 -right-1 text-emerald-500" />}
                      </button>
                    );
                  })}
                </div>
                {modelTier === 'free' && (
                  <p className="text-[8px] text-emerald-500 flex items-center gap-1 mt-1 font-bold uppercase tracking-wider">
                    <Shield size={8} /> Pro Tier required for 1K-4K resolution
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
               <div className="p-5 bg-indigo-500/5 border border-indigo-500/10 rounded-[24px] space-y-5">
                  <div className="flex items-center justify-between text-indigo-400 font-bold text-[10px] uppercase tracking-widest"><Paintbrush size={12} /> Mask Tool <button onClick={clearMask} className="text-[8px] text-zinc-500 hover:text-white transition-colors">Clear</button></div>
                  <div className="flex gap-2">
                    <button onClick={() => setTool('brush')} className={`flex-1 py-2 rounded-lg text-[9px] font-bold uppercase ${tool === 'brush' ? 'bg-indigo-600 text-white' : 'bg-zinc-950 text-zinc-700'}`}>Brush</button>
                    <button onClick={() => setTool('eraser')} className={`flex-1 py-2 rounded-lg text-[9px] font-bold uppercase ${tool === 'eraser' ? 'bg-red-600 text-white' : 'bg-zinc-950 text-zinc-700'}`}>Eraser</button>
                  </div>
                  <input type="range" min="5" max="150" value={brushSize} onChange={(e) => setBrushSize(parseInt(e.target.value))} className="w-full h-1 bg-zinc-800 rounded-full appearance-none cursor-pointer accent-indigo-500" />
                  <textarea value={editPrompt} onChange={(e) => setEditPrompt(e.target.value)} placeholder="Edit description..." className="w-full h-20 bg-zinc-950 border border-white/5 rounded-[14px] p-3 text-white text-xs outline-none focus:border-indigo-500/30 resize-none shadow-inner" />
               </div>
            </div>
          )}

          <div className="pt-6 border-t border-white/5">
            <button 
              onClick={editMode ? handleSmartEdit : handleRender}
              disabled={(!sketch && !editMode) || isRendering || isEditing || isFreeLimitReached}
              className={`w-full py-5 rounded-[24px] font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all active:scale-[0.98] ${
                isFreeLimitReached
                  ? 'bg-zinc-900 text-zinc-800 cursor-not-allowed border border-red-500/20'
                  : modelTier === 'pro' 
                    ? 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-xl shadow-emerald-600/20' 
                    : 'bg-white text-black hover:bg-zinc-200 shadow-xl shadow-white/10'
              }`}
            >
              {isFreeLimitReached ? (
                <><AlertCircle size={16} /> Daily Limit Reached</>
              ) : (isRendering || isEditing) ? (
                <Loader2 size={16} className="animate-spin" />
              ) : editMode ? (
                <><Wand2 size={16} /> Cloud Sync Edit</>
              ) : (
                <><Sparkles size={16} /> RENDER IMAGE</>
              )}
            </button>
            <div className="mt-4 flex flex-col items-center">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Estimated Processing Cost</span>
              <span className={`text-sm font-mono font-bold ${modelTier === 'free' ? 'text-emerald-400' : 'text-white'}`}>
                {modelTier === 'free' ? 'FREE ฿0.00' : `฿${currentEstimatedCost.toFixed(2)}`}
              </span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-8 flex flex-col h-full">
          <div className="flex-1 flex items-center justify-center">
            <div 
              ref={containerRef}
              className={`glass-card rounded-[32px] border border-white/5 relative overflow-hidden group w-full bg-black shadow-2xl flex items-center justify-center transition-all duration-500 ${aspectRatioClass} ${editMode ? 'cursor-crosshair' : ''}`}
              onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing} onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={stopDrawing}
            >
              {(isRendering || isEditing) ? (
                <div className="flex flex-col items-center gap-4 animate-in zoom-in-95 text-center px-10">
                  <div className="relative">
                     <div className="absolute -inset-4 bg-indigo-500/20 blur-xl rounded-full animate-pulse"></div>
                     <Loader2 size={40} className="text-indigo-500 animate-spin relative" />
                  </div>
                  <div>
                    <p className="text-[8px] text-zinc-500 uppercase font-black tracking-[0.4em] italic mb-1">Architectural Engine v3.5</p>
                    <p className="text-[10px] text-white/60 font-medium">Synthesizing frames via {modelTier === 'pro' ? 'Pro GPU Cluster' : 'GCP Shared Instances'}...</p>
                  </div>
                </div>
              ) : result ? (
                <div className="w-full h-full relative flex items-center justify-center animate-in fade-in duration-700">
                  <img src={result.url} className="w-full h-full object-cover select-none" alt="Output" />
                  {editMode && <canvas ref={canvasRef} className="absolute inset-0 z-10 w-full h-full pointer-events-auto" />}
                  
                  {/* Floating Cost Indicator */}
                  <div className="absolute top-6 left-6 px-3 py-1.5 bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl text-[10px] font-bold text-white uppercase tracking-widest z-20">
                    Rendered at: {result.cost === 0 ? 'FREE' : `฿${result.cost.toFixed(2)}`}
                  </div>

                  <div className={`absolute bottom-6 right-6 flex gap-3 z-20 transition-opacity duration-300 ${isDrawing ? 'opacity-0' : 'opacity-100'}`}>
                    <button onClick={() => { const link = document.createElement('a'); link.href = result.url; link.download = `atom-${Date.now()}.jpg`; link.click(); }} className="p-3 bg-white text-black rounded-xl shadow-2xl hover:scale-105 transition-all"><Download size={20} /></button>
                  </div>
                </div>
              ) : (
                <div className="text-center opacity-10 flex flex-col items-center animate-in fade-in duration-500">
                   <Layout size={100} className="mb-4 stroke-[0.5]" />
                   <p className="text-[9px] font-black uppercase tracking-[1em] text-white">Cloud Viewport</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RenderInterface;
