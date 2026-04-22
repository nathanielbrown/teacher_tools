import React, { useState, useEffect, useRef } from 'react';
import { motion, useMotionValue } from 'framer-motion';
import { ChevronUp, ChevronDown, PieChart, Info, Plus, Minus } from 'lucide-react';

export const FractionTool = () => {
  const [numerator, setNumerator] = useState(1);
  const [denominator, setDenominator] = useState(4);
  const lineRef = useRef(null);
  const pointerX = useMotionValue(0);

  const updateNumerator = (val) => {
    const next = Math.max(0, Math.min(denominator, numerator + val));
    setNumerator(next);
  };

  const updateDenominator = (val) => {
    const next = Math.max(1, Math.min(20, denominator + val));
    setDenominator(next);
    if (numerator > next) setNumerator(next);
  };

  // Helper for SVG Arc
  const polarToCartesian = (centerX, centerY, radius, angleInDegrees) => {
    const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
    return {
      x: centerX + (radius * Math.cos(angleInRadians)),
      y: centerY + (radius * Math.sin(angleInRadians))
    };
  };

  const describeArc = (x, y, radius, startAngle, endAngle) => {
    const start = polarToCartesian(x, y, radius, endAngle);
    const end = polarToCartesian(x, y, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
    return [
      "M", x, y,
      "L", start.x, start.y,
      "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y,
      "Z"
    ].join(" ");
  };

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-8 h-full flex flex-col">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-primary flex items-center gap-3">
          <PieChart size={32} />
          Fraction Visualizer
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1">
        
        {/* Left: Controls & Fraction Notation */}
        <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-gray-100 flex flex-col items-center justify-center space-y-8">
          <div className="flex flex-col items-center">
            <button 
              onClick={() => updateNumerator(1)}
              className="p-2 hover:bg-primary/10 rounded-full text-primary transition-colors"
            >
              <ChevronUp size={32} />
            </button>
            <div className="text-8xl font-black text-gray-800 tabular-nums my-2">
              {numerator}
            </div>
            <button 
              onClick={() => updateNumerator(-1)}
              className="p-2 hover:bg-primary/10 rounded-full text-primary transition-colors"
            >
              <ChevronDown size={32} />
            </button>
          </div>
          
          <div className="w-48 h-2 bg-gray-800 rounded-full" />
          
          <div className="flex flex-col items-center">
            <button 
              onClick={() => updateDenominator(1)}
              className="p-2 hover:bg-primary/10 rounded-full text-primary transition-colors"
            >
              <ChevronUp size={32} />
            </button>
            <div className="text-8xl font-black text-gray-800 tabular-nums my-2">
              {denominator}
            </div>
            <button 
              onClick={() => updateDenominator(-1)}
              className="p-2 hover:bg-primary/10 rounded-full text-primary transition-colors"
            >
              <ChevronDown size={32} />
            </button>
          </div>
        </div>

        {/* Center: Fraction Circle */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-gray-100 flex flex-col items-center justify-center min-h-[400px]">
            <h3 className="text-gray-400 font-bold uppercase tracking-widest text-sm mb-8">Circle Model</h3>
            <svg viewBox="0 0 200 200" className="w-full max-w-[350px] transform -rotate-90">
              {/* Background Circle */}
              <circle cx="100" cy="100" r="90" fill="#f3f4f6" stroke="#e5e7eb" strokeWidth="1" />
              
              {/* Segments */}
              {Array.from({ length: denominator }).map((_, i) => {
                const angle = 360 / denominator;
                const start = i * angle;
                const end = (i + 1) * angle;
                return (
                  <path
                    key={i}
                    d={describeArc(100, 100, 90, start, end)}
                    className={`transition-all duration-300 cursor-pointer hover:stroke-white hover:stroke-2 ${
                      i < numerator ? 'fill-primary' : 'fill-white'
                    }`}
                    stroke="#e5e7eb"
                    strokeWidth="0.5"
                    onClick={() => setNumerator(i + 1)}
                  />
                );
              })}
            </svg>
          </div>

          {/* Bottom: Number Line */}
          <div className="bg-white p-12 rounded-[3rem] shadow-xl border border-gray-100 space-y-12">
            <h3 className="text-gray-400 font-bold uppercase tracking-widest text-sm text-center">Number Line Model</h3>
            <div className="relative px-8">
              {/* The Line */}
              <div ref={lineRef} className="h-1 bg-gray-200 rounded-full w-full relative">
                {/* Tick Marks */}
                {Array.from({ length: denominator + 1 }).map((_, i) => {
                  const left = `${(i / denominator) * 100}%`;
                  return (
                    <div 
                      key={i} 
                      className="absolute top-1/2 -translate-y-1/2 w-0.5 h-6 bg-gray-300"
                      style={{ left }}
                    >
                      <span className="absolute top-8 left-1/2 -translate-x-1/2 text-xs font-bold text-gray-400">
                        {i}/{denominator}
                      </span>
                    </div>
                  );
                })}
                
                {/* 0 and 1 Labels */}
                <div className="absolute -left-2 -top-10 text-xl font-black text-gray-800">0</div>
                <div className="absolute -right-2 -top-10 text-xl font-black text-gray-800">1</div>

                {/* Progress Fill */}
                <motion.div 
                  className="absolute top-0 left-0 h-full bg-primary/30"
                  animate={{ width: `${(numerator / denominator) * 100}%` }}
                />

                {/* Clickable Overlay */}
                <div className="absolute top-1/2 -translate-y-1/2 -inset-x-4 h-24 z-10 cursor-crosshair" 
                  onClick={(e) => {
                    const rect = lineRef.current.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const percent = x / rect.width;
                    const closestNum = Math.round(percent * denominator);
                    setNumerator(Math.max(0, Math.min(denominator, closestNum)));
                  }}
                />

                {/* The Pointer */}
                <motion.div 
                  className="absolute -top-3 w-8 h-8 bg-primary rounded-full border-4 border-white shadow-lg cursor-grab active:cursor-grabbing z-20 flex items-center justify-center"
                  drag="x"
                  dragConstraints={lineRef}
                  dragElastic={0}
                  dragMomentum={false}
                  style={{ x: pointerX }}
                  onDrag={(e, info) => {
                    const rect = lineRef.current.getBoundingClientRect();
                    const x = info.point.x - rect.left;
                    const percent = x / rect.width;
                    const closestNum = Math.round(percent * denominator);
                    const newVal = Math.max(0, Math.min(denominator, closestNum));
                    if (newVal !== numerator) {
                      setNumerator(newVal);
                    }
                    // Reset the drag transform so it stays locked to the snapped 'left' position
                    pointerX.set(0);
                  }}
                  onDragEnd={() => {
                    pointerX.set(0);
                  }}
                  animate={{ left: `calc(${(numerator / denominator) * 100}% - 1rem)` }}
                  transition={{ type: 'spring', damping: 30, stiffness: 500 }}
                >
                  <div className="w-1 h-3 bg-white/50 rounded-full" />
                </motion.div>
              </div>
            </div>
            
            <div className="pt-8 text-center">
              <span className="bg-primary/5 px-6 py-2 rounded-2xl text-primary font-bold">
                Value: {(numerator / denominator).toFixed(3)}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Tip Box */}
      <div className="bg-blue-50 p-4 rounded-3xl border border-blue-100 flex items-start gap-4 text-blue-800">
        <Info className="shrink-0 mt-1" />
        <p className="text-sm font-medium">
          <strong>Teacher Tip:</strong> Click directly on the circle segments or the number line to quickly jump to a specific numerator value. Use the arrows on the left to fine-tune both numerator and denominator.
        </p>
      </div>
    </div>
  );
};
