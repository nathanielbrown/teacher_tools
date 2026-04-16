import React, { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';

export const EventCountdowns = () => {
  const [events, setEvents] = useState(() => {
    const saved = localStorage.getItem('teacherToolsEventCountdowns');
    return saved ? JSON.parse(saved) : [];
  });
  const [newEventName, setNewEventName] = useState('');
  const [newEventDate, setNewEventDate] = useState('');
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    localStorage.setItem('teacherToolsEventCountdowns', JSON.stringify(events));
  }, [events]);

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const addEvent = (e) => {
    e.preventDefault();
    if (!newEventName.trim() || !newEventDate) return;

    const newEvent = {
      id: Date.now().toString(),
      name: newEventName.trim(),
      date: newEventDate // string like "YYYY-MM-DDTHH:mm"
    };

    setEvents([...events, newEvent]);
    setNewEventName('');
    setNewEventDate('');
  };

  const removeEvent = (id) => {
    setEvents(events.filter(event => event.id !== id));
  };

  const calculateTimeLeft = (targetDateString) => {
    const target = new Date(targetDateString);
    const difference = target - now;

    if (difference <= 0) {
      return { days: 0, hours: 0, minutes: 0, passed: true };
    }

    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((difference / 1000 / 60) % 60);

    return { days, hours, minutes, passed: false };
  };

  return (
    <div className="flex flex-col items-center max-w-6xl mx-auto space-y-12 pb-12">
      <h2 className="text-3xl font-bold text-primary">Event Countdowns</h2>

      <form onSubmit={addEvent} className="bg-white p-6 rounded-2xl shadow-lg border-2 border-gray-100 flex flex-col sm:flex-row gap-4 w-full max-w-2xl">
        <div className="flex-1 flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-600">Event Name</label>
          <input
            type="text"
            value={newEventName}
            onChange={(e) => setNewEventName(e.target.value)}
            placeholder="e.g., Summer Holidays"
            className="p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary outline-none"
            required
          />
        </div>
        <div className="flex-1 flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-600">Target Date & Time</label>
          <input
            type="datetime-local"
            value={newEventDate}
            onChange={(e) => setNewEventDate(e.target.value)}
            className="p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary outline-none"
            required
          />
        </div>
        <div className="flex items-end">
          <button
            type="submit"
            className="h-[50px] px-6 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors font-bold flex items-center gap-2"
          >
            <Plus size={20} /> Add
          </button>
        </div>
      </form>

      <div className="w-full">
        {events.length === 0 ? (
          <div className="text-center p-12 bg-white rounded-3xl border-2 border-dashed border-gray-200 text-gray-400">
            <p className="text-xl">No upcoming events!</p>
            <p>Add an event above to start counting down.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {events.map((event) => {
                const timeLeft = calculateTimeLeft(event.date);
                return (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className={`relative overflow-hidden bg-white rounded-3xl p-6 border-2 flex flex-col ${timeLeft.passed ? 'border-gray-200 shadow-sm' : 'border-primary/20 shadow-lg'}`}
                  >
                    <button
                      onClick={() => removeEvent(event.id)}
                      className="absolute top-4 right-4 text-gray-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-full transition-colors"
                      title="Remove event"
                    >
                      <Trash2 size={20} />
                    </button>

                    <h3 className="text-2xl font-bold text-text mb-6 pr-8 truncate" title={event.name}>
                      {event.name}
                    </h3>

                    {timeLeft.passed ? (
                      <div className="flex-1 flex flex-col items-center justify-center text-gray-400 font-bold text-xl py-8">
                        Event Passed
                      </div>
                    ) : (
                      <div className="flex-1 flex items-center justify-center gap-4">
                        <div className="flex flex-col items-center">
                          <span className="text-4xl font-black text-primary tabular-nums tracking-tighter bg-primary/10 px-4 py-2 rounded-2xl min-w-[80px] text-center">
                            {timeLeft.days}
                          </span>
                          <span className="text-sm font-bold text-gray-500 uppercase tracking-wider mt-2">Days</span>
                        </div>
                        <span className="text-3xl text-gray-300 font-light">:</span>
                        <div className="flex flex-col items-center">
                          <span className="text-4xl font-black text-primary tabular-nums tracking-tighter bg-primary/10 px-4 py-2 rounded-2xl min-w-[80px] text-center">
                            {timeLeft.hours}
                          </span>
                          <span className="text-sm font-bold text-gray-500 uppercase tracking-wider mt-2">Hours</span>
                        </div>
                      </div>
                    )}
                    <div className="mt-6 text-center text-sm text-gray-400 border-t border-gray-100 pt-4">
                      {new Date(event.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                      <br/>
                      {new Date(event.date).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};
