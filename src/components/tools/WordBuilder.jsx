import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Delete, Volume2, Sparkles, RefreshCcw } from 'lucide-react';
import { ToolHeader } from '../ToolHeader';

const PHONICS_DATA = {
  consonants: ['b', 'c', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'm', 'n', 'p', 'r', 's', 't', 'v', 'w', 'x', 'y', 'z'],
  vowels: ['a', 'e', 'i', 'o', 'u'],
  digraphs: ['sh', 'ch', 'th', 'ck', 'qu', 'ng', 'wh', 'ph', 'ee', 'oo', 'ai', 'ay', 'oa', 'oi', 'oy', 'ou', 'ow', 'au', 'aw', 'er', 'ir', 'ur', 'ar', 'or'],
  trigraphs: ['igh', 'air', 'ure', 'ear'],
  'split digraphs': ['a-e', 'e-e', 'i-e', 'o-e', 'u-e']
};

const CATEGORY_COLORS = {
  consonants: 'bg-blue-100 border-blue-300 text-blue-700',
  vowels: 'bg-red-100 border-red-300 text-red-700',
  digraphs: 'bg-purple-100 border-purple-300 text-purple-700',
  trigraphs: 'bg-orange-100 border-orange-300 text-orange-700',
  'split digraphs': 'bg-green-100 border-green-300 text-green-700'
};

const PHONETIC_SOUNDS = {
  // Consonants
  'b': 'buh', 'c': 'k', 'd': 'duh', 'f': 'fff', 'g': 'guh', 'h': 'huh', 'j': 'juh', 'k': 'k', 'l': 'lll', 'm': 'mmm', 'n': 'nnn', 'p': 'puh', 'r': 'rrr', 's': 'sss', 't': 'tuh', 'v': 'vvv', 'w': 'wuh', 'x': 'ks', 'y': 'yuh', 'z': 'zzz',
  // Vowels
  'a': 'ah', 'e': 'eh', 'i': 'ih', 'o': 'o', 'u': 'uh',
  // Digraphs
  'sh': 'sh', 'ch': 'ch', 'th': 'th', 'ck': 'k', 'qu': 'kw', 'ng': 'ng', 'wh': 'w', 'ph': 'f', 'ee': 'ee', 'oo': 'oo', 'ai': 'ay', 'ay': 'ay', 'oa': 'oh', 'oi': 'oy', 'oy': 'oy', 'ou': 'ow', 'ow': 'ow', 'au': 'or', 'aw': 'or', 'er': 'er', 'ir': 'er', 'ur': 'er', 'ar': 'ar', 'or': 'or',
  // Trigraphs
  'igh': 'ie', 'air': 'air', 'ure': 'your', 'ear': 'ear',
  // Split digraphs
  'a-e': 'ay', 'e-e': 'ee', 'i-e': 'ie', 'o-e': 'oh', 'u-e': 'oo'
};

export const WordBuilder = () => {
  const [builtWord, setBuiltWord] = useState([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const scrollRef = useRef(null);

  const speakPhoneme = (phoneme) => {
    window.speechSynthesis.cancel();
    const sound = PHONETIC_SOUNDS[phoneme] || phoneme.replace('-', '');
    const utterance = new SpeechSynthesisUtterance(sound);
    utterance.rate = 0.8;
    window.speechSynthesis.speak(utterance);
  };

  const addPhoneme = (phoneme, category) => {
    setBuiltWord([...builtWord, { id: Date.now() + Math.random(), value: phoneme, category }]);
    speakPhoneme(phoneme);
  };

  const removePhoneme = (id) => {
    setBuiltWord(builtWord.filter(p => p.id !== id));
  };

  const clearWord = () => {
    setBuiltWord([]);
  };

  const deleteLast = () => {
    setBuiltWord(builtWord.slice(0, -1));
  };

  const speakWord = () => {
    if (builtWord.length === 0) return;
    
    // Stop any current speech
    window.speechSynthesis.cancel();
    
    let currentIndex = 0;
    
    const speakNext = () => {
      if (currentIndex < builtWord.length) {
        setActiveIndex(currentIndex);
        const phoneme = builtWord[currentIndex].value;
        const sound = PHONETIC_SOUNDS[phoneme] || phoneme.replace('-', '');
        
        const utterance = new SpeechSynthesisUtterance(sound);
        utterance.rate = 0.7; // Slightly slower for phonics clarity
        
        utterance.onend = () => {
          currentIndex++;
          if (currentIndex < builtWord.length) {
            // Small pause between phonemes
            setTimeout(speakNext, 150);
          } else {
            // Finished all phonemes
            setTimeout(() => setActiveIndex(-1), 150);
          }
        };

        utterance.onerror = () => {
          setActiveIndex(-1);
        };

        window.speechSynthesis.speak(utterance);
      }
    };
    
    speakNext();
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-hidden">
      <ToolHeader 
        title="Word Builder" 
        icon={Sparkles}
        description="Build words using phonics sounds"
        infoContent={
          <div className="space-y-2">
            <p>Assemble words by clicking on the sound tiles below.</p>
            <p><strong>Sounds:</strong> All phonics sounds are grouped by category. Click any sound to add it to your word and hear it spoken.</p>
            <p><strong>Actions:</strong> Use the 🔊 button to hear the whole word sounded out, ⌫ to delete the last sound, or 🗑️ to clear everything.</p>
          </div>
        }
      />

      <div className="flex-1 p-4 md:p-8 flex flex-col gap-6 overflow-hidden">
        {/* Workspace */}
        <div className="bg-white rounded-3xl shadow-xl p-8 min-h-[160px] flex items-center justify-center relative border-4 border-dashed border-slate-200">
          <AnimatePresence mode="popLayout">
            {builtWord.length === 0 ? (
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-slate-400 text-xl italic"
              >
                Click sounds below to build a word...
              </motion.p>
            ) : (
              <div className="flex flex-wrap gap-3 justify-center">
                {builtWord.map((p, index) => (
                  <motion.button
                    key={p.id}
                    layout
                    initial={{ scale: 0, opacity: 0, y: 20 }}
                    animate={{ 
                      scale: index === activeIndex ? 1.15 : 1,
                      opacity: 1, 
                      y: 0,
                      boxShadow: index === activeIndex ? "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)" : "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)"
                    }}
                    exit={{ scale: 0, opacity: 0, y: -20 }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => removePhoneme(p.id)}
                    className={`
                      w-16 h-20 md:w-20 md:h-24 rounded-2xl flex items-center justify-center 
                      text-3xl md:text-4xl font-bold border-b-4 
                      transition-all hover:z-10 relative
                      ${index === activeIndex ? 'ring-4 ring-blue-400 z-20 border-blue-500' : ''}
                      ${CATEGORY_COLORS[p.category] || 'bg-slate-100 border-slate-300'}
                    `}
                  >
                    {p.value}
                  </motion.button>
                ))}
              </div>
            )}
          </AnimatePresence>

          {/* Action Buttons */}
          <div className="absolute top-4 right-4 flex gap-2">
            <button
              onClick={speakWord}
              disabled={builtWord.length === 0}
              className="p-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-30 disabled:cursor-not-allowed shadow-lg transition-all active:scale-95"
              title="Speak word"
            >
              <Volume2 className="w-6 h-6" />
            </button>
            <button
              onClick={deleteLast}
              disabled={builtWord.length === 0}
              className="p-3 bg-orange-500 text-white rounded-full hover:bg-orange-600 disabled:opacity-30 disabled:cursor-not-allowed shadow-lg transition-all active:scale-95"
              title="Delete last"
            >
              <Delete className="w-6 h-6" />
            </button>
            <button
              onClick={clearWord}
              disabled={builtWord.length === 0}
              className="p-3 bg-red-500 text-white rounded-full hover:bg-red-600 disabled:opacity-30 disabled:cursor-not-allowed shadow-lg transition-all active:scale-95"
              title="Clear all"
            >
              <Trash2 className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Selection Area */}
        <div className="flex-1 bg-white rounded-3xl shadow-lg border border-slate-200 overflow-hidden flex flex-col">
          {/* Phonemes Grid */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6">
            <div className="flex flex-wrap md:flex-nowrap gap-x-6 gap-y-10 items-start justify-center">
              {Object.entries(PHONICS_DATA).map(([category, phonemes]) => {
                const isWide = ['consonants', 'digraphs'].includes(category);
                return (
                  <div 
                    key={category} 
                    className={`${isWide ? 'w-[185px]' : 'w-[150px]'} flex-none space-y-3`}
                  >
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-200"></span>
                      <span>{category}</span>
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      {phonemes.map((phoneme) => (
                        <motion.button
                          key={phoneme}
                          whileHover={{ scale: 1.1, y: -1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => addPhoneme(phoneme, category)}
                          className={`
                            w-14 h-12 rounded-md flex items-center justify-center 
                            text-sm md:text-base font-bold shadow-sm border-b-2
                            transition-all
                            ${CATEGORY_COLORS[category]}
                            hover:shadow-md
                          `}
                        >
                          {phoneme}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
