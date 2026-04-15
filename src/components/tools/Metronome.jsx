import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Plus, Minus } from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';
import { motion } from 'framer-motion';

export const Metronome = () => {
  const [bpm, setBpm] = useState(120);
  const [isPlaying, setIsPlaying] = useState(false);
  const [beat, setBeat] = useState(0);
  const { settings } = useSettings();

  const audioCtxRef = useRef(null);
  const timerIDRef = useRef(null);
  const nextNoteTimeRef = useRef(0);
  const currentBeatRef = useRef(0);

  const scheduleAheadTime = 0.1;
  const lookahead = 25.0;

  useEffect(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    return () => {
      if (timerIDRef.current) clearTimeout(timerIDRef.current);
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
         audioCtxRef.current.close();
      }
    };
  }, []);

  const nextNote = () => {
    const secondsPerBeat = 60.0 / bpm;
    nextNoteTimeRef.current += secondsPerBeat;
    currentBeatRef.current = (currentBeatRef.current + 1) % 4;
  };

  const playClick = (time, isFirstBeat) => {
    if (!settings.soundsEnabled) return;

    const osc = audioCtxRef.current.createOscillator();
    const gain = audioCtxRef.current.createGain();

    osc.connect(gain);
    gain.connect(audioCtxRef.current.destination);

    if (isFirstBeat) {
      osc.frequency.value = 1200; // higher pitch for first beat
    } else {
      osc.frequency.value = 800; // lower pitch for other beats
    }

    gain.gain.setValueAtTime(1, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);

    osc.start(time);
    osc.stop(time + 0.1);

    // Visual update
    setTimeout(() => {
      setBeat(currentBeatRef.current);
    }, (time - audioCtxRef.current.currentTime) * 1000);
  };

  const scheduler = () => {
    while (nextNoteTimeRef.current < audioCtxRef.current.currentTime + scheduleAheadTime) {
      playClick(nextNoteTimeRef.current, currentBeatRef.current === 0);
      nextNote();
    }
    timerIDRef.current = setTimeout(scheduler, lookahead);
  };

  useEffect(() => {
    if (isPlaying) {
      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }
      currentBeatRef.current = 0;
      setBeat(0);
      nextNoteTimeRef.current = audioCtxRef.current.currentTime + 0.05;
      scheduler();
    } else {
      clearTimeout(timerIDRef.current);
      setBeat(0);
    }
    return () => clearTimeout(timerIDRef.current);
  }, [isPlaying, bpm, settings.soundsEnabled]);

  const handleBpmChange = (e) => {
    setBpm(Math.min(300, Math.max(30, Number(e.target.value))));
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-12">
      <h2 className="text-3xl font-bold text-primary">Metronome</h2>

      {/* Visual Indicator */}
      <div className="flex gap-4">
        {[0, 1, 2, 3].map((b) => (
          <motion.div
            key={b}
            animate={{
              scale: isPlaying && beat === b ? 1.2 : 1,
              backgroundColor: isPlaying && beat === b
                ? (b === 0 ? '#ef4444' : '#3b82f6') // Red for downbeat, blue for others
                : '#e5e7eb' // Gray when inactive
            }}
            transition={{ duration: 0.1 }}
            className="w-12 h-12 rounded-full border-2 border-gray-300 shadow-sm"
          />
        ))}
      </div>

      {/* Controls */}
      <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 flex flex-col items-center space-y-8 min-w-[320px]">

        <div className="text-center">
          <div className="text-6xl font-bold text-text tabular-nums">{bpm}</div>
          <div className="text-sm text-gray-500 uppercase tracking-widest font-semibold mt-1">BPM</div>
        </div>

        <div className="flex items-center gap-4 w-full">
          <button
            onClick={() => setBpm(b => Math.max(30, b - 1))}
            className="p-3 bg-gray-100 rounded-full hover:bg-gray-200 active:scale-95 transition-all text-gray-700"
          >
            <Minus size={20} />
          </button>

          <input
            type="range"
            min="30"
            max="300"
            value={bpm}
            onChange={handleBpmChange}
            className="flex-1 accent-primary"
          />

          <button
            onClick={() => setBpm(b => Math.min(300, b + 1))}
            className="p-3 bg-gray-100 rounded-full hover:bg-gray-200 active:scale-95 transition-all text-gray-700"
          >
            <Plus size={20} />
          </button>
        </div>

        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className={`w-24 h-24 rounded-full flex items-center justify-center text-white shadow-lg transition-transform hover:scale-105 active:scale-95 ${
            isPlaying ? 'bg-red-500 hover:bg-red-600' : 'bg-primary hover:bg-primary/90'
          }`}
        >
          {isPlaying ? <Pause size={40} /> : <Play size={40} className="ml-2" />}
        </button>

      </div>
    </div>
  );
};
