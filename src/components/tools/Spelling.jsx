import React, { useState, useEffect, useRef } from 'react';
import { Volume2, Play, CheckCircle2, XCircle, RotateCcw, Plus, Trash2, BookOpen, ChevronRight, Pencil } from 'lucide-react';
import { audioEngine } from '../../utils/audio';
import { useSettings } from '../../contexts/SettingsContext';
import { ToolHeader } from '../ToolHeader';
import { speak } from '../../utils/speech';
import { shuffle } from '../../utils/random';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { DEFAULT_SPELLING_LISTS } from './Spelling/spellingData';

export const Spelling = () => {
  const { settings } = useSettings();
  const [status, setStatus] = useState('setup'); // 'setup', 'playing', 'finished'
  const [lists, setLists] = useLocalStorage('spelling_lists', DEFAULT_SPELLING_LISTS);
  
  const [selectedListId, setSelectedListId] = useState(lists[0]?.id || '');
  const [isAddingList, setIsAddingList] = useState(false);
  const [editingListId, setEditingListId] = useState(null);
  const [newListTitle, setNewListTitle] = useState('');
  const [wordsInput, setWordsInput] = useState('');
  
  const [queue, setQueue] = useState([]);
  const [currentWord, setCurrentWord] = useState('');
  const [userInput, setUserInput] = useState('');
  const [score, setScore] = useState(0);
  const [totalWords, setTotalWords] = useState(0);
  const [feedback, setFeedback] = useState(null); 
  
  const inputRef = useRef(null);


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

  const startGame = () => {
    const list = lists.find(l => l.id === selectedListId);
    if (!list || list.words.length === 0) return;

    const shuffled = shuffle(list.words);
    setQueue(shuffled);
    setCurrentWord(shuffled[0]);
    setTotalWords(shuffled.length);
    setScore(0);
    setFeedback(null);
    setStatus('playing');
    setUserInput('');
    
    setTimeout(() => {
      speak(`Please spell ${shuffled[0]}`);
      inputRef.current?.focus();
    }, 500);
  };

  const handleGuess = (e) => {
    e.preventDefault();
    if (!userInput.trim()) return;

    const isCorrect = userInput.trim().toLowerCase() === currentWord.toLowerCase();
    let newQueue = [...queue];
    
    if (isCorrect) {
      setScore(s => s + 1);
      setFeedback({ type: 'success', message: 'Correct!' });
      audioEngine.playTick(settings.soundTheme);
      speak('Correct!');
      newQueue.shift();
    } else {
      setFeedback({ 
        type: 'error', 
        message: `Incorrect. The correct spelling is: ${currentWord}` 
      });
      speak(`Incorrect. The correct spelling is ${currentWord.split('').join(' ')}`);
      newQueue.shift();
      newQueue.push(currentWord);
    }

    setQueue(newQueue);
    setUserInput('');

    if (newQueue.length === 0) {
      setTimeout(() => {
        setStatus('finished');
        speak(`Great job! You finished spelling all ${totalWords} words.`);
      }, 1500);
    } else {
      setCurrentWord(newQueue[0]);
      setTimeout(() => {
        speak(`Please spell ${newQueue[0]}`);
        inputRef.current?.focus();
      }, 2500);
    }
  };

  const repeatWord = () => {
    speak(`Please spell ${currentWord}`);
    inputRef.current?.focus();
  };

  return (
    <div className="w-full mx-auto px-4 pt-2 pb-8 h-full flex flex-col gap-8">
      <ToolHeader
        title="Spelling Practice"
        icon={BookOpen}
        description="Master Your Words through Listening and Typing"
        infoContent={
          <>
            <p>
              <strong className="text-white block mb-1">Listen and Spell</strong>
              Click the speaker icon to hear the word, then type the correct spelling. If you get it wrong, the word will be added back to the queue for extra practice.
            </p>
            <p>
              <strong className="text-white block mb-1">Custom Lists</strong>
              Use your own spelling lists or create new ones for each week. Your progress is saved as you go!
            </p>
          </>
        }
      >
        {status !== 'setup' && (
          <button
            onClick={() => setStatus('setup')}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-black text-[10px] uppercase tracking-wider hover:bg-slate-200 transition-all active:scale-95 shadow-sm"
          >
            <RotateCcw size={14} /> QUIT TEST
          </button>
        )}
      </ToolHeader>

      {status === 'setup' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-in fade-in zoom-in duration-300">
          {/* List Selection */}
          <div className="md:col-span-2 space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-700 flex items-center gap-2">
                <BookOpen className="text-primary" /> Select a List
              </h3>
              <button
                onClick={() => {
                  setIsAddingList(!isAddingList);
                  if (isAddingList) setEditingListId(null);
                  setNewListTitle('');
                  setWordsInput('');
                }}
                className="px-4 py-2 bg-primary/10 text-primary rounded-xl font-bold hover:bg-primary/20 transition-all flex items-center gap-2"
              >
                <Plus size={20} /> {isAddingList ? 'Back' : 'Create New'}
              </button>
            </div>

            {isAddingList ? (
              <div className="bg-white p-6 rounded-3xl shadow-xl border border-slate-100 space-y-4">
                <input
                  type="text"
                  placeholder="List Title (e.g., Week 1 Words)"
                  value={newListTitle}
                  onChange={(e) => setNewListTitle(e.target.value)}
                  className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none font-bold"
                />
                <textarea
                  placeholder="Enter words, one per line..."
                  value={wordsInput}
                  onChange={(e) => setWordsInput(e.target.value)}
                  className="w-full h-48 p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none font-mono resize-none"
                />
                <button
                  onClick={saveList}
                  disabled={!newListTitle.trim() || !wordsInput.trim()}
                  className="w-full py-4 bg-primary text-white rounded-2xl font-black text-xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
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
                        ? 'border-primary bg-primary/5' 
                        : 'border-white bg-white hover:border-slate-100 shadow-sm'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-xl ${
                        selectedListId === list.id ? 'bg-primary text-white' : 'bg-slate-100 text-slate-400'
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
                        className="p-2 text-slate-300 hover:text-primary transition-colors opacity-0 group-hover:opacity-100"
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
                      <ChevronRight className={selectedListId === list.id ? 'text-primary' : 'text-slate-200'} />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Start Actions */}
          <div className="bg-slate-900 p-8 rounded-[3rem] text-white flex flex-col justify-center items-center text-center space-y-6">
            <div className="bg-white/10 p-6 rounded-[2rem]">
              <Play size={48} className="text-primary fill-primary" />
            </div>
            <div>
              <h4 className="text-2xl font-black italic uppercase tracking-tighter">Ready?</h4>
              <p className="text-slate-400 font-medium">Test your spelling skills with your selected list.</p>
            </div>
            <button
              onClick={startGame}
              disabled={isAddingList}
              className="w-full py-5 bg-primary text-white rounded-2xl font-black text-2xl shadow-xl shadow-primary/30 hover:scale-[1.05] active:scale-95 transition-all disabled:opacity-50"
            >
              START
            </button>
          </div>
        </div>
      )}

      {status === 'playing' && (
        <div className="bg-white p-12 rounded-[3rem] shadow-2xl border border-slate-100 flex flex-col items-center justify-center space-y-10 min-h-[500px] animate-in slide-in-from-bottom-8 duration-500">
          <div className="flex justify-between w-full max-w-2xl px-4">
            <div className="bg-slate-100 px-6 py-2 rounded-full font-black text-slate-600 flex items-center gap-2">
              SCORE <span className="text-primary text-xl">{score}</span>
            </div>
            <div className="bg-slate-100 px-6 py-2 rounded-full font-black text-slate-600 flex items-center gap-2">
              REMAINING <span className="text-primary text-xl">{queue.length}</span>
            </div>
          </div>

          <div className="flex flex-col items-center space-y-8 w-full max-w-lg">
            <button
              onClick={repeatWord}
              className="group relative"
            >
              <div className="absolute inset-0 bg-primary rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity" />
              <div className="relative p-8 bg-primary text-white rounded-full shadow-2xl shadow-primary/40 hover:scale-110 active:scale-90 transition-all cursor-pointer">
                <Volume2 size={64} />
              </div>
            </button>
            <p className="text-slate-400 font-black uppercase tracking-widest text-sm">Click to hear the word</p>

            <form onSubmit={handleGuess} className="w-full space-y-6">
              <input
                ref={inputRef}
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                className="w-full text-center text-5xl font-black p-8 bg-slate-50 border-4 border-slate-100 rounded-[2.5rem] focus:ring-8 focus:ring-primary/10 focus:border-primary transition-all outline-none"
                placeholder="..."
                autoComplete="off"
                autoCorrect="off"
                spellCheck="false"
              />
              <button
                type="submit"
                disabled={!userInput.trim()}
                className="w-full py-6 bg-slate-900 text-white font-black text-2xl rounded-2xl hover:bg-black shadow-xl transition-all disabled:opacity-50"
              >
                CHECK SPELLING
              </button>
            </form>
          </div>

          {feedback && (
            <div className={`w-full max-w-xl p-6 rounded-[2rem] flex items-center gap-4 animate-in fade-in slide-in-from-bottom-4 ${
              feedback.type === 'success' ? 'bg-green-50 text-green-700 border-4 border-green-100' : 'bg-red-50 text-red-700 border-4 border-red-100'
            }`}>
              <div className={`p-3 rounded-2xl ${feedback.type === 'success' ? 'bg-green-500' : 'bg-red-500'} text-white`}>
                {feedback.type === 'success' ? <CheckCircle2 size={32} /> : <XCircle size={32} />}
              </div>
              <span className="font-black text-2xl tracking-tight">{feedback.message}</span>
            </div>
          )}
        </div>
      )}

      {status === 'finished' && (
        <div className="bg-slate-900 p-16 rounded-[4rem] shadow-2xl flex flex-col items-center justify-center space-y-10 min-h-[500px] animate-in zoom-in duration-500 text-white text-center">
          <div className="relative">
            <div className="absolute inset-0 bg-green-500 blur-3xl opacity-20" />
            <div className="relative w-32 h-32 bg-green-500 rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-green-500/40 rotate-12">
              <CheckCircle2 size={64} />
            </div>
          </div>
          <div className="space-y-4">
            <h3 className="text-5xl font-black italic uppercase tracking-tighter">Perfect!</h3>
            <p className="text-slate-400 text-xl font-medium">You've mastered all <span className="text-white font-black underline decoration-primary decoration-4 underline-offset-4">{totalWords} words</span> in this list.</p>
          </div>
          <button
            onClick={() => setStatus('setup')}
            className="flex items-center gap-4 px-12 py-6 bg-primary text-white rounded-3xl hover:scale-105 active:scale-95 transition-all font-black text-2xl shadow-xl shadow-primary/20"
          >
            <RotateCcw size={32} /> PLAY AGAIN
          </button>
        </div>
      )}
    </div>
  );
};
