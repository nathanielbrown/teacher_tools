import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Leaf, Dog, MousePointer2, Play, Pause, RotateCcw, 
  TrendingUp, Activity, Settings2, Info, ChevronRight,
  ShieldCheck, AlertCircle
} from 'lucide-react';

// Constants
const WIDTH = 800;
const HEIGHT = 500;
const INITIAL_RABBITS = 40;
const INITIAL_WOLVES = 4;
const INITIAL_GRASS = 350;

export const EcosystemSimulation = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [stats, setStats] = useState({ grass: INITIAL_GRASS, rabbits: INITIAL_RABBITS, wolves: INITIAL_WOLVES });
  const [history, setHistory] = useState([]);
  const [speed, setSpeed] = useState(1);
  
  const simulationRef = useRef({
    rabbits: [],
    wolves: [],
    grass: [],
    frameCount: 0
  });
  const historyRef = useRef([]);

  const canvasRef = useRef(null);
  const graphRef = useRef(null);
  const requestRef = useRef();

  // Initialization
  const init = () => {
    const rabbits = [];
    for (let i = 0; i < INITIAL_RABBITS; i++) {
      rabbits.push({
        x: Math.random() * WIDTH,
        y: Math.random() * HEIGHT,
        energy: 100,
        age: 0,
        id: Math.random()
      });
    }

    const wolves = [];
    for (let i = 0; i < INITIAL_WOLVES; i++) {
      wolves.push({
        x: Math.random() * WIDTH,
        y: Math.random() * HEIGHT,
        energy: 150,
        age: 0,
        id: Math.random()
      });
    }

    const grass = [];
    for (let i = 0; i < INITIAL_GRASS; i++) {
      grass.push({
        x: Math.random() * WIDTH,
        y: Math.random() * HEIGHT,
        id: Math.random()
      });
    }

    simulationRef.current = { rabbits, wolves, grass, frameCount: 0 };
    historyRef.current = [];
    setHistory([]);
    setStats({ grass: INITIAL_GRASS, rabbits: INITIAL_RABBITS, wolves: INITIAL_WOLVES });
  };

  useEffect(() => {
    init();
    return () => cancelAnimationFrame(requestRef.current);
  }, []);

  const update = () => {
    if (!isPlaying) return;

    const sim = simulationRef.current;
    sim.frameCount++;

    // 1. Grass Growth (Density-Aware)
    if (sim.frameCount % Math.max(1, Math.floor(4 / speed)) === 0) {
      if (sim.grass.length < 600) {
        // Try several random spots and pick the most empty one
        let bestX = Math.random() * WIDTH;
        let bestY = Math.random() * HEIGHT;
        let minDensity = Infinity;

        for (let i = 0; i < 5; i++) {
          const tx = Math.random() * WIDTH;
          const ty = Math.random() * HEIGHT;
          
          // Calculate local density (grass + rabbits + wolves nearby)
          let density = 0;
          sim.grass.forEach(g => { if (Math.hypot(tx-g.x, ty-g.y) < 60) density += 1; });
          sim.rabbits.forEach(r => { if (Math.hypot(tx-r.x, ty-r.y) < 60) density += 2; });
          sim.wolves.forEach(w => { if (Math.hypot(tx-w.x, ty-w.y) < 60) density += 4; });

          if (density < minDensity) {
            minDensity = density;
            bestX = tx;
            bestY = ty;
          }
        }

        sim.grass.push({ x: bestX, y: bestY, id: Math.random() });
      }
    }

    // 2. Rabbit Logic
    sim.rabbits = sim.rabbits.filter(r => {
      // Movement (Track nearest grass)
      let nearestGrass = null;
      let minGrassDist = 120;
      sim.grass.forEach(g => {
        const d = Math.sqrt(Math.pow(r.x - g.x, 2) + Math.pow(r.y - g.y, 2));
        if (d < minGrassDist) {
          minGrassDist = d;
          nearestGrass = g;
        }
      });

      if (nearestGrass) {
        const dx = (nearestGrass.x - r.x);
        const dy = (nearestGrass.y - r.y);
        const angle = Math.atan2(dy, dx);
        r.x += Math.cos(angle) * 5 * speed;
        r.y += Math.sin(angle) * 5 * speed;
      } else {
        r.x += (Math.random() - 0.5) * 6 * speed;
        r.y += (Math.random() - 0.5) * 6 * speed;
      }
      r.x = (r.x + WIDTH) % WIDTH;
      r.y = (r.y + HEIGHT) % HEIGHT;

      // Metabolism
      r.energy -= 0.6 * speed;
      r.age += 0.1 * speed;

      // Eating
      const grassIndex = sim.grass.findIndex(g => 
        Math.sqrt(Math.pow(r.x - g.x, 2) + Math.pow(r.y - g.y, 2)) < 20
      );
      if (grassIndex !== -1) {
        sim.grass.splice(grassIndex, 1);
        r.energy += 35; // Gained energy from eating
      }

      // Reproduction (ONLY after eating enough - energy > 140)
      if (r.energy > 140 && sim.rabbits.length < 150) {
        r.energy -= 80;
        sim.rabbits.push({ 
          x: r.x + (Math.random() - 0.5) * 10,
          y: r.y + (Math.random() - 0.5) * 10,
          id: Math.random(), 
          energy: 60, 
          age: 0 
        });
      }

      return r.energy > 0 && r.age < 100;
    });

    // 3. Wolf Logic
    sim.wolves = sim.wolves.filter(w => {
      // Movement (Track nearest rabbit)
      let target = null;
      let minDist = 150;
      sim.rabbits.forEach(r => {
        const d = Math.sqrt(Math.pow(w.x - r.x, 2) + Math.pow(w.y - r.y, 2));
        if (d < minDist) {
          minDist = d;
          target = r;
        }
      });

      if (target) {
        const dx = (target.x - w.x);
        const dy = (target.y - w.y);
        const angle = Math.atan2(dy, dx);
        w.x += Math.cos(angle) * 4 * speed;
        w.y += Math.sin(angle) * 4 * speed;
      } else {
        w.x += (Math.random() - 0.5) * 4 * speed;
        w.y += (Math.random() - 0.5) * 4 * speed;
      }
      w.x = (w.x + WIDTH) % WIDTH;
      w.y = (w.y + HEIGHT) % HEIGHT;

      // Metabolism
      w.energy -= 0.8 * speed;
      w.age += 0.05 * speed;

      // Hunting
      const rabbitIndex = sim.rabbits.findIndex(r => 
        Math.sqrt(Math.pow(w.x - r.x, 2) + Math.pow(w.y - r.y, 2)) < 20
      );
      if (rabbitIndex !== -1) {
        sim.rabbits.splice(rabbitIndex, 1);
        w.energy += 90; // Gained energy from hunting
      }

      // Reproduction (ONLY after eating enough - energy > 350)
      if (w.energy > 350 && sim.wolves.length < 40) {
        w.energy -= 220;
        sim.wolves.push({ 
          x: w.x + (Math.random() - 0.5) * 10,
          y: w.y + (Math.random() - 0.5) * 10,
          id: Math.random(), 
          energy: 160, 
          age: 0 
        });
      }

      return w.energy > 0 && w.age < 150;
    });

    // Stats and History
    if (sim.frameCount % 20 === 0) {
      const newStats = { grass: sim.grass.length, rabbits: sim.rabbits.length, wolves: sim.wolves.length };
      setStats(newStats);
      historyRef.current = [...historyRef.current, newStats].slice(-100);
      setHistory(historyRef.current);
    }

    draw();
    drawGraph();
    requestRef.current = requestAnimationFrame(update);
  };

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const sim = simulationRef.current;

    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    
    // Draw Grass
    ctx.fillStyle = '#4ade80';
    sim.grass.forEach(g => {
      ctx.beginPath();
      ctx.arc(g.x, g.y, 2, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw Rabbits
    sim.rabbits.forEach(r => {
      ctx.font = '16px serif';
      ctx.fillText('🐇', r.x - 8, r.y + 8);
      // Health bar
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.fillRect(r.x - 10, r.y - 12, 20, 2);
      ctx.fillStyle = '#4ade80';
      ctx.fillRect(r.x - 10, r.y - 12, (r.energy / 140) * 20, 2);
    });

    // Draw Wolves
    sim.wolves.forEach(w => {
      ctx.font = '22px serif';
      ctx.fillText('🐺', w.x - 11, w.y + 11);
      // Health bar
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.fillRect(w.x - 12, w.y - 15, 24, 3);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(w.x - 12, w.y - 15, (w.energy / 350) * 24, 3);
    });
  };

  const drawGraph = () => {
    const canvas = graphRef.current;
    const history = historyRef.current;
    if (!canvas || history.length < 2) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Calculate dynamic scale
    const maxVal = Math.max(...history.map(s => Math.max(s.grass, s.rabbits, s.wolves, 50))) * 1.2;

    const drawLine = (key, color) => {
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 4;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      
      const totalPoints = history.length;
      history.forEach((s, i) => {
        const x = (i / Math.max(1, totalPoints - 1)) * w; 
        const y = h - (s[key] / maxVal) * h;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();

      // Add a subtle gradient fill under the line
      ctx.lineTo(w, h);
      ctx.lineTo(0, h);
      ctx.fillStyle = color + '15'; 
      ctx.fill();
    };

    // Draw grid lines
    ctx.strokeStyle = '#f1f5f9';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = (i / 4) * h;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    drawLine('grass', '#4ade80');
    drawLine('rabbits', '#94a3b8');
    drawLine('wolves', '#ef4444');
  };

  useEffect(() => {
    if (isPlaying) {
      requestRef.current = requestAnimationFrame(update);
    } else {
      cancelAnimationFrame(requestRef.current);
    }
    return () => cancelAnimationFrame(requestRef.current);
  }, [isPlaying, speed]);

  return (
    <div className="max-w-[1400px] mx-auto min-h-0 h-full flex flex-col gap-4 px-6 py-6 select-none overflow-y-auto lg:overflow-hidden">
      {/* Header */}
      <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-6 shrink-0">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-emerald-50 rounded-2xl text-emerald-600">
            <Activity size={40} />
          </div>
          <div>
            <h2 className="text-4xl font-black text-slate-800 tracking-tight">Ecosystem Simulation</h2>
            <p className="text-slate-400 font-medium italic">Balance the web of life.</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="bg-slate-50 p-1.5 rounded-2xl border border-slate-100 flex items-center gap-1">
             {[1, 2, 5].map(s => (
               <button 
                 key={s} 
                 onClick={() => setSpeed(s)}
                 className={`px-4 py-2 rounded-xl font-black text-xs transition-all ${speed === s ? 'bg-white text-emerald-600 shadow-md' : 'text-slate-400'}`}
               >
                 {s}x
               </button>
             ))}
          </div>
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`p-4 rounded-2xl transition-all shadow-lg active:scale-95 flex items-center gap-3 font-black ${
              isPlaying ? 'bg-amber-50 text-amber-600' : 'bg-emerald-600 text-white shadow-emerald-100'
            }`}
          >
            {isPlaying ? <Pause size={24} /> : <Play size={24} />}
            {isPlaying ? 'PAUSE' : 'START'}
          </button>
          <button
            onClick={init}
            className="p-4 bg-slate-50 text-slate-400 rounded-2xl hover:bg-red-50 hover:text-red-600 transition-all active:scale-95"
          >
            <RotateCcw size={24} />
          </button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 min-h-0">
        {/* Main Simulation View */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="flex-1 bg-white rounded-[3rem] shadow-2xl border-8 border-white overflow-hidden relative shadow-emerald-900/5">
            <div className="absolute inset-0 bg-[#f8fafc] opacity-50" style={{ backgroundImage: 'radial-gradient(#e2e8f0 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
            <canvas 
              ref={canvasRef} 
              width={WIDTH} 
              height={HEIGHT} 
              className="absolute inset-0 w-full h-full object-contain z-10" 
            />
            
            {/* Real-time Overlay Labels */}
            <div className="absolute bottom-6 left-6 z-20 flex gap-4">
               <div className="px-4 py-2 bg-white/80 backdrop-blur-md rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
                  <Leaf size={16} className="text-emerald-500" />
                  <span className="font-black text-slate-700">{stats.grass}</span>
               </div>
               <div className="px-4 py-2 bg-white/80 backdrop-blur-md rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
                  <span className="text-base">🐇</span>
                  <span className="font-black text-slate-700">{stats.rabbits}</span>
               </div>
               <div className="px-4 py-2 bg-white/80 backdrop-blur-md rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
                  <span className="text-base">🐺</span>
                  <span className="font-black text-slate-700">{stats.wolves}</span>
               </div>
            </div>
          </div>

          {/* Graph Section */}
          <div className="bg-white rounded-[2.5rem] p-6 shadow-xl border border-gray-100 min-h-[240px] flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black text-slate-800 flex items-center gap-3 uppercase tracking-tighter">
                <TrendingUp className="text-emerald-500" />
                Population Trends
              </h3>
              <div className="flex gap-4">
                 <div className="flex items-center gap-2 text-[10px] font-black text-emerald-500 uppercase">
                    <div className="w-3 h-1 bg-emerald-400 rounded-full" /> Grass
                 </div>
                 <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase">
                    <div className="w-3 h-1 bg-slate-300 rounded-full" /> Rabbits
                 </div>
                 <div className="flex items-center gap-2 text-[10px] font-black text-red-500 uppercase">
                    <div className="w-3 h-1 bg-red-400 rounded-full" /> Wolves
                 </div>
              </div>
            </div>
            <div className="flex-1 relative mt-2 bg-slate-50/50 rounded-2xl overflow-hidden">
              <canvas ref={graphRef} className="absolute inset-0 w-full h-full block" width={800} height={200} />
            </div>
          </div>
        </div>

        {/* Info & Insights Sidebar */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-gray-100">
             <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-3">
                <Info className="text-emerald-600" />
                Scientific Concepts
             </h3>
             <div className="space-y-6">
                <div className="space-y-2">
                   <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <ShieldCheck size={14} className="text-emerald-500" />
                      Producer / Consumer
                   </h4>
                   <p className="text-sm font-medium text-slate-500 leading-relaxed">
                     **Grass** produces energy from sunlight. **Rabbits** (Primary Consumers) get energy by eating grass. **Wolves** (Secondary Consumers) hunt rabbits.
                   </p>
                </div>
                <div className="space-y-2">
                   <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <AlertCircle size={14} className="text-amber-500" />
                      Population Balance
                   </h4>
                   <p className="text-sm font-medium text-slate-500 leading-relaxed">
                     If wolves eat all the rabbits, the wolves will eventually starve. If all wolves die, rabbits might overpopulate and eat all the grass!
                   </p>
                </div>
             </div>
          </div>

          <div className="bg-emerald-900 rounded-[2.5rem] p-8 shadow-xl border border-emerald-800 flex-1 flex flex-col gap-6 overflow-hidden relative group">
             <div className="absolute top-0 right-0 -translate-y-4 translate-x-4 opacity-10 group-hover:scale-110 transition-transform">
                <Leaf size={200} />
             </div>
             <h3 className="text-white text-xl font-black tracking-tight z-10">Ecosystem Insight</h3>
             <p className="text-emerald-100/70 text-sm font-medium leading-relaxed z-10">
               Notice the "lag" in the graph. As the rabbit population grows, it takes time for the wolves to reproduce and catch up. This cycle is a fundamental pattern in nature called the **Lotka-Volterra** predator-prey dynamic.
             </p>
             <div className="mt-auto z-10">
                <div className="px-6 py-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 flex items-center justify-between group-hover:bg-white/20 transition-all cursor-help">
                   <span className="text-white font-black text-xs uppercase tracking-widest">Observe Cycle</span>
                   <ChevronRight size={20} className="text-white" />
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};
