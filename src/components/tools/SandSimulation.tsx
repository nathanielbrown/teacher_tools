import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Square, 
  Droplet, 
  Flame, 
  Grid, 
  Eraser, 
  Trash2, 
  Play, 
  Pause, 
  Settings2, 
  Sparkles, 
  MousePointer2, 
  Hammer, 
  Zap,
  Thermometer, 
  FlaskConical, 
  Sprout, 
  Wind, 
  Infinity as InfIcon, 
  Snowflake, 
  X, 
  Info,
  Activity,
  BrainCircuit,
  Volume2
} from 'lucide-react';
import { useHeader } from '../../contexts/HeaderContext';
import { useSettings } from '../../contexts/SettingsContext';
import { audioEngine } from '../../utils/audio';

// 1. Constants
const GRID_SIZE = 120;
const CELL_SIZE = 5;

const MATERIALS = [
  { id: 0, label: 'Eraser', icon: Eraser, color: '#f8fafc', behavior: 'empty' },
  { id: 1, label: 'Wall', icon: Square, color: '#475569', behavior: 'static' },
  { id: 2, label: 'Dirt', icon: Grid, color: '#451a03', behavior: 'falling' },
  { id: 3, label: 'Water', icon: Droplet, color: '#3b82f6', behavior: 'liquid' },
  { id: 4, label: 'Wood', icon: Hammer, color: '#78350f', behavior: 'flammable' },
  { id: 5, label: 'Fire', icon: Flame, color: '#ef4444', behavior: 'gas' },
  { id: 6, label: 'Oil', icon: Zap, color: '#1e293b', behavior: 'flammable-liquid' },
  { id: 7, label: 'Lava', icon: Thermometer, color: '#f97316', behavior: 'hot-liquid' },
  { id: 8, label: 'Acid', icon: FlaskConical, color: '#a3e635', behavior: 'corrosive' },
  { id: 9, label: 'Plant', icon: Sprout, color: '#22c55e', behavior: 'living' },
  { id: 10, label: 'Ice', icon: Snowflake, color: '#bae6fd', behavior: 'melting' },
  { id: 11, label: 'Steam', icon: Wind, color: '#e2e8f0', behavior: 'rising' },
  { id: 12, label: 'Generator', icon: InfIcon, color: '#a855f7', behavior: 'generator' },
];

// 2. Config (None)

// 3. Text (Help and Info)
const HELP_INFO = (
  <div className="space-y-4 font-['Outfit']">
    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Particle Physics Lab</h3>
    <div className="space-y-3">
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-primary/5 flex items-center justify-center text-xs font-black text-primary shrink-0">1</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">Select an <b>Element</b> from the sidebar and click/drag on the canvas to paint particles.</p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center text-xs font-black text-blue-600 shrink-0">2</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">Enable <b>Emitter Mode</b> (Infinity icon) to turn any placed pixel into a continuous source.</p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-success-bg flex items-center justify-center text-xs font-black text-success shrink-0">3</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">Observe <b>Complex Interactions</b>: Water creates Steam with Fire, and Lava turns into Stone with Water.</p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-warning-bg flex items-center justify-center text-xs font-black text-warning shrink-0">4</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">Use <b>Pause</b> to design frozen structures before resuming the simulation logic.</p>
      </div>
    </div>
  </div>
);

// 4. Local Storage (None)

// 5. Classes (None)

// 6. Functions (None)

// 7. Component
export const SandSimulation = () => {
  const { setHeaderActions, setHelpContent, setOnReset, clearHeader } = useHeader();
  const { settings } = useSettings();
  
  const [selectedMaterial, setSelectedMaterial] = useState(2);
  const [brushSize, setBrushSize] = useState(3);
  const [isPaused, setIsPaused] = useState(false);
  const [isGeneratorMode, setIsGeneratorMode] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gridRef = useRef(new Uint8Array(GRID_SIZE * GRID_SIZE));
  const nextGridRef = useRef(new Uint8Array(GRID_SIZE * GRID_SIZE));
  const sourceGridRef = useRef(new Uint8Array(GRID_SIZE * GRID_SIZE));
  const drawQueueRef = useRef<any[]>([]);
  const requestRef = useRef<number>(0);
  
  const updateRef = useRef<() => void>(() => {});
  const getIdx = (x: number, y: number) => y * GRID_SIZE + x;

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const grid = gridRef.current;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const cell = grid[getIdx(x, y)];
        if (cell !== 0) {
          ctx.fillStyle = MATERIALS[cell].color;
          ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        }
      }
    }
  }, []);

  const update = useCallback(() => {
    if (isPaused) return;

    const currentGrid = gridRef.current;
    const nextGrid = nextGridRef.current;
    
    while (drawQueueRef.current.length > 0) {
      const { x, y, material, isGenerator } = drawQueueRef.current.shift();
      const idx = getIdx(x, y);
      const oldMat = currentGrid[idx];
      
      if (material === 0) {
        currentGrid[idx] = 0;
        sourceGridRef.current[idx] = 0;
      } else if (isGenerator) { 
        currentGrid[idx] = 12;
        sourceGridRef.current[idx] = material;
      } else if (oldMat === 12) {
        sourceGridRef.current[idx] = material;
      } else {
        currentGrid[idx] = material;
      }
    }

    nextGrid.set(currentGrid);
    const scanDir = (Math.floor(Date.now() / 16) % 2 === 0);

    for (let y = GRID_SIZE - 1; y >= 0; y--) {
      for (let x_base = 0; x_base < GRID_SIZE; x_base++) {
        const x = scanDir ? x_base : (GRID_SIZE - 1 - x_base);
        const i = getIdx(x, y);
        const cell = currentGrid[i];

        if (cell === 0) continue;
        const material = MATERIALS[cell];
        if (material.behavior === 'static') continue;

        if (material.behavior === 'falling') {
          if (y < GRID_SIZE - 1 && nextGrid[getIdx(x, y + 1)] === 0) {
            nextGrid[i] = 0;
            nextGrid[getIdx(x, y + 1)] = cell;
          } else if (y < GRID_SIZE - 1 && x > 0 && nextGrid[getIdx(x - 1, y + 1)] === 0) {
            nextGrid[i] = 0;
            nextGrid[getIdx(x - 1, y + 1)] = cell;
          } else if (y < GRID_SIZE - 1 && x < GRID_SIZE - 1 && nextGrid[getIdx(x + 1, y + 1)] === 0) {
            nextGrid[i] = 0;
            nextGrid[getIdx(x + 1, y + 1)] = cell;
          }
        } 
        else if (material.behavior === 'liquid' || material.behavior === 'flammable-liquid' || material.behavior === 'hot-liquid' || material.behavior === 'corrosive') {
          const neighbors = [
            { nx: x, ny: y + 1 }, { nx: x - 1, ny: y + 1 }, { nx: x + 1, ny: y + 1 },
            { nx: x - 1, ny: y }, { nx: x + 1, ny: y }
          ];

          let interacted = false;
          for (const { nx, ny } of neighbors) {
            if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE) {
              const target = nextGrid[getIdx(nx, ny)];
              if (cell === 7 && target === 3) { 
                nextGrid[getIdx(nx, ny)] = 1; nextGrid[i] = 0; interacted = true; break;
              }
              if (cell === 3 && target === 7) { 
                nextGrid[getIdx(nx, ny)] = 1; nextGrid[i] = 0; interacted = true; break;
              }
              if (cell === 7 && (target === 4 || target === 6 || target === 9)) { 
                nextGrid[getIdx(nx, ny)] = 5; interacted = true; break;
              }
              if (cell === 8 && target !== 0 && target !== 1 && target !== 8) { 
                nextGrid[getIdx(nx, ny)] = 0;
                if (Math.random() > 0.5) nextGrid[i] = 0;  
                interacted = true; break;
              }
            }
          }
          if (interacted) continue;

          if (y < GRID_SIZE - 1 && nextGrid[getIdx(x, y + 1)] === 0) {
            nextGrid[i] = 0;
            nextGrid[getIdx(x, y + 1)] = cell;
          } else {
            const dir = Math.random() > 0.5 ? 1 : -1;  
            const sides = [dir, -dir];
            for (const s of sides) {
              if (x + s >= 0 && x + s < GRID_SIZE && nextGrid[getIdx(x + s, y)] === 0) {
                nextGrid[i] = 0;
                nextGrid[getIdx(x + s, y)] = cell;
                break;
              }
            }
          }
        }
        else if (material.behavior === 'gas' || material.behavior === 'rising') {
          const nx = x + Math.floor(Math.random() * 3) - 1;  
          const ny = y + (material.behavior === 'rising' ? -1 : (Math.floor(Math.random() * 3) - 2));  

          if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE) {
            const target = currentGrid[getIdx(nx, ny)];
            if (target === 0) {
              nextGrid[i] = 0;
              nextGrid[getIdx(nx, ny)] = cell;
            } else if (material.behavior === 'rising' && (MATERIALS[target]?.behavior.includes('liquid') || MATERIALS[target]?.behavior === 'corrosive')) {
              nextGrid[i] = target;
              nextGrid[getIdx(nx, ny)] = cell;
            } else if (cell === 5 && target === 3) {
              nextGrid[i] = 11;
            } else if (cell === 5 && target === 10) {
              nextGrid[getIdx(nx, ny)] = 3;
            }
          }
          
          if (cell === 5) {
            const directions = [{ dx: 0, dy: 1 }, { dx: 0, dy: -1 }, { dx: 1, dy: 0 }, { dx: -1, dy: 0 }];
            for (const { dx, dy } of directions) {
              const tx = x + dx; const ty = y + dy;
              if (tx >= 0 && tx < GRID_SIZE && ty >= 0 && ty < GRID_SIZE) {
                const target = currentGrid[getIdx(tx, ty)];
                if ((target === 4 || target === 6 || target === 9) && Math.random() > 0.4) {  
                  nextGrid[getIdx(tx, ty)] = 5;
                }
              }
            }
          }
          const dieChance = material.behavior === 'rising' ? 0.05 : 0.1;
          if (Math.random() > (1 - dieChance)) nextGrid[i] = 0;  
        }
        else if (material.behavior === 'living') {
          if (Math.random() > 0.95) {  
            const nx = x + Math.floor(Math.random() * 3) - 1;  
            const ny = y + Math.floor(Math.random() * 3) - 1;  
            if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE) {
              const target = currentGrid[getIdx(nx, ny)];
              if (target === 3 || target === 0 || target === 2) {
                let soilQuality = 0;
                for (let ay = -1; ay <= 1; ay++) {
                  for (let ax = -1; ax <= 1; ax++) {
                    const tx = x + ax; const ty = y + ay;
                    if (tx >= 0 && tx < GRID_SIZE && ty >= 0 && ty < GRID_SIZE) {
                      const n = currentGrid[getIdx(tx, ty)];
                      if (n === 3) soilQuality = Math.max(soilQuality, 2);
                      if (n === 2) soilQuality = Math.max(soilQuality, 1);
                    }
                  }
                }
                const speedMod = soilQuality === 2 ? 0.4 : (soilQuality === 1 ? 0.05 : 0);
                if (Math.random() < speedMod) nextGrid[getIdx(nx, ny)] = 9;
              }
            }
          }
        }
        else if (material.behavior === 'generator') {
          const targetType = sourceGridRef.current[i];
          if (targetType !== 0) {
            const dx = Math.floor(Math.random() * 3) - 1;  
            const dy = Math.floor(Math.random() * 3) - 1;  
            const nx = x + dx; const ny = y + dy;
            if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE && nextGrid[getIdx(nx, ny)] === 0) {
              if (dx !== 0 || dy !== 0) nextGrid[getIdx(nx, ny)] = targetType;
            }
          }
        }
        else if (material.behavior === 'melting') {
          let nearHeat = false;
          for (let ay = -1; ay <= 1; ay++) {
            for (let ax = -1; ax <= 1; ax++) {
              const tx = x + ax; const ty = y + ay;
              if (tx >= 0 && tx < GRID_SIZE && ty >= 0 && ty < GRID_SIZE) {
                const t = currentGrid[getIdx(tx, ty)];
                if (t === 5 || t === 7) nearHeat = true;
              }
            }
          }
          if (nearHeat && Math.random() > 0.9) nextGrid[i] = 3;  
        }
      }
    }

    currentGrid.set(nextGrid);
    draw();
    requestRef.current = requestAnimationFrame(() => updateRef.current());
  }, [isPaused, draw]);

  useEffect(() => {
    updateRef.current = update;
  }, [update]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(() => updateRef.current());
    return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
  }, []);

  const clearCanvas = useCallback(() => {
    gridRef.current.fill(0);
    sourceGridRef.current.fill(0);
    draw();
    audioEngine.playTick(settings.soundTheme);
  }, [draw, settings.soundTheme]);

  useEffect(() => {
    setOnReset(() => clearCanvas);
    setHelpContent(HELP_INFO);
    return () => clearHeader();
  }, [clearHeader, setOnReset, clearCanvas, setHelpContent]);

  useEffect(() => {
    setHeaderActions(
      <div className="flex items-center gap-4 italic">
        <button
          onClick={() => { setIsPaused(!isPaused); audioEngine.playTick(settings.soundTheme); }}
          className={`flex items-center gap-2 px-6 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95  ${isPaused ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white'}`}
        >
          {isPaused ? <Play size={14} fill="currentColor" /> : <Pause size={14} fill="currentColor" />} {isPaused ? 'Resume' : 'Pause'}
        </button>
        <button
          onClick={clearCanvas}
          className="flex items-center gap-2 px-6 py-2 bg-surface border-2 border-slate-100 text-slate-300 rounded-xl font-black text-[10px] uppercase tracking-widest hover:border-caution-border hover:text-caution transition-all active:scale-95 "
        >
          <Trash2 size={14} strokeWidth={3} /> Clear
        </button>
      </div>
    );
  }, [isPaused, clearCanvas, settings.soundTheme, setHeaderActions]);

  const handlePointer = (e: any) => {
    if (e.buttons !== 1) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const mouseX = Math.floor((e.clientX - rect.left) * scaleX / CELL_SIZE);
    const mouseY = Math.floor((e.clientY - rect.top) * scaleY / CELL_SIZE);

    for (let dy = -brushSize; dy <= brushSize; dy++) {
      for (let dx = -brushSize; dx <= brushSize; dx++) {
        const nx = mouseX + dx;
        const ny = mouseY + dy;
        if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE) {
          if (Math.sqrt(dx * dx + dy * dy) <= brushSize) {
            drawQueueRef.current.push({ x: nx, y: ny, material: selectedMaterial, isGenerator: isGeneratorMode });
          }
        }
      }
    }
    if (isPaused) {
       while (drawQueueRef.current.length > 0) {
        const { x, y, material, isGenerator } = drawQueueRef.current.shift();
        const idx = getIdx(x, y);
        const oldMat = gridRef.current[idx];
        if (material === 0) {
          gridRef.current[idx] = 0;
          sourceGridRef.current[idx] = 0;
        } else if (isGenerator) {
          gridRef.current[idx] = 12;
          sourceGridRef.current[idx] = material;
        } else if (oldMat === 12) {
          sourceGridRef.current[idx] = material;
        } else {
          gridRef.current[idx] = material;
        }
      }
      draw();
    }
  };

  return (
    <div className="tool-container flex flex-col lg:flex-row gap-8 h-full font-['Outfit'] select-none relative bg-surface rounded-[4rem] p-4 lg:p-12 italic  overflow-hidden">
      
      <div className="tool-grid-bg opacity-30 pointer-events-none" />

      {/* Primary Interaction Surface */}
      <div className="flex-1 bg-dark-bg rounded-[3.5rem] border-8 border-dark-border  flex flex-col items-center justify-center relative overflow-hidden group cursor-crosshair">
        <div className="tool-grid-bg-dark opacity-10 pointer-events-none" />
        
        {/* Telemetry HUD */}
        <div className="absolute top-12 left-12 flex flex-col gap-2 z-20">
           <div className="flex items-center gap-3 bg-surface/5 border-2 border-white/10 px-6 py-3 rounded-[1.5rem] backdrop-blur-md ">
              <Activity size={18} className="text-primary/70" />
              <p className="text-[10px] font-black text-white/60 uppercase tracking-[0.4em]">Entropy Matrix Active</p>
           </div>
        </div>

        <canvas
          ref={canvasRef}
          width={GRID_SIZE * CELL_SIZE}
          height={GRID_SIZE * CELL_SIZE}
          onPointerDown={handlePointer}
          onPointerMove={handlePointer}
          className="w-full h-full object-contain image-pixelated relative z-10"
        />

        {/* Operational Interface Control */}
        <div className="absolute bottom-12 right-12 flex items-center gap-6 z-20 bg-surface/5 border-2 border-white/10 p-8 rounded-[3rem] backdrop-blur-md  pointer-events-none">
           <div className="text-right">
              <p className="text-[10px] font-black text-white uppercase tracking-widest leading-none">Chemical Impulse</p>
              <p className="text-[10px] font-black text-primary/70 uppercase tracking-widest mt-2 leading-none">Drag to Atomize</p>
           </div>
           <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-white ">
              <MousePointer2 size={24} strokeWidth={3} />
           </div>
        </div>
      </div>

      {/* Material Matrix Sidebar */}
      <div className="w-full lg:w-[450px] shrink-0 flex flex-col gap-8 relative z-20 italic">
        
        {/* Particle Control Core */}
        <div className="bg-dark-bg p-12 rounded-[4rem] border-4 border-dark-border  flex flex-col items-center gap-10 relative overflow-hidden shrink-0">
           <div className="tool-grid-bg-dark opacity-10 pointer-events-none" />
           
           <div className="flex items-center justify-between w-full relative z-10">
              <span className="text-[10px] font-black text-primary/70 uppercase tracking-[0.5em]">Brush Flux</span>
              <div className="px-4 py-1 bg-primary/20 rounded-full border border-indigo-500/20">
                 <span className="text-[8px] font-black text-primary/70 uppercase tracking-widest">Active Output</span>
              </div>
           </div>

           <div className="relative z-10 w-full space-y-6">
              <div className="flex justify-between items-end mb-2">
                 <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest leading-none">Magnitude</span>
                 <span className="text-4xl font-black text-white italic tabular-nums leading-none">{brushSize}</span>
              </div>
              <div className="h-6 bg-surface/5 rounded-full p-1 border border-white/10 relative group">
                 <input 
                   type="range" min="1" max="10" value={brushSize}
                   onChange={(e) => { setBrushSize(parseInt(e.target.value)); audioEngine.playTick(settings.soundTheme); }}
                   className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                 />
                 <motion.div 
                    className="h-full bg-gradient-to-r from-indigo-500 to-rose-500 rounded-full -[0_0_15px_rgba(79,70,229,0.5)]"
                    initial={false}
                    animate={{ width: `${(brushSize / 10) * 100}%` }}
                 />
              </div>

              <button
                onClick={() => { setIsGeneratorMode(!isGeneratorMode); audioEngine.playTick(settings.soundTheme); }}
                className={`w-full flex items-center justify-between p-6 rounded-[2.5rem] border-4 transition-all active:scale-95 ${isGeneratorMode ? 'bg-primary border-white text-white ' : 'bg-surface/5 border-white/10 text-neutral-400 hover:border-indigo-500 hover:text-primary/70'}`}
               >
                  <div className="flex items-center gap-4">
                     <InfIcon size={24} strokeWidth={3} className={isGeneratorMode ? 'text-white' : 'text-slate-500'} />
                     <div className="flex flex-col items-start">
                        <span className="text-[10px] font-black uppercase tracking-widest leading-none">Emitter Protocol</span>
                        <span className="text-[11px] font-black uppercase tracking-tight mt-1 opacity-60">{isGeneratorMode ? 'Active Flux' : 'Single Burst'}</span>
                     </div>
                  </div>
                  <div className={`w-3 h-3 rounded-full ${isGeneratorMode ? 'bg-surface animate-pulse -[0_0_10px_white]' : 'bg-surface/10'}`} />
               </button>
           </div>
        </div>

        {/* Alchemy Elements Matrix */}
        <div className="flex-1 bg-slate-50/50 p-10 rounded-[4rem] border-4 border-white  flex flex-col gap-8 min-h-0">
           <div className="flex items-center gap-4 shrink-0 border-b-4 border-white pb-6">
              <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-white ">
                 <Settings2 size={24} strokeWidth={3} />
              </div>
              <h4 className="text-xl font-black text-slate-900 uppercase tracking-tight leading-none">Material Registry</h4>
           </div>

           <div className="flex-1 grid grid-cols-3 gap-3 overflow-y-auto no-scrollbar pr-2 pb-4">
              {MATERIALS.filter(m => m.id !== 12).map(mat => (
                <button
                  key={mat.id}
                  onClick={() => { setSelectedMaterial(mat.id); audioEngine.playTick(settings.soundTheme); }}
                  className={`group flex flex-col items-center gap-2 p-4 rounded-[2rem] border-4 transition-all duration-300 ${selectedMaterial === mat.id ? 'bg-dark-bg border-indigo-600  scale-105 z-10' : 'bg-surface border-white hover:border-primary/20 '}`}
                >
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110" style={{ backgroundColor: selectedMaterial === mat.id ? mat.color : '#f8fafc' }}>
                    <mat.icon size={24} strokeWidth={3} style={{ color: selectedMaterial === mat.id ? (mat.id === 0 ? '#64748b' : '#fff') : mat.color }} />
                  </div>
                  <span className={`text-[10px] font-black uppercase tracking-tight text-center ${selectedMaterial === mat.id ? 'text-white' : 'text-neutral-400'}`}>{mat.label}</span>
                </button>
              ))}
           </div>

           <div className="p-8 bg-primary rounded-[3.5rem] text-white space-y-6  relative overflow-hidden shrink-0 mt-auto">
              <div className="tool-grid-bg opacity-10 pointer-events-none" />
              <div className="flex items-center gap-4 relative z-10">
                 <div className="w-10 h-10 rounded-xl bg-surface/20 flex items-center justify-center text-white border border-white/20">
                    <Volume2 size={20} strokeWidth={3} />
                 </div>
                 <h4 className="text-[10px] font-black uppercase tracking-[0.3em]">Theoretical Matrix</h4>
              </div>
              <p className="text-xs font-black leading-relaxed italic text-indigo-100 uppercase tracking-widest relative z-10">
                Lava + Water = Stone. <br/>
                Fire + Wood = Ash.
              </p>
              <div className="flex justify-end relative z-10">
                 <BrainCircuit size={24} className="text-white/20" />
              </div>
           </div>
        </div>
      </div>

      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[150px] opacity-40 -z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-success-bg rounded-full blur-[150px] opacity-40 -z-10 pointer-events-none" />
    </div>
  );
};

export default SandSimulation;
