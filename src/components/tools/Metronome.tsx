import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Minus, 
  Play,
  Pause,
  Volume2,
  VolumeX
} from 'lucide-react';
import { useHeader } from '../../contexts/HeaderContext';
import { useSettings } from '../../contexts/SettingsContext';
import { ToolPanel } from '../shared/ToolPanel';
import { SettingsPanel } from '../shared/SettingsPanel';
import { FormattedMessage, useIntl } from 'react-intl';
import { audioEngine } from '../../utils/audio';
import { useLocalStorage } from '../../hooks/useLocalStorage';

// 1. Constants
const MIN_BPM = 20;
const MAX_BPM = 280;
const SOUND_THEMES = ['classic', 'digital', 'soft', 'bubbly', 'chime', 'synth', 'beep', 'siren', 'cosmic'];

// 3. Text (Help and Info)
const getHelpInfo = () => (
  <div className="space-y-4 font-['Outfit']">
    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">
      <FormattedMessage id="metronome.help.title" defaultMessage="How to Use" />
    </h3>
    <div className="space-y-3">
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center text-xs font-black text-indigo-600 shrink-0">1</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">
          <FormattedMessage 
            id="metronome.help.step1" 
            defaultMessage="Change the <b>speed</b> using the buttons or slider."
            values={{ b: (chunks: React.ReactNode) => <b>{chunks}</b> }}
          />
        </p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-emerald-50 flex items-center justify-center text-xs font-black text-emerald-600 shrink-0">2</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">
          <FormattedMessage 
            id="metronome.help.step2" 
            defaultMessage="Press <b>Start</b> to hear the beat. The dots will light up with the sound."
            values={{ b: (chunks: React.ReactNode) => <b>{chunks}</b> }}
          />
        </p>
      </div>
    </div>
  </div>
);

// 7. Component
export const Metronome = () => {
  const { 
    setHasConfig, setHelpContent, setOnReset, 
    clearHeader, isConfigOpen, setIsConfigOpen, setOnConfigToggle 
  } = useHeader();
  const { settings } = useSettings();
  const intl = useIntl();
  
  // State
  const [bpm, setBpm] = useLocalStorage('metronome_bpm', 120);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentBeat, setCurrentBeat] = useState(0);
  const [beatsPerMeasure, setBeatsPerMeasure] = useLocalStorage('metronome_beats', 4);
  const [tickSound, setTickSound] = useLocalStorage('metronome_sound', 'classic');
  const [isMuted, setIsMuted] = useLocalStorage('metronome_muted', false);
  
  // Refs for timing
  const nextNoteTimeRef = useRef(0);
  const timerIDRef = useRef<number | null>(null);
  const beatRef = useRef(0);

  const scheduler = useCallback(() => {
    const ctx = audioEngine.getContext();
    if (!isPlaying || !ctx) return;

    while (nextNoteTimeRef.current < ctx.currentTime + 0.1) {
      const scheduleTime = nextNoteTimeRef.current;
      const isDownbeat = beatRef.current === 0;
      
      if (!isMuted) {
        audioEngine.playTick(tickSound, scheduleTime, isDownbeat);
      }
      
      const currentBeatVal = beatRef.current;
      const delay = (scheduleTime - ctx.currentTime) * 1000;
      
      setTimeout(() => {
        setCurrentBeat(currentBeatVal);
      }, Math.max(0, delay));

      const secondsPerBeat = 60.0 / bpm;
      nextNoteTimeRef.current += secondsPerBeat;
      beatRef.current = (beatRef.current + 1) % beatsPerMeasure;
    }
    timerIDRef.current = window.setTimeout(scheduler, 25);
  }, [bpm, beatsPerMeasure, tickSound, isPlaying, isMuted]);

  const toggleMetronome = useCallback(() => {
    const ctx = audioEngine.getContext();
    if (!ctx) return;

    if (!isPlaying) {
      nextNoteTimeRef.current = ctx.currentTime;
      setIsPlaying(true);
      beatRef.current = 0;
      setCurrentBeat(0);
    } else {
      setIsPlaying(false);
      if (timerIDRef.current) clearTimeout(timerIDRef.current);
    }
  }, [isPlaying]);

  useEffect(() => {
    if (isPlaying) {
      scheduler();
    } else {
      if (timerIDRef.current) clearTimeout(timerIDRef.current);
    }
    return () => {
      if (timerIDRef.current) clearTimeout(timerIDRef.current);
    };
  }, [isPlaying, scheduler]);

  const resetMetronome = useCallback(() => {
    setIsPlaying(false);
    setBpm(120);
    setBeatsPerMeasure(4);
    setTickSound('classic');
    setIsMuted(false);
    setCurrentBeat(0);
    beatRef.current = 0;
    if (timerIDRef.current) clearTimeout(timerIDRef.current);
    audioEngine.playTick(settings.soundTheme);
  }, [settings.soundTheme, setBpm, setBeatsPerMeasure, setTickSound, setIsMuted]);

  useEffect(() => {
    setHasConfig(true);
    setOnReset(() => resetMetronome);
    setHelpContent(getHelpInfo());
    setOnConfigToggle(() => () => setIsConfigOpen(prev => !prev));
    return () => clearHeader();
  }, [clearHeader, setOnReset, resetMetronome, setHelpContent, setHasConfig, setOnConfigToggle, setIsConfigOpen]);

  return (
    <div className="flex flex-col lg:flex-row gap-8 w-full h-full italic overflow-hidden relative">
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
              className="shrink-0 lg:h-full"
              compact
              title={intl.formatMessage({ id: 'metronome.settings.title', defaultMessage: 'Config' })}
            >
              <div className="space-y-8">
                {/* Mute Toggle */}
                <div className="flex flex-row items-center justify-between px-4 py-3 bg-white border-2 border-slate-100 rounded-[1.5rem]">
                  <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded-lg ${isMuted ? 'bg-rose-50 text-rose-600' : 'bg-indigo-50 text-indigo-600'}`}>
                      {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                    </div>
                    <div className="text-[10px] font-black text-slate-900 uppercase">
                      <FormattedMessage id="metronome.settings.mute" defaultMessage="Mute" />
                    </div>
                  </div>
                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    className={`w-8 h-5 rounded-full transition-all relative ${isMuted ? 'bg-rose-500' : 'bg-slate-200'}`}
                  >
                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${isMuted ? 'right-0.5' : 'left-0.5'}`} />
                  </button>
                </div>

                {/* Beats */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block text-center opacity-60">
                    <FormattedMessage id="metronome.settings.beats" defaultMessage="Beats" />
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[2, 3, 4, 6, 8, 12].map(num => (
                      <button
                        key={num}
                        onClick={() => setBeatsPerMeasure(num)}
                        className={`py-2 rounded-xl border-2 transition-all font-black text-xs ${beatsPerMeasure === num ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-white border-slate-100 text-slate-400 hover:border-indigo-100'}`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sound Themes */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block text-center opacity-60">
                    <FormattedMessage id="metronome.settings.sound" defaultMessage="Sound" />
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {SOUND_THEMES.map(theme => (
                      <button
                        key={theme}
                        onClick={() => { setTickSound(theme); audioEngine.playTick(theme); }}
                        className={`py-2 rounded-xl border-2 transition-all font-black text-[8px] uppercase tracking-widest truncate ${tickSound === theme ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-white border-slate-100 text-slate-400 hover:border-indigo-100'}`}
                      >
                        <FormattedMessage id={`metronome.sound.${theme}`} defaultMessage={theme} />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </SettingsPanel>
          </motion.div>
        )}
      </AnimatePresence>

      <ToolPanel className="flex-1 font-['Outfit'] select-none" baseWidth={1100} baseHeight={800}>
        <div className="w-full max-w-3xl flex flex-col items-center gap-10 relative z-10">
          
          {/* Header Area */}
          <div className="text-center space-y-6">
            <h1 className="text-6xl lg:text-7xl font-black text-slate-900 tracking-tighter uppercase leading-none">
              <FormattedMessage id="metronome.title" defaultMessage="Metronome" />
            </h1>

            {/* Visual Beat Indicator */}
            <div className="flex justify-center gap-3 h-6 w-full max-w-md mx-auto">
              {Array.from({ length: beatsPerMeasure }).map((_, i) => (
                <motion.div
                  key={i}
                  animate={{
                    scale: currentBeat === i && isPlaying ? 1.2 : 1,
                    backgroundColor: currentBeat === i && isPlaying 
                      ? (i === 0 ? '#ef4444' : '#6366f1') 
                      : '#e2e8f0'
                  }}
                  className="flex-1 rounded-full border-2 border-white max-w-[40px]"
                />
              ))}
            </div>
          </div>

          {/* Main BPM Display */}
          <div className="w-full bg-white/40 backdrop-blur-md rounded-[4rem] border-4 border-white p-12 lg:p-16 flex flex-col items-center relative overflow-hidden">
            <div className="relative flex flex-col items-center">
              <div className="flex items-center gap-8 lg:gap-12">
                <button 
                  onClick={() => setBpm(prev => Math.max(MIN_BPM, prev - 1))}
                  className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:scale-110 transition-all border-2 border-slate-50"
                >
                  <Plus size={28} strokeWidth={3} className="rotate-45" />
                </button>

                <div className="text-center">
                  <div className="text-[10rem] md:text-[12rem] font-black text-slate-900 tabular-nums leading-none tracking-tighter">
                    {bpm}
                  </div>
                  <div className="text-sm font-black text-indigo-500 uppercase tracking-[0.8em] mt-4 ml-4">
                    <FormattedMessage id="metronome.bpm" defaultMessage="BPM" />
                  </div>
                </div>

                <button 
                  onClick={() => setBpm(prev => Math.min(MAX_BPM, prev + 1))}
                  className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:scale-110 transition-all border-2 border-slate-50"
                >
                  <Plus size={28} strokeWidth={3} />
                </button>
              </div>
            </div>

            <div className="w-full mt-16 px-4">
              <input 
                type="range"
                min={MIN_BPM}
                max={MAX_BPM}
                value={bpm}
                onChange={(e) => setBpm(parseInt(e.target.value))}
                className="w-full h-3 bg-slate-200/50 rounded-full appearance-none cursor-pointer accent-indigo-600"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="w-full flex justify-center mt-4">
            <button
              onClick={toggleMetronome}
              className={`w-full max-w-md py-8 rounded-[2.5rem] flex items-center justify-center gap-4 font-black uppercase tracking-[0.2em] text-lg transition-all active:scale-95 border-4 border-white ${
                isPlaying 
                  ? 'bg-rose-500 text-white hover:bg-rose-600' 
                  : 'bg-emerald-500 text-white hover:bg-emerald-600'
              }`}
            >
              {isPlaying ? (
                <>
                  <Pause size={24} fill="currentColor" />
                  <FormattedMessage id="metronome.stop" defaultMessage="Stop" />
                </>
              ) : (
                <>
                  <Play size={24} fill="currentColor" className="ml-1" />
                  <FormattedMessage id="metronome.start" defaultMessage="Start" />
                </>
              )}
            </button>
          </div>

        </div>

        {/* Decorative Background Elements */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-50/30 rounded-full blur-[140px] -z-10 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-purple-50/30 rounded-full blur-[140px] -z-10 pointer-events-none" />
      </ToolPanel>
    </div>
  );
};

export default Metronome;
