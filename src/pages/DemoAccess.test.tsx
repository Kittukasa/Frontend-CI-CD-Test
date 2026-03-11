import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import DemoAccess from './DemoAccess';

describe('DemoAccess Page', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <MemoryRouter>
        <DemoAccess />
      </MemoryRouter>
    );
    expect(container).toBeTruthy();
  });

  it('has content', () => {
    render(
      <MemoryRouter>
        <DemoAccess />
      </MemoryRouter>
    );
    expect(document.body.textContent?.length).toBeGreaterThan(0);
  });
});
