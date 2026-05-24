import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Thermometer, 
  RotateCcw, 
  Info, 
  Activity, 
  X, 
  TrendingUp, 
  Hand,
  BrainCircuit,
  Volume2,
  MousePointer2,
  Zap,
  Flame,
  Snowflake
} from 'lucide-react';
import { useHeader } from '../../contexts/HeaderContext';
import { useSettings } from '../../contexts/SettingsContext';
import { audioEngine } from '../../utils/audio';

// 1. Constants
const PARTICLE_SPACING = 24;

// 2. Config (None)

// 3. Text (Help and Info)
const HELP_INFO = (
  <div className="space-y-4 font-['Outfit']">
    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">How Heat Moves</h3>
    <div className="space-y-3">
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-primary/5 flex items-center justify-center text-xs font-black text-primary shrink-0">1</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">Drag the <b>Blue and Red blocks</b> to move them around.</p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center text-xs font-black text-blue-600 shrink-0">2</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">Touch the blocks together to see <b>Heat Flow</b> from hot to cold.</p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-success-bg flex items-center justify-center text-xs font-black text-success shrink-0">3</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">Watch the particles <b>wiggle</b> faster when they are hot!</p>
      </div>
    </div>
  </div>
);

// 4. Local Storage (None)

// 5. Classes (None)

// 6. Functions
const createParticles = (energy: number, rows: number, cols: number) => {
  const particles = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      particles.push({ 
        r, c, energy,
        x: 0, y: 0, 
        vx: 0, vy: 0 
      });
    }
  }
  return particles;
};

const getColor = (energy: number) => {
  const r = Math.min(255, Math.floor((energy / 100) * 255));
  const b = Math.min(255, Math.floor((1 - energy / 100) * 255));
  const g = 80;
  return `rgb(${r}, ${g}, ${b})`;
};

const getAvgEnergy = (block: any) => {
  if (!block.particles.length) return 0;
  return block.particles.reduce((acc: number, p: any) => acc + p.energy, 0) / block.particles.length;
};

// 7. Component
export const ThermalConduction = () => {
  const { setHelpContent, setOnReset, clearHeader } = useHeader();
  const { settings } = useSettings();
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [blocks, setBlocks] = useState([
    { id: 1, label: 'Hot', rows: 7, cols: 7, x: 100, y: 150, particles: createParticles(100, 7, 7), color: '#ef4444' },
    { id: 2, label: 'Cold', rows: 7, cols: 7, x: 450, y: 150, particles: createParticles(5, 7, 7), color: '#3b82f6' },
  ]);
  
  const blocksRef = useRef(blocks);
  const dragOffset = useRef({ x: 0, y: 0 });
  const draggedBlockId = useRef<number | null>(null);
  const requestRef = useRef<number>(0);
  const animateRef = useRef<() => void>(() => {});

  const resetExperiment = useCallback(() => {
    const initial = [
      { id: 1, label: 'Hot', rows: 7, cols: 7, x: 100, y: 150, particles: createParticles(100, 7, 7), color: '#ef4444' },
      { id: 2, label: 'Cold', rows: 7, cols: 7, x: 450, y: 150, particles: createParticles(5, 7, 7), color: '#3b82f6' },
    ];
    blocksRef.current = initial;
    setBlocks(initial);
    audioEngine.playTick(settings.soundTheme);
  }, [settings.soundTheme]);

  useEffect(() => {
    setOnReset(() => resetExperiment);
    setHelpContent(HELP_INFO);
    return () => clearHeader();
  }, [clearHeader, setOnReset, resetExperiment, setHelpContent]);

  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const currentBlocks = blocksRef.current;
    const k_spring = 0.2; 
    const damp = 0.85; 

    // Heat Transfer Logic
    for (let i = 0; i < currentBlocks.length; i++) {
      for (let j = i + 1; j < currentBlocks.length; j++) {
        const b1 = currentBlocks[i];
        const b2 = currentBlocks[j];

        const b1w = b1.cols * PARTICLE_SPACING;
        const b1h = b1.rows * PARTICLE_SPACING;
        const b2w = b2.cols * PARTICLE_SPACING;
        const b2h = b2.rows * PARTICLE_SPACING;

        if (Math.abs(b1.x + b1w/2 - (b2.x + b2w/2)) < (b1w + b2w)/2 + 5 && 
            Math.abs(b1.y + b1h/2 - (b2.y + b2h/2)) < (b1h + b2h)/2 + 5) {
          b1.particles.forEach(p1 => {
            const p1x = b1.x + p1.c * PARTICLE_SPACING;
            const p1y = b1.y + p1.r * PARTICLE_SPACING;
            b2.particles.forEach(p2 => {
              const p2x = b2.x + p2.c * PARTICLE_SPACING;
              const p2y = b2.y + p2.r * PARTICLE_SPACING;
              const dx = p1x - p2x;
              const dy = p1y - p2y;
              if (dx*dx + dy*dy < PARTICLE_SPACING * PARTICLE_SPACING * 2) {
                const transfer = (p1.energy - p2.energy) * 0.008;
                p1.energy -= transfer;
                p2.energy += transfer;
              }
            });
          });
        }
      }
    }

    // Render & Physics Update
    currentBlocks.forEach(block => {
      const { x, y, label, particles } = block;
      particles.forEach(p => {
        const energy = p.energy;
        const color = getColor(energy);
        
        // Hooke's Law Physics
        const ax = -k_spring * p.x;
        const ay = -k_spring * p.y;
        
        const wiggleIntensity = (energy / 100) * 3;
        p.vx += ax + (Math.random() - 0.5) * wiggleIntensity;
        p.vy += ay + (Math.random() - 0.5) * wiggleIntensity;
        
        p.vx *= damp;
        p.vy *= damp;
        
        p.x += p.vx;
        p.y += p.vy;

        const px = x + p.c * PARTICLE_SPACING + PARTICLE_SPACING/2 + p.x;
        const py = y + p.r * PARTICLE_SPACING + PARTICLE_SPACING/2 + p.y;

        ctx.beginPath();
        ctx.arc(px, py, 8, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.shadowBlur = energy / 4;
        ctx.shadowColor = color;
        ctx.fill();
        ctx.shadowBlur = 0;
        
        // Highlight
        ctx.beginPath();
        ctx.arc(px - 2, py - 2, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.fill();
      });

      ctx.font = '900 18px Outfit';
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.fillText(label, x + (block.cols * PARTICLE_SPACING)/2, y + (block.rows * PARTICLE_SPACING)/2 + 6);
    });

    requestRef.current = requestAnimationFrame(() => animateRef.current());
  }, []);

  useEffect(() => {
    animateRef.current = animate;
  }, [animate]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const handleResize = () => {
      if (canvas.parentElement) {
        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = canvas.parentElement.clientHeight;
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    requestRef.current = requestAnimationFrame(() => animateRef.current());
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    const hit = [...blocksRef.current].reverse().find(b => {
      const w = b.cols * PARTICLE_SPACING;
      const h = b.rows * PARTICLE_SPACING;
      return mx >= b.x && mx <= b.x + w && my >= b.y && my <= b.y + h;
    });

    if (hit) {
      draggedBlockId.current = hit.id;
      dragOffset.current = { x: mx - hit.x, y: my - hit.y };
      audioEngine.playTick(settings.soundTheme);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggedBlockId.current === null || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    blocksRef.current = blocksRef.current.map(b => 
      b.id === draggedBlockId.current ? { ...b, x: mx - dragOffset.current.x, y: my - dragOffset.current.y } : b
    );
    setBlocks([...blocksRef.current]);
  };

  const handleMouseUp = () => {
    draggedBlockId.current = null;
  };

  return (
    <div className="tool-container flex flex-col lg:flex-row gap-8 h-full font-['Outfit'] select-none relative bg-surface rounded-[4rem] p-4 lg:p-12 italic  overflow-hidden">
      <div className="flex-1 bg-dark-bg rounded-[4rem] border-[8px] border-dark-border  flex flex-col items-center justify-center relative overflow-hidden group cursor-grab active:cursor-grabbing">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.05)_0%,transparent_70%)]" />
        <canvas 
          ref={canvasRef} 
          className="absolute inset-0 w-full h-full z-10"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />
      </div>

      <div className="w-full lg:w-80 shrink-0 flex flex-col gap-6 relative z-20 italic">
        <div className="bg-dark-bg p-10 rounded-[3rem]  flex flex-col items-center gap-6 border-4 border-dark-border">
           <span className="text-[10px] font-black text-primary/70 uppercase tracking-[0.4em]">Heat Monitor</span>
           <div className="flex items-baseline gap-2">
              <span className="text-6xl font-black text-white italic tabular-nums">
                 {Math.round(blocks.reduce((acc, b) => acc + getAvgEnergy(b), 0) / blocks.length)}
              </span>
              <span className="text-xl font-black text-slate-600">°C</span>
           </div>
        </div>

        <div className="flex-1 bg-slate-50 p-6 rounded-[3rem] border-4 border-white  flex flex-col gap-4 overflow-y-auto no-scrollbar">
           {blocks.map((block) => {
             const avg = getAvgEnergy(block);
             return (
               <div key={block.id} className="p-6 bg-surface rounded-[2rem] border-2 border-slate-50  space-y-4">
                 <div className="flex justify-between items-center px-2">
                    <span className="text-[9px] font-black text-neutral-400 uppercase tracking-widest">{block.label} Unit</span>
                    <span className="text-2xl font-black text-slate-800 italic">{Math.round(avg)}°C</span>
                 </div>
                 <div className="h-3 bg-slate-100 rounded-full overflow-hidden ">
                    <motion.div 
                      className="h-full rounded-full "
                      animate={{ width: `${avg}%`, backgroundColor: getColor(avg) }}
                    />
                 </div>
               </div>
             );
           })}
        </div>
      </div>
    </div>
  );
};

export default ThermalConduction;
