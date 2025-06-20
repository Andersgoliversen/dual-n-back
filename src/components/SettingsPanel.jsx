import React from 'react';
import PropTypes from 'prop-types';

// -----------------------------------------------------------------------------
// Simple panel that allows the player to configure the initial N‑back level,
// stimulus interval and whether the game runs in dual, audio only or position
// only mode.

export default function SettingsPanel({ settings, onChange, onClose }) {
  // Convert numeric inputs to numbers before passing them up to the parent
  const handleNumberChange = (e) => {
    onChange({ ...settings, [e.target.name]: Number(e.target.value) });
  };

  // Update the selected task type
  const handleSelectChange = (e) => {
    onChange({ ...settings, task: e.target.value });
  };

  // Render a small form containing the configurable options
  return (
    <div className="p-4 space-y-3 max-w-sm">
      <h2 className="text-xl mb-2">Settings</h2>
      <label className="block">
        <span className="mr-2">Starting N-Back Level:</span>
        <input
          type="number"
          name="n"
          min="1"
          max="10"
          value={settings.n}
          onChange={handleNumberChange}
          className="border p-1 rounded w-16"
        />
      </label>
      <label className="block">
        <span className="mr-2">Time Between Stimuli (s):</span>
        <input
          type="number"
          name="interval"
          min="1"
          max="5"
          step="0.5"
          value={settings.interval}
          onChange={handleNumberChange}
          className="border p-1 rounded w-16"
        />
      </label>
      <label className="block">
        <span className="mr-2">Task Type:</span>
        <select
          name="task"
          value={settings.task}
          onChange={handleSelectChange}
          className="border p-1 rounded"
        >
          <option value="dual">Dual</option>
          <option value="position">Position Only</option>
          <option value="audio">Audio Only</option>
        </select>
      </label>
      <button className="mt-4 px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600" onClick={onClose}>
        Close
      </button>
    </div>
  );
}

SettingsPanel.propTypes = {
  settings: PropTypes.shape({
    n: PropTypes.number.isRequired,
    interval: PropTypes.number.isRequired,
    task: PropTypes.string.isRequired,
    adaptive: PropTypes.bool.isRequired,
  }).isRequired,
  onChange: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};
