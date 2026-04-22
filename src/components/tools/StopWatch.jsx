import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Flag, ListOrdered, Clock, Volume2, VolumeX, Download } from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';
import { audioEngine } from '../../utils/audio';
import { motion, AnimatePresence } from 'framer-motion';

export const StopWatch = () => {
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [laps, setLaps] = useState([]);
  const [isMuted, setIsMuted] = useState(() => {
    const saved = localStorage.getItem('teacherToolsStopwatchMuted');
    return saved ? JSON.parse(saved) : false;
  });
  const { settings } = useSettings();
  const lastTickRef = useRef(0);

  useEffect(() => {
    let intervalId;
    if (isRunning) {
      intervalId = setInterval(() => {
        setTime((prev) => {
          const newTime = prev + 10;
          if (Math.floor(newTime / 1000) > lastTickRef.current) {
            if (!isMuted) audioEngine.playTick(settings.soundTheme);
            lastTickRef.current = Math.floor(newTime / 1000);
          }
          return newTime;
        });
      }, 10);
    }
    return () => clearInterval(intervalId);
  }, [isRunning, settings.soundTheme, isMuted]);

  useEffect(() => {
    localStorage.setItem('teacherToolsStopwatchMuted', JSON.stringify(isMuted));
  }, [isMuted]);

  const toggle = () => {
    setIsRunning(!isRunning);
    if (!isRunning) {
      lastTickRef.current = Math.floor(time / 1000);
    }
  };

  const reset = () => {
    setIsRunning(false);
    setTime(0);
    setLaps([]);
    lastTickRef.current = 0;
  };

  const addLap = () => {
    if (time === 0) return;
    const lastLapTime = laps.length > 0 ? laps[0].total : 0;
    const lapTime = time - lastLapTime;
    setLaps([{ id: Date.now(), lap: lapTime, total: time }, ...laps]);
  };

  const downloadCSV = () => {
    if (laps.length === 0) return;
    
    const headers = ['Lap Number', 'Lap Time (ms)', 'Total Time (ms)', 'Formatted Lap', 'Formatted Total'];
    const rows = laps.map((l, i) => [
      laps.length - i,
      l.lap,
      l.total,
      formatTime(l.lap),
      formatTime(l.total)
    ]);
    
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `stopwatch_data_${new Date().toISOString().slice(0,10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatTime = (ms) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const centiseconds = Math.floor((ms % 1000) / 10);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 flex flex-col items-center gap-10 select-none">
      <div className="text-center space-y-2">
        <h2 className="text-5xl font-black text-slate-800 tracking-tighter italic uppercase flex items-center gap-4">
          <Clock className="text-indigo-600" size={40} />
          Stopwatch
        </h2>
        <p className="text-slate-400 font-bold uppercase tracking-[0.3em] text-[10px]">Precision Timing Suite</p>
      </div>

      <div className="relative group">
        {/* Glow effect */}
        <div className="absolute -inset-4 bg-indigo-500/20 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity rounded-full" />
        
        <div className="relative bg-white p-12 md:p-20 rounded-[4rem] shadow-2xl border-b-8 border-indigo-100 min-w-[320px] md:min-w-[480px] flex items-center justify-center overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500" />
          <span className="text-7xl md:text-9xl font-mono font-black text-slate-800 tabular-nums tracking-tight">
            {formatTime(time)}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-6">
        <button
          onClick={addLap}
          disabled={!isRunning && time === 0}
          className="w-20 h-20 rounded-3xl flex flex-col items-center justify-center bg-indigo-50 text-indigo-600 shadow-xl shadow-indigo-100 hover:bg-indigo-600 hover:text-white transition-all active:scale-90 disabled:opacity-50 group"
        >
          <Flag size={24} className="group-hover:-rotate-12 transition-transform" />
          <span className="text-[10px] font-black uppercase mt-1">Lap</span>
        </button>

        <button
          onClick={toggle}
          className={`w-28 h-28 rounded-[2.5rem] flex items-center justify-center text-white shadow-2xl transition-all hover:scale-110 active:scale-95 ${
            isRunning 
              ? 'bg-rose-500 shadow-rose-200' 
              : 'bg-emerald-500 shadow-emerald-200'
          }`}
        >
          {isRunning ? <Pause size={48} fill="currentColor" /> : <Play size={48} className="ml-2" fill="currentColor" />}
        </button>

        <button
          onClick={reset}
          disabled={isRunning && time === 0}
          className="w-20 h-20 rounded-3xl flex flex-col items-center justify-center bg-slate-100 text-slate-500 shadow-xl shadow-slate-200 hover:bg-slate-800 hover:text-white transition-all active:scale-90 disabled:opacity-50"
        >
          <RotateCcw size={24} />
          <span className="text-[10px] font-black uppercase mt-1">Reset</span>
        </button>

        <button
          onClick={() => setIsMuted(!isMuted)}
          className={`w-20 h-20 rounded-3xl flex flex-col items-center justify-center shadow-xl transition-all active:scale-90 ${
            isMuted 
              ? 'bg-rose-100 text-rose-500 shadow-rose-100' 
              : 'bg-slate-100 text-slate-500 shadow-slate-200 hover:bg-slate-800 hover:text-white'
          }`}
        >
          {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
          <span className="text-[10px] font-black uppercase mt-1">{isMuted ? 'Muted' : 'Sound'}</span>
        </button>
      </div>

      {/* Laps List */}
      <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl border border-slate-50 overflow-hidden flex flex-col h-[400px]">
        <div className="bg-slate-50 px-8 py-6 border-b border-slate-100 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <ListOrdered size={20} className="text-indigo-500" />
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Lap History</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={downloadCSV}
              disabled={laps.length === 0}
              className="p-2 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors disabled:opacity-30"
              title="Download CSV"
            >
              <Download size={18} />
            </button>
            <span className="bg-indigo-100 text-indigo-600 text-[10px] font-black px-3 py-1 rounded-full">
              {laps.length} LAPS
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-3">
          <AnimatePresence initial={false}>
            {laps.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-300 italic gap-4">
                <Flag size={48} className="opacity-20" />
                <p className="text-sm font-bold uppercase tracking-widest">No laps recorded</p>
              </div>
            ) : (
              laps.map((lap, index) => (
                <motion.div
                  key={lap.id}
                  initial={{ opacity: 0, x: -20, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-indigo-200 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <span className="w-10 h-10 flex items-center justify-center bg-white rounded-xl shadow-sm text-xs font-black text-indigo-500 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                      {laps.length - index}
                    </span>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Lap Time</span>
                      <span className="text-lg font-black text-slate-800 tabular-nums">+{formatTime(lap.lap)}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Total</span>
                    <span className="text-lg font-black text-indigo-600 tabular-nums">{formatTime(lap.total)}</span>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
