// Records presses and computes accuracy at round end.

export function evaluateResponses({ trials, responses, n }) {
  let visualHits = 0;
  let audioHits = 0;
  let dualHits = 0;
  let visualMatchOpportunities = 0; // Renamed for clarity, was visualTotal
  let audioMatchOpportunities = 0;   // Renamed for clarity, was audioTotal
  let dualMatchOpportunities = 0;    // Renamed for clarity, was dualTotal

  trials.forEach((t, i) => {
    if (i < n) return; // non-scorable

    const nBackTrial = trials[i - n];
    const currentTrial = t;
    const userResponse = responses.get(i) || { vis: false, aud: false };

    const isVisualMatchScenario = currentTrial.position === nBackTrial.position;
    const isAuditoryMatchScenario = currentTrial.letter === nBackTrial.letter;

    // Increment opportunity counts
    if (isVisualMatchScenario) {
      visualMatchOpportunities++;
    }
    if (isAuditoryMatchScenario) {
      audioMatchOpportunities++;
    }

    // Handle hits
    if (isVisualMatchScenario && userResponse.vis) {
      visualHits++;
    }
    if (isAuditoryMatchScenario && userResponse.aud) {
      audioHits++;
    }

    // Handle dual matches (these are a subset of individual visual/auditory matches)
    if (isVisualMatchScenario && isAuditoryMatchScenario) {
      dualMatchOpportunities++;
      if (userResponse.vis && userResponse.aud) {
        dualHits++;
      }
    }
  });

  const pct = (hits, total) =>
    total > 0 ? Number(((hits / total) * 100).toFixed(1)) : 0; // Return 0 if no opportunities

  return {
    visual: { hits: visualHits, total: visualMatchOpportunities, pct: pct(visualHits, visualMatchOpportunities) },
    auditory: { hits: audioHits, total: audioMatchOpportunities, pct: pct(audioHits, audioMatchOpportunities) },
    dual: { hits: dualHits, total: dualMatchOpportunities, pct: pct(dualHits, dualMatchOpportunities) },
  };
}