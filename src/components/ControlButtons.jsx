import React from 'react';
import PropTypes from 'prop-types';

export default function ControlButtons({ onVis, onAud, disabled, taskType, visState, audState }) {
  const getHighlight = (state) => {
    if (state === 'correct') return 'bg-green-300';
    if (state === 'incorrect') return 'bg-red-300';
    if (state === 'miss') return 'bg-yellow-300';
    return '';
  };
  return (
    <div className="flex gap-4 mt-4" role="group" aria-label="response buttons">
      {taskType !== 'audio' && (
        <button
          onClick={onVis}
          disabled={disabled}
          className={`px-4 py-2 rounded-lg border shadow disabled:opacity-40 ${getHighlight(visState)}`}
          aria-label="visual match button"
        >
          Visual (F)
        </button>
      )}
      {taskType !== 'position' && (
        <button
          onClick={onAud}
          disabled={disabled}
          className={`px-4 py-2 rounded-lg border shadow disabled:opacity-40 ${getHighlight(audState)}`}
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
