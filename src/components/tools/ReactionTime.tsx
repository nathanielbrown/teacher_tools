import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap,
  Clock,
  AlertTriangle,
  Play,
  Timer
} from 'lucide-react';
import { useHeader } from '../../contexts/HeaderContext';
import { useSettings } from '../../contexts/SettingsContext';
import { ToolPanel } from '../shared/ToolPanel';
import { useIntl, FormattedMessage } from 'react-intl';
import { audioEngine } from '../../utils/audio';
import { storage } from '../../utils/storage';
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
        <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center text-xs font-black text-indigo-600 shrink-0">1</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">
          <FormattedMessage id="reactionTime.help.step1" defaultMessage="Click the large Start Test area to begin the sequence." />
        </p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-rose-50 flex items-center justify-center text-xs font-black text-rose-600 shrink-0">2</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">
          <FormattedMessage id="reactionTime.help.step2" defaultMessage="The screen will turn Red—this means WAIT. Don't click yet!" />
        </p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-emerald-50 flex items-center justify-center text-xs font-black text-emerald-600 shrink-0">3</div>
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
  const [history, setHistory] = useState<{ attempt: number; ms: number | null; failed: boolean }[]>(() => {
    const saved = storage.getItem('teacherToolsReactionTime');
    return saved ? JSON.parse(saved) : [];
  });
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
      clearHeader();
    };
  }, [clearHeader]);

  useEffect(() => {
    storage.setItem('teacherToolsReactionTime', JSON.stringify(history));
  }, [history]);

  const resetStats = useCallback(() => {
    setHistory([]);
    setStatus('idle');
    setLastResult(null);
    audioEngine.playTick(settings.soundTheme);
  }, [settings.soundTheme]);

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
      const newHistory = [...history, { attempt: history.length + 1, ms: null, failed: true }];
      setHistory(newHistory);
      setLastResult('failed');
      setStatus('result');
      audioEngine.playTick(settings.soundTheme);
    } else if (status === 'ready') {
      const endTime = Date.now();
      const reactionTime = endTime - startTime;
      const newHistory = [...history, { attempt: history.length + 1, ms: reactionTime, failed: false }];
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

  const getStatusConfig = () => {
    switch (status) {
      case 'idle': return { 
        bg: 'bg-indigo-600', 
        icon: <Play size={120} />, 
        text: intl.formatMessage({ id: 'reactionTime.status.idle.text', defaultMessage: 'Start Test' }), 
        subtext: intl.formatMessage({ id: 'reactionTime.status.idle.subtext', defaultMessage: 'Click when you are ready' }) 
      };
      case 'waiting': return { 
        bg: 'bg-rose-600', 
        icon: <Clock size={120} />, 
        text: intl.formatMessage({ id: 'reactionTime.status.waiting.text', defaultMessage: 'Wait...' }), 
        subtext: intl.formatMessage({ id: 'reactionTime.status.waiting.subtext', defaultMessage: 'Wait for the color to change' }) 
      };
      case 'ready': return { 
        bg: 'bg-emerald-500', 
        icon: <Zap size={120} className="animate-bounce" />, 
        text: intl.formatMessage({ id: 'reactionTime.status.ready.text', defaultMessage: 'CLICK!' }), 
        subtext: intl.formatMessage({ id: 'reactionTime.status.ready.subtext', defaultMessage: 'NOW! NOW! NOW!' }) 
      };
      case 'result': return {
        bg: lastResult === 'failed' ? 'bg-amber-500' : 'bg-slate-900',
        icon: lastResult === 'failed' ? <AlertTriangle size={120} /> : <Timer size={120} className="text-indigo-400" />,
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
    <div className="flex flex-col lg:flex-row gap-8 h-full w-full italic">
      <ToolPanel className="flex-1" baseWidth={1000} baseHeight={800}>
        <div className="flex flex-col gap-8 h-full w-full">
          {/* Interaction Stage */}
          <div className="flex-1 flex flex-col">
          <button
            onClick={handleClick}
            className={`flex-1 rounded-[4rem] border-8 border-white  transition-all duration-500 flex flex-col items-center justify-center text-white gap-12 relative overflow-hidden group ${config.bg}`}
          >
            <div className="tool-grid-bg-dark opacity-10 pointer-events-none" />
            <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

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

            <div className="text-center relative z-10 px-12">
              <motion.h3
                key={config.text}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="text-8xl font-black tracking-tighter uppercase mb-4 leading-none"
              >
                {config.text}
              </motion.h3>
              <p className="text-[14px] font-black text-white/40 uppercase tracking-[0.6em]">{config.subtext}</p>
            </div>
          </button>
          </div>
        </div>
      </ToolPanel>

      <div className="w-full lg:w-[320px] shrink-0 h-full overflow-hidden flex flex-col">
        <HistoryPanel
          title={intl.formatMessage({ id: 'reactionTime.history.title', defaultMessage: 'History' })}
          items={history}
          emptyMessage={intl.formatMessage({ id: 'reactionTime.history.empty', defaultMessage: 'No attempts yet' })}
          renderItem={(item, idx) => (
            <motion.div
              key={idx}
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className={`flex justify-between items-center p-6 rounded-2xl border-4 transition-all ${item.failed ? 'bg-rose-50/40 border-rose-100/40 opacity-80' : 'bg-white/80 backdrop-blur-sm border-white'
                }`}
            >
              <div className="flex flex-col">
                <span className={`font-black text-xl tracking-tighter tabular-nums ${item.failed ? 'text-rose-500' : 'text-slate-800'}`}>
                  {item.failed 
                    ? <FormattedMessage id="reactionTime.history.miss" defaultMessage="MISS" /> 
                    : intl.formatMessage({ id: 'reactionTime.history.ms', defaultMessage: '{ms}ms' }, { ms: item.ms })}
                </span>
              </div>
              {!item.failed && item.ms === best && best > 0 && (
                <div className="bg-emerald-500 text-white px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ">
                  <FormattedMessage id="reactionTime.history.best" defaultMessage="BEST" />
                </div>
              )}
            </motion.div>
          )}
        />
      </div>
    </div>
  );
};

export default ReactionTime;
