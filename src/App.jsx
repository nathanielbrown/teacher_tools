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
import { EventCountdowns } from './components/tools/EventCountdowns';
import { DailySchedule } from './components/tools/DailySchedule';
import { GroupScoreBoard } from './components/tools/GroupScoreBoard';
import { MarbleJar } from './components/tools/MarbleJar';
import { EmotionPicker } from './components/tools/EmotionPicker';
import { RandomGroupNameGenerator } from './components/tools/RandomGroupNameGenerator';
import { HigherOrLower } from './components/tools/HigherOrLower';
import { Spelling } from './components/tools/Spelling';
import { LetterTracing } from './components/tools/LetterTracing';
import { ReactionTime } from './components/tools/ReactionTime';
import { TimesTable } from './components/tools/TimesTable';
import { MoneyTool } from './components/tools/MoneyTool';
import { MissingAddition } from './components/tools/MissingAddition';
import { MissingSubtraction } from './components/tools/MissingSubtraction';
import { MissingMultiplication } from './components/tools/MissingMultiplication';
import { MissingDivision } from './components/tools/MissingDivision';
import { SimonGame } from './components/tools/SimonGame';
import { FractionTool } from './components/tools/FractionTool';
import { MarbleCounting } from './components/tools/MarbleCounting';
import { BinaryTool } from './components/tools/BinaryTool';
import { FindTheWord } from './components/tools/FindTheWord';

function App() {
  const [currentTool, setCurrentTool] = useState('home');
  const [activeTab, setActiveTab] = useState('Teacher Tools');

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setCurrentTool('home');
  };

  const renderTool = () => {
    switch (currentTool) {
      case 'home': return <Dashboard onNavigate={setCurrentTool} activeTab={activeTab} />;
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
      case 'eventcountdowns': return <EventCountdowns />;
      case 'dailyschedule': return <DailySchedule />;
      case 'groupscoreboard': return <GroupScoreBoard />;
      case 'marblejar': return <MarbleJar />;
      case 'emotionpicker': return <EmotionPicker />;
      case 'groupnamegenerator': return <RandomGroupNameGenerator />;
      case 'higherorlower': return <HigherOrLower />;
      case 'spelling': return <Spelling />;
      case 'lettertracing': return <LetterTracing />;
      case 'reactiontime': return <ReactionTime />;
      case 'timestable': return <TimesTable />;
      case 'moneytool': return <MoneyTool />;
      case 'missingaddition': return <MissingAddition />;
      case 'missingsubtraction': return <MissingSubtraction />;
      case 'missingmultiplication': return <MissingMultiplication />;
      case 'missingdivision': return <MissingDivision />;
      case 'simongame': return <SimonGame />;
      case 'fractiontool': return <FractionTool />;
      case 'marblecounting': return <MarbleCounting />;
      case 'binarynumbers': return <BinaryTool />;
      case 'findtheword': return <FindTheWord />;
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
      <div className="theme-nature-bg">
        <div className="nature-sun" />
        <div className="nature-cloud cloud-1" />
        <div className="nature-cloud cloud-2" />
      </div>
      <Layout onNavigate={setCurrentTool} activeTab={activeTab} onTabChange={handleTabChange} currentTool={currentTool}>
        {renderTool()}
      </Layout>
    </SettingsProvider>
  );
}

export default App;
