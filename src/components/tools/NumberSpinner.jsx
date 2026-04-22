import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Palette, Download, History, BarChart3, Hash } from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';
import { audioEngine } from '../../utils/audio';

export const NumberSpinner = () => {
  const [min, setMin] = useState(1);
  const [max, setMax] = useState(10);
  const [result, setResult] = useState(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [history, setHistory] = useState([]); // { value, time }
  const [spinnerTheme, setSpinnerTheme] = useState('vibrant');
  const { settings } = useSettings();

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
    const selectedNumber = Math.floor(Math.random() * (max - min + 1)) + min;

    if (settings.soundTheme !== 'none') {
      let ticks = 0;
      const interval = setInterval(() => {
        audioEngine.playTick(settings.soundTheme);
        ticks++;
        if (ticks > 20) clearInterval(interval);
      }, 120);
    }

    const numSegments = max - min + 1;
    const degreesPerSegment = 360 / numSegments;
    const selectedIndex = selectedNumber - min;
    const segmentCenterAngle = (selectedIndex * degreesPerSegment) + (degreesPerSegment / 2);
    const jitter = (Math.random() - 0.5) * (degreesPerSegment * 0.7);
    const targetRotation = 360 - segmentCenterAngle + jitter;
    const spins = 5 * 360;
    const currentRotMod = rotation % 360;
    let rotationDiff = targetRotation - currentRotMod;
    if (rotationDiff < 0) rotationDiff += 360;

    const newRotation = rotation + spins + rotationDiff;
    setRotation(newRotation);

    setTimeout(() => {
      setResult(selectedNumber);
      setHistory(prev => [...prev, { value: selectedNumber, time: new Date().toISOString() }]);
      setIsSpinning(false);
      audioEngine.playAlarm(settings.soundTheme);
    }, 3000);
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
    <div className="max-w-7xl mx-auto px-4 py-4 space-y-8">
      {/* Tool Header */}
      <div className="flex items-center gap-4 bg-white p-4 rounded-[2rem] shadow-sm border border-gray-100">
         <div className="p-4 bg-primary/10 rounded-2xl text-primary">
            <Hash size={32} />
         </div>
         <div>
            <h2 className="text-3xl font-black text-slate-800">Number Spinner</h2>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Probability Tool</p>
         </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        
        {/* Left Side: The Spinner (BIGGER) */}
        <div className="flex-1 flex flex-col items-center space-y-12 bg-white/40 p-8 rounded-[3rem] border border-white/60 backdrop-blur-sm">
          
          <div className="relative w-full max-w-[500px] aspect-square">
            {/* Pointer */}
            <div className={`absolute -top-6 left-1/2 -translate-x-1/2 z-20 w-0 h-0 border-l-[20px] border-l-transparent border-r-[20px] border-r-transparent border-t-[40px] ${currentTheme.pointer} filter drop-shadow-lg`} />

            {/* Wheel */}
            <motion.div
              animate={{ rotate: rotation }}
              transition={{ duration: 3, ease: [0.1, 0.7, 0.1, 1] }}
              className={`w-full h-full rounded-full border-[12px] ${currentTheme.border} shadow-[0_20px_60px_rgba(0,0,0,0.2)] relative overflow-hidden ${currentTheme.wheelBg}`}
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

            <button
              onClick={spin}
              disabled={isSpinning}
              className="px-20 py-6 bg-gradient-to-br from-primary to-blue-700 text-white text-3xl font-black rounded-[2.5rem] shadow-2xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50 uppercase tracking-widest"
            >
              {isSpinning ? 'SPINNING...' : 'SPIN WHEEL'}
            </button>
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
                     onChange={e => setMin(Number(e.target.value))}
                     className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl text-xl font-black text-slate-700 focus:border-primary outline-none transition-all"
                     disabled={isSpinning}
                   />
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Max Value</label>
                   <input
                     type="number"
                     value={max}
                     onChange={e => setMax(Number(e.target.value))}
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

             {totalSpins === 0 ? (
                <div className="py-12 text-center text-slate-300 text-xs font-black uppercase italic tracking-widest">No data collected</div>
             ) : (
                <div className="space-y-6">
                   <div className="flex justify-around py-4 bg-slate-50 rounded-3xl">
                      <div className="text-center">
                         <p className="text-[9px] font-black text-slate-400 uppercase">Total</p>
                         <p className="text-2xl font-black text-slate-700">{totalSpins}</p>
                      </div>
                      <div className="text-center">
                         <p className="text-[9px] font-black text-slate-400 uppercase">Common</p>
                         <p className="text-2xl font-black text-primary">{mostCommon[0]}</p>
                      </div>
                   </div>

                   <div className="flex flex-col items-center">
                      <div 
                        className="w-32 h-32 rounded-full border-4 border-white shadow-xl transition-all duration-700"
                        style={{
                          background: `conic-gradient(${
                            Object.entries(frequencies).map(([val, freq], i, arr) => {
                              let prevSum = 0;
                              for(let j=0; j<i; j++) prevSum += (arr[j][1] / totalSpins) * 100;
                              const currentPct = (freq / totalSpins) * 100;
                              return `${currentTheme.colors[i % currentTheme.colors.length]} ${prevSum}% ${prevSum + currentPct}%`;
                            }).join(', ')
                          })`
                        }}
                      />
                   </div>

                   <div className="max-h-48 overflow-y-auto pr-2 custom-scrollbar space-y-2">
                      <div className="flex items-center justify-between text-[10px] font-black text-slate-400 uppercase px-2 mb-2">
                         <span>Value</span>
                         <span>History</span>
                      </div>
                      <div className="flex flex-col-reverse gap-2">
                         {history.map((h, i) => (
                           <div key={i} className="flex justify-between items-center p-3 bg-slate-50 rounded-2xl border border-slate-100">
                              <span className="text-[9px] font-black text-slate-300">#{i + 1}</span>
                              <span className="text-lg font-black text-slate-700">{h.value}</span>
                           </div>
                         ))}
                      </div>
                   </div>
                </div>
             )}
          </div>

        </div>
      </div>
    </div>
  );
};
