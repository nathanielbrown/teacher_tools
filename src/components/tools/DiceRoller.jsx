import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSettings } from '../../contexts/SettingsContext';
import { audioEngine } from '../../utils/audio';
import { Dices } from 'lucide-react';

// Dot positions for standard 6-sided die
const diceDotPositions = {
  1: ['col-start-2 row-start-2'],
  2: ['col-start-1 row-start-1', 'col-start-3 row-start-3'],
  3: ['col-start-1 row-start-1', 'col-start-2 row-start-2', 'col-start-3 row-start-3'],
  4: ['col-start-1 row-start-1', 'col-start-3 row-start-1', 'col-start-1 row-start-3', 'col-start-3 row-start-3'],
  5: ['col-start-1 row-start-1', 'col-start-3 row-start-1', 'col-start-2 row-start-2', 'col-start-1 row-start-3', 'col-start-3 row-start-3'],
  6: ['col-start-1 row-start-1', 'col-start-3 row-start-1', 'col-start-1 row-start-2', 'col-start-3 row-start-2', 'col-start-1 row-start-3', 'col-start-3 row-start-3']
};

const Die = ({ value, isRolling }) => {
  const [randomOffset, setRandomOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (isRolling) {
      const timeout = setTimeout(() => {
        setRandomOffset({
          x: Math.random() * 90 - 45,
          y: Math.random() * 90 - 45
        });
      }, 0);
      return () => clearTimeout(timeout);
    }
  }, [isRolling]);

  return (
    <div className="w-32 h-32" style={{ perspective: '1000px' }}>
      <motion.div
        animate={{
          rotateX: isRolling ? [0, 360, 720, 1080 + randomOffset.x] : 0,
          rotateY: isRolling ? [0, 360, 720, 1080 + randomOffset.y] : 0,
          rotateZ: isRolling ? [0, 180, 360] : 0,
          z: isRolling ? [0, 150, 0] : 0, // Lift off the ground
          scale: isRolling ? [1, 1.2, 1] : 1,
        }}
        transition={{ duration: 0.8, ease: "easeInOut" }}
        className="w-full h-full relative"
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Front Face (Current Value) */}
        <div className="absolute inset-0 bg-white rounded-2xl shadow-xl border-2 border-gray-200 p-4 grid grid-cols-3 grid-rows-3 gap-2" style={{ transform: 'translateZ(64px)' }}>
          {diceDotPositions[value].map((pos, i) => (
            <div key={i} className={`w-full h-full bg-primary rounded-full ${pos} shadow-inner`} />
          ))}
        </div>

        {/* Back Face */}
        <div className="absolute inset-0 bg-gray-50 rounded-2xl shadow-inner border-2 border-gray-300 p-4 grid grid-cols-3 grid-rows-3 gap-2" style={{ transform: 'rotateY(180deg) translateZ(64px)' }}>
           {/* For simplicity we show a random generic face when rolling */}
           {diceDotPositions[7 - value] ? diceDotPositions[7 - value].map((pos, i) => (
            <div key={i} className={`w-full h-full bg-gray-400 rounded-full ${pos} shadow-inner`} />
          )) : null}
        </div>

        {/* Right Face */}
        <div className="absolute inset-0 bg-gray-100 rounded-2xl shadow-inner border-2 border-gray-300" style={{ transform: 'rotateY(90deg) translateZ(64px)' }} />

        {/* Left Face */}
        <div className="absolute inset-0 bg-gray-200 rounded-2xl shadow-inner border-2 border-gray-300" style={{ transform: 'rotateY(-90deg) translateZ(64px)' }} />

        {/* Top Face */}
        <div className="absolute inset-0 bg-gray-50 rounded-2xl shadow-inner border-2 border-gray-300" style={{ transform: 'rotateX(90deg) translateZ(64px)' }} />

        {/* Bottom Face */}
        <div className="absolute inset-0 bg-gray-300 rounded-2xl shadow-inner border-2 border-gray-300" style={{ transform: 'rotateX(-90deg) translateZ(64px)' }} />
      </motion.div>
    </div>
  );
};

export const DiceRoller = () => {
  const [diceCount, setDiceCount] = useState(1);
  const [values, setValues] = useState([1]);
  const [isRolling, setIsRolling] = useState(false);
  const { settings } = useSettings();

  const rollDice = () => {
    if (isRolling) return;
    setIsRolling(true);

    // Play sound quickly multiple times to simulate rolling
    if (settings.soundsEnabled) {
      let rolls = 0;
      const soundInterval = setInterval(() => {
        audioEngine.playTick(true);
        rolls++;
        if (rolls > 5) clearInterval(soundInterval);
      }, 100);
    }

    setTimeout(() => {
      const newValues = Array.from({ length: diceCount }, () => Math.floor(Math.random() * 6) + 1);
      setValues(newValues);
      setIsRolling(false);
    }, 800);
  };

  const changeDiceCount = (count) => {
    setDiceCount(count);
    setValues(Array.from({ length: count }, () => 1));
  };

  const total = values.reduce((a, b) => a + b, 0);

  return (
    <div className="flex flex-col items-center justify-center space-y-12">
      <h2 className="text-3xl font-bold text-primary flex items-center gap-2">
        <Dices /> Dice Roller
      </h2>

      <div className="flex gap-4 mb-8">
        {[1, 2, 3, 4].map(num => (
          <button
            key={num}
            onClick={() => changeDiceCount(num)}
            className={`px-6 py-2 rounded-lg font-bold transition-colors ${
              diceCount === num
                ? 'bg-primary text-white'
                : 'bg-white text-text border-2 border-gray-200 hover:border-primary'
            }`}
          >
            {num} {num === 1 ? 'Die' : 'Dice'}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap justify-center gap-8 min-h-[160px]">
        <AnimatePresence>
          {values.map((val, i) => (
            <Die key={i} value={val} isRolling={isRolling} />
          ))}
        </AnimatePresence>
      </div>

      <div className="text-center space-y-6">
        {!isRolling && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl font-bold text-gray-600"
          >
            Total: <span className="text-4xl text-primary">{total}</span>
          </motion.div>
        )}

        <button
          onClick={rollDice}
          disabled={isRolling}
          className="px-12 py-4 bg-primary text-white text-2xl font-bold rounded-2xl shadow-lg hover:bg-primary/90 hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100"
        >
          {isRolling ? 'Rolling...' : 'Roll!'}
        </button>
      </div>
    </div>
  );
};
