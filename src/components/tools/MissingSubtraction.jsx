import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calculator, CheckCircle2, XCircle, RefreshCcw, ChevronRight, Star, Trophy, ArrowLeft, Minus } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useSettings } from '../../contexts/SettingsContext';
import { audioEngine } from '../../utils/audio';

export const MissingSubtraction = () => {
  const [gameState, setGameState] = useState('menu'); // 'menu', 'playing', 'result'
  const [difficulty, setDifficulty] = useState(10);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState(null); // { isCorrect, correctAnswer }
  const [score, setScore] = useState(0);
  const [history, setHistory] = useState([]); // Track answers
  
  const { settings } = useSettings();

  const generateQuestion = (max) => {
    const a = Math.floor(Math.random() * (max - 1)) + 2; // Minuend
    const b = Math.floor(Math.random() * (a - 1)) + 1; // Subtrahend
    const c = a - b; // Difference
    const blankIndex = Math.floor(Math.random() * 3);
    return { a, b, c, blankIndex, answer: [a, b, c][blankIndex] };
  };

  const startGame = (level) => {
    setDifficulty(level);
    const newQuestions = Array.from({ length: 10 }, () => generateQuestion(level));
    setQuestions(newQuestions);
    setCurrentIndex(0);
    setScore(0);
    setHistory([]);
    setUserAnswer('');
    setFeedback(null);
    setGameState('playing');
  };

  const handleCheck = () => {
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
  };

  const handleNext = () => {
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
  };

  const handleNumpad = (val) => {
    if (feedback) return;
    if (val === 'clear') {
      setUserAnswer('');
    } else if (userAnswer.length < 3) {
      setUserAnswer(prev => prev + val);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (gameState !== 'playing') return;
      if (e.key >= '0' && e.key <= '9') handleNumpad(e.key);
      if (e.key === 'Enter') feedback ? handleNext() : handleCheck();
      if (e.key === 'Backspace') handleNumpad('clear');
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, userAnswer, feedback]);

  if (gameState === 'menu') {
    return (
      <div className="max-w-4xl mx-auto h-full flex flex-col items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-8 bg-white/80 backdrop-blur-md p-12 rounded-[3rem] shadow-2xl border border-white/20 w-full"
        >
          <div className="bg-blue-500/10 w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Minus size={48} className="text-blue-600" />
          </div>
          <h1 className="text-5xl font-black text-gray-800 tracking-tight">Missing Subtraction</h1>
          <p className="text-xl text-gray-500 font-medium max-w-md mx-auto">
            Master your subtraction by finding the missing number.
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
            <button
              onClick={() => startGame(10)}
              className="group relative p-8 bg-sky-50 hover:bg-sky-100 border-2 border-sky-200 rounded-3xl transition-all hover:scale-105"
            >
              <div className="text-4xl mb-2">❄️</div>
              <div className="text-2xl font-black text-sky-700">Numbers 1-10</div>
              <div className="text-sky-600/60 font-bold">Perfect for starters</div>
            </button>
            <button
              onClick={() => startGame(100)}
              className="group relative p-8 bg-indigo-50 hover:bg-indigo-100 border-2 border-indigo-200 rounded-3xl transition-all hover:scale-105"
            >
              <div className="text-4xl mb-2">🌊</div>
              <div className="text-2xl font-black text-indigo-700">Numbers 1-100</div>
              <div className="text-indigo-600/60 font-bold">The ultimate challenge</div>
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (gameState === 'result') {
    return (
      <div className="max-w-4xl mx-auto h-full flex flex-col items-center justify-center p-4">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white p-12 rounded-[3rem] shadow-2xl border border-gray-100 w-full text-center space-y-8"
        >
          <div className="bg-blue-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto">
            <Trophy size={48} className="text-blue-600" />
          </div>
          <div className="space-y-2">
            <h2 className="text-4xl font-black text-gray-800">Great Effort!</h2>
            <p className="text-xl text-gray-500 font-bold">You scored {score} out of 10</p>
          </div>

          <div className="flex justify-center gap-2">
            {Array.from({ length: 10 }).map((_, i) => (
              <div 
                key={i} 
                className={`w-4 h-4 rounded-full ${i < score ? 'bg-blue-500' : 'bg-gray-200'}`}
              />
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <button
              onClick={() => setGameState('menu')}
              className="flex-1 py-4 bg-gray-100 text-gray-600 font-bold rounded-2xl hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
            >
              <ArrowLeft size={20} /> Main Menu
            </button>
            <button
              onClick={() => startGame(difficulty)}
              className="flex-1 py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-200"
            >
              <RefreshCcw size={20} /> Play Again
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  const current = questions[currentIndex];
  const equation = [
    current.blankIndex === 0 ? '?' : current.a,
    '-',
    current.blankIndex === 1 ? '?' : current.b,
    '=',
    current.blankIndex === 2 ? '?' : current.c
  ];

  return (
    <div className="max-w-4xl mx-auto h-full flex flex-col p-4 space-y-6">
      <div className="flex justify-between items-center px-4">
        <button 
          onClick={() => setGameState('menu')}
          className="p-3 hover:bg-gray-100 rounded-2xl transition-colors text-gray-400"
        >
          <ArrowLeft size={24} />
        </button>
        <div className="flex items-center gap-4 bg-white px-6 py-2 rounded-2xl shadow-sm border border-gray-100">
          <div className="text-gray-400 font-bold text-sm uppercase tracking-widest">Progress</div>
          <div className="flex gap-1">
            {Array.from({ length: 10 }).map((_, i) => (
              <div 
                key={i} 
                className={`w-3 h-3 rounded-full transition-colors ${
                  i < currentIndex ? (history[i]?.isCorrect ? 'bg-green-500' : 'bg-red-500') :
                  i === currentIndex ? 'bg-blue-500 animate-pulse' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
        </div>
        <div className="w-12" />
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-8 items-center justify-center">
        <div className="flex-1 w-full bg-white rounded-[3rem] shadow-xl border border-gray-100 p-12 flex flex-col items-center justify-center space-y-12 min-h-[400px]">
          <div className="flex items-center gap-6 md:gap-8 flex-wrap justify-center">
            {equation.map((part, i) => (
              <React.Fragment key={i}>
                {part === '?' ? (
                  <motion.div
                    animate={feedback ? { 
                      scale: [1, 1.05, 1],
                      backgroundColor: feedback.isCorrect ? '#dcfce7' : '#fee2e2'
                    } : {}}
                    className={`w-24 h-24 md:w-32 md:h-32 rounded-3xl border-4 flex items-center justify-center text-5xl md:text-6xl font-black transition-colors ${
                      feedback ? (feedback.isCorrect ? 'border-green-500 text-green-600' : 'border-red-500 text-red-600') :
                      'border-blue-500/20 bg-blue-50 text-blue-600'
                    }`}
                  >
                    {userAnswer || (feedback ? '' : '?')}
                  </motion.div>
                ) : (
                  <span className={`text-5xl md:text-7xl font-black ${typeof part === 'number' ? 'text-gray-800' : 'text-gray-300'}`}>
                    {part}
                  </span>
                )}
              </React.Fragment>
            ))}
          </div>

          <div className="h-12 flex items-center">
            <AnimatePresence mode="wait">
              {feedback && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`flex items-center gap-3 font-bold text-2xl ${feedback.isCorrect ? 'text-green-600' : 'text-red-600'}`}
                >
                  {feedback.isCorrect ? (
                    <>
                      <CheckCircle2 size={32} />
                      Perfect!
                    </>
                  ) : (
                    <>
                      <XCircle size={32} />
                      It was {feedback.correctAnswer}
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="w-full lg:w-80 bg-white p-6 rounded-[3rem] shadow-xl border border-gray-100">
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 'clear', 0].map((val) => (
              <button
                key={val}
                onClick={() => typeof val === 'number' ? handleNumpad(val.toString()) : handleNumpad(val)}
                className={`h-16 rounded-2xl text-2xl font-bold transition-all active:scale-95 ${
                  val === 'clear' ? 'bg-red-50 text-red-500 hover:bg-red-100' :
                  'bg-gray-50 text-gray-700 hover:bg-gray-100'
                } ${val === 0 ? 'col-span-2' : ''}`}
              >
                {val === 'clear' ? 'C' : val}
              </button>
            ))}
          </div>
          <button
            onClick={feedback ? handleNext : handleCheck}
            disabled={!userAnswer && !feedback}
            className={`w-full mt-6 py-4 rounded-2xl text-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg ${
              !userAnswer && !feedback ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none' :
              feedback ? 'bg-gray-800 text-white hover:bg-gray-900 shadow-gray-200' :
              'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200'
            }`}
          >
            {feedback ? (
              <>Next Question <ChevronRight size={24} /></>
            ) : (
              <>Check Answer <CheckCircle2 size={24} /></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
