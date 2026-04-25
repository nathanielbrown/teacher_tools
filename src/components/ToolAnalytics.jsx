import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
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
    <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-6">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <BarChart3 className="text-primary" size={20} />
          <h3 className="font-black text-slate-700 uppercase tracking-wider text-sm">{title}</h3>
        </div>
        <div className="flex gap-2">
          {onReset && (
            <button
              onClick={onReset}
              disabled={history.length === 0}
              className="p-2 text-slate-400 hover:text-red-500 transition-colors disabled:opacity-20"
              title="Reset Data"
            >
              <RotateCcw size={20} />
            </button>
          )}
          {onDownload && (
            <button
              onClick={onDownload}
              disabled={history.length === 0}
              className="p-2 text-slate-400 hover:text-primary transition-colors disabled:opacity-20"
              title="Download CSV"
            >
              <Download size={20} />
            </button>
          )}
        </div>
      </div>

      <div className="space-y-8">
        <div className="relative mt-2 border-b border-slate-100">
          <div ref={chartRef} className="ct-chart" />
        </div>

        <div className="max-h-64 overflow-y-auto pr-2 custom-scrollbar space-y-3">
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
