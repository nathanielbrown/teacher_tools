import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  RotateCcw, 
  Play,
  Pause,
  ChevronRight,
  User,
  Dumbbell,
  Dog,
  Ghost,
  Camera,
  Timer,
  Zap
} from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';
import { useHeader } from '../../contexts/HeaderContext';
import { audioEngine } from '../../utils/audio';
import { ToolPanel } from '../shared/ToolPanel';
import { FormattedMessage, useIntl } from 'react-intl';

// 1. Constants
const CATEGORIES = [
  { 
    id: 'classic', 
    name: 'Classic', 
    icon: User, 
    gradient: 'from-blue-400 to-indigo-500',
    commands: [
      'Touch your nose', 
      'Clap your hands', 
      'Jump 3 times', 
      'Touch your toes', 
      'Pat your head', 
      'Stand on one leg',
      'Spin around once',
      'Point to the ceiling'
    ] 
  },
  { 
    id: 'stretching', 
    name: 'Stretching', 
    icon: Dumbbell, 
    gradient: 'from-emerald-400 to-teal-500',
    commands: [
      'Reach for the sky', 
      'Touch your toes', 
      'Side stretch left', 
      'Side stretch right', 
      'Roll your shoulders', 
      'Neck circles',
      'Reach for your ankles',
      'Big arm circles'
    ] 
  },
  { 
    id: 'animals', 
    name: 'Animals', 
    icon: Dog, 
    gradient: 'from-orange-400 to-red-500',
    commands: [
      'Hop like a frog', 
      'Roar like a lion', 
      'Flap like a bird', 
      'Slither like a snake', 
      'Waddle like a penguin', 
      'Stomp like an elephant',
      'Bark like a dog',
      'Tall like a giraffe'
    ] 
  },
  { 
    id: 'funny', 
    name: 'Funny Faces', 
    icon: Ghost, 
    gradient: 'from-purple-400 to-pink-500',
    commands: [
      'Stick out your tongue', 
      'Wiggle your ears', 
      'Puff your cheeks', 
      'Blink both eyes', 
      'Scowl like a pirate', 
      'Blow a kiss',
      'Show your teeth',
      'Wink at a friend'
    ] 
  },
  { 
    id: 'miming', 
    name: 'Miming', 
    icon: Camera, 
    gradient: 'from-amber-400 to-yellow-500',
    commands: [
      'Brush your teeth', 
      'Drive a car', 
      'Play the guitar', 
      'Eat an apple', 
      'Open a gift', 
      'Sleep on your hands',
      'Row a boat',
      'Talk on the phone'
    ] 
  }
];

const TIMER_OPTIONS = [
  { label: 'Manual', value: 0 },
  { label: '5s', value: 5 },
  { label: '15s', value: 15 },
  { label: '30s', value: 30 },
  { label: '60s', value: 60 },
];

// 2. Config (None)

// 3. Text (Help and Info)
const HelpContent = () => (
  <div className="space-y-4 font-['Outfit']">
    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">
      <FormattedMessage id="simonsays.help.title" defaultMessage="How to Play" />
    </h3>
    <div className="space-y-3">
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center text-xs font-black text-indigo-600 shrink-0">1</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">
          <FormattedMessage id="simonsays.help.step1" defaultMessage="Choose a category to start the game." />
        </p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center text-xs font-black text-indigo-600 shrink-0">2</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">
          <FormattedMessage id="simonsays.help.step2" defaultMessage="When Simon says a command, everyone must follow it." />
        </p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center text-xs font-black text-indigo-600 shrink-0">3</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">
          <FormattedMessage id="simonsays.help.step3" defaultMessage="If Simon does not say it, do not move!" />
        </p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center text-xs font-black text-indigo-600 shrink-0">4</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">
          <FormattedMessage id="simonsays.help.step4" defaultMessage="Use the timer at the top for automatic mode." />
        </p>
      </div>
    </div>
  </div>
);

// 4. Local Storage (None)

// 5. Classes (None)

// 6. Functions (None)

// 7. Component
export const SimonSays = () => {
  const { setHeaderActions, setOnReset, clearHeader, setHelpContent } = useHeader();
  const { settings } = useSettings();
  const intl = useIntl();

  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [gameState, setGameState] = useState('menu'); // 'menu', 'playing'
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0]);
  const [timerValue, setTimerValue] = useState(0); // 0 = Manual
  const [currentCommand, setCurrentCommand] = useState<any>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(100);

  const timerRef = useRef<any>(null);
  const messageTimeoutRef = useRef<any>(null);
  const [isMessageVisible, setIsMessageVisible] = useState(true);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const generateCommand = useCallback(() => {
    if (messageTimeoutRef.current) clearTimeout(messageTimeoutRef.current);
    
    const isSimon = Math.random() > 0.3;
    const commands = selectedCategory.commands;
    const text = commands[Math.floor(Math.random() * commands.length)];
    
    setCurrentCommand({ isSimon, text });
    setProgress(100);
    audioEngine.playTick(settings.soundTheme);

    if (!isSimon) {
      setIsMessageVisible(false);
      messageTimeoutRef.current = setTimeout(() => {
        setIsMessageVisible(true);
      }, 5000);
    } else {
      setIsMessageVisible(true);
    }
  }, [selectedCategory, settings.soundTheme]);

  const resetGame = useCallback(() => {
    setGameState('menu');
    setCurrentCommand(null);
    setIsPaused(false);
    setProgress(100);
    setIsMessageVisible(true);
    if (timerRef.current) clearInterval(timerRef.current);
    if (messageTimeoutRef.current) clearTimeout(messageTimeoutRef.current);
  }, []);

  useEffect(() => {
    setOnReset(() => resetGame);
    setHelpContent(<HelpContent />);
    return () => {
      clearHeader();
      if (timerRef.current) clearInterval(timerRef.current);
      if (messageTimeoutRef.current) clearTimeout(messageTimeoutRef.current);
    };
  }, [clearHeader, setOnReset, resetGame, setHelpContent]);

  const startGame = (category: any) => {
    setSelectedCategory(category);
    setGameState('playing');
    generateCommand();
  };

  useEffect(() => {
    if (gameState === 'playing' && timerValue > 0 && !isPaused) {
      const step = 100 / (timerValue * 20); // 50ms intervals
      timerRef.current = setInterval(() => {
        setProgress(prev => {
          if (prev <= 0) {
            generateCommand();
            return 100;
          }
          return prev - step;
        });
      }, 50);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState, timerValue, isPaused, generateCommand]);

  useEffect(() => {
    if (gameState !== 'menu') {
      setHeaderActions(
        <div className="flex items-center gap-2 md:gap-4 italic">
          {isMobile ? (
            <select
              value={timerValue}
              onChange={(e) => {
                setTimerValue(Number(e.target.value));
                setProgress(100);
              }}
              className="px-4 py-2 bg-white border-2 border-slate-100 text-slate-900 rounded-xl font-black text-[10px] uppercase tracking-widest outline-none focus:border-indigo-600 transition-all"
            >
              {TIMER_OPTIONS.map((opt) => (
                <option key={opt.label} value={opt.value}>
                  {opt.value === 0 ? intl.formatMessage({ id: 'simonsays.timer.manual', defaultMessage: 'Manual' }) : opt.label}
                </option>
              ))}
            </select>
          ) : (
            <div className="flex bg-white p-1 rounded-xl border-2 border-slate-50 ">
              {TIMER_OPTIONS.map((opt) => (
                <button
                  key={opt.label}
                  onClick={() => {
                    setTimerValue(opt.value);
                    setProgress(100);
                  }}
                  className={`px-3 py-1.5 rounded-lg font-black text-[10px] transition-all uppercase tracking-widest ${
                    timerValue === opt.value 
                      ? 'bg-indigo-600 text-white ' 
                      : 'text-slate-400 hover:text-indigo-600'
                  }`}
                >
                  {opt.value === 0 ? (
                    <FormattedMessage id="simonsays.timer.manual" defaultMessage="Manual" />
                  ) : opt.label}
                </button>
              ))}
            </div>
          )}

          {timerValue > 0 && (
            <button
              onClick={() => setIsPaused(!isPaused)}
              className={`p-2 rounded-xl transition-all  border ${
                isPaused 
                  ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                  : 'bg-amber-50 text-amber-600 border-amber-100'
              }`}
            >
              {isPaused ? <Play size={20} /> : <Pause size={20} />}
            </button>
          )}
        </div>
      );
    } else {
      setHeaderActions(null);
    }
  }, [gameState, timerValue, isPaused, setHeaderActions, resetGame, isMobile, intl]);

  return (
    <ToolPanel className="font-['Outfit'] select-none" baseWidth={isMobile ? 600 : 1200} baseHeight={800} fluid={!isMobile}>
      <AnimatePresence mode="wait">
        {gameState === 'menu' ? (
          <motion.div 
            key="menu"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex-1 flex flex-col items-center justify-center space-y-12"
          >
            <div className="text-center space-y-4 italic">
              <h1 className="text-6xl font-black text-slate-800 tracking-tighter uppercase leading-none drop-shadow-sm">
                <FormattedMessage id="simonsays.title" defaultMessage="Simon Says" />
              </h1>
            </div>

            <div className={`grid gap-6 w-full max-w-6xl ${isMobile ? 'grid-cols-1 px-4' : 'md:grid-cols-3 lg:grid-cols-5'}`}>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => startGame(cat)}
                  className={`group relative ${isMobile ? 'h-28' : 'h-64'} rounded-[2.5rem] overflow-hidden transition-all hover:scale-105 active:scale-95 `}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${cat.gradient} opacity-90`} />
                  <div className={`absolute inset-0 flex flex-col items-center justify-center ${isMobile ? 'p-2' : 'p-6'} text-white space-y-4 italic`}>
                    <span className={`${isMobile ? 'text-xl' : 'text-2xl lg:text-3xl'} font-black tracking-tighter uppercase`}>
                      <FormattedMessage id={`simonsays.category.${cat.id}`} defaultMessage={cat.name} />
                    </span>
                  </div>
                  <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity" />
                </button>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="playing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 flex flex-col gap-8 relative h-full w-full"
          >
            <div className={`flex-1 flex flex-col items-center justify-center bg-white relative overflow-hidden border-4 border-slate-50 ${isMobile ? 'rounded-none p-6' : 'rounded-[4rem] p-12'}`}>
               {/* Progress Bar (if auto-timer) */}
               {timerValue > 0 && (
                 <div className="absolute top-0 left-0 w-full h-3 bg-slate-50">
                    <motion.div 
                       className="h-full bg-indigo-600"
                       initial={{ width: '100%' }}
                       animate={{ width: `${progress}%` }}
                       transition={{ duration: 0.05, ease: 'linear' }}
                    />
                 </div>
               )}

               <AnimatePresence mode="wait">
                 <motion.div
                   key={currentCommand?.text + currentCommand?.isSimon}
                   initial={{ opacity: 0, scale: 0.9, y: 30 }}
                   animate={{ opacity: 1, scale: 1, y: 0 }}
                   exit={{ opacity: 0, scale: 1.1, y: -30 }}
                   transition={{ type: 'spring', damping: 20, stiffness: 100 }}
                   className="text-center space-y-12 max-w-3xl flex flex-col items-center justify-center h-full mx-auto italic"
                 >
                    <div className="space-y-6 min-h-[80px] flex items-center justify-center">
                      {isMessageVisible && (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className={`inline-flex items-center gap-3 px-8 py-3 rounded-full text-xl font-black uppercase tracking-widest italic  ${
                            currentCommand?.isSimon 
                              ? 'bg-blue-600 text-white ' 
                              : 'bg-rose-600 text-white '
                          }`}
                        >
                          {currentCommand?.isSimon ? (
                            <>
                              <Zap size={24} className="fill-white" />
                              <FormattedMessage id="simonsays.says" defaultMessage="Simon Says..." />
                            </>
                          ) : (
                            <>
                              <Timer size={24} className="fill-white" />
                              <FormattedMessage id="simonsays.didntsay" defaultMessage="Simon didn't say!" />
                            </>
                          )}
                        </motion.div>
                      )}
                    </div>
                      
                    <h2 className="text-7xl md:text-9xl font-black text-slate-800 tracking-tighter leading-none uppercase drop-shadow-sm">
                      {currentCommand?.text}
                    </h2>
                 </motion.div>
               </AnimatePresence>
            </div>

            {/* Next Command Button - only if Manual */}
            {timerValue === 0 && (
              <div className="flex justify-center pt-4 pb-4">
                <button
                  onClick={generateCommand}
                  className="group flex items-center gap-6 px-16 py-8 bg-indigo-600 text-white rounded-[3rem] font-black text-4xl  hover:bg-indigo-700 active:scale-95 transition-all tracking-tighter italic uppercase shadow-xl"
                >
                  <FormattedMessage id="simonsays.next" defaultMessage="Next" />
                  <ChevronRight size={48} className="group-hover:translate-x-2 transition-transform" />
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </ToolPanel>
  );
};

export default SimonSays;
