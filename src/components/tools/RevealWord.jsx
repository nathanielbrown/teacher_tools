import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, ChevronRight, RotateCcw, BookOpen, SkipForward, Eye, Sparkles, Plus, Trash2, Pencil } from 'lucide-react';
import confetti from 'canvas-confetti';
import { audioEngine } from '../../utils/audio';
import { useSettings } from '../../contexts/SettingsContext';

export const RevealWord = () => {
  const { settings } = useSettings();
  const [status, setStatus] = useState('setup'); // 'setup', 'playing'
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

  const [queue, setQueue] = useState([]);
  const [currentWord, setCurrentWord] = useState('');
  const [revealedIndices, setRevealedIndices] = useState([]);
  const [isAutoRevealing, setIsAutoRevealing] = useState(false);
  const [revealSpeed, setRevealSpeed] = useState(1500); // ms

  useEffect(() => {
    localStorage.setItem('spelling_lists', JSON.stringify(lists));
  }, [lists]);

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

  const startNextWord = useCallback((remainingQueue) => {
    const nextQueue = remainingQueue || queue;
    if (nextQueue.length === 0) {
      const list = lists.find(l => l.id === selectedListId);
      const shuffled = [...list.words].sort(() => Math.random() - 0.5);
      setQueue(shuffled.slice(1));
      setCurrentWord(shuffled[0]);
    } else {
      setCurrentWord(nextQueue[0]);
      setQueue(nextQueue.slice(1));
    }
    setRevealedIndices([]);
    setIsAutoRevealing(false);
  }, [lists, queue, selectedListId]);

  const startGame = () => {
    const list = lists.find(l => l.id === selectedListId);
    if (!list || list.words.length === 0) return;
    
    const shuffled = [...list.words].sort(() => Math.random() - 0.5);
    setCurrentWord(shuffled[0]);
    setQueue(shuffled.slice(1));
    setRevealedIndices([]);
    setStatus('playing');
    setIsAutoRevealing(false);
  };

  const revealOneLetter = useCallback(() => {
    if (!currentWord) return;
    
    const unrevealed = [];
    for (let i = 0; i < currentWord.length; i++) {
      if (!revealedIndices.includes(i)) unrevealed.push(i);
    }

    if (unrevealed.length > 0) {
      const randomIndex = unrevealed[Math.floor(Math.random() * unrevealed.length)];
      setRevealedIndices(prev => [...prev, randomIndex]);
      audioEngine.playTick(settings.soundTheme);
      
      if (unrevealed.length === 1) {
        setIsAutoRevealing(false);
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 }
        });
      }
    }
  }, [currentWord, revealedIndices, settings.soundTheme]);

  useEffect(() => {
    let timer;
    if (isAutoRevealing) {
      timer = setInterval(() => {
        revealOneLetter();
      }, revealSpeed);
    }
    return () => clearInterval(timer);
  }, [isAutoRevealing, revealOneLetter, revealSpeed]);

  return (
    <div className="max-w-6xl mx-auto space-y-8 p-4">
      <div className="text-center space-y-2">
        <h2 className="text-4xl font-black text-slate-800 tracking-tight flex items-center justify-center gap-3">
          <Sparkles className="text-secondary" /> Reveal Word
        </h2>
        <p className="text-slate-500 font-medium italic">Can you guess the word before it's fully revealed?</p>
      </div>

      {status === 'setup' && (
        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-8 animate-in fade-in zoom-in duration-300">
          <div className="md:col-span-2 space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-700 flex items-center gap-2">
                <BookOpen className="text-secondary" /> Select a List
              </h3>
              <button
                onClick={() => {
                  setIsAddingList(!isAddingList);
                  if (isAddingList) setEditingListId(null);
                  setNewListTitle('');
                  setWordsInput('');
                }}
                className="px-4 py-2 bg-secondary/10 text-secondary rounded-xl font-bold hover:bg-secondary/20 transition-all flex items-center gap-2"
              >
                <Plus size={20} /> {isAddingList ? 'Back' : 'Create New'}
              </button>
            </div>

            {isAddingList ? (
              <div className="bg-white p-6 rounded-3xl shadow-xl border border-slate-100 space-y-4">
                <input
                  type="text"
                  placeholder="List Title (e.g., Spelling Week 5)"
                  value={newListTitle}
                  onChange={(e) => setNewListTitle(e.target.value)}
                  className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:ring-4 focus:ring-secondary/10 focus:border-secondary outline-none font-bold"
                />
                <textarea
                  placeholder="Enter words, one per line..."
                  value={wordsInput}
                  onChange={(e) => setWordsInput(e.target.value)}
                  className="w-full h-48 p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:ring-4 focus:ring-secondary/10 focus:border-secondary outline-none font-mono resize-none"
                />
                <button
                  onClick={saveList}
                  disabled={!newListTitle.trim() || !wordsInput.trim()}
                  className="w-full py-4 bg-secondary text-white rounded-2xl font-black text-xl shadow-lg shadow-secondary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
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
                        ? 'border-secondary bg-secondary/5' 
                        : 'border-white bg-white hover:border-slate-100 shadow-sm'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-xl ${
                        selectedListId === list.id ? 'bg-secondary text-white' : 'bg-slate-100 text-slate-400'
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
                        className="p-2 text-slate-300 hover:text-secondary transition-colors opacity-0 group-hover:opacity-100"
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
                      <ChevronRight className={selectedListId === list.id ? 'text-secondary' : 'text-slate-200'} />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="bg-slate-900 p-8 rounded-[3rem] text-white flex flex-col justify-center items-center text-center space-y-6">
            <div className="bg-white/10 p-6 rounded-[2rem]">
              <Play size={48} className="text-secondary fill-secondary" />
            </div>
            <div>
              <h4 className="text-2xl font-black italic uppercase tracking-tighter">Ready?</h4>
              <p className="text-slate-400 font-medium">Reveal hidden words for the class to guess.</p>
            </div>
            <button
              onClick={startGame}
              disabled={isAddingList}
              className="w-full py-5 bg-secondary text-white rounded-2xl font-black text-2xl shadow-xl shadow-secondary/30 hover:scale-[1.05] active:scale-95 transition-all disabled:opacity-50"
            >
              START GAME
            </button>
          </div>
        </div>
      )}

      {status === 'playing' && (
        <div className="flex flex-col items-center space-y-12 animate-in slide-in-from-bottom-8 duration-500">
          <div className="w-full py-20 px-4 bg-white rounded-[4rem] shadow-2xl border-b-8 border-slate-100 flex flex-wrap justify-center gap-4 min-h-[300px] items-center">
            {currentWord.split('').map((letter, idx) => {
              const isRevealed = revealedIndices.includes(idx);
              return (
                <motion.div
                  key={`${currentWord}-${idx}`}
                  initial={false}
                  animate={{
                    scale: isRevealed ? [1, 1.2, 1] : 1,
                    rotateY: isRevealed ? 0 : 180,
                    backgroundColor: isRevealed ? '#f43f5e' : '#f1f5f9'
                  }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  className="w-16 h-20 sm:w-24 sm:h-32 rounded-2xl sm:rounded-3xl flex items-center justify-center text-4xl sm:text-7xl font-black text-white shadow-xl perspective-1000"
                  style={{ transformStyle: 'preserve-3d' }}
                >
                  <div className={isRevealed ? 'block' : 'hidden'}>
                    {letter.toUpperCase()}
                  </div>
                  {!isRevealed && (
                    <div className="text-slate-300">?</div>
                  )}
                </motion.div>
              );
            })}
          </div>

          <div className="bg-slate-900 p-8 rounded-[3rem] shadow-2xl flex flex-col md:flex-row items-center gap-6 w-full max-w-4xl text-white">
            <div className="flex-1 flex flex-col items-center md:items-start gap-2">
              <span className="text-xs font-bold opacity-50 uppercase tracking-widest">Auto-Reveal Speed</span>
              <div className="flex items-center gap-4 w-full">
                <input 
                  type="range" 
                  min="500" 
                  max="3000" 
                  step="500"
                  value={revealSpeed}
                  onChange={(e) => setRevealSpeed(Number(e.target.value))}
                  className="w-full accent-secondary h-2 bg-white/10 rounded-lg appearance-none cursor-pointer"
                />
                <span className="font-mono text-sm w-12">{(revealSpeed / 1000).toFixed(1)}s</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
               <button
                onClick={() => setIsAutoRevealing(!isAutoRevealing)}
                className={`p-6 rounded-full transition-all shadow-xl flex items-center gap-3 ${
                  isAutoRevealing ? 'bg-amber-500 hover:bg-amber-600' : 'bg-secondary hover:bg-secondary/90'
                }`}
              >
                {isAutoRevealing ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" />}
                <span className="font-black text-xl hidden sm:block">
                  {isAutoRevealing ? 'PAUSE' : 'AUTO'}
                </span>
              </button>

              <button
                onClick={revealOneLetter}
                disabled={revealedIndices.length === currentWord.length}
                className="p-6 bg-white/10 hover:bg-white/20 rounded-full transition-all border-2 border-white/10 flex items-center gap-3 disabled:opacity-30"
              >
                <Eye size={32} />
                <span className="font-black text-xl hidden sm:block">REVEAL</span>
              </button>

              <button
                onClick={() => startNextWord()}
                className="p-6 bg-white/10 hover:bg-white/20 rounded-full transition-all border-2 border-white/10 flex items-center gap-3"
              >
                <SkipForward size={32} />
                <span className="font-black text-xl hidden sm:block">NEXT</span>
              </button>
            </div>
            
            <button
              onClick={() => setStatus('setup')}
              className="p-6 bg-red-500/20 hover:bg-red-500/40 text-red-400 rounded-full transition-all border-2 border-red-500/20"
              title="Quit"
            >
              <RotateCcw size={32} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
