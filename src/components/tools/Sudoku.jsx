import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Grid3X3, RotateCcw, Trophy, Brain, ChevronLeft, ChevronRight, CheckCircle2, AlertCircle, BookOpen, Sparkles } from 'lucide-react';

// Sudoku Logic Utilities
const isValid = (grid, row, col, num) => {
  for (let x = 0; x < 9; x++) if (grid[row][x] === num) return false;
  for (let x = 0; x < 9; x++) if (grid[x][col] === num) return false;
  let startRow = row - (row % 3), startCol = col - (col % 3);
  for (let i = 0; i < 3; i++)
    for (let j = 0; j < 3; j++)
      if (grid[i + startRow][j + startCol] === num) return false;
  return true;
};

const isConflicting = (grid, row, col, val) => {
  if (val === 0) return false;
  // Check row
  for (let x = 0; x < 9; x++) if (x !== col && grid[row][x] === val) return true;
  // Check col
  for (let x = 0; x < 9; x++) if (x !== row && grid[x][col] === val) return true;
  // Check box
  let startRow = row - (row % 3), startCol = col - (col % 3);
  for (let i = 0; i < 3; i++)
    for (let j = 0; j < 3; j++)
      if ((i + startRow !== row || j + startCol !== col) && grid[i + startRow][j + startCol] === val) return true;
  return false;
};

const solve = (grid) => {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (grid[row][col] === 0) {
        for (let num = 1; num <= 9; num++) {
          if (isValid(grid, row, col, num)) {
            grid[row][col] = num;
            if (solve(grid)) return true;
            grid[row][col] = 0;
          }
        }
        return false;
      }
    }
  }
  return true;
};

const countSolutions = (grid, count = { val: 0 }) => {
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
  const grid = Array(9).fill().map(() => Array(9).fill(0));
  const fill = (g) => {
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

const generatePuzzle = (difficulty) => {
  let grid = generateFullGrid();
  let solvedGrid = grid.map(row => [...row]);
  let attempts = difficulty === 'Easy' ? 25 : difficulty === 'Medium' ? 45 : 60;
  let clues = 81;
  
  const cells = [];
  for (let i = 0; i < 81; i++) cells.push(i);
  cells.sort(() => Math.random() - 0.5);

  while (attempts > 0 && cells.length > 0) {
    const cellIdx = cells.pop();
    const row = Math.floor(cellIdx / 9);
    const col = cellIdx % 9;
    
    const backup = grid[row][col];
    grid[row][col] = 0;
    
    const tempGrid = grid.map(r => [...r]);
    if (countSolutions(tempGrid) !== 1) {
      grid[row][col] = backup;
      attempts--;
    } else {
      clues--;
    }
  }

  // Add bonus clues for Easy and Medium
  const emptyCells = [];
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

export const Sudoku = () => {
  const [grid, setGrid] = useState(Array(9).fill().map(() => Array(9).fill(0)));
  const [initialGrid, setInitialGrid] = useState(Array(9).fill().map(() => Array(9).fill(0)));
  const [solution, setSolution] = useState(null);
  const [selected, setSelected] = useState(null); // { row, col }
  const [difficulty, setDifficulty] = useState('Easy');
  const [status, setStatus] = useState('loading'); // 'loading', 'playing', 'solved'
  const [stats, setStats] = useState(() => {
    const saved = localStorage.getItem('teacherToolsSudokuStats');
    return saved ? JSON.parse(saved) : { Easy: 0, Medium: 0, Hard: 0 };
  });

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
  }, [difficulty]);

  useEffect(() => {
    initGame();
  }, []);

  useEffect(() => {
    localStorage.setItem('teacherToolsSudokuStats', JSON.stringify(stats));
  }, [stats]);

  const checkSolved = (currentGrid) => {
    if (currentGrid.every((row, r) => row.every((val, c) => val === solution[r][c]))) {
      setStatus('solved');
      setStats(prev => ({ ...prev, [difficulty]: prev[difficulty] + 1 }));
      setSelected(null);
    }
  };

  const handleCellClick = (row, col) => {
    if (status !== 'playing' || initialGrid[row][col] !== 0) return;
    
    const currentVal = grid[row][col];
    let nextVal;

    if (difficulty === 'Easy') {
      // Create a temp grid with the current cell cleared to check what COULD go there
      const tempGrid = grid.map(r => [...r]);
      tempGrid[row][col] = 0;

      // Find all valid numbers for this spot
      const validNums = [];
      for (let n = 1; n <= 9; n++) {
        if (isValid(tempGrid, row, col, n)) validNums.push(n);
      }
      
      const options = [0, ...validNums];
      const currentIndex = options.indexOf(currentVal);
      // If current is invalid or not in options, go to first valid
      if (currentIndex === -1) {
        nextVal = options[1] || 0;
      } else {
        nextVal = options[(currentIndex + 1) % options.length];
      }
    } else {
      nextVal = (currentVal + 1) % 10;
    }
    
    const newGrid = grid.map((r, rIdx) => 
      rIdx === row ? r.map((c, cIdx) => cIdx === col ? nextVal : c) : [...r]
    );
    
    setGrid(newGrid);
    setSelected({ row, col });
    checkSolved(newGrid);
  };

  const handleNumberInput = (num) => {
    if (!selected || status !== 'playing') return;
    const newGrid = grid.map((row, r) => 
      r === selected.row ? row.map((c, cIdx) => cIdx === selected.col ? num : c) : [...row]
    );
    setGrid(newGrid);
    checkSolved(newGrid);
  };

  const handleKeyDown = (e) => {
    if (!selected || status !== 'playing') return;
    if (e.key >= '1' && e.key <= '9') {
      handleNumberInput(parseInt(e.key));
    } else if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') {
      handleNumberInput(0);
    } else if (e.key === 'ArrowUp' && selected.row > 0) {
      setSelected(prev => ({ ...prev, row: prev.row - 1 }));
    } else if (e.key === 'ArrowDown' && selected.row < 8) {
      setSelected(prev => ({ ...prev, row: prev.row + 1 }));
    } else if (e.key === 'ArrowLeft' && selected.col > 0) {
      setSelected(prev => ({ ...prev, col: prev.col - 1 }));
    } else if (e.key === 'ArrowRight' && selected.col < 8) {
      setSelected(prev => ({ ...prev, col: prev.col + 1 }));
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selected, status, grid]);

  return (
    <div className="max-w-6xl mx-auto h-full flex flex-col gap-8 px-4 lg:px-0 py-8">
      {/* Header */}
      <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-6 shrink-0">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-indigo-50 rounded-2xl text-indigo-600">
            <Grid3X3 size={40} />
          </div>
          <div>
            <h2 className="text-4xl font-black text-slate-800 tracking-tight">Sudoku</h2>
            <p className="text-slate-400 font-medium tracking-wide italic">Sharpen your mind with classic logic.</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
          {['Easy', 'Medium', 'Hard'].map((level) => (
            <button
              key={level}
              onClick={() => {
                setDifficulty(level);
                initGame(level);
              }}
              className={`px-6 py-2.5 rounded-xl font-black transition-all ${
                difficulty === level 
                  ? 'bg-white text-indigo-600 shadow-md scale-105' 
                  : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100/50'
              }`}
            >
              {level}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 min-h-0">
        {/* Main Game Area */}
        <div className="lg:col-span-8 bg-white rounded-[3rem] p-8 shadow-xl border border-gray-100 flex flex-col items-center justify-center relative min-h-[500px]">
          {status === 'loading' ? (
            <div className="flex flex-col items-center gap-6 animate-pulse">
              <div className="w-24 h-24 border-8 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
              <p className="text-slate-400 font-black uppercase tracking-widest text-sm">Generating Puzzle...</p>
            </div>
          ) : (
            <>
              <div className="w-full max-w-[500px] aspect-square grid grid-cols-9 gap-0.5 bg-slate-200 border-4 border-slate-800 rounded-lg overflow-hidden shadow-2xl relative">
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
                      relative flex items-center justify-center text-2xl font-black transition-all
                      ${r % 3 === 2 && r !== 8 ? 'border-b-2 border-b-slate-800' : ''}
                      ${c % 3 === 2 && c !== 8 ? 'border-r-2 border-r-slate-800' : ''}
                      ${isInitial ? 'bg-slate-50 text-slate-800' : 'bg-white text-indigo-600'}
                      ${isInGroup && !isSelected ? 'bg-indigo-50/50' : ''}
                      ${isConflicted ? 'bg-red-50 text-red-600' : ''}
                      ${isSelected ? 'ring-4 ring-indigo-500 ring-inset z-10 scale-105 shadow-xl' : ''}
                      ${status === 'solved' ? 'bg-green-50 text-green-600' : ''}
                    `}
                  >
                    {cell !== 0 ? cell : ''}
                    {isConflicted && (
                      <div className="absolute top-0.5 right-0.5">
                        <AlertCircle size={12} className="text-red-400" />
                      </div>
                    )}
                  </button>
                );
              }))}

              <AnimatePresence>
                {status === 'solved' && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute inset-0 bg-white/80 backdrop-blur-md flex flex-col items-center justify-center z-30"
                  >
                    <div className="p-8 bg-green-50 rounded-full text-green-600 mb-6 shadow-lg border-2 border-green-100">
                      <Trophy size={80} strokeWidth={1.5} />
                    </div>
                    <h3 className="text-5xl font-black text-slate-800 mb-2">WELL DONE!</h3>
                    <p className="text-slate-500 font-bold mb-8">You solved the {difficulty} puzzle!</p>
                    <button
                      onClick={() => initGame()}
                      className="px-12 py-4 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 active:scale-95"
                    >
                      PLAY AGAIN
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="w-full max-w-[500px] flex items-center justify-between mt-8">
              <div className="flex gap-4 w-full">
                <button
                  onClick={() => setGrid(initialGrid.map(row => [...row]))}
                  className="flex-1 flex items-center justify-center gap-3 px-6 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black hover:bg-slate-200 transition-all active:scale-95"
                >
                  <RotateCcw size={20} />
                  RESET GRID
                </button>
                <button
                  onClick={() => initGame()}
                  className="flex-1 flex items-center justify-center gap-3 px-6 py-4 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 active:scale-95"
                >
                  NEW PUZZLE
                </button>
              </div>
            </div>
          </>
        )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-4 flex flex-col gap-8">
          {/* Controls */}
          <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-gray-100 flex-1 flex flex-col">
            <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-3 uppercase tracking-tight">
              <BookOpen className="text-indigo-600" />
              Instructions
            </h3>
            
            <div className="space-y-6">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-sm text-slate-600 leading-relaxed">
                  The goal is to fill the 9×9 grid so that each <strong className="text-slate-800">row</strong>, each <strong className="text-slate-800">column</strong>, and each of the nine <strong className="text-slate-800">3×3 boxes</strong> contains all of the digits from 1 to 9.
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">How to Play</h4>
                <ul className="space-y-2">
                  <li className="flex items-start gap-3 text-sm text-slate-600">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                    <span>Click a cell to <strong className="text-indigo-600">increment</strong> its value.</span>
                  </li>
                  <li className="flex items-start gap-3 text-sm text-slate-600">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                    <span>Continue clicking until the cell is <strong className="text-slate-400">empty</strong> to reset it.</span>
                  </li>
                  <li className="flex items-start gap-3 text-sm text-slate-600">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                    <span>Desktop users can also use keys <strong className="text-slate-800">1-9</strong>.</span>
                  </li>
                </ul>
              </div>

              {(difficulty === 'Easy' || difficulty === 'Medium') && (
                <div className="p-4 bg-red-50 rounded-2xl border border-red-100 flex gap-3">
                  <AlertCircle size={20} className="text-red-500 shrink-0" />
                  <p className="text-xs text-red-700 font-medium leading-relaxed">
                    Conflicting numbers will be highlighted in red automatically in this mode.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="bg-indigo-600 rounded-[2.5rem] p-8 shadow-xl text-white">
            <h3 className="text-xl font-black mb-6 flex items-center gap-3">
              <Trophy />
              Achievement
            </h3>
            <div className="space-y-4">
              {Object.entries(stats).map(([level, count]) => (
                <div key={level} className="flex items-center justify-between bg-white/10 rounded-2xl p-4 border border-white/10">
                  <span className="font-bold text-white/80">{level}</span>
                  <span className="text-2xl font-black">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
