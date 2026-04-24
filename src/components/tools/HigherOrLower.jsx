import React, { useState } from 'react';
import { ArrowUp, ArrowDown, Check, RotateCcw, Trophy } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useSettings } from '../../contexts/SettingsContext';
import { audioEngine } from '../../utils/audio';
import { ToolHeader } from '../ToolHeader';

export const HigherOrLower = () => {
  const [difficulty, setDifficulty] = useState(100);
  const [target, setTarget] = useState(null);
  const [guessInput, setGuessInput] = useState('');
  const [log, setLog] = useState([]);
  const [status, setStatus] = useState('setup'); // 'setup', 'playing', 'won'

  const { settings } = useSettings();

  const startGame = (max) => {
    setDifficulty(max);
    setTarget(Math.floor(Math.random() * max) + 1);
    setLog([]);
    setStatus('playing');
    setGuessInput('');
  };

  const handleGuess = (e) => {
    e.preventDefault();
    const guess = parseInt(guessInput, 10);
    if (isNaN(guess)) return;

    let result = '';
    if (guess === target) {
      result = 'Correct';
      setStatus('won');
      audioEngine.playAlarm(settings.soundTheme);
      
      const end = Date.now() + 3 * 1000;
      const colors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];

      (function frame() {
        confetti({
          particleCount: 15,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: colors
        });
        confetti({
          particleCount: 15,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: colors
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      }());
    } else if (guess < target) {
      result = 'Higher';
    } else {
      result = 'Lower';
    }

    setLog([{ guess, result }, ...log]);
    setGuessInput('');
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 pt-2 pb-8 h-full flex flex-col gap-8">
      <ToolHeader
        title="Higher or Lower"
        icon={Trophy}
        description="A Classic Number Guessing Challenge"
        infoContent={
          <>
            <p>
              <strong className="text-white block mb-1">How to Play</strong>
              Select a difficulty level, then try to guess the secret number. The app will tell you if the target is higher or lower than your guess.
            </p>
            <p>
              <strong className="text-white block mb-1">Difficulty</strong>
              Choose between 1-10 (easy), 1-100 (medium), or 1-1000 (hard) to test your estimation and logical reasoning skills.
            </p>
          </>
        }
      />

      {status === 'setup' && (
        <div className="bg-white p-8 rounded-2xl shadow-md border border-gray-100 max-w-xl mx-auto text-center space-y-6 animate-in fade-in zoom-in duration-300">
          <h3 className="text-xl font-semibold text-text">Select Difficulty</h3>
          <p className="text-gray-500">I will pick a number between 1 and your chosen difficulty. You have to guess it!</p>
          <div className="flex justify-center gap-4">
            {[10, 100, 1000].map(max => (
              <button
                key={max}
                onClick={() => startGame(max)}
                className="px-6 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-colors shadow-sm"
              >
                1 to {max}
              </button>
            ))}
          </div>
        </div>
      )}

      {(status === 'playing' || status === 'won') && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-8 duration-500">
          <div className="bg-white p-8 rounded-2xl shadow-md border border-gray-100 flex flex-col items-center justify-center space-y-8 min-h-[400px]">
            <div className="text-center space-y-2">
              <p className="text-gray-500 font-medium">Guessing a number between</p>
              <p className="text-3xl font-bold text-primary">1 and {difficulty}</p>
            </div>

            {status === 'playing' ? (
              <form onSubmit={handleGuess} className="flex flex-col items-center w-full max-w-xs space-y-4">
                <input
                  type="number"
                  min="1"
                  max={difficulty}
                  value={guessInput}
                  onChange={(e) => setGuessInput(e.target.value)}
                  className="w-full text-center text-5xl p-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-primary/20 focus:border-primary transition-all font-mono"
                  placeholder="?"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={!guessInput}
                  className="w-full py-4 bg-primary text-white text-xl font-bold rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Guess!
                </button>
              </form>
            ) : (
              <div className="flex flex-col items-center space-y-6 animate-in zoom-in duration-500">
                <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center text-green-500">
                  <Trophy size={48} />
                </div>
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-text">You got it!</h3>
                  <p className="text-gray-500">The number was <span className="font-bold text-primary">{target}</span>.</p>
                  <p className="text-gray-500 font-medium mt-1">It took you {log.length} guesses.</p>
                </div>
                <button
                  onClick={() => setStatus('setup')}
                  className="flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-semibold"
                >
                  <RotateCcw size={20} /> Play Again
                </button>
              </div>
            )}
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100 flex flex-col h-[500px]">
            <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-100">
              <h3 className="text-xl font-semibold text-text">Guess Log</h3>
              <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-bold">
                {log.length} Guesses
              </span>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-3 pr-2">
              {log.length === 0 ? (
                <div className="h-full flex items-center justify-center text-gray-400 italic">
                  No guesses yet
                </div>
              ) : (
                log.map((entry, idx) => (
                  <div key={idx} className={`flex items-center justify-between p-4 rounded-xl border animate-in slide-in-from-right-4 duration-300 ${
                    entry.result === 'Correct' ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                  }`}>
                    <span className="text-xl font-bold text-text tabular-nums">{entry.guess}</span>
                    <div className="flex items-center gap-2 font-semibold">
                      {entry.result === 'Higher' && <><ArrowUp className="text-blue-500" /> <span className="text-blue-600">Higher</span></>}
                      {entry.result === 'Lower' && <><ArrowDown className="text-orange-500" /> <span className="text-orange-600">Lower</span></>}
                      {entry.result === 'Correct' && <><Check className="text-green-500" /> <span className="text-green-600">Correct!</span></>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
