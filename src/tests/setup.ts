import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock browser APIs that might be missing in JSDOM or cause issues
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock Path2D for JSDOM
(global as any).Path2D = class Path2D {
  moveTo() {}
  lineTo() {}
  closePath() {}
  arc() {}
};

// Mock AudioContext
(global as any).AudioContext = class AudioContext {
  createOscillator() { 
    return { 
      connect: vi.fn(), 
      start: vi.fn(), 
      stop: vi.fn(),
      type: 'sine',
      frequency: { 
        value: 440, 
        setValueAtTime: vi.fn(), 
        exponentialRampToValueAtTime: vi.fn() 
      }
    }; 
  }
  createGain() { 
    return { 
      connect: vi.fn(), 
      gain: { 
        value: 0, 
        setValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
        linearRampToValueAtTime: vi.fn()
      } 
    }; 
  }
  decodeAudioData() { return Promise.resolve(); }
  resume() { return Promise.resolve(); }
  close() { return Promise.resolve(); }
  get currentTime() { return 0; }
};
global.webkitAudioContext = global.AudioContext;

// Mock canvas getContext
HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
  clearRect: vi.fn(),
  fillRect: vi.fn(),
  strokeRect: vi.fn(),
  beginPath: vi.fn(),
  arc: vi.fn(),
  fill: vi.fn(),
  stroke: vi.fn(),
  save: vi.fn(),
  restore: vi.fn(),
  translate: vi.fn(),
  rotate: vi.fn(),
  createRadialGradient: vi.fn().mockReturnValue({ addColorStop: vi.fn() }),
  createLinearGradient: vi.fn().mockReturnValue({ addColorStop: vi.fn() }),
  fillText: vi.fn(),
  strokeText: vi.fn(),
  setLineDash: vi.fn(),
  measureText: vi.fn().mockReturnValue({ width: 10 }),
  scale: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  closePath: vi.fn(),
  drawImage: vi.fn(),
});

// Mock canvas-confetti
vi.mock('canvas-confetti', () => ({
  default: vi.fn(),
}));

// Mock matter-js as it can be heavy and might not work well in JSDOM
vi.mock('matter-js', () => ({
  default: {
    Engine: { 
      create: vi.fn(() => ({ 
        world: {}, 
        gravity: { x: 0, y: 1 },
        positionIterations: 6,
        velocityIterations: 4
      })), 
      clear: vi.fn(),
      update: vi.fn()
    },
    Render: { create: vi.fn(() => ({ canvas: {} })), run: vi.fn() },
    Runner: { create: vi.fn(), run: vi.fn(), stop: vi.fn() },
    Bodies: { 
      rectangle: vi.fn(() => ({ position: { x: 0, y: 0 }, render: {}, angle: 0 })),
      circle: vi.fn(() => ({ position: { x: 0, y: 0 }, render: {}, angle: 0 }))
    },
    World: { add: vi.fn(), remove: vi.fn(), clear: vi.fn() },
    Events: { on: vi.fn(), off: vi.fn() },
    Query: { point: vi.fn(() => []) },
    Composite: { 
      add: vi.fn(), 
      remove: vi.fn(),
      clear: vi.fn(),
      allBodies: vi.fn(() => [])
    },
    Mouse: { create: vi.fn() },
    MouseConstraint: { create: vi.fn() },
    Constraint: { create: vi.fn(() => ({})) },
  }
}));

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
