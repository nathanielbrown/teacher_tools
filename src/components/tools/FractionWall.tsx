import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ToolPanel } from '../shared/ToolPanel';
import { FormattedMessage } from 'react-intl';
import { useHeader } from '../../contexts/HeaderContext';
import { useSettings } from '../../contexts/SettingsContext';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { audioEngine } from '../../utils/audio';
import { Layout } from 'lucide-react';

// 1. Constants
const FRACTIONS = [
  { den: 1, color: '#f87171' },
  { den: 2, color: '#fb923c' },
  { den: 3, color: '#fbbf24' },
  { den: 4, color: '#facc15' },
  { den: 5, color: '#a3e635' },
  { den: 6, color: '#4ade80' },
  { den: 8, color: '#2dd4bf' },
  { den: 10, color: '#38bdf8' },
  { den: 12, color: '#818cf8' },
];

// 2. Config (None)

// 3. Text (Help and Info)
const getHelpInfo = () => (
  <div className="space-y-4 font-['Outfit']">
    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight italic">
      <FormattedMessage id="fraction.help.title" defaultMessage="How to Use the Fraction Wall" />
    </h3>
    <div className="space-y-3 italic">
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-primary/5 flex items-center justify-center text-xs font-black text-primary shrink-0">1</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">
          <FormattedMessage id="fraction.help.step1" defaultMessage="Look at the different rows. Each row represents one whole divided into different equal parts." />
        </p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center text-xs font-black text-blue-600 shrink-0">2</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">
          <FormattedMessage 
            id="fraction.help.step2" 
            defaultMessage="Click on a <b>fraction block</b> to highlight it. Use this to compare different fractions."
            values={{ b: (chunks: React.ReactNode) => <b>{chunks}</b> }}
          />
        </p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-success-bg flex items-center justify-center text-xs font-black text-success shrink-0">3</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">
          <FormattedMessage id="fraction.help.step3" defaultMessage="See how many 1/4s fit into 1/2, or how many 1/8s make 1/2!" />
        </p>
      </div>
    </div>
  </div>
);

// 4. Local Storage (None)

// 5. Classes (None)

// 6. Functions (None)

// 7. Component
export const FractionWall = () => {
  const { setOnReset, clearHeader, setHelpContent } = useHeader();
  const { settings } = useSettings();
  const [selectedDenominators, setSelectedDenominators] = useLocalStorage<number[]>('fraction_wall_denominators', [1, 2, 4, 8]);
  const [highlightedValue, setHighlightedValue] = useLocalStorage<{ num: number; den: number } | null>('fraction_wall_highlight', null);

  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 1024 : false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const clearAll = useCallback(() => {
    setSelectedDenominators([1, 2, 4, 8]);
    setHighlightedValue(null);
    audioEngine.playTick(settings.soundTheme);
  }, [settings.soundTheme, setSelectedDenominators, setHighlightedValue]);

  useEffect(() => {
    setOnReset(() => clearAll);
    setHelpContent(getHelpInfo());
    return () => clearHeader();
  }, [clearHeader, setOnReset, clearAll, setHelpContent]);

  const toggleDenominator = (den: number) => {
    if (selectedDenominators.includes(den)) {
      setSelectedDenominators(prev => prev.filter(d => d !== den));
    } else {
      setSelectedDenominators(prev => [...prev, den].sort((a, b) => a - b));
    }
    audioEngine.playTick(settings.soundTheme);
  };

  const isHighlighted = (den: number, index: number) => {
    if (!highlightedValue) return false;
    
    const targetTotal = (highlightedValue.num + 1) / highlightedValue.den;
    const rowTotal = targetTotal * den;
    
    // Check if the total is an exact multiple of the row's unit (within float error)
    const isExact = Math.abs(rowTotal - Math.round(rowTotal)) < 0.001;
    
    // Highlight blocks from 0 up to the target total in exact rows
    return isExact && index < Math.round(rowTotal);
  };

  return (
    <ToolPanel 
      className="italic" 
      baseWidth={isMobile ? 400 : 1200} 
      baseHeight={650} 
      alignTop={false}
      fluid={isMobile}
    >
      <div className="w-full flex flex-col items-center gap-6 lg:gap-2 relative z-10">
        
        {/* The Wall */}
        <div className="w-full bg-slate-50 rounded-[2.5rem] p-4 lg:p-2 border-4 border-white relative overflow-hidden group">
           <div className="tool-grid-bg opacity-10 pointer-events-none" />
           <div className="flex flex-col gap-1 relative z-10">
               {FRACTIONS.map((row, rowIdx) => (
                selectedDenominators.includes(row.den) && (
                  <div key={rowIdx} className="flex gap-1 md:gap-1 h-12 md:h-10 relative">
                     {Array.from({ length: row.den }).map((_, colIdx) => {
                       const active = isHighlighted(row.den, colIdx);
                       return (
                         <motion.button
                           key={colIdx}
                           onClick={() => { setHighlightedValue({ num: colIdx, den: row.den }); audioEngine.playTick(settings.soundTheme); }}
                           initial={false}
                           animate={{
                             backgroundColor: active ? row.color : '#f1f5f9',
                             color: active ? '#ffffff' : '#94a3b8',
                             scale: active ? 1.02 : 1,
                             zIndex: active ? 10 : 1
                           }}
                           className={`flex-1 rounded-xl md:rounded-2xl flex items-center justify-center transition-all border-b-2 md:border-b-4 ${active ? 'border-white/20' : 'border-slate-200/50 hover:bg-slate-100'}`}
                         >
                           <div className="flex flex-col items-center leading-none">
                              <span className="text-xl md:text-sm font-black italic leading-none">1</span>
                              <div className="w-full h-0.5 bg-current my-0" />
                              <span className="text-xl md:text-sm font-black italic leading-none">{row.den}</span>
                           </div>
                         </motion.button>
                       );
                     })}
                  </div>
                )
              ))}

              {/* Vertical Equivalency Line */}
              {highlightedValue && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: '100%' }}
                  className="absolute top-0 bottom-0 w-1.5 backdrop-blur-md rounded-full z-20 pointer-events-none"
                  style={{ 
                    left: `calc(${(highlightedValue.num + 1) / highlightedValue.den * 100}% - 3px)`,
                    backgroundColor: FRACTIONS.find(f => f.den === highlightedValue.den)?.color || 'white',
                    boxShadow: `0 0 15px ${FRACTIONS.find(f => f.den === highlightedValue.den)?.color || 'rgba(255,255,255,0.5)'}`
                  }}
                />
              )}
           </div>
        </div>

        {/* Denominator Toggles */}
        <div className="w-full flex md:flex-wrap md:justify-center gap-1 md:gap-3 p-2 md:p-6 bg-surface/80 backdrop-blur-xl rounded-[1.5rem] md:rounded-[3rem] border border-white shadow-xl shadow-slate-200/50">
          {FRACTIONS.map(f => (
            <button
              key={f.den}
              onClick={() => toggleDenominator(f.den)}
              className={`flex-1 min-w-0 h-10 md:h-auto md:px-4 md:py-2 rounded-lg md:rounded-2xl border-2 font-black transition-all uppercase tracking-tighter text-[10px] md:text-sm ${
                selectedDenominators.includes(f.den)
              ? 'bg-primary border-indigo-600 text-white scale-105 shadow-lg shadow-indigo-200'
              : 'bg-surface border-slate-100 text-neutral-400 hover:bg-surface hover:border-primary/20 hover:text-primary '
              }`}
            >
              1/{f.den}
            </button>
          ))}
        </div>

        {/* Legend / Info */}
        <div className="flex gap-8 italic">
          <div className="flex items-center gap-3">
             <div className="w-4 h-4 bg-primary rounded-full" />
             <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest leading-none">
               <FormattedMessage id="fraction.legend" defaultMessage="Equivalency Explorer" />
             </span>
          </div>
        </div>

      </div>

      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] opacity-40 -z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-success-bg rounded-full blur-[120px] opacity-40 -z-10 pointer-events-none" />
    </ToolPanel>
  );
};

export default FractionWall;
