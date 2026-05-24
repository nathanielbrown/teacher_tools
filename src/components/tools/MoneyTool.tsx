import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCcw, CheckCircle2, AlertCircle, Banknote } from 'lucide-react';
import { FormattedMessage } from 'react-intl';
import confetti from 'canvas-confetti';
import { useSettings } from '../../contexts/SettingsContext';
import { useHeader } from '../../contexts/HeaderContext';
import { audioEngine } from '../../utils/audio';
import { CURRENCIES } from './MoneyTool/moneyData';
import { formatCurrency } from '../../utils/format';
import { ToolPanel } from '../shared/ToolPanel';

// 1. Constants
// CURRENCIES is imported from moneyData

// 2. Config (None)

// 3. Text (Help and Info)
const HelpContent = () => (
  <div className="space-y-4 font-['Outfit']">
    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">
      <FormattedMessage id="moneytool.help.title" defaultMessage="How to Use" />
    </h3>
    <div className="space-y-3">
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-primary/5 flex items-center justify-center text-xs font-black text-primary shrink-0">1</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">
          <FormattedMessage id="moneytool.help.step1" defaultMessage="Pick your <b>Money</b> in the top menu." values={{ b: (chunks: React.ReactNode) => <b>{chunks}</b> }} />
        </p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center text-xs font-black text-blue-600 shrink-0">2</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">
          <FormattedMessage id="moneytool.help.step2" defaultMessage="Click money in the <b>Bank</b> to add it to the table." values={{ b: (chunks: React.ReactNode) => <b>{chunks}</b> }} />
        </p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-purple-50 flex items-center justify-center text-xs font-black text-purple-600 shrink-0">3</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">
          <FormattedMessage id="moneytool.help.step3" defaultMessage="Try to reach the <b>Goal</b>." values={{ b: (chunks: React.ReactNode) => <b>{chunks}</b> }} />
        </p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-success-bg flex items-center justify-center text-xs font-black text-success shrink-0">4</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">
          <FormattedMessage id="moneytool.help.step4" defaultMessage="Click money on the <b>Table</b> to remove it." values={{ b: (chunks: React.ReactNode) => <b>{chunks}</b> }} />
        </p>
      </div>
    </div>
  </div>
);

// 4. Local Storage (None)

// 5. Classes (None)

// 6. Functions (None)

// 7. Component
export const MoneyTool = () => {
  const { setHeaderActions, setOnReset, clearHeader, setHelpContent } = useHeader();
  const [selectedCurrency, setSelectedCurrency] = useState('AUD');
  const [targetAmount, setTargetAmount] = useState(0);
  const [tableMoney, setTableMoney] = useState<any[]>([]);
  const [isSuccess, setIsSuccess] = useState(false);

  const { settings } = useSettings();
  
  const moneyIdCounter = useRef(0);

  const currentCurrencyData = (CURRENCIES as any)[selectedCurrency];

  const generateTarget = useCallback(() => {
    const steps = Math.floor(100 / 0.05);
    const randomStep = Math.floor(Math.random() * steps) + 1;
    const amount = Number((randomStep * 0.05).toFixed(2));
    setTargetAmount(amount);
    setTableMoney([]);
    setIsSuccess(false);
  }, []);

  const currentTotal = Number((tableMoney.reduce((sum, item) => sum + item.value, 0)).toFixed(2));
  const difference = Number((currentTotal - targetAmount).toFixed(2));

  const addMoney = (item: any) => {
    if (isSuccess) setIsSuccess(false);
    audioEngine.playTick(settings.soundTheme);
    const newTableMoney = [...tableMoney, { ...item, uniqueId: `m-${moneyIdCounter.current++}` }];
    setTableMoney(newTableMoney);
    
    const newTotal = Number((newTableMoney.reduce((sum, i) => sum + i.value, 0)).toFixed(2));
    if (targetAmount > 0 && Number((newTotal - targetAmount).toFixed(2)) === 0) {
      setIsSuccess(true);
      audioEngine.playAlarm(settings.soundTheme);
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    }
  };

  const removeMoney = (uniqueId: string) => {
    if (isSuccess) setIsSuccess(false);
    audioEngine.playTick(settings.soundTheme);
    const newTableMoney = tableMoney.filter(i => i.uniqueId !== uniqueId);
    setTableMoney(newTableMoney);

    const newTotal = Number((newTableMoney.reduce((sum, i) => sum + i.value, 0)).toFixed(2));
    if (targetAmount > 0 && Number((newTotal - targetAmount).toFixed(2)) === 0) {
      setIsSuccess(true);
      audioEngine.playAlarm(settings.soundTheme);
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    }
  };

  const resetGame = useCallback(() => {
    setTableMoney([]);
    setIsSuccess(false);
    generateTarget();
  }, [generateTarget]);

  useEffect(() => {
    setOnReset(() => resetGame);
    setHelpContent(<HelpContent />);
     
    if (targetAmount === 0) generateTarget();
    return () => clearHeader();
  }, [clearHeader, setOnReset, resetGame, setHelpContent, generateTarget, targetAmount]);

  useEffect(() => {
    setHeaderActions(
      <div className="flex items-center gap-4">
        <button
          onClick={generateTarget}
          className="flex items-center gap-2 px-4 py-2 bg-surface border-2 border-slate-100 text-neutral-400 rounded-xl font-black text-[10px] uppercase tracking-widest hover:border-primary/20 hover:text-primary transition-all active:scale-95"
        >
          <RefreshCcw size={14} /> <FormattedMessage id="moneytool.action.new" defaultMessage="New Goal" />
        </button>
      </div>
    );
  }, [generateTarget, setHeaderActions]);

  return (
    <ToolPanel className="flex flex-col p-4 font-['Outfit'] select-none">
      <div className="flex flex-col lg:flex-row gap-8 w-full h-full">
        
        {/* Left Side: Goal & Feedback */}
        <div className="w-full lg:w-1/3 flex flex-col gap-6">
          <div className="bg-surface p-8 text-center space-y-4 rounded-[3rem] border-none">
            <h3 className="text-neutral-400 font-black uppercase tracking-widest text-[10px]">
              <FormattedMessage id="moneytool.label.target" defaultMessage="Goal" />
            </h3>
            <div className="text-6xl font-black text-slate-800 tabular-nums tracking-tight">
              {formatCurrency(targetAmount, currentCurrencyData.symbol)}
            </div>
          </div>

          <div className="bg-surface p-8 text-center space-y-4 flex-1 flex flex-col justify-center min-h-[200px] rounded-[3rem] border-none">
            <h3 className="text-neutral-400 font-black uppercase tracking-widest text-[10px]">
              <FormattedMessage id="moneytool.label.table" defaultMessage="Total" />
            </h3>
            <div className="text-5xl font-black text-primary tabular-nums tracking-tight">
              {formatCurrency(currentTotal, currentCurrencyData.symbol)}
            </div>
            
            <div className="h-16 flex items-center justify-center mt-4">
              {isSuccess ? (
                <div className="flex items-center gap-2 text-success font-black text-xl animate-in zoom-in uppercase">
                  <CheckCircle2 size={28} /> <FormattedMessage id="moneytool.feedback.match" defaultMessage="WELL DONE!" />
                </div>
              ) : difference === 0 ? null : (
                <div className={`flex items-center gap-2 font-black text-[10px] uppercase tracking-widest px-4 py-3 rounded-2xl animate-in fade-in  ${
                  difference > 0 ? 'bg-caution-bg text-caution border border-caution-border' : 'bg-primary/5 text-primary border border-primary/20'
                }`}>
                  <AlertCircle size={16} />
                  {difference > 0 
                    ? <FormattedMessage id="moneytool.feedback.overflow" defaultMessage="Too much: {amount}" values={{ amount: formatCurrency(difference, currentCurrencyData.symbol) }} />
                    : <FormattedMessage id="moneytool.feedback.shortfall" defaultMessage="Need more: {amount}" values={{ amount: formatCurrency(Math.abs(difference), currentCurrencyData.symbol) }} />
                  }
                </div>
              )}
            </div>

            {isSuccess && (
              <button
                onClick={generateTarget}
                className="mt-4 w-full py-4 bg-dark-bg text-white font-black rounded-2xl hover:bg-primary transition-all animate-in slide-in-from-bottom-2 uppercase tracking-widest text-xs"
              >
                <FormattedMessage id="moneytool.action.again" defaultMessage="Play Again" />
              </button>
            )}
          </div>
        </div>

        {/* Right Side: Table and Bank */}
        <div className="w-full lg:w-2/3 flex flex-col gap-6">
          
          {/* The Table */}
          <div className="bg-surface p-12 rounded-[4rem] border-none min-h-[300px] relative overflow-hidden flex flex-col group">
            <div className="tool-grid-bg opacity-30" />
            <div className="absolute top-8 left-8 flex items-center gap-2 opacity-20 group-hover:opacity-40 transition-opacity z-10">
               <div className="w-2 h-2 rounded-full bg-slate-400 animate-pulse" />
               <h3 className="text-slate-800 font-black uppercase tracking-widest text-xs">
                 <FormattedMessage id="moneytool.label.surface" defaultMessage="Table" />
               </h3>
            </div>
            
            <div className="flex-1 mt-10 relative z-10">
              {tableMoney.length === 0 ? (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 gap-4">
                  <Banknote size={48} strokeWidth={1} className="opacity-20 animate-pulse" />
                  <p className="font-black text-lg uppercase tracking-widest opacity-20">
                    <FormattedMessage id="moneytool.status.empty" defaultMessage="Add money to the table" />
                  </p>
                </div>
              ) : (
                <div className="flex flex-wrap gap-4 items-center justify-start content-start h-full">
                  <AnimatePresence>
                    {tableMoney.map((item) => {
                      const isNote = item.type === 'note';
                      const polyClipPath = item.isPoly ? (item.polyPoints || 'polygon(50% 0%, 75% 6.7%, 93.3% 25%, 100% 50%, 93.3% 75%, 75% 93.3%, 50% 100%, 25% 93.3%, 6.7% 75%, 0% 50%, 6.7% 25%, 25% 6.7%)') : 'none';
                      return (
                        <motion.button
                          key={item.uniqueId}
                          layout
                          initial={{ opacity: 0, scale: 0.5, y: -20 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.5, y: 20 }}
                          whileHover={{ scale: 1.1, rotate: 2 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => removeMoney(item.uniqueId)}
                          className={`relative flex items-center justify-center font-black border-2 overflow-hidden ${item.color} ${item.sizeClass} ${
                            isNote ? 'rounded-md' : 'rounded-full'
                          } hover:ring-4 hover:ring-rose-400 transition-all cursor-pointer`}
                          style={{ clipPath: polyClipPath }}
                        >
                          {isNote && (
                            <div className="absolute inset-0 opacity-20 pointer-events-none">
                              <div className="w-4 h-4 rounded-full border-2 border-black absolute top-1 left-1"></div>
                              <div className="w-4 h-4 rounded-full border-2 border-black absolute bottom-1 right-1"></div>
                            </div>
                          )}
                          {item.isBimetallic && (
                            <div className={`absolute inset-0 m-auto w-[65%] h-[65%] rounded-full ${item.innerColor} pointer-events-none`}></div>
                          )}
                          <span className="relative z-10">{item.label}</span>
                        </motion.button>
                      );
                    })}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </div>

          {/* The Bank */}
          <div className="bg-surface/80 backdrop-blur-xl p-10 space-y-10 rounded-[3rem] border-none">
            <div className="flex items-center gap-4 justify-center">
               <div className="h-px flex-1 bg-slate-100" />
               <h3 className="text-slate-300 font-black uppercase tracking-[0.4em] text-[10px]">
                 <FormattedMessage id="moneytool.label.vault" defaultMessage="Bank" />
               </h3>
               <div className="h-px flex-1 bg-slate-100" />
            </div>
            
            <div className="space-y-8">
              {/* Notes Row */}
              <div className="flex flex-wrap justify-center gap-4">
                {currentCurrencyData.items.filter((i: any) => i.type === 'note').map((item: any) => (
                  <motion.button
                    key={item.id}
                    layout
                    whileHover={{ scale: 1.05, y: -5 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => addMoney(item)}
                    className={`relative flex items-center justify-center font-black border-2 overflow-hidden ${item.color} ${item.sizeClass} rounded-md cursor-pointer transition-all`}
                  >
                    <div className="absolute inset-0 opacity-20 pointer-events-none">
                      <div className="w-4 h-4 rounded-full border-2 border-black absolute top-1 left-1"></div>
                      <div className="w-4 h-4 rounded-full border-2 border-black absolute bottom-1 right-1"></div>
                    </div>
                    <span className="relative z-10">{item.label}</span>
                  </motion.button>
                ))}
              </div>

              {/* Coins Row */}
              <div className="flex flex-wrap justify-center gap-4">
                {currentCurrencyData.items.filter((i: any) => i.type === 'coin').map((item: any) => {
                  const polyClipPath = item.isPoly ? (item.polyPoints || 'polygon(50% 0%, 75% 6.7%, 93.3% 25%, 100% 50%, 93.3% 75%, 75% 93.3%, 50% 100%, 25% 93.3%, 6.7% 75%, 0% 50%, 6.7% 25%, 25% 6.7%)') : 'none';
                  return (
                    <motion.button
                      key={item.id}
                      layout
                      whileHover={{ scale: 1.1, y: -5 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => addMoney(item)}
                      className={`relative flex items-center justify-center font-black border-2 overflow-hidden ${item.color} ${item.sizeClass} rounded-full cursor-pointer transition-all`}
                      style={{ clipPath: polyClipPath }}
                    >
                      {item.isBimetallic && (
                        <div className={`absolute inset-0 m-auto w-[65%] h-[65%] rounded-full ${item.innerColor} pointer-events-none`}></div>
                      )}
                      <span className="relative z-10">{item.label}</span>
                    </motion.button>
                  );
                })}
              </div>

              {/* Currency Selector */}
              <div className="pt-6 border-t border-slate-100 flex justify-center">
                <select 
                  value={selectedCurrency}
                  onChange={(e) => {
                    const next = e.target.value;
                    setSelectedCurrency(next);
                    generateTarget();
                  }}
                  className="px-6 py-3 border-2 border-slate-100 rounded-xl font-black text-slate-500 bg-surface hover:border-primary/20 focus:outline-none transition-all cursor-pointer text-xs uppercase tracking-widest outline-none"
                >
                  <option value="AUD">🇦🇺 Australian ($)</option>
                  <option value="CAD">🇨🇦 Canadian ($)</option>
                  <option value="GBP">🇬🇧 UK (£)</option>
                  <option value="USD">🇺🇸 US Dollar ($)</option>
                  <option value="EUR">🇪🇺 Euro (€)</option>
                </select>
              </div>
            </div>
          </div>

        </div>
      </div>
    </ToolPanel>
  );
};

export default MoneyTool;
