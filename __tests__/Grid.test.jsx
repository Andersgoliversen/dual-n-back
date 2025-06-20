/* eslint-env jest */
import React from 'react';
import { render, screen } from '@testing-library/react';
import Grid from '../src/components/Grid.jsx';

test('basic classes apply to Grid', () => {
  const { container } = render(<Grid active={3} />);
  expect(container.firstChild).toHaveClass('border');
});

test('renders eight cells and highlights active', () => {
  render(<Grid active={2} />);
  const cells = screen.getAllByRole('gridcell');
  expect(cells).toHaveLength(8);
  const active = cells[2];
  expect(active.getAttribute('fill')).toBe('#2563eb');
});
