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
import SettingsPanel from '../shared/SettingsPanel';
import { motion, AnimatePresence } from 'framer-motion';
import { ToolPanel } from '../shared/ToolPanel';

// 1. Constants
const WIDTH = 1000;
const HEIGHT = 600;
const INITIAL_RABBITS = 15;
const INITIAL_WOLVES = 3;
const INITIAL_GRASS = 40;
const BORDER_MARGIN = 40;

const SIM_CONFIG = {
  grass: { growthRate: 10, max: 2000, healthValue: 0.5 },
  rabbit: { initialHealth: 1.5, metabolism: 0.01, speed: 1.2, detectionRange: 150, maxAge: 100, fullHealth: 3 },
  wolf: { initialHealth: 2, metabolism: 0.02, speed: 2, detectionRange: 200, maxAge: 150, fullHealth: 5 }
};

// 2. Config (None)

// 3. Text (Help and Info)
const HELP_INFO = (
  <div className="space-y-4 font-['Outfit']">
    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">How the World Works</h3>
    <div className="space-y-3">
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-success-bg flex items-center justify-center text-xs font-black text-success shrink-0">1</div>
        <p className="text-sm text-slate-600 font-medium leading-tight"><b>Rabbits</b> eat grass. <b>Wolves</b> hunt rabbits.</p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-info-bg flex items-center justify-center text-xs font-black text-info shrink-0">2</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">Tap the map to add more grass, rabbits, or wolves.</p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-caution-bg flex items-center justify-center text-xs font-black text-caution shrink-0">3</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">Watch the numbers change at the bottom. Keep the balance!</p>
      </div>
    </div>
  </div>
);

// 6. Functions (Drawing)
const drawSim = (ctx: CanvasRenderingContext2D, sim: any) => {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);

  // High-fidelity grid
  const borderHex = typeof window !== 'undefined' ? getComputedStyle(document.documentElement).getPropertyValue('--color-border').trim() : '';
  ctx.strokeStyle = borderHex || 'rgba(0,0,0,0.03)';
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
    // Emoji remains upright as per rules
    ctx.fillText('🐇', -12, 12); ctx.restore();
  });
  sim.wolves.forEach((w: any) => {
    ctx.font = '32px serif'; ctx.save(); ctx.translate(w.x, w.y);
    ctx.fillText('🐺', -16, 16); ctx.restore();
  });
  sim.corpses?.forEach((c: any) => {
    ctx.font = '20px serif'; ctx.save(); ctx.translate(c.x, c.y);
    ctx.fillText(c.type === 'skull' ? '💀' : '🦴', -10, 10); ctx.restore();
  });
};

// 7. Component
export const EcosystemSimulation = () => {
  const { setHeaderActions, setHelpContent, setOnReset, clearHeader, setHasConfig, setOnConfigToggle, isConfigOpen, setIsConfigOpen } = useHeader();
  const { settings } = useSettings();

  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [isPlaying, setIsPlaying] = useState(false);
  const [stats, setStats] = useState({ grass: INITIAL_GRASS, rabbits: INITIAL_RABBITS, wolves: INITIAL_WOLVES });
  const [selectedType, setSelectedType] = useState('rabbit');
  const [speed, setSpeed] = useState(1);
  const [rabbitReproductionChance, setRabbitReproductionChance] = useState(50);
  const rabbitSpeed = SIM_CONFIG.rabbit.speed;
  const [wolfReproductionChance, setWolfReproductionChance] = useState(15);
  const [plantGrowthRate, setPlantGrowthRate] = useState(50);

  const simulationRef = useRef({
    rabbits: [] as any[],
    wolves: [] as any[],
    grass: [] as any[],
    corpses: [] as any[],
    frameCount: 0
  });
  const historyRef = useRef<any[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const graphRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<number>(0);
  const chartInstance = useRef<any>(null);
  const isDraggingRef = useRef(false);
  const lastAddPosRef = useRef<{ x: number; y: number } | null>(null);

  const updateChart = useCallback(() => {
    const hist = historyRef.current;
    if (!graphRef.current || hist.length < 1) return;
    const data = {
      labels: hist.map((_, i) => i),
      series: [hist.map(s => s.grass), hist.map(s => s.rabbits), hist.map(s => s.wolves)]
    };
    const options = {
      showPoint: hist.length === 1, lineSmooth: true,
      axisX: { showGrid: true, showLabel: false },
      axisY: { offset: 30 },
      fullWidth: true, chartPadding: { right: 10, left: 10, top: 10, bottom: 2 }
    };
    if (!chartInstance.current) {
      chartInstance.current = new LineChart(graphRef.current, data, options);
    } else {
      chartInstance.current.update(data, options);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      updateChart();
    }, 300);
    return () => clearTimeout(timer);
  }, [isConfigOpen, updateChart]);

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
    simulationRef.current = { rabbits, wolves, grass, corpses: [], frameCount: 0 };
    historyRef.current = [{ grass: INITIAL_GRASS, rabbits: INITIAL_RABBITS, wolves: INITIAL_WOLVES }];
    setStats({ grass: INITIAL_GRASS, rabbits: INITIAL_RABBITS, wolves: INITIAL_WOLVES });

    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) drawSim(ctx, simulationRef.current);

    updateChart();
  }, [updateChart]);

  const update = useCallback((_time: number) => {
    if (!isPlaying) return;
    const sim = simulationRef.current;
    sim.frameCount++;

    // Update corpses
    const nextCorpses: any[] = [];
    (sim.corpses || []).forEach((c: any) => {
      c.ticksLeft -= 1 * speed;
      if (c.ticksLeft <= 0) {
        if (sim.grass.length < SIM_CONFIG.grass.max) {
          sim.grass.push({ x: c.x, y: c.y });
        }
      } else {
        nextCorpses.push(c);
      }
    });
    sim.corpses = nextCorpses;

    // Grass growth
    if (sim.frameCount % 60 === 0) {
      const newGrass: any[] = [];
      const allGrass = [...sim.grass];

      // 1. Spawning 4 plants in quadrants
      const quadrants = [
        { minX: BORDER_MARGIN, maxX: WIDTH / 2, minY: BORDER_MARGIN, maxY: HEIGHT / 2 },
        { minX: WIDTH / 2, maxX: WIDTH - BORDER_MARGIN, minY: BORDER_MARGIN, maxY: HEIGHT / 2 },
        { minX: BORDER_MARGIN, maxX: WIDTH / 2, minY: HEIGHT / 2, maxY: HEIGHT - BORDER_MARGIN },
        { minX: WIDTH / 2, maxX: WIDTH - BORDER_MARGIN, minY: HEIGHT / 2, maxY: HEIGHT - BORDER_MARGIN }
      ];

      quadrants.forEach(q => {
        if (allGrass.length < SIM_CONFIG.grass.max) {
          let bestX = 0, bestY = 0, found = false;
          for (let i = 0; i < 5; i++) {
            const tx = q.minX + Math.random() * (q.maxX - q.minX);
            const ty = q.minY + Math.random() * (q.maxY - q.minY);
            const near = allGrass.some(g => Math.hypot(g.x - tx, g.y - ty) < 30);
            if (!near) {
              bestX = tx; bestY = ty; found = true; break;
            }
          }
          if (found) {
            newGrass.push({ x: bestX, y: bestY });
            allGrass.push({ x: bestX, y: bestY });
          }
        }
      });

      // 2. Existing plants reproduce
      sim.grass.forEach((g: any) => {
        if (Math.random() * 100 < plantGrowthRate && allGrass.length < SIM_CONFIG.grass.max) {
          // Check neighbors
          let neighbors = 0;
          for (const og of allGrass) {
            if (og !== g && Math.hypot(og.x - g.x, og.y - g.y) < 30) {
              neighbors++;
            }
          }
          if (neighbors >= 5) return; // Too crowded

          // Grow away from others
          let bestX = g.x, bestY = g.y, maxMinDist = -1;
          for (let i = 0; i < 4; i++) {
            const dist = 15 + Math.random() * 15;
            const angle = Math.random() * Math.PI * 2;
            let nx = g.x + Math.cos(angle) * dist;
            let ny = g.y + Math.sin(angle) * dist;
            nx = Math.max(BORDER_MARGIN, Math.min(WIDTH - BORDER_MARGIN, nx));
            ny = Math.max(BORDER_MARGIN, Math.min(HEIGHT - BORDER_MARGIN, ny));

            let minDist = 9999;
            for (const og of allGrass) {
              const d = Math.hypot(og.x - nx, og.y - ny);
              if (d < minDist) minDist = d;
            }
            if (minDist > maxMinDist) {
              maxMinDist = minDist;
              bestX = nx;
              bestY = ny;
            }
          }
          newGrass.push({ x: bestX, y: bestY });
          allGrass.push({ x: bestX, y: bestY });
        }
      });
      sim.grass.push(...newGrass);
    }

    // Update Rabbits
    const nextRabbits: any[] = [];
    sim.rabbits.forEach(r => {
      if (r.divergeTicks && r.divergeTicks > 0) {
        r.divergeTicks -= speed;
      } else if (r.health < SIM_CONFIG.rabbit.fullHealth) {
        let target: any = null; let minDist = SIM_CONFIG.rabbit.detectionRange;
        sim.grass.forEach(g => {
          const d = Math.hypot(r.x - g.x, r.y - g.y);
          if (d < minDist) { minDist = d; target = g; }
        });
        if (target) r.heading = Math.atan2(target.y - r.y, target.x - r.x);
        else r.heading += (Math.random() - 0.5) * 0.2;
      } else {
        r.heading += (Math.random() - 0.5) * 0.2;
      }

      r.x += Math.cos(r.heading) * rabbitSpeed * speed;
      r.y += Math.sin(r.heading) * rabbitSpeed * speed;
      r.health -= SIM_CONFIG.rabbit.metabolism * speed; r.age += 0.1 * speed;

      // Wrap around
      if (r.x < 0) r.x = WIDTH; if (r.x > WIDTH) r.x = 0;
      if (r.y < 0) r.y = HEIGHT; if (r.y > HEIGHT) r.y = 0;

      // Eating
      if (r.health < SIM_CONFIG.rabbit.fullHealth) {
        const grassIdx = sim.grass.findIndex(g => Math.hypot(r.x - g.x, r.y - g.y) < 15);
        if (grassIdx !== -1) {
          sim.grass.splice(grassIdx, 1);
          const foodHealth = SIM_CONFIG.grass.healthValue;
          if (Math.random() * 100 < rabbitReproductionChance) {
            const babyHealth = Math.max(1, foodHealth);
            r.health -= (babyHealth - foodHealth);
            nextRabbits.push({ ...r, health: babyHealth, age: 0, heading: r.heading + Math.PI / 4, divergeTicks: 60 });
          } else {
            r.health += foodHealth;
          }
        }
      }

      // Survival or Death
      if (r.health <= 0 || r.age >= SIM_CONFIG.rabbit.maxAge) {
        sim.corpses.push({ x: r.x, y: r.y, type: 'bone', ticksLeft: 60 });
      } else {
        nextRabbits.push(r);
      }
    });
    sim.rabbits = nextRabbits;

    // Update Wolves
    const nextWolves: any[] = [];
    sim.wolves.forEach(w => {
      if (w.divergeTicks && w.divergeTicks > 0) {
        w.divergeTicks -= speed;
      } else if (w.health < SIM_CONFIG.wolf.fullHealth) {
        let target: any = null; let minDist = SIM_CONFIG.wolf.detectionRange;
        sim.rabbits.forEach(r => {
          const d = Math.hypot(w.x - r.x, w.y - r.y);
          if (d < minDist) { minDist = d; target = r; }
        });
        if (target) w.heading = Math.atan2(target.y - w.y, target.x - w.x);
        else w.heading += (Math.random() - 0.5) * 0.2;
      } else {
        w.heading += (Math.random() - 0.5) * 0.2;
      }

      w.x += Math.cos(w.heading) * SIM_CONFIG.wolf.speed * speed;
      w.y += Math.sin(w.heading) * SIM_CONFIG.wolf.speed * speed;
      w.health -= SIM_CONFIG.wolf.metabolism * speed; w.age += 0.05 * speed;

      // Wrap around
      if (w.x < 0) w.x = WIDTH; if (w.x > WIDTH) w.x = 0;
      if (w.y < 0) w.y = HEIGHT; if (w.y > HEIGHT) w.y = 0;

      // Hunting
      if (w.health < SIM_CONFIG.wolf.fullHealth) {
        const rabbitIdx = sim.rabbits.findIndex(r => Math.hypot(w.x - r.x, w.y - r.y) < 20);
        if (rabbitIdx !== -1) {
          sim.rabbits.splice(rabbitIdx, 1);
          const foodHealth = 1.5;
          sim.corpses.push({ x: w.x, y: w.y, type: 'bone', ticksLeft: 60 });
          if (Math.random() * 100 < wolfReproductionChance) {
            const babyHealth = Math.max(1, foodHealth);
            w.health -= (babyHealth - foodHealth);
            nextWolves.push({ ...w, health: babyHealth, age: 0, heading: w.heading + Math.PI / 4, divergeTicks: 60 });
          } else {
            w.health += foodHealth;
          }
        }
      }

      // Survival or Death
      if (w.health <= 0 || w.age >= SIM_CONFIG.wolf.maxAge) {
        sim.corpses.push({ x: w.x, y: w.y, type: 'skull', ticksLeft: 60 });
      } else {
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
  }, [isPlaying, speed, updateChart, rabbitReproductionChance, rabbitSpeed, wolfReproductionChance, plantGrowthRate]);

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
    setHasConfig(true);
    setOnConfigToggle(() => () => setIsConfigOpen(prev => !prev));
  }, [setHasConfig, setOnConfigToggle, setIsConfigOpen]);

  useEffect(() => {
    setHeaderActions(
      <div className="flex items-center gap-4 italic">
        <button
          onClick={() => { setIsPlaying(!isPlaying); audioEngine.playTick(settings.soundTheme); }}
          className={`flex items-center gap-2 px-6 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95  ${isPlaying ? 'bg-warning-bg text-warning' : 'bg-success text-white'}`}
        >
          {isPlaying ? <Pause size={14} strokeWidth={3} /> : <Play size={14} strokeWidth={3} />} {isPlaying ? 'Freeze' : 'Live'}
        </button>
      </div>
    );
  }, [isPlaying, settings.soundTheme, setHeaderActions]);

  const addEntity = useCallback((x: number, y: number) => {
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
  }, [selectedType, settings.soundTheme]);

  const getCanvasCoords = (clientX: number, clientY: number) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return null;
    const x = ((clientX - rect.left) / rect.width) * WIDTH;
    const y = ((clientY - rect.top) / rect.height) * HEIGHT;
    return { x, y };
  };

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    const coords = getCanvasCoords(e.clientX, e.clientY);
    if (coords) {
      addEntity(coords.x, coords.y);
      lastAddPosRef.current = coords;
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    const coords = getCanvasCoords(e.clientX, e.clientY);
    if (!coords) return;

    const lastPos = lastAddPosRef.current;
    if (!lastPos) {
      addEntity(coords.x, coords.y);
      lastAddPosRef.current = coords;
    } else {
      const dist = Math.hypot(coords.x - lastPos.x, coords.y - lastPos.y);
      if (dist >= 35) {
        addEntity(coords.x, coords.y);
        lastAddPosRef.current = coords;
      }
    }
  };

  const handleCanvasMouseUpOrLeave = () => {
    isDraggingRef.current = false;
    lastAddPosRef.current = null;
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    isDraggingRef.current = true;
    if (e.touches.length > 0) {
      const touch = e.touches[0];
      const coords = getCanvasCoords(touch.clientX, touch.clientY);
      if (coords) {
        addEntity(coords.x, coords.y);
        lastAddPosRef.current = coords;
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDraggingRef.current) return;
    if (e.touches.length > 0) {
      const touch = e.touches[0];
      const coords = getCanvasCoords(touch.clientX, touch.clientY);
      if (!coords) return;

      const lastPos = lastAddPosRef.current;
      if (!lastPos) {
        addEntity(coords.x, coords.y);
        lastAddPosRef.current = coords;
      } else {
        const dist = Math.hypot(coords.x - lastPos.x, coords.y - lastPos.y);
        if (dist >= 35) {
          addEntity(coords.x, coords.y);
          lastAddPosRef.current = coords;
        }
      }
    }
  };

  const handleTouchEnd = () => {
    isDraggingRef.current = false;
    lastAddPosRef.current = null;
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 w-full h-full font-['Outfit'] select-none overflow-hidden relative">
      <AnimatePresence>
        {isConfigOpen && (
          <motion.div
            initial={{ opacity: 0, x: isMobile ? 0 : -40, y: isMobile ? -20 : 0 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, x: isMobile ? 0 : -40, y: isMobile ? -20 : 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className={`flex flex-col gap-8 italic overflow-hidden shrink-0 ${isMobile ? 'w-full order-first' : 'w-[320px] h-full'}`}
          >
            <SettingsPanel
              isOpen={isConfigOpen}
              onClose={() => setIsConfigOpen(false)}
              title="Settings"
              className="h-full"
              compact
            >
              <div className="space-y-6">
                <h4 className="text-xs font-black text-primary uppercase tracking-widest leading-none">Config</h4>
                
                <div className="space-y-4">
                  {/* Speed slider */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-text/70 font-black uppercase tracking-wider">Speed</span>
                      <span className="font-black tabular-nums text-text">{speed.toFixed(1)}x</span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="3.0"
                      step="0.1"
                      value={speed}
                      onChange={(e) => {
                        setSpeed(Number(e.target.value));
                        audioEngine.playTick(settings.soundTheme);
                      }}
                      className="w-full accent-primary h-1 bg-border/50 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  {/* Plant Growth % slider */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-text/70 font-black uppercase tracking-wider">Plant Growth %</span>
                      <span className="font-black tabular-nums text-text">{plantGrowthRate}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="1"
                      value={plantGrowthRate}
                      onChange={(e) => {
                        setPlantGrowthRate(Number(e.target.value));
                        audioEngine.playTick(settings.soundTheme);
                      }}
                      className="w-full accent-primary h-1 bg-border/50 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  {/* Rabbit Repro % slider */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-text/70 font-black uppercase tracking-wider">Rabbit Repro %</span>
                      <span className="font-black tabular-nums text-text">{rabbitReproductionChance}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="1"
                      value={rabbitReproductionChance}
                      onChange={(e) => {
                        setRabbitReproductionChance(Number(e.target.value));
                        audioEngine.playTick(settings.soundTheme);
                      }}
                      className="w-full accent-primary h-1 bg-border/50 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  {/* Wolf Repro % slider */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-text/70 font-black uppercase tracking-wider">Wolf Repro %</span>
                      <span className="font-black tabular-nums text-text">{wolfReproductionChance}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="1"
                      value={wolfReproductionChance}
                      onChange={(e) => {
                        setWolfReproductionChance(Number(e.target.value));
                        audioEngine.playTick(settings.soundTheme);
                      }}
                      className="w-full accent-primary h-1 bg-border/50 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                </div>

                <div className="border-t border-border pt-6">
                  <h4 className="text-xs font-black text-primary uppercase tracking-widest leading-none mb-3">Reset</h4>
                  <button
                    onClick={() => {
                      init();
                      setIsConfigOpen(false);
                      audioEngine.playTick(settings.soundTheme);
                    }}
                    className="w-full py-4 bg-surface border-4 border-border text-neutral-400 rounded-3xl font-bold text-xs uppercase tracking-widest hover:border-caution-border hover:text-caution transition-all flex items-center justify-center gap-2"
                  >
                    <RotateCcw size={14} strokeWidth={3} /> Reset Simulation
                  </button>
                </div>
              </div>
            </SettingsPanel>
          </motion.div>
        )}
      </AnimatePresence>

      <ToolPanel
        className="flex-1 font-['Outfit'] select-none italic"
        baseWidth={isMobile ? 600 : 1200}
        baseHeight={isMobile ? 950 : 900}
        fluid={isMobile}
      >
        <div className="w-full h-full flex flex-col gap-6 p-4 lg:p-12">

      {/* Primary Simulation Observation Deck */}
      <div className="flex-[2] bg-border/30 rounded-[4rem] border-4 border-surface flex flex-col relative overflow-hidden group">
        <canvas
          ref={canvasRef}
          width={WIDTH}
          height={HEIGHT}
          className="absolute inset-0 w-full h-full z-10 cursor-crosshair touch-none select-none"
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUpOrLeave}
          onMouseLeave={handleCanvasMouseUpOrLeave}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        />
      </div>

      {/* Analytics Matrix Section at Bottom */}
      <div className="flex-1 flex flex-col gap-8 relative z-20 italic min-h-[300px]">

        {/* Dynamic Analytics Chart */}
        <div className="w-full bg-border/30 px-6 pt-6 pb-4 rounded-[4rem] border-4 border-surface flex flex-col gap-3">
          <div className="flex justify-between items-center px-4">
            <h3 className="text-sm font-black text-primary uppercase tracking-widest leading-none">Population Over Time</h3>
          </div>
          
          <div className="flex-1 bg-surface rounded-[3rem] pt-6 px-6 pb-2 border-4 border-background relative flex flex-col justify-between overflow-hidden">
            {/* Y-Axis Label */}
            <div className="absolute left-2 top-1/2 -translate-y-1/2 -rotate-90 origin-left text-[9px] font-black text-text/50 uppercase tracking-widest z-20 pointer-events-none">
              Population
            </div>
            
            {/* Chart Area */}
            <div className="flex-1 min-h-0 w-full relative pl-4 pb-1">
              <div ref={graphRef} className="ct-chart h-full w-full" />
            </div>

            {/* X-Axis Label */}
            <div className="text-center text-[9px] font-black text-text/50 uppercase tracking-widest mt-0 z-20 pointer-events-none">
              Time (ticks)
            </div>
          </div>

          {/* Legend / Paint brush selectors */}
          <div className="flex flex-wrap justify-center items-center gap-4 text-xs font-black uppercase tracking-wider px-2">
            {[
              { id: 'grass', emoji: '🌱', label: 'Plants', count: stats.grass, border: 'border-success/30 hover:border-success', activeBg: 'bg-success text-white border-success' },
              { id: 'rabbit', emoji: '🐇', label: 'Rabbits', count: stats.rabbits, border: 'border-primary/30 hover:border-primary', activeBg: 'bg-primary text-white border-primary' },
              { id: 'wolf', emoji: '🐺', label: 'Wolves', count: stats.wolves, border: 'border-caution/30 hover:border-caution', activeBg: 'bg-caution text-white border-caution' }
            ].map(type => (
              <button
                key={type.id}
                onClick={() => { setSelectedType(type.id); audioEngine.playTick(settings.soundTheme); }}
                className={`flex items-center gap-3 px-6 py-3 rounded-2xl border-2 transition-all active:scale-95 ${
                  selectedType === type.id
                    ? `${type.activeBg} scale-105`
                    : `bg-surface/60 text-text/70 ${type.border}`
                }`}
              >
                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                  type.id === 'grass' ? 'bg-success' : type.id === 'rabbit' ? 'bg-primary' : 'bg-caution'
                }`} />
                <span className="text-base leading-none">{type.emoji}</span>
                <span>{type.label} ({type.count})</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        .ct-series-a .ct-line { stroke: var(--color-success-text) !important; stroke-width: 4px; stroke-linecap: round; }
        .ct-series-b .ct-line { stroke: var(--color-primary) !important; stroke-width: 4px; stroke-linecap: round; }
        .ct-series-c .ct-line { stroke: var(--color-caution-text) !important; stroke-width: 4px; stroke-linecap: round; }
        .ct-series-a .ct-point { stroke: var(--color-success-text) !important; stroke-width: 8px; }
        .ct-series-b .ct-point { stroke: var(--color-primary) !important; stroke-width: 8px; }
        .ct-series-c .ct-point { stroke: var(--color-caution-text) !important; stroke-width: 8px; }
        .ct-label { color: var(--color-neutral-400) !important; font-size: 10px !important; font-weight: 900 !important; font-family: 'Outfit' !important; font-style: italic !important; text-transform: uppercase !important; }
        .ct-grid { stroke: var(--color-border) !important; stroke-dasharray: 0 !important; }
        .ct-grid.ct-horizontal { stroke: var(--color-border) !important; }
        .ct-grid.ct-vertical { stroke: transparent !important; }
        .ct-grids .ct-horizontal:first-of-type,
        .ct-grids .ct-horizontal:last-of-type {
          stroke: #000000 !important;
          stroke-width: 1.5px !important;
        }
        .ct-grids .ct-vertical:first-of-type {
          stroke: #000000 !important;
          stroke-width: 1.5px !important;
        }
      `}} />
        </div>
      </ToolPanel>
    </div>
  );
};

export default EcosystemSimulation;
