import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Play, RotateCcw, ArrowLeft, Gamepad2, Circle, CheckCircle2, XCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { audioEngine } from '../../utils/audio';
import { useSettings } from '../../contexts/SettingsContext';

const MARBLE_TYPES = [
  { name: 'Red', colorClass: 'bg-red-500 shadow-[inset_-4px_-4px_8px_rgba(0,0,0,0.2),0_0_15px_rgba(239,68,68,0.4)]', textClass: 'text-red-600' },
  { name: 'Blue', colorClass: 'bg-blue-500 shadow-[inset_-4px_-4px_8px_rgba(0,0,0,0.2),0_0_15px_rgba(59,130,246,0.4)]', textClass: 'text-blue-600' },
  { name: 'Green', colorClass: 'bg-green-500 shadow-[inset_-4px_-4px_8px_rgba(0,0,0,0.2),0_0_15px_rgba(34,197,94,0.4)]', textClass: 'text-green-600' },
  { name: 'Yellow', colorClass: 'bg-yellow-400 shadow-[inset_-4px_-4px_8px_rgba(0,0,0,0.2),0_0_15px_rgba(202,138,4,0.4)]', textClass: 'text-yellow-600' },
  { name: 'Purple', colorClass: 'bg-purple-500 shadow-[inset_-4px_-4px_8px_rgba(0,0,0,0.2),0_0_15px_rgba(168,85,247,0.4)]', textClass: 'text-purple-600' },
  { name: 'Orange', colorClass: 'bg-orange-500 shadow-[inset_-4px_-4px_8px_rgba(0,0,0,0.2),0_0_15px_rgba(249,115,22,0.4)]', textClass: 'text-orange-600' },
  { name: 'Pink', colorClass: 'bg-pink-500 shadow-[inset_-4px_-4px_8px_rgba(0,0,0,0.2),0_0_15px_rgba(236,72,153,0.4)]', textClass: 'text-pink-600' },
  { name: 'Cyan', colorClass: 'bg-cyan-500 shadow-[inset_-4px_-4px_8px_rgba(0,0,0,0.2),0_0_15px_rgba(6,182,212,0.4)]', textClass: 'text-cyan-600' },
];

export const MarbleCounting = () => {
  const [gameState, setGameState] = useState('menu'); // 'menu', 'playing', 'feedback', 'result'
  const [difficulty, setDifficulty] = useState('1-5');
  const [marbles, setMarbles] = useState([]);
  const [targetType, setTargetType] = useState(null);
  const [targetCount, setTargetCount] = useState(0);
  const [options, setOptions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState(null); // { isCorrect, selected }
  
  const containerRef = useRef(null);
  const { settings } = useSettings();
  const requestRef = useRef();

  const generateMarbles = useCallback((range) => {
    const [min, max] = range.split('-').map(Number);
    
    // Pick 3 random colors for this round
    const selectedTypes = [...MARBLE_TYPES].sort(() => 0.5 - Math.random()).slice(0, 3);
    const target = selectedTypes[Math.floor(Math.random() * selectedTypes.length)];
    
    const newMarbles = [];
    let tCount = 0;

    selectedTypes.forEach(type => {
      const count = Math.floor(Math.random() * (max - min + 1)) + min;
      if (type.name === target.name) tCount = count;
      
      for (let i = 0; i < count; i++) {
        newMarbles.push({
          id: `${type.name}-${i}`,
          name: type.name,
          x: Math.random() * 60 + 20,
          y: Math.random() * 60 + 20,
          vx: (Math.random() - 0.5) * 0.4,
          vy: (Math.random() - 0.5) * 0.4,
          color: type.colorClass,
          size: 60,
        });
      }
    });

    // Generate options
    const opts = new Set([tCount]);
    while (opts.size < 4) {
      const offset = Math.floor(Math.random() * 5) - 2;
      const fake = Math.max(1, tCount + offset);
      opts.add(fake);
    }
    
    setTargetType(target);
    setTargetCount(tCount);
    setMarbles(newMarbles);
    setOptions(Array.from(opts).sort((a, b) => a - b));
  }, []);

  const updatePhysics = useCallback(() => {
    if (!containerRef.current) return;
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;
    const sizePx = 60;
    const sizeXPercent = (sizePx / width) * 100;
    const sizeYPercent = (sizePx / height) * 100;

    setMarbles(prev => {
      let next = prev.map(m => {
        let nx = m.x + m.vx;
        let ny = m.y + m.vy;
        let nvx = m.vx;
        let nvy = m.vy;

        if (nx <= sizeXPercent/2 || nx >= 100 - sizeXPercent/2) nvx *= -1;
        if (ny <= sizeYPercent/2 || ny >= 100 - sizeYPercent/2) nvy *= -1;

        nx = Math.max(sizeXPercent/2, Math.min(100 - sizeXPercent/2, nx));
        ny = Math.max(sizeYPercent/2, Math.min(100 - sizeYPercent/2, ny));

        return { ...m, x: nx, y: ny, vx: nvx, vy: nvy };
      });

      for (let i = 0; i < next.length; i++) {
        for (let j = i + 1; j < next.length; j++) {
          const m1 = next[i];
          const m2 = next[j];
          const dx = (m1.x - m2.x) * (width / 100);
          const dy = (m1.y - m2.y) * (height / 100);
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < sizePx) {
            const v1x = m1.vx;
            const v1y = m1.vy;
            m1.vx = m2.vx;
            m1.vy = m2.vy;
            m2.vx = v1x;
            m2.vy = v1y;
            const overlap = sizePx - distance;
            const nx = dx / distance;
            const ny = dy / distance;
            m1.x += (nx * overlap / 2) * (100 / width);
            m1.y += (ny * overlap / 2) * (100 / height);
            m2.x -= (nx * overlap / 2) * (100 / width);
            m2.y -= (ny * overlap / 2) * (100 / height);
          }
        }
      }
      return next;
    });
    requestRef.current = requestAnimationFrame(updatePhysics);
  }, []);

  useEffect(() => {
    if (gameState === 'playing' || gameState === 'feedback') {
      requestRef.current = requestAnimationFrame(updatePhysics);
    }
    return () => cancelAnimationFrame(requestRef.current);
  }, [gameState, updatePhysics]);

  const startGame = (diff) => {
    setDifficulty(diff);
    setCurrentIndex(0);
    setScore(0);
    setGameState('playing');
    generateMarbles(diff);
  };

  const handleAnswer = (val) => {
    if (feedback) return;
    
    const isCorrect = val === targetCount;
    if (isCorrect) {
      setScore(s => s + 1);
      audioEngine.playTick(settings.soundTheme);
    } else {
      audioEngine.playTick(settings.soundTheme);
    }
    
    setFeedback({ isCorrect, selected: val });
    setGameState('feedback');
    
    setTimeout(() => {
      if (currentIndex < 9) {
        setCurrentIndex(i => i + 1);
        generateMarbles(difficulty);
        setFeedback(null);
        setGameState('playing');
      } else {
        setGameState('result');
        if (score >= 8) {
          confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
        }
      }
    }, 2000);
  };

  const kickMarble = (id) => {
    audioEngine.playTick(settings.soundTheme);
    setMarbles(prev => prev.map(m => 
      m.id === id ? { ...m, vx: -m.vx * 1.5, vy: -m.vy * 1.5 } : m
    ));
  };

  if (gameState === 'menu') {
    return (
      <div className="max-w-4xl mx-auto h-full flex flex-col items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-8 bg-white/80 backdrop-blur-md p-12 rounded-[3rem] shadow-2xl border border-white/20 w-full"
        >
          <div className="bg-primary/10 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
            <Circle size={48} className="text-primary fill-primary" />
          </div>
          <h1 className="text-5xl font-black text-gray-800 tracking-tight">Marble Counting</h1>
          <p className="text-xl text-gray-500 font-medium max-w-md mx-auto">
            Count the specific colour of marbles as they bounce around!
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
            {['1-5', '5-10', '1-20'].map((diff) => (
              <button
                key={diff}
                onClick={() => startGame(diff)}
                className="p-6 bg-white hover:bg-primary hover:text-white border-2 border-gray-100 hover:border-primary rounded-3xl transition-all hover:scale-105 font-black text-2xl text-gray-700 shadow-sm"
              >
                {diff}
              </button>
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  if (gameState === 'result') {
    return (
      <div className="max-w-4xl mx-auto h-full flex flex-col items-center justify-center p-4">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white p-12 rounded-[3rem] shadow-2xl border border-gray-100 w-full text-center space-y-8"
        >
          <div className="bg-yellow-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto">
            <Trophy size={48} className="text-yellow-600" />
          </div>
          <div className="space-y-2">
            <h2 className="text-4xl font-black text-gray-800">Great Job!</h2>
            <p className="text-xl text-gray-500 font-bold">You got {score} out of 10 correct!</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <button onClick={() => setGameState('menu')} className="flex-1 py-4 bg-gray-100 text-gray-600 font-bold rounded-2xl hover:bg-gray-200 transition-colors flex items-center justify-center gap-2">
              <ArrowLeft size={20} /> Main Menu
            </button>
            <button onClick={() => startGame(difficulty)} className="flex-1 py-4 bg-primary text-white font-bold rounded-2xl hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-primary/30">
              <RotateCcw size={20} /> Play Again
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto h-full flex flex-col p-4 space-y-6">
      <div className="flex justify-between items-center px-4">
        <button onClick={() => setGameState('menu')} className="p-3 hover:bg-gray-100 rounded-2xl transition-colors text-gray-400">
          <ArrowLeft size={24} />
        </button>
        <div className="flex items-center gap-4 bg-white px-6 py-2 rounded-2xl shadow-sm border border-gray-100">
          <div className="text-gray-400 font-bold text-sm uppercase tracking-widest">Progress</div>
          <div className="text-xl font-black text-primary">{currentIndex + 1} / 10</div>
        </div>
        <div className="w-12" />
      </div>

      <div className="flex-1 relative bg-white rounded-[3rem] shadow-xl border-4 border-gray-100 overflow-hidden" ref={containerRef}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(255,255,255,1)_0%,_rgba(243,244,246,1)_100%)] opacity-50" />
        
        {/* The Marbles */}
        {marbles.map((m) => (
          <div
            key={m.id}
            onClick={() => kickMarble(m.id)}
            className={`absolute rounded-full cursor-pointer pointer-events-auto transition-transform active:scale-90 ${m.color}`}
            style={{
              left: `${m.x}%`,
              top: `${m.y}%`,
              width: `${m.size}px`,
              height: `${m.size}px`,
              transform: 'translate(-50%, -50%)',
            }}
          />
        ))}

        {/* Question Overlay */}
        <div className="absolute bottom-10 left-0 right-0 flex flex-col items-center pointer-events-none">
          <div className="bg-white/95 backdrop-blur-sm px-10 py-6 rounded-[2.5rem] shadow-2xl border border-white/50 mb-8 text-center">
            <h2 className="text-3xl font-black text-gray-800 leading-tight">
              How many <span className={targetType?.textClass}>{targetType?.name}</span> marbles are there?
            </h2>
          </div>
          
          <div className="flex gap-4 pointer-events-auto">
            {options.map((opt) => (
              <button
                key={opt}
                onClick={() => handleAnswer(opt)}
                disabled={!!feedback}
                className={`w-20 h-20 rounded-2xl text-3xl font-black transition-all transform active:scale-95 shadow-lg border-b-4 ${
                  feedback 
                    ? opt === targetCount ? 'bg-green-500 border-green-700 text-white' : 
                      feedback.selected === opt ? 'bg-red-500 border-red-700 text-white' : 'bg-gray-100 border-gray-300 text-gray-400'
                    : 'bg-white border-gray-200 text-gray-700 hover:bg-primary hover:text-white hover:border-primary/80'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        {/* Feedback Messages */}
        <AnimatePresence>
          {feedback && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.5, y: -50 }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
            >
              <div className={`flex flex-col items-center gap-2 px-12 py-8 rounded-[3rem] shadow-2xl ${feedback.isCorrect ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                {feedback.isCorrect ? <CheckCircle2 size={64} /> : <XCircle size={64} />}
                <span className="text-4xl font-black tracking-tight">{feedback.isCorrect ? 'CORRECT!' : `IT WAS ${targetCount}`}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      <div className="text-center text-gray-400 font-bold italic">
        Tip: Focus only on the <span className={targetType?.textClass}>{targetType?.name}</span> marbles!
      </div>
    </div>
  );
};

