import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Plus, Trash2, Download, Upload } from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';
import { audioEngine } from '../../utils/audio';
import { FormattedMessage, useIntl } from 'react-intl';
import { storage } from '../../utils/storage';
import { FlagIcon } from '../shared/FlagIcon';
import { WordManager } from './WordManager';
import { Settings2, Users, BookOpen, Trees, Sparkles, Moon, Palette } from 'lucide-react';
import { useHeader } from '../../contexts/HeaderContext';

export const Config = () => {
  const { settings, updateTheme, setSoundTheme, addClass, updateClass, deleteClass, setSettings, updateLanguage } = useSettings();
  const intl = useIntl();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [newClassName, setNewClassName] = useState('');
  const [newClassStudents, setNewClassStudents] = useState('');
  
  const currentPath = window.location.pathname;
  const initialTab = currentPath.includes('/wordmanager') ? 'words' : currentPath.includes('/classes') ? 'classes' : 'general';
  const [activeTab, setActiveTab] = useState(initialTab);

  const navigateToTab = (tab: string) => {
    setActiveTab(tab);
    const path = tab === 'words' ? '/config/wordmanager' : tab === 'classes' ? '/config/classes' : '/config';
    window.history.pushState({}, '', path);
  };

  const { setHeaderActions, clearHeader } = useHeader();

  const configTabs = useMemo(() => (
    <div className="flex items-center gap-1.5 bg-slate-100/60 p-1 rounded-2xl border border-slate-200/50 backdrop-blur-md ">
      {[
        { id: 'general', name: intl.formatMessage({ id: 'config.tabs.general', defaultMessage: 'General' }), emoji: '⚙️' },
        { id: 'classes', name: intl.formatMessage({ id: 'config.tabs.classes', defaultMessage: 'Class Manager' }), emoji: '👥' },
        { id: 'words', name: intl.formatMessage({ id: 'config.tabs.words', defaultMessage: 'Word Manager' }), emoji: '📖' },
      ].map(tab => (
        <button
          key={tab.id}
          onClick={() => navigateToTab(tab.id)}
          className={`flex items-center gap-2 px-5 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all duration-300 ${
            activeTab === tab.id
              ? 'bg-slate-950 text-white '
              : 'text-slate-400 hover:text-slate-600 hover:bg-white/80'
          }`}
        >
          <span className="text-base">{tab.emoji}</span>
          <span>{tab.name}</span>
        </button>
      ))}
    </div>
  ), [intl, activeTab]);

  useEffect(() => {
    if (activeTab !== 'words') {
      setHeaderActions(
        <div className="flex items-center gap-4 mr-4">
          {configTabs}
        </div>
      );
    }
    return () => clearHeader();
  }, [activeTab, setHeaderActions, clearHeader, configTabs]);

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path.includes('/wordmanager')) setActiveTab('words');
      else if (path.includes('/classes')) setActiveTab('classes');
      else setActiveTab('general');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);
  
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
    const dataToExport: Record<string, any> = {};
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
        const importedData = JSON.parse(event.target?.result as string);

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
        alert(intl.formatMessage({ id: 'config.alert.import_failed', defaultMessage: "Failed to parse the imported JSON file. Please make sure it's a valid backup." }));
        console.error(err);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleClearData = () => {
    if (window.confirm(intl.formatMessage({ id: 'config.confirm.clear_data', defaultMessage: "Are you sure you want to clear all data? This will reset your settings and delete all class lists." }))) {
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
    <div className="flex-1 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {activeTab === 'general' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="space-y-8">
            {/* Theme Selection */}
            <section className="glass-card p-6 rounded-[2rem] space-y-4">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-black text-slate-800 tracking-tight">
                  <FormattedMessage id="config.theme.title" defaultMessage="Theme" />
                </h3>
                <div className="flex-1 h-px bg-slate-100" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'early-years', name: intl.formatMessage({ id: 'config.theme.early_years.name', defaultMessage: 'Early Years' }), desc: intl.formatMessage({ id: 'config.theme.early_years.desc', defaultMessage: 'Bright and colourful.' }), emoji: '🎨', icon: Palette },
                  { id: 'primary', name: intl.formatMessage({ id: 'config.theme.primary.name', defaultMessage: 'Primary' }), desc: intl.formatMessage({ id: 'config.theme.primary.desc', defaultMessage: 'Nature inspired' }), icon: Trees },
                  { id: 'secondary', name: intl.formatMessage({ id: 'config.theme.secondary.name', defaultMessage: 'Secondary' }), desc: intl.formatMessage({ id: 'config.theme.secondary.desc', defaultMessage: 'Modern & sleek' }), icon: Sparkles },
                ].map(theme => (
                  <button
                    key={theme.id}
                    onClick={() => updateTheme(theme.id)}
                    className={`p-4 rounded-2xl border-2 text-left transition-all duration-300 ${settings.theme === theme.id
                      ? 'border-primary bg-primary/5   scale-[1.02]'
                      : 'border-slate-100 bg-white hover:border-primary/30 hover:bg-slate-50'
                      }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {theme.id === 'early-years' ? (
                        <span className="text-xl">{theme.emoji}</span>
                      ) : (
                        <theme.icon className={`w-5 h-5 ${settings.theme === theme.id ? 'text-primary' : 'text-slate-400'}`} />
                      )}
                      <span className="font-bold text-slate-800 text-sm">{theme.name}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-medium">{theme.desc}</div>
                  </button>
                ))}
              </div>
            </section>

            {/* Sound Settings */}
            <section className="glass-card p-6 rounded-[2rem] space-y-4">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-black text-slate-800 tracking-tight">
                  <FormattedMessage id="config.audio.title" defaultMessage="Audio Effects" />
                </h3>
                <div className="flex-1 h-px bg-slate-100" />
              </div>
              <div className="grid grid-cols-5 gap-2">
                {[
                  { id: 'none', name: intl.formatMessage({ id: 'config.audio.none', defaultMessage: 'None' }), emoji: '🔇' },
                  { id: 'classic', name: intl.formatMessage({ id: 'config.audio.classic', defaultMessage: 'Classic' }), emoji: '🔔' },
                  { id: 'digital', name: intl.formatMessage({ id: 'config.audio.digital', defaultMessage: 'Digital' }), emoji: '🕹️' },
                  { id: 'soft', name: intl.formatMessage({ id: 'config.audio.soft', defaultMessage: 'Soft' }), emoji: '🎵' },
                  { id: 'bubbly', name: intl.formatMessage({ id: 'config.audio.bubbly', defaultMessage: 'Bubbly' }), emoji: '🫧' },
                  { id: 'cosmic', name: intl.formatMessage({ id: 'config.audio.cosmic', defaultMessage: 'Cosmic' }), emoji: '🚀' },
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
                        ? 'border-primary bg-primary/5 text-primary  '
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
            <section className="glass-card p-6 rounded-[2rem] space-y-4">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-black text-slate-800 tracking-tight">
                  <FormattedMessage id="config.data.title" defaultMessage="Data Management" />
                </h3>
                <div className="flex-1 h-px bg-slate-100" />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleExport}
                  className="flex-1 flex items-center justify-center space-x-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 px-4 py-3 rounded-xl text-sm font-bold transition-all active:scale-95"
                >
                  <span className="text-xl">📤</span>
                  <span>
                    <FormattedMessage id="config.data.export" defaultMessage="Export Backup" />
                  </span>
                </button>

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 flex items-center justify-center space-x-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 px-4 py-3 rounded-xl text-sm font-bold transition-all active:scale-95"
                >
                  <span className="text-xl">📥</span>
                  <span>
                    <FormattedMessage id="config.data.import" defaultMessage="Import Backup" />
                  </span>
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImport}
                  accept=".json,application/json"
                  className="hidden"
                />

                <button
                  onClick={handleClearData}
                  className="flex-1 flex items-center justify-center space-x-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 px-4 py-3 rounded-xl text-sm font-bold transition-all active:scale-95"
                >
                  <span className="text-xl">🧹</span>
                  <span>
                    <FormattedMessage id="config.data.clear" defaultMessage="Clear Database" />
                  </span>
                </button>
              </div>
              
              <div className="space-y-3 mt-4 bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                <div className="flex justify-between text-xs font-bold text-slate-600 mb-1">
                  <span className="uppercase tracking-wider">
                    <FormattedMessage id="config.data.usage" defaultMessage="Local Storage Usage" />
                  </span>
                  <span>{(storageUsage / 1024).toFixed(1)} KB / 5.0 MB</span>
                </div>
                <div className="h-3 w-full bg-slate-200 rounded-full overflow-hidden ">
                  <div 
                    className={`h-full transition-all duration-1000 ease-out rounded-full ${
                      storagePercentage > 90 ? 'bg-rose-500' : storagePercentage > 70 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${storagePercentage}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-400 font-medium">
                  <FormattedMessage id="config.data.usage_desc" defaultMessage="LocalStorage is used to save your settings, classes, and tool data directly in your browser." />
                </p>
              </div>
            </section>
          </div>

          <div className="space-y-8">
            {/* Language Selection */}
            <section className="glass-card p-6 rounded-[2rem] space-y-4">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-black text-slate-800 tracking-tight">
                  <FormattedMessage id="settings.language" defaultMessage="Language" />
                </h3>
                <div className="flex-1 h-px bg-slate-100" />
              </div>
              <div className="grid grid-cols-3 gap-3">
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
                    className={`p-4 rounded-2xl border-2 text-left transition-all duration-300 ${settings.language === lang.id
                      ? 'border-primary bg-primary/5  '
                      : 'border-slate-100 bg-white hover:border-primary/30 hover:bg-slate-50'
                      }`}
                  >
                    <div className="flex items-center gap-2">
                      <FlagIcon country={lang.country} className="w-6 h-4  rounded-sm" />
                      <span className="font-bold text-slate-800 text-sm">{lang.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            </section>

            {/* Year Level Selection */}
            <section className="glass-card p-6 rounded-[2rem] space-y-4">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-black text-slate-800 tracking-tight">
                  <FormattedMessage id="config.year_level.title" defaultMessage="Year Level Filter" />
                </h3>
                <div className="flex-1 h-px bg-slate-100" />
              </div>
              <div className="grid grid-cols-7 gap-1.5">
                {['All', 'Prep', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'].map(year => (
                  <button
                    key={year}
                    onClick={() => setSettings(prev => ({ ...prev, selectedYear: year }))}
                    className={`px-1 py-2 rounded-lg border-2 font-bold text-[9px] transition-all duration-300 ${
                      settings.selectedYear === year
                        ? 'border-primary bg-primary text-white  scale-105 z-10'
                        : 'border-slate-100 bg-white text-slate-500 hover:border-primary/30 hover:bg-slate-50'
                    }`}
                  >
                    {year === 'Prep' ? 'Prep' : year === 'All' ? 'All' : `Yr ${year}`}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-slate-400 font-medium italic">
                <FormattedMessage id="config.year_level.desc" defaultMessage="Filter tools on the dashboard by year level." />
              </p>
            </section>
          </div>
      </div>
    )}

    {activeTab === 'classes' && (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 h-full">
        {/* Class Management */}
        <section className="glass-card p-8 rounded-[2.5rem] space-y-6 w-full h-full flex flex-col">
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-black text-slate-800 tracking-tight">
              <FormattedMessage id="config.classes.title" defaultMessage="Class Lists" />
            </h3>
            <div className="flex-1 h-px bg-slate-100" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Add New Class */}
            <div className="bg-slate-50/50 border border-slate-100 p-8 rounded-3xl space-y-4 ">
              <h4 className="font-bold text-slate-800 text-lg">
                <FormattedMessage id="config.classes.create.title" defaultMessage="Create New Class" />
              </h4>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 ml-1 uppercase tracking-wider">
                    <FormattedMessage id="config.classes.create.name_label" defaultMessage="Class Name" />
                  </label>
                  <input
                    type="text"
                    value={newClassName}
                    onChange={(e) => setNewClassName(e.target.value)}
                    placeholder={intl.formatMessage({ id: 'config.classes.create.name_placeholder', defaultMessage: 'e.g. Year 3 Red' })}
                    className="w-full p-4 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-bold "
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 ml-1 uppercase tracking-wider">
                    <FormattedMessage id="config.classes.create.students_label" defaultMessage="Students (One per line)" />
                  </label>
                  <textarea
                    value={newClassStudents}
                    onChange={(e) => setNewClassStudents(e.target.value)}
                    placeholder={intl.formatMessage({ id: 'config.classes.create.students_placeholder', defaultMessage: 'Alice\nBob\nCharlie' })}
                    rows={6}
                    className="w-full p-4 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-bold  resize-none"
                  />
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100 animate-pulse-subtle">
                  <span className="text-sm">🔒</span>
                  <span className="text-[10px] font-black uppercase tracking-wider">
                    <FormattedMessage id="config.classes.create.privacy_tip" defaultMessage="Privacy Tip: Use first names or initials only." />
                  </span>
                </div>
              </div>
              <button
                onClick={handleAddClass}
                disabled={!newClassName.trim() || !newClassStudents.trim()}
                className="w-full flex items-center justify-center space-x-2 bg-primary text-white px-6 py-4 rounded-xl text-sm font-bold   transition-all active:scale-[0.98] disabled:opacity-30 mt-2"
              >
                <span className="text-xl">➕</span>
                <span>
                  <FormattedMessage id="config.classes.create.submit" defaultMessage="Add Class to Database" />
                </span>
              </button>
            </div>

            {/* Existing Classes */}
            <div className="space-y-4">
              <h4 className="font-bold text-slate-800 text-lg ml-1">
                <FormattedMessage id="config.classes.list.title" defaultMessage="Current Classes" />
              </h4>
              {settings.classes.length === 0 ? (
                <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center text-slate-400 font-bold italic">
                  <FormattedMessage id="config.classes.list.empty" defaultMessage="No classes added yet" />
                </div>
              ) : (
                <div className="space-y-4 overflow-y-auto max-h-[600px] pr-2 custom-scrollbar">
                  {settings.classes.map(cls => (
                    <div key={cls.id} className="bg-white border border-slate-100 p-6 rounded-3xl flex gap-4   transition-all">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center justify-between">
                          <h5 className="text-md font-bold text-slate-800">{cls.name}</h5>
                          <span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter">
                            {cls.students.length} students
                          </span>
                        </div>
                        <textarea
                          defaultValue={cls.students.join('\n')}
                          onBlur={(e) => handleUpdateClass(cls.id, e.target.value)}
                          rows={4}
                          className="w-full p-4 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-bold"
                        />
                      </div>
                      <button
                        onClick={() => deleteClass(cls.id)}
                        className="self-start p-3 text-rose-500 hover:bg-rose-50 rounded-xl transition-all active:scale-90"
                        title={intl.formatMessage({ id: 'config.classes.list.delete', defaultMessage: 'Delete Class' })}
                      >
                        <span className="text-xl">🗑️</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    )}

    {activeTab === 'words' && (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 h-[calc(100vh-200px)]">
        <WordManager preActions={configTabs} />
      </div>
    )}
    </div>
  );
};

export default Config;

