/**
 * stock-service.ts
 * 
 * This service integrates our PostgreSQL stock data with the existing application.
 * It can fall back to the JSON-based stock service during the transition period.
 */

import { postgresStockService } from './postgres-stock-service';
import { jsonStockService } from './json-stock-service';
import { log } from '../vite';

/**
 * StockService that prioritizes PostgreSQL data but can fall back to JSON data
 */
export class StockService {
  // Flag to determine if we're using PostgreSQL or JSON
  private usingPostgres: boolean = true;
  // Cache of available stock symbols in PostgreSQL
  private postgresSymbols: Set<string> = new Set();

  constructor() {
    log('StockService initialized - Starting with PostgreSQL data source', 'stock-service');
    this.initializeService().catch(err => {
      log(`Error initializing stock service: ${err}`, 'stock-service');
    });
  }

  /**
   * Initialize the service by checking the availability of PostgreSQL data
   */
  private async initializeService(): Promise<void> {
    try {
      // Try to initialize PostgreSQL service
      const pgLoaded = await postgresStockService.loadStockData();
      
      if (pgLoaded) {
        // Get the available symbols from PostgreSQL
        const symbols = await postgresStockService.getAvailableSymbols();
        symbols.forEach(symbol => this.postgresSymbols.add(symbol));
        
        log(`Successfully initialized PostgreSQL stock service with ${symbols.length} stocks`, 'stock-service');
        this.usingPostgres = true;
      } else {
        log('Failed to initialize PostgreSQL stock service, falling back to JSON', 'stock-service');
        this.usingPostgres = false;
        
        // Initialize JSON service as fallback
        await jsonStockService.loadStockData();
      }
    } catch (error) {
      log(`Error during service initialization: ${error}`, 'stock-service');
      this.usingPostgres = false;
      
      // Initialize JSON service as fallback
      await jsonStockService.loadStockData();
    }
  }

  /**
   * Get stock data for a given symbol, prioritizing PostgreSQL data
   */
  public async getStockData(symbol: string): Promise<any> {
    try {
      // Normalize the symbol
      const normalizedSymbol = symbol.toUpperCase();
      
      // If we're using PostgreSQL and the symbol is available in PostgreSQL
      if (this.usingPostgres && this.postgresSymbols.has(normalizedSymbol)) {
        const pgData = await postgresStockService.getStockData(normalizedSymbol);
        
        if (pgData) {
          return pgData;
        }
        // Fall back to JSON if PostgreSQL data retrieval fails
      }
      
      // Try JSON data as a fallback
      return jsonStockService.getStockData(normalizedSymbol);
    } catch (error) {
      log(`Error getting stock data for ${symbol}: ${error}`, 'stock-service');
      
      // Final fallback to JSON
      return jsonStockService.getStockData(symbol);
    }
  }

  /**
   * Get all available stock symbols from both sources
   */
  public async getAvailableSymbols(): Promise<string[]> {
    let symbols: string[] = [];
    
    if (this.usingPostgres) {
      try {
        // Get symbols from PostgreSQL
        const pgSymbols = await pgStockService.getAvailableSymbols();
        symbols = [...pgSymbols];
      } catch (error) {
        log(`Error getting PostgreSQL symbols: ${error}`, 'stock-service');
      }
    }
    
    if (symbols.length === 0) {
      // Fall back to JSON symbols if needed
      try {
        const jsonSymbols = jsonStockService.getAvailableSymbols();
        symbols = [...jsonSymbols];
      } catch (error) {
        log(`Error getting JSON symbols: ${error}`, 'stock-service');
      }
    }
    
    return symbols;
  }

  /**
   * Get stocks by industry
   */
  public async getStocksByIndustry(industry: string): Promise<any[]> {
    if (this.usingPostgres) {
      try {
        const stocks = await pgStockService.getStocksByIndustry(industry);
        if (stocks && stocks.length > 0) {
          return stocks;
        }
      } catch (error) {
        log(`Error getting industry stocks from PostgreSQL: ${error}`, 'stock-service');
      }
    }
    
    // Fall back to JSON - will need to filter manually
    try {
      const allSymbols = jsonStockService.getAvailableSymbols();
      const industryStocks = [];
      
      for (const symbol of allSymbols) {
        const stock = jsonStockService.getStockData(symbol);
        if (stock && stock.industry === industry) {
          industryStocks.push(stock);
        }
      }
      
      return industryStocks;
    } catch (error) {
      log(`Error getting industry stocks from JSON: ${error}`, 'stock-service');
      return [];
    }
  }

  /**
   * Get stocks by sector
   */
  public async getStocksBySector(sector: string): Promise<any[]> {
    if (this.usingPostgres) {
      try {
        const stocks = await pgStockService.getStocksBySector(sector);
        if (stocks && stocks.length > 0) {
          return stocks;
        }
      } catch (error) {
        log(`Error getting sector stocks from PostgreSQL: ${error}`, 'stock-service');
      }
    }
    
    // Fall back to JSON - will need to filter manually
    try {
      const allSymbols = jsonStockService.getAvailableSymbols();
      const sectorStocks = [];
      
      for (const symbol of allSymbols) {
        const stock = jsonStockService.getStockData(symbol);
        if (stock && stock.sector === sector) {
          sectorStocks.push(stock);
        }
      }
      
      return sectorStocks;
    } catch (error) {
      log(`Error getting sector stocks from JSON: ${error}`, 'stock-service');
      return [];
    }
  }

  /**
   * Refresh stock data cache
   */
  public async refreshCache(): Promise<{ success: string[], failures: string[] }> {
    if (this.usingPostgres) {
      try {
        return await pgStockService.refreshCache();
      } catch (error) {
        log(`Error refreshing PostgreSQL cache: ${error}`, 'stock-service');
      }
    }
    
    // Fall back to JSON
    return jsonStockService.refreshCache();
  }

  /**
   * Force the service to use PostgreSQL (or not)
   */
  public setUsePostgres(usePostgres: boolean): void {
    this.usingPostgres = usePostgres;
    log(`Stock service data source set to: ${usePostgres ? 'PostgreSQL' : 'JSON'}`, 'stock-service');
  }

  /**
   * Check if the service is using PostgreSQL
   */
  public isUsingPostgres(): boolean {
    return this.usingPostgres;
  }
}

export const stockService = new StockService();