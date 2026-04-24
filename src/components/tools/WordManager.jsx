import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, Calendar, Plus, Check, ChevronRight, 
  Search, Library, Download, Filter, List,
  Pencil, Trash2, RotateCcw, XCircle, Undo2
} from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';
import { audioEngine } from '../../utils/audio';
import { ToolHeader } from '../ToolHeader';
import { RECOMMENDED_DATA, YEAR_LEVELS } from '../../data/wordLists';

export const WordManager = () => {
  const [selectedYear, setSelectedYear] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [myLists, setMyLists] = useState([]);
  const [successMessage, setSuccessMessage] = useState(null);
  const [editedCurriculum, setEditedCurriculum] = useState({});
  const [hiddenCurriculum, setHiddenCurriculum] = useState([]);
  const [editingList, setEditingList] = useState(null);
  
  const { settings } = useSettings();

  useEffect(() => {
    const saved = localStorage.getItem('spelling_lists');
    if (saved) {
      setMyLists(JSON.parse(saved));
    }
    const savedEdited = localStorage.getItem('teacher_tools_edited_curriculum');
    if (savedEdited) setEditedCurriculum(JSON.parse(savedEdited));
    const savedHidden = localStorage.getItem('teacher_tools_hidden_curriculum');
    if (savedHidden) setHiddenCurriculum(JSON.parse(savedHidden));
  }, []);

  const saveEditedCurriculum = (newEdited) => {
    setEditedCurriculum(newEdited);
    localStorage.setItem('teacher_tools_edited_curriculum', JSON.stringify(newEdited));
  };
  
  const saveHiddenCurriculum = (newHidden) => {
    setHiddenCurriculum(newHidden);
    localStorage.setItem('teacher_tools_hidden_curriculum', JSON.stringify(newHidden));
  };

  const handleEditClick = (list, isCurriculum) => {
    setEditingList({
      id: list.id,
      name: list.name,
      words: list.words.join(', '),
      isCurriculum
    });
  };

  const handleSaveEdit = () => {
    if (!editingList.name.trim() || !editingList.words.trim()) return;
    
    const wordsArray = editingList.words.split(',').map(w => w.trim()).filter(w => w);
    
    if (editingList.isCurriculum) {
      const newEdited = { ...editedCurriculum, [editingList.id]: { name: editingList.name, words: wordsArray } };
      saveEditedCurriculum(newEdited);
      setSuccessMessage('Curriculum list updated');
    } else {
      const newMyLists = myLists.map(l => l.id === editingList.id ? { ...l, name: editingList.name, words: wordsArray } : l);
      setMyLists(newMyLists);
      localStorage.setItem('spelling_lists', JSON.stringify(newMyLists));
      setSuccessMessage('Saved list updated');
    }
    setEditingList(null);
    audioEngine.playTick(settings.soundTheme);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleDeleteCustom = (id) => {
    if(window.confirm('Are you sure you want to delete this custom list?')) {
      const newMyLists = myLists.filter(l => l.id !== id);
      setMyLists(newMyLists);
      localStorage.setItem('spelling_lists', JSON.stringify(newMyLists));
    }
  };

  const handleToggleHideCurriculum = (id) => {
    if (hiddenCurriculum.includes(id)) {
      saveHiddenCurriculum(hiddenCurriculum.filter(hiddenId => hiddenId !== id));
    } else {
      saveHiddenCurriculum([...hiddenCurriculum, id]);
    }
  };

  const handleResetCurriculum = (id) => {
    if(window.confirm('Are you sure you want to restore this curriculum list to its original state?')) {
      const newEdited = { ...editedCurriculum };
      delete newEdited[id];
      saveEditedCurriculum(newEdited);
      saveHiddenCurriculum(hiddenCurriculum.filter(hiddenId => hiddenId !== id));
    }
  };

  const addToList = (list) => {
    const newList = {
      id: Date.now().toString() + Math.random(),
      name: list.name,
      words: list.words
    };
    
    const updated = [...myLists, newList];
    setMyLists(updated);
    localStorage.setItem('spelling_lists', JSON.stringify(updated));
    
    setSuccessMessage(`Added "${list.name}"!`);
    audioEngine.playTick(settings.soundTheme);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const importAll = () => {
    if (selectedYear === 'saved') return;
    
    const yearLists = RECOMMENDED_DATA[selectedYear]
      .filter(list => !hiddenCurriculum.includes(list.id))
      .map(list => {
        const override = editedCurriculum[list.id];
        return {
          id: Date.now().toString() + Math.random(),
          name: override ? override.name : list.name,
          words: override ? override.words : list.words
        };
      });
    
    const updated = [...myLists, ...yearLists];
    setMyLists(updated);
    localStorage.setItem('spelling_lists', JSON.stringify(updated));
    
    setSuccessMessage(`Imported all Year ${selectedYear}!`);
    audioEngine.playTick(settings.soundTheme);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const currentData = selectedYear === 'saved' ? myLists : RECOMMENDED_DATA[selectedYear].map(list => {
    if (editedCurriculum[list.id]) {
      return { ...list, name: editedCurriculum[list.id].name, words: editedCurriculum[list.id].words, isEdited: true };
    }
    return list;
  });

  const filteredWeeks = currentData.filter(w => 
    w.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.words.join(' ').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-full mx-auto px-4 pt-2 pb-8 h-full flex flex-col gap-4 overflow-hidden">
      <ToolHeader
        title="Word Manager"
        icon={Library}
        description="Curriculum Word List Explorer"
        infoContent={
          <>
            <p>
              <strong className="text-white block mb-1">Curriculum Lists</strong>
              Browse and import standardized word lists tailored to different year levels. These lists can be used in other tools like the Spelling test and Word Cloud.
            </p>
            <p>
              <strong className="text-white block mb-1">Quick Search</strong>
              Find specific words or spelling patterns across all weeks in a year level. Click the plus icon to save a list to your personal collection.
            </p>
          </>
        }
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input
              type="text"
              placeholder="Search words..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-100 rounded-xl focus:border-indigo-500 outline-none w-40 text-xs transition-all"
            />
          </div>
          {selectedYear !== 'saved' && (
            <button
              onClick={importAll}
              className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-wider hover:bg-black transition-all active:scale-95 shadow-md"
            >
              <Download size={14} /> IMPORT YEAR {selectedYear}
            </button>
          )}
        </div>
      </ToolHeader>

      <div className="flex-1 flex gap-4 min-h-0 overflow-hidden">
        {/* Sidebar - Compact Year Selector */}
        <div className="w-48 shrink-0 flex flex-col gap-4 min-h-0">
          <div className="bg-white p-4 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col min-h-0 overflow-hidden">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 shrink-0">
              Year Level
            </h3>
            <div className="grid grid-cols-2 gap-2 overflow-y-auto pr-1 custom-scrollbar">
              {YEAR_LEVELS.map(year => (
                <button
                  key={year}
                  onClick={() => setSelectedYear(year)}
                  className={`aspect-square rounded-xl text-xs font-black transition-all border-2 ${
                    selectedYear === year 
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' 
                      : 'bg-slate-50 text-slate-500 border-transparent hover:bg-slate-100'
                  }`}
                >
                  {year}
                </button>
              ))}
            </div>
            <button
              onClick={() => setSelectedYear('saved')}
              className={`mt-4 w-full py-2 rounded-xl text-xs font-black transition-all border-2 flex items-center justify-center gap-2 ${
                selectedYear === 'saved'
                  ? 'bg-amber-500 text-white border-amber-500 shadow-md'
                  : 'bg-amber-50 text-amber-600 border-amber-100 hover:bg-amber-100'
              }`}
            >
              <Library size={14} /> My Saved Lists
            </button>
          </div>
          
          <div className="p-4 bg-indigo-50 rounded-[1.5rem] border border-indigo-100 shrink-0">
            <h4 className="font-black text-indigo-600 text-[10px] uppercase tracking-widest mb-1">Status</h4>
            <p className="text-indigo-400 text-[11px] font-bold">
              <span className="text-indigo-700">{myLists.length}</span> saved lists
            </p>
          </div>

          <AnimatePresence>
            {successMessage && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="bg-emerald-500 text-white p-3 rounded-xl text-[10px] font-black shadow-lg"
              >
                {successMessage}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Main Content - Very Condensed Table */}
        <div className="flex-1 bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="flex-1 overflow-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur-md">
                <tr className="border-b border-slate-100">
                  <th className="pl-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest w-16">{selectedYear === 'saved' ? 'ID' : 'Wk'}</th>
                  <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest w-48">List Name</th>
                  <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Words</th>
                  <th className="pr-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right w-32">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredWeeks.map((week, idx) => {
                  const isCurriculumView = selectedYear !== 'saved';
                  const isAlreadyAdded = myLists.some(l => l.name === week.name);
                  const isHidden = isCurriculumView && hiddenCurriculum.includes(week.id);
                  const isEdited = isCurriculumView && week.isEdited;
                  
                  return (
                    <tr 
                      key={week.id} 
                      className={`group transition-colors ${
                        isHidden ? 'opacity-40 grayscale bg-slate-50' :
                        isEdited ? 'bg-amber-50/40 hover:bg-amber-50/80' :
                        idx % 2 === 0 ? 'bg-white hover:bg-slate-50' : 'bg-slate-50/20 hover:bg-slate-50/80'
                      }`}
                    >
                      <td className="pl-6 py-2">
                        <span className="text-[11px] font-black text-slate-400 group-hover:text-indigo-600">
                          {selectedYear === 'saved' ? idx + 1 : week.week}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-1.5 h-1.5 rounded-full transition-colors shrink-0 ${isEdited ? 'bg-amber-400' : 'bg-slate-200 group-hover:bg-indigo-400'}`} />
                          <div className="flex flex-col">
                            <span className="text-xs font-black text-slate-700 leading-tight">
                              {week.name.split('(')[0].trim()}
                            </span>
                            {week.name.includes('(') && (
                              <span className="text-[10px] font-bold text-slate-400 leading-tight">
                                ({week.name.slice(week.name.indexOf('(') + 1)}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex flex-wrap gap-1.5">
                          {week.words.map((word, i) => (
                            <span 
                              key={i} 
                              className={`text-[10px] font-bold text-slate-500 px-2 py-0.5 rounded-md border border-transparent transition-all ${
                                isHidden ? 'line-through bg-slate-100' : 'bg-slate-100/50 group-hover:border-slate-200'
                              }`}
                            >
                              {word}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="pr-6 py-2 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {isCurriculumView ? (
                            <>
                              {(isEdited || isHidden) && (
                                <button
                                  onClick={() => handleResetCurriculum(week.id)}
                                  title="Reset to Original"
                                  className="p-1.5 text-amber-500 hover:text-white hover:bg-amber-500 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                >
                                  <RotateCcw size={14} />
                                </button>
                              )}
                              
                              <button
                                onClick={() => handleToggleHideCurriculum(week.id)}
                                title={isHidden ? "Restore List" : "Remove List"}
                                className={`p-1.5 rounded-lg transition-all opacity-0 group-hover:opacity-100 ${
                                  isHidden ? 'text-emerald-500 hover:bg-emerald-50' : 'text-slate-400 hover:text-rose-500 hover:bg-rose-50'
                                }`}
                              >
                                {isHidden ? <Undo2 size={14} /> : <XCircle size={14} />}
                              </button>
                              
                              <button
                                onClick={() => handleEditClick(week, true)}
                                title="Edit List"
                                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                              >
                                <Pencil size={14} />
                              </button>
                              
                              <button
                                onClick={() => addToList(week)}
                                disabled={isAlreadyAdded || isHidden}
                                title="Save to My Lists"
                                className={`p-1.5 rounded-lg transition-all ${
                                  isAlreadyAdded 
                                    ? 'text-emerald-500 bg-emerald-50 opacity-100' 
                                    : 'text-indigo-600 hover:bg-indigo-600 hover:text-white opacity-0 group-hover:opacity-100'
                                } disabled:opacity-50`}
                              >
                                {isAlreadyAdded ? <Check size={14} /> : <Plus size={14} />}
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => handleDeleteCustom(week.id)}
                                title="Delete List"
                                className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                              >
                                <Trash2 size={14} />
                              </button>
                              <button
                                onClick={() => handleEditClick(week, false)}
                                title="Edit List"
                                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                              >
                                <Pencil size={14} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            {filteredWeeks.length === 0 && (
              <div className="flex flex-col items-center justify-center p-12 text-center text-slate-300 gap-2 opacity-50">
                <Search size={32} />
                <p className="font-black text-sm uppercase tracking-widest">No results</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Editor Modal */}
      <AnimatePresence>
        {editingList && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[2rem] shadow-2xl border border-slate-100 p-6 w-full max-w-lg flex flex-col gap-4"
            >
              <h3 className="text-lg font-black text-slate-800 tracking-tight">Edit Word List</h3>
              
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">List Name</label>
                <input
                  type="text"
                  value={editingList.name}
                  onChange={(e) => setEditingList({...editingList, name: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-700 outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Words (comma separated)</label>
                <textarea
                  value={editingList.words}
                  onChange={(e) => setEditingList({...editingList, words: e.target.value})}
                  rows={6}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-600 outline-none focus:border-indigo-500 transition-colors resize-none"
                  placeholder="cat, dog, bat..."
                />
              </div>

              <div className="flex justify-end gap-3 mt-4">
                <button
                  onClick={() => setEditingList(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="px-6 py-2 rounded-xl text-xs font-black text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-200"
                >
                  Save Changes
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
