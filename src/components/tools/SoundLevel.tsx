import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mic, 
  MicOff, 
  AlertTriangle, 
  ShieldAlert, 
  ShieldCheck, 
  Activity, 
  RefreshCcw,
  Volume2 as VolumeIcon
} from 'lucide-react';
import { useHeader } from '../../contexts/HeaderContext';
import { useSettings } from '../../contexts/SettingsContext';
import { audioEngine } from '../../utils/audio';
import { useIntl, FormattedMessage } from 'react-intl';
import ToolPanel from '../shared/ToolPanel';
import SettingsPanel from '../shared/SettingsPanel';

// 1. Constants (None)

// 2. Config (None)

// 3. Text (Help and Info)
const HelpContent = () => (
  <div className="space-y-4 font-['Outfit']">
    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">
      <FormattedMessage id="soundlevel.help.title" />
    </h3>
    <div className="space-y-3">
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center text-xs font-black text-indigo-600 shrink-0">1</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">
          <FormattedMessage 
            id="soundlevel.help.step1" 
            defaultMessage="Click <b>Start</b> to allow the microphone to listen."
            values={{ b: (chunks: React.ReactNode) => <b>{chunks}</b> }}
          />
        </p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center text-xs font-black text-indigo-600 shrink-0">2</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">
          <FormattedMessage 
            id="soundlevel.help.step2" 
            defaultMessage="Drag the <b>Purple Circle</b> to set the noise limit."
            values={{ b: (chunks: React.ReactNode) => <b>{chunks}</b> }}
          />
        </p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center text-xs font-black text-indigo-600 shrink-0">3</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">
          <FormattedMessage 
            id="soundlevel.help.step3" 
            defaultMessage="If it's too loud, the circle will turn <b>Red</b>."
            values={{ b: (chunks: React.ReactNode) => <b>{chunks}</b> }}
          />
        </p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center text-xs font-black text-indigo-600 shrink-0">4</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">
          <FormattedMessage 
            id="soundlevel.help.step4" 
            defaultMessage="Try to keep the sound level in the <b>Green</b>!"
            values={{ b: (chunks: React.ReactNode) => <b>{chunks}</b> }}
          />
        </p>
      </div>
    </div>
  </div>
);

// 4. Component
export const SoundLevel = () => {
  const intl = useIntl();
  const { setHeaderActions, setHelpContent, setOnReset, clearHeader, isConfigOpen, setIsConfigOpen } = useHeader();
  const { settings } = useSettings();

  const [volume, setVolume] = useState(0);
  const [threshold, setThreshold] = useState(60);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number>(0);
  const updateVolumeRef = useRef<() => void>(() => {});
  const lastVolumeRef = useRef(0);
  const thresholdRef = useRef(threshold);
  const volumeBuffer = useRef<number[]>([]); 
  const [avgVolume, setAvgVolume] = useState(0);

  useEffect(() => {
    thresholdRef.current = threshold;
  }, [threshold]);

  const updateVolume = useCallback(() => {
    if (!analyserRef.current) return;
    
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);
    
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i];
    }
    const average = sum / dataArray.length;
    const currentFrameVolume = Math.min(100, Math.round((average / 128) * 100));
    
    const alpha = 0.15; 
    const smoothedVolume = (currentFrameVolume * alpha) + (lastVolumeRef.current * (1 - alpha));
    lastVolumeRef.current = smoothedVolume;
    
    volumeBuffer.current.push(smoothedVolume);
    if (volumeBuffer.current.length > 120) {
      volumeBuffer.current.shift();
    }
    const currentRollingAvg = volumeBuffer.current.reduce((a, b) => a + b, 0) / volumeBuffer.current.length;
    
    setVolume(Math.round(smoothedVolume));
    setAvgVolume(Math.round(currentRollingAvg));
    
    animationRef.current = requestAnimationFrame(() => updateVolumeRef.current());
  }, []);

  useEffect(() => {
    updateVolumeRef.current = updateVolume;
  }, [updateVolume]);

  const startMonitoring = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      audioContextRef.current = new AudioContext();
      
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      analyserRef.current.smoothingTimeConstant = 0.8;
      
      source.connect(analyserRef.current);
      
      setIsMonitoring(true);
      setPermissionError(null);
      updateVolume();
      audioEngine.playTick(settings.soundTheme);
    } catch (err: any) {
      console.warn('Microphone access issue:', err);
      if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setPermissionError('Microphone not found.');
      } else if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setPermissionError('Microphone access denied.');
      } else {
        setPermissionError('Could not start microphone.');
      }
    }
  };

  const stopMonitoring = useCallback(() => {
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
  }, []);

  useEffect(() => {
    setOnReset(() => stopMonitoring);
    setHelpContent(<HelpContent />);
    return () => clearHeader();
  }, [clearHeader, setOnReset, stopMonitoring, setHelpContent]);

  const getStatus = () => {
    if (volume >= threshold) return 'danger';
    if (avgVolume >= threshold * 0.8) return 'warning';
    return 'ok';
  };

  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const gauge = document.querySelector('.gauge-svg');
      if (!gauge) return;
      const rect = gauge.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      let angle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI) + 90;
      angle = (angle + 360) % 360;
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

  useEffect(() => {
    setHeaderActions(
      isMonitoring ? (
        <button 
          onClick={() => { stopMonitoring(); audioEngine.playTick(settings.soundTheme); }}
          className="flex items-center gap-2 px-6 py-2 bg-white border-2 border-slate-100 text-slate-300 rounded-xl font-black text-[10px] uppercase tracking-widest hover:border-rose-100 hover:text-rose-600 transition-all active:scale-95  italic"
        >
          <MicOff size={14} strokeWidth={3} /> <FormattedMessage id="soundlevel.status.stop" />
        </button>
      ) : null
    );
  }, [isMonitoring, stopMonitoring, settings.soundTheme, setHeaderActions]);

  return (
    <div className="flex gap-8 h-full w-full italic">
      <ToolPanel baseWidth={800} baseHeight={800}>
        <div className={`w-full h-full flex flex-col items-center justify-center relative overflow-hidden ${isDragging ? 'cursor-grabbing' : ''}`}>
          
          <AnimatePresence>
            {status === 'danger' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-rose-600/5 backdrop-blur-[2px] animate-pulse pointer-events-none"
              />
            )}
          </AnimatePresence>

          <div className="relative w-full max-w-xl aspect-square flex items-center justify-center z-10">
            <svg className="absolute inset-0 w-full h-full gauge-svg " viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="none" stroke="#f1f5f9" strokeWidth="8" />
              
              <circle
                cx="50" cy="50" r="45" fill="none" stroke="#e2e8f0" strokeWidth="4"
                strokeDasharray="282.7" strokeDashoffset={282.7 - (282.7 * avgVolume) / 100}
                className="transition-all duration-300 -rotate-90 origin-center opacity-50"
              />

              <motion.circle
                cx="50" cy="50" r="45" fill="none"
                stroke={status === 'danger' ? '#f43f5e' : status === 'warning' ? '#f59e0b' : '#10b981'}
                strokeWidth="8" strokeDasharray="282.7"
                animate={{ strokeDashoffset: 282.7 - (282.7 * volume) / 100 }}
                transition={{ type: 'spring', damping: 20, stiffness: 60 }}
                className="-rotate-90 origin-center "
              />

              <g 
                className={`threshold-handle cursor-grab active:cursor-grabbing ${isDragging ? '' : 'transition-transform duration-200'}`}
                transform={`rotate(${(threshold * 3.6)}, 50, 50)`}
                onMouseDown={(e) => { e.preventDefault(); setIsDragging(true); }}
              >
                <line x1="50" y1="2" x2="50" y2="10" stroke="#6366f1" strokeWidth="3" strokeLinecap="round" />
                <circle cx="50" cy="3" r="4" fill="#6366f1" className="" />
                <circle cx="50" cy="3" r="10" fill="#6366f1" fillOpacity="0.1" />
              </g>
            </svg>

            <div className="relative z-10 flex flex-col items-center gap-8 bg-white rounded-full w-2/3 h-2/3  border-8 border-white flex items-center justify-center">
              <motion.div
                animate={{ scale: status === 'danger' ? [1, 1.1, 1] : 1 }}
                transition={{ repeat: Infinity, duration: 0.5 }}
                className={`p-8 rounded-[3.5rem]  ${
                  status === 'danger' ? 'bg-rose-50 text-rose-600 ' : 
                  status === 'warning' ? 'bg-amber-50 text-amber-600 ' : 
                  'bg-emerald-50 text-emerald-600 '
                }`}
              >
                {status === 'danger' ? <ShieldAlert size={60} strokeWidth={1.5} /> : 
                 status === 'warning' ? <AlertTriangle size={60} strokeWidth={1.5} /> : 
                 <ShieldCheck size={60} strokeWidth={1.5} />}
              </motion.div>

              <div className="text-center">
                <h3 className={`text-8xl font-black tabular-nums leading-none tracking-tighter italic ${
                  status === 'danger' ? 'text-rose-600' : 
                  status === 'warning' ? 'text-amber-600' : 
                  'text-slate-800'
                }`}>
                  {volume}
                </h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mt-2">
                   <FormattedMessage id={`soundlevel.status.${status}`} />
                </p>
              </div>
            </div>
          </div>

          <AnimatePresence>
            {!isMonitoring && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-white/60 backdrop-blur-2xl flex items-center justify-center z-[100]"
              >
                <div className="text-center space-y-8 p-12 bg-white rounded-[4rem] border-8 border-slate-50 ">
                  <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem]  flex items-center justify-center mx-auto text-slate-300">
                    <VolumeIcon size={40} strokeWidth={1} />
                  </div>
                  <div className="space-y-2">
                     <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter italic leading-none">
                       <FormattedMessage id="soundlevel.status.inactive" />
                     </h2>
                  </div>
                  <button
                    onClick={startMonitoring}
                    className="flex items-center justify-center gap-4 w-full h-20 bg-indigo-600 text-white rounded-[2.5rem] font-black uppercase tracking-[0.2em] text-xs hover:bg-slate-900 transition-all  active:scale-95"
                  >
                    <Mic size={20} strokeWidth={3} /> <FormattedMessage id="soundlevel.status.initialize" />
                  </button>
                </div>
              </motion.div>
            )}

            {permissionError && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute inset-0 bg-white/80 backdrop-blur-2xl flex items-center justify-center z-[110] p-12"
              >
                <div className="text-center space-y-8 p-12 bg-white rounded-[4rem] border-[16px] border-rose-50  max-w-lg">
                  <div className="w-24 h-24 bg-rose-50 text-rose-500 rounded-[2.5rem]  flex items-center justify-center mx-auto">
                    <AlertTriangle size={48} strokeWidth={2} />
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-3xl font-black text-slate-800 uppercase tracking-tighter italic">Error</h3>
                    <p className="text-slate-400 uppercase tracking-widest text-xs font-black leading-relaxed">{permissionError}</p>
                  </div>
                  <button
                    onClick={startMonitoring}
                    className="flex items-center justify-center gap-4 w-full h-20 bg-slate-900 text-white rounded-[2.5rem] font-black uppercase tracking-[0.2em] text-xs hover:bg-rose-600 transition-all  active:scale-95"
                  >
                    <RefreshCcw size={20} strokeWidth={3} /> <FormattedMessage id="soundlevel.status.initialize" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </ToolPanel>

      <SettingsPanel
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        title={intl.formatMessage({ id: 'soundlevel.title' })}
      >
        <div className="space-y-8">
          <div className="p-6 bg-slate-900 rounded-[2.5rem] border-4 border-slate-800  flex flex-col items-center gap-4">
             <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.5em]">
               <FormattedMessage id="soundlevel.label.threshold" />
             </span>
             <div className="flex items-baseline gap-2">
                <span className="text-7xl font-black text-white italic tracking-tighter leading-none tabular-nums">{threshold}</span>
             </div>
             <div className="w-full h-px bg-white/10" />
             <div className="grid grid-cols-2 gap-4 w-full">
                <div className="p-4 bg-white/5 rounded-[1.5rem] border border-white/5 flex flex-col items-center gap-1">
                   <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">
                     <FormattedMessage id="soundlevel.label.average" />
                   </span>
                   <span className="text-xl font-black text-indigo-400 italic tabular-nums">{avgVolume}</span>
                </div>
                <div className="p-4 bg-white/5 rounded-[1.5rem] border border-white/5 flex flex-col items-center gap-1">
                   <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">
                     <FormattedMessage id="soundlevel.label.current" />
                   </span>
                   <span className="text-xl font-black text-rose-400 italic tabular-nums">{volume}</span>
                </div>
             </div>
          </div>

          <div className="space-y-4">
             <div className={`p-6 rounded-[2.5rem] border-4 transition-all flex items-center gap-4 ${status === 'ok' ? 'bg-emerald-600 border-white text-white' : 'bg-white border-white opacity-40'}`}>
                <ShieldCheck size={24} strokeWidth={3} />
                <span className="text-xs font-black uppercase tracking-widest">
                  <FormattedMessage id="soundlevel.status.ok" />
                </span>
             </div>
             <div className={`p-6 rounded-[2.5rem] border-4 transition-all flex items-center gap-4 ${status === 'warning' ? 'bg-amber-500 border-white text-white' : 'bg-white border-white opacity-40'}`}>
                <AlertTriangle size={24} strokeWidth={3} />
                <span className="text-xs font-black uppercase tracking-widest">
                  <FormattedMessage id="soundlevel.status.warning" />
                </span>
             </div>
             <div className={`p-6 rounded-[2.5rem] border-4 transition-all flex items-center gap-4 ${status === 'danger' ? 'bg-rose-600 border-white text-white' : 'bg-white border-white opacity-40'}`}>
                <ShieldAlert size={24} strokeWidth={3} />
                <span className="text-xs font-black uppercase tracking-widest">
                  <FormattedMessage id="soundlevel.status.danger" />
                </span>
             </div>
          </div>
        </div>
      </SettingsPanel>
    </div>
  );
};

export default SoundLevel;
