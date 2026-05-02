import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, X, SortAsc, Shuffle, Plus, Trash2 } from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';
import { useIntl, FormattedMessage } from 'react-intl';
import { shuffle } from '../../utils/random';
import { audioEngine } from '../../utils/audio';

export interface WordList {
  id: string;
  name: string;
  words: string[];
}

interface WordPanelProps {
  isOpen: boolean;
  onClose: () => void;
  selectedListId: string;
  onListChange: (id: string) => void;
  lists: WordList[];
  onWordsChange: (words: string[]) => void;
  onAddList?: () => void;
  onDeleteList?: (id: string) => void;
  onManageLists?: () => void;
  manageListsLabel?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}

/**
 * WordPanel provides a consistent sidebar for selecting and editing word lists.
 * It features a glassmorphic aesthetic and slides in from the left.
 */
export const WordPanel: React.FC<WordPanelProps> = ({
  isOpen,
  onClose,
  selectedListId,
  onListChange,
  lists,
  onWordsChange,
  onAddList,
  onDeleteList,
  onManageLists,
  manageListsLabel,
  className = "",
  children
}) => {
  const { settings } = useSettings();
  const intl = useIntl();

  const currentList = lists.find(l => l.id === selectedListId);
  const words = currentList?.words || [];

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const list = e.target.value.split('\n').map(w => w.trim()).filter(s => s.length > 0);
    onWordsChange(list);
  };

  const handleSort = () => {
    const sorted = [...words].sort((a, b) => a.localeCompare(b));
    onWordsChange(sorted);
    audioEngine.playTick(settings.soundTheme);
  };

  const handleShuffle = () => {
    const shuffled = shuffle([...words]);
    onWordsChange(shuffled);
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
          <div className="bg-white/80 backdrop-blur-sm px-8 py-6 flex justify-between items-center shrink-0 border-b-4 border-white">
            <div className="flex items-center gap-2">
              <BookOpen size={16} className="text-indigo-400" />
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-900 leading-none">
                <FormattedMessage id="wordpanel.title" defaultMessage="Word Manager" />
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-2 bg-white border-2 border-slate-100 text-slate-300 hover:text-rose-600 hover:border-rose-100 rounded-xl transition-all active:scale-90"
            >
              <X size={14} strokeWidth={3} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 flex flex-col p-8 space-y-6 overflow-hidden">
            {/* List Selection */}
            <div className="space-y-3 shrink-0">
              <div className="flex items-center justify-between ml-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <FormattedMessage id="wordpanel.label.select" defaultMessage="Load List" />
                </label>
                <div className="flex items-center gap-2">
                  {onAddList && (
                    <button 
                      onClick={onAddList}
                      className="p-1.5 text-indigo-400 hover:text-indigo-600 transition-colors"
                      title="Add List"
                    >
                      <Plus size={14} strokeWidth={3} />
                    </button>
                  )}
                  {onDeleteList && lists.length > 1 && (
                    <button 
                      onClick={() => onDeleteList(selectedListId)}
                      className="p-1.5 text-rose-400 hover:text-rose-600 transition-colors"
                      title="Delete List"
                    >
                      <Trash2 size={14} strokeWidth={3} />
                    </button>
                  )}
                  {onManageLists && (
                    <button 
                      onClick={onManageLists}
                      className="text-[10px] font-black text-indigo-400 hover:text-indigo-600 uppercase tracking-widest transition-colors ml-1"
                    >
                      ({manageListsLabel || <FormattedMessage id="wordpanel.link.manage" defaultMessage="Manage Lists" />})
                    </button>
                  )}
                </div>
              </div>
              <div className="relative group">
                <select
                  value={selectedListId}
                  onChange={(e) => { onListChange(e.target.value); audioEngine.playTick(settings.soundTheme); }}
                  className="w-full appearance-none px-6 h-14 bg-white border-4 border-transparent focus:border-indigo-100 text-slate-900 rounded-2xl text-xs font-black uppercase tracking-widest outline-none transition-all cursor-pointer"
                >
                  {lists.map(l => (
                    <option key={l.id} value={l.id}>{l.name}</option>
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
                <FormattedMessage id="wordpanel.button.sort" defaultMessage="Sort A-Z" />
              </button>
              <button
                onClick={handleShuffle}
                className="flex items-center justify-center gap-2 py-4 bg-white border-2 border-slate-100 text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:border-indigo-100 hover:text-indigo-600 transition-all active:scale-95"
              >
                <Shuffle size={14} />
                <FormattedMessage id="wordpanel.button.shuffle" defaultMessage="Shuffle" />
              </button>
            </div>

            {/* Words Textarea */}
            <div className="space-y-3 flex-1 flex flex-col min-h-0">
              <div className="flex items-center justify-between ml-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <FormattedMessage id="wordpanel.label.words" defaultMessage="Words" />
                </label>
                <span className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tighter">
                  {words.length}
                </span>
              </div>
              <textarea
                value={words.join('\n')}
                onChange={handleTextareaChange}
                className="flex-1 w-full p-6 text-sm bg-white border-4 border-transparent focus:border-indigo-100 rounded-[2rem] outline-none transition-all font-black text-slate-900 resize-none custom-scrollbar min-h-0"
                placeholder={intl.formatMessage({ id: 'wordpanel.placeholder.words', defaultMessage: 'Enter words...' })}
              />
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

export default WordPanel;
