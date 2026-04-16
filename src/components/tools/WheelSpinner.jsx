// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import React, { useState, useRef } from 'react';

import { useSettings } from '../../contexts/SettingsContext';
import { audioEngine } from '../../utils/audio';

export const WheelSpinner = () => {
  const { settings } = useSettings();
  const [selectedClassId, setSelectedClassId] = useState(settings.classes[0]?.id || '');
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [winner, setWinner] = useState(null);

  const selectedClass = settings.classes.find(c => c.id === selectedClassId);
  const students = selectedClass ? selectedClass.students : [];

  const colors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

  const spin = () => {
    if (isSpinning || !students.length) return;
    setIsSpinning(true);
    setWinner(null);

    if (settings.soundsEnabled) {
      let ticks = 0;
      const interval = setInterval(() => {
        audioEngine.playTick(true);
        ticks++;
        if (ticks > 20) clearInterval(interval);
      }, 150);
    }

    const segments = students.length;
    const degreesPerSegment = 360 / segments;

    // Choose a random winner
    const winningIndex = Math.floor(Math.random() * segments);

    // Calculate rotation to land on the chosen segment
    // Pointer is at the top (270 degrees in standard circle math, or 0 degrees rotation of container)
    // We want the center of the winning segment to land at the top.
    const extraSpins = 5 * 360; // 5 full spins

    // The segment's current position relative to top is winningIndex * degreesPerSegment.
    // We need to rotate backwards by that amount to bring it to the top.
    const segmentOffset = winningIndex * degreesPerSegment + (degreesPerSegment / 2);

    // Add randomness within the segment
    const randomOffset = (Math.random() - 0.5) * (degreesPerSegment * 0.8);

    const targetRotation = rotation + extraSpins + (360 - segmentOffset) + randomOffset;

    setRotation(targetRotation);

    setTimeout(() => {
      setWinner(students[winningIndex]);
      setIsSpinning(false);
      if (settings.soundsEnabled) audioEngine.playAlarm(true);
    }, 4000);
  };

  if (!students.length) {
    return (
      <div className="flex flex-col items-center justify-center space-y-8">
        <h2 className="text-3xl font-bold text-primary">Wheel Spinner</h2>
        <div className="p-8 bg-yellow-50 text-yellow-800 rounded-xl border border-yellow-200">
          Please add a class with students in Settings first!
        </div>
      </div>
    );
  }

  const segmentAngle = 360 / students.length;

  return (
    <div className="flex flex-col items-center justify-center space-y-12 max-w-4xl mx-auto overflow-hidden px-4">
      <h2 className="text-3xl font-bold text-primary">Name Picker (Wheel)</h2>

      <select
        value={selectedClassId}
        onChange={(e) => {
          setSelectedClassId(e.target.value);
          setRotation(0);
          setWinner(null);
        }}
        className="p-3 border-2 border-gray-200 rounded-xl bg-white text-lg font-medium focus:border-primary focus:ring-2 focus:ring-primary/20"
        disabled={isSpinning}
      >
        {settings.classes.map(c => (
          <option key={c.id} value={c.id}>{c.name} ({c.students.length} students)</option>
        ))}
      </select>

      <div className="relative w-[300px] h-[300px] sm:w-[400px] sm:h-[400px]">
        {/* Pointer */}
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-20 w-0 h-0 border-l-[20px] border-l-transparent border-r-[20px] border-r-transparent border-t-[40px] border-t-text filter drop-shadow-lg origin-top scale-y-125" />

        {/* Wheel container */}
        <motion.div
          animate={{ rotate: rotation }}
          transition={{ duration: 4, ease: [0.15, 0.85, 0.15, 1] }} // smooth deceleration
          className="w-full h-full rounded-full border-8 border-gray-800 shadow-2xl relative overflow-hidden"
        >
          {students.map((student, i) => {
            const angle = i * segmentAngle;
            return (
              <div
                key={i}
                className="absolute top-0 left-0 w-full h-full origin-center flex items-start justify-center"
                style={{
                  transform: `rotate(${angle}deg)`,
                  // Create the wedge shape using clip-path
                  clipPath: `polygon(50% 50%, 50% 0%, ${50 + 50 * Math.tan((segmentAngle / 2) * Math.PI / 180)}% 0%)`,
                  // Note: standard CSS clip-path polygons for wedges are complex if angle > 90.
                  // Since we might have many students, angle is small.
                  // For a general solution, conic-gradient is better for the background.
                }}
              >
                {/* We will handle background via conic-gradient below, this is just for text positioning */}
                <div
                  className="pt-6 font-bold text-white whitespace-nowrap text-xs sm:text-sm origin-bottom"
                  style={{ transform: `rotate(${segmentAngle / 2}deg)` }}
                >
                  {student.length > 12 ? student.substring(0, 10) + '...' : student}
                </div>
              </div>
            );
          })}

          {/* Background Conic Gradient for Wedges */}
          <div
            className="absolute inset-0 -z-10"
            style={{
              background: `conic-gradient(${
                students.map((_, i) =>
                  `${colors[i % colors.length]} ${i * segmentAngle}deg ${(i + 1) * segmentAngle}deg`
                ).join(', ')
              })`
            }}
          />

          {/* Center Peg */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full z-10 border-4 border-gray-800 shadow-inner flex items-center justify-center">
            <div className="w-3 h-3 bg-gray-800 rounded-full" />
          </div>
        </motion.div>
      </div>

      <div className="h-20 flex flex-col items-center justify-center">
        {!isSpinning && winner && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-4xl font-black text-primary text-center px-4"
          >
            🎉 {winner} 🎉
          </motion.div>
        )}
      </div>

      <button
        onClick={spin}
        disabled={isSpinning}
        className="px-12 py-4 bg-primary text-white text-2xl font-bold rounded-2xl shadow-lg hover:bg-primary/90 hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100"
      >
        {isSpinning ? 'Spinning...' : 'Spin Wheel'}
      </button>
    </div>
  );
};
