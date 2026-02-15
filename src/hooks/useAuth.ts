import { useAuthStore } from '../store/auth';
import { authApi } from '../services/auth';
import type { LoginData, RegisterData } from '../services/auth';
import { Alert } from 'react-native';

export function useAuth() {
  const { user, isAuthenticated, isHydrated, login: storeLogin, logout: storeLogout } = useAuthStore();

  const login = async (data: LoginData) => {
    try {
      const response = await authApi.login(data);
      if (response.success && response.data) {
        const { user, tokens } = response.data;
        storeLogin(user, tokens.accessToken, tokens.refreshToken);
        return { success: true };
      }
      return { success: false, message: response.message || 'Login failed' };
    } catch (error: any) {
      const message =
        error.response?.data?.message || 'Unable to connect. Please try again.';
      return { success: false, message };
    }
  };

  const register = async (data: RegisterData) => {
    try {
      const response = await authApi.register(data);
      if (response.success) {
        return { success: true, message: response.message };
      }
      return { success: false, message: response.message || 'Registration failed' };
    } catch (error: any) {
      const message =
        error.response?.data?.message || 'Unable to connect. Please try again.';
      return { success: false, message };
    }
  };

  const logout = async () => {
    try {
      const refreshToken = useAuthStore.getState().refreshToken;
      if (refreshToken) {
        await authApi.logout(refreshToken);
      }
    } catch {
      // Ignore logout API errors
    } finally {
      storeLogout();
    }
  };

  return {
    user,
    isAuthenticated,
    isHydrated,
    login,
    register,
    logout,
  };
}
