import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Square, RotateCcw } from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';
import { audioEngine } from '../../utils/audio';

export const StopWatch = () => {
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const { settings } = useSettings();
  const lastTickRef = useRef(0);

  useEffect(() => {
    let intervalId;
    if (isRunning) {
      intervalId = setInterval(() => {
        setTime((prev) => {
          const newTime = prev + 10;
          // Play tick sound every second
          if (Math.floor(newTime / 1000) > lastTickRef.current) {
            audioEngine.playTick(settings.soundsEnabled);
            lastTickRef.current = Math.floor(newTime / 1000);
          }
          return newTime;
        });
      }, 10);
    }
    return () => clearInterval(intervalId);
  }, [isRunning, settings.soundsEnabled]);

  const toggle = () => {
    setIsRunning(!isRunning);
    if (!isRunning) {
      lastTickRef.current = Math.floor(time / 1000);
    }
  };

  const reset = () => {
    setIsRunning(false);
    setTime(0);
    lastTickRef.current = 0;
  };

  const formatTime = (ms) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const centiseconds = Math.floor((ms % 1000) / 10);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-8">
      <h2 className="text-3xl font-bold text-primary">Stop Watch</h2>

      <div className="bg-white p-12 rounded-[3rem] shadow-2xl border-4 border-primary/10 min-w-[300px] flex items-center justify-center">
        <span className="text-7xl font-mono font-bold text-text tabular-nums tracking-tighter">
          {formatTime(time)}
        </span>
      </div>

      <div className="flex space-x-6">
        <button
          onClick={toggle}
          className={`w-20 h-20 rounded-full flex items-center justify-center text-white shadow-lg transition-transform hover:scale-105 active:scale-95 ${
            isRunning ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
          }`}
        >
          {isRunning ? <Pause size={32} /> : <Play size={32} className="ml-2" />}
        </button>
        <button
          onClick={reset}
          disabled={isRunning && time === 0}
          className="w-20 h-20 rounded-full flex items-center justify-center bg-gray-200 text-gray-700 shadow-lg hover:bg-gray-300 transition-transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RotateCcw size={32} />
        </button>
      </div>
    </div>
  );
};
