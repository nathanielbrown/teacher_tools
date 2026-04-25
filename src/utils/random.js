/**
 * Randomization utility functions.
 */

/**
 * Shuffles an array using the Fisher-Yates algorithm.
 * @param {Array} array The array to shuffle.
 * @returns {Array} A new shuffled array.
 */
export const shuffle = (array) => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

/**
 * Generates a random integer between min and max (inclusive).
 * @param {number} min 
 * @param {number} max 
 * @returns {number}
 */
export const randomInt = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

/**
 * Returns a random element from an array.
 * @param {Array} array 
 * @returns {any}
 */
export const randomElement = (array) => {
  if (!array || array.length === 0) return null;
  return array[Math.floor(Math.random() * array.length)];
};
