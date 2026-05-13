import React, { useState, useEffect, useCallback } from 'react';
import { Sparkles, RefreshCw, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useHeader } from '../../contexts/HeaderContext';
import { audioEngine } from '../../utils/audio';
import { useSettings } from '../../contexts/SettingsContext';
import { FormattedMessage } from 'react-intl';
import ToolPanel from '../shared/ToolPanel';

// 1. Constants
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

// 3. Text (Help and Info)
const HelpContent = () => (
  <div className="space-y-4 font-['Outfit']">
    <div className="space-y-3 italic">
      {[1, 2, 3, 4].map(step => (
        <div key={step} className="flex gap-3 text-left">
          <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center text-xs font-black text-indigo-600 shrink-0">{step}</div>
          <p className="text-sm text-slate-600 font-medium leading-tight">
            <FormattedMessage id={`groupnamegenerator.help.step${step}`} />
          </p>
        </div>
      ))}
    </div>
  </div>
);

export const RandomGroupNameGenerator = () => {
  const { clearHeader, setHelpContent } = useHeader();
  const { settings } = useSettings();
  const [groups, setGroups] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateGroups = useCallback(() => {
    setIsGenerating(true);
    setGroups([]);
    audioEngine.playTick(settings.soundTheme);

    setTimeout(() => {
      const newGroups = [];
      for (let i = 0; i < 6; i++) {
        const randomAdj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
        const randomNoun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
        newGroups.push(`${randomAdj} ${randomNoun}`);
      }
      setGroups(newGroups);
      setIsGenerating(false);
      audioEngine.playSuccess(settings.soundTheme);
    }, 800);
  }, [settings.soundTheme]);

  useEffect(() => {
    setHelpContent(<HelpContent />);
    return () => clearHeader();
  }, [clearHeader, setHelpContent]);

  return (
    <ToolPanel baseWidth={1000} baseHeight={800} className="italic">
      <div className="w-full h-full flex flex-col items-center justify-start relative overflow-hidden">
        <div className="w-full max-w-4xl flex flex-col items-center relative z-10 px-3 lg:px-12 h-full py-2 lg:py-4">
          
          <div className="w-full flex-1 flex flex-col justify-start italic">
            <AnimatePresence mode="wait">
              {groups.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 lg:gap-4 w-full">
                    {groups.map((name, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                        className={`flex items-center gap-4 py-3 lg:py-4 px-6 bg-white rounded-[2rem] border-4 border-slate-50 hover:border-indigo-100 transition-all w-full ${index === groups.length - 1 && groups.length % 2 !== 0 ? 'md:col-span-2' : ''}`}
                      >
                        <div className="w-16 h-16 lg:w-10 lg:h-10 rounded-xl bg-indigo-500 flex items-center justify-center text-white font-black text-4xl lg:text-lg shrink-0">
                          {index + 1}
                        </div>
                        <span className="text-5xl lg:text-2xl font-black text-slate-800 tracking-tight">
                          {name}
                        </span>
                      </motion.div>
                    ))}
                  </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-center py-12 opacity-30 italic">
                  {isGenerating ? (
                    <div className="relative">
                      <RefreshCw size={64} className="text-indigo-500 animate-spin" />
                    </div>
                  ) : (
                    <>
                      <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center text-slate-400 mb-6">
                        <Users size={48} />
                      </div>
                    </>
                  )}
                </div>
              )}
            </AnimatePresence>
          </div>

          <div className="w-full shrink-0 mt-4">
            <button
              onClick={generateGroups}
              disabled={isGenerating}
              className="w-full py-6 lg:py-5 bg-indigo-600 text-white rounded-[2rem] font-black text-4xl lg:text-xl uppercase tracking-[0.2em]  hover:bg-indigo-700 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-6 group italic border-4 border-white"
            >
              {isGenerating ? (
                <RefreshCw size={32} className="animate-spin" />
              ) : (
                <FormattedMessage id="groupnamegenerator.generate" />
              )}
            </button>
          </div>
        </div>
      </div>
    </ToolPanel>
  );
};

export default RandomGroupNameGenerator;
