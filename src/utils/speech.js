/**
 * Speech synthesis utility functions.
 */

/**
 * Speaks the given text using the Web Speech API.
 * @param {string} text The text to speak.
 * @param {number} rate The speed of the speech (default 0.9).
 */
export const speak = (text, rate = 0.9) => {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = rate;
    window.speechSynthesis.speak(utterance);
  }
};
