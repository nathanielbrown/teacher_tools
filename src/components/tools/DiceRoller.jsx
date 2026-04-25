import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dices, RotateCcw } from 'lucide-react';
import { ToolHeader } from '../ToolHeader';
import { useSettings } from '../../contexts/SettingsContext';
import { audioEngine } from '../../utils/audio';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { DICE_TYPES } from './DiceRoller/diceData';
import { DieSVG } from './DiceRoller/DiceComponents';

export const DiceRoller = () => {
  const [pool, setPool] = useState([]);
  const [isRolling, setIsRolling] = useState(false);
  const [rollHistory, setRollHistory] = useLocalStorage('dice_roller_history', []);
  const { settings } = useSettings();


  const addToPool = (sides) => {
    if (pool.length >= 24) return;
    const newDie = {
      id: Math.random().toString(36).substr(2, 9),
      sides,
      value: sides,
      delay: Math.random() * 0.2
    };
    setPool(prev => [...prev, newDie]);
    audioEngine.playTick(settings.soundTheme);
  };

  const removeFromPool = (id) => {
    setPool(prev => prev.filter(d => d.id !== id));
  };

  const clearPool = () => {
    setPool([]);
  };

  const rollPool = () => {
    if (pool.length === 0 || isRolling) return;
    
    setIsRolling(true);
    audioEngine.playTick(settings.soundTheme);

    setTimeout(() => {
      const newPool = pool.map(die => ({
        ...die,
        value: Math.floor(Math.random() * die.sides) + 1
      }));
      setPool(newPool);
      setIsRolling(false);
      
      const total = newPool.reduce((acc, d) => acc + d.value, 0);
      setRollHistory(prev => [{ total, dice: newPool }, ...prev].slice(0, 5));
      audioEngine.playTick(settings.soundTheme);
    }, 1200);
  };

  const total = useMemo(() => pool.reduce((acc, die) => acc + die.value, 0), [pool]);

  return (
    <div className="w-full mx-auto px-4 pt-2 pb-8 h-full flex flex-col gap-6">
      <ToolHeader
        title="Dice Roller"
        icon={Dices}
        description="Multi-sided 3D Dice Laboratory"
        infoContent={
          <>
            <p>
              <strong className="text-white block mb-1">Add Dice</strong>
              Click any of the dice buttons at the bottom to add them to your rolling pool. You can add up to 24 dice!
            </p>
            <p>
              <strong className="text-white block mb-1">Remove & Reset</strong>
              Click an individual die to remove it, or use the reset button to clear the entire pool.
            </p>
          </>
        }
      />

      <div className="flex-1 bg-white rounded-[2.5rem] shadow-2xl border-4 border-white overflow-hidden relative flex flex-col min-h-[500px]">

        <div className="flex-1 p-12 flex flex-wrap content-center justify-center gap-14 overflow-y-auto no-scrollbar bg-slate-50/30">
          <AnimatePresence mode="popLayout">
            {pool.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center space-y-4 opacity-10">
                <Dices size={100} className="mx-auto" strokeWidth={1} />
                <p className="font-bold text-2xl uppercase tracking-[0.2em]">Select dice to roll</p>
              </motion.div>
            ) : (
              pool.map((die) => (
                <motion.div
                  key={die.id}
                  layout
                  initial={{ scale: 0, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0 }}
                  className="relative cursor-pointer hover:brightness-105 transition-all"
                  onClick={() => !isRolling && removeFromPool(die.id)}
                >
                  <DieSVG 
                    sides={die.sides} 
                    value={die.value} 
                    isRolling={isRolling} 
                    size={110} 
                    delay={die.delay}
                  />
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>

        <div className="p-8 bg-white border-t border-slate-100 flex flex-wrap items-center justify-center gap-10">
           {/* Roll & Reset Controls */}
           <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
             <button
               onClick={rollPool}
               disabled={pool.length === 0 || isRolling}
               className="flex items-center gap-2 px-8 py-3 bg-slate-900 text-white rounded-xl font-black text-xs uppercase tracking-wider hover:bg-black transition-all active:scale-95 shadow-md disabled:opacity-50"
             >
               ROLL
             </button>
             <button
               onClick={clearPool}
               disabled={pool.length === 0}
               className="px-4 text-slate-400 rounded-xl hover:text-red-600 transition-all active:scale-95 disabled:opacity-30"
               title="Clear Pool"
             >
               <RotateCcw size={20} />
             </button>
           </div>
           
           <div className="w-px h-12 bg-slate-200 hidden md:block"></div>

           <div className="flex flex-wrap justify-center gap-4">
             {DICE_TYPES.map(type => (
               <button
                 key={type.sides}
                 onClick={() => addToPool(type.sides)}
                 className="w-16 h-16 bg-white rounded-2xl shadow-lg border border-slate-50 hover:border-indigo-500 hover:-translate-y-2 transition-all active:scale-90 flex items-center justify-center group overflow-hidden"
               >
                 <DieSVG sides={type.sides} value={type.sides} isRolling={false} size={48} />
               </button>
             ))}
           </div>
        </div>
      </div>

      <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-50 flex items-center justify-between gap-8 overflow-x-auto no-scrollbar">
         <div className="flex items-center gap-8 flex-1">
           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest shrink-0 border-r pr-8">Roll History</span>
           <div className="flex gap-4">
              {rollHistory.length === 0 ? (
                <span className="text-sm font-bold text-slate-300">No rolls yet</span>
              ) : (
                rollHistory.map((h, i) => (
                  <motion.div 
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    key={i} 
                    className="px-6 py-3 bg-slate-50 rounded-2xl font-black text-indigo-600 border border-slate-100 shadow-sm"
                  >
                    {h.total}
                  </motion.div>
                ))
              )}
           </div>
         </div>
         
         <div className="flex flex-col items-end shrink-0 pl-8 border-l border-slate-100">
           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Result</span>
           <span className="text-4xl font-black text-slate-900 tabular-nums">{total}</span>
         </div>
      </div>
    </div>
  );
};
