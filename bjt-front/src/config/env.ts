// src/config/env.ts
export const isDev = process.env.NODE_ENV === 'development';
export const useMockData = isDev && (import.meta.env.VITE_USE_MOCK === 'true' || true);

export const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_BASE_URL || '/wp-json/bjt/v1',
  timeout: 30000,
};