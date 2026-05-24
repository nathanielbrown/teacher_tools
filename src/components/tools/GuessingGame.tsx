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
        <div className="w-6 h-6 rounded-lg bg-primary/5 flex items-center justify-center text-xs font-black text-primary shrink-0">1</div>
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
        <div className="w-6 h-6 rounded-lg bg-caution-bg flex items-center justify-center text-xs font-black text-caution shrink-0">3</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">
          <FormattedMessage id="guessingGame.help.step3" defaultMessage="Be quick! You only have 10 seconds per question." />
        </p>
      </div>
    </div>
  </div>
);

const getColorClasses = (color: string) => {
  const classes: Record<string, string> = {
    emerald: 'bg-success-bg text-success border-success-border',
    rose: 'bg-caution-bg text-caution border-caution-border',
    indigo: 'bg-primary/5 text-primary border-primary/20',
    blue: 'bg-blue-50 text-blue-600 border-blue-100'
  };
  return classes[color] || classes.indigo;
};

export const GuessingGame = () => {
  const { setHelpContent, clearHeader } = useHeader();
  const { settings } = useSettings();
  const intl = useIntl();

  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [status, setStatus] = useState('setup'); // setup, playing, finished
  
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TIME_PER_QUESTION);
  
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  
  const timerRef = useRef<any>(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const TOPICS = useMemo(() => ({
    animals: {
      id: 'animals',
      name: intl.formatMessage({ id: 'guessingGame.topic.animals', defaultMessage: 'Animals' }),
      icon: '🦁',
      color: 'emerald',
      items: [
        { id: 'dog', emoji: '🐶', name: 'Dog' }, { id: 'cat', emoji: '🐱', name: 'Cat' }, { id: 'mouse', emoji: '🐭', name: 'Mouse' },
        { id: 'hamster', emoji: '🐹', name: 'Hamster' }, { id: 'rabbit', emoji: '🐰', name: 'Rabbit' }, { id: 'fox', emoji: '🦊', name: 'Fox' },
        { id: 'bear', emoji: '🐻', name: 'Bear' }, { id: 'panda', emoji: '🐼', name: 'Panda' }, { id: 'koala', emoji: '🐨', name: 'Koala' },
        { id: 'tiger', emoji: '🐯', name: 'Tiger' }, { id: 'lion', emoji: '🦁', name: 'Lion' }, { id: 'cow', emoji: '🐮', name: 'Cow' },
        { id: 'pig', emoji: '🐷', name: 'Pig' }, { id: 'frog', emoji: '🐸', name: 'Frog' }, { id: 'monkey', emoji: '🐵', name: 'Monkey' },
        { id: 'chicken', emoji: '🐔', name: 'Chicken' }, { id: 'penguin', emoji: '🐧', name: 'Penguin' }, { id: 'bird', emoji: '🐦', name: 'Bird' }
      ]
    },
    fruits: {
      id: 'fruits',
      name: intl.formatMessage({ id: 'guessingGame.topic.fruits', defaultMessage: 'Fruits' }),
      icon: '🍎',
      color: 'rose',
      items: [
        { id: 'apple', emoji: '🍎', name: 'Apple' }, { id: 'banana', emoji: '🍌', name: 'Banana' }, { id: 'watermelon', emoji: '🍉', name: 'Watermelon' },
        { id: 'grapes', emoji: '🍇', name: 'Grapes' }, { id: 'strawberry', emoji: '🍓', name: 'Strawberry' }, { id: 'cherries', emoji: '🍒', name: 'Cherries' },
        { id: 'pineapple', emoji: '🍍', name: 'Pineapple' }, { id: 'kiwi', emoji: '🥝', name: 'Kiwi' }, { id: 'mango', emoji: '🥭', name: 'Mango' },
        { id: 'peach', emoji: '🍑', name: 'Peach' }, { id: 'orange', emoji: '🍊', name: 'Orange' }, { id: 'lemon', emoji: '🍋', name: 'Lemon' },
        { id: 'melon', emoji: '🍈', name: 'Melon' }, { id: 'green_apple', emoji: '🍏', name: 'Green Apple' }, { id: 'pear', emoji: '🍐', name: 'Pear' }
      ]
    },
    space: {
      id: 'space',
      name: intl.formatMessage({ id: 'guessingGame.topic.space', defaultMessage: 'Space' }),
      icon: '🚀',
      color: 'indigo',
      items: [
        { id: 'rocket', emoji: '🚀', name: 'Rocket' }, { id: 'ufo', emoji: '🛸', name: 'UFO' }, { id: 'satellite', emoji: '🛰', name: 'Satellite' },
        { id: 'planet', emoji: '🪐', name: 'Planet' }, { id: 'star', emoji: '🌟', name: 'Star' }, { id: 'comet', emoji: '☄️', name: 'Comet' },
        { id: 'moon', emoji: '🌙', name: 'Moon' }, { id: 'sun', emoji: '🌞', name: 'Sun' }, { id: 'earth', emoji: '🌍', name: 'Earth' },
        { id: 'astronaut', emoji: '👨‍🚀', name: 'Astronaut' }, { id: 'telescope', emoji: '🔭', name: 'Telescope' }, { id: 'milky_way', emoji: '🌌', name: 'Milky Way' }
      ]
    },
    vehicles: {
      id: 'vehicles',
      name: intl.formatMessage({ id: 'guessingGame.topic.vehicles', defaultMessage: 'Vehicles' }),
      icon: '🚗',
      color: 'blue',
      items: [
        { id: 'car', emoji: '🚗', name: 'Car' }, { id: 'taxi', emoji: '🚕', name: 'Taxi' }, { id: 'suv', emoji: '🚙', name: 'SUV' },
        { id: 'bus', emoji: '🚌', name: 'Bus' }, { id: 'race_car', emoji: '🏎️', name: 'Race Car' }, { id: 'police_car', emoji: '🚓', name: 'Police Car' },
        { id: 'ambulance', emoji: '🚑', name: 'Ambulance' }, { id: 'fire_engine', emoji: '🚒', name: 'Fire Engine' }, { id: 'tractor', emoji: '🚜', name: 'Tractor' },
        { id: 'scooter', emoji: '🛴', name: 'Scooter' }, { id: 'bicycle', emoji: '🚲', name: 'Bicycle' }, { id: 'airplane', emoji: '✈️', name: 'Airplane' },
        { id: 'helicopter', emoji: '🚁', name: 'Helicopter' }, { id: 'ship', emoji: '🚢', name: 'Ship' }, { id: 'train', emoji: '🚂', name: 'Train' }
      ]
    }
  }), [intl]);

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
    <ToolPanel baseWidth={isMobile ? 600 : 1000} baseHeight={isMobile ? 800 : 650} fluid={!isMobile}>
      <AnimatePresence mode="wait">
        {status === 'setup' ? (
          <motion.div
            key="setup"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`flex-1 flex flex-col gap-6 items-center justify-center py-6 w-full ${isMobile ? 'px-4' : ''}`}
          >
            <div className="text-center space-y-2">
               <h2 className="text-5xl lg:text-6xl font-black text-slate-800 tracking-tighter uppercase leading-none italic drop-shadow-sm">
                 <FormattedMessage id="guessingGame.title" defaultMessage="Guessing Game" />
               </h2>
               <p className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.4em] italic">
                 <FormattedMessage id="guessingGame.subtitle" defaultMessage="Guess the emoji!" />
               </p>
            </div>

            <div className={`grid gap-6 w-full max-w-5xl ${isMobile ? 'grid-cols-1' : 'md:grid-cols-2'}`}>
              {Object.entries(TOPICS).map(([key, topic]) => (
                <button
                  key={key}
                  onClick={() => initGame(key)}
                  className={`group relative p-6 bg-surface border-4 border-slate-50 rounded-[2.5rem] transition-all flex items-center justify-between   hover:border-primary/20 active:scale-95 overflow-hidden ${isMobile ? 'h-32' : 'h-40'}`}
                >
                  <div className="flex items-center gap-6 lg:gap-8 relative z-10">
                    <div className={`w-16 h-16 lg:w-20 lg:h-20 rounded-[1.5rem] flex items-center justify-center text-3xl lg:text-4xl not-italic group-hover:scale-110 transition-transform ${getColorClasses(topic.color)}`}>
                      {topic.icon}
                    </div>
                    <div className="text-left">
                      <div className="font-black text-2xl lg:text-3xl text-slate-800 uppercase tracking-tighter leading-none italic">{topic.name}</div>
                      <div className="text-neutral-400 font-black uppercase text-[10px] tracking-[0.4em] mt-2 italic">
                        <FormattedMessage 
                          id="guessingGame.itemsCount" 
                          defaultMessage="{count} Items" 
                          values={{ count: topic.items.length }} 
                        />
                      </div>
                    </div>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl text-slate-300 group-hover:bg-primary/5 group-hover:text-primary transition-all relative z-10">
                     <ChevronRight size={24} />
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        ) : status === 'playing' ? (
          <motion.div
            key="playing"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`flex-1 flex flex-col items-center justify-center gap-4 w-full max-w-4xl mx-auto ${isMobile ? 'px-0' : 'py-2'}`}
          >
            <div className={`flex justify-between items-center w-full bg-surface border-4 border-slate-50 ${isMobile ? 'rounded-none px-6 py-4' : 'rounded-[2.5rem] px-10 py-4'}`}>
               <div className="flex items-center gap-4">
                  <span className="text-2xl lg:text-3xl font-black text-slate-800 tabular-nums leading-none italic">{currentQuestionIdx + 1} / {QUESTIONS_PER_GAME}</span>
               </div>
               
               <div className="flex items-center gap-4 bg-slate-50 px-6 lg:px-10 py-3 lg:py-4 rounded-[1.5rem] border-4 border-white ">
                  <Timer className={`w-6 h-6 ${timeLeft <= 3 ? 'text-caution animate-pulse' : 'text-primary'}`} />
                  <span className={`text-2xl lg:text-3xl font-black tabular-nums leading-none ${timeLeft <= 3 ? 'text-caution' : 'text-slate-800'}`}>{timeLeft}s</span>
               </div>

               <div className="flex items-center gap-4">
                  <Target size={24} className="text-emerald-400" />
                  <span className="text-2xl lg:text-3xl font-black text-success tabular-nums leading-none italic">{score}</span>
               </div>
            </div>

            <div className={`w-full bg-slate-50 border-4 border-white flex flex-col items-center gap-6 relative overflow-hidden ${isMobile ? 'rounded-none p-6' : 'rounded-[2.5rem] p-6 lg:p-8'}`}>
              <motion.div 
                key={currentQuestionIdx}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-48 h-48 lg:w-56 lg:h-56 bg-surface rounded-[3rem] border-4 border-slate-100 flex items-center justify-center relative"
              >
                <span className="text-[5rem] lg:text-[6rem] relative z-10 not-italic">{questions[currentQuestionIdx].correctItem.emoji}</span>
              </motion.div>

              <div className={`grid gap-4 w-full max-w-3xl relative z-10 ${isMobile ? 'grid-cols-1' : 'sm:grid-cols-2'}`}>
                {questions[currentQuestionIdx].options.map((option: any, idx: number) => {
                  const isSelected = selectedAnswer === option.name;
                  const isCorrectAnswer = option.name === questions[currentQuestionIdx].correctItem.name;
                  
                  let buttonStyle = "bg-surface text-slate-800 border-slate-100 hover:border-primary/20 ";
                  
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
                      className={`py-6 lg:py-8 px-8 rounded-[2rem] border-4 font-black text-3xl lg:text-4xl transition-all uppercase tracking-tighter italic ${buttonStyle} disabled:cursor-default`}
                    >
                      {intl.formatMessage({ id: `guessingGame.item.${option.id}`, defaultMessage: option.name })}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              onClick={() => { setStatus('setup'); audioEngine.playTick(settings.soundTheme); }}
              className="flex items-center gap-2 px-6 py-2 bg-surface border-2 border-slate-100 text-neutral-400 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] hover:border-caution-border hover:text-caution transition-all active:scale-95 italic"
            >
              <RotateCcw size={14} /> <FormattedMessage id="guessingGame.quit" defaultMessage="Quit Game" />
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="finished"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`flex-1 bg-dark-bg rounded-[5rem] flex flex-col items-center justify-center text-center text-white space-y-12  relative overflow-hidden w-full ${isMobile ? 'p-10' : 'p-20'}`}
          >
            <div className="tool-grid-bg-dark opacity-[0.05]" />
            <div className="relative">
               <div className="absolute -inset-10 bg-yellow-500/20 rounded-full blur-[100px] animate-pulse" />
               <div className="p-10 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-[3rem] -[0_40px_80px_-10px_rgba(234,179,8,0.4)] rotate-12 animate-bounce border-[8px] border-white/20 relative z-10">
                 <Trophy size={isMobile ? 60 : 80} className="text-white fill-white" strokeWidth={1} />
               </div>
            </div>
            
            <div className="space-y-6 relative z-10">
               <h3 className="text-5xl lg:text-7xl font-black uppercase tracking-tighter leading-none italic">
                {score === QUESTIONS_PER_GAME 
                   ? <FormattedMessage id="guessingGame.perfect" defaultMessage="Perfect Score!" /> 
                   : score >= QUESTIONS_PER_GAME * 0.7 
                     ? <FormattedMessage id="guessingGame.great" defaultMessage="Great Job!" /> 
                     : <FormattedMessage id="guessingGame.wellDone" defaultMessage="Well Done!" />
                 }
               </h3>
               <div className="flex flex-col gap-3">
                 <p className="text-3xl lg:text-5xl font-black text-white tracking-tighter italic">
                   <FormattedMessage 
                     id="guessingGame.finalScore" 
                     defaultMessage="Your Score: {score} / {total}" 
                     values={{ score: <span className="text-primary/70 tabular-nums">{score}</span>, total: QUESTIONS_PER_GAME }} 
                   />
                 </p>
               </div>
            </div>

             <button
              onClick={() => setStatus('setup')}
              className="px-16 lg:px-24 py-8 lg:py-10 bg-surface text-slate-900 rounded-[4rem] font-black text-2xl lg:text-3xl hover:scale-105 active:scale-95 transition-all -[0_40px_80px_-15px_rgba(255,255,255,0.2)] flex items-center gap-8 uppercase tracking-[0.2em] relative z-10 italic"
            >
              <RotateCcw size={32} /> <FormattedMessage id="guessingGame.playAgain" defaultMessage="Play Again" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </ToolPanel>
  );
};

export default GuessingGame;
