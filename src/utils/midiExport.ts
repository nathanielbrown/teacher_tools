import MidiWriter from 'midi-writer-js';
import { INSTRUMENTS, PERCUSSION } from '../components/tools/SongMaker';

export const exportMidi = (
  grid: (string | null)[][],
  notes: number[],
  tempo: number,
  splits: number,
  _beatsPerBar: number
) => {
  // Map of our instrument IDs to General MIDI Program Numbers
  const PROGRAM_MAP: Record<string, number> = {
    'marimba': 12,    // Marimba
    'piano': 0,       // Acoustic Grand Piano
    'woodwind': 73,   // Flute
    'synth': 81,      // Lead 2 (sawtooth)
    'strings': 48,    // String Ensemble 1
  };

  const tracks: MidiWriter.Track[] = [];

  // Track 0: Tempo track
  const tempoTrack = new MidiWriter.Track();
  tempoTrack.setTempo(tempo);
  tracks.push(tempoTrack);

  // Group notes by instrument
  const instrumentEvents: Record<string, any[]> = {};
  
  // Calculate duration in ticks (MidiWriter defaults to 128 ticks per quarter note)
  // Our "splits" define how many subdivisions per beat. So each step is 128 / splits ticks long.
  const ticksPerQuarter = 128;
  // Alternatively, we can use tick-based duration: `T${ticks}`
  const stepDurationStr = `T${Math.floor(ticksPerQuarter / splits)}`;

  // Iterate over instruments
  INSTRUMENTS.forEach(inst => {
    instrumentEvents[inst.id] = [];
  });

  const drumEvents: any[] = [];

  // Iterate over columns (time)
  const cols = grid[0]?.length || 0;
  for (let c = 0; c < cols; c++) {
    // Current tick position
    const currentTick = c * Math.floor(ticksPerQuarter / splits);

    // Look through rows
    grid.forEach((row, rIdx) => {
      const cellVal = row[c];
      if (cellVal) {
        if (rIdx >= notes.length) {
          // Percussion
          const perc = PERCUSSION.find(p => p.id === cellVal);
          if (perc) {
            drumEvents.push(new MidiWriter.NoteEvent({
              pitch: [perc.midi],
              duration: stepDurationStr,
              tick: currentTick,
              channel: 10
            }));
          }
        } else {
          // Instrument note
          if (instrumentEvents[cellVal]) {
            instrumentEvents[cellVal].push(new MidiWriter.NoteEvent({
              pitch: [notes[rIdx]],
              duration: stepDurationStr,
              tick: currentTick
            }));
          }
        }
      }
    });
  }

  // Add tracks for each instrument that has notes
  Object.keys(instrumentEvents).forEach(instId => {
    const events = instrumentEvents[instId];
    if (events.length > 0) {
      const track = new MidiWriter.Track();
      track.addEvent(new MidiWriter.ProgramChangeEvent({ instrument: PROGRAM_MAP[instId] || 0 }));
      track.addEvent(events);
      tracks.push(track);
    }
  });

  // Add drum track if needed
  if (drumEvents.length > 0) {
    const drumTrack = new MidiWriter.Track();
    drumTrack.addEvent(drumEvents);
    tracks.push(drumTrack);
  }

  const write = new MidiWriter.Writer(tracks);
  
  // Download the MIDI file
  const base64String = write.base64();
  const dataUri = `data:audio/midi;base64,${base64String}`;
  
  const link = document.createElement('a');
  link.href = dataUri;
  link.download = `songmaker-${new Date().toISOString().slice(0,10)}.mid`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
