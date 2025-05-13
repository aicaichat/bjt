import path from 'path';
import fs from 'fs-extra';
import { createPool, Pool } from 'mysql2/promise';
import { getEnvVariables } from './common/env';
import { logger } from './common/logger';
// Import new filter options mapper functions
import { generateConsumableFilterOptions, getConsumableFilterOptionsFileContent } from './mappers/consumableFilterOptions.mapper';
// Import mappers once they are created
import { generateConsumablesMockFile } from './DBMockMapper/consumables.mapper';
// import { generateMachinesMock } from './DBMockMapper/machines.mapper';
// import { generateAccessoriesMock } from './DBMockMapper/accessories.mapper';
// import { generateSparePartsMock } from './DBMockMapper/spareParts.mapper';

async function main() {
  logger.info('Starting DB to Mock data synchronization...');
  const env = getEnvVariables();

  // Pool for filter options generation, as it requires a Pool object directly.
  // generateConsumablesMockFile from DBMockMapper handles its own DB connection via getDbPool.
  const pool: Pool = createPool({
    host: env.DB_HOST,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    port: env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });

  logger.info('Database pool for filter options initialized.');

  try {
    // 1. Generate Consumables Mock File using DBMockMapper
    logger.info('Generating consumables mock data via DBMockMapper...');
    await generateConsumablesMockFile(); // This function handles its own fetching, mapping, and file writing
    logger.info('Consumables mock data generated via DBMockMapper.');

    // 2. Generate Consumable Filter Options Mock File
    logger.info('Fetching and mapping consumable filter options...');
    // Assuming 'en' for language of filter option names. This could also be a parameter from env.
    const filterOptionsData = await generateConsumableFilterOptions(pool, 'en'); 
    const filterOptionsFileContent = getConsumableFilterOptionsFileContent(filterOptionsData);
    const filterOptionsMockFilePath = path.join(env.FRONTEND_MOCK_DIR || '', 'consumableFilterOptions.mocks.ts');
    await fs.ensureDir(path.dirname(filterOptionsMockFilePath));
    await fs.writeFile(filterOptionsMockFilePath, filterOptionsFileContent);
    logger.info(`Successfully generated consumable filter options mock file at: ${filterOptionsMockFilePath}`);

    // TODO: Call generator functions for other entity types if DBMockMapper structure is used for them
    // logger.info('Generating machines mock data...');
    // await generateMachinesMock();
    // logger.info('Machines mock data generated.');

    // logger.info('Generating accessories mock data...');
    // await generateAccessoriesMock();
    // logger.info('Accessories mock data generated.');

    // logger.info('Generating spare parts mock data...');
    // await generateSparePartsMock(); 
    // logger.info('Spare parts mock data generated.');

    logger.info('DB to Mock data synchronization completed successfully.');

  } catch (error) {
    logger.error('Error during DB to Mock data synchronization:', error);
    process.exit(1); // Exit with error code if synchronization fails
  } finally {
    // Close the pool used for filter options. 
    // The pool used by generateConsumablesMockFile should be managed by ../common/db.ts
    await pool.end();
    logger.info('Database pool for filter options closed.');
  }
}

main(); 