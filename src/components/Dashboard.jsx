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
    <div className="space-y-12 pb-12 font-['Outfit']">
      <div className="flex flex-col items-center text-center space-y-4">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`text-6xl font-black tracking-tight ${colors.text} drop-shadow-sm`}
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

      <div className={`glass-card p-10 rounded-[3rem] space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700`}>
        <div className="space-y-16">
          {activeMainSection.subSections.map(subSection => {
            const sectionTools = tools.filter(t => t.mainSection === activeMainSection.title && t.section === subSection);
            if (sectionTools.length === 0) return null;

            return (
              <div key={subSection} className="space-y-8">
                {(activeMainSection.title === 'Teacher Tools' || activeMainSection.title === 'Student Tools') && (
                  <div className="flex items-center gap-4">
                    <h3 className="text-2xl font-black text-slate-800 tracking-tight">{subSection}</h3>
                    <div className={`flex-1 h-px bg-gradient-to-r from-slate-200 to-transparent`} />
                  </div>
                )}
                <motion.div
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
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
                        className={`group relative bg-white/50 hover:bg-white p-6 rounded-[2rem] shadow-sm hover:shadow-2xl hover:shadow-${colors.accent}/10 transition-all duration-300 border-2 border-transparent hover:border-${colors.accent}/20 flex flex-col items-center text-center gap-5 h-full`}
                      >
                        <div 
                          className={`p-5 rounded-2xl transition-all duration-300 group-hover:scale-110 group-hover:rotate-3`}
                          style={{ backgroundColor: isEarlyYears ? `${tool.color}15` : undefined }}
                        >
                          <Icon 
                            size={40} 
                            className={isEarlyYears ? '' : colors.text} 
                            style={{ color: isEarlyYears ? tool.color : undefined }}
                          />
                        </div>
                        <div className="space-y-1">
                          <span className="text-lg font-bold text-slate-800 block leading-tight">
                            {tool.name}
                          </span>
                        </div>
                        
                        {/* Decorative background element */}
                        <div 
                          className={`absolute top-0 right-0 w-24 h-24 rounded-full -mr-12 -mt-12 transition-transform duration-500 group-hover:scale-150`} 
                          style={{ backgroundColor: isEarlyYears ? `${tool.color}08` : undefined }}
                        />
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