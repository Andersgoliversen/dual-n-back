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
  const [settings, setSettings] = useState({
    n: 2,
    interval: 3,
    task: 'dual',
    adaptive: true,
  });
  const N = settings.n;                        // Current N‑back level
  const adaptive = settings.adaptive;          // Whether adaptive difficulty is enabled
  const FILLERS = N;                           // Number of non‑scorable filler trials
  const TRIAL_MS = settings.interval * 1000;   // Delay between each stimulus
  const TOTAL_TRIALS_IN_SEQUENCE = NUM_SCORABLE_TRIALS + FILLERS;

  // The overall finite state machine for the game (intro -> playing -> break -> complete)
  const [gameState, setGameState] = useState('intro');
  const [countdown, setCountdown] = useState(null);

  // Generated sequence of positions/letters for this round
  const [sequence, setSequence] = useState([]);

  // Index of the currently shown trial within the sequence
  const [currentSequenceIndex, setCurrentSequenceIndex] = useState(0);

  // Map of user responses keyed by trial index
  const [responses, setResponses] = useState(new Map());
  const responsesRef = useRef(responses);

  // Stores results from the most recently completed round so the
  // next round's difficulty can be adjusted.
  const [lastResults, setLastResults] = useState(null);

  // Various refs used for timers and unlocked audio context
  const timer = useRef(null);
  const unlocked = useRef(false);
  const [showCorrectFlash, setShowCorrectFlash] = useState(false); // For correct response flash
  const flashTimeoutRef = useRef(null); // Ref for the flash timeout
  const [showIncorrectFlashAnimation, setShowIncorrectFlashAnimation] = useState(false);
  const incorrectFlashTimeoutRef = useRef(null);
  const [buttonHighlight, setButtonHighlight] = useState({ vis: null, aud: null });
  const buttonHighlightTimeouts = useRef({ vis: null, aud: null });
  // Ref for the start button so it can be focused when the intro screen appears
  const startButtonRef = useRef(null);
  // Controls visibility of the share links shown on the results screen
  const [showShareOptions, setShowShareOptions] = useState(false);

  // Whether the optional "focus mode" is enabled. When true the UI hides
  // non-essential elements so only the grid is visible during gameplay.
  const [focusMode, setFocusMode] = useState(false);

  const countdownTimer = useRef(null);

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
  }, []);

  useEffect(() => {
    const keyHandler = (e) => {
      const tag = e.target?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
      const key = e.key.toLowerCase();
      if (key === 'a') handleResponse('vis');
      if (key === 'l') handleResponse('aud');
    };
    document.addEventListener('keydown', keyHandler);

    return () => {
      document.removeEventListener('keydown', keyHandler);
    };
  }, [handleResponse]);

  useEffect(() => {
    responsesRef.current = responses;
  }, [responses]);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
      if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
      if (incorrectFlashTimeoutRef.current) clearTimeout(incorrectFlashTimeoutRef.current);
      if (countdownTimer.current) clearTimeout(countdownTimer.current);
    };
  }, []);

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
    setLastResults(null); // Clear old results when a new round starts
    setCurrentSequenceIndex(0);
    setCountdown(3);
    setGameState('countdown');
    updateAnnouncer('game-state-announcer', 'Get ready.');
    setShowCorrectFlash(false); // Ensure flash is off at game start
    if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current); // Clear any lingering flash
    setButtonHighlight({ vis: null, aud: null });
    if (buttonHighlightTimeouts.current.vis) clearTimeout(buttonHighlightTimeouts.current.vis);
    if (buttonHighlightTimeouts.current.aud) clearTimeout(buttonHighlightTimeouts.current.aud);
  };

  const handlePause = () => {
    if (timer.current) clearTimeout(timer.current);
    setGameState('paused');
    updateAnnouncer('game-state-announcer', 'Game paused.');
  };

  const handleResume = () => {
    setGameState('playing');
    updateAnnouncer('game-state-announcer', 'Game resumed.');
  };

  // Automatically focus the Start button whenever the intro screen is shown
  useEffect(() => {
    if (gameState === 'intro' && startButtonRef.current) {
      startButtonRef.current.focus();
    }
  }, [gameState]);

  useEffect(() => {
    if (gameState !== 'countdown' || countdown === null) return;

    if (countdown <= 0) {
      setGameState('playing');
      setCountdown(null);
      updateAnnouncer('game-state-announcer', 'Game started.');
      return;
    }

    updateAnnouncer('game-state-announcer', `Starting in ${countdown}...`);
    if (countdownTimer.current) clearTimeout(countdownTimer.current);
    countdownTimer.current = setTimeout(() => {
      setCountdown((c) => (c === null ? null : c - 1));
    }, 1000);
  }, [gameState, countdown]);

  // Visually highlight the response buttons when a correct/incorrect/missed
  // response occurs to provide immediate feedback to the player.
  const flashButton = useCallback((type, state) => {
    setButtonHighlight((prev) => ({ ...prev, [type]: state }));
    if (buttonHighlightTimeouts.current[type]) clearTimeout(buttonHighlightTimeouts.current[type]);
    buttonHighlightTimeouts.current[type] = setTimeout(() => {
      setButtonHighlight((prev) => ({ ...prev, [type]: null }));
    }, 300);
  }, []);

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
          const prevResp = responsesRef.current.get(prevIndex) || { vis: false, aud: false };
          if (settings.task !== 'audio' && prevTrial.position === nBackPrev.position && !prevResp.vis) {
            flashButton('vis', 'miss');
          }
          if (settings.task !== 'position' && prevTrial.letter === nBackPrev.letter && !prevResp.aud) {
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
        setCurrentSequenceIndex((c) => c + 1);
      }, TRIAL_MS);

      // No return () => clearTimeout(timer.current) here, moved to main useEffect cleanup or handle in else block
    } else if (gameState === 'paused') {
      if (timer.current) clearTimeout(timer.current);
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
  }, [
    gameState,
    currentSequenceIndex,
    sequence,
    TRIAL_MS,
    settings.task,
    N,
    FILLERS,
    TOTAL_TRIALS_IN_SEQUENCE,
    flashButton,
  ]);

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
    [gameState, currentSequenceIndex, sequence, N, FILLERS, settings.task, flashButton]
  );

  // Persist the results of a completed round to local storage.  This allows the
  // Stats screen to show historical progress for the current browser profile.
  const saveSession = (results) => {
    const history = JSON.parse(localStorage.getItem('dnb-history') || '[]');
    const accuracy =
      settings.task === 'dual'
        ? results.dual.pct
        : settings.task === 'position'
          ? results.visual.pct
          : results.auditory.pct;
    history.push({
      date: new Date().toISOString(),
      level: N,
      accuracy,
      task: settings.task,
    });
    localStorage.setItem('dnb-history', JSON.stringify(history));
  };

  // Called when the player clicks "Continue" after a round.  Evaluates the
  // responses, stores them and transitions to the results screen.
  const handleContinueFromBreak = () => {
    const r = evaluateResponses({ trials: sequence, responses, n: N, task: settings.task });
    saveSession(r);
    setLastResults(r); // Store results for adaptive difficulty
    setGameState('complete');
    updateAnnouncer('game-state-announcer', 'Results displayed. Press Play Again to restart.');
  };

  // Reset the game back to the intro screen so another round can be started.
  const handlePlayAgain = () => {
    // Adjust the N-back level for the next round based on the
    // previous session's visual and auditory accuracy when adaptive
    // difficulty is enabled.
    if (adaptive && lastResults) {
      let next = N;
      const visualPct = lastResults.visual.pct;
      const auditoryPct = lastResults.auditory.pct;
      if (settings.task === 'dual') {
        if (visualPct > 90 && auditoryPct > 90) {
          next = N + 1;
        } else if (visualPct < 75 || auditoryPct < 75) {
          next = Math.max(1, N - 1);
        }
      } else if (settings.task === 'position') {
        if (visualPct > 90) {
          next = N + 1;
        } else if (visualPct < 75) {
          next = Math.max(1, N - 1);
        }
      } else {
        if (auditoryPct > 90) {
          next = N + 1;
        } else if (auditoryPct < 75) {
          next = Math.max(1, N - 1);
        }
      }
      if (next !== N) {
        setSettings((s) => ({ ...s, n: next }));
      }
    }
    setGameState('intro');
    setShowShareOptions(false);
  };

  // Toggle showing share options or trigger Web Share when supported
  const handleShare = () => {
    const message = `I just reached N-Back level ${N} on this Dual N-Back game! #dualnback`;
    const url = window.location.href;
    if (navigator.share) {
      // Use native sharing when available
      navigator.share({ text: message, url }).catch(() => {});
    } else {
      // Fallback displays buttons for specific platforms
      setShowShareOptions((s) => !s);
    }
  };

  // Re-compute the aggregate results when the round is complete so that the
  // Results screen can display hits and accuracy numbers.
  // Use stored results when available so changing the N-back level
  // after a round doesn't alter the displayed statistics.
  const results = gameState === 'complete'
    ? lastResults || evaluateResponses({ trials: sequence, responses, n: N, task: settings.task })
    : null;

  // This value is used to drive the status bar.  It ignores the initial filler
  // trials so that "Trial 1" is the first scorable trial.
  const currentScorableTrialNum = Math.max(0, currentSequenceIndex - FILLERS + 1);
  const currentScore = results
    ? settings.task === 'dual'
      ? results.dual.pct
      : settings.task === 'position'
        ? results.visual.pct
        : results.auditory.pct
    : null;
  const taskLabel =
    settings.task === 'dual'
      ? 'Dual'
      : settings.task === 'position'
        ? 'Position Only'
        : 'Audio Only';

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100 font-sans">
      <div className="w-full max-w-5xl mx-auto px-4 py-8 flex flex-col gap-6">
        {!focusMode && (
          <header className="w-full flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
            <div>
              <h1 className="text-3xl font-semibold">Dual N-Back</h1>
              <p className="text-sm text-slate-300">
                Train working memory with timed visual + audio matches.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-200">
              <button
                className="rounded-full border border-slate-700 px-4 py-2 hover:bg-slate-800"
                onClick={() => setGameState('stats')}
              >
                Stats
              </button>
              <button
                className="rounded-full border border-slate-700 px-4 py-2 hover:bg-slate-800"
                onClick={() => setGameState('settings')}
              >
                Settings
              </button>
              <div className="flex items-center gap-2 rounded-full border border-slate-700 px-4 py-2">
                <span className="text-slate-400">Level</span>
                <span className="font-semibold text-white">{N}-Back</span>
              </div>
              <button
                className="rounded-full border border-slate-700 px-4 py-2 hover:bg-slate-800"
                onClick={() => setFocusMode(true)}
              >
                Focus Mode
              </button>
            </div>
          </header>
        )}
        {focusMode && (
          <button
            className="fixed top-3 right-3 text-sm rounded-full border border-slate-700 px-4 py-2 bg-slate-900/80 backdrop-blur hover:bg-slate-800"
            onClick={() => setFocusMode(false)}
          >
            Exit Focus
          </button>
        )}
        <div id="active-cell-announcer" className="visually-hidden" role="status" aria-live="polite"></div>
        <div id="game-state-announcer" className="visually-hidden" role="status" aria-live="assertive"></div>

        <section className={`${focusMode ? '' : 'bg-slate-900/80 border border-slate-700 rounded-2xl shadow-xl'} p-6 sm:p-8`}>
          {gameState === 'intro' && (
            <div className="flex flex-col items-center text-center space-y-5">
              <div className="max-w-2xl space-y-3 text-sm text-slate-200">
                <p className="text-base font-semibold text-white">How to play</p>
                <p>You will see a square flash in the grid and hear a letter each turn.</p>
                <p>
                  If the position is the same as it was {N} turns ago, press
                  <kbd className="mx-1 rounded bg-slate-800 px-2 py-1 font-semibold text-white">A</kbd>.
                </p>
                <p>
                  If the letter is the same as it was {N} turns ago, press
                  <kbd className="mx-1 rounded bg-slate-800 px-2 py-1 font-semibold text-white">L</kbd>.
                </p>
                <p>If both match, press both keys before the next stimulus.</p>
              </div>
              <div className="flex flex-col items-center gap-4">
                <label htmlFor="n-select" className="text-sm text-slate-200">
                  <span className="mr-2">N-Back Level:</span>
                  <select
                    id="n-select"
                    value={settings.n}
                    onChange={(e) =>
                      setSettings((s) => ({ ...s, n: Number(e.target.value) }))
                    }
                    className="rounded border border-slate-700 bg-slate-900 px-3 py-1 text-white"
                  >
                    {Array.from({ length: 10 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {i + 1}-Back
                      </option>
                    ))}
                  </select>
                </label>
                <label className="inline-flex items-center text-sm text-slate-200">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-700 text-blue-500"
                    checked={settings.adaptive}
                    onChange={(e) =>
                      setSettings((s) => ({ ...s, adaptive: e.target.checked }))
                    }
                  />
                  <span className="ml-2">Adaptive Difficulty (auto-adjust N each round)</span>
                </label>
              </div>
              {/*
                Focus is managed via a useEffect hook when the intro state
                is active, so autoFocus is avoided for accessibility reasons.
              */}
              <button
                ref={startButtonRef}
                className="px-6 py-3 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-lg shadow-blue-500/20"
                onClick={startGame}
              >
                Start Game
              </button>
            </div>
          )}
          {gameState === 'countdown' && (
            <div className="flex flex-col items-center text-center space-y-4">
              <p className="text-sm uppercase tracking-widest text-slate-400">Get Ready</p>
              <p className="text-6xl font-bold text-white">{countdown}</p>
              <p className="text-sm text-slate-300">
                Stay focused. Respond with <span className="font-semibold text-white">A</span> for position
                and <span className="font-semibold text-white">L</span> for audio.
              </p>
            </div>
          )}

          {(gameState === 'playing' || gameState === 'paused') && sequence[currentSequenceIndex] && (
            <div className="flex flex-col items-center space-y-5 relative">
              <div className="flex flex-col items-center gap-3">
                <Grid
                  active={settings.task === 'audio' ? null : sequence[currentSequenceIndex].position}
                  showCorrectFlash={showCorrectFlash}
                  showIncorrectFlash={showIncorrectFlashAnimation}
                />
                {!focusMode && (
                  <p className="text-sm text-slate-400">
                    Respond before the next tone. Visual match: <span className="text-white">A</span> · Audio match:{' '}
                    <span className="text-white">L</span>
                  </p>
                )}
              </div>
              {gameState === 'paused' && (
                <div className="absolute inset-0 bg-slate-900/80 backdrop-blur flex items-center justify-center text-xl font-semibold rounded-xl">
                  Paused
                </div>
              )}
              {!focusMode && (
                <ControlButtons
                  onVis={() => handleResponse('vis')}
                  onAud={() => handleResponse('aud')}
                  disabled={currentSequenceIndex < FILLERS || !timer.current || gameState === 'paused'}
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
              <button
                className="px-6 py-3 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-lg shadow-blue-500/20"
                onClick={gameState === 'playing' ? handlePause : handleResume}
              >
                {gameState === 'playing' ? 'Pause' : 'Resume'}
              </button>
            </div>
          )}

          {gameState === 'break' && (
            <div className="flex flex-col items-center space-y-4 text-center">
              <p className="text-lg font-semibold text-white">Round complete.</p>
              <p className="text-sm text-slate-300">Review your results and continue when ready.</p>
              <button
                className="px-6 py-3 rounded-full bg-blue-600 text-white hover:bg-blue-500 transition-colors duration-150"
                onClick={handleContinueFromBreak}
              >
                Continue
              </button>
            </div>
          )}

          {gameState === 'complete' && results && (
            <div className="flex flex-col items-center space-y-5 text-center">
              <div>
                <h2 className="text-2xl font-semibold text-white">Results</h2>
                <p className="text-sm text-slate-300">Mode: {taskLabel}</p>
              </div>
              <div className="grid gap-3 text-sm text-slate-200">
                <p>N-Back Level: <span className="font-semibold text-white">{N}</span></p>
                <p>Score: <span className="text-2xl font-semibold text-white">{currentScore}%</span></p>
              </div>
              <div className="grid gap-2 text-sm">
                <ResultRow label="Visual" data={results.visual} />
                <ResultRow label="Auditory" data={results.auditory} />
                <ResultRow label="Dual" data={results.dual} />
              </div>
              <div className="flex flex-wrap justify-center gap-3 mt-2">
                <button
                  className="px-6 py-3 rounded-full bg-blue-600 text-white hover:bg-blue-500 transition-colors duration-150"
                  onClick={handlePlayAgain}
                >
                  Play Again
                </button>
                <button
                  className="px-6 py-3 rounded-full bg-emerald-500 text-white hover:bg-emerald-400"
                  onClick={handleShare}
                >
                  Share
                </button>
              </div>
              {showShareOptions && (
                <div className="flex flex-wrap justify-center gap-4 text-sm">
                  <a
                    href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
                      `I just reached N-Back level ${N} on this Dual N-Back game! #dualnback`
                    )}&url=${encodeURIComponent(window.location.href)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline text-sky-400"
                  >
                    Twitter/X
                  </a>
                  <a
                    href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
                      window.location.href
                    )}&quote=${encodeURIComponent(
                      `I just reached N-Back level ${N} on this Dual N-Back game! #dualnback`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline text-blue-400"
                  >
                    Facebook
                  </a>
                </div>
              )}
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
        </section>
      </div>
    </main>
  );
}

function ResultRow({ label, data }) {
  if (!data.enabled) {
    return (
      <p className="text-slate-500">
        {label}: <span className="italic">Not enabled</span>
      </p>
    );
  }
  return (
    <p className="text-slate-200">
      {label}: <span className="text-white font-semibold">{data.hits}</span>/{data.total} ({data.pct}%)
    </p>
  );
}

ResultRow.propTypes = {
  label: PropTypes.string.isRequired,
  data: PropTypes.shape({
    hits: PropTypes.number.isRequired,
    total: PropTypes.number.isRequired,
    pct: PropTypes.number.isRequired,
    enabled: PropTypes.bool.isRequired,
  }).isRequired,
};
