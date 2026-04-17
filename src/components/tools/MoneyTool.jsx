import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCcw, CheckCircle2, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useSettings } from '../../contexts/SettingsContext';
import { audioEngine } from '../../utils/audio';

const CURRENCIES = {
  AUD: {
    symbol: '$',
    items: [
      { id: '100d', value: 100, type: 'note', color: 'bg-green-100 border-green-500 text-green-800', label: '$100', sizeClass: 'w-[128px] h-[52px] text-base' },
      { id: '50d', value: 50, type: 'note', color: 'bg-yellow-100 border-yellow-500 text-yellow-800', label: '$50', sizeClass: 'w-[122px] h-[52px] text-base' },
      { id: '20d', value: 20, type: 'note', color: 'bg-red-100 border-red-500 text-red-800', label: '$20', sizeClass: 'w-[116px] h-[52px] text-base' },
      { id: '10d', value: 10, type: 'note', color: 'bg-blue-100 border-blue-500 text-blue-800', label: '$10', sizeClass: 'w-[110px] h-[52px] text-base' },
      { id: '5d', value: 5, type: 'note', color: 'bg-fuchsia-100 border-fuchsia-500 text-fuchsia-800', label: '$5', sizeClass: 'w-[104px] h-[52px] text-base' },
      { id: '2d', value: 2, type: 'coin', color: 'bg-yellow-300 border-yellow-500 text-yellow-900', label: '$2', sizeClass: 'w-[42px] h-[42px] text-xs' },
      { id: '1d', value: 1, type: 'coin', color: 'bg-yellow-300 border-yellow-500 text-yellow-900', label: '$1', sizeClass: 'w-[51px] h-[51px] text-sm' },
      { id: '50c', value: 0.50, type: 'coin', color: 'bg-gray-200 border-gray-400 text-gray-800', label: '50c', isPoly: true, polyPoints: 'polygon(50% 0%, 75% 6.7%, 93.3% 25%, 100% 50%, 93.3% 75%, 75% 93.3%, 50% 100%, 25% 93.3%, 6.7% 75%, 0% 50%, 6.7% 25%, 25% 6.7%)', sizeClass: 'w-[64px] h-[64px] text-base' },
      { id: '20c', value: 0.20, type: 'coin', color: 'bg-gray-200 border-gray-400 text-gray-800', label: '20c', sizeClass: 'w-[58px] h-[58px] text-base' },
      { id: '10c', value: 0.10, type: 'coin', color: 'bg-gray-200 border-gray-400 text-gray-800', label: '10c', sizeClass: 'w-[48px] h-[48px] text-sm' },
      { id: '5c', value: 0.05, type: 'coin', color: 'bg-gray-200 border-gray-400 text-gray-800', label: '5c', sizeClass: 'w-[40px] h-[40px] text-xs' },
    ]
  },
  GBP: {
    symbol: '£',
    items: [
      { id: '50p', value: 50, type: 'note', color: 'bg-red-100 border-red-500 text-red-800', label: '£50', sizeClass: 'w-[140px] h-[60px] text-base' },
      { id: '20p', value: 20, type: 'note', color: 'bg-purple-100 border-purple-500 text-purple-800', label: '£20', sizeClass: 'w-[130px] h-[55px] text-base' },
      { id: '10p', value: 10, type: 'note', color: 'bg-orange-100 border-orange-500 text-orange-800', label: '£10', sizeClass: 'w-[124px] h-[52px] text-base' },
      { id: '5p', value: 5, type: 'note', color: 'bg-teal-100 border-teal-500 text-teal-800', label: '£5', sizeClass: 'w-[118px] h-[48px] text-base' },
      { id: '2c', value: 2, type: 'coin', color: 'bg-yellow-200 border-gray-400 text-gray-800', label: '£2', isBimetallic: true, innerColor: 'bg-gray-200', sizeClass: 'w-[58px] h-[58px] text-sm' },
      { id: '1c', value: 1, type: 'coin', color: 'bg-gray-200 border-yellow-500 text-gray-800', label: '£1', isPoly: true, polyPoints: 'polygon(50% 0%, 75% 6.7%, 93.3% 25%, 100% 50%, 93.3% 75%, 75% 93.3%, 50% 100%, 25% 93.3%, 6.7% 75%, 0% 50%, 6.7% 25%, 25% 6.7%)', isBimetallic: true, innerColor: 'bg-yellow-200', sizeClass: 'w-[48px] h-[48px] text-sm' },
      { id: '50cc', value: 0.50, type: 'coin', color: 'bg-gray-200 border-gray-400 text-gray-800', label: '50p', isPoly: true, polyPoints: 'polygon(50% 0%, 90% 20%, 100% 60%, 75% 100%, 25% 100%, 0% 60%, 10% 20%)', sizeClass: 'w-[56px] h-[56px] text-sm' },
      { id: '20cc', value: 0.20, type: 'coin', color: 'bg-gray-200 border-gray-400 text-gray-800', label: '20p', isPoly: true, polyPoints: 'polygon(50% 0%, 90% 20%, 100% 60%, 75% 100%, 25% 100%, 0% 60%, 10% 20%)', sizeClass: 'w-[44px] h-[44px] text-xs' },
      { id: '10cc', value: 0.10, type: 'coin', color: 'bg-gray-200 border-gray-400 text-gray-800', label: '10p', sizeClass: 'w-[50px] h-[50px] text-sm' },
      { id: '5cc', value: 0.05, type: 'coin', color: 'bg-gray-200 border-gray-400 text-gray-800', label: '5p', sizeClass: 'w-[38px] h-[38px] text-xs' },
    ]
  },
  CAD: {
    symbol: '$',
    items: [
      { id: '100d', value: 100, type: 'note', color: 'bg-amber-100 border-amber-600 text-amber-900', label: '$100', sizeClass: 'w-[110px] h-[46px] text-sm' },
      { id: '50d', value: 50, type: 'note', color: 'bg-red-100 border-red-600 text-red-900', label: '$50', sizeClass: 'w-[110px] h-[46px] text-sm' },
      { id: '20d', value: 20, type: 'note', color: 'bg-emerald-100 border-emerald-600 text-emerald-900', label: '$20', sizeClass: 'w-[110px] h-[46px] text-sm' },
      { id: '10d', value: 10, type: 'note', color: 'bg-purple-100 border-purple-600 text-purple-900', label: '$10', sizeClass: 'w-[110px] h-[46px] text-sm' },
      { id: '5d', value: 5, type: 'note', color: 'bg-blue-100 border-blue-600 text-blue-900', label: '$5', sizeClass: 'w-[110px] h-[46px] text-sm' },
      { id: '2d', value: 2, type: 'coin', color: 'bg-gray-200 border-gray-400 text-gray-800', label: '$2', isBimetallic: true, innerColor: 'bg-yellow-300', sizeClass: 'w-[56px] h-[56px] text-sm' },
      { id: '1d', value: 1, type: 'coin', color: 'bg-yellow-300 border-yellow-500 text-yellow-900', label: '$1', isPoly: true, polyPoints: 'polygon(50% 0%, 78% 10%, 98% 35%, 98% 65%, 78% 90%, 50% 100%, 22% 90%, 2% 65%, 2% 35%, 22% 10%)', sizeClass: 'w-[53px] h-[53px] text-sm' },
      { id: '25c', value: 0.25, type: 'coin', color: 'bg-gray-200 border-gray-400 text-gray-800', label: '25¢', sizeClass: 'w-[48px] h-[48px] text-sm' },
      { id: '10c', value: 0.10, type: 'coin', color: 'bg-gray-200 border-gray-400 text-gray-800', label: '10¢', sizeClass: 'w-[36px] h-[36px] text-xs' },
      { id: '5c', value: 0.05, type: 'coin', color: 'bg-gray-200 border-gray-400 text-gray-800', label: '5¢', sizeClass: 'w-[42px] h-[42px] text-xs' },
    ]
  }
};

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

  const formatMoney = (amount) => {
    return `${currentCurrencyData.symbol}${amount.toFixed(2)}`;
  };

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
    <div className="max-w-6xl mx-auto space-y-8 h-full flex flex-col px-4">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h2 className="text-3xl font-bold text-primary flex items-center gap-3">
          <RefreshCcw size={32} />
          Money Tool
        </h2>
        <div className="flex gap-4">
          <select 
            value={selectedCurrency}
            onChange={(e) => setSelectedCurrency(e.target.value)}
            className="px-4 py-2 border-2 border-gray-200 rounded-xl font-bold text-gray-700 bg-white hover:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors cursor-pointer"
          >
            <option value="AUD">🇦🇺 Australian ($)</option>
            <option value="CAD">🇨🇦 Canadian ($)</option>
            <option value="GBP">🇬🇧 UK (£)</option>
          </select>
          <button
            onClick={generateTarget}
            className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl text-gray-500 hover:bg-gray-50 transition-colors font-bold shadow-sm border border-gray-100"
          >
            <RefreshCcw size={20} /> New Amount
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Left Side: Goal & Feedback */}
        <div className="w-full lg:w-1/3 flex flex-col gap-6">
          <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-gray-100 text-center space-y-4">
            <h3 className="text-gray-500 font-bold uppercase tracking-widest text-sm">Target Amount</h3>
            <div className="text-6xl font-black text-text tabular-nums tracking-tight">
              {formatMoney(targetAmount)}
            </div>
          </div>

          <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-gray-100 text-center space-y-4 flex-1 flex flex-col justify-center min-h-[200px]">
            <h3 className="text-gray-500 font-bold uppercase tracking-widest text-sm">On The Table</h3>
            <div className="text-5xl font-black text-primary tabular-nums tracking-tight">
              {formatMoney(currentTotal)}
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
                    ? `You have ${formatMoney(difference)} too much!`
                    : `You need ${formatMoney(Math.abs(difference))} more.`
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
