import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Loader, Trash2, Sliders, Target, Database, BarChart3 } from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';
import { useHeader } from '../../contexts/HeaderContext';
import { ToolPanel } from '../shared/ToolPanel';
import { audioEngine } from '../../utils/audio';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { downloadCSV } from '../../utils/export';
import { FormattedMessage, useIntl } from 'react-intl';
import HistoryPanel from '../shared/HistoryPanel';

// 1. Constants
const COLORS = [
  '#4f46e5', '#10b981', '#f59e0b', '#db2777', 
  '#7c3aed', '#dc2626', '#0891b2', '#ea580c',
  '#16a34a', '#0284c7', '#e11d48', '#d97706'
];

// 2. Config (None)

// 3. Text (Help and Info)
const HelpContent = () => (
  <div className="space-y-4 font-['Outfit']">
    <div className="space-y-3 italic">
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center text-xs font-black text-indigo-600 shrink-0">1</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">
          <FormattedMessage id="numberSpinner.help.step1" defaultMessage="Set the minimum and maximum numbers in the sidebar." />
        </p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center text-xs font-black text-indigo-600 shrink-0">2</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">
          <FormattedMessage id="numberSpinner.help.step2" defaultMessage="Click the Spin button or the wheel itself to pick a number." />
        </p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center text-xs font-black text-indigo-600 shrink-0">3</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">
          <FormattedMessage id="numberSpinner.help.step3" defaultMessage="The results will be tracked in the history list." />
        </p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center text-xs font-black text-indigo-600 shrink-0">4</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">
          <FormattedMessage id="numberSpinner.help.step4" defaultMessage="You can download your results as a CSV file for math activities." />
        </p>
      </div>
    </div>
  </div>
);

// 4. Local Storage (Logic in component using useLocalStorage hook)

// 5. Classes (None)

// 6. Functions (None)

// 7. Component
export const NumberSpinner = () => {
  const intl = useIntl();
  const { setOnReset, clearHeader, setHelpContent } = useHeader();
  const { settings } = useSettings();
  const [min, setMin] = useState(1);
  const [max, setMax] = useState(10);
  const [, setResult] = useState<number | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [history, setHistory] = useLocalStorage<any[]>('number_spinner_history', []);
  const [targetNumber, setTargetNumber] = useState<number | null>(null);

  const numSegments = Math.max(1, max - min + 1);
  const numbers = useMemo(() => Array.from({ length: numSegments }, (_, i) => min + i), [min, numSegments]);
  const segmentAngle = 360 / numSegments;

  const resetStats = useCallback(() => {
    setHistory([]);
    setResult(null);
    setRotation(0);
    audioEngine.playTick(settings.soundTheme);
  }, [settings.soundTheme, setHistory]);

  const spin = useCallback(() => {
    if (isSpinning) return;
    if (min >= max) return;
    if (max - min > 100) return;

    setIsSpinning(true);
    setResult(null);

    const winningIndex = Math.floor(Math.random() * numbers.length);
    const winningNumber = numbers[winningIndex];

    const extraFullSpins = Math.floor(5 + Math.random() * 3) * 360;
    const segmentCenter = (winningIndex + 0.5) * segmentAngle;
    const randomOffset = (Math.random() - 0.5) * (segmentAngle * 0.7);
    
    const resetRotation = 360 - (rotation % 360);
    const targetFromZero = 360 - segmentCenter;
    
    const nextRotation = rotation + extraFullSpins + resetRotation + targetFromZero - randomOffset;
    setRotation(nextRotation);
    setTargetNumber(winningNumber);

    if (settings.soundTheme !== 'none') {
      let ticks = 0;
      const tickInterval = setInterval(() => {
        audioEngine.playTick(settings.soundTheme);
        ticks++;
        if (ticks > 25) clearInterval(tickInterval);
      }, 150);
    }
  }, [isSpinning, min, max, numbers, rotation, segmentAngle, settings.soundTheme]);

  const handleDownload = () => {
    downloadCSV(history, 'spinner_results.csv');
  };

  const frequencies = history.reduce((acc: any, curr: any) => {
    acc[curr.value] = (acc[curr.value] || 0) + 1;
    return acc;
  }, {});

  const maxFrequency = useMemo(() => {
    const values = Object.values(frequencies) as number[];
    return values.length > 0 ? Math.max(...values) : 0;
  }, [frequencies]);

  useEffect(() => {
    setOnReset(() => resetStats);
    setHelpContent(<HelpContent />);
    return () => clearHeader();
  }, [clearHeader, setOnReset, resetStats, setHelpContent]);

  return (
    <ToolPanel className="italic" baseWidth={1200} baseHeight={800}>
      <div className="flex flex-col lg:flex-row gap-8 w-full h-full relative z-10">
        
        {/* Parameters Sidebar */}
        <div className="w-full lg:w-96 flex flex-col gap-6 shrink-0 h-full italic">
          <div className="bg-white p-8 rounded-[3rem] border-4 border-slate-50  flex flex-col gap-8">
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Min</label>
                  <div className="bg-slate-50 p-4 rounded-2xl border-4 border-white focus-within:border-indigo-100 transition-all ">
                    <input
                      type="number"
                      value={min}
                      onChange={e => {
                        setMin(Math.max(0, Number(e.target.value)));
                        resetStats();
                      }}
                      className="w-full bg-transparent border-none outline-none text-2xl font-black text-slate-800 tabular-nums"
                      disabled={isSpinning}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Max</label>
                  <div className="bg-slate-50 p-4 rounded-2xl border-4 border-white focus-within:border-indigo-100 transition-all ">
                    <input
                      type="number"
                      value={max}
                      onChange={e => {
                        setMax(Math.min(100, Math.max(min + 1, Number(e.target.value))));
                        resetStats();
                      }}
                      className="w-full bg-transparent border-none outline-none text-2xl font-black text-slate-800 tabular-nums"
                      disabled={isSpinning}
                    />
                  </div>
                </div>
             </div>
          </div>

          <div className="bg-slate-50/80 backdrop-blur-xl rounded-[3rem] border-4 border-white flex flex-col overflow-hidden shrink-0 italic">
            <div className="bg-white/80 backdrop-blur-sm px-8 py-6 flex justify-between items-center shrink-0 border-b-4 border-white">
              <div className="flex items-center gap-2">
                <BarChart3 className="text-indigo-400" size={16} />
                <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-900 mb-0 leading-none">
                  <FormattedMessage id="numberSpinner.analytics.title" defaultMessage="Statistics" />
                </h4>
              </div>
            </div>
            <div className="p-8">
              <div className="h-40 w-full flex items-end justify-between gap-1 relative">
                {numbers.map((num, i) => {
                  const freq = frequencies[num] || 0;
                  const height = maxFrequency > 0 ? (freq / maxFrequency) * 100 : 0;
                  return (
                    <div key={num} className="flex-1 flex flex-col items-center gap-2 group/bar h-full justify-end relative z-10">
                      <div className="w-full relative flex flex-col justify-end h-full">
                        <motion.div 
                          initial={{ height: 0 }}
                          animate={{ height: `${height}%` }}
                          className="w-full rounded-t-lg relative group-hover/bar:brightness-110 transition-all"
                          style={{ backgroundColor: COLORS[i % COLORS.length] }}
                        >
                          {freq > 0 && (
                            <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[9px] font-black text-slate-400 tabular-nums">
                              {freq}
                            </span>
                          )}
                        </motion.div>
                      </div>
                      <span className="text-[9px] font-black text-slate-400 tabular-nums group-hover/bar:text-slate-900 transition-colors">{num}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <HistoryPanel
            title={intl.formatMessage({ id: 'numberSpinner.history.title', defaultMessage: 'History' })}
            items={history}
            onClear={resetStats}
            onDownload={handleDownload}
            emptyMessage={intl.formatMessage({ id: 'numberSpinner.history.empty', defaultMessage: 'No spins yet' })}
            itemsPerPage={7}
            renderItem={(h: any, i: number) => (
              <motion.div 
                key={`${h.time}-${i}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-4 bg-white rounded-2xl border-2 border-slate-50 flex justify-between items-center group hover:border-indigo-100 transition-all "
              >
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Spin #{history.length - i}</span>
                 <span className="text-2xl font-black text-slate-800 tabular-nums tracking-tighter leading-none group-hover:text-indigo-600 transition-colors">{h.value}</span>
              </motion.div>
            )}
          />
        </div>

        {/* Main Spinner Stage */}
        <div className="flex-1 relative overflow-hidden flex flex-col items-center justify-center bg-white border-4 border-slate-50 rounded-[4rem] ">
          <div className="tool-grid-bg opacity-30 pointer-events-none" />
          



          <div className="relative w-full max-w-[550px] aspect-square flex items-center justify-center z-10 p-8">
              {/* Pointer */}
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-30 drop-shadow-xl">
                <svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="filter drop-shadow-lg">
                  <path d="M30 60L0 0H60L30 60Z" fill="#1e293b" />
                  <circle cx="30" cy="15" r="6" fill="#818cf8" className="animate-pulse" />
                </svg>
              </div>

              {/* Wheel Container */}
              <motion.div
                animate={{ rotate: rotation }}
                transition={isSpinning ? { duration: 4, ease: [0.15, 0.85, 0.15, 1] } : { duration: 0.5 }}
                onAnimationComplete={() => {
                  if (isSpinning && targetNumber !== null) {
                    setResult(targetNumber);
                    setHistory((prev: any[]) => [{ value: targetNumber, time: new Date().toISOString() }, ...prev]);
                    setIsSpinning(false);
                    audioEngine.playSuccess(settings.soundTheme);
                  }
                }}
                className="w-full h-full rounded-full border-[16px] border-white  relative overflow-hidden bg-white cursor-pointer group/wheel"
                onClick={spin}
                style={{
                  background: `conic-gradient(${
                    numbers.map((_, i) =>
                      `${COLORS[i % COLORS.length]} ${i * segmentAngle}deg ${(i + 1) * segmentAngle}deg`
                    ).join(', ')
                  })`
                }}
              >
                {/* Glass Shimmer Overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-black/10 pointer-events-none z-10" />
                <div className="absolute inset-0 rounded-full shadow-[inset_0_0_100px_rgba(0,0,0,0.15)] pointer-events-none z-10" />

                {/* Numbers */}
                {numSegments <= 40 && numbers.map((num, i) => {
                  const rotationAngle = (i * segmentAngle) + (segmentAngle / 2);
                  return (
                    <div
                      key={i}
                      className="absolute inset-0 flex items-start justify-center pt-12"
                      style={{ transform: `rotate(${rotationAngle}deg)` }}
                    >
                      <span 
                        className="text-white font-black text-4xl select-none drop-shadow-lg" 
                        style={{ transform: 'rotate(0deg)', writingMode: 'vertical-rl', textOrientation: 'upright' }}
                      >
                         {num}
                      </span>
                    </div>
                  );
                })}

                {/* Center Hub */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-36 h-36 bg-white rounded-full z-20 border-[14px] border-slate-50 flex items-center justify-center shadow-xl">
                  <div className="w-12 h-12 bg-indigo-500 rounded-full shadow-[0_0_30px_rgba(79,70,229,0.4)] border-4 border-white/30 flex items-center justify-center">
                    <div className="w-4 h-4 bg-white/40 rounded-full animate-pulse" />
                  </div>
                </div>
              </motion.div>
          </div>
        </div>
      </div>
    </ToolPanel>
  );
};

export default NumberSpinner;
