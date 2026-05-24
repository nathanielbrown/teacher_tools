import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Users2, 
  RotateCcw, 
  List, 
  CircleDot,
  Volume2,
  VolumeX,
  Play
} from 'lucide-react';
import { motion, AnimatePresence, useAnimation, animate } from 'framer-motion';
import { useSettings } from '../../contexts/SettingsContext';
import { useHeader } from '../../contexts/HeaderContext';
import { audioEngine } from '../../utils/audio';
import { ToolPanel } from '../shared/ToolPanel';
import { ClassPanel } from '../shared/ClassPanel';
import { FormattedMessage } from 'react-intl';
import { useLocalStorage } from '../../hooks/useLocalStorage';

// 1. Constants
const COLORS = [
  '#FF4757', '#2ED573', '#1E90FF', '#FFA502', 
  '#A29BFE', '#FAB1A0', '#FF6B81', '#20BF6B', 
  '#FA8231', '#0FB9B1', '#F7D794', '#6366F1'
];

const LIST_SIZE = 9;
const MIDDLE_INDEX = 4;

// 2. Types
type Mode = 'wheel' | 'list';

// 3. Components
const WheelView = ({ names, spinning, winner, onFinish, isMobile }: { names: string[], spinning: boolean, winner: string | null, onFinish: () => void, isMobile: boolean }) => {
  const { settings } = useSettings();
  const controls = useAnimation();
  const [rotation, setRotation] = useState(0);
  const lastTickIndexRef = useRef(-1);

  useEffect(() => {
    if (spinning && names.length > 0) {
      const winnerIndex = names.indexOf(winner || '');
      const segmentAngle = 360 / names.length;
      const offset = (winnerIndex * segmentAngle) + (segmentAngle / 2);
      
      const startRotation = rotation;
      const targetMod = (360 - offset) % 360;
      let diff = targetMod - (startRotation % 360);
      if (diff <= 0) diff += 360;
      const targetRotation = startRotation + 3600 + diff;
      
      const duration = 4000;

      animate(startRotation, targetRotation, {
        duration: duration / 1000,
        ease: [0.1, 0.9, 0.2, 1], // easeOut curve for immediate spin
        onUpdate: (latest) => {
          controls.set({ rotate: latest });
          const currentSegmentIndex = Math.floor(((latest % 360) + 360) % 360 / segmentAngle);
          if (currentSegmentIndex !== lastTickIndexRef.current) {
            audioEngine.playTick(settings.soundTheme);
            lastTickIndexRef.current = currentSegmentIndex;
          }
        },
        onComplete: () => {
          setRotation(targetRotation % 360);
          onFinish();
        }
      });
    } else if (!spinning) {
      controls.set({ rotate: rotation });
    }
  }, [spinning, names, winner, controls, onFinish, rotation, settings.soundTheme]);

  if (names.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-slate-300 font-black uppercase tracking-widest italic">
        <FormattedMessage id="namepicker.no_names" defaultMessage="Add names to start" />
      </div>
    );
  }

  return (
    <div className={`relative ${isMobile ? 'w-full aspect-square' : 'w-[900px] h-[900px]'} flex items-center justify-center max-w-[90vw] max-h-[88vh]`}>
      {/* Pointer */}
      <div className={`absolute ${isMobile ? '-top-4' : '-top-6'} left-1/2 -translate-x-1/2 z-20`}>
        <div className={`${isMobile ? 'border-l-[20px] border-r-[20px] border-t-[30px]' : 'border-l-[25px] border-r-[25px] border-t-[40px]'} w-0 h-0 border-l-transparent border-r-transparent border-t-slate-800`} />
      </div>

      <motion.div
        animate={controls}
        initial={{ rotate: rotation }}
        className="w-full h-full rounded-full overflow-hidden relative"
      >
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          {names.map((name, i) => {
            const angle = 360 / names.length;
            const startAngle = i * angle;
            const endAngle = (i + 1) * angle;
            
            // Convert to radians
            const x1 = 50 + 50 * Math.cos((startAngle * Math.PI) / 180);
            const y1 = 50 + 50 * Math.sin((startAngle * Math.PI) / 180);
            const x2 = 50 + 50 * Math.cos((endAngle * Math.PI) / 180);
            const y2 = 50 + 50 * Math.sin((endAngle * Math.PI) / 180);
            
            const largeArcFlag = angle > 180 ? 1 : 0;
            
            const pathData = names.length === 1 
              ? "M 50, 50 m -50, 0 a 50,50 0 1,0 100,0 a 50,50 0 1,0 -100,0"
              : `M 50 50 L ${x1} ${y1} A 50 50 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

            return (
              <g key={i}>
                <path
                  d={pathData}
                  fill={COLORS[i % COLORS.length]}
                  stroke="white"
                  strokeWidth="0.5"
                />
                <g transform={`rotate(${startAngle + angle / 2}, 50, 50)`}>
                  <text
                    x="75"
                    y="50"
                    fill="white"
                    fontSize={names.length > 20 ? "2.5" : "3.5"}
                    fontWeight="900"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="tracking-widest"
                  >
                    {name.length > 12 ? name.substring(0, 10) + '..' : name}
                  </text>
                </g>
              </g>
            );
          })}
        </svg>
        {/* Center hub */}
        <div className="absolute inset-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-surface rounded-full border-4 border-slate-100 z-10" />
      </motion.div>
    </div>
  );
};

const ListView = ({ names, spinning, winner, onFinish, isMobile }: { names: string[], spinning: boolean, winner: string | null, onFinish: () => void, isMobile: boolean }) => {
  const { settings } = useSettings();
  const [displayNames, setDisplayNames] = useState<string[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const speedRef = useRef(50);
  const iterationsRef = useRef(0);
  const maxIterations = 30;

  useEffect(() => {
    if (names.length > 0 && !spinning && displayNames.length === 0) {
      // Fill initial list
      const initial = Array.from({ length: LIST_SIZE }, (_, i) => names[(i - MIDDLE_INDEX + names.length) % names.length]);
      setDisplayNames(initial);
    }
  }, [names, spinning, displayNames.length]);

  const animate = useCallback(() => {
    iterationsRef.current++;
    
    setDisplayNames(prev => {
      const nextNames = [...prev];
      nextNames.pop();
      const nextIndex = Math.floor(Math.random() * names.length);
      nextNames.unshift(names[nextIndex]);
      audioEngine.playTick(settings.soundTheme);
      return nextNames;
    });

    if (iterationsRef.current < maxIterations) {
      // Slower and slower with exponential curve
      speedRef.current = 50 + Math.pow(iterationsRef.current / maxIterations, 2) * 600;
      timerRef.current = setTimeout(animate, speedRef.current);
    } else {
      // Final stop: set the middle one to the winner
      setDisplayNames(prev => {
        const final = [...prev];
        if (winner) final[MIDDLE_INDEX] = winner;
        return final;
      });
      onFinish();
    }
  }, [names, winner, onFinish, settings.soundTheme]);

  useEffect(() => {
    if (spinning && names.length > 0) {
      iterationsRef.current = 0;
      speedRef.current = 50;
      animate();
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [spinning, names, animate]);

  if (names.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-slate-300 font-black uppercase tracking-widest italic">
        <FormattedMessage id="namepicker.no_names" defaultMessage="Add names to start" />
      </div>
    );
  }

  return (
    <div className="relative flex flex-col items-center justify-center gap-2">
      {/* Triangles */}
      <div className={`absolute ${isMobile ? 'left-[-20px] border-l-[15px] border-t-[10px] border-b-[10px]' : 'left-[-40px] border-l-[25px] border-t-[15px] border-b-[15px]'} top-1/2 -translate-y-1/2 w-0 h-0 border-t-transparent border-b-transparent border-l-slate-800 z-20`} />
      <div className={`absolute ${isMobile ? 'right-[-20px] border-r-[15px] border-t-[10px] border-b-[10px]' : 'right-[-40px] border-r-[25px] border-t-[15px] border-b-[15px]'} top-1/2 -translate-y-1/2 w-0 h-0 border-t-transparent border-b-transparent border-r-slate-800 z-20`} />

      <div className={`bg-surface rounded-[2rem] border-8 border-white overflow-hidden ${isMobile ? 'w-[280px]' : 'w-[400px]'}`}>
        {displayNames.map((name, i) => {
          const colorIndex = names.indexOf(name);
          const backgroundColor = colorIndex !== -1 ? COLORS[colorIndex % COLORS.length] : '#f1f5f9';
          const isMiddle = i === MIDDLE_INDEX;

          return (
            <motion.div
              key={`${name}-${i}`}
              layout
              className={`${isMobile ? 'h-10 text-lg' : 'h-16 text-2xl'} flex items-center justify-center font-black tracking-wider transition-all duration-300 ${isMiddle ? 'scale-105 z-10 border-y-4 border-white' : 'opacity-60 scale-95'}`}
              style={{ 
                backgroundColor,
                color: 'white'
              }}
            >
              {name}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

// Main Component
export const NamePicker = () => {
  const { settings } = useSettings();
  const { setOnReset, setOnConfigToggle, setHasConfig, clearHeader } = useHeader();
  
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 1024 : false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const [selectedClassId, setSelectedClassId] = useLocalStorage<string>('name_picker_class_id', 'blank');
  const [students, setStudents] = useState<string[]>([]);
  const [mode, setMode] = useLocalStorage<Mode>('name_picker_mode', 'wheel');
  const [isClassPanelOpen, setIsClassPanelOpen] = useLocalStorage<boolean>('name_picker_panel_open', true);
  const [isSpinning, setIsSpinning] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [showWinner, setShowWinner] = useState(false);
  const [availableStudents, setAvailableStudents] = useState<string[]>([]);

  // Sync students from settings initially or when class changes
  useEffect(() => {
    const cls = settings.classes.find(c => c.id === selectedClassId);
    if (cls) {
      setStudents(cls.students);
      setAvailableStudents(cls.students);
    } else if (selectedClassId === 'blank') {
      setStudents([]);
      setAvailableStudents([]);
    }
  }, [selectedClassId, settings.classes]);

  const handlePick = () => {
    if (availableStudents.length === 0 || isSpinning) return;
    
    const randomWinner = availableStudents[Math.floor(Math.random() * availableStudents.length)];
    setWinner(randomWinner);
    setIsSpinning(true);
    setShowWinner(false);
  };

  const removeWinner = () => {
    if (winner) {
      const newStudents = students.filter(s => s !== winner);
      setStudents(newStudents);
      setAvailableStudents(newStudents);
      setWinner(null);
      setShowWinner(false);
    }
  };

  const handleFinish = useCallback(() => {
    setIsSpinning(false);
    setShowWinner(true);
    audioEngine.playSuccess(settings.soundTheme);
  }, [settings.soundTheme]);

  const reset = useCallback(() => {
    setIsSpinning(false);
    setWinner(null);
    setShowWinner(false);
  }, []);

  useEffect(() => {
    setHasConfig(true);
    setOnReset(() => reset);
    setOnConfigToggle(() => () => setIsClassPanelOpen(prev => !prev));
    return () => clearHeader();
  }, [clearHeader, setOnReset, setOnConfigToggle, setHasConfig, reset, setIsClassPanelOpen]);


  const handleManageClasses = () => {
    window.history.pushState({}, '', '/config/classes');
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  return (
    <div className="flex h-full w-full italic overflow-hidden transition-all duration-500 ease-in-out" style={{ gap: isClassPanelOpen ? '2rem' : '0' }}>
      <ClassPanel
        isOpen={isClassPanelOpen}
        onClose={() => setIsClassPanelOpen(false)}
        selectedClassId={selectedClassId}
        onClassChange={setSelectedClassId}
        students={students}
        onStudentsChange={(s) => { setStudents(s); setAvailableStudents(s); }}
        onManageClasses={handleManageClasses}
      >
        {isMobile && (
          <button
            onClick={() => { setIsClassPanelOpen(false); handlePick(); }}
            className="w-full py-5 bg-primary text-white rounded-[2rem] font-black text-xl uppercase tracking-[0.1em] shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3 mt-4 italic border-4 border-white"
          >
            <Play size={24} fill="currentColor" />
            <FormattedMessage id="namepicker.spin" defaultMessage="Spin" />
          </button>
        )}
      </ClassPanel>

      <ToolPanel 
        className={`italic ${isMobile ? 'bg-transparent border-transparent shadow-none' : ''}`} 
        baseWidth={isMobile ? 400 : 1200} 
        baseHeight={900}
        fluid={isMobile}
      >
        <div className="flex flex-col h-full w-full relative">
          
          {/* Mode Selector */}
          <div className={`${isMobile ? 'relative mb-4 flex justify-center w-full' : 'absolute right-4 top-1/2 -translate-y-1/2'} z-40`}>
            <div className={`bg-surface/80 backdrop-blur-xl p-2 rounded-[2.5rem] flex ${isMobile ? 'flex-row' : 'flex-col'} items-center gap-2 border-4 border-white shadow-lg`}>
              <button
                onClick={() => { setMode('wheel'); reset(); }}
                className={`flex items-center gap-3 ${isMobile ? 'px-6 py-3' : 'px-8 py-4'} rounded-[2rem] transition-all active:scale-95 ${mode === 'wheel' ? 'bg-primary text-white' : 'text-neutral-400 hover:text-primary'}`}
              >
                <CircleDot size={20} />
                <span className="text-sm font-black uppercase tracking-widest">Wheel</span>
              </button>
              <button
                onClick={() => { setMode('list'); reset(); }}
                className={`flex items-center gap-3 ${isMobile ? 'px-6 py-3' : 'px-8 py-4'} rounded-[2rem] transition-all active:scale-95 ${mode === 'list' ? 'bg-primary text-white' : 'text-neutral-400 hover:text-primary'}`}
              >
                <List size={20} />
                <span className="text-sm font-black uppercase tracking-widest">List</span>
              </button>
            </div>
          </div>

          {/* Main Stage */}
          <div className="flex-1 relative flex flex-col items-center justify-center p-6">
            <AnimatePresence mode="wait">
              {mode === 'wheel' ? (
                <motion.div
                  key="wheel"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="w-full h-full flex items-center justify-center relative cursor-pointer"
                  onClick={handlePick}
                >
                  <WheelView names={availableStudents} spinning={isSpinning} winner={winner} onFinish={handleFinish} isMobile={isMobile} />
                </motion.div>
              ) : (
                <motion.div
                  key="list"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="w-full h-full flex items-center justify-center cursor-pointer"
                  onClick={handlePick}
                >
                  <ListView names={availableStudents} spinning={isSpinning} winner={winner} onFinish={handleFinish} isMobile={isMobile} />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Winner Overlay */}
            <AnimatePresence>
              {showWinner && winner && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.5, y: 20 }}
                  className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none"
                >
                  <div className="bg-surface/90 backdrop-blur-xl px-16 py-10 rounded-[3rem] border-8 border-indigo-600 shadow-2xl flex flex-col items-center gap-4">
                    <span className="text-primary font-black uppercase tracking-[0.3em] text-xl">Winner!</span>
                    <span className="text-7xl font-black text-slate-900 tracking-tight">{winner}</span>
                    <div className="flex gap-4 mt-4 pointer-events-auto">
                      <button 
                        onClick={(e) => { e.stopPropagation(); reset(); }}
                        className="bg-dark-bg text-white px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-800 transition-all active:scale-95"
                      >
                        <FormattedMessage id="namepicker.reset" defaultMessage="Try Again" />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); removeWinner(); }}
                        className="bg-rose-500 text-white px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-rose-600 transition-all active:scale-95 flex items-center gap-2"
                      >
                        <RotateCcw size={14} className="rotate-45" />
                        <FormattedMessage id="namepicker.remove_winner" defaultMessage="Remove Name" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>


          </div>
        </div>
      </ToolPanel>
    </div>
  );
};

export default NamePicker;
