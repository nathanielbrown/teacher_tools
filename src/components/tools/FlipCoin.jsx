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

  // Create a continuous rotation string for framer motion based on result
  // If heads, it needs to end on a multiple of 360. If tails, on 180 (or 180 + multiple of 360).
  const getRotation = () => {
    const baseRotations = 5 * 360; // Spin 5 times
    if (isFlipping) {
        return baseRotations + (Math.random() > 0.5 ? 0 : 180); // Just animate to something during flip
    }
    return result === 'heads' ? 0 : 180;
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
            rotateY: isFlipping ? flipCount * 1800 + 1800 : (result === 'heads' ? flipCount * 1800 : flipCount * 1800 + 180),
            y: isFlipping ? [0, -200, 0] : 0,
            scale: isFlipping ? [1, 1.5, 1] : 1
          }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
          className="w-full h-full relative"
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* Heads Side */}
          <div
            className="absolute inset-0 bg-yellow-400 rounded-full border-8 border-yellow-500 shadow-2xl flex items-center justify-center backface-hidden"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <div className="w-48 h-48 rounded-full border-4 border-yellow-500/30 flex items-center justify-center">
               <span className="text-6xl font-bold text-yellow-600">H</span>
            </div>
          </div>

          {/* Tails Side */}
          <div
            className="absolute inset-0 bg-gray-300 rounded-full border-8 border-gray-400 shadow-2xl flex items-center justify-center"
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          >
            <div className="w-48 h-48 rounded-full border-4 border-gray-400/30 flex items-center justify-center">
               <span className="text-6xl font-bold text-gray-600">T</span>
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
