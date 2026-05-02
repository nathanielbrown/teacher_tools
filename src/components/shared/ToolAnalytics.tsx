import React, { useRef, useEffect } from 'react';
import { BarChart3, Download, RotateCcw } from 'lucide-react';
import { BarChart } from 'chartist';
import 'chartist/dist/index.css';

export const ToolAnalytics = ({
  title = "Analytics",
  history,
  onReset,
  onDownload,
  chartData,
  chartOptions,
  historyTitle = "History",
  historyItemLabel = "items",
  renderHistoryItem,
  historyContainerClass = "flex flex-wrap gap-2 px-1"
}) => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (chartRef.current && chartData) {
      if (!chartInstance.current) {
        chartInstance.current = new BarChart(chartRef.current, chartData, chartOptions);
      } else {
        chartInstance.current.update(chartData, chartOptions, true);
      }
    }
  }, [chartData, chartOptions]);

  return (
    <div className="bg-slate-50/80 backdrop-blur-xl rounded-[3rem] border-4 border-white flex-1 flex flex-col overflow-hidden italic">
      <div className="bg-white/80 backdrop-blur-sm px-8 py-6 flex justify-between items-center shrink-0 border-b-4 border-white">
        <div className="flex items-center gap-2">
          <BarChart3 className="text-indigo-400" size={16} />
          <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-900 mb-0 leading-none">{title}</h4>
        </div>
        <div className="flex gap-2">
          {onReset && (
            <button
              onClick={onReset}
              disabled={history.length === 0}
              className="w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-rose-500 transition-all active:scale-90 disabled:opacity-20"
              title="Reset Data"
            >
              <RotateCcw size={14} />
            </button>
          )}
          {onDownload && (
            <button
              onClick={onDownload}
              disabled={history.length === 0}
              className="w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-indigo-500 transition-all active:scale-90 disabled:opacity-20"
              title="Download CSV"
            >
              <Download size={14} />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-8">
        <div className="relative mt-2">
          <div ref={chartRef} className="ct-chart" />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between text-[10px] font-black text-slate-400 uppercase px-2">
            <span>{historyTitle}</span>
            <span className="opacity-50">{history.length} {historyItemLabel}</span>
          </div>
          <div className={historyContainerClass}>
            {history.slice().reverse().map((item, index) => renderHistoryItem(item, index, history.length))}
          </div>
        </div>
      </div>
    </div>
  );
};
