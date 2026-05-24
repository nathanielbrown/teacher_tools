import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Hash, Palette, Zap, Eraser, EyeOff, Volume2, VolumeX, MessageCircle, Settings2,
  Play, Square
} from 'lucide-react';
import { useHeader } from '../../contexts/HeaderContext';
import { useSettings } from '../../contexts/SettingsContext';
import { audioEngine } from '../../utils/audio';
import { speak, isLanguageSupported } from '../../utils/speech';
import { ToolPanel } from '../shared/ToolPanel';
import { SettingsPanel } from '../shared/SettingsPanel';
import { useIntl, FormattedMessage } from 'react-intl';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { FlagIcon } from '../shared/FlagIcon';

// 1. Constants
const getColors = (intl: any) => [
  { id: 'white', value: '#ffffff', label: intl.formatMessage({ id: 'hundredschart.colors.clear', defaultMessage: 'Clear' }), icon: Eraser },
  { id: 'black', value: '#000000', label: intl.formatMessage({ id: 'hundredschart.colors.hide', defaultMessage: 'Hide' }), icon: EyeOff },
  { id: 'red', value: '#ef4444', label: intl.formatMessage({ id: 'hundredschart.colors.red', defaultMessage: 'Red' }) },
  { id: 'blue', value: '#3b82f6', label: intl.formatMessage({ id: 'hundredschart.colors.blue', defaultMessage: 'Blue' }) },
  { id: 'green', value: '#10b981', label: intl.formatMessage({ id: 'hundredschart.colors.green', defaultMessage: 'Green' }) },
  { id: 'yellow', value: '#f59e0b', label: intl.formatMessage({ id: 'hundredschart.colors.yellow', defaultMessage: 'Yellow' }) },
  { id: 'orange', value: '#f97316', label: intl.formatMessage({ id: 'hundredschart.colors.orange', defaultMessage: 'Orange' }) },
  { id: 'purple', value: '#8b5cf6', label: intl.formatMessage({ id: 'hundredschart.colors.purple', defaultMessage: 'Purple' }) },
];

const getAnimationSpeeds = (intl: any) => [
  { label: intl.formatMessage({ id: 'hundredschart.speed.slow', defaultMessage: '2 Seconds' }), value: 2000 },
  { label: intl.formatMessage({ id: 'hundredschart.speed.fast', defaultMessage: '1 Second' }), value: 1000 },
  { label: intl.formatMessage({ id: 'hundredschart.speed.instant', defaultMessage: 'Instant' }), value: 0 },
];

const LANGUAGES = [
  { code: 'en-AU', country: 'AU', label: 'English', hello: 'Hello' },
  { code: 'zh-CN', country: 'CN', label: '中文', hello: '你好' },
  { code: 'fr-FR', country: 'FR', label: 'Français', hello: 'Bonjour' },
  { code: 'ja-JP', country: 'JP', label: '日本語', hello: 'こんにちは' },
  { code: 'vi-VN', country: 'VN', label: 'Tiếng Việt', hello: 'Xin chào' },
  { code: 'th-TH', country: 'TH', label: 'ไทย', hello: 'สวัสดี' },
];

// 2. Config (None)

// 3. Text (Help and Info)
const HelpContent = () => (
  <div className="space-y-4 font-['Outfit']">
    <div className="space-y-3 italic">
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-primary/5 flex items-center justify-center text-xs font-black text-primary shrink-0">1</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">
          <FormattedMessage 
            id="hundredschart.help.step1" 
            defaultMessage="Pick a color and click any number to <b>highlight</b> it." 
            values={{ b: (chunks: React.ReactNode) => <b>{chunks}</b> }}
          />
        </p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-primary/5 flex items-center justify-center text-xs font-black text-primary shrink-0">2</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">
          <FormattedMessage 
            id="hundredschart.help.step2" 
            defaultMessage="Use the <b>Black color</b> to hide numbers for a guessing game!" 
            values={{ b: (chunks: React.ReactNode) => <b>{chunks}</b> }}
          />
        </p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-primary/5 flex items-center justify-center text-xs font-black text-primary shrink-0">3</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">
          <FormattedMessage 
            id="hundredschart.help.step3" 
            defaultMessage="Click the <b>Quick Highlight</b> buttons to see patterns of multiples (like 2, 5, or 10)." 
            values={{ b: (chunks: React.ReactNode) => <b>{chunks}</b> }}
          />
        </p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-primary/5 flex items-center justify-center text-xs font-black text-primary shrink-0">4</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">
          <FormattedMessage 
            id="hundredschart.help.step4" 
            defaultMessage="Adjust the <b>Animation Speed</b> to see patterns appear at different speeds." 
            values={{ b: (chunks: React.ReactNode) => <b>{chunks}</b> }}
          />
        </p>
      </div>
    </div>
  </div>
);

// 4. Local Storage (None)

// 5. Classes (None)

// 6. Functions
const ChartCell = ({ num, isHidden, highlightColor, onClick }: {
  num: number, isHidden: boolean, highlightColor: string | null, onClick: (n: number) => void
}) => {
  const isCurrentlyVisible = highlightColor !== null ? highlightColor !== '#000000' : !isHidden;

  return (
    <motion.button
      onClick={() => onClick(num)}
      animate={{
        backgroundColor: highlightColor && highlightColor !== '#000000' ? `${highlightColor}20` : (isCurrentlyVisible ? '#ffffff' : '#f8fafc'),
        color: highlightColor && highlightColor !== '#000000' ? highlightColor : (isCurrentlyVisible ? '#0f172a' : 'transparent'),
        borderColor: highlightColor && highlightColor !== '#000000' ? highlightColor : '#f1f5f9',
      }}
      transition={{
        duration: 0.3,
      }}
      className={`w-full h-full flex items-center justify-center relative overflow-hidden text-xl sm:text-2xl font-black border-[0.5px] ${isCurrentlyVisible ? '' : 'bg-slate-50'}`}
    >
      <motion.div
        key={highlightColor || (isHidden ? 'hidden' : 'visible')}
        initial={false}
        animate={highlightColor && highlightColor !== '#000000' ? { scale: [1, 0.9, 1.1, 1] } : {}}
        transition={{ 
          duration: 0.4, 
          ease: "easeInOut"
        }}
        className="flex items-center justify-center w-full h-full"
      >
        {isCurrentlyVisible ? num : <Hash size={14} className="text-slate-200" />}
      </motion.div>
    </motion.button>
  );
};

// 7. Component
export const HundredsChart = () => {
  const { 
    setHasConfig, setHelpContent, setOnReset, 
    clearHeader, isConfigOpen, setIsConfigOpen, setOnConfigToggle
  } = useHeader();
  const { settings } = useSettings();
  const intl = useIntl();
  
  const colors = getColors(intl);
  const animationSpeeds = getAnimationSpeeds(intl);

  const [hiddenNumbersArr, setHiddenNumbersArr] = useLocalStorage<number[]>('hundredschart_hidden', []);
  const hiddenNumbers = useMemo(() => new Set(hiddenNumbersArr), [hiddenNumbersArr]);
  
  const [highlighted, setHighlighted] = useLocalStorage<Record<number, string>>('hundredschart_highlighted', {});
  const [activeColor, setActiveColor] = useLocalStorage<string | null>('hundredschart_color', colors[2].value);
  const [animSpeed, setAnimSpeed] = useLocalStorage('hundredschart_speed', 2000);
  const [animState, setAnimState] = useState({ isRunning: false, multiple: 2, current: 1 });
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [soundMode, setSoundMode] = useLocalStorage<'speak' | 'sound' | 'mute'>('hundreds_chart_sound_mode', 'sound');
  const [speakLanguage, setSpeakLanguage] = useLocalStorage('hundreds_chart_lang', 'en-AU');
  const [availableLangs, setAvailableLangs] = useState<string[]>([]);

  useEffect(() => {
    const updateAvailable = () => {
      const supported = LANGUAGES.filter(l => isLanguageSupported(l.code)).map(l => l.code);
      setAvailableLangs(supported);
    };

    updateAvailable();
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.addEventListener('voiceschanged', updateAvailable);
      return () => window.speechSynthesis.removeEventListener('voiceschanged', updateAvailable);
    }
  }, []);

  const playSound = useCallback((num: number, onEnd?: () => void) => {
    if (soundMode === 'speak') {
      const isEnglish = speakLanguage.startsWith('en');
      
      if (isEnglish) {
        if (!audioRef.current) audioRef.current = new Audio();
        const audio = audioRef.current;
        
        // Cancel previous
        audio.pause();
        audio.onended = null;
        audio.onerror = null;

        let finished = false;
        const done = () => {
          if (finished) return;
          finished = true;
          onEnd?.();
        };
        
        audio.src = `/premium/audio/${num}.ogg`;
        audio.onended = done;
        audio.onerror = () => speak(num.toString(), 1.2, done, speakLanguage);
        
        // Safety timeout for audio events
        const safetyTimeout = setTimeout(done, 4000);
        
        audio.play().then(() => {
          // Playback started successfully
        }).catch(() => {
          clearTimeout(safetyTimeout);
          speak(num.toString(), 1.2, done, speakLanguage);
        });

        return () => {
          clearTimeout(safetyTimeout);
          audio.onended = null;
          audio.onerror = null;
        };
      } else {
        // Non-English uses TTS directly
        speak(num.toString(), 1.0, onEnd, speakLanguage);
        return () => {};
      }
    } else if (soundMode === 'sound') {
      audioEngine.playTick(settings.soundTheme);
      onEnd?.();
    } else {
      onEnd?.();
    }
    return () => {};
  }, [soundMode, settings.soundTheme, speakLanguage]);

  const clearAll = useCallback(() => {
    setHiddenNumbersArr([]);
    setHighlighted({});
    setAnimState({ isRunning: false, multiple: 1, current: 1 });

    if (soundMode !== 'mute') audioEngine.playTick(settings.soundTheme);
  }, [settings.soundTheme, soundMode, setHiddenNumbersArr, setHighlighted]);


  useEffect(() => {
    setHasConfig(true);
    if (window.innerWidth >= 1024) setIsConfigOpen(true);
    setHelpContent(<HelpContent />);
    setOnConfigToggle(() => () => setIsConfigOpen(prev => !prev));
  }, [setHasConfig, setIsConfigOpen, setHelpContent, setOnConfigToggle]);

  useEffect(() => {
    setOnReset(() => clearAll);
  }, [clearAll, setOnReset]);

  useEffect(() => {
    return () => {
      clearHeader();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
        audioRef.current = null;
      }
    };
  }, [clearHeader]);

  const handleCellClick = (num: number) => {
    playSound(num);
    if (activeColor === '#000000') {
      // Black hides the number
      const next = new Set(hiddenNumbers);
      if (next.has(num)) next.delete(num);
      else {
        next.add(num);
        setHighlighted(prevH => {
          const nextH = { ...prevH };
          delete nextH[num];
          return nextH;
        });
      }
      setHiddenNumbersArr(Array.from(next));
    } else if (activeColor === '#ffffff') {
      // White clears everything
      const next = new Set(hiddenNumbers);
      next.delete(num);
      setHiddenNumbersArr(Array.from(next));

      setHighlighted(prev => {
        const nextH = { ...prev };
        delete nextH[num];
        return nextH;
      });
    } else if (activeColor) {
      // Other colors highlight
      setHighlighted(prev => {
        const nextH = { ...prev };
        if (nextH[num] === activeColor) delete nextH[num];
        else {
          nextH[num] = activeColor;
          const nextHidden = new Set(hiddenNumbers);
          nextHidden.delete(num);
          setHiddenNumbersArr(Array.from(nextHidden));
        }
        return nextH;
      });
    }

  };



  const handlePlay = () => {
    if (soundMode !== 'mute') audioEngine.playTick(settings.soundTheme);
    setAnimState(prev => ({ ...prev, isRunning: true, current: prev.multiple }));
  };

  const handleStop = () => {
    if (soundMode !== 'mute') audioEngine.playTick(settings.soundTheme);
    setAnimState(prev => ({ ...prev, isRunning: false }));
  };

  useEffect(() => {
    if (!animState.isRunning) return;

    if (animState.current > 100) {
      setAnimState(prev => ({ ...prev, isRunning: false }));
      return;
    }

    if (animSpeed === 0) {
      setHighlighted(prevH => {
        const nextH = { ...prevH };
        let c = animState.current;
        while (c <= 100) {
          if (activeColor === '#000000' || activeColor === '#ffffff') {
            delete nextH[c];
          } else {
            nextH[c] = activeColor as string;
          }
          c += animState.multiple;
        }
        return nextH;
      });
      
      setHiddenNumbersArr(prevArr => {
        const nextHidden = new Set(prevArr);
        let c = animState.current;
        while (c <= 100) {
          if (activeColor === '#000000') {
            nextHidden.add(c);
          } else if (activeColor === '#ffffff' || activeColor) {
            nextHidden.delete(c);
          }
          c += animState.multiple;
        }
        return Array.from(nextHidden);
      });

      setAnimState(prev => ({ ...prev, isRunning: false }));
      return;
    }

    const num = animState.current;
    
    // 1. Visual update (Immediate)
    if (activeColor === '#000000') {
      setHiddenNumbersArr(prev => {
        const next = new Set(prev);
        next.add(num);
        return Array.from(next);
      });

      setHighlighted(prev => {
        const nextH = { ...prev };
        delete nextH[num];
        return nextH;
      });
    } else if (activeColor === '#ffffff') {
      setHiddenNumbersArr(prev => {
        const next = new Set(prev);
        next.delete(num);
        return Array.from(next);
      });

      setHighlighted(prev => {
        const nextH = { ...prev };
        delete nextH[num];
        return nextH;
      });
    } else {
      setHighlighted(prev => ({ ...prev, [num]: activeColor as string }));
      setHiddenNumbersArr(prev => {
        const next = new Set(prev);
        next.delete(num);
        return Array.from(next);
      });
    }

    // 2. Sound and progression
    let timer: NodeJS.Timeout;
    const cleanupSound = playSound(num, () => {
      timer = setTimeout(() => {
        setAnimState(prev => ({ ...prev, current: prev.current + prev.multiple }));
      }, animSpeed);
    });

    return () => {
      cleanupSound();
      if (timer) clearTimeout(timer);
    };
  }, [animState, activeColor, animSpeed, playSound, setHiddenNumbersArr, setHighlighted]);


  const rows = useMemo(() => {
    const r = [];
    for (let i = 0; i < 10; i++) {
      const row = [];
      for (let j = 1; j <= 10; j++) row.push(i * 10 + j);
      r.push(row);
    }
    return r;
  }, []);

  return (
    <div className="flex flex-col lg:flex-row gap-8 w-full h-full italic overflow-hidden relative">
      <AnimatePresence>
        {isConfigOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[100] p-4 lg:p-0 lg:static lg:w-[320px] flex flex-col h-full gap-8 italic overflow-hidden shrink-0 bg-dark-bg/10 backdrop-blur-md lg:bg-transparent lg:backdrop-blur-none"
          >
            <SettingsPanel
              isOpen={isConfigOpen}
              onClose={() => setIsConfigOpen(false)}
              className="w-full h-full lg:h-fit"
              compact
              title={intl.formatMessage({ id: 'hundredschart.settings.title', defaultMessage: 'Config' })}
            >
              <div className="space-y-6">
                {/* Color Selection */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-primary opacity-60">
                    <Palette size={14} />
                    <label className="text-[10px] font-black uppercase tracking-widest block">
                      <FormattedMessage id="hundredschart.sidebar.tools" defaultMessage="Colors" />
                    </label>
                  </div>
                  <div className="grid grid-cols-5 gap-2">
                    {colors.map(c => (
                      <button
                        key={c.id}
                        onClick={() => { setActiveColor(c.value); if (soundMode !== 'mute') audioEngine.playTick(settings.soundTheme); }}
                        className={`aspect-square rounded-xl transition-all border-2 flex items-center justify-center ${activeColor === c.value ? 'scale-105 border-slate-900' : 'border-white opacity-60 hover:opacity-100 '}`}
                        style={{ backgroundColor: c.id === 'white' || c.id === 'black' ? (c.id === 'white' ? '#f8fafc' : '#1e293b') : c.value }}
                        title={c.label}
                      >
                        {c.icon && <c.icon size={14} className={c.id === 'white' ? 'text-neutral-400' : 'text-white'} />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sound Selection */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-primary opacity-60">
                    <Volume2 size={14} />
                    <label className="text-[10px] font-black uppercase tracking-widest block">
                      <FormattedMessage id="hundredschart.sidebar.sound" defaultMessage="Sound" />
                    </label>
                  </div>
                  <div className="space-y-2">
                    <div className="flex bg-slate-50 p-1 rounded-2xl border-4 border-white">
                      <button
                        onClick={() => { 
                          setSoundMode('speak'); 
                          const currentLang = LANGUAGES.find(l => l.code === speakLanguage) || LANGUAGES[0];
                          speak(currentLang.hello, 1.0, undefined, speakLanguage); 
                        }}
                        className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 ${soundMode === 'speak' ? 'bg-primary text-white' : 'text-neutral-400 hover:text-slate-600'}`}
                      >
                        <MessageCircle size={12} />
                        <FormattedMessage id="hundredschart.sound.speak" defaultMessage="Speak" />
                      </button>
                      <button
                        onClick={() => { setSoundMode('sound'); audioEngine.playTick(settings.soundTheme); }}
                        className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 ${soundMode === 'sound' ? 'bg-primary text-white' : 'text-neutral-400 hover:text-slate-600'}`}
                      >
                        <Volume2 size={12} />
                        <FormattedMessage id="hundredschart.sound.sound" defaultMessage="Sound" />
                      </button>
                      <button
                        onClick={() => { setSoundMode('mute'); }}
                        className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 ${soundMode === 'mute' ? 'bg-primary text-white' : 'text-neutral-400 hover:text-slate-600'}`}
                      >
                        <VolumeX size={12} />
                        <FormattedMessage id="hundredschart.sound.mute" defaultMessage="Mute" />
                      </button>
                    </div>

                    {soundMode === 'speak' && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="grid grid-cols-6 gap-1 p-1 bg-surface rounded-xl border border-slate-100"
                      >
                        {LANGUAGES.filter(l => availableLangs.includes(l.code)).map(lang => (
                          <button
                            key={lang.code}
                            onClick={() => { setSpeakLanguage(lang.code); speak(lang.hello, 1.0, undefined, lang.code); }}
                            className={`aspect-square rounded-lg transition-all flex items-center justify-center ${speakLanguage === lang.code ? 'bg-primary/5 border-primary/30' : 'hover:bg-slate-50 border-transparent'} border`}
                            title={lang.label}
                          >
                            <FlagIcon country={lang.country} className="w-5 h-5 rounded-sm overflow-hidden" />
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </div>
                </div>

                {/* Multiples Selection */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-primary opacity-60">
                    <Zap size={14} />
                    <label className="text-[10px] font-black uppercase tracking-widest block">
                      <FormattedMessage id="hundredschart.sidebar.highlight" defaultMessage="Patterns" />
                    </label>
                  </div>
                  <div className="grid grid-cols-5 gap-2">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(m => (
                      <button
                        key={m}
                        onClick={() => { setAnimState(prev => ({ ...prev, multiple: m })); if (soundMode !== 'mute') audioEngine.playTick(settings.soundTheme); }}
                        className={`aspect-square flex items-center justify-center rounded-xl border-2 transition-all font-black text-xs ${animState.multiple === m ? 'bg-primary border-indigo-600 text-white' : 'bg-surface border-slate-100 text-neutral-400 hover:border-primary/20'}`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Speed Selection */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-primary opacity-60">
                    <Zap size={14} />
                    <label className="text-[10px] font-black uppercase tracking-widest block">
                      <FormattedMessage id="hundredschart.sidebar.animation" defaultMessage="Speed" />
                    </label>
                  </div>
                  <div className="flex bg-slate-50 p-1 rounded-2xl border-4 border-white">
                    {animationSpeeds.map(s => (
                      <button
                        key={s.label}
                        onClick={() => { setAnimSpeed(s.value); if (soundMode !== 'mute') audioEngine.playTick(settings.soundTheme); }}
                        className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${animSpeed === s.value ? 'bg-primary text-white' : 'text-neutral-400 hover:text-slate-600'}`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </SettingsPanel>
          </motion.div>
        )}
      </AnimatePresence>

      <ToolPanel className="flex-1 italic" baseWidth={1100} baseHeight={800}>
        <div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden gap-12">
          
          <div className="flex items-center gap-12 w-full justify-center">
            {/* Play Button */}
            <button
              onClick={handlePlay}
              disabled={animState.isRunning}
              className={`w-24 h-24 rounded-full flex items-center justify-center transition-all border-4 active:scale-90 ${animState.isRunning ? 'bg-slate-50 border-white text-slate-200' : 'bg-surface border-white text-primary hover:bg-primary/5 hover:text-primary'}`}
              title="Play Pattern"
            >
              <Play size={40} fill="currentColor" />
            </button>

            {/* Chart */}
            <div className="w-full max-w-xl aspect-square relative z-10 p-4 bg-surface rounded-3xl border-4 border-slate-50 overflow-hidden">
              <div className="grid grid-cols-10 h-full bg-surface rounded-none overflow-hidden border-none ">
                {rows.flat().map(num => (
                  <div key={num} className="aspect-square">
                    <ChartCell
                      num={num}
                      isHidden={hiddenNumbers.has(num)}
                      highlightColor={highlighted[num] || null}
                      onClick={handleCellClick}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Stop Button */}
            <button
              onClick={handleStop}
              disabled={!animState.isRunning}
              className={`w-24 h-24 rounded-full flex items-center justify-center transition-all border-4 active:scale-90 ${!animState.isRunning ? 'bg-slate-50 border-white text-slate-200' : 'bg-surface border-white text-caution hover:bg-caution-bg hover:text-rose-700'}`}
              title="Stop Pattern"
            >
              <Square size={40} fill="currentColor" />
            </button>
          </div>

          <button
            onClick={clearAll}
            className="flex items-center gap-2 px-12 py-4 bg-surface border-2 border-slate-100 rounded-3xl text-sm font-black text-neutral-400 hover:border-primary/20 hover:text-primary transition-all active:scale-95 uppercase tracking-[0.2em]"
          >
            <Eraser size={20} />
            <FormattedMessage id="hundredschart.clearall" defaultMessage="Clear All" />
          </button>
        </div>
      </ToolPanel>

      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[150px] opacity-40 -z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-caution-bg rounded-full blur-[150px] opacity-40 -z-10 pointer-events-none" />
    </div>
  );
};

export default HundredsChart;
