import React, { useState } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { useSettings } from '../../contexts/SettingsContext';
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

// Shuffle colors once on load, take exactly 100
const COLORS = HTML_COLORS.sort(() => Math.random() - 0.5).slice(0, 100);

export const ColourPicker = () => {
  const [selectedColor, setSelectedColor] = useState(null);
  const [isPicking, setIsPicking] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const { settings } = useSettings();

  const pickColor = () => {
    if (isPicking) return;
    setIsPicking(true);
    setSelectedColor(null);

    let speed = 50;
    let index = 0;
    let iterations = 0;

    const animate = () => {
      setActiveIndex(Math.floor(Math.random() * 100));
      audioEngine.playTick(settings.soundTheme);

      iterations++;
      if (iterations < 20) {
        setTimeout(animate, speed);
      } else if (iterations < 30) {
        setTimeout(animate, speed * 2);
      } else {
        const finalIndex = Math.floor(Math.random() * 100);
        setActiveIndex(finalIndex);
        setSelectedColor(COLORS[finalIndex]);
        setIsPicking(false);
        audioEngine.playAlarm(settings.soundTheme);
      }
    };

    animate();
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-8 max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold text-primary">Colour Picker</h2>

      <div className="grid grid-cols-10 gap-1 sm:gap-2 p-4 bg-white rounded-2xl shadow-lg w-full">
        {COLORS.map((color, i) => (
          <motion.div
            key={i}
            animate={{
              scale: activeIndex === i ? 1.2 : 1,
              zIndex: activeIndex === i ? 10 : 1,
              opacity: (isPicking && activeIndex !== i) ? 0.5 : 1
            }}
            className={`w-full aspect-square rounded-md shadow-sm transition-colors duration-100 ${
              activeIndex === i ? 'ring-4 ring-text ring-offset-2' : ''
            }`}
            style={{ backgroundColor: color.rgb }}
            title={color.name}
          />
        ))}
      </div>

      <div className="flex flex-col md:flex-row items-center gap-8 min-h-[120px]">
        <button
          onClick={pickColor}
          disabled={isPicking}
          className="px-12 py-4 bg-primary text-white text-2xl font-bold rounded-2xl shadow-lg hover:bg-primary/90 hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100 whitespace-nowrap"
        >
          {isPicking ? 'Picking...' : 'Pick a Colour!'}
        </button>

        <AnimatePresence>
          {selectedColor && !isPicking && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col sm:flex-row items-center gap-4 bg-white p-4 rounded-xl shadow-md border"
            >
              <div
                className="w-16 h-16 rounded-full shadow-inner border border-gray-200"
                style={{ backgroundColor: selectedColor.rgb }}
              />
              <div className="flex flex-col">
                <span className="text-2xl font-mono text-gray-700 tracking-widest font-bold">
                  {selectedColor.name}
                </span>
                <span className="text-sm text-gray-500 font-mono">
                  {selectedColor.rgb}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
