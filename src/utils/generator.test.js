// src/utils/generator.test.js
import { generateSequence } from './generator';

describe('generateSequence', () => {
  const N_BACK_LEVEL = 2; // n-back level
  const SCORABLE_TRIALS = 20;
  const TOTAL_TRIALS = SCORABLE_TRIALS + N_BACK_LEVEL;
  const REQUIRED_VISUAL_MATCHES = 4;
  const REQUIRED_AUDITORY_MATCHES = 4;
  const REQUIRED_DUAL_MATCHES = 2;
  const NUM_TEST_RUNS = 1000;

  it(`should consistently produce sequences with ${REQUIRED_VISUAL_MATCHES} visual, ${REQUIRED_AUDITORY_MATCHES} auditory, and ${REQUIRED_DUAL_MATCHES} dual matches over ${NUM_TEST_RUNS} runs (N=${N_BACK_LEVEL})`, () => {
    let sequencesMeetingCriteria = 0;

    for (let run = 0; run < NUM_TEST_RUNS; run++) {
      const sequence = generateSequence({ n: N_BACK_LEVEL });

      expect(sequence.length).toBe(TOTAL_TRIALS);

      let actualVisualMatches = 0;
      let actualAuditoryMatches = 0;
      let actualDualMatches = 0;

      for (let i = N_BACK_LEVEL; i < sequence.length; i++) {
        const visualMatchOccurred = sequence[i].position === sequence[i - N_BACK_LEVEL].position;
        const auditoryMatchOccurred = sequence[i].letter === sequence[i - N_BACK_LEVEL].letter;

        if (visualMatchOccurred && auditoryMatchOccurred) {
          actualDualMatches++;
          actualVisualMatches++; // Dual matches also count as visual
          actualAuditoryMatches++; // and auditory matches
        } else if (visualMatchOccurred) {
          actualVisualMatches++;
        } else if (auditoryMatchOccurred) {
          actualAuditoryMatches++;
        }
      }

      if (
        actualVisualMatches === REQUIRED_VISUAL_MATCHES &&
        actualAuditoryMatches === REQUIRED_AUDITORY_MATCHES &&
        actualDualMatches === REQUIRED_DUAL_MATCHES
      ) {
        sequencesMeetingCriteria++;
      }
    }

    // This assertion checks if ALL sequences met the criteria.
    // Depending on the generator's current precision, this might fail.
    // If it fails, we'll log the percentage of sequences that met the criteria.
    if (sequencesMeetingCriteria !== NUM_TEST_RUNS) {
      console.log(`Out of ${NUM_TEST_RUNS} sequences, ${sequencesMeetingCriteria} (${(sequencesMeetingCriteria / NUM_TEST_RUNS) * 100}%) met the exact match criteria.`);
    }
    expect(sequencesMeetingCriteria).toBe(NUM_TEST_RUNS);
  });
});
