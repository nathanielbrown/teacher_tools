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
import { useLocalStorage } from '../../hooks/useLocalStorage';
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
        <div className="w-6 h-6 rounded-lg bg-primary/5 flex items-center justify-center text-xs font-black text-primary shrink-0">1</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">
          <FormattedMessage id="imagereveal.help.step1" defaultMessage="Upload one or more images using the add button." />
        </p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-primary/5 flex items-center justify-center text-xs font-black text-primary shrink-0">2</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">
          <FormattedMessage id="imagereveal.help.step2" defaultMessage="Choose between Reveal mode or Flashlight mode at the top." />
        </p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-primary/5 flex items-center justify-center text-xs font-black text-primary shrink-0">3</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">
          <FormattedMessage id="imagereveal.help.step3" defaultMessage="In Reveal mode, click play to start revealing the image slowly." />
        </p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-primary/5 flex items-center justify-center text-xs font-black text-primary shrink-0">4</div>
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
    <canvas ref={canvasRef} className="w-full h-full object-contain bg-dark-bg" />
  );
};

// 7. Component
export const ImageReveal = () => {
  const { setHasConfig, setOnConfigToggle, setOnReset, clearHeader, setHelpContent, isConfigOpen, setIsConfigOpen } = useHeader();
  const { settings } = useSettings();
  const intl = useIntl();
  const [images, setImages] = useLocalStorage<string[]>('imagereveal_images', []);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [mode, setMode] = useLocalStorage<'reveal' | 'lightsOut'>('imagereveal_mode', 'reveal');
  const [revealEffect, setRevealEffect] = useLocalStorage('imagereveal_effect', 'blur');
  const [revealSpeed, setRevealSpeed] = useLocalStorage('imagereveal_speed', 1);
  const [progress, setProgress] = useState(0);
  const [isRevealing, setIsRevealing] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
  const [gridState, setGridState] = useState<boolean[]>([]);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const revealTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [flashAdd, setFlashAdd] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const triggerFlash = useCallback(() => {
    setFlashAdd(true);
    audioEngine.playTick(settings.soundTheme);
    setTimeout(() => setFlashAdd(false), 2000);
  }, [settings.soundTheme]);

  const handleEmptyClick = () => {
    if (images.length === 0) {
      setIsConfigOpen(true);
      triggerFlash();
    }
  };

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
    setIsConfigOpen(!isMobile);
    setOnConfigToggle(() => () => setIsConfigOpen(prev => !prev));
    setOnReset(() => resetReveal);
    setHelpContent(<HelpContent />);
    return () => {
      clearHeader();
      setOnConfigToggle(null);
    };
  }, [clearHeader, setOnReset, resetReveal, setHelpContent, setHasConfig, setIsConfigOpen, setOnConfigToggle, isMobile]);


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

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (mode !== 'lightsOut' || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;
    setMousePos({ x, y });
  };

  const removeImage = (idx: number) => {
    setImages(prev => prev.filter((_, i) => i !== idx));
    if (currentIndex >= images.length - 1) setCurrentIndex(Math.max(0, images.length - 2));
    audioEngine.playTick(settings.soundTheme);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 w-full h-full italic overflow-hidden relative">
      <AnimatePresence>
        {isConfigOpen && (
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[100] p-4 bg-slate-100/60 backdrop-blur-xl lg:relative lg:inset-auto lg:z-auto lg:p-0 lg:bg-transparent lg:backdrop-blur-none lg:w-[320px] lg:h-full flex flex-col italic overflow-hidden shrink-0"
          >
            <SettingsPanel
              isOpen={isConfigOpen}
              onClose={() => setIsConfigOpen(false)}
              className="shrink-0 lg:h-full"
              compact
              title={intl.formatMessage({ id: 'imagereveal.config.title', defaultMessage: 'Settings' })}
            >
              <div className="space-y-6">
                {/* Mode Selection */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest block text-center opacity-60">
                    <FormattedMessage id="imagereveal.config.mode" defaultMessage="Game Mode" />
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      onClick={() => { setMode('reveal'); resetReveal(); }}
                      className={`px-1 py-3 rounded-xl border-2 transition-all italic uppercase font-black text-[9px] tracking-widest text-center ${mode === 'reveal' ? 'bg-primary border-indigo-400 text-white ' : 'bg-surface border-slate-100 text-slate-300 hover:border-primary/20'}`}
                    >
                      <FormattedMessage id="imagereveal.mode.reveal" defaultMessage="Reveal" />
                    </button>
                    <button
                      onClick={() => { setMode('lightsOut'); resetReveal(); }}
                      className={`px-1 py-3 rounded-xl border-2 transition-all italic uppercase font-black text-[9px] tracking-widest text-center ${mode === 'lightsOut' ? 'bg-primary border-indigo-400 text-white ' : 'bg-surface border-slate-100 text-slate-300 hover:border-primary/20'}`}
                    >
                      <FormattedMessage id="imagereveal.mode.flashlight" defaultMessage="Flashlight" />
                    </button>
                  </div>
                </div>

                {/* Reveal Effect Selection */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest block text-center opacity-60">
                    <FormattedMessage id="imagereveal.config.effect" defaultMessage="Reveal Effect" />
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {REVEAL_EFFECTS.map(effect => (
                      <button
                        key={effect.id}
                        onClick={() => { setRevealEffect(effect.id); resetReveal(); }}
                        className={`px-1 py-3 rounded-xl border-2 transition-all italic uppercase font-black text-[9px] tracking-widest text-center ${revealEffect === effect.id ? 'bg-primary border-indigo-400 text-white ' : 'bg-surface border-slate-100 text-slate-300 hover:border-primary/20'}`}
                      >
                        <FormattedMessage id={`imagereveal.effect.${effect.id}`} defaultMessage={effect.label} />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Reveal Speed Selection */}
                <div className="space-y-3">
                  <div className="flex flex-row items-center justify-between px-4 py-3 bg-surface border-2 border-slate-100 rounded-[1.5rem] italic">
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 rounded-lg bg-primary/5 text-primary">
                        <Play size={14} />
                      </div>
                      <div className="text-xs font-black text-slate-900 uppercase">
                        <FormattedMessage id="imagereveal.config.speed" defaultMessage="Speed" />
                      </div>
                    </div>
                    <div className="text-sm font-black text-primary tabular-nums">{revealSpeed}x</div>
                  </div>
                  <div className="px-2">
                    <input 
                      type="range" min="0.5" max="3" step="0.5" value={revealSpeed}
                      onChange={(e) => setRevealSpeed(parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-slate-100 rounded-full appearance-none cursor-pointer accent-indigo-600"
                    />
                  </div>
                </div>

                {/* Manage Images */}
                <div className="space-y-3 pt-4 border-t-2 border-slate-50">
                  <div className="flex items-center justify-between px-2">
                    <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest opacity-60">
                      <FormattedMessage id="imagereveal.config.images" defaultMessage="Images" />
                    </label>
                    {images.length > 0 && (
                      <button 
                        onClick={() => setImages([])}
                        className="text-[9px] font-black uppercase tracking-widest text-caution hover:text-caution transition-colors"
                      >
                        <FormattedMessage id="shared.history.clear" defaultMessage="Clear All" />
                      </button>
                    )}
                  </div>

                  <motion.label 
                    animate={flashAdd ? { scale: [1, 1.05, 1], backgroundColor: ['#f8fafc', '#e0e7ff', '#f8fafc'] } : {}}
                    className="flex items-center gap-3 p-4 rounded-[1.5rem] border-4 border-dashed border-slate-100 bg-slate-50 hover:border-indigo-400 hover:bg-surface transition-all cursor-pointer text-slate-300 hover:text-primary group"
                  >
                    <input type="file" multiple accept="image/*" onChange={handleUpload} className="hidden" />
                    <div className="w-10 h-10 rounded-xl bg-surface flex items-center justify-center border-2 border-slate-50 group-hover:border-primary/30">
                      <Upload size={20} strokeWidth={3} />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest">
                      <FormattedMessage id="imagereveal.action.add" defaultMessage="Add New Image" />
                    </span>
                  </motion.label>

                  <div className="space-y-2">
                    <AnimatePresence initial={false} mode="popLayout">
                      {images.map((img, idx) => (
                        <motion.div 
                          layout
                          key={img}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          onClick={() => { setCurrentIndex(idx); resetReveal(); if (isMobile) setIsConfigOpen(false); }}
                          className={`relative flex items-center gap-4 p-3 rounded-[1.5rem] border-2 transition-all cursor-pointer ${currentIndex === idx ? 'border-indigo-600 bg-primary/5' : 'border-slate-50 bg-surface hover:border-primary/20'}`}
                        >
                          <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 border-2 border-white">
                            <img src={img} width={48} height={48} className="w-full h-full object-cover" alt="Thumbnail" />
                          </div>
                          <span className="flex-1 text-[10px] font-black text-slate-600 uppercase truncate tracking-widest">
                            <FormattedMessage id="imagereveal.imageIndex" values={{ index: idx + 1 }} defaultMessage={`Image ${idx + 1}`} />
                          </span>
                          <button 
                            onClick={(e) => { e.stopPropagation(); removeImage(idx); }}
                            className="p-2 bg-caution-bg text-caution rounded-xl hover:bg-rose-500 hover:text-white transition-all"
                          >
                            <Trash2 size={12} strokeWidth={3} />
                          </button>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </SettingsPanel>
          </motion.div>
        )}
      </AnimatePresence>

      <ToolPanel 
        className="flex-1 font-['Outfit'] select-none" 
        baseWidth={isMobile ? 800 : 1000} 
        baseHeight={isMobile ? 1000 : 800}
        fluid={false}
      >
        <div className="w-full h-full flex flex-col gap-4 lg:gap-6 relative z-10 overflow-hidden">
          {/* Main Display Area */}
          <div className="flex-1 relative bg-surface rounded-[2.5rem] lg:rounded-[3rem] border-4 border-slate-50 overflow-hidden flex flex-col shadow-sm">
            <div 
              ref={containerRef}
              onMouseMove={handleMouseMove}
              onTouchMove={handleMouseMove}
              onClick={handleEmptyClick}
              className="flex-1 relative cursor-crosshair group overflow-hidden"
            >
              {images.length > 0 ? (
                <>
                  <motion.img 
                    layoutId="active-img"
                    src={images[currentIndex]} 
                    alt="Mystery" 
                    className="w-full h-full object-contain select-none p-6 lg:p-12 cursor-pointer"
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
                          background: `radial-gradient(circle ${isMobile ? '160px' : '220px'} at ${mousePos.x}% ${mousePos.y}%, transparent 0%, rgba(15, 23, 42, 0.99) 100%)`
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

                  {/* Desktop Only Navigation Arrows */}
                  {!isMobile && images.length > 1 && (
                    <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between px-10 pointer-events-none z-30">
                      <button 
                        onClick={(e) => { e.stopPropagation(); setCurrentIndex(prev => (prev - 1 + images.length) % images.length); resetReveal(); }}
                        className="p-4 bg-surface/80 backdrop-blur-md rounded-2xl text-slate-900 hover:bg-primary hover:text-white transition-all active:scale-90 pointer-events-auto border-2 border-white shadow-lg"
                      >
                        <ChevronLeft size={32} strokeWidth={3} />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setCurrentIndex(prev => (prev + 1) % images.length); resetReveal(); }}
                        className="p-4 bg-surface/80 backdrop-blur-md rounded-2xl text-slate-900 hover:bg-primary hover:text-white transition-all active:scale-90 pointer-events-auto border-2 border-white shadow-lg"
                      >
                        <ChevronRight size={32} strokeWidth={3} />
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-200 gap-8">
                  <div className="w-40 h-40 bg-surface rounded-[2.5rem] border-4 border-slate-50 flex items-center justify-center rotate-6 shadow-sm">
                    <ImageIcon size={80} strokeWidth={1} className="text-slate-100" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-300">Add images to start</span>
                </div>
              )}

              {/* Progress Bar Container */}
              {mode === 'reveal' && images.length > 0 && (
                <div className="absolute bottom-0 left-0 right-0 h-3 bg-slate-50 overflow-hidden z-20">
                  <motion.div 
                    className="h-full bg-primary"
                    animate={{ width: `${progress}%` }}
                    transition={{ ease: "linear", duration: 0.1 }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Bottom Control Bar */}
          <div className="flex items-center gap-4 px-2 lg:px-0">
            {images.length > 1 && isMobile && (
              <div className="flex gap-2">
                <button 
                  onClick={() => { setCurrentIndex(prev => (prev - 1 + images.length) % images.length); resetReveal(); }}
                  className="w-16 h-16 lg:w-20 lg:h-20 bg-surface border-4 border-slate-50 rounded-2xl flex items-center justify-center text-neutral-400 hover:text-primary hover:border-primary/20 transition-all active:scale-95"
                >
                  <ChevronLeft size={32} strokeWidth={3} />
                </button>
                <button 
                  onClick={() => { setCurrentIndex(prev => (prev + 1) % images.length); resetReveal(); }}
                  className="w-16 h-16 lg:w-20 lg:h-20 bg-surface border-4 border-slate-50 rounded-2xl flex items-center justify-center text-neutral-400 hover:text-primary hover:border-primary/20 transition-all active:scale-95"
                >
                  <ChevronRight size={32} strokeWidth={3} />
                </button>
              </div>
            )}

            <div className="flex-1 flex gap-4">
              <button
                onClick={toggleReveal}
                disabled={images.length === 0 || mode !== 'reveal'}
                className={`flex-1 h-16 lg:h-24 rounded-[2rem] flex items-center justify-center gap-4 text-lg lg:text-2xl font-black uppercase tracking-widest transition-all active:scale-[0.98] ${
                  isRevealing 
                    ? 'bg-rose-500 text-white shadow-lg shadow-rose-200' 
                    : 'bg-primary text-white shadow-lg shadow-indigo-200'
                } disabled:opacity-30 disabled:shadow-none`}
              >
                {isRevealing ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" />}
                <span className="hidden sm:inline">
                  {isRevealing ? <FormattedMessage id="imagereveal.action.pause" defaultMessage="Pause" /> : <FormattedMessage id="imagereveal.action.play" defaultMessage="Play" />}
                </span>
              </button>

              <button
                onClick={resetReveal}
                disabled={images.length === 0 || (progress === 0 && !isRevealing)}
                className="w-16 h-16 lg:w-24 lg:h-24 bg-surface border-4 border-slate-50 rounded-[2rem] flex items-center justify-center text-neutral-400 hover:text-caution hover:border-caution-border transition-all active:scale-95 disabled:opacity-30"
              >
                <RotateCcw size={isMobile ? 28 : 36} strokeWidth={3} />
              </button>
            </div>
          </div>
        </div>
      </ToolPanel>

      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] opacity-30 -z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-caution-bg rounded-full blur-[120px] opacity-30 -z-10 pointer-events-none" />
    </div>
  );
};

export default ImageReveal;
