import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Trash2,
  RotateCcw,
  Calendar,
  Trash,
} from 'lucide-react';
import { useHeader } from '../../contexts/HeaderContext';
import { useSettings } from '../../contexts/SettingsContext';
import { audioEngine } from '../../utils/audio';
import { defaultSchedules, DAYS, SCHOOL_EMOJIS } from './DailySchedule/scheduleData';
import { storage } from '../../utils/storage';
import { ToolPanel } from '../shared/ToolPanel';
import { useIntl, FormattedMessage } from 'react-intl';

// 1. Constants
// DAYS, SCHOOL_EMOJIS are imported from scheduleData

// 2. Config (None)

// 3. Text (Help and Info)
const getHelpInfo = () => (
  <div className="space-y-4 font-['Outfit']">
    <h3 className="text-xl font-black text-black uppercase tracking-tight italic">
      <FormattedMessage id="dailyschedule.help.title" defaultMessage="How to Use the Daily Schedule" />
    </h3>
    <div className="space-y-3 italic">
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-black/5 flex items-center justify-center text-xs font-black text-black shrink-0">1</div>
        <p className="text-sm text-black/60 font-medium leading-tight">
          <FormattedMessage 
            id="dailyschedule.help.step1" 
            defaultMessage="Switch between <b>Days of the week</b> at the top to manage different schedules."
            values={{ b: (chunks: React.ReactNode) => <b>{chunks}</b> }}
          />
        </p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-black/5 flex items-center justify-center text-xs font-black text-black shrink-0">2</div>
        <p className="text-sm text-black/60 font-medium leading-tight">
          <FormattedMessage 
            id="dailyschedule.help.step2" 
            defaultMessage="Click <b>Add Activity</b> to insert a new lesson. You can set the start and end times manually."
            values={{ b: (chunks: React.ReactNode) => <b>{chunks}</b> }}
          />
        </p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-black/5 flex items-center justify-center text-xs font-black text-black shrink-0">3</div>
        <p className="text-sm text-black/60 font-medium leading-tight">
          <FormattedMessage 
            id="dailyschedule.help.step3" 
            defaultMessage="Tap the <b>Emoji icon</b> to change the visual representation of the activity."
            values={{ b: (chunks: React.ReactNode) => <b>{chunks}</b> }}
          />
        </p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-black/5 flex items-center justify-center text-xs font-black text-black shrink-0">4</div>
        <p className="text-sm text-black/60 font-medium leading-tight">
          <FormattedMessage 
            id="dailyschedule.help.step4" 
            defaultMessage="The schedule <b>highlights</b> the current activity based on your local system clock."
            values={{ b: (chunks: React.ReactNode) => <b>{chunks}</b> }}
          />
        </p>
      </div>
    </div>
  </div>
);

// 4. Local Storage (Logic in component using storage util)

// 5. Classes (None)

// 6. Functions (None)

// 7. Component
export const DailySchedule = () => {
  const { setHeaderActions, setOnReset, clearHeader, setHelpContent } = useHeader();
  const { settings } = useSettings();
  const intl = useIntl();

  const [currentDay, setCurrentDay] = useState('Monday');
  const [allSchedules, setAllSchedules] = useState(() => {
    const saved = storage.getItem('daily_schedules_v2');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved schedules', e);
      }
    }
    return defaultSchedules;
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState('');

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      setCurrentTime(timeStr);
    };
    updateTime();
    const interval = setInterval(updateTime, 10000); 
    return () => clearInterval(interval);
  }, []);

  const calculateProgress = useCallback((startTime: string, endTime: string) => {
    if (!currentTime) return 0;
    if (currentTime >= endTime) return 100;
    if (currentTime < startTime) return 0;

    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    const [currH, currM] = currentTime.split(':').map(Number);

    const startTotal = startH * 60 + startM;
    const endTotal = endH * 60 + endM;
    const currTotal = currH * 60 + currM;

    const totalDuration = endTotal - startTotal;
    if (totalDuration <= 0) return 0;

    const elapsed = currTotal - startTotal;
    return Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
  }, [currentTime]);

  const getEventStatus = useCallback((item: any) => {
    if (!currentTime) return 'future';
    if (currentTime < item.startTime) return 'future';
    if (currentTime >= item.startTime && currentTime < item.endTime) return 'current';
    return 'past';
  }, [currentTime]);

  const currentSchedule = useMemo(() => allSchedules[currentDay] || [], [allSchedules, currentDay]);


  useEffect(() => {
    storage.setItem('daily_schedules_v2', JSON.stringify(allSchedules));
  }, [allSchedules]);

  const resetSchedule = useCallback(() => {
    setAllSchedules(prev => ({
      ...prev,
      [currentDay]: defaultSchedules[currentDay]
    }));
    audioEngine.playTick(settings.soundTheme);
  }, [currentDay, settings.soundTheme]);

  const clearDay = () => {
    setAllSchedules(prev => ({
      ...prev,
      [currentDay]: []
    }));
    audioEngine.playTick(settings.soundTheme);
  };

  const updateSchedule = (newSchedule: any[]) => {
    setAllSchedules(prev => ({
      ...prev,
      [currentDay]: newSchedule.sort((a, b) => a.startTime.localeCompare(b.startTime))
    }));
  };

  const addItem = (startTime = '09:00', endTime = '10:00') => {
    const newItem = {
      id: Date.now().toString(),
      startTime,
      endTime,
      activity: 'New Activity',
      emoji: '⭐'
    };
    updateSchedule([...currentSchedule, newItem]);
    audioEngine.playTick(settings.soundTheme);
  };

  const handleIconClick = (item: any) => {
    if (!selectedId) {
      setSelectedId(item.id);
    } else if (selectedId === item.id) {
      setSelectedId(null);
    } else {
      // Copy icon from clicked item to selected item
      updateItem(selectedId, { emoji: item.emoji });
      setSelectedId(null);
    }
    audioEngine.playTick(settings.soundTheme);
  };

  const handlePaletteClick = (emoji: string) => {
    if (selectedId) {
      updateItem(selectedId, { emoji });
      setSelectedId(null);
      audioEngine.playTick(settings.soundTheme);
    }
  };

  const removeItem = (id: string) => {
    updateSchedule(currentSchedule.filter(item => item.id !== id));
    audioEngine.playTick(settings.soundTheme);
  };

  const updateItem = (id: string, updates: any) => {
    updateSchedule(currentSchedule.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  const fillGap = (index: number) => {
    const prevItem = currentSchedule[index - 1];
    const nextItem = currentSchedule[index];
    if (!prevItem || !nextItem) return;

    const newItem = {
      id: Date.now().toString(),
      startTime: prevItem.endTime,
      endTime: nextItem.startTime,
      activity: 'New Activity',
      emoji: '➕'
    };
    updateSchedule([...currentSchedule, newItem]);
    audioEngine.playTick(settings.soundTheme);
  };

  useEffect(() => {
    setOnReset(() => resetSchedule);
    setHelpContent(getHelpInfo());

    if (currentTime && currentSchedule.length > 0) {
      const currentIdx = currentSchedule.findIndex(item => getEventStatus(item) === 'current');
      if (currentIdx !== -1) {
        setTimeout(() => {
          const element = document.getElementById(`schedule-item-${currentSchedule[currentIdx].id}`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 500);
      }
    }

    return () => clearHeader();
  }, [clearHeader, setOnReset, setHelpContent, resetSchedule, currentTime, currentSchedule, getEventStatus]);

  useEffect(() => {
    setHeaderActions(null);
  }, [setHeaderActions]);

  return (
    <ToolPanel className="font-['Outfit'] select-none italic" baseWidth={1200} baseHeight={900}>
      {/* Main Content Area */}
      <div className="w-full flex flex-col h-full relative z-10">

        {/* Simplified Title Section */}
        <div className="pt-4 pb-2 flex flex-col items-center shrink-0">
          <h2 className="text-5xl font-black text-black uppercase tracking-tighter italic leading-none">{currentDay}</h2>
        </div>

        <div className="px-6 py-3 flex flex-wrap items-center justify-center gap-6 shrink-0 relative z-20">
          <div className="flex bg-white/20 backdrop-blur-md p-1.5 rounded-[2rem] border-2 border-white/30 ">
            {DAYS.map(day => (
              <button
                key={day}
                onClick={() => {
                  setCurrentDay(day);
                  setSelectedId(null);
                  audioEngine.playTick(settings.soundTheme);
                }}
                className={`px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${currentDay === day
                    ? 'bg-white/40 text-black  scale-105'
                    : 'text-black/40 hover:text-black hover:bg-white/10'
                  }`}
              >
                {day.slice(0, 3)}
              </button>
            ))}
          </div>

          <div className="h-8 w-px bg-slate-200 hidden sm:block" />

          <div className="flex items-center gap-2">
            <button
              onClick={resetSchedule}
              className="flex items-center gap-2 px-6 py-2.5 bg-white/40 backdrop-blur-md text-black rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/60 border-2 border-white/30  transition-all active:scale-95"
              title={intl.formatMessage({ id: 'dailyschedule.controls.reset', defaultMessage: 'Reset' })}
            >
              <RotateCcw size={14} strokeWidth={3} /> <FormattedMessage id="dailyschedule.controls.reset" defaultMessage="Reset" />
            </button>
            <button
              onClick={clearDay}
              className="flex items-center gap-2 px-6 py-2.5 bg-white/40 backdrop-blur-md text-black rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/60 border-2 border-white/30  transition-all active:scale-95"
              title={intl.formatMessage({ id: 'dailyschedule.controls.clear', defaultMessage: 'Clear' })}
            >
              <Trash size={14} strokeWidth={3} /> <FormattedMessage id="dailyschedule.controls.clear" defaultMessage="Clear" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 lg:p-6 no-scrollbar" ref={scrollRef}>
          <div className="tool-grid-bg opacity-30 pointer-events-none" />
          <div className="flex flex-col items-center gap-2 max-w-5xl mx-auto relative z-10">

            <AnimatePresence mode="popLayout">
              <motion.div
                key={currentDay}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.02 }}
                className="w-full relative bg-white/30 backdrop-blur-lg border-4 border-white rounded-2xl "
              >
                {/* Table Header */}
                <div className="grid grid-cols-[300px_80px_1fr_64px] gap-4 px-6 py-2 bg-black/5 border-b border-black/5 shrink-0 rounded-t-xl">
                  <div className="text-[9px] font-black text-black uppercase tracking-[0.2em]">
                    <FormattedMessage id="dailyschedule.table.time" defaultMessage="Time Interval" />
                  </div>
                  <div className="text-[9px] font-black text-black uppercase tracking-[0.2em] text-center">
                    <FormattedMessage id="dailyschedule.table.icon" defaultMessage="Icon" />
                  </div>
                  <div className="text-[9px] font-black text-black uppercase tracking-[0.2em]">
                    <FormattedMessage id="dailyschedule.table.activity" defaultMessage="Activity Name" />
                  </div>
                  <div className="text-[9px] font-black text-black uppercase tracking-[0.2em] text-right"></div>
                </div>

                {/* Add Top Button Row */}
                <div className="p-2 flex justify-center bg-white/10 border-b border-white/10">
                  <button 
                    onClick={() => addItem('08:00', '09:00')}
                    className="flex items-center gap-2 px-4 py-1.5 bg-white/40 text-black hover:bg-white/60 border border-white/20 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all  italic"
                  >
                    <Plus size={14} /> <FormattedMessage id="dailyschedule.controls.add" defaultMessage="Add Activity" />
                  </button>
                </div>

                <div className="divide-y divide-slate-50">
                  {currentSchedule.map((item: any, index: number) => {
                    const status = getEventStatus(item);
                    return (
                      <React.Fragment key={item.id}>
                        {/* Schedule Item / Row */}
                        <motion.div
                          layout
                          id={`schedule-item-${item.id}`}
                          className={`group relative grid grid-cols-[300px_80px_1fr_64px] items-center gap-4 px-6 py-3 transition-all ${status === 'current'
                              ? 'bg-white/40 z-10'
                              : index % 2 !== 0 ? 'bg-black/[0.02]' : 'bg-transparent'
                            } hover:bg-white/10`}
                        >
                          {/* Progress Highlight */}
                          <motion.div
                            initial={false}
                            animate={{ width: `${calculateProgress(item.startTime, item.endTime)}%` }}
                            className="absolute left-0 top-0 bottom-0 bg-black/[0.04] pointer-events-none"
                            transition={{ type: "spring", bounce: 0, duration: 1 }}
                          />

                          {/* Status Side Indicator */}
                          {status === 'current' && (
                            <div className="absolute left-0 top-0 bottom-0 w-2 bg-black -[2px_0_10px_rgba(0,0,0,0.1)]" />
                          )}

                          {/* Time Controls */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            <input
                              type="time"
                              value={item.startTime}
                              onChange={(e) => updateItem(item.id, { startTime: e.target.value })}
                              className="text-sm font-bold text-black bg-white/20 px-2 py-1 rounded-lg outline-none w-[125px] border border-transparent focus:border-white/40 focus:bg-white/40 transition-all tabular-nums"
                            />
                            <span className="text-[8px] font-black text-black">TO</span>
                            <input
                              type="time"
                              value={item.endTime}
                              onChange={(e) => updateItem(item.id, { endTime: e.target.value })}
                              className="text-sm font-bold text-black bg-white/20 px-2 py-1 rounded-lg outline-none w-[125px] border border-transparent focus:border-white/40 focus:bg-white/40 transition-all tabular-nums"
                            />
                          </div>

                          {/* Emoji Selector */}
                          <div className="relative flex justify-center">
                            <button
                              onClick={() => handleIconClick(item)}
                              className={`w-9 h-9 rounded-lg flex items-center justify-center text-xl transition-all border ${selectedId === item.id
                                  ? 'bg-white/80 border-black ring-2 ring-black ring-offset-2 scale-110'
                                  : status === 'current'
                                    ? 'bg-white/60 border-black/20'
                                    : 'bg-white/20 border-white/20 hover:border-white/40'
                                }`}
                            >
                              {item.emoji}
                            </button>


                          </div>

                          {/* Activity Name */}
                          <div className="flex-1 min-w-0 flex items-center gap-3">
                            <input
                              type="text"
                              value={item.activity}
                              onChange={(e) => updateItem(item.id, { activity: e.target.value })}
                              placeholder={intl.formatMessage({ id: 'dailyschedule.table.placeholder', defaultMessage: 'Activity Name...' })}
                              className={`w-full text-sm font-black bg-transparent border-none outline-none focus:placeholder:opacity-0 truncate italic text-black`}
                            />
                             {status === 'current' && (
                              <div className="flex items-center gap-2 shrink-0 px-3 py-1 bg-black text-white rounded-full ">
                                <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                                <span className="text-[10px] font-black uppercase tracking-widest">
                                  <FormattedMessage id="dailyschedule.table.now" defaultMessage="NOW" />
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Remove Button */}
                          <div className="flex justify-end">
                            <button
                              onClick={() => removeItem(item.id)}
                              className="p-2 text-black/40 hover:text-black hover:bg-black/5 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </motion.div>

                        {/* Subtle Gap Filler / Add Between Row */}
                        {index < currentSchedule.length - 1 && currentSchedule[index].endTime < currentSchedule[index + 1].startTime && (
                          <div className="relative h-6 flex items-center justify-center group/gap">
                            <div className="absolute left-[200px] right-6 h-px bg-slate-50" />
                            <button
                              onClick={() => fillGap(index + 1)}
                              className="relative z-10 flex items-center gap-1.5 px-3 py-0.5 bg-white text-black hover:border-black/20 border border-slate-100 rounded-full text-[8px] font-black uppercase tracking-tighter transition-all opacity-0 group-hover/gap:opacity-100 italic"
                            >
                              <Plus size={8} /> <FormattedMessage id="dailyschedule.table.fill_gap" defaultMessage="Fill Gap" />
                            </button>
                          </div>
                        )}
                      </React.Fragment>
                    );
                  })}

                  {/* Add Bottom Button Row */}
                  <div className="p-2 flex justify-center bg-white/5 rounded-b-xl">
                    <button
                      onClick={() => {
                        if (currentSchedule.length > 0) {
                          const lastItem = currentSchedule[currentSchedule.length - 1];
                          addItem(lastItem.endTime, lastItem.endTime);
                        } else {
                          addItem();
                        }
                      }}
                      className="flex items-center gap-2 px-4 py-1.5 bg-white/40 text-black hover:bg-white/60 border border-white/20 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all  italic"
                    >
                      <Plus size={14} /> <FormattedMessage id="dailyschedule.controls.add" defaultMessage="Add Activity" />
                    </button>
                  </div>
                </div>

                {currentSchedule.length === 0 && (
                  <div className="py-20 flex flex-col items-center justify-center text-black/20 gap-4">
                    <Calendar size={64} strokeWidth={1} />
                    <p className="text-sm font-black uppercase tracking-[0.2em] italic text-black/40">
                      <FormattedMessage id="dailyschedule.table.empty" defaultMessage="Empty Schedule" />
                    </p>
                    <button
                      onClick={() => addItem()}
                      className="px-6 py-3 bg-black text-white rounded-2xl font-black hover:bg-black/80 transition-all  italic uppercase tracking-widest"
                    >
                      <FormattedMessage id="dailyschedule.table.add_first" defaultMessage="Add First Activity" />
                    </button>
                  </div>
                )}

                {/* Emoji Palette at the bottom */}
                <div className="p-4 bg-black/5 border-t border-black/5">
                  <div className="flex flex-wrap justify-center gap-2">
                    {SCHOOL_EMOJIS.map(emoji => (
                      <button
                        key={emoji}
                        onClick={() => handlePaletteClick(emoji)}
                        className={`w-10 h-10 flex items-center justify-center text-xl rounded-xl transition-all ${
                          selectedId 
                            ? 'bg-white/60 hover:bg-white hover:scale-110 border border-white/40 cursor-pointer' 
                            : 'bg-white/20 border border-transparent opacity-50 cursor-default'
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                  <div className="mt-2 text-center">
                    <p className="text-[10px] font-black uppercase tracking-widest text-black/40">
                      {selectedId 
                        ? <FormattedMessage id="dailyschedule.palette.instruction_active" defaultMessage="Click an emoji to apply" />
                        : <FormattedMessage id="dailyschedule.palette.instruction_idle" defaultMessage="Click an icon above to change it" />
                      }
                    </p>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Backdrop removed as picker is now inline */}
    </ToolPanel>
  );
};

export default DailySchedule;
