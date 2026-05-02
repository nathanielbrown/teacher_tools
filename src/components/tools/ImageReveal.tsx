import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Image as ImageIcon, 
  Upload, 
  Play, 
  Pause,
  RotateCcw, 
  ChevronLeft, 
  ChevronRight, 
  Grid, 
  Layers, 
  Sparkles,
  Info,
  Trash2,
  Settings2,
  X,
  Target
} from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';
import { useHeader } from '../../contexts/HeaderContext';
import { audioEngine } from '../../utils/audio';
import { FormattedMessage } from 'react-intl';
import ToolPanel from '../shared/ToolPanel';
import SettingsPanel from '../shared/SettingsPanel';
import { useIntl } from 'react-intl';

// 1. Constants
const REVEAL_EFFECTS = [
  { id: 'blur', label: 'Soft Blur', icon: Sparkles, desc: 'Smooth clearing' },
  { id: 'grid', label: 'Mosaic Grid', icon: Grid, desc: 'Cellular reveal' },
  { id: 'pixel', label: 'Pixelate', icon: Layers, desc: 'Resolution increase' }
];

// 2. Config (None)

// 3. Text (Help and Info)
const HelpContent = () => (
  <div className="space-y-4 font-['Outfit']">
    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">
      <FormattedMessage id="imagereveal.help.title" defaultMessage="How to Play" />
    </h3>
    <div className="space-y-3">
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center text-xs font-black text-indigo-600 shrink-0">1</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">
          <FormattedMessage id="imagereveal.help.step1" defaultMessage="Upload one or more images using the add button." />
        </p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center text-xs font-black text-indigo-600 shrink-0">2</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">
          <FormattedMessage id="imagereveal.help.step2" defaultMessage="Choose between Reveal mode or Flashlight mode at the top." />
        </p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center text-xs font-black text-indigo-600 shrink-0">3</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">
          <FormattedMessage id="imagereveal.help.step3" defaultMessage="In Reveal mode, click play to start revealing the image slowly." />
        </p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center text-xs font-black text-indigo-600 shrink-0">4</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">
          <FormattedMessage id="imagereveal.help.step4" defaultMessage="Try to guess the image before it's fully revealed!" />
        </p>
      </div>
    </div>
  </div>
);

// 4. Local Storage (None)

// 5. Classes (None)

// 6. Functions (Sub-components)
const PixelatedImage = ({ src, progress }: { src: string, progress: number }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const img = new Image();
    
    img.onload = () => {
      const w = 1200;
      const h = 900;
      canvas.width = w;
      canvas.height = h;

      const pixelSize = Math.max(1, Math.floor(100 * Math.pow(1 - progress / 100, 2)));
      
      if (pixelSize <= 1) {
        ctx.drawImage(img, 0, 0, w, h);
        return;
      }

      const sw = Math.ceil(w / pixelSize);
      const sh = Math.ceil(h / pixelSize);
      
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = sw;
      tempCanvas.height = sh;
      const tCtx = tempCanvas.getContext('2d');
      if (!tCtx) return;
      tCtx.drawImage(img, 0, 0, sw, sh);
      
      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(tempCanvas, 0, 0, sw, sh, 0, 0, w, h);
    };
    img.src = src;
  }, [src, progress]);

  return (
    <canvas ref={canvasRef} className="w-full h-full object-contain bg-slate-900" />
  );
};

// 7. Component
export const ImageReveal = () => {
  const { setHasConfig, setOnConfigToggle, setHeaderActions, setOnReset, clearHeader, setHelpContent, isConfigOpen, setIsConfigOpen } = useHeader();
  const { settings } = useSettings();
  const intl = useIntl();
  const [images, setImages] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [mode, setMode] = useState<'reveal' | 'lightsOut'>('reveal');
  const [revealEffect, setRevealEffect] = useState('blur');
  const [revealSpeed, setRevealSpeed] = useState(1);
  const [progress, setProgress] = useState(0);
  const [isRevealing, setIsRevealing] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
  const [gridState, setGridState] = useState<boolean[]>([]);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const revealTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newImages = files.map(file => URL.createObjectURL(file));
    setImages(prev => [...prev, ...newImages]);
    if (images.length === 0) setCurrentIndex(0);
    audioEngine.playTick(settings.soundTheme);
  };

  const resetReveal = useCallback(() => {
    setIsRevealing(false);
    setProgress(0);
    if (revealEffect === 'grid') {
      setGridState(Array(100).fill(true));
    }
    audioEngine.playTick(settings.soundTheme);
  }, [revealEffect, settings.soundTheme]);

  useEffect(() => {
    setHasConfig(true);
    setOnConfigToggle(() => () => setIsConfigOpen(prev => !prev));
    setOnReset(() => resetReveal);
    setHelpContent(<HelpContent />);
    return () => {
      clearHeader();
      setOnConfigToggle(null);
    };
  }, [clearHeader, setOnReset, resetReveal, setHelpContent, setHasConfig, setIsConfigOpen, setOnConfigToggle]);

  useEffect(() => {
    setHeaderActions(
      <div className="flex items-center gap-2 italic">
        <div className="bg-white p-1 rounded-xl flex items-center gap-1 border-2 border-slate-50 ">
          <button
            onClick={() => { setMode('reveal'); resetReveal(); }}
            className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${mode === 'reveal' ? 'bg-indigo-600 text-white ' : 'text-slate-300 hover:text-slate-500'}`}
          >
            <FormattedMessage id="imagereveal.mode.reveal" defaultMessage="Reveal" />
          </button>
          <button
            onClick={() => { setMode('lightsOut'); resetReveal(); }}
            className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${mode === 'lightsOut' ? 'bg-indigo-600 text-white ' : 'text-slate-300 hover:text-slate-500'}`}
          >
            <FormattedMessage id="imagereveal.mode.flashlight" defaultMessage="Flashlight" />
          </button>
        </div>
      </div>
    );
  }, [mode, resetReveal, setHeaderActions]);

  useEffect(() => {
    if (isRevealing && mode === 'reveal') {
      const duration = 15000 / revealSpeed;
      const intervalTime = 100;
      const step = (intervalTime / duration) * 100;

      revealTimerRef.current = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            setIsRevealing(false);
            if (revealTimerRef.current) clearInterval(revealTimerRef.current);
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
      if (revealTimerRef.current) clearInterval(revealTimerRef.current);
    }
    return () => {
      if (revealTimerRef.current) clearInterval(revealTimerRef.current);
    }
  }, [isRevealing, mode, revealEffect, progress, revealSpeed]);

  const toggleReveal = () => {
    if (progress >= 100) {
      resetReveal();
    } else {
      setIsRevealing(!isRevealing);
      audioEngine.playTick(settings.soundTheme);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (mode !== 'lightsOut' || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMousePos({ x, y });
  };

  const removeImage = (idx: number) => {
    setImages(prev => prev.filter((_, i) => i !== idx));
    if (currentIndex >= images.length - 1) setCurrentIndex(Math.max(0, images.length - 2));
    audioEngine.playTick(settings.soundTheme);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 h-full w-full italic">
      <ToolPanel baseWidth={1000} baseHeight={800}>
        <div className="w-full h-full flex flex-col gap-6 relative z-10 overflow-hidden">
          <div className="flex-1 relative bg-white rounded-[3rem] border-4 border-slate-50  overflow-hidden flex flex-col">
            <div 
              ref={containerRef}
              onMouseMove={handleMouseMove}
              className="flex-1 relative cursor-crosshair group overflow-hidden"
            >
              {images.length > 0 ? (
                <>
                  <motion.img 
                    layoutId="active-img"
                    src={images[currentIndex]} 
                    alt="Mystery" 
                    className="w-full h-full object-contain select-none p-12 cursor-pointer"
                    onClick={() => { if (mode === 'reveal') toggleReveal(); }}
                  />
                  
                  <AnimatePresence mode="wait">
                    {mode === 'lightsOut' ? (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-10 pointer-events-none"
                        style={{
                          background: `radial-gradient(circle 220px at ${mousePos.x}% ${mousePos.y}%, transparent 0%, rgba(15, 23, 42, 0.99) 100%)`
                        }}
                      />
                    ) : (
                      <motion.div className="absolute inset-0 z-10 pointer-events-none">
                        {revealEffect === 'blur' && (
                          <div 
                            className="absolute inset-0 backdrop-blur-3xl"
                            style={{ 
                              backdropFilter: `blur(${Math.pow(1 - progress / 100, 2) * 100}px)`,
                              opacity: progress >= 100 ? 0 : 1,
                              backgroundColor: `rgba(255, 255, 255, ${Math.max(0, 0.8 * (1 - progress/100))})`
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
                                animate={{ opacity: active ? 1 : 0 }}
                                className="bg-slate-200 border-[1px] border-white"
                              />
                            ))}
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-200 gap-8">
                  <div className="w-40 h-40 bg-white rounded-[2.5rem]  border-4 border-slate-50 flex items-center justify-center rotate-6">
                    <ImageIcon size={80} strokeWidth={1} className="text-slate-100" />
                  </div>
                </div>
              )}

              {images.length > 1 && (
                <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between px-10 pointer-events-none z-30">
                  <button 
                    onClick={() => { setCurrentIndex(prev => (prev - 1 + images.length) % images.length); resetReveal(); }}
                    className="p-4 bg-white/80 backdrop-blur-md  rounded-2xl text-slate-900 hover:bg-indigo-600 hover:text-white transition-all active:scale-90 pointer-events-auto border-2 border-white"
                  >
                    <ChevronLeft size={32} strokeWidth={3} />
                  </button>
                  <button 
                    onClick={() => { setCurrentIndex(prev => (prev + 1) % images.length); resetReveal(); }}
                    className="p-4 bg-white/80 backdrop-blur-md  rounded-2xl text-slate-900 hover:bg-indigo-600 hover:text-white transition-all active:scale-90 pointer-events-auto border-2 border-white"
                  >
                    <ChevronRight size={32} strokeWidth={3} />
                  </button>
                </div>
              )}
            </div>

            {mode === 'reveal' && images.length > 0 && (
              <div className="h-4 bg-slate-50 overflow-hidden shrink-0 border-t-4 border-slate-50">
                <motion.div 
                  className="h-full bg-indigo-600"
                  animate={{ width: `${progress}%` }}
                  transition={{ ease: "linear", duration: 0.1 }}
                />
              </div>
            )}
          </div>

        </div>
      </ToolPanel>

      <SettingsPanel
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        title={intl.formatMessage({ id: 'imagereveal.config.title', defaultMessage: 'Settings' })}
      >
        <div className="space-y-8">
          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 ml-2">
              <FormattedMessage id="imagereveal.config.effect" defaultMessage="Reveal Effect" />
            </label>
            <div className="grid grid-cols-1 gap-3">
              {REVEAL_EFFECTS.map(effect => (
                <button
                  key={effect.id}
                  onClick={() => { setRevealEffect(effect.id); resetReveal(); }}
                  className={`p-4 rounded-2xl border-4 transition-all text-left flex items-center gap-6 ${revealEffect === effect.id ? 'bg-indigo-600 border-indigo-400 text-white ' : 'bg-slate-50 border-slate-100 text-slate-400 hover:border-indigo-100'}`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${revealEffect === effect.id ? 'bg-white/10 text-white' : 'bg-white text-slate-200'}`}>
                    <effect.icon size={20} />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest">
                    <FormattedMessage id={`imagereveal.effect.${effect.id}`} defaultMessage={effect.label} />
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 ml-2">
              <FormattedMessage id="imagereveal.config.speed" defaultMessage="Reveal Speed" />
            </label>
            <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border-4 border-white">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Speed</span>
                <span className="text-xl font-black text-indigo-600 tabular-nums italic leading-none">{revealSpeed}x</span>
              </div>
              <input 
                type="range" min="0.5" max="3" step="0.5" value={revealSpeed}
                onChange={(e) => setRevealSpeed(parseFloat(e.target.value))}
                className="w-full h-2 bg-white rounded-full appearance-none cursor-pointer accent-indigo-600"
              />
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 ml-2">
              <FormattedMessage id="imagereveal.config.images" defaultMessage="Manage Images" />
            </label>
            
            <div className="grid grid-cols-1 gap-3">
              <label className="flex items-center gap-4 p-4 rounded-2xl border-4 border-dashed border-slate-100 bg-slate-50 hover:border-indigo-400 hover:bg-indigo-50 transition-all cursor-pointer text-slate-300 hover:text-indigo-600 group">
                <input type="file" multiple accept="image/*" onChange={handleUpload} className="hidden" />
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center border-2 border-slate-50">
                  <Upload size={20} strokeWidth={3} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest">
                  <FormattedMessage id="imagereveal.action.add" defaultMessage="Add New Image" />
                </span>
              </label>

              <AnimatePresence mode="popLayout">
                {images.map((img, idx) => (
                  <motion.div 
                    layout
                    key={img}
                    onClick={() => { setCurrentIndex(idx); resetReveal(); }}
                    className={`relative flex items-center gap-4 p-3 rounded-2xl border-4 transition-all cursor-pointer ${currentIndex === idx ? 'border-indigo-600 bg-indigo-50' : 'border-slate-50 bg-white hover:border-indigo-100'}`}
                  >
                    <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 border-2 border-white">
                      <img src={img} className="w-full h-full object-cover" alt="" />
                    </div>
                    <span className="flex-1 text-[10px] font-black text-slate-600 uppercase truncate">
                      <FormattedMessage id="imagereveal.imageIndex" values={{ index: idx + 1 }} defaultMessage={`Image ${idx + 1}`} />
                    </span>
                    <button 
                      onClick={(e) => { e.stopPropagation(); removeImage(idx); }}
                      className="p-2 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all"
                    >
                      <Trash2 size={14} strokeWidth={3} />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </SettingsPanel>
    </div>
  );
};

export default ImageReveal;
