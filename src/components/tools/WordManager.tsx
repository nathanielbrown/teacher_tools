import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Check, Search, Download,
  Pencil, Trash2, RotateCcw, GraduationCap, Archive, Eye, EyeOff,
  X,
  Volume2,
  BookOpen
} from 'lucide-react';
import { ToolPanel } from '../shared/ToolPanel';
import { useSettings } from '../../contexts/SettingsContext';
import { useHeader } from '../../contexts/HeaderContext';
import { audioEngine } from '../../utils/audio';
import { RECOMMENDED_DATA, YEAR_LEVELS } from '../../data/wordLists';
import { storage } from '../../utils/storage';

// 1. Constants (None)

// 2. Config (None)

// 3. Text (Help and Info)
const HELP_INFO = (
  <div className="space-y-4 font-['Outfit']">
    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">How to Use</h3>
    <div className="space-y-3">
      <div className="flex gap-2 text-left">
        <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center text-xs font-black text-indigo-600 shrink-0">1</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">Pick a <b>Year Level</b> to see word lists.</p>
      </div>
      <div className="flex gap-2 text-left">
        <div className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center text-xs font-black text-blue-600 shrink-0">2</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">Click <b>Add</b> to save a list to your archive.</p>
      </div>
      <div className="flex gap-2 text-left">
        <div className="w-6 h-6 rounded-lg bg-emerald-50 flex items-center justify-center text-xs font-black text-emerald-600 shrink-0">3</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">Use <b>Edit</b> to change the words in a list.</p>
      </div>
    </div>
  </div>
);

// 4. Local Storage (Handled in component)

// 5. Classes (None)

// 6. Functions (None)

// 7. Component
export const WordManager = ({ preActions }: { preActions?: React.ReactNode }) => {
  const { setHeaderActions, setHelpContent, clearHeader } = useHeader();
  const { settings } = useSettings();
  
  const [selectedYear, setSelectedYear] = useState<number | string>(1);
  const [myLists, setMyLists] = useState(() => {
    const saved = storage.getItem('spelling_lists');
    return saved ? JSON.parse(saved) : [];
  });
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [editedCurriculum, setEditedCurriculum] = useState(() => {
    const saved = storage.getItem('teacher_tools_edited_curriculum');
    return saved ? JSON.parse(saved) : {};
  });
  const [hiddenCurriculum, setHiddenCurriculum] = useState(() => {
    const saved = storage.getItem('teacher_tools_hidden_curriculum');
    return saved ? JSON.parse(saved) : [];
  });
  const [editingList, setEditingList] = useState<any>(null);

  const saveEditedCurriculum = (newEdited: any) => {
    setEditedCurriculum(newEdited);
    storage.setItem('teacher_tools_edited_curriculum', JSON.stringify(newEdited));
  };
  
  const saveHiddenCurriculum = (newHidden: string[]) => {
    setHiddenCurriculum(newHidden);
    storage.setItem('teacher_tools_hidden_curriculum', JSON.stringify(newHidden));
  };

  useEffect(() => {
    setHelpContent(HELP_INFO);
    return () => clearHeader();
  }, [clearHeader, setHelpContent]);

  const handleEditClick = (list: any, isCurriculum: boolean) => {
    setEditingList({
      id: list.id,
      name: list.name,
      words: list.words.join(', '),
      isCurriculum
    });
  };

  const handleSaveEdit = () => {
    if (!editingList.name.trim() || !editingList.words.trim()) return;
    
    const wordsArray = editingList.words.split(',').map((w: string) => w.trim()).filter((w: string) => w);
    
    if (editingList.isCurriculum) {
      const newEdited = { ...editedCurriculum, [editingList.id]: { name: editingList.name, words: wordsArray } };
      saveEditedCurriculum(newEdited);
      setSuccessMessage('Curriculum list updated');
    } else if (editingList.isNew) {
      const newMyLists = [...myLists, { id: editingList.id, name: editingList.name, words: wordsArray }];
      setMyLists(newMyLists);
      storage.setItem('spelling_lists', JSON.stringify(newMyLists));
      setSuccessMessage('New list created');
      setSelectedYear('saved');
    } else {
      const newMyLists = myLists.map((l: any) => l.id === editingList.id ? { ...l, name: editingList.name, words: wordsArray } : l);
      setMyLists(newMyLists);
      storage.setItem('spelling_lists', JSON.stringify(newMyLists));
      setSuccessMessage('Saved list updated');
    }
    setEditingList(null);
    audioEngine.playTick(settings.soundTheme);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleCreateList = () => {
    setEditingList({
      id: Date.now().toString() + Math.random(),
      name: '',
      words: '',
      isCurriculum: false,
      isNew: true
    });
  };

  const handleDeleteCustom = (id: string) => {
    if(window.confirm('Are you sure you want to delete this custom list?')) {
      const newMyLists = myLists.filter((l: any) => l.id !== id);
      setMyLists(newMyLists);
      storage.setItem('spelling_lists', JSON.stringify(newMyLists));
    }
  };

  const handleToggleHideCurriculum = (id: string) => {
    if (hiddenCurriculum.includes(id)) {
      saveHiddenCurriculum(hiddenCurriculum.filter((hiddenId: string) => hiddenId !== id));
    } else {
      saveHiddenCurriculum([...hiddenCurriculum, id]);
    }
  };

  const handleResetCurriculum = (id: string) => {
    if(window.confirm('Are you sure you want to restore this list to its original state?')) {
      const newEdited = { ...editedCurriculum };
      delete newEdited[id];
      saveEditedCurriculum(newEdited);
      saveHiddenCurriculum(hiddenCurriculum.filter((hiddenId: string) => hiddenId !== id));
    }
  };

  const addToList = (list: any) => {
    const newList = {
      id: Date.now().toString() + Math.random(),
      name: list.name,
      words: list.words
    };
    
    const updated = [...myLists, newList];
    setMyLists(updated);
    storage.setItem('spelling_lists', JSON.stringify(updated));
    
    setSuccessMessage(`Added "${list.name}"!`);
    audioEngine.playTick(settings.soundTheme);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  useEffect(() => {
    setHeaderActions(
      <div className="flex items-center gap-4 italic">
        {preActions}
        <button
          onClick={() => { handleCreateList(); audioEngine.playTick(settings.soundTheme); }}
          className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-900 transition-all active:scale-95 border-2 border-white/5"
        >
          <Plus size={14} strokeWidth={3} /> Create List
        </button>
        {selectedYear !== 'saved' && (
          <button
            onClick={() => { 
              const yearLists = RECOMMENDED_DATA[selectedYear as number]
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
              storage.setItem('spelling_lists', JSON.stringify(updated));
              setSuccessMessage(`Imported Year ${selectedYear}!`);
              audioEngine.playTick(settings.soundTheme);
              setTimeout(() => setSuccessMessage(null), 3000);
            }}
            className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-900 transition-all active:scale-95 border-2 border-white/5"
          >
            <Download size={14} strokeWidth={3} /> Bulk Import
          </button>
        )}
      </div>
    );
  }, [selectedYear, myLists, hiddenCurriculum, editedCurriculum, setHeaderActions, settings.soundTheme, preActions]);

  const currentData = selectedYear === 'saved' ? myLists : RECOMMENDED_DATA[selectedYear as number].map(list => {
    if (editedCurriculum[list.id]) {
      return { ...list, name: editedCurriculum[list.id].name, words: editedCurriculum[list.id].words, isEdited: true };
    }
    return list;
  });

  return (
    <ToolPanel className="flex-row gap-8 p-4 lg:p-12 italic">
      {/* Navigation Sidebar */}
      <div className="w-full lg:w-[450px] shrink-0 flex flex-col gap-8 relative z-20 h-full">
        <div className="bg-slate-50 p-6 rounded-[2rem] border-4 border-white flex flex-col gap-6 relative overflow-hidden shrink-0 h-full">
           <div className="flex items-center gap-4 relative z-10">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
                 <GraduationCap size={20} strokeWidth={3} />
              </div>
              <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">Word Lists</h4>
           </div>

           <div className="space-y-2 relative z-10 flex-1 overflow-y-auto no-scrollbar pr-2">
             <span className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.4em] ml-1">Grade Lists</span>
             <div className="flex flex-col gap-1">
               {YEAR_LEVELS.map(year => (
                 <button
                   key={year}
                   onClick={() => { setSelectedYear(year); audioEngine.playTick(settings.soundTheme); }}
                   className={`w-full h-12 rounded-xl border-2 flex items-center justify-between px-4 transition-all ${
                     selectedYear === year 
                       ? 'bg-indigo-600 border-indigo-400 text-white' 
                       : 'bg-white border-transparent text-slate-600 hover:bg-slate-100'
                   }`}
                 >
                   <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-black ${selectedYear === year ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-500'}`}>
                        {year}
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-[0.2em]">Year {year}</span>
                   </div>
                   {selectedYear === year && <Check size={14} strokeWidth={4} />}
                 </button>
               ))}
             </div>
           </div>

           <button
             onClick={() => { setSelectedYear('saved'); audioEngine.playTick(settings.soundTheme); }}
             className={`w-full h-16 rounded-xl border-4 transition-all flex flex-row items-center justify-center gap-4 relative z-10 mt-auto ${
               selectedYear === 'saved'
                 ? 'bg-indigo-50 text-indigo-600 border-indigo-200'
                 : 'bg-white text-slate-500 border-white hover:bg-slate-100'
             }`}
           >
             <Archive size={20} strokeWidth={3} />
             <div className="flex flex-col items-start leading-none">
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">My Archive</span>
                <span className="text-[8px] font-black opacity-60 uppercase mt-1">{myLists.length} lists</span>
             </div>
           </button>
        </div>


        <AnimatePresence>
          {successMessage && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="px-10 py-5 bg-emerald-500 rounded-[2.5rem] text-[10px] font-black text-white text-center border-4 border-white uppercase tracking-[0.2em] relative z-20"
            >
              {successMessage}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col bg-slate-50/50 rounded-[4rem] border-4 border-white relative overflow-hidden group h-full">
         <div className="tool-grid-bg opacity-20 pointer-events-none" />
         
         <div className="flex-1 overflow-auto no-scrollbar relative z-10">
            <table className="w-full text-left border-separate border-spacing-0">
               <thead className="sticky top-0 z-20">
                  <tr className="bg-white/80 backdrop-blur-md border-b-4 border-white">
                     <th className="pl-6 py-3 text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] w-24">#</th>
                     <th className="px-4 py-3 text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">Name</th>
                     <th className="px-4 py-3 text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">Words</th>
                     <th className="pr-6 py-3 text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] text-right">Actions</th>
                  </tr>
               </thead>
               <tbody className="divide-y-4 divide-white">
                  {currentData.map((item: any, idx: number) => {
                    const isCurriculumView = selectedYear !== 'saved';
                    const isAlreadyAdded = myLists.some((l: any) => l.name === item.name);
                    const isHidden = isCurriculumView && hiddenCurriculum.includes(item.id);
                    const isEdited = isCurriculumView && item.isEdited;
                    
                    return (
                      <tr key={item.id} className={`group transition-all hover:bg-white ${isHidden ? 'opacity-30 grayscale' : ''}`}>
                        <td className="pl-6 py-3">
                          <span className="text-xs font-black text-slate-200 tabular-nums">
                            {(idx + 1).toString().padStart(2, '0')}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-1">
                            <span className="text-sm font-black text-slate-800 group-hover:text-indigo-600 transition-colors uppercase tracking-tight italic leading-none">
                              {item.name}
                            </span>
                            {isEdited && (
                              <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest italic opacity-60">Custom List</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {item.words.map((word: string, i: number) => (
                              <span key={i} className="px-2 py-1 bg-white border-2 border-slate-100 rounded-xl text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                {word}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="pr-6 py-3 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                            {isCurriculumView ? (
                              <>
                                {(isEdited || isHidden) && (
                                  <button onClick={() => handleResetCurriculum(item.id)} className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-amber-500 bg-white rounded-xl border-2 border-slate-50 transition-all" title="Reset">
                                    <RotateCcw size={16} strokeWidth={3} />
                                  </button>
                                )}
                                <button onClick={() => handleToggleHideCurriculum(item.id)} className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-rose-500 bg-white rounded-xl border-2 border-slate-50 transition-all" title={isHidden ? "Show" : "Hide"}>
                                  {isHidden ? <Eye size={16} strokeWidth={3} /> : <EyeOff size={16} strokeWidth={3} />}
                                </button>
                                <button onClick={() => handleEditClick(item, true)} className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-indigo-600 bg-white rounded-xl border-2 border-slate-50 transition-all" title="Edit">
                                  <Pencil size={16} strokeWidth={3} />
                                </button>
                                <button onClick={() => addToList(item)} disabled={isAlreadyAdded || isHidden} className={`w-8 h-8 flex items-center justify-center rounded-xl transition-all ${isAlreadyAdded ? 'bg-emerald-500 text-white' : 'bg-slate-900 text-white hover:bg-indigo-600'} disabled:opacity-30`} title="Add">
                                  {isAlreadyAdded ? <Check size={16} strokeWidth={4} /> : <Plus size={16} strokeWidth={4} />}
                                </button>
                              </>
                            ) : (
                              <>
                                <button onClick={() => handleEditClick(item, false)} className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-indigo-600 bg-white rounded-xl border-2 border-slate-50 transition-all" title="Edit">
                                  <Pencil size={16} strokeWidth={3} />
                                </button>
                                <button onClick={() => handleDeleteCustom(item.id)} className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-rose-500 bg-white rounded-xl border-2 border-slate-50 transition-all" title="Delete">
                                  <Trash2 size={16} strokeWidth={3} />
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
            
            {currentData.length === 0 && (
              <div className="flex flex-col items-center justify-center p-40 text-center gap-8">
                <div className="w-24 h-24 bg-white rounded-[2.5rem] flex items-center justify-center border-4 border-slate-50">
                  <Archive size={40} className="text-slate-100" />
                </div>
                <div className="space-y-2">
                   <p className="text-xl font-black text-slate-300 uppercase tracking-[0.4em] italic">Empty</p>
                   <p className="text-[10px] font-black text-slate-200 uppercase tracking-widest">No lists found in your archive</p>
                </div>
              </div>
            )}
         </div>
      </div>
      
      {/* Editor Modal */}
      <AnimatePresence>
        {editingList && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/60 backdrop-blur-xl italic">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 40 }}
              className="bg-white rounded-[4rem] p-16 w-full max-w-2xl flex flex-col gap-10 relative overflow-hidden border-8 border-white"
            >
              <div className="absolute top-0 left-0 w-full h-3 bg-indigo-600" />
              <div className="tool-grid-bg opacity-10 pointer-events-none" />
              
              <div className="flex justify-between items-start relative z-10">
                 <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-[1.5rem] bg-indigo-600 flex items-center justify-center text-white">
                       <Pencil size={32} strokeWidth={3} />
                    </div>
                    <div className="flex flex-col">
                       <h3 className="text-3xl font-black text-slate-800 tracking-tight uppercase leading-none">{editingList?.isNew ? 'Create List' : 'Edit List'}</h3>
                       <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] mt-3">{editingList?.isNew ? 'Add your own words' : 'Changing words'}</span>
                    </div>
                 </div>
                 <button onClick={() => setEditingList(null)} className="w-12 h-12 flex items-center justify-center text-slate-300 hover:text-slate-900 transition-colors bg-slate-50 rounded-2xl">
                    <X size={28} strokeWidth={3} />
                 </button>
              </div>
              
              <div className="space-y-8 relative z-10">
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] ml-2">Name</label>
                  <input
                    type="text"
                    value={editingList.name}
                    onChange={(e) => setEditingList({...editingList, name: e.target.value})}
                    className="w-full h-20 px-4 bg-slate-50 border-4 border-transparent rounded-[1.5rem] text-sm font-black text-slate-800 outline-none focus:bg-white focus:border-indigo-100 transition-all uppercase tracking-widest"
                    placeholder="e.g., Spelling Week 1"
                  />
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] ml-2">Words (comma separated)</label>
                  <textarea
                    value={editingList.words}
                    onChange={(e) => setEditingList({...editingList, words: e.target.value})}
                    rows={6}
                    className="w-full bg-slate-50 border-4 border-transparent rounded-[2.5rem] p-10 text-xl font-black text-slate-600 outline-none focus:bg-white focus:border-indigo-100 transition-all resize-none no-scrollbar italic leading-relaxed"
                    placeholder="apple, banana, cherry..."
                  />
                </div>
              </div>

              <div className="flex gap-4 relative z-10">
                <button
                  onClick={() => setEditingList(null)}
                  className="flex-1 h-20 rounded-[2rem] text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="flex-1 h-20 bg-slate-900 text-white rounded-[2rem] text-sm font-black uppercase tracking-[0.3em] hover:bg-indigo-600 transition-all active:scale-95 border-8 border-white/5"
                >
                  Save
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </ToolPanel>
  );
};

export default WordManager;
