import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  Square, 
  RotateCcw, 
  Music, 
  Clock, 
  Settings2, 
  Trash2, 
  ChevronRight, 
  Volume2, 
  Sparkles, 
  Paintbrush, 
  LayoutList,
  Circle, 
  Triangle, 
  Star, 
  Pentagon, 
  Diamond,
} from 'lucide-react';
import { ToolPanel } from '../shared/ToolPanel';
import { useSettings } from '../../contexts/SettingsContext';
import { useHeader } from '../../contexts/HeaderContext';
import { audioEngine } from '../../utils/audio';

// 1. Constants
const SCALES = {
  Major: [0, 2, 4, 5, 7, 9, 11],
  Minor: [0, 2, 3, 5, 7, 8, 10],
  Pentatonic: [0, 2, 4, 7, 9],
};

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const INSTRUMENTS = [
  { id: 'marimba', label: 'Marimba', color: '#f59e0b', bg: 'bg-amber-500', shape: 'circle' },
  { id: 'piano', label: 'Piano', color: '#3b82f6', bg: 'bg-blue-500', shape: 'square' },
  { id: 'synth', label: 'Synth', color: '#a855f7', bg: 'bg-purple-500', shape: 'triangle' },
  { id: 'strings', label: 'Strings', color: '#f43f5e', bg: 'bg-rose-500', shape: 'pentagon' },
];

const PERCUSSION = [
  { id: 'drum', label: 'Kick', color: '#1e293b', shape: 'circle' },
  { id: 'snare', label: 'Snare', color: '#475569', shape: 'square' },
  { id: 'cymbal', label: 'Cymbal', color: '#64748b', shape: 'star' },
  { id: 'hihat', label: 'Hi-Hat', color: '#94a3b8', shape: 'diamond' },
];

// 2. Config (None)

// 3. Text (Help and Info)
const HELP_INFO = (
  <div className="space-y-4 font-['Outfit']">
    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">How to Use</h3>
    <div className="space-y-3">
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center text-xs font-black text-indigo-600 shrink-0">1</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">Pick an <b>Instrument</b> or <b>Drum</b> from the sidebar.</p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center text-xs font-black text-blue-600 shrink-0">2</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">Click on the <b>Grid</b> to add notes. High notes are at the top.</p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-emerald-50 flex items-center justify-center text-xs font-black text-emerald-600 shrink-0">3</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">Change the <b>Speed</b> to make your song faster or slower.</p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-amber-50 flex items-center justify-center text-xs font-black text-amber-600 shrink-0">4</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">The bottom 4 rows are for <b>Drums</b>.</p>
      </div>
    </div>
  </div>
);

// 4. Local Storage (None)

// 5. Classes (None)

// 6. Functions
const midiToFreq = (midi: number) => 440 * Math.pow(2, (midi - 69) / 12);
const getNoteName = (midi: number) => {
  const name = NOTE_NAMES[midi % 12];
  const octave = Math.floor(midi / 12) - 1;
  return `${name}${octave}`;
};

const ShapeIcon = ({ shape, className, size = 16 }: { shape: string, className?: string, size?: number }) => {
  switch (shape) {
    case 'circle': return <Circle size={size} className={className} />;
    case 'square': return <Square size={size} className={className} />;
    case 'triangle': return <Triangle size={size} className={className} />;
    case 'pentagon': return <Pentagon size={size} className={className} />;
    case 'star': return <Star size={size} className={className} />;
    case 'diamond': return <Diamond size={size} className={className} />;
    default: return null;
  }
};

// 7. Component
export const SongMaker = () => {
  const { setHeaderActions, setHelpContent, setOnReset, clearHeader } = useHeader();
  const { settings } = useSettings();
  
  const [selectedInstrument, setSelectedInstrument] = useState(INSTRUMENTS[0]);
  const [tempo, setTempo] = useState(120);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeStep, setActiveStep] = useState(-1);

  const [config] = useState({
    bars: 4,
    beatsPerBar: 4,
    splits: 2,
    scale: 'Major',
    startNote: 60,
    range: 1
  });

  const cols = config.bars * config.beatsPerBar * config.splits;
  const notes = useMemo(() => {
    const n = [];
    const scaleIntervals = SCALES[config.scale as keyof typeof SCALES];
    for (let o = config.range - 1; o >= 0; o--) {
      for (let i = scaleIntervals.length - 1; i >= 0; i--) {
        n.push(config.startNote + (o * 12) + scaleIntervals[i]);
      }
    }
    return n;
  }, [config]);

  const rows = notes.length + PERCUSSION.length;
  const [grid, setGrid] = useState(() => Array(rows).fill(null).map(() => Array(cols).fill(null)));
  const [prevDimensions, setPrevDimensions] = useState({ rows, cols });

  if (prevDimensions.rows !== rows || prevDimensions.cols !== cols) {
    setPrevDimensions({ rows, cols });
    setGrid(Array(rows).fill(null).map(() => Array(cols).fill(null)));
  }

  const resetGrid = useCallback(() => {
    setGrid(Array(rows).fill(null).map(() => Array(cols).fill(null)));
    setIsPlaying(false);
    setActiveStep(-1);
    audioEngine.playTick(settings.soundTheme);
  }, [rows, cols, settings.soundTheme]);

  useEffect(() => {
    setOnReset(() => resetGrid);
    setHelpContent(HELP_INFO);
    return () => clearHeader();
  }, [clearHeader, setOnReset, resetGrid, setHelpContent]);

  const toggleCell = (r: number, c: number) => {
    const newGrid = [...grid.map(row => [...row])];
    const isPercussionRow = r >= notes.length;
    
    if (isPercussionRow) {
      const perc = PERCUSSION[r - notes.length];
      if (newGrid[r][c] === perc.id) {
        newGrid[r][c] = null;
      } else {
        newGrid[r][c] = perc.id;
        audioEngine.playTone(100, 0.1, 'perc');
      }
    } else {
      if (newGrid[r][c] === selectedInstrument.id) {
        newGrid[r][c] = null;
      } else {
        newGrid[r][c] = selectedInstrument.id;
        audioEngine.playTone(midiToFreq(notes[r]), 0.1, selectedInstrument.id);
      }
    }
    setGrid(newGrid);
  };

  useEffect(() => {
    let timer: any;
    if (isPlaying) {
      const interval = (60 / tempo) * 1000 / config.splits;
      timer = setInterval(() => {
        setActiveStep(prev => {
          const next = (prev + 1) % cols;
          grid.forEach((row, rIdx) => {
            if (row[next]) {
              if (rIdx >= notes.length) {
                audioEngine.playTone(100, 0.1, 'perc');
              } else {
                audioEngine.playTone(midiToFreq(notes[rIdx]), 0.1, row[next]);
              }
            }
          });
          return next;
        });
      }, interval);
    }
    return () => clearInterval(timer);
  }, [isPlaying, tempo, grid, cols, config.splits, notes]);

  useEffect(() => {
    if (!isPlaying && activeStep !== -1) {
      const timer = setTimeout(() => setActiveStep(-1), 0);
      return () => clearTimeout(timer);
    }
  }, [isPlaying, activeStep]);

  useEffect(() => {
    setHeaderActions(
      <div className="flex items-center gap-4 italic">
         <button 
          onClick={() => { setIsPlaying(!isPlaying); audioEngine.playTick(settings.soundTheme); }}
          className={`flex items-center gap-2 px-8 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95  ${isPlaying ? 'bg-rose-500 text-white ' : 'bg-white border-2 border-slate-100 text-slate-300 hover:border-indigo-100 hover:text-indigo-600'}`}
         >
           {isPlaying ? <><Square size={14} fill="currentColor" /> Stop</> : <><Play size={14} fill="currentColor" /> Play</>}
         </button>
         <button 
          onClick={resetGrid}
          className="flex items-center gap-2 px-6 py-2 bg-white border-2 border-slate-100 text-slate-300 rounded-xl font-black text-[10px] uppercase tracking-widest hover:border-rose-100 hover:text-rose-600 transition-all active:scale-95 "
         >
           <RotateCcw size={14} strokeWidth={3} /> Reset
         </button>
      </div>
    );
  }, [isPlaying, resetGrid, settings.soundTheme, setHeaderActions]);

  return (
    <ToolPanel className="flex-row gap-8 p-4 lg:p-12 italic">
      {/* Primary Sequencer Grid */}
      <div className="flex-1 bg-slate-50/50 rounded-[4rem] border-4 border-white  flex flex-col relative overflow-hidden group h-full">
        <div className="tool-grid-bg opacity-20 pointer-events-none" />
        
        <div className="flex-1 overflow-auto custom-scrollbar no-scrollbar p-8 relative z-10">
           <div className="flex min-w-max min-h-full">
             {/* Note Descriptor Axis */}
             <div className="w-16 shrink-0 sticky left-0 z-20 bg-white border-r-4 border-slate-100 flex flex-col  rounded-l-3xl overflow-hidden">
               {notes.map((midi, i) => (
                 <div key={i} className="h-10 shrink-0 flex items-center justify-center text-[10px] font-black text-slate-300 leading-none bg-white border-b border-slate-50">
                   {getNoteName(midi)}
                 </div>
               ))}
               {PERCUSSION.map((perc) => (
                 <div key={perc.id} className="h-10 shrink-0 flex items-center justify-center text-[10px] font-black uppercase leading-none border-b border-slate-100 bg-slate-100 text-slate-500">
                   {perc.label[0]}
                 </div>
               ))}
             </div>

             {/* Temporal Data Grid */}
             <div className="flex-1 flex bg-white/50 backdrop-blur-sm rounded-r-3xl overflow-hidden border-y-4 border-r-4 border-slate-100">
               {grid[0] && grid[0].map((_, c) => (
                 <div 
                   key={c} 
                   className={`flex-1 flex flex-col transition-colors relative min-w-[60px]
                     ${activeStep === c ? 'bg-indigo-50/50 z-10 -[inset_0_0_0_2px_rgba(79,70,229,0.2)]' : 'bg-transparent'}
                     ${c % config.beatsPerBar === 0 ? 'border-l-4 border-slate-200' : 'border-l border-slate-100'}
                   `}
                 >
                   {grid.map((row, r) => {
                     const cellVal = row[c];
                     const isPercussion = r >= notes.length;
                     const item = isPercussion ? PERCUSSION[r - notes.length] : INSTRUMENTS.find(i => i.id === cellVal);
                     
                     return (
                       <motion.div
                         key={r}
                         onClick={() => toggleCell(r, c)}
                         style={{ backgroundColor: cellVal ? item?.color : 'transparent' }}
                         animate={{ scale: activeStep === c && cellVal ? 1.1 : 1 }}
                         className={`
                           h-10 shrink-0 flex items-center justify-center border-b border-slate-100 cursor-pointer transition-all
                           ${!cellVal ? 'bg-transparent hover:bg-white/40' : ' z-10 rounded-sm'}
                         `}
                       >
                         {cellVal && <ShapeIcon shape={item?.shape || 'circle'} className="text-white fill-white/20" size={18} />}
                       </motion.div>
                     );
                   })}
                 </div>
               ))}
             </div>
           </div>
        </div>
      </div>

      {/* Synthesis Sidebar */}
      <div className="w-full lg:w-[450px] shrink-0 flex flex-col gap-8 relative z-20 italic h-full">
        
        {/* Temporal Core Readout */}
        <div className="bg-slate-900 p-12 rounded-[4rem] border-4 border-slate-800  flex flex-col items-center gap-8 relative overflow-hidden shrink-0">
           <div className="tool-grid-bg-dark opacity-10 pointer-events-none" />
           
           <div className="flex items-center justify-between w-full relative z-10">
              <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.5em]">Speed</span>
           </div>

           <div className="relative z-10 w-full space-y-6">
              <div className="flex justify-between items-end">
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tempo</span>
                 <span className="text-5xl font-black text-white italic tabular-nums leading-none">{tempo} <span className="text-xs uppercase tracking-widest text-slate-500">BPM</span></span>
              </div>
              <div className="h-6 bg-white/5 rounded-full p-1 border border-white/10 relative group">
                 <input 
                   type="range" min="60" max="200" value={tempo} 
                   onChange={(e) => { setTempo(parseInt(e.target.value)); audioEngine.playTick(settings.soundTheme); }}
                   className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                 />
                 <motion.div 
                    className="h-full bg-gradient-to-r from-indigo-500 to-rose-500 rounded-full"
                    initial={false}
                    animate={{ width: `${((tempo - 60) / 140) * 100}%` }}
                 />
              </div>
           </div>
        </div>

        {/* Harmonic Matrix Controller */}
        <div className="flex-1 bg-slate-50/50 p-10 rounded-[4rem] border-4 border-white  flex flex-col gap-8 min-h-0">
           <div className="flex items-center gap-4 shrink-0 border-b-4 border-white pb-6">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white ">
                 <Paintbrush size={24} strokeWidth={3} />
              </div>
              <h4 className="text-xl font-black text-slate-900 uppercase tracking-tight leading-none">Sounds</h4>
           </div>

           <div className="flex-1 grid grid-cols-1 gap-3 overflow-y-auto no-scrollbar pr-2 pb-4">
              {INSTRUMENTS.map(inst => (
                <button
                   key={inst.id}
                   onClick={() => { setSelectedInstrument(inst); audioEngine.playTick(settings.soundTheme); }}
                   className={`
                     w-full p-6 rounded-[2.5rem] border-4 transition-all flex items-center gap-6 group
                     ${selectedInstrument.id === inst.id ? 'bg-slate-900 border-indigo-600 text-white  scale-105 z-10' : 'bg-white border-white text-slate-500 hover:border-indigo-100 '}
                   `}
                >
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center  transition-transform group-hover:scale-110" style={{ backgroundColor: inst.color }}>
                    <ShapeIcon shape={inst.shape} className="text-white fill-white/20" size={28} />
                  </div>
                  <div className="flex flex-col items-start">
                     <span className="text-sm font-black uppercase tracking-widest">{inst.label}</span>
                  </div>
                </button>
              ))}
           </div>

           <div className="p-8 bg-indigo-600 rounded-[3.5rem] text-white space-y-6  relative overflow-hidden shrink-0 mt-auto">
              <div className="tool-grid-bg opacity-10 pointer-events-none" />
              <div className="flex items-center gap-4 relative z-10">
                 <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white border border-white/20">
                    <Volume2 size={20} strokeWidth={3} />
                 </div>
                 <h4 className="text-[10px] font-black uppercase tracking-[0.3em]">Status</h4>
              </div>
              <p className="text-xs font-black leading-relaxed italic text-indigo-100 uppercase tracking-widest relative z-10">
                Playing your song. <br/>
                Happy music making!
              </p>
           </div>
        </div>
      </div>
    </ToolPanel>
  );
};

export default SongMaker;
