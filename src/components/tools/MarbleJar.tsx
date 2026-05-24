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
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { ToolPanel } from '../shared/ToolPanel';
import { SettingsPanel } from '../shared/SettingsPanel';
import { FormattedMessage } from 'react-intl';

// 1. Constants
const MARBLE_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#ef4444', '#06b6d4'];
const getMarbleRadius = (isMobile: boolean) => isMobile ? 12 : 20;
const DEBUG_PHYSICS = false;
const PANEL_WIDTH = 1200;
const PANEL_HEIGHT = 800;

const getJarStyles = (isMobile: boolean) => [
  { id: 'jar-small', nameId: 'marblejar.settings.style.jar-small', width: isMobile ? 100 : 190, height: isMobile ? 150 : 260, wallAngle: 0 },
  { id: 'jar-big', nameId: 'marblejar.settings.style.jar-big', width: isMobile ? 140 : 270, height: isMobile ? 180 : 320, wallAngle: 0 },
  { id: 'basin', nameId: 'marblejar.settings.style.basin', width: isMobile ? 260 : 650, height: isMobile ? 60 : 100, wallAngle: Math.PI / 10 },
];

// 3. Text (Help and Info)
const getHelpInfo = () => (
  <div className="space-y-4 font-['Outfit']">
    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight italic">
      <FormattedMessage id="marblejar.help.title" defaultMessage="How to Use the Marble Jar" />
    </h3>
    <div className="space-y-3 italic">
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-primary/5 flex items-center justify-center text-xs font-black text-primary shrink-0">1</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">
          <FormattedMessage
            id="marblejar.help.step1"
            defaultMessage="Click anywhere to <b>drop a marble</b>."
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

  const [marbleCount, setMarbleCount] = useLocalStorage<number>('marble_jar_count', 0);
  const [target, setTarget] = useLocalStorage<number>('marble_jar_target', 10);
  const [jarStyleId, setJarStyleId] = useLocalStorage<string>('marble_jar_style', 'jar-big');

  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 1024 : false);
  const currentPanelWidth = isMobile ? 400 : 1200;
  const currentPanelHeight = 800;

  const currentJarStyle = getJarStyles(isMobile).find(s => s.id === jarStyleId) || getJarStyles(isMobile)[1];
  const { width: JAR_WIDTH, height: JAR_HEIGHT } = currentJarStyle;

  const [isRewarding, setIsRewarding] = useState(false);
  const [hoverX, setHoverX] = useState<number | null>(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const engineRef = useRef<Matter.Engine | null>(null);
  const runnerRef = useRef<Matter.Runner | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
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

  const addMarble = useCallback((xPos = currentPanelWidth / 2) => {
    if (isRewarding) return;
    audioEngine.playTick(settings.soundTheme);

    const engine = engineRef.current;
    if (engine) {
      const color = MARBLE_COLORS[marbleCount % MARBLE_COLORS.length];
      const newMarble = Matter.Bodies.circle(
        xPos + (Math.random() * 10 - 5),
        -50,
        getMarbleRadius(isMobile),
        {
          restitution: 0.7,
          friction: 0.02,
          density: 0.05,
          render: { fillStyle: color } as any
        }
      );
      Matter.World.add(engine.world, newMarble);
      marbleBodiesRef.current.push(newMarble);
      setMarbleCount(prev => prev + 1);
    }
  }, [isRewarding, marbleCount, settings.soundTheme, currentPanelWidth, isMobile, setMarbleCount]);

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
  }, [isRewarding, marbleCount, addMarble, settings.soundTheme, setMarbleCount]);

  const resetJar = useCallback(() => {
    setMarbleCount(0);
    setIsRewarding(false);
    setIsConfigOpen(false);
    audioEngine.playTick(settings.soundTheme);

    const engine = engineRef.current;
    if (engine) {
      Matter.World.clear(engine.world, false);
      marbleBodiesRef.current = [];

      const wallOptions = { isStatic: true, friction: 0.1, restitution: 0.5 };
      const wallThickness = 40;

      const currentStyle = getJarStyles(isMobile).find(s => s.id === jarStyleId) || getJarStyles(isMobile)[0];
      const wallAngle = currentStyle.wallAngle || 0;

      const centerX = currentPanelWidth / 2;
      const centerY = currentPanelHeight / 2;
      const jarBottom = centerY + JAR_HEIGHT / 2;
      const jarTop = centerY - JAR_HEIGHT / 2;

      // Bottom
      const ground = Matter.Bodies.rectangle(centerX, jarBottom + wallThickness / 2 - 10, JAR_WIDTH, wallThickness, wallOptions);

      const jarTopHalfWidth = (JAR_WIDTH / 2) + (JAR_HEIGHT * Math.tan(wallAngle));
      const jarBottomHalfWidth = JAR_WIDTH / 2;

      const isJar = wallAngle === 0;

      // Triangular Left Wall
      const leftVerts = isJar 
        ? [
            { x: centerX - JAR_WIDTH / 2, y: jarTop },
            { x: centerX - JAR_WIDTH / 2, y: jarBottom },
            { x: centerX - JAR_WIDTH / 2 + wallThickness, y: jarBottom }
          ]
        : [
            { x: centerX - jarTopHalfWidth, y: jarTop },
            { x: centerX - jarBottomHalfWidth, y: jarBottom },
            { x: centerX - jarBottomHalfWidth - wallThickness, y: jarBottom }
          ];
      const leftWall = Matter.Bodies.fromVertices(
        (leftVerts[0].x + leftVerts[1].x + leftVerts[2].x) / 3,
        (leftVerts[0].y + leftVerts[1].y + leftVerts[2].y) / 3,
        [leftVerts],
        wallOptions
      );

      // Triangular Right Wall
      const rightVerts = isJar
        ? [
            { x: centerX + JAR_WIDTH / 2, y: jarTop },
            { x: centerX + JAR_WIDTH / 2, y: jarBottom },
            { x: centerX + JAR_WIDTH / 2 - wallThickness, y: jarBottom }
          ]
        : [
            { x: centerX + jarTopHalfWidth, y: jarTop },
            { x: centerX + jarBottomHalfWidth, y: jarBottom },
            { x: centerX + jarBottomHalfWidth + wallThickness, y: jarBottom }
          ];
      const rightWall = Matter.Bodies.fromVertices(
        (rightVerts[0].x + rightVerts[1].x + rightVerts[2].x) / 3,
        (rightVerts[0].y + rightVerts[1].y + rightVerts[2].y) / 3,
        [rightVerts],
        wallOptions
      );

      Matter.World.add(engine.world, [ground, leftWall, rightWall]);
    }
  }, [settings.soundTheme, JAR_WIDTH, JAR_HEIGHT, setIsConfigOpen, jarStyleId, currentPanelWidth, isMobile, setMarbleCount]);

  useEffect(() => {
    const engine = Matter.Engine.create();
    engineRef.current = engine;

    const wallOptions = { isStatic: true, friction: 0.1, restitution: 0.5 };
    const wallThickness = 40;

    const currentStyle = getJarStyles(isMobile).find(s => s.id === jarStyleId) || getJarStyles(isMobile)[0];
    const wallAngle = currentStyle.wallAngle || 0;

    const centerX = currentPanelWidth / 2;
    const centerY = currentPanelHeight / 2;
    const jarBottom = centerY + JAR_HEIGHT / 2;

    const ground = Matter.Bodies.rectangle(centerX, jarBottom + wallThickness / 2 - 10, JAR_WIDTH, wallThickness, wallOptions);

    const jarTopHalfWidth = (JAR_WIDTH / 2) + (JAR_HEIGHT * Math.tan(wallAngle));
    const jarBottomHalfWidth = JAR_WIDTH / 2;
    const jarTop = centerY - JAR_HEIGHT / 2;

    const isJar = wallAngle === 0;

    // Triangular Left Wall
    const leftVerts = isJar
      ? [
          { x: centerX - JAR_WIDTH / 2, y: jarTop },
          { x: centerX - JAR_WIDTH / 2, y: jarBottom },
          { x: centerX - JAR_WIDTH / 2 + wallThickness, y: jarBottom }
        ]
      : [
          { x: centerX - jarTopHalfWidth, y: jarTop },
          { x: centerX - jarBottomHalfWidth, y: jarBottom },
          { x: centerX - jarBottomHalfWidth - wallThickness, y: jarBottom }
        ];
    const leftWall = Matter.Bodies.fromVertices(
      (leftVerts[0].x + leftVerts[1].x + leftVerts[2].x) / 3,
      (leftVerts[0].y + leftVerts[1].y + leftVerts[2].y) / 3,
      [leftVerts],
      wallOptions
    );

    // Triangular Right Wall
    const rightVerts = isJar
      ? [
          { x: centerX + JAR_WIDTH / 2, y: jarTop },
          { x: centerX + JAR_WIDTH / 2, y: jarBottom },
          { x: centerX + JAR_WIDTH / 2 - wallThickness, y: jarBottom }
        ]
      : [
          { x: centerX + jarTopHalfWidth, y: jarTop },
          { x: centerX + jarBottomHalfWidth, y: jarBottom },
          { x: centerX + jarBottomHalfWidth + wallThickness, y: jarBottom }
        ];
    const rightWall = Matter.Bodies.fromVertices(
      (rightVerts[0].x + rightVerts[1].x + rightVerts[2].x) / 3,
      (rightVerts[0].y + rightVerts[1].y + rightVerts[2].y) / 3,
      [rightVerts],
      wallOptions
    );

    Matter.World.add(engine.world, [ground, leftWall, rightWall]);

    const runner = Matter.Runner.create();
    Matter.Runner.run(runner, engine);
    runnerRef.current = runner;

    let render: Matter.Render | null = null;
    if (DEBUG_PHYSICS) {
      render = Matter.Render.create({
        element: panelRef.current!,
        engine: engine,
        options: {
          width: currentPanelWidth,
          height: currentPanelHeight,
          wireframes: true,
          background: 'transparent'
        }
      });
      Matter.Render.run(render);
      (render.canvas as HTMLCanvasElement).className = "absolute inset-0 z-50 pointer-events-none opacity-50";
    }

    let animationFrameId: number;
    const renderLoop = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0, 0, currentPanelWidth, currentPanelHeight);

      // Destroy marbles that fall out
      const toRemove: Matter.Body[] = [];
      marbleBodiesRef.current.forEach(body => {
        if (body.position.y > currentPanelHeight + getMarbleRadius(isMobile) * 2) {
          toRemove.push(body);
        }
      });

      if (toRemove.length > 0) {
        toRemove.forEach(body => {
          Matter.World.remove(engine.world, body);
          marbleBodiesRef.current = marbleBodiesRef.current.filter(b => b !== body);
        });
        setMarbleCount(marbleBodiesRef.current.length);
      }

      marbleBodiesRef.current.forEach((body: any) => {
        const { position, circleRadius } = body;
        const color = body.render.fillStyle;

        ctx.save();
        ctx.translate(position.x, position.y);
        ctx.rotate(body.angle);

        const gradient = ctx.createRadialGradient(-circleRadius * 0.3, -circleRadius * 0.3, circleRadius * 0.1, 0, 0, circleRadius);
        gradient.addColorStop(0, color);
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0.2)');

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
      if (render) {
        Matter.Render.stop(render);
        render.canvas.remove();
      }
      Matter.Runner.stop(runner);
      Matter.Engine.clear(engine);
      cancelAnimationFrame(animationFrameId);
      marbleBodiesRef.current = [];
    };
  }, [JAR_WIDTH, JAR_HEIGHT, jarStyleId, currentPanelWidth, currentPanelHeight, isMobile, setMarbleCount]);

  useEffect(() => {
    // Persistence handled by useLocalStorage

    const engine = engineRef.current;
    if (!engine) return;

    while (marbleBodiesRef.current.length < marbleCount) {
      const color = MARBLE_COLORS[marbleBodiesRef.current.length % MARBLE_COLORS.length];
      const newMarble = Matter.Bodies.circle(
        currentPanelWidth / 2 + (Math.random() * 40 - 20),
        currentPanelHeight / 2 + (Math.random() * 40 - 20),
        getMarbleRadius(isMobile),
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
  }, [marbleCount, target, jarStyleId, JAR_WIDTH, triggerReward, isRewarding, currentPanelWidth, currentPanelHeight, isMobile]);

  useEffect(() => {
    setHasConfig(true);
    setOnReset(() => resetJar);
    setHelpContent(getHelpInfo());
    setOnConfigToggle(() => () => setIsConfigOpen(prev => !prev));
    return () => clearHeader();
  }, [clearHeader, setOnReset, resetJar, setHelpContent, setHasConfig, setOnConfigToggle, setIsConfigOpen]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!panelRef.current) return;
    const rect = panelRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (currentPanelWidth / rect.width);
    setHoverX(x);
  };

  const handleMouseLeave = () => {
    setHoverX(null);
  };

  const handlePanelClick = (e: React.MouseEvent) => {
    if (!panelRef.current) return;
    const rect = panelRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (currentPanelWidth / rect.width);
    const y = (e.clientY - rect.top) * (currentPanelHeight / rect.height);
    removeMarbleAtPoint(x, y);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 w-full h-full font-['Outfit'] select-none overflow-hidden relative">
      <AnimatePresence>
        {isConfigOpen && (
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[100] p-4 bg-slate-100/60 backdrop-blur-xl lg:relative lg:inset-auto lg:z-auto lg:p-0 lg:bg-transparent lg:backdrop-blur-none lg:w-[320px] lg:h-full flex flex-col gap-8 italic overflow-hidden shrink-0"
          >
            <SettingsPanel
              isOpen={isConfigOpen}
              onClose={() => setIsConfigOpen(false)}
              className="h-full"
              side="left"
            >
              <div className="space-y-10">
                {/* Goal Setting */}
                <div className="space-y-6">
                  <label className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.4em] block text-center">
                    <FormattedMessage id="marblejar.settings.goal" defaultMessage="Reward Goal" />
                  </label>
                  <div className="flex items-center justify-center gap-8">
                    <button
                      onClick={() => { setTarget(t => Math.max(1, t - 5)); audioEngine.playTick(settings.soundTheme); }}
                      className="p-4 bg-surface rounded-2xl border-4 border-slate-100 text-slate-300 hover:text-primary hover:border-primary/20 active:scale-90 transition-all "
                    >
                      <Minus size={20} strokeWidth={4} />
                    </button>
                    <span className="text-5xl font-black text-slate-900 tabular-nums italic">{target}</span>
                    <button
                      onClick={() => { setTarget(t => Math.min(100, t + 5)); audioEngine.playTick(settings.soundTheme); }}
                      className="p-4 bg-surface rounded-2xl border-4 border-slate-100 text-slate-300 hover:text-primary hover:border-primary/20 active:scale-90 transition-all "
                    >
                      <Plus size={20} strokeWidth={4} />
                    </button>
                  </div>
                </div>

                {/* Style Setting */}
                <div className="space-y-6">
                  <label className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.4em] block text-center">
                    <FormattedMessage id="marblejar.settings.style" defaultMessage="Jar Style" />
                  </label>
                  <div className="grid grid-cols-1 gap-2">
                    {getJarStyles(isMobile).map(style => (
                      <button
                        key={style.id}
                        onClick={() => { setJarStyleId(style.id); audioEngine.playTick(settings.soundTheme); }}
                        className={`px-6 py-4 rounded-[1.5rem] border-4 transition-all flex items-center justify-between font-black text-xs uppercase tracking-widest ${jarStyleId === style.id
                          ? 'bg-primary border-indigo-400 text-white '
                          : 'bg-surface border-slate-100 text-slate-300 hover:border-primary/20'
                          }`}
                      >
                        <FormattedMessage id={style.nameId} defaultMessage={style.id} />
                        <RotateCcw size={14} className={jarStyleId === style.id ? 'text-primary/70' : 'opacity-0'} />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </SettingsPanel>
          </motion.div>
        )}
      </AnimatePresence>

      <ToolPanel 
        className={isConfigOpen && isMobile ? 'hidden' : 'flex-1'} 
        baseWidth={currentPanelWidth} 
        baseHeight={currentPanelHeight} 
        fluid={isMobile}
      >
        <div
          ref={panelRef}
          onClick={handlePanelClick}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="flex flex-col items-center justify-center w-full h-full relative group cursor-crosshair overflow-hidden"
        >
          {/* Container Visual Centered */}
          <div className="relative z-10 flex items-center justify-center">
            {(() => {
              const currentStyle = getJarStyles(isMobile).find(s => s.id === jarStyleId) || getJarStyles(isMobile)[0];
              const wallAngle = currentStyle.wallAngle || 0;
              const isJar = wallAngle === 0;
              const wallThickness = 40;

              const visualTopWidth = isJar ? JAR_WIDTH : JAR_WIDTH + (2 * JAR_HEIGHT * Math.tan(wallAngle));
              const bottomWidth = isJar ? JAR_WIDTH - (2 * wallThickness) : JAR_WIDTH;
              const bottomPercent = (bottomWidth / visualTopWidth) * 100;
              const sidePadding = (100 - bottomPercent) / 2;

              return (
                <div
                  className="relative bg-surface/10 backdrop-blur-[2px] border-[10px] border-white/90 shadow-[inset_0_0_80px_rgba(255,255,255,0.5)]"
                  style={{
                    width: visualTopWidth,
                    height: JAR_HEIGHT,
                    clipPath: `polygon(0% 0%, 100% 0%, ${100 - sidePadding}% 100%, ${sidePadding}% 100%)`,
                    borderRadius: isJar ? '0 0 4rem 4rem' : '0 0 1rem 1rem'
                  }}
                >
                  {/* Optical Effects */}
                  <div className="absolute inset-0 pointer-events-none z-30 bg-gradient-to-tr from-white/10 via-transparent to-white/5" />
                  <div className="absolute left-8 top-8 bottom-8 w-3 bg-surface/10 rounded-full blur-[3px] pointer-events-none z-30 opacity-60" />
                  <div className="absolute right-12 top-12 w-2 h-20 bg-surface/20 rounded-full blur-[1px] pointer-events-none z-30 opacity-40 rotate-6" />
                </div>
              );
            })()}
          </div>

          <canvas
            ref={canvasRef}
            width={currentPanelWidth}
            height={currentPanelHeight}
            className="w-full h-full absolute inset-0 z-20 pointer-events-none"
          />

          {/* Status Display inside ToolPanel */}
          <div className="absolute bottom-10 left-0 right-0 flex items-center justify-center gap-8 md:gap-16 pointer-events-none z-30 italic">
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.4em] mb-2 leading-none">
                <FormattedMessage id="marblejar.status.marbles" defaultMessage="Marbles" />
              </span>
              <motion.span
                key={marbleCount}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="text-6xl md:text-8xl font-black text-slate-900 italic tracking-tighter leading-none tabular-nums"
              >
                {marbleCount}
              </motion.span>
            </div>

            <div className="w-px h-20 bg-slate-200" />

            <div className="flex flex-col items-center">
              <span className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.4em] mb-2 leading-none">
                <FormattedMessage id="marblejar.status.goal" defaultMessage="Goal" />
              </span>
              <span className="text-6xl md:text-8xl font-black text-primary italic tracking-tighter leading-none tabular-nums">
                {target}
              </span>
            </div>
          </div>

          {/* Drop Preview following mouse horizontally at top */}
          {hoverX !== null && !isRewarding && (
            <div
              style={{
                position: 'absolute',
                left: hoverX,
                top: 20,
                zIndex: 40,
                pointerEvents: 'none'
              }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-10 h-10 rounded-full bg-surface/40 backdrop-blur-xl border-4 border-white flex items-center justify-center overflow-hidden"
                style={{ x: '-50%' }}
              >
                <div className="w-full h-full bg-gradient-to-tr from-slate-200/50 to-transparent" />
              </motion.div>
            </div>
          )}

          {/* Tap Instruction */}
          <div className="absolute top-8 right-8 flex items-center gap-4 bg-surface/80 border-2 border-slate-100 px-6 py-3 rounded-2xl backdrop-blur-md pointer-events-none italic z-30">
            <div className="text-right">
              <p className="text-[10px] font-black text-primary uppercase tracking-widest leading-none">
                <FormattedMessage id="marblejar.status.ready" defaultMessage="Tap to add" />
              </p>
            </div>
            <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center text-white ">
              <MousePointer2 size={16} strokeWidth={3} />
            </div>
          </div>
        </div>
      </ToolPanel>

      {/* Reward Overlay */}
      <AnimatePresence>
        {isRewarding && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-indigo-900/40 backdrop-blur-2xl p-8"
          >
            <motion.div
              initial={{ scale: 0.5, y: 100 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-surface rounded-[4rem] p-12 flex flex-col items-center text-center gap-8 border-8 border-white max-w-xl  relative overflow-hidden italic"
            >
              <div className="relative">
                <div className="absolute -inset-12 bg-primary blur-3xl opacity-20 animate-pulse rounded-full" />
                <div className="w-40 h-40 rounded-[3rem] bg-primary flex items-center justify-center text-white relative z-10 rotate-3  border-8 border-white">
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
                <div className="w-16 h-1.5 bg-primary mx-auto rounded-full" />
                <p className="text-base text-neutral-400 font-black uppercase tracking-widest">
                  <FormattedMessage id="marblejar.reward.subtitle" defaultMessage="Goal Reached!" />
                </p>
              </div>

              <button
                onClick={resetJar}
                className="w-full h-20 bg-primary text-white rounded-[2rem] font-black uppercase tracking-[0.2em] text-lg hover:bg-primary/90 transition-all  flex items-center justify-center gap-4 border-4 border-white active:scale-95"
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
