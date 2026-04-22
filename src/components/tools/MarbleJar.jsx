import React, { useState, useEffect, useRef } from 'react';
import { Plus, Minus, RotateCcw, Sparkles, Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import Matter from 'matter-js';
import { useSettings } from '../../contexts/SettingsContext';
import { audioEngine } from '../../utils/audio';

const MARBLE_COLORS = ['#FF5555', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#FF00E5', '#00FF94'];
const JAR_WIDTH = 256;
const JAR_HEIGHT = 320;
const MARBLE_RADIUS = 20;

export const MarbleJar = () => {
  const [marbleCount, setMarbleCount] = useState(() => {
    const saved = localStorage.getItem('teacherToolsMarbleJarCount');
    return saved ? JSON.parse(saved) : 0;
  });

  const [target, setTarget] = useState(() => {
    const saved = localStorage.getItem('teacherToolsMarbleJarTarget');
    return saved ? JSON.parse(saved) : 10;
  });

  const [isRewarding, setIsRewarding] = useState(false);
  const { settings } = useSettings();
  
  // Physics Refs
  const engineRef = useRef(null);
  const runnerRef = useRef(null);
  const canvasRef = useRef(null);
  const marbleBodiesRef = useRef([]);

  // Initialize Physics Engine
  useEffect(() => {
    const engine = Matter.Engine.create();
    engineRef.current = engine;
    
    // Create static jar walls (slanted bottom for more "pile" feel)
    const ground = Matter.Bodies.rectangle(JAR_WIDTH / 2, JAR_HEIGHT + 20, JAR_WIDTH, 40, { isStatic: true, friction: 0.1, restitution: 0.5 });
    const leftWall = Matter.Bodies.rectangle(-10, JAR_HEIGHT / 2, 20, JAR_HEIGHT * 2, { isStatic: true, friction: 0.1 });
    const rightWall = Matter.Bodies.rectangle(JAR_WIDTH + 10, JAR_HEIGHT / 2, 20, JAR_HEIGHT * 2, { isStatic: true, friction: 0.1 });
    
    Matter.World.add(engine.world, [ground, leftWall, rightWall]);

    const runner = Matter.Runner.create();
    Matter.Runner.run(runner, engine);
    runnerRef.current = runner;

    // Custom Canvas Render Loop
    let animationFrameId;
    const renderLoop = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, JAR_WIDTH, JAR_HEIGHT);

      marbleBodiesRef.current.forEach((body, idx) => {
        const { position, circleRadius } = body;
        const color = body.render.fillStyle;

        ctx.save();
        ctx.translate(position.x, position.y);
        ctx.rotate(body.angle);
        
        // Base Marble with Radial Gradient
        const gradient = ctx.createRadialGradient(-circleRadius*0.3, -circleRadius*0.3, circleRadius*0.1, 0, 0, circleRadius);
        gradient.addColorStop(0, color);
        gradient.addColorStop(1, '#000000');
        
        ctx.beginPath();
        ctx.arc(0, 0, circleRadius, 0, 2 * Math.PI);
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // Glass Rim Highlight
        ctx.lineWidth = 1;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.stroke();

        // High Gloss Reflection
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
    };
  }, []);

  // Sync state to physics
  useEffect(() => {
    localStorage.setItem('teacherToolsMarbleJarCount', JSON.stringify(marbleCount));
    localStorage.setItem('teacherToolsMarbleJarTarget', JSON.stringify(target));

    const engine = engineRef.current;
    if (!engine) return;

    // Add missing marbles
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

    // Remove extra marbles (LIFO)
    while (marbleBodiesRef.current.length > marbleCount) {
      const removedMarble = marbleBodiesRef.current.pop();
      Matter.World.remove(engine.world, removedMarble);
    }

    if (marbleCount >= target && !isRewarding && marbleCount > 0) {
      triggerReward();
    }
  }, [marbleCount, target]);

  const addMarble = () => {
    if (isRewarding) return;
    audioEngine.playTick(settings.soundTheme);
    setMarbleCount(prev => prev + 1);
  };

  const removeMarble = () => {
    if (isRewarding || marbleCount === 0) return;
    setMarbleCount(prev => prev - 1);
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

  return (
    <div className="max-w-6xl mx-auto px-6 py-12 flex flex-col items-center gap-12 select-none h-full">
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-4">
          <div className="p-4 bg-amber-100 rounded-3xl text-amber-600 shadow-xl shadow-amber-100 rotate-12">
            <Trophy size={40} />
          </div>
          <h2 className="text-6xl font-black text-slate-800 tracking-tighter italic">Marble Reward</h2>
        </div>
        <p className="text-slate-400 font-bold uppercase tracking-[0.3em] text-xs">Enhanced Physics Simulation</p>
      </div>

      <div className="flex flex-col lg:flex-row items-center justify-center gap-16 w-full">
        {/* Controls - Left */}
        <div className="order-2 lg:order-1 flex flex-col gap-6 items-center">
           <div className="bg-white p-8 rounded-[3rem] shadow-2xl border border-slate-100 flex flex-col items-center gap-4 min-w-[200px]">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Marble Goal</span>
              <div className="flex items-center gap-6">
                <button 
                  onClick={() => setTarget(Math.max(1, target - 5))}
                  className="p-3 bg-slate-50 text-slate-400 rounded-2xl hover:bg-rose-50 hover:text-rose-500 transition-all active:scale-90"
                >
                  <Minus size={20} />
                </button>
                <span className="text-5xl font-black text-slate-800 tabular-nums">{target}</span>
                <button 
                  onClick={() => setTarget(target + 5)}
                  className="p-3 bg-slate-50 text-slate-400 rounded-2xl hover:bg-emerald-50 hover:text-emerald-500 transition-all active:scale-90"
                >
                  <Plus size={20} />
                </button>
              </div>
           </div>
           
           <button
            onClick={resetJar}
            className="flex items-center gap-3 px-8 py-4 bg-slate-900 text-white rounded-2xl hover:bg-slate-800 transition-all font-black text-sm uppercase tracking-widest active:scale-95 shadow-xl"
           >
            <RotateCcw size={18} /> Reset Jar
           </button>
        </div>

        {/* The Jar - Center */}
        <div className="order-1 lg:order-2 relative group">
          <div className="relative w-72 h-96 bg-white/10 backdrop-blur-[2px] rounded-b-[4rem] border-8 border-t-0 border-white shadow-2xl overflow-hidden">
             {/* Glass Lid Rim */}
             <div className="absolute top-0 left-0 right-0 h-10 bg-white/40 border-b-4 border-white/60 z-20" />
             
             {/* Physics Canvas */}
             <canvas 
               ref={canvasRef} 
               width={JAR_WIDTH} 
               height={JAR_HEIGHT} 
               className="w-full h-full absolute inset-0 z-10"
             />

             {/* Jar Front Shimmer */}
             <div className="absolute inset-0 pointer-events-none z-30 bg-gradient-to-tr from-white/10 via-transparent to-white/5" />
             <div className="absolute left-6 top-12 bottom-12 w-2 bg-white/20 rounded-full blur-[2px] pointer-events-none z-30" />
          </div>

          {/* Goal Indicator Ring */}
          <div className="absolute inset-0 border-[6px] border-dashed border-indigo-400/20 rounded-b-[4.5rem] -m-4 pointer-events-none group-hover:border-indigo-400/40 transition-colors" />
        </div>

        {/* Add Button - Right */}
        <div className="order-3 flex flex-col items-center gap-8">
           <div className="bg-slate-900 px-10 py-6 rounded-[2.5rem] shadow-2xl flex flex-col items-center border border-slate-800">
             <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Current Count</span>
             <motion.span 
               key={marbleCount}
               initial={{ scale: 0.8, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               className="text-6xl font-black text-white tabular-nums"
             >
               {marbleCount}
             </motion.span>
           </div>

           <button
            onClick={addMarble}
            disabled={isRewarding}
            className="w-32 h-32 bg-emerald-500 text-white rounded-full flex flex-col items-center justify-center gap-2 shadow-2xl shadow-emerald-200 hover:bg-emerald-600 hover:scale-110 active:scale-90 transition-all disabled:opacity-50 disabled:scale-100 group"
           >
            <Plus size={48} className="group-hover:rotate-90 transition-transform duration-500" />
            <span className="text-[10px] font-black uppercase tracking-widest">Add Marble</span>
           </button>
        </div>
      </div>

      {/* Reward Overlay */}
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
