import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  const headsPct = totalFlips ? (headsCount / totalFlips) * 100 : 0;
  const tailsPct = totalFlips ? (tailsCount / totalFlips) * 100 : 0;

  return (
    <div className="flex flex-col items-center justify-center space-y-8">
      <h2 className="text-3xl font-bold text-primary">Flip a Coin</h2>

      {/* Coin Container */}
      <div
        className="relative w-64 h-64 cursor-pointer perspective-1000"
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
          {/* Edge shading (Multiple layers for 3D thickness) */}
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

          {/* Tails Side (Enhanced Metallic Look) */}
          <div
            className="absolute inset-0 rounded-full border-8 border-gray-400 shadow-xl flex items-center justify-center"
            style={{
              backfaceVisibility: 'hidden',
              transform: 'rotateX(180deg) translateZ(6px)',
              background: 'radial-gradient(circle at 70% 70%, #f3f4f6, #9ca3af, #4b5563)',
            }}
          >
            <div className="w-44 h-44 rounded-full border-4 border-gray-400/30 flex items-center justify-center shadow-inner relative overflow-hidden">
               {/* Subtle metallic shine overlay */}
               <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent rotate-45 pointer-events-none" />
              <span className="text-8xl font-black text-gray-800 drop-shadow-md">T</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Result display */}
      <div className="text-center space-y-4">
        {!isFlipping && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            key={flipCount}
            className="text-4xl font-bold text-primary uppercase tracking-widest"
          >
            {result}
          </motion.div>
        )}
        <button
          onClick={flip}
          disabled={isFlipping}
          className="px-12 py-4 bg-primary text-white text-2xl font-bold rounded-2xl shadow-lg hover:bg-primary/90 hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100"
        >
          {isFlipping ? 'Flipping...' : 'Flip Coin'}
        </button>

        {/* Data Section (Always Shown) */}
        <div className="flex flex-col md:flex-row items-center md:items-start justify-center space-y-8 md:space-y-0 md:space-x-12 mt-8 w-full min-h-[300px]">
          <div className="flex flex-col items-center">
            <button
              onClick={downloadCSV}
              disabled={totalFlips === 0}
              className="mb-4 px-6 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-700 transition disabled:opacity-30"
            >
              Download CSV
            </button>
            
            {/* Pie Chart */}
            <div 
              className="w-48 h-48 rounded-full shadow-2xl border-4 border-white transition-all duration-500"
              style={{
                background: totalFlips > 0 
                  ? `conic-gradient(#ffd700 ${headsPct}%, #4b5563 0)`
                  : '#e5e7eb',
              }}
            />
            
            <div className="mt-4 flex flex-col items-start space-y-2">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-[#ffd700] rounded-sm" />
                <span className="font-medium text-gray-700">Heads: {headsCount} ({headsPct.toFixed(1)}%)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-[#4b5563] rounded-sm" />
                <span className="font-medium text-gray-700">Tails: {tailsCount} ({tailsPct.toFixed(1)}%)</span>
              </div>
            </div>
          </div>

          {/* History List */}
          <div className="flex flex-col w-full max-w-[200px]">
            <h3 className="text-xl font-bold text-gray-700 mb-2 border-b pb-1 text-center">History</h3>
            <div className="max-h-64 min-h-[200px] overflow-y-auto pr-2 custom-scrollbar bg-white/50 rounded-lg p-2 border border-gray-100 shadow-inner">
              {totalFlips === 0 ? (
                <div className="text-gray-400 text-center text-sm py-8">No flips yet</div>
              ) : (
                <div className="flex flex-col-reverse space-y-2 space-y-reverse">
                  {history.map((h, i) => (
                    <div 
                      key={i} 
                      className={`flex justify-between items-center p-2 rounded-lg text-sm font-bold ${
                        h.result === 'heads' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' : 'bg-gray-100 text-gray-800 border border-gray-200'
                      }`}
                    >
                      <span>#{i + 1}</span>
                      <span className="uppercase">{h.result}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
