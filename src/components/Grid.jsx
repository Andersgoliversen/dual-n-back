import React from 'react';
import PropTypes from 'prop-types';

// -----------------------------------------------------------------------------
// Visual 3x3 grid used during gameplay.  The `active` prop determines which
// cell is highlighted for the current trial.  Optional flags trigger temporary
// success or failure flash animations.

// Mapping from grid cell index (0‑7) to row/column pairs used for accessibility
// labelling.  The centre cell is omitted so the numbering matches the dual
// N‑back conventions.
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

export default function Grid({ active, showCorrectFlash, showIncorrectFlash }) {
  // `active` is an index 0‑7 representing the cell to highlight, or null when
  // no cell should be lit.
  return (
    <div
      className={`grid grid-cols-3 grid-rows-3 gap-1 w-56 h-56 sm:w-72 sm:h-72 lg:w-96 lg:h-96 select-none border border-gray-400 ${
        showCorrectFlash ? 'flash-correct' : ''
      } ${
        showIncorrectFlash ? 'flash-incorrect' : ''
      }`}
      role="grid"
      aria-label="Dual N‑Back visual grid"
      aria-describedby="trial-counter-description"
    >
      {Array.from({ length: 9 }, (_, i) => {
        // Position 4 is the centre square which remains empty in the classic
        // dual N‑back grid.
        if (i === 4) return <div key={i} className="" />;
        // Map 0‑7 to grid positions skipping the centre cell
        const cellIndex = i < 4 ? i : i - 1;
        const isActive = cellIndex === active;
        const { r, c } = mapping[cellIndex];

        return (
          <div
            key={i}
            role="gridcell"
            aria-label={`row ${r} column ${c}`}
            aria-selected={isActive}
            className={`rounded-lg border aspect-square w-full h-full flex items-center justify-center transition-all duration-300 ${
              isActive ? 'bg-blue-600' : 'bg-gray-100'
            } ${showCorrectFlash && isActive ? 'ring-4 ring-yellow-400' : ''}`}
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