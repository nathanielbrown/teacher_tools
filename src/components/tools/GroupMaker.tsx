import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Users, 
  Shuffle, 
  RotateCcw, 
  ChevronDown,
  Sparkles,
  Users2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { useSettings } from '../../contexts/SettingsContext';
import { useHeader } from '../../contexts/HeaderContext';
import { audioEngine } from '../../utils/audio';
import { shuffle } from '../../utils/random';
import { ToolPanel } from '../shared/ToolPanel';
import { ClassPanel } from '../shared/ClassPanel';
import { FormattedMessage } from 'react-intl';

// 1. Constants
const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#ef4444', '#06b6d4', '#f97316'];

// 3. Text (Help and Info)
const getHelpInfo = () => (
  <div className="space-y-4 font-['Outfit']">
    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">
      <FormattedMessage id="groupmaker.help.title" defaultMessage="How to Use the Group Maker" />
    </h3>
    <div className="space-y-3">
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-primary/5 flex items-center justify-center text-xs font-black text-primary shrink-0">1</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">
          <FormattedMessage 
            id="groupmaker.help.step1" 
            defaultMessage="Select a <b>Class</b> from the menu to see your students."
            values={{ b: (chunks: React.ReactNode) => <b>{chunks}</b> }}
          />
        </p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center text-xs font-black text-blue-600 shrink-0">2</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">
          <FormattedMessage 
            id="groupmaker.help.step2" 
            defaultMessage="Choose <b>Total Groups</b> or <b>Size Limit</b> for your groups."
            values={{ b: (chunks: React.ReactNode) => <b>{chunks}</b> }}
          />
        </p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-success-bg flex items-center justify-center text-xs font-black text-success shrink-0">3</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">
          <FormattedMessage 
            id="groupmaker.help.step3" 
            defaultMessage="Change the <b>number</b> to decide how many groups or students."
            values={{ b: (chunks: React.ReactNode) => <b>{chunks}</b> }}
          />
        </p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-caution-bg flex items-center justify-center text-xs font-black text-caution shrink-0">4</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">
          <FormattedMessage 
            id="groupmaker.help.step4" 
            defaultMessage="Click <b>Make Groups</b> to shuffle students!"
            values={{ b: (chunks: React.ReactNode) => <b>{chunks}</b> }}
          />
        </p>
      </div>
    </div>
  </div>
);

export const GroupMaker = () => {
  const { settings } = useSettings();
  const { setOnReset, clearHeader, setHelpContent, setOnConfigToggle } = useHeader();
  const [selectedClassId, setSelectedClassId] = useLocalStorage('group_maker_class_id', 'blank');
  const [editedStudents, setEditedStudents] = useLocalStorage<string[]>('group_maker_students', []);
  const [mode, setMode] = useLocalStorage<'groups' | 'students'>('group_maker_mode', 'groups');
  const [count, setCount] = useLocalStorage('group_maker_count', 4);
  const [groups, setGroups] = useLocalStorage<string[][]>('group_maker_groups', []);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isClassPanelOpen, setIsClassPanelOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 1024 : false);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [groups]);

  const itemsPerPage = isMobile ? 2 : 4;
  const totalPages = Math.ceil(groups.length / itemsPerPage) || 1;
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * itemsPerPage;
  const paginatedGroups = groups.slice(startIndex, startIndex + itemsPerPage);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const prevClassIdRef = useRef(selectedClassId);

  useEffect(() => {
    // Only initialize/switch class if it's the first time or the class ID actually changed
    if (editedStudents.length === 0 || prevClassIdRef.current !== selectedClassId) {
      const cls = settings.classes.find(c => c.id === selectedClassId);
      if (cls) {
        setEditedStudents(cls.students);
        setGroups([]); // Reset groups when class changes
      } else if (selectedClassId === 'blank') {
        setEditedStudents([]);
        setGroups([]);
      }
      prevClassIdRef.current = selectedClassId;
    }
  }, [selectedClassId, settings.classes, editedStudents.length, setEditedStudents, setGroups]);

  const makeGroups = () => {
    if (!editedStudents.length) return;
    setIsGenerating(true);
    setGroups([]);
    audioEngine.playTick(settings.soundTheme);

    setTimeout(() => {
      const shuffled = shuffle([...editedStudents]);
      let newGroups: string[][] = [];
      
      if (mode === 'groups') {
        newGroups = Array.from({ length: count }, () => []);
        shuffled.forEach((student, index) => {
          newGroups[index % count].push(student);
        });
      } else {
        const numGroups = Math.ceil(editedStudents.length / count);
        newGroups = Array.from({ length: numGroups }, () => []);
        shuffled.forEach((student, index) => {
          newGroups[Math.floor(index / count)].push(student);
        });
      }

      setGroups(newGroups);
      setIsGenerating(false);
      audioEngine.playSuccess(settings.soundTheme);
    }, 800);
  };

  const resetGroups = useCallback(() => {
    setGroups([]);
    audioEngine.playTick(settings.soundTheme);
  }, [settings.soundTheme, setGroups]);

  useEffect(() => {
    setOnReset(() => resetGroups);
    setOnConfigToggle(() => () => setIsClassPanelOpen(prev => !prev));
    setHelpContent(getHelpInfo());
    return () => clearHeader();
  }, [clearHeader, setOnReset, setOnConfigToggle, resetGroups, setHelpContent]);


  const handleManageClasses = () => {
    window.history.pushState({}, '', '/config/classes');
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  return (
    <div 
      className="flex h-full w-full italic overflow-hidden transition-all duration-500 ease-in-out"
      style={{ gap: isClassPanelOpen ? '2rem' : '0' }}
    >
      <ClassPanel
        isOpen={isClassPanelOpen}
        onClose={() => setIsClassPanelOpen(false)}
        selectedClassId={selectedClassId}
        onClassChange={setSelectedClassId}
        students={editedStudents}
        onStudentsChange={setEditedStudents}
        onManageClasses={handleManageClasses}
      >
        {isMobile && (
          <div className="mt-4">
            <button 
              onClick={() => { makeGroups(); setIsClassPanelOpen(false); }}
              className="w-full py-6 bg-primary text-white rounded-[2rem] font-black uppercase tracking-[0.2em] text-lg flex items-center justify-center gap-3 active:scale-95 border-4 border-indigo-400"
            >
              <Shuffle size={24} strokeWidth={3} />
              <FormattedMessage id="groupmaker.generate" defaultMessage="Make Groups" />
            </button>
          </div>
        )}
      </ClassPanel>

      <ToolPanel 
        className="italic" 
        baseWidth={isMobile ? 400 : 1200} 
        fluid={true}
        alignTop
      >
        <div className="w-full flex flex-col gap-4 relative z-10 h-full overflow-hidden p-6">
          
          {/* Top Control Bar (Config) */}
          <div className="h-auto md:h-[120px] p-4 md:p-0 flex items-center justify-center bg-surface/60 backdrop-blur-md rounded-[2.5rem] md:rounded-[3rem] border-4 border-white shrink-0 w-full">
            <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8 w-full md:w-auto">
              <div className="flex flex-row items-center gap-3 md:gap-8 w-full md:w-auto justify-between md:justify-start">
                {/* Mode Toggle */}
                <div className="flex-1 md:flex-none bg-surface/60 p-2 rounded-[2rem] md:rounded-[2.5rem] flex items-center h-16 md:h-20 border-4 border-white shrink-0">
                  <button 
                    onClick={() => { setMode('groups'); audioEngine.playTick(settings.soundTheme); }}
                    className={`w-1/2 md:w-auto h-full px-2 md:px-8 rounded-xl md:rounded-2xl text-[10px] md:text-base font-black uppercase tracking-widest transition-all ${mode === 'groups' ? 'bg-primary text-white scale-105 z-10' : 'text-neutral-400 hover:text-slate-600'}`}
                  >
                    <FormattedMessage id="groupmaker.mode.groups" defaultMessage="Total Groups" />
                  </button>
                  <button 
                    onClick={() => { setMode('students'); audioEngine.playTick(settings.soundTheme); }}
                    className={`w-1/2 md:w-auto h-full px-2 md:px-10 rounded-xl md:rounded-2xl text-[10px] md:text-base font-black uppercase tracking-widest transition-all ${mode === 'students' ? 'bg-primary text-white scale-105 z-10' : 'text-neutral-400 hover:text-slate-600'}`}
                  >
                    <FormattedMessage id="groupmaker.mode.size" defaultMessage="Size Limit" />
                  </button>
                </div>

                {/* Count Input */}
                <div className="relative h-16 md:h-20 w-24 md:w-auto shrink-0">
                   <input 
                    type="number"
                    value={count}
                    min={1}
                    max={editedStudents.length || 100}
                    onChange={(e) => { setCount(parseInt(e.target.value) || 1); audioEngine.playTick(settings.soundTheme); }}
                    className="w-full md:w-28 h-full bg-surface/80 border-4 border-white focus:border-indigo-400 rounded-[1.5rem] md:rounded-2xl text-center font-black text-3xl md:text-4xl text-black outline-none transition-all italic"
                  />
                </div>
              </div>

              {/* Generate and Clear Buttons */}
              <div className="flex flex-col gap-2 shrink-0 w-full md:w-auto">
                <button
                  onClick={makeGroups}
                  disabled={isGenerating || !editedStudents.length}
                  className={`h-16 md:h-20 flex items-center justify-center gap-4 w-full md:w-auto px-6 md:px-10 rounded-[1.5rem] md:rounded-[2.5rem] font-black text-white transition-all active:scale-95 ${isGenerating ? 'bg-slate-300 cursor-not-allowed' : 'bg-primary hover:bg-primary/90'}`}
                >
                  {isGenerating ? <RotateCcw size={20} className="animate-spin md:w-7 md:h-7" /> : <Shuffle size={20} className="md:w-7 md:h-7" strokeWidth={3} />}
                  <span className="uppercase tracking-[0.2em] text-xs md:text-xl">
                    <FormattedMessage id="groupmaker.generate" defaultMessage="Make Groups" />
                  </span>
                </button>
                {groups.length > 0 && (
                  <button
                    onClick={resetGroups}
                    className="text-[10px] md:text-xs font-black text-neutral-400 hover:text-caution uppercase tracking-widest transition-colors flex items-center justify-center gap-1 mt-1 md:mt-0"
                  >
                    <RotateCcw size={12} />
                    <FormattedMessage id="groupmaker.clear" defaultMessage="Clear Groups" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Main Display Area (Expanded to floor) */}
          <div className="flex-1 overflow-y-auto no-scrollbar pt-2 md:pt-4">
            <AnimatePresence mode="wait">
              {groups.length > 0 ? (
                <motion.div 
                  key={`groups-grid-page-${safeCurrentPage}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3.5"
                >
                  {paginatedGroups.map((members, index) => {
                    const idx = startIndex + index;
                    return (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="bg-surface rounded-[1.5rem] md:rounded-[2rem] border-4 border-white overflow-hidden flex flex-col h-fit transition-all group/card"
                      >
                        <div className="px-3 md:px-5 py-2 md:py-3.5 flex flex-col md:flex-row items-center justify-between border-b-4 border-slate-50 bg-slate-50/50 shrink-0 gap-1 md:gap-0">
                          <h3 className="font-black text-primary text-xs md:text-base tracking-widest text-center md:text-left">
                            <FormattedMessage id="groupmaker.team" defaultMessage="Team {n}" values={{ n: idx + 1 }} />
                          </h3>
                          <div className="bg-surface px-2 md:px-3 py-1 md:py-1.5 rounded-full flex items-center justify-center">
                            <span className="text-[9px] md:text-sm font-black text-neutral-400 tabular-nums whitespace-nowrap">
                              <FormattedMessage id="groupmaker.students_count" defaultMessage="{count} Students" values={{ count: members.length }} />
                            </span>
                          </div>
                        </div>
                        
                        <div className="px-3 md:px-5 py-2 md:py-3 flex flex-col gap-1 md:gap-1.5 text-left">
                          {members.map((member, mIdx) => (
                            <motion.div 
                              key={mIdx}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.05 + mIdx * 0.02 }}
                              className="flex items-start md:items-center gap-1.5 md:gap-2 group/item mt-0.5 md:mt-0"
                            >
                              <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-slate-100 border border-slate-300 group-hover/item:bg-indigo-400 transition-colors shrink-0 mt-1 md:mt-0" />
                              <span className="text-sm md:text-lg font-black text-slate-900 group-hover/item:text-primary transition-colors break-words leading-tight">{member}</span>
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    );
                  })}
                </motion.div>
              ) : isGenerating ? (
                <div className="h-full flex flex-col items-center justify-center py-20 bg-slate-50/30 rounded-[4rem] border-4 border-dashed border-slate-100">
                  <div className="relative">
                    <div className="absolute inset-0 bg-primary blur-[60px] opacity-20 animate-pulse" />
                    <RotateCcw size={80} strokeWidth={1} className="text-primary animate-spin relative z-10" />
                  </div>
                  <p className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.5em] mt-8 animate-pulse italic">
                    <FormattedMessage id="groupmaker.status.making" defaultMessage="Making Groups..." />
                  </p>
                </div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="h-full flex flex-col items-center justify-center py-20 bg-surface/10 rounded-[5rem] border-8 border-dashed border-white/40"
                />
              )}
            </AnimatePresence>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-3 border-t-4 border-white shrink-0 select-none w-full bg-surface/40 backdrop-blur-md px-4 py-2 rounded-2xl">
              <button
                onClick={() => {
                  if (currentPage > 1) {
                    setCurrentPage(p => p - 1);
                    audioEngine.playTick(settings.soundTheme);
                  }
                }}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-white border-2 border-slate-900 rounded-xl font-black text-xs uppercase tracking-widest text-slate-800 disabled:opacity-30 disabled:border-slate-300 disabled:text-neutral-400 hover:bg-neutral-50 active:scale-95 transition-all"
              >
                <FormattedMessage id="starchart.pagination.prev" defaultMessage="◀ Prev" />
              </button>
              <span className="text-xs font-black uppercase tracking-wider text-neutral-600 font-bold">
                <FormattedMessage 
                  id="starchart.pagination.page" 
                  defaultMessage="Page {currentPage} of {totalPages}" 
                  values={{ currentPage: safeCurrentPage, totalPages }} 
                />
              </span>
              <button
                onClick={() => {
                  if (currentPage < totalPages) {
                    setCurrentPage(p => p + 1);
                    audioEngine.playTick(settings.soundTheme);
                  }
                }}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-white border-2 border-slate-900 rounded-xl font-black text-xs uppercase tracking-widest text-slate-800 disabled:opacity-30 disabled:border-slate-300 disabled:text-neutral-400 hover:bg-neutral-50 active:scale-95 transition-all"
              >
                <FormattedMessage id="starchart.pagination.next" defaultMessage="Next ▶" />
              </button>
            </div>
          )}
        </div>
      </ToolPanel>
    </div>
  );
};

export default GroupMaker;
