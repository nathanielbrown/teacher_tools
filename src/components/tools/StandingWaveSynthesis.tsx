import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, 
  Info, 
  Settings2, 
  RotateCcw, 
  Play, 
  Pause, 
  Waves, 
  Zap, 
  Sliders, 
  Maximize2, 
  ChevronRight,
  ShieldCheck, 
  AlertCircle, 
  TrendingUp, 
  HelpCircle,
  MousePointer2,
  BrainCircuit,
  Volume2
} from 'lucide-react';
import { useHeader } from '../../contexts/HeaderContext';
import { useSettings } from '../../contexts/SettingsContext';
import { audioEngine } from '../../utils/audio';

// 1. Constants
const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 400;
const PADDING = 50;

// 2. Config (None)

// 3. Text (Help and Info)
const HELP_INFO = (
  <div className="space-y-4 font-['Outfit']">
    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">How to Make Waves</h3>
    <div className="space-y-3">
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-primary/5 flex items-center justify-center text-xs font-black text-primary shrink-0">1</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">Adjust the sliders to change how the waves look.</p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center text-xs font-black text-blue-600 shrink-0">2</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">Drag the <b>Blue Handle</b> on the right to stretch the wave.</p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-success-bg flex items-center justify-center text-xs font-black text-success shrink-0">3</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">Toggle the buttons to see the <b>Invisible Waves</b> that make the pattern!</p>
      </div>
    </div>
  </div>
);

// 4. Local Storage (None)

// 5. Classes (None)

// 6. Functions (None)

// 7. Component
export const StandingWaveSynthesis = () => {
  const { setHeaderActions, setHelpContent, setOnReset, clearHeader } = useHeader();
  const { settings } = useSettings();
  
  const [frequency, setFrequency] = useState(2); // Hz
  const [amplitude, setAmplitude] = useState(40); // px
  const [waveSpeed, setWaveSpeed] = useState(200); // px/s
  const [isPlaying, setIsPlaying] = useState(true);
  const [showComponents, setShowComponents] = useState(true);
  const [showTrace, setShowTrace] = useState(true);
  const [slowMotion, setSlowMotion] = useState(false);
  const [stringLength, setStringLength] = useState(1000); // px

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timeRef = useRef(0);
  const animationRef = useRef<number>(0);

  // Derived physics values
  const wavelength = waveSpeed / frequency;
  const k = (2 * Math.PI) / wavelength;
  const omega = 2 * Math.PI * frequency;

  const resetExperiment = useCallback(() => {
    setFrequency(2);
    setAmplitude(40);
    setWaveSpeed(200);
    setStringLength(1000);
    timeRef.current = 0;
    audioEngine.playTick(settings.soundTheme);
  }, [settings.soundTheme]);

  useEffect(() => {
    setOnReset(() => resetExperiment);
    setHelpContent(HELP_INFO);
    return () => clearHeader();
  }, [clearHeader, setOnReset, resetExperiment, setHelpContent]);

  // Draw loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    let lastTime = performance.now();

    const animate = (now: number) => {
      const deltaTime = (now - lastTime) / 1000;
      lastTime = now;

      if (isPlaying) {
        const timeStep = slowMotion ? deltaTime * 0.2 : deltaTime;
        timeRef.current += timeStep;
      }

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const centerY = canvas.height / 2;
      const t = timeRef.current;

      // Draw horizontal axis
      ctx.beginPath();
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      ctx.moveTo(PADDING, centerY);
      ctx.lineTo(PADDING + stringLength, centerY);
      ctx.stroke();

      // Draw Nodes / Grid
      if (showTrace) {
        ctx.setLineDash([5, 10]);
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1;
        for (let x = 0; x <= stringLength; x += wavelength / 2) {
          ctx.beginPath();
          ctx.moveTo(PADDING + x, centerY - 120);
          ctx.lineTo(PADDING + x, centerY + 120);
          ctx.stroke();
        }
        ctx.setLineDash([]);
      }

      // Calculate waves
      const resolution = 2; // px per segment
      
      const drawWave = (color: string, width: number, dash: number[] = [], calcY: (x: number) => number) => {
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.setLineDash(dash);
        
        for (let x = 0; x <= stringLength; x += resolution) {
          const y = calcY(x);
          if (x === 0) ctx.moveTo(PADDING + x, centerY + y);
          else ctx.lineTo(PADDING + x, centerY + y);
        }
        ctx.stroke();
      };

      // 1. Incident Wave (Right-moving: sin(kx - wt))
      if (showComponents) {
        drawWave('rgba(79, 70, 229, 0.2)', 2, [], (x) => amplitude * Math.sin(k * x - omega * t));
        
        // 2. Reflected Wave (Left-moving: sin(kx + wt))
        const phaseShift = -2 * k * stringLength;
        drawWave('rgba(16, 185, 129, 0.2)', 2, [], (x) => amplitude * Math.sin(k * x + omega * t + phaseShift));
      }

      // 3. Envelope (Trace)
      if (showTrace) {
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(79, 70, 229, 0.05)';
        ctx.fillStyle = 'rgba(79, 70, 229, 0.03)';
        
        const path = new Path2D();
        for (let x = 0; x <= stringLength; x += resolution) {
          const env = 2 * amplitude * Math.sin(k * (x - stringLength));
          if (x === 0) path.moveTo(PADDING + x, centerY + env);
          else path.lineTo(PADDING + x, centerY + env);
        }
        for (let x = stringLength; x >= 0; x -= resolution) {
          const env = -2 * amplitude * Math.sin(k * (x - stringLength));
          path.lineTo(PADDING + x, centerY + env);
        }
        ctx.fill(path);
      }

      // 4. Resultant Standing Wave
      drawWave('#1e293b', 4, [], (x) => {
        const y1 = amplitude * Math.sin(k * x - omega * t);
        const y2 = amplitude * Math.sin(k * x + omega * t - 2 * k * stringLength);
        return y1 + y2;
      });

      // Draw endpoints
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.arc(PADDING, centerY, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(PADDING + stringLength, centerY, 8, 0, Math.PI * 2);
      ctx.fill();

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationRef.current!);
  }, [frequency, amplitude, waveSpeed, isPlaying, showComponents, showTrace, slowMotion, stringLength, wavelength, k, omega]);

  useEffect(() => {
    setHeaderActions(
      <div className="flex items-center gap-4 italic">
        <button
          onClick={() => { setIsPlaying(!isPlaying); audioEngine.playTick(settings.soundTheme); }}
          className={`flex items-center gap-2 px-6 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95  ${isPlaying ? 'bg-amber-100 text-warning' : 'bg-emerald-600 text-white '}`}
        >
          {isPlaying ? <Pause size={14} strokeWidth={3} /> : <Play size={14} strokeWidth={3} />} {isPlaying ? 'Freeze' : 'Live'}
        </button>
      </div>
    );
  }, [isPlaying, settings.soundTheme, setHeaderActions]);

  return (
    <div className="tool-container flex flex-col lg:flex-row gap-8 h-full font-['Outfit'] select-none relative bg-surface rounded-[4rem] p-4 lg:p-12 italic  overflow-hidden">
      
      {/* Primary Simulation Stage */}
      <div className="flex-1 flex flex-col gap-8 min-h-0">
        <div className="flex-1 bg-slate-50/50 rounded-[4rem] border-4 border-white  flex flex-col items-center justify-center relative overflow-hidden group">
          <canvas 
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="max-w-full h-auto z-10 "
          />

          {/* Length Manipulator Handle */}
          <div 
            className="absolute z-20 flex flex-col items-center gap-4 group/dragger cursor-ew-resize"
            style={{ left: `calc(50% - ${CANVAS_WIDTH/2}px + ${PADDING + stringLength}px)`, top: '50%', transform: 'translate(-50%, -50%)' }}
          >
            <div className="w-1.5 h-48 bg-slate-200 rounded-full group-hover/dragger:bg-indigo-400 transition-colors " />
            <div className="w-12 h-12 bg-surface border-4 border-slate-200 rounded-[1.5rem]  group-hover/dragger:border-indigo-400 flex items-center justify-center transition-all group-hover/dragger:scale-110 group-hover/dragger:rotate-90">
              <Maximize2 size={20} strokeWidth={3} className="text-neutral-400 group-hover/dragger:text-primary" />
            </div>
            <input 
              type="range"
              min="200"
              max="1000"
              value={stringLength}
              onChange={(e) => { setStringLength(parseInt(e.target.value)); audioEngine.playTick(settings.soundTheme); }}
              className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize"
            />
          </div>
        </div>

        {/* Real-time Physics Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Speed', value: frequency, unit: 'Hz', color: 'text-primary', icon: Waves },
            { label: 'Length', value: wavelength.toFixed(1), unit: 'px', color: 'text-success', icon: Activity },
            { label: 'Velocity', value: waveSpeed, unit: 'px/s', color: 'text-caution', icon: Zap },
            { label: 'Harmonic', value: (2 * stringLength / wavelength).toFixed(1), unit: 'n', color: 'text-slate-900', icon: Sliders },
          ].map((stat, i) => (
            <div key={i} className="bg-surface p-6 rounded-[2.5rem] border-4 border-slate-50  flex items-center gap-5 italic group hover:border-primary/20 transition-all">
              <div className={`w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center group-hover:scale-110 transition-transform ${stat.color}`}>
                 <stat.icon size={24} strokeWidth={3} />
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] font-black text-neutral-400 uppercase tracking-widest">{stat.label}</span>
                <div className={`text-xl font-black ${stat.color} tabular-nums`}>
                  {stat.value}<span className="text-[10px] ml-1 opacity-40 font-black">{stat.unit}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Synthesis Control Sidebar */}
      <div className="w-full lg:w-[450px] shrink-0 flex flex-col gap-8 relative z-20 italic">
        
        {/* Component Display Toggles */}
        <div className="bg-dark-bg p-8 rounded-[4rem] border-4 border-dark-border  flex flex-col gap-4 relative overflow-hidden shrink-0">
           <div className="grid grid-cols-3 gap-3 relative z-10">
              {[
                { id: 'components', icon: Waves, active: showComponents, set: setShowComponents, label: 'Waves' },
                { id: 'trace', icon: Activity, active: showTrace, set: setShowTrace, label: 'Envelope' },
                { id: 'slowmo', icon: Zap, active: slowMotion, set: setSlowMotion, label: 'Slow Mo' },
              ].map((toggle) => (
                <button
                  key={toggle.id}
                  onClick={() => { toggle.set(!toggle.active); audioEngine.playTick(settings.soundTheme); }}
                  className={`flex flex-col items-center gap-3 p-6 rounded-[2.5rem] border-4 transition-all ${
                    toggle.active ? 'bg-primary border-indigo-400 text-white ' : 'bg-surface/5 border-white/5 text-slate-500 hover:text-white hover:bg-surface/10'
                  }`}
                >
                  <toggle.icon size={24} strokeWidth={3} />
                  <span className="text-[9px] font-black uppercase tracking-widest leading-none">{toggle.label}</span>
                </button>
              ))}
           </div>
        </div>

        {/* Dynamic Parameter Matrix */}
        <div className="flex-1 bg-slate-50/50 p-10 rounded-[4rem] border-4 border-white  flex flex-col gap-8 min-h-0">
           <div className="flex-1 flex flex-col gap-10 overflow-y-auto no-scrollbar pr-2 pb-4">
              {/* Frequency Control */}
              <div className="space-y-4">
                <div className="flex justify-between items-center px-2">
                   <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Wave Frequency</span>
                   <span className="text-2xl font-black text-primary italic tabular-nums">{frequency} Hz</span>
                </div>
                <div className="h-6 bg-surface rounded-full p-1 border-2 border-white relative group ">
                   <input 
                     type="range" min="0.5" max="5" step="0.1"
                     value={frequency}
                     onChange={(e) => { setFrequency(parseFloat(e.target.value)); audioEngine.playTick(settings.soundTheme); }}
                     className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                   />
                   <motion.div 
                      className="h-full bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full"
                      initial={false}
                      animate={{ width: `${((frequency - 0.5) / 4.5) * 100}%` }}
                   />
                </div>
              </div>

              {/* Amplitude Control */}
              <div className="space-y-4">
                <div className="flex justify-between items-center px-2">
                   <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Wave Height</span>
                   <span className="text-2xl font-black text-success italic tabular-nums">{amplitude} px</span>
                </div>
                <div className="h-6 bg-surface rounded-full p-1 border-2 border-white relative group ">
                   <input 
                     type="range" min="10" max="80"
                     value={amplitude}
                     onChange={(e) => { setAmplitude(parseInt(e.target.value)); audioEngine.playTick(settings.soundTheme); }}
                     className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                   />
                   <motion.div 
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
                      initial={false}
                      animate={{ width: `${((amplitude - 10) / 70) * 100}%` }}
                   />
                </div>
              </div>

              {/* Wave Speed Control */}
              <div className="space-y-4">
                <div className="flex justify-between items-center px-2">
                   <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Wave Velocity</span>
                   <span className="text-2xl font-black text-caution italic tabular-nums">{waveSpeed} px/s</span>
                </div>
                <div className="h-6 bg-surface rounded-full p-1 border-2 border-white relative group ">
                   <input 
                     type="range" min="50" max="500"
                     value={waveSpeed}
                     onChange={(e) => { setWaveSpeed(parseInt(e.target.value)); audioEngine.playTick(settings.soundTheme); }}
                     className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                   />
                   <motion.div 
                      className="h-full bg-gradient-to-r from-rose-500 to-pink-500 rounded-full"
                      initial={false}
                      animate={{ width: `${((waveSpeed - 50) / 450) * 100}%` }}
                   />
                </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default StandingWaveSynthesis;
