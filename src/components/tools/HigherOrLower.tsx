import React, { useState, useEffect, useCallback } from 'react';
import { 
  ArrowUp, 
  ArrowDown, 
  Check, 
  RotateCcw, 
  Trophy, 
  Send,
  Target,
  Hash
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';
import { useSettings } from '../../contexts/SettingsContext';
import { useHeader } from '../../contexts/HeaderContext';
import { audioEngine } from '../../utils/audio';
import { useIntl, FormattedMessage } from 'react-intl';
import ToolPanel from '../shared/ToolPanel';
import SettingsPanel from '../shared/SettingsPanel';
import HistoryPanel from '../shared/HistoryPanel';

// 3. Text (Help and Info)
const HelpContent = () => (
  <div className="space-y-4 font-['Outfit']">
    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">
      <FormattedMessage id="higherorlower.help.title" />
    </h3>
    <div className="space-y-3">
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-primary/5 flex items-center justify-center text-xs font-black text-primary shrink-0">1</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">
          <FormattedMessage id="higherorlower.help.step1" defaultMessage="Pick numbers to play with." />
        </p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-primary/5 flex items-center justify-center text-xs font-black text-primary shrink-0">2</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">
          <FormattedMessage id="higherorlower.help.step2" defaultMessage="Type a number and click the arrow." />
        </p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-primary/5 flex items-center justify-center text-xs font-black text-primary shrink-0">3</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">
          <FormattedMessage id="higherorlower.help.step3" defaultMessage="I will tell you if it is higher or lower." />
        </p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-primary/5 flex items-center justify-center text-xs font-black text-primary shrink-0">4</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">
          <FormattedMessage id="higherorlower.help.step4" defaultMessage="Can you find the secret number?" />
        </p>
      </div>
    </div>
  </div>
);

export const HigherOrLower = () => {
  const intl = useIntl();
  const { setOnReset, clearHeader, setHelpContent, isConfigOpen, setIsConfigOpen } = useHeader();
  const { settings } = useSettings();
  const [difficulty, setDifficulty] = useState(100);
  const [target, setTarget] = useState<number | null>(null);
  const [guessInput, setGuessInput] = useState('');
  const [log, setLog] = useState<{ guess: number; result: string }[]>([]);
  const [status, setStatus] = useState<'setup' | 'playing' | 'won'>('setup');

  const startGame = useCallback((max: number) => {
    setDifficulty(max);
    setTarget(Math.floor(Math.random() * max) + 1);
    setLog([]);
    setStatus('playing');
    setGuessInput('');
  }, []);

  const handleGuess = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const guess = parseInt(guessInput, 10);
    if (isNaN(guess)) return;

    let result = '';
    if (guess === target) {
      result = 'Correct';
      setStatus('won');
      audioEngine.playAlarm(settings.soundTheme);
      
      const end = Date.now() + 3 * 1000;
      const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

      (function frame() {
        confetti({
          particleCount: 15,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: colors
        });
        confetti({
          particleCount: 15,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: colors
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      }());
    } else if (guess < (target || 0)) {
      result = 'Higher';
      audioEngine.playTick(settings.soundTheme);
    } else {
      result = 'Lower';
      audioEngine.playTick(settings.soundTheme);
    }

    setLog([{ guess, result }, ...log]);
    setGuessInput('');
  };

  const resetGame = useCallback(() => {
    setStatus('setup');
    setTarget(null);
    setLog([]);
    audioEngine.playTick(settings.soundTheme);
  }, [settings.soundTheme]);

  useEffect(() => {
    setOnReset(() => resetGame);
    setHelpContent(<HelpContent />);
    return () => clearHeader();
  }, [clearHeader, setOnReset, setHelpContent, resetGame]);

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 h-full w-full italic overflow-y-auto lg:overflow-hidden px-0 lg:px-0 py-4 lg:py-0 custom-scrollbar">
      <ToolPanel baseWidth={isMobile ? 800 : 1000} baseHeight={isMobile ? 1000 : 800} fluid={true}>
        <div className="w-full h-full flex flex-col items-center justify-center relative overflow-hidden">
          {status !== 'setup' && (
            <div className="absolute top-12 left-12 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.4em]">
                <FormattedMessage id="higherorlower.status.playing" values={{ max: difficulty }} defaultMessage={`1 to ${difficulty}`} />
              </span>
            </div>
          )}

          <AnimatePresence mode="wait">
            {status === 'setup' ? (
              <motion.div
                key="setup"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-md space-y-10 relative z-10"
              >
                <div className="text-center space-y-4">
                  <h2 className="text-5xl font-black text-slate-900 uppercase tracking-tighter italic">
                    <FormattedMessage id="higherorlower.title" />
                  </h2>
                  <p className="text-sm font-bold text-neutral-400 uppercase tracking-widest">
                    <FormattedMessage id="higherorlower.settings.range" />
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {[10, 100, 1000].map(max => (
                    <button
                      key={max}
                      onClick={() => startGame(max)}
                      className="p-8 bg-surface border-4 border-slate-100 rounded-[2.5rem] flex items-center justify-between group hover:border-indigo-400 transition-all hover:scale-[1.02] "
                    >
                      <span className="text-4xl font-black text-slate-800 uppercase italic">
                        <FormattedMessage id={`higherorlower.settings.range.${max}`} />
                      </span>
                      <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-primary/5 group-hover:text-primary transition-colors" aria-hidden="true">
                        <Target size={32} />
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            ) : status === 'playing' ? (
              <motion.div
                key="playing"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-md space-y-10 relative z-10"
              >
                <div className="text-center space-y-4">
                  <div className="h-32 flex items-center justify-center" aria-live="polite" aria-atomic="true">
                    {log.length > 0 && status === 'playing' && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`px-10 py-6 rounded-full text-5xl font-black uppercase tracking-widest flex items-center gap-6 ${
                          log[0].result === 'Higher' ? 'bg-primary/5 text-primary' : 'bg-caution-bg text-caution'
                        }`}
                      >
                        {log[0].result === 'Higher' ? <ArrowUp size={48} aria-hidden="true" /> : <ArrowDown size={48} aria-hidden="true" />}
                        <FormattedMessage 
                          id={log[0].result === 'Higher' ? 'higherorlower.hint.higher' : 'higherorlower.hint.lower'} 
                          defaultMessage={log[0].result === 'Higher' ? `Higher than ${log[0].guess}` : `Lower than ${log[0].guess}`}
                          values={{ n: log[0].guess }}
                        />
                      </motion.div>
                    )}
                  </div>
                  <h2 id="guess-input-label" className="text-6xl lg:text-8xl font-black text-slate-900 uppercase tracking-tighter italic">
                    <FormattedMessage id="higherorlower.guess.label" />
                  </h2>
                </div>

                <form onSubmit={handleGuess} className="space-y-8">
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      max={difficulty}
                      value={guessInput}
                      onChange={(e) => setGuessInput(e.target.value)}
                      className="w-full bg-slate-50 border-4 border-slate-100 rounded-[3rem] p-6 lg:p-8 text-center text-6xl lg:text-8xl font-black text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-surface transition-all placeholder:text-slate-200 tabular-nums "
                      placeholder="?"
                      autoFocus
                      aria-labelledby="guess-input-label"
                    />
                  </div>
                  
                  <button
                    type="submit"
                    disabled={!guessInput}
                    className="w-full py-8 bg-primary text-white rounded-[2.5rem] text-3xl font-black  hover:bg-primary/90 disabled:opacity-30 transition-all active:scale-95 flex items-center justify-center gap-4 uppercase tracking-widest italic"
                  >
                    <Send size={32} aria-hidden="true" />
                    <FormattedMessage id="higherorlower.guess.button" />
                  </button>
                </form>
              </motion.div>
            ) : (
              <motion.div 
                key="won"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center gap-12 text-center relative z-10"
                role="alert"
                aria-live="assertive"
              >
                <div className="w-32 h-32 bg-yellow-400 text-white rounded-[2.5rem] flex items-center justify-center  rotate-3 animate-bounce" aria-hidden="true">
                  <Trophy size={64} />
                </div>
                <div className="space-y-4">
                  <h3 className="text-6xl font-black text-slate-900 uppercase tracking-tighter italic leading-none">
                    <FormattedMessage id="higherorlower.win.title" />
                  </h3>
                  <p className="text-3xl text-slate-500 font-medium">
                    <FormattedMessage id="higherorlower.win.desc" values={{ n: target }} />
                  </p>
                </div>
                
                <div className="bg-primary/5 px-10 py-5 rounded-3xl border-4 border-white ">
                  <p className="text-primary font-black uppercase tracking-widest text-lg">
                    <FormattedMessage id="higherorlower.win.stats" values={{ n: log.length }} />
                  </p>
                </div>

                <button 
                  onClick={resetGame}
                  className="flex items-center gap-3 px-8 py-4 bg-surface border-4 border-slate-100 text-neutral-400 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:border-primary/30 hover:text-primary transition-all active:scale-95 "
                >
                  <RotateCcw size={20} strokeWidth={3} aria-hidden="true" />
                  <FormattedMessage id="emotion.reset" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </ToolPanel>

      <div className="w-full lg:w-[320px] shrink-0 flex flex-col gap-6 pb-8 lg:pb-0">
        <SettingsPanel
          isOpen={isConfigOpen}
          onClose={() => setIsConfigOpen(false)}
          title={intl.formatMessage({ id: 'higherorlower.title' })}
        >
          <div className="space-y-8">
            <button
              onClick={resetGame}
              className="w-full py-6 bg-surface border-4 border-slate-100 text-neutral-400 rounded-3xl font-black text-xs uppercase tracking-widest hover:border-caution-border hover:text-caution transition-all flex items-center justify-center gap-4 "
            >
              <RotateCcw size={20} aria-hidden="true" />
              <FormattedMessage id="emotion.reset" />
            </button>
          </div>
        </SettingsPanel>

        <HistoryPanel
          title={intl.formatMessage({ id: 'higherorlower.history.title' })}
          items={log}
          onClear={() => setLog([])}
          emptyMessage={intl.formatMessage({ id: 'higherorlower.history.empty' })}
          icon={Hash}
          itemsPerPage={isMobile ? 3 : 8}
          reservePaginationSpace={true}
          listClassName={isMobile ? "grid grid-cols-3 gap-2" : "space-y-2"}
          renderItem={(entry, idx) => (
            <motion.div
              key={`${entry.guess}-${idx}`}
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`rounded-[1.5rem] lg:rounded-[2rem] flex items-center justify-between border-4 transition-all ${
                isMobile ? 'flex-col p-2 gap-1 h-20 justify-center' : 'p-5'
              } ${
                entry.result === 'Correct' 
                  ? 'bg-success-bg border-success-border text-emerald-700' 
                  : 'bg-surface border-white '
              }`}
            >
              <span className={`${isMobile ? 'text-xl' : 'text-3xl'} font-black text-slate-800 tabular-nums`}>{entry.guess}</span>
              <div className="flex items-center">
                {entry.result === 'Higher' && (
                  <div className="flex items-center gap-1 text-primary font-black text-[10px] uppercase tracking-widest">
                    <ArrowUp size={isMobile ? 14 : 16} aria-hidden="true" /> 
                    <span className={isMobile ? "sr-only" : ""}>
                      <FormattedMessage id="higherorlower.result.higher" />
                    </span>
                  </div>
                )}
                {entry.result === 'Lower' && (
                  <div className="flex items-center gap-1 text-caution font-black text-[10px] uppercase tracking-widest">
                    <ArrowDown size={isMobile ? 14 : 16} aria-hidden="true" /> 
                    <span className={isMobile ? "sr-only" : ""}>
                      <FormattedMessage id="higherorlower.result.lower" />
                    </span>
                  </div>
                )}
                {entry.result === 'Correct' && (
                  <div className="flex items-center gap-1 text-success font-black text-[10px] uppercase tracking-widest">
                    <Check size={isMobile ? 14 : 16} aria-hidden="true" /> 
                    <span className={isMobile ? "sr-only" : ""}>
                      <FormattedMessage id="higherorlower.result.correct" />
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        />
      </div>
    </div>
  );
};

export default HigherOrLower;
