import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Info } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';
import { tools } from '../data/tools';

export const ToolHeader = ({ 
  title, 
  icon: Icon, 
  description, 
  infoContent, 
  children,
  color = 'indigo'
}) => {
  const [showInfo, setShowInfo] = useState(false);
  const { settings } = useSettings();
  const isEarlyYears = settings.theme === 'early-years';
  
  // Find emoji for this tool if not provided
  const toolEmoji = tools.find(t => t.name === title)?.emoji;

  const colorClasses = {
    indigo: 'bg-indigo-50 text-indigo-600',
    blue: 'bg-blue-50 text-blue-600',
    rose: 'bg-rose-50 text-rose-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    purple: 'bg-purple-50 text-purple-600',
    slate: 'bg-slate-50 text-slate-600'
  };

  const selectedColorClass = colorClasses[color] || colorClasses.indigo;
  const infoButtonColorClass = showInfo 
    ? (color === 'indigo' ? 'bg-indigo-600 text-white shadow-md' : `bg-${color}-600 text-white shadow-md`)
    : (color === 'indigo' ? 'text-slate-300 hover:text-indigo-500 hover:bg-indigo-50' : `text-slate-300 hover:text-${color}-500 hover:bg-${color}-50`);

  return (
    <div className="bg-white rounded-[2rem] p-4 shadow-xl border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        {isEarlyYears && toolEmoji ? (
          <div className={`p-2 rounded-2xl ${selectedColorClass} flex items-center justify-center`}>
            <span className="text-3xl">{toolEmoji}</span>
          </div>
        ) : Icon ? (
          <div className={`p-3 rounded-2xl ${selectedColorClass}`}>
            <Icon size={24} />
          </div>
        ) : null}
        <div className="relative">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">{title}</h2>
            {infoContent && (
              <button 
                onClick={() => setShowInfo(!showInfo)}
                className={`p-1.5 rounded-full transition-all ${infoButtonColorClass}`}
              >
                <Info size={18} />
              </button>
            )}
          </div>
          {description && (
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">{description}</p>
          )}
          
          <AnimatePresence>
            {showInfo && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute top-full left-0 mt-4 w-80 bg-slate-900 text-white p-6 rounded-[2rem] shadow-2xl z-[100] text-sm leading-relaxed border border-white/10"
              >
                <div className={`flex items-center gap-2 mb-4 font-black tracking-widest text-xs uppercase ${color === 'indigo' ? 'text-indigo-400' : `text-${color}-400`}`}>
                  <Info size={16} />
                  Tool Guide
                </div>
                <div className="space-y-4 text-slate-300">
                  {infoContent}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      {children && (
        <div className="flex items-center gap-3">
          {children}
        </div>
      )}
    </div>
  );
};
