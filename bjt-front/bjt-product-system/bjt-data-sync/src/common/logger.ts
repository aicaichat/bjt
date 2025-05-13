import fs from 'fs-extra';
import path from 'path';
import { config } from './config';

// Ensure the directory for mock files exists
fs.ensureDirSync(path.resolve(config.frontendMockDir));

// Basic logger utility
const getTimestamp = (): string => new Date().toISOString();

export const logger = {
  info: (message: string, ...args: any[]) => {
    console.log(`[${getTimestamp()}] INFO: ${message}`, ...args);
  },
  warn: (message: string, ...args: any[]) => {
    console.warn(`[${getTimestamp()}] WARN: ${message}`, ...args);
  },
  error: (message: string, error?: any, ...args: any[]) => {
    console.error(`[${getTimestamp()}] ERROR: ${message}`, ...args);
    if (error) {
      console.error(error);
    }
  },
  debug: (message: string, ...args: any[]) => {
    // Add a check for a DEBUG environment variable if you want to disable this in production
    // if (process.env.NODE_ENV === 'development' || process.env.DEBUG === 'true') {
      console.debug(`[${getTimestamp()}] DEBUG: ${message}`, ...args);
    // }
  },
};

// Helper to create the full path for a mock file
export const getMockFilePath = (filename: string): string => {
  return path.join(path.resolve(config.frontendMockDir), filename);
}; 