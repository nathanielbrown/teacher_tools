import React, { useState, useEffect, useCallback } from 'react';
import { 
  Play, 
  Pause, 
  Circle, 
  LayoutGrid, 
  Hourglass, 
  TimerReset, 
  ChevronUp, 
  ChevronDown,
  Settings2,
  RotateCcw,
  Activity,
  MousePointer2,
  BrainCircuit,
  X,
  Volume2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSettings } from '../../contexts/SettingsContext';
import { useHeader } from '../../contexts/HeaderContext';
import { audioEngine } from '../../utils/audio';
import { ToolPanel } from '../shared/ToolPanel';
import { SettingsPanel } from '../shared/SettingsPanel';
import { useIntl, FormattedMessage, IntlShape } from 'react-intl';
import { useLocalStorage } from '../../hooks/useLocalStorage';

// 1. Constants
const SOUND_OPTIONS = [
  'default', 'none', 'classic', 'digital', 'soft', 'bubbly', 'chime', 'synth', 'beep', 'siren', 'cosmic'
];

const VISUAL_MODES = [
  { id: 'circle', icon: Circle },
  { id: 'grid', icon: LayoutGrid },
  { id: 'sand', icon: Hourglass },
  { id: 'rainbow', icon: TimerReset }
];

// 3. Text (Help and Info)
const getHelpInfo = () => (
  <div className="space-y-4 font-['Outfit']">
    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight italic">
      <FormattedMessage id="countdown.help.title" defaultMessage="How to Use the Countdown" />
    </h3>
    <div className="space-y-3 italic">
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center text-xs font-black text-indigo-600 shrink-0">1</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">
          <FormattedMessage 
            id="countdown.help.step1" 
            defaultMessage="Use the <b>arrows</b> above and below the numbers to set your time."
            values={{ b: (chunks: React.ReactNode) => <b>{chunks}</b> }}
          />
        </p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center text-xs font-black text-blue-600 shrink-0">2</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">
          <FormattedMessage 
            id="countdown.help.step2" 
            defaultMessage="Click the <b>visualization</b> or the main digits to start and pause."
            values={{ b: (chunks: React.ReactNode) => <b>{chunks}</b> }}
          />
        </p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-purple-50 flex items-center justify-center text-xs font-black text-purple-600 shrink-0">3</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">
          <FormattedMessage 
            id="countdown.help.step3" 
            defaultMessage="Open <b>Config</b> to change the <b>Visual Mode</b> (Circle, Sand, Grid, or Rainbow)."
            values={{ b: (chunks: React.ReactNode) => <b>{chunks}</b> }}
          />
        </p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-rose-50 flex items-center justify-center text-xs font-black text-rose-600 shrink-0">4</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">
          <FormattedMessage 
            id="countdown.help.step4" 
            defaultMessage="Pick an <b>Alarm Sound</b> to play when the time reaches zero."
            values={{ b: (chunks: React.ReactNode) => <b>{chunks}</b> }}
          />
        </p>
      </div>
    </div>
  </div>
);

// 4. Local Storage (None)

// 5. Classes (None)

// 6. Functions (None)

// 7. Component
export const CountDown = () => {
  const { settings } = useSettings();
  const { setHasConfig, setHelpContent, setOnReset, setOnConfigToggle, clearHeader, isConfigOpen, setIsConfigOpen } = useHeader();
  const intl = useIntl();
  
  const [initialMinutes, setInitialMinutes] = useLocalStorage<number>('countdown_initial_minutes', 5);
  const [initialSeconds, setInitialSeconds] = useLocalStorage<number>('countdown_initial_seconds', 0);
  const [timeLeft, setTimeLeft] = useLocalStorage<number>('countdown_time_left', 300);
  const [totalTime, setTotalTime] = useLocalStorage<number>('countdown_total_time', 300);
  const [isRunning, setIsRunning] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [visualMode, setVisualMode] = useLocalStorage<string>('countdown_visual_mode', 'circle');
  const [soundOverride, setSoundOverride] = useLocalStorage<string>('countdown_sound_override', 'default');

  const reset = useCallback(() => {
    setIsRunning(false);
    setIsFinished(false);
    const newTotal = initialMinutes * 60 + initialSeconds;
    setTimeLeft(newTotal);
    setTotalTime(newTotal);
    setVisualMode('circle');
    setSoundOverride('default');
    audioEngine.playTick(settings.soundTheme);
  }, [initialMinutes, initialSeconds, settings.soundTheme]);

  useEffect(() => {
    setHasConfig(true);
    setOnReset(() => reset);
    setOnConfigToggle(() => () => setIsConfigOpen(prev => !prev));
    setHelpContent(getHelpInfo());
    return () => clearHeader();
  }, [clearHeader, setOnReset, reset, setHelpContent, setHasConfig, setOnConfigToggle, setIsConfigOpen, intl]);

  const toggle = useCallback(() => {
    if (timeLeft > 0 && !isFinished) {
      setIsRunning(!isRunning);
      audioEngine.playTick(settings.soundTheme);
    }
  }, [timeLeft, isFinished, isRunning, settings.soundTheme]);

  useEffect(() => {
    let intervalId: any;
    if (isRunning && timeLeft > 0) {
      intervalId = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            setIsFinished(true);
            const activeTheme = soundOverride === 'default' ? settings.soundTheme : soundOverride;
            audioEngine.playAlarm(activeTheme);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(intervalId);
  }, [isRunning, timeLeft, settings.soundTheme, soundOverride]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!isRunning && !isFinished) {
        const newTotal = initialMinutes * 60 + initialSeconds;
        setTimeLeft(prev => prev !== newTotal ? newTotal : prev);
        setTotalTime(prev => prev !== newTotal ? newTotal : prev);
      }
    }, 0);
    return () => clearTimeout(timeout);
  }, [initialMinutes, initialSeconds, isRunning, isFinished]);

  const renderVisualization = () => {
    const progress = totalTime > 0 ? ((totalTime - timeLeft) / totalTime) * 100 : 100;
    const remainingProgress = 100 - progress;

    if (visualMode === 'grid') {
      return (
        <div className="grid grid-cols-10 gap-2 w-full max-w-[300px] aspect-square bg-slate-50/50 p-8 rounded-[3rem] border-4 border-white  group-hover:scale-105 transition-transform">
          {[...Array(100)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ scale: 1, opacity: 1 }}
              animate={{ 
                scale: (100 - i) <= (remainingProgress) ? 1 : 0.2,
                opacity: (100 - i) <= (remainingProgress) ? 1 : 0.1
              }}
              className="bg-indigo-600 rounded-lg"
            />
          ))}
        </div>
      );
    }

    if (visualMode === 'circle') {
      const radius = 60;
      const circumference = 2 * Math.PI * radius;
      const strokeDashoffset = (remainingProgress / 100) * circumference;

      return (
        <div className="relative flex items-center justify-center bg-slate-50/50 p-12 rounded-full border-4 border-white  group-hover:scale-105 transition-transform">
          <svg viewBox="0 0 160 160" className="transform -rotate-90 w-48 h-48 md:w-64 md:h-64">
            <circle cx="80" cy="80" r="60" stroke="#e2e8f0" strokeWidth="12" fill="transparent" opacity="0.3" />
            <motion.circle
              cx="80" cy="80" r="60"
              stroke={isFinished ? "#f43f5e" : "#6366f1"}
              strokeWidth="12"
              fill="transparent"
              strokeDasharray={circumference}
              strokeLinecap="round"
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ ease: "linear", duration: 1 }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-16 h-16 bg-white/80 rounded-full flex items-center justify-center  backdrop-blur-md">
              {isRunning ? <Pause size={32} className="text-indigo-600" /> : <Play size={32} className="text-emerald-600 ml-1" />}
            </div>
          </div>
        </div>
      );
    }

    if (visualMode === 'sand') {
      return (
        <div className="relative w-32 h-56 border-8 border-white rounded-[2.5rem] flex flex-col items-center overflow-hidden bg-slate-50/50  group-hover:scale-105 transition-transform">
           <div className="w-full h-1/2 border-b-4 border-white relative overflow-hidden flex items-end">
              <motion.div
                className="w-full bg-amber-400"
                initial={{ height: '100%' }}
                animate={{ height: `${remainingProgress}%` }}
                transition={{ ease: "linear", duration: 1 }}
              />
           </div>
           <div className="w-full h-1/2 relative overflow-hidden">
              <motion.div
                className="w-full bg-amber-600 absolute bottom-0"
                initial={{ height: '0%' }}
                animate={{ height: `${progress}%` }}
                transition={{ ease: "linear", duration: 1 }}
              />
           </div>
        </div>
      );
    }

    if (visualMode === 'rainbow') {
      const radius = 45;
      const circumference = 2 * Math.PI * radius;
      const strokeDashoffset = (progress / 100) * circumference;
      const hue = (remainingProgress / 100) * 360;

      return (
        <div className="relative flex items-center justify-center bg-slate-50/50 p-12 rounded-full border-4 border-white  group-hover:scale-105 transition-transform">
          <svg viewBox="0 0 160 160" className="transform -rotate-90 w-48 h-48 md:w-64 md:h-64">
            <circle cx="80" cy="80" r={radius} stroke="#e2e8f0" strokeWidth="30" fill="transparent" opacity="0.3" />
            <motion.circle
              cx="80" cy="80" r={radius}
              stroke="currentColor"
              strokeWidth="30"
              fill="transparent"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: 0 }}
              animate={{ strokeDashoffset }}
              transition={{ ease: "linear", duration: 1 }}
              style={{
                color: isFinished ? '#f43f5e' : `hsl(${hue}, 80%, 55%)`
              }}
            />
          </svg>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 w-full h-full font-['Outfit'] select-none overflow-hidden relative">
      <AnimatePresence>
        {isConfigOpen && (
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="hidden lg:flex lg:w-[320px] flex-col h-full gap-8 italic overflow-hidden shrink-0"
          >
            <SettingsPanel
              isOpen={isConfigOpen}
              onClose={() => setIsConfigOpen(false)}
              title={intl.formatMessage({ id: 'header.tooltip.config', defaultMessage: 'Configuration' })}
              compact
            >
              <div className="space-y-8">
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">
                    <FormattedMessage id="countdown.settings.visual_mode" defaultMessage="Visual Mode" />
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {VISUAL_MODES.map(mode => (
                      <button
                        key={mode.id}
                        onClick={() => { setVisualMode(mode.id); audioEngine.playTick(settings.soundTheme); }}
                        className={`p-4 rounded-2xl border-4 transition-all flex flex-col items-center gap-2 italic ${
                          visualMode === mode.id 
                            ? 'bg-indigo-600 border-indigo-400 text-white ' 
                            : 'bg-white border-slate-100 text-slate-300 hover:border-indigo-100'
                        }`}
                      >
                        <mode.icon size={24} />
                        <span className="text-[9px] font-black uppercase tracking-widest">
                          <FormattedMessage id={`countdown.visual_mode.${mode.id}`} />
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">
                    <FormattedMessage id="countdown.settings.alarm_sound" defaultMessage="Alarm Sound" />
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {SOUND_OPTIONS.map(soundId => (
                      <button
                        key={soundId}
                        onClick={() => {
                          setSoundOverride(soundId);
                          if (soundId !== 'none') {
                            audioEngine.playAlarm(soundId === 'default' ? settings.soundTheme : soundId);
                          }
                        }}
                        className={`py-3 px-2 rounded-xl border-2 transition-all text-[8px] font-black uppercase italic tracking-widest truncate ${
                          soundOverride === soundId 
                            ? 'bg-indigo-600 border-indigo-400 text-white ' 
                            : 'bg-white border-slate-100 text-slate-400 hover:border-indigo-100'
                        }`}
                      >
                        <FormattedMessage id={`countdown.sound.${soundId}`} defaultMessage={soundId} />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </SettingsPanel>
          </motion.div>
        )}
      </AnimatePresence>

      <ToolPanel className="flex-1 font-['Outfit'] select-none" baseWidth={1200} baseHeight={800}>
        <div className="flex flex-col items-center justify-center gap-12 w-full max-w-4xl italic relative z-10">
          <div className="flex flex-col items-center gap-12 w-full">
            {/* Numerical Interface - Stabilized */}
            <div className="flex items-center gap-8 md:gap-16 shrink-0">
              <div className="flex flex-col items-center">
                <button 
                  onClick={(e) => { e.stopPropagation(); setInitialMinutes(m => Math.min(99, m + 1)); audioEngine.playTick(settings.soundTheme); }}
                  className={`p-2 text-slate-200 hover:text-indigo-500 transition-all ${isRunning ? 'opacity-0 pointer-events-none' : ''}`}
                >
                  <ChevronUp size={64} strokeWidth={4} />
                </button>
                <div className="w-[180px] md:w-[240px] text-center text-8xl md:text-[12rem] font-black tabular-nums tracking-tighter leading-none text-slate-900 ">
                  {Math.floor(timeLeft / 60).toString().padStart(2, '0')}
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); setInitialMinutes(m => Math.max(0, m - 1)); audioEngine.playTick(settings.soundTheme); }}
                  className={`p-2 text-slate-200 hover:text-indigo-500 transition-all ${isRunning ? 'opacity-0 pointer-events-none' : ''}`}
                >
                  <ChevronDown size={64} strokeWidth={4} />
                </button>
              </div>

              <div className="text-7xl md:text-9xl font-black text-slate-200 leading-none pb-8 animate-pulse">:</div>

              <div className="flex flex-col items-center">
                <button 
                  onClick={(e) => { e.stopPropagation(); setInitialSeconds(s => (s + 1) % 60); audioEngine.playTick(settings.soundTheme); }}
                  className={`p-2 text-slate-200 hover:text-indigo-500 transition-all ${isRunning ? 'opacity-0 pointer-events-none' : ''}`}
                >
                  <ChevronUp size={64} strokeWidth={4} />
                </button>
                <div className="w-[180px] md:w-[240px] text-center text-8xl md:text-[12rem] font-black tabular-nums tracking-tighter leading-none text-slate-900 ">
                  {(timeLeft % 60).toString().padStart(2, '0')}
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); setInitialSeconds(s => (s - 1 + 60) % 60); audioEngine.playTick(settings.soundTheme); }}
                  className={`p-2 text-slate-200 hover:text-indigo-500 transition-all ${isRunning ? 'opacity-0 pointer-events-none' : ''}`}
                >
                  <ChevronDown size={64} strokeWidth={4} />
                </button>
              </div>
            </div>

            {/* Visualization Module */}
            <div 
              onClick={toggle}
              className="flex items-center justify-center w-full shrink-0 cursor-pointer group active:scale-95 transition-all"
            >
              {renderVisualization()}
            </div>
          </div>
        </div>
      </ToolPanel>

      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-50 rounded-full blur-[150px] opacity-40 -z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-rose-50 rounded-full blur-[150px] opacity-40 -z-10 pointer-events-none" />
    </div>

  );
};

export default CountDown;
