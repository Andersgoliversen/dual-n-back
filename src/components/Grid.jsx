import React from 'react';
import PropTypes from 'prop-types';

// -----------------------------------------------------------------------------
// Reusable SVG based 3x3 grid.  The centre square is never used so only
// eight cells can become active.  The "active" prop refers to the index of the
// highlighted cell using the common Dual N‑Back ordering.  Flash classes allow
// the parent component to provide quick visual feedback for correct/incorrect
// responses.

// Mapping from the Dual N‑Back ordering (0‑7) to row/column coordinates.  These
// values are used for accessibility labels and to position the rectangles inside
// the SVG.  Each cell is 1x1 units within a 3x3 viewBox.
const mapping = [
  { r: 1, c: 1, x: 0, y: 0 }, // top‑left
  { r: 1, c: 2, x: 1, y: 0 }, // top‑middle
  { r: 1, c: 3, x: 2, y: 0 }, // top‑right
  { r: 2, c: 3, x: 2, y: 1 }, // middle‑right
  { r: 3, c: 3, x: 2, y: 2 }, // bottom‑right
  { r: 3, c: 2, x: 1, y: 2 }, // bottom‑middle
  { r: 3, c: 1, x: 0, y: 2 }, // bottom‑left
  { r: 2, c: 1, x: 0, y: 1 }, // middle‑left
];

export default function Grid({ active, showCorrectFlash, showIncorrectFlash }) {
  return (
    <div
      className={`select-none border border-gray-400 inline-block ${
        showCorrectFlash ? 'flash-correct' : ''
      } ${showIncorrectFlash ? 'flash-incorrect' : ''}`}
      role="grid"
      aria-label="Dual N‑Back visual grid"
      aria-describedby="trial-counter-description"
    >
      <svg
        className="w-56 h-56 sm:w-72 sm:h-72 lg:w-96 lg:h-96"
        viewBox="0 0 3 3"
      >
        {/* Draw grid lines */}
        <path
          d="M1 0v3M2 0v3M0 1h3M0 2h3"
          stroke="#9ca3af"
          strokeWidth="0.05"
          fill="none"
        />
        {mapping.map(({ r, c, x, y }, idx) => {
          const isActive = idx === active;
          return (
            <rect
              key={idx}
              x={x + 0.05}
              y={y + 0.05}
              width="0.9"
              height="0.9"
              rx="0.1"
              role="gridcell"
              aria-label={`row ${r} column ${c}`}
              aria-selected={isActive}
              className="transition-colors duration-300"
              fill={isActive ? '#2563eb' : '#f3f4f6'}
            />
          );
        })}
      </svg>
    </div>
  );
}

Grid.propTypes = {
  active: PropTypes.number,
  showCorrectFlash: PropTypes.bool,
  showIncorrectFlash: PropTypes.bool,
};

Grid.defaultProps = {
  active: null,
  showCorrectFlash: false,
  showIncorrectFlash: false,
};