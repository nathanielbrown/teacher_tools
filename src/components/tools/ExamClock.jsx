import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Settings, AlertCircle } from 'lucide-react';
import { ToolHeader } from '../ToolHeader';
import { useSettings } from '../../contexts/SettingsContext';
import { audioEngine } from '../../utils/audio';

export const ExamClock = () => {
  const [readingTime, setReadingTime] = useState(5); // minutes
  const [examTime, setExamTime] = useState(60); // minutes
  const [warningTime, setWarningTime] = useState(5); // minutes
  const [examName, setExamName] = useState('Final Examination');

  const [phase, setPhase] = useState('setup'); // 'setup', 'reading', 'paused', 'exam', 'finished'
  const [timeLeft, setTimeLeft] = useState(0);

  const { settings } = useSettings();

  useEffect(() => {
    let interval;
    if ((phase === 'reading' || phase === 'exam') && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            audioEngine.playAlarm(settings.soundTheme);
            if (phase === 'reading') {
              setPhase('paused'); // Pause after reading time
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
    return () => clearInterval(interval);
  }, [phase, timeLeft, examTime, settings.soundTheme]);

  const startReading = () => {
    setTimeLeft(readingTime * 60);
    setPhase('reading');
  };

  const startExam = () => {
    if (phase === 'paused' || phase === 'setup') {
      setTimeLeft(examTime * 60);
    }
    setPhase('exam');
  };

  const reset = () => {
    setPhase('setup');
    setTimeLeft(0);
  };

  const needsHours = examTime >= 60 || readingTime >= 60;

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0 || needsHours) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getStatusColor = () => {
    if (phase === 'reading') return 'bg-blue-50 border-blue-500 text-blue-700';
    if (phase === 'paused') return 'bg-gray-50 border-gray-500 text-gray-700';
    if (phase === 'exam') {
      if (timeLeft <= warningTime * 60) return 'bg-orange-50 border-orange-500 text-orange-600 animate-pulse';
      return 'bg-green-50 border-green-500 text-green-700';
    }
    if (phase === 'finished') return 'bg-red-50 border-red-500 text-red-600';
    return 'bg-white border-primary/20 text-text';
  };

  const getStatusText = () => {
    if (phase === 'reading') return 'Reading Time';
    if (phase === 'paused') return 'Waiting to start exam...';
    if (phase === 'exam') {
      if (timeLeft <= warningTime * 60) return 'Warning: Time is almost up!';
      return 'Exam in Progress';
    }
    if (phase === 'finished') return 'Exam Finished - Pens Down!';
    return 'Setup Exam';
  };

  return (
    <div className="w-full mx-auto px-4 pt-2 pb-8 h-full flex flex-col gap-8">
      <ToolHeader
        title="Exam Clock"
        icon={AlertCircle}
        description="Structured Timing for Formal Assessments"
        infoContent={
          <>
            <p>
              <strong className="text-white block mb-1">Reading Time</strong>
              Set a dedicated reading period before the exam starts. The clock will pause automatically after reading time ends.
            </p>
            <p>
              <strong className="text-white block mb-1">Warning Period</strong>
              Define a warning time (e.g., 5 minutes) to trigger a visual pulse when time is running low.
            </p>
          </>
        }
      />

      <div className={`flex flex-col gap-8 w-full max-w-7xl items-center justify-center mx-auto`}>
        {phase === 'setup' ? (
          <div className="bg-white p-8 md:p-12 rounded-[3rem] shadow-2xl border-4 border-slate-100 w-full max-w-2xl space-y-8 transition-all">
            <label className="text-2xl font-black text-slate-700 uppercase tracking-wider block text-center border-b pb-6">Exam Configuration</label>
            
            <div className="space-y-6">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-2 ml-1 text-center">Exam Name</label>
                <input 
                  type="text" 
                  value={examName} 
                  onChange={(e) => setExamName(e.target.value)} 
                  placeholder="Enter exam name..."
                  className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-primary focus:outline-none transition-all font-bold text-2xl text-center" 
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-2 ml-1 text-center">Reading Time (min)</label>
                  <input 
                    type="number" 
                    min="0" 
                    value={readingTime} 
                    onChange={(e) => setReadingTime(Number(e.target.value))} 
                    className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-primary focus:outline-none transition-all font-bold text-2xl text-center" 
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-2 ml-1 text-center">Exam Time (min)</label>
                  <input 
                    type="number" 
                    min="1" 
                    value={examTime} 
                    onChange={(e) => setExamTime(Number(e.target.value))} 
                    className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-primary focus:outline-none transition-all font-bold text-2xl text-center" 
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-2 ml-1 text-center">Warning Time (min)</label>
                  <input 
                    type="number" 
                    min="0" 
                    max={examTime} 
                    value={warningTime} 
                    onChange={(e) => setWarningTime(Number(e.target.value))} 
                    className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-primary focus:outline-none transition-all font-bold text-2xl text-center" 
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button onClick={startReading} className="flex-1 py-4 bg-blue-500 text-white font-black text-sm uppercase tracking-widest rounded-2xl hover:bg-blue-600 transition-all shadow-lg hover:shadow-xl active:scale-95">
                Start Reading Time
              </button>
              <button onClick={startExam} className="flex-1 py-4 bg-green-500 text-white font-black text-sm uppercase tracking-widest rounded-2xl hover:bg-green-600 transition-all shadow-lg hover:shadow-xl active:scale-95">
                Skip to Exam
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center w-full max-w-5xl">
            <div className={`w-full p-8 md:p-12 rounded-[3rem] shadow-2xl border-4 transition-colors duration-500 flex flex-col items-center justify-center ${getStatusColor()}`}>
              <h2 className="text-xl md:text-3xl font-black mb-4 uppercase tracking-[0.2em] text-center px-4">{examName}</h2>
              <h3 className="text-sm md:text-lg font-bold mb-6 uppercase tracking-widest opacity-60 border-b border-current pb-1">{getStatusText()}</h3>
              <span className="text-[8rem] md:text-[12rem] font-mono font-bold tabular-nums tracking-tighter leading-none filter drop-shadow-lg">
                {formatTime(timeLeft)}
              </span>

            </div>

            <div className="flex flex-col items-center gap-6 w-full mt-8">
              <div className="flex space-x-6">
                {phase === 'reading' && (
                  <button onClick={() => { setPhase('paused'); setTimeLeft(examTime * 60); }} className="px-8 py-4 bg-orange-500 text-white rounded-2xl hover:bg-orange-600 font-bold flex items-center shadow-lg transition-transform hover:scale-105 active:scale-95 text-lg">
                    <Pause className="mr-2" /> Skip Reading
                  </button>
                )}
                {phase === 'paused' && (
                  <button onClick={startExam} className="px-8 py-4 bg-green-500 text-white rounded-2xl hover:bg-green-600 font-bold flex items-center shadow-xl animate-bounce transition-transform hover:scale-105 active:scale-95 text-lg">
                    <Play className="mr-2" /> Start Exam
                  </button>
                )}
                <button onClick={reset} className="px-8 py-4 bg-gray-200 text-gray-700 rounded-2xl hover:bg-gray-300 font-bold flex items-center shadow-md transition-transform hover:scale-105 active:scale-95 text-lg">
                  <RotateCcw className="mr-2" /> Reset
                </button>
              </div>

              {/* Exam Details repositioned under the clock */}
              <div className="bg-white/80 p-6 rounded-[2rem] shadow-xl border border-gray-100 w-full max-w-xl backdrop-blur-md">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block text-center border-b border-slate-100 pb-3 mb-4">Exam Parameters</label>
                 <div className="grid grid-cols-3 gap-6">
                   <div className="flex flex-col items-center">
                     <span className="text-[9px] font-black text-slate-300 uppercase mb-0.5">Reading</span>
                     <span className="text-xl font-black text-slate-700">{readingTime}m</span>
                   </div>
                   <div className="flex flex-col items-center border-x border-slate-100">
                     <span className="text-[9px] font-black text-slate-300 uppercase mb-0.5">Exam</span>
                     <span className="text-xl font-black text-slate-700">{examTime}m</span>
                   </div>
                   <div className="flex flex-col items-center">
                     <span className="text-[9px] font-black text-slate-300 uppercase mb-0.5">Warning</span>
                     <span className="text-xl font-black text-slate-700">{warningTime}m</span>
                   </div>
                 </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
