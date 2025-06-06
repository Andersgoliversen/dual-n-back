// Records presses and computes accuracy at round end.

export function evaluateResponses({ trials, responses, n }) {
  let visualHits = 0,
    audioHits = 0,
    dualHits = 0,
    visualTotal = 0,
    audioTotal = 0,
    dualTotal = 0;

  trials.forEach((t, i) => {
    if (i < n) return; // non‑scorable

    const isVisMatch = t.position === trials[i - n].position;
    const isAudMatch = t.letter === trials[i - n].letter;

    if (isVisMatch && isAudMatch) dualTotal++;
    else if (isVisMatch) visualTotal++;
    else if (isAudMatch) audioTotal++;

    const r = responses.get(i) || { vis: false, aud: false };
    if (isVisMatch && r.vis) visualHits++;
    if (isAudMatch && r.aud) audioHits++;
    if (isVisMatch && isAudMatch && r.vis && r.aud) dualHits++; // counted separately
  });

  const pct = (hits, tot) =>
    tot ? Number(((hits / tot) * 100).toFixed(1)) : '—';
  return {
    visual: { hits: visualHits, total: visualTotal, pct: pct(visualHits, visualTotal) },
    auditory: { hits: audioHits, total: audioTotal, pct: pct(audioHits, audioTotal) },
    dual: { hits: dualHits, total: dualTotal, pct: pct(dualHits, dualTotal) },
  };
}