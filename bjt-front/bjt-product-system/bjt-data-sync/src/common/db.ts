import mysql, { Pool, PoolConnection } from 'mysql2/promise';
import { config } from './config';
import { logger } from './logger';

let pool: Pool | null = null;

export const getDbPool = (): Pool => {
  if (pool) {
    return pool;
  }

  pool = mysql.createPool({
    host: config.dbHost,
    user: config.dbUser,
    password: config.dbPassword,
    database: config.dbName,
    port: config.dbPort,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    connectTimeout: 10000, // 10 seconds
  });

  // Test the connection
  pool.getConnection()
    .then((connection: PoolConnection) => {
      logger.info('Successfully connected to the database.');
      connection.release();
    })
    .catch((err: any) => { // Catching with 'any' for simplicity, can be more specific
      logger.error('Error connecting to the database:', err);
      throw err; 
    });

  return pool;
};

export const closeDbPool = async (): Promise<void> => {
  if (pool) {
    await pool.end();
    pool = null;
    logger.info('Database pool closed.');
  }
}; 