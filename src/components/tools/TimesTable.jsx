import React, { useState, useRef, useEffect } from 'react';
import { CheckCircle2, XCircle, Calculator, Info } from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';
import { audioEngine } from '../../utils/audio';
import { ToolHeader } from '../ToolHeader';

export const TimesTable = () => {
  const [selectedRows, setSelectedRows] = useState([2, 3, 4, 5, 10]);
  const [cellStates, setCellStates] = useState(() => {
    const saved = localStorage.getItem('teacherToolsTimesTableMastery');
    return saved ? JSON.parse(saved) : {};
  });
  const [sessionCount, setSessionCount] = useState(1);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [userInput, setUserInput] = useState('');
  const [feedback, setFeedback] = useState(null);

  const { settings } = useSettings();
  const inputRef = useRef(null);

  const drawNextQuestion = (rowsToConsider = selectedRows, states = cellStates) => {
    if (rowsToConsider.length === 0) {
      setCurrentQuestion(null);
      return;
    }

    let candidates = [];
    rowsToConsider.forEach(row => {
      for (let col = 1; col <= 12; col++) {
        const key = `${row}x${col}`;
        const state = states[key] || 'white';
        let weight = 0;
        
        if (state === 'orange') weight = 5;
        else if (state === 'white') weight = 3;
        else if (state === 'light-green') weight = 2;
        else if (state === 'dark-green') weight = 1;
        
        for (let w = 0; w < weight; w++) {
          candidates.push({ row, col, key });
        }
      }
    });

    if (candidates.length > 0) {
      const selected = candidates[Math.floor(Math.random() * candidates.length)];
      if (Math.random() > 0.5) {
        setCurrentQuestion({ a: selected.row, b: selected.col, row: selected.row, col: selected.col, key: selected.key });
      } else {
        setCurrentQuestion({ a: selected.col, b: selected.row, row: selected.row, col: selected.col, key: selected.key });
      }
    } else {
      setCurrentQuestion(null);
    }
  };

  useEffect(() => {
    if (!currentQuestion && selectedRows.length > 0) {
      drawNextQuestion(selectedRows, cellStates);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    localStorage.setItem('teacherToolsTimesTableMastery', JSON.stringify(cellStates));
  }, [cellStates]);

  const toggleRow = (num) => {
    let newRows;
    if (selectedRows.includes(num)) {
      newRows = selectedRows.filter(n => n !== num);
    } else {
      newRows = [...selectedRows, num].sort((a, b) => a - b);
    }
    setSelectedRows(newRows);
    
    if (currentQuestion && !newRows.includes(currentQuestion.row)) {
      drawNextQuestion(newRows, cellStates);
      setFeedback(null);
    } else if (!currentQuestion && newRows.length > 0) {
      drawNextQuestion(newRows, cellStates);
    }
    
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!userInput.trim() || !currentQuestion) return;

    const answer = parseInt(userInput, 10);
    const correctAnswer = currentQuestion.a * currentQuestion.b;
    const key = currentQuestion.key;
    const currentState = cellStates[key] || 'white';
    
    let newState = currentState;

    if (answer === correctAnswer) {
      audioEngine.playTick(settings.soundTheme);
      setFeedback({ type: 'success', msg: 'Correct!' });
      
      if (currentState === 'white' || currentState === 'orange') newState = 'light-green';
      else if (currentState === 'light-green') newState = 'dark-green';
      else if (currentState === 'dark-green') newState = 'dark-green';
      
    } else {
      setFeedback({ type: 'error', msg: `${currentQuestion.a} × ${currentQuestion.b} = ${correctAnswer}` });
      newState = 'orange';
    }

    const nextCellStates = { ...cellStates, [key]: newState };
    setCellStates(nextCellStates);
    setSessionCount(prev => prev + 1);
    setUserInput('');
    drawNextQuestion(selectedRows, nextCellStates);
    
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const gridNumbers = Array.from({ length: 12 }, (_, i) => i + 1);

  const getCellColor = (state) => {
    if (state === 'white' || !state) return 'bg-white border-gray-200';
    if (state === 'orange') return 'bg-orange-500 border-orange-600 shadow-sm';
    if (state === 'light-green') return 'bg-green-400 border-green-500 shadow-sm';
    if (state === 'dark-green') return 'bg-green-700 border-green-800 shadow-sm';
    return 'bg-white border-gray-200';
  };

  return (
    <div className="w-full mx-auto space-y-8 h-full flex flex-col px-4 pt-2 pb-8">
      <ToolHeader
        title="Times Tables"
        icon={Calculator}
        description="Master Multiplication with Spaced Repetition"
        infoContent={
          <>
            <p>
              <strong className="text-white block mb-1">Adaptive Learning</strong>
              The grid tracks your progress. Questions you miss appear more often (Orange), while ones you've mastered (Dark Green) appear less frequently.
            </p>
            <p>
              <strong className="text-white block mb-1">Customization</strong>
              Select or deselect row numbers on the right to focus your practice on specific tables.
            </p>
          </>
        }
      />

      <div className="flex flex-col xl:flex-row gap-8 flex-1 min-h-[600px]">
        {/* Flashcard Area */}
        <div className="flex-1 bg-white p-8 rounded-[3rem] shadow-xl border border-gray-100 flex flex-col items-center justify-center space-y-12">
          
          {selectedRows.length === 0 ? (
             <div className="text-center space-y-4 max-w-sm">
               <h3 className="text-2xl font-bold text-gray-400">No tables selected.</h3>
               <p className="text-gray-400">Select numbers on the right to begin.</p>
             </div>
          ) : currentQuestion ? (
            <div className="w-full flex flex-col items-center space-y-12 animate-in slide-in-from-bottom-8 duration-500">
              <div className="flex flex-col items-center space-y-6 w-full max-w-sm">
                <div className="text-2xl font-bold text-gray-400 uppercase tracking-widest">
                  Question {sessionCount}
                </div>
                <div className="text-8xl leading-none font-black text-text tracking-widest tabular-nums drop-shadow-sm whitespace-nowrap">
                  {currentQuestion.a} × {currentQuestion.b}
                </div>

                <form onSubmit={handleSubmit} className="w-full space-y-4">
                  <input
                    ref={inputRef}
                    type="number"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    className="w-full text-center text-6xl font-black p-8 border-4 border-gray-200 rounded-3xl focus:ring-8 focus:ring-primary/20 focus:border-primary transition-all tabular-nums shadow-inner bg-gray-50/50"
                    placeholder="?"
                    autoFocus
                  />
                  <button type="submit" className="hidden">Submit</button>
                </form>
              </div>

              <div className="h-20 w-full flex items-center justify-center">
                {feedback && (
                  <div key={Date.now()} className={`px-8 py-4 rounded-full flex items-center gap-4 animate-in fade-in slide-in-from-bottom-2 shadow-md ${
                    feedback.type === 'success' ? 'bg-green-100 text-green-700 border-2 border-green-200' : 'bg-red-100 text-red-700 border-2 border-red-200'
                  }`}>
                    {feedback.type === 'success' ? <CheckCircle2 size={32} className="text-green-600" /> : <XCircle size={32} className="text-red-600" />}
                    <span className="font-black text-2xl">{feedback.msg}</span>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>

        {/* Compact Mastery Grid Area */}
        <div className="w-full xl:w-[450px] bg-white rounded-[3rem] shadow-xl border border-gray-100 p-8 flex flex-col shrink-0 items-center">
          <h3 className="text-lg font-bold text-gray-400 uppercase tracking-wider mb-8">Mastery Grid</h3>
          
          <div className="flex-1 flex flex-col items-center justify-center w-full">
            {/* Grid container */}
            <div className="space-y-1">
              {/* Header row */}
              <div className="flex space-x-1 items-center mb-2">
                <div className="w-10 h-8 mr-2 flex-shrink-0"></div>
                {gridNumbers.map(col => (
                  <div key={col} className="w-6 h-6 flex items-center justify-center font-bold text-gray-400 text-xs">
                    {col}
                  </div>
                ))}
              </div>

              {gridNumbers.map(row => {
                const isSelected = selectedRows.includes(row);
                
                return (
                  <div key={row} className="flex space-x-1 items-center">
                    {/* Y-Axis Toggle Button */}
                    <button
                      onClick={() => toggleRow(row)}
                      className={`w-10 h-8 rounded-md flex items-center justify-center font-black text-xs transition-all duration-200 border-2 mr-2 ${
                        isSelected 
                          ? 'bg-blue-500 text-white border-blue-600 shadow-sm scale-105 z-10'
                          : 'bg-gray-100 text-gray-500 border-transparent hover:bg-gray-200'
                      }`}
                    >
                      {row}
                    </button>

                    {/* Row Cells (Colors Only) */}
                    {gridNumbers.map(col => {
                      const state = cellStates[`${row}x${col}`];
                      return (
                        <div 
                          key={`${row}x${col}`} 
                          className={`w-6 h-6 rounded-md border transition-colors duration-300 ${getCellColor(state)}`}
                          title={`${row} × ${col}`}
                        />
                      )
                    })}
                  </div>
                )
              })}
            </div>
          </div>
          
          {/* Legend */}
          <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-3 text-xs font-bold text-gray-500">
             <div className="flex items-center gap-2"><div className="w-4 h-4 bg-white border border-gray-200 rounded-sm"></div> Not Tested</div>
             <div className="flex items-center gap-2"><div className="w-4 h-4 bg-orange-500 border border-orange-600 rounded-sm"></div> Needs Work</div>
             <div className="flex items-center gap-2"><div className="w-4 h-4 bg-green-400 border border-green-500 rounded-sm"></div> Correct</div>
             <div className="flex items-center gap-2"><div className="w-4 h-4 bg-green-700 border border-green-800 rounded-sm"></div> Mastered</div>
          </div>
        </div>
      </div>
    </div>
  );
};
