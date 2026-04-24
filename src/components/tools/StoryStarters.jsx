import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { ToolHeader } from '../ToolHeader';

const storyPrompts = {
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
    "My shadow started walking the opposite way I was going!"
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

export const StoryStarters = () => {
  const [yearLevel, setYearLevel] = useState(3);
  const [prompt, setPrompt] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const generatePrompt = () => {
    setIsGenerating(true);
    setPrompt(null);

    setTimeout(() => {
      const prompts = storyPrompts[yearLevel];
      const randomPrompt = prompts[Math.floor(Math.random() * prompts.length)];
      setPrompt(randomPrompt);
      setIsGenerating(false);
    }, 600);
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 pt-2 pb-8 h-full flex flex-col gap-8">
      <ToolHeader
        title="Story Starters"
        icon={Sparkles}
        description="Creative Prompts for Narrative Writing"
        infoContent={
          <p>Overcome writer's block with aged-tailored creative prompts. Select a year level to get sentences that match the literacy expectations for that age group.</p>
        }
      >
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
          {[1, 2, 3, 4, 5, 6].map(year => (
            <button
              key={year}
              onClick={() => { setYearLevel(year); setPrompt(null); }}
              className={`px-4 py-1.5 rounded-lg transition-all font-black text-[10px] ${
                yearLevel === year
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              Y{year}
            </button>
          ))}
        </div>
      </ToolHeader>


      <div className="w-full min-h-[200px] flex flex-col items-center justify-center">
        <AnimatePresence mode="wait">
          {prompt ? (
            <motion.div
              key={prompt}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="bg-primary/5 border-2 border-primary/20 p-8 rounded-2xl shadow-inner w-full text-center relative"
            >
              <div className="absolute top-4 left-4 text-4xl text-primary/20">"</div>
              <p className="text-2xl md:text-3xl font-medium text-text leading-relaxed italic z-10 relative">
                {prompt}
              </p>
              <div className="absolute bottom-4 right-4 text-4xl text-primary/20">"</div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-gray-400 text-lg italic"
            >
              Click generate to get a story starter!
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <button
        onClick={generatePrompt}
        disabled={isGenerating}
        className="self-center px-10 py-4 bg-accent text-white text-xl font-bold rounded-2xl shadow-lg hover:bg-accent/90 hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center gap-2"
      >
        {isGenerating ? <Sparkles className="animate-spin" /> : <Sparkles />}
        {isGenerating ? 'Generating...' : 'Generate New Story'}
      </button>
    </div>
  );
};
