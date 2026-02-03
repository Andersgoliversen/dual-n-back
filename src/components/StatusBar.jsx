import React from 'react';
import PropTypes from 'prop-types';

// -----------------------------------------------------------------------------
// Shows progress through the current round.  Displays a simple progress bar and
// the current trial number out of the total.

export default function StatusBar({ trial, total }) {
  // Percentage complete represented as an integer for the progress bar width
  const pct = Math.min(100, Math.round((trial / total) * 100));
  // The outer container has an aria-live region so screen readers announce
  // progress updates.
  return (
    <div className="w-full max-w-xs mt-4" role="status" aria-live="polite" id="trial-counter-description">
      <div className="h-2 bg-slate-800 rounded-full">
        <div className="h-full bg-cyan-400 rounded-full" style={{ width: `${pct}%` }} />
      </div>
      <p className="text-center text-sm mt-2 text-slate-300">Trial {trial}/{total}</p>
    </div>
  );
}

StatusBar.propTypes = {
  trial: PropTypes.number.isRequired,
  total: PropTypes.number.isRequired,
};
