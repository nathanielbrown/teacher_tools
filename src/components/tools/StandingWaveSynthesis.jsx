import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, Info, Settings2, RotateCcw, Play, Pause, 
  Waves, Zap, Sliders, Maximize2, ChevronRight,
  ShieldCheck, AlertCircle, TrendingUp, HelpCircle
} from 'lucide-react';

// Constants
const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 400;
const PADDING = 50;

export const StandingWaveSynthesis = () => {
  const [frequency, setFrequency] = useState(2); // Hz
  const [amplitude, setAmplitude] = useState(40); // px
  const [waveSpeed, setWaveSpeed] = useState(200); // px/s
  const [isPlaying, setIsPlaying] = useState(true);
  const [showComponents, setShowComponents] = useState(true);
  const [showTrace, setShowTrace] = useState(true);
  const [slowMotion, setSlowMotion] = useState(false);
  const [stringLength, setStringLength] = useState(1000); // px

  const canvasRef = useRef(null);
  const timeRef = useRef(0);
  const animationRef = useRef(null);

  // Derived physics values
  const wavelength = waveSpeed / frequency;
  const k = (2 * Math.PI) / wavelength;
  const omega = 2 * Math.PI * frequency;

  // Draw loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    let lastTime = performance.now();

    const animate = (now) => {
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
        ctx.setLineDash([5, 5]);
        ctx.strokeStyle = '#cbd5e1';
        for (let x = 0; x <= stringLength; x += wavelength / 2) {
          ctx.beginPath();
          ctx.moveTo(PADDING + x, centerY - 100);
          ctx.lineTo(PADDING + x, centerY + 100);
          ctx.stroke();
        }
        ctx.setLineDash([]);
      }

      // Calculate waves
      const resolution = 2; // px per segment
      
      const drawWave = (color, width, dash = [], calcY) => {
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
        drawWave('#3b82f644', 2, [], (x) => amplitude * Math.sin(k * x - omega * t));
        
        // 2. Reflected Wave (Left-moving: sin(kx + wt))
        // Note: Reflected at fixed boundary x=stringLength means phase shift
        // Phase shift is chosen to satisfy boundary condition y(L)=0
        const phaseShift = -2 * k * stringLength;
        drawWave('#10b98144', 2, [], (x) => amplitude * Math.sin(k * x + omega * t + phaseShift));
      }

      // 3. Envelope (Trace)
      if (showTrace) {
        // The envelope is 2A * |sin(k(x-L))|
        ctx.beginPath();
        ctx.strokeStyle = '#3b82f611';
        ctx.fillStyle = '#3b82f608';
        
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
      // y = A sin(kx - wt) + A sin(kx + wt + phi)
      // For fixed end at L: y = 2A sin(k(x-L)) cos(wt + phi')
      drawWave('#1e293b', 4, [], (x) => {
        const y1 = amplitude * Math.sin(k * x - omega * t);
        const y2 = amplitude * Math.sin(k * x + omega * t - 2 * k * stringLength);
        return y1 + y2;
      });

      // Draw endpoints
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.arc(PADDING, centerY, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(PADDING + stringLength, centerY, 6, 0, Math.PI * 2);
      ctx.fill();

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationRef.current);
  }, [frequency, amplitude, waveSpeed, isPlaying, showComponents, showTrace, slowMotion, stringLength, wavelength, k, omega]);

  const resetExperiment = () => {
    setFrequency(2);
    setAmplitude(40);
    setWaveSpeed(200);
    setStringLength(1000);
    timeRef.current = 0;
  };

  return (
    <div className="max-w-[1400px] mx-auto min-h-0 h-full flex flex-col gap-4 px-6 py-6 select-none overflow-y-auto lg:overflow-hidden">
      {/* Header */}
      <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-6 shrink-0">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-blue-50 rounded-2xl text-blue-600">
            <Activity size={40} />
          </div>
          <div>
            <h2 className="text-4xl font-black text-slate-800 tracking-tight">Standing Wave Synthesis</h2>
            <p className="text-slate-400 font-medium italic">Formation of standing waves by superposition.</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`p-4 rounded-2xl transition-all shadow-lg active:scale-95 ${
              isPlaying ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'
            }`}
          >
            {isPlaying ? <Pause size={24} /> : <Play size={24} />}
          </button>
          <button
            onClick={resetExperiment}
            className="p-4 bg-slate-50 text-slate-400 rounded-2xl hover:bg-red-50 hover:text-red-600 transition-all active:scale-95"
          >
            <RotateCcw size={24} />
          </button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 min-h-0">
        {/* Main Simulation View */}
        <div className="lg:col-span-8 flex flex-col gap-6 min-h-0">
          <div className="flex-1 bg-white rounded-[3rem] shadow-2xl border-8 border-white overflow-hidden relative shadow-blue-900/5 group flex items-center justify-center">
            {/* Background Grid */}
            <div className="absolute inset-0 bg-[#f8fafc] opacity-50" style={{ backgroundImage: 'radial-gradient(#e2e8f0 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
            
            <canvas 
              ref={canvasRef}
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              className="max-w-full h-auto z-10"
            />

            {/* Length Dragger */}
            <div 
              className="absolute z-20 flex flex-col items-center gap-2 group/dragger cursor-ew-resize"
              style={{ left: `calc(50% - ${CANVAS_WIDTH/2}px + ${PADDING + stringLength}px)`, top: '50%', transform: 'translate(-50%, -50%)' }}
            >
              <div className="w-1 h-32 bg-slate-300 rounded-full group-hover/dragger:bg-blue-400 transition-colors" />
              <div className="w-8 h-8 bg-white border-4 border-slate-300 rounded-full shadow-lg group-hover/dragger:border-blue-400 flex items-center justify-center transition-all group-hover/dragger:scale-110">
                <Maximize2 size={12} className="text-slate-400 group-hover/dragger:text-blue-500" />
              </div>
              <input 
                type="range"
                min="200"
                max="1000"
                value={stringLength}
                onChange={(e) => setStringLength(parseInt(e.target.value))}
                className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize"
              />
            </div>
          </div>

          {/* Measurements Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Frequency', value: frequency, unit: 'Hz', color: 'text-blue-600' },
              { label: 'Wavelength', value: wavelength.toFixed(1), unit: 'px', color: 'text-emerald-600' },
              { label: 'Wave Speed', value: waveSpeed, unit: 'px/s', color: 'text-amber-600' },
              { label: 'Harmonic', value: (2 * stringLength / wavelength).toFixed(2), unit: 'n', color: 'text-purple-600' },
            ].map((stat, i) => (
              <div key={i} className="bg-white/80 backdrop-blur-md p-4 rounded-3xl border border-white shadow-sm flex flex-col items-center">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</span>
                <div className={`text-2xl font-black ${stat.color}`}>
                  {stat.value}<span className="text-xs ml-1 opacity-60 font-medium">{stat.unit}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Controls Sidebar */}
        <div className="lg:col-span-4 flex flex-col gap-6 overflow-y-auto pr-2">
          {/* Wave Parameters */}
          <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-gray-100">
            <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-3">
              <Sliders className="text-blue-600" />
              Wave Parameters
            </h3>
            
            <div className="space-y-8">
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Frequency</label>
                  <span className="text-sm font-black text-blue-600">{frequency} Hz</span>
                </div>
                <input 
                  type="range" min="0.5" max="5" step="0.1"
                  value={frequency}
                  onChange={(e) => setFrequency(parseFloat(e.target.value))}
                  className="w-full accent-blue-600"
                />
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Amplitude</label>
                  <span className="text-sm font-black text-blue-600">{amplitude} px</span>
                </div>
                <input 
                  type="range" min="10" max="80"
                  value={amplitude}
                  onChange={(e) => setAmplitude(parseInt(e.target.value))}
                  className="w-full accent-blue-600"
                />
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Wave Speed</label>
                  <span className="text-sm font-black text-blue-600">{waveSpeed} px/s</span>
                </div>
                <input 
                  type="range" min="50" max="500"
                  value={waveSpeed}
                  onChange={(e) => setWaveSpeed(parseInt(e.target.value))}
                  className="w-full accent-blue-600"
                />
              </div>
            </div>
          </div>

          {/* Visualization Toggles */}
          <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-gray-100">
            <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-3">
              <Maximize2 className="text-blue-600" />
              Visualization
            </h3>
            
            <div className="grid grid-cols-1 gap-3">
              {[
                { id: 'components', label: 'Show Component Waves', active: showComponents, set: setShowComponents, icon: Waves },
                { id: 'trace', label: 'Show Wave Envelope', active: showTrace, set: setShowTrace, icon: Activity },
                { id: 'slowmo', label: 'Slow Motion', active: slowMotion, set: setSlowMotion, icon: Zap },
              ].map((toggle) => (
                <button
                  key={toggle.id}
                  onClick={() => toggle.set(!toggle.active)}
                  className={`p-4 rounded-2xl border-2 transition-all flex items-center gap-4 ${
                    toggle.active ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-slate-50 bg-slate-50/50 text-slate-400 hover:border-slate-200'
                  }`}
                >
                  <toggle.icon size={20} />
                  <span className="text-sm font-bold">{toggle.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Education Panel */}
          <div className="bg-slate-900 rounded-[2.5rem] p-8 shadow-xl border border-slate-800 flex-1 flex flex-col gap-6 overflow-hidden relative group">
            <div className="absolute top-0 right-0 -translate-y-4 translate-x-4 opacity-10 group-hover:scale-110 transition-transform">
              <Waves size={200} className="text-white" />
            </div>
            <h3 className="text-white text-xl font-black tracking-tight z-10 flex items-center gap-2">
              <Info className="text-blue-400" />
              Physics Insight
            </h3>
            <p className="text-slate-400 text-sm font-medium leading-relaxed z-10">
              A standing wave is formed when two traveling waves of the same frequency and amplitude overlap while moving in opposite directions.
            </p>
            
            <div className="space-y-4 z-10">
              <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/5">
                <h4 className="text-white font-black text-xs uppercase tracking-widest mb-2 flex items-center gap-2">
                  <TrendingUp size={14} className="text-blue-400" />
                  Observation Task
                </h4>
                <p className="text-[11px] text-slate-400 font-bold leading-tight">
                  Adjust the string length or frequency until you see points that don't move at all (Nodes) and points with maximum motion (Antinodes).
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
