import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dog, MousePointer2, Play, Pause, RotateCcw,
  TrendingUp, Activity, Settings, Info, ChevronRight,
  ShieldCheck, AlertCircle
} from 'lucide-react';
import { LineChart } from 'chartist';
import 'chartist/dist/index.css';
import { ToolHeader } from '../ToolHeader';
import { WIDTH, HEIGHT, INITIAL_RABBITS, INITIAL_WOLVES, INITIAL_GRASS, SIM_CONFIG } from './EcosystemSimulation/simData';

export const EcosystemSimulation = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [stats, setStats] = useState({ grass: INITIAL_GRASS, rabbits: INITIAL_RABBITS, wolves: INITIAL_WOLVES });
  const [history, setHistory] = useState([]);
  const [selectedType, setSelectedType] = useState('rabbit');
  const [speed, setSpeed] = useState(1);
  const [plantGrowthRate, setPlantGrowthRate] = useState(SIM_CONFIG.grass.growthRate);
  const [rabbitThreshold, setRabbitThreshold] = useState(SIM_CONFIG.rabbit.splitHealth);
  const [wolfThreshold, setWolfThreshold] = useState(SIM_CONFIG.wolf.splitHealth);
  const [rabbitDetectionRange, setRabbitDetectionRange] = useState(SIM_CONFIG.rabbit.detectionRange);
  const [wolfDetectionRange, setWolfDetectionRange] = useState(SIM_CONFIG.wolf.detectionRange);
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 });
  const dimensionsRef = useRef({ width: 800, height: 500 });
  const [showConfig, setShowConfig] = useState(true);
  const containerRef = useRef(null);
  const BORDER_MARGIN = 40;

  const simulationRef = useRef({
    rabbits: [],
    wolves: [],
    grass: [],
    markers: [],
    frameCount: 0
  });
  const historyRef = useRef([]);

  const canvasRef = useRef(null);
  const graphRef = useRef(null);
  const requestRef = useRef();
  const chartInstance = useRef(null);

  // Initialization
  const init = () => {
    const { width, height } = dimensionsRef.current;
    const rabbits = [];
    for (let i = 0; i < INITIAL_RABBITS; i++) {
      rabbits.push({
        x: BORDER_MARGIN + Math.random() * (width - BORDER_MARGIN * 2),
        y: BORDER_MARGIN + Math.random() * (height - BORDER_MARGIN * 2),
        health: SIM_CONFIG.rabbit.initialHealth,
        age: 0,
        id: Math.random(),
        pushX: 0,
        pushY: 0,
        heading: Math.random() * Math.PI * 2
      });
    }

    const wolves = [];
    for (let i = 0; i < INITIAL_WOLVES; i++) {
      wolves.push({
        x: BORDER_MARGIN + Math.random() * (width - BORDER_MARGIN * 2),
        y: BORDER_MARGIN + Math.random() * (height - BORDER_MARGIN * 2),
        health: SIM_CONFIG.wolf.initialHealth,
        age: 0,
        id: Math.random(),
        pushX: 0,
        pushY: 0,
        heading: Math.random() * Math.PI * 2
      });
    }

    const grass = [];
    for (let i = 0; i < INITIAL_GRASS; i++) {
      grass.push({
        x: BORDER_MARGIN + Math.random() * (width - BORDER_MARGIN * 2),
        y: BORDER_MARGIN + Math.random() * (height - BORDER_MARGIN * 2),
        id: Math.random()
      });
    }

    simulationRef.current = { rabbits, wolves, grass, markers: [], frameCount: 0 };

    // Pre-populate history with initial stats (need at least 2 points for Chartist)
    const initialStats = { grass: INITIAL_GRASS, rabbits: INITIAL_RABBITS, wolves: INITIAL_WOLVES };
    historyRef.current = [initialStats, initialStats];
    setHistory([initialStats, initialStats]);
    setStats(initialStats);

    // Clear Chartist instance on reset
    if (chartInstance.current) {
      chartInstance.current.detach();
      chartInstance.current = null;
    }

    // Initial draw and chart update
    setTimeout(() => {
      draw();
      updateChart();
    }, 0);
  };

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { clientWidth, clientHeight } = containerRef.current;
        setDimensions({ width: clientWidth, height: clientHeight });
        dimensionsRef.current = { width: clientWidth, height: clientHeight };
      }
    };

    updateDimensions();
    const resizeObserver = new ResizeObserver(updateDimensions);
    if (containerRef.current) resizeObserver.observe(containerRef.current);

    // Wait a tiny bit for the layout to settle before initializing entities
    setTimeout(init, 50);
    return () => {
      cancelAnimationFrame(requestRef.current);
      resizeObserver.disconnect();
    };
  }, []);

  const update = () => {
    if (!isPlaying) return;

    const sim = simulationRef.current;
    sim.frameCount++;

    // 1. Grass Growth (Density-Aware)
    // Invert plantGrowthRate logic: higher slider = faster growth
    const growthInterval = Math.max(1, Math.floor((21 - plantGrowthRate) / speed));
    if (sim.frameCount % growthInterval === 0) {
      if (sim.grass.length < SIM_CONFIG.grass.max) {
        // Try several random spots and pick the most empty one
        let bestX = BORDER_MARGIN + Math.random() * (dimensions.width - BORDER_MARGIN * 2);
        let bestY = BORDER_MARGIN + Math.random() * (dimensions.height - BORDER_MARGIN * 2);
        let minDensity = Infinity;

        for (let i = 0; i < 5; i++) {
          const tx = BORDER_MARGIN + Math.random() * (dimensions.width - BORDER_MARGIN * 2);
          const ty = BORDER_MARGIN + Math.random() * (dimensions.height - BORDER_MARGIN * 2);

          // Calculate local density (grass + rabbits + wolves nearby)
          let density = 0;
          sim.grass.forEach(g => { if (Math.hypot(tx - g.x, ty - g.y) < 60) density += 1; });
          sim.rabbits.forEach(r => { if (Math.hypot(tx - r.x, ty - r.y) < 60) density += 2; });
          sim.wolves.forEach(w => { if (Math.hypot(tx - w.x, ty - w.y) < 60) density += 4; });

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
    let nextRabbits = [];
    sim.rabbits.forEach(r => {
      // Movement (Track nearest grass)
      let nearestGrass = null;
      let minGrassDist = rabbitDetectionRange;
      sim.grass.forEach(g => {
        const d = Math.sqrt(Math.pow(r.x - g.x, 2) + Math.pow(r.y - g.y, 2));
        if (d < minGrassDist) {
          minGrassDist = d;
          nearestGrass = g;
        }
      });

      let dx = 0, dy = 0;
      if (nearestGrass && Math.random() > 0.005) {
        const targetAngle = Math.atan2(nearestGrass.y - r.y, nearestGrass.x - r.x);
        const diff = targetAngle - (r.heading || 0);
        r.heading = (r.heading || 0) + Math.atan2(Math.sin(diff), Math.cos(diff)) * 0.15;
        // Add a tiny bit of "wobble" even when tracking
        r.heading += (Math.random() - 0.5) * 0.05;
        dx = Math.cos(r.heading) * SIM_CONFIG.rabbit.speed;
        dy = Math.sin(r.heading) * SIM_CONFIG.rabbit.speed;
      } else {
        // Smooth wander: random changes are filtered to avoid jitter
        r.wanderNoise = (r.wanderNoise || 0) * 0.8 + (Math.random() - 0.5) * 0.5;
        r.heading = (r.heading || 0) + r.wanderNoise * 0.1;
        dx = Math.cos(r.heading) * (SIM_CONFIG.rabbit.speed * 0.5);
        dy = Math.sin(r.heading) * (SIM_CONFIG.rabbit.speed * 0.5);
      }

      let nextX_raw = r.x + (dx + (r.pushX || 0)) * speed;
      let nextY_raw = r.y + (dy + (r.pushY || 0)) * speed;

      // Wall Bouncing
      if (nextX_raw <= BORDER_MARGIN || nextX_raw >= dimensions.width - BORDER_MARGIN) {
        r.heading = Math.PI - (r.heading || 0);
        nextX_raw = Math.max(BORDER_MARGIN, Math.min(dimensions.width - BORDER_MARGIN, nextX_raw));
      }
      if (nextY_raw <= BORDER_MARGIN || nextY_raw >= dimensions.height - BORDER_MARGIN) {
        r.heading = -(r.heading || 0);
        nextY_raw = Math.max(BORDER_MARGIN, Math.min(dimensions.height - BORDER_MARGIN, nextY_raw));
      }

      r.x = nextX_raw;
      r.y = nextY_raw;

      if (r.pushX) r.pushX *= 0.8;
      if (r.pushY) r.pushY *= 0.8;

      // Stop push after ~1 second (60 frames at base speed)
      r.pushAge = (r.pushAge || 0) + (1 * speed);
      if (r.pushAge > 60) {
        r.pushX = 0;
        r.pushY = 0;
      }

      // Metabolism
      r.health -= SIM_CONFIG.rabbit.metabolism * speed;
      r.age += 0.1 * speed;

      // Eating
      const grassIndex = sim.grass.findIndex(g =>
        Math.sqrt(Math.pow(r.x - g.x, 2) + Math.pow(r.y - g.y, 2)) < 10
      );
      if (grassIndex !== -1) {
        sim.grass.splice(grassIndex, 1);
        r.health += SIM_CONFIG.grass.healthValue;
      }

      // Reproduction (Split)
      if (r.health >= rabbitThreshold && sim.rabbits.length < SIM_CONFIG.rabbit.max) {
        const angle = Math.random() * Math.PI * 2;
        const push = SIM_CONFIG.rabbit.speed;
        for (let i = 0; i < 2; i++) {
          nextRabbits.push({
            x: r.x + (i === 0 ? 2 : -2),
            y: r.y + (i === 0 ? 2 : -2),
            id: Math.random(),
            health: SIM_CONFIG.rabbit.offspringHealth,
            age: 0,
            pushX: Math.cos(angle + (i === 0 ? 0 : Math.PI)) * push,
            pushY: Math.sin(angle + (i === 0 ? 0 : Math.PI)) * push,
            heading: angle + (i === 0 ? 0 : Math.PI)
          });
        }
      } else if (r.health > 0 && r.age < SIM_CONFIG.rabbit.maxAge) {
        nextRabbits.push(r);
      } else {
        sim.markers.push({ x: r.x, y: r.y, type: 'bone', timeLeft: 30 });
      }
    });
    sim.rabbits = nextRabbits;

    // 3. Wolf Logic
    let nextWolves = [];
    sim.wolves.forEach(w => {
      // Movement (Track nearest rabbit)
      let target = null;
      let minDist = wolfDetectionRange;
      sim.rabbits.forEach(r => {
        const d = Math.sqrt(Math.pow(w.x - r.x, 2) + Math.pow(w.y - r.y, 2));
        if (d < minDist) {
          minDist = d;
          target = r;
        }
      });

      let dx = 0, dy = 0;
      if (target && Math.random() > 0.002) {
        const targetAngle = Math.atan2(target.y - w.y, target.x - w.x);
        const diff = targetAngle - (w.heading || 0);
        w.heading = (w.heading || 0) + Math.atan2(Math.sin(diff), Math.cos(diff)) * 0.1;
        // Wolves wobble less as they are more focused
        w.heading += (Math.random() - 0.5) * 0.02;
        dx = Math.cos(w.heading) * SIM_CONFIG.wolf.speed;
        dy = Math.sin(w.heading) * SIM_CONFIG.wolf.speed;
      } else {
        // Smooth wander for wolves
        w.wanderNoise = (w.wanderNoise || 0) * 0.8 + (Math.random() - 0.5) * 0.4;
        w.heading = (w.heading || 0) + w.wanderNoise * 0.08;
        dx = Math.cos(w.heading) * (SIM_CONFIG.wolf.speed * 0.7);
        dy = Math.sin(w.heading) * (SIM_CONFIG.wolf.speed * 0.7);
      }

      let nextX_raw = w.x + (dx + (w.pushX || 0)) * speed;
      let nextY_raw = w.y + (dy + (w.pushY || 0)) * speed;

      // Wall Bouncing
      if (nextX_raw <= BORDER_MARGIN || nextX_raw >= dimensions.width - BORDER_MARGIN) {
        w.heading = Math.PI - (w.heading || 0);
        nextX_raw = Math.max(BORDER_MARGIN, Math.min(dimensions.width - BORDER_MARGIN, nextX_raw));
      }
      if (nextY_raw <= BORDER_MARGIN || nextY_raw >= dimensions.height - BORDER_MARGIN) {
        w.heading = -(w.heading || 0);
        nextY_raw = Math.max(BORDER_MARGIN, Math.min(dimensions.height - BORDER_MARGIN, nextY_raw));
      }

      w.x = nextX_raw;
      w.y = nextY_raw;

      if (w.pushX) w.pushX *= 0.8;
      if (w.pushY) w.pushY *= 0.8;

      // Stop push after ~1 second
      w.pushAge = (w.pushAge || 0) + (1 * speed);
      if (w.pushAge > 60) {
        w.pushX = 0;
        w.pushY = 0;
      }

      // Metabolism
      w.health -= SIM_CONFIG.wolf.metabolism * speed;
      w.age += 0.05 * speed;

      // Hunting
      const rabbitIndex = sim.rabbits.findIndex(r =>
        Math.sqrt(Math.pow(w.x - r.x, 2) + Math.pow(w.y - r.y, 2)) < 10
      );
      if (rabbitIndex !== -1) {
        sim.rabbits.splice(rabbitIndex, 1);
        w.health += 1; // Health +1 as per request
      }

      // Reproduction (Split)
      if (w.health >= wolfThreshold && sim.wolves.length < SIM_CONFIG.wolf.max) {
        const angle = Math.random() * Math.PI * 2;
        const push = SIM_CONFIG.wolf.speed;
        for (let i = 0; i < 2; i++) {
          nextWolves.push({
            x: w.x + (i === 0 ? 2 : -2),
            y: w.y + (i === 0 ? 2 : -2),
            id: Math.random(),
            health: SIM_CONFIG.wolf.offspringHealth,
            age: 0,
            pushX: Math.cos(angle + (i === 0 ? 0 : Math.PI)) * push,
            pushY: Math.sin(angle + (i === 0 ? 0 : Math.PI)) * push,
            heading: angle + (i === 0 ? 0 : Math.PI)
          });
        }
      } else if (w.health > 0 && w.age < SIM_CONFIG.wolf.maxAge) {
        nextWolves.push(w);
      } else {
        sim.markers.push({ x: w.x, y: w.y, type: 'skull', timeLeft: 30 });
      }
    });
    sim.wolves = nextWolves;

    // Stats and History
    if (sim.frameCount % 20 === 0) {
      const newStats = { grass: sim.grass.length, rabbits: sim.rabbits.length, wolves: sim.wolves.length };
      setStats(newStats);
      historyRef.current = [...historyRef.current, newStats].slice(-100);
      setHistory(historyRef.current);
      updateChart();
    }

    // Update Markers
    sim.markers = sim.markers.filter(m => {
      m.timeLeft -= 1 * speed;
      return m.timeLeft > 0;
    });

    draw();
  };

  const updateRef = useRef(update);
  useEffect(() => {
    updateRef.current = update;
  }, [update]);

  useEffect(() => {
    let animationId;
    const loop = () => {
      if (isPlaying) {
        updateRef.current();
        animationId = requestAnimationFrame(loop);
      }
    };

    if (isPlaying) {
      animationId = requestAnimationFrame(loop);
    } else {
      cancelAnimationFrame(animationId);
    }

    return () => cancelAnimationFrame(animationId);
  }, [isPlaying]);

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const sim = simulationRef.current;
    const { width, height } = dimensionsRef.current;

    ctx.clearRect(0, 0, width, height);

    // Draw Brown Border
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 16;
    ctx.beginPath();
    ctx.roundRect(8, 8, width - 16, height - 16, 40);
    ctx.stroke();

    // Draw Grass
    sim.grass.forEach(g => {
      ctx.font = '4px serif';
      ctx.fillText('🌱', g.x - 2, g.y + 2);
    });

    // Draw Rabbits
    sim.rabbits.forEach(r => {
      ctx.font = '8px serif';
      ctx.fillText('🐇', r.x - 4, r.y + 4);
    });

    // Draw Wolves
    sim.wolves.forEach(w => {
      ctx.font = '11px serif';
      ctx.fillText('🐺', w.x - 5, w.y + 5);
    });

    // Draw Markers
    ctx.font = '6px serif';
    sim.markers.forEach(m => {
      ctx.fillText(m.type === 'bone' ? '🦴' : '💀', m.x - 5, m.y + 5);
    });
  };

  const updateChart = () => {
    const history = historyRef.current;
    if (!graphRef.current || history.length < 2) return;

    const data = {
      labels: history.map((_, i) => i),
      series: [
        history.map(s => s.grass),
        history.map(s => s.rabbits),
        history.map(s => s.wolves)
      ]
    };

    const options = {
      showPoint: false,
      lineSmooth: true,
      axisX: { showGrid: false, showLabel: false },
      axisY: { offset: 30 },
      height: '100%',
      fullWidth: true,
      chartPadding: { right: 10, left: 10, top: 10, bottom: 0 }
    };

    if (!chartInstance.current) {
      chartInstance.current = new LineChart(graphRef.current, data, options);
    } else {
      chartInstance.current.update(data, options);
    }
  };

  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = dimensions.width / rect.width;
    const scaleY = dimensions.height / rect.height;

    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const sim = simulationRef.current;

    if (selectedType === 'grass') {
      sim.grass.push({ x, y, id: Math.random() });
    } else if (selectedType === 'rabbit') {
      sim.rabbits.push({ x, y, health: SIM_CONFIG.rabbit.initialHealth, age: 0, id: Math.random(), pushX: 0, pushY: 0, heading: Math.random() * Math.PI * 2 });
    } else if (selectedType === 'wolf') {
      sim.wolves.push({ x, y, health: SIM_CONFIG.wolf.initialHealth, age: 0, id: Math.random(), pushX: 0, pushY: 0, heading: Math.random() * Math.PI * 2 });
    }
  };

  // Removed old isPlaying/speed useEffect

  return (
    <div className="max-w-[1400px] mx-auto min-h-0 h-full flex flex-col gap-1 px-4 pt-1 pb-1 select-none overflow-hidden">
      <ToolHeader
        title="Ecosystem Simulation"
        icon={Activity}
        description="Scientific Predator-Prey Model"
        infoContent={
          <>
            <p>
              <strong className="text-white block mb-1">The Food Web</strong>
              Watch how energy flows from Grass (Producer) to Rabbits (Primary Consumer) and then to Wolves (Secondary Consumer).
            </p>
            <p>
              <strong className="text-white block mb-1">Dynamic Balance</strong>
              If one species overpopulates, it impacts the entire system. Observe the oscillating cycles in the population graph below.
            </p>
          </>
        }
      >
        <div className="flex items-center gap-4">
          <div className="bg-slate-50 p-1.5 rounded-2xl border border-slate-100 flex items-center gap-1">
            {[1, 2, 5].map(s => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                className={`px-3 py-1.5 rounded-xl font-black text-[10px] transition-all ${speed === s ? 'bg-white text-emerald-600 shadow-md' : 'text-slate-400'}`}
              >
                {s}x
              </button>
            ))}
          </div>
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`px-4 py-2 rounded-xl transition-all shadow-lg active:scale-95 flex items-center gap-2 font-black text-sm ${isPlaying ? 'bg-amber-50 text-amber-600' : 'bg-emerald-600 text-white shadow-emerald-100'
              }`}
          >
            {isPlaying ? <Pause size={18} /> : <Play size={18} />}
            {isPlaying ? 'PAUSE' : 'START'}
          </button>
          <button
            onClick={init}
            className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-red-50 hover:text-red-600 transition-all active:scale-95"
            title="Reset Simulation"
          >
            <RotateCcw size={20} />
          </button>
          <button
            onClick={() => setShowConfig(!showConfig)}
            className={`p-3 rounded-xl transition-all active:scale-95 flex items-center ${showConfig ? 'bg-emerald-600 text-white shadow-lg' : 'bg-slate-50 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600'
              }`}
            title="Toggle Configuration"
          >
            <Settings size={20} />
          </button>
        </div>
      </ToolHeader>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-2 min-h-0 h-full overflow-hidden">
        {/* Main Simulation View */}
        <div className={`${showConfig ? 'lg:col-span-8' : 'lg:col-span-12'} flex flex-col gap-2 min-h-0 transition-all duration-500`}>
          <div ref={containerRef} className="flex-[2] min-h-0 bg-white rounded-[1.5rem] shadow-2xl border-4 border-white overflow-hidden relative shadow-emerald-900/5">
            <div className="absolute inset-0 bg-[#f8fafc] opacity-50" style={{ backgroundImage: 'radial-gradient(#e2e8f0 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
            <canvas
              ref={canvasRef}
              width={dimensions.width}
              height={dimensions.height}
              className="absolute inset-0 w-full h-full cursor-pointer z-10"
              onClick={handleCanvasClick}
            />

            {/* Real-time Overlay Labels */}
            <div className="absolute bottom-6 left-6 z-20 flex gap-4">
              <button
                onClick={() => setSelectedType('grass')}
                className={`px-4 py-2 backdrop-blur-md rounded-xl border transition-all flex items-center gap-3 shadow-lg active:scale-95 ${selectedType === 'grass'
                  ? 'bg-emerald-500 text-white border-emerald-400 ring-4 ring-emerald-500/20'
                  : 'bg-white/80 text-slate-700 border-slate-200'
                  }`}
              >
                <span className="text-sm">🌱</span>
                <span className="font-black">{stats.grass}</span>
              </button>
              <button
                onClick={() => setSelectedType('rabbit')}
                className={`px-4 py-2 backdrop-blur-md rounded-xl border transition-all flex items-center gap-3 shadow-lg active:scale-95 ${selectedType === 'rabbit'
                  ? 'bg-slate-700 text-white border-slate-600 ring-4 ring-slate-700/20'
                  : 'bg-white/80 text-slate-700 border-slate-200'
                  }`}
              >
                <span className="text-base">🐇</span>
                <span className="font-black">{stats.rabbits}</span>
              </button>
              <button
                onClick={() => setSelectedType('wolf')}
                className={`px-4 py-2 backdrop-blur-md rounded-xl border transition-all flex items-center gap-3 shadow-lg active:scale-95 ${selectedType === 'wolf'
                  ? 'bg-red-500 text-white border-red-400 ring-4 ring-red-500/20'
                  : 'bg-white/80 text-slate-700 border-slate-200'
                  }`}
              >
                <span className="text-base">🐺</span>
                <span className="font-black">{stats.wolves}</span>
              </button>
            </div>
          </div>

          {/* Graph Section */}
          <div className="bg-white rounded-[1.2rem] p-2 shadow-xl border border-gray-100 flex-1 flex flex-col gap-1 overflow-hidden shrink-0">
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
            <div className="flex-1 relative mt-2 bg-slate-50/50 rounded-2xl overflow-hidden p-4">
              <div ref={graphRef} className="ct-chart h-full w-full" />
            </div>
          </div>
        </div>

        {/* Simulation Settings & Concepts Sidebar */}
        <AnimatePresence>
          {showConfig && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="lg:col-span-4 flex flex-col gap-2 overflow-y-auto pr-1 h-full scrollbar-thin scrollbar-thumb-slate-200"
            >
              {/* Simulation Config Area */}
              <div className="bg-white rounded-[1.2rem] p-2 shadow-xl border border-gray-100 flex flex-col gap-1">
                <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                  <Settings size={16} className="text-emerald-600" />
                  Simulation Config
                </h3>
                <div className="space-y-1">
                  {/* Plant Growth Rate */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <span className="text-xs">🌱</span>
                        Plant Growth
                      </h4>
                      <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">
                        {plantGrowthRate.toFixed(1)}/second
                      </span>
                    </div>
                    <div className="relative pt-1 px-1">
                      <input
                        type="range"
                        min="1"
                        max="40"
                        step="1"
                        value={plantGrowthRate}
                        onChange={(e) => setPlantGrowthRate(parseFloat(e.target.value))}
                        className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                      />
                      <div className="flex justify-between mt-1 px-0.5">
                        {[1, 5, 10, 15, 20].map(v => (
                          <div key={v} className="flex flex-col items-center">
                            <div className="w-0.5 h-1 bg-slate-200" />
                            <span className="text-[8px] font-bold text-slate-300 mt-0.5">{v}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Rabbit Breeding Threshold */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <span className="text-base leading-none">🐇</span>
                        Rabbit Breed Threshold
                      </h4>
                      <span className="text-xs font-black text-slate-600 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-100">
                        {rabbitThreshold.toFixed(1)} food
                      </span>
                    </div>
                    <div className="relative pt-1 px-1">
                      <input
                        type="range"
                        min="1"
                        max="10"
                        step="0.5"
                        value={rabbitThreshold}
                        onChange={(e) => setRabbitThreshold(parseFloat(e.target.value))}
                        className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-slate-700"
                      />
                      <div className="flex justify-between mt-1 px-0.5">
                        {[1, 5, 10].map(v => (
                          <div key={v} className="flex flex-col items-center">
                            <div className="w-0.5 h-1 bg-slate-200" />
                            <span className="text-[8px] font-bold text-slate-300 mt-0.5">{v}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Wolf Breeding Threshold */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <span className="text-base leading-none">🐺</span>
                        Wolf Breed Threshold
                      </h4>
                      <span className="text-xs font-black text-red-600 bg-red-50 px-2 py-0.5 rounded-lg border border-red-100">
                        {wolfThreshold.toFixed(1)} food
                      </span>
                    </div>
                    <div className="relative pt-1 px-1">
                      <input
                        type="range"
                        min="1"
                        max="15"
                        step="0.5"
                        value={wolfThreshold}
                        onChange={(e) => setWolfThreshold(parseFloat(e.target.value))}
                        className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-red-500"
                      />
                      <div className="flex justify-between mt-1 px-0.5">
                        {[1, 5, 10, 15].map(v => (
                          <div key={v} className="flex flex-col items-center">
                            <div className="w-0.5 h-1 bg-slate-200" />
                            <span className="text-[8px] font-bold text-slate-300 mt-0.5">{v}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Scientific Concepts Card (Moved) */}
              <div className="bg-white rounded-[1.2rem] p-4 shadow-xl border border-gray-100 flex flex-col gap-4">
                <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                  <Info size={16} className="text-emerald-600" />
                  Ecology 101
                </h3>
                <div className="space-y-4">
                  <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-100/50">
                    <h4 className="text-[10px] font-black text-emerald-700 uppercase tracking-widest flex items-center gap-2 mb-1.5">
                      <ShieldCheck size={14} />
                      The Food Chain
                    </h4>
                    <p className="text-[11px] font-medium text-slate-600 leading-relaxed">
                      Energy starts with <b>Producers</b> (Grass), moves to <b>Primary Consumers</b> (Rabbits), and ends at <b>Predators</b> (Wolves).
                    </p>
                  </div>

                  <div className="bg-amber-50/50 p-3 rounded-xl border border-amber-100/50">
                    <h4 className="text-[10px] font-black text-amber-700 uppercase tracking-widest flex items-center gap-2 mb-1.5">
                      <AlertCircle size={14} />
                      Dynamic Equilibrium
                    </h4>
                    <p className="text-[11px] font-medium text-slate-600 leading-relaxed">
                      Population sizes naturally oscillate. High prey counts lead to predator spikes, which eventually reduces prey and then predators.
                    </p>
                  </div>

                  <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100/50">
                    <h4 className="text-[10px] font-black text-blue-700 uppercase tracking-widest flex items-center gap-2 mb-1.5">
                      <Activity size={14} />
                      Carrying Capacity
                    </h4>
                    <p className="text-[11px] font-medium text-slate-600 leading-relaxed">
                      The maximum population an environment can sustain is limited by <b>resources</b> (Grass) and <b>space</b>.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <style dangerouslySetInnerHTML={{
        __html: `
        .ct-series-a .ct-line { stroke: #4ade80 !important; stroke-width: 3px; }
        .ct-series-b .ct-line { stroke: #94a3b8 !important; stroke-width: 3px; }
        .ct-series-c .ct-line { stroke: #ef4444 !important; stroke-width: 5px; }
        .ct-label { color: #94a3b8 !important; font-size: 10px !important; font-weight: 900 !important; }
        .ct-grid { stroke: #f1f5f9 !important; }
        .ct-grid.ct-horizontal:last-of-type { stroke: #000 !important; stroke-width: 3px; stroke-opacity: 1; }
      `}} />
    </div>
  );
};
