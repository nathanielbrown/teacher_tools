import React, { useState, useEffect, useRef } from 'react';
import { Plus, Minus, RotateCcw, Sparkles, Trophy, Settings, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import Matter from 'matter-js';
import { useSettings } from '../../contexts/SettingsContext';
import { ToolHeader } from '../ToolHeader';
import { audioEngine } from '../../utils/audio';

const MARBLE_COLORS = ['#FF5555', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#FF00E5', '#00FF94'];
const MARBLE_RADIUS = 20;

const JAR_STYLES = [
  { id: 'small-classic', name: 'Small Classic', width: 200, height: 260 },
  { id: 'small-wide', name: 'Small Wide', width: 240, height: 220 },
  { id: 'large-classic', name: 'Large Classic', width: 256, height: 320 },
  { id: 'large-tall', name: 'Large Tall', width: 240, height: 400 },
];

export const MarbleJar = () => {
  const [marbleCount, setMarbleCount] = useState(() => {
    const saved = localStorage.getItem('teacherToolsMarbleJarCount');
    return saved ? JSON.parse(saved) : 0;
  });

  const [target, setTarget] = useState(() => {
    const saved = localStorage.getItem('teacherToolsMarbleJarTarget');
    return saved ? JSON.parse(saved) : 10;
  });
  
  const [jarStyleId, setJarStyleId] = useState(() => {
    const saved = localStorage.getItem('teacherToolsMarbleJarStyle');
    return saved ? JSON.parse(saved) : 'large-classic';
  });

  const currentJarStyle = JAR_STYLES.find(s => s.id === jarStyleId) || JAR_STYLES[2];
  const { width: JAR_WIDTH, height: JAR_HEIGHT } = currentJarStyle;

  const [showConfig, setShowConfig] = useState(false);
  const [isRewarding, setIsRewarding] = useState(false);
  
  const [hoverX, setHoverX] = useState(null);

  const { settings } = useSettings();
  
  const engineRef = useRef(null);
  const runnerRef = useRef(null);
  const canvasRef = useRef(null);
  const jarContainerRef = useRef(null);
  const marbleBodiesRef = useRef([]);

  useEffect(() => {
    const engine = Matter.Engine.create();
    engineRef.current = engine;
    
    const ground = Matter.Bodies.rectangle(JAR_WIDTH / 2, JAR_HEIGHT + 20, JAR_WIDTH, 40, { isStatic: true, friction: 0.1, restitution: 0.5 });
    const leftWall = Matter.Bodies.rectangle(-10, JAR_HEIGHT / 2, 20, JAR_HEIGHT * 2, { isStatic: true, friction: 0.1 });
    const rightWall = Matter.Bodies.rectangle(JAR_WIDTH + 10, JAR_HEIGHT / 2, 20, JAR_HEIGHT * 2, { isStatic: true, friction: 0.1 });
    
    Matter.World.add(engine.world, [ground, leftWall, rightWall]);

    const runner = Matter.Runner.create();
    Matter.Runner.run(runner, engine);
    runnerRef.current = runner;

    let animationFrameId;
    const renderLoop = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, JAR_WIDTH, JAR_HEIGHT);

      marbleBodiesRef.current.forEach((body) => {
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
    localStorage.setItem('teacherToolsMarbleJarCount', JSON.stringify(marbleCount));
    localStorage.setItem('teacherToolsMarbleJarTarget', JSON.stringify(target));
    localStorage.setItem('teacherToolsMarbleJarStyle', JSON.stringify(jarStyleId));

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
          render: { fillStyle: color } 
        }
      );
      Matter.World.add(engine.world, newMarble);
      marbleBodiesRef.current.push(newMarble);
    }

    while (marbleBodiesRef.current.length > marbleCount) {
      const removedMarble = marbleBodiesRef.current.pop();
      Matter.World.remove(engine.world, removedMarble);
    }

    if (marbleCount >= target && !isRewarding && marbleCount > 0) {
      triggerReward();
    }
  }, [marbleCount, target, jarStyleId, JAR_WIDTH]);

  const addMarble = (xPos = JAR_WIDTH / 2) => {
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
           render: { fillStyle: color } 
         }
       );
       Matter.World.add(engine.world, newMarble);
       marbleBodiesRef.current.push(newMarble);
    }
    
    setMarbleCount(prev => prev + 1);
  };

  const removeMarbleAtPoint = (x, y) => {
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
    } else {
      addMarble(x);
    }
  };

  const resetJar = () => {
    setMarbleCount(0);
    setIsRewarding(false);
  };

  const triggerReward = () => {
    setIsRewarding(true);
    audioEngine.playAlarm(settings.soundTheme);

    const end = Date.now() + 4 * 1000;
    (function frame() {
      confetti({ particleCount: 10, angle: 60, spread: 55, origin: { x: 0, y: 0.8 }, colors: MARBLE_COLORS });
      confetti({ particleCount: 10, angle: 120, spread: 55, origin: { x: 1, y: 0.8 }, colors: MARBLE_COLORS });
      if (Date.now() < end) requestAnimationFrame(frame);
    }());
  };

  const handleMouseMove = (e) => {
    if (!jarContainerRef.current) return;
    const rect = jarContainerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const boundedX = Math.max(MARBLE_RADIUS, Math.min(x, JAR_WIDTH - MARBLE_RADIUS));
    setHoverX(boundedX);
  };

  const handleMouseLeave = () => {
    setHoverX(null);
  };

  const handleJarClick = (e) => {
    if (!jarContainerRef.current) return;
    const rect = jarContainerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    removeMarbleAtPoint(x, y);
  };

  return (
    <div className="w-full mx-auto px-4 pt-2 pb-8 h-full flex flex-col gap-12 select-none overflow-x-hidden">
      <ToolHeader
        title="Marble Jar"
        icon={Trophy}
        description="Behavioral Reward Simulation"
        infoContent={
          <>
            <p>
              <strong className="text-white block mb-1">Add & Remove Marbles</strong>
              Click inside the jar to add a marble. Click on an existing marble to remove it.
            </p>
            <p>
              <strong className="text-white block mb-1">Settings</strong>
              Click the config icon to adjust the marble target and the jar style.
            </p>
          </>
        }
      >
        <button
          onClick={resetJar}
          className="p-3 bg-slate-50 text-slate-600 rounded-2xl hover:bg-rose-50 hover:text-rose-600 transition-all active:scale-95 border-2 border-transparent hover:border-rose-100 shadow-sm"
          title="Reset Jar"
        >
          <RotateCcw size={24} />
        </button>
        <button
          onClick={() => setShowConfig(!showConfig)}
          className={`p-3 rounded-2xl transition-all active:scale-95 border-2 shadow-sm ${
            showConfig 
              ? 'bg-slate-800 text-white border-slate-900 shadow-md' 
              : 'bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 border-transparent hover:border-indigo-100'
          }`}
          title="Configure"
        >
          {showConfig ? <X size={24} /> : <Settings size={24} />}
        </button>
      </ToolHeader>

      <div className="flex flex-col lg:flex-row gap-8 w-full max-w-5xl items-start mx-auto justify-center relative min-h-[500px]">
        
        <div className="flex flex-col items-center justify-center w-full order-1">
          <div className="relative group flex flex-col items-center">
            
            <div className="h-[40px] w-full relative mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
               {hoverX !== null && !isRewarding && (
                 <div 
                   className="absolute top-0 w-10 h-10 rounded-full bg-slate-300/80 shadow-lg backdrop-blur-sm border-2 border-white/50"
                   style={{ 
                     left: hoverX,
                     transform: 'translateX(-50%)'
                   }}
                 />
               )}
            </div>

            <div 
              ref={jarContainerRef}
              onClick={handleJarClick}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              className="relative bg-white/10 backdrop-blur-[2px] rounded-b-[4rem] border-8 border-t-0 border-white shadow-2xl overflow-hidden cursor-pointer"
              style={{ width: JAR_WIDTH, height: JAR_HEIGHT }}
            >
               <div className="absolute top-0 left-0 right-0 h-10 bg-white/40 border-b-4 border-white/60 z-20 pointer-events-none" />
               
               <canvas 
                 ref={canvasRef} 
                 width={JAR_WIDTH} 
                 height={JAR_HEIGHT} 
                 className="w-full h-full absolute inset-0 z-10 pointer-events-none"
               />

               <div className="absolute inset-0 pointer-events-none z-30 bg-gradient-to-tr from-white/10 via-transparent to-white/5" />
               <div className="absolute left-6 top-12 bottom-12 w-2 bg-white/20 rounded-full blur-[2px] pointer-events-none z-30" />
            </div>

            <div 
              className="absolute border-[6px] border-dashed border-indigo-400/20 rounded-b-[4.5rem] pointer-events-none group-hover:border-indigo-400/40 transition-colors"
              style={{ top: 48, width: JAR_WIDTH + 32, height: JAR_HEIGHT + 16 }}
            />

            <div className="mt-12 bg-slate-900 px-10 py-6 rounded-[2rem] shadow-2xl flex flex-col items-center border border-slate-800 w-full max-w-[240px] relative group overflow-hidden">
              <div className="absolute inset-0 bg-emerald-500/5 rounded-[2rem] blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1 relative">Current Count</span>
              <motion.span 
                key={marbleCount}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-6xl font-black text-white tabular-nums relative"
              >
                {marbleCount}
              </motion.span>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {showConfig && (
            <motion.div 
              initial={{ opacity: 0, x: 20, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.95 }}
              className="lg:absolute right-0 top-0 w-full max-w-[320px] bg-white p-6 rounded-[2rem] shadow-2xl border border-slate-100 flex flex-col gap-8 z-40 order-2 lg:order-none"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-black text-slate-800 flex items-center gap-2">
                  <Settings size={18} className="text-indigo-500" />
                  Configuration
                </h3>
                <button 
                  onClick={() => setShowConfig(false)}
                  className="p-2 text-slate-400 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="flex flex-col items-center gap-4 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Marble Goal</label>
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setTarget(Math.max(1, target - 5))}
                    className="p-3 bg-white text-slate-500 rounded-xl hover:bg-rose-50 hover:text-rose-500 transition-all active:scale-90 border border-slate-200 hover:border-rose-200 shadow-sm"
                  >
                    <Minus size={18} />
                  </button>
                  <span className="text-4xl font-black text-slate-800 tabular-nums w-16 text-center">{target}</span>
                  <button 
                    onClick={() => setTarget(target + 5)}
                    className="p-3 bg-white text-slate-500 rounded-xl hover:bg-emerald-50 hover:text-emerald-500 transition-all active:scale-90 border border-slate-200 hover:border-emerald-200 shadow-sm"
                  >
                    <Plus size={18} />
                  </button>
                </div>

                <div className="w-full mt-2">
                  <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1 px-1">
                    <span>Progress</span>
                    <span>{Math.round(Math.min(100, (marbleCount / target) * 100))}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-emerald-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, (marbleCount / target) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Jar Style</label>
                <div className="grid grid-cols-2 gap-2">
                  {JAR_STYLES.map(style => (
                    <button
                      key={style.id}
                      onClick={() => setJarStyleId(style.id)}
                      className={`p-3 rounded-xl text-xs font-bold transition-all border-2 flex flex-col items-center gap-1 ${
                        jarStyleId === style.id
                          ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-sm'
                          : 'bg-white border-slate-100 text-slate-500 hover:bg-slate-50 hover:border-slate-300'
                      }`}
                    >
                      <span>{style.name}</span>
                    </button>
                  ))}
                </div>
              </div>

            </motion.div>
          )}
        </AnimatePresence>

      </div>

      <AnimatePresence>
        {isRewarding && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-indigo-950/80 backdrop-blur-md p-6"
          >
            <motion.div
              initial={{ scale: 0.5, y: 100 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white p-16 rounded-[4rem] shadow-2xl flex flex-col items-center text-center gap-8 border-4 border-indigo-500"
            >
              <div className="relative">
                <div className="absolute -inset-4 bg-yellow-400 blur-3xl opacity-30 animate-pulse rounded-full" />
                <Sparkles size={120} className="text-yellow-500 relative animate-bounce" />
              </div>
              <div className="space-y-4">
                <h3 className="text-6xl font-black text-slate-800 tracking-tighter uppercase italic">Target Reached!</h3>
                <p className="text-slate-500 text-xl font-bold">Amazing work! Your class reward has been unlocked.</p>
              </div>
              <button
                onClick={resetJar}
                className="px-12 py-6 bg-indigo-600 text-white rounded-3xl font-black text-2xl hover:bg-indigo-700 transition-all active:scale-95 shadow-xl shadow-indigo-100"
              >
                CLOSE & RESET
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
