import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, Square, RotateCcw, Music, Clock, 
  Settings2, Trash2, ChevronRight, Volume2, Sparkles, Paintbrush, LayoutList, FileText,
  Circle, Triangle, Star, Pentagon, Diamond
} from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';
import { ToolHeader } from '../ToolHeader';

const SCALES = {
  Major: [0, 2, 4, 5, 7, 9, 11],
  Minor: [0, 2, 3, 5, 7, 8, 10],
  Pentatonic: [0, 2, 4, 7, 9],
  Chromatic: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
};

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const midiToFreq = (midi) => 440 * Math.pow(2, (midi - 69) / 12);
const getNoteName = (midi) => {
  const name = NOTE_NAMES[midi % 12];
  const octave = Math.floor(midi / 12) - 1;
  return `${name}${octave}`;
};

const INSTRUMENTS = [
  { id: 'marimba', label: 'Marimba', color: '#f59e0b', bg: 'bg-amber-500', shape: 'circle' },
  { id: 'piano', label: 'Piano', color: '#3b82f6', bg: 'bg-blue-500', shape: 'square' },
  { id: 'synth', label: 'Synth', color: '#a855f7', bg: 'bg-purple-500', shape: 'triangle' },
  { id: 'strings', label: 'Strings', color: '#10b981', bg: 'bg-emerald-500', shape: 'star' },
];

const PERCUSSION = [
  { id: 'drum', label: 'Kick', color: '#1e293b', shape: 'circle' },
  { id: 'snare', label: 'Snare', color: '#475569', shape: 'square' },
  { id: 'cymbal', label: 'Cymbal', color: '#64748b', shape: 'triangle' },
  { id: 'hihat', label: 'Hi-Hat', color: '#94a3b8', shape: 'diamond' },
];

const ShapeIcon = ({ shape, className, size = 16 }) => {
  switch (shape) {
    case 'circle': return <Circle size={size} className={className} />;
    case 'square': return <Square size={size} className={className} />;
    case 'triangle': return <Triangle size={size} className={className} />;
    case 'star': return <Star size={size} className={className} />;
    case 'pentagon': return <Pentagon size={size} className={className} />;
    case 'diamond': return <Diamond size={size} className={className} />;
    default: return null;
  }
};

export const SongMaker = () => {
  const [selectedInstrument, setSelectedInstrument] = useState(INSTRUMENTS[0]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  const [config, setConfig] = useState({
    bars: 4,
    beatsPerBar: 4,
    splits: 2,
    scale: 'Major',
    startNote: 60, // Middle C (C4)
    range: 2
  });
  
  const [tempo, setTempo] = useState(120);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeStep, setActiveStep] = useState(-1);
  const audioCtxRef = useRef(null);
  const timerRef = useRef(null);
  const containerRef = useRef(null);
  const [zoomScale, setZoomScale] = useState(1);

  // Derived values
  const cols = config.bars * config.beatsPerBar * config.splits;
  const scaleIntervals = SCALES[config.scale];
  const notes = useMemo(() => {
    const n = [];
    for (let o = config.range - 1; o >= 0; o--) {
      for (let i = scaleIntervals.length - 1; i >= 0; i--) {
        n.push(config.startNote + (o * 12) + scaleIntervals[i]);
      }
    }
    return n;
  }, [config]);

  const rows = notes.length + PERCUSSION.length;

  const [grid, setGrid] = useState(Array(rows).fill(null).map(() => Array(cols).fill(null)));
  
  // Re-initialize grid when config changes
  useEffect(() => {
    setGrid(Array(rows).fill(null).map(() => Array(cols).fill(null)));
  }, [rows, cols]);

  const initAudio = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
  };

  const playPercussion = (id) => {
    if (!audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    const now = ctx.currentTime;
    
    if (id === 'drum') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(0.01, now + 0.5);
      gain.gain.setValueAtTime(1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
      osc.start(now);
      osc.stop(now + 0.5);
    } else if (id === 'snare') {
      const noise = ctx.createBufferSource();
      const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.1, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < buffer.length; i++) data[i] = Math.random() * 2 - 1;
      noise.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 1000;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.5, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noise.start(now);
    } else if (id === 'cymbal') {
      const bufferSize = ctx.sampleRate * 0.2;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 5000;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noise.start(now);
    } else if (id === 'hihat') {
      const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.05, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < buffer.length; i++) data[i] = Math.random() * 2 - 1;
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 10000;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noise.start(now);
    }
  };

  const playNote = (freq, instrumentId) => {
    if (!audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.frequency.setValueAtTime(freq, ctx.currentTime);

    const now = ctx.currentTime;
    
    switch (instrumentId) {
      case 'marimba':
        osc.type = 'sine';
        gain.gain.setValueAtTime(0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        osc.start(now);
        osc.stop(now + 0.5);
        break;
      case 'piano':
        osc.type = 'triangle';
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1);
        osc.start(now);
        osc.stop(now + 1);
        break;
      case 'synth':
        osc.type = 'sawtooth';
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
        osc.start(now);
        osc.stop(now + 0.8);
        break;
      case 'strings':
        osc.type = 'sine';
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.3, now + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
        osc.start(now);
        osc.stop(now + 1.2);
        break;
      default:
        osc.type = 'sine';
        osc.start(now);
        osc.stop(now + 0.5);
    }
  };

  const toggleCell = (r, c) => {
    initAudio();
    const newGrid = [...grid.map(row => [...row])];
    const isPercussionRow = r >= notes.length;
    
    if (isPercussionRow) {
      const perc = PERCUSSION[r - notes.length];
      if (newGrid[r][c] === perc.id) {
        newGrid[r][c] = null;
      } else {
        newGrid[r][c] = perc.id;
        playPercussion(perc.id);
      }
    } else {
      if (newGrid[r][c] === selectedInstrument.id) {
        newGrid[r][c] = null;
      } else {
        newGrid[r][c] = selectedInstrument.id;
        playNote(midiToFreq(notes[r]), selectedInstrument.id);
      }
    }
    setGrid(newGrid);
  };

  const handlePaint = (e, r, c) => {
    if (e.buttons === 1) { // Left mouse button
      const newGrid = [...grid.map(row => [...row])];
      const isPercussionRow = r >= notes.length;
      
      if (isPercussionRow) {
        const perc = PERCUSSION[r - notes.length];
        if (newGrid[r][c] !== perc.id) {
          newGrid[r][c] = perc.id;
          setGrid(newGrid);
        }
      } else {
        if (newGrid[r][c] !== selectedInstrument.id) {
          newGrid[r][c] = selectedInstrument.id;
          setGrid(newGrid);
        }
      }
    }
  };

  const clearGrid = () => {
    setGrid(Array(rows).fill(null).map(() => Array(cols).fill(null)));
  };

  useEffect(() => {
    if (isPlaying) {
      const interval = (60 / tempo) * 1000 / config.splits; 
      timerRef.current = setInterval(() => {
        setActiveStep(prev => {
          const next = (prev + 1) % cols;
          // Play notes for this column
          grid.forEach((row, rIdx) => {
            if (row[next]) {
              if (rIdx >= notes.length) {
                playPercussion(row[next]);
              } else {
                playNote(midiToFreq(notes[rIdx]), row[next]);
              }
            }
          });
          return next;
        });
      }, interval);
    } else {
      clearInterval(timerRef.current);
      setActiveStep(-1);
    }
    return () => clearInterval(timerRef.current);
  }, [isPlaying, tempo, grid, cols, config.splits, notes]);

  // Handle auto-zoom when playing
  useEffect(() => {
    if (isPlaying && containerRef.current) {
      const containerWidth = containerRef.current.clientWidth - 16; // Subtract padding
      const containerHeight = containerRef.current.clientHeight - 16;
      
      const contentWidth = cols * 45 + 64; 
      const contentHeight = rows * 32; 
      
      const scaleX = containerWidth / contentWidth;
      const scaleY = containerHeight / contentHeight;
      
      // We want to fit both, so take the minimum scale
      const scale = Math.min(scaleX, scaleY, 1);
      setZoomScale(scale);
    } else {
      setZoomScale(1);
    }
  }, [isPlaying, cols, rows]);

  return (
    <div className="w-full mx-auto px-4 pt-2 pb-8 h-full flex flex-col gap-6 overflow-hidden">
      <ToolHeader
        title="Song Maker"
        icon={Music}
        description="Interactive Music Composition"
        infoContent={
          <>
            <p>
              <strong className="text-white block mb-1">Creating Music</strong>
              Click on the grid to place notes. Different shapes represent different instruments. The top section is for melodies, while the bottom section is for percussion.
            </p>
            <p>
              <strong className="text-white block mb-1">Controls</strong>
              Use the Play button to hear your creation. You can adjust the tempo, scale, and grid size in the settings panel.
            </p>
          </>
        }
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => { initAudio(); setIsPlaying(!isPlaying); }}
            className={`px-4 py-2 rounded-xl transition-all shadow-lg active:scale-95 flex items-center gap-2 font-black text-sm ${
              isPlaying ? 'bg-amber-50 text-amber-600' : 'bg-emerald-600 text-white shadow-emerald-100'
            }`}
          >
            {isPlaying ? <Square size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
            {isPlaying ? 'STOP' : 'PLAY'}
          </button>
          
          <button
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            className={`p-3 rounded-xl transition-all shadow-sm active:scale-95 border ${
              isSettingsOpen ? 'bg-indigo-600 text-white border-indigo-700' : 'bg-slate-50 text-slate-400 hover:bg-slate-100 border-slate-100'
            }`}
            title="Timeline Settings"
          >
            <Settings2 size={20} />
          </button>

          <button
            onClick={clearGrid}
            className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-red-50 hover:text-red-600 transition-all active:scale-95 border border-slate-100"
            title="Clear All Notes"
          >
            <Trash2 size={20} />
          </button>
        </div>
      </ToolHeader>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch min-h-0 overflow-hidden">
        {/* Main Canvas */}
        <div ref={containerRef} className="lg:col-span-9 bg-white rounded-[3rem] border-8 border-white shadow-2xl overflow-hidden relative flex flex-col min-h-0">
          <div className="flex-1 overflow-auto custom-scrollbar relative">
            <motion.div 
              animate={{ 
                scale: zoomScale,
                transformOrigin: 'top left'
              }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              className="flex min-w-max min-h-full"
            >
              {/* Note Labels Sidebar */}
              <div className="w-16 shrink-0 sticky left-0 z-20 bg-slate-50 border-r-2 border-slate-100 flex flex-col shadow-xl">
              {notes.map((midi, i) => (
                <div key={i} className="h-8 shrink-0 flex items-center justify-center text-[8px] font-black text-slate-400 leading-none bg-white border-b border-slate-50">
                  {getNoteName(midi)}
                </div>
              ))}
              {PERCUSSION.map((perc, i) => (
                <div 
                  key={perc.id} 
                  className={`h-8 shrink-0 flex items-center justify-center text-[9px] font-black uppercase leading-none border-b border-slate-100
                    ${i === 0 ? 'border-t-4 border-t-slate-200' : ''}
                    bg-slate-50 text-slate-400
                  `}
                >
                  {perc.label}
                </div>
              ))}
            </div>

              {/* Pitch Markers / Grid */}
              <div className="flex-1 flex bg-[#fcfdfe]">
              {grid[0] && grid[0].map((_, c) => (
                <div 
                  key={c} 
                  className={`flex-1 flex flex-col transition-colors relative min-w-[45px]
                    ${activeStep === c ? 'bg-indigo-50/50 z-10 shadow-[inset_0_0_0_2px_rgba(79,70,229,0.2)]' : 'bg-transparent'}
                    ${c % config.beatsPerBar === 0 ? 'border-l-2 border-slate-200' : 'border-l border-slate-100'}
                  `}
                >
                  {grid.map((row, r) => {
                    const isPercussion = r >= notes.length;
                    const cellVal = row[c];
                    
                    if (isPercussion) {
                      const perc = PERCUSSION[r - notes.length];
                      return (
                        <div
                          key={r}
                          onPointerDown={() => toggleCell(r, c)}
                          onPointerEnter={(e) => handlePaint(e, r, c)}
                          style={{ backgroundColor: cellVal ? perc.color : 'transparent' }}
                          className={`
                            h-8 shrink-0 flex items-center justify-center cursor-pointer transition-all border-b border-slate-100
                            ${r === notes.length ? 'border-t-4 border-t-slate-200' : ''}
                            ${!cellVal ? 'bg-slate-50/30 hover:bg-slate-100/50' : 'shadow-inner'}
                          `}
                        >
                          {cellVal && <ShapeIcon shape={perc.shape} className="text-white fill-white/80" size={16} />}
                        </div>
                      );
                    }

                    const inst = INSTRUMENTS.find(i => i.id === cellVal);
                    return (
                      <div
                        key={r}
                        onPointerDown={() => toggleCell(r, c)}
                        onPointerEnter={(e) => handlePaint(e, r, c)}
                        style={{ backgroundColor: inst ? inst.color : 'transparent' }}
                        className={`
                          h-8 shrink-0 flex items-center justify-center border-b border-slate-50 cursor-pointer transition-all
                          ${!inst ? 'bg-white hover:bg-slate-50' : 'shadow-inner'}
                          ${activeStep === c ? 'opacity-100' : 'opacity-90'}
                        `}
                      >
                        {inst && <ShapeIcon shape={inst.shape} className="text-white fill-white/80" size={16} />}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
            </motion.div>
          </div>
        </div>

        {/* Sidebar Controls */}
        <div className="lg:col-span-3 flex flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar">
          <AnimatePresence mode="wait">
            {isSettingsOpen ? (
              <SettingsPanel config={config} setConfig={setConfig} onClose={() => setIsSettingsOpen(false)} />
            ) : (
              <motion.div
                key="main-sidebar"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex flex-col gap-6"
              >
                {/* Instrument Palette */}
                <div className="bg-white rounded-[2.5rem] border-2 border-slate-100 shadow-sm p-6 space-y-6">
                  <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-3">
                    <Paintbrush size={14} />
                    Note Palette
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {INSTRUMENTS.map(inst => (
                      <button
                        key={inst.id}
                        onClick={() => setSelectedInstrument(inst)}
                        className={`
                          w-full px-4 py-4 rounded-2xl text-xs font-black transition-all flex items-center gap-4
                          ${selectedInstrument.id === inst.id ? 'bg-slate-900 text-white shadow-xl scale-105' : 'bg-slate-50 text-slate-500 hover:bg-slate-100 border border-slate-100'}
                        `}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-white/20 shadow-inner ${selectedInstrument.id === inst.id ? '' : 'bg-white/10'}`} style={{ backgroundColor: inst.color }}>
                          <ShapeIcon shape={inst.shape} className="text-white fill-white/50" size={18} />
                        </div>
                        {inst.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tempo Control */}
                <div className="bg-white rounded-[2.5rem] border-2 border-slate-100 shadow-sm p-6 space-y-4">
                  <div className="flex justify-between items-end">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <Clock size={12} /> Tempo
                    </label>
                    <span className="text-xl font-black text-indigo-600 tabular-nums">{tempo}</span>
                  </div>
                  <input
                    type="range"
                    min="60"
                    max="200"
                    step="5"
                    value={tempo}
                    onChange={(e) => setTempo(parseInt(e.target.value))}
                    className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                </div>

                <div className="p-5 bg-indigo-900 rounded-[2rem] text-white space-y-4 relative overflow-hidden group">
                  <Sparkles className="absolute -right-4 -bottom-4 text-white/10 w-24 h-24 rotate-12 group-hover:scale-110 transition-transform" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-indigo-300">Pro Tip</p>
                  <p className="text-xs font-medium leading-relaxed">
                    The bottom two rows are for <strong>Rhythm</strong>. Use the circular cells for deep kicks and triangles for bright cymbals!
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

const SettingsPanel = ({ config, setConfig, onClose }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-white rounded-[2.5rem] border-2 border-slate-100 shadow-xl p-8 space-y-8"
    >
      <div className="flex justify-between items-center border-b border-slate-50 pb-4">
        <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Timeline</h3>
        <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-full text-slate-300 transition-colors"><Trash2 size={20} /></button>
      </div>

      <div className="space-y-6">
        <div className="space-y-3">
          <div className="flex justify-between">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bars</label>
            <span className="font-bold text-indigo-600">{config.bars}</span>
          </div>
          <input type="range" min="1" max="16" value={config.bars} onChange={(e) => setConfig({...config, bars: parseInt(e.target.value)})} className="w-full accent-indigo-600" />
        </div>

        <div className="space-y-3">
          <div className="flex justify-between">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Scale</label>
            <span className="font-bold text-indigo-600 text-[10px] uppercase">{config.scale}</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {Object.keys(SCALES).map(s => (
              <button
                key={s}
                onClick={() => setConfig({...config, scale: s})}
                className={`py-2 rounded-xl text-[10px] font-black transition-all ${config.scale === s ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3 pt-4">
          <button 
            onClick={onClose}
            className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all"
          >
            Apply Changes
          </button>
        </div>
      </div>
    </motion.div>
  );
};
