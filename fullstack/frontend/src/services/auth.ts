import api from '../api/axios';

export interface LoginCredentials {
  email: string;
  password: string;
  recaptchaToken?: string;
  fcmToken?: string;
}

export interface RegisterData extends LoginCredentials {
  first_name: string;
  last_name: string;
  recaptchaToken?: string;
}

export interface AuthResponse {
  user: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    role: string;
    imgUrl?: string;
    phone?: string;
    gender?: string;
    address?: string;
    birthdate?: string;
  };
  tokens: {
    access: { token: string; expires: string };
    refresh: { token: string; expires: string };
  };
}

export interface RegisterResponse {
  status: string;
  message: string;
}

export const authApi = {
  login: (credentials: LoginCredentials) =>
    api.post<{ data: AuthResponse }>('/auth/login', credentials),

  googleLogin: (idToken: string, recaptchaToken: string, fcmToken: string = '') =>
    api.post<{ data: AuthResponse }>('/auth/google-login', { idToken, recaptchaToken, fcmToken }),

  microsoftLogin: (idToken: string, recaptchaToken: string, fcmToken: string = '') =>
    api.post<{ data: AuthResponse }>('/auth/microsoft-login', { idToken, recaptchaToken, fcmToken }),

  register: (data: RegisterData) =>
    api.post<RegisterResponse>('/auth/register', data),

  logout: (refreshToken: string) =>
    api.post('/auth/logout', { refreshToken }),

  refreshTokens: (refreshToken: string) =>
    api.post('/auth/refresh-tokens', { refreshToken }),
};
