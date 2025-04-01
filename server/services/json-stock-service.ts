import fs from 'fs';
import path from 'path';
import { log } from '../vite';

// Define the directory where stock JSON files are stored
const stockDataDir = path.join(process.cwd(), 'client', 'src', 'STOCKDATA');

// Define interfaces for stock data
interface StockMetrics {
  pe?: number;
  pb?: number;
  dividend?: number;
  growthRate?: number;
  eps?: number;
  beta?: number;
  marketCap?: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  avgVolume?: number;
  performance?: number;
  stability?: number;
  value?: number;
  momentum?: number;
  esgRating?: string;
  analystRating?: string;
  priceTarget?: number;
  revenueGrowth?: number;
  profitMargin?: number;
  debtToEquity?: number;
}

interface StockData {
  name: string;
  ticker: string;
  price: number;
  change: number;
  industry: string;
  sector?: string;
  metrics?: StockMetrics;
  description?: string;
  chartData?: { date: string; value: number }[];
  news?: { title: string; date: string; source: string; url: string }[];
  competitors?: string[];
  risk?: string;
  recommendation?: string;
  // Add any other properties that are expected in your JSON files
}

// JSON stock service to load stock data from local files
class JsonStockService {
  // Get list of available stock symbols from JSON files
  getAvailableSymbols(): string[] {
    try {
      // Make sure the directory exists
      if (!fs.existsSync(stockDataDir)) {
        log(`Stock data directory does not exist: ${stockDataDir}`);
        return [];
      }
      
      // Read all files in the directory
      const files = fs.readdirSync(stockDataDir);
      
      // Filter for JSON files that match stock symbol pattern
      const stockFiles = files.filter(file => 
        file.endsWith('.json') && 
        file.length >= 3 &&  // Ensure file has at least a 1-char name before .json
        !file.startsWith('index') && 
        !file.startsWith('sample')
      );
      
      // Extract symbols from filenames (remove .json extension)
      const symbols = stockFiles.map(file => path.basename(file, '.json'));
      
      log(`Found ${symbols.length} stock JSON files`);
      return symbols;
    } catch (error) {
      log(`Error getting available symbols: ${error}`);
      return [];
    }
  }
  
  // Check if a stock's JSON file exists
  fileExists(symbol: string): boolean {
    const filePath = path.join(stockDataDir, `${symbol.toUpperCase()}.json`);
    return fs.existsSync(filePath);
  }
  
  // Get stock data from JSON file
  getStockData(symbol: string): StockData {
    try {
      const filePath = path.join(stockDataDir, `${symbol.toUpperCase()}.json`);
      
      if (!fs.existsSync(filePath)) {
        throw new Error(`No JSON file found for symbol: ${symbol}`);
      }
      
      // Use a custom JSON parser that can handle NaN values
      try {
        // Read file content
        let fileContent = fs.readFileSync(filePath, 'utf8');
        
        // Replace NaN with null
        fileContent = fileContent.replace(/\bNaN\b/g, 'null');
        
        // Parse the modified JSON
        const rawData = JSON.parse(fileContent);
        
        // Create a standardized StockData object from the raw JSON
        const stockData: StockData = {
          name: rawData.company_name || symbol,
          ticker: symbol.toUpperCase(),
          price: rawData.current_price || 100,
          change: 0, // Calculate from historical data if available
          industry: rawData.industry || "Unknown",
          sector: rawData.sector,
          description: rawData.summary,
          metrics: {
            pe: rawData.price_to_earnings,
            dividend: rawData.dividend_yield,
            beta: rawData.beta,
            marketCap: rawData.market_cap,
            // Add other metrics as needed
          }
        };
        
        // Generate chart data from the historical closing prices if available
        if (rawData.closing_history_5y) {
          const chartData = [];
          const closingHistory = rawData.closing_history_5y;
          
          // Take the last 12 months of data
          const dates = Object.keys(closingHistory).sort().slice(-12);
          
          for (const date of dates) {
            chartData.push({
              date,
              value: closingHistory[date]
            });
          }
          
          stockData.chartData = chartData;
          
          // Calculate price change based on most recent vs previous month
          if (chartData.length >= 2) {
            const lastPrice = chartData[chartData.length - 1].value;
            const prevPrice = chartData[chartData.length - 2].value;
            stockData.change = (lastPrice - prevPrice) / prevPrice * 100;
          }
        }
        
        log(`Successfully loaded stock data for ${symbol}`);
        return stockData;
      } catch (error: any) {
        // If there's still an error, log it but create a basic stock object from available metadata
        log(`Error parsing JSON for ${symbol} (using backup approach): ${error.message || error}`);
        
        // Create a minimal stock data object based on the filename
        const fallbackStock: StockData = {
          name: this.getCompanyNameForSymbol(symbol),
          ticker: symbol.toUpperCase(),
          price: 100 + (Math.random() * 100), // Random price between 100-200
          change: (Math.random() * 10) - 5, // Random change between -5% and +5%
          industry: this.guessIndustryFromSymbol(symbol),
          description: `${this.getCompanyNameForSymbol(symbol)} (${symbol}) is a company trading on the stock market.`
        };
        
        // Generate some basic chart data
        const chartData = [];
        const today = new Date();
        const basePrice = fallbackStock.price;
        
        for (let i = 11; i >= 0; i--) {
          const date = new Date();
          date.setMonth(today.getMonth() - i);
          
          const randomFactor = (Math.random() - 0.5) * 0.1;
          const value = basePrice * (1 + (i * 0.01) + randomFactor);
          
          chartData.push({
            date: date.toISOString().split('T')[0],
            value
          });
        }
        
        fallbackStock.chartData = chartData;
        
        return fallbackStock;
      }
    } catch (error) {
      log(`Error loading stock data for ${symbol}: ${error}`);
      throw error;
    }
  }
  
  // Helper method to guess a company name from a ticker symbol
  private getCompanyNameForSymbol(symbol: string): string {
    const knownCompanies: Record<string, string> = {
      'AAPL': 'Apple Inc.',
      'MSFT': 'Microsoft Corporation',
      'GOOGL': 'Alphabet Inc.',
      'AMZN': 'Amazon.com Inc.',
      'META': 'Meta Platforms Inc.',
      'TSLA': 'Tesla, Inc.',
      'NVDA': 'NVIDIA Corporation',
      'JNJ': 'Johnson & Johnson',
      'PFE': 'Pfizer Inc.',
      'UNH': 'UnitedHealth Group Inc.',
      'ABBV': 'AbbVie Inc.',
      'SYK': 'Stryker Corporation',
      'PLD': 'Prologis Inc.',
      'AVB': 'AvalonBay Communities Inc.',
      'O': 'Realty Income Corporation',
      'SPG': 'Simon Property Group Inc.',
      'AMT': 'American Tower Corporation'
    };
    
    return knownCompanies[symbol] || `${symbol} Corporation`;
  }
  
  // Helper method to guess an industry from a ticker symbol
  private guessIndustryFromSymbol(symbol: string): string {
    const industryMap: Record<string, string> = {
      'AAPL': 'Technology',
      'MSFT': 'Technology',
      'GOOGL': 'Technology',
      'AMZN': 'Consumer Cyclical',
      'META': 'Communication Services',
      'NVDA': 'Technology',
      'TSLA': 'Automotive',
      'JNJ': 'Healthcare',
      'PFE': 'Healthcare',
      'UNH': 'Healthcare',
      'ABBV': 'Healthcare',
      'SYK': 'Healthcare',
      'PLD': 'Real Estate',
      'AVB': 'Real Estate',
      'O': 'Real Estate',
      'SPG': 'Real Estate',
      'AMT': 'Real Estate'
    };
    
    return industryMap[symbol] || 'General';
  }
}

// Create a singleton instance
export const jsonStockService = new JsonStockService();