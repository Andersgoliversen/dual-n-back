import React, { useEffect, useState, useCallback, useRef } from 'react';
import Grid from './components/Grid.jsx';
import ControlButtons from './components/ControlButtons.jsx';
import StatusBar from './components/StatusBar.jsx';
import { preloadAudio, playLetter } from './utils/audio.js';
import { generateSequence } from './utils/generator.js';
import { evaluateResponses } from './utils/evaluator.js';

const N = 2;
const FILLERS = N;
const TOTAL = 20 + FILLERS;
const TRIAL_MS = 3000; // 3 s per stimulus

export default function App() {
  const [gameState, setGameState] = useState('intro'); // intro | playing | break | complete
  const [sequence, setSequence] = useState([]);
  const [current, setCurrent] = useState(0);
  const [responses, setResponses] = useState(new Map());
  const timer = useRef(null);
  const unlocked = useRef(false);

  // preload audio once
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
    setCurrent(0);
    setGameState('playing');
  };

  // Schedule next trial
  useEffect(() => {
    if (gameState !== 'playing') return;
    if (current >= TOTAL) {
      setGameState('break');
      return;
    }

    const tr = sequence[current];
    if (tr) {
      // play letter
      playLetter(tr.letter);
    }

    timer.current = setTimeout(() => {
      setCurrent((c) => c + 1);
    }, TRIAL_MS);

    return () => clearTimeout(timer.current);
  }, [gameState, current, sequence]);

  const handleResponse = useCallback(
    (type) => {
      if (gameState !== 'playing') return;
      setResponses((prev) => {
        const r = { ...(prev.get(current) || { vis: false, aud: false }) };
        if (type === 'vis') r.vis = true;
        if (type === 'aud') r.aud = true;
        return new Map(prev).set(current, r);
      });
    },
    [gameState, current]
  );

  const results = gameState === 'complete' ? evaluateResponses({ trials: sequence, responses, n: N }) : null;

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-4">
      {gameState === 'intro' && (
        <>
          <h1 className="text-2xl mb-4">Dual N‑Back</h1>
          <button className="px-6 py-3 rounded-lg border shadow" onClick={startGame}>
            Start Game
          </button>
        </>
      )}

      {gameState === 'playing' && sequence[current] && (
        <>
          <Grid active={sequence[current].position} />
          <ControlButtons onVis={() => handleResponse('vis')} onAud={() => handleResponse('aud')} />
          <StatusBar trial={Math.max(0, current - FILLERS)} total={20} />
        </>
      )}

      {gameState === 'break' && (
        <>
          <p className="mb-4">Round complete.</p>
          <button
            className="px-4 py-2 rounded-lg border shadow"
            onClick={() => setGameState('complete')}
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
            onClick={() => setGameState('intro')}
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