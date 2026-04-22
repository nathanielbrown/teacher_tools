import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Image as ImageIcon, Upload, Grid3X3, Settings2, RotateCcw, Trophy, Layout, Zap, Sparkles } from 'lucide-react';

// Jigsaw path generation logic (unchanged but cleaned up)
const getPiecePath = (row, col, rows, cols, width, height, style) => {
  if (style === 'Straight') return null;

  const w = width;
  const h = height;

  if (style === 'Modern') {
    const seed = (row * cols + col) % 4;
    const offset = 15;
    if (seed === 0) return `M0,0 L${w+offset},0 L${w},${h} L0,${h+offset} Z`;
    if (seed === 1) return `M${offset},0 L${w},0 L${w-offset},${h} L0,${h} Z`;
    if (seed === 2) return `M0,${offset} L${w},0 L${w},${h-offset} L0,${h} Z`;
    return `M0,0 L${w},${offset} L${w-offset},${h} L${offset},${h} Z`;
  }

  const getEdge = (r, c, direction) => {
    if (direction === 'top' && r === 0) return 0;
    if (direction === 'bottom' && r === rows - 1) return 0;
    if (direction === 'left' && c === 0) return 0;
    if (direction === 'right' && c === cols - 1) return 0;
    const seed = direction === 'top' || direction === 'bottom' 
      ? (direction === 'top' ? r : r + 1) * 100 + c
      : r * 100 + (direction === 'left' ? c : c + 1);
    return (seed % 2 === 0 ? 1 : -1);
  };

  const top = getEdge(row, col, 'top');
  const bottom = getEdge(row, col, 'bottom');
  const left = getEdge(row, col, 'left');
  const right = getEdge(row, col, 'right');

  const tabW = w * 0.25;
  const tabH = h * 0.25;

  let path = `M 0 0 `;
  if (top !== 0) {
    path += `L ${w/2 - tabW/2} 0 C ${w/2 - tabW/2} ${-top * tabH} ${w/2 + tabW/2} ${-top * tabH} ${w/2 + tabW/2} 0 `;
  }
  path += `L ${w} 0 `;
  if (right !== 0) {
    path += `L ${w} ${h/2 - tabW/2} C ${w + right * tabH} ${h/2 - tabW/2} ${w + right * tabH} ${h/2 + tabW/2} ${w} ${h/2 + tabW/2} `;
  }
  path += `L ${w} ${h} `;
  if (bottom !== 0) {
    path += `L ${w/2 + tabW/2} ${h} C ${w/2 + tabW/2} ${h + bottom * tabH} ${w/2 - tabW/2} ${h + bottom * tabH} ${w/2 - tabW/2} ${h} `;
  }
  path += `L 0 ${h} `;
  if (left !== 0) {
    path += `L 0 ${h/2 + tabW/2} C ${-left * tabH} ${h/2 + tabW/2} ${-left * tabH} ${h/2 - tabW/2} 0 ${h/2 - tabW/2} `;
  }
  path += `L 0 0 Z`;
  return path;
};

const DIFFICULTIES = {
  Easy: { rows: 3, cols: 3 },
  Medium: { rows: 4, cols: 4 },
  Hard: { rows: 5, cols: 5 }
};

const STYLES = ['Straight', 'Traditional', 'Modern'];

export const Puzzle = () => {
  const [image, setImage] = useState(null);
  const [pieces, setPieces] = useState([]);
  const [difficulty, setDifficulty] = useState('Easy');
  const [style, setStyle] = useState('Traditional');
  const [status, setStatus] = useState('upload'); // 'upload', 'playing', 'solved'
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const containerRef = useRef(null);
  const fileInputRef = useRef(null);
  const [draggingGroupId, setDraggingGroupId] = useState(null);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          setImage({
            src: event.target.result,
            width: img.width,
            height: img.height,
            aspectRatio: img.width / img.height
          });
          setStatus('playing');
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const generatePieces = useCallback(() => {
    if (!image || !containerRef.current) return;

    const { rows, cols } = DIFFICULTIES[difficulty];
    const container = containerRef.current.getBoundingClientRect();
    const boardWidth = Math.min(container.width - 100, 1000);
    const boardHeight = boardWidth / image.aspectRatio;
    
    setContainerSize({ width: boardWidth, height: boardHeight });

    const pWidth = boardWidth / cols;
    const pHeight = boardHeight / rows;

    const newPieces = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const path = getPiecePath(r, c, rows, cols, pWidth, pHeight, style);
        
        // Randomly scatter pieces in a larger area
        const scatterX = Math.random() * (container.width - pWidth);
        const scatterY = Math.random() * (container.height - pHeight);

        newPieces.push({
          id: `${r}-${c}`,
          row: r,
          col: c,
          groupId: `${r}-${c}`,
          // currentX/Y are relative to the board container
          currentX: scatterX - (container.width - boardWidth) / 2,
          currentY: scatterY - (container.height - boardHeight) / 2,
          idealRelX: c * pWidth,
          idealRelY: r * pHeight,
          width: pWidth,
          height: pHeight,
          path: path
        });
      }
    }
    setPieces(newPieces.sort(() => Math.random() - 0.5));
  }, [image, difficulty, style]);

  useEffect(() => {
    if (status === 'playing') generatePieces();
  }, [status, generatePieces]);

  const handleDragStart = (groupId) => {
    setDraggingGroupId(groupId);
  };

  const handleDragUpdate = (id, info) => {
    setPieces(prev => {
      const piece = prev.find(p => p.id === id);
      const gid = piece.groupId;
      return prev.map(p => {
        if (p.groupId === gid) {
          return {
            ...p,
            currentX: p.currentX + info.delta.x,
            currentY: p.currentY + info.delta.y
          };
        }
        return p;
      });
    });
  };

  const handleDragEnd = (id) => {
    setDraggingGroupId(null);
    setPieces(prev => {
      const piece = prev.find(p => p.id === id);
      const groupPieces = prev.filter(p => p.groupId === piece.groupId);
      
      let snapTarget = null;
      const SNAP_THRESHOLD = 30;

      // For every piece in the current group, check if it can snap to ANY piece in ANY OTHER group
      for (const p of groupPieces) {
        for (const other of prev) {
          if (other.groupId === p.groupId) continue;

          // Check if they are logical neighbors (Up, Down, Left, Right)
          const isNeighbor = (
            (Math.abs(p.row - other.row) === 1 && p.col === other.col) ||
            (Math.abs(p.col - other.col) === 1 && p.row === other.row)
          );

          if (isNeighbor) {
            // Target relative position: p.pos - other.pos should be p.ideal - other.ideal
            const targetRelX = p.idealRelX - other.idealRelX;
            const targetRelY = p.idealRelY - other.idealRelY;
            const currentRelX = p.currentX - other.currentX;
            const currentRelY = p.currentY - other.currentY;

            const dist = Math.sqrt(Math.pow(currentRelX - targetRelX, 2) + Math.pow(currentRelY - targetRelY, 2));

            if (dist < SNAP_THRESHOLD) {
              snapTarget = { 
                otherGroupId: other.groupId, 
                dx: (other.currentX + targetRelX) - p.currentX,
                dy: (other.currentY + targetRelY) - p.currentY
              };
              break;
            }
          }
        }
        if (snapTarget) break;
      }

      if (snapTarget) {
        const updated = prev.map(p => {
          if (p.groupId === piece.groupId) {
            return { 
              ...p, 
              currentX: p.currentX + snapTarget.dx, 
              currentY: p.currentY + snapTarget.dy, 
              groupId: snapTarget.otherGroupId 
            };
          }
          return p;
        });

        // Check win condition: only one group remaining
        const uniqueGroups = new Set(updated.map(p => p.groupId));
        if (uniqueGroups.size === 1) setStatus('solved');
        
        return updated;
      }

      return prev;
    });
  };

  return (
    <div className="max-w-full h-screen flex flex-col bg-slate-50 overflow-hidden">
      {/* Header */}
      <div className="bg-white p-6 shadow-md border-b border-slate-200 flex items-center justify-between z-30">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-purple-100 rounded-xl text-purple-600">
            <ImageIcon size={32} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-800">Classroom Puzzle</h2>
            <p className="text-slate-400 text-xs font-medium italic">Assemble the mystery image.</p>
          </div>
        </div>

        {status === 'playing' && (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl border border-slate-100">
              {Object.keys(DIFFICULTIES).map((level) => (
                <button
                  key={level}
                  onClick={() => setDifficulty(level)}
                  className={`px-4 py-2 rounded-lg font-black transition-all text-xs ${
                    difficulty === level ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl border border-slate-100">
              {STYLES.map((s) => (
                <button
                  key={s}
                  onClick={() => setStyle(s)}
                  className={`px-4 py-2 rounded-lg font-black transition-all text-xs ${
                    style === s ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            <button
              onClick={() => setStatus('upload')}
              className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors"
            >
              <RotateCcw size={20} />
            </button>
          </div>
        )}
      </div>

      {/* Workspace */}
      <div 
        className="flex-1 relative overflow-hidden bg-slate-100 p-8 select-none" 
        ref={containerRef}
      >
        <AnimatePresence mode="wait">
          {status === 'upload' ? (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="h-full flex flex-col items-center justify-center gap-8 text-center"
            >
              <div className="w-32 h-32 bg-purple-50 rounded-full flex items-center justify-center text-purple-600 shadow-inner">
                <Upload size={64} />
              </div>
              <div className="space-y-2">
                <h3 className="text-4xl font-black text-slate-800 tracking-tight">Create a Puzzle</h3>
                <p className="text-slate-500 max-w-sm mx-auto font-medium">Upload any image to transform it into a jigsaw puzzle for your class.</p>
              </div>
              <label className="px-12 py-5 bg-purple-600 text-white rounded-[2rem] font-black hover:bg-purple-700 transition-all shadow-2xl shadow-purple-200 cursor-pointer active:scale-95 flex items-center gap-3">
                <ImageIcon size={24} />
                SELECT LOCAL IMAGE
                <input type="file" onChange={handleImageUpload} accept="image/*" className="hidden" />
              </label>
            </motion.div>
          ) : (
            <div className="w-full h-full relative">
              {/* Target Outline (Optional visual hint) */}
              <div 
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-5 pointer-events-none"
                style={{ width: containerSize.width, height: containerSize.height }}
              >
                <img src={image?.src} className="w-full h-full object-contain grayscale" />
              </div>

              {pieces.map((piece) => (
                <motion.div
                  key={piece.id}
                  drag
                  dragMomentum={false}
                  onDragStart={() => handleDragStart(piece.groupId)}
                  onDrag={(e, info) => handleDragUpdate(piece.id, info)}
                  onDragEnd={() => handleDragEnd(piece.id)}
                  className={`absolute group cursor-grab active:cursor-grabbing ${draggingGroupId === piece.groupId ? 'z-50' : 'z-10'}`}
                  style={{
                    width: piece.width,
                    height: piece.height,
                    left: 0,
                    top: 0,
                    x: piece.currentX,
                    y: piece.currentY,
                    touchAction: 'none'
                  }}
                >
                  <div 
                    className="w-full h-full relative"
                    style={{
                      backgroundImage: `url(${image.src})`,
                      backgroundSize: `${containerSize.width}px ${containerSize.height}px`,
                      backgroundPosition: `-${piece.idealRelX}px -${piece.idealRelY}px`,
                      clipPath: piece.path ? `path('${piece.path}')` : 'none',
                      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)',
                      filter: draggingGroupId === piece.groupId ? 'drop-shadow(0 10px 15px rgba(0,0,0,0.2))' : 'none'
                    }}
                  >
                    <div className="absolute inset-0 bg-white/10 group-hover:bg-transparent transition-colors" />
                  </div>
                </motion.div>
              ))}

              <AnimatePresence>
                {status === 'solved' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 bg-white/90 backdrop-blur-md z-[100] flex flex-col items-center justify-center text-center"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="p-10 bg-green-50 rounded-full text-green-600 mb-8 border-4 border-green-100 shadow-xl"
                    >
                      <Trophy size={100} strokeWidth={1.5} />
                    </motion.div>
                    <h3 className="text-7xl font-black text-slate-800 mb-4 tracking-tight uppercase">Perfect!</h3>
                    <p className="text-xl text-slate-500 font-bold mb-12">The image is complete.</p>
                    <div className="flex gap-6">
                      <button
                        onClick={() => setStatus('upload')}
                        className="px-10 py-5 bg-slate-100 text-slate-600 rounded-[2rem] font-black hover:bg-slate-200 transition-all active:scale-95"
                      >
                        NEW PUZZLE
                      </button>
                      <button
                        onClick={generatePieces}
                        className="px-16 py-5 bg-purple-600 text-white rounded-[2rem] font-black hover:bg-purple-700 transition-all shadow-2xl shadow-purple-200 active:scale-95 flex items-center gap-3"
                      >
                        <Sparkles size={24} />
                        PLAY AGAIN
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Subtle Hint Footer */}
      <div className="bg-white p-4 border-t border-slate-200 text-center">
        <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
          Images stay on your device • Drag and connect pieces anywhere
        </p>
      </div>
    </div>
  );
};
