import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calculator, 
  CheckCircle2, 
  RefreshCcw, 
  ChevronRight, 
  Trophy, 
  ArrowLeft,
  X,
  Eraser,
  Minus
} from 'lucide-react';
import { ToolPanel } from '../shared/ToolPanel';
import confetti from 'canvas-confetti';
import { useSettings } from '../../contexts/SettingsContext';
import { useHeader } from '../../contexts/HeaderContext';
import { audioEngine } from '../../utils/audio';

// 1. Constants (None)

// 2. Config (None)

// 3. Text (Help and Info)
const HELP_INFO = (
  <div className="space-y-4 font-['Outfit']">
    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">How to Play</h3>
    <div className="space-y-3">
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center text-xs font-black text-indigo-600 shrink-0">1</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">Choose a <b>Level</b> to start.</p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center text-xs font-black text-blue-600 shrink-0">2</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">Look at the sum and find the <b>missing number</b> "?".</p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-emerald-50 flex items-center justify-center text-xs font-black text-emerald-600 shrink-0">3</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">Use the <b>numbers</b> to type your answer.</p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-rose-50 flex items-center justify-center text-xs font-black text-rose-600 shrink-0">4</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">Click <b>Check</b> to see if you are right.</p>
      </div>
    </div>
  </div>
);

// 4. Local Storage (None)

// 5. Classes (None)

// 6. Functions (Helper)
const generateQuestion = (max: number) => {
  const a = Math.floor(Math.random() * (max - 1)) + 2; // Minuend
  const b = Math.floor(Math.random() * (a - 1)) + 1; // Subtrahend
  const c = a - b; // Difference
  const blankIndex = Math.floor(Math.random() * 3);
  return { a, b, c, blankIndex, answer: [a, b, c][blankIndex] };
};

// 7. Component
export const MissingSubtraction = () => {
  const { setHeaderActions, setOnReset, clearHeader, setHelpContent } = useHeader();
  const { settings } = useSettings();

  const [gameState, setGameState] = useState<'menu' | 'playing' | 'result'>('menu');
  const [difficulty, setDifficulty] = useState(10);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState<{ isCorrect: boolean, correctAnswer: number } | null>(null);
  const [score, setScore] = useState(0);
  const [history, setHistory] = useState<any[]>([]);

  const resetGame = useCallback(() => {
    setGameState('menu');
    setQuestions([]);
    setCurrentIndex(0);
    setUserAnswer('');
    setFeedback(null);
    setScore(0);
    setHistory([]);
    audioEngine.playTick(settings.soundTheme);
  }, [settings.soundTheme]);

  const startGame = (level: number) => {
    setDifficulty(level);
    const newQuestions = Array.from({ length: 10 }, () => generateQuestion(level));
    setQuestions(newQuestions);
    setCurrentIndex(0);
    setScore(0);
    setHistory([]);
    setUserAnswer('');
    setFeedback(null);
    setGameState('playing');
    audioEngine.playTick(settings.soundTheme);
  };

  useEffect(() => {
    setOnReset(() => resetGame);
    setHelpContent(HELP_INFO);
    return () => clearHeader();
  }, [clearHeader, setOnReset, resetGame, setHelpContent]);

  const handleCheck = useCallback(() => {
    if (userAnswer === '' || feedback) return;

    const current = questions[currentIndex];
    const isCorrect = parseInt(userAnswer) === current.answer;
    
    if (isCorrect) {
      setScore(prev => prev + 1);
      audioEngine.playTick(settings.soundTheme);
    } else {
      audioEngine.playTick(settings.soundTheme);
    }

    setFeedback({ isCorrect, correctAnswer: current.answer });
    setHistory(prev => [...prev, { ...current, userVal: userAnswer, isCorrect }]);
  }, [userAnswer, feedback, questions, currentIndex, settings.soundTheme]);

  const handleNext = useCallback(() => {
    if (currentIndex < 9) {
      setCurrentIndex(prev => prev + 1);
      setUserAnswer('');
      setFeedback(null);
    } else {
      setGameState('result');
      if (score >= 8) {
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
    }
  }, [currentIndex, score]);

  const handleNumpad = useCallback((val: string) => {
    if (feedback) return;
    if (val === 'clear') {
      setUserAnswer('');
    } else if (userAnswer.length < 3) {
      setUserAnswer(prev => prev + val);
    }
    audioEngine.playTick(settings.soundTheme);
  }, [feedback, userAnswer, settings.soundTheme]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== 'playing') return;
      if (e.key >= '0' && e.key <= '9') {
        handleNumpad(e.key);
      } else if (e.key === 'Enter') {
        if (feedback) handleNext();
        else handleCheck();
      } else if (e.key === 'Backspace') {
        handleNumpad('clear');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, feedback, handleCheck, handleNext, handleNumpad]);

  useEffect(() => {
    setHeaderActions(
      <div className="flex items-center gap-4 italic">
        {gameState === 'playing' && (
          <div className="flex items-center gap-6 px-8 py-2 bg-slate-50 border-2 border-slate-100 rounded-xl ">
            <div className="flex flex-col items-center">
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Progress</span>
              <div className="flex gap-1.5 mt-1">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div 
                    key={i} 
                    className={`w-2.5 h-2.5 rounded-full transition-all duration-500 ${
                      i < currentIndex ? (history[i]?.isCorrect ? 'bg-emerald-500 -[0_0_8px_rgba(16,185,129,0.4)]' : 'bg-rose-500 -[0_0_8px_rgba(244,63,94,0.4)]') :
                      i === currentIndex ? 'bg-indigo-500 animate-pulse scale-125' : 'bg-slate-200'
                    }`}
                  />
                ))}
              </div>
            </div>
            <div className="w-px h-8 bg-slate-200" />
            <div className="flex flex-col items-center">
              <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">Accuracy</span>
              <span className="text-xl font-black text-indigo-600 tabular-nums leading-none">{score}/10</span>
            </div>
          </div>
        )}
        {gameState !== 'menu' && (
          <button 
            onClick={resetGame}
            className="flex items-center gap-2 px-8 py-2 bg-white border-2 border-slate-100 text-slate-300 rounded-xl font-black text-[10px] uppercase tracking-widest hover:border-rose-100 hover:text-rose-600 transition-all active:scale-95 "
          >
            <ArrowLeft size={14} /> Back
          </button>
        )}
      </div>
    );
  }, [gameState, currentIndex, history, setHeaderActions, resetGame, score]);

  return (
    <ToolPanel className="flex-col items-center justify-center p-4 lg:p-12 italic">
      <AnimatePresence mode="wait">
        {gameState === 'menu' ? (
          <motion.div 
            key="menu"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="w-full max-w-4xl flex flex-col items-center relative z-10"
          >
            {/* Branding Header */}
            <div className="text-center space-y-4 shrink-0 mb-12">
              <div className="space-y-1">
                 <h1 className="text-5xl lg:text-6xl font-black text-slate-900 tracking-tighter uppercase leading-none">Missing Subtraction</h1>
              </div>
            </div>

            <div className="bg-slate-50/50 p-12 lg:p-16 rounded-[4rem] border-4 border-white  grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
              {[
                { level: 10, label: 'Easy', desc: '1-10', icon: '❄️', color: 'indigo' },
                { level: 100, label: 'Hard', desc: '1-100', icon: '🌊', color: 'rose' }
              ].map(opt => (
                <button
                  key={opt.level}
                  onClick={() => startGame(opt.level)}
                  className={`group relative p-12 bg-white rounded-[3rem] border-4 border-transparent hover:border-${opt.color}-100 transition-all hover:scale-[1.02]  text-center space-y-4 overflow-hidden`}
                >
                  <div className={`absolute top-0 right-0 w-32 h-32 bg-${opt.color}-50 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity`} />
                  <div className="text-6xl mb-4 group-hover:scale-125 transition-transform duration-500">{opt.icon}</div>
                  <div className={`text-sm font-black text-${opt.color}-400 uppercase tracking-[0.3em]}`}>{opt.label}</div>
                  <div className="text-3xl font-black text-slate-900 tracking-tighter uppercase">{opt.desc}</div>
                </button>
              ))}
            </div>
          </motion.div>
        ) : gameState === 'result' ? (
          <motion.div 
            key="result"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            className="w-full max-w-2xl bg-white p-16 rounded-[5rem]  border-8 border-indigo-600 flex flex-col items-center gap-10 text-center italic relative overflow-hidden"
          >
            <div className="tool-grid-bg opacity-10 pointer-events-none" />
            <div className="w-32 h-32 bg-indigo-600 rounded-[2rem] flex items-center justify-center text-white  -rotate-6 border-4 border-white">
              <Trophy size={64} strokeWidth={2} />
            </div>
            <div className="space-y-4">
              <h2 className="text-5xl font-black text-slate-900 tracking-tighter uppercase leading-none">Finished!</h2>
              <p className="text-[12px] font-black text-slate-400 uppercase tracking-[0.4em]">Score: <span className="text-indigo-600">{score}/10</span></p>
            </div>

            <div className="flex gap-3 bg-slate-50 p-4 rounded-3xl border-2 border-slate-100">
              {Array.from({ length: 10 }).map((_, i) => (
                <div 
                  key={i} 
                  className={`w-4 h-4 rounded-full  ${i < score ? 'bg-indigo-500 -[0_0_10px_rgba(79,70,229,0.4)]' : 'bg-slate-200'}`}
                />
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-6 w-full pt-4">
              <button
                onClick={resetGame}
                className="flex-1 h-20 bg-slate-100 text-slate-500 font-black text-sm uppercase tracking-widest rounded-[2rem] hover:bg-slate-200 transition-all flex items-center justify-center gap-4 active:scale-95"
              >
                <ArrowLeft size={20} strokeWidth={3} /> Menu
              </button>
              <button
                onClick={() => startGame(difficulty)}
                className="flex-1 h-20 bg-indigo-600 text-white font-black text-sm uppercase tracking-widest rounded-[2rem] hover:bg-indigo-700 transition-all flex items-center justify-center gap-4  active:scale-95"
              >
                <RefreshCcw size={20} strokeWidth={3} /> Try Again
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="playing"
            initial={{ opacity: 0, scale: 1.1, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="w-full max-w-7xl flex flex-col lg:flex-row gap-12 relative z-10"
          >
            {/* Equation Arena */}
            <div className="flex-1 bg-slate-50/50 rounded-[4rem] border-4 border-white  p-16 flex flex-col items-center justify-center gap-16 min-h-[500px] relative overflow-hidden">
              <div className="tool-grid-bg opacity-20 pointer-events-none" />
              
              <div className="flex items-center gap-8 md:gap-16 flex-wrap justify-center relative z-10">
                {[
                  questions[currentIndex].blankIndex === 0 ? '?' : questions[currentIndex].a,
                  '-',
                  questions[currentIndex].blankIndex === 1 ? '?' : questions[currentIndex].b,
                  '=',
                  questions[currentIndex].blankIndex === 2 ? '?' : questions[currentIndex].c
                ].map((part, i) => (
                  <React.Fragment key={i}>
                    {part === '?' ? (
                      <motion.div
                        animate={feedback ? { 
                          scale: [1, 1.05, 1],
                        } : {}}
                        className={`w-32 h-32 md:w-48 md:h-48 rounded-[3rem] border-8 flex items-center justify-center text-7xl md:text-9xl font-black transition-all duration-500  ${
                          feedback ? (feedback.isCorrect ? 'border-emerald-500 bg-emerald-50 text-emerald-600' : 'border-rose-500 bg-rose-50 text-rose-600') :
                          'border-indigo-600 bg-white text-indigo-600'
                        }`}
                      >
                        {userAnswer || (feedback ? '' : '?')}
                      </motion.div>
                    ) : (
                      <span className={`text-7xl md:text-[10rem] font-black tracking-tighter ${typeof part === 'number' ? 'text-slate-900' : 'text-slate-200'}`}>
                        {part}
                      </span>
                    )}
                  </React.Fragment>
                ))}
              </div>

              <div className="h-20 flex items-center relative z-10">
                <AnimatePresence mode="wait">
                  {feedback && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 1.1, y: -10 }}
                      className={`flex items-center gap-4 px-10 py-4 rounded-[2rem] bg-white  border-4 ${feedback.isCorrect ? 'border-emerald-100 text-emerald-600' : 'border-rose-100 text-rose-600'}`}
                    >
                      {feedback.isCorrect ? (
                        <>
                          <CheckCircle2 size={32} strokeWidth={3} />
                          <span className="text-2xl font-black uppercase tracking-tight italic">Correct!</span>
                        </>
                      ) : (
                        <>
                          <X size={32} strokeWidth={3} className="bg-rose-500 text-white rounded-lg p-1" />
                          <span className="text-2xl font-black uppercase tracking-tight italic text-slate-900">Answer: {feedback.correctAnswer}</span>
                        </>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Interface Panel */}
            <div className="w-full lg:w-[400px] bg-white p-10 rounded-[4rem]  border-4 border-slate-50 flex flex-col gap-10">
              <div className="grid grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 'clear', 0].map((val) => (
                  <button
                    key={val}
                    onClick={() => typeof val === 'number' ? handleNumpad(val.toString()) : handleNumpad(val)}
                    className={`h-24 rounded-[1.5rem] text-3xl font-black transition-all active:scale-95  border-4 border-transparent ${
                      val === 'clear' ? 'bg-rose-50 text-rose-500 hover:border-rose-100' :
                      'bg-slate-50 text-slate-900 hover:border-indigo-100'
                    } ${val === 0 ? 'col-span-2' : ''}`}
                  >
                    {val === 'clear' ? <Eraser className="mx-auto" /> : val}
                  </button>
                ))}
              </div>
              
              <button
                onClick={feedback ? handleNext : handleCheck}
                disabled={!userAnswer && !feedback}
                className={`w-full h-24 rounded-[2rem] text-2xl font-black transition-all flex items-center justify-center gap-4  uppercase tracking-widest ${
                  !userAnswer && !feedback ? 'bg-slate-100 text-slate-300 cursor-not-allowed' :
                  feedback ? 'bg-slate-900 text-white hover:bg-indigo-900' :
                  'bg-indigo-600 text-white hover:bg-indigo-700'
                }`}
              >
                {feedback ? (
                  <>Next <ChevronRight size={32} strokeWidth={3} /></>
                ) : (
                  <>Check <CheckCircle2 size={32} strokeWidth={3} /></>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </ToolPanel>
  );
};

export default MissingSubtraction;
