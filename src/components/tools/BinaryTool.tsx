import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  RotateCcw,
  Zap,
  ArrowLeft
} from 'lucide-react';
import { ToolPanel } from '../shared/ToolPanel';
import { useHeader } from '../../contexts/HeaderContext';
import { useSettings } from '../../contexts/SettingsContext';
import { audioEngine } from '../../utils/audio';

// 1. Constants (None)

// 2. Config (None)

// 3. Text (Help and Info)
const HELP_INFO = (
  <div className="space-y-4 font-['Outfit']">
    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">How to Use</h3>
    <div className="space-y-3">
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center text-xs font-black text-indigo-600 shrink-0">1</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">Click the <b>Cards</b> to change them to 0 or 1.</p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center text-xs font-black text-blue-600 shrink-0">2</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">Watch the <b>Total</b> at the top change as you flip them.</p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-emerald-50 flex items-center justify-center text-xs font-black text-emerald-600 shrink-0">3</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">The numbers above each card show how much each card is worth.</p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-slate-900 flex items-center justify-center text-xs font-black text-white shrink-0">4</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">Type a number to see it in binary.</p>
      </div>
    </div>
  </div>
);

// 4. Local Storage (None)

// 5. Classes (None)

// 6. Functions (None)

// 7. Component
export const BinaryTool = () => {
  const { setHeaderActions, setOnReset, clearHeader, setHelpContent } = useHeader();
  const { settings } = useSettings();
  
  const [binary, setBinary] = useState(new Array(8).fill(0));
  
  const decimal = useMemo(() => {
    return binary.reduce((acc, bit, idx) => {
      return acc + (bit * Math.pow(2, 7 - idx));
    }, 0);
  }, [binary]);

  const resetTool = useCallback(() => {
    setBinary(new Array(8).fill(0));
    audioEngine.playTick(settings.soundTheme);
  }, [settings.soundTheme]);

  const toggleBit = (index: number) => {
    setBinary(prev => {
      const next = [...prev];
      next[index] = next[index] === 0 ? 1 : 0;
      return next;
    });
    audioEngine.playTick(settings.soundTheme);
  };

  const handleDecimalChange = (val: string) => {
    const num = Math.max(0, Math.min(255, parseInt(val) || 0));
    const binString = num.toString(2).padStart(8, '0');
    setBinary(binString.split('').map(Number));
    audioEngine.playTick(settings.soundTheme);
  };

  useEffect(() => {
    setOnReset(() => resetTool);
    setHelpContent(HELP_INFO);
    return () => clearHeader();
  }, [clearHeader, setOnReset, resetTool, setHelpContent]);

  useEffect(() => {
    setHeaderActions(
      <div className="flex items-center gap-4 italic">
        <button
          onClick={resetTool}
          className="flex items-center gap-2 px-8 py-2 bg-white border-2 border-slate-100 text-slate-400 rounded-xl font-black text-[10px] uppercase tracking-widest hover:border-rose-100 hover:text-rose-600 transition-all active:scale-95 "
        >
          <ArrowLeft size={14} /> Reset
        </button>
      </div>
    );
  }, [settings.soundTheme, setHeaderActions, resetTool]);

  return (
    <ToolPanel className="flex-col items-center justify-center p-4 lg:p-12 overflow-hidden italic">
      <div className="w-full max-w-6xl flex flex-col items-center gap-16 lg:gap-20 relative z-10">
        
        {/* Total Display Area */}
        <div className="flex flex-col items-center gap-8 text-center">
          <div className="space-y-2">
            <span className="text-[12px] font-black text-indigo-400 uppercase tracking-[0.4em]">Total</span>
            <div className="flex items-center justify-center gap-8">
              <motion.div
                key={decimal}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-[10rem] lg:text-[14rem] font-black text-slate-900 leading-none tracking-tighter tabular-nums"
              >
                {decimal}
              </motion.div>
            </div>
          </div>

          <div className="flex items-center gap-4 px-10 py-5 bg-slate-900 rounded-[2rem] border-none  group">
            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Type a number:</span>
            <input 
              type="number"
              min="0"
              max="255"
              value={decimal === 0 ? '' : decimal}
              onChange={(e) => handleDecimalChange(e.target.value)}
              placeholder="0-255"
              className="bg-transparent text-3xl font-black text-white outline-none w-28 tabular-nums placeholder:text-slate-700"
            />
          </div>
        </div>

        {/* Binary Bit Row */}
        <div className="w-full grid grid-cols-4 md:grid-cols-8 gap-4 lg:gap-8">
          {binary.map((bit, idx) => {
            const val = Math.pow(2, 7 - idx);
            return (
              <div key={idx} className="flex flex-col items-center gap-6">
                <span className="text-[14px] font-black text-slate-300 tabular-nums uppercase">{val}</span>
                <motion.button
                  whileHover={{ y: -12, scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => toggleBit(idx)}
                  className={`w-full aspect-[2/3] rounded-[2.5rem] border-4 flex flex-col items-center justify-center gap-6 transition-all duration-500  ${
                    bit === 1 
                      ? 'bg-indigo-600 border-indigo-400 text-white ' 
                      : 'bg-white border-slate-50 text-slate-200 hover:border-indigo-100'
                  }`}
                >
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={bit}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="text-7xl lg:text-8xl font-black tabular-nums"
                    >
                      {bit}
                    </motion.span>
                  </AnimatePresence>
                  <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${bit === 1 ? 'bg-white/20 text-white' : 'bg-slate-50 text-slate-400'}`}>
                    2<sup>{7-idx}</sup>
                  </div>
                </motion.button>
              </div>
            );
          })}
        </div>

        {/* Conversion Info */}
        <div className="w-full max-w-4xl bg-slate-50/50 backdrop-blur-xl rounded-[3rem] p-12 border-4 border-white  flex flex-col md:flex-row items-center justify-between gap-12">
          <div className="flex flex-col gap-2 text-center md:text-left">
            <h4 className="text-2xl font-black text-slate-900 tracking-tighter uppercase leading-none">Math</h4>
            <p className="text-[12px] font-black text-slate-400 uppercase tracking-widest leading-relaxed max-w-sm">Add up the numbers to get the total.</p>
          </div>
          
          <div className="flex flex-wrap items-center justify-center gap-4">
            {binary.map((bit, i) => bit === 1 && (
              <div key={i} className="flex items-center gap-4 px-8 py-4 bg-white rounded-2xl border-none  animate-in fade-in slide-in-from-right-4">
                <span className="text-2xl font-black text-indigo-600 tabular-nums">{Math.pow(2, 7-i)}</span>
                {binary.slice(i + 1).some(b => b === 1) && <span className="text-slate-200 font-black">+</span>}
              </div>
            ))}
            {binary.every(b => b === 0) && (
              <div className="flex items-center gap-4 text-slate-300 font-black py-4 uppercase tracking-widest text-[11px]">
                <Zap size={20} className="text-amber-400 animate-pulse" />
                <span>Flip a card to start</span>
              </div>
            )}
            {!binary.every(b => b === 0) && (
              <div className="flex items-center gap-4 px-8 py-4">
                <span className="text-slate-200 font-black text-3xl">=</span>
                <span className="text-5xl font-black text-slate-900 tabular-nums tracking-tighter">{decimal}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </ToolPanel>
  );
};

export default BinaryTool;
