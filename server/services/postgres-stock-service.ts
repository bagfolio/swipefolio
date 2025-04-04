import { db } from '../db';
import { stocks } from '../../shared/schema';
import { eq } from 'drizzle-orm';

/**
 * PostgreSQL Stock Service
 * 
 * This service handles stock data stored in PostgreSQL
 */
class PostgresStockService {
  constructor() {
    console.log('PostgreSQL stock service initialized');
  }
  
  /**
   * Load stock data from the database
   */
  async loadStockData() {
    try {
      // Get all stocks from the database
      const stockRecords = await db.select().from(stocks);
      
      console.log(`PostgreSQL database contains ${stockRecords.length} stock records`);
      
      return true;
    } catch (error) {
      console.error('Error loading stock data from PostgreSQL:', error);
      throw error;
    }
  }
  
  /**
   * Get stock data for a specific symbol
   */
  async getStockData(symbol: string) {
    try {
      // Get stock from database
      const stockData = await db
        .select()
        .from(stocks)
        .where(eq(stocks.symbol, symbol))
        .limit(1);
      
      if (stockData.length === 0) {
        throw new Error(`Stock data for ${symbol} not found in database`);
      }
      
      return stockData[0];
    } catch (error) {
      console.error(`Error getting stock data for ${symbol}:`, error);
      throw error;
    }
  }
  
  /**
   * Get available stock symbols
   */
  async getAvailableSymbols() {
    try {
      const stockRecords = await db
        .select({ symbol: stocks.symbol })
        .from(stocks);
      
      return stockRecords.map(record => record.symbol);
    } catch (error) {
      console.error('Error getting available symbols from PostgreSQL:', error);
      return [];
    }
  }
}

export const postgresStockService = new PostgresStockService();