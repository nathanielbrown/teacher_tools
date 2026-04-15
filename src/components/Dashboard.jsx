import React from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { motion } from 'framer-motion';
import {
  Clock, Timer, Hourglass, AlertCircle, Dices, Coins, Loader,
  Palette, Activity, BookOpen, UserCircle, Users
} from 'lucide-react';

const tools = [
  { id: 'clock', name: 'Analogue & Digital Clock', icon: Clock, emoji: '🕒' },
  { id: 'stopwatch', name: 'Stop Watch', icon: Timer, emoji: '⏱️' },
  { id: 'countdown', name: 'Count Down', icon: Hourglass, emoji: '⏳' },
  { id: 'examclock', name: 'Exam Clock', icon: AlertCircle, emoji: '📝' },
  { id: 'diceroller', name: 'Dice Roller', icon: Dices, emoji: '🎲' },
  { id: 'flipcoin', name: 'Flip a Coin', icon: Coins, emoji: '🪙' },
  { id: 'numberspinner', name: 'Number Spinner', icon: Loader, emoji: '🎡' },
  { id: 'colourpicker', name: 'Colour Picker', icon: Palette, emoji: '🎨' },
  { id: 'metronome', name: 'Metronome', icon: Activity, emoji: '🎵' },
  { id: 'storystarters', name: 'Story Starters', icon: BookOpen, emoji: '📖' },
  { id: 'casinospinner', name: 'Name Picker (Casino)', icon: UserCircle, emoji: '🎰' },
  { id: 'wheelspinner', name: 'Name Picker (Wheel)', icon: Loader, emoji: '🎡' },
  { id: 'groupmaker', name: 'Random Group Maker', icon: Users, emoji: '👥' },
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

export const Dashboard = ({ onNavigate }) => {
  const { settings } = useSettings();
  const isEarlyYears = settings.theme === 'early-years';

  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-4xl font-bold text-center mb-8 text-primary">
        {isEarlyYears ? '🌟 Welcome to Teacher Tools! 🌟' : 'Teacher Tools Dashboard'}
      </h1>

      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {tools.map((tool) => {
          const Icon = tool.icon;
          return (
            <motion.button
              key={tool.id}
              variants={itemVariants}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onNavigate(tool.id)}
              className="bg-white p-6 rounded-2xl shadow-lg flex flex-col items-center justify-center text-center gap-4 hover:shadow-xl transition-shadow border-2 border-transparent hover:border-primary group"
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
};
