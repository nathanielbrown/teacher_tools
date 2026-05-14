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
import { FormattedMessage } from 'react-intl';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import ToolPanel from '../shared/ToolPanel';
import WordPanel, { WordList } from '../shared/WordPanel';
import { useHeader } from '../../contexts/HeaderContext';
import { useSettings } from '../../contexts/SettingsContext';
import { audioEngine } from '../../utils/audio';

// 1. Constants
const BLANK_LIST_ID = 'blank';
const BLANK_LIST = { id: BLANK_LIST_ID, name: '(BLANK)', words: [] };

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
  
  const [lists, setLists] = useLocalStorage<WordList[]>('word_manager_lists', []);
  const [sessionLists, setSessionLists] = useState<WordList[]>(lists);
  
  const [selectedListId, setSelectedListId] = useLocalStorage<string>('reveal_word_selected_list_id', BLANK_LIST_ID);
  const [currentWord, setCurrentWord] = useState('');
  const [queue, setQueue] = useState<string[]>([]);
  const [revealedIndices, setRevealedIndices] = useState<number[]>([]);
  const [isAutoRevealing, setIsAutoRevealing] = useState(false);
  const [revealSpeed, setRevealSpeed] = useLocalStorage<number>('reveal_word_speed', 2000);
  const [isPanelVisible, setIsPanelVisible] = useLocalStorage<boolean>('reveal_word_panel_visible', true);
  const [newlyCreatedIds, setNewlyCreatedIds] = useState<string[]>([]);
  const [isMobile, setIsMobile] = useState(false);

  // Check for mobile view
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Sync session lists with stored lists
  useEffect(() => {
    setSessionLists(lists);
  }, [lists]);

  // Set default selection if none
  useEffect(() => {
    if (!selectedListId) {
      setSelectedListId(BLANK_LIST_ID);
    }
  }, [selectedListId, setSelectedListId]);

  // Initialize first word
  useEffect(() => {
    if (!currentWord && (sessionLists.length > 0 || selectedListId === BLANK_LIST_ID)) {
      const allLists = [BLANK_LIST, ...sessionLists];
      const list = allLists.find(l => l.id === selectedListId) || BLANK_LIST;
      if (list.words.length > 0) {
        const shuffled = [...list.words].sort(() => Math.random() - 0.5);
        setCurrentWord(shuffled[0]);
        setQueue(shuffled.slice(1));
      } else {
        setCurrentWord('');
        setQueue([]);
      }
    }
  }, [currentWord, sessionLists, selectedListId]);

  // Lists handled by word manager

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
  }, [clearHeader, setOnReset, resetToSetup, setHelpContent, setHeaderActions, isPanelVisible, setIsPanelVisible]);

  const handleListChange = (id: string) => {
    setSelectedListId(id);
    const allLists = [BLANK_LIST, ...sessionLists];
    const list = allLists.find(l => l.id === id);
    if (list && list.words.length > 0) {
      const shuffled = [...list.words].sort(() => Math.random() - 0.5);
      setCurrentWord(shuffled[0]);
      setQueue(shuffled.slice(1));
      setRevealedIndices([]);
      setIsAutoRevealing(false);
    } else {
      setCurrentWord('');
      setQueue([]);
      setRevealedIndices([]);
      setIsAutoRevealing(false);
    }
  };

  const handleWordsChange = (newWords: string[]) => {
    if (selectedListId === BLANK_LIST_ID) {
      if (newWords.length === 0) return;

      // Create a new list called "User List X"
      const userListPattern = /^User List (\d+)$/;
      let maxNum = 0;
      lists.forEach(l => {
        const match = l.name.match(userListPattern);
        if (match) {
          const num = parseInt(match[1]);
          if (num > maxNum) maxNum = num;
        }
      });
      
      const newId = Date.now().toString() + Math.random();
      const newList = {
        id: newId,
        name: `User List ${maxNum + 1}`,
        words: newWords
      };
      
      setLists([...lists, newList]);
      setSelectedListId(newId);
      setNewlyCreatedIds(prev => [...prev, newId]);
      
      // Update game with first word
      const shuffled = [...newWords].sort(() => Math.random() - 0.5);
      setCurrentWord(shuffled[0]);
      setQueue(shuffled.slice(1));
      setRevealedIndices([]);
    } else {
      // Modify session list
      setSessionLists(prev => prev.map(l => 
        l.id === selectedListId ? { ...l, words: newWords } : l
      ));
      
      // If the list was created in this session, we update the global lists too
      if (newlyCreatedIds.includes(selectedListId)) {
        setLists(prev => prev.map(l => 
          l.id === selectedListId ? { ...l, words: newWords } : l
        ));
      }
    }
  };

  const handleManageLists = () => {
    window.history.pushState({}, '', '/config/wordmanager');
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  const startNextWord = useCallback(() => {
    let nextWord = '';
    let nextQueue = [...queue];

    if (nextQueue.length === 0) {
      const allLists = [BLANK_LIST, ...sessionLists];
      const list = allLists.find(l => l.id === selectedListId);
      if (!list || list.words.length === 0) return;
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
  }, [sessionLists, queue, selectedListId, settings.soundTheme]);

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
              lists={[BLANK_LIST, ...sessionLists]}
              onWordsChange={handleWordsChange}
              onManageLists={handleManageLists}
              manageListsLabel={<FormattedMessage id="wordpanel.link.addRemove" defaultMessage="Add/Remove Lists" />}
              className="h-full min-h-0"
            >
              {isMobile && (
                <button
                  onClick={() => {
                    setIsPanelVisible(false);
                    audioEngine.playTick(settings.soundTheme);
                  }}
                  className="w-full py-6 bg-indigo-600 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] active:scale-95 transition-all flex items-center justify-center gap-3 mb-2"
                >
                  <Play size={20} strokeWidth={3} fill="currentColor" />
                  <FormattedMessage id="revealword.play" defaultMessage="Play Game" />
                </button>
              )}
            </WordPanel>
          </div>
        )}
      </AnimatePresence>

      <ToolPanel 
        baseWidth={isMobile ? (isPanelVisible ? 800 : 600) : (isPanelVisible ? 1200 : 1600)} 
        baseHeight={isMobile ? 1000 : 800}
      >
        <div className={`w-full h-full flex flex-col items-center justify-center ${isMobile ? 'p-4 pb-8' : 'p-8'} gap-8 relative overflow-hidden group`}>
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
                        className={`w-20 h-28 md:w-28 md:h-40 lg:w-36 lg:h-48 rounded-[2rem] md:rounded-[3rem] border-4 md:border-8 flex items-center justify-center text-5xl md:text-7xl lg:text-8xl font-black not-italic relative transition-colors ${isRevealed ? 'bg-indigo-600 border-white text-white' : 'bg-slate-200 border-slate-100 text-slate-400'}`}
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
          <div className={`w-full ${isMobile ? 'max-w-none' : 'max-w-5xl'} bg-white/40 backdrop-blur-md p-6 md:p-10 rounded-[2.5rem] md:rounded-[3rem] border-4 border-white flex flex-col gap-6 md:gap-8 shrink-0`}>
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 md:gap-16">
              <div className="flex items-baseline gap-3 shrink-0">
                <span className="text-8xl md:text-9xl font-black text-indigo-600 italic tracking-tighter leading-none tabular-nums">
                  {revealedIndices.length}
                </span>
                <span className="text-3xl md:text-3xl font-black text-slate-300 uppercase">/ {currentWord.length || 0}</span>
              </div>

              <div className="flex-1 w-full space-y-4 md:space-y-3">
                <div className="flex items-center justify-between px-2">
                  <span className="text-sm md:text-sm font-black text-indigo-400 uppercase tracking-widest">
                    <FormattedMessage id="revealword.speed" defaultMessage="Speed" />
                  </span>
                  <span className="text-base md:text-base font-black text-slate-400 tabular-nums">{(revealSpeed / 1000).toFixed(1)}s</span>
                </div>
                <div className="h-6 md:h-6 bg-slate-100 rounded-full p-1 border border-slate-200 relative">
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

            <div className="grid grid-cols-3 gap-4 md:gap-4 h-28 md:h-32">
              <button
                onClick={revealLetter}
                disabled={revealedIndices.length === currentWord.length}
                className="bg-white border-4 border-slate-50 rounded-2xl md:rounded-3xl flex flex-col items-center justify-center gap-2 hover:border-indigo-100 transition-all active:scale-95 disabled:opacity-50"
              >
                <Eye size={32} strokeWidth={3} className="text-indigo-600" />
                <span className="text-sm md:text-sm font-black uppercase tracking-widest text-slate-900">
                  <FormattedMessage id="revealword.action.reveal" defaultMessage="Reveal" />
                </span>
              </button>

              <button
                onClick={() => setIsAutoRevealing(!isAutoRevealing)}
                className={`rounded-2xl md:rounded-3xl border-4 flex flex-col items-center justify-center gap-2 transition-all active:scale-95 ${isAutoRevealing ? 'bg-amber-500 border-amber-400 text-white' : 'bg-indigo-600 border-indigo-400 text-white hover:bg-indigo-700'}`}
              >
                {isAutoRevealing ? <Pause size={32} strokeWidth={3} /> : <Play size={32} strokeWidth={3} className="ml-1" />}
                <span className="text-sm md:text-sm font-black uppercase tracking-widest">
                  {isAutoRevealing ? <FormattedMessage id="revealword.action.stop" defaultMessage="Stop" /> : <FormattedMessage id="revealword.action.auto" defaultMessage="Auto" />}
                </span>
              </button>

              <button
                onClick={startNextWord}
                className="bg-white border-4 border-slate-50 rounded-2xl md:rounded-3xl flex flex-col items-center justify-center gap-2 hover:border-indigo-100 transition-all active:scale-95"
              >
                <SkipForward size={32} strokeWidth={3} className="text-slate-400" />
                <span className="text-sm md:text-sm font-black uppercase tracking-widest text-slate-800">
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
