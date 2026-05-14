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
  const [localText, setLocalText] = useState(students.join('\n'));

  React.useEffect(() => {
    setLocalText((prev) => {
      const prevList = prev.split('\n').filter(s => s.trim().length > 0);
      if (JSON.stringify(prevList) !== JSON.stringify(students)) {
        return students.join('\n');
      }
      return prev;
    });
  }, [students]);

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



  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          layout
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ layout: { duration: 0.5, type: "spring", bounce: 0.2 } }}
          className={`w-full lg:w-[400px] bg-slate-50/80 backdrop-blur-xl rounded-[3rem] border-4 border-white flex flex-col relative z-20 h-full overflow-hidden custom-scrollbar italic shrink-0 ${className}`}
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
                </div>
                <span className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tighter">
                  {students.length}
                </span>
              </div>

              <div className="flex-1 flex flex-col gap-3 min-h-0">
                <textarea
                  value={localText}
                  onChange={(e) => {
                    const val = e.target.value;
                    setLocalText(val);
                    const list = val.split('\n').filter(s => s.trim().length > 0);
                    onStudentsChange(list);
                  }}
                  placeholder={intl.formatMessage({ id: 'classpanel.placeholder.students_list', defaultMessage: 'Enter names here (one per line)...' })}
                  className="flex-1 w-full p-6 bg-white border-4 border-transparent focus:border-indigo-100 text-slate-900 rounded-3xl text-sm font-black uppercase tracking-widest outline-none transition-all resize-none custom-scrollbar leading-relaxed"
                />
              </div>
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
