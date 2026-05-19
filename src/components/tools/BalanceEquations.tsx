import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Scale, 
  ChevronRight, 
  Star, 
  Trophy, 
  RotateCcw,
  ChevronLeft
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useSettings } from '../../contexts/SettingsContext';
import { useHeader } from '../../contexts/HeaderContext';
import { audioEngine } from '../../utils/audio';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import ToolPanel from '../shared/ToolPanel';

// 1. Constants
const YEAR_LEVELS = [
  { id: 'Year 1-2', label: 'Year 1-2', sub: 'Simple Addition' },
  { id: 'Year 3-4', label: 'Year 3-4', sub: 'Mix of +/-' },
  { id: 'Year 5-6', label: 'Year 5-6', sub: 'Multiplication' },
  { id: 'Year 7+', label: 'Year 7+', sub: 'Advanced Algebra' }
];

// 2. Config (None)

// 3. Text (Help and Info)
const HELP_INFO = (
  <div className="space-y-4 font-['Outfit']">
    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">How to Play Balance Equations</h3>
    <div className="space-y-3">
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center text-xs font-black text-indigo-600 shrink-0">1</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">Pick a <b>Year Level</b> to start your math mission.</p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center text-xs font-black text-blue-600 shrink-0">2</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">Look at the <b>Left Side</b> and <b>Right Side</b> of the equals sign. They must have the same total!</p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-emerald-50 flex items-center justify-center text-xs font-black text-emerald-600 shrink-0">3</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">Use the <b>Numpad</b> to type in the missing number (represented by the <b>?</b> box).</p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-rose-50 flex items-center justify-center text-xs font-black text-rose-600 shrink-0">4</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">Click <b>Check</b> to see if you are right. Try to get 10/10!</p>
      </div>
    </div>
  </div>
);

// 4. Local Storage (None)

// 5. Classes (None)

// 6. Functions
const generateQuestion = (level: string) => {
  let leftSide: (string | number)[] = [];
  let rightSide: (string | number)[] = [];
  let answer = 0;

  if (level === 'Year 1-2') {
    let a, b, c, total, ans;
    do {
      a = Math.floor(Math.random() * 9) + 1;
      b = Math.floor(Math.random() * 9) + 1;
      total = a + b;
      c = Math.floor(Math.random() * (total - 1)) + 1;
      ans = total - c;
    } while (c === a || c === b || ans === a || ans === b || c === 0 || ans === 0);
    answer = ans;
    leftSide = [a, '+', b];
    rightSide = [c, '+', '?'];
  } else if (level === 'Year 3-4') {
    const isAdd = Math.random() > 0.5;
    if (isAdd) {
      let a, b, c, total, ans;
      do {
        a = Math.floor(Math.random() * 20) + 5;
        b = Math.floor(Math.random() * 20) + 5;
        total = a + b;
        c = Math.floor(Math.random() * (total - 5)) + 2;
        ans = total - c;
      } while (c === a || c === b || ans === a || ans === b);
      answer = ans;
      leftSide = [a, '+', b];
      rightSide = [c, '+', '?'];
    } else {
      let a, b, c, total, ans;
      do {
        a = Math.floor(Math.random() * 30) + 20;
        b = Math.floor(Math.random() * 15) + 5;
        total = a - b;
        c = Math.floor(Math.random() * (total - 2)) + 1;
        ans = total - c;
      } while (c === a || c === b || ans === a || ans === b);
      answer = ans;
      leftSide = [a, '-', b];
      rightSide = [c, '+', '?'];
    }
  } else if (level === 'Year 5-6') {
    const isMult = Math.random() > 0.5;
    if (isMult) {
      let a, b, c, total, ans;
      do {
        a = Math.floor(Math.random() * 10) + 2;
        b = Math.floor(Math.random() * 10) + 2;
        total = a * b;
        c = Math.floor(Math.random() * (total - 5)) + 2;
        ans = total - c;
      } while (c === a || c === b || ans === a || ans === b);
      answer = ans;
      leftSide = [a, '×', b];
      rightSide = [c, '+', '?'];
    } else {
      let a, b, c, d, total, ans;
      do {
        a = Math.floor(Math.random() * 50) + 10;
        b = Math.floor(Math.random() * 50) + 10;
        total = a + b;
        c = Math.floor(Math.random() * 10) + 2;
        d = Math.floor(Math.random() * 5) + 2;
        ans = total - (c * d);
      } while (c === a || c === b || d === a || d === b || ans === a || ans === b || ans <= 0);
      answer = ans;
      leftSide = [a, '+', b];
      rightSide = [c, '×', d, '+', '?'];
    }
  } else {
    let a, b, c, d, total, ans;
    do {
      a = Math.floor(Math.random() * 10) + 2;
      b = Math.floor(Math.random() * 10) + 2;
      c = Math.floor(Math.random() * 5) + 2;
      total = (a + b) * c;
      d = Math.floor(Math.random() * (total / 2)) + 10;
      ans = total - d;
    } while (d === a || d === b || d === c || ans === a || ans === b || ans === c || ans <= 0);
    answer = ans;
    leftSide = ['(', a, '+', b, ')', '×', c];
    rightSide = [d, '+', '?'];
  }

  return { leftSide, rightSide, answer };
};

// 7. Component
export const BalanceEquations = () => {
  const { setHeaderActions, setOnReset, clearHeader, setHelpContent } = useHeader();
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 1024 : false);
  const [gameState, setGameState] = useState('menu'); // 'menu', 'playing', 'result'
  const [yearLevel, setYearLevel] = useLocalStorage('balance_equations_level', 'Year 3-4');
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; correctAnswer: number } | null>(null);
  const [score, setScore] = useState(0);
  
  const { settings } = useSettings();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const startGame = useCallback((level: string) => {
    setYearLevel(level);
    const newQuestions = Array.from({ length: 10 }, () => generateQuestion(level));
    setQuestions(newQuestions);
    setCurrentIndex(0);
    setScore(0);
    setUserAnswer('');
    setFeedback(null);
    setGameState('playing');
    audioEngine.playTick(settings.soundTheme);
  }, [settings.soundTheme, setYearLevel]);

  const handleCheck = useCallback(() => {
    if (userAnswer === '' || feedback) return;

    const current = questions[currentIndex];
    const isCorrect = parseInt(userAnswer) === current.answer;
    
    if (isCorrect) {
      setScore(prev => prev + 1);
      audioEngine.playSuccess(settings.soundTheme);
      confetti({
        particleCount: 40,
        spread: 40,
        origin: { y: 0.7 },
        colors: ['#6366f1', '#10b981']
      });
    } else {
      audioEngine.playError(settings.soundTheme);
    }

    setFeedback({ isCorrect, correctAnswer: current.answer });
  }, [userAnswer, feedback, questions, currentIndex, settings.soundTheme]);

  const handleNext = useCallback(() => {
    if (currentIndex < 9) {
      setCurrentIndex(prev => prev + 1);
      setUserAnswer('');
      setFeedback(null);
      audioEngine.playTick(settings.soundTheme);
    } else {
      setGameState('result');
      if (score >= 8) {
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
      audioEngine.playTick(settings.soundTheme);
    }
  }, [currentIndex, score, settings.soundTheme]);

  const handleNumpad = useCallback((val: string) => {
    if (feedback) return;
    audioEngine.playTick(settings.soundTheme);
    if (val === 'clear') {
      setUserAnswer('');
    } else if (userAnswer.length < 5) {
      setUserAnswer(prev => prev + val);
    }
  }, [feedback, userAnswer, settings.soundTheme]);

  const resetTool = useCallback(() => {
    setGameState('menu');
    setQuestions([]);
    setCurrentIndex(0);
    setScore(0);
    setUserAnswer('');
    setFeedback(null);
    audioEngine.playTick(settings.soundTheme);
  }, [settings.soundTheme]);

  useEffect(() => {
    setOnReset(() => resetTool);
    setHelpContent(HELP_INFO);
    return () => clearHeader();
  }, [clearHeader, setOnReset, resetTool, setHelpContent]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== 'playing') return;
      if (e.key >= '0' && e.key <= '9') handleNumpad(e.key);
      if (e.key === 'Enter') {
        if (feedback) {
          handleNext();
        } else {
          handleCheck();
        }
      }
      if (e.key === 'Backspace') handleNumpad('clear');
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, feedback, handleCheck, handleNext, handleNumpad]);

  useEffect(() => {
    setHeaderActions(null);
  }, [setHeaderActions]);

  return (
    <ToolPanel 
      className="flex-col items-center justify-center p-2 lg:p-6 overflow-hidden"
      fluid={isMobile}
      baseWidth={isMobile ? 800 : 1200}
      baseHeight={isMobile ? 1200 : 800}
    >
      <div className="tool-grid-bg opacity-30 pointer-events-none" />

      <AnimatePresence mode="wait">
        {gameState === 'menu' ? (
          <motion.div 
            key="menu"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="w-full max-w-5xl flex flex-col items-center gap-4 md:gap-8 lg:gap-10 py-4"
          >
            <div className="text-center px-4">
              <h1 className="text-3xl md:text-5xl lg:text-7xl font-black text-slate-900 tracking-tighter uppercase leading-none">Balance Equations</h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 w-full max-w-4xl px-4">
              {YEAR_LEVELS.map((level) => (
                <button
                  key={level.id}
                  onClick={() => startGame(level.id)}
                  className="group p-6 md:p-8 bg-slate-50 border-4 border-transparent rounded-[2rem] md:rounded-[3rem] hover:border-indigo-100 hover:bg-white transition-all flex items-center justify-between text-left shadow-sm hover:shadow-xl"
                >
                  <div className="flex flex-col items-start gap-1">
                    <span className="text-2xl md:text-4xl font-black text-slate-800 tracking-tighter">{level.label}</span>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      {level.sub}
                    </span>
                  </div>
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-500 group-hover:bg-indigo-600 group-hover:text-white transition-all ">
                    <ChevronRight size={isMobile ? 20 : 24} />
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        ) : gameState === 'playing' ? (
          <motion.div 
            key="playing"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`w-full max-w-5xl flex flex-col items-center gap-4 lg:gap-6 ${isMobile ? 'py-1' : ''}`}
          >
            {/* Progress Bar */}
            <div className="w-full max-w-md space-y-1 md:space-y-2 px-4">
              <div className="flex justify-between items-end">
                <span className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">Question {currentIndex + 1} of 10</span>
                <div className="bg-indigo-600 px-2 md:px-3 py-0.5 md:py-1 rounded-full">
                   <span className="text-[10px] md:text-xs font-black text-white tabular-nums tracking-widest uppercase">Score: {score}</span>
                </div>
              </div>
              <div className="w-full h-1.5 md:h-2 bg-slate-100 rounded-full overflow-hidden p-0.5 border-none ">
                <motion.div 
                  className="h-full bg-indigo-600 rounded-full shadow-[0_0_15px_rgba(79,70,229,0.4)]"
                  initial={false}
                  animate={{ width: `${(currentIndex + 1) * 10}%` }}
                />
              </div>
            </div>

            <div className="flex flex-col items-center gap-2 lg:gap-6 w-full flex-1">
              {/* Equation Area */}
              <div className="flex-1 flex flex-col items-center gap-2 lg:gap-6 w-full px-4 justify-center">
                <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8 lg:gap-10 w-full">
                  {/* Left Side */}
                    <div className="flex items-center gap-3 lg:gap-5 relative overflow-hidden group">
                    <div className="tool-grid-bg opacity-10 pointer-events-none" />
                    {questions[currentIndex].leftSide.map((part: string | number, i: number) => (
                      <span key={i} className={`${isMobile ? 'text-3xl' : 'text-5xl lg:text-7xl'} font-black tracking-tighter ${typeof part === 'number' ? 'text-slate-800' : 'text-indigo-600'}`}>
                        {part}
                      </span>
                    ))}
                  </div>

                  <span className={`${isMobile ? 'text-4xl' : 'text-6xl lg:text-8xl'} font-black text-slate-200 tracking-tighter`}>=</span>

                  {/* Right Side */}
                  <div className="flex items-center gap-3 lg:gap-5 relative overflow-hidden group">
                    <div className="tool-grid-bg opacity-10 pointer-events-none" />
                    {questions[currentIndex].rightSide.map((part: string | number, i: number) => (
                      <React.Fragment key={i}>
                        {part === '?' ? (
                          <div className={`w-14 h-14 md:w-20 md:h-20 lg:w-28 lg:h-28 rounded-xl md:rounded-[2rem] border-2 md:border-4 flex items-center justify-center ${isMobile ? 'text-3xl' : 'text-5xl lg:text-6xl'} font-black transition-all tabular-nums ${
                            feedback ? (feedback.isCorrect ? 'bg-emerald-500 border-white/20 text-white shadow-lg shadow-emerald-500/20' : 'bg-rose-500 border-white/20 text-white shadow-lg shadow-rose-500/20') :
                            'bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-500/20'
                          }`}>
                            {userAnswer || (feedback ? '' : '?')}
                          </div>
                        ) : (
                          <span key={i} className={`${isMobile ? 'text-3xl' : 'text-5xl lg:text-7xl'} font-black tracking-tighter ${typeof part === 'number' ? 'text-slate-800' : 'text-indigo-600'}`}>
                            {part}
                          </span>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>

                {/* Feedback Message */}
                <div className={`${isMobile ? 'h-12' : 'h-16 lg:h-20'}`}>
                  <AnimatePresence mode="wait">
                    {feedback && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className={`flex items-center gap-2 md:gap-4 px-4 md:px-8 py-2 md:py-3 rounded-xl md:rounded-[1.5rem] ${isMobile ? 'text-lg' : 'text-2xl'} font-black uppercase tracking-tighter ${feedback.isCorrect ? 'text-emerald-600 bg-emerald-50 border-4 border-white' : 'text-rose-600 bg-rose-50 border-4 border-white'}`}
                      >
                        {feedback.isCorrect ? <Star fill="currentColor" size={isMobile ? 24 : 32} /> : <RotateCcw size={isMobile ? 24 : 32} />}
                        {feedback.isCorrect ? 'Correct!' : `Wrong! It was ${feedback.correctAnswer}`}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Numpad Area */}
              <div className="w-full max-w-4xl flex flex-col md:flex-row items-center gap-4 md:gap-8 px-4">
                <div className="grid grid-cols-3 gap-1.5 md:gap-2 flex-1 w-full">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0, 'clear'].map((val) => (
                    <button
                      key={val}
                      onClick={() => handleNumpad(val.toString())}
                      className={`h-11 md:h-14 lg:h-16 rounded-xl md:rounded-2xl text-xl md:text-2xl font-black transition-all active:scale-95 border-2 md:border-4 tabular-nums ${
                        val === 'clear' ? 'bg-rose-50 border-rose-100 text-rose-500' : 'bg-white border-slate-100 text-slate-800 hover:border-indigo-100'
                      } ${val === 'clear' ? 'col-span-3' : ''} ${val === 0 ? 'col-start-2' : ''}`}
                    >
                      {val === 'clear' ? <RotateCcw size={isMobile ? 18 : 24} strokeWidth={3} /> : val}
                    </button>
                  ))}
                </div>
                <button
                  onClick={feedback ? handleNext : handleCheck}
                  disabled={!userAnswer && !feedback}
                  className={`w-full md:w-48 lg:w-56 h-11 md:h-14 lg:h-16 rounded-xl md:rounded-2xl text-base md:text-lg font-black transition-all flex items-center justify-center gap-2 uppercase tracking-widest ${
                    !userAnswer && !feedback ? 'bg-slate-100 text-slate-300' : 'bg-indigo-600 text-white hover:bg-indigo-700 border-4 border-white/10 shadow-lg shadow-indigo-500/20'
                  }`}
                >
                  {feedback ? 'Next' : 'Check'}
                  <ChevronRight size={isMobile ? 18 : 24} strokeWidth={3} />
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="result"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-3xl flex flex-col items-center gap-8 md:gap-12 text-center py-8 px-4"
          >
            <div className="space-y-6 md:space-y-8">
              <div className="w-32 h-32 md:w-48 md:h-48 bg-amber-400 rounded-[2.5rem] md:rounded-[4rem] flex items-center justify-center text-white mx-auto relative border-8 border-white rotate-6 shadow-xl">
                <Trophy size={isMobile ? 64 : 96} strokeWidth={1.5} />
                <div className="absolute -top-4 -right-4 md:-top-6 md:-right-6 w-14 h-14 md:w-20 md:h-20 bg-white rounded-full flex items-center justify-center text-amber-500 border-4 border-amber-50 animate-bounce">
                  <Star fill="currentColor" size={isMobile ? 24 : 40} />
                </div>
              </div>
              <div className="space-y-2">
                <h2 className="text-5xl md:text-7xl font-black text-slate-900 uppercase tracking-tighter leading-none">Well Done!</h2>
                <div className="flex flex-col items-center gap-2 mt-4">
                   <span className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Your Score</span>
                   <p className="text-7xl md:text-9xl font-black text-indigo-600 tabular-nums tracking-tighter leading-none">
                     {score}<span className="text-2xl md:text-3xl text-slate-200 ml-2 md:ml-3">/10</span>
                   </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 md:gap-6 w-full max-w-lg mt-4 md:mt-8">
              <button
                onClick={() => setGameState('menu')}
                className="flex-1 py-4 md:py-8 bg-slate-100 text-slate-400 font-black text-lg md:text-xl rounded-2xl md:rounded-[2rem] hover:bg-slate-200 transition-all active:scale-95 uppercase tracking-widest"
              >
                Menu
              </button>
              <button
                onClick={() => startGame(yearLevel)}
                className="flex-1 py-4 md:py-8 bg-indigo-600 text-white font-black text-lg md:text-xl rounded-2xl md:rounded-[2rem] hover:bg-indigo-700 transition-all active:scale-95 uppercase tracking-widest shadow-xl shadow-indigo-500/20"
              >
                Play Again
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-50 rounded-full blur-[120px] opacity-40 -z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-sky-50 rounded-full blur-[120px] opacity-40 -z-10 pointer-events-none" />
    </ToolPanel>
  );
};

export default BalanceEquations;
