import React, { ReactNode } from 'react';
import {
  Clock, Timer, Hourglass, Dices, Coins, Loader,
  Palette, Activity, UserCircle, Users, CalendarDays, Award, Trophy, Sparkles, Gamepad2, PenTool, Zap, Calculator, Banknote, Minus, X, Divide, PieChart, Circle, Cpu, Search, Eye, Rocket, Brain, Grid3X3, Volume2, Music, HelpCircle, Library, Image as ImageIcon, QrCode, History,
  Beaker, Thermometer, Leaf, ArrowDownUp, Droplets,
  MoveRight, Target, TrendingUp, Scale,
  Smile, Layers, Hash, Layout, LucideIcon, Settings2, BookOpen,
  BookA, LayoutGrid
} from 'lucide-react';

import { AnalogueDigitalClock } from '../components/tools/AnalogueDigitalClock';
import { StopWatch } from '../components/tools/StopWatch';
import { CountDown } from '../components/tools/CountDown';
import { ExamClock } from '../components/tools/ExamClock';
import { DailySchedule } from '../components/tools/DailySchedule';
import { EventCalendar } from '../components/tools/EventCalendar';
import { GroupMaker } from '../components/tools/GroupMaker';
import { GroupScoreBoard } from '../components/tools/GroupScoreBoard';
import { MarbleJar } from '../components/tools/MarbleJar';
import { EmotionPicker } from '../components/tools/EmotionPicker';
import { SoundLevel } from '../components/tools/SoundLevel';
import { SeatingPlanGenerator } from '../components/tools/SeatingPlanGenerator';
import { Tournaments } from '../components/tools/Tournaments';
import { FractionTool } from '../components/tools/FractionTool';
import { HundredsChart } from '../components/tools/HundredsChart';
import { MABBlocks } from '../components/tools/MABBlocks';
import { WordManager } from '../components/tools/WordManager';
import { StoryStarters } from '../components/tools/StoryStarters';
import { NumberLine } from '../components/tools/NumberLine';
import { Abacus } from '../components/tools/Abacus';
import { FractionWall } from '../components/tools/FractionWall';
import { DiceRoller } from '../components/tools/DiceRoller';
import { FlipCoin } from '../components/tools/FlipCoin';
import { NumberSpinner } from '../components/tools/NumberSpinner';
import { RandomGroupNameGenerator } from '../components/tools/RandomGroupNameGenerator';
import { ColourPicker } from '../components/tools/ColourPicker';
import { Metronome } from '../components/tools/Metronome';
import { QRCodeGenerator } from '../components/tools/QRCodeGenerator';
import { HigherOrLower } from '../components/tools/HigherOrLower';
import { RevealWord } from '../components/tools/RevealWord';
import { ImageReveal } from '../components/tools/ImageReveal';
import { ColourHunt } from '../components/tools/ColourHunt';
import { WouldYouRather } from '../components/tools/WouldYouRather';
import { SimonSays } from '../components/tools/SimonSays';
import { GuessingGame } from '../components/tools/GuessingGame';
import { Spelling } from '../components/tools/Spelling';
import { LetterTracing } from '../components/tools/LetterTracing';
import { FindTheWord } from '../components/tools/FindTheWord';
import { WordBuilder } from '../components/tools/WordBuilder';
import { Crossword } from '../components/tools/Crossword';
import { TypingGame } from '../components/tools/TypingGame';
import { ReactionTime } from '../components/tools/ReactionTime';
import { ChemicalFireworks } from '../components/tools/ChemicalFireworks';
import { ThermalConduction } from '../components/tools/ThermalConduction';
import { EcosystemSimulation } from '../components/tools/EcosystemSimulation';
import { SpringScales } from '../components/tools/SpringScales';
import { InkDiffusion } from '../components/tools/InkDiffusion';
import { StandingWaveSynthesis } from '../components/tools/StandingWaveSynthesis';
import { SandSimulation } from '../components/tools/SandSimulation';
import NewtonsCradle from '../components/tools/NewtonsCradle';
import PoolGame from '../components/tools/PoolGame';
import { TimesTable } from '../components/tools/TimesTable';
import { MoneyTool } from '../components/tools/MoneyTool';
import { MissingAddition } from '../components/tools/MissingAddition';
import { MissingSubtraction } from '../components/tools/MissingSubtraction';
import { MissingMultiplication } from '../components/tools/MissingMultiplication';
import { MissingDivision } from '../components/tools/MissingDivision';
import { MarbleCounting } from '../components/tools/MarbleCounting';
import { BinaryTool } from '../components/tools/BinaryTool';
import { BalanceEquations } from '../components/tools/BalanceEquations';
import { TeacherMath } from '../components/tools/TeacherMath';
import { SimonGame } from '../components/tools/SimonGame';
import { EmojiMatch } from '../components/tools/EmojiMatch';
import { Sudoku } from '../components/tools/Sudoku';
import ClassRex from '../components/tools/ClassRex';
import { SongMaker } from '../components/tools/SongMaker';
import { Config } from '../components/tools/Config';
import { NamePicker } from '../components/tools/NamePicker';

export interface Tool {
  id: string;
  name: string;
  icon: LucideIcon;
  emoji: string;
  mainSection: string;
  section: string;
  color: string;
  yearRange: [number, number];
  description: string;
  infoContent: ReactNode;
  helpContent?: ReactNode;
  component: React.ComponentType<any>;
  hidden?: boolean;
}

export const sectionIcons: Record<string, LucideIcon> = {
  'Time & Scheduling': Clock,
  'Classroom Management': Users,
  'Teaching Aids': BookOpen,
  'Randomizers': Dices,
  'Utilities': Settings2,
  'Interactive Games': Gamepad2,
  'Literacy': BookA,
  'Math': Calculator,
  'Memory & Games': Brain,
  'Science': Beaker,
  'Arts & Music': Music,
  'Word Management': Library
};

export const sectionKeyMap: Record<string, string> = {
  'Time & Scheduling': 'section.time',
  'Classroom Management': 'section.management',
  'Teaching Aids': 'section.aids',
  'Randomizers': 'section.randomizers',
  'Utilities': 'section.utilities',
  'Interactive Games': 'section.games',
  'Literacy': 'section.literacy',
  'Math': 'section.math',
  'Memory & Games': 'section.memory',
  'Science': 'section.science',
  'Arts & Music': 'section.arts',
  'Word Management': 'section.words'
};

export const sectionEmojis: Record<string, string> = {
  'Time & Scheduling': '⏰',
  'Classroom Management': '🏫',
  'Teaching Aids': '🍎',
  'Randomizers': '🎲',
  'Utilities': '🛠️',
  'Interactive Games': '🎮',
  'Literacy': '📚',
  'Math': '🧮',
  'Memory & Games': '🧠',
  'Science': '🧪',
  'Arts & Music': '🎨',
  'Word Management': '📖'
};

export const tools: Tool[] = [
  // Teacher Tools - Time & Scheduling
  { 
    id: 'clock', 
    name: 'Analogue Digital Clock', 
    icon: Clock, 
    emoji: '🕒', 
    mainSection: 'Teacher Tools', 
    section: 'Time & Scheduling', 
    color: '#ff4757', 
    yearRange: [0, 6],
    description: "Dual-Display Time Teaching Tool",
    infoContent: (
      <div className="space-y-4">
        <p>A versatile clock featuring both traditional analogue and modern digital displays. Toggle between 'Real Time' to show the current system clock or 'Edit Mode' to manually set the time.</p>
        <div className="space-y-2">
          <p><strong>Interactive Hands:</strong> Switch to Manual Mode and drag the clock hands to explore time relationships.</p>
          <p><strong>Natural Language:</strong> Observe how the text display synthesizes the time into conversational English as you move the hands.</p>
        </div>
      </div>
    ),
    component: AnalogueDigitalClock
  },
  { 
    id: 'stopwatch', 
    name: 'Stopwatch', 
    icon: Timer, 
    emoji: '⏱️', 
    mainSection: 'Teacher Tools', 
    section: 'Time & Scheduling', 
    color: '#2ed573', 
    yearRange: [0, 12],
    description: "Precision Timing Suite",
    infoContent: "Track time with millisecond precision. Use the Lap feature to record intermediate times without stopping the main clock. You can export your lap history as a CSV file for data analysis in science experiments or PE activities.",
    component: StopWatch
  },
  { 
    id: 'countdown', 
    name: 'Countdown', 
    icon: Hourglass, 
    emoji: '⏳', 
    mainSection: 'Teacher Tools', 
    section: 'Time & Scheduling', 
    color: '#1e90ff', 
    yearRange: [0, 12],
    description: "Visual Time Management for Lessons",
    infoContent: "Set a timer and choose from multiple visualization modes: a classic circle, a progress bar, a sand timer, or a flip clock. Features audible alarms and a 'Wait-Time' spinner for classroom management.",
    component: CountDown
  },
  { 
    id: 'examclock', 
    name: 'Exam Clock', 
    icon: History, 
    emoji: '📝', 
    mainSection: 'Teacher Tools', 
    section: 'Time & Scheduling', 
    color: '#ffa502', 
    yearRange: [7, 12],
    description: "Structured Timing for Formal Assessments",
    infoContent: "Designed for exams and tests. Includes dedicated 'Reading Time' which pauses the clock automatically, and a configurable 'Warning Period' that pulses the display when time is running low to alert students.",
    component: ExamClock
  },
  { 
    id: 'dailyschedule', 
    name: 'Daily Schedule', 
    icon: Clock, 
    emoji: '📅', 
    mainSection: 'Teacher Tools', 
    section: 'Time & Scheduling', 
    color: '#ff6b81', 
    yearRange: [0, 6],
    description: "Visual Routine & Time Management",
    infoContent: (
      <div className="space-y-4">
        <p>
          <strong className="text-white block mb-1">Visual Progress</strong>
          The blue background on each activity shows real-time progress as the lesson proceeds (only for the current day).
        </p>
        <p>
          <strong className="text-white block mb-1">Persistence</strong>
          Your schedules are saved locally in this browser. You can maintain a different schedule for each day of the week.
        </p>
      </div>
    ),
    component: DailySchedule
  },
  { 
    id: 'eventcalendar', 
    name: 'Event Calendar', 
    icon: CalendarDays, 
    emoji: '🗓️', 
    mainSection: 'Teacher Tools', 
    section: 'Time & Scheduling', 
    color: '#0ea5e9', 
    yearRange: [0, 12],
    description: "Track Milestones & Plan Activities",
    infoContent: (
      <p>Toggle between the Calendar view for planning and the Countdowns view for tracking upcoming milestones in real-time.</p>
    ),
    component: EventCalendar
  },
  
  // Teacher Tools - Classroom Management
  { 
    id: 'groupmaker', 
    name: 'Random Group Maker', 
    icon: Users, 
    emoji: '👥', 
    mainSection: 'Teacher Tools', 
    section: 'Classroom Management', 
    color: '#20bf6b', 
    yearRange: [0, 12],
    description: "Randomized student grouping engine",
    infoContent: "Select a class and choose how you want to group your students. The tool will handle the shuffle for you! Choose between a fixed number of groups or a specific number of students per group.",
    component: GroupMaker
  },
  { 
    id: 'groupscoreboard', 
    name: 'Group Score Board', 
    icon: Award, 
    emoji: '🏆', 
    mainSection: 'Teacher Tools', 
    section: 'Classroom Management', 
    color: '#fa8231', 
    yearRange: [0, 12],
    description: "Friendly Classroom Competition & Points Tracking",
    infoContent: "Keep track of team points with ease. Add, rename, or remove groups to match your lesson needs. Scores are saved automatically and can be reset for each new activity.",
    component: GroupScoreBoard
  },
  { 
    id: 'marblejar', 
    name: 'Marble Jar Reward', 
    icon: Trophy, 
    emoji: '⭐', 
    mainSection: 'Teacher Tools', 
    section: 'Classroom Management', 
    color: '#ff4757', 
    yearRange: [0, 6],
    description: "Behavioral Reward Simulation",
    infoContent: "Click inside the jar to add a marble. Click on an existing marble to remove it. Reach the marble goal to trigger a celebratory reward for the class!",
    component: MarbleJar,
    hidden: true
  },
  { 
    id: 'emotionpicker', 
    name: 'Emotion Picker', 
    icon: Smile, 
    emoji: '😊', 
    mainSection: 'Teacher Tools', 
    section: 'Classroom Management', 
    color: '#2ed573', 
    yearRange: [0, 6],
    description: "Check-in and Emotional Intelligence",
    infoContent: "A simple way for students to express their current emotional state. Select an emoji to see a larger check-in message, promoting emotional awareness and empathy.",
    component: EmotionPicker
  },
  { 
    id: 'soundlevel', 
    name: 'Sound Level', 
    icon: Volume2, 
    emoji: '🔊', 
    mainSection: 'Teacher Tools', 
    section: 'Classroom Management', 
    color: '#1e90ff', 
    yearRange: [0, 12],
    description: "Monitor Classroom Noise Levels Visually",
    infoContent: "Start monitoring to see the real-time volume. The green ring shows current noise, and the grey ring shows a 2-second rolling average. Drag the purple marker on the gauge to set your 'Danger' threshold.",
    component: SoundLevel
  },
  { 
    id: 'seatingplan', 
    name: 'Seating Plan Generator', 
    icon: Grid3X3, 
    emoji: '🪑', 
    mainSection: 'Teacher Tools', 
    section: 'Classroom Management', 
    color: '#ffa502', 
    yearRange: [0, 12],
    description: "Dynamic Classroom Layout Architect",
    infoContent: "Drag and drop desks and tables to match your physical classroom layout. Select a class list to populate the seats, or use the shuffle tool to randomly assign students.",
    component: SeatingPlanGenerator,
    hidden: true
  },
  { 
    id: 'tournaments', 
    name: 'Tournaments', 
    icon: Trophy, 
    emoji: '🏆', 
    mainSection: 'Teacher Tools', 
    section: 'Classroom Management', 
    color: '#6366f1', 
    yearRange: [3, 12],
    description: "Multi-format Bracket & Ranking Engine",
    infoContent: "Run single or double elimination tournaments for your class. Use the Elo system to track skill levels over time. Perfect for classroom games, spelling bees, or sports.",
    component: Tournaments,
    hidden: true
  },

  // Teacher Tools - Teaching Aids
  { 
    id: 'fractiontool', 
    name: 'Fraction Tool', 
    icon: PieChart, 
    emoji: '🍕', 
    mainSection: 'Teacher Tools', 
    section: 'Teaching Aids', 
    color: '#a29bfe', 
    yearRange: [2, 8],
    description: "Interactive Part-Whole Relationship Model",
    infoContent: "Explore fractions using both area models (Circle) and linear models (Number Line) simultaneously. Click directly on the circle segments or the number line to quickly jump to a value.",
    component: FractionTool
  },
  { 
    id: 'hundredschart', 
    name: 'Hundreds Chart', 
    icon: Grid3X3, 
    emoji: '🔢', 
    mainSection: 'Teacher Tools', 
    section: 'Teaching Aids', 
    color: '#fab1a0', 
    yearRange: [0, 6],
    description: "Interactive base-10 exploration and pattern finding",
    infoContent: "Use 'Hide Mode' to conceal numbers for guessing games. Use colors to highlight multiples or skip-counting patterns. Quickly highlight multiples of 2, 3, 5, or 10 with the pattern cascade buttons.",
    component: HundredsChart
  },
  { 
    id: 'mabblocks', 
    name: 'MAB Blocks', 
    icon: Layers, 
    emoji: '🧊', 
    mainSection: 'Teacher Tools', 
    section: 'Teaching Aids', 
    color: '#ffeaa7', 
    yearRange: [0, 6],
    description: "Interactive Base-10 Place Value Simulation",
    infoContent: "Drag blocks from the bank onto the workspace to explore place value. Drag a block off the workspace to remove it. Use the sort button to automatically organize your blocks into hundreds, tens, and ones columns.",
    component: MABBlocks
  },

  { 
    id: 'storystarters', 
    name: 'Story Starters', 
    icon: Sparkles, 
    emoji: '✍️', 
    mainSection: 'Teacher Tools', 
    section: 'Teaching Aids', 
    color: '#ff7675', 
    yearRange: [0, 12],
    description: "Creative Prompts for Narrative Writing",
    infoContent: "Overcome writer's block with aged-tailored creative prompts. Select a year level to get sentences that match the literacy expectations for that age group.",
    component: StoryStarters
  },
  { 
    id: 'numberline', 
    name: 'Number Line', 
    icon: MoveRight, 
    emoji: '📏', 
    mainSection: 'Teacher Tools', 
    section: 'Teaching Aids', 
    color: '#00cec9', 
    yearRange: [0, 12],
    description: "Visualize sequences, addition, and subtraction jumps",
    infoContent: "Click a number to add or remove a pin. Click and drag between two numbers to create a jump. Adjust the range and step size to explore different number scales.",
    component: NumberLine
  },
  { 
    id: 'abacus', 
    name: 'Abacus', 
    icon: Hash, 
    emoji: '🧮', 
    mainSection: 'Teacher Tools', 
    section: 'Teaching Aids', 
    color: '#f43f5e', 
    yearRange: [0, 6],
    description: "Interactive base-10 calculation tool",
    infoContent: "Shift beads across rows to represent numbers from ones to billions. A classic tool for understanding place value and addition.",
    component: Abacus
  },
  { 
    id: 'fractionwall', 
    name: 'Fraction Wall', 
    icon: Layout, 
    emoji: '🧱', 
    mainSection: 'Teacher Tools', 
    section: 'Teaching Aids', 
    color: '#a855f7', 
    yearRange: [2, 10],
    description: "Visual equivalence and comparison engine",
    infoContent: "Compare different fraction layers to find equivalent values. Highlight specific segments to see how they align across the wall.",
    component: FractionWall
  },
  
  // Teacher Tools - Randomizers
  { 
    id: 'diceroller', 
    name: 'Dice Roller', 
    icon: Dices, 
    emoji: '🎲', 
    mainSection: 'Teacher Tools', 
    section: 'Randomizers', 
    color: '#fa8231', 
    yearRange: [0, 12],
    description: "Multi-sided 3D Dice Laboratory",
    infoContent: "Click dice buttons to add them to your pool. You can add up to 24 dice! Roll the pool to see random values and their total sum.",
    component: DiceRoller,
    hidden: true
  },
  { 
    id: 'flipcoin', 
    name: 'Flip Coin', 
    icon: Coins, 
    emoji: '🪙', 
    mainSection: 'Teacher Tools', 
    section: 'Randomizers', 
    color: '#2ed573', 
    yearRange: [0, 12],
    description: "Probability & Chance Simulator",
    infoContent: "Click the coin or flip button to start the toss. The coin uses real physics-based rotation! Track results with the live chart and download data as CSV.",
    component: FlipCoin
  },
  { 
    id: 'numberspinner', 
    name: 'Number Spinner', 
    icon: Loader, 
    emoji: '🎡', 
    mainSection: 'Teacher Tools', 
    section: 'Randomizers', 
    color: '#1e90ff', 
    yearRange: [0, 12],
    description: "Interactive Probability and Random Selection Wheel",
    infoContent: "Set your min and max values. The wheel will automatically divide into segments. Track every spin in history and download CSV report.",
    component: NumberSpinner
  },
  { 
    id: 'groupnamegenerator', 
    name: 'Group Name Generator', 
    icon: Sparkles, 
    emoji: '✨', 
    mainSection: 'Teacher Tools', 
    section: 'Randomizers', 
    color: '#ff7675', 
    yearRange: [0, 12],
    description: "Creative and Inspiring Identity for Student Teams",
    infoContent: "Generate five fun, school-appropriate group names at the click of a button. Perfect for project teams, house groups, or classroom competitive play.",
    component: RandomGroupNameGenerator
  },
  { 
    id: 'namepicker', 
    name: 'Name Picker', 
    icon: Loader, 
    emoji: '🎡', 
    mainSection: 'Teacher Tools', 
    section: 'Randomizers', 
    color: '#ff4757', 
    yearRange: [0, 12],
    description: "Random Student Selector with Wheel & List animations",
    infoContent: "A fun way to pick students for activities. Switch between a spinning wheel and a scrolling list. Load your class lists to pick from your students automatically.",
    component: NamePicker
  },
  
  // Teacher Tools - Utilities
  { 
    id: 'colourpicker', 
    name: 'Colour Picker', 
    icon: Palette, 
    emoji: '🎨', 
    mainSection: 'Teacher Tools', 
    section: 'Utilities', 
    color: '#ff6b81', 
    yearRange: [0, 12],
    description: "Digital Palette & Color Theory Explorer",
    infoContent: (
      <div className="space-y-4">
        <p>A simple tool for selecting and comparing colors. Explore HEX, RGB, and HSL values for any color you choose.</p>
        <p><strong>Palettes:</strong> Generate complementary or analogous color schemes automatically.</p>
      </div>
    ),
    component: ColourPicker
  },
  { 
    id: 'metronome', 
    name: 'Metronome', 
    icon: Activity, 
    emoji: '🎵', 
    mainSection: 'Teacher Tools', 
    section: 'Utilities', 
    color: '#20bf6b', 
    yearRange: [0, 12],
    description: "Precision Rhythmic & Timing Standard",
    infoContent: (
      <div className="space-y-4">
        <p>Keep a steady beat with this precision metronome. Adjust the tempo (BPM) and time signature to suit your music.</p>
        <p><strong>Presets:</strong> Quickly switch between common tempos like Allegro, Moderato, or Adagio.</p>
      </div>
    ),
    component: Metronome,
    hidden: true
  },
  { 
    id: 'qrcodegenerator', 
    name: 'QR Code Generator', 
    icon: QrCode, 
    emoji: '📱', 
    mainSection: 'Teacher Tools', 
    section: 'Utilities', 
    color: '#2ed573', 
    yearRange: [5, 12],
    description: "Instant Digital Gateway & URL Encoder",
    infoContent: (
      <div className="space-y-4">
        <p>Convert any URL or text into a QR code that students can scan. A quick way to share resources or websites.</p>
        <p><strong>Customization:</strong> Change the color and size of the QR code before downloading or presenting it.</p>
      </div>
    ),
    component: QRCodeGenerator,
    hidden: true
  },
  { 
    id: 'config', 
    name: 'Config', 
    icon: Settings2, 
    emoji: '⚙️', 
    mainSection: 'Teacher Tools', 
    section: 'Utilities', 
    color: '#64748b', 
    yearRange: [0, 12],
    description: "System Settings & Class Management",
    infoContent: "Manage your application preferences, class lists, and data backups here.",
    component: Config,
    hidden: true
  },

  // Classroom Games
  { 
    id: 'higherorlower', 
    name: 'Higher Or Lower', 
    icon: TrendingUp, 
    emoji: '⬆️', 
    mainSection: 'Classroom Games', 
    section: 'Interactive Games', 
    color: '#1e90ff', 
    yearRange: [0, 8],
    description: "Numerical Prediction & Probability Challenge",
    infoContent: (
      <div className="space-y-4">
        <p>Guess whether the next card or number will be higher or lower than the current one. A simple way to explore probability and number relationships.</p>
        <p><strong>Streak:</strong> See how many correct guesses you can make in a row!</p>
      </div>
    ),
    component: HigherOrLower
  },
  { 
    id: 'revealword', 
    name: 'Reveal Word', 
    icon: Eye, 
    emoji: '🕵️', 
    mainSection: 'Classroom Games', 
    section: 'Interactive Games', 
    color: '#ffa502', 
    yearRange: [0, 8],
    description: "Incremental Deciphering & Vocabulary Discovery",
    infoContent: (
      <div className="space-y-4">
        <p>A fun way to introduce new vocabulary. The word is hidden, and letters are revealed one by one. Can the students guess the word before it's fully shown?</p>
        <p><strong>Custom Words:</strong> Add your own words or phrases to tailor the game to your current lesson.</p>
      </div>
    ),
    component: RevealWord
  },
  { 
    id: 'imagereveal', 
    name: 'Image Reveal', 
    icon: ImageIcon, 
    emoji: '🖼️', 
    mainSection: 'Classroom Games', 
    section: 'Interactive Games', 
    color: '#a29bfe', 
    yearRange: [0, 8],
    description: "Visual Deduction & Progressive Revelation",
    infoContent: (
      <div className="space-y-4">
        <p>A fun game where an image is slowly revealed. Guess what the image is before it's fully uncovered!</p>
        <p><strong>Modes:</strong> Reveal tiles one by one or use the automatic progressive reveal.</p>
      </div>
    ),
    component: ImageReveal
  },
  { 
    id: 'colourhunt', 
    name: 'Colour Hunt', 
    icon: Palette, 
    emoji: '🔍', 
    mainSection: 'Classroom Games', 
    section: 'Interactive Games', 
    color: '#ff6b81', 
    yearRange: [0, 4],
    description: "Chromatics & Environmental Search Challenge",
    infoContent: (
      <div className="space-y-4">
        <p>Find objects in the classroom or images that match the target color. A great way to learn color names and shades.</p>
        <p><strong>Timer:</strong> Race against the clock to find as many matching colors as possible!</p>
      </div>
    ),
    component: ColourHunt
  },
  { 
    id: 'wouldyourather', 
    name: 'Would You Rather', 
    icon: HelpCircle, 
    emoji: '🤔', 
    mainSection: 'Classroom Games', 
    section: 'Interactive Games', 
    color: '#20bf6b', 
    yearRange: [0, 12],
    description: "A high-engagement debate and ice-breaker tool",
    infoContent: (
      <div className="space-y-4">
        <p>A classic ice-breaker or debate game. Present two choices to the class and have students vote by moving to different sides of the room or raising hands.</p>
        <p><strong>Tailored for Ages:</strong> Questions are carefully selected to be age-appropriate for different year levels.</p>
      </div>
    ),
    component: WouldYouRather
  },
  { 
    id: 'simonsays', 
    name: 'Simon Says (Classroom)', 
    icon: Users, 
    emoji: '🙋', 
    mainSection: 'Classroom Games', 
    section: 'Interactive Games', 
    color: '#fa8231', 
    yearRange: [0, 6],
    description: "A high-energy movement and attention game",
    infoContent: (
      <div className="space-y-4">
        <p>Follow Simon's instructions ONLY if they say "Simon says...". If they don't, stay perfectly still!</p>
        <p><strong>Auto Mode:</strong> Enable Auto Mode to let the tool generate commands automatically at your chosen speed.</p>
      </div>
    ),
    component: SimonSays
  },
  { 
    id: 'guessinggame', 
    name: 'Guessing Game', 
    icon: HelpCircle, 
    emoji: '❓', 
    mainSection: 'Classroom Games', 
    section: 'Interactive Games', 
    color: '#1e90ff', 
    yearRange: [0, 8],
    description: "Multiple choice emoji and pattern quiz",
    infoContent: (
      <div className="space-y-4">
        <p>Select a topic, then you'll be shown an emoji. Guess the correct word that matches the emoji!</p>
        <p><strong>Timer:</strong> You have 10 seconds to answer each question. The faster you answer, the better!</p>
      </div>
    ),
    component: GuessingGame
  },
  
  // Student Tools - Literacy
  { 
    id: 'spelling', 
    name: 'Spelling', 
    icon: PenTool, 
    emoji: '📝', 
    mainSection: 'Student Tools', 
    section: 'Literacy', 
    color: '#ff4757', 
    yearRange: [1, 8],
    description: "Interactive Spelling Practice & Testing",
    infoContent: (
      <div className="space-y-4">
        <p>A comprehensive spelling tool. Create custom lists or use the default ones. Practice spelling words with audio feedback.</p>
        <p><strong>Modes:</strong> Practice mode for learning, and Test mode for evaluation.</p>
      </div>
    ),
    component: Spelling
  },
  { 
    id: 'lettertracing', 
    name: 'Letter Tracing', 
    icon: PenTool, 
    emoji: '✏️', 
    mainSection: 'Student Tools', 
    section: 'Literacy', 
    color: '#1e90ff', 
    yearRange: [0, 2],
    description: "Fine Motor & Grapheme Formation Guide",
    infoContent: (
      <div className="space-y-4">
        <p>Practice writing letters with this interactive tracing tool. Follow the guides to learn correct stroke order.</p>
        <p><strong>Feedback:</strong> Real-time feedback helps students stay within the lines.</p>
      </div>
    ),
    component: LetterTracing
  },
  { 
    id: 'findtheword', 
    name: 'Find The Word', 
    icon: Search, 
    emoji: '🔍', 
    mainSection: 'Student Tools', 
    section: 'Literacy', 
    color: '#ffa502', 
    yearRange: [1, 6],
    description: "Dynamic Word Search & Pattern Recognition",
    infoContent: (
      <div className="space-y-4">
        <p>Find the target words hidden in the grid. Click and drag to select a word. Words can be horizontal, vertical, or diagonal!</p>
        <p><strong>Custom Lists:</strong> Import your own spelling lists to generate unique puzzles.</p>
      </div>
    ),
    component: FindTheWord
  },
  { 
    id: 'wordbuilder', 
    name: 'Word Builder', 
    icon: Sparkles, 
    emoji: '🧩', 
    mainSection: 'Student Tools', 
    section: 'Literacy', 
    color: '#6366f1', 
    yearRange: [0, 4],
    description: "Phonemic Awareness & Syllabic Assembly",
    infoContent: (
      <div className="space-y-4">
        <p>Build words by dragging letters or phonemes into the workspace. Perfect for early literacy and phonics practice.</p>
        <p><strong>Audio:</strong> Hear the sounds of the letters as you build your words.</p>
      </div>
    ),
    component: WordBuilder,
    hidden: true
  },
  { 
    id: 'crossword', 
    name: 'Crossword', 
    icon: Grid3X3, 
    emoji: '🧩', 
    mainSection: 'Student Tools', 
    section: 'Literacy', 
    color: '#a29bfe', 
    yearRange: [2, 12],
    description: "Contextual Vocabulary & Semantic Solving",
    infoContent: (
      <div className="space-y-4">
        <p>Solve crossword puzzles based on different themes or your own custom word lists. Use the clues to fill in the grid.</p>
        <p><strong>Hints:</strong> Get help with a single letter or an entire word if you're stuck.</p>
      </div>
    ),
    component: Crossword
  },
  { 
    id: 'typinggame', 
    name: 'Typing Game', 
    icon: Rocket, 
    emoji: '🚀', 
    mainSection: 'Student Tools', 
    section: 'Literacy', 
    color: '#ff6b81', 
    yearRange: [2, 12],
    description: "WPM Analytics & Character Precision Trainer",
    infoContent: (
      <div className="space-y-4">
        <p>Improve your typing speed and accuracy. Type the words as they appear on the screen before they reach the bottom!</p>
        <p><strong>Stats:</strong> Track your words per minute (WPM) and accuracy percentage.</p>
      </div>
    ),
    component: TypingGame,
    hidden: true
  },
  
  // Student Tools - Science
  { 
    id: 'reactiontime', 
    name: 'Reaction Time', 
    icon: Zap, 
    emoji: '⚡', 
    mainSection: 'Student Tools', 
    section: 'Science', 
    color: '#20bf6b', 
    yearRange: [3, 12],
    description: "Measure and Analyze Response Speed",
    infoContent: (
      <div className="space-y-4">
        <p>Wait for the screen to turn green, then click as fast as you can! Track your reaction time across multiple attempts.</p>
        <p><strong>Analytics:</strong> View your average, best, and worst times in the history panel.</p>
      </div>
    ),
    component: ReactionTime
  },
  { 
    id: 'chemicalfireworks', 
    name: 'Chemical Fireworks', 
    icon: Beaker, 
    emoji: '🧪', 
    mainSection: 'Student Tools', 
    section: 'Science', 
    color: '#fa8231', 
    yearRange: [3, 12],
    description: "Atomic Emission & Spectrometry Lab",
    infoContent: (
      <div className="space-y-4">
        <p>Explore how different chemical elements produce different colors when heated. Learn about atomic emission spectra.</p>
        <p><strong>Experiment:</strong> Drag different elements into the flame to see the resulting firework color.</p>
      </div>
    ),
    component: ChemicalFireworks,
    hidden: true
  },
  { 
    id: 'thermalconduction', 
    name: 'Thermal Conduction', 
    icon: Thermometer, 
    emoji: '🔥', 
    mainSection: 'Student Tools', 
    section: 'Science', 
    color: '#ff4757', 
    yearRange: [5, 12],
    description: "Heat Transfer & Thermodynamics Simulation",
    infoContent: (
      <div className="space-y-4">
        <p>Observe how heat moves through different materials. Compare the conductivity of metals, wood, and other substances.</p>
        <p><strong>Simulation:</strong> Apply heat to one end of a rod and track the temperature change along its length.</p>
      </div>
    ),
    component: ThermalConduction,
    hidden: true
  },
  { 
    id: 'ecosystem', 
    name: 'Ecosystem', 
    icon: Leaf, 
    emoji: '🌳', 
    mainSection: 'Student Tools', 
    section: 'Science', 
    color: '#2ed573', 
    yearRange: [5, 12],
    description: "Biological Interdependence & Population Dynamics",
    infoContent: (
      <div className="space-y-4">
        <p>Model the complex relationships in an ecosystem. Track the populations of producers, consumers, and decomposers over time.</p>
        <p><strong>Balance:</strong> See how changes in one population affect the entire food web.</p>
      </div>
    ),
    component: EcosystemSimulation,
    hidden: true
  },
  { 
    id: 'springscales', 
    name: 'Spring Scales', 
    icon: ArrowDownUp, 
    emoji: '⚖️', 
    mainSection: 'Student Tools', 
    section: 'Science', 
    color: '#6366f1', 
    yearRange: [3, 10],
    description: "Hooke's Law & Force Measurement Lab",
    infoContent: (
      <div className="space-y-4">
        <p>Learn how to measure force using a spring scale. Explore the relationship between mass, gravity, and spring extension.</p>
        <p><strong>Hooke's Law:</strong> Observe how the extension of the spring is proportional to the force applied.</p>
      </div>
    ),
    component: SpringScales,
    hidden: true
  },
  { 
    id: 'inkdiffusion', 
    name: 'Ink Diffusion', 
    icon: Droplets, 
    emoji: '💧', 
    mainSection: 'Student Tools', 
    section: 'Science', 
    color: '#6366f1', 
    yearRange: [3, 10],
    description: "Molecular Motion & Concentration Gradients",
    infoContent: (
      <div className="space-y-4">
        <p>Observe the process of diffusion as ink molecules move through water. Explore how temperature and concentration affect the rate of diffusion.</p>
        <p><strong>Brownian Motion:</strong> Watch how individual particles move randomly to eventually create a uniform distribution.</p>
      </div>
    ),
    component: InkDiffusion
  },
  { 
    id: 'standingwave', 
    name: 'Standing Wave', 
    icon: Activity, 
    emoji: '🌊', 
    mainSection: 'Student Tools', 
    section: 'Science', 
    color: '#3b82f6', 
    yearRange: [7, 12],
    description: "Wave Mechanics & Frequency Simulation",
    infoContent: (
      <div className="space-y-4">
        <p>Explore the physics of standing waves. Adjust frequency and amplitude to see how they affect wave patterns.</p>
        <p><strong>Nodes:</strong> Identify nodes and antinodes in the wave visualization.</p>
      </div>
    ),
    component: StandingWaveSynthesis,
    hidden: true
  },
  { 
    id: 'sandsim', 
    name: 'Sand Simulation', 
    icon: Sparkles, 
    emoji: '🏜️', 
    mainSection: 'Student Tools', 
    section: 'Science', 
    color: '#1e90ff', 
    yearRange: [0, 12],
    description: "Elemental Chemistry & Physics Sandbox",
    infoContent: (
      <div className="space-y-4">
        <p>A particle-based sandbox where different elements interact. Experiment with gravity, heat, and chemistry to see what happens when you mix different materials.</p>
        <p><strong>Emitters:</strong> Use the generator mode to create a continuous stream of elements.</p>
      </div>
    ),
    component: SandSimulation,
    hidden: true
  },
  { 
    id: 'newtonscradle', 
    name: `Newton's Cradle`, 
    icon: Activity, 
    emoji: '⚛️', 
    mainSection: 'Student Tools', 
    section: 'Science', 
    color: '#3b82f6', 
    yearRange: [3, 12],
    description: "Momentum & Energy Conservation Laboratory",
    infoContent: (
      <div className="space-y-4">
        <p>Explore the laws of physics with this classic Newton's Cradle simulation. Observe the transfer of energy and momentum between spheres.</p>
        <p><strong>Variables:</strong> Adjust the number of balls and their masses to see how it affects the collision dynamics.</p>
      </div>
    ),
    component: NewtonsCradle,
    hidden: true
  },
  { 
    id: 'poolgame', 
    name: 'Pool Game', 
    icon: Target, 
    emoji: '🎱', 
    mainSection: 'Student Tools', 
    section: 'Science', 
    color: '#27ae60', 
    yearRange: [3, 12],
    description: "Physics-Based Collision & Momentum Lab",
    infoContent: (
      <div className="space-y-4">
        <p>Explore momentum, collisions, and angles in this physics-based pool simulation. Aim and shoot to sink the balls!</p>
        <p><strong>Trajectories:</strong> Use the real-time prediction lines to plan your shots based on physics principles.</p>
      </div>
    ),
    component: PoolGame
  },
  
  // Student Tools - Math
  { 
    id: 'timestable', 
    name: 'Times Table', 
    icon: Calculator, 
    emoji: '✖️', 
    mainSection: 'Student Tools', 
    section: 'Math', 
    color: '#ffa502', 
    yearRange: [2, 6],
    description: "Multi-modal Rote & Recall Mastery",
    infoContent: (
      <div className="space-y-4">
        <p>Master your multiplication tables through interactive practice. Choose a table to focus on or challenge yourself with the mixed mode.</p>
        <p><strong>Modes:</strong> Sequence mode for learning, and Shuffle mode for testing recall.</p>
      </div>
    ),
    component: TimesTable,
    hidden: true
  },
  { 
    id: 'moneytool', 
    name: 'Money Tool', 
    icon: Banknote, 
    emoji: '💵', 
    mainSection: 'Student Tools', 
    section: 'Math', 
    color: '#a29bfe', 
    yearRange: [1, 6],
    description: "Financial Literacy & Change-making Simulation",
    infoContent: (
      <div className="space-y-4">
        <p>Explore money and learn how to make change. Drag coins and notes to reach the target amount.</p>
        <p><strong>Currencies:</strong> Support for multiple currencies including GBP, USD, and AUD.</p>
      </div>
    ),
    component: MoneyTool
  },
  { 
    id: 'missingaddition', 
    name: 'Missing Addition', 
    icon: Calculator, 
    emoji: '➕', 
    mainSection: 'Student Tools', 
    section: 'Math', 
    color: '#ff6b81', 
    yearRange: [0, 4],
    description: "Algebraic Thinking & Number Bond Recall",
    infoContent: (
      <div className="space-y-4">
        <p>Find the missing number to complete the addition equation. A great way to practice number bonds and inverse operations.</p>
        <p><strong>Difficulty:</strong> Choose between sums up to 10 or 100.</p>
      </div>
    ),
    component: MissingAddition
  },
  { 
    id: 'missingsubtraction', 
    name: 'Missing Subtraction', 
    icon: Minus, 
    emoji: '➖', 
    mainSection: 'Student Tools', 
    section: 'Math', 
    color: '#20bf6b', 
    yearRange: [0, 4],
    description: "Algebraic Thinking & Number Bond Recall",
    infoContent: (
      <div className="space-y-4">
        <p>Find the missing number to complete the subtraction equation.</p>
        <p><strong>Difficulty:</strong> Choose between numbers up to 10 or 100.</p>
      </div>
    ),
    component: MissingSubtraction
  },
  { 
    id: 'missingmultiplication', 
    name: 'Missing Multiplication', 
    icon: X, 
    emoji: '✖️', 
    mainSection: 'Student Tools', 
    section: 'Math', 
    color: '#fa8231', 
    yearRange: [2, 6],
    description: "Algebraic Thinking & Multiplication Fact Mastery",
    infoContent: (
      <div className="space-y-4">
        <p>Find the missing number to complete the multiplication equation.</p>
        <p><strong>Difficulty:</strong> Choose between products up to 10 or 100.</p>
      </div>
    ),
    component: MissingMultiplication
  },
  { 
    id: 'missingdivision', 
    name: 'Missing Division', 
    icon: Divide, 
    emoji: '➗', 
    mainSection: 'Student Tools', 
    section: 'Math', 
    color: '#ff4757', 
    yearRange: [2, 6],
    description: "Algebraic Thinking & Division Fact Mastery",
    infoContent: (
      <div className="space-y-4">
        <p>Find the missing number to complete the division equation.</p>
        <p><strong>Difficulty:</strong> Choose between quotients up to 10 or 100.</p>
      </div>
    ),
    component: MissingDivision
  },
  { 
    id: 'marblecounting', 
    name: 'Marble Counting', 
    icon: Circle, 
    emoji: '🔮', 
    mainSection: 'Student Tools', 
    section: 'Math', 
    color: '#2ed573', 
    yearRange: [0, 2],
    description: "Subitizing & Early Counting Foundations",
    infoContent: (
      <div className="space-y-4">
        <p>A fun way for early learners to practice counting. Count the marbles in the jar and select the correct number.</p>
        <p><strong>Subitizing:</strong> Helps develop the ability to see a small amount of objects and know how many there are without counting.</p>
      </div>
    ),
    component: MarbleCounting
  },
  { 
    id: 'binarynumbers', 
    name: 'Binary Tool', 
    icon: Cpu, 
    emoji: '💻', 
    mainSection: 'Student Tools', 
    section: 'Math', 
    color: '#1e90ff', 
    yearRange: [5, 12],
    description: "Computational Logic & Data Representation",
    infoContent: (
      <div className="space-y-4">
        <p>Learn how computers represent numbers using binary. Toggle the bits to see how the decimal value changes.</p>
        <p><strong>Place Value:</strong> Each bit represents a power of 2, starting from 1 on the right.</p>
      </div>
    ),
    component: BinaryTool,
    hidden: true
  },
  { 
    id: 'balanceequations', 
    name: 'Balance Equations', 
    icon: Scale, 
    emoji: '⚖️', 
    mainSection: 'Student Tools', 
    section: 'Math', 
    color: '#6366f1', 
    yearRange: [4, 10],
    description: "Algebraic Reasoning & Mathematical Equality",
    infoContent: (
      <div className="space-y-4">
        <p>Practice balancing equations by placing weights on both sides of the scale. Learn the concept of equality in algebra.</p>
        <p><strong>Balance:</strong> Both sides of the equation must equal the same value for the scale to balance.</p>
      </div>
    ),
    component: BalanceEquations,
    hidden: true
  },
  { 
    id: 'teachermath', 
    name: 'Cartesian Plane', 
    icon: TrendingUp, 
    emoji: '📉', 
    mainSection: 'Teacher Tools', 
    section: 'Teaching Aids', 
    color: '#0984e3', 
    yearRange: [3, 12],
    description: "Explore coordinates and equations",
    infoContent: "Click the grid to drop points or type equations like 'y = 2x + 1' in the sidebar. Explore coordinates and equations on an interactive Cartesian plane.",
    component: TeacherMath
  },
  
  // Student Tools - Memory & Games
  { 
    id: 'simongame', 
    name: 'Simon Game', 
    icon: Gamepad2, 
    emoji: '🧠', 
    mainSection: 'Student Tools', 
    section: 'Memory & Games', 
    color: '#ffa502', 
    yearRange: [0, 12],
    description: "Pattern Recall & Sequencial Memory Trainer",
    infoContent: (
      <div className="space-y-4">
        <p>Watch the sequence of colors and sounds, then repeat it back in the same order. How long a sequence can you remember?</p>
        <p><strong>Difficulty:</strong> The sequence gets longer with each successful round.</p>
      </div>
    ),
    component: SimonGame
  },
  { 
    id: 'emojimatch', 
    name: 'Emoji Match', 
    icon: Brain, 
    emoji: '🧩', 
    mainSection: 'Student Tools', 
    section: 'Memory & Games', 
    color: '#a29bfe', 
    yearRange: [0, 8],
    description: "Visual Memory & Pattern Recognition Lab",
    infoContent: (
      <div className="space-y-4">
        <p>Test your memory with this emoji-based matching game. Flip cards to find matching pairs and clear the board.</p>
        <p><strong>Grid Size:</strong> Choose different grid sizes to increase the difficulty of the memory challenge.</p>
      </div>
    ),
    component: EmojiMatch
  },
  { 
    id: 'sudoku', 
    name: 'Sudoku', 
    icon: Brain, 
    emoji: '🔢', 
    mainSection: 'Student Tools', 
    section: 'Memory & Games', 
    color: '#ff6b81', 
    yearRange: [2, 12],
    description: "Logical Deductions & Numerical Strategy",
    infoContent: (
      <div className="space-y-4">
        <p>A classic logic puzzle. Fill the grid so that every row, column, and subgrid contains all digits from 1 to 9 (or 1 to 4/6 for easier levels).</p>
        <p><strong>Hints:</strong> Use the hint button if you get stuck, but try to solve it on your own first!</p>
      </div>
    ),
    component: Sudoku,
    hidden: true
  },
  { 
    id: 'classrex', 
    name: 'ClassRex', 
    icon: Rocket, 
    emoji: '🦖', 
    mainSection: 'Student Tools', 
    section: 'Memory & Games', 
    color: '#2ed573', 
    yearRange: [0, 12],
    description: "Endless Runner & Reaction Mastery",
    infoContent: (
      <div className="space-y-4">
        <p>Control ClassRex as they run through the prehistoric world. Jump over obstacles and see how far you can go!</p>
        <p><strong>Difficulty:</strong> The game speed increases over time, testing your reaction speed.</p>
      </div>
    ),
    component: ClassRex,
    hidden: true
  },
  
  // Student Tools - Arts & Music
  { 
    id: 'songmaker', 
    name: 'Song Maker', 
    icon: Music, 
    emoji: '🎵', 
    mainSection: 'Student Tools', 
    section: 'Arts & Music', 
    color: '#fa8231', 
    yearRange: [0, 12],
    description: "Interactive Step Sequencer & Composition Suite",
    infoContent: (
      <div className="space-y-4">
        <p>Create your own music with this interactive step sequencer. Click on the grid to add notes. Choose from different instruments and adjust the tempo.</p>
        <p><strong>Settings:</strong> Change the instrument, scale, and grid size in the settings panel.</p>
      </div>
    ),
    component: SongMaker,
    hidden: true
  },
];

export const mainSections = [
  { 
    title: 'Teacher Tools', 
    subSections: [
      { name: 'Time & Scheduling', emoji: '⏰', icon: Clock },
      { name: 'Classroom Management', emoji: '🏫', icon: Users },
      { name: 'Teaching Aids', emoji: '📚', icon: BookOpen },
      { name: 'Randomizers', emoji: '🎲', icon: Dices },
      { name: 'Utilities', emoji: '🛠️', icon: Settings2 }
    ] 
  },
  { 
    title: 'Classroom Games', 
    subSections: [
      { name: 'Interactive Games', emoji: '🎮', icon: Gamepad2 }
    ] 
  },
  { 
    title: 'Student Tools', 
    subSections: [
      { name: 'Literacy', emoji: '✍️', icon: PenTool },
      { name: 'Math', emoji: '🔢', icon: Calculator },
      { name: 'Memory & Games', emoji: '🧠', icon: Brain },
      { name: 'Science', emoji: '🧪', icon: Beaker },
      { name: 'Arts & Music', emoji: '🎵', icon: Music },
      { name: 'History', emoji: '🏛️', icon: Library }
    ] 
  }
];
