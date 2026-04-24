import React, { useState, useRef, useEffect } from 'react';
import { RefreshCw, CheckCircle, ChevronLeft, ChevronRight, PenTool } from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';
import { audioEngine } from '../../utils/audio';
import { ToolHeader } from '../ToolHeader';

export const LetterTracing = () => {
  const charSets = {
    upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    lower: 'abcdefghijklmnopqrstuvwxyz',
    numbers: '0123456789'
  };

  const getRandomLetter = (set) => {
    const chars = charSets[set];
    return chars[Math.floor(Math.random() * chars.length)];
  };

  const [charSet, setCharSet] = useState('upper');
  const [currentLetter, setCurrentLetter] = useState(() => getRandomLetter('upper'));
  const [score, setScore] = useState(null);
  
  const [mastery, setMastery] = useState(() => {
    const saved = localStorage.getItem('teacherToolsLetterMastery');
    return saved ? JSON.parse(saved) : {};
  });
  
  const baseCanvasRef = useRef(null);
  const drawCanvasRef = useRef(null);
  const hiddenCanvasRef = useRef(null);

  const { settings } = useSettings();
  
  // Drawing state
  const isDrawing = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const userPath = useRef([]); // Store paths so we can redraw for evaluation

  const CANVAS_SIZE = 400;
  const FONT_SIZE = 300;
  const BRUSH_SIZE = 16;

  const getCoordinates = (e) => {
    const canvas = drawCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    let clientX, clientY;
    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const drawTemplate = () => {
    const canvas = baseCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    ctx.font = `100 ${FONT_SIZE}px "Segoe UI Light", "Helvetica Neue Light", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Draw the gray template for the user to trace
    ctx.fillStyle = '#f3f4f6'; // gray-100
    ctx.strokeStyle = '#e5e7eb'; // gray-200
    ctx.lineWidth = 4;
    
    // Draw text centered
    ctx.strokeText(currentLetter, CANVAS_SIZE / 2, CANVAS_SIZE / 2 + 20);
    ctx.fillText(currentLetter, CANVAS_SIZE / 2, CANVAS_SIZE / 2 + 20);
    
    // Add dashed outline to make it look like tracing paper
    ctx.setLineDash([8, 8]);
    ctx.strokeStyle = '#d1d5db'; // gray-300
    ctx.lineWidth = 2;
    ctx.strokeText(currentLetter, CANVAS_SIZE / 2, CANVAS_SIZE / 2 + 20);
    ctx.setLineDash([]);
  };

  const clearDrawing = () => {
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    userPath.current = [];
    setScore(null);
  };

  useEffect(() => {
    localStorage.setItem('teacherToolsLetterMastery', JSON.stringify(mastery));
  }, [mastery]);

  useEffect(() => {
    drawTemplate();
    clearDrawing();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentLetter]);

  const startDrawing = (e) => {
    e.preventDefault(); // Prevent scrolling on touch
    isDrawing.current = true;
    const pos = getCoordinates(e);
    lastPos.current = pos;
    userPath.current.push([{ x: pos.x, y: pos.y }]); // Start a new stroke
  };

  const draw = (e) => {
    e.preventDefault();
    if (!isDrawing.current) return;
    const pos = getCoordinates(e);
    
    const canvas = drawCanvasRef.current;
    const ctx = canvas.getContext('2d');
    
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = settings.themeColor || '#3b82f6';
    ctx.lineWidth = BRUSH_SIZE;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    lastPos.current = pos;
    userPath.current[userPath.current.length - 1].push({ x: pos.x, y: pos.y });
  };

  const stopDrawing = () => {
    isDrawing.current = false;
  };

  // Draws the user path onto a given context with a specific line width
  const renderPathToContext = (ctx, path, lineWidth) => {
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    if (path.length === 0) return;
    
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    path.forEach(stroke => {
      if (stroke.length < 2) {
        // Draw dot
        ctx.beginPath();
        ctx.arc(stroke[0].x, stroke[0].y, lineWidth / 2, 0, Math.PI * 2);
        ctx.fill();
        return;
      }
      ctx.beginPath();
      ctx.moveTo(stroke[0].x, stroke[0].y);
      for (let i = 1; i < stroke.length; i++) {
        ctx.lineTo(stroke[i].x, stroke[i].y);
      }
      ctx.stroke();
    });
  };

  const checkScore = () => {
    if (userPath.current.length === 0) {
      setScore({ accuracy: 0, msg: "You didn't draw anything!" });
      return;
    }

    const hiddenCanvas = hiddenCanvasRef.current;
    const ctx = hiddenCanvas.getContext('2d', { willReadFrequently: true });

    // 1. Get Exact Template for Coverage
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    ctx.font = `100 ${FONT_SIZE}px "Segoe UI Light", "Helvetica Neue Light", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#000000';
    ctx.fillText(currentLetter, CANVAS_SIZE / 2, CANVAS_SIZE / 2 + 20);
    const exactTemplateData = ctx.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE).data;

    // 2. Get Safe Zone for Stay Inside
    ctx.lineWidth = 40; // Safe zone for wobbly writing
    ctx.strokeStyle = '#000000';
    ctx.strokeText(currentLetter, CANVAS_SIZE / 2, CANVAS_SIZE / 2 + 20);
    const safeZoneData = ctx.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE).data;

    // 3. Get Danger Zone (Too Far Outside)
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    ctx.lineWidth = 120; // Anything beyond 60px from the letter is the danger zone
    ctx.strokeText(currentLetter, CANVAS_SIZE / 2, CANVAS_SIZE / 2 + 20);
    ctx.fillText(currentLetter, CANVAS_SIZE / 2, CANVAS_SIZE / 2 + 20);
    const dangerZoneData = ctx.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE).data;

    // 4. Get User Stroke Pixels (Standard width)
    renderPathToContext(ctx, userPath.current, BRUSH_SIZE);
    const userStandardData = ctx.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE).data;

    // 5. Get User Stroke Pixels (Dilated width for coverage)
    renderPathToContext(ctx, userPath.current, 60); 
    const userDilatedData = ctx.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE).data;

    let userPixelsTotal = 0;
    let userPixelsInsideSafe = 0;
    let userPixelsWayOutside = 0;
    
    let templatePixelsTotal = 0;
    let templatePixelsCovered = 0;

    for (let i = 0; i < exactTemplateData.length; i += 4) {
      const isExactTemplate = exactTemplateData[i + 3] > 64;
      const isSafeZone = safeZoneData[i + 3] > 64;
      const isDangerZone = dangerZoneData[i + 3] > 64;
      
      const isUserStandard = userStandardData[i + 3] > 64;
      const isUserDilated = userDilatedData[i + 3] > 64;

      // Stay Inside Logic
      if (isUserStandard) {
        userPixelsTotal++;
        if (isSafeZone) {
          userPixelsInsideSafe++;
        }
        if (!isDangerZone) {
          userPixelsWayOutside++;
        }
      }

      // Coverage Logic
      if (isExactTemplate) {
        templatePixelsTotal++;
        if (isUserDilated) {
          templatePixelsCovered++;
        }
      }
    }

    const stayInsideScore = userPixelsTotal === 0 ? 0 : userPixelsInsideSafe / userPixelsTotal;
    const coverageScore = templatePixelsTotal === 0 ? 0 : templatePixelsCovered / templatePixelsTotal;
    
    // Base score using geometric mean
    let baseAccuracy = Math.sqrt(stayInsideScore * coverageScore) * 100;
    
    // Take marks away for going too far outside
    if (userPixelsWayOutside > 0) {
      const wayOutsideRatio = userPixelsWayOutside / userPixelsTotal;
      baseAccuracy -= (wayOutsideRatio * 200); // 10% of pixels way outside drops score by 20%
    }

    const finalAccuracy = Math.max(0, Math.round(baseAccuracy));

    let msg = '';
    if (finalAccuracy > 90) msg = "Perfect!";
    else if (finalAccuracy > 70) msg = "Great job!";
    else if (finalAccuracy > 50) msg = "Good try!";
    else msg = "Keep practicing!";

    if (finalAccuracy > 80) audioEngine.playTick(settings.soundTheme);
    else audioEngine.playTick(settings.soundTheme);

    setScore({ accuracy: finalAccuracy, msg, details: { stayInsideScore, coverageScore } });
    
    setMastery(prev => ({
      ...prev,
      [currentLetter]: Math.max(prev[currentLetter] || 0, finalAccuracy)
    }));
  };



  const nextLetter = () => {
    const set = charSets[charSet];
    const idx = set.indexOf(currentLetter);
    if (idx === -1 || idx === set.length - 1) setCurrentLetter(set[0]);
    else setCurrentLetter(set[idx + 1]);
  };

  const prevLetter = () => {
    const set = charSets[charSet];
    const idx = set.indexOf(currentLetter);
    if (idx <= 0) setCurrentLetter(set[set.length - 1]);
    else setCurrentLetter(set[idx - 1]);
  };

  const changeCharSet = (newSet) => {
    setCharSet(newSet);
    setCurrentLetter(charSets[newSet][0]);
  };

  return (
    <div className="w-full mx-auto px-4 pt-2 pb-8 h-full flex flex-col gap-8">
      <ToolHeader
        title="Letter Tracing"
        icon={PenTool}
        description="Develop Handwriting Skills through Interactive Guidance"
        infoContent={
          <>
            <p>
              <strong className="text-white block mb-1">Trace and Learn</strong>
              Follow the dashed lines to trace uppercase letters, lowercase letters, and numbers. Click "Check Score" to see how accurately you stayed within the lines.
            </p>
            <p>
              <strong className="text-white block mb-1">Track Progress</strong>
              The mastery grid at the bottom shows your best score for each character, helping you identify which ones need more practice.
            </p>
          </>
        }
      >
        <div className="flex items-center gap-2">
          <div className="flex bg-white p-1 rounded-xl border border-gray-200 shadow-sm sm:mr-4">
            <button 
              onClick={() => changeCharSet('upper')}
              className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${charSet === 'upper' ? 'bg-primary text-white shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              ABC
            </button>
            <button 
              onClick={() => changeCharSet('lower')}
              className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${charSet === 'lower' ? 'bg-primary text-white shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              abc
            </button>
            <button 
              onClick={() => changeCharSet('numbers')}
              className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${charSet === 'numbers' ? 'bg-primary text-white shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              123
            </button>
          </div>

          <div className="flex items-center gap-2 bg-white p-1 rounded-xl shadow-sm border border-gray-100">
            <button onClick={prevLetter} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
              <ChevronLeft size={20} className="text-gray-600" />
            </button>
            <div className="text-xl font-black w-10 text-center text-text">{currentLetter}</div>
            <button onClick={nextLetter} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
              <ChevronRight size={20} className="text-gray-600" />
            </button>
          </div>
        </div>
      </ToolHeader>

      <div className="flex-1 bg-white rounded-[3rem] shadow-xl border border-gray-100 p-8 flex flex-col lg:flex-row gap-12 items-center justify-center">
        
        {/* Canvas Area */}
        <div className="relative w-[400px] h-[400px] shrink-0 touch-none">
          {/* Base canvas (template) */}
          <canvas
            ref={baseCanvasRef}
            width={CANVAS_SIZE}
            height={CANVAS_SIZE}
            className="absolute top-0 left-0 w-full h-full rounded-3xl border-4 border-gray-100 shadow-inner bg-white pointer-events-none"
          />
          
          {/* Draw canvas (user interaction) */}
          <canvas
            ref={drawCanvasRef}
            width={CANVAS_SIZE}
            height={CANVAS_SIZE}
            className="absolute top-0 left-0 w-full h-full cursor-crosshair"
            onPointerDown={startDrawing}
            onPointerMove={draw}
            onPointerUp={stopDrawing}
            onPointerOut={stopDrawing}
            onPointerCancel={stopDrawing}
          />

          {/* Hidden canvas for evaluation */}
          <canvas
            ref={hiddenCanvasRef}
            width={CANVAS_SIZE}
            height={CANVAS_SIZE}
            className="hidden"
          />
        </div>

        {/* Controls & Score Area */}
        <div className="flex flex-col items-center justify-center space-y-8 w-full max-w-sm">
          {score ? (
            <div className="text-center space-y-4 animate-in zoom-in duration-300">
              <div className="relative w-48 h-48 mx-auto flex items-center justify-center bg-gray-50 rounded-full border-8 border-primary/20">
                <div className="text-6xl font-black text-primary">{score.accuracy}%</div>
              </div>
              <h3 className="text-3xl font-bold text-text">{score.msg}</h3>
              
              <div className="grid grid-cols-2 gap-4 w-full mt-4">
                <button
                  onClick={clearDrawing}
                  className="py-4 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                >
                  <RefreshCw size={20} /> Retry
                </button>
                <button
                  onClick={() => {
                    let nextLetter = getRandomLetter(charSet);
                    while (nextLetter === currentLetter) {
                      nextLetter = getRandomLetter(charSet);
                    }
                    setCurrentLetter(nextLetter);
                    clearDrawing();
                  }}
                  className="py-4 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                >
                  Next <ChevronRight size={20} />
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center space-y-6 w-full">
              <div className="bg-primary/10 p-6 rounded-2xl border border-primary/20">
                <p className="text-primary font-bold text-lg">Trace the letter perfectly!</p>
              </div>

              <div className="grid grid-cols-2 gap-4 w-full">
                <button
                  onClick={clearDrawing}
                  className="py-4 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                >
                  <RefreshCw size={20} /> Clear
                </button>
                <button
                  onClick={checkScore}
                  className="py-4 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                >
                  <CheckCircle size={20} /> Check Score
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mastery Grid Area */}
      <div className="bg-white rounded-[3rem] shadow-xl border border-gray-100 p-8 w-full mt-8 flex flex-col items-center">
        <h3 className="text-xl font-bold text-gray-400 uppercase tracking-wider mb-8 text-center">Mastery Progress</h3>
        
        <div className="space-y-6 w-full overflow-x-auto pb-4">
          
          <div className="flex items-center min-w-max gap-4">
            <span className="font-bold text-gray-400 w-12 text-right">ABC</span>
            <div className="flex flex-nowrap gap-0.5 sm:gap-1">
              {charSets.upper.split('').map(char => {
                const charScore = mastery[char] || 0;
                return (
                  <button
                    key={char}
                    onClick={() => { setCharSet('upper'); setCurrentLetter(char); }}
                    className={`w-7 h-7 sm:w-8 sm:h-8 shrink-0 rounded-md sm:rounded-lg font-black text-xs sm:text-sm shadow-sm border overflow-hidden relative flex items-center justify-center hover:scale-105 transition-all ${
                      currentLetter === char ? 'ring-2 sm:ring-4 ring-primary border-primary z-20' : 'border-gray-200'
                    }`}
                  >
                    <div 
                      className="absolute inset-0 z-0 opacity-80" 
                      style={{ background: `linear-gradient(to top, #15803d ${charScore}%, #f9fafb ${charScore}%)` }} 
                    />
                    <span className={`relative z-10 ${charScore > 50 ? 'text-white' : 'text-gray-500'}`}>{char}</span>
                  </button>
                )
              })}
            </div>
          </div>
          
          <div className="flex items-center min-w-max gap-4">
            <span className="font-bold text-gray-400 w-12 text-right">abc</span>
            <div className="flex flex-nowrap gap-0.5 sm:gap-1">
              {charSets.lower.split('').map(char => {
                const charScore = mastery[char] || 0;
                return (
                  <button
                    key={char}
                    onClick={() => { setCharSet('lower'); setCurrentLetter(char); }}
                    className={`w-7 h-7 sm:w-8 sm:h-8 shrink-0 rounded-md sm:rounded-lg font-black text-xs sm:text-sm shadow-sm border overflow-hidden relative flex items-center justify-center hover:scale-105 transition-all ${
                      currentLetter === char ? 'ring-2 sm:ring-4 ring-primary border-primary z-20' : 'border-gray-200'
                    }`}
                  >
                    <div 
                      className="absolute inset-0 z-0 opacity-80" 
                      style={{ background: `linear-gradient(to top, #15803d ${charScore}%, #f9fafb ${charScore}%)` }} 
                    />
                    <span className={`relative z-10 ${charScore > 50 ? 'text-white' : 'text-gray-500'}`}>{char}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex items-center min-w-max gap-4">
            <span className="font-bold text-gray-400 w-12 text-right">123</span>
            <div className="flex flex-nowrap gap-0.5 sm:gap-1">
              {charSets.numbers.split('').map(char => {
                const charScore = mastery[char] || 0;
                return (
                  <button
                    key={char}
                    onClick={() => { setCharSet('numbers'); setCurrentLetter(char); }}
                    className={`w-7 h-7 sm:w-8 sm:h-8 shrink-0 rounded-md sm:rounded-lg font-black text-xs sm:text-sm shadow-sm border overflow-hidden relative flex items-center justify-center hover:scale-105 transition-all ${
                      currentLetter === char ? 'ring-2 sm:ring-4 ring-primary border-primary z-20' : 'border-gray-200'
                    }`}
                  >
                    <div 
                      className="absolute inset-0 z-0 opacity-80" 
                      style={{ background: `linear-gradient(to top, #15803d ${charScore}%, #f9fafb ${charScore}%)` }} 
                    />
                    <span className={`relative z-10 ${charScore > 50 ? 'text-white' : 'text-gray-500'}`}>{char}</span>
                  </button>
                )
              })}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
