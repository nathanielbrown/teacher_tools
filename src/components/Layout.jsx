import React, { useState, useEffect } from 'react';
import { Menu, Settings, X, Home, ChevronDown } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';
import { SettingsModal } from './SettingsModal';

const toolGroups = [
  {
    title: '',
    items: [
      { id: 'home', name: 'Dashboard', icon: Home },
    ]
  },
  {
    title: 'Time Management',
    items: [
      { id: 'clock', name: 'Analogue & Digital Clock' },
      { id: 'stopwatch', name: 'Stop Watch' },
      { id: 'countdown', name: 'Count Down' },
      { id: 'examclock', name: 'Exam Clock' },
      { id: 'eventcountdowns', name: 'Event Countdowns' },
    ]
  },
  {
    title: 'Classroom Management',
    items: [
      { id: 'dailyschedule', name: 'Daily Schedule' },
      { id: 'groupmaker', name: 'Random Group Maker' },
      { id: 'groupscoreboard', name: 'Group Scoreboard' },
      { id: 'marblejar', name: 'Marble Jar Reward' },
      { id: 'emotionpicker', name: 'Emotion Picker' },
    ]
  },
  {
    title: 'Randomizers',
    items: [
      { id: 'diceroller', name: 'Dice Roller' },
      { id: 'flipcoin', name: 'Flip a Coin' },
      { id: 'numberspinner', name: 'Number Spinner' },
      { id: 'casinospinner', name: 'Name Picker (Casino)' },
      { id: 'wheelspinner', name: 'Name Picker (Wheel)' },
      { id: 'groupnamegenerator', name: 'Random Group Name Generator' },
    ]
  },
  {
    title: 'Mathematics',
    items: [
      { id: 'fractiontool', name: 'Fraction Visualizer' },
    ]
  },
  {
    title: 'Literacy',
    items: [
      { id: 'colourpicker', name: 'Colour Picker' },
      { id: 'metronome', name: 'Metronome' },
      { id: 'storystarters', name: 'Story Starters' },
    ]
  },
  {
    title: 'Classroom Games',
    items: [
      { id: 'higherorlower', name: 'Higher or Lower' },
      { id: 'revealword', name: 'Reveal Word' },
    ]
  },
  {
    title: 'Student Tools - Literacy',
    items: [
      { id: 'spelling', name: 'Spelling Practice' },
      { id: 'lettertracing', name: 'Letter Tracing' },
      { id: 'findtheword', name: 'Find the Word' },
      { id: 'typinggame', name: 'Typing Galaxy' },
    ]
  },
  {
    title: 'Student Tools - Math',
    items: [
      { id: 'timestable', name: 'Times Tables' },
      { id: 'moneytool', name: 'Money Tool' },
      { id: 'missingaddition', name: 'Missing Addition' },
      { id: 'missingsubtraction', name: 'Missing Subtraction' },
      { id: 'missingmultiplication', name: 'Missing Multiplier' },
      { id: 'missingdivision', name: 'Missing Division' },
      { id: 'marblecounting', name: 'Marble Counting' },
      { id: 'binarynumbers', name: 'Binary Numbers' },
    ]
  },
  {
    title: 'Student Tools - Memory & Games',
    items: [
      { id: 'simongame', name: 'Simon Says' },
      { id: 'emojimatch', name: 'Emoji Match' },
    ]
  },
  {
    title: 'Student Tools - Science',
    items: [
      { id: 'reactiontime', name: 'Reaction Time' },
    ]
  }
];

export const Layout = ({ children, onNavigate, activeTab, onTabChange, currentTool }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState({});
  const { settings } = useSettings();

  useEffect(() => {
    if (currentTool && currentTool !== 'home') {
      const activeGroup = toolGroups.find(g => g.items.some(i => i.id === currentTool));
      if (activeGroup && activeGroup.title) {
        setExpandedSections(prev => ({ ...prev, [activeGroup.title]: true }));
      }
    }
  }, [currentTool]);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  
  const toggleSection = (title) => {
    setExpandedSections(prev => ({ ...prev, [title]: !prev[title] }));
  };


  const filteredGroups = toolGroups.filter(group => {
    if (activeTab === 'Teacher Tools') {
      return !group.title.includes('Student Tools') && group.title !== 'Classroom Games';
    }
    return group.title.startsWith(activeTab) || group.title === '';
  });

  return (
    <div className="flex h-screen overflow-hidden bg-transparent">
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white/90 backdrop-blur-sm shadow-xl transform transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:relative lg:translate-x-0 flex flex-col`}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold text-primary">{activeTab}</h2>
          <button onClick={toggleSidebar} className="lg:hidden p-2 rounded-md hover:bg-gray-100 text-text">
            <X size={24} />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto p-4 space-y-6">
          {filteredGroups.map((group, idx) => {
            const isExpanded = group.title === '' || expandedSections[group.title];
            
            return (
              <div key={idx} className="space-y-1">
                {group.title && (
                  <button 
                    onClick={() => toggleSection(group.title)}
                    className="w-full flex items-center justify-between text-xs font-bold text-primary/70 uppercase tracking-wider px-4 mb-2 hover:text-primary transition-colors cursor-pointer"
                  >
                    <span>{group.title}</span>
                    <ChevronDown size={14} className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </button>
                )}
                <div className={`overflow-hidden transition-all duration-300 ${isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                  {group.items.map((tool) => {
                    const isActive = tool.id === currentTool;
                    return (
                      <button
                        key={tool.id}
                        onClick={() => {
                          onNavigate(tool.id);
                          if (window.innerWidth < 1024) setIsSidebarOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 rounded-lg transition-colors flex items-center space-x-3 ${
                          isActive ? 'bg-primary/20 text-primary font-bold' : 'hover:bg-primary/10 text-text'
                        }`}
                      >
                        {tool.icon && <tool.icon size={20} />}
                        <span>{tool.name}</span>
                        {settings.theme === 'early-years' && tool.id === 'home' && <span>🏫</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Top Bar */}
        <header className="bg-white/90 backdrop-blur-sm shadow-sm flex flex-col z-10">
          <div className="h-16 flex items-center justify-between px-4">
            <div className="flex items-center space-x-4">
              <button onClick={toggleSidebar} className="lg:hidden p-2 rounded-md hover:bg-gray-100 text-text">
                <Menu size={24} />
              </button>
              <h1 className="text-xl font-bold text-text lg:hidden">App</h1>
            </div>
            
            {/* Desktop Tabs */}
            <div className="hidden lg:flex flex-1 items-end justify-center h-full pt-4 space-x-2">
              {['Teacher Tools', 'Classroom Games', 'Student Tools'].map(tab => {
                const getTabColor = (t) => {
                  if (t === 'Teacher Tools') return 'text-primary border-primary';
                  if (t === 'Classroom Games') return 'text-secondary border-secondary';
                  return 'text-accent border-accent';
                };

                return (
                  <button
                    key={tab}
                    onClick={() => onTabChange(tab)}
                    className={`px-8 py-3 rounded-t-2xl font-bold text-sm transition-all border-t-4 border-x-2 border-b-0 ${
                      activeTab === tab
                        ? `bg-white ${getTabColor(tab)} shadow-sm z-10 scale-105 transform origin-bottom`
                        : 'bg-gray-50/80 text-gray-400 border-transparent hover:bg-gray-100'
                    }`}
                  >
                    {tab}
                  </button>
                )
              })}
            </div>

            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 rounded-full hover:bg-gray-100 text-text transition-colors"
              title="Settings"
            >
              <Settings size={24} />
            </button>
          </div>

          {/* Mobile Tabs */}
          <div className="flex lg:hidden overflow-x-auto px-2 pt-2 border-t no-scrollbar">
            {['Teacher Tools', 'Classroom Games', 'Student Tools'].map(tab => {
                const getTabColor = (t) => {
                  if (t === 'Teacher Tools') return 'text-primary border-primary';
                  if (t === 'Classroom Games') return 'text-secondary border-secondary';
                  return 'text-accent border-accent';
                };
                return (
                  <button
                    key={tab}
                    onClick={() => onTabChange(tab)}
                    className={`px-4 py-3 whitespace-nowrap font-bold text-sm transition-colors border-b-4 ${
                      activeTab === tab
                        ? getTabColor(tab)
                        : 'text-gray-400 border-transparent hover:bg-gray-50'
                    }`}
                  >
                    {tab}
                  </button>
                )
            })}
          </div>
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
