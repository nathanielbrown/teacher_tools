// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import React from 'react';
import { useSettings } from '../contexts/SettingsContext';

import {
  Clock, Timer, Hourglass, AlertCircle, Dices, Coins, Loader,
  Palette, Activity, BookOpen, UserCircle, Users, CalendarDays, Award, Star, Sparkles
} from 'lucide-react';

const tools = [
  { id: 'clock', name: 'Analogue & Digital Clock', icon: Clock, emoji: '🕒', section: 'Time Management' },
  { id: 'stopwatch', name: 'Stop Watch', icon: Timer, emoji: '⏱️', section: 'Time Management' },
  { id: 'countdown', name: 'Count Down', icon: Hourglass, emoji: '⏳', section: 'Time Management' },
  { id: 'examclock', name: 'Exam Clock', icon: AlertCircle, emoji: '📝', section: 'Time Management' },
  { id: 'eventcountdowns', name: 'Event Countdowns', icon: CalendarDays, emoji: '🗓️', section: 'Time Management' },
  { id: 'dailyschedule', name: 'Daily Schedule', icon: Clock, emoji: '📅', section: 'Classroom Management' },
  { id: 'diceroller', name: 'Dice Roller', icon: Dices, emoji: '🎲', section: 'Randomizers' },
  { id: 'flipcoin', name: 'Flip a Coin', icon: Coins, emoji: '🪙', section: 'Randomizers' },
  { id: 'numberspinner', name: 'Number Spinner', icon: Loader, emoji: '🎡', section: 'Randomizers' },
  { id: 'casinospinner', name: 'Name Picker (Casino)', icon: UserCircle, emoji: '🎰', section: 'Randomizers' },
  { id: 'wheelspinner', name: 'Name Picker (Wheel)', icon: Loader, emoji: '🎡', section: 'Randomizers' },
  { id: 'groupnamegenerator', name: 'Group Name Generator', icon: Sparkles, emoji: '✨', section: 'Randomizers' },
  { id: 'groupmaker', name: 'Random Group Maker', icon: Users, emoji: '👥', section: 'Classroom Management' },
  { id: 'groupscoreboard', name: 'Group Score Board', icon: Award, emoji: '🏆', section: 'Classroom Management' },
  { id: 'marblejar', name: 'Marble Jar Reward', icon: Star, emoji: '⭐', section: 'Classroom Management' },
  { id: 'emotionpicker', name: 'Emotion Picker', icon: UserCircle, emoji: '😊', section: 'Classroom Management' },
  { id: 'colourpicker', name: 'Colour Picker', icon: Palette, emoji: '🎨', section: 'Other' },
  { id: 'metronome', name: 'Metronome', icon: Activity, emoji: '🎵', section: 'Other' },
  { id: 'storystarters', name: 'Story Starters', icon: BookOpen, emoji: '📖', section: 'Other' },
];

const sections = ['Time Management', 'Classroom Management', 'Randomizers', 'Other'];

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

export const Dashboard = ({ onNavigate }) => {
  const { settings } = useSettings();
  const isEarlyYears = settings.theme === 'early-years';

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-12">
      <h1 className="text-4xl font-bold text-center mb-12 text-primary">
        {isEarlyYears ? '🌟 Welcome to Teacher Tools! 🌟' : 'Teacher Tools Dashboard'}
      </h1>

      {sections.map(section => {
        const sectionTools = tools.filter(t => t.section === section);
        if (sectionTools.length === 0) return null;

        return (
          <div key={section} className="space-y-6">
            <h2 className="text-2xl font-bold text-text border-b-2 border-primary/20 pb-2">{section}</h2>
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
                    className="bg-white p-6 rounded-2xl shadow-lg flex flex-col items-center justify-center text-center gap-4 hover:shadow-xl transition-shadow border-2 border-transparent hover:border-primary group h-full"
                  >
                    <div className="p-4 bg-primary/10 rounded-full group-hover:bg-primary/20 transition-colors">
                      <Icon size={48} className="text-primary" />
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
  );
};