import axios from 'axios';
import { getAccessToken, getRefreshToken, setAccessToken, clearTokens } from '../utils/token';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
const CLIENT_KEY = import.meta.env.VITE_CLIENT_KEY;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'x-client-key': CLIENT_KEY,
  },
});

api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// --- Refresh queue: prevents concurrent refresh calls (race condition fix) ---
let isRefreshing = false;
let refreshQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  refreshQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token!);
  });
  refreshQueue = [];
};
// ---------------------------------------------------------------------------

// Response interceptor: refresh on 401, force logout on 403 account errors.
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;
    const errorCode = error.response?.data?.errorCode;

    if (
      status === 403 &&
      (errorCode === 'FORBIDDEN' ||
        errorCode === 'ACCOUNT_LOCKED' ||
        errorCode === 'EMAIL_NOT_VERIFIED')
    ) {
      clearTokens();
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.assign('/login');
      }
      return Promise.reject(error);
    }

    if (status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // If a refresh is already in-flight, queue this request and wait
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      isRefreshing = true;
      const refreshToken = getRefreshToken();

      if (refreshToken) {
        try {
          const response = await axios.post(
            `${API_BASE_URL}/auth/refresh-tokens`,
            { refreshToken },
            {
              headers: {
                'Content-Type': 'application/json',
                'x-client-key': CLIENT_KEY,
              },
            }
          );

          const { access } = response.data.data.tokens;
          setAccessToken(access.token);
          processQueue(null, access.token);

          originalRequest.headers.Authorization = `Bearer ${access.token}`;
          return api(originalRequest);
        } catch (err) {
          processQueue(err, null);
          clearTokens();
          if (typeof window !== 'undefined') {
            window.location.assign('/login');
          }
          return Promise.reject(err);
        } finally {
          isRefreshing = false;
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;

