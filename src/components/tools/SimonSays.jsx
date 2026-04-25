import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Activity, Dog, Laugh, Ghost, Play, RotateCcw, ChevronRight, Settings2, Clock, Volume2 } from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';
import { ToolHeader } from '../ToolHeader';
import { audioEngine } from '../../utils/audio';

const MODES = [
  { id: 'classic', label: 'Classic', icon: User, color: 'from-blue-400 to-indigo-600', commands: [
    "Touch your nose", "Stand on one leg", "Jump 3 times", "Clap your hands", "Touch your toes",
    "Turn around", "Wave hello", "Pat your head", "Rub your tummy", "Sit down", "Stand up",
    "Touch your elbows", "Point to the ceiling", "Blink both eyes", "Cover your ears"
  ]},
  { id: 'stretching', label: 'Stretching', icon: Activity, color: 'from-emerald-400 to-teal-600', commands: [
    "Reach for the sky", "Touch your ankles", "Arms out like a T", "Big circles with your arms",
    "Lean to the left", "Lean to the right", "Shoulder shrugs", "Neck circles", "Touch your shoulders",
    "Balance on your left foot", "Balance on your right foot", "Deep breath in", "Big breath out"
  ]},
  { id: 'animals', label: 'Animals', icon: Dog, color: 'from-orange-400 to-amber-600', commands: [
    "Hop like a frog", "Roar like a lion", "Flap your wings like a bird", "Stretch like a cat",
    "Stomp like an elephant", "Waddle like a penguin", "Swim like a fish", "Slither like a snake",
    "Gallop like a horse", "Howl like a wolf", "Crawl like a bear", "Snap like a crocodile"
  ]},
  { id: 'funny', label: 'Funny Faces', icon: Laugh, color: 'from-pink-400 to-rose-600', commands: [
    "Stick out your tongue", "Wink one eye", "Puff out your cheeks", "Big cheesy smile",
    "Scrunched up nose", "Surprised face", "Fishy face", "Angry eyebrows", "Wiggle your ears",
    "Cross your eyes", "Open your mouth wide", "Grumpy face"
  ]},
  { id: 'miming', label: 'Miming', icon: Ghost, color: 'from-purple-400 to-violet-600', commands: [
    "Mime eating an apple", "Mime brushing your teeth", "Mime driving a car", "Mime playing guitar",
    "Mime being a tree in the wind", "Mime sleeping", "Mime opening a present", "Mime reading a book",
    "Mime throwing a ball", "Mime washing your face", "Mime playing piano", "Mime being an ice statue"
  ]}
];

export const SimonSays = () => {
  const [gameState, setGameState] = useState('menu'); // menu, playing
  const [activeMode, setActiveMode] = useState(MODES[0]);
  const [currentCommand, setCurrentCommand] = useState("");
  const [hasSimon, setHasSimon] = useState(true);
  const [isAuto, setIsAuto] = useState(false);
  const [autoSpeed, setAutoSpeed] = useState(15); // Default 15 seconds
  const [timeLeft, setTimeLeft] = useState(15);
  const [showSimonStatus, setShowSimonStatus] = useState(false);
  const { settings } = useSettings();
  
  const timerRef = useRef(null);
  const statusTimeoutRef = useRef(null);

  const generateCommand = () => {
    if (statusTimeoutRef.current) clearTimeout(statusTimeoutRef.current);

    const randomCommand = activeMode.commands[Math.floor(Math.random() * activeMode.commands.length)];
    const simonRoll = Math.random() > 0.3; // 70% chance of Simon saying it
    
    setHasSimon(simonRoll);
    setCurrentCommand(randomCommand);
    setTimeLeft(autoSpeed);
    audioEngine.playTick(settings.soundTheme);

    if (simonRoll) {
      setShowSimonStatus(true);
    } else {
      setShowSimonStatus(false);
      statusTimeoutRef.current = setTimeout(() => {
        setShowSimonStatus(true);
      }, 5000);
    }
  };

  const startGame = (mode) => {
    setActiveMode(mode);
    setGameState('playing');
    generateCommand();
  };

  const nextCommand = () => {
    generateCommand();
  };

  useEffect(() => {
    if (gameState === 'playing' && isAuto) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            generateCommand();
            return autoSpeed;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      clearInterval(timerRef.current);
      if (statusTimeoutRef.current) clearTimeout(statusTimeoutRef.current);
    };
  }, [gameState, isAuto, activeMode, autoSpeed]);

  return (
    <div className="w-full mx-auto px-4 pt-2 pb-8 h-full flex flex-col gap-4">
      <ToolHeader
        title="Simon Says (Classroom)"
        icon={User}
        description="A high-energy movement and attention game"
        infoContent={
          <>
            <p>
              <strong className="text-white block mb-1">How to Play</strong>
              Follow Simon's instructions ONLY if they say "Simon says...". If they don't, stay perfectly still!
            </p>
            <p>
              <strong className="text-white block mb-1">Auto Mode</strong>
              Enable Auto Mode to let the tool generate commands automatically at your chosen speed.
            </p>
          </>
        }
      >
        {gameState === 'playing' && (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 p-1 bg-slate-50 rounded-2xl border border-slate-100">
              {[5, 15, 30, 60].map((speed) => (
                <button
                  key={speed}
                  onClick={() => {
                    setAutoSpeed(speed);
                    if (timeLeft > speed) setTimeLeft(speed);
                  }}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all ${
                    autoSpeed === speed ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {speed}s
                </button>
              ))}
            </div>
            <button
              onClick={() => setIsAuto(!isAuto)}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black transition-all ${
                isAuto ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              }`}
            >
              <Clock size={20} />
              {isAuto ? 'AUTO ON' : 'MANUAL'}
            </button>
            <button
              onClick={() => setGameState('menu')}
              className="p-3 bg-slate-50 text-slate-400 rounded-2xl hover:text-slate-600 transition-all"
            >
              <RotateCcw size={24} />
            </button>
          </div>
        )}
      </ToolHeader>

      <AnimatePresence mode="wait">
        {gameState === 'menu' ? (
          <motion.div
            key="menu"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6"
          >
            {MODES.map(mode => (
              <button
                key={mode.id}
                onClick={() => startGame(mode)}
                className={`group relative p-8 rounded-[2.5rem] bg-gradient-to-br ${mode.color} text-white shadow-xl hover:scale-105 transition-all active:scale-95 flex flex-col items-center justify-center gap-6 text-center overflow-hidden`}
              >
                <div className="bg-white/20 p-6 rounded-[2rem] backdrop-blur-sm group-hover:scale-110 transition-transform">
                  <mode.icon size={48} strokeWidth={2.5} />
                </div>
                <div className="space-y-1">
                  <h3 className="text-2xl font-black tracking-tight">{mode.label}</h3>
                  <p className="text-white/60 text-xs font-bold uppercase tracking-widest">{mode.commands.length} Commands</p>
                </div>
                <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity" />
              </button>
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="playing"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col gap-8"
          >
            {/* Command Card */}
            <div className={`flex-1 flex flex-col rounded-[3.5rem] border-8 border-white shadow-2xl overflow-hidden relative bg-gradient-to-br ${activeMode.color}`}>
              {/* Progress Bar */}
              {isAuto && (
                <div className="absolute top-0 left-0 w-full h-3 bg-black/10">
                  <motion.div
                    initial={{ width: "100%" }}
                    animate={{ width: `${(timeLeft / autoSpeed) * 100}%` }}
                    transition={{ duration: 1, ease: "linear" }}
                    className="h-full bg-white/40"
                  />
                </div>
              )}

              <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-white gap-12">
                <div className="space-y-4">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={hasSimon + currentCommand}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="space-y-6"
                    >
                      <span className={`px-8 py-3 rounded-2xl text-2xl font-black uppercase tracking-widest transition-all duration-500 ${showSimonStatus ? 'opacity-100 scale-100' : 'opacity-0 scale-95'} ${hasSimon ? 'bg-white/20' : 'bg-red-500 text-white shadow-xl animate-bounce'}`}>
                        {hasSimon ? "Simon says..." : "Simon didn't say!"}
                      </span>
                      <h3 className="text-6xl md:text-8xl font-black leading-tight drop-shadow-lg">
                        {currentCommand}
                      </h3>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>

              <div className="bg-black/10 backdrop-blur-md p-8 flex items-center justify-between">
                <div className="flex items-center gap-4 text-white">
                  <div className="p-3 bg-white/20 rounded-2xl">
                    <activeMode.icon size={24} />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest opacity-60">Mode</p>
                    <p className="text-xl font-bold">{activeMode.label}</p>
                  </div>
                </div>

                <button
                  onClick={nextCommand}
                  className="group flex items-center gap-3 px-10 py-5 bg-white text-slate-800 rounded-[1.5rem] text-xl font-black shadow-xl hover:scale-105 transition-all active:scale-95"
                >
                  NEXT COMMAND
                  <ChevronRight size={24} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-center gap-8 opacity-40">
              <div className="flex items-center gap-2 text-xs font-black text-slate-500 uppercase tracking-widest">
                <Settings2 size={14} /> Theme: {settings.theme}
              </div>
              <div className="w-1 h-1 bg-slate-300 rounded-full" />
              <div className="flex items-center gap-2 text-xs font-black text-slate-500 uppercase tracking-widest">
                <Volume2 size={14} /> Sound: {settings.soundTheme}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
