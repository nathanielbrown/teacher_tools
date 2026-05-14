import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  ChevronUp, 
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useHeader } from '../../contexts/HeaderContext';
import { audioEngine } from '../../utils/audio';
import { useSettings } from '../../contexts/SettingsContext';
import { ToolPanel } from '../shared/ToolPanel';
import { useIntl, FormattedMessage, IntlShape } from 'react-intl';
import { useLocalStorage } from '../../hooks/useLocalStorage';

// 3. Text (Help and Info)
const getHelpInfo = () => (
  <div className="space-y-4 font-['Outfit']">
    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">
      <FormattedMessage id="clock.help.title" defaultMessage="How to Use the Clock" />
    </h3>
    <div className="space-y-3">
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center text-xs font-black text-indigo-600 shrink-0">1</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">
          <FormattedMessage 
            id="clock.help.step1" 
            defaultMessage="Click <b>Time Now</b> to see the real time, or <b>Set Time</b> to change it."
            values={{
              b: (chunks: React.ReactNode) => <b>{chunks}</b>
            }}
          />
        </p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center text-xs font-black text-blue-600 shrink-0">2</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">
          <FormattedMessage 
            id="clock.help.step2" 
            defaultMessage="Move the <b>clock hands</b> or use the <b>arrows</b> on the numbers."
            values={{
              b: (chunks: React.ReactNode) => <b>{chunks}</b>
            }}
          />
        </p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-slate-50 flex items-center justify-center text-xs font-black text-slate-600 shrink-0">3</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">
          <FormattedMessage 
            id="clock.help.step3" 
            defaultMessage="The <b>black hand</b> is for hours, the <b>blue hand</b> is for minutes, and the <b>red hand</b> is for seconds."
            values={{
              b: (chunks: React.ReactNode) => <b>{chunks}</b>
            }}
          />
        </p>
      </div>
    </div>
  </div>
);

const getTimeInWords = (date: Date, intl: IntlShape) => {
  const h = date.getHours();
  const m = date.getMinutes();
  
  const hourName = intl.formatMessage({ id: `clock.number.${h % 12 || 12}` });
  const nextHourName = intl.formatMessage({ id: `clock.number.${(h + 1) % 12 || 12}` });

  if (m === 0) return intl.formatMessage({ id: 'clock.words.oclock' }, { hour: hourName });
  if (m === 15) return intl.formatMessage({ id: 'clock.words.quarter_past' }, { hour: hourName });
  if (m === 30) return intl.formatMessage({ id: 'clock.words.half_past' }, { hour: hourName });
  if (m === 45) return intl.formatMessage({ id: 'clock.words.quarter_to' }, { hour: nextHourName });
  
  if (m < 30) {
    if (m === 1) return intl.formatMessage({ id: 'clock.words.past.singular' }, { hour: hourName });
    if (m % 5 === 0) return intl.formatMessage({ id: 'clock.words.past.simple' }, { minutes: intl.formatMessage({ id: `clock.number.${m}` }), hour: hourName });
    return intl.formatMessage({ id: 'clock.words.past.plural' }, { minutes: intl.formatMessage({ id: `clock.number.${m}` }), hour: hourName });
  } else {
    const remaining = 60 - m;
    if (remaining === 1) return intl.formatMessage({ id: 'clock.words.to.singular' }, { hour: nextHourName });
    if (remaining % 5 === 0) return intl.formatMessage({ id: 'clock.words.to.simple' }, { minutes: intl.formatMessage({ id: `clock.number.${remaining}` }), hour: nextHourName });
    return intl.formatMessage({ id: 'clock.words.to.plural' }, { minutes: intl.formatMessage({ id: `clock.number.${remaining}` }), hour: nextHourName });
  }
};

const getAngle = (e: MouseEvent | PointerEvent, svgRef: React.RefObject<SVGSVGElement>) => {
  if (!svgRef.current) return 0;
  const rect = svgRef.current.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  const x = e.clientX - centerX;
  const y = e.clientY - centerY;
  let angle = Math.atan2(y, x) * (180 / Math.PI) + 90;
  if (angle < 0) angle += 360;
  return angle;
};

// 7. Component
export const AnalogueDigitalClock = () => {
  const { clearHeader, setHelpContent, setHasConfig } = useHeader();
  const { settings } = useSettings();
  const intl = useIntl();
  const [storedTime, setStoredTime] = useLocalStorage<number>('clock_time', new Date().getTime());
  const [time, setTime] = useState(new Date(storedTime));
  const [isEditing, setIsEditing] = useLocalStorage<boolean>('clock_is_editing', false);
  const svgRef = useRef<SVGSVGElement>(null);
  const isDragging = useRef(false);
  const dragType = useRef<'hour' | 'minute' | null>(null);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 1024 : false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!isEditing && !isDragging.current) {
      const timer = setInterval(() => {
        const now = new Date();
        setTime(now);
        setStoredTime(now.getTime());
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isEditing, setStoredTime]);


  useEffect(() => {
    setHelpContent(getHelpInfo());
    setHasConfig(false);
    return () => clearHeader();
  }, [clearHeader, setHelpContent, setHasConfig, intl]);

  const handlePointerDown = (e: React.PointerEvent, type: 'hour' | 'minute') => {
    e.preventDefault();
    isDragging.current = true;
    dragType.current = type;
    setIsEditing(true);
    audioEngine.playTick(settings.soundTheme);
  };

  const handlePointerMove = useCallback((e: PointerEvent) => {
    if (!isDragging.current || !dragType.current) return;
    const angle = getAngle(e, svgRef);

    setTime(prevTime => {
      const newTime = new Date(prevTime);
      if (dragType.current === 'minute') {
        const minutes = Math.round((angle / 360) * 60) % 60;
        if (newTime.getMinutes() !== minutes) {
          newTime.setMinutes(minutes);
          setStoredTime(newTime.getTime());
          return newTime;
        }
      } else if (dragType.current === 'hour') {
        const hours = Math.round((angle / 360) * 12) % 12;
        const isCurrentlyPM = newTime.getHours() >= 12;
        newTime.setHours(isCurrentlyPM ? hours + 12 : hours);
        if (prevTime.getHours() !== newTime.getHours()) {
          setStoredTime(newTime.getTime());
          return newTime;
        }
      }
      return prevTime;
    });
  }, [setStoredTime]);

  const handlePointerUp = useCallback(() => {
    isDragging.current = false;
    dragType.current = null;
  }, []);

  useEffect(() => {
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [handlePointerMove, handlePointerUp]);

  const adjustHours = (delta: number) => {
    setTime(prev => {
      const newTime = new Date(prev);
      newTime.setHours((newTime.getHours() + delta + 24) % 24);
      setStoredTime(newTime.getTime());
      return newTime;
    });
    audioEngine.playTick(settings.soundTheme);
  };

  const adjustMinutes = (delta: number) => {
    setTime(prev => {
      const newTime = new Date(prev);
      newTime.setMinutes((newTime.getMinutes() + delta + 60) % 60);
      setStoredTime(newTime.getTime());
      return newTime;
    });
    audioEngine.playTick(settings.soundTheme);
  };

  const toggleAMPM = () => {
    setTime(prev => {
      const newTime = new Date(prev);
      newTime.setHours((newTime.getHours() + 12) % 24);
      setStoredTime(newTime.getTime());
      return newTime;
    });
    audioEngine.playTick(settings.soundTheme);
  };


  return (
    <div className="w-full h-full font-['Outfit'] select-none overflow-hidden">
      <ToolPanel 
        className="font-['Outfit'] select-none italic flex-1" 
        baseWidth={isMobile ? 400 : 1400} 
        baseHeight={isMobile ? 950 : 900}
        alignTop={isMobile}
      >
        {/* Using Grid for more reliable side-by-side behavior on 1400x900 */}
        <div className={`grid grid-cols-1 lg:grid-cols-2 items-center justify-items-center gap-6 md:gap-12 lg:gap-24 relative z-10 w-full h-full md:px-12 md:max-w-[1300px] mx-auto ${isMobile ? 'pt-4' : ''}`}>
          
          {/* Left Side: Analogue Clock & Controls */}
          <div className={`flex flex-col items-center w-full ${isMobile ? 'gap-4' : 'gap-6 md:gap-10'}`}>
            {/* 1. Analogue Clock */}
            <div className="w-[300px] md:w-[450px] aspect-square relative group/clock">
              <div className="relative w-full h-full rounded-full bg-white flex items-center justify-center border-8 border-indigo-100 transition-transform duration-700 group-hover/clock:scale-[1.02]">
                <svg
                  ref={svgRef}
                  viewBox="0 0 100 100"
                  className="w-full h-full"
                  style={{ touchAction: 'none' }}
                >
                  {/* Ticks */}
                  {[...Array(60)].map((_, i) => {
                    const isMajor = i % 5 === 0;
                    const y1 = "2";
                    const y2 = isMajor ? "8" : "5";
                    const strokeWidth = isMajor ? "2.5" : "1";
                    const stroke = isMajor ? "#1e293b" : "#cbd5e1";
                    
                    return (
                      <line
                        key={i}
                        x1="50" y1={y1} x2="50" y2={y2}
                        stroke={stroke}
                        strokeWidth={strokeWidth}
                        transform={`rotate(${i * 6} 50 50)`}
                      />
                    );
                  })}

                  {/* Numbers */}
                  {[...Array(12)].map((_, i) => {
                    const yPos = 20;
                    const fontSize = "11";
                    const className = "font-['Outfit'] select-none pointer-events-none font-bold";
                    
                    return (
                      <text
                        key={i}
                        x="50"
                        y={yPos}
                        fill="#1e293b"
                        fontSize={fontSize}
                        textAnchor="middle"
                        alignmentBaseline="middle"
                        transform={`rotate(${(i + 1) * 30} 50 50) rotate(${-(i + 1) * 30} 50 ${yPos})`}
                        className={className}
                      >
                        {i + 1}
                      </text>
                    );
                  })}

                  {/* Hour Hand */}
                  <g 
                    transform={`rotate(${(time.getHours() % 12) * 30 + time.getMinutes() * 0.5} 50 50)`}
                    onPointerDown={(e) => handlePointerDown(e, 'hour')}
                    className={isEditing ? "cursor-grab active:cursor-grabbing" : "pointer-events-none"}
                  >
                    <line
                      x1="50" y1="50" x2="50" y2="28"
                      stroke="#1e293b"
                      strokeWidth="6"
                      strokeLinecap="round"
                    />
                    <path d="M 50 28 L 47 33 L 53 33 Z" fill="#1e293b" />
                    {isEditing && <circle cx="50" cy="28" r="15" fill="transparent" />}
                  </g>

                  {/* Minute Hand */}
                  <g 
                    transform={`rotate(${time.getMinutes() * 6} 50 50)`}
                    onPointerDown={(e) => handlePointerDown(e, 'minute')}
                    className={isEditing ? "cursor-grab active:cursor-grabbing" : "pointer-events-none"}
                  >
                    <line
                      x1="50" y1="50" x2="50" y2="12"
                      stroke="#2563eb"
                      strokeWidth="4"
                      strokeLinecap="round"
                    />
                    <path d="M 50 12 L 48 18 L 52 18 Z" fill="#2563eb" />
                    {isEditing && <circle cx="50" cy="12" r="15" fill="transparent" />}
                  </g>

                  {/* Second Hand */}
                  {!isEditing && (
                    <g transform={`rotate(${time.getSeconds() * 6} 50 50)`}>
                      <line
                        x1="50" y1="55" x2="50" y2="8"
                        stroke="#ef4444"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                      <circle cx="50" cy="50" r="3" fill="#ef4444" stroke="white" strokeWidth="1" />
                    </g>
                  )}

                  <circle cx="50" cy="50" r="2.5" fill="#1e293b" />
                </svg>
              </div>
            </div>

            {/* 2. Time Controls */}
            <div className="flex bg-slate-100 p-1.5 md:p-2 rounded-2xl border-2 border-white backdrop-blur-md">
              <button 
                onClick={() => { setIsEditing(false); setTime(new Date()); audioEngine.playTick(settings.soundTheme); }} 
                className={`px-6 md:px-8 py-2 md:py-3 text-[10px] font-black transition-all uppercase tracking-[0.2em] rounded-xl italic ${!isEditing ? 'bg-indigo-600 text-white ' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <FormattedMessage id="clock.controls.now" defaultMessage="Time Now" />
              </button>
              <button 
                onClick={() => { setIsEditing(true); audioEngine.playTick(settings.soundTheme); }} 
                className={`px-6 md:px-8 py-2 md:py-3 text-[10px] font-black transition-all uppercase tracking-[0.2em] rounded-xl italic ${isEditing ? 'bg-indigo-600 text-white ' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <FormattedMessage id="clock.controls.set" defaultMessage="Set Time" />
              </button>
            </div>
          </div>

          {/* Right Side: Digital & Word Clocks */}
          <div className={`flex flex-col items-center w-full max-w-xl ${isMobile ? 'gap-4' : 'gap-6 md:gap-10'}`}>
            {/* 3. Digital Clock */}
            <div className="w-full bg-white rounded-[2rem] md:rounded-[2.5rem] border-4 border-white flex items-center justify-center py-6 md:py-10 px-4 md:px-10 gap-3 md:gap-6 relative">
              {/* Hours with Arrows */}
              <div className="relative flex flex-col items-center group/edit">
                <AnimatePresence>
                  {isEditing && (
                    <motion.button 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      onClick={() => adjustHours(1)} 
                      className="absolute -top-12 text-slate-300 hover:text-indigo-600 transition-colors p-2"
                    >
                      <ChevronUp size={32} strokeWidth={3} />
                    </motion.button>
                  )}
                </AnimatePresence>

                <div className="text-5xl md:text-6xl lg:text-8xl font-black tabular-nums tracking-tighter text-slate-800 italic">
                  {(time.getHours() % 12 || 12).toString().padStart(2, '0')}
                </div>

                <AnimatePresence>
                  {isEditing && (
                    <motion.button 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      onClick={() => adjustHours(-1)} 
                      className="absolute -bottom-12 text-slate-300 hover:text-indigo-600 transition-colors p-2"
                    >
                      <ChevronDown size={32} strokeWidth={3} />
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>

              <div className="text-5xl lg:text-7xl font-black text-indigo-600 animate-pulse">:</div>

              {/* Minutes with Arrows */}
              <div className="relative flex flex-col items-center group/edit">
                <AnimatePresence>
                  {isEditing && (
                    <motion.button 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      onClick={() => adjustMinutes(1)} 
                      className="absolute -top-12 text-slate-300 hover:text-indigo-600 transition-colors p-2"
                    >
                      <ChevronUp size={32} strokeWidth={3} />
                    </motion.button>
                  )}
                </AnimatePresence>

                <div className="text-5xl md:text-6xl lg:text-8xl font-black tabular-nums tracking-tighter text-indigo-600 italic">
                  {time.getMinutes().toString().padStart(2, '0')}
                </div>

                <AnimatePresence>
                  {isEditing && (
                    <motion.button 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      onClick={() => adjustMinutes(-1)} 
                      className="absolute -bottom-12 text-slate-300 hover:text-indigo-600 transition-colors p-2"
                    >
                      <ChevronDown size={32} strokeWidth={3} />
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>

              <div className="text-3xl md:text-5xl lg:text-7xl font-black text-slate-300">:</div>
              <div className="text-3xl md:text-4xl lg:text-6xl font-black tabular-nums text-rose-500 italic">
                {time.getSeconds().toString().padStart(2, '0')}
              </div>

              {/* AM/PM with Toggles */}
              <div className="flex flex-col ml-4 relative items-center group/edit">
                <AnimatePresence>
                  {isEditing && (
                    <motion.button 
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      onClick={toggleAMPM}
                      className="absolute -top-10 text-indigo-400 hover:text-indigo-600 transition-colors"
                    >
                      <ChevronUp size={24} strokeWidth={3} />
                    </motion.button>
                  )}
                </AnimatePresence>

                <span className="text-xs font-black text-slate-400 uppercase tracking-widest leading-none">
                  <FormattedMessage id="clock.status" defaultMessage="Status" />
                </span>
                <span className={`text-xl lg:text-3xl font-black text-indigo-600 uppercase italic ${isEditing ? 'cursor-pointer hover:scale-110' : ''}`} onClick={isEditing ? toggleAMPM : undefined}>
                  {time.getHours() >= 12 ? 'PM' : 'AM'}
                </span>

                <AnimatePresence>
                  {isEditing && (
                    <motion.button 
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      onClick={toggleAMPM}
                      className="absolute -bottom-10 text-indigo-400 hover:text-indigo-600 transition-colors"
                    >
                      <ChevronDown size={24} strokeWidth={3} />
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* 4. Word Clock */}
            <div className="w-full bg-white rounded-[2rem] md:rounded-[2.5rem] border-4 border-slate-200 flex items-center justify-center py-6 md:py-10 lg:py-14">
              <h2 className="w-full text-xl md:text-3xl lg:text-5xl font-black text-slate-800 tracking-tight italic uppercase px-6 md:px-8 leading-tight min-h-[2.5em] flex items-center justify-center text-center">
                {getTimeInWords(time, intl)}
              </h2>
            </div>
          </div>
        </div>
      </ToolPanel>
    </div>
  );
};

export default AnalogueDigitalClock;
