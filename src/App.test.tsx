import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
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
