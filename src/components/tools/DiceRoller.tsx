import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Dices, 
  RotateCcw, 
  BarChart3, 
  Database, 
  Terminal, 
  ShieldCheck,
  Activity,
} from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';
import { useHeader } from '../../contexts/HeaderContext';
import { audioEngine } from '../../utils/audio';
import { storage } from '../../utils/storage';

// 1. Constants
const DICE_TYPES = [
  { sides: 4, label: 'D4', icon: '🔺', color: '#f43f5e' },
  { sides: 6, label: 'D6', icon: '🎲', color: '#6366f1' },
  { sides: 8, label: 'D8', icon: '💎', color: '#10b981' },
  { sides: 10, label: 'D10', icon: '🌀', color: '#f59e0b' },
  { sides: 12, label: 'D12', icon: '🔮', color: '#a855f7' },
  { sides: 20, label: 'D20', icon: '🌌', color: '#06b6d4' },
];

// 2. Config (None)

// 3. Text (Help and Info)
const HELP_INFO = (
  <div className="space-y-4 font-['Outfit']">
    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">How to Use</h3>
    <div className="space-y-3">
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center text-xs font-black text-indigo-600 shrink-0">1</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">Choose a <b>die</b> to roll.</p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center text-xs font-black text-blue-600 shrink-0">2</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">Press the <b>Roll</b> button.</p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-green-50 flex items-center justify-center text-xs font-black text-green-600 shrink-0">3</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">Click <b>Graph</b> to see your results.</p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-slate-50 flex items-center justify-center text-xs font-black text-slate-600 shrink-0">4</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">See your past rolls in the <b>History</b>.</p>
      </div>
    </div>
  </div>
);

// 4. Local Storage (Logic in component using storage util)

// 5. Classes (None)

// 6. Functions (None)

// 7. Component

export const DiceRoller = () => {
  const { setHeaderActions, setOnReset, clearHeader, setHelpContent } = useHeader();
  const { settings } = useSettings();
  const [selectedDice, setSelectedDice] = useState(6);
  const [rolls, setRolls] = useState<any[]>([]);
  const [isRolling, setIsRolling] = useState(false);
  const [history, setHistory] = useState(() => {
    const saved = storage.getItem('teacherToolsDiceHistory');
    return saved ? JSON.parse(saved) : [];
  });
  const [showStats, setShowStats] = useState(true);

  const reset = useCallback(() => {
    setHistory([]);
    setRolls([]);
    storage.setItem('teacherToolsDiceHistory', JSON.stringify([]));
    audioEngine.playTick(settings.soundTheme);
  }, [settings.soundTheme]);

  useEffect(() => {
    storage.setItem('teacherToolsDiceHistory', JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    setOnReset(() => reset);
    setHelpContent(HELP_INFO);
    return () => clearHeader();
  }, [clearHeader, setOnReset, reset, setHelpContent]);

  useEffect(() => {
    setHeaderActions(
      <div className="flex items-center gap-4 italic">
        <button
          onClick={() => { setShowStats(!showStats); audioEngine.playTick(settings.soundTheme); }}
          className={`flex items-center gap-2 px-8 py-2 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] transition-all active:scale-95 border-2 ${
            showStats 
              ? 'bg-slate-950 text-white border-slate-950  ' 
              : 'bg-white text-slate-400 hover:text-indigo-600 hover:bg-slate-50 border-slate-100 hover:border-indigo-100 '
          }`}
        >
          {showStats ? <BarChart3 size={14} className="text-indigo-400" /> : <BarChart3 size={14} className="opacity-40" />}
          Graph
        </button>
        <div className="w-px h-6 bg-slate-200" />
        <button
          onClick={reset}
          className="flex items-center gap-2 px-8 py-2 bg-white text-slate-400 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-rose-50 hover:text-rose-600 transition-all active:scale-95 border-2 border-slate-100 hover:border-rose-100 "
        >
          <RotateCcw size={14} /> Clear
        </button>
      </div>
    );
  }, [showStats, settings.soundTheme, setHeaderActions, reset]);

  const rollDice = () => {
    if (isRolling) return;
    setIsRolling(true);
    audioEngine.playTick(settings.soundTheme);
    
    setTimeout(() => {
      const newValue = Math.floor(Math.random() * selectedDice) + 1;
      const newRoll = {
        id: Date.now(),
        value: newValue,
        sides: selectedDice,
        timestamp: new Date().toLocaleTimeString(),
        color: DICE_TYPES.find(d => d.sides === selectedDice)?.color || '#6366f1'
      };
      setRolls([newRoll, ...rolls].slice(0, 5));
      setHistory([newRoll, ...history]);
      setIsRolling(false);
      audioEngine.playSuccess(settings.soundTheme);
    }, 600);
  };

  const stats_data = useMemo(() => {
    if (history.length === 0) return null;
    const currentDiceHistory = history.filter((h: any) => h.sides === selectedDice);
    if (currentDiceHistory.length === 0) return null;

    const counts: Record<number, number> = {};
    for (let i = 1; i <= selectedDice; i++) counts[i] = 0;
    currentDiceHistory.forEach((h: any) => counts[h.value]++);

    const max = Math.max(...(Object.values(counts) as number[]));
    return { counts, max, total: currentDiceHistory.length };
  }, [history, selectedDice]);

  return (
    <div className="tool-container flex flex-col lg:flex-row gap-8 h-full font-['Outfit'] select-none italic">
      
      {/* Simulation Stage */}
      <div className="flex-1 flex flex-col gap-8">
        <div className="flex-1 tool-stage p-12 lg:p-24 relative overflow-hidden bg-white border-none rounded-[4rem] group/stage flex flex-col items-center justify-center ">
          <div className="tool-grid-bg opacity-30 pointer-events-none" />
          


          {/* Dice Display Area */}
          <div className="relative z-10 flex flex-col items-center gap-20 w-full">
            <AnimatePresence mode="wait">
              {isRolling ? (
                <motion.div
                  key="rolling"
                  initial={{ scale: 0.8, opacity: 0, rotate: -20 }}
                  animate={{ scale: 1, opacity: 1, rotate: 0 }}
                  exit={{ scale: 1.2, opacity: 0, rotate: 20 }}
                  className="w-64 h-64 rounded-[3.5rem] bg-slate-900 flex items-center justify-center -[0_64px_128px_-24px_rgba(0,0,0,0.4)] border-8 border-slate-800"
                >
                  <motion.div
                    animate={{ rotate: 360, scale: [1, 1.1, 1] }}
                    transition={{ duration: 0.5, repeat: Infinity, ease: "linear" }}
                  >
                    <Dices size={100} className="text-indigo-400 opacity-20" />
                  </motion.div>
                </motion.div>
              ) : (
                <motion.div
                  key={rolls[0]?.id || 'empty'}
                  initial={{ y: 40, opacity: 0, rotateX: 45 }}
                  animate={{ y: 0, opacity: 1, rotateX: 0 }}
                  className="relative group/dice"
                >
                  {rolls[0] ? (
                    <div 
                      className="w-64 h-64 rounded-[4rem] flex flex-col items-center justify-center -[0_80px_120px_-20px_rgba(0,0,0,0.3)] border-[12px] border-white relative overflow-hidden transition-transform duration-700 group-hover/dice:scale-105"
                      style={{ backgroundColor: rolls[0].color }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-tr from-black/20 via-transparent to-white/30" />
                      <span className="text-[11px] font-black text-white/40 uppercase tracking-[0.8em] mb-4 relative z-10">Result</span>
                      <span className="text-9xl font-black text-white tabular-nums tracking-tighter  relative z-10">
                        {rolls[0].value}
                      </span>
                      <div className="absolute -bottom-4 -right-4 opacity-10 group-hover/dice:rotate-12 transition-transform duration-1000">
                         <Dices size={160} />
                      </div>
                    </div>
                  ) : (
                    <div className="w-64 h-64 rounded-[4rem] bg-slate-50 border-8 border-dashed border-slate-100 flex flex-col items-center justify-center text-slate-200 gap-6">
                       <Dices size={80} strokeWidth={1} />
                       <span className="text-[10px] font-black uppercase tracking-[0.4em]">Roll to start</span>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Selector Grid */}
            <div className="flex flex-wrap justify-center gap-4 p-4 bg-white/80 backdrop-blur-xl rounded-[3rem] border-none ">
              {DICE_TYPES.map((dice) => (
                <button
                  key={dice.sides}
                  onClick={() => { setSelectedDice(dice.sides); audioEngine.playTick(settings.soundTheme); }}
                  className={`group relative flex flex-col items-center gap-2 px-8 py-5 rounded-[2rem] transition-all duration-500 border-4 ${
                    selectedDice === dice.sides 
                      ? 'bg-white border-indigo-600  -translate-y-2 scale-110 z-10' 
                      : 'bg-white/40 border-transparent hover:bg-white hover:border-slate-100 text-slate-400 opacity-60 hover:opacity-100'
                  }`}
                >
                  <span className="text-2xl mb-1 group-hover:scale-125 transition-transform duration-500">{dice.icon}</span>
                  <span className={`text-[10px] font-black uppercase tracking-widest ${selectedDice === dice.sides ? 'text-indigo-600' : 'text-slate-400'}`}>
                    {dice.label}
                  </span>
                  {selectedDice === dice.sides && (
                    <motion.div layoutId="dice-glow" className="absolute inset-0 rounded-[1.8rem] bg-indigo-500/5 -z-10" />
                  )}
                </button>
              ))}
            </div>

            <button
              onClick={rollDice}
              disabled={isRolling}
              className="px-16 py-8 bg-slate-950 text-white rounded-[3rem] font-black text-xs uppercase tracking-[0.8em] -[0_48px_96px_-16px_rgba(0,0,0,0.6)] hover:bg-indigo-600 hover:-translate-y-2 active:scale-95 transition-all duration-500 border-8 border-slate-800"
            >
              Roll
            </button>
          </div>
        </div>
      </div>

      {/* Probability Analytics Sidebar */}
      <div className="w-full lg:w-[460px] shrink-0 flex flex-col gap-8 h-full overflow-hidden">
        <div className="tool-sidebar-card flex-1 p-12 flex flex-col gap-10 bg-white/80 backdrop-blur-xl border-none  rounded-[3rem]">
           <div className="flex items-center justify-between shrink-0 mb-2">
              <div className="flex items-center gap-5">
                 <div className="w-14 h-14 rounded-2xl bg-slate-900 flex items-center justify-center text-indigo-400 border-4 border-slate-800 ">
                    <Database size={28} />
                 </div>
                 <div className="flex flex-col">
                    <h4 className="text-xl font-black text-slate-800 uppercase tracking-tight">Results</h4>
                 </div>
              </div>
           </div>

           <div className="flex-1 flex flex-col gap-12 min-h-0">
              {/* Statistical Distribution */}
              {showStats && stats_data ? (
                <div className="space-y-8 shrink-0">
                  <div className="flex items-center justify-between">
                     <h3 className="text-[12px] font-black text-slate-400 uppercase tracking-[0.4em] leading-none">Graph</h3>
                     <span className="text-[10px] font-black text-indigo-400 uppercase bg-indigo-50 px-3 py-1 rounded-full">{stats_data.total} Rolls</span>
                  </div>
                  <div className="h-[280px] w-full bg-slate-50 rounded-[3rem] border-4 border-white  p-10 flex items-end justify-between gap-3 relative overflow-hidden">
                    <div className="tool-grid-bg opacity-10 pointer-events-none" />
                    {Object.entries(stats_data.counts).map(([val, count]) => {
                      const height = stats_data.max > 0 ? (count / stats_data.max) * 100 : 0;
                      return (
                        <div key={val} className="flex-1 flex flex-col items-center gap-4 group/bar h-full justify-end relative z-10">
                          <div className="w-full relative flex flex-col justify-end h-full">
                            <motion.div 
                              initial={{ height: 0 }}
                              animate={{ height: `${height}%` }}
                              className="w-full bg-slate-950 rounded-2xl relative group-hover/bar:bg-indigo-600 transition-colors  overflow-hidden"
                            >
                               <div className="absolute inset-x-0 top-0 h-1/2 bg-white/10" />
                               {count > 0 && (
                                 <span className="absolute -top-8 left-1/2 -translate-x-1/2 text-[10px] font-black text-indigo-500 tabular-nums">
                                   {count}
                                 </span>
                               )}
                            </motion.div>
                          </div>
                          <span className="text-xs font-black text-slate-400 tabular-nums group-hover/bar:text-slate-900">{val}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="h-[280px] w-full bg-slate-50 rounded-[3rem] border-4 border-dashed border-slate-100 flex flex-col items-center justify-center text-slate-300 gap-6 opacity-40 shrink-0">
                   <Activity size={48} strokeWidth={1} />
                   <p className="text-[10px] font-black uppercase tracking-[0.4em]">Roll to see graph</p>
                </div>
              )}

              {/* Recent Activity Log */}
              <div className="flex-1 flex flex-col min-h-0">
                <div className="flex items-center justify-between mb-8 shrink-0">
                   <h3 className="text-[12px] font-black text-slate-400 uppercase tracking-[0.4em] leading-none">History</h3>
                   <Terminal size={18} className="text-slate-300" />
                </div>
                <div className="flex-1 overflow-y-auto space-y-4 pr-4 custom-scrollbar no-scrollbar">
                  <AnimatePresence initial={false}>
                    {history.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-slate-300 text-[11px] font-black uppercase tracking-[0.6em] p-12 text-center">
                        Roll to see history
                      </div>
                    ) : (
                      history.slice(0, 50).map((h: any) => (
                        <motion.div 
                          key={h.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="flex justify-between items-center p-8 rounded-[2.5rem] bg-slate-50 border-4 border-white hover:border-indigo-100 hover:bg-white transition-all group  "
                        >
                          <div className="flex items-center gap-6">
                             <div className="w-14 h-14 rounded-3xl bg-white  flex items-center justify-center border-2 border-slate-100 group-hover:scale-110 transition-transform">
                                <div className="w-6 h-6 rounded-full " style={{ backgroundColor: h.color }} />
                             </div>
                             <div className="flex flex-col">
                                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest group-hover:text-indigo-400 transition-colors">D{h.sides}</span>
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{h.timestamp}</span>
                             </div>
                          </div>
                          <span className="text-4xl font-black text-slate-800 tracking-tighter leading-none">{h.value}</span>
                        </motion.div>
                      ))
                    )}
                  </AnimatePresence>
                </div>
              </div>


           </div>
        </div>
      </div>
    </div>
  );
};

export default DiceRoller;
