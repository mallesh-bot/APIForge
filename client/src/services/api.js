import axios from 'axios';

/**
 * Resolves and normalizes the backend API base URL.
 * Handles trailing slashes and ensures /api/v1 is appropriately suffixed.
 * Defaults to the production Render backend when hosted on Cloudflare Pages (*.pages.dev),
 * and to '/api/v1' for local development (which routes through Vite's proxy).
 */
export function getBaseURL() {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim() !== '') {
    let cleanUrl = envUrl.trim().replace(/\/+$/, '');
    if (!cleanUrl.endsWith('/api/v1')) {
      cleanUrl = `${cleanUrl}/api/v1`;
    }
    return cleanUrl;
  }

  // Automatic fallback for Cloudflare Pages production deployment if VITE_API_URL was omitted at build time
  if (typeof window !== 'undefined' && window.location.hostname.endsWith('pages.dev')) {
    return 'https://apiforge-backend-g6n2.onrender.com/api/v1';
  }

  // Local development default (routed via Vite proxy to localhost:5000)
  return '/api/v1';
}

export const api = axios.create({
  baseURL: getBaseURL(),
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to attach JWT Bearer token if stored in localStorage (resilience for cross-site cookie restrictions)
api.interceptors.request.use((config) => {
  try {
    const token = localStorage.getItem('apiforge_token');
    if (token && !config.headers?.Authorization) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch {
    // Ignore browser storage access errors
  }
  return config;
});

export default api;

