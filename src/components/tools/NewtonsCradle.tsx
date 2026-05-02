import React, { useEffect, useRef, useState, useCallback } from 'react';
import Matter from 'matter-js';
import { 
  RotateCcw, 
  Settings2, 
  X, 
  MousePointer2,
  Activity,
  Info,
  ChevronRight,
  BrainCircuit
} from 'lucide-react';
import { useHeader } from '../../contexts/HeaderContext';
import { useSettings } from '../../contexts/SettingsContext';
import { audioEngine } from '../../utils/audio';
import { motion, AnimatePresence } from 'framer-motion';

// 1. Constants
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 500;
const BALL_RADIUS = 30;
const STRING_LENGTH = 250;
const NUM_BALLS = 5;

// 2. Config (None)

// 3. Text (Help and Info)
const HELP_INFO = (
  <div className="space-y-4 font-['Outfit']">
    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">How to Use Newton's Cradle</h3>
    <div className="space-y-3">
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center text-xs font-black text-indigo-600 shrink-0">1</div>
        <p className="text-sm text-slate-600 font-medium leading-tight"><b>Click and drag</b> any ball to lift it up.</p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center text-xs font-black text-blue-600 shrink-0">2</div>
        <p className="text-sm text-slate-600 font-medium leading-tight"><b>Release</b> the ball to watch the energy transfer through the cradle.</p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-purple-50 flex items-center justify-center text-xs font-black text-purple-600 shrink-0">3</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">Use the <b>Config Weights</b> button to change the mass of each ball.</p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-rose-50 flex items-center justify-center text-xs font-black text-rose-600 shrink-0">4</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">Observe how <b>heavier balls</b> transfer more momentum than lighter ones!</p>
      </div>
    </div>
  </div>
);

// 4. Local Storage (None)

// 5. Classes (None)

// 6. Functions (None)

// 7. Component
export const NewtonsCradle = () => {
  const { setHeaderActions, setOnReset, clearHeader, setHelpContent } = useHeader();
  const { settings } = useSettings();
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<Matter.Engine | null>(null);
  const requestRef = useRef<number | null>(null);
  const [balls, setBalls] = useState<any[]>([]);
  const [selectedBallIndex, setSelectedBallIndex] = useState<number | null>(null);
  const [masses, setMasses] = useState<number[]>(new Array(NUM_BALLS).fill(1));
  const [showConfig, setShowConfig] = useState(false);

  const handleReset = useCallback(() => {
    if (engineRef.current) {
      const bodies = Matter.Composite.allBodies(engineRef.current.world);
      const startX = CANVAS_WIDTH / 2 - (NUM_BALLS - 1) * BALL_RADIUS;
      
      bodies.forEach((body) => {
        if (body.label && body.label.startsWith('ball-')) {
          const i = parseInt(body.label.split('-')[1]);
          const x = startX + i * BALL_RADIUS * 2;
          const y = 100 + STRING_LENGTH;
          Matter.Body.setPosition(body, { x, y });
          Matter.Body.setVelocity(body, { x: 0, y: 0 });
          Matter.Body.setAngle(body, 0);
          Matter.Body.setAngularVelocity(body, 0);
        }
      });
      audioEngine.playTick(settings.soundTheme);
    }
  }, [settings.soundTheme]);

  useEffect(() => {
    const engine = Matter.Engine.create();
    engine.gravity.y = 1.5;
    engineRef.current = engine;

    const world = engine.world;
    const newBalls: Matter.Body[] = [];
    const constraints: Matter.Constraint[] = [];

    const startX = CANVAS_WIDTH / 2 - (NUM_BALLS - 1) * BALL_RADIUS;

    for (let i = 0; i < NUM_BALLS; i++) {
      const x = startX + i * BALL_RADIUS * 2;
      const y = 100 + STRING_LENGTH;

      const ball = Matter.Bodies.circle(x, y, BALL_RADIUS, {
        restitution: 1.0,
        friction: 0,
        frictionAir: 0.001,
        slop: 0,
        label: `ball-${i}`,
        mass: masses[i],
        render: {
          fillStyle: '#e2e8f0'
        }
      });

      const anchor = { x: x, y: 100 };
      const constraint = Matter.Constraint.create({
        pointA: anchor,
        bodyB: ball,
        stiffness: 1,
        length: STRING_LENGTH,
        render: {
          strokeStyle: '#64748b',
          lineWidth: 1
        }
      });

      newBalls.push(ball);
      constraints.push(constraint);
    }

    if (containerRef.current) {
      const mouse = Matter.Mouse.create(containerRef.current);
      const mouseConstraint = Matter.MouseConstraint.create(engine, {
        mouse: mouse,
        constraint: {
          stiffness: 0.2,
          render: {
            visible: false
          }
        }
      });
      Matter.World.add(world, mouseConstraint);
    }

    Matter.World.add(world, [...newBalls, ...constraints]);

    const update = () => {
      Matter.Engine.update(engine, 1000 / 60);
      
      const currentBalls = newBalls.map((b, i) => ({
        id: b.id,
        index: i,
        x: b.position.x,
        y: b.position.y,
        angle: b.angle,
        anchorX: startX + i * BALL_RADIUS * 2,
        anchorY: 100
      }));
      
      setBalls(currentBalls);
      requestRef.current = requestAnimationFrame(update);
    };

    requestRef.current = requestAnimationFrame(update);

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      Matter.Engine.clear(engine);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (engineRef.current) {
      const bodies = Matter.Composite.allBodies(engineRef.current.world);
      masses.forEach((m, i) => {
        const body = bodies.find(b => b.label === `ball-${i}`);
        if (body) {
          Matter.Body.setMass(body, m);
        }
      });
    }
  }, [masses]);

  const updateMass = (index: number, value: string) => {
    const newMasses = [...masses];
    newMasses[index] = parseFloat(value);
    setMasses(newMasses);
    audioEngine.playTick(settings.soundTheme);
  };

  useEffect(() => {
    setOnReset(() => handleReset);
    setHelpContent(HELP_INFO);
    return () => clearHeader();
  }, [clearHeader, setOnReset, handleReset, setHelpContent]);

  useEffect(() => {
    setHeaderActions(
      <div className="flex items-center gap-4 italic">
        <button
          onClick={() => { setShowConfig(!showConfig); audioEngine.playTick(settings.soundTheme); }}
          className={`flex items-center gap-2 px-6 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95  ${
            showConfig ? 'bg-indigo-600 text-white ' : 'bg-white border-2 border-slate-100 text-slate-300 hover:border-indigo-100'
          }`}
        >
          {showConfig ? <X size={14} /> : <Settings2 size={14} />} Config Weights
        </button>
        <button
          onClick={handleReset}
          className="flex items-center gap-2 px-6 py-2 bg-white border-2 border-slate-100 text-slate-300 rounded-xl font-black text-[10px] uppercase tracking-widest hover:border-rose-100 hover:text-rose-600 transition-all active:scale-95 "
        >
          <RotateCcw size={14} /> Reset
        </button>
      </div>
    );
  }, [showConfig, settings.soundTheme, setHeaderActions, handleReset]);

  return (
    <div className="tool-container flex flex-col lg:flex-row gap-8 h-full font-['Outfit'] select-none relative bg-white rounded-[4rem] p-4 lg:p-12 italic ">
      
      <div className="tool-grid-bg opacity-30 pointer-events-none" />

      {/* Simulation Stage */}
      <div className="flex-1 relative overflow-hidden bg-slate-900 rounded-[4rem] group/stage flex flex-col items-center justify-center  border-4 border-slate-800 min-h-[500px]">
        <div className="tool-grid-bg-dark opacity-20 pointer-events-none" />
        
        <div 
          ref={containerRef}
          className="w-full h-full flex flex-col items-center pt-24 relative z-10"
        >
          {/* Frame Support */}
          <div className="w-[500px] h-12 bg-slate-800 rounded-full border-4 border-slate-700 -[0_20px_50px_rgba(0,0,0,0.5)] z-30 flex items-center justify-center relative">
             <div className="w-[450px] h-2 bg-white/5 rounded-full" />
             <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent pointer-events-none" />
          </div>
          
          <svg width={CANVAS_WIDTH} height={CANVAS_HEIGHT} className="relative z-20 overflow-visible cursor-crosshair">
            <defs>
              <radialGradient id="ballGradient" cx="30%" cy="30%" r="70%">
                <stop offset="0%" stopColor="#f8fafc" />
                <stop offset="50%" stopColor="#94a3b8" />
                <stop offset="100%" stopColor="#475569" />
              </radialGradient>
              <radialGradient id="heavyBallGradient" cx="30%" cy="30%" r="70%">
                <stop offset="0%" stopColor="#fff7ed" />
                <stop offset="50%" stopColor="#fb923c" />
                <stop offset="100%" stopColor="#ea580c" />
              </radialGradient>
              <filter id="ballShadow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur in="SourceAlpha" stdDeviation="5" />
                <feOffset dx="0" dy="10" result="offsetblur" />
                <feComponentTransfer>
                  <feFuncA type="linear" slope="0.5" />
                </feComponentTransfer>
                <feMerge>
                  <feMergeNode />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Strings */}
            {balls.map((ball) => (
              <line
                key={`string-${ball.index}`}
                x1={ball.anchorX}
                y1={ball.anchorY}
                x2={ball.x}
                y2={ball.y}
                stroke="#64748b"
                strokeWidth="2"
                strokeLinecap="round"
                opacity={0.4}
              />
            ))}

            {/* Balls */}
            {balls.map((ball) => {
              const mass = masses[ball.index];
              const isHeavy = mass > 1.5;
              
              return (
                <g 
                  key={`ball-group-${ball.index}`} 
                  transform={`translate(${ball.x}, ${ball.y})`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedBallIndex(ball.index);
                    setShowConfig(true);
                    audioEngine.playTick(settings.soundTheme);
                  }}
                  className="cursor-pointer group/ball"
                >
                  <circle
                    r={BALL_RADIUS}
                    fill={isHeavy ? "url(#heavyBallGradient)" : "url(#ballGradient)"}
                    className="transition-all duration-300"
                    stroke={selectedBallIndex === ball.index ? "#6366f1" : "rgba(255,255,255,0.2)"}
                    strokeWidth={selectedBallIndex === ball.index ? "6" : "2"}
                    filter="url(#ballShadow)"
                  />
                  {/* Visual Shine */}
                  <ellipse
                    cx={-BALL_RADIUS * 0.3}
                    cy={-BALL_RADIUS * 0.3}
                    rx={BALL_RADIUS * 0.4}
                    ry={BALL_RADIUS * 0.25}
                    fill="white"
                    fillOpacity="0.4"
                    transform="rotate(-45)"
                  />
                  {mass !== 1 && (
                    <text
                      y="5"
                      textAnchor="middle"
                      fill="white"
                      fontSize="10"
                      fontWeight="900"
                      className="pointer-events-none uppercase tracking-widest italic opacity-80"
                    >
                      {mass.toFixed(1)}kg
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* HUD Overlay */}
        <div className="absolute top-12 left-12 flex flex-col gap-2 z-30">
           <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-2 rounded-xl backdrop-blur-md">
              <Activity size={16} className="text-indigo-400" />
              <p className="text-[10px] font-black text-white uppercase tracking-[0.4em]">Kinetic Energy Analysis</p>
           </div>
        </div>

        <div className="absolute bottom-12 right-12 flex items-center gap-6 z-30 bg-white/5 border border-white/10 p-6 rounded-[2.5rem] backdrop-blur-md">
           <div className="text-right">
              <p className="text-[10px] font-black text-white uppercase tracking-widest">Mechanical Interface</p>
              <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mt-1">Drag units to initiate</p>
           </div>
           <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white  animate-pulse">
              <MousePointer2 size={24} strokeWidth={3} />
           </div>
        </div>
      </div>

      {/* Physics Sidebar */}
      <AnimatePresence>
        {showConfig && (
          <motion.div
            initial={{ opacity: 0, x: 100, width: 0 }}
            animate={{ opacity: 1, x: 0, width: 450 }}
            exit={{ opacity: 0, x: 100, width: 0 }}
            className="flex flex-col gap-8 shrink-0 relative z-40 italic"
          >
            <div className="flex-1 bg-slate-50/50 p-10 rounded-[4rem] border-4 border-white  flex flex-col gap-10 min-h-0">
               <div className="flex items-center justify-between shrink-0 border-b-4 border-white pb-6">
                  <div className="flex items-center gap-4">
                     <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white ">
                        <Settings2 size={24} strokeWidth={3} />
                     </div>
                     <h3 className="text-xl font-black text-slate-900 tracking-tighter uppercase leading-none">Mass Config</h3>
                  </div>
                  <button 
                    onClick={() => { setShowConfig(false); audioEngine.playTick(settings.soundTheme); }} 
                    className="p-3 bg-white border-2 border-slate-100 text-slate-300 hover:text-rose-600 hover:border-rose-100 rounded-xl transition-all  active:scale-90"
                  >
                    <X size={18} strokeWidth={3} />
                  </button>
               </div>

               <div className="flex-1 overflow-y-auto space-y-4 pr-4 custom-scrollbar">
                  {masses.map((mass, i) => (
                    <div 
                      key={i} 
                      className={`p-8 rounded-[2.5rem] border-4 transition-all italic ${selectedBallIndex === i ? 'bg-indigo-600 border-indigo-400  scale-[1.02]' : 'bg-white border-slate-100 hover:border-indigo-100'}`}
                      onMouseEnter={() => setSelectedBallIndex(i)}
                    >
                      <div className="flex justify-between items-center mb-6">
                        <span className={`text-[10px] font-black uppercase tracking-widest ${selectedBallIndex === i ? 'text-indigo-200' : 'text-slate-400'}`}>Unit Alpha-{i + 1}</span>
                        <div className="flex items-center gap-3">
                           <span className={`text-3xl font-black tabular-nums tracking-tighter ${selectedBallIndex === i ? 'text-white' : 'text-slate-900'}`}>{mass.toFixed(1)}</span>
                           <span className={`text-[10px] font-black uppercase ${selectedBallIndex === i ? 'text-indigo-300' : 'text-slate-300'}`}>Kilograms</span>
                        </div>
                      </div>
                      <input
                        type="range" min="0.1" max="10" step="0.1" value={mass}
                        onChange={(e) => updateMass(i, e.target.value)}
                        className={`w-full h-3 rounded-full appearance-none cursor-pointer outline-none transition-all ${selectedBallIndex === i ? 'bg-indigo-400 accent-white' : 'bg-slate-100 accent-indigo-600 border border-slate-200'}`}
                      />
                    </div>
                  ))}
               </div>

               <div className="p-10 bg-slate-900 rounded-[3rem] text-white space-y-6  relative overflow-hidden">
                  <div className="tool-grid-bg opacity-10 pointer-events-none" />
                  <div className="flex items-center gap-4 relative z-10">
                     <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                        <Info size={20} strokeWidth={3} />
                     </div>
                     <h4 className="text-[10px] font-black uppercase tracking-[0.3em]">Theoretical Physics</h4>
                  </div>
                  <p className="text-xs font-black leading-relaxed italic text-slate-400 uppercase tracking-widest relative z-10">
                    Conservation of momentum: <span className="text-indigo-400">p = mv</span>. 
                    <br/><br/>
                    Adjusting mass directly impacts kinetic transfer efficiency.
                  </p>
                  <div className="flex justify-end relative z-10">
                     <BrainCircuit size={24} className="text-indigo-600 opacity-50" />
                  </div>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-50 rounded-full blur-[150px] opacity-40 -z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-rose-50 rounded-full blur-[150px] opacity-40 -z-10 pointer-events-none" />
    </div>
  );
};

export default NewtonsCradle;
