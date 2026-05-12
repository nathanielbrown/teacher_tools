import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  Quote, 
  RefreshCcw, 
  BookOpen, 
  Star, 
  History
} from 'lucide-react';
import { useHeader } from '../../contexts/HeaderContext';
import { useSettings } from '../../contexts/SettingsContext';
import { audioEngine } from '../../utils/audio';
import { useIntl, FormattedMessage } from 'react-intl';
import ToolPanel from '../shared/ToolPanel';
import SettingsPanel from '../shared/SettingsPanel';
import HistoryPanel from '../shared/HistoryPanel';
import { useLocalStorage } from '../../hooks/useLocalStorage';

// 1. Constants
const STORY_PROMPTS = {
  1: [
    "Once upon a time, a little dog found a magic bone...",
    "In a dark forest, a friendly bear woke up and...",
    "The sun was shining when suddenly it started raining blue drops...",
    "A brave kitten wanted to climb the highest tree...",
    "Under the sea, a tiny fish found a shiny coin..."
  ],
  2: [
    "The old toy box in the attic started making a strange noise...",
    "When I looked out my window, the moon was missing!",
    "A magical paintbrush drew things that came to life.",
    "The secret door in the library led to a world of candy.",
    "My  started walking the opposite way I was going!"
  ],
  3: [
    "The map had an X, but it wasn't on the ground, it was in the sky.",
    "Every time the clock struck thirteen, time would freeze.",
    "The new kid at school had a tail sticking out of his backpack.",
    "A message in a bottle washed ashore, written in invisible ink.",
    "The zoo animals swapped voices for a day."
  ],
  4: [
    "The spaceship landed in our backyard, but it was the size of a bug.",
    "I discovered my grandma was a retired superhero.",
    "The ancient coin allowed whoever held it to speak to animals.",
    "The painting in the museum winked at me when no one was looking.",
    "We found a train ticket with tomorrow's date and an unknown destination."
  ],
  5: [
    "The storm brought more than rain; it brought creatures of wind and lightning.",
    "The last library on Earth contained a book that wrote itself.",
    "Every reflection in the mirror showed a slightly different world.",
    "The invention was meant to clean rooms, but it started deleting them instead.",
    "A mysterious signal interrupted every screen in the city."
  ],
  6: [
    "The chronometer didn't tell time; it told you how much time you had left.",
    "The city floated above the clouds, anchored by massive chains that were rusting.",
    "Nobody remembered the event, except for the photographs that proved it happened.",
    "The artifact hummed with a frequency that unlocked forgotten memories.",
    "We were warned never to go past the perimeter, but the perimeter was shrinking."
  ]
};

// 2. Config (None)

// 3. Text (Help and Info)
const HelpContent = () => (
  <div className="space-y-4 font-['Outfit']">
    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">
      <FormattedMessage id="storystarters.help.title" />
    </h3>
    <div className="space-y-3">
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center text-xs font-black text-indigo-600 shrink-0">1</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">
          <FormattedMessage id="storystarters.help.step1" defaultMessage="Choose your level in settings." />
        </p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center text-xs font-black text-indigo-600 shrink-0">2</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">
          <FormattedMessage id="storystarters.help.step2" defaultMessage="Click the button to get a story idea." />
        </p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center text-xs font-black text-indigo-600 shrink-0">3</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">
          <FormattedMessage id="storystarters.help.step3" defaultMessage="Look at your old ideas in the list." />
        </p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center text-xs font-black text-indigo-600 shrink-0">4</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">
          <FormattedMessage id="storystarters.help.step4" defaultMessage="Start writing your amazing story!" />
        </p>
      </div>
    </div>
  </div>
);

// 4. Component
export const StoryStarters = () => {
  const intl = useIntl();
  const { setHelpContent, setOnReset, setHasConfig, clearHeader, isConfigOpen, setIsConfigOpen } = useHeader();
  const { settings } = useSettings();
  
  const [yearLevel, setYearLevel] = useLocalStorage<number>('story_starters_year_level', 3);
  const [hasSelectedYear, setHasSelectedYear] = useLocalStorage<boolean>('story_starters_year_selected', false);
  const [prompt, setPrompt] = useLocalStorage<string | null>('story_starters_prompt', null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [history, setHistory] = useLocalStorage<string[]>('story_starters_history', []);

  const generatePrompt = useCallback(() => {
    setIsGenerating(true);
    setPrompt(null);
    audioEngine.playTick(settings.soundTheme);
    
    setTimeout(() => {
      const prompts = STORY_PROMPTS[yearLevel as keyof typeof STORY_PROMPTS];
      const randomPrompt = prompts[Math.floor(Math.random() * prompts.length)];
      setPrompt(randomPrompt);
      setHistory(prev => [randomPrompt, ...prev].slice(0, 50));
      setIsGenerating(false);
    }, 600);
  }, [yearLevel, settings.soundTheme]);

  const resetTool = useCallback(() => {
    setPrompt(null);
    setHistory([]);
    setHasSelectedYear(false);
    audioEngine.playTick(settings.soundTheme);
  }, [settings.soundTheme]);

  useEffect(() => {
    setOnReset(() => resetTool);
    setHasConfig(false);
    setHelpContent(<HelpContent />);
    return () => clearHeader();
  }, [clearHeader, setOnReset, resetTool, setHelpContent, setHasConfig]);

  return (
    <div className="flex gap-8 h-full w-full italic">
      <ToolPanel baseWidth={1000} baseHeight={800}>
        <div className="w-full h-full flex flex-col items-center justify-center relative overflow-hidden">
          <div className="w-full max-w-4xl flex flex-col items-center relative z-10 px-12 text-center">
            <AnimatePresence mode="wait">
              {prompt ? (
                <motion.div
                  key={prompt}
                  initial={{ opacity: 0, scale: 0.95, y: 30 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 1.05, y: -30 }}
                  className="space-y-12"
                >
                  <div className="relative inline-block">
                    <div className="absolute inset-0 bg-indigo-500 blur-[60px] opacity-20" />
                    <Quote size={60} fill="currentColor" className="mx-auto text-indigo-100 relative z-10" />
                  </div>
                  
                  <h2 className="text-4xl md:text-6xl font-black text-slate-900 leading-[1.1] tracking-tighter italic uppercase ">
                    {prompt}
                  </h2>
                  
                  <div className="flex items-center justify-center gap-6">
                    <div className="h-1 w-12 bg-slate-100 rounded-full" />
                    <div className="px-8 py-3 bg-white border-2 border-slate-100 rounded-full flex items-center gap-3 ">
                      <Star size={18} className="text-amber-400 fill-amber-400" />
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <FormattedMessage id="storystarters.label.level" values={{ n: yearLevel }} />
                      </span>
                    </div>
                    <div className="h-1 w-12 bg-slate-100 rounded-full" />
                  </div>
                </motion.div>
              ) : !hasSelectedYear ? (
                <motion.div
                  key="year-selection"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center gap-12"
                >
                  <div className="space-y-4">
                    <h3 className="text-4xl font-black text-slate-900 tracking-tighter italic uppercase leading-none">
                      <FormattedMessage id="storystarters.label.select_year" defaultMessage="Select Year Level" />
                    </h3>
                  </div>
                  <div className="grid grid-cols-3 gap-6 w-full max-w-xl">
                    {[1, 2, 3, 4, 5, 6].map(year => (
                      <button
                        key={year}
                        onClick={() => { setYearLevel(year); setHasSelectedYear(true); audioEngine.playTick(settings.soundTheme); }}
                        className={`h-24 rounded-3xl border-4 flex items-center justify-center text-3xl font-black transition-all bg-white border-slate-100 text-slate-400 hover:border-indigo-400 hover:text-indigo-600 hover:scale-105 `}
                      >
                        {year}
                      </button>
                    ))}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="idle"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center gap-12"
                >
                  <div className="space-y-4">
                    <h3 className="text-5xl font-black text-slate-900 tracking-tighter italic uppercase leading-none">
                      <FormattedMessage id="storystarters.title" />
                    </h3>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {hasSelectedYear && (
            <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-30">
              <button
                onClick={generatePrompt}
                disabled={isGenerating}
                className="group flex items-center gap-8 h-24 px-12 bg-orange-600 text-white rounded-[3rem] font-black text-2xl  hover:bg-slate-900 transition-all tracking-tighter italic uppercase border-8 border-white active:scale-95 disabled:opacity-50"
              >
                {isGenerating ? <RefreshCcw size={32} strokeWidth={3} className="animate-spin" /> : <Sparkles size={32} fill="currentColor" />}
                {isGenerating ? <FormattedMessage id="storystarters.generating" /> : <FormattedMessage id="storystarters.generate" />}
              </button>
            </div>
          )}
        </div>
      </ToolPanel>

      <div className="w-full lg:w-[320px] shrink-0 flex flex-col gap-6">
        <SettingsPanel
          isOpen={isConfigOpen}
          onClose={() => setIsConfigOpen(false)}
          title={intl.formatMessage({ id: 'storystarters.title' })}
        >
          <div className="space-y-6">
            <div className="bg-slate-900 p-8 rounded-[3rem] border-4 border-slate-800  flex flex-col items-center gap-6 relative overflow-hidden shrink-0">
               <div className="flex items-center justify-between w-full relative z-10">
                  <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.5em]">
                    <FormattedMessage id="storystarters.label.year" />
                  </span>
                      <FormattedMessage id="storystarters.label.level" values={{ n: yearLevel }} />
               </div>

               <div className="relative z-10 w-full">
                  <div className="grid grid-cols-3 gap-2">
                    {[1, 2, 3, 4, 5, 6].map(year => (
                      <button
                        key={year}
                        onClick={() => { setYearLevel(year); setPrompt(null); audioEngine.playTick(settings.soundTheme); }}
                        className={`h-16 rounded-2xl border-4 flex items-center justify-center text-xl font-black transition-all ${
                          yearLevel === year ? 'bg-indigo-600 border-indigo-400 text-white  scale-105' : 'bg-white/5 border-white/5 text-slate-500 hover:text-white hover:bg-white/10'
                        }`}
                      >
                        {year}
                      </button>
                    ))}
                  </div>
               </div>
            </div>
          </div>
        </SettingsPanel>

        <HistoryPanel
          title={intl.formatMessage({ id: 'storystarters.history.title' })}
          items={history}
          onClear={resetTool}
          emptyMessage={intl.formatMessage({ id: 'storystarters.history.empty' })}
          icon={History}
          renderItem={(item, index) => (
            <motion.div
              key={index}
              layout
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="p-6 bg-white rounded-[2rem] border-4 border-white  flex flex-col items-start gap-2 transition-all hover:scale-[1.02]  hover:border-indigo-100"
            >
              <div className="flex items-center gap-2">
                 <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                    <Star size={14} strokeWidth={3} />
                 </div>
                 <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                   <FormattedMessage id="storystarters.history.item" />
                 </span>
              </div>
              <p className="text-xs font-black text-slate-900 italic leading-relaxed truncate w-full">"{item}"</p>
            </motion.div>
          )}
        />
      </div>
    </div>
  );
};

export default StoryStarters;
