import React, { useState, useEffect, useRef } from 'react';

export const AnalogueDigitalClock = () => {
  const [time, setTime] = useState(new Date());
  const [digitalInput, setDigitalInput] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const svgRef = useRef(null);
  const isDragging = useRef(false);

  useEffect(() => {
    if (!isEditing && !isDragging.current) {
      const timer = setInterval(() => setTime(new Date()), 1000);
      return () => clearInterval(timer);
    }
  }, [isEditing]);

  const handleDigitalSubmit = (e) => {
    e.preventDefault();
    const [hours, minutes] = digitalInput.split(':').map(Number);
    if (!isNaN(hours) && !isNaN(minutes) && hours >= 0 && hours < 24 && minutes >= 0 && minutes < 60) {
      const newTime = new Date(time);
      newTime.setHours(hours);
      newTime.setMinutes(minutes);
      newTime.setSeconds(0);
      setTime(newTime);
      setIsEditing(false);
    }
  };

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

  useEffect(() => {
    window.addEventListener('pointerup', handlePointerUp);
    return () => window.removeEventListener('pointerup', handlePointerUp);
  }, []);

  const formatDigital = (date, includeSeconds = false) => {
    if (includeSeconds) {
      return date.toTimeString().slice(0, 8);
    }
    return date.toTimeString().slice(0, 5);
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-8">
      <div className="flex flex-col items-center gap-4">
        <h2 className="text-3xl font-bold text-primary">Interactive Clock</h2>
        <div className="flex items-center gap-4 bg-white p-2 rounded-xl shadow-sm border-2 border-gray-100">
          <button
            onClick={() => {
              setIsEditing(false);
              setTime(new Date());
            }}
            className={`px-4 py-2 rounded-lg font-bold transition-colors ${!isEditing ? 'bg-primary text-white' : 'text-gray-500 hover:bg-gray-100'}`}
          >
            Real Time Mode
          </button>
          <button
            onClick={() => {
              setIsEditing(true);
              setDigitalInput(formatDigital(time, false));
            }}
            className={`px-4 py-2 rounded-lg font-bold transition-colors ${isEditing ? 'bg-primary text-white' : 'text-gray-500 hover:bg-gray-100'}`}
          >
            Edit Mode
          </button>
        </div>
      </div>

      {/* Analogue Clock */}
      <div className="relative w-80 h-80 bg-white rounded-full shadow-2xl border-4 border-primary/20 flex items-center justify-center">
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
              className="transition-colors group-hover:stroke-primary"
            />
            {/* Invisible wider line for easier clicking/dragging */}
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
              className="transition-colors group-hover:stroke-secondary"
            />
            {/* Invisible wider line for easier clicking/dragging */}
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

          {/* Second Hand */}
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

      {/* Digital Input */}
      <div className="bg-white p-6 rounded-2xl shadow-lg border-2 border-primary/10">
        {isEditing ? (
          <form onSubmit={handleDigitalSubmit} className="flex flex-col items-center space-y-4">
            <input
              type="time"
              value={digitalInput || formatDigital(time, false)}
              onChange={(e) => setDigitalInput(e.target.value)}
              className="text-4xl font-bold text-center bg-gray-50 border-2 border-primary/50 rounded-lg p-2 focus:outline-none focus:border-primary"
              autoFocus
            />
            <div className="flex space-x-4">
              <button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90">Set Time</button>
            </div>
          </form>
        ) : (
          <div className="text-5xl font-mono font-bold text-text transition-colors">
            {formatDigital(time, true)}
          </div>
        )}
        <p className="text-center text-sm text-gray-500 mt-2">
          {isEditing ? "Edit time below or drag the clock hands!" : "Switch to Edit Mode to change the time!"}
        </p>
      </div>
    </div>
  );
};
