import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shuffle, SortAsc, UserPlus, Trash2, Palette, Download, RotateCcw, LayoutPanelTop } from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';
import { audioEngine } from '../../utils/audio';

export const NamePicker = ({ initialMode = 'wheel' }) => {
  const { settings } = useSettings();
  const [mode, setMode] = useState(initialMode); // 'wheel' or 'spin'
  const [selectedClassId, setSelectedClassId] = useState(settings.classes[0]?.id || '');
  const [localNames, setLocalNames] = useState([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [winner, setWinner] = useState(null);
  const [showWinnerModal, setShowWinnerModal] = useState(false);
  const [wheelTheme, setWheelTheme] = useState('vibrant');
  const [newName, setNewName] = useState('');
  const [history, setHistory] = useState([]); // { name, time }
  const casinoStripRef = useRef(null);

  useEffect(() => {
    const selectedClass = settings.classes.find(c => c.id === selectedClassId);
    if (selectedClass) {
      setLocalNames([...selectedClass.students]);
    }
  }, [selectedClassId, settings.classes]);

  const themes = {
    vibrant: {
      colors: ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'],
      bg: 'bg-white',
      border: 'border-slate-800',
      slotFrame: 'from-slate-700 via-slate-800 to-slate-900',
      slotBezel: 'from-slate-400 via-slate-200 to-slate-400',
      slotIndicator: 'bg-yellow-400 shadow-[0_0_10px_#fbbf24]'
    },
    neon: {
      colors: ['#FF00FF', '#00FFFF', '#FFFF00', '#FF0000', '#00FF00', '#FF8000', '#8000FF', '#0080FF'],
      bg: 'bg-slate-900',
      border: 'border-cyan-400',
      slotFrame: 'from-fuchsia-900 via-slate-900 to-cyan-900',
      slotBezel: 'from-cyan-400 via-white to-fuchsia-400',
      slotIndicator: 'bg-cyan-400 shadow-[0_0_15px_#22d3ee]'
    }
  };

  const currentTheme = themes[wheelTheme];

  const [strip, setStrip] = useState([]);
  useEffect(() => {
    if (localNames.length > 0) {
      let s = [];
      for (let i = 0; i < 20; i++) {
        s = s.concat([...localNames].sort(() => Math.random() - 0.5));
      }
      setStrip(s);
    }
  }, [localNames, mode]);

  const spin = () => {
    if (isSpinning || !localNames.length) return;
    setIsSpinning(true);
    setWinner(null);
    setShowWinnerModal(false);

    const winningIndex = Math.floor(Math.random() * localNames.length);
    const winningName = localNames[winningIndex];

    if (mode === 'wheel') {
      const segments = localNames.length;
      const degreesPerSegment = 360 / segments;
      const extraSpins = (5 + Math.random() * 2) * 360;
      const segmentCenter = (winningIndex + 0.5) * degreesPerSegment;
      const nextRotation = rotation + extraSpins + (360 - (rotation % 360)) + (360 - segmentCenter);
      setRotation(nextRotation);
      setTimeout(() => completeSpin(winningName), 4000);
    } else {
      if (!casinoStripRef.current) return;
      casinoStripRef.current.style.transition = 'none';
      casinoStripRef.current.style.transform = 'translateY(0)';
      setTimeout(() => {
        const itemHeight = 80;
        const targetIndex = strip.length - localNames.length * 2 + winningIndex;
        const targetY = -(targetIndex * itemHeight);
        casinoStripRef.current.style.transition = 'transform 3.5s cubic-bezier(0.15, 0.85, 0.35, 1)';
        casinoStripRef.current.style.transform = `translateY(${targetY}px)`;
        setTimeout(() => completeSpin(winningName), 3500);
      }, 50);
    }

    if (settings.soundTheme !== 'none') {
      let ticks = 0;
      const tickInterval = setInterval(() => {
        audioEngine.playTick(settings.soundTheme);
        ticks++;
        if (ticks > 25) clearInterval(tickInterval);
      }, mode === 'wheel' ? 150 : 100);
    }
  };

  const completeSpin = (winningName) => {
    setWinner(winningName);
    setIsSpinning(false);
    setShowWinnerModal(true);
    setHistory(prev => [...prev, { name: winningName, time: new Date().toISOString() }]);
    audioEngine.playAlarm(settings.soundTheme);
  };

  const downloadCSV = () => {
    const csvHeader = 'Name,Timestamp';
    const csvRows = history.map(h => `${h.name},${h.time}`);
    const csvContent = [csvHeader, ...csvRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'name_picker_results.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const totalPicks = history.length;
  const frequencies = history.reduce((acc, curr) => {
    acc[curr.name] = (acc[curr.name] || 0) + 1;
    return acc;
  }, {});

  // Dynamic font size for wheel
  const wheelFontSize = Math.max(10, Math.min(28, 280 / Math.max(1, localNames.length)));

  return (
    <div className="max-w-6xl mx-auto px-4 py-4 space-y-8">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-white p-4 rounded-3xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                <RotateCcw size={28} />
            </div>
            <div>
                <h2 className="text-2xl font-black text-slate-800">Name Picker</h2>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Random Selector</p>
            </div>
        </div>

        <div className="flex p-1 bg-slate-100 rounded-2xl">
          <button onClick={() => setMode('wheel')} className={`flex items-center gap-2 px-6 py-2 rounded-xl font-bold transition-all ${mode === 'wheel' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            <RotateCcw size={18} /> Wheel
          </button>
          <button onClick={() => setMode('spin')} className={`flex items-center gap-2 px-6 py-2 rounded-xl font-bold transition-all ${mode === 'spin' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            <LayoutPanelTop size={18} /> Spin
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={() => setWheelTheme(prev => prev === 'vibrant' ? 'neon' : 'vibrant')} className="p-3 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-colors">
            <Palette size={20} />
          </button>
          <select value={selectedClassId} onChange={(e) => setSelectedClassId(e.target.value)} className="p-3 border-2 border-slate-100 rounded-xl bg-slate-50 text-slate-600 font-bold focus:border-primary outline-none transition-all">
            {settings.classes.map(c => (
              <option key={c.id} value={c.id}>{c.name} ({c.students.length})</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-12 items-start justify-center">
        <div className="flex-1 flex flex-col items-center space-y-8 w-full">
          {mode === 'wheel' ? (
            <div className="relative w-full max-w-[500px] aspect-square group cursor-pointer" onClick={spin}>
               <div className="absolute -top-8 left-1/2 -translate-x-1/2 z-30 filter drop-shadow-xl">
                 <ArrowDownIcon color={wheelTheme === 'neon' ? '#22d3ee' : '#1e293b'} />
               </div>
               
               <motion.div
                animate={{ rotate: isSpinning ? rotation : rotation + 20 }}
                transition={isSpinning ? { duration: 4, ease: [0.15, 0.85, 0.15, 1] } : { duration: 15, repeat: Infinity, ease: "linear" }}
                className={`w-full h-full rounded-full border-[12px] ${currentTheme.border} relative overflow-hidden shadow-2xl transition-colors duration-500`}
                style={{
                    background: `conic-gradient(${
                        localNames.length > 0 
                            ? localNames.map((_, i) => `${currentTheme.colors[i % currentTheme.colors.length]} ${i * (360/localNames.length)}deg ${(i + 1) * (360/localNames.length)}deg`).join(', ')
                            : '#cbd5e1'
                    })`
                }}
               >
                 {localNames.map((name, i) => (
                    <div key={i} className="absolute top-0 left-0 w-full h-full origin-center flex items-center justify-center" style={{ transform: `rotate(${(i * (360/localNames.length)) + (180/localNames.length)}deg)` }}>
                      <span 
                        className="absolute left-1/2 w-1/2 pl-12 text-white font-black uppercase tracking-tighter drop-shadow-md origin-left -rotate-90 truncate pr-4"
                        style={{ fontSize: `${wheelFontSize}px` }}
                      >
                        {name}
                      </span>
                    </div>
                 ))}
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-white rounded-full z-40 border-4 border-slate-800 shadow-xl flex items-center justify-center">
                    <div className="w-4 h-4 bg-primary rounded-full animate-pulse" />
                 </div>
               </motion.div>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-8 w-full max-w-lg cursor-pointer" onClick={spin}>
                <div className={`relative w-full p-4 bg-gradient-to-b ${currentTheme.slotFrame} rounded-[3rem] shadow-2xl border-t-4 border-white/10 transition-all duration-500`}>
                    <div className={`relative p-3 bg-gradient-to-r ${currentTheme.slotBezel} rounded-[2.5rem] shadow-inner`}>
                        <div className="relative h-56 bg-slate-950 rounded-[2rem] shadow-[inset_0_10px_30px_rgba(0,0,0,0.8)] overflow-hidden flex items-center justify-center">
                            <div className="absolute inset-0 z-30 pointer-events-none bg-gradient-to-b from-white/20 via-transparent to-black/40" />
                            <div className="absolute inset-0 z-30 pointer-events-none bg-gradient-to-r from-black/20 via-transparent to-black/20" />
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 z-40 flex flex-col gap-2">
                                {[...Array(3)].map((_, i) => (
                                    <div key={i} className={`w-3 h-3 rounded-full ${isSpinning ? 'animate-pulse ' + currentTheme.slotIndicator : 'bg-slate-800'}`} />
                                ))}
                            </div>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 z-40 flex flex-col gap-2">
                                {[...Array(3)].map((_, i) => (
                                    <div key={i} className={`w-3 h-3 rounded-full ${isSpinning ? 'animate-pulse ' + currentTheme.slotIndicator : 'bg-slate-800'}`} />
                                ))}
                            </div>
                            <div className="absolute top-1/2 left-0 right-0 h-1 bg-white/20 z-40 pointer-events-none -translate-y-1/2" />
                            <div className="w-full absolute top-1/2 -translate-y-1/2" style={{ height: '80px' }}>
                                <div ref={casinoStripRef} className="w-full flex flex-col" style={{ filter: isSpinning ? 'blur(2px)' : 'none' }}>
                                    {strip.map((student, i) => (
                                        <div key={i} className="h-20 w-full flex items-center justify-center text-5xl font-black text-white uppercase tracking-widest" style={{ textShadow: '0 0 20px rgba(255,255,255,0.4)' }}>
                                            {student}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="absolute -right-12 top-1/2 -translate-y-1/2 hidden md:block">
                        <div className="w-4 h-24 bg-gradient-to-r from-slate-400 to-slate-600 rounded-full shadow-lg" />
                        <motion.div animate={isSpinning ? { rotateX: [0, 45, 0] } : {}} className="absolute -top-6 -left-2 w-10 h-10 bg-gradient-to-br from-red-500 to-red-700 rounded-full shadow-xl border-4 border-white/20" />
                    </div>
                </div>
            </div>
          )}
          
          <div className="text-slate-400 font-black uppercase tracking-widest text-xs animate-pulse">
            Click on the {mode === 'wheel' ? 'Wheel' : 'Spinner'} to Spin!
          </div>
        </div>

        <div className="w-full lg:w-[320px] space-y-6 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
           <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-slate-700 uppercase tracking-wider text-sm">Manage Names</h3>
              <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-[10px] font-black">{localNames.length} NAMES</span>
           </div>
           <div className="relative">
              <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && newName.trim() && (setLocalNames([...localNames, newName.trim()]), setNewName(''))} placeholder="Quick add name..." className="w-full p-4 border-2 border-slate-50 rounded-2xl bg-slate-50 text-sm font-bold focus:border-primary transition-all outline-none" />
           </div>
           <textarea value={localNames.join('\n')} onChange={(e) => setLocalNames(e.target.value.split('\n').filter(n => n.trim() !== ''))} className="w-full h-48 p-4 border-2 border-slate-50 rounded-2xl bg-slate-50 text-sm font-medium focus:border-primary transition-all outline-none resize-none" placeholder="Enter names, one per line..." />
           <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setLocalNames([...localNames].sort(() => Math.random() - 0.5))} className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl text-xs font-black text-slate-500 transition-colors flex items-center justify-center gap-2 uppercase tracking-widest"><Shuffle size={14} /> Shuffle</button>
              <button onClick={() => setLocalNames([...localNames].sort((a,b) => a.localeCompare(b)))} className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl text-xs font-black text-slate-500 transition-colors flex items-center justify-center gap-2 uppercase tracking-widest"><SortAsc size={14} /> Sort</button>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12 bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm">
        <div className="flex flex-col items-center space-y-4">
           <h3 className="font-black text-slate-700 uppercase tracking-widest text-sm">Pick Distribution</h3>
           <div className="w-40 h-40 rounded-full shadow-2xl border-4 border-white transition-all duration-700" style={{ background: totalPicks > 0 ? `conic-gradient(${Object.entries(frequencies).map(([name, freq], i, arr) => { let prevSum = 0; for(let j=0; j<i; j++) prevSum += (arr[j][1] / totalPicks) * 100; const currentPct = (freq / totalPicks) * 100; return `${themes.vibrant.colors[i % themes.vibrant.colors.length]} ${prevSum}% ${prevSum + currentPct}%`; }).join(', ') })` : '#f3f4f6' }} />
        </div>
        <div className="flex flex-col">
            <h3 className="font-black text-slate-700 uppercase tracking-widest text-sm text-center mb-4">Pick History</h3>
            <div className="h-64 overflow-y-auto pr-2 custom-scrollbar bg-slate-50/50 rounded-3xl p-4 border border-slate-100 shadow-inner">
              {totalPicks === 0 ? <div className="h-full flex items-center justify-center text-slate-300 text-xs font-bold uppercase italic">No picks yet</div> : <div className="flex flex-col-reverse gap-2">{history.map((h, i) => (<div key={i} className="flex justify-between items-center bg-white p-3 rounded-2xl border border-slate-100 shadow-sm"><span className="text-[10px] font-black text-slate-300">#{i+1}</span><span className="font-black text-slate-700 uppercase tracking-tighter">{h.name}</span></div>))}</div>}
            </div>
        </div>
        <div className="flex flex-col items-center justify-center space-y-6">
            <div className="text-center"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Picks</p><p className="text-6xl font-black text-primary">{totalPicks}</p></div>
            <button onClick={downloadCSV} disabled={totalPicks === 0} className="flex items-center gap-3 px-8 py-4 bg-slate-800 text-white rounded-2xl font-black text-xs hover:bg-slate-700 transition-all active:scale-95 disabled:opacity-30 uppercase tracking-widest"><Download size={16} /> Export Data (CSV)</button>
        </div>
      </div>

      <AnimatePresence>
        {showWinnerModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }} className="bg-white p-12 rounded-[3.5rem] shadow-2xl text-center space-y-8 max-w-md w-full border-8 border-primary/20">
              <div className="space-y-2"><p className="text-primary font-black uppercase tracking-[0.3em] text-xs">Winner Selected!</p><h3 className="text-6xl font-black text-slate-800 break-words drop-shadow-sm leading-tight">{winner}</h3></div>
              <div className="flex flex-col gap-3">
                <button onClick={() => { setLocalNames(prev => prev.filter(n => n !== winner)); setShowWinnerModal(false); setWinner(null); }} className="w-full flex items-center justify-center gap-3 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black hover:bg-red-50 hover:text-red-600 transition-all uppercase tracking-widest text-xs"><Trash2 size={18} /> Remove from Wheel</button>
                <button onClick={() => setShowWinnerModal(false)} className="w-full py-5 bg-primary text-white rounded-2xl font-black shadow-lg shadow-primary/20 hover:scale-105 transition-all uppercase tracking-widest text-sm">Awesome!</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ArrowDownIcon = ({ color }) => (
  <svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M30 60L55.9808 15H4.01924L30 60Z" fill={color} />
    <circle cx="30" cy="15" r="12" fill={color} />
    <circle cx="30" cy="15" r="6" fill="#ffffff" />
  </svg>
);
