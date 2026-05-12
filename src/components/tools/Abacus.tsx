import React, { useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useHeader } from '../../contexts/HeaderContext';
import { useSettings } from '../../contexts/SettingsContext';
import { audioEngine } from '../../utils/audio';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { ToolPanel } from '../shared/ToolPanel';
import { FormattedMessage } from 'react-intl';

// 1. Constants
const COLUMNS = 10;

// 2. Config
const COLUMN_CONFIG = [
  { label: '1,000,000,000', value: 1000000000, color: '#ef4444' },
  { label: '100,000,000', value: 100000000, color: '#facc15' },
  { label: '10,000,000', value: 10000000, color: '#3b82f6' },
  { label: '1,000,000', value: 1000000, color: '#f472b6' },
  { label: '100,000', value: 100000, color: '#22c55e' },
  { label: '10,000', value: 10000, color: '#ef4444' },
  { label: '1,000', value: 1000, color: '#facc15' },
  { label: '100', value: 100, color: '#3b82f6' },
  { label: '10', value: 10, color: '#f472b6' },
  { label: '1', value: 1, color: '#22c55e' },
];

// 3. Text (Help and Info)
const getHelpInfo = () => (
  <div className="space-y-4 font-['Outfit']">
    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight italic">
      <FormattedMessage id="abacus.help.title" defaultMessage="How to Use the Abacus" />
    </h3>
    <div className="space-y-3 italic">
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-green-50 flex items-center justify-center text-xs font-black text-green-600 shrink-0">1</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">
          <FormattedMessage id="abacus.help.step1" defaultMessage="Click beads to move them towards the center bar to count." />
        </p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-pink-50 flex items-center justify-center text-xs font-black text-pink-600 shrink-0">2</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">
          <FormattedMessage 
            id="abacus.help.step2" 
            defaultMessage="<b>Heaven Beads</b> (top) are worth <b>5</b> each."
            values={{ b: (chunks: React.ReactNode) => <b>{chunks}</b> }}
          />
        </p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center text-xs font-black text-blue-600 shrink-0">3</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">
          <FormattedMessage 
            id="abacus.help.step3" 
            defaultMessage="<b>Earth Beads</b> (bottom) are worth <b>1</b> each."
            values={{ b: (chunks: React.ReactNode) => <b>{chunks}</b> }}
          />
        </p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-yellow-50 flex items-center justify-center text-xs font-black text-yellow-600 shrink-0">4</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">
          <FormattedMessage id="abacus.help.step4" defaultMessage="Each column represents a different value, starting from 1s on the left up to 1,000,000,000s!" />
        </p>
      </div>
    </div>
  </div>
);

// 4. Local Storage (None)

// 5. Classes (None)

// 6. Functions (None)

// 7. Component
interface ColumnState {
  upper: number; // 0, 1, or 2 (beads moved down to bar)
  lower: number; // 0 to 5 (beads moved up to bar)
}

export const Abacus = () => {
  const { setOnReset, setHasConfig, clearHeader, setHelpContent } = useHeader();
  const { settings } = useSettings();
  
  const [columnStates, setColumnStates] = useLocalStorage<ColumnState[]>(
    'abacus_value',
    new Array(COLUMNS).fill(null).map(() => ({ upper: 0, lower: 0 }))
  );

  const resetAbacus = useCallback(() => {
    setColumnStates(new Array(COLUMNS).fill(null).map(() => ({ upper: 0, lower: 0 })));
    audioEngine.playTick(settings.soundTheme);
  }, [settings.soundTheme, setColumnStates]);

  useEffect(() => {
    setOnReset(() => resetAbacus);
    setHasConfig(false);
    setHelpContent(getHelpInfo());
    return () => clearHeader();
  }, [clearHeader, setOnReset, resetAbacus, setHelpContent, setHasConfig]);

  const handleUpperClick = (colIdx: number, beadIdx: number) => {
    setColumnStates(prev => {
      const next = prev.map((s, i) => {
        if (i !== colIdx) return s;
        const currentUpper = s.upper;
        if (beadIdx === 1) { // Bead closer to bar
           return { ...s, upper: currentUpper >= 1 ? 0 : 1 };
        } else { // Top bead
           return { ...s, upper: currentUpper === 2 ? 0 : 2 };
        }
      });
      return next;
    });
    audioEngine.playTick(settings.soundTheme);
  };

  const handleLowerClick = (colIdx: number, beadIdx: number) => {
    setColumnStates(prev => {
      const next = prev.map((s, i) => {
        if (i !== colIdx) return s;
        const clickedCount = beadIdx + 1;
        return { ...s, lower: s.lower === clickedCount ? clickedCount - 1 : clickedCount };
      });
      return next;
    });
    audioEngine.playTick(settings.soundTheme);
  };

  const totalValue = columnStates.reduce((acc, state, idx) => {
    return acc + (state.upper * 5 + state.lower) * COLUMN_CONFIG[idx].value;
  }, 0);

  return (
    <ToolPanel className="italic" baseWidth={1200} baseHeight={800}>
      <div className="w-full max-w-6xl flex flex-col items-center gap-8 relative z-10">
        
        {/* Place Value Labels Row */}
        <div className="w-full grid grid-cols-10 px-4">
          {COLUMN_CONFIG.map((conf, idx) => (
            <div key={idx} className="flex flex-col items-center">
              <span className="text-[10px] lg:text-[12px] font-black text-slate-400 text-center uppercase tracking-tighter">
                {conf.label}
              </span>
            </div>
          ))}
        </div>

        {/* The Abacus Frame */}
        <div className="w-full aspect-[2/1] relative bg-[#fcf6eb] rounded-[3rem] p-6 lg:p-10  border-[20px] border-[#dcb07a] overflow-hidden group/abacus">
          <div className="absolute inset-0 pointer-events-none opacity-[0.05] mix-blend-multiply bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')]" />
          
          <div className="absolute inset-0 flex flex-col">
            {/* Heaven Deck */}
            <div className="h-[35%] w-full relative border-b-[12px] border-[#dcb07a]  flex">
               <div className="absolute inset-0 grid grid-cols-10 px-4 pointer-events-none">
                 {Array.from({ length: 10 }).map((_, i) => (
                   <div key={i} className="flex justify-center h-full">
                     <div className="w-3 h-full bg-gradient-to-r from-[#8b5e34] via-[#b08968] to-[#8b5e34] " />
                   </div>
                 ))}
               </div>

               <div className="flex-1 grid grid-cols-10 px-4 relative z-10">
                 {columnStates.map((state, colIdx) => (
                   <div key={colIdx} className="relative flex flex-col items-center h-full">
                     {[0, 1].map((beadIdx) => {
                       let pos = beadIdx === 0 ? 0 : 1;
                       if (state.upper === 1 && beadIdx === 1) pos = 3;
                       if (state.upper === 2) pos = beadIdx === 0 ? 2 : 3;

                       return (
                         <motion.button
                           key={beadIdx}
                           onClick={() => handleUpperClick(colIdx, beadIdx)}
                           className="absolute w-[90%] h-[24%] rounded-full  border-y-4 border-white/40 active:scale-95 transition-all overflow-hidden hover:brightness-110"
                           style={{ 
                             backgroundColor: COLUMN_CONFIG[colIdx].color,
                             top: `${pos * 23}%`
                           }}
                           transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                         >
                           <div className="w-full h-full bg-gradient-to-br from-white/40 via-transparent to-black/40" />
                         </motion.button>
                       );
                     })}
                   </div>
                 ))}
               </div>
            </div>

            {/* Earth Deck */}
            <div className="flex-1 w-full relative flex">
               <div className="absolute inset-0 grid grid-cols-10 px-4 pointer-events-none">
                 {Array.from({ length: 10 }).map((_, i) => (
                   <div key={i} className="flex justify-center h-full">
                     <div className="w-3 h-full bg-gradient-to-r from-[#8b5e34] via-[#b08968] to-[#8b5e34] " />
                   </div>
                 ))}
               </div>

               <div className="flex-1 grid grid-cols-10 px-4 relative z-10">
                 {columnStates.map((state, colIdx) => (
                   <div key={colIdx} className="relative flex flex-col items-center h-full">
                     {[0, 1, 2, 3, 4].map((beadIdx) => {
                       const isActive = beadIdx < state.lower;
                       const pos = isActive ? beadIdx : 3 + beadIdx; 
                       
                       return (
                         <motion.button
                           key={beadIdx}
                           onClick={() => handleLowerClick(colIdx, beadIdx)}
                           className="absolute w-[90%] h-[12%] rounded-full  border-y-4 border-white/40 active:scale-95 transition-all overflow-hidden hover:brightness-110"
                           style={{ 
                             backgroundColor: COLUMN_CONFIG[colIdx].color,
                             top: `${pos * 11}%`
                           }}
                           transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                         >
                           <div className="w-full h-full bg-gradient-to-br from-white/40 via-transparent to-black/40" />
                         </motion.button>
                       );
                     })}
                   </div>
                 ))}
               </div>
            </div>
          </div>
        </div>

        {/* Console / Value Readout */}
        <div className="w-full grid grid-cols-10 px-4">
          {columnStates.map((state, idx) => {
            const count = state.upper * 5 + state.lower;
            return (
              <div key={idx} className="flex flex-col items-center">
                <motion.div 
                  animate={{ 
                    scale: count > 0 ? 1.2 : 1,
                    color: count > 0 ? COLUMN_CONFIG[idx].color : '#e2e8f0'
                  }}
                  className="text-3xl lg:text-4xl font-black tabular-nums italic"
                >
                  {count}
                </motion.div>
              </div>
            );
          })}
        </div>

        {/* Total Aggregator */}
         <div className="mt-4">
            <div className="px-16 py-6 bg-white rounded-[3rem]  border-4 border-slate-100 relative overflow-hidden group">
               <div className="tool-grid-bg opacity-10 pointer-events-none" />
               <div className="flex flex-col items-center relative z-10">
                  <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.5em] mb-2">
                    <FormattedMessage id="abacus.total" defaultMessage="Total" />
                  </span>
                  <span className="text-6xl font-black text-slate-900 tabular-nums tracking-tighter leading-none italic">
                     {totalValue.toLocaleString()}
                  </span>
               </div>
            </div>
         </div>
      </div>

      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-50 rounded-full blur-[120px] opacity-40 -z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-rose-50 rounded-full blur-[120px] opacity-40 -z-10 pointer-events-none" />
    </ToolPanel>
  );
};

export default Abacus;
