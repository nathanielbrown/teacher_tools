import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, CheckCircle2, RotateCcw, BookOpen, ChevronRight, Play, Search, Trophy, Plus, Trash2, Pencil } from 'lucide-react';
import confetti from 'canvas-confetti';
import { audioEngine } from '../../utils/audio';
import { useSettings } from '../../contexts/SettingsContext';
import { ToolHeader } from '../ToolHeader';

const GRID_SIZE = 12;

export const FindTheWord = () => {
  const { settings } = useSettings();
  const [status, setStatus] = useState('setup'); // 'setup', 'playing', 'finished'
  const [lists, setLists] = useState(() => {
    const saved = localStorage.getItem('spelling_lists');
    return saved ? JSON.parse(saved) : [
      { id: '1', name: 'Example List', words: ['apple', 'banana', 'orange'] }
    ];
  });
  
  const [selectedListId, setSelectedListId] = useState(lists[0]?.id || '');
  const [isAddingList, setIsAddingList] = useState(false);
  const [editingListId, setEditingListId] = useState(null);
  const [newListTitle, setNewListTitle] = useState('');
  const [wordsInput, setWordsInput] = useState('');

  const [grid, setGrid] = useState([]);
  const [targetWords, setTargetWords] = useState([]);
  const [foundWords, setFoundWords] = useState([]);
  const [selection, setSelection] = useState(null); // { start: {r,c}, end: {r,c} }
  const [isDragging, setIsDragging] = useState(false);
  const [foundPaths, setFoundPaths] = useState([]); // Array of { start, end, word }

  const containerRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('spelling_lists', JSON.stringify(lists));
  }, [lists]);

  const speak = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  const saveList = () => {
    if (!newListTitle.trim() || !wordsInput.trim()) return;
    const newWords = wordsInput.split('\n').map(w => w.trim()).filter(w => w.length > 0);
    if (newWords.length === 0) return;

    if (editingListId) {
      setLists(prev => prev.map(l => l.id === editingListId ? { ...l, name: newListTitle.trim(), words: newWords } : l));
    } else {
      const newList = {
        id: Date.now().toString(),
        name: newListTitle.trim(),
        words: newWords
      };
      setLists(prev => [...prev, newList]);
      setSelectedListId(newList.id);
    }

    setNewListTitle('');
    setWordsInput('');
    setIsAddingList(false);
    setEditingListId(null);
  };

  const editList = (list, e) => {
    e.stopPropagation();
    setEditingListId(list.id);
    setNewListTitle(list.name);
    setWordsInput(list.words.join('\n'));
    setIsAddingList(true);
  };

  const deleteList = (id, e) => {
    e.stopPropagation();
    if (lists.length <= 1) return;
    setLists(prev => prev.filter(l => l.id !== id));
    if (selectedListId === id) setSelectedListId(lists.find(l => l.id !== id).id);
  };

  const generateGrid = (words) => {
    const newGrid = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(''));
    const placedWords = [];
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

    setGrid(newGrid);
    setTargetWords(placedWords);
    setFoundWords([]);
    setFoundPaths([]);
  };

  const canPlace = (word, r, c, dir, g) => {
    for (let i = 0; i < word.length; i++) {
      const nr = r + i * dir[0];
      const nc = c + i * dir[1];
      if (nr < 0 || nr >= GRID_SIZE || nc < 0 || nc >= GRID_SIZE) return false;
      if (g[nr][nc] !== '' && g[nr][nc] !== word[i]) return false;
    }
    return true;
  };

  const placeWord = (word, r, c, dir, g) => {
    for (let i = 0; i < word.length; i++) {
      const nr = r + i * dir[0];
      const nc = c + i * dir[1];
      g[nr][nc] = word[i];
    }
  };

  const startActivity = () => {
    const list = lists.find(l => l.id === selectedListId);
    if (!list || list.words.length === 0) return;
    generateGrid(list.words);
    setStatus('playing');
  };

  const getCellFromEvent = (e) => {
    if (!containerRef.current) return null;
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
    const cellSize = rect.width / GRID_SIZE;
    const r = Math.floor(y / cellSize);
    const c = Math.floor(x / cellSize);
    
    if (r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE) {
      return { r, c };
    }
    return null;
  };

  const handleStart = (e) => {
    if (status !== 'playing') return;
    const cell = getCellFromEvent(e);
    if (cell) {
      setSelection({ start: cell, end: cell });
      setIsDragging(true);
    }
  };

  const handleMove = (e) => {
    if (!isDragging) return;
    const cell = getCellFromEvent(e);
    if (cell && (cell.r !== selection.end.r || cell.c !== selection.end.c)) {
      const dr = cell.r - selection.start.r;
      const dc = cell.c - selection.start.c;
      if (dr === 0 || dc === 0 || Math.abs(dr) === Math.abs(dc)) {
        setSelection(prev => ({ ...prev, end: cell }));
      }
    }
  };

  const handleEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);

    if (selection) {
      const selectedWord = getWordFromPath(selection.start, selection.end);
      if (targetWords.includes(selectedWord) && !foundWords.includes(selectedWord)) {
        setFoundWords(prev => [...prev, selectedWord]);
        setFoundPaths(prev => [...prev, { ...selection, word: selectedWord }]);
        audioEngine.playTick(settings.soundTheme);
        speak(selectedWord);
        
        if (foundWords.length + 1 === targetWords.length) {
          confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
          setTimeout(() => setStatus('finished'), 1000);
        }
      }
    }
    setSelection(null);
  };

  const getWordFromPath = (start, end) => {
    const dr = Math.sign(end.r - start.r);
    const dc = Math.sign(end.c - start.c);
    const length = Math.max(Math.abs(end.r - start.r), Math.abs(end.c - start.c)) + 1;
    
    let word = '';
    for (let i = 0; i < length; i++) {
      word += grid[start.r + i * dr][start.c + i * dc];
    }
    return word;
  };

  const getLineStyles = (start, end, isSuccess = false) => {
    if (!start || !end) return {};
    const cellSize = 100 / GRID_SIZE;
    const x1 = (start.c + 0.5) * cellSize;
    const y1 = (start.r + 0.5) * cellSize;
    const x2 = (end.c + 0.5) * cellSize;
    const y2 = (end.r + 0.5) * cellSize;
    const dist = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    const angle = Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI);
    
    const thickness = cellSize * 0.8; 
    const totalWidth = dist + cellSize;

    return {
      left: `${x1}%`,
      top: `${y1}%`,
      width: `${totalWidth}%`,
      transform: `rotate(${angle}deg) translateX(-${(cellSize / 2) / totalWidth * 100}%)`,
      height: `${thickness}%`,
      marginTop: `-${thickness / 2}%`,
      borderRadius: '999px',
      backgroundColor: isSuccess ? 'rgba(34, 197, 94, 0.3)' : 'rgba(59, 130, 246, 0.3)',
      border: isSuccess ? '2px solid rgba(34, 197, 94, 0.6)' : '2px solid rgba(59, 130, 246, 0.6)',
      pointerEvents: 'none',
      position: 'absolute',
      transformOrigin: 'left center',
      zIndex: 5
    };
  };

  return (
    <div className="w-full mx-auto px-4 pt-2 pb-8 h-full flex flex-col gap-8">
      <ToolHeader
        title="Word Search"
        icon={Search}
        description="Customisable Classroom Vocabulary Challenge"
        infoContent={
          <>
            <p>
              <strong className="text-white block mb-1">Dynamic Puzzles</strong>
              Create a custom word search grid from any of your spelling lists. The tool automatically handles word placement in all directions.
            </p>
            <p>
              <strong className="text-white block mb-1">Interactive Play</strong>
              Click and drag across the grid to select words. Found words are highlighted and automatically checked off the word bank.
            </p>
          </>
        }
      />

      {status === 'setup' && (
        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-8 animate-in fade-in zoom-in duration-300">
          <div className="md:col-span-2 space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-700 flex items-center gap-2">
                <BookOpen className="text-accent" /> Select a List
              </h3>
              <button
                onClick={() => {
                  setIsAddingList(!isAddingList);
                  if (isAddingList) setEditingListId(null);
                  setNewListTitle('');
                  setWordsInput('');
                }}
                className="px-4 py-2 bg-accent/10 text-accent rounded-xl font-bold hover:bg-accent/20 transition-all flex items-center gap-2"
              >
                <Plus size={20} /> {isAddingList ? 'Back' : 'Create New'}
              </button>
            </div>

            {isAddingList ? (
              <div className="bg-white p-6 rounded-3xl shadow-xl border border-slate-100 space-y-4">
                <input
                  type="text"
                  placeholder="List Title (e.g., Science Words)"
                  value={newListTitle}
                  onChange={(e) => setNewListTitle(e.target.value)}
                  className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:ring-4 focus:ring-accent/10 focus:border-accent outline-none font-bold"
                />
                <textarea
                  placeholder="Enter words, one per line..."
                  value={wordsInput}
                  onChange={(e) => setWordsInput(e.target.value)}
                  className="w-full h-48 p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:ring-4 focus:ring-accent/10 focus:border-accent outline-none font-mono resize-none"
                />
                <button
                  onClick={saveList}
                  disabled={!newListTitle.trim() || !wordsInput.trim()}
                  className="w-full py-4 bg-accent text-white rounded-2xl font-black text-xl shadow-lg shadow-accent/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {editingListId ? 'Update List' : 'Save List'}
                </button>
              </div>
            ) : (
              <div className="grid gap-3">
                {lists.map(list => (
                  <button
                    key={list.id}
                    onClick={() => setSelectedListId(list.id)}
                    className={`w-full p-6 rounded-3xl border-4 transition-all flex items-center justify-between group ${
                      selectedListId === list.id 
                        ? 'border-accent bg-accent/5' 
                        : 'border-white bg-white hover:border-slate-100 shadow-sm'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-xl ${
                        selectedListId === list.id ? 'bg-accent text-white' : 'bg-slate-100 text-slate-400'
                      }`}>
                        {list.words.length}
                      </div>
                      <div className="text-left">
                        <div className="font-black text-slate-700 text-xl">{list.name}</div>
                        <div className="text-slate-400 font-medium text-sm truncate max-w-xs">
                          {list.words.join(', ')}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => editList(list, e)}
                        className="p-2 text-slate-300 hover:text-accent transition-colors opacity-0 group-hover:opacity-100"
                        title="Edit List"
                      >
                        <Pencil size={20} />
                      </button>
                      {lists.length > 1 && (
                        <button
                          onClick={(e) => deleteList(list.id, e)}
                          className="p-2 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                          title="Delete List"
                        >
                          <Trash2 size={20} />
                        </button>
                      )}
                      <ChevronRight className={selectedListId === list.id ? 'text-accent' : 'text-slate-200'} />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="bg-slate-900 p-8 rounded-[3rem] text-white flex flex-col justify-center items-center text-center space-y-6">
            <div className="bg-white/10 p-6 rounded-[2rem]">
              <Play size={48} className="text-accent fill-accent" />
            </div>
            <div>
              <h4 className="text-2xl font-black italic uppercase tracking-tighter">Ready?</h4>
              <p className="text-slate-400 font-medium">Find all the hidden words in the grid.</p>
            </div>
            <button
              onClick={startActivity}
              disabled={isAddingList}
              className="w-full py-5 bg-accent text-white rounded-2xl font-black text-2xl shadow-xl shadow-accent/30 hover:scale-[1.05] active:scale-95 transition-all disabled:opacity-50"
            >
              START GAME
            </button>
          </div>
        </div>
      )}

      {status === 'playing' && (
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1 space-y-4 h-full flex flex-col">
            <div className="bg-white p-6 rounded-3xl shadow-xl border border-slate-100 flex-1 overflow-y-auto custom-scrollbar">
              <div className="flex items-center gap-2 mb-4 text-slate-400 font-bold uppercase tracking-widest text-xs sticky top-0 bg-white py-1">
                <Search size={14} /> Word Bank
              </div>
              <div className="grid gap-2">
                {targetWords.map((word, i) => (
                  <div 
                    key={i}
                    className={`px-4 py-3 rounded-xl font-black transition-all text-sm flex items-center justify-between ${
                      foundWords.includes(word) 
                        ? 'bg-green-100 text-green-600 line-through opacity-50' 
                        : 'bg-slate-50 text-slate-700 border border-slate-200'
                    }`}
                  >
                    {word}
                    {foundWords.includes(word) && <CheckCircle2 size={14} />}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-indigo-600 p-6 rounded-3xl text-white shadow-xl text-center">
              <div className="text-xs font-bold opacity-70 uppercase tracking-widest mb-1">Found</div>
              <div className="text-4xl font-black">{foundWords.length} / {targetWords.length}</div>
            </div>
          </div>

          <div className="lg:col-span-3 flex justify-center items-center">
            <div className="relative w-full max-w-[550px] aspect-square p-2 bg-slate-100 rounded-[2.5rem] shadow-2xl">
              <div 
                ref={containerRef}
                onMouseDown={handleStart}
                onMouseMove={handleMove}
                onMouseUp={handleEnd}
                onMouseLeave={handleEnd}
                onTouchStart={handleStart}
                onTouchMove={handleMove}
                onTouchEnd={handleEnd}
                className="relative w-full h-full bg-white rounded-[2rem] grid touch-none select-none"
                style={{ 
                  gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`, 
                  gridTemplateRows: `repeat(${GRID_SIZE}, 1fr)` 
                }}
              >
                {foundPaths.map((path, i) => (
                  <div key={i} style={getLineStyles(path.start, path.end, true)} />
                ))}
                
                {selection && <div style={getLineStyles(selection.start, selection.end, false)} />}

                {grid.map((row, r) => row.map((letter, c) => (
                  <div 
                    key={`${r}-${c}`}
                    className="flex items-center justify-center font-black text-lg sm:text-2xl text-slate-700 z-10 pointer-events-none"
                  >
                    {letter}
                  </div>
                )))}
              </div>
            </div>
          </div>
        </div>
      )}

      {status === 'finished' && (
        <div className="flex-1 flex flex-col items-center justify-center animate-in zoom-in duration-500">
          <div className="bg-slate-900 p-16 rounded-[4rem] shadow-2xl text-white text-center space-y-8">
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-accent blur-3xl opacity-30 animate-pulse" />
              <div className="relative bg-accent p-8 rounded-[2rem] shadow-2xl">
                <Trophy size={80} />
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-5xl font-black italic uppercase tracking-tighter">Great Job!</h2>
              <p className="text-slate-400 text-xl font-medium">You found all words in the <span className="text-white font-black underline decoration-accent decoration-4">{lists.find(l => l.id === selectedListId)?.name}</span> list!</p>
            </div>
            <button
              onClick={() => setStatus('setup')}
              className="px-12 py-6 bg-white text-slate-900 rounded-2xl font-black text-2xl hover:scale-105 active:scale-95 transition-all shadow-xl"
            >
              PLAY AGAIN
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
