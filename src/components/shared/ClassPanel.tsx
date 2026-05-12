import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users2, X, SortAsc, Shuffle, ExternalLink, Trash2, Plus, Type } from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';
import { useIntl, FormattedMessage } from 'react-intl';
import { shuffle } from '../../utils/random';
import { audioEngine } from '../../utils/audio';

interface ClassPanelProps {
  isOpen: boolean;
  onClose: () => void;
  selectedClassId: string;
  onClassChange: (id: string) => void;
  students: string[];
  onStudentsChange: (students: string[]) => void;
  onManageClasses: () => void;
  className?: string;
  children?: React.ReactNode;
  hideClose?: boolean;
}

/**
 * ClassPanel provides a consistent sidebar for selecting and editing class rosters.
 * It features a glassmorphic aesthetic and slides in from the left.
 */
export const ClassPanel: React.FC<ClassPanelProps> = ({
  isOpen,
  onClose,
  selectedClassId,
  onClassChange,
  students,
  onStudentsChange,
  onManageClasses,
  className = "",
  children,
  hideClose = false
}) => {
  const { settings } = useSettings();
  const intl = useIntl();
  const [isTextMode, setIsTextMode] = useState(false);
  const [newStudent, setNewStudent] = useState('');

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const list = e.target.value.split('\n').filter(s => s.trim().length > 0);
    onStudentsChange(list);
  };

  const handleSort = () => {
    const sorted = [...students].sort((a, b) => a.localeCompare(b));
    onStudentsChange(sorted);
    audioEngine.playTick(settings.soundTheme);
  };

  const handleShuffle = () => {
    const shuffled = shuffle([...students]);
    onStudentsChange(shuffled);
    audioEngine.playTick(settings.soundTheme);
  };

  const handleRemoveStudent = (index: number) => {
    const updated = students.filter((_, i) => i !== index);
    onStudentsChange(updated);
    audioEngine.playTick(settings.soundTheme);
  };

  const handleAddStudent = () => {
    if (!newStudent.trim()) return;
    onStudentsChange([...students, newStudent.trim()]);
    setNewStudent('');
    audioEngine.playTick(settings.soundTheme);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          layout
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ layout: { duration: 0.5, type: "spring", bounce: 0.2 } }}
          className={`w-full lg:w-[400px] bg-slate-50/80 backdrop-blur-xl rounded-[3rem] border-4 border-white flex flex-col relative z-20 h-fit lg:h-full overflow-hidden custom-scrollbar italic shrink-0 ${className}`}
        >
          {/* Header */}
          <div className="bg-white/80 backdrop-blur-sm px-6 py-4 flex justify-between items-center shrink-0 border-b-4 border-white">
            <div className="flex items-center gap-2">
              <Users2 size={16} className="text-indigo-400" />
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-900 leading-none">
                <FormattedMessage id="classpanel.title" defaultMessage="Class Manager" />
              </h3>
            </div>
            {!hideClose && (
              <button
                onClick={onClose}
                className="p-2 bg-white border-2 border-slate-100 text-slate-300 hover:text-rose-600 hover:border-rose-100 rounded-xl transition-all active:scale-90"
              >
                <X size={14} strokeWidth={3} />
              </button>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 flex flex-col p-6 space-y-4 overflow-hidden">
            {/* Class Selection */}
            <div className="space-y-3 shrink-0">
              <div className="flex items-center justify-between ml-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <FormattedMessage id="classpanel.label.select" defaultMessage="Load Class" />
                </label>
                <button 
                  onClick={onManageClasses}
                  className="text-[10px] font-black text-indigo-400 hover:text-indigo-600 uppercase tracking-widest transition-colors"
                >
                  (<FormattedMessage id="classpanel.link.manage_short" defaultMessage="Add/Remove Classes" />)
                </button>
              </div>
              <div className="relative group">
                <select
                  value={selectedClassId}
                  onChange={(e) => { onClassChange(e.target.value); audioEngine.playTick(settings.soundTheme); }}
                  className="w-full appearance-none px-6 h-14 bg-white border-4 border-transparent focus:border-indigo-100 text-slate-900 rounded-2xl text-xs font-black uppercase tracking-widest outline-none transition-all cursor-pointer"
                >
                  <option value="blank">{intl.formatMessage({ id: 'classpanel.option.blank', defaultMessage: '(Blank)' })}</option>
                  {settings.classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Controls */}
            <div className="grid grid-cols-2 gap-4 shrink-0">
              <button
                onClick={handleSort}
                className="flex items-center justify-center gap-2 py-4 bg-white border-2 border-slate-100 text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:border-indigo-100 hover:text-indigo-600 transition-all active:scale-95"
              >
                <SortAsc size={14} />
                <FormattedMessage id="classpanel.button.sort" defaultMessage="Sort A-Z" />
              </button>
              <button
                onClick={handleShuffle}
                className="flex items-center justify-center gap-2 py-4 bg-white border-2 border-slate-100 text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:border-indigo-100 hover:text-indigo-600 transition-all active:scale-95"
              >
                <Shuffle size={14} />
                <FormattedMessage id="classpanel.button.shuffle" defaultMessage="Shuffle" />
              </button>
            </div>

            {/* Students List or Textarea */}
            <div className="space-y-3 flex-1 flex flex-col min-h-0">
              <div className="flex items-center justify-between ml-1">
                <div className="flex items-center gap-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <FormattedMessage id="classpanel.label.students" defaultMessage="Students" />
                  </label>
                  <button
                    onClick={() => setIsTextMode(!isTextMode)}
                    className="p-1 text-indigo-400 hover:text-indigo-600 transition-colors"
                    title={isTextMode ? "List View" : "Bulk Edit"}
                  >
                    {isTextMode ? <Users2 size={12} /> : <Type size={12} />}
                  </button>
                </div>
                <span className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tighter">
                  {students.length}
                </span>
              </div>

              {isTextMode ? (
                <textarea
                  value={students.join('\n')}
                  onChange={handleTextareaChange}
                  className="flex-1 w-full p-6 text-sm bg-white border-4 border-transparent focus:border-indigo-100 rounded-[2rem] outline-none transition-all font-black text-slate-900 resize-none custom-scrollbar min-h-0"
                  placeholder={intl.formatMessage({ id: 'classpanel.placeholder.students', defaultMessage: 'Enter student names...' })}
                />
              ) : (
                <div className="flex-1 flex flex-col gap-3 min-h-0">
                  <div className="relative group">
                    <input
                      type="text"
                      value={newStudent}
                      onChange={(e) => setNewStudent(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddStudent()}
                      placeholder={intl.formatMessage({ id: 'classpanel.placeholder.add_student', defaultMessage: 'Add student...' })}
                      className="w-full h-12 pl-6 pr-12 bg-white border-4 border-transparent focus:border-indigo-100 text-slate-900 rounded-2xl text-xs font-black uppercase tracking-widest outline-none transition-all"
                    />
                    <button
                      onClick={handleAddStudent}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-600 hover:text-white transition-all active:scale-90"
                    >
                      <Plus size={14} strokeWidth={3} />
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-1 pr-2 custom-scrollbar">
                    {students.map((student, index) => (
                      <motion.div
                        layout
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        key={`${student}-${index}`}
                        className="flex items-center justify-between p-2 px-4 bg-white border-2 border-slate-50 rounded-xl group hover:border-indigo-100 transition-all"
                      >
                        <span className="text-[10px] font-black text-slate-700 uppercase tracking-tight truncate pr-4">
                          {student}
                        </span>
                        <button
                          onClick={() => handleRemoveStudent(index)}
                          className="p-1 text-slate-200 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 size={12} />
                        </button>
                      </motion.div>
                    ))}
                    {students.length === 0 && (
                      <div className="flex-1 flex flex-col items-center justify-center text-slate-300 py-12 text-center">
                        <Users2 size={32} className="opacity-20 mb-2" />
                        <p className="text-[10px] font-black uppercase tracking-widest italic">
                          <FormattedMessage id="classpanel.empty" defaultMessage="No students yet" />
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            {/* Additional Content (e.g. History) */}
            {children && (
              <div className="pt-6 border-t-4 border-white shrink-0">
                {children}
              </div>
            )}
          </div>

        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ClassPanel;
