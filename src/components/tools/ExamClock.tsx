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
        <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center text-xs font-black text-indigo-600 shrink-0">1</div>
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
        <div className="w-6 h-6 rounded-lg bg-emerald-50 flex items-center justify-center text-xs font-black text-emerald-600 shrink-0">3</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">
          <FormattedMessage 
            id="examclock.help.step3" 
            defaultMessage="After reading, the clock waits. Click <b>Start Exam</b> to begin the main time."
            values={{ b: (chunks: React.ReactNode) => <b>{chunks}</b> }}
          />
        </p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-rose-50 flex items-center justify-center text-xs font-black text-rose-600 shrink-0">4</div>
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
    <ToolPanel className="italic" baseWidth={1200} baseHeight={800}>
      <AnimatePresence mode="wait">
        {phase === 'setup' ? (
          <motion.div 
            key="setup"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="w-full max-w-4xl space-y-12 relative z-10"
          >
            {/* Simple Header */}
            <div className="text-center space-y-4 shrink-0 mb-8">
              <h1 className="text-5xl lg:text-6xl font-black text-slate-900 tracking-tighter uppercase leading-none">
                <FormattedMessage id="examclock.setup.title" defaultMessage="New Exam" />
              </h1>
            </div>

            <div className="bg-slate-50/50 p-10 lg:p-16 rounded-[4rem] border-4 border-white  space-y-12">
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] ml-2">
                  <FormattedMessage id="examclock.setup.name" defaultMessage="Exam Name" />
                </label>
                <input 
                  type="text" 
                  value={examName} 
                  onChange={(e) => setExamName(e.target.value)}
                  className="w-full p-10 bg-white border-4 border-transparent focus:border-indigo-100 rounded-[2.5rem] font-black text-3xl lg:text-5xl text-slate-900 text-center outline-none transition-all  placeholder:text-slate-100 uppercase italic tracking-tighter"
                  placeholder={intl.formatMessage({ id: 'examclock.setup.name', defaultMessage: 'Exam Name' })}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                  { label: 'examclock.setup.reading', val: readingTime, set: setReadingTime, color: 'text-indigo-500', default: 'Reading' },
                  { label: 'examclock.setup.exam', val: examTime, set: setExamTime, color: 'text-emerald-500', default: 'Exam' },
                  { label: 'examclock.setup.warning', val: warningTime, set: setWarningTime, color: 'text-rose-500', default: 'Warning' }
                ].map((item, idx) => (
                  <div key={idx} className="space-y-4 text-center">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block">
                      <FormattedMessage id={item.label} defaultMessage={item.default} /> (<FormattedMessage id="examclock.setup.minutes" defaultMessage="Min" />)
                    </label>
                    <input 
                      type="number" 
                      value={item.val} 
                      onChange={(e) => item.set(Math.max(0, parseInt(e.target.value) || 0))}
                      className={`w-full p-8 bg-white border-4 border-transparent focus:border-indigo-100 rounded-[2rem] font-black text-4xl lg:text-5xl ${item.color} text-center outline-none transition-all tabular-nums  italic leading-none`}
                    />
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-6 pt-8">
                <button 
                  onClick={startReading}
                  className="flex-1 h-24 bg-white border-4 border-indigo-100 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-[2.5rem] font-black text-xl uppercase tracking-widest transition-all  active:scale-95 flex items-center justify-center gap-4 group"
                >
                  <History className="group-hover:rotate-180 transition-transform duration-500" />
                  <FormattedMessage id="examclock.setup.start_reading" defaultMessage="Start Reading" />
                </button>
                <button 
                  onClick={startExam}
                  className="flex-1 h-24 bg-indigo-600 text-white rounded-[2.5rem] font-black text-xl uppercase tracking-widest transition-all  active:scale-95 flex items-center justify-center gap-4 hover:bg-indigo-700"
                >
                  <Play fill="currentColor" />
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
            className="w-full max-w-6xl space-y-12 flex flex-col items-center relative z-10"
          >
            {/* Status Indicator */}
            <div className="flex flex-col items-center gap-6">
              <div className="flex items-center gap-4 px-10 py-4 bg-slate-900 rounded-[2rem] border-4 border-white ">
                <div className={`w-3 h-3 rounded-full animate-pulse -[0_0_15px_currentColor] ${phase === 'reading' ? 'text-indigo-400' : (phase === 'paused' ? 'text-amber-400' : (timeLeft <= warningTime * 60 ? 'text-rose-400' : 'text-emerald-400'))}`} />
                <span className="text-[12px] font-black text-white uppercase tracking-[0.4em] italic">{getPhaseLabel()}</span>
              </div>
              <h2 className="text-4xl lg:text-6xl font-black text-slate-900 tracking-tighter uppercase leading-none">{examName}</h2>
            </div>

            {/* Main Timer Display */}
            <div className={`w-full bg-white rounded-[5rem] border-8  p-16 lg:p-24 flex flex-col items-center justify-center relative overflow-hidden transition-all duration-700 ${phase === 'exam' && timeLeft <= warningTime * 60 ? 'border-rose-500 bg-rose-50/20' : 'border-indigo-600'}`}>
               <div className="tool-grid-bg opacity-10 pointer-events-none" />
               <div className={`text-[12rem] lg:text-[22rem] font-black tabular-nums tracking-tighter leading-none transition-all duration-700  ${phase === 'exam' && timeLeft <= warningTime * 60 ? 'text-rose-600 scale-105' : 'text-slate-900'}`}>
                  {formatTime(timeLeft)}
               </div>
            </div>

            {/* Phase Controls */}
            <div className="flex items-center gap-8">
              {phase === 'reading' && (
                <button 
                  onClick={() => { setPhase('paused'); setTimeLeft(examTime * 60); audioEngine.playTick(settings.soundTheme); }}
                  className="px-16 py-8 bg-white border-4 border-amber-100 text-amber-600 hover:bg-amber-600 hover:text-white rounded-[2.5rem] font-black text-xl uppercase tracking-widest flex items-center gap-4  transition-all active:scale-95"
                >
                  <Pause size={28} fill="currentColor" strokeWidth={0} />
                  <FormattedMessage id="examclock.active.skip_reading" defaultMessage="Skip Reading" />
                </button>
              )}
              {phase === 'paused' && (
                <button 
                  onClick={() => { startExam(); audioEngine.playTick(settings.soundTheme); }}
                  className="px-20 py-10 bg-emerald-500 hover:bg-emerald-600 text-white rounded-[3rem] font-black text-2xl uppercase tracking-widest flex items-center gap-6  transition-all active:scale-95 animate-pulse"
                >
                  <Play size={36} fill="white" strokeWidth={0} />
                  <FormattedMessage id="examclock.active.start_exam" defaultMessage="Start Exam" />
                </button>
              )}
              {phase === 'finished' && (
                <div className="flex flex-col items-center gap-6">
                   <button 
                    onClick={reset}
                    className="px-16 py-8 bg-slate-900 text-white rounded-[2.5rem] font-black text-xl uppercase tracking-widest  transition-all active:scale-95"
                  >
                    <FormattedMessage id="examclock.active.reset" defaultMessage="Reset Exam" />
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
