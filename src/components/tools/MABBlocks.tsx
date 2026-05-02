import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCcw, Trash2, Box, MousePointer2, Scissors } from 'lucide-react';
import { FormattedMessage } from 'react-intl';
import { useHeader } from '../../contexts/HeaderContext';
import { useSettings } from '../../contexts/SettingsContext';
import { ToolPanel } from '../shared/ToolPanel';
import { audioEngine } from '../../utils/audio';

// 1. Constants
const BLOCK_TYPES = [
  { id: 'flat', name: '100s', value: 100, color: '#3b82f6' },
  { id: 'long', name: '10s', value: 10, color: '#22c55e' },
  { id: 'unit', name: '1s', value: 1, color: '#f59e0b' },
];

const UNIT_SIZE = 15;
const FLAT_SIZE = 10 * UNIT_SIZE + 9;
const LONG_W = UNIT_SIZE;
const LONG_H = 10 * UNIT_SIZE + 9;

// 2. Config (None)

// 3. Text (Help and Info)
const HelpContent = () => (
  <div className="space-y-4 font-['Outfit']">
    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">
      <FormattedMessage id="mabblocks.help.title" defaultMessage="MAB Blocks" />
    </h3>
    <div className="space-y-3">
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center text-xs font-black text-indigo-600 shrink-0">1</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">
          <FormattedMessage id="mabblocks.help.step1" defaultMessage="Click a <b>Block</b> to add it." values={{ b: (chunks: React.ReactNode) => <b>{chunks}</b> }} />
        </p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center text-xs font-black text-blue-600 shrink-0">2</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">
          <FormattedMessage id="mabblocks.help.step2" defaultMessage="<b>Move</b> blocks to the right place." values={{ b: (chunks: React.ReactNode) => <b>{chunks}</b> }} />
        </p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-purple-50 flex items-center justify-center text-xs font-black text-purple-600 shrink-0">3</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">
          <FormattedMessage id="mabblocks.help.step3" defaultMessage="Use <b>Cut</b> to break blocks apart." values={{ b: (chunks: React.ReactNode) => <b>{chunks}</b> }} />
        </p>
      </div>
    </div>
  </div>
);

// 4. Local Storage (None)

// 5. Classes
const Unit = ({ color, size = UNIT_SIZE }: { color: string; size?: number }) => (
  <div 
    className="relative rounded-[2px] border border-black/10"
    style={{ 
      width: size, height: size, backgroundColor: color,
      backgroundImage: `linear-gradient(135deg, rgba(255,255,255,0.4) 0%, rgba(0,0,0,0.1) 100%)`
    }}
  >
    <div className="absolute inset-[1px] border border-white/20 rounded-[1px]" />
  </div>
);

// 6. Functions (Visual render helper)
const renderBlockVisual = (typeId: string, color: string) => {
  if (typeId === 'unit') return <Unit color={color} />;
  if (typeId === 'long') return (
    <div className="flex flex-col gap-[1px] bg-black/5 rounded-sm overflow-hidden">
      {Array.from({ length: 10 }).map((_, i) => <Unit key={i} color={color} />)}
    </div>
  );
  if (typeId === 'flat') return (
    <div className="grid grid-cols-10 gap-[1px] bg-black/5 rounded-sm overflow-hidden">
      {Array.from({ length: 100 }).map((_, i) => <Unit key={i} color={color} />)}
    </div>
  );
  return null;
};

// 7. Component
export const MABBlocks = () => {
  const { setOnReset, clearHeader, setHelpContent } = useHeader();
  const { settings } = useSettings();
  const [blocks, setBlocks] = useState<any[]>([]);
  const [mode, setMode] = useState<'move' | 'cut'>('move');
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const blockIdCounter = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handlePointerDown = (e: React.PointerEvent, block: any) => {
    e.stopPropagation();
    if (mode === 'cut') {
      splitBlock(block);
      return;
    }
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const s = rect.width / containerRef.current!.offsetWidth;
    
    const logicalMouseX = (e.clientX - rect.left) / s;
    const logicalMouseY = (e.clientY - rect.top) / s;
    
    setDraggingId(block.id);
    setDragOffset({
      x: block.x - logicalMouseX,
      y: block.y - logicalMouseY
    });
    
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!draggingId) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const s = rect.width / containerRef.current!.offsetWidth;
    
    const logicalMouseX = (e.clientX - rect.left) / s;
    const logicalMouseY = (e.clientY - rect.top) / s;
    
    setBlocks(prev => prev.map(b => b.id === draggingId ? {
      ...b,
      x: logicalMouseX + dragOffset.x,
      y: logicalMouseY + dragOffset.y
    } : b));
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (draggingId) {
      setDraggingId(null);
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // Ignore if pointer capture was already lost
      }
    }
  };

  const addBlock = (type: any) => {
    if (!containerRef.current) return;
    const stageWidth = containerRef.current.offsetWidth;
    const unitWidth = stageWidth / 6;
    
    const colWidths = { flat: unitWidth * 3, long: unitWidth * 2, unit: unitWidth * 1 };
    const colStarts = { flat: 0, long: unitWidth * 3, unit: unitWidth * 5 };

    const existingOfType = blocks.filter(b => b.typeId === type.id).length;
    let newX = 0;
    let newY = 0;

    if (type.id === 'flat') {
      const flatCols = 2;
      const flatMarginX = (colWidths.flat - (flatCols * FLAT_SIZE + (flatCols - 1) * 20)) / 2;
      newX = colStarts.flat + flatMarginX + (existingOfType % flatCols) * (FLAT_SIZE + 20) + FLAT_SIZE / 2;
      newY = 80 + Math.floor(existingOfType / flatCols) * (FLAT_SIZE + 20) + FLAT_SIZE / 2;
    } else if (type.id === 'long') {
      const longCols = 5;
      const longMarginX = (colWidths.long - (longCols * LONG_W + (longCols - 1) * 10)) / 2;
      newX = colStarts.long + longMarginX + (existingOfType % longCols) * (LONG_W + 10) + LONG_W / 2;
      newY = 80 + Math.floor(existingOfType / longCols) * (LONG_H + 10) + LONG_H / 2;
    } else if (type.id === 'unit') {
      const unitCols = 5;
      const unitMarginX = (colWidths.unit - (unitCols * UNIT_SIZE + (unitCols - 1) * 5)) / 2;
      newX = colStarts.unit + unitMarginX + (existingOfType % unitCols) * (UNIT_SIZE + 5) + UNIT_SIZE / 2;
      newY = 80 + Math.floor(existingOfType / unitCols) * (UNIT_SIZE + 5) + UNIT_SIZE / 2;
    }
    
    const newBlock = {
      id: `block-${blockIdCounter.current++}`,
      typeId: type.id,
      x: newX,
      y: newY,
      value: type.value,
      color: type.color
    };
    setBlocks(prev => [...prev, newBlock]);
    audioEngine.playTick(settings.soundTheme);
  };

  const splitBlock = (block: any) => {
    if (block.typeId === 'unit') return;
    const isFlat = block.typeId === 'flat';
    const newTypeId = isFlat ? 'long' : 'unit';
    const newType = BLOCK_TYPES.find(t => t.id === newTypeId);
    if (!newType) return;
    
    const newBlocks = Array.from({ length: 10 }).map((_, i) => ({
      id: `block-${blockIdCounter.current++}`,
      typeId: newTypeId,
      x: isFlat ? block.x - 72 + (i * 16) : block.x,
      y: isFlat ? block.y : block.y - 72 + (i * 16),
      value: newType.value,
      color: newType.color
    }));
    setBlocks(prev => [...prev.filter(b => b.id !== block.id), ...newBlocks]);
    audioEngine.playTick(settings.soundTheme);
  };

  const regroupBlocksInternal = useCallback((currentBlocks: any[]) => {
    if (!containerRef.current) return currentBlocks;
    const stageWidth = containerRef.current.offsetWidth;
    
    const unitWidth = stageWidth / 6;
    const colWidths = { flat: unitWidth * 3, long: unitWidth * 2, unit: unitWidth * 1 };
    const colStarts = { flat: 0, long: unitWidth * 3, unit: unitWidth * 5 };

    const newBlocks = [...currentBlocks];
    
    // 100s: 2 columns grid
    const flats = newBlocks.filter(b => b.typeId === 'flat');
    const flatCols = 2;
    const flatMarginX = (colWidths.flat - (flatCols * FLAT_SIZE + (flatCols - 1) * 20)) / 2;
    flats.forEach((b, i) => {
      b.x = colStarts.flat + flatMarginX + (i % flatCols) * (FLAT_SIZE + 20) + FLAT_SIZE / 2;
      b.y = 80 + Math.floor(i / flatCols) * (FLAT_SIZE + 20) + FLAT_SIZE / 2;
    });

    // 10s: 5 side grid
    const longs = newBlocks.filter(b => b.typeId === 'long');
    const longCols = 5;
    const longMarginX = (colWidths.long - (longCols * LONG_W + (longCols - 1) * 10)) / 2;
    longs.forEach((b, i) => {
      b.x = colStarts.long + longMarginX + (i % longCols) * (LONG_W + 10) + LONG_W / 2;
      b.y = 80 + Math.floor(i / longCols) * (LONG_H + 10) + LONG_H / 2;
    });

    // 1s: 5 side grid
    const units = newBlocks.filter(b => b.typeId === 'unit');
    const unitCols = 5;
    const unitMarginX = (colWidths.unit - (unitCols * UNIT_SIZE + (unitCols - 1) * 5)) / 2;
    units.forEach((b, i) => {
      b.x = colStarts.unit + unitMarginX + (i % unitCols) * (UNIT_SIZE + 5) + UNIT_SIZE / 2;
      b.y = 80 + Math.floor(i / unitCols) * (UNIT_SIZE + 5) + UNIT_SIZE / 2;
    });

    return newBlocks;
  }, []);

  const regroupBlocks = useCallback(() => {
    setBlocks(prev => {
      const sorted = regroupBlocksInternal(prev);
      audioEngine.playTick(settings.soundTheme);
      return sorted;
    });
  }, [regroupBlocksInternal, settings.soundTheme]);

  const mergeAndSort = useCallback(() => {
    const total = blocks.reduce((acc, b) => acc + b.value, 0);
    const numFlats = Math.floor(total / 100);
    const numLongs = Math.floor((total % 100) / 10);
    const numUnits = total % 10;

    const nextBlocks: any[] = [];
    
    for (let i = 0; i < numFlats; i++) {
      nextBlocks.push({
        id: `block-${blockIdCounter.current++}`,
        typeId: 'flat',
        x: 0, y: 0, value: 100, color: BLOCK_TYPES[0].color
      });
    }
    for (let i = 0; i < numLongs; i++) {
      nextBlocks.push({
        id: `block-${blockIdCounter.current++}`,
        typeId: 'long',
        x: 0, y: 0, value: 10, color: BLOCK_TYPES[1].color
      });
    }
    for (let i = 0; i < numUnits; i++) {
      nextBlocks.push({
        id: `block-${blockIdCounter.current++}`,
        typeId: 'unit',
        x: 0, y: 0, value: 1, color: BLOCK_TYPES[2].color
      });
    }

    setBlocks(regroupBlocksInternal(nextBlocks));
    audioEngine.playTick(settings.soundTheme);
  }, [blocks, regroupBlocksInternal, settings.soundTheme]);

  const removeBlock = (id: string) => {
    setBlocks(prev => prev.filter(b => b.id !== id));
    audioEngine.playTick(settings.soundTheme);
  };

  const resetBlocks = useCallback(() => {
    setBlocks([]);
    audioEngine.playTick(settings.soundTheme);
  }, [settings.soundTheme]);

  useEffect(() => {
    setOnReset(() => resetBlocks);
    setHelpContent(<HelpContent />);
    return () => clearHeader();
  }, [clearHeader, setOnReset, resetBlocks, setHelpContent]);

  const totalValue = blocks.reduce((acc, b) => acc + b.value, 0);
  const counts = {
    flat: blocks.filter(b => b.typeId === 'flat').length,
    long: blocks.filter(b => b.typeId === 'long').length,
    unit: blocks.filter(b => b.typeId === 'unit').length,
  };

  return (
    <ToolPanel alignTop fluid baseWidth={1200} baseHeight={800}>
      <div className="flex w-full h-full gap-8 p-8">
        {/* Sidebar Bank */}
        <div className="w-[180px] shrink-0 flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            {BLOCK_TYPES.map(type => (
              <button
                key={type.id}
                onClick={() => addBlock(type)}
                className="w-full h-48 bg-white rounded-2xl border-4 border-white flex flex-col items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all group"
              >
                <div className="flex items-center justify-center h-40">
                  {renderBlockVisual(type.id, type.color)}
                </div>
                <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">{type.name}</span>
              </button>
            ))}
          </div>

          {/* Controls */}
          <div className="flex flex-col gap-2 mt-4">
            <div className="flex bg-slate-100/50 p-1 rounded-xl">
              <button 
                onClick={() => setMode('move')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg font-black text-[9px] uppercase tracking-widest transition-all ${mode === 'move' ? 'bg-white text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <MousePointer2 size={12} />
                <FormattedMessage id="mabblocks.mode.move" defaultMessage="Move" />
              </button>
              <button 
                onClick={() => setMode('cut')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg font-black text-[9px] uppercase tracking-widest transition-all ${mode === 'cut' ? 'bg-white text-rose-600' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <Scissors size={12} />
                <FormattedMessage id="mabblocks.mode.cut" defaultMessage="Cut" />
              </button>
            </div>

            <button onClick={regroupBlocks} className="w-full py-2 bg-white border-2 border-slate-100 text-slate-400 rounded-xl font-black text-[9px] uppercase tracking-widest hover:border-indigo-100 hover:text-indigo-600 transition-all">
              <FormattedMessage id="mabblocks.action.sort" defaultMessage="Sort" />
            </button>
            <button onClick={mergeAndSort} className="w-full py-2 bg-white border-2 border-slate-100 text-slate-400 rounded-xl font-black text-[9px] uppercase tracking-widest hover:border-emerald-100 hover:text-emerald-600 transition-all">
              <FormattedMessage id="mabblocks.action.mergesort" defaultMessage="Merge + Sort" />
            </button>
            <button onClick={resetBlocks} className="w-full py-2 bg-white border-2 border-slate-100 text-slate-400 rounded-xl font-black text-[9px] uppercase tracking-widest hover:border-rose-100 hover:text-rose-600 transition-all">
              <FormattedMessage id="mabblocks.action.clear" defaultMessage="Reset" />
            </button>
          </div>
          
          <div className="mt-auto p-4 bg-indigo-50 rounded-2xl text-indigo-600 flex flex-col items-center gap-0 border-4 border-white">
            <span className="text-[9px] font-black uppercase tracking-widest opacity-60">Total</span>
            <div className="text-3xl font-black tabular-nums">{totalValue}</div>
          </div>
        </div>

        {/* Assembly Stage */}
        <div className="flex-1 flex flex-col bg-white/50 backdrop-blur-sm rounded-[3rem] border-4 border-white overflow-hidden relative">
          <div className="flex-1 flex relative">
            {[ 
              { id: 'flat', label: '100s', ratio: 3 }, 
              { id: 'long', label: '10s', ratio: 2 }, 
              { id: 'unit', label: '1s', ratio: 1 } 
            ].map((col) => (
              <div key={col.id} className="flex flex-col border-r last:border-r-0 border-black/5 relative" style={{ flex: col.ratio }}>
                <div className="py-4 text-center border-b border-black/5 relative z-10">
                   <h4 className="text-lg font-black text-slate-800 uppercase tracking-widest">
                     {col.label}
                   </h4>
                </div>
              </div>
            ))}

            <div ref={containerRef} className="absolute inset-0 z-20 overflow-hidden">
              <AnimatePresence>
                {blocks.map(block => (
                  <motion.div
                    key={block.id} 
                    onPointerDown={(e) => handlePointerDown(e, block)}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerCancel={handlePointerUp}
                    initial={{ scale: 0 }} 
                    animate={{ scale: draggingId === block.id ? 1.05 : 1 }}
                    exit={{ scale: 0 }}
                    className={`absolute ${mode === 'move' ? 'cursor-move' : 'cursor-pointer'} pointer-events-auto group touch-none`}
                    style={{ 
                      left: block.x, 
                      top: block.y, 
                      x: '-50%', 
                      y: '-50%',
                      zIndex: draggingId === block.id ? 50 : 1 
                    }}
                  >
                    <div className="relative">
                       {renderBlockVisual(block.typeId, block.color)}
                       <button 
                         onClick={(e) => {
                           e.stopPropagation();
                           removeBlock(block.id);
                         }} 
                         className="absolute bg-rose-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all border-2 border-white z-10"
                         style={{ 
                           width: '24px', 
                           height: '24px', 
                           top: '-20px', 
                           right: '-20px' 
                         }}
                       >
                         <Trash2 size={12} strokeWidth={3} />
                       </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {blocks.length === 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center opacity-10 pointer-events-none">
                 <MousePointer2 size={80} strokeWidth={1} className="mb-4" />
                 <p className="text-sm font-black uppercase tracking-widest">
                   <FormattedMessage id="mabblocks.status.empty" defaultMessage="Add some blocks" />
                 </p>
              </div>
            )}
          </div>

          {/* Color-coded Total Bar */}
          <div className="h-20 bg-slate-100 flex border-t-4 border-white">
            <div 
              className="flex items-center justify-center gap-2 transition-all duration-500"
              style={{ flex: 3, backgroundColor: `${BLOCK_TYPES[0].color}20`, color: BLOCK_TYPES[0].color }}
            >
              <span className="text-2xl font-black tabular-nums">{counts.flat * 100}</span>
              <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">in 100s</span>
            </div>
            <div 
              className="flex items-center justify-center gap-2 transition-all duration-500"
              style={{ flex: 2, backgroundColor: `${BLOCK_TYPES[1].color}20`, color: BLOCK_TYPES[1].color }}
            >
              <span className="text-2xl font-black tabular-nums">{counts.long * 10}</span>
              <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">in 10s</span>
            </div>
            <div 
              className="flex items-center justify-center gap-2 transition-all duration-500"
              style={{ flex: 1, backgroundColor: `${BLOCK_TYPES[2].color}20`, color: BLOCK_TYPES[2].color }}
            >
              <span className="text-2xl font-black tabular-nums">{counts.unit * 1}</span>
              <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">in 1s</span>
            </div>
          </div>
        </div>
      </div>
    </ToolPanel>
  );
};

export default MABBlocks;
