/**
 * Speech synthesis utility functions.
 */

/**
 * Speaks the given text using the Web Speech API.
 * @param text The text to speak.
 * @param rate The speed of the speech (default 0.9).
 */
export const speak = (text: string, rate = 0.9) => {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = rate;
    window.speechSynthesis.speak(utterance);
  }
};
