import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import ComingSoon from './ComingSoon';

describe('ComingSoon Page', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <MemoryRouter>
        <ComingSoon />
      </MemoryRouter>
    );
    expect(container).toBeTruthy();
  });

  it('displays coming soon content', () => {
    render(
      <MemoryRouter>
        <ComingSoon />
      </MemoryRouter>
    );
    expect(document.body.textContent?.length).toBeGreaterThan(0);
  });
});
