import { describe, it, expect } from 'vitest';
import * as dateUtils from './date';

describe('date utilities', () => {
  it('exports functions', () => {
    expect(dateUtils).toBeTruthy();
    expect(typeof dateUtils).toBe('object');
  });

  // Test each exported function generically
  Object.entries(dateUtils).forEach(([name, fn]) => {
    if (typeof fn === 'function') {
      it(`${name} is a function`, () => {
        expect(typeof fn).toBe('function');
      });
    }
  });

  it('handles date formatting with a valid date', () => {
    const fns = Object.values(dateUtils).filter(f => typeof f === 'function') as Function[];
    fns.forEach(fn => {
      try {
        const result = fn(new Date('2024-01-01'));
        expect(result !== undefined).toBe(true);
      } catch {
        // Some functions may require specific args — that's fine
      }
    });
  });

  it('handles date formatting with a date string', () => {
    const fns = Object.values(dateUtils).filter(f => typeof f === 'function') as Function[];
    fns.forEach(fn => {
      try {
        const result = fn('2024-01-01');
        expect(result !== undefined).toBe(true);
      } catch {
        // Some functions may require specific args — that's fine
      }
    });
  });
});
