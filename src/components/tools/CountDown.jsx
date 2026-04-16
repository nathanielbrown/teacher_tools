import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Circle, LayoutList, Hourglass, Timer as TimerIcon, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useSettings } from '../../contexts/SettingsContext';
import { audioEngine } from '../../utils/audio';

export const CountDown = () => {
  const [initialMinutes, setInitialMinutes] = useState(5);
  const [initialSeconds, setInitialSeconds] = useState(0);
  const [timeLeft, setTimeLeft] = useState(300); // in seconds
  const [totalTime, setTotalTime] = useState(300);
  const [isRunning, setIsRunning] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [visualMode, setVisualMode] = useState('circle'); // circle, progress, sand, flip, rainbow

  const { settings } = useSettings();

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
    const timeout = setTimeout(() => {
      if (!isRunning && !isFinished) {
        const newTotal = initialMinutes * 60 + initialSeconds;
        setTimeLeft(prev => prev !== newTotal ? newTotal : prev);
        setTotalTime(prev => prev !== newTotal ? newTotal : prev);
      }
    }, 0);
    return () => clearTimeout(timeout);
  }, [initialMinutes, initialSeconds, isRunning, isFinished]);

  const toggle = () => {
    if (isFinished) {
      setIsFinished(false);
      const newTotal = initialMinutes * 60 + initialSeconds;
      setTimeLeft(newTotal);
      setTotalTime(newTotal);
    }
    if (timeLeft > 0) {
      setIsRunning(!isRunning);
    }
  };

  const reset = () => {
    setIsRunning(false);
    setIsFinished(false);
    const newTotal = initialMinutes * 60 + initialSeconds;
    setTimeLeft(newTotal);
    setTotalTime(newTotal);
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const renderVisualization = () => {
    const progress = totalTime > 0 ? ((totalTime - timeLeft) / totalTime) * 100 : 100;
    const remainingProgress = 100 - progress;

    if (visualMode === 'progress') {
      return (
        <div className="w-full max-w-md h-8 bg-gray-200 rounded-full overflow-hidden shadow-inner relative mt-8">
          <motion.div
            className={`h-full ${isFinished ? 'bg-red-500' : 'bg-primary'}`}
            initial={{ width: '100%' }}
            animate={{ width: `${remainingProgress}%` }}
            transition={{ ease: "linear", duration: 1 }}
          />
        </div>
      );
    }

    if (visualMode === 'circle') {
      const radius = 60;
      const circumference = 2 * Math.PI * radius;
      const strokeDashoffset = circumference - (remainingProgress / 100) * circumference;

      return (
        <div className="relative mt-8">
          <svg className="transform -rotate-90 w-40 h-40">
            <circle cx="80" cy="80" r="60" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-gray-200" />
            <motion.circle
              cx="80" cy="80" r="60"
              stroke="currentColor"
              strokeWidth="8"
              fill="transparent"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: 0 }}
              animate={{ strokeDashoffset }}
              transition={{ ease: "linear", duration: 1 }}
              className={`${isFinished ? 'text-red-500' : 'text-primary'}`}
            />
          </svg>
        </div>
      );
    }

    if (visualMode === 'sand') {
      return (
        <div className="relative mt-8 w-24 h-32 border-4 border-gray-800 rounded-lg flex flex-col items-center overflow-hidden">
           <div className="w-full h-1/2 border-b-2 border-gray-300 relative overflow-hidden flex items-end">
              <motion.div
                className="w-full bg-yellow-400"
                initial={{ height: '100%' }}
                animate={{ height: `${remainingProgress}%` }}
                transition={{ ease: "linear", duration: 1 }}
              />
           </div>
           <div className="w-full h-1/2 relative overflow-hidden">
              <motion.div
                className="w-full bg-yellow-400 absolute bottom-0"
                initial={{ height: '0%' }}
                animate={{ height: `${progress}%` }}
                transition={{ ease: "linear", duration: 1 }}
              />
           </div>
           {isRunning && !isFinished && (
             <div className="absolute top-1/2 left-1/2 w-1 h-full bg-yellow-400 transform -translate-x-1/2 animate-pulse" />
           )}
        </div>
      );
    }

    if (visualMode === 'rainbow') {
      return (
        <div className="relative mt-8 flex items-center justify-center w-40 h-40">
          {isRunning && !isFinished ? (
             <div className="w-full h-full rounded-full animate-spin border-8 border-transparent"
                  style={{
                    borderImage: 'linear-gradient(to right, red, orange, yellow, green, blue, indigo, violet) 1',
                    borderRadius: '50%'
                  }}>
             </div>
          ) : (
            <div className={`w-full h-full rounded-full border-8 ${isFinished ? 'border-red-500' : 'border-gray-200'}`} />
          )}
        </div>
      );
    }

    return null; // 'flip' mode handles its own styling in the main time display below
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-8">
      <h2 className="text-3xl font-bold text-primary">Count Down</h2>

      {!isRunning && !isFinished && (
        <div className="flex flex-col items-center space-y-4">
          <div className="flex space-x-2 bg-white p-2 rounded-xl shadow-md border border-gray-200">
            <button onClick={() => setVisualMode('circle')} className={`p-2 rounded ${visualMode === 'circle' ? 'bg-primary/20 text-primary' : 'hover:bg-gray-100'}`} title="Circle Timer"><Circle size={20} /></button>
            <button onClick={() => setVisualMode('progress')} className={`p-2 rounded ${visualMode === 'progress' ? 'bg-primary/20 text-primary' : 'hover:bg-gray-100'}`} title="Progress Bar"><LayoutList size={20} /></button>
            <button onClick={() => setVisualMode('sand')} className={`p-2 rounded ${visualMode === 'sand' ? 'bg-primary/20 text-primary' : 'hover:bg-gray-100'}`} title="Sand Timer"><Hourglass size={20} /></button>
            <button onClick={() => setVisualMode('flip')} className={`p-2 rounded ${visualMode === 'flip' ? 'bg-primary/20 text-primary' : 'hover:bg-gray-100'}`} title="Flip Clock"><TimerIcon size={20} /></button>
            <button onClick={() => setVisualMode('rainbow')} className={`p-2 rounded ${visualMode === 'rainbow' ? 'bg-primary/20 text-primary' : 'hover:bg-gray-100'}`} title="Wait-Time Spinner"><Loader2 size={20} /></button>
          </div>

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
        </div>
      )}

      <div className={`
        relative flex flex-col items-center justify-center transition-colors duration-500
        ${visualMode === 'flip' ? 'bg-gray-900 p-8 rounded-xl border-4 border-gray-800' : `bg-white p-12 rounded-[3rem] shadow-2xl border-4 min-w-[300px] ${
          isFinished ? 'border-red-500 bg-red-50 animate-pulse' :
          isRunning && timeLeft <= 10 ? 'border-orange-500' : 'border-primary/10'
        }`}
      `}>
        <span className={`
          ${visualMode === 'flip' ? 'text-8xl font-mono font-bold tabular-nums tracking-tighter text-white bg-gray-800 p-4 rounded-lg shadow-inner' : `text-8xl font-mono font-bold tabular-nums tracking-tighter ${
            isFinished ? 'text-red-600' :
            isRunning && timeLeft <= 10 ? 'text-orange-500' : 'text-text'
          }`}
        `}>
          {formatTime(timeLeft)}
        </span>
        {isFinished && <p className={`text-xl font-bold mt-4 ${visualMode === 'flip' ? 'text-red-400' : 'text-red-500'}`}>Time's Up!</p>}
        {renderVisualization()}
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
