import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Eye, 
  EyeOff, 
  MousePointer2,
  RotateCcw,
  Settings2
} from 'lucide-react';
import { useHeader } from '../../contexts/HeaderContext';
import { useSettings } from '../../contexts/SettingsContext';
import { audioEngine } from '../../utils/audio';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { FormattedMessage } from 'react-intl';
import ToolPanel from '../shared/ToolPanel';
import SettingsPanel from '../shared/SettingsPanel';

// 1. Constants
const COLORS = [
  '#6366f1', // indigo
  '#10b981', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#a855f7', // violet
];

const WIDTH = 1200;
const HEIGHT = 400;
const PADDING = 80;
const LINE_Y = HEIGHT / 2 + 50;

// 6. Functions
const getX = (val: number, rangeStart: number, rangeEnd: number) => {
  const start = rangeStart || 0;
  const end = rangeEnd || 0;
  const totalRange = end - start;
  if (totalRange <= 0) return PADDING + (WIDTH - 2 * PADDING) / 2;
  const progress = (val - start) / totalRange;
  return PADDING + progress * (WIDTH - 2 * PADDING);
};

const getValueFromX = (svgX: number, rangeStart: number, rangeEnd: number, step: number) => {
  const start = rangeStart || 0;
  const end = rangeEnd || 0;
  const totalWidth = WIDTH - 2 * PADDING;
  const progress = (svgX - PADDING) / totalWidth;
  const rawVal = start + progress * (end - start);
  const snapped = Math.round((rawVal - start) / step) * step + start;
  return parseFloat(snapped.toFixed(2));
};

// 3. Text (Help and Info)
const HelpContent = () => (
  <div className="space-y-4 font-['Outfit']">
    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">
      <FormattedMessage id="numberline.help.title" />
    </h3>
    <div className="space-y-3">
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center text-xs font-black text-indigo-600 shrink-0">1</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">
          <FormattedMessage id="numberline.help.step1" defaultMessage="Set your numbers in the settings." />
        </p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center text-xs font-black text-indigo-600 shrink-0">2</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">
          <FormattedMessage id="numberline.help.step2" defaultMessage="Click on any number to add a pin." />
        </p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center text-xs font-black text-indigo-600 shrink-0">3</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">
          <FormattedMessage id="numberline.help.step3" defaultMessage="Drag from one number to another to make a jump." />
        </p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center text-xs font-black text-indigo-600 shrink-0">4</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">
          <FormattedMessage id="numberline.help.step4" defaultMessage="Click a pin or jump to remove it." />
        </p>
      </div>
    </div>
  </div>
);

export const NumberLine = () => {
  const { setOnReset, clearHeader, setHelpContent, isConfigOpen, setIsConfigOpen, setHasConfig, setOnConfigToggle } = useHeader();
  const { settings } = useSettings();
  
  // Local Storage Hooks
  const [range, setRange] = useLocalStorage('number_line_range', { start: 0, end: 20 });
  const [step, setStep] = useLocalStorage('number_line_step', 1);
  const [showLabels, setShowLabels] = useLocalStorage('number_line_labels', true);
  const [pins, setPins] = useLocalStorage('number_line_pins', []); 
  const [jumps, setJumps] = useLocalStorage('number_line_jumps', []); 
  
  // State
  const [dragStart, setDragStart] = useState<{ value: number, x: number } | null>(null);
  const [previewJump, setPreviewJump] = useState<{ start: number, end: number } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 1024 : false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const resetAll = useCallback(() => {
    setPins([]);
    setJumps([]);
    setRange({ start: 0, end: 20 });
    setStep(1);
    setShowLabels(true);
    audioEngine.playTick(settings.soundTheme);
  }, [settings.soundTheme, setPins, setJumps, setRange, setStep, setShowLabels]);

  useEffect(() => {
    setOnReset(() => resetAll);
    setHelpContent(<HelpContent />);
    setHasConfig(true);
    setOnConfigToggle(() => () => setIsConfigOpen(prev => !prev));
    return () => clearHeader();
  }, [clearHeader, setOnReset, setHelpContent, resetAll, setHasConfig, setOnConfigToggle, setIsConfigOpen]);

  const markers = useMemo(() => {
    const m = [];
    const start = parseFloat(range.start as any) || 0;
    const end = parseFloat(range.end as any) || 0;
    const count = (end - start) / step;
    if (count > 200 || isNaN(count)) return []; // Safety limit
    for (let i = start; i <= end; i += step) {
      m.push(parseFloat(i.toFixed(2)));
    }
    return m;
  }, [range.start, range.end, step]);

  const togglePin = (val: number) => {
    setPins((prev: any[]) => {
      const existing = prev.find(p => Math.abs(p.value - val) < step / 2);
      if (existing) {
        audioEngine.playTick(settings.soundTheme);
        return prev.filter(p => p !== existing);
      }
      audioEngine.playTick(settings.soundTheme);
      return [...prev, { value: val, color: COLORS[prev.length % COLORS.length] }];
    });
  };

  const addJump = (s: number, e: number) => {
    if (s === e) return;
    setJumps((prev: any[]) => [...prev, { start: s, end: e, color: COLORS[prev.length % COLORS.length] }]);
    audioEngine.playTick(settings.soundTheme);
  };

  const getSvgPoint = (x: number, y: number) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const pt = svg.createSVGPoint();
    pt.x = x;
    pt.y = y;
    return pt.matrixTransform(svg.getScreenCTM()!.inverse());
  };

  const isPanningRef = useRef(false);

  const handlePanStart = (_: any, info: any) => {
    isPanningRef.current = true;
    const pt = getSvgPoint(info.point.x, info.point.y);
    const val = getValueFromX(pt.x, range.start, range.end, step);
    const start = parseFloat(range.start as any) || 0;
    const end = parseFloat(range.end as any) || 0;
    if (val >= start && val <= end) {
      setDragStart({ value: val, x: pt.x });
    }
  };

  const handlePan = (_: any, info: any) => {
    if (!dragStart) return;
    const pt = getSvgPoint(info.point.x, info.point.y);
    const val = getValueFromX(pt.x, range.start, range.end, step);
    const start = parseFloat(range.start as any) || 0;
    const end = parseFloat(range.end as any) || 0;
    
    if (val >= start && val <= end) {
      setPreviewJump({ start: dragStart.value, end: val });
    } else {
      setPreviewJump(null);
    }
  };

  const handleTap = (_: any, info: any) => {
    // If we were just panning, don't drop a pin
    if (isPanningRef.current) return;

    const pt = getSvgPoint(info.point.x, info.point.y);
    const val = getValueFromX(pt.x, range.start, range.end, step);
    const start = parseFloat(range.start as any) || 0;
    const end = parseFloat(range.end as any) || 0;
    
    if (val >= start && val <= end) {
      togglePin(val);
    }
  };

  const handlePanEnd = (_: any, info: any) => {
    if (dragStart) {
      const pt = getSvgPoint(info.point.x, info.point.y);
      const endVal = getValueFromX(pt.x, range.start, range.end, step);
      const start = parseFloat(range.start as any) || 0;
      const end = parseFloat(range.end as any) || 0;
      
      if (endVal >= start && endVal <= end && Math.abs(pt.x - dragStart.x) >= 10) {
        addJump(dragStart.value, endVal);
      }
    }
    
    setDragStart(null);
    setPreviewJump(null);
    // Use a small timeout to clear the panning flag so it doesn't trigger a tap
    setTimeout(() => {
      isPanningRef.current = false;
    }, 100);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 h-full w-full italic">
      <ToolPanel 
        baseWidth={isMobile ? 600 : 1200} 
        baseHeight={800}
        fluid={isMobile}
        alignTop={isMobile}
      >
        <div className="w-full h-full flex flex-col items-center justify-center relative overflow-hidden group">
          <div className="tool-grid-bg opacity-20 pointer-events-none" />
          
          <div className="flex-1 flex flex-col justify-center min-h-0 p-2 md:p-8 w-full">
            <motion.svg 
              ref={svgRef}
              viewBox={`0 0 ${WIDTH} ${HEIGHT}`} 
              onTap={handleTap}
              onPanStart={handlePanStart}
              onPan={handlePan}
              onPanEnd={handlePanEnd}
              className="w-full h-full cursor-crosshair touch-none select-none relative z-10"
              preserveAspectRatio="xMidYMid meet"
            >
              <path 
                d={`M ${PADDING - 20} ${LINE_Y} L ${PADDING} ${LINE_Y - 15} M ${PADDING - 20} ${LINE_Y} L ${PADDING} ${LINE_Y + 15}`} 
                stroke="#1e293b" strokeWidth="6" strokeLinecap="round" 
              />
              <path 
                d={`M ${WIDTH - PADDING + 20} ${LINE_Y} L ${WIDTH - PADDING} ${LINE_Y - 15} M ${WIDTH - PADDING + 20} ${LINE_Y} L ${WIDTH - PADDING} ${LINE_Y + 15}`} 
                stroke="#1e293b" strokeWidth="6" strokeLinecap="round" 
              />

              <line 
                x1={PADDING} y1={LINE_Y} x2={WIDTH - PADDING} y2={LINE_Y} 
                stroke="#1e293b" strokeWidth={isMobile ? 10 : 6} strokeLinecap="round" 
              />

              {markers.map((val) => {
                const x = getX(val, range.start, range.end);

                return (
                  <g key={val}>
                    <line 
                      x1={x} y1={LINE_Y - 25} x2={x} y2={LINE_Y + 25} 
                      stroke="#1e293b" 
                      strokeWidth="6" 
                      strokeLinecap="round"
                    />
                    {showLabels && (
                      <text 
                        x={x} y={LINE_Y + 70} 
                        textAnchor="middle" 
                        className={`font-black select-none pointer-events-none fill-slate-900 tracking-tighter italic`}
                        style={{ fontSize: '38px' }}
                      >
                        {val}
                      </text>
                    )}
                    <rect x={x - 25} y={LINE_Y - 60} width={50} height={120} fill="transparent" className="cursor-pointer" />
                  </g>
                );
              })}

              {previewJump && (
                <g>
                  {(() => {
                    const x1 = getX(previewJump.start, range.start, range.end);
                    const x2 = getX(previewJump.end, range.start, range.end);
                    const radius = Math.abs(x2 - x1) / 2;
                    const centerX = (x1 + x2) / 2;
                    const isPositive = previewJump.end > previewJump.start;
                    const pathHeight = Math.max(radius * 0.7, 40);
                    const path = `M ${x1} ${LINE_Y} A ${radius} ${pathHeight} 0 0 ${isPositive ? 1 : 0} ${x2} ${LINE_Y}`;
                    const diff = parseFloat((previewJump.end - previewJump.start).toFixed(2));
                    
                    return (
                      <>
                        <path d={path} fill="none" stroke="#6366f1" strokeWidth="6" strokeDasharray="16,12" strokeLinecap="round" className="opacity-40" />
                        <path 
                          d={isPositive ? `M ${x2 - 16} ${LINE_Y - 16} L ${x2} ${LINE_Y} L ${x2 - 16} ${LINE_Y + 16}` : `M ${x2 + 16} ${LINE_Y - 16} L ${x2} ${LINE_Y} L ${x2 + 16} ${LINE_Y + 16}`}
                          fill="none" stroke="#6366f1" strokeWidth="6" strokeLinecap="round" className="opacity-40"
                        />
                        <g>
                          <rect x={centerX - 45} y={LINE_Y - pathHeight - 65} width={90} height={50} rx="20" fill="white" stroke="#6366f1" strokeWidth="3" />
                          <text x={centerX} y={LINE_Y - pathHeight - 32} textAnchor="middle" className="font-black tabular-nums fill-indigo-600 italic" style={{ fontSize: '30px' }}>
                            {isPositive ? '+' : ''}{diff}
                          </text>
                        </g>
                      </>
                    );
                  })()}
                </g>
              )}

              <AnimatePresence>
                {jumps.map((jump: any, i) => {
                  const x1 = getX(jump.start, range.start, range.end);
                  const x2 = getX(jump.end, range.start, range.end);
                  const radius = Math.abs(x2 - x1) / 2;
                  const centerX = (x1 + x2) / 2;
                  const isPositive = jump.end > jump.start;
                  const pathHeight = Math.max(radius * 0.7, 40);
                  const path = `M ${x1} ${LINE_Y} A ${radius} ${pathHeight} 0 0 ${isPositive ? 1 : 0} ${x2} ${LINE_Y}`;

                  return (
                    <motion.g
                      key={`jump-${i}`}
                      initial={{ opacity: 0, pathLength: 0 }}
                      animate={{ opacity: 1, pathLength: 1 }}
                      exit={{ opacity: 0 }}
                      className="group/jump cursor-pointer"
                      onClick={(e) => { e.stopPropagation(); setJumps((prev: any[]) => prev.filter((_, idx) => idx !== i)); audioEngine.playTick(settings.soundTheme); }}
                    >
                      <path d={path} fill="none" stroke="transparent" strokeWidth="50" className="cursor-pointer" />
                      <path d={path} fill="none" stroke={jump.color} strokeWidth="8" strokeLinecap="round" className="opacity-60" />
                      <path 
                        d={isPositive ? `M ${x2 - 16} ${LINE_Y - 16} L ${x2} ${LINE_Y} L ${x2 - 16} ${LINE_Y + 16}` : `M ${x2 + 16} ${LINE_Y - 16} L ${x2} ${LINE_Y} L ${x2 + 16} ${LINE_Y + 16}`}
                        fill="none" stroke={jump.color} strokeWidth="8" strokeLinecap="round"
                      />
                      <g className="transition-all duration-300">
                        <rect x={centerX - 45} y={LINE_Y - pathHeight - 65} width={90} height={50} rx="20" fill="white" stroke={jump.color} strokeWidth={4} />
                        <text x={centerX} y={LINE_Y - pathHeight - 32} textAnchor="middle" className="font-black tabular-nums italic" style={{ fill: jump.color, fontSize: '30px' }}>
                           {isPositive ? '+' : ''}{parseFloat((jump.end - jump.start).toFixed(2))}
                        </text>
                      </g>
                    </motion.g>
                  );
                })}
              </AnimatePresence>

              <AnimatePresence>
                {pins.map((pin: any) => {
                  const x = getX(pin.value, range.start, range.end);
                  return (
                    <motion.g
                      key={`pin-${pin.value}`}
                      initial={{ opacity: 0, y: -40, scale: 0.8 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -40, scale: 0.8 }}
                      className="cursor-pointer group/pin"
                      onTap={(e) => { e.stopPropagation(); togglePin(pin.value); }}
                    >
                      <circle cx={x} cy={LINE_Y} r="12" fill={pin.color} stroke="white" strokeWidth="4" />
                      <line x1={x} y1={LINE_Y} x2={x} y2={LINE_Y - 120} stroke={pin.color} strokeWidth="8" strokeLinecap="round" />
                      <circle cx={x} cy={LINE_Y - 130} r="35" fill={pin.color} stroke="white" strokeWidth="4" className="" />
                      <text x={x} y={LINE_Y - 120} textAnchor="middle" className="font-black fill-white pointer-events-none tabular-nums italic" style={{ fontSize: '26px' }}>
                        {pin.value}
                      </text>
                    </motion.g>
                  );
                })}
              </AnimatePresence>
            </motion.svg>
          </div>

          <div className="absolute bottom-12 right-12 flex items-center gap-6 z-20 bg-white/80 border-2 border-slate-100 p-8 rounded-[3rem] backdrop-blur-md  pointer-events-none">
            <div className="text-right">
              <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest mt-2 leading-none">
                <FormattedMessage id="numberline.status.ready" />
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white ">
              <MousePointer2 size={24} strokeWidth={3} />
            </div>
          </div>
        </div>
      </ToolPanel>

      <SettingsPanel
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        title="Settings"
      >
          <div className="space-y-10">
            <div className="space-y-6">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] block text-center">
                <FormattedMessage id="numberline.settings.range" />
              </label>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest block text-center">
                    <FormattedMessage id="numberline.settings.start" />
                  </span>
                  <input 
                    type="number" 
                    value={range.start}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '-' || val === '') {
                        setRange((prev: any) => ({ ...prev, start: val }));
                      } else {
                        const numVal = Number(val);
                        setRange((prev: any) => ({ start: numVal, end: Math.max(numVal, parseFloat(prev.end) || 0) }));
                      }
                    }}
                    className="w-full bg-slate-50 p-6 rounded-[2rem] border-4 border-slate-100 outline-none font-black text-3xl text-slate-900 tabular-nums text-center focus:border-indigo-500/50 transition-all "
                  />
                </div>
                <div className="space-y-2">
                  <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest block text-center">
                    <FormattedMessage id="numberline.settings.end" />
                  </span>
                  <input 
                    type="number" 
                    value={range.end}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '-' || val === '') {
                        setRange((prev: any) => ({ ...prev, end: val }));
                      } else {
                        const numVal = Number(val);
                        setRange((prev: any) => ({ start: Math.min(numVal, parseFloat(prev.start) || 0), end: numVal }));
                      }
                    }}
                    className="w-full bg-slate-50 p-6 rounded-[2rem] border-4 border-slate-100 outline-none font-black text-3xl text-slate-900 tabular-nums text-center focus:border-indigo-500/50 transition-all "
                  />
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] block text-center">
                <FormattedMessage id="numberline.settings.steps" />
              </label>
              <input 
                type="number" 
                value={step}
                step="0.1"
                onChange={(e) => setStep(Math.max(0.1, parseFloat(e.target.value) || 0.1))}
                className="w-full bg-slate-50 p-6 rounded-[2rem] border-4 border-slate-100 outline-none font-black text-4xl text-slate-900 tabular-nums text-center focus:border-indigo-500/50 transition-all "
              />
            </div>
            <button
              onClick={() => { setShowLabels(!showLabels); audioEngine.playTick(settings.soundTheme); }}
              className={`w-full h-24 rounded-[2.5rem] border-4 transition-all flex items-center justify-center gap-4 font-black text-sm uppercase tracking-[0.2em]  ${showLabels ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-slate-50 border-slate-100 text-slate-400'}`}
            >
              {showLabels ? <Eye size={24} strokeWidth={3} /> : <EyeOff size={24} strokeWidth={3} />}
              <FormattedMessage id="numberline.settings.labels" />
            </button>

            <div className="h-px bg-slate-100 w-full" />

            <button
              onClick={resetAll}
              className="w-full py-8 bg-white border-4 border-slate-100 text-slate-400 rounded-[2.5rem] font-black text-sm uppercase tracking-widest hover:border-rose-100 hover:text-rose-600 transition-all flex items-center justify-center gap-4 "
            >
              <RotateCcw size={24} strokeWidth={3} />
              <FormattedMessage id="numberline.settings.reset" />
            </button>
          </div>
        </SettingsPanel>
    </div>
  );
};

export default NumberLine;
