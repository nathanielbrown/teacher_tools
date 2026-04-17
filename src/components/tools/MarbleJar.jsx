import React, { useState, useEffect, useRef } from 'react';
import { Plus, Minus, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import Matter from 'matter-js';
import { useSettings } from '../../contexts/SettingsContext';
import { audioEngine } from '../../utils/audio';

export const MarbleJar = () => {
  const [marbles, setMarbles] = useState(() => {
    const saved = localStorage.getItem('teacherToolsMarbleJar');
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

  const JAR_WIDTH = 256;
  const JAR_HEIGHT = 320;
  const MARBLE_RADIUS = 24;

  const colors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];

  // Initialize Physics Engine
  useEffect(() => {
    const engine = Matter.Engine.create();
    engineRef.current = engine;
    
    // Create static jar walls
    const ground = Matter.Bodies.rectangle(JAR_WIDTH / 2, JAR_HEIGHT + 20, JAR_WIDTH, 40, { isStatic: true, friction: 0.1 });
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

      marbleBodiesRef.current.forEach(body => {
        const { position, circleRadius, render } = body;
        ctx.save();
        ctx.translate(position.x, position.y);
        ctx.rotate(body.angle);
        
        // Solid Color
        ctx.beginPath();
        ctx.arc(0, 0, circleRadius, 0, 2 * Math.PI);
        ctx.fillStyle = render.fillStyle;
        ctx.fill();
        
        // Glass Rim Highlight
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.stroke();

        // Inner Reflection / Gloss
        ctx.beginPath();
        ctx.arc(-circleRadius * 0.3, -circleRadius * 0.3, circleRadius * 0.3, 0, 2 * Math.PI);
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

  // Sync Marbles State to Physics Bodies
  useEffect(() => {
    localStorage.setItem('teacherToolsMarbleJar', JSON.stringify(marbles));
    localStorage.setItem('teacherToolsMarbleJarTarget', JSON.stringify(target));

    const engine = engineRef.current;
    if (!engine) return;

    // Add missing marbles
    while (marbleBodiesRef.current.length < marbles) {
      const color = colors[marbleBodiesRef.current.length % colors.length];
      const newMarble = Matter.Bodies.circle(
        JAR_WIDTH / 2 + (Math.random() * 80 - 40), 
        -(marbleBodiesRef.current.length * MARBLE_RADIUS), // Stagger spawns vertically
        MARBLE_RADIUS, 
        { 
          restitution: 0.6, // Bounciness
          friction: 0.05,
          density: 0.04,
          render: { fillStyle: color } 
        }
      );
      Matter.World.add(engine.world, newMarble);
      marbleBodiesRef.current.push(newMarble);
    }

    // Remove extra marbles (LIFO)
    while (marbleBodiesRef.current.length > marbles) {
      const removedMarble = marbleBodiesRef.current.pop();
      Matter.World.remove(engine.world, removedMarble);
    }

    if (marbles >= target && !isRewarding && marbles > 0) {
      const timeout = setTimeout(triggerReward, 500);
      return () => clearTimeout(timeout);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [marbles, target, isRewarding]);

  const addMarble = () => {
    if (isRewarding) return;
    audioEngine.playTick(settings.soundTheme);
    setMarbles(prev => prev + 1);
  };

  const removeMarble = () => {
    if (isRewarding || marbles === 0) return;
    setMarbles(prev => prev - 1);
  };

  const resetJar = () => {
    setMarbles(0);
    setIsRewarding(false);
  };

  const triggerReward = () => {
    setIsRewarding(true);
    audioEngine.playAlarm(settings.soundTheme);

    const end = Date.now() + 3 * 1000;
    const confettiColors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];

    (function frame() {
      confetti({
        particleCount: 15,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: confettiColors
      });
      confetti({
        particleCount: 15,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: confettiColors
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      } else {
        setTimeout(() => resetJar(), 2000); // Reset automatically after animation
      }
    }());
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-12 pb-12 max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold text-primary">Marble Jar Reward</h2>

      <div className="flex gap-8 items-center w-full justify-center">
        <button
          onClick={removeMarble}
          disabled={marbles === 0 || isRewarding}
          className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-red-500 shadow-lg hover:bg-red-50 hover:scale-105 active:scale-95 disabled:opacity-50 transition-all border-2 border-red-100"
        >
          <Minus size={32} />
        </button>

        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            {/* Jar background/back edge */}
            <div className="w-64 h-80 bg-blue-50/50 rounded-b-[3rem] border-4 border-t-0 border-blue-200/50 shadow-inner relative overflow-hidden" style={{ perspective: '1000px' }}>
              
              {/* Matter.js Physics Canvas */}
              <canvas 
                ref={canvasRef} 
                width={JAR_WIDTH} 
                height={JAR_HEIGHT} 
                className="absolute inset-0 z-10"
              />
              
            </div>

            {/* Jar front/glass overlay (z-index above canvas) */}
            <div className="absolute inset-0 w-64 h-80 rounded-b-[3rem] border-4 border-t-0 border-blue-300 shadow-[inset_0_-10px_20px_rgba(0,0,0,0.1)] pointer-events-none flex flex-col justify-between z-20">
              <div className="w-[110%] -ml-[5%] h-8 border-4 border-blue-300 rounded-[100%] border-b-blue-400 bg-white/20" />

              {/* Glass reflection */}
              <div className="absolute left-4 top-12 bottom-12 w-8 bg-gradient-to-r from-white/30 to-transparent rounded-full filter blur-sm" />
            </div>
          </div>

          <div className="flex flex-col items-center gap-2">
            <div className="font-bold text-5xl text-gray-400 mb-2">
              {marbles} <span className="text-3xl text-gray-300">/ {target}</span>
            </div>
            
            <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100">
              <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Goal</span>
              <button 
                onClick={() => setTarget(Math.max(1, target - 1))}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
                disabled={isRewarding}
              >
                <Minus size={16} />
              </button>
              <span className="font-bold text-lg text-primary w-6 text-center">{target}</span>
              <button 
                onClick={() => setTarget(target + 1)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
                disabled={isRewarding}
              >
                <Plus size={16} />
              </button>
            </div>
          </div>
        </div>

        <button
          onClick={addMarble}
          disabled={isRewarding}
          className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-green-500 shadow-lg hover:bg-green-50 hover:scale-105 active:scale-95 disabled:opacity-50 transition-all border-2 border-green-100 z-30 relative"
        >
          <Plus size={32} />
        </button>
      </div>

      <AnimatePresence>
        {isRewarding && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: -50 }}
            className="flex flex-col items-center gap-6"
          >
            <h3 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-yellow-500 to-blue-500 animate-pulse">
              CLASS REWARD UNLOCKED!
            </h3>
            <button
              onClick={resetJar}
              className="flex items-center gap-2 bg-gray-800 text-white px-8 py-4 rounded-xl hover:bg-gray-700 transition-colors font-bold shadow-xl"
            >
              <RotateCcw size={24} /> Reset Jar
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
