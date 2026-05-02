/**
 * Randomization utility functions.
 */

/**
 * Shuffles an array using the Fisher-Yates algorithm.
 * @param array The array to shuffle.
 * @returns A new shuffled array.
 */
export const shuffle = <T>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

/**
 * Generates a random integer between min and max (inclusive).
 * @param min 
 * @param max 
 * @returns 
 */
export const randomInt = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

/**
 * Returns a random element from an array.
 * @param array 
 * @returns 
 */
export const randomElement = <T>(array: T[]): T | null => {
  if (!array || array.length === 0) return null;
  return array[Math.floor(Math.random() * array.length)];
};
