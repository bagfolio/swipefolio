/**
 * pg-stock-service.ts
 * 
 * This service handles loading stock data from our PostgreSQL database.
 * It replaces the JSON file-based stock service.
 */

import { pool } from '../db';

/**
 * Service for accessing PostgreSQL stock data
 */
export class PgStockService {
  private stockSymbols: string[] = [];
  private initialized: boolean = false;

  constructor() {
    console.log('PgStockService initialized');
  }
  
  /**
   * Get analyst recommendations for a stock ticker
   * @param ticker The stock ticker symbol
   * @returns Analyst recommendations data in columnar format
   */
  async getRecommendations(ticker: string): Promise<any> {
    try {
      // Get detailed data that contains recommendations
      const result = await pool.query(`
        SELECT ticker, recommendations 
        FROM stock_data 
        WHERE ticker = $1
      `, [ticker]);
      
      if (result.rows.length === 0 || !result.rows[0].recommendations) {
        console.warn(`No recommendations found for '${ticker}' in PostgreSQL`);
        return null;
      }
      
      // Extract the recommendations data
      let recommendations = result.rows[0].recommendations;
      
      // Parse the JSON if it's a string
      if (typeof recommendations === 'string') {
        try {
          recommendations = JSON.parse(recommendations);
        } catch (e) {
          console.warn(`Error parsing recommendations JSON for ${ticker}:`, e);
          return null;
        }
      }
      
      // If recommendations are in an array format, convert to columnar format
      if (Array.isArray(recommendations)) {
        // Convert from array of objects to columnar format
        const columnarData: Record<string, any[]> = {};
        
        // Initialize all possible keys
        if (recommendations.length > 0) {
          const keys = Object.keys(recommendations[0]);
          keys.forEach(key => {
            columnarData[key] = [];
          });
          
          // Fill columnar arrays
          recommendations.forEach(rec => {
            keys.forEach(key => {
              columnarData[key].push(rec[key]);
            });
          });
          
          return {
            success: true,
            data: columnarData
          };
        }
      } else {
        // Recommendations already in columnar format
        return {
          success: true,
          data: recommendations
        };
      }
      
      return {
        success: false,
        error: "Invalid recommendations data format"
      };
    } catch (error) {
      console.error(`Error fetching recommendations for '${ticker}' from PostgreSQL:`, error);
      return {
        success: false,
        error: "Failed to fetch recommendations data"
      };
    }
  }

  /**
   * Load stock data from the database and initialize cache
   */
  async loadStockData(): Promise<boolean> {
    try {
      console.log('Loading stock data from PostgreSQL...');
      
      // Fetch all available stock symbols
      const symbolsResult = await pool.query(`
        SELECT ticker FROM stocks ORDER BY ticker
      `);
      
      if (symbolsResult.rows.length > 0) {
        this.stockSymbols = symbolsResult.rows.map(row => row.ticker);
        this.initialized = true;
        
        console.log(`PostgreSQL stock data initialization complete: ${this.stockSymbols.length} stocks available`);
        return true;
      } else {
        console.warn('No stocks found in the database');
        return false;
      }
    } catch (error) {
      console.error('Error loading stock data from PostgreSQL:', error);
      return false;
    }
  }

  /**
   * Get all available stock symbols
   */
  public async getAvailableSymbols(): Promise<string[]> {
    // If we've already loaded the symbols, return them from memory
    if (this.initialized && this.stockSymbols.length > 0) {
      return this.stockSymbols;
    }
    
    try {
      const result = await pool.query(`
        SELECT ticker FROM stocks ORDER BY ticker
      `);
      
      this.stockSymbols = result.rows.map(row => row.ticker);
      return this.stockSymbols;
    } catch (error) {
      console.error('Error getting available symbols from PostgreSQL:', error);
      return [];
    }
  }

  /**
   * Get stock data from PostgreSQL
   */
  public async getStockData(symbol: string): Promise<any> {
    try {
      // Get basic stock info
      const basicResult = await pool.query(`
        SELECT * FROM stocks WHERE ticker = $1
      `, [symbol]);
      
      if (basicResult.rows.length === 0) {
        console.warn(`Stock ${symbol} not found in database`);
        return null;
      }
      
      const stockData = basicResult.rows[0];
      
      // Get detailed stock data
      const detailedResult = await pool.query(`
        SELECT * FROM stock_data WHERE ticker = $1
      `, [symbol]);
      
      if (detailedResult.rows.length > 0) {
        const detailedData = detailedResult.rows[0];
        
        // Format JSON fields
        const formattedData: Record<string, any> = { ...detailedData };
        
        // Parse JSON strings into objects
        const jsonFields = [
          'closing_history', 'dividends', 'income_statement', 'balance_sheet',
          'cash_flow', 'recommendations', 'earnings_dates', 'earnings_history',
          'earnings_trend', 'upgrades_downgrades', 'financial_data',
          'institutional_holders', 'major_holders'
        ];
        
        for (const field of jsonFields) {
          if (detailedData[field]) {
            try {
              if (typeof detailedData[field] === 'string') {
                formattedData[field] = JSON.parse(detailedData[field]);
              }
            } catch (e) {
              console.warn(`Error parsing JSON for ${field} in ${symbol}:`, e);
            }
          }
        }
        
        // Merge detailed data, excluding ticker
        Object.keys(formattedData).forEach(key => {
          if (key !== 'ticker') {
            stockData[key] = formattedData[key];
          }
        });
      }
      
      // Format the response to match our expected structure
      return this.formatStockData(stockData);
    } catch (error) {
      console.error(`Error fetching data for ${symbol} from PostgreSQL:`, error);
      return null;
    }
  }

  /**
   * Get stocks by sector
   */
  public async getStocksByIndustry(industry: string): Promise<any[]> {
    try {
      const result = await pool.query(`
        SELECT * FROM stocks 
        WHERE industry = $1
        ORDER BY market_cap DESC
      `, [industry]);
      
      return result.rows.map(stock => this.formatStockData(stock));
    } catch (error) {
      console.error(`Error fetching stocks for industry ${industry}:`, error);
      return [];
    }
  }

  /**
   * Get stocks by sector
   */
  public async getStocksBySector(sector: string): Promise<any[]> {
    try {
      const result = await pool.query(`
        SELECT * FROM stocks 
        WHERE sector = $1
        ORDER BY market_cap DESC
      `, [sector]);
      
      return result.rows.map(stock => this.formatStockData(stock));
    } catch (error) {
      console.error(`Error fetching stocks for sector ${sector}:`, error);
      return [];
    }
  }

  /**
   * Get top dividend stocks
   */
  public async getTopDividendStocks(limit: number = 10): Promise<any[]> {
    try {
      const result = await pool.query(`
        SELECT * FROM stocks 
        WHERE dividend_yield IS NOT NULL 
        ORDER BY dividend_yield DESC 
        LIMIT $1
      `, [limit]);
      
      return result.rows.map(stock => this.formatStockData(stock));
    } catch (error) {
      console.error('Error fetching top dividend stocks:', error);
      return [];
    }
  }

  /**
   * Get stocks with recent analyst upgrades
   */
  public async getStocksWithUpgrades(): Promise<any[]> {
    try {
      const result = await pool.query(`
        SELECT s.*, sd.upgrades_downgrades
        FROM stocks s
        JOIN stock_data sd ON s.ticker = sd.ticker
        WHERE sd.upgrades_downgrades IS NOT NULL
        ORDER BY s.ticker
      `);
      
      return result.rows.map(stock => this.formatStockData(stock));
    } catch (error) {
      console.error('Error fetching stocks with upgrades:', error);
      return [];
    }
  }

  /**
   * Get price history data for a specific ticker and time period
   * @param ticker The stock ticker symbol
   * @param period The time period ('5D', '1W', '1M', '3M', '6M', '1Y', '5Y')
   */
  async getPriceHistory(ticker: string, period: string = '1M'): Promise<any> {
    try {
      console.log(`[PG-STOCK] Getting price history for ${ticker} (${period})`);
      
      // Get historical price data from stock_data table - this is our primary source
      const result = await pool.query(`
        SELECT ticker, closing_history
        FROM stock_data 
        WHERE ticker = $1
      `, [ticker]);
      
      if (result.rows.length === 0 || !result.rows[0].closing_history) {
        console.warn(`No price history found for '${ticker}' in PostgreSQL`);
        return null;
      }
      
      // Use closing_history as our data source
      let priceData = result.rows[0].closing_history;
      
      // Parse JSON if it's a string
      if (typeof priceData === 'string') {
        try {
          priceData = JSON.parse(priceData);
        } catch (e) {
          console.warn(`Error parsing closing_history JSON for ${ticker}:`, e);
          return null;
        }
      }
      
      // First check if period-specific data exists
      if (priceData && priceData[period]) {
        console.log(`[PG-STOCK] Found period-specific data for ${ticker} (${period})`);
        
        // Check if it's an array (older format) or object with dates/prices (newer format)
        if (Array.isArray(priceData[period])) {
          return {
            ticker: ticker,
            period: period,
            prices: priceData[period],
            lastUpdated: new Date().toISOString()
          };
        } else if (priceData[period].prices && priceData[period].dates) {
          return {
            ticker: ticker,
            period: period,
            prices: priceData[period].prices,
            dates: priceData[period].dates,
            lastUpdated: new Date().toISOString()
          };
        }
      }
      
      // If no period-specific data, check for raw price data
      if (priceData && priceData.Close && priceData.Date) {
        console.log(`[PG-STOCK] Using raw price data for ${ticker}`);
        
        // Filter based on period
        const dates = priceData.Date;
        const prices = priceData.Close;
        
        // Convert period to days
        let daysToInclude = 30; // Default to 1M
        
        if (period === '1D') daysToInclude = 1;
        else if (period === '5D') daysToInclude = 5;
        else if (period === '1W') daysToInclude = 7;
        else if (period === '1M') daysToInclude = 30;
        else if (period === '3M') daysToInclude = 90;
        else if (period === '6M') daysToInclude = 180;
        else if (period === '1Y') daysToInclude = 365;
        else if (period === '5Y') daysToInclude = 365 * 5;
        else if (period === 'MAX') daysToInclude = 365 * 20; // Just use all available data
        
        // Take the most recent X days worth of data
        const filteredPrices = prices.slice(0, Math.min(daysToInclude, prices.length));
        const filteredDates = dates.slice(0, Math.min(daysToInclude, dates.length));
        
        // Ensure we have valid data
        if (filteredPrices.length === 0 || filteredDates.length === 0) {
          console.warn(`No valid price history data found for ${ticker}`);
          return null;
        }

        // Format prices as numbers and ensure dates are strings
        const formattedPrices = filteredPrices.map((p: any) => typeof p === 'string' ? parseFloat(p) : p);
        const formattedDates = filteredDates.map((d: any) => d.toString());

        return {
          ticker: ticker,
          period: period,
          prices: formattedPrices.reverse(), // Reverse to get chronological order
          dates: formattedDates.reverse(),   // Reverse to get chronological order
          source: 'postgresql',
          lastUpdated: new Date().toISOString()
        };
      }
      
      console.log(`No usable price history data found for '${ticker}' in stock_data`);
      return null;
    } catch (error) {
      console.error(`Error fetching price history for '${ticker}' (${period}) from PostgreSQL:`, error);
      return null;
    }
  }

  /**
   * Format the stock data for consistent response structure
   */
  private formatStockData(data: any): any {
    // Extract the latest price from closing_history if available
    let currentPrice = data.current_price || 0;
    let previousClose = data.previous_close || 0;
    let priceChange = data.price_change || 0;
    let priceChangePercent = data.price_change_percent || 0;
    let dayHigh = data.day_high || 0;
    let dayLow = data.day_low || 0;
    
    // If we have closing_history data, use it for more accurate pricing
    if (data.closing_history) {
      try {
        const closingHistory = typeof data.closing_history === 'string' 
          ? JSON.parse(data.closing_history) 
          : data.closing_history;
          
        // Check if we have Close prices array
        if (closingHistory.Close && Array.isArray(closingHistory.Close) && closingHistory.Close.length > 0) {
          // Use the most recent closing price as current price
          currentPrice = closingHistory.Close[0] || currentPrice;
          
          // If we have at least two data points, calculate daily change
          if (closingHistory.Close.length > 1) {
            previousClose = closingHistory.Close[1] || previousClose;
            priceChange = currentPrice - previousClose;
            priceChangePercent = previousClose > 0 ? (priceChange / previousClose) * 100 : 0;
          }
          
          // Get day high and low (for simplicity, use 5% up/down from current as estimation)
          // In real system, this would come from the actual daily high/low
          dayHigh = currentPrice * 1.02;
          dayLow = currentPrice * 0.98;
        }
      } catch (e) {
        console.warn(`Error processing closing_history for ${data.ticker}:`, e);
      }
    }
    
    // Create a base structure with data from DB or our calculated values
    const formattedData: any = {
      symbol: data.ticker,
      name: data.company_name || data.ticker,
      price: currentPrice,
      change: priceChange,
      changePercent: priceChangePercent,
      previousClose: previousClose,
      dayHigh: dayHigh,
      dayLow: dayLow,
      volume: data.volume || 0,
      averageVolume: data.average_volume || 0,
      marketCap: data.market_cap || 0,
      beta: data.beta || 0,
      peRatio: data.pe_ratio || 0,
      eps: data.eps || 0,
      industry: data.industry || "",
      sector: data.sector || "",
      dividendYield: data.dividend_yield || 0,
      targetHighPrice: data.target_high_price || 0,
      targetLowPrice: data.target_low_price || 0,
      targetMeanPrice: data.target_mean_price || 0,
      recommendationKey: data.recommendation_key || "",
      description: data.description || "",
    };

    // Calculate metrics similar to how we did in the JSON service
    const profitMargin = data.profit_margin || 0;
    const returnOnEquity = data.return_on_equity || 0;
    const debtToEquity = data.debt_to_equity || 0;
    const revenueGrowth = data.revenue_growth || 0;

    // Add metrics
    formattedData.metrics = {
      performance: this.calculatePerformanceScore(data),
      stability: this.calculateStabilityScore(data),
      value: this.calculateValueScore(data),
      momentum: this.calculateMomentumScore(data),
      quality: this.calculateQualityRating(data),
      profitMargin: profitMargin * 100,
      returnOnEquity: returnOnEquity * 100,
      debtToEquity: debtToEquity,
      revenueGrowth: revenueGrowth * 100,
    };

    // Add history data if available
    if (data.closing_history) {
      formattedData.history = data.closing_history;
    }

    return formattedData;
  }

  /**
   * Calculate performance score based on financials
   */
  private calculatePerformanceScore(data: any): number {
    let score = 50; // Base score
    
    const profitMargins = data.profit_margin || 0;
    const returnOnEquity = data.return_on_equity || 0;
    const revenueGrowth = data.revenue_growth || 0;
    
    // Adjust based on profit margins
    if (profitMargins > 0.2) score += 10;
    else if (profitMargins > 0.1) score += 5;
    else if (profitMargins < 0) score -= 10;
    
    // Adjust based on return on equity
    if (returnOnEquity > 0.2) score += 10;
    else if (returnOnEquity > 0.1) score += 5;
    else if (returnOnEquity < 0) score -= 5;
    
    // Adjust based on revenue growth
    if (revenueGrowth > 0.1) score += 10;
    else if (revenueGrowth > 0.05) score += 5;
    else if (revenueGrowth < 0) score -= 5;
    
    // Cap score between 0-100
    return Math.max(0, Math.min(100, score));
  }
  
  /**
   * Calculate stability score
   */
  private calculateStabilityScore(data: any): number {
    let score = 50; // Base score
    
    const beta = data.beta || 1;
    const debtToEquity = data.debt_to_equity || 0;
    const dividendYield = data.dividend_yield || 0;
    
    // Adjust based on beta (volatility)
    if (beta < 0.8) score += 10;
    else if (beta < 1) score += 5;
    else if (beta > 1.5) score -= 10;
    
    // Adjust based on debt to equity
    if (debtToEquity < 0.3) score += 10;
    else if (debtToEquity < 0.6) score += 5;
    else if (debtToEquity > 1) score -= 10;
    
    // Adjust based on dividend yield (if applicable)
    if (dividendYield > 0.03) score += 10;
    else if (dividendYield > 0.015) score += 5;
    
    // Cap score between 0-100
    return Math.max(0, Math.min(100, score));
  }
  
  /**
   * Calculate value score
   */
  private calculateValueScore(data: any): number {
    let score = 50; // Base score
    
    const peRatio = data.pe_ratio || 0;
    const pbRatio = data.pb_ratio || 0;
    const targetMeanPrice = data.target_mean_price || 0;
    const currentPrice = data.current_price || 0;
    
    // Adjust based on P/E ratio
    if (peRatio > 0) { // Only consider positive P/E ratios
      if (peRatio < 15) score += 10;
      else if (peRatio < 25) score += 5;
      else if (peRatio > 40) score -= 10;
    }
    
    // Adjust based on P/B ratio
    if (pbRatio > 0) { // Only consider positive P/B ratios
      if (pbRatio < 1.5) score += 10;
      else if (pbRatio < 3) score += 5;
      else if (pbRatio > 5) score -= 10;
    }
    
    // Adjust based on current price vs target price
    if (targetMeanPrice > 0 && currentPrice > 0) {
      const priceDiff = (targetMeanPrice / currentPrice) - 1;
      if (priceDiff > 0.2) score += 10;
      else if (priceDiff > 0.1) score += 5;
      else if (priceDiff < -0.1) score -= 10;
    }
    
    // Cap score between 0-100
    return Math.max(0, Math.min(100, score));
  }
  
  /**
   * Calculate momentum score
   */
  private calculateMomentumScore(data: any): number {
    let score = 50; // Base score
    
    const priceChangePercent = data.price_change_percent || 0;
    const earningsGrowth = data.earnings_growth || 0;
    
    // Adjust based on recent price change
    if (priceChangePercent > 5) score += 10;
    else if (priceChangePercent > 2) score += 5;
    else if (priceChangePercent < -5) score -= 10;
    
    // Adjust based on earnings growth
    if (earningsGrowth > 0.2) score += 10;
    else if (earningsGrowth > 0.1) score += 5;
    else if (earningsGrowth < 0) score -= 10;
    
    // Cap score between 0-100
    return Math.max(0, Math.min(100, score));
  }
  
  /**
   * Calculate quality rating (High, Medium, Low)
   */
  private calculateQualityRating(data: any): string {
    // Calculate average of performance-related metrics
    const metrics = [
      data.profit_margin || 0,
      data.return_on_equity || 0,
      data.revenue_growth || 0,
      data.earnings_growth || 0
    ];
    
    const avgMetric = metrics.reduce((sum, val) => sum + val, 0) / metrics.length;
    
    // Determine quality rating
    if (avgMetric > 0.15) return "High";
    if (avgMetric > 0.05) return "Medium";
    return "Low";
  }

  /**
   * Refresh the cache from the database
   */
  async refreshCache(): Promise<{ success: string[], failures: string[] }> {
    try {
      await this.loadStockData();
      return { success: this.stockSymbols, failures: [] };
    } catch (error) {
      console.error('Error refreshing PostgreSQL cache:', error);
      return { success: [], failures: ['Database error'] };
    }
  }
}

export const pgStockService = new PgStockService();