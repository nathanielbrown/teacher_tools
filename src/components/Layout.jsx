import React, { useState } from 'react';
import { Menu, Settings, X, Home } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';
import { SettingsModal } from './SettingsModal';

export const Layout = ({ children, onNavigate }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { settings } = useSettings();

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const tools = [
    { id: 'home', name: 'Dashboard', icon: Home },
    { id: 'clock', name: 'Analogue & Digital Clock' },
    { id: 'stopwatch', name: 'Stop Watch' },
    { id: 'countdown', name: 'Count Down' },
    { id: 'examclock', name: 'Exam Clock' },
    { id: 'diceroller', name: 'Dice Roller' },
    { id: 'flipcoin', name: 'Flip a Coin' },
    { id: 'numberspinner', name: 'Number Spinner' },
    { id: 'colourpicker', name: 'Colour Picker' },
    { id: 'metronome', name: 'Metronome' },
    { id: 'storystarters', name: 'Story Starters' },
    { id: 'casinospinner', name: 'Name Picker (Casino)' },
    { id: 'wheelspinner', name: 'Name Picker (Wheel)' },
    { id: 'groupmaker', name: 'Random Group Maker' },
  ];

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:relative lg:translate-x-0 flex flex-col`}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold text-primary">Teacher Tools</h2>
          <button onClick={toggleSidebar} className="lg:hidden p-2 rounded-md hover:bg-gray-100 text-text">
            <X size={24} />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {tools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => {
                onNavigate(tool.id);
                if (window.innerWidth < 1024) setIsSidebarOpen(false);
              }}
              className="w-full text-left px-4 py-3 rounded-lg hover:bg-primary/10 text-text transition-colors flex items-center space-x-3"
            >
              {tool.icon && <tool.icon size={20} />}
              <span>{tool.name}</span>
              {settings.theme === 'early-years' && tool.id === 'home' && <span>🏫</span>}
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Top Bar */}
        <header className="h-16 bg-white shadow-sm flex items-center justify-between px-4 z-10">
          <div className="flex items-center space-x-4">
            <button onClick={toggleSidebar} className="lg:hidden p-2 rounded-md hover:bg-gray-100 text-text">
              <Menu size={24} />
            </button>
            <h1 className="text-xl font-bold text-text lg:hidden">Teacher Tools</h1>
          </div>
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 rounded-full hover:bg-gray-100 text-text transition-colors"
            title="Settings"
          >
            <Settings size={24} />
          </button>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </main>
      </div>

      {/* Settings Modal */}
      {isSettingsOpen && <SettingsModal onClose={() => setIsSettingsOpen(false)} />}

      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
};
