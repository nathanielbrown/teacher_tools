import React, { useState, useRef, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Zap, Clock, RotateCcw, AlertTriangle, Play } from 'lucide-react';

export const ReactionTime = () => {
  const [status, setStatus] = useState('idle'); // 'idle', 'waiting', 'ready', 'result'
  const [startTime, setStartTime] = useState(0);
  const [lastResult, setLastResult] = useState(null); // number or 'failed'
  const [history, setHistory] = useState(() => {
    const saved = localStorage.getItem('teacherToolsReactionTime');
    return saved ? JSON.parse(saved) : [];
  });
  const timeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('teacherToolsReactionTime', JSON.stringify(history));
  }, [history]);

  const handleStart = () => {
    setStatus('waiting');
    setLastResult(null);
    
    // Random delay between 3000ms and 10000ms
    const delay = Math.floor(Math.random() * 7000) + 3000;
    
    timeoutRef.current = setTimeout(() => {
      setStatus('ready');
      setStartTime(Date.now());
    }, delay);
  };

  const handleClick = () => {
    if (status === 'idle') {
      handleStart();
    } else if (status === 'waiting') {
      // Clicked too early
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      
      const newHistory = [...history, { attempt: history.length + 1, ms: null, failed: true }];
      setHistory(newHistory);
      setLastResult('failed');
      setStatus('result');
      
    } else if (status === 'ready') {
      // Valid reaction
      const endTime = Date.now();
      const reactionTime = endTime - startTime;
      
      const newHistory = [...history, { attempt: history.length + 1, ms: reactionTime, failed: false }];
      setHistory(newHistory);
      setLastResult(reactionTime);
      setStatus('result');
      
    } else if (status === 'result') {
      // Clicked result to reset
      handleStart();
    }
  };

  // Stats calculation
  const validAttempts = history.filter(h => !h.failed);
  const average = validAttempts.length > 0 
    ? Math.round(validAttempts.reduce((acc, curr) => acc + curr.ms, 0) / validAttempts.length)
    : 0;
  const best = validAttempts.length > 0
    ? Math.min(...validAttempts.map(h => h.ms))
    : 0;
  const worst = validAttempts.length > 0
    ? Math.max(...validAttempts.map(h => h.ms))
    : 0;

  // Graph data preparation
  const chartData = validAttempts.map((h, i) => ({
    name: `Trial ${i + 1}`,
    ms: h.ms
  }));

  // Button UI configuration
  const getButtonConfig = () => {
    switch(status) {
      case 'idle':
        return {
          bg: 'bg-blue-500 hover:bg-blue-600 active:bg-blue-700',
          icon: <Play size={64} />,
          text: 'Start',
          subtext: 'Click to begin the test'
        };
      case 'waiting':
        return {
          bg: 'bg-red-500 hover:bg-red-600',
          icon: <AlertTriangle size={64} />,
          text: 'Wait...',
          subtext: 'Do not click until it turns green!'
        };
      case 'ready':
        return {
          bg: 'bg-green-500 hover:bg-green-600',
          icon: <Zap size={64} className="animate-pulse" />,
          text: 'NOW!',
          subtext: 'Click as fast as you can!'
        };
      case 'result':
        return {
          bg: 'bg-blue-500 hover:bg-blue-600',
          icon: lastResult === 'failed' ? <AlertTriangle size={64} /> : <Clock size={64} />,
          text: lastResult === 'failed' ? 'Failed!' : `${lastResult} ms`,
          subtext: lastResult === 'failed' ? 'You clicked too early.' : 'Click to try again'
        };
      default:
        return { bg: 'bg-gray-500', icon: null, text: '', subtext: '' };
    }
  };

  const btnConfig = getButtonConfig();

  return (
    <div className="max-w-7xl mx-auto space-y-8 h-full flex flex-col">
      <h2 className="text-3xl font-bold text-primary px-4 lg:px-0">Reaction Time</h2>
      
      <div className="flex flex-col lg:flex-row gap-8 flex-1 min-h-[600px] px-4 lg:px-0">
        {/* Game Button Area */}
        <div className="flex-1 flex flex-col">
          <button
            onClick={handleClick}
            className={`flex-1 rounded-[3rem] shadow-xl border-4 border-black/10 transition-colors duration-150 flex flex-col items-center justify-center text-white space-y-6 min-h-[400px] lg:min-h-0 ${btnConfig.bg}`}
          >
            {btnConfig.icon}
            <div className="text-center">
              <h3 className="text-6xl font-black tracking-wider uppercase mb-2">{btnConfig.text}</h3>
              <p className="text-2xl font-medium text-white/80">{btnConfig.subtext}</p>
            </div>
          </button>
        </div>

        {/* Data Area */}
        <div className="w-full lg:w-[450px] bg-white rounded-[3rem] shadow-xl border border-gray-100 p-8 flex flex-col h-[600px] lg:h-auto">
          
          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-4 mb-8 shrink-0">
            <div className="bg-gray-50 rounded-2xl p-4 text-center shadow-sm border border-gray-100">
              <p className="text-sm text-gray-500 font-bold mb-1">Average</p>
              <p className="text-xl font-black text-text">{average ? `${average}ms` : '-'}</p>
            </div>
            <div className="bg-green-50 rounded-2xl p-4 text-center shadow-sm border border-green-100">
              <p className="text-sm text-green-600 font-bold mb-1">Best</p>
              <p className="text-xl font-black text-green-700">{best ? `${best}ms` : '-'}</p>
            </div>
            <div className="bg-red-50 rounded-2xl p-4 text-center shadow-sm border border-red-100">
              <p className="text-sm text-red-600 font-bold mb-1">Worst</p>
              <p className="text-xl font-black text-red-700">{worst ? `${worst}ms` : '-'}</p>
            </div>
          </div>

          {/* Graph */}
          <div className="h-[200px] mb-8 w-full shrink-0">
            <h3 className="text-sm font-bold text-gray-400 mb-4 uppercase tracking-wider">Performance Trend</h3>
            {chartData.length > 1 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" hide />
                  <YAxis domain={['auto', 'auto']} width={40} tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value) => [`${value} ms`, 'Reaction Time']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="ms" 
                    stroke="#3b82f6" 
                    strokeWidth={3}
                    dot={{ fill: '#3b82f6', strokeWidth: 2 }}
                    activeDot={{ r: 6 }}
                    animationDuration={500}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400 italic bg-gray-50 rounded-2xl border border-gray-100">
                Need at least 2 valid attempts to graph
              </div>
            )}
          </div>

          {/* Raw Log */}
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex justify-between items-center mb-4 shrink-0">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Raw Log</h3>
              <button 
                onClick={() => setHistory([])}
                className="text-sm text-red-500 hover:bg-red-50 px-3 py-1 rounded-full font-bold transition-colors"
                disabled={history.length === 0}
              >
                Clear
              </button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 pr-2">
              {history.length === 0 ? (
                <div className="h-full flex items-center justify-center text-gray-400 italic">
                  No attempts recorded
                </div>
              ) : (
                [...history].reverse().map((h) => (
                  <div key={h.attempt} className={`flex justify-between items-center p-4 rounded-xl border animate-in slide-in-from-right-4 duration-300 ${
                    h.failed ? 'bg-red-50 border-red-100' : 'bg-gray-50 border-gray-100'
                  }`}>
                    <span className="font-bold text-gray-500">Attempt {h.attempt}</span>
                    <span className={`font-black text-lg ${h.failed ? 'text-red-500' : 'text-text'}`}>
                      {h.failed ? 'FAILED' : `${h.ms} ms`}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
