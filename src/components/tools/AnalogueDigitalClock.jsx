import React, { useState, useEffect, useRef } from 'react';
import { Clock, ChevronUp, ChevronDown } from 'lucide-react';
import { ToolHeader } from '../ToolHeader';

const getNumberWords = (n) => {
  const words = [
    "zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten",
    "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen",
    "twenty", "twenty-one", "twenty-two", "twenty-three", "twenty-four", "twenty-five", "twenty-six", "twenty-seven", "twenty-eight", "twenty-nine"
  ];
  return words[n];
};

const getTimeInWords = (date) => {
  const hours = [
    "twelve", "one", "two", "three", "four", "five", "six", 
    "seven", "eight", "nine", "ten", "eleven"
  ];
  const h = date.getHours();
  const m = date.getMinutes();
  
  const hourName = hours[h % 12];
  const nextHourName = hours[(h + 1) % 12];

  if (m === 0) return `${hourName} o'clock`;
  if (m === 15) return `quarter past ${hourName}`;
  if (m === 30) return `half past ${hourName}`;
  if (m === 45) return `quarter to ${nextHourName}`;
  
  if (m < 30) {
    if (m === 1) return `one minute past ${hourName}`;
    if (m % 5 === 0) return `${getNumberWords(m)} past ${hourName}`;
    return `${getNumberWords(m)} minutes past ${hourName}`;
  } else {
    const remaining = 60 - m;
    if (remaining === 1) return `one minute to ${nextHourName}`;
    if (remaining % 5 === 0) return `${getNumberWords(remaining)} to ${nextHourName}`;
    return `${getNumberWords(remaining)} minutes to ${nextHourName}`;
  }
};


export const AnalogueDigitalClock = () => {
  const [time, setTime] = useState(new Date());
  const [isEditing, setIsEditing] = useState(false);
  const svgRef = useRef(null);
  const isDragging = useRef(false);

  useEffect(() => {
    if (!isEditing && !isDragging.current) {
      const timer = setInterval(() => setTime(new Date()), 1000);
      return () => clearInterval(timer);
    }
  }, [isEditing]);

  const getAngle = (e) => {
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

  const handlePointerDown = () => {
    isDragging.current = true;
    setIsEditing(true); // Stop auto-ticking
  };

  const handlePointerMove = (e, type) => {
    if (!isDragging.current) return;
    const angle = getAngle(e);
    const newTime = new Date(time);

    if (type === 'minute') {
      const minutes = Math.round((angle / 360) * 60) % 60;
      newTime.setMinutes(minutes);
    } else if (type === 'hour') {
      const hours = Math.round((angle / 360) * 12) % 12;
      newTime.setHours(newTime.getHours() >= 12 ? hours + 12 : hours);
    }
    setTime(newTime);
  };

  const handlePointerUp = () => {
    isDragging.current = false;
  };

  const adjustHours = (delta) => {
    const newTime = new Date(time);
    newTime.setHours((newTime.getHours() + delta + 24) % 24);
    setTime(newTime);
  };

  const adjustMinutes = (delta) => {
    const newTime = new Date(time);
    newTime.setMinutes((newTime.getMinutes() + delta + 60) % 60);
    setTime(newTime);
  };

  const toggleAMPM = () => {
    const newTime = new Date(time);
    newTime.setHours((newTime.getHours() + 12) % 24);
    setTime(newTime);
  };

  useEffect(() => {
    window.addEventListener('pointerup', handlePointerUp);
    return () => window.removeEventListener('pointerup', handlePointerUp);
  }, []);

  const formatDigital = (date, includeSeconds = false) => {
    const h = date.getHours();
    const displayH = h % 12 || 12;
    const m = date.getMinutes().toString().padStart(2, '0');
    const ampm = h >= 12 ? 'PM' : 'AM';
    
    if (includeSeconds) {
      const s = date.getSeconds().toString().padStart(2, '0');
      return `${displayH}:${m}:${s} ${ampm}`;
    }
    return `${displayH}:${m} ${ampm}`;
  };

  return (
    <div className="w-full mx-auto px-4 pt-2 pb-8 h-full flex flex-col gap-8 select-none">
      <ToolHeader
        title="Analogue & Digital Clock"
        icon={Clock}
        description="Analogue and Digital Time Explorer"
        infoContent={
          <>
            <p>
              <strong className="text-white block mb-1">Time Modes</strong>
              Use "Real Time Mode" to follow the actual clock, or "Edit Mode" to manually adjust the time for lessons.
            </p>
            <p>
              <strong className="text-white block mb-1">Draggable Hands</strong>
              In Edit Mode, you can drag the hour and minute hands directly on the analogue clock to see how the digital time changes.
            </p>
          </>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 w-full max-w-6xl items-center justify-items-center mx-auto">
        {/* Empty left column for alignment */}
        <div className="hidden lg:block"></div>

        {/* Center Column: Clock Displays */}
        <div className="flex flex-col items-center space-y-4">
          {/* Analogue Clock */}
          <div className="relative w-72 h-72 md:w-80 md:h-80 bg-white rounded-full shadow-2xl border-4 border-primary/20 flex items-center justify-center">
            <svg
              ref={svgRef}
              viewBox="0 0 100 100"
              className="w-full h-full p-2"
              style={{ touchAction: 'none' }}
            >
              <circle cx="50" cy="50" r="48" fill="white" stroke="#e2e8f0" strokeWidth="2" />

              {/* Clock numbers */}
              {[...Array(12)].map((_, i) => (
                <text
                  key={i}
                  x="50"
                  y="15"
                  fill="#0f172a"
                  fontSize="8"
                  fontWeight="bold"
                  textAnchor="middle"
                  alignmentBaseline="middle"
                  transform={`rotate(${(i + 1) * 30} 50 50) rotate(${-(i + 1) * 30} 50 15)`}
                >
                  {i + 1}
                </text>
              ))}

              {/* Hour Hand */}
              <g transform={`rotate(${(time.getHours() % 12) * 30 + time.getMinutes() * 0.5} 50 50)`}>
                <line
                  x1="50" y1="50" x2="50" y2="25"
                  stroke="#0f172a"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
                {isEditing && (
                  <line
                    x1="50" y1="50" x2="50" y2="25"
                    stroke="transparent"
                    strokeWidth="15"
                    strokeLinecap="round"
                    onPointerDown={handlePointerDown}
                    onPointerMove={(e) => handlePointerMove(e, 'hour')}
                    className="cursor-pointer"
                  />
                )}
              </g>

              {/* Minute Hand */}
              <g transform={`rotate(${time.getMinutes() * 6} 50 50)`}>
                <line
                  x1="50" y1="50" x2="50" y2="15"
                  stroke="#3b82f6"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                {isEditing && (
                  <line
                    x1="50" y1="50" x2="50" y2="15"
                    stroke="transparent"
                    strokeWidth="15"
                    strokeLinecap="round"
                    onPointerDown={handlePointerDown}
                    onPointerMove={(e) => handlePointerMove(e, 'minute')}
                    className="cursor-pointer"
                  />
                )}
              </g>

              {!isEditing && (
                <line
                  x1="50" y1="50" x2="50" y2="15"
                  stroke="#ef4444"
                  strokeWidth="1"
                  transform={`rotate(${time.getSeconds() * 6} 50 50)`}
                />
              )}

              <circle cx="50" cy="50" r="3" fill="#0f172a" />
            </svg>
          </div>

          {/* Compact Toggle Between Clocks */}
          <div className="flex bg-slate-100 p-1 rounded-full border border-slate-200 shadow-inner w-full max-w-[240px]">
            <button
              onClick={() => {
                setIsEditing(false);
                setTime(new Date());
              }}
              className={`flex-1 px-4 py-1.5 rounded-full transition-all font-black text-[10px] uppercase tracking-widest ${!isEditing ? 'bg-white text-primary shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Real Time
            </button>
            <button
              onClick={() => {
                setIsEditing(true);
              }}
              className={`flex-1 px-4 py-1.5 rounded-full transition-all font-black text-[10px] uppercase tracking-widest ${isEditing ? 'bg-white text-primary shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Edit Mode
            </button>
          </div>

          {/* Digital Time with Floating Controls & English Time Words */}
          <div className="flex flex-col items-center w-fit">
            <div className="bg-slate-900 px-10 py-8 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] border-4 border-slate-800 relative group w-full">
              {/* Glow effect */}
              <div className="absolute inset-0 bg-primary/5 rounded-[2.5rem] blur-xl group-hover:bg-primary/10 transition-colors" />
              
              <div className="relative flex items-center space-x-6">
                {/* Hours */}
                <div className="relative flex flex-col items-center">
                  <button 
                    onClick={() => adjustHours(1)}
                    className={`absolute -top-14 p-1 hover:bg-white/10 rounded-full transition-all duration-300 text-slate-500 hover:text-primary ${!isEditing ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
                  >
                    <ChevronUp size={48} />
                  </button>
                  <div className="w-[110px] text-center text-7xl md:text-8xl font-mono font-bold tabular-nums tracking-tighter text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
                    {(time.getHours() % 12 || 12).toString().padStart(2, '0')}
                  </div>
                  <button 
                    onClick={() => adjustHours(-1)}
                    className={`absolute -bottom-14 p-1 hover:bg-white/10 rounded-full transition-all duration-300 text-slate-500 hover:text-primary ${!isEditing ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
                  >
                    <ChevronDown size={48} />
                  </button>
                </div>

                <span className="text-7xl md:text-8xl font-mono font-bold text-slate-600 animate-pulse">:</span>

                {/* Minutes */}
                <div className="relative flex flex-col items-center">
                  <button 
                    onClick={() => adjustMinutes(1)}
                    className={`absolute -top-14 p-1 hover:bg-white/10 rounded-full transition-all duration-300 text-slate-500 hover:text-primary ${!isEditing ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
                  >
                    <ChevronUp size={48} />
                  </button>
                  <div className="w-[110px] text-center text-7xl md:text-8xl font-mono font-bold tabular-nums tracking-tighter text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
                    {time.getMinutes().toString().padStart(2, '0')}
                  </div>
                  <button 
                    onClick={() => adjustMinutes(-1)}
                    className={`absolute -bottom-14 p-1 hover:bg-white/10 rounded-full transition-all duration-300 text-slate-500 hover:text-primary ${!isEditing ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
                  >
                    <ChevronDown size={48} />
                  </button>
                </div>

                {/* AM/PM Column */}
                <div className="relative flex flex-col items-center ml-4">
                  <button 
                    onClick={toggleAMPM}
                    className={`absolute -top-14 p-1 hover:bg-white/10 rounded-full transition-all duration-300 text-slate-500 hover:text-primary ${!isEditing ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
                  >
                    <ChevronUp size={48} />
                  </button>
                  <div className="text-4xl md:text-5xl font-mono font-black text-primary drop-shadow-[0_0_15px_rgba(99,102,241,0.5)] bg-primary/10 px-4 py-2 rounded-xl border border-primary/20">
                    {time.getHours() >= 12 ? 'PM' : 'AM'}
                  </div>
                  <button 
                    onClick={toggleAMPM}
                    className={`absolute -bottom-14 p-1 hover:bg-white/10 rounded-full transition-all duration-300 text-slate-500 hover:text-primary ${!isEditing ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
                  >
                    <ChevronDown size={48} />
                  </button>
                </div>

                {/* Seconds - Always rendered but hidden in Edit Mode to keep width stable */}
                <div className={`flex items-center space-x-6 transition-all duration-300 ${isEditing ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                  <span className="text-5xl md:text-6xl font-mono font-bold text-slate-600">:</span>
                  <div className="w-[80px] text-center text-5xl md:text-6xl font-mono font-bold tabular-nums tracking-tighter text-red-500/80 drop-shadow-[0_0_8px_rgba(239,68,68,0.4)]">
                    {time.getSeconds().toString().padStart(2, '0')}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-8 text-center px-6 py-4 bg-primary/5 rounded-2xl border border-primary/10 w-full shadow-sm">
              <p className="text-xl md:text-2xl font-black text-primary capitalize leading-tight">
                {getTimeInWords(time)}
              </p>
            </div>
            
            <p className="text-center text-[10px] text-slate-400 font-black tracking-[0.2em] uppercase mt-4 opacity-60">
              {isEditing ? "Manual adjustment active" : "Real-time sync active"}
            </p>
          </div>

        </div>

        {/* Right Column: Empty for centering alignment */}
        <div className="hidden lg:block w-full max-w-[320px]"></div>
      </div>
    </div>
  );
};
