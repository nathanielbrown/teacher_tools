import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  Flame, 
  X, 
  Zap,
  Box
} from 'lucide-react';
import { useHeader } from '../../contexts/HeaderContext';
import { CHEMICALS } from './ChemicalFireworks/chemicalData';
import { formatFormula } from '../../utils/format';
import { useSettings } from '../../contexts/SettingsContext';
import { audioEngine } from '../../utils/audio';
import { useLocalStorage } from '../../hooks/useLocalStorage';

// 1. Constants
const EMISSION_LINES: Record<string, number[]> = {
  Li: [671],
  Na: [589],
  K: [766, 404],
  Ca: [622, 553, 423],
  Sr: [650, 461, 407],
  Ba: [553, 524, 493, 455],
  Cu: [510, 521, 578],
  Mg: [518, 383, 285]
};

// 2. Config (None)

// 3. Text (Help and Info)
const HELP_INFO = (
  <div className="space-y-4 font-['Outfit']">
    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">How to Use Chemical Fireworks</h3>
    <div className="space-y-3">
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-primary/5 flex items-center justify-center text-xs font-black text-primary shrink-0">1</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">Select a <b>Chemical Block</b> from the sidebar to prepare it.</p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center text-xs font-black text-blue-600 shrink-0">2</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">Click the <b>Flame Area</b> to drop the block into the fire!</p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-success-bg flex items-center justify-center text-xs font-black text-success shrink-0">3</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">Watch the unique colors and <b>Spectral Lines</b> at the top.</p>
      </div>
    </div>
  </div>
);

// 4. Local Storage (None)

// 5. Classes
class Block {
  x: number;
  y: number;
  color: string;
  chemicalId: string;
  vy: number;
  width: number;
  height: number;
  isDead: boolean = false;

  constructor(x: number, color: string, chemicalId: string) {
    this.x = x;
    this.y = -50;
    this.color = color;
    this.chemicalId = chemicalId;
    this.vy = 2;
    this.width = 40;
    this.height = 40;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.fillStyle = this.color;
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.shadowBlur = 10;
    ctx.shadowColor = this.color;
    ctx.strokeRect(this.x - this.width/2, this.y - this.height/2, this.width, this.height);
    ctx.fillRect(this.x - this.width/2, this.y - this.height/2, this.width, this.height);
    ctx.restore();
  }

  update(targetY: number) {
    this.y += this.vy;
    this.vy += 0.2;
    if (this.y >= targetY) {
      this.isDead = true;
    }
  }
}

class Particle {
  x: number;
  y: number;
  color: string;
  vx: number;
  vy: number;
  alpha: number;
  decay: number;
  gravity: number;
  friction: number;
  width: number;
  height: number;
  rotation: number;
  rotationSpeed: number;

  constructor(x: number, y: number, color: string) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.vx = (Math.random() - 0.5) * 6;
    this.vy = (Math.random() - 0.5) * 6 - 2;
    this.alpha = 1;
    this.decay = Math.random() * 0.015 + 0.005;
    this.gravity = 0.12;
    this.friction = 0.98;
    this.width = Math.random() * 8 + 4;
    this.height = Math.random() * 8 + 4;
    this.rotation = Math.random() * Math.PI * 2;
    this.rotationSpeed = (Math.random() - 0.5) * 0.1;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);
    ctx.fillStyle = this.color;
    ctx.shadowBlur = 10;
    ctx.shadowColor = this.color;
    ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
    ctx.restore();
  }

  update() {
    this.vx *= this.friction;
    this.vy *= this.friction;
    this.vy += this.gravity;
    this.x += this.vx;
    this.y += this.vy;
    this.rotation += this.rotationSpeed;
    this.alpha -= this.decay;
  }
}

// 7. Component
export const ChemicalFireworks = () => {
  const { setHasConfig, setOnReset, setOnConfigToggle, clearHeader, setHelpContent } = useHeader();
  const { settings } = useSettings();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedChemId, setSelectedChemId] = useLocalStorage<string | null>('chemical_fireworks_selected_id', CHEMICALS[0].id);
  const [showExplanation, setShowExplanation] = useState(false);

  const particles = useRef<Particle[]>([]);
  const blocks = useRef<Block[]>([]);
  const requestRef = useRef<number>(0);

  const resetTool = useCallback(() => {
    particles.current = [];
    blocks.current = [];
    audioEngine.playTick(settings.soundTheme);
  }, [settings.soundTheme]);

  useEffect(() => {
    setHasConfig(true);
    setOnReset(() => resetTool);
    setOnConfigToggle(() => () => setShowExplanation(prev => !prev));
    setHelpContent(HELP_INFO);
    return () => clearHeader();
  }, [clearHeader, setOnReset, setOnConfigToggle, resetTool, setHelpContent, setHasConfig]);

  // Persistence handled by useLocalStorage
  
  const explode = useCallback((x: number, y: number, color: string) => {
    const count = 60;
    for (let i = 0; i < count; i++) {
      particles.current.push(new Particle(x, y, color));
    }
    audioEngine.playAlarm(settings.soundTheme);
  }, [settings.soundTheme]);

  const animate = useCallback((_time: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.fillStyle = 'rgba(5, 5, 16, 0.25)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const targetY = canvas.height - 200;

    blocks.current = blocks.current.filter(b => {
      b.update(targetY);
      b.draw(ctx);
      if (b.isDead) {
        explode(b.x, b.y, b.color);
        return false;
      }
      return true;
    });

    particles.current = particles.current.filter(p => {
      p.update();
      p.draw(ctx);
      return p.alpha > 0;
    });

    requestRef.current = requestAnimationFrame(animate);
  }, [explode]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const updateSize = () => {
      if (containerRef.current && canvas) {
        canvas.width = containerRef.current.clientWidth;
        canvas.height = containerRef.current.clientHeight;
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      window.removeEventListener('resize', updateSize);
    };
  }, [animate]);

  const handleDropBlock = () => {
    if (!canvasRef.current || !selectedChemId) return;
    const chem = CHEMICALS.find(c => c.id === selectedChemId);
    if (!chem) return;
    
    const x = canvasRef.current.width / 2;
    blocks.current.push(new Block(x, chem.color, chem.id));
    audioEngine.playTick(settings.soundTheme);
  };

  const currentChem = CHEMICALS.find(c => c.id === selectedChemId);
  const currentLines = currentChem ? (EMISSION_LINES[currentChem.formula.slice(0, 2).replace(/[0-9]/g, '')] || EMISSION_LINES[currentChem.formula.charAt(0)] || []) : [];

  return (
    <div className="tool-container flex flex-col lg:flex-row gap-8 h-full font-['Outfit'] select-none relative italic">
      
      {/* Observation Stage */}
      <div 
        ref={containerRef} 
        className="flex-1 bg-[#050510] relative overflow-hidden rounded-[4rem]  border-none cursor-pointer group italic"
        onClick={handleDropBlock}
      >
        <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none" />
        
        {/* Spectroscopy Bar */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[85%] h-16 bg-black/40 backdrop-blur-2xl rounded-full border-4 border-white/10 flex items-center px-10 overflow-hidden ">
           <div className="absolute inset-0 bg-gradient-to-r from-violet-600 via-blue-500 via-green-500 via-yellow-500 via-orange-500 to-red-600 opacity-10" />
           <div className="relative w-full h-full">
              <AnimatePresence>
                {currentLines.map(wl => {
                   const x = ((wl - 400) / 400) * 100;
                   return (
                     <motion.div
                       key={wl}
                       initial={{ opacity: 0, height: 0 }}
                       animate={{ opacity: 1, height: '100%' }}
                       exit={{ opacity: 0, height: 0 }}
                       className="absolute top-0 w-1.5 bg-surface -[0_0_20px_#fff] z-10"
                       style={{ left: `${x}%` }}
                     />
                   );
                })}
              </AnimatePresence>
           </div>
        </div>

        {/* Bunsen Burner */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-64 h-80 pointer-events-none">
           <div className="absolute bottom-40 left-1/2 -translate-x-1/2 flex flex-col items-center">
              <motion.div 
                animate={{ 
                  scale: [1, 1.1, 0.9, 1.05, 1],
                  rotate: [-1, 1, -1, 1, 0]
                }}
                transition={{ duration: 0.2, repeat: Infinity }}
                className="w-16 h-32 rounded-full blur-xl opacity-60"
                style={{ backgroundColor: currentChem?.color || '#3b82f6' }}
              />
              <motion.div 
                animate={{ 
                  scale: [1, 1.2, 0.8, 1.1, 1],
                  opacity: [0.8, 1, 0.8]
                }}
                transition={{ duration: 0.1, repeat: Infinity }}
                className="absolute bottom-0 w-8 h-16 rounded-full bg-surface/80 blur-md"
              />
           </div>
           <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-20 h-40 bg-slate-800 rounded-t-2xl  border-x-4 border-slate-700" />
           <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-40 h-8 bg-slate-700 rounded-full " />
        </div>

        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 text-white/20 font-black text-[10px] uppercase tracking-[0.4em]">Click fire to drop block</div>
      </div>

      {/* Chemical Selector Sidebar */}
      <div className="w-full lg:w-80 flex flex-col bg-surface/80 backdrop-blur-xl p-8 rounded-[4rem]  border-4 border-white overflow-y-auto no-scrollbar italic">
        <div className="flex flex-col gap-4">
           <div className="flex items-center gap-3 mb-4 px-2">
              <Box size={20} className="text-primary" />
              <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Storage Unit</span>
           </div>
           {CHEMICALS.map(chem => (
             <button
               key={chem.id}
               onClick={() => { setSelectedChemId(chem.id); audioEngine.playTick(settings.soundTheme); }}
               className={`p-6 rounded-[2rem] border-4 transition-all flex items-center gap-4 group ${
                 selectedChemId === chem.id 
                   ? 'bg-dark-bg border-slate-900 text-white  scale-105' 
                   : 'bg-surface border-slate-50 text-slate-500 hover:border-primary/20'
               }`}
             >
               <div 
                 className="w-8 h-8 rounded-xl  border-2 border-white/20" 
                 style={{ backgroundColor: chem.color }} 
               />
               <div className="flex flex-col items-start leading-none gap-1">
                 <span className="text-[9px] font-black uppercase tracking-widest">{chem.name}</span>
                 <span className="text-lg font-black text-primary/70 italic">{formatFormula(chem.formula)}</span>
               </div>
             </button>
           ))}
        </div>
      </div>

      {/* Theory Modal (Same as before but simplified) */}
      <AnimatePresence>
        {showExplanation && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-slate-950/95 backdrop-blur-3xl">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-surface p-12 rounded-[4rem]  max-w-4xl w-full space-y-10 relative overflow-hidden italic"
            >
              <button 
                onClick={() => setShowExplanation(false)} 
                className="absolute top-8 right-8 p-3 text-slate-300 hover:text-slate-900 bg-slate-50 rounded-xl transition-all"
              >
                <X size={24} strokeWidth={3} />
              </button>

              <div className="flex items-center gap-6">
                <div className="w-20 h-20 rounded-3xl bg-dark-bg flex items-center justify-center text-white ">
                  <Flame size={40} className="text-primary/70" />
                </div>
                <h2 className="text-5xl font-black text-slate-900 tracking-tighter uppercase italic">Flame Science</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-8 bg-slate-50 rounded-[2.5rem] border-4 border-white  space-y-4">
                  <div className="flex items-center gap-3 text-primary font-black uppercase tracking-widest text-sm">
                    <Zap size={20} fill="currentColor" /> Phase 1
                  </div>
                  <p className="text-slate-500 font-black text-lg uppercase tracking-tighter leading-tight italic">Heat makes electrons jump to a higher level.</p>
                </div>
                <div className="p-8 bg-primary rounded-[2.5rem] border-4 border-indigo-400 space-y-4 text-white">
                  <div className="flex items-center gap-3 font-black uppercase tracking-widest text-sm">
                    <Sparkles size={20} fill="currentColor" /> Phase 2
                  </div>
                  <p className="font-black text-lg uppercase tracking-tighter leading-tight italic">They release light as they drop back down!</p>
                </div>
              </div>

              <div className="p-8 bg-dark-bg rounded-[3rem] text-white flex justify-center">
                 <button
                   onClick={() => setShowExplanation(false)}
                   className="px-12 py-5 bg-primary text-white rounded-[2rem] font-black text-xl uppercase tracking-widest hover:bg-primary transition-all "
                 >
                   Got it!
                 </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChemicalFireworks;
