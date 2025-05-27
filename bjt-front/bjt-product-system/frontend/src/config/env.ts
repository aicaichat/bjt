// src/config/env.ts
export const isDev = import.meta.env.DEV;
export const useMockData = import.meta.env.VITE_USE_MOCK_DATA === 'true';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/wp-json/bjt/v1';
export const API_TIMEOUT = 10000;
export const ENABLE_DEBUG_LOGS = isDev;
export const DEFAULT_LANGUAGE = 'zh';
export const SUPPORTED_REGIONS = ['CN', 'EU', 'NA', 'AU'];
export const DEFAULT_REGION = 'CN';
export const BASE_URL = import.meta.env.VITE_BASE_URL || '/';
export const IMAGE_BASE_URL = import.meta.env.VITE_IMAGE_BASE_URL || '/';
export const DEFAULT_PAGE_SIZE = 10;
export const MAX_UPLOAD_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const MOCK_DELAY = 300;