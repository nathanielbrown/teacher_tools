import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Grid,
  X,
  History,
  GraduationCap,
  RotateCcw,
  Calculator,
  Volume2,
  MousePointer2,
  Target,
  Flame,
  CheckCircle2
} from 'lucide-react';
import { ToolPanel } from '../shared/ToolPanel';
import { useHeader } from '../../contexts/HeaderContext';
import { useSettings } from '../../contexts/SettingsContext';
import { audioEngine } from '../../utils/audio';
import { storage } from '../../utils/storage';

// 1. Constants
const YEAR_LEVELS = {
  'Early Years': [2, 5, 10],
  'Primary': [2, 3, 4, 5, 8, 10],
  'Secondary': [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  'All': [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
};

// 2. Config (None)

// 3. Text (Help and Info)
const HELP_INFO = (
  <div className="space-y-4 font-['Outfit']">
    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">How to Play</h3>
    <div className="space-y-3">
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center text-xs font-black text-indigo-600 shrink-0">1</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">Pick the <b>Tables</b> you want to practice.</p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center text-xs font-black text-blue-600 shrink-0">2</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">Type your answer and press <b>Enter</b>.</p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-emerald-50 flex items-center justify-center text-xs font-black text-emerald-600 shrink-0">3</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">The <b>Grid</b> shows how well you know each answer.</p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-rose-50 flex items-center justify-center text-xs font-black text-rose-600 shrink-0">4</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">Try to get all the boxes to turn <b>Dark Green</b>!</p>
      </div>
    </div>
  </div>
);

// 4. Local Storage (Handled in component)

// 5. Classes (None)

// 6. Functions
interface Question {
  a: number;
  b: number;
  row: number;
  col: number;
  key: string;
}

const pickQuestion = (rowsToConsider: number[], states: Record<string, string>): Question | null => {
  if (rowsToConsider.length === 0) return null;

  const candidates: { row: number; col: number; key: string }[] = [];
  rowsToConsider.forEach(row => {
    for (let col = 1; col <= 12; col++) {
      const key = `${row}x${col}`;
      const state = states[key] || 'white';
      let weight = 0;
      
      if (state === 'orange') weight = 5;
      else if (state === 'white') weight = 3;
      else if (state === 'light-green') weight = 2;
      else if (state === 'dark-green') weight = 1;
      
      for (let w = 0; w < weight; w++) {
        candidates.push({ row, col, key });
      }
    }
  });

  if (candidates.length > 0) {
    const selected = candidates[Math.floor(Math.random() * candidates.length)];
    if (Math.random() > 0.5) {
      return { a: selected.row, b: selected.col, ...selected };
    } else {
      return { a: selected.col, b: selected.row, ...selected };
    }
  }
  return null;
};

const getCellColor = (state: string | undefined) => {
  if (state === 'white' || !state) return 'bg-white border-slate-100 ';
  if (state === 'orange') return 'bg-orange-500 border-orange-400 -[0_0_15px_rgba(249,115,22,0.4)]';
  if (state === 'light-green') return 'bg-emerald-400 border-emerald-300 -[0_0_15px_rgba(16,185,129,0.4)]';
  if (state === 'dark-green') return 'bg-emerald-700 border-emerald-600 -[0_0_15px_rgba(4,120,87,0.6)]';
  return 'bg-white border-slate-100';
};

// 7. Component
export const TimesTable = () => {
  const { setHeaderActions, setHelpContent, setOnReset, clearHeader } = useHeader();
  const { settings } = useSettings();

  const [selectedRows, setSelectedRows] = useState<number[]>([2, 3, 4, 5, 10]);
  const [cellStates, setCellStates] = useState<Record<string, string>>(() => {
    const saved = storage.getItem('teacherToolsTimesTableMastery');
    return saved ? JSON.parse(saved) : {};
  });
  const [sessionCount, setSessionCount] = useState(1);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(() => {
    const saved = storage.getItem('teacherToolsTimesTableMastery');
    const states = saved ? JSON.parse(saved) : {};
    return pickQuestion([2, 3, 4, 5, 10], states);
  });
  const [userInput, setUserInput] = useState('');
  const [showMastery, setShowMastery] = useState(false);
  const [yearLevel, setYearLevel] = useState('All');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string; timestamp: number } | null>(null);
  
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    storage.setItem('teacherToolsTimesTableMastery', JSON.stringify(cellStates));
  }, [cellStates]);

  const resetRegistry = useCallback(() => {
    setCellStates({});
    setSessionCount(1);
    setFeedback(null);
    audioEngine.playTick(settings.soundTheme);
  }, [settings.soundTheme]);

  useEffect(() => {
    setOnReset(() => resetRegistry);
    setHelpContent(HELP_INFO);
    return () => clearHeader();
  }, [clearHeader, setOnReset, resetRegistry, setHelpContent]);

  useEffect(() => {
    setHeaderActions(
      <div className="flex items-center gap-4 italic">
         <button
            onClick={() => { setShowMastery(prev => !prev); audioEngine.playTick(settings.soundTheme); }}
            className={`flex items-center gap-2 px-8 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 italic ${
              showMastery 
                ? 'bg-slate-900 text-white ' 
                : 'bg-white text-slate-400 border-2 border-slate-100 hover:border-indigo-100 hover:text-indigo-600'
            }`}
         >
            {showMastery ? <><X size={14} strokeWidth={3} /> Hide Grid</> : <><Grid size={14} strokeWidth={3} /> Show Grid</>}
         </button>
         <button
            onClick={resetRegistry}
            className="flex items-center gap-2 px-6 py-2 bg-white border-2 border-slate-100 text-slate-300 rounded-xl font-black text-[10px] uppercase tracking-widest hover:border-rose-100 hover:text-rose-600 transition-all active:scale-95 "
         >
            <RotateCcw size={14} strokeWidth={3} /> Clear
         </button>
      </div>
    );
  }, [showMastery, resetRegistry, settings.soundTheme, setHeaderActions]);

  const toggleRow = (num: number) => {
    let newRows;
    if (selectedRows.includes(num)) {
      newRows = selectedRows.filter(n => n !== num);
    } else {
      newRows = [...selectedRows, num].sort((a, b) => a - b);
    }
    setSelectedRows(newRows);
    audioEngine.playTick(settings.soundTheme);
    
    if (currentQuestion && !newRows.includes(currentQuestion.row)) {
      setCurrentQuestion(pickQuestion(newRows, cellStates));
      setFeedback(null);
    } else if (!currentQuestion && newRows.length > 0) {
      setCurrentQuestion(pickQuestion(newRows, cellStates));
    }
    
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const applyYearLevel = (level: string) => {
    const rows = YEAR_LEVELS[level as keyof typeof YEAR_LEVELS];
    setSelectedRows(rows);
    setYearLevel(level);
    audioEngine.playTick(settings.soundTheme);
    setCurrentQuestion(pickQuestion(rows, cellStates));
    setFeedback(null);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || !currentQuestion) return;

    const answer = parseInt(userInput, 10);
    const correctAnswer = currentQuestion.a * currentQuestion.b;
    const key = currentQuestion.key;
    const currentState = cellStates[key] || 'white';
    
    let newState = currentState;

    if (answer === correctAnswer) {
      audioEngine.playTick(settings.soundTheme);
      setFeedback({ type: 'success', msg: 'Corect!', timestamp: sessionCount });
      
      if (currentState === 'white' || currentState === 'orange') newState = 'light-green';
      else if (currentState === 'light-green') newState = 'dark-green';
      else if (currentState === 'dark-green') newState = 'dark-green';
      
    } else {
      audioEngine.playTick(settings.soundTheme);
      setFeedback({ 
        type: 'error', 
        msg: `${currentQuestion.a} × ${currentQuestion.b} = ${correctAnswer}`, 
        timestamp: sessionCount 
      });
      newState = 'orange';
    }

    const nextCellStates = { ...cellStates, [key]: newState };
    setCellStates(nextCellStates);
    setSessionCount(prev => prev + 1);
    setUserInput('');
    setCurrentQuestion(pickQuestion(selectedRows, nextCellStates));
    
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const gridNumbers = Array.from({ length: 12 }, (_, i) => i + 1);
  return (
    <ToolPanel className="flex-row gap-8 p-4 lg:p-12 italic">
      {/* Primary Mathematical Stage */}
      <div className="flex-1 bg-slate-50/50 rounded-[4rem] border-4 border-white  flex flex-col items-center justify-center relative overflow-hidden group">
        <div className="tool-grid-bg opacity-20 pointer-events-none" />
        
        <div className="w-full max-w-4xl flex flex-col items-center relative z-10 px-12">
          {!currentQuestion || selectedRows.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-12 py-20"
            >
              <div className="relative group">
                <div className="absolute inset-0 bg-indigo-600 rounded-[3rem] blur-[80px] opacity-20" />
                <div className="relative w-40 h-40 rounded-[3.5rem] bg-slate-900 flex items-center justify-center text-indigo-400 mx-auto border-8 border-slate-800  rotate-3">
                  <Calculator size={80} strokeWidth={1.5} />
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="text-5xl font-black text-slate-900 tracking-tighter uppercase leading-none">Pick your tables</h3>
                <button 
                  onClick={() => setShowMastery(true)}
                  className="mt-12 h-20 px-12 bg-indigo-600 text-white rounded-[2.5rem] font-black uppercase tracking-[0.2em] text-lg  hover:bg-slate-900 transition-all flex items-center justify-center gap-4 mx-auto active:scale-95 border-8 border-white"
                >
                  <Grid size={24} strokeWidth={3} /> Choose Tables
                </button>
              </div>
            </motion.div>
          ) : (
            <div className="w-full flex flex-col items-center gap-16 scale-110">
              {/* Equation Display */}
              <div className="text-center w-full">
                <motion.div
                  key={`${currentQuestion.a}-${currentQuestion.b}`}
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  className="text-[14rem] leading-none font-black text-slate-900 tracking-tighter tabular-nums  flex items-center justify-center gap-12 italic"
                >
                  <span className="-[0_20px_40px_rgba(0,0,0,0.1)]">{currentQuestion.a}</span>
                  <span className="text-indigo-600 text-[10rem] animate-pulse">×</span>
                  <span className="-[0_20px_40px_rgba(0,0,0,0.1)]">{currentQuestion.b}</span>
                </motion.div>

                {/* Input Core */}
                <form onSubmit={handleSubmit} className="w-full max-w-xl mx-auto mt-12 relative group">
                  <div className="absolute -inset-4 bg-indigo-500/10 blur-[80px] opacity-0 group-focus-within:opacity-100 transition-opacity" />
                  <input
                    ref={inputRef}
                    type="number"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    className="w-full text-center text-[10rem] font-black p-12 bg-white border-8 border-slate-50 rounded-[4rem] focus:ring-[40px] focus:ring-indigo-500/10 focus:border-indigo-600 transition-all tabular-nums  placeholder:text-slate-100 outline-none h-64 flex items-center justify-center leading-none italic"
                    placeholder="?"
                    autoFocus
                  />
                  <button type="submit" className="hidden">Submit</button>
                </form>
              </div>

              {/* Status Feedback */}
              <div className="h-40 w-full flex items-center justify-center relative">
                <AnimatePresence mode="wait">
                  {feedback && (
                    <motion.div 
                      key={`${feedback.msg}-${feedback.timestamp}`}
                      initial={{ opacity: 0, y: 30, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 1.1, transition: { duration: 0.2 } }}
                      className={`px-16 py-8 rounded-[3.5rem] flex items-center gap-8  border-8 italic ${
                        feedback.type === 'success' 
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                          : 'bg-rose-50 text-rose-600 border-rose-100'
                      }`}
                    >
                      <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center ${feedback.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                        {feedback.type === 'success' ? <CheckCircle2 size={32} strokeWidth={3} /> : <X size={32} strokeWidth={3} />}
                      </div>
                      <span className="font-black text-5xl tracking-tighter uppercase leading-none">
                        {feedback.msg}
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Synthesis Control Sidebar */}
      <div className="w-full lg:w-[450px] shrink-0 flex flex-col gap-8 relative z-20 italic">
        
        {/* Sector Calibration Registry */}
        <div className="bg-slate-900 p-12 rounded-[4rem] border-4 border-slate-800  flex flex-col items-center gap-10 relative overflow-hidden shrink-0">
           <div className="tool-grid-bg-dark opacity-10 pointer-events-none" />
           
           <div className="flex items-center justify-between w-full relative z-10">
              <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.5em]">Age</span>
           </div>

           <div className="relative z-10 w-full">
              <div className="flex flex-wrap items-center justify-center gap-3">
                {Object.keys(YEAR_LEVELS).map((level) => (
                  <button
                    key={level}
                    onClick={() => applyYearLevel(level)}
                    className={`h-16 px-6 rounded-[1.5rem] border-4 flex items-center gap-3 font-black text-[10px] uppercase tracking-widest transition-all ${
                      yearLevel === level
                        ? 'bg-indigo-600 border-indigo-400 text-white  scale-110'
                        : 'bg-white/5 border-white/5 text-slate-500 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <GraduationCap size={16} strokeWidth={3} />
                    {level}
                  </button>
                ))}
              </div>
           </div>
        </div>

        {/* Registry & Progress Module */}
        <div className="flex-1 bg-slate-50/50 p-10 rounded-[4rem] border-4 border-white  flex flex-col gap-8 min-h-0">
           <div className="flex items-center gap-4 shrink-0 border-b-4 border-white pb-6">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white ">
                 <History size={24} strokeWidth={3} />
              </div>
              <h4 className="text-xl font-black text-slate-900 uppercase tracking-tight leading-none">Stats</h4>
           </div>

           <div className="flex-1 flex flex-col gap-8 overflow-y-auto no-scrollbar pr-2 pb-4">
              <div className="bg-white p-8 rounded-[3rem] border-4 border-white  space-y-6">
                 <div className="flex justify-between items-end px-2">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                          <Flame size={18} strokeWidth={3} />
                       </div>
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Question</span>
                    </div>
                    <span className="text-4xl font-black text-slate-900 tabular-nums italic tracking-tighter">#{sessionCount}</span>
                 </div>
                 <div className="h-6 bg-slate-50 rounded-full p-1 border-2 border-slate-50 relative overflow-hidden">
                    <motion.div 
                      className="h-full bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full "
                      initial={false}
                      animate={{ width: `${(sessionCount % 100)}%` }}
                    />
                 </div>
              </div>

              <div className="bg-white p-10 rounded-[3.5rem] border-4 border-white  flex flex-col gap-8">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                       <Target size={18} strokeWidth={3} />
                    </div>
                    <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Grid Legend</span>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    {[
                       { label: 'None', color: 'bg-slate-100' },
                       { label: 'Practice', color: 'bg-orange-500' },
                       { label: 'Good', color: 'bg-emerald-400' },
                       { label: 'Great', color: 'bg-emerald-700' }
                    ].map((item, i) => (
                       <div key={i} className="flex items-center gap-3 px-4 py-3 bg-slate-50 rounded-2xl">
                          <div className={`w-4 h-4 rounded-lg  ${item.color}`} />
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{item.label}</span>
                       </div>
                    ))}
                 </div>
              </div>
           </div>

           <div className="p-8 bg-indigo-600 rounded-[3.5rem] text-white space-y-6  relative overflow-hidden shrink-0 mt-auto">
              <div className="tool-grid-bg opacity-10 pointer-events-none" />
              <div className="flex items-center gap-4 relative z-10">
                 <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white border border-white/20">
                    <Volume2 size={20} strokeWidth={3} />
                 </div>
                 <h4 className="text-[10px] font-black uppercase tracking-[0.3em]">Status</h4>
              </div>
              <p className="text-xs font-black leading-relaxed italic text-indigo-100 uppercase tracking-widest relative z-10">
                Practice your times tables. <br/>
                You can do it!
              </p>
           </div>
        </div>
      </div>

      {/* Mastery Grid Slide-over Overlay */}
      <AnimatePresence>
        {showMastery && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMastery(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-2xl z-[100]"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-full max-w-2xl bg-white -[-40px_0_100px_rgba(0,0,0,0.3)] z-[101] flex flex-col p-16 italic border-l-8 border-indigo-100"
            >
              <div className="flex items-center justify-between mb-16">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 rounded-[1.5rem] bg-indigo-600 text-white flex items-center justify-center ">
                    <Grid size={32} strokeWidth={3} />
                  </div>
                  <div className="flex flex-col">
                    <h4 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none italic">Times Table Grid</h4>
                  </div>
                </div>
                <button 
                  onClick={() => setShowMastery(false)}
                  className="w-16 h-16 rounded-[1.5rem] bg-slate-50 hover:bg-rose-50 flex items-center justify-center text-slate-400 hover:text-rose-600 transition-all "
                >
                  <X size={32} strokeWidth={3} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto no-scrollbar pr-4 pb-12">
                <div className="space-y-2 w-fit mx-auto">
                  {/* Grid Header */}
                  <div className="flex gap-2 items-center mb-4">
                    <div className="w-10 h-8 flex-shrink-0" />
                    {gridNumbers.map(col => (
                      <div key={col} className="w-8 h-8 flex items-center justify-center font-black text-slate-300 text-xs tabular-nums opacity-60">
                        {col}
                      </div>
                    ))}
                  </div>

                  {gridNumbers.map(row => {
                    const isSelected = selectedRows.includes(row);
                    return (
                      <div key={row} className="flex gap-2 items-center">
                        <button
                          onClick={() => toggleRow(row)}
                          className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs transition-all border-4 italic ${
                            isSelected 
                              ? 'bg-slate-900 text-white border-indigo-600  scale-110 z-10'
                              : 'bg-slate-50 text-slate-400 border-white hover:bg-indigo-50'
                          }`}
                        >
                          {row}
                        </button>
                        {gridNumbers.map(col => {
                          const state = cellStates[`${row}x${col}`];
                          return (
                            <div 
                              key={`${row}x${col}`} 
                              className={`w-8 h-8 rounded-lg border-2 transition-all duration-700  ${getCellColor(state)}`}
                            />
                          )
                        })}
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="mt-12 pt-12 border-t-4 border-slate-50 flex flex-col gap-8">
                 <div className="bg-slate-50 p-8 rounded-[3rem] border-4 border-white ">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-6 text-center italic">Legend</p>
                    <div className="grid grid-cols-2 gap-6">
                      {[
                         { label: 'None', color: 'bg-white border-slate-200' },
                         { label: 'Practice', color: 'bg-orange-500' },
                         { label: 'Good', color: 'bg-emerald-400' },
                         { label: 'Great', color: 'bg-emerald-700' }
                      ].map((item, i) => (
                         <div key={i} className="flex items-center gap-4 bg-white/50 px-6 py-3 rounded-2xl border-2 border-white">
                            <div className={`w-5 h-5 rounded-lg  ${item.color}`} />
                            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{item.label}</span>
                         </div>
                      ))}
                    </div>
                 </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </ToolPanel>
  );
};

export default TimesTable;
