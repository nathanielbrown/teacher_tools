import React, { useEffect, useRef, useState } from 'react';
import Matter from 'matter-js';
import { Zap, RotateCcw, Settings2 } from 'lucide-react';
import { ToolHeader } from '../ToolHeader';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 500;
const BALL_RADIUS = 30;
const STRING_LENGTH = 250;
const NUM_BALLS = 5;

const NewtonsCradle = () => {
  const containerRef = useRef(null);
  const engineRef = useRef(null);
  const requestRef = useRef(null);
  const [balls, setBalls] = useState([]);
  const [selectedBallIndex, setSelectedBallIndex] = useState(null);
  const [masses, setMasses] = useState(new Array(NUM_BALLS).fill(1));
  const [showConfig, setShowConfig] = useState(false);

  useEffect(() => {
    const engine = Matter.Engine.create();
    engine.gravity.y = 1.5; // Stronger gravity for crisper motion
    engineRef.current = engine;

    const world = engine.world;
    const newBalls = [];
    const constraints = [];

    const startX = CANVAS_WIDTH / 2 - (NUM_BALLS - 1) * BALL_RADIUS;

    for (let i = 0; i < NUM_BALLS; i++) {
      const x = startX + i * BALL_RADIUS * 2;
      const y = 350;

      const ball = Matter.Bodies.circle(x, y, BALL_RADIUS, {
        restitution: 1.0, // Perfectly elastic collisions
        friction: 0,
        frictionAir: 0.001,
        slop: 0,
        label: `ball-${i}`,
        mass: masses[i],
        render: {
          fillStyle: '#e2e8f0'
        }
      });

      // Newton's cradle works best when balls are very slightly overlapping or perfectly touching
      // but in Matter.js, we want to avoid initial overlap instability.
      
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

    // Mouse constraint for interaction
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

    Matter.World.add(world, [...newBalls, ...constraints, mouseConstraint]);

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
      cancelAnimationFrame(requestRef.current);
      Matter.Engine.clear(engine);
    };
  }, []);

  // Update masses when state changes
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

  const handleReset = () => {
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
    }
  };

  const updateMass = (index, value) => {
    const newMasses = [...masses];
    newMasses[index] = parseFloat(value);
    setMasses(newMasses);
  };

  return (
    <div className="flex flex-col h-full bg-[#0f172a] text-slate-200">
      <ToolHeader
        title="Newton's Cradle"
        icon={Zap}
        color="#3b82f6"
      />
      
      <div className="flex-1 flex items-center justify-center p-8 relative overflow-hidden select-none">
        <div 
          ref={containerRef}
          className="relative bg-slate-900/50 rounded-2xl shadow-2xl border border-slate-700/50 backdrop-blur-sm overflow-hidden"
          style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
        >
          {/* Support Frame */}
          <div className="absolute top-[80px] left-1/2 -translate-x-1/2 w-[300px] h-4 bg-slate-800 rounded-full border border-slate-700" />
          
          <svg width={CANVAS_WIDTH} height={CANVAS_HEIGHT} className="absolute inset-0 overflow-visible pointer-events-none">
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
              <filter id="shadow">
                <feDropShadow dx="2" dy="4" stdDeviation="3" floodOpacity="0.5" />
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
                strokeWidth="1.5"
                opacity="0.6"
              />
            ))}

            {/* Balls */}
            {balls.map((ball) => {
              const mass = masses[ball.index];
              const isHeavy = mass > 1.5;
              const isLight = mass < 0.5;
              
              return (
                <g 
                  key={`ball-group-${ball.index}`} 
                  transform={`translate(${ball.x}, ${ball.y})`}
                  style={{ cursor: 'pointer', pointerEvents: 'auto' }}
                  onClick={() => {
                    setSelectedBallIndex(ball.index);
                    setShowConfig(true);
                  }}
                >
                  <circle
                    r={BALL_RADIUS}
                    fill={isHeavy ? "url(#heavyBallGradient)" : "url(#ballGradient)"}
                    filter="url(#shadow)"
                    stroke={selectedBallIndex === ball.index ? "#3b82f6" : "rgba(0,0,0,0.1)"}
                    strokeWidth={selectedBallIndex === ball.index ? "3" : "1"}
                  />
                  {/* Highlight */}
                  <circle
                    cx={-BALL_RADIUS * 0.3}
                    cy={-BALL_RADIUS * 0.3}
                    r={BALL_RADIUS * 0.4}
                    fill="white"
                    fillOpacity="0.2"
                  />
                  {/* Label for mass if not standard */}
                  {(isHeavy || isLight) && (
                    <text
                      y="5"
                      textAnchor="middle"
                      fill="white"
                      fontSize="12"
                      fontWeight="bold"
                      className="pointer-events-none"
                    >
                      {mass.toFixed(1)}x
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Floating Config Panel */}
        {showConfig && (
          <div className="absolute right-12 top-1/2 -translate-y-1/2 w-72 bg-slate-800/90 backdrop-blur-md p-6 rounded-2xl shadow-2xl border border-slate-700 animate-in fade-in slide-in-from-right-4">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Settings2 className="w-5 h-5 text-blue-400" />
                Configure Balls
              </h3>
              <button 
                onClick={() => setShowConfig(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-6">
              {masses.map((mass, i) => (
                <div key={i} className={`p-3 rounded-xl transition-colors ${selectedBallIndex === i ? 'bg-blue-500/20 border border-blue-500/50' : 'bg-slate-900/50 border border-slate-700'}`}>
                  <div className="flex justify-between text-xs font-bold mb-2 text-slate-400 uppercase tracking-wider">
                    <span>Ball {i + 1}</span>
                    <span className={selectedBallIndex === i ? 'text-blue-400' : ''}>{mass.toFixed(1)}kg</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="5"
                    step="0.1"
                    value={mass}
                    onChange={(e) => updateMass(i, e.target.value)}
                    onFocus={() => setSelectedBallIndex(i)}
                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                </div>
              ))}
            </div>

            <button
              onClick={() => {
                setMasses(new Array(NUM_BALLS).fill(1));
                handleReset();
              }}
              className="w-full mt-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Reset All
            </button>
          </div>
        )}
      </div>

      {/* Footer Controls */}
      <div className="p-6 bg-slate-900 border-t border-slate-800 flex justify-between items-center">
        <div className="flex items-center gap-8">
          <div className="flex flex-col">
            <span className="text-xs uppercase tracking-wider text-slate-500 font-bold mb-1">Interaction</span>
            <span className="text-sm text-slate-300">Drag any ball to start the motion</span>
          </div>
          
          <div className="h-8 w-px bg-slate-800" />
          
          <div className="flex flex-col">
            <span className="text-xs uppercase tracking-wider text-slate-500 font-bold mb-1">Experiment</span>
            <span className="text-sm text-slate-300">Change weights to see how momentum transfers</span>
          </div>
        </div>

        <div className="flex gap-4">
          <button
            onClick={() => setShowConfig(!showConfig)}
            className={`px-6 py-2 rounded-xl font-bold transition-all flex items-center gap-2 ${showConfig ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25' : 'bg-slate-800 hover:bg-slate-700'}`}
          >
            <Settings2 className="w-4 h-4" />
            Config Weights
          </button>
          <button
            onClick={handleReset}
            className="px-6 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl font-bold transition-all flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Reset Position
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewtonsCradle;
