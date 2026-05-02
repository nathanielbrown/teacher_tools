import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Plus, 
  Trash2, 
  X, 
  LayoutGrid, 
  List, 
  Sparkles
} from 'lucide-react';
import { useHeader } from '../../contexts/HeaderContext';
import { useSettings } from '../../contexts/SettingsContext';
import { audioEngine } from '../../utils/audio';
import { storage } from '../../utils/storage';
import { ToolPanel } from '../shared/ToolPanel';
import { FormattedMessage, useIntl } from 'react-intl';

// 1. Constants
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];
const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// 3. Text (Help and Info)
const getHelpInfo = () => (
  <div className="space-y-4 font-['Outfit']">
    <h3 className="text-xl font-bold text-slate-800 uppercase tracking-tight">
      <FormattedMessage id="eventcalendar.help.title" defaultMessage="How to Use the Event Calendar" />
    </h3>
    <div className="space-y-3">
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center text-xs font-bold text-indigo-600 shrink-0">1</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">
          <FormattedMessage 
            id="eventcalendar.help.step1" 
            defaultMessage="Switch between <b>Calendar View</b> and <b>Countdowns</b> using the buttons."
            values={{ b: (chunks: React.ReactNode) => <b>{chunks}</b> }}
          />
        </p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center text-xs font-bold text-blue-600 shrink-0">2</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">
          <FormattedMessage 
            id="eventcalendar.help.step2" 
            defaultMessage="Click <b>Add Event</b> to set a name and date for something important coming up."
            values={{ b: (chunks: React.ReactNode) => <b>{chunks}</b> }}
          />
        </p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-emerald-50 flex items-center justify-center text-xs font-bold text-emerald-600 shrink-0">3</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">
          <FormattedMessage 
            id="eventcalendar.help.step3" 
            defaultMessage="In Countdown mode, watch the <b>timers</b> tick down to your events."
            values={{ b: (chunks: React.ReactNode) => <b>{chunks}</b> }}
          />
        </p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-rose-50 flex items-center justify-center text-xs font-bold text-rose-600 shrink-0">4</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">
          <FormattedMessage 
            id="eventcalendar.help.step4" 
            defaultMessage="Use the <b>Trash</b> icon to remove events, or the <b>Reset</b> button to clear everything."
            values={{ b: (chunks: React.ReactNode) => <b>{chunks}</b> }}
          />
        </p>
      </div>
    </div>
  </div>
);

export const EventCalendar = () => {
  const { setHeaderActions, setOnReset, clearHeader, setHelpContent } = useHeader();
  const { settings } = useSettings();
  const intl = useIntl();
  const [view, setView] = useState<'calendar' | 'countdowns'>('countdowns');
  const [countdownFormat, setCountdownFormat] = useState<'grid' | 'list'>('grid');
  const [showCountdownAddModal, setShowCountdownAddModal] = useState(false);
  
  // Events state
  const [events, setEvents] = useState<any[]>(() => {
    const saved = storage.getItem('teacherToolsEventCountdowns');
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
    storage.setItem('teacherToolsEventCountdowns', JSON.stringify(events));
  }, [events]);

  useEffect(() => {
    if (view === 'countdowns') {
      const timer = setInterval(() => setNow(new Date()), 1000);
      return () => clearInterval(timer);
    }
  }, [view]);

  const clearAllEvents = useCallback(() => {
    if (events.length === 0) return;
    if (window.confirm(intl.formatMessage({ id: 'eventcalendar.confirm_delete_all', defaultMessage: 'Are you sure you want to delete all events?' }))) {
      setEvents([]);
      audioEngine.playTick(settings.soundTheme);
    }
  }, [events.length, settings.soundTheme, intl]);

  useEffect(() => {
    setOnReset(() => clearAllEvents);
    setHelpContent(getHelpInfo());
    return () => clearHeader();
  }, [clearHeader, setOnReset, clearAllEvents, setHelpContent]);

  useEffect(() => {
    setHeaderActions(
      <div className="flex items-center gap-4 italic">
        <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-100">
          <button
            onClick={() => { setView('calendar'); audioEngine.playTick(settings.soundTheme); }}
            className={`px-6 py-2 text-[10px] font-bold uppercase tracking-widest transition-all rounded-lg ${view === 'calendar' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-700'}`}
          >
            <FormattedMessage id="eventcalendar.view.calendar" defaultMessage="Calendar" />
          </button>
          <button
            onClick={() => { setView('countdowns'); audioEngine.playTick(settings.soundTheme); }}
            className={`px-6 py-2 text-[10px] font-bold uppercase tracking-widest transition-all rounded-lg ${view === 'countdowns' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-700'}`}
          >
            <FormattedMessage id="eventcalendar.view.countdowns" defaultMessage="Countdowns" />
          </button>
        </div>
      </div>
    );
  }, [view, setHeaderActions, settings.soundTheme, clearAllEvents, intl]);

  // --- Shared Event Actions ---
  const addEvent = (name: string, dateStr: string) => {
    if (!name.trim() || !dateStr) return;
    const newEvent = {
      id: Date.now().toString(),
      name: name.trim(),
      date: dateStr
    };
    setEvents([...events, newEvent]);
    audioEngine.playSuccess(settings.soundTheme);
  };

  const removeEvent = (id: string) => {
    setEvents(events.filter(event => event.id !== id));
    audioEngine.playTick(settings.soundTheme);
  };

  // --- Countdowns Handlers ---
  const handleAddCountdown = (e: React.FormEvent) => {
    e.preventDefault();
    addEvent(newEventName, newEventDate);
    setNewEventName('');
    setNewEventDate('');
    setShowCountdownAddModal(false);
  };

  const calculateTimeLeft = (targetDateString: string) => {
    const target = new Date(targetDateString);
    const difference = target.getTime() - now.getTime();
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

  const prevMonth = () => { setCurrentDate(new Date(viewYear, viewMonth - 1, 1)); audioEngine.playTick(settings.soundTheme); };
  const nextMonth = () => { setCurrentDate(new Date(viewYear, viewMonth + 1, 1)); audioEngine.playTick(settings.soundTheme); };
  const goToToday = () => {
    const t = new Date();
    setCurrentDate(t);
    setSelectedDate(t);
    audioEngine.playTick(settings.soundTheme);
  };

  const calendarDays: any[] = [];
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

  const isToday = (d: number, month: number, y: number) => {
    const date = new Date(y, month, d);
    date.setHours(0, 0, 0, 0);
    return date.getTime() === today.getTime();
  };

  const isSelected = (d: number, month: number, y: number) => {
    const date = new Date(y, month, d);
    date.setHours(0, 0, 0, 0);
    const sel = new Date(selectedDate);
    sel.setHours(0, 0, 0, 0);
    return date.getTime() === sel.getTime();
  };

  const getEventsForDate = (d: number, month: number, y: number) => {
    const dateStr = new Date(y, month, d).toLocaleDateString();
    return events.filter(e => new Date(e.date).toLocaleDateString() === dateStr);
  };

  const handleCalendarAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    const formattedDate = new Date(selectedDate);
    const [hours, minutes] = modalEventTime.split(':');
    formattedDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
    const tzoffset = (new Date()).getTimezoneOffset() * 60000;
    const localISOTime = (new Date(formattedDate.getTime() - tzoffset)).toISOString().slice(0, 16);
    addEvent(newEventName, localISOTime);
    setNewEventName('');
    setShowAddModal(false);
  };

  return (
    <ToolPanel className="italic" baseWidth={1200} baseHeight={1000}>
      <div className="w-full h-full flex flex-col gap-4 min-h-0 relative z-10 p-6">
        <div className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
           {view === 'countdowns' ? (
            <motion.div
              key="countdowns"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex-1 flex flex-col gap-8 min-h-0"
            >
              {/* Countdowns Header */}
              <div className="bg-white/80 backdrop-blur-xl p-4 rounded-[2rem] border-4 border-white flex items-center justify-between shrink-0">
                <div className="space-y-1">
                   <h2 className="text-2xl font-bold text-slate-900 tracking-tighter leading-none uppercase text-left">
                     <FormattedMessage id="eventcalendar.title" defaultMessage="Calendar" />
                   </h2>
                   <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-[0.4em] leading-none text-left">
                     <FormattedMessage id="eventcalendar.subtitle" defaultMessage="Track your events" />
                   </p>
                </div>
                <div className="flex items-center gap-6">
                  <div className="flex bg-slate-50 p-1.5 rounded-[1.5rem] border-4 border-white">
                    <button 
                      onClick={() => { setCountdownFormat('grid'); audioEngine.playTick(settings.soundTheme); }} 
                      className={`p-3 rounded-xl transition-all ${countdownFormat === 'grid' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      <LayoutGrid size={20} />
                    </button>
                    <button 
                      onClick={() => { setCountdownFormat('list'); audioEngine.playTick(settings.soundTheme); }} 
                      className={`p-3 rounded-xl transition-all ${countdownFormat === 'list' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      <List size={20} />
                    </button>
                  </div>
                  <button 
                    onClick={() => { setShowCountdownAddModal(true); audioEngine.playTick(settings.soundTheme); }}
                    className="px-10 py-5 bg-indigo-600 text-white rounded-[2rem] font-bold text-sm uppercase tracking-widest hover:bg-indigo-700 transition-all flex items-center gap-3 active:scale-95 border-4 border-indigo-400"
                  >
                    <Plus size={20} strokeWidth={3} /> <FormattedMessage id="eventcalendar.add_event" defaultMessage="Add Event" />
                  </button>
                </div>
              </div>

              {/* Countdowns Content */}
              <div className="flex-1 overflow-y-auto no-scrollbar pb-10">
                {events.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-10 py-32 bg-slate-50/50 backdrop-blur-md rounded-[4rem] border-4 border-dashed border-slate-200">
                    <div className="w-28 h-28 rounded-[2.5rem] bg-white flex items-center justify-center border-4 border-slate-50 rotate-6">
                       <CalendarIcon size={56} strokeWidth={1} className="text-slate-200" />
                    </div>
                    <div className="text-center space-y-4">
                       <p className="text-xl font-bold uppercase tracking-[0.3em] text-slate-300 italic">
                         <FormattedMessage id="eventcalendar.no_events" defaultMessage="No events tracked" />
                       </p>
                       <p className="text-xs text-slate-400 uppercase font-bold tracking-widest">
                         <FormattedMessage id="eventcalendar.start_monitoring" defaultMessage="Add an event to start" />
                       </p>
                    </div>
                  </div>
                ) : (
                  <div className={countdownFormat === 'grid' ? "grid grid-cols-1 md:grid-cols-2 gap-8" : "flex flex-col gap-6"}>
                    <AnimatePresence mode="popLayout">
                      {events.map((event) => {
                        const timeLeft = calculateTimeLeft(event.date);
                        const dateObj = new Date(event.date);
                        const dateString = dateObj.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase();
                        const timeString = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

                        if (countdownFormat === 'grid') {
                          return (
                            <motion.div
                              key={event.id}
                              layout
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              className={`group relative bg-white/80 backdrop-blur-xl border-4 border-white rounded-[2.5rem] p-6 flex flex-col transition-all ${timeLeft.passed ? 'opacity-40 grayscale' : ''}`}
                            >
                              <button
                                onClick={() => removeEvent(event.id)}
                                className="absolute top-10 right-10 text-slate-300 hover:text-rose-500 transition-all p-3 rounded-2xl hover:bg-rose-50 border-2 border-transparent hover:border-rose-100"
                              >
                                <Trash2 size={24} />
                              </button>

                              <div className="mb-10 space-y-2">
                                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.5em]">
                                  <FormattedMessage id="eventcalendar.target_event" defaultMessage="Event" />
                                </span>
                                <h3 className="text-2xl font-bold text-slate-900 pr-12 leading-none uppercase tracking-tighter italic">
                                  {event.name}
                                </h3>
                              </div>

                              <div className="flex-1 grid grid-cols-4 gap-4 mb-10">
                                {[
                                  { v: timeLeft.days, id: 'eventcalendar.days', l: 'DAYS' },
                                  { v: timeLeft.hours, id: 'eventcalendar.hours', l: 'HRS' },
                                  { v: timeLeft.minutes, id: 'eventcalendar.minutes', l: 'MIN' },
                                  { v: timeLeft.seconds, id: 'eventcalendar.seconds', l: 'SEC' }
                                ].map((t, i) => (
                                  <div key={i} className="flex flex-col items-center justify-center py-4 bg-slate-50 rounded-[1.5rem] border-4 border-white">
                                    <span className="text-2xl font-bold text-indigo-600 tabular-nums leading-none tracking-tighter">
                                      {t.v}
                                    </span>
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-3">
                                      <FormattedMessage id={t.id} defaultMessage={t.l} />
                                    </span>
                                  </div>
                                ))}
                              </div>
                              
                              <div className="flex justify-center">
                                <div className="bg-indigo-600 px-8 py-3 rounded-full border-4 border-white rotate-1 group-hover:rotate-0 transition-transform">
                                  <span className="text-[11px] font-bold text-white uppercase tracking-[0.2em] tabular-nums">
                                    {dateString} <span className="text-indigo-200 ml-2">@ {timeString}</span>
                                  </span>
                                </div>
                              </div>
                            </motion.div>
                          );
                        }

                        return (
                          <motion.div
                            key={event.id}
                            layout
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className={`group relative bg-white/80 backdrop-blur-xl border-4 border-white rounded-[2.5rem] p-6 flex items-center justify-between transition-all ${timeLeft.passed ? 'opacity-40 grayscale' : ''}`}
                          >
                            <div className="flex flex-col gap-2 pl-4">
                               <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest leading-none">ID: {event.id.slice(-4)}</span>
                               <h3 className="text-2xl font-bold text-slate-900 leading-none uppercase tracking-tighter italic">{event.name}</h3>
                               <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">{dateString} @ {timeString}</span>
                            </div>

                            <div className="flex items-center gap-3">
                               {[
                                 { v: timeLeft.days, l: 'D' },
                                 { v: timeLeft.hours, l: 'H' },
                                 { v: timeLeft.minutes, l: 'M' },
                                 { v: timeLeft.seconds, l: 'S' }
                               ].map((t, i) => (
                                 <div key={i} className="flex flex-col items-center justify-center w-16 h-16 bg-slate-50 rounded-2xl border-2 border-white">
                                   <span className="text-2xl font-bold text-indigo-600 tabular-nums leading-none tracking-tighter">{t.v}</span>
                                   <span className="text-[8px] font-bold text-slate-300 uppercase tracking-widest mt-1">{t.l}</span>
                                 </div>
                               ))}
                               <button
                                 onClick={() => removeEvent(event.id)}
                                 className="ml-6 mr-4 text-slate-300 hover:text-rose-500 transition-all p-3 rounded-2xl hover:bg-rose-50 border-2 border-transparent hover:border-rose-100"
                               >
                                 <Trash2 size={24} />
                               </button>
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
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex-1 flex flex-col gap-2 min-h-0"
            >
              <div className="flex-1 bg-white/80 backdrop-blur-xl rounded-[4rem] overflow-hidden flex flex-col border-4 border-white relative min-h-0">
                
                {/* Calendar Header */}
                <div className="bg-slate-50 p-4 text-slate-900 relative overflow-hidden shrink-0 border-b-4 border-slate-100">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
                    <div className="flex items-center gap-8 text-left">
                      <div className="w-20 h-20 bg-indigo-600 rounded-[1.5rem] flex items-center justify-center text-white rotate-3 border-4 border-white/20">
                        <CalendarIcon size={40} strokeWidth={2.5} />
                      </div>
                      <div className="space-y-1 text-left">
                        <h2 className="text-3xl font-bold tracking-tighter leading-none uppercase italic">
                          {MONTH_NAMES[viewMonth]} <span className="text-indigo-400 ml-2">{viewYear}</span>
                        </h2>
                        <p className="text-slate-400 font-bold text-[10px] tracking-[0.4em] leading-none uppercase">
                          {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 bg-white p-2 rounded-[2rem] border-2 border-slate-100">
                      <button onClick={prevMonth} className="p-3 hover:bg-slate-50 rounded-full transition-all active:scale-90 text-slate-400 hover:text-indigo-600" title={intl.formatMessage({ id: 'eventcalendar.prev_month' })}><ChevronLeft size={24} /></button>
                      <button onClick={goToToday} className="px-10 py-3 bg-indigo-600 text-white rounded-full font-bold text-[10px] uppercase tracking-[0.3em] hover:bg-indigo-700 transition-all active:scale-95 border-2 border-white/10">
                        <FormattedMessage id="eventcalendar.today" defaultMessage="Today" />
                      </button>
                      <button onClick={nextMonth} className="p-3 hover:bg-slate-50 rounded-full transition-all active:scale-90 text-slate-400 hover:text-indigo-600" title={intl.formatMessage({ id: 'eventcalendar.next_month' })}><ChevronRight size={24} /></button>
                    </div>
                  </div>
                </div>

                {/* Day Grid */}
                <div className="p-4 flex-1 overflow-y-auto no-scrollbar relative z-10 italic">
                  <div className="grid grid-cols-7 gap-1">
                    {DAY_NAMES.map(day => (
                      <div key={day} className="text-center py-4 text-[10px] font-bold text-slate-300 uppercase tracking-[0.5em]">{day}</div>
                    ))}
                    
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={`${viewMonth}-${viewYear}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="contents"
                      >
                        {calendarDays.map((dateObj, idx) => {
                          const { day, month, year, isCurrentMonth } = dateObj;
                          const todayFlag = isToday(day, month, year);
                          const selectedFlag = isSelected(day, month, year);
                          const dayEvents = getEventsForDate(day, month, year);

                          return (
                            <div
                              key={`${idx}-${day}-${month}`}
                              className={`
                                relative group min-h-[90px] p-2 rounded-xl flex flex-col items-center justify-start transition-all border-4
                                ${!isCurrentMonth ? 'opacity-20 border-transparent bg-transparent' : 'bg-slate-50 hover:bg-white hover:border-indigo-100'}
                                ${todayFlag 
                                  ? 'border-indigo-600 bg-white z-10' 
                                  : (isCurrentMonth && !selectedFlag ? 'border-white' : '')}
                                ${selectedFlag && !todayFlag ? 'border-indigo-200 bg-white' : ''}
                              `}
                            >
                              <div className="w-full flex justify-between items-start mb-2">
                                <span className={`text-xl font-bold tabular-nums leading-none ${todayFlag ? 'text-indigo-600' : 'text-slate-400'}`}>
                                  {day}
                                </span>
                                {isCurrentMonth && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedDate(new Date(year, month, day));
                                      setShowAddModal(true);
                                      audioEngine.playTick(settings.soundTheme);
                                    }}
                                    className="p-1.5 bg-indigo-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-indigo-700 active:scale-90"
                                  >
                                    <Plus size={14} strokeWidth={3} />
                                  </button>
                                )}
                              </div>
                              
                              <div className="w-full flex flex-col gap-1.5 overflow-hidden">
                                {dayEvents.map((e: any, i: number) => (
                                  <div key={i} className="text-[8px] font-bold bg-indigo-600/10 text-indigo-700 rounded-lg px-3 py-1.5 truncate w-full text-left border border-indigo-100">
                                    {e.name}
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="px-6 py-4 border-t-4 border-slate-50 bg-white flex items-center justify-end shrink-0 relative z-10">
                  <button 
                    onClick={() => { setShowAddModal(true); audioEngine.playTick(settings.soundTheme); }}
                    className="px-10 py-4 bg-indigo-600 text-white rounded-[1.5rem] font-bold text-[10px] uppercase tracking-[0.3em] hover:bg-indigo-700 transition-all flex items-center gap-3 active:scale-95 border-4 border-white/10"
                  >
                    <Plus size={20} strokeWidth={3} /> <FormattedMessage id="eventcalendar.add_event" defaultMessage="Add Event" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Registry Modals */}
        <AnimatePresence>
          {(showCountdownAddModal || showAddModal) && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-800/80 backdrop-blur-xl">
               <motion.div 
                 initial={{ scale: 0.9, opacity: 0, y: 20 }} 
                 animate={{ scale: 1, opacity: 1, y: 0 }} 
                 exit={{ scale: 0.9, opacity: 0, y: 20 }} 
                 className="bg-white p-12 md:p-16 rounded-[4rem] max-w-2xl w-full space-y-12 relative overflow-hidden border-8 border-white italic"
               >
                  <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full blur-[80px] opacity-60 -z-10" />
                  
                  <button 
                     onClick={() => { setShowCountdownAddModal(false); setShowAddModal(false); audioEngine.playTick(settings.soundTheme); }} 
                     className="absolute top-12 right-12 p-3 text-slate-300 hover:text-slate-900 transition-all bg-slate-50 rounded-2xl"
                  >
                    <X size={32} />
                  </button>

                  <div className="space-y-3 text-left">
                    <div className="w-16 h-16 bg-indigo-600 rounded-3xl flex items-center justify-center text-white mb-6">
                       <Sparkles size={32} />
                    </div>
                    <h2 className="text-5xl font-bold tracking-tighter uppercase text-slate-900 leading-none">
                      <FormattedMessage id="eventcalendar.new_event" defaultMessage="New Event" />
                    </h2>
                  </div>

                  <form onSubmit={showCountdownAddModal ? handleAddCountdown : handleCalendarAddEvent} className="space-y-10">
                     <div className="space-y-3 text-left">
                        <label className="text-[11px] font-bold text-slate-300 uppercase tracking-widest ml-4">
                          <FormattedMessage id="eventcalendar.identifier" defaultMessage="Name" />
                        </label>
                        <input 
                          type="text" 
                          placeholder={intl.formatMessage({ id: 'eventcalendar.identifier_placeholder', defaultMessage: 'e.g. Science Day' })}
                          value={newEventName}
                          onChange={(e) => setNewEventName(e.target.value)}
                          className="w-full bg-slate-50 border-4 border-white p-8 rounded-[2.5rem] text-2xl font-bold text-slate-900 outline-none focus:bg-white transition-all placeholder:text-slate-200"
                          required
                          autoFocus
                        />
                     </div>
                     
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {showCountdownAddModal ? (
                           <div className="col-span-2 space-y-3 text-left">
                              <label className="text-[11px] font-bold text-slate-300 uppercase tracking-widest ml-4">
                                <FormattedMessage id="eventcalendar.date" defaultMessage="Date" />
                              </label>
                              <input 
                                type="datetime-local" 
                                value={newEventDate}
                                onChange={(e) => setNewEventDate(e.target.value)}
                                className="w-full bg-slate-50 border-4 border-white p-8 rounded-[2.5rem] text-xl font-bold text-slate-900 outline-none focus:bg-white transition-all"
                                required
                              />
                           </div>
                        ) : (
                           <>
                              <div className="space-y-3 text-left">
                                 <label className="text-[11px] font-bold text-slate-300 uppercase tracking-widest ml-4">
                                   <FormattedMessage id="eventcalendar.date" defaultMessage="Date" />
                                 </label>
                                 <div className="w-full bg-indigo-600 p-8 rounded-[2.5rem] text-xl font-bold text-white border-4 border-indigo-400 text-center">
                                    {selectedDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                 </div>
                              </div>
                              <div className="space-y-3 text-left">
                                 <label className="text-[11px] font-bold text-slate-300 uppercase tracking-widest ml-4">
                                   <FormattedMessage id="eventcalendar.time" defaultMessage="Time" />
                                 </label>
                                 <input 
                                   type="time" 
                                   value={modalEventTime}
                                   onChange={(e) => setModalEventTime(e.target.value)}
                                   className="w-full bg-slate-50 border-4 border-white p-8 rounded-[2.5rem] text-xl font-bold text-slate-900 outline-none focus:bg-white transition-all"
                                   required
                                 />
                              </div>
                           </>
                        )}
                     </div>

                     <button
                       type="submit"
                       className="w-full py-8 bg-indigo-600 text-white rounded-[3rem] font-bold uppercase tracking-[0.4em] text-sm hover:bg-indigo-700 transition-all active:scale-95 border-4 border-white/10"
                     >
                       <FormattedMessage id="eventcalendar.deploy" defaultMessage="Add Event" />
                     </button>
                  </form>
               </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </ToolPanel>
  );
};

export default EventCalendar;
