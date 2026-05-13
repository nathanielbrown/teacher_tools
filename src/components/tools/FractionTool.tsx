import React, { useEffect, useRef, useCallback } from 'react';

import { 
  ChevronUp, 
  ChevronDown,
  Plus,
  Minus
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useHeader } from '../../contexts/HeaderContext';
import { useSettings } from '../../contexts/SettingsContext';
import { ToolPanel } from '../shared/ToolPanel';
import { SettingsPanel } from '../shared/SettingsPanel';
import { audioEngine } from '../../utils/audio';
import { FormattedMessage } from 'react-intl';
import { useLocalStorage } from '../../hooks/useLocalStorage';


// 1. Constants
const COLORS = [
  { name: 'Red', value: '#ef4444' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Yellow', value: '#eab308' },
  { name: 'Green', value: '#22c55e' },
  { name: 'Cyan', value: '#06b6d4' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Violet', value: '#8b5cf6' },
  { name: 'Pink', value: '#ec4899' },
];

// 2. Config (None)

// 3. Text (Help and Info)
const HelpContent = () => (
  <div className="space-y-4 font-['Outfit']">
    <div className="space-y-3 italic">
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center text-xs font-black text-indigo-600 shrink-0">1</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">
          <FormattedMessage id="fractionTool.help.step1" defaultMessage="Use the arrows to change the top number (numerator) and bottom number (denominator)." />
        </p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center text-xs font-black text-indigo-600 shrink-0">2</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">
          <FormattedMessage id="fractionTool.help.step2" defaultMessage="Watch the rectangle and number line change to show your fraction." />
        </p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center text-xs font-black text-indigo-600 shrink-0">3</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">
          <FormattedMessage id="fractionTool.help.step3" defaultMessage="Click on pieces of the rectangle to select how many you have." />
        </p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center text-xs font-black text-indigo-600 shrink-0">4</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">
          <FormattedMessage id="fractionTool.help.step4" defaultMessage="Open the Colors menu to change the color of your fraction." />
        </p>
      </div>
    </div>
  </div>
);

// 4. Local Storage (None)

// 5. Classes (None)

// 6. Functions
// 6. Functions (None)

// 7. Component
export const FractionTool = () => {
  const { setHasConfig, setOnConfigToggle, setOnReset, isConfigOpen, setIsConfigOpen, setHelpContent, clearHeader } = useHeader();
  const { settings } = useSettings();
  
  const [numerator, setNumerator] = useLocalStorage('fractiontool_numerator', 2);
  const [denominator, setDenominator] = useLocalStorage('fractiontool_denominator', 4);
  const [activeColor, setActiveColor] = useLocalStorage('fractiontool_color', '#ef4444');

  const lineRef = useRef<HTMLDivElement>(null);

  const resetTool = useCallback(() => {
    setNumerator(2);
    setDenominator(4);
    setActiveColor('#ef4444');
    setIsConfigOpen(false);
    audioEngine.playTick(settings.soundTheme);
  }, [settings.soundTheme, setIsConfigOpen, setNumerator, setDenominator, setActiveColor]);


  useEffect(() => {
    setHasConfig(true);
    setOnConfigToggle(() => () => setIsConfigOpen(prev => !prev));
    setOnReset(() => resetTool);
    setHelpContent(<HelpContent />);
    return () => clearHeader();
  }, [clearHeader, setOnReset, resetTool, setHelpContent, setHasConfig, setOnConfigToggle, setIsConfigOpen]);

  const updateNumerator = (val: number) => {
    const next = Math.max(0, Math.min(denominator, numerator + val));
    if (next !== numerator) {
      setNumerator(next);
      audioEngine.playTick(settings.soundTheme);
    }
  };

  const updateDenominator = (val: number) => {
    const next = Math.max(1, Math.min(20, denominator + val));
    if (next !== denominator) {
      setDenominator(next);
      if (numerator > next) setNumerator(next);
      audioEngine.playTick(settings.soundTheme);
    }
  };

  const handleLineClick = (e: React.MouseEvent) => {
    if (!lineRef.current) return;
    const rect = lineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = Math.max(0, Math.min(1, x / rect.width));
    const closestVal = Math.round(percent * denominator);
    if (closestVal !== numerator) {
      setNumerator(closestVal);
      audioEngine.playTick(settings.soundTheme);
    }
  };


  return (
    <div className="flex flex-col lg:flex-row gap-8 w-full h-full font-['Outfit'] select-none overflow-hidden relative">
      <AnimatePresence>
        {isConfigOpen && (
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className={`
              ${isConfigOpen ? 'flex' : 'hidden'} 
              fixed inset-0 z-[100] p-4 bg-slate-900/20 backdrop-blur-sm
              lg:relative lg:inset-auto lg:z-auto lg:p-0 lg:bg-transparent lg:backdrop-blur-none
              lg:flex lg:w-[320px] flex-col h-full gap-8 italic overflow-hidden shrink-0
            `}
          >
            <SettingsPanel
              isOpen={isConfigOpen}
              onClose={() => setIsConfigOpen(false)}
              compact
              className="h-full lg:h-full"
            >
              <div className="space-y-6">
                <div className="space-y-3">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">
                    <FormattedMessage id="fractionTool.settings.color" defaultMessage="Fraction Color" />
                  </h4>
                  <div className="grid grid-cols-4 gap-4">
                    {COLORS.map((c) => (
                      <button
                        key={c.name}
                        onClick={() => { setActiveColor(c.value); audioEngine.playTick(settings.soundTheme); }}
                        className={`aspect-square rounded-2xl border-4 transition-all hover:scale-110 flex items-center justify-center ${activeColor === c.value ? 'border-indigo-600 scale-110 ' : 'border-white '}`}
                        style={{ backgroundColor: c.value }}
                      >
                         {activeColor === c.value && <div className="w-4 h-4 rounded-full bg-white " />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </SettingsPanel>
          </motion.div>
        )}
      </AnimatePresence>

      <ToolPanel className="flex-1 italic" baseWidth={1200} baseHeight={800}>
      <div className="flex flex-col lg:flex-row gap-4 lg:gap-8 w-full h-full relative z-10 p-4 lg:p-8 overflow-y-auto lg:overflow-hidden custom-scrollbar">
        
        {/* Left: Fraction Readout Core */}
        <div className="w-full lg:w-[400px] shrink-0 bg-white rounded-[3rem] lg:rounded-[4rem] border-4 border-white flex flex-col items-center justify-center relative overflow-hidden group py-12 lg:py-0">
           <div className="flex flex-col items-center gap-6 lg:gap-4 bg-white p-6 lg:p-8 rounded-[3rem] lg:rounded-[5rem] border-4 border-white relative group/core">
              <div className="flex items-center gap-6 lg:gap-8">
                <button onClick={() => updateNumerator(-1)} className="text-slate-200 hover:text-indigo-600 transition-all active:scale-95"><Minus size={48} strokeWidth={4} /></button>
                <span className="text-[10rem] lg:text-[10rem] font-black leading-none text-slate-800 tabular-nums tracking-tighter">{numerator}</span>
                <button onClick={() => updateNumerator(1)} className="text-slate-200 hover:text-indigo-600 transition-all active:scale-95"><Plus size={48} strokeWidth={4} /></button>
              </div>
              
              <div className="w-full h-4 bg-slate-800 rounded-full" />
              
              <div className="flex items-center gap-6 lg:gap-8">
                <button onClick={() => updateDenominator(-1)} className="text-slate-200 hover:text-indigo-600 transition-all active:scale-95"><Minus size={48} strokeWidth={4} /></button>
                <span className="text-[10rem] lg:text-[10rem] font-black leading-none text-slate-800 tabular-nums tracking-tighter">{denominator}</span>
                <button onClick={() => updateDenominator(1)} className="text-slate-200 hover:text-indigo-600 transition-all active:scale-95"><Plus size={48} strokeWidth={4} /></button>
              </div>
            </div>
        </div>

        {/* Right Column: Circle (Top) and Line (Bottom) */}
        <div className="flex-1 flex flex-col gap-8">
           {/* Rectangle Visualization Module (Top Right) */}
           <div className="flex-1 bg-white rounded-[3rem] lg:rounded-[4rem] border-4 border-white flex items-center justify-center relative overflow-hidden p-8">
              <div className="w-full max-w-[900px] h-48 lg:h-32 border-4 border-slate-100 rounded-[2rem] lg:rounded-[2rem] overflow-hidden flex bg-slate-50 relative group/rect">
                 {Array.from({ length: denominator }).map((_, i) => {
                   const isActive = i < numerator;
                   return (
                     <motion.div
                       key={i}
                       initial={false}
                       animate={{ 
                         backgroundColor: isActive ? activeColor : '#ffffff',
                       }}
                       onClick={() => { setNumerator(i + 1); audioEngine.playTick(settings.soundTheme); }}
                       className="flex-1 border-r-4 last:border-r-0 border-white cursor-pointer hover:brightness-95 transition-all relative"
                     />
                   );
                 })}
              </div>
           </div>

           {/* Number Line Module (Bottom Right) */}
           <div className="h-[240px] lg:h-[250px] bg-white p-6 lg:p-8 rounded-[3rem] lg:rounded-[4rem] border-4 border-white flex flex-col justify-end pb-8 lg:pb-12 relative overflow-hidden shrink-0 select-none">
              <div className="px-8 pt-24 pb-8 relative z-10">
                 <div ref={lineRef} onClick={handleLineClick} className="h-4 bg-slate-50 rounded-full w-full relative cursor-pointer group ">
                    <div className="absolute top-1/2 -translate-y-1/2 left-0 h-16 w-1 bg-slate-100">
                       <div className="absolute -top-12 left-1/2 -translate-x-1/2 flex flex-col items-center">
                          <span className="text-sm font-black text-slate-400">0</span>
                          <div className="w-4 h-0.5 bg-slate-200 my-0.5" />
                          <span className="text-sm font-black text-slate-400">{denominator}</span>
                       </div>
                    </div>
                    <div className="absolute top-1/2 -translate-y-1/2 right-0 h-16 w-1 bg-slate-100">
                       <div className="absolute -top-12 left-1/2 -translate-x-1/2 flex flex-col items-center">
                          <span className="text-sm font-black text-slate-400">{denominator}</span>
                          <div className="w-4 h-0.5 bg-slate-200 my-0.5" />
                          <span className="text-sm font-black text-slate-400">{denominator}</span>
                       </div>
                    </div>
                    {denominator > 1 && Array.from({ length: denominator - 1 }).map((_, i) => (
                      <div key={i} className="absolute top-1/2 -translate-y-1/2 w-0.5 h-8 bg-slate-100" style={{ left: `${((i + 1) / denominator) * 100}%` }}>
                         <div className="absolute -top-20 left-1/2 -translate-x-1/2 flex flex-col items-center">
                            <span className={`text-xl font-black text-slate-400 ${denominator > 12 ? 'hidden sm:block' : ''}`}>{i + 1}</span>
                            <div className={`w-6 h-1 bg-slate-200 my-0.5 ${denominator > 12 ? 'hidden sm:block' : ''}`} />
                            <span className={`text-xl font-black text-slate-400 ${denominator > 12 ? 'hidden sm:block' : ''}`}>{denominator}</span>
                         </div>
                      </div>
                    ))}
                    <motion.div 
                      onPan={(_, info) => {
                        if (!lineRef.current) return;
                        const rect = lineRef.current.getBoundingClientRect();
                        const x = info.point.x - rect.left;
                        const percent = Math.max(0, Math.min(1, x / rect.width));
                        const closestVal = Math.round(percent * denominator);
                        if (closestVal !== numerator) {
                          setNumerator(closestVal);
                          audioEngine.playTick(settings.soundTheme);
                        }
                      }}
                      className="absolute top-1/2 -translate-y-1/2 w-12 h-12 rounded-2xl border-4 border-white flex items-center justify-center z-10 cursor-grab active:cursor-grabbing"
                      style={{ 
                        left: `calc(${(numerator / denominator) * 100}% - 1.5rem)`,
                        backgroundColor: activeColor
                      }}
                      transition={{ type: 'spring', damping: 25, stiffness: 600 }}
                    >
                       <div className="w-2 h-2 rounded-full bg-white/50" />
                    </motion.div>
                 </div>
              </div>
           </div>
        </div>
      </div>

      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-50 rounded-full blur-[150px] opacity-40 -z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-rose-50 rounded-full blur-[150px] opacity-40 -z-10 pointer-events-none" />
    </ToolPanel>
    </div>
  );
};

export default FractionTool;
