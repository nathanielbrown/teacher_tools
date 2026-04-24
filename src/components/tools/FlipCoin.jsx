import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Coins, BarChart3, Download } from 'lucide-react';
import { ToolHeader } from '../ToolHeader';
import { useSettings } from '../../contexts/SettingsContext';
import { audioEngine } from '../../utils/audio';

export const FlipCoin = () => {
  const [result, setResult] = useState('heads');
  const [isFlipping, setIsFlipping] = useState(false);
  const [flipCount, setFlipCount] = useState(0);
  const [rotation, setRotation] = useState(0);
  const [history, setHistory] = useState([]); // { result, time }
  const { settings } = useSettings();

  const flip = () => {
    if (isFlipping) return;
    setIsFlipping(true);

    if (settings.soundTheme !== 'none') {
      audioEngine.playTick(settings.soundTheme);
      setTimeout(() => audioEngine.playTick(settings.soundTheme), 200);
      setTimeout(() => audioEngine.playTick(settings.soundTheme), 400);
      setTimeout(() => audioEngine.playTick(settings.soundTheme), 600);
    }

    const newResult = Math.random() > 0.5 ? 'heads' : 'tails';
    // Calculate next rotation: 5 full spins (1800deg) + 180deg if tails
    const currentBase = Math.ceil(rotation / 360) * 360;
    const nextRotation = currentBase + 1800 + (newResult === 'tails' ? 180 : 0);
    
    setRotation(nextRotation);

    setTimeout(() => {
      setResult(newResult);
      setFlipCount(prev => prev + 1);
      setHistory(prev => [...prev, { result: newResult, time: new Date().toISOString() }]);
      setIsFlipping(false);
      if (settings.soundTheme !== 'none') {
        audioEngine.playTick(settings.soundTheme);
      }
    }, 1500);
  };

  const downloadCSV = () => {
    const csvHeader = 'Result,Timestamp';
    const csvRows = history.map(h => `${h.result},${h.time}`);
    const csvContent = [csvHeader, ...csvRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'coin_flips.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const totalFlips = history.length;
  const headsCount = history.filter(h => h.result === 'heads').length;
  const tailsCount = history.filter(h => h.result === 'tails').length;

  return (
    <div className="w-full mx-auto px-4 pt-2 pb-8 h-full flex flex-col gap-8">
      <ToolHeader
        title="Flip a Coin"
        icon={Coins}
        description="Probability & Chance Simulator"
        infoContent={
          <>
            <p>
              <strong className="text-white block mb-1">Flip the Coin</strong>
              Click the coin or the "Flip" button to start the toss. The coin uses real physics-based rotation!
            </p>
            <p>
              <strong className="text-white block mb-1">Probability Data</strong>
              Track your results with the live pie chart and history log. You can even download your flip data as a CSV.
            </p>
          </>
        }
      />

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        
        {/* Left Side: The Coin */}
        <div className="flex-1 flex flex-col items-center space-y-12 bg-white/40 p-8 rounded-[3rem] border border-white/60 backdrop-blur-sm">
          
          <div
            className="relative w-64 h-64 cursor-pointer"
            style={{ perspective: '1000px' }}
            onClick={flip}
          >
            <motion.div
              animate={{
                rotateX: rotation,
                y: isFlipping ? [0, -300, 0] : 0,
                scale: isFlipping ? [1, 1.2, 1] : 1,
              }}
              transition={{ 
                rotateX: { duration: 1.5, ease: "easeOut" },
                y: { duration: 1.5, ease: "easeInOut" },
                scale: { duration: 1.5, ease: "easeInOut" }
              }}
              className="w-full h-full relative"
              style={{ transformStyle: 'preserve-3d' }}
            >
              {/* Edge shading */}
              <div className="absolute inset-0 rounded-full bg-yellow-700" style={{ transform: 'translateZ(-4px)' }} />
              <div className="absolute inset-0 rounded-full bg-yellow-800" style={{ transform: 'translateZ(-2px)' }} />
              <div className="absolute inset-0 rounded-full bg-yellow-600" style={{ transform: 'translateZ(2px)' }} />
              <div className="absolute inset-0 rounded-full bg-yellow-700" style={{ transform: 'translateZ(4px)' }} />

              {/* Heads Side */}
              <div
                className="absolute inset-0 rounded-full border-8 border-yellow-500 shadow-xl flex items-center justify-center"
                style={{
                  backfaceVisibility: 'hidden',
                  transform: 'translateZ(6px)',
                  background: 'radial-gradient(circle at 30% 30%, #ffd700, #e5a100)',
                }}
              >
                <div className="w-44 h-44 rounded-full border-4 border-yellow-500/30 flex items-center justify-center shadow-inner">
                  <span className="text-8xl font-black text-yellow-800 drop-shadow-md">H</span>
                </div>
              </div>

              {/* Tails Side */}
              <div
                className="absolute inset-0 rounded-full border-8 border-yellow-500 shadow-xl flex items-center justify-center"
                style={{
                  backfaceVisibility: 'hidden',
                  transform: 'rotateX(180deg) translateZ(6px)',
                  background: 'radial-gradient(circle at 70% 70%, #ffd700, #e5a100, #b78100)',
                }}
              >
                <div className="w-44 h-44 rounded-full border-4 border-yellow-500/30 flex items-center justify-center shadow-inner relative overflow-hidden">
                   <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent rotate-45 pointer-events-none" />
                  <span className="text-8xl font-black text-yellow-800 drop-shadow-md">T</span>
                </div>
              </div>
            </motion.div>
          </div>

          <div className="flex flex-col items-center space-y-6">
            <AnimatePresence mode="wait">
              {!isFlipping ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  key={flipCount}
                  className="text-6xl font-black text-primary uppercase tracking-widest drop-shadow-sm mb-12"
                >
                  {result}
                </motion.div>
              ) : (
                <div className="h-20 mb-12" />
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right Side: Stats Dashboard */}
        <div className="w-full lg:w-[380px] space-y-6">
          <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-6">
             <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                   <BarChart3 className="text-primary" size={20} />
                   <h3 className="font-black text-slate-700 uppercase tracking-wider text-sm">Analytics</h3>
                </div>
                <button 
                  onClick={downloadCSV}
                  disabled={totalFlips === 0}
                  className="p-2 text-slate-400 hover:text-primary transition-colors disabled:opacity-20"
                >
                   <Download size={20} />
                </button>
             </div>

             <div className="space-y-8">
                {/* Bar Chart for Heads/Tails */}
                <div className="flex items-end justify-between h-32 gap-1 px-1 mt-4 border-b border-slate-100 relative">
                   {['heads', 'tails'].map((res) => {
                     const freq = res === 'heads' ? headsCount : tailsCount;
                     const maxFreq = Math.max(headsCount, tailsCount, 1);
                     const height = (freq / maxFreq) * 100;
                     return (
                       <div key={res} className="flex-1 flex flex-col items-center relative h-full justify-end mx-4">
                         <motion.div 
                           initial={{ height: 0 }}
                           animate={{ height: `${height}%` }}
                           className={`w-full transition-colors rounded-t-sm min-h-[2px] relative ${res === 'heads' ? 'bg-[#ffd700]' : 'bg-[#4b5563]'}`}
                         >
                            {freq > 0 && (
                               <span className={`absolute -top-4 left-1/2 -translate-x-1/2 text-[10px] font-black transition-opacity ${res === 'heads' ? 'text-yellow-600' : 'text-gray-600'}`}>
                                  {freq}
                               </span>
                            )}
                         </motion.div>
                         <span className="absolute -bottom-5 text-[10px] font-black text-slate-400 transition-colors uppercase">
                            {res}
                         </span>
                       </div>
                     );
                   })}
                </div>

                <div className="max-h-64 overflow-y-auto pr-2 custom-scrollbar space-y-3">
                   <div className="flex items-center justify-between text-[10px] font-black text-slate-400 uppercase px-2">
                      <span>Flip History</span>
                      <span className="opacity-50">{history.length} flips</span>
                   </div>
                   <div className="grid grid-cols-5 gap-2 px-1">
                      {history.slice().reverse().map((h, i) => (
                        <motion.div 
                          key={history.length - 1 - i}
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className={`aspect-square flex items-center justify-center rounded-xl border group relative cursor-help ${
                            h.result === 'heads' ? 'bg-yellow-50 border-yellow-100' : 'bg-gray-50 border-gray-100'
                          }`}
                        >
                           <span className={`text-sm font-black ${h.result === 'heads' ? 'text-yellow-700' : 'text-gray-600'}`}>
                             {h.result === 'heads' ? 'H' : 'T'}
                           </span>
                           <div className={`absolute -top-1 -right-1 w-4 h-4 text-[8px] text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-sm ${
                             h.result === 'heads' ? 'bg-yellow-500' : 'bg-gray-500'
                           }`}>
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
