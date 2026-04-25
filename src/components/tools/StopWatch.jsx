import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Flag, ListOrdered, Clock, Volume2, VolumeX, Download } from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';
import { ToolHeader } from '../ToolHeader';
import { audioEngine } from '../../utils/audio';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { formatStopwatchTime } from '../../utils/format';
import { downloadCSV } from '../../utils/export';

export const StopWatch = () => {
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [laps, setLaps] = useState([]);
  const [isMuted, setIsMuted] = useLocalStorage('teacherToolsStopwatchMuted', false);
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

  const clearLaps = () => {
    setLaps([]);
  };

  const addLap = () => {
    if (time === 0) return;
    const lastLapTime = laps.length > 0 ? laps[0].total : 0;
    const lapTime = time - lastLapTime;
    setLaps([{ id: Date.now(), lap: lapTime, total: time }, ...laps]);
  };

  const handleDownload = () => {
    if (laps.length === 0) return;
    downloadCSV(laps.map((l, i) => ({
      'Lap Number': laps.length - i,
      'Lap Time (ms)': l.lap,
      'Total Time (ms)': l.total,
      'Formatted Lap': formatStopwatchTime(l.lap),
      'Formatted Total': formatStopwatchTime(l.total)
    })), `stopwatch_data_${new Date().toISOString().slice(0,10)}.csv`);
  };


  return (
    <div className="w-full mx-auto px-4 pt-2 pb-8 h-full flex flex-col gap-8">
      <ToolHeader
        title="Stop Watch"
        icon={Clock}
        description="Precision Timing Suite"
        infoContent={
          <>
            <p>
              <strong className="text-white block mb-1">Time Laps</strong>
              Record intermediate times without stopping the main clock. Great for science experiments or races!
            </p>
            <p>
              <strong className="text-white block mb-1">Export Data</strong>
              Download your lap history as a CSV file to analyze in your favorite spreadsheet app.
            </p>
          </>
        }
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className={`p-2.5 rounded-xl transition-all shadow-sm active:scale-95 border ${
              isMuted ? 'bg-rose-500 text-white border-rose-600' : 'bg-slate-50 text-slate-400 hover:bg-slate-100 border-slate-100'
            }`}
            title={isMuted ? "Unmute Ticks" : "Mute Ticks"}
          >
            {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>
        </div>
      </ToolHeader>

      <div className="relative mx-auto">
        <div className="relative flex flex-col items-center justify-center transition-colors duration-500 overflow-hidden w-[350px] h-[180px] md:w-[450px] md:h-[220px] bg-white rounded-[2.5rem] shadow-xl border-4 border-indigo-500/10">
          <span className="text-6xl md:text-7xl font-mono font-black text-slate-800 tabular-nums tracking-tighter">
            {formatStopwatchTime(time)}
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

      </div>

      {/* Laps List */}
      <div className="w-full max-w-md mx-auto bg-white rounded-[2.5rem] shadow-2xl border border-slate-50 overflow-hidden flex flex-col flex-1 min-h-[300px]">
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <ListOrdered size={18} className="text-indigo-500" />
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Lap History</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              disabled={laps.length === 0}
              className="p-2 bg-white text-indigo-600 rounded-lg border border-indigo-100 hover:bg-indigo-50 transition-all disabled:opacity-30"
              title="Export CSV"
            >
              <Download size={14} />
            </button>
            <button
              onClick={clearLaps}
              disabled={laps.length === 0}
              className="p-2 bg-white text-rose-600 rounded-lg border border-rose-100 hover:bg-rose-50 transition-all disabled:opacity-30"
              title="Clear History"
            >
              <RotateCcw size={14} />
            </button>
            <span className="bg-indigo-100 text-indigo-600 text-[10px] font-black px-3 py-1 rounded-full ml-1">
              {laps.length}
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-2">
          <AnimatePresence initial={false}>
            {laps.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-300 italic gap-3">
                <Flag size={32} className="opacity-20" />
                <p className="text-xs font-bold uppercase tracking-widest">No laps recorded</p>
              </div>
            ) : (
              laps.map((lap, index) => (
                <motion.div
                  key={lap.id}
                  initial={{ opacity: 0, x: -20, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  className="flex items-center justify-between px-4 py-2.5 bg-slate-50 rounded-xl border border-slate-100 group hover:border-indigo-200 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 flex items-center justify-center bg-white rounded-lg shadow-sm text-[10px] font-black text-indigo-500 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                      {laps.length - index}
                    </span>
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Lap Time</span>
                      <span className="text-sm font-black text-slate-800 tabular-nums leading-tight">+{formatStopwatchTime(lap.lap)}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Total</span>
                    <span className="text-base font-black text-indigo-600 tabular-nums leading-tight">{formatStopwatchTime(lap.total)}</span>
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
