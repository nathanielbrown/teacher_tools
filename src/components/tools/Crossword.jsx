import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Grid3X3, BookOpen, Volume2, RotateCcw, 
  ChevronRight, CheckCircle2, XCircle, Sparkles, Lightbulb
} from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';
import { audioEngine } from '../../utils/audio';

const GRID_SIZE = 15;

export const Crossword = () => {
  const [status, setStatus] = useState('setup'); // setup, playing, finished
  const [lists, setLists] = useState([]);
  const [selectedList, setSelectedList] = useState(null);
  const [grid, setGrid] = useState([]);
  const [clues, setClues] = useState([]);
  const [userGrid, setUserGrid] = useState({}); // { 'x-y': char }
  const [focusedCell, setFocusedCell] = useState(null);
  const [direction, setDirection] = useState('across'); // across, down
  
  const { settings } = useSettings();

  useEffect(() => {
    const saved = localStorage.getItem('spelling_lists');
    if (saved) {
      setLists(JSON.parse(saved));
    }
  }, []);

  const generateCrossword = useCallback((words) => {
    // Basic greedy crossword algorithm
    const cleanWords = words.map(w => w.toUpperCase().trim()).filter(w => w.length > 1);
    cleanWords.sort((a, b) => b.length - a.length);

    let tempGrid = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null));
    let placedWords = [];

    const canPlace = (word, x, y, isAcross) => {
      if (isAcross) {
        if (x + word.length > GRID_SIZE) return false;
        // Check surrounding cells for illegal collisions
        for (let i = 0; i < word.length; i++) {
          const cell = tempGrid[y][x + i];
          if (cell !== null && cell !== word[i]) return false;
          
          // Check top/bottom for neighbors if we're not intersecting
          if (cell === null) {
            if (y > 0 && tempGrid[y - 1][x + i]) return false;
            if (y < GRID_SIZE - 1 && tempGrid[y + 1][x + i]) return false;
          }
        }
        // Check edges
        if (x > 0 && tempGrid[y][x - 1]) return false;
        if (x + word.length < GRID_SIZE && tempGrid[y][x + word.length]) return false;
      } else {
        if (y + word.length > GRID_SIZE) return false;
        for (let i = 0; i < word.length; i++) {
          const cell = tempGrid[y + i][x];
          if (cell !== null && cell !== word[i]) return false;

          if (cell === null) {
            if (x > 0 && tempGrid[y + i][x - 1]) return false;
            if (x < GRID_SIZE - 1 && tempGrid[y + i][x + 1]) return false;
          }
        }
        if (y > 0 && tempGrid[y - 1][x]) return false;
        if (y + word.length < GRID_SIZE && tempGrid[y + word.length][x]) return false;
      }
      return true;
    };

    const placeWord = (word, x, y, isAcross, clueNum) => {
      for (let i = 0; i < word.length; i++) {
        if (isAcross) tempGrid[y][x + i] = word[i];
        else tempGrid[y + i][x] = word[i];
      }
      placedWords.push({ word, x, y, isAcross, num: clueNum });
    };

    // Place first word
    const startX = Math.floor((GRID_SIZE - cleanWords[0].length) / 2);
    const startY = Math.floor(GRID_SIZE / 2);
    placeWord(cleanWords[0], startX, startY, true, 1);

    // Try to place others
    let clueCounter = 2;
    for (let i = 1; i < cleanWords.length; i++) {
      const word = cleanWords[i];
      let placed = false;

      // Find intersections
      for (let pIdx = 0; pIdx < placedWords.length && !placed; pIdx++) {
        const p = placedWords[pIdx];
        for (let j = 0; j < p.word.length && !placed; j++) {
          for (let k = 0; k < word.length && !placed; k++) {
            if (p.word[j] === word[k]) {
              const nx = p.isAcross ? p.x + j : p.x - k;
              const ny = p.isAcross ? p.y - k : p.y + j;
              const nIsAcross = !p.isAcross;

              if (canPlace(word, nx, ny, nIsAcross)) {
                placeWord(word, nx, ny, nIsAcross, clueCounter++);
                placed = true;
              }
            }
          }
        }
      }
    }

    setGrid(tempGrid);
    setClues(placedWords);
    setUserGrid({});
    setStatus('playing');
  }, []);

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
      if (nextX < GRID_SIZE && nextY < GRID_SIZE && grid[nextY][nextX]) {
        setFocusedCell({ x: nextX, y: nextY });
      }
    }
  };

  const speak = (text) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utterance);
  };

  const checkWin = () => {
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
  };

  useEffect(() => {
    if (status === 'playing') checkWin();
  }, [userGrid]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 h-full flex flex-col gap-6">
      {/* Header */}
      <div className="bg-white p-8 rounded-[2.5rem] border-2 border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600">
              <Grid3X3 size={32} />
            </div>
            <h2 className="text-4xl font-black text-slate-800 tracking-tight">Crossword</h2>
          </div>
          <p className="text-slate-400 font-medium pl-1">Solve puzzles using your spelling lists!</p>
        </div>

        {status !== 'setup' && (
          <button
            onClick={() => setStatus('setup')}
            className="p-4 bg-slate-50 text-slate-400 rounded-2xl hover:text-red-500 transition-all"
          >
            <RotateCcw size={24} />
          </button>
        )}
      </div>

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
            <div className="lg:col-span-8 bg-white p-6 rounded-[3rem] border-2 border-slate-100 shadow-xl overflow-auto flex justify-center">
              <div 
                className="grid gap-[2px] bg-slate-200 p-[2px] rounded-lg"
                style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))` }}
              >
                {grid.map((row, y) => (
                  row.map((cell, x) => (
                    <div 
                      key={`${x}-${y}`} 
                      className={`relative w-8 h-8 md:w-10 md:h-10 ${cell ? 'bg-white' : 'bg-slate-900'}`}
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
                            className={`w-full h-full text-center font-black text-xl outline-none transition-colors
                              ${focusedCell?.x === x && focusedCell?.y === y ? 'bg-indigo-50' : 'bg-transparent'}
                            `}
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
