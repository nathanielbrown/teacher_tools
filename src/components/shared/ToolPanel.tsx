import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface ToolPanelProps {
  children: React.ReactNode;
  className?: string;
  /** Optional reference width for scaling calculation. Defaults to 1200. */
  baseWidth?: number;
  /** Optional reference height for scaling calculation. Defaults to 800. */
  baseHeight?: number;
  /** Whether to align content to the top instead of centering. */
  alignTop?: boolean;
  /** Whether to let the tool change shape (height) to fill the screen perfectly. */
  fluid?: boolean;
  /** Optional padding around the scaling content. Defaults to 20. */
  padding?: number;
}

/**
 * ToolPanel provides a consistent, white, rounded container for tools.
 * It automatically centers itself and attempts to scale its content to fit the available space.
 */
export const ToolPanel: React.FC<ToolPanelProps> = ({
  children,
  className = "",
  baseWidth = 1200,
  baseHeight = 800,
  alignTop = false,
  fluid = true,
  padding = 20
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [dynamicHeight, setDynamicHeight] = useState(baseHeight);

  useEffect(() => {
    const updateScale = () => {
      if (!containerRef.current) return;

      const container = containerRef.current;
      const { width, height } = container.getBoundingClientRect();

      // Calculate scale to fit within the container with minimal padding
      const availableWidth = width - padding;
      const availableHeight = height - padding;

      if (fluid) {
        const newScale = Math.max(0.1, Math.min(availableWidth / baseWidth, 2));
        setScale(newScale);
        setDynamicHeight(availableHeight / newScale);
      } else {
        const scaleX = availableWidth / baseWidth;
        const scaleY = availableHeight / baseHeight;
        const newScale = Math.min(scaleX, scaleY);
        setScale(Math.max(0.1, Math.min(newScale, 2)));
        setDynamicHeight(baseHeight);
      }
    };

    const resizeObserver = new ResizeObserver(updateScale);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    window.addEventListener('resize', updateScale);
    updateScale();

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateScale);
    };
  }, [baseWidth, baseHeight, fluid]);

  return (
    <div
      className="flex-1 flex flex-col justify-center items-center h-full min-w-0 min-h-0 relative overflow-hidden"
    >
      <motion.div
        ref={containerRef}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ layout: { duration: 0.5, type: "spring", bounce: 0.2 } }}
        className={`bg-surface/80 backdrop-blur-xl rounded-[var(--radius-main)] relative w-full h-full flex flex-col items-center ${alignTop ? 'justify-start' : 'justify-center'} overflow-hidden border-4 border-border/40 ${className}`}
      >
        {/* Background Grid Pattern - Removed as requested */}


        {/* Content Wrapper that scales */}
        <div
          style={{
            width: baseWidth,
            height: dynamicHeight,
            transform: `scale(${scale})`,
            transformOrigin: alignTop ? 'top center' : 'center center',
            position: 'absolute',
            left: '50%',
            marginLeft: -(baseWidth / 2),
            top: alignTop ? (padding / 2) : '50%',
            marginTop: alignTop ? '0' : -(dynamicHeight / 2)
          }}
          className={`z-10 flex ${alignTop ? 'flex-col items-stretch justify-start' : 'items-center justify-center'}`}
        >
          {children}
        </div>
      </motion.div>
    </div>
  );
};

export default ToolPanel;
