import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'sonner';
import type { LoginCredentials, RegisterData } from '../services/auth';
import { authApi } from '../services/auth';
import { loginSuccess, loginFailure, logout as logoutAction, updateUser } from '../redux/slices/authSlice';
import type { RootState, AppDispatch } from '../redux/store';
import { setAccessToken, setRefreshToken, clearTokens } from '../utils/token';
import { invalidateCache } from './useApiCache';

export const useAuth = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch<AppDispatch>();
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const [loading, setLoading] = useState(false);

  const updateUserProfile = useCallback(
    (userData: any) => {
      dispatch(updateUser(userData));
    },
    [dispatch]
  );

  const login = useCallback(
    async (credentials: LoginCredentials) => {
      try {
        setLoading(true);
        const response = await authApi.login(credentials);
        const { user, tokens } = response.data.data;

        setAccessToken(tokens.access.token);
        setRefreshToken(tokens.refresh.token);

        dispatch(
          loginSuccess({
            id: user.id,
            first_name: user.first_name,
            last_name: user.last_name,
            email: user.email,
            role: user.role,
            imgUrl: user.imgUrl,
            phone: user.phone,
            gender: user.gender,
            address: user.address,
            birthdate: user.birthdate,
          })
        );

        toast.success(t('auth.loginSuccess'));
        return user;
      } catch (error: any) {
        const message = error.response?.data?.message || t('auth.loginFailed');
        dispatch(loginFailure(message));
        toast.error(message);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [dispatch, t]
  );

  const loginWithGoogle = useCallback(
    async (idToken: string, recaptchaToken: string, fcmToken: string = '') => {
      try {
        setLoading(true);
        const response = await authApi.googleLogin(idToken, recaptchaToken, fcmToken);
        const { user, tokens } = response.data.data;

        setAccessToken(tokens.access.token);
        setRefreshToken(tokens.refresh.token);

        dispatch(
          loginSuccess({
            id: user.id,
            first_name: user.first_name,
            last_name: user.last_name,
            email: user.email,
            role: user.role,
            imgUrl: user.imgUrl,
            phone: user.phone,
            gender: user.gender,
            address: user.address,
            birthdate: user.birthdate,
          })
        );

        toast.success(t('auth.googleLoginSuccess'));
        return user;
      } catch (error: any) {
        const message = error.response?.data?.message || t('auth.googleLoginFailed');
        dispatch(loginFailure(message));
        toast.error(message);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [dispatch, t]
  );

  const loginWithMicrosoft = useCallback(
    async (idToken: string, recaptchaToken: string, fcmToken: string = '') => {
      try {
        setLoading(true);
        const response = await authApi.microsoftLogin(idToken, recaptchaToken, fcmToken);
        const { user, tokens } = response.data.data;

        setAccessToken(tokens.access.token);
        setRefreshToken(tokens.refresh.token);

        dispatch(
          loginSuccess({
            id: user.id,
            first_name: user.first_name,
            last_name: user.last_name,
            email: user.email,
            role: user.role,
            imgUrl: user.imgUrl,
            phone: user.phone,
            gender: user.gender,
            address: user.address,
            birthdate: user.birthdate,
          })
        );

        toast.success(t('auth.microsoftLoginSuccess'));
        return user;
      } catch (error: any) {
        const message = error.response?.data?.message || t('auth.microsoftLoginFailed');
        dispatch(loginFailure(message));
        toast.error(message);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [dispatch, t]
  );

  const register = useCallback(
    async (data: RegisterData) => {
      try {
        setLoading(true);
        const response = await authApi.register(data);
        const message = response.data.message;

        toast.success(message || t('auth.registerSuccess'));
        return null; // Return null because user is not logged in yet
      } catch (error: any) {
        const message = error.response?.data?.message || t('auth.registerFailed');
        toast.error(message);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [t]
  );

  const logout = useCallback(async () => {
    try {
      const refreshToken = localStorage.getItem('freshly_refresh_token');
      if (refreshToken) {
        await authApi.logout(refreshToken);
      }
    } catch (error) {
      // Silent — logout should not show errors to user
    } finally {
      clearTokens();
      invalidateCache(); // Clear all cached API data from previous session
      dispatch(logoutAction());
      toast.success(t('auth.logoutSuccess'));
    }
  }, [dispatch, t]);

  return {
    user,
    isAuthenticated,
    loading,
    login,
    loginWithGoogle,
    loginWithMicrosoft,
    register,
    logout,
    updateUserProfile,
  };
};
