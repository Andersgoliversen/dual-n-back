import React from 'react';

export default function StatusBar({ trial, total }) {
  return (
    <div className="mt-4" role="status" aria-live="polite">
      Trial {trial}/{total}
    </div>
  );
}
