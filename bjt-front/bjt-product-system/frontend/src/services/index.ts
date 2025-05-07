/**
 * Services index file
 * Centralized export of all application services
 */

// API and authentication services
export { default as apiService } from './apiService';
export * from './auth';

// Domain-specific services
export { default as cartApiService } from './cartApiService';
export { default as orderService } from './orderService';

// Utility services
export { default as notificationService } from './notificationService';

// Mock data services
export { shouldUseMockData } from './mockService'; 