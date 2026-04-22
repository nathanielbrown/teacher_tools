import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX, Mic, MicOff, Settings2, AlertTriangle, ShieldAlert, ShieldCheck } from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';

export const SoundLevel = () => {
  const [volume, setVolume] = useState(0);
  const [threshold, setThreshold] = useState(60);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [permissionError, setPermissionError] = useState(null);
  
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const streamRef = useRef(null);
  const animationRef = useRef(null);
  const lastVolumeRef = useRef(0);
  const thresholdRef = useRef(threshold);
  const volumeBuffer = useRef([]); // To store 2 seconds of volume samples (~120 samples at 60fps)
  const [avgVolume, setAvgVolume] = useState(0);

  // Update threshold ref when state changes
  useEffect(() => {
    thresholdRef.current = threshold;
  }, [threshold]);

  const { settings } = useSettings();

  const startMonitoring = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      audioContextRef.current = new AudioContext();
      
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      analyserRef.current.smoothingTimeConstant = 0.8;
      
      source.connect(analyserRef.current);
      
      setIsMonitoring(true);
      setPermissionError(null);
      updateVolume();
    } catch (err) {
      console.warn('Microphone access issue:', err);
      if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setPermissionError('No microphone was found on your device. Please plug in a microphone or ensure it is enabled in your system settings.');
      } else if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setPermissionError('Microphone access was denied. Please allow microphone access in your browser settings to use this tool.');
      } else {
        setPermissionError('An error occurred while trying to access the microphone. Please check your connection and try again.');
      }
    }
  };

  const stopMonitoring = () => {
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    setIsMonitoring(false);
    setVolume(0);
    setAvgVolume(0);
    lastVolumeRef.current = 0;
    volumeBuffer.current = [];
  };

  const updateVolume = () => {
    if (!analyserRef.current) return;
    
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);
    
    // Calculate average volume of current frame
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i];
    }
    const average = sum / dataArray.length;
    
    // Map average (0-255) to a more usable range (0-100)
    const currentFrameVolume = Math.min(100, Math.round((average / 128) * 100));
    
    // Apply temporal smoothing (EMA) for the real-time display
    const alpha = 0.15; 
    const smoothedVolume = (currentFrameVolume * alpha) + (lastVolumeRef.current * (1 - alpha));
    lastVolumeRef.current = smoothedVolume;
    
    // Rolling average calculation (2 seconds = ~120 frames at 60fps)
    volumeBuffer.current.push(smoothedVolume);
    if (volumeBuffer.current.length > 120) {
      volumeBuffer.current.shift();
    }
    const currentRollingAvg = volumeBuffer.current.reduce((a, b) => a + b, 0) / volumeBuffer.current.length;
    
    setVolume(Math.round(smoothedVolume));
    setAvgVolume(Math.round(currentRollingAvg));
    
    animationRef.current = requestAnimationFrame(updateVolume);
  };

  useEffect(() => {
    return () => stopMonitoring();
  }, []);

  const getStatus = () => {
    if (volume >= threshold) return 'danger';
    // Warning if rolling average is within 20% of the threshold (>= 80% threshold)
    if (avgVolume >= threshold * 0.8) return 'warning';
    return 'ok';
  };

  const [isDragging, setIsDragging] = useState(false);

  // Global drag handling for smoothness
  useEffect(() => {
    const handleGlobalMouseMove = (e) => {
      if (!isDragging) return;
      
      const gauge = document.querySelector('.gauge-svg');
      if (!gauge) return;
      
      const rect = gauge.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      // Calculate angle from center to mouse
      let angle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI) + 90;
      angle = (angle + 360) % 360;
      
      // Convert angle to 0-100 threshold
      const newThreshold = Math.max(5, Math.min(100, Math.round(angle / 3.6)));
      setThreshold(newThreshold);
    };

    const handleGlobalMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleGlobalMouseMove);
      window.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging]);

  const status = getStatus();

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 h-full flex flex-col gap-8">
      {/* Header */}
      <div className="bg-white p-8 rounded-[2.5rem] border-2 border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-50 rounded-2xl text-blue-600">
              <Volume2 size={32} />
            </div>
            <h2 className="text-4xl font-black text-slate-800 tracking-tight">Sound Level</h2>
          </div>
          <p className="text-slate-400 font-medium pl-1">Monitor classroom noise levels visually.</p>
        </div>

        <button
          onClick={isMonitoring ? stopMonitoring : startMonitoring}
          className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-black transition-all shadow-lg active:scale-95 ${
            isMonitoring 
              ? 'bg-red-50 text-red-600 hover:bg-red-100' 
              : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200'
          }`}
        >
          {isMonitoring ? <MicOff size={24} /> : <Mic size={24} />}
          {isMonitoring ? 'STOP MONITORING' : 'START MONITORING'}
        </button>
      </div>

      {permissionError ? (
        <div className="flex-1 bg-white rounded-[3rem] border-4 border-dashed border-red-200 flex flex-col items-center justify-center p-12 text-center gap-6">
          <div className="p-6 bg-red-50 text-red-500 rounded-full">
            <AlertTriangle size={64} strokeWidth={1.5} />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-black text-slate-800">Microphone Required</h3>
            <p className="text-slate-500 max-w-md mx-auto">{permissionError}</p>
          </div>
          <button
            onClick={startMonitoring}
            className="px-8 py-3 bg-red-600 text-white rounded-xl font-black hover:bg-red-700 transition-all"
          >
            TRY AGAIN
          </button>
        </div>
      ) : (
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Main Visualizer Area */}
          <div className={`lg:col-span-8 bg-white rounded-[3rem] border-2 border-slate-200 shadow-sm p-12 flex flex-col items-center justify-center relative overflow-hidden ${isDragging ? 'cursor-grabbing' : ''}`}>
            {/* Status Background Glow */}
            <AnimatePresence>
              {status === 'danger' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-red-600"
                />
              )}
            </AnimatePresence>
 
            {/* Gauge */}
            <div className="relative w-full max-w-md aspect-square flex items-center justify-center">
              <svg className="absolute inset-0 w-full h-full gauge-svg" viewBox="0 0 100 100">
                {/* Background Ring */}
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="#f1f5f9"
                  strokeWidth="8"
                />
                
                {/* Rolling Average Ring (Subtle) */}
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="#e2e8f0"
                  strokeWidth="4"
                  strokeDasharray="282.7"
                  strokeDashoffset={282.7 - (282.7 * avgVolume) / 100}
                  className="transition-all duration-300 -rotate-90 origin-center"
                />

                {/* Current Volume Ring */}
                <motion.circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke={status === 'danger' ? '#ef4444' : status === 'warning' ? '#f59e0b' : '#22c55e'}
                  strokeWidth="8"
                  strokeDasharray="282.7"
                  animate={{ strokeDashoffset: 282.7 - (282.7 * volume) / 100 }}
                  transition={{ type: 'spring', damping: 20, stiffness: 60 }}
                  className="-rotate-90 origin-center"
                />

                {/* Threshold Marker & Handle */}
                <g 
                  className="threshold-handle cursor-grab active:cursor-grabbing"
                  transform={`rotate(${(threshold * 3.6)}, 50, 50)`}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                >
                  <line
                    x1="50" y1="5" x2="50" y2="15"
                    stroke="#4f46e5"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                  <circle
                    cx="50" cy="5" r="4"
                    fill="#4f46e5"
                    className="shadow-lg"
                  />
                </g>
              </svg>
 
              {/* Status Icon & Value */}
              <div className="relative z-10 flex flex-col items-center gap-4">
                <motion.div
                  animate={{ scale: status === 'danger' ? [1, 1.1, 1] : 1 }}
                  transition={{ repeat: Infinity, duration: 0.5 }}
                  className={`p-6 rounded-full ${
                    status === 'danger' ? 'bg-red-50 text-red-600' : 
                    status === 'warning' ? 'bg-amber-50 text-amber-600' : 
                    'bg-green-50 text-green-600'
                  }`}
                >
                  {status === 'danger' ? <ShieldAlert size={64} /> : 
                   status === 'warning' ? <AlertTriangle size={64} /> : 
                   <ShieldCheck size={64} />}
                </motion.div>
                <div className="text-center">
                  <h3 className={`text-6xl font-black tabular-nums leading-none ${
                    status === 'danger' ? 'text-red-600' : 
                    status === 'warning' ? 'text-amber-600' : 
                    'text-slate-800'
                  }`}>
                    {status === 'danger' ? 'DANGER' : status === 'warning' ? 'WARNING' : volume}
                  </h3>
                  <div className="flex flex-col gap-1 mt-2">
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">
                      Current Level
                    </p>
                    {isMonitoring && (
                      <p className="text-indigo-400 font-black text-[10px] uppercase tracking-tighter">
                        Average: {avgVolume}%
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
 
            {!isMonitoring && (
              <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center rounded-[3rem] z-20">
                <div className="text-center space-y-4">
                  <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
                    <VolumeX size={32} />
                  </div>
                  <p className="text-slate-500 font-bold">Monitoring is paused</p>
                </div>
              </div>
            )}
          </div>

          {/* Controls Sidebar */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <div className="bg-white rounded-[2.5rem] border-2 border-slate-200 shadow-sm p-8 space-y-8 h-full">
              <div className="flex items-center gap-3 text-slate-400 font-black uppercase text-xs tracking-widest border-b-2 border-slate-50 pb-4">
                <Settings2 size={16} />
                Configuration
              </div>

              <div className="space-y-6">
                <div className="p-6 bg-slate-50 rounded-2xl border-2 border-slate-100 space-y-4">
                  <h4 className="font-black text-slate-800 text-sm uppercase tracking-wider">How it works</h4>
                  <ul className="space-y-3">
                    <li className="flex gap-3 text-xs font-medium text-slate-500">
                      <div className="w-4 h-4 bg-green-500 rounded-full shrink-0" />
                      <span>Level is fine.</span>
                    </li>
                    <li className="flex gap-3 text-xs font-medium text-slate-500">
                      <div className="w-4 h-4 bg-amber-500 rounded-full shrink-0" />
                      <span>Approaching limit! (Average in range)</span>
                    </li>
                    <li className="flex gap-3 text-xs font-medium text-slate-500">
                      <div className="w-4 h-4 bg-red-500 rounded-full shrink-0" />
                      <span>Too loud! Time to be quiet.</span>
                    </li>
                  </ul>
                </div>

                <div className="flex items-center gap-2 p-4 bg-indigo-50 text-indigo-600 rounded-2xl text-xs font-bold italic">
                  <VolumeX size={14} className="shrink-0" />
                  Drag the purple marker on the gauge to set the limit!
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
