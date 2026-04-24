import React, { useState, useEffect } from 'react';
import { Plus, Minus, Trash2, Edit2, Check, Award } from 'lucide-react';
import { ToolHeader } from '../ToolHeader';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { useSettings } from '../../contexts/SettingsContext';
import { audioEngine } from '../../utils/audio';

export const GroupScoreBoard = () => {
  const [groups, setGroups] = useState(() => {
    const saved = localStorage.getItem('teacherToolsGroupScores');
    return saved ? JSON.parse(saved) : [
      { id: '1', name: 'Group 1', score: 0 },
      { id: '2', name: 'Group 2', score: 0 },
    ];
  });

  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const { settings } = useSettings();

  useEffect(() => {
    localStorage.setItem('teacherToolsGroupScores', JSON.stringify(groups));
  }, [groups]);

  const addGroup = () => {
    const newGroup = {
      id: Date.now().toString(),
      name: `Group ${groups.length + 1}`,
      score: 0
    };
    setGroups([...groups, newGroup]);
  };

  const removeGroup = (id) => {
    setGroups(groups.filter(g => g.id !== id));
  };

  const updateScore = (id, delta) => {
    audioEngine.playTick(settings.soundTheme);
    setGroups(groups.map(g => {
      if (g.id === id) {
        return { ...g, score: Math.max(0, g.score + delta) };
      }
      return g;
    }));
  };

  const startEditing = (group) => {
    setEditingId(group.id);
    setEditName(group.name);
  };

  const saveEdit = (id) => {
    if (editName.trim()) {
      setGroups(groups.map(g => g.id === id ? { ...g, name: editName.trim() } : g));
    }
    setEditingId(null);
  };

  const handleKeyPress = (e, id) => {
    if (e.key === 'Enter') saveEdit(id);
  };

  const getGridCols = () => {
    const count = groups.length;
    const items = count + 1; // groups + add button
    if (count === 0) return 'flex justify-center';
    if (count < 4) return `grid-cols-${items}`;
    if (count === 4) return 'grid-cols-5';
    if (count < 8) return 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4';
    
    // For 8 or more groups, calculate columns needed to keep it to 3 rows
    const cols = Math.ceil(items / 3);
    const finalCols = Math.min(12, cols); // Max 12 columns in Tailwind
    return `grid-cols-2 md:grid-cols-4 lg:grid-cols-${finalCols}`;
  };

  const getScoreSize = () => {
    if (groups.length >= 12) return 'text-3xl sm:text-4xl';
    if (groups.length >= 8) return 'text-4xl sm:text-5xl';
    if (groups.length >= 6) return 'text-6xl sm:text-7xl';
    if (groups.length >= 4) return 'text-7xl sm:text-8xl';
    return 'text-9xl';
  };

  const uniqueScores = [...new Set(groups.map(g => g.score).filter(s => s > 0))].sort((a, b) => b - a);
  
  const getMedal = (score) => {
    if (score === 0) return null;
    const rank = uniqueScores.indexOf(score);
    if (rank === 0) return '🥇';
    if (rank === 1) return '🥈';
    if (rank === 2) return '🥉';
    return null;
  };

  return (
    <div className="w-full mx-auto px-4 pt-2 pb-8 h-full flex flex-col gap-8">
      <ToolHeader
        title="Group Score Board"
        icon={Award}
        description="Friendly Classroom Competition & Points Tracking"
        infoContent={
          <>
            <p>
              <strong className="text-white block mb-1">Manage Groups</strong>
              Click "Add Group" to create a new team. Hover over a group name to edit or delete it.
            </p>
            <p>
              <strong className="text-white block mb-1">Scoring</strong>
              Use the plus and minus buttons to adjust scores. Points are saved automatically for this session.
            </p>
          </>
        }
      />

      <div className="flex flex-col w-full max-w-7xl mx-auto items-center">
        <div className="w-full">
          {groups.length === 0 ? (
            <div className="text-center p-12 bg-white rounded-3xl border-2 border-dashed border-gray-200 text-gray-400 w-full max-w-lg mx-auto">
              <p className="text-xl font-bold uppercase tracking-widest opacity-50">No groups created</p>
              <p className="text-sm mt-2">Click the button to add your first group</p>
              <button
                onClick={addGroup}
                className="mt-6 px-8 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all font-black text-xs uppercase tracking-widest shadow-md hover:shadow-lg active:scale-95 flex items-center justify-center gap-2 mx-auto"
              >
                <Plus size={18} /> Add Group
              </button>
            </div>
          ) : (
            <div className={`grid ${getGridCols()} gap-6 w-full items-center justify-center`}>
              <AnimatePresence mode="popLayout">
                {groups.map((group) => (
                  <motion.div
                    key={group.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    layout
                    className={`bg-white rounded-[2.5rem] shadow-xl border-2 border-slate-50 overflow-hidden flex flex-col transition-all hover:shadow-2xl hover:-translate-y-1 h-full ${groups.length >= 8 ? 'min-h-[200px]' : 'min-h-[300px]'}`}
                  >
                    <div className={`bg-slate-50 ${groups.length >= 8 ? 'p-4' : 'p-6'} border-b border-slate-100 flex justify-between items-center group/header`}>
                      {editingId === group.id ? (
                        <div className="flex items-center gap-2 flex-1">
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            onKeyDown={(e) => handleKeyPress(e, group.id)}
                            autoFocus
                            className="w-full p-2 text-lg font-black border-2 border-primary rounded-xl outline-none"
                          />
                          <button onClick={() => saveEdit(group.id)} className="text-green-600 p-2 hover:bg-green-100 rounded-xl transition-all">
                            <Check size={20} />
                          </button>
                        </div>
                      ) : (
                        <>
                          <h3 className="text-xl font-black text-slate-800 truncate flex-1 flex items-center gap-2" title={group.name}>
                            {group.name}
                            {getMedal(group.score) && <span className="text-2xl drop-shadow-sm">{getMedal(group.score)}</span>}
                          </h3>
                          <div className="flex gap-1 opacity-0 group-hover/header:opacity-100 transition-opacity">
                            <button onClick={() => startEditing(group)} className="text-slate-400 hover:text-primary p-2 rounded-xl hover:bg-white transition-all">
                              <Edit2 size={18} />
                            </button>
                            <button onClick={() => removeGroup(group.id)} className="text-slate-400 hover:text-red-500 p-2 rounded-xl hover:bg-red-50 transition-all">
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </>
                      )}
                    </div>

                    <div className={`${groups.length >= 8 ? 'p-4' : 'p-10'} flex-1 flex flex-col items-center justify-center bg-white relative`}>
                      <motion.span
                        key={group.score}
                        initial={{ scale: 1.5, color: '#6366f1' }}
                        animate={{ scale: 1, color: '#1e293b' }}
                        className={`${getScoreSize()} font-black tabular-nums tracking-tighter drop-shadow-sm`}
                      >
                        {group.score}
                      </motion.span>
                    </div>

                    <div className={`flex border-t border-slate-50 ${groups.length >= 8 ? 'p-2 gap-2' : 'p-4 gap-4'} bg-slate-50/30`}>
                      <button
                        onClick={() => updateScore(group.id, -1)}
                        disabled={group.score === 0}
                        className={`flex-1 ${groups.length >= 8 ? 'h-10 rounded-xl' : 'h-16 rounded-2xl'} flex justify-center items-center text-rose-500 bg-white border-2 border-slate-100 hover:bg-rose-50 hover:border-rose-100 disabled:opacity-30 disabled:grayscale transition-all active:scale-95 shadow-sm`}
                      >
                        <Minus size={groups.length >= 8 ? 20 : 32} />
                      </button>
                      <button
                        onClick={() => updateScore(group.id, 1)}
                        className={`flex-1 ${groups.length >= 8 ? 'h-10 rounded-xl' : 'h-16 rounded-2xl'} flex justify-center items-center text-emerald-500 bg-white border-2 border-slate-100 hover:bg-emerald-50 hover:border-emerald-100 transition-all active:scale-95 shadow-sm`}
                      >
                        <Plus size={groups.length >= 8 ? 20 : 32} />
                      </button>
                    </div>
                  </motion.div>
                ))}
                <motion.div layout className={`flex items-center justify-center h-full ${groups.length >= 8 ? 'min-h-[200px]' : 'min-h-[300px]'}`}>
                  <motion.button
                    key="add-button"
                    onClick={addGroup}
                    className="group flex flex-col items-center justify-center bg-slate-50 border-4 border-dashed border-slate-200 rounded-[2rem] w-24 h-24 hover:bg-indigo-50 hover:border-indigo-300 hover:shadow-xl transition-all"
                    title="Add Group"
                  >
                    <Plus size={32} className="text-slate-400 group-hover:text-indigo-600 group-hover:scale-110 transition-all" />
                  </motion.button>
                </motion.div>
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
