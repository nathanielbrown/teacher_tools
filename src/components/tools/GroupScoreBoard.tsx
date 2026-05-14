import React, { useState, useEffect, useCallback } from 'react';
import { 
  Plus, 
  Minus, 
  Trophy,
  X,
  Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSettings } from '../../contexts/SettingsContext';
import { audioEngine } from '../../utils/audio';
import { useHeader } from '../../contexts/HeaderContext';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { ToolPanel } from '../shared/ToolPanel';
import { FormattedMessage, useIntl } from 'react-intl';

// 3. Text (Help and Info)
const getHelpInfo = () => (
  <div className="space-y-4 font-['Outfit']">
    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">
      <FormattedMessage id="groupscoreboard.help.title" defaultMessage="How to Use the Group Score Board" />
    </h3>
    <div className="space-y-3">
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center text-xs font-black text-indigo-600 shrink-0">1</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">
          <FormattedMessage 
            id="groupscoreboard.help.step1" 
            defaultMessage="Click the <b>Plus (+)</b> button to add a new group."
            values={{ b: (chunks: React.ReactNode) => <b>{chunks}</b> }}
          />
        </p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center text-xs font-black text-blue-600 shrink-0">2</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">
          <FormattedMessage 
            id="groupscoreboard.help.step2" 
            defaultMessage="Click a <b>Group Name</b> to change it."
            values={{ b: (chunks: React.ReactNode) => <b>{chunks}</b> }}
          />
        </p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-emerald-50 flex items-center justify-center text-xs font-black text-emerald-600 shrink-0">3</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">
          <FormattedMessage 
            id="groupscoreboard.help.step3" 
            defaultMessage="Use the <b>Plus and Minus</b> buttons to change scores."
            values={{ b: (chunks: React.ReactNode) => <b>{chunks}</b> }}
          />
        </p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-rose-50 flex items-center justify-center text-xs font-black text-rose-600 shrink-0">4</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">
          <FormattedMessage 
            id="groupscoreboard.help.step4" 
            defaultMessage="The leader will show a <b>Trophy (🏆)</b> next to their name."
            values={{ b: (chunks: React.ReactNode) => <b>{chunks}</b> }}
          />
        </p>
      </div>
    </div>
  </div>
);

export const GroupScoreBoard = () => {
  const { settings } = useSettings();
  const { setHeaderActions, setOnReset, clearHeader, setHelpContent } = useHeader();
  const intl = useIntl();
  
  const [groups, setGroups] = useLocalStorage<any[]>('group_score_board_scores', [
    { id: '1', name: 'Group 1', score: 0 },
    { id: '2', name: 'Group 2', score: 0 },
  ]);

  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 1024 : false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  // Persistence handled by useLocalStorage

  const addGroup = useCallback(() => {
    const newGroup = {
      id: Date.now().toString(),
      name: intl.formatMessage({ id: 'groupscoreboard.group_name', defaultMessage: 'Group {n}' }, { n: groups.length + 1 }),
      score: 0
    };
    setGroups([...groups, newGroup]);
    audioEngine.playTick(settings.soundTheme);
  }, [groups, settings.soundTheme, intl]);

  const removeGroup = (id: string) => {
    setGroups(groups.filter(g => g.id !== id));
    audioEngine.playTick(settings.soundTheme);
  };

  const updateScore = (id: string, delta: number) => {
    audioEngine.playTick(settings.soundTheme);
    setGroups(groups.map(g => {
      if (g.id === id) {
        return { ...g, score: Math.max(0, g.score + delta) };
      }
      return g;
    }));
  };

  const startEditing = (id: string, name: string) => {
    setEditingId(id);
    setEditName(name);
  };

  const saveEdit = (id: string) => {
    if (editName.trim()) {
      setGroups(groups.map(g => g.id === id ? { ...g, name: editName.trim() } : g));
    }
    setEditingId(null);
  };

  const handleKeyPress = (e: React.KeyboardEvent, id: string) => {
    if (e.key === 'Enter') saveEdit(id);
    if (e.key === 'Escape') setEditingId(null);
  };

  const resetAllScores = useCallback(() => {
    setGroups(groups.map(g => ({ ...g, score: 0 })));
    audioEngine.playTick(settings.soundTheme);
  }, [groups, settings.soundTheme]);

  useEffect(() => {
    setOnReset(() => resetAllScores);
    setHelpContent(getHelpInfo());
    return () => clearHeader();
  }, [clearHeader, setOnReset, resetAllScores, setHelpContent]);

  useEffect(() => {
    setHeaderActions(null);
  }, [setHeaderActions]);

  const maxScore = Math.max(...groups.map(g => g.score));
  
  return (
    <ToolPanel 
      className="italic" 
      baseWidth={isMobile ? 400 : 1200} 
      baseHeight={800} 
      fluid={isMobile}
    >
      <div className="w-full flex flex-col items-center gap-4 md:gap-12 relative z-10 h-full overflow-hidden">
        
        {/* Branding Header */}
        <div className="text-center space-y-2 shrink-0 mb-0 md:mb-4">
          <div className="space-y-1">
             <h1 className="text-4xl lg:text-6xl font-black text-slate-900 tracking-tighter uppercase leading-none">
               <FormattedMessage id="groupscoreboard.title" defaultMessage="Group Scores" />
             </h1>
          </div>
        </div>

        {/* Board Area */}
        <div className="flex-1 w-full overflow-y-auto no-scrollbar pb-10">
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-8 items-start px-4">
            <AnimatePresence mode="popLayout">
              {groups.map((group) => {
                const isLeader = group.score > 0 && group.score === maxScore;
                
                return (
                  <motion.div
                    key={group.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="bg-white rounded-[2.5rem] md:rounded-[3.5rem] flex flex-col overflow-hidden border-4 border-white group/card relative transition-all"
                  >
                    {/* Card Header */}
                    <div className="bg-slate-50/80 px-8 py-3 flex items-center justify-between border-b-4 border-white">
                      <div className="flex items-center gap-4 overflow-hidden flex-1 text-left">
                        {editingId === group.id ? (
                          <input
                            autoFocus
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            onBlur={() => saveEdit(group.id)}
                            onKeyDown={(e) => handleKeyPress(e, group.id)}
                             className="bg-white border-2 md:border-4 border-indigo-100 rounded-xl px-2 md:px-4 py-1 md:py-2 text-xs md:text-sm font-black outline-none w-full text-indigo-600 tracking-widest"
                          />
                        ) : (
                          <>
                            <span 
                               className="text-slate-900 font-black text-xs md:text-sm tracking-widest truncate cursor-pointer hover:text-indigo-600 transition-colors"
                              onClick={() => startEditing(group.id, group.name)}
                            >
                              {group.name}
                            </span>
                            {isLeader && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="bg-amber-400 text-white w-6 h-6 rounded-full flex items-center justify-center text-[10px]"
                              >
                                <Trophy size={12} fill="currentColor" />
                              </motion.div>
                            )}
                          </>
                        )}
                      </div>
                      <button 
                        onClick={() => removeGroup(group.id)}
                        className="text-slate-200 hover:text-rose-500 transition-all p-2 hover:bg-rose-50 rounded-xl ml-2"
                      >
                        <X size={18} strokeWidth={3} />
                      </button>
                    </div>

                    {/* Score Area */}
                    <div className="flex-1 flex flex-col items-center justify-center py-4 md:py-6 px-4 md:px-8 min-h-[80px] md:min-h-[120px] relative overflow-hidden bg-slate-50">
                      <div className="tool-grid-bg opacity-10 pointer-events-none" />
                      <AnimatePresence mode="wait">
                        <motion.span
                          key={group.score}
                          initial={{ scale: 1.5, opacity: 0, y: 10 }}
                          animate={{ scale: 1, opacity: 1, y: 0 }}
                          className="text-6xl md:text-8xl font-black text-slate-900 tabular-nums tracking-tighter leading-none relative z-10"
                        >
                          {group.score}
                        </motion.span>
                      </AnimatePresence>
                      <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em] mt-2 md:mt-4 relative z-10">
                        <FormattedMessage id="groupscoreboard.points" defaultMessage="Points" />
                      </span>
                    </div>

                    {/* Score Controls */}
                    <div className="flex gap-2 md:gap-4 p-2 md:p-4 bg-white shrink-0">
                      <button
                        onClick={() => updateScore(group.id, -1)}
                        disabled={group.score === 0}
                        className="flex-1 h-14 md:h-12 rounded-[1rem] md:rounded-[1.5rem] flex justify-center items-center bg-slate-50 border-4 border-white text-rose-500 hover:bg-rose-500 hover:text-white disabled:opacity-20 transition-all active:scale-95"
                      >
                        <Minus size={isMobile ? 24 : 20} strokeWidth={4} />
                      </button>
                      <button
                        onClick={() => updateScore(group.id, 1)}
                        className="flex-1 h-14 md:h-12 rounded-[1rem] md:rounded-[1.5rem] flex justify-center items-center bg-slate-50 border-4 border-white text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all active:scale-95"
                      >
                        <Plus size={isMobile ? 24 : 20} strokeWidth={4} />
                      </button>
                    </div>
                  </motion.div>
                );
              })}

              {/* Add Group Button */}
              <motion.button
                layout
                onClick={() => addGroup()}
                className="bg-slate-50/50 rounded-[2.5rem] md:rounded-[3.5rem] border-4 border-dashed border-slate-200 hover:border-indigo-400 hover:bg-white transition-all flex flex-col items-center justify-center min-h-[200px] md:min-h-[240px] group/add"
              >
                <div className="w-16 h-16 md:w-20 md:h-20 bg-white rounded-[2rem] flex items-center justify-center border-4 border-slate-50 group-hover/add:scale-110 transition-transform group-hover/add:rotate-90">
                  <Plus size={28} md:size={32} strokeWidth={3} className="text-slate-300 group-hover/add:text-indigo-600 transition-colors" />
                </div>
                <span className="text-[8px] md:text-[10px] font-black text-slate-300 uppercase tracking-[0.5em] mt-6 group-hover/add:text-indigo-400">
                  <FormattedMessage id="groupscoreboard.add_group" defaultMessage="Add Group" />
                </span>
              </motion.button>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </ToolPanel>
  );
};

export default GroupScoreBoard;
