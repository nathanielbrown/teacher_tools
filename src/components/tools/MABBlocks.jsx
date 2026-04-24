import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Layers, Columns, Square, Hand, LayoutGrid, RotateCcw } from 'lucide-react';
import React, { useState, useRef, useMemo } from 'react';
import { ToolHeader } from '../ToolHeader';

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
  const dragOffset = useRef({ x: 0, y: 0 });

  const BLOCK_SIZES = {
    hundreds: { w: 162, h: 162 }, // 160 + 2px padding
    tens: { w: 18, h: 162 },
    ones: { w: 16, h: 16 },
  };

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
      setBlocks(prev => prev.map(b => 
        b.id === id ? { 
          ...b, 
          x: (info.point.x - rect.left) - dragOffset.current.x, 
          y: (info.point.y - rect.top) - dragOffset.current.y 
        } : b
      ));
    }
  };

  const handleSidebarDragEnd = (type, info) => {
    if (!workspaceRef.current) return;
    const rect = workspaceRef.current.getBoundingClientRect();
    
    if (
      info.point.x >= rect.left &&
      info.point.x <= rect.right &&
      info.point.y >= rect.top &&
      info.point.y <= rect.bottom
    ) {
      // Calculate position accounting for the exact grab offset
      const x = (info.point.x - rect.left) - dragOffset.current.x;
      const y = (info.point.y - rect.top) - dragOffset.current.y;
      
      const newBlock = {
        id: `block-${Date.now()}-${Math.random()}`,
        type,
        x,
        y
      };
      
      setBlocks(prev => [...prev, newBlock]);
    }
  };

  const sortBlocks = () => {
    if (!workspaceRef.current) return;
    const rect = workspaceRef.current.getBoundingClientRect();
    const padding = 40;
    const colWidth = (rect.width - padding * 2) / 3;

    const typeCounts = { hundreds: 0, tens: 0, ones: 0 };

    setBlocks(prev => prev.map(block => {
      const type = block.type;
      const idx = typeCounts[type]++;
      
      let x, y;
      if (type === 'hundreds') {
        const cols = Math.max(1, Math.floor(colWidth / 175));
        x = padding + (idx % cols) * 175;
        y = padding + Math.floor(idx / cols) * 175;
      } else if (type === 'tens') {
        const cols = Math.max(1, Math.floor(colWidth / 35));
        x = padding + colWidth + (idx % cols) * 35;
        y = padding + Math.floor(idx / cols) * 175;
      } else {
        const cols = Math.max(1, Math.floor(colWidth / 25));
        x = padding + colWidth * 2 + (idx % cols) * 25;
        y = padding + Math.floor(idx / cols) * 25;
      }

      return { ...block, x, y };
    }));
  };

  const clear = () => setBlocks([]);

  const renderDraggableType = (type) => (
    <div 
      key={type.key} 
      className="flex flex-col items-center gap-2 group overflow-visible"
    >
      <div className="relative flex items-center justify-center shrink-0">
        <motion.div
          drag
          dragSnapToOrigin
          dragMomentum={false}
          onPointerDown={(e) => {
            const target = e.currentTarget || (e.target && e.target.closest('div'));
            if (!target) return;
            const rect = target.getBoundingClientRect();
            dragOffset.current = {
              x: e.clientX - rect.left,
              y: e.clientY - rect.top
            };
          }}
          onDragEnd={(e, info) => handleSidebarDragEnd(type.key, info)}
          whileHover={{ scale: 1.05, y: -2 }}
          whileDrag={{ scale: 1.05, zIndex: 1000, cursor: 'grabbing' }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className="cursor-grab active:cursor-grabbing relative z-10"
        >
          <type.component color={type.color} />
        </motion.div>
        {/* Shadow/Placeholder */}
        <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none -z-0">
          <type.component color={type.color} />
        </div>
      </div>
      <div className="flex flex-col text-center mt-2">
        <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest group-hover:text-indigo-600 transition-colors">{type.label}</p>
        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-tight">{type.key === 'hundreds' ? '100 Units' : type.key === 'tens' ? '10 Units' : '1 Unit'}</p>
      </div>
    </div>
  );

  return (
    <div className="w-full mx-auto h-[calc(100vh-140px)] flex flex-col gap-8 px-4 pt-2 pb-8 select-none overflow-hidden">
      <ToolHeader
        title="MAB Blocks Lab"
        icon={Layers}
        description="Interactive Base-10 Place Value Simulation"
        infoContent={
          <>
            <p>
              <strong className="text-white block mb-1">Add Blocks</strong>
              Drag the blocks from the sidebar and drop them onto the workspace to add Hundreds, Tens, or Ones.
            </p>
            <p>
              <strong className="text-white block mb-1">Workspace</strong>
              Drag blocks to position them. Drag a block off the workspace to remove it. Use "Sort" to automatically organize your blocks into columns.
            </p>
          </>
        }
      />

      <div className="flex-1 flex flex-row gap-6 min-h-0">
        {/* Block Bank Sidebar */}
        <div className="bg-white rounded-[2.5rem] border-2 border-slate-50 shadow-xl p-4 flex flex-col items-center gap-4 z-20 overflow-visible relative w-56 shrink-0">
          <div className="flex flex-col items-center gap-4 border-b border-slate-100 pb-4 w-full">
            <div className="flex flex-col text-center">
              <span className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em]">Block Bank</span>
              <span className="text-[9px] text-indigo-500 font-bold">Drag to add</span>
            </div>
            <button 
              onClick={clear}
              className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-500 rounded-xl transition-colors group/reset flex items-center gap-2 w-full justify-center"
              title="Reset Workspace"
            >
              <RotateCcw size={16} className="group-active/reset:rotate-[-45deg] transition-transform" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Reset</span>
            </button>
          </div>
          
          <div className="flex-1 flex flex-col items-center justify-start gap-4 overflow-visible w-full pt-2">
            <div className="w-full flex justify-center">
              {renderDraggableType(TYPES.find(t => t.key === 'hundreds'))}
            </div>
            <div className="flex flex-row items-end justify-center gap-8 w-full mt-2">
              {renderDraggableType(TYPES.find(t => t.key === 'tens'))}
              {renderDraggableType(TYPES.find(t => t.key === 'ones'))}
            </div>
          </div>
        </div>

        {/* Workspace - Takes remaining width */}
        <div className="flex-1 min-h-0 relative z-10">
          <div 
            ref={workspaceRef}
            className="h-full bg-white rounded-[2.5rem] border-4 border-white shadow-xl relative overflow-hidden bg-slate-50"
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
                  onPointerDown={(e) => {
                    const target = e.currentTarget || (e.target && e.target.closest('div'));
                    if (!target) return;
                    const rect = target.getBoundingClientRect();
                    dragOffset.current = {
                      x: e.clientX - rect.left,
                      y: e.clientY - rect.top
                    };
                  }}
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
        </div>
      </div>

      {/* Compact Form Footer */}
      <div className="px-6 py-4 bg-white rounded-2xl border-2 border-slate-100 shadow-lg flex items-center justify-between shrink-0">
        <div className="flex items-center gap-8">
          <button
            onClick={sortBlocks}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-black text-[11px] hover:bg-indigo-700 shadow-lg shadow-indigo-100 uppercase transition-all active:scale-95"
          >
            <LayoutGrid size={16} /> Sort Blocks
          </button>

          <div className="h-8 w-px bg-slate-100 mx-2" />

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Hundreds</span>
              <span className="text-xl font-black text-blue-600 tabular-nums">{counts.hundreds * 100}</span>
            </div>
            <div className="w-px h-4 bg-slate-100" />
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Tens</span>
              <span className="text-xl font-black text-green-600 tabular-nums">{counts.tens * 10}</span>
            </div>
            <div className="w-px h-4 bg-slate-100" />
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-yellow-500" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Ones</span>
              <span className="text-xl font-black text-yellow-600 tabular-nums">{counts.ones}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-indigo-50 px-8 py-3 rounded-2xl border border-indigo-100 shadow-inner">
          <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em]">Total Value</span>
          <span className="text-4xl font-black text-indigo-600 tabular-nums leading-none">{totalValue.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
};
