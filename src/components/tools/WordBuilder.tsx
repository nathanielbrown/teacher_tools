import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Volume2, 
  Trash2, 
  RotateCcw,
  BookOpen,
  Sparkles,
  Music
} from 'lucide-react';
import { audioEngine } from '../../utils/audio';
import { speak as speakUtility, speakAsync as speakAsyncUtility } from '../../utils/speech';
import { useSettings } from '../../contexts/SettingsContext';
import { useHeader } from '../../contexts/HeaderContext';
import { useIntl, FormattedMessage } from 'react-intl';
import ToolPanel from '../shared/ToolPanel';
import SettingsPanel from '../shared/SettingsPanel';

// 1. Constants
const PHONICS = {
  single: [
    { char: 'a', type: 'vowel', phonetic: 'a' }, { char: 'b', type: 'consonant', phonetic: 'b' }, { char: 'c', type: 'consonant', phonetic: 'c' },
    { char: 'd', type: 'consonant', phonetic: 'd' }, { char: 'e', type: 'vowel', phonetic: 'e' }, { char: 'f', type: 'consonant', phonetic: 'f' },
    { char: 'g', type: 'consonant', phonetic: 'g' }, { char: 'h', type: 'consonant', phonetic: 'h' }, { char: 'i', type: 'vowel', phonetic: 'i' },
    { char: 'j', type: 'consonant', phonetic: 'j' }, { char: 'k', type: 'consonant', phonetic: 'k' }, { char: 'l', type: 'consonant', phonetic: 'l' },
    { char: 'm', type: 'consonant', phonetic: 'm' }, { char: 'n', type: 'consonant', phonetic: 'n' }, { char: 'o', type: 'vowel', phonetic: 'o' },
    { char: 'p', type: 'consonant', phonetic: 'p' }, { char: 'q', type: 'consonant', phonetic: 'q' }, { char: 'r', type: 'consonant', phonetic: 'r' },
    { char: 's', type: 'consonant', phonetic: 's' }, { char: 't', type: 'consonant', phonetic: 't' }, { char: 'u', type: 'vowel', phonetic: 'u' },
    { char: 'v', type: 'consonant', phonetic: 'v' }, { char: 'w', type: 'consonant', phonetic: 'w' }, { char: 'x', type: 'consonant', phonetic: 'x' },
    { char: 'y', type: 'consonant', phonetic: 'y' }, { char: 'z', type: 'consonant', phonetic: 'z' }
  ],
  digraph: [
    { char: 'ch', type: 'digraph', phonetic: 'ch' }, 
    { char: 'sh', type: 'digraph', phonetic: 'sh' }, 
    { char: 'th', type: 'digraph', phonetic: 'th' },
    { char: 'qu', type: 'digraph', phonetic: 'qu' }, 
    { char: 'ng', type: 'digraph', phonetic: 'ng' }, 
    { char: 'wh', type: 'digraph', phonetic: 'wh' },
    { char: 'ph', type: 'digraph', phonetic: 'ph' }
  ],
  longvowel: [
    { char: 'ai', type: 'vowel', phonetic: 'ai' }, 
    { char: 'ee', type: 'vowel', phonetic: 'ee' }, 
    { char: 'igh', type: 'vowel', phonetic: 'igh' },
    { char: 'oa', type: 'vowel', phonetic: 'oa' }, 
    { char: 'oo', type: 'vowel', phonetic: 'oo' }, 
    { char: 'ar', type: 'vowel', phonetic: 'ar' },
    { char: 'or', type: 'vowel', phonetic: 'or' }, 
    { char: 'ur', type: 'vowel', phonetic: 'ur' }, 
    { char: 'ow', type: 'vowel', phonetic: 'ow' },
    { char: 'oi', type: 'vowel', phonetic: 'oi' }, 
    { char: 'ear', type: 'vowel', phonetic: 'ear' }, 
    { char: 'air', type: 'vowel', phonetic: 'air' },
    { char: 'ure', type: 'vowel', phonetic: 'ure' }, 
    { char: 'er', type: 'vowel', phonetic: 'er' }
  ],
  blends: [
    { char: 'bl', type: 'consonant', phonetic: 'bl' }, { char: 'br', type: 'consonant', phonetic: 'br' }, { char: 'cl', type: 'consonant', phonetic: 'cl' },
    { char: 'cr', type: 'consonant', phonetic: 'cr' }, { char: 'dr', type: 'consonant', phonetic: 'dr' }, { char: 'fl', type: 'consonant', phonetic: 'fl' },
    { char: 'fr', type: 'consonant', phonetic: 'fr' }, { char: 'gl', type: 'consonant', phonetic: 'gl' }, { char: 'gr', type: 'consonant', phonetic: 'gr' },
    { char: 'pl', type: 'consonant', phonetic: 'pl' }, { char: 'pr', type: 'consonant', phonetic: 'pr' }, { char: 'sl', type: 'consonant', phonetic: 'sl' },
    { char: 'st', type: 'consonant', phonetic: 'st' }, { char: 'tr', type: 'consonant', phonetic: 'tr' }
  ]
};

// 3. Text (Help and Info)
const HelpContent = () => (
  <div className="space-y-4 font-['Outfit']">
    <h3 className="text-xl font-bold text-primary uppercase tracking-tight">
      <FormattedMessage id="wordbuilder.help.title" />
    </h3>
    <div className="space-y-3">
      {[1, 2, 3, 4].map((step) => (
        <div key={step} className="flex gap-3 text-left">
          <div className="w-6 h-6 rounded-lg bg-primary/5 flex items-center justify-center text-xs font-bold text-primary shrink-0">{step}</div>
          <p className="text-sm text-slate-600 font-medium leading-tight">
            <FormattedMessage 
              id={`wordbuilder.help.step${step}`}
              values={{ b: (chunks: React.ReactNode) => <b>{chunks}</b> }}
            />
          </p>
        </div>
      ))}
    </div>
  </div>
);

export const WordBuilder = () => {
  const intl = useIntl();
  const { setOnReset, clearHeader, setHelpContent, isConfigOpen, setIsConfigOpen } = useHeader();
  const { settings } = useSettings();
  const [word, setWord] = useState<{ char: string, type: string, id: number, phonetic?: string }[]>([]);
  const [speakingId, setSpeakingId] = useState<number | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isSpeakingWord, setIsSpeakingWord] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.speechSynthesis.cancel();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
        audioRef.current = null;
      }
    };
  }, []);

  const speak = useCallback((text: string, id?: number) => {
    if (!audioRef.current) audioRef.current = new Audio();
    const audio = audioRef.current;
    
    // Cancel previous
    audio.pause();
    audio.onended = null;
    audio.onerror = null;

    const audioPath = `/assets/audio/phonics/${text.toLowerCase()}.ogg`;
    audio.src = audioPath;
    
    if (id) setSpeakingId(id);
    
    audio.onended = () => {
      if (id) setSpeakingId(null);
    };
    
    audio.onerror = () => {
      if (id) setSpeakingId(id);
      speakUtility(text, 0.8, () => {
        if (id) setSpeakingId(null);
      });
    };

    audio.play().catch(() => {
      if (id) setSpeakingId(id);
      speakUtility(text, 0.8, () => {
        if (id) setSpeakingId(null);
      });
    });
  }, []);

  const speakAsync = (text: string, id?: number) => {
    return new Promise<void>((resolve) => {
      if (!audioRef.current) audioRef.current = new Audio();
      const audio = audioRef.current;

      // Cancel previous
      audio.pause();
      audio.onended = null;
      audio.onerror = null;

      const audioPath = `/assets/audio/phonics/${text.toLowerCase()}.ogg`;
      audio.src = audioPath;
      
      if (id) setSpeakingId(id);
      
      audio.onended = () => {
        if (id) setSpeakingId(null);
        resolve();
      };
      
      audio.onerror = () => {
        if (id) setSpeakingId(id);
        speakAsyncUtility(text, 0.8).then(() => {
          if (id) setSpeakingId(null);
          resolve();
        });
      };

      audio.play().catch(() => {
        if (id) setSpeakingId(id);
        speakAsyncUtility(text, 0.8).then(() => {
          if (id) setSpeakingId(null);
          resolve();
        });
      });
    });
  };

  const addSound = (sound: { char: string, type: string, phonetic?: string }) => {
    const id = Date.now() + Math.random();
    setWord(prev => [...prev, { ...sound, id }]);
    audioEngine.playTick(settings.soundTheme);
    speak(sound.phonetic || sound.char, id);
  };

  const removeSound = (id: number) => {
    setWord(prev => prev.filter(s => s.id !== id));
    audioEngine.playTick(settings.soundTheme);
  };

  const clearWord = useCallback(() => {
    setWord([]);
    audioEngine.playTick(settings.soundTheme);
  }, [settings.soundTheme]);

  const listenToWord = async () => {
    if (word.length === 0 || isListening) return;
    setIsListening(true);
    window.speechSynthesis.cancel();

    // 1. Each sound
    for (const s of word) {
      await speakAsync(s.phonetic || s.char, s.id);
    }

    // 2. Full word
    const fullWord = word.map(s => s.char).join('');
    setIsSpeakingWord(true);
    await speakAsync(fullWord);
    setIsSpeakingWord(false);

    // 2.5 Wait a bit before repeating sounds
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 3. Each sound again
    for (const s of word) {
      await speakAsync(s.phonetic || s.char, s.id);
    }

    setIsListening(false);
    audioEngine.playSuccess(settings.soundTheme);
  };

  useEffect(() => {
    setOnReset(() => clearWord);
    setHelpContent(<HelpContent />);
    return () => clearHeader();
  }, [clearHeader, setOnReset, clearWord, setHelpContent]);

  return (
    <ToolPanel baseWidth={windowWidth < 1024 ? 600 : 1200} baseHeight={windowWidth < 1024 ? 1000 : 800}>
      <div className="w-full h-full flex flex-col gap-4 lg:gap-6 relative overflow-hidden p-4 lg:p-10 italic">
        <div className="tool-grid-bg opacity-20 pointer-events-none" />
          
          <div className="flex items-center justify-between">
              <h3 className="text-2xl font-bold text-slate-900 tracking-tighter italic uppercase leading-none">
                <FormattedMessage id="wordbuilder.label.word" />
              </h3>

              <div className="flex gap-4">
                <button
                  onClick={listenToWord}
                  className="flex items-center justify-center px-10 py-4 bg-primary text-white rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-primary/90 transition-all shadow-lg shadow-indigo-200"
                >
                  <FormattedMessage id="wordbuilder.label.listen" />
                </button>
              </div>
          </div>

          <div className="flex-1 h-auto bg-surface/50 backdrop-blur-xl rounded-[2rem] lg:rounded-[4rem] border-4 border-white flex items-center justify-center p-4 lg:p-12 relative overflow-hidden">
             <div className="tool-grid-bg opacity-10 pointer-events-none" />
             <motion.div 
                animate={{ scale: isSpeakingWord ? 1.1 : 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                className="flex flex-wrap gap-4 justify-center"
             >
                <AnimatePresence mode="popLayout">
                    {word.length === 0 ? (
                      <div className="h-40" />
                    ) : (
                     word.map((sound) => (
                       <motion.button
                         key={sound.id}
                         layout
                         initial={{ scale: 0.8, opacity: 0, y: 20 }}
                         animate={{ scale: isSpeakingWord ? [1, 1.3, 1] : (speakingId === sound.id ? 1.2 : 1), opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                         exit={{ scale: 0.8, opacity: 0, y: -20 }}
                          onClick={() => removeSound(sound.id)}
                          className={`w-20 h-24 lg:w-28 lg:h-36 rounded-2xl lg:rounded-[2.5rem] flex flex-col items-center justify-center text-3xl lg:text-5xl font-bold border-4 lg:border-[10px] border-white active:scale-95 group relative ${
                            sound.type === 'vowel' ? 'bg-rose-500 text-white shadow-lg shadow-rose-100' : 'bg-primary text-white shadow-lg shadow-indigo-100'
                          }`}
                        >
                          <span className="italic">{sound.char}</span>
                        </motion.button>
                     ))
                   )}
                </AnimatePresence>
             </motion.div>
          </div>

          <div className="shrink-0 h-auto bg-primary/5/50 backdrop-blur-md p-2 lg:p-10 rounded-[1.5rem] lg:rounded-[3.5rem] border-4 border-white italic overflow-y-auto max-h-[500px] lg:max-h-[450px]">
             <div className="flex flex-row gap-1.5 lg:gap-16 items-start justify-between w-full pb-2 lg:pb-0">
                {Object.entries(PHONICS).map(([key, sounds]) => (
                  <div key={key} className={`space-y-1 lg:space-y-4 shrink-0 ${key === 'single' ? 'flex-[4] lg:flex-[2]' : 'flex-[2] lg:flex-1'}`}>
                    <h4 className="text-[8px] lg:text-[10px] font-bold text-primary/70 uppercase tracking-[0.1em] lg:tracking-[0.2em] px-1 lg:px-2 text-left truncate">
                      <FormattedMessage id={`wordbuilder.group.${key}`} />
                    </h4>
                    <div className={`grid gap-[2px] lg:gap-2 justify-start w-full ${
                      key === 'single' ? 'grid-cols-4 lg:grid-cols-6' : 'grid-cols-2 lg:grid-cols-3'
                    }`}>
                      {sounds.map((sound) => (
                        <button
                          key={sound.char}
                          onClick={() => addSound(sound)}
                          className={`w-full aspect-square lg:aspect-auto lg:w-12 lg:h-12 rounded-md lg:rounded-xl font-bold text-sm lg:text-base flex items-center justify-center transition-all border-2 hover:scale-110 active:scale-90 ${
                            sound.type === 'vowel' 
                              ? 'bg-surface border-caution-border text-caution hover:border-rose-400' 
                              : 'bg-surface border-primary/20 text-primary hover:border-indigo-400'
                          }`}
                        >
                          {sound.char}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
             </div>
          </div>
      </div>

      <SettingsPanel
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        title={intl.formatMessage({ id: 'wordbuilder.title' })}
      >
        <div className="space-y-8">
          <button
            onClick={clearWord}
            className="w-full py-6 bg-surface border-4 border-slate-100 text-neutral-400 rounded-3xl font-bold text-xs uppercase tracking-widest hover:border-caution-border hover:text-caution transition-all flex items-center justify-center"
          >
            <FormattedMessage id="emotion.reset" />
          </button>
        </div>
      </SettingsPanel>
    </ToolPanel>
  );
};

export default WordBuilder;
