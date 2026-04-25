import {
  Clock, Timer, Hourglass, AlertCircle, Dices, Coins, Loader,
  Palette, Activity, BookOpen, UserCircle, Users, CalendarDays, Award, Star, Sparkles, Gamepad2, PenTool, Zap, Calculator, Banknote, Minus, X, Divide, PieChart, Circle, Cpu, Search, Eye, Rocket, Brain, Grid3X3, Columns, Volume2, Music, HelpCircle, Cloud, User, Library, Image as ImageIcon, QrCode, History, GitBranch,
  Beaker, Thermometer, Leaf, ArrowDownUp, FlaskConical, Droplets, Share2, Settings2,
  Calendar, BookA, TimerReset, Cuboid, Lightbulb, MessageCircle, TrendingUp, Trophy, Scale, MoveRight, Target
} from 'lucide-react';

export const tools = [
  // Teacher Tools - Time & Scheduling
  { id: 'clock', name: 'Analogue & Digital Clock', icon: Clock, emoji: '🕒', mainSection: 'Teacher Tools', section: 'Time & Scheduling', color: '#ff4757', yearRange: [0, 6] },
  { id: 'stopwatch', name: 'Stop Watch', icon: Timer, emoji: '⏱️', mainSection: 'Teacher Tools', section: 'Time & Scheduling', color: '#2ed573', yearRange: [0, 12] },
  { id: 'countdown', name: 'Count Down', icon: TimerReset, emoji: '⏳', mainSection: 'Teacher Tools', section: 'Time & Scheduling', color: '#1e90ff', yearRange: [0, 12] },
  { id: 'examclock', name: 'Exam Clock', icon: AlertCircle, emoji: '📝', mainSection: 'Teacher Tools', section: 'Time & Scheduling', color: '#ffa502', yearRange: [7, 12] },
  { id: 'dailyschedule', name: 'Daily Schedule', icon: Calendar, emoji: '📅', mainSection: 'Teacher Tools', section: 'Time & Scheduling', color: '#ff6b81', yearRange: [0, 6] },
  { id: 'eventcalendar', name: 'Event Calendar', icon: CalendarDays, emoji: '🗓️', mainSection: 'Teacher Tools', section: 'Time & Scheduling', color: '#0ea5e9', yearRange: [0, 12] },
  
  // Teacher Tools - Classroom Management
  { id: 'groupmaker', name: 'Random Group Maker', icon: Users, emoji: '👥', mainSection: 'Teacher Tools', section: 'Classroom Management', color: '#20bf6b', yearRange: [0, 12] },
  { id: 'groupscoreboard', name: 'Group Score Board', icon: Award, emoji: '🏆', mainSection: 'Teacher Tools', section: 'Classroom Management', color: '#fa8231', yearRange: [0, 12] },
  { id: 'marblejar', name: 'Marble Jar Reward', icon: Star, emoji: '⭐', mainSection: 'Teacher Tools', section: 'Classroom Management', color: '#ff4757', yearRange: [0, 6] },
  { id: 'emotionpicker', name: 'Emotion Picker', icon: UserCircle, emoji: '😊', mainSection: 'Teacher Tools', section: 'Classroom Management', color: '#2ed573', yearRange: [0, 6] },
  { id: 'soundlevel', name: 'Sound Level', icon: Volume2, emoji: '🔊', mainSection: 'Teacher Tools', section: 'Classroom Management', color: '#1e90ff', yearRange: [0, 12] },
  { id: 'seatingplan', name: 'Seating Plan Generator', icon: Grid3X3, emoji: '🪑', mainSection: 'Teacher Tools', section: 'Classroom Management', color: '#ffa502', yearRange: [0, 12] },
  { id: 'tournaments', name: 'Tournaments', icon: Trophy, emoji: '🏆', mainSection: 'Teacher Tools', section: 'Classroom Management', color: '#6366f1', yearRange: [3, 12] },

  // Teacher Tools - Teaching Aids
  { id: 'fractiontool', name: 'Fraction Visualizer', icon: PieChart, emoji: '🍕', mainSection: 'Teacher Tools', section: 'Teaching Aids', color: '#a29bfe', yearRange: [2, 8] },
  { id: 'hundredschart', name: 'Interactive Hundreds Chart', icon: Grid3X3, emoji: '🔢', mainSection: 'Teacher Tools', section: 'Teaching Aids', color: '#ff6b81', yearRange: [0, 4] },
  { id: 'mabblocks', name: 'MAB Blocks Lab', icon: Cuboid, emoji: '🧱', mainSection: 'Teacher Tools', section: 'Teaching Aids', color: '#20bf6b', yearRange: [0, 4] },
  { id: 'wordmanager', name: 'Word Manager', icon: BookA, emoji: '📚', mainSection: 'Teacher Tools', section: 'Teaching Aids', color: '#2ed573', yearRange: [0, 12] },
  { id: 'storystarters', name: 'Story Starters', icon: Lightbulb, emoji: '📖', mainSection: 'Teacher Tools', section: 'Teaching Aids', color: '#fa8231', yearRange: [1, 8] },
  { id: 'numberline', name: 'Interactive Number Line', icon: MoveRight, emoji: '📏', mainSection: 'Teacher Tools', section: 'Teaching Aids', color: '#6366f1', yearRange: [0, 6] },
  
  // Teacher Tools - Randomizers
  { id: 'diceroller', name: 'Dice Roller', icon: Dices, emoji: '🎲', mainSection: 'Teacher Tools', section: 'Randomizers', color: '#fa8231', yearRange: [0, 12] },
  { id: 'flipcoin', name: 'Flip a Coin', icon: Coins, emoji: '🪙', mainSection: 'Teacher Tools', section: 'Randomizers', color: '#ff4757', yearRange: [0, 12] },
  { id: 'numberspinner', name: 'Number Spinner', icon: Loader, emoji: '🎡', mainSection: 'Teacher Tools', section: 'Randomizers', color: '#2ed573', yearRange: [0, 12] },
  { id: 'namepicker', name: 'Name Picker', icon: UserCircle, emoji: '🎡', mainSection: 'Teacher Tools', section: 'Randomizers', color: '#ffa502', yearRange: [0, 12] },
  { id: 'groupnamegenerator', name: 'Group Name Generator', icon: Sparkles, emoji: '✨', mainSection: 'Teacher Tools', section: 'Randomizers', color: '#a29bfe', yearRange: [0, 12] },
  
  // Teacher Tools - Utilities
  { id: 'colourpicker', name: 'Colour Picker', icon: Palette, emoji: '🎨', mainSection: 'Teacher Tools', section: 'Utilities', color: '#ff6b81', yearRange: [0, 12] },
  { id: 'metronome', name: 'Metronome', icon: Activity, emoji: '🎵', mainSection: 'Teacher Tools', section: 'Utilities', color: '#20bf6b', yearRange: [0, 12] },
  { id: 'qrcodegenerator', name: 'QR Code Generator', icon: QrCode, emoji: '📱', mainSection: 'Teacher Tools', section: 'Utilities', color: '#2ed573', yearRange: [5, 12] },

  // Classroom Games
  { id: 'higherorlower', name: 'Higher or Lower', icon: Gamepad2, emoji: '⬆️', mainSection: 'Classroom Games', section: 'Interactive Games', color: '#1e90ff', yearRange: [0, 8] },
  { id: 'revealword', name: 'Reveal Word', icon: Eye, emoji: '🕵️', mainSection: 'Classroom Games', section: 'Interactive Games', color: '#ffa502', yearRange: [0, 8] },
  { id: 'imagereveal', name: 'Image Reveal', icon: ImageIcon, emoji: '🖼️', mainSection: 'Classroom Games', section: 'Interactive Games', color: '#a29bfe', yearRange: [0, 8] },
  { id: 'colourhunt', name: 'Colour Hunt', icon: Palette, emoji: '🔍', mainSection: 'Classroom Games', section: 'Interactive Games', color: '#ff6b81', yearRange: [0, 4] },
  { id: 'wouldyourather', name: 'Would You Rather', icon: HelpCircle, emoji: '🤔', mainSection: 'Classroom Games', section: 'Interactive Games', color: '#20bf6b', yearRange: [0, 12] },
  { id: 'simonsays', name: 'Simon Says (Classroom)', icon: User, emoji: '🙋', mainSection: 'Classroom Games', section: 'Interactive Games', color: '#fa8231', yearRange: [0, 6] },
  { id: 'guessinggame', name: 'Guessing Game', icon: HelpCircle, emoji: '❓', mainSection: 'Classroom Games', section: 'Interactive Games', color: '#1e90ff', yearRange: [0, 8] },
  
  // Student Tools - Literacy
  { id: 'spelling', name: 'Spelling Practice', icon: PenTool, emoji: '📝', mainSection: 'Student Tools', section: 'Literacy', color: '#ff4757', yearRange: [1, 8] },
  { id: 'boggle', name: 'Boggle Challenge', icon: Sparkles, emoji: '🎲', mainSection: 'Student Tools', section: 'Literacy', color: '#6366f1', yearRange: [2, 12] },
  { id: 'lettertracing', name: 'Letter Tracing', icon: PenTool, emoji: '✏️', mainSection: 'Student Tools', section: 'Literacy', color: '#1e90ff', yearRange: [0, 2] },
  { id: 'findtheword', name: 'Find the Word', icon: Search, emoji: '🔍', mainSection: 'Student Tools', section: 'Literacy', color: '#ffa502', yearRange: [1, 6] },
  { id: 'wordbuilder', name: 'Word Builder', icon: Sparkles, emoji: '🧩', mainSection: 'Student Tools', section: 'Literacy', color: '#6366f1', yearRange: [0, 4] },
  { id: 'crossword', name: 'Crossword', icon: Grid3X3, emoji: '🧩', mainSection: 'Student Tools', section: 'Literacy', color: '#a29bfe', yearRange: [2, 12] },
  { id: 'typinggame', name: 'Typing Galaxy', icon: Rocket, emoji: '🚀', mainSection: 'Student Tools', section: 'Literacy', color: '#ff6b81', yearRange: [2, 12] },
  
  // Student Tools - Science
  { id: 'reactiontime', name: 'Reaction Time', icon: Zap, emoji: '⚡', mainSection: 'Student Tools', section: 'Science', color: '#20bf6b', yearRange: [3, 12] },
  { id: 'chemicalfireworks', name: 'Chemical Fireworks', icon: Beaker, emoji: '🧪', mainSection: 'Student Tools', section: 'Science', color: '#fa8231', yearRange: [3, 12] },
  { id: 'thermalconduction', name: 'Thermal Conduction', icon: Thermometer, emoji: '🔥', mainSection: 'Student Tools', section: 'Science', color: '#ff4757', yearRange: [5, 12] },
  { id: 'ecosystem', name: 'Ecosystem Simulation', icon: Leaf, emoji: '🌳', mainSection: 'Student Tools', section: 'Science', color: '#2ed573', yearRange: [5, 12] },
  { id: 'springscales', name: 'Spring Scales', icon: ArrowDownUp, emoji: '⚖️', mainSection: 'Student Tools', section: 'Science', color: '#6366f1', yearRange: [3, 10] },
  { id: 'inkdiffusion', name: 'Ink Diffusion', icon: Droplets, emoji: '💧', mainSection: 'Student Tools', section: 'Science', color: '#6366f1', yearRange: [3, 10] },
  { id: 'standingwave', name: 'Standing Wave Synthesis', icon: Activity, emoji: '🌊', mainSection: 'Student Tools', section: 'Science', color: '#3b82f6', yearRange: [7, 12] },
  { id: 'sandsim', name: 'Sand Simulation', icon: Sparkles, emoji: '🏜️', mainSection: 'Student Tools', section: 'Science', color: '#1e90ff', yearRange: [0, 12] },
  { id: 'newtonscradle', name: "Newton's Cradle", icon: Zap, emoji: '⚛️', mainSection: 'Student Tools', section: 'Science', color: '#3b82f6', yearRange: [3, 12] },
  { id: 'poolgame', name: 'Physics Pool', icon: Target, emoji: '🎱', mainSection: 'Student Tools', section: 'Science', color: '#27ae60', yearRange: [3, 12] },
  
  // Student Tools - Math
  { id: 'timestable', name: 'Times Tables', icon: Calculator, emoji: '✖️', mainSection: 'Student Tools', section: 'Math', color: '#ffa502', yearRange: [2, 6] },
  { id: 'moneytool', name: 'Money Tool', icon: Banknote, emoji: '💵', mainSection: 'Student Tools', section: 'Math', color: '#a29bfe', yearRange: [1, 6] },
  { id: 'missingaddition', name: 'Missing Addition', icon: Calculator, emoji: '➕', mainSection: 'Student Tools', section: 'Math', color: '#ff6b81', yearRange: [0, 4] },
  { id: 'missingsubtraction', name: 'Missing Subtraction', icon: Minus, emoji: '➖', mainSection: 'Student Tools', section: 'Math', color: '#20bf6b', yearRange: [0, 4] },
  { id: 'missingmultiplication', name: 'Missing Multiplier', icon: X, emoji: '✖️', mainSection: 'Student Tools', section: 'Math', color: '#fa8231', yearRange: [2, 6] },
  { id: 'missingdivision', name: 'Missing Division', icon: Divide, emoji: '➗', mainSection: 'Student Tools', section: 'Math', color: '#ff4757', yearRange: [2, 6] },
  { id: 'marblecounting', name: 'Marble Counting', icon: Circle, emoji: '🔮', mainSection: 'Student Tools', section: 'Math', color: '#2ed573', yearRange: [0, 2] },
  { id: 'binarynumbers', name: 'Binary Numbers', icon: Cpu, emoji: '💻', mainSection: 'Student Tools', section: 'Math', color: '#1e90ff', yearRange: [5, 12] },
  { id: 'balanceequations', name: 'Balance Equations', icon: Scale, emoji: '⚖️', mainSection: 'Student Tools', section: 'Math', color: '#6366f1', yearRange: [4, 10] },
  { id: 'cartesianplane', name: 'Cartesian Plane', icon: TrendingUp, emoji: '📉', mainSection: 'Teacher Tools', section: 'Teaching Aids', color: '#6366f1', yearRange: [5, 10] },
  
  // Student Tools - Memory & Games
  { id: 'simongame', name: 'Simon Says', icon: Gamepad2, emoji: '🧠', mainSection: 'Student Tools', section: 'Memory & Games', color: '#ffa502', yearRange: [0, 12] },
  { id: 'emojimatch', name: 'Emoji Match', icon: Brain, emoji: '🧩', mainSection: 'Student Tools', section: 'Memory & Games', color: '#a29bfe', yearRange: [0, 8] },
  { id: 'sudoku', name: 'Sudoku', icon: Grid3X3, emoji: '🔢', mainSection: 'Student Tools', section: 'Memory & Games', color: '#ff6b81', yearRange: [2, 12] },
  { id: 'classrex', name: 'ClassRex Runner', icon: Gamepad2, emoji: '🦖', mainSection: 'Student Tools', section: 'Memory & Games', color: '#2ed573', yearRange: [0, 12] },
  
  // Student Tools - Arts & Music
  { id: 'songmaker', name: 'Song Maker', icon: Music, emoji: '🎵', mainSection: 'Student Tools', section: 'Arts & Music', color: '#fa8231', yearRange: [0, 12] },
];

export const mainSections = [
  { title: 'Teacher Tools', subSections: ['Time & Scheduling', 'Classroom Management', 'Teaching Aids', 'Randomizers', 'Utilities'] },
  { title: 'Classroom Games', subSections: ['Interactive Games'] },
  { title: 'Student Tools', subSections: ['Literacy', 'Math', 'Memory & Games', 'Science', 'Arts & Music', 'History'] }
];
