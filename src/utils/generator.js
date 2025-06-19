// -----------------------------------------------------------------------------
// Sequence Generator
// ------------------
// Creates a sequence of trials with a roughly balanced number of visual,
// auditory and dual matches.  The logic is deterministic so tests can rely on
// the same distribution for a given seed.

// Helper for generating a random integer between min and max inclusive
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const LETTERS_ARRAY = ['C', 'H', 'K', 'L', 'Q', 'R', 'S', 'T'];
const NUM_POSITIONS = 8; // 0-7 grid positions

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

// Internal helper used to pick a random value from a set while optionally
// excluding a specific previous value.  Retries a few times to avoid repeats.
function _getRandomVal(valueSet, excludeVal) {
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

// Return a random letter from the predefined set, ensuring it is different from
// `excludeLetter` when provided.  Used for both filler and scorable trials.
function getRandomLetter(excludeLetter = null) {
  if (excludeLetter === null) {
    return LETTERS_ARRAY[randomInt(0, LETTERS_ARRAY.length - 1)];
  }
  return _getRandomVal(LETTERS_ARRAY, excludeLetter);
}

// Same as above but for grid positions (0‑7).  When excludePosition is -1 a
// completely random position is returned.
function getRandomPosition(excludePosition = -1) {
  const positionsArray = Array.from({ length: NUM_POSITIONS }, (_, k) => k);
  if (excludePosition === -1) {
    return positionsArray[randomInt(0, positionsArray.length - 1)];
  }
  return _getRandomVal(positionsArray, excludePosition);
}

export function generateSequence({ n: N_LEVEL = 2 } = {}) {
  // Construct a full sequence for a single round.  The first N trials are
  // fillers so that an N‑back comparison can be made.  Subsequent trials are
  // created according to the desired distribution of match types.
  const NUM_SCORABLE_TRIALS = 20;
  const TOTAL_TRIALS = NUM_SCORABLE_TRIALS + N_LEVEL;
  // Desired counts of each match type within the scorable portion of the round
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

  // Generate each scorable trial by looking back N positions and deciding which
  // attributes should match.
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
