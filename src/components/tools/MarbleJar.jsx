import React, { useState, useEffect, useRef } from 'react';
import { Plus, Minus, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { useSettings } from '../../contexts/SettingsContext';
import { audioEngine } from '../../utils/audio';

export const MarbleJar = () => {
  const [marbles, setMarbles] = useState(() => {
    const saved = localStorage.getItem('teacherToolsMarbleJar');
    return saved ? JSON.parse(saved) : 0;
  });

  const [isRewarding, setIsRewarding] = useState(false);
  const { settings } = useSettings();
  const jarRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('teacherToolsMarbleJar', JSON.stringify(marbles));

    if (marbles >= 10 && !isRewarding) {
      const timeout = setTimeout(triggerReward, 500);
      return () => clearTimeout(timeout);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [marbles, isRewarding]);

  const addMarble = () => {
    if (isRewarding) return;
    if (settings.soundsEnabled) audioEngine.playTick(true);
    setMarbles(prev => prev + 1);
  };

  const removeMarble = () => {
    if (isRewarding || marbles === 0) return;
    setMarbles(prev => prev - 1);
  };

  const resetJar = () => {
    setMarbles(0);
    setIsRewarding(false);
  };

  const triggerReward = () => {
    setIsRewarding(true);
    if (settings.soundsEnabled) audioEngine.playAlarm(true);

    const end = Date.now() + 3 * 1000;
    const colors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];

    (function frame() {
      confetti({
        particleCount: 15,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: colors
      });
      confetti({
        particleCount: 15,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: colors
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      } else {
        setTimeout(() => resetJar(), 2000); // Reset automatically after animation
      }
    }());
  };

  // Generate deterministic but seemingly random positions for marbles
  const getMarbleStyle = (index) => {
    // Math.sin is deterministic based on index, so it won't jump around on re-renders
    const randomX = Math.sin(index * 12.9898) * 10000;
    const x = (randomX - Math.floor(randomX)) * 60 + 20; // 20% to 80% width
    const colorIndex = index % 5;
    const colors = ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500'];

    return {
      left: `${x}%`,
      bottom: `${(marbles - index) * 5 + 10}px`, // Stack them up slightly
      colorClass: colors[colorIndex]
    };
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-12 pb-12 max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold text-primary">Marble Jar Reward</h2>

      <div className="flex gap-8 items-center w-full justify-center">
        <button
          onClick={removeMarble}
          disabled={marbles === 0 || isRewarding}
          className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-red-500 shadow-lg hover:bg-red-50 hover:scale-105 active:scale-95 disabled:opacity-50 transition-all border-2 border-red-100"
        >
          <Minus size={32} />
        </button>

        <div className="relative" ref={jarRef}>
          {/* Jar background/back edge */}
          <div className="w-64 h-80 bg-blue-50/50 rounded-b-[3rem] border-4 border-t-0 border-blue-200/50 shadow-inner relative overflow-hidden" style={{ perspective: '1000px' }}>
            {/* The marbles */}
            <AnimatePresence>
              {Array.from({ length: marbles }).map((_, i) => {
                const style = getMarbleStyle(i);
                return (
                  <motion.div
                    key={i}
                    initial={{ y: -400, x: '50%', opacity: 0 }}
                    animate={{ y: 0, x: style.left, opacity: 1 }}
                    exit={{ opacity: 0, scale: 0 }}
                    transition={{ type: "spring", bounce: 0.6, duration: 0.8 }}
                    className={`absolute w-12 h-12 rounded-full shadow-md border-2 border-white/20 ${style.colorClass} flex items-center justify-center`}
                    style={{ bottom: style.bottom }}
                  >
                    {/* Gloss reflection */}
                    <div className="absolute top-1 left-2 w-4 h-4 bg-white/40 rounded-full" />
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* Jar front/glass overlay */}
          <div className="absolute inset-0 w-64 h-80 rounded-b-[3rem] border-4 border-t-0 border-blue-300 shadow-[inset_0_-10px_20px_rgba(0,0,0,0.1)] pointer-events-none flex flex-col justify-between">
            <div className="w-[110%] -ml-[5%] h-8 border-4 border-blue-300 rounded-[100%] border-b-blue-400 bg-white/20" />

            {/* Glass reflection */}
            <div className="absolute left-4 top-12 bottom-12 w-8 bg-gradient-to-r from-white/30 to-transparent rounded-full filter blur-sm" />
          </div>

          <div className="absolute -right-16 top-1/2 -translate-y-1/2 font-bold text-4xl text-gray-400">
            {marbles}/10
          </div>
        </div>

        <button
          onClick={addMarble}
          disabled={isRewarding}
          className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-green-500 shadow-lg hover:bg-green-50 hover:scale-105 active:scale-95 disabled:opacity-50 transition-all border-2 border-green-100"
        >
          <Plus size={32} />
        </button>
      </div>

      <AnimatePresence>
        {isRewarding && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: -50 }}
            className="flex flex-col items-center gap-6"
          >
            <h3 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-yellow-500 to-blue-500 animate-pulse">
              CLASS REWARD UNLOCKED!
            </h3>
            <button
              onClick={resetJar}
              className="flex items-center gap-2 bg-gray-800 text-white px-8 py-4 rounded-xl hover:bg-gray-700 transition-colors font-bold shadow-xl"
            >
              <RotateCcw size={24} /> Reset Jar
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
