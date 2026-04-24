import React, { useState } from 'react';
import { Sparkles, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ToolHeader } from '../ToolHeader';

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
    <div className="w-full max-w-6xl mx-auto px-4 pt-2 pb-8 h-full flex flex-col gap-8">
      <ToolHeader
        title="Group Name Generator"
        icon={Sparkles}
        description="Creative and Inspiring Identity for Student Teams"
        infoContent={
          <p>Generate five fun, school-appropriate group names at the click of a button. Perfect for project teams, house groups, or classroom competitive play.</p>
        }
      >
        <button
          onClick={generateGroups}
          disabled={isGenerating}
          className="flex items-center gap-2 px-6 py-2 bg-slate-900 text-white rounded-xl font-black text-sm uppercase tracking-wider hover:bg-black transition-all active:scale-95 shadow-md disabled:opacity-50"
        >
          {isGenerating ? <RefreshCw className="animate-spin" size={18} /> : <Sparkles size={18} />}
          GENERATE
        </button>
      </ToolHeader>

      <div className="w-full bg-white p-8 rounded-3xl shadow-xl border-2 border-gray-100 flex flex-col items-center gap-6">
        <label className="text-sm text-gray-500 font-bold uppercase tracking-wider text-center border-b pb-2 mb-1 block w-full">Generated Groups</label>
        <p className="text-gray-500 text-center text-lg">
          Need names for your groups? Click generate to get 5 random, school-appropriate group names!
        </p>

        <div className="w-full flex flex-col gap-4 min-h-[400px]">
          <AnimatePresence>
            {groups.map((groupName, index) => (
              <motion.div
                key={`${groupName}-${index}`}
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
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
