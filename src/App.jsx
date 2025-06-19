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

const positionLabels = [
  "Top-Left", "Top-Middle", "Top-Right",
  "Middle-Right", "Bottom-Right", "Bottom-Middle",
  "Bottom-Left", "Middle-Left"
];

export default function App() {
  const [gameState, setGameState] = useState('intro');
  const [sequence, setSequence] = useState([]);
  const [currentSequenceIndex, setCurrentSequenceIndex] = useState(0);
  const [responses, setResponses] = useState(new Map());
  const timer = useRef(null);
  const unlocked = useRef(false);
  const [showCorrectFlash, setShowCorrectFlash] = useState(false); // For correct response flash
  const flashTimeoutRef = useRef(null); // Ref for the flash timeout
  const [incorrectVisPress, setIncorrectVisPress] = useState(false);
  const [incorrectAudPress, setIncorrectAudPress] = useState(false);
  const [showIncorrectFlashAnimation, setShowIncorrectFlashAnimation] = useState(false);
  const incorrectFlashTimeoutRef = useRef(null);

  const updateAnnouncer = (id, text) => {
    const el = document.getElementById(id);
    if (el) {
      el.textContent = text;
    }
  };

  // Main useEffect cleanup
  useEffect(() => {
    // This effect is primarily for preloading and global key listeners
    preloadAudio();
    const keyHandler = (e) => {
      const key = e.key.toLowerCase();
      if (key === 'f') handleResponse('vis');
      if (key === 'l') handleResponse('aud');
    };
    document.addEventListener('keydown', keyHandler);

    // Cleanup function for this effect
    return () => {
      document.removeEventListener('keydown', keyHandler);
      // Clear any pending timeouts when App unmounts or before this effect re-runs (though it has empty deps)
      if (timer.current) clearTimeout(timer.current); // Already present for game timer
      if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current); // Cleanup for flash
      if (incorrectFlashTimeoutRef.current) clearTimeout(incorrectFlashTimeoutRef.current); // Cleanup for incorrect flash
    };
  }, []); // Empty dependency array means this runs once on mount

  const unlockAudio = () => {
    if (unlocked.current) return;
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    ctx.resume();
    const clip = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA=');
    clip.play().catch(() => {});
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
    setShowCorrectFlash(false); // Ensure flash is off at game start
    if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current); // Clear any lingering flash
  };

  // Game state and current trial progression effect
  useEffect(() => {
    if (gameState === 'playing') {
      setIncorrectVisPress(false);
      setIncorrectAudPress(false);
      setShowIncorrectFlashAnimation(false); // Reset incorrect flash
      if (incorrectFlashTimeoutRef.current) clearTimeout(incorrectFlashTimeoutRef.current); // Clear pending incorrect flash timeout

      if (currentSequenceIndex >= TOTAL_TRIALS_IN_SEQUENCE) {
        setGameState('break');
        updateAnnouncer('game-state-announcer', 'Round complete. Press Continue.');
        updateAnnouncer('active-cell-announcer', '');
        return; // Return here to prevent setting new timer
      }

      const currentTrialData = sequence[currentSequenceIndex];
      if (currentTrialData) {
        document.body.focus();
        (async () => { await playLetter(currentTrialData.letter); })();
        // const isFiller = currentSequenceIndex < FILLERS; // This variable is no longer strictly needed for the announcer text
        const posLabel = positionLabels[currentTrialData.position] || `Position ${currentTrialData.position + 1}`;
        // Always announce position and letter for active trials
        updateAnnouncer('active-cell-announcer', `Cell ${posLabel}. Letter ${currentTrialData.letter}.`);
      } else {
        updateAnnouncer('active-cell-announcer', '');
      }

      // Clear previous timer before setting a new one
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        setCurrentSequenceIndex(c => c + 1);
      }, TRIAL_MS);

      // No return () => clearTimeout(timer.current) here, moved to main useEffect cleanup or handle in else block
    } else { // Not 'playing' state
      updateAnnouncer('active-cell-announcer', '');
      if (gameState === 'intro') {
        updateAnnouncer('game-state-announcer', 'Welcome to Dual N-Back. Press Start Game.');
      }
      // Ensure timer is cleared if game stops for any reason other than natural end
      if (timer.current) clearTimeout(timer.current);
      if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current); // Clear flash if game stops
      setShowCorrectFlash(false);
      setShowIncorrectFlashAnimation(false); // Reset incorrect flash also when not playing
      if (incorrectFlashTimeoutRef.current) clearTimeout(incorrectFlashTimeoutRef.current); // Clear pending incorrect flash timeout
    }
    // This effect's cleanup should handle the timer if the dependencies change mid-flight
    // However, the main App unmount cleanup for timer.current is in the first useEffect.
    // For robustness, let's ensure this specific timer is cleared if dependencies change while it's active.
    return () => {
        if (timer.current) clearTimeout(timer.current);
    }
  }, [gameState, currentSequenceIndex, sequence]);

  const handleResponse = useCallback(
    (type) => {
      if (gameState !== 'playing' || currentSequenceIndex < FILLERS || !sequence[currentSequenceIndex] || !sequence[currentSequenceIndex - N]) return;

      const currentTrial = sequence[currentSequenceIndex];
      const nBackTrial = sequence[currentSequenceIndex - N];
      let isCorrect = false;

      if (type === 'vis') {
        if (currentTrial.position === nBackTrial.position) {
          isCorrect = true;
        }
      } else if (type === 'aud') {
        if (currentTrial.letter === nBackTrial.letter) {
          isCorrect = true;
        }
      }

      if (isCorrect) {
        setShowCorrectFlash(true);
        if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
        flashTimeoutRef.current = setTimeout(() => {
          setShowCorrectFlash(false);
        }, 150); // Flash duration
      } else {
        // If the response was not correct, set the appropriate incorrect press state
        if (type === 'vis') {
          setIncorrectVisPress(true);
        } else if (type === 'aud') {
          setIncorrectAudPress(true);
        }
        // Trigger incorrect flash animation
        setShowIncorrectFlashAnimation(true);
        if (incorrectFlashTimeoutRef.current) clearTimeout(incorrectFlashTimeoutRef.current);
        incorrectFlashTimeoutRef.current = setTimeout(() => {
          setShowIncorrectFlashAnimation(false);
        }, 300); // Flash duration for incorrect press
      }

      setResponses((prev) => {
        const r = { ...(prev.get(currentSequenceIndex) || { vis: false, aud: false }) };
        if (type === 'vis') r.vis = true;
        if (type === 'aud') r.aud = true;
        return new Map(prev).set(currentSequenceIndex, r);
      });
    },
    [gameState, currentSequenceIndex, sequence]
  );

  const handleContinueFromBreak = () => {
    setGameState('complete');
    updateAnnouncer('game-state-announcer', 'Results displayed. Press Play Again to restart.');
  };

  const handlePlayAgain = () => {
    setGameState('intro');
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
          <p className="mb-4 text-center" style={{ maxWidth: '400px' }}>
            The goal is to match the visual position and the auditory letter from {N} trials ago.
            <br />
            Press 'F' if the current position matches the position from {N} trials back.
            <br />
            Press 'L' if the current letter matches the letter from {N} trials back.
          </p>
          <button className="px-6 py-3 rounded-lg border shadow" onClick={startGame}>
            Start Game
          </button>
        </>
      )}

      {gameState === 'playing' && sequence[currentSequenceIndex] && (
        <>
          <Grid
            active={sequence[currentSequenceIndex].position}
            showCorrectFlash={showCorrectFlash}
            showIncorrectFlash={showIncorrectFlashAnimation}
          />
          <ControlButtons
            onVis={() => handleResponse('vis')}
            onAud={() => handleResponse('aud')}
            disabled={currentSequenceIndex < FILLERS || !timer.current}
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
