import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, ChevronRight, History, Trophy, ThumbsDown, Users, Sparkles, RotateCcw } from 'lucide-react';
import { WYR_QUESTIONS } from '../../data/wouldYouRather';
import { audioEngine } from '../../utils/audio';
import { useSettings } from '../../contexts/SettingsContext';

const YEAR_LEVELS = [
  { id: '1-3', label: 'Years 1 - 3', color: 'from-pink-400 to-rose-500', emoji: '🧸' },
  { id: '4-6', label: 'Years 4 - 6', color: 'from-orange-400 to-amber-500', emoji: '⚽' },
  { id: '7-9', label: 'Years 7 - 9', color: 'from-blue-400 to-indigo-500', emoji: '📚' },
  { id: '10-12', label: 'Years 10 - 12', color: 'from-purple-400 to-violet-500', emoji: '🎓' },
];

export const WouldYouRather = () => {
  const [view, setView] = useState('selection'); // selection, game
  const [yearLevel, setYearLevel] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [history, setHistory] = useState([]);
  const { settings } = useSettings();

  const questions = useMemo(() => {
    if (!yearLevel) return [];
    // Shuffle questions for each session
    return [...WYR_QUESTIONS[yearLevel]].sort(() => Math.random() - 0.5);
  }, [yearLevel]);

  const currentPair = questions[currentIndex];

  const handleSelect = (choiceIndex) => {
    const winner = currentPair[choiceIndex];
    const loser = currentPair[1 - choiceIndex];

    setHistory(prev => [{ winner, loser, id: Date.now() }, ...prev].slice(0, 5));
    
    audioEngine.playTick(settings.soundTheme);

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      // Loop or finish
      setCurrentIndex(0);
    }
  };

  const startLevel = (levelId) => {
    setYearLevel(levelId);
    setView('game');
    setCurrentIndex(0);
    setHistory([]);
    audioEngine.playTick(settings.soundTheme);
  };

  const resetGame = () => {
    setView('selection');
    setYearLevel(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 h-full flex flex-col gap-8">
      {/* Header */}
      <div className="bg-white p-8 rounded-[2.5rem] border-2 border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-3">
            <div className="p-3 bg-purple-50 rounded-2xl text-purple-600">
              <HelpCircle size={32} />
            </div>
            <h2 className="text-4xl font-black text-slate-800 tracking-tight">Would You Rather?</h2>
          </div>
          <p className="text-slate-400 font-medium pl-1">The ultimate classroom icebreaker and debate game.</p>
        </div>

        {view === 'game' && (
          <button
            onClick={resetGame}
            className="flex items-center gap-2 px-6 py-3 bg-slate-100 text-slate-600 rounded-2xl font-black hover:bg-slate-200 transition-all active:scale-95"
          >
            <RotateCcw size={20} />
            CHANGE LEVEL
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {view === 'selection' ? (
          <motion.div
            key="selection"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex-1 flex flex-col items-center justify-center gap-8"
          >
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-black text-slate-400 uppercase tracking-widest">Select Year Level</h3>
              <p className="text-slate-500 font-medium">Questions will be tailored to the age group selected.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-5xl">
              {YEAR_LEVELS.map(level => (
                <button
                  key={level.id}
                  onClick={() => startLevel(level.id)}
                  className={`group relative p-8 rounded-[2.5rem] bg-gradient-to-br ${level.color} text-white shadow-xl hover:scale-105 transition-all active:scale-95 flex flex-col items-center gap-4 text-center`}
                >
                  <span className="text-6xl group-hover:animate-bounce transition-all">{level.emoji}</span>
                  <span className="text-2xl font-black tracking-tight">{level.label}</span>
                  <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity rounded-[2.5rem]" />
                </button>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="game"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8"
          >
            {/* History Sidebar */}
            <div className="lg:col-span-3 space-y-6">
              <div className="bg-white p-6 rounded-[2rem] border-2 border-slate-200 shadow-sm h-full flex flex-col gap-6">
                <div className="flex items-center gap-3 text-slate-400 font-black uppercase text-xs tracking-widest border-b-2 border-slate-50 pb-4">
                  <History size={16} />
                  Round History
                </div>
                
                <div className="flex-1 space-y-4 overflow-y-auto custom-scrollbar pr-2">
                  <AnimatePresence initial={false}>
                    {history.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-slate-200 text-center gap-4 py-12">
                        <Sparkles size={48} strokeWidth={1} />
                        <p className="text-sm font-bold uppercase tracking-widest">First to decide wins!</p>
                      </div>
                    ) : (
                      history.map((item, idx) => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className={`p-4 rounded-2xl border-2 ${idx === 0 ? 'bg-purple-50 border-purple-100 shadow-lg shadow-purple-50' : 'bg-slate-50 border-slate-100 opacity-60'}`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                              <Trophy size={14} />
                            </div>
                            <div className="flex-1">
                              <p className="text-xs font-black uppercase text-slate-400 mb-1">Winner</p>
                              <p className="text-sm font-bold text-slate-700 leading-tight">{item.winner}</p>
                            </div>
                          </div>
                          <div className="mt-3 pt-3 border-t border-slate-200/50 flex items-start gap-3">
                            <div className="p-2 bg-slate-200 text-slate-500 rounded-lg">
                              <ThumbsDown size={14} />
                            </div>
                            <div className="flex-1">
                              <p className="text-[10px] font-black uppercase text-slate-400 mb-0.5">Loser</p>
                              <p className="text-xs font-medium text-slate-400 leading-tight line-through opacity-70">{item.loser}</p>
                            </div>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Game Canvas */}
            <div className="lg:col-span-9 flex flex-col gap-8">
              <div className="text-center space-y-2">
                <span className="px-4 py-1.5 bg-purple-100 text-purple-600 rounded-full text-xs font-black uppercase tracking-widest">
                  {YEAR_LEVELS.find(l => l.id === yearLevel)?.label} • Round {currentIndex + 1}
                </span>
                <h3 className="text-4xl font-black text-slate-800 tracking-tight">Would You Rather...</h3>
              </div>

              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <AnimatePresence mode="wait">
                  <motion.button
                    key={`${currentIndex}-0`}
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.9, x: -100 }}
                    transition={{ type: 'spring', damping: 20 }}
                    onClick={() => handleSelect(0)}
                    className="group relative h-full min-h-[300px] p-10 bg-white border-4 border-slate-200 rounded-[3.5rem] shadow-2xl hover:border-purple-500 hover:scale-[1.02] transition-all flex flex-col items-center justify-center text-center gap-8 overflow-hidden active:scale-95"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-purple-50/50 group-hover:to-purple-100/50 transition-all" />
                    <div className="p-6 bg-purple-50 rounded-[2rem] text-purple-600 group-hover:scale-110 transition-transform relative z-10">
                      <Sparkles size={48} fill="currentColor" opacity={0.2} />
                    </div>
                    <p className="text-3xl font-black text-slate-800 leading-tight relative z-10 group-hover:text-purple-600 transition-colors">
                      {currentPair[0]}
                    </p>
                    <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                      <ChevronRight size={32} className="text-purple-400" />
                    </div>
                  </motion.button>

                  <motion.button
                    key={`${currentIndex}-1`}
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.9, x: 100 }}
                    transition={{ type: 'spring', damping: 20 }}
                    onClick={() => handleSelect(1)}
                    className="group relative h-full min-h-[300px] p-10 bg-white border-4 border-slate-200 rounded-[3.5rem] shadow-2xl hover:border-indigo-500 hover:scale-[1.02] transition-all flex flex-col items-center justify-center text-center gap-8 overflow-hidden active:scale-95"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-indigo-50/50 group-hover:to-indigo-100/50 transition-all" />
                    <div className="p-6 bg-indigo-50 rounded-[2rem] text-indigo-600 group-hover:scale-110 transition-transform relative z-10">
                      <Users size={48} fill="currentColor" opacity={0.2} />
                    </div>
                    <p className="text-3xl font-black text-slate-800 leading-tight relative z-10 group-hover:text-indigo-600 transition-colors">
                      {currentPair[1]}
                    </p>
                    <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                      <ChevronRight size={32} className="text-indigo-400" />
                    </div>
                  </motion.button>
                </AnimatePresence>
              </div>

              <div className="flex justify-center gap-2">
                {Array.from({ length: Math.min(questions.length, 10) }).map((_, i) => (
                  <div 
                    key={i} 
                    className={`h-1.5 rounded-full transition-all duration-500 ${i === currentIndex % 10 ? 'w-8 bg-purple-500' : 'w-2 bg-slate-200'}`}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
