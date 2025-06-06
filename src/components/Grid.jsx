import React from 'react';
import PropTypes from 'prop-types';

const mapping = [
  { r: 1, c: 1 }, // 0 top‑left
  { r: 1, c: 2 }, // 1 top‑middle
  { r: 1, c: 3 }, // 2 top‑right
  { r: 2, c: 3 }, // 3 middle‑right
  { r: 3, c: 3 }, // 4 bottom‑right
  { r: 3, c: 2 }, // 5 bottom‑middle
  { r: 3, c: 1 }, // 6 bottom‑left
  { r: 2, c: 1 }, // 7 middle‑left
];

export default function Grid({ active, showCorrectFlash, showIncorrectFlash }) { // Added showCorrectFlash and showIncorrectFlash to props
  // active is index 0‑7 or null
  return (
    <div
      className={`grid grid-cols-3 grid-rows-3 gap-1 w-56 h-56 select-none ${
        showCorrectFlash ? 'flash-correct' : ''
      } ${
        showIncorrectFlash ? 'flash-incorrect' : '' // Conditionally apply incorrect flash class
      }`}
      role="grid"
      aria-label="Dual N‑Back visual grid"
      aria-describedby="trial-counter-description"
    >
      {Array.from({ length: 9 }, (_, i) => {
        if (i === 4) return <div key={i} className="" />; // centre empty
        const cellIndex = i < 4 ? i : i - 1; // map 0‑7 to grid positions skipping centre
        const isActive = cellIndex === active;
        const { r, c } = mapping[cellIndex];

        return (
          <div
            key={i}
            role="gridcell"
            aria-label={`row ${r} column ${c}`}
            aria-selected={isActive}
            className={`rounded-lg border h-full flex items-center justify-center transition-all duration-300 ${
              isActive ? 'bg-blue-400' : 'bg-gray-200'
            }`}
          />
        );
      })}
    </div>
  );
}

Grid.propTypes = {
  active: PropTypes.number, // Can be null, so not isRequired
  showCorrectFlash: PropTypes.bool,
  showIncorrectFlash: PropTypes.bool, // Added prop type for showIncorrectFlash
};

Grid.defaultProps = {
  active: null,
  showCorrectFlash: false,
  showIncorrectFlash: false, // Default value for showIncorrectFlash
};