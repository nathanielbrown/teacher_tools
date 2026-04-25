import { createContext, useContext, useState, useEffect } from 'react';

const demoStudents = Array.from({ length: 28 }, (_, i) => `Student ${i + 1}`);

const defaultSettings = {
  theme: 'early-years', // 'early-years', 'primary', 'secondary'
  soundTheme: 'classic', // 'none', 'classic', 'digital', 'soft', 'bubbly'
  selectedYear: 'All',
  classes: [{ id: 'class-demo', name: 'Demo', students: demoStudents }]
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
      
      // Ensure there's always at least one class
      if (!parsed.classes || parsed.classes.length === 0) {
        parsed.classes = [{ id: 'class-demo', name: 'Demo', students: demoStudents }];
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
    setSettings(prev => {
      const newClasses = prev.classes.filter(c => c.id !== classId);
      if (newClasses.length === 0) {
        newClasses.push({ id: 'class-demo', name: 'Demo', students: demoStudents });
      }
      return {
        ...prev,
        classes: newClasses
      };
    });
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
