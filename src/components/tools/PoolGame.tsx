import React, { useEffect, useRef, useState, useCallback } from 'react';
import Matter from 'matter-js';
import { 
  Gamepad2, 
  RotateCcw,
  Activity,
  MousePointer2,
  BrainCircuit,
  Volume2,
  X,
  Target
} from 'lucide-react';
import { useHeader } from '../../contexts/HeaderContext';
import { useSettings } from '../../contexts/SettingsContext';
import { audioEngine } from '../../utils/audio';
import ToolPanel from '../shared/ToolPanel';
import { FormattedMessage } from 'react-intl';

// 1. Constants
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

// 2. Config (None)

// 3. Text (Help and Info)
const HELP_INFO = (
  <div className="space-y-4 font-['Outfit']">
    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Pool Physics Guide</h3>
    <div className="space-y-3">
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-emerald-50 flex items-center justify-center text-xs font-black text-emerald-600 shrink-0">1</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">Click and drag from the <b>Cue Ball</b> (white) to aim. The farther you pull, the more power.</p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center text-xs font-black text-indigo-600 shrink-0">2</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">Watch the <b>Prediction Lines</b> and <b>Degrees</b> to calculate your angles.</p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center text-xs font-black text-blue-600 shrink-0">3</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">Potted balls are removed from the table. If you pot the white ball, it resets.</p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-rose-50 flex items-center justify-center text-xs font-black text-rose-600 shrink-0">4</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">Physics engine calculates conservation of momentum and inelastic collisions.</p>
      </div>
    </div>
  </div>
);

// 4. Local Storage (None)

// 5. Classes (None)

// 6. Functions (None)

// 7. Component
export const PoolGame = () => {
  const { setOnReset, clearHeader, setHelpContent } = useHeader();
  const { settings } = useSettings();
  
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<Matter.Engine | null>(null);
  const requestRef = useRef<number>(0);
  
  const [balls, setBalls] = useState<any[]>([]);
  const [cueBall, setCueBall] = useState<any>(null);
  const [isAiming, setIsAiming] = useState(false);
  const [aimPoint, setAimPoint] = useState({ x: 0, y: 0 });
  const [power, setPower] = useState(0);
  const [prediction, setPrediction] = useState<any>(null);

  const initPhysics = useCallback(() => {
    if (engineRef.current) {
        Matter.Engine.clear(engineRef.current);
    }
    
    const engine = Matter.Engine.create();
    engine.gravity.y = 0; 
    engine.positionIterations = 10;
    engine.velocityIterations = 10;
    engineRef.current = engine;

    const world = engine.world;

    // Table boundaries (cushions)
    const cushions = [
      Matter.Bodies.rectangle(TABLE_WIDTH / 4, -CUSHION_WIDTH / 2, TABLE_WIDTH / 2 - 60, CUSHION_WIDTH, { isStatic: true, restitution: 0.8 }),
      Matter.Bodies.rectangle(TABLE_WIDTH * 3 / 4, -CUSHION_WIDTH / 2, TABLE_WIDTH / 2 - 60, CUSHION_WIDTH, { isStatic: true, restitution: 0.8 }),
      Matter.Bodies.rectangle(TABLE_WIDTH / 4, TABLE_HEIGHT + CUSHION_WIDTH / 2, TABLE_WIDTH / 2 - 60, CUSHION_WIDTH, { isStatic: true, restitution: 0.8 }),
      Matter.Bodies.rectangle(TABLE_WIDTH * 3 / 4, TABLE_HEIGHT + CUSHION_WIDTH / 2, TABLE_WIDTH / 2 - 60, CUSHION_WIDTH, { isStatic: true, restitution: 0.8 }),
      Matter.Bodies.rectangle(-CUSHION_WIDTH / 2, TABLE_HEIGHT / 2, CUSHION_WIDTH, TABLE_HEIGHT - 60, { isStatic: true, restitution: 0.8 }),
      Matter.Bodies.rectangle(TABLE_WIDTH + CUSHION_WIDTH / 2, TABLE_HEIGHT / 2, CUSHION_WIDTH, TABLE_HEIGHT - 60, { isStatic: true, restitution: 0.8 }),
    ];

    // Pockets
    const pockets = [
      { x: 0, y: 0 }, { x: TABLE_WIDTH / 2, y: 0 }, { x: TABLE_WIDTH, y: 0 },
      { x: 0, y: TABLE_HEIGHT }, { x: TABLE_WIDTH / 2, y: TABLE_HEIGHT }, { x: TABLE_WIDTH, y: TABLE_HEIGHT }
    ].map(p => Matter.Bodies.circle(p.x, p.y, POCKET_RADIUS, { isSensor: true, isStatic: true, label: 'pocket' }));

    // Create Balls
    const newBalls: Matter.Body[] = [];
    const cue = Matter.Bodies.circle(200, TABLE_HEIGHT / 2, BALL_RADIUS, {
      restitution: 0.9,
      friction: 0.01,
      frictionAir: 0.025,
      label: 'ball-0'
    });
    newBalls.push(cue);

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
          frictionAir: 0.025,
          label: `ball-${ballIdx}`
        });
        newBalls.push(ball);
        ballIdx++;
      }
    }

    Matter.World.add(world, [...cushions, ...pockets, ...newBalls]);

    Matter.Events.on(engine, 'collisionStart', (event) => {
      event.pairs.forEach(pair => {
        const { bodyA, bodyB } = pair;
        if (bodyA.label === 'pocket' && bodyB.label && bodyB.label.startsWith('ball-')) {
          handlePocketCollision(bodyB, engine);
        } else if (bodyB.label === 'pocket' && bodyA.label && bodyA.label.startsWith('ball-')) {
          handlePocketCollision(bodyA, engine);
        }
      });
    });

    const handlePocketCollision = (ball: any, engine: any) => {
      audioEngine.playSuccess(settings.soundTheme);
      if (ball.label === 'ball-0') {
        Matter.Body.setPosition(ball, { x: 200, y: TABLE_HEIGHT / 2 });
        Matter.Body.setVelocity(ball, { x: 0, y: 0 });
      } else {
        Matter.World.remove(engine.world, ball);
      }
    };

    if (requestRef.current) cancelAnimationFrame(requestRef.current);
    
    const update = (_time: number) => {
      Matter.Engine.update(engine, 1000 / 60);
      
      const currentBodies = Matter.Composite.allBodies(engine.world);
      const currentBalls = currentBodies
        .filter(b => b.label && b.label.startsWith('ball-'))
        .map(b => {
          if (
            b.position.x < -100 || b.position.x > TABLE_WIDTH + 100 ||
            b.position.y < -100 || b.position.y > TABLE_HEIGHT + 100
          ) {
            Matter.Body.setPosition(b, { x: TABLE_WIDTH / 2, y: TABLE_HEIGHT / 2 });
            Matter.Body.setVelocity(b, { x: 0, y: 0 });
          } else {
            const speed = Matter.Vector.magnitude(b.velocity);
            if (speed > 0 && speed < 0.15) {
              Matter.Body.setVelocity(b, { x: 0, y: 0 });
              Matter.Body.setAngularVelocity(b, 0);
            }
          }
          return {
            id: b.label,
            x: b.position.x,
            y: b.position.y,
            angle: b.angle,
            index: parseInt(b.label.split('-')[1])
          };
        });
      
      setBalls(currentBalls);
      const cue = currentBalls.find(b => b.id === 'ball-0');
      setCueBall(cue);

      requestRef.current = requestAnimationFrame(update);
    };

    requestRef.current = requestAnimationFrame(update);
  }, [settings.soundTheme]);

  useEffect(() => {
    initPhysics();
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      if (engineRef.current) Matter.Engine.clear(engineRef.current);
    };
  }, [initPhysics]);

  useEffect(() => {
    setOnReset(() => initPhysics);
    setHelpContent(HELP_INFO);
    return () => clearHeader();
  }, [clearHeader, setOnReset, initPhysics, setHelpContent]);

  const calculatePrediction = (cueBall: any, mousePos: any) => {
    if (!engineRef.current) return;
    const dx = cueBall.x - mousePos.x;
    const dy = cueBall.y - mousePos.y;
    const angle = Math.atan2(dy, dx);
    const start = { x: cueBall.x, y: cueBall.y };
    const direction = { x: Math.cos(angle), y: Math.sin(angle) };
    const bodies = Matter.Composite.allBodies(engineRef.current.world)
      .filter(b => b.label && b.label.startsWith('ball-') && b.label !== 'ball-0');
    
    let closestCollision: any = null;
    let minT = 2000;
    let hitBall: any = null;
    let hitNormal: any = null;

    bodies.forEach(ball => {
      const oc = { x: start.x - ball.position.x, y: start.y - ball.position.y };
      const a = direction.x * direction.x + direction.y * direction.y;
      const b = 2 * (oc.x * direction.x + oc.y * direction.y);
      const c = oc.x * oc.x + oc.y * oc.y - (BALL_RADIUS * 2) * (BALL_RADIUS * 2);
      const discriminant = b * b - 4 * a * c;
      if (discriminant > 0) {
        const t = (-b - Math.sqrt(discriminant)) / (2 * a);
        if (t > 0 && t < minT) {
          minT = t;
          closestCollision = { x: start.x + direction.x * t, y: start.y + direction.y * t };
          hitBall = ball;
        }
      }
    });

    const tableBounds = [
      { x1: 0, y1: 0, x2: TABLE_WIDTH, y2: 0, normal: { x: 0, y: 1 } },
      { x1: 0, y1: TABLE_HEIGHT, x2: TABLE_WIDTH, y2: TABLE_HEIGHT, normal: { x: 0, y: -1 } },
      { x1: 0, y1: 0, x2: 0, y2: TABLE_HEIGHT, normal: { x: 1, y: 0 } },
      { x1: TABLE_WIDTH, y1: 0, x2: TABLE_WIDTH, y2: TABLE_HEIGHT, normal: { x: -1, y: 0 } }
    ];

    tableBounds.forEach(bound => {
      let t = -1;
      if (bound.normal.x !== 0) {
        t = (bound.x1 - start.x) / direction.x;
      } else {
        t = (bound.y1 - start.y) / direction.y;
      }
      if (t > 0 && t < minT) {
        const hitX = start.x + direction.x * t;
        const hitY = start.y + direction.y * t;
        if (hitX >= 0 && hitX <= TABLE_WIDTH && hitY >= 0 && hitY <= TABLE_HEIGHT) {
           minT = t;
           closestCollision = { x: hitX, y: hitY };
           hitBall = null;
           hitNormal = bound.normal;
        }
      }
    });

    if (closestCollision) {
      if (hitBall) {
        const impactVector = { x: hitBall.position.x - closestCollision.x, y: hitBall.position.y - closestCollision.y };
        const dist = Math.sqrt(impactVector.x * impactVector.x + impactVector.y * impactVector.y);
        const impactUnit = { x: impactVector.x / dist, y: impactVector.y / dist };
        const targetAngle = Math.atan2(impactVector.y, impactVector.x);
        const cueDir = direction;
        const dot = cueDir.x * impactUnit.x + cueDir.y * impactUnit.y;
        const tangentDir = { x: cueDir.x - dot * impactUnit.x, y: cueDir.y - dot * impactUnit.y };
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
          targetPath: {
            x: hitBall.position.x,
            y: hitBall.position.y,
            dx: Math.cos(targetAngle) * 150,
            dy: Math.sin(targetAngle) * 150
          }
        });
      } else {
        const dot = direction.x * hitNormal.x + direction.y * hitNormal.y;
        const bounceDir = { x: direction.x - 2 * dot * hitNormal.x, y: direction.y - 2 * dot * hitNormal.y };
        setPrediction({
          type: 'cushion',
          impact: closestCollision,
          bouncePath: { x: closestCollision.x, y: closestCollision.y, dx: bounceDir.x * 100, dy: bounceDir.y * 100 }
        });
      }
    } else {
      setPrediction(null);
    }
  };

  const updateAim = (e: any) => {
    if (!containerRef.current || !cueBall) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (TABLE_WIDTH / rect.width);
    const y = (e.clientY - rect.top) * (TABLE_HEIGHT / rect.height);
    const dx = x - cueBall.x;
    const dy = y - cueBall.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    setAimPoint({ x, y });
    setPower(Math.min(dist / 2, 50));
    calculatePrediction(cueBall, { x, y });
  };

  const handleMouseDown = (e: any) => {
    if (!cueBall || !engineRef.current) return;
    const bodies = Matter.Composite.allBodies(engineRef.current.world);
    const moving = bodies.some(b => b.label && b.label.startsWith('ball-') && Matter.Vector.magnitude(b.velocity) > 0.1);
    if (moving) return;
    setIsAiming(true);
    updateAim(e);
  };

  const handleMouseMove = (e: any) => {
    if (isAiming) updateAim(e);
  };

  const handleMouseUp = () => {
    if (isAiming && cueBall && engineRef.current) {
      const dx = cueBall.x - aimPoint.x;
      const dy = cueBall.y - aimPoint.y;
      const angle = Math.atan2(dy, dx);
      const force = Math.min(power * 0.0015, 0.15);
      const bodies = Matter.Composite.allBodies(engineRef.current.world);
      const cueBody = bodies.find(b => b.label === 'ball-0');
      if (cueBody) {
        Matter.Body.applyForce(cueBody, cueBody.position, {
          x: Math.cos(angle) * force,
          y: Math.sin(angle) * force
        });
        audioEngine.playTick(settings.soundTheme);
      }
    }
    setIsAiming(false);
    setPrediction(null);
  };

  const renderCompassAngle = (cx: number, cy: number, targetDx: number, targetDy: number) => {
    const angleRad = Math.atan2(targetDy, targetDx);
    const compassRad = Math.atan2(targetDx, -targetDy);
    let compassDeg = Math.round(compassRad * 180 / Math.PI);
    if (compassDeg < 0) compassDeg += 360;
    const r = 25;
    const startX = cx;
    const startY = cy - r;
    const endX = cx + r * Math.cos(angleRad);
    const endY = cy + r * Math.sin(angleRad);
    const largeArcFlag = compassDeg > 180 ? 1 : 0;
    const bisectAngle = -Math.PI/2 + (compassRad / 2);
    return (
      <g>
        <line x1={cx} y1={cy} x2={cx} y2={cy - r} stroke="rgba(255,255,255,0.2)" strokeWidth="1" strokeDasharray="2,2" />
        <path d={`M ${startX} ${startY} A ${r} ${r} 0 ${largeArcFlag} 1 ${endX} ${endY}`} fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
        <text x={cx + (r + 15) * Math.cos(bisectAngle)} y={cy + (r + 15) * Math.sin(bisectAngle)} fill="white" fontSize="10" textAnchor="middle" alignmentBaseline="middle" fontWeight="bold" className="">
          {compassDeg}°
        </text>
      </g>
    );
  };

  return (
    <ToolPanel className="italic" baseWidth={1200} baseHeight={800}>
      <div className="w-full h-full flex flex-col items-center justify-center relative overflow-hidden group bg-[#1a1a1a] rounded-[3.5rem] border-[12px] border-[#3e2723]">
        <div className="tool-grid-bg opacity-30 pointer-events-none" />

        <div 
          ref={containerRef}
          className="relative overflow-visible z-10"
          style={{ 
            width: TABLE_WIDTH, 
            height: TABLE_HEIGHT,
            background: 'radial-gradient(ellipse at center, #1e824c 0%, #0a3d1c 100%)',
            boxShadow: 'inset 0 0 100px rgba(0,0,0,0.9)'
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <svg width={TABLE_WIDTH} height={TABLE_HEIGHT} className="absolute inset-0 overflow-visible pointer-events-none">
            <defs>
              <clipPath id="ballClip">
                <circle cx="0" cy="0" r={BALL_RADIUS} />
              </clipPath>
              <radialGradient id="ballVolume" cx="30%" cy="30%" r="70%">
                <stop offset="0%" stopColor="rgba(255,255,255,0.6)" />
                <stop offset="40%" stopColor="rgba(255,255,255,0)" />
                <stop offset="100%" stopColor="rgba(0,0,0,0.6)" />
              </radialGradient>
              <radialGradient id="pocketGrad">
                <stop offset="0%" stopColor="#050505" />
                <stop offset="80%" stopColor="#1a1a1a" />
                <stop offset="100%" stopColor="#2c2c2c" />
              </radialGradient>
              <linearGradient id="cushionTop" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#229954" />
                <stop offset="100%" stopColor="#145a32" />
              </linearGradient>
              <linearGradient id="cushionBottom" x1="0%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="#229954" />
                <stop offset="100%" stopColor="#145a32" />
              </linearGradient>
              <linearGradient id="cushionLeft" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#229954" />
                <stop offset="100%" stopColor="#145a32" />
              </linearGradient>
              <linearGradient id="cushionRight" x1="100%" y1="0%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="#229954" />
                <stop offset="100%" stopColor="#145a32" />
              </linearGradient>
            </defs>

            {/* Visual Cushions */}
            <g style={{ filter: '(0px 8px 12px rgba(0,0,0,0.8))' }}>
              <polygon points="30,-20 370,-20 360,0 40,0" fill="url(#cushionTop)" />
              <polygon points="430,-20 770,-20 760,0 440,0" fill="url(#cushionTop)" />
              <polygon points="30,420 370,420 360,400 40,400" fill="url(#cushionBottom)" />
              <polygon points="430,420 770,420 760,400 440,400" fill="url(#cushionBottom)" />
              <polygon points="-20,30 -20,370 0,360 0,40" fill="url(#cushionLeft)" />
              <polygon points="820,30 820,370 800,360 800,40" fill="url(#cushionRight)" />
            </g>

            {/* Pockets */}
            {[
              { x: 0, y: 0 }, { x: TABLE_WIDTH / 2, y: 0 }, { x: TABLE_WIDTH, y: 0 },
              { x: 0, y: TABLE_HEIGHT }, { x: TABLE_WIDTH / 2, y: TABLE_HEIGHT }, { x: TABLE_WIDTH, y: TABLE_HEIGHT }
            ].map((p, i) => (
              <g key={i}>
                <circle cx={p.x} cy={p.y} r={POCKET_RADIUS + 6} fill="#1a1110" />
                <circle cx={p.x} cy={p.y} r={POCKET_RADIUS} fill="url(#pocketGrad)" />
              </g>
            ))}

            {/* Prediction Schema */}
            {prediction && cueBall && (
              <g>
                <line x1={cueBall.x} y1={cueBall.y} x2={prediction.impact.x} y2={prediction.impact.y} stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeDasharray="6,6" />
                {prediction.type === 'ball' && (
                  <>
                    <circle cx={prediction.impact.x} cy={prediction.impact.y} r={BALL_RADIUS} fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
                    <line x1={prediction.impact.x} y1={prediction.impact.y} x2={prediction.impact.x + prediction.cuePath.dx} y2={prediction.impact.y + prediction.cuePath.dy} stroke="rgba(255,255,255,0.6)" strokeWidth="3" strokeLinecap="round" />
                    <line x1={prediction.targetPath.x} y1={prediction.targetPath.y} x2={prediction.targetPath.x + prediction.targetPath.dx} y2={prediction.targetPath.y + prediction.targetPath.dy} stroke="#f1c40f" strokeWidth="3" strokeLinecap="round" opacity="0.9" />
                    <circle cx={prediction.targetPath.x + prediction.targetPath.dx} cy={prediction.targetPath.y + prediction.targetPath.dy} r="4" fill="#f1c40f" />
                    {renderCompassAngle(prediction.targetPath.x, prediction.targetPath.y, prediction.targetPath.dx, prediction.targetPath.dy)}
                  </>
                )}
                {prediction.type === 'cushion' && (
                   <>
                     <circle cx={prediction.impact.x} cy={prediction.impact.y} r={BALL_RADIUS} fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
                     <line x1={prediction.impact.x} y1={prediction.impact.y} x2={prediction.impact.x + prediction.bouncePath.dx} y2={prediction.impact.y + prediction.bouncePath.dy} stroke="#3498db" strokeWidth="3" strokeLinecap="round" strokeDasharray="8,6" opacity="0.9" />
                     <circle cx={prediction.impact.x + prediction.bouncePath.dx} cy={prediction.impact.y + prediction.bouncePath.dy} r="4" fill="#3498db" />
                     {renderCompassAngle(prediction.impact.x, prediction.impact.y, prediction.bouncePath.dx, prediction.bouncePath.dy)}
                   </>
                )}
              </g>
            )}

            {/* Tactical Cue Alignment */}
            {isAiming && cueBall && (
              <g>
                {(() => {
                  const angleRad = Math.atan2(cueBall.y - aimPoint.y, cueBall.x - aimPoint.x);
                  let angleDeg = Math.round(angleRad * 180 / Math.PI);
                  if (angleDeg < 0) angleDeg += 360;
                  const r = 45;
                  const endX = cueBall.x + r * Math.cos(angleRad);
                  const endY = cueBall.y + r * Math.sin(angleRad);
                  const largeArcFlag = angleDeg > 180 ? 1 : 0;
                  return (
                    <g>
                      <line x1={cueBall.x} y1={cueBall.y} x2={cueBall.x + r} y2={cueBall.y} stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
                      <path d={`M ${cueBall.x + r} ${cueBall.y} A ${r} ${r} 0 ${largeArcFlag} 1 ${endX} ${endY}`} fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2.5" />
                      <text x={cueBall.x + (r + 20) * Math.cos(angleRad / 2)} y={cueBall.y + (r + 20) * Math.sin(angleRad / 2)} fill="white" fontSize="14" textAnchor="middle" alignmentBaseline="middle" fontWeight="black" className=" italic">
                        {angleDeg}°
                      </text>
                    </g>
                  );
                })()}
                <g transform={`rotate(${Math.atan2(cueBall.y - aimPoint.y, cueBall.x - aimPoint.x) * 180 / Math.PI}, ${cueBall.x}, ${cueBall.y})`}>
                  <rect x={cueBall.x - BALL_RADIUS - 300 - (power * 2)} y={cueBall.y - 5} width="300" height="10" fill="url(#cueGradient)" rx="2" className="" />
                  <defs>
                    <linearGradient id="cueGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#2a1a17" />
                      <stop offset="80%" stopColor="#d2b48c" />
                      <stop offset="100%" stopColor="#fff" />
                    </linearGradient>
                  </defs>
                </g>
              </g>
            )}

            {/* Matter.js Body Mapping */}
            {balls.map((ball) => (
              <g key={ball.id} transform={`translate(${ball.x}, ${ball.y})`}>
                <circle cx="3" cy="3" r={BALL_RADIUS} fill="rgba(0,0,0,0.5)" />
                <g transform={`rotate(${ball.angle * 180 / Math.PI})`} clipPath="url(#ballClip)">
                  <circle r={BALL_RADIUS} fill={COLORS[ball.index]} />
                  {ball.index >= 9 && <rect x={-BALL_RADIUS} y={-BALL_RADIUS * 0.4} width={BALL_RADIUS * 2} height={BALL_RADIUS * 0.8} fill="#fff" />}
                  {ball.index > 0 && <circle r={BALL_RADIUS * 0.55} fill="#fff" />}
                  {ball.index > 0 && (
                    <text y="3.5" textAnchor="middle" fontSize="10" fill="#000" fontWeight="black" style={{ pointerEvents: 'none', userSelect: 'none', fontFamily: 'Outfit' }}>
                      {ball.index}
                    </text>
                  )}
                </g>
                <circle r={BALL_RADIUS} fill="url(#ballVolume)" pointerEvents="none" />
                <circle r={BALL_RADIUS} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" pointerEvents="none" />
              </g>
            ))}
          </svg>
        </div>

        {/* Operational Interface Control */}
        <div className="absolute bottom-12 right-12 flex items-center gap-6 z-20 bg-white/5 border-2 border-white/10 p-8 rounded-[3rem] backdrop-blur-md pointer-events-none">
           <div className="text-right">
              <p className="text-[10px] font-black text-white uppercase tracking-widest leading-none">Impulse Module</p>
              <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mt-2 leading-none">Drag Cue Ball</p>
           </div>
           <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-white border border-white/20">
              <MousePointer2 size={24} strokeWidth={3} />
           </div>
        </div>
      </div>
    </ToolPanel>
  );
};

export default PoolGame;
