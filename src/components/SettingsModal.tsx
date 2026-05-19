import React, { useState, useRef, useMemo } from 'react';
import { X, Plus, Trash2, Download, Upload, Languages } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';
import { audioEngine } from '../utils/audio';
import { FormattedMessage, useIntl } from 'react-intl';
import { storage } from '../utils/storage';
import { FlagIcon } from './shared/FlagIcon';

export const SettingsModal = ({ onClose }: { onClose: () => void }) => {
  const { settings, updateTheme, setSoundTheme, addClass, updateClass, deleteClass, setSettings, updateLanguage } = useSettings();
  const intl = useIntl();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [newClassName, setNewClassName] = useState('');
  const [newClassStudents, setNewClassStudents] = useState('');
  
  const storageUsage = useMemo(() => {
    let total = 0;
    try {
      for (let i = 0; i < storage.length; i++) {
        const key = storage.key(i);
        if (key) {
          const item = storage.getItem(key);
          if (item) {
            total += (item.length + key.length) * 2;
          }
        }
      }
    } catch (e) {
      console.error('Failed to calculate storage usage', e);
    }
    return total;
  }, []);

  const storageLimit = 5 * 1024 * 1024; // 5MB
  const storagePercentage = Math.min((storageUsage / storageLimit) * 100, 100);

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

  const handleUpdateClass = (id: string, newStudentsString: string) => {
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
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      if (key && key.startsWith('teacherTools')) {
        const item = storage.getItem(key);
        if (item) {
          dataToExport[key] = JSON.parse(item);
        }
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

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const result = event.target?.result;
        if (typeof result !== 'string') return;
        const importedData = JSON.parse(result);

        Object.keys(importedData).forEach(key => {
          if (key.startsWith('teacherTools')) {
            storage.setItem(key, JSON.stringify(importedData[key]));
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

  const handleClearData = () => {
    if (window.confirm("Are you sure you want to clear all data? This will reset your settings and delete all class lists.")) {
      const keysToRemove: string[] = [];
      for (let i = 0; i < storage.length; i++) {
        const key = storage.key(i);
        if (key && key.startsWith('teacherTools')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => storage.removeItem(key));
      window.location.reload();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4 font-['Outfit']"
      onClick={onClose}
    >
      <div 
        className="bg-white shadow-2xl rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
      >
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50">
          <h2 id="settings-title" className="text-xl font-black text-slate-800 tracking-tight">Settings</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-xl transition-all active:scale-90 text-slate-400 hover:text-slate-600" aria-label="Close Settings">
            <span className="text-xl" aria-hidden="true">❌</span>
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
                { id: 'dark', name: 'Dark Mode', desc: 'Easy on the eyes', emoji: '🌙' },
              ].map(theme => (
                <button
                  key={theme.id}
                  onClick={() => updateTheme(theme.id)}
                  className={`p-3 rounded-2xl border-2 text-left transition-all duration-300 ${settings.theme === theme.id
                    ? 'border-primary bg-primary/5 shadow-md shadow-primary/10'
                    : 'border-slate-100 bg-white hover:border-primary/30 hover:bg-slate-50'
                    }`}
                  aria-pressed={settings.theme === theme.id}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl" aria-hidden="true">{theme.emoji}</span>
                    <span className="font-bold text-slate-800 text-sm">{theme.name}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium">{theme.desc}</div>
                </button>
              ))}
            </div>
          </section>
  
          {/* Year Level Selection */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-black text-slate-800 tracking-tight">Year Level Filter</h3>
              <div className="flex-1 h-px bg-slate-100" />
            </div>
            <div className="flex flex-wrap gap-2">
              {['All', 'Prep', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'].map(year => (
                <button
                  key={year}
                  onClick={() => setSettings(prev => ({ ...prev, selectedYear: year }))}
                  className={`px-4 py-2 rounded-xl border-2 font-bold text-sm transition-all duration-300 ${
                    settings.selectedYear === year
                      ? 'border-primary bg-primary text-white shadow-md'
                      : 'border-slate-100 bg-white text-slate-600 hover:border-primary/30 hover:bg-slate-50'
                  }`}
                  aria-pressed={settings.selectedYear === year}
                >
                  {year === 'Prep' ? 'Prep' : year === 'All' ? 'All' : `Yr ${year}`}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-slate-500 font-medium">Select a year level to only see relevant tools on the dashboard.</p>
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
                  aria-pressed={settings.soundTheme === theme.id}
                >
                  <span className="text-2xl" aria-hidden="true">{theme.emoji}</span>
                  <span className="font-bold text-[10px] uppercase tracking-wider">{theme.name}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Language Selection */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-black text-slate-800 tracking-tight">
                <FormattedMessage id="settings.language" defaultMessage="Language" />
              </h3>
              <div className="flex-1 h-px bg-slate-100" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { id: 'en', name: intl.formatMessage({ id: 'settings.language.en', defaultMessage: 'English' }), country: 'AU' },
                { id: 'zh', name: intl.formatMessage({ id: 'settings.language.zh', defaultMessage: 'Chinese' }), country: 'CN' },
                { id: 'fr', name: intl.formatMessage({ id: 'settings.language.fr', defaultMessage: 'French' }), country: 'FR' },
                { id: 'th', name: intl.formatMessage({ id: 'settings.language.th', defaultMessage: 'Thai' }), country: 'TH' },
                { id: 'vi', name: intl.formatMessage({ id: 'settings.language.vi', defaultMessage: 'Vietnamese' }), country: 'VN' },
                { id: 'ja', name: intl.formatMessage({ id: 'settings.language.ja', defaultMessage: 'Japanese' }), country: 'JP' },
              ].map(lang => (
                <button
                  key={lang.id}
                  onClick={() => updateLanguage(lang.id)}
                  className={`p-3 rounded-2xl border-2 text-left transition-all duration-300 ${settings.language === lang.id
                    ? 'border-primary bg-primary/5 shadow-md shadow-primary/10'
                    : 'border-slate-100 bg-white hover:border-primary/30 hover:bg-slate-50'
                    }`}
                  aria-pressed={settings.language === lang.id}
                >
                  <div className="flex items-center gap-2">
                    <FlagIcon country={lang.country} className="w-6 h-4 shadow-sm rounded-sm" />
                    <span className="font-bold text-slate-800 text-sm">{lang.name}</span>
                  </div>
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
                <span className="text-xl" aria-hidden="true">📤</span>
                <span>Export Backup</span>
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 flex items-center justify-center space-x-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 px-4 py-3 rounded-xl text-sm font-bold transition-all active:scale-95"
              >
                <span className="text-xl" aria-hidden="true">📥</span>
                <span>Import Backup</span>
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImport}
                accept=".json,application/json"
                className="hidden"
                aria-label="Import Backup JSON"
              />

              <button
                onClick={handleClearData}
                className="flex-1 flex items-center justify-center space-x-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 px-4 py-3 rounded-xl text-sm font-bold transition-all active:scale-95"
              >
                <span className="text-xl" aria-hidden="true">🧹</span>
                <span>Clear Database</span>
              </button>
            </div>
            
            <div className="space-y-2 mt-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div className="flex justify-between text-xs font-bold text-slate-600 mb-1">
                <span className="uppercase tracking-wider">Local Storage Usage</span>
                <span>{(storageUsage / 1024).toFixed(1)} KB / 5.0 MB</span>
              </div>
              <div className="h-3 w-full bg-slate-200 rounded-full overflow-hidden shadow-inner">
                <div 
                  className={`h-full transition-all duration-1000 ease-out rounded-full ${
                    storagePercentage > 90 ? 'bg-rose-500' : storagePercentage > 70 ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${storagePercentage}%` }}
                />
              </div>
              <p className="text-[9px] text-slate-400 font-medium">LocalStorage is used to save your settings, classes, and tool data directly in your browser.</p>
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
                    <label htmlFor="new-class-name" className="text-xs font-bold text-slate-500 ml-1 uppercase tracking-wider">Class Name</label>
                    <input
                      id="new-class-name"
                      type="text"
                      value={newClassName}
                      onChange={(e) => setNewClassName(e.target.value)}
                      placeholder="e.g. Year 3 Red"
                      className="w-full p-3 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-bold shadow-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="new-class-students" className="text-xs font-bold text-slate-500 ml-1 uppercase tracking-wider">Students (One per line)</label>
                    <textarea
                      id="new-class-students"
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
                  <span className="text-xl" aria-hidden="true">➕</span>
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
                            aria-label={`Students for ${cls.name}`}
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
                          aria-label={`Delete Class ${cls.name}`}
                        >
                          <span className="text-xl" aria-hidden="true">🗑️</span>
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
