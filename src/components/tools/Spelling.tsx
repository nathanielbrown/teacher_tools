import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Volume2, 
  Play, 
  CheckCircle2, 
  XCircle, 
  RotateCcw, 
  Plus, 
  Trash2, 
  Pencil,
  ListRestart,
  TrendingUp,
  MousePointer2
} from 'lucide-react';
import { audioEngine } from '../../utils/audio';
import { useSettings } from '../../contexts/SettingsContext';
import { useHeader } from '../../contexts/HeaderContext';
import { speak } from '../../utils/speech';
import { shuffle } from '../../utils/random';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { DEFAULT_SPELLING_LISTS } from './Spelling/spellingData';
import { useIntl, FormattedMessage } from 'react-intl';
import ToolPanel from '../shared/ToolPanel';
import WordPanel, { WordList } from '../shared/WordPanel';
import { BookOpen } from 'lucide-react';

// 3. Text (Help and Info)
const HelpContent = () => (
  <div className="space-y-4 font-['Outfit']">
    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">
      <FormattedMessage id="spelling.help.title" />
    </h3>
    <div className="space-y-3">
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-primary/5 flex items-center justify-center text-xs font-black text-primary shrink-0">1</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">
          <FormattedMessage id="spelling.help.step1" defaultMessage="Pick a word list from the menu." />
        </p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-primary/5 flex items-center justify-center text-xs font-black text-primary shrink-0">2</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">
          <FormattedMessage id="spelling.help.step2" defaultMessage="Listen to the word and type it in the box." />
        </p>
      </div>
    </div>
  </div>
);

export const Spelling = () => {
  const intl = useIntl();
  const { setOnReset, clearHeader, setHelpContent, setHeaderActions } = useHeader();
  const { settings } = useSettings();
  
  const [status, setStatus] = useState('setup'); // 'setup', 'playing', 'finished'
  const [lists, setLists] = useLocalStorage<WordList[]>('word_manager_lists', DEFAULT_SPELLING_LISTS);
  
  const [selectedListId, setSelectedListId] = useState(lists[0]?.id || '');
  const [isPanelVisible, setIsPanelVisible] = useState(true);
  
  const [queue, setQueue] = useState<string[]>([]);
  const [currentWord, setCurrentWord] = useState('');
  const [userInput, setUserInput] = useState('');
  const [score, setScore] = useState(0);
  const [totalWords, setTotalWords] = useState(0);
  const [feedback, setFeedback] = useState<any>(null); 
  
  const inputRef = useRef<HTMLInputElement>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const resetToSetup = useCallback(() => {
    setStatus('setup');
    setIsPanelVisible(true);
    audioEngine.playTick(settings.soundTheme);
  }, [settings.soundTheme]);

  useEffect(() => {
    setOnReset(() => resetToSetup);
    setHelpContent(<HelpContent />);
    setHeaderActions(null);
    return () => clearHeader();
  }, [clearHeader, setOnReset, resetToSetup, setHelpContent, setHeaderActions, isPanelVisible]);

  const handleWordsChange = (newWords: string[]) => {
    setLists(prev => prev.map(l => l.id === selectedListId ? { ...l, words: newWords } : l));
  };

  const handleAddList = () => {
    const newList: WordList = {
      id: Date.now().toString(),
      name: intl.formatMessage({ id: 'wordpanel.newlist', defaultMessage: 'New List' }),
      words: []
    };
    setLists(prev => [...prev, newList]);
    setSelectedListId(newList.id);
  };

  const handleDeleteList = (id: string) => {
    if (lists.length <= 1) return;
    setLists(prev => prev.filter(l => l.id !== id));
    if (selectedListId === id) {
      setSelectedListId(lists.find(l => l.id !== id)?.id || '');
    }
  };

  const handleRenameList = (id: string, name: string) => {
    setLists(prev => prev.map(l => l.id === id ? { ...l, name } : l));
  };

  const handleManageLists = () => {
    window.history.pushState({}, '', '/config/wordmanager');
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  const startGame = () => {
    const list = lists.find((l: any) => l.id === selectedListId);
    if (!list || list.words.length === 0) return;

    const shuffled = shuffle(list.words);
    setQueue(shuffled);
    setCurrentWord(shuffled[0]);
    setTotalWords(shuffled.length);
    setScore(0);
    setFeedback(null);
    setStatus('playing');
    setUserInput('');
    setIsPanelVisible(false);
    audioEngine.playTick(settings.soundTheme);
    
    setTimeout(() => {
      speak(`${intl.formatMessage({ id: 'spelling.playing.repeat' })}: ${shuffled[0]}`);
      inputRef.current?.focus();
    }, 500);
  };

  const handleGuess = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || feedback) return;

    const isCorrect = userInput.trim().toLowerCase() === currentWord.toLowerCase();
    
    if (isCorrect) {
      setScore(s => s + 1);
      setFeedback({ type: 'success', message: intl.formatMessage({ id: 'spelling.feedback.correct' }) });
      audioEngine.playTick(settings.soundTheme);
      speak(intl.formatMessage({ id: 'spelling.feedback.correct' }));
    } else {
      setFeedback({ 
        type: 'error', 
        message: intl.formatMessage({ id: 'spelling.feedback.incorrect' }, { word: currentWord })
      });
      speak(`${intl.formatMessage({ id: 'spelling.feedback.incorrect' }, { word: '' })} ${currentWord.split('').join(' ')}`);
    }

    setTimeout(() => {
      const newQueue = [...queue];
      newQueue.shift();
      
      if (newQueue.length === 0) {
        setStatus('finished');
        speak(`${intl.formatMessage({ id: 'spelling.finished.title' })} ${intl.formatMessage({ id: 'spelling.finished.score' }, { score: isCorrect ? score + 1 : score, total: totalWords })}`);
      } else {
        setQueue(newQueue);
        setCurrentWord(newQueue[0]);
        setUserInput('');
        setFeedback(null);
        setTimeout(() => {
          speak(`${intl.formatMessage({ id: 'spelling.playing.repeat' })}: ${newQueue[0]}`);
          inputRef.current?.focus();
        }, 500);
      }
    }, 2500);
  };

  const repeatWord = () => {
    speak(currentWord);
    inputRef.current?.focus();
  };

  return (
    <div className={`flex flex-col lg:flex-row h-full w-full overflow-hidden transition-all duration-500 ease-in-out ${isMobile ? '-mx-2 w-[calc(100%+1rem)] gap-4' : 'gap-8'}`}>
      <AnimatePresence>
        {isPanelVisible && (
          <div className="flex flex-col gap-6 w-full lg:w-[400px] shrink-0 h-full overflow-hidden">
            <WordPanel
              isOpen={true}
              onClose={() => setIsPanelVisible(false)}
              selectedListId={selectedListId}
              onListChange={setSelectedListId}
              lists={lists}
              onWordsChange={handleWordsChange}
              onAddList={handleAddList}
              onDeleteList={handleDeleteList}
              onRenameList={handleRenameList}
              onManageLists={handleManageLists}
              manageListsLabel={<FormattedMessage id="wordpanel.link.addRemove" defaultMessage="Add/Remove Lists" />}
              className="h-full min-h-0"
            >
              {/* Mobile Play Button */}
              <div className="lg:hidden">
                <button
                  onClick={startGame}
                  className="w-full h-16 bg-primary text-white rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-primary/90 transition-all flex items-center justify-center gap-3 active:scale-95 shadow-lg shadow-indigo-200"
                >
                  <Play size={20} fill="currentColor" /> <FormattedMessage id="spelling.setup.start" />
                </button>
              </div>
            </WordPanel>
          </div>
        )}
      </AnimatePresence>

      <ToolPanel 
        baseWidth={isMobile ? (status === 'playing' ? 600 : 800) : (isPanelVisible ? 1200 : 1600)} 
        baseHeight={isMobile ? 1000 : 800}
      >
        <div className="w-full h-full flex flex-col items-center justify-center relative overflow-hidden group p-6 lg:p-12">
          <div className="tool-grid-bg opacity-20 pointer-events-none" />
          
          <AnimatePresence mode="wait">
            {status === 'setup' && (
              <motion.div
                key="setup"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col items-center gap-12 z-10 w-full"
              >
                <div className="text-center">
                  <h1 className="text-6xl lg:text-7xl font-black text-slate-900 uppercase tracking-tighter">
                    <FormattedMessage id="spelling.setup.title" />
                  </h1>
                </div>

                <button
                  onClick={startGame}
                  className="w-full max-w-sm h-24 bg-primary text-white rounded-[3rem] font-black uppercase tracking-[0.2em] text-xl hover:bg-primary/90 transition-all  flex items-center justify-center gap-6 border-4 border-white active:scale-95"
                >
                  <Play size={28} fill="currentColor" /> <FormattedMessage id="shared.button.play" />
                </button>
              </motion.div>
            )}

            {status === 'playing' && (
              <motion.div
                key="playing"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex-1 flex flex-col items-center justify-center gap-12 z-10 w-full max-w-2xl"
              >
                <div className="flex items-center gap-6">
                  <div className="px-6 py-2 bg-surface rounded-full border-2 border-slate-100 font-black text-neutral-400 uppercase tracking-widest text-xs">
                    <FormattedMessage id="spelling.playing.progress" values={{ current: totalWords - queue.length + 1, total: totalWords }} />
                  </div>
                  <div className="px-6 py-2 bg-primary text-white rounded-full font-black uppercase tracking-widest text-xs">
                    <FormattedMessage id="spelling.playing.score" values={{ score }} />
                  </div>
                </div>

                <div className="relative group">
                  <div className="absolute inset-0 bg-primary rounded-full blur-[80px] opacity-20 group-hover:opacity-40 transition-opacity" />
                  <button
                    onClick={repeatWord}
                    className="relative w-48 h-48 bg-rose-600 text-white rounded-full   hover:scale-110 active:scale-90 transition-all flex items-center justify-center border-8 border-white"
                  >
                    <Volume2 size={80} strokeWidth={2.5} />
                  </button>
                </div>

                <form onSubmit={handleGuess} className="w-full space-y-8">
                  <input
                    ref={inputRef}
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    className="w-full text-center text-5xl lg:text-6xl font-black p-10 bg-surface border-[12px] border-slate-100 rounded-[3.5rem] focus:border-indigo-600 transition-all outline-none tabular-nums  uppercase tracking-tighter placeholder:text-4xl lg:placeholder:text-5xl"
                    placeholder={intl.formatMessage({ id: 'spelling.playing.placeholder' })}
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck="false"
                    disabled={!!feedback}
                  />
                  <button
                    type="submit"
                    disabled={!userInput.trim() || !!feedback}
                    className="w-full h-24 bg-primary text-white font-black text-3xl rounded-[3rem] hover:bg-primary/90  transition-all disabled:opacity-50 tracking-[0.2em] uppercase"
                  >
                    <FormattedMessage id="spelling.playing.verify" />
                  </button>
                </form>

                <AnimatePresence>
                  {feedback && (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className={`w-full p-8 rounded-[3rem] flex items-center gap-6 border-8  ${
                        feedback.type === 'success' ? 'bg-emerald-500 text-white border-white' : 'bg-caution-bg text-caution border-caution-border'
                      }`}
                    >
                      <div className={`p-4 rounded-2xl ${feedback.type === 'success' ? 'bg-surface/20' : 'bg-rose-600 text-white'} `}>
                        {feedback.type === 'success' ? <CheckCircle2 size={40} strokeWidth={3} /> : <XCircle size={40} strokeWidth={3} />}
                      </div>
                      <span className="font-black text-3xl tracking-tighter uppercase">{feedback.message}</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {status === 'finished' && (
              <motion.div
                key="finished"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center gap-12 z-10 text-center"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-emerald-500 blur-[80px] opacity-20" />
                  <div className="relative w-48 h-48 bg-slate-800 text-emerald-400 rounded-[3.5rem] flex items-center justify-center  rotate-12 border-8 border-dark-border">
                    <CheckCircle2 size={96} strokeWidth={3} />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-7xl font-black uppercase tracking-tighter text-slate-900 leading-none">
                    <FormattedMessage id="spelling.finished.title" />
                  </h3>
                  <p className="text-neutral-400 text-xl font-black uppercase tracking-[0.4em]">
                    <FormattedMessage id="spelling.finished.score" values={{ score, total: totalWords }} />
                  </p>
                </div>
                
                <button
                  onClick={resetToSetup}
                  className="flex items-center justify-center gap-6 w-full max-w-sm h-24 bg-primary text-white rounded-[3.5rem] hover:bg-primary/90 transition-all font-black text-2xl  tracking-[0.2em] uppercase"
                >
                  <ListRestart size={32} strokeWidth={3} /> <FormattedMessage id="spelling.finished.restart" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </ToolPanel>
    </div>
  );
};

export default Spelling;
