/**
 * AccessRoute Speech & Voice Utility
 * Handles Web Speech API recognition (Speech-to-Text) and Speech Synthesis (Text-to-Speech).
 */

let activeRecognition = null;

/**
 * Check if Speech Recognition is supported in the current browser
 */
export function isSpeechRecognitionSupported() {
  return (
    typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
  );
}

/**
 * Check if Speech Synthesis (Text-to-Speech) is supported
 */
export function isSpeechSynthesisSupported() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

/**
 * Start listening for voice input using Web Speech API
 * @param {object} options - Callbacks: { onResult, onError, onStart, onEnd }
 * @returns {object|null} Recognition instance
 */
export function startVoiceRecognition({
  onResult = () => {},
  onError = () => {},
  onStart = () => {},
  onEnd = () => {}
} = {}) {
  if (!isSpeechRecognitionSupported()) {
    onError(new Error('Speech recognition is not supported in this browser.'));
    return null;
  }

  try {
    // Stop any previous active recognition
    if (activeRecognition) {
      try {
        activeRecognition.abort();
      } catch (err) {
        console.warn('Error aborting previous speech recognition:', err);
      }
    }

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.lang = 'en-IN'; // Indian English
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      onStart();
    };

    recognition.onresult = (event) => {
      let transcript = '';
      if (event.results && event.results.length > 0) {
        // Handle both standard SpeechRecognitionResults and array mocks
        const firstResult = event.results[event.resultIndex || 0];
        if (Array.isArray(firstResult)) {
          transcript = firstResult[0]?.transcript || String(firstResult[0] || '');
        } else if (firstResult && firstResult[0]) {
          transcript = firstResult[0].transcript || '';
        }
      }
      onResult(transcript.trim());
    };

    recognition.onerror = (event) => {
      const errorMsg = event?.error || 'Speech recognition error';
      console.warn('[Voice Input] Recognition error:', errorMsg);
      onError(event);
    };

    recognition.onend = () => {
      activeRecognition = null;
      onEnd();
    };

    activeRecognition = recognition;
    recognition.start();
    return recognition;
  } catch (error) {
    console.error('[Voice Input] Failed to initialize SpeechRecognition:', error);
    onError(error);
    return null;
  }
}

/**
 * Stop active voice recognition
 */
export function stopVoiceRecognition() {
  if (activeRecognition) {
    try {
      activeRecognition.stop();
    } catch (err) {
      try {
        activeRecognition.abort();
      } catch {
        // ignore
      }
    }
    activeRecognition = null;
  }
}

/**
 * Speak text out loud using browser SpeechSynthesis
 * @param {string} text - Text to speak
 * @param {function} onEnd - Optional callback on completion
 * @returns {boolean} Success status
 */
export function speakDirections(text, onEnd = () => {}) {
  if (isSpeechSynthesisSupported()) {
    try {
      window.speechSynthesis.cancel(); // Stop active utterance

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      utterance.lang = 'en-IN';

      utterance.onend = () => {
        onEnd();
      };

      utterance.onerror = (err) => {
        console.warn('[Voice Output] SpeechSynthesis error:', err);
        onEnd();
      };

      window.speechSynthesis.speak(utterance);
      return true;
    } catch (err) {
      console.error('[Voice Output] SpeechSynthesis speak failed:', err);
    }
  }
  return false;
}

/**
 * Cancel and stop any active speech synthesis
 */
export function stopSpeaking() {
  if (isSpeechSynthesisSupported()) {
    try {
      window.speechSynthesis.cancel();
    } catch (err) {
      console.warn('[Voice Output] Stop speaking failed:', err);
    }
  }
}
