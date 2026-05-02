import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  RotateCcw, 
  TrendingUp, 
  Sparkles, 
  MousePointer2,
  History as HistoryIcon
} from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';
import { useHeader } from '../../contexts/HeaderContext';
import { audioEngine } from '../../utils/audio';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { downloadCSV } from '../../utils/export';
import { useIntl, FormattedMessage } from 'react-intl';
import ToolPanel from '../shared/ToolPanel';
import SettingsPanel from '../shared/SettingsPanel';
import HistoryPanel from '../shared/HistoryPanel';

// 3. Text (Help and Info)
const HelpContent = () => (
  <div className="space-y-4 font-['Outfit']">
    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">
      <FormattedMessage id="flipcoin.help.title" />
    </h3>
    <div className="space-y-3">
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center text-xs font-black text-indigo-600 shrink-0">1</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">
          <FormattedMessage id="flipcoin.help.step1" defaultMessage="Click on the screen to flip the coin." />
        </p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center text-xs font-black text-indigo-600 shrink-0">2</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">
          <FormattedMessage id="flipcoin.help.step2" defaultMessage="Wait for the coin to land on heads or tails." />
        </p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center text-xs font-black text-indigo-600 shrink-0">3</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">
          <FormattedMessage id="flipcoin.help.step3" defaultMessage="Check the statistics to see how many times each side landed." />
        </p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center text-xs font-black text-indigo-600 shrink-0">4</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">
          <FormattedMessage id="flipcoin.help.step4" defaultMessage="Use the history list to see your past flips." />
        </p>
      </div>
    </div>
  </div>
);

export const FlipCoin = () => {
  const intl = useIntl();
  const { setOnReset, clearHeader, setHelpContent, isConfigOpen, setIsConfigOpen } = useHeader();
  const { settings } = useSettings();
  
  const [result, setResult] = useState('heads');
  const [isFlipping, setIsFlipping] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [history, setHistory] = useLocalStorage<any[]>('coin_flip_history', []);

  const reset = useCallback(() => {
    setHistory([]);
    audioEngine.playTick(settings.soundTheme);
  }, [settings.soundTheme, setHistory]);

  useEffect(() => {
    setOnReset(() => reset);
    setHelpContent(<HelpContent />);
    return () => clearHeader();
  }, [clearHeader, setOnReset, reset, setHelpContent]);

  const flip = useCallback(() => {
    if (isFlipping) return;
    setIsFlipping(true);

    if (settings.soundTheme !== 'none') {
      audioEngine.playTick(settings.soundTheme);
      setTimeout(() => audioEngine.playTick(settings.soundTheme), 200);
      setTimeout(() => audioEngine.playTick(settings.soundTheme), 400);
      setTimeout(() => audioEngine.playTick(settings.soundTheme), 600);
    }

    const newResult = Math.random() > 0.5 ? 'heads' : 'tails';
    const currentBase = Math.ceil(rotation / 360) * 360;
    const nextRotation = currentBase + 2160 + (newResult === 'tails' ? 180 : 0);
    
    setRotation(nextRotation);

    setTimeout(() => {
      setResult(newResult);
      setHistory((prev: any[]) => [{ result: newResult, time: new Date().toISOString() }, ...prev]);
      setIsFlipping(false);
      if (settings.soundTheme !== 'none') {
        audioEngine.playSuccess(settings.soundTheme);
      }
    }, 1500);
  }, [isFlipping, rotation, settings.soundTheme, setHistory]);

  const handleDownload = useCallback(() => {
    downloadCSV(history, 'coin_flips.csv');
    audioEngine.playTick(settings.soundTheme);
  }, [history, settings.soundTheme]);

  const headsCount = history.filter((h: any) => h.result === 'heads').length;

  return (
    <div className="flex gap-8 h-full w-full italic">
      <ToolPanel baseWidth={1000} baseHeight={800}>
        <div 
          className="w-full h-full flex flex-col items-center justify-center relative overflow-hidden cursor-pointer group"
          onClick={flip}
        >
          <div className="tool-grid-bg opacity-20 pointer-events-none" />
          
          {/* Coin Visualization */}
          <div className="relative w-80 h-80 flex items-center justify-center mb-16 z-10">
            <div className="absolute inset-0 bg-amber-400/20 blur-[100px] rounded-full animate-pulse pointer-events-none" />
            
            <motion.div
              animate={{
                rotateX: rotation,
                y: isFlipping ? [0, -300, 0] : 0,
                scale: isFlipping ? [1, 1.4, 1] : 1,
              }}
              transition={{ 
                rotateX: { duration: 1.5, ease: "easeOut" },
                y: { duration: 1.5, ease: "easeInOut" },
                scale: { duration: 1.5, ease: "easeInOut" }
              }}
              className="w-72 h-72 relative"
              style={{ transformStyle: 'preserve-3d' }}
            >
              {/* Coin Edges */}
              {[...Array(8)].map((_, i) => (
                <div 
                  key={i} 
                  className="absolute inset-0 rounded-full bg-amber-600" 
                  style={{ transform: `translateZ(${-6 + i*1.5}px)` }} 
                />
              ))}

              {/* Heads Side */}
              <div
                className="absolute inset-0 rounded-full border-[12px] border-amber-300  flex items-center justify-center overflow-hidden"
                style={{
                  backfaceVisibility: 'hidden',
                  transform: 'translateZ(8px)',
                  background: 'linear-gradient(135deg, #ffd700 0%, #fbbf24 50%, #d97706 100%)',
                }}
              >
                <div className="w-full h-full flex flex-col items-center justify-center relative">
                  <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/40 to-white/0 translate-y-[-100%] group-hover:translate-y-[100%] transition-transform duration-1000" />
                  <span className="text-[10rem] font-black text-amber-900  italic">H</span>
                  <Sparkles size={32} className="absolute top-10 right-10 text-white/60 animate-pulse" />
                </div>
              </div>

              {/* Tails Side */}
              <div
                className="absolute inset-0 rounded-full border-[12px] border-amber-300  flex items-center justify-center overflow-hidden"
                style={{
                  backfaceVisibility: 'hidden',
                  transform: 'rotateX(180deg) translateZ(8px)',
                  background: 'linear-gradient(135deg, #ffd700 0%, #fbbf24 50%, #d97706 100%)',
                }}
              >
                <div className="w-full h-full flex flex-col items-center justify-center relative">
                  <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/40 to-white/0 translate-y-[-100%] group-hover:translate-y-[100%] transition-transform duration-1000" />
                  <span className="text-[10rem] font-black text-amber-900  italic">T</span>
                  <Sparkles size={32} className="absolute bottom-10 left-10 text-white/60 animate-pulse" />
                </div>
              </div>
            </motion.div>
          </div>

          {/* Result Interface */}
          <div className="h-32 flex flex-col items-center justify-center z-10">
            <AnimatePresence mode="wait">
              {!isFlipping ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  key={result}
                  className="flex flex-col items-center gap-2"
                >
                  <span className="text-8xl font-black text-slate-900 uppercase tracking-tighter italic ">
                    <FormattedMessage id={result === 'heads' ? 'flipcoin.result.heads' : 'flipcoin.result.tails'} />
                  </span>
                </motion.div>
              ) : (
                <div className="flex flex-col items-center gap-6">
                  <div className="w-64 h-3 bg-white rounded-full overflow-hidden p-1  border border-slate-100">
                    <motion.div 
                      className="h-full bg-amber-500 rounded-full -[0_0_15px_rgba(245,158,11,0.5)]" 
                      animate={{ x: [-150, 150] }} 
                      transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }} 
                    />
                  </div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.8em] animate-pulse italic">
                    <FormattedMessage id="flipcoin.status.flipping" />
                  </span>
                </div>
              )}
            </AnimatePresence>
          </div>

          <div className="absolute bottom-12 right-12 flex items-center gap-6 z-20 bg-white/80 border-2 border-slate-100 p-8 rounded-[3rem] backdrop-blur-md  pointer-events-none">
            <div className="text-right">
              <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest mt-2 leading-none">
                <FormattedMessage id="flipcoin.status.ready" />
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-500 flex items-center justify-center text-white ">
              <MousePointer2 size={24} strokeWidth={3} />
            </div>
          </div>
        </div>
      </ToolPanel>

      <div className="w-[400px] shrink-0 flex flex-col gap-6">
        <div className="bg-slate-50/80 backdrop-blur-xl rounded-[3rem] border-4 border-white flex flex-col overflow-hidden shrink-0 italic">
           <div className="bg-white/80 backdrop-blur-sm px-8 py-6 flex justify-between items-center shrink-0 border-b-4 border-white">
              <div className="flex items-center gap-2">
                 <TrendingUp className="text-indigo-400" size={16} />
                 <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-900 mb-0 leading-none">
                   <FormattedMessage id="flipcoin.stats.title" />
                 </h4>
              </div>
           </div>

           <div className="p-8 space-y-8">
              <div className="space-y-8">
                <div className="flex flex-col gap-3">
                   <div className="flex justify-between items-end">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
                        <FormattedMessage id="flipcoin.stats.heads" />
                      </span>
                      <span className="text-3xl font-black text-slate-900 tabular-nums italic">
                        {history.length > 0 ? Math.round((headsCount/history.length)*100) : 0}%
                      </span>
                   </div>
                   <div className="w-full h-4 bg-white rounded-full overflow-hidden p-1  border border-slate-100">
                      <motion.div 
                         className="h-full bg-amber-500 rounded-full"
                         initial={false}
                         animate={{ width: `${history.length > 0 ? (headsCount/history.length)*100 : 0}%` }}
                         transition={{ duration: 1, ease: "easeOut" }}
                      />
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div className="p-6 bg-white rounded-[2rem] border-2 border-slate-50 flex flex-col gap-1 ">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">
                        <FormattedMessage id="flipcoin.stats.total" />
                      </span>
                      <span className="text-2xl font-black text-slate-900 tabular-nums italic mt-2">{history.length}</span>
                   </div>
                   <div className="p-6 bg-amber-500/5 rounded-[2rem] border-2 border-amber-500/10 flex flex-col gap-1 ">
                      <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest leading-none">
                        <FormattedMessage id="flipcoin.stats.heads" />
                      </span>
                      <span className="text-2xl font-black text-amber-500 tabular-nums italic mt-2">{headsCount}</span>
                   </div>
                </div>
              </div>
           </div>
        </div>

        <SettingsPanel
          isOpen={isConfigOpen}
          onClose={() => setIsConfigOpen(false)}
          title={intl.formatMessage({ id: 'flipcoin.title' })}
        >
          <div className="space-y-8">
            <button
              onClick={reset}
              className="w-full py-6 bg-white border-4 border-slate-100 text-slate-400 rounded-3xl font-black text-xs uppercase tracking-widest hover:border-rose-100 hover:text-rose-600 transition-all flex items-center justify-center gap-4 "
            >
              <RotateCcw size={20} />
              <FormattedMessage id="emotion.reset" />
            </button>
          </div>
        </SettingsPanel>

        <HistoryPanel
          title={intl.formatMessage({ id: 'flipcoin.history.title' })}
          items={history}
          onClear={reset}
          onDownload={handleDownload}
          emptyMessage={intl.formatMessage({ id: 'flipcoin.history.empty' })}
          icon={HistoryIcon}
          itemsPerPage={16}
          listClassName="grid grid-cols-4 gap-3"
          renderItem={(h: any, i: number) => (
            <motion.div 
              key={`${history.length - i}-${h.time}`}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={`aspect-square flex items-center justify-center rounded-2xl border-4 transition-all hover:scale-105 italic  ${
                h.result === 'heads' ? 'bg-amber-400 border-amber-300 text-amber-900' : 'bg-slate-900 border-slate-700 text-slate-300'
              }`}
            >
               <span className="text-2xl font-black">
                 {h.result === 'heads' ? 'H' : 'T'}
               </span>
            </motion.div>
          )}
        />
      </div>
    </div>
  );
};

export default FlipCoin;
