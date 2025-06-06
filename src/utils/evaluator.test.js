// src/utils/evaluator.test.js
import { evaluateResponses } from './evaluator'; // Adjust path if needed

describe('evaluateResponses', () => {
  const N_LEVEL = 2;

  // Helper to create a trial object
  const createTrial = (id, position, letter) => ({ id, position, letter });

  it('should return zero for all counts with empty trials and responses', () => {
    const result = evaluateResponses({ trials: [], responses: new Map(), n: N_LEVEL });
    // The evaluator returns a nested structure, so we test the actual hit/total counts
    expect(result.visual.hits).toBe(0);
    expect(result.visual.total).toBe(0);
    expect(result.auditory.hits).toBe(0);
    expect(result.auditory.total).toBe(0);
    expect(result.dual.hits).toBe(0);
    expect(result.dual.total).toBe(0);
  });

  it('should ignore filler trials for scoring', () => {
    const trials = [
      createTrial(0, 1, 'A'), // Filler
      createTrial(1, 2, 'B'), // Filler
      createTrial(2, 1, 'C'), // Scorable, N-back visual match to trial 0 if it were scorable
      createTrial(3, 3, 'B'), // Scorable, N-back audio match to trial 1 if it were scorable
    ];
    const responses = new Map([
      [2, { vis: true, aud: false }],
      [3, { vis: false, aud: true }],
    ]);
    // Since trials[0] and trials[1] are fillers, trials[2] and trials[3] have no N-back antecedents
    // that are themselves scorable or part of the defined match structure.
    // The comparison is always trials[i] vs trials[i-N_LEVEL].
    // So, trials[2] (1,'C') vs trials[0] (1,'A') -> Visual-Only Match
    // And trials[3] (3,'B') vs trials[1] (2,'B') -> Audio-Only Match
    const result = evaluateResponses({ trials, responses, n: N_LEVEL });

    expect(result.visual.total).toBe(1); // trial 2 is a visual-only match with trial 0
    expect(result.auditory.total).toBe(1); // trial 3 is an audio-only match with trial 1
    expect(result.dual.total).toBe(0);

    expect(result.visual.hits).toBe(1); // User responded vis to visual match trial 2
    expect(result.auditory.hits).toBe(1); // User responded aud to audio match trial 3
    expect(result.dual.hits).toBe(0);
  });

  it('should correctly score visual-only, audio-only, and dual matches with correct responses', () => {
    const correctedTrials = [
      createTrial(0, 1, 'A'), // Filler
      createTrial(1, 2, 'B'), // Filler
      createTrial(2, 1, 'C'), // Scorable, Visual-Only Match (pos: 1 vs 1, letter: C vs A) with trial 0
      createTrial(3, 7, 'B'), // Scorable, Audio-Only Match (pos: 7 vs 2, letter: B vs B) with trial 1
      createTrial(4, 4, 'X'), // Scorable, (pos: 4 vs 1, letter: X vs C) -> No match with trial 2
      createTrial(5, 8, 'Y'), // Scorable, (pos: 8 vs 7, letter: Y vs B) -> No match with trial 3
      createTrial(6, 4, 'X'), // Scorable, Dual Match (pos: 4 vs 4, letter: X vs X) with trial 4
    ];

    const responses = new Map([
      [2, { vis: true, aud: false }], // Correct for visual-only
      [3, { vis: false, aud: true }], // Correct for audio-only
      [6, { vis: true, aud: true }],  // Correct for dual
    ]);

    const result = evaluateResponses({ trials: correctedTrials, responses, n: N_LEVEL });

    expect(result.visual.total).toBe(1); // Visual-only count (trial 2)
    expect(result.auditory.total).toBe(1);  // Audio-only count (trial 3)
    expect(result.dual.total).toBe(1);   // Dual count (trial 6)

    // Hits are counted based on if the stimulus property matched and if the response was made.
    // Visual Hit: Trial 2 (Vis-Only, responded Vis), Trial 6 (Dual, responded Vis)
    // Audio Hit: Trial 3 (Aud-Only, responded Aud), Trial 6 (Dual, responded Aud)
    // Dual Hit: Trial 6 (Dual, responded Vis+Aud)
    expect(result.visual.hits).toBe(2);
    expect(result.auditory.hits).toBe(2);
    expect(result.dual.hits).toBe(1);
  });

  it('should correctly score when user makes mistakes or does not respond', () => {
    const trials = [
      createTrial(0, 1, 'A'), // Filler
      createTrial(1, 2, 'B'), // Filler
      createTrial(2, 1, 'C'), // Scorable, Visual-Only (pos 1) with trial 0
      createTrial(3, 7, 'B'), // Scorable, Audio-Only (letter B) with trial 1
      createTrial(4, 4, 'X'), // Scorable, No match with trial 2
      createTrial(5, 8, 'Y'), // Scorable, No match with trial 3
      createTrial(6, 4, 'X'), // Scorable, Dual Match (pos 4, letter X) with trial 4
    ];
    const responses = new Map([
      [2, { vis: false, aud: true }], // Incorrect: Responded audio to visual-only
      [3, { vis: false, aud: false }],// Incorrect: No response to audio-only
      [6, { vis: true, aud: false }], // Incorrect: Responded only visual to dual
    ]);

    const result = evaluateResponses({ trials, responses, n: N_LEVEL });

    expect(result.visual.total).toBe(1);
    expect(result.auditory.total).toBe(1);
    expect(result.dual.total).toBe(1);

    // Trial 2: Visual-Only. Response: aud=true. Visual hit = 0. Audio hit = 0 (not an audio match).
    // Trial 3: Audio-Only. Response: none. Visual hit = 0. Audio hit = 0.
    // Trial 6: Dual. Response: vis=true, aud=false. Visual hit = 1. Audio hit = 0. Dual hit = 0.
    expect(result.visual.hits).toBe(1);
    expect(result.auditory.hits).toBe(0);
    expect(result.dual.hits).toBe(0);
  });

  it('should handle responses to non-match trials (potential false alarms)', () => {
    const trials = [
      createTrial(0, 1, 'A'),
      createTrial(1, 2, 'B'),
      createTrial(2, 3, 'C'), // Scorable, no match with trial 0 (1,A) -> pos:3!=1, letter:C!=A
      createTrial(3, 4, 'D'), // Scorable, no match with trial 1 (2,B) -> pos:4!=2, letter:D!=B
    ];
    const responses = new Map([
      [2, { vis: true, aud: false }], // User responds visual to trial 2 (no match)
      [3, { vis: false, aud: true }], // User responds audio to trial 3 (no match)
    ]);
    const result = evaluateResponses({ trials, responses, n: N_LEVEL });

    expect(result.visual.total).toBe(0);
    expect(result.auditory.total).toBe(0);
    expect(result.dual.total).toBe(0);
    expect(result.visual.hits).toBe(0); // Not a visual match, so no hit
    expect(result.auditory.hits).toBe(0);  // Not an audio match, so no hit
    expect(result.dual.hits).toBe(0);
  });
});
