import React, { createContext, useContext, useState, useEffect, ReactNode, Dispatch, SetStateAction } from 'react';
import { storage } from '../utils/storage';

const demoStudents = Array.from({ length: 28 }, (_, i) => `Student ${i + 1}`);

export interface Class {
  id: string;
  name: string;
  students: string[];
}

export interface Settings {
  theme: string; // 'early-years', 'primary', 'secondary'
  soundTheme: string; // 'none', 'classic', 'digital', 'soft', 'bubbly'
  selectedYear: string;
  classes: Class[];
  language: string;
}

const defaultSettings: Settings = {
  theme: 'early-years',
  soundTheme: 'classic',
  selectedYear: 'All',
  classes: [{ id: 'class-demo', name: 'Demo', students: demoStudents }],
  language: 'en'
};

interface SettingsContextType {
  settings: Settings;
  updateTheme: (theme: string) => void;
  setSoundTheme: (soundTheme: string) => void;
  addClass: (newClass: Class) => void;
  updateClass: (updatedClass: Class) => void;
  deleteClass: (classId: string) => void;
  setSettings: Dispatch<SetStateAction<Settings>>;
  updateLanguage: (language: string) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

// eslint-disable-next-line react-refresh/only-export-components
export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<Settings>(() => {
    const savedSettings = storage.getItem('teacherToolsSettings');
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
    storage.setItem('teacherToolsSettings', JSON.stringify(settings));
    document.documentElement.setAttribute('data-theme', settings.theme);
  }, [settings]);

  const updateTheme = (theme: string) => setSettings(prev => ({ ...prev, theme }));
  const setSoundTheme = (soundTheme: string) => setSettings(prev => ({ ...prev, soundTheme }));

  const addClass = (newClass: Class) => {
    setSettings(prev => ({
      ...prev,
      classes: [...prev.classes, newClass]
    }));
  };

  const updateClass = (updatedClass: Class) => {
    setSettings(prev => ({
      ...prev,
      classes: prev.classes.map(c => c.id === updatedClass.id ? updatedClass : c)
    }));
  };

  const deleteClass = (classId: string) => {
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
      setSettings,
      updateLanguage: (language: string) => setSettings(prev => ({ ...prev, language }))
    }}>
      {children}
    </SettingsContext.Provider>
  );
};
