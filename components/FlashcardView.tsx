
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { WordData } from '../types';
import { generateWordAudio } from '../geminiService';

interface FlashcardViewProps {
  word: WordData;
  index: number;
  total: number;
  onComplete: (mastered: boolean) => void;
  isReview?: boolean;
}

// Helper functions for PCM audio processing
function decodeBase64(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number = 24000,
  numChannels: number = 1,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

const FlashcardView: React.FC<FlashcardViewProps> = ({ word, index, total, onComplete, isReview }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [timeLeft, setTimeLeft] = useState(10);
  const [aiAudioBase64, setAiAudioBase64] = useState<string | null>(null);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [feedback, setFeedback] = useState<'success' | 'fail' | null>(null);
  
  // Lightbox State
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Reusable pronunciation logic
  const playPronunciation = useCallback(async () => {
    if (aiAudioBase64) {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }
      const ctx = audioContextRef.current;
      
      try {
        const bytes = decodeBase64(aiAudioBase64);
        const buffer = await decodeAudioData(bytes, ctx);
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        
        const gainNode = ctx.createGain();
        gainNode.gain.value = 1.2; 
        
        source.connect(gainNode);
        gainNode.connect(ctx.destination);
        source.start(0);
        return;
      } catch (err) {
        console.error("PCM playback failed, falling back to Web Speech", err);
      }
    }

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(word.word);
      utterance.lang = 'en-US';
      utterance.rate = 0.85;
      utterance.pitch = 1.1; 
      window.speechSynthesis.speak(utterance);
    }
  }, [aiAudioBase64, word.word]);

  useEffect(() => {
    setIsFlipped(false);
    setTimeLeft(10);
    setAiAudioBase64(null);
    setFeedback(null);
    setIsLightboxOpen(false);
    
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          setIsFlipped(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    const prefetchAudio = async () => {
      setIsAudioLoading(true);
      const audio = await generateWordAudio(word.word);
      if (audio) setAiAudioBase64(audio);
      setIsAudioLoading(false);
    };
    prefetchAudio();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [word]);

  const handleManualFlip = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimeLeft(0);
    setIsFlipped(true);
  };

  const handleSpeakClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    playPronunciation();
  };

  const handleMastered = () => {
    setFeedback('success');
    playPronunciation();
    setTimeout(() => onComplete(true), 400);
  };

  const handleFailed = () => {
    setFeedback('fail');
    setTimeout(() => onComplete(false), 400);
  };

  // Lightbox handlers
  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.5, 4));
  const handleZoomOut = () => {
    setZoom(prev => {
      const newZoom = Math.max(prev - 0.5, 1);
      if (newZoom === 1) setPosition({ x: 0, y: 0 });
      return newZoom;
    });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom <= 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  return (
    <div className={`w-full flex flex-col items-center space-y-6 animate-in slide-in-from-right duration-300 ${feedback === 'fail' ? 'animate-shake' : ''}`}>
      {/* Progress Header */}
      <div className="w-full flex justify-between items-center text-sm font-semibold text-gray-400">
        <div className="flex items-center gap-2">
          <span>单词: {index + 1} / {total}</span>
          {isReview && <span className="px-2 py-0.5 bg-orange-100 text-orange-600 rounded-md text-xs font-bold uppercase tracking-wider animate-pulse">复习模式</span>}
        </div>
        <div className="flex items-center gap-2">
           <span className={`${timeLeft <= 3 ? 'text-red-500 animate-bounce' : 'text-indigo-600'}`}>
            {timeLeft}s
          </span>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={timeLeft <= 3 ? 'text-red-500' : 'text-indigo-600'}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        </div>
      </div>

      {/* Timer Bar */}
      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className={`h-full transition-all duration-1000 ease-linear ${timeLeft <= 3 ? 'bg-red-500' : 'bg-indigo-500'}`}
          style={{ width: `${(timeLeft / 10) * 100}%` }}
        />
      </div>

      {/* Main Card Container with 3D perspective */}
      <div className="w-full h-[520px] perspective-1000 group">
        <div className={`relative w-full h-full transition-transform duration-700 preserve-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
          
          {/* Front Face */}
          <div className="absolute inset-0 backface-hidden bg-white rounded-3xl shadow-xl border border-gray-100 p-8 flex flex-col items-center justify-between">
            <div className="w-full text-center space-y-4">
              <div className="flex items-center justify-center gap-4">
                  <h2 className="text-5xl font-black text-indigo-900 tracking-tight pl-10">{word.word}</h2>
                  <button 
                    onClick={handleSpeakClick}
                    disabled={isAudioLoading && !aiAudioBase64}
                    className={`p-3 rounded-full transition-all shadow-sm group relative ${
                      isAudioLoading && !aiAudioBase64 
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                        : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100 hover:scale-110 active:scale-90'
                    }`}
                  >
                    {isAudioLoading && !aiAudioBase64 && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-4 h-4 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                      </div>
                    )}
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`${isAudioLoading && !aiAudioBase64 ? 'opacity-0' : 'group-hover:animate-pulse'}`}>
                      <path d="M11 5L6 9H2v6h4l5 4V5z"></path>
                      <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                      <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
                    </svg>
                  </button>
              </div>
              <div className="text-xl text-gray-400 font-mono italic">[{word.phonetic}]</div>
            </div>

            <div className="flex-grow flex flex-col items-center justify-center space-y-6 w-full py-6">
              {word.imageUrl && (
                <div className="relative group cursor-zoom-in" onClick={() => setIsLightboxOpen(true)}>
                  <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
                  <img 
                    src={word.imageUrl} 
                    alt={word.word} 
                    className="relative w-48 h-48 object-contain rounded-2xl bg-white border border-slate-50 shadow-sm" 
                  />
                  <div className="absolute bottom-2 right-2 bg-white/80 backdrop-blur-sm p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-600"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
                  </div>
                </div>
              )}
              <div className="text-center">
                <p className="text-gray-400 text-sm animate-pulse flex items-center justify-center gap-2">
                  <span className="w-2 h-2 bg-indigo-400 rounded-full"></span>
                  10秒极限记忆中...
                </p>
              </div>
              <button 
                onClick={handleManualFlip}
                className="px-8 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full text-sm font-bold transition-all hover:px-10"
              >
                直接查看释义
              </button>
            </div>
          </div>

          {/* Back Face */}
          <div className="absolute inset-0 backface-hidden rotate-y-180 bg-white rounded-3xl shadow-xl border border-gray-100 p-8 flex flex-col items-center justify-between">
            <div className="w-full text-center space-y-1 mb-2">
              <h2 className="text-3xl font-black text-indigo-900 tracking-tight">{word.word}</h2>
              <div className="text-sm text-gray-400 font-mono italic">[{word.phonetic}]</div>
            </div>

            <div className="flex-grow flex flex-col space-y-4 w-full py-1 overflow-y-auto pr-1">
              {/* Translation */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest px-1">中文释义</span>
                <div className="bg-emerald-50 border-l-4 border-emerald-400 p-3 rounded-xl shadow-sm">
                  <p className="text-xl font-bold text-gray-800 leading-tight">{word.translation}</p>
                </div>
              </div>

              {/* Mnemonic */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest px-1">记忆联想</span>
                <div className="bg-indigo-50 border-l-4 border-indigo-400 p-3 rounded-xl shadow-sm">
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {word.mnemonic}
                  </p>
                </div>
              </div>

              {/* Synonyms */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest px-1">同近义词</span>
                <div className="bg-amber-50/50 border-l-4 border-amber-400 p-3 rounded-xl shadow-sm flex flex-wrap gap-2">
                  {word.synonyms.map((syn, i) => (
                    <div key={i} className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-lg border border-amber-100 text-xs shadow-sm">
                      <span className="font-bold text-amber-700">{syn.word}</span>
                      <span className="text-gray-400 italic">/</span>
                      <span className="text-gray-500">{syn.translation}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 3 Examples */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">双语例句 (3)</span>
                <div className="space-y-3 bg-slate-50/50 p-3 rounded-xl border border-slate-100 shadow-sm">
                  {word.examples.map((ex, i) => (
                    <div key={i} className={`space-y-1 ${i !== word.examples.length - 1 ? 'pb-3 border-b border-slate-100' : ''}`}>
                      <p className="text-[13px] text-gray-600 leading-relaxed italic border-l-2 border-slate-200 pl-2">
                        "{ex.en}"
                      </p>
                      <p className="text-[11px] text-gray-400 pl-2">{ex.zh}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="w-full grid grid-cols-2 gap-4 mt-4">
              <button
                onClick={handleFailed}
                className="py-4 rounded-2xl border-2 border-slate-200 text-slate-500 font-bold hover:bg-slate-50 active:bg-slate-100 transition-all flex items-center justify-center gap-2"
              >
                <span>❌ 没记住</span>
              </button>
              <button
                onClick={handleMastered}
                className={`py-4 rounded-2xl bg-green-500 text-white font-bold hover:bg-green-600 shadow-lg shadow-green-100 active:scale-[0.98] transition-all flex items-center justify-center gap-2 ${feedback === 'success' ? 'animate-success-pulse' : ''}`}
              >
                <span>✅ 记住了</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox Modal */}
      {isLightboxOpen && word.imageUrl && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
          <button 
            onClick={() => setIsLightboxOpen(false)}
            className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all z-[110]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
          
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-white/10 backdrop-blur-xl px-6 py-3 rounded-2xl border border-white/20 z-[110]">
            <button onClick={handleZoomOut} className="p-2 hover:bg-white/10 text-white rounded-lg transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>
            </button>
            <span className="text-white font-bold min-w-[3rem] text-center">{Math.round(zoom * 100)}%</span>
            <button onClick={handleZoomIn} className="p-2 hover:bg-white/10 text-white rounded-lg transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            </button>
          </div>

          <div 
            className="relative w-full h-full flex items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <img 
              src={word.imageUrl} 
              alt={word.word} 
              className="max-w-[90%] max-h-[80%] object-contain select-none pointer-events-none transition-transform duration-100 ease-out"
              style={{
                transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
              }}
            />
          </div>
          
          <div className="absolute top-10 left-10 text-white/50 space-y-1 pointer-events-none">
            <h3 className="text-2xl font-black text-white">{word.word}</h3>
            <p className="text-sm italic">Visual Mnemonic Illustration</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default FlashcardView;
