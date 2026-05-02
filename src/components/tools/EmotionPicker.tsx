import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart
} from 'lucide-react';
import { useIntl, FormattedMessage } from 'react-intl';
import { useHeader } from '../../contexts/HeaderContext';
import { useSettings } from '../../contexts/SettingsContext';
import { audioEngine } from '../../utils/audio';
import { ToolPanel } from '../shared/ToolPanel';

// 1. Constants
const EMOTIONS = [
  { emoji: '😀', id: 'emotion.happy', label: 'Happy', color: '#10b981', category: 'Positive' },
  { emoji: '😂', id: 'emotion.joyful', label: 'Joyful', color: '#f59e0b', category: 'Positive' },
  { emoji: '😊', id: 'emotion.content', label: 'Content', color: '#34d399', category: 'Positive' },
  { emoji: '🥰', id: 'emotion.loved', label: 'Loved', color: '#fb7185', category: 'Positive' },
  { emoji: '😎', id: 'emotion.cool', label: 'Cool', color: '#6366f1', category: 'Positive' },
  { emoji: '🤩', id: 'emotion.excited', label: 'Excited', color: '#facc15', category: 'Positive' },
  { emoji: '🤔', id: 'emotion.curious', label: 'Curious', color: '#818cf8', category: 'Neutral' },
  { emoji: '😐', id: 'emotion.neutral', label: 'Neutral', color: '#94a3b8', category: 'Neutral' },
  { emoji: '🥱', id: 'emotion.tired', label: 'Tired', color: '#64748b', category: 'Neutral' },
  { emoji: '😴', id: 'emotion.sleepy', label: 'Sleepy', color: '#475569', category: 'Neutral' },
  { emoji: '😕', id: 'emotion.confused', label: 'Confused', color: '#fbbf24', category: 'Neutral' },
  { emoji: '😟', id: 'emotion.worried', label: 'Worried', color: '#f87171', category: 'Intense' },
  { emoji: '😢', id: 'emotion.sad', label: 'Sad', color: '#60a5fa', category: 'Intense' },
  { emoji: '😭', id: 'emotion.upset', label: 'Upset', color: '#3b82f6', category: 'Intense' },
  { emoji: '😤', id: 'emotion.frustrated', label: 'Frustrated', color: '#f97316', category: 'Intense' },
  { emoji: '😡', id: 'emotion.angry', label: 'Angry', color: '#ef4444', category: 'Intense' },
  { emoji: '🤯', id: 'emotion.overwhelmed', label: 'Overwhelmed', color: '#a855f7', category: 'Intense' },
  { emoji: '🤢', id: 'emotion.sick', label: 'Sick', color: '#22c55e', category: 'Physical' },
  { emoji: '🤒', id: 'emotion.unwell', label: 'Unwell', color: '#4ade80', category: 'Physical' },
  { emoji: '🤫', id: 'emotion.quiet', label: 'Quiet', color: '#94a3b8', category: 'Neutral' },
];

// 2. Config (None)

// 3. Text (Help and Info)
const getHelpInfo = () => (
  <div className="space-y-4 font-['Outfit']">
    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight italic">
      <FormattedMessage id="emotion.help.title" defaultMessage="How to Use the Emotion Picker" />
    </h3>
    <div className="space-y-3 italic">
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center text-xs font-black text-indigo-600 shrink-0">1</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">
          <FormattedMessage id="emotion.help.step1" defaultMessage="Look at the different emojis and choose the one that best matches how you feel right now." />
        </p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center text-xs font-black text-blue-600 shrink-0">2</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">
          <FormattedMessage 
            id="emotion.help.step2" 
            defaultMessage="Click on an <b>Emoji</b> to see it full screen and read the emotion name."
            values={{ b: (chunks: React.ReactNode) => <b>{chunks}</b> }}
          />
        </p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-rose-50 flex items-center justify-center text-xs font-black text-rose-600 shrink-0">3</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">
          <FormattedMessage 
            id="emotion.help.step3" 
            defaultMessage="If you want to pick a different one, click the <b>Change</b> button."
            values={{ b: (chunks: React.ReactNode) => <b>{chunks}</b> }}
          />
        </p>
      </div>
    </div>
  </div>
);

// 4. Local Storage (None)

// 5. Classes (None)

// 6. Functions (None)

// 7. Component
export const EmotionPicker = () => {
  const [selectedEmotion, setSelectedEmotion] = useState<any>(null);
  const { setHeaderActions, setOnReset, clearHeader, setHelpContent } = useHeader();
  const { settings } = useSettings();
  const intl = useIntl();

  const resetTool = useCallback(() => {
    setSelectedEmotion(null);
    audioEngine.playTick(settings.soundTheme);
  }, [settings.soundTheme]);

  useEffect(() => {
    setOnReset(() => resetTool);
    setHelpContent(getHelpInfo());
    return () => clearHeader();
  }, [clearHeader, setOnReset, resetTool, setHelpContent]);

  useEffect(() => {
    setHeaderActions(null);
  }, [setHeaderActions]);

  return (
    <ToolPanel baseWidth={1200} baseHeight={800}>
      <div className="w-full max-w-5xl flex flex-col items-center gap-12 lg:gap-16 relative z-10">
        
        <div className="text-center space-y-4">
          <div className="space-y-1">
             <h1 className="text-5xl lg:text-6xl font-black text-slate-900 tracking-tighter uppercase leading-none">
               <FormattedMessage id="emotion.title" defaultMessage="Emotion Picker" />
             </h1>
          </div>
        </div>

        {/* Emotion Display */}
        <div className="w-full bg-slate-50/50 backdrop-blur-xl rounded-[3.5rem] border-4 border-white p-10 lg:p-14  min-h-[600px] flex items-center justify-center relative overflow-hidden">
           <div className="tool-grid-bg opacity-10 pointer-events-none" />
           
           <AnimatePresence mode="wait">
             {!selectedEmotion ? (
               <motion.div 
                 key="grid"
                 initial={{ opacity: 0, scale: 0.98 }}
                 animate={{ opacity: 1, scale: 1 }}
                 exit={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
                 className="w-full"
               >
                 <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-6">
                   {EMOTIONS.map((emotion, index) => (
                     <motion.button
                       key={emotion.label}
                       initial={{ opacity: 0, y: 10 }}
                       animate={{ opacity: 1, y: 0 }}
                       transition={{ delay: index * 0.02 }}
                       onClick={() => { setSelectedEmotion(emotion); audioEngine.playTick(settings.soundTheme); }}
                       className="group aspect-square w-full bg-white border-4 border-slate-100 rounded-3xl hover:border-rose-200  transition-all active:scale-95 flex flex-col items-center justify-center gap-3 p-4 "
                     >
                       <span className="text-5xl md:text-6xl transition-transform group-hover:scale-110 duration-500">
                         {emotion.emoji}
                       </span>
                       <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">
                         {intl.formatMessage({ id: emotion.id, defaultMessage: emotion.label })}
                       </span>
                     </motion.button>
                   ))}
                 </div>
               </motion.div>
             ) : (
               <motion.div
                 key="result"
                 initial={{ opacity: 0, scale: 0.9 }}
                 animate={{ opacity: 1, scale: 1 }}
                 exit={{ opacity: 0, scale: 0.9 }}
                 className="flex flex-col items-center gap-12"
               >
                 <motion.div 
                   initial={{ rotate: -10 }}
                   animate={{ rotate: 0 }}
                   className="text-[15rem] md:text-[18rem] -[0_30px_60px_rgba(0,0,0,0.2)]"
                 >
                    {selectedEmotion.emoji}
                 </motion.div>
                 
                  <div className="text-center space-y-4">
                     <h3 className="text-7xl md:text-8xl font-black text-slate-900 uppercase tracking-tighter leading-none">
                       {intl.formatMessage({ id: selectedEmotion.id, defaultMessage: selectedEmotion.label })}
                     </h3>
                  </div>

                  <button 
                    onClick={resetTool}
                    className="px-12 py-6 bg-white text-slate-900 border-4 border-slate-50 rounded-[2.5rem] font-black uppercase tracking-[0.2em] text-sm hover:bg-slate-50 transition-all active:scale-95 "
                  >
                    <FormattedMessage id="emotion.change" defaultMessage="Change" />
                  </button>
               </motion.div>
             )}
           </AnimatePresence>
        </div>
      </div>

      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-rose-50 rounded-full blur-[120px] opacity-40 -z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-50 rounded-full blur-[120px] opacity-40 -z-10 pointer-events-none" />
    </ToolPanel>
  );
};

export default EmotionPicker;
