import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Square, Droplet, Flame, Grid, Eraser, Trash2, 
  Play, Pause, Settings2, Sparkles, MousePointer2, Hammer, Zap
} from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';

const GRID_SIZE = 120;
const CELL_SIZE = 5;

const MATERIALS = [
  { id: 0, label: 'Eraser', icon: Eraser, color: '#f8fafc', behavior: 'empty' },
  { id: 1, label: 'Wall', icon: Square, color: '#475569', behavior: 'static' },
  { id: 2, label: 'Sand', icon: Grid, color: '#eab308', behavior: 'falling' },
  { id: 3, label: 'Water', icon: Droplet, color: '#3b82f6', behavior: 'liquid' },
  { id: 4, label: 'Wood', icon: Hammer, color: '#78350f', behavior: 'flammable' },
  { id: 5, label: 'Fire', icon: Flame, color: '#ef4444', behavior: 'gas' },
  { id: 6, label: 'Oil', icon: Zap, color: '#1e293b', behavior: 'flammable-liquid' },
];

export const SandSimulation = () => {
  const [selectedMaterial, setSelectedMaterial] = useState(2);
  const [brushSize, setBrushSize] = useState(3);
  const [isPaused, setIsPaused] = useState(false);
  const canvasRef = useRef(null);
  const gridRef = useRef(new Uint8Array(GRID_SIZE * GRID_SIZE));
  const requestRef = useRef();
  
  const { settings } = useSettings();

  const getIdx = (x, y) => y * GRID_SIZE + x;

  const update = () => {
    if (isPaused) return;

    const currentGrid = gridRef.current;
    const nextGrid = new Uint8Array(currentGrid);

    // Iterate backwards so falling materials don't teleport to the bottom in one frame
    for (let y = GRID_SIZE - 1; y >= 0; y--) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const i = getIdx(x, y);
        const cell = currentGrid[i];

        if (cell === 0) continue;

        const material = MATERIALS[cell];

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
        else if (material.behavior === 'liquid' || material.behavior === 'flammable-liquid') {
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
          // Horizontal (flow)
          else {
            const dir = Math.random() > 0.5 ? 1 : -1;
            if (x + dir >= 0 && x + dir < GRID_SIZE && nextGrid[getIdx(x + dir, y)] === 0) {
              nextGrid[i] = 0;
              nextGrid[getIdx(x + dir, y)] = cell;
            }
          }
        }
        else if (material.behavior === 'gas') { // Fire
          // Rise or spread
          const nx = x + Math.floor(Math.random() * 3) - 1;
          const ny = y + Math.floor(Math.random() * 3) - 2;

          if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE) {
            const target = currentGrid[getIdx(nx, ny)];
            if (target === 0) {
              nextGrid[i] = 0;
              nextGrid[getIdx(nx, ny)] = cell;
            } else if (target === 4 || target === 6) { // Wood or Oil
              nextGrid[getIdx(nx, ny)] = 5; // Set on fire
            }
          }
          
          // Randomly die out
          if (Math.random() > 0.9) nextGrid[i] = 0;
        }
      }
    }

    gridRef.current = nextGrid;
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
            gridRef.current[getIdx(nx, ny)] = selectedMaterial;
          }
        }
      }
    }
    if (isPaused) draw();
  };

  const clearCanvas = () => {
    gridRef.current.fill(0);
    draw();
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 h-full flex flex-col gap-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-[2.5rem] border-2 border-slate-200 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-amber-50 rounded-2xl text-amber-600">
            <Sparkles size={32} />
          </div>
          <div>
            <h2 className="text-3xl font-black text-slate-800 tracking-tight">Sand Simulation</h2>
            <p className="text-slate-400 font-medium text-sm">Explore physics with different materials!</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsPaused(!isPaused)}
            className={`p-4 rounded-2xl transition-all shadow-lg active:scale-95 ${
              isPaused ? 'bg-green-600 text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {isPaused ? <Play size={24} fill="currentColor" /> : <Pause size={24} fill="currentColor" />}
          </button>
          <button
            onClick={clearCanvas}
            className="p-4 bg-red-50 text-red-500 rounded-2xl hover:bg-red-100 transition-all active:scale-95"
          >
            <Trash2 size={24} />
          </button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch min-h-0">
        {/* Simulation Canvas */}
        <div className="lg:col-span-9 bg-slate-900 rounded-[3rem] border-8 border-slate-800 shadow-2xl overflow-hidden relative cursor-crosshair group">
          <canvas
            ref={canvasRef}
            width={GRID_SIZE * CELL_SIZE}
            height={GRID_SIZE * CELL_SIZE}
            onPointerDown={handlePointer}
            onPointerMove={handlePointer}
            className="w-full h-full object-contain"
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
            
            <div className="grid grid-cols-1 gap-2">
              {MATERIALS.map(mat => (
                <button
                  key={mat.id}
                  onClick={() => setSelectedMaterial(mat.id)}
                  className={`
                    w-full px-4 py-4 rounded-2xl text-sm font-black transition-all flex items-center gap-4
                    ${selectedMaterial === mat.id ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}
                  `}
                >
                  <div className={`p-2 rounded-lg ${selectedMaterial === mat.id ? 'bg-white/20' : 'bg-white shadow-sm'}`}>
                    <mat.icon size={18} style={{ color: selectedMaterial === mat.id ? 'white' : mat.color }} />
                  </div>
                  {mat.label}
                </button>
              ))}
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

            <div className="p-4 bg-amber-50 text-amber-700 rounded-2xl text-[10px] font-bold space-y-1">
              <p className="uppercase tracking-widest text-[8px] opacity-60">Interaction Hint</p>
              <p>Fire burns Wood and Oil! Water puts out Fire.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
