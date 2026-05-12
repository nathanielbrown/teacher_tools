import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Grid,
  X,
  History,
  Calculator,
  Volume2,
  MousePointer2,
  Target,
  Flame,
  CheckCircle2,
  HelpCircle,
  Trophy
} from 'lucide-react';
import { ToolPanel } from '../shared/ToolPanel';
import { useHeader } from '../../contexts/HeaderContext';
import { useSettings } from '../../contexts/SettingsContext';
import { audioEngine } from '../../utils/audio';
import { useLocalStorage } from '../../hooks/useLocalStorage';

// 1. Constants (None)

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
  if (state === 'white' || !state) return 'bg-white border-slate-100';
  if (state === 'orange') return 'bg-orange-500 border-orange-400';
  if (state === 'light-green') return 'bg-emerald-500 border-emerald-400';
  if (state === 'dark-green') return 'bg-emerald-700 border-emerald-600';
  return 'bg-white border-slate-100';
};

// 7. Component
export const TimesTable = () => {
  const { setHeaderActions, setHelpContent, setOnReset, clearHeader } = useHeader();
  const { settings } = useSettings();

  const [selectedRows, setSelectedRows] = useState<number[]>([2, 3, 4, 5, 10]);
  const [cellStates, setCellStates] = useLocalStorage<Record<string, string>>('times_table_mastery', {});
  const [sessionCount, setSessionCount] = useState(1);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(() => {
    const saved = localStorage.getItem('times_table_mastery');
    const states = saved ? JSON.parse(saved) : {};
    return pickQuestion([2, 3, 4, 5, 10], states);
  });
  const [userInput, setUserInput] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string; timestamp: number } | null>(null);
  
  const inputRef = useRef<HTMLInputElement>(null);

  // Persistence handled by useLocalStorage

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
    setHeaderActions(null);
  }, [setHeaderActions]);

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
    <ToolPanel className="flex-col gap-6 p-6 lg:p-10" baseWidth={1400} baseHeight={900}>
      <div className="w-full flex flex-col lg:flex-row gap-8 items-stretch justify-center">
        {/* Left Column: Question Area */}
        <div className="flex-1 bg-white rounded-[3rem] border-4 border-slate-100 flex flex-col items-center justify-center p-12 relative overflow-hidden">
          <div className="flex flex-col items-center mb-8 shrink-0">
             <h4 className="text-[14px] font-black text-slate-300 uppercase tracking-[0.3em] mb-4">Question</h4>
          </div>
          <div className="w-full max-w-2xl flex-1 flex flex-col items-center justify-center">
            {!currentQuestion || selectedRows.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-8"
              >
                <div className="w-32 h-32 rounded-[2.5rem] bg-indigo-50 flex items-center justify-center text-indigo-600 mx-auto border-4 border-indigo-100">
                  <Grid size={64} strokeWidth={1.5} />
                </div>
                <div className="space-y-4">
                  <h3 className="text-4xl font-black text-slate-900 tracking-tight uppercase">Pick your tables</h3>
                  <p className="text-slate-500 font-medium">Select some numbers on the grid to start!</p>
                </div>
              </motion.div>
            ) : (
              <div className="w-full flex flex-col items-center gap-12">
                <motion.div
                  key={`${currentQuestion.a}-${currentQuestion.b}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-9xl font-black text-slate-900 tracking-tighter tabular-nums flex items-center justify-center gap-12"
                >
                  <span>{currentQuestion.a}</span>
                  <span className="text-slate-200 text-8xl">×</span>
                  <span>{currentQuestion.b}</span>
                </motion.div>

                <form onSubmit={handleSubmit} className="w-full max-w-md relative group">
                  <div className="absolute inset-0 bg-indigo-500/5 blur-3xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
                  <div className="relative flex items-center">
                    <input
                      ref={inputRef}
                      type="number"
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value)}
                      className="w-full text-center text-8xl font-black p-8 bg-slate-50 border-4 border-slate-100 rounded-[2.5rem] focus:border-indigo-400 focus:bg-white transition-all tabular-nums placeholder:text-slate-200 outline-none h-48 flex items-center justify-center leading-none appearance-none"
                      placeholder="?"
                      autoFocus
                    />
                  </div>
                  <button type="submit" className="hidden">Submit</button>
                </form>

                <div className="h-24 w-full flex items-center justify-center">
                  <AnimatePresence mode="wait">
                    {feedback && (
                      <motion.div 
                        key={`${feedback.msg}-${feedback.timestamp}`}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.1 }}
                        className={`px-12 py-5 rounded-full flex items-center gap-4 border-4 ${
                          feedback.type === 'success' 
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                            : 'bg-rose-50 text-rose-600 border-rose-100'
                        }`}
                      >
                        {feedback.type === 'success' ? <CheckCircle2 size={24} strokeWidth={3} /> : <X size={24} strokeWidth={3} />}
                        <span className="font-black text-2xl uppercase tracking-tight">
                          {feedback.type === 'success' ? 'Correct!' : 'Try Again!'}
                        </span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Mastery Grid */}
        <div className="w-full lg:w-[480px] bg-white rounded-[3rem] border-4 border-slate-100 flex flex-col p-8 justify-center items-center">
          <div className="flex flex-col items-center mb-8 shrink-0">
            <h4 className="text-[14px] font-black text-slate-300 uppercase tracking-[0.3em] mb-4">Mastery Table</h4>
          </div>
          <div className="overflow-y-auto no-scrollbar pb-6 flex flex-col items-center">
            <div className="inline-block">
              {/* Grid Header Labels */}
              <div className="flex gap-1 items-center mb-1 pl-7">
                {gridNumbers.map(col => (
                  <div key={col} className="w-7 h-5 flex items-center justify-center font-black text-slate-300 text-[10px]">
                    {col}
                  </div>
                ))}
              </div>

              <div className="space-y-1">
                {gridNumbers.map(row => (
                  <div key={row} className="flex gap-1 items-center">
                    <button
                      onClick={() => toggleRow(row)}
                      className={`w-6 h-6 rounded-lg flex items-center justify-center font-black text-[10px] transition-all border-2 ${
                        selectedRows.includes(row) 
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-slate-50 text-slate-400 border-slate-50 hover:bg-slate-100'
                      }`}
                    >
                      {row}
                    </button>
                    {gridNumbers.map(col => {
                      const state = cellStates[`${row}x${col}`];
                      return (
                        <div 
                          key={`${row}x${col}`} 
                          className={`w-7 h-7 rounded-lg border-2 transition-colors duration-500 ${getCellColor(state)}`}
                        />
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="mt-8 pt-8 border-t-4 border-slate-50">
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Not Tested', color: 'bg-white border-slate-100' },
                { label: 'Needs Work', color: 'bg-orange-500 border-orange-400' },
                { label: 'Correct', color: 'bg-emerald-500 border-emerald-400' },
                { label: 'Mastered', color: 'bg-emerald-700 border-emerald-600' }
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-md border-2 ${item.color}`} />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </ToolPanel>
  );
};

export default TimesTable;
