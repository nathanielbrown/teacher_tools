import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Palette, Download, History, BarChart3, Hash, Loader } from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';
import { ToolHeader } from '../ToolHeader';
import { audioEngine } from '../../utils/audio';

export const NumberSpinner = () => {
  const [min, setMin] = useState(1);
  const [max, setMax] = useState(10);
  const [result, setResult] = useState(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [history, setHistory] = useState([]); // { value, time }
  const [spinnerTheme, setSpinnerTheme] = useState('vibrant');
  const [targetNumber, setTargetNumber] = useState(null);
  const { settings } = useSettings();
  
  const resetStats = () => {
    setHistory([]);
    setResult(null);
    setRotation(0);
  };

  const themes = {
    vibrant: {
      colors: ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'],
      wheelBg: 'bg-white',
      border: 'border-gray-800',
      pointer: 'border-t-gray-800'
    }
  };

  const currentTheme = themes[spinnerTheme];

  const spin = () => {
    if (isSpinning) return;
    if (min >= max) {
      alert("Minimum must be less than maximum.");
      return;
    }
    if (max - min > 100) {
      alert("Range must be 100 or less for the spinner.");
      return;
    }

    setIsSpinning(true);
    setResult(null);

    const winningIndex = Math.floor(Math.random() * numbers.length);
    const winningNumber = numbers[winningIndex];

    const segments = numbers.length;
    const degreesPerSegment = 360 / segments;
    const extraFullSpins = Math.floor(5 + Math.random() * 3) * 360;
    const segmentCenter = (winningIndex + 0.5) * degreesPerSegment;
    const randomOffset = (Math.random() - 0.5) * (degreesPerSegment * 0.7);
    
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
  };

  const downloadCSV = () => {
    const csvHeader = 'Result,Timestamp';
    const csvRows = history.map(h => `${h.value},${h.time}`);
    const csvContent = [csvHeader, ...csvRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'spinner_results.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const numSegments = max - min + 1;
  const numbers = Array.from({ length: numSegments }, (_, i) => min + i);
  const segmentAngle = 360 / numSegments;

  const totalSpins = history.length;
  const frequencies = history.reduce((acc, curr) => {
    acc[curr.value] = (acc[curr.value] || 0) + 1;
    return acc;
  }, {});
  const mostCommon = Object.entries(frequencies).sort((a, b) => b[1] - a[1])[0];

  return (
    <div className="w-full mx-auto px-4 pt-2 pb-8 h-full flex flex-col gap-8">
      <ToolHeader
        title="Number Spinner"
        icon={Loader}
        description="Interactive Probability and Random Selection Wheel"
        infoContent={
          <>
            <p>
              <strong className="text-white block mb-1">Custom Range</strong>
              Set your minimum and maximum values in the settings panel. The wheel will automatically divide into equal segments.
            </p>
            <p>
              <strong className="text-white block mb-1">Analytics</strong>
              Track every spin in the history panel and download a CSV report for probability analysis lessons.
            </p>
          </>
        }
      />

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        
        {/* Left Side: The Spinner (BIGGER) */}
        <div className="flex-1 flex flex-col items-center space-y-12 bg-white/40 p-8 rounded-[3rem] border border-white/60 backdrop-blur-sm">
          
          <div className="relative w-full max-w-[500px] aspect-square">
            {/* Pointer */}
            <div className={`absolute -top-6 left-1/2 -translate-x-1/2 z-20 w-0 h-0 border-l-[20px] border-l-transparent border-r-[20px] border-r-transparent border-t-[40px] ${currentTheme.pointer} filter drop-shadow-lg`} />

            {/* Wheel */}
            <motion.div
              animate={{ rotate: rotation }}
              transition={isSpinning ? { duration: 4, ease: [0.15, 0.85, 0.15, 1] } : { duration: 0.5 }}
              onAnimationComplete={() => {
                if (isSpinning && targetNumber !== null) {
                  setResult(targetNumber);
                  setHistory(prev => [...prev, { value: targetNumber, time: new Date().toISOString() }]);
                  setIsSpinning(false);
                  audioEngine.playAlarm(settings.soundTheme);
                }
              }}
              className={`w-full h-full rounded-full border-[12px] ${currentTheme.border} shadow-[0_20px_60px_rgba(0,0,0,0.2)] relative overflow-hidden ${currentTheme.wheelBg} cursor-pointer transition-transform hover:scale-[1.01] active:scale-[0.99]`}
              onClick={spin}
              style={{
                background: numSegments > 0 ? `conic-gradient(${
                  numbers.map((_, i) =>
                    `${currentTheme.colors[i % currentTheme.colors.length]} ${i * segmentAngle}deg ${(i + 1) * segmentAngle}deg`
                  ).join(', ')
                })` : '#eee'
              }}
            >
              {/* Numbers */}
              {numSegments <= 40 && numbers.map((num, i) => {
                const rotationAngle = (i * segmentAngle) + (segmentAngle / 2);
                return (
                  <div
                    key={i}
                    className="absolute inset-0 flex items-start justify-center pt-8"
                    style={{ transform: `rotate(${rotationAngle}deg)` }}
                  >
                    <span className="text-white font-black text-3xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]" style={{ transform: 'rotate(180deg)' }}>
                       {num}
                    </span>
                  </div>
                );
              })}

              <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-white rounded-full z-10 border-8 ${currentTheme.border} flex items-center justify-center shadow-2xl`}>
                <div className={`w-6 h-6 ${currentTheme.border.replace('border-', 'bg-')} rounded-full`} />
              </div>
            </motion.div>
          </div>

          <div className="flex flex-col items-center space-y-6">
            <AnimatePresence mode="wait">
              {!isSpinning && result !== null ? (
                <motion.div
                  key={totalSpins}
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  className="text-8xl font-black text-primary drop-shadow-sm"
                >
                  {result}
                </motion.div>
              ) : (
                <div className="h-24" /> // Spacer
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right Side: Config & Stats Dashboard */}
        <div className="w-full lg:w-[380px] space-y-6">
          
          {/* Configuration Panel */}
          <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-6">
             <div className="flex items-center gap-2 mb-2">
                <Settings className="text-primary" size={20} />
                <h3 className="font-black text-slate-700 uppercase tracking-wider text-sm">Settings</h3>
             </div>
             
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Min Value</label>
                   <input
                     type="number"
                     value={min}
                     onChange={e => {
                        setMin(Number(e.target.value));
                        resetStats();
                     }}
                     className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl text-xl font-black text-slate-700 focus:border-primary outline-none transition-all"
                     disabled={isSpinning}
                   />
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Max Value</label>
                   <input
                     type="number"
                     value={max}
                     onChange={e => {
                        setMax(Number(e.target.value));
                        resetStats();
                     }}
                     className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl text-xl font-black text-slate-700 focus:border-primary outline-none transition-all"
                     disabled={isSpinning}
                   />
                </div>
             </div>


          </div>

          {/* Stats Panel */}
          <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-6">
             <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                   <BarChart3 className="text-primary" size={20} />
                   <h3 className="font-black text-slate-700 uppercase tracking-wider text-sm">Analytics</h3>
                </div>
                <button 
                  onClick={downloadCSV}
                  disabled={totalSpins === 0}
                  className="p-2 text-slate-400 hover:text-primary transition-colors disabled:opacity-20"
                >
                   <Download size={20} />
                </button>
             </div>

             <div className="space-y-8">
                {/* Bar Chart */}
                <div className="flex items-end justify-between h-32 gap-1 px-1 mt-4 border-b border-slate-100 relative">
                   {numbers.map((num, i) => {
                     const freq = frequencies[num] || 0;
                     const maxFreq = Math.max(...Object.values(frequencies), 1);
                     const height = (freq / maxFreq) * 100;
                     return (
                       <div key={num} className="flex-1 flex flex-col items-center relative h-full justify-end">
                         <motion.div 
                           initial={{ height: 0 }}
                           animate={{ height: `${height}%` }}
                           className="w-full bg-primary transition-colors rounded-t-sm min-h-[2px] relative"
                         >
                            {freq > 0 && (
                               <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[8px] font-black text-primary transition-opacity">
                                  {freq}
                               </span>
                            )}
                         </motion.div>
                         <span className="absolute -bottom-5 text-[8px] font-black text-slate-400 transition-colors">
                            {num}
                         </span>
                       </div>
                     );
                   })}
                </div>

                <div className="max-h-64 overflow-y-auto pr-2 custom-scrollbar space-y-3">
                   <div className="flex items-center justify-between text-[10px] font-black text-slate-400 uppercase px-2">
                      <span>Value History</span>
                      <span className="opacity-50">{history.length} spins</span>
                   </div>
                   <div className="grid grid-cols-5 gap-2 px-1">
                      {history.slice().reverse().map((h, i) => (
                        <motion.div 
                          key={history.length - 1 - i}
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="aspect-square flex items-center justify-center bg-slate-50 rounded-xl border border-slate-100 group relative cursor-help"
                        >
                           <span className="text-sm font-black text-slate-700">{h.value}</span>
                           <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-[8px] text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-sm">
                              {history.length - i}
                           </div>
                        </motion.div>
                      ))}
                   </div>
                </div>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
};
