import React, { useState } from 'react';
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
  return (
    <motion.div
      animate={{
        rotateX: isRolling ? [0, 360, 720, 1080] : 0,
        rotateY: isRolling ? [0, 360, 720, 1080] : 0,
        scale: isRolling ? [1, 1.2, 0.8, 1] : 1,
      }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
      className="w-32 h-32 bg-white rounded-2xl shadow-xl border-2 border-gray-200 p-4 grid grid-cols-3 grid-rows-3 gap-2"
      style={{ transformStyle: 'preserve-3d' }}
    >
      {diceDotPositions[value].map((pos, i) => (
        <div key={i} className={`w-full h-full bg-primary rounded-full ${pos} shadow-inner`} />
      ))}
    </motion.div>
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
