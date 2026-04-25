import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, RotateCcw, Highlighter, Eraser, Grid3X3, Hash, MousePointer2, Zap, Gauge } from 'lucide-react';
import React, { useState, useEffect, useMemo } from 'react';
import { ToolHeader } from '../ToolHeader';

const ChartCell = ({ num, isHidden, highlightColor, animDelay, onClick, isPatternAnimating }) => {
  // Reveal hidden number if it's highlighted
  const isCurrentlyVisible = !isHidden || highlightColor !== null;

  return (
    <motion.button
      onClick={() => onClick(num)}
      animate={{
        backgroundColor: isCurrentlyVisible && highlightColor ? `${highlightColor}25` : (isCurrentlyVisible ? '#ffffff' : '#f1f5f9'),
        color: isCurrentlyVisible && highlightColor ? highlightColor : (isCurrentlyVisible ? '#334155' : 'transparent'),
      }}
      transition={{
        duration: 0.3,
        delay: isPatternAnimating ? animDelay : 0,
      }}
      className={`
        w-full h-full flex items-center justify-center relative overflow-hidden
        text-3xl font-black
      `}
    >
      <motion.div
        key={highlightColor} // Trigger animation when color changes
        initial={false}
        animate={highlightColor ? { scale: [1, 0.85, 1.15, 1] } : {}}
        transition={{ 
          duration: 0.4, 
          delay: isPatternAnimating ? animDelay : 0,
          ease: "easeInOut"
        }}
        className="flex items-center justify-center w-full h-full"
      >
        {isCurrentlyVisible ? num : <Hash size={24} className="text-slate-300" />}
      </motion.div>
    </motion.button>
  );
};

export const HundredsChart = () => {
  const [hiddenNumbers, setHiddenNumbers] = useState(new Set());
  const [highlighted, setHighlighted] = useState({}); // { number: colorIndex }
  const [activeMode, setActiveMode] = useState(1); // 0 = hide, 1-6 = colors
  const [animSpeed, setAnimSpeed] = useState(20); // ms per number
  const [isPatternAnimating, setIsPatternAnimating] = useState(false);

  const colors = [
    '#3b82f6', // blue
    '#ef4444', // red
    '#10b981', // green
    '#f59e0b', // amber
    '#8b5cf6', // violet
    '#ec4899', // pink
  ];

  const speeds = [
    { label: 'Slow', value: 50 },
    { label: 'Medium', value: 20 },
    { label: 'Fast', value: 5 },
  ];

  const handleCellClick = (num) => {
    if (activeMode === 0) {
      setHiddenNumbers(prev => {
        const next = new Set(prev);
        if (next.has(num)) next.delete(num);
        else next.add(num);
        return next;
      });
    } else {
      setHighlighted(prev => {
        const next = { ...prev };
        const colorIndex = activeMode - 1;
        if (next[num] === colorIndex) delete next[num];
        else next[num] = colorIndex;
        return next;
      });
    }
  };

  const highlightMultiples = (multiple) => {
    setIsPatternAnimating(true);
    const newHighlights = { ...highlighted };
    const colorIndex = activeMode === 0 ? 0 : activeMode - 1;
    
    for (let i = multiple; i <= 100; i += multiple) {
      newHighlights[i] = colorIndex;
    }
    setHighlighted(newHighlights);
    
    setTimeout(() => setIsPatternAnimating(false), 100 * animSpeed + 400);
  };

  const clearAll = () => {
    setHiddenNumbers(new Set());
    setHighlighted({});
    setIsPatternAnimating(false);
  };

  const hideAll = () => {
    const all = new Set();
    for (let i = 1; i <= 100; i++) all.add(i);
    setHiddenNumbers(all);
  };

  const revealAll = () => setHiddenNumbers(new Set());

  const rows = useMemo(() => {
    const r = [];
    for (let i = 0; i < 10; i++) {
      const row = [];
      for (let j = 1; j <= 10; j++) row.push(i * 10 + j);
      r.push(row);
    }
    return r;
  }, []);

  return (
    <div className="w-full mx-auto px-4 pt-2 pb-8 h-full flex flex-col gap-8">
      <ToolHeader
        title="Interactive Hundreds Chart"
        icon={Grid3X3}
        description="Interactive base-10 exploration and pattern finding"
        infoContent={
          <>
            <p>
              <strong className="text-white block mb-1">Modes</strong>
              Use "Hide Mode" to conceal numbers for guessing games. Use colors to highlight multiples or skip-counting patterns.
            </p>
            <p>
              <strong className="text-white block mb-1">Patterns</strong>
              Quickly highlight multiples of 2, 3, 5, or 10 with the pattern cascade buttons.
            </p>
          </>
        }
      >
        <div className="flex flex-wrap gap-3">
          <div className="flex bg-slate-100 p-1.5 rounded-2xl border-2 border-slate-200">
            <button onClick={hideAll} className="px-5 py-2 text-sm font-black text-slate-600 hover:text-primary transition-colors">Hide All</button>
            <div className="w-px bg-slate-200 my-2" />
            <button onClick={revealAll} className="px-5 py-2 text-sm font-black text-slate-600 hover:text-primary transition-colors">Reveal All</button>
          </div>
          <button
            onClick={clearAll}
            className="p-3 bg-red-50 text-red-600 rounded-2xl font-black hover:bg-red-100 transition-all active:scale-95 border-2 border-red-100"
            title="Reset Chart"
          >
            <RotateCcw size={24} />
          </button>
        </div>
      </ToolHeader>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-6">
          {/* Tool Palette */}
          <div className="bg-white p-6 rounded-[2rem] border-2 border-slate-200 shadow-sm space-y-6">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest block">Tools & Colors</label>
            <div className="grid grid-cols-4 gap-3">
              <button
                onClick={() => setActiveMode(0)}
                className={`col-span-4 flex items-center justify-center gap-3 p-4 rounded-2xl border-2 transition-all ${
                  activeMode === 0 ? 'border-slate-800 bg-slate-800 text-white shadow-xl' : 'border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200'
                }`}
              >
                <EyeOff size={24} />
                <span className="font-black uppercase text-sm tracking-tighter">Hide Mode</span>
              </button>
              
              {colors.map((color, i) => (
                <button
                  key={color}
                  onClick={() => setActiveMode(i + 1)}
                  className={`aspect-square rounded-xl transition-all relative ${
                    activeMode === i + 1 ? 'ring-4 ring-offset-2 ring-slate-800 scale-110 z-10' : 'scale-100 opacity-60 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: color }}
                >
                  {activeMode === i + 1 && <div className="absolute inset-0 flex items-center justify-center text-white"><Highlighter size={16} /></div>}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-[2rem] border-2 border-slate-200 shadow-sm space-y-4">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Gauge size={14} /> Cascade Speed
            </label>
            <div className="flex gap-2">
              {speeds.map(s => (
                <button
                  key={s.label}
                  onClick={() => setAnimSpeed(s.value)}
                  className={`flex-1 py-2 text-xs font-black rounded-xl border-2 transition-all ${
                    animSpeed === s.value ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' : 'bg-slate-50 border-slate-100 text-slate-400'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-[2rem] border-2 border-slate-200 shadow-sm space-y-4">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Zap size={14} /> Pattern Cascade
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[2, 3, 5, 10].map(m => (
                <button
                  key={m}
                  onClick={() => highlightMultiples(m)}
                  className="p-3 bg-slate-50 border-2 border-slate-100 rounded-xl text-sm font-black text-slate-600 hover:border-primary hover:text-primary transition-all active:scale-95"
                >
                  Multiples of {m}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-3">
          <div className="bg-white p-4 sm:p-10 rounded-[3rem] border-4 border-slate-800 shadow-2xl overflow-hidden">
            <div className="grid grid-cols-10 gap-0 border-2 border-slate-800">
              {rows.flat().map(num => (
                <div key={num} className="aspect-square">
                  <ChartCell
                    num={num}
                    isHidden={hiddenNumbers.has(num)}
                    highlightColor={highlighted[num] !== undefined ? colors[highlighted[num]] : null}
                    animDelay={isPatternAnimating ? (num * animSpeed) / 1000 : 0}
                    isPatternAnimating={isPatternAnimating}
                    onClick={handleCellClick}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 flex items-center justify-center gap-3 text-slate-400 font-bold text-sm">
            <MousePointer2 size={16} />
            Tip: Highlighted numbers stay visible even if "hidden"!
          </div>
        </div>
      </div>
    </div>
  );
};


