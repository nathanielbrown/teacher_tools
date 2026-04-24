import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, RotateCcw, Brain, Timer, HelpCircle, ChevronRight } from 'lucide-react';
import confetti from 'canvas-confetti';
import { audioEngine } from '../../utils/audio';
import { useSettings } from '../../contexts/SettingsContext';
import { ToolHeader } from '../ToolHeader';

const TOPICS = {
  animals: {
    name: 'Animals',
    icon: '🦁',
    color: 'emerald',
    items: [
      { emoji: '🐶', name: 'Dog' }, { emoji: '🐱', name: 'Cat' }, { emoji: '🐭', name: 'Mouse' },
      { emoji: '🐹', name: 'Hamster' }, { emoji: '🐰', name: 'Rabbit' }, { emoji: '🦊', name: 'Fox' },
      { emoji: '🐻', name: 'Bear' }, { emoji: '🐼', name: 'Panda' }, { emoji: '🐨', name: 'Koala' },
      { emoji: '🐯', name: 'Tiger' }, { emoji: '🦁', name: 'Lion' }, { emoji: '🐮', name: 'Cow' },
      { emoji: '🐷', name: 'Pig' }, { emoji: '🐸', name: 'Frog' }, { emoji: '🐵', name: 'Monkey' },
      { emoji: '🐔', name: 'Chicken' }, { emoji: '🐧', name: 'Penguin' }, { emoji: '🐦', name: 'Bird' }
    ]
  },
  fruits: {
    name: 'Fruits',
    icon: '🍎',
    color: 'rose',
    items: [
      { emoji: '🍎', name: 'Apple' }, { emoji: '🍌', name: 'Banana' }, { emoji: '🍉', name: 'Watermelon' },
      { emoji: '🍇', name: 'Grapes' }, { emoji: '🍓', name: 'Strawberry' }, { emoji: '🍒', name: 'Cherries' },
      { emoji: '🍍', name: 'Pineapple' }, { emoji: '🥝', name: 'Kiwi' }, { emoji: '🥭', name: 'Mango' },
      { emoji: '🍑', name: 'Peach' }, { emoji: '🍊', name: 'Orange' }, { emoji: '🍋', name: 'Lemon' },
      { emoji: '🍈', name: 'Melon' }, { emoji: '🍏', name: 'Green Apple' }, { emoji: '🍐', name: 'Pear' }
    ]
  },
  space: {
    name: 'Space',
    icon: '🚀',
    color: 'indigo',
    items: [
      { emoji: '🚀', name: 'Rocket' }, { emoji: '🛸', name: 'UFO' }, { emoji: '🛰', name: 'Satellite' },
      { emoji: '🪐', name: 'Planet' }, { emoji: '🌟', name: 'Star' }, { emoji: '☄️', name: 'Comet' },
      { emoji: '🌙', name: 'Moon' }, { emoji: '🌞', name: 'Sun' }, { emoji: '🌍', name: 'Earth' },
      { emoji: '👨‍🚀', name: 'Astronaut' }, { emoji: '🔭', name: 'Telescope' }, { emoji: '🌌', name: 'Milky Way' }
    ]
  },
  vehicles: {
    name: 'Vehicles',
    icon: '🚗',
    color: 'blue',
    items: [
      { emoji: '🚗', name: 'Car' }, { emoji: '🚕', name: 'Taxi' }, { emoji: '🚙', name: 'SUV' },
      { emoji: '🚌', name: 'Bus' }, { emoji: '🏎️', name: 'Race Car' }, { emoji: '🚓', name: 'Police Car' },
      { emoji: '🚑', name: 'Ambulance' }, { emoji: '🚒', name: 'Fire Engine' }, { emoji: '🚜', name: 'Tractor' },
      { emoji: '🛴', name: 'Scooter' }, { emoji: '🚲', name: 'Bicycle' }, { emoji: '✈️', name: 'Airplane' },
      { emoji: '🚁', name: 'Helicopter' }, { emoji: '🚢', name: 'Ship' }, { emoji: '🚂', name: 'Train' }
    ]
  }
};

const QUESTIONS_PER_GAME = 10;
const TIME_PER_QUESTION = 10; // seconds

export const GuessingGame = () => {
  const { settings } = useSettings();
  const [status, setStatus] = useState('setup'); // setup, playing, finished
  const [topicKey, setTopicKey] = useState(null);
  
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TIME_PER_QUESTION);
  
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  
  const timerRef = useRef(null);

  const initGame = useCallback((key) => {
    const topic = TOPICS[key];
    const shuffledItems = [...topic.items].sort(() => Math.random() - 0.5);
    const selectedItems = shuffledItems.slice(0, QUESTIONS_PER_GAME);
    
    const generatedQuestions = selectedItems.map(item => {
      // Get 3 random WRONG answers from the SAME topic
      const otherItems = topic.items.filter(i => i.name !== item.name);
      const wrongItems = [...otherItems].sort(() => Math.random() - 0.5).slice(0, 3);
      
      const options = [item, ...wrongItems].sort(() => Math.random() - 0.5);
      return {
        correctItem: item,
        options: options
      };
    });

    setTopicKey(key);
    setQuestions(generatedQuestions);
    setCurrentQuestionIdx(0);
    setScore(0);
    setStatus('playing');
    setTimeLeft(TIME_PER_QUESTION);
    setIsEvaluating(false);
    setSelectedAnswer(null);
  }, []);

  const progressToNext = useCallback(() => {
    setIsEvaluating(false);
    setSelectedAnswer(null);
    if (currentQuestionIdx < QUESTIONS_PER_GAME - 1) {
      setCurrentQuestionIdx(prev => prev + 1);
      setTimeLeft(TIME_PER_QUESTION);
    } else {
      setStatus('finished');
      if (score >= QUESTIONS_PER_GAME * 0.7) {
        confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
      }
    }
  }, [currentQuestionIdx, score]);

  // Timer logic
  useEffect(() => {
    if (status === 'playing' && !isEvaluating) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleTimeout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [status, isEvaluating, currentQuestionIdx]);

  const handleTimeout = () => {
    clearInterval(timerRef.current);
    setIsEvaluating(true);
    audioEngine.playError(settings.soundTheme);
    setTimeout(progressToNext, 1500);
  };

  const handleAnswerSelect = (optionName) => {
    if (isEvaluating) return;
    clearInterval(timerRef.current);
    setSelectedAnswer(optionName);
    setIsEvaluating(true);
    
    const currentQ = questions[currentQuestionIdx];
    const isCorrect = optionName === currentQ.correctItem.name;
    
    if (isCorrect) {
      audioEngine.playTick(settings.soundTheme);
      setScore(s => s + 1);
    } else {
      audioEngine.playError(settings.soundTheme);
    }
    
    setTimeout(progressToNext, 1500);
  };

  const getColorClasses = (color) => {
    const classes = {
      emerald: 'bg-emerald-100 text-emerald-600 border-emerald-500',
      rose: 'bg-rose-100 text-rose-600 border-rose-500',
      indigo: 'bg-indigo-100 text-indigo-600 border-indigo-500',
      blue: 'bg-blue-100 text-blue-600 border-blue-500'
    };
    return classes[color] || classes.indigo;
  };

  return (
    <div className="w-full mx-auto space-y-8 px-4 pt-2 pb-8 h-full flex flex-col">
      <ToolHeader
        title="Guessing Game"
        icon={HelpCircle}
        description="Multiple Choice Emoji Quiz"
        infoContent={
          <>
            <p>
              <strong className="text-white block mb-1">How to Play</strong>
              Select a topic, then you'll be shown an emoji. Guess the correct word that matches the emoji!
            </p>
            <p>
              <strong className="text-white block mb-1">Timer</strong>
              You have {TIME_PER_QUESTION} seconds to answer each question.
            </p>
          </>
        }
      >
        {status !== 'setup' && (
          <button
            onClick={() => setStatus('setup')}
            className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:text-red-500 transition-all"
            title="Return to Menu"
          >
            <RotateCcw size={20} />
          </button>
        )}
      </ToolHeader>

      {status === 'setup' && (
        <div className="flex-1 flex flex-col items-center justify-center animate-in fade-in zoom-in duration-300">
          <div className="bg-white p-10 rounded-[3rem] shadow-2xl border border-slate-100 w-full max-w-xl space-y-8">
            <h3 className="text-2xl font-black text-center text-slate-700">Choose a Topic</h3>
            <div className="grid gap-4">
              {Object.entries(TOPICS).map(([key, topic]) => (
                <button
                  key={key}
                  onClick={() => initGame(key)}
                  className="group relative w-full p-6 bg-slate-50 hover:bg-slate-100 border-4 border-transparent rounded-[2rem] transition-all flex items-center justify-between overflow-hidden"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-lg group-hover:scale-110 transition-transform ${getColorClasses(topic.color)}`}>
                      {topic.icon}
                    </div>
                    <div className="text-left">
                      <div className="font-black text-xl text-slate-700">{topic.name}</div>
                      <div className="text-slate-400 font-bold uppercase text-xs tracking-widest mt-1">
                        {topic.items.length} Items Available
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="text-slate-300 group-hover:text-slate-500 group-hover:translate-x-2 transition-all" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {status === 'playing' && questions.length > 0 && (
        <div className="flex-1 flex flex-col items-center justify-center space-y-8 animate-in slide-in-from-bottom-8 duration-500 w-full max-w-2xl mx-auto">
          
          {/* Header Stats */}
          <div className="flex justify-between items-center w-full px-4">
            <div className="bg-white px-6 py-3 rounded-2xl shadow-md flex items-center gap-3">
              <span className="text-slate-400 font-black uppercase text-xs tracking-widest">Question</span>
              <span className="text-slate-800 font-black text-xl">{currentQuestionIdx + 1}/{QUESTIONS_PER_GAME}</span>
            </div>
            <div className="bg-white px-6 py-3 rounded-2xl shadow-md flex items-center gap-3">
              <Timer className={`w-5 h-5 ${timeLeft <= 3 ? 'text-red-500 animate-pulse' : 'text-slate-400'}`} />
              <span className={`font-black text-xl tabular-nums ${timeLeft <= 3 ? 'text-red-500' : 'text-slate-800'}`}>0:{timeLeft.toString().padStart(2, '0')}</span>
            </div>
            <div className="bg-white px-6 py-3 rounded-2xl shadow-md flex items-center gap-3">
              <span className="text-slate-400 font-black uppercase text-xs tracking-widest">Score</span>
              <span className="text-emerald-500 font-black text-xl">{score}</span>
            </div>
          </div>

          {/* Question Display */}
          <div className="bg-white p-12 rounded-[3rem] shadow-2xl border border-slate-100 w-full flex flex-col items-center gap-10">
            <motion.div 
              key={currentQuestionIdx}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-48 h-48 bg-slate-50 rounded-full border-8 border-slate-100 flex items-center justify-center shadow-inner"
            >
              <span className="text-[6rem]">{questions[currentQuestionIdx].correctItem.emoji}</span>
            </motion.div>

            {/* Answers Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
              {questions[currentQuestionIdx].options.map((option, idx) => {
                const isSelected = selectedAnswer === option.name;
                const isCorrectAnswer = option.name === questions[currentQuestionIdx].correctItem.name;
                
                let buttonStyle = "bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200";
                
                if (isEvaluating) {
                  if (isCorrectAnswer) {
                    buttonStyle = "bg-emerald-500 text-white border-emerald-600 shadow-emerald-200 shadow-lg scale-[1.02]";
                  } else if (isSelected) {
                    buttonStyle = "bg-rose-500 text-white border-rose-600 shadow-rose-200 shadow-lg scale-[0.98]";
                  } else {
                    buttonStyle = "bg-slate-100 text-slate-400 border-slate-200 opacity-50";
                  }
                }

                return (
                  <button
                    key={idx}
                    onClick={() => handleAnswerSelect(option.name)}
                    disabled={isEvaluating}
                    className={`py-5 px-6 rounded-2xl border-4 font-black text-xl transition-all ${buttonStyle} disabled:cursor-default`}
                  >
                    {option.name}
                  </button>
                );
              })}
            </div>
          </div>

        </div>
      )}

      {status === 'finished' && (
        <div className="flex-1 flex flex-col items-center justify-center animate-in zoom-in duration-500">
          <div className="bg-slate-900 p-16 rounded-[4rem] shadow-2xl text-white text-center space-y-10 max-w-md w-full border border-white/10">
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-yellow-500 blur-3xl opacity-20" />
              <div className="relative bg-yellow-500/20 p-8 rounded-[2rem] border-4 border-yellow-500/50">
                <Trophy size={80} className="text-yellow-500" />
              </div>
            </div>
            
            <div className="space-y-4">
              <h2 className="text-5xl font-black italic uppercase tracking-tighter">
                {score === QUESTIONS_PER_GAME ? 'Perfect!' : score >= QUESTIONS_PER_GAME * 0.7 ? 'Great Job!' : 'Good Try!'}
              </h2>
              <p className="text-slate-400 text-xl font-medium">You scored {score} out of {QUESTIONS_PER_GAME}.</p>
            </div>

            <button
              onClick={() => setStatus('setup')}
              className="w-full py-6 bg-white text-slate-900 rounded-2xl font-black text-2xl hover:scale-105 active:scale-95 transition-all shadow-xl"
            >
              PLAY AGAIN
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
