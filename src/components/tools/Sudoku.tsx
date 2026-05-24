import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Grid3X3, 
  RotateCcw, 
  Trophy, 
  Brain, 
  Volume2,
  MousePointer2,
  Target,
} from 'lucide-react';
import { ToolPanel } from '../shared/ToolPanel';
import { useHeader } from '../../contexts/HeaderContext';
import { useSettings } from '../../contexts/SettingsContext';
import { audioEngine } from '../../utils/audio';
import { useLocalStorage } from '../../hooks/useLocalStorage';

// 1. Constants (None outside functions)

// 2. Config (None)

// 3. Text (Help and Info)
const HELP_INFO = (
  <div className="space-y-4 font-['Outfit']">
    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">How to Play</h3>
    <div className="space-y-3">
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-primary/5 flex items-center justify-center text-xs font-black text-primary shrink-0">1</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">Fill the grid so every <b>Row</b>, <b>Column</b>, and <b>3x3 Square</b> has the numbers 1 to 9.</p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center text-xs font-black text-blue-600 shrink-0">2</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">Click a box and type a number (1-9) or click to change it.</p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-success-bg flex items-center justify-center text-xs font-black text-success shrink-0">3</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">Red marks show where numbers are in the <b>wrong</b> place.</p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-caution-bg flex items-center justify-center text-xs font-black text-caution shrink-0">4</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">Fill the whole grid correctly to <b>win</b>!</p>
      </div>
    </div>
  </div>
);

// 4. Local Storage (Handled in component)

// 5. Classes (None)

// 6. Functions
const isValid = (grid: number[][], row: number, col: number, num: number) => {
  for (let x = 0; x < 9; x++) if (grid[row][x] === num) return false;
  for (let x = 0; x < 9; x++) if (grid[x][col] === num) return false;
  const startRow = row - (row % 3), startCol = col - (col % 3);
  for (let i = 0; i < 3; i++)
    for (let j = 0; j < 3; j++)
      if (grid[i + startRow][j + startCol] === num) return false;
  return true;
};

const isConflicting = (grid: number[][], row: number, col: number, val: number) => {
  if (val === 0) return false;
  for (let x = 0; x < 9; x++) if (x !== col && grid[row][x] === val) return true;
  for (let x = 0; x < 9; x++) if (x !== row && grid[x][col] === val) return true;
  const startRow = row - (row % 3), startCol = col - (col % 3);
  for (let i = 0; i < 3; i++)
    for (let j = 0; j < 3; j++)
      if ((i + startRow !== row || j + startCol !== col) && grid[i + startRow][j + startCol] === val) return true;
  return false;
};

const countSolutions = (grid: number[][], count = { val: 0 }) => {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (grid[row][col] === 0) {
        for (let num = 1; num <= 9; num++) {
          if (isValid(grid, row, col, num)) {
            grid[row][col] = num;
            countSolutions(grid, count);
            if (count.val > 1) return count.val;
            grid[row][col] = 0;
          }
        }
        return count.val;
      }
    }
  }
  count.val++;
  return count.val;
};

const generateFullGrid = () => {
  const grid = Array(9).fill(null).map(() => Array(9).fill(0));
  const fill = (g: number[][]): boolean => {
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (g[row][col] === 0) {
          const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9].sort(() => Math.random() - 0.5);
          for (const num of nums) {
            if (isValid(g, row, col, num)) {
              g[row][col] = num;
              if (fill(g)) return true;
              g[row][col] = 0;
            }
          }
          return false;
        }
      }
    }
    return true;
  };
  fill(grid);
  return grid;
};

const generatePuzzle = (difficulty: string) => {
  const grid = generateFullGrid();
  const solvedGrid = grid.map(row => [...row]);
  let attempts = difficulty === 'Easy' ? 25 : difficulty === 'Medium' ? 45 : 60;
  
  const cells = [];
  for (let i = 0; i < 81; i++) cells.push(i);
  cells.sort(() => Math.random() - 0.5);

  while (attempts > 0 && cells.length > 0) {
    const cellIdx = cells.pop()!;
    const row = Math.floor(cellIdx / 9);
    const col = cellIdx % 9;
    const backup = grid[row][col];
    grid[row][col] = 0;
    const tempGrid = grid.map(r => [...r]);
    if (countSolutions(tempGrid) !== 1) {
      grid[row][col] = backup;
      attempts--;
    }
  }

  const emptyCells: {r: number, c: number}[] = [];
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (grid[r][c] === 0) emptyCells.push({ r, c });
    }
  }
  emptyCells.sort(() => Math.random() - 0.5);
  const bonusCount = difficulty === 'Easy' ? 10 : difficulty === 'Medium' ? 5 : 0;
  for (let i = 0; i < Math.min(bonusCount, emptyCells.length); i++) {
    const { r, c } = emptyCells[i];
    grid[r][c] = solvedGrid[r][c];
  }
  return { puzzle: grid, solution: solvedGrid };
};

// 7. Component
export const Sudoku = () => {
  const { setHeaderActions, setHelpContent, setOnReset, clearHeader } = useHeader();
  const { settings } = useSettings();
  
  const [grid, setGrid] = useLocalStorage('sudoku_grid', Array(9).fill(null).map(() => Array(9).fill(0)));
  const [initialGrid, setInitialGrid] = useLocalStorage('sudoku_initial_grid', Array(9).fill(null).map(() => Array(9).fill(0)));
  const [solution, setSolution] = useLocalStorage<number[][] | null>('sudoku_solution', null);
  const [selected, setSelected] = useState<{row: number, col: number} | null>(null);
  const [difficulty, setDifficulty] = useLocalStorage('sudoku_difficulty', 'Easy');
  const [status, setStatus] = useLocalStorage('sudoku_status', 'loading');
  const [stats, setStats] = useLocalStorage<Record<string, number>>('sudoku_stats', { Easy: 0, Medium: 0, Hard: 0 });

  const initGame = useCallback((level = difficulty) => {
    setStatus('loading');
    setTimeout(() => {
      const { puzzle, solution } = generatePuzzle(level);
      setGrid(puzzle.map(row => [...row]));
      setInitialGrid(puzzle.map(row => [...row]));
      setSolution(solution);
      setStatus('playing');
      setSelected(null);
    }, 100);
  }, [difficulty, setGrid, setInitialGrid, setSolution, setStatus]);

  useEffect(() => {
    if (status === 'loading') {
      initGame(difficulty);
    }
  }, [difficulty, initGame, status]);

  // Persistence handled by useLocalStorage

  const checkSolved = useCallback((currentGrid: number[][]) => {
    if (solution && currentGrid.every((row, r) => row.every((val, c) => val === solution[r][c]))) {
      setStatus('solved');
      setStats((prev: any) => ({ ...prev, [difficulty]: (prev[difficulty] || 0) + 1 }));
      setSelected(null);
      audioEngine.playSuccess(settings.soundTheme);
    }
  }, [solution, difficulty, settings.soundTheme, setStatus, setStats]);

  const handleCellClick = (row: number, col: number) => {
    if (status !== 'playing') return;
    setSelected({ row, col });
    if (initialGrid[row][col] !== 0) return;
    
    const currentVal = grid[row][col];
    let nextVal;
    if (difficulty === 'Easy') {
      const tempGrid = grid.map(r => [...r]);
      tempGrid[row][col] = 0;
      const validNums = [];
      for (let n = 1; n <= 9; n++) if (isValid(tempGrid, row, col, n)) validNums.push(n);
      const options = [0, ...validNums];
      const currentIndex = options.indexOf(currentVal);
      nextVal = currentIndex === -1 ? (options[1] || 0) : options[(currentIndex + 1) % options.length];
    } else {
      nextVal = (currentVal + 1) % 10;
    }
    
    const newGrid = grid.map((r, rIdx) => rIdx === row ? r.map((c, cIdx) => cIdx === col ? nextVal : c) : [...r]);
    setGrid(newGrid);
    audioEngine.playTick(settings.soundTheme);
    checkSolved(newGrid);
  };

  const handleNumberInput = useCallback((num: number) => {
    if (!selected || status !== 'playing' || initialGrid[selected.row][selected.col] !== 0) return;
    const newGrid = grid.map((row, r) => 
      r === selected.row ? row.map((c, cIdx) => cIdx === selected.col ? num : c) : [...row]
    );
    setGrid(newGrid);
    audioEngine.playTick(settings.soundTheme);
    checkSolved(newGrid);
  }, [selected, status, initialGrid, grid, settings.soundTheme, checkSolved, setGrid]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!selected || status !== 'playing') return;
    if (e.key >= '1' && e.key <= '9') handleNumberInput(parseInt(e.key));
    else if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') handleNumberInput(0);
    else if (e.key === 'ArrowUp' && selected.row > 0) setSelected(prev => prev ? ({ ...prev, row: prev.row - 1 }) : null);
    else if (e.key === 'ArrowDown' && selected.row < 8) setSelected(prev => prev ? ({ ...prev, row: prev.row + 1 }) : null);
    else if (e.key === 'ArrowLeft' && selected.col > 0) setSelected(prev => prev ? ({ ...prev, col: prev.col - 1 }) : null);
    else if (e.key === 'ArrowRight' && selected.col < 8) setSelected(prev => prev ? ({ ...prev, col: prev.col + 1 }) : null);
  }, [selected, status, handleNumberInput]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const resetGame = useCallback(() => {
    setGrid(initialGrid.map(row => [...row]));
    setSelected(null);
    audioEngine.playTick(settings.soundTheme);
  }, [initialGrid, settings.soundTheme, setGrid]);

  useEffect(() => {
    setOnReset(() => resetGame);
    setHelpContent(HELP_INFO);
    return () => clearHeader();
  }, [clearHeader, setOnReset, resetGame, setHelpContent]);

  useEffect(() => {
    setHeaderActions(
      <div className="flex items-center gap-4 italic">
         <div className="flex bg-surface p-1.5 rounded-2xl border-2 border-slate-100 ">
           {['Easy', 'Medium', 'Hard'].map((level) => (
             <button
               key={level}
               onClick={() => { setDifficulty(level); initGame(level); audioEngine.playTick(settings.soundTheme); }}
               className={`px-6 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${difficulty === level ? 'bg-primary text-white ' : 'text-slate-300 hover:text-primary'}`}
             >
               {level}
             </button>
           ))}
         </div>
         <button
            onClick={resetGame}
            className="flex items-center gap-2 px-6 py-2 bg-surface border-2 border-slate-100 text-slate-300 rounded-xl font-black text-[10px] uppercase tracking-widest hover:border-caution-border hover:text-caution transition-all active:scale-95 "
         >
            <RotateCcw size={14} strokeWidth={3} /> Reset
         </button>
      </div>
    );
  }, [difficulty, resetGame, initGame, settings.soundTheme, setHeaderActions, setDifficulty]);

  return (
    <ToolPanel className="flex-row gap-8 p-4 lg:p-12 italic">
      {/* Primary Interaction Stage */}
      <div className="flex-1 bg-slate-50/50 rounded-[4rem] border-4 border-white  flex flex-col items-center justify-center relative overflow-hidden group">
        <div className="tool-grid-bg opacity-20 pointer-events-none" />
        
        <AnimatePresence mode="wait">
          {status === 'loading' ? (
            <motion.div 
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-6 z-10"
            >
              <div className="w-20 h-20 border-8 border-primary/20 border-t-indigo-600 rounded-full animate-spin" />
              <p className="text-xs font-black text-neutral-400 uppercase tracking-[0.4em] animate-pulse">Loading...</p>
            </motion.div>
          ) : (
            <motion.div 
              key="game"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-12 z-10 w-full max-w-4xl"
            >
               <div className="relative p-6 bg-dark-bg rounded-[4rem]  overflow-hidden border-[12px] border-dark-border group/board">
                  <div className="tool-grid-bg-dark opacity-10 pointer-events-none" />
                  
                  <div className="grid grid-cols-9 gap-[4px] bg-slate-700 border-4 border-slate-700 rounded-[2.5rem] overflow-hidden p-1  relative z-10">
                    {grid.map((row, r) => row.map((cell, c) => {
                      const isSelected = selected?.row === r && selected?.col === c;
                      const isInitial = initialGrid[r][c] !== 0;
                      const isInGroup = selected && (
                        selected.row === r || 
                        selected.col === c || 
                        (Math.floor(selected.row / 3) === Math.floor(r / 3) && Math.floor(selected.col / 3) === Math.floor(c / 3))
                      );
                      const isConflicted = (difficulty === 'Easy' || difficulty === 'Medium') && isConflicting(grid, r, c, cell);
                      
                      return (
                        <button
                          key={`${r}-${c}`}
                          onClick={() => handleCellClick(r, c)}
                          className={`
                            w-12 h-12 md:w-16 md:h-16 flex items-center justify-center text-3xl font-black transition-all relative italic
                            ${r % 3 === 0 && r !== 0 ? 'mt-[8px]' : ''}
                            ${c % 3 === 0 && c !== 0 ? 'ml-[8px]' : ''}
                            ${isInitial ? 'bg-slate-50 text-slate-900' : 'bg-surface text-primary'}
                            ${isInGroup && !isSelected ? 'bg-primary/5/50' : ''}
                            ${isConflicted ? 'bg-caution-bg text-caution' : ''}
                            ${isSelected ? 'z-10 bg-primary text-white  scale-110 rounded-2xl' : ''}
                            hover:z-20 hover:scale-105 hover:rounded-xl transition-all
                          `}
                        >
                          {cell !== 0 ? cell : ''}
                          {isConflicted && (
                            <div className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full animate-pulse " />
                          )}
                        </button>
                      );
                    }))}
                  </div>

                  <AnimatePresence>
                    {status === 'solved' && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="absolute inset-0 bg-dark-bg/95 backdrop-blur-xl flex flex-col items-center justify-center z-30 p-12 text-center italic"
                      >
                        <div className="relative mb-10">
                           <div className="absolute inset-0 bg-amber-400 blur-[80px] opacity-20" />
                           <div className="relative w-40 h-40 bg-amber-400 rounded-[3.5rem] text-white flex items-center justify-center  rotate-12 border-8 border-white">
                              <Trophy size={80} strokeWidth={2.5} />
                           </div>
                        </div>
                        <h3 className="text-6xl font-black text-white tracking-tighter uppercase leading-none mb-4 italic">Winner!</h3>
                        <p className="text-primary/70 font-black text-xs uppercase tracking-[0.4em] mb-12">Solved!</p>
                        <button
                          onClick={() => initGame()}
                          className="w-full max-w-sm h-24 bg-primary text-white rounded-[3rem] font-black uppercase tracking-[0.2em] text-xl hover:bg-surface hover:text-primary transition-all  flex items-center justify-center gap-6"
                        >
                          Next Puzzle
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
               </div>

               {/* Game Operation Interface */}
               <div className="flex gap-6 w-full max-w-2xl px-8">
                  <button
                    onClick={resetGame}
                    className="flex-1 h-20 bg-surface border-4 border-slate-100 text-slate-300 rounded-[2.5rem] font-black uppercase tracking-widest hover:border-caution-border hover:text-caution transition-all active:scale-95  flex items-center justify-center gap-4"
                  >
                    <RotateCcw size={20} strokeWidth={3} /> Clear
                  </button>
                  <button
                    onClick={() => initGame()}
                    className="flex-1 h-20 bg-slate-950 text-white rounded-[2.5rem] font-black uppercase tracking-widest hover:bg-primary transition-all active:scale-95  flex items-center justify-center gap-4"
                  >
                    New Game
                  </button>
               </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Progress Sidebar */}
      <div className="w-full lg:w-[450px] shrink-0 flex flex-col gap-8 relative z-20 italic">
        
        {/* Mastery Registry */}
        <div className="bg-dark-bg p-12 rounded-[4rem] border-4 border-dark-border  flex flex-col items-center gap-10 relative overflow-hidden shrink-0">
           <div className="tool-grid-bg-dark opacity-10 pointer-events-none" />
           
           <div className="flex items-center justify-between w-full relative z-10">
              <span className="text-[10px] font-black text-primary/70 uppercase tracking-[0.5em]">Score</span>
           </div>

           <div className="relative z-10 w-full flex flex-col items-center">
              <div className="flex items-baseline gap-2 mb-8">
                 <span className="text-[8rem] font-black text-white italic tracking-tighter leading-none tabular-nums">
                    {Object.values(stats).reduce((a: any, b: any) => a + b, 0)}
                 </span>
                 <span className="text-3xl font-black text-slate-500 uppercase tracking-widest">TOTAL</span>
              </div>
              <div className="w-full h-px bg-surface/10 mb-8" />
              <div className="grid grid-cols-3 gap-4 w-full">
                 {Object.entries(stats).map(([level, count]) => (
                    <div key={level} className="p-6 bg-surface/5 rounded-[2rem] border border-white/5 flex flex-col items-center gap-2">
                       <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{level}</span>
                       <span className="text-2xl font-black text-primary/70 italic tabular-nums">{count as number}</span>
                    </div>
                 ))}
              </div>
           </div>
        </div>

        {/* Objectives & Protocol Block */}
        <div className="flex-1 bg-slate-50/50 p-10 rounded-[4rem] border-4 border-white  flex flex-col gap-8 min-h-0">
           <div className="flex items-center gap-4 shrink-0 border-b-4 border-white pb-6">
              <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-white ">
                 <Target size={24} strokeWidth={3} />
              </div>
              <h4 className="text-xl font-black text-slate-900 uppercase tracking-tight leading-none">Levels</h4>
           </div>

           <div className="flex-1 flex flex-col gap-8 overflow-y-auto no-scrollbar pr-2 pb-4">
              {Object.entries(stats).map(([level, count]) => {
                const totalPossible = 25;
                const percentage = Math.min((Number(count) / totalPossible) * 100, 100);
                
                return (
                  <div key={level} className="bg-surface p-8 rounded-[3rem] border-4 border-white  space-y-5">
                     <div className="flex justify-between items-end">
                        <div className="flex items-center gap-3">
                           <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${level === 'Easy' ? 'bg-emerald-100 text-success' : level === 'Medium' ? 'bg-amber-100 text-warning' : 'bg-rose-100 text-caution'}`}>
                              <Grid3X3 size={18} strokeWidth={3} />
                           </div>
                           <span className="text-sm font-black uppercase tracking-tight text-slate-900">{level}</span>
                        </div>
                        <span className="text-xl font-black text-neutral-400 tabular-nums">{count as number} <span className="text-[9px] uppercase tracking-widest opacity-60">Solved</span></span>
                     </div>
                     <div className="w-full h-4 bg-slate-50 rounded-full p-1 border-2 border-slate-50 relative overflow-hidden">
                        <motion.div 
                          className={`h-full rounded-full ${level === 'Easy' ? 'bg-emerald-500' : level === 'Medium' ? 'bg-amber-500' : 'bg-rose-500'}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                        />
                     </div>
                  </div>
                );
              })}
           </div>

           <div className="p-8 bg-primary rounded-[3.5rem] text-white space-y-6  relative overflow-hidden shrink-0 mt-auto">
              <div className="tool-grid-bg opacity-10 pointer-events-none" />
              <div className="flex items-center gap-4 relative z-10">
                 <div className="w-10 h-10 rounded-xl bg-surface/20 flex items-center justify-center text-white border border-white/20">
                    <Volume2 size={20} strokeWidth={3} />
                 </div>
                 <h4 className="text-[10px] font-black uppercase tracking-[0.3em]">Status</h4>
              </div>
              <p className="text-xs font-black leading-relaxed italic text-indigo-100 uppercase tracking-widest relative z-10">
                Playing Sudoku. <br/>
                Good luck!
              </p>
           </div>
        </div>
      </div>
    </ToolPanel>
  );
};

export default Sudoku;
