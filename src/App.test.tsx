import { render, screen } from '@testing-library/react';
import App from './App';

const currency = (n: number, c = 'EUR') =>
  new Intl.NumberFormat(undefined, { style: 'currency', currency: c }).format(n);

test('dashboard shows trip summary', () => {
  render(<App />);
  const countEl = screen.getByTestId('trip-count');
  expect(countEl).toHaveTextContent('1');

  const expectedTotal = currency(49.9 + 14 - 14 * 0.4 + 580 * 0.3);
  expect(screen.getByTestId('total-expenses')).toHaveTextContent(expectedTotal);
  expect(screen.getByTestId('avg-expenses')).toHaveTextContent(expectedTotal);
});
