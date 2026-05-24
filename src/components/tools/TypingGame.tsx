import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  RotateCcw, 
  Trophy, 
  Play, 
  StopCircle,
  BookOpen,
  Waves,
  Ship,
  Fish,
  Anchor
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { audioEngine } from '../../utils/audio';
import { useSettings } from '../../contexts/SettingsContext';
import { useHeader } from '../../contexts/HeaderContext';

import { useIntl, FormattedMessage } from 'react-intl';
import ToolPanel from '../shared/ToolPanel';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import WordPanel, { WordList } from '../shared/WordPanel';

// 1. Constants
const SPAWN_INTERVAL = 2500;
const INITIAL_SPEED = 0.25;
const FISH_WIDTH = 120;
const BOAT_Y = 15;
const ROD_TIP_X = 75; // % of container width, to the right of boat
const ROD_TIP_Y = -10;  // off screen top
const IDLE_HOOK_X = 75;
const IDLE_HOOK_Y = 25;

const FISH_THEMES = [
  { bg: 'bg-gradient-to-b from-emerald-300 to-emerald-600', finColor: '#047857', text: 'text-emerald-950' },
  { bg: 'bg-gradient-to-b from-purple-300 to-purple-600', finColor: '#6d28d9', text: 'text-purple-950' },
  { bg: 'bg-gradient-to-b from-pink-300 to-pink-600', finColor: '#be185d', text: 'text-pink-950' },
  { bg: 'bg-gradient-to-b from-orange-300 to-orange-600', finColor: '#c2410c', text: 'text-orange-950' },
  { bg: 'bg-gradient-to-b from-cyan-300 to-cyan-600', finColor: '#0369a1', text: 'text-cyan-950' },
];
const TARGET_THEME = { bg: 'bg-gradient-to-b from-yellow-300 to-yellow-600', finColor: '#a16207', text: 'text-yellow-950' };
const ESCAPE_THEME = { bg: 'bg-gradient-to-b from-rose-400 to-rose-700', finColor: '#be123c', text: 'text-rose-950' };

// 2. Types
interface FishObject {
  id: string;
  word: string;
  x: number;
  y: number;
  speed: number;
  direction: 1 | -1;
  isEscaping: boolean;
  isCaught?: boolean;
  colorTheme: number;
}

// 3. Text (Help and Info)
const HelpContent = () => (
  <div className="space-y-4 font-['Outfit']">
    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">
      <FormattedMessage id="typinggame.help.title" defaultMessage="How to Play" />
    </h3>
    <div className="space-y-3">
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center text-xs font-black text-blue-600 shrink-0">1</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">
          <FormattedMessage 
            id="typinggame.help.step1" 
            defaultMessage="Pick a <b>Word List</b> to start."
            values={{ b: (chunks: React.ReactNode) => <b>{chunks}</b> }}
          />
        </p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center text-xs font-black text-blue-600 shrink-0">2</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">
          <FormattedMessage 
            id="typinggame.help.step2" 
            defaultMessage="Type the first letter of a fish to cast your line!"
            values={{ b: (chunks: React.ReactNode) => <b>{chunks}</b> }}
          />
        </p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center text-xs font-black text-blue-600 shrink-0">3</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">
          <FormattedMessage 
            id="typinggame.help.step3" 
            defaultMessage="Finish typing the word to catch the fish. Don't make a mistake or the fish will swim away!"
            values={{ b: (chunks: React.ReactNode) => <b>{chunks}</b> }}
          />
        </p>
      </div>
    </div>
  </div>
);

export const TypingGame = () => {
  const intl = useIntl();
  const { setOnReset, clearHeader, setHelpContent, setHeaderActions } = useHeader();
  const { settings } = useSettings();
  
  const [lists, setLists] = useLocalStorage<WordList[]>('word_manager_lists', [
    { id: '1', name: 'Colors', words: ['RED', 'BLUE', 'GREEN', 'YELLOW', 'ORANGE', 'PURPLE'] }
  ]);
  
  const [selectedListId, setSelectedListId] = useLocalStorage<string>('typing_game_selected_list_id', lists[0]?.id || '');
  const [status, setStatus] = useState<'setup' | 'playing' | 'gameover' | 'win'>('setup');
  const [fishes, setFishes] = useState<FishObject[]>([]);
  const [score, setScore] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [targetFishId, setTargetFishId] = useState<string | null>(null);
  const [isPanelVisible, setIsPanelVisible] = useLocalStorage<boolean>('typing_game_panel_visible', true);

  const gameLoopRef = useRef<number | null>(null);
  const lastSpawnRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleWordsChange = (newWords: string[]) => {
    setLists(prev => prev.map(l => l.id === selectedListId ? { ...l, words: newWords } : l));
  };

  const handleAddList = () => {
    const newList: WordList = {
      id: Date.now().toString(),
      name: intl.formatMessage({ id: 'wordpanel.newlist', defaultMessage: 'New List' }),
      words: []
    };
    setLists(prev => [...prev, newList]);
    setSelectedListId(newList.id);
  };

  const handleDeleteList = (id: string) => {
    if (lists.length <= 1) return;
    setLists(prev => prev.filter(l => l.id !== id));
    if (selectedListId === id) {
      setSelectedListId(lists.find(l => l.id !== id)?.id || '');
    }
  };

  const handleRenameList = (id: string, name: string) => {
    setLists(prev => prev.map(l => l.id === id ? { ...l, name } : l));
  };

  const handleManageLists = () => {
    window.history.pushState({}, '', '/config/wordmanager');
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  const startGame = () => {
    const list = lists.find(l => l.id === selectedListId);
    if (!list || list.words.length === 0) return;
    setFishes([]);
    setScore(0);
    setUserInput('');
    setTargetFishId(null);
    setStatus('playing');
    setIsPanelVisible(false);
    lastSpawnRef.current = performance.now();
    lastTimeRef.current = performance.now();
    audioEngine.playTick(settings.soundTheme);
  };

  const stopGame = useCallback(() => {
    setStatus('setup');
    setFishes([]);
    setTargetFishId(null);
    setIsPanelVisible(true);
    if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    audioEngine.playTick(settings.soundTheme);
  }, [settings.soundTheme, setIsPanelVisible]);

  const updateGame = useCallback((time: number) => {
    if (status !== 'playing') return;

    if (!lastTimeRef.current) lastTimeRef.current = time;
    const deltaTime = Math.min(time - lastTimeRef.current, 50);
    lastTimeRef.current = time;
    const timeScale = deltaTime / 16.66;

    // Spawn new fish
    if (time - lastSpawnRef.current > SPAWN_INTERVAL) {
      const list = lists.find(l => l.id === selectedListId);
      if (list && list.words.length > 0) {
        const word = list.words[Math.floor(Math.random() * list.words.length)];
        const direction: 1 | -1 = Math.random() > 0.5 ? 1 : -1;
        const newFish: FishObject = {
          id: (Date.now() + Math.random()).toString(),
          word: word.toUpperCase(),
          x: direction === 1 ? -40 : 140,
          y: 35 + Math.random() * 55,
          speed: INITIAL_SPEED + (score / 2500),
          direction,
          isEscaping: false,
          colorTheme: Math.floor(Math.random() * 5)
        };
        setFishes(prev => [...prev, newFish]);
        lastSpawnRef.current = time;
      }
    }

    // Move fishes
    setFishes(prev => {
      return prev
        .map(f => {
          if (f.isCaught) {
            return {
              ...f,
              x: f.x + (ROD_TIP_X - f.x) * 0.05 * timeScale,
              y: f.y + (ROD_TIP_Y - f.y) * 0.05 * timeScale
            };
          }
          return {
            ...f,
            x: f.x + (f.direction * (f.isEscaping ? f.speed * 4 : f.speed) * timeScale)
          };
        })
        .filter(f => f.x > -50 && f.x < 150);
    });

    gameLoopRef.current = requestAnimationFrame(updateGame);
  }, [status, lists, selectedListId, score]);

  useEffect(() => {
    if (status === 'playing') {
      gameLoopRef.current = requestAnimationFrame(updateGame);
    }
    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, [status, updateGame]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (status !== 'playing') return;
    
    const char = e.key.toUpperCase();
    if (char.length !== 1) return;

    if (!targetFishId) {
      // Find the topmost fish that starts with this letter
      const candidates = fishes.filter(f => f.word.startsWith(char) && !f.isEscaping);
      if (candidates.length > 0) {
        // Sort by Y to get topmost
        candidates.sort((a, b) => a.y - b.y);
        const topFish = candidates[0];
        setTargetFishId(topFish.id);
        setUserInput(char);
        audioEngine.playTick(settings.soundTheme);

        if (topFish.word.length === 1) {
          // Caught immediately if it's a 1-letter word
          handleCatch(topFish.id);
        }
      }
    } else {
      const targetFish = fishes.find(f => f.id === targetFishId);
      if (!targetFish || targetFish.isCaught) {
        if (!targetFish) {
          setTargetFishId(null);
          setUserInput('');
        }
        return;
      }

      const nextCharIndex = userInput.length;
      if (targetFish.word[nextCharIndex] === char) {
        const nextInput = userInput + char;
        setUserInput(nextInput);
        audioEngine.playTick(settings.soundTheme);

        if (nextInput === targetFish.word) {
          handleCatch(targetFish.id);
        }
      } else {
        // Wrong letter - line breaks, fish escapes
        handleEscape(targetFish.id);
      }
    }
  };

  const handleCatch = (id: string) => {
    setFishes(prev => prev.map(f => f.id === id ? { ...f, isCaught: true } : f));
    audioEngine.playSuccess(settings.soundTheme);

    setTimeout(() => {
      setFishes(prev => prev.filter(f => f.id !== id));
      setScore(prev => {
        const newScore = prev + 1;
        if (newScore >= 50 && prev < 50) {
          setStatus('win');
          confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
        }
        return newScore;
      });
      setTargetFishId(null);
      setUserInput('');
    }, 600);
  };

  const handleEscape = (id: string) => {
    setFishes(prev => prev.map(f => f.id === id ? { ...f, isEscaping: true } : f));
    setScore(prev => Math.max(0, prev - 1));
    setTargetFishId(null);
    setUserInput('');
    audioEngine.playAlarm(settings.soundTheme);
  };

  useEffect(() => {
    setOnReset(() => stopGame);
    setHelpContent(<HelpContent />);
    // Removed the toggle from header as per user request
    setHeaderActions(null);
    return () => clearHeader();
  }, [clearHeader, setOnReset, stopGame, setHelpContent, setHeaderActions]);

  const currentTargetFish = fishes.find(f => f.id === targetFishId);

  return (
    <div 
      className="flex flex-col lg:flex-row h-full w-full overflow-hidden transition-all duration-500 ease-in-out gap-8" 
      onKeyDown={handleKeyDown} 
      tabIndex={0}
      ref={containerRef}
    >
      <AnimatePresence>
        {isPanelVisible && (
          <motion.div 
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 400, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="flex flex-col gap-6 w-full lg:w-[400px] shrink-0 h-full overflow-hidden"
          >
            <WordPanel
              isOpen={true}
              onClose={() => {}} // No close button needed here if we rely on Play/Reset
              selectedListId={selectedListId}
              onListChange={setSelectedListId}
              lists={lists}
              onWordsChange={handleWordsChange}
              onAddList={handleAddList}
              onDeleteList={handleDeleteList}
              onRenameList={handleRenameList}
              onManageLists={handleManageLists}
              manageListsLabel={<FormattedMessage id="wordpanel.link.addRemove" defaultMessage="Add/Remove Lists" />}
              className="h-full min-h-0"
            />
          </motion.div>
        )}
      </AnimatePresence>

      <ToolPanel baseWidth={isPanelVisible ? 1200 : 1600} baseHeight={800}>
        <div className="w-full h-full flex flex-col relative overflow-hidden bg-gradient-to-b from-sky-400 via-blue-500 to-blue-700 rounded-[3rem] border-[12px] border-white/10">
          {/* Sea waves background */}
          <div className="absolute inset-0 opacity-10 pointer-events-none overflow-hidden">
             {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  animate={{ x: [-20, 20, -20], y: [0, 5, 0] }}
                  transition={{ duration: 4 + i, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute w-[200%] h-20 border-t-4 border-white"
                  style={{ top: `${25 + i * 15}%`, left: '-50%' }}
                />
             ))}
          </div>

          <AnimatePresence mode="wait">
            {status === 'setup' ? (
              <motion.div key="setup" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="flex-1 flex flex-col items-center justify-center p-12 text-center gap-12 z-10">
                <div className="relative">
                  <div className="w-40 h-40 bg-surface rounded-[3rem] flex items-center justify-center text-blue-600 border-4 border-white/20">
                    <Ship size={80} strokeWidth={2} />
                  </div>
                  <motion.div 
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="absolute -bottom-4 -right-4 w-16 h-16 bg-amber-500 rounded-2xl flex items-center justify-center text-white border-4 border-amber-400"
                  >
                    <Fish size={32} />
                  </motion.div>
                </div>
                <div>
                  <h2 className="text-7xl font-black text-white tracking-tighter uppercase leading-none italic">
                    <FormattedMessage id="typinggame.title" defaultMessage="Fishing Typing" />
                  </h2>
                  <p className="mt-4 text-blue-100 font-bold text-xl uppercase tracking-widest">
                    <FormattedMessage id="typinggame.subtitle" defaultMessage="Catch the words!" />
                  </p>
                </div>
                <button 
                  onClick={startGame} 
                  className="px-16 py-8 bg-surface text-blue-600 rounded-[2.5rem] font-black text-3xl uppercase tracking-widest hover:scale-105 active:scale-95 transition-all flex items-center gap-6"
                >
                  <Play size={40} fill="currentColor" strokeWidth={0} /> <FormattedMessage id="typinggame.label.start" defaultMessage="Play" />
                </button>
              </motion.div>
            ) : status === 'playing' ? (
              <div className="flex-1 relative overflow-hidden">
                {/* HUD */}
                <div className="absolute top-8 left-10 flex items-center gap-4 z-30">
                   <div className="px-8 py-4 bg-surface/20 backdrop-blur-md rounded-3xl border-2 border-white/20">
                      <span className="text-xs font-black text-blue-200 uppercase tracking-widest block mb-1">
                        <FormattedMessage id="typinggame.label.score" defaultMessage="Score" />
                      </span>
                      <span className="text-4xl font-black text-white tabular-nums leading-none">{score}</span>
                   </div>
                </div>

                <div className="absolute top-8 right-10 z-30">
                   <button onClick={stopGame} className="p-5 bg-surface/20 backdrop-blur-md rounded-3xl border-2 border-white/20 text-white hover:bg-rose-500 transition-all">
                      <StopCircle size={28} />
                   </button>
                </div>

                {/* Boat and Fisherman */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center">
                  <motion.div 
                    animate={{ rotate: [-2, 2, -2] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className="relative origin-top"
                  >
                    {/* Boat Body */}
                    <div className="w-[450px] h-28 bg-amber-800 rounded-b-[4rem] relative border-b-8 border-amber-900 -top-4 shadow-xl">
                      {/* Wood planks detailing */}
                      <div className="absolute top-8 left-0 w-full h-1 bg-amber-900/40" />
                      <div className="absolute top-16 left-0 w-full h-1 bg-amber-900/40" />
                      
                      <div className="absolute -top-12 left-1/2 -translate-x-1/2 flex flex-col items-center">
                        {/* Fisherman */}
                        <div className="w-16 h-20 bg-orange-400 rounded-[2rem] relative">
                          <div className="w-12 h-12 bg-rose-200 rounded-full absolute -top-10 left-2">
                            {/* Face */}
                            <div className="absolute top-5 left-2 w-2 h-2 bg-slate-800 rounded-full" />
                            <div className="absolute top-5 right-2 w-2 h-2 bg-slate-800 rounded-full" />
                          </div>
                          <div className="w-20 h-5 bg-orange-600 rounded-full absolute -top-1 left-[-8px]" />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </div>

                {/* Fishing Line & Hook */}
                {(() => {
                  const mouthOffsetX = currentTargetFish ? (currentTargetFish.direction === 1 ? (3.5 + currentTargetFish.word.length * 1.5) : -(3.5 + currentTargetFish.word.length * 1.5)) : 0;
                  const hookX = currentTargetFish ? currentTargetFish.x + mouthOffsetX : IDLE_HOOK_X;
                  const hookY = currentTargetFish ? currentTargetFish.y : IDLE_HOOK_Y;
                  const hookEyeY = hookY - 3; // 3% is approx 24px
                  const hookPath = currentTargetFish?.direction === -1 
                    ? "M 0 0 V 24 A 12 12 0 0 1 -24 24 L -18 18 M -24 24 L -30 18" 
                    : "M 0 0 V 24 A 12 12 0 0 0 24 24 L 18 18 M 24 24 L 30 18";

                  return (
                    <>
                      <svg className="absolute inset-0 w-full h-full pointer-events-none z-10 overflow-visible">
                        <motion.line
                          x1={`${ROD_TIP_X}%`}
                          y1={`${ROD_TIP_Y}%`}
                          x2={`${hookX}%`}
                          y2={`${hookEyeY}%`}
                          stroke="rgba(255,255,255,0.7)"
                          strokeWidth="3"
                          animate={{ x2: `${hookX}%`, y2: `${hookEyeY}%` }}
                          transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        />
                      </svg>
                      <motion.div
                        className="absolute pointer-events-none z-20"
                        animate={{ left: `${hookX}%`, top: `${hookEyeY}%` }}
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        style={{ transform: "translate(0, 0)" }}
                      >
                        <svg className="overflow-visible" width="0" height="0">
                          <path 
                            d={hookPath} 
                            fill="none" 
                            stroke="#cbd5e1" 
                            strokeWidth="5" 
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            filter="drop-shadow(0px 4px 6px rgba(0,0,0,0.6))"
                          />
                          <circle cx="0" cy="0" r="5" fill="#94a3b8" />
                        </svg>
                      </motion.div>
                    </>
                  );
                })()}

                {/* Fishes */}
                <AnimatePresence>
                  {fishes.map(fish => {
                    const theme = fish.isEscaping ? ESCAPE_THEME : (fish.id === targetFishId ? TARGET_THEME : FISH_THEMES[fish.colorTheme]);
                    const isRight = fish.direction === 1;
                    return (
                      <motion.div
                        key={fish.id}
                        initial={{ opacity: 0, left: `${fish.x}%`, top: `${fish.y}%` }}
                        animate={{ 
                          opacity: 1, 
                          left: `${fish.x}%`, 
                          top: `${fish.y}%`,
                          rotate: fish.isCaught ? (isRight ? -90 : 90) : 0
                        }}
                        transition={{ 
                          left: { duration: 0 }, 
                          top: { duration: 0 },
                          rotate: { duration: 0.4, type: "spring" },
                          opacity: { duration: 0.5 }
                        }}
                        exit={{ scale: 0.5, opacity: 0 }}
                        className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-3"
                        style={{ 
                          zIndex: fish.id === targetFishId ? 15 : 5,
                          transformOrigin: isRight ? '95% 50%' : '5% 50%'
                        }}
                      >
                        <div className={`relative transition-all duration-300 ${fish.id === targetFishId && !fish.isCaught ? 'scale-125' : 'scale-100'}`}>
                          {/* 3D Fish Body */}
                          <div className={`
                            h-24 px-10 rounded-full flex items-center justify-center relative shadow-[inset_0_-8px_16px_rgba(0,0,0,0.3),_0_10px_20px_rgba(0,0,0,0.4)]
                            ${theme.bg} ${theme.text}
                          `}>
                            <span className="font-black text-4xl tracking-widest z-10 whitespace-nowrap drop-shadow-sm">
                              {fish.word.split('').map((char, index) => (
                                <span 
                                  key={index}
                                  className={`transition-colors duration-200 ${
                                    fish.id === targetFishId 
                                      ? (index < userInput.length 
                                          ? 'text-yellow-300 opacity-100 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] font-black scale-110 inline-block' 
                                          : (index === userInput.length ? 'text-black font-black scale-125 inline-block' : 'opacity-60')) 
                                      : ''
                                  }`}
                                >
                                  {char}
                                </span>
                              ))}
                            </span>

                            {/* Tail */}
                            <svg className={`absolute top-1/2 -translate-y-1/2 w-16 h-28 -z-10 drop-shadow-lg ${isRight ? '-left-12' : '-right-12'}`} viewBox="0 0 50 100">
                               <path d={isRight ? "M 50 50 Q 20 0 0 10 Q 15 50 0 90 Q 20 100 50 50 Z" : "M 0 50 Q 30 0 50 10 Q 35 50 50 90 Q 30 100 0 50 Z"} fill={theme.finColor} />
                            </svg>
                            
                            {/* Top Fin */}
                            <svg className="absolute -top-6 left-1/2 -translate-x-1/2 w-20 h-10 -z-10 drop-shadow-md" viewBox="0 0 100 50">
                               <path d="M 0 50 Q 50 0 100 50 Z" fill={theme.finColor} />
                            </svg>

                            {/* Eye */}
                            <div className={`absolute top-4 ${isRight ? 'right-6' : 'left-6'} w-7 h-7 bg-surface rounded-full shadow-[inset_0_2px_6px_rgba(0,0,0,0.4)] flex items-center justify-center`}>
                               <div className={`w-3.5 h-3.5 bg-dark-bg rounded-full relative ${isRight ? 'ml-2' : 'mr-2'}`}>
                                  <div className="w-1.5 h-1.5 bg-surface rounded-full absolute top-0.5 right-0.5" />
                               </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>

                {/* Feedback for typing when line is broken or fish caught would go here, 
                    but keep it minimalistic as requested */}
              </div>
            ) : (
              <motion.div key="end" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex-1 flex flex-col items-center justify-center p-12 text-center gap-12 z-10">
                 <div className="w-48 h-48 bg-surface/20 backdrop-blur-md rounded-[4rem] flex items-center justify-center text-amber-400 border-8 border-white/20">
                    <Trophy size={120} strokeWidth={1.5} />
                 </div>
                 <div className="space-y-4">
                    <h2 className="text-8xl font-black text-white tracking-tighter uppercase leading-none italic">
                      <FormattedMessage id={status === 'win' ? 'typinggame.label.win' : 'typinggame.label.gameover'} defaultMessage={status === 'win' ? 'High Score!' : 'Great Job!'} />
                    </h2>
                    <p className="text-3xl font-black text-blue-200 uppercase tracking-[0.4em]">
                      <FormattedMessage id="typinggame.label.score" defaultMessage="Score" />: {score}
                    </p>
                 </div>
                 <button 
                  onClick={startGame} 
                  className="px-16 py-8 bg-surface text-blue-600 rounded-[2.5rem] font-black text-3xl uppercase tracking-widest hover:scale-105 transition-all flex items-center gap-6"
                 >
                    <RotateCcw size={40} strokeWidth={3} /> <FormattedMessage id="typinggame.label.restart" defaultMessage="Play Again" />
                 </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </ToolPanel>
    </div>
  );
};

export default TypingGame;
