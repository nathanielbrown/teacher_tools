// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import React, { useState } from 'react';

import { useSettings } from '../../contexts/SettingsContext';
import { audioEngine } from '../../utils/audio';

export const NumberSpinner = () => {
  const [min, setMin] = useState(1);
  const [max, setMax] = useState(10);
  const [result, setResult] = useState(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const { settings } = useSettings();

  const spin = () => {
    if (isSpinning) return;
    if (min >= max) {
      alert("Minimum must be less than maximum.");
      return;
    }

    setIsSpinning(true);
    const selectedNumber = Math.floor(Math.random() * (max - min + 1)) + min;

    // Play spinning sound
    if (settings.soundsEnabled) {
      let ticks = 0;
      const interval = setInterval(() => {
        audioEngine.playTick(true);
        ticks++;
        if (ticks > 15) clearInterval(interval);
      }, 100);
    }

    const numSegments = max - min + 1;
    const degreesPerSegment = 360 / numSegments;
    const selectedIndex = selectedNumber - min;
    const segmentCenterAngle = (selectedIndex * degreesPerSegment) + (degreesPerSegment / 2);
    const jitter = (Math.random() - 0.5) * (degreesPerSegment * 0.8);
    const targetRotation = 360 - segmentCenterAngle + jitter;
    const spins = 5 * 360;
    const currentRotMod = rotation % 360;
    let rotationDiff = targetRotation - currentRotMod;
    if (rotationDiff < 0) rotationDiff += 360;

    const newRotation = rotation + spins + rotationDiff;
    setRotation(newRotation);

    setTimeout(() => {
      setResult(selectedNumber);
      setIsSpinning(false);
      if (settings.soundsEnabled) audioEngine.playAlarm(true);
    }, 3000);
  };

  const numSegments = max - min + 1;
  const numbers = Array.from({ length: numSegments }, (_, i) => min + i);
  // Generate colors for wheel segments
  const colors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
  const segmentAngle = 360 / numSegments;

  return (
    <div className="flex flex-col items-center justify-center space-y-8">
      <h2 className="text-3xl font-bold text-primary">Number Spinner</h2>

      <div className="flex gap-4 bg-white p-4 rounded-xl shadow-sm border">
        <div className="flex flex-col items-center">
          <label className="text-sm text-gray-500">Min</label>
          <input
            type="number"
            value={min}
            onChange={e => setMin(Number(e.target.value))}
            className="w-20 text-center text-xl p-2 border rounded-lg focus:ring-2 focus:ring-primary"
            disabled={isSpinning}
          />
        </div>
        <div className="flex flex-col items-center">
          <label className="text-sm text-gray-500">Max</label>
          <input
            type="number"
            value={max}
            onChange={e => setMax(Number(e.target.value))}
            className="w-20 text-center text-xl p-2 border rounded-lg focus:ring-2 focus:ring-primary"
            disabled={isSpinning}
          />
        </div>
      </div>

      <div className="relative w-80 h-80">
        {/* Pointer */}
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10 text-text w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-t-[30px] border-t-text filter drop-shadow-md" />

        {/* Wheel */}
        <motion.div
          animate={{ rotate: rotation }}
          transition={{ duration: 3, ease: [0.1, 0.7, 0.1, 1] }}
          className="w-full h-full rounded-full border-8 border-gray-800 shadow-2xl relative overflow-hidden"
          style={{
            background: `conic-gradient(${
              numbers.map((_, i) =>
                `${colors[i % colors.length]} ${i * segmentAngle}deg ${(i + 1) * segmentAngle}deg`
              ).join(', ')
            })`
          }}
        >
          {/* Numbers */}
          {numbers.map((num, i) => {
            const rotationAngle = (i * segmentAngle) + (segmentAngle / 2);
            return (
              <div
                key={i}
                className="absolute inset-0 flex items-start justify-center pt-4"
                style={{ transform: `rotate(${rotationAngle}deg)` }}
              >
                <span className="text-white font-bold text-2xl drop-shadow-md" style={{ transform: 'rotate(180deg)' }}>
                   {num}
                </span>
              </div>
            );
          })}

          {/* Inner circle for aesthetics */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-white rounded-full z-10 border-4 border-gray-800 flex items-center justify-center shadow-inner">
            <div className="w-4 h-4 bg-gray-800 rounded-full" />
          </div>
        </motion.div>
      </div>

      <div className="text-center space-y-6 min-h-[100px]">
        {!isSpinning && result !== null && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="text-6xl font-bold text-primary"
          >
            {result}
          </motion.div>
        )}

        <button
          onClick={spin}
          disabled={isSpinning}
          className="px-12 py-4 bg-primary text-white text-2xl font-bold rounded-2xl shadow-lg hover:bg-primary/90 hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100"
        >
          {isSpinning ? 'Spinning...' : 'Spin the Wheel!'}
        </button>
      </div>
    </div>
  );
};
