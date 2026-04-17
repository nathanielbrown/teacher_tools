import React, { useState, useEffect, useRef } from 'react';
import { useSettings } from '../../contexts/SettingsContext';
import { audioEngine } from '../../utils/audio';

export const CasinoSpinner = () => {
  const { settings } = useSettings();
  const [selectedClassId, setSelectedClassId] = useState(settings.classes[0]?.id || '');
  const [isSpinning, setIsSpinning] = useState(false);
  const [winner, setWinner] = useState(null);
  const containerRef = useRef(null);

  const selectedClass = settings.classes.find(c => c.id === selectedClassId);
  const students = selectedClass ? selectedClass.students : [];

  // Generate a long list of students for the slot machine effect
  const generateStrip = () => {
    if (!students.length) return [];
    let strip = [];
    // Repeat students many times to create a long strip
    for (let i = 0; i < 30; i++) {
      strip = strip.concat(students.sort(() => Math.random() - 0.5));
    }
    return strip;
  };

  const [strip, setStrip] = useState([]);

  useEffect(() => {
    setStrip(generateStrip());
    setWinner(null);
  }, [selectedClassId, settings.classes]);

  const spin = () => {
    if (isSpinning || !students.length || !containerRef.current) return;
    setIsSpinning(true);
    setWinner(null);

    const winningIndex = Math.floor(Math.random() * students.length);
    const winningStudent = students[winningIndex];

    // Reset scroll position to top instantly
    containerRef.current.style.transition = 'none';
    containerRef.current.style.transform = 'translateY(0)';

    // Play sound
    if (settings.soundTheme !== 'none') {
      let ticks = 0;
      const interval = setInterval(() => {
        audioEngine.playTick(settings.soundTheme);
        ticks++;
        if (ticks > 25) clearInterval(interval);
      }, 100);
    }

    // Small delay to allow CSS reset to take effect, then start animation
    setTimeout(() => {
      // Calculate target translation.
      // We want to scroll down significantly. Each item is roughly 80px high.
      // Let's aim for an item near the bottom of our long strip.
      const targetIndex = strip.length - students.length * 2 + winningIndex;
      const itemHeight = 80; // pixels (h-20)
      const targetY = -(targetIndex * itemHeight);

      containerRef.current.style.transition = 'transform 3.5s cubic-bezier(0.15, 0.85, 0.35, 1)';
      containerRef.current.style.transform = `translateY(${targetY}px)`;

      setTimeout(() => {
        setWinner(winningStudent);
        setIsSpinning(false);
        audioEngine.playAlarm(settings.soundTheme);
      }, 3500);
    }, 50);
  };

  if (!students.length) {
    return (
      <div className="flex flex-col items-center justify-center space-y-8">
        <h2 className="text-3xl font-bold text-primary">Casino Spinner</h2>
        <div className="p-8 bg-yellow-50 text-yellow-800 rounded-xl border border-yellow-200">
          Please add a class with students in Settings first!
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center space-y-8 max-w-3xl mx-auto">
      <h2 className="text-3xl font-bold text-primary">Name Picker (Casino)</h2>

      <select
        value={selectedClassId}
        onChange={(e) => setSelectedClassId(e.target.value)}
        className="p-3 border-2 border-gray-200 rounded-xl bg-white text-lg font-medium focus:border-primary focus:ring-2 focus:ring-primary/20"
        disabled={isSpinning}
      >
        {settings.classes.map(c => (
          <option key={c.id} value={c.id}>{c.name} ({c.students.length} students)</option>
        ))}
      </select>

      {/* Slot Machine Container */}
      <div className="relative w-full max-w-md h-40 bg-gray-900 rounded-3xl border-8 border-gray-800 shadow-[0_0_50px_rgba(0,0,0,0.3)] overflow-hidden flex items-center justify-center">
        {/* Glass glare effect */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none z-20" />

        {/* Center line indicator */}
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-red-500/50 z-20 pointer-events-none" />
        <div className="absolute left-0 w-4 h-full bg-gradient-to-r from-black/50 to-transparent z-20" />
        <div className="absolute right-0 w-4 h-full bg-gradient-to-l from-black/50 to-transparent z-20" />

        {/* Rolling Strip */}
        <div className="w-full absolute top-1/2 -translate-y-1/2" style={{ height: '80px' }}>
            <div ref={containerRef} className="w-full">
            {strip.map((student, i) => (
                <div
                key={i}
                className="h-20 w-full flex items-center justify-center bg-white border-b border-gray-200 text-3xl font-bold text-gray-800 uppercase tracking-wider"
                >
                {student}
                </div>
            ))}
            </div>
        </div>
      </div>

      <div className="h-16 flex items-center justify-center">
        {winner && !isSpinning && (
          <div className="text-4xl font-black text-accent animate-bounce">
            🎉 {winner} 🎉
          </div>
        )}
      </div>

      <button
        onClick={spin}
        disabled={isSpinning}
        className="px-16 py-5 bg-gradient-to-b from-primary to-blue-700 text-white text-2xl font-bold rounded-full shadow-[0_10px_0_#1d4ed8,0_15px_20px_rgba(0,0,0,0.4)] active:shadow-[0_0px_0_#1d4ed8,0_0px_0_rgba(0,0,0,0)] active:translate-y-[10px] transition-all disabled:opacity-50 disabled:pointer-events-none uppercase tracking-widest"
      >
        {isSpinning ? 'Spinning...' : 'Pull Lever!'}
      </button>
    </div>
  );
};
