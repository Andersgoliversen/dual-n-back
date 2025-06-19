/* eslint-env jest */
import React from 'react';
import { render, screen } from '@testing-library/react';
import Grid from '../src/components/Grid.jsx';

test('tailwind classes apply to Grid', () => {
  const { container } = render(<Grid active={3} />);
  expect(container.firstChild).toHaveClass('grid');
});

test('renders nine cells and highlights active', () => {
  const { container } = render(<Grid active={2} />);
  expect(container.firstChild.childNodes).toHaveLength(9);
  const cells = screen.getAllByRole('gridcell');
  const active = cells[2];
  expect(active).toHaveClass('bg-blue-400');
});
