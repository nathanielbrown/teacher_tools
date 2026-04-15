import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Settings } from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';
import { audioEngine } from '../../utils/audio';

export const ExamClock = () => {
  const [readingTime, setReadingTime] = useState(5); // minutes
  const [examTime, setExamTime] = useState(60); // minutes
  const [warningTime, setWarningTime] = useState(5); // minutes

  const [phase, setPhase] = useState('setup'); // 'setup', 'reading', 'paused', 'exam', 'finished'
  const [timeLeft, setTimeLeft] = useState(0);

  const { settings } = useSettings();

  useEffect(() => {
    let interval;
    if ((phase === 'reading' || phase === 'exam') && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            audioEngine.playAlarm(settings.soundsEnabled);
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
  }, [phase, timeLeft, examTime, settings.soundsEnabled]);

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

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) {
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
    <div className="flex flex-col items-center justify-center space-y-8 max-w-2xl mx-auto">
      <h2 className="text-3xl font-bold text-primary">Exam Clock</h2>

      {phase === 'setup' && (
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200 w-full space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Reading Time (min)</label>
              <input type="number" min="0" value={readingTime} onChange={(e) => setReadingTime(Number(e.target.value))} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Exam Time (min)</label>
              <input type="number" min="1" value={examTime} onChange={(e) => setExamTime(Number(e.target.value))} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Warning Time (min)</label>
              <input type="number" min="0" max={examTime} value={warningTime} onChange={(e) => setWarningTime(Number(e.target.value))} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary" />
            </div>
          </div>
          <div className="flex justify-center space-x-4 pt-4 border-t">
            <button onClick={startReading} className="px-6 py-3 bg-blue-500 text-white font-bold rounded-xl hover:bg-blue-600 transition-colors">
              Start with Reading Time
            </button>
            <button onClick={startExam} className="px-6 py-3 bg-green-500 text-white font-bold rounded-xl hover:bg-green-600 transition-colors">
              Skip to Exam
            </button>
          </div>
        </div>
      )}

      {phase !== 'setup' && (
        <>
          <div className={`w-full p-12 rounded-[3rem] shadow-2xl border-4 transition-colors duration-500 flex flex-col items-center justify-center ${getStatusColor()}`}>
            <h3 className="text-2xl font-bold mb-4 uppercase tracking-widest opacity-80">{getStatusText()}</h3>
            <span className="text-8xl md:text-[10rem] font-mono font-bold tabular-nums tracking-tighter leading-none">
              {formatTime(timeLeft)}
            </span>
          </div>

          <div className="flex space-x-4">
            {phase === 'reading' && (
              <button onClick={() => { setPhase('paused'); setTimeLeft(examTime * 60); }} className="px-6 py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 font-bold flex items-center">
                <Pause className="mr-2" /> Skip Reading
              </button>
            )}
            {phase === 'paused' && (
              <button onClick={startExam} className="px-6 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 font-bold flex items-center shadow-lg animate-bounce">
                <Play className="mr-2" /> Start Exam
              </button>
            )}
            <button onClick={reset} className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 font-bold flex items-center">
              <RotateCcw className="mr-2" /> Reset
            </button>
          </div>
        </>
      )}
    </div>
  );
};
