import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Check,
  Pencil, Trash2, GraduationCap, Archive,
  X
} from 'lucide-react';
import { ToolPanel } from '../shared/ToolPanel';
import { useSettings } from '../../contexts/SettingsContext';
import { useHeader } from '../../contexts/HeaderContext';
import { audioEngine } from '../../utils/audio';
import { RECOMMENDED_DATA, YEAR_LEVELS } from '../../data/wordLists';
import { useLocalStorage } from '../../hooks/useLocalStorage';

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
        <p className="text-sm text-slate-600 font-medium leading-tight">Click <b>Add</b> to save a list to your lists.</p>
      </div>
      <div className="flex gap-2 text-left">
        <div className="w-6 h-6 rounded-lg bg-emerald-50 flex items-center justify-center text-xs font-black text-emerald-600 shrink-0">3</div>
        <p className="text-sm text-slate-600 font-medium leading-tight"><b>Modify</b> lists in your lists to suit your needs.</p>
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
  const [myLists, setMyLists] = useLocalStorage<any[]>('word_manager_lists', []);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [editingList, setEditingList] = useState<any>(null);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
    
    if (editingList.isNew) {
      const newMyLists = [...myLists, { id: editingList.id, name: editingList.name, words: wordsArray, sourceWords: wordsArray }];
      setMyLists(newMyLists);
      setSuccessMessage('New list created');
      setSelectedYear('saved');
    } else {
      const newMyLists = myLists.map((l: any) => l.id === editingList.id ? { ...l, name: editingList.name, words: wordsArray } : l);
      setMyLists(newMyLists);
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
    }
  };



  const addToList = (list: any) => {
    const newList = {
      id: Date.now().toString() + Math.random(),
      name: list.name,
      words: list.words,
      sourceWords: list.words // Keep original words for diffing
    };
    
    const updated = [...myLists, newList];
    setMyLists(updated);
    
    setSuccessMessage(`Added "${list.name}"!`);
    audioEngine.playTick(settings.soundTheme);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  useEffect(() => {
    setHeaderActions(
      <div className="flex items-center gap-4 italic">
        {preActions}
      </div>
    );
  }, [selectedYear, myLists, setHeaderActions, settings.soundTheme, preActions]);

  const currentData = selectedYear === 'saved' ? myLists : RECOMMENDED_DATA[selectedYear as number];

  return (
    <ToolPanel className="italic" baseWidth={windowWidth < 1024 ? 600 : 1200} baseHeight={800}>
      <div className="flex flex-col lg:flex-row gap-8 w-full h-full p-4 lg:py-6 lg:px-12">
        {/* Navigation Sidebar */}
        <div className="w-full lg:w-[280px] shrink-0 flex flex-col gap-8 relative z-20 lg:h-full">
          <div className="bg-slate-50 p-6 rounded-[2rem] border-4 border-white flex flex-col gap-6 relative overflow-visible lg:overflow-hidden shrink-0 lg:h-full">
             <div className="flex items-center justify-between lg:justify-start gap-4 relative z-10">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white shrink-0">
                     <GraduationCap size={20} strokeWidth={3} />
                  </div>
                  <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">Word Lists</h4>
                </div>

                {/* Mobile Dropdown */}
                <div className="lg:hidden relative flex-1 max-w-[200px]">
                  <select
                    value={selectedYear.toString()}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === 'create_new') {
                        handleCreateList();
                        audioEngine.playTick(settings.soundTheme);
                      } else {
                        setSelectedYear(val === 'saved' ? 'saved' : parseInt(val));
                        audioEngine.playTick(settings.soundTheme);
                      }
                    }}
                    className="appearance-none w-full bg-white pl-4 pr-10 py-2.5 rounded-xl border-2 border-slate-100 text-slate-700 font-black text-[10px] uppercase tracking-widest outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <optgroup label="Grade Lists">
                      {YEAR_LEVELS.map(year => (
                        <option key={year} value={year.toString()}>
                          Year {year}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="My Lists">
                      <option value="create_new">Create New</option>
                      <option value="saved">My Lists</option>
                    </optgroup>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                  </div>
                </div>
             </div>

             {/* Desktop Navigation */}
             <div className="hidden lg:flex flex-col gap-6 flex-1 overflow-hidden">

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
               onClick={() => { handleCreateList(); audioEngine.playTick(settings.soundTheme); }}
               className="w-full h-16 rounded-xl border-4 border-white bg-white text-slate-500 hover:bg-slate-100 transition-all flex flex-row items-center justify-center gap-4 relative z-10 mt-auto mb-2"
             >
               <Plus size={20} strokeWidth={3} />
               <div className="flex flex-col items-start leading-none">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">My Lists</span>
                  <span className="text-[8px] font-black opacity-60 uppercase mt-1">Create New</span>
               </div>
             </button>

             <button
               onClick={() => { setSelectedYear('saved'); audioEngine.playTick(settings.soundTheme); }}
               className={`w-full h-16 rounded-xl border-4 transition-all flex flex-row items-center justify-center gap-4 relative z-10 ${
                 selectedYear === 'saved'
                   ? 'bg-indigo-50 text-indigo-600 border-indigo-200'
                   : 'bg-white text-slate-500 border-white hover:bg-slate-100'
               }`}
             >
               <Archive size={20} strokeWidth={3} />
               <div className="flex flex-col items-start leading-none">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">My Lists</span>
                  <span className="text-[8px] font-black opacity-60 uppercase mt-1">{myLists.length} lists</span>
               </div>
             </button>
             </div>
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
        <div className="flex-1 flex flex-col bg-slate-50/50 rounded-[2rem] border-4 border-white relative overflow-hidden group h-full">
           <div className="tool-grid-bg opacity-20 pointer-events-none" />
           
            <div className="flex-1 overflow-auto no-scrollbar relative z-10 rounded-[2rem]">
               <table className="w-full text-left border-separate border-spacing-0">
                  <thead className="sticky top-0 z-20">
                     <tr className="bg-white/80 backdrop-blur-md border-b-4 border-white overflow-hidden rounded-t-[2rem]">
                       <th className="pl-4 py-2 text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] w-12">#</th>
                       <th className="px-4 py-3 text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">Name</th>
                       <th className="px-4 py-3 text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">Words</th>
                       <th className="pr-6 py-3 text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] text-right">Actions</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y-2 divide-white">
                    {currentData.map((item: any, idx: number) => {
                      const isCurriculumView = selectedYear !== 'saved';
                      const isAlreadyAdded = myLists.some((l: any) => l.name === item.name);

                      // For Archive diffing
                      let sourceWords = item.sourceWords;
                      if (!isCurriculumView && !sourceWords) {
                         // Attempt to find original words if sourceWords is missing (legacy data)
                         const flatRecommended = Object.values(RECOMMENDED_DATA).flat() as any[];
                         const match = flatRecommended.find(r => r.name === item.name);
                         if (match) sourceWords = match.words;
                      }

                      return (
                        <tr key={item.id} className="group transition-all hover:bg-white">
                          <td className="pl-4 py-2">
                            <span className="text-xs font-black text-slate-200 tabular-nums">
                              {(idx + 1).toString().padStart(2, '0')}
                            </span>
                          </td>
                          <td className="px-4 py-2">
                            <div className="flex flex-col gap-1">
                              <span className="text-sm font-black text-slate-800 group-hover:text-indigo-600 transition-colors uppercase tracking-tight italic leading-none">
                                {item.name}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-2">
                            <div className="flex flex-wrap gap-1">
                              {/* Show current words + highlighting */}
                              {item.words.map((word: string, i: number) => {
                                const isAdded = !isCurriculumView && sourceWords && !sourceWords.includes(word);
                                return (
                                  <span key={i} className={`px-2 py-1 border-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${
                                    isAdded 
                                      ? 'bg-emerald-50 border-emerald-200 text-emerald-600' 
                                      : 'bg-white border-slate-100 text-slate-400'
                                  }`}>
                                    {word}
                                  </span>
                                );
                              })}
                              
                              {/* Show removed words from source */}
                              {!isCurriculumView && sourceWords && sourceWords.map((word: string, i: number) => {
                                if (!item.words.includes(word)) {
                                  return (
                                    <span key={`rem-${i}`} className="px-2 py-1 bg-rose-50 border-2 border-rose-200 rounded-xl text-[10px] font-black text-rose-400 uppercase tracking-widest line-through">
                                      {word}
                                    </span>
                                  );
                                }
                                return null;
                              })}
                            </div>
                          </td>
                          <td className="pr-6 py-2 text-right">
                            <div className="flex items-center justify-end gap-2 transition-all opacity-100">
                              {isCurriculumView ? (
                                <>
                                  <button onClick={() => addToList(item)} disabled={isAlreadyAdded} className={`w-8 h-8 flex items-center justify-center rounded-xl transition-all ${isAlreadyAdded ? 'bg-emerald-500 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-700'} disabled:opacity-30`} title="Add">
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
                     <p className="text-[10px] font-black text-slate-200 uppercase tracking-widest">No lists found in your lists</p>
                  </div>
                </div>
              )}
           </div>
        </div>
      </div>
      
      {/* Editor Modal */}
      <AnimatePresence>
        {editingList && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 lg:p-6 bg-slate-950/60 backdrop-blur-xl italic">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 40 }}
              className="bg-white rounded-[2.5rem] lg:rounded-[4rem] p-6 lg:p-16 w-full max-h-full lg:h-auto max-w-2xl flex flex-col gap-6 lg:gap-10 relative overflow-hidden border-4 lg:border-8 border-white shadow-2xl"
            >
              <div className="absolute top-0 left-0 w-full h-3 bg-indigo-600" />
              <div className="tool-grid-bg opacity-10 pointer-events-none" />
              
              <div className="flex justify-between items-start relative z-10 shrink-0">
                 <div className="flex items-center gap-4 lg:gap-6">
                    <div className="w-12 h-12 lg:w-16 lg:h-16 rounded-[1.25rem] lg:rounded-[1.5rem] bg-indigo-600 flex items-center justify-center text-white shrink-0">
                       <Pencil size={24} strokeWidth={3} className="lg:w-8 lg:h-8" />
                    </div>
                    <div className="flex flex-col">
                       <h3 className="text-xl lg:text-3xl font-black text-slate-800 tracking-tight uppercase leading-none">{editingList?.isNew ? 'Create List' : 'Edit List'}</h3>
                       <span className="text-[9px] lg:text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] mt-2 lg:mt-3">{editingList?.isNew ? 'Add your own words' : 'Changing words'}</span>
                    </div>
                 </div>
                 <button onClick={() => setEditingList(null)} className="w-10 h-10 lg:w-12 lg:h-12 flex items-center justify-center text-slate-300 hover:text-slate-900 transition-colors bg-slate-50 rounded-xl lg:rounded-2xl shrink-0">
                    <X size={24} strokeWidth={3} />
                 </button>
              </div>
              
              <div className="flex flex-col flex-1 space-y-6 lg:space-y-8 relative z-10 min-h-0">
                <div className="space-y-3 lg:space-y-4 shrink-0">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] ml-2">Name</label>
                  <input
                    type="text"
                    value={editingList.name}
                    onChange={(e) => setEditingList({...editingList, name: e.target.value})}
                    className="w-full h-16 lg:h-20 px-4 bg-slate-50 border-4 border-transparent rounded-2xl lg:rounded-[1.5rem] text-sm font-black text-slate-800 outline-none focus:bg-white focus:border-indigo-100 transition-all uppercase tracking-widest"
                    placeholder="e.g., Spelling Week 1"
                  />
                </div>

                <div className="flex flex-col flex-1 space-y-3 lg:space-y-4 min-h-0">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] ml-2">Words (comma separated)</label>
                  <textarea
                    value={editingList.words}
                    onChange={(e) => setEditingList({...editingList, words: e.target.value})}
                    className="w-full flex-1 bg-slate-50 border-4 border-transparent rounded-[2rem] lg:rounded-[2.5rem] p-6 lg:p-10 text-lg lg:text-xl font-black text-slate-600 outline-none focus:bg-white focus:border-indigo-100 transition-all resize-none no-scrollbar italic leading-relaxed"
                    placeholder="apple, banana, cherry..."
                  />
                </div>
              </div>

              <div className="flex gap-4 relative z-10 shrink-0">
                <button
                  onClick={() => setEditingList(null)}
                  className="flex-1 h-16 lg:h-20 rounded-2xl lg:rounded-[2rem] text-[10px] lg:text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="flex-1 h-16 lg:h-20 bg-indigo-600 text-white rounded-2xl lg:rounded-[2rem] text-[10px] lg:text-sm font-black uppercase tracking-[0.3em] hover:bg-indigo-700 transition-all active:scale-95 border-4 lg:border-8 border-white/5"
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
