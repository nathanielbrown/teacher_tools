import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Droplets, Thermometer, RotateCcw, Play, Pause, 
  Settings2, Info, ChevronRight, TrendingUp, FlaskConical,
  Wind, Zap, Waves, Palette
} from 'lucide-react';

// Constants
const BEAKER_WIDTH = 300;
const BEAKER_HEIGHT = 400;
const PARTICLE_COUNT = 300;
const INK_COLORS = [
  { id: 'blue', name: 'Royal Blue', color: '#3b82f6', glow: 'rgba(59, 130, 246, 0.5)' },
  { id: 'red', name: 'Ruby Red', color: '#ef4444', glow: 'rgba(239, 68, 68, 0.5)' },
  { id: 'purple', name: 'Deep Purple', color: '#8b5cf6', glow: 'rgba(139, 92, 246, 0.5)' },
  { id: 'green', name: 'Emerald', color: '#10b981', glow: 'rgba(16, 185, 129, 0.5)' },
];

const Beaker = React.forwardRef(({ temperature, isPlaying }, ref) => {
  const canvasRef = useRef(null);
  const particles = useRef([]);
  const animationRef = useRef(null);

  React.useImperativeHandle(ref, () => ({
    addDrop: (x, y, color) => {
      const newParticles = [];
      for (let i = 0; i < 150; i++) { // Reduced count per drop since we can have many
        newParticles.push({
          x: x + (Math.random() - 0.5) * 10,
          y: y + (Math.random() - 0.5) * 10,
          vx: (Math.random() - 0.5) * 0.2,
          vy: Math.random() * 0.5 + 0.2,
          size: Math.random() * 3 + 1,
          opacity: Math.random() * 0.5 + 0.5,
          color: color
        });
      }
      particles.current = [...particles.current, ...newParticles].slice(-2000); // Limit total particles
    },
    reset: () => {
      particles.current = [];
    }
  }));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    const update = () => {
      if (isPlaying && particles.current.length > 0) {
        const tempFactor = (temperature + 50) / 100; 
        const diffusionRate = 1.2 * tempFactor;
        const randomForce = 0.8 * tempFactor;

        particles.current.forEach(p => {
          p.vx += (Math.random() - 0.5) * randomForce;
          p.vy += (Math.random() - 0.5) * randomForce;
          p.vy += 0.01;
          p.vx *= 0.95;
          p.vy *= 0.95;
          p.x += p.vx * diffusionRate;
          p.y += p.vy * diffusionRate;

          const margin = 5;
          if (p.x < margin) { p.x = margin; p.vx *= -0.3; }
          if (p.x > BEAKER_WIDTH - margin) { p.x = BEAKER_WIDTH - margin; p.vx *= -0.3; }
          if (p.y < 80) { p.y = 80; p.vy *= -0.3; }
          if (p.y > BEAKER_HEIGHT - margin) { p.y = BEAKER_HEIGHT - margin; p.vy *= -0.3; }
        });
      }
      draw();
      animationRef.current = requestAnimationFrame(update);
    };

    const draw = () => {
      ctx.clearRect(0, 0, BEAKER_WIDTH, BEAKER_HEIGHT);
      
      const tintOpacity = Math.min(0.05, temperature / 1000);
      ctx.fillStyle = temperature > 30 ? `rgba(239, 68, 68, ${tintOpacity})` : `rgba(59, 130, 246, ${Math.min(0.05, (30 - temperature) / 1000)})`;
      ctx.fillRect(0, 80, BEAKER_WIDTH, BEAKER_HEIGHT - 80);

      particles.current.forEach(p => {
        ctx.beginPath();
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 4);
        grad.addColorStop(0, p.color);
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.globalAlpha = p.opacity;
        ctx.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1.0;
    };

    animationRef.current = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animationRef.current);
  }, [temperature, isPlaying]);

  return (
    <div className="relative flex flex-col items-center">
      <div className="absolute -left-12 top-20 flex flex-col items-center gap-2 z-30">
        <div className="w-4 h-48 bg-slate-200 rounded-full border-2 border-slate-300 relative overflow-hidden shadow-inner">
          <motion.div 
            initial={{ height: 0 }}
            animate={{ height: `${temperature}%` }}
            className={`absolute bottom-0 left-0 right-0 rounded-full transition-colors duration-500 shadow-[0_0_10px_rgba(0,0,0,0.1)] ${
              temperature > 50 ? 'bg-red-500' : temperature > 20 ? 'bg-orange-400' : 'bg-blue-400'
            }`}
          />
        </div>
        <div className="bg-white px-2 py-1 rounded-lg shadow-lg border border-slate-100 flex items-center gap-1">
          <Thermometer size={10} className="text-slate-400" />
          <span className="text-[10px] font-black text-slate-600">{temperature}°C</span>
        </div>
      </div>

      <div className="relative w-[300px] h-[400px] bg-white/30 backdrop-blur-md rounded-b-[3rem] border-x-4 border-b-4 border-white/50 shadow-[0_20px_50px_rgba(0,0,0,0.1)] overflow-hidden group">
        <div className="absolute top-0 left-0 right-0 h-4 bg-white/80 border-b border-white/20 z-20" />
        
        <div className="absolute left-6 top-20 bottom-10 w-4 flex flex-col justify-between items-start opacity-20 z-10">
          {[500, 400, 300, 200, 100].map(m => (
            <div key={m} className="flex items-center gap-2">
              <div className="w-6 h-[1px] bg-slate-800" />
              <span className="text-[10px] font-black text-slate-800">{m}</span>
            </div>
          ))}
        </div>

        <motion.div 
          animate={{ 
            y: [0, -1, 0],
            opacity: [0.3, 0.4, 0.3]
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[78px] left-0 right-0 h-1 bg-white/40 blur-[1px] z-20"
        />

        <canvas 
          ref={canvasRef} 
          width={BEAKER_WIDTH} 
          height={BEAKER_HEIGHT} 
          className="relative z-10"
        />

        <div className="absolute top-0 left-10 bottom-0 w-12 bg-gradient-to-r from-white/20 to-transparent pointer-events-none" />
        <div className="absolute top-0 right-10 bottom-0 w-4 bg-gradient-to-l from-white/10 to-transparent pointer-events-none" />
      </div>

      <div className="mt-6 text-center">
        <h4 className="text-xl font-black text-slate-800 uppercase tracking-tight">
          {temperature > 60 ? 'Hot Water' : temperature < 20 ? 'Cold Water' : 'Warm Water'}
        </h4>
        <div className="flex items-center gap-2 justify-center mt-2 px-4 py-1.5 bg-slate-100 rounded-full">
          <TrendingUp size={14} className={temperature > 50 ? 'text-red-500 animate-pulse' : 'text-blue-500'} />
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
            {temperature > 50 ? 'High Kinetic Energy' : 'Low Kinetic Energy'}
          </span>
        </div>
      </div>
    </div>
  );
});

export const InkDiffusion = () => {
  const [tempA, setTempA] = useState(5);
  const [tempB, setTempB] = useState(80);
  const [selectedInk, setSelectedInk] = useState(INK_COLORS[0]);
  const [isPlaying, setIsPlaying] = useState(true);
  const beakerARef = useRef();
  const beakerBRef = useRef();

  const handleBeakerClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // We want the X coordinate relative to ONE beaker, but since beakers are centered in their respective containers,
    // we need to find the X relative to the center of each beaker.
    // The container is the group area.
    
    // Actually, it's easier to just calculate relative to the beaker that was clicked if possible, 
    // but the request says "move over the beakers a drop appear at the same place on both sides".
    // So if I click in Beaker A at (10, 10), Beaker B also gets a drop at (10, 10).
    
    // Let's find which beaker was clicked or just use the target.
    // Better: listen on the whole lab area and map coordinates.
    
    const beakers = document.querySelectorAll('.beaker-container');
    beakers.forEach((beaker, idx) => {
      const bRect = beaker.getBoundingClientRect();
      if (e.clientX >= bRect.left && e.clientX <= bRect.right) {
        const relX = e.clientX - bRect.left;
        const relY = Math.max(85, e.clientY - bRect.top); // Ensure it's in the water
        
        if (relY < 400) {
          beakerARef.current?.addDrop(relX, relY, selectedInk.color);
          beakerBRef.current?.addDrop(relX, relY, selectedInk.color);
        }
      }
    });
  };

  const resetLab = () => {
    beakerARef.current?.reset();
    beakerBRef.current?.reset();
    setIsPlaying(true);
  };

  return (
    <div className="max-w-[1400px] mx-auto min-h-0 h-full flex flex-col gap-4 px-6 py-6 select-none overflow-y-auto lg:overflow-hidden">
      {/* Header */}
      <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-6 shrink-0">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-indigo-50 rounded-2xl text-indigo-600">
            <Droplets size={40} />
          </div>
          <div>
            <h2 className="text-4xl font-black text-slate-800 tracking-tight">Ink Diffusion</h2>
            <p className="text-slate-400 font-medium italic">Explore kinetic energy through simultaneous multi-color drops.</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="bg-indigo-50 px-6 py-3 rounded-2xl border border-indigo-100 flex items-center gap-3">
            <Droplets size={20} className="text-indigo-600 animate-bounce" />
            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Click water to add drops</span>
          </div>
          
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`p-4 rounded-2xl transition-all active:scale-95 shadow-md ${
              isPlaying ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-emerald-500 text-white shadow-emerald-200 hover:bg-emerald-600'
            }`}
          >
            {isPlaying ? <Pause size={24} /> : <Play size={24} />}
          </button>

          <button
            onClick={resetLab}
            className="p-4 bg-slate-50 text-slate-400 rounded-2xl hover:bg-red-50 hover:text-red-600 transition-all active:scale-95 shadow-md"
          >
            <RotateCcw size={24} />
          </button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 min-h-0">
        {/* Lab Area */}
        <div className="lg:col-span-9 flex flex-col gap-6">
          <div 
            className="flex-1 bg-white rounded-[3rem] shadow-2xl border-8 border-white overflow-hidden relative shadow-indigo-900/5 flex items-center justify-center gap-32 p-12 group cursor-crosshair"
            onClick={handleBeakerClick}
          >
            {/* Background Grid */}
            <div className="absolute inset-0 bg-[#f8fafc] opacity-50 transition-opacity group-hover:opacity-70" style={{ backgroundImage: 'radial-gradient(#e2e8f0 1.5px, transparent 1.5px)', backgroundSize: '40px 40px' }} />
            
            {/* Beakers */}
            <div className="beaker-container">
              <Beaker 
                ref={beakerARef}
                temperature={tempA} 
                isPlaying={isPlaying} 
              />
            </div>
            <div className="beaker-container">
              <Beaker 
                ref={beakerBRef}
                temperature={tempB} 
                isPlaying={isPlaying} 
              />
            </div>
          </div>

          {/* Liquid Palette */}
          <div className="bg-white rounded-[2.5rem] p-6 shadow-xl border border-gray-100 flex items-center justify-between gap-8">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-50 rounded-xl text-indigo-500">
                <Palette size={20} />
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Ink Type</h4>
                <p className="text-sm font-black text-slate-700">{selectedInk.name}</p>
              </div>
            </div>
            
            <div className="flex gap-4">
              {INK_COLORS.map(ink => (
                <button
                  key={ink.id}
                  onClick={() => setSelectedInk(ink)}
                  className={`w-12 h-12 rounded-2xl transition-all shadow-lg ${
                    selectedInk.id === ink.id ? 'scale-110 ring-4 ring-slate-100' : 'hover:scale-105 opacity-60 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: ink.color }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Controls Sidebar */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-gray-100 space-y-8">
            <h3 className="text-xl font-black text-slate-800 flex items-center gap-3">
              <Settings2 className="text-indigo-600" />
              Environment
            </h3>
            
            <div className="space-y-8">
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Beaker A</span>
                  <span className="text-2xl font-black text-blue-500 tabular-nums">{tempA}°C</span>
                </div>
                <input 
                  type="range" min="0" max="100" value={tempA}
                  onChange={(e) => setTempA(parseInt(e.target.value))}
                  className="w-full h-3 bg-slate-100 rounded-xl appearance-none cursor-pointer accent-blue-500"
                />
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Beaker B</span>
                  <span className="text-2xl font-black text-red-500 tabular-nums">{tempB}°C</span>
                </div>
                <input 
                  type="range" min="0" max="100" value={tempB}
                  onChange={(e) => setTempB(parseInt(e.target.value))}
                  className="w-full h-3 bg-slate-100 rounded-xl appearance-none cursor-pointer accent-red-500"
                />
              </div>
            </div>
          </div>

          <div className="bg-indigo-950 rounded-[2.5rem] p-8 shadow-xl border border-indigo-900 flex-1 flex flex-col gap-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 -translate-y-4 translate-x-4 opacity-5 group-hover:scale-110 transition-transform">
               <Waves size={200} className="text-white" />
            </div>
            
            <div className="relative z-10 space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                  <Info className="text-indigo-300" size={20} />
                </div>
                <h3 className="text-white text-xl font-black tracking-tight">How it Works</h3>
              </div>
              
              <p className="text-indigo-100/60 text-sm font-medium leading-relaxed">
                Diffusion is the net movement of particles from an area of higher concentration to lower concentration.
              </p>
              
              <div className="space-y-4">
                <div className="bg-white/5 rounded-[1.5rem] p-5 border border-white/10 hover:bg-white/10 transition-colors">
                  <h4 className="text-white font-black text-xs uppercase tracking-widest mb-2 flex items-center gap-2">
                    <Zap size={14} className="text-orange-400" />
                    Kinetic Energy
                  </h4>
                  <p className="text-[11px] text-indigo-100/70 leading-relaxed text-balance">
                    Heat is essentially the kinetic energy of particles. In hot water, particles move at higher velocities and collide more frequently.
                  </p>
                </div>

                <div className="bg-white/5 rounded-[1.5rem] p-5 border border-white/10 hover:bg-white/10 transition-colors">
                  <h4 className="text-white font-black text-xs uppercase tracking-widest mb-2 flex items-center gap-2">
                    <Waves size={14} className="text-blue-400" />
                    Brownian Motion
                  </h4>
                  <p className="text-[11px] text-indigo-100/70 leading-relaxed text-balance">
                    Ink particles are pushed in random directions by water molecules. This "random walk" causes the ink to spread over time.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
