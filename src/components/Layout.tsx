import React, { useState, useEffect, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSettings } from '../contexts/SettingsContext';
import { useHeader } from '../contexts/HeaderContext';
import { SettingsModal } from './SettingsModal';
import { ToolHeader } from './shared/ToolHeader';
import { ThemeBackground } from './ThemeBackground';

import {
  Plus, ChevronRight, Menu,
  Settings, X, Home, ChevronDown, ChevronLeft, EyeOff, LayoutGrid, Info,
  Clock, Users, BookOpen, Dices, Settings2, Gamepad2, BookA, Calculator, Brain, Beaker, Music, Library, HelpCircle, LucideIcon
} from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { AboutModal } from './AboutModal';

import { tools, Tool, sectionIcons, sectionKeyMap, sectionEmojis } from '../data/tools';
import { FlagIcon } from './shared/FlagIcon';
import logo from '../assets/ClassRex_logo.png';
import { useIntl } from 'react-intl';

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


interface ToolGroup {
  title: string;
  mainSection: string;
  items: (Tool | { id: string; name: string; icon: LucideIcon; emoji: string })[];
  icon: LucideIcon;
  emoji: string;
}

interface LayoutProps {
  children: ReactNode;
  onNavigate: (tool: string) => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  currentTool: string;
}

export const Layout: React.FC<LayoutProps> = ({ children, onNavigate, activeTab, onTabChange, currentTool }) => {
  const intl = useIntl();

  const toolGroups = React.useMemo(() => {
    const dynamicGroups = tools.reduce<ToolGroup[]>((acc, tool) => {
      if (tool.hidden) return acc;
      let group = acc.find(g => g.title === tool.section && g.mainSection === tool.mainSection);
      if (!group) {
        group = {
          title: tool.section,
          mainSection: tool.mainSection,
          items: [],
          icon: sectionIcons[tool.section] || LayoutGrid,
          emoji: sectionEmojis[tool.section] || '🛠️'
        };
        acc.push(group);
      }
      group.items.push(tool);
      return acc;
    }, []);

    return [
      ...dynamicGroups.filter(g => g.title === 'Word Management'),
      {
        title: '',
        mainSection: 'All',
        items: [
          { id: 'home', name: intl.formatMessage({ id: 'nav.dashboard', defaultMessage: 'Dashboard' }), icon: Home, emoji: '🏠' },
        ],
        icon: Home,
        emoji: '🏠'
      },
      ...dynamicGroups.filter(g => g.title !== 'Word Management')
    ];
  }, [intl]);

  const [sidebarMode, setSidebarMode] = useLocalStorage<'hidden' | 'mini' | 'full'>('layout_sidebar_mode', 
    window.innerWidth < 1024 ? 'hidden' : 'mini'
  );

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setSidebarMode(prev => (prev !== 'hidden' && window.innerWidth < 1024) ? 'hidden' : prev);
      } else {
        setSidebarMode(prev => prev === 'hidden' ? 'mini' : prev);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setSidebarMode]);

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const { settings } = useSettings();
  const {
    headerActions, headerInfo, helpContent, clearHeader,
    activeOverlay, setActiveOverlay, isFullscreen
  } = useHeader();

  const currentToolMetadata = tools.find(t => t.id === currentTool);

  useEffect(() => {
    if (currentTool && currentTool !== 'home') {
      const activeGroup = toolGroups.find(g => g.items.some(i => i.id === currentTool));
      if (activeGroup && activeGroup.title) {
        setExpandedSections({ [activeGroup.title]: true });
      }
    } else {
      setExpandedSections({});
    }

    return () => {
      clearHeader();
    };
  }, [currentTool, clearHeader, toolGroups]);

  const toggleSection = (title: string) => {
    setExpandedSections(prev => prev[title] ? {} : { [title]: true });
  };

  const filteredGroups = toolGroups.filter(group => {
    if (group.mainSection === 'All') return true;
    return group.mainSection === activeTab;
  });

  const getThemeColorClass = () => {
    if (activeTab === 'Teacher Tools' || activeTab === intl.formatMessage({ id: 'nav.teacher_tools' })) return 'primary';
    if (activeTab === 'Classroom Games' || activeTab === intl.formatMessage({ id: 'nav.classroom_games' })) return 'secondary';
    return 'accent';
  };

  const themeColor = getThemeColorClass();

  const renderOverlayContent = (content: ReactNode) => {
    if (!content) return null;
    if (typeof content === 'string') {
      return <p>{content}</p>;
    }
    if (Array.isArray(content)) {
      return (
        <div className="space-y-4">
          {content.map((item, i) => {
            if (typeof item === 'string') {
              const [title, ...rest] = item.split(':');
              if (rest.length > 0 && title.length < 40) {
                return (
                  <p key={i}>
                    <strong className="text-white">{title}:</strong>
                    {rest.join(':')}
                  </p>
                );
              }
              return <p key={i}>{item}</p>;
            }
            return <React.Fragment key={i}>{item as ReactNode}</React.Fragment>;
          })}
        </div>
      );
    }
    return content;
  };

  return (
    <div className="flex h-screen overflow-hidden bg-transparent font-['Outfit']">
      <ThemeBackground />
      {/* Sidebar */}
      {!isFullscreen && (
        <aside
          className={`fixed inset-y-4 left-4 z-50 glass-card rounded-[3rem] transition-all duration-700 cubic-bezier(0.4, 0, 0.2, 1) flex flex-col shadow-2xl ${sidebarMode === 'hidden' ? '-translate-x-[120%]' : 'translate-x-0'
            } ${sidebarMode === 'mini' ? 'w-24' : 'w-80'}`}
        >
          <div className={`flex ${sidebarMode === 'mini' ? 'flex-col gap-4 p-3 pt-6' : 'items-center p-6 justify-between'}`}>
            <button
              onClick={() => onNavigate('home')}
              className={`flex items-center transition-all active:scale-95 group ${sidebarMode === 'mini' ? 'flex-col gap-2' : 'gap-3'}`}
              title="Go to Dashboard"
            >
              <motion.img
                whileHover={{ rotate: 15, scale: 1.1 }}
                src={logo}
                alt="ClassRex"
                className={`${sidebarMode === 'mini' ? 'h-10' : 'h-10'} w-auto object-contain drop-shadow-md`}
              />
              <span className={`${sidebarMode === 'mini' ? 'text-[9px] text-slate-400 uppercase tracking-[0.2em] font-medium' : 'text-2xl font-medium text-slate-800 tracking-tighter'}`}>
                ClassRex
              </span>
            </button>

            <button
              onClick={() => setSidebarMode(sidebarMode === 'mini' ? 'full' : 'mini')}
              className={`p-2.5 rounded-2xl hover:bg-slate-100/80 text-${themeColor} transition-all active:scale-90`}
            >
              {sidebarMode === 'mini' ? <span className="text-2xl">👉</span> : <span className="text-2xl">👈</span>}
            </button>
          </div>

          <nav className={`flex-1 overflow-y-auto custom-scrollbar py-2 ${sidebarMode === 'mini' ? 'px-3' : 'px-4'} space-y-1`}>
            {filteredGroups.map((group, idx) => {
              const isExpanded = group.title === '' || expandedSections[group.title];
              const SectionIcon = group.icon || LayoutGrid;

              return (
                <React.Fragment key={idx}>
                  {/* Separator for Mini Mode */}
                  {sidebarMode === 'mini' && idx > 0 && (
                    <div className="mx-auto w-8 h-px bg-slate-100/80 my-1" />
                  )}

                  <div className="space-y-2">
                    {group.title && (
                      <button
                        onClick={() => toggleSection(group.title)}
                        className={`flex items-center transition-all group ${sidebarMode === 'mini'
                            ? 'w-[calc(100%-12px)] mx-auto justify-center p-2.5 rounded-2xl'
                            : 'w-full justify-between px-3 py-2 text-[11px] font-medium uppercase tracking-[0.25em]'
                          } ${isExpanded
                            ? sidebarMode === 'mini' ? 'bg-slate-100/80 text-' + themeColor : 'text-' + themeColor
                            : 'text-slate-400 hover:text-' + themeColor + ' ' + (sidebarMode === 'mini' ? 'hover:bg-slate-50' : '')
                          }`}
                        title={sidebarMode === 'mini' ? group.title : ''}
                      >
                        <div className={`flex items-center ${sidebarMode === 'mini' ? 'justify-center w-10 h-10' : 'gap-2'}`}>
                          {settings.theme === 'early-years' ? (
                            <span className={sidebarMode === 'mini' ? 'text-2xl leading-none' : 'text-sm'}>{group.emoji || '🛠️'}</span>
                          ) : (
                            <group.icon size={sidebarMode === 'mini' ? 24 : 16} strokeWidth={2.5} />
                          )}
                          {sidebarMode !== 'mini' && (
                            <span>
                              {intl.formatMessage({
                                id: sectionKeyMap[group.title] || 'section.unknown',
                                defaultMessage: group.title
                              })}
                            </span>
                          )}
                        </div>
                        {sidebarMode !== 'mini' && (
                          <ChevronDown size={14} className={`transform transition-transform duration-500 ${isExpanded ? 'rotate-180' : ''}`} />
                        )}
                      </button>
                    )}

                    <AnimatePresence initial={false}>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="space-y-1 overflow-hidden"
                        >
                          {group.items.map((tool) => {
                            const isActive = tool.id === currentTool;
                            return (
                              <button
                                key={tool.id}
                                onClick={() => onNavigate(tool.id)}
                                title={sidebarMode === 'mini' ? tool.name : ''}
                                className={`group relative flex items-center transition-all duration-300 ${sidebarMode === 'mini' ? 'w-[calc(100%-12px)] mx-auto justify-center p-2.5' : 'w-full px-4 py-2.5 space-x-3'
                                  } rounded-2xl ${isActive
                                    ? `bg-${themeColor} text-white shadow-xl shadow-${themeColor}/30 scale-[1.05] z-10`
                                    : `hover:bg-white/60 text-slate-500 ${settings.theme === 'early-years' ? '' : `hover:text-${themeColor}`}`
                                  }`}
                              >
                                <div className={`flex items-center justify-center transform transition-transform duration-300 ${sidebarMode === 'mini' ? 'w-10 h-10' : 'w-6 h-6'} ${isActive ? '' : 'group-hover:scale-125 group-hover:rotate-6'}`}>
                                  {settings.theme === 'early-years' ? (
                                    <span className="text-2xl leading-none">{tool.emoji || '🛠️'}</span>
                                  ) : (
                                    <tool.icon size={sidebarMode === 'mini' ? 22 : 18} strokeWidth={isActive ? 3 : 2.5} />
                                  )}
                                </div>
                                {sidebarMode !== 'mini' && (
                                  <span className="text-sm font-medium truncate">
                                    {intl.formatMessage({ id: `tool.${tool.id}.name`, defaultMessage: tool.name })}
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </React.Fragment>
              );
            })}
          </nav>

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-slate-100 flex justify-center">
            <button
              onClick={() => setSidebarMode('hidden')}
              className="p-4 text-slate-300 hover:text-rose-500 transition-all rounded-2xl hover:bg-rose-50/80 active:scale-90"
              title="Hide Sidebar"
            >
              {settings.theme === 'early-years' ? (
                <span className="text-2xl">🙈</span>
              ) : (
                <ChevronLeft size={24} strokeWidth={3} />
              )}
            </button>
          </div>
        </aside>
      )}

      {/* Main Content */}
      <div className={`flex-1 flex flex-col overflow-hidden relative transition-all duration-700 cubic-bezier(0.4, 0, 0.2, 1) ${isFullscreen ? 'lg:pl-0' : sidebarMode === 'mini' ? 'lg:pl-32' : sidebarMode === 'full' ? 'lg:pl-[22rem]' : 'lg:pl-0'
        }`}>
        {/* Floating Sidebar Toggle - Only when hidden */}
        {sidebarMode === 'hidden' && !isFullscreen && (
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="fixed left-0 top-1/2 -translate-y-1/2 z-40 flex flex-col gap-3"
          >
            {/* Dashboard Link */}
            <button
              onClick={() => onNavigate('home')}
              className="bg-white/90 backdrop-blur-xl shadow-2xl border border-white/40 p-4 rounded-r-2xl text-slate-600 hover:bg-slate-50 transition-all active:scale-95 group flex items-center justify-center overflow-hidden"
              title="Go to Dashboard"
            >
              <motion.img
                whileHover={{ rotate: 15, scale: 1.1 }}
                src={logo}
                alt="ClassRex"
                className="h-8 w-auto object-contain drop-shadow-sm"
              />
            </button>

            {/* Expand Toggle */}
            <button
              onClick={() => setSidebarMode('mini')}
              className={`bg-white/90 backdrop-blur-xl shadow-2xl border border-white/40 p-5 rounded-r-[3rem] text-${themeColor} hover:bg-${themeColor} hover:text-white transition-all group active:scale-95 flex items-center justify-center`}
              title="Show Sidebar"
            >
              <ChevronRight size={28} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>
        )}

        {/* Top Bar */}
        {!isFullscreen && (
          <header className="pt-2 md:pt-6 px-2 md:px-10 z-10">
            <div className="max-w-7xl mx-auto h-16 md:h-24 flex items-center justify-between px-4 md:px-8 glass-card rounded-[3rem] shadow-2xl shadow-slate-200/50">
              <div className="flex items-center gap-6">
                <button
                  onClick={() => setSidebarMode(sidebarMode === 'hidden' ? 'full' : 'hidden')}
                  className="lg:hidden p-3 rounded-2xl hover:bg-slate-100 text-slate-600 active:scale-90"
                >
                  <span className="text-2xl">🍔</span>
                </button>
                <img src={logo} alt="ClassRex" className="h-10 w-auto object-contain lg:hidden" />

                {/* Privacy Badges - Visible on Desktop Top Left */}
                <div className="hidden lg:flex items-center gap-6">
                  <div
                    className="flex items-center gap-3 mr-4 cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => onNavigate('home')}
                  >
                    <motion.img
                      whileHover={{ scale: 1.1, rotate: -10 }}
                      src={logo}
                      alt="ClassRex"
                      className="h-12 w-auto object-contain drop-shadow-md"
                    />
                    <span className="text-2xl font-black text-slate-800 tracking-tighter">ClassRex</span>
                  </div>
                  <div className="flex items-center bg-slate-50/50 rounded-2xl p-1.5 border border-slate-100 gap-1">
                    <div className="flex items-center justify-center p-1">
                      <NoCookieIcon />
                    </div>
                    <div className="w-px h-6 bg-slate-200" />
                    <div className="flex items-center justify-center p-1">
                      <NoCloudIcon />
                    </div>
                    <div className="w-px h-6 bg-slate-200" />
                    <div className="flex items-center justify-center p-1" title="Current Language">
                      <FlagIcon
                        country={
                          settings.language === 'zh' ? 'CN' :
                            settings.language === 'fr' ? 'FR' :
                              settings.language === 'th' ? 'TH' :
                                settings.language === 'vi' ? 'VN' :
                                  settings.language === 'ja' ? 'JP' : 'AU'
                        }
                        className="w-[22px] h-[15px] shadow-sm rounded-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Desktop Navigation Tabs */}
              <div className="hidden lg:flex items-center p-1.5 bg-slate-100/50 backdrop-blur-md rounded-[1.75rem] gap-1.5 border border-slate-200/50">
                {['Teacher Tools', 'Classroom Games', 'Student Tools'].map(tab => {
                  const isTabActive = activeTab === tab && currentTool !== 'config';
                  const tabColorClass = tab === 'Teacher Tools' ? 'primary' : tab === 'Classroom Games' ? 'secondary' : 'accent';

                  const tabLabel = tab === 'Teacher Tools'
                    ? intl.formatMessage({ id: 'nav.teacher_tools', defaultMessage: 'Teacher Tools' })
                    : tab === 'Classroom Games'
                      ? intl.formatMessage({ id: 'nav.classroom_games', defaultMessage: 'Classroom Games' })
                      : intl.formatMessage({ id: 'nav.student_tools', defaultMessage: 'Student Tools' });

                  return (
                    <button
                      key={tab}
                      onClick={() => onTabChange(tab)}
                      className={`px-8 py-3.5 rounded-[1.25rem] font-black text-xs uppercase tracking-widest transition-all duration-500 border-2 relative overflow-hidden group ${isTabActive
                          ? `bg-${tabColorClass} border-${tabColorClass} text-white shadow-xl shadow-${tabColorClass}/30 scale-105 z-10`
                          : `bg-transparent border-transparent text-slate-400 hover:text-${tabColorClass} hover:bg-white`
                        }`}
                    >
                      <span className="relative z-10">{tabLabel}</span>
                      {isTabActive && (
                        <motion.div
                          layoutId="active-tab-glow"
                          className={`absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent`}
                        />
                      )}
                    </button>
                  )
                })}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveOverlay('about')}
                  className={`p-3 rounded-2xl transition-all active:scale-90 ${activeOverlay === 'about' ? 'bg-indigo-600 text-white shadow-lg' : 'hover:bg-slate-100/80 text-slate-600'}`}
                  title="About ClassRex"
                >
                  {settings.theme === 'early-years' ? (
                    <span className="text-2xl">ℹ️</span>
                  ) : (
                    <Info size={24} strokeWidth={2.5} />
                  )}
                </button>

                <button
                  onClick={() => onNavigate('config')}
                  className={`p-3 rounded-2xl transition-all active:scale-90 ${currentTool === 'config' ? 'bg-indigo-600 text-white shadow-lg' : 'hover:bg-slate-100/80 text-slate-600'}`}
                  title={intl.formatMessage({ id: 'nav.settings', defaultMessage: 'Settings' })}
                >
                  {settings.theme === 'early-years' ? (
                    <span className="text-2xl">⚙️</span>
                  ) : (
                    <Settings2 size={24} strokeWidth={2.5} />
                  )}
                </button>
              </div>
            </div>

            {/* Mobile Navigation Tabs */}
            <div className="lg:hidden mt-2 flex items-center p-1 bg-white/50 backdrop-blur-md rounded-xl overflow-x-auto no-scrollbar border border-white/50">
              {['Teacher Tools', 'Classroom Games', 'Student Tools'].map(tab => {
                const isTabActive = activeTab === tab && currentTool !== 'config';
                const tabColorClass = tab === 'Teacher Tools' ? 'primary' : tab === 'Classroom Games' ? 'secondary' : 'accent';

                const tabLabel = tab === 'Teacher Tools'
                  ? intl.formatMessage({ id: 'nav.teacher_tools', defaultMessage: 'Teacher Tools' })
                  : tab === 'Classroom Games'
                    ? intl.formatMessage({ id: 'nav.classroom_games', defaultMessage: 'Classroom Games' })
                    : intl.formatMessage({ id: 'nav.student_tools', defaultMessage: 'Student Tools' });

                return (
                  <button
                    key={tab}
                    onClick={() => onTabChange(tab)}
                    className={`flex-1 px-6 py-3.5 whitespace-nowrap font-black text-[10px] uppercase tracking-wider rounded-xl transition-all border-2 ${isTabActive
                        ? `bg-${tabColorClass} border-${tabColorClass} text-white shadow-lg`
                        : `bg-transparent border-transparent text-slate-400`
                      }`}
                  >
                    {tabLabel}
                  </button>
                )
              })}
            </div>
          </header>
        )}

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-2 md:pt-4 md:pb-4 md:px-10 custom-scrollbar">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full h-full max-w-7xl mx-auto flex flex-col"
          >
            {currentToolMetadata && currentTool !== 'home' && (
              <ToolHeader
                title={currentToolMetadata.name}
                icon={currentToolMetadata.icon}
              >
                {headerActions}
              </ToolHeader>
            )}
            {children}
          </motion.div>
        </main>
      </div>

      {/* Modals & Overlays */}
      <AnimatePresence>
        {activeOverlay === 'about' && <AboutModal onClose={() => setActiveOverlay(null)} />}

        {(activeOverlay === 'info' || activeOverlay === 'help') && (
          <div
            className="fixed inset-0 z-[100] pointer-events-none"
            onClick={() => setActiveOverlay(null)}
          >
            <div className="max-w-7xl mx-auto w-full h-full relative px-10">
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute top-48 md:top-64 right-12 md:right-16 w-[calc(100vw-4rem)] md:w-96 bg-slate-800 text-white p-8 rounded-[3rem] shadow-2xl pointer-events-auto text-sm leading-relaxed border border-white/10 premium-shadow"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-white/10">
                      {activeOverlay === 'info' ? <Info size={16} className="text-white" /> : <HelpCircle size={16} className="text-white" />}
                    </div>
                    <span className="font-black tracking-widest text-xs uppercase text-white/70">
                      {activeOverlay === 'info' ? 'Tool Information' : 'How to Use'}
                    </span>
                  </div>
                  <button
                    onClick={() => setActiveOverlay(null)}
                    className="text-white/40 hover:text-white transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-4 text-slate-300 font-medium overflow-y-auto max-h-[60vh] custom-scrollbar pr-2">
                  {renderOverlayContent(activeOverlay === 'info' ? (headerInfo || currentToolMetadata?.infoContent) : (helpContent || currentToolMetadata?.helpContent))}
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Mobile Sidebar Overlay */}
      {sidebarMode !== 'hidden' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-800/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarMode('hidden')}
        />
      )}
    </div>
  );
};
