import React, { useState } from 'react';
import {
  ListOrdered,
  Download,
  Trash2,
  TimerReset,
  ChevronUp,
  ChevronDown,
  X
} from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { useIntl, FormattedMessage } from 'react-intl';

/**
 * A reusable history sidebar component with pagination, download, and clear actions.
 * Used for displaying logs, lap history, or other lists in a tool's sidebar.
 */
interface HistoryPanelProps {
  title?: React.ReactNode;
  items?: any[];
  onClear?: () => void;
  onDownload?: () => void;
  renderItem?: (item: any, index: number) => React.ReactNode;
  emptyMessage?: React.ReactNode;
  itemsPerPage?: number;
  badgeValue?: string | number;
  icon?: React.ElementType;
  listClassName?: string;
  className?: string;
  onClose?: () => void;
  reservePaginationSpace?: boolean;
  children?: React.ReactNode;
}

export const HistoryPanel = ({
  title = "History",
  items = [],
  onClear,
  onDownload,
  renderItem,
  emptyMessage = "No Data",
  itemsPerPage = 7,
  badgeValue,
  icon: Icon = ListOrdered,
  listClassName = "space-y-2",
  className = "",
  onClose,
  reservePaginationSpace = false,
  children
}: HistoryPanelProps) => {
  const intl = useIntl();
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(items.length / itemsPerPage);

  // Clamp page number to valid range during render
  const safeCurrentPage = Math.min(currentPage, Math.max(1, totalPages));
  const displayItems = items.slice((safeCurrentPage - 1) * itemsPerPage, safeCurrentPage * itemsPerPage);

  const defaultRenderItem = (item: any, index: number) => (
    <div key={item.id || index} className="p-4 bg-white rounded-2xl border-2 border-slate-50  flex flex-col gap-1">
      <span className="text-base sm:text-sm font-black text-slate-700 uppercase tracking-tight">{item.title || item.content}</span>
      {(item.subtitle || item.subContent) && (
        <span className="text-xs sm:text-[10px] font-black text-slate-300 tabular-nums">{item.subtitle || item.subContent}</span>
      )}
    </div>
  );

  const finalRenderItem = renderItem || defaultRenderItem;

  return (
    <div className={`bg-slate-50/80 backdrop-blur-xl rounded-[3rem] border-4 border-white flex-1 flex flex-col overflow-hidden italic ${className}`}>
      <div className="bg-white/80 backdrop-blur-sm px-8 py-6 flex justify-between items-center shrink-0 border-b-4 border-white">
        <div className="flex items-center gap-2">
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-slate-50 text-slate-400 lg:hidden mr-1"
            >
              <X size={16} />
            </button>
          )}
          <Icon size={16} className="text-indigo-400" />
          <h4 className="text-sm sm:text-xs font-black uppercase tracking-[0.2em] text-slate-900 mb-0 leading-none">{title}</h4>
        </div>
        <div className="flex items-center gap-2">
          {onDownload && (
            <button 
              onClick={onDownload} 
              disabled={items.length === 0} 
              className="tool-history-button" 
              title={intl.formatMessage({ id: 'shared.history.download', defaultMessage: 'Download' })}
            >
              <Download size={14} />
            </button>
          )}
          {onClear && (
            <button 
              onClick={onClear} 
              disabled={items.length === 0} 
              className="tool-history-button-danger" 
              title={intl.formatMessage({ id: 'shared.history.clear', defaultMessage: 'Clear All' })}
            >
              <Trash2 size={14} />
            </button>
          )}
          {(badgeValue !== undefined || items.length > 0) && (
            <div className="tool-history-badge ml-1">{badgeValue ?? items.length}</div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 custom-scrollbar no-scrollbar italic flex flex-col">
        {children}
        <div className="flex-1">
          <AnimatePresence initial={false} mode="popLayout">
            {items.length === 0 ? (
              <div className="h-full min-h-[80px] lg:min-h-full flex flex-col items-center justify-center py-4 lg:py-8 bg-slate-50/50 border-2 border-slate-100 border-dashed rounded-[2rem] lg:rounded-[3rem]">
                <TimerReset size={24} strokeWidth={1} className="mb-2 lg:mb-3 text-slate-200 lg:w-8 lg:h-8" />
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-300 text-center px-4 leading-relaxed">{emptyMessage}</div>
              </div>
            ) : (
              <div className={listClassName}>
                {displayItems.map((item, index) => finalRenderItem(item, (safeCurrentPage - 1) * itemsPerPage + index))}
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Pagination Controls */}
        {(totalPages > 1 || reservePaginationSpace) && (
          <div className={`flex items-center justify-center gap-4 mt-4 pt-4 border-t border-slate-100 shrink-0 ${totalPages <= 1 ? 'invisible pointer-events-none' : 'visible'}`}>
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={safeCurrentPage === 1}
              className="p-2 rounded-xl bg-white border border-slate-100 text-slate-400 disabled:opacity-30 transition-all hover:bg-slate-50"
            >
              <ChevronUp size={16} className="-rotate-90" />
            </button>
            <span className="text-xs sm:text-[10px] font-black text-slate-400 tabular-nums uppercase tracking-widest">
              <FormattedMessage 
                id="shared.history.page" 
                defaultMessage="Page {current} of {total}" 
                values={{ current: safeCurrentPage, total: Math.max(1, totalPages) }} 
              />
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={safeCurrentPage === totalPages}
              className="p-2 rounded-xl bg-white border border-slate-100 text-slate-400 disabled:opacity-30 transition-all hover:bg-slate-50"
            >
              <ChevronDown size={16} className="-rotate-90" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryPanel;
