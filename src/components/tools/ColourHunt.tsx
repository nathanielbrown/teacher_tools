import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  RotateCcw, 
  Palette, 
  Timer,
  ChevronRight,
  SkipForward,
  Square,
  Play
} from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';
import { useHeader } from '../../contexts/HeaderContext';
import { ToolPanel } from '../shared/ToolPanel';
import { FormattedMessage } from 'react-intl';
import { audioEngine } from '../../utils/audio';

// 1. Constants
const HUNT_COLORS = [
  { name: 'Red', hex: '#ef4444' },
  { name: 'Blue', hex: '#3b82f6' },
  { name: 'Green', hex: '#22c55e' },
  { name: 'Yellow', hex: '#eab308' },
  { name: 'Pink', hex: '#ec4899' },
  { name: 'Orange', hex: '#f97316' },
  { name: 'Purple', hex: '#a855f7' },
  { name: 'Teal', hex: '#14b8a6' },
  { name: 'Cyan', hex: '#06b6d4' },
  { name: 'Indigo', hex: '#6366f1' },
  { name: 'Lime', hex: '#84cc16' },
  { name: 'Amber', hex: '#f59e0b' }
];

// 2. Config (None)

// 3. Text (Help and Info)
const HelpContent = () => (
  <div className="space-y-4 font-['Outfit']">
    <div className="space-y-3 italic">
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center text-xs font-black text-indigo-600 shrink-0">1</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">
          <FormattedMessage id="colourHunt.help.step1" defaultMessage="Pick a Time Limit (30s, 1m, or 2m) for the hunt." />
        </p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-rose-50 flex items-center justify-center text-xs font-black text-rose-600 shrink-0">2</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">
          <FormattedMessage id="colourHunt.help.step2" defaultMessage="Click Start Hunt to reveal a random target color." />
        </p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-emerald-50 flex items-center justify-center text-xs font-black text-emerald-600 shrink-0">3</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">
          <FormattedMessage id="colourHunt.help.step3" defaultMessage="Students must find an object of that color in the classroom before the timer runs out!" />
        </p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-slate-900 flex items-center justify-center text-xs font-black text-white shrink-0">4</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">
          <FormattedMessage id="colourHunt.help.step4" defaultMessage="You can stop the timer early or click Play Again to find a new color." />
        </p>
      </div>
    </div>
  </div>
);

// 4. Local Storage (None)

// 5. Classes (None)

// 6. Functions (None)

// 7. Component
export const ColourHunt = () => {
  const { setHelpContent, clearHeader } = useHeader();
  const { settings } = useSettings();
  
  const [gameState, setGameState] = useState<'ready' | 'hunting' | 'finished'>('ready');
  const [targetColor, setTargetColor] = useState(HUNT_COLORS[0]);
  const [duration, setDuration] = useState(60);
  const [timer, setTimer] = useState(60);
  
  const timerRef = useRef<number | null>(null);

  const startHunt = useCallback(() => {
    const randomColor = HUNT_COLORS[Math.floor(Math.random() * HUNT_COLORS.length)];
    setTargetColor(randomColor);
    setTimer(duration);
    setGameState('hunting');
    audioEngine.playTick(settings.soundTheme);
  }, [duration, settings.soundTheme]);

  const stopHunt = useCallback(() => {
    setGameState('finished');
    if (timerRef.current) window.clearInterval(timerRef.current);
    audioEngine.playTick(settings.soundTheme);
  }, [settings.soundTheme]);

  const skipColor = useCallback(() => {
    const randomColor = HUNT_COLORS[Math.floor(Math.random() * HUNT_COLORS.length)];
    setTargetColor(randomColor);
    setTimer(duration);
    audioEngine.playTick(settings.soundTheme);
  }, [duration, settings.soundTheme]);

  const playAgain = useCallback(() => {
    startHunt();
  }, [startHunt]);

  useEffect(() => {
    if (gameState === 'hunting') {
      timerRef.current = window.setInterval(() => {
        setTimer(prev => {
          if (prev <= 1) {
            setGameState('finished');
            if (timerRef.current) window.clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [gameState]);

  useEffect(() => {
    setHelpContent(<HelpContent />);
    return () => clearHeader();
  }, [clearHeader, setHelpContent]);

  return (
    <ToolPanel className="italic" baseWidth={1000} baseHeight={800}>
      <div className="w-full max-w-4xl flex flex-col items-center gap-12 relative z-10">

        <div className="w-full relative flex flex-col gap-8">
          <AnimatePresence mode="wait">
            {gameState === 'ready' ? (
              <motion.div
                key="ready"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                className="bg-white rounded-[3.5rem] border-4 border-slate-50 p-12 lg:p-20 flex flex-col items-center text-center gap-10 "
              >
                <div className="w-24 h-24 bg-slate-50 rounded-[2rem] flex items-center justify-center text-indigo-600  border-4 border-white">
                  <Palette size={48} strokeWidth={3} />
                </div>
                <button
                  onClick={startHunt}
                  className="mt-4 flex items-center gap-6 px-12 py-8 bg-indigo-600 text-white rounded-[2.5rem] font-black uppercase tracking-widest text-2xl hover:bg-indigo-700 transition-all active:scale-95 "
                >
                  <FormattedMessage id="colourHunt.start" defaultMessage="Start Hunt" />
                </button>
              </motion.div>
            ) : (
              <div className="flex flex-col gap-10 w-full items-center">
                <motion.div
                  key="active"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="w-full rounded-[4rem] p-12 lg:p-20 flex flex-col items-center justify-center min-h-[400px]  relative overflow-hidden transition-colors duration-700 border-8 border-white/20"
                  style={{ backgroundColor: targetColor.hex }}
                >
                  <div className="relative z-10 flex flex-col items-center gap-10">
                    <motion.h2 
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      className="text-8xl lg:text-[12rem] font-black text-white uppercase tracking-tighter -[0_20px_40px_rgba(0,0,0,0.3)] text-center leading-none italic"
                    >
                      <FormattedMessage id={`colourHunt.color.${targetColor.name.toLowerCase()}`} defaultMessage={targetColor.name} />
                    </motion.h2>

                    <AnimatePresence>
                      {gameState === 'finished' && (
                        <motion.div
                          initial={{ scale: 0, rotate: -10 }}
                          animate={{ scale: 1, rotate: 0 }}
                          className="bg-indigo-600 px-10 py-4 rounded-[2rem] border-4 border-white/20 "
                        >
                          <span className="text-3xl font-black text-white uppercase tracking-widest italic">
                            <FormattedMessage id="colourHunt.timesUp" defaultMessage="Time's Up!" />
                          </span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>

                {/* Controls under the color */}
                <div className="flex flex-wrap items-center justify-center gap-6 w-full">
                  <div className="bg-white px-10 py-6 rounded-[2.5rem] border-4 border-slate-50  flex flex-col items-center justify-center min-w-[200px]">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Time Left</div>
                    <div className="text-6xl font-black text-indigo-600 tabular-nums tracking-tighter leading-none italic">{timer}s</div>
                  </div>

                  {gameState === 'hunting' && (
                    <div className="flex gap-4">
                      <button
                        onClick={stopHunt}
                        className="w-20 h-20 bg-white border-4 border-slate-50 rounded-3xl flex items-center justify-center text-slate-400 hover:text-rose-500 hover:border-rose-100 transition-all active:scale-95 "
                        title="Stop Hunt"
                      >
                        <Square size={32} fill="currentColor" />
                      </button>
                      <button
                        onClick={skipColor}
                        className="w-20 h-20 bg-white border-4 border-slate-50 rounded-3xl flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:border-indigo-100 transition-all active:scale-95 "
                        title="Skip Color"
                      >
                        <SkipForward size={32} fill="currentColor" />
                      </button>
                    </div>
                  )}

                  {gameState === 'finished' && (
                    <button
                      onClick={playAgain}
                      className="flex items-center gap-4 px-12 py-8 bg-indigo-600 text-white rounded-[2.5rem] font-black uppercase tracking-widest text-xl hover:bg-indigo-700 transition-all active:scale-95  italic"
                    >
                      <Play size={28} fill="currentColor" /> <FormattedMessage id="colourHunt.playAgain" defaultMessage="Play Again" />
                    </button>
                  )}
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>

        {gameState === 'ready' && (
          <div className="w-full max-w-3xl bg-white rounded-[3rem] border-4 border-slate-50 p-8 flex flex-wrap items-center justify-center gap-8 ">
            <div className="flex items-center gap-3">
              {[30, 60, 120].map(s => (
                <button
                  key={s}
                  onClick={() => { setDuration(s); setTimer(s); audioEngine.playTick(settings.soundTheme); }}
                  className={`px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${
                    duration === s ? 'bg-indigo-600 text-white ' : 'bg-slate-50 text-slate-400 hover:bg-white hover:border-indigo-100 border-4 border-transparent'
                  }`}
                >
                  {s >= 60 ? `${s / 60}m` : `${s}s`}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-50 rounded-full blur-[150px] opacity-40 -z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-rose-50 rounded-full blur-[150px] opacity-40 -z-10 pointer-events-none" />
    </ToolPanel>
  );
};

export default ColourHunt;
