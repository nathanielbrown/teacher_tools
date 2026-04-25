import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shuffle, SortAsc, Trash2, Download, RotateCcw, UserCircle, BarChart3 } from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';
import { ToolHeader } from '../ToolHeader';
import { audioEngine } from '../../utils/audio';
import { shuffle } from '../../utils/random';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { downloadCSV } from '../../utils/export';
import { ToolAnalytics } from '../ToolAnalytics';

export const NamePicker = ({ initialMode = 'wheel' }) => {
  const { settings } = useSettings();
  const [mode, setMode] = useLocalStorage('name_picker_mode', initialMode); // 'wheel' or 'spin'
  const [selectedClassId, setSelectedClassId] = useState(settings.classes[0]?.id || '');
  const [localNames, setLocalNames] = useState([]);
  const validNames = React.useMemo(() => localNames.filter(n => typeof n === 'string' && n.trim() !== ''), [localNames]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [winner, setWinner] = useState(null);
  const [showWinnerModal, setShowWinnerModal] = useState(false);
  const [history, setHistory] = useLocalStorage('name_picker_history', []); // { name, time }
  const casinoStripRef = useRef(null);

  useEffect(() => {
    const selectedClass = settings.classes.find(c => c.id === selectedClassId);
    if (selectedClass) {
      setLocalNames([...selectedClass.students]);
    }
  }, [selectedClassId, settings.classes]);

  const COLORS = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'];

  const [strip, setStrip] = useState([]);
  useEffect(() => {
    if (validNames.length > 0) {
      let s = [];
      for (let i = 0; i < 20; i++) {
        s = s.concat(validNames);
      }
      setStrip(s);
    }
  }, [localNames, mode]);

  const spin = () => {
    if (isSpinning || !validNames.length) return;
    setIsSpinning(true);
    setWinner(null);
    setShowWinnerModal(false);

    const winningIndex = Math.floor(Math.random() * validNames.length);
    const winningName = validNames[winningIndex];

    if (mode === 'wheel') {
      const segments = validNames.length;
      const degreesPerSegment = 360 / segments;
      const extraFullSpins = Math.floor(5 + Math.random() * 3) * 360;
      const segmentCenter = (winningIndex + 0.5) * degreesPerSegment;
      const randomOffset = (Math.random() - 0.5) * (degreesPerSegment * 0.7);
      
      const resetRotation = 360 - (rotation % 360);
      const targetFromZero = 360 - segmentCenter;
      
      const nextRotation = rotation + extraFullSpins + resetRotation + targetFromZero - randomOffset;
      setRotation(nextRotation);
      setTimeout(() => completeSpin(winningName), 4000);
    } else {
      if (!casinoStripRef.current) return;
      casinoStripRef.current.style.transition = 'none';
      casinoStripRef.current.style.transform = 'translateY(0)';
      setTimeout(() => {
        const itemHeight = 80;
        const targetIndex = strip.length - validNames.length * 2 + winningIndex;
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

  const handleDownload = () => {
    downloadCSV(history, 'name_picker_results.csv');
  };

  const frequencies = React.useMemo(() => {
    return history.reduce((acc, curr) => {
      acc[curr.name] = (acc[curr.name] || 0) + 1;
      return acc;
    }, {});
  }, [history]);

  const chartData = React.useMemo(() => {
    return {
      labels: validNames,
      series: validNames.map(name => frequencies[name] || 0)
    };
  }, [validNames, frequencies]);

  const chartOptions = React.useMemo(() => {
    const maxNameLength = Math.max(...validNames.map(n => n.length));
    const dynamicOffset = Math.min(140, Math.max(40, maxNameLength * 8));
    return {
      distributeSeries: true,
      axisY: {
        onlyInteger: true,
        offset: 40
      },
      axisX: {
        offset: dynamicOffset // Dynamic space based on name length
      },
      height: '260px', // Re-adjusted height for a tighter layout
      chartPadding: {
        top: 0,
        right: 15,
        bottom: 10,
        left: 10
      }
    };
  }, [validNames]);

  // Dynamic font size for wheel
  const wheelFontSize = Math.max(10, Math.min(28, 280 / Math.max(1, validNames.length)));
  // Dynamic bar width for chart
  const barWidth = Math.max(4, Math.min(30, 240 / Math.max(1, validNames.length)));
  // Dynamic label font size for x-axis
  const labelFontSize = Math.max(6, Math.min(10, 150 / Math.max(1, validNames.length)));

  return (
    <div className="w-full mx-auto px-4 pt-2 pb-8 h-full flex flex-col gap-8">
      <ToolHeader
        title="Name Picker"
        icon={UserCircle}
        description="Random Student Selector with Wheel and Casino Modes"
        infoContent={
          <>
            <p>
              <strong className="text-white block mb-1">Pick Your Mode</strong>
              Choose between the **Wheel** (classic spin) or **Spinner** (slot machine) style selection.
            </p>
            <p>
              <strong className="text-white block mb-1">Manage Class</strong>
              Select your class from the dropdown or manually edit the names in the sidebar. You can shuffle or sort names before spinning.
            </p>
          </>
        }
      >
        <div className="flex p-1 bg-slate-100 rounded-2xl">
          <button onClick={() => setMode('wheel')} className={`flex items-center gap-2 px-6 py-2 rounded-xl font-bold transition-all ${mode === 'wheel' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            <RotateCcw size={18} /> Wheel
          </button>
          <button onClick={() => setMode('spin')} className={`flex items-center gap-2 px-6 py-2 rounded-xl font-bold transition-all ${mode === 'spin' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            <RotateCcw size={18} /> Spinner
          </button>
        </div>

        <div className="flex items-center gap-3">
          <select value={selectedClassId} onChange={(e) => setSelectedClassId(e.target.value)} className="p-3 border-2 border-slate-100 rounded-xl bg-slate-50 text-slate-600 font-bold focus:border-indigo-500 outline-none transition-all">
            {settings.classes.map(c => (
              <option key={c.id} value={c.id}>{c.name} ({c.students.length})</option>
            ))}
          </select>
        </div>
      </ToolHeader>

      <div className="flex flex-col lg:flex-row gap-12 items-start justify-center">
        <div className="flex-1 flex flex-col items-center space-y-8 w-full">
          {mode === 'wheel' ? (
            <div className="relative w-full max-w-[400px] aspect-square group cursor-pointer mb-20" onClick={spin}>
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 z-30 filter drop-shadow-xl">
                <ArrowDownIcon color="#1e293b" />
              </div>

              <motion.div
                animate={{ rotate: rotation }}
                transition={isSpinning ? { duration: 4, ease: [0.15, 0.85, 0.15, 1] } : { duration: 0.5 }}
                className="w-full h-full rounded-full border-[12px] border-slate-800 relative shadow-2xl transition-colors duration-500"
                style={{
                  background: `conic-gradient(${validNames.length > 0
                    ? validNames.map((_, i) => `${COLORS[i % COLORS.length]} ${i * (360 / validNames.length)}deg ${(i + 1) * (360 / validNames.length)}deg`).join(', ')
                    : '#cbd5e1'
                    })`
                }}
              >
                {validNames.map((name, i) => (
                  <div key={i} className="absolute top-0 left-0 w-full h-full origin-center flex items-center justify-center" style={{ transform: `rotate(${(i * (360 / validNames.length)) + (180 / validNames.length)}deg)` }}>
                    <span
                      className="absolute left-1/2 w-1/2 text-white font-black uppercase tracking-tighter drop-shadow-md origin-left -rotate-90 truncate text-right pr-6"
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
              <div className="relative w-full p-4 bg-white rounded-[3rem] shadow-2xl border-4 border-slate-100 transition-all duration-500">
                <div className="relative p-3 bg-slate-50 rounded-[2.5rem] shadow-inner border border-slate-200">
                  <div className="relative h-56 bg-white rounded-[2rem] shadow-[inset_0_10px_30px_rgba(0,0,0,0.05)] overflow-hidden flex items-center justify-center">
                    <div className="absolute inset-0 z-30 pointer-events-none bg-gradient-to-b from-white/20 via-transparent to-black/40" />
                    <div className="absolute inset-0 z-30 pointer-events-none bg-gradient-to-r from-black/20 via-transparent to-black/20" />
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 z-40 flex flex-col gap-2">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className={`w-3 h-3 rounded-full ${isSpinning ? 'animate-pulse bg-yellow-400 shadow-[0_0_10px_#fbbf24]' : 'bg-slate-800'}`} />
                      ))}
                    </div>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 z-40 flex flex-col gap-2">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className={`w-3 h-3 rounded-full ${isSpinning ? 'animate-pulse bg-yellow-400 shadow-[0_0_10px_#fbbf24]' : 'bg-slate-800'}`} />
                      ))}
                    </div>
                    <div className="absolute top-1/2 left-0 right-0 h-1 bg-white/20 z-40 pointer-events-none -translate-y-1/2" />
                    <div className="w-full absolute top-1/2 -translate-y-1/2" style={{ height: '80px' }}>
                      <div ref={casinoStripRef} className="w-full flex flex-col" style={{ filter: isSpinning ? 'blur(2px)' : 'none' }}>
                        {strip.map((student, i) => (
                          <div
                            key={i}
                            className="h-20 w-full flex items-center justify-center text-2xl md:text-3xl font-black text-white uppercase tracking-widest border-b border-white/10"
                            style={{
                              backgroundColor: COLORS[i % COLORS.length],
                              textShadow: '0 2px 4px rgba(0,0,0,0.3)'
                            }}
                          >
                            {student}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="absolute -right-12 top-1/2 -translate-y-1/2 hidden md:block">
                  <div className="w-4 h-24 bg-gradient-to-r from-slate-200 to-slate-400 rounded-full shadow-lg" />
                  <motion.div animate={isSpinning ? { rotateX: [0, 45, 0] } : {}} className="absolute -top-6 -left-2 w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-full shadow-xl border-4 border-white" />
                </div>
              </div>
            </div>
          )}

          <div className="text-slate-400 font-black uppercase tracking-widest text-xs animate-pulse">
            Click on the {mode === 'wheel' ? 'Wheel' : 'Spinner'} to Spin!
          </div>
        </div>

        <div className="w-full lg:w-[380px] space-y-6">
          <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-slate-700 uppercase tracking-wider text-sm">Manage Names</h3>
              <div className="flex items-center gap-2">
                <button onClick={() => setLocalNames(shuffle(validNames))} className="p-2 bg-slate-50 hover:bg-slate-100 rounded-xl text-slate-500 transition-colors" title="Shuffle"><Shuffle size={16} /></button>
                <button onClick={() => setLocalNames([...validNames].sort((a, b) => a.localeCompare(b)))} className="p-2 bg-slate-50 hover:bg-slate-100 rounded-xl text-slate-500 transition-colors" title="Sort"><SortAsc size={16} /></button>
                <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-[10px] font-black">{validNames.length} NAMES</span>
              </div>
            </div>
            <textarea value={localNames.join('\n')} onChange={(e) => setLocalNames(e.target.value.split('\n'))} className="w-full h-48 p-4 border-2 border-slate-50 rounded-2xl bg-slate-50 text-sm font-medium focus:border-primary transition-all outline-none resize-none" placeholder="Enter names, one per line..." />
          </div>

          <ToolAnalytics
            title="Analytics"
            history={history}
            onReset={() => setHistory([])}
            onDownload={handleDownload}
            chartData={validNames.length > 0 ? chartData : null}
            chartOptions={chartOptions}
            historyTitle="Pick History"
            historyItemLabel="picks"
            renderHistoryItem={(h, i, totalLength) => (
              <motion.div
                key={totalLength - 1 - i}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex items-center justify-center bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200 group relative cursor-help"
              >
                <span className="text-xs font-black text-slate-700">{h.name}</span>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-[8px] text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-sm z-10">
                  {totalLength - i}
                </div>
              </motion.div>
            )}
          />
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

      <style dangerouslySetInnerHTML={{
        __html: `
        .ct-bar {
          stroke-width: ${barWidth}px !important;
        }
        ${Array.from({length: 26}).map((_, i) => `
          .ct-series-${String.fromCharCode(97 + i)} .ct-bar {
            stroke: ${COLORS[i % COLORS.length]} !important;
          }
        `).join('')}
        .ct-label {
          color: #94a3b8 !important;
          font-size: 8px !important;
          font-weight: 900 !important;
        }
        .ct-grid {
          stroke: #f1f5f9 !important;
        }
        /* Vertical labels for Name Picker */
        .ct-label.ct-horizontal {
          transform: translateX(50%) rotate(90deg);
          transform-origin: 0 0;
          text-align: left;
          white-space: nowrap;
          margin-top: 5px;
          display: block;
          max-width: 120px;
          font-size: ${labelFontSize}px !important;
          overflow: visible !important; /* Prevent clipping by narrow column widths when many names exist */
        }
      `}} />
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
