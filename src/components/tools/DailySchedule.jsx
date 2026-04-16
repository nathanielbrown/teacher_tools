import React, { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';

const defaultSchedule = [
  { id: '1', startTime: '08:30', endTime: '09:00', activity: 'Registration', emoji: '👋' },
  { id: '2', startTime: '09:00', endTime: '10:00', activity: 'Maths', emoji: '🔢' },
  { id: '3', startTime: '10:00', endTime: '10:30', activity: 'Break', emoji: '🥪' },
];

const SCHOOL_EMOJIS = ['👋', '🔢', '🥪', '📝', '🏃', '🎨', '🎵', '📖', '💻', '⚽', '🧪', '🍽️', '⚪'];

export const DailySchedule = () => {
  const [schedule, setSchedule] = useState(() => {
    const saved = localStorage.getItem('teacherToolsSchedule');
    return saved ? JSON.parse(saved) : defaultSchedule;
  });
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    localStorage.setItem('teacherToolsSchedule', JSON.stringify(schedule));
  }, [schedule]);

  const addActivity = () => {
    const lastEvent = schedule[schedule.length - 1];
    const defaultStartTime = lastEvent ? lastEvent.endTime : '08:30';

    let [hours, mins] = defaultStartTime.split(':').map(Number);
    hours += 1;
    if (hours >= 24) hours = 0;
    const defaultEndTime = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;

    const newActivity = {
      id: Date.now().toString(),
      startTime: defaultStartTime,
      endTime: defaultEndTime,
      activity: 'New Activity',
      emoji: '📝'
    };
    setSchedule([...schedule, newActivity]);
  };

  const updateActivity = (id, field, value) => {
    setSchedule(schedule.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const getCompletionPercentage = (startTime, endTime) => {
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

  const removeActivity = (id) => {
    const index = schedule.findIndex(item => item.id === id);
    if (index === -1) return;

    const removedItem = schedule[index];
    const newSchedule = schedule.filter(item => item.id !== id);

    if (removedItem.activity === 'Empty Task') {
      setSchedule(newSchedule);
    } else {
      setSchedule(schedule.map(item =>
        item.id === id
          ? { ...item, activity: 'Empty Task', emoji: '⚪', startTime: removedItem.startTime, endTime: removedItem.endTime }
          : item
      ));
    }
  };

  return (
    <div className="flex flex-col items-center max-w-4xl mx-auto space-y-8 pb-12">
      <h2 className="text-3xl font-bold text-primary">Daily Schedule</h2>

      <div className="w-full bg-white rounded-2xl shadow-lg p-6 space-y-4 border-2 border-gray-100">
        <div className="space-y-4">
          {schedule.map((item) => {
            const completion = getCompletionPercentage(item.startTime, item.endTime);
            return (
            <div
              key={item.id}
              className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 transition-all shadow-sm"
              style={{
                background: `linear-gradient(to right, rgba(59, 130, 246, 0.1) ${completion}%, white ${completion}%)`
              }}
            >
              <input
                type="time"
                value={item.startTime}
                onChange={(e) => updateActivity(item.id, 'startTime', e.target.value)}
                className="p-2 border rounded-lg focus:ring-2 focus:ring-primary w-32"
              />
              <span className="text-gray-400">to</span>
              <input
                type="time"
                value={item.endTime}
                onChange={(e) => updateActivity(item.id, 'endTime', e.target.value)}
                className="p-2 border rounded-lg focus:ring-2 focus:ring-primary w-32"
              />

              <select
                value={item.emoji}
                onChange={(e) => updateActivity(item.id, 'emoji', e.target.value)}
                className="p-2 border rounded-lg focus:ring-2 focus:ring-primary w-16 text-center text-xl bg-white"
                title="Emoji"
              >
                {SCHOOL_EMOJIS.map(emoji => (
                  <option key={emoji} value={emoji}>{emoji}</option>
                ))}
              </select>

              <input
                type="text"
                value={item.activity}
                onChange={(e) => updateActivity(item.id, 'activity', e.target.value)}
                className="flex-1 p-2 border rounded-lg focus:ring-2 focus:ring-primary font-medium"
                placeholder="Activity Name"
              />

              <button
                onClick={() => removeActivity(item.id)}
                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors bg-white/50"
                title={item.activity === 'Empty Task' ? "Remove placeholder" : "Clear task"}
              >
                <Trash2 size={20} />
              </button>
            </div>
          )})}
        </div>

        <button
          onClick={addActivity}
          className="w-full py-4 mt-6 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:text-primary hover:border-primary hover:bg-primary/5 transition-all flex items-center justify-center gap-2 font-semibold"
        >
          <Plus size={24} />
          Add Activity
        </button>
      </div>
    </div>
  );
};
