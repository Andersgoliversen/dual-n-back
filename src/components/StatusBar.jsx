import React from 'react';
import PropTypes from 'prop-types';

export default function StatusBar({ trial, total }) {
  return (
    <div className="mt-4" role="status" aria-live="polite" id="trial-counter-description">
      Trial {trial}/{total}
    </div>
  );
}

StatusBar.propTypes = {
  trial: PropTypes.number.isRequired,
  total: PropTypes.number.isRequired,
};
