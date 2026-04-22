import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Palette, Timer, RotateCcw, Play, Square, AlertCircle, Volume2, Clock } from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';
import { audioEngine } from '../../utils/audio';

const COLORS = [
  { name: 'Red', hex: '#ef4444', textHex: '#ffffff' },
  { name: 'Blue', hex: '#3b82f6', textHex: '#ffffff' },
  { name: 'Green', hex: '#22c55e', textHex: '#ffffff' },
  { name: 'Yellow', hex: '#eab308', textHex: '#000000' },
  { name: 'Purple', hex: '#a855f7', textHex: '#ffffff' },
  { name: 'Pink', hex: '#ec4899', textHex: '#ffffff' },
  { name: 'Orange', hex: '#f97316', textHex: '#ffffff' },
  { name: 'Brown', hex: '#78350f', textHex: '#ffffff' },
  { name: 'Black', hex: '#000000', textHex: '#ffffff' },
  { name: 'White', hex: '#ffffff', textHex: '#000000' },
];

export const ColourHunt = () => {
  const [selectedColor, setSelectedColor] = useState(null);
  const [duration, setDuration] = useState(60);
  const [timeLeft, setTimeLeft] = useState(60);
  const [isActive, setIsActive] = useState(false);
  const [gameState, setGameState] = useState('idle'); // idle, hunting, finished
  const { settings } = useSettings();
  
  const timerRef = useRef(null);

  const startHunt = () => {
    const randomColor = COLORS[Math.floor(Math.random() * COLORS.length)];
    setSelectedColor(randomColor);
    setTimeLeft(duration);
    setIsActive(true);
    setGameState('hunting');
    audioEngine.playTick(settings.soundTheme);
  };

  const stopHunt = () => {
    setIsActive(false);
    setGameState('idle');
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const resetHunt = () => {
    stopHunt();
    setTimeLeft(duration);
    setSelectedColor(null);
    setGameState('idle');
  };

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          const next = prev - 1;
          
          // 10 second warning
          if (next === 10) {
            audioEngine.playTick('siren');
          }
          
          if (next <= 0) {
            clearInterval(timerRef.current);
            setIsActive(false);
            setGameState('finished');
            audioEngine.playAlarm(settings.soundTheme);
            return 0;
          }
          return next;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [isActive, timeLeft, settings.soundTheme]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 h-full flex flex-col">
      {/* Header */}
      <div className="bg-white p-8 rounded-[2.5rem] border-2 border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-pink-50 rounded-2xl text-pink-600">
              <Palette size={32} />
            </div>
            <h2 className="text-4xl font-black text-slate-800 tracking-tight">Colour Hunt</h2>
          </div>
          <p className="text-slate-400 font-medium pl-1">Find something in the room that matches the colour!</p>
        </div>

        <div className="flex items-center gap-3 bg-slate-100 p-2 rounded-2xl">
          {[30, 60, 120].map(s => (
            <button
              key={s}
              onClick={() => {
                setDuration(s);
                if (!isActive) setTimeLeft(s);
              }}
              disabled={isActive}
              className={`px-4 py-2 rounded-xl text-sm font-black transition-all ${
                duration === s 
                  ? 'bg-white text-slate-800 shadow-sm' 
                  : 'text-slate-400 hover:text-slate-600 disabled:opacity-50'
              }`}
            >
              {s >= 60 ? `${s/60}m` : `${s}s`}
            </button>
          ))}
        </div>
      </div>

      {/* Main Game Area */}
      <div className="flex-1 flex flex-col gap-8 relative min-h-[400px]">
        <AnimatePresence mode="wait">
          {gameState === 'idle' ? (
            <motion.div
              key="idle"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex-1 bg-white rounded-[3rem] border-4 border-dashed border-slate-200 flex flex-col items-center justify-center gap-8 p-12 text-center"
            >
              <div className="w-32 h-32 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
                <Palette size={64} strokeWidth={1} />
              </div>
              <div className="space-y-4">
                <h3 className="text-3xl font-black text-slate-800">Ready for a Hunt?</h3>
                <p className="text-slate-400 font-medium max-w-md mx-auto">
                  When you start, a random colour will be revealed. Students must find an object of that colour before the time runs out!
                </p>
              </div>
              <button
                onClick={startHunt}
                className="group flex items-center gap-4 px-12 py-6 bg-pink-600 text-white rounded-[2rem] text-2xl font-black shadow-xl shadow-pink-100 hover:bg-pink-700 hover:scale-105 transition-all active:scale-95"
              >
                <Play size={28} fill="currentColor" />
                START HUNT
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="active"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 rounded-[3.5rem] border-8 border-white shadow-2xl overflow-hidden flex flex-col relative"
              style={{ backgroundColor: selectedColor?.hex }}
            >
              {/* Color Name Overlay */}
              <div 
                className="flex-1 flex flex-col items-center justify-center gap-4 text-center p-12"
                style={{ color: selectedColor?.textHex }}
              >
                <motion.h3 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-8xl md:text-[10rem] font-black uppercase tracking-tighter"
                >
                  {selectedColor?.name}
                </motion.h3>
                {gameState === 'finished' && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="bg-white/20 backdrop-blur-md px-8 py-3 rounded-2xl text-2xl font-black"
                  >
                    TIME'S UP!
                  </motion.div>
                )}
              </div>

              {/* Bottom Info Bar */}
              <div className="bg-black/10 backdrop-blur-md p-8 flex items-center justify-between">
                <div className="flex items-center gap-6" style={{ color: selectedColor?.textHex }}>
                  <div className={`flex flex-col items-center transition-all ${timeLeft <= 10 && isActive ? 'animate-pulse scale-110 text-red-400' : ''}`}>
                    <span className="text-xs font-black uppercase tracking-widest opacity-60">Time Left</span>
                    <span className="text-5xl font-black tabular-nums">{formatTime(timeLeft)}</span>
                  </div>
                </div>

                <div className="flex gap-4">
                  {gameState === 'finished' ? (
                    <button
                      onClick={resetHunt}
                      className="px-8 py-4 bg-white text-slate-800 rounded-2xl font-black shadow-lg hover:scale-105 transition-all flex items-center gap-2"
                    >
                      <RotateCcw size={20} />
                      PLAY AGAIN
                    </button>
                  ) : (
                    <button
                      onClick={stopHunt}
                      className="p-4 bg-white/20 text-white hover:bg-white/30 rounded-2xl transition-all"
                    >
                      <Square size={24} fill="currentColor" />
                    </button>
                  )}
                </div>
              </div>

              {/* 10s Warning Pulse Overlay */}
              {timeLeft <= 10 && timeLeft > 0 && isActive && (
                <motion.div 
                  animate={{ opacity: [0, 0.2, 0] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                  className="absolute inset-0 bg-red-600 pointer-events-none"
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Settings Summary Footer */}
      <div className="flex items-center justify-center gap-8 py-4 opacity-50">
        <div className="flex items-center gap-2 text-xs font-black text-slate-500 uppercase tracking-widest">
          <Clock size={14} /> Duration: {duration}s
        </div>
        <div className="w-1 h-1 bg-slate-300 rounded-full" />
        <div className="flex items-center gap-2 text-xs font-black text-slate-500 uppercase tracking-widest">
          <Volume2 size={14} /> Sound: {settings.soundTheme}
        </div>
      </div>
    </div>
  );
};
