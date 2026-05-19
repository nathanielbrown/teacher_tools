import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RotateCcw,
  Zap,
  Check,
  Delete
} from 'lucide-react';
import { ToolPanel } from '../shared/ToolPanel';
import { useHeader } from '../../contexts/HeaderContext';
import { useSettings } from '../../contexts/SettingsContext';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { audioEngine } from '../../utils/audio';

// 1. Constants (None)

// 2. Config (None)

// 3. Text (Help and Info)
const HELP_INFO = (
  <div className="space-y-4 font-['Outfit']">
    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">How to use</h3>
    <div className="space-y-3">
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center text-xs font-black text-indigo-600 shrink-0">1</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">Click the <b>Cards</b> to change between 0 and 1.</p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center text-xs font-black text-blue-600 shrink-0">2</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">The <b>Number</b> at the top shows the total.</p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-emerald-50 flex items-center justify-center text-xs font-black text-emerald-600 shrink-0">3</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">The small numbers show what each card is worth.</p>
      </div>
    </div>
  </div>
);

// 4. Local Storage (None)

// 5. Classes (None)

// 6. Functions (None)

// 7. Component
export const BinaryNumbers = () => {
  const { setHeaderActions, setOnReset, clearHeader, setHelpContent } = useHeader();
  const { settings } = useSettings();

  const [binary, setBinary] = useState(new Array(8).fill(0));
  const [mode, setMode] = useState<'practice' | 'challenge'>('practice');
  const [targetDecimal, setTargetDecimal] = useState(0);
  const [isCorrect, setIsCorrect] = useState(false);

  // Challenge Mode State
  const [level, setLevel] = useState(1);
  const [points, setPoints] = useState(0);
  const [highScore, setHighScore] = useLocalStorage('binary_numbers_high_score', 0);
  const [timeLeft, setTimeLeft] = useState(10000);
  const [timerActive, setTimerActive] = useState(false);
  const [gameState, setGameState] = useState<'playing' | 'gameover'>('playing');
  const [isNewHighScore, setIsNewHighScore] = useState(false);
  const [challengeType, setChallengeType] = useState<'toBinary' | 'toDecimal'>('toBinary');
  const [userDecimalInput, setUserDecimalInput] = useState('');
  const [questionNumber, setQuestionNumber] = useState(1);
  const initializedModeRef = useRef<string | null>(null);

  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 1024 : false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const decimal = useMemo(() => {
    return binary.reduce((acc, bit, idx) => {
      return acc + (bit * Math.pow(2, 7 - idx));
    }, 0);
  }, [binary]);

  const generateTarget = useCallback((isAdvance = false) => {
    if (isAdvance) setQuestionNumber(prev => prev + 1);
    
    const bitsUsed = Math.min(8, level + 2);
    const maxVal = Math.pow(2, bitsUsed) - 1;
    const newTarget = Math.floor(Math.random() * maxVal) + 1;

    setTargetDecimal(newTarget);
    setIsCorrect(false);
    setUserDecimalInput('');
    setBinary(new Array(8).fill(0));

    const type = Math.random() > 0.5 ? 'toBinary' : 'toDecimal';
    setChallengeType(type);

    if (type === 'toDecimal') {
      const binaryArray = new Array(8).fill(0);
      let temp = newTarget;
      for (let i = 0; i < 8; i++) {
        const val = Math.pow(2, 7 - i);
        if (temp >= val) {
          binaryArray[i] = 1;
          temp -= val;
        }
      }
      setBinary(binaryArray);
    }

    // Set timer based on level
    const baseTime = 10000;
    const levelPenalty = (level - 1) * 1000;
    const startTime = Math.max(2000, baseTime - levelPenalty);
    setTimeLeft(startTime);
    setTimerActive(true);
    setGameState('playing');
    setIsNewHighScore(false);
  }, [level]);

  const resetTool = useCallback(() => {
    setBinary(new Array(8).fill(0));
    setIsCorrect(false);
    if (mode === 'challenge') {
      setLevel(1);
      setPoints(0);
      setQuestionNumber(1);
      setGameState('playing');
      setIsNewHighScore(false);
      generateTarget();
    }
    audioEngine.playTick(settings.soundTheme);
  }, [settings.soundTheme, mode, generateTarget]);

  const toggleBit = (index: number) => {
    if (isCorrect || (mode === 'challenge' && challengeType === 'toDecimal')) return;
    setBinary(prev => {
      const next = [...prev];
      next[index] = next[index] === 0 ? 1 : 0;
      return next;
    });
    audioEngine.playTick(settings.soundTheme);
  };


  useEffect(() => {
    if (mode === 'challenge' && !isCorrect) {
      const isAnswerCorrect = challengeType === 'toDecimal'
        ? parseInt(userDecimalInput) === targetDecimal
        : decimal === targetDecimal;

      if (isAnswerCorrect && targetDecimal !== 0) {
        setIsCorrect(true);
        setTimerActive(false);
        audioEngine.playSuccess(settings.soundTheme);

        // Calculate points
        const earned = Math.floor(timeLeft / 100);
        setPoints(prev => {
          const next = prev + earned;
          const nextLevel = Math.floor(next / 1000) + 1;
          if (nextLevel > level) {
            setLevel(nextLevel);
          }
          return next;
        });

        // Auto-advance after 300ms
        setTimeout(() => {
          generateTarget(true);
        }, 300);
      }
    }
  }, [decimal, targetDecimal, mode, settings.soundTheme, timeLeft, isCorrect, level, challengeType, userDecimalInput, generateTarget]);

  // Timer Effect
  useEffect(() => {
    let interval: any;
    if (timerActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => Math.max(0, prev - 10));
      }, 10);
    } else if (timeLeft === 0 && timerActive) {
      setTimerActive(false);
      setGameState('gameover');

      // High Score Check
      if (points > highScore) {
        setHighScore(points);
        setIsNewHighScore(true);
      }

      audioEngine.playTick(settings.soundTheme);
    }
    return () => clearInterval(interval);
  }, [timerActive, timeLeft, generateTarget, settings.soundTheme, points, highScore, setHighScore]);

  useEffect(() => {
    if (mode === 'challenge') {
      if (initializedModeRef.current !== 'challenge') {
        setLevel(1);
        setPoints(0);
        setQuestionNumber(1);
        setGameState('playing');
        generateTarget();
        initializedModeRef.current = 'challenge';
      }
    } else {
      initializedModeRef.current = 'practice';
      setTimerActive(false);
      setGameState('playing');
    }
  }, [mode, generateTarget]);

  useEffect(() => {
    setOnReset(() => resetTool);
    setHelpContent(HELP_INFO);
    return () => clearHeader();
  }, [clearHeader, setOnReset, resetTool, setHelpContent]);

  useEffect(() => {
    setHeaderActions(
      isMobile ? (
        <select
          value={mode}
          onChange={(e) => setMode(e.target.value as any)}
          className="bg-slate-100 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-indigo-600 outline-none border-none cursor-pointer appearance-none"
        >
          <option value="practice">Practice</option>
          <option value="challenge">Challenge</option>
        </select>
      ) : (
        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setMode('practice')}
            className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'practice' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
              }`}
          >
            Practice
          </button>
          <button
            onClick={() => setMode('challenge')}
            className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'challenge' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
              }`}
          >
            Challenge
          </button>
        </div>
      )
    );
  }, [mode, setHeaderActions, isMobile]);

  return (
    <ToolPanel 
      className="flex-col items-center justify-center p-2 lg:p-12 overflow-hidden"
      fluid={isMobile}
      baseWidth={isMobile ? 800 : 1200}
      baseHeight={isMobile ? 1200 : 900}
    >
      <div className={`w-full max-w-5xl mx-auto flex flex-col items-center gap-4 lg:gap-10 relative z-10 ${isMobile ? 'overflow-y-auto h-full px-2' : ''}`}>

        {/* Top Header Area */}
        <div className={`w-full ${isMobile ? 'h-auto py-2' : 'min-h-[100px] py-4'} flex flex-col items-center justify-center gap-2 lg:gap-4 shrink-0`}>
          {mode === 'challenge' && (
            <div className="w-full flex items-center justify-between px-2 lg:px-8">
              <div className="flex flex-col items-start">
                <span className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Level</span>
                <div className="text-sm md:text-xl lg:text-2xl font-black text-indigo-600 bg-indigo-50/50 px-3 md:px-5 py-1.5 md:py-2 rounded-xl">
                  {level}
                </div>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Points</span>
                <div className="text-sm md:text-xl lg:text-2xl font-black text-indigo-600 bg-indigo-50/50 px-3 md:px-5 py-1.5 md:py-2 rounded-xl tabular-nums">
                  {points}
                </div>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">High Score</span>
                <div className="text-sm md:text-xl lg:text-2xl font-black text-amber-500 bg-amber-50/50 px-3 md:px-5 py-1.5 md:py-2 rounded-xl tabular-nums">
                  {highScore}
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col items-center gap-2 text-center">
            {mode === 'challenge' ? (
              <div className="flex flex-col items-center gap-1 md:gap-4">
                <span className="text-[10px] md:text-xs font-black text-indigo-400 uppercase tracking-[0.4em]">Challenge Mode</span>
                <span className="text-3xl md:text-7xl lg:text-8xl font-black text-indigo-600 uppercase tracking-tighter">
                  Question {questionNumber}
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <span className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-[0.4em] mb-2 md:mb-4">Practice Mode</span>
                <div className="text-xl md:text-4xl lg:text-5xl font-black text-indigo-400 bg-indigo-50 px-6 md:px-10 py-2 md:py-4 rounded-2xl md:rounded-[2.5rem] uppercase tracking-widest">
                  Explore Binary
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Binary Bit Row Area */}
        <div className={`w-full ${isMobile ? 'h-auto py-2' : 'h-auto py-6'} flex flex-col items-center justify-center shrink-0`}>
          <div className="w-full grid grid-cols-8 gap-1 md:gap-4 lg:gap-8 max-w-5xl">
            {binary.map((bit, idx) => {
              const val = Math.pow(2, 7 - idx);
              const isBinaryDisabled = isCorrect || (mode === 'challenge' && challengeType === 'toDecimal');
              
              return (
                <div key={idx} className="flex flex-col items-center gap-2 md:gap-4">
                  <span className="text-xs md:text-xl lg:text-2xl font-black text-slate-300 tabular-nums uppercase">{val}</span>
                  <motion.button
                    whileHover={isBinaryDisabled ? {} : { y: -4, scale: 1.02 }}
                    whileTap={isBinaryDisabled ? {} : { scale: 0.98 }}
                    onClick={() => toggleBit(idx)}
                    disabled={isBinaryDisabled}
                    className={`w-full aspect-[2/3] rounded-xl md:rounded-[2rem] border-2 md:border-4 flex flex-col items-center justify-center gap-1 md:gap-4 transition-all duration-500 ${bit === 1
                        ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-500/20'
                        : 'bg-white border-slate-50 text-slate-200 hover:border-indigo-100'
                      } ${isCorrect && bit === 1 ? 'bg-emerald-500 border-emerald-400 shadow-emerald-500/20' : ''} ${isBinaryDisabled ? 'cursor-default' : ''}`}
                  >
                    <AnimatePresence mode="wait">
                      <motion.span
                        key={bit}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="text-3xl md:text-7xl lg:text-9xl font-black tabular-nums"
                      >
                        {bit}
                      </motion.span>
                    </AnimatePresence>
                  </motion.button>
                </div>
              );
            })}
          </div>

          {/* Progress Bar (Challenge Mode Only) */}
          {mode === 'challenge' && (
            <div className="w-full h-2 md:h-3 bg-slate-100 rounded-full overflow-hidden border-2 border-white shadow-inner mt-4 md:mt-8">
              <motion.div
                className="h-full bg-indigo-500"
                initial={false}
                animate={{ width: `${(timeLeft / 10000) * 100}%` }}
                transition={{ duration: 0.1, ease: "linear" }}
              />
            </div>
          )}
        </div>

        {/* Math Summary Area */}
        <div className={`w-full max-w-6xl ${isMobile ? 'flex-1 py-2' : 'flex-1 py-4'} flex items-center justify-center overflow-hidden`}>
            {gameState === 'playing' ? (
              <div
                className={`w-full h-full rounded-[2rem] lg:rounded-[2.5rem] px-4 py-6 lg:px-8 lg:py-6 border-4 flex flex-col items-center justify-center gap-6 lg:gap-16 transition-colors duration-300 ${isCorrect ? 'bg-emerald-50/50 border-emerald-400' : 'bg-slate-50/50 border-white'}`}
              >
                {mode === 'challenge' ? (
                  <div className={`flex flex-col md:flex-row items-center gap-4 md:gap-8 lg:gap-12 ${isMobile ? 'w-full' : ''}`}>
                    <div className={`flex flex-col items-center gap-2 md:gap-4 ${isMobile ? 'w-full' : 'w-[320px] lg:w-[400px] flex-shrink-0'}`}>
                      <span className="text-xs md:text-sm font-black text-indigo-500 uppercase tracking-[0.2em]">Decimal Number</span>
                      <div className={`bg-white text-5xl md:text-8xl lg:text-9xl font-black text-indigo-600 w-full ${isMobile ? 'h-[100px]' : 'h-[140px] lg:h-[200px]'} flex items-center justify-center rounded-2xl md:rounded-[2.5rem] tabular-nums shadow-sm border-none`}>
                        {challengeType === 'toBinary' ? targetDecimal : (userDecimalInput || '???')}
                      </div>
                    </div>

                    {/* Number Pad */}
                    <div className={`grid grid-cols-3 gap-2 md:gap-3 lg:gap-4 w-full md:w-max ${challengeType === 'toBinary' ? 'opacity-20 pointer-events-none' : ''}`}>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                        <button
                          key={num}
                          onClick={() => setUserDecimalInput(prev => (prev.length < 3 ? prev + num : prev))}
                          className="w-full md:w-16 lg:w-20 h-12 md:h-16 lg:h-20 bg-white hover:bg-indigo-50 text-indigo-600 rounded-xl md:rounded-[1.2rem] font-black text-lg md:text-2xl shadow-sm transition-all active:scale-90 border-2 border-indigo-50/50"
                        >
                          {num}
                        </button>
                      ))}
                      <button
                        onClick={() => setUserDecimalInput(prev => prev.slice(0, -1))}
                        className="w-full md:w-16 lg:w-20 h-12 md:h-16 lg:h-20 bg-rose-50 hover:bg-rose-100 text-rose-500 rounded-xl md:rounded-[1.2rem] flex items-center justify-center shadow-sm transition-all active:scale-90"
                      >
                        <Delete size={isMobile ? 20 : 32} />
                      </button>
                      <button
                        onClick={() => setUserDecimalInput(prev => (prev.length < 3 ? prev + '0' : prev))}
                        className="w-full md:w-16 lg:w-20 h-12 md:h-16 lg:h-20 bg-white hover:bg-indigo-50 text-indigo-600 rounded-xl md:rounded-[1.2rem] font-black text-lg md:text-2xl shadow-sm transition-all active:scale-90 border-2 border-indigo-50/50"
                      >
                        0
                      </button>
                      <button
                        onClick={() => {}}
                        className="w-full md:w-16 lg:w-20 h-12 md:h-16 lg:h-20 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl md:rounded-[1.2rem] flex items-center justify-center shadow-sm transition-all active:scale-90"
                      >
                        <Check size={isMobile ? 20 : 32} strokeWidth={3} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap lg:flex-nowrap items-center justify-center gap-1 md:gap-2 min-h-[100px] lg:min-h-[160px] w-full overflow-x-auto no-scrollbar">
                    {binary.map((bit, i) => bit === 1 && (
                      <div key={i} className="flex items-center gap-1 md:gap-2 px-2 md:px-3 py-1 md:py-2 bg-indigo-600 text-white rounded-lg md:rounded-xl shadow-sm shrink-0">
                        <span className="text-xs md:text-xl font-black tabular-nums">{Math.pow(2, 7 - i)}</span>
                        {binary.slice(i + 1).some(b => b === 1) && <span className="text-indigo-300 font-black text-xs md:text-sm">+</span>}
                      </div>
                    ))}
                    <div className="flex items-center gap-2 md:gap-4 px-2 md:px-4 py-2 md:py-4 shrink-0">
                      <span className="text-slate-300 font-black text-xl md:text-4xl">=</span>
                      <span className="text-4xl md:text-7xl lg:text-9xl font-black text-indigo-600 tabular-nums tracking-tighter leading-none min-w-[3ch] text-center">{decimal}</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <motion.div
                key="gameover"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="flex flex-col items-center gap-4"
              >
                <div className="flex flex-col items-center gap-2">
                  <div className="px-10 py-5 bg-rose-500 text-white rounded-3xl font-black text-xl uppercase tracking-widest shadow-xl shadow-rose-500/20">
                    Game Over
                  </div>
                  {isNewHighScore && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="text-amber-500 font-black uppercase tracking-tighter text-2xl"
                    >
                      New High Score!
                    </motion.div>
                  )}
                </div>
                <button
                  onClick={resetTool}
                  className="px-12 py-3 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-700 transition-all active:scale-95 shadow-xl shadow-indigo-500/20"
                >
                  Play Again
                </button>
              </motion.div>
            )}
        </div>
      </div>
    </ToolPanel>
  );
};

export default BinaryNumbers;
