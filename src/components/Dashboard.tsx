import { motion } from 'framer-motion';
import React from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { tools, mainSections, sectionKeyMap } from '../data/tools';
import { FormattedMessage, useIntl } from 'react-intl';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

interface DashboardProps {
  onNavigate: (tool: string) => void;
  activeTab: string;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate, activeTab }) => {
  const { settings } = useSettings();
  const intl = useIntl();
  const [isMobile, setIsMobile] = React.useState(typeof window !== 'undefined' ? window.innerWidth < 1024 : false);

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const isEarlyYears = settings.theme === 'early-years';
  const isNature = settings.theme === 'primary';

  const activeMainSection = mainSections.find(m => m.title === activeTab);
  if (!activeMainSection) return null;

  const getThemeColors = () => {
    if (activeTab === 'Teacher Tools') return { text: 'text-primary', border: 'border-primary/20', bg: 'bg-primary/5', accent: 'primary', iconBg: 'bg-primary/10', gradient: 'from-primary/20 to-primary/5' };
    if (activeTab === 'Classroom Games') return { text: 'text-secondary', border: 'border-secondary/20', bg: 'bg-secondary/5', accent: 'secondary', iconBg: 'bg-secondary/10', gradient: 'from-secondary/20 to-secondary/5' };
    return { text: 'text-accent', border: 'border-accent/20', bg: 'bg-accent/5', accent: 'accent', iconBg: 'bg-accent/10', gradient: 'from-accent/20 to-accent/5' };
  };

  const colors = getThemeColors();

  return (
    <div className="space-y-8 pb-12 font-['Outfit']">
      <div className="flex flex-col items-center text-center space-y-4 px-4 italic">
        
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`text-4xl md:text-6xl font-black tracking-tight text-slate-800 drop-shadow-sm`}
        >
          {isEarlyYears ? (
            <FormattedMessage id="dashboard.title.earlyYears" defaultMessage="🌟 Discover & Play! 🌟" />
          ) : isNature ? (
            <FormattedMessage 
              id="dashboard.title.nature" 
              defaultMessage="Explore {section}" 
              values={{ section: activeTab }} 
            />
          ) : (
            intl.formatMessage({ id: `dashboard.section.${activeTab.toLowerCase().replace(/\s+/g, '')}.title`, defaultMessage: activeTab })
          )}
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-slate-500 font-medium text-lg max-w-2xl"
        >
          {activeTab === 'Teacher Tools' ? (
            <FormattedMessage id="dashboard.desc.teacherTools" defaultMessage="Everything you need to manage and inspire your classroom." />
          ) : activeTab === 'Classroom Games' ? (
            <FormattedMessage id="dashboard.desc.classroomGames" defaultMessage="Fun and educational games to boost engagement." />
          ) : (
            <FormattedMessage id="dashboard.desc.studentTools" defaultMessage="Interactive tools designed to empower student learning." />
          )}
        </motion.p>
      </div>

      <div className={`glass-card p-6 md:p-12 rounded-[3.5rem] space-y-16 shadow-2xl shadow-slate-200/50`}>
        <div className="space-y-12">
          {activeMainSection.subSections.map((subSection, sectionIdx) => {
            const sectionTools = tools.filter(t => {
              if (t.hidden) return false;
              if (t.mainSection !== activeMainSection.title || t.section !== subSection.name) return false;
              if (settings.selectedYear === 'All') return true;
              
              const yearNum = settings.selectedYear === 'Prep' ? 0 : parseInt(settings.selectedYear);
              return yearNum >= t.yearRange[0] && yearNum <= t.yearRange[1];
            });
            if (sectionTools.length === 0) return null;

            const SectionIcon = subSection.icon;

            return (
              <motion.div 
                key={subSection.name} 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: sectionIdx * 0.1 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-6 px-2 italic">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-2xl ${colors.iconBg} ${colors.text} flex items-center justify-center`}>
                      {isEarlyYears ? (
                        <span className="text-2xl leading-none">{subSection.emoji}</span>
                      ) : (
                        <SectionIcon size={24} strokeWidth={2.5} />
                      )}
                    </div>
                    <h3 className={`text-2xl font-black text-slate-800 tracking-tight`}>
                      {intl.formatMessage({ id: sectionKeyMap[subSection.name] || `dashboard.subsection.${subSection.name.toLowerCase().replace(/[^a-z0-9]/g, '')}`, defaultMessage: subSection.name })}
                    </h3>
                  </div>
                  <div className={`flex-1 h-px bg-gradient-to-r from-slate-200 via-slate-100 to-transparent`} />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                    <FormattedMessage 
                      id="dashboard.toolCount" 
                      defaultMessage="{count} {count, plural, one {Tool} other {Tools}}" 
                      values={{ count: sectionTools.length }} 
                    />
                  </span>
                </div>

                <motion.div
                  className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 md:gap-6"
                  variants={containerVariants}
                  initial="hidden"
                  animate="show"
                >
                  {sectionTools.map((tool) => {
                    const Icon = tool.icon;
                    const toolColor = tool.color || '#6366f1';
                    
                    return (
                      <motion.button
                        key={tool.id}
                        variants={itemVariants}
                        whileHover={{ 
                          scale: 1.05, 
                          y: -8,
                          transition: { type: "spring", stiffness: 400, damping: 10 }
                        }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => onNavigate(tool.id)}
                        className={`group relative bg-white/40 hover:bg-white p-1.5 md:p-6 rounded-[1.2rem] md:rounded-[2rem] border border-white transition-all duration-500 flex flex-col items-center text-center gap-1.5 md:gap-4 h-full shadow-lg hover:shadow-2xl hover:shadow-${colors.accent}/10`}
                      >
                        {/* Hover Gradient Overlay */}
                        <div className={`absolute inset-0 rounded-[2rem] bg-gradient-to-br ${colors.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                        
                        <div 
                          className={`relative z-10 p-2 md:p-4 rounded-xl md:rounded-2xl transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 shadow-sm group-hover:shadow-lg flex items-center justify-center`}
                          style={{ 
                            backgroundColor: `${toolColor}15`,
                            color: toolColor
                          }}
                        >
                            <div className="filter drop-shadow-sm leading-none flex items-center justify-center transform group-hover:scale-110 transition-transform w-8 h-8 md:w-12 md:h-12">
                              {settings.theme === 'early-years' ? (
                                <span className="text-2xl md:text-4xl">{tool.emoji}</span>
                              ) : (
                                <Icon size={isMobile ? 24 : 40} strokeWidth={2.5} />
                              )}
                            </div>
                        </div>

                        <div className="relative z-10 space-y-1 italic">
                          <span className="text-[9px] md:text-sm font-black text-slate-800 block leading-tight group-hover:text-black transition-colors truncate w-full">
                            <FormattedMessage id={`tool.${tool.id.toLowerCase()}.name`} defaultMessage={tool.name} />
                          </span>
                        </div>

                        {isNature && (
                          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-100 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                      </motion.button>
                    )
                  })}
                </motion.div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};