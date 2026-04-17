import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cpu, Trophy, RotateCcw, ArrowLeft, Gamepad2, Info, CheckCircle2, Zap, Star } from 'lucide-react';
import confetti from 'canvas-confetti';
import { audioEngine } from '../../utils/audio';
import { useSettings } from '../../contexts/SettingsContext';

const BITS = [128, 64, 32, 16, 8, 4, 2, 1];

export const BinaryTool = () => {
  const [bits, setBits] = useState(Array(8).fill(false));
  const [gameState, setGameState] = useState('freeplay'); // 'freeplay', 'challenge', 'gameover'
  const [challengeType, setChallengeType] = useState('dec-to-bin'); // 'dec-to-bin', 'bin-to-dec'
  const [targetValue, setTargetValue] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => parseInt(localStorage.getItem('binary_highscore') || '0'));
  const [timeLeft, setTimeLeft] = useState(10000);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showLevelUp, setShowLevelUp] = useState(false);
  
  const { settings } = useSettings();

  const currentLevel = useMemo(() => Math.floor(score / 1000) + 1, [score]);
  const activeBitsCount = useMemo(() => Math.min(8, currentLevel + 2), [currentLevel]);
  
  const decimalValue = useMemo(() => {
    return bits.reduce((acc, bit, i) => acc + (bit ? BITS[i] : 0), 0);
  }, [bits]);

  // Timer logic
  useEffect(() => {
    let timer;
    if (gameState === 'challenge' && !showSuccess && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 100) {
            setGameState('gameover');
            return 0;
          }
          return prev - 100;
        });
      }, 100);
    }
    return () => clearInterval(timer);
  }, [gameState, showSuccess, timeLeft]);

  // High score persistence
  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem('binary_highscore', score.toString());
    }
  }, [score, highScore]);

  // Level Up Notification
  useEffect(() => {
    if (currentLevel > 1 && gameState === 'challenge') {
      setShowLevelUp(true);
      const timer = setTimeout(() => setShowLevelUp(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [currentLevel, gameState]);

  const toggleBit = (index) => {
    if (gameState === 'gameover' || (gameState === 'challenge' && challengeType === 'bin-to-dec')) return;
    // Check if bit is active for current level
    const bitIndexFromRight = 7 - index;
    if (gameState === 'challenge' && bitIndexFromRight >= activeBitsCount) return;

    audioEngine.playTick(settings.soundTheme);
    const newBits = [...bits];
    newBits[index] = !newBits[index];
    setBits(newBits);
  };

  const handleNumpad = (digit) => {
    if (gameState !== 'challenge' || challengeType !== 'bin-to-dec' || showSuccess) return;
    audioEngine.playTick(settings.soundTheme);
    if (digit === 'clear') setInputValue('');
    else if (inputValue.length < 3) setInputValue(prev => prev + digit);
  };

  const startChallenge = () => {
    setScore(0);
    setGameState('challenge');
    nextChallenge(0); // Pass 0 as score to ensure we start at level 1 logic
  };

  const nextChallenge = (currentScore = score) => {
    const level = Math.floor(currentScore / 1000) + 1;
    const bitsUsed = Math.min(8, level + 2);
    const maxVal = Math.pow(2, bitsUsed) - 1;
    
    const type = Math.random() > 0.5 ? 'dec-to-bin' : 'bin-to-dec';
    const target = Math.floor(Math.random() * (maxVal - 1)) + 1;
    
    setChallengeType(type);
    setTargetValue(target);
    setInputValue('');
    
    if (type === 'dec-to-bin') {
      setBits(Array(8).fill(false));
    } else {
      const targetBits = target.toString(2).padStart(8, '0').split('').map(b => b === '1');
      setBits(targetBits);
    }
    
    setTimeLeft(10000);
    setShowSuccess(false);
  };

  useEffect(() => {
    if (gameState === 'challenge' && !showSuccess) {
      const isCorrect = challengeType === 'dec-to-bin' 
        ? decimalValue === targetValue 
        : parseInt(inputValue) === targetValue;

      if (isCorrect) {
        setShowSuccess(true);
        const roundScore = Math.floor(timeLeft / 100);
        const newTotalScore = score + roundScore;
        setScore(newTotalScore);
        
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.7 }
        });

        setTimeout(() => nextChallenge(newTotalScore), 800);
      }
    }
  }, [decimalValue, inputValue, targetValue, gameState, showSuccess, timeLeft, challengeType, score]);

  return (
    <div className="max-w-6xl mx-auto h-full flex flex-col p-4 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center bg-white/50 backdrop-blur-sm p-4 rounded-[2rem] border border-white/50">
        <div className="flex items-center gap-4">
          <div className="bg-cyan-500 p-3 rounded-2xl text-white shadow-lg shadow-cyan-200">
            <Cpu size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-800 leading-none">Binary Explorer</h1>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Computer Science Tool</p>
          </div>
        </div>

        <div className="flex gap-4 items-center">
          {gameState === 'challenge' && (
            <div className="hidden md:flex items-center gap-2 bg-indigo-50 px-4 py-2 rounded-xl border border-indigo-100">
              <Star size={16} className="text-indigo-600 fill-indigo-600" />
              <span className="font-black text-indigo-600">LEVEL {currentLevel}</span>
            </div>
          )}
          <div className="flex gap-2">
            <button
              onClick={() => { setGameState('freeplay'); setTargetValue(null); }}
              className={`px-6 py-2 rounded-xl font-bold transition-all ${gameState === 'freeplay' ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-200' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
            >
              Free Play
            </button>
            <button
              onClick={startChallenge}
              className={`px-6 py-2 rounded-xl font-bold transition-all ${gameState === 'challenge' || gameState === 'gameover' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
            >
              Start Challenge
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main Board */}
        <div className="lg:col-span-3 flex flex-col gap-8">
          {/* Binary Bits Display */}
          <div className="bg-slate-900 rounded-[3rem] shadow-2xl border-8 border-slate-800 relative overflow-hidden flex flex-col items-center justify-center space-y-12 min-h-[400px] p-10">
            {/* Progress Bar Background */}
            {gameState === 'challenge' && (
              <motion.div 
                className="absolute inset-0 bg-cyan-500/10 origin-left z-0"
                style={{ scaleX: timeLeft / 10000 }}
                transition={{ type: 'spring', bounce: 0, duration: 0.2 }}
              />
            )}

            <div className="grid grid-cols-4 md:grid-cols-8 gap-4 w-full z-10">
              {BITS.map((value, i) => {
                const bitIndexFromRight = 7 - i;
                const isActive = gameState !== 'challenge' || bitIndexFromRight < activeBitsCount;
                
                return (
                  <div key={i} className={`flex flex-col items-center gap-4 transition-opacity duration-500 ${isActive ? 'opacity-100' : 'opacity-20'}`}>
                    <div className="text-slate-500 font-black text-sm uppercase tracking-tighter">{value}</div>
                    <motion.button
                      whileHover={!isActive || (gameState === 'challenge' && challengeType === 'bin-to-dec') ? {} : { scale: 1.05 }}
                      whileTap={!isActive || (gameState === 'challenge' && challengeType === 'bin-to-dec') ? {} : { scale: 0.95 }}
                      disabled={gameState === 'gameover' || (gameState === 'challenge' && challengeType === 'bin-to-dec') || !isActive}
                      onClick={() => toggleBit(i)}
                      className={`
                        w-full aspect-square rounded-2xl md:rounded-3xl border-4 transition-all duration-300
                        flex flex-col items-center justify-center gap-1
                        ${bits[i] 
                          ? 'bg-cyan-500 border-cyan-400 shadow-[0_0_30px_rgba(6,182,212,0.5)]' 
                          : 'bg-slate-800 border-slate-700 text-slate-600 hover:border-slate-600'}
                        ${gameState === 'challenge' && challengeType === 'bin-to-dec' ? 'cursor-default' : isActive ? 'cursor-pointer' : 'cursor-not-allowed'}
                        ${gameState === 'gameover' ? 'opacity-50 grayscale' : ''}
                      `}
                    >
                      <span className={`text-4xl md:text-5xl font-black ${bits[i] ? 'text-white' : 'text-slate-700'}`}>
                        {bits[i] ? '1' : '0'}
                      </span>
                      <div className={`w-2 h-2 rounded-full ${bits[i] ? 'bg-white animate-pulse' : 'bg-slate-700'}`} />
                    </motion.button>
                  </div>
                );
              })}
            </div>

            {/* Math Breakdown */}
            <div className={`flex flex-wrap justify-center gap-x-4 gap-y-2 text-slate-400 font-mono text-lg z-10 transition-opacity ${gameState === 'challenge' && challengeType === 'bin-to-dec' ? 'opacity-0' : 'opacity-100'}`}>
              {bits.some(b => b) ? (
                bits.map((b, i) => b ? (
                  <React.Fragment key={i}>
                    <span className="text-cyan-400 font-bold">{BITS[i]}</span>
                    {i < bits.lastIndexOf(true) && <span>+</span>}
                  </React.Fragment>
                ) : null)
              ) : (
                <span className="text-slate-600 italic">No bits active</span>
              )}
              {bits.some(b => b) && (
                <>
                  <span className="text-white">=</span>
                  <span className="text-white font-black">{decimalValue}</span>
                </>
              )}
            </div>

            {/* Overlays */}
            <AnimatePresence>
              {gameState === 'gameover' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm z-20 flex flex-col items-center justify-center space-y-6"
                >
                  <div className="bg-red-500 p-6 rounded-full text-white">
                    <RotateCcw size={48} />
                  </div>
                  <h2 className="text-5xl font-black text-white">TIME'S UP!</h2>
                  <div className="text-center">
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">Final Score</p>
                    <p className="text-6xl font-black text-white">{score}</p>
                  </div>
                  <button
                    onClick={startChallenge}
                    className="px-10 py-4 bg-cyan-500 text-white font-black rounded-2xl hover:bg-cyan-600 transition-all shadow-xl shadow-cyan-500/20"
                  >
                    TRY AGAIN
                  </button>
                </motion.div>
              )}

              {showLevelUp && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.5 }}
                  className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none"
                >
                  <div className="bg-yellow-400 text-slate-900 px-12 py-8 rounded-[3rem] shadow-[0_0_50px_rgba(250,204,21,0.5)] border-4 border-white flex flex-col items-center gap-2">
                    <Star size={64} className="fill-slate-900" />
                    <h2 className="text-5xl font-black tracking-tighter italic uppercase">Level {currentLevel}!</h2>
                    <p className="font-bold opacity-80 uppercase tracking-widest text-sm">More bits unlocked</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Target / Game Info */}
          <AnimatePresence mode="wait">
            {gameState === 'challenge' ? (
              <motion.div
                key="challenge"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-indigo-600 p-8 rounded-[2.5rem] shadow-xl text-white flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden"
              >
                <div className="flex items-center gap-6 z-10">
                  <div className="bg-white/20 p-4 rounded-3xl backdrop-blur-sm">
                    {challengeType === 'dec-to-bin' ? <Trophy size={40} /> : <Gamepad2 size={40} />}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold opacity-80 uppercase tracking-widest text-sm">
                      {challengeType === 'dec-to-bin' ? 'Represent this Decimal' : 'What is the Decimal Value?'}
                    </h2>
                    <div className="text-6xl font-black">
                      {challengeType === 'dec-to-bin' ? targetValue : (
                        <div className="bg-white/10 px-6 py-2 rounded-2xl border border-white/20 min-w-[200px] text-center">
                          {inputValue || '?'}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="h-full w-px bg-white/20 hidden md:block self-stretch z-10" />

                <div className="text-center md:text-right z-10">
                  <div className="text-sm font-bold opacity-80 uppercase tracking-widest mb-1">Current Score</div>
                  <div className="text-5xl font-black tabular-nums">{score}</div>
                </div>

                {showSuccess && (
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="absolute inset-0 bg-green-500 flex items-center justify-center gap-4 z-20"
                  >
                    <CheckCircle2 size={48} />
                    <span className="text-4xl font-black">+{Math.floor(timeLeft / 100)} PTS</span>
                  </motion.div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="freeplay"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-100 flex items-center gap-6"
              >
                <div className="bg-cyan-100 p-4 rounded-3xl text-cyan-600">
                  <Info size={32} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-gray-800">Learning Binary</h2>
                  <p className="text-gray-500 font-medium">
                    Try the Challenge mode to practice converting between Binary and Decimal. Every 1000 points unlocks a new bit!
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sidebar Info & Numpad */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-gray-100 flex flex-col justify-center text-center space-y-4">
            <h3 className="text-gray-400 font-bold uppercase tracking-widest text-xs">High Score</h3>
            <div className="text-4xl font-black text-indigo-600 tabular-nums">
              {highScore}
            </div>
            
            <div className="h-px bg-gray-100 my-2" />
            
            {gameState === 'challenge' && challengeType === 'bin-to-dec' ? (
              <div className="space-y-4">
                <h3 className="text-gray-400 font-bold uppercase tracking-widest text-xs">Enter Value</h3>
                <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map(n => (
                    <button
                      key={n}
                      onClick={() => handleNumpad(n.toString())}
                      className="p-3 bg-gray-50 hover:bg-cyan-500 hover:text-white rounded-xl font-black text-xl transition-all active:scale-95"
                    >
                      {n}
                    </button>
                  ))}
                  <button
                    onClick={() => handleNumpad('clear')}
                    className="col-span-2 p-3 bg-red-50 hover:bg-red-500 hover:text-white rounded-xl font-black text-lg transition-all active:scale-95 text-red-500"
                  >
                    CLEAR
                  </button>
                </div>
              </div>
            ) : (
              <>
                <h3 className="text-gray-400 font-bold uppercase tracking-widest text-xs">Current Decimal</h3>
                <div className={`text-7xl font-black text-gray-800 tabular-nums transition-opacity ${gameState === 'challenge' && challengeType === 'bin-to-dec' ? 'opacity-0' : 'opacity-100'}`}>
                  {decimalValue}
                </div>
                <div className={`pt-2 transition-opacity ${gameState === 'challenge' && challengeType === 'bin-to-dec' ? 'opacity-0' : 'opacity-100'}`}>
                  <span className="bg-gray-100 text-gray-500 px-4 py-2 rounded-xl font-mono font-bold">
                    0x{decimalValue.toString(16).toUpperCase().padStart(2, '0')}
                  </span>
                </div>
              </>
            )}
          </div>
          
          <button
            onClick={() => { setBits(Array(8).fill(false)); setInputValue(''); }}
            className="w-full py-4 bg-gray-100 text-gray-500 font-black rounded-2xl hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
          >
            <RotateCcw size={20} /> RESET
          </button>
        </div>
      </div>
      
      <div className="bg-slate-900/5 p-4 rounded-3xl border border-slate-900/10 flex items-center gap-4 text-slate-600 italic text-sm">
        <Zap size={20} className="text-yellow-500" />
        <strong>Level {currentLevel}:</strong> You are currently using {activeBitsCount} bits. Reach {currentLevel * 1000} points to unlock the next bit!
      </div>
    </div>
  );
};
