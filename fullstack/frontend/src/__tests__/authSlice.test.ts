import { describe, test, expect, beforeEach } from 'vitest';
import authReducer, {
  loginStart,
  loginSuccess,
  loginFailure,
  logout,
  updateUser,
  type AuthUser,
} from '../redux/slices/authSlice';

describe('authSlice reducer', () => {
  const initialState = {
    user: null,
    isAuthenticated: false,
    loading: false,
    error: null,
  };

  const mockUser: AuthUser = {
    id: 1,
    first_name: 'John',
    last_name: 'Doe',
    email: 'john@example.com',
    role: 'admin',
  };

  beforeEach(() => {
    localStorage.clear();
  });

  test('should return initial state', () => {
    const state = authReducer(undefined, { type: 'unknown' });
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
  });

  test('loginStart should set loading to true', () => {
    const state = authReducer(initialState, loginStart());
    expect(state.loading).toBe(true);
    expect(state.error).toBeNull();
  });

  test('loginSuccess should set user and authenticated', () => {
    const state = authReducer(initialState, loginSuccess(mockUser));
    expect(state.loading).toBe(false);
    expect(state.isAuthenticated).toBe(true);
    expect(state.user).toEqual(mockUser);
    expect(state.error).toBeNull();
    expect(localStorage.getItem('user')).toBe(JSON.stringify(mockUser));
  });

  test('loginFailure should set error', () => {
    const state = authReducer(
      { ...initialState, loading: true },
      loginFailure('Invalid credentials'),
    );
    expect(state.loading).toBe(false);
    expect(state.error).toBe('Invalid credentials');
  });

  test('logout should clear all auth state', () => {
    localStorage.setItem('user', JSON.stringify(mockUser));
    localStorage.setItem('freshly_access_token', 'token');
    localStorage.setItem('freshly_refresh_token', 'refresh');

    const loggedInState = {
      user: mockUser,
      isAuthenticated: true,
      loading: false,
      error: null,
    };
    const state = authReducer(loggedInState, logout());

    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(localStorage.getItem('user')).toBeNull();
    expect(localStorage.getItem('freshly_access_token')).toBeNull();
    expect(localStorage.getItem('freshly_refresh_token')).toBeNull();
  });

  test('updateUser should merge partial user data', () => {
    const loggedInState = {
      user: mockUser,
      isAuthenticated: true,
      loading: false,
      error: null,
    };
    const state = authReducer(loggedInState, updateUser({ first_name: 'Jane' }));

    expect(state.user?.first_name).toBe('Jane');
    expect(state.user?.last_name).toBe('Doe');
    expect(localStorage.getItem('user')).toContain('Jane');
  });

  test('updateUser should do nothing if no user', () => {
    const state = authReducer(initialState, updateUser({ first_name: 'Test' }));
    expect(state.user).toBeNull();
  });
});
