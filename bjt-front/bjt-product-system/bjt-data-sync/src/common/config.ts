import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') }); // Load .env from root

interface AppConfig {
  dbHost?: string;
  dbUser?: string;
  dbPassword?: string;
  dbName?: string;
  dbPort: number;
  frontendMockDir: string;
  frontendTypesDirRelativeToMocks: string;
  assetsBasePath: string;
}

export const config: AppConfig = {
  dbHost: process.env.DB_HOST,
  dbUser: process.env.DB_USER,
  dbPassword: process.env.DB_PASSWORD,
  dbName: process.env.DB_NAME,
  dbPort: parseInt(process.env.DB_PORT || '3306', 10),
  frontendMockDir: process.env.FRONTEND_MOCK_DIR || '../frontend/src/services/mocks', // Default path
  frontendTypesDirRelativeToMocks: process.env.FRONTEND_TYPES_DIR_RELATIVE_TO_MOCKS || '../../types',
  assetsBasePath: process.env.ASSETS_BASE_PATH || '/assets',
};

// Validate essential config
if (!config.dbHost || !config.dbUser || !config.dbName || !config.frontendMockDir) {
  console.error("FATAL ERROR: Database configuration (DB_HOST, DB_USER, DB_NAME) and FRONTEND_MOCK_DIR must be set in .env file.");
  process.exit(1);
} 