import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Layers, Columns, Square, Hand, LayoutGrid, RotateCcw } from 'lucide-react';
import React, { useState, useRef, useMemo } from 'react';

const UnitBlock = ({ color }) => (
  <div 
    className="w-4 h-4 rounded-[1px] shadow-[1px_1px_0_rgba(0,0,0,0.2),inset_-1px_-1px_0_rgba(0,0,0,0.1)] border-[0.5px] border-black/10 pointer-events-none shrink-0 flex items-center justify-center relative overflow-hidden" 
    style={{ 
      backgroundColor: color,
      backgroundImage: `linear-gradient(135deg, rgba(255,255,255,0.4) 0%, transparent 50%, rgba(0,0,0,0.1) 100%)`
    }}
  >
    <div className="absolute inset-0 border border-white/20 rounded-[1px]" />
  </div>
);

const LongBlock = ({ color }) => (
  <div className="flex flex-col shadow-lg pointer-events-none shrink-0 bg-black/5 p-[1px] rounded-sm">
    {Array.from({ length: 10 }).map((_, i) => (
      <UnitBlock key={i} color={color} />
    ))}
  </div>
);

const FlatBlock = ({ color }) => (
  <div className="grid grid-cols-10 pointer-events-none shrink-0 bg-black/5 p-[1px] rounded-sm shadow-xl">
    {Array.from({ length: 100 }).map((_, i) => (
      <UnitBlock key={i} color={color} />
    ))}
  </div>
);

const TYPES = [
  { key: 'hundreds', label: 'Hundred', icon: Layers, color: '#3b82f6', component: FlatBlock },
  { key: 'tens', label: 'Ten', icon: Columns, color: '#10b981', component: LongBlock },
  { key: 'ones', label: 'One', icon: Square, color: '#f59e0b', component: UnitBlock },
];

export const MABBlocks = () => {
  const [blocks, setBlocks] = useState([]);
  const workspaceRef = useRef(null);

  const counts = useMemo(() => {
    return {
      hundreds: blocks.filter(b => b.type === 'hundreds').length,
      tens: blocks.filter(b => b.type === 'tens').length,
      ones: blocks.filter(b => b.type === 'ones').length,
    };
  }, [blocks]);

  const totalValue = (counts.hundreds * 100) + (counts.tens * 10) + counts.ones;

  const addBlock = (type) => {
    if (!workspaceRef.current) return;
    const rect = workspaceRef.current.getBoundingClientRect();
    
    // Add at random position near the center with a bit more spread
    const x = rect.width / 2 + (Math.random() - 0.5) * 160;
    const y = rect.height / 2 + (Math.random() - 0.5) * 160;
    
    const newBlock = {
      id: `block-${Date.now()}-${Math.random()}`,
      type,
      x,
      y
    };
    
    setBlocks(prev => [...prev, newBlock]);
  };

  const handleWorkspaceDragEnd = (id, info) => {
    if (!workspaceRef.current) return;
    const rect = workspaceRef.current.getBoundingClientRect();
    
    // Check if dragged out of workspace
    if (
      info.point.x < rect.left ||
      info.point.x > rect.right ||
      info.point.y < rect.top ||
      info.point.y > rect.bottom
    ) {
      setBlocks(prev => prev.filter(b => b.id !== id));
    } else {
      // Update position
      const x = info.point.x - rect.left;
      const y = info.point.y - rect.top;
      setBlocks(prev => prev.map(b => b.id === id ? { ...b, x, y } : b));
    }
  };

  const sortBlocks = () => {
    if (!workspaceRef.current) return;
    const rect = workspaceRef.current.getBoundingClientRect();
    const padding = 60;
    const colWidth = (rect.width - padding * 2) / 3;

    let sortedBlocks = [...blocks].sort((a, b) => {
      const order = { hundreds: 0, tens: 1, ones: 2 };
      return order[a.type] - order[b.type];
    });

    const typeCounts = { hundreds: 0, tens: 0, ones: 0 };

    setBlocks(prev => prev.map(block => {
      const type = block.type;
      const idx = typeCounts[type]++;
      
      let x, y;
      if (type === 'hundreds') {
        x = padding + 50 + (idx % 2) * 110;
        y = padding + Math.floor(idx / 2) * 110;
      } else if (type === 'tens') {
        x = padding + colWidth + 50 + (idx % 5) * 40;
        y = padding + Math.floor(idx / 5) * 80;
      } else {
        x = padding + colWidth * 2 + 20 + (idx % 10) * 40;
        y = padding + Math.floor(idx / 10) * 40;
      }

      return { ...block, x, y };
    }));
  };

  const clear = () => setBlocks([]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-4 h-[calc(100vh-160px)] flex flex-col gap-3 select-none">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-[2rem] border-2 border-slate-100 shadow-sm">
        <div className="space-y-0.5">
          <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            MAB Blocks Lab
            <span className="text-[10px] bg-indigo-50 text-indigo-500 px-3 py-0.5 rounded-full uppercase tracking-widest font-bold">Interactive</span>
          </h2>
          <p className="text-slate-400 font-medium text-xs">Click a block from the bank to add it. Drag blocks to move them. Drag off to remove.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-50 px-6 py-2 rounded-[1.5rem] border-2 border-slate-100 flex flex-col items-center">
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Total Value</span>
            <span className="text-2xl font-black text-indigo-600 tabular-nums">
              {totalValue.toLocaleString()}
            </span>
          </div>
          
          <div className="flex flex-col gap-1">
            <button
              onClick={sortBlocks}
              className="flex items-center gap-2 px-4 py-1.5 bg-indigo-600 text-white rounded-lg font-black text-[10px] hover:bg-indigo-700 shadow-lg shadow-indigo-100 uppercase"
            >
              <LayoutGrid size={12} /> Sort
            </button>
            <button
              onClick={clear}
              className="flex items-center gap-2 px-4 py-1.5 bg-red-50 text-red-500 rounded-lg font-black text-[10px] hover:bg-red-100 uppercase"
            >
              <RotateCcw size={12} /> Reset
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch min-h-0">
        {/* Workspace */}
        <div 
          ref={workspaceRef}
          className="lg:col-span-9 bg-white rounded-[2.5rem] border-4 border-white shadow-xl relative overflow-hidden bg-slate-50"
        >
          {/* Architectural Grid */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
            style={{ 
              backgroundImage: `linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)`,
              backgroundSize: '16px 16px'
            }} 
          />
          <div className="absolute inset-0 opacity-[0.05] pointer-events-none" 
            style={{ 
              backgroundImage: `linear-gradient(#000 2px, transparent 2px), linear-gradient(90deg, #000 2px, transparent 2px)`,
              backgroundSize: '80px 80px'
            }} 
          />

          <div className="relative w-full h-full">
            {blocks.map((block) => {
              const Comp = TYPES.find(t => t.key === block.type).component;
              const color = TYPES.find(t => t.key === block.type).color;
              
              return (
                <motion.div
                  key={block.id}
                  drag
                  dragMomentum={false}
                  dragElastic={0}
                  onDragEnd={(e, info) => handleWorkspaceDragEnd(block.id, info)}
                  initial={{ opacity: 0, scale: 0.5, x: block.x, y: block.y }}
                  animate={{ 
                    opacity: 1,
                    scale: 1,
                    x: block.x,
                    y: block.y,
                  }}
                  whileDrag={{ scale: 1.1, zIndex: 50 }}
                  transition={{ 
                    type: 'spring', 
                    stiffness: 500, 
                    damping: 30,
                    opacity: { duration: 0.2 },
                    scale: { duration: 0.2 }
                  }}
                  style={{ 
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    transform: 'translate(-50%, -50%)',
                    cursor: 'grab'
                  }}
                  className="active:cursor-grabbing"
                >
                  <Comp color={color} />
                </motion.div>
              );
            })}
          </div>

          {blocks.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center opacity-5 pointer-events-none gap-4">
              <Hand size={80} />
              <p className="font-black uppercase tracking-[0.4em] text-xl text-center">Workspace Ready</p>
            </div>
          )}
        </div>

        {/* Bank Sidebar */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          <div className="bg-white rounded-[2rem] border-2 border-slate-50 shadow-xl p-4 space-y-6 flex-1 overflow-y-auto custom-scrollbar">
            <div className="flex items-center gap-2 text-[8px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2">
              <RotateCcw size={12} />
              Block Bank
            </div>
            
            <div className="flex flex-col gap-8 items-center py-2">
              {TYPES.map(type => (
                <button 
                  key={type.key} 
                  onClick={() => addBlock(type.key)}
                  className="flex flex-col items-center gap-2 w-full group outline-none"
                >
                  <div className="relative">
                    <motion.div
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                      className="cursor-pointer"
                    >
                      <type.component color={type.color} />
                    </motion.div>
                  </div>
                  <div className="text-center">
                    <p className="text-[9px] font-black text-slate-700 uppercase tracking-widest group-hover:text-indigo-600 transition-colors">{type.label}</p>
                    <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">({type.key === 'hundreds' ? 100 : type.key === 'tens' ? 10 : 1})</p>
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-auto p-3 bg-indigo-50 text-indigo-600 rounded-xl text-[9px] font-bold space-y-0.5">
              <p className="uppercase tracking-widest text-[7px] opacity-60 font-black">Pro Tip</p>
              <p>Click blocks to add them instantly!</p>
            </div>
          </div>
        </div>
      </div>

      {/* Expanded Form Footer */}
      <div className="p-4 bg-white rounded-[2rem] border-2 border-slate-50 shadow-xl overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-blue-500 via-green-500 to-yellow-500 opacity-20" />
        <div className="flex flex-wrap items-center justify-center gap-4 text-lg font-black text-slate-800 tabular-nums">
          <div className="flex flex-col items-center group">
            <span className="text-[7px] text-blue-500 uppercase font-black tracking-widest mb-1">Hundreds</span>
            <div className="bg-blue-50 px-5 py-2 rounded-lg border border-blue-100 min-w-[100px] text-center text-blue-600 shadow-sm">
              {counts.hundreds * 100}
            </div>
          </div>
          <span className="text-slate-200 text-3xl font-light">+</span>
          <div className="flex flex-col items-center group">
            <span className="text-[7px] text-green-500 uppercase font-black tracking-widest mb-1">Tens</span>
            <div className="bg-green-50 px-5 py-2 rounded-lg border border-green-100 min-w-[100px] text-center text-green-600 shadow-sm">
              {counts.tens * 10}
            </div>
          </div>
          <span className="text-slate-200 text-3xl font-light">+</span>
          <div className="flex flex-col items-center group">
            <span className="text-[7px] text-yellow-500 uppercase font-black tracking-widest mb-1">Ones</span>
            <div className="bg-yellow-50 px-5 py-2 rounded-lg border border-yellow-100 min-w-[100px] text-center text-yellow-600 shadow-sm">
              {counts.ones}
            </div>
          </div>
          <span className="text-indigo-300 text-3xl mx-2">=</span>
          <div className="flex flex-col items-center">
             <span className="text-[7px] text-indigo-400 uppercase font-black tracking-widest mb-1">Total Value</span>
             <span className="text-5xl text-indigo-600 drop-shadow-md font-black leading-none">{totalValue.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
