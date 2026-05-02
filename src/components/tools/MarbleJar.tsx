import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Plus, 
  Minus, 
  RotateCcw, 
  Sparkles, 
  Trophy, 
  Settings, 
  X, 
  Target,
  Volume2,
  MousePointer2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import Matter from 'matter-js';
import { useSettings } from '../../contexts/SettingsContext';
import { audioEngine } from '../../utils/audio';
import { useHeader } from '../../contexts/HeaderContext';
import { storage } from '../../utils/storage';
import { ToolPanel } from '../shared/ToolPanel';
import { SettingsPanel } from '../shared/SettingsPanel';
import { FormattedMessage } from 'react-intl';

// 1. Constants
const MARBLE_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#ef4444', '#06b6d4'];
const MARBLE_RADIUS = 20;

const JAR_STYLES = [
  { id: 'small-classic', nameId: 'marblejar.settings.style.small-classic', width: 220, height: 280 },
  { id: 'large-classic', nameId: 'marblejar.settings.style.large-classic', width: 280, height: 380 },
  { id: 'large-tall', nameId: 'marblejar.settings.style.large-tall', width: 240, height: 450 },
];

// 3. Text (Help and Info)
const getHelpInfo = () => (
  <div className="space-y-4 font-['Outfit']">
    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight italic">
      <FormattedMessage id="marblejar.help.title" defaultMessage="How to Use the Marble Jar" />
    </h3>
    <div className="space-y-3 italic">
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center text-xs font-black text-indigo-600 shrink-0">1</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">
          <FormattedMessage 
            id="marblejar.help.step1" 
            defaultMessage="Click anywhere inside the jar to <b>drop a marble</b>."
            values={{ b: (chunks: React.ReactNode) => <b>{chunks}</b> }}
          />
        </p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center text-xs font-black text-blue-600 shrink-0">2</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">
          <FormattedMessage 
            id="marblejar.help.step2" 
            defaultMessage="Click on a <b>single marble</b> to remove it if you made a mistake."
            values={{ b: (chunks: React.ReactNode) => <b>{chunks}</b> }}
          />
        </p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-green-50 flex items-center justify-center text-xs font-black text-green-600 shrink-0">3</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">
          <FormattedMessage 
            id="marblejar.help.step3" 
            defaultMessage="Set a <b>goal</b> in the settings. When the jar is full, you get a reward!"
            values={{ b: (chunks: React.ReactNode) => <b>{chunks}</b> }}
          />
        </p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-purple-50 flex items-center justify-center text-xs font-black text-purple-600 shrink-0">4</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">
          <FormattedMessage 
            id="marblejar.help.step4" 
            defaultMessage="You can change the <b>jar style</b> in the settings panel."
            values={{ b: (chunks: React.ReactNode) => <b>{chunks}</b> }}
          />
        </p>
      </div>
    </div>
  </div>
);

export const MarbleJar = () => {
  const { settings } = useSettings();
  const { 
    setHasConfig, setHelpContent, setOnReset, 
    clearHeader, isConfigOpen, setIsConfigOpen, setOnConfigToggle 
  } = useHeader();
  
  const [marbleCount, setMarbleCount] = useState(() => {
    const saved = storage.getItem('teacherToolsMarbleJarCount');
    return saved ? JSON.parse(saved) : 0;
  });

  const [target, setTarget] = useState(() => {
    const saved = storage.getItem('teacherToolsMarbleJarTarget');
    return saved ? JSON.parse(saved) : 10;
  });
  
  const [jarStyleId, setJarStyleId] = useState(() => {
    const saved = storage.getItem('teacherToolsMarbleJarStyle');
    return saved ? JSON.parse(saved) : 'large-classic';
  });

  const currentJarStyle = JAR_STYLES.find(s => s.id === jarStyleId) || JAR_STYLES[1];
  const { width: JAR_WIDTH, height: JAR_HEIGHT } = currentJarStyle;

  const [isRewarding, setIsRewarding] = useState(false);
  const [hoverX, setHoverX] = useState<number | null>(null);
  
  const engineRef = useRef<Matter.Engine | null>(null);
  const runnerRef = useRef<Matter.Runner | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const jarContainerRef = useRef<HTMLDivElement | null>(null);
  const marbleBodiesRef = useRef<Matter.Body[]>([]);

  const triggerReward = useCallback(() => {
    setIsRewarding(true);
    audioEngine.playAlarm(settings.soundTheme);

    const end = Date.now() + 4 * 1000;
    (function frame() {
      confetti({ particleCount: 10, angle: 60, spread: 55, origin: { x: 0, y: 0.8 }, colors: MARBLE_COLORS });
      confetti({ particleCount: 10, angle: 120, spread: 55, origin: { x: 1, y: 0.8 }, colors: MARBLE_COLORS });
      if (Date.now() < end) requestAnimationFrame(frame);
    }());
  }, [settings.soundTheme]);

  const addMarble = useCallback((xPos = JAR_WIDTH / 2) => {
    if (isRewarding) return;
    audioEngine.playTick(settings.soundTheme);
    
    const engine = engineRef.current;
    if (engine) {
       const color = MARBLE_COLORS[marbleCount % MARBLE_COLORS.length];
       const newMarble = Matter.Bodies.circle(
         xPos + (Math.random() * 10 - 5), 
         -50, 
         MARBLE_RADIUS, 
         { 
           restitution: 0.7,
           friction: 0.02,
           density: 0.05,
           render: { fillStyle: color } as any
         }
       );
       Matter.World.add(engine.world, newMarble);
       marbleBodiesRef.current.push(newMarble);
    }
    
    setMarbleCount(prev => prev + 1);
  }, [isRewarding, marbleCount, settings.soundTheme, JAR_WIDTH]);

  const removeMarbleAtPoint = useCallback((x: number, y: number) => {
    if (isRewarding) return;
    const engine = engineRef.current;
    if (!engine) return;
    
    const bodies = marbleBodiesRef.current;
    const clickedBodies = Matter.Query.point(bodies, { x, y });
    
    if (clickedBodies.length > 0 && marbleCount > 0) {
      const clickedBody = clickedBodies[0];
      Matter.World.remove(engine.world, clickedBody);
      marbleBodiesRef.current = marbleBodiesRef.current.filter(b => b !== clickedBody);
      setMarbleCount(prev => prev - 1);
      audioEngine.playTick(settings.soundTheme);
    } else {
      addMarble(x);
    }
  }, [isRewarding, marbleCount, addMarble, settings.soundTheme]);

  const resetJar = useCallback(() => {
    setMarbleCount(0);
    setIsRewarding(false);
    setIsConfigOpen(false);
    audioEngine.playTick(settings.soundTheme);
    
    const engine = engineRef.current;
    if (engine) {
      Matter.World.clear(engine.world, false);
      marbleBodiesRef.current = [];
      // Re-add walls
      const wallOptions = { isStatic: true, friction: 0.1, restitution: 0.5 };
      const cornerRadius = 80;
      const wallThickness = 40;
      const ground = Matter.Bodies.rectangle(JAR_WIDTH / 2, JAR_HEIGHT + wallThickness / 2 - 10, JAR_WIDTH - cornerRadius * 2, wallThickness, wallOptions);
      const leftWall = Matter.Bodies.rectangle(-wallThickness / 2 + 10, JAR_HEIGHT / 2, wallThickness, JAR_HEIGHT * 2, wallOptions);
      const rightWall = Matter.Bodies.rectangle(JAR_WIDTH + wallThickness / 2 - 10, JAR_HEIGHT / 2, wallThickness, JAR_HEIGHT * 2, wallOptions);
      const leftCorner = Matter.Bodies.rectangle(cornerRadius / 3, JAR_HEIGHT - cornerRadius / 4, cornerRadius * 1.2, wallThickness, { ...wallOptions, angle: Math.PI / 5 });
      const rightCorner = Matter.Bodies.rectangle(JAR_WIDTH - cornerRadius / 3, JAR_HEIGHT - cornerRadius / 4, cornerRadius * 1.2, { ...wallOptions, angle: -Math.PI / 5 });
      Matter.World.add(engine.world, [ground, leftWall, rightWall, leftCorner, rightCorner]);
    }
  }, [settings.soundTheme, JAR_WIDTH, JAR_HEIGHT, setIsConfigOpen]);

  useEffect(() => {
    const engine = Matter.Engine.create();
    engineRef.current = engine;
    
    const wallOptions = { isStatic: true, friction: 0.1, restitution: 0.5 };
    const cornerRadius = 80;
    const wallThickness = 40;

    const ground = Matter.Bodies.rectangle(JAR_WIDTH / 2, JAR_HEIGHT + wallThickness / 2 - 10, JAR_WIDTH - cornerRadius * 2, wallThickness, wallOptions);
    const leftWall = Matter.Bodies.rectangle(-wallThickness / 2 + 10, JAR_HEIGHT / 2, wallThickness, JAR_HEIGHT * 2, wallOptions);
    const rightWall = Matter.Bodies.rectangle(JAR_WIDTH + wallThickness / 2 - 10, JAR_HEIGHT / 2, wallThickness, JAR_HEIGHT * 2, wallOptions);
    const leftCorner = Matter.Bodies.rectangle(cornerRadius / 3, JAR_HEIGHT - cornerRadius / 4, cornerRadius * 1.2, wallThickness, { ...wallOptions, angle: Math.PI / 5 });
    const rightCorner = Matter.Bodies.rectangle(JAR_WIDTH - cornerRadius / 3, JAR_HEIGHT - cornerRadius / 4, cornerRadius * 1.2, { ...wallOptions, angle: -Math.PI / 5 });
    
    Matter.World.add(engine.world, [ground, leftWall, rightWall, leftCorner, rightCorner]);

    const runner = Matter.Runner.create();
    Matter.Runner.run(runner, engine);
    runnerRef.current = runner;

    let animationFrameId: number;
    const renderLoop = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0, 0, JAR_WIDTH, JAR_HEIGHT);

      marbleBodiesRef.current.forEach((body: any) => {
        const { position, circleRadius } = body;
        const color = body.render.fillStyle;

        ctx.save();
        ctx.translate(position.x, position.y);
        ctx.rotate(body.angle);
        
        const gradient = ctx.createRadialGradient(-circleRadius*0.3, -circleRadius*0.3, circleRadius*0.1, 0, 0, circleRadius);
        gradient.addColorStop(0, color);
        gradient.addColorStop(1, '#000000');
        
        ctx.beginPath();
        ctx.arc(0, 0, circleRadius, 0, 2 * Math.PI);
        ctx.fillStyle = gradient;
        ctx.fill();
        
        ctx.lineWidth = 1;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(-circleRadius * 0.4, -circleRadius * 0.4, circleRadius * 0.25, 0, 2 * Math.PI);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.fill();
        
        ctx.restore();
      });

      animationFrameId = requestAnimationFrame(renderLoop);
    };
    renderLoop();

    return () => {
      Matter.Runner.stop(runner);
      Matter.Engine.clear(engine);
      cancelAnimationFrame(animationFrameId);
      marbleBodiesRef.current = [];
    };
  }, [JAR_WIDTH, JAR_HEIGHT]);

  useEffect(() => {
    storage.setItem('teacherToolsMarbleJarCount', JSON.stringify(marbleCount));
    storage.setItem('teacherToolsMarbleJarTarget', JSON.stringify(target));
    storage.setItem('teacherToolsMarbleJarStyle', JSON.stringify(jarStyleId));

    const engine = engineRef.current;
    if (!engine) return;

    while (marbleBodiesRef.current.length < marbleCount) {
      const color = MARBLE_COLORS[marbleBodiesRef.current.length % MARBLE_COLORS.length];
      const newMarble = Matter.Bodies.circle(
        JAR_WIDTH / 2 + (Math.random() * 40 - 20), 
        -50, 
        MARBLE_RADIUS, 
        { 
          restitution: 0.7,
          friction: 0.02,
          density: 0.05,
          render: { fillStyle: color } as any
        }
      );
      Matter.World.add(engine.world, newMarble);
      marbleBodiesRef.current.push(newMarble);
    }

    if (marbleCount >= target && !isRewarding && marbleCount > 0) {
      triggerReward();
    }
  }, [marbleCount, target, jarStyleId, JAR_WIDTH, triggerReward, isRewarding]);

  useEffect(() => {
    setHasConfig(true);
    setOnReset(() => resetJar);
    setHelpContent(getHelpInfo());
    setOnConfigToggle(() => () => setIsConfigOpen(prev => !prev));
    return () => clearHeader();
  }, [clearHeader, setOnReset, resetJar, setHelpContent, setHasConfig, setOnConfigToggle, setIsConfigOpen]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!jarContainerRef.current) return;
    const rect = jarContainerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const boundedX = Math.max(MARBLE_RADIUS, Math.min(x, JAR_WIDTH - MARBLE_RADIUS));
    setHoverX(boundedX);
  };

  const handleMouseLeave = () => {
    setHoverX(null);
  };

  const handleJarClick = (e: React.MouseEvent) => {
    if (!jarContainerRef.current) return;
    const rect = jarContainerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    removeMarbleAtPoint(x, y);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 w-full h-full font-['Outfit'] select-none overflow-hidden">
      <ToolPanel className="flex-1" baseWidth={1200} baseHeight={800}>
        <div className="flex flex-col items-center justify-center w-full h-full relative group">
          
          <div className="relative flex flex-col items-center z-10 w-full h-full">
            {/* Drop Preview */}
            <div className="h-[60px] w-full relative mb-8 opacity-0 group-hover:opacity-100 transition-all duration-500 pointer-events-none">
               {hoverX !== null && !isRewarding && (
                 <motion.div 
                   className="absolute top-0 w-12 h-12 rounded-full bg-white/40  backdrop-blur-xl border-4 border-white flex items-center justify-center overflow-hidden"
                   style={{ left: hoverX, transform: 'translateX(-50%)' }}
                   layoutId="drop-preview"
                 >
                    <div className="w-full h-full bg-gradient-to-tr from-slate-200/50 to-transparent" />
                 </motion.div>
               )}
            </div>

            {/* Jar Container */}
            <div 
              ref={jarContainerRef}
              onClick={handleJarClick}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              className="relative bg-white/10 backdrop-blur-[2px] rounded-b-[5rem] border-[10px] border-t-0 border-white/90 -[0_50px_100px_-20px_rgba(0,0,0,0.1),inset_0_0_80px_rgba(255,255,255,0.5)] overflow-hidden cursor-crosshair"
              style={{ width: JAR_WIDTH, height: JAR_HEIGHT }}
            >
               <div className="absolute top-0 left-0 right-0 h-14 bg-white/30 border-b-4 border-white/40 z-20 pointer-events-none flex items-center justify-center">
                  <div className="w-1/3 h-2 bg-white/20 rounded-full" />
               </div>
               
               <canvas 
                 ref={canvasRef} 
                 width={JAR_WIDTH} 
                 height={JAR_HEIGHT} 
                 className="w-full h-full absolute inset-0 z-10 pointer-events-none"
               />

               {/* Optical Effects */}
               <div className="absolute inset-0 pointer-events-none z-30 bg-gradient-to-tr from-white/10 via-transparent to-white/5" />
               <div className="absolute left-8 top-16 bottom-16 w-3 bg-white/10 rounded-full blur-[3px] pointer-events-none z-30 opacity-60" />
               <div className="absolute right-12 top-24 w-2 h-32 bg-white/20 rounded-full blur-[1px] pointer-events-none z-30 opacity-40 rotate-6" />
            </div>

            {/* Tap Instruction */}
            <div className="mt-8 flex items-center gap-4 bg-white/80 border-2 border-slate-100 px-6 py-3 rounded-2xl backdrop-blur-md  pointer-events-none italic">
               <div className="text-right">
                  <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest leading-none">
                    <FormattedMessage id="marblejar.status.ready" defaultMessage="Tap to add" />
                  </p>
               </div>
               <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white ">
                  <MousePointer2 size={16} strokeWidth={3} />
               </div>
            </div>
          </div>
        </div>
      </ToolPanel>

      {/* Sidebar with Settings and Status */}
      <div className="w-full lg:w-[400px] flex flex-col gap-8 italic">
        
        {/* Status Card */}
        <div className="bg-slate-900 p-10 rounded-[3rem] border-4 border-slate-800  flex flex-col items-center gap-6 relative overflow-hidden shrink-0">
           <div className="relative z-10 flex flex-col items-center w-full">
              <div className="flex items-center gap-4 mb-2">
                 <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse -[0_0_15px_rgba(16,185,129,0.5)]" />
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em]">
                   <FormattedMessage id="marblejar.status.marbles" defaultMessage="Marbles" />
                 </span>
              </div>
              <motion.span 
                key={marbleCount}
                initial={{ scale: 0.8, opacity: 0, y: 10 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                className="text-[8rem] font-black text-white italic tracking-tighter leading-none tabular-nums"
              >
                {marbleCount}
              </motion.span>
              <div className="mt-6 flex items-center gap-3 bg-white/5 border border-white/10 px-6 py-2 rounded-2xl">
                 <Target size={14} className="text-indigo-400" />
                 <span className="text-xs font-black text-indigo-200 uppercase tracking-widest">
                   <FormattedMessage id="marblejar.status.goal" defaultMessage="Goal" />: {target}
                 </span>
              </div>
           </div>
        </div>

        {/* Settings Panel */}
        <SettingsPanel
          isOpen={isConfigOpen}
          onClose={() => setIsConfigOpen(false)}
          className="flex-1 overflow-y-auto"
        >
          <div className="space-y-10">
             {/* Goal Setting */}
             <div className="space-y-6">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] block text-center">
                  <FormattedMessage id="marblejar.settings.goal" defaultMessage="Reward Goal" />
                </label>
                <div className="flex items-center justify-center gap-8">
                   <button 
                     onClick={() => { setTarget(t => Math.max(1, t - 5)); audioEngine.playTick(settings.soundTheme); }}
                     className="p-4 bg-white rounded-2xl border-4 border-slate-100 text-slate-300 hover:text-indigo-600 hover:border-indigo-100 active:scale-90 transition-all "
                   >
                     <Minus size={20} strokeWidth={4} />
                   </button>
                   <span className="text-5xl font-black text-slate-900 tabular-nums italic">{target}</span>
                   <button 
                     onClick={() => { setTarget(t => Math.min(100, t + 5)); audioEngine.playTick(settings.soundTheme); }}
                     className="p-4 bg-white rounded-2xl border-4 border-slate-100 text-slate-300 hover:text-indigo-600 hover:border-indigo-100 active:scale-90 transition-all "
                   >
                     <Plus size={20} strokeWidth={4} />
                   </button>
                </div>
             </div>

             {/* Style Setting */}
             <div className="space-y-6">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] block text-center">
                  <FormattedMessage id="marblejar.settings.style" defaultMessage="Jar Style" />
                </label>
                <div className="grid grid-cols-1 gap-2">
                   {JAR_STYLES.map(style => (
                     <button
                       key={style.id}
                       onClick={() => { setJarStyleId(style.id); audioEngine.playTick(settings.soundTheme); }}
                       className={`px-6 py-4 rounded-[1.5rem] border-4 transition-all flex items-center justify-between font-black text-xs uppercase tracking-widest ${
                         jarStyleId === style.id 
                           ? 'bg-slate-900 border-indigo-500 text-white ' 
                           : 'bg-white border-slate-100 text-slate-300 hover:border-indigo-100'
                       }`}
                     >
                       <FormattedMessage id={style.nameId} defaultMessage={style.id} />
                       <RotateCcw size={14} className={jarStyleId === style.id ? 'text-indigo-400' : 'opacity-0'} />
                     </button>
                   ))}
                </div>
             </div>
          </div>
        </SettingsPanel>
      </div>

      {/* Reward Overlay */}
      <AnimatePresence>
        {isRewarding && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-2xl p-8"
          >
            <motion.div
              initial={{ scale: 0.5, y: 100 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white rounded-[4rem] p-12 flex flex-col items-center text-center gap-8 border-8 border-white max-w-xl  relative overflow-hidden italic"
            >
              <div className="relative">
                <div className="absolute -inset-12 bg-indigo-500 blur-3xl opacity-20 animate-pulse rounded-full" />
                <div className="w-40 h-40 rounded-[3rem] bg-indigo-600 flex items-center justify-center text-white relative z-10 rotate-3  border-8 border-white">
                   <Trophy size={80} strokeWidth={1.5} className=" text-yellow-400" />
                </div>
                <div className="absolute -top-4 -right-4 w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center text-white  animate-bounce z-20 border-4 border-white">
                   <Sparkles size={24} strokeWidth={3} />
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-5xl font-black text-slate-900 leading-none uppercase tracking-tighter">
                  <FormattedMessage id="marblejar.reward.title" defaultMessage="Well Done!" />
                </h3>
                <div className="w-16 h-1.5 bg-indigo-600 mx-auto rounded-full" />
                <p className="text-base text-slate-400 font-black uppercase tracking-widest">
                  <FormattedMessage id="marblejar.reward.subtitle" defaultMessage="Goal Reached!" />
                </p>
              </div>
              
              <button
                onClick={resetJar}
                className="w-full h-20 bg-slate-900 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] text-lg hover:bg-indigo-600 transition-all  flex items-center justify-center gap-4 border-4 border-white active:scale-95"
              >
                <RotateCcw size={24} strokeWidth={4} />
                <FormattedMessage id="marblejar.reward.reset" defaultMessage="Reset Jar" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MarbleJar;
