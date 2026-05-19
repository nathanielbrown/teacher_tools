import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle, 
  ChevronLeft, 
  ChevronRight, 
  PenTool, 
  RotateCcw, 
  ArrowRight, 
  Award,
  Eraser,
  Type
} from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';
import { useHeader } from '../../contexts/HeaderContext';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { audioEngine } from '../../utils/audio';
import { useIntl, FormattedMessage } from 'react-intl';
import ToolPanel from '../shared/ToolPanel';

// 1. Constants
const CANVAS_SIZE = 800;
const FONT_SIZE = 600;
const BRUSH_SIZE = 40;
const CHAR_SETS = {
  upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lower: 'abcdefghijklmnopqrstuvwxyz',
  numbers: '0123456789'
};

// 3. Text (Help and Info)
const HelpContent = () => (
  <div className="space-y-4 font-['Outfit']">
    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">
      <FormattedMessage id="lettertracing.help.title" />
    </h3>
    <div className="space-y-3">
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center text-xs font-black text-indigo-600 shrink-0">1</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">
          <FormattedMessage 
            id="lettertracing.help.step1" 
            defaultMessage="Choose uppercase, lowercase, or numbers in settings."
            values={{ b: (chunks: React.ReactNode) => <b>{chunks}</b> }}
          />
        </p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center text-xs font-black text-indigo-600 shrink-0">2</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">
          <FormattedMessage 
            id="lettertracing.help.step2" 
            defaultMessage="Use your finger or mouse to <b>trace</b> the letter."
            values={{ b: (chunks: React.ReactNode) => <b>{chunks}</b> }}
          />
        </p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center text-xs font-black text-indigo-600 shrink-0">3</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">
          <FormattedMessage 
            id="lettertracing.help.step3" 
            defaultMessage="Click <b>Verify</b> to see how well you did!"
            values={{ b: (chunks: React.ReactNode) => <b>{chunks}</b> }}
          />
        </p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center text-xs font-black text-indigo-600 shrink-0">4</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">
          <FormattedMessage 
            id="lettertracing.help.step4" 
            defaultMessage="Try to get 100% on every letter!"
            values={{ b: (chunks: React.ReactNode) => <b>{chunks}</b> }}
          />
        </p>
      </div>
    </div>
  </div>
);

export const LetterTracing = () => {
  const intl = useIntl();
  const { setOnReset, clearHeader, setHelpContent } = useHeader();
  const { settings } = useSettings();

  const [charSet, setCharSet] = useState<keyof typeof CHAR_SETS>('upper');
  const [currentLetter, setCurrentLetter] = useState('A');
  const [score, setScore] = useState<{ accuracy: number; msg: string } | null>(null);
  const [mastery, setMastery] = useLocalStorage<Record<string, number>>('letter_tracing_mastery', {});
  const [isFontLoaded, setIsFontLoaded] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [masteryPage, setMasteryPage] = useState(0);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  const baseCanvasRef = useRef<HTMLCanvasElement>(null);
  const drawCanvasRef = useRef<HTMLCanvasElement>(null);
  const hiddenCanvasRef = useRef<HTMLCanvasElement>(null);

  const isDrawing = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const userPath = useRef<Array<Array<{ x: number, y: number }>>>([]);

  const getCoordinates = (e: any) => {
    const canvas = drawCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    let clientX, clientY;
    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const drawTemplate = useCallback(() => {
    const canvas = baseCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    ctx.font = `400 ${FONT_SIZE}px "QLD Beginners", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Draw solid light template
    ctx.fillStyle = '#f8fafc';
    ctx.fillText(currentLetter, CANVAS_SIZE / 2, CANVAS_SIZE / 2 + 10);
    
    // Draw dashed outline
    ctx.setLineDash([12, 12]);
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 4;
    ctx.strokeText(currentLetter, CANVAS_SIZE / 2, CANVAS_SIZE / 2 + 10);
    ctx.setLineDash([]);
  }, [currentLetter]);

  const clearDrawing = useCallback(() => {
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    userPath.current = [];
    setScore(null);
  }, []);

  // Persistence handled by useLocalStorage

  useEffect(() => {
    if (document.fonts && document.fonts.load) {
      document.fonts.load(`${FONT_SIZE}px "QLD Beginners"`).then(() => {
        setIsFontLoaded(true);
      });
    } else {
      setIsFontLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!isFontLoaded) return;
    drawTemplate();
    clearDrawing();
  }, [currentLetter, drawTemplate, clearDrawing, isFontLoaded]);

  const startDrawing = (e: any) => {
    const pos = getCoordinates(e);
    isDrawing.current = true;
    lastPos.current = pos;
    userPath.current.push([{ x: pos.x, y: pos.y }]);
  };

  const draw = (e: any) => {
    if (!isDrawing.current) return;
    const pos = getCoordinates(e);
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = BRUSH_SIZE;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    lastPos.current = pos;
    userPath.current[userPath.current.length - 1].push({ x: pos.x, y: pos.y });
  };

  const stopDrawing = () => isDrawing.current = false;

  const renderPathToContext = (ctx: CanvasRenderingContext2D, path: any[], lineWidth: number) => {
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    if (path.length === 0) return;
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    path.forEach(stroke => {
      if (stroke.length < 2) {
        ctx.beginPath();
        ctx.arc(stroke[0].x, stroke[0].y, lineWidth / 2, 0, Math.PI * 2);
        ctx.fill();
        return;
      }
      ctx.beginPath();
      ctx.moveTo(stroke[0].x, stroke[0].y);
      for (let i = 1; i < stroke.length; i++) {
        ctx.lineTo(stroke[i].x, stroke[i].y);
      }
      ctx.stroke();
    });
  };

  const checkScore = useCallback(() => {
    if (userPath.current.length === 0) return;

    const hiddenCanvas = hiddenCanvasRef.current;
    if (!hiddenCanvas) return;
    const ctx = hiddenCanvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    ctx.font = `400 ${FONT_SIZE}px "QLD Beginners", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#000000';
    ctx.fillText(currentLetter, CANVAS_SIZE / 2, CANVAS_SIZE / 2 + 10);
    const exactTemplateData = ctx.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE).data;

    ctx.lineWidth = 40;
    ctx.strokeStyle = '#000000';
    ctx.strokeText(currentLetter, CANVAS_SIZE / 2, CANVAS_SIZE / 2 + 10);
    const safeZoneData = ctx.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE).data;

    renderPathToContext(ctx, userPath.current, BRUSH_SIZE);
    const userStandardData = ctx.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE).data;

    renderPathToContext(ctx, userPath.current, 100); 
    const userDilatedData = ctx.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE).data;

    let userPixelsTotal = 0;
    let userPixelsInsideSafe = 0;
    let templatePixelsTotal = 0;
    let templatePixelsCovered = 0;

    for (let i = 0; i < exactTemplateData.length; i += 4) {
      const isExactTemplate = exactTemplateData[i + 3] > 64;
      const isSafeZone = safeZoneData[i + 3] > 64;
      const isUserStandard = userStandardData[i + 3] > 64;
      const isUserDilated = userDilatedData[i + 3] > 64;

      if (isUserStandard) {
        userPixelsTotal++;
        if (isSafeZone) userPixelsInsideSafe++;
      }
      if (isExactTemplate) {
        templatePixelsTotal++;
        if (isUserDilated) templatePixelsCovered++;
      }
    }

    const pctInside = userPixelsTotal === 0 ? 0 : userPixelsInsideSafe / userPixelsTotal;
    const pctOutside = userPixelsTotal === 0 ? 0 : (userPixelsTotal - userPixelsInsideSafe) / userPixelsTotal;
    const coverage = templatePixelsTotal === 0 ? 0 : templatePixelsCovered / templatePixelsTotal;
    
    // Simple formula: (Inside% - Outside%) * Coverage%
    const baseAccuracy = (pctInside - pctOutside) * coverage * 100;
    const finalAccuracy = Math.max(0, Math.round(baseAccuracy));
    
    let msgId = "lettertracing.msg.tryagain";
    if (finalAccuracy > 90) msgId = "lettertracing.msg.excellent";
    else if (finalAccuracy > 70) msgId = "lettertracing.msg.great";
    else if (finalAccuracy > 50) msgId = "lettertracing.msg.good";

    audioEngine.playTick(settings.soundTheme);
    setScore({ accuracy: finalAccuracy, msg: intl.formatMessage({ id: msgId }) });
    setMastery((prev: any) => ({ ...prev, [currentLetter]: Math.max(prev[currentLetter] || 0, finalAccuracy) }));
  }, [currentLetter, settings.soundTheme, intl, setMastery]);

  const nextLetter = () => {
    const set = CHAR_SETS[charSet];
    const idx = set.indexOf(currentLetter);
    if (idx === -1 || idx === set.length - 1) setCurrentLetter(set[0]);
    else setCurrentLetter(set[idx + 1]);
    clearDrawing();
  };

  const prevLetter = () => {
    const set = CHAR_SETS[charSet];
    const idx = set.indexOf(currentLetter);
    if (idx <= 0) setCurrentLetter(set[set.length - 1]);
    else setCurrentLetter(set[idx - 1]);
    clearDrawing();
  };


  useEffect(() => {
    setOnReset(() => clearDrawing);
    setHelpContent(<HelpContent />);
    return () => {
      clearHeader();
    };
  }, [clearHeader, setOnReset, clearDrawing, setHelpContent]);

  return (
    <div className={`flex flex-col lg:flex-row gap-4 h-full w-full overflow-hidden transition-all duration-500 ease-in-out ${isMobile ? '-mx-2 w-[calc(100%+1rem)]' : ''}`}>
      <div className="flex-[5] lg:flex-1 min-h-0 h-full">
        <ToolPanel baseWidth={isMobile ? 800 : 1000} baseHeight={isMobile ? 1200 : 700}>
        <div className="w-full h-full flex flex-col items-center justify-center relative overflow-hidden">
          <div className="tool-grid-bg opacity-20 pointer-events-none" />
          
          <div className="absolute top-10 left-12 flex items-center gap-4">
             <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white  -rotate-3 border-2 border-white">
                <PenTool size={24} strokeWidth={3} />
             </div>
             <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase leading-none">
                  <FormattedMessage id="lettertracing.label.trace" />
                </h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] leading-none mt-2">
                  <FormattedMessage id="lettertracing.label.letter" />: {currentLetter}
                </p>
             </div>
          </div>

          <div className="relative w-[360px] h-[360px] lg:w-[600px] lg:h-[600px] rounded-[3rem] lg:rounded-[4rem] border-[12px] lg:border-[16px] border-white bg-white group shadow-xl">
            <canvas ref={baseCanvasRef} width={CANVAS_SIZE} height={CANVAS_SIZE} className="absolute top-0 left-0 w-full h-full rounded-[4rem] pointer-events-none" />
            <canvas
              ref={drawCanvasRef}
              width={CANVAS_SIZE}
              height={CANVAS_SIZE}
              className="absolute top-0 left-0 w-full h-full cursor-crosshair touch-none z-10"
              onPointerDown={startDrawing}
              onPointerMove={draw}
              onPointerUp={stopDrawing}
              onPointerOut={stopDrawing}
              onPointerCancel={stopDrawing}
            />
            <canvas ref={hiddenCanvasRef} width={CANVAS_SIZE} height={CANVAS_SIZE} className="hidden" />
            
            <button onClick={prevLetter} className="absolute -left-14 lg:-left-20 top-1/2 -translate-y-1/2 p-3 lg:p-4 bg-white border-4 border-slate-50 rounded-2xl text-slate-300 hover:text-indigo-600 hover:border-indigo-50 transition-all active:scale-90">
              <ChevronLeft size={24} className="lg:hidden" strokeWidth={3} />
              <ChevronLeft size={32} className="hidden lg:block" strokeWidth={3} />
            </button>
            <button onClick={nextLetter} className="absolute -right-14 lg:-right-20 top-1/2 -translate-y-1/2 p-3 lg:p-4 bg-white border-4 border-slate-50 rounded-2xl text-slate-300 hover:text-indigo-600 hover:border-indigo-50 transition-all active:scale-90">
              <ChevronRight size={24} className="lg:hidden" strokeWidth={3} />
              <ChevronRight size={32} className="hidden lg:block" strokeWidth={3} />
            </button>

            <AnimatePresence>
              {score && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }} 
                  animate={{ opacity: 1, scale: 1 }} 
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="absolute inset-0 bg-white/90 backdrop-blur-sm rounded-[4rem] flex flex-col items-center justify-center z-20"
                >
                  <div className="w-32 h-32 rounded-full bg-indigo-600 border-8 border-white flex flex-col items-center justify-center shadow-xl mb-4">
                     <span className="text-4xl font-black text-white">{score.accuracy}%</span>
                  </div>
                  <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter leading-none mb-1">{score.msg}</h3>
                  <p className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-6">
                    <FormattedMessage id="lettertracing.label.precision" />
                  </p>
                  <button onClick={nextLetter} className="py-4 px-8 bg-indigo-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all flex items-center justify-center gap-3">
                    <FormattedMessage id="lettertracing.label.next" /> <ArrowRight size={16} />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="absolute bottom-6 lg:bottom-10 right-8 lg:right-12 flex flex-col gap-3 lg:gap-4">
            <button
              onClick={checkScore}
              className="flex items-center gap-2 px-10 py-3 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all "
            >
              <CheckCircle size={16} /> <FormattedMessage id="lettertracing.label.verify" />
            </button>
            <button
              onClick={clearDrawing}
              className="flex items-center gap-2 px-8 py-3 bg-white border-4 border-slate-50 text-slate-400 rounded-2xl font-black text-xs uppercase tracking-widest hover:border-rose-100 hover:text-rose-600 transition-all "
            >
              <Eraser size={16} /> <FormattedMessage id="lettertracing.label.clear" />
            </button>
          </div>
        </div>
        </ToolPanel>
      </div>

      <div className="flex-[5] lg:flex-none lg:w-72 min-h-0 flex flex-col gap-4 lg:gap-8">
        <div className="flex-1 bg-white p-4 lg:p-6 rounded-[2.5rem] lg:rounded-[3rem] border-4 border-slate-50 flex flex-col gap-4 relative overflow-hidden">
          <div className="flex items-center justify-between border-b-4 border-slate-50 pb-4">
             <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <Award size={20} strokeWidth={3} />
               </div>
               <h4 className="font-black text-slate-900 uppercase tracking-widest text-xs">
                 <FormattedMessage id="lettertracing.label.mastery" />
               </h4>
             </div>
             <div className="flex items-center gap-2">
               <button onClick={() => setMasteryPage(p => Math.max(0, p - 1))} className="p-2 bg-slate-50 rounded-lg text-slate-400 disabled:opacity-20" disabled={masteryPage === 0}>
                 <ChevronLeft size={16} />
               </button>
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{masteryPage + 1} / 3</span>
               <button onClick={() => setMasteryPage(p => Math.min(2, p + 1))} className="p-2 bg-slate-50 rounded-lg text-slate-400 disabled:opacity-20" disabled={masteryPage === 2}>
                 <ChevronRight size={16} />
               </button>
             </div>
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar overflow-x-visible">
            <div className="flex flex-col gap-4 lg:gap-6">
              {[
                { label: 'ABC', set: CHAR_SETS.upper, id: 0 },
                { label: 'abc', set: CHAR_SETS.lower, id: 1 },
                { label: '123', set: CHAR_SETS.numbers, id: 2 }
              ].filter((_, idx) => idx === masteryPage).map((group) => (
                <div key={group.label} className="flex flex-col gap-2 items-start">
                  <div className="w-full flex items-center gap-2">
                    <span className="text-[10px] font-black text-slate-300 tracking-widest">{group.label}</span>
                    <div className="flex-1 h-px bg-slate-100" />
                  </div>
                  <div className="grid grid-cols-13 lg:grid-cols-5 gap-1 lg:gap-2 flex-1 w-full p-1 lg:p-2">
                    {group.set.split('').map(char => {
                      const charScore = mastery[char] || 0;
                      return (
                        <button
                          key={char}
                          onClick={() => {
                            const setKey = group.label === 'ABC' ? 'upper' : group.label === 'abc' ? 'lower' : 'numbers';
                            setCharSet(setKey as any);
                            setCurrentLetter(char);
                            audioEngine.playTick(settings.soundTheme);
                          }}
                          className={`w-full aspect-square rounded-lg lg:rounded-xl font-black text-[8px] lg:text-sm transition-all border-2 flex items-center justify-center relative overflow-hidden ${
                            currentLetter === char ? 'border-indigo-600 bg-white text-indigo-600 scale-110 z-10 shadow-md' : 'border-slate-50 bg-slate-50 text-slate-300 hover:border-indigo-100'
                          }`}
                        >
                          <div 
                            className="absolute bottom-0 left-0 w-full bg-emerald-500/20" 
                            style={{ height: `${charScore}%` }} 
                          />
                          <span className="relative z-10">{char}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LetterTracing;
