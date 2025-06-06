// Records presses and computes accuracy at round end.

export function evaluateResponses({ trials, responses, n }) {
  let visualHits = 0,
    audioHits = 0,
    dualHits = 0,
    visualTotal = 0,
    audioTotal = 0,
    dualTotal = 0;

  trials.forEach((t, i) => {
    if (i < n) return; // non-scorable

    const isVisMatchTarget = t.position === trials[i - n].position;
    const isAudMatchTarget = t.letter === trials[i - n].letter;
    const userResponse = responses.get(i) || { vis: false, aud: false };

    if (isVisMatchTarget && isAudMatchTarget) {
        dualTotal++;
        if (userResponse.vis && userResponse.aud) {
            dualHits++;
        }
    } else if (isVisMatchTarget) { // Visual-only match
        visualTotal++;
        if (userResponse.vis) {
            visualHits++;
        }
    } else if (isAudMatchTarget) { // Auditory-only match
        audioTotal++;
        if (userResponse.aud) {
            audioHits++;
        }
    }
    // No need to handle 'no match' cases for totals or hits in this part
  });

  const pct = (hits, tot) =>
    tot ? Number(((hits / tot) * 100).toFixed(1)) : '—';
  return {
    visual: { hits: visualHits, total: visualTotal, pct: pct(visualHits, visualTotal) },
    auditory: { hits: audioHits, total: audioTotal, pct: pct(audioHits, audioTotal) },
    dual: { hits: dualHits, total: dualTotal, pct: pct(dualHits, dualTotal) },
  };
}