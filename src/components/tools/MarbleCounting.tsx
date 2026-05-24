import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, RotateCcw, CheckCircle2, XCircle, Activity, Box, ArrowLeft } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useSettings } from '../../contexts/SettingsContext';
import { useHeader } from '../../contexts/HeaderContext';
import { audioEngine } from '../../utils/audio';
import { ToolPanel } from '../shared/ToolPanel';

// 1. Constants
const MARBLE_TYPES = [
  { name: 'Red', color: 'bg-red-500', text: 'text-red-500' },
  { name: 'Blue', color: 'bg-blue-500', text: 'text-blue-500' },
  { name: 'Green', color: 'bg-green-500', text: 'text-green-500' },
  { name: 'Yellow', color: 'bg-yellow-400', text: 'text-yellow-500' },
  { name: 'Purple', color: 'bg-purple-500', text: 'text-purple-500' },
  { name: 'Orange', color: 'bg-orange-500', text: 'text-orange-500' },
  { name: 'Pink', color: 'bg-rose-500', text: 'text-caution' },
  { name: 'Cyan', color: 'bg-cyan-500', text: 'text-cyan-500' },
];

// 2. Config (None)

// 3. Text (Help and Info)
const HELP_INFO = (
  <div className="space-y-4 font-['Outfit']">
    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">How to Play</h3>
    <div className="space-y-3">
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-primary/5 flex items-center justify-center text-xs font-black text-primary shrink-0">1</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">Pick a <b>Level</b> to start.</p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center text-xs font-black text-blue-600 shrink-0">2</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">Count the marbles of the <b>color</b> we ask for.</p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-success-bg flex items-center justify-center text-xs font-black text-success shrink-0">3</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">Click the <b>Number</b> that matches what you counted.</p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-caution-bg flex items-center justify-center text-xs font-black text-caution shrink-0">4</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">Try to get 10/10! You can also <b>click</b> marbles to push them.</p>
      </div>
    </div>
  </div>
);

// 4. Local Storage (None)

// 5. Classes (None)

// 6. Functions (None)

// 7. Component
export const MarbleCounting = () => {
  const { setHeaderActions, setOnReset, clearHeader, setHelpContent } = useHeader();
  const { settings } = useSettings();
  
  const [gameState, setGameState] = useState('menu'); // 'menu', 'playing', 'result'
  const [difficulty, setDifficulty] = useState('1-5');
  const [marbles, setMarbles] = useState<any[]>([]);
  const [targetType, setTargetType] = useState<any>(null);
  const [targetCount, setTargetCount] = useState(0);
  const [options, setOptions] = useState<number[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<any>(null); // { isCorrect, selected }
  
  const containerRef = useRef<HTMLDivElement>(null);

  const resetGame = useCallback(() => {
    setGameState('menu');
    setMarbles([]);
    setFeedback(null);
    setCurrentIndex(0);
    setScore(0);
    audioEngine.playTick(settings.soundTheme);
  }, [settings.soundTheme]);

  useEffect(() => {
    setOnReset(() => resetGame);
    setHelpContent(HELP_INFO);
    return () => clearHeader();
  }, [clearHeader, setOnReset, resetGame, setHelpContent]);

  const generateMarbles = useCallback((range: string) => {
    const [min, max] = range.split('-').map(Number);
    const selectedTypes = [...MARBLE_TYPES].sort(() => 0.5 - Math.random()).slice(0, 3);
    const target = selectedTypes[Math.floor(Math.random() * selectedTypes.length)];
    
    const newMarbles: any[] = [];
    let tCount = 0;

    selectedTypes.forEach(type => {
      const count = Math.floor(Math.random() * (max - min + 1)) + min;
      if (type.name === target.name) tCount = count;
      
      for (let i = 0; i < count; i++) {
        newMarbles.push({
          id: `${type.name}-${i}-${Math.random()}`,
          name: type.name,
          x: Math.random() * 70 + 15,
          y: Math.random() * 70 + 15,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          color: type.color,
          size: 48,
        });
      }
    });

    const opts = new Set([tCount]);
    while (opts.size < 4) {
      const offset = Math.floor(Math.random() * 7) - 3;
      const fake = Math.max(1, tCount + offset);
      opts.add(fake);
    }
    
    setTargetType(target);
    setTargetCount(tCount);
    setMarbles(newMarbles);
    setOptions(Array.from(opts).sort((a, b) => a - b));
  }, []);

  const updatePhysics = useCallback(() => {
    if (!containerRef.current) return;
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;
    if (width === 0 || height === 0) return;

    const sizePx = 48;
    const sizeXPercent = (sizePx / width) * 100;
    const sizeYPercent = (sizePx / height) * 100;

    setMarbles(prev => {
      const next = prev.map(m => {
        let nx = m.x + m.vx;
        let ny = m.y + m.vy;
        let nvx = m.vx;
        let nvy = m.vy;

        if (nx <= sizeXPercent/2 || nx >= 100 - sizeXPercent/2) nvx *= -1;
        if (ny <= sizeYPercent/2 || ny >= 100 - sizeYPercent/2) nvy *= -1;

        nx = Math.max(sizeXPercent/2, Math.min(100 - sizeXPercent/2, nx));
        ny = Math.max(sizeYPercent/2, Math.min(100 - sizeYPercent/2, ny));

        return { ...m, x: nx, y: ny, vx: nvx, vy: nvy };
      });

      for (let i = 0; i < next.length; i++) {
        for (let j = i + 1; j < next.length; j++) {
          const m1 = next[i];
          const m2 = next[j];
          const dx = (m1.x - m2.x) * (width / 100);
          const dy = (m1.y - m2.y) * (height / 100);
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < sizePx) {
            const v1x = m1.vx;
            const v1y = m1.vy;
            m1.vx = m2.vx;
            m1.vy = m2.vy;
            m2.vx = v1x;
            m2.vy = v1y;
            const overlap = sizePx - distance;
            const nx = dx / distance;
            const ny = dy / distance;
            m1.x += (nx * overlap / 2) * (100 / width);
            m1.y += (ny * overlap / 2) * (100 / height);
            m2.x -= (nx * overlap / 2) * (100 / width);
            m2.y -= (ny * overlap / 2) * (100 / height);
          }
        }
      }
      return next;
    });
  }, []);

  useEffect(() => {
    let frameId: number;
    const loop = () => {
      updatePhysics();
      frameId = requestAnimationFrame(loop);
    };
    
    if (gameState === 'playing') {
      frameId = requestAnimationFrame(loop);
    }
    
    return () => cancelAnimationFrame(frameId);
  }, [gameState, updatePhysics]);

  const startGame = (diff: string) => {
    setDifficulty(diff);
    setCurrentIndex(0);
    setScore(0);
    setGameState('playing');
    generateMarbles(diff);
    audioEngine.playTick(settings.soundTheme);
  };

  const handleAnswer = (val: number) => {
    if (feedback) return;
    const isCorrect = val === targetCount;
    if (isCorrect) {
      setScore(s => s + 1);
      audioEngine.playSuccess(settings.soundTheme);
    } else {
      audioEngine.playError(settings.soundTheme);
    }
    setFeedback({ isCorrect, selected: val });
    
    setTimeout(() => {
      if (currentIndex < 9) {
        setCurrentIndex(i => i + 1);
        generateMarbles(difficulty);
        setFeedback(null);
      } else {
        setGameState('result');
        if (score >= 7) {
          confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
        }
      }
    }, 1500);
  };

  const kickMarble = (id: string) => {
    audioEngine.playTick(settings.soundTheme);
    setMarbles(prev => prev.map(m => 
      m.id === id ? { ...m, vx: -m.vx * 1.8, vy: -m.vy * 1.8 } : m
    ));
  };

  useEffect(() => {
    if (gameState !== 'menu') {
      setHeaderActions(
        <div className="flex items-center gap-4 italic">
          <button onClick={resetGame} className="flex items-center gap-2 px-8 py-2 bg-surface border-2 border-slate-100 text-neutral-400 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] hover:border-caution-border hover:text-caution transition-all active:scale-95 ">
            <ArrowLeft size={14} /> Back
          </button>
        </div>
      );
    } else {
      setHeaderActions(null);
    }
  }, [gameState, resetGame, setHeaderActions]);

  return (
    <ToolPanel className="flex-col items-center justify-center p-4 lg:p-8 italic">
      <AnimatePresence mode="wait">
        {gameState === 'menu' ? (
          <motion.div 
            key="menu"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-2xl bg-surface/80 backdrop-blur-xl rounded-[3rem] p-12  border-none flex flex-col items-center gap-12 text-center italic"
          >
            <div className="space-y-4">
              <h2 className="text-6xl font-black text-slate-900 tracking-tight uppercase leading-none">Marble Counting</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full italic">
              {[
                { id: '1-5', label: 'Easy', range: '1-5', color: 'bg-success-bg text-success border-success-border' },
                { id: '5-10', label: 'Normal', range: '5-10', color: 'bg-primary/5 text-primary border-primary/20' },
                { id: '1-20', label: 'Hard', range: '1-20', color: 'bg-caution-bg text-caution border-caution-border' }
              ].map((diff) => (
                <button
                  key={diff.id}
                  onClick={() => startGame(diff.range)}
                  className={`group flex flex-col items-center gap-4 p-8 rounded-[2.5rem] border-4 transition-all hover:scale-105 active:scale-95  ${diff.color}`}
                >
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-60">{diff.label}</span>
                  <span className="text-4xl font-black">{diff.range}</span>
                </button>
              ))}
            </div>
          </motion.div>
        ) : gameState === 'result' ? (
          <motion.div 
            key="result"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-2xl bg-surface rounded-[3rem] p-16  border-none flex flex-col items-center text-center gap-10 italic"
          >
            <div className="relative">
              <div className="absolute -inset-8 bg-amber-400/20 rounded-full blur-3xl animate-pulse" />
              <div className="w-40 h-40 rounded-[3rem] bg-gradient-to-br from-amber-300 to-amber-500 flex items-center justify-center relative  border-8 border-white rotate-6">
                <Trophy size={80} className="text-white" strokeWidth={1.5} />
              </div>
            </div>
            
            <div className="space-y-4">
              <h2 className="text-7xl font-black text-slate-900 uppercase tracking-tighter leading-none italic">Finished!</h2>
              <div className="flex flex-col items-center gap-2">
                <span className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.4em]">Score</span>
                <div className="text-9xl font-black text-primary tabular-nums tracking-tighter">
                  {score}<span className="text-3xl text-slate-200 ml-2">/10</span>
                </div>
              </div>
            </div>

            <button 
              onClick={resetGame} 
              className="w-full py-6 bg-primary text-white font-black text-xl rounded-[2rem] hover:bg-primary/90 transition-all active:scale-95  flex items-center justify-center gap-4 uppercase tracking-widest"
            >
              <RotateCcw size={24} /> Try Again
            </button>
          </motion.div>
        ) : (
          <div className="w-full max-w-6xl flex flex-col gap-8 h-full italic">
            {/* Header Stats */}
            <div className="flex items-center justify-between px-10 py-6 bg-surface/80 backdrop-blur-xl rounded-[3rem] border-4 border-slate-50  shrink-0">
              <div className="flex items-center gap-6">
                <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-white  border-2 border-white">
                  <Activity size={24} />
                </div>
                <div className="flex flex-col">
                   <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Question</span>
                   <span className="text-2xl font-black text-slate-800 tabular-nums leading-none mt-1">{currentIndex + 1} / 10</span>
                </div>
              </div>
              <div className="flex items-center gap-4 bg-slate-800 px-8 py-4 rounded-[2rem] ">
                <Trophy size={20} className="text-amber-400" />
                <span className="text-2xl font-black text-white tabular-nums leading-none">SCORE: {score}</span>
              </div>
            </div>

            {/* Game Stage */}
            <div className="flex-1 bg-surface rounded-[4rem] relative overflow-hidden  border-none group" ref={containerRef}>
              <div className="tool-grid-bg opacity-20 pointer-events-none" />
              
              {/* Marbles */}
              <AnimatePresence>
                {marbles.map((m) => (
                  <motion.div
                    key={m.id}
                    onClick={() => kickMarble(m.id)}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className={`absolute rounded-full cursor-pointer transition-transform active:scale-75 ${m.color} z-10 `}
                    style={{
                      left: `${m.x}%`,
                      top: `${m.y}%`,
                      width: `${m.size}px`,
                      height: `${m.size}px`,
                      transform: 'translate(-50%, -50%)',
                    }}
                  >
                    <div className="absolute top-1.5 left-1.5 w-3 h-3 bg-surface/40 rounded-full blur-[1px]" />
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Question & Feedback */}
              <div className="absolute bottom-12 left-0 right-0 flex flex-col items-center gap-8 pointer-events-none z-30">
                <div className="px-16 py-4 text-center">
                  <h2 className="text-4xl font-black text-slate-800 tracking-tight leading-none uppercase">
                    How many <span className={`${targetType?.text} px-2 italic underline decoration-4`}>{targetType?.name}</span> marbles?
                  </h2>
                </div>
                
                <div className="flex gap-4 pointer-events-auto">
                  {options.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => handleAnswer(opt)}
                      disabled={!!feedback}
                      className={`w-24 h-24 rounded-3xl text-4xl font-black transition-all active:scale-90  border-4 tabular-nums ${
                        feedback 
                          ? opt === targetCount 
                            ? 'bg-emerald-500 border-emerald-400 text-white' 
                            : feedback.selected === opt 
                              ? 'bg-rose-500 border-rose-400 text-white' 
                              : 'bg-slate-100 border-slate-50 text-slate-300 '
                          : 'bg-surface border-white text-slate-800 hover:border-indigo-400 hover:text-primary hover:-translate-y-2'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Feedback Overlay */}
              <AnimatePresence>
                {feedback && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.1 }}
                    className="absolute inset-0 flex items-center justify-center pointer-events-none z-40 bg-surface/20 backdrop-blur-sm"
                  >
                    <div className={`p-16 rounded-[5rem] -[0_64px_128px_-24px_rgba(0,0,0,0.3)] border-8 flex flex-col items-center gap-6 ${ feedback.isCorrect ? 'bg-emerald-500 text-white border-white/20' : 'bg-rose-500 text-white border-white/20'}`}>
                      { feedback.isCorrect ? <CheckCircle2 size={120} strokeWidth={2.5} /> : <XCircle size={120} strokeWidth={2.5} /> }
                      <span className="text-6xl font-black uppercase tracking-tighter italic">{ feedback.isCorrect ? 'Correct!' : 'Try Again'}</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}
      </AnimatePresence>
    </ToolPanel>
  );
};

export default MarbleCounting;
