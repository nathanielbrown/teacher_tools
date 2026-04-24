import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Play, RotateCcw, ArrowLeft, Gamepad2, Volume2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { audioEngine } from '../../utils/audio';
import { useSettings } from '../../contexts/SettingsContext';
import { ToolHeader } from '../ToolHeader';

const COLORS = [
  { id: 0, color: 'green', bg: 'bg-green-500', glow: 'shadow-[0_0_40px_rgba(34,197,94,0.6)]', activeBg: 'bg-green-300', freq: 415.30 },
  { id: 1, color: 'red', bg: 'bg-red-500', glow: 'shadow-[0_0_40px_rgba(239,68,68,0.6)]', activeBg: 'bg-red-300', freq: 311.13 },
  { id: 2, color: 'yellow', bg: 'bg-yellow-400', glow: 'shadow-[0_0_40px_rgba(250,204,21,0.6)]', activeBg: 'bg-yellow-200', freq: 247.94 },
  { id: 3, color: 'blue', bg: 'bg-blue-500', glow: 'shadow-[0_0_40px_rgba(59,130,246,0.6)]', activeBg: 'bg-blue-300', freq: 207.65 },
];

export const SimonGame = () => {
  const [gameState, setGameState] = useState('menu'); // 'menu', 'playing', 'playback', 'gameover'
  const [sequence, setSequence] = useState([]);
  const [userStep, setUserStep] = useState(0);
  const [activeButton, setActiveButton] = useState(null);
  const [highScore, setHighScore] = useState(() => parseInt(localStorage.getItem('simonHighScore') || '0'));
  
  const { settings } = useSettings();

  const playSequence = useCallback(async (newSequence) => {
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
    const firstColor = Math.floor(Math.random() * 4);
    const newSequence = [firstColor];
    setSequence(newSequence);
    playSequence(newSequence);
  };

  const handleButtonClick = async (id) => {
    if (gameState !== 'playing') return;
    
    const colorObj = COLORS[id];
    audioEngine.playTone(colorObj.freq, 0.2);
    setActiveButton(id);
    setTimeout(() => setActiveButton(null), 200);

    if (id === sequence[userStep]) {
      if (userStep === sequence.length - 1) {
        // Round complete
        const nextSequence = [...sequence, Math.floor(Math.random() * 4)];
        setSequence(nextSequence);
        if (nextSequence.length - 1 > highScore) {
          setHighScore(nextSequence.length - 1);
          localStorage.setItem('simonHighScore', (nextSequence.length - 1).toString());
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
  };

  if (gameState === 'menu') {
    return (
      <div className="w-full mx-auto h-full flex flex-col px-4 pt-2 pb-8 gap-8">
        <ToolHeader
          title="Simon Says"
          icon={Gamepad2}
          description="Rhythmic Memory Challenge"
          infoContent={
            <>
              <p>
                <strong className="text-white block mb-1">How to Play</strong>
                Watch the pattern of lights and sounds, then repeat them exactly. The sequence gets longer with every successful round!
              </p>
              <p>
                <strong className="text-white block mb-1">Scoring</strong>
                Your highest score is saved locally. Challenge yourself to beat your previous record!
              </p>
            </>
          }
        />
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-8 bg-white/90 backdrop-blur-md p-12 rounded-[4rem] shadow-2xl border border-white/20 w-full max-w-lg mx-auto"
        >
          <div className="bg-primary/10 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
            <Gamepad2 size={48} className="text-primary" />
          </div>
          <div className="space-y-2">
            <h2 className="text-4xl font-black text-gray-800 tracking-tight">Memory Challenge</h2>
            <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">High Score: {highScore}</p>
          </div>
          
          <button
            onClick={startGame}
            className="w-full py-6 bg-primary text-white text-2xl font-black rounded-3xl hover:bg-primary/90 transition-all shadow-xl shadow-primary/30 flex items-center justify-center gap-3 active:scale-95"
          >
            <Play size={28} fill="currentColor" /> START GAME
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="w-full mx-auto h-full flex flex-col px-4 pt-2 pb-8 gap-8 items-center">
      <ToolHeader
        title="Simon Says"
        icon={Gamepad2}
        description="Rhythmic Memory Challenge"
        infoContent={
          <>
            <p>
              <strong className="text-white block mb-1">How to Play</strong>
              Watch the pattern of lights and sounds, then repeat them exactly. The sequence gets longer with every successful round!
            </p>
            <p>
              <strong className="text-white block mb-1">Scoring</strong>
              Your highest score is saved locally. Challenge yourself to beat your previous record!
            </p>
          </>
        }
      >
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setGameState('menu')}
            className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:text-red-500 transition-all shadow-sm"
            title="Return to Menu"
          >
            <RotateCcw size={20} />
          </button>
          <div className="bg-white px-4 py-1.5 rounded-xl shadow-sm border border-gray-100 text-center">
            <div className="text-gray-400 text-[10px] font-black uppercase tracking-tighter">Level</div>
            <div className="text-lg font-black text-primary tabular-nums leading-none">
              {gameState === 'gameover' ? sequence.length - 1 : sequence.length}
            </div>
          </div>
        </div>
      </ToolHeader>

      <div className="relative">
        {/* Game Over Overlay */}
        <AnimatePresence>
          {gameState === 'gameover' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute inset-0 z-50 flex items-center justify-center"
            >
              <div className="bg-white/95 backdrop-blur-md p-10 rounded-[3rem] shadow-2xl border border-gray-100 text-center space-y-6 max-w-sm mx-4">
                <div className="bg-red-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto">
                  <RotateCcw size={40} className="text-red-500" />
                </div>
                <div>
                  <h2 className="text-3xl font-black text-gray-800 leading-none mb-2">Oops!</h2>
                  <p className="text-gray-500 font-bold">You reached level {sequence.length - 1}</p>
                </div>
                <div className="flex flex-col gap-3 pt-2">
                  <button
                    onClick={startGame}
                    className="py-4 bg-primary text-white font-black rounded-2xl hover:bg-primary/90 transition-all shadow-lg"
                  >
                    TRY AGAIN
                  </button>
                  <button
                    onClick={() => setGameState('menu')}
                    className="py-4 bg-gray-100 text-gray-600 font-bold rounded-2xl hover:bg-gray-200 transition-all"
                  >
                    MAIN MENU
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* The Simon Circle */}
        <div className={`grid grid-cols-2 gap-4 md:gap-6 p-6 bg-gray-900 rounded-[4rem] shadow-2xl relative transition-all duration-500 ${gameState === 'gameover' ? 'opacity-20 blur-sm scale-95' : 'scale-100'}`}>
          {COLORS.map((color) => (
            <button
              key={color.id}
              onClick={() => handleButtonClick(color.id)}
              disabled={gameState !== 'playing'}
              className={`
                w-32 h-32 md:w-44 md:h-44 rounded-[2rem] md:rounded-[3rem] transition-all duration-150
                ${activeButton === color.id ? `${color.activeBg} ${color.glow} scale-105` : `${color.bg} opacity-70 hover:opacity-100`}
                ${gameState === 'playing' ? 'cursor-pointer' : 'cursor-default'}
                relative overflow-hidden group
              `}
            >
              <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 bg-white transition-opacity`} />
              <div className={`absolute inset-2 border-4 border-white/20 rounded-[1.5rem] md:rounded-[2.5rem]`} />
            </button>
          ))}
          
          {/* Center Logo/Indicator */}
          <div className="absolute inset-0 m-auto w-24 h-24 md:w-32 md:h-32 bg-gray-900 rounded-full flex items-center justify-center shadow-inner border-8 border-gray-800">
            <div className="text-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={gameState}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                >
                  {gameState === 'playback' ? (
                    <Volume2 size={32} className="text-primary animate-bounce mx-auto" />
                  ) : gameState === 'playing' ? (
                    <div className="text-primary font-black text-xl">YOUR TURN</div>
                  ) : (
                    <Gamepad2 size={32} className="text-gray-700 mx-auto" />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
      
      {/* Help Text */}
      <div className="text-center max-w-xs">
        <p className="text-gray-400 font-medium text-sm">
          {gameState === 'playback' ? "Watch the pattern carefully..." : 
           gameState === 'playing' ? "Repeat the sequence!" : "Get ready..."}
        </p>
      </div>
    </div>
  );
};
