import { createContext, useContext, useState, useEffect } from 'react';

const defaultSettings = {
  theme: 'early-years', // 'early-years', 'primary', 'secondary'
  soundTheme: 'classic', // 'none', 'classic', 'digital', 'soft', 'bubbly'
  classes: [{ id: 'class-1', name: 'Class 1', students: ['Alice', 'Bob', 'Charlie'] }]
};

const SettingsContext = createContext();

export const useSettings = () => {
  return useContext(SettingsContext);
};

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(() => {
    const savedSettings = localStorage.getItem('teacherToolsSettings');
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings);
      // Migrate old soundsEnabled to soundTheme
      if (parsed.soundsEnabled !== undefined && parsed.soundTheme === undefined) {
        parsed.soundTheme = parsed.soundsEnabled ? 'classic' : 'none';
        delete parsed.soundsEnabled;
      }
      return { ...defaultSettings, ...parsed };
    }
    return defaultSettings;
  });

  useEffect(() => {
    localStorage.setItem('teacherToolsSettings', JSON.stringify(settings));
    document.documentElement.setAttribute('data-theme', settings.theme);
  }, [settings]);

  const updateTheme = (theme) => setSettings(prev => ({ ...prev, theme }));
  const setSoundTheme = (soundTheme) => setSettings(prev => ({ ...prev, soundTheme }));

  const addClass = (newClass) => {
    setSettings(prev => ({
      ...prev,
      classes: [...prev.classes, newClass]
    }));
  };

  const updateClass = (updatedClass) => {
    setSettings(prev => ({
      ...prev,
      classes: prev.classes.map(c => c.id === updatedClass.id ? updatedClass : c)
    }));
  };

  const deleteClass = (classId) => {
    setSettings(prev => ({
      ...prev,
      classes: prev.classes.filter(c => c.id !== classId)
    }));
  };

  return (
    <SettingsContext.Provider value={{
      settings,
      updateTheme,
      setSoundTheme,
      addClass,
      updateClass,
      deleteClass,
      setSettings
    }}>
      {children}
    </SettingsContext.Provider>
  );
};
