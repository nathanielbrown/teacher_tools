import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  RotateCcw,
  Target,
  TrendingUp,
  Terminal,
  Calculator,
  X
} from 'lucide-react';
import { useHeader } from '../../contexts/HeaderContext';
import { useSettings } from '../../contexts/SettingsContext';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { audioEngine } from '../../utils/audio';
import { Parser } from 'expr-eval';
import { ToolPanel } from '../shared/ToolPanel';
import { FormattedMessage } from 'react-intl';

// 1. Constants
const SIZE = 1000;
const PADDING = 60;
const INNER_SIZE = SIZE - PADDING * 2;
const CENTER = SIZE / 2;

const PARSER = new Parser();

// 3. Text (Help and Info)
const HelpContent = () => (
  <div className="space-y-4 font-['Outfit']">
    <div className="space-y-3 italic">
      {[1, 2, 3, 4].map(step => (
        <div key={step} className="flex gap-3 text-left">
          <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center text-xs font-black text-indigo-600 shrink-0">{step}</div>
          <p className="text-sm text-slate-600 font-medium leading-tight">
            <FormattedMessage 
              id={`teachermath.help.step${step}`} 
              values={{ b: (chunks: React.ReactNode) => <b>{chunks}</b> }}
            />
          </p>
        </div>
      ))}
    </div>
  </div>
);

// 6. Functions
const prepareFormula = (f: string) => {
  return f
    .replace(/(\d)([a-z])/gi, '$1*$2') // 2x -> 2*x
    .replace(/\)\(/g, ')*(')           // (x+1)(x+2) -> (x+1)*(x+2)
    .replace(/([a-z])\(/gi, '$1*(')     // x(x+1) -> x*(x+1)
    .replace(/\)([\d])/g, ')*$1');      // (x+1)2 -> (x+1)*2
};

const getRandomColor = () => `hsl(${Math.random() * 360}, 75%, 50%)`;

// 7. Component
export const TeacherMath = () => {
  const { setHasConfig, setHelpContent, setOnReset, clearHeader } = useHeader();
  const { settings } = useSettings();
  
  const [elements, setElements] = useLocalStorage('teacher_math_elements', [
    { id: 1, raw: '(2, 3)', color: '#6366f1' },
    { id: 2, raw: '(-4, 1)', color: '#ec4899' },
    { id: 3, raw: 'x', color: '#10b981' },
    { id: 'initial-empty', raw: '', color: getRandomColor() }
  ]);

  const [gridConfig, setGridConfig] = useState({
    range: 10,
    step: 1,
    showLabels: true
  });

  const svgRef = useRef<SVGSVGElement>(null);

  const scale = INNER_SIZE / (gridConfig.range * 2);

  const toSvgX = (cartX: number) => CENTER + cartX * scale;
  const toSvgY = (cartY: number) => CENTER - cartY * scale;
  const toCartX = (svgX: number) => (svgX - CENTER) / scale;
  const toCartY = (svgY: number) => (CENTER - svgY) / scale;

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
        
        const prepared = prepareFormula(f);
        const compiled = PARSER.parse(prepared);
        compiled.evaluate({ x: 0 }); 
        return { ...el, type: 'formula', formula: f, compiled, displayFormula: `y = ${f}` };
      } catch {
        return { ...el, type: 'error', error: 'Invalid format' };
      }
    });
  }, [elements]);

  const updateElement = (id: number | string, val: string) => {
    setElements(prev => prev.map(el => el.id === id ? { ...el, raw: val } : el));
    if (id === elements[elements.length - 1].id && val.trim()) {
      setElements(prev => [...prev, { id: Date.now(), raw: '', color: getRandomColor() }]);
    }
    audioEngine.playTick(settings.soundTheme);
  };

  const removeElement = (id: number | string) => {
    if (elements.length > 1) {
      setElements(prev => prev.filter(el => el.id !== id));
      audioEngine.playTick(settings.soundTheme);
    }
  };

  const resetPlane = useCallback(() => {
    setElements([{ id: Date.now(), raw: '', color: getRandomColor() }]);
    audioEngine.playTick(settings.soundTheme);
  }, [settings.soundTheme, setElements]);

  useEffect(() => {
    setHasConfig(false);
    setOnReset(() => resetPlane);
    setHelpContent(<HelpContent />);
    return () => clearHeader();
  }, [clearHeader, setOnReset, resetPlane, setHelpContent, setHasConfig]);

  const handleSvgClick = (e: React.MouseEvent) => {
    if (!svgRef.current) return;
    const svg = svgRef.current;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    
    const svgP = pt.matrixTransform(svg.getScreenCTM()?.inverse());
    if (!svgP) return;

    const cartX = Math.round(toCartX(svgP.x) * 2) / 2;
    const cartY = Math.round(toCartY(svgP.y) * 2) / 2;

    if (Math.abs(cartX) <= gridConfig.range && Math.abs(cartY) <= gridConfig.range) {
      const newPoint = {
        id: Date.now(),
        raw: `(${cartX}, ${cartY})`,
        color: getRandomColor()
      };
      const newElements = [...elements];
      newElements.splice(newElements.length - 1, 0, newPoint);
      setElements(newElements);
      audioEngine.playTick(settings.soundTheme);
    }
  };

  const renderGrid = () => {
    const lines = [];
    const range = gridConfig.range;
    const step = gridConfig.step;

    for (let i = -range; i <= range; i += step) {
      const pos = toSvgX(i);
      const isAxis = i === 0;
      lines.push(
        <line key={`v-${i}`} x1={pos} y1={PADDING} x2={pos} y2={SIZE - PADDING} stroke={isAxis ? '#1e293b' : '#f1f5f9'} strokeWidth={isAxis ? 4 : 2} strokeOpacity={isAxis ? 1 : 0.5} />
      );
      const yPos = toSvgY(i);
      lines.push(
        <line key={`h-${i}`} x1={PADDING} y1={yPos} x2={SIZE - PADDING} y2={yPos} stroke={isAxis ? '#1e293b' : '#f1f5f9'} strokeWidth={isAxis ? 4 : 2} strokeOpacity={isAxis ? 1 : 0.5} />
      );

      if (gridConfig.showLabels && i !== 0) {
        lines.push(<text key={`xl-${i}`} x={pos} y={CENTER + 24} textAnchor="middle" className="text-[12px] font-black fill-slate-300 tabular-nums italic">{i}</text>);
        lines.push(<text key={`yl-${i}`} x={CENTER - 24} y={yPos + 5} textAnchor="end" className="text-[12px] font-black fill-slate-300 tabular-nums italic">{i}</text>);
      }
    }
    lines.push(<text key="origin" x={CENTER - 15} y={CENTER + 24} textAnchor="end" className="text-[12px] font-black fill-slate-400 italic">0</text>);
    return lines;
  };

  const renderFormulaPath = (compiled: any) => {
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
    } catch { 
      return ''; 
    }
  };

  return (
    <ToolPanel className="italic" baseWidth={1200} baseHeight={800}>
      <div className="w-full h-full flex flex-col-reverse lg:flex-row gap-4 lg:gap-8 p-4 lg:p-8">
        
        {/* Sidebar (Formulas) */}
        <div className="w-full lg:w-[320px] shrink-0 flex-1 lg:flex-none flex flex-col justify-center lg:justify-start gap-4 relative z-20">
          
          <div className="flex-1 bg-white/50 p-6 rounded-[2rem] border-4 border-white flex flex-col gap-4 min-h-0">
             <div className="flex items-center justify-between shrink-0 border-b-4 border-white pb-1 text-left">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white ">
                       <Terminal size={20} strokeWidth={3} />
                    </div>
                   <div className="flex flex-col">
                     <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight leading-none">
                       <FormattedMessage id="teachermath.title" />
                     </h4>
                   </div>
                </div>
                <button 
                  onClick={resetPlane} 
                  className="p-2 bg-white border-2 border-slate-100 rounded-xl text-slate-300 hover:text-rose-600 transition-all  active:scale-95"
                  title="Clear All"
                >
                  <RotateCcw size={14} strokeWidth={3} />
                </button>
             </div>

             <div className="flex-1 overflow-y-auto no-scrollbar pr-2 pb-4 space-y-2">
                <AnimatePresence initial={false}>
                   {elements.map((element, index) => {
                    const parsed = parsedElements[index];
                    const isInvalid = parsed.type === 'error';
                    const isPoint = parsed.type === 'point';
                    const isFormula = parsed.type === 'formula';
                    
                    return (
                      <motion.div
                        key={element.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`p-3 lg:p-4 rounded-xl border-4 transition-all flex flex-col gap-1 italic ${isInvalid ? 'border-rose-100 bg-rose-50/20' : 'bg-white border-white hover:border-indigo-100 '}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg shrink-0 flex items-center justify-center text-white font-black" style={{ backgroundColor: element.raw.trim() ? element.color : '#f1f5f9' }}>
                             {isPoint ? <Target size={18} strokeWidth={3} /> : isFormula ? <TrendingUp size={18} strokeWidth={3} /> : <Calculator size={18} strokeWidth={3} className="opacity-20 text-slate-400" />}
                          </div>
                          <div className="flex-1 min-w-0">
                             <input
                               type="text"
                               value={element.raw}
                               onChange={(e) => updateElement(element.id, e.target.value)}
                               onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                               placeholder={index === elements.length - 1 ? "Add" : "x, y or y=..."}
                               className="w-full bg-transparent border-none focus:ring-0 text-lg lg:text-xl font-black font-['Outfit'] text-slate-900 placeholder:text-slate-200 p-0 leading-none italic"
                             />
                          </div>
                          {index < elements.length - 1 && (
                            <button onClick={() => removeElement(element.id)} className="w-6 h-6 flex items-center justify-center text-slate-200 hover:text-rose-600 transition-all shrink-0">
                              <X size={14} strokeWidth={3} />
                            </button>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
             </div>
          </div>
        </div>

        {/* Primary Stage (Grid) */}
        <div className="flex-none lg:flex-1 shrink-0 bg-white/50 rounded-[2rem] border-4 border-white flex flex-col items-center justify-center relative overflow-hidden p-6 lg:p-8">
          
          <div className="w-full lg:max-w-[700px] lg:max-h-[500px] xl:max-h-[600px] aspect-square flex items-center justify-center">
             <svg 
              ref={svgRef}
              viewBox={`0 0 ${SIZE} ${SIZE}`}
              className="w-full h-full cursor-crosshair select-none"
              onClick={handleSvgClick}
            >
              <defs>
                <filter id="plot-glow" x="-20%" y="-20%" width="140%" height="140%">
                   <feGaussianBlur stdDeviation="6" result="coloredBlur"/>
                   <feMerge>
                      <feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/>
                   </feMerge>
                </filter>
              </defs>

              {renderGrid()}

              {parsedElements.map(el => {
                if (el.type === 'formula') {
                  const formulaEl = el as any;
                  const pathData = renderFormulaPath(formulaEl.compiled);
                  if (!pathData) return null;
                  return (
                    <motion.polyline
                      key={`svg-f-${el.id}`}
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ pathLength: 1, opacity: 1 }}
                      transition={{ duration: 1.5, ease: "easeInOut" }}
                      points={pathData}
                      stroke={el.color}
                      strokeWidth="10"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{ filter: 'url(#plot-glow)' }}
                    />
                  );
                }
                if (el.type === 'point') {
                  const pointEl = el as any;
                  return (
                    <motion.g
                      key={`svg-p-${el.id}`}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1, x: toSvgX(pointEl.x), y: toSvgY(pointEl.y) }}
                      transition={{ type: 'spring', damping: 12 }}
                    >
                      <circle r="14" fill={el.color} stroke="white" strokeWidth="5" style={{ filter: 'url(#plot-glow)' }} />
                      <text y="-40" textAnchor="middle" className="text-[24px] font-black fill-slate-800 uppercase tracking-tighter italic" style={{ pointerEvents: 'none' }}>
                        {pointEl.label} ({pointEl.x}, {pointEl.y})
                      </text>
                    </motion.g>
                  );
                }
                return null;
              })}
            </svg>
          </div>

          {/* Grid Settings Below */}
          <div className="mt-4 lg:mt-6 flex flex-col sm:flex-row items-center gap-6 bg-white/80 backdrop-blur-md p-4 lg:p-5 px-8 rounded-[2rem] border-4 border-white shadow-sm relative z-30">
            <div className="flex items-center gap-4 min-w-[240px]">
              <span className="text-xs lg:text-sm font-black text-slate-400 uppercase tracking-widest italic shrink-0">
                <FormattedMessage id="teachermath.settings.resolution" />
              </span>
              <input 
                type="range" 
                min="5" max="50" step="5" 
                value={gridConfig.range} 
                onChange={(e) => setGridConfig({ ...gridConfig, range: parseInt(e.target.value) })} 
                className="w-full accent-indigo-600 h-1.5 bg-slate-100 rounded-full appearance-none cursor-pointer" 
              />
              <span className="text-sm font-black text-indigo-600 italic tabular-nums w-8 text-right">±{gridConfig.range}</span>
            </div>

            <div className="w-px h-6 bg-slate-200 hidden sm:block" />

            <div className="flex items-center gap-4">
              <span className="text-xs lg:text-sm font-black text-slate-400 uppercase tracking-widest italic shrink-0">
                <FormattedMessage id="teachermath.settings.labels" />
              </span>
              <button 
                onClick={() => { setGridConfig({ ...gridConfig, showLabels: !gridConfig.showLabels }); audioEngine.playTick(settings.soundTheme); }} 
                className={`w-10 h-6 rounded-full relative transition-all border-2 ${gridConfig.showLabels ? 'bg-indigo-600 border-indigo-400/50' : 'bg-slate-200 border-slate-300/50'}`}
              >
                <motion.div 
                  animate={{ left: gridConfig.showLabels ? '18px' : '2px' }}
                  className="absolute top-0.5 w-4 h-4 bg-white rounded-full " 
                />
              </button>
            </div>
          </div>
        </div>

      </div>
    </ToolPanel>
  );
};

export default TeacherMath;
