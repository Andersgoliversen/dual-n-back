import React, { useEffect, useState, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import Grid from './components/Grid.jsx';
import ControlButtons from './components/ControlButtons.jsx';
import StatusBar from './components/StatusBar.jsx';
import { preloadAudio, playLetter } from './utils/audio.js';
import { generateSequence } from './utils/generator.js';
import { evaluateResponses } from './utils/evaluator.js';

const N = 2;
const FILLERS = N;
const NUM_SCORABLE_TRIALS = 20;
const TOTAL_TRIALS_IN_SEQUENCE = NUM_SCORABLE_TRIALS + FILLERS;
const TRIAL_MS = 3000; // 3 s per stimulus

// Simplified mapping for announcer text; ideally, this would be imported or shared
// Grid component has its own 'mapping' array, but it's not exported.
// For robust announcements, this mapping should be consistent.
const positionLabels = [
  "Top-Left", "Top-Middle", "Top-Right",
  "Middle-Right", "Bottom-Right", "Bottom-Middle",
  "Bottom-Left", "Middle-Left"
];

export default function App() {
  const [gameState, setGameState] = useState('intro'); // intro | playing | break | complete
  const [sequence, setSequence] = useState([]);
  const [currentSequenceIndex, setCurrentSequenceIndex] = useState(0); // Index in the sequence array
  const [responses, setResponses] = useState(new Map());
  const timer = useRef(null);
  const unlocked = useRef(false);

  const updateAnnouncer = (id, text) => {
    const el = document.getElementById(id);
    if (el) {
      el.textContent = text;
    }
  };

  // Preload audio once
  useEffect(() => {
    preloadAudio();
    const keyHandler = (e) => {
      if (e.code === 'KeyF') handleResponse('vis');
      if (e.code === 'KeyL') handleResponse('aud');
    };
    window.addEventListener('keydown', keyHandler);
    return () => window.removeEventListener('keydown', keyHandler);
  }, []);

  const unlockAudio = () => {
    if (unlocked.current) return;
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    ctx.resume();
    unlocked.current = true;
  };

  const startGame = () => {
    unlockAudio();
    const seq = generateSequence({ n: N });
    setSequence(seq);
    setResponses(new Map());
    setCurrentSequenceIndex(0);
    setGameState('playing');
    updateAnnouncer('game-state-announcer', 'Game started.');
  };

  // Game state and current trial progression effect
  useEffect(() => {
    if (gameState === 'playing') {
      if (currentSequenceIndex >= TOTAL_TRIALS_IN_SEQUENCE) {
        setGameState('break');
        updateAnnouncer('game-state-announcer', 'Round complete. Press Continue.');
        updateAnnouncer('active-cell-announcer', '');
        return;
      }

      const currentTrialData = sequence[currentSequenceIndex];
      if (currentTrialData) {
        playLetter(currentTrialData.letter);
        const isFiller = currentSequenceIndex < FILLERS;
        if (!isFiller) { // Announce for scorable trials
          const posLabel = positionLabels[currentTrialData.position] || `Position ${currentTrialData.position + 1}`; // +1 for 1-indexed speech
          updateAnnouncer('active-cell-announcer', `Cell ${posLabel}. Letter ${currentTrialData.letter}.`);
        } else { // Optional: Announce fillers differently or keep quiet
          updateAnnouncer('active-cell-announcer', `Get ready. Letter ${currentTrialData.letter}.`);
        }
      } else {
        updateAnnouncer('active-cell-announcer', '');
      }

      timer.current = setTimeout(() => {
        setCurrentSequenceIndex(c => c + 1);
      }, TRIAL_MS);

      return () => clearTimeout(timer.current);
    } else {
      updateAnnouncer('active-cell-announcer', '');
      if (gameState === 'intro') {
        updateAnnouncer('game-state-announcer', 'Welcome to Dual N-Back. Press Start Game.');
      }
    }
  }, [gameState, currentSequenceIndex, sequence]);

  const handleResponse = useCallback(
    (type) => {
      // Only allow responses during scorable part of playing state
      if (gameState !== 'playing' || currentSequenceIndex < FILLERS) return;
      setResponses((prev) => {
        const r = { ...(prev.get(currentSequenceIndex) || { vis: false, aud: false }) };
        if (type === 'vis') r.vis = true;
        if (type === 'aud') r.aud = true;
        return new Map(prev).set(currentSequenceIndex, r);
      });
    },
    [gameState, currentSequenceIndex]
  );

  const handleContinueFromBreak = () => {
    setGameState('complete');
    updateAnnouncer('game-state-announcer', 'Results displayed. Press Play Again to restart.');
  };

  const handlePlayAgain = () => {
    setGameState('intro');
    // gameState announcer will be updated by the main useEffect for 'intro' state
  };

  const results = gameState === 'complete' ? evaluateResponses({ trials: sequence, responses, n: N }) : null;
  const currentScorableTrialNum = Math.max(0, currentSequenceIndex - FILLERS + 1);

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-4">
      <div id="active-cell-announcer" className="visually-hidden" role="status" aria-live="polite"></div>
      <div id="game-state-announcer" className="visually-hidden" role="status" aria-live="assertive"></div>

      {gameState === 'intro' && (
        <>
          <h1 className="text-2xl mb-4">Dual N-Back</h1>
          <button className="px-6 py-3 rounded-lg border shadow" onClick={startGame}>
            Start Game
          </button>
        </>
      )}

      {gameState === 'playing' && sequence[currentSequenceIndex] && (
        <>
          <Grid active={sequence[currentSequenceIndex].position} />
          <ControlButtons
            onVis={() => handleResponse('vis')}
            onAud={() => handleResponse('aud')}
            disabled={currentSequenceIndex < FILLERS}
          />
          <StatusBar
            trial={currentScorableTrialNum > NUM_SCORABLE_TRIALS ? NUM_SCORABLE_TRIALS : currentScorableTrialNum}
            total={NUM_SCORABLE_TRIALS}
          />
        </>
      )}

      {gameState === 'break' && (
        <>
          <p className="mb-4">Round complete.</p>
          <button
            className="px-4 py-2 rounded-lg border shadow"
            onClick={handleContinueFromBreak}
          >
            Continue
          </button>
        </>
      )}

      {gameState === 'complete' && results && (
        <>
          <h2 className="text-xl mb-4">Results</h2>
          <div className="space-y-2">
            <ResultRow label="Visual" data={results.visual} />
            <ResultRow label="Auditory" data={results.auditory} />
            <ResultRow label="Dual" data={results.dual} />
          </div>
          <button
            className="mt-6 px-4 py-2 rounded-lg border shadow"
            onClick={handlePlayAgain}
          >
            Play Again
          </button>
        </>
      )}
    </main>
  );
}

function ResultRow({ label, data }) {
  return (
    <p>
      {label}: {data.hits}/{data.total} ({data.pct}%)
    </p>
  );
}

ResultRow.propTypes = {
  label: PropTypes.string.isRequired,
  data: PropTypes.shape({
    hits: PropTypes.number.isRequired,
    total: PropTypes.number.isRequired,
    pct: PropTypes.number.isRequired,
  }).isRequired,
};
