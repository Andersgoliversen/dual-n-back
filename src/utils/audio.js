// -----------------------------------------------------------------------------
// Audio Utilities
// ---------------
// Handles preloading the letter sound clips and provides small helpers for
// playing them and the feedback sound when the user presses a key.

// List of letters supported in the game
const LETTERS = ['C', 'H', 'K', 'L', 'Q', 'R', 'S', 'T'];

// Map from letter to loaded Audio objects
const audioMap = new Map();

// Separate clip used for error/correct feedback
let feedbackClip;

// Preload all of the audio files so playback is instantaneous during the game
export function preloadAudio() {
  LETTERS.forEach((l) => {
    // Individual letter clips are named after the letter itself
    const a = new Audio(`${import.meta.env.BASE_URL}sounds/${l}.mp3`); // -14 LUFS @44.1 kHz provided externally
    a.preload = 'auto';
    a.addEventListener('error', () => {
      console.warn(`Missing audio file: ${import.meta.env.BASE_URL}sounds/${l}.mp3`);
    });
    audioMap.set(l, a);
  });

  // Preload feedback sound used for button responses
  feedbackClip = new Audio(`${import.meta.env.BASE_URL}sounds/ErrorSound.mp3`);
  feedbackClip.preload = 'auto';
  feedbackClip.addEventListener('error', () => {
    console.warn(`Missing audio file: ${import.meta.env.BASE_URL}sounds/ErrorSound.mp3`);
  });
}

export async function playLetter(letter) {
  // Reset to the start so repeated calls play from the beginning
  const clip = audioMap.get(letter);
  if (!clip) return;
  clip.currentTime = 0;
  try {
    await clip.play();
  } catch {
    // ignore play rejections
  }
}

export async function playFeedback() {
  // Short confirmation/error tone used after each key press
  if (!feedbackClip) return;
  feedbackClip.currentTime = 0;
  try {
    await feedbackClip.play();
  } catch {
    // ignore play rejections
  }
}
