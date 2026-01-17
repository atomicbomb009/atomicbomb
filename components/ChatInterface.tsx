
import React, { useState, useRef, useEffect } from 'react';
import { Send, Image as ImageIcon, X, Loader2, Sparkles, User, BrainCircuit, Paperclip } from 'lucide-react';
import { Message, ChatSession, Attachment } from '../types';
import { chatWithGemini } from '../services/geminiService';

interface ChatInterfaceProps {
  session: ChatSession;
  updateSession: (messages: Message[]) => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ session, updateSession }) => {
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [session.messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim() && attachments.length === 0) return;
    if (isTyping) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      attachments: attachments.length > 0 ? [...attachments] : undefined,
      timestamp: Date.now(),
    };

    const newMessages = [...session.messages, userMessage];
    updateSession(newMessages);
    setInput('');
    setAttachments([]);
    setIsTyping(true);

    try {
      const assistantMessageId = (Date.now() + 1).toString();
      const assistantMessage: Message = {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
      };

      const finalMessages = [...newMessages, assistantMessage];
      updateSession(finalMessages);

      await chatWithGemini(newMessages, (textChunk) => {
        const updatedMsgs = [...newMessages, { ...assistantMessage, content: textChunk }];
        updateSession(updatedMsgs);
      });
    } catch (error) {
      console.error(error);
      const errorMsg: Message = {
        id: (Date.now() + 2).toString(),
        role: 'system',
        content: 'ขออภัย เกิดข้อผิดพลาดในการประมวลผล กรุณาลองใหม่อีกครั้ง',
        timestamp: Date.now(),
      };
      updateSession([...newMessages, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        const newAttachment: Attachment = {
          type: 'image',
          url: URL.createObjectURL(file),
          base64: base64,
          mimeType: file.type
        };
        setAttachments(prev => [...prev, newAttachment]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="flex flex-col h-full relative overflow-hidden">
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 pt-8 pb-40 no-scrollbar"
      >
        <div className="max-w-3xl mx-auto w-full space-y-10">
          {session.messages.length === 0 ? (
            <div className="h-full py-20 flex flex-col items-center justify-center text-center space-y-6 animate-in fade-in zoom-in duration-700">
              <div className="relative">
                <div className="absolute -inset-4 bg-indigo-500/20 blur-2xl rounded-full"></div>
                <div className="relative p-6 bg-zinc-900 border border-white/5 rounded-3xl">
                  <Sparkles className="text-indigo-500 w-12 h-12" />
                </div>
              </div>
              <div>
                <h2 className="text-4xl font-bold tracking-tight mb-3">สวัสดี มีอะไรให้ช่วยไหม?</h2>
                <p className="text-zinc-500 text-lg max-w-md mx-auto leading-relaxed">
                  ผมคือ Fast AI พร้อมช่วยคุณหาคำตอบ เขียนโค้ด หรือสร้างสรรค์ไอเดียใหม่ๆ
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full pt-8">
                <SuggestionCard title="วางแผนเที่ยว" text="ขอแผนเที่ยวเชียงใหม่ 3 วัน เน้นคาเฟ่" onClick={setInput} />
                <SuggestionCard title="ช่วยเขียนโค้ด" text="เขียน Python ดึงราคาทองคำวันนี้" onClick={setInput} />
                <SuggestionCard title="สรุปเนื้อหา" text="สรุปแนวคิดของหนังสือ Atomic Habits" onClick={setInput} />
                <SuggestionCard title="ไอเดียของขวัญ" text="ของขวัญวันเกิดให้เพื่อนที่ชอบถ่ายรูป" onClick={setInput} />
              </div>
            </div>
          ) : (
            session.messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`flex gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 ${
                  msg.role === 'user' ? 'flex-row-reverse' : ''
                }`}
              >
                <div className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 border ${
                  msg.role === 'user' 
                  ? 'bg-zinc-800 border-white/10' 
                  : 'bg-indigo-600/10 border-indigo-500/20'
                }`}>
                  {msg.role === 'user' ? <User size={18} className="text-zinc-300" /> : <BrainCircuit size={18} className="text-indigo-400" />}
                </div>
                <div className={`flex flex-col gap-3 max-w-[85%] ${msg.role === 'user' ? 'items-end' : ''}`}>
                  {msg.attachments && (
                    <div className="flex flex-wrap gap-2">
                      {msg.attachments.map((att, i) => (
                        <div key={i} className="rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
                          <img 
                            src={att.url} 
                            className="max-h-80 object-cover" 
                            alt="ไฟล์แนบ" 
                          />
                        </div>
                      ))}
                    </div>
                  )}
                  <div className={`px-5 py-3.5 rounded-3xl whitespace-pre-wrap leading-relaxed text-[15px] ${
                    msg.role === 'user' 
                      ? 'bg-indigo-600 text-white font-medium shadow-lg shadow-indigo-500/20' 
                      : msg.role === 'system'
                        ? 'bg-red-900/10 text-red-400 border border-red-500/20 italic'
                        : 'text-zinc-200'
                  }`}>
                    {msg.content || (isTyping && msg.role === 'assistant' ? 'กำลังประมวลผล...' : '')}
                  </div>
                </div>
              </div>
            ))
          )}
          {isTyping && session.messages[session.messages.length - 1]?.role !== 'assistant' && (
            <div className="flex gap-6">
              <div className="w-9 h-9 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center">
                <Loader2 size={18} className="text-indigo-400 animate-spin" />
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:-.3s]"></div>
                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:-.5s]"></div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 pointer-events-none">
        <div className="max-w-3xl mx-auto w-full pointer-events-auto">
          {attachments.length > 0 && (
            <div className="flex gap-3 p-4 bg-zinc-900/80 backdrop-blur-xl rounded-t-3xl border-t border-l border-r border-white/10 animate-in slide-in-from-bottom-2">
              {attachments.map((att, i) => (
                <div key={i} className="relative group shrink-0">
                  <img src={att.url} className="w-20 h-20 object-cover rounded-xl border border-white/10 shadow-lg" />
                  <button 
                    onClick={() => removeAttachment(i)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg hover:bg-red-600 transition-colors"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className={`input-glass transition-all duration-300 shadow-2xl ${
            attachments.length > 0 ? 'rounded-b-3xl' : 'rounded-[32px]'
          } flex items-end p-2 gap-2 group-focus-within:border-indigo-500/50`}>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              multiple 
              accept="image/*"
              onChange={handleFileChange}
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="p-4 text-zinc-400 hover:text-white transition-colors"
              title="แนบไฟล์"
            >
              <Paperclip size={22} />
            </button>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="ถามอะไรก็ได้..."
              className="flex-1 bg-transparent border-none focus:ring-0 text-zinc-100 placeholder:text-zinc-600 py-4 resize-none max-h-48 text-[16px] leading-relaxed"
              rows={1}
            />
            <button 
              onClick={handleSend}
              disabled={isTyping || (!input.trim() && attachments.length === 0)}
              className="m-1.5 p-3.5 bg-indigo-600 disabled:bg-zinc-800 disabled:text-zinc-500 text-white rounded-2xl transition-all hover:scale-105 active:scale-95 shadow-lg shadow-indigo-600/20"
            >
              {isTyping ? <Loader2 size={22} className="animate-spin" /> : <Send size={22} />}
            </button>
          </div>
          <p className="text-[11px] text-center mt-4 text-zinc-500 font-medium">
            Fast AI 1.3 | ขับเคลื่อนด้วย Gemini 3 Flash
          </p>
        </div>
      </div>
    </div>
  );
};

const SuggestionCard = ({ title, text, onClick }: { title: string, text: string, onClick: (t: string) => void }) => (
  <button 
    onClick={() => onClick(text)}
    className="group p-5 text-left glass rounded-3xl hover:bg-white/[0.03] transition-all border border-white/5 hover:border-white/10 hover:shadow-xl hover:shadow-indigo-500/5"
  >
    <div className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-2 group-hover:text-indigo-300 transition-colors">{title}</div>
    <p className="text-sm text-zinc-400 group-hover:text-zinc-200 transition-colors leading-relaxed">{text}</p>
  </button>
);

export default ChatInterface;
