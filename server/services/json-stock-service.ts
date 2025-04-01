// Import required modules
import path from 'path';
import fs from 'fs';

// Define stock data structure
interface StockData {
  symbol: string;
  companyName: string;
  price: number;
  change: number;
  changePercent: number;
  industry: string;
  description: string;
  metrics: Record<string, any>;
  chartData?: Array<{timestamp: number, price: number}>;
  [key: string]: any;
}

class JsonStockService {
  private cache: Map<string, StockData> = new Map();
  
  constructor() {
    // Intentionally left empty - no need to initialize connections
  }
  
  /**
   * Get stock data for a specific symbol
   */
  async getStockData(symbol: string): Promise<any> {
    try {
      // Try to get from cache first
      if (this.cache.has(symbol)) {
        return this.cache.get(symbol);
      }
      
      // If not in cache, fetch from local JSON data
      const data = await this.fetchStockData(symbol);
      if (data) {
        // Store in cache for subsequent requests
        this.cache.set(symbol, data);
      }
      return data;
    } catch (error) {
      console.error(`Error getting stock data for ${symbol}:`, error);
      throw new Error(`Failed to get stock data for ${symbol}`);
    }
  }
  
  /**
   * Fetch stock data from local JSON files
   */
  private async fetchStockData(symbol: string): Promise<any> {
    try {
      // For this implementation, we're just going to respond with a simple error
      // Actual implementation would load from STOCKDATA directory files in the client folder
      throw new Error(`Stock data service is not configured`);
    } catch (error) {
      console.error(`Error fetching stock data for ${symbol}:`, error);
      throw new Error(`Failed to fetch stock data for ${symbol}`);
    }
  }
  
  /**
   * Get bulk stock data for multiple symbols
   */
  async getBulkStockData(symbols: string[]): Promise<Record<string, any>> {
    const results: Record<string, any> = {};
    
    for (const symbol of symbols) {
      try {
        results[symbol] = await this.getStockData(symbol);
      } catch (error) {
        console.error(`Error getting bulk data for ${symbol}:`, error);
        results[symbol] = null;
      }
    }
    
    return results;
  }
}

// Export a singleton instance
export const jsonStockService = new JsonStockService();