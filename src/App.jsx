// Core gameplay logic for the Dual N‑Back application lives in this component.
// It orchestrates the state machine for the game, handles timing, manages
// responses and renders the UI.  Many of the values here control the behaviour
// of the game such as the N‑back level or the delay between stimuli.
import React, { useEffect, useState, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import Grid from './components/Grid.jsx';
import ControlButtons from './components/ControlButtons.jsx';
import StatusBar from './components/StatusBar.jsx';
import SettingsPanel from './components/SettingsPanel.jsx';
import { preloadAudio, playLetter, playFeedback } from './utils/audio.js';
import { generateSequence } from './utils/generator.js';
import { evaluateResponses } from './utils/evaluator.js';
import Stats from './components/Stats.jsx';

// Number of trials that actually count towards the player's score.  Each round
// includes some initial "filler" trials that allow the N‑back comparison to
// work.
const NUM_SCORABLE_TRIALS = 20;

// Human friendly labels for each grid position used by screen readers and
// announcements.  The index corresponds to the numeric position in the
// sequence data.
const positionLabels = [
  "Top-Left", "Top-Middle", "Top-Right",
  "Middle-Right", "Bottom-Right", "Bottom-Middle",
  "Bottom-Left", "Middle-Left"
];

export default function App() {
  // ---------- Gameplay configuration and runtime state ----------
  // Settings are user configurable via the settings panel.
  const [settings, setSettings] = useState({ n: 2, interval: 3, task: 'dual' });
  const N = settings.n;                        // Current N‑back level
  const FILLERS = N;                           // Number of non‑scorable filler trials
  const TRIAL_MS = settings.interval * 1000;   // Delay between each stimulus
  const TOTAL_TRIALS_IN_SEQUENCE = NUM_SCORABLE_TRIALS + FILLERS;

  // The overall finite state machine for the game (intro -> playing -> break -> complete)
  const [gameState, setGameState] = useState('intro');

  // Generated sequence of positions/letters for this round
  const [sequence, setSequence] = useState([]);

  // Index of the currently shown trial within the sequence
  const [currentSequenceIndex, setCurrentSequenceIndex] = useState(0);

  // Map of user responses keyed by trial index
  const [responses, setResponses] = useState(new Map());

  // Various refs used for timers and unlocked audio context
  const timer = useRef(null);
  const unlocked = useRef(false);
  const [showCorrectFlash, setShowCorrectFlash] = useState(false); // For correct response flash
  const flashTimeoutRef = useRef(null); // Ref for the flash timeout
  const [showIncorrectFlashAnimation, setShowIncorrectFlashAnimation] = useState(false);
  const incorrectFlashTimeoutRef = useRef(null);
  const [buttonHighlight, setButtonHighlight] = useState({ vis: null, aud: null });
  const buttonHighlightTimeouts = useRef({ vis: null, aud: null });

  // Whether the optional "focus mode" is enabled. When true the UI hides
  // non-essential elements so only the grid is visible during gameplay.
  const [focusMode, setFocusMode] = useState(false);

  // Ensure a unique identifier exists for the user so progress can be tracked
  // locally. This only runs once on mount.
  useEffect(() => {
    if (!localStorage.getItem('dnb-user-id')) {
      localStorage.setItem('dnb-user-id', crypto.randomUUID());
    }
  }, []);

  // Helper used to update the hidden aria-live regions that announce changes to
  // assistive technologies.
  const updateAnnouncer = (id, text) => {
    const el = document.getElementById(id);
    if (el) {
      el.textContent = text;
    }
  };

  // ----- One time setup -----
  // Preload audio assets and register global key handlers for A/L shortcuts.
  useEffect(() => {
    preloadAudio();
    const keyHandler = (e) => {
      const key = e.key.toLowerCase();
      if (key === 'a') handleResponse('vis');
      if (key === 'l') handleResponse('aud');
    };
    document.addEventListener('keydown', keyHandler);

    // Clean up event listeners and any running timers when unmounting.
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
    setButtonHighlight({ vis: null, aud: null });
    if (buttonHighlightTimeouts.current.vis) clearTimeout(buttonHighlightTimeouts.current.vis);
    if (buttonHighlightTimeouts.current.aud) clearTimeout(buttonHighlightTimeouts.current.aud);
  };

  // Visually highlight the response buttons when a correct/incorrect/missed
  // response occurs to provide immediate feedback to the player.
  const flashButton = (type, state) => {
    setButtonHighlight(prev => ({ ...prev, [type]: state }));
    if (buttonHighlightTimeouts.current[type]) clearTimeout(buttonHighlightTimeouts.current[type]);
    buttonHighlightTimeouts.current[type] = setTimeout(() => {
      setButtonHighlight(prev => ({ ...prev, [type]: null }));
    }, 300);
  };

  // ---------------------------------------------------------------------------
  // Main gameplay loop
  // This effect advances the sequence and plays audio/visual cues.  It also
  // handles end-of-round logic and sets up the next timer tick.
  useEffect(() => {
    if (gameState === 'playing') {
      // Clear any leftover feedback from the previous trial
      setShowIncorrectFlashAnimation(false);
      if (incorrectFlashTimeoutRef.current) clearTimeout(incorrectFlashTimeoutRef.current);

      if (currentSequenceIndex > FILLERS) {
        // Highlight misses from the previous trial if the user failed to respond
        const prevIndex = currentSequenceIndex - 1;
        const prevTrial = sequence[prevIndex];
        const nBackPrev = sequence[prevIndex - N];
        if (prevTrial && nBackPrev) {
          const prevResp = responses.get(prevIndex) || { vis: false, aud: false };
          if (prevTrial.position === nBackPrev.position && !prevResp.vis) {
            flashButton('vis', 'miss');
          }
          if (prevTrial.letter === nBackPrev.letter && !prevResp.aud) {
            flashButton('aud', 'miss');
          }
        }
      }

      // If we've reached the end of the sequence move to the break state.
      if (currentSequenceIndex >= TOTAL_TRIALS_IN_SEQUENCE) {
        setGameState('break');
        updateAnnouncer('game-state-announcer', 'Round complete. Press Continue.');
        updateAnnouncer('active-cell-announcer', '');
        return; // Prevent scheduling another timer
      }

      const currentTrialData = sequence[currentSequenceIndex];
      if (currentTrialData) {
        document.body.focus();
        if (settings.task !== 'position') {
          (async () => { await playLetter(currentTrialData.letter); })();
        }
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
  }, [gameState, currentSequenceIndex, sequence, TRIAL_MS, settings.task, responses]);

  // Handle a user response (either visual or auditory).  This performs the
  // correctness check, triggers feedback and records the response.
  const handleResponse = useCallback(
    (type) => {
      if (gameState !== 'playing' || currentSequenceIndex < FILLERS || !sequence[currentSequenceIndex] || !sequence[currentSequenceIndex - N]) return;
      if ((settings.task === 'position' && type === 'aud') || (settings.task === 'audio' && type === 'vis')) return;

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
        flashButton(type === 'vis' ? 'vis' : 'aud', 'correct');
      } else {
        // Wrong key or incorrect guess – flash red and play error tone
        setShowIncorrectFlashAnimation(true);
        if (incorrectFlashTimeoutRef.current) clearTimeout(incorrectFlashTimeoutRef.current);
        incorrectFlashTimeoutRef.current = setTimeout(() => {
          setShowIncorrectFlashAnimation(false);
        }, 300); // Flash duration for incorrect press
        flashButton(type === 'vis' ? 'vis' : 'aud', 'incorrect');
      }

      (async () => { await playFeedback(); })();

      setResponses((prev) => {
        const r = { ...(prev.get(currentSequenceIndex) || { vis: false, aud: false }) };
        if (type === 'vis') r.vis = true;
        if (type === 'aud') r.aud = true;
        return new Map(prev).set(currentSequenceIndex, r);
      });
    },
    [gameState, currentSequenceIndex, sequence, flashButton]
  );

  // Persist the results of a completed round to local storage.  This allows the
  // Stats screen to show historical progress for the current browser profile.
  const saveSession = (results) => {
    const history = JSON.parse(localStorage.getItem('dnb-history') || '[]');
    history.push({
      date: new Date().toISOString(),
      level: N,
      accuracy: results.dual.pct,
    });
    localStorage.setItem('dnb-history', JSON.stringify(history));
  };

  // Called when the player clicks "Continue" after a round.  Evaluates the
  // responses, stores them and transitions to the results screen.
  const handleContinueFromBreak = () => {
    const r = evaluateResponses({ trials: sequence, responses, n: N });
    saveSession(r);
    setGameState('complete');
    updateAnnouncer('game-state-announcer', 'Results displayed. Press Play Again to restart.');
  };

  // Reset the game back to the intro screen so another round can be started.
  const handlePlayAgain = () => {
    setGameState('intro');
  };

  // Re-compute the aggregate results when the round is complete so that the
  // Results screen can display hits and accuracy numbers.
  const results = gameState === 'complete' ? evaluateResponses({ trials: sequence, responses, n: N }) : null;

  // This value is used to drive the status bar.  It ignores the initial filler
  // trials so that "Trial 1" is the first scorable trial.
  const currentScorableTrialNum = Math.max(0, currentSequenceIndex - FILLERS + 1);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4">
      {!focusMode && (
        <header className="w-full max-w-3xl flex justify-between items-center mb-6">
          <div className="flex space-x-4 text-sm">
            <button className="underline" onClick={() => setGameState('stats')}>
              Stats
            </button>
            <button className="underline" onClick={() => setGameState('settings')}>
              Settings
            </button>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm font-semibold text-gray-700">{N}-Back</span>
            <button
              className="underline text-sm"
              onClick={() => setFocusMode(true)}
            >
              Focus Mode
            </button>
          </div>
        </header>
      )}
      {focusMode && (
        <button
          className="fixed top-2 right-2 text-sm underline px-2 py-1 bg-white bg-opacity-80 rounded"
          onClick={() => setFocusMode(false)}
        >
          Exit Focus
        </button>
      )}
      <div id="active-cell-announcer" className="visually-hidden" role="status" aria-live="polite"></div>
      <div id="game-state-announcer" className="visually-hidden" role="status" aria-live="assertive"></div>

      {gameState === 'intro' && (
        <div className="flex flex-col items-center text-center space-y-4">
          <h1 className="text-3xl font-semibold">Dual N-Back</h1>
          <p className="max-w-md text-gray-700">
            The goal is to match the visual position and the auditory letter from {N} trials ago.
            <br />
            Press 'A' if the current position matches the position from {N} trials back.
            <br />
            Press 'L' if the current letter matches the letter from {N} trials back.
          </p>
          <button
            className="px-6 py-3 rounded-lg bg-blue-500 text-white hover:bg-blue-600"
            onClick={startGame}
          >
            Start Game
          </button>
        </div>
      )}

      {gameState === 'playing' && sequence[currentSequenceIndex] && (
        <div className="flex flex-col items-center space-y-4">
          <Grid
            active={settings.task === 'audio' ? null : sequence[currentSequenceIndex].position}
            showCorrectFlash={showCorrectFlash}
            showIncorrectFlash={showIncorrectFlashAnimation}
          />
          {!focusMode && (
            <ControlButtons
              onVis={() => handleResponse('vis')}
              onAud={() => handleResponse('aud')}
              disabled={currentSequenceIndex < FILLERS || !timer.current}
              taskType={settings.task}
              visState={buttonHighlight.vis}
              audState={buttonHighlight.aud}
            />
          )}
          {!focusMode && (
            <StatusBar
              trial={
                currentScorableTrialNum > NUM_SCORABLE_TRIALS
                  ? NUM_SCORABLE_TRIALS
                  : currentScorableTrialNum
              }
              total={NUM_SCORABLE_TRIALS}
            />
          )}
        </div>
      )}

      {gameState === 'break' && (
        <div className="flex flex-col items-center space-y-4">
          <p>Round complete.</p>
          <button
            className="px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600"
            onClick={handleContinueFromBreak}
          >
            Continue
          </button>
        </div>
      )}

      {gameState === 'complete' && results && (
        <div className="flex flex-col items-center space-y-4">
          <h2 className="text-xl">Results</h2>
          <div className="space-y-2">
            <ResultRow label="Visual" data={results.visual} />
            <ResultRow label="Auditory" data={results.auditory} />
            <ResultRow label="Dual" data={results.dual} />
          </div>
          <button
            className="mt-4 px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600"
            onClick={handlePlayAgain}
          >
            Play Again
          </button>
        </div>
      )}

      {gameState === 'stats' && <Stats onBack={() => setGameState('intro')} />}
      {gameState === 'settings' && (
        <SettingsPanel
          settings={settings}
          onChange={setSettings}
          onClose={() => setGameState('intro')}
        />
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
