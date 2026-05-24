import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings2, X } from 'lucide-react';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  className?: string;
  compact?: boolean;
  side?: 'left' | 'right';
}

/**
 * SettingsPanel provides a consistent sidebar for tool configurations.
 * It features a glassmorphic aesthetic and coordinates with ToolPanel for layout animations.
 */
export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  isOpen,
  onClose,
  children,
  title = "Settings",
  className = "",
  compact = false,
  side = 'left'
}) => {
  const xOffset = side === 'left' ? -50 : 50;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          layout
          initial={{ opacity: 0, x: xOffset }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: xOffset }}
          transition={{ layout: { duration: 0.5, type: "spring", bounce: 0.2 } }}
          className={`fixed inset-0 z-[100] p-4 lg:p-0 bg-slate-100/60 backdrop-blur-xl lg:bg-transparent lg:backdrop-blur-none lg:relative lg:inset-auto lg:z-20 w-full lg:w-80 h-full lg:h-full flex flex-col overflow-hidden custom-scrollbar italic ${side === 'left' ? 'lg:order-first' : 'lg:order-last'} lg:shrink-0 ${className}`}
        >
          <div className="bg-surface/80 backdrop-blur-xl rounded-[2.5rem] lg:rounded-[3rem] border-4 border-border/40 flex flex-col h-full overflow-hidden shadow-2xl lg:shadow-none">
          {/* Header */}
          <div className={`bg-surface ${compact ? 'px-4 py-3' : 'px-4 py-4 lg:px-8 lg:py-6'} flex justify-between items-center shrink-0 border-b-4 border-border/40`}>
            <div className="flex items-center gap-2">
              <Settings2 size={16} className="text-indigo-400" aria-hidden="true" />
              <h3 className="text-sm sm:text-xs font-black uppercase tracking-[0.2em] text-text leading-none">{title}</h3>
            </div>
            <button
              onClick={onClose}
              className="p-2 bg-surface border-2 border-border text-text/50 hover:text-rose-600 hover:border-rose-100 rounded-xl transition-all  active:scale-90"
              aria-label="Close Settings"
            >
              <X size={14} strokeWidth={3} aria-hidden="true" />
            </button>
          </div>

          {/* Settings Content */}
          <div className={`flex-1 overflow-y-auto ${compact ? 'p-4 space-y-4 lg:space-y-2' : 'p-4 lg:p-8 space-y-4 lg:space-y-8'} custom-scrollbar`}>
            {children}
          </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SettingsPanel;
