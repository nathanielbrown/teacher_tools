import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Scale, CheckCircle2, XCircle, RefreshCcw, ChevronRight, Star, Trophy, ArrowLeft, Info, Calculator, Divide, Minus, X, Plus } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useSettings } from '../../contexts/SettingsContext';
import { audioEngine } from '../../utils/audio';
import { ToolHeader } from '../ToolHeader';

export const BalanceEquations = () => {
  const [gameState, setGameState] = useState('menu'); // 'menu', 'playing', 'result'
  const [yearLevel, setYearLevel] = useState('Year 3-4');
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState(null); // { isCorrect, correctAnswer }
  const [score, setScore] = useState(0);
  const [history, setHistory] = useState([]); // Track answers
  
  const { settings } = useSettings();

  const generateQuestion = (level) => {
    let leftSide = [];
    let rightSide = [];
    let answer = 0;
    let blankSide = 'right'; // which side has the '?'

    if (level === 'Year 1-2') {
      // Simple: A + B = C + ? (where C is usually 0 or small)
      const a = Math.floor(Math.random() * 10) + 1;
      const b = Math.floor(Math.random() * 10) + 1;
      const total = a + b;
      const c = Math.floor(Math.random() * total);
      answer = total - c;
      leftSide = [a, '+', b];
      rightSide = [c, '+', '?'];
    } else if (level === 'Year 3-4') {
      // Medium: A + B = C + ? or A - B = C + ?
      const isAdd = Math.random() > 0.5;
      if (isAdd) {
        const a = Math.floor(Math.random() * 20) + 5;
        const b = Math.floor(Math.random() * 20) + 5;
        const total = a + b;
        const c = Math.floor(Math.random() * (total - 5)) + 2;
        answer = total - c;
        leftSide = [a, '+', b];
        rightSide = [c, '+', '?'];
      } else {
        const a = Math.floor(Math.random() * 30) + 20;
        const b = Math.floor(Math.random() * 15) + 5;
        const total = a - b;
        const c = Math.floor(Math.random() * (total - 2)) + 1;
        answer = total - c;
        leftSide = [a, '-', b];
        rightSide = [c, '+', '?'];
      }
    } else if (level === 'Year 5-6') {
      // Hard: Mixed operations. A * B = C + ?
      const isMult = Math.random() > 0.5;
      if (isMult) {
        const a = Math.floor(Math.random() * 10) + 2;
        const b = Math.floor(Math.random() * 10) + 2;
        const total = a * b;
        const c = Math.floor(Math.random() * (total - 5)) + 2;
        answer = total - c;
        leftSide = [a, '×', b];
        rightSide = [c, '+', '?'];
      } else {
        const a = Math.floor(Math.random() * 50) + 10;
        const b = Math.floor(Math.random() * 50) + 10;
        const total = a + b;
        const c = Math.floor(Math.random() * 10) + 2;
        const d = Math.floor(Math.random() * 5) + 2;
        // Total = C * D + ?
        answer = total - (c * d);
        leftSide = [a, '+', b];
        rightSide = [c, '×', d, '+', '?'];
      }
    } else {
      // Year 7+: Multi-step. (A + B) * C = D + ?
      const a = Math.floor(Math.random() * 10) + 2;
      const b = Math.floor(Math.random() * 10) + 2;
      const c = Math.floor(Math.random() * 5) + 2;
      const total = (a + b) * c;
      const d = Math.floor(Math.random() * (total / 2)) + 10;
      answer = total - d;
      leftSide = ['(', a, '+', b, ')', '×', c];
      rightSide = [d, '+', '?'];
    }

    return { leftSide, rightSide, answer };
  };

  const startGame = (level) => {
    setYearLevel(level);
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
    } else if (userAnswer.length < 5) {
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

  return (
    <div className="w-full mx-auto h-full flex flex-col p-4 pt-2 pb-8 space-y-6 font-['Outfit']">
      <ToolHeader
        title="Balance Equations"
        icon={Scale}
        description="Make sure both sides are equal!"
        infoContent={
          <>
            <p>
              <strong className="text-white block mb-1">Goal</strong>
              Identify the number that makes the left side equal to the right side.
            </p>
            <p>
              <strong className="text-white block mb-1">Year Levels</strong>
              Difficulty increases with each year level, introducing subtraction, multiplication, and brackets.
            </p>
          </>
        }
      >
        {gameState === 'playing' && (
           <div className="flex items-center gap-4 bg-white px-6 py-2 rounded-2xl shadow-sm border border-gray-100">
             <div className="text-gray-400 font-bold text-xs uppercase tracking-widest">Progress</div>
             <div className="flex gap-1">
               {Array.from({ length: 10 }).map((_, i) => (
                 <div 
                   key={i} 
                   className={`w-2.5 h-2.5 rounded-full transition-colors ${
                     i < currentIndex ? (history[i]?.isCorrect ? 'bg-green-500' : 'bg-red-500') :
                     i === currentIndex ? 'bg-indigo-500 animate-pulse' : 'bg-slate-200'
                   }`}
                 />
               ))}
             </div>
           </div>
        )}
        {gameState !== 'menu' && (
          <button 
            onClick={() => setGameState('menu')}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400"
            title="Return to Menu"
          >
            <ArrowLeft size={20} />
          </button>
        )}
      </ToolHeader>

      {gameState === 'menu' && (
        <div className="flex-1 flex flex-col items-center justify-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-8 bg-white/80 backdrop-blur-md p-12 rounded-[3rem] shadow-2xl border border-white/20 w-full max-w-4xl"
          >
            <div className="bg-indigo-50 w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Scale size={48} className="text-indigo-600" />
            </div>
            <h1 className="text-4xl font-black text-gray-800 tracking-tight">Select Year Level</h1>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
              {[
                { level: 'Year 1-2', icon: '🌱', desc: 'Basic Addition', color: 'bg-green-50 border-green-200 text-green-700' },
                { level: 'Year 3-4', icon: '🌿', desc: 'Addition & Subtraction', color: 'bg-blue-50 border-blue-200 text-blue-700' },
                { level: 'Year 5-6', icon: '🌳', desc: 'Mixed Operations', color: 'bg-purple-50 border-purple-200 text-purple-700' },
                { level: 'Year 7+', icon: '🏔️', desc: 'Complex Equations', color: 'bg-orange-50 border-orange-200 text-orange-700' }
              ].map((item) => (
                <button
                  key={item.level}
                  onClick={() => startGame(item.level)}
                  className={`group relative p-6 border-2 rounded-3xl transition-all hover:scale-105 text-left flex items-center gap-4 ${item.color}`}
                >
                  <div className="text-4xl">{item.icon}</div>
                  <div>
                    <div className="text-xl font-black">{item.level}</div>
                    <div className="opacity-60 font-bold">{item.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      )}

      {gameState === 'result' && (
        <div className="flex-1 flex flex-col items-center justify-center">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white p-12 rounded-[3rem] shadow-2xl border border-gray-100 w-full max-w-2xl text-center space-y-8"
          >
            <div className="bg-yellow-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto">
              <Trophy size={48} className="text-yellow-600" />
            </div>
            <div className="space-y-2">
              <h2 className="text-4xl font-black text-gray-800">Session Complete!</h2>
              <p className="text-xl text-gray-500 font-bold">You balanced {score} out of 10 equations</p>
            </div>

            <div className="flex justify-center gap-2">
              {Array.from({ length: 10 }).map((_, i) => (
                <div 
                   key={i} 
                   className={`w-4 h-4 rounded-full ${i < score ? 'bg-green-500' : 'bg-gray-200'}`}
                />
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button
                onClick={() => setGameState('menu')}
                className="flex-1 py-4 bg-gray-100 text-gray-600 font-bold rounded-2xl hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
              >
                <ArrowLeft size={20} /> Menu
              </button>
              <button
                onClick={() => startGame(yearLevel)}
                className="flex-1 py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-200"
              >
                <RefreshCcw size={20} /> Try Again
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {gameState === 'playing' && (
        <div className="flex-1 flex flex-col lg:flex-row gap-8 items-center justify-center">
          {/* Equation Area */}
          <div className="flex-1 w-full bg-white rounded-[3rem] shadow-xl border border-gray-100 p-8 flex flex-col items-center justify-center space-y-12 min-h-[400px]">
            <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12 w-full justify-center">
              {/* Left Side */}
              <div className="flex items-center gap-4 md:gap-6 flex-wrap justify-center bg-slate-50 p-6 rounded-[2rem] border-2 border-slate-100 min-w-[200px]">
                {questions[currentIndex].leftSide.map((part, i) => (
                  <span key={i} className={`text-4xl md:text-5xl font-black ${typeof part === 'number' ? 'text-gray-800' : 'text-indigo-400'}`}>
                    {part}
                  </span>
                ))}
              </div>

              <div className="text-6xl md:text-7xl font-black text-indigo-600">=</div>

              {/* Right Side */}
              <div className="flex items-center gap-4 md:gap-6 flex-wrap justify-center bg-indigo-50/30 p-6 rounded-[2rem] border-2 border-indigo-100 min-w-[200px]">
                {questions[currentIndex].rightSide.map((part, i) => (
                  <React.Fragment key={i}>
                    {part === '?' ? (
                      <motion.div
                        animate={feedback ? { 
                          scale: [1, 1.05, 1],
                          backgroundColor: feedback.isCorrect ? '#dcfce7' : '#fee2e2'
                        } : {}}
                        className={`w-20 h-20 md:w-28 md:h-28 rounded-3xl border-4 flex items-center justify-center text-4xl md:text-5xl font-black transition-colors ${
                          feedback ? (feedback.isCorrect ? 'border-green-500 text-green-600' : 'border-red-500 text-red-600') :
                          'border-indigo-200 bg-white text-indigo-600 shadow-inner'
                        }`}
                      >
                        {userAnswer || (feedback ? '' : '?')}
                      </motion.div>
                    ) : (
                      <span className={`text-4xl md:text-5xl font-black ${typeof part === 'number' ? 'text-gray-800' : 'text-indigo-400'}`}>
                        {part}
                      </span>
                    )}
                  </React.Fragment>
                ))}
              </div>
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
                        Perfect Balance!
                      </>
                    ) : (
                      <>
                        <XCircle size={32} />
                        Not quite... the answer was {feedback.correctAnswer}
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Numpad Area */}
          <div className="w-full lg:w-80 bg-white p-6 rounded-[3rem] shadow-xl border border-gray-100">
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 'clear', 0].map((val) => (
                <button
                  key={val}
                  onClick={() => typeof val === 'number' ? handleNumpad(val.toString()) : handleNumpad(val)}
                  className={`h-16 rounded-2xl text-2xl font-bold transition-all active:scale-95 ${
                    val === 'clear' ? 'bg-red-50 text-red-500 hover:bg-red-100 col-span-1' :
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
                'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200'
              }`}
            >
              {feedback ? (
                <>Next Equation <ChevronRight size={24} /></>
              ) : (
                <>Check Balance <CheckCircle2 size={24} /></>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
