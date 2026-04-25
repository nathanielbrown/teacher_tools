import React, { useState, useEffect } from 'react';
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
import { NamePicker } from './components/tools/NamePicker';
import { GroupMaker } from './components/tools/GroupMaker';
import { EventCalendar } from './components/tools/EventCalendar';
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
import { RevealWord } from './components/tools/RevealWord';
import { TypingGame } from './components/tools/TypingGame';
import { EmojiMatch } from './components/tools/EmojiMatch';
import { HundredsChart } from './components/tools/HundredsChart';
import { MABBlocks } from './components/tools/MABBlocks';
import { ColourHunt } from './components/tools/ColourHunt';
import { WouldYouRather } from './components/tools/WouldYouRather';
import { SimonSays } from './components/tools/SimonSays';
import { SoundLevel } from './components/tools/SoundLevel';
import { SongMaker } from './components/tools/SongMaker';
import { SandSimulation } from './components/tools/SandSimulation';
import { Crossword } from './components/tools/Crossword';
import { WordManager } from './components/tools/WordManager';
import { Sudoku } from './components/tools/Sudoku';
import { ImageReveal } from './components/tools/ImageReveal';
import { ChemicalFireworks } from './components/tools/ChemicalFireworks';
import { ThermalConduction } from './components/tools/ThermalConduction';
import { EcosystemSimulation } from './components/tools/EcosystemSimulation';
import { StandingWaveSynthesis } from './components/tools/StandingWaveSynthesis';
import { InkDiffusion } from './components/tools/InkDiffusion';
import { Boggle } from './components/tools/Boggle';
import { GuessingGame } from './components/tools/GuessingGame';
import { TeacherMath } from './components/tools/TeacherMath';
import { BalanceEquations } from './components/tools/BalanceEquations';
import { NumberLine } from './components/tools/NumberLine';




import { SpringScales } from './components/tools/SpringScales';
import { QRCodeGenerator } from './components/tools/QRCodeGenerator';
import { SeatingPlanGenerator } from './components/tools/SeatingPlanGenerator';
import { Tournaments } from './components/tools/Tournaments';
// import { MindMap } from './components/tools/MindMap';




function App() {
  const [currentTool, setCurrentTool] = useState(() => localStorage.getItem('teacherToolsCurrentTool') || 'home');
  const [activeTab, setActiveTab] = useState(() => localStorage.getItem('teacherToolsActiveTab') || 'Teacher Tools');

  useEffect(() => {
    localStorage.setItem('teacherToolsCurrentTool', currentTool);
  }, [currentTool]);

  useEffect(() => {
    localStorage.setItem('teacherToolsActiveTab', activeTab);
  }, [activeTab]);

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
      case 'namepicker': return <NamePicker />;
      case 'groupmaker': return <GroupMaker />;
      case 'eventcalendar': return <EventCalendar />;
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
      case 'simonsays': return <SimonSays />;
      case 'soundlevel': return <SoundLevel />;
      case 'songmaker': return <SongMaker />;
      case 'sandsim': return <SandSimulation />;
      case 'crossword': return <Crossword />;
      case 'wordmanager': return <WordManager />;
      case 'sudoku': return <Sudoku />;
      case 'imagereveal': return <ImageReveal />;
      case 'chemicalfireworks': return <ChemicalFireworks />;
      case 'thermalconduction': return <ThermalConduction />;
      case 'ecosystem': return <EcosystemSimulation />;
      case 'standingwave': return <StandingWaveSynthesis />;
      case 'inkdiffusion': return <InkDiffusion />;
      case 'boggle': return <Boggle />;




      case 'springscales': return <SpringScales />;
      case 'qrcodegenerator': return <QRCodeGenerator />;
      case 'seatingplan': return <SeatingPlanGenerator />;
      case 'tournaments': return <Tournaments />;
//       case 'mindmap': return <MindMap />;


      case 'fractiontool': return <FractionTool />;
      case 'marblecounting': return <MarbleCounting />;
      case 'binarynumbers': return <BinaryTool />;
      case 'numberline': return <NumberLine />;
      case 'cartesianplane': return <TeacherMath />;
      case 'findtheword': return <FindTheWord />;
      case 'revealword': return <RevealWord />;
      case 'typinggame': return <TypingGame />;
      case 'emojimatch': return <EmojiMatch />;
      case 'hundredschart': return <HundredsChart />;
      case 'mabblocks': return <MABBlocks />;
      case 'colourhunt': return <ColourHunt />;
      case 'wouldyourather': return <WouldYouRather />;
      case 'guessinggame': return <GuessingGame />;
      case 'balanceequations': return <BalanceEquations />;
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
      <div className="theme-early-years-bg" />
      <Layout onNavigate={setCurrentTool} activeTab={activeTab} onTabChange={handleTabChange} currentTool={currentTool}>
        {renderTool()}
      </Layout>
    </SettingsProvider>
  );
}

export default App;
