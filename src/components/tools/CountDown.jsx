// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Circle, LayoutList, Hourglass, Timer as TimerIcon, Loader2, ChevronUp, ChevronDown } from 'lucide-react';
import { ToolHeader } from '../ToolHeader';

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
  const [soundOverride, setSoundOverride] = useState('default');

  const { settings } = useSettings();

  useEffect(() => {
    let intervalId;
    if (isRunning && timeLeft > 0) {
      intervalId = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            setIsFinished(true);
            const activeTheme = soundOverride === 'default' ? settings.soundTheme : soundOverride;
            audioEngine.playAlarm(activeTheme);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(intervalId);
  }, [isRunning, timeLeft, settings.soundTheme, soundOverride]);

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
      const strokeDashoffset = (remainingProgress / 100) * circumference;

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
      // Need a smaller radius if we use a huge strokeWidth so it doesn't overflow
      // A circle with cx=80, cy=80, r=40, strokeWidth=80 will have an outer radius of 80 (fills 160x160)
      const radius = 40;
      const circumference = 2 * Math.PI * radius;
      const strokeDashoffset = (remainingProgress / 100) * circumference;

      // Rainbow color logic based on remaining progress
      // We will map 100->0 to a hue 0->360 to fade through colors
      const hue = (remainingProgress / 100) * 360;

      return (
        <div className="relative mt-8">
          <svg className="transform -rotate-90 w-40 h-40 overflow-visible">
            <circle cx="80" cy="80" r={radius} stroke="currentColor" strokeWidth="80" fill="transparent" className="text-gray-100" />
            <motion.circle
              cx="80" cy="80" r={radius}
              stroke="currentColor"
              strokeWidth="80"
              fill="transparent"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: 0 }}
              animate={{ strokeDashoffset }}
              transition={{ ease: "linear", duration: 1 }}
              style={{
                color: isFinished ? '#ef4444' : `hsl(${hue}, 100%, 50%)`
              }}
            />
          </svg>
        </div>
      );
    }

    return null; // 'flip' mode handles its own styling in the main time display below
  };

  return (
    <div className="w-full mx-auto px-4 pt-2 pb-8 h-full flex flex-col gap-8">
      <ToolHeader
        title="Count Down"
        icon={TimerIcon}
        description="Visual Time Management for Lessons"
        infoContent={
          <>
            <p>
              <strong className="text-white block mb-1">Visual Modes</strong>
              Choose between Circle, Progress Bar, Sand Timer, Flip Clock, or Rainbow Spinner to match your classroom vibe.
            </p>
            <p>
              <strong className="text-white block mb-1">Custom Sounds</strong>
              Select from a variety of alarm sounds to signal when the time is up.
            </p>
          </>
        }
      />

      <div className="flex flex-col items-center gap-12 w-full max-w-6xl mx-auto">
        {/* Timer & Controls */}
        <div className="flex flex-col items-center space-y-8">
          <div className={`
            relative flex flex-col items-center justify-center transition-colors duration-500 overflow-hidden w-[350px] h-[350px] md:w-[400px] md:h-[400px]
            ${visualMode === 'flip' ? 'bg-gray-900 rounded-xl border-4 border-gray-800' : `bg-white rounded-[3rem] shadow-2xl border-4 ${
              isFinished ? 'border-red-500 bg-red-50 animate-pulse' :
              isRunning && timeLeft <= 10 ? 'border-orange-500' : 'border-primary/10'
            }`}
          `}>
            <div className="flex items-center space-x-2">
              {/* Minutes Column */}
              <div className="relative flex flex-col items-center">
                <button 
                  onClick={() => setInitialMinutes(m => Math.min(99, m + 1))}
                  className={`absolute -top-12 p-1 hover:bg-white/10 rounded-full transition-all duration-300 ${
                    isRunning || isFinished ? 'opacity-0 pointer-events-none' : 'opacity-100'
                  } ${visualMode === 'flip' ? 'text-white/40 hover:text-white' : 'text-slate-300 hover:text-primary'}`}
                >
                  <ChevronUp size={48} />
                </button>
                <input
                  type="text"
                  inputMode="numeric"
                  readOnly={isRunning || isFinished}
                  value={isRunning || isFinished 
                    ? Math.floor(timeLeft / 60).toString().padStart(2, '0') 
                    : initialMinutes.toString().padStart(2, '0')
                  }
                  onChange={(e) => setInitialMinutes(Math.max(0, Math.min(99, parseInt(e.target.value.replace(/\D/g, '')) || 0)))}
                  className={`w-[110px] text-center bg-transparent border-none focus:outline-none focus:ring-0 p-0 text-7xl md:text-8xl font-mono font-bold tabular-nums tracking-tighter ${
                    visualMode === 'flip' ? 'text-white' : (isFinished ? 'text-red-600' : (isRunning && timeLeft <= 10 ? 'text-orange-500' : 'text-text'))
                  }`}
                />
                <button 
                  onClick={() => setInitialMinutes(m => Math.max(0, m - 1))}
                  className={`absolute -bottom-12 p-1 hover:bg-white/10 rounded-full transition-all duration-300 ${
                    isRunning || isFinished ? 'opacity-0 pointer-events-none' : 'opacity-100'
                  } ${visualMode === 'flip' ? 'text-white/40 hover:text-white' : 'text-slate-300 hover:text-primary'}`}
                >
                  <ChevronDown size={48} />
                </button>
              </div>
              
              <span className={`text-7xl md:text-8xl font-mono font-bold ${
                visualMode === 'flip' ? 'text-white' : (isFinished ? 'text-red-600' : (isRunning && timeLeft <= 10 ? 'text-orange-500' : 'text-text'))
              }`}>:</span>
              
              {/* Seconds Column */}
              <div className="relative flex flex-col items-center">
                <button 
                  onClick={() => setInitialSeconds(s => (s + 1) % 60)}
                  className={`absolute -top-12 p-1 hover:bg-white/10 rounded-full transition-all duration-300 ${
                    isRunning || isFinished ? 'opacity-0 pointer-events-none' : 'opacity-100'
                  } ${visualMode === 'flip' ? 'text-white/40 hover:text-white' : 'text-slate-300 hover:text-primary'}`}
                >
                  <ChevronUp size={48} />
                </button>
                <input
                  type="text"
                  inputMode="numeric"
                  readOnly={isRunning || isFinished}
                  value={isRunning || isFinished 
                    ? (timeLeft % 60).toString().padStart(2, '0') 
                    : initialSeconds.toString().padStart(2, '0')
                  }
                  onChange={(e) => setInitialSeconds(Math.max(0, Math.min(59, parseInt(e.target.value.replace(/\D/g, '')) || 0)))}
                  className={`w-[110px] text-center bg-transparent border-none focus:outline-none focus:ring-0 p-0 text-7xl md:text-8xl font-mono font-bold tabular-nums tracking-tighter ${
                    visualMode === 'flip' ? 'text-white' : (isFinished ? 'text-red-600' : (isRunning && timeLeft <= 10 ? 'text-orange-500' : 'text-text'))
                  }`}
                />
                <button 
                  onClick={() => setInitialSeconds(s => (s - 1 + 60) % 60)}
                  className={`absolute -bottom-12 p-1 hover:bg-white/10 rounded-full transition-all duration-300 ${
                    isRunning || isFinished ? 'opacity-0 pointer-events-none' : 'opacity-100'
                  } ${visualMode === 'flip' ? 'text-white/40 hover:text-white' : 'text-slate-300 hover:text-primary'}`}
                >
                  <ChevronDown size={48} />
                </button>
              </div>
            </div>
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

        {/* Configuration */}
        <div className={`transition-all duration-500 w-full flex justify-center ${
          isRunning || isFinished ? 'opacity-0 pointer-events-none scale-95' : 'opacity-100'
        }`}>
          <div className="flex flex-col md:flex-row gap-6 w-full max-w-4xl justify-center">
            
            <div className="flex flex-col space-y-3 bg-white p-6 rounded-2xl shadow-xl border border-gray-100 w-full max-w-[350px]">
              <label className="text-sm text-gray-500 font-bold uppercase tracking-wider text-center border-b pb-2 mb-1">Visual Mode</label>
              <div className="grid grid-cols-5 gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-100">
                <button onClick={() => setVisualMode('circle')} className={`p-3 rounded-lg transition-all flex justify-center ${visualMode === 'circle' ? 'bg-white text-primary shadow-md' : 'text-slate-400 hover:text-slate-600'}`} title="Circle Timer"><Circle size={20} /></button>
                <button onClick={() => setVisualMode('progress')} className={`p-3 rounded-lg transition-all flex justify-center ${visualMode === 'progress' ? 'bg-white text-primary shadow-md' : 'text-slate-400 hover:text-slate-600'}`} title="Progress Bar"><LayoutList size={20} /></button>
                <button onClick={() => setVisualMode('sand')} className={`p-3 rounded-lg transition-all flex justify-center ${visualMode === 'sand' ? 'bg-white text-primary shadow-md' : 'text-slate-400 hover:text-slate-600'}`} title="Sand Timer"><Hourglass size={20} /></button>
                <button onClick={() => setVisualMode('flip')} className={`p-3 rounded-lg transition-all flex justify-center ${visualMode === 'flip' ? 'bg-white text-primary shadow-md' : 'text-slate-400 hover:text-slate-600'}`} title="Flip Clock"><TimerIcon size={20} /></button>
                <button onClick={() => setVisualMode('rainbow')} className={`p-3 rounded-lg transition-all flex justify-center ${visualMode === 'rainbow' ? 'bg-white text-primary shadow-md' : 'text-slate-400 hover:text-slate-600'}`} title="Wait-Time Spinner"><Loader2 size={20} /></button>
              </div>
            </div>
            
            <div className="flex flex-col space-y-3 bg-white p-6 rounded-2xl shadow-xl border border-gray-100 w-full max-w-[450px]">
              <label className="text-sm text-gray-500 font-bold uppercase tracking-wider text-center border-b pb-2 mb-1">Sound Effect</label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                {[
                  { id: 'default', name: 'Default' },
                  { id: 'none', name: 'None' },
                  { id: 'classic', name: 'Clsc' },
                  { id: 'digital', name: 'Digi' },
                  { id: 'soft', name: 'Soft' },
                  { id: 'bubbly', name: 'Bubl' },
                  { id: 'chime', name: 'Chim' },
                  { id: 'synth', name: 'Synt' },
                  { id: 'beep', name: 'Beep' },
                  { id: 'siren', name: 'Sire' },
                ].map((option) => (
                  <button
                    key={option.id}
                    onClick={() => {
                      setSoundOverride(option.id);
                      if (option.id !== 'none') {
                        audioEngine.playAlarm(option.id === 'default' ? settings.soundTheme : option.id);
                      }
                    }}
                    className={`p-2 text-[11px] rounded-lg border-2 font-black uppercase tracking-tighter transition-all ${
                      soundOverride === option.id 
                        ? (option.id === 'default' ? 'border-amber-500 bg-amber-50 text-amber-700' : 'border-primary bg-primary/10 text-primary')
                        : (option.id === 'default' ? 'border-amber-100 hover:border-amber-300 text-amber-600 bg-amber-50/50' : 'border-gray-100 hover:border-primary/30 text-gray-600 bg-gray-50 hover:bg-gray-100')
                    }`}
                  >
                    {option.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
