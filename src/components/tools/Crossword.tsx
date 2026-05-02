import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle2, 
  RotateCcw, 
  Sparkles, 
  Volume2,
  Trophy,
  Grid3X3
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { audioEngine } from '../../utils/audio';
import { useSettings } from '../../contexts/SettingsContext';
import { useHeader } from '../../contexts/HeaderContext';

import { useIntl, FormattedMessage } from 'react-intl';
import ToolPanel from '../shared/ToolPanel';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import WordPanel, { WordList } from '../shared/WordPanel';
import { BookOpen } from 'lucide-react';

// 1. Constants
const GRID_SIZE = 10;

// 3. Text (Help and Info)
const HelpContent = () => (
  <div className="space-y-4 font-['Outfit']">
    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">
      <FormattedMessage id="crossword.help.title" />
    </h3>
    <div className="space-y-3">
      {[1, 2].map((step) => (
        <div key={step} className="flex gap-3 text-left">
          <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-black text-slate-600 shrink-0">{step}</div>
          <p className="text-sm text-slate-600 font-medium leading-tight">
            <FormattedMessage 
              id={`crossword.help.step${step}`} 
              values={{ b: (chunks: React.ReactNode) => <b>{chunks}</b> }}
            />
          </p>
        </div>
      ))}
    </div>
  </div>
);

// Crossword generation logic (simplified version of the original)
const generateCrossword = (words: string[]) => {
  const MAX_DIM = 25;
  const grid = Array(MAX_DIM).fill(null).map(() => Array(MAX_DIM).fill(''));
  const placed: { word: string, r: number, c: number, dir: 'across' | 'down' }[] = [];

  const sortedWords = [...words]
    .map(w => w.toUpperCase().trim())
    .filter(w => w.length > 0)
    .sort((a, b) => b.length - a.length);

  if (sortedWords.length === 0) return null;

  const canPlace = (word: string, r: number, c: number, dir: 'across' | 'down') => {
    if (r < 0 || c < 0) return false;
    if (dir === 'across') {
      if (c + word.length > MAX_DIM) return false;
      for (let i = 0; i < word.length; i++) {
        const char = grid[r][c + i];
        if (char !== '' && char !== word[i]) return false;
        
        // Adjacency check
        if (char === '') {
          if (r > 0 && grid[r - 1][c + i] !== '') return false;
          if (r < MAX_DIM - 1 && grid[r + 1][c + i] !== '') return false;
          if (i === 0 && c > 0 && grid[r][c - 1] !== '') return false;
          if (i === word.length - 1 && c + word.length < MAX_DIM && grid[r][c + word.length] !== '') return false;
        }
      }
    } else {
      if (r + word.length > MAX_DIM) return false;
      for (let i = 0; i < word.length; i++) {
        const char = grid[r + i][c];
        if (char !== '' && char !== word[i]) return false;

        // Adjacency check
        if (char === '') {
          if (c > 0 && grid[r + i][c - 1] !== '') return false;
          if (c < MAX_DIM - 1 && grid[r + i][c + 1] !== '') return false;
          if (i === 0 && r > 0 && grid[r - 1][c] !== '') return false;
          if (i === word.length - 1 && r + word.length < MAX_DIM && grid[r + word.length][c] !== '') return false;
        }
      }
    }
    return true;
  };

  const placeAt = (word: string, r: number, c: number, dir: 'across' | 'down') => {
    for (let i = 0; i < word.length; i++) {
      if (dir === 'across') grid[r][c + i] = word[i];
      else grid[r + i][c] = word[i];
    }
    placed.push({ word, r, c, dir });
  };

  const tryToConnect = (word: string) => {
    for (const p of placed) {
      for (let i = 0; i < p.word.length; i++) {
        for (let j = 0; j < word.length; j++) {
          if (p.word[i] === word[j]) {
            const dir = p.dir === 'across' ? 'down' : 'across';
            const r = dir === 'down' ? p.r - j : p.r + i;
            const c = dir === 'down' ? p.c + i : p.c - j;
            if (canPlace(word, r, c, dir)) {
              placeAt(word, r, c, dir);
              return true;
            }
          }
        }
      }
    }
    return false;
  };

  const placeAsIsland = (word: string) => {
    // Try to pack islands near the center first
    for (let offset = 0; offset < MAX_DIM; offset++) {
      for (let r = 0; r < MAX_DIM; r++) {
        for (let c = 0; c < MAX_DIM; c++) {
          if (Math.max(Math.abs(r - MAX_DIM/2), Math.abs(c - MAX_DIM/2)) <= offset) {
            if (canPlace(word, r, c, 'across')) {
              placeAt(word, r, c, 'across');
              return true;
            }
          }
        }
      }
    }
    return false;
  };

  // Place first word
  const first = sortedWords.shift()!;
  placeAt(first, Math.floor(MAX_DIM/2), Math.floor((MAX_DIM - first.length)/2), 'across');

  for (const word of sortedWords) {
    if (!tryToConnect(word)) {
      placeAsIsland(word);
    }
  }

  // Trim
  let minR = MAX_DIM, maxR = 0, minC = MAX_DIM, maxC = 0;
  placed.forEach(p => {
    minR = Math.min(minR, p.r);
    minC = Math.min(minC, p.c);
    if (p.dir === 'across') {
      maxR = Math.max(maxR, p.r);
      maxC = Math.max(maxC, p.c + p.word.length - 1);
    } else {
      maxR = Math.max(maxR, p.r + p.word.length - 1);
      maxC = Math.max(maxC, p.c);
    }
  });

  const rows = maxR - minR + 1;
  const cols = maxC - minC + 1;
  const trimmedGrid = Array(rows).fill(null).map(() => Array(cols).fill(''));
  
  const finalPlaced = placed.map(p => ({
    ...p,
    r: p.r - minR,
    c: p.c - minC
  }));

  finalPlaced.forEach(p => {
    for (let i = 0; i < p.word.length; i++) {
      if (p.dir === 'across') trimmedGrid[p.r][p.c + i] = p.word[i];
      else trimmedGrid[p.r + i][p.c] = p.word[i];
    }
  });

  // Numbering logic
  let nextNumber = 1;
  const cellNumbers: Record<string, number> = {};
  
  // Sort placed words by position to assign numbers in typical crossword order
  const sortedByPos = [...finalPlaced].sort((a, b) => a.r - b.r || a.c - b.c);
  
  sortedByPos.forEach(p => {
    const key = `${p.r}-${p.c}`;
    if (!cellNumbers[key]) {
      cellNumbers[key] = nextNumber++;
    }
    p.number = cellNumbers[key];
  });

  return { grid: trimmedGrid, placed: finalPlaced, rows, cols };
};

export const Crossword = () => {
  const intl = useIntl();
  const { setOnReset, clearHeader, setHelpContent } = useHeader();
  const { settings } = useSettings();
  const [lists, setLists] = useLocalStorage<WordList[]>('spelling_lists', [
    { id: '1', name: 'Animals', words: ['CAT', 'DOG', 'LION', 'TIGER'] }
  ]);
  
  const [selectedListId, setSelectedListId] = useState(lists[0]?.id || '');
  const [status, setStatus] = useState<'setup' | 'playing' | 'finished'>('setup');
  const [puzzle, setPuzzle] = useState<any>(null);
  const [userGrid, setUserGrid] = useState<string[][]>([]);
  const [selectedCell, setSelectedCell] = useState<{ r: number, c: number } | null>(null);
  const [isPanelVisible, setIsPanelVisible] = useState(true);

  const startPuzzle = () => {
    const list = lists.find(l => l.id === selectedListId);
    if (!list) return;
    
    const newPuzzle = generateCrossword(list.words);
    if (!newPuzzle) return;

    setPuzzle(newPuzzle);
    setUserGrid(Array(newPuzzle.rows).fill(null).map(() => Array(newPuzzle.cols).fill('')));
    setStatus('playing');
    setIsPanelVisible(false);
  };

  const resetPuzzle = useCallback(() => {
    setStatus('setup');
    setPuzzle(null);
    setSelectedCell(null);
    setIsPanelVisible(true);
  }, []);

  const handleCellClick = (r: number, c: number) => {
    if (puzzle.grid[r][c] === '') return;
    setSelectedCell({ r, c });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!selectedCell || status !== 'playing') return;

    if (e.key === 'Backspace') {
      const nextGrid = [...userGrid];
      nextGrid[selectedCell.r][selectedCell.c] = '';
      setUserGrid(nextGrid);
      return;
    }

    if (e.key.length === 1 && e.key.match(/[a-z]/i)) {
      const char = e.key.toUpperCase();
      const nextGrid = [...userGrid];
      nextGrid[selectedCell.r][selectedCell.c] = char;
      setUserGrid(nextGrid);
      
      // Basic auto-advance
      // (Implementation omitted for brevity, would find next cell in direction)
    }
  };

  const checkSolution = () => {
    let complete = true;
    let correct = true;

    for (let r = 0; r < puzzle.rows; r++) {
      for (let c = 0; c < puzzle.cols; c++) {
        if (puzzle.grid[r][c] !== '') {
          if (userGrid[r][c] === '') complete = false;
          if (userGrid[r][c] !== puzzle.grid[r][c]) correct = false;
        }
      }
    }

    if (correct && complete) {
      setStatus('finished');
      audioEngine.playAlarm(settings.soundTheme);
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
    } else {
      audioEngine.playTick(settings.soundTheme);
      alert(complete ? intl.formatMessage({ id: 'crossword.label.mistake' }) : intl.formatMessage({ id: 'crossword.label.incomplete' }));
    }
  };

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

  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(new SpeechSynthesisUtterance(text));
    }
  };

  useEffect(() => {
    setOnReset(() => resetPuzzle);
    setHelpContent(<HelpContent />);
    return () => clearHeader();
  }, [clearHeader, setOnReset, resetPuzzle, setHelpContent]);

  return (
    <div className="flex flex-col lg:flex-row h-full w-full overflow-hidden transition-all duration-500 ease-in-out gap-8" onKeyDown={handleKeyDown} tabIndex={0}>
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
        <div className="w-full h-full flex flex-col items-center justify-center relative overflow-hidden">
          <div className="tool-grid-bg opacity-20 pointer-events-none" />
          
          <AnimatePresence mode="wait">
            {status === 'setup' ? (
              <motion.div key="setup" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="flex flex-col items-center gap-12">
                 <div className="w-24 h-24 bg-slate-900 flex items-center justify-center text-white border-4 border-white">
                    <Grid3X3 size={48} strokeWidth={2.5} />
                 </div>
                 <div className="text-center">
                    <h2 className="text-6xl font-black text-slate-900 tracking-tighter uppercase leading-none">
                      <FormattedMessage id="crossword.title" />
                    </h2>
                 </div>
                 <button onClick={startPuzzle} className="px-12 py-6 bg-slate-900 text-white font-black text-sm uppercase tracking-widest hover:bg-slate-800 transition-all">
                    <FormattedMessage id="crossword.label.make" />
                 </button>
              </motion.div>
            ) : status === 'playing' ? (
              <div className="flex-1 w-full flex">
                  <div 
                    className="flex-1 bg-slate-900 overflow-hidden relative grid"
                    style={{ 
                      gridTemplateColumns: `repeat(${puzzle.cols}, 1fr)`,
                      gridTemplateRows: `repeat(${puzzle.rows}, 1fr)`
                    }}
                  >
                    <div className="tool-grid-bg opacity-10" />
                    {userGrid.map((row, r) => row.map((char, c) => {
                       const startOfWords = puzzle.placed.filter((p: any) => p.r === r && p.c === c);
                       const number = startOfWords.length > 0 ? startOfWords[0].number : null;
                       
                       return (
                         <div
                           key={`${r}-${c}`}
                           onClick={() => handleCellClick(r, c)}
                           className={`relative flex items-center justify-center text-2xl font-black ${
                           puzzle.grid[r][c] === '' ? 'bg-slate-900' : 
                           selectedCell?.r === r && selectedCell?.c === c ? 'bg-slate-100 ring-4 ring-inset ring-slate-900 z-10' : 'bg-white text-slate-900 border border-slate-900'
                         }`}
                         >
                           {number && (
                             <span className="absolute top-1 left-1 text-[10px] text-slate-400 font-bold leading-none select-none">
                               {number}
                             </span>
                           )}
                           {char}
                         </div>
                       );
                    }))}
                  </div>

                  <div className="w-[320px] flex flex-col border-l-4 border-slate-900 bg-white">
                    <div className="flex-1 p-8 overflow-y-auto no-scrollbar space-y-8">
                       <section>
                          <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                             <BookOpen size={14} /> <FormattedMessage id="crossword.label.across" />
                          </h4>
                          <div className="space-y-3">
                             {puzzle.placed.filter((p: any) => p.dir === 'across').sort((a: any, b: any) => a.number - b.number).map((p: any, i: number) => (
                                <button key={i} onClick={() => speak(p.word)} className="w-full p-4 bg-slate-50 hover:bg-slate-100 text-left font-black text-slate-600 transition-all flex items-center justify-between group">
                                   <span>{p.number}. ???</span>
                                   <Volume2 size={16} className="text-slate-300 group-hover:text-slate-600" />
                                </button>
                             ))}
                          </div>
                       </section>

                       <section>
                          <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                             <Grid3X3 size={14} /> <FormattedMessage id="crossword.label.down" />
                          </h4>
                          <div className="space-y-3">
                             {puzzle.placed.filter((p: any) => p.dir === 'down').sort((a: any, b: any) => a.number - b.number).map((p: any, i: number) => (
                                <button key={i} onClick={() => speak(p.word)} className="w-full p-4 bg-slate-50 hover:bg-slate-100 text-left font-black text-slate-600 transition-all flex items-center justify-between group">
                                   <span>{p.number}. ???</span>
                                   <Volume2 size={16} className="text-slate-300 group-hover:text-slate-600" />
                                </button>
                             ))}
                          </div>
                       </section>
                    </div>
                    <button onClick={checkSolution} className="w-full py-8 bg-slate-900 text-white font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all">
                       <FormattedMessage id="crossword.label.check" />
                    </button>
                  </div>
              </div>
            ) : (
              <motion.div key="win" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-12">
                 <div className="w-40 h-40 bg-slate-900 flex items-center justify-center text-amber-400 border-8 border-white">
                    <Trophy size={100} strokeWidth={1.5} />
                 </div>
                 <h2 className="text-8xl font-black text-slate-900 tracking-tighter uppercase leading-none">
                   <FormattedMessage id="crossword.label.solved" />
                 </h2>
                 <button onClick={resetPuzzle} className="px-16 py-8 bg-slate-900 text-white font-black text-2xl uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-4">
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

export default Crossword;
