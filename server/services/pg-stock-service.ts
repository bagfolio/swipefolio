/**
 * pg-stock-service.ts
 *
 * This service handles loading stock data from our PostgreSQL database.
 * It includes fetching pre-processed time period data for charts.
 */

import { pool } from '../db';
import { log } from '../vite'; // Assuming log function is available

/**
 * Service for accessing PostgreSQL stock data
 */
export class PgStockService {
  private stockSymbols: string[] = [];
  private initialized: boolean = false;

  constructor() {
    console.log('PgStockService initialized');
    this.loadStockData().catch(err => log(`Error initializing PgStockService: ${err}`, 'pg-stock-service'));
  }

  /**
   * Load stock data from the database and initialize cache
   */
  async loadStockData(): Promise<boolean> {
    try {
      log('Loading stock symbols from PostgreSQL...', 'pg-stock-service');
      const symbolsResult = await pool.query<{ ticker: string }>(`
        SELECT ticker FROM stocks ORDER BY ticker
      `);

      if (symbolsResult.rows.length > 0) {
        this.stockSymbols = symbolsResult.rows.map(row => row.ticker);
        this.initialized = true;
        log(`PostgreSQL stock data initialization complete: ${this.stockSymbols.length} stocks available`, 'pg-stock-service');
        return true;
      } else {
        log('No stocks found in the database', 'pg-stock-service');
        return false;
      }
    } catch (error) {
      log(`Error loading stock data from PostgreSQL: ${error}`, 'pg-stock-service');
      this.initialized = false; // Ensure initialized is false on error
      return false;
    }
  }

  /**
   * Get all available stock symbols
   */
  public async getAvailableSymbols(): Promise<string[]> {
    if (this.initialized && this.stockSymbols.length > 0) {
      return this.stockSymbols;
    }
    // If not initialized, try loading again
    await this.loadStockData();
    return this.stockSymbols;
  }

  /**
   * Get stock data from PostgreSQL (simplified, focus is on history)
   * NOTE: This is a simplified version. The full getStockData from your original file
   * should be used if you need all the other details (profile, financials etc.)
   */
  public async getStockData(symbol: string): Promise<any> {
     try {
       const basicResult = await pool.query(`
         SELECT * FROM stocks WHERE ticker = $1
       `, [symbol]);
       if (basicResult.rows.length === 0) return null;
       return basicResult.rows[0]; // Return basic info for now
     } catch (error) {
       log(`Error fetching basic data for ${symbol}: ${error}`, 'pg-stock-service');
       return null;
     }
  }


  /**
   * Get pre-processed price history data for a specific ticker and time period.
   * Assumes a 'time_period_data' table exists with columns: ticker, period, dates (jsonb), prices (jsonb).
   * @param ticker The stock ticker symbol
   * @param period The time period (e.g., '1M', '1Y', 'MAX') - Case-insensitive matching
   * @returns Object containing dates and prices arrays or null if not found.
   */
  async getPriceHistoryForPeriod(ticker: string, period: string): Promise<{ dates: string[], prices: number[] } | null> {
    try {
      // Normalize period to lowercase for query, but keep original for logging
      const normalizedPeriod = period.toLowerCase();
      log(`[PG-STOCK] Getting pre-processed history for ${ticker} (${period})`, 'pg-stock-service');

      // Query the dedicated time_period_data table
      // Ensure table and column names match your actual schema
      const query = `
        SELECT dates, prices
        FROM time_period_data
        WHERE ticker = $1 AND LOWER(period) = $2
        LIMIT 1;
      `;

      const result = await pool.query<{ dates: string[], prices: number[] }>(query, [ticker, normalizedPeriod]);

      if (result.rows.length > 0 && result.rows[0].dates && result.rows[0].prices) {
        log(`[PG-STOCK] Found pre-processed data for ${ticker} (${period})`, 'pg-stock-service');
        // Ensure data is in the correct array format
        const dates = Array.isArray(result.rows[0].dates) ? result.rows[0].dates : [];
        const prices = Array.isArray(result.rows[0].prices) ? result.rows[0].prices.map(p => Number(p)) : []; // Ensure prices are numbers

        if (dates.length === prices.length && dates.length > 0) {
          return {
            dates: dates,
            prices: prices
          };
        } else {
           log(`[PG-STOCK] Data format mismatch or empty for ${ticker} (${period}). Dates: ${dates.length}, Prices: ${prices.length}`, 'pg-stock-service');
           return null;
        }
      } else {
        log(`[PG-STOCK] No pre-processed data found for ${ticker} (${period}) in time_period_data table`, 'pg-stock-service');
        return null;
      }
    } catch (error) {
      log(`[PG-STOCK] Error fetching pre-processed history for '${ticker}' (${period}): ${error}`, 'pg-stock-service');
      return null;
    }
  }

  /**
   * Placeholder for refreshing cache - adapt if needed
   */
  async refreshCache(): Promise<{ success: string[], failures: string[] }> {
     try {
       await this.loadStockData();
       return { success: this.stockSymbols, failures: [] };
     } catch (error) {
       log(`Error refreshing PostgreSQL cache: ${error}`, 'pg-stock-service');
       return { success: [], failures: ['Database error'] };
     }
  }

  // --- Other methods like getRecommendations, getStocksByIndustry etc. remain the same ---
  // --- Add them back here from your original file if needed ---
  async getRecommendations(ticker: string): Promise<any> { /* ... implementation ... */ return null; }
  async getStocksByIndustry(industry: string): Promise<any[]> { /* ... implementation ... */ return []; }
  async getStocksBySector(sector: string): Promise<any[]> { /* ... implementation ... */ return []; }
  async getTopDividendStocks(limit: number = 10): Promise<any[]> { /* ... implementation ... */ return []; }
  async getStocksWithUpgrades(): Promise<any[]> { /* ... implementation ... */ return []; }
  private formatStockData(data: any): any { /* ... implementation ... */ return data; }
  private calculatePerformanceScore(data: any): number { return 50; }
  private calculateStabilityScore(data: any): number { return 50; }
  private calculateValueScore(data: any): number { return 50; }
  private calculateMomentumScore(data: any): number { return 50; }
  private calculateQualityRating(data: any): string { return "Average"; }

}

export const pgStockService = new PgStockService();
