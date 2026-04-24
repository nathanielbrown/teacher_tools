import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, ChevronRight, Calendar as CalendarIcon, 
  RotateCcw, CalendarDays, Plus, Trash2, X, Clock,
  LayoutGrid, List
} from 'lucide-react';
import { ToolHeader } from '../ToolHeader';

export const EventCalendar = () => {
  const [view, setView] = useState('countdowns'); // 'calendar' or 'countdowns'
  const [countdownFormat, setCountdownFormat] = useState('grid'); // 'grid' or 'list'
  const [showCountdownAddModal, setShowCountdownAddModal] = useState(false);
  
  // Events state
  const [events, setEvents] = useState(() => {
    const saved = localStorage.getItem('teacherToolsEventCountdowns');
    return saved ? JSON.parse(saved) : [];
  });
  
  // Countdown specific state
  const [newEventName, setNewEventName] = useState('');
  const [newEventDate, setNewEventDate] = useState('');
  const [now, setNow] = useState(new Date());

  // Calendar specific state
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalEventTime, setModalEventTime] = useState('12:00');

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  useEffect(() => {
    localStorage.setItem('teacherToolsEventCountdowns', JSON.stringify(events));
  }, [events]);

  useEffect(() => {
    if (view === 'countdowns') {
      const timer = setInterval(() => setNow(new Date()), 1000);
      return () => clearInterval(timer);
    }
  }, [view]);

  // --- Shared Event Actions ---
  const addEvent = (name, dateStr) => {
    if (!name.trim() || !dateStr) return;
    const newEvent = {
      id: Date.now().toString(),
      name: name.trim(),
      date: dateStr
    };
    setEvents([...events, newEvent]);
  };

  const removeEvent = (id) => {
    setEvents(events.filter(event => event.id !== id));
  };

  // --- Countdowns Handlers ---
  const handleAddCountdown = (e) => {
    e.preventDefault();
    addEvent(newEventName, newEventDate);
    setNewEventName('');
    setNewEventDate('');
    setShowCountdownAddModal(false);
  };

  const calculateTimeLeft = (targetDateString) => {
    const target = new Date(targetDateString);
    const difference = target - now;
    if (difference <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, passed: true };
    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((difference / 1000 / 60) % 60);
    const seconds = Math.floor((difference / 1000) % 60);
    return { days, hours, minutes, seconds, passed: false };
  };

  // --- Calendar Handlers ---
  const viewMonth = currentDate.getMonth();
  const viewYear = currentDate.getFullYear();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay();
  const firstDayIndex = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1; // Mon to Sun

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const prevMonth = () => setCurrentDate(new Date(viewYear, viewMonth - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(viewYear, viewMonth + 1, 1));
  const goToToday = () => {
    const t = new Date();
    setCurrentDate(t);
    setSelectedDate(t);
  };

  const calendarDays = [];
  const prevMonthLastDay = new Date(viewYear, viewMonth, 0).getDate();
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    calendarDays.push({ day: prevMonthLastDay - i, month: viewMonth - 1, year: viewYear, isCurrentMonth: false });
  }
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push({ day: i, month: viewMonth, year: viewYear, isCurrentMonth: true });
  }
  const remainingSlots = 42 - calendarDays.length;
  for (let i = 1; i <= remainingSlots; i++) {
    calendarDays.push({ day: i, month: viewMonth + 1, year: viewYear, isCurrentMonth: false });
  }

  const isToday = (d, m, y) => {
    const date = new Date(y, m, d);
    date.setHours(0, 0, 0, 0);
    return date.getTime() === today.getTime();
  };

  const isSelected = (d, m, y) => {
    const date = new Date(y, m, d);
    date.setHours(0, 0, 0, 0);
    const sel = new Date(selectedDate);
    sel.setHours(0, 0, 0, 0);
    return date.getTime() === sel.getTime();
  };

  const getEventsForDate = (d, m, y) => {
    const dateStr = new Date(y, m, d).toLocaleDateString();
    return events.filter(e => new Date(e.date).toLocaleDateString() === dateStr);
  };

  const handleCalendarAddEvent = (e) => {
    e.preventDefault();
    const formattedDate = new Date(selectedDate);
    const [hours, minutes] = modalEventTime.split(':');
    formattedDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
    // adjust for local timezone offset when generating datetime-local string
    const tzoffset = (new Date()).getTimezoneOffset() * 60000;
    const localISOTime = (new Date(formattedDate - tzoffset)).toISOString().slice(0, 16);
    addEvent(newEventName, localISOTime);
    setNewEventName('');
    setShowAddModal(false);
  };

  return (
    <div className="w-full mx-auto px-4 pt-2 pb-8 h-full flex flex-col gap-8">
      <ToolHeader
        title="Event Calendar"
        icon={CalendarDays}
        description="Track Milestones & Plan Activities"
        infoContent={
          <p>Toggle between the Calendar view for planning and the Countdowns view for tracking upcoming milestones in real-time.</p>
        }
      >
        <div className="bg-slate-100 p-1 rounded-xl flex gap-1">
          <button
            onClick={() => setView('countdowns')}
            className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${view === 'countdowns' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Countdowns
          </button>
          <button
            onClick={() => setView('calendar')}
            className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${view === 'calendar' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Calendar
          </button>
        </div>
      </ToolHeader>

      {view === 'countdowns' ? (
        <motion.div
          key="countdowns"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-6 w-full max-w-5xl mx-auto"
        >
          {/* Header Controls */}
          <div className="flex items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
            <h2 className="text-lg font-black text-slate-800 uppercase tracking-wider">Upcoming Events</h2>
            <div className="flex items-center gap-4">
              <div className="flex bg-slate-100 rounded-lg p-1">
                <button 
                  onClick={() => setCountdownFormat('grid')} 
                  className={`p-2 rounded-md transition-all ${countdownFormat === 'grid' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                  title="Grid View"
                >
                  <LayoutGrid size={18} />
                </button>
                <button 
                  onClick={() => setCountdownFormat('list')} 
                  className={`p-2 rounded-md transition-all ${countdownFormat === 'list' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                  title="List View"
                >
                  <List size={18} />
                </button>
              </div>
              <button 
                onClick={() => setShowCountdownAddModal(true)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-black text-xs uppercase tracking-widest shadow-md hover:bg-indigo-700 transition-all flex items-center gap-2"
              >
                <Plus size={14} /> Add Event
              </button>
            </div>
          </div>

          {/* Events Display */}
          <div className="flex flex-col w-full">
            {events.length === 0 ? (
              <div className="text-center p-12 bg-white rounded-3xl border-2 border-dashed border-gray-200 text-gray-400 w-full">
                <p className="text-xl font-bold uppercase tracking-widest opacity-50">No upcoming events</p>
                <p className="text-sm mt-2">Click "Add Event" above to start counting down</p>
              </div>
            ) : (
              <div className={countdownFormat === 'grid' ? "grid grid-cols-1 md:grid-cols-2 gap-6 w-full" : "flex flex-col gap-4 w-full"}>
                <AnimatePresence>
                  {events.map((event) => {
                    const timeLeft = calculateTimeLeft(event.date);
                    
                    if (countdownFormat === 'list') {
                      return (
                        <motion.div
                          key={event.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                          className={`relative overflow-hidden bg-white rounded-2xl p-4 md:p-6 border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all ${timeLeft.passed ? 'border-gray-100 opacity-60' : 'border-indigo-50 hover:shadow-md'}`}
                        >
                          <div className="flex-1 pr-8">
                            <h3 className="text-lg md:text-xl font-black text-slate-800 leading-tight" title={event.name}>
                              {event.name}
                            </h3>
                            <div className="mt-1 text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest">
                              {new Date(event.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })} @ {new Date(event.date).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>

                          <div className="flex items-center gap-4 md:gap-6 md:pr-10 w-full md:w-auto justify-center">
                            {timeLeft.passed ? (
                              <div className="text-slate-400 font-black text-xs uppercase tracking-widest bg-slate-50 px-4 py-2 rounded-lg">
                                Passed
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 md:gap-4">
                                {[
                                  { v: timeLeft.days, l: 'Days' },
                                  { v: timeLeft.hours, l: 'Hrs' },
                                  { v: timeLeft.minutes, l: 'Min' },
                                  { v: timeLeft.seconds, l: 'Sec' }
                                ].map((t, i) => (
                                  <div key={i} className="flex flex-col items-center">
                                    <span className="text-xl md:text-2xl font-black text-indigo-600 tabular-nums bg-indigo-50 px-3 py-1.5 rounded-xl min-w-[50px] md:min-w-[60px] text-center border border-indigo-100">
                                      {t.v}
                                    </span>
                                    <span className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">{t.l}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          
                          <button
                            onClick={() => removeEvent(event.id)}
                            className="absolute top-4 md:top-1/2 md:-translate-y-1/2 right-4 text-slate-300 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"
                            title="Remove event"
                          >
                            <Trash2 size={18} />
                          </button>
                        </motion.div>
                      );
                    }

                    // Grid Layout
                    return (
                      <motion.div
                        key={event.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className={`relative overflow-hidden bg-white rounded-[2rem] p-6 border flex flex-col transition-all ${timeLeft.passed ? 'border-gray-100 opacity-60' : 'border-indigo-50/50 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-slate-200 hover:-translate-y-1'}`}
                      >
                        <button
                          onClick={() => removeEvent(event.id)}
                          className="absolute top-6 right-6 text-slate-300 hover:text-red-500 hover:bg-red-50 p-2 rounded-full transition-colors"
                          title="Remove event"
                        >
                          <Trash2 size={20} />
                        </button>

                        <h3 className="text-2xl font-black text-slate-800 mb-6 pr-10 leading-tight" title={event.name}>
                          {event.name}
                        </h3>

                        {timeLeft.passed ? (
                          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 font-black text-xs uppercase tracking-[0.2em] py-8 bg-slate-50 rounded-2xl">
                            Event Passed
                          </div>
                        ) : (
                          <div className="flex-1 grid grid-cols-4 gap-2 sm:gap-3 py-2">
                            {[
                              { v: timeLeft.days, l: 'Days' },
                              { v: timeLeft.hours, l: 'Hours' },
                              { v: timeLeft.minutes, l: 'Mins' },
                              { v: timeLeft.seconds, l: 'Secs' }
                            ].map((t, i) => (
                              <div key={i} className="flex flex-col items-center">
                                <span className="text-2xl sm:text-3xl font-black text-indigo-600 tabular-nums tracking-tighter bg-indigo-50 px-2 py-3 sm:py-4 rounded-2xl w-full text-center border border-indigo-100 shadow-inner">
                                  {t.v}
                                </span>
                                <span className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">{t.l}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        <div className="mt-6 text-center border-t border-slate-50 pt-4">
                          <div className="inline-block bg-slate-50 px-4 py-2 rounded-full border border-slate-100">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                              {new Date(event.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })} @ {new Date(event.date).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </div>
        </motion.div>
      ) : (
        <motion.div
          key="calendar"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-3xl mx-auto flex-1 flex flex-col justify-center gap-4"
        >
          {/* Main Calendar View */}
          <div className="glass-card rounded-[2rem] overflow-hidden shadow-2xl border border-white/20 flex flex-col">
            {/* Calendar Header */}
            <div className="bg-gradient-to-r from-sky-400 to-blue-500 p-4 text-white">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-2.5 bg-white/20 rounded-2xl backdrop-blur-md">
                    <CalendarIcon size={28} />
                  </div>
                  <div>
                    <h2 className="text-3xl font-black tracking-tight">
                      {monthNames[viewMonth]} {viewYear}
                    </h2>
                    <p className="text-sky-100 font-medium text-xs">
                      {selectedDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 bg-white/10 p-1.5 rounded-2xl backdrop-blur-sm border border-white/10">
                  <button onClick={prevMonth} className="p-2.5 hover:bg-white/20 rounded-xl transition-all active:scale-90" title="Previous Month"><ChevronLeft size={20} /></button>
                  <button onClick={goToToday} className="px-5 py-2 bg-white text-blue-600 rounded-xl font-black text-xs uppercase tracking-wider hover:bg-sky-50 transition-all active:scale-95 shadow-lg shadow-blue-900/10">Today</button>
                  <button onClick={nextMonth} className="p-2.5 hover:bg-white/20 rounded-xl transition-all active:scale-90" title="Next Month"><ChevronRight size={20} /></button>
                </div>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="p-3 bg-white/50 backdrop-blur-sm flex-1">
              <div className="grid grid-cols-7 gap-1 md:gap-2">
                {dayNames.map(day => (
                  <div key={day} className="text-center py-1 text-[9px] font-black text-slate-400 uppercase tracking-widest">{day}</div>
                ))}
                
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`${viewMonth}-${viewYear}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="contents"
                  >
                    {calendarDays.map((dateObj, idx) => {
                      const { day, month, year, isCurrentMonth } = dateObj;
                      const todayFlag = isToday(day, month, year);
                      const selectedFlag = isSelected(day, month, year);
                      const dayEvents = getEventsForDate(day, month, year);

                      return (
                        <button
                          key={`${idx}-${day}-${month}`}
                          onClick={() => setSelectedDate(new Date(year, month, day))}
                          className={`
                            relative group h-14 md:h-20 p-1 rounded-lg md:rounded-xl flex flex-col items-center justify-start pt-1.5 transition-all duration-300
                            ${!isCurrentMonth ? 'opacity-40 bg-slate-50/50' : 'bg-white'}
                            ${selectedFlag 
                              ? 'ring-2 ring-blue-500 shadow-xl shadow-blue-500/20 scale-105 z-10' 
                              : 'hover:shadow-lg hover:shadow-slate-200/50 text-slate-600 border border-slate-100'}
                          `}
                        >
                          {todayFlag && !selectedFlag && (
                            <div className="absolute inset-0 border-2 border-blue-400 rounded-xl md:rounded-2xl animate-pulse" />
                          )}
                          
                          <span className={`text-sm md:text-lg font-black ${selectedFlag ? 'text-blue-600' : (todayFlag ? 'text-blue-500' : 'text-slate-700')}`}>
                            {day}
                          </span>
                          
                          {/* Event Indicators */}
                          <div className="mt-1 flex flex-col gap-0.5 w-full px-1 overflow-hidden">
                            {dayEvents.slice(0, 2).map((e, i) => (
                              <div key={i} className="text-[8px] md:text-[9px] font-bold bg-indigo-100 text-indigo-700 rounded px-1 truncate w-full text-left">
                                {e.name}
                              </div>
                            ))}
                            {dayEvents.length > 2 && (
                              <div className="text-[8px] font-black text-slate-400 text-center">+{dayEvents.length - 2} more</div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
               <div className="flex items-center gap-3 text-slate-400">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Today</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded bg-indigo-400" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Event</span>
                </div>
              </div>
              <button 
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-black text-xs uppercase tracking-widest shadow-md hover:bg-indigo-700 transition-all flex items-center gap-2"
              >
                <Plus size={14} /> Add Event
              </button>
            </div>
          </div>
          
          {/* Selected Date Events Panel */}
          {getEventsForDate(selectedDate.getDate(), selectedDate.getMonth(), selectedDate.getFullYear()).length > 0 && (
             <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
                <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-4">
                  Events on {selectedDate.toLocaleDateString()}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {getEventsForDate(selectedDate.getDate(), selectedDate.getMonth(), selectedDate.getFullYear()).map(event => (
                    <div key={event.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <div>
                        <h4 className="font-bold text-slate-800">{event.name}</h4>
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                          <Clock size={12} /> {new Date(event.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </p>
                      </div>
                      <button onClick={() => removeEvent(event.id)} className="p-2 text-rose-400 hover:bg-rose-50 rounded-lg transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
             </div>
          )}
        </motion.div>
      )}

      {/* Add Event Modal (Countdowns) */}
      <AnimatePresence>
        {showCountdownAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 bg-indigo-50 border-b border-indigo-100 flex items-center justify-between">
                <div className="flex items-center gap-3 text-indigo-600">
                  <Clock size={24} />
                  <h3 className="text-xl font-black">Add Countdown Event</h3>
                </div>
                <button onClick={() => setShowCountdownAddModal(false)} className="p-2 text-indigo-400 hover:bg-indigo-100 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleAddCountdown} className="p-6 space-y-6">
                <div className="space-y-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-black text-slate-400 uppercase ml-1">Event Name</label>
                    <input
                      type="text"
                      value={newEventName}
                      onChange={(e) => setNewEventName(e.target.value)}
                      placeholder="e.g., Summer Holidays"
                      className="p-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-indigo-500 focus:outline-none transition-all font-bold"
                      required
                      autoFocus
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-black text-slate-400 uppercase ml-1">Target Date & Time</label>
                    <input
                      type="datetime-local"
                      value={newEventDate}
                      onChange={(e) => setNewEventDate(e.target.value)}
                      className="p-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-indigo-500 focus:outline-none transition-all font-bold"
                      required
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCountdownAddModal(false)}
                    className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-colors shadow-md"
                  >
                    Add Event
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Event Modal (Calendar) */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 bg-indigo-50 border-b border-indigo-100 flex items-center justify-between">
                <div className="flex items-center gap-3 text-indigo-600">
                  <CalendarDays size={24} />
                  <h3 className="text-xl font-black">Add Event</h3>
                </div>
                <button onClick={() => setShowAddModal(false)} className="p-2 text-indigo-400 hover:bg-indigo-100 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleCalendarAddEvent} className="p-6 space-y-6">
                <div>
                  <p className="text-sm text-slate-500 font-medium mb-4">
                    Adding event for <strong className="text-slate-800">{selectedDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</strong>
                  </p>
                  <div className="space-y-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-black text-slate-400 uppercase ml-1">Event Name</label>
                      <input
                        type="text"
                        value={newEventName}
                        onChange={(e) => setNewEventName(e.target.value)}
                        placeholder="e.g., Parent Teacher Interviews"
                        className="p-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-indigo-500 focus:outline-none transition-all font-bold"
                        required
                        autoFocus
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-black text-slate-400 uppercase ml-1">Time</label>
                      <input
                        type="time"
                        value={modalEventTime}
                        onChange={(e) => setModalEventTime(e.target.value)}
                        className="p-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-indigo-500 focus:outline-none transition-all font-bold"
                        required
                      />
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-colors shadow-md"
                  >
                    Save Event
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
