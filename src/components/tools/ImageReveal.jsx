import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Image as ImageIcon, Upload, Play, RotateCcw, 
  ChevronLeft, ChevronRight, Eye, Zap, Settings2,
  Maximize2, Grid, Layers, Sparkles
} from 'lucide-react';

const REVEAL_EFFECTS = [
  { id: 'blur', label: 'Soft Blur', icon: Sparkles },
  { id: 'grid', label: 'Mosaic Grid', icon: Grid },
  { id: 'pixel', label: 'Pixelate', icon: Layers }
];

export const ImageReveal = () => {
  const [images, setImages] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [mode, setMode] = useState('reveal'); // 'reveal' or 'lightsOut'
  const [revealEffect, setRevealEffect] = useState('blur');
  const [progress, setProgress] = useState(0);
  const [isRevealing, setIsRevealing] = useState(false);
  const [showSettings, setShowSettings] = useState(true);
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
  const [gridState, setGridState] = useState([]);
  
  const containerRef = useRef(null);
  const revealTimerRef = useRef(null);

  // Handle Image Upload
  const handleUpload = (e) => {
    const files = Array.from(e.target.files);
    const newImages = files.map(file => URL.createObjectURL(file));
    setImages(prev => [...prev, ...newImages]);
    if (images.length === 0) setCurrentIndex(0);
  };

  // Initialize Grid for Grid Reveal
  useEffect(() => {
    if (revealEffect === 'grid') {
      const size = 10; // 10x10 grid
      setGridState(Array(size * size).fill(true));
    }
  }, [revealEffect, currentIndex]);

  // Handle Reveal Animation
  useEffect(() => {
    if (isRevealing && mode === 'reveal') {
      const duration = 20000; // 20 seconds
      const intervalTime = 100;
      const step = (intervalTime / duration) * 100;

      revealTimerRef.current = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            setIsRevealing(false);
            clearInterval(revealTimerRef.current);
            return 100;
          }
          return prev + step;
        });

        if (revealEffect === 'grid') {
          setGridState(prev => {
            const next = [...prev];
            const hiddenIndices = next.map((v, i) => v ? i : -1).filter(i => i !== -1);
            if (hiddenIndices.length > 0) {
              const toReveal = Math.ceil(hiddenIndices.length * (step / (100 - progress || 1)));
              for (let i = 0; i < toReveal; i++) {
                const rand = Math.floor(Math.random() * hiddenIndices.length);
                next[hiddenIndices[rand]] = false;
                hiddenIndices.splice(rand, 1);
              }
            }
            return next;
          });
        }
      }, intervalTime);
    } else {
      clearInterval(revealTimerRef.current);
    }

    return () => clearInterval(revealTimerRef.current);
  }, [isRevealing, mode, revealEffect]);

  const toggleReveal = () => {
    if (progress >= 100) {
      resetReveal();
    } else {
      const nextState = !isRevealing;
      setIsRevealing(nextState);
      if (nextState) setShowSettings(false);
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const resetReveal = () => {
    setIsRevealing(false);
    setProgress(0);
    if (revealEffect === 'grid') {
      setGridState(Array(100).fill(true));
    }
  };

  const handleMouseMove = (e) => {
    if (mode !== 'lightsOut' || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMousePos({ x, y });
  };

  const removeImage = (idx) => {
    setImages(prev => prev.filter((_, i) => i !== idx));
    if (currentIndex >= images.length - 1) setCurrentIndex(Math.max(0, images.length - 2));
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 h-full flex flex-col gap-6">
      {/* Header & Mode Selector */}
      <div className="bg-white rounded-[2.5rem] p-6 shadow-xl border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-indigo-50 rounded-2xl text-indigo-600">
            <Eye size={32} />
          </div>
          <div>
            <h2 className="text-3xl font-black text-slate-800 tracking-tight">Image Reveal</h2>
            <p className="text-slate-400 text-sm font-medium italic">Mystery images for classroom engagement.</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
            <button
              onClick={() => { setMode('reveal'); resetReveal(); }}
              className={`px-6 py-2.5 rounded-xl font-black text-sm transition-all flex items-center gap-2 ${
                mode === 'reveal' ? 'bg-white text-indigo-600 shadow-md scale-105' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Zap size={16} />
              REVEAL
            </button>
            <button
              onClick={() => { setMode('lightsOut'); resetReveal(); }}
              className={`px-6 py-2.5 rounded-xl font-black text-sm transition-all flex items-center gap-2 ${
                mode === 'lightsOut' ? 'bg-white text-indigo-600 shadow-md scale-105' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Maximize2 size={16} />
              LIGHTS OUT
            </button>
          </div>
          
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-3 rounded-2xl transition-all ${
              showSettings ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
            }`}
          >
            <Settings2 size={24} />
          </button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 min-h-0 transition-all duration-500">
        {/* Main Display */}
        <div className={`flex flex-col gap-6 transition-all duration-500 ${showSettings ? 'lg:col-span-8' : 'lg:col-span-12'}`}>
          <div 
            ref={containerRef}
            onMouseMove={handleMouseMove}
            className="flex-1 bg-slate-900 rounded-[3rem] shadow-2xl overflow-hidden relative group cursor-crosshair border-8 border-white"
          >
            {images.length > 0 ? (
              <>
                <img 
                  src={images[currentIndex]} 
                  alt="Mystery" 
                  className="w-full h-full object-contain select-none"
                />
                
                {/* Overlay Modes */}
                <AnimatePresence>
                  {mode === 'lightsOut' ? (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 z-10 pointer-events-none"
                      style={{
                        background: `radial-gradient(circle 120px at ${mousePos.x}% ${mousePos.y}%, transparent 0%, rgba(0,0,0,0.95) 100%)`
                      }}
                    />
                  ) : (
                    <motion.div 
                      className="absolute inset-0 z-10"
                    >
                      {revealEffect === 'blur' && (
                        <div 
                          className="absolute inset-0 backdrop-blur-3xl"
                          style={{ 
                            backdropFilter: `blur(${Math.pow(1 - progress / 100, 2) * 80}px)`,
                            opacity: progress >= 100 ? 0 : 1,
                            backgroundColor: `rgba(255, 255, 255, ${Math.max(0, 0.4 * (1 - progress/100))})`
                          }}
                        />
                      )}

                      {revealEffect === 'pixel' && (
                        <div className="absolute inset-0">
                          <PixelatedImage src={images[currentIndex]} progress={progress} />
                        </div>
                      )}

                      {revealEffect === 'grid' && (
                        <div className="absolute inset-0 grid grid-cols-10 grid-rows-10">
                          {gridState.map((active, i) => (
                            <motion.div
                              key={i}
                              initial={false}
                              animate={{ opacity: active ? 1 : 0, scale: active ? 1 : 0.8 }}
                              className="bg-slate-900 border-[0.5px] border-slate-800"
                            />
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 gap-4">
                <ImageIcon size={80} strokeWidth={1} className="opacity-20" />
                <p className="font-black uppercase tracking-widest text-sm opacity-40">No Images Uploaded</p>
                <label className="mt-4 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black cursor-pointer hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-900/20 active:scale-95">
                  <input type="file" multiple accept="image/*" onChange={handleUpload} className="hidden" />
                  UPLOAD IMAGES
                </label>
              </div>
            )}

            {/* Navigation Arrows */}
            {images.length > 1 && (
              <div className="absolute bottom-8 left-8 flex items-center gap-4 z-20">
                <button 
                  onClick={() => { setCurrentIndex(prev => (prev - 1 + images.length) % images.length); resetReveal(); }}
                  className="p-4 bg-white/20 backdrop-blur-md text-white rounded-full hover:bg-white/40 transition-all"
                >
                  <ChevronLeft size={24} />
                </button>
                <div className="px-6 py-2 bg-white/20 backdrop-blur-md text-white rounded-full font-black text-sm">
                  {currentIndex + 1} / {images.length}
                </div>
                <button 
                  onClick={() => { setCurrentIndex(prev => (prev + 1) % images.length); resetReveal(); }}
                  className="p-4 bg-white/20 backdrop-blur-md text-white rounded-full hover:bg-white/40 transition-all"
                >
                  <ChevronRight size={24} />
                </button>
              </div>
            )}

            {/* Bottom Right Controls */}
            {images.length > 0 && (
              <div className="absolute bottom-8 right-8 flex items-center gap-3 z-30">
                <button 
                  onClick={toggleFullscreen}
                  className="p-4 bg-white/20 backdrop-blur-md text-white rounded-2xl hover:bg-white/40 transition-all"
                  title="Fullscreen"
                >
                  <Maximize2 size={24} />
                </button>
                
                {mode === 'reveal' && (
                  <button
                    onClick={toggleReveal}
                    className={`px-8 py-4 rounded-2xl font-black flex items-center gap-3 transition-all active:scale-95 shadow-2xl ${
                      isRevealing 
                        ? 'bg-amber-500 text-white animate-pulse' 
                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                    }`}
                  >
                    {isRevealing ? <Zap size={24} /> : <Play size={24} />}
                    <span className="tracking-widest">{isRevealing ? 'PAUSE' : 'START'}</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Reveal Progress Bar - Minimal */}
          {mode === 'reveal' && images.length > 0 && (
            <div className="bg-white rounded-full h-4 shadow-inner border border-slate-100 overflow-hidden relative">
              <motion.div 
                className="h-full bg-indigo-600"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
              />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="text-[10px] font-black text-slate-400 tracking-[0.3em] uppercase">Reveal Progress</span>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Controls - Animated Visibility */}
        <AnimatePresence>
          {showSettings && (
            <motion.div 
              initial={{ opacity: 0, x: 20, width: 0 }}
              animate={{ opacity: 1, x: 0, width: 'auto' }}
              exit={{ opacity: 0, x: 20, width: 0 }}
              className="lg:col-span-4 flex flex-col gap-6 overflow-hidden"
            >
              {/* Effect Selector */}
              {mode === 'reveal' && (
                <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-gray-100">
                  <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-3">
                    <Settings2 className="text-indigo-600" />
                    Reveal Effect
                  </h3>
                  <div className="grid grid-cols-1 gap-3">
                    {REVEAL_EFFECTS.map(effect => (
                      <button
                        key={effect.id}
                        onClick={() => { setRevealEffect(effect.id); resetReveal(); }}
                        className={`
                          w-full px-6 py-4 rounded-2xl text-sm font-black transition-all flex items-center gap-4
                          ${revealEffect === effect.id ? 'bg-slate-900 text-white shadow-xl scale-105' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}
                        `}
                      >
                        <effect.icon size={20} />
                        {effect.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Playlist / Uploaded Images */}
              <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-gray-100 flex-1 flex flex-col min-h-0">
                <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-3">
                  <Upload className="text-indigo-600" />
                  Playlist
                </h3>
                
                <div className="flex-1 overflow-y-auto pr-2 space-y-3 no-scrollbar">
                  {images.map((img, idx) => (
                    <div 
                      key={idx}
                      onClick={() => { setCurrentIndex(idx); resetReveal(); }}
                      className={`group relative aspect-video rounded-2xl overflow-hidden cursor-pointer border-4 transition-all ${
                        currentIndex === idx ? 'border-indigo-600 scale-95' : 'border-transparent hover:border-slate-200'
                      }`}
                    >
                      <img src={img} className="w-full h-full object-cover" alt={`Preview ${idx}`} />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Eye size={24} className="text-white" />
                      </div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); removeImage(idx); }}
                        className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
                      >
                        <RotateCcw size={14} />
                      </button>
                    </div>
                  ))}
                  
                  <label className="flex flex-col items-center justify-center aspect-video rounded-2xl border-4 border-dashed border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/30 transition-all cursor-pointer text-slate-400 hover:text-indigo-400 group">
                    <input type="file" multiple accept="image/*" onChange={handleUpload} className="hidden" />
                    <Upload size={32} strokeWidth={1.5} className="group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-black uppercase mt-2">Add More</span>
                  </label>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

const PixelatedImage = ({ src, progress }) => {
  const canvasRef = useRef(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // Set canvas size to match container but with fixed resolution for performance
      const w = 800;
      const h = 600;
      canvas.width = w;
      canvas.height = h;

      // Calculate pixel size based on progress
      // 0% -> 60px pixels, 100% -> 1px pixels
      const pixelSize = Math.max(1, Math.floor(60 * Math.pow(1 - progress / 100, 1.5)));
      
      if (pixelSize <= 1) {
        ctx.drawImage(img, 0, 0, w, h);
        return;
      }

      // Downsample
      const sw = Math.ceil(w / pixelSize);
      const sh = Math.ceil(h / pixelSize);
      
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = sw;
      tempCanvas.height = sh;
      const tCtx = tempCanvas.getContext('2d');
      tCtx.drawImage(img, 0, 0, sw, sh);
      
      // Upsample back
      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(tempCanvas, 0, 0, sw, sh, 0, 0, w, h);
    };
    img.src = src;
  }, [src, progress]);

  return (
    <canvas 
      ref={canvasRef} 
      className="w-full h-full object-contain bg-slate-900"
    />
  );
};
