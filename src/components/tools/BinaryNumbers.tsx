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
  }, [timerActive, timeLeft, generateTarget, settings.soundTheme, points, highScore]);

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
    );
  }, [mode, setHeaderActions]);

  return (
    <ToolPanel className="flex-col items-center justify-center p-4 lg:p-8 overflow-hidden">
      <div className="w-full max-w-6xl flex flex-col items-center gap-4 lg:gap-6 relative z-10">

        {/* Top Header Area - Fixed height to prevent layout shifts */}
        <div className="w-full h-[160px] flex flex-col items-center justify-center gap-4">
          {mode === 'challenge' && (
            <div className="w-full flex items-center justify-between px-4 lg:px-8">
              <div className="flex flex-col items-start">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Level</span>
                <div className="text-xl lg:text-2xl font-black text-indigo-600 bg-indigo-50/50 px-5 py-2 rounded-xl">
                  {level}
                </div>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Points</span>
                <div className="text-xl lg:text-2xl font-black text-indigo-600 bg-indigo-50/50 px-5 py-2 rounded-xl tabular-nums">
                  {points}
                </div>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">High Score</span>
                <div className="text-xl lg:text-2xl font-black text-amber-500 bg-amber-50/50 px-5 py-2 rounded-xl tabular-nums">
                  {highScore}
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col items-center gap-4 text-center">
            {mode === 'challenge' ? (
              <div className="flex flex-col items-center gap-3">
                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em]">Challenge Mode</span>
                <span className="text-5xl lg:text-6xl font-black text-indigo-600 uppercase tracking-tighter">
                  Question {questionNumber}
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-2">Practice Mode</span>
                <div className="text-2xl font-black text-indigo-400 bg-indigo-50 px-6 py-2 rounded-2xl uppercase tracking-widest">
                  Explore Binary
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Binary Bit Row Area */}
        <div className="w-full h-[280px] flex flex-col items-center justify-center">
          <div className="w-full grid grid-cols-4 md:grid-cols-8 gap-4 lg:gap-8 max-w-5xl">
            {binary.map((bit, idx) => {
              const val = Math.pow(2, 7 - idx);
              const isBinaryDisabled = isCorrect || (mode === 'challenge' && challengeType === 'toDecimal');
              
              return (
                <div key={idx} className="flex flex-col items-center gap-2">
                  <span className="text-[14px] font-black text-slate-300 tabular-nums uppercase">{val}</span>
                  <motion.button
                    whileHover={isBinaryDisabled ? {} : { y: -8, scale: 1.02 }}
                    whileTap={isBinaryDisabled ? {} : { scale: 0.98 }}
                    onClick={() => toggleBit(idx)}
                    disabled={isBinaryDisabled}
                    className={`w-full aspect-[2/3] rounded-[2rem] border-4 flex flex-col items-center justify-center gap-4 transition-all duration-500 ${bit === 1
                        ? 'bg-indigo-600 border-indigo-400 text-white'
                        : 'bg-white border-slate-50 text-slate-200 hover:border-indigo-100'
                      } ${isCorrect && bit === 1 ? 'bg-emerald-500 border-emerald-400' : ''} ${isBinaryDisabled ? 'cursor-default' : ''}`}
                  >
                    <AnimatePresence mode="wait">
                      <motion.span
                        key={bit}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="text-7xl lg:text-8xl font-black tabular-nums"
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
            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border-2 border-white shadow-inner">
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
        <div className="w-full max-w-6xl h-[460px] flex items-center justify-center">
            {gameState === 'playing' ? (
              <div
                className={`w-full h-full rounded-[2.5rem] px-6 py-4 lg:px-8 lg:py-6 border-4 flex flex-col md:flex-row items-center justify-center gap-8 lg:gap-16 transition-colors duration-300 ${isCorrect ? 'bg-emerald-50/50 border-emerald-400' : 'bg-slate-50/50 border-white'}`}
              >
                {mode === 'challenge' ? (
                  <div className="flex items-center gap-12 lg:gap-20">
                    <div className="flex flex-col items-center gap-4 w-[480px] flex-shrink-0">
                      <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em]">Decimal Number</span>
                      <div className="bg-white text-7xl lg:text-9xl font-black text-indigo-600 w-full h-[180px] lg:h-[220px] flex items-center justify-center rounded-[3.5rem] tabular-nums shadow-sm border-none">
                        {challengeType === 'toBinary' ? targetDecimal : (userDecimalInput || '???')}
                      </div>
                    </div>

                    {/* Number Pad - Larger Buttons */}
                    <div className={`grid grid-cols-3 gap-6 lg:gap-8 w-max ${challengeType === 'toBinary' ? 'opacity-30 pointer-events-none' : ''}`}>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                        <button
                          key={num}
                          onClick={() => setUserDecimalInput(prev => (prev.length < 3 ? prev + num : prev))}
                          className="w-20 h-20 bg-white hover:bg-indigo-50 text-indigo-600 rounded-[1.5rem] font-black text-3xl shadow-sm transition-all active:scale-90 border-2 border-indigo-50/50"
                        >
                          {num}
                        </button>
                      ))}
                      <button
                        onClick={() => setUserDecimalInput(prev => prev.slice(0, -1))}
                        className="w-20 h-20 bg-rose-50 hover:bg-rose-100 text-rose-500 rounded-[1.5rem] flex items-center justify-center shadow-sm transition-all active:scale-90"
                      >
                        <Delete size={32} />
                      </button>
                      <button
                        onClick={() => setUserDecimalInput(prev => (prev.length < 3 ? prev + '0' : prev))}
                        className="w-20 h-20 bg-white hover:bg-indigo-50 text-indigo-600 rounded-[1.5rem] font-black text-3xl shadow-sm transition-all active:scale-90 border-2 border-indigo-50/50"
                      >
                        0
                      </button>
                      <button
                        onClick={() => {}}
                        className="w-20 h-20 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[1.5rem] flex items-center justify-center shadow-sm transition-all active:scale-90"
                      >
                        <Check size={32} strokeWidth={3} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center justify-center gap-3 lg:gap-4">
                    {binary.map((bit, i) => bit === 1 && (
                      <div key={i} className="flex items-center gap-4 px-6 py-4 bg-indigo-600 text-white rounded-2xl shadow-sm">
                        <span className="text-2xl font-black tabular-nums">{Math.pow(2, 7 - i)}</span>
                        {binary.slice(i + 1).some(b => b === 1) && <span className="text-indigo-300 font-black">+</span>}
                      </div>
                    ))}
                    {!binary.every(b => b === 0) && (
                      <div className="flex items-center gap-4 px-6 py-4">
                        <span className="text-slate-300 font-black text-3xl">=</span>
                        <span className="text-6xl font-black text-indigo-600 tabular-nums tracking-tighter">{decimal}</span>
                      </div>
                    )}
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
                  <div className="px-10 py-5 bg-rose-500 text-white rounded-3xl font-black text-xl uppercase tracking-widest">
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
                  className="px-12 py-3 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-700 transition-all active:scale-95"
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
