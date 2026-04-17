import React, { useState } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { useSettings } from '../../contexts/SettingsContext';
import { audioEngine } from '../../utils/audio';
import { Dices } from 'lucide-react';
import { Canvas } from '@react-three/fiber';
import { DieShape } from './Dice3D';



export const DiceRoller = () => {
  const [diceCount, setDiceCount] = useState(1);
  const [sides, setSides] = useState(6);
  const [values, setValues] = useState([1]);
  const [isRolling, setIsRolling] = useState(false);
  const { settings } = useSettings();

  const rollDice = () => {
    if (isRolling) return;
    setIsRolling(true);

    // Play sound quickly multiple times to simulate rolling
    if (settings.soundTheme !== 'none') {
      let rolls = 0;
      const soundInterval = setInterval(() => {
        audioEngine.playTick(settings.soundTheme);
        rolls++;
        if (rolls > 5) clearInterval(soundInterval);
      }, 100);
    }

    setTimeout(() => {
      const newValues = Array.from({ length: diceCount }, () => Math.floor(Math.random() * sides) + 1);
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

      <div className="flex flex-col items-center gap-4 mb-8">
        <div className="flex gap-4">
          {[1, 2, 3, 4].map(num => (
            <button
              key={`count-${num}`}
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
        <div className="flex flex-wrap justify-center gap-2 mt-2">
          {[4, 6, 8, 12, 20].map(num => (
            <button
              key={`sides-${num}`}
              onClick={() => {
                setSides(num);
                setValues(Array.from({ length: diceCount }, () => 1));
              }}
              className={`px-4 py-1.5 rounded-lg font-bold transition-colors ${
                sides === num
                  ? 'bg-primary/10 text-primary border-2 border-primary'
                  : 'bg-white text-gray-500 border-2 border-gray-200 hover:border-primary/50'
              }`}
            >
              D{num}
            </button>
          ))}
        </div>
      </div>

      <div className="w-full min-h-[300px] md:min-h-[400px] bg-gray-50/50 rounded-2xl overflow-hidden relative shadow-inner">
        <Canvas camera={{ position: [0, 0, Math.max(5, values.length * 1.8)], fov: 40 }}>
          <ambientLight intensity={0.7} />
          <pointLight position={[10, 10, 10]} intensity={1.5} />
          <directionalLight position={[-5, 5, 5]} intensity={0.5} />
          {values.map((val, i) => {
             // Increase spacing between larger dice
             const xOffset = (i - (values.length - 1) / 2) * 3; 
             return (
               <group key={i} position={[xOffset, 0, 0]}>
                 <DieShape value={val} isRolling={isRolling} sides={sides} index={i} />
               </group>
             );
          })}
        </Canvas>
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
