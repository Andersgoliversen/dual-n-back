// Pre‑loads the eight letter sounds and provides a play() helper.

const LETTERS = ['C', 'H', 'K', 'L', 'Q', 'R', 'S', 'T'];
const audioMap = new Map();
let feedbackClip;

export function preloadAudio() {
  LETTERS.forEach((l) => {
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
  if (!feedbackClip) return;
  feedbackClip.currentTime = 0;
  try {
    await feedbackClip.play();
  } catch {
    // ignore play rejections
  }
}
