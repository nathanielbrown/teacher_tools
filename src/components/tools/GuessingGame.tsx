import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, RotateCcw, Timer, ChevronRight, Target } from 'lucide-react';
import confetti from 'canvas-confetti';
import { audioEngine } from '../../utils/audio';
import { useSettings } from '../../contexts/SettingsContext';
import { useHeader } from '../../contexts/HeaderContext';
import { ToolPanel } from '../shared/ToolPanel';
import { useIntl, FormattedMessage } from 'react-intl';

// 1. Constants
const QUESTIONS_PER_GAME = 10;
const TIME_PER_QUESTION = 10;

// 2. Config (Topics moved into component for i18n)

// 3. Text (Help and Info)
const getHelpInfo = () => (
  <div className="space-y-4 font-['Outfit']">
    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">
      <FormattedMessage id="guessingGame.help.title" defaultMessage="How to Play the Guessing Game" />
    </h3>
    <div className="space-y-3">
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center text-xs font-black text-indigo-600 shrink-0">1</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">
          <FormattedMessage id="guessingGame.help.step1" defaultMessage="Select a Topic to start." />
        </p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center text-xs font-black text-blue-600 shrink-0">2</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">
          <FormattedMessage id="guessingGame.help.step2" defaultMessage="Look at the Emoji and pick the correct name." />
        </p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-rose-50 flex items-center justify-center text-xs font-black text-rose-600 shrink-0">3</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">
          <FormattedMessage id="guessingGame.help.step3" defaultMessage="Be quick! You only have 10 seconds per question." />
        </p>
      </div>
    </div>
  </div>
);

const getColorClasses = (color: string) => {
  const classes: Record<string, string> = {
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    rose: 'bg-rose-50 text-rose-600 border-rose-100',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    blue: 'bg-blue-50 text-blue-600 border-blue-100'
  };
  return classes[color] || classes.indigo;
};

export const GuessingGame = () => {
  const { setHelpContent, clearHeader } = useHeader();
  const { settings } = useSettings();
  const intl = useIntl();

  const TOPICS = useMemo(() => ({
    animals: {
      id: 'animals',
      name: intl.formatMessage({ id: 'guessingGame.topic.animals', defaultMessage: 'Animals' }),
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
      id: 'fruits',
      name: intl.formatMessage({ id: 'guessingGame.topic.fruits', defaultMessage: 'Fruits' }),
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
      id: 'space',
      name: intl.formatMessage({ id: 'guessingGame.topic.space', defaultMessage: 'Space' }),
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
      id: 'vehicles',
      name: intl.formatMessage({ id: 'guessingGame.topic.vehicles', defaultMessage: 'Vehicles' }),
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
  }), [intl]);

  const [status, setStatus] = useState('setup'); // setup, playing, finished
  
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TIME_PER_QUESTION);
  
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  
  const timerRef = useRef<any>(null);

  const initGame = useCallback((key: string) => {
    const topic = (TOPICS as any)[key];
    const shuffledItems = [...topic.items].sort(() => Math.random() - 0.5);
    const selectedItems = shuffledItems.slice(0, QUESTIONS_PER_GAME);
    
    const generatedQuestions = selectedItems.map(item => {
      const otherItems = topic.items.filter((i: any) => i.name !== item.name);
      const wrongItems = [...otherItems].sort(() => Math.random() - 0.5).slice(0, 3);
      
      const options = [item, ...wrongItems].sort(() => Math.random() - 0.5);
      return {
        correctItem: item,
        options: options
      };
    });

    setQuestions(generatedQuestions);
    setCurrentQuestionIdx(0);
    setScore(0);
    setStatus('playing');
    setTimeLeft(TIME_PER_QUESTION);
    setIsEvaluating(false);
    setSelectedAnswer(null);
    audioEngine.playTick(settings.soundTheme);
  }, [TOPICS, settings.soundTheme]);

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

  const handleTimeout = useCallback(() => {
    clearInterval(timerRef.current);
    setIsEvaluating(true);
    audioEngine.playError(settings.soundTheme);
    setTimeout(progressToNext, 1500);
  }, [settings.soundTheme, progressToNext]);

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
  }, [status, isEvaluating, currentQuestionIdx, handleTimeout]);

  const handleAnswerSelect = (optionName: string) => {
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

  useEffect(() => {
    setHelpContent(getHelpInfo());
    return () => clearHeader();
  }, [clearHeader, setHelpContent]);

  return (
    <ToolPanel baseWidth={900} baseHeight={700}>
      <AnimatePresence mode="wait">
        {status === 'setup' ? (
          <motion.div
            key="setup"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex-1 flex flex-col gap-10 items-center justify-center py-10 w-full"
          >
            <div className="text-center space-y-4">
               <h2 className="text-5xl font-black text-slate-800 tracking-tighter uppercase leading-none">
                 <FormattedMessage id="guessingGame.title" defaultMessage="Guessing Game" />
               </h2>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">
                 <FormattedMessage id="guessingGame.subtitle" defaultMessage="Guess the emoji!" />
               </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
              {Object.entries(TOPICS).map(([key, topic]) => (
                <button
                  key={key}
                  onClick={() => initGame(key)}
                  className="group relative p-10 bg-white border-4 border-slate-50 rounded-[4rem] transition-all flex items-center justify-between   hover:border-indigo-100 active:scale-95 overflow-hidden"
                >
                  <div className="flex items-center gap-8 relative z-10">
                    <div className={`w-20 h-20 rounded-[1.5rem] flex items-center justify-center text-4xl not-italic group-hover:scale-110 transition-transform ${getColorClasses(topic.color)}`}>
                      {topic.icon}
                    </div>
                    <div className="text-left">
                      <div className="font-black text-3xl text-slate-800 uppercase tracking-tighter leading-none">{topic.name}</div>
                      <div className="text-slate-400 font-black uppercase text-[10px] tracking-[0.4em] mt-3">
                        <FormattedMessage 
                          id="guessingGame.itemsCount" 
                          defaultMessage="{count} Items" 
                          values={{ count: topic.items.length }} 
                        />
                      </div>
                    </div>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl text-slate-300 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all relative z-10">
                     <ChevronRight size={24} />
                  </div>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50/50 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-indigo-500/5 transition-all" />
                </button>
              ))}
            </div>
          </motion.div>
        ) : status === 'playing' ? (
          <motion.div
            key="playing"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex-1 flex flex-col items-center justify-center gap-12 w-full max-w-4xl mx-auto"
          >
            <div className="flex justify-between items-center w-full px-10 py-8 bg-white rounded-[3rem] border-4 border-slate-50 ">
               <div className="flex items-center gap-4">
                  <span className="text-3xl font-black text-slate-800 tabular-nums leading-none">{currentQuestionIdx + 1} / {QUESTIONS_PER_GAME}</span>
               </div>
               
               <div className="flex items-center gap-4 bg-slate-50 px-10 py-4 rounded-[1.5rem] border-4 border-white ">
                  <Timer className={`w-6 h-6 ${timeLeft <= 3 ? 'text-rose-500 animate-pulse' : 'text-indigo-600'}`} />
                  <span className={`text-3xl font-black tabular-nums leading-none ${timeLeft <= 3 ? 'text-rose-500' : 'text-slate-800'}`}>{timeLeft}s</span>
               </div>

               <div className="flex items-center gap-4">
                  <Target size={24} className="text-emerald-400" />
                  <span className="text-3xl font-black text-emerald-600 tabular-nums leading-none">{score}</span>
               </div>
            </div>

            <div className="w-full bg-slate-50 p-10 rounded-[3rem] border-4 border-white  flex flex-col items-center gap-10 relative overflow-hidden">
              <motion.div 
                key={currentQuestionIdx}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-64 h-64 bg-white rounded-[3rem] border-4 border-slate-100 flex items-center justify-center relative"
              >
                <span className="text-[6rem] relative z-10 not-italic">{questions[currentQuestionIdx].correctItem.emoji}</span>
              </motion.div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-2xl relative z-10">
                {questions[currentQuestionIdx].options.map((option: any, idx: number) => {
                  const isSelected = selectedAnswer === option.name;
                  const isCorrectAnswer = option.name === questions[currentQuestionIdx].correctItem.name;
                  
                  let buttonStyle = "bg-white text-slate-800 border-slate-100 hover:border-indigo-100 ";
                  
                  if (isEvaluating) {
                    if (isCorrectAnswer) {
                      buttonStyle = "bg-emerald-500 text-white border-emerald-400  scale-105";
                    } else if (isSelected) {
                      buttonStyle = "bg-rose-500 text-white border-rose-400 scale-95 opacity-80";
                    } else {
                      buttonStyle = "bg-slate-100 text-slate-300 border-transparent opacity-30 grayscale scale-90";
                    }
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => handleAnswerSelect(option.name)}
                      disabled={isEvaluating}
                      className={`py-6 px-8 rounded-[2rem] border-4 font-black text-2xl transition-all uppercase tracking-tighter ${buttonStyle} disabled:cursor-default`}
                    >
                      {option.name}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              onClick={() => { setStatus('setup'); audioEngine.playTick(settings.soundTheme); }}
              className="flex items-center gap-2 px-6 py-2 bg-white border-2 border-slate-100 text-slate-400 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] hover:border-rose-100 hover:text-rose-600 transition-all active:scale-95"
            >
              <RotateCcw size={14} /> <FormattedMessage id="guessingGame.quit" defaultMessage="Quit Game" />
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="finished"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex-1 bg-slate-900 rounded-[5rem] flex flex-col items-center justify-center p-20 text-center text-white space-y-16  relative overflow-hidden w-full"
          >
            <div className="tool-grid-bg-dark opacity-[0.05]" />
            <div className="relative">
               <div className="absolute -inset-10 bg-yellow-500/20 rounded-full blur-[100px] animate-pulse" />
               <div className="p-10 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-[3rem] -[0_40px_80px_-10px_rgba(234,179,8,0.4)] rotate-12 animate-bounce border-[8px] border-white/20 relative z-10">
                 <Trophy size={80} className="text-white fill-white" strokeWidth={1} />
               </div>
            </div>
            
            <div className="space-y-8 relative z-10">
               <h3 className="text-6xl font-black uppercase tracking-tighter leading-none">
                {score === QUESTIONS_PER_GAME 
                  ? <FormattedMessage id="guessingGame.perfect" defaultMessage="Perfect Score!" /> 
                  : score >= QUESTIONS_PER_GAME * 0.7 
                    ? <FormattedMessage id="guessingGame.great" defaultMessage="Great Job!" /> 
                    : <FormattedMessage id="guessingGame.wellDone" defaultMessage="Well Done!" />
                }
              </h3>
               <div className="flex flex-col gap-3">
                 <p className="text-4xl font-black text-white tracking-tighter">
                   <FormattedMessage 
                     id="guessingGame.finalScore" 
                     defaultMessage="Your Score: {score} / {total}" 
                     values={{ score: <span className="text-indigo-400 tabular-nums">{score}</span>, total: QUESTIONS_PER_GAME }} 
                   />
                 </p>
              </div>
            </div>

             <button
              onClick={() => setStatus('setup')}
              className="px-24 py-10 bg-white text-slate-900 rounded-[4rem] font-black text-3xl hover:scale-105 active:scale-95 transition-all -[0_40px_80px_-15px_rgba(255,255,255,0.2)] flex items-center gap-8 uppercase tracking-[0.2em] relative z-10"
            >
              <RotateCcw size={40} /> <FormattedMessage id="guessingGame.playAgain" defaultMessage="Play Again" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </ToolPanel>
  );
};

export default GuessingGame;
