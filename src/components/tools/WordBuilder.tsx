import React, { useState, useEffect, useCallback } from 'react';
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
import { useSettings } from '../../contexts/SettingsContext';
import { useHeader } from '../../contexts/HeaderContext';
import { useIntl, FormattedMessage } from 'react-intl';
import ToolPanel from '../shared/ToolPanel';
import SettingsPanel from '../shared/SettingsPanel';

// 1. Constants
const PHONICS = [
  { char: 'a', type: 'vowel' }, { char: 'b', type: 'consonant' }, { char: 'c', type: 'consonant' },
  { char: 'd', type: 'consonant' }, { char: 'e', type: 'vowel' }, { char: 'f', type: 'consonant' },
  { char: 'g', type: 'consonant' }, { char: 'h', type: 'consonant' }, { char: 'i', type: 'vowel' },
  { char: 'j', type: 'consonant' }, { char: 'k', type: 'consonant' }, { char: 'l', type: 'consonant' },
  { char: 'm', type: 'consonant' }, { char: 'n', type: 'consonant' }, { char: 'o', type: 'vowel' },
  { char: 'p', type: 'consonant' }, { char: 'q', type: 'consonant' }, { char: 'r', type: 'consonant' },
  { char: 's', type: 'consonant' }, { char: 't', type: 'consonant' }, { char: 'u', type: 'vowel' },
  { char: 'v', type: 'consonant' }, { char: 'w', type: 'consonant' }, { char: 'x', type: 'consonant' },
  { char: 'y', type: 'consonant' }, { char: 'z', type: 'consonant' },
  { char: 'ch', type: 'digraph' }, { char: 'sh', type: 'digraph' }, { char: 'th', type: 'digraph' },
  { char: 'qu', type: 'digraph' }, { char: 'ng', type: 'digraph' }
];

// 3. Text (Help and Info)
const HelpContent = () => (
  <div className="space-y-4 font-['Outfit']">
    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">
      <FormattedMessage id="wordbuilder.help.title" />
    </h3>
    <div className="space-y-3">
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center text-xs font-black text-indigo-600 shrink-0">1</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">
          <FormattedMessage 
            id="wordbuilder.help.step1" 
            defaultMessage="Click a <b>Sound</b> at the bottom to add it to your word."
            values={{ b: (chunks: React.ReactNode) => <b>{chunks}</b> }}
          />
        </p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center text-xs font-black text-indigo-600 shrink-0">2</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">
          <FormattedMessage 
            id="wordbuilder.help.step2" 
            defaultMessage="Vowels are red and consonants are blue."
            values={{ b: (chunks: React.ReactNode) => <b>{chunks}</b> }}
          />
        </p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center text-xs font-black text-indigo-600 shrink-0">3</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">
          <FormattedMessage 
            id="wordbuilder.help.step3" 
            defaultMessage="Click <b>Listen</b> to hear each sound in your word."
            values={{ b: (chunks: React.ReactNode) => <b>{chunks}</b> }}
          />
        </p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center text-xs font-black text-indigo-600 shrink-0">4</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">
          <FormattedMessage 
            id="wordbuilder.help.step4" 
            defaultMessage="Click a sound on the board to remove it."
            values={{ b: (chunks: React.ReactNode) => <b>{chunks}</b> }}
          />
        </p>
      </div>
    </div>
  </div>
);

export const WordBuilder = () => {
  const intl = useIntl();
  const { setOnReset, clearHeader, setHelpContent, isConfigOpen, setIsConfigOpen } = useHeader();
  const { settings } = useSettings();
  const [word, setWord] = useState<{ char: string, type: string, id: number }[]>([]);

  const speak = useCallback((text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.8;
      window.speechSynthesis.speak(utterance);
    }
  }, []);

  const addSound = (sound: { char: string, type: string }) => {
    setWord(prev => [...prev, { ...sound, id: Date.now() + Math.random() }]);
    audioEngine.playTick(settings.soundTheme);
    speak(sound.char);
  };

  const removeSound = (id: number) => {
    setWord(prev => prev.filter(s => s.id !== id));
    audioEngine.playTick(settings.soundTheme);
  };

  const clearWord = useCallback(() => {
    setWord([]);
    audioEngine.playTick(settings.soundTheme);
  }, [settings.soundTheme]);

  const listenToWord = () => {
    if (word.length === 0) return;
    const fullWord = word.map(s => s.char).join('');
    speak(fullWord);
    audioEngine.playSuccess(settings.soundTheme);
  };

  useEffect(() => {
    setOnReset(() => clearWord);
    setHelpContent(<HelpContent />);
    return () => clearHeader();
  }, [clearHeader, setOnReset, clearWord, setHelpContent]);

  return (
    <div className="flex gap-8 h-full w-full italic">
      <ToolPanel baseWidth={1000} baseHeight={800}>
        <div className="w-full h-full flex flex-col gap-8 relative overflow-hidden p-12">
          <div className="tool-grid-bg opacity-20 pointer-events-none" />
          
          <div className="flex items-center justify-between">
             <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white -rotate-3 border-2 border-white">
                   <BookOpen size={24} strokeWidth={3} />
                </div>
                <div>
                   <h3 className="text-2xl font-black text-slate-900 tracking-tighter italic uppercase leading-none">
                     <FormattedMessage id="wordbuilder.label.word" />
                   </h3>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] leading-none mt-2">
                     <FormattedMessage id="wordbuilder.subtitle" />
                   </p>
                </div>
             </div>

             <div className="flex gap-4">
                <button
                  onClick={clearWord}
                  className="flex items-center gap-2 px-8 py-3 bg-white border-4 border-slate-50 text-slate-400 rounded-2xl font-black text-xs uppercase tracking-widest hover:border-rose-100 hover:text-rose-600 transition-all"
                >
                  <RotateCcw size={16} /> <FormattedMessage id="wordbuilder.label.clear" />
                </button>
                <button
                  onClick={listenToWord}
                  className="flex items-center gap-2 px-10 py-3 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-600 transition-all"
                >
                  <Volume2 size={16} /> <FormattedMessage id="wordbuilder.label.listen" />
                </button>
             </div>
          </div>

          <div className="flex-1 bg-white/50 backdrop-blur-xl rounded-[4rem] border-4 border-white flex items-center justify-center p-12 relative">
             <div className="tool-grid-bg opacity-10 pointer-events-none" />
             <div className="flex flex-wrap gap-4 justify-center">
                <AnimatePresence mode="popLayout">
                   {word.length === 0 ? (
                     <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-4 text-slate-300">
                        <Sparkles size={64} className="opacity-20" />
                        <span className="font-black text-xs uppercase tracking-[0.3em]">
                          <FormattedMessage id="wordbuilder.label.pick" />
                        </span>
                     </motion.div>
                   ) : (
                     word.map((sound) => (
                       <motion.button
                         key={sound.id}
                         layout
                         initial={{ scale: 0.8, opacity: 0, y: 20 }}
                         animate={{ scale: 1, opacity: 1, y: 0 }}
                         exit={{ scale: 0.8, opacity: 0, y: -20 }}
                         onClick={() => removeSound(sound.id)}
                         className={`w-32 h-40 rounded-[2.5rem] flex flex-col items-center justify-center text-5xl font-black border-[10px] border-white transition-all hover:scale-105 active:scale-95 group relative ${
                           sound.type === 'vowel' ? 'bg-rose-500 text-white' : 'bg-indigo-600 text-white'
                         }`}
                       >
                         <span className="italic">{sound.char}</span>
                         <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Trash2 size={16} className="text-white/40" />
                         </div>
                       </motion.button>
                     ))
                   )}
                </AnimatePresence>
             </div>
          </div>

          <div className="bg-slate-900/5 backdrop-blur-md p-8 rounded-[3.5rem] border-4 border-white italic shrink-0">
             <div className="flex flex-wrap gap-3 justify-center">
                {PHONICS.map((sound) => (
                  <button
                    key={sound.char}
                    onClick={() => addSound(sound)}
                    className={`px-6 py-4 rounded-2xl font-black text-xl transition-all border-4 hover:scale-110 active:scale-90 ${
                      sound.type === 'vowel' 
                        ? 'bg-white border-rose-100 text-rose-500 hover:border-rose-400' 
                        : 'bg-white border-indigo-100 text-indigo-600 hover:border-indigo-400'
                    }`}
                  >
                    {sound.char}
                  </button>
                ))}
             </div>
          </div>
        </div>
      </ToolPanel>

      <div className="w-[400px] shrink-0 flex flex-col gap-6">
        <div className="flex-1 bg-slate-900 p-10 rounded-[3rem] border-4 border-slate-800 flex flex-col items-center justify-center text-center relative overflow-hidden italic">
           <div className="tool-grid-bg opacity-10 pointer-events-none" />
           <div className="w-24 h-24 bg-indigo-500/20 rounded-3xl flex items-center justify-center text-indigo-400 mx-auto rotate-6 border-4 border-slate-800 mb-8">
              <Music size={48} strokeWidth={2} />
           </div>
           <div className="space-y-4">
              <h3 className="text-4xl font-black text-white tracking-tighter uppercase leading-none">
                <FormattedMessage id="wordbuilder.title" />
              </h3>
              <p className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] leading-relaxed italic">
                <FormattedMessage id="wordbuilder.subtitle" />
              </p>
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
              className="w-full py-6 bg-white border-4 border-slate-100 text-slate-400 rounded-3xl font-black text-xs uppercase tracking-widest hover:border-rose-100 hover:text-rose-600 transition-all flex items-center justify-center gap-4"
            >
              <RotateCcw size={20} />
              <FormattedMessage id="emotion.reset" />
            </button>
          </div>
        </SettingsPanel>
      </div>
    </div>
  );
};

export default WordBuilder;
