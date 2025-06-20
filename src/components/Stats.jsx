import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';

// -----------------------------------------------------------------------------
// Displays a line chart of previous sessions using data stored in local
// storage.  This gives the player insight into how their N‑back level and
// accuracy have changed over time.
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export default function Stats({ onBack }) {
  const [history, setHistory] = useState([]);

  // Load saved sessions from local storage once on mount
  useEffect(() => {
    const stored = localStorage.getItem('dnb-history');
    if (stored) {
      try {
        setHistory(JSON.parse(stored));
      } catch {
        setHistory([]);
      }
    }
  }, []);

  // Prepare datasets for Chart.js
  const labels = history.map((h) => new Date(h.date).toLocaleDateString());
  const data = {
    labels,
    datasets: [
      {
        label: 'N-Back Level',
        data: history.map((h) => h.level),
        borderColor: 'rgb(99, 102, 241)',
        backgroundColor: 'rgba(99, 102, 241, 0.5)',
        yAxisID: 'y',
      },
      {
        label: 'Accuracy %',
        data: history.map((h) => h.accuracy),
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.5)',
        yAxisID: 'y1',
      },
    ],
  };

  const options = {
    responsive: true,
    interaction: { mode: 'index', intersect: false },
    stacked: false,
    scales: {
      y: {
        type: 'linear',
        position: 'left',
        ticks: { stepSize: 1 },
        title: { display: true, text: 'Level' },
      },
      y1: {
        type: 'linear',
        position: 'right',
        grid: { drawOnChartArea: false },
        min: 0,
        max: 100,
        title: { display: true, text: 'Accuracy (%)' },
      },
    },
  };

  return (
    <div className="max-w-lg mx-auto p-4">
      <h2 className="text-xl mb-4 text-center">Your Progress</h2>
      {history.length === 0 ? (
        <p className="text-center mb-4">No data yet.</p>
      ) : (
        <Line data={data} options={options} />
      )}
      <div className="mt-4 text-center">
        <button className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors duration-150" onClick={onBack}>
          Back
        </button>
      </div>
    </div>
  );
}

Stats.propTypes = {
  onBack: PropTypes.func.isRequired,
};
