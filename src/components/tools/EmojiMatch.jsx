import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, RotateCcw, Play, Star, Zap, Brain, ChevronRight } from 'lucide-react';
import confetti from 'canvas-confetti';
import { audioEngine } from '../../utils/audio';
import { useSettings } from '../../contexts/SettingsContext';
import { ToolHeader } from '../ToolHeader';

const EMOJIS = [
  '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', 
  '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🦄',
  '🍎', '🍌', '🍉', '🍇', '🍓', '🍒', '🍍', '🥝',
  '🚀', '🛸', '🛰', '🪐', '🌟', '☄️', '🌙', '🌞',
  '🎨', '🎭', '🎪', '🎫', '🎬', '🎤', '🎧', '🎷'
];

const LEVELS = {
  easy: { rows: 2, cols: 4, name: 'Easy' },
  medium: { rows: 4, cols: 4, name: 'Medium' },
  hard: { rows: 6, cols: 6, name: 'Hard' }
};

export const EmojiMatch = () => {
  const { settings } = useSettings();
  const [status, setStatus] = useState('setup'); // 'setup', 'playing', 'finished'
  const [level, setLevel] = useState('easy');
  const [cards, setCards] = useState([]);
  const [flipped, setFlipped] = useState([]); // indices
  const [matched, setMatched] = useState([]); // emoji values or indices? indices is better
  const [moves, setMoves] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const initGame = useCallback((lvlKey) => {
    const lvl = LEVELS[lvlKey];
    const totalCards = lvl.rows * lvl.cols;
    const numPairs = totalCards / 2;
    
    // Select random emojis for pairs
    const selectedEmojis = [...EMOJIS].sort(() => Math.random() - 0.5).slice(0, numPairs);
    const deck = [...selectedEmojis, ...selectedEmojis]
      .sort(() => Math.random() - 0.5)
      .map((emoji, idx) => ({ id: idx, emoji }));
    
    setCards(deck);
    setFlipped([]);
    setMatched([]);
    setMoves(0);
    setStatus('playing');
    setIsProcessing(false);
  }, []);

  const handleCardClick = (idx) => {
    if (isProcessing || flipped.includes(idx) || matched.includes(idx)) return;

    const newFlipped = [...flipped, idx];
    setFlipped(newFlipped);
    audioEngine.playTick(settings.soundTheme);

    if (newFlipped.length === 2) {
      setMoves(m => m + 1);
      setIsProcessing(true);
      
      const [firstIdx, secondIdx] = newFlipped;
      if (cards[firstIdx].emoji === cards[secondIdx].emoji) {
        // Match!
        setTimeout(() => {
          setMatched(prev => [...prev, firstIdx, secondIdx]);
          setFlipped([]);
          setIsProcessing(false);
          audioEngine.playTick(settings.soundTheme);

          if (matched.length + 2 === cards.length) {
            confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
            setTimeout(() => setStatus('finished'), 1000);
          }
        }, 600);
      } else {
        // No match
        setTimeout(() => {
          setFlipped([]);
          setIsProcessing(false);
        }, 1000);
      }
    }
  };

  return (
    <div className="w-full mx-auto space-y-8 px-4 pt-2 pb-8 h-full flex flex-col">
      <ToolHeader
        title="Emoji Match"
        icon={Brain}
        description="Memory Training Game"
        infoContent={
          <>
            <p>
              <strong className="text-white block mb-1">How to Play</strong>
              Click cards to flip them. Find two cards with the same emoji to clear them from the board.
            </p>
            <p>
              <strong className="text-white block mb-1">Difficulty Levels</strong>
              Easy (2x4), Medium (4x4), and Hard (6x6) modes are available to test different memory capacities.
            </p>
          </>
        }
      >
        {status !== 'setup' && (
          <button
            onClick={() => setStatus('setup')}
            className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:text-red-500 transition-all"
            title="Return to Menu"
          >
            <RotateCcw size={20} />
          </button>
        )}
      </ToolHeader>

      {status === 'setup' && (
        <div className="flex-1 flex flex-col items-center justify-center animate-in fade-in zoom-in duration-300">
          <div className="bg-white p-10 rounded-[3rem] shadow-2xl border border-slate-100 w-full max-w-xl space-y-8">
            <h3 className="text-2xl font-black text-center text-slate-700">Choose Difficulty</h3>
            <div className="grid gap-4">
              {Object.entries(LEVELS).map(([key, lvl]) => (
                <button
                  key={key}
                  onClick={() => { setLevel(key); initGame(key); }}
                  className="group relative w-full p-6 bg-slate-50 hover:bg-primary/5 border-4 border-transparent hover:border-primary rounded-[2rem] transition-all flex items-center justify-between overflow-hidden"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-lg group-hover:scale-110 transition-transform ${
                      key === 'easy' ? 'bg-green-100 text-green-600' : 
                      key === 'medium' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'
                    }`}>
                      {key === 'easy' ? <Star fill="currentColor" /> : 
                       key === 'medium' ? <Zap fill="currentColor" /> : <Brain fill="currentColor" />}
                    </div>
                    <div className="text-left">
                      <div className="font-black text-xl text-slate-700">{lvl.name}</div>
                      <div className="text-slate-400 font-bold uppercase text-xs tracking-widest">
                        {lvl.rows * lvl.cols} Cards • {lvl.rows}x{lvl.cols} Grid
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="text-slate-300 group-hover:text-primary group-hover:translate-x-2 transition-all" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {status === 'playing' && (
        <div className="flex-1 flex flex-col space-y-8 animate-in slide-in-from-bottom-8 duration-500">
          <div className="flex justify-center gap-8">
            <div className="bg-white px-8 py-3 rounded-2xl shadow-lg border-b-4 border-slate-100 flex items-center gap-3">
              <span className="text-slate-400 font-black uppercase text-xs tracking-widest">Moves</span>
              <span className="text-primary font-black text-2xl">{moves}</span>
            </div>
            <div className="bg-white px-8 py-3 rounded-2xl shadow-lg border-b-4 border-slate-100 flex items-center gap-3">
              <span className="text-slate-400 font-black uppercase text-xs tracking-widest">Pairs</span>
              <span className="text-primary font-black text-2xl">{matched.length / 2} / {cards.length / 2}</span>
            </div>
          </div>

          <div 
            className="grid gap-3 sm:gap-6 justify-center w-full px-4"
            style={{ 
              gridTemplateColumns: `repeat(${LEVELS[level].cols}, 1fr)`,
              maxWidth: level === 'hard' ? '900px' : level === 'medium' ? '700px' : '500px',
              margin: '0 auto'
            }}
          >
            {cards.map((card, idx) => {
              const isFlipped = flipped.includes(idx) || matched.includes(idx);
              const isMatched = matched.includes(idx);
              
              return (
                <div 
                  key={idx}
                  onClick={() => handleCardClick(idx)}
                  className={`aspect-square cursor-pointer ${isMatched ? 'pointer-events-none opacity-0 scale-75 transition-all duration-500 delay-300' : ''}`}
                  style={{ perspective: '1000px' }}
                >
                  <motion.div
                    initial={false}
                    animate={{ rotateY: isFlipped ? 180 : 0 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                    className="relative w-full h-full"
                    style={{ transformStyle: 'preserve-3d' }}
                  >
                    {/* Front (Hidden) */}
                    <div 
                      className="absolute inset-0 bg-white rounded-2xl sm:rounded-3xl shadow-lg border-4 border-slate-100 flex items-center justify-center hover:bg-slate-50 transition-colors"
                      style={{ backfaceVisibility: 'hidden' }}
                    >
                      <div className="w-10 h-10 sm:w-16 sm:h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-300 font-bold text-xl sm:text-3xl">
                        ?
                      </div>
                    </div>
                    
                    {/* Back (Emoji) */}
                    <div 
                      className="absolute inset-0 bg-primary rounded-2xl sm:rounded-3xl shadow-xl flex items-center justify-center text-4xl sm:text-7xl border-4 border-white/20"
                      style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                    >
                      {card.emoji}
                    </div>
                  </motion.div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-center">
            <button
              onClick={() => setStatus('setup')}
              className="flex items-center gap-2 text-slate-400 hover:text-red-500 font-bold transition-colors"
            >
              <RotateCcw size={20} /> Quit Game
            </button>
          </div>
        </div>
      )}

      {status === 'finished' && (
        <div className="flex-1 flex flex-col items-center justify-center animate-in zoom-in duration-500">
          <div className="bg-slate-900 p-16 rounded-[4rem] shadow-2xl text-white text-center space-y-10 max-w-md w-full border border-white/10">
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-yellow-500 blur-3xl opacity-20" />
              <div className="relative bg-yellow-500/20 p-8 rounded-[2rem] border-4 border-yellow-500/50">
                <Trophy size={80} className="text-yellow-500" />
              </div>
            </div>
            
            <div className="space-y-4">
              <h2 className="text-5xl font-black italic uppercase tracking-tighter">Amazing!</h2>
              <p className="text-slate-400 text-xl font-medium">You matched all emojis in {moves} moves.</p>
            </div>

            <button
              onClick={() => setStatus('setup')}
              className="w-full py-6 bg-white text-slate-900 rounded-2xl font-black text-2xl hover:scale-105 active:scale-95 transition-all shadow-xl"
            >
              PLAY AGAIN
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
