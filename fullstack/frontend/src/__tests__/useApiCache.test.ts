import { describe, test, expect, beforeEach } from 'vitest';
import { invalidateCache } from '../hooks/useApiCache';

// We test the invalidateCache utility directly (non-hook)
// Testing hooks with network calls requires more setup; we focus on the exported utils.

describe('useApiCache utilities', () => {
  beforeEach(() => {
    invalidateCache(); // clear all cache
  });

  test('invalidateCache() clears all cache without error', () => {
    // Should not throw
    expect(() => invalidateCache()).not.toThrow();
  });

  test('invalidateCache(prefix) does not throw', () => {
    expect(() => invalidateCache('/stats')).not.toThrow();
  });
});
