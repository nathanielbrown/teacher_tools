import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSettings } from '../../contexts/SettingsContext';
import { audioEngine } from '../../utils/audio';

// Pre-define 100 colorful shades
const generateColors = () => {
  const hues = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];
  const saturations = [60, 80, 100];
  const lightnesses = [40, 50, 60, 70];
  const colors = [];

  for (let s of saturations) {
    for (let l of lightnesses) {
      for (let h of hues) {
        if (colors.length < 100) {
          colors.push(`hsl(${h}, ${s}%, ${l}%)`);
        }
      }
    }
  }
  // Fill remaining to exactly 100 if needed with grays
  while(colors.length < 100) colors.push(`hsl(0, 0%, ${Math.random() * 100}%)`);
  return colors.sort(() => Math.random() - 0.5); // Shuffle
};

const COLORS = generateColors();

export const ColourPicker = () => {
  const [selectedColor, setSelectedColor] = useState(null);
  const [isPicking, setIsPicking] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const { settings } = useSettings();

  const pickColor = () => {
    if (isPicking) return;
    setIsPicking(true);
    setSelectedColor(null);

    let speed = 50;
    let index = 0;
    let iterations = 0;

    const animate = () => {
      setActiveIndex(Math.floor(Math.random() * 100));
      if (settings.soundsEnabled) audioEngine.playTick(true);

      iterations++;
      if (iterations < 20) {
        setTimeout(animate, speed);
      } else if (iterations < 30) {
        setTimeout(animate, speed * 2);
      } else {
        const finalIndex = Math.floor(Math.random() * 100);
        setActiveIndex(finalIndex);
        setSelectedColor(COLORS[finalIndex]);
        setIsPicking(false);
        if (settings.soundsEnabled) audioEngine.playAlarm(true);
      }
    };

    animate();
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-8 max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold text-primary">Colour Picker</h2>

      <div className="grid grid-cols-10 gap-1 sm:gap-2 p-4 bg-white rounded-2xl shadow-lg w-full">
        {COLORS.map((color, i) => (
          <motion.div
            key={i}
            animate={{
              scale: activeIndex === i ? 1.2 : 1,
              zIndex: activeIndex === i ? 10 : 1,
              opacity: (isPicking && activeIndex !== i) ? 0.5 : 1
            }}
            className={`w-full aspect-square rounded-md shadow-sm transition-colors duration-100 ${
              activeIndex === i ? 'ring-4 ring-text ring-offset-2' : ''
            }`}
            style={{ backgroundColor: color }}
          />
        ))}
      </div>

      <div className="flex flex-col md:flex-row items-center gap-8 min-h-[120px]">
        <button
          onClick={pickColor}
          disabled={isPicking}
          className="px-12 py-4 bg-primary text-white text-2xl font-bold rounded-2xl shadow-lg hover:bg-primary/90 hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100 whitespace-nowrap"
        >
          {isPicking ? 'Picking...' : 'Pick a Colour!'}
        </button>

        <AnimatePresence>
          {selectedColor && !isPicking && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-md border"
            >
              <div
                className="w-16 h-16 rounded-full shadow-inner border border-gray-200"
                style={{ backgroundColor: selectedColor }}
              />
              <span className="text-2xl font-mono text-gray-700 uppercase tracking-widest font-bold">
                {selectedColor}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
