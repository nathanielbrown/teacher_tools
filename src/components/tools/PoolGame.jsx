import React, { useEffect, useRef, useState, useMemo } from 'react';
import Matter from 'matter-js';
import { Gamepad2 } from 'lucide-react';
import { ToolHeader } from '../ToolHeader';

const TABLE_WIDTH = 800;
const TABLE_HEIGHT = 400;
const BALL_RADIUS = 12;
const POCKET_RADIUS = 25;
const CUSHION_WIDTH = 20;

const COLORS = [
  '#ffffff', // Cue ball
  '#f1c40f', // 1 - Yellow
  '#2980b9', // 2 - Blue
  '#e74c3c', // 3 - Red
  '#8e44ad', // 4 - Purple
  '#f39c12', // 5 - Orange
  '#27ae60', // 6 - Green
  '#c0392b', // 7 - Maroon
  '#2c3e50', // 8 - Black
  '#f1c40f', // 9 - Yellow Stripe
  '#2980b9', // 10 - Blue Stripe
  '#e74c3c', // 11 - Red Stripe
  '#8e44ad', // 12 - Purple Stripe
  '#f39c12', // 13 - Orange Stripe
  '#27ae60', // 14 - Green Stripe
  '#c0392b', // 15 - Maroon Stripe
];

const PoolGame = () => {
  const containerRef = useRef(null);
  const engineRef = useRef(null);
  const requestRef = useRef(null);
  const [balls, setBalls] = useState([]);
  const [cueBall, setCueBall] = useState(null);
  const [isAiming, setIsAiming] = useState(false);
  const [aimPoint, setAimPoint] = useState({ x: 0, y: 0 });
  const [power, setPower] = useState(0);
  const [prediction, setPrediction] = useState(null);

  // Matter.js setup
  useEffect(() => {
    const engine = Matter.Engine.create();
    engine.gravity.y = 0; // Top-down view
    engineRef.current = engine;

    const world = engine.world;

    // Table boundaries (cushions)
    const cushions = [
      Matter.Bodies.rectangle(TABLE_WIDTH / 2, -CUSHION_WIDTH / 2, TABLE_WIDTH, CUSHION_WIDTH, { isStatic: true, restitution: 0.8 }),
      Matter.Bodies.rectangle(TABLE_WIDTH / 2, TABLE_HEIGHT + CUSHION_WIDTH / 2, TABLE_WIDTH, CUSHION_WIDTH, { isStatic: true, restitution: 0.8 }),
      Matter.Bodies.rectangle(-CUSHION_WIDTH / 2, TABLE_HEIGHT / 2, CUSHION_WIDTH, TABLE_HEIGHT, { isStatic: true, restitution: 0.8 }),
      Matter.Bodies.rectangle(TABLE_WIDTH + CUSHION_WIDTH / 2, TABLE_HEIGHT / 2, CUSHION_WIDTH, TABLE_HEIGHT, { isStatic: true, restitution: 0.8 }),
    ];

    // Pockets
    const pockets = [
      { x: 0, y: 0 }, { x: TABLE_WIDTH / 2, y: 0 }, { x: TABLE_WIDTH, y: 0 },
      { x: 0, y: TABLE_HEIGHT }, { x: TABLE_WIDTH / 2, y: TABLE_HEIGHT }, { x: TABLE_WIDTH, y: TABLE_HEIGHT }
    ].map(p => Matter.Bodies.circle(p.x, p.y, POCKET_RADIUS, { isSensor: true, isStatic: true, label: 'pocket' }));

    // Create Balls
    const newBalls = [];
    
    // Cue Ball
    const cue = Matter.Bodies.circle(200, TABLE_HEIGHT / 2, BALL_RADIUS, {
      restitution: 0.9,
      friction: 0.01,
      frictionAir: 0.02,
      label: 'ball-0'
    });
    newBalls.push(cue);

    // Racked Balls
    const startX = 600;
    const startY = TABLE_HEIGHT / 2;
    let ballIdx = 1;
    for (let col = 0; col < 5; col++) {
      for (let row = 0; row <= col; row++) {
        const x = startX + col * (BALL_RADIUS * 2 * 0.866);
        const y = startY + (row - col / 2) * (BALL_RADIUS * 2);
        const ball = Matter.Bodies.circle(x, y, BALL_RADIUS, {
          restitution: 0.9,
          friction: 0.01,
          frictionAir: 0.02,
          label: `ball-${ballIdx}`
        });
        newBalls.push(ball);
        ballIdx++;
      }
    }

    Matter.World.add(world, [...cushions, ...pockets, ...newBalls]);

    // Collision handling for pockets
    Matter.Events.on(engine, 'collisionStart', (event) => {
      event.pairs.forEach(pair => {
        const { bodyA, bodyB } = pair;
        if (bodyA.label === 'pocket' && bodyB.label.startsWith('ball-')) {
          handlePocketCollision(bodyB);
        } else if (bodyB.label === 'pocket' && bodyA.label.startsWith('ball-')) {
          handlePocketCollision(bodyA);
        }
      });
    });

    const handlePocketCollision = (ball) => {
      if (ball.label === 'ball-0') {
        // Scratch - reset cue ball
        Matter.Body.setPosition(ball, { x: 200, y: TABLE_HEIGHT / 2 });
        Matter.Body.setVelocity(ball, { x: 0, y: 0 });
      } else {
        Matter.World.remove(world, ball);
      }
    };

    const update = () => {
      Matter.Engine.update(engine, 1000 / 60);
      
      const currentBalls = Matter.Composite.allBodies(world)
        .filter(b => b.label.startsWith('ball-'))
        .map(b => ({
          id: b.label,
          x: b.position.x,
          y: b.position.y,
          angle: b.angle,
          index: parseInt(b.label.split('-')[1])
        }));
      
      setBalls(currentBalls);
      const cue = currentBalls.find(b => b.id === 'ball-0');
      setCueBall(cue);

      requestRef.current = requestAnimationFrame(update);
    };

    requestRef.current = requestAnimationFrame(update);

    return () => {
      cancelAnimationFrame(requestRef.current);
      Matter.Engine.clear(engine);
    };
  }, []);

  const handleMouseDown = (e) => {
    if (!cueBall) return;
    
    // Only allow shooting when balls are nearly stopped
    const bodies = Matter.Composite.allBodies(engineRef.current.world);
    const moving = bodies.some(b => b.label.startsWith('ball-') && Matter.Vector.magnitude(b.velocity) > 0.1);
    if (moving) return;

    setIsAiming(true);
    updateAim(e);
  };

  const updateAim = (e) => {
    if (!containerRef.current || !cueBall) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (TABLE_WIDTH / rect.width);
    const y = (e.clientY - rect.top) * (TABLE_HEIGHT / rect.height);
    
    const dx = x - cueBall.x;
    const dy = y - cueBall.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    setAimPoint({ x, y });
    setPower(Math.min(dist / 2, 50));

    // Calculate prediction
    calculatePrediction(cueBall, { x, y });
  };

  const handleMouseMove = (e) => {
    if (isAiming) {
      updateAim(e);
    }
  };

  const handleMouseUp = () => {
    if (isAiming && cueBall) {
      const dx = cueBall.x - aimPoint.x;
      const dy = cueBall.y - aimPoint.y;
      const angle = Math.atan2(dy, dx);
      const force = Math.min(power * 0.005, 0.5);

      const bodies = Matter.Composite.allBodies(engineRef.current.world);
      const cueBody = bodies.find(b => b.label === 'ball-0');
      
      if (cueBody) {
        Matter.Body.applyForce(cueBody, cueBody.position, {
          x: Math.cos(angle) * force,
          y: Math.sin(angle) * force
        });
      }
    }
    setIsAiming(false);
    setPrediction(null);
  };

  const calculatePrediction = (cueBall, mousePos) => {
    const dx = cueBall.x - mousePos.x;
    const dy = cueBall.y - mousePos.y;
    const angle = Math.atan2(dy, dx);
    
    const start = { x: cueBall.x, y: cueBall.y };
    const direction = { x: Math.cos(angle), y: Math.sin(angle) };
    
    // Find first collision
    const bodies = Matter.Composite.allBodies(engineRef.current.world)
      .filter(b => b.label.startsWith('ball-') && b.label !== 'ball-0');
    
    let closestCollision = null;
    let minT = 2000; // Max distance
    let hitBall = null;

    bodies.forEach(ball => {
      // Ray-circle intersection
      const oc = { x: start.x - ball.position.x, y: start.y - ball.position.y };
      const a = direction.x * direction.x + direction.y * direction.y;
      const b = 2 * (oc.x * direction.x + oc.y * direction.y);
      const c = oc.x * oc.x + oc.y * oc.y - (BALL_RADIUS * 2) * (BALL_RADIUS * 2);
      const discriminant = b * b - 4 * a * c;

      if (discriminant > 0) {
        const t = (-b - Math.sqrt(discriminant)) / (2 * a);
        if (t > 0 && t < minT) {
          minT = t;
          closestCollision = {
            x: start.x + direction.x * t,
            y: start.y + direction.y * t
          };
          hitBall = ball;
        }
      }
    });

    // Check cushions
    const tableBounds = [
      { x1: 0, y1: 0, x2: TABLE_WIDTH, y2: 0, normal: { x: 0, y: 1 } },
      { x1: 0, y1: TABLE_HEIGHT, x2: TABLE_WIDTH, y2: TABLE_HEIGHT, normal: { x: 0, y: -1 } },
      { x1: 0, y1: 0, x2: 0, y2: TABLE_HEIGHT, normal: { x: 1, y: 0 } },
      { x1: TABLE_WIDTH, y1: 0, x2: TABLE_WIDTH, y2: TABLE_HEIGHT, normal: { x: -1, y: 0 } }
    ];

    tableBounds.forEach(bound => {
      // Ray-line intersection (simplified for axis-aligned)
      let t = -1;
      if (bound.normal.x !== 0) { // Vertical cushion
        t = (bound.x1 - start.x) / direction.x;
      } else { // Horizontal cushion
        t = (bound.y1 - start.y) / direction.y;
      }

      if (t > 0 && t < minT) {
        const hitX = start.x + direction.x * t;
        const hitY = start.y + direction.y * t;
        // Verify it's within table bounds
        if (hitX >= 0 && hitX <= TABLE_WIDTH && hitY >= 0 && hitY <= TABLE_HEIGHT) {
           minT = t;
           closestCollision = { x: hitX, y: hitY };
           hitBall = null;
        }
      }
    });

    if (closestCollision) {
      let ballPath = null;
      if (hitBall) {
        // Impact vector: from hit ball center to collision point
        const impactVector = {
          x: hitBall.position.x - closestCollision.x,
          y: hitBall.position.y - closestCollision.y
        };
        const dist = Math.sqrt(impactVector.x * impactVector.x + impactVector.y * impactVector.y);
        const impactUnit = { x: impactVector.x / dist, y: impactVector.y / dist };
        
        // Target ball goes exactly along the line of centers
        const targetAngle = Math.atan2(impactVector.y, impactVector.x);
        ballPath = {
          x: hitBall.position.x,
          y: hitBall.position.y,
          dx: Math.cos(targetAngle) * 150,
          dy: Math.sin(targetAngle) * 150
        };

        // Cue ball goes at 90 degrees to target path (tangent line)
        // We find the component of the cue ball's incoming direction that is perpendicular to the impact vector
        const cueDir = direction;
        const dot = cueDir.x * impactUnit.x + cueDir.y * impactUnit.y;
        const tangentDir = {
          x: cueDir.x - dot * impactUnit.x,
          y: cueDir.y - dot * impactUnit.y
        };
        const tangentDist = Math.sqrt(tangentDir.x * tangentDir.x + tangentDir.y * tangentDir.y);
        
        setPrediction({
          type: 'ball',
          impact: closestCollision,
          cuePath: { 
            x: closestCollision.x, 
            y: closestCollision.y, 
            dx: (tangentDir.x / (tangentDist || 1)) * 100, 
            dy: (tangentDir.y / (tangentDist || 1)) * 100 
          },
          targetPath: ballPath
        });
      } else {
        setPrediction({
          type: 'cushion',
          impact: closestCollision
        });
      }
    } else {
      setPrediction(null);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#1a1a1a] text-white">
      <ToolHeader
        title="Physics Pool"
        icon={Gamepad2}
        color="#27ae60"
      />
      
      <div className="flex-1 flex items-center justify-center p-8 overflow-hidden select-none">
        <div 
          ref={containerRef}
          className="relative bg-[#0a3d1c] rounded-xl shadow-2xl border-[12px] border-[#3e2723] overflow-visible"
          style={{ width: TABLE_WIDTH, height: TABLE_HEIGHT }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Table Surface Felt Texture */}
          <div className="absolute inset-0 opacity-10 pointer-events-none" 
               style={{ backgroundImage: 'radial-gradient(circle, #2ecc71 1px, transparent 1px)', backgroundSize: '8px 8px' }} />

          <svg width={TABLE_WIDTH} height={TABLE_HEIGHT} className="absolute inset-0 overflow-visible pointer-events-none">
            <defs>
              <radialGradient id="ballShadow">
                <stop offset="0%" stopColor="rgba(0,0,0,0.4)" />
                <stop offset="100%" stopColor="rgba(0,0,0,0)" />
              </radialGradient>
              <radialGradient id="cueHighlight">
                <stop offset="0%" stopColor="rgba(255,255,255,0.4)" />
                <stop offset="100%" stopColor="rgba(255,255,255,0)" />
              </radialGradient>
            </defs>

            {/* Pockets */}
            {[
              { x: 0, y: 0 }, { x: TABLE_WIDTH / 2, y: 0 }, { x: TABLE_WIDTH, y: 0 },
              { x: 0, y: TABLE_HEIGHT }, { x: TABLE_WIDTH / 2, y: TABLE_HEIGHT }, { x: TABLE_WIDTH, y: TABLE_HEIGHT }
            ].map((p, i) => (
              <circle key={i} cx={p.x} cy={p.y} r={POCKET_RADIUS} fill="#111" stroke="#222" strokeWidth="2" />
            ))}

            {/* Prediction Lines */}
            {prediction && cueBall && (
              <g>
                {/* Aim Line (Cue to Impact) */}
                <line 
                  x1={cueBall.x} y1={cueBall.y} 
                  x2={prediction.impact.x} y2={prediction.impact.y} 
                  stroke="rgba(255,255,255,0.2)" strokeWidth="1" strokeDasharray="4,4" 
                />
                
                {prediction.type === 'ball' && (
                  <>
                    {/* Ghost Cue Ball at impact */}
                    <circle cx={prediction.impact.x} cy={prediction.impact.y} r={BALL_RADIUS} fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
                    
                    {/* Cue ball trajectory after impact */}
                    <line 
                      x1={prediction.impact.x} y1={prediction.impact.y} 
                      x2={prediction.impact.x + prediction.cuePath.dx} y2={prediction.impact.y + prediction.cuePath.dy} 
                      stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round"
                    />
                    
                    {/* Target ball trajectory */}
                    <line 
                      x1={prediction.targetPath.x} y1={prediction.targetPath.y} 
                      x2={prediction.targetPath.x + prediction.targetPath.dx} y2={prediction.targetPath.y + prediction.targetPath.dy} 
                      stroke="#f1c40f" strokeWidth="2" strokeLinecap="round" opacity="0.8"
                    />
                    
                    {/* Arrow head for target */}
                    <circle cx={prediction.targetPath.x + prediction.targetPath.dx} cy={prediction.targetPath.y + prediction.targetPath.dy} r="3" fill="#f1c40f" />
                  </>
                )}
                
                {prediction.type === 'cushion' && (
                   <circle cx={prediction.impact.x} cy={prediction.impact.y} r={BALL_RADIUS} fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
                )}
              </g>
            )}

            {/* Cue */}
            {isAiming && cueBall && (
              <g transform={`rotate(${Math.atan2(cueBall.y - aimPoint.y, cueBall.x - aimPoint.x) * 180 / Math.PI}, ${cueBall.x}, ${cueBall.y})`}>
                {/* Cue Stick */}
                <rect 
                  x={cueBall.x - BALL_RADIUS - 300 - (power * 2)} 
                  y={cueBall.y - 4} 
                  width="300" height="8" 
                  fill="url(#cueGradient)" 
                  rx="2"
                  className="drop-shadow-lg"
                />
                <defs>
                  <linearGradient id="cueGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#3e2723" />
                    <stop offset="80%" stopColor="#d2b48c" />
                    <stop offset="100%" stopColor="#fff" />
                  </linearGradient>
                </defs>
              </g>
            )}

            {/* Balls */}
            {balls.map((ball) => (
              <g key={ball.id} transform={`translate(${ball.x}, ${ball.y}) rotate(${ball.angle * 180 / Math.PI})`}>
                {/* Ball Shadow */}
                <circle cx="2" cy="2" r={BALL_RADIUS} fill="rgba(0,0,0,0.3)" />
                
                {/* Main Ball Body */}
                <circle r={BALL_RADIUS} fill={COLORS[ball.index]} stroke="rgba(0,0,0,0.1)" strokeWidth="1" />
                
                {/* Gloss Highlight */}
                <circle cx={-BALL_RADIUS * 0.3} cy={-BALL_RADIUS * 0.3} r={BALL_RADIUS * 0.4} fill="rgba(255,255,255,0.2)" />

                {/* Stripes and Numbers */}
                {ball.index > 0 && ball.index < 9 && (
                  <circle r={BALL_RADIUS * 0.5} fill="#fff" />
                )}
                {ball.index >= 9 && (
                  <rect x={-BALL_RADIUS} y={-BALL_RADIUS * 0.4} width={BALL_RADIUS * 2} height={BALL_RADIUS * 0.8} fill="#fff" />
                )}
                {ball.index > 0 && (
                  <text 
                    y="3" 
                    textAnchor="middle" 
                    fontSize="9" 
                    fill="#000" 
                    fontWeight="black"
                    style={{ pointerEvents: 'none', userSelect: 'none', fontFamily: 'Arial' }}
                  >
                    {ball.index}
                  </text>
                )}
              </g>
            ))}
          </svg>
        </div>
      </div>

      {/* Controls Overlay */}
      <div className="p-6 bg-[#2c3e50] border-t border-white/10 flex justify-between items-center shadow-inner">
        <div className="flex gap-8 items-center">
          <div className="flex flex-col">
            <span className="text-xs uppercase tracking-wider text-gray-400 font-bold mb-1">Power</span>
            <div className="w-48 h-3 bg-gray-800 rounded-full overflow-hidden border border-white/5">
              <div 
                className="h-full transition-all duration-75" 
                style={{ 
                  width: `${(power / 50) * 100}%`,
                  background: `linear-gradient(90deg, #2ecc71, #f1c40f, #e74c3c)`
                }} 
              />
            </div>
          </div>
          
          <div className="bg-white/5 rounded-lg px-4 py-2 border border-white/10">
            <span className="text-xs text-gray-400 block">Status</span>
            <span className="text-sm font-medium">
              {balls.length === 1 ? 'Table Cleared!' : `${balls.length - 1} Balls Remaining`}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right">
            <div className="text-xs text-gray-400 italic">Drag back from cue ball to aim</div>
            <div className="text-xs text-gray-400 italic">Release to shoot</div>
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-[#e74c3c] hover:bg-[#c0392b] text-white rounded-lg text-sm font-bold transition-all hover:scale-105 active:scale-95 shadow-lg"
          >
            Reset Table
          </button>
        </div>
      </div>
    </div>
  );
};

export default PoolGame;
