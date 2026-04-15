import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';
import { audioEngine } from '../../utils/audio';

export const CountDown = () => {
  const [initialMinutes, setInitialMinutes] = useState(5);
  const [initialSeconds, setInitialSeconds] = useState(0);
  const [timeLeft, setTimeLeft] = useState(300); // in seconds
  const [isRunning, setIsRunning] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  const { settings } = useSettings();
  const lastTickRef = useRef(0);

  useEffect(() => {
    let intervalId;
    if (isRunning && timeLeft > 0) {
      intervalId = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            setIsFinished(true);
            audioEngine.playAlarm(settings.soundsEnabled);
            return 0;
          }

          if (prev <= 11) { // Tick for last 10 seconds
             audioEngine.playTick(settings.soundsEnabled);
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(intervalId);
  }, [isRunning, timeLeft, settings.soundsEnabled]);

  useEffect(() => {
    if (!isRunning && !isFinished) {
      setTimeLeft(initialMinutes * 60 + initialSeconds);
    }
  }, [initialMinutes, initialSeconds]);

  const toggle = () => {
    if (isFinished) {
      setIsFinished(false);
      setTimeLeft(initialMinutes * 60 + initialSeconds);
    }
    if (timeLeft > 0) {
      setIsRunning(!isRunning);
    }
  };

  const reset = () => {
    setIsRunning(false);
    setIsFinished(false);
    setTimeLeft(initialMinutes * 60 + initialSeconds);
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-8">
      <h2 className="text-3xl font-bold text-primary">Count Down</h2>

      {!isRunning && !isFinished && (
        <div className="flex space-x-4 bg-white p-4 rounded-xl shadow-md border border-gray-200">
          <div className="flex flex-col items-center">
            <label className="text-sm text-gray-500 mb-1">Minutes</label>
            <input
              type="number"
              min="0"
              max="99"
              value={initialMinutes}
              onChange={(e) => setInitialMinutes(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-20 text-center text-2xl p-2 border rounded-lg focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="text-4xl font-bold self-end mb-2">:</div>
          <div className="flex flex-col items-center">
            <label className="text-sm text-gray-500 mb-1">Seconds</label>
            <input
              type="number"
              min="0"
              max="59"
              value={initialSeconds}
              onChange={(e) => setInitialSeconds(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
              className="w-20 text-center text-2xl p-2 border rounded-lg focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
      )}

      <div className={`bg-white p-12 rounded-[3rem] shadow-2xl border-4 transition-colors duration-500 min-w-[300px] flex flex-col items-center justify-center ${
        isFinished ? 'border-red-500 bg-red-50 animate-pulse' :
        isRunning && timeLeft <= 10 ? 'border-orange-500' : 'border-primary/10'
      }`}>
        <span className={`text-8xl font-mono font-bold tabular-nums tracking-tighter ${
          isFinished ? 'text-red-600' :
          isRunning && timeLeft <= 10 ? 'text-orange-500' : 'text-text'
        }`}>
          {formatTime(timeLeft)}
        </span>
        {isFinished && <p className="text-xl font-bold text-red-500 mt-4">Time's Up!</p>}
      </div>

      <div className="flex space-x-6">
        <button
          onClick={toggle}
          disabled={timeLeft === 0 && !isFinished}
          className={`w-20 h-20 rounded-full flex items-center justify-center text-white shadow-lg transition-transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
            isRunning ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
          }`}
        >
          {isRunning ? <Pause size={32} /> : <Play size={32} className={!isFinished ? "ml-2" : ""} />}
        </button>
        <button
          onClick={reset}
          className="w-20 h-20 rounded-full flex items-center justify-center bg-gray-200 text-gray-700 shadow-lg hover:bg-gray-300 transition-transform hover:scale-105 active:scale-95"
        >
          <RotateCcw size={32} />
        </button>
      </div>
    </div>
  );
};
