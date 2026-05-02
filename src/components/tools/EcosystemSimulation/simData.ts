export const WIDTH = 800;
export const HEIGHT = 500;
export const INITIAL_RABBITS = 30;
export const INITIAL_WOLVES = 4;
export const INITIAL_GRASS = 250;

export const SIM_CONFIG = {
  grass: {
    max: 600,
    growthRate: 20,
    healthValue: 1
  },
  rabbit: {
    max: 250,
    speed: 1.2,
    metabolism: 0.005,
    initialHealth: 4,
    splitHealth: 4,
    offspringHealth: 2,
    maxAge: 1000,
    detectionRange: 50
  },
  wolf: {
    max: 40,
    speed: 1.3,
    metabolism: 0.005,
    initialHealth: 4,
    splitHealth: 8,
    offspringHealth: 2,
    maxAge: 1500,
    detectionRange: 100
  }
};
