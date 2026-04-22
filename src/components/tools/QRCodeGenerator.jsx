import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeCanvas } from 'qrcode.react';
import { Download, Share2, Type, Link as LinkIcon, Palette, Maximize, RefreshCcw, Trash2 } from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';
import { audioEngine } from '../../utils/audio';

export const QRCodeGenerator = () => {
  const [text, setText] = useState('https://google.com');
  const [fgColor, setFgColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [size, setSize] = useState(256);
  const [includeMargin, setIncludeMargin] = useState(true);
  const [level, setLevel] = useState('L');
  const qrRef = useRef();
  const { settings } = useSettings();

  const handleDownload = () => {
    const canvas = qrRef.current.querySelector('canvas');
    if (canvas) {
      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `qrcode-${Date.now()}.png`;
      link.href = url;
      link.click();
      audioEngine.playTick(settings.soundTheme);
    }
  };

  const clearText = () => {
    setText('');
    audioEngine.playTick(settings.soundTheme);
  };

  const resetColors = () => {
    setFgColor('#000000');
    setBgColor('#ffffff');
    audioEngine.playTick(settings.soundTheme);
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8">
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        
        {/* Controls Section */}
        <div className="flex-1 w-full space-y-6 bg-white/80 backdrop-blur-md p-8 rounded-3xl shadow-xl border border-primary/10">
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xl font-bold text-primary">
              <Type size={24} />
              QR Content
            </label>
            <div className="relative">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Enter URL or text here..."
                className="w-full h-32 p-4 rounded-2xl border-2 border-primary/20 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all resize-none text-lg"
              />
              <button 
                onClick={clearText}
                className="absolute bottom-4 right-4 p-2 text-gray-400 hover:text-red-500 transition-colors"
                title="Clear content"
              >
                <Trash2 size={20} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="flex items-center gap-2 font-bold text-gray-700">
                <Palette size={20} />
                Colours
              </label>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <span className="text-xs text-gray-500 block mb-1">Foreground</span>
                  <input
                    type="color"
                    value={fgColor}
                    onChange={(e) => setFgColor(e.target.value)}
                    className="w-full h-12 rounded-lg cursor-pointer bg-transparent border-none"
                  />
                </div>
                <div className="flex-1">
                  <span className="text-xs text-gray-500 block mb-1">Background</span>
                  <input
                    type="color"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="w-full h-12 rounded-lg cursor-pointer bg-transparent border-none"
                  />
                </div>
                <button 
                  onClick={resetColors}
                  className="mt-5 p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  title="Reset Colors"
                >
                  <RefreshCcw size={18} />
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <label className="flex items-center gap-2 font-bold text-gray-700">
                <Maximize size={20} />
                Size & Quality
              </label>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="128"
                    max="512"
                    step="32"
                    value={size}
                    onChange={(e) => setSize(parseInt(e.target.value))}
                    className="flex-1 accent-primary"
                  />
                  <span className="w-16 text-center font-mono text-sm bg-gray-100 p-1 rounded">{size}px</span>
                </div>
                <div className="flex items-center gap-6">
                   <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeMargin}
                      onChange={(e) => setIncludeMargin(e.target.checked)}
                      className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <span className="text-sm font-medium">Margin</span>
                  </label>
                  <select 
                    value={level} 
                    onChange={(e) => setLevel(e.target.value)}
                    className="text-sm border rounded-lg p-1 focus:ring-2 focus:ring-primary/20 outline-none"
                  >
                    <option value="L">Low Quality</option>
                    <option value="M">Medium Quality</option>
                    <option value="Q">Quartile Quality</option>
                    <option value="H">High Quality</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Preview Section */}
        <div className="lg:w-[400px] w-full flex flex-col items-center gap-6 sticky top-8">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl border-4 border-white ring-1 ring-black/5 flex items-center justify-center min-h-[350px] w-full aspect-square overflow-hidden group">
            <motion.div 
              ref={qrRef}
              key={text + fgColor + bgColor + size + includeMargin + level}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
            >
              <QRCodeCanvas
                value={text || " "}
                size={size}
                fgColor={fgColor}
                bgColor={bgColor}
                level={level}
                includeMargin={includeMargin}
                className="max-w-full h-auto drop-shadow-sm"
              />
            </motion.div>
          </div>

          <div className="flex w-full gap-4">
            <button
              onClick={handleDownload}
              className="flex-1 flex items-center justify-center gap-3 py-4 bg-primary text-white rounded-2xl font-bold shadow-lg hover:bg-primary/90 hover:-translate-y-1 transition-all active:translate-y-0"
            >
              <Download size={24} />
              Download PNG
            </button>
          </div>

          <p className="text-sm text-gray-500 text-center flex items-center gap-2">
            <LinkIcon size={14} />
            Scan with any mobile device to preview
          </p>
        </div>
      </div>

      {/* Quick Tips */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { title: 'URLs', desc: 'Link to educational games, videos, or shared documents.', icon: '🌐' },
          { title: 'Instructions', desc: 'Convert text instructions into a QR for student devices.', icon: '📝' },
          { title: 'Customisation', desc: 'Change colours to match your classroom theme!', icon: '🎨' }
        ].map((tip, i) => (
          <div key={i} className="bg-white/40 p-6 rounded-2xl border border-white/60">
            <span className="text-3xl mb-2 block">{tip.icon}</span>
            <h4 className="font-bold text-gray-800">{tip.title}</h4>
            <p className="text-sm text-gray-600">{tip.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
