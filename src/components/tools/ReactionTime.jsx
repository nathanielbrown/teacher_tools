import React, { useState, useRef, useEffect } from 'react';
import { Zap, Clock, RotateCcw, AlertTriangle, Play } from 'lucide-react';
import { LineChart } from 'chartist';
import { ToolHeader } from '../ToolHeader';
import 'chartist/dist/index.css';

export const ReactionTime = () => {
  const [status, setStatus] = useState('idle'); // 'idle', 'waiting', 'ready', 'result'
  const [startTime, setStartTime] = useState(0);
  const [lastResult, setLastResult] = useState(null); // number or 'failed'
  const [history, setHistory] = useState(() => {
    const saved = localStorage.getItem('teacherToolsReactionTime');
    return saved ? JSON.parse(saved) : [];
  });
  const timeoutRef = useRef(null);
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (chartInstance.current) chartInstance.current.detach();
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('teacherToolsReactionTime', JSON.stringify(history));
    updateChart();
  }, [history]);

  const updateChart = () => {
    const validAttempts = history.filter(h => !h.failed);
    if (validAttempts.length > 1 && chartRef.current) {
      const data = {
        labels: validAttempts.map((_, i) => i + 1),
        series: [validAttempts.map(h => h.ms)]
      };

      const options = {
        fullWidth: true,
        chartPadding: { right: 40 },
        low: 0,
        showArea: true,
        axisX: { showGrid: false, showLabel: false },
        axisY: { 
          labelInterpolationFnc: (value) => `${value}ms`,
          scaleMinSpace: 30
        }
      };

      if (!chartInstance.current) {
        chartInstance.current = new LineChart(chartRef.current, data, options);
      } else {
        chartInstance.current.update(data);
      }
    }
  };

  const handleStart = () => {
    setStatus('waiting');
    setLastResult(null);
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
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      const newHistory = [...history, { attempt: history.length + 1, ms: null, failed: true }];
      setHistory(newHistory);
      setLastResult('failed');
      setStatus('result');
    } else if (status === 'ready') {
      const endTime = Date.now();
      const reactionTime = endTime - startTime;
      const newHistory = [...history, { attempt: history.length + 1, ms: reactionTime, failed: false }];
      setHistory(newHistory);
      setLastResult(reactionTime);
      setStatus('result');
    } else if (status === 'result') {
      handleStart();
    }
  };

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

  const getButtonConfig = () => {
    switch(status) {
      case 'idle': return { bg: 'bg-blue-500 hover:bg-blue-600', icon: <Play size={64} />, text: 'Start', subtext: 'Click to begin' };
      case 'waiting': return { bg: 'bg-red-500 hover:bg-red-600', icon: <AlertTriangle size={64} />, text: 'Wait...', subtext: 'Wait for green!' };
      case 'ready': return { bg: 'bg-green-500 hover:bg-green-600', icon: <Zap size={64} className="animate-pulse" />, text: 'NOW!', subtext: 'CLICK!' };
      case 'result': return { 
        bg: 'bg-blue-500 hover:bg-blue-600', 
        icon: lastResult === 'failed' ? <AlertTriangle size={64} /> : <Clock size={64} />, 
        text: lastResult === 'failed' ? 'Early!' : `${lastResult}ms`, 
        subtext: 'Try again' 
      };
      default: return { bg: 'bg-gray-500', icon: null, text: '', subtext: '' };
    }
  };

  const btnConfig = getButtonConfig();

  return (
    <div className="w-full mx-auto space-y-8 h-full flex flex-col px-4 pt-2 pb-6">
      <ToolHeader
        title="Reaction Time"
        icon={Zap}
        description="Scientific Response Speed Testing"
        infoContent={
          <>
            <p>
              <strong className="text-white block mb-1">How it Works</strong>
              Click the button to start, then wait for it to turn green. Click as fast as you can when you see the "NOW!" signal.
            </p>
            <p>
              <strong className="text-white block mb-1">Analytics</strong>
              Track your average, best, and worst times. The line chart visualizes your consistency across multiple attempts.
            </p>
          </>
        }
      >
        <button 
          onClick={() => setHistory([])}
          className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-red-50 hover:text-red-600 transition-all active:scale-95 disabled:opacity-50"
          disabled={history.length === 0}
          title="Reset All History"
        >
          <RotateCcw size={20} />
        </button>
      </ToolHeader>
      
      <div className="flex flex-col lg:flex-row gap-8 flex-1 min-h-[600px]">
        <div className="flex-1 flex flex-col">
          <button
            onClick={handleClick}
            className={`flex-1 rounded-[3rem] shadow-2xl border-8 border-white transition-all duration-150 flex flex-col items-center justify-center text-white space-y-6 min-h-[400px] lg:min-h-0 ${btnConfig.bg}`}
          >
            {btnConfig.icon}
            <div className="text-center">
              <h3 className="text-7xl font-black tracking-tighter uppercase mb-2">{btnConfig.text}</h3>
              <p className="text-2xl font-bold text-white/60 tracking-wide">{btnConfig.subtext}</p>
            </div>
          </button>
        </div>

        <div className="w-full lg:w-[450px] bg-white rounded-[3.5rem] shadow-2xl border border-slate-100 p-10 flex flex-col h-[650px] lg:h-auto">
          <div className="grid grid-cols-3 gap-4 mb-10 shrink-0">
            <div className="bg-slate-50 rounded-3xl p-4 text-center border border-slate-100 shadow-sm">
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Avg</p>
              <p className="text-lg font-black text-slate-800">{average ? `${average}ms` : '-'}</p>
            </div>
            <div className="bg-emerald-50 rounded-3xl p-4 text-center border border-emerald-100 shadow-sm">
              <p className="text-[10px] text-emerald-600 font-black uppercase tracking-widest mb-1">Best</p>
              <p className="text-lg font-black text-emerald-700">{best ? `${best}ms` : '-'}</p>
            </div>
            <div className="bg-rose-50 rounded-3xl p-4 text-center border border-rose-100 shadow-sm">
              <p className="text-[10px] text-rose-600 font-black uppercase tracking-widest mb-1">Worst</p>
              <p className="text-lg font-black text-rose-700">{worst ? `${worst}ms` : '-'}</p>
            </div>
          </div>

          <div className="mb-10 shrink-0">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Performance</h3>
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            </div>
            <div className="h-[200px] w-full bg-slate-50 rounded-[2rem] border border-slate-100 p-4 relative overflow-hidden">
               {validAttempts.length > 1 ? (
                 <div ref={chartRef} className="ct-chart h-full w-full custom-chartist" />
               ) : (
                 <div className="h-full flex items-center justify-center text-slate-300 text-xs font-bold uppercase tracking-widest italic">
                   Need 2 attempts
                 </div>
               )}
            </div>
          </div>

          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex justify-between items-center mb-6 shrink-0">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Recent Trials</h3>
              <button 
                onClick={() => setHistory([])}
                className="text-[10px] font-black text-rose-500 hover:bg-rose-50 px-4 py-2 rounded-full uppercase tracking-widest transition-all"
                disabled={history.length === 0}
              >
                Reset Log
              </button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
              {history.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-300 italic text-sm">
                  Waiting for data...
                </div>
              ) : (
                [...history].reverse().map((h) => (
                  <div key={h.attempt} className={`flex justify-between items-center p-5 rounded-3xl border transition-all ${
                    h.failed ? 'bg-rose-50 border-rose-100 scale-95 opacity-80' : 'bg-slate-50 border-slate-100'
                  }`}>
                    <span className="font-bold text-slate-400 text-xs">Trial #{h.attempt}</span>
                    <span className={`font-black text-xl ${h.failed ? 'text-rose-500' : 'text-slate-800'}`}>
                      {h.failed ? 'MISS' : `${h.ms} ms`}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .ct-series-a .ct-line { stroke: #3b82f6; stroke-width: 4px; }
        .ct-series-a .ct-point { stroke: #3b82f6; stroke-width: 10px; stroke-linecap: round; }
        .ct-series-a .ct-area { fill: #3b82f6; fill-opacity: 0.1; }
        .ct-grid { stroke: rgba(0,0,0,0.05); stroke-dasharray: 0; }
        .ct-label { color: #94a3b8; font-weight: 700; font-size: 10px; }
      `}} />
    </div>
  );
};
