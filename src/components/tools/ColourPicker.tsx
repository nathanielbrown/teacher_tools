import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Copy, 
  Check, 
  RotateCcw, 
  Palette, 
  RefreshCw,
  Hash,
  Type
} from 'lucide-react';
import { useHeader } from '../../contexts/HeaderContext';
import { useSettings } from '../../contexts/SettingsContext';
import { audioEngine } from '../../utils/audio';
import { FormattedMessage } from 'react-intl';
import ToolPanel from '../shared/ToolPanel';

// 1. Constants
const HTML_COLORS = [
  { name: "AliceBlue", hex: "#F0F8FF" }, { name: "AntiqueWhite", hex: "#FAEBD7" }, { name: "Aqua", hex: "#00FFFF" },
  { name: "Aquamarine", hex: "#7FFFD4" }, { name: "Azure", hex: "#F0FFFF" }, { name: "Beige", hex: "#F5F5DC" },
  { name: "Bisque", hex: "#FFE4C4" }, { name: "Black", hex: "#000000" }, { name: "BlanchedAlmond", hex: "#FFEBCD" },
  { name: "Blue", hex: "#0000FF" }, { name: "BlueViolet", hex: "#8A2BE2" }, { name: "Brown", hex: "#A52A2A" },
  { name: "BurlyWood", hex: "#DEB887" }, { name: "CadetBlue", hex: "#5F9EA0" }, { name: "Chartreuse", hex: "#7FFF00" },
  { name: "Chocolate", hex: "#D2691E" }, { name: "Coral", hex: "#FF7F50" }, { name: "CornflowerBlue", hex: "#6495ED" },
  { name: "Cornsilk", hex: "#FFF8DC" }, { name: "Crimson", hex: "#DC143C" }, { name: "Cyan", hex: "#00FFFF" },
  { name: "DarkBlue", hex: "#00008B" }, { name: "DarkCyan", hex: "#008B8B" }, { name: "DarkGoldenRod", hex: "#B8860B" },
  { name: "DarkGray", hex: "#A9A9A9" }, { name: "DarkGreen", hex: "#006400" }, { name: "DarkKhaki", hex: "#BDB76B" },
  { name: "DarkMagenta", hex: "#8B008B" }, { name: "DarkOliveGreen", hex: "#556B2F" }, { name: "DarkOrange", hex: "#FF8C00" },
  { name: "DarkOrchid", hex: "#9932CC" }, { name: "DarkRed", hex: "#8B0000" }, { name: "DarkSalmon", hex: "#E9967A" },
  { name: "DarkSeaGreen", hex: "#8FBC8F" }, { name: "DarkSlateBlue", hex: "#483D8B" }, { name: "DarkSlateGray", hex: "#2F4F4F" },
  { name: "DarkTurquoise", hex: "#00CED1" }, { name: "DarkViolet", hex: "#9400D3" }, { name: "DeepPink", hex: "#FF1493" },
  { name: "DeepSkyBlue", hex: "#00BFFF" }, { name: "DimGray", hex: "#696969" }, { name: "DodgerBlue", hex: "#1E90FF" },
  { name: "FireBrick", hex: "#B22222" }, { name: "FloralWhite", hex: "#FFFAF0" }, { name: "ForestGreen", hex: "#228B22" },
  { name: "Fuchsia", hex: "#FF00FF" }, { name: "Gainsboro", hex: "#DCDCDC" }, { name: "GhostWhite", hex: "#F8F8FF" },
  { name: "Gold", hex: "#FFD700" }, { name: "GoldenRod", hex: "#DAA520" }, { name: "Gray", hex: "#808080" },
  { name: "Green", hex: "#008000" }, { name: "GreenYellow", hex: "#ADFF2F" }, { name: "HoneyDew", hex: "#F0FFF0" },
  { name: "HotPink", hex: "#FF69B4" }, { name: "IndianRed", hex: "#CD5C5C" }, { name: "Indigo", hex: "#4B0082" },
  { name: "Ivory", hex: "#FFFFF0" }, { name: "Khaki", hex: "#F0E68C" }, { name: "Lavender", hex: "#E6E6FA" },
  { name: "LavenderBlush", hex: "#FFF0F5" }, { name: "LawnGreen", hex: "#7CFC00" }, { name: "LemonChiffon", hex: "#FFFACD" },
  { name: "LightBlue", hex: "#ADD8E6" }, { name: "LightCoral", hex: "#F08080" }, { name: "LightCyan", hex: "#E0FFFF" },
  { name: "LightGoldenRodYellow", hex: "#FAFAD2" }, { name: "LightGray", hex: "#D3D3D3" }, { name: "LightGreen", hex: "#90EE90" },
  { name: "LightPink", hex: "#FFB6C1" }, { name: "LightSalmon", hex: "#FFA07A" }, { name: "LightSeaGreen", hex: "#20B2AA" },
  { name: "LightSkyBlue", hex: "#87CEFA" }, { name: "LightSlateGray", hex: "#778899" }, { name: "LightSteelBlue", hex: "#B0C4DE" },
  { name: "LightYellow", hex: "#FFFFE0" }, { name: "Lime", hex: "#00FF00" }, { name: "LimeGreen", hex: "#32CD32" },
  { name: "Linen", hex: "#FAF0E6" }, { name: "Magenta", hex: "#FF00FF" }, { name: "Maroon", hex: "#800000" },
  { name: "MediumAquaMarine", hex: "#66CDAA" }, { name: "MediumBlue", hex: "#0000CD" }, { name: "MediumOrchid", hex: "#BA55D3" },
  { name: "MediumPurple", hex: "#9370DB" }, { name: "MediumSeaGreen", hex: "#3CB371" }, { name: "MediumSlateBlue", hex: "#7B68EE" },
  { name: "MediumSpringGreen", hex: "#00FA9A" }, { name: "MediumTurquoise", hex: "#48D1CC" }, { name: "MediumVioletRed", hex: "#C71585" },
  { name: "MidnightBlue", hex: "#191970" }, { name: "MintCream", hex: "#F5FFFA" }, { name: "MistyRose", hex: "#FFE4E1" },
  { name: "Moccasin", hex: "#FFE4B5" }, { name: "NavajoWhite", hex: "#FFDEAD" }, { name: "Navy", hex: "#000080" },
  { name: "OldLace", hex: "#FDF5E6" }, { name: "Olive", hex: "#808000" }, { name: "OliveDrab", hex: "#6B8E23" },
  { name: "Orange", hex: "#FFA500" }, { name: "OrangeRed", hex: "#FF4500" }, { name: "Orchid", hex: "#DA70D6" },
  { name: "PaleGoldenRod", hex: "#EEE8AA" }, { name: "PaleGreen", hex: "#98FB98" }, { name: "PaleTurquoise", hex: "#AFEEEE" },
  { name: "PaleVioletRed", hex: "#DB7093" }, { name: "PapayaWhip", hex: "#FFEFD5" }, { name: "PeachPuff", hex: "#FFDAB9" },
  { name: "Peru", hex: "#CD853F" }, { name: "Pink", hex: "#FFC0CB" }, { name: "Plum", hex: "#DDA0DD" },
  { name: "PowderBlue", hex: "#B0E0E6" }, { name: "Purple", hex: "#800080" }, { name: "RebeccaPurple", hex: "#663399" },
  { name: "Red", hex: "#FF0000" }, { name: "RosyBrown", hex: "#BC8F8F" }, { name: "RoyalBlue", hex: "#4169E1" },
  { name: "SaddleBrown", hex: "#8B4513" }, { name: "Salmon", hex: "#FA8072" }, { name: "SandyBrown", hex: "#F4A460" },
  { name: "SeaGreen", hex: "#2E8B57" }, { name: "SeaShell", hex: "#FFF5EE" }, { name: "Sienna", hex: "#A0522D" },
  { name: "Silver", hex: "#C0C0C0" }, { name: "SkyBlue", hex: "#87CEEB" }, { name: "SlateBlue", hex: "#6A5ACD" },
  { name: "SlateGray", hex: "#708090" }, { name: "Snow", hex: "#FFFAFA" }, { name: "SpringGreen", hex: "#00FF7F" },
  { name: "SteelBlue", hex: "#4682B4" }, { name: "Tan", hex: "#D2B48C" }, { name: "Teal", hex: "#008080" },
  { name: "Thistle", hex: "#D8BFD8" }, { name: "Tomato", hex: "#FF6347" }, { name: "Turquoise", hex: "#40E0D0" },
  { name: "Violet", hex: "#EE82EE" }, { name: "Wheat", hex: "#F5DEB3" }, { name: "White", hex: "#FFFFFF" },
  { name: "WhiteSmoke", hex: "#F5F5F5" }, { name: "Yellow", hex: "#FFFF00" }, { name: "YellowGreen", hex: "#9ACD32" }
];

const getRandomPalette = (count: number) => {
  const shuffled = [...HTML_COLORS].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
};

const getContrastColor = (hex: string) => {
  const res = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!res) return '#1e293b';
  const r = parseInt(res[1], 16);
  const g = parseInt(res[2], 16);
  const b = parseInt(res[3], 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 128 ? '#1e293b' : '#ffffff';
};

// 3. Text (Help and Info)
const HelpContent = () => (
  <div className="space-y-4 font-['Outfit']">
    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">
      <FormattedMessage id="colourpicker.help.title" />
    </h3>
    <div className="space-y-3">
      {[1, 2, 3, 4].map((step) => (
        <div key={step} className="flex gap-3 text-left">
          <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center text-xs font-black text-indigo-600 shrink-0">{step}</div>
          <p className="text-sm text-slate-600 font-medium leading-tight">
            <FormattedMessage id={`colourpicker.help.step${step}`} />
          </p>
        </div>
      ))}
    </div>
  </div>
);

export const ColourPicker = () => {
  const { clearHeader, setHelpContent } = useHeader();
  const { settings } = useSettings();
  const [colors, setColors] = useState(() => getRandomPalette(50));
  const [selectedColor, setSelectedColor] = useState(colors[0]);
  const [isPicking, setIsPicking] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null);
  const [copiedType, setCopiedType] = useState<'hex' | 'rgb' | 'name' | null>(null);
  const animationRef = useRef<number | null>(null);

  const selectColor = useCallback((color: typeof HTML_COLORS[0]) => {
    setSelectedColor(color);
    audioEngine.playTick(settings.soundTheme);
  }, [settings.soundTheme]);

  const startPicking = useCallback(() => {
    if (isPicking) return;
    setIsPicking(true);

    // Regenerate palette first
    const newPalette = getRandomPalette(50);
    setColors(newPalette);
    
    let iterations = 0;
    const maxIterations = 20 + Math.floor(Math.random() * 10);
    const interval = 100;

    const animate = () => {
      const nextIdx = Math.floor(Math.random() * newPalette.length);
      setHighlightedIndex(nextIdx);
      audioEngine.playTick(settings.soundTheme);
      
      iterations++;

      if (iterations < maxIterations) {
        animationRef.current = window.setTimeout(animate, interval);
      } else {
        const finalIdx = Math.floor(Math.random() * newPalette.length);
        setHighlightedIndex(finalIdx);
        setSelectedColor(newPalette[finalIdx]);
        setIsPicking(false);
        setHighlightedIndex(null);
        audioEngine.playSuccess(settings.soundTheme);
      }
    };

    animate();
  }, [isPicking, settings.soundTheme]);

  const copyToClipboard = (text: string, type: 'hex' | 'rgb' | 'name') => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
    audioEngine.playTick(settings.soundTheme);
  };

  useEffect(() => {
    setHelpContent(<HelpContent />);
    return () => {
      clearHeader();
      if (animationRef.current) window.clearTimeout(animationRef.current);
    };
  }, [clearHeader, setHelpContent]);

  const rgb = hexToRgb(selectedColor.hex);
  const contrastColor = getContrastColor(selectedColor.hex);

  return (
    <ToolPanel baseWidth={1200} baseHeight={800} className="italic">
      <div className="w-full h-full flex flex-col items-center justify-center relative overflow-hidden p-12">
        <div className="tool-grid-bg opacity-30 pointer-events-none" />

        <div className="w-full max-w-5xl flex flex-col items-center gap-8 relative z-10">
          {/* Top: Grid of Colors */}
          <div className="w-full bg-white/50 backdrop-blur-md p-8 rounded-[3rem] border-4 border-white ">
            <div className="grid grid-cols-10 gap-3 w-full">
              {colors.map((color, index) => (
                <motion.button
                  key={`${color.name}-${index}`}
                  whileHover={{ scale: 1.2, zIndex: 10 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => selectColor(color)}
                  className={`aspect-square rounded-xl border-4 transition-all ${
                    selectedColor.hex === color.hex ? 'border-indigo-600 scale-125 z-20 ' : 
                    highlightedIndex === index ? 'border-indigo-400 scale-125 z-20  animate-pulse' : 'border-white '
                  }`}
                  style={{ backgroundColor: color.hex }}
                />
              ))}
            </div>
          </div>

          {/* Bottom: Controls and Values */}
          <div className="w-full grid grid-cols-1 lg:grid-cols-4 gap-6 items-stretch">
            {/* Pick Random Button */}
            <button
              onClick={startPicking}
              disabled={isPicking}
              className="group relative flex flex-col items-center justify-center gap-2 py-8 bg-indigo-600 text-white rounded-[2.5rem] font-black hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50 border-8 border-white italic overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none" />
              <RefreshCw size={32} className={isPicking ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'} />
              <span className="text-xl uppercase tracking-widest">
                <FormattedMessage id={isPicking ? "colourpicker.generating" : "colourpicker.generate"} />
              </span>
            </button>

            {/* Name Display */}
            <div 
              className="rounded-[2.5rem] p-8 border-8 border-white flex flex-col items-center justify-center gap-2 transition-colors duration-500 relative overflow-hidden"
              style={{ backgroundColor: selectedColor.hex }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none" />
              <div className="w-full flex items-center justify-between gap-2 relative z-10 px-2">
                <span className="text-[10px] font-black uppercase tracking-[0.3em]" style={{ color: contrastColor, opacity: 0.6 }}>
                  NAME
                </span>
                <button 
                  onClick={() => copyToClipboard(selectedColor.name, 'name')}
                  className="p-2 bg-white/20 hover:bg-white/40 rounded-lg transition-all active:scale-90"
                  style={{ color: contrastColor }}
                >
                  {copiedType === 'name' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                </button>
              </div>
              <span className="text-2xl font-black truncate w-full text-center" style={{ color: contrastColor }}>{selectedColor.name}</span>
            </div>

            {/* HEX Display */}
            <div 
              className="rounded-[2.5rem] p-8 border-8 border-white flex flex-col items-center justify-center gap-2 transition-colors duration-500 relative overflow-hidden"
              style={{ backgroundColor: selectedColor.hex }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none" />
              <div className="w-full flex items-center justify-between gap-2 relative z-10 px-2">
                <span className="text-[10px] font-black uppercase tracking-[0.3em]" style={{ color: contrastColor, opacity: 0.6 }}>
                  HEX
                </span>
                <button 
                  onClick={() => copyToClipboard(selectedColor.hex, 'hex')}
                  className="p-2 bg-white/20 hover:bg-white/40 rounded-lg transition-all active:scale-90"
                  style={{ color: contrastColor }}
                >
                  {copiedType === 'hex' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                </button>
              </div>
              <span className="text-2xl font-black tabular-nums w-full text-center" style={{ color: contrastColor }}>{selectedColor.hex}</span>
            </div>

            {/* RGB Display */}
            <div 
              className="rounded-[2.5rem] p-8 border-8 border-white flex flex-col items-center justify-center gap-2 transition-colors duration-500 relative overflow-hidden"
              style={{ backgroundColor: selectedColor.hex }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none" />
              <div className="w-full flex items-center justify-between gap-2 relative z-10 px-2">
                <span className="text-[10px] font-black uppercase tracking-[0.3em]" style={{ color: contrastColor, opacity: 0.6 }}>
                  RGB
                </span>
                <button 
                  onClick={() => copyToClipboard(rgb ? `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})` : '', 'rgb')}
                  className="p-2 bg-white/20 hover:bg-white/40 rounded-lg transition-all active:scale-90"
                  style={{ color: contrastColor }}
                >
                  {copiedType === 'rgb' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                </button>
              </div>
              <span className="text-2xl font-black tabular-nums w-full text-center" style={{ color: contrastColor }}>
                {rgb ? `${rgb.r}, ${rgb.g}, ${rgb.b}` : '---'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </ToolPanel>
  );
};

export default ColourPicker;
