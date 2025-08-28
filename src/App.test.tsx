import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App, { matchesFilter } from './App';
import { describe, it, expect } from 'vitest';

describe('Trip fields', () => {
  it('allows setting customer and project', async () => {
    render(<App />);
    const user = userEvent.setup();

    // add a new empty trip
    await user.click(screen.getByText('+ New Trip'));

    const customerInput = screen.getAllByLabelText('Customer')[0] as HTMLInputElement;
    const projectInput = screen.getAllByLabelText('Project')[0] as HTMLInputElement;

    await user.type(customerInput, 'ACME');
    await user.type(projectInput, 'Launch');

    expect(customerInput.value).toBe('ACME');
    expect(projectInput.value).toBe('Launch');
  });
});

describe('Trip filter', () => {
  it('handles trips without customer or project', () => {
    const trip = {
      id: 't1',
      origin: '',
      destination: 'Paris',
      startDate: '2025-01-01',
      endDate: '2025-01-02',
      purpose: '',
      mileageKm: 0,
      includeBreakfast: false,
      includeLunch: false,
      includeDinner: false,
    } as any;

    expect(matchesFilter(trip, 'par')).toBe(true);
    expect(matchesFilter(trip, 'acme')).toBe(false);
  });
});
