import { evaluateResponses } from '../src/utils/evaluator.js';

describe('evaluateResponses', () => {
  // Test Case 1: No Matches
  test('should correctly evaluate with no matches', () => {
    const trials = [
      { index: 0, position: 1, letter: 'A' },
      { index: 1, position: 2, letter: 'B' },
      { index: 2, position: 3, letter: 'C' },
      { index: 3, position: 4, letter: 'D' },
    ];
    const responses = new Map();
    const n = 2;
    const expected = {
      visual: { hits: 0, total: 0, pct: 0 },
      auditory: { hits: 0, total: 0, pct: 0 },
      dual: { hits: 0, total: 0, pct: 0 },
    };
    expect(evaluateResponses({ trials, responses, n })).toEqual(expected);
  });

  // Test Case 2: Visual-Only Match
  describe('Visual-Only Match', () => {
    test('should correctly evaluate when user HITS the visual match', () => {
      const trials = [
        { index: 0, position: 1, letter: 'A' }, // N-back item for trial 2
        { index: 1, position: 2, letter: 'B' },
        { index: 2, position: 1, letter: 'C' }, // Visual match with trial 0
        { index: 3, position: 3, letter: 'D' },
      ];
      const responses = new Map([[2, { vis: true, aud: false }]]);
      const n = 2;
      const expected = {
        visual: { hits: 1, total: 1, pct: 100 },
        auditory: { hits: 0, total: 0, pct: 0 },
        dual: { hits: 0, total: 0, pct: 0 },
      };
      expect(evaluateResponses({ trials, responses, n })).toEqual(expected);
    });

    test('should correctly evaluate when user MISSES the visual match', () => {
      const trials = [
        { index: 0, position: 1, letter: 'A' },
        { index: 1, position: 2, letter: 'B' },
        { index: 2, position: 1, letter: 'C' }, // Visual match with trial 0
        { index: 3, position: 3, letter: 'D' },
      ];
      const responses = new Map([[2, { vis: false, aud: false }]]);
      const n = 2;
      const expected = {
        visual: { hits: 0, total: 1, pct: 0 },
        auditory: { hits: 0, total: 0, pct: 0 },
        dual: { hits: 0, total: 0, pct: 0 },
      };
      expect(evaluateResponses({ trials, responses, n })).toEqual(expected);
    });
  });

  // Test Case 3: Auditory-Only Match
  describe('Auditory-Only Match', () => {
    test('should correctly evaluate when user HITS the auditory match', () => {
      const trials = [
        { index: 0, position: 1, letter: 'A' }, // N-back item for trial 2
        { index: 1, position: 2, letter: 'B' },
        { index: 2, position: 3, letter: 'A' }, // Auditory match with trial 0
        { index: 3, position: 4, letter: 'D' },
      ];
      const responses = new Map([[2, { vis: false, aud: true }]]);
      const n = 2;
      const expected = {
        visual: { hits: 0, total: 0, pct: 0 },
        auditory: { hits: 1, total: 1, pct: 100 },
        dual: { hits: 0, total: 0, pct: 0 },
      };
      expect(evaluateResponses({ trials, responses, n })).toEqual(expected);
    });

    test('should correctly evaluate when user MISSES the auditory match', () => {
      const trials = [
        { index: 0, position: 1, letter: 'A' },
        { index: 1, position: 2, letter: 'B' },
        { index: 2, position: 3, letter: 'A' }, // Auditory match with trial 0
        { index: 3, position: 4, letter: 'D' },
      ];
      const responses = new Map([[2, { vis: false, aud: false }]]);
      const n = 2;
      const expected = {
        visual: { hits: 0, total: 0, pct: 0 },
        auditory: { hits: 0, total: 1, pct: 0 },
        dual: { hits: 0, total: 0, pct: 0 },
      };
      expect(evaluateResponses({ trials, responses, n })).toEqual(expected);
    });
  });

  // Test Case 4: Dual Match (Both Visual and Auditory)
  describe('Dual Match', () => {
    test('should correctly evaluate when user HITS BOTH (dual hit)', () => {
      const trials = [
        { index: 0, position: 1, letter: 'A' }, // N-back item for trial 2
        { index: 1, position: 2, letter: 'B' },
        { index: 2, position: 1, letter: 'A' }, // Dual match with trial 0
        { index: 3, position: 3, letter: 'C' },
      ];
      const responses = new Map([[2, { vis: true, aud: true }]]);
      const n = 2;
      const expected = {
        visual: { hits: 1, total: 1, pct: 100 },
        auditory: { hits: 1, total: 1, pct: 100 },
        dual: { hits: 1, total: 1, pct: 100 },
      };
      expect(evaluateResponses({ trials, responses, n })).toEqual(expected);
    });

    test('should correctly evaluate when user HITS VISUAL ONLY in a dual match opportunity', () => {
      const trials = [
        { index: 0, position: 1, letter: 'A' },
        { index: 1, position: 2, letter: 'B' },
        { index: 2, position: 1, letter: 'A' }, // Dual match opportunity
        { index: 3, position: 3, letter: 'C' },
      ];
      const responses = new Map([[2, { vis: true, aud: false }]]);
      const n = 2;
      const expected = {
        visual: { hits: 1, total: 1, pct: 100 },
        auditory: { hits: 0, total: 1, pct: 0 },
        dual: { hits: 0, total: 1, pct: 0 },
      };
      expect(evaluateResponses({ trials, responses, n })).toEqual(expected);
    });

    test('should correctly evaluate when user HITS AUDITORY ONLY in a dual match opportunity', () => {
      const trials = [
        { index: 0, position: 1, letter: 'A' },
        { index: 1, position: 2, letter: 'B' },
        { index: 2, position: 1, letter: 'A' }, // Dual match opportunity
        { index: 3, position: 3, letter: 'C' },
      ];
      const responses = new Map([[2, { vis: false, aud: true }]]);
      const n = 2;
      const expected = {
        visual: { hits: 0, total: 1, pct: 0 },
        auditory: { hits: 1, total: 1, pct: 100 },
        dual: { hits: 0, total: 1, pct: 0 },
      };
      expect(evaluateResponses({ trials, responses, n })).toEqual(expected);
    });

    test('should correctly evaluate when user MISSES BOTH in a dual match opportunity', () => {
      const trials = [
        { index: 0, position: 1, letter: 'A' },
        { index: 1, position: 2, letter: 'B' },
        { index: 2, position: 1, letter: 'A' }, // Dual match opportunity
        { index: 3, position: 3, letter: 'C' },
      ];
      const responses = new Map([[2, { vis: false, aud: false }]]);
      const n = 2;
      const expected = {
        visual: { hits: 0, total: 1, pct: 0 },
        auditory: { hits: 0, total: 1, pct: 0 },
        dual: { hits: 0, total: 1, pct: 0 },
      };
      expect(evaluateResponses({ trials, responses, n })).toEqual(expected);
    });
  });

  // Test Case 5: Mixed Sequence
  test('should correctly evaluate a mixed sequence of matches and non-matches', () => {
    const trials = [
      { index: 0, position: 1, letter: 'A' }, // N-back for T2 (Visual)
      { index: 1, position: 2, letter: 'B' }, // N-back for T3 (Auditory)
      { index: 2, position: 1, letter: 'C' }, // Visual match with T0. User hits vis.
      { index: 3, position: 3, letter: 'B' }, // Auditory match with T1. User hits aud.
      { index: 4, position: 1, letter: 'C' }, // N-back for T6 (Dual). T4 is dual with T2 (pos 1, letter C)
      { index: 5, position: 4, letter: 'D' }, // No match with T3
      { index: 6, position: 1, letter: 'C' }, // Dual match with T4. User hits both.
      { index: 7, position: 2, letter: 'B' }, // N-back for T9 (Visual). T7 is visual with T5 (pos 2)
      { index: 8, position: 3, letter: 'A' }, // Auditory match with T6 (letter C). User misses aud.
      { index: 9, position: 2, letter: 'E' }, // Visual match with T7. User misses vis.
    ];
    const responses = new Map([
      [2, { vis: true, aud: false }],  // Hit visual
      [3, { vis: false, aud: true }],  // Hit auditory
      // T4: no response, counts as miss for the dual opportunity with T2 (pos 1, letter C)
      // T5: no response, no match
      [6, { vis: true, aud: true }],   // Hit dual
      // T8: no response, counts as miss for auditory match
      [9, { vis: false, aud: false }] // Miss visual
    ]);
    const n = 2;
    const expected = {
      visual: { hits: 2, total: 4, pct: 50 },
      // T2 (pos 1, let C) vs T0 (pos 1, let A) -> Visual Match. User hits vis. (visHits:1, visOpp:1)
      // T3 (pos 3, let B) vs T1 (pos 2, let B) -> Auditory Match. User hits aud. (audHits:1, audOpp:1)
      // T4 (pos 1, let C) vs T2 (pos 1, let C) -> Dual Match Opp. User no response. (visOpp:2, audOpp:2, dualOpp:1)
      // T5 (pos 4, let D) vs T3 (pos 3, let B) -> No match.
      // T6 (pos 1, let C) vs T4 (pos 1, let C) -> Dual Match Opp. User hits both. (visHits:2, audHits:2, dualHits:1, visOpp:3, audOpp:3, dualOpp:2)
      // T7 (pos 2, let B) vs T5 (pos 4, let D) -> No match.
      // T8 (pos 3, let A) vs T6 (pos 1, let C) -> No match.
      // T9 (pos 2, let E) vs T7 (pos 2, let B) -> Visual Match. User misses vis. (visOpp:4)
      auditory: { hits: 2, total: 3, pct: 66.7 },
      dual: { hits: 1, total: 2, pct: 50 },
    };
    expect(evaluateResponses({ trials, responses, n })).toEqual(expected);
  });

  // Test Case 6: Edge Cases
  describe('Edge Cases', () => {
    test('should return all zeros for empty trials array', () => {
      const trials = [];
      const responses = new Map();
      const n = 2;
      const expected = {
        visual: { hits: 0, total: 0, pct: 0 },
        auditory: { hits: 0, total: 0, pct: 0 },
        dual: { hits: 0, total: 0, pct: 0 },
      };
      expect(evaluateResponses({ trials, responses, n })).toEqual(expected);
    });

    test('should correctly evaluate with empty responses map', () => {
      const trials = [
        { index: 0, position: 1, letter: 'A' },
        { index: 1, position: 2, letter: 'B' },
        { index: 2, position: 1, letter: 'A' }, // Dual match
      ];
      const responses = new Map();
      const n = 2;
      const expected = {
        visual: { hits: 0, total: 1, pct: 0 },
        auditory: { hits: 0, total: 1, pct: 0 },
        dual: { hits: 0, total: 1, pct: 0 },
      };
      expect(evaluateResponses({ trials, responses, n })).toEqual(expected);
    });

    test('should correctly evaluate with N=0 (no scorable trials)', () => {
        const trials = [
          { index: 0, position: 1, letter: 'A' },
          { index: 1, position: 1, letter: 'A' }, // Potential match but N=0 means no n-back
        ];
        const responses = new Map([[1, { vis: true, aud: true }]]);
        const n = 0;
        const expected = {
          visual: { hits: 0, total: 0, pct: 0 },
          auditory: { hits: 0, total: 0, pct: 0 },
          dual: { hits: 0, total: 0, pct: 0 },
        };
        // N=0 means all trials are non-scorable as i is never < n
        // The loop `trials.forEach((t, i) => { if (i < n) return;` will always return for n=0
        // Let's rethink this. If n=0, does it mean every trial is compared to itself?
        // The problem states "if (i < n) return; // non-scorable"
        // If n=0, then i < 0 is never true. So all trials become scorable.
        // This implies trials[i-n] becomes trials[i]. This will always be a match.
        // The original code would have issues here: trials[i-0] is current trial.
        // The new code: nBackTrial = trials[i-n], currentTrial = t (which is trials[i])
        // So it compares trial with itself. Every trial is a dual match opportunity.
        // Let's adjust the logic for n=0 based on the provided code.
        // If n=0, every trial IS scorable from the start.
        // isVisualMatchScenario = currentTrial.position === nBackTrial.position (i.e. trials[i].position === trials[i].position) -> always true
        // isAuditoryMatchScenario = currentTrial.letter === nBackTrial.letter (i.e. trials[i].letter === trials[i].letter) -> always true
        // So every trial is a dual opportunity.
        // Let's re-evaluate the expected for N=0.
        const expectedN0 = {
            visual: { hits: 1, total: 1, pct: 100 }, // Trial 0 is skipped (i < n is 0 < 0 false)
                                                   // Trial 1: nBackTrial = trials[1-0] = trials[1]
                                                   // visualMatchOpportunities = 1 (for trial 1)
                                                   // visualHits = 1 (for trial 1, userResponse.vis is true)
            auditory: { hits: 1, total: 1, pct: 100 },// audioMatchOpportunities = 1 (for trial 1)
                                                    // audioHits = 1 (for trial 1, userResponse.aud is true)
            dual: { hits: 1, total: 1, pct: 100 },    // dualMatchOpportunities = 1 (for trial 1)
                                                    // dualHits = 1 (userResponse.vis && userResponse.aud is true)
        };
        // The loop starts with i=0. if (0 < 0) is false. So trial 0 is processed.
        // nBackTrial = trials[0-0] = trials[0].
        // For trial 0: visMatch=true, audMatch=true. visOpp++, audOpp++. visHit (if resp), audHit (if resp). dualOpp++. dualHit (if resp).
        // For trial 1: visMatch=true, audMatch=true. visOpp++, audOpp++. visHit (if resp), audHit (if resp). dualOpp++. dualHit (if resp).
        // So for N=0, with 2 trials, and response for trial 1:
        // T0: visOpp=1, audOpp=1, dualOpp=1. No response for T0, so visHit=0, audHit=0, dualHit=0.
        // T1: visOpp becomes 2, audOpp becomes 2, dualOpp becomes 2.
        //     Response for T1 is {vis:true, aud:true}. So visHit becomes 1, audHit becomes 1, dualHit becomes 1.
        const trialsN0_actual = [
            { index: 0, position: 1, letter: 'A' },
            { index: 1, position: 2, letter: 'B' }, // Different to ensure match is due to n=0 logic
          ];
        const responsesN0_actual = new Map([
            [0, { vis: true, aud: false }], // Response for T0
            [1, { vis: true, aud: true }]   // Response for T1
        ]);
        const expectedN0_final = {
            visual: { hits: 2, total: 2, pct: 100 },
            auditory: { hits: 1, total: 2, pct: 50 },
            dual: { hits: 1, total: 2, pct: 50 },
        };
        expect(evaluateResponses({ trials: trialsN0_actual, responses: responsesN0_actual, n })).toEqual(expectedN0_final);
      });

    test('should correctly evaluate with N=1', () => {
      const trials = [
        { index: 0, position: 1, letter: 'A' }, // N-back for T1
        { index: 1, position: 1, letter: 'B' }, // Visual match with T0. User hits vis.
        { index: 2, position: 2, letter: 'B' }, // Auditory match with T1. User hits aud.
        { index: 3, position: 2, letter: 'B' }, // Dual match with T2. User hits dual.
      ];
      const responses = new Map([
        [1, { vis: true, aud: false }], // Hit visual for T1's match with T0
        [2, { vis: false, aud: true }], // Hit auditory for T2's match with T1
        [3, { vis: true, aud: true }],  // Hit dual for T3's match with T2
      ]);
      const n = 1;
      // Scorable trials: 1, 2, 3 (i >= n which is i >= 1)
      // Trial 1 (pos:1, let:B) vs Trial 0 (pos:1, let:A) -> Visual Match Opp. User: {vis:T, aud:F} -> Vis Hit.
      //   visOpp=1, audOpp=0, dualOpp=0. visHit=1, audHit=0, dualHit=0.
      // Trial 2 (pos:2, let:B) vs Trial 1 (pos:1, let:B) -> Auditory Match Opp. User: {vis:F, aud:T} -> Aud Hit.
      //   visOpp=1, audOpp=1, dualOpp=0. visHit=1, audHit=1, dualHit=0.
      // Trial 3 (pos:2, let:B) vs Trial 2 (pos:2, let:B) -> Dual Match Opp. User: {vis:T, aud:T} -> Dual Hit, Vis Hit, Aud Hit.
      //   visOpp=2, audOpp=2, dualOpp=1. visHit=2, audHit=2, dualHit=1.
      const expected = {
        visual: { hits: 2, total: 2, pct: 100 },
        auditory: { hits: 2, total: 2, pct: 100 },
        dual: { hits: 1, total: 1, pct: 100 },
      };
      expect(evaluateResponses({ trials, responses, n })).toEqual(expected);
    });

    test('should handle responses for non-scorable trials gracefully', () => {
        const trials = [
          { index: 0, position: 1, letter: 'A' },
          { index: 1, position: 2, letter: 'B' },
          { index: 2, position: 1, letter: 'C' }, // Visual match with T0
        ];
        const responses = new Map([
            [0, { vis: true, aud: false }], // Response for non-scorable trial
            [1, { vis: true, aud: true }],  // Response for non-scorable trial
            [2, { vis: true, aud: false }]
        ]);
        const n = 2;
        const expected = {
          visual: { hits: 1, total: 1, pct: 100 },
          auditory: { hits: 0, total: 0, pct: 0 },
          dual: { hits: 0, total: 0, pct: 0 },
        };
        expect(evaluateResponses({ trials, responses, n })).toEqual(expected);
      });

      test('should handle trials shorter than N gracefully', () => {
        const trials = [
          { index: 0, position: 1, letter: 'A' },
        ];
        const responses = new Map();
        const n = 2;
        const expected = {
          visual: { hits: 0, total: 0, pct: 0 },
          auditory: { hits: 0, total: 0, pct: 0 },
          dual: { hits: 0, total: 0, pct: 0 },
        };
        expect(evaluateResponses({ trials, responses, n })).toEqual(expected);
      });
  });
});
