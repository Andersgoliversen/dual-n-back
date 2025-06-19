import React from 'react';
import PropTypes from 'prop-types';

export default function ControlButtons({ onVis, onAud, disabled, taskType, visState, audState }) {
  const getHighlight = (state) => {
    if (state === 'correct') return 'bg-green-500 text-white';
    if (state === 'incorrect') return 'bg-red-500 text-white';
    if (state === 'miss') return 'bg-yellow-400 text-white';
    return '';
  };
  return (
    <div className="flex gap-4 mt-4" role="group" aria-label="response buttons">
      {taskType !== 'audio' && (
        <button
          onClick={onVis}
          disabled={disabled}
          className={`px-4 py-2 rounded-lg border shadow disabled:opacity-40 bg-blue-500 text-white hover:bg-blue-600 ${getHighlight(visState)}`}
          aria-label="visual match button"
        >
          Visual (F)
        </button>
      )}
      {taskType !== 'position' && (
        <button
          onClick={onAud}
          disabled={disabled}
          className={`px-4 py-2 rounded-lg border shadow disabled:opacity-40 bg-blue-500 text-white hover:bg-blue-600 ${getHighlight(audState)}`}
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
