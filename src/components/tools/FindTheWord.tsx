import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle2, 
  RotateCcw, 
  Plus, 
  Trash2, 
  Pencil, 
  Sparkles, 
  Trophy, 
  Play, 
  X, 
  Search,
  Settings
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { audioEngine } from '../../utils/audio';
import { useSettings } from '../../contexts/SettingsContext';
import { useHeader } from '../../contexts/HeaderContext';
import { speak } from '../../utils/speech';

import { useIntl, FormattedMessage } from 'react-intl';
import ToolPanel from '../shared/ToolPanel';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import WordPanel, { WordList } from '../shared/WordPanel';
import { BookOpen } from 'lucide-react';

// 1. Constants
const GRID_SIZE = 12;

// 3. Text (Help and Info)
const HelpContent = () => (
  <div className="space-y-4 font-['Outfit']">
    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">
      <FormattedMessage id="findtheword.help.title" />
    </h3>
    <div className="space-y-3">
      {[1, 2].map((step) => (
        <div key={step} className="flex gap-3 text-left">
          <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center text-xs font-black text-indigo-600 shrink-0">{step}</div>
          <p className="text-sm text-slate-600 font-medium leading-tight">
            <FormattedMessage 
              id={`findtheword.help.step${step}`} 
              values={{ b: (chunks: React.ReactNode) => <b>{chunks}</b> }}
            />
          </p>
        </div>
      ))}
    </div>
  </div>
);

// Functions
const canPlace = (word: string, r: number, c: number, dir: number[], g: string[][]) => {
  for (let i = 0; i < word.length; i++) {
    const nr = r + i * dir[0];
    const nc = c + i * dir[1];
    if (nr < 0 || nr >= GRID_SIZE || nc < 0 || nc >= GRID_SIZE) return false;
    if (g[nr][nc] !== '' && g[nr][nc] !== word[i]) return false;
  }
  return true;
};

const placeWord = (word: string, r: number, c: number, dir: number[], g: string[][]) => {
  for (let i = 0; i < word.length; i++) {
    const nr = r + i * dir[0];
    const nc = c + i * dir[1];
    g[nr][nc] = word[i];
  }
};

const generateGridData = (words: string[]) => {
  const newGrid = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(''));
  const placedWords: string[] = [];
  const directions = [
    [0, 1], [0, -1], [1, 0], [-1, 0], 
    [1, 1], [1, -1], [-1, 1], [-1, -1]
  ];

  const sortedWords = [...words]
    .map(w => w.toUpperCase())
    .filter(w => w.length <= GRID_SIZE)
    .sort((a, b) => b.length - a.length);

  for (const word of sortedWords) {
    let placed = false;
    let attempts = 0;
    while (!placed && attempts < 100) {
      const dir = directions[Math.floor(Math.random() * directions.length)];
      const r = Math.floor(Math.random() * GRID_SIZE);
      const c = Math.floor(Math.random() * GRID_SIZE);

      if (canPlace(word, r, c, dir, newGrid)) {
        placeWord(word, r, c, dir, newGrid);
        placedWords.push(word);
        placed = true;
      }
      attempts++;
    }
  }

  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (newGrid[r][c] === '') {
        newGrid[r][c] = letters[Math.floor(Math.random() * letters.length)];
      }
    }
  }

  return { grid: newGrid, placedWords };
};

export const FindTheWord = () => {
  const intl = useIntl();
  const { setOnReset, clearHeader, setHelpContent } = useHeader();
  const { settings } = useSettings();
  
  const [lists, setLists] = useLocalStorage<WordList[]>('word_manager_lists', [
    { id: '1', name: 'Animals', words: ['LION', 'TIGER', 'ZEBRA', 'GIRAFFE', 'ELEPHANT'] }
  ]);
  
  const [selectedListId, setSelectedListId] = useState(lists[0]?.id || '');
  const [status, setStatus] = useState<'setup' | 'playing' | 'finished'>('setup');
  const [grid, setGrid] = useState<string[][]>([]);
  const [targetWords, setTargetWords] = useState<string[]>([]);
  const [foundWords, setFoundWords] = useState<string[]>([]);
  const [selection, setSelection] = useState<any>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [foundPaths, setFoundPaths] = useState<any[]>([]); 
  const [isPanelVisible, setIsPanelVisible] = useState(true);
  
  const containerRef = useRef<HTMLDivElement>(null);


  const handleWordsChange = (newWords: string[]) => {
    setLists(prev => prev.map(l => l.id === selectedListId ? { ...l, words: newWords } : l));
  };

  const handleAddList = () => {
    const newList: WordList = {
      id: Date.now().toString(),
      name: intl.formatMessage({ id: 'wordpanel.newlist', defaultMessage: 'New List' }),
      words: []
    };
    setLists(prev => [...prev, newList]);
    setSelectedListId(newList.id);
  };

  const handleDeleteList = (id: string) => {
    if (lists.length <= 1) return;
    setLists(prev => prev.filter(l => l.id !== id));
    if (selectedListId === id) {
      setSelectedListId(lists.find(l => l.id !== id)?.id || '');
    }
  };

  const handleRenameList = (id: string, name: string) => {
    setLists(prev => prev.map(l => l.id === id ? { ...l, name } : l));
  };

  const handleManageLists = () => {
    window.history.pushState({}, '', '/config/wordmanager');
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  const startActivity = () => {
    const list = lists.find(l => l.id === selectedListId);
    if (!list) return;
    const { grid: newGrid, placedWords } = generateGridData(list.words);
    setGrid(newGrid);
    setTargetWords(placedWords);
    setFoundWords([]);
    setFoundPaths([]);
    setStatus('playing');
    setIsPanelVisible(false);
    audioEngine.playTick(settings.soundTheme);
  };

  const resetTool = useCallback(() => {
    setStatus('setup');
    setGrid([]);
    setTargetWords([]);
    setFoundWords([]);
    setFoundPaths([]);
    setIsPanelVisible(true);
    audioEngine.playTick(settings.soundTheme);
  }, [settings.soundTheme]);

  const getCellFromEvent = (e: any) => {
    if (!containerRef.current) return null;
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = e.clientX ?? (e.touches && e.touches[0].clientX);
    const clientY = e.clientY ?? (e.touches && e.touches[0].clientY);
    
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
    const cellWidth = rect.width / GRID_SIZE;
    const cellHeight = rect.height / GRID_SIZE;
    const r = Math.floor(y / cellHeight);
    const c = Math.floor(x / cellWidth);
    
    return { 
      r: Math.max(0, Math.min(GRID_SIZE - 1, r)), 
      c: Math.max(0, Math.min(GRID_SIZE - 1, c))
    };
  };

  const handleStart = (e: any) => {
    if (status !== 'playing') return;
    const cell = getCellFromEvent(e);
    if (cell) {
      e.currentTarget.setPointerCapture(e.pointerId);
      setSelection({ start: cell, end: cell });
      setIsDragging(true);
      audioEngine.playTick(settings.soundTheme);
    }
  };

  const handleMove = (e: any) => {
    if (!isDragging) return;
    const cell = getCellFromEvent(e);
    if (cell && (cell.r !== selection.end.r || cell.c !== selection.end.c)) {
      const dr = cell.r - selection.start.r;
      const dc = cell.c - selection.start.c;
      if (dr === 0 || dc === 0 || Math.abs(dr) === Math.abs(dc)) {
        setSelection((prev: any) => ({ ...prev, end: cell }));
      }
    }
  };

  const getWordFromPath = (start: any, end: any) => {
    if (!start || !end) return '';
    const dr = Math.sign(end.r - start.r);
    const dc = Math.sign(end.c - start.c);
    const length = Math.max(Math.abs(end.r - start.r), Math.abs(end.c - start.c)) + 1;
    
    // Only allow horizontal, vertical, or diagonal
    const isHorizontal = dr === 0 && dc !== 0;
    const isVertical = dr !== 0 && dc === 0;
    const isDiagonal = Math.abs(dr) === Math.abs(dc) && dr !== 0;
    
    if (!isHorizontal && !isVertical && !isDiagonal) return '';

    let word = '';
    for (let i = 0; i < length; i++) {
      word += grid[start.r + i * dr][start.c + i * dc];
    }
    return word;
  };

  const handleEnd = (e: any) => {
    if (!isDragging) return;
    setIsDragging(false);
    e.currentTarget.releasePointerCapture(e.pointerId);

    if (selection) {
      const selectedWord = getWordFromPath(selection.start, selection.end);
      if (selectedWord && targetWords.includes(selectedWord) && !foundWords.includes(selectedWord)) {
        const newFound = [...foundWords, selectedWord];
        setFoundWords(newFound);
        setFoundPaths(prev => [...prev, { ...selection, word: selectedWord }]);
        audioEngine.playSuccess(settings.soundTheme);
        speak(selectedWord);
        
        if (newFound.length === targetWords.length) {
          confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
          audioEngine.playAlarm(settings.soundTheme);
          setTimeout(() => setStatus('finished'), 1000);
        }
      }
    }
    setSelection(null);
  };

  useEffect(() => {
    setOnReset(() => resetTool);
    setHelpContent(<HelpContent />);
    return () => clearHeader();
  }, [clearHeader, setOnReset, resetTool, setHelpContent]);

  const getLineStyles = (start: any, end: any, isSuccess = false): React.CSSProperties => {
    if (!start || !end) return {};
    
    const cellWidth = 100 / GRID_SIZE;
    const cellHeight = 100 / GRID_SIZE;
    
    const x1 = (start.c + 0.5) * cellWidth;
    const y1 = (start.r + 0.5) * cellHeight;
    const x2 = (end.c + 0.5) * cellWidth;
    const y2 = (end.r + 0.5) * cellHeight;
    
    // Calculate visually correct angle and distance using purely percentage logic
    const dx = x2 - x1;
    const dy = y2 - y1;
    const distancePercent = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);
    
    const totalWidthPercent = distancePercent + cellWidth;
    const thicknessPercent = cellHeight * 0.8;

    return {
      left: `${x1}%`,
      top: `${y1}%`,
      width: `${totalWidthPercent}%`,
      transform: `rotate(${angle}deg) translateX(-${(cellWidth / 2) / totalWidthPercent * 100}%)`,
      height: `${thicknessPercent}%`,
      marginTop: `-${thicknessPercent / 2}%`,
      borderRadius: '999px',
      backgroundColor: isSuccess ? 'rgba(16, 185, 129, 0.25)' : 'rgba(79, 70, 229, 0.25)',
      border: isSuccess ? '2px solid rgba(16, 185, 129, 0.6)' : '2px solid rgba(79, 70, 229, 0.6)',
      pointerEvents: 'none',
      position: 'absolute' as const,
      transformOrigin: 'left center',
      zIndex: 5
    };
  };

  return (
    <div className="flex flex-col lg:flex-row h-full w-full italic overflow-hidden transition-all duration-500 ease-in-out gap-8">
      <AnimatePresence>
        {isPanelVisible && (
          <div className="flex flex-col gap-6 w-full lg:w-[400px] shrink-0 h-full overflow-hidden">
            <WordPanel
              isOpen={true}
              onClose={() => setIsPanelVisible(false)}
              selectedListId={selectedListId}
              onListChange={setSelectedListId}
              lists={lists}
              onWordsChange={handleWordsChange}
              onAddList={handleAddList}
              onDeleteList={handleDeleteList}
              onRenameList={handleRenameList}
              onManageLists={handleManageLists}
              manageListsLabel={<FormattedMessage id="wordpanel.link.addRemove" defaultMessage="Add/Remove Lists" />}
              className="h-full min-h-0"
            />
          </div>
        )}
      </AnimatePresence>

      <ToolPanel baseWidth={isPanelVisible ? 1200 : 1600} baseHeight={800}>
        <div className="w-full h-full flex flex-col items-center justify-center relative overflow-hidden bg-white p-12">
          <div className="tool-grid-bg opacity-20 pointer-events-none" />
          
          <AnimatePresence mode="wait">
            {status === 'setup' ? (
              <motion.div key="setup" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="flex flex-col items-center gap-12">
                 <div className="w-24 h-24 bg-indigo-600 rounded-[2rem] flex items-center justify-center text-white  rotate-3 border-4 border-white">
                    <Search size={48} strokeWidth={2.5} />
                 </div>
                 <div className="text-center">
                    <h2 className="text-6xl font-black text-slate-900 tracking-tighter uppercase leading-none italic">
                      <FormattedMessage id="findtheword.title" />
                    </h2>
                 </div>
                 <button onClick={startActivity} className="px-12 py-6 bg-slate-900 text-white rounded-[2.5rem] font-black text-sm uppercase tracking-widest hover:bg-indigo-600 transition-all ">
                    <Play size={24} fill="currentColor" strokeWidth={0} />
                 </button>
              </motion.div>
            ) : status === 'playing' ? (
              <div className="flex-1 w-full flex gap-12">
                 <div 
                    ref={containerRef}
                    onPointerDown={handleStart}
                    onPointerMove={handleMove}
                    onPointerUp={handleEnd}
                    className="flex-1 aspect-square bg-slate-50 rounded-[3rem]  border-8 border-white grid touch-none select-none relative overflow-hidden"
                    style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`, gridTemplateRows: `repeat(${GRID_SIZE}, 1fr)` }}
                 >
                    {foundPaths.map((path, i) => (
                      <div key={i} style={getLineStyles(path.start, path.end, true)} />
                    ))}
                    {selection && <div style={getLineStyles(selection.start, selection.end, false)} />}
                    {grid.map((row, r) => row.map((letter, c) => (
                      <div key={`${r}-${c}`} className={`flex items-center justify-center font-black text-4xl text-slate-900 z-10 pointer-events-none transition-all ${isDragging ? 'opacity-40' : ''}`}>
                        {letter}
                      </div>
                    )))}
                 </div>

                 <div className="w-[300px] flex flex-col gap-6">
                    <div className="flex-1 bg-white/80 backdrop-blur-md rounded-[3rem] p-8 border-4 border-slate-50  flex flex-col overflow-hidden">
                       <div className="flex items-center justify-between mb-6 border-b-2 border-slate-50 pb-4">
                          <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">
                            <FormattedMessage id="findtheword.label.bank" />
                          </h4>
                          <span className="px-3 py-1 bg-slate-900 text-white rounded-lg text-[10px] font-black tabular-nums">{foundWords.length}/{targetWords.length}</span>
                       </div>
                       <div className="flex-1 overflow-y-auto no-scrollbar space-y-2">
                          {targetWords.map((word, i) => (
                            <div key={i} className={`p-4 rounded-xl font-black text-sm uppercase tracking-widest transition-all ${foundWords.includes(word) ? 'bg-emerald-500 text-white line-through opacity-50' : 'bg-white text-slate-400 border-2 border-slate-50'}`}>
                              {word}
                            </div>
                          ))}
                       </div>
                    </div>
                    <button onClick={resetTool} className="w-full py-6 bg-slate-100 text-slate-400 rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-rose-50 hover:text-rose-600 transition-all">
                       <RotateCcw size={20} />
                    </button>
                 </div>
              </div>
            ) : (
              <motion.div key="win" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-12">
                 <div className="w-40 h-40 bg-slate-900 rounded-[3rem] flex items-center justify-center text-emerald-400  border-8 border-white">
                    <Trophy size={100} strokeWidth={1.5} />
                 </div>
                 <div className="space-y-4 text-center">
                    <h2 className="text-8xl font-black text-slate-900 tracking-tighter uppercase leading-none italic">
                      <FormattedMessage id="findtheword.label.done" />
                    </h2>
                    <p className="text-2xl font-black text-indigo-400 uppercase tracking-[0.4em]">
                       <FormattedMessage id="findtheword.label.found" />: {targetWords.length}
                    </p>
                 </div>
                 <button onClick={resetTool} className="px-16 py-8 bg-indigo-600 text-white rounded-[2.5rem] font-black text-2xl uppercase tracking-widest hover:bg-indigo-700 transition-all  flex items-center gap-4 italic">
                    <RotateCcw size={32} strokeWidth={3} /> <FormattedMessage id="typinggame.label.restart" />
                 </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </ToolPanel>
    </div>
  );
};

export default FindTheWord;
