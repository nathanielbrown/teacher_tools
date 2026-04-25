import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Beaker, Sparkles, Trash2, Info } from 'lucide-react';
import { ToolHeader } from '../ToolHeader';
import { CHEMICALS } from './ChemicalFireworks/chemicalData';
import { formatFormula } from '../../utils/format';

export const ChemicalFireworks = () => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [activeChemicalIds, setActiveChemicalIds] = useState([]);
  const [showInfo, setShowInfo] = useState(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [speed, setSpeed] = useState('normal');
  const particles = useRef([]);
  const rockets = useRef([]);
  const requestRef = useRef();
  const timers = useRef({});

  const speedSettings = {
    slow: { base: 1500, range: 1500 },
    normal: { base: 500, range: 1000 },
    fast: { base: 100, range: 300 }
  };

  // Particle Class
  class Particle {
    constructor(x, y, color, secondary, isSpark = false) {
      this.x = x;
      this.y = y;
      this.color = color;
      this.secondary = secondary;
      this.isSpark = isSpark;
      const angle = Math.random() * Math.PI * 2;
      const velocity = Math.random() * 6 + 2;
      this.vx = Math.cos(angle) * velocity;
      this.vy = Math.sin(angle) * velocity;
      this.alpha = 1;
      this.decay = Math.random() * 0.015 + 0.005;
      this.gravity = 0.15;
      this.friction = 0.96;
      this.size = Math.random() * 3 + 1;
    }

    draw(ctx) {
      ctx.save();
      ctx.globalAlpha = this.alpha;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fillStyle = this.isSpark ? '#FFD700' : this.color;
      ctx.shadowBlur = 10;
      ctx.shadowColor = this.color;
      ctx.fill();
      ctx.restore();
    }

    update() {
      this.vx *= this.friction;
      this.vy *= this.friction;
      this.vy += this.gravity;
      this.x += this.vx;
      this.y += this.vy;
      this.alpha -= this.decay;
    }
  }

  // Rocket Class
  class RocketObj {
    constructor(targetX, targetY, chemical, startX, startY) {
      this.x = startX || (targetX + (Math.random() - 0.5) * 100);
      this.y = startY || (containerRef.current?.clientHeight || 600);
      this.targetY = targetY;
      this.chemical = chemical;
      this.vx = (targetX - this.x) / 40;
      this.vy = (targetY - this.y) / 40;
      this.exploded = false;
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;
      if (Math.abs(this.y - this.targetY) < 5 || this.y <= this.targetY) {
        this.explode();
        return true;
      }
      return false;
    }

    draw(ctx) {
      ctx.beginPath();
      ctx.arc(this.x, this.y, 2, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(this.x - this.vx * 3, this.y - this.vy * 3);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.stroke();
    }

    explode() {
      const count = 100;
      for (let i = 0; i < count; i++) {
        particles.current.push(new Particle(this.x, this.y, this.chemical.color, this.chemical.secondary));
      }
    }
  }

  const animate = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'rgba(10, 10, 25, 0.25)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    rockets.current = rockets.current.filter(rocket => {
      const exploded = rocket.update();
      if (!exploded) rocket.draw(ctx);
      return !exploded;
    });
    particles.current = particles.current.filter(p => {
      p.update();
      p.draw(ctx);
      return p.alpha > 0;
    });
    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const updateSize = () => {
      if (containerRef.current) {
        canvas.width = containerRef.current.clientWidth;
        canvas.height = containerRef.current.clientHeight;
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    requestRef.current = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(requestRef.current);
      window.removeEventListener('resize', updateSize);
    };
  }, []);

  const launchFirework = (chemical, startX, startY) => {
    if (!containerRef.current) return;
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;
    const targetX = Math.random() * (width * 0.8) + (width * 0.1);
    const targetY = Math.random() * (height * 0.4) + (height * 0.1);
    rockets.current.push(new RocketObj(targetX, targetY, chemical, startX, startY));
  };

  const toggleChemical = (id) => {
    setActiveChemicalIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  useEffect(() => {
    if (activeChemicalIds.length === 0) return;
    const scheduleNext = () => {
      const currentSpeed = speedSettings[speed];
      const delay = Math.random() * currentSpeed.range + currentSpeed.base;
      timers.current.global = setTimeout(() => {
        const randomId = activeChemicalIds[Math.floor(Math.random() * activeChemicalIds.length)];
        const chem = CHEMICALS.find(c => c.id === randomId);
        const el = document.getElementById(`chem-btn-${randomId}`);
        let sx, sy;
        if (el && containerRef.current) {
          const rect = el.getBoundingClientRect();
          const containerRect = containerRef.current.getBoundingClientRect();
          sx = rect.left - containerRect.left + rect.width / 2;
          sy = rect.top - containerRect.top;
        }
        launchFirework(chem, sx, sy);
        scheduleNext();
      }, delay);
    };
    scheduleNext();
    return () => clearTimeout(timers.current.global);
  }, [activeChemicalIds, speed]);

  return (
    <div className="w-full mx-auto px-4 pt-2 pb-8 h-full flex flex-col gap-6">
      <ToolHeader
        title="Chemical Fireworks"
        icon={Beaker}
        description="Scientific Flame Test Simulation"
        infoContent={
          <>
            <p>
              <strong className="text-white block mb-1">How it Works</strong>
              Different chemical elements produce unique colors when heated. This simulation mimics the "Flame Test" used in chemistry.
            </p>
            <p>
              <strong className="text-white block mb-1">Interaction</strong>
              Click a chemical compound to launch a firework. Toggle them to enable "Auto-Launch" mode.
            </p>
          </>
        }
      >
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
          {['slow', 'normal', 'fast'].map(s => (
            <button 
              key={s} 
              onClick={() => setSpeed(s)} 
              className={`px-4 py-1.5 rounded-lg transition-all font-black text-[10px] uppercase tracking-wider ${speed === s ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              {s}
            </button>
          ))}
        </div>
      </ToolHeader>

      <div ref={containerRef} className="relative w-full flex-1 bg-[#0a0a19] rounded-[3rem] overflow-hidden flex flex-col shadow-2xl border border-white/5">
        <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none" />

      <div className="flex-1 flex items-center justify-center pointer-events-none opacity-5">
        <Sparkles size={200} className="text-white animate-pulse" strokeWidth={0.1} />
      </div>

      {/* Control Dock Area */}
      <div className="z-20 p-6 flex flex-col items-center gap-4 w-full">
        <AnimatePresence>
          {showInfo && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="bg-white/10 backdrop-blur-xl px-8 py-3 rounded-full border border-white/10 text-white text-sm flex items-center gap-4 shadow-2xl">
               <span className="font-black text-white">{showInfo.name}</span>
               <span className="font-mono text-indigo-300 bg-indigo-500/20 px-2 py-0.5 rounded text-xs">{formatFormula(showInfo.formula)}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="w-full max-w-6xl flex items-center gap-4 bg-white/5 backdrop-blur-2xl border border-white/10 p-4 rounded-[2.5rem] shadow-2xl">
          <div className="hidden lg:flex flex-col items-start text-white/30 text-[9px] font-black uppercase tracking-[0.1em] leading-none ml-2">
            <span>Select</span>
            <span className="mt-1">Compound</span>
          </div>

          <div className="flex-1 flex flex-wrap items-center gap-2 justify-center">
            {CHEMICALS.map(chem => {
              const isActive = activeChemicalIds.includes(chem.id);
              return (
                <button
                  key={chem.id}
                  id={`chem-btn-${chem.id}`}
                  onMouseEnter={() => setShowInfo(chem)}
                  onMouseLeave={() => setShowInfo(null)}
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const containerRect = containerRef.current.getBoundingClientRect();
                    launchFirework(chem, rect.left - containerRect.left + rect.width / 2, rect.top - containerRect.top);
                    toggleChemical(chem.id);
                  }}
                  className={`relative flex flex-col items-center justify-center w-14 h-14 rounded-xl border-2 transition-all active:scale-90 ${isActive ? 'bg-white text-slate-900 border-white shadow-[0_0_20px_rgba(255,255,255,0.4)] scale-110 z-10' : 'bg-white/5 text-white/40 border-white/10 hover:bg-white/10 hover:border-white/30'}`}
                >
                  <div className="absolute top-1 right-1 w-1 h-1 rounded-full" style={{ backgroundColor: chem.color, boxShadow: isActive ? `0 0 8px ${chem.color}` : 'none' }} />
                  <span className="text-[10px] font-mono font-black leading-tight tracking-tighter">{formatFormula(chem.formula)}</span>
                </button>
              );
            })}
          </div>

          <button onClick={() => setShowExplanation(true)} className="w-10 h-10 rounded-xl bg-white/10 border border-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-all mr-2">
            <span className="text-lg font-black">?</span>
          </button>
        </div>
      </div>

      {/* Explanation Modal */}
      <AnimatePresence>
        {showExplanation && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white p-10 rounded-[3rem] shadow-2xl max-w-2xl w-full space-y-6 relative">
              <button onClick={() => setShowExplanation(false)} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-800 transition-colors">
                <Trash2 size={24} />
              </button>
              <div className="flex items-center gap-4 text-indigo-600">
                <Beaker size={32} />
                <h2 className="text-3xl font-black tracking-tight">How do they get their colors?</h2>
              </div>
              <div className="space-y-4 text-slate-600 leading-relaxed">
                <p>The colors produced by different chemical elements in a flame are due to a process called <strong>Atomic Emission</strong>.</p>
                <p>When atoms are heated, their electrons absorb energy and jump to higher, unstable energy levels. As they cool down and return to their original "ground" state, they release this energy as <strong>photons of light</strong>.</p>
                <p>Because each element has a unique arrangement of electrons and specific energy levels, they emit specific wavelengths (colors) of light. This is so consistent that scientists use these "flame tests" as a <strong>chemical fingerprint</strong> to identify unknown substances.</p>
              </div>
              <div className="flex gap-4 pt-4">
                <div className="flex-1 p-4 bg-slate-50 rounded-2xl">
                   <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Physics</p>
                   <p className="text-sm font-bold text-slate-700">Photon Energy = Color</p>
                </div>
                <div className="flex-1 p-4 bg-slate-50 rounded-2xl">
                   <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Chemistry</p>
                   <p className="text-sm font-bold text-slate-700">Metal Cation Identification</p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      </div>
    </div>
  );
};
