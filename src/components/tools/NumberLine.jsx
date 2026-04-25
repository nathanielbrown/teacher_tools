import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, 
  RotateCcw, 
  Plus, 
  Minus, 
  Eye, 
  EyeOff, 
  MapPin, 
  TrendingUp, 
  Settings2,
  Trash2,
  MoveRight
} from 'lucide-react';
import { ToolHeader } from '../ToolHeader';

export const NumberLine = () => {
  const [range, setRange] = useState({ start: 0, end: 20 });
  const [step, setStep] = useState(1);
  const [showLabels, setShowLabels] = useState(true);
  const [pins, setPins] = useState([]); // { value: number, color: string }
  const [jumps, setJumps] = useState([]); // { start: number, end: number, color: string }
  const [dragStart, setDragStart] = useState(null); // { value: number, x: number }
  const [hoverValue, setHoverValue] = useState(null);
  const svgRef = React.useRef(null);

  const colors = [
    '#3b82f6', // blue
    '#ef4444', // red
    '#10b981', // green
    '#f59e0b', // amber
    '#8b5cf6', // violet
  ];

  const markers = useMemo(() => {
    const m = [];
    const start = parseFloat(range.start) || 0;
    const end = parseFloat(range.end) || 0;
    const count = (end - start) / step;
    if (count > 200 || isNaN(count)) return []; // Safety limit
    for (let i = start; i <= end; i += step) {
      m.push(parseFloat(i.toFixed(2)));
    }
    return m;
  }, [range.start, range.end, step]);

  const togglePin = (val) => {
    setPins(prev => {
      const existing = prev.find(p => Math.abs(p.value - val) < step / 2);
      if (existing) {
        return prev.filter(p => p !== existing);
      }
      return [...prev, { value: val, color: colors[prev.length % colors.length] }];
    });
  };

  const addJump = (s, e) => {
    if (s === e) return;
    setJumps([...jumps, { start: s, end: e, color: colors[jumps.length % colors.length] }]);
  };

  const resetAll = () => {
    setPins([]);
    setJumps([]);
  };

  const getValueFromX = (svgX) => {
    const start = parseFloat(range.start) || 0;
    const end = parseFloat(range.end) || 0;
    const totalWidth = width - 2 * padding;
    const progress = (svgX - padding) / totalWidth;
    const rawVal = start + progress * (end - start);
    // Snap to nearest step
    const snapped = Math.round((rawVal - start) / step) * step + start;
    return parseFloat(snapped.toFixed(2));
  };

  const getSvgPoint = (e) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    return pt.matrixTransform(svg.getScreenCTM().inverse());
  };

  const handleMouseDown = (e) => {
    const pt = getSvgPoint(e);
    const val = getValueFromX(pt.x);
    const start = parseFloat(range.start) || 0;
    const end = parseFloat(range.end) || 0;
    if (val >= start && val <= end) {
      setDragStart({ value: val, x: pt.x });
    }
  };

  const handleMouseMove = (e) => {
    const pt = getSvgPoint(e);
    const val = getValueFromX(pt.x);
    const start = parseFloat(range.start) || 0;
    const end = parseFloat(range.end) || 0;
    if (val >= start && val <= end) {
      setHoverValue(val);
    } else {
      setHoverValue(null);
    }
  };

  const handleMouseUp = (e) => {
    if (!dragStart) return;
    const pt = getSvgPoint(e);
    const endVal = getValueFromX(pt.x);
    const start = parseFloat(range.start) || 0;
    const end = parseFloat(range.end) || 0;
    
    // If it was a simple click (or very short drag), toggle a pin
    if (Math.abs(pt.x - dragStart.x) < 5) {
      togglePin(dragStart.value);
    } else if (endVal >= start && endVal <= end) {
      addJump(dragStart.value, endVal);
    }
    
    setDragStart(null);
  };

  // SVG Coordinate Conversion
  const width = 1000;
  const height = 300;
  const padding = 60;
  const lineY = height / 2 + 50;

  const getX = (val) => {
    const start = parseFloat(range.start) || 0;
    const end = parseFloat(range.end) || 0;
    const totalRange = end - start;
    if (totalRange <= 0) return padding + (width - 2 * padding) / 2;
    const progress = (val - start) / totalRange;
    return padding + progress * (width - 2 * padding);
  };

  return (
    <div className="w-full mx-auto px-4 pt-2 pb-8 h-full flex flex-col gap-8 font-['Outfit']">
      <ToolHeader
        title="Interactive Number Line"
        icon={MoveRight}
        description="Visualize sequences, addition, and subtraction jumps"
        infoContent={
          <>
            <p>
              <strong className="text-white block mb-1">Interactive Controls</strong>
              • <strong>Click a number</strong> to add or remove a pin.<br/>
              • <strong>Click and drag</strong> between two numbers to create a jump.
            </p>
            <p>
              <strong className="text-white block mb-1">Configuration</strong>
              Adjust the range and step size to explore different number scales.
            </p>
          </>
        }
      >
        <button
          onClick={resetAll}
          className="p-3 bg-red-50 text-red-600 rounded-2xl font-black hover:bg-red-100 transition-all active:scale-95 border-2 border-red-100"
          title="Reset Pins & Jumps"
        >
          <RotateCcw size={24} />
        </button>
      </ToolHeader>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 flex-1 min-h-0">
        {/* Controls Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-[2rem] border-2 border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="flex border-b-2 border-slate-100 bg-slate-50 p-4">
              <div className="flex items-center gap-3 text-slate-800">
                <Settings2 size={20} />
                <span className="text-xs font-black uppercase tracking-widest">Configuration</span>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="space-y-4">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest block">Range</label>
                <div className="flex gap-3">
                  <div className="flex-1 space-y-2">
                    <span className="text-[10px] font-bold text-slate-400">Start</span>
                    <input 
                      type="number" 
                      value={range.start}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '-' || val === '') {
                          setRange(prev => ({ ...prev, start: val }));
                        } else {
                          const numVal = Number(val);
                          setRange(prev => ({
                            start: numVal,
                            end: Math.max(numVal, parseFloat(prev.end) || 0)
                          }));
                        }
                      }}
                      className="w-full p-3 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold text-slate-700"
                    />
                  </div>
                  <div className="flex-1 space-y-2">
                    <span className="text-[10px] font-bold text-slate-400">End</span>
                    <input 
                      type="number" 
                      value={range.end}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '-' || val === '') {
                          setRange(prev => ({ ...prev, end: val }));
                        } else {
                          const numVal = Number(val);
                          setRange(prev => ({
                            start: Math.min(numVal, parseFloat(prev.start) || 0),
                            end: numVal
                          }));
                        }
                      }}
                      className="w-full p-3 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold text-slate-700"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest block">Step Size</label>
                <input 
                  type="number" 
                  step="0.1"
                  value={step}
                  onChange={(e) => setStep(Math.max(0.1, Number(e.target.value)))}
                  className="w-full p-3 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold text-slate-700"
                />
              </div>

              <button
                onClick={() => setShowLabels(!showLabels)}
                className={`w-full p-4 rounded-2xl border-2 font-black uppercase text-sm flex items-center justify-center gap-3 transition-all ${
                  showLabels ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-slate-50 border-slate-100 text-slate-400'
                }`}
              >
                {showLabels ? <Eye size={20} /> : <EyeOff size={20} />}
                {showLabels ? 'Labels Visible' : 'Labels Hidden'}
              </button>

              <div className="pt-4 border-t-2 border-slate-50 space-y-3">
                <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest">How to use</div>
                <div className="flex items-start gap-3 text-xs font-bold text-slate-400">
                  <div className="w-5 h-5 rounded bg-slate-100 flex items-center justify-center text-[10px] shrink-0">1</div>
                  <span>Click any number to drop a pin</span>
                </div>
                <div className="flex items-start gap-3 text-xs font-bold text-slate-400">
                  <div className="w-5 h-5 rounded bg-slate-100 flex items-center justify-center text-[10px] shrink-0">2</div>
                  <span>Drag between numbers to create a jump</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Display Area */}
        <div className="lg:col-span-3">
          <div className="bg-white p-6 sm:p-10 rounded-[3rem] border-4 border-slate-800 shadow-2xl overflow-hidden min-h-[400px] flex items-center justify-center relative group/canvas">
            <svg 
              ref={svgRef}
              viewBox={`0 0 ${width} ${height}`} 
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={() => {
                setHoverValue(null);
                setDragStart(null);
              }}
              className="w-full h-auto drop-shadow-sm cursor-crosshair touch-none select-none"
              preserveAspectRatio="xMidYMid meet"
            >
              {/* Main Line */}
              <line 
                x1={padding} y1={lineY} x2={width - padding} y2={lineY} 
                stroke="#1e293b" strokeWidth="4" strokeLinecap="round" 
              />
              <path 
                d={`M ${padding - 10} ${lineY - 10} L ${padding} ${lineY} L ${padding - 10} ${lineY + 10}`} 
                fill="none" stroke="#1e293b" strokeWidth="4" strokeLinecap="round" 
              />
              <path 
                d={`M ${width - padding + 10} ${lineY - 10} L ${width - padding} ${lineY} L ${width - padding + 10} ${lineY + 10}`} 
                fill="none" stroke="#1e293b" strokeWidth="4" strokeLinecap="round" 
              />

              {/* Markers & Labels */}
              {markers.map((val) => {
                const x = getX(val);
                const isWhole = Number.isInteger(val);
                const isHovered = hoverValue === val;
                const isDragOrigin = dragStart?.value === val;

                return (
                  <g key={val} className="transition-all duration-200">
                    <line 
                      x1={x} y1={lineY - (isWhole ? 15 : 8)} x2={x} y2={lineY + (isWhole ? 15 : 8)} 
                      stroke={isHovered || isDragOrigin ? "#6366f1" : "#1e293b"} 
                      strokeWidth={isHovered || isDragOrigin ? "5" : (isWhole ? "3" : "1.5")} 
                    />
                    {showLabels && isWhole && (
                      <text 
                        x={x} y={lineY + 45} 
                        textAnchor="middle" 
                        className={`text-2xl font-black transition-all select-none pointer-events-none ${
                          isHovered || isDragOrigin ? 'fill-indigo-600' : 'fill-slate-800'
                        }`}
                        style={{ fontSize: '20px' }}
                      >
                        {val}
                      </text>
                    )}
                    {/* Invisible hit area for better interaction */}
                    <rect 
                      x={x - 15} y={lineY - 30} width={30} height={60} 
                      fill="transparent" className="cursor-pointer"
                    />
                  </g>
                );
              })}

              {/* Jumps (Arcs) */}
              <AnimatePresence>
                {jumps.map((jump, i) => {
                  const x1 = getX(jump.start);
                  const x2 = getX(jump.end);
                  const radius = Math.abs(x2 - x1) / 2;
                  const centerX = (x1 + x2) / 2;
                  const isPositive = jump.end > jump.start;
                  const path = `M ${x1} ${lineY} A ${radius} ${radius * 0.6} 0 0 ${isPositive ? 1 : 0} ${x2} ${lineY}`;

                  return (
                    <motion.g
                      key={`jump-${i}`}
                      initial={{ opacity: 0, pathLength: 0 }}
                      animate={{ opacity: 1, pathLength: 1 }}
                      exit={{ opacity: 0 }}
                      className="group/jump cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        setJumps(jumps.filter((_, idx) => idx !== i));
                      }}
                    >
                      <path 
                        d={path} 
                        fill="none" 
                        stroke={jump.color} 
                        strokeWidth="4" 
                        strokeDasharray="8 4"
                        className="group-hover/jump:stroke-red-400 transition-colors"
                      />
                      <path 
                        d={isPositive ? 
                          `M ${x2 - 10} ${lineY - 10} L ${x2} ${lineY} L ${x2 - 10} ${lineY + 10}` :
                          `M ${x2 + 10} ${lineY - 10} L ${x2} ${lineY} L ${x2 + 10} ${lineY + 10}`
                        }
                        fill="none" stroke={jump.color} strokeWidth="4" strokeLinecap="round"
                        className="group-hover/jump:stroke-red-400 transition-colors"
                      />
                      <text 
                        x={centerX} y={lineY - (radius * 0.6) - 15} 
                        textAnchor="middle" 
                        className="font-black group-hover/jump:fill-red-400 transition-colors"
                        style={{ fill: jump.color, fontSize: '18px' }}
                      >
                        {isPositive ? '+' : ''}{parseFloat((jump.end - jump.start).toFixed(2))}
                      </text>
                    </motion.g>
                  );
                })}
              </AnimatePresence>

              {/* Drag Preview (Ghost Jump) */}
              {dragStart && hoverValue !== null && hoverValue !== dragStart.value && (
                <g opacity="0.4">
                  {(() => {
                    const x1 = getX(dragStart.value);
                    const x2 = getX(hoverValue);
                    const radius = Math.abs(x2 - x1) / 2;
                    const isPositive = hoverValue > dragStart.value;
                    const path = `M ${x1} ${lineY} A ${radius} ${radius * 0.6} 0 0 ${isPositive ? 1 : 0} ${x2} ${lineY}`;
                    return (
                      <>
                        <path d={path} fill="none" stroke="#6366f1" strokeWidth="4" strokeDasharray="8 4" />
                        <text 
                          x={(x1 + x2) / 2} y={lineY - (radius * 0.6) - 15} 
                          textAnchor="middle" className="font-black fill-indigo-600" style={{ fontSize: '18px' }}
                        >
                          {isPositive ? '+' : ''}{parseFloat((hoverValue - dragStart.value).toFixed(2))}
                        </text>
                      </>
                    );
                  })()}
                </g>
              )}

              {/* Pins */}
              <AnimatePresence>
                {pins.map((pin, i) => {
                  const x = getX(pin.value);
                  return (
                    <motion.g
                      key={`pin-${pin.value}`}
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="cursor-pointer group/pin select-none"
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation();
                        togglePin(pin.value);
                      }}
                    >
                      <line x1={x} y1={lineY} x2={x} y2={lineY - 60} stroke={pin.color} strokeWidth="3" className="group-hover/pin:stroke-red-400 transition-colors" />
                      <circle cx={x} cy={lineY - 70} r="12" fill={pin.color} className="group-hover/pin:fill-red-400 transition-colors" />
                      <text 
                        x={x} y={lineY - 100} 
                        textAnchor="middle" 
                        className="font-black group-hover/pin:fill-red-400 transition-colors"
                        style={{ fill: pin.color, fontSize: '16px' }}
                      >
                        {pin.value}
                      </text>
                    </motion.g>
                  );
                })}
              </AnimatePresence>
            </svg>

            <div className="absolute bottom-8 right-10 flex gap-4">
              <div className="flex items-center gap-2 text-slate-400 font-bold text-sm">
                <Settings2 size={16} />
                Range: {range.start} to {range.end} • Step: {step}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
