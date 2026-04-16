import React, { useState } from 'react';
import { Sparkles, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ADJECTIVES = [
  'Brave', 'Clever', 'Mighty', 'Swift', 'Happy', 'Bright', 'Golden', 'Silver',
  'Cosmic', 'Magic', 'Super', 'Awesome', 'Fantastic', 'Brilliant', 'Fearless',
  'Creative', 'Dazzling', 'Fierce', 'Gentle', 'Honest', 'Jolly', 'Kind',
  'Lucky', 'Noble', 'Proud', 'Quiet', 'Rapid', 'Silent', 'Smart', 'Wise'
];

const NOUNS = [
  'Lions', 'Tigers', 'Bears', 'Eagles', 'Falcons', 'Hawks', 'Sharks', 'Dolphins',
  'Whales', 'Dragons', 'Unicorns', 'Phoenixes', 'Stars', 'Comets', 'Meteors',
  'Planets', 'Galaxies', 'Rockets', 'Lasers', 'Ninjas', 'Knights', 'Wizards',
  'Explorers', 'Inventors', 'Creators', 'Heroes', 'Legends', 'Champions',
  'Warriors', 'Scholars'
];

export const RandomGroupNameGenerator = () => {
  const [groups, setGroups] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateGroups = () => {
    setIsGenerating(true);
    setGroups([]);

    setTimeout(() => {
      const newGroups = [];
      for (let i = 0; i < 5; i++) {
        const randomAdj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
        const randomNoun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
        newGroups.push(`${randomAdj} ${randomNoun}`);
      }
      setGroups(newGroups);
      setIsGenerating(false);
    }, 600);
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-8 max-w-4xl mx-auto pb-12">
      <h2 className="text-3xl font-bold text-primary flex items-center gap-2">
        <Sparkles /> Random Group Name Generator
      </h2>

      <div className="w-full bg-white p-8 rounded-3xl shadow-xl border-2 border-gray-100 flex flex-col items-center gap-8">
        <p className="text-gray-500 text-center text-lg">
          Need names for your groups? Click generate to get 5 random, school-appropriate group names!
        </p>

        <button
          onClick={generateGroups}
          disabled={isGenerating}
          className="px-8 py-4 bg-primary text-white text-xl font-bold rounded-2xl shadow-lg hover:bg-primary/90 hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center gap-3"
        >
          <RefreshCw className={isGenerating ? "animate-spin" : ""} size={24} />
          {isGenerating ? "Generating..." : "Generate 5 Group Names"}
        </button>

        <div className="w-full flex flex-col gap-4 min-h-[400px]">
          <AnimatePresence>
            {groups.map((groupName, index) => (
              <motion.div
                key={`${groupName}-${index}`}
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ delay: index * 0.1, type: "spring", stiffness: 100 }}
                className="w-full p-6 bg-gradient-to-r from-primary/5 to-transparent border-l-4 border-primary rounded-r-xl shadow-sm flex items-center gap-4"
              >
                <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm shrink-0">
                  {index + 1}
                </div>
                <span className="text-2xl font-bold text-text tracking-wide">
                  {groupName}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>

          {groups.length === 0 && !isGenerating && (
             <div className="flex-1 flex items-center justify-center border-4 border-dashed border-gray-100 rounded-2xl p-8">
               <p className="text-gray-400 font-medium text-xl text-center">
                 Your random group names will appear here.
               </p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};
