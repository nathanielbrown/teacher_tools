import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Info, Check, X, Maximize2, Minimize2, Settings2, RotateCcw, HelpCircle } from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';
import { useHeader } from '../../contexts/HeaderContext';
import { tools } from '../../data/tools';
import { useIntl } from 'react-intl';

export const ToolHeader = ({
  title,
  icon: Icon,
  children
}) => {
  const { settings } = useSettings();
  const {
    isFullscreen, setIsFullscreen,
    hasConfig, isConfigOpen, onConfigToggle, onReset,
    activeOverlay, setActiveOverlay
  } = useHeader();
  const intl = useIntl();
  const isEarlyYears = settings.theme === 'early-years';

  // Find tool details from data
  const toolData = tools.find(t => t.name === title || t.id === title.toLowerCase().replace(/\s+/g, ''));
  const toolEmoji = toolData?.emoji;
  const toolColor = toolData?.color || '#6366f1';
  
  // Translate title if it matches a tool ID
  const displayTitle = toolData 
    ? intl.formatMessage({ id: `tool.${toolData.id}.name`, defaultMessage: title })
    : title;

  const toggleOverlay = (type) => {
    setActiveOverlay(prev => prev === type ? null : type);
  };

  return (
    <div className="max-w-7xl mx-auto w-full glass-card rounded-[3rem] px-3 py-1.5 md:px-6 md:py-3 mb-4 flex flex-col md:flex-row items-center justify-between gap-2 md:gap-4 relative z-30 group">
      {/* Decorative background element clipped to card bounds */}
      <div className="absolute inset-0 overflow-hidden rounded-[3rem] pointer-events-none">
        <div
          className="absolute -top-10 -right-10 w-40 h-40 rounded-[3rem] blur-[80px] opacity-10 transition-colors duration-700"
          style={{ backgroundColor: toolColor }}
        />
      </div>

      <div className="flex items-center gap-5 relative z-10">
        <motion.div
          initial={{ rotate: -10, scale: 0.9 }}
          animate={{ rotate: 0, scale: 1 }}
          className="relative"
        >
          <div
            className="w-14 h-14 rounded-[1.25rem] flex items-center justify-center transform group-hover:rotate-6 transition-transform duration-500"
            style={{
              backgroundColor: `${toolColor}15`
            }}
          >
            {isEarlyYears ? (
              <span className="text-3xl filter drop-shadow-sm">{toolEmoji || '🛠️'}</span>
            ) : (
              <Icon size={32} style={{ color: toolColor }} strokeWidth={2.5} />
            )}
          </div>
        </motion.div>

        <div className="space-y-1 relative">
          <div className="flex items-center gap-3">
            <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight leading-none">
              {displayTitle}
            </h2>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 relative z-10 w-full md:w-auto">
        {children && (
          <>
            <div className="flex-1 md:flex-none flex items-center justify-end gap-3">
              {children}
            </div>
            <div className="hidden md:block h-10 w-px bg-slate-200/50" />
          </>
        )}

        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          {/* Config Button */}
          {hasConfig && (
            <button
              onClick={onConfigToggle}
              className={`p-2.5 rounded-[1rem] transition-all duration-300 ${isConfigOpen
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'
                : 'text-indigo-600 bg-indigo-50/50 hover:bg-indigo-100/80 dark:bg-indigo-900/20 dark:hover:bg-indigo-900/40'
                }`}
              title={intl.formatMessage({ id: 'header.tooltip.config', defaultMessage: 'Configuration' })}
            >
              {isEarlyYears ? <span className="text-lg">⚙️</span> : <Settings2 size={20} strokeWidth={2.5} />}
            </button>
          )}

          {/* Reset Button */}
          {onReset && (
            <button
              onClick={onReset}
              className="p-2.5 rounded-[1rem] transition-all duration-300 text-rose-600 bg-rose-50/50 hover:bg-rose-100/80 dark:bg-rose-900/20 dark:hover:bg-rose-900/40"
              title={intl.formatMessage({ id: 'header.tooltip.reset', defaultMessage: 'Reset Settings' })}
            >
              {isEarlyYears ? <span className="text-lg">🔄</span> : <RotateCcw size={20} strokeWidth={2.5} />}
            </button>
          )}

          {/* Info Button */}
          <button
            onClick={() => toggleOverlay('info')}
            className={`p-2.5 rounded-[1rem] transition-all duration-300 ${activeOverlay === 'info'
              ? 'bg-slate-800 text-white shadow-lg'
              : 'text-slate-600 bg-slate-100/50 hover:bg-slate-200/80 dark:bg-slate-800/50 dark:hover:bg-slate-800/80'
              }`}
            title={intl.formatMessage({ id: 'header.tooltip.info', defaultMessage: 'Tool Information' })}
          >
            {isEarlyYears ? <span className="text-lg">ℹ️</span> : <Info size={20} strokeWidth={2.5} />}
          </button>

          {/* Help Button */}
          <button
            onClick={() => toggleOverlay('help')}
            className={`p-2.5 rounded-[1rem] transition-all duration-300 ${activeOverlay === 'help'
              ? 'bg-slate-800 text-white shadow-lg'
              : 'text-slate-600 bg-slate-100/50 hover:bg-slate-200/80 dark:bg-slate-800/50 dark:hover:bg-slate-800/80'
              }`}
            title={intl.formatMessage({ id: 'header.tooltip.help', defaultMessage: 'Help & Usage' })}
          >
            {isEarlyYears ? <span className="text-lg">❓</span> : <HelpCircle size={20} strokeWidth={2.5} />}
          </button>

          {/* Expand Button */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className={`p-2.5 rounded-[1rem] transition-all duration-300 ${isFullscreen
              ? 'bg-slate-800 text-white shadow-lg'
              : 'text-slate-600 bg-slate-100/50 hover:bg-slate-200/80 dark:bg-slate-800/50 dark:hover:bg-slate-800/80'
              }`}
            title={isFullscreen 
              ? intl.formatMessage({ id: 'header.tooltip.fullscreen.exit', defaultMessage: 'Exit Fullscreen' }) 
              : intl.formatMessage({ id: 'header.tooltip.fullscreen.enter', defaultMessage: 'Enter Fullscreen' })}
          >
            {isEarlyYears ? (
              isFullscreen ? <span className="text-lg">↘️</span> : <span className="text-lg">↗️</span>
            ) : (
              isFullscreen ? <Minimize2 size={20} strokeWidth={2.5} /> : <Maximize2 size={20} strokeWidth={2.5} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

