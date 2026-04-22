import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowDownUp, Info, Settings2, RotateCcw, ArrowDown, ArrowUp, 
  Beaker, Anchor, Droplets, FlaskConical, Scale, Maximize2,
  ChevronRight, ShieldCheck, AlertCircle, TrendingUp, Weight
} from 'lucide-react';

// Constants
const LAB_WIDTH = 800;
const LAB_HEIGHT = 600;
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

export const SpringScales = () => {
  const [selectedScale, setSelectedScale] = useState(SCALES[1]);
  const [attachedWeights, setAttachedWeights] = useState([]);
  const [showForces, setShowForces] = useState(true);
  const [isBroken, setIsBroken] = useState(false);
  
  // Physics state
  const [extension, setExtension] = useState(0);
  const [velocity, setVelocity] = useState(0);

  const totalMass = useMemo(() => 
    attachedWeights.reduce((sum, w) => sum + w.mass, 0),
  [attachedWeights]);

  const totalForce = totalMass * GRAVITY;

  // Check for breaking
  useEffect(() => {
    if (totalForce > selectedScale.maxForce + 0.1 && !isBroken) {
      setIsBroken(true);
      setVelocity(20); // Snap down
    }
  }, [totalForce, selectedScale, isBroken]);

  const resetLab = () => {
    setAttachedWeights([]);
    setExtension(0);
    setVelocity(0);
    setIsBroken(false);
  };

  const addWeight = (weight) => {
    if (isBroken || attachedWeights.length >= 4) return;
    const id = Math.random().toString(36).substr(2, 9);
    setAttachedWeights(prev => [...prev, { ...weight, instanceId: id }]);
  };

  const removeWeight = (instanceId) => {
    if (isBroken) return;
    setAttachedWeights(prev => prev.filter(w => w.instanceId !== instanceId));
  };

  // Physics Simulation Loop
  useEffect(() => {
    let animationFrame;
    
    const step = () => {
      if (isBroken) {
        // Falling animation for broken spring
        setExtension(prev => Math.min(prev + velocity, 500));
        setVelocity(v => v + 0.5); // Gravity
        return;
      }

      const m = totalMass > 0 ? totalMass : 0.01; 
      const F_gravity = totalMass * GRAVITY;
      const targetExtension = (F_gravity / selectedScale.maxForce) * 200; 
      
      setExtension(prev => {
        const stiffness = 0.15;
        const damping = 0.85;
        
        const diff = targetExtension - prev;
        const accel = diff * stiffness;
        
        setVelocity(v => {
          const newV = (v + accel) * damping;
          return Math.abs(newV) < 0.01 ? 0 : newV;
        });

        const next = prev + velocity;
        return Math.abs(next - targetExtension) < 0.1 && Math.abs(velocity) < 0.1 ? targetExtension : next;
      });

      animationFrame = requestAnimationFrame(step);
    };

    animationFrame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animationFrame);
  }, [totalMass, selectedScale, velocity, isBroken]);

  return (
    <div className="max-w-[1400px] mx-auto min-h-0 h-full flex flex-col gap-4 px-6 py-6 select-none overflow-y-auto lg:overflow-hidden">
      {/* Header */}
      <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-6 shrink-0">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-indigo-50 rounded-2xl text-indigo-600">
            <ArrowDownUp size={40} />
          </div>
          <div>
            <h2 className="text-4xl font-black text-slate-800 tracking-tight">Spring Scales</h2>
            <p className="text-slate-400 font-medium italic">Measure force and explore Hooke's Law.</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => !isBroken && setShowForces(!showForces)}
            disabled={isBroken}
            className={`px-6 py-3 rounded-2xl transition-all shadow-lg active:scale-95 flex items-center gap-3 font-black text-sm uppercase tracking-wider ${
              isBroken ? 'bg-slate-100 text-slate-300' :
              showForces ? 'bg-indigo-600 text-white shadow-indigo-100' : 'bg-slate-100 text-slate-500'
            }`}
          >
            {showForces ? <Maximize2 size={20} /> : <Settings2 size={20} />}
            {showForces ? 'Hide Forces' : 'Show Forces'}
          </button>
          <button
            onClick={resetLab}
            className={`p-4 rounded-2xl transition-all active:scale-95 ${
              isBroken ? 'bg-red-600 text-white shadow-xl shadow-red-200 animate-pulse' : 'bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-600'
            }`}
          >
            <RotateCcw size={24} />
          </button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 min-h-0">
        {/* Main Lab View */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="flex-1 bg-white rounded-[3rem] shadow-2xl border-8 border-white overflow-hidden relative shadow-indigo-900/5 group">
            {/* Background Grid */}
            <div className="absolute inset-0 bg-[#f8fafc] opacity-50" style={{ backgroundImage: 'radial-gradient(#e2e8f0 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
            
            {/* The Spring Scale */}
            <div className="absolute left-1/2 top-0 -translate-x-1/2 flex flex-col items-center pt-16 h-full">
              {/* Scale Body */}
              <div 
                className="w-32 h-64 bg-slate-100 rounded-2xl border-4 border-slate-200 relative z-20 flex flex-col items-center py-4"
                style={{ borderColor: selectedScale.color + '40' }}
              >
                {/* Scale Labels Inside */}
                <div className="absolute top-2 left-0 right-0 flex justify-between px-4 z-30">
                   <span className="text-[10px] font-black text-slate-900 uppercase tracking-tighter">N</span>
                   <span className="text-[10px] font-black text-slate-900 uppercase tracking-tighter">g</span>
                </div>

                {/* Scale Markings */}
                <div className="absolute left-1 top-10 bottom-6 w-10 border-r-2 border-slate-400 flex flex-col justify-between items-end pr-1">
                   {[...Array(11)].map((_, i) => (
                     <div key={i} className="flex items-center gap-1">
                        <span className="text-[9px] font-black text-slate-900 tabular-nums w-7 text-left leading-none">
                           {(selectedScale.maxForce * (1 - i/10)).toFixed(selectedScale.precision)}
                        </span>
                        <div className={`h-[1.5px] bg-slate-400 ${i % 5 === 0 ? 'w-3' : 'w-1.5'}`} />
                     </div>
                   ))}
                </div>
                <div className="absolute right-1 top-10 bottom-6 w-10 border-l-2 border-slate-400 flex flex-col justify-between items-start pl-1">
                   {[...Array(11)].map((_, i) => (
                     <div key={i} className="flex items-center gap-1">
                        <div className={`h-[1.5px] bg-slate-400 ${i % 5 === 0 ? 'w-3' : 'w-1.5'}`} />
                        <span className="text-[9px] font-black text-slate-900 tabular-nums w-7 text-left leading-none">
                           {(selectedScale.maxForce * 100 * (1 - i/10)).toFixed(0)}
                        </span>
                     </div>
                   ))}
                </div>
                
                {/* Scale Indicator Background */}
                <div className="w-2 h-full bg-slate-200/50 rounded-full mx-auto relative overflow-hidden">
                   {/* Indicator Line */}
                   <motion.div 
                     animate={{ y: isBroken ? 250 : extension }}
                     className="absolute top-0 left-0 right-0 h-1 bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)] z-30"
                   />
                </div>
              </div>

              {/* The Spring SVG */}
              <div className="relative z-10 -mt-1 flex flex-col items-center">
                 <svg width="60" height={isBroken ? 600 : 150 + extension} viewBox={`0 0 60 ${isBroken ? 600 : 150 + extension}`} preserveAspectRatio="none">
                    {!isBroken ? (
                      <motion.path
                        d={generateSpringPath(150 + extension)}
                        fill="none"
                        stroke="#94a3b8"
                        strokeWidth="3"
                        strokeLinecap="round"
                      />
                    ) : (
                      <>
                        {/* Upper Part of Broken Spring */}
                        <path d="M 30 0 C 60 5 60 15 30 20 C 0 25 0 35 30 40" fill="none" stroke="#94a3b8" strokeWidth="3" strokeLinecap="round" />
                        {/* Lower Falling Part */}
                        <motion.g animate={{ y: extension }}>
                           <path 
                             d="M 30 0 C 60 5 60 15 30 20 C 0 25 0 35 30 40" 
                             fill="none" stroke="#94a3b8" strokeWidth="3" strokeLinecap="round"
                             transform="translate(0, 10)"
                           />
                           <motion.g transform="translate(0, 50)">
                              {/* Hook and Weights */}
                              <g transform="translate(30, 0)">
                                <rect x="-1" y="0" width="2" height="15" fill="#94a3b8" />
                                <path d="M -10 15 A 10 10 0 0 0 10 15" fill="none" stroke="#94a3b8" strokeWidth="3" strokeLinecap="round" />
                              </g>
                           </motion.g>
                        </motion.g>
                      </>
                    )}
                 </svg>
                 
                 {/* Hook & Weights (Non-broken state) */}
                 {/* Tray & Weights (Non-broken state) */}
                 {!isBroken && (
                   <div className="relative -mt-1 flex flex-col items-center">
                      <div className="w-1 h-6 bg-slate-400" />
                      <div className="w-64 h-2 bg-slate-400 rounded-full -mt-1 shadow-md z-10" />
                      
                      <div className="absolute bottom-2 flex flex-row items-end justify-center gap-1 z-20 w-64">
                         <AnimatePresence>
                            {attachedWeights.map((w) => (
                              <motion.div
                                key={w.instanceId}
                                initial={{ scale: 0, y: -20 }}
                                animate={{ scale: 1, y: 0 }}
                                exit={{ scale: 0, y: 20 }}
                                className="relative group cursor-pointer"
                                onClick={() => removeWeight(w.instanceId)}
                              >
                                 <span style={{ fontSize: w.size * 0.7 }}>{w.emoji}</span>
                                 <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <div className="bg-red-500 text-white text-[8px] font-black px-1 py-0.5 rounded-full uppercase">X</div>
                                 </div>
                              </motion.div>
                            ))}
                         </AnimatePresence>
                      </div>
                   </div>
                 )}

                 {/* Detached weights when broken */}
                 {isBroken && (
                   <motion.div 
                     animate={{ y: extension + 60 }} 
                     className="absolute top-0 flex flex-row items-end justify-center gap-1 w-64 pointer-events-none"
                   >
                      {attachedWeights.map((w) => (
                        <span key={w.instanceId} style={{ fontSize: w.size * 0.7 }}>{w.emoji}</span>
                      ))}
                   </motion.div>
                 )}
              </div>

              {/* Force Vectors */}
              {showForces && totalMass > 0 && !isBroken && (
                <div className="absolute right-[-100px] top-[300px] flex flex-col gap-24 pointer-events-none">
                   <div className="flex flex-col items-center">
                      <ArrowUp size={24} className="text-indigo-400" />
                      <div className="w-1 bg-indigo-400 rounded-full" style={{ height: (totalForce / selectedScale.maxForce) * 100 }} />
                      <span className="text-[10px] font-black text-indigo-500 uppercase mt-1">Elasticity</span>
                      <span className="text-[12px] font-black text-indigo-600">{totalForce.toFixed(2)}N</span>
                   </div>
                   <div className="flex flex-col items-center">
                      <div className="w-1 bg-red-400 rounded-full" style={{ height: (totalForce / selectedScale.maxForce) * 100 }} />
                      <ArrowDown size={24} className="text-red-400 -mt-1" />
                      <span className="text-[10px] font-black text-red-500 uppercase mt-1">Weight</span>
                      <span className="text-[12px] font-black text-red-600">{totalForce.toFixed(2)}N</span>
                   </div>
                </div>
              )}
            </div>

            {/* Broken Overlay */}
            {isBroken && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 bg-red-900/10 backdrop-blur-sm z-[100] flex items-center justify-center pointer-events-none"
              >
                 <div className="bg-white rounded-[3rem] p-12 shadow-2xl border-4 border-red-500 flex flex-col items-center gap-6 animate-bounce-slow pointer-events-auto">
                    <div className="p-6 bg-red-50 rounded-full text-red-600">
                       <AlertCircle size={64} />
                    </div>
                    <div className="text-center">
                       <h4 className="text-4xl font-black text-slate-800">SCALE BROKEN!</h4>
                       <p className="text-slate-500 font-bold uppercase tracking-widest text-sm mt-2">Elastic limit exceeded</p>
                    </div>
                    <button
                      onClick={resetLab}
                      className="px-12 py-6 bg-red-600 text-white rounded-[2rem] font-black text-xl shadow-2xl shadow-red-200 active:scale-95 transition-transform"
                    >
                       RESET LAB
                    </button>
                 </div>
              </motion.div>
            )}
          </div>

          {/* Tray / Weight Library */}
          <div className={`bg-slate-100 rounded-[2.5rem] p-6 shadow-2xl border-b-[16px] border-slate-300 flex flex-col gap-4 transition-opacity ${isBroken ? 'opacity-50 pointer-events-none' : ''}`}>
            <div className="flex items-center justify-between px-2">
              <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <Weight size={14} className="text-indigo-500" />
                Weight Tray
              </h3>
              <span className={`text-[10px] font-black px-2 py-1 rounded-full ${attachedWeights.length >= 4 ? 'bg-red-100 text-red-600' : 'bg-slate-200 text-slate-500'}`}>
                {attachedWeights.length} / 4 ITEMS
              </span>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2 px-2 scrollbar-hide">
              {WEIGHTS.map(w => (
                <button
                  key={w.id}
                  onClick={() => addWeight(w)}
                  disabled={isBroken || attachedWeights.length >= 4}
                  className={`flex-shrink-0 group relative w-24 h-24 bg-white rounded-3xl border-2 flex flex-col items-center justify-center gap-1 transition-all active:scale-95 ${
                    attachedWeights.length >= 4 
                      ? 'border-slate-100 opacity-50 grayscale cursor-not-allowed' 
                      : 'border-slate-200 hover:border-indigo-400 hover:shadow-xl'
                  }`}
                >
                  <span className="text-4xl group-hover:scale-125 transition-transform">{w.emoji}</span>
                  <span className="text-[10px] font-bold text-slate-500 group-hover:text-indigo-600 uppercase tracking-tighter">{w.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Info & Settings Sidebar */}
        <div className={`lg:col-span-4 flex flex-col gap-6 transition-opacity ${isBroken ? 'opacity-50 pointer-events-none' : ''}`}>
          {/* Scale Selection */}
          <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-gray-100">
             <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-3">
                <Settings2 className="text-indigo-600" />
                Scale Range
             </h3>
             <div className="grid grid-cols-1 gap-3">
                {SCALES.map(scale => (
                  <button
                    key={scale.id}
                    onClick={() => { setSelectedScale(scale); resetLab(); }}
                    disabled={isBroken}
                    className={`p-4 rounded-2xl border-2 transition-all text-left flex items-center justify-between ${
                      selectedScale.id === scale.id 
                      ? 'border-indigo-500 bg-indigo-50' 
                      : 'border-slate-100 bg-slate-50/50 hover:border-slate-200'
                    }`}
                  >
                    <div>
                      <span className={`text-xs font-black uppercase tracking-tighter block ${selectedScale.id === scale.id ? 'text-indigo-600' : 'text-slate-400'}`}>
                        {scale.name}
                      </span>
                      <span className="text-sm font-bold text-slate-600">
                        Max: {scale.maxForce}N / {scale.maxForce * 100}g
                      </span>
                    </div>
                    {selectedScale.id === scale.id && <ShieldCheck size={20} className="text-indigo-500" />}
                  </button>
                ))}
             </div>
          </div>

          {/* Education Panel */}
          <div className="bg-indigo-900 rounded-[2.5rem] p-8 shadow-xl border border-indigo-800 flex-1 flex flex-col gap-6 overflow-hidden relative group">
             <div className="absolute top-0 right-0 -translate-y-4 translate-x-4 opacity-10 group-hover:scale-110 transition-transform">
                <Anchor size={200} />
             </div>
             <h3 className="text-white text-xl font-black tracking-tight z-10">Hooke's Law</h3>
             <p className="text-indigo-100/70 text-sm font-medium leading-relaxed z-10">
               The extension of a spring is directly proportional to the force applied to it, provided its elastic limit is not exceeded.
             </p>
             
             <div className="space-y-4 z-10">
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                   <h4 className="text-white font-black text-xs uppercase tracking-widest mb-2 flex items-center gap-2">
                      <TrendingUp size={14} className="text-indigo-400" />
                      F = k · x
                   </h4>
                   <ul className="text-xs text-indigo-100/80 space-y-2">
                      <li className="flex items-center gap-2">
                         <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                         Mass (kg) × 9.8 = Weight (N)
                      </li>
                      <li className="flex items-center gap-2">
                         <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                         100g on Earth ≈ 0.98 Newtons
                      </li>
                   </ul>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper to generate SVG path for a spring coil
const generateSpringPath = (totalHeight) => {
  const turns = 12;
  const width = 30;
  const centerX = 30;
  const step = totalHeight / (turns * 4);
  
  let path = `M ${centerX} 0 `;
  for (let i = 0; i < turns; i++) {
    const y = i * step * 4;
    path += `C ${centerX + width} ${y + step} ${centerX + width} ${y + step * 3} ${centerX} ${y + step * 4} `;
    path += `C ${centerX - width} ${y + step * 5} ${centerX - width} ${y + step * 7} ${centerX} ${y + step * 8} `;
  }
  return path;
};
