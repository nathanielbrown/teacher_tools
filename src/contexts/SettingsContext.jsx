import { createContext, useContext, useState, useEffect } from 'react';

const defaultSettings = {
  theme: 'early-years', // 'early-years', 'primary', 'secondary'
  soundsEnabled: true,
  classes: [{ id: 'class-1', name: 'Class 1', students: ['Alice', 'Bob', 'Charlie'] }]
};

const SettingsContext = createContext();

export const useSettings = () => {
  return useContext(SettingsContext);
};

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(() => {
    const savedSettings = localStorage.getItem('teacherToolsSettings');
    return savedSettings ? JSON.parse(savedSettings) : defaultSettings;
  });

  useEffect(() => {
    localStorage.setItem('teacherToolsSettings', JSON.stringify(settings));
    document.documentElement.setAttribute('data-theme', settings.theme);
  }, [settings]);

  const updateTheme = (theme) => setSettings(prev => ({ ...prev, theme }));
  const toggleSounds = () => setSettings(prev => ({ ...prev, soundsEnabled: !prev.soundsEnabled }));

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
      toggleSounds,
      addClass,
      updateClass,
      deleteClass,
      setSettings
    }}>
      {children}
    </SettingsContext.Provider>
  );
};
