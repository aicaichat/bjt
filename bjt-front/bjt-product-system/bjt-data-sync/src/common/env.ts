import dotenv from 'dotenv';
import path from 'path';

// Load .env file from the project root (bjt-data-sync/)
const envPath = path.resolve(__dirname, '../../.env'); // Corrected path
const result = dotenv.config({ path: envPath });

if (result.error) {
  // You might want to throw an error or log a warning if .env is crucial
  console.warn(`Warning: Could not load .env file from ${envPath}. Using system environment variables or defaults.`);
  // throw result.error; // Uncomment to make .env file mandatory
}

export interface EnvironmentVariables {
  DB_HOST?: string;
  DB_USER?: string;
  DB_PASSWORD?: string;
  DB_NAME?: string;
  DB_PORT?: number;
  FRONTEND_MOCK_DIR?: string;
  FRONTEND_TYPES_DIR_RELATIVE_TO_MOCKS?: string;
  ASSETS_BASE_PATH?: string;
  // Add other variables from your .env file here
}

export function getEnvVariables(): EnvironmentVariables {
  return {
    DB_HOST: process.env.DB_HOST,
    DB_USER: process.env.DB_USER,
    DB_PASSWORD: process.env.DB_PASSWORD,
    DB_NAME: process.env.DB_NAME,
    DB_PORT: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : undefined,
    FRONTEND_MOCK_DIR: process.env.FRONTEND_MOCK_DIR,
    FRONTEND_TYPES_DIR_RELATIVE_TO_MOCKS: process.env.FRONTEND_TYPES_DIR_RELATIVE_TO_MOCKS,
    ASSETS_BASE_PATH: process.env.ASSETS_BASE_PATH,
  };
}

// For use in db-to-mock.ts, let's ensure getEnvVariables is what it expects
// If db-to-mock.ts specifically needs a function named getEnvVariables, this is fine.
// Otherwise, we could simplify to: export const env = getEnvVariables(); 