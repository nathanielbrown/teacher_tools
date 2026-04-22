import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cloud, Type, Trash2, RefreshCw, Download, Settings2, Sparkles, Wand2 } from 'lucide-react';
import { WordCloud as ReactWordCloud } from '@isoterik/react-word-cloud';
import { useSettings } from '../../contexts/SettingsContext';

const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the', 'to', 'was', 'were', 'will', 'with', 'i', 'you', 'we', 'they', 'our', 'my', 'your', 'his', 'her', 'this', 'but', 'not', 'or', 'so', 'can', 'do', 'if'
]);

const COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#10b981', '#3b82f6', '#6366f1', '#8b5cf6', '#d946ef', '#f43f5e'
];

export const WordCloud = () => {
  const [inputText, setInputText] = useState("");
  const [view, setView] = useState('input'); // input, cloud
  const [filterStopWords, setFilterStopWords] = useState(true);
  const [rotation, setRotation] = useState(true);
  const { settings } = useSettings();
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (view === 'cloud' && containerRef.current) {
      const updateDimensions = () => {
        if (containerRef.current) {
          setDimensions({
            width: containerRef.current.offsetWidth,
            height: containerRef.current.offsetHeight
          });
        }
      };

      updateDimensions();
      window.addEventListener('resize', updateDimensions);
      return () => window.removeEventListener('resize', updateDimensions);
    }
  }, [view]);

  const wordData = useMemo(() => {
    if (!inputText) return [];
    
    // Clean and split text
    const words = inputText
      .toLowerCase()
      .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "")
      .split(/\s+/)
      .filter(w => w.length > 2);

    // Count frequencies
    const counts = {};
    words.forEach(w => {
      if (filterStopWords && STOP_WORDS.has(w)) return;
      counts[w] = (counts[w] || 0) + 1;
    });

    // Convert to array and sort
    return Object.entries(counts)
      .map(([text, value]) => ({
        text,
        value
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 50); // Limit to top 50 words for performance
  }, [inputText, filterStopWords]);

  const handleGenerate = () => {
    if (inputText.trim()) {
      setView('cloud');
    }
  };

  const handleClear = () => {
    setInputText("");
    setView('input');
    setDimensions({ width: 0, height: 0 });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 h-full flex flex-col gap-8">
      {/* Header */}
      <div className="bg-white p-8 rounded-[2.5rem] border-2 border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-cyan-50 rounded-2xl text-cyan-600">
              <Cloud size={32} />
            </div>
            <h2 className="text-4xl font-black text-slate-800 tracking-tight">Word Cloud</h2>
          </div>
          <p className="text-slate-400 font-medium pl-1">Visualize text frequency and key themes instantly.</p>
        </div>

        {view === 'cloud' && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => setView('input')}
              className="flex items-center gap-2 px-6 py-3 bg-slate-100 text-slate-600 rounded-2xl font-black hover:bg-slate-200 transition-all active:scale-95"
            >
              <Type size={20} />
              EDIT TEXT
            </button>
            <button
              onClick={handleClear}
              className="p-3 bg-red-50 text-red-400 rounded-2xl hover:text-red-600 transition-all"
            >
              <Trash2 size={24} />
            </button>
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        {view === 'input' ? (
          <motion.div
            key="input"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex-1 flex flex-col gap-6"
          >
            <div className="flex-1 relative group">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Paste your text here... (e.g. a story, an article, or a list of words)"
                className="w-full h-full min-h-[400px] p-10 bg-white border-4 border-slate-200 rounded-[3rem] text-xl font-medium text-slate-700 placeholder:text-slate-300 focus:border-cyan-500 focus:ring-0 transition-all outline-none resize-none shadow-inner"
              />
              <div className="absolute top-8 right-8 flex gap-2">
                <span className="px-3 py-1 bg-slate-100 text-slate-400 rounded-lg text-xs font-black uppercase tracking-widest">
                  {inputText.length} chars
                </span>
              </div>
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] border-2 border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="flex items-center gap-8">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className={`w-12 h-6 rounded-full p-1 transition-all ${filterStopWords ? 'bg-cyan-500' : 'bg-slate-200'}`}>
                    <div 
                      className="w-4 h-4 bg-white rounded-full shadow-sm transition-all"
                      style={{ transform: filterStopWords ? 'translateX(24px)' : 'translateX(0)' }}
                    />
                  </div>
                  <input type="checkbox" className="hidden" checked={filterStopWords} onChange={() => setFilterStopWords(!filterStopWords)} />
                  <div className="flex flex-col">
                    <span className="text-sm font-black text-slate-700 uppercase tracking-wider">Filter Stop Words</span>
                    <span className="text-xs text-slate-400">Ignore "the", "and", "a", etc.</span>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className={`w-12 h-6 rounded-full p-1 transition-all ${rotation ? 'bg-cyan-500' : 'bg-slate-200'}`}>
                    <div 
                      className="w-4 h-4 bg-white rounded-full shadow-sm transition-all"
                      style={{ transform: rotation ? 'translateX(24px)' : 'translateX(0)' }}
                    />
                  </div>
                  <input type="checkbox" className="hidden" checked={rotation} onChange={() => setRotation(!rotation)} />
                  <div className="flex flex-col">
                    <span className="text-sm font-black text-slate-700 uppercase tracking-wider">Random Rotation</span>
                    <span className="text-xs text-slate-400">Add vertical words</span>
                  </div>
                </label>
              </div>

              <button
                onClick={handleGenerate}
                disabled={!inputText.trim()}
                className="group flex items-center gap-4 px-12 py-6 bg-cyan-600 text-white rounded-[2rem] text-2xl font-black shadow-xl shadow-cyan-100 hover:bg-cyan-700 hover:scale-105 transition-all active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
              >
                <Wand2 size={28} />
                GENERATE CLOUD
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="cloud"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 bg-white rounded-[4rem] border-8 border-slate-50 shadow-2xl relative overflow-hidden flex flex-col"
          >
            {/* Cloud Canvas */}
            <div ref={containerRef} className="flex-1 relative p-12 min-h-[400px]">
              {wordData.length > 0 && dimensions.width > 0 && (
                <ReactWordCloud
                  words={wordData}
                  width={dimensions.width - 96} // Account for p-12
                  height={dimensions.height - 96} // Account for p-12
                  fontFamily="Inter, system-ui, sans-serif"
                  fontWeight="900"
                  fontStyle="normal"
                  rotations={rotation ? 2 : 0}
                  rotationAngles={[0, 90]}
                  fontSize={(word) => Math.sqrt(word.value) * 25}
                  spiral="archimedean"
                  padding={2}
                  colors={COLORS}
                />
              )}
            </div>

            {/* Bottom Controls */}
            <div className="bg-slate-50/80 backdrop-blur-md p-8 flex items-center justify-between border-t-2 border-slate-100">
              <div className="flex items-center gap-6">
                <div className="flex flex-col">
                  <span className="text-xs font-black uppercase tracking-widest text-slate-400">Unique Words</span>
                  <span className="text-2xl font-black text-slate-800">{wordData.length}</span>
                </div>
                <div className="w-1 h-8 bg-slate-200 rounded-full" />
                <div className="flex flex-col">
                  <span className="text-xs font-black uppercase tracking-widest text-slate-400">Top Word</span>
                  <span className="text-2xl font-black text-cyan-600">{wordData[0]?.text || "-"}</span>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setView('cloud')} // Trigger re-memo
                  className="flex items-center gap-2 px-8 py-4 bg-white text-slate-700 rounded-2xl font-black shadow-sm border-2 border-slate-200 hover:bg-slate-50 transition-all active:scale-95"
                >
                  <RefreshCw size={20} />
                  REGENERATE
                </button>
              </div>
            </div>

            {/* Empty State Overlay */}
            {wordData.length === 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-slate-300">
                <Cloud size={80} strokeWidth={1} />
                <p className="font-black uppercase tracking-widest">No words found</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-center gap-8 py-4 opacity-40">
        <div className="flex items-center gap-2 text-xs font-black text-slate-500 uppercase tracking-widest">
          <Settings2 size={14} /> Theme: {settings.theme}
        </div>
        <div className="w-1 h-1 bg-slate-300 rounded-full" />
        <div className="flex items-center gap-2 text-xs font-black text-slate-500 uppercase tracking-widest">
          <Sparkles size={14} /> Magic Layout: Enabled
        </div>
      </div>
    </div>
  );
};
