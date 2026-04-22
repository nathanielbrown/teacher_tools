import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, Calendar, Plus, Check, ChevronRight, 
  Search, Library, Download, Filter, List
} from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';
import { audioEngine } from '../../utils/audio';
import { RECOMMENDED_DATA, YEAR_LEVELS } from '../../data/wordLists';

export const WordManager = () => {
  const [selectedYear, setSelectedYear] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [myLists, setMyLists] = useState([]);
  const [successMessage, setSuccessMessage] = useState(null);
  
  const { settings } = useSettings();

  useEffect(() => {
    const saved = localStorage.getItem('spelling_lists');
    if (saved) {
      setMyLists(JSON.parse(saved));
    }
  }, []);

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
    const yearLists = RECOMMENDED_DATA[selectedYear].map(list => ({
      id: Date.now().toString() + Math.random(),
      name: list.name,
      words: list.words
    }));
    
    const updated = [...myLists, ...yearLists];
    setMyLists(updated);
    localStorage.setItem('spelling_lists', JSON.stringify(updated));
    
    setSuccessMessage(`Imported all Year ${selectedYear}!`);
    audioEngine.playTick(settings.soundTheme);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const filteredWeeks = RECOMMENDED_DATA[selectedYear].filter(w => 
    w.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.words.join(' ').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-[1400px] mx-auto px-4 py-4 h-full flex flex-col gap-4 overflow-hidden">
      {/* Condensed Header */}
      <div className="bg-white px-6 py-4 rounded-[2rem] border border-slate-200 shadow-sm flex items-center justify-between gap-6 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
            <Library size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight leading-none mb-1">Word Manager</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Year {selectedYear} Curriculum</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl focus:border-indigo-500 outline-none w-48 text-sm transition-all"
            />
          </div>
          <button
            onClick={importAll}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-wider hover:bg-black transition-all active:scale-95"
          >
            <Download size={14} /> Import Year {selectedYear}
          </button>
        </div>
      </div>

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
                  <th className="pl-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest w-16">Wk</th>
                  <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest w-48">List Name</th>
                  <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Words</th>
                  <th className="pr-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right w-20">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredWeeks.map((week, idx) => {
                  const isAlreadyAdded = myLists.some(l => l.name === week.name);
                  
                  return (
                    <tr 
                      key={week.id} 
                      className={`group hover:bg-slate-50 transition-colors ${
                        idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/20'
                      }`}
                    >
                      <td className="pl-6 py-2">
                        <span className="text-[11px] font-black text-slate-400 group-hover:text-indigo-600">
                          {week.week}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-slate-200 group-hover:bg-indigo-400 transition-colors shrink-0" />
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
                              className="text-[10px] font-bold text-slate-500 bg-slate-100/50 px-2 py-0.5 rounded-md border border-transparent group-hover:border-slate-200 transition-all"
                            >
                              {word}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="pr-6 py-2 text-right">
                        <button
                          onClick={() => addToList(week)}
                          disabled={isAlreadyAdded}
                          className={`p-1.5 rounded-lg transition-all ${
                            isAlreadyAdded 
                              ? 'text-emerald-500 bg-emerald-50' 
                              : 'text-indigo-600 hover:bg-indigo-600 hover:text-white'
                          }`}
                        >
                          {isAlreadyAdded ? <Check size={14} /> : <Plus size={14} />}
                        </button>
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
    </div>
  );
};
