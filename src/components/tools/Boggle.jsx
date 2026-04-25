import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Play, Pause, RotateCcw, Timer, Trophy, 
  CheckCircle2, XCircle, AlertCircle, ChevronRight,
  Settings2, HelpCircle, Share2, Download,
  Volume2, VolumeX, Sparkles
} from 'lucide-react';
import { ToolHeader } from '../ToolHeader';
import { WORD_BANKS, BOGGLE_LOOKUP_LIST } from '../../data/wordLists';

const BOGGLE_DICE = [
  "AAEEGN", "ELRTTY", "AOOTTW", "ABBJOO",
  "EHRTVW", "CIMOTU", "DISTTY", "EIOSST",
  "DELRVY", "ACHOPS", "HIMNQU", "EEINSU",
  "EEGHNW", "AFFKPS", "HLNNRZ", "DEILRX"
];

// Flat list of all words from WORD_BANKS plus the hidden boggle list for automatic scoring
const VALID_WORDS = new Set([
  ...Object.values(WORD_BANKS).flatMap(year => 
    year.flatMap(week => week.words.map(w => w.toLowerCase()))
  ),
  ...(BOGGLE_LOOKUP_LIST || []).map(w => w.toLowerCase())
]);

const calculateScore = (word) => {
  const len = word.length;
  if (len < 3) return 0;
  if (len <= 4) return 1;
  if (len === 5) return 2;
  if (len === 6) return 3;
  if (len === 7) return 5;
  return 11;
};

const isAdjacent = (idx1, idx2) => {
  const row1 = Math.floor(idx1 / 4);
  const col1 = idx1 % 4;
  const row2 = Math.floor(idx2 / 4);
  const col2 = idx2 % 4;
  return Math.abs(row1 - row2) <= 1 && Math.abs(col1 - col2) <= 1;
};

const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const Layers = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z" />
    <path d="m2.6 14.12 8.58 3.9a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83l-8.58 3.9a2 2 0 0 1-1.66 0L2.6 12.29a1 1 0 0 0 0 1.83Z" />
    <path d="m2.6 18.12 8.58 3.9a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83l-8.58 3.9a2 2 0 0 1-1.66 0L2.6 16.29a1 1 0 0 0 0 1.83Z" />
  </svg>
);

export const Boggle = () => {
  const [grid, setGrid] = useState([]);
  const [timer, setTimer] = useState(180);
  const [timerActive, setTimerActive] = useState(false);
  const [timerOption, setTimerOption] = useState(180);
  const [currentWord, setCurrentWord] = useState('');
  const [selectedCells, setSelectedCells] = useState([]);
  const [foundWords, setFoundWords] = useState([]);
  const [score, setScore] = useState(0);
  const [gameState, setGameState] = useState('idle'); // idle, playing, finished
  const [isMuted, setIsMuted] = useState(false);
  
  const timerRef = useRef(null);
  const gridRef = useRef(null);
  const [cellCenters, setCellCenters] = useState([]);

  const shakeDice = useCallback(() => {
    const shuffled = [...BOGGLE_DICE].sort(() => Math.random() - 0.5);
    const newGrid = shuffled.map(die => {
      const letter = die[Math.floor(Math.random() * die.length)];
      return letter === 'Q' ? 'Qu' : letter;
    });
    setGrid(newGrid);
    setFoundWords([]);
    setScore(0);
    setCurrentWord('');
    setSelectedCells([]);
    setTimer(timerOption);
    setGameState('idle');
    setTimerActive(false);
  }, [timerOption]);

  const submitWord = useCallback(() => {
    if (currentWord.length < 3) {
      setCurrentWord('');
      setSelectedCells([]);
      return;
    }

    const wordLower = currentWord.toLowerCase();
    if (foundWords.some(w => w.text.toLowerCase() === wordLower)) {
      // Already found - reset and ignore
    } else {
      const isValid = VALID_WORDS.has(wordLower);
      
      if (isValid) {
        const wordScore = calculateScore(currentWord);
        setFoundWords(prev => [{
          text: currentWord,
          score: wordScore,
          valid: true
        }, ...prev]);
        setScore(s => s + wordScore);
      } else {
        // Invalid word - as per user request: "ignore the selection and reset"
        // We don't add to foundWords list
      }
    }

    setCurrentWord('');
    setSelectedCells([]);
  }, [currentWord, foundWords]);

  const handleCellInteraction = useCallback((index) => {
    if (gameState !== 'playing') return;
    
    // If selecting an already selected cell
    if (selectedCells.includes(index)) {
      // If it's the last one, we allow "unselecting" it (current behavior)
      if (selectedCells[selectedCells.length - 1] === index) {
        const newSelected = selectedCells.slice(0, -1);
        setSelectedCells(newSelected);
        const newWord = newSelected.map(i => grid[i]).join('');
        setCurrentWord(newWord);
      } else {
        // Otherwise it's an invalid move (re-selecting an older letter) -> Submit
        submitWord();
      }
      return;
    }

    // Check if adjacent to the last selected cell
    const lastIndex = selectedCells[selectedCells.length - 1];
    if (selectedCells.length === 0 || isAdjacent(lastIndex, index)) {
      const newSelected = [...selectedCells, index];
      setSelectedCells(newSelected);
      const newWord = newSelected.map(i => grid[i]).join('');
      setCurrentWord(newWord);
    } else {
      // Not adjacent -> Submit
      submitWord();
    }
  }, [gameState, selectedCells, grid, submitWord]);

  const startGame = useCallback(() => {
    setGameState('playing');
    setTimerActive(true);
    if (timer === 0) setTimer(timerOption);
  }, [timer, timerOption]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Enter' && currentWord.length >= 3) {
        submitWord();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    
    const handleMouseUp = () => {
      if (selectedCells.length > 0) {
        submitWord();
      }
    };
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [currentWord, selectedCells, submitWord]);

  useEffect(() => {
    shakeDice();
  }, [shakeDice]);

  useEffect(() => {
    if (timerActive && timer > 0) {
      timerRef.current = setInterval(() => {
        setTimer(t => t - 1);
      }, 1000);
    } else if (timer === 0) {
      setGameState('finished');
      setTimerActive(false);
      clearInterval(timerRef.current);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [timerActive, timer]);

  useEffect(() => {
    const updateCellCenters = () => {
      if (!gridRef.current) return;
      const buttons = gridRef.current.querySelectorAll('button[data-index]');
      const centers = Array.from(buttons).map(button => {
        const rect = button.getBoundingClientRect();
        const containerRect = gridRef.current.getBoundingClientRect();
        return {
          x: rect.left - containerRect.left + rect.width / 2,
          y: rect.top - containerRect.top + rect.height / 2
        };
      });
      setCellCenters(centers);
    };

    updateCellCenters();
    window.addEventListener('resize', updateCellCenters);
    return () => window.removeEventListener('resize', updateCellCenters);
  }, [grid]);

  return (
    <div className="w-full mx-auto px-4 pt-1 pb-4 h-full flex flex-col gap-4 font-['Outfit'] select-none">
      <ToolHeader
        title="Boggle Challenge"
        icon={Sparkles}
        description="Find as many words as you can in the grid before time runs out!"
      >
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsMuted(!isMuted)}
            className={`p-2.5 rounded-xl transition-all shadow-sm active:scale-95 border ${
              isMuted ? 'bg-rose-500 text-white border-rose-600' : 'bg-slate-50 text-slate-400 hover:bg-slate-100 border-slate-100'
            }`}
            title={isMuted ? "Unmute Sound" : "Mute Sound"}
          >
            {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>
          
          <button 
            onClick={shakeDice}
            className="p-2.5 bg-slate-50 text-slate-400 rounded-xl hover:bg-rose-500 hover:text-white hover:border-rose-600 border border-slate-100 transition-all active:scale-95 shadow-sm"
            title="Reset Board"
          >
            <RotateCcw size={20} />
          </button>

          <div className="bg-slate-50 px-6 py-2.5 rounded-2xl border border-slate-100 flex items-center gap-3 group transition-all hover:bg-slate-100 ml-1">
            <div className="flex flex-col items-start -space-y-1">
              <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Time Remaining</span>
              <div className="flex items-center gap-2">
                <Timer className={`w-4 h-4 ${timer < 10 ? 'text-red-500 animate-pulse' : 'text-primary'}`} />
                <span className={`text-xl font-black tabular-nums ${timer < 10 ? 'text-red-500' : 'text-slate-800'}`}>
                  {formatTime(timer)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </ToolHeader>

      <div className="flex-1 flex flex-col lg:flex-row gap-8 min-h-0">
        {/* Left Side: Game Board */}
        <div className="flex-1 flex flex-col gap-6">
          {/* Stats Bar */}


          {/* Word Preview */}


          <div 
            ref={gridRef}
            onMouseDown={(e) => {
              if (e.target === gridRef.current) {
                submitWord();
              }
            }}
            className="relative aspect-square w-full max-w-[600px] mx-auto p-8 bg-slate-100 rounded-[4rem] shadow-inner grid grid-cols-4 gap-6 perspective-1000"
          >
            {grid.map((letter, i) => (
              <button
                key={i}
                data-index={i}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  handleCellInteraction(i);
                }}
                onMouseEnter={(e) => e.buttons === 1 && handleCellInteraction(i)}
                className={`
                  relative aspect-square rounded-[1.5rem] text-5xl font-black transition-all duration-300
                  flex items-center justify-center transform preserve-3d z-10
                  bg-white text-slate-700 shadow-xl
                  ${gameState !== 'playing' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-105 hover:bg-slate-50 active:scale-95'}
                `}
              >
                <div className="relative z-10">{letter}</div>
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-[1.5rem]" />
                <div className="absolute bottom-2 right-2 text-[10px] opacity-20 font-black italic">{i + 1}</div>
              </button>
            ))}

            {/* Line Drawing SVG Overlay */}
            {selectedCells.length > 1 && cellCenters.length > 0 && (
              <svg className="absolute inset-0 pointer-events-none z-20 overflow-visible">
                <defs>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                    <feMerge>
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>
                <polyline
                  points={selectedCells
                    .filter(idx => cellCenters[idx])
                    .map(idx => `${cellCenters[idx].x},${cellCenters[idx].y}`)
                    .join(' ')}
                  fill="none"
                  stroke="var(--primary, #3b82f6)"
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="opacity-30"
                  filter="url(#glow)"
                />
                <polyline
                  points={selectedCells
                    .filter(idx => cellCenters[idx])
                    .map(idx => `${cellCenters[idx].x},${cellCenters[idx].y}`)
                    .join(' ')}
                  fill="none"
                  stroke="white"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="opacity-60"
                />
              </svg>
            )}

            {/* Overlays */}
            {gameState === 'idle' && (
              <div className="absolute inset-0 bg-white/60 backdrop-blur-md rounded-[3rem] flex items-center justify-center z-20">
                <button 
                  onClick={startGame}
                  className="px-12 py-6 bg-primary text-white rounded-[2.5rem] font-black text-3xl shadow-2xl shadow-primary/40 hover:scale-110 active:scale-95 transition-all flex items-center gap-4 group"
                >
                  <Play size={40} className="fill-current" />
                  START GAME
                  <div className="absolute -inset-2 bg-primary/20 rounded-[3rem] opacity-0 group-hover:opacity-100 transition-all duration-500 pointer-events-none" />
                </button>
              </div>
            )}

            {gameState === 'finished' && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-xl rounded-[3rem] flex flex-col items-center justify-center z-30 animate-in fade-in zoom-in-95 duration-500">
                <div className="p-8 bg-yellow-500 text-white rounded-[3rem] shadow-2xl mb-6 -rotate-2">
                   <Trophy size={80} />
                </div>
                <h2 className="text-6xl font-black text-slate-800 tracking-tighter mb-2">TIME'S UP!</h2>
                <p className="text-xl font-bold text-slate-500 mb-8 uppercase tracking-widest">Final Score: <span className="text-primary">{score}</span></p>
                <div className="flex gap-4">
                  <button 
                    onClick={shakeDice}
                    className="px-10 py-5 bg-primary text-white rounded-3xl font-black text-xl shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
                  >
                    <RotateCcw size={24} /> PLAY AGAIN
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Log & Settings */}
        <div className="w-full lg:w-[400px] flex flex-col gap-6 min-h-0">
          {/* Current Selection Preview */}
          <div className="h-20 bg-white rounded-[2rem] shadow-xl border border-slate-100 flex items-center px-6 relative overflow-hidden group shrink-0">
            <div className="flex flex-col">
               <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-0.5">Current Word</span>
               <span className="text-3xl font-black text-primary tracking-tight uppercase italic min-h-[1em]">
                 {currentWord || <span className="opacity-10">Select letters...</span>}
               </span>
            </div>
            <div className="absolute left-0 bottom-0 h-1.5 bg-primary/10 w-full overflow-hidden">
               <div className="h-full bg-primary transition-all duration-300" style={{ width: `${Math.min(currentWord.length * 10, 100)}%` }} />
            </div>
          </div>

          {/* Found Words List */}
          <div className="flex-1 bg-white rounded-[2.5rem] shadow-xl border border-slate-100 flex flex-col overflow-hidden">
            <div className="p-5 border-b border-slate-50 flex items-center justify-between">
              <div className="flex flex-col">
                <h3 className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-2">
                   <Layers className="text-primary w-4 h-4" /> LOG
                </h3>
                <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Words Discovered</span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Total</span>
                <span className="text-xl font-black text-primary tabular-nums">
                  {foundWords.filter(w => w.valid).length}
                </span>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 auto-rows-min gap-2 no-scrollbar">
              {foundWords.length === 0 ? (
                <div className="col-span-2 h-full flex flex-col items-center justify-center opacity-20 grayscale py-12">
                   <Sparkles size={48} className="mb-2" />
                   <p className="font-black text-[10px] uppercase tracking-widest">No words yet</p>
                </div>
              ) : (
                foundWords.map((word, i) => (
                  <div 
                    key={i}
                    className={`
                      px-3 py-1.5 rounded-xl flex items-center justify-between animate-in slide-in-from-top-1 duration-300
                      ${word.valid ? 'bg-green-50 border border-green-100' : 'bg-red-50 border border-red-100'}
                    `}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {word.valid ? (
                        <CheckCircle2 className="text-green-500 w-3.5 h-3.5 shrink-0" />
                      ) : (
                        <AlertCircle className="text-red-500 w-3.5 h-3.5 shrink-0" />
                      )}
                      <span className={`text-sm font-black uppercase truncate ${word.valid ? 'text-green-800' : 'text-red-800 line-through opacity-50'}`}>
                        {word.text}
                      </span>
                    </div>
                    {word.valid && (
                      <span className="shrink-0 text-[10px] font-black text-green-600 bg-white/60 px-1.5 py-0.5 rounded shadow-sm">
                        {word.score}
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Options Panel */}
          <div className="bg-white p-5 rounded-[2rem] shadow-xl border border-slate-100 flex flex-col gap-3">
            <div className="flex items-center justify-between px-2">
              <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Duration</span>
              <div className="flex gap-1.5">
                {[60, 180, 300].map(seconds => (
                  <button
                    key={seconds}
                    onClick={() => {
                      setTimerOption(seconds);
                      setTimer(seconds);
                      shakeDice();
                    }}
                    className={`
                      px-3 py-1.5 rounded-lg font-black text-[10px] transition-all
                      ${timerOption === seconds 
                        ? 'bg-primary text-white shadow-md shadow-primary/30 scale-105' 
                        : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                      }
                    `}
                  >
                    {seconds / 60}m
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

