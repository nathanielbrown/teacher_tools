import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, 
  Plus, 
  Trash2, 
  Settings2, 
  RotateCcw,
  Pencil,
  Calculator,
  MousePointer2,
  HelpCircle,
  Info
} from 'lucide-react';
import { ToolHeader } from '../ToolHeader';
import * as math from 'mathjs';

const getRandomColor = () => `hsl(${Math.random() * 360}, 75%, 50%)`;

export const TeacherMath = () => {
  const [elements, setElements] = useState([
    { id: 1, raw: '(2, 3)', color: '#3b82f6' },
    { id: 2, raw: '(-4, 1)', color: '#ef4444' },
    { id: 3, raw: 'x', color: '#10b981' },
    { id: 'initial-empty', raw: '', color: getRandomColor() }
  ]);

  const [gridConfig, setGridConfig] = useState({
    range: 10,
    step: 1,
    showLabels: true
  });

  const svgRef = useRef(null);
  const size = 800;
  const padding = 40;
  const innerSize = size - padding * 2;
  const center = size / 2;
  const scale = innerSize / (gridConfig.range * 2);

  const toSvgX = (cartX) => center + cartX * scale;
  const toSvgY = (cartY) => center - cartY * scale;
  const toCartX = (svgX) => (svgX - center) / scale;
  const toCartY = (svgY) => (center - svgY) / scale;

  const parsedElements = useMemo(() => {
    let pointCount = 0;
    return elements.map(el => {
      const clean = el.raw.trim();
      if (!clean) return { ...el, type: 'empty' };

      const pointMatch = clean.match(/^\s*\((-?\d*\.?\d+)\s*,\s*(-?\d*\.?\d+)\)\s*$/);
      if (pointMatch) {
        const label = String.fromCharCode(65 + (pointCount % 26));
        pointCount++;
        return {
          ...el,
          type: 'point',
          x: parseFloat(pointMatch[1]),
          y: parseFloat(pointMatch[2]),
          label
        };
      }

      try {
        let f = clean;
        if (f.toLowerCase().startsWith('y=') || f.toLowerCase().startsWith('y =')) {
          f = f.substring(f.indexOf('=') + 1).trim();
        }
        const compiled = math.compile(f);
        compiled.evaluate({ x: 0 }); 
        return { ...el, type: 'formula', formula: f, compiled, displayFormula: `y = ${f}` };
      } catch (err) {
        return { ...el, type: 'error', error: 'Invalid format' };
      }
    });
  }, [elements]);

  const handleSvgClick = (e) => {
    const rect = svgRef.current.getBoundingClientRect();
    const scaleX = size / rect.width;
    const scaleY = size / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    const cartX = Math.round(toCartX(x) * 2) / 2;
    const cartY = Math.round(toCartY(y) * 2) / 2;

    if (Math.abs(cartX) <= gridConfig.range && Math.abs(cartY) <= gridConfig.range) {
      const newPoint = {
        id: Date.now(),
        raw: `(${cartX}, ${cartY})`,
        color: getRandomColor()
      };
      // Insert before the last empty slot
      const newElements = [...elements];
      newElements.splice(newElements.length - 1, 0, newPoint);
      setElements(newElements);
    }
  };

  const updateElement = (id, newRaw) => {
    setElements(prev => {
      const index = prev.findIndex(e => e.id === id);
      const newElements = [...prev];
      newElements[index] = { ...newElements[index], raw: newRaw };
      
      // If we typed in the last element, add a new empty one
      if (index === prev.length - 1 && newRaw.trim() !== '') {
        newElements.push({ id: Date.now(), raw: '', color: getRandomColor() });
      }
      
      return newElements;
    });
  };

  const removeElement = (id) => {
    if (elements.length <= 1) {
      setElements([{ id: Date.now(), raw: '', color: getRandomColor() }]);
      return;
    }
    setElements(elements.filter(e => e.id !== id));
  };

  const renderGrid = () => {
    const lines = [];
    const range = gridConfig.range;
    const step = gridConfig.step;

    for (let i = -range; i <= range; i += step) {
      const pos = toSvgX(i);
      const isAxis = i === 0;
      lines.push(
        <line key={`v-${i}`} x1={pos} y1={padding} x2={pos} y2={size - padding} stroke={isAxis ? '#1e293b' : '#e2e8f0'} strokeWidth={isAxis ? 2 : 1} />
      );
      const yPos = toSvgY(i);
      lines.push(
        <line key={`h-${i}`} x1={padding} y1={yPos} x2={size - padding} y2={yPos} stroke={isAxis ? '#1e293b' : '#e2e8f0'} strokeWidth={isAxis ? 2 : 1} />
      );

      if (gridConfig.showLabels && i !== 0) {
        lines.push(<text key={`xl-${i}`} x={pos} y={center + 15} textAnchor="middle" className="text-[10px] font-bold fill-slate-400">{i}</text>);
        lines.push(<text key={`yl-${i}`} x={center - 15} y={yPos + 4} textAnchor="end" className="text-[10px] font-bold fill-slate-400">{i}</text>);
      }
    }
    lines.push(<text key="origin" x={center - 10} y={center + 15} textAnchor="end" className="text-[10px] font-bold fill-slate-500">0</text>);
    return lines;
  };

  const renderFormulaPath = (compiled) => {
    try {
      const points = [];
      const range = gridConfig.range;
      const step = range / 100;
      for (let x = -range; x <= range; x += step) {
        const y = compiled.evaluate({ x });
        if (Math.abs(y) > range * 5) continue;
        points.push(`${toSvgX(x)},${toSvgY(y)}`);
      }
      return points.join(' ');
    } catch (e) { return ''; }
  };

  return (
    <div className="w-full mx-auto px-4 pt-2 pb-8 h-full flex flex-col gap-6 font-['Outfit']">
      <ToolHeader
        title="Cartesian Plane"
        icon={TrendingUp}
        description="Explore coordinates and equations"
        infoContent={
          <div className="space-y-4">
            <p><strong className="text-white block mb-1">Editing</strong>Click any row in the sidebar to edit the formula or point coordinates. Points use the <code className="bg-white/20 px-1 rounded">(x, y)</code> format.</p>
            <p><strong className="text-white block mb-1">New Elements</strong>Type in the bottom-most empty row to add a new formula or point. You can also click the grid to drop points.</p>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">
        {/* Left: Equation List */}
        <div className="lg:col-span-3 flex flex-col gap-4 min-h-0">
          <div className="flex items-center justify-between px-2">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Equations</h4>

            <button onClick={() => setElements([{ id: Date.now(), raw: '', color: getRandomColor() }])} className="text-xs font-bold text-red-500 hover:underline flex items-center gap-1">
              <RotateCcw size={12} /> Clear
            </button>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-2">
            <AnimatePresence initial={false}>
              {elements.map((element, index) => {
                const parsed = parsedElements[index];
                const isInvalid = parsed.type === 'error';
                
                return (
                  <motion.div
                    key={element.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={`bg-white p-2 rounded-xl shadow-sm border-2 transition-all flex flex-col gap-1 ${isInvalid ? 'border-red-100 bg-red-50/10' : 'border-slate-50 focus-within:border-blue-200 focus-within:shadow-md'}`}
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-4 h-4 rounded-full flex-shrink-0 shadow-inner"
                        style={{ backgroundColor: element.raw.trim() ? element.color : '#e2e8f0' }}
                      />
                      <input
                        type="text"
                        value={element.raw}
                        onChange={(e) => updateElement(element.id, e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                        placeholder={index === elements.length - 1 ? "Add new..." : "e.g. y = 2x + 1 or (3, 4)"}
                        className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-bold font-mono text-slate-700 placeholder:text-slate-300 placeholder:font-normal"
                      />
                      {index < elements.length - 1 && (
                        <button onClick={() => removeElement(element.id)} className="p-1 text-slate-300 hover:text-red-500 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                    {isInvalid && element.raw.trim() && (
                      <p className="text-[10px] text-red-500 font-bold px-7">Invalid format</p>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>

        {/* Right: Plane */}
        <div className="lg:col-span-9 flex flex-col items-center justify-center relative min-h-0">
          <div className="bg-white rounded-[3rem] shadow-2xl border border-slate-100 relative overflow-hidden group w-full flex items-center justify-center flex-1">
            
            {/* Help Examples Overlay */}
            <div className="absolute top-8 right-8 z-20 group/help">
              <button className="p-2 bg-white rounded-full shadow-lg border border-slate-100 text-slate-400 hover:text-blue-500 hover:border-blue-200 transition-all">
                <HelpCircle size={24} />
              </button>
              
              <div className="absolute top-full right-0 mt-3 w-64 bg-white/95 backdrop-blur-md p-5 rounded-3xl shadow-2xl border border-slate-100 opacity-0 scale-95 pointer-events-none group-hover/help:opacity-100 group-hover/help:scale-100 group-hover/help:pointer-events-auto transition-all duration-300 origin-top-right">
                <div className="flex items-center gap-2 mb-4 border-b pb-2">
                  <Info size={16} className="text-blue-500" />
                  <h5 className="text-xs font-black text-slate-800 uppercase tracking-widest">Examples</h5>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 text-left">Coordinates</p>
                    <code className="block bg-slate-50 p-2 rounded-xl text-xs font-mono font-bold text-blue-600 text-left">(3, 4)</code>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 text-left">Linear</p>
                    <code className="block bg-slate-50 p-2 rounded-xl text-xs font-mono font-bold text-emerald-600 text-left">y = 2x + 1</code>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 text-left">Quadratic</p>
                    <code className="block bg-slate-50 p-2 rounded-xl text-xs font-mono font-bold text-amber-600 text-left">y = x^2</code>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 text-left">Trig</p>
                    <code className="block bg-slate-50 p-2 rounded-xl text-xs font-mono font-bold text-purple-600 text-left">y = sin(x)</code>
                  </div>
                </div>
              </div>
            </div>
            <svg 
              ref={svgRef}
              viewBox={`0 0 ${size} ${size}`}
              className="w-full max-w-[800px] h-auto cursor-crosshair select-none"
              onClick={handleSvgClick}
            >
              <defs>
                <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
                  <feOffset dx="0" dy="2" result="offsetblur" />
                  <feComponentTransfer><feFuncA type="linear" slope="0.2" /></feComponentTransfer>
                  <feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
              </defs>

              {renderGrid()}

              {parsedElements.map(el => {
                if (el.type === 'formula') {
                  const pathData = renderFormulaPath(el.compiled);
                  if (!pathData) return null;
                  return (
                    <motion.polyline
                      key={`svg-f-${el.id}`}
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ pathLength: 1, opacity: 1 }}
                      points={pathData}
                      stroke={el.color}
                      strokeWidth="3"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      filter="url(#shadow)"
                    />
                  );
                }
                if (el.type === 'point') {
                  return (
                    <motion.g
                      key={`svg-p-${el.id}`}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1, x: toSvgX(el.x), y: toSvgY(el.y) }}
                      transition={{ type: 'spring', damping: 15 }}
                    >
                      <circle r="8" fill={el.color} stroke="white" strokeWidth="3" filter="url(#shadow)" />
                      <text y="-15" textAnchor="middle" className="text-[12px] font-black fill-slate-800" style={{ pointerEvents: 'none' }}>
                        {el.label} ({el.x}, {el.y})
                      </text>
                    </motion.g>
                  );
                }
                return null;
              })}
            </svg>

            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-white/90 backdrop-blur-md px-6 py-3 rounded-full border border-slate-200 shadow-xl">
               <span className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Settings2 size={14} /> Zoom</span>
               <input type="range" min="5" max="50" step="5" value={gridConfig.range} onChange={(e) => setGridConfig({ ...gridConfig, range: parseInt(e.target.value) })} className="w-32 accent-slate-800" />
            </div>

            <div className="absolute bottom-6 right-6">
              <div className="bg-slate-800/90 text-white px-4 py-3 rounded-2xl backdrop-blur shadow-xl flex items-center gap-4">
                <span className="text-xs font-bold text-white/80">Labels</span>
                <button onClick={() => setGridConfig({ ...gridConfig, showLabels: !gridConfig.showLabels })} className={`w-10 h-5 rounded-full relative transition-colors ${gridConfig.showLabels ? 'bg-blue-500' : 'bg-slate-600'}`}>
                  <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${gridConfig.showLabels ? 'left-6' : 'left-1'}`} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

