// Generates a 20‑trial sequence with the required match counts.
// Parameters: n (N‑back level) → default 2.

import { randomInt } from './helpers.js';

export function generateSequence({ n = 2 } = {}) {
  const total = 20; // scorable trials (plus n initial fillers)
  const sequence = [];

  // Helper arrays for positions and letters
  const positions = Array.from({ length: total + n }, () => randomInt(0, 7));
  const letters = Array.from({ length: total + n }, () => {
    const idx = randomInt(0, 7);
    return ['C', 'H', 'K', 'L', 'Q', 'R', 'S', 'T'][idx];
  });

  // Apply matches (4 visual, 4 auditory, 2 dual)
  applyMatches({ arr: positions, n, visual: true, count: 4 });
  applyMatches({ arr: letters, n, visual: false, count: 4 });
  applyDualMatches({ posArr: positions, letArr: letters, n, count: 2 });

  for (let i = 0; i < total + n; i++) {
    sequence.push({
      index: i,
      position: positions[i],
      letter: letters[i],
    });
  }
  return sequence;
}

function applyMatches({ arr, n, count }) {
  const eligible = Array.from({ length: arr.length - n }, (_, i) => i + n);
  shuffle(eligible);
  for (let i = 0; i < count; i++) {
    const idx = eligible[i];
    arr[idx] = arr[idx - n];
  }
}

function applyDualMatches({ posArr, letArr, n, count }) {
  const eligible = Array.from({ length: posArr.length - n }, (_, i) => i + n);
  shuffle(eligible);
  for (let i = 0; i < count; i++) {
    const idx = eligible[i];
    posArr[idx] = posArr[idx - n];
    letArr[idx] = letArr[idx - n];
  }
}

function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
}