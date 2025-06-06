// Generates a 20‑trial sequence with the required match counts using a deterministic strategy (Strategy 4.1).
// Parameters: n (N‑back level) → default 2.

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min; // Assumed correct

const LETTERS_ARRAY = ['C', 'H', 'K', 'L', 'Q', 'R', 'S', 'T'];
const NUM_POSITIONS = 8; // 0-7 grid positions

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

// Simplified _getRandomVal (Strategy 4.1)
function _getRandomVal(valueSet, excludeVal) { // excludeVal is no longer optional for this specific strategy
  if (!valueSet || valueSet.length === 0) {
    throw new Error("Cannot select from empty or undefined set.");
  }

  if (valueSet.length === 1 && valueSet[0] === excludeVal) {
    // This case means we are forced to "fail" at excluding.
    // Depending on how critical this is, one might throw an error.
    // For N-back, where sets are large (8 positions/letters), this implies a logic error elsewhere if hit.
    // console.warn(`_getRandomVal: Only value (${valueSet[0]}) is the one to exclude (${excludeVal}). Critical issue for N-back.`);
    return valueSet[0];
  }

  let selectedVal;
  // Max attempts to prevent infinite loops if logic elsewhere is flawed or valueSet is unexpectedly small.
  // For a set of 8 items, finding a different one should be very quick.
  const maxAttempts = valueSet.length * 2 + 5;
  let attempts = 0;

  do {
    const randomIndex = randomInt(0, valueSet.length - 1);
    selectedVal = valueSet[randomIndex];
    attempts++;
    if (selectedVal !== excludeVal) {
      return selectedVal;
    }
  } while (attempts < maxAttempts);

  // Fallback: If after many attempts, we still haven't found a different value.
  // This implies nearly all (or all) items in valueSet are equal to excludeVal,
  // or random luck is exceptionally bad. For N-back, this indicates a problem.
  // console.warn(`_getRandomVal: Could not find a value different from ${excludeVal} after ${maxAttempts} attempts. Returning last random value.`);
  return selectedVal; // Return the last picked one, even if it's same as excludeVal.
}

function getRandomLetter(excludeLetter = null) { // Keep null default for initial random fillers
  if (excludeLetter === null) { // For initial random assignment without exclusion
    return LETTERS_ARRAY[randomInt(0, LETTERS_ARRAY.length - 1)];
  }
  return _getRandomVal(LETTERS_ARRAY, excludeLetter);
}

function getRandomPosition(excludePosition = -1) { // Keep default for initial random fillers
  const positionsArray = Array.from({length: NUM_POSITIONS}, (_, k) => k);
  if (excludePosition === -1) { // For initial random assignment without exclusion
      return positionsArray[randomInt(0, positionsArray.length - 1)];
  }
  return _getRandomVal(positionsArray, excludePosition);
}

export function generateSequence({ n: N_LEVEL = 2 } = {}) {
  const NUM_SCORABLE_TRIALS = 20;
  const TOTAL_TRIALS = NUM_SCORABLE_TRIALS + N_LEVEL;
  const TARGET_DUAL = 2;
  const TARGET_VISUAL_ONLY = 4;
  const TARGET_AUDITORY_ONLY = 4;

  const sequence = new Array(TOTAL_TRIALS);

  // Fill initial non-scorable trials
  for (let i = 0; i < N_LEVEL; i++) {
    sequence[i] = {
      index: i,
      position: getRandomPosition(),
      letter: getRandomLetter(),
    };
  }

  // Prepare the ordered list of match types for scorable trials
  const types = [
    ...Array(TARGET_DUAL).fill('dual'),
    ...Array(TARGET_VISUAL_ONLY).fill('visual'),
    ...Array(TARGET_AUDITORY_ONLY).fill('auditory'),
    ...Array(
      NUM_SCORABLE_TRIALS - TARGET_DUAL - TARGET_VISUAL_ONLY - TARGET_AUDITORY_ONLY,
    ).fill('none'),
  ];
  shuffle(types);

  for (let i = N_LEVEL; i < TOTAL_TRIALS; i++) {
    const prev = sequence[i - N_LEVEL];
    const type = types[i - N_LEVEL];

    let position;
    let letter;

    switch (type) {
      case 'dual':
        position = prev.position;
        letter = prev.letter;
        break;
      case 'visual':
        position = prev.position;
        letter = getRandomLetter(prev.letter);
        break;
      case 'auditory':
        position = getRandomPosition(prev.position);
        letter = prev.letter;
        break;
      default:
        position = getRandomPosition(prev.position);
        letter = getRandomLetter(prev.letter);
    }

    sequence[i] = { index: i, position, letter };
  }

  return sequence;
}
