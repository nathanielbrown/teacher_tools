/**
 * Speech synthesis utility functions.
 */

let preferredVoice: SpeechSynthesisVoice | null = null;

/**
 * Finds the best available voice (prioritizing Catherine AU).
 */
const findPreferredVoice = (lang?: string) => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
  
  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) return null;

  if (lang) {
    // Try to find a voice for the specific language
    const langVoice = voices.find(v => v.lang.toLowerCase().replace('_', '-') === lang.toLowerCase().replace('_', '-')) ||
                    voices.find(v => v.lang.toLowerCase().startsWith(lang.toLowerCase().split('-')[0]));
    if (langVoice) return langVoice;
  }

  // Default: Prioritize Catherine (AU)
  const catherine = voices.find(v => v.name.includes('Catherine') && v.lang.includes('AU'));
  if (catherine) return catherine;

  // 2. Fallback to other Australian female voices
  const auFemale = voices.find(v => v.lang.includes('en-AU') && v.name.toLowerCase().includes('female'));
  if (auFemale) return auFemale;

  // 3. Fallback to any Australian voice
  const auAny = voices.find(v => v.lang.includes('en-AU'));
  if (auAny) return auAny;

  // 4. Fallback to US female voices
  const usFemale = voices.find(v => v.lang.includes('en-US') && v.name.toLowerCase().includes('female'));
  if (usFemale) return usFemale;

  return voices[0]; // Absolute fallback
};

/**
 * Initializes the speech system by pre-loading voices.
 * Should be called once at the app root.
 */
export const initSpeech = () => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

  // Initial attempt
  preferredVoice = findPreferredVoice();

  // Update when voices change (often happens after a delay on some browsers)
  const handleVoicesChanged = () => {
    preferredVoice = findPreferredVoice();
  };

  window.speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged);
  
  // Also call getVoices immediately to trigger the population
  window.speechSynthesis.getVoices();

  return () => {
    window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
  };
};

/**
 * Checks if a specific language is supported by the available TTS voices.
 */
export const isLanguageSupported = (lang: string) => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return false;
  const voices = window.speechSynthesis.getVoices();
  return voices.some(v => 
    v.lang.toLowerCase().replace('_', '-') === lang.toLowerCase().replace('_', '-') ||
    v.lang.toLowerCase().startsWith(lang.toLowerCase().split('-')[0])
  );
};

/**
 * Speaks the given text using the Web Speech API.
 * @param text The text to speak.
 * @param rate The speed of the speech (default 0.9).
 * @param onEnd Optional callback when speech finished.
 * @param lang Optional language code (e.g. 'en-AU', 'zh-CN').
 */
export const speak = (text: string, rate = 0.9, onEnd?: () => void, lang?: string) => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    onEnd?.();
    return;
  }

  window.speechSynthesis.cancel();
  
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = rate;

  if (lang) {
    utterance.lang = lang;
    const voice = findPreferredVoice(lang);
    if (voice) utterance.voice = voice;
  } else {
    if (!preferredVoice) {
      preferredVoice = findPreferredVoice();
    }
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }
  }

  if (onEnd) {
    utterance.onend = () => onEnd();
    utterance.onerror = () => onEnd();
  }

  window.speechSynthesis.speak(utterance);
};

/**
 * Async version of speak.
 */
export const speakAsync = (text: string, rate = 0.9, lang?: string) => {
  return new Promise<void>((resolve) => {
    speak(text, rate, resolve, lang);
  });
};
