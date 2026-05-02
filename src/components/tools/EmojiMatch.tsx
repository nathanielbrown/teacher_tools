import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, 
  RotateCcw, 
  Star, 
  Zap, 
  Brain, 
  Timer,
  ChevronLeft,
} from 'lucide-react';
import { ToolPanel } from '../shared/ToolPanel';
import confetti from 'canvas-confetti';
import { audioEngine } from '../../utils/audio';
import { useSettings } from '../../contexts/SettingsContext';
import { useHeader } from '../../contexts/HeaderContext';

// 1. Constants
const EMOJIS = [
  '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', 
  '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🦄',
  '🍎', '🍌', '🍉', '🍇', '🍓', '🍒', '🍍', '🥝',
  '🚀', '🛸', '🛰', '🪐', '🌟', '☄️', '🌙', '🌞',
  '🎨', '🎭', '🎪', '🎫', '🎬', '🎤', '🎧', '🎷'
];

const LEVELS = {
  easy: { rows: 2, cols: 4, name: 'Easy', color: '#10b981', icon: Star, label: '8 Cards' },
  medium: { rows: 4, cols: 4, name: 'Medium', color: '#6366f1', icon: Zap, label: '16 Cards' },
  hard: { rows: 6, cols: 6, name: 'Hard', color: '#f43f5e', icon: Brain, label: '36 Cards' }
};

// 2. Config (None)

// 3. Text (Help and Info)
const HELP_INFO = (
  <div className="space-y-4 font-['Outfit']">
    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">How to Play</h3>
    <div className="space-y-3">
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center text-xs font-black text-indigo-600 shrink-0">1</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">Pick a <b>Level</b> (Easy, Medium, or Hard) to start.</p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center text-xs font-black text-blue-600 shrink-0">2</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">Click a <b>Card</b> to see the emoji. Then click another one to find its match!</p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-rose-50 flex items-center justify-center text-xs font-black text-rose-600 shrink-0">3</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">If they match, they stay <b>face up</b>. If not, they hide again.</p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-emerald-50 flex items-center justify-center text-xs font-black text-emerald-600 shrink-0">4</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">Try to find all the pairs in <b>few moves</b>!</p>
      </div>
    </div>
  </div>
);

// 4. Local Storage (None)

// 5. Classes (None)

// 6. Functions (None)

// 7. Component
export const EmojiMatch = () => {
  const { setHeaderActions, clearHeader, setHelpContent, setOnReset } = useHeader();
  const { settings } = useSettings();
  const [status, setStatus] = useState('setup'); // 'setup', 'playing', 'finished'
  const [level, setLevel] = useState<keyof typeof LEVELS>('easy');
  const [cards, setCards] = useState<any[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]); // indices
  const [matched, setMatched] = useState<number[]>([]); // indices
  const [moves, setMoves] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);

  const initGame = useCallback((lvlKey: keyof typeof LEVELS) => {
    const lvl = LEVELS[lvlKey];
    const totalCards = lvl.rows * lvl.cols;
    const numPairs = totalCards / 2;
    
    const selectedEmojis = [...EMOJIS].sort(() => Math.random() - 0.5).slice(0, numPairs);
    const deck = [...selectedEmojis, ...selectedEmojis]
      .sort(() => Math.random() - 0.5)
      .map((emoji, idx) => ({ id: idx, emoji }));
    
    setCards(deck);
    setFlipped([]);
    setMatched([]);
    setMoves(0);
    setElapsed(0);
    setStartTime(Date.now());
    setStatus('playing');
    setIsProcessing(false);
    setLevel(lvlKey);
  }, []);

  const handleCardClick = (idx: number) => {
    if (isProcessing || flipped.includes(idx) || matched.includes(idx)) return;

    const newFlipped = [...flipped, idx];
    setFlipped(newFlipped);
    audioEngine.playTick(settings.soundTheme);

    if (newFlipped.length === 2) {
      setMoves(m => m + 1);
      setIsProcessing(true);
      
      const [firstIdx, secondIdx] = newFlipped;
      if (cards[firstIdx].emoji === cards[secondIdx].emoji) {
        setTimeout(() => {
          const newMatched = [...matched, firstIdx, secondIdx];
          setMatched(newMatched);
          setFlipped([]);
          setIsProcessing(false);
          audioEngine.playSuccess(settings.soundTheme);

          if (newMatched.length === cards.length) {
            confetti({ 
               particleCount: 150, 
               spread: 100, 
               origin: { y: 0.6 },
               colors: ['#6366f1', '#10b981', '#f59e0b', '#f43f5e']
            });
            setTimeout(() => setStatus('finished'), 1000);
          }
        }, 600);
      } else {
        setTimeout(() => {
          setFlipped([]);
          setIsProcessing(false);
        }, 800);
      }
    }
  };

  useEffect(() => {
    let interval: any;
    if (status === 'playing' && startTime) {
      interval = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [status, startTime]);

  useEffect(() => {
    setHelpContent(HELP_INFO);
    setOnReset(() => () => setStatus('setup'));
    return () => clearHeader();
  }, [clearHeader, setHelpContent, setOnReset]);

  useEffect(() => {
    setHeaderActions(null);
  }, [setHeaderActions]);

  return (
    <ToolPanel className="flex-col items-center justify-center italic">
      <AnimatePresence mode="wait">
        {status === 'setup' ? (
          <motion.div
            key="setup"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-5xl flex flex-col items-center gap-16 lg:gap-24 italic"
          >
            <div className="text-center space-y-4">
              <div className="w-24 h-24 bg-indigo-600 rounded-[2rem] flex items-center justify-center text-white mx-auto   rotate-3 border-4 border-white">
                <Brain size={48} />
              </div>
              <h1 className="text-6xl lg:text-7xl font-black text-slate-900 tracking-tight uppercase italic leading-none">Emoji Match</h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-4xl">
              {(Object.entries(LEVELS) as [keyof typeof LEVELS, any][]).map(([key, lvl]) => (
                <button
                  key={key}
                  onClick={() => { initGame(key); audioEngine.playTick(settings.soundTheme); }}
                  className="group p-10 bg-white border-4 border-slate-50 rounded-[3rem] hover:border-indigo-100  transition-all flex flex-col items-center gap-6  active:scale-95"
                >
                  <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center group-hover:scale-110 transition-transform " style={{ color: lvl.color }}>
                    <lvl.icon size={32} />
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-3xl font-black text-slate-800 uppercase tracking-tighter">{lvl.name}</span>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{lvl.label}</span>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        ) : status === 'finished' ? (
          <motion.div
            key="finished"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-3xl flex flex-col items-center gap-12 text-center italic"
          >
            <div className="space-y-6">
              <div className="w-40 h-40 bg-amber-400 rounded-[3rem] flex items-center justify-center text-white mx-auto   relative border-8 border-white/20 rotate-12">
                <Trophy size={80} />
                <div className="absolute -top-4 -right-4 w-16 h-16 bg-white rounded-full flex items-center justify-center text-amber-500  border-4 border-amber-50 animate-bounce">
                  <Star fill="currentColor" size={32} />
                </div>
              </div>
              <div className="space-y-2">
                <h2 className="text-7xl font-black text-slate-900 uppercase tracking-tighter leading-none">Winner!</h2>
              </div>
            </div>

            <div className="flex items-center justify-center gap-12">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Time</span>
                <span className="text-5xl font-black text-slate-800 tabular-nums">{elapsed}s</span>
              </div>
              <div className="w-px h-12 bg-slate-100" />
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Moves</span>
                <span className="text-5xl font-black text-slate-800 tabular-nums">{moves}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-6 w-full max-w-md">
              <button
                onClick={() => setStatus('setup')}
                className="flex-1 py-6 bg-slate-100 text-slate-600 font-black text-lg rounded-2xl hover:bg-slate-200 transition-all active:scale-95 uppercase tracking-widest"
              >
                Exit
              </button>
              <button
                onClick={() => initGame(level)}
                className="flex-1 py-6 bg-slate-900 text-white font-black text-lg rounded-2xl hover:bg-indigo-600 transition-all active:scale-95   uppercase tracking-widest"
              >
                Play Again
              </button>
            </div>
          </motion.div>
        ) : (
          <div className="w-full h-full flex flex-col items-center gap-8 lg:gap-12 italic">
            {/* HUD */}
            <div className="w-full max-w-4xl flex items-center justify-between px-12 py-6 bg-white/80 backdrop-blur-xl rounded-[3rem] border-4 border-slate-50 ">
              <div className="flex items-center gap-12">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Moves</span>
                  <span className="text-3xl font-black text-slate-800 tabular-nums leading-none mt-1">{moves}</span>
                </div>
                <div className="w-px h-10 bg-slate-100" />
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Found</span>
                  <span className="text-3xl font-black text-indigo-600 tabular-nums leading-none mt-1">{matched.length / 2} / {cards.length / 2}</span>
                </div>
              </div>
              <div className="flex items-center gap-4 bg-slate-900 px-8 py-3 rounded-2xl ">
                <Timer size={20} className="text-indigo-400" />
                <span className="text-2xl tabular-nums font-black text-white">{elapsed}s</span>
              </div>
            </div>

            {/* Grid */}
            <div 
              className="grid gap-4 lg:gap-6 w-fit mx-auto overflow-y-auto pr-2 max-h-[70vh] p-4 no-scrollbar"
              style={{ 
                gridTemplateColumns: `repeat(${LEVELS[level].cols}, 1fr)`,
              }}
            >
              {cards.map((card, idx) => {
                const isFlipped = flipped.includes(idx) || matched.includes(idx);
                const isMatched = matched.includes(idx);
                
                return (
                  <motion.div 
                    key={idx}
                    onClick={() => handleCardClick(idx)}
                    className="aspect-square cursor-pointer"
                    style={{ perspective: '1000px', width: level === 'hard' ? '80px' : '120px' }}
                  >
                    <motion.div
                      animate={{ 
                        rotateY: isFlipped ? 180 : 0,
                        scale: isMatched ? [1, 1.1, 0.9, 1] : 1
                      }}
                      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                      className="relative w-full h-full"
                      style={{ transformStyle: 'preserve-3d' }}
                    >
                      {/* Back */}
                      <div 
                        className={`absolute inset-0 rounded-[2rem] border-4 flex items-center justify-center transition-all ${
                          isMatched ? 'bg-indigo-50 border-indigo-100 text-indigo-200' : 'bg-white border-slate-100 text-slate-200 hover:border-indigo-200 '
                        }`}
                        style={{ backfaceVisibility: 'hidden' }}
                      >
                         <div className="w-10 h-10 rounded-full bg-slate-50" />
                      </div>
                      
                      {/* Front */}
                      <div 
                        className="absolute inset-0 bg-white rounded-[2rem] border-8 border-white flex items-center justify-center text-4xl lg:text-6xl not-italic"
                        style={{ 
                          backfaceVisibility: 'hidden', 
                          transform: 'rotateY(180deg)',
                          backgroundColor: isMatched ? '#f8fafc' : 'white'
                        }}
                      >
                        {card.emoji}
                      </div>
                    </motion.div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </AnimatePresence>
    </ToolPanel>
  );
};

export default EmojiMatch;
