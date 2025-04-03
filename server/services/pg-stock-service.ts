/**
 * pg-stock-service.ts
 *
 * Service for accessing PostgreSQL stock data, including time period data.
 */

import { pool } from '../db';
import { log } from '../vite'; // Assuming log function is available

export class PgStockService {
  private stockSymbols: string[] = [];
  private initialized: boolean = false;

  constructor() {
    console.log('PgStockService initialized');
    this.loadStockData().catch(err => log(`Error initializing PgStockService: ${err}`, 'pg-stock-service'));
  }

  async loadStockData(): Promise<boolean> {
    // ... (keep your existing loadStockData implementation) ...
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
      this.initialized = false;
      return false;
    }
  }

  public async getAvailableSymbols(): Promise<string[]> {
     // ... (keep your existing getAvailableSymbols implementation) ...
     if (this.initialized && this.stockSymbols.length > 0) {
       return this.stockSymbols;
     }
     await this.loadStockData();
     return this.stockSymbols;
  }

  public async getStockData(symbol: string): Promise<any> {
     // ... (keep your existing getStockData implementation) ...
     try {
       const basicResult = await pool.query(`
         SELECT * FROM stocks WHERE ticker = $1
       `, [symbol]);
       if (basicResult.rows.length === 0) return null;
       // Add logic to fetch and merge detailed data if needed
       return basicResult.rows[0];
     } catch (error) {
       log(`Error fetching basic data for ${symbol}: ${error}`, 'pg-stock-service');
       return null;
     }
  }


  /**
   * Get pre-processed price history data for a specific ticker and time period
   * from the 'time_period_data' table.
   * @param ticker The stock ticker symbol (uppercase)
   * @param period The time period (e.g., '1M', '1Y') - Will be lowercased for query
   * @returns Object containing dates and prices arrays or null if not found/invalid.
   */
  async getPriceHistoryForPeriod(ticker: string, period: string): Promise<{ dates: string[], prices: number[] } | null> {
    const normalizedPeriod = period.toLowerCase(); // Use lowercase for querying
    log(`[PG-STOCK] Service: Getting history for ${ticker} (${period} -> ${normalizedPeriod})`, 'pg-stock-service');

    try {
      // Explicitly check if the table exists (optional, but good for debugging)
      // const tableExistsResult = await pool.query(`SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'time_period_data');`);
      // if (!tableExistsResult.rows[0].exists) {
      //    log(`[PG-STOCK] Error: 'time_period_data' table does not exist.`, 'pg-stock-service');
      //    return null;
      // }

      // Query the dedicated time_period_data table
      const query = `
        SELECT dates, prices
        FROM time_period_data
        WHERE ticker = $1 AND LOWER(period) = $2
        LIMIT 1;
      `;
      log(`[PG-STOCK] Executing query: ${query} with params: [${ticker}, ${normalizedPeriod}]`, 'pg-stock-service');

      const result = await pool.query<{ dates: any, prices: any }>(query, [ticker, normalizedPeriod]);
      log(`[PG-STOCK] Query result rows: ${result.rows.length}`, 'pg-stock-service');

      if (result.rows.length === 0) {
        log(`[PG-STOCK] No data found for ${ticker} (${normalizedPeriod}) in time_period_data`, 'pg-stock-service');
        return null;
      }

      const rowData = result.rows[0];
      log(`[PG-STOCK] Raw data from DB: dates type=${typeof rowData.dates}, prices type=${typeof rowData.prices}`, 'pg-stock-service');
      // log(`[PG-STOCK] Raw dates: ${JSON.stringify(rowData.dates)}`, 'pg-stock-service'); // Be careful logging large data

      // --- Data Validation ---
      if (!rowData.dates || !rowData.prices) {
        log(`[PG-STOCK] Missing dates or prices column data for ${ticker} (${normalizedPeriod})`, 'pg-stock-service');
        return null;
      }

      // Ensure dates and prices are arrays (PostgreSQL returns JSONB as objects/arrays directly)
      if (!Array.isArray(rowData.dates) || !Array.isArray(rowData.prices)) {
        log(`[PG-STOCK] Invalid format: dates or prices are not arrays for ${ticker} (${normalizedPeriod})`, 'pg-stock-service');
        return null;
      }

      const dates: string[] = rowData.dates;
      const prices: number[] = rowData.prices.map(p => Number(p)).filter(p => !isNaN(p)); // Ensure prices are valid numbers

      if (dates.length !== prices.length) {
        log(`[PG-STOCK] Data length mismatch: ${dates.length} dates, ${prices.length} prices for ${ticker} (${normalizedPeriod})`, 'pg-stock-service');
        // Attempt to truncate to the shorter length if one is slightly off? Or return null?
        // Returning null is safer to avoid misaligned data.
        return null;
      }

      if (dates.length === 0) {
        log(`[PG-STOCK] Found empty arrays for ${ticker} (${normalizedPeriod})`, 'pg-stock-service');
        return null; // Treat empty arrays as no data found
      }

      log(`[PG-STOCK] Successfully retrieved and validated ${dates.length} points for ${ticker} (${normalizedPeriod})`, 'pg-stock-service');
      return {
        dates: dates, // Return as retrieved (should be oldest to newest if stored correctly)
        prices: prices
      };

    } catch (error: any) {
      // Log specific SQL errors if possible
      log(`[PG-STOCK] Database Error fetching history for '${ticker}' (${period}): ${error.message}`, 'pg-stock-service');
      // console.error(error); // Log full error stack trace if needed
      return null; // Return null on any database error
    }
  }

  async refreshCache(): Promise<{ success: string[], failures: string[] }> {
     // ... (keep your existing refreshCache implementation) ...
     try {
       await this.loadStockData();
       return { success: this.stockSymbols, failures: [] };
     } catch (error) {
       log(`Error refreshing PostgreSQL cache: ${error}`, 'pg-stock-service');
       return { success: [], failures: ['Database error'] };
     }
  }
  // --- Keep other methods like getRecommendations etc. ---
  async getRecommendations(ticker: string): Promise<any> { /* ... */ return null; }
  async getStocksByIndustry(industry: string): Promise<any[]> { /* ... */ return []; }
  async getStocksBySector(sector: string): Promise<any[]> { /* ... */ return []; }
  async getTopDividendStocks(limit: number = 10): Promise<any[]> { /* ... */ return []; }
  async getStocksWithUpgrades(): Promise<any[]> { /* ... */ return []; }
  private formatStockData(data: any): any { /* ... */ return data; }
  private calculatePerformanceScore(data: any): number { return 50; }
  private calculateStabilityScore(data: any): number { return 50; }
  private calculateValueScore(data: any): number { return 50; }
  private calculateMomentumScore(data: any): number { return 50; }
  private calculateQualityRating(data: any): string { return "Average"; }
}

export const pgStockService = new PgStockService();
