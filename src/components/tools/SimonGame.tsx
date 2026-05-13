import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, 
  Play, 
  RotateCcw, 
  Gamepad2, 
  Volume2,
} from 'lucide-react';
import { ToolPanel } from '../shared/ToolPanel';
import confetti from 'canvas-confetti';
import { useSettings } from '../../contexts/SettingsContext';
import { useHeader } from '../../contexts/HeaderContext';
import { audioEngine } from '../../utils/audio';
import { useLocalStorage } from '../../hooks/useLocalStorage';

// 1. Constants
const COLORS = [
  { id: 0, color: 'green', bg: 'bg-green-500', glow: '-[0_0_40px_rgba(34,197,94,0.6)]', activeBg: 'bg-green-300', freq: 415.30 },
  { id: 1, color: 'red', bg: 'bg-red-500', glow: '-[0_0_40px_rgba(239,68,68,0.6)]', activeBg: 'bg-red-300', freq: 311.13 },
  { id: 2, color: 'yellow', bg: 'bg-yellow-400', glow: '-[0_0_40px_rgba(250,204,21,0.6)]', activeBg: 'bg-yellow-200', freq: 247.94 },
  { id: 3, color: 'blue', bg: 'bg-blue-500', glow: '-[0_0_40px_rgba(59,130,246,0.6)]', activeBg: 'bg-blue-300', freq: 207.65 },
];

// 2. Config (None)

// 3. Text (Help and Info)
const HELP_INFO = (
  <div className="space-y-4 font-['Outfit']">
    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">How to Play</h3>
    <div className="space-y-3">
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center text-xs font-black text-indigo-600 shrink-0">1</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">Watch the <b>flashing colors</b> and listen to the sounds.</p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center text-xs font-black text-blue-600 shrink-0">2</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">Click the <b>buttons</b> in the same order.</p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-emerald-50 flex items-center justify-center text-xs font-black text-emerald-600 shrink-0">3</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">Each turn adds <b>one more step</b>.</p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-rose-50 flex items-center justify-center text-xs font-black text-rose-600 shrink-0">4</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">If you miss one, it's game over. Try to beat your <b>Best Score</b>!</p>
      </div>
    </div>
  </div>
);

// 4. Local Storage (In component)

// 5. Classes (None)

// 6. Functions (Helper)
const getNextColor = () => Math.floor(Math.random() * 4);

// 7. Component
export const SimonGame = () => {
  const { settings } = useSettings();
  const { setHeaderActions, setOnReset, clearHeader, setHelpContent } = useHeader();

  const [gameState, setGameState] = useState<'menu' | 'playing' | 'playback' | 'gameover'>('menu');
  const [sequence, setSequence] = useState<number[]>([]);
  const [userStep, setUserStep] = useState(0);
  const [activeButton, setActiveButton] = useState<number | null>(null);
  const [highScore, setHighScore] = useLocalStorage<number>('simon_game_high_score', 0);

  const resetGame = useCallback(() => {
    setGameState('menu');
    setSequence([]);
    setUserStep(0);
    setActiveButton(null);
    audioEngine.playTick(settings.soundTheme);
  }, [settings.soundTheme]);

  useEffect(() => {
    setOnReset(() => resetGame);
    setHelpContent(HELP_INFO);
    return () => clearHeader();
  }, [clearHeader, setOnReset, resetGame, setHelpContent]);

  const playSequence = useCallback(async (newSequence: number[]) => {
    setGameState('playback');
    await new Promise(r => setTimeout(r, 800)); // Pause before starting
    
    for (let i = 0; i < newSequence.length; i++) {
      const colorId = newSequence[i];
      const colorObj = COLORS[colorId];
      
      setActiveButton(colorId);
      audioEngine.playTone(colorObj.freq, 0.4);
      await new Promise(r => setTimeout(r, 500));
      setActiveButton(null);
      await new Promise(r => setTimeout(r, 200));
    }
    
    setGameState('playing');
    setUserStep(0);
  }, []);

  const startGame = () => {
    const firstColor = getNextColor();
    const newSequence = [firstColor];
    setSequence(newSequence);
    playSequence(newSequence);
    audioEngine.playTick(settings.soundTheme);
  };

  const handleButtonClick = useCallback(async (id: number) => {
    if (gameState !== 'playing') return;
    
    const colorObj = COLORS[id];
    audioEngine.playTone(colorObj.freq, 0.2);
    setActiveButton(id);
    setTimeout(() => setActiveButton(null), 200);

    if (id === sequence[userStep]) {
      if (userStep === sequence.length - 1) {
        // Round complete
        const nextColor = getNextColor();
        const nextSequence = [...sequence, nextColor];
        setSequence(nextSequence);
        if (nextSequence.length - 1 > highScore) {
          setHighScore(nextSequence.length - 1);
        }
        playSequence(nextSequence);
      } else {
        setUserStep(prev => prev + 1);
      }
    } else {
      // Game Over
      setGameState('gameover');
      audioEngine.playAlarm(settings.soundTheme);
      if (sequence.length - 1 >= 5) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
    }
  }, [gameState, sequence, userStep, highScore, playSequence, settings.soundTheme, setHighScore]);

  useEffect(() => {
    if (gameState !== 'menu') {
      setHeaderActions(
        <div className="flex items-center gap-4 italic">
          <div className="flex items-center gap-4 px-6 py-2 bg-slate-50 border-2 border-slate-100 rounded-xl ">
            <div className="flex flex-col items-center">
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Score</span>
              <span className="text-xl font-black text-slate-900 tabular-nums leading-none">
                {gameState === 'gameover' ? sequence.length - 1 : sequence.length}
              </span>
            </div>
            <div className="w-px h-6 bg-slate-200" />
            <div className="flex flex-col items-center">
              <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">Best</span>
              <span className="text-xl font-black text-indigo-600 tabular-nums leading-none">
                {highScore}
              </span>
            </div>
          </div>
          <button 
            onClick={resetGame}
            className="flex items-center gap-2 px-8 py-2 bg-white border-2 border-slate-100 text-slate-300 rounded-xl font-black text-[10px] uppercase tracking-widest hover:border-rose-100 hover:text-rose-600 transition-all active:scale-95 "
          >
            <RotateCcw size={14} /> Quit
          </button>
        </div>
      );
    } else {
      setHeaderActions(null);
    }
  }, [gameState, sequence.length, highScore, setHeaderActions, resetGame]);

  return (
    <ToolPanel 
      baseWidth={1200} 
      baseHeight={900} 
      fluid={false}
      className="flex-col items-center justify-center italic"
    >
      <AnimatePresence mode="wait">
        {gameState === 'menu' ? (
          <motion.div 
            key="menu"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="w-full max-w-xl flex flex-col items-center relative z-10 px-4"
          >
            {/* Branding Header */}
            <div className="text-center space-y-4 shrink-0 mb-8 lg:mb-12">
              <div className="space-y-1">
                 <h1 className="text-4xl lg:text-6xl font-black text-slate-900 tracking-tighter uppercase leading-none">Simon Game</h1>
              </div>
            </div>

            <div className="bg-slate-50/50 p-8 lg:p-16 rounded-[3rem] lg:rounded-[4rem] border-4 border-white space-y-8 lg:space-y-12 w-full text-center">
               <div className="p-8 lg:p-10 bg-white rounded-[2.5rem] lg:rounded-[3rem] border-4 border-transparent hover:border-indigo-100 transition-all group">
                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em] mb-3 lg:mb-4 block">Best Score</span>
                  <span className="text-6xl lg:text-7xl font-black text-indigo-600 italic tracking-tighter tabular-nums leading-none block group-hover:scale-110 transition-transform">{highScore}</span>
               </div>

               <button
                onClick={startGame}
                className="w-full h-20 lg:h-24 bg-indigo-600 text-white rounded-[2rem] lg:rounded-[2.5rem] font-black text-xl lg:text-2xl uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-4 lg:gap-6 hover:bg-indigo-700"
              >
                <Play size={28} lg:size={32} fill="currentColor" strokeWidth={0} /> Play
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="playing"
            initial={{ opacity: 0, scale: 1.1, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="flex-1 flex flex-col items-center justify-center relative z-10 w-full"
          >
            {/* Game Over Overlay */}
            <AnimatePresence>
              {gameState === 'gameover' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.1 }}
                  className="absolute inset-0 z-50 flex items-center justify-center bg-white/40 backdrop-blur-xl rounded-[4rem] lg:rounded-[5rem]"
                >
                  <div className="bg-white p-10 lg:p-16 rounded-[3rem] lg:rounded-[4rem] border-8 border-rose-500 flex flex-col items-center gap-8 lg:gap-10 text-center max-w-sm lg:max-w-md w-full mx-4">
                    <div className="w-20 h-20 lg:w-24 lg:h-24 bg-rose-500 rounded-[1.75rem] lg:rounded-[2rem] flex items-center justify-center text-white -rotate-6">
                      <RotateCcw size={40} lg:size={48} strokeWidth={3} />
                    </div>
                    <div>
                      <h2 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tighter uppercase leading-tight mb-2">Game Over</h2>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic">Score: {sequence.length - 1}</p>
                    </div>
                    <div className="flex flex-col gap-3 lg:gap-4 w-full">
                      <button
                        onClick={startGame}
                        className="w-full h-16 lg:h-20 bg-indigo-600 text-white font-black text-lg lg:text-xl uppercase tracking-widest rounded-[1.75rem] lg:rounded-[2rem] hover:bg-indigo-700 transition-all active:scale-95 flex items-center justify-center gap-3 lg:gap-4"
                      >
                        <RotateCcw size={20} lg:size={24} strokeWidth={3} /> Try Again
                      </button>
                      <button
                        onClick={resetGame}
                        className="w-full h-14 lg:h-16 bg-slate-50 text-slate-400 font-black text-[11px] lg:text-[12px] uppercase tracking-widest rounded-2xl hover:bg-slate-100 transition-all"
                      >
                        Quit
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* The Simon Circle Interface */}
            <div className={`grid grid-cols-2 gap-4 lg:gap-8 p-8 lg:p-12 bg-slate-900 rounded-[4rem] lg:rounded-[6rem] relative transition-all duration-700 ${gameState === 'gameover' ? 'opacity-20 blur-xl scale-90 rotate-3 pointer-events-none' : 'scale-100'}`}>
              <div className="absolute inset-0 bg-indigo-500/5 rounded-[4rem] lg:rounded-[6rem] animate-pulse pointer-events-none" />
              
              {COLORS.map((color) => (
                <button
                  key={color.id}
                  onClick={() => handleButtonClick(color.id)}
                  disabled={gameState !== 'playing'}
                  className={`
                    w-36 h-36 lg:w-56 lg:h-56 rounded-[2.5rem] lg:rounded-[4.5rem] transition-all duration-300 border-8 border-white/5 relative overflow-hidden group
                    ${activeButton === color.id ? `${color.activeBg} ${color.glow} scale-105` : `${color.bg} opacity-40 hover:opacity-100 hover:border-white/20`}
                    ${gameState === 'playing' ? 'cursor-pointer active:scale-90 active:opacity-100' : 'cursor-default'}
                  `}
                >
                  <div className="absolute inset-3 border-4 border-white/10 rounded-[2.25rem] lg:rounded-[3.5rem] pointer-events-none" />
                  <div className="absolute top-4 lg:top-6 left-4 lg:left-6 w-2.5 h-2.5 lg:w-3 lg:h-3 rounded-full bg-white/20 group-hover:bg-white/40 transition-colors pointer-events-none" />
                </button>
              ))}
              
              {/* Central Core Indicator */}
              <div className="absolute inset-0 m-auto w-24 h-24 lg:w-44 lg:h-44 bg-slate-900 rounded-full flex items-center justify-center border-[8px] lg:border-[12px] border-slate-800 group/center">
                <div className="text-center relative">
                  <div className="absolute -inset-10 lg:-inset-12 bg-indigo-500/20 rounded-full blur-2xl lg:blur-3xl opacity-0 group-hover/center:opacity-100 transition-opacity" />
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={gameState}
                      initial={{ opacity: 0, scale: 0.5, rotate: -45 }}
                      animate={{ opacity: 1, scale: 1, rotate: 0 }}
                      exit={{ opacity: 0, scale: 0.5, rotate: 45 }}
                      className="relative z-10"
                    >
                      {gameState === 'playback' ? (
                        <div className="flex flex-col items-center gap-1 lg:gap-2">
                           <Volume2 size={32} lg:size={40} className="text-indigo-400 animate-bounce" strokeWidth={3} />
                        </div>
                      ) : gameState === 'playing' ? (
                        <div className="flex flex-col items-center gap-1 lg:gap-2">
                           <div className="w-3 h-3 lg:w-4 lg:h-4 bg-emerald-400 rounded-full animate-pulse" />
                        </div>
                      ) : (
                        <Gamepad2 size={32} lg:size={40} className="text-slate-700" strokeWidth={1} />
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Status Feedback */}
            <div className="mt-12 lg:mt-16 text-center italic">
              <p className="text-[11px] lg:text-[12px] font-black text-slate-300 uppercase tracking-[0.4em] lg:tracking-[0.6em] animate-pulse">
                {gameState === 'playback' ? "Watch..." : 
                 gameState === 'playing' ? "Your turn!" : "Ready?"}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </ToolPanel>
  );
};

export default SimonGame;
