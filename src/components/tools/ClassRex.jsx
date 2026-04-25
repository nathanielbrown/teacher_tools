import React, { useEffect, useRef, useState } from 'react';
import { Gamepad2, RotateCcw, Trophy, Play } from 'lucide-react';
import { ToolHeader } from '../ToolHeader';

const ClassRex = () => {
  const canvasRef = useRef(null);
  const [gameState, setGameState] = useState('START'); // START, PLAYING, GAMEOVER
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(parseInt(localStorage.getItem('classrex-highscore') || '0'));
  const requestRef = useRef();
  
  // Game Constants
  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 400;
  const GROUND_Y = 350;
  const GRAVITY = 0.6;
  const JUMP_FORCE = -12;
  const INITIAL_SPEED = 5;
  const SPEED_INCREMENT = 0.001;
  
  // Game Objects
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

  const obstacles = useRef([]);
  const clouds = useRef([]);
  const gameSpeed = useRef(INITIAL_SPEED);
  const frameCount = useRef(0);
  const scoreRef = useRef(0);

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

  const spawnCloud = () => {
    clouds.current.push({
      x: CANVAS_WIDTH,
      y: 50 + Math.random() * 100,
      width: 60,
      height: 30,
      speed: 0.5 + Math.random() * 1
    });
  };

  // Drawing Functions
  const drawRex = (ctx, x, y, width, height, frame, isJumping) => {
    const p = height / 20; // Pixel size
    ctx.save();
    ctx.translate(x, y);

    // Colors
    const primary = '#10b981'; // Emerald 500
    const secondary = '#059669'; // Emerald 600
    const dark = '#064e3b'; // Emerald 900
    const capColor = '#1e293b'; // Slate 800
    const tasselColor = '#fbbf24'; // Amber 400
    
    // Body & Head
    ctx.fillStyle = primary;
    
    // Head (more Chrome-like)
    ctx.fillRect(11*p, 0, 9*p, 8*p);
    // Snout detail
    ctx.fillRect(20*p, 2*p, 1*p, 5*p);

    // Graduation Cap
    ctx.fillStyle = capColor;
    // Mortarboard (top part - diamond/flat top)
    ctx.fillRect(9*p, -3*p, 13*p, 2*p);
    // Base part
    ctx.fillRect(12*p, -1*p, 7*p, 1*p);
    // Tassel
    ctx.fillStyle = tasselColor;
    ctx.fillRect(21*p, -1*p, 1*p, 3*p);
    ctx.fillRect(21*p, 2*p, 2*p, 2*p);
    
    // Eye
    ctx.fillStyle = 'white';
    ctx.fillRect(13*p, 1.5*p, 2*p, 2*p);
    ctx.fillStyle = 'black';
    ctx.fillRect(14.5*p, 1.5*p, 1*p, 1.5*p);
    
    // Neck
    ctx.fillStyle = primary;
    ctx.fillRect(11*p, 8*p, 4*p, 3*p);
    
    // Body
    ctx.fillRect(2*p, 10*p, 11*p, 6*p);
    ctx.fillRect(4*p, 16*p, 7*p, 1*p); // Bottom curve
    
    // Tail
    ctx.fillRect(0, 10*p, 2*p, 4*p);
    ctx.fillRect(2*p, 10*p, 1*p, 2*p);
    
    // Arms
    ctx.fillRect(13*p, 11*p, 2*p, 1*p);
    ctx.fillRect(14*p, 12*p, 1*p, 1*p);
    
    // Back plates (to make it look more like a Rex)
    ctx.fillStyle = secondary;
    ctx.fillRect(2*p, 9*p, 2*p, 1*p);
    ctx.fillRect(5*p, 9*p, 2*p, 1*p);
    ctx.fillRect(8*p, 9*p, 2*p, 1*p);

    // Legs
    ctx.fillStyle = dark;
    if (isJumping) {
      ctx.fillRect(5*p, 17*p, 2*p, 3*p);
      ctx.fillRect(9*p, 17*p, 2*p, 3*p);
    } else {
      if (frame === 0) {
        ctx.fillRect(5*p, 17*p, 2*p, 3*p); // Leg 1 down
        ctx.fillRect(9*p, 16*p, 2*p, 2*p); // Leg 2 up
      } else {
        ctx.fillRect(5*p, 16*p, 2*p, 2*p); // Leg 1 up
        ctx.fillRect(9*p, 17*p, 2*p, 3*p); // Leg 2 down
      }
    }

    ctx.restore();
  };

  const drawCactus = (ctx, x, y, width, height, type) => {
    const p = height / 20;
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = '#065f46'; // Emerald 800

    const drawSingleCactus = (ox, oy, w, h) => {
      const pw = w / 6;
      // Main trunk
      ctx.fillRect(ox + 2*pw, oy, 2*pw, h);
      
      // Arms (Pixel style)
      // Left arm
      ctx.fillRect(ox, oy + 4*p, pw, 6*p);
      ctx.fillRect(ox, oy + 9*p, 2*pw, pw);
      
      // Right arm
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

  const drawCloud = (ctx, x, y, width, height) => {
    const p = width / 12;
    ctx.save();
    ctx.fillStyle = 'rgba(209, 213, 219, 0.5)'; // Slate 300 transparent
    
    // Blocky pixel cloud
    ctx.fillRect(x + 2*p, y + 2*p, 8*p, 4*p);
    ctx.fillRect(x + 4*p, y, 6*p, 2*p);
    ctx.fillRect(x, y + 3*p, 2*p, 2*p);
    ctx.fillRect(x + 10*p, y + 3*p, 2*p, 2*p);
    
    ctx.restore();
  };

  const update = () => {
    if (gameState !== 'PLAYING') return;

    // Update Rex
    rex.current.vy += GRAVITY;
    rex.current.y += rex.current.vy;

    if (rex.current.y > GROUND_Y - rex.current.height) {
      rex.current.y = GROUND_Y - rex.current.height;
      rex.current.vy = 0;
      rex.current.isJumping = false;
    }

    // Animation frame
    rex.current.frameCounter++;
    if (rex.current.frameCounter > 5) {
      rex.current.frame = (rex.current.frame + 1) % 2;
      rex.current.frameCounter = 0;
    }

    // Update Speed
    gameSpeed.current += SPEED_INCREMENT;

    // Update Obstacles
    obstacles.current.forEach(obs => {
      obs.x -= gameSpeed.current;
    });

    // Check Collisions
    obstacles.current.forEach(obs => {
      if (
        rex.current.x < obs.x + obs.width - 10 &&
        rex.current.x + rex.current.width - 10 > obs.x &&
        rex.current.y < obs.y + obs.height - 10 &&
        rex.current.y + rex.current.height - 10 > obs.y
      ) {
        gameOver();
      }
    });

    // Remove off-screen obstacles
    obstacles.current = obstacles.current.filter(obs => obs.x + obs.width > 0);

    // Spawn Obstacles
    if (frameCount.current % Math.floor(100 / (gameSpeed.current / INITIAL_SPEED)) === 0) {
      if (Math.random() > 0.7) spawnObstacle();
    }

    // Update Clouds
    clouds.current.forEach(cloud => {
      cloud.x -= cloud.speed;
    });
    clouds.current = clouds.current.filter(cloud => cloud.x + cloud.width > 0);
    if (frameCount.current % 150 === 0) spawnCloud();

    // Update Score
    scoreRef.current++;
    if (scoreRef.current % 10 === 0) {
      const currentScore = Math.floor(scoreRef.current / 10);
      setScore(currentScore);
      
      if (currentScore > Math.floor(highScore / 10)) {
        const newHighScore = scoreRef.current;
        setHighScore(newHighScore);
        localStorage.setItem('classrex-highscore', newHighScore.toString());
      }
    }
    frameCount.current++;
  };

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Clear background
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw Sky
    const skyGradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    skyGradient.addColorStop(0, '#e0f2fe');
    skyGradient.addColorStop(1, '#ffffff');
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw Ground
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);
    ctx.lineTo(CANVAS_WIDTH, GROUND_Y);
    ctx.stroke();

    // Pixel debris on ground
    ctx.fillStyle = '#cbd5e1';
    for (let i = 0; i < CANVAS_WIDTH; i += 50) {
      const offset = (frameCount.current * gameSpeed.current + i) % (CANVAS_WIDTH + 100);
      ctx.fillRect(CANVAS_WIDTH - offset, GROUND_Y + 5, 4, 2);
      ctx.fillRect(CANVAS_WIDTH - offset + 20, GROUND_Y + 12, 2, 2);
    }

    // Draw Clouds
    clouds.current.forEach(cloud => {
      drawCloud(ctx, cloud.x, cloud.y, cloud.width, cloud.height);
    });

    // Draw Obstacles
    obstacles.current.forEach(obs => {
      drawCactus(ctx, obs.x, obs.y, obs.width, obs.height, obs.type);
    });

    // Draw Rex
    drawRex(
      ctx, 
      rex.current.x, 
      rex.current.y, 
      rex.current.width, 
      rex.current.height, 
      rex.current.frame, 
      rex.current.isJumping
    );

    requestRef.current = requestAnimationFrame(() => {
      update();
      draw();
    });
  };

  const jump = () => {
    if (gameState === 'PLAYING' && !rex.current.isJumping) {
      rex.current.vy = JUMP_FORCE;
      rex.current.isJumping = true;
    } else if (gameState === 'START' || gameState === 'GAMEOVER') {
      startGame();
    }
  };

  const startGame = () => {
    setGameState('PLAYING');
    setScore(0);
    obstacles.current = [];
    clouds.current = [];
    gameSpeed.current = INITIAL_SPEED;
    frameCount.current = 0;
    rex.current.y = GROUND_Y - rex.current.height;
    rex.current.vy = 0;
    scoreRef.current = 0;
  };

  const gameOver = () => {
    setGameState('GAMEOVER');
    const finalScore = scoreRef.current;
    if (finalScore > highScore) {
      setHighScore(finalScore);
      localStorage.setItem('classrex-highscore', finalScore.toString());
    }
    cancelAnimationFrame(requestRef.current);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        jump();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    requestRef.current = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      cancelAnimationFrame(requestRef.current);
    };
  }, [gameState]);

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 bg-slate-50 rounded-[3rem] shadow-xl max-w-5xl mx-auto border border-slate-200">
      <ToolHeader 
        title="ClassRex Runner" 
        icon={Gamepad2} 
        description="Jump over the obstacles!"
        color="emerald"
        infoContent={
          <div className="space-y-4">
            <p>Help ClassRex navigate through the desert by jumping over cacti.</p>
            <div className="flex items-center gap-3 bg-white/5 p-3 rounded-2xl">
              <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-xs font-bold text-white">SPACE</div>
              <p className="text-sm">Press Space or Click to jump</p>
            </div>
            <p className="text-xs text-slate-400">The game gets faster as you score more points!</p>
          </div>
        }
      >
        <div className="flex gap-4 md:gap-8 px-4">
          <div className="text-center">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Score</p>
            <p className="text-2xl md:text-3xl font-black text-slate-700 tabular-nums">{score}</p>
          </div>
          <div className="w-px h-10 bg-slate-200 self-center" />
          <div className="text-center">
            <p className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em]">High Score</p>
            <p className="text-2xl md:text-3xl font-black text-amber-600 tabular-nums">{Math.floor(highScore / 10)}</p>
          </div>
        </div>
      </ToolHeader>

      <div 
        className="relative overflow-hidden rounded-[2.5rem] shadow-2xl border-8 border-white cursor-pointer group"
        onClick={jump}
      >
        <canvas 
          ref={canvasRef} 
          width={CANVAS_WIDTH} 
          height={CANVAS_HEIGHT}
          className="bg-white block w-full h-auto"
        />

        {gameState === 'START' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/40 backdrop-blur-md transition-all duration-500">
            <div className="p-10 bg-white rounded-[3rem] shadow-2xl flex flex-col items-center gap-8 animate-in zoom-in duration-300">
              <div className="w-28 h-28 bg-emerald-100 rounded-[2rem] flex items-center justify-center animate-bounce shadow-inner">
                <Play className="w-14 h-14 text-emerald-600 ml-2" />
              </div>
              <div className="text-center">
                <h3 className="text-4xl font-black text-slate-800 tracking-tight">Ready, Rex?</h3>
                <p className="text-slate-500 font-bold mt-2">Press SPACE or Click to Jump</p>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); startGame(); }}
                className="px-10 py-5 bg-emerald-500 text-white text-lg font-black rounded-3xl shadow-xl shadow-emerald-200 hover:bg-emerald-600 hover:scale-105 active:scale-95 transition-all"
              >
                Start Running
              </button>
            </div>
          </div>
        )}

        {gameState === 'GAMEOVER' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-900/40 backdrop-blur-md transition-all duration-500">
            <div className="p-10 bg-white rounded-[3rem] shadow-2xl flex flex-col items-center gap-8 animate-in zoom-in duration-300">
              <div className="w-24 h-24 bg-red-100 rounded-[2rem] flex items-center justify-center shadow-inner">
                <Trophy className="w-12 h-12 text-red-600" />
              </div>
              <div className="text-center">
                <h3 className="text-4xl font-black text-slate-800 tracking-tight">Game Over!</h3>
                <div className="flex gap-4 justify-center mt-4">
                  <div className="px-4 py-2 bg-slate-50 rounded-2xl">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Score</p>
                    <p className="text-2xl font-black text-slate-700">{score}</p>
                  </div>
                  <div className="px-4 py-2 bg-amber-50 rounded-2xl">
                    <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Best</p>
                    <p className="text-2xl font-black text-amber-600">{Math.floor(highScore / 10)}</p>
                  </div>
                </div>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); startGame(); }}
                className="flex items-center gap-3 px-10 py-5 bg-slate-800 text-white text-lg font-black rounded-3xl shadow-xl hover:bg-slate-900 hover:scale-105 active:scale-95 transition-all"
              >
                <RotateCcw className="w-6 h-6" />
                Try Again
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 text-xl font-black shadow-inner">↑</div>
          <div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-wider">Control</p>
            <p className="text-slate-600 font-bold">Space to Jump</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 text-xl shadow-inner">🦖</div>
          <div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-wider">Character</p>
            <p className="text-slate-600 font-bold">Help Rex escape</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 text-xl shadow-inner">🔥</div>
          <div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-wider">Challenge</p>
            <p className="text-slate-600 font-bold">Speed increases</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClassRex;

