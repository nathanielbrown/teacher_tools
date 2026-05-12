declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext;
  }
}

class AudioEngine {
  private ctx: AudioContext | null;

  constructor() {
    this.ctx = null;
  }

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  getContext() {
    this.init();
    return this.ctx;
  }

  stopAll() {
    if (this.ctx && this.ctx.state === 'running') {
      this.ctx.suspend();
    }
  }

  playTick(theme: any, time?: number, accented?: boolean) {
    if (!theme || theme === 'none' || theme === false) return;
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = time ?? this.ctx.currentTime;
    const freqMultiplier = accented ? 1.5 : 1;

    if (theme === 'classic' || theme === true) {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800 * freqMultiplier, now);
      osc.frequency.exponentialRampToValueAtTime(100 * freqMultiplier, now + 0.05);
      gain.gain.setValueAtTime(accented ? 0.4 : 0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.05);
    } 
    else if (theme === 'digital') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(1200 * freqMultiplier, now);
      osc.frequency.exponentialRampToValueAtTime(600 * freqMultiplier, now + 0.03);
      gain.gain.setValueAtTime(accented ? 0.15 : 0.1, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.03);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.03);
    }
    else if (theme === 'soft') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(400 * freqMultiplier, now);
      osc.frequency.linearRampToValueAtTime(350 * freqMultiplier, now + 0.1);
      gain.gain.setValueAtTime(accented ? 0.3 : 0.2, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.1);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.1);
    }
    else if (theme === 'bubbly') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(300 * freqMultiplier, now);
      osc.frequency.exponentialRampToValueAtTime(800 * freqMultiplier, now + 0.08);
      gain.gain.setValueAtTime(accented ? 0.4 : 0.3, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.08);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.08);
    }
    else if (theme === 'chime') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1500 * freqMultiplier, now);
      gain.gain.setValueAtTime(accented ? 0.3 : 0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.1);
    }
    else if (theme === 'synth') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(200 * freqMultiplier, now);
      osc.frequency.exponentialRampToValueAtTime(10 * freqMultiplier, now + 0.1);
      gain.gain.setValueAtTime(accented ? 0.25 : 0.15, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.1);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.1);
    }
    else if (theme === 'beep') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1000 * freqMultiplier, now);
      gain.gain.setValueAtTime(accented ? 0.3 : 0.2, now);
      gain.gain.setValueAtTime(0, now + 0.05);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.05);
    }
    else if (theme === 'siren') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(800 * freqMultiplier, now);
      osc.frequency.setValueAtTime(600 * freqMultiplier, now + 0.05);
      gain.gain.setValueAtTime(accented ? 0.15 : 0.1, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.1);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.1);
    }
    else if (theme === 'cosmic') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(2000 * freqMultiplier, now);
      osc.frequency.exponentialRampToValueAtTime(10 * freqMultiplier, now + 0.15);
      gain.gain.setValueAtTime(accented ? 0.3 : 0.2, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.15);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.15);
    }
  }

  playTone(freq: number, duration = 0.4, type: string = 'sine', volume = 0.2) {
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = type as OscillatorType;
    osc.frequency.setValueAtTime(freq, now);
    
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.02);
    gain.gain.setValueAtTime(volume, now + duration - 0.05);
    gain.gain.linearRampToValueAtTime(0, now + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(now + duration);
  }

  playInstrument(freq: number, instrument: string, duration = 0.4, overrideCtx?: BaseAudioContext, overrideNow?: number) {
    if (!overrideCtx) this.init();
    const context = overrideCtx || this.ctx;
    if (!context) return;
    const now = overrideNow !== undefined ? overrideNow : context.currentTime;
    
    if (instrument === 'marimba') {
      const osc1 = context.createOscillator();
      const osc2 = context.createOscillator();
      const gain = context.createGain();
      
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(freq, now);
      
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(freq * 3.9, now); // Typical marimba overtone
      
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.6, now + 0.005); // Sharp attack
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3); // Quick decay
      
      // Ensure node is disconnected to avoid memory leaks
      const stopTime = now + 0.5;
      
      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(context.destination);
      
      osc1.start(now);
      osc2.start(now);
      osc1.stop(stopTime);
      osc2.stop(stopTime);
      
      // Only disconnect if it's realtime to avoid offline rendering drops
      if (!overrideCtx) {
        setTimeout(() => {
          try { gain.disconnect(); } catch(e){}
        }, (stopTime - now) * 1000 + 100);
      }

    } else if (instrument === 'piano') {
      const osc1 = context.createOscillator();
      const osc2 = context.createOscillator();
      const osc3 = context.createOscillator();
      const gain = context.createGain();
      const filter = context.createBiquadFilter();
      
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(freq, now);
      
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(freq * 2, now); // Octave
      
      osc3.type = 'sine';
      osc3.frequency.setValueAtTime(freq * 3, now); // Fifth
      
      // Filter sweep to mimic hammer and resonance
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(freq * 5, now);
      filter.frequency.exponentialRampToValueAtTime(freq * 1.5, now + 0.5);
      
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.5, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.0); // Longer decay
      
      const stopTime = now + 1.2;
      
      osc1.connect(filter);
      osc2.connect(filter);
      osc3.connect(filter);
      filter.connect(gain);
      gain.connect(context.destination);
      
      osc1.start(now);
      osc2.start(now);
      osc3.start(now);
      osc1.stop(stopTime);
      osc2.stop(stopTime);
      osc3.stop(stopTime);
      
      if (!overrideCtx) {
        setTimeout(() => {
          try { gain.disconnect(); filter.disconnect(); } catch(e){}
        }, (stopTime - now) * 1000 + 100);
      }

    } else if (instrument === 'strings') {
      const osc1 = context.createOscillator();
      const osc2 = context.createOscillator();
      const gain = context.createGain();
      const filter = context.createBiquadFilter();
      
      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(freq, now);
      
      // Detune second oscillator for chorus effect
      osc2.type = 'sawtooth';
      osc2.frequency.setValueAtTime(freq * 1.008, now); 
      
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(freq * 4, now);
      filter.frequency.linearRampToValueAtTime(freq * 2, now + duration);
      
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.3, now + 0.15); // Slow attack
      gain.gain.setValueAtTime(0.3, now + duration - 0.1); // Sustain
      gain.gain.linearRampToValueAtTime(0, now + duration + 0.3); // Smooth release
      
      const stopTime = now + duration + 0.4;
      
      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(context.destination);
      
      osc1.start(now);
      osc2.start(now);
      osc1.stop(stopTime);
      osc2.stop(stopTime);
      
      if (!overrideCtx) {
        setTimeout(() => {
          try { gain.disconnect(); filter.disconnect(); } catch(e){}
        }, (stopTime - now) * 1000 + 100);
      }

    } else if (instrument === 'woodwind') {
      const osc = context.createOscillator();
      const gain = context.createGain();
      const filter = context.createBiquadFilter();
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);
      
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(freq * 3, now);
      
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.3, now + 0.08); // Soft attack
      gain.gain.setValueAtTime(0.3, now + duration - 0.05); // Sustain
      gain.gain.linearRampToValueAtTime(0, now + duration + 0.1); // Release
      
      // Delayed Vibrato
      const lfo = context.createOscillator();
      const lfoGain = context.createGain();
      lfo.frequency.setValueAtTime(5.5, now); // 5.5Hz vibrato
      lfoGain.gain.setValueAtTime(0, now);
      lfoGain.gain.linearRampToValueAtTime(freq * 0.02, now + 0.2); // Depth fades in
      
      const stopTime = now + duration + 0.2;
      
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(context.destination);
      
      lfo.start(now);
      osc.start(now);
      lfo.stop(stopTime);
      osc.stop(stopTime);
      
      if (!overrideCtx) {
        setTimeout(() => {
          try { gain.disconnect(); filter.disconnect(); lfoGain.disconnect(); } catch(e){}
        }, (stopTime - now) * 1000 + 100);
      }

    } else {
      // Default / Synth (Fat analog style)
      const osc1 = context.createOscillator();
      const osc2 = context.createOscillator();
      const gain = context.createGain();
      const filter = context.createBiquadFilter();
      
      osc1.type = 'square';
      osc1.frequency.setValueAtTime(freq, now);
      
      osc2.type = 'sawtooth';
      osc2.frequency.setValueAtTime(freq * 0.995, now); // Detune
      
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(freq * 8, now); // Open filter
      filter.frequency.exponentialRampToValueAtTime(freq * 1.5, now + 0.2); // Envelope
      filter.Q.setValueAtTime(2, now); // Resonance
      
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.25, now + 0.01); // Quick attack
      gain.gain.setValueAtTime(0.15, now + 0.1); // Decay to sustain
      gain.gain.linearRampToValueAtTime(0, now + duration); // Release
      
      const stopTime = now + duration + 0.1;
      
      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(context.destination);
      
      osc1.start(now);
      osc2.start(now);
      osc1.stop(stopTime);
      osc2.stop(stopTime);
      
      if (!overrideCtx) {
        setTimeout(() => {
          try { gain.disconnect(); filter.disconnect(); } catch(e){}
        }, (stopTime - now) * 1000 + 100);
      }
    }
  }

  playDrum(type: string, overrideCtx?: BaseAudioContext, overrideNow?: number) {
    if (!overrideCtx) this.init();
    const context = overrideCtx || this.ctx;
    if (!context) return;
    const now = overrideNow !== undefined ? overrideNow : context.currentTime;

    if (type === 'kick') {
      const osc = context.createOscillator();
      const gain = context.createGain();
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(0.01, now + 0.5);
      gain.gain.setValueAtTime(1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
      osc.connect(gain);
      gain.connect(context.destination);
      osc.start(now);
      osc.stop(now + 0.5);
    } else if (type === 'snare') {
      // Noise component
      const bufferSize = context.sampleRate * 0.1;
      const buffer = context.createBuffer(1, bufferSize, context.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
      
      const noise = context.createBufferSource();
      noise.buffer = buffer;
      const noiseGain = context.createGain();
      noiseGain.gain.setValueAtTime(1, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      
      const filter = context.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(1000, now);
      
      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(context.destination);
      noise.start(now);

      // Snap component
      const osc = context.createOscillator();
      const oscGain = context.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(250, now);
      oscGain.gain.setValueAtTime(0.5, now);
      oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
      osc.connect(oscGain);
      oscGain.connect(context.destination);
      osc.start(now);
      osc.stop(now + 0.05);
    } else if (type === 'hihat' || type === 'symbol') {
      const isSymbol = type === 'symbol';
      const bufferSize = context.sampleRate * (isSymbol ? 0.3 : 0.05);
      const buffer = context.createBuffer(1, bufferSize, context.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

      const noise = context.createBufferSource();
      noise.buffer = buffer;
      const noiseGain = context.createGain();
      noiseGain.gain.setValueAtTime(isSymbol ? 0.3 : 0.2, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, now + (isSymbol ? 0.3 : 0.05));

      const filter = context.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(7000, now);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(context.destination);
      noise.start(now);
    } else if (type === 'tom') {
      const osc = context.createOscillator();
      const gain = context.createGain();
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.2);
      gain.gain.setValueAtTime(0.8, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
      osc.connect(gain);
      gain.connect(context.destination);
      osc.start(now);
      osc.stop(now + 0.2);
    }
  }

  playAlarm(theme: any) {
    if (!theme || theme === 'none' || theme === false) return;
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    if (theme === 'classic' || theme === true) {
      const duration = 1.0;
      osc.type = 'square';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.setValueAtTime(600, now + 0.2);
      osc.frequency.setValueAtTime(400, now + 0.4);
      osc.frequency.setValueAtTime(600, now + 0.6);
      osc.frequency.setValueAtTime(400, now + 0.8);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.5, now + 0.1);
      gain.gain.setValueAtTime(0.5, now + duration - 0.1);
      gain.gain.linearRampToValueAtTime(0, now + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(now + duration);
    }
    else if (theme === 'digital') {
      const duration = 0.8;
      osc.type = 'sawtooth';
      for(let i=0; i<8; i++) {
        osc.frequency.setValueAtTime(800, now + i*0.1);
        osc.frequency.setValueAtTime(1200, now + i*0.1 + 0.05);
      }
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.2, now + 0.05);
      gain.gain.setValueAtTime(0.2, now + duration - 0.1);
      gain.gain.linearRampToValueAtTime(0, now + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(now + duration);
    }
    else if (theme === 'soft') {
      const duration = 1.5;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.linearRampToValueAtTime(500, now + 0.5);
      osc.frequency.linearRampToValueAtTime(400, now + 1.0);
      osc.frequency.linearRampToValueAtTime(500, now + 1.5);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.3, now + 0.3);
      gain.gain.setValueAtTime(0.3, now + duration - 0.3);
      gain.gain.linearRampToValueAtTime(0, now + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(now + duration);
    }
    else if (theme === 'bubbly') {
      const duration = 1.0;
      osc.type = 'sine';
      for(let i=0; i<5; i++) {
        osc.frequency.setValueAtTime(400, now + i*0.2);
        osc.frequency.exponentialRampToValueAtTime(1000, now + i*0.2 + 0.15);
      }
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.4, now + 0.1);
      gain.gain.setValueAtTime(0.4, now + duration - 0.1);
      gain.gain.linearRampToValueAtTime(0, now + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(now + duration);
    }
    else if (theme === 'chime') {
      const duration = 1.5;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.setValueAtTime(1066, now + 0.2);
      osc.frequency.setValueAtTime(1200, now + 0.4);
      osc.frequency.setValueAtTime(1600, now + 0.6);
      
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.3, now + 0.05);
      gain.gain.setValueAtTime(0.3, now + 0.6);
      gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(now + duration);
    }
    else if (theme === 'synth') {
      const duration = 2.0;
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.linearRampToValueAtTime(400, now + 1.0);
      osc.frequency.linearRampToValueAtTime(200, now + 2.0);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.2, now + 0.2);
      gain.gain.setValueAtTime(0.2, now + 1.5);
      gain.gain.linearRampToValueAtTime(0, now + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(now + duration);
    }
    else if (theme === 'beep') {
      const duration = 1.2;
      osc.type = 'sine';
      for(let i=0; i<6; i++) {
        osc.frequency.setValueAtTime(1000, now + i*0.2);
      }
      gain.gain.setValueAtTime(0, now);
      for(let i=0; i<6; i++) {
        gain.gain.setValueAtTime(0.3, now + i*0.2);
        gain.gain.setValueAtTime(0, now + i*0.2 + 0.1);
      }

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(now + duration);
    }
    else if (theme === 'siren') {
      const duration = 2.0;
      osc.type = 'square';
      for(let i=0; i<4; i++) {
        osc.frequency.setValueAtTime(800, now + i*0.5);
        osc.frequency.setValueAtTime(600, now + i*0.5 + 0.25);
      }
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.15, now + 0.1);
      gain.gain.setValueAtTime(0.15, now + duration - 0.1);
      gain.gain.linearRampToValueAtTime(0, now + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(now + duration);
    }
    else if (theme === 'cosmic') {
      const duration = 1.5;
      osc.type = 'sine';
      for(let i=0; i<3; i++) {
        osc.frequency.setValueAtTime(2000, now + i*0.5);
        osc.frequency.exponentialRampToValueAtTime(10, now + i*0.5 + 0.4);
      }
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.3, now + 0.1);
      gain.gain.setValueAtTime(0.3, now + duration - 0.1);
      gain.gain.linearRampToValueAtTime(0, now + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(now + duration);
    }
  }

  playReady(theme: any) {
    if (!theme || theme === 'none' || theme === false) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.1);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(now + 0.1);
  }

  playError(theme: any) {
    if (!theme || theme === 'none' || theme === false) return;
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.linearRampToValueAtTime(100, now + 0.2);
    
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.linearRampToValueAtTime(0, now + 0.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(now + 0.2);
  }

  playSuccess(theme: any) {
    if (!theme || theme === 'none' || theme === false) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    
    if (theme === 'classic' || theme === true || theme === 'soft') {
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'sine';
      osc1.frequency.setValueAtTime(523.25, now); // C5
      osc2.frequency.setValueAtTime(659.25, now + 0.1); // E5

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.2, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.ctx.destination);

      osc1.start(now);
      osc1.stop(now + 0.3);
      osc2.start(now + 0.1);
      osc2.stop(now + 0.3);
    } else {
      // Default fallback for other themes
      this.playTick(theme);
    }
  }

  async exportWav(
    grid: (string | null)[][], 
    notes: number[], 
    tempo: number, 
    splits: number, 
    percussionArr: {id: string}[]
  ): Promise<void> {
    const cols = grid[0]?.length || 0;
    const interval = (60 / tempo) / splits;
    const totalDuration = (cols * interval) + 2; // +2 seconds for decay tail
    
    // Create OfflineAudioContext
    const sampleRate = 44100;
    const offlineCtx = new window.OfflineAudioContext(2, sampleRate * totalDuration, sampleRate);
    
    // Calculate frequencies manually since we are using offline ctx
    const midiToFreq = (m: number) => Math.pow(2, (m - 69) / 12) * 440;

    grid.forEach((row, rIdx) => {
      row.forEach((cellVal, cIdx) => {
        if (cellVal) {
          const time = cIdx * interval;
          if (rIdx >= notes.length) {
            const perc = percussionArr[rIdx - notes.length];
            this.playDrum(perc.id, offlineCtx, time);
          } else {
            this.playInstrument(midiToFreq(notes[rIdx]), cellVal, 0.4, offlineCtx, time);
          }
        }
      });
    });

    const renderedBuffer = await offlineCtx.startRendering();
    
    // Convert to WAV
    const wavBlob = audioBufferToWav(renderedBuffer);
    const url = URL.createObjectURL(wavBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `songmaker-${new Date().toISOString().slice(0,10)}.wav`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

export const audioEngine = new AudioEngine();

if (typeof window !== 'undefined') {
  window.addEventListener('blur', () => audioEngine.stopAll());
}

// Utility to convert AudioBuffer to WAV blob
function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numOfChan = buffer.numberOfChannels;
  const length = buffer.length * numOfChan * 2 + 44;
  const bufferOutput = new ArrayBuffer(length);
  const view = new DataView(bufferOutput);
  const channels = [];
  let sample;
  let offset = 0;
  let pos = 0;

  function setUint16(data: number) { view.setUint16(pos, data, true); pos += 2; }
  function setUint32(data: number) { view.setUint32(pos, data, true); pos += 4; }

  setUint32(0x46464952); // "RIFF"
  setUint32(length - 8); // file length - 8
  setUint32(0x45564157); // "WAVE"
  setUint32(0x20746d66); // "fmt " chunk
  setUint32(16); // length = 16
  setUint16(1); // PCM (uncompressed)
  setUint16(numOfChan);
  setUint32(buffer.sampleRate);
  setUint32(buffer.sampleRate * 2 * numOfChan); // avg. bytes/sec
  setUint16(numOfChan * 2); // block-align
  setUint16(16); // 16-bit
  setUint32(0x61746164); // "data" - chunk
  setUint32(length - pos - 4); // chunk length

  for (let i = 0; i < buffer.numberOfChannels; i++) {
    channels.push(buffer.getChannelData(i));
  }

  while (pos < length) {
    for (let i = 0; i < numOfChan; i++) {
      sample = Math.max(-1, Math.min(1, channels[i][offset])); // clamp
      sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0; // scale to 16-bit
      view.setInt16(pos, sample, true); // write 16-bit sample
      pos += 2;
    }
    offset++;
  }

  return new Blob([bufferOutput], { type: 'audio/wav' });
}
