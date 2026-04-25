import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Square, Droplet, Flame, Grid, Eraser, Trash2, 
  Play, Pause, Settings2, Sparkles, MousePointer2, Hammer, Zap,
  Thermometer, FlaskConical, Sprout, Wind, Infinity, Snowflake
} from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';
import { ToolHeader } from '../ToolHeader';

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
  { id: 12, label: 'Generator', icon: Infinity, color: '#a855f7', behavior: 'generator' },
];

export const SandSimulation = () => {
  const [selectedMaterial, setSelectedMaterial] = useState(2);
  const [brushSize, setBrushSize] = useState(3);
  const [isPaused, setIsPaused] = useState(false);
  const [isGeneratorMode, setIsGeneratorMode] = useState(false);
  const canvasRef = useRef(null);
  const gridRef = useRef(new Uint8Array(GRID_SIZE * GRID_SIZE));
  const nextGridRef = useRef(new Uint8Array(GRID_SIZE * GRID_SIZE));
  const sourceGridRef = useRef(new Uint8Array(GRID_SIZE * GRID_SIZE));
  const drawQueueRef = useRef([]);
  const requestRef = useRef();
  const containerRef = useRef(null);
  const [containerHeight, setContainerHeight] = useState(600);
  
  const { settings } = useSettings();

  const getIdx = (x, y) => y * GRID_SIZE + x;

  const update = () => {
    if (isPaused) return;

    const currentGrid = gridRef.current;
    const nextGrid = nextGridRef.current;
    
    // Apply queued drawing actions first
    while (drawQueueRef.current.length > 0) {
      const { x, y, material, isGenerator } = drawQueueRef.current.shift();
      const idx = getIdx(x, y);
      const oldMat = currentGrid[idx];
      
      if (material === 0) { // Eraser
        currentGrid[idx] = 0;
        sourceGridRef.current[idx] = 0;
      } else if (isGenerator) { 
        currentGrid[idx] = 12; // ID 12 is Generator
        sourceGridRef.current[idx] = material;
      } else if (oldMat === 12) { // Painting over Generator
        sourceGridRef.current[idx] = material;
      } else {
        currentGrid[idx] = material;
      }
    }

    nextGrid.set(currentGrid);

    // Alternate horizontal scan direction to stabilize liquids
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
          // Down
          if (y < GRID_SIZE - 1 && nextGrid[getIdx(x, y + 1)] === 0) {
            nextGrid[i] = 0;
            nextGrid[getIdx(x, y + 1)] = cell;
          } 
          // Down-Left
          else if (y < GRID_SIZE - 1 && x > 0 && nextGrid[getIdx(x - 1, y + 1)] === 0) {
            nextGrid[i] = 0;
            nextGrid[getIdx(x - 1, y + 1)] = cell;
          }
          // Down-Right
          else if (y < GRID_SIZE - 1 && x < GRID_SIZE - 1 && nextGrid[getIdx(x + 1, y + 1)] === 0) {
            nextGrid[i] = 0;
            nextGrid[getIdx(x + 1, y + 1)] = cell;
          }
        } 
        else if (material.behavior === 'liquid' || material.behavior === 'flammable-liquid' || material.behavior === 'hot-liquid' || material.behavior === 'corrosive') {
          // Check for interactions
          const neighbors = [
            { nx: x, ny: y + 1 }, { nx: x - 1, ny: y + 1 }, { nx: x + 1, ny: y + 1 },
            { nx: x - 1, ny: y }, { nx: x + 1, ny: y }
          ];

          let interacted = false;
          for (const { nx, ny } of neighbors) {
            if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE) {
              const target = nextGrid[getIdx(nx, ny)];
              if (cell === 7 && target === 3) { // Lava + Water
                nextGrid[getIdx(nx, ny)] = 1; nextGrid[i] = 0; interacted = true; break;
              }
              if (cell === 3 && target === 7) { // Water + Lava
                nextGrid[getIdx(nx, ny)] = 1; nextGrid[i] = 0; interacted = true; break;
              }
              if (cell === 7 && (target === 4 || target === 6 || target === 9)) { // Lava ignites flammable
                nextGrid[getIdx(nx, ny)] = 5; interacted = true; break;
              }
              if (cell === 8 && target !== 0 && target !== 1 && target !== 8) { // Acid
                nextGrid[getIdx(nx, ny)] = 0;
                if (Math.random() > 0.5) nextGrid[i] = 0;
                interacted = true; break;
              }
            }
          }
          if (interacted) continue;

          // Liquid Movement
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
              // Steam rises through liquids (Swap)
              nextGrid[i] = target;
              nextGrid[getIdx(nx, ny)] = cell;
            } else if (cell === 5 && target === 3) {
              nextGrid[i] = 11;
            } else if (cell === 5 && target === 10) {
              nextGrid[getIdx(nx, ny)] = 3;
            }
          }
          
          // Fire spreads in all directions
          if (cell === 5) {
            const directions = [
              { dx: 0, dy: 1 }, { dx: 0, dy: -1 }, { dx: 1, dy: 0 }, { dx: -1, dy: 0 }
            ];
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
          const growChance = 0.95; // Base high chance for random check, then modified below
          if (Math.random() > growChance) {
            const nx = x + Math.floor(Math.random() * 3) - 1;
            const ny = y + Math.floor(Math.random() * 3) - 1;
            if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE) {
              const target = currentGrid[getIdx(nx, ny)];
              if (target === 3 || target === 0 || target === 2) {
                let soilQuality = 0; // 0 = nothing, 1 = dirt, 2 = water
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
                
                // Grow logic:
                // If in water, grow very fast.
                // If in dirt, grow slow.
                const speedMod = soilQuality === 2 ? 0.4 : (soilQuality === 1 ? 0.05 : 0);
                if (Math.random() < speedMod) {
                   nextGrid[getIdx(nx, ny)] = 9;
                }
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
    requestRef.current = requestAnimationFrame(update);
  };

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
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
  };

  useEffect(() => {
    const observer = new ResizeObserver(entries => {
      for (let entry of entries) {
        if (entry.target === containerRef.current) {
          // Subtract some padding/header space if needed, but flex should handle it
          setContainerHeight(entry.contentRect.height);
        }
      }
    });

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(update);
    return () => cancelAnimationFrame(requestRef.current);
  }, [isPaused]);

  const handlePointer = (e) => {
    if (e.buttons !== 1) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;
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
       // Apply immediately if paused so the user sees results
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

  const clearCanvas = () => {
    gridRef.current.fill(0);
    draw();
  };

  return (
    <div className="w-full mx-auto px-4 pt-2 pb-2 h-full flex flex-col gap-4 overflow-hidden">
      <ToolHeader
        title="Sand Simulation"
        icon={Sparkles}
        description="Particle Physics & Interactions"
        infoContent={
          <>
            <p>
              <strong className="text-white block mb-1">Materials</strong>
              From falling Sand to flowing Lava and growing Plants. Each material has physical properties like weight, flammability, and state.
            </p>
            <p>
              <strong className="text-white block mb-1">Generators (Source)</strong>
              Use the Source tool to create infinite emitters. Tip: Paint over a Source with another material to change what it generates!
            </p>
            <p>
              <strong className="text-white block mb-1">Interactions</strong>
              Lava + Water = Rock. Acid dissolves almost anything. Plants grow when near water. Fire melts Ice. Experiment!
            </p>
          </>
        }
      >
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsPaused(!isPaused)}
            className={`px-4 py-2 rounded-xl transition-all shadow-lg active:scale-95 flex items-center gap-2 font-black text-sm ${
              isPaused ? 'bg-emerald-600 text-white shadow-emerald-100' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {isPaused ? <Play size={18} fill="currentColor" /> : <Pause size={18} fill="currentColor" />}
            {isPaused ? 'START' : 'PAUSE'}
          </button>
          <button
            onClick={clearCanvas}
            className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-red-50 hover:text-red-600 transition-all active:scale-95"
            title="Clear Simulation"
          >
            <Trash2 size={20} />
          </button>
        </div>
      </ToolHeader>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch min-h-0">
        {/* Simulation Canvas */}
        <div ref={containerRef} className="lg:col-span-9 bg-slate-900 rounded-[3rem] border-8 border-slate-800 shadow-2xl overflow-hidden relative cursor-crosshair group flex items-center justify-center min-h-0">
          <canvas
            ref={canvasRef}
            width={GRID_SIZE * CELL_SIZE}
            height={GRID_SIZE * CELL_SIZE}
            onPointerDown={handlePointer}
            onPointerMove={handlePointer}
            className="w-full h-full"
          />
          
          {/* Overlay hints */}
          <div className="absolute top-6 left-6 flex items-center gap-2 px-4 py-2 bg-black/40 backdrop-blur-md rounded-full text-white/60 text-xs font-black uppercase tracking-widest pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
            <MousePointer2 size={12} /> Drag to paint
          </div>
        </div>

        {/* Sidebar Controls */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          <div className="bg-white rounded-[2.5rem] border-2 border-slate-200 shadow-sm p-6 space-y-8 flex-1 overflow-y-auto">
            <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-3">
              <Settings2 size={14} />
              Material Palette
            </div>
            
            <div className="flex flex-col gap-3">
              <button
                onClick={() => setIsGeneratorMode(!isGeneratorMode)}
                className={`
                  w-full px-4 py-3 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-3 border-2
                  ${isGeneratorMode 
                    ? 'bg-purple-600 text-white border-purple-400 shadow-lg shadow-purple-200 ring-4 ring-purple-500/20' 
                    : 'bg-white text-slate-400 border-slate-100 hover:border-purple-200 hover:text-purple-500'}
                `}
              >
                <Infinity size={18} className={isGeneratorMode ? 'animate-pulse' : ''} />
                {isGeneratorMode ? 'GENERATOR MODE: ON' : 'GENERATOR MODE: OFF'}
              </button>

              <div className="grid grid-cols-3 gap-2">
                {MATERIALS.filter(m => m.id !== 12).map(mat => (
                  <button
                    key={mat.id}
                    onClick={() => setSelectedMaterial(mat.id)}
                    className={`
                      p-2 rounded-2xl transition-all flex flex-col items-center gap-1
                      ${selectedMaterial === mat.id ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}
                    `}
                    title={mat.label}
                  >
                    <div className={`p-2 rounded-lg ${selectedMaterial === mat.id ? 'bg-white/20' : 'bg-white shadow-sm'}`}>
                      <mat.icon size={16} style={{ color: selectedMaterial === mat.id ? 'white' : mat.color }} />
                    </div>
                    <span className="text-[10px] font-black truncate w-full text-center">{mat.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-6 border-t border-slate-50 space-y-4">
              <div className="flex justify-between items-end">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Brush Size</label>
                <span className="text-lg font-black text-slate-700">{brushSize}</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={brushSize}
                onChange={(e) => setBrushSize(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>

            <div className="p-4 bg-amber-50 text-amber-700 rounded-2xl text-[10px] font-bold space-y-1 shrink-0">
              <p className="uppercase tracking-widest text-[8px] opacity-60">Master Alchemist</p>
              <p>Lava ignites Wood! Plants grow fast in Water, slow in Dirt! Generators emit whatever you paint them with!</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
