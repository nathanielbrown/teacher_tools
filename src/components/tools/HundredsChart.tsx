import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Hash, Palette, Zap, Eraser, EyeOff
} from 'lucide-react';
import { useHeader } from '../../contexts/HeaderContext';
import { useSettings } from '../../contexts/SettingsContext';
import { audioEngine } from '../../utils/audio';
import { ToolPanel } from '../shared/ToolPanel';
import { useIntl, FormattedMessage } from 'react-intl';

// 1. Constants
const getColors = (intl: any) => [
  { id: 'white', value: '#ffffff', label: intl.formatMessage({ id: 'hundredschart.colors.clear', defaultMessage: 'Clear' }), icon: Eraser },
  { id: 'black', value: '#000000', label: intl.formatMessage({ id: 'hundredschart.colors.hide', defaultMessage: 'Hide' }), icon: EyeOff },
  { id: 'red', value: '#ef4444', label: intl.formatMessage({ id: 'hundredschart.colors.red', defaultMessage: 'Red' }) },
  { id: 'blue', value: '#3b82f6', label: intl.formatMessage({ id: 'hundredschart.colors.blue', defaultMessage: 'Blue' }) },
  { id: 'green', value: '#10b981', label: intl.formatMessage({ id: 'hundredschart.colors.green', defaultMessage: 'Green' }) },
  { id: 'yellow', value: '#f59e0b', label: intl.formatMessage({ id: 'hundredschart.colors.yellow', defaultMessage: 'Yellow' }) },
  { id: 'orange', value: '#f97316', label: intl.formatMessage({ id: 'hundredschart.colors.orange', defaultMessage: 'Orange' }) },
  { id: 'purple', value: '#8b5cf6', label: intl.formatMessage({ id: 'hundredschart.colors.purple', defaultMessage: 'Purple' }) },
];

const getAnimationSpeeds = (intl: any) => [
  { label: intl.formatMessage({ id: 'hundredschart.speed.slow', defaultMessage: '2 Seconds' }), value: 2000 },
  { label: intl.formatMessage({ id: 'hundredschart.speed.fast', defaultMessage: '1 Second' }), value: 1000 },
  { label: intl.formatMessage({ id: 'hundredschart.speed.instant', defaultMessage: 'Instant' }), value: 0 },
];

// 2. Config (None)

// 3. Text (Help and Info)
const HelpContent = () => (
  <div className="space-y-4 font-['Outfit']">
    <div className="space-y-3 italic">
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center text-xs font-black text-indigo-600 shrink-0">1</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">
          <FormattedMessage 
            id="hundredschart.help.step1" 
            defaultMessage="Pick a color and click any number to <b>highlight</b> it." 
            values={{ b: (chunks: React.ReactNode) => <b>{chunks}</b> }}
          />
        </p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center text-xs font-black text-indigo-600 shrink-0">2</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">
          <FormattedMessage 
            id="hundredschart.help.step2" 
            defaultMessage="Use the <b>Black color</b> to hide numbers for a guessing game!" 
            values={{ b: (chunks: React.ReactNode) => <b>{chunks}</b> }}
          />
        </p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center text-xs font-black text-indigo-600 shrink-0">3</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">
          <FormattedMessage 
            id="hundredschart.help.step3" 
            defaultMessage="Click the <b>Quick Highlight</b> buttons to see patterns of multiples (like 2, 5, or 10)." 
            values={{ b: (chunks: React.ReactNode) => <b>{chunks}</b> }}
          />
        </p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center text-xs font-black text-indigo-600 shrink-0">4</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">
          <FormattedMessage 
            id="hundredschart.help.step4" 
            defaultMessage="Adjust the <b>Animation Speed</b> to see patterns appear at different speeds." 
            values={{ b: (chunks: React.ReactNode) => <b>{chunks}</b> }}
          />
        </p>
      </div>
    </div>
  </div>
);

// 4. Local Storage (None)

// 5. Classes (None)

// 6. Functions
const ChartCell = ({ num, isHidden, highlightColor, onClick }: {
  num: number, isHidden: boolean, highlightColor: string | null, onClick: (n: number) => void
}) => {
  const isCurrentlyVisible = highlightColor !== null ? highlightColor !== '#000000' : !isHidden;

  return (
    <motion.button
      onClick={() => onClick(num)}
      animate={{
        backgroundColor: highlightColor && highlightColor !== '#000000' ? `${highlightColor}20` : (isCurrentlyVisible ? '#ffffff' : '#f8fafc'),
        color: highlightColor && highlightColor !== '#000000' ? highlightColor : (isCurrentlyVisible ? '#0f172a' : 'transparent'),
        borderColor: highlightColor && highlightColor !== '#000000' ? highlightColor : '#f1f5f9',
      }}
      transition={{
        duration: 0.3,
      }}
      className={`w-full h-full flex items-center justify-center relative overflow-hidden text-xl sm:text-2xl font-black border-[0.5px] ${isCurrentlyVisible ? '' : 'bg-slate-50'}`}
    >
      <motion.div
        key={highlightColor || (isHidden ? 'hidden' : 'visible')}
        initial={false}
        animate={highlightColor && highlightColor !== '#000000' ? { scale: [1, 0.9, 1.1, 1] } : {}}
        transition={{ 
          duration: 0.4, 
          ease: "easeInOut"
        }}
        className="flex items-center justify-center w-full h-full"
      >
        {isCurrentlyVisible ? num : <Hash size={14} className="text-slate-200" />}
      </motion.div>
    </motion.button>
  );
};

// 7. Component
export const HundredsChart = () => {
  const { setOnReset, clearHeader, setHelpContent } = useHeader();
  const { settings } = useSettings();
  const intl = useIntl();
  
  const colors = getColors(intl);
  const animationSpeeds = getAnimationSpeeds(intl);

  const [hiddenNumbers, setHiddenNumbers] = useState(new Set<number>());
  const [highlighted, setHighlighted] = useState<Record<number, string>>({});
  const [activeColor, setActiveColor] = useState<string | null>(colors[2].value);
  const [animSpeed, setAnimSpeed] = useState(2000);
  const [animState, setAnimState] = useState({ isRunning: false, multiple: 1, current: 1 });

  const clearAll = useCallback(() => {
    setHiddenNumbers(new Set());
    setHighlighted({});
    setAnimState({ isRunning: false, multiple: 1, current: 1 });
    audioEngine.playTick(settings.soundTheme);
  }, [settings.soundTheme]);

  useEffect(() => {
    setOnReset(() => clearAll);
    setHelpContent(<HelpContent />);
    return () => clearHeader();
  }, [clearAll, clearHeader, setOnReset, setHelpContent]);

  const handleCellClick = (num: number) => {
    audioEngine.playTick(settings.soundTheme);
    if (activeColor === '#000000') {
      // Black hides the number
      setHiddenNumbers(prev => {
        const next = new Set(prev);
        if (next.has(num)) next.delete(num);
        else {
          next.add(num);
          setHighlighted(prevH => {
            const nextH = { ...prevH };
            delete nextH[num];
            return nextH;
          });
        }
        return next;
      });
    } else if (activeColor === '#ffffff') {
      // White clears everything
      setHiddenNumbers(prev => {
        const next = new Set(prev);
        next.delete(num);
        return next;
      });
      setHighlighted(prev => {
        const next = { ...prev };
        delete next[num];
        return next;
      });
    } else if (activeColor) {
      // Other colors highlight
      setHighlighted(prev => {
        const next = { ...prev };
        if (next[num] === activeColor) delete next[num];
        else {
          next[num] = activeColor;
          setHiddenNumbers(prevHidden => {
            const nextHidden = new Set(prevHidden);
            nextHidden.delete(num);
            return nextHidden;
          });
        }
        return next;
      });
    }
  };

  const highlightMultiples = (multiple: number) => {
    audioEngine.playTick(settings.soundTheme);
    if (multiple === 0) {
      setAnimState({ isRunning: false, multiple: 1, current: 1 });
      return;
    }
    setAnimState({ isRunning: true, multiple, current: multiple });
  };

  useEffect(() => {
    if (!animState.isRunning) return;

    if (animState.current > 100) {
      setAnimState(prev => ({ ...prev, isRunning: false }));
      return;
    }

    if (animSpeed === 0) {
      setHighlighted(prevH => {
        const nextH = { ...prevH };
        let c = animState.current;
        while (c <= 100) {
          if (activeColor === '#000000' || activeColor === '#ffffff') {
            delete nextH[c];
          } else {
            nextH[c] = activeColor as string;
          }
          c += animState.multiple;
        }
        return nextH;
      });
      setHiddenNumbers(prevHidden => {
        const nextHidden = new Set(prevHidden);
        let c = animState.current;
        while (c <= 100) {
          if (activeColor === '#000000') {
            nextHidden.add(c);
          } else if (activeColor === '#ffffff' || activeColor) {
            nextHidden.delete(c);
          }
          c += animState.multiple;
        }
        return nextHidden;
      });
      setAnimState(prev => ({ ...prev, isRunning: false }));
      return;
    }

    const num = animState.current;
    
    if (num !== animState.multiple) {
      audioEngine.playTick(settings.soundTheme);
    }

    if (activeColor === '#000000') {
      setHiddenNumbers(prev => {
        const next = new Set(prev);
        next.add(num);
        return next;
      });
      setHighlighted(prev => {
        const next = { ...prev };
        delete next[num];
        return next;
      });
    } else if (activeColor === '#ffffff') {
      setHiddenNumbers(prev => {
        const next = new Set(prev);
        next.delete(num);
        return next;
      });
      setHighlighted(prev => {
        const next = { ...prev };
        delete next[num];
        return next;
      });
    } else {
      setHighlighted(prev => ({ ...prev, [num]: activeColor as string }));
      setHiddenNumbers(prev => {
        const next = new Set(prev);
        next.delete(num);
        return next;
      });
    }

    const timer = setTimeout(() => {
      setAnimState(prev => ({ ...prev, current: prev.current + prev.multiple }));
    }, animSpeed);

    return () => clearTimeout(timer);
  }, [animState, activeColor, animSpeed, settings.soundTheme]);

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
    <ToolPanel className="italic" baseWidth={1200} baseHeight={800}>
      <div className="flex-1 flex flex-col lg:flex-row gap-12 min-h-0 relative z-10">
        {/* Main Chart Area */}
        <div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden">
           <div className="w-full max-w-2xl aspect-square relative z-10 p-4 bg-white rounded-3xl  border-4 border-slate-50 overflow-hidden">
              <div className="grid grid-cols-10 h-full bg-white rounded-none overflow-hidden border-none ">
                {rows.flat().map(num => (
                  <div key={num} className="aspect-square">
                    <ChartCell
                      num={num}
                      isHidden={hiddenNumbers.has(num)}
                      highlightColor={highlighted[num] || null}
                      onClick={handleCellClick}
                    />
                  </div>
                ))}
              </div>
           </div>
        </div>

        {/* Interaction Sidebar (Right Side) */}
        <div className="w-full lg:w-[360px] flex flex-col gap-8 shrink-0 overflow-y-auto no-scrollbar">
           <div className="bg-white rounded-3xl p-8 space-y-10 border-4 border-slate-50  italic">
              
              {/* Tool Selection */}
              <div className="space-y-6">
                 <div className="flex items-center gap-3 text-indigo-600">
                    <Palette size={24} />
                    <h4 className="text-xl font-black uppercase tracking-tight">
                      <FormattedMessage id="hundredschart.sidebar.tools" defaultMessage="Colors" />
                    </h4>
                 </div>
                 
                  <div className="grid grid-cols-4 gap-4">
                    {colors.map(c => (
                      <button
                        key={c.id}
                        onClick={() => setActiveColor(c.value)}
                        className={`aspect-square rounded-2xl transition-all border-4 flex items-center justify-center ${activeColor === c.value ? 'scale-110  border-slate-900' : 'border-white opacity-60 hover:opacity-100 '}`}
                        style={{ backgroundColor: c.id === 'white' || c.id === 'black' ? (c.id === 'white' ? '#f8fafc' : '#1e293b') : c.value }}
                        title={c.label}
                      >
                        {c.icon && <c.icon size={20} className={c.id === 'white' ? 'text-slate-400' : 'text-white'} />}
                      </button>
                    ))}
                  </div>
              </div>

              {/* Multiples Selection */}
              <div className="space-y-6">
                 <div className="flex items-center gap-3 text-indigo-600">
                    <Zap size={20} />
                    <h4 className="text-lg font-black uppercase tracking-tight">
                      <FormattedMessage id="hundredschart.sidebar.highlight" defaultMessage="Patterns" />
                    </h4>
                 </div>
                  <div className="grid grid-cols-2 gap-4">
                    {[0, 1, 2, 3, 5, 10].map(m => (
                      <button
                        key={m}
                        onClick={() => highlightMultiples(m)}
                        className="py-4 bg-white border-4 border-slate-50 rounded-2xl text-xs font-black text-slate-400 hover:border-indigo-100 hover:text-indigo-600 transition-all active:scale-95 uppercase tracking-widest "
                      >
                        {m === 0 ? (
                          <FormattedMessage id="hundredschart.sidebar.stop" defaultMessage="Stop" />
                        ) : m === 1 ? (
                          <FormattedMessage id="hundredschart.sidebar.all" defaultMessage="All" />
                        ) : (
                          <FormattedMessage id="hundredschart.sidebar.multiples" defaultMessage="Multiples of {m}" values={{ m }} />
                        )}
                      </button>
                    ))}
                  </div>
              </div>

              {/* Speed Selection */}
              <div className="space-y-6">
                 <div className="flex items-center gap-3 text-indigo-600">
                    <Zap size={20} />
                    <h4 className="text-lg font-black uppercase tracking-tight">
                      <FormattedMessage id="hundredschart.sidebar.animation" defaultMessage="Speed" />
                    </h4>
                 </div>
                 <div className="flex bg-slate-50 p-1 rounded-2xl border-4 border-white ">
                    {animationSpeeds.map(s => (
                      <button
                        key={s.label}
                        onClick={() => { setAnimSpeed(s.value); audioEngine.playTick(settings.soundTheme); }}
                        className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${animSpeed === s.value ? 'bg-indigo-600 text-white ' : 'text-slate-400 hover:text-slate-600'}`}
                      >
                        {s.label}
                      </button>
                    ))}
                 </div>
              </div>
           </div>
        </div>
      </div>
    </ToolPanel>
  );
};

export default HundredsChart;
