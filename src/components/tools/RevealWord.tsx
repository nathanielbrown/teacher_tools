import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  Pause, 
  Eye,
  SkipForward,
  BookOpen
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { storage } from '../../utils/storage';
import { FormattedMessage } from 'react-intl';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import ToolPanel from '../shared/ToolPanel';
import WordPanel, { WordList } from '../shared/WordPanel';
import { useHeader } from '../../contexts/HeaderContext';
import { useSettings } from '../../contexts/SettingsContext';
import { audioEngine } from '../../utils/audio';

// 1. Constants
// WordList interface moved to WordPanel.tsx

// 2. Config (None)

// 3. Text (Help and Info)
const HelpContent = () => (
  <div className="space-y-4 font-['Outfit']">
    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">
      <FormattedMessage id="revealword.help.title" defaultMessage="How to Play" />
    </h3>
    <div className="space-y-3">
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center text-xs font-black text-indigo-600 shrink-0">1</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">
          <FormattedMessage id="revealword.help.step1" defaultMessage="Choose a word list or create your own." />
        </p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center text-xs font-black text-indigo-600 shrink-0">2</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">
          <FormattedMessage id="revealword.help.step2" defaultMessage="Click Start Game to begin." />
        </p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center text-xs font-black text-indigo-600 shrink-0">3</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">
          <FormattedMessage id="revealword.help.step3" defaultMessage="Click Reveal to show a random letter, or use Auto to reveal over time." />
        </p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center text-xs font-black text-indigo-600 shrink-0">4</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">
          <FormattedMessage id="revealword.help.step4" defaultMessage="Try to guess the word as quickly as possible!" />
        </p>
      </div>
    </div>
  </div>
);

// 4. Local Storage (None, handled in component)

// 5. Classes (None)

// 6. Functions (None)

// 7. Component
export const RevealWord = () => {
  const { setHeaderActions, setHelpContent, setOnReset, clearHeader } = useHeader();
  const { settings } = useSettings();
  
  const [lists] = useLocalStorage<WordList[]>('spelling_lists', []);
  
  const [selectedListId, setSelectedListId] = useState('');
  const [currentWord, setCurrentWord] = useState('');
  const [queue, setQueue] = useState<string[]>([]);
  const [revealedIndices, setRevealedIndices] = useState<number[]>([]);
  const [isAutoRevealing, setIsAutoRevealing] = useState(false);
  const [revealSpeed, setRevealSpeed] = useState(2000);
  const [isPanelVisible, setIsPanelVisible] = useState(true);

  // Set default selection if none
  useEffect(() => {
    if (!selectedListId && lists.length > 0) {
      setSelectedListId(lists[0].id);
    }
  }, [lists, selectedListId]);

  // Initialize first word
  useEffect(() => {
    if (!currentWord && lists.length > 0) {
      const list = lists.find(l => l.id === selectedListId) || lists[0];
      const shuffled = [...list.words].sort(() => Math.random() - 0.5);
      setCurrentWord(shuffled[0] || '');
      setQueue(shuffled.slice(1));
    }
  }, [currentWord, lists, selectedListId]);

  useEffect(() => {
    storage.setItem('reveal_word_lists', JSON.stringify(lists));
  }, [lists]);

  const resetToSetup = useCallback(() => {
    setIsAutoRevealing(false);
    setRevealedIndices([]);
    audioEngine.playTick(settings.soundTheme);
  }, [settings.soundTheme]);

  useEffect(() => {
    setOnReset(() => resetToSetup);
    setHelpContent(<HelpContent />);
    setHeaderActions(
      <button
        onClick={() => setIsPanelVisible(prev => !prev)}
        className={`p-2.5 rounded-[1rem] transition-all duration-300 ${isPanelVisible 
          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' 
          : 'text-indigo-600 bg-indigo-50/50 hover:bg-indigo-100/80'}`}
        title="Toggle Sidebar"
      >
        <BookOpen size={20} strokeWidth={2.5} />
      </button>
    );
    return () => clearHeader();
  }, [clearHeader, setOnReset, resetToSetup, setHelpContent, setHeaderActions, isPanelVisible]);

  const handleListChange = (id: string) => {
    setSelectedListId(id);
    const list = lists.find(l => l.id === id);
    if (list && list.words.length > 0) {
      const shuffled = [...list.words].sort(() => Math.random() - 0.5);
      setCurrentWord(shuffled[0]);
      setQueue(shuffled.slice(1));
      setRevealedIndices([]);
      setIsAutoRevealing(false);
    }
  };

  const handleWordsChange = (_newWords: string[]) => {
    // Read-only in this view
  };

  const handleManageLists = () => {
    window.history.pushState({}, '', '/config/wordmanager');
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  const startNextWord = useCallback(() => {
    let nextWord = '';
    let nextQueue = [...queue];

    if (nextQueue.length === 0) {
      const list = lists.find(l => l.id === selectedListId);
      if (!list) return;
      const shuffled = [...list.words].sort(() => Math.random() - 0.5);
      nextWord = shuffled[0];
      nextQueue = shuffled.slice(1);
    } else {
      nextWord = nextQueue[0];
      nextQueue = nextQueue.slice(1);
    }
    setCurrentWord(nextWord);
    setQueue(nextQueue);
    setRevealedIndices([]);
    setIsAutoRevealing(false);
    audioEngine.playTick(settings.soundTheme);
  }, [lists, queue, selectedListId, settings.soundTheme]);

  const revealLetter = useCallback(() => {
    if (!currentWord) return;
    
    const unrevealed = [];
    for (let i = 0; i < currentWord.length; i++) {
      if (!revealedIndices.includes(i)) unrevealed.push(i);
    }

    if (unrevealed.length > 0) {
      const randomIndex = unrevealed[Math.floor(Math.random() * unrevealed.length)];
      setRevealedIndices(prev => [...prev, randomIndex]);
      audioEngine.playTick(settings.soundTheme);
      
      if (unrevealed.length === 1) {
        setIsAutoRevealing(false);
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
        audioEngine.playSuccess(settings.soundTheme);
      }
    }
  }, [currentWord, revealedIndices, settings.soundTheme]);

  useEffect(() => {
    let timer: any;
    if (isAutoRevealing) {
      timer = setInterval(() => {
        if (revealedIndices.length < currentWord.length) {
          revealLetter();
        } else {
          setIsAutoRevealing(false);
        }
      }, revealSpeed);
    }
    return () => clearInterval(timer);
  }, [isAutoRevealing, revealLetter, revealSpeed, currentWord.length, revealedIndices.length]);

  return (
    <div className="flex flex-col lg:flex-row h-full w-full italic overflow-hidden transition-all duration-500 ease-in-out gap-8">
      <AnimatePresence>
        {isPanelVisible && (
          <div className="flex flex-col gap-6 w-full lg:w-[400px] shrink-0 h-full overflow-hidden">
            <WordPanel
              isOpen={true}
              onClose={() => setIsPanelVisible(false)}
              selectedListId={selectedListId}
              onListChange={handleListChange}
              lists={lists}
              onWordsChange={handleWordsChange}
              onManageLists={handleManageLists}
              manageListsLabel={<FormattedMessage id="wordpanel.link.addRemove" defaultMessage="Add/Remove Lists" />}
              className="h-full min-h-0"
            />
          </div>
        )}
      </AnimatePresence>

      <ToolPanel baseWidth={isPanelVisible ? 1200 : 1600} baseHeight={800}>
        <div className="w-full h-full flex flex-col items-center justify-center p-8 gap-8 relative overflow-hidden group">
          <div className="flex-1 flex flex-col items-center justify-center w-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentWord}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center gap-12 z-10 w-full"
              >
                <div className="flex flex-wrap justify-center gap-4 md:gap-6 max-w-5xl">
                  {currentWord.split('').map((letter, idx) => {
                    const isRevealed = revealedIndices.includes(idx);
                    return (
                      <motion.div
                        key={`${currentWord}-${idx}`}
                        animate={{
                          scale: isRevealed ? [1, 1.1, 1] : 1,
                          rotateY: isRevealed ? 0 : 180,
                        }}
                        className={`w-28 h-40 md:w-40 md:h-52 rounded-[3rem] border-8 flex items-center justify-center text-7xl md:text-9xl font-black not-italic relative transition-colors ${isRevealed ? 'bg-indigo-600 border-white text-white' : 'bg-slate-200 border-slate-100 text-slate-400'}`}
                      >
                        {isRevealed ? letter.toUpperCase() : '?'}
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Controls Section */}
          <div className="w-full max-w-5xl bg-white/40 backdrop-blur-md p-10 rounded-[3rem] border-4 border-white flex flex-col gap-8 shrink-0">
            <div className="flex items-center justify-between gap-16">
              <div className="flex items-baseline gap-3 shrink-0">
                <span className="text-8xl font-black text-indigo-600 italic tracking-tighter leading-none tabular-nums">
                  {revealedIndices.length}
                </span>
                <span className="text-3xl font-black text-slate-300 uppercase">/ {currentWord.length || 0}</span>
              </div>

              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between px-2">
                  <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">
                    <FormattedMessage id="revealword.speed" defaultMessage="Speed" />
                  </span>
                  <span className="text-xs font-black text-slate-400 tabular-nums">{(revealSpeed / 1000).toFixed(1)}s</span>
                </div>
                <div className="h-4 bg-slate-100 rounded-full p-1 border border-slate-200 relative">
                  <input 
                    type="range" min="500" max="5000" step="500"
                    value={revealSpeed}
                    onChange={(e) => setRevealSpeed(Number(e.target.value))}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                  />
                  <motion.div 
                    className="h-full bg-indigo-500 rounded-full"
                    animate={{ width: `${((revealSpeed - 500) / 4500) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 h-24">
              <button
                onClick={revealLetter}
                disabled={revealedIndices.length === currentWord.length}
                className="bg-white border-4 border-slate-50 rounded-2xl flex flex-col items-center justify-center gap-2 hover:border-indigo-100 transition-all active:scale-95 disabled:opacity-50"
              >
                <Eye size={20} strokeWidth={3} className="text-indigo-600" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">
                  <FormattedMessage id="revealword.action.reveal" defaultMessage="Reveal" />
                </span>
              </button>

              <button
                onClick={() => setIsAutoRevealing(!isAutoRevealing)}
                className={`rounded-2xl border-4 flex flex-col items-center justify-center gap-2 transition-all active:scale-95 ${isAutoRevealing ? 'bg-amber-500 border-amber-400 text-white' : 'bg-indigo-600 border-indigo-400 text-white hover:bg-indigo-700'}`}
              >
                {isAutoRevealing ? <Pause size={20} strokeWidth={3} /> : <Play size={20} strokeWidth={3} className="ml-1" />}
                <span className="text-[10px] font-black uppercase tracking-widest">
                  {isAutoRevealing ? <FormattedMessage id="revealword.action.stop" defaultMessage="Stop" /> : <FormattedMessage id="revealword.action.auto" defaultMessage="Auto" />}
                </span>
              </button>

              <button
                onClick={startNextWord}
                className="bg-white border-4 border-slate-50 rounded-2xl flex flex-col items-center justify-center gap-2 hover:border-indigo-100 transition-all active:scale-95"
              >
                <SkipForward size={20} strokeWidth={3} className="text-slate-400" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-800">
                  <FormattedMessage id="revealword.action.next" defaultMessage="Next Word" />
                </span>
              </button>
            </div>
          </div>
        </div>
      </ToolPanel>
    </div>
  );
};

export default RevealWord;
