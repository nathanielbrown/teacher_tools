import React, { useState, useEffect, useCallback } from 'react';
import { 
  Users, 
  Shuffle, 
  RotateCcw, 
  ChevronDown,
  Sparkles,
  Users2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
        <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center text-xs font-black text-indigo-600 shrink-0">1</div>
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
        <div className="w-6 h-6 rounded-lg bg-emerald-50 flex items-center justify-center text-xs font-black text-emerald-600 shrink-0">3</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">
          <FormattedMessage 
            id="groupmaker.help.step3" 
            defaultMessage="Change the <b>number</b> to decide how many groups or students."
            values={{ b: (chunks: React.ReactNode) => <b>{chunks}</b> }}
          />
        </p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-rose-50 flex items-center justify-center text-xs font-black text-rose-600 shrink-0">4</div>
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
  const { setHeaderActions, setOnReset, clearHeader, setHelpContent } = useHeader();
  const [selectedClassId, setSelectedClassId] = useState(settings.classes[0]?.id || '');
  const [editedStudents, setEditedStudents] = useState<string[]>([]);
  const [mode, setMode] = useState<'groups' | 'students'>('groups');
  const [count, setCount] = useState(4);
  const [groups, setGroups] = useState<string[][]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isClassPanelOpen, setIsClassPanelOpen] = useState(true);

  useEffect(() => {
    const cls = settings.classes.find(c => c.id === selectedClassId);
    if (cls) {
      setEditedStudents(cls.students);
    }
  }, [selectedClassId, settings.classes]);

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
  }, [settings.soundTheme]);

  useEffect(() => {
    setOnReset(() => resetGroups);
    setHelpContent(getHelpInfo());
    return () => clearHeader();
  }, [clearHeader, setOnReset, resetGroups, setHelpContent]);

  useEffect(() => {
    setHeaderActions(
      <div className="flex items-center gap-4 italic">
        <button
          onClick={() => setIsClassPanelOpen(prev => !prev)}
          className={`flex items-center gap-2 px-6 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 ${
            isClassPanelOpen 
              ? 'bg-indigo-600 text-white' 
              : 'bg-white border-2 border-slate-100 text-slate-300 hover:border-indigo-100 hover:text-indigo-600'
          }`}
        >
          <Users2 size={14} /> <FormattedMessage id="classpanel.title" defaultMessage="Class Manager" />
        </button>
      </div>
    );
  }, [setHeaderActions, isClassPanelOpen]);

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
      />

      <ToolPanel className="italic" baseWidth={1000} alignTop>
        <div className="w-full flex flex-col gap-4 relative z-10 h-full overflow-hidden p-6">
          
          {/* Top Control Bar (Config) */}
          <div className="h-[120px] flex items-center justify-center bg-white/60 backdrop-blur-md rounded-[3rem] border-4 border-white shrink-0 w-full">
            <div className="flex items-center gap-8">
              {/* Mode Toggle */}
              <div className="bg-white/60 p-2 rounded-[2.5rem] flex items-center h-20 border-4 border-white shrink-0">
                <button 
                  onClick={() => { setMode('groups'); audioEngine.playTick(settings.soundTheme); }}
                  className={`h-full px-8 rounded-2xl text-base font-black uppercase tracking-widest transition-all ${mode === 'groups' ? 'bg-indigo-600 text-white scale-105 z-10' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  <FormattedMessage id="groupmaker.mode.groups" defaultMessage="Total Groups" />
                </button>
                <button 
                  onClick={() => { setMode('students'); audioEngine.playTick(settings.soundTheme); }}
                  className={`h-full px-10 rounded-2xl text-base font-black uppercase tracking-widest transition-all ${mode === 'students' ? 'bg-indigo-600 text-white scale-105 z-10' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  <FormattedMessage id="groupmaker.mode.size" defaultMessage="Size Limit" />
                </button>
              </div>

              {/* Count Input */}
              <div className="relative h-20 shrink-0">
                 <input 
                  type="number"
                  value={count}
                  min={1}
                  max={editedStudents.length || 100}
                  onChange={(e) => { setCount(parseInt(e.target.value) || 1); audioEngine.playTick(settings.soundTheme); }}
                  className="w-28 h-full bg-white/80 border-4 border-white focus:border-indigo-400 rounded-2xl text-center font-black text-4xl text-black outline-none transition-all italic"
                />
              </div>

              {/* Generate and Clear Buttons */}
              <div className="flex flex-col gap-2 shrink-0">
                <button
                  onClick={makeGroups}
                  disabled={isGenerating || !editedStudents.length}
                  className={`h-20 flex items-center gap-4 px-10 rounded-[2.5rem] font-black text-white transition-all active:scale-95 ${isGenerating ? 'bg-slate-300 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                >
                  {isGenerating ? <RotateCcw size={28} className="animate-spin" /> : <Shuffle size={28} strokeWidth={3} />}
                  <span className="uppercase tracking-[0.2em] text-xl">
                    <FormattedMessage id="groupmaker.generate" defaultMessage="Make Groups" />
                  </span>
                </button>
                {groups.length > 0 && (
                  <button
                    onClick={resetGroups}
                    className="text-xs font-black text-slate-400 hover:text-rose-500 uppercase tracking-widest transition-colors flex items-center justify-center gap-1"
                  >
                    <RotateCcw size={12} />
                    <FormattedMessage id="groupmaker.clear" defaultMessage="Clear Groups" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Main Display Area (Expanded to floor) */}
          <div className="flex-1 overflow-y-auto no-scrollbar p-6">
            <AnimatePresence mode="wait">
              {groups.length > 0 ? (
                <motion.div 
                  key="groups-grid"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 px-4"
                >
                  {groups.map((members, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, scale: 0.9, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="bg-white rounded-[3rem] border-4 border-white overflow-hidden flex flex-col h-fit transition-all group/card"
                    >
                      <div className="px-8 py-6 flex items-center justify-between border-b-4 border-slate-50 bg-slate-50/50 shrink-0">
                        <h3 className="font-black text-indigo-600 text-base tracking-widest">
                          <FormattedMessage id="groupmaker.team" defaultMessage="Team {n}" values={{ n: idx + 1 }} />
                        </h3>
                        <div className="bg-white px-4 py-2 rounded-full">
                          <span className="text-sm font-black text-slate-400 tabular-nums">
                            <FormattedMessage id="groupmaker.students_count" defaultMessage="{count} Students" values={{ count: members.length }} />
                          </span>
                        </div>
                      </div>
                      
                      <div className="px-8 py-4 flex flex-col gap-1.5 text-left">
                        {members.map((member, mIdx) => (
                          <motion.div 
                            key={mIdx}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 + mIdx * 0.02 }}
                            className="flex items-center gap-3 group/item"
                          >
                            <div className="w-3 h-3 rounded-full bg-slate-100 border-2 border-white group-hover/item:bg-indigo-400 transition-colors" />
                            <span className="text-xl font-black text-slate-900 group-hover/item:text-indigo-600 transition-colors break-words">{member}</span>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              ) : isGenerating ? (
                <div className="h-full flex flex-col items-center justify-center py-20 bg-slate-50/30 rounded-[4rem] border-4 border-dashed border-slate-100">
                  <div className="relative">
                    <div className="absolute inset-0 bg-indigo-500 blur-[60px] opacity-20 animate-pulse" />
                    <RotateCcw size={80} strokeWidth={1} className="text-indigo-600 animate-spin relative z-10" />
                  </div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] mt-8 animate-pulse italic">
                    <FormattedMessage id="groupmaker.status.making" defaultMessage="Making Groups..." />
                  </p>
                </div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="h-full flex flex-col items-center justify-center py-20 bg-white/10 rounded-[5rem] border-8 border-dashed border-white/40"
                />
              )}
            </AnimatePresence>
          </div>
        </div>
      </ToolPanel>
    </div>
  );
};

export default GroupMaker;
