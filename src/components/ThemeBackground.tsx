import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSettings } from '../contexts/SettingsContext';

const Cloud = ({ delay = 0, duration = 40, top = '20%' }) => (
  <motion.div
    initial={{ x: '-200px' }}
    animate={{ x: '100vw' }}
    transition={{
      duration,
      repeat: Infinity,
      ease: 'linear',
      delay
    }}
    style={{ position: 'absolute', top }}
    className="opacity-40"
  >
    <svg width="120" height="60" viewBox="0 0 120 60" fill="white">
      <circle cx="30" cy="35" r="25" />
      <circle cx="60" cy="25" r="25" />
      <circle cx="90" cy="35" r="25" />
      <rect x="30" y="35" width="60" height="25" />
    </svg>
  </motion.div>
);

const PaintFilter = () => (
  <svg width="0" height="0" style={{ position: 'absolute' }}>
    <defs>
      <filter id="paint-texture" x="-20%" y="-20%" width="140%" height="140%">
        <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" result="noise" />
        <feDisplacementMap in="SourceGraphic" in2="noise" scale="20" xChannelSelector="R" yChannelSelector="G" />
      </filter>
    </defs>
  </svg>
);

const PaintBlob = ({ x, y, color }) => (
  <motion.div
    initial={{ scale: 0.5, opacity: 0 }}
    animate={{ scale: 1, opacity: 0.15 }}
    exit={{ opacity: 0, scale: 1.2, filter: 'blur(10px)' }}
    transition={{ duration: 1.5 }}
    style={{
      position: 'absolute',
      left: `${x}%`,
      top: `${y}%`,
      width: '100px',
      height: '100px',
      backgroundColor: color,
      borderRadius: '50%',
      filter: 'url(#paint-texture)',
      pointerEvents: 'none',
      transform: 'translate(-50%, -50%)'
    }}
  />
);

const BrushStroke = ({ color, duration = 8000 }) => {
  const [blobs, setBlobs] = React.useState<any[]>([]);
  const [startPos] = React.useState(() => {
    const side = Math.floor(Math.random() * 4);
    const pos = Math.random() * 100;
    if (side === 0) return { x: pos, y: -15 };
    if (side === 1) return { x: 115, y: pos };
    if (side === 2) return { x: pos, y: 115 };
    return { x: -15, y: pos };
  });
  
  const [endPos] = React.useState(() => ({
    x: 100 - startPos.x + (Math.random() * 60 - 30),
    y: 100 - startPos.y + (Math.random() * 60 - 30)
  }));

  React.useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = elapsed / duration;
      
      if (progress >= 1.2) { // Allow it to go fully off screen
        clearInterval(interval);
        return;
      }
      
      const x = startPos.x + (endPos.x - startPos.x) * progress;
      const y = startPos.y + (endPos.y - startPos.y) * progress;
      
      const id = Math.random();
      setBlobs(prev => [...prev, { id, x, y }]);
      
      setTimeout(() => {
        setBlobs(prev => prev.filter(b => b.id !== id));
      }, 4000); // Fade out after 4s
      
    }, 150);
    
    return () => clearInterval(interval);
  }, [duration, startPos, endPos]);

  return (
    <AnimatePresence>
      {blobs.map(blob => (
        <PaintBlob key={blob.id} {...blob} color={color} />
      ))}
    </AnimatePresence>
  );
};

const COLORS = ['#ff4757', '#2ed573', '#1e90ff', '#ffa502', '#a55ee1', '#ff6b81', '#7bed9f', '#70a1ff'];

export const ThemeBackground: React.FC = () => {
  const { settings } = useSettings();
  const { theme } = settings;
  const [strokes, setStrokes] = React.useState<any[]>([]);

  React.useEffect(() => {
    if (theme !== 'early-years') return;
    
    const spawnStroke = () => {
      const id = Math.random();
      const color = COLORS[Math.floor(Math.random() * COLORS.length)];
      setStrokes(prev => [...prev.slice(-8), { id, color }]);
    };

    spawnStroke(); // Initial
    const interval = setInterval(spawnStroke, 3500);
    return () => clearInterval(interval);
  }, [theme]);

  if (theme === 'early-years') {
    return (
      <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none select-none">
        <PaintFilter />
        <div className="theme-early-years-bg" />
        {strokes.map(s => (
          <BrushStroke key={s.id} color={s.color} />
        ))}
      </div>
    );
  }

  if (theme !== 'primary') return null;

  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none select-none">
      {/* Sky */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#bae6fd] via-[#e0f2fe] to-[#f0f9ff]" />
      
      {/* Sun */}
      <div className="absolute top-[8%] right-[12%] w-32 h-32">
        <motion.div
          animate={{ 
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          className="w-full h-full bg-amber-200 rounded-full blur-[40px]"
        />
        <div className="absolute inset-4 bg-amber-300 rounded-full shadow-[0_0_50px_rgba(251,191,36,0.5)]" />
      </div>

      {/* Clouds */}
      <Cloud top="12%" duration={45} delay={0} />
      <Cloud top="22%" duration={65} delay={10} />
      <Cloud top="18%" duration={55} delay={25} />
      <Cloud top="28%" duration={80} delay={40} />

      {/* Field Background */}
      <div className="absolute bottom-0 left-0 right-0 h-[45%] bg-gradient-to-t from-[#86efac] via-[#bbf7d0] to-transparent opacity-80" />
      
      {/* Hills/Field (SVG) */}
      <div className="absolute bottom-0 left-0 right-0 h-[40%]">
        <svg 
          className="absolute bottom-0 left-0 w-full h-full" 
          viewBox="0 0 1440 320" 
          preserveAspectRatio="none"
        >
          <path 
            fill="#bbf7d0" 
            fillOpacity="1" 
            d="M0,224L60,202.7C120,181,240,139,360,138.7C480,139,600,181,720,213.3C840,245,960,267,1080,245.3C1200,224,1320,160,1380,128L1440,96L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z"
          />
          <path 
            fill="#86efac" 
            fillOpacity="1" 
            d="M0,288L80,261.3C160,235,320,181,480,181.3C640,181,800,235,960,250.7C1120,267,1280,245,1360,234.7L1440,224L1440,320L1360,320C1280,320,1120,320,960,320C800,320,640,320,480,320C320,320,160,320,80,320L0,320Z"
          />
        </svg>
      </div>
    </div>
  );
};
