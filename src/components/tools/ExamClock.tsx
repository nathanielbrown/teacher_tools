import React, { useState, useEffect, useCallback } from 'react';
import { 
  Play, 
  RotateCcw, 
  Pause,
  Clock,
  History,
  Timer
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSettings } from '../../contexts/SettingsContext';
import { useHeader } from '../../contexts/HeaderContext';
import { audioEngine } from '../../utils/audio';
import { ToolPanel } from '../shared/ToolPanel';
import { useIntl, FormattedMessage } from 'react-intl';
import { useLocalStorage } from '../../hooks/useLocalStorage';


// 3. Text (Help and Info)
const getHelpInfo = () => (
  <div className="space-y-4 font-['Outfit']">
    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight italic">
      <FormattedMessage id="examclock.help.title" defaultMessage="How to Use the Exam Clock" />
    </h3>
    <div className="space-y-3 italic">
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-primary/5 flex items-center justify-center text-xs font-black text-primary shrink-0">1</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">
          <FormattedMessage 
            id="examclock.help.step1" 
            defaultMessage="Set the <b>Name</b> and times for reading, the exam, and the warning."
            values={{ b: (chunks: React.ReactNode) => <b>{chunks}</b> }}
          />
        </p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center text-xs font-black text-blue-600 shrink-0">2</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">
          <FormattedMessage 
            id="examclock.help.step2" 
            defaultMessage="Click <b>Start Reading</b> to begin the first countdown."
            values={{ b: (chunks: React.ReactNode) => <b>{chunks}</b> }}
          />
        </p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-success-bg flex items-center justify-center text-xs font-black text-success shrink-0">3</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">
          <FormattedMessage 
            id="examclock.help.step3" 
            defaultMessage="After reading, the clock waits. Click <b>Start Exam</b> to begin the main time."
            values={{ b: (chunks: React.ReactNode) => <b>{chunks}</b> }}
          />
        </p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-caution-bg flex items-center justify-center text-xs font-black text-caution shrink-0">4</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">
          <FormattedMessage 
            id="examclock.help.step4" 
            defaultMessage="The clock turns <b>Red</b> when the warning time is reached."
            values={{ b: (chunks: React.ReactNode) => <b>{chunks}</b> }}
          />
        </p>
      </div>
    </div>
  </div>
);

// 7. Component
export const ExamClock = () => {
  const { settings } = useSettings();
  const { setOnReset, clearHeader, setHelpContent } = useHeader();
  const intl = useIntl();
  
  const [readingTime, setReadingTime] = useLocalStorage('examclock_reading_time', 5);
  const [examTime, setExamTime] = useLocalStorage('examclock_exam_time', 60);
  const [warningTime, setWarningTime] = useLocalStorage('examclock_warning_time', 5);
  const [examName, setExamName] = useLocalStorage('examclock_name', 'Final Examination');

  const [phase, setPhase] = useState<'setup' | 'reading' | 'paused' | 'exam' | 'finished'>('setup');
  const [timeLeft, setTimeLeft] = useState(0);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 1024 : false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const reset = useCallback(() => {
    setPhase('setup');
    setTimeLeft(0);
    audioEngine.playTick(settings.soundTheme);
  }, [settings.soundTheme]);

  useEffect(() => {
    setOnReset(() => reset);
    setHelpContent(getHelpInfo());
    return () => clearHeader();
  }, [clearHeader, setOnReset, reset, setHelpContent]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if ((phase === 'reading' || phase === 'exam') && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            audioEngine.playAlarm(settings.soundTheme);
            if (phase === 'reading') {
              setPhase('paused');
              setTimeLeft(examTime * 60);
            } else {
              setPhase('finished');
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [phase, timeLeft, examTime, settings.soundTheme]);

  const startReading = () => {
    if (readingTime > 0) {
      setTimeLeft(readingTime * 60);
      setPhase('reading');
    } else {
      startExam();
    }
    audioEngine.playTick(settings.soundTheme);
  };

  const startExam = () => {
    setTimeLeft(examTime * 60);
    setPhase('exam');
    audioEngine.playTick(settings.soundTheme);
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getPhaseLabel = () => {
    switch(phase) {
      case 'reading': return intl.formatMessage({ id: 'examclock.active.reading', defaultMessage: 'Reading' });
      case 'paused': return intl.formatMessage({ id: 'examclock.active.waiting', defaultMessage: 'Waiting' });
      case 'exam': return timeLeft <= warningTime * 60 
        ? intl.formatMessage({ id: 'examclock.active.warning', defaultMessage: 'Warning' })
        : intl.formatMessage({ id: 'examclock.active.exam', defaultMessage: 'Exam' });
      case 'finished': return intl.formatMessage({ id: 'examclock.active.finished', defaultMessage: 'Finished' });
      default: return '';
    }
  };

  return (
    <ToolPanel 
      className="italic" 
      baseWidth={isMobile ? 400 : 1000} 
      baseHeight={isMobile ? 900 : 800} 
      fluid={isMobile}
      alignTop={isMobile}
    >
      <AnimatePresence mode="wait">
        {phase === 'setup' ? (
          <motion.div 
            key="setup"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="w-full max-w-[1300px] space-y-6 lg:space-y-12 relative z-10 px-4 md:px-12"
          >
            {/* Simple Header */}
            <div className="text-center space-y-2 shrink-0">
              <h1 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none">
                <FormattedMessage id="examclock.setup.title" defaultMessage="New Exam" />
              </h1>
            </div>

            <div className="bg-slate-50/50 p-6 lg:p-8 rounded-[3rem] border-4 border-white  space-y-6 lg:space-y-8">
              <div className="space-y-4">
                <label className="text-xs lg:text-[10px] font-black text-neutral-400 uppercase tracking-[0.4em] ml-2">
                  <FormattedMessage id="examclock.setup.name" defaultMessage="Exam Name" />
                </label>
                <input 
                  type="text" 
                  value={examName} 
                  onChange={(e) => setExamName(e.target.value)}
                  className="w-full p-4 bg-surface border-4 border-transparent focus:border-primary/20 rounded-2xl lg:rounded-[2rem] font-black text-2xl lg:text-4xl text-slate-900 text-center outline-none transition-all placeholder:text-slate-100 uppercase italic tracking-tighter"
                  placeholder={intl.formatMessage({ id: 'examclock.setup.name', defaultMessage: 'Exam Name' })}
                />
              </div>

              <div className="grid grid-cols-3 gap-2 lg:gap-8">
                {[
                  { label: 'examclock.setup.reading', val: readingTime, set: setReadingTime, color: 'text-primary', default: 'Read' },
                  { label: 'examclock.setup.exam', val: examTime, set: setExamTime, color: 'text-emerald-500', default: 'Exam' },
                  { label: 'examclock.setup.warning', val: warningTime, set: setWarningTime, color: 'text-caution', default: 'Warn' }
                ].map((item, idx) => (
                  <div key={idx} className="space-y-2 lg:space-y-4 text-center">
                    <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest block truncate">
                      <FormattedMessage id={item.label} defaultMessage={item.default} />
                    </label>
                    <input 
                      type="number" 
                      value={item.val} 
                      onChange={(e) => item.set(Math.max(0, parseInt(e.target.value) || 0))}
                      className={`w-full p-3 lg:p-4 bg-surface border-4 border-transparent focus:border-primary/20 rounded-xl lg:rounded-[1.5rem] font-black text-xl lg:text-3xl ${item.color} text-center outline-none transition-all tabular-nums italic leading-none`}
                    />
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-3 lg:gap-4 pt-2 lg:pt-6">
                <button 
                  onClick={startReading}
                  className="flex-1 h-16 bg-surface border-4 border-primary/20 text-primary hover:bg-primary hover:text-white rounded-[1.5rem] lg:rounded-[2rem] font-black text-sm lg:text-lg uppercase tracking-widest transition-all  active:scale-95 flex items-center justify-center gap-2 group"
                >
                  <History size={16} className="group-hover:rotate-180 transition-transform duration-500" />
                  <FormattedMessage id="examclock.setup.start_reading" defaultMessage="Start Reading" />
                </button>
                <button 
                  onClick={startExam}
                  className="flex-1 h-16 bg-primary text-white rounded-[1.5rem] lg:rounded-[2rem] font-black text-sm lg:text-lg uppercase tracking-widest transition-all  active:scale-95 flex items-center justify-center gap-2 hover:bg-primary/90"
                >
                  <Play size={16} fill="currentColor" />
                  <FormattedMessage id="examclock.setup.skip_reading" defaultMessage="Skip to Exam" />
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="active"
            initial={{ opacity: 0, scale: 1.1, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="w-full max-w-[1300px] space-y-8 flex flex-col items-center relative z-10 px-4 md:px-12"
          >
            {/* Status Indicator */}
            <div className="flex flex-col items-center gap-6">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full animate-pulse ${phase === 'reading' ? 'text-primary bg-primary' : (phase === 'paused' ? 'text-amber-500 bg-amber-500' : (timeLeft <= warningTime * 60 ? 'text-caution bg-rose-500' : 'text-emerald-500 bg-emerald-500'))}`} />
                <span className="text-[12px] lg:text-[12px] font-black text-neutral-400 uppercase tracking-[0.4em] italic">{getPhaseLabel()}</span>
              </div>
              <h2 className="text-3xl lg:text-5xl font-black text-slate-900 tracking-tighter uppercase leading-none">{examName}</h2>
            </div>

            {/* Main Timer Display */}
            <div className={`w-full bg-surface rounded-[4rem] border-8  p-8 lg:p-12 flex flex-col items-center justify-center relative overflow-hidden transition-all duration-700 ${phase === 'exam' && timeLeft <= warningTime * 60 ? 'border-rose-500 bg-caution-bg/20' : 'border-indigo-600'}`}>
               <div className="tool-grid-bg opacity-10 pointer-events-none" />
               <div className={`text-[4rem] sm:text-[6rem] md:text-[8rem] lg:text-[14rem] font-medium tabular-nums tracking-tighter leading-none transition-all duration-700  ${phase === 'exam' && timeLeft <= warningTime * 60 ? 'text-caution scale-105' : 'text-slate-900'}`}>
                  {formatTime(timeLeft)}
               </div>
            </div>

            {/* Phase Controls */}
            <div className="flex items-center gap-8">
              {phase === 'reading' && (
                <button 
                  onClick={() => { setPhase('paused'); setTimeLeft(examTime * 60); audioEngine.playTick(settings.soundTheme); }}
                  className="px-8 py-6 lg:px-16 lg:py-8 bg-surface border-4 border-warning-border text-warning hover:bg-amber-600 hover:text-white rounded-[2rem] lg:rounded-[2.5rem] font-black text-lg lg:text-xl uppercase tracking-widest flex items-center gap-3 transition-all active:scale-95"
                >
                  <Pause size={24} fill="currentColor" strokeWidth={0} />
                  <FormattedMessage id="examclock.active.skip_reading" defaultMessage="Skip" />
                </button>
              )}
              {phase === 'paused' && (
                <button 
                  onClick={() => { startExam(); audioEngine.playTick(settings.soundTheme); }}
                  className="px-10 py-6 lg:px-20 lg:py-10 bg-emerald-500 hover:bg-emerald-600 text-white rounded-[2rem] lg:rounded-[3rem] font-black text-xl lg:text-2xl uppercase tracking-widest flex items-center gap-3 transition-all active:scale-95 animate-pulse"
                >
                  <Play size={28} fill="white" strokeWidth={0} />
                  <FormattedMessage id="examclock.active.start_exam" defaultMessage="Start" />
                </button>
              )}
              {phase === 'finished' && (
                <div className="flex flex-col items-center gap-6">
                   <button 
                    onClick={reset}
                    className="px-10 py-6 lg:px-16 lg:py-8 bg-dark-bg text-white rounded-[2rem] lg:rounded-[2.5rem] font-black text-lg lg:text-xl uppercase tracking-widest transition-all active:scale-95"
                  >
                    <FormattedMessage id="examclock.active.reset" defaultMessage="Reset" />
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </ToolPanel>
  );
};

export default ExamClock;
