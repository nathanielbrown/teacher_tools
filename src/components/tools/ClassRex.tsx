import React, { useEffect, useRef, useState, useCallback } from 'react';
import { 
  Gamepad2, 
  RotateCcw, 
  Trophy, 
  Zap,
} from 'lucide-react';
import { ToolPanel } from '../shared/ToolPanel';
import { motion, AnimatePresence } from 'framer-motion';
import { useHeader } from '../../contexts/HeaderContext';
import { useSettings } from '../../contexts/SettingsContext';
import { audioEngine } from '../../utils/audio';
import { useLocalStorage } from '../../hooks/useLocalStorage';

// 1. Constants
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 400;
const GROUND_Y = 350;
const GRAVITY = 0.6;
const JUMP_FORCE = -12;
const INITIAL_SPEED = 5;
const SPEED_INCREMENT = 0.001;

// 2. Config (None)

// 3. Text (Help and Info)
const HELP_INFO = (
  <div className="space-y-4 font-['Outfit']">
    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">How to Play</h3>
    <div className="space-y-3">
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-orange-50 flex items-center justify-center text-xs font-black text-orange-600 shrink-0">1</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">Press <b>Space</b> or <b>Click</b> to jump.</p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-emerald-50 flex items-center justify-center text-xs font-black text-emerald-600 shrink-0">2</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">Don't hit the <b>cacti</b>!</p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center text-xs font-black text-blue-600 shrink-0">3</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">The game gets <b>faster</b> as you go.</p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-purple-50 flex items-center justify-center text-xs font-black text-purple-600 shrink-0">4</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">Try to get the <b>Best Score</b>!</p>
      </div>
    </div>
  </div>
);

// 4. Local Storage (None)

// 5. Classes (None)

// 6. Functions (Helper drawing functions)
const drawRex = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, frame: number, isJumping: boolean, vy: number) => {
  const p = height / 20;
  ctx.save();
  ctx.translate(x + width/2, y + height/2);
  if (isJumping) {
    const rot = Math.min(Math.max(vy * 0.03, -0.2), 0.2);
    ctx.rotate(rot);
  }
  ctx.translate(-width/2, -height/2);

  const primary = '#10b981';
  const secondary = '#059669';
  const dark = '#064e3b';
  const capColor = '#1e293b';
  const tasselColor = '#fbbf24';
  
  ctx.fillStyle = primary;
  ctx.fillRect(11*p, 0, 9*p, 8*p);
  ctx.fillRect(20*p, 2*p, 1*p, 5*p);

  ctx.fillStyle = capColor;
  ctx.fillRect(9*p, -3*p, 13*p, 2*p);
  ctx.fillRect(12*p, -1*p, 7*p, 1*p);
  ctx.fillStyle = tasselColor;
  ctx.fillRect(21*p, -1*p, 1*p, 3*p);
  ctx.fillRect(21*p, 2*p, 2*p, 2*p);
  
  ctx.fillStyle = 'white';
  ctx.fillRect(13*p, 1.5*p, 2*p, 2*p);
  ctx.fillStyle = 'black';
  ctx.fillRect(14.5*p, 1.5*p, 1*p, 1.5*p);
  
  ctx.fillStyle = primary;
  ctx.fillRect(11*p, 8*p, 4*p, 3*p);
  ctx.fillRect(2*p, 10*p, 11*p, 6*p);
  ctx.fillRect(4*p, 16*p, 7*p, 1*p);
  ctx.fillRect(0, 10*p, 2*p, 4*p);
  ctx.fillRect(2*p, 10*p, 1*p, 2*p);
  ctx.fillRect(13*p, 11*p, 2*p, 1*p);
  ctx.fillRect(14*p, 12*p, 1*p, 1*p);
  
  ctx.fillStyle = secondary;
  ctx.fillRect(2*p, 9*p, 2*p, 1*p);
  ctx.fillRect(5*p, 9*p, 2*p, 1*p);
  ctx.fillRect(8*p, 9*p, 2*p, 1*p);

  ctx.fillStyle = dark;
  if (isJumping) {
    ctx.fillRect(5*p, 17*p, 2*p, 3*p);
    ctx.fillRect(9*p, 17*p, 2*p, 3*p);
  } else {
    if (frame === 0) {
      ctx.fillRect(5*p, 17*p, 2*p, 3*p); 
      ctx.fillRect(9*p, 16*p, 2*p, 2*p); 
    } else {
      ctx.fillRect(5*p, 16*p, 2*p, 2*p); 
      ctx.fillRect(9*p, 17*p, 2*p, 3*p); 
    }
  }
  ctx.restore();
};

const drawCactus = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, type: string) => {
  const p = height / 20;
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = '#065f46';

  const drawSingleCactus = (ox: number, oy: number, w: number, h: number) => {
    const pw = w / 6;
    ctx.fillRect(ox + 2*pw, oy, 2*pw, h);
    ctx.fillRect(ox, oy + 4*p, pw, 6*p);
    ctx.fillRect(ox, oy + 9*p, 2*pw, pw);
    ctx.fillRect(ox + 5*pw, oy + 2*p, pw, 5*p);
    ctx.fillRect(ox + 4*pw, oy + 6*p, 2*pw, pw);
  };

  if (type === 'group') {
    drawSingleCactus(0, 4*p, width/2.5, height - 4*p);
    drawSingleCactus(width/1.8, 0, width/2, height);
  } else if (type === 'large') {
    drawSingleCactus(0, 0, width, height);
  } else {
    drawSingleCactus(width/4, 4*p, width/2, height - 4*p);
  }
  ctx.restore();
};

const drawCloud = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number) => {
  const p = width / 12;
  ctx.save();
  ctx.fillStyle = 'rgba(209, 213, 219, 0.5)';
  ctx.fillRect(x + 2*p, y + 2*p, 8*p, 4*p);
  ctx.fillRect(x + 4*p, y, 6*p, 2*p);
  ctx.fillRect(x, y + 3*p, 2*p, 2*p);
  ctx.fillRect(x + 10*p, y + 3*p, 2*p, 2*p);
  ctx.restore();
};

// 7. Component
export const ClassRex = () => {
  const { setHeaderActions, setOnReset, clearHeader, setHelpContent } = useHeader();
  const { settings } = useSettings();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState('START'); // START, PLAYING, GAMEOVER
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useLocalStorage<number>('class_rex_high_score', 0);
  const requestRef = useRef<number>(0);
  
  const rex = useRef({
    x: 50,
    y: GROUND_Y - 50,
    width: 50,
    height: 50,
    vy: 0,
    isJumping: false,
    frame: 0,
    frameCounter: 0
  });

  const obstacles = useRef<any[]>([]);
  const clouds = useRef<any[]>([]);
  const particles = useRef<any[]>([]);
  const stars = useRef<any[]>([]);
  const shakeFrames = useRef(0);
  const gameSpeed = useRef(INITIAL_SPEED);
  const frameCount = useRef(0);
  const scoreRef = useRef(0);

  const spawnDust = (x: number, y: number, count: number) => {
    for (let i = 0; i < count; i++) {
      particles.current.push({
        x: x + (Math.random() - 0.5) * 20,
        y: y + (Math.random() - 0.5) * 5,
        vx: (Math.random() - 0.5) * 2 - gameSpeed.current * 0.2,
        vy: (Math.random() - 1) * 2,
        life: 1.0,
        decay: 0.02 + Math.random() * 0.03,
        size: 3 + Math.random() * 4
      });
    }
  };

  const spawnObstacle = () => {
    const types = ['small', 'large', 'group'];
    const type = types[Math.floor(Math.random() * types.length)];
    let width = 30;
    let height = 50;
    
    if (type === 'large') height = 70;
    if (type === 'group') width = 70;

    obstacles.current.push({
      x: CANVAS_WIDTH,
      y: GROUND_Y - height,
      width,
      height,
      type
    });
  };

  const gameOver = useCallback(() => {
    setGameState('GAMEOVER');
    shakeFrames.current = 15;
    spawnDust(rex.current.x + rex.current.width, rex.current.y + rex.current.height / 2, 20);
    if (scoreRef.current > highScore) {
      setHighScore(scoreRef.current);
    }
    audioEngine.playAlarm(settings.soundTheme);
  }, [highScore, settings.soundTheme]);

  const update = useCallback(() => {
    if (gameState !== 'PLAYING') return;

    rex.current.vy += GRAVITY;
    rex.current.y += rex.current.vy;

    if (rex.current.y >= GROUND_Y - rex.current.height) {
      if (rex.current.isJumping) {
        spawnDust(rex.current.x + rex.current.width / 2, GROUND_Y, 8);
      }
      rex.current.y = GROUND_Y - rex.current.height;
      rex.current.vy = 0;
      rex.current.isJumping = false;
    }

    rex.current.frameCounter++;
    if (rex.current.frameCounter > 5) {
      rex.current.frame = (rex.current.frame + 1) % 2;
      rex.current.frameCounter = 0;
    }

    if (!rex.current.isJumping && frameCount.current % 6 === 0) {
      spawnDust(rex.current.x, GROUND_Y, 2);
    }

    gameSpeed.current += SPEED_INCREMENT;

    particles.current.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= p.decay;
    });
    particles.current = particles.current.filter(p => p.life > 0);

    obstacles.current.forEach(obs => {
      obs.x -= gameSpeed.current;
    });

    obstacles.current.forEach(obs => {
      const hitboxPadding = 12;
      if (
        rex.current.x + hitboxPadding < obs.x + obs.width - hitboxPadding &&
        rex.current.x + rex.current.width - hitboxPadding > obs.x + hitboxPadding &&
        rex.current.y + hitboxPadding < obs.y + obs.height - hitboxPadding &&
        rex.current.y + rex.current.height - hitboxPadding > obs.y + hitboxPadding
      ) {
        gameOver();
      }
    });

    obstacles.current = obstacles.current.filter(obs => obs.x + obs.width > 0);

    const spawnRate = Math.floor(100 / (gameSpeed.current / INITIAL_SPEED));
    if (frameCount.current % spawnRate === 0) {
      if (Math.random() > 0.6) spawnObstacle();
    }

    const spawnCloud = () => {
      clouds.current.push({
        x: CANVAS_WIDTH,
        y: 50 + Math.random() * 100,
        width: 60,
        height: 30,
        speed: 0.5 + Math.random() * 1
      });
    };

    clouds.current.forEach(cloud => {
      cloud.x -= cloud.speed + (gameSpeed.current * 0.1);
    });
    clouds.current = clouds.current.filter(cloud => cloud.x + cloud.width > 0);
    if (frameCount.current % 150 === 0) spawnCloud();

    if (stars.current.length === 0) {
      for (let i = 0; i < 60; i++) {
        stars.current.push({
          x: Math.random() * CANVAS_WIDTH,
          y: Math.random() * (CANVAS_HEIGHT * 0.6),
          size: Math.random() * 1.5,
          opacity: Math.random(),
          speed: 0.1 + Math.random() * 0.3
        });
      }
    }
    stars.current.forEach(star => {
      star.x -= star.speed + (gameSpeed.current * 0.05);
      if (star.x < 0) {
        star.x = CANVAS_WIDTH;
        star.y = Math.random() * (CANVAS_HEIGHT * 0.6);
      }
    });

    scoreRef.current++;
    if (scoreRef.current % 10 === 0) {
      setScore(Math.floor(scoreRef.current / 10));
    }
    frameCount.current++;
  }, [gameState, gameOver]);

  const draw = useCallback((_time: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();
    if (shakeFrames.current > 0) {
      const intensity = shakeFrames.current;
      ctx.translate((Math.random() - 0.5) * intensity, (Math.random() - 0.5) * intensity);
      if (gameState === 'GAMEOVER') {
        shakeFrames.current *= 0.9;
        if (shakeFrames.current < 0.5) shakeFrames.current = 0;
      }
    }

    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    const cycleDuration = 1000;
    const currentCycle = scoreRef.current % cycleDuration;
    let nightFactor = 0;
    if (currentCycle > 500) nightFactor = Math.min(1, (currentCycle - 500) / 100);
    else if (currentCycle < 100) nightFactor = 1 - Math.min(1, currentCycle / 100);

    const skyGradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    skyGradient.addColorStop(0, '#e0f2fe');
    skyGradient.addColorStop(1, '#ffffff');
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    if (nightFactor > 0) {
      ctx.fillStyle = `rgba(15, 23, 42, ${nightFactor * 0.9})`;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      stars.current.forEach(star => {
        ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity * nightFactor})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    if (nightFactor > 0) {
      ctx.fillStyle = `rgba(253, 224, 71, ${nightFactor})`;
      ctx.beginPath();
      ctx.arc(CANVAS_WIDTH - 150, 100, 30, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = `rgba(15, 23, 42, ${nightFactor * 0.9})`;
      ctx.beginPath();
      ctx.arc(CANVAS_WIDTH - 160, 95, 25, 0, Math.PI * 2);
      ctx.fill();
    }

    clouds.current.forEach(cloud => {
      drawCloud(ctx, cloud.x, cloud.y, cloud.width);
    });

    ctx.strokeStyle = nightFactor > 0.5 ? '#334155' : '#94a3b8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);
    ctx.lineTo(CANVAS_WIDTH, GROUND_Y);
    ctx.stroke();

    ctx.fillStyle = nightFactor > 0.5 ? '#475569' : '#cbd5e1';
    for (let i = 0; i < CANVAS_WIDTH + 100; i += 50) {
      const offset = (frameCount.current * gameSpeed.current + i) % (CANVAS_WIDTH + 100);
      ctx.fillRect(CANVAS_WIDTH - offset, GROUND_Y + 5, 4, 2);
      ctx.fillRect(CANVAS_WIDTH - offset + 20, GROUND_Y + 12, 2, 2);
    }

    particles.current.forEach(p => {
      ctx.fillStyle = `rgba(148, 163, 184, ${p.life * (1 - nightFactor * 0.5)})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });

    obstacles.current.forEach(obs => {
      drawCactus(ctx, obs.x, obs.y, obs.width, obs.height, obs.type);
    });

    drawRex(ctx, rex.current.x, rex.current.y, rex.current.width, rex.current.height, rex.current.frame, rex.current.isJumping, rex.current.vy);

    ctx.restore();

    requestRef.current = requestAnimationFrame((_time) => {
      update();
      draw(_time);
    });
  }, [gameState, update]);

  const startGame = useCallback(() => {
    setGameState('PLAYING');
    setScore(0);
    obstacles.current = [];
    clouds.current = [];
    particles.current = [];
    gameSpeed.current = INITIAL_SPEED;
    frameCount.current = 0;
    shakeFrames.current = 0;
    rex.current.y = GROUND_Y - rex.current.height;
    rex.current.vy = 0;
    scoreRef.current = 0;
    audioEngine.playTick(settings.soundTheme);
  }, [settings.soundTheme]);

  const jump = useCallback(() => {
    if (gameState === 'PLAYING' && !rex.current.isJumping) {
      rex.current.vy = JUMP_FORCE;
      rex.current.isJumping = true;
      spawnDust(rex.current.x + rex.current.width / 2, GROUND_Y, 12);
      audioEngine.playTick(settings.soundTheme);
    } else if (gameState === 'START' || gameState === 'GAMEOVER') {
      startGame();
    }
  }, [gameState, startGame, settings.soundTheme]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        jump();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    requestRef.current = requestAnimationFrame(draw);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [jump, draw]);

  useEffect(() => {
    setOnReset(() => () => setGameState('START'));
    setHelpContent(HELP_INFO);
    return () => clearHeader();
  }, [clearHeader, setOnReset, setHelpContent]);

  useEffect(() => {
    setHeaderActions(
      <div className="flex items-center gap-6 italic">
        <div className="flex flex-col items-end gap-0">
           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Best</span>
           <span className="text-2xl font-black text-orange-600 tabular-nums italic leading-none mt-1">{Math.floor(highScore / 10)}</span>
        </div>
        <div className="w-px h-8 bg-slate-100" />
        <button 
          onClick={() => { setGameState('START'); audioEngine.playTick(settings.soundTheme); }}
          className="flex items-center gap-2 px-6 py-2 bg-white border-2 border-slate-100 text-slate-300 rounded-xl font-black text-[10px] uppercase tracking-widest hover:border-rose-100 hover:text-rose-600 transition-all active:scale-95 "
        >
          <RotateCcw size={14} /> Reset
        </button>
      </div>
    );
  }, [highScore, settings.soundTheme, setHeaderActions]);

  return (
    <ToolPanel className="flex-row gap-8 p-4 lg:p-12 italic">
      {/* Primary Game Observation Deck */}
      <div className="flex-1 relative overflow-hidden bg-white rounded-[4rem] group/stage flex items-center justify-center cursor-pointer  border-4 border-slate-50" onClick={jump}>
        <div className="w-full h-full relative overflow-hidden rounded-[3.5rem] bg-white group/game ">
          <canvas 
            ref={canvasRef} 
            width={CANVAS_WIDTH} 
            height={CANVAS_HEIGHT}
            className="block w-full h-auto"
          />

          <AnimatePresence>
            {gameState === 'START' && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 backdrop-blur-2xl z-20"
              >
                <div className="text-center space-y-12 italic">
                   <div className="w-48 h-48 bg-emerald-600 rounded-[4rem]  flex items-center justify-center text-white border-8 border-white rotate-3 mx-auto">
                      <Gamepad2 size={96} strokeWidth={2.5} />
                   </div>
                   <div className="space-y-4">
                      <h1 className="text-7xl font-black text-slate-900 tracking-tighter uppercase leading-none">Class-Rex</h1>
                   </div>
                   <button
                     onClick={startGame}
                     className="px-16 py-8 bg-slate-900 text-white rounded-[3rem] font-black uppercase tracking-[0.2em] text-2xl hover:bg-emerald-600 transition-all  flex items-center gap-6 border-4 border-white"
                   >
                     Play
                   </button>
                </div>
              </motion.div>
            )}

            {gameState === 'GAMEOVER' && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex flex-col items-center justify-center bg-rose-600/95 backdrop-blur-xl z-20"
              >
                <div className="text-center space-y-12 bg-white p-20 rounded-[5rem]  border-8 border-white/20 italic max-w-2xl w-full">
                   <div className="w-32 h-32 bg-rose-50 rounded-[2.5rem] flex items-center justify-center text-rose-500 border-4 border-white rotate-6 mx-auto ">
                      <Trophy size={64} strokeWidth={3} />
                   </div>
                   <div className="space-y-6">
                      <h1 className="text-6xl font-black text-slate-900 tracking-tighter uppercase leading-none">Game Over</h1>
                      <div className="flex gap-12 justify-center items-center">
                         <div className="flex flex-col gap-2">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] leading-none">Score</span>
                            <span className="text-7xl font-black text-slate-900 tabular-nums tracking-tighter">{score}</span>
                         </div>
                         <div className="w-px h-16 bg-slate-100" />
                         <div className="flex flex-col gap-2">
                            <span className="text-[10px] font-black text-orange-500 uppercase tracking-[0.4em] leading-none">Best</span>
                            <span className="text-7xl font-black text-orange-600 tabular-nums tracking-tighter">{Math.floor(highScore / 10)}</span>
                         </div>
                      </div>
                   </div>
                   <button
                     onClick={startGame}
                     className="w-full h-24 bg-slate-900 text-white rounded-[2.5rem] font-black uppercase tracking-[0.2em] text-2xl hover:bg-rose-500 transition-all  flex items-center justify-center gap-6 border-4 border-white"
                   >
                     Play Again
                   </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Tactical Telemetry Sidebar */}
      <div className="w-full lg:w-[450px] shrink-0 flex flex-col gap-8 relative z-20 italic">
        <div className="flex-1 bg-slate-50/50 p-10 rounded-[4rem] border-4 border-white  flex flex-col gap-10 min-h-0">
           <div className="flex items-center gap-4 shrink-0 border-b-4 border-white pb-6">
              <h4 className="text-xl font-black text-slate-900 uppercase tracking-tight leading-none">Stats</h4>
           </div>

           <div className="flex-1 flex flex-col gap-10 min-h-0 overflow-y-auto no-scrollbar italic">
              {/* Score Core */}
              <div className="p-12 bg-slate-900 rounded-[3.5rem]  relative group overflow-hidden border-4 border-slate-800">
                 <div className="tool-grid-bg-dark opacity-10 pointer-events-none" />
                 <div className="relative z-10 flex flex-col items-center">
                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.5em] mb-6">Score</span>
                    <div className="text-9xl font-black text-white italic tracking-tighter tabular-nums">
                       {score}
                    </div>
                 </div>
              </div>

              {/* Auxiliary Metrics */}
              <div className="grid grid-cols-1 gap-6">
                 <div className="p-8 bg-white rounded-[3rem] border-4 border-slate-100  flex items-center justify-between">
                    <div className="flex flex-col gap-1">
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Speed</span>
                       <span className="text-4xl font-black text-slate-900 italic mt-2">{gameSpeed.current.toFixed(2)}x</span>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-500">
                       <Zap size={24} strokeWidth={3} />
                    </div>
                 </div>
                 <div className="p-8 bg-emerald-600 rounded-[3rem] border-4 border-emerald-500  flex items-center justify-between text-white">
                    <div className="flex flex-col gap-1">
                       <span className="text-[10px] font-black text-emerald-200 uppercase tracking-widest leading-none">Best</span>
                       <span className="text-4xl font-black tabular-nums italic mt-2">{Math.floor(highScore / 10)}</span>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-white">
                       <Trophy size={24} strokeWidth={3} />
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </ToolPanel>
  );
};

export default ClassRex;
