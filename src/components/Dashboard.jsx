// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import React from 'react';
import { useSettings } from '../contexts/SettingsContext';

import {
  Clock, Timer, Hourglass, AlertCircle, Dices, Coins, Loader,
  Palette, Activity, BookOpen, UserCircle, Users, CalendarDays, Award, Star, Sparkles, Gamepad2, PenTool, Zap, Calculator, Banknote, Minus, X, Divide, PieChart, Circle, Cpu, Search, Eye, Rocket, Brain
} from 'lucide-react';

const tools = [
  // Teacher Tools - Time Management
  { id: 'clock', name: 'Analogue & Digital Clock', icon: Clock, emoji: '🕒', mainSection: 'Teacher Tools', section: 'Time Management' },
  { id: 'stopwatch', name: 'Stop Watch', icon: Timer, emoji: '⏱️', mainSection: 'Teacher Tools', section: 'Time Management' },
  { id: 'countdown', name: 'Count Down', icon: Hourglass, emoji: '⏳', mainSection: 'Teacher Tools', section: 'Time Management' },
  { id: 'examclock', name: 'Exam Clock', icon: AlertCircle, emoji: '📝', mainSection: 'Teacher Tools', section: 'Time Management' },
  { id: 'eventcountdowns', name: 'Event Countdowns', icon: CalendarDays, emoji: '🗓️', mainSection: 'Teacher Tools', section: 'Time Management' },
  // Teacher Tools - Classroom Management
  { id: 'dailyschedule', name: 'Daily Schedule', icon: Clock, emoji: '📅', mainSection: 'Teacher Tools', section: 'Classroom Management' },
  { id: 'groupmaker', name: 'Random Group Maker', icon: Users, emoji: '👥', mainSection: 'Teacher Tools', section: 'Classroom Management' },
  { id: 'groupscoreboard', name: 'Group Score Board', icon: Award, emoji: '🏆', mainSection: 'Teacher Tools', section: 'Classroom Management' },
  { id: 'marblejar', name: 'Marble Jar Reward', icon: Star, emoji: '⭐', mainSection: 'Teacher Tools', section: 'Classroom Management' },
  { id: 'emotionpicker', name: 'Emotion Picker', icon: UserCircle, emoji: '😊', mainSection: 'Teacher Tools', section: 'Classroom Management' },
  // Teacher Tools - Mathematics
  { id: 'fractiontool', name: 'Fraction Visualizer', icon: PieChart, emoji: '🍕', mainSection: 'Teacher Tools', section: 'Mathematics' },
  // Teacher Tools - Randomizers
  { id: 'diceroller', name: 'Dice Roller', icon: Dices, emoji: '🎲', mainSection: 'Teacher Tools', section: 'Randomizers' },
  { id: 'flipcoin', name: 'Flip a Coin', icon: Coins, emoji: '🪙', mainSection: 'Teacher Tools', section: 'Randomizers' },
  { id: 'numberspinner', name: 'Number Spinner', icon: Loader, emoji: '🎡', mainSection: 'Teacher Tools', section: 'Randomizers' },
  { id: 'casinospinner', name: 'Name Picker (Casino)', icon: UserCircle, emoji: '🎰', mainSection: 'Teacher Tools', section: 'Randomizers' },
  { id: 'wheelspinner', name: 'Name Picker (Wheel)', icon: Loader, emoji: '🎡', mainSection: 'Teacher Tools', section: 'Randomizers' },
  { id: 'groupnamegenerator', name: 'Group Name Generator', icon: Sparkles, emoji: '✨', mainSection: 'Teacher Tools', section: 'Randomizers' },
  // Teacher Tools - Other
  { id: 'colourpicker', name: 'Colour Picker', icon: Palette, emoji: '🎨', mainSection: 'Teacher Tools', section: 'Other' },
  { id: 'metronome', name: 'Metronome', icon: Activity, emoji: '🎵', mainSection: 'Teacher Tools', section: 'Other' },
  { id: 'storystarters', name: 'Story Starters', icon: BookOpen, emoji: '📖', mainSection: 'Teacher Tools', section: 'Other' },
  
  // Classroom Games
  { id: 'higherorlower', name: 'Higher or Lower', icon: Gamepad2, emoji: '⬆️', mainSection: 'Classroom Games', section: 'Games' },
  { id: 'revealword', name: 'Reveal Word', icon: Eye, emoji: '🕵️', mainSection: 'Classroom Games', section: 'Games' },
  
  // Student Tools
  { id: 'spelling', name: 'Spelling Practice', icon: PenTool, emoji: '📝', mainSection: 'Student Tools', section: 'Literacy' },
  { id: 'lettertracing', name: 'Letter Tracing', icon: PenTool, emoji: '✏️', mainSection: 'Student Tools', section: 'Literacy' },
  { id: 'findtheword', name: 'Find the Word', icon: Search, emoji: '🔍', mainSection: 'Student Tools', section: 'Literacy' },
  { id: 'typinggame', name: 'Typing Galaxy', icon: Rocket, emoji: '🚀', mainSection: 'Student Tools', section: 'Literacy' },
  { id: 'reactiontime', name: 'Reaction Time', icon: Zap, emoji: '⚡', mainSection: 'Student Tools', section: 'Science' },
  { id: 'timestable', name: 'Times Tables', icon: Calculator, emoji: '✖️', mainSection: 'Student Tools', section: 'Math' },
  { id: 'moneytool', name: 'Money Tool', icon: Banknote, emoji: '💵', mainSection: 'Student Tools', section: 'Math' },
  { id: 'missingaddition', name: 'Missing Addition', icon: Calculator, emoji: '➕', mainSection: 'Student Tools', section: 'Math' },
  { id: 'missingsubtraction', name: 'Missing Subtraction', icon: Minus, emoji: '➖', mainSection: 'Student Tools', section: 'Math' },
  { id: 'missingmultiplication', name: 'Missing Multiplier', icon: X, emoji: '✖️', mainSection: 'Student Tools', section: 'Math' },
  { id: 'missingdivision', name: 'Missing Division', icon: Divide, emoji: '➗', mainSection: 'Student Tools', section: 'Math' },
  { id: 'marblecounting', name: 'Marble Counting', icon: Circle, emoji: '🔮', mainSection: 'Student Tools', section: 'Math' },
  { id: 'binarynumbers', name: 'Binary Numbers', icon: Cpu, emoji: '💻', mainSection: 'Student Tools', section: 'Math' },
  { id: 'simongame', name: 'Simon Says', icon: Gamepad2, emoji: '🧠', mainSection: 'Student Tools', section: 'Memory & Games' },
  { id: 'emojimatch', name: 'Emoji Match', icon: Brain, emoji: '🧩', mainSection: 'Student Tools', section: 'Memory & Games' },
];

const mainSections = [
  { title: 'Teacher Tools', subSections: ['Time Management', 'Classroom Management', 'Randomizers', 'Other'] },
  { title: 'Classroom Games', subSections: ['Games'] },
  { title: 'Student Tools', subSections: ['Literacy', 'Math', 'Memory & Games', 'Science'] }
];

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
    if (activeTab === 'Teacher Tools') return { text: 'text-primary', border: 'border-primary/20', bg: 'bg-primary/10', hoverBorder: 'hover:border-primary', groupHoverBg: 'group-hover:bg-primary/20' };
    if (activeTab === 'Classroom Games') return { text: 'text-secondary', border: 'border-secondary/20', bg: 'bg-secondary/10', hoverBorder: 'hover:border-secondary', groupHoverBg: 'group-hover:bg-secondary/20' };
    return { text: 'text-accent', border: 'border-accent/20', bg: 'bg-accent/10', hoverBorder: 'hover:border-accent', groupHoverBg: 'group-hover:bg-accent/20' };
  };

  const colors = getThemeColors();

  return (
    <div className="max-w-7xl mx-auto space-y-16 pb-12">
      <h1 className={`text-5xl font-extrabold text-center mb-12 drop-shadow-sm ${colors.text}`}>
        {isEarlyYears ? '🌟 Welcome! 🌟' : 'Dashboard'}
      </h1>

      <div className={`bg-white/60 backdrop-blur-sm p-8 rounded-[3rem] shadow-xl border ${colors.border} space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-500`}>
        <h2 className={`text-4xl font-black border-b-4 pb-4 ${colors.text} ${colors.border}`}>{activeMainSection.title}</h2>
        
        <div className="space-y-12">
          {activeMainSection.subSections.map(subSection => {
            const sectionTools = tools.filter(t => t.mainSection === activeMainSection.title && t.section === subSection);
            if (sectionTools.length === 0) return null;

            return (
              <div key={subSection} className="space-y-6">
                {(activeMainSection.title === 'Teacher Tools' || activeMainSection.title === 'Student Tools') && (
                  <h3 className="text-2xl font-bold text-text/80 pl-2">{subSection}</h3>
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
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => onNavigate(tool.id)}
                        className={`bg-white p-6 rounded-2xl shadow-md flex flex-col items-center justify-center text-center gap-4 hover:shadow-xl transition-shadow border-2 border-transparent ${colors.hoverBorder} group h-full`}
                      >
                        <div className={`p-4 rounded-full transition-colors ${colors.bg} ${colors.groupHoverBg}`}>
                          <Icon size={48} className={colors.text} />
                        </div>
                        <span className="text-xl font-semibold text-text">
                          {isEarlyYears && <span className="mr-2">{tool.emoji}</span>}
                          {tool.name}
                        </span>
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