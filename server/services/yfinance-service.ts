import { join } from 'path';
import Database from 'better-sqlite3';
import { log } from '../vite';
import { getMockStockData } from '../../shared/mock-stocks';

// Define some interfaces for our database interactions
interface TableRecord {
  name: string;
  [key: string]: any;
}

interface SymbolRecord {
  symbol: string;
  [key: string]: any;
}

interface CacheEntry {
  key: string;
  response: string;
  [key: string]: any;
}

/**
 * Service for interacting with the Yahoo Finance cache database
 */
export class YFinanceService {
  private db: Database.Database | null = null;
  private isInitialized = false;

  constructor() {
    try {
      // Try to locate the database file
      const dbPath = join(process.cwd(), 'data', 'yfinance_cache.sqlite');
      
      try {
        // First try to open the database
        this.db = new Database(dbPath, { readonly: true, fileMustExist: true });
        this.isInitialized = true;
        log('YFinance cache database loaded successfully', 'yfinance');
      } catch (dbError) {
        // If corrupted, log the error
        log('Database may be corrupted or inaccessible', 'yfinance');
        this.isInitialized = false;
        log('Unable to use YFinance database, will use alternatives', 'yfinance');
      }
    } catch (error) {
      console.error('Failed to open YFinance cache database:', error);
      this.isInitialized = false;
    }
  }

  /**
   * Get information about the database structure
   */
  public getDatabaseInfo(): any {
    if (!this.isInitialized || !this.db) {
      return { error: 'Database not initialized' };
    }

    try {
      // Get list of tables
      const tables = this.db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as TableRecord[];
      
      // Get sample from each table if possible
      const tableData: Record<string, any> = {};
      
      for (const table of tables) {
        try {
          const tableName = table.name;
          const sampleRows = this.db.prepare(`SELECT * FROM ${tableName} LIMIT 1`).all();
          tableData[tableName] = sampleRows;
        } catch (error) {
          tableData[table.name] = { error: 'Failed to query table' };
        }
      }
      
      return {
        tables: tables.map(t => t.name),
        sampleData: tableData
      };
    } catch (error) {
      console.error('Error getting database info:', error);
      return { error: 'Failed to get database info', details: String(error) };
    }
  }

  /**
   * Get all cached stock symbols from the database
   */
  public getAvailableSymbols(): string[] {
    if (!this.isInitialized || !this.db) {
      return [];
    }

    try {
      // Extract unique symbols from cache keys
      // This is a simplification; we'll need to adapt this based on actual db structure
      const stmt = this.db.prepare("SELECT DISTINCT SUBSTR(key, 0, INSTR(key, '?')) as symbol FROM cache");
      const result = stmt.all() as SymbolRecord[];
      
      // Process results to extract just the ticker symbols
      const symbols = new Set<string>();
      result.forEach((row: SymbolRecord) => {
        const key = row.symbol;
        // Extract symbol from URL patterns like /finance/quote?symbols=AAPL
        const matches = key.match(/symbols?=([A-Z0-9.]+)/i);
        if (matches && matches[1]) {
          symbols.add(matches[1]);
        }
      });
      
      return Array.from(symbols);
    } catch (error) {
      console.error('Error getting available symbols:', error);
      return [];
    }
  }

  /**
   * Get all cached data for a specific symbol
   */
  public getStockData(symbol: string): any {
    if (!this.isInitialized || !this.db) {
      // If no database is available, return mock data with a warning
      const mockData = getMockStockData(symbol);
      return {
        ...mockData,
        warning: 'Using cached mock data due to database unavailability'
      };
    }

    try {
      // Find all cache entries related to this symbol
      const stmt = this.db.prepare("SELECT * FROM cache WHERE key LIKE ?");
      const entries = stmt.all(`%symbols=${symbol}%`) as CacheEntry[];
      
      if (entries.length === 0) {
        // Try alternate format
        const altEntries = stmt.all(`%symbol=${symbol}%`) as CacheEntry[];
        if (altEntries.length === 0) {
          // If no data found, return mock data with a warning
          const mockData = getMockStockData(symbol);
          return { 
            ...mockData,
            warning: 'No data found for symbol in database, using mock data'
          };
        }
        return this.processDataEntries(altEntries);
      }
      
      return this.processDataEntries(entries);
    } catch (error) {
      console.error(`Error getting data for symbol ${symbol}:`, error);
      
      // On error, return mock data with a warning
      const mockData = getMockStockData(symbol);
      return {
        ...mockData,
        warning: 'Error accessing database, using mock data',
        error: String(error)
      };
    }
  }

  /**
   * Process and combine multiple data entries into a coherent stock record
   */
  private processDataEntries(entries: CacheEntry[]): any {
    const result: Record<string, any> = {
      quote: {},
      fundamentals: {},
      chart: {},
      profile: {}
    };

    for (const entry of entries) {
      try {
        // Parse the cached response
        const response = JSON.parse(entry.response);
        
        // Check what type of data this is based on the URL
        const url = entry.key;
        
        if (url.includes('/v7/finance/quote')) {
          // Quote data
          if (response.quoteResponse?.result?.length > 0) {
            result.quote = response.quoteResponse.result[0];
          }
        } 
        else if (url.includes('/v10/finance/quoteSummary')) {
          // Fundamentals data
          if (response.quoteSummary?.result?.length > 0) {
            result.fundamentals = response.quoteSummary.result[0];
          }
        }
        else if (url.includes('/v8/finance/chart')) {
          // Chart data
          if (response.chart?.result?.length > 0) {
            result.chart = response.chart.result[0];
          }
        }
        // Additional data types can be parsed here
      } catch (error) {
        console.error('Error processing data entry:', error);
      }
    }

    return result;
  }
}

export const yfinanceService = new YFinanceService();