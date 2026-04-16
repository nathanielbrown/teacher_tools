import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useSettings } from '../../contexts/SettingsContext';
import { audioEngine } from '../../utils/audio';

export const FlipCoin = () => {
  const [result, setResult] = useState('heads');
  const [isFlipping, setIsFlipping] = useState(false);
  const [flipCount, setFlipCount] = useState(0);
  const { settings } = useSettings();

  const flip = () => {
    if (isFlipping) return;
    setIsFlipping(true);

    if (settings.soundsEnabled) {
       audioEngine.playTick(true);
       setTimeout(() => audioEngine.playTick(true), 200);
       setTimeout(() => audioEngine.playTick(true), 400);
    }

    // Determine result early but reveal after animation
    const newResult = Math.random() > 0.5 ? 'heads' : 'tails';

    setTimeout(() => {
      setResult(newResult);
      setFlipCount(prev => prev + 1);
      setIsFlipping(false);
      if (settings.soundsEnabled) {
         audioEngine.playTick(true); // Final clink
      }
    }, 1500); // Wait for animation
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-12">
      <h2 className="text-3xl font-bold text-primary">Flip a Coin</h2>

      <div
        className="relative w-64 h-64 cursor-pointer perspective-1000"
        onClick={flip}
      >
        <motion.div
          animate={{
            rotateX: isFlipping ? flipCount * 1800 + 1800 : (result === 'heads' ? flipCount * 1800 : flipCount * 1800 + 180),
            y: isFlipping ? [0, -250, 0] : 0,
            scale: isFlipping ? [1, 1.2, 1] : 1,
            z: isFlipping ? [0, 50, 0] : 0
          }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
          className="w-full h-full relative"
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* Edge of the coin to give it 3D depth */}
          <div className="absolute inset-0 rounded-full bg-yellow-600" style={{ transform: 'translateZ(-10px)' }} />
          <div className="absolute inset-0 rounded-full bg-yellow-600" style={{ transform: 'translateZ(-5px)' }} />

          {/* Heads Side */}
          <div
            className="absolute inset-0 bg-yellow-400 rounded-full border-[12px] border-yellow-500 shadow-xl flex items-center justify-center"
            style={{ backfaceVisibility: 'hidden', transform: 'translateZ(0px)' }}
          >
            <div className="w-44 h-44 rounded-full border-4 border-yellow-500/30 flex items-center justify-center shadow-inner">
               <span className="text-7xl font-bold text-yellow-600 drop-shadow-sm">H</span>
            </div>
          </div>

          {/* Tails Side */}
          <div
            className="absolute inset-0 bg-gray-300 rounded-full border-[12px] border-gray-400 shadow-xl flex items-center justify-center"
            style={{ backfaceVisibility: 'hidden', transform: 'rotateX(180deg) translateZ(10px)' }}
          >
            <div className="w-44 h-44 rounded-full border-4 border-gray-400/30 flex items-center justify-center shadow-inner">
               <span className="text-7xl font-bold text-gray-600 drop-shadow-sm">T</span>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="text-center space-y-6">
        {!isFlipping && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            key={flipCount}
            className="text-4xl font-bold text-primary uppercase tracking-widest"
          >
            {result}
          </motion.div>
        )}

        <button
          onClick={flip}
          disabled={isFlipping}
          className="px-12 py-4 bg-primary text-white text-2xl font-bold rounded-2xl shadow-lg hover:bg-primary/90 hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100"
        >
          {isFlipping ? 'Flipping...' : 'Flip Coin'}
        </button>
      </div>
    </div>
  );
};
