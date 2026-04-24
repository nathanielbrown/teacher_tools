import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Grid3X3, BookOpen, Volume2, RotateCcw, 
  ChevronRight, CheckCircle2, XCircle, Sparkles, Lightbulb
} from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';
import { audioEngine } from '../../utils/audio';
import { ToolHeader } from '../ToolHeader';

const INITIAL_GRID_SIZE = 40; // Larger internal size for generation room
const MAX_CELL_SIZE = 48;
const MIN_CELL_SIZE = 24;

export const Crossword = () => {
  const [status, setStatus] = useState('setup'); // setup, playing, finished
  const [lists, setLists] = useState([]);
  const [selectedList, setSelectedList] = useState(null);
  const [grid, setGrid] = useState([]);
  const [clues, setClues] = useState([]);
  const [gridSize, setGridSize] = useState({ rows: 0, cols: 0 });
  const [direction, setDirection] = useState('across'); // across, down
  const containerRef = useRef(null);
  const [cellSize, setCellSize] = useState(40);
  const [userGrid, setUserGrid] = useState({});
  const [focusedCell, setFocusedCell] = useState(null);
  
  const { settings } = useSettings();

  useEffect(() => {
    const saved = localStorage.getItem('spelling_lists');
    if (saved) {
      setLists(JSON.parse(saved));
    }
  }, []);

  const generateCrossword = useCallback((words) => {
    const cleanWords = words.map(w => w.toUpperCase().trim()).filter(w => w.length > 1);
    if (cleanWords.length === 0) return;

    const canPlace = (word, x, y, isAcross, currentGrid) => {
      if (isAcross) {
        if (x < 0 || x + word.length > INITIAL_GRID_SIZE || y < 0 || y >= INITIAL_GRID_SIZE) return false;
        for (let i = 0; i < word.length; i++) {
          const cell = currentGrid[y][x + i];
          if (cell !== null && cell !== word[i]) return false;
          if (cell === null) {
            // Check neighbors (excluding existing same-word connections)
            if (y > 0 && currentGrid[y - 1][x + i]) return false;
            if (y < INITIAL_GRID_SIZE - 1 && currentGrid[y + 1][x + i]) return false;
          }
        }
        // Check end caps
        if (x > 0 && currentGrid[y][x - 1]) return false;
        if (x + word.length < INITIAL_GRID_SIZE && currentGrid[y][x + word.length]) return false;
      } else {
        if (y < 0 || y + word.length > INITIAL_GRID_SIZE || x < 0 || x >= INITIAL_GRID_SIZE) return false;
        for (let i = 0; i < word.length; i++) {
          const cell = currentGrid[y + i][x];
          if (cell !== null && cell !== word[i]) return false;
          if (cell === null) {
            if (x > 0 && currentGrid[y + i][x - 1]) return false;
            if (x < INITIAL_GRID_SIZE - 1 && currentGrid[y + i][x + 1]) return false;
          }
        }
        if (y > 0 && currentGrid[y - 1][x]) return false;
        if (y + word.length < INITIAL_GRID_SIZE && currentGrid[y + word.length][x]) return false;
      }
      return true;
    };

    const attemptGeneration = () => {
      let tempGrid = Array(INITIAL_GRID_SIZE).fill(null).map(() => Array(INITIAL_GRID_SIZE).fill(null));
      let placedWords = [];
      let remainingWords = [...cleanWords].sort((a, b) => b.length - a.length);

      const placeWordInternal = (word, x, y, isAcross) => {
        let num;
        const existing = placedWords.find(p => p.x === x && p.y === y);
        if (existing) {
          num = existing.num;
        } else {
          const maxNum = placedWords.length === 0 ? 0 : Math.max(...placedWords.map(p => p.num));
          num = maxNum + 1;
        }

        for (let i = 0; i < word.length; i++) {
          if (isAcross) tempGrid[y][x + i] = word[i];
          else tempGrid[y + i][x] = word[i];
        }
        placedWords.push({ word, x, y, isAcross, num });
      };

      // Place first word in middle
      const first = remainingWords.shift();
      placeWordInternal(first, Math.floor((INITIAL_GRID_SIZE - first.length) / 2), Math.floor(INITIAL_GRID_SIZE / 2), true);

      let iterations = 0;
      while (remainingWords.length > 0 && iterations < 1000) {
        iterations++;
        let placedAny = false;

        // Try connections with random order to vary results
        const currentRemaining = [...remainingWords];
        for (let i = 0; i < currentRemaining.length; i++) {
          const word = currentRemaining[i];
          const shuffledPlaced = [...placedWords].sort(() => Math.random() - 0.5);

          for (const p of shuffledPlaced) {
            for (let j = 0; j < p.word.length; j++) {
              for (let k = 0; k < word.length; k++) {
                if (p.word[j] === word[k]) {
                  const nx = p.isAcross ? p.x + j : p.x - k;
                  const ny = p.isAcross ? p.y - k : p.y + j;
                  const nIsAcross = !p.isAcross;

                  if (canPlace(word, nx, ny, nIsAcross, tempGrid)) {
                    placeWordInternal(word, nx, ny, nIsAcross);
                    remainingWords = remainingWords.filter(w => w !== word);
                    placedAny = true;
                    break;
                  }
                }
              }
              if (placedAny) break;
            }
            if (placedAny) break;
          }
          if (placedAny) break;
        }

        // If no connection possible, place an island CLOSER to the center of mass
        if (!placedAny && remainingWords.length > 0) {
          const word = remainingWords[0];
          let islandPlaced = false;

          // Try placing it near the center of existing words
          const centerX = Math.floor(placedWords.reduce((acc, p) => acc + p.x, 0) / placedWords.length);
          const centerY = Math.floor(placedWords.reduce((acc, p) => acc + p.y, 0) / placedWords.length);

          for (let radius = 2; radius < 15 && !islandPlaced; radius++) {
            for (let attempt = 0; attempt < 20; attempt++) {
              const rx = centerX + Math.floor((Math.random() - 0.5) * radius * 2);
              const ry = centerY + Math.floor((Math.random() - 0.5) * radius * 2);
              const rIsAcross = Math.random() > 0.5;

              if (canPlace(word, rx, ry, rIsAcross, tempGrid)) {
                placeWordInternal(word, rx, ry, rIsAcross);
                remainingWords.shift();
                islandPlaced = true;
                placedAny = true;
                break;
              }
            }
          }

          if (!islandPlaced) remainingWords.shift(); // Skip if impossible
        }
      }

      // Calculate bounding box
      let minX = INITIAL_GRID_SIZE, maxX = 0, minY = INITIAL_GRID_SIZE, maxY = 0;
      let hasPlaced = false;
      for (let y = 0; y < INITIAL_GRID_SIZE; y++) {
        for (let x = 0; x < INITIAL_GRID_SIZE; x++) {
          if (tempGrid[y][x]) {
            minX = Math.min(minX, x);
            maxX = Math.max(maxX, x);
            minY = Math.min(minY, y);
            maxY = Math.max(maxY, y);
            hasPlaced = true;
          }
        }
      }

      if (!hasPlaced) return null;

      // Padding
      minX = Math.max(0, minX - 1);
      minY = Math.max(0, minY - 1);
      maxX = Math.min(INITIAL_GRID_SIZE - 1, maxX + 1);
      maxY = Math.min(INITIAL_GRID_SIZE - 1, maxY + 1);

      const rows = maxY - minY + 1;
      const cols = maxX - minX + 1;
      const trimmedGrid = Array(rows).fill(null).map(() => Array(cols).fill(null));
      
      for (let y = minY; y <= maxY; y++) {
        for (let x = minX; x <= maxX; x++) {
          trimmedGrid[y - minY][x - minX] = tempGrid[y][x];
        }
      }

      const trimmedClues = placedWords.map(clue => ({
        ...clue,
        x: clue.x - minX,
        y: clue.y - minY
      }));

      return { grid: trimmedGrid, clues: trimmedClues, rows, cols, area: rows * cols };
    };

    // Run multiple times and pick the most compact one
    let best = null;
    for (let i = 0; i < 5; i++) {
      const result = attemptGeneration();
      if (!best || (result && result.area < best.area)) {
        best = result;
      }
    }

    if (best) {
      setGrid(best.grid);
      setClues(best.clues);
      setGridSize({ rows: best.rows, cols: best.cols });
      setUserGrid({});
      setStatus('playing');
    }
  }, []);

  // Dynamic cell sizing
  useEffect(() => {
    if (status !== 'playing' || !containerRef.current) return;

    const updateSize = () => {
      const container = containerRef.current;
      if (!container) return;
      
      const { width, height } = container.getBoundingClientRect();
      const padding = 48; // Account for container padding
      const availableW = width - padding;
      const availableH = height - padding;

      const sizeW = availableW / gridSize.cols;
      const sizeH = availableH / gridSize.rows;
      
      let newSize = Math.min(sizeW, sizeH);
      newSize = Math.max(MIN_CELL_SIZE, Math.min(MAX_CELL_SIZE, newSize));
      
      setCellSize(newSize);
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [status, gridSize, lists]);

  const startGame = (list) => {
    setSelectedList(list);
    generateCrossword(list.words);
  };

  const handleCellInput = (x, y, val) => {
    const char = val.toUpperCase().slice(-1);
    if (!char.match(/[A-Z]/) && char !== "") return;

    const key = `${x}-${y}`;
    setUserGrid(prev => ({ ...prev, [key]: char }));

    if (char !== "") {
      // Move focus
      const nextX = direction === 'across' ? x + 1 : x;
      const nextY = direction === 'down' ? y + 1 : y;
      if (nextY < gridSize.rows && nextX < gridSize.cols && grid[nextY][nextX]) {
        setFocusedCell({ x: nextX, y: nextY });
      }
    }
  };

  const speak = (text) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utterance);
  };

  const checkWin = useCallback(() => {
    const isComplete = clues.every(clue => {
      for (let i = 0; i < clue.word.length; i++) {
        const cx = clue.isAcross ? clue.x + i : clue.x;
        const cy = clue.isAcross ? clue.y : clue.y + i;
        if (userGrid[`${cx}-${cy}`] !== clue.word[i]) return false;
      }
      return true;
    });

    if (isComplete) {
      setStatus('finished');
      audioEngine.playTick(settings.soundTheme);
    }
  }, [clues, userGrid, settings.soundTheme, audioEngine]);

  useEffect(() => {
    if (status === 'playing') checkWin();
  }, [checkWin, status]);

  return (
    <div className="w-full mx-auto px-4 pt-2 pb-8 h-full flex flex-col gap-6">
      <ToolHeader
        title="Crossword"
        icon={Grid3X3}
        description="Solve Puzzles with Spelling Lists"
        infoContent={
          <>
            <p>
              <strong className="text-white block mb-1">Getting Started</strong>
              Select a spelling list from your saved collections to generate a custom crossword puzzle.
            </p>
            <p>
              <strong className="text-white block mb-1">How to Play</strong>
              Click a white cell to focus. Use the "Audio Clues" sidebar to hear the words. Change typing direction using the "Across/Down" buttons.
            </p>
          </>
        }
      >
        {status !== 'setup' && (
          <button
            onClick={() => setStatus('setup')}
            className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:text-red-500 transition-all"
            title="Return to Menu"
          >
            <RotateCcw size={20} />
          </button>
        )}
      </ToolHeader>

      <AnimatePresence mode="wait">
        {status === 'setup' ? (
          <motion.div
            key="setup"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex-1 space-y-6"
          >
            <h3 className="text-2xl font-black text-slate-700 flex items-center gap-3">
              <BookOpen className="text-indigo-500" /> Choose a Spelling List
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {lists.map(list => (
                <button
                  key={list.id}
                  onClick={() => startGame(list)}
                  className="p-6 bg-white border-2 border-slate-100 rounded-[2rem] hover:border-indigo-500 hover:shadow-xl transition-all group text-left space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                      {list.words.length} Words
                    </span>
                    <ChevronRight size={20} className="text-slate-300 group-hover:text-indigo-500 transition-colors" />
                  </div>
                  <h4 className="text-xl font-black text-slate-800">{list.name}</h4>
                  <p className="text-xs text-slate-400 font-medium truncate">{list.words.join(', ')}</p>
                </button>
              ))}
              {lists.length === 0 && (
                <div className="col-span-full p-12 bg-slate-50 rounded-[3rem] border-4 border-dashed border-slate-200 text-center space-y-4">
                  <BookOpen size={48} className="mx-auto text-slate-300" />
                  <p className="text-slate-500 font-bold italic">No spelling lists found. Create one in the Spelling Practice tool first!</p>
                </div>
              )}
            </div>
          </motion.div>
        ) : status === 'playing' ? (
          <motion.div
            key="playing"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
          >
            {/* Grid Area */}
            <div 
              ref={containerRef}
              className="lg:col-span-8 bg-white p-4 md:p-8 rounded-[3rem] border-2 border-slate-100 shadow-xl overflow-hidden flex items-center justify-center min-h-[400px] lg:min-h-0 h-full"
            >
              <div 
                className="grid gap-[1px] bg-slate-200 p-[1px] rounded-lg shadow-inner"
                style={{ 
                  gridTemplateColumns: `repeat(${gridSize.cols}, ${cellSize}px)`,
                  gridTemplateRows: `repeat(${gridSize.rows}, ${cellSize}px)`
                }}
              >
                {grid.map((row, y) => (
                  row.map((cell, x) => (
                    <div 
                      key={`${x}-${y}`} 
                      className={`relative ${cell ? 'bg-white' : 'bg-slate-900'}`}
                      style={{ width: cellSize, height: cellSize }}
                      onClick={() => cell && setFocusedCell({ x, y })}
                    >
                      {cell && (
                        <>
                          <input
                            type="text"
                            maxLength="1"
                            value={userGrid[`${x}-${y}`] || ""}
                            onChange={(e) => handleCellInput(x, y, e.target.value)}
                            onFocus={() => setFocusedCell({ x, y })}
                            className={`w-full h-full text-center font-black outline-none transition-colors
                              ${focusedCell?.x === x && focusedCell?.y === y ? 'bg-indigo-50' : 'bg-transparent'}
                            `}
                            style={{ fontSize: cellSize * 0.5 }}
                          />
                          {/* Clue Number */}
                          {clues.find(c => c.x === x && c.y === y) && (
                            <span className="absolute top-[2px] left-[2px] text-[8px] font-black leading-none text-slate-400">
                              {clues.find(c => c.x === x && c.y === y).num}
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  ))
                ))}
              </div>
            </div>

            {/* Clues Sidebar */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white p-6 rounded-[2rem] border-2 border-slate-100 shadow-sm space-y-4">
                <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                  <Volume2 size={20} className="text-indigo-500" /> Audio Clues
                </h3>
                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {clues.map(clue => (
                    <button
                      key={`${clue.num}-${clue.isAcross}`}
                      onClick={() => speak(clue.word)}
                      className="w-full p-4 bg-slate-50 hover:bg-indigo-50 rounded-2xl flex items-center justify-between group transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 bg-white rounded-lg flex items-center justify-center font-black text-xs shadow-sm">
                          {clue.num}
                        </span>
                        <div className="text-left">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            {clue.isAcross ? 'Across' : 'Down'}
                          </p>
                          <p className="text-sm font-bold text-slate-700">Listen to Word</p>
                        </div>
                      </div>
                      <Volume2 size={16} className="text-slate-300 group-hover:text-indigo-500 transition-colors" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-indigo-600 p-6 rounded-[2rem] text-white space-y-4 shadow-xl shadow-indigo-100">
                <div className="flex items-center gap-2 font-black uppercase text-xs tracking-widest opacity-80">
                  <Lightbulb size={16} /> Keyboard
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => setDirection('across')}
                    className={`p-3 rounded-xl font-black text-xs transition-all ${direction === 'across' ? 'bg-white text-indigo-600' : 'bg-white/10'}`}
                  >
                    ACROSS
                  </button>
                  <button 
                    onClick={() => setDirection('down')}
                    className={`p-3 rounded-xl font-black text-xs transition-all ${direction === 'down' ? 'bg-white text-indigo-600' : 'bg-white/10'}`}
                  >
                    DOWN
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="finished"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex-1 bg-slate-900 rounded-[4rem] flex flex-col items-center justify-center p-12 text-center text-white space-y-8 shadow-2xl"
          >
            <div className="p-8 bg-green-500 rounded-[2.5rem] shadow-xl rotate-6 animate-bounce">
              <Sparkles size={64} />
            </div>
            <div className="space-y-4">
              <h3 className="text-5xl font-black italic uppercase tracking-tighter">Puzzle Solved!</h3>
              <p className="text-slate-400 text-xl max-w-md">You've successfully matched all the words in your spelling list!</p>
            </div>
            <button
              onClick={() => setStatus('setup')}
              className="px-12 py-6 bg-indigo-600 text-white rounded-3xl font-black text-2xl hover:scale-105 active:scale-95 transition-all shadow-xl shadow-indigo-500/20 flex items-center gap-4"
            >
              <RotateCcw size={32} /> PLAY AGAIN
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
