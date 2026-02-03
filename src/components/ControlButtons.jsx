import React from 'react';
import PropTypes from 'prop-types';

// ----------------------------------------------------------------------------
// Renders the two main response buttons (Visual and Audio).  Each button can be
// highlighted based on the correctness of the player's last response.  The
// component is intentionally dumb and simply delegates events to the parent via
// callbacks.

export default function ControlButtons({ onVis, onAud, disabled, taskType, visState, audState }) {
  // Map a response state to a Tailwind class for colouring the button.
  const getHighlight = (state) => {
    if (state === 'correct') return 'bg-emerald-500 text-white shadow-emerald-500/40';
    if (state === 'incorrect') return 'bg-rose-500 text-white shadow-rose-500/40';
    if (state === 'miss') return 'bg-amber-400 text-white shadow-amber-400/40';
    return '';
  };
  // Render buttons conditionally based on the current task type.  Each is
  // labelled for screen readers and shows a highlight colour if needed.
  return (
    <div className="flex gap-4 mt-4" role="group" aria-label="response buttons">
      {taskType !== 'audio' && (
        <button
          onClick={onVis}
          disabled={disabled}
          className={`px-5 py-2 rounded-full border border-slate-700 shadow disabled:opacity-40 bg-slate-800 text-white hover:bg-slate-700 transition-colors duration-150 ${getHighlight(visState)}`}
          aria-label="visual match button"
        >
          Position (A)
        </button>
      )}
      {taskType !== 'position' && (
        <button
          onClick={onAud}
          disabled={disabled}
          className={`px-5 py-2 rounded-full border border-slate-700 shadow disabled:opacity-40 bg-slate-800 text-white hover:bg-slate-700 transition-colors duration-150 ${getHighlight(audState)}`}
          aria-label="auditory match button"
        >
          Audio (L)
        </button>
      )}
    </div>
  );
}

ControlButtons.propTypes = {
  onVis: PropTypes.func.isRequired,
  onAud: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  taskType: PropTypes.oneOf(['dual', 'position', 'audio']),
  visState: PropTypes.oneOf(['correct', 'incorrect', 'miss', null]),
  audState: PropTypes.oneOf(['correct', 'incorrect', 'miss', null]),
};

ControlButtons.defaultProps = {
  disabled: false,
  taskType: 'dual',
  visState: null,
  audState: null,
};
