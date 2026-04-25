import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCcw, CheckCircle2, AlertCircle, Banknote, Info } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useSettings } from '../../contexts/SettingsContext';
import { audioEngine } from '../../utils/audio';
import { ToolHeader } from '../ToolHeader';
import { CURRENCIES } from './MoneyTool/moneyData';
import { formatCurrency } from '../../utils/format';

export const MoneyTool = () => {
  const [selectedCurrency, setSelectedCurrency] = useState('AUD');
  const [targetAmount, setTargetAmount] = useState(0);
  const [tableMoney, setTableMoney] = useState([]);
  const [isSuccess, setIsSuccess] = useState(false);

  const { settings } = useSettings();
  
  const currentCurrencyData = CURRENCIES[selectedCurrency];

  const generateTarget = () => {
    const steps = Math.floor(100 / 0.05);
    const randomStep = Math.floor(Math.random() * steps) + 1;
    const amount = Number((randomStep * 0.05).toFixed(2));
    setTargetAmount(amount);
    setTableMoney([]);
    setIsSuccess(false);
  };

  useEffect(() => {
    generateTarget();
  }, [selectedCurrency]);

  const currentTotal = Number((tableMoney.reduce((sum, item) => sum + item.value, 0)).toFixed(2));
  const difference = Number((currentTotal - targetAmount).toFixed(2));


  useEffect(() => {
    if (targetAmount > 0 && difference === 0 && !isSuccess) {
      setIsSuccess(true);
      audioEngine.playAlarm(settings.soundTheme);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  }, [difference, targetAmount, isSuccess, settings.soundTheme]);

  const addMoney = (item) => {
    if (isSuccess) setIsSuccess(false);
    audioEngine.playTick(settings.soundTheme);
    setTableMoney(prev => [...prev, { ...item, uniqueId: Math.random().toString() }]);
  };

  const removeMoney = (uniqueId) => {
    if (isSuccess) setIsSuccess(false);
    audioEngine.playTick(settings.soundTheme);
    setTableMoney(prev => prev.filter(i => i.uniqueId !== uniqueId));
  };

  return (
    <div className="w-full mx-auto space-y-8 h-full flex flex-col px-4 pt-2 pb-8">
      <ToolHeader
        title="Money Tool"
        icon={Banknote}
        description="Learn to Count and Manage Currency"
        infoContent={
          <>
            <p>
              <strong className="text-white block mb-1">Currency Selection</strong>
              Switch between Australian Dollars, Canadian Dollars, and UK Pounds using the dropdown menu.
            </p>
            <p>
              <strong className="text-white block mb-1">Making Change</strong>
              Click the notes and coins in the "Bank" to add them to the table. Try to match the target amount exactly!
            </p>
          </>
        }
      >
        <div className="flex items-center gap-4">
          <select 
            value={selectedCurrency}
            onChange={(e) => setSelectedCurrency(e.target.value)}
            className="px-4 py-2 border-2 border-gray-200 rounded-xl font-bold text-gray-700 bg-white hover:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors cursor-pointer text-sm"
          >
            <option value="AUD">🇦🇺 Australian ($)</option>
            <option value="CAD">🇨🇦 Canadian ($)</option>
            <option value="GBP">🇬🇧 UK (£)</option>
          </select>
          <button
            onClick={generateTarget}
            className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl text-gray-500 hover:bg-gray-50 transition-colors font-bold shadow-sm border border-gray-100 text-sm"
            title="Generate New Target Amount"
          >
            <RefreshCcw size={18} /> New Amount
          </button>
        </div>
      </ToolHeader>

      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Left Side: Goal & Feedback */}
        <div className="w-full lg:w-1/3 flex flex-col gap-6">
          <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-gray-100 text-center space-y-4">
            <h3 className="text-gray-500 font-bold uppercase tracking-widest text-sm">Target Amount</h3>
            <div className="text-6xl font-black text-text tabular-nums tracking-tight">
              {formatCurrency(targetAmount, currentCurrencyData.symbol)}
            </div>
          </div>

          <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-gray-100 text-center space-y-4 flex-1 flex flex-col justify-center min-h-[200px]">
            <h3 className="text-gray-500 font-bold uppercase tracking-widest text-sm">On The Table</h3>
            <div className="text-5xl font-black text-primary tabular-nums tracking-tight">
              {formatCurrency(currentTotal, currentCurrencyData.symbol)}
            </div>
            
            <div className="h-16 flex items-center justify-center mt-4">
              {isSuccess ? (
                <div className="flex items-center gap-2 text-green-600 font-black text-xl animate-in zoom-in">
                  <CheckCircle2 size={28} /> EXACT MATCH!
                </div>
              ) : difference === 0 ? null : (
                <div className={`flex items-center gap-2 font-bold text-lg px-4 py-2 rounded-full animate-in fade-in ${
                  difference > 0 ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                }`}>
                  <AlertCircle size={20} />
                  {difference > 0 
                    ? `You have ${formatCurrency(difference, currentCurrencyData.symbol)} too much!`
                    : `You need ${formatCurrency(Math.abs(difference), currentCurrencyData.symbol)} more.`
                  }
                </div>
              )}
            </div>

            {isSuccess && (
              <button
                onClick={generateTarget}
                className="mt-4 w-full py-4 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-colors shadow-md animate-in slide-in-from-bottom-2"
              >
                Play Again
              </button>
            )}
          </div>
        </div>

        {/* Right Side: Table and Bank */}
        <div className="w-full lg:w-2/3 flex flex-col gap-6">
          
          {/* The Table */}
          <div className="bg-amber-100/30 p-8 rounded-[3rem] shadow-inner border-4 border-amber-200 min-h-[300px] relative overflow-hidden flex flex-col">
            <h3 className="text-amber-700/50 font-black uppercase tracking-widest text-xl absolute top-6 left-8">The Table</h3>
            
            <div className="flex-1 mt-10">
              {tableMoney.length === 0 ? (
                <div className="w-full h-full flex items-center justify-center text-amber-800/30 font-bold text-2xl">
                  Click money in the bank to add it here
                </div>
              ) : (
                <div className="flex flex-wrap gap-3 items-center justify-start content-start h-full">
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
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => removeMoney(item.uniqueId)}
                          className={`relative flex items-center justify-center font-black shadow-md border-2 overflow-hidden ${item.color} ${item.sizeClass} ${
                            isNote ? 'rounded-sm' : 'rounded-full'
                          } hover:ring-4 hover:ring-red-400 cursor-pointer`}
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
          <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-gray-100 space-y-6">
            <h3 className="text-gray-400 font-bold uppercase tracking-widest text-sm text-center">The Bank</h3>
            
            {/* Notes Row */}
            <div className="flex flex-wrap justify-center gap-4">
              {currentCurrencyData.items.filter(i => i.type === 'note').map((item) => (
                <motion.button
                  key={item.id}
                  layout
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => addMoney(item)}
                  className={`relative flex items-center justify-center font-black shadow-md border-2 overflow-hidden ${item.color} ${item.sizeClass} rounded-sm cursor-pointer`}
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
              {currentCurrencyData.items.filter(i => i.type === 'coin').map((item) => {
                const polyClipPath = item.isPoly ? (item.polyPoints || 'polygon(50% 0%, 75% 6.7%, 93.3% 25%, 100% 50%, 93.3% 75%, 75% 93.3%, 50% 100%, 25% 93.3%, 6.7% 75%, 0% 50%, 6.7% 25%, 25% 6.7%)') : 'none';
                return (
                  <motion.button
                    key={item.id}
                    layout
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => addMoney(item)}
                    className={`relative flex items-center justify-center font-black shadow-md border-2 overflow-hidden ${item.color} ${item.sizeClass} rounded-full cursor-pointer`}
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
          </div>

        </div>
      </div>
    </div>
  );
};
