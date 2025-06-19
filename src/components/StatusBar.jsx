import React from 'react';
import PropTypes from 'prop-types';

export default function StatusBar({ trial, total }) {
  const pct = Math.min(100, Math.round((trial / total) * 100));
  return (
    <div className="w-full max-w-xs mt-4" role="status" aria-live="polite" id="trial-counter-description">
      <div className="h-2 bg-gray-200 rounded">
        <div className="h-full bg-blue-500 rounded" style={{ width: `${pct}%` }} />
      </div>
      <p className="text-center text-sm mt-2">Trial {trial}/{total}</p>
    </div>
  );
}

StatusBar.propTypes = {
  trial: PropTypes.number.isRequired,
  total: PropTypes.number.isRequired,
};
