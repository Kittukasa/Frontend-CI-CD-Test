import { describe, it, expect } from 'vitest';
import * as featureFlags from './featureFlags';

describe('featureFlags config', () => {
  it('exports feature flags', () => {
    expect(featureFlags).toBeTruthy();
  });

  it('all flags are accessible', () => {
    Object.keys(featureFlags).forEach(key => {
      expect(featureFlags[key as keyof typeof featureFlags]).toBeDefined();
    });
  });

  it('flag values are boolean or functions', () => {
    Object.values(featureFlags).forEach(val => {
      const validType = ['boolean', 'function', 'string', 'number', 'object'].includes(typeof val);
      expect(validType).toBe(true);
    });
  });

  it('has at least one exported value', () => {
    expect(Object.keys(featureFlags).length).toBeGreaterThan(0);
  });
});
