// Pre‑loads the eight letter sounds and provides a play() helper.

const LETTERS = ['C', 'H', 'K', 'L', 'Q', 'R', 'S', 'T'];
const audioMap = new Map();

export function preloadAudio() {
  LETTERS.forEach((l) => {
    const a = new Audio(`/sounds/${l}.mp3`); // −14 LUFS @44.1 kHz provided externally
    a.preload = 'auto';
    audioMap.set(l, a);
  });
}

export function playLetter(letter) {
  const clip = audioMap.get(letter);
  if (!clip) return;
  clip.currentTime = 0;
  clip.play();
}