import React, { useState } from 'react';
import { SettingsProvider } from './contexts/SettingsContext';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';

import { AnalogueDigitalClock } from './components/tools/AnalogueDigitalClock';
import { StopWatch } from './components/tools/StopWatch';
import { CountDown } from './components/tools/CountDown';
import { ExamClock } from './components/tools/ExamClock';
import { DiceRoller } from './components/tools/DiceRoller';
import { FlipCoin } from './components/tools/FlipCoin';
import { NumberSpinner } from './components/tools/NumberSpinner';
import { ColourPicker } from './components/tools/ColourPicker';
import { Metronome } from './components/tools/Metronome';
import { StoryStarters } from './components/tools/StoryStarters';
import { CasinoSpinner } from './components/tools/CasinoSpinner';
import { WheelSpinner } from './components/tools/WheelSpinner';
import { GroupMaker } from './components/tools/GroupMaker';

function App() {
  const [currentTool, setCurrentTool] = useState('home');

  const renderTool = () => {
    switch (currentTool) {
      case 'home': return <Dashboard onNavigate={setCurrentTool} />;
      case 'clock': return <AnalogueDigitalClock />;
      case 'stopwatch': return <StopWatch />;
      case 'countdown': return <CountDown />;
      case 'examclock': return <ExamClock />;
      case 'diceroller': return <DiceRoller />;
      case 'flipcoin': return <FlipCoin />;
      case 'numberspinner': return <NumberSpinner />;
      case 'colourpicker': return <ColourPicker />;
      case 'metronome': return <Metronome />;
      case 'storystarters': return <StoryStarters />;
      case 'casinospinner': return <CasinoSpinner />;
      case 'wheelspinner': return <WheelSpinner />;
      case 'groupmaker': return <GroupMaker />;
      default:
        return (
          <div className="flex flex-col items-center justify-center h-full">
            <h2 className="text-3xl font-bold mb-4 text-primary">Tool in Development</h2>
            <button
              onClick={() => setCurrentTool('home')}
              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        );
    }
  };

  return (
    <SettingsProvider>
      <Layout onNavigate={setCurrentTool}>
        {renderTool()}
      </Layout>
    </SettingsProvider>
  );
}

export default App;
