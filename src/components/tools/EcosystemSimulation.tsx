import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw,
  Activity, 
  Info, 
  MousePointer2,
  BrainCircuit,
  X,
  TrendingUp,
  Volume2
} from 'lucide-react';
import { LineChart } from 'chartist';
import 'chartist/dist/index.css';
import { useHeader } from '../../contexts/HeaderContext';
import { useSettings } from '../../contexts/SettingsContext';
import { audioEngine } from '../../utils/audio';

// 1. Constants
const WIDTH = 1000;
const HEIGHT = 600;
const INITIAL_RABBITS = 15;
const INITIAL_WOLVES = 3;
const INITIAL_GRASS = 40;
const BORDER_MARGIN = 40;

const SIM_CONFIG = {
  grass: { growthRate: 10, max: 200, healthValue: 0.5 },
  rabbit: { initialHealth: 1.5, metabolism: 0.005, splitHealth: 4, offspringHealth: 1.5, speed: 1.2, detectionRange: 150, maxAge: 100 },
  wolf: { initialHealth: 2, metabolism: 0.008, splitHealth: 6, offspringHealth: 2, speed: 1.5, detectionRange: 200, maxAge: 150 }
};

// 2. Config (None)

// 3. Text (Help and Info)
const HELP_INFO = (
  <div className="space-y-4 font-['Outfit']">
    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">How the World Works</h3>
    <div className="space-y-3">
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-emerald-50 flex items-center justify-center text-xs font-black text-emerald-600 shrink-0">1</div>
        <p className="text-sm text-slate-600 font-medium leading-tight"><b>Rabbits</b> eat grass. <b>Wolves</b> hunt rabbits.</p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center text-xs font-black text-blue-600 shrink-0">2</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">Tap the map to add more grass, rabbits, or wolves.</p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-rose-50 flex items-center justify-center text-xs font-black text-rose-600 shrink-0">3</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">Watch the numbers change at the bottom. Keep the balance!</p>
      </div>
    </div>
  </div>
);

// 6. Functions (Drawing)
const drawSim = (ctx: CanvasRenderingContext2D, sim: any) => {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  
  // High-fidelity grid
  ctx.strokeStyle = 'rgba(0,0,0,0.03)';
  ctx.lineWidth = 1;
  for (let x = 0; x < WIDTH; x += 50) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, HEIGHT); ctx.stroke();
  }
  for (let y = 0; y < HEIGHT; y += 50) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(WIDTH, y); ctx.stroke();
  }

  sim.grass.forEach((g: any) => { 
    ctx.font = '16px serif'; ctx.fillText('🌱', g.x - 8, g.y + 8); 
  });
  sim.rabbits.forEach((r: any) => { 
    ctx.font = '24px serif'; ctx.save(); ctx.translate(r.x, r.y); 
    // Emoji faces right by default, but we want it to face the heading
    // heading is angle in radians
    ctx.rotate(r.heading + Math.PI / 2); 
    ctx.fillText('🐇', -12, 12); ctx.restore(); 
  });
  sim.wolves.forEach((w: any) => { 
    ctx.font = '32px serif'; ctx.save(); ctx.translate(w.x, w.y); 
    ctx.rotate(w.heading + Math.PI / 2); 
    ctx.fillText('🐺', -16, 16); ctx.restore(); 
  });
};

// 7. Component
export const EcosystemSimulation = () => {
  const { setHeaderActions, setHelpContent, setOnReset, clearHeader } = useHeader();
  const { settings } = useSettings();
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [stats, setStats] = useState({ grass: INITIAL_GRASS, rabbits: INITIAL_RABBITS, wolves: INITIAL_WOLVES });
  const [selectedType, setSelectedType] = useState('rabbit');
  const [speed] = useState(1);
  
  const simulationRef = useRef({
    rabbits: [] as any[],
    wolves: [] as any[],
    grass: [] as any[],
    frameCount: 0
  });
  const historyRef = useRef<any[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const graphRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<number>(0);
  const chartInstance = useRef<any>(null);

  const updateChart = useCallback(() => {
    const hist = historyRef.current;
    if (!graphRef.current || hist.length < 2) return;
    const data = {
      labels: hist.map((_, i) => i),
      series: [hist.map(s => s.grass), hist.map(s => s.rabbits), hist.map(s => s.wolves)]
    };
    const options = {
      showPoint: false, lineSmooth: true,
      axisX: { showGrid: false, showLabel: false },
      axisY: { offset: 30 },
      fullWidth: true, chartPadding: { right: 0, left: 0, top: 0, bottom: 0 }
    };
    if (!chartInstance.current) {
      chartInstance.current = new LineChart(graphRef.current, data, options);
    } else {
      chartInstance.current.update(data);
    }
  }, []);

  const init = useCallback(() => {
    const rabbits = Array.from({ length: INITIAL_RABBITS }).map(() => ({
      x: BORDER_MARGIN + Math.random() * (WIDTH - BORDER_MARGIN * 2),
      y: BORDER_MARGIN + Math.random() * (HEIGHT - BORDER_MARGIN * 2),
      health: SIM_CONFIG.rabbit.initialHealth, age: 0, heading: Math.random() * Math.PI * 2
    }));
    const wolves = Array.from({ length: INITIAL_WOLVES }).map(() => ({
      x: BORDER_MARGIN + Math.random() * (WIDTH - BORDER_MARGIN * 2),
      y: BORDER_MARGIN + Math.random() * (HEIGHT - BORDER_MARGIN * 2),
      health: SIM_CONFIG.wolf.initialHealth, age: 0, heading: Math.random() * Math.PI * 2
    }));
    const grass = Array.from({ length: INITIAL_GRASS }).map(() => ({
      x: BORDER_MARGIN + Math.random() * (WIDTH - BORDER_MARGIN * 2),
      y: BORDER_MARGIN + Math.random() * (HEIGHT - BORDER_MARGIN * 2)
    }));
    simulationRef.current = { rabbits, wolves, grass, frameCount: 0 };
    historyRef.current = [{ grass: INITIAL_GRASS, rabbits: INITIAL_RABBITS, wolves: INITIAL_WOLVES }];
    setStats({ grass: INITIAL_GRASS, rabbits: INITIAL_RABBITS, wolves: INITIAL_WOLVES });
    
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) drawSim(ctx, simulationRef.current);
  }, []);

  const update = useCallback((_time: number) => {
    if (!isPlaying) return;
    const sim = simulationRef.current;
    sim.frameCount++;

    // Grass growth
    if (sim.frameCount % Math.max(1, Math.round(20 / speed)) === 0 && sim.grass.length < SIM_CONFIG.grass.max) {
      sim.grass.push({ x: BORDER_MARGIN + Math.random() * (WIDTH - BORDER_MARGIN * 2), y: BORDER_MARGIN + Math.random() * (HEIGHT - BORDER_MARGIN * 2) });
    }

    // Update Rabbits
    const nextRabbits: any[] = [];
    sim.rabbits.forEach(r => {
      let target: any = null; let minDist = SIM_CONFIG.rabbit.detectionRange;
      sim.grass.forEach(g => {
        const d = Math.hypot(r.x - g.x, r.y - g.y);
        if (d < minDist) { minDist = d; target = g; }
      });
      if (target) r.heading = Math.atan2(target.y - r.y, target.x - r.x);
      else r.heading += (Math.random() - 0.5) * 0.2;
      
      r.x += Math.cos(r.heading) * SIM_CONFIG.rabbit.speed * speed;
      r.y += Math.sin(r.heading) * SIM_CONFIG.rabbit.speed * speed;
      r.health -= SIM_CONFIG.rabbit.metabolism * speed; r.age += 0.1 * speed;

      // Wrap around
      if (r.x < 0) r.x = WIDTH; if (r.x > WIDTH) r.x = 0;
      if (r.y < 0) r.y = HEIGHT; if (r.y > HEIGHT) r.y = 0;

      // Eating
      const grassIdx = sim.grass.findIndex(g => Math.hypot(r.x - g.x, r.y - g.y) < 15);
      if (grassIdx !== -1) { sim.grass.splice(grassIdx, 1); r.health += SIM_CONFIG.grass.healthValue; }

      // Reproduction or Death
      if (r.health >= SIM_CONFIG.rabbit.splitHealth) {
        nextRabbits.push({...r, health: SIM_CONFIG.rabbit.offspringHealth, age: 0}, {...r, health: SIM_CONFIG.rabbit.offspringHealth, age: 0});
      } else if (r.health > 0 && r.age < SIM_CONFIG.rabbit.maxAge) {
        nextRabbits.push(r);
      }
    });
    sim.rabbits = nextRabbits;

    // Update Wolves
    const nextWolves: any[] = [];
    sim.wolves.forEach(w => {
      let target: any = null; let minDist = SIM_CONFIG.wolf.detectionRange;
      sim.rabbits.forEach(r => {
        const d = Math.hypot(w.x - r.x, w.y - r.y);
        if (d < minDist) { minDist = d; target = r; }
      });
      if (target) w.heading = Math.atan2(target.y - w.y, target.x - w.x);
      else w.heading += (Math.random() - 0.5) * 0.2;
      
      w.x += Math.cos(w.heading) * SIM_CONFIG.wolf.speed * speed;
      w.y += Math.sin(w.heading) * SIM_CONFIG.wolf.speed * speed;
      w.health -= SIM_CONFIG.wolf.metabolism * speed; w.age += 0.05 * speed;

      // Wrap around
      if (w.x < 0) w.x = WIDTH; if (w.x > WIDTH) w.x = 0;
      if (w.y < 0) w.y = HEIGHT; if (w.y > HEIGHT) w.y = 0;

      // Hunting
      const rabbitIdx = sim.rabbits.findIndex(r => Math.hypot(w.x - r.x, w.y - r.y) < 20);
      if (rabbitIdx !== -1) { sim.rabbits.splice(rabbitIdx, 1); w.health += 1.5; }

      // Reproduction or Death
      if (w.health >= SIM_CONFIG.wolf.splitHealth) {
        nextWolves.push({...w, health: SIM_CONFIG.wolf.offspringHealth, age: 0}, {...w, health: SIM_CONFIG.wolf.offspringHealth, age: 0});
      } else if (w.health > 0 && w.age < SIM_CONFIG.wolf.maxAge) {
        nextWolves.push(w);
      }
    });
    sim.wolves = nextWolves;

    if (sim.frameCount % 20 === 0) {
      const newStats = { grass: sim.grass.length, rabbits: sim.rabbits.length, wolves: sim.wolves.length };
      setStats(newStats);
      historyRef.current = [...historyRef.current, newStats].slice(-100);
      updateChart();
    }
    
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) drawSim(ctx, sim);
    requestRef.current = requestAnimationFrame(update);
  }, [isPlaying, speed, updateChart]);

  useEffect(() => {
    init();
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [init]);

  useEffect(() => {
    if (isPlaying) {
      requestRef.current = requestAnimationFrame(update);
    } else {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isPlaying, update]);

  useEffect(() => {
    setOnReset(() => init);
    setHelpContent(HELP_INFO);
    return () => clearHeader();
  }, [clearHeader, setOnReset, init, setHelpContent]);

  useEffect(() => {
    setHeaderActions(
      <div className="flex items-center gap-4 italic">
        <button
          onClick={() => { setIsPlaying(!isPlaying); audioEngine.playTick(settings.soundTheme); }}
          className={`flex items-center gap-2 px-6 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95  ${isPlaying ? 'bg-amber-100 text-amber-600' : 'bg-emerald-600 text-white '}`}
        >
          {isPlaying ? <Pause size={14} strokeWidth={3} /> : <Play size={14} strokeWidth={3} />} {isPlaying ? 'Freeze' : 'Live'}
        </button>
      </div>
    );
  }, [isPlaying, settings.soundTheme, setHeaderActions]);

  const handleCanvasClick = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((e.clientX - rect.left) / rect.width) * WIDTH;
    const y = ((e.clientY - rect.top) / rect.height) * HEIGHT;
    const sim = simulationRef.current;
    
    if (selectedType === 'grass') {
      sim.grass.push({ x, y });
    } else if (selectedType === 'rabbit') {
      sim.rabbits.push({ x, y, health: SIM_CONFIG.rabbit.initialHealth, age: 0, heading: Math.random() * Math.PI * 2 });
    } else if (selectedType === 'wolf') {
      sim.wolves.push({ x, y, health: SIM_CONFIG.wolf.initialHealth, age: 0, heading: Math.random() * Math.PI * 2 });
    }
    
    setStats({ grass: sim.grass.length, rabbits: sim.rabbits.length, wolves: sim.wolves.length });
    audioEngine.playTick(settings.soundTheme);
    
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) drawSim(ctx, sim);
  };

  return (
    <div className="tool-container flex flex-col gap-6 h-full font-['Outfit'] select-none relative bg-white rounded-[4rem] p-4 lg:p-12 italic  overflow-hidden">
      
      {/* Primary Simulation Observation Deck */}
      <div className="flex-[2] bg-slate-50/50 rounded-[4rem] border-4 border-white  flex flex-col relative overflow-hidden group">
        <canvas 
          ref={canvasRef} 
          width={WIDTH} 
          height={HEIGHT} 
          className="absolute inset-0 w-full h-full z-10 cursor-crosshair" 
          onClick={handleCanvasClick}
        />

        {/* Tactical Control interface */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 flex justify-center">
           <div className="flex gap-4 p-3 bg-white/90 backdrop-blur-2xl rounded-[3rem] border-4 border-white ">
              {[
                { id: 'grass', label: '🌱 Grass', color: 'bg-emerald-600' },
                { id: 'rabbit', label: '🐇 Rabbit', color: 'bg-slate-900' },
                { id: 'wolf', label: '🐺 Wolf', color: 'bg-rose-600' }
              ].map(type => (
                <button 
                  key={type.id}
                  onClick={() => { setSelectedType(type.id); audioEngine.playTick(settings.soundTheme); }} 
                  className={`px-8 py-4 rounded-[2rem] border-2 transition-all text-[11px] font-black uppercase tracking-widest ${selectedType === type.id ? `${type.color} text-white border-white  scale-105` : 'text-slate-400 border-transparent hover:text-slate-600'}`}
                >
                  {type.label}
                </button>
              ))}
           </div>
        </div>
      </div>

      {/* Analytics Matrix Section at Bottom */}
      <div className="flex-1 flex flex-col lg:flex-row gap-8 relative z-20 italic min-h-[300px]">
        
        {/* Population Core Readout */}
        <div className="flex-1 bg-slate-900 p-8 rounded-[4rem] border-4 border-slate-800  flex flex-col justify-center gap-8 relative overflow-hidden shrink-0">
           <div className="grid grid-cols-3 gap-6 relative z-10">
              <div className="flex flex-col items-center gap-2">
                 <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest leading-none">Flora</span>
                 <span className="text-4xl font-black tabular-nums text-white italic">{stats.grass}</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                 <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest leading-none">Prey</span>
                 <span className="text-4xl font-black tabular-nums text-white italic">{stats.rabbits}</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                 <span className="text-[9px] font-black text-rose-400 uppercase tracking-widest leading-none">Predator</span>
                 <span className="text-4xl font-black tabular-nums text-white italic">{stats.wolves}</span>
              </div>
           </div>
        </div>

        {/* Dynamic Analytics Chart */}
        <div className="flex-[2] bg-slate-50/50 p-8 rounded-[4rem] border-4 border-white  flex flex-col gap-4">
           <div className="flex-1 bg-white rounded-[3rem] p-6 border-4 border-slate-50  relative overflow-hidden">
              <div ref={graphRef} className="ct-chart h-full w-full" />
           </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .ct-series-a .ct-line { stroke: #10b981 !important; stroke-width: 4px; stroke-linecap: round; }
        .ct-series-b .ct-line { stroke: #6366f1 !important; stroke-width: 4px; stroke-linecap: round; }
        .ct-series-c .ct-line { stroke: #f43f5e !important; stroke-width: 4px; stroke-linecap: round; }
        .ct-label { color: #94a3b8 !important; font-size: 10px !important; font-weight: 900 !important; font-family: 'Outfit' !important; font-style: italic !important; text-transform: uppercase !important; }
        .ct-grid { stroke: rgba(0,0,0,0.05) !important; stroke-dasharray: 0 !important; }
      `}} />
    </div>
  );
};

export default EcosystemSimulation;
