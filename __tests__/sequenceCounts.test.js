/* eslint-env jest */
import { generateSequence } from '../src/utils/generator.js';

test('generator yields correct match counts', () => {
  const RUNS = 500;
  for (let i = 0; i < RUNS; i++) {
    const seq = generateSequence({ n: 2 });
    let vis = 0;
    let aud = 0;
    let dual = 0;
    for (let j = 2; j < seq.length; j++) {
      const v = seq[j].position === seq[j - 2].position;
      const a = seq[j].letter === seq[j - 2].letter;
      if (v && a) dual++;
      else if (v) vis++;
      else if (a) aud++;
    }
    expect(vis).toBe(4);
    expect(aud).toBe(4);
    expect(dual).toBe(2);
  }
});
