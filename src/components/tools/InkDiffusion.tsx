import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { 
  Droplets, 
  Thermometer, 
  RotateCcw, 
  Play, 
  Pause, 
  Info, 
  Waves, 
  Palette, 
  X,
  Activity,
  MousePointer2,
  Trash2,
  Beaker as BeakerIcon,
  Sliders
} from 'lucide-react';
import { useHeader } from '../../contexts/HeaderContext';
import { useSettings } from '../../contexts/SettingsContext';
import { audioEngine } from '../../utils/audio';
import ToolPanel from '../shared/ToolPanel';
import SettingsPanel from '../shared/SettingsPanel';
import { FormattedMessage } from 'react-intl';

// 1. Constants
const BEAKER_WIDTH = 300;
const BEAKER_HEIGHT = 400;
const INK_COLORS = [
  { id: 'blue', name: 'Royal Blue', color: '#3b82f6' },
  { id: 'red', name: 'Ruby Red', color: '#ef4444' },
  { id: 'purple', name: 'Deep Purple', color: '#a855f7' },
  { id: 'green', name: 'Emerald Green', color: '#10b981' },
];

// 2. Config (None)

// 3. Text (Help and Info)
const HELP_INFO = (
  <div className="space-y-4 font-['Outfit']">
    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">How to Use the Ink Lab</h3>
    <div className="space-y-3">
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center text-xs font-black text-indigo-600 shrink-0">1</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">Adjust the <b>Temperature</b> sliders at the bottom to change the water speed.</p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center text-xs font-black text-blue-600 shrink-0">2</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">Click or tap inside the <b>beakers</b> to add a drop of ink.</p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-emerald-50 flex items-center justify-center text-xs font-black text-emerald-600 shrink-0">3</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">Notice how the ink spreads faster in <b>hot water</b>!</p>
      </div>
    </div>
  </div>
);

// 4. Local Storage (None)

// 5. Classes (None)

// 6. Functions (Sub-components & Particle Logic)
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  color: string;
}

const Beaker = React.forwardRef(({ temperature, isPlaying, label }: { temperature: number, isPlaying: boolean, label: string }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles = useRef<Particle[]>([]);
  const animationRef = useRef<number>(0);

  React.useImperativeHandle(ref, () => ({
    addDrop: (x: number, y: number, color: string) => {
      const newParticles: Particle[] = [];
      for (let i = 0; i < 150; i++) {
        newParticles.push({
          x: x + (Math.random() - 0.5) * 10,
          y: y + (Math.random() - 0.5) * 10,
          vx: (Math.random() - 0.5) * 0.2,
          vy: Math.random() * 0.4 + 0.2,
          size: Math.random() * 3 + 1,
          opacity: Math.random() * 0.5 + 0.3,
          color: color
        });
      }
      particles.current = [...particles.current, ...newParticles].slice(-2500);
    },
    reset: () => {
      particles.current = [];
    }
  }));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const update = () => {
      if (isPlaying && particles.current.length > 0) {
        const tempFactor = (temperature + 20) / 100; 
        const diffusionRate = 1.2 * tempFactor;
        const randomForce = 0.8 * tempFactor;

        particles.current.forEach(p => {
          p.vx += (Math.random() - 0.5) * randomForce;
          p.vy += (Math.random() - 0.5) * randomForce;
          p.vy += 0.01;
          p.vx *= 0.97;
          p.vy *= 0.97;
          p.x += p.vx * diffusionRate;
          p.y += p.vy * diffusionRate;

          const margin = 10;
          if (p.x < margin) { p.x = margin; p.vx *= -0.5; }
          if (p.x > BEAKER_WIDTH - margin) { p.x = BEAKER_WIDTH - margin; p.vx *= -0.5; }
          if (p.y < 80) { p.y = 80; p.vy *= -0.5; }
          if (p.y > BEAKER_HEIGHT - margin) { p.y = BEAKER_HEIGHT - margin; p.vy *= -0.5; }
        });
      }
      draw();
      animationRef.current = requestAnimationFrame(update);
    };

    const draw = () => {
      if (!ctx) return;
      ctx.clearRect(0, 0, BEAKER_WIDTH, BEAKER_HEIGHT);
      
      // Water tint
      const tintOpacity = Math.min(0.05, temperature / 1000);
      ctx.fillStyle = temperature > 40 ? `rgba(239, 68, 68, ${tintOpacity})` : `rgba(59, 130, 246, ${Math.min(0.05, (40 - temperature) / 1000)})`;
      ctx.fillRect(0, 80, BEAKER_WIDTH, BEAKER_HEIGHT - 80);

      particles.current.forEach(p => {
        ctx.beginPath();
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.opacity;
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1.0;
    };

    animationRef.current = requestAnimationFrame(update);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    }
  }, [temperature, isPlaying]);

  return (
    <div className="relative flex flex-col items-center">
      {/* Label */}
      <h4 className="mb-6 text-2xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">{label}</h4>
      
      {/* Beaker Container */}
      <div className="relative w-[300px] h-[400px] bg-white/20 backdrop-blur-xl rounded-b-[5rem] border-x-8 border-b-8 border-white  overflow-hidden group beaker-container">
        <div className="absolute top-0 left-0 right-0 h-12 bg-white/40 border-b-4 border-white/20 z-20" />
        <canvas 
          ref={canvasRef} 
          width={BEAKER_WIDTH} 
          height={BEAKER_HEIGHT} 
          className="relative z-10"
        />
        {/* Measurement Lines */}
        <div className="absolute left-8 top-24 bottom-12 w-10 flex flex-col justify-between items-start opacity-10 pointer-events-none">
           {[400, 300, 200, 100].map(m => (
             <div key={m} className="flex items-center gap-3">
                <div className="w-8 h-1 bg-slate-900 rounded-full" />
                <span className="text-[10px] font-black">{m}</span>
             </div>
           ))}
        </div>
        {/* Glass FX Overlay */}
        <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-white/5 pointer-events-none z-30" />
      </div>
    </div>
  );
});

// 7. Component
export const InkDiffusion = () => {
  const { setHeaderActions, setOnReset, clearHeader, setHelpContent, isConfigOpen, setIsConfigOpen, setHasConfig, setOnConfigToggle } = useHeader();
  const { settings } = useSettings();
  
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 1024 : false);
  const [tempA, setTempA] = useState(10);
  const [tempB, setTempB] = useState(90);
  const [selectedInk, setSelectedInk] = useState(INK_COLORS[0]);
  const [isPlaying, setIsPlaying] = useState(true);
  const beakerARef = useRef<any>(null);
  const beakerBRef = useRef<any>(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleBeakerClick = (e: React.MouseEvent) => {
    const beakers = document.querySelectorAll('.beaker-container');
    beakers.forEach((beaker) => {
      const bRect = beaker.getBoundingClientRect();
      if (e.clientX >= bRect.left && e.clientX <= bRect.right && e.clientY >= bRect.top && e.clientY <= bRect.bottom) {
        // Account for scaling by mapping screen coordinates to internal 300x400 coordinates
        const relX = (e.clientX - bRect.left) * (BEAKER_WIDTH / bRect.width);
        const relY = Math.max(90, (e.clientY - bRect.top) * (BEAKER_HEIGHT / bRect.height));
        
        if (relY < BEAKER_HEIGHT) {
          beakerARef.current?.addDrop(relX, relY, selectedInk.color);
          beakerBRef.current?.addDrop(relX, relY, selectedInk.color);
          audioEngine.playTick(settings.soundTheme);
        }
      }
    });
  };

  const resetLab = useCallback(() => {
    beakerARef.current?.reset();
    beakerBRef.current?.reset();
    setIsPlaying(true);
    audioEngine.playTick(settings.soundTheme);
  }, [settings.soundTheme]);

  useEffect(() => {
    setOnReset(() => resetLab);
    setHelpContent(HELP_INFO);
    setHasConfig(true);
    setOnConfigToggle(() => () => setIsConfigOpen(prev => !prev));
    return () => {
      clearHeader();
    };
  }, [clearHeader, setOnReset, resetLab, setHelpContent, setHasConfig, setOnConfigToggle, setIsConfigOpen]);

  useEffect(() => {
    setHeaderActions(
      <div className="flex items-center gap-4 italic">
        <button
          onClick={() => { setIsPlaying(!isPlaying); audioEngine.playTick(settings.soundTheme); }}
          className={`flex items-center gap-2 px-6 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all  ${isPlaying ? 'bg-amber-100 text-amber-600' : 'bg-emerald-600 text-white '}`}
        >
          {isPlaying ? <Pause size={14} strokeWidth={3} /> : <Play size={14} strokeWidth={3} />} {isPlaying ? 'Freeze' : 'Live'}
        </button>
      </div>
    );
  }, [isPlaying, setHeaderActions, settings.soundTheme]);

  return (
    <div className={`flex flex-col lg:flex-row gap-4 lg:gap-8 h-full w-full italic ${isMobile ? 'overflow-y-auto' : 'overflow-hidden'}`}>
      <ToolPanel 
        className="flex-1" 
        baseWidth={isMobile ? 400 : 1200} 
        baseHeight={isMobile ? 800 : 800}
        fluid={isMobile}
        alignTop={isMobile}
      >
        <div className="flex flex-col gap-6 lg:gap-12 h-full font-['Outfit'] select-none relative italic overflow-hidden p-2 lg:p-0">
        
        {/* Observation Deck */}
        <div 
          className="flex-1 relative overflow-hidden bg-slate-50/50 border-4 border-white rounded-[3rem] lg:rounded-[4.5rem] flex items-center justify-center cursor-crosshair group " 
          onClick={handleBeakerClick}
        >
          <div className={`flex flex-col lg:flex-row items-center justify-center gap-4 lg:gap-48 relative z-10 p-4 lg:p-12 w-full h-full ${isMobile ? 'scale-[0.65] sm:scale-[0.8]' : ''}`}>
              <Beaker 
                ref={beakerARef}
                temperature={tempA} 
                isPlaying={isPlaying} 
                label="Cold"
              />
              <Beaker 
                ref={beakerBRef}
                temperature={tempB} 
                isPlaying={isPlaying} 
                label="Hot"
              />
          </div>

          <div className="absolute bottom-6 lg:bottom-12 right-6 lg:right-12 flex items-center gap-4 z-20 pointer-events-none opacity-20 italic">
             <p className="text-[8px] lg:text-[10px] font-black uppercase tracking-[0.4em]">Tap beakers to add ink</p>
             <MousePointer2 size={isMobile ? 16 : 24} />
          </div>
        </div>
        </div>
      </ToolPanel>

      <SettingsPanel
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        title="Lab Controls"
      >
        <div className="space-y-10">
          <div className="space-y-6">
            <div className="flex items-center gap-3 border-b-4 border-slate-50 pb-4">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                <Thermometer size={20} strokeWidth={3} />
              </div>
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] leading-none">Temperature</h4>
            </div>
            
            <div className="space-y-8">
              <div className="space-y-4 p-6 bg-slate-50 rounded-[2.5rem] border-4 border-white shadow-sm">
                <div className="flex justify-between items-center px-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Cold Beaker</span>
                  <span className="text-3xl font-black text-indigo-600 tabular-nums italic leading-none">{tempA}°C</span>
                </div>
                <input 
                  type="range" min="0" max="50" value={tempA}
                  onChange={(e) => setTempA(parseInt(e.target.value))}
                  className="w-full h-4 bg-white rounded-full appearance-none cursor-pointer accent-indigo-600 border-2 border-slate-100"
                />
              </div>

              <div className="space-y-4 p-6 bg-slate-50 rounded-[2.5rem] border-4 border-white shadow-sm">
                <div className="flex justify-between items-center px-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Hot Beaker</span>
                  <span className="text-3xl font-black text-rose-600 tabular-nums italic leading-none">{tempB}°C</span>
                </div>
                <input 
                  type="range" min="51" max="100" value={tempB}
                  onChange={(e) => setTempB(parseInt(e.target.value))}
                  className="w-full h-4 bg-white rounded-full appearance-none cursor-pointer accent-rose-600 border-2 border-slate-100"
                />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-3 border-b-4 border-slate-50 pb-4">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                <Palette size={20} strokeWidth={3} />
              </div>
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] leading-none">Ink Color</h4>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {INK_COLORS.map(ink => (
                <button
                  key={ink.id}
                  onClick={() => { setSelectedInk(ink); audioEngine.playTick(settings.soundTheme); }}
                  className={`p-6 rounded-[2.5rem] border-4 transition-all flex flex-col items-center gap-4 ${
                    selectedInk.id === ink.id ? 'border-indigo-500 bg-white shadow-lg scale-[1.02]' : 'border-slate-50 bg-slate-50/50 hover:border-indigo-100'
                  }`}
                >
                  <div className="w-10 h-10 rounded-full border-4 border-white shadow-md" style={{ backgroundColor: ink.color }} />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-900 text-center leading-tight">{ink.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="h-px bg-slate-50 w-full" />

          <button
            onClick={() => { resetLab(); }}
            className="w-full py-8 bg-white border-4 border-slate-50 text-slate-400 rounded-[2.5rem] font-black text-xs uppercase tracking-[0.2em] hover:border-rose-100 hover:text-rose-600 transition-all flex items-center justify-center gap-4"
          >
            <RotateCcw size={20} strokeWidth={3} />
            Reset Lab
          </button>
        </div>
      </SettingsPanel>
    </div>
  );
};

export default InkDiffusion;
