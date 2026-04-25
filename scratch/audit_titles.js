import fs from 'fs';
import path from 'path';

const toolsData = [
  { id: 'clock', name: 'Analogue & Digital Clock' },
  { id: 'stopwatch', name: 'Stop Watch' },
  { id: 'countdown', name: 'Count Down' },
  { id: 'examclock', name: 'Exam Clock' },
  { id: 'dailyschedule', name: 'Daily Schedule' },
  { id: 'eventcalendar', name: 'Event Calendar' },
  { id: 'groupmaker', name: 'Random Group Maker' },
  { id: 'groupscoreboard', name: 'Group Score Board' },
  { id: 'marblejar', name: 'Marble Jar Reward' },
  { id: 'emotionpicker', name: 'Emotion Picker' },
  { id: 'soundlevel', name: 'Sound Level' },
  { id: 'seatingplan', name: 'Seating Plan Generator' },
  { id: 'fractiontool', name: 'Fraction Visualizer' },
  { id: 'hundredschart', name: 'Interactive Hundreds Chart' },
  { id: 'mabblocks', name: 'MAB Blocks Lab' },
  { id: 'wordmanager', name: 'Word Manager' },
  { id: 'storystarters', name: 'Story Starters' },
  { id: 'diceroller', name: 'Dice Roller' },
  { id: 'flipcoin', name: 'Flip a Coin' },
  { id: 'numberspinner', name: 'Number Spinner' },
  { id: 'namepicker', name: 'Name Picker' },
  { id: 'groupnamegenerator', name: 'Group Name Generator' },
  { id: 'colourpicker', name: 'Colour Picker' },
  { id: 'metronome', name: 'Metronome' },
  { id: 'qrcodegenerator', name: 'QR Code Generator' },
  { id: 'higherorlower', name: 'Higher or Lower' },
  { id: 'revealword', name: 'Reveal Word' },
  { id: 'imagereveal', name: 'Image Reveal' },
  { id: 'colourhunt', name: 'Colour Hunt' },
  { id: 'wouldyourather', name: 'Would You Rather' },
  { id: 'simonsays', name: 'Simon Says (Classroom)' },
  { id: 'guessinggame', name: 'Guessing Game' },
  { id: 'spelling', name: 'Spelling Practice' },
  { id: 'lettertracing', name: 'Letter Tracing' },
  { id: 'findtheword', name: 'Find the Word' },
  { id: 'crossword', name: 'Crossword' },
  { id: 'typinggame', name: 'Typing Galaxy' },
  { id: 'reactiontime', name: 'Reaction Time' },
  { id: 'chemicalfireworks', name: 'Chemical Fireworks' },
  { id: 'thermalconduction', name: 'Thermal Conduction' },
  { id: 'ecosystem', name: 'Ecosystem Simulation' },
  { id: 'springscales', name: 'Spring Scales' },
  { id: 'inkdiffusion', name: 'Ink Diffusion' },
  { id: 'standingwave', name: 'Standing Wave Synthesis' },
  { id: 'sandsim', name: 'Sand Simulation' },
  { id: 'timestable', name: 'Times Tables' },
  { id: 'moneytool', name: 'Money Tool' },
  { id: 'missingaddition', name: 'Missing Addition' },
  { id: 'missingsubtraction', name: 'Missing Subtraction' },
  { id: 'missingmultiplication', name: 'Missing Multiplier' },
  { id: 'missingdivision', name: 'Missing Division' },
  { id: 'marblecounting', name: 'Marble Counting' },
  { id: 'binarynumbers', name: 'Binary Numbers' },
  { id: 'cartesianplane', name: 'Cartesian Plane' },
  { id: 'simongame', name: 'Simon Says' },
  { id: 'emojimatch', name: 'Emoji Match' },
  { id: 'sudoku', name: 'Sudoku' },
  { id: 'songmaker', name: 'Song Maker' }
];

const toolsDir = 'src/components/tools';
const files = fs.readdirSync(toolsDir);

files.forEach(file => {
  if (file.endsWith('.jsx')) {
    const content = fs.readFileSync(path.join(toolsDir, file), 'utf8');
    const titleMatch = content.match(/title="([^"]+)"/);
    if (titleMatch) {
      const title = titleMatch[1];
      const match = toolsData.find(t => t.name === title);
      if (!match) {
        console.log(`Mismatch in ${file}: "${title}" not found in tools.js`);
      }
    }
  }
});
