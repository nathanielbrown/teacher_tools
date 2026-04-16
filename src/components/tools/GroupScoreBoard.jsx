import React, { useState, useEffect } from 'react';
import { Plus, Minus, Trash2, Edit2, Check } from 'lucide-react';
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
    if (settings.soundsEnabled) audioEngine.playTick(true);
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

  return (
    <div className="flex flex-col items-center max-w-6xl mx-auto space-y-12 pb-12">
      <div className="flex items-center justify-between w-full">
        <h2 className="text-3xl font-bold text-primary">Group Score Board</h2>
        <button
          onClick={addGroup}
          className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl hover:bg-primary/90 transition-colors font-bold shadow-lg"
        >
          <Plus size={20} /> Add Group
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 w-full">
        <AnimatePresence>
          {groups.map((group) => (
            <motion.div
              key={group.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              layout
              className="bg-white rounded-3xl shadow-xl border-2 border-gray-100 overflow-hidden flex flex-col"
            >
              <div className="bg-primary/5 p-4 border-b border-primary/10 flex justify-between items-center group/header">
                {editingId === group.id ? (
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => handleKeyPress(e, group.id)}
                      autoFocus
                      className="w-full p-2 text-xl font-bold border-2 border-primary rounded-lg outline-none"
                    />
                    <button onClick={() => saveEdit(group.id)} className="text-green-600 p-2 hover:bg-green-100 rounded-lg">
                      <Check size={20} />
                    </button>
                  </div>
                ) : (
                  <>
                    <h3 className="text-2xl font-bold text-text truncate flex-1" title={group.name}>
                      {group.name}
                    </h3>
                    <div className="flex gap-1 opacity-0 group-hover/header:opacity-100 transition-opacity">
                      <button onClick={() => startEditing(group)} className="text-gray-400 hover:text-primary p-2 rounded-lg hover:bg-white">
                        <Edit2 size={18} />
                      </button>
                      <button onClick={() => removeGroup(group.id)} className="text-gray-400 hover:text-red-500 p-2 rounded-lg hover:bg-red-50">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </>
                )}
              </div>

              <div className="p-8 flex-1 flex flex-col items-center justify-center">
                <motion.span
                  key={group.score}
                  initial={{ scale: 1.5, color: '#10b981' }}
                  animate={{ scale: 1, color: '#1f2937' }}
                  className="text-8xl font-black tabular-nums tracking-tighter drop-shadow-sm"
                >
                  {group.score}
                </motion.span>
              </div>

              <div className="flex border-t border-gray-100">
                <button
                  onClick={() => updateScore(group.id, -1)}
                  disabled={group.score === 0}
                  className="flex-1 py-4 flex justify-center items-center text-red-500 hover:bg-red-50 disabled:opacity-30 disabled:hover:bg-transparent transition-colors border-r border-gray-100"
                >
                  <Minus size={32} />
                </button>
                <button
                  onClick={() => updateScore(group.id, 1)}
                  className="flex-1 py-4 flex justify-center items-center text-green-500 hover:bg-green-50 transition-colors"
                >
                  <Plus size={32} />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};
