import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Palette, RefreshCw, Copy, Check } from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';
import { ToolHeader } from '../ToolHeader';
import { audioEngine } from '../../utils/audio';

const HTML_COLORS = [
  { name: 'AliceBlue', rgb: 'rgb(240, 248, 255)' },
  { name: 'AntiqueWhite', rgb: 'rgb(250, 235, 215)' },
  { name: 'Aqua', rgb: 'rgb(0, 255, 255)' },
  { name: 'Aquamarine', rgb: 'rgb(127, 255, 212)' },
  { name: 'Azure', rgb: 'rgb(240, 255, 255)' },
  { name: 'Beige', rgb: 'rgb(245, 245, 220)' },
  { name: 'Bisque', rgb: 'rgb(255, 228, 196)' },
  { name: 'Black', rgb: 'rgb(0, 0, 0)' },
  { name: 'BlanchedAlmond', rgb: 'rgb(255, 235, 205)' },
  { name: 'Blue', rgb: 'rgb(0, 0, 255)' },
  { name: 'BlueViolet', rgb: 'rgb(138, 43, 226)' },
  { name: 'Brown', rgb: 'rgb(165, 42, 42)' },
  { name: 'BurlyWood', rgb: 'rgb(222, 184, 135)' },
  { name: 'CadetBlue', rgb: 'rgb(95, 158, 160)' },
  { name: 'Chartreuse', rgb: 'rgb(127, 255, 0)' },
  { name: 'Chocolate', rgb: 'rgb(210, 105, 30)' },
  { name: 'Coral', rgb: 'rgb(255, 127, 80)' },
  { name: 'CornflowerBlue', rgb: 'rgb(100, 149, 237)' },
  { name: 'Cornsilk', rgb: 'rgb(255, 248, 220)' },
  { name: 'Crimson', rgb: 'rgb(220, 20, 60)' },
  { name: 'Cyan', rgb: 'rgb(0, 255, 255)' },
  { name: 'DarkBlue', rgb: 'rgb(0, 0, 139)' },
  { name: 'DarkCyan', rgb: 'rgb(0, 139, 139)' },
  { name: 'DarkGoldenRod', rgb: 'rgb(184, 134, 11)' },
  { name: 'DarkGray', rgb: 'rgb(169, 169, 169)' },
  { name: 'DarkGreen', rgb: 'rgb(0, 100, 0)' },
  { name: 'DarkKhaki', rgb: 'rgb(189, 183, 107)' },
  { name: 'DarkMagenta', rgb: 'rgb(139, 0, 139)' },
  { name: 'DarkOliveGreen', rgb: 'rgb(85, 107, 47)' },
  { name: 'DarkOrange', rgb: 'rgb(255, 140, 0)' },
  { name: 'DarkOrchid', rgb: 'rgb(153, 50, 204)' },
  { name: 'DarkRed', rgb: 'rgb(139, 0, 0)' },
  { name: 'DarkSalmon', rgb: 'rgb(233, 150, 122)' },
  { name: 'DarkSeaGreen', rgb: 'rgb(143, 188, 143)' },
  { name: 'DarkSlateBlue', rgb: 'rgb(72, 61, 139)' },
  { name: 'DarkSlateGray', rgb: 'rgb(47, 79, 79)' },
  { name: 'DarkTurquoise', rgb: 'rgb(0, 206, 209)' },
  { name: 'DarkViolet', rgb: 'rgb(148, 0, 211)' },
  { name: 'DeepPink', rgb: 'rgb(255, 20, 147)' },
  { name: 'DeepSkyBlue', rgb: 'rgb(0, 191, 255)' },
  { name: 'DimGray', rgb: 'rgb(105, 105, 105)' },
  { name: 'DodgerBlue', rgb: 'rgb(30, 144, 255)' },
  { name: 'FireBrick', rgb: 'rgb(178, 34, 34)' },
  { name: 'FloralWhite', rgb: 'rgb(255, 250, 240)' },
  { name: 'ForestGreen', rgb: 'rgb(34, 139, 34)' },
  { name: 'Fuchsia', rgb: 'rgb(255, 0, 255)' },
  { name: 'Gainsboro', rgb: 'rgb(220, 220, 220)' },
  { name: 'GhostWhite', rgb: 'rgb(248, 248, 255)' },
  { name: 'Gold', rgb: 'rgb(255, 215, 0)' },
  { name: 'GoldenRod', rgb: 'rgb(218, 165, 32)' },
  { name: 'Gray', rgb: 'rgb(128, 128, 128)' },
  { name: 'Green', rgb: 'rgb(0, 128, 0)' },
  { name: 'GreenYellow', rgb: 'rgb(173, 255, 47)' },
  { name: 'HoneyDew', rgb: 'rgb(240, 255, 240)' },
  { name: 'HotPink', rgb: 'rgb(255, 105, 180)' },
  { name: 'IndianRed', rgb: 'rgb(205, 92, 92)' },
  { name: 'Indigo', rgb: 'rgb(75, 0, 130)' },
  { name: 'Ivory', rgb: 'rgb(255, 255, 240)' },
  { name: 'Khaki', rgb: 'rgb(240, 230, 140)' },
  { name: 'Lavender', rgb: 'rgb(230, 230, 250)' },
  { name: 'LavenderBlush', rgb: 'rgb(255, 240, 245)' },
  { name: 'LawnGreen', rgb: 'rgb(124, 252, 0)' },
  { name: 'LemonChiffon', rgb: 'rgb(255, 250, 205)' },
  { name: 'LightBlue', rgb: 'rgb(173, 216, 230)' },
  { name: 'LightCoral', rgb: 'rgb(240, 128, 128)' },
  { name: 'LightCyan', rgb: 'rgb(224, 255, 255)' },
  { name: 'LightGoldenRodYellow', rgb: 'rgb(250, 250, 210)' },
  { name: 'LightGray', rgb: 'rgb(211, 211, 211)' },
  { name: 'LightGreen', rgb: 'rgb(144, 238, 144)' },
  { name: 'LightPink', rgb: 'rgb(255, 182, 193)' },
  { name: 'LightSalmon', rgb: 'rgb(255, 160, 122)' },
  { name: 'LightSeaGreen', rgb: 'rgb(32, 178, 170)' },
  { name: 'LightSkyBlue', rgb: 'rgb(135, 206, 250)' },
  { name: 'LightSlateGray', rgb: 'rgb(119, 136, 153)' },
  { name: 'LightSteelBlue', rgb: 'rgb(176, 196, 222)' },
  { name: 'LightYellow', rgb: 'rgb(255, 255, 224)' },
  { name: 'Lime', rgb: 'rgb(0, 255, 0)' },
  { name: 'LimeGreen', rgb: 'rgb(50, 205, 50)' },
  { name: 'Linen', rgb: 'rgb(250, 240, 230)' },
  { name: 'Magenta', rgb: 'rgb(255, 0, 255)' },
  { name: 'Maroon', rgb: 'rgb(128, 0, 0)' },
  { name: 'MediumAquaMarine', rgb: 'rgb(102, 205, 170)' },
  { name: 'MediumBlue', rgb: 'rgb(0, 0, 205)' },
  { name: 'MediumOrchid', rgb: 'rgb(186, 85, 211)' },
  { name: 'MediumPurple', rgb: 'rgb(147, 112, 219)' },
  { name: 'MediumSeaGreen', rgb: 'rgb(60, 179, 113)' },
  { name: 'MediumSlateBlue', rgb: 'rgb(123, 104, 238)' },
  { name: 'MediumSpringGreen', rgb: 'rgb(0, 250, 154)' },
  { name: 'MediumTurquoise', rgb: 'rgb(72, 209, 204)' },
  { name: 'MediumVioletRed', rgb: 'rgb(199, 21, 133)' },
  { name: 'MidnightBlue', rgb: 'rgb(25, 25, 112)' },
  { name: 'MintCream', rgb: 'rgb(245, 255, 250)' },
  { name: 'MistyRose', rgb: 'rgb(255, 228, 225)' },
  { name: 'Moccasin', rgb: 'rgb(255, 228, 181)' },
  { name: 'NavajoWhite', rgb: 'rgb(255, 222, 173)' },
  { name: 'Navy', rgb: 'rgb(0, 0, 128)' },
  { name: 'OldLace', rgb: 'rgb(253, 245, 230)' },
  { name: 'Olive', rgb: 'rgb(128, 128, 0)' },
  { name: 'OliveDrab', rgb: 'rgb(107, 142, 35)' },
  { name: 'Orange', rgb: 'rgb(255, 165, 0)' }
];

const getRandomColors = (count) => {
  const shuffled = [...HTML_COLORS].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

const rgbToHex = (rgb) => {
  const match = rgb.match(/\d+/g);
  if (!match) return '#000000';
  const [r, g, b] = match.map(Number);
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
};

export const ColourPicker = () => {
  const [gridColors, setGridColors] = useState(() => getRandomColors(30));
  const [selectedColor, setSelectedColor] = useState(null);
  const [isPicking, setIsPicking] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [copied, setCopied] = useState(null);
  const [hasPicked, setHasPicked] = useState(false);
  const { settings } = useSettings();

  const pickColor = () => {
    if (isPicking) return;
    
    // Generate new colors if it's not the first time
    if (hasPicked) {
      setGridColors(getRandomColors(30));
    }
    setHasPicked(true);
    
    setIsPicking(true);
    setSelectedColor(null);
    setCopied(null);

    let iterations = 0;
    const maxIterations = 25;

    const animate = () => {
      const idx = Math.floor(Math.random() * gridColors.length);
      setActiveIndex(idx);
      audioEngine.playTick(settings.soundTheme);

      iterations++;
      if (iterations < maxIterations) {
        setTimeout(animate, 50 + (iterations * 5));
      } else {
        const finalIdx = Math.floor(Math.random() * gridColors.length);
        const finalColor = gridColors[finalIdx];
        setSelectedColor(finalColor);
        setActiveIndex(finalIdx);
        setIsPicking(false);
        audioEngine.playAlarm(settings.soundTheme);
      }
    };

    animate();
  };

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="w-full mx-auto px-4 pt-2 pb-8 h-full flex flex-col gap-4 relative overflow-x-hidden">
      <ToolHeader
        title="Colour Picker"
        icon={Palette}
        description="Random HTML Colour Selection"
        infoContent={
          <p>Instantly select a random colour from a collection of standard HTML colours. Great for picking team colours, UI design inspiration, or classroom games.</p>
        }
      />

      {/* Main Content Area - justify-start to prevent jumping */}
      <div className="flex-1 flex flex-col items-center justify-center py-4 gap-6">
        {/* Interactive Grid */}
        <div className="grid grid-cols-5 md:grid-cols-10 gap-3 p-4 bg-white rounded-[2rem] shadow-xl border border-slate-100 w-full max-w-3xl">
          {gridColors.map((color, i) => (
            <motion.div
              key={`${color.name}-${i}`}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ 
                scale: activeIndex === i ? 1.4 : 1,
                opacity: (isPicking && activeIndex !== i) ? 0.3 : 1,
                zIndex: activeIndex === i ? 10 : 1
              }}
              whileHover={{ scale: isPicking ? 1 : 1.1 }}
              className={`w-full aspect-square rounded-xl shadow-sm transition-all duration-200 cursor-pointer ${
                activeIndex === i ? 'ring-4 ring-primary ring-offset-4 shadow-xl' : ''
              }`}
              style={{ backgroundColor: color.rgb }}
              title={color.name}
              onClick={() => { if(!isPicking) { setSelectedColor(color); setActiveIndex(i); } }}
            />
          ))}
        </div>

        {/* Action Button & Info */}
        <div className="flex flex-col items-center gap-6 w-full max-w-3xl">
          <button
            onClick={pickColor}
            disabled={isPicking}
            className="flex items-center gap-4 px-10 py-4 bg-slate-900 text-white rounded-2xl font-black text-lg uppercase tracking-[0.2em] hover:bg-black transition-all active:scale-95 shadow-2xl disabled:opacity-50 group border-4 border-white"
          >
            <RefreshCw className={`w-6 h-6 ${isPicking ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
            {isPicking ? 'Picking...' : 'Pick Colour'}
          </button>

          {/* Reserved space for cards to prevent layout shift */}
          <div className="min-h-[120px] w-full">
            <AnimatePresence mode="wait">
              {selectedColor && !isPicking && (
                <motion.div
                  key={selectedColor.name}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -20, opacity: 0 }}
                  className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full"
                >
                  {/* Name Card */}
                  <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center justify-center gap-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Colour Name</span>
                    <span className="text-2xl font-black text-slate-800 text-center uppercase tracking-tighter break-words w-full">
                      {selectedColor.name}
                    </span>
                  </div>

                  {/* HEX Card */}
                  <button
                    onClick={() => copyToClipboard(rgbToHex(selectedColor.rgb), 'hex')}
                    className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center justify-center gap-1 hover:border-primary/30 transition-all relative group"
                  >
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">HEX Code</span>
                    <span className="text-2xl font-mono font-black text-slate-700">
                      {rgbToHex(selectedColor.rgb)}
                    </span>
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {copied === 'hex' ? <Check className="text-green-500 w-4 h-4" /> : <Copy className="text-slate-300 w-4 h-4" />}
                    </div>
                  </button>

                  {/* RGB Card */}
                  <button
                    onClick={() => copyToClipboard(selectedColor.rgb, 'rgb')}
                    className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center justify-center gap-1 hover:border-primary/30 transition-all relative group"
                  >
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">RGB Values</span>
                    <span className="text-sm font-mono font-black text-slate-600 text-center break-all">
                      {selectedColor.rgb}
                    </span>
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {copied === 'rgb' ? <Check className="text-green-500 w-4 h-4" /> : <Copy className="text-slate-300 w-4 h-4" />}
                    </div>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};
