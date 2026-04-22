import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Thermometer, Zap, RotateCcw, Info, Hand, Play, Maximize2, TrendingUp } from 'lucide-react';
import { LineChart } from 'chartist';
import 'chartist/dist/index.css';

const PARTICLE_SPACING = 20;

export const ThermalConduction = () => {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  const createParticles = (energy, rows, cols) => {
    const particles = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        particles.push({ r, c, energy });
      }
    }
    return particles;
  };

  const [blocks, setBlocks] = useState([
    { id: 1, label: 'A', rows: 10, cols: 10, x: 100, y: 100, particles: createParticles(100, 10, 10), isDragging: false, color: '#ef4444' },
    { id: 2, label: 'B', rows: 20, cols: 5, x: 450, y: 100, particles: createParticles(10, 20, 5), isDragging: false, color: '#3b82f6' },
    { id: 3, label: 'C', rows: 5, cols: 20, x: 100, y: 550, particles: createParticles(10, 5, 20), isDragging: false, color: '#10b981' },
  ]);
  const [history, setHistory] = useState([]);
  
  const blocksRef = useRef(blocks);
  const dragOffset = useRef({ x: 0, y: 0 });
  const draggedBlockId = useRef(null);
  const requestRef = useRef();

  const getAvgEnergy = (block) => {
    if (!block.particles.length) return 0;
    return block.particles.reduce((acc, p) => acc + p.energy, 0) / block.particles.length;
  };

  // Update state for UI and history
  useEffect(() => {
    const timer = setInterval(() => {
      setBlocks([...blocksRef.current]);
    }, 50);

    const historyTimer = setInterval(() => {
      setHistory(prev => {
        if (blocksRef.current.length < 3) return prev;
        const entry = {
          time: prev.length,
          A: getAvgEnergy(blocksRef.current[0]),
          B: getAvgEnergy(blocksRef.current[1]),
          C: getAvgEnergy(blocksRef.current[2]),
        };
        return [...prev, entry].slice(-50);
      });
    }, 500);

    return () => {
      clearInterval(timer);
      clearInterval(historyTimer);
    };
  }, []);

  // Update Chart
  useEffect(() => {
    if (history.length > 1 && chartRef.current) {
      const data = {
        labels: history.map(h => h.time),
        series: [
          history.map(h => h.A),
          history.map(h => h.B),
          history.map(h => h.C),
        ]
      };

      const options = {
        showPoint: false,
        lineSmooth: true,
        axisX: { showGrid: false, showLabel: false },
        axisY: { low: 0, high: 100, showGrid: true },
        fullWidth: true,
        chartPadding: { right: 10, left: 0, top: 0, bottom: 0 }
      };

      if (!chartInstance.current) {
        chartInstance.current = new LineChart(chartRef.current, data, options);
      } else {
        chartInstance.current.update(data);
      }
    }
  }, [history]);

  // Color interpolation
  const getColor = (energy) => {
    const r = Math.min(255, Math.floor((energy / 100) * 255));
    const b = Math.min(255, Math.floor((1 - energy / 100) * 255));
    const g = 50;
    return `rgb(${r}, ${g}, ${b})`;
  };

  const animate = (time) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const currentBlocks = blocksRef.current;

    // 1. Heat Transfer Logic (Internal Conduction)
    currentBlocks.forEach(block => {
      for (let i = 0; i < block.particles.length; i++) {
        for (let j = i + 1; j < block.particles.length; j++) {
          const p1 = block.particles[i];
          const p2 = block.particles[j];
          const dist = Math.abs(p1.r - p2.r) + Math.abs(p1.c - p2.c);
          if (dist === 1) { // Adjacency
            const transfer = (p1.energy - p2.energy) * 0.05;
            p1.energy -= transfer;
            p2.energy += transfer;
          }
        }
      }
    });

    // 2. Heat Transfer Logic (External Conduction between blocks)
    for (let i = 0; i < currentBlocks.length; i++) {
      for (let j = i + 1; j < currentBlocks.length; j++) {
        const b1 = currentBlocks[i];
        const b2 = currentBlocks[j];

        const b1w = b1.cols * PARTICLE_SPACING;
        const b1h = b1.rows * PARTICLE_SPACING;
        const b2w = b2.cols * PARTICLE_SPACING;
        const b2h = b2.rows * PARTICLE_SPACING;

        // Check for rough collision
        if (Math.abs(b1.x + b1w/2 - (b2.x + b2w/2)) < (b1w + b2w)/2 + 20 && 
            Math.abs(b1.y + b1h/2 - (b2.y + b2h/2)) < (b1h + b2h)/2 + 20) {
          b1.particles.forEach(p1 => {
            const p1x = b1.x + p1.c * PARTICLE_SPACING;
            const p1y = b1.y + p1.r * PARTICLE_SPACING;
            
            b2.particles.forEach(p2 => {
              const p2x = b2.x + p2.c * PARTICLE_SPACING;
              const p2y = b2.y + p2.r * PARTICLE_SPACING;

              const dx = p1x - p2x;
              const dy = p1y - p2y;
              if (dx*dx + dy*dy < PARTICLE_SPACING * PARTICLE_SPACING * 1.5) {
                const transfer = (p1.energy - p2.energy) * 0.01;
                p1.energy -= transfer;
                p2.energy += transfer;
              }
            });
          });
        }
      }
    }

    // 3. Render Blocks
    currentBlocks.forEach(block => {
      const { x, y, label, particles, rows, cols } = block;
      const w = cols * PARTICLE_SPACING;
      const h = rows * PARTICLE_SPACING;
      
      // Draw Particles
      particles.forEach(p => {
        const energy = p.energy;
        const color = getColor(energy);
        const vibrationAmp = (energy / 100) * 4;
        const vibrationSpeed = 0.01 * energy;

        const px = x + p.c * PARTICLE_SPACING + PARTICLE_SPACING/2;
        const py = y + p.r * PARTICLE_SPACING + PARTICLE_SPACING/2;

        const ox = Math.sin(time * vibrationSpeed + p.r + p.c) * vibrationAmp;
        const oy = Math.cos(time * vibrationSpeed * 0.9 + p.r * p.c) * vibrationAmp;

        ctx.beginPath();
        ctx.arc(px + ox, py + oy, 6, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(px + ox - 2, py + oy - 2, 2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.fill();
      });

      // Draw Rough Outline
      ctx.strokeStyle = 'rgba(255,255,255,0.4)';
      ctx.lineWidth = 2;
      ctx.lineJoin = 'round';
      
      const jitter = () => (Math.random() - 0.5) * 3;
      ctx.beginPath();
      ctx.moveTo(x + jitter(), y + jitter());
      ctx.lineTo(x + w + jitter(), y + jitter());
      ctx.lineTo(x + w + jitter(), y + h + jitter());
      ctx.lineTo(x + jitter(), y + h + jitter());
      ctx.closePath();
      ctx.stroke();

      // Second layer of jitter for "roughness"
      ctx.beginPath();
      ctx.moveTo(x + jitter(), y + jitter());
      ctx.lineTo(x + w + jitter(), y + jitter());
      ctx.lineTo(x + w + jitter(), y + h + jitter());
      ctx.lineTo(x + jitter(), y + h + jitter());
      ctx.closePath();
      ctx.stroke();

      // Label
      ctx.font = '900 24px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.fillText(label, x + w/2, y + h/2 + 8);

      if (block.isDragging) {
        ctx.strokeStyle = 'rgba(255,255,255,0.8)';
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(x - 5, y - 5, w + 10, h + 10);
        ctx.setLineDash([]);
      }
    });

    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const handleResize = () => {
      canvas.width = canvas.parentElement.clientWidth;
      canvas.height = canvas.parentElement.clientHeight;
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    
    requestRef.current = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(requestRef.current);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleMouseDown = (e) => {
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
      const newBlocks = blocksRef.current.map(b => 
        b.id === hit.id ? { ...b, isDragging: true } : b
      );
      blocksRef.current = newBlocks;
      setBlocks(newBlocks);
    }
  };

  const handleMouseMove = (e) => {
    if (draggedBlockId.current === null) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    const newBlocks = blocksRef.current.map(b => {
      if (b.id === draggedBlockId.current) {
        return { 
          ...b, 
          x: mx - dragOffset.current.x, 
          y: my - dragOffset.current.y 
        };
      }
      return b;
    });
    blocksRef.current = newBlocks;
    setBlocks(newBlocks);
  };

  const handleMouseUp = () => {
    if (draggedBlockId.current === null) return;
    const newBlocks = blocksRef.current.map(b => ({ ...b, isDragging: false }));
    blocksRef.current = newBlocks;
    setBlocks(newBlocks);
    draggedBlockId.current = null;
  };

  const reset = () => {
    const initial = [
      { id: 1, label: 'A', rows: 10, cols: 10, x: 100, y: 100, particles: createParticles(100, 10, 10), isDragging: false, color: '#ef4444' },
      { id: 2, label: 'B', rows: 20, cols: 5, x: 450, y: 100, particles: createParticles(10, 20, 5), isDragging: false, color: '#3b82f6' },
      { id: 3, label: 'C', rows: 5, cols: 20, x: 100, y: 550, particles: createParticles(10, 5, 20), isDragging: false, color: '#10b981' },
    ];
    blocksRef.current = initial;
    setBlocks(initial);
  };

  return (
    <div className="max-w-7xl mx-auto h-full flex flex-col gap-6 px-4 py-8 select-none">
      <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-6 shrink-0">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-orange-50 rounded-2xl text-orange-600">
            <Thermometer size={40} />
          </div>
          <div>
            <h2 className="text-4xl font-black text-slate-800 tracking-tight italic">Thermal Conduction</h2>
            <p className="text-slate-400 font-medium italic">Watch heat flow through vibrating particles.</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="bg-slate-50 px-6 py-3 rounded-2xl border border-slate-100 flex items-center gap-6">
             <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Hot</span>
             </div>
             <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Cold</span>
             </div>
          </div>
          <button
            onClick={reset}
            className="p-4 bg-red-50 text-red-600 rounded-2xl hover:bg-red-100 transition-colors shadow-lg shadow-red-100 active:scale-95"
          >
            <RotateCcw size={24} />
          </button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 min-h-0">
        <div 
          className="lg:col-span-8 bg-slate-900 rounded-[3rem] shadow-2xl relative overflow-hidden border-8 border-white cursor-grab active:cursor-grabbing"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <canvas ref={canvasRef} className="w-full h-full" />
          
          <div className="absolute top-8 left-8 p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 pointer-events-none">
            <div className="flex items-center gap-3 text-white">
              <Hand size={18} className="text-orange-400" />
              <span className="text-xs font-black uppercase tracking-widest">Drag blocks to connect them</span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-gray-100">
            <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-3">
              <Zap className="text-orange-500" />
              Heat Levels
            </h3>
            <div className="space-y-6">
              {blocks.map((block) => (
                <div key={block.id} className="space-y-2">
                  <div className="flex justify-between items-end">
                    <span className="text-sm font-black text-slate-400 uppercase tracking-widest">Block {block.label}</span>
                    <span className="text-lg font-black text-slate-800 italic">{Math.round(getAvgEnergy(block))}°C</span>
                  </div>
                  <div className="h-4 bg-slate-100 rounded-full overflow-hidden p-1">
                    <motion.div 
                      className="h-full rounded-full shadow-inner"
                      initial={false}
                      animate={{ 
                        width: `${getAvgEnergy(block)}%`,
                        backgroundColor: getColor(getAvgEnergy(block))
                      }}
                      transition={{ type: 'spring', bounce: 0, duration: 0.1 }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-gray-100">
            <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-3">
              <TrendingUp className="text-orange-500" />
              Temperature Trends
            </h3>
            <div className="h-48 w-full bg-slate-50 rounded-2xl border border-slate-100 p-4 relative overflow-hidden">
               {history.length > 1 ? (
                 <div ref={chartRef} className="ct-chart h-full w-full custom-thermal-chart" />
               ) : (
                 <div className="h-full flex items-center justify-center text-slate-300 text-xs font-bold uppercase tracking-widest italic">
                   Waiting for contact...
                 </div>
               )}
            </div>
            <div className="flex justify-center gap-4 mt-4">
               {['A', 'B', 'C'].map((label, i) => (
                 <div key={label} className="flex items-center gap-1.5">
                    <div className={`w-3 h-1 rounded-full ct-series-color-${i}`} />
                    <span className="text-[10px] font-black text-slate-400 uppercase">Block {label}</span>
                 </div>
               ))}
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-gray-100">
            <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-3">
              <Info className="text-orange-500" />
              How it works
            </h3>
            <div className="space-y-4 text-slate-500 text-sm font-medium leading-relaxed">
              <p>
                In a solid, particles are locked in a grid but they never stop moving! They **vibrate** in place.
              </p>
              <p className="bg-orange-50 p-4 rounded-2xl text-orange-700 border border-orange-100">
                <span className="font-black uppercase block mb-1">Conduction:</span>
                When you move a hot block to touch a cold one, the fast-vibrating particles bump into the slow ones, transferring their energy.
              </p>
              <p>
                Over time, the blocks will reach **Thermal Equilibrium** where they all have the same temperature and vibrate at the same speed.
              </p>
            </div>
          </div>

          <div className="bg-slate-900 rounded-[2.5rem] p-8 shadow-xl border border-slate-800 flex-1 flex flex-col justify-center gap-6">
             <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-widest">
                   <span>Energy Conservation</span>
                   <span>Closed System</span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                   <div className="h-full bg-orange-500 w-full shadow-[0_0_15px_rgba(249,115,22,0.5)]" />
                </div>
             </div>
             <p className="text-slate-400 text-[10px] font-bold italic text-center">
               "Energy can neither be created nor destroyed; rather, it can only be transformed or transferred from one form to another."
             </p>
          </div>
        </div>
      </div>
      <style dangerouslySetInnerHTML={{ __html: `
        .custom-thermal-chart .ct-series-a .ct-line { stroke: #ef4444; stroke-width: 3px; }
        .custom-thermal-chart .ct-series-b .ct-line { stroke: #3b82f6; stroke-width: 3px; }
        .custom-thermal-chart .ct-series-c .ct-line { stroke: #10b981; stroke-width: 3px; }
        .ct-series-color-0 { background-color: #ef4444; }
        .ct-series-color-1 { background-color: #3b82f6; }
        .ct-series-color-2 { background-color: #10b981; }
        .ct-grid { stroke: rgba(0,0,0,0.05); stroke-dasharray: 0; }
        .ct-label { color: #94a3b8; font-weight: 700; font-size: 10px; }
      `}} />
    </div>
  );
};
