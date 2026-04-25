import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, RotateCcw, BookOpen, ChevronRight, Plus, Trash2, Pencil, Zap, Target, Rocket, Shield } from 'lucide-react';
import confetti from 'canvas-confetti';
import { audioEngine } from '../../utils/audio';
import { useSettings } from '../../contexts/SettingsContext';
import { ToolHeader } from '../ToolHeader';

const SPAWN_INTERVAL = 3000; 
const BASE_ENEMY_SPEED = 0.2; 
const SPEED_INCREMENT = 0.05; // Increase every 30s
const SHOT_SPEED = 20;

export const TypingGame = () => {
  const { settings } = useSettings();
  const [status, setStatus] = useState('setup'); // 'setup', 'playing', 'finished'
  const [lists, setLists] = useState(() => {
    const saved = localStorage.getItem('spelling_lists');
    return saved ? JSON.parse(saved) : [
      { id: '1', name: 'Example List', words: ['apple', 'banana', 'orange', 'galaxy', 'planet', 'rocket'] }
    ];
  });
  
  const [selectedListId, setSelectedListId] = useState(lists[0]?.id || '');
  const [isAddingList, setIsAddingList] = useState(false);
  const [editingListId, setEditingListId] = useState(null);
  const [newListTitle, setNewListTitle] = useState('');
  const [wordsInput, setWordsInput] = useState('');

  const [enemies, setEnemies] = useState([]);
  const [shots, setShots] = useState([]);
  const [particles, setParticles] = useState([]);
  const [targetEnemyId, setTargetEnemyId] = useState(null);
  const [score, setScore] = useState(0);
  const [totalTyped, setTotalTyped] = useState(0);
  const [correctTyped, setCorrectTyped] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameStartTime, setGameStartTime] = useState(0);

  const gameAreaRef = useRef(null);
  const requestRef = useRef();
  const lastSpawnRef = useRef(0);

  useEffect(() => {
    localStorage.setItem('spelling_lists', JSON.stringify(lists));
  }, [lists]);

  const saveList = () => {
    if (!newListTitle.trim() || !wordsInput.trim()) return;
    const newWords = wordsInput.split('\n').map(w => w.trim()).filter(w => w.length > 0);
    if (newWords.length === 0) return;

    if (editingListId) {
      setLists(prev => prev.map(l => l.id === editingListId ? { ...l, name: newListTitle.trim(), words: newWords } : l));
    } else {
      const newList = { id: Date.now().toString(), name: newListTitle.trim(), words: newWords };
      setLists(prev => [...prev, newList]);
      setSelectedListId(newList.id);
    }
    setNewListTitle(''); setWordsInput(''); setIsAddingList(false); setEditingListId(null);
  };

  const spawnEnemy = useCallback(() => {
    const list = lists.find(l => l.id === selectedListId);
    if (!list) return;
    const word = list.words[Math.floor(Math.random() * list.words.length)];
    const id = Date.now() + Math.random();
    const x = Math.random() * 80 + 10; 
    
    // Path towards player (center bottom: 50, 95)
    const targetX = 50;
    const targetY = 95;
    const startX = x;
    const startY = -10;
    
    const dx = targetX - startX;
    const dy = targetY - startY;
    const angle = Math.atan2(dy, dx);
    
    setEnemies(prev => [...prev, {
      id,
      word,
      x: startX,
      y: startY,
      vx: Math.cos(angle),
      vy: Math.sin(angle),
      angle: angle * (180 / Math.PI) + 90, // Facing target
      typedIndex: 0,
      size: Math.max(70, word.length * 12)
    }]);
  }, [lists, selectedListId]);

  const update = useCallback((time) => {
    if (status !== 'playing' || gameOver) return;

    const elapsed = time - gameStartTime;
    const speedMultiplier = BASE_ENEMY_SPEED + Math.floor(elapsed / 30000) * SPEED_INCREMENT;

    if (time - lastSpawnRef.current > SPAWN_INTERVAL) {
      spawnEnemy();
      lastSpawnRef.current = time;
    }

    setEnemies(prev => {
      const updated = prev.map(e => ({
        ...e,
        x: e.x + e.vx * speedMultiplier,
        y: e.y + e.vy * speedMultiplier
      }));
      if (updated.some(e => e.y > 90 && !e.fullyTyped)) {
        setGameOver(true);
        setStatus('finished');
      }
      return updated;
    });

    setShots(prev => {
      let currentFinalImpacts = [];
      let currentSmallImpacts = [];

      const updatedShots = prev.map(s => {
        const target = enemies.find(en => en.id === s.targetId);
        if (!target) return null; // Target destroyed

        const rect = gameAreaRef.current.getBoundingClientRect();
        const tx = (target.x / 100) * rect.width;
        const ty = (target.y / 100) * rect.height;
        
        const dx = tx - s.x;
        const dy = ty - s.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < SHOT_SPEED) {
          if (s.isFinal) {
             currentFinalImpacts.push({ x: tx, y: ty, targetId: s.targetId });
          } else {
             currentSmallImpacts.push({ x: tx, y: ty });
          }
          return null;
        }

        const vx = (dx / dist) * SHOT_SPEED;
        const vy = (dy / dist) * SHOT_SPEED;
        return { ...s, x: s.x + vx, y: s.y + vy };
      }).filter(Boolean);

      if (currentFinalImpacts.length > 0 || currentSmallImpacts.length > 0) {
        setTimeout(() => {
          if (currentFinalImpacts.length > 0) {
            setEnemies(ePrev => ePrev.filter(e => !currentFinalImpacts.some(f => f.targetId === e.id)));
            currentFinalImpacts.forEach(imp => {
              const rect = gameAreaRef.current.getBoundingClientRect();
              const screenX = rect.left + imp.x;
              const screenY = rect.top + imp.y;
              confetti({
                particleCount: 80,
                spread: 360,
                startVelocity: 15,
                gravity: 0.2,
                ticks: 50,
                scalar: 0.8,
                origin: { x: screenX / window.innerWidth, y: screenY / window.innerHeight },
                colors: ['#ff4500', '#ff8c00', '#ffd700', '#ff0000', '#ffffff'],
                shapes: ['circle', 'square']
              });
              audioEngine.playTick(settings.soundTheme);
            });
          }
          if (currentSmallImpacts.length > 0) {
            setParticles(p => {
              let newP = [...p];
              currentSmallImpacts.forEach(imp => {
                newP.push(...Array(10).fill(0).map(() => ({
                  id: Math.random(),
                  x: imp.x,
                  y: imp.y,
                  vx: (Math.random() - 0.5) * 5,
                  vy: (Math.random() - 0.5) * 5,
                  life: 1.0
                })));
              });
              return newP;
            });
          }
        }, 0);
      }

      return updatedShots;
    });

    setParticles(prev => prev.map(p => ({
      ...p,
      x: p.x + p.vx,
      y: p.y + p.vy,
      life: p.life - 0.05
    })).filter(p => p.life > 0));

    requestRef.current = requestAnimationFrame(update);
  }, [status, gameOver, spawnEnemy, enemies, gameStartTime]);

  useEffect(() => {
    if (status === 'playing') {
      requestRef.current = requestAnimationFrame(update);
    }
    return () => cancelAnimationFrame(requestRef.current);
  }, [status, update]);

  const handleKeyDown = useCallback((e) => {
    if (status !== 'playing' || gameOver) return;
    const key = e.key;
    if (key.length !== 1 && key !== 'Backspace') return;

    setTotalTyped(prev => prev + 1);

    if (key === 'Backspace') {
      setTargetEnemyId(null);
      setEnemies(prev => prev.map(en => ({ ...en, typedIndex: 0 })));
      return;
    }

    setEnemies(prev => {
      let nextTargetId = targetEnemyId;
      let newEnemies = [...prev];

      if (!nextTargetId) {
        const candidates = newEnemies
          .filter(en => !en.fullyTyped && en.word[0].toLowerCase() === key.toLowerCase())
          .sort((a, b) => b.y - a.y);
        if (candidates.length > 0) {
          nextTargetId = candidates[0].id;
          setTargetEnemyId(nextTargetId);
        }
      }

      if (nextTargetId) {
        const enemy = newEnemies.find(en => en.id === nextTargetId);
        if (enemy && enemy.word[enemy.typedIndex].toLowerCase() === key.toLowerCase()) {
          enemy.typedIndex += 1;
          setCorrectTyped(prev => prev + 1);
          setScore(prev => prev + 1);
          audioEngine.playTick(settings.soundTheme);

          const isFinal = enemy.typedIndex === enemy.word.length;

          const rect = gameAreaRef.current.getBoundingClientRect();
          setShots(s => [...s, {
            id: Math.random(),
            x: rect.width / 2,
            y: rect.height - 20,
            targetId: nextTargetId,
            isFinal
          }]);

          if (isFinal) {
            enemy.fullyTyped = true;
            setTargetEnemyId(null);
          }
        }
      }
      return newEnemies;
    });
  }, [status, gameOver, targetEnemyId, settings.soundTheme, enemies]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const accuracy = totalTyped > 0 ? Math.round((correctTyped / totalTyped) * 100) : 100;

  return (
    <div className="w-full mx-auto h-[calc(100vh-12rem)] flex flex-col space-y-4 px-4 pt-2 pb-8">
      <ToolHeader
        title="Typing Galaxy"
        icon={Rocket}
        description="Space-Themed Speed & Accuracy Drill"
        infoContent={
          <>
            <p>
              <strong className="text-white block mb-1">Mission Objective</strong>
              Protect your sector by typing the words appearing on incoming ships. Accuracy and speed are your best defenses!
            </p>
            <p>
              <strong className="text-white block mb-1">How to Play</strong>
              Select a word list and start the game. Type the letters of the words to fire plasma shots. Don't let the ships reach the bottom of the screen!
            </p>
          </>
        }
      >
        <div className="flex items-center gap-4">
          <button
            onClick={() => setStatus('setup')}
            className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:text-red-500 transition-all shadow-sm"
            title="Return to Hangar"
          >
            <RotateCcw size={20} />
          </button>
        </div>
      </ToolHeader>
      {status === 'setup' && (
        <div className="flex-1 flex flex-col items-center justify-center animate-in fade-in zoom-in duration-300">
           <div className="bg-white p-10 rounded-[3rem] shadow-2xl border border-slate-100 w-full max-w-2xl space-y-8">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                  <BookOpen className="text-primary" /> Select Word List
                </h3>
                <button
                  onClick={() => setIsAddingList(!isAddingList)}
                  className="px-4 py-2 bg-primary/10 text-primary rounded-xl font-bold hover:bg-primary/20 transition-all flex items-center gap-2"
                >
                  <Plus size={20} /> {isAddingList ? 'Back' : 'Create New'}
                </button>
              </div>

              {isAddingList ? (
                <div className="bg-slate-50 p-6 rounded-3xl border-2 border-slate-100 space-y-4">
                  <input
                    type="text" placeholder="List Title" value={newListTitle}
                    onChange={(e) => setNewListTitle(e.target.value)}
                    className="w-full p-4 bg-white border-2 border-slate-100 rounded-2xl focus:ring-4 focus:ring-primary/10 outline-none font-bold"
                  />
                  <textarea
                    placeholder="Words (one per line)" value={wordsInput}
                    onChange={(e) => setWordsInput(e.target.value)}
                    className="w-full h-48 p-4 bg-white border-2 border-slate-100 rounded-2xl focus:ring-4 focus:ring-primary/10 outline-none font-mono resize-none"
                  />
                  <button onClick={saveList} className="w-full py-4 bg-primary text-white rounded-2xl font-black text-xl shadow-lg">Save List</button>
                </div>
              ) : (
                <div className="grid gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {lists.map(list => (
                    <div key={list.id} onClick={() => setSelectedListId(list.id)} className={`w-full p-6 rounded-3xl border-4 cursor-pointer transition-all flex items-center justify-between ${selectedListId === list.id ? 'border-primary bg-primary/5' : 'border-white bg-slate-50'}`}>
                      <div className="flex items-center gap-4">
                        <div className="font-black text-slate-700">{list.name}</div>
                        <div className="text-slate-400 text-sm truncate max-w-[200px]">{list.words.join(', ')}</div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={(e) => {e.stopPropagation(); setEditingListId(list.id); setNewListTitle(list.name); setWordsInput(list.words.join('\n')); setIsAddingList(true);}} className="p-2 hover:text-primary"><Pencil size={18} /></button>
                        <button onClick={(e) => {e.stopPropagation(); setLists(l => l.filter(li => li.id !== list.id));}} className="p-2 hover:text-red-500"><Trash2 size={18} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <button onClick={() => {
                const now = performance.now();
                setEnemies([]); setShots([]); setParticles([]); setTargetEnemyId(null); setScore(0); setTotalTyped(0); setCorrectTyped(0); setGameOver(false); 
                setGameStartTime(now); lastSpawnRef.current = now;
                setStatus('playing');
              }} className="w-full py-6 bg-slate-900 text-white rounded-3xl font-black text-2xl shadow-xl flex items-center justify-center gap-3">
                <Play fill="currentColor" /> DEPLOY MISSION
              </button>
           </div>
        </div>
      )}

      {status === 'playing' && (
        <div ref={gameAreaRef} className="flex-1 bg-slate-950 rounded-[3rem] relative overflow-hidden shadow-2xl border-4 border-slate-800 cursor-none">
          {/* Brighter, Slower Starfield */}
          <div className="absolute inset-0 overflow-hidden">
             {[...Array(50)].map((_, i) => (
               <div key={i} className="absolute bg-white rounded-full opacity-60" 
                    style={{ 
                      width: Math.random()*3+1+'px', 
                      height: Math.random()*3+1+'px', 
                      top: (Math.random()*200 - 50)+'%', 
                      left: Math.random()*100+'%',
                      animation: `twinkle ${Math.random()*10+10}s ease-in-out infinite alternate, drift ${Math.random()*150+150}s linear infinite`
                    }} />
             ))}
          </div>

          <style>{`
            @keyframes twinkle {
              from { opacity: 0.2; transform: scale(1); }
              to { opacity: 0.8; transform: scale(1.5); }
            }
            @keyframes drift {
              from { transform: translateY(-50vh); }
              to { transform: translateY(150vh); }
            }
          `}</style>

          {/* Impact Particles */}
          {particles.map(p => (
            <div
              key={p.id}
              className="absolute w-1.5 h-1.5 bg-amber-400 rounded-full"
              style={{ left: p.x, top: p.y, opacity: p.life, transform: 'translate(-50%, -50%)' }}
            />
          ))}

          {/* Enemies (Space Ships) */}
          {enemies.map(en => (
            <motion.div
              key={en.id}
              className={`absolute flex flex-col items-center justify-center p-2`}
              style={{ left: `${en.x}%`, top: `${en.y}%`, width: `${en.size}px`, transform: `translateX(-50%) rotate(${en.angle}deg)` }}
            >
              <div className={`relative w-full aspect-square flex flex-col items-center justify-center transition-all ${en.id === targetEnemyId ? 'scale-110' : 'opacity-90'}`}>
                <svg viewBox="0 0 100 100" className={`w-full h-full drop-shadow-2xl ${en.id === targetEnemyId ? 'text-primary fill-primary/20' : 'text-slate-400 fill-slate-800'}`}>
                  <path d="M50 5 L90 80 L50 70 L10 80 Z" stroke="currentColor" strokeWidth="4" />
                  <motion.path d="M35 80 L50 95 L65 80" stroke="#f59e0b" strokeWidth="4" animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 0.2 }} fill="none" />
                </svg>
                
                <div className="absolute top-full mt-2 bg-slate-900/90 backdrop-blur-md px-4 py-1.5 rounded-full border-2 border-white/10 flex items-center gap-1 font-mono text-lg whitespace-nowrap" style={{ transform: `rotate(${-en.angle}deg)` }}>
                  {en.word.split('').map((char, idx) => (
                    <span key={idx} className={idx < en.typedIndex ? 'text-primary font-black scale-110' : 'text-white'}>
                      {char}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}

          {/* Homing Plasma Shots */}
          {shots.map(s => (
            <div
              key={s.id}
              className="absolute w-3 h-3 bg-primary rounded-full shadow-[0_0_15px_#3b82f6]"
              style={{ left: s.x, top: s.y, transform: 'translate(-50%, -50%)', filter: 'brightness(1.5)' }}
            />
          ))}

          {/* Player Ship */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none">
            <motion.div 
              animate={{ y: [0, -5, 0] }} 
              transition={{ repeat: Infinity, duration: 2 }}
              className="relative w-24 h-24 flex items-center justify-center drop-shadow-[0_0_20px_rgba(59,130,246,0.8)]"
            >
              <svg viewBox="0 0 100 100" className="w-full h-full text-blue-400 fill-slate-800">
                <path d="M50 10 L90 80 L50 70 L10 80 Z" stroke="currentColor" strokeWidth="4" />
                <path d="M50 10 L50 70" stroke="currentColor" strokeWidth="2" />
                <circle cx="50" cy="50" r="12" stroke="currentColor" strokeWidth="3" fill="none" />
                <motion.path d="M35 80 L50 100 L65 80" stroke="#3b82f6" strokeWidth="4" animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 0.1 }} fill="#3b82f6" />
              </svg>
            </motion.div>
          </div>

          {/* HUD */}
          <div className="absolute top-8 left-8 flex gap-4">
            <div className="bg-black/60 backdrop-blur-xl border-2 border-white/10 px-8 py-3 rounded-[2rem] flex items-center gap-4">
              <Target size={24} className="text-primary" />
              <div className="flex flex-col">
                <span className="text-[10px] font-black opacity-40 uppercase">Score</span>
                <span className="text-white font-black text-2xl">{score}</span>
              </div>
            </div>
            <div className="bg-black/60 backdrop-blur-xl border-2 border-white/10 px-8 py-3 rounded-[2rem] flex items-center gap-4">
              <Zap size={24} className="text-amber-500" />
              <div className="flex flex-col">
                <span className="text-[10px] font-black opacity-40 uppercase">Accuracy</span>
                <span className="text-white font-black text-2xl">{accuracy}%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {status === 'finished' && (
        <div className="flex-1 flex flex-col items-center justify-center animate-in zoom-in duration-500">
          <div className="bg-slate-900 p-16 rounded-[4rem] shadow-2xl text-white text-center space-y-10 max-w-2xl w-full border border-white/10">
            <h2 className="text-5xl font-black italic uppercase tracking-tighter">Sector Lost</h2>
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-white/5 p-8 rounded-[2rem] border-2 border-white/10">
                <div className="text-slate-500 text-xs font-black uppercase mb-1">Final Score</div>
                <div className="text-4xl font-black text-primary">{score}</div>
              </div>
              <div className="bg-white/5 p-8 rounded-[2rem] border-2 border-white/10">
                <div className="text-slate-500 text-xs font-black uppercase mb-1">Accuracy</div>
                <div className="text-4xl font-black text-amber-500">{accuracy}%</div>
              </div>
            </div>
            <button onClick={() => setStatus('setup')} className="w-full py-6 bg-white text-slate-900 rounded-2xl font-black text-2xl shadow-xl">TRY AGAIN</button>
          </div>
        </div>
      )}
    </div>
  );
};
