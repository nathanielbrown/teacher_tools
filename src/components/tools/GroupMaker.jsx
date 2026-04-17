import React, { useState } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { useSettings } from '../../contexts/SettingsContext';
import { Users, Settings, Shuffle } from 'lucide-react';
import { audioEngine } from '../../utils/audio';

export const GroupMaker = () => {
  const { settings } = useSettings();
  const [selectedClassId, setSelectedClassId] = useState(settings.classes[0]?.id || '');
  const [mode, setMode] = useState('numberOfGroups'); // 'numberOfGroups' or 'studentsPerGroup'
  const [count, setCount] = useState(3);
  const [groups, setGroups] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const selectedClass = settings.classes.find(c => c.id === selectedClassId);
  const students = selectedClass ? selectedClass.students : [];

  const generateGroups = () => {
    if (!students.length) return;
    setIsGenerating(true);
    setGroups([]);

    if (settings.soundTheme !== 'none') {
       audioEngine.playTick(settings.soundTheme);
    }

    setTimeout(() => {
      // Shuffle students array
      const shuffled = [...students].sort(() => Math.random() - 0.5);
      const newGroups = [];

      if (mode === 'numberOfGroups') {
        const numGroups = Math.max(1, count);
        for (let i = 0; i < numGroups; i++) {
          newGroups.push([]);
        }
        shuffled.forEach((student, index) => {
          newGroups[index % numGroups].push(student);
        });
      } else {
        const size = Math.max(1, count);
        for (let i = 0; i < shuffled.length; i += size) {
          newGroups.push(shuffled.slice(i, i + size));
        }
      }

      setGroups(newGroups);
      setIsGenerating(false);
      audioEngine.playAlarm(settings.soundTheme);
    }, 800);
  };

  if (!students.length) {
    return (
      <div className="flex flex-col items-center justify-center space-y-8">
        <h2 className="text-3xl font-bold text-primary flex items-center gap-2"><Users /> Group Maker</h2>
        <div className="p-8 bg-yellow-50 text-yellow-800 rounded-xl border border-yellow-200">
          Please add a class with students in Settings first!
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center space-y-8 max-w-5xl mx-auto">
      <h2 className="text-3xl font-bold text-primary flex items-center gap-2">
        <Users /> Random Group Maker
      </h2>

      <div className="w-full bg-white p-6 rounded-2xl shadow-sm border space-y-6">
        <div className="flex flex-col sm:flex-row gap-6 justify-between items-center">

          <div className="w-full sm:w-auto">
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Class</label>
            <select
              value={selectedClassId}
              onChange={(e) => {
                setSelectedClassId(e.target.value);
                setGroups([]);
              }}
              className="w-full p-3 border-2 border-gray-200 rounded-xl bg-gray-50 focus:border-primary focus:bg-white"
              disabled={isGenerating}
            >
              {settings.classes.map(c => (
                <option key={c.id} value={c.id}>{c.name} ({c.students.length})</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 items-center w-full sm:w-auto">
            <div className="flex bg-gray-100 p-1 rounded-xl">
              <button
                onClick={() => setMode('numberOfGroups')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  mode === 'numberOfGroups' ? 'bg-white shadow-sm text-primary' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Number of Groups
              </button>
              <button
                onClick={() => setMode('studentsPerGroup')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  mode === 'studentsPerGroup' ? 'bg-white shadow-sm text-primary' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Students per Group
              </button>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                max={students.length}
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                className="w-20 p-2 border-2 border-gray-200 rounded-lg text-center text-lg font-bold focus:border-primary focus:ring-0"
              />
            </div>
          </div>

          <button
            onClick={generateGroups}
            disabled={isGenerating}
            className="w-full sm:w-auto px-8 py-3 bg-primary text-white font-bold rounded-xl shadow-lg hover:bg-primary/90 hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2"
          >
            <Shuffle size={20} />
            Generate
          </button>
        </div>
      </div>

      <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <AnimatePresence>
          {groups.map((group, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-2xl shadow-md border-2 border-transparent hover:border-primary/30 overflow-hidden"
            >
              <div className="bg-primary/10 text-primary font-bold px-4 py-3 border-b flex justify-between items-center">
                <span>Group {index + 1}</span>
                <span className="text-sm bg-white px-2 py-1 rounded-md shadow-sm">{group.length}</span>
              </div>
              <ul className="p-4 space-y-2">
                {group.map((student, sIndex) => (
                  <li key={sIndex} className="flex items-center gap-2 text-gray-700 font-medium">
                    <div className="w-2 h-2 rounded-full bg-accent" />
                    {student}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {groups.length === 0 && !isGenerating && (
        <div className="text-gray-400 italic text-lg py-12">
          Click generate to create groups!
        </div>
      )}
    </div>
  );
};
