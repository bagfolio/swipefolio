/**
 * Database connection checker
 * This script verifies which database the application is connected to and logs information
 * to help troubleshoot connection issues between development and production.
 */

import { pool } from './db';

export async function checkDatabaseConnection() {
  try {
    // Get database name and host without exposing credentials
    const dbHost = process.env.PGHOST || '(not set)';
    const dbName = process.env.PGDATABASE || '(not set)';
    const dbUser = process.env.PGUSER || '(not set)';
    
    console.log(`=== DATABASE CONNECTION INFO ===`);
    console.log(`- Connected to database: ${dbName}`);
    console.log(`- Database host: ${dbHost}`);
    console.log(`- Database user: ${dbUser}`);
    
    // Check if we can actually connect
    const { rows } = await pool.query('SELECT NOW() as time');
    if (rows && rows.length > 0) {
      console.log(`- Connection successful: ${rows[0].time}`);
    }
    
    // Check for stock data table
    const stockDataResult = await pool.query(`
      SELECT COUNT(*) as count FROM stock_data
    `);
    
    if (stockDataResult.rows && stockDataResult.rows.length > 0) {
      console.log(`- Stock data records: ${stockDataResult.rows[0].count}`);
    }
    
    // Check for news data specifically
    const stockNewsQuery = `
      SELECT COUNT(*) as count 
      FROM stock_data 
      WHERE news IS NOT NULL
    `;
    
    const newsResult = await pool.query(stockNewsQuery);
    if (newsResult.rows && newsResult.rows.length > 0) {
      console.log(`- Stock data records with news: ${newsResult.rows[0].count}`);
    }
    
    console.log(`================================`);
    return true;
  } catch (error) {
    console.error('Database connection check failed:', error);
    return false;
  }
}