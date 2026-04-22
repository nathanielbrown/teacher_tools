import {
  Clock, Timer, Hourglass, AlertCircle, Dices, Coins, Loader,
  Palette, Activity, BookOpen, UserCircle, Users, CalendarDays, Award, Star, Sparkles, Gamepad2, PenTool, Zap, Calculator, Banknote, Minus, X, Divide, PieChart, Circle, Cpu, Search, Eye, Rocket, Brain, Grid3X3, Columns, Volume2, Music, HelpCircle, Cloud, User, Library, Image as ImageIcon, QrCode, History, GitBranch,
  Beaker, Thermometer, Leaf, ArrowDownUp, FlaskConical, Droplets, Share2, Settings2
} from 'lucide-react';

export const tools = [
  // Word Management
  { id: 'wordmanager', name: 'Word Manager', icon: Library, emoji: '📚', mainSection: 'All', section: 'Word Management', color: '#2ed573' },

  // Teacher Tools - Time Management
  { id: 'clock', name: 'Analogue & Digital Clock', icon: Clock, emoji: '🕒', mainSection: 'Teacher Tools', section: 'Time Management', color: '#ff4757' },
  { id: 'stopwatch', name: 'Stop Watch', icon: Timer, emoji: '⏱️', mainSection: 'Teacher Tools', section: 'Time Management', color: '#2ed573' },
  { id: 'countdown', name: 'Count Down', icon: Hourglass, emoji: '⏳', mainSection: 'Teacher Tools', section: 'Time Management', color: '#1e90ff' },
  { id: 'examclock', name: 'Exam Clock', icon: AlertCircle, emoji: '📝', mainSection: 'Teacher Tools', section: 'Time Management', color: '#ffa502' },
  { id: 'eventcountdowns', name: 'Event Countdowns', icon: CalendarDays, emoji: '🗓️', mainSection: 'Teacher Tools', section: 'Time Management', color: '#a29bfe' },
  
  // Teacher Tools - Classroom Management
  { id: 'dailyschedule', name: 'Daily Schedule', icon: Clock, emoji: '📅', mainSection: 'Teacher Tools', section: 'Classroom Management', color: '#ff6b81' },
  { id: 'groupmaker', name: 'Random Group Maker', icon: Users, emoji: '👥', mainSection: 'Teacher Tools', section: 'Classroom Management', color: '#20bf6b' },
  { id: 'groupscoreboard', name: 'Group Score Board', icon: Award, emoji: '🏆', mainSection: 'Teacher Tools', section: 'Classroom Management', color: '#fa8231' },
  { id: 'marblejar', name: 'Marble Jar Reward', icon: Star, emoji: '⭐', mainSection: 'Teacher Tools', section: 'Classroom Management', color: '#ff4757' },
  { id: 'emotionpicker', name: 'Emotion Picker', icon: UserCircle, emoji: '😊', mainSection: 'Teacher Tools', section: 'Classroom Management', color: '#2ed573' },
  { id: 'soundlevel', name: 'Sound Level', icon: Volume2, emoji: '🔊', mainSection: 'Teacher Tools', section: 'Classroom Management', color: '#1e90ff' },
  { id: 'seatingplan', name: 'Seating Plan Generator', icon: Grid3X3, emoji: '🪑', mainSection: 'Teacher Tools', section: 'Classroom Management', color: '#ffa502' },

  // Teacher Tools - Mathematics
  { id: 'fractiontool', name: 'Fraction Visualizer', icon: PieChart, emoji: '🍕', mainSection: 'Teacher Tools', section: 'Mathematics', color: '#a29bfe' },
  { id: 'hundredschart', name: 'Interactive Hundreds Chart', icon: Grid3X3, emoji: '🔢', mainSection: 'Teacher Tools', section: 'Mathematics', color: '#ff6b81' },
  { id: 'mabblocks', name: 'MAB Blocks Lab', icon: Columns, emoji: '🧱', mainSection: 'Teacher Tools', section: 'Mathematics', color: '#20bf6b' },
  
  // Teacher Tools - Randomizers
  { id: 'diceroller', name: 'Dice Roller', icon: Dices, emoji: '🎲', mainSection: 'Teacher Tools', section: 'Randomizers', color: '#fa8231' },
  { id: 'flipcoin', name: 'Flip a Coin', icon: Coins, emoji: '🪙', mainSection: 'Teacher Tools', section: 'Randomizers', color: '#ff4757' },
  { id: 'numberspinner', name: 'Number Spinner', icon: Loader, emoji: '🎡', mainSection: 'Teacher Tools', section: 'Randomizers', color: '#2ed573' },
  { id: 'casinospinner', name: 'Name Picker (Casino)', icon: UserCircle, emoji: '🎰', mainSection: 'Teacher Tools', section: 'Randomizers', color: '#1e90ff' },
  { id: 'wheelspinner', name: 'Name Picker (Wheel)', icon: Loader, emoji: '🎡', mainSection: 'Teacher Tools', section: 'Randomizers', color: '#ffa502' },
  { id: 'groupnamegenerator', name: 'Group Name Generator', icon: Sparkles, emoji: '✨', mainSection: 'Teacher Tools', section: 'Randomizers', color: '#a29bfe' },
  
  // Teacher Tools - Other
  { id: 'colourpicker', name: 'Colour Picker', icon: Palette, emoji: '🎨', mainSection: 'Teacher Tools', section: 'Other', color: '#ff6b81' },
  { id: 'metronome', name: 'Metronome', icon: Activity, emoji: '🎵', mainSection: 'Teacher Tools', section: 'Other', color: '#20bf6b' },
  { id: 'storystarters', name: 'Story Starters', icon: BookOpen, emoji: '📖', mainSection: 'Teacher Tools', section: 'Other', color: '#fa8231' },
  { id: 'wordcloud', name: 'Word Cloud', icon: Cloud, emoji: '☁️', mainSection: 'Teacher Tools', section: 'Other', color: '#ff4757' },
  { id: 'qrcodegenerator', name: 'QR Code Generator', icon: QrCode, emoji: '📱', mainSection: 'Teacher Tools', section: 'Other', color: '#2ed573' },

  // Classroom Games
  { id: 'higherorlower', name: 'Higher or Lower', icon: Gamepad2, emoji: '⬆️', mainSection: 'Classroom Games', section: 'Games', color: '#1e90ff' },
  { id: 'revealword', name: 'Reveal Word', icon: Eye, emoji: '🕵️', mainSection: 'Classroom Games', section: 'Games', color: '#ffa502' },
  { id: 'imagereveal', name: 'Image Reveal', icon: ImageIcon, emoji: '🖼️', mainSection: 'Classroom Games', section: 'Games', color: '#a29bfe' },
  { id: 'colourhunt', name: 'Colour Hunt', icon: Palette, emoji: '🔍', mainSection: 'Classroom Games', section: 'Games', color: '#ff6b81' },
  { id: 'wouldyourather', name: 'Would You Rather', icon: HelpCircle, emoji: '🤔', mainSection: 'Classroom Games', section: 'Games', color: '#20bf6b' },
  { id: 'simonsays', name: 'Simon Says (Classroom)', icon: User, emoji: '🙋', mainSection: 'Classroom Games', section: 'Games', color: '#fa8231' },
  
  // Student Tools - Literacy
  { id: 'spelling', name: 'Spelling Practice', icon: PenTool, emoji: '📝', mainSection: 'Student Tools', section: 'Literacy', color: '#ff4757' },
  { id: 'lettertracing', name: 'Letter Tracing', icon: PenTool, emoji: '✏️', mainSection: 'Student Tools', section: 'Literacy', color: '#1e90ff' },
  { id: 'findtheword', name: 'Find the Word', icon: Search, emoji: '🔍', mainSection: 'Student Tools', section: 'Literacy', color: '#ffa502' },
  { id: 'crossword', name: 'Crossword', icon: Grid3X3, emoji: '🧩', mainSection: 'Student Tools', section: 'Literacy', color: '#a29bfe' },
  { id: 'typinggame', name: 'Typing Galaxy', icon: Rocket, emoji: '🚀', mainSection: 'Student Tools', section: 'Literacy', color: '#ff6b81' },
  
  // Student Tools - Science
  { id: 'reactiontime', name: 'Reaction Time', icon: Zap, emoji: '⚡', mainSection: 'Student Tools', section: 'Science', color: '#20bf6b' },
  { id: 'chemicalfireworks', name: 'Chemical Fireworks', icon: Beaker, emoji: '🧪', mainSection: 'Student Tools', section: 'Science', color: '#fa8231' },
  { id: 'thermalconduction', name: 'Thermal Conduction', icon: Thermometer, emoji: '🔥', mainSection: 'Student Tools', section: 'Science', color: '#ff4757' },
  { id: 'ecosystem', name: 'Ecosystem Simulation', icon: Leaf, emoji: '🌳', mainSection: 'Student Tools', section: 'Science', color: '#2ed573' },
  { id: 'springscales', name: 'Spring Scales', icon: ArrowDownUp, emoji: '⚖️', mainSection: 'Student Tools', section: 'Science', color: '#6366f1' },
  { id: 'inkdiffusion', name: 'Ink Diffusion', icon: Droplets, emoji: '💧', mainSection: 'Student Tools', section: 'Science', color: '#6366f1' },
  { id: 'standingwave', name: 'Standing Wave Synthesis', icon: Activity, emoji: '🌊', mainSection: 'Student Tools', section: 'Science', color: '#3b82f6' },
  { id: 'molecularmodels', name: 'Molecular Models', icon: Share2, emoji: '⚛️', mainSection: 'Student Tools', section: 'Science', color: '#8b5cf6' },
  { id: 'sandsim', name: 'Sand Simulation', icon: Sparkles, emoji: '🏜️', mainSection: 'Student Tools', section: 'Science', color: '#1e90ff' },
  
  // Student Tools - Math
  { id: 'timestable', name: 'Times Tables', icon: Calculator, emoji: '✖️', mainSection: 'Student Tools', section: 'Math', color: '#ffa502' },
  { id: 'moneytool', name: 'Money Tool', icon: Banknote, emoji: '💵', mainSection: 'Student Tools', section: 'Math', color: '#a29bfe' },
  { id: 'missingaddition', name: 'Missing Addition', icon: Calculator, emoji: '➕', mainSection: 'Student Tools', section: 'Math', color: '#ff6b81' },
  { id: 'missingsubtraction', name: 'Missing Subtraction', icon: Minus, emoji: '➖', mainSection: 'Student Tools', section: 'Math', color: '#20bf6b' },
  { id: 'missingmultiplication', name: 'Missing Multiplier', icon: X, emoji: '✖️', mainSection: 'Student Tools', section: 'Math', color: '#fa8231' },
  { id: 'missingdivision', name: 'Missing Division', icon: Divide, emoji: '➗', mainSection: 'Student Tools', section: 'Math', color: '#ff4757' },
  { id: 'marblecounting', name: 'Marble Counting', icon: Circle, emoji: '🔮', mainSection: 'Student Tools', section: 'Math', color: '#2ed573' },
  { id: 'binarynumbers', name: 'Binary Numbers', icon: Cpu, emoji: '💻', mainSection: 'Student Tools', section: 'Math', color: '#1e90ff' },
  
  // Student Tools - Memory & Games
  { id: 'simongame', name: 'Simon Says', icon: Gamepad2, emoji: '🧠', mainSection: 'Student Tools', section: 'Memory & Games', color: '#ffa502' },
  { id: 'emojimatch', name: 'Emoji Match', icon: Brain, emoji: '🧩', mainSection: 'Student Tools', section: 'Memory & Games', color: '#a29bfe' },
  { id: 'sudoku', name: 'Sudoku', icon: Grid3X3, emoji: '🔢', mainSection: 'Student Tools', section: 'Memory & Games', color: '#ff6b81' },
  { id: 'puzzle', name: 'Puzzle', icon: ImageIcon, emoji: '🧩', mainSection: 'Student Tools', section: 'Memory & Games', color: '#20bf6b' },
  
  // Student Tools - Arts & Music
  { id: 'songmaker', name: 'Song Maker', icon: Music, emoji: '🎵', mainSection: 'Student Tools', section: 'Arts & Music', color: '#fa8231' },
  
  // Student Tools - History
  { id: 'studenttimeline', name: 'Student Timeline', icon: History, emoji: '⏳', mainSection: 'Student Tools', section: 'History', color: '#ff4757' },
];

export const mainSections = [
  { title: 'Teacher Tools', subSections: ['Time Management', 'Classroom Management', 'Mathematics', 'Randomizers', 'Other'] },
  { title: 'Classroom Games', subSections: ['Games'] },
  { title: 'Student Tools', subSections: ['Literacy', 'Math', 'Memory & Games', 'Science', 'Arts & Music', 'History'] }
];
