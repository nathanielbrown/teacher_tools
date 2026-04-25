import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export const DieSVG = ({ sides, value, color, isRolling, size = 64, delay = 0 }) => {
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    let interval;
    if (isRolling) {
      interval = setInterval(() => {
        setDisplayValue(Math.floor(Math.random() * sides) + 1);
      }, 50);
    } else {
      setDisplayValue(value);
    }
    return () => clearInterval(interval);
  }, [isRolling, sides, value]);

  const getDefs = () => (
    <defs>
      <linearGradient id="goldText" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FFF2B2" />
        <stop offset="25%" stopColor="#FDE073" />
        <stop offset="50%" stopColor="#D4AF37" />
        <stop offset="75%" stopColor="#AA7900" />
        <stop offset="100%" stopColor="#8A6300" />
      </linearGradient>

      <filter id="goldGlow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="1" dy="1" stdDeviation="1.5" floodColor="#000000" floodOpacity="0.8" />
      </filter>
      
      <filter id="diceShadow" x="-30%" y="-30%" width="160%" height="160%">
        <feDropShadow dx="2" dy="5" stdDeviation="4" floodColor="#000000" floodOpacity="0.4" />
      </filter>

      {/* D20 - Teal/Blue Resin */}
      <linearGradient id="d20-1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#1e9fb8"/><stop offset="100%" stopColor="#085263"/></linearGradient>
      <linearGradient id="d20-2" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#0f778a"/><stop offset="100%" stopColor="#053e4c"/></linearGradient>
      <linearGradient id="d20-3" x1="100%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#14879c"/><stop offset="100%" stopColor="#0a4654"/></linearGradient>
      <linearGradient id="d20-4" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" stopColor="#074857"/><stop offset="100%" stopColor="#022129"/></linearGradient>

      {/* D12 - Black/Galaxy */}
      <linearGradient id="d12-1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#4a4a4a"/><stop offset="100%" stopColor="#1a1a1a"/></linearGradient>
      <linearGradient id="d12-2" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#333333"/><stop offset="100%" stopColor="#0a0a0a"/></linearGradient>
      <linearGradient id="d12-3" x1="100%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#262626"/><stop offset="100%" stopColor="#050505"/></linearGradient>
      <linearGradient id="d12-4" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" stopColor="#141414"/><stop offset="100%" stopColor="#000000"/></linearGradient>

      {/* D10 - Crimson/Black */}
      <linearGradient id="d10-1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#c41a1a"/><stop offset="100%" stopColor="#660000"/></linearGradient>
      <linearGradient id="d10-2" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#9e0a0a"/><stop offset="100%" stopColor="#400000"/></linearGradient>
      <linearGradient id="d10-3" x1="100%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#820404"/><stop offset="100%" stopColor="#2b0000"/></linearGradient>
      <linearGradient id="d10-4" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" stopColor="#5e0000"/><stop offset="100%" stopColor="#1a0000"/></linearGradient>

      {/* D8 - Deep Green */}
      <linearGradient id="d8-1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#1fa332"/><stop offset="100%" stopColor="#094713"/></linearGradient>
      <linearGradient id="d8-2" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#137521"/><stop offset="100%" stopColor="#042e0a"/></linearGradient>
      <linearGradient id="d8-3" x1="100%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#188c29"/><stop offset="100%" stopColor="#06380c"/></linearGradient>
      <linearGradient id="d8-4" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" stopColor="#0e5e18"/><stop offset="100%" stopColor="#011f04"/></linearGradient>

      {/* D6 - Dark Red/Swirl */}
      <linearGradient id="d6-1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#b52222"/><stop offset="100%" stopColor="#5e0707"/></linearGradient>

      {/* D4 - Orange Resin */}
      <linearGradient id="d4-1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#ffab24"/><stop offset="100%" stopColor="#b36700"/></linearGradient>
    </defs>
  );

  const renderShape = () => {
    switch (sides) {
      case 4: // D4
        return (
          <g filter="url(#diceShadow)">
            <polygon points="50,10 95,85 5,85" fill="url(#d4-1)" />
            <polygon points="50,10 50,85 5,85" fill="rgba(255,255,255,0.15)" />
            <polygon points="5,85 95,85 50,75" fill="rgba(0,0,0,0.15)" />
            <path d="M50,10 L95,85 L5,85 Z" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
          </g>
        );
      case 6: // D6
        return (
          <g filter="url(#diceShadow)">
            <polygon points="25,35 40,15 90,15 75,35" fill="url(#d6-1)" />
            <polygon points="75,35 90,15 90,65 75,85" fill="rgba(94, 7, 7, 0.9)" />
            <polygon points="25,35 75,35 75,85 25,85" fill="url(#d6-1)" />
            <polygon points="25,35 40,15 90,15 75,35" fill="rgba(255,255,255,0.2)" />
            <polygon points="25,35 75,35 75,85 25,85" fill="rgba(255,255,255,0.05)" />
            <polygon points="75,35 90,15 90,65 75,85" fill="rgba(0,0,0,0.4)" />
            <line x1="25" y1="35" x2="75" y2="35" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
            <line x1="75" y1="35" x2="75" y2="85" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
            <line x1="75" y1="35" x2="90" y2="15" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
          </g>
        );
      case 8: // D8
        return (
          <g filter="url(#diceShadow)">
            <polygon points="50,5 89,72.5 11,72.5" fill="url(#d8-1)" />
            <polygon points="50,5 11,27.5 11,72.5" fill="url(#d8-2)" />
            <polygon points="50,5 89,27.5 89,72.5" fill="url(#d8-3)" />
            <polygon points="11,72.5 89,72.5 50,95" fill="url(#d8-4)" />
            <polygon points="50,5 11,27.5 11,72.5" fill="rgba(255,255,255,0.2)" />
            <polygon points="50,5 89,27.5 89,72.5" fill="rgba(0,0,0,0.2)" />
            <polygon points="11,72.5 89,72.5 50,95" fill="rgba(0,0,0,0.5)" />
            <line x1="50" y1="5" x2="11" y2="72.5" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
            <line x1="50" y1="5" x2="89" y2="72.5" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
            <line x1="11" y1="72.5" x2="89" y2="72.5" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
          </g>
        );
      case 10: // D10
        return (
          <g filter="url(#diceShadow)">
            <polygon points="50,5 80,45 50,80 20,45" fill="url(#d10-3)" />
            <polygon points="50,5 20,45 5,35" fill="url(#d10-1)" />
            <polygon points="50,5 95,35 80,45" fill="url(#d10-2)" />
            <polygon points="5,35 20,45 50,80 50,95" fill="url(#d10-4)" />
            <polygon points="95,35 80,45 50,80 50,95" fill="url(#d10-1)" />
            <polygon points="50,5 20,45 5,35" fill="rgba(255,255,255,0.2)" />
            <polygon points="50,5 80,45 50,80 20,45" fill="rgba(255,255,255,0.1)" />
            <polygon points="5,35 20,45 50,80 50,95" fill="rgba(0,0,0,0.3)" />
            <polygon points="95,35 80,45 50,80 50,95" fill="rgba(0,0,0,0.5)" />
            <line x1="50" y1="5" x2="20" y2="45" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
            <line x1="50" y1="5" x2="80" y2="45" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
            <line x1="20" y1="45" x2="50" y2="80" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
            <line x1="80" y1="45" x2="50" y2="80" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
          </g>
        );
      case 12: // D12
        return (
          <g filter="url(#diceShadow)">
            <polygon points="50,75 26.2,57.7 7.2,63.9 23.5,86.4 50,95" fill="url(#d12-4)" />
            <polygon points="73.8,57.7 50,75 50,95 76.4,86.4 92.7,63.9" fill="url(#d12-3)" />
            <polygon points="26.2,57.7 35.3,29.7 23.5,13.5 7.2,36 7.2,63.9" fill="url(#d12-2)" />
            <polygon points="64.7,29.7 73.8,57.7 92.7,63.9 92.7,36 76.4,13.5" fill="url(#d12-2)" />
            <polygon points="35.3,29.7 64.7,29.7 76.4,13.5 50,5 23.5,13.5" fill="url(#d12-1)" />
            <polygon points="35.3,29.7 64.7,29.7 73.8,57.7 50,75 26.2,57.7" fill="url(#d12-1)" />
            <polygon points="35.3,29.7 64.7,29.7 76.4,13.5 50,5 23.5,13.5" fill="rgba(255,255,255,0.15)" />
            <polygon points="35.3,29.7 64.7,29.7 73.8,57.7 50,75 26.2,57.7" fill="rgba(255,255,255,0.08)" />
            <polygon points="50,75 26.2,57.7 7.2,63.9 23.5,86.4 50,95" fill="rgba(0,0,0,0.4)" />
            <polygon points="73.8,57.7 50,75 50,95 76.4,86.4 92.7,63.9" fill="rgba(0,0,0,0.6)" />
            <line x1="35.3" y1="29.7" x2="64.7" y2="29.7" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
          </g>
        );
      case 20: // D20
        return (
          <g filter="url(#diceShadow)">
            <polygon points="27.5,68.75 72.5,68.75 50,95" fill="url(#d20-4)" />
            <polygon points="27.5,68.75 50,95 11,72.5" fill="url(#d20-3)" />
            <polygon points="72.5,68.75 89,72.5 50,95" fill="url(#d20-3)" />
            <polygon points="27.5,68.75 11,72.5 11,27.5" fill="url(#d20-2)" />
            <polygon points="72.5,68.75 89,27.5 89,72.5" fill="url(#d20-2)" />
            <polygon points="50,35 27.5,68.75 11,27.5" fill="url(#d20-1)" />
            <polygon points="50,35 89,27.5 72.5,68.75" fill="url(#d20-1)" />
            <polygon points="50,35 11,27.5 50,5" fill="url(#d20-2)" />
            <polygon points="50,35 50,5 89,27.5" fill="url(#d20-2)" />
            <polygon points="50,35 27.5,68.75 72.5,68.75" fill="url(#d20-1)" />
            <polygon points="50,35 27.5,68.75 72.5,68.75" fill="rgba(255,255,255,0.15)" />
            <polygon points="50,35 11,27.5 50,5" fill="rgba(255,255,255,0.25)" />
            <polygon points="50,35 50,5 89,27.5" fill="rgba(255,255,255,0.1)" />
            <polygon points="27.5,68.75 72.5,68.75 50,95" fill="rgba(0,0,0,0.5)" />
            <line x1="50" y1="35" x2="27.5" y2="68.75" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
            <line x1="50" y1="35" x2="72.5" y2="68.75" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
          </g>
        );
      default:
        return <rect x="15" y="15" width="70" height="70" fill="#cccccc" />;
    }
  };

  return (
    <motion.div
      className="relative cursor-pointer"
      style={{ width: size, height: size }}
      animate={isRolling ? {
        rotate: [0, -12, 12, -12, 0],
        scale: [1, 1.15, 0.95, 1.1, 1],
        y: [0, -25, 0],
      } : { rotate: 0, scale: 1, y: 0 }}
      transition={isRolling ? {
        duration: 0.45,
        repeat: Infinity,
        delay: delay,
        ease: "easeInOut"
      } : { type: "spring", stiffness: 400, damping: 20 }}
    >
      <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-2xl">
        {getDefs()}
        {renderShape()}
        <text 
          x="50" y={sides === 4 ? "65" : "60"} 
          textAnchor="middle" 
          fill="url(#goldText)"
          filter="url(#goldGlow)"
          style={{ 
            fontSize: sides === 20 ? '26px' : '32px', 
            fontWeight: '900', 
            fontFamily: 'system-ui, -apple-system, sans-serif',
            letterSpacing: '-1px'
          }}
        >
          {displayValue}
        </text>
      </svg>
    </motion.div>
  );
};
