import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  RotateCcw, 
  ArrowDown, 
  ArrowUp, 
  Scale, 
  Eye, 
  EyeOff,
  Activity, 
  Settings2, 
  Info, 
  X, 
  AlertCircle,
  MousePointer2,
  BrainCircuit,
  Volume2,
  Plus
} from 'lucide-react';
import { useHeader } from '../../contexts/HeaderContext';
import { useSettings } from '../../contexts/SettingsContext';
import { audioEngine } from '../../utils/audio';

// 1. Constants
const SPRING_TOP_Y = 100;
const GRAVITY = 9.8;

const SCALES = [
  { id: '1n', name: '1N Scale', maxForce: 1, k: 0.01, color: '#fbbf24', precision: 2 },
  { id: '5n', name: '5N Scale', maxForce: 5, k: 0.05, color: '#10b981', precision: 1 },
  { id: '10n', name: '10N Scale', maxForce: 10, k: 0.1, color: '#3b82f6', precision: 1 },
];

const WEIGHTS = [
  { id: '10g', name: '10g', mass: 0.01, emoji: '🔘', size: 40 },
  { id: '50g', name: '50g', mass: 0.05, emoji: '🟢', size: 50 },
  { id: '100g', name: '100g', mass: 0.1, emoji: '🔵', size: 60 },
  { id: '200g', name: '200g', mass: 0.2, emoji: '🔴', size: 70 },
  { id: '500g', name: '500g', mass: 0.5, emoji: '🧱', size: 85 },
  { id: '1kg', name: '1kg', mass: 1.0, emoji: '⚖️', size: 100 },
];

// 2. Config (None)

// 3. Text (Help and Info)
const HELP_INFO = (
  <div className="space-y-4 font-['Outfit']">
    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Spring Scale Dynamics</h3>
    <div className="space-y-3">
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-primary/5 flex items-center justify-center text-xs font-black text-primary shrink-0">1</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">Select a <b>Newton Scale</b> from the registry. Each has a different maximum capacity.</p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center text-xs font-black text-blue-600 shrink-0">2</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">Click on <b>Weights</b> in the tray to attach them to the spring hook. Watch it oscillate!</p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-success-bg flex items-center justify-center text-xs font-black text-success shrink-0">3</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">Enable <b>Force Vectors</b> in the header to visualize the tension and gravity magnitudes.</p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-caution-bg flex items-center justify-center text-xs font-black text-caution shrink-0">4</div>
        <p className="text-sm text-slate-600 font-medium leading-tight"><b>Warning:</b> Exceeding the maximum force will cause structural failure (the spring will snap).</p>
      </div>
    </div>
  </div>
);

// 4. Local Storage (None)

// 5. Classes (None)

// 6. Functions
const generateSpringPath = (h: number) => {
  const turns = 12;
  const w = 30;
  const cx = 50;
  const step = h / (turns * 4);
  let p = `M ${cx} 0 `;
  for (let i = 0; i < turns; i++) {
    const y = i * step * 4;
    p += `C ${cx + w} ${y + step} ${cx + w} ${y + step * 3} ${cx} ${y + step * 4} `;
    p += `C ${cx - w} ${y + step * 5} ${cx - w} ${y + step * 7} ${cx} ${y + step * 8} `;
  }
  return p;
};

// 7. Component
export const SpringScales = () => {
  const { setHeaderActions, setHelpContent, setOnReset, clearHeader } = useHeader();
  const { settings } = useSettings();
  const weightIdCounter = useRef(0);
  
  const [selectedScale, setSelectedScale] = useState(SCALES[1]);
  const [attachedWeights, setAttachedWeights] = useState<any[]>([]);
  const [showForces, setShowForces] = useState(true);
  const [isBroken, setIsBroken] = useState(false);
  
  const [extension, setExtension] = useState(0);
  const [velocity, setVelocity] = useState(0);

  const totalMass = useMemo(() => 
    attachedWeights.reduce((sum, w) => sum + w.mass, 0),
  [attachedWeights]);

  const totalForce = totalMass * GRAVITY;



  const resetLab = useCallback(() => {
    setAttachedWeights([]);
    setExtension(0);
    setVelocity(0);
    setIsBroken(false);
    audioEngine.playTick(settings.soundTheme);
  }, [settings.soundTheme]);

  useEffect(() => {
    setOnReset(() => resetLab);
    setHelpContent(HELP_INFO);
    return () => clearHeader();
  }, [clearHeader, setOnReset, resetLab, setHelpContent]);

  const addWeight = (weight: any) => {
    if (isBroken || attachedWeights.length >= 4) return;
    const id = `w-${weightIdCounter.current++}`;
    const newWeights = [...attachedWeights, { ...weight, instanceId: id }];
    setAttachedWeights(newWeights);
    
    const newTotalForce = newWeights.reduce((sum, w) => sum + w.mass, 0) * GRAVITY;
    if (newTotalForce > selectedScale.maxForce + 0.1) {
      setIsBroken(true);
      setVelocity(15);
      audioEngine.playAlarm(settings.soundTheme);
    } else {
      audioEngine.playTick(settings.soundTheme);
    }
  };

  const removeWeight = (instanceId: string) => {
    if (isBroken) return;
    setAttachedWeights(prev => prev.filter(w => w.instanceId !== instanceId));
    audioEngine.playTick(settings.soundTheme);
  };

  useEffect(() => {
    let animationFrame: number;
    const step = () => {
      if (isBroken) {
        setExtension(prev => Math.min(prev + velocity, 500));
        setVelocity(v => v + 0.5);
        return;
      }
      const targetExtension = (totalForce / selectedScale.maxForce) * 200; 
      setExtension(prev => {
        const stiffness = 0.15;
        const damping = 0.8;
        const diff = targetExtension - prev;
        const accel = diff * stiffness;
        setVelocity(v => (v + accel) * damping);
        return prev + velocity;
      });
      animationFrame = requestAnimationFrame(step);
    };
    animationFrame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animationFrame);
  }, [totalForce, selectedScale, isBroken, velocity]);

  useEffect(() => {
    setHeaderActions(
      <div className="flex items-center gap-4 italic">
        <button
          onClick={() => { setShowForces(!showForces); audioEngine.playTick(settings.soundTheme); }}
          className={`flex items-center gap-2 px-6 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all  ${showForces ? 'bg-primary text-white' : 'bg-surface border-2 border-slate-100 text-slate-300 hover:border-primary/20 hover:text-primary'}`}
        >
          {showForces ? <EyeOff size={14} strokeWidth={3} /> : <Eye size={14} strokeWidth={3} />} {showForces ? 'Hide Vectors' : 'Show Vectors'}
        </button>
        <button
          onClick={resetLab}
          className="flex items-center gap-2 px-6 py-2 bg-surface border-2 border-slate-100 text-slate-300 rounded-xl font-black text-[10px] uppercase tracking-widest hover:border-caution-border hover:text-caution transition-all active:scale-95 "
        >
          <RotateCcw size={14} strokeWidth={3} /> Reset
        </button>
      </div>
    );
  }, [showForces, resetLab, settings.soundTheme, setHeaderActions]);

  return (
    <div className="tool-container flex flex-col lg:flex-row gap-8 h-full font-['Outfit'] select-none relative bg-surface rounded-[4rem] p-4 lg:p-12 italic  overflow-hidden">
      
      <div className="tool-grid-bg opacity-30 pointer-events-none" />

      {/* Primary Simulation Surface */}
      <div className="flex-1 bg-slate-50/50 rounded-[4rem] border-4 border-white  flex flex-col items-center justify-center relative overflow-hidden group">
        <div className="tool-grid-bg opacity-20 pointer-events-none" />
        
        {/* Telemetry HUD */}
        <div className="absolute top-12 left-12 flex flex-col gap-2 z-20">
           <div className="flex items-center gap-3 bg-surface/80 border-2 border-slate-100 px-6 py-3 rounded-[1.5rem] backdrop-blur-md ">
              <Activity size={18} className="text-primary" />
              <p className="text-[10px] font-black text-slate-900 uppercase tracking-[0.4em]">Force Matrix Active</p>
           </div>
        </div>

        {/* The Scale Assembly */}
        <div className="relative flex flex-col items-center pt-24 z-10 scale-110">
           {/* Support Structure */}
           <div className="w-80 h-12 bg-dark-bg rounded-full border-4 border-dark-border  relative z-30" />

           <div className="relative flex flex-col items-center -mt-2">
              {/* Scale Body */}
              <div className="w-56 h-[26rem] bg-surface rounded-b-[5rem] border-x-8 border-b-8 border-slate-100 relative z-20 flex flex-col items-center py-12  overflow-hidden">
                 <div className="absolute top-4 left-0 right-0 flex justify-between px-10 text-[9px] font-black text-slate-300 uppercase tracking-widest italic opacity-60">
                    <span>Newtons</span>
                    <span>Grams</span>
                 </div>

                 {/* Precision Markings */}
                 <div className="absolute left-6 top-20 bottom-16 w-12 border-r-4 border-slate-50 flex flex-col justify-between items-end pr-4">
                    {[...Array(11)].map((_, i) => (
                      <div key={i} className="flex items-center gap-3">
                         <span className="text-[9px] font-black text-neutral-400 tabular-nums">{(selectedScale.maxForce * (1 - i/10)).toFixed(1)}</span>
                         <div className={`h-1 bg-slate-200 rounded-full ${i % 5 === 0 ? 'w-6' : 'w-3'}`} />
                      </div>
                    ))}
                 </div>
                 <div className="absolute right-6 top-20 bottom-16 w-12 border-l-4 border-slate-50 flex flex-col justify-between items-start pl-4">
                    {[...Array(11)].map((_, i) => (
                      <div key={i} className="flex items-center gap-3">
                         <div className={`h-1 bg-slate-200 rounded-full ${i % 5 === 0 ? 'w-6' : 'w-3'}`} />
                         <span className="text-[9px] font-black text-neutral-400 tabular-nums">{(selectedScale.maxForce * 100 * (1 - i/10)).toFixed(0)}</span>
                      </div>
                    ))}
                 </div>

                 {/* Measurement Indicator */}
                 <motion.div 
                    animate={{ y: isBroken ? 380 : (extension / 200) * 320 }}
                    className="w-full h-2 bg-primary relative z-30 -[0_0_15px_rgba(79,70,229,0.5)]"
                 />
              </div>

              {/* Elastic Mechanism */}
              <div className="relative z-10 -mt-2 flex flex-col items-center">
                 <svg width="120" height={isBroken ? 800 : 250 + extension} viewBox={`0 0 100 ${isBroken ? 600 : 200 + extension}`} preserveAspectRatio="none">
                    {!isBroken ? (
                       <path 
                          d={generateSpringPath(200 + extension)} 
                          fill="none" 
                          stroke="#64748b" 
                          strokeWidth="4" 
                          strokeLinecap="round" 
                       />
                    ) : (
                       <motion.g animate={{ y: extension }}>
                          <path d="M 50 0 L 50 150" stroke="#64748b" strokeWidth="4" strokeDasharray="10 10" />
                       </motion.g>
                    )}
                 </svg>
                 
                 {!isBroken && (
                    <div className="relative -mt-6 flex flex-col items-center">
                       {/* Load Hook */}
                       <div className="w-80 h-4 bg-dark-bg rounded-full  border-2 border-dark-border" />
                       
                       <div className="flex gap-6 mt-6 h-32 items-end">
                          <AnimatePresence>
                             {attachedWeights.map((w) => (
                               <motion.div
                                 key={w.instanceId}
                                 initial={{ scale: 0, y: -40, rotate: -15 }}
                                 animate={{ scale: 1, y: 0, rotate: 0 }}
                                 exit={{ scale: 0, y: 40, rotate: 15 }}
                                 whileHover={{ scale: 1.1 }}
                                 className="relative group cursor-pointer"
                                 onClick={() => removeWeight(w.instanceId)}
                               >
                                  <span style={{ fontSize: w.size * 0.9 }}>{w.emoji}</span>
                                  <div className="absolute -top-3 -right-3 w-8 h-8 bg-rose-600 text-white flex items-center justify-center rounded-2xl opacity-0 group-hover:opacity-100 transition-all border-4 border-white ">
                                     <X size={14} strokeWidth={4} />
                                  </div>
                               </motion.div>
                             ))}
                          </AnimatePresence>
                       </div>
                    </div>
                 )}
              </div>
           </div>
        </div>

        {/* Vector Visualization */}
        <AnimatePresence>
           {showForces && totalMass > 0 && !isBroken && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="absolute right-12 top-1/2 -translate-y-1/2 flex flex-col gap-32 z-20">
                 <div className="flex flex-col items-center gap-4">
                    <div className="bg-surface border-4 border-indigo-50 px-8 py-4 rounded-[2rem]  flex flex-col items-center">
                       <span className="text-[10px] font-black text-primary/70 uppercase tracking-widest italic">Elasticity</span>
                       <span className="text-3xl font-black text-primary italic">{totalForce.toFixed(2)}N</span>
                    </div>
                    <ArrowUp size={48} strokeWidth={3} className="text-primary/70 animate-bounce" />
                 </div>
                 <div className="flex flex-col items-center gap-4">
                    <ArrowDown size={48} strokeWidth={3} className="text-rose-400 animate-bounce" />
                    <div className="bg-surface border-4 border-rose-50 px-8 py-4 rounded-[2rem]  flex flex-col items-center">
                       <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest italic">Weight</span>
                       <span className="text-3xl font-black text-caution italic">{(totalMass * GRAVITY).toFixed(2)}N</span>
                    </div>
                 </div>
              </motion.div>
           )}
        </AnimatePresence>

        <AnimatePresence>
           {isBroken && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-rose-950/40 backdrop-blur-2xl z-[100] flex items-center justify-center p-12">
                 <motion.div 
                    initial={{ scale: 0.9, y: 50 }}
                    animate={{ scale: 1, y: 0 }}
                    className="bg-surface p-16 rounded-[5rem]  flex flex-col items-center gap-10 border-[16px] border-rose-50 italic"
                 >
                    <div className="w-32 h-32 bg-caution-bg rounded-[3.5rem] flex items-center justify-center text-caution ">
                       <AlertCircle size={80} strokeWidth={1.5} />
                    </div>
                    <div className="text-center space-y-4">
                       <h2 className="text-6xl font-black text-slate-900 tracking-tighter uppercase leading-none">Matrix Break</h2>
                       <p className="text-[12px] font-black text-caution uppercase tracking-[0.4em] mt-2">Elastic Limit Exceeded • Reset Protocol Required</p>
                    </div>
                    <button onClick={resetLab} className="w-full h-24 bg-dark-bg text-white rounded-[3rem] font-black uppercase tracking-[0.2em] text-xl hover:bg-rose-600 transition-all  flex items-center justify-center gap-6 active:scale-95">
                       <RotateCcw size={32} strokeWidth={3} /> Re-Initialize Scale
                    </button>
                 </motion.div>
              </motion.div>
           )}
        </AnimatePresence>

        {/* Operational Interface Control */}
        <div className="absolute bottom-12 right-12 flex items-center gap-6 z-20 bg-surface/80 border-2 border-slate-100 p-8 rounded-[3rem] backdrop-blur-md  pointer-events-none">
           <div className="text-right">
              <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest leading-none">Mass Application</p>
              <p className="text-[10px] font-black text-primary uppercase tracking-widest mt-2 leading-none">Click Tray Elements</p>
           </div>
           <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-white ">
              <MousePointer2 size={24} strokeWidth={3} />
           </div>
        </div>
      </div>

      {/* Control Module Sidebar */}
      <div className="w-full lg:w-[450px] shrink-0 flex flex-col gap-8 relative z-20 italic">
        
        {/* Force Measurement Readout */}
        <div className="bg-dark-bg p-12 rounded-[4rem] border-4 border-dark-border  flex flex-col items-center gap-10 relative overflow-hidden shrink-0">
           <div className="tool-grid-bg-dark opacity-10 pointer-events-none" />
           
           <div className="flex items-center justify-between w-full relative z-10">
              <span className="text-[10px] font-black text-primary/70 uppercase tracking-[0.5em]">Real-Time Strain</span>
              <div className="px-4 py-1 bg-primary/20 rounded-full border border-indigo-500/20">
                 <span className="text-[8px] font-black text-primary/70 uppercase tracking-widest">Live Feed</span>
              </div>
           </div>

           <div className="relative z-10 w-full flex flex-col items-center">
              <div className="flex items-baseline gap-2 mb-8">
                 <span className="text-[8rem] font-black text-white italic tracking-tighter leading-none tabular-nums">{totalForce.toFixed(selectedScale.precision)}</span>
                 <span className="text-3xl font-black text-slate-500 uppercase tracking-widest">N</span>
              </div>
              <div className="w-full space-y-4">
                 <div className="flex items-center justify-between px-2">
                    <span className="text-[10px] font-black text-primary/70 uppercase tracking-widest">Structural Tolerance</span>
                    <span className="text-xs font-black text-white tabular-nums">{selectedScale.maxForce}N Limit</span>
                 </div>
                 <div className="h-6 bg-surface/5 rounded-full p-1 border border-white/10 relative group">
                    <motion.div 
                      className={`h-full rounded-full -[0_0_15px_rgba(79,70,229,0.5)] ${totalForce > selectedScale.maxForce ? 'bg-rose-600' : 'bg-primary'}`}
                      initial={false}
                      animate={{ width: `${Math.min(100, (totalForce / selectedScale.maxForce) * 100)}%` }}
                    />
                 </div>
              </div>
           </div>
        </div>

        {/* Capacity & Weight Matrix */}
        <div className="flex-1 bg-slate-50/50 p-10 rounded-[4rem] border-4 border-white  flex flex-col gap-8 min-h-0">
           <div className="flex items-center gap-4 shrink-0 border-b-4 border-white pb-6">
              <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-white ">
                 <Settings2 size={24} strokeWidth={3} />
              </div>
              <h4 className="text-xl font-black text-slate-900 uppercase tracking-tight leading-none">Scale Registry</h4>
           </div>

           <div className="flex-1 overflow-y-auto no-scrollbar pr-2 pb-4 space-y-6">
              <div className="flex flex-col gap-3">
                {SCALES.map(scale => (
                  <button
                    key={scale.id}
                    onClick={() => { 
                      setSelectedScale(scale); 
                      if (totalForce > scale.maxForce + 0.1) {
                        setIsBroken(true);
                        setVelocity(15);
                        audioEngine.playAlarm(settings.soundTheme);
                      } else {
                        resetLab(); 
                      }
                    }}
                    disabled={isBroken}
                    className={`p-6 rounded-[2.5rem] border-4 transition-all text-left flex items-center justify-between italic ${selectedScale.id === scale.id ? 'bg-dark-bg border-indigo-600 text-white  scale-105 z-10' : 'bg-surface border-white text-slate-500 hover:border-primary/20 '}`}
                  >
                    <div className="flex flex-col">
                      <span className="text-xl font-black uppercase tracking-tight">{scale.name}</span>
                      <span className="text-[9px] font-black uppercase tracking-widest mt-1 opacity-60">Threshold: {scale.maxForce} Newtons</span>
                    </div>
                    {selectedScale.id === scale.id && <div className="w-4 h-4 rounded-full bg-primary animate-pulse -[0_0_10px_rgba(79,70,229,1)]" />}
                  </button>
                ))}
              </div>

              <div className="w-full h-px bg-surface/50 my-8" />

              <div className="space-y-4">
                 <div className="flex items-center gap-3 ml-4">
                    <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                       <Plus size={16} strokeWidth={3} />
                    </div>
                    <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Weight Tray</span>
                 </div>
                 <div className="grid grid-cols-2 gap-3">
                   {WEIGHTS.map(w => (
                     <button
                       key={w.id}
                       onClick={() => addWeight(w)}
                       disabled={isBroken || attachedWeights.length >= 4}
                       className="p-8 bg-surface rounded-[2.5rem] border-4 border-white hover:border-primary/20 transition-all flex flex-col items-center gap-3 group  disabled:opacity-20 hover:scale-[1.02] "
                     >
                       <span className="text-5xl group-hover:scale-110 transition-transform">{w.emoji}</span>
                       <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest italic">{w.name}</span>
                     </button>
                   ))}
                 </div>
              </div>
           </div>

           <div className="p-8 bg-primary rounded-[3.5rem] text-white space-y-6  relative overflow-hidden shrink-0 mt-auto">
              <div className="tool-grid-bg opacity-10 pointer-events-none" />
              <div className="flex items-center gap-4 relative z-10">
                 <div className="w-10 h-10 rounded-xl bg-surface/20 flex items-center justify-center text-white border border-white/20">
                    <Volume2 size={20} strokeWidth={3} />
                 </div>
                 <h4 className="text-[10px] font-black uppercase tracking-[0.3em]">Theoretical Matrix</h4>
              </div>
              <p className="text-xs font-black leading-relaxed italic text-indigo-100 uppercase tracking-widest relative z-10">
                Hooke's Law: F = kx. <br/>
                Gravity: 9.8m/s².
              </p>
              <div className="flex justify-end relative z-10">
                 <BrainCircuit size={24} className="text-white/20" />
              </div>
           </div>
        </div>
      </div>

      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[150px] opacity-40 -z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-caution-bg rounded-full blur-[150px] opacity-40 -z-10 pointer-events-none" />
    </div>
  );
};

export default SpringScales;
