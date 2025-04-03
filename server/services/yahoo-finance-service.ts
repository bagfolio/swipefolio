import yahooFinance from 'yahoo-finance2';
import { log } from '../vite';

/**
 * Yahoo Finance Service
 * 
 * A service for fetching financial data from Yahoo Finance API
 */
export class YahooFinanceService {
  private static instance: YahooFinanceService;
  private cache: Map<string, { data: any, timestamp: number }> = new Map();
  private readonly CACHE_TTL = 15 * 60 * 1000; // 15 minutes cache

  /**
   * Get the singleton instance
   */
  public static getInstance(): YahooFinanceService {
    if (!YahooFinanceService.instance) {
      YahooFinanceService.instance = new YahooFinanceService();
    }
    return YahooFinanceService.instance;
  }

  constructor() {
    log('Yahoo Finance Service initialized', 'yahoo-finance');
  }

  /**
   * Search for stocks, ETFs, and other financial instruments
   * @param query Search query
   * @returns Search results
   */
  async searchStocks(query: string): Promise<any> {
    try {
      const cacheKey = `search:${query}`;
      const cached = this.getFromCache(cacheKey);
      if (cached) return cached;

      const results = await yahooFinance.search(query);
      
      this.saveToCache(cacheKey, results);
      return results;
    } catch (error) {
      console.error('Error searching stocks:', error);
      throw new Error(`Failed to search stocks: ${(error as Error).message}`);
    }
  }

  /**
   * Get current quote data for a symbol
   * @param symbol Stock symbol (e.g., 'AAPL')
   * @returns Quote data
   */
  async getQuote(symbol: string): Promise<any> {
    try {
      const cacheKey = `quote:${symbol}`;
      const cached = this.getFromCache(cacheKey);
      if (cached) return cached;

      const quote = await yahooFinance.quote(symbol);
      
      this.saveToCache(cacheKey, quote);
      return quote;
    } catch (error) {
      console.error(`Error fetching quote for ${symbol}:`, error);
      throw new Error(`Failed to fetch quote for ${symbol}: ${(error as Error).message}`);
    }
  }

  /**
   * Get historical price data for a symbol
   * @param symbol Stock symbol (e.g., 'AAPL')
   * @param period1 Start date (e.g., '2023-01-01')
   * @param period2 End date (e.g., '2023-12-31')
   * @param interval Data interval ('1d', '1wk', '1mo')
   * @returns Historical price data
   */
  async getHistoricalData(
    symbol: string, 
    period1: string, 
    period2: string, 
    interval: '1d' | '1wk' | '1mo' = '1d'
  ): Promise<any[]> {
    try {
      const cacheKey = `historical:${symbol}:${period1}:${period2}:${interval}`;
      const cached = this.getFromCache(cacheKey);
      if (cached) return cached;

      const historical = await yahooFinance.historical(symbol, {
        period1,
        period2,
        interval
      });
      
      this.saveToCache(cacheKey, historical);
      return historical;
    } catch (error) {
      console.error(`Error fetching historical data for ${symbol}:`, error);
      throw new Error(`Failed to fetch historical data for ${symbol}: ${(error as Error).message}`);
    }
  }

  /**
   * Get detailed company data
   * @param symbol Stock symbol (e.g., 'AAPL')
   * @param modules Data modules to fetch
   * @returns Company data
   */
  async getCompanyData(
    symbol: string, 
    modules: ("assetProfile" | "financialData" | "summaryDetail" | "quoteType" | 
              "price" | "balanceSheetHistory" | "calendarEvents")[] = ['assetProfile', 'financialData', 'summaryDetail']
  ): Promise<any> {
    try {
      const cacheKey = `company:${symbol}:${modules.join(',')}`;
      const cached = this.getFromCache(cacheKey);
      if (cached) return cached;

      // Check for valid module names according to Yahoo Finance API
      const validModules = modules.filter(m => [
        'assetProfile', 'financialData', 'summaryDetail', 'quoteType', 'price',
        'balanceSheetHistory', 'balanceSheetHistoryQuarterly', 'calendarEvents',
        'cashflowStatementHistory', 'cashflowStatementHistoryQuarterly', 'defaultKeyStatistics',
        'earnings', 'earningsHistory', 'earningsTrend', 'fundOwnership', 'fundPerformance',
        'fundProfile', 'incomeStatementHistory', 'incomeStatementHistoryQuarterly', 'indexTrend',
        'industryTrend', 'insiderHolders', 'insiderTransactions', 'institutionOwnership',
        'majorDirectHolders', 'majorHoldersBreakdown', 'netSharePurchaseActivity',
        'recommendationTrend', 'secFilings', 'sectorTrend', 'summaryProfile',
        'topHoldings', 'upgradeDowngradeHistory'
      ].includes(m));

      // Default to basic modules if none are valid
      if (!validModules.length) {
        validModules.push('assetProfile', 'financialData', 'summaryDetail');
      }

      const data = await yahooFinance.quoteSummary(symbol, { modules: validModules });
      
      this.saveToCache(cacheKey, data);
      return data;
    } catch (error) {
      console.error(`Error fetching company data for ${symbol}:`, error);
      throw new Error(`Failed to fetch company data for ${symbol}: ${(error as Error).message}`);
    }
  }

  /**
   * Get recommended stocks similar to the provided symbol
   * @param symbol Stock symbol (e.g., 'AAPL')
   * @returns Recommended stocks
   */
  async getRecommendations(symbol: string): Promise<any> {
    try {
      const cacheKey = `recommendations:${symbol}`;
      const cached = this.getFromCache(cacheKey);
      if (cached) return cached;

      const recommendations = await yahooFinance.recommendationsBySymbol(symbol);
      
      this.saveToCache(cacheKey, recommendations);
      return recommendations;
    } catch (error) {
      console.error(`Error fetching recommendations for ${symbol}:`, error);
      throw new Error(`Failed to fetch recommendations for ${symbol}: ${(error as Error).message}`);
    }
  }

  /**
   * Get trending symbols in a specific region
   * @param region Region code (e.g., 'US')
   * @returns Trending symbols
   */
  async getTrendingSymbols(region: string = 'US'): Promise<any> {
    try {
      const cacheKey = `trending:${region}`;
      const cached = this.getFromCache(cacheKey);
      if (cached) return cached;

      const trending = await yahooFinance.trendingSymbols(region);
      
      this.saveToCache(cacheKey, trending);
      return trending;
    } catch (error) {
      console.error(`Error fetching trending symbols for ${region}:`, error);
      throw new Error(`Failed to fetch trending symbols for ${region}: ${(error as Error).message}`);
    }
  }

  /**
   * Get options chain data for a symbol
   * @param symbol Stock symbol (e.g., 'AAPL')
   * @returns Options data
   */
  async getOptions(symbol: string): Promise<any> {
    try {
      const cacheKey = `options:${symbol}`;
      const cached = this.getFromCache(cacheKey);
      if (cached) return cached;

      const options = await yahooFinance.options(symbol, {});
      
      this.saveToCache(cacheKey, options);
      return options;
    } catch (error) {
      console.error(`Error fetching options for ${symbol}:`, error);
      throw new Error(`Failed to fetch options for ${symbol}: ${(error as Error).message}`);
    }
  }

  /**
   * Get market chart data
   * @param symbol Stock symbol (e.g., 'AAPL')
   * @param interval Time interval (e.g., '1d', '1wk', '1mo')
   * @param range Time range (e.g., '1d', '5d', '1mo', '3mo', '6mo', '1y', '5y', 'max')
   * @returns Chart data
   */
  async getChartData(
    symbol: string, 
    interval: "1d" | "1wk" | "1mo" = "1d", 
    range: string = "1mo"
  ): Promise<any> {
    try {
      const cacheKey = `chart:${symbol}:${interval}:${range}`;
      const cached = this.getFromCache(cacheKey);
      if (cached) return cached;

      // Yahoo Finance chart API doesn't directly support range parameter in the way we're using it
      // Instead, we need to use period1 (start date) and period2 (end date)
      let period1 = new Date();
      const period2 = new Date(); // end date is now
      
      // For intraday data, we need to use different interval formats
      let queryInterval = interval;
      
      // Calculate start date based on range and adjust interval for intraday data
      switch(range) {
        case '1d':
          period1 = new Date(period2.getTime() - 24 * 60 * 60 * 1000);
          // For 1 day, use 5-minute intervals
          queryInterval = '5m';
          break;
        case '5d':
          period1 = new Date(period2.getTime() - 5 * 24 * 60 * 60 * 1000);
          // For 5 days, use 15-minute or 30-minute intervals
          queryInterval = '30m';
          break;
        case '1mo':
          period1 = new Date(period2.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '3mo':
          period1 = new Date(period2.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        case '6mo':
          period1 = new Date(period2.getTime() - 180 * 24 * 60 * 60 * 1000);
          break;
        case '1y':
          period1 = new Date(period2.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
        case '5y':
          period1 = new Date(period2.getTime() - 5 * 365 * 24 * 60 * 60 * 1000);
          break;
        default:
          period1 = new Date(period2.getTime() - 30 * 24 * 60 * 60 * 1000); // default to 1 month
      }

      // Query parameters for Yahoo Finance chart API
      const queryOptions = {
        period1,
        period2,
        interval: queryInterval as any // Use the appropriate interval based on timeframe
      };

      console.log(`Fetching chart data for ${symbol} with range: ${range}, interval: ${queryInterval}`);
      const chart = await yahooFinance.chart(symbol, queryOptions);
      
      this.saveToCache(cacheKey, chart);
      return chart;
    } catch (error) {
      console.error(`Error fetching chart data for ${symbol}:`, error);
      throw new Error(`Failed to fetch chart data for ${symbol}: ${(error as Error).message}`);
    }
  }

  /**
   * Format stock data for frontend consumption
   * @param symbol Stock symbol
   * @returns Formatted stock data
   */
  async getFormattedStockData(symbol: string): Promise<any> {
    try {
      // Fetch all relevant data in parallel
      const [quote, companyData, historicalData] = await Promise.all([
        this.getQuote(symbol),
        this.getCompanyData(symbol),
        this.getHistoricalData(
          symbol, 
          new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 year ago
          new Date().toISOString().split('T')[0]
        )
      ]);

      // Extract relevant financial metrics
      const { assetProfile, financialData, summaryDetail } = companyData;
      
      // Format the response
      return {
        symbol,
        name: quote.longName || quote.shortName,
        price: quote.regularMarketPrice,
        change: quote.regularMarketChange,
        changePercent: quote.regularMarketChangePercent,
        currency: quote.currency,
        marketCap: quote.marketCap,
        volume: quote.regularMarketVolume,
        avgVolume: quote.averageDailyVolume3Month,
        high: quote.regularMarketDayHigh,
        low: quote.regularMarketDayLow,
        open: quote.regularMarketOpen,
        previousClose: quote.regularMarketPreviousClose,
        industry: assetProfile?.industry,
        sector: assetProfile?.sector,
        description: assetProfile?.longBusinessSummary,
        website: assetProfile?.website,
        metrics: {
          performance: this.calculatePerformanceScore(quote, historicalData),
          stability: this.calculateStabilityScore(quote, financialData, summaryDetail),
          value: this.calculateValueScore(quote, financialData, summaryDetail),
          momentum: this.calculateMomentumScore(quote, historicalData),
          revenueGrowth: financialData?.revenueGrowth || 0,
          profitMargin: financialData?.profitMargins || 0,
          peRatio: quote.trailingPE || financialData?.trailingPE || 0,
          pbRatio: quote.priceToBook || financialData?.priceToBook || 0,
          dividendYield: quote.dividendYield || summaryDetail?.dividendYield || 0,
          debtToEquity: financialData?.debtToEquity || 0,
          returnOnEquity: financialData?.returnOnEquity || 0,
          beta: summaryDetail?.beta || 0,
          analystRating: financialData?.recommendationMean || 0,
        },
        historicalData: historicalData.map(item => ({
          date: item.date,
          open: item.open,
          high: item.high,
          low: item.low,
          close: item.close,
          volume: item.volume
        }))
      };
    } catch (error) {
      console.error(`Error formatting stock data for ${symbol}:`, error);
      throw new Error(`Failed to format stock data for ${symbol}: ${(error as Error).message}`);
    }
  }

  /**
   * Calculate performance score based on revenue growth, profit margin, and ROE
   */
  private calculatePerformanceScore(quote: any, historicalData: any[]): number {
    try {
      // Simple algorithm to calculate performance based on historical data
      if (!historicalData.length) return 50;
      
      const oldestPrice = historicalData[0].close;
      const newestPrice = historicalData[historicalData.length - 1].close;
      const percentChange = ((newestPrice - oldestPrice) / oldestPrice) * 100;
      
      // Normalize to a 0-100 score
      const score = Math.min(Math.max(50 + percentChange, 0), 100);
      return Math.round(score);
    } catch (error) {
      console.error('Error calculating performance score:', error);
      return 50; // Default score
    }
  }

  /**
   * Calculate stability score based on beta, dividend yield, and debt-to-equity
   */
  private calculateStabilityScore(quote: any, financialData: any, summaryDetail: any): number {
    try {
      const beta = summaryDetail?.beta || 1;
      const dividendYield = (summaryDetail?.dividendYield || 0) * 100;
      const debtToEquity = financialData?.debtToEquity || 0;
      
      // Beta closer to 1 is more stable (beta score: 0-40)
      const betaScore = Math.max(40 - Math.abs(beta - 1) * 20, 0);
      
      // Higher dividend yield is good for stability (dividend score: 0-30)
      const dividendScore = Math.min(dividendYield * 10, 30);
      
      // Lower debt-to-equity is more stable (debt score: 0-30)
      const debtScore = Math.max(30 - (debtToEquity / 10), 0);
      
      // Combined score
      const score = betaScore + dividendScore + debtScore;
      return Math.round(score);
    } catch (error) {
      console.error('Error calculating stability score:', error);
      return 50; // Default score
    }
  }

  /**
   * Calculate value score based on P/E ratio, P/B ratio, and upside potential
   */
  private calculateValueScore(quote: any, financialData: any, summaryDetail: any): number {
    try {
      const pe = quote.trailingPE || financialData?.trailingPE || 20;
      const pb = quote.priceToBook || financialData?.priceToBook || 3;
      const targetMedianPrice = financialData?.targetMedianPrice || quote.regularMarketPrice;
      const currentPrice = quote.regularMarketPrice;
      
      // Lower P/E is better for value (P/E score: 0-40)
      const peScore = Math.max(40 - (pe / 5), 0);
      
      // Lower P/B is better for value (P/B score: 0-30)
      const pbScore = Math.max(30 - (pb * 5), 0);
      
      // Higher upside potential is better (upside score: 0-30)
      const upsidePercent = ((targetMedianPrice - currentPrice) / currentPrice) * 100;
      const upsideScore = Math.min(Math.max(upsidePercent, 0), 30);
      
      // Combined score
      const score = peScore + pbScore + upsideScore;
      return Math.round(score);
    } catch (error) {
      console.error('Error calculating value score:', error);
      return 50; // Default score
    }
  }

  /**
   * Calculate momentum score based on relative performance
   */
  private calculateMomentumScore(quote: any, historicalData: any[]): number {
    try {
      if (historicalData.length < 20) return 50;
      
      // Calculate 1-week, 1-month, and 3-month momentum
      const latestPrice = historicalData[historicalData.length - 1].close;
      const oneWeekAgoIdx = Math.max(historicalData.length - 6, 0);
      const oneMonthAgoIdx = Math.max(historicalData.length - 21, 0);
      const threeMonthAgoIdx = Math.max(historicalData.length - 63, 0);
      
      const oneWeekAgoPrice = historicalData[oneWeekAgoIdx].close;
      const oneMonthAgoPrice = historicalData[oneMonthAgoIdx].close;
      const threeMonthAgoPrice = historicalData[threeMonthAgoIdx].close;
      
      const oneWeekChange = ((latestPrice - oneWeekAgoPrice) / oneWeekAgoPrice) * 100;
      const oneMonthChange = ((latestPrice - oneMonthAgoPrice) / oneMonthAgoPrice) * 100;
      const threeMonthChange = ((latestPrice - threeMonthAgoPrice) / threeMonthAgoPrice) * 100;
      
      // Weight recent momentum more heavily
      const weightedScore = (oneWeekChange * 0.5) + (oneMonthChange * 0.3) + (threeMonthChange * 0.2);
      
      // Normalize to a 0-100 score
      const score = Math.min(Math.max(50 + (weightedScore * 2), 0), 100);
      return Math.round(score);
    } catch (error) {
      console.error('Error calculating momentum score:', error);
      return 50; // Default score
    }
  }

  /**
   * Get from cache if not expired
   */
  private getFromCache(key: string): any {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }
    return null;
  }

  /**
   * Save to cache with timestamp
   */
  private saveToCache(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }
}

// Export a singleton instance
export const yahooFinanceService = YahooFinanceService.getInstance();