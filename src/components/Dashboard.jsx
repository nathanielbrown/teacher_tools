// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import React from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { tools, mainSections } from '../data/tools';

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

export const Dashboard = ({ onNavigate, activeTab }) => {
  const { settings } = useSettings();
  const isEarlyYears = settings.theme === 'early-years';

  const activeMainSection = mainSections.find(m => m.title === activeTab);
  if (!activeMainSection) return null;

  const getThemeColors = () => {
    if (activeTab === 'Teacher Tools') return { text: 'text-primary', border: 'border-primary/20', bg: 'bg-primary/5', accent: 'primary', iconBg: 'bg-primary/10' };
    if (activeTab === 'Classroom Games') return { text: 'text-secondary', border: 'border-secondary/20', bg: 'bg-secondary/5', accent: 'secondary', iconBg: 'bg-secondary/10' };
    return { text: 'text-accent', border: 'border-accent/20', bg: 'bg-accent/5', accent: 'accent', iconBg: 'bg-accent/10' };
  };

  const colors = getThemeColors();

  return (
    <div className="space-y-6 pb-6 font-['Outfit']">
      <div className="flex flex-col items-center text-center space-y-2">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`text-4xl font-black tracking-tight ${colors.text} drop-shadow-sm`}
        >
          {isEarlyYears ? '🌟 Welcome! 🌟' : activeTab}
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-slate-500 font-medium text-lg"
        >
          {activeTab === 'Teacher Tools' ? 'Manage your classroom with ease' : 
           activeTab === 'Classroom Games' ? 'Engage your students with fun games' : 
           'Empower student learning through interactive tools'}
        </motion.p>
      </div>

      <div className={`glass-card p-6 md:p-10 rounded-[3rem] space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700`}>
        <div className="space-y-8">
          {activeMainSection.subSections.map(subSection => {
            const sectionTools = tools.filter(t => t.mainSection === activeMainSection.title && t.section === subSection);
            if (sectionTools.length === 0) return null;

            return (
              <div key={subSection} className="space-y-4">
                {(activeMainSection.title === 'Teacher Tools' || activeMainSection.title === 'Student Tools') && (
                  <div className="flex items-center gap-4">
                    <h3 className="text-2xl font-black text-slate-800 tracking-tight">{subSection}</h3>
                    <div className={`flex-1 h-px bg-gradient-to-r from-slate-200 to-transparent`} />
                  </div>
                )}
                <motion.div
                  className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
                  variants={containerVariants}
                  initial="hidden"
                  animate="show"
                >
                  {sectionTools.map((tool) => {
                    const Icon = tool.icon;
                    return (
                      <motion.button
                        key={tool.id}
                        variants={itemVariants}
                        whileHover={{ scale: 1.05, y: -5 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => onNavigate(tool.id)}
                        className={`group relative bg-white/50 hover:bg-white p-4 rounded-[1.5rem] shadow-sm hover:shadow-2xl hover:shadow-${colors.accent}/10 transition-all duration-300 border-2 border-transparent hover:border-${colors.accent}/20 flex flex-col items-center text-center gap-3 h-full`}
                      >
                        <div 
                          className={`p-3 rounded-xl transition-all duration-300 group-hover:scale-110 group-hover:rotate-3`}
                          style={{ backgroundColor: isEarlyYears ? `${tool.color}15` : undefined }}
                        >
                          {isEarlyYears ? (
                            <span className="text-3xl filter drop-shadow-sm leading-none">{tool.emoji}</span>
                          ) : (
                            <Icon 
                              size={28} 
                              className={colors.text} 
                            />
                          )}
                        </div>
                        <div className="space-y-1">
                          <span className="text-sm font-bold text-slate-800 block leading-tight">
                            {tool.name}
                          </span>
                        </div>
                      </motion.button>
                    )
                  })}
                </motion.div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};