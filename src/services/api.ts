import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { config } from '../constants/config';

const api = axios.create({
  baseURL: config.apiUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Store for selected campus (for SUPER_ADMIN)
let selectedCampusId: string | null = null;

export function setSelectedCampusId(campusId: string | null) {
  selectedCampusId = campusId;
}

export function getSelectedCampusId(): string | null {
  return selectedCampusId;
}

// We need to lazily import the auth store to avoid circular dependencies
let getAuthState: (() => {
  accessToken: string | null;
  refreshToken: string | null;
  setTokens: (accessToken: string, refreshToken: string) => void;
  logout: () => void;
}) | null = null;

export function setAuthStoreGetter(getter: typeof getAuthState) {
  getAuthState = getter;
}

// Navigation ref for redirecting to login on auth failure
let navigationResetToLogin: (() => void) | null = null;

export function setNavigationResetToLogin(fn: () => void) {
  navigationResetToLogin = fn;
}

// Request interceptor to add auth token and campus context
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (getAuthState) {
      const { accessToken } = getAuthState();
      if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      }
    }

    // Add campus context header for SUPER_ADMIN
    if (selectedCampusId) {
      config.headers['X-Campus-Id'] = selectedCampusId;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (error.response?.status === 401 && !originalRequest._retry && getAuthState) {
      originalRequest._retry = true;

      const { refreshToken } = getAuthState();
      if (refreshToken) {
        try {
          const response = await axios.post(`${config.apiUrl}/auth/refresh`, {
            refreshToken,
          });

          const { accessToken, refreshToken: newRefreshToken } =
            response.data.data;
          getAuthState().setTokens(accessToken, newRefreshToken);

          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        } catch {
          getAuthState().logout();
          navigationResetToLogin?.();
        }
      } else {
        getAuthState().logout();
        navigationResetToLogin?.();
      }
    }

    return Promise.reject(error);
  }
);

export default api;
