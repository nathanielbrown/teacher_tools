import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Clock, RotateCcw, XCircle } from 'lucide-react';
import { ToolHeader } from '../ToolHeader';

const defaultSchedule = [
  { id: '1', startTime: '08:30', endTime: '09:00', activity: 'Registration', emoji: '👋' },
  { id: '2', startTime: '09:00', endTime: '10:00', activity: 'Maths', emoji: '🔢' },
  { id: '3', startTime: '10:00', endTime: '10:20', activity: 'Recess', emoji: '🥪' },
  { id: '4', startTime: '10:20', endTime: '11:20', activity: 'English', emoji: '📝' },
  { id: '5', startTime: '11:20', endTime: '12:20', activity: 'Science', emoji: '🧪' },
  { id: '6', startTime: '12:20', endTime: '13:10', activity: 'Lunch', emoji: '🍽️' },
  { id: '7', startTime: '13:10', endTime: '14:10', activity: 'Art', emoji: '🎨' },
  { id: '8', startTime: '14:10', endTime: '15:10', activity: 'PE', emoji: '🏃' },
  { id: '9', startTime: '15:10', endTime: '15:30', activity: 'Pack Up', emoji: '🎒' },
];

const SCHOOL_EMOJIS = ['👋', '🔢', '🥪', '📝', '🏃', '🎨', '🎵', '📖', '💻', '⚽', '🧪', '🍽️', '🎒', '⚪'];

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

const defaultSchedules = DAYS.reduce((acc, day) => {
  acc[day] = defaultSchedule;
  return acc;
}, {});

export const DailySchedule = () => {
  const [schedules, setSchedules] = useState(() => {
    const saved = localStorage.getItem('teacherToolsSchedules');
    if (saved) return JSON.parse(saved);
    const oldSaved = localStorage.getItem('teacherToolsSchedule');
    if (oldSaved) {
      const parsed = JSON.parse(oldSaved);
      return DAYS.reduce((acc, day) => ({ ...acc, [day]: parsed }), {});
    }
    return defaultSchedules;
  });

  const [currentDay, setCurrentDay] = useState(() => {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    return DAYS.includes(today) ? today : 'Monday';
  });

  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    localStorage.setItem('teacherToolsSchedules', JSON.stringify(schedules));
  }, [schedules]);

  const currentSchedule = schedules[currentDay] || [];

  const setCurrentSchedule = (newScheduleOrUpdater) => {
    setSchedules(prev => {
      const newSchedule = typeof newScheduleOrUpdater === 'function' 
        ? newScheduleOrUpdater(prev[currentDay] || []) 
        : newScheduleOrUpdater;
      return { ...prev, [currentDay]: newSchedule };
    });
  };

  const addActivity = (startTime, endTime) => {
    const lastEvent = currentSchedule[currentSchedule.length - 1];
    const defaultStartTime = startTime || (lastEvent ? lastEvent.endTime : '08:30');
    let defaultEndTime = endTime;

    if (!defaultEndTime) {
      let [hours, mins] = defaultStartTime.split(':').map(Number);
      hours += 1;
      if (hours >= 24) hours = 0;
      defaultEndTime = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
    }

    const newActivity = {
      id: Date.now().toString(),
      startTime: defaultStartTime,
      endTime: defaultEndTime,
      activity: 'New Activity',
      emoji: '📝'
    };
    setCurrentSchedule(prev => [...prev, newActivity].sort((a, b) => a.startTime.localeCompare(b.startTime)));
  };

  const updateActivity = (id, field, value) => {
    setCurrentSchedule(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const removeActivity = (id) => {
    setCurrentSchedule(prev => prev.filter(item => item.id !== id));
  };

  const resetToDefault = () => {
    setCurrentSchedule(defaultSchedule);
  };

  const clearSchedule = () => {
    setCurrentSchedule([]);
  };

  const getCompletionPercentage = (startTime, endTime) => {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    if (currentDay !== today) return 0;

    const [startHours, startMins] = startTime.split(':').map(Number);
    const [endHours, endMins] = endTime.split(':').map(Number);

    const start = new Date(now);
    start.setHours(startHours, startMins, 0, 0);

    const end = new Date(now);
    end.setHours(endHours, endMins, 0, 0);

    if (now < start) return 0;
    if (now >= end) return 100;

    const totalDuration = end - start;
    const elapsed = now - start;

    return Math.max(0, Math.min(100, (elapsed / totalDuration) * 100));
  };

  return (
    <div className="w-full mx-auto px-4 pt-2 pb-8 h-full flex flex-col gap-8">
      <ToolHeader
        title="Daily Schedule"
        icon={Clock}
        description="Visual Routine & Time Management"
        infoContent={
          <>
            <p>
              <strong className="text-white block mb-1">Visual Progress</strong>
              The blue background on each activity shows real-time progress as the lesson proceeds (only for the current day).
            </p>
            <p>
              <strong className="text-white block mb-1">Persistence</strong>
              Your schedules are saved locally in this browser. You can maintain a different schedule for each day of the week.
            </p>
          </>
        }
      />

      <div className="w-full max-w-4xl mx-auto space-y-6">
        {/* Day Selector & Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex bg-slate-100 p-1 rounded-xl w-full sm:w-auto overflow-x-auto">
            {DAYS.map(day => (
              <button
                key={day}
                onClick={() => setCurrentDay(day)}
                className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
                  currentDay === day
                    ? 'bg-white text-primary shadow-sm'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                }`}
              >
                {day.substring(0, 3)}
              </button>
            ))}
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            <button
              onClick={resetToDefault}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-slate-50 text-slate-600 hover:text-primary hover:bg-blue-50 rounded-xl transition-all text-sm font-bold"
            >
              <RotateCcw size={16} />
              Reset
            </button>
            <button
              onClick={clearSchedule}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-slate-50 text-slate-600 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all text-sm font-bold"
            >
              <XCircle size={16} />
              Clear
            </button>
          </div>
        </div>

        {/* Center Column: Schedule List */}
        <div className="w-full space-y-4">
          {currentSchedule.length === 0 ? (
            <div className="text-center p-12 bg-white rounded-3xl border-2 border-dashed border-gray-200 text-gray-400 w-full">
              <p className="text-xl font-bold uppercase tracking-widest opacity-50">No activities scheduled</p>
              <button
                onClick={() => addActivity()}
                className="mt-6 px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition-all font-bold shadow-md inline-flex items-center gap-2"
              >
                <Plus size={20} /> Add First Activity
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-[2rem] shadow-xl p-4 border border-slate-100 space-y-2">
              <div className="flex justify-center -mb-1">
                <button
                  onClick={() => {
                    const first = currentSchedule[0];
                    let [h, m] = first.startTime.split(':').map(Number);
                    let total = h * 60 + m - 30;
                    if (total < 0) total = 0;
                    const start = `${Math.floor(total/60).toString().padStart(2, '0')}:${(total%60).toString().padStart(2, '0')}`;
                    addActivity(start, first.startTime);
                  }}
                  className="p-1 bg-slate-100 hover:bg-primary hover:text-white text-slate-400 rounded-full transition-all shadow-sm group/plus"
                  title="Add activity before"
                >
                  <Plus size={16} />
                </button>
              </div>

              {currentSchedule.map((item, index) => {
                const completion = getCompletionPercentage(item.startTime, item.endTime);
                const nextItem = currentSchedule[index + 1];
                const hasGap = nextItem && item.endTime < nextItem.startTime;

                return (
                  <React.Fragment key={item.id}>
                    <div
                      className="flex flex-col sm:flex-row items-center gap-2 p-2 rounded-xl border border-slate-50 transition-all shadow-sm hover:shadow-md group"
                      style={{
                        background: `linear-gradient(to right, rgba(59, 130, 246, 0.08) ${completion}%, white ${completion}%)`
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="time"
                          value={item.startTime}
                          onChange={(e) => updateActivity(item.id, 'startTime', e.target.value)}
                          className="p-1 bg-slate-50 border-2 border-transparent focus:border-primary rounded-lg text-sm font-bold text-slate-700 outline-none transition-all"
                        />
                        <span className="text-slate-300 font-bold uppercase text-[10px] tracking-widest">to</span>
                        <input
                          type="time"
                          value={item.endTime}
                          onChange={(e) => updateActivity(item.id, 'endTime', e.target.value)}
                          className="p-1 bg-slate-50 border-2 border-transparent focus:border-primary rounded-lg text-sm font-bold text-slate-700 outline-none transition-all"
                        />
                      </div>

                      <div className="flex items-center gap-2 flex-1 w-full sm:w-auto">
                        <div className="relative group/emoji">
                          <select
                            value={item.emoji}
                            onChange={(e) => updateActivity(item.id, 'emoji', e.target.value)}
                            className="appearance-none p-1 bg-slate-100 hover:bg-slate-200 border-2 border-transparent rounded-lg text-xl transition-all cursor-pointer w-10 h-10 flex items-center justify-center text-center"
                            title="Choose Emoji"
                          >
                            {SCHOOL_EMOJIS.map(emoji => (
                              <option key={emoji} value={emoji}>{emoji}</option>
                            ))}
                          </select>
                        </div>

                        <input
                          type="text"
                          value={item.activity}
                          onChange={(e) => updateActivity(item.id, 'activity', e.target.value)}
                          className="flex-1 p-2 bg-transparent border-b-2 border-transparent focus:border-primary font-bold text-slate-800 placeholder:text-slate-300 outline-none transition-all text-base"
                          placeholder="Activity Name"
                        />
                      </div>

                      <button
                        onClick={() => removeActivity(item.id)}
                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-100 sm:opacity-0 group-hover:opacity-100"
                        title="Delete activity"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>

                    {hasGap && (
                      <div className="flex justify-center py-1 relative">
                        <div className="absolute inset-0 flex items-center" aria-hidden="true">
                          <div className="w-full border-t border-slate-100 border-dashed"></div>
                        </div>
                        <button
                          onClick={() => addActivity(item.endTime, nextItem.startTime)}
                          className="relative z-10 p-0.5 bg-slate-100 hover:bg-primary hover:text-white text-slate-400 rounded-full transition-all shadow-sm group/plus flex items-center gap-1 px-2"
                        >
                          <Plus size={14} />
                          <span className="text-[10px] font-bold uppercase tracking-wider">Fill Gap</span>
                        </button>
                      </div>
                    )}
                  </React.Fragment>
                );
              })}

              <div className="flex justify-center -mt-2">
                <button
                  onClick={() => {
                    const last = currentSchedule[currentSchedule.length - 1];
                    addActivity(last.endTime);
                  }}
                  className="p-1 bg-slate-100 hover:bg-primary hover:text-white text-slate-400 rounded-full transition-all shadow-sm group/plus"
                  title="Add activity after"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
