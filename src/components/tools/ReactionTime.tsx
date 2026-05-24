import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap,
  Clock,
  AlertTriangle,
  Play,
  Timer,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useHeader } from '../../contexts/HeaderContext';
import { useSettings } from '../../contexts/SettingsContext';
import { ToolPanel } from '../shared/ToolPanel';
import { useIntl, FormattedMessage } from 'react-intl';
import { audioEngine } from '../../utils/audio';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import HistoryPanel from '../shared/HistoryPanel';

// 1. Constants (None)

// 2. Config (None)

// 3. Text (Help and Info)
const getHelpInfo = () => (
  <div className="space-y-4 font-['Outfit'] italic">
    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">
      <FormattedMessage id="reactionTime.help.title" defaultMessage="How to Use Reaction Time" />
    </h3>
    <div className="space-y-3">
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-primary/5 flex items-center justify-center text-xs font-black text-primary shrink-0">1</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">
          <FormattedMessage id="reactionTime.help.step1" defaultMessage="Click the large Start Test area to begin the sequence." />
        </p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-caution-bg flex items-center justify-center text-xs font-black text-caution shrink-0">2</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">
          <FormattedMessage id="reactionTime.help.step2" defaultMessage="The screen will turn Red—this means WAIT. Don't click yet!" />
        </p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-success-bg flex items-center justify-center text-xs font-black text-success shrink-0">3</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">
          <FormattedMessage id="reactionTime.help.step3" defaultMessage="When the screen turns Green, click as fast as you possibly can!" />
        </p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-slate-50 flex items-center justify-center text-xs font-black text-slate-600 shrink-0">4</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">
          <FormattedMessage id="reactionTime.help.step4" defaultMessage="Check your Stats in the sidebar to see your average and best reaction times." />
        </p>
      </div>
    </div>
  </div>
);

// 4. Local Storage (Logic in component using storage util)

// 5. Classes (None)

// 6. Functions (None)

// 7. Component
export const ReactionTime = () => {
  const { setOnReset, clearHeader, setHelpContent } = useHeader();
  const { settings } = useSettings();
  const intl = useIntl();
  const [status, setStatus] = useState('idle'); // 'idle', 'waiting', 'ready', 'result'
  const [startTime, setStartTime] = useState(0);
  const [lastResult, setLastResult] = useState<number | 'failed' | null>(null);
  const [history, setHistory] = useLocalStorage<{ attempt: number; ms: number | null; failed: boolean }[]>('reaction_time_history', []);
  const [historyPage, setHistoryPage] = useState(0);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
      clearHeader();
    };
  }, [clearHeader]);

  // Persistence handled by useLocalStorage

  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 1024 : false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const resetStats = useCallback(() => {
    setHistory([]);
    setStatus('idle');
    setLastResult(null);
    audioEngine.playTick(settings.soundTheme);
  }, [settings.soundTheme, setHistory]);

  useEffect(() => {
    setOnReset(() => resetStats);
    setHelpContent(getHelpInfo());
    return () => clearHeader();
  }, [clearHeader, setOnReset, resetStats, setHelpContent]);

  const handleStart = () => {
    setStatus('waiting');
    setLastResult(null);
    audioEngine.playTick(settings.soundTheme);
    const delay = Math.floor(Math.random() * 4000) + 1500;
    timeoutRef.current = window.setTimeout(() => {
      setStatus('ready');
      setStartTime(Date.now());
      audioEngine.playReady(settings.soundTheme);
    }, delay);
  };

  const handleClick = () => {
    if (status === 'idle') {
      handleStart();
    } else if (status === 'waiting') {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
      const newHistory = [{ attempt: history.length + 1, ms: null, failed: true }, ...history];
      setHistory(newHistory);
      setLastResult('failed');
      setStatus('result');
      audioEngine.playTick(settings.soundTheme);
    } else if (status === 'ready') {
      const endTime = Date.now();
      const reactionTime = endTime - startTime;
      const newHistory = [{ attempt: history.length + 1, ms: reactionTime, failed: false }, ...history];
      setHistory(newHistory);
      setLastResult(reactionTime);
      setStatus('result');
      audioEngine.playSuccess(settings.soundTheme);
    } else if (status === 'result') {
      handleStart();
    }
  };

  const validAttempts = history.filter((h: any) => !h.failed);
  const best = validAttempts.length > 0
    ? Math.min(...validAttempts.map((h: any) => h.ms))
    : 0;

  const ITEMS_PER_PAGE = isMobile ? 3 : 100;
  const totalPages = Math.ceil(history.length / ITEMS_PER_PAGE);
  const currentHistory = history.slice(historyPage * ITEMS_PER_PAGE, (historyPage + 1) * ITEMS_PER_PAGE);

  const getStatusConfig = () => {
    switch (status) {
      case 'idle': return { 
        bg: 'bg-primary', 
        icon: <Play size={isMobile ? 80 : 120} />, 
        text: intl.formatMessage({ id: 'reactionTime.status.idle.text', defaultMessage: 'Start Test' }), 
        subtext: intl.formatMessage({ id: 'reactionTime.status.idle.subtext', defaultMessage: 'Click when you are ready' }) 
      };
      case 'waiting': return { 
        bg: 'bg-rose-600', 
        icon: <Clock size={isMobile ? 80 : 120} />, 
        text: intl.formatMessage({ id: 'reactionTime.status.waiting.text', defaultMessage: 'Wait...' }), 
        subtext: intl.formatMessage({ id: 'reactionTime.status.waiting.subtext', defaultMessage: 'Wait for the color to change' }) 
      };
      case 'ready': return { 
        bg: 'bg-emerald-500', 
        icon: <Zap size={isMobile ? 80 : 120} className="animate-bounce" />, 
        text: intl.formatMessage({ id: 'reactionTime.status.ready.text', defaultMessage: 'CLICK!' }), 
        subtext: intl.formatMessage({ id: 'reactionTime.status.ready.subtext', defaultMessage: 'NOW! NOW! NOW!' }) 
      };
      case 'result': return {
        bg: lastResult === 'failed' ? 'bg-amber-500' : 'bg-dark-bg',
        icon: lastResult === 'failed' ? <AlertTriangle size={isMobile ? 80 : 120} /> : <Timer size={isMobile ? 80 : 120} className="text-primary/70" />,
        text: lastResult === 'failed' 
          ? intl.formatMessage({ id: 'reactionTime.status.failed.text', defaultMessage: 'Too Early!' }) 
          : intl.formatMessage({ id: 'reactionTime.status.result.text', defaultMessage: '{ms}ms' }, { ms: lastResult }),
        subtext: intl.formatMessage({ id: 'reactionTime.status.result.subtext', defaultMessage: 'Click to try again' })
      };
      default: return { bg: 'bg-slate-500', icon: null, text: '', subtext: '' };
    }
  };

  const config = getStatusConfig();

  return (
    <div className={`flex flex-col lg:flex-row gap-4 lg:gap-8 h-full w-full italic ${isMobile ? 'overflow-y-auto' : 'overflow-hidden'}`}>
      <ToolPanel 
        className="flex-1" 
        baseWidth={isMobile ? 400 : 1200} 
        baseHeight={isMobile ? 600 : 800}
        fluid={isMobile}
        alignTop={isMobile}
      >
        <div className="flex flex-col gap-8 h-full w-full">
          <div className="flex-1 flex flex-col p-2 md:p-8">
            <button
              onClick={handleClick}
              className={`flex-1 rounded-[3rem] md:rounded-[4rem] border-8 border-white transition-all duration-500 flex flex-col items-center justify-center text-white gap-8 md:gap-12 relative overflow-hidden group ${config.bg}`}
            >
              <div className="absolute inset-0 bg-surface/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

              <AnimatePresence mode="wait">
                <motion.div
                  key={status}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 1.2, opacity: 0 }}
                  className="relative z-10"
                >
                  {config.icon}
                </motion.div>
              </AnimatePresence>

              <div className="text-center relative z-10 px-4 md:px-12">
                <motion.h3
                  key={config.text}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className={`${isMobile ? 'text-6xl' : 'text-[10rem]'} font-black tracking-tighter uppercase mb-4 leading-none`}
                >
                  {config.text}
                </motion.h3>
                <p className="text-[10px] md:text-[14px] font-black text-white/40 uppercase tracking-[0.4em] md:tracking-[0.6em]">{config.subtext}</p>
              </div>
            </button>
          </div>
        </div>
      </ToolPanel>

      <div className={`w-full lg:w-[350px] shrink-0 ${isMobile ? 'h-auto' : 'h-full'} overflow-hidden flex flex-col pb-4 md:pb-0`}>
        <div className="flex items-center justify-between px-4 mb-2">
          <h4 className="font-black text-slate-900 uppercase tracking-widest text-xs">
            <FormattedMessage id="reactionTime.history.title" defaultMessage="History" />
          </h4>
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setHistoryPage(p => Math.max(0, p - 1))}
                disabled={historyPage === 0}
                className="p-2 bg-slate-50 rounded-lg text-neutral-400 disabled:opacity-30"
              >
                <ChevronLeft size={16} strokeWidth={3} />
              </button>
              <span className="text-[10px] font-black text-primary">{historyPage + 1}/{totalPages}</span>
              <button
                onClick={() => setHistoryPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={historyPage === totalPages - 1}
                className="p-2 bg-slate-50 rounded-lg text-neutral-400 disabled:opacity-30"
              >
                <ChevronRight size={16} strokeWidth={3} />
              </button>
            </div>
          )}
        </div>
        <div className={`flex ${isMobile ? 'flex-row overflow-x-auto gap-2 px-4' : 'flex-col gap-4 overflow-y-auto px-0'} no-scrollbar h-full`}>
          {history.length === 0 ? (
            <p className="text-xs font-black text-slate-300 uppercase tracking-widest text-center py-8 w-full">
              <FormattedMessage id="reactionTime.history.empty" defaultMessage="No attempts yet" />
            </p>
          ) : (
            currentHistory.map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className={`flex justify-between items-center p-4 rounded-2xl border-4 transition-all relative min-h-[80px] md:min-h-[90px] ${isMobile ? 'min-w-[120px] flex-col justify-center' : 'w-full'} ${item.failed ? 'bg-caution-bg/40 border-caution-border/40 opacity-80' : 'bg-surface/80 backdrop-blur-sm border-white shadow-sm'
                  }`}
              >
                <div className="flex flex-col items-center">
                  <span className={`font-black ${isMobile ? 'text-lg' : 'text-2xl'} tracking-tighter tabular-nums ${item.failed ? 'text-caution' : 'text-slate-800'}`}>
                    {item.failed 
                      ? <FormattedMessage id="reactionTime.history.miss" defaultMessage="MISS" /> 
                      : intl.formatMessage({ id: 'reactionTime.history.ms', defaultMessage: '{ms}ms' }, { ms: item.ms })}
                  </span>
                </div>
                {!item.failed && item.ms === best && best > 0 && (
                  <div className={`bg-emerald-500 text-white rounded-lg font-black uppercase tracking-widest absolute ${isMobile ? 'bottom-2 left-1/2 -translate-x-1/2 text-[6px] px-1.5 py-0.5' : 'top-4 right-4 text-[10px] px-3 py-1'}`}>
                    <FormattedMessage id="reactionTime.history.best" defaultMessage="BEST" />
                  </div>
                )}
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ReactionTime;
