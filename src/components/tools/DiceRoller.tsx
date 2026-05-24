import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  RotateCcw, 
  Dice5,
  History as HistoryIcon,
  Plus,
  TrendingUp
} from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';
import { useHeader } from '../../contexts/HeaderContext';
import { audioEngine } from '../../utils/audio';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { DieSVG } from './DiceRoller/DiceComponents';
import { DICE_TYPES } from './DiceRoller/diceData';

// 3. Text (Help and Info)
const HELP_INFO = (
  <div className="space-y-4 font-['Outfit']">
    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">How to Use</h3>
    <div className="space-y-3">
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-primary/5 flex items-center justify-center text-xs font-black text-primary shrink-0">1</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">Click on a <b>die</b> below to add it to the table.</p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center text-xs font-black text-blue-600 shrink-0">2</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">Press <b>ROLL</b> to shake all your dice.</p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-green-50 flex items-center justify-center text-xs font-black text-green-600 shrink-0">3</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">See the <b>total</b> and your <b>history</b> at the bottom.</p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-slate-50 flex items-center justify-center text-xs font-black text-slate-600 shrink-0">4</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">Use the <b>Reset</b> button to clear the table.</p>
      </div>
    </div>
  </div>
);

import { ToolPanel } from '../shared/ToolPanel';
import HistoryPanel from '../shared/HistoryPanel';

export const DiceRoller = () => {
  const { setOnReset, clearHeader, setHelpContent } = useHeader();
  const { settings } = useSettings();
  const [activeDice, setActiveDice] = useLocalStorage<any[]>('dice_roller_active_pool', []);
  const [isRolling, setIsRolling] = useState(false);
  const [history, setHistory] = useLocalStorage<number[]>('dice_roller_history_pool', []);

  const reset = useCallback(() => {
    setActiveDice([]);
    audioEngine.playTick(settings.soundTheme);
  }, [settings.soundTheme, setActiveDice]);

  // Persistence handled by useLocalStorage

  // Persistence handled by useLocalStorage

  useEffect(() => {
    setOnReset(() => reset);
    setHelpContent(HELP_INFO);
    return () => clearHeader();
  }, [clearHeader, setOnReset, reset, setHelpContent]);

  const addDie = (sides: number) => {
    if (activeDice.length >= 24) return;
    const newDie = {
      id: Date.now() + Math.random(),
      sides,
      value: 0,
    };
    // Reset all dice to 0 when adding a new one to "reset" the result
    setActiveDice(prev => prev.map(d => ({ ...d, value: 0 })).concat(newDie));
    audioEngine.playTick(settings.soundTheme);
  };

  const rollDice = () => {
    if (isRolling || activeDice.length === 0) return;
    
    setIsRolling(true);
    audioEngine.playTick(settings.soundTheme);
    
    setTimeout(() => {
      const rolledDice = activeDice.map(d => ({
        ...d,
        value: Math.floor(Math.random() * d.sides) + 1
      }));
      
      setActiveDice(rolledDice);
      
      // Calculate new total and save TO history AFTER successful roll
      const newTotal = rolledDice.reduce((sum, d) => sum + d.value, 0);
      setHistory(prev => [newTotal, ...prev].slice(0, 20));
      
      setIsRolling(false);
      audioEngine.playSuccess(settings.soundTheme);
    }, 600);
  };

  const totalValue = useMemo(() => {
    return activeDice.reduce((sum, d) => sum + d.value, 0);
  }, [activeDice]);

  const [wiggleId, setWiggleId] = useState<number | null>(null);

  // Idle wiggle effect
  useEffect(() => {
    if (isRolling || activeDice.length === 0) return;

    let timeoutId: NodeJS.Timeout;

    const triggerWiggle = () => {
      const randomIndex = Math.floor(Math.random() * activeDice.length);
      setWiggleId(activeDice[randomIndex].id);
      setTimeout(() => setWiggleId(null), 500);

      const nextDelay = 1000 + Math.random() * 500;
      timeoutId = setTimeout(triggerWiggle, nextDelay);
    };

    timeoutId = setTimeout(triggerWiggle, 1000);

    return () => clearTimeout(timeoutId);
  }, [isRolling, activeDice]);

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 h-full w-full italic overflow-y-auto lg:overflow-hidden px-0 lg:px-0 py-4 lg:py-0 custom-scrollbar">
      <ToolPanel baseWidth={isMobile ? 800 : 1000} baseHeight={isMobile ? 1000 : 800} fluid={true} className="p-0">
        <div className="flex flex-col w-full h-full relative">
          
          {/* Main Stage */}
          <div 
            className="flex-1 flex items-center justify-center relative overflow-hidden p-6 lg:p-12 cursor-pointer group"
            onClick={rollDice}
          >
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
                 style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, black 1px, transparent 0)', backgroundSize: '64px 64px' }} />
            
            {/* Total Result Overlay */}
            <div className="absolute top-6 lg:top-10 right-6 lg:right-10 z-20 flex flex-col items-end bg-surface/40 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/50">
              <span className="text-[9px] font-black text-neutral-400 uppercase tracking-widest mb-1">Total</span>
              <motion.span 
                key={totalValue}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-4xl lg:text-5xl font-black text-slate-900 leading-none tabular-nums"
              >
                {totalValue}
              </motion.span>
            </div>
            
            <div className="flex flex-wrap justify-center items-center gap-10 relative z-10 w-full max-w-4xl">
              <AnimatePresence>
                {activeDice.length === 0 ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="flex flex-col items-center gap-6 text-slate-200"
                  >
                    <Dice5 className="w-32 h-32 lg:w-40 lg:h-40" strokeWidth={1} />
                    <span className="text-[10px] lg:text-[12px] font-black uppercase tracking-[0.8em]">Click to add dice</span>
                  </motion.div>
                ) : (
                  activeDice.map((die, index) => (
                    <motion.div
                      key={die.id}
                      layout
                      initial={{ scale: 0, rotate: -45, y: 50 }}
                      animate={{ 
                        scale: 1, 
                        rotate: wiggleId === die.id ? [0, -8, 8, -8, 0] : 0,
                        y: 0 
                      }}
                      exit={{ scale: 0, rotate: 45, y: -50 }}
                      transition={{ 
                        type: 'spring', 
                        stiffness: 300, 
                        damping: 20,
                        rotate: { duration: 0.4, ease: "easeInOut" }
                      }}
                      className="relative group/die"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveDice(activeDice.filter(d => d.id !== die.id));
                        audioEngine.playTick(settings.soundTheme);
                      }}
                    >
                      <DieSVG 
                        sides={die.sides} 
                        value={die.value} 
                        isRolling={isRolling} 
                        size={activeDice.length > 12 ? 100 : 140}
                        delay={index * 0.05}
                      />
                      <div className="absolute -top-2 -right-2 opacity-0 group-hover/die:opacity-100 transition-opacity bg-rose-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-xs font-bold shadow-lg">
                        ✕
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>

            {/* Stage Indicator */}
            <div className="absolute bottom-10 right-10 flex items-center gap-4 bg-surface/50 backdrop-blur-md px-6 py-4 rounded-[2rem] border border-white opacity-40 group-hover:opacity-100 transition-all">
              <span className="text-[9px] font-black text-neutral-400 uppercase tracking-widest">Click stage to roll all</span>
            </div>
          </div>

          {/* Selector Tray - Floating at bottom */}
          <div className="w-full p-2 lg:p-8 flex flex-wrap justify-center gap-2 lg:gap-6">
            {DICE_TYPES.map((type) => (
              <button
                key={type.sides}
                onClick={(e) => {
                  e.stopPropagation();
                  addDie(type.sides);
                }}
                className="group relative flex flex-col items-center justify-center w-24 h-28 lg:w-32 lg:h-36 rounded-2xl lg:rounded-[2.5rem] bg-surface border-4 border-transparent hover:border-primary/20 hover:scale-105 transition-all active:scale-95 shadow-sm"
              >
                <DieSVG 
                  sides={type.sides} 
                  value={type.sides} 
                  isRolling={false} 
                  size={isMobile ? 64 : 80} 
                  showValue={false}
                  className="mb-2 lg:mb-3"
                />
                <span className="text-[9px] lg:text-[11px] font-black text-neutral-400 uppercase tracking-[0.2em]">
                  {type.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </ToolPanel>

      {/* Side Panel */}
      <div className="w-full lg:w-[380px] shrink-0 flex flex-col gap-6 pb-8 lg:pb-0">

        {/* History Panel */}
        <HistoryPanel
          title="Roll History"
          className="min-h-[220px] lg:min-h-0"
          items={history}
          onClear={() => setHistory([])}
          emptyMessage="No rolls yet"
          icon={HistoryIcon}
          itemsPerPage={isMobile ? 4 : 12}
          reservePaginationSpace={true}
          listClassName="grid grid-cols-4 gap-4"
          renderItem={(h, i) => (
            <motion.div
              key={`${h}-${i}`}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="h-16 lg:h-20 rounded-2xl bg-surface border-4 border-slate-100 flex items-center justify-center text-xl font-black text-primary shadow-sm hover:scale-105 transition-transform"
            >
              {h}
            </motion.div>
          )}
        />
      </div>
    </div>
  );
};

export default DiceRoller;
