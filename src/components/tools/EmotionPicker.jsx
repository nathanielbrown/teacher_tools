import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const EMOTIONS = [
  { emoji: '😀', label: 'Happy' },
  { emoji: '😂', label: 'Joyful' },
  { emoji: '😊', label: 'Content' },
  { emoji: '🥰', label: 'Loved' },
  { emoji: '😎', label: 'Cool' },
  { emoji: '🤩', label: 'Excited' },
  { emoji: '🤔', label: 'Curious' },
  { emoji: '😐', label: 'Neutral' },
  { emoji: '🥱', label: 'Tired' },
  { emoji: '😴', label: 'Sleepy' },
  { emoji: '😕', label: 'Confused' },
  { emoji: '😟', label: 'Worried' },
  { emoji: '😢', label: 'Sad' },
  { emoji: '😭', label: 'Upset' },
  { emoji: '😤', label: 'Frustrated' },
  { emoji: '😡', label: 'Angry' },
  { emoji: '🤯', label: 'Overwhelmed' },
  { emoji: '🤢', label: 'Sick' },
  { emoji: '🤒', label: 'Unwell' },
  { emoji: '🤫', label: 'Quiet' },
];

export const EmotionPicker = () => {
  const [selectedEmotion, setSelectedEmotion] = useState(null);

  return (
    <div className="flex flex-col items-center justify-center space-y-8 max-w-4xl mx-auto pb-12">
      <h2 className="text-3xl font-bold text-primary">How are you feeling?</h2>

      <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-5 gap-4 sm:gap-6 bg-white p-6 sm:p-8 rounded-3xl shadow-xl w-full border-2 border-gray-100">
        {EMOTIONS.map((emotion, index) => (
          <button
            key={index}
            onClick={() => setSelectedEmotion(emotion)}
            className="flex flex-col items-center gap-2 group transition-transform hover:scale-110 active:scale-95"
          >
            <span className="text-5xl sm:text-6xl drop-shadow-sm group-hover:drop-shadow-md transition-all">
              {emotion.emoji}
            </span>
            <span className="text-xs sm:text-sm font-medium text-gray-500 group-hover:text-primary transition-colors">
              {emotion.label}
            </span>
          </button>
        ))}
      </div>

      <div className="min-h-[160px] flex items-center justify-center w-full">
        <AnimatePresence mode="wait">
          {selectedEmotion && (
            <motion.div
              key={selectedEmotion.label}
              initial={{ opacity: 0, y: 20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.8 }}
              className="bg-primary/10 border-2 border-primary/20 px-12 py-8 rounded-3xl flex flex-col items-center gap-4 text-center w-full max-w-md shadow-inner"
            >
              <span className="text-6xl">{selectedEmotion.emoji}</span>
              <p className="text-2xl font-bold text-text">
                I am feeling <span className="text-primary">{selectedEmotion.label}</span>!
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
