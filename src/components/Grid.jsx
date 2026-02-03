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
      className={`grid grid-cols-3 grid-rows-3 gap-3 w-[clamp(16rem,70vw,32rem)] aspect-square select-none border border-slate-700 rounded-3xl p-3 bg-slate-900/40 ${
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
        if (i === 4) return <div key={i} className="rounded-xl bg-slate-900/20" aria-hidden="true" />;
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
            className={`rounded-2xl border border-slate-700 aspect-square w-full h-full flex items-center justify-center transition-all duration-200 ${
              isActive
                ? 'bg-cyan-400 shadow-xl shadow-cyan-400/50 scale-[1.03]'
                : 'bg-slate-800/80'
            } ${showCorrectFlash && isActive ? 'ring-4 ring-yellow-300' : ''}`}
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
