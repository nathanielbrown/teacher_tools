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
  Download
} from 'lucide-react';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { ToolPanel } from '../shared/ToolPanel';
import { useSettings } from '../../contexts/SettingsContext';
import { useHeader } from '../../contexts/HeaderContext';
import { audioEngine } from '../../utils/audio';
import { SettingsPanel } from '../shared/SettingsPanel';
import { exportMidi } from '../../utils/midiExport';

// 1. Constants
const SCALES = {
  Major: [0, 2, 4, 5, 7, 9, 11],
  Minor: [0, 2, 3, 5, 7, 8, 10],
  Pentatonic: [0, 2, 4, 7, 9],
  Chromatic: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
};

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export const INSTRUMENTS = [
  { id: 'marimba', label: 'Marimba', color: '#ff9500', bg: 'bg-[#ff9500]', shape: 'circle' },
  { id: 'piano', label: 'Piano', color: '#4a90e2', bg: 'bg-[#4a90e2]', shape: 'square' },
  { id: 'woodwind', label: 'Woodwind', color: '#2ecc71', bg: 'bg-[#2ecc71]', shape: 'pentagon' },
  { id: 'synth', label: 'Synth', color: '#9013fe', bg: 'bg-[#9013fe]', shape: 'triangle' },
  { id: 'strings', label: 'Strings', color: '#50e3c2', bg: 'bg-[#50e3c2]', shape: 'star' },
];

export const PERCUSSION = [
  { id: 'kick', label: 'Kick', color: '#475569', shape: 'none', midi: 36 },
  { id: 'tom', label: 'Tom', color: '#64748b', shape: 'none', midi: 45 },
  { id: 'snare', label: 'Snare', color: '#94a3b8', shape: 'none', midi: 38 },
  { id: 'hihat', label: 'Hi-Hat', color: '#cbd5e1', shape: 'none', midi: 42 },
  { id: 'symbol', label: 'Symbol', color: '#e2e8f0', shape: 'none', midi: 49 },
];

// 2. Config (None)

const HELP_INFO = (
  <div className="space-y-4 font-['Outfit']">
    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight italic">How to use</h3>
    <div className="space-y-3 italic">
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center text-xs font-black text-indigo-600 shrink-0">1</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">Choose a <b>sound</b> from the side.</p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center text-xs font-black text-blue-600 shrink-0">2</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">Tap the <b>squares</b> to make music.</p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-emerald-50 flex items-center justify-center text-xs font-black text-emerald-600 shrink-0">3</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">High sounds are at the <b>top</b>.</p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-amber-50 flex items-center justify-center text-xs font-black text-amber-600 shrink-0">4</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">The <b>bottom</b> part is for drums.</p>
      </div>
    </div>
  </div>
);

// 4. Local Storage (None)

// 5. Classes (None)

// 6. Functions
const midiToFreq = (midi: number) => 440 * Math.pow(2, (midi - 69) / 12);
const getNoteName = (midi: number) => {
  const name = NOTE_NAMES[midi % 12].replace('#', 'S');
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
  const { setHeaderActions, setHelpContent, setOnReset, clearHeader, hasConfig, setHasConfig, isConfigOpen, setIsConfigOpen, setOnConfigToggle } = useHeader();
  const { settings } = useSettings();
  
  const [selectedInstrument, setSelectedInstrument] = useState(INSTRUMENTS[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeStep, setActiveStep] = useState(-1);
  const [activeBar, setActiveBar] = useState(0);
  const gridRef = React.useRef<HTMLDivElement>(null);
  const [config, setConfig] = useLocalStorage('song_maker_config', {
    bars: 2,
    beatsPerBar: 2,
    splits: 2,
    range: 2,
    startNote: 60,
    scale: 'Major'
  });

  const [tempo, setTempo] = useLocalStorage('song_maker_tempo', 120);

  const colsPerBar = config.beatsPerBar * config.splits;
  const cols = config.bars * colsPerBar;
  
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
  
  const [grid, setGrid] = useLocalStorage<any[][]>('song_maker_grid', Array(rows).fill(null).map(() => Array(cols).fill(null)));

  // Persistence Effects (Handled by useLocalStorage)

  useEffect(() => {
    setGrid(prev => {
      const newGrid = Array(rows).fill(null).map(() => Array(cols).fill(null));
      for (let r = 0; r < Math.min(prev.length, rows); r++) {
        for (let c = 0; c < Math.min(prev[r].length, cols); c++) {
          newGrid[r][c] = prev[r][c];
        }
      }
      return newGrid;
    });
  }, [rows, cols]);

  const resetGrid = useCallback(() => {
    // Reset Config and Tempo
    setConfig({
      bars: 2,
      beatsPerBar: 2,
      splits: 2,
      range: 2,
      startNote: 60,
      scale: 'Major'
    });
    setTempo(120);

    // Calculate default dimensions for immediate grid reset
    const defaultCols = 2 * (2 * 2);
    const defaultRows = (2 * 7) + 5;
    setGrid(Array(defaultRows).fill(null).map(() => Array(defaultCols).fill(null)));
    
    setIsPlaying(false);
    setActiveStep(-1);
    audioEngine.playTick(settings.soundTheme);
  }, [settings.soundTheme]);

  const resetGridRef = React.useRef(resetGrid);
  useEffect(() => {
    resetGridRef.current = resetGrid;
  }, [resetGrid]);

  useEffect(() => {
    setIsConfigOpen(false);
  }, [setIsConfigOpen]);

  useEffect(() => {
    setOnReset(() => () => resetGridRef.current());
    setHelpContent(HELP_INFO);
    setHasConfig(true);
    setOnConfigToggle(() => () => setIsConfigOpen(prev => !prev));
    return () => clearHeader();
  }, [clearHeader, setOnReset, setHelpContent, setHasConfig, setIsConfigOpen, setOnConfigToggle]);

  const handleExportWav = async () => {
    try {
      await audioEngine.exportWav(grid, notes, tempo, config.splits, PERCUSSION);
    } catch (e) {
      console.error("Failed to export WAV", e);
    }
  };

  const handleExportMidi = () => {
    try {
      exportMidi(grid, notes, tempo, config.splits, config.beatsPerBar);
    } catch (e) {
      console.error("Failed to export MIDI", e);
    }
  };

  const toggleCell = (r: number, c: number) => {
    const newGrid = [...grid.map(row => [...row])];
    const isPercussionRow = r >= notes.length;
    
    if (isPercussionRow) {
      const perc = PERCUSSION[r - notes.length];
      if (newGrid[r][c] === perc.id) {
        newGrid[r][c] = null;
      } else {
        newGrid[r][c] = perc.id;
        audioEngine.playDrum(perc.id);
      }
    } else {
      if (newGrid[r][c] === selectedInstrument.id) {
        newGrid[r][c] = null;
      } else {
        newGrid[r][c] = selectedInstrument.id;
        audioEngine.playInstrument(midiToFreq(notes[r]), selectedInstrument.id);
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
                const perc = PERCUSSION[rIdx - notes.length];
                audioEngine.playDrum(perc.id);
              } else {
                audioEngine.playInstrument(midiToFreq(notes[rIdx]), row[next], 0.2);
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
    setHeaderActions(null);
  }, [setHeaderActions]);

  const scrollToBar = (barIdx: number) => {
    setActiveBar(barIdx);
    if (gridRef.current) {
      const barWidth = colsPerBar * 60; // 60 is column min-width
      gridRef.current.scrollTo({
        left: barIdx * barWidth,
        behavior: 'smooth'
      });
    }
  };

  return (
    <ToolPanel baseWidth={1400} baseHeight={800} alignTop fluid>
      <div className="flex w-full h-full gap-6 p-4 lg:p-6 italic overflow-hidden">
        {/* Sidebar Area (Palette & Sliding Config) */}
        <div className="flex shrink-0 transition-all duration-500" style={{ width: isConfigOpen ? '320px' : '96px' }}>
        <AnimatePresence mode="wait">
          {!isConfigOpen ? (
            <motion.div 
              key="palette"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="w-20 lg:w-24 shrink-0 flex flex-col gap-4 py-8 items-center pr-4"
            >
              <div className="flex items-center justify-center mb-4 text-slate-400">
                <Paintbrush size={24} />
              </div>
              <div className="flex flex-col gap-6">
                {INSTRUMENTS.map(inst => (
                  <div key={inst.id} className="flex flex-col items-center gap-2">
                    <button
                      onClick={() => setSelectedInstrument(inst)}
                      className={`w-16 lg:w-20 aspect-square rounded-2xl border-4 transition-all flex items-center justify-center group ${selectedInstrument.id === inst.id ? 'bg-white border-indigo-500' : 'bg-white border-white text-slate-400 hover:border-indigo-100'}`}
                      title={inst.label}
                    >
                      <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110" style={{ backgroundColor: inst.color }}>
                        <ShapeIcon shape={inst.shape} className="text-white fill-white/20" size={24} />
                      </div>
                    </button>
                    <span className={`text-[8px] font-black uppercase tracking-[0.15em] text-center leading-none ${selectedInstrument.id === inst.id ? 'text-indigo-600' : 'text-slate-400'}`}>
                      {inst.label}
                    </span>
                  </div>
                ))}
              </div>
              
              <div className="flex flex-col gap-2 mt-4 w-full">
                <button
                  onClick={handleExportMidi}
                  className="w-full flex flex-col items-center justify-center py-3 bg-indigo-50 text-indigo-500 rounded-2xl border-2 border-indigo-100 hover:bg-indigo-100 hover:border-indigo-200 transition-all active:scale-95 group"
                  title="Export as MIDI"
                >
                  <Download size={18} className="mb-1 group-hover:-translate-y-0.5 transition-transform" />
                  <span className="text-[8px] font-black uppercase tracking-widest">MIDI</span>
                </button>
                <button
                  onClick={handleExportWav}
                  className="w-full flex flex-col items-center justify-center py-3 bg-indigo-50 text-indigo-500 rounded-2xl border-2 border-indigo-100 hover:bg-indigo-100 hover:border-indigo-200 transition-all active:scale-95 group"
                  title="Export as WAV Audio"
                >
                  <Download size={18} className="mb-1 group-hover:-translate-y-0.5 transition-transform" />
                  <span className="text-[8px] font-black uppercase tracking-widest">WAV</span>
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="config"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ type: "spring", damping: 20, stiffness: 100 }}
              className="w-[320px] h-full"
            >
              <SettingsPanel 
                isOpen={isConfigOpen} 
                onClose={() => setIsConfigOpen(false)}
                title="Song Settings"
                className="h-full !rounded-[2.5rem]"
                compact
                side="left"
              >
                <div className="space-y-5">
                  {/* Bars */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Bars</label>
                    <input 
                      type="number" min="1" max="16" value={config.bars} 
                      onChange={(e) => setConfig(prev => ({ ...prev, bars: parseInt(e.target.value) || 1 }))}
                      className="w-full p-2.5 bg-white border-2 border-slate-100 rounded-xl font-black text-slate-700 outline-none focus:border-indigo-400 transition-colors"
                    />
                  </div>

                  {/* Beats per Bar */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Beats / Bar</label>
                    <input 
                      type="number" min="1" max="16" value={config.beatsPerBar} 
                      onChange={(e) => setConfig(prev => ({ ...prev, beatsPerBar: parseInt(e.target.value) || 1 }))}
                      className="w-full p-2.5 bg-white border-2 border-slate-100 rounded-xl font-black text-slate-700 outline-none focus:border-indigo-400 transition-colors"
                    />
                  </div>

                  {/* Splits */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Splits</label>
                    <select 
                      value={config.splits}
                      onChange={(e) => setConfig(prev => ({ ...prev, splits: parseInt(e.target.value) }))}
                      className="w-full p-2.5 bg-white border-2 border-slate-100 rounded-xl font-black text-slate-700 outline-none focus:border-indigo-400 transition-colors cursor-pointer appearance-none"
                    >
                      {[1, 2, 3, 4].map(s => (
                        <option key={s} value={s}>{s} {s === 1 ? 'Subdivision' : 'Subdivisions'}</option>
                      ))}
                    </select>
                  </div>

                  {/* Range */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Range</label>
                    <select 
                      value={config.range}
                      onChange={(e) => setConfig(prev => ({ ...prev, range: parseInt(e.target.value) }))}
                      className="w-full p-2.5 bg-white border-2 border-slate-100 rounded-xl font-black text-slate-700 outline-none focus:border-indigo-400 transition-colors cursor-pointer appearance-none"
                    >
                      {[1, 2, 3].map(o => (
                        <option key={o} value={o}>{o} {o === 1 ? 'Octave' : 'Octaves'}</option>
                      ))}
                    </select>
                  </div>

                  {/* Start Note */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Start</label>
                    <select 
                      value={config.startNote}
                      onChange={(e) => setConfig(prev => ({ ...prev, startNote: parseInt(e.target.value) }))}
                      className="w-full p-2.5 bg-white border-2 border-slate-100 rounded-xl font-black text-slate-700 outline-none focus:border-indigo-400 transition-colors cursor-pointer appearance-none"
                    >
                      <option value={48}>Low</option>
                      <option value={60}>Middle</option>
                      <option value={72}>High</option>
                    </select>
                  </div>

                  {/* Scale */}
                  <div className="space-y-1.5 pb-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Scale</label>
                    <select 
                      value={config.scale}
                      onChange={(e) => setConfig(prev => ({ ...prev, scale: e.target.value }))}
                      className="w-full p-2.5 bg-white border-2 border-slate-100 rounded-xl font-black text-slate-700 outline-none focus:border-indigo-400 transition-colors cursor-pointer appearance-none"
                    >
                      {Object.keys(SCALES).map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </SettingsPanel>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Main Tool Area */}
      <div className="flex-1 flex flex-col relative h-full min-w-0 gap-4">
          
          {/* Top Bar Navigation (when not playing) */}
          <AnimatePresence>
            {!isPlaying && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex gap-2 justify-center shrink-0 overflow-x-auto no-scrollbar py-2"
              >
                {Array.from({ length: config.bars }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => scrollToBar(i)}
                    className={`px-6 py-2 rounded-full font-black text-xs uppercase tracking-widest transition-all ${activeBar === i ? 'bg-indigo-600 text-white' : 'bg-white text-slate-400 hover:bg-indigo-50'}`}
                  >
                    Bar {i + 1}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex-1 bg-white rounded-[3rem] border-4 border-white flex flex-col relative overflow-hidden h-full">
            {/* Timeline Viewport */}
            <motion.div 
              ref={gridRef}
              animate={{ 
                scale: isPlaying ? 0.9 : 1
              }}
              style={{ transformOrigin: 'center center' }}
              className="flex-1 overflow-x-hidden overflow-y-auto no-scrollbar relative z-10"
            >
              <div className="flex min-w-max min-h-full">
                {/* Note Labels (Sticky Left) */}
                <div className="w-20 shrink-0 sticky left-0 z-30 bg-white/95 backdrop-blur-md border-r-2 border-slate-50 flex flex-col py-4">
                  {notes.map((midi, i) => {
                    const name = NOTE_NAMES[midi % 12];
                    const octave = Math.floor(midi / 12) - 1;
                    return (
                      <div key={i} className="h-10 shrink-0 flex flex-col items-center justify-center leading-none">
                        <span className="text-[12px] font-black text-slate-400">{name}</span>
                        <span className="text-[8px] font-bold text-slate-300 uppercase tracking-widest mt-0.5">{octave > 4 ? 'High' : octave < 4 ? 'Low' : 'Mid'}</span>
                      </div>
                    );
                  })}
                  {PERCUSSION.map((perc, i) => (
                    <div 
                      key={perc.id} 
                      className={`h-10 shrink-0 flex items-center justify-center text-[10px] font-black uppercase text-slate-400
                        ${i === 0 ? 'border-t-4 border-black mt-1' : ''}
                      `}
                    >
                      {perc.label}
                    </div>
                  ))}
                </div>

                {/* Music Grid */}
                <div className="flex-1 flex py-4">
                  {grid[0]?.map((_, c) => {
                    const isBarStart = c % colsPerBar === 0;
                    const barIdx = Math.floor(c / colsPerBar);
                    
                    return (
                      <div 
                        key={c} 
                        className={`flex flex-col min-w-[60px] relative transition-colors duration-200
                          ${activeStep === c ? 'bg-indigo-50/50' : (Math.floor(c / config.splits) % 2 === 1 ? 'bg-slate-100/30' : '')}
                          ${isBarStart && c !== 0 ? 'border-l-4 border-indigo-100/50' : 'border-l border-slate-50'}
                        `}
                      >
                        {isBarStart && (
                          <div className="absolute top-0 left-2 -translate-y-full pt-1 text-[8px] font-black text-indigo-300 uppercase tracking-widest whitespace-nowrap">
                            Bar {barIdx + 1}
                          </div>
                        )}
                        {grid.map((row, r) => {
                          const cellVal = row[c];
                          const isPercussion = r >= notes.length;
                          const isFirstPercussion = r === notes.length;
                          const item = isPercussion ? PERCUSSION[r - notes.length] : INSTRUMENTS.find(i => i.id === cellVal);
                          
                          return (
                            <div
                              key={r}
                              onClick={() => toggleCell(r, c)}
                              className={`h-10 shrink-0 flex items-center justify-center border-b border-slate-50 cursor-pointer transition-all relative
                                ${!cellVal ? 'hover:bg-slate-50/50' : ''}
                                ${isFirstPercussion ? 'border-t-4 border-black mt-1' : ''}
                              `}
                            >
                              {cellVal && (
                                <motion.div
                                  layoutId={`cell-${r}-${c}`}
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  className="w-full h-full flex items-center justify-center"
                                  style={{ backgroundColor: item?.color }}
                                >
                                  {!isPercussion && (
                                    <ShapeIcon shape={item?.shape || 'circle'} className="text-white/40 fill-white/10" size={16} />
                                  )}
                                </motion.div>
                              )}
                              {activeStep === c && !cellVal && (
                                <div className="absolute inset-0 bg-indigo-500/10 pointer-events-none" />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Bottom Control Bar */}
          <div className="bg-white p-4 rounded-[2.5rem] border-4 border-white flex items-center gap-6 shrink-0">
            {/* Play Button */}
            <button 
              onClick={() => { setIsPlaying(!isPlaying); audioEngine.playTick(settings.soundTheme); }}
              className={`flex items-center gap-3 px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 ${isPlaying ? 'bg-rose-500 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
            >
              {isPlaying ? <><Square size={16} fill="currentColor" /> Stop</> : <><Play size={16} fill="currentColor" /> Play</>}
            </button>

            {/* Tempo Control */}
            <div className="flex-1 flex items-center gap-6 border-l-2 border-slate-50 pl-6">
              <div className="flex items-center gap-3 text-slate-400 uppercase tracking-widest text-[10px] font-black shrink-0">
                <Clock size={16} />
                Tempo
              </div>
              <div className="flex-1">
                <input 
                  type="range" min="60" max="200" value={tempo} 
                  onChange={(e) => setTempo(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-100 rounded-full appearance-none cursor-pointer accent-indigo-600"
                />
              </div>
              <span className="text-2xl font-black text-indigo-600 italic tabular-nums leading-none w-12 text-right">{tempo}</span>
            </div>
          </div>
        </div>
      </div>
    </ToolPanel>
  );
};

export default SongMaker;
