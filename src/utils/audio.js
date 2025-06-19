// Pre‑loads the eight letter sounds and provides a play() helper.

const LETTERS = ['C', 'H', 'K', 'L', 'Q', 'R', 'S', 'T'];
const audioMap = new Map();

export function preloadAudio() {
  LETTERS.forEach((l) => {
    const a = new Audio(`${import.meta.env.BASE_URL}sounds/${l}.mp3`); // -14 LUFS @44.1 kHz provided externally
    a.preload = 'auto';
    a.addEventListener('error', () => {
      console.warn(`Missing audio file: ${import.meta.env.BASE_URL}sounds/${l}.mp3`);
    });
    audioMap.set(l, a);
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
