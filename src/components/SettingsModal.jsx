import React, { useState, useRef } from 'react';
import { X, Plus, Trash2, Download, Upload } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';
import { audioEngine } from '../utils/audio';

export const SettingsModal = ({ onClose }) => {
  const { settings, updateTheme, setSoundTheme, addClass, updateClass, deleteClass, setSettings } = useSettings();
  const fileInputRef = useRef(null);
  const [newClassName, setNewClassName] = useState('');
  const [newClassStudents, setNewClassStudents] = useState('');

  const handleAddClass = () => {
    if (!newClassName.trim() || !newClassStudents.trim()) return;

    const studentsList = newClassStudents
      .split('\n')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    if (studentsList.length === 0) return;

    addClass({
      id: `class-${Date.now()}`,
      name: newClassName.trim(),
      students: studentsList
    });

    setNewClassName('');
    setNewClassStudents('');
  };

  const handleUpdateClass = (id, newStudentsString) => {
    const studentsList = newStudentsString
      .split('\n')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    const cls = settings.classes.find(c => c.id === id);
    if (cls) {
      updateClass({ ...cls, students: studentsList });
    }
  };

  const handleExport = () => {
    const dataToExport = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('teacherTools')) {
        dataToExport[key] = JSON.parse(localStorage.getItem(key));
      }
    }

    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `teacher_tools_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedData = JSON.parse(event.target.result);

        Object.keys(importedData).forEach(key => {
          if (key.startsWith('teacherTools')) {
            localStorage.setItem(key, JSON.stringify(importedData[key]));
          }
        });

        if (importedData['teacherToolsSettings']) {
          setSettings(importedData['teacherToolsSettings']);
        }

        window.location.reload();
      } catch (err) {
        alert("Failed to parse the imported JSON file. Please make sure it's a valid backup.");
        console.error(err);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4 font-['Outfit']">
      <div className="bg-white shadow-2xl rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50">
          <h2 className="text-xl font-black text-slate-800 tracking-tight">Settings</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-xl transition-all active:scale-90 text-slate-400 hover:text-slate-600">
            {settings.theme === 'early-years' ? <span className="text-xl">❌</span> : <X size={24} />}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-white">
          {/* Theme Selection */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-black text-slate-800 tracking-tight">Theme</h3>
              <div className="flex-1 h-px bg-slate-100" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { id: 'early-years', name: 'Early Years', desc: 'Bright and colourful.', emoji: '🎨' },
                { id: 'primary', name: 'Primary', desc: 'Nature inspired', emoji: '🌿' },
                { id: 'secondary', name: 'Secondary', desc: 'Modern & sleek', emoji: '✨' },
              ].map(theme => (
                <button
                  key={theme.id}
                  onClick={() => updateTheme(theme.id)}
                  className={`p-3 rounded-2xl border-2 text-left transition-all duration-300 ${settings.theme === theme.id
                    ? 'border-primary bg-primary/5 shadow-md shadow-primary/10'
                    : 'border-slate-100 bg-white hover:border-primary/30 hover:bg-slate-50'
                    }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl">{theme.emoji}</span>
                    <span className="font-bold text-slate-800 text-sm">{theme.name}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium">{theme.desc}</div>
                </button>
              ))}
            </div>
          </section>

          {/* Sound Settings */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-black text-slate-800 tracking-tight">Audio Effects</h3>
              <div className="flex-1 h-px bg-slate-100" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {[
                { id: 'none', name: 'None', emoji: '🔇' },
                { id: 'classic', name: 'Classic', emoji: '🔔' },
                { id: 'digital', name: 'Digital', emoji: '🕹️' },
                { id: 'soft', name: 'Soft', emoji: '🎵' },
                { id: 'bubbly', name: 'Bubbly', emoji: '🫧' },
              ].map(theme => (
                <button
                  key={theme.id}
                  onClick={() => {
                    setSoundTheme(theme.id);
                    if (theme.id !== 'none') {
                      audioEngine.playAlarm(theme.id);
                    }
                  }}
                  className={`p-3 rounded-2xl border-2 text-center transition-all duration-300 flex flex-col items-center gap-1 ${
                    settings.soundTheme === theme.id
                      ? 'border-primary bg-primary/5 text-primary shadow-md shadow-primary/5'
                      : 'border-slate-100 bg-white hover:border-primary/30 text-slate-500 hover:text-primary hover:bg-slate-50'
                  }`}
                >
                  <span className="text-2xl">{theme.emoji}</span>
                  <span className="font-bold text-[10px] uppercase tracking-wider">{theme.name}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Data Management */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-black text-slate-800 tracking-tight">Data Management</h3>
              <div className="flex-1 h-px bg-slate-100" />
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleExport}
                className="flex-1 flex items-center justify-center space-x-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 px-4 py-3 rounded-xl text-sm font-bold transition-all active:scale-95"
              >
                {settings.theme === 'early-years' ? <span className="text-xl">📤</span> : <Download size={18} />}
                <span>Export Backup</span>
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 flex items-center justify-center space-x-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 px-4 py-3 rounded-xl text-sm font-bold transition-all active:scale-95"
              >
                {settings.theme === 'early-years' ? <span className="text-xl">📥</span> : <Upload size={18} />}
                <span>Import Backup</span>
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImport}
                accept=".json,application/json"
                className="hidden"
              />
            </div>
          </section>

          {/* Class Management */}
          <section className="space-y-4 pb-4">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-black text-slate-800 tracking-tight">Class Lists</h3>
              <div className="flex-1 h-px bg-slate-100" />
            </div>
            <div className="space-y-6">
              {/* Add New Class */}
              <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-4">
                <h4 className="font-bold text-slate-800 text-md">Create New Class</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 ml-1 uppercase tracking-wider">Class Name</label>
                    <input
                      type="text"
                      value={newClassName}
                      onChange={(e) => setNewClassName(e.target.value)}
                      placeholder="e.g. Year 3 Red"
                      className="w-full p-3 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-bold shadow-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 ml-1 uppercase tracking-wider">Students (One per line)</label>
                    <textarea
                      value={newClassStudents}
                      onChange={(e) => setNewClassStudents(e.target.value)}
                      placeholder="Alice&#10;Bob&#10;Charlie"
                      rows={3}
                      className="w-full p-3 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-bold shadow-sm"
                    />
                  </div>
                </div>
                <button
                  onClick={handleAddClass}
                  disabled={!newClassName.trim() || !newClassStudents.trim()}
                  className="w-full flex items-center justify-center space-x-2 bg-primary text-white px-4 py-3 rounded-xl text-sm font-bold hover:shadow-md hover:shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-30"
                >
                  {settings.theme === 'early-years' ? <span className="text-xl">➕</span> : <Plus size={18} />}
                  <span>Add Class to Database</span>
                </button>
              </div>

              {/* Existing Classes */}
              {settings.classes.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-bold text-slate-800 text-md ml-1">Current Classes</h4>
                  <div className="grid grid-cols-1 gap-3">
                    {settings.classes.map(cls => (
                      <div key={cls.id} className="bg-white border border-slate-200 p-4 rounded-2xl flex gap-4 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center justify-between">
                            <h5 className="text-md font-bold text-slate-800">{cls.name}</h5>
                            <span className="bg-slate-100 text-slate-500 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter">
                              {cls.students.length} students
                            </span>
                          </div>
                          <textarea
                            defaultValue={cls.students.join('\n')}
                            onBlur={(e) => handleUpdateClass(cls.id, e.target.value)}
                            rows={3}
                            className="w-full p-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-bold"
                          />
                        </div>
                        <button
                          onClick={() => deleteClass(cls.id)}
                          className="self-start p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-all active:scale-90"
                          title="Delete Class"
                        >
                          {settings.theme === 'early-years' ? <span className="text-xl">🗑️</span> : <Trash2 size={20} />}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
