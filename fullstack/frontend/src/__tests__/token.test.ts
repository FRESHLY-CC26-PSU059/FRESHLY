import { describe, test, expect, beforeEach } from 'vitest';
import {
  getAccessToken,
  setAccessToken,
  removeAccessToken,
  getRefreshToken,
  setRefreshToken,
  removeRefreshToken,
  clearTokens,
} from '../utils/token';

describe('Token Utils', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('setAccessToken and getAccessToken work correctly', () => {
    expect(getAccessToken()).toBeNull();
    setAccessToken('my-access-token');
    expect(getAccessToken()).toBe('my-access-token');
  });

  test('removeAccessToken removes the token', () => {
    setAccessToken('token');
    removeAccessToken();
    expect(getAccessToken()).toBeNull();
  });

  test('setRefreshToken and getRefreshToken work correctly', () => {
    expect(getRefreshToken()).toBeNull();
    setRefreshToken('my-refresh-token');
    expect(getRefreshToken()).toBe('my-refresh-token');
  });

  test('removeRefreshToken removes the token', () => {
    setRefreshToken('token');
    removeRefreshToken();
    expect(getRefreshToken()).toBeNull();
  });

  test('clearTokens removes both tokens', () => {
    setAccessToken('access');
    setRefreshToken('refresh');
    clearTokens();
    expect(getAccessToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
  });
});
