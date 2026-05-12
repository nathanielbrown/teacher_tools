import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  HelpCircle, ChevronRight, History, Trophy, Sparkles, RotateCcw,
  Volume2
} from 'lucide-react';
import { WYR_QUESTIONS } from '../../data/wouldYouRather';
import { audioEngine } from '../../utils/audio';
import { useSettings } from '../../contexts/SettingsContext';
import { useHeader } from '../../contexts/HeaderContext';
import { ToolPanel } from '../shared/ToolPanel';
import HistoryPanel from '../shared/HistoryPanel';
import { FormattedMessage, useIntl } from 'react-intl';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { downloadCSV } from '../../utils/export';


// 1. Constants
const YEAR_LEVELS = [
  { id: '1-3', label: 'Years 1 - 3', color: 'from-pink-400 to-rose-500', emoji: '🧸' },
  { id: '4-6', label: 'Years 4 - 6', color: 'from-orange-400 to-amber-500', emoji: '⚽' },
  { id: '7-9', label: 'Years 7 - 9', color: 'from-blue-400 to-indigo-500', emoji: '📚' },
  { id: '10-12', label: 'Years 10 - 12', color: 'from-purple-400 to-violet-500', emoji: '🎓' },
];

// 2. Config (None)

// 3. Text (Help and Info)
const HelpContent = () => (
  <div className="space-y-4 font-['Outfit']">
    <div className="space-y-3 italic">
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center text-xs font-black text-indigo-600 shrink-0">1</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">
          <FormattedMessage id="wyr.help.step1" defaultMessage="Choose your year level to get started." />
        </p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center text-xs font-black text-indigo-600 shrink-0">2</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">
          <FormattedMessage id="wyr.help.step2" defaultMessage="Choose between two different options." />
        </p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center text-xs font-black text-indigo-600 shrink-0">3</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">
          <FormattedMessage id="wyr.help.step3" defaultMessage="Discuss your choices with the class!" />
        </p>
      </div>
    </div>
  </div>
);

// 4. Local Storage (None)

// 5. Classes (None)

// 6. Functions (None)

// 7. Component
export const WouldYouRather = () => {
  const intl = useIntl();
  const { setHeaderActions, setHelpContent, setOnReset, clearHeader } = useHeader();
  const { settings } = useSettings();
  
  const [view, setView] = useState<'selection' | 'game'>('selection');
  const [yearLevel, setYearLevel] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [history, setHistory] = useLocalStorage<any[]>('would_you_rather_history', []);
  const [questions, setQuestions] = useState<any[]>([]);

  const resetGame = useCallback(() => {
    setView('selection');
    setYearLevel(null);
    audioEngine.playTick(settings.soundTheme);
  }, [settings.soundTheme]);

  useEffect(() => {
    setOnReset(() => () => {
      resetGame();
    });
    setHelpContent(<HelpContent />);
    return () => clearHeader();
  }, [clearHeader, setOnReset, resetGame, setHelpContent, setHistory]);

  const handleSelect = (choiceIndex: number) => {
    const currentPair = questions[currentIndex];
    const winner = currentPair[choiceIndex];

    setHistory(prev => [{ winner, id: Date.now() }, ...prev].slice(0, 50));
    audioEngine.playTick(settings.soundTheme);

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setCurrentIndex(0);
    }
  };

  const exportHistory = () => {
    const data = history.map((h, i) => ({
      Index: history.length - i,
      Choice: h.winner,
      Timestamp: new Date(h.id).toLocaleString()
    }));
    downloadCSV(data, 'would_you_rather_history.csv');
  };

  const startLevel = (levelId: string) => {
    const shuffled = [...WYR_QUESTIONS[levelId as keyof typeof WYR_QUESTIONS]].sort(() => Math.random() - 0.5);
    setQuestions(shuffled);
    setYearLevel(levelId);
    setView('game');
    setCurrentIndex(0);
    audioEngine.playTick(settings.soundTheme);
  };

  useEffect(() => {
    if (view === 'game') {
      setHeaderActions(
        <div className="flex items-center gap-4 italic">

          <div className="flex bg-white p-1.5 rounded-2xl border-2 border-slate-50">
             <div className="px-6 py-2 flex flex-col items-end leading-none">
                <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Level</span>
                <span className="text-[11px] font-black text-indigo-600 uppercase tracking-widest mt-1">
                   <FormattedMessage id={`wyr.level.${yearLevel}`} defaultMessage={YEAR_LEVELS.find(l => l.id === yearLevel)?.label} />
                </span>
             </div>
             <div className="w-px h-8 bg-slate-50 self-center" />
             <div className="px-6 py-2 flex flex-col items-start leading-none">
                <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Question</span>
                <span className="text-[11px] font-black text-slate-800 uppercase tracking-widest mt-1 tabular-nums">
                  {currentIndex + 1}
                </span>
             </div>
          </div>
        </div>
      );
    } else {
      setHeaderActions(null);
    }
  }, [view, currentIndex, yearLevel, setHeaderActions, resetGame]);

  const currentPair = questions[currentIndex];

  return (
    <ToolPanel className="italic" baseWidth={1200} baseHeight={800}>
      <div className="flex flex-col lg:flex-row gap-8 h-full w-full overflow-hidden relative z-10">

      <AnimatePresence>
        {view === 'game' && (
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            className="w-full lg:flex-[1] flex flex-col h-full gap-8 italic overflow-hidden shrink-0"
          >
            <HistoryPanel 
              items={history.map(h => ({ 
                id: h.id, 
                content: h.winner
              }))}
              onClear={() => setHistory([])}
              onDownload={exportHistory}
              title={intl.formatMessage({ id: 'wyr.history.title', defaultMessage: 'History' })}
              emptyMessage={intl.formatMessage({ id: 'wyr.history.empty', defaultMessage: 'No choices yet...' })}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {view === 'selection' ? (
          <motion.div 
            key="selection"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="flex-1 flex flex-col items-center justify-center gap-12 relative z-10 w-full"
          >
            <div className="text-center space-y-4">
              <h2 className="text-6xl font-black text-slate-900 uppercase tracking-tighter leading-none italic">
                <FormattedMessage id="wyr.title" defaultMessage="Would You Rather" />
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-5xl">
              {YEAR_LEVELS.map(level => (
                <button
                  key={level.id}
                  onClick={() => startLevel(level.id)}
                  className={`group relative p-10 rounded-[3rem] bg-gradient-to-br ${level.color} text-white hover:scale-105 transition-all active:scale-95 flex flex-col items-center gap-6 text-center border-4 border-white/20`}
                >
                  <span className="text-6xl group-hover:animate-bounce transition-all">{level.emoji}</span>
                  <span className="text-xl font-black tracking-tight uppercase">
                    <FormattedMessage id={`wyr.level.${level.id}`} defaultMessage={level.label} />
                  </span>
                </button>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="game"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-[3] flex flex-col gap-8 relative z-10 min-h-0"
          >
            {/* Main Stage */}
            <div className="flex-1 flex flex-col gap-8 bg-white p-10 rounded-[3.5rem] border-4 border-slate-50 relative overflow-hidden group">
               <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-8 items-stretch relative z-10">
                <AnimatePresence mode="wait">
                  <motion.button
                    key={`${currentIndex}-0`}
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.9, x: -50 }}
                    onClick={() => handleSelect(0)}
                    className="group relative p-12 bg-slate-50 border-8 border-white rounded-[5rem] hover:border-indigo-600 hover:scale-[1.02] transition-all flex flex-col items-center justify-center text-center gap-10 overflow-hidden active:scale-95"
                  >
                    <div className="w-32 h-32 bg-white rounded-[3rem] flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                      <Sparkles size={64} strokeWidth={1.5} fill="currentColor" className="opacity-20" />
                    </div>
                    <p className="text-4xl font-black text-slate-800 leading-tight group-hover:text-indigo-600 transition-colors uppercase italic tracking-tighter">
                      {currentPair ? currentPair[0] : ""}
                    </p>
                    <div className="absolute bottom-12 right-12 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                      <ChevronRight size={64} className="text-indigo-400" />
                    </div>
                  </motion.button>

                  <motion.button
                    key={`${currentIndex}-1`}
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.9, x: 50 }}
                    onClick={() => handleSelect(1)}
                    className="group relative p-12 bg-slate-50 border-8 border-white rounded-[5rem] hover:border-rose-500 hover:scale-[1.02] transition-all flex flex-col items-center justify-center text-center gap-10 overflow-hidden active:scale-95"
                  >
                    <div className="w-32 h-32 bg-white rounded-[3rem] flex items-center justify-center text-rose-600 group-hover:bg-rose-500 group-hover:text-white transition-all">
                      <Sparkles size={64} strokeWidth={1.5} fill="currentColor" className="opacity-20" />
                    </div>
                    <p className="text-4xl font-black text-slate-800 leading-tight group-hover:text-rose-600 transition-colors uppercase italic tracking-tighter">
                      {currentPair ? currentPair[1] : ""}
                    </p>
                    <div className="absolute bottom-12 right-12 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                      <ChevronRight size={64} className="text-rose-400" />
                    </div>
                  </motion.button>
                </AnimatePresence>
               </div>

               {/* Progress Indicator */}
               <div className="flex justify-center gap-3 pb-2">
                {Array.from({ length: Math.min(questions.length, 10) }).map((_, i) => (
                  <div 
                    key={i} 
                    className={`h-3 rounded-full transition-all duration-700 border-2 border-white ${i === currentIndex % 10 ? 'w-16 bg-indigo-600' : 'w-4 bg-slate-100'}`}
                  />
                ))}
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>


      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-50 rounded-full blur-[150px] opacity-40 -z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-rose-50 rounded-full blur-[150px] opacity-40 -z-10 pointer-events-none" />
      </div>
    </ToolPanel>
  );
};

export default WouldYouRather;
