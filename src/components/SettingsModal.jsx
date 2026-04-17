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
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-text">Settings</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Theme Selection */}
          <section>
            <h3 className="text-lg font-semibold mb-4 text-text">Theme</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { id: 'early-years', name: 'Early Years', desc: 'Bright and colourful.', emoji: '🎨' },
                { id: 'primary', name: 'Primary', desc: 'Nature' },
                { id: 'secondary', name: 'Secondary', desc: 'Modern' },
              ].map(theme => (
                <button
                  key={theme.id}
                  onClick={() => updateTheme(theme.id)}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${settings.theme === theme.id
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-200 hover:border-primary/50'
                    }`}
                >
                  <div className="font-semibold text-text">
                    {theme.emoji && <span className="mr-2">{theme.emoji}</span>}
                    {theme.name}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">{theme.desc}</div>
                </button>
              ))}
            </div>
          </section>

          {/* Sound Settings */}
          <section>
            <h3 className="text-lg font-semibold mb-4 text-text">Audio Effects</h3>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
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
                  className={`p-3 rounded-xl border-2 text-center transition-all flex flex-col items-center gap-1 ${
                    settings.soundTheme === theme.id
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-gray-200 hover:border-primary/50 text-gray-600'
                  }`}
                >
                  <span className="text-2xl">{theme.emoji}</span>
                  <span className="font-medium text-sm">{theme.name}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Data Backup */}
          <section>
            <h3 className="text-lg font-semibold mb-4 text-text">Data Backup</h3>
            <div className="flex gap-4">
              <button
                onClick={handleExport}
                className="flex items-center space-x-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Download size={20} />
                <span>Export Data</span>
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center space-x-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Upload size={20} />
                <span>Import Data</span>
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
          <section>
            <h3 className="text-lg font-semibold mb-4 text-text">Manage Classes</h3>
            <div className="space-y-6">
              {/* Add New Class */}
              <div className="bg-gray-50 p-4 rounded-xl space-y-4 border border-gray-200">
                <h4 className="font-medium text-text">Add New Class</h4>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Class Name</label>
                  <input
                    type="text"
                    value={newClassName}
                    onChange={(e) => setNewClassName(e.target.value)}
                    placeholder="e.g. Year 3 Red"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Students (One per line)</label>
                  <textarea
                    value={newClassStudents}
                    onChange={(e) => setNewClassStudents(e.target.value)}
                    placeholder="Alice&#10;Bob&#10;Charlie"
                    rows={4}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                </div>
                <button
                  onClick={handleAddClass}
                  disabled={!newClassName.trim() || !newClassStudents.trim()}
                  className="flex items-center space-x-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus size={20} />
                  <span>Add Class</span>
                </button>
              </div>

              {/* Existing Classes */}
              {settings.classes.length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-medium text-text">Existing Classes</h4>
                  {settings.classes.map(cls => (
                    <div key={cls.id} className="border border-gray-200 p-4 rounded-xl flex gap-4">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="font-semibold text-text">{cls.name}</h5>
                          <span className="text-sm text-gray-500">{cls.students.length} students</span>
                        </div>
                        <textarea
                          defaultValue={cls.students.join('\n')}
                          onBlur={(e) => handleUpdateClass(cls.id, e.target.value)}
                          rows={3}
                          className="w-full p-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-gray-50"
                        />
                      </div>
                      <button
                        onClick={() => deleteClass(cls.id)}
                        className="self-start p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Class"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
