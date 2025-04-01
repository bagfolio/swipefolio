/**
 * json-stock-service.ts
 * 
 * This service handles loading stock data from JSON files.
 * It is designed to work with the static JSON files located in client/src/STOCKDATA.
 */

// Create a simple service to manage stock data without external API dependencies
class JsonStockService {
  private symbols: string[] = [
    // Tech stocks
    'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META',
    // Healthcare stocks
    'JNJ', 'UNH', 'PFE', 'ABT', 'MRK',
    // Real Estate stocks
    'PLD', 'AMT', 'CCI', 'SPG', 'O',
    // Financial stocks
    'JPM', 'BAC', 'WFC', 'C', 'GS'
  ];

  // Initialize the service
  constructor() {
    console.log('JsonStockService initialized');
  }

  // This method will be used to load stock data from JSON files
  async loadStockData() {
    // The data is loaded on the client side from the STOCKDATA directory
    console.log('Stock data is loaded from client-side static JSON files');
    return true;
  }

  // Method to refresh stocks (stub - no actual implementation needed)
  async refreshCache(): Promise<{ success: string[], failures: string[] }> {
    // Return empty arrays since we're not actually refreshing any data
    return { success: [], failures: [] };
  }

  // Method to get available stock symbols
  getAvailableSymbols(): string[] {
    return this.symbols;
  }
}

// Export a singleton instance of the service
export const jsonStockService = new JsonStockService();