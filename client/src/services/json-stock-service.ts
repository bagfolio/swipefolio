import { StockData } from "@/lib/stock-data";
import axios from "axios";

/**
 * Client-side service to access stock data from JSON files
 */
class JsonStockService {
  private stockCache: Record<string, StockData> = {};
  private allStocks: StockData[] = [];
  private availableSymbols: string[] = [];
  private isInitialized: boolean = false;

  constructor() {
    this.initialize();
  }

  /**
   * Initialize the service by loading available stock symbols
   */
  private async initialize() {
    try {
      // Get the list of available stocks
      const response = await axios.get('/api/stocks');
      this.availableSymbols = response.data.availableStocks || [];
      console.log(`JsonStockService initialized with ${this.availableSymbols.length} available symbols`);
      this.isInitialized = true;
    } catch (error) {
      console.error('Error initializing JsonStockService:', error);
      // Create a default list if the API call fails
      this.availableSymbols = [
        'AAPL', 'MSFT', 'AMZN', 'META', 'AVB', 
        'O', 'PLD', 'SPG', 'AMT', 'SYK'
      ];
      console.log(`Using default symbols: ${this.availableSymbols.join(', ')}`);
      this.isInitialized = true;
    }
  }

  /**
   * Get stock data for a specific symbol
   */
  public async getStockData(symbol: string): Promise<StockData> {
    // Wait for initialization if needed
    if (!this.isInitialized) {
      await new Promise(resolve => {
        const checkInit = () => {
          if (this.isInitialized) {
            resolve(true);
          } else {
            setTimeout(checkInit, 100);
          }
        };
        checkInit();
      });
    }

    // Check cache first
    if (this.stockCache[symbol]) {
      return this.stockCache[symbol];
    }

    try {
      // Fetch from server
      const response = await axios.get(`/api/stock/${symbol}`);
      const stockData = this.formatToStockData(response.data);
      
      // Store in cache
      this.stockCache[symbol] = stockData;
      return stockData;
    } catch (error) {
      console.error(`Error getting stock data for ${symbol}:`, error);
      throw new Error(`Failed to fetch data for ${symbol}`);
    }
  }

  /**
   * Get all available stocks
   */
  public async getAllStocks(): Promise<StockData[]> {
    // Return cached result if available
    if (this.allStocks.length > 0) {
      return this.allStocks;
    }

    // Wait for initialization if needed
    if (!this.isInitialized) {
      await new Promise(resolve => {
        const checkInit = () => {
          if (this.isInitialized) {
            resolve(true);
          } else {
            setTimeout(checkInit, 100);
          }
        };
        checkInit();
      });
    }

    // Load all stocks in parallel
    try {
      const stockPromises = this.availableSymbols.map(symbol => this.getStockData(symbol));
      this.allStocks = await Promise.all(stockPromises);
      return this.allStocks;
    } catch (error) {
      console.error('Error fetching all stocks:', error);
      return [];
    }
  }

  /**
   * Get stocks in a specific industry
   */
  public async getIndustryStocks(industry: string): Promise<StockData[]> {
    const allStocks = await this.getAllStocks();
    return allStocks.filter(stock => stock.industry === industry);
  }

  /**
   * Format the API response to match our StockData interface
   */
  private formatToStockData(data: any): StockData {
    // Convert performance metrics to the format expected by the app
    const createMetricObject = (value: number, details: any) => {
      // Determine color based on value
      let color: 'green' | 'yellow' | 'red' = 'yellow';
      if (value >= 70) color = 'green';
      else if (value <= 30) color = 'red';
      
      return { value, color, details };
    };
    
    // Create chart data if not present
    if (!data.chartData && data.history && data.history.length > 0) {
      const chartData = data.history.slice(-12).map((item: any) => item.close || 0);
      data.chartData = chartData;
    } else if (!data.chartData) {
      // Generate some synthetic data based on the current price
      const price = data.price || 100;
      const change = data.change || 0;
      const volatility = 0.02; // 2% volatility
      
      // Generate 12 data points for chart
      data.chartData = Array(12).fill(0).map((_, i) => {
        const randomFactor = 1 + (Math.random() * volatility * 2 - volatility);
        const trend = 1 + (change / price / 12 * i);
        return price * randomFactor * trend;
      });
    }
    
    // Map the data to our StockData interface
    return {
      ticker: data.symbol,
      symbol: data.symbol,
      name: data.name || data.longName || data.shortName || data.symbol,
      price: data.price || data.regularMarketPrice || 0,
      change: data.change || data.regularMarketChange || 0,
      changePercent: data.changePercent || data.regularMarketChangePercent || 0,
      industry: data.industry || data.sector || "Technology",
      description: data.description || data.longBusinessSummary || "",
      metrics: {
        performance: createMetricObject(data.metrics?.performance || 50, {
          revenueGrowth: data.metrics?.revenueGrowth || 0,
          profitMargin: data.metrics?.profitMargin || 0,
          returnOnCapital: data.metrics?.returnOnEquity || 0,
        }),
        stability: createMetricObject(data.metrics?.stability || 50, {
          volatility: data.metrics?.volatility || data.beta || 1,
          beta: data.metrics?.beta || data.beta || 1,
          dividendConsistency: "Moderate",
        }),
        value: createMetricObject(data.metrics?.value || 50, {
          peRatio: data.metrics?.peRatio || data.trailingPE || 15,
          pbRatio: data.metrics?.pbRatio || data.priceToBook || 3,
          dividendYield: data.metrics?.dividendYield || data.dividendYield || 0,
        }),
        momentum: createMetricObject(data.metrics?.momentum || 50, {
          threeMonthReturn: data.metrics?.threeMonthReturn || 0,
          relativePerformance: data.metrics?.relativePerformance || 0,
          rsi: data.metrics?.rsi || 50,
        }),
      },
      chartData: data.chartData || [],
      predictedPrice: data.targetMeanPrice || data.price * 1.1,
      returnYear: ((data.targetMeanPrice || data.price * 1.1) / data.price - 1) * 100,
      quality: data.metrics?.quality || "Medium",
      synopsis: {
        price: `${data.name || data.symbol} is currently priced at $${data.price.toFixed(2)}, with a ${data.change >= 0 ? 'rise' : 'drop'} of ${Math.abs(data.changePercent).toFixed(2)}% today.`,
        company: data.description?.substring(0, 150) + "..." || `${data.name || data.symbol} is a company in the ${data.industry || 'technology'} sector.`,
        role: `This stock is typically considered a ${data.metrics?.stability > 70 ? 'stable' : data.metrics?.performance > 70 ? 'growth' : 'balanced'} investment.`,
      }
    };
  }
}

// Create a singleton instance
export const jsonStockService = new JsonStockService();