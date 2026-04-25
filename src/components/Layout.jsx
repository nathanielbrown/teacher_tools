import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSettings } from '../contexts/SettingsContext';
import { SettingsModal } from './SettingsModal';

import { 
  Plus, ChevronRight, Menu, 
  Settings, X, Home, ChevronDown, ChevronLeft, EyeOff, LayoutGrid, Info
} from 'lucide-react';
import { AboutModal } from './AboutModal';

import { tools } from '../data/tools';
import logo from '../assets/ClassRex_logo.png';

const NoCookieIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="inline-block drop-shadow-sm">
    <circle cx="12" cy="12" r="7" stroke="#b45309" fill="#fde68a" strokeWidth="2" />
    <circle cx="10.5" cy="10.5" r="1" fill="#78350f" />
    <circle cx="14" cy="12.5" r="1" fill="#78350f" />
    <circle cx="12" cy="14.5" r="1" fill="#78350f" />
    <circle cx="13" cy="9.5" r="0.75" fill="#78350f" />
    <circle cx="9.5" cy="13" r="0.75" fill="#78350f" />
    <circle cx="12" cy="12" r="11" stroke="#ef4444" strokeWidth="2.5" />
    <line x1="4.5" y1="4.5" x2="19.5" y2="19.5" stroke="#ef4444" strokeWidth="2.5" />
  </svg>
);

const NoCloudIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="inline-block drop-shadow-sm">
    <g transform="matrix(0.65 0 0 0.65 4.2 4.2)">
      <path d="M17.5 19c2.5 0 4.5-2 4.5-4.5 0-2.4-1.9-4.3-4.3-4.5C16.9 6.7 13.7 4 10 4 6.7 4 4 6.7 4 10c-2.2.3-4 2.2-4 4.5C0 17 2 19 4.5 19h13z" stroke="#0284c7" fill="#e0f2fe" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </g>
    <circle cx="12" cy="12" r="11" stroke="#ef4444" strokeWidth="2.5" />
    <line x1="4.5" y1="4.5" x2="19.5" y2="19.5" stroke="#ef4444" strokeWidth="2.5" />
  </svg>
);

const Tooltip = ({ text, children }) => {
  return children;
};

const dynamicGroups = tools.reduce((acc, tool) => {
  let group = acc.find(g => g.title === tool.section && g.mainSection === tool.mainSection);
  if (!group) {
    group = { title: tool.section, mainSection: tool.mainSection, items: [] };
    acc.push(group);
  }
  group.items.push(tool);
  return acc;
}, []);

const toolGroups = [
  ...dynamicGroups.filter(g => g.title === 'Word Management'),
  {
    title: '',
    mainSection: 'All',
    items: [
      { id: 'home', name: 'Dashboard', icon: Home, emoji: '🏠' },
    ]
  },
  ...dynamicGroups.filter(g => g.title !== 'Word Management')
];

export const Layout = ({ children, onNavigate, activeTab, onTabChange, currentTool }) => {
  const [sidebarMode, setSidebarMode] = useState('mini'); // 'mini', 'full', 'hidden'
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState({});
  const { settings } = useSettings();

  useEffect(() => {
    if (currentTool && currentTool !== 'home') {
      const activeGroup = toolGroups.find(g => g.items.some(i => i.id === currentTool));
      if (activeGroup && activeGroup.title) {
        setExpandedSections({ [activeGroup.title]: true });
      }
    } else {
      setExpandedSections({});
    }
  }, [currentTool]);

  const toggleSection = (title) => {
    setExpandedSections(prev => prev[title] ? {} : { [title]: true });
  };

  const filteredGroups = toolGroups.filter(group => {
    if (group.mainSection === 'All') return true;
    return group.mainSection === activeTab;
  });

  const getThemeColorClass = () => {
    if (activeTab === 'Teacher Tools') return 'primary';
    if (activeTab === 'Classroom Games') return 'secondary';
    return 'accent';
  };

  const themeColor = getThemeColorClass();

  return (
    <div className="flex h-screen overflow-hidden bg-transparent font-['Outfit']">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-4 left-4 z-50 glass-card rounded-[2rem] transition-all duration-500 ease-in-out flex flex-col ${
          sidebarMode === 'hidden' ? '-translate-x-[120%]' : 'translate-x-0'
        } ${sidebarMode === 'mini' ? 'w-20' : 'w-72'}`}
      >
        <div className={`flex items-center p-6 ${sidebarMode === 'mini' ? 'justify-center' : 'justify-between'}`}>
          <div className="flex items-center gap-2">
            <img src={logo} alt="ClassRex" className="h-8 w-auto object-contain" />
            {sidebarMode !== 'mini' && (
              <span className="text-xl font-black text-slate-800 tracking-tighter">ClassRex</span>
            )}
          </div>
          <button 
            onClick={() => setSidebarMode(sidebarMode === 'mini' ? 'full' : 'mini')} 
            className={`p-2 rounded-xl hover:bg-gray-100/50 text-${themeColor} transition-all active:scale-95`}
          >
            {settings.theme === 'early-years' ? (
              sidebarMode === 'mini' ? <span className="text-xl">👉</span> : <span className="text-xl">👈</span>
            ) : (
              sidebarMode === 'mini' ? <ChevronRight size={24} /> : <ChevronLeft size={24} />
            )}
          </button>
        </div>

        <nav className={`flex-1 overflow-y-auto custom-scrollbar py-2 ${sidebarMode === 'mini' ? 'px-2' : 'px-4'} space-y-6`}>
          {filteredGroups.map((group, idx) => {
            const isExpanded = group.title === '' || expandedSections[group.title];
            
            return (
              <div key={idx} className="space-y-1">
                {group.title && sidebarMode !== 'mini' && (
                  <button 
                    onClick={() => toggleSection(group.title)}
                    className={`w-full flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-4 py-2 hover:text-${themeColor} transition-colors`}
                  >
                    <span>{group.title}</span>
                    <ChevronDown size={14} className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </button>
                )}
                
                <div className={`space-y-1 transition-all duration-300 ${isExpanded ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden pointer-events-none'}`}>
                  {group.items.map((tool) => {
                    const isActive = tool.id === currentTool;
                    return (
                      <button
                        key={tool.id}
                        onClick={() => onNavigate(tool.id)}
                        title={sidebarMode === 'mini' ? tool.name : ''}
                        className={`w-full group relative flex items-center transition-all ${
                          sidebarMode === 'mini' ? 'justify-center p-3' : 'px-4 py-3 space-x-4'
                        } rounded-2xl ${
                          isActive 
                            ? `bg-${themeColor} text-white shadow-lg shadow-${themeColor}/20 scale-[1.02]` 
                            : `hover:bg-white/50 text-slate-500 ${settings.theme === 'early-years' ? '' : `hover:text-${themeColor}`}`
                        }`}
                      >
                        {settings.theme === 'early-years' && tool.emoji ? (
                          <span className="text-xl leading-none">{tool.emoji}</span>
                        ) : tool.icon ? (
                          <tool.icon 
                            size={20} 
                            style={{ color: (settings.theme === 'early-years' && !isActive) ? tool.color : undefined }}
                            className={settings.theme === 'early-years' && !isActive ? 'opacity-100' : ''}
                          />
                        ) : (
                          <LayoutGrid size={20} />
                        )}
                        {sidebarMode !== 'mini' && <span className="text-sm font-bold truncate">{tool.name}</span>}
                        {isActive && sidebarMode === 'mini' && (
                          <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-white rounded-l-full shadow-sm" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-white/10 flex justify-center">
          <button 
            onClick={() => setSidebarMode('hidden')}
            className="p-3 text-slate-300 hover:text-rose-500 transition-colors rounded-xl hover:bg-rose-50/50"
            title="Hide Sidebar"
          >
            {settings.theme === 'early-years' ? <span className="text-xl">🙈</span> : <EyeOff size={20} />}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`flex-1 flex flex-col overflow-hidden relative transition-all duration-500 ${
        sidebarMode === 'mini' ? 'lg:pl-28' : sidebarMode === 'full' ? 'lg:pl-80' : 'lg:pl-0'
      }`}>
        {/* Floating Sidebar Toggle - Only when hidden */}
        {sidebarMode === 'hidden' && (
          <button
            onClick={() => setSidebarMode('mini')}
            className={`fixed left-0 top-1/2 -translate-y-1/2 z-40 bg-white/80 backdrop-blur-md shadow-2xl border border-white/20 p-4 rounded-r-3xl text-${themeColor} hover:bg-${themeColor} hover:text-white transition-all group active:scale-95`}
          >
            <ChevronRight size={24} className="group-hover:translate-x-1 transition-transform" />
          </button>
        )}

        {/* Top Bar */}
        <header className="pt-4 px-4 md:px-8 z-10">
          <div className="max-w-7xl mx-auto h-20 flex items-center justify-between px-6 glass-card rounded-[2rem]">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setSidebarMode(sidebarMode === 'hidden' ? 'full' : 'hidden')} 
                className="lg:hidden p-2 rounded-xl hover:bg-gray-100 text-slate-600"
              >
                {settings.theme === 'early-years' ? <span className="text-2xl">🍔</span> : <Menu size={24} />}
              </button>
              <img src={logo} alt="ClassRex" className="h-8 w-auto object-contain lg:hidden" />
              
              {/* Privacy Badges - Visible on Desktop Top Left */}
              <div className="hidden lg:flex items-center gap-2">
                <div className="flex items-center gap-2 mr-2">
                  <img src={logo} alt="ClassRex" className="h-10 w-auto object-contain" />
                  <span className="text-xl font-black text-slate-800 tracking-tighter">ClassRex</span>
                </div>
                <div className="flex items-center">
                  <div className="flex items-center justify-center p-0.5">
                    <NoCookieIcon />
                  </div>
                  <div className="flex items-center justify-center p-0.5">
                    <NoCloudIcon />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Desktop Navigation Tabs */}
            <div className="hidden lg:flex items-center p-1 bg-slate-100 rounded-[1.25rem] gap-1 border border-slate-200">
              {['Teacher Tools', 'Classroom Games', 'Student Tools'].map(tab => {
                const isTabActive = activeTab === tab;
                const tabColorClass = tab === 'Teacher Tools' ? 'primary' : tab === 'Classroom Games' ? 'secondary' : 'accent';
                
                return (
                  <button
                    key={tab}
                    onClick={() => onTabChange(tab)}
                    className={`px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all duration-300 border-2 ${
                      isTabActive
                        ? `bg-${tabColorClass} border-${tabColorClass} text-white shadow-lg shadow-${tabColorClass}/20 scale-105`
                        : `bg-transparent border-slate-200 text-${tabColorClass} hover:border-${tabColorClass} hover:bg-${tabColorClass}/5`
                    }`}
                  >
                    {tab}
                  </button>
                )
              })}
            </div>

            <div className="flex items-center">
              <button
                onClick={() => setIsAboutOpen(true)}
                className="p-2 rounded-xl hover:bg-gray-100/80 text-slate-600 transition-all"
                title="About ClassRex"
              >
                {settings.theme === 'early-years' ? <span className="text-xl">ℹ️</span> : <Info size={20} />}
              </button>

              <button
                onClick={() => setIsSettingsOpen(true)}
                className="p-2 rounded-xl hover:bg-gray-100/80 text-slate-600 transition-all"
                title="Settings"
              >
                {settings.theme === 'early-years' ? <span className="text-xl">⚙️</span> : <Settings size={20} />}
              </button>
            </div>
          </div>

          {/* Mobile Navigation Tabs */}
          <div className="lg:hidden mt-4 flex items-center p-1 bg-gray-100/50 rounded-2xl overflow-x-auto no-scrollbar">
            {['Teacher Tools', 'Classroom Games', 'Student Tools'].map(tab => {
                const isTabActive = activeTab === tab;
                const tabColorClass = tab === 'Teacher Tools' ? 'primary' : tab === 'Classroom Games' ? 'secondary' : 'accent';
                
                return (
                  <button
                    key={tab}
                    onClick={() => onTabChange(tab)}
                    className={`flex-1 px-4 py-2.5 whitespace-nowrap font-black text-[10px] uppercase tracking-wider rounded-xl transition-all border-2 ${
                      isTabActive
                        ? `bg-${tabColorClass} border-${tabColorClass} text-white shadow-sm`
                        : `bg-transparent border-slate-100 text-${tabColorClass}`
                    }`}
                  >
                    {tab}
                  </button>
                )
            })}
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
          <div className="w-full h-full">
            {children}
          </div>
        </main>
      </div>

      {/* Modals */}
      {isSettingsOpen && <SettingsModal onClose={() => setIsSettingsOpen(false)} />}
      {isAboutOpen && <AboutModal onClose={() => setIsAboutOpen(false)} />}

      {/* Mobile Sidebar Overlay */}
      {sidebarMode !== 'hidden' && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarMode('hidden')}
        />
      )}
    </div>
  );
};
