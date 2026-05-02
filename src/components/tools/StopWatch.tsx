import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Settings2,
  Check,
  X,
  Flag,
  Download,
  Trash2,
  Clock,
  History as HistoryIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ToolPanel } from '../shared/ToolPanel';
import { SettingsPanel } from '../shared/SettingsPanel';
import HistoryPanel from '../shared/HistoryPanel';
import { useHeader } from '../../contexts/HeaderContext';
import { useSettings } from '../../contexts/SettingsContext';
import { audioEngine } from '../../utils/audio';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { formatStopwatchTime } from '../../utils/format';
import { downloadCSV } from '../../utils/export';
import { useIntl, FormattedMessage, IntlShape } from 'react-intl';

// 1. Constants
const SOUND_THEMES = ['classic', 'digital', 'soft', 'bubbly', 'chime', 'synth', 'beep', 'siren', 'cosmic'];

// 3. Text (Help and Info)
const getHelpInfo = () => (
  <div className="space-y-4 font-['Outfit']">
    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight italic">
      <FormattedMessage id="stopwatch.help.title" defaultMessage="Stopwatch" />
    </h3>
    <div className="space-y-3 italic">
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center text-xs font-black text-indigo-600 shrink-0">1</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">
          <FormattedMessage 
            id="stopwatch.help.step1" 
            defaultMessage="Click the <b>Main Button</b> to start or pause the stopwatch."
            values={{ b: (chunks: React.ReactNode) => <b>{chunks}</b> }}
          />
        </p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center text-xs font-black text-blue-600 shrink-0">2</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">
          <FormattedMessage 
            id="stopwatch.help.step2" 
            defaultMessage="Use the <b>Flag Icon</b> to record a lap point."
            values={{ b: (chunks: React.ReactNode) => <b>{chunks}</b> }}
          />
        </p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-rose-50 flex items-center justify-center text-xs font-black text-rose-600 shrink-0">3</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">
          <FormattedMessage 
            id="stopwatch.help.step3" 
            defaultMessage="The <b>History</b> on the left shows your lap times."
            values={{ b: (chunks: React.ReactNode) => <b>{chunks}</b> }}
          />
        </p>
      </div>
    </div>
  </div>
);

export const StopWatch = () => {
  const { 
    setHasConfig, setHelpContent, setOnReset, 
    clearHeader, isConfigOpen, setIsConfigOpen, setOnConfigToggle,
    setHeaderActions
  } = useHeader();
  const { settings } = useSettings();
  const intl = useIntl();

  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [laps, setLaps] = useLocalStorage<any[]>('teacherToolsStopwatchLaps', []);
  const [isMuted, setIsMuted] = useLocalStorage('teacherToolsStopwatchMuted', false);
  const [tickSound, setTickSound] = useLocalStorage('teacherToolsStopwatchTickSound', 'classic');

  const lastTickRef = useRef(0);

  const reset = useCallback(() => {
    setIsRunning(false);
    setTime(0);
    setLaps([]);
    setIsMuted(false);
    setTickSound('classic');
    lastTickRef.current = 0;
    audioEngine.playTick(settings.soundTheme);
  }, [settings.soundTheme, setLaps, setIsMuted, setTickSound]);

  const addLap = useCallback(() => {
    if (time === 0) return;
    const newLap = {
      id: Date.now(),
      time: time,
      timestamp: new Date().toLocaleTimeString(),
      difference: laps.length > 0 ? time - laps[0].time : time
    };
    setLaps(prev => [newLap, ...prev]);
    audioEngine.playTick(tickSound);
  }, [time, laps, setLaps, tickSound]);

  const [isHistoryVisible, setIsHistoryVisible] = useLocalStorage('teacherToolsStopwatchHistoryVisible', true);

  useEffect(() => {
    setHasConfig(true);
    setOnReset(() => reset);
    setHelpContent(getHelpInfo());
    setOnConfigToggle(() => () => setIsConfigOpen(prev => !prev));
    setHeaderActions(
      <button
        onClick={() => setIsHistoryVisible(prev => !prev)}
        className={`p-2.5 rounded-[1rem] transition-all duration-300 ${isHistoryVisible 
          ? 'bg-indigo-600 text-white' 
          : 'text-indigo-600 bg-indigo-50/50 hover:bg-indigo-100/80'}`}
        title="Toggle History"
      >
        <HistoryIcon size={20} strokeWidth={2.5} />
      </button>
    );
    return () => clearHeader();
  }, [clearHeader, setOnReset, reset, setHelpContent, setHasConfig, setOnConfigToggle, setIsConfigOpen, setHeaderActions, isHistoryVisible, setIsHistoryVisible, intl]);

  useEffect(() => {
    let intervalId: any;
    if (isRunning) {
      intervalId = setInterval(() => {
        setTime((prev) => {
          const newTime = prev + 10;
          if (Math.floor(newTime / 1000) > lastTickRef.current) {
            if (!isMuted) audioEngine.playTick(tickSound);
            lastTickRef.current = Math.floor(newTime / 1000);
          }
          return newTime;
        });
      }, 10);
    }
    return () => clearInterval(intervalId);
  }, [isRunning, tickSound, isMuted]);

  const toggle = () => {
    setIsRunning(!isRunning);
    audioEngine.playTick(tickSound);
    if (!isRunning) {
      lastTickRef.current = Math.floor(time / 1000);
    }
  };

  const exportLaps = () => {
    const data = laps.map((lap, index) => ({
      Lap: laps.length - index,
      Time: formatStopwatchTime(lap.time),
      Split: formatStopwatchTime(lap.difference),
      Timestamp: lap.timestamp
    }));
    downloadCSV(data, 'stopwatch_telemetry.csv');
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 w-full h-full italic overflow-hidden relative">
      <AnimatePresence>
        {(isHistoryVisible || isConfigOpen) && (
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
              className="shrink-0 lg:h-fit"
              compact
            >
              <div className="space-y-4">
                <div className="flex flex-row items-center justify-between px-4 py-3 bg-white border-2 border-slate-100 rounded-[1.5rem] italic">
                  <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded-lg ${isMuted ? 'bg-rose-50 text-rose-600' : 'bg-indigo-50 text-indigo-600'}`}>
                      {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                    </div>
                    <div className="text-[10px] font-black text-slate-900 uppercase">
                      <FormattedMessage id="stopwatch.settings.mute" defaultMessage="Mute" />
                    </div>
                  </div>
                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    className={`w-8 h-5 rounded-full transition-all relative ${isMuted ? 'bg-rose-500' : 'bg-slate-200'}`}
                  >
                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${isMuted ? 'right-0.5' : 'left-0.5 '}`} />
                  </button>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block text-center opacity-60">
                    <FormattedMessage id="stopwatch.settings.tick_sound" defaultMessage="Tick Sound" />
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {SOUND_THEMES.map(theme => (
                      <button
                        key={theme}
                        onClick={() => { setTickSound(theme); audioEngine.playTick(theme); }}
                        className={`px-1 py-2 rounded-xl border-2 transition-all italic uppercase font-black text-[7px] tracking-widest text-center truncate ${tickSound === theme ? 'bg-indigo-600 border-indigo-400 text-white ' : 'bg-white border-slate-100 text-slate-300 hover:border-indigo-100'}`}
                      >
                        <FormattedMessage id={`stopwatch.sound.${theme}`} defaultMessage={theme} />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </SettingsPanel>

            {isHistoryVisible && (
              <div className="flex-1 flex flex-col overflow-hidden">
                <HistoryPanel
                  title={intl.formatMessage({ id: 'stopwatch.history.title', defaultMessage: 'Laps' })}
                  icon={HistoryIcon}
                  items={laps}
                  onClear={() => setLaps([])}
                  onDownload={exportLaps}
                  emptyMessage={intl.formatMessage({ id: 'stopwatch.history.empty', defaultMessage: 'No laps yet' })}
                  renderItem={(lap, index) => (
                    <motion.div
                      key={lap.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="p-4 bg-white/80 backdrop-blur-sm border-2 border-white rounded-[2rem] flex items-center justify-between group hover:border-indigo-100 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-[10px] font-black text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 shrink-0">
                          {laps.length - index}
                        </div>
                        <div>
                          <div className="text-xl font-black text-slate-900 tabular-nums tracking-tighter">
                            {formatStopwatchTime(lap.time)}
                          </div>
                          <div className="text-[8px] font-black text-slate-300 uppercase tracking-widest">
                            +{formatStopwatchTime(lap.difference)}
                          </div>
                        </div>
                      </div>
                      <div className="text-[10px] font-black text-slate-300 uppercase tracking-tighter">
                        {lap.timestamp}
                      </div>
                    </motion.div>
                  )}
                />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <ToolPanel className="flex-1 font-['Outfit'] select-none" baseWidth={1100} baseHeight={800}>
        <div className="flex flex-col items-center justify-center gap-12 w-full italic relative z-10">
          <div className="bg-white rounded-[3rem] border-4 border-white flex items-center justify-center py-20 px-24 gap-12 relative overflow-hidden">
            <div className="flex items-center gap-8 relative z-10">
              <div className="flex flex-col items-center">
                <div className="text-[14rem] font-black tabular-nums tracking-tighter leading-none text-slate-900 italic">
                  {Math.floor(time / 60000).toString().padStart(2, '0')}
                </div>
              </div>

              <div className="text-9xl font-black text-indigo-600 animate-pulse">:</div>

              <div className="flex flex-col items-center">
                <div className="text-[14rem] font-black tabular-nums tracking-tighter leading-none text-indigo-600 italic">
                  {Math.floor((time % 60000) / 1000).toString().padStart(2, '0')}
                </div>
              </div>

              <div className="text-9xl font-black text-slate-300">:</div>

              <div className="flex flex-col items-center self-end pb-6">
                <div className="text-[9rem] font-black tabular-nums tracking-tighter leading-none text-rose-500 italic">
                  {Math.floor((time % 1000) / 10).toString().padStart(2, '0')}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-8">
            <button
              onClick={toggle}
              className={`w-52 h-52 rounded-[2.5rem] flex items-center justify-center transition-all active:scale-95 border-[12px] ${isRunning
                  ? 'bg-rose-600 text-white border-rose-500/30 hover:bg-rose-700'
                  : 'bg-indigo-600 text-white border-indigo-500/30 hover:bg-indigo-700 hover:border-indigo-600'
                }`}
            >
              {isRunning ? <Pause size={64} fill="currentColor" strokeWidth={0} /> : <Play size={64} fill="currentColor" strokeWidth={0} className="ml-2" />}
            </button>

            <div className="flex flex-col gap-4">
              <button
                onClick={addLap}
                disabled={time === 0}
                className="w-24 h-24 rounded-[1.5rem] bg-white border-4 border-slate-100 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:border-blue-100 transition-all active:scale-90 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Flag size={32} strokeWidth={3} />
              </button>
              <button
                onClick={reset}
                className="w-24 h-24 rounded-[1.5rem] bg-white border-4 border-slate-100 flex items-center justify-center text-slate-400 hover:text-rose-600 hover:border-rose-100 transition-all active:scale-90"
              >
                <RotateCcw size={32} strokeWidth={3} />
              </button>
            </div>
          </div>
        </div>
      </ToolPanel>

      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-50 rounded-full blur-[150px] opacity-40 -z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-rose-50 rounded-full blur-[150px] opacity-40 -z-10 pointer-events-none" />
    </div>
  );
};

export default StopWatch;
