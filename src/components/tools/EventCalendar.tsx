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
import { useLocalStorage } from '../../hooks/useLocalStorage';
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
    <h3 className="text-xl font-bold text-slate-900 uppercase tracking-tight">
      <FormattedMessage id="eventcalendar.help.title" defaultMessage="How to Use the Event Calendar" />
    </h3>
    <div className="space-y-3">
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">1</div>
        <p className="text-sm text-slate-800 font-medium leading-tight">
          <FormattedMessage 
            id="eventcalendar.help.step1" 
            defaultMessage="Switch between <b>Calendar View</b> and <b>Countdowns</b> using the buttons."
            values={{ b: (chunks: React.ReactNode) => <b>{chunks}</b> }}
          />
        </p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-700 shrink-0">2</div>
        <p className="text-sm text-slate-800 font-medium leading-tight">
          <FormattedMessage 
            id="eventcalendar.help.step2" 
            defaultMessage="Click <b>Add Event</b> to set a name and date for something important coming up."
            values={{ b: (chunks: React.ReactNode) => <b>{chunks}</b> }}
          />
        </p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-success-bg flex items-center justify-center text-xs font-bold text-success shrink-0">3</div>
        <p className="text-sm text-slate-800 font-medium leading-tight">
          <FormattedMessage 
            id="eventcalendar.help.step3" 
            defaultMessage="In Countdown mode, watch the <b>timers</b> tick down to your events."
            values={{ b: (chunks: React.ReactNode) => <b>{chunks}</b> }}
          />
        </p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-caution-bg flex items-center justify-center text-xs font-bold text-caution shrink-0">4</div>
        <p className="text-sm text-slate-800 font-medium leading-tight">
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
  const [events, setEvents] = useLocalStorage<any[]>('event_calendar_events', []);
  
  // Countdown specific state
  const [newEventName, setNewEventName] = useState('');
  const [newEventDate, setNewEventDate] = useState('');
  const [now, setNow] = useState(new Date());

  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 1024 : false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Calendar specific state
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalEventTime, setModalEventTime] = useState('12:00');

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Persistence handled by useLocalStorage

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
  }, [events.length, settings.soundTheme, intl, setEvents]);

  useEffect(() => {
    setOnReset(() => clearAllEvents);
    setHelpContent(getHelpInfo());
    return () => clearHeader();
  }, [clearHeader, setOnReset, clearAllEvents, setHelpContent]);

  useEffect(() => {
    setHeaderActions(
      <div className="flex items-center gap-2 md:gap-4 italic">
        {isMobile ? (
          <select
            value={view}
            onChange={(e) => { setView(e.target.value as 'calendar' | 'countdowns'); audioEngine.playTick(settings.soundTheme); }}
            className="bg-surface border-2 border-primary/20 text-primary px-4 py-2 rounded-xl font-bold text-xs outline-none uppercase tracking-widest"
          >
            <option value="calendar">{intl.formatMessage({ id: 'eventcalendar.view.calendar', defaultMessage: 'Calendar' })}</option>
            <option value="countdowns">{intl.formatMessage({ id: 'eventcalendar.view.countdowns', defaultMessage: 'Countdowns' })}</option>
          </select>
        ) : (
          <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-100">
            <button
              onClick={() => { setView('calendar'); audioEngine.playTick(settings.soundTheme); }}
              className={`px-6 py-2 text-[10px] font-bold uppercase tracking-widest transition-all rounded-lg ${view === 'calendar' ? 'bg-primary text-white' : 'text-slate-600 hover:text-slate-900'}`}
            >
              <FormattedMessage id="eventcalendar.view.calendar" defaultMessage="Calendar" />
            </button>
            <button
              onClick={() => { setView('countdowns'); audioEngine.playTick(settings.soundTheme); }}
              className={`px-6 py-2 text-[10px] font-bold uppercase tracking-widest transition-all rounded-lg ${view === 'countdowns' ? 'bg-primary text-white' : 'text-slate-600 hover:text-slate-900'}`}
            >
              <FormattedMessage id="eventcalendar.view.countdowns" defaultMessage="Countdowns" />
            </button>
          </div>
        )}
      </div>
    );
  }, [view, isMobile, setHeaderActions, settings.soundTheme, intl]);

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
    <ToolPanel 
      className="italic" 
      baseWidth={isMobile ? 400 : 1400} 
      baseHeight={isMobile ? 800 : 900} 
      fluid={isMobile}
      alignTop={isMobile}
    >
      <div className="w-full h-full flex flex-col gap-2 md:gap-4 min-h-0 relative z-10 p-2 md:p-6">
        <div className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
           {view === 'countdowns' ? (
            <motion.div
              key="countdowns"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex-1 flex flex-col gap-4 md:gap-8 min-h-0 max-w-[1300px] w-full mx-auto"
            >
              {/* Countdowns Header */}
              <div className="bg-surface/80 backdrop-blur-xl p-4 md:p-6 rounded-[2rem] border-4 border-white flex flex-row items-center justify-between gap-4 shrink-0">
                 <div className="space-y-1">
                    <h2 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tighter leading-none uppercase text-left">
                      <FormattedMessage id="eventcalendar.title" defaultMessage="Calendar" />
                    </h2>
                 </div>
                 <div className="flex items-center gap-4">
                   {!isMobile && (
                     <div className="flex bg-slate-50 p-1.5 rounded-[1.5rem] border-4 border-white">
                       <button 
                         onClick={() => { setCountdownFormat('grid'); audioEngine.playTick(settings.soundTheme); }} 
                         className={`p-3 rounded-xl transition-all ${countdownFormat === 'grid' ? 'bg-primary text-white' : 'text-slate-600 hover:text-slate-900'}`}
                       >
                         <LayoutGrid size={20} />
                       </button>
                       <button 
                         onClick={() => { setCountdownFormat('list'); audioEngine.playTick(settings.soundTheme); }} 
                         className={`p-3 rounded-xl transition-all ${countdownFormat === 'list' ? 'bg-primary text-white' : 'text-slate-600 hover:text-slate-900'}`}
                       >
                         <List size={20} />
                       </button>
                     </div>
                   )}
                   <button 
                     onClick={() => { setShowCountdownAddModal(true); audioEngine.playTick(settings.soundTheme); }}
                     className={`bg-primary text-white rounded-[1.5rem] md:rounded-[2rem] font-bold uppercase tracking-widest hover:bg-primary/90 transition-all flex items-center justify-center gap-2 active:scale-95 border-4 border-indigo-400 ${
                       isMobile ? 'p-3 w-10 h-10' : 'px-10 py-5 text-sm gap-3'
                     }`}
                   >
                     <Plus className={isMobile ? 'w-5 h-5' : 'w-5 h-5'} strokeWidth={3} />
                     {!isMobile && <FormattedMessage id="eventcalendar.add_event" defaultMessage="Add Event" />}
                   </button>
                 </div>
              </div>

              {/* Countdowns Content */}
              <div className="flex-1 overflow-y-auto no-scrollbar pb-10">
                {events.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-10 py-32 bg-slate-50/50 backdrop-blur-md rounded-[4rem] border-4 border-dashed border-slate-200">
                    <div className="w-28 h-28 rounded-[2.5rem] bg-surface flex items-center justify-center border-4 border-slate-50 rotate-6">
                       <CalendarIcon size={56} strokeWidth={1} className="text-slate-300" />
                    </div>
                    <div className="text-center space-y-4">
                       <p className="text-xl font-bold uppercase tracking-[0.3em] text-slate-600 italic">
                         <FormattedMessage id="eventcalendar.no_events" defaultMessage="No events tracked" />
                       </p>
                       <p className="text-xs text-slate-700 uppercase font-bold tracking-widest">
                         <FormattedMessage id="eventcalendar.start_monitoring" defaultMessage="Add an event to start" />
                       </p>
                    </div>
                  </div>
                ) : (
                  <div className={countdownFormat === 'grid' ? "grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-8" : "flex flex-col gap-2 md:gap-6"}>
                    <AnimatePresence mode="popLayout">
                      {events.map((event) => {
                        const timeLeft = calculateTimeLeft(event.date);
                        const dateObj = new Date(event.date);
                        const dateString = dateObj.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase();

                        if (countdownFormat === 'grid') {
                          return (
                            <motion.div
                              key={event.id}
                              layout
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              className={`group relative bg-surface/80 backdrop-blur-xl border-4 border-white rounded-[1.5rem] md:rounded-[2.5rem] p-3 md:p-8 flex flex-col transition-all ${timeLeft.passed ? 'opacity-40 grayscale' : ''}`}
                            >
                              <button
                                 onClick={() => removeEvent(event.id)}
                                 className="absolute top-2 right-2 md:top-4 md:right-4 text-slate-500 hover:text-caution transition-all p-2 rounded-xl hover:bg-caution-bg border-2 border-transparent hover:border-caution-border z-20"
                               >
                                 <Trash2 size={20} />
                               </button>

                              <div className="mb-2 md:mb-4">
                                <h3 className="text-lg md:text-2xl font-bold text-slate-900 pr-10 leading-none uppercase tracking-tighter italic">
                                  {event.name}
                                </h3>
                              </div>

                              <div className="flex-1 grid grid-cols-4 gap-2 md:gap-4 mb-2 md:mb-6">
                                {[
                                  { v: timeLeft.days, id: 'eventcalendar.days', l: 'DAYS' },
                                  { v: timeLeft.hours, id: 'eventcalendar.hours', l: 'HRS' },
                                  { v: timeLeft.minutes, id: 'eventcalendar.minutes', l: 'MIN' },
                                  { v: timeLeft.seconds, id: 'eventcalendar.seconds', l: 'SEC' }
                                ].map((t, i) => (
                                  <div key={i} className="flex flex-col items-center justify-center py-2 md:py-3 bg-slate-50 rounded-xl md:rounded-[1.5rem] border-2 md:border-4 border-white">
                                    <span className="text-xl md:text-2xl font-bold text-primary tabular-nums leading-none tracking-tighter">
                                      {t.v}
                                    </span>
                                    <span className="text-[8px] md:text-[9px] font-bold text-slate-600 uppercase tracking-widest mt-1 md:mt-2">
                                      <FormattedMessage id={t.id} defaultMessage={t.l} />
                                    </span>
                                  </div>
                                ))}
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
                            className={`group relative bg-surface/80 backdrop-blur-xl border-4 border-white rounded-[1.5rem] md:rounded-[2.5rem] p-3 md:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 md:gap-0 transition-all ${timeLeft.passed ? 'opacity-40 grayscale' : ''}`}
                          >
                            <div className="flex flex-col gap-2 pl-2 md:pl-4">
                               <h3 className="text-xl md:text-2xl font-bold text-slate-900 leading-none uppercase tracking-tighter italic break-words">{event.name}</h3>
                               <span className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em]">{dateString}</span>
                            </div>

                            <div className="flex items-center gap-2 md:gap-3 w-full md:w-auto justify-between md:justify-end">
                               {[
                                 { v: timeLeft.days, l: 'D' },
                                 { v: timeLeft.hours, l: 'H' },
                                 { v: timeLeft.minutes, l: 'M' },
                                 { v: timeLeft.seconds, l: 'S' }
                               ].map((t, i) => (
                                 <div key={i} className="flex flex-col items-center justify-center flex-1 md:flex-none md:w-16 h-12 md:h-16 bg-slate-50 rounded-2xl border-2 border-white">
                                   <span className="text-2xl font-bold text-primary tabular-nums leading-none tracking-tighter">{t.v}</span>
                                   <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-1">{t.l}</span>
                                 </div>
                               ))}
                               <button
                                 onClick={() => removeEvent(event.id)}
                                 className="absolute top-2 right-2 md:top-4 md:right-4 text-slate-500 hover:text-caution transition-all p-2 rounded-xl hover:bg-caution-bg border-2 border-transparent hover:border-caution-border z-20"
                               >
                                 <Trash2 size={20} />
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
              className="flex-1 flex flex-col gap-2 min-h-0 max-w-[1300px] w-full mx-auto"
            >
              <div className="flex-1 bg-surface/80 backdrop-blur-xl rounded-[4rem] overflow-hidden flex flex-col border-4 border-white relative min-h-0">
                
                {/* Calendar Header */}
                <div className="bg-surface p-4 text-slate-900 relative overflow-hidden shrink-0 border-b-4 border-slate-100">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
                    <div className="flex items-center gap-8 text-left">
                      <div className="w-20 h-20 bg-primary rounded-[1.5rem] flex items-center justify-center text-white rotate-3 border-4 border-white/20">
                        <CalendarIcon size={40} strokeWidth={2.5} />
                      </div>
                      <div className="space-y-1 text-left">
                        <h2 className="text-3xl font-bold tracking-tighter leading-none uppercase italic">
                          {MONTH_NAMES[viewMonth]} <span className="text-primary ml-2">{viewYear}</span>
                        </h2>
                        <p className="text-slate-600 font-bold text-[10px] tracking-[0.4em] leading-none uppercase">
                          {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 bg-surface p-2 rounded-[2rem] border-2 border-slate-100">
                      <button onClick={prevMonth} className="p-3 hover:bg-slate-50 rounded-full transition-all active:scale-90 text-slate-600 hover:text-primary" title={intl.formatMessage({ id: 'eventcalendar.prev_month' })}><ChevronLeft size={24} /></button>
                      <button onClick={goToToday} className="px-10 py-3 bg-primary text-white rounded-full font-bold text-[10px] uppercase tracking-[0.3em] hover:bg-primary/90 transition-all active:scale-95 border-2 border-white/10">
                        <FormattedMessage id="eventcalendar.today" defaultMessage="Today" />
                      </button>
                      <button onClick={nextMonth} className="p-3 hover:bg-slate-50 rounded-full transition-all active:scale-90 text-slate-600 hover:text-primary" title={intl.formatMessage({ id: 'eventcalendar.next_month' })}><ChevronRight size={24} /></button>
                    </div>
                  </div>
                </div>

                {/* Day Grid */}
                <div className="p-4 flex-1 overflow-y-auto no-scrollbar relative z-10 italic">
                  <div className="grid grid-cols-7 gap-1 md:gap-2">
                    {DAY_NAMES.map(day => (
                      <div key={day} className="text-center py-2 md:py-4 text-[10px] font-bold text-slate-600 uppercase tracking-widest md:tracking-[0.5em]">{day}</div>
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
                                relative group min-h-[90px] p-1.5 md:p-2 rounded-xl flex flex-col items-center justify-start transition-all border-4
                                ${!isCurrentMonth ? 'opacity-20 border-transparent bg-transparent' : 'bg-slate-50 hover:bg-surface hover:border-primary/20'}
                                ${todayFlag 
                                  ? 'border-indigo-600 bg-surface z-10' 
                                  : (isCurrentMonth && !selectedFlag ? 'border-white' : '')}
                                ${selectedFlag && !todayFlag ? 'border-primary/30 bg-surface' : ''}
                              `}
                            >
                              <div className="w-full flex justify-between items-start mb-2">
                                <span className={`text-xl font-bold tabular-nums leading-none ${todayFlag ? 'text-primary' : 'text-slate-700'}`}>
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
                                    className="p-1.5 bg-primary text-white rounded-lg opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all hover:bg-primary/90 active:scale-90"
                                  >
                                    <Plus className="w-3.5 h-3.5" strokeWidth={3} />
                                  </button>
                                )}
                              </div>
                              
                              <div className="w-full flex flex-col gap-1.5 overflow-hidden">
                                {dayEvents.map((e: any, i: number) => (
                                  <div key={i} className="text-[8px] font-bold bg-primary/10 text-primary rounded-lg px-2 md:px-3 py-1.5 truncate w-full text-left border border-primary/20">
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
                <div className="px-4 md:px-6 py-4 border-t-4 border-slate-100 bg-surface flex items-center justify-end shrink-0 relative z-10">
                  <button 
                    onClick={() => { setShowAddModal(true); audioEngine.playTick(settings.soundTheme); }}
                    className="w-full md:w-auto px-6 py-3 md:px-10 md:py-4 bg-primary text-white rounded-[1.5rem] font-bold text-[10px] uppercase tracking-widest md:tracking-[0.3em] hover:bg-primary/90 transition-all flex items-center justify-center gap-2 md:gap-3 active:scale-95 border-4 border-white/10"
                  >
                    <Plus className="w-4 h-4 md:w-5 md:h-5" strokeWidth={3} /> <FormattedMessage id="eventcalendar.add_event" defaultMessage="Add Event" />
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
                 className="bg-surface p-4 md:p-6 rounded-3xl max-w-lg w-full max-h-[85vh] overflow-y-auto space-y-4 relative border-8 border-white italic no-scrollbar shadow-2xl"
               >
                  <div className="absolute top-0 right-0 w-48 h-48 md:w-64 md:h-64 bg-primary/5 rounded-full blur-[60px] md:blur-[80px] opacity-60 -z-10" />
                  
                  <button 
                     onClick={() => { setShowCountdownAddModal(false); setShowAddModal(false); audioEngine.playTick(settings.soundTheme); }} 
                     className="absolute top-6 right-6 md:top-12 md:right-12 p-2 md:p-3 text-slate-500 hover:text-slate-900 transition-all bg-slate-50 rounded-xl md:rounded-2xl"
                  >
                    <X size={24} className="md:w-8 md:h-8" />
                  </button>

                  <div className="space-y-3 text-left">
                    <h2 className="text-3xl md:text-5xl font-bold tracking-tighter uppercase text-slate-900 leading-none">
                      <FormattedMessage id="eventcalendar.new_event" defaultMessage="New Event" />
                    </h2>
                  </div>

                  <form onSubmit={showCountdownAddModal ? handleAddCountdown : handleCalendarAddEvent} className="space-y-3">
                     <div className="space-y-1 text-left">
                        <label className="text-[10px] font-bold text-slate-600 uppercase tracking-widest ml-2">
                           <FormattedMessage id="eventcalendar.identifier" defaultMessage="Name" />
                        </label>
                         <input 
                           type="text" 
                           placeholder={intl.formatMessage({ id: 'eventcalendar.identifier_placeholder', defaultMessage: 'e.g. Science Day' })}
                           value={newEventName}
                           onChange={(e) => setNewEventName(e.target.value)}
                           className="w-full bg-slate-50 border-2 border-white p-3 md:p-4 rounded-xl md:rounded-2xl text-lg md:text-xl font-bold text-slate-900 outline-none focus:bg-surface transition-all placeholder:text-slate-400"
                           required
                           autoFocus
                         />
                     </div>
                     
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {showCountdownAddModal ? (
                           <div className="col-span-2 space-y-3 text-left">
                              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-widest ml-4">
                                <FormattedMessage id="eventcalendar.date" defaultMessage="Date" />
                              </label>
                               <input 
                                 type="datetime-local" 
                                 value={newEventDate}
                                 onChange={(e) => setNewEventDate(e.target.value)}
                                 className="w-full bg-slate-50 border-2 border-white p-3 md:p-4 rounded-xl md:rounded-2xl text-base md:text-lg font-bold text-slate-900 outline-none focus:bg-surface transition-all"
                                 required
                               />
                           </div>
                        ) : (
                           <>
                               <div className="space-y-1 text-left">
                                  <label className="text-[10px] font-bold text-slate-600 uppercase tracking-widest ml-2">
                                    <FormattedMessage id="eventcalendar.date" defaultMessage="Date" />
                                  </label>
                                  <div className="w-full bg-primary p-3 md:p-4 rounded-xl md:rounded-2xl text-lg font-bold text-white border-2 border-indigo-400 text-center">
                                     {selectedDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                  </div>
                               </div>
                               <div className="space-y-1 text-left">
                                  <label className="text-[10px] font-bold text-slate-600 uppercase tracking-widest ml-2">
                                    <FormattedMessage id="eventcalendar.time" defaultMessage="Time" />
                                  </label>
                                  <input 
                                    type="time" 
                                    value={modalEventTime}
                                    onChange={(e) => setModalEventTime(e.target.value)}
                                    className="w-full bg-slate-50 border-2 border-white p-3 md:p-4 rounded-xl md:rounded-2xl text-base md:text-lg font-bold text-slate-900 outline-none focus:bg-surface transition-all"
                                    required
                                  />
                               </div>
                           </>
                        )}
                     </div>

                     <button
                       type="submit"
                       className="w-full py-4 bg-primary text-white rounded-2xl md:rounded-3xl font-bold uppercase tracking-[0.4em] text-xs md:text-sm hover:bg-primary/90 transition-all active:scale-95 border-2 border-white/10"
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
