import React, { useState, useEffect } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { SettingsModal } from './SettingsModal';

import { 
  Plus, ChevronRight, Menu, 
  Settings, X, Home, ChevronDown, ChevronLeft, EyeOff, LayoutGrid, Info
} from 'lucide-react';
import { AboutModal } from './AboutModal';

import { tools } from '../data/tools';
import logo from '../assets/ClassRex_logo.png';

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
      { id: 'home', name: 'Dashboard', icon: Home },
    ]
  },
  ...dynamicGroups.filter(g => g.title !== 'Word Management')
];

export const Layout = ({ children, onNavigate, activeTab, onTabChange, currentTool }) => {
  const [sidebarMode, setSidebarMode] = useState('mini'); // 'mini', 'full', 'hidden'
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState({ 'Word Management': true });
  const { settings } = useSettings();

  useEffect(() => {
    if (currentTool && currentTool !== 'home') {
      const activeGroup = toolGroups.find(g => g.items.some(i => i.id === currentTool));
      if (activeGroup && activeGroup.title) {
        setExpandedSections(prev => ({ ...prev, [activeGroup.title]: true }));
      }
    }
  }, [currentTool]);

  const toggleSection = (title) => {
    setExpandedSections(prev => ({ ...prev, [title]: !prev[title] }));
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
          {sidebarMode !== 'mini' && (
            <div className="flex items-center gap-2">
              <img src={logo} alt="ClassRex" className="h-10 w-auto object-contain" />
            </div>
          )}
          <button 
            onClick={() => setSidebarMode(sidebarMode === 'mini' ? 'full' : 'mini')} 
            className={`p-2 rounded-xl hover:bg-gray-100/50 text-${themeColor} transition-all active:scale-95`}
          >
            {sidebarMode === 'mini' ? <ChevronRight size={24} /> : <ChevronLeft size={24} />}
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
                
                <div className={`space-y-1 transition-all duration-300 ${isExpanded || sidebarMode === 'mini' ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden pointer-events-none'}`}>
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
                        {tool.icon ? (
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
            <EyeOff size={20} />
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
                <Menu size={24} />
              </button>
              <img src={logo} alt="ClassRex" className="h-8 w-auto object-contain lg:hidden" />
              
              {/* Privacy Badges - Visible on Desktop Top Left */}
              <div className="hidden xl:flex items-center gap-2">
                <div className="flex items-center gap-1.5 bg-green-500/10 text-green-700 px-3 py-1.5 rounded-xl text-[10px] font-black tracking-wider border border-green-500/10 shadow-sm whitespace-nowrap">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                  100% LOCAL STORAGE
                </div>
                <div className="flex items-center gap-1.5 bg-blue-500/10 text-blue-700 px-3 py-1.5 rounded-xl text-[10px] font-black tracking-wider border border-blue-500/10 shadow-sm whitespace-nowrap">
                  NO COOKIES
                </div>
                <div className="flex items-center gap-1.5 bg-purple-500/10 text-purple-700 px-3 py-1.5 rounded-xl text-[10px] font-black tracking-wider border border-purple-500/10 shadow-sm whitespace-nowrap">
                  NO CLOUD ACCESS
                </div>
              </div>
            </div>
            
            {/* Desktop Navigation Tabs */}
            <div className="hidden lg:flex items-center p-1.5 bg-gray-100/50 rounded-2xl gap-1">
              <img src={logo} alt="ClassRex" className="h-10 w-auto object-contain mr-4 ml-2" />
              {['Teacher Tools', 'Classroom Games', 'Student Tools'].map(tab => {
                const isTabActive = activeTab === tab;
                const tabColorClass = tab === 'Teacher Tools' ? 'primary' : tab === 'Classroom Games' ? 'secondary' : 'accent';
                
                return (
                  <button
                    key={tab}
                    onClick={() => onTabChange(tab)}
                    className={`px-8 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 ${
                      isTabActive
                        ? `bg-white text-${tabColorClass} shadow-md scale-[1.02]`
                        : 'text-slate-400 hover:text-slate-600 hover:bg-white/30'
                    }`}
                  >
                    {tab}
                  </button>
                )
              })}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsAboutOpen(true)}
                className="p-3 rounded-2xl hover:bg-gray-100/80 text-slate-600 transition-all active:scale-90"
                title="About ClassRex"
              >
                <Info size={24} />
              </button>

              <button
                onClick={() => setIsSettingsOpen(true)}
                className="p-3 rounded-2xl hover:bg-gray-100/80 text-slate-600 transition-all active:scale-90 hover:rotate-45"
                title="Settings"
              >
                <Settings size={24} />
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
                    className={`flex-1 px-4 py-2.5 whitespace-nowrap font-bold text-xs rounded-xl transition-all ${
                      isTabActive
                        ? `bg-white text-${tabColorClass} shadow-sm`
                        : 'text-slate-400 hover:text-slate-600'
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
          <div className="max-w-7xl mx-auto h-full">
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
