import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, 
  Minus, 
  Music
} from 'lucide-react';
import { useHeader } from '../../contexts/HeaderContext';
import { useSettings } from '../../contexts/SettingsContext';
import { ToolPanel } from '../shared/ToolPanel';
import { FormattedMessage } from 'react-intl';
import { audioEngine } from '../../utils/audio';

// 1. Constants
const MIN_BPM = 20;
const MAX_BPM = 280;

// 2. Config (None)

// 3. Text (Help and Info)
const getHelpInfo = () => (
  <div className="space-y-4 font-['Outfit']">
    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight italic">
      <FormattedMessage id="metronome.help.title" defaultMessage="How to Use the Metronome" />
    </h3>
    <div className="space-y-3 italic">
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center text-xs font-black text-indigo-600 shrink-0">1</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">
          <FormattedMessage 
            id="metronome.help.step1" 
            defaultMessage="Change the <b>speed</b> using the slider or minus/plus buttons."
            values={{ b: (chunks: React.ReactNode) => <b>{chunks}</b> }}
          />
        </p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-emerald-50 flex items-center justify-center text-xs font-black text-emerald-600 shrink-0">2</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">
          <FormattedMessage 
            id="metronome.help.step2" 
            defaultMessage="Press <b>Start</b> to hear the beat. The visual indicator will pulse with the sound."
            values={{ b: (chunks: React.ReactNode) => <b>{chunks}</b> }}
          />
        </p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-rose-50 flex items-center justify-center text-xs font-black text-rose-600 shrink-0">3</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">
          <FormattedMessage 
            id="metronome.help.step3" 
            defaultMessage="Use the <b>Tap</b> button to set the speed by tapping along to a song."
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
export const Metronome = () => {
  const { setHeaderActions, setOnReset, clearHeader, setHelpContent } = useHeader();
  const { settings } = useSettings();
  
  const [bpm, setBpm] = useState(120);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentBeat, setCurrentBeat] = useState(0);
  
  const audioCtxRef = useRef<AudioContext | null>(null);
  const nextNoteTimeRef = useRef(0);
  const timerIDRef = useRef<number | null>(null);
  const tapTimesRef = useRef<number[]>([]);

  const initAudio = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
  }, []);

  const playClick = useCallback((time: number, isDownbeat: boolean) => {
    if (!audioCtxRef.current) return;
    const osc = audioCtxRef.current.createOscillator();
    const envelope = audioCtxRef.current.createGain();

    osc.frequency.value = isDownbeat ? 1000 : 800;
    envelope.gain.value = 1;
    envelope.gain.exponentialRampToValueAtTime(0.001, time + 0.1);

    osc.connect(envelope);
    envelope.connect(audioCtxRef.current.destination);

    osc.start(time);
    osc.stop(time + 0.1);
  }, []);

  const scheduler = useCallback(() => {
    while (audioCtxRef.current && nextNoteTimeRef.current < audioCtxRef.current.currentTime + 0.1) {
      const isDownbeat = currentBeat === 0;
      playClick(nextNoteTimeRef.current, isDownbeat);
      
      const secondsPerBeat = 60.0 / bpm;
      nextNoteTimeRef.current += secondsPerBeat;
      setCurrentBeat(prev => (prev + 1) % 4);
    }
    timerIDRef.current = window.setTimeout(scheduler, 25);
  }, [bpm, currentBeat, playClick]);

  const toggleMetronome = useCallback(() => {
    initAudio();
    if (!isPlaying) {
      if (audioCtxRef.current) {
        nextNoteTimeRef.current = audioCtxRef.current.currentTime;
      }
      setIsPlaying(true);
      scheduler();
    } else {
      setIsPlaying(false);
      if (timerIDRef.current) clearTimeout(timerIDRef.current);
    }
    audioEngine.playTick(settings.soundTheme);
  }, [isPlaying, scheduler, initAudio, settings.soundTheme]);

  const resetMetronome = useCallback(() => {
    setIsPlaying(false);
    setBpm(120);
    setCurrentBeat(0);
    if (timerIDRef.current) clearTimeout(timerIDRef.current);
  }, []);

  useEffect(() => {
    setOnReset(() => resetMetronome);
    setHelpContent(getHelpInfo());
    return () => {
      clearHeader();
      if (timerIDRef.current) clearTimeout(timerIDRef.current);
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
      }
    };
  }, [clearHeader, setOnReset, resetMetronome, setHelpContent]);

  useEffect(() => {
    setHeaderActions(null);
  }, [setHeaderActions]);

  const handleTap = useCallback(() => {
    const now = Date.now();
    tapTimesRef.current.push(now);
    if (tapTimesRef.current.length > 4) {
      tapTimesRef.current.shift();
    }
    
    if (tapTimesRef.current.length > 1) {
      const intervals = [];
      for (let i = 1; i < tapTimesRef.current.length; i++) {
        intervals.push(tapTimesRef.current[i] - tapTimesRef.current[i - 1]);
      }
      const avgInterval = intervals.reduce((a, b) => a + b) / intervals.length;
      const newBpm = Math.round(60000 / avgInterval);
      setBpm(Math.min(MAX_BPM, Math.max(MIN_BPM, newBpm)));
    }
    audioEngine.playTick(settings.soundTheme);
  }, [settings.soundTheme]);

  return (
    <ToolPanel className="italic" baseWidth={1200} baseHeight={800}>
      <div className="w-full max-w-2xl flex flex-col items-center gap-12 lg:gap-16 relative z-10">
        
        {/* Branding */}
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-indigo-600 rounded-[1.5rem] flex items-center justify-center text-white mx-auto  rotate-3 border-4 border-white mb-6">
            <Music size={32} strokeWidth={3} />
          </div>
          <div className="space-y-1">
             <h1 className="text-5xl lg:text-6xl font-black text-slate-900 tracking-tighter uppercase leading-none">
               <FormattedMessage id="metronome.title" defaultMessage="Metronome" />
             </h1>

          </div>
        </div>

        {/* BPM Display */}
        <div className="w-full bg-slate-50/50 backdrop-blur-xl rounded-[3.5rem] border-4 border-white p-10 lg:p-14  flex flex-col items-center relative overflow-hidden">
           <div className="tool-grid-bg opacity-10 pointer-events-none" />
           
           <div className="relative flex flex-col items-center">
              <motion.div
                animate={isPlaying ? {
                  scale: [1, 1.2, 1],
                  opacity: [0.1, 0.3, 0.1]
                } : {}}
                transition={{
                  duration: 60 / bpm,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="absolute inset-0 bg-indigo-500 rounded-full blur-3xl -z-10"
              />
              
              <div className="text-center relative">
                   <span className="text-8xl md:text-9xl font-black text-slate-900 tabular-nums italic">
                     {bpm}
                   </span>
                   <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.5em] mt-2">
                     <FormattedMessage id="metronome.bpm" defaultMessage="BPM" />
                   </span>
              </div>
           </div>

           {/* Slider Controls */}
           <div className="w-full mt-12 flex items-center gap-6">
              <button 
                onClick={() => setBpm(prev => Math.max(MIN_BPM, prev - 1))}
                className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:border-indigo-100 border-2 border-transparent transition-all "
              >
                <Minus size={20} strokeWidth={3} />
              </button>
              
              <input 
                type="range"
                min={MIN_BPM}
                max={MAX_BPM}
                value={bpm}
                onChange={(e) => setBpm(parseInt(e.target.value))}
                className="flex-1 h-3 bg-slate-200 rounded-full appearance-none cursor-pointer accent-indigo-600"
              />

              <button 
                onClick={() => setBpm(prev => Math.min(MAX_BPM, prev + 1))}
                className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:border-indigo-100 border-2 border-transparent transition-all "
              >
                <Plus size={20} strokeWidth={3} />
              </button>
           </div>
        </div>

        {/* Action Buttons */}
        <div className="w-full flex flex-col sm:flex-row gap-4">
             <button
               onClick={toggleMetronome}
               className={`flex-1 py-6 rounded-[2.5rem] font-black uppercase tracking-[0.2em] text-sm transition-all active:scale-95  border-4 border-white ${
                 isPlaying 
                   ? 'bg-rose-500 text-white hover:bg-rose-600' 
                   : 'bg-emerald-500 text-white hover:bg-emerald-600'
               }`}
             >
               {isPlaying 
                 ? <FormattedMessage id="metronome.stop" defaultMessage="Stop" /> 
                 : <FormattedMessage id="metronome.start" defaultMessage="Start" />
               }
             </button>

             <button
               onMouseDown={handleTap}
               className="flex-1 py-6 bg-white text-slate-900 border-4 border-slate-50 rounded-[2.5rem] font-black uppercase tracking-[0.2em] text-sm hover:bg-slate-900 hover:text-white transition-all active:scale-95 "
             >
               <FormattedMessage id="metronome.tap" defaultMessage="Tap" />
             </button>
        </div>

      </div>

      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-50 rounded-full blur-[120px] opacity-40 -z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-emerald-50 rounded-full blur-[120px] opacity-40 -z-10 pointer-events-none" />
    </ToolPanel>
  );
};

export default Metronome;
