/* eslint-env jest */
import React, { useEffect, useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

function HitCounter() {
  const [vis, setVis] = useState(0);
  const [aud, setAud] = useState(0);
  useEffect(() => {
    const handler = (e) => {
      const key = e.key.toLowerCase();
      if (key === 'f') setVis((v) => v + 1);
      if (key === 'l') setAud((a) => a + 1);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);
  return (
    <div>
      <span data-testid="vis">{vis}</span>
      <span data-testid="aud">{aud}</span>
    </div>
  );
}

test('F and L key presses increment counters', async () => {
  const user = userEvent.setup();
  render(<HitCounter />);
  await user.keyboard('f');
  await user.keyboard('l');
  expect(screen.getByTestId('vis').textContent).toBe('1');
  expect(screen.getByTestId('aud').textContent).toBe('1');
});
