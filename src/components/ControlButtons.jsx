import React from 'react';

export default function ControlButtons({ onVis, onAud, disabled }) {
  return (
    <div className="flex gap-4 mt-4" role="group" aria-label="response buttons">
      <button
        onClick={onVis}
        disabled={disabled}
        className="px-4 py-2 rounded-lg border shadow disabled:opacity-40"
        aria-label="visual match button"
      >
        Visual (F)
      </button>
      <button
        onClick={onAud}
        disabled={disabled}
        className="px-4 py-2 rounded-lg border shadow disabled:opacity-40"
        aria-label="auditory match button"
      >
        Audio (L)
      </button>
    </div>
  );
}