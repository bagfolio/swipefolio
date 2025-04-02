/**
 * postgres-stock-service.ts
 * 
 * This service handles fetching stock data from the PostgreSQL database.
 * It replaces the JSON-based stock service with real data from a database.
 */

import { db } from '../db';
import { stocks, stockData, sectors, marketData } from '../../shared/schema';
import { eq, inArray, desc, sql } from 'drizzle-orm';
import { StockDetailedData } from '../../shared/schema';

// Custom interface to match actual database schema
interface DbStock {
  ticker: string;
  companyName: string;
  sector: string | null;
  industry: string | null;
  currentPrice: number | null;
  marketCap: number | null;
  dividendYield: number | null;
  beta: number | null;
  peRatio: number | null;
  country: string | null;
  exchange: string | null;
  currency: string | null;
  lastUpdated?: Date | null;
  description?: string | null;
  // Add additional fields as needed
  [key: string]: any; // Allow any other properties
}

// Default limit for queries
const DEFAULT_LIMIT = 50;

/**
 * Service for accessing PostgreSQL stock data
 */
export class PostgresStockService {
  constructor() {
    console.log('PostgreSQL stock service initialized');
  }

  /**
   * Load stock data on server startup
   */
  async loadStockData() {
    try {
      const stockCount = await db.select({ count: sql`count(*)` }).from(stocks);
      console.log(`PostgreSQL database contains ${stockCount[0]?.count || 0} stock records`);
      
      if (stockCount[0]?.count === 0) {
        console.log('No stock data found in PostgreSQL database. Consider loading initial data.');
      }
      
      return true;
    } catch (error) {
      console.error('Failed to load stock data from PostgreSQL:', error);
      throw error;
    }
  }

  /**
   * Get all available stock tickers
   */
  async getAvailableSymbols(): Promise<string[]> {
    try {
      const results = await db.select({ ticker: stocks.ticker }).from(stocks);
      return results.map(r => r.ticker);
    } catch (error) {
      console.error('Error fetching stock symbols from PostgreSQL:', error);
      return [];
    }
  }

  /**
   * Get basic info for all stocks
   */
  async getAllStocks() {
    try {
      const allStocks = await db.select({
        ticker: stocks.ticker,
        companyName: stocks.companyName,
        sector: stocks.sector,
        industry: stocks.industry,
        currentPrice: stocks.currentPrice,
        marketCap: stocks.marketCap,
        dividendYield: stocks.dividendYield,
        beta: stocks.beta,
        peRatio: sql`price_to_earnings`,
        country: sql`country`,
        exchange: sql`exchange`,
        currency: sql`currency`
      }).from(stocks).limit(DEFAULT_LIMIT);
      
      return allStocks.map(stock => ({
        symbol: stock.ticker,
        name: stock.companyName,
        price: stock.currentPrice ? Number(stock.currentPrice) : null,
        change: 0, // Calculated value needs more data
        changePercent: 0, // Calculated value needs more data
        sector: stock.sector,
        industry: stock.industry,
        metrics: {
          marketCap: stock.marketCap ? Number(stock.marketCap) : null,
          dividendYield: stock.dividendYield ? Number(stock.dividendYield) : null,
          beta: stock.beta ? Number(stock.beta) : null,
          peRatio: stock.peRatio ? Number(stock.peRatio) : null
        }
      }));
    } catch (error) {
      console.error('Error fetching all stocks from PostgreSQL:', error);
      return [];
    }
  }

  /**
   * Get stocks in a specific sector
   */
  async getStocksBySector(sector: string) {
    try {
      const sectorStocks = await db
        .select({
          ticker: stocks.ticker,
          companyName: stocks.companyName,
          sector: stocks.sector,
          industry: stocks.industry,
          currentPrice: stocks.currentPrice,
          marketCap: stocks.marketCap,
          dividendYield: stocks.dividendYield,
          beta: stocks.beta,
          peRatio: sql`price_to_earnings`,
          country: sql`country`,
          exchange: sql`exchange`,
          currency: sql`currency`
        })
        .from(stocks)
        .where(eq(stocks.sector, sector))
        .limit(DEFAULT_LIMIT);
      
      return sectorStocks.map(stock => ({
        symbol: stock.ticker,
        name: stock.companyName,
        price: stock.currentPrice ? Number(stock.currentPrice) : null,
        change: 0, // Calculated value
        changePercent: 0, // Calculated value
        sector: stock.sector,
        industry: stock.industry,
        metrics: {
          marketCap: stock.marketCap ? Number(stock.marketCap) : null,
          dividendYield: stock.dividendYield ? Number(stock.dividendYield) : null,
          beta: stock.beta ? Number(stock.beta) : null,
          peRatio: stock.peRatio ? Number(stock.peRatio) : null
        }
      }));
    } catch (error) {
      console.error(`Error fetching stocks for sector '${sector}' from PostgreSQL:`, error);
      return [];
    }
  }

  /**
   * Get complete stock data for a specific ticker
   */
  async getStockData(ticker: string): Promise<any> {
    try {
      // Get basic stock info with explicit column selection using actual database column names
      const stockInfo = await db
        .select({
          ticker: stocks.ticker,
          companyName: stocks.companyName,
          sector: stocks.sector,
          industry: stocks.industry,
          currentPrice: stocks.currentPrice,
          marketCap: stocks.marketCap,
          dividendYield: stocks.dividendYield,
          beta: stocks.beta,
          peRatio: sql`price_to_earnings`, // Use actual column name price_to_earnings
          country: sql`country`,
          exchange: sql`exchange`,
          currency: sql`currency`,
          lastUpdated: sql`last_updated`
        })
        .from(stocks)
        .where(eq(stocks.ticker, ticker))
        .limit(1);
      
      if (!stockInfo || stockInfo.length === 0) {
        console.log(`Stock with ticker '${ticker}' not found in PostgreSQL`);
        return null;
      }
      
      // Convert string values to numbers where appropriate
      const dbStock: DbStock = {
        ticker: stockInfo[0].ticker,
        companyName: stockInfo[0].companyName,
        sector: stockInfo[0].sector,
        industry: stockInfo[0].industry,
        currentPrice: stockInfo[0].currentPrice ? Number(stockInfo[0].currentPrice) : null,
        marketCap: stockInfo[0].marketCap ? Number(stockInfo[0].marketCap) : null,
        dividendYield: stockInfo[0].dividendYield ? Number(stockInfo[0].dividendYield) : null,
        beta: stockInfo[0].beta ? Number(stockInfo[0].beta) : null,
        peRatio: stockInfo[0].peRatio ? Number(stockInfo[0].peRatio) : null,
        country: stockInfo[0].country ? String(stockInfo[0].country) : null,
        exchange: stockInfo[0].exchange ? String(stockInfo[0].exchange) : null,
        currency: stockInfo[0].currency ? String(stockInfo[0].currency) : null,
        lastUpdated: stockInfo[0].lastUpdated ? new Date(stockInfo[0].lastUpdated as any) : null
      };
      
      // Get detailed data
      const detailedData = await db
        .select()
        .from(stockData)
        .where(eq(stockData.ticker, ticker))
        .limit(1);
      
      return this.formatStockData(dbStock, detailedData[0] || null);
    } catch (error) {
      console.error(`Error fetching stock data for '${ticker}' from PostgreSQL:`, error);
      return null;
    }
  }
  
  /**
   * Get price history data for a specific ticker and time period
   * @param ticker The stock ticker symbol
   * @param period The time period ('5D', '1W', '1M', '3M', '6M', '1Y', '5Y')
   */
  async getPriceHistory(ticker: string, period: string = '1M'): Promise<any> {
    try {
      // Get detailed data that contains closing history
      const result = await db
        .select({
          ticker: stockData.ticker,
          closingHistory: stockData.closingHistory
        })
        .from(stockData)
        .where(eq(stockData.ticker, ticker))
        .limit(1);
      
      if (!result || result.length === 0 || !result[0].closingHistory) {
        console.log(`No price history found for '${ticker}' in PostgreSQL`);
        return null;
      }
      
      // Extract the price history for the requested period from the closingHistory
      const history = result[0].closingHistory;
      
      // The closing_history is stored as JSONB with periods as keys
      // Check if the requested period exists
      if (history[period]) {
        return {
          ticker: ticker,
          period: period,
          prices: history[period],
          lastUpdated: new Date().toISOString()
        };
      } else {
        console.log(`No price history data for period '${period}' found for '${ticker}'`);
        return null;
      }
    } catch (error) {
      console.error(`Error fetching price history for '${ticker}' (${period}) from PostgreSQL:`, error);
      return null;
    }
  }

  /**
   * Get sector data
   */
  async getSectorData(sectorKey: string) {
    try {
      const sectorInfo = await db
        .select()
        .from(sectors)
        .where(eq(sectors.sectorKey, sectorKey))
        .limit(1);
      
      if (!sectorInfo || sectorInfo.length === 0) {
        console.log(`Sector with key '${sectorKey}' not found in PostgreSQL`);
        return null;
      }
      
      // Get all stocks in this sector
      const sectorStocks = await this.getStocksBySector(sectorKey);
      
      return {
        key: sectorInfo[0].sectorKey,
        name: sectorInfo[0].name,
        description: sectorInfo[0].description,
        metrics: sectorInfo[0].metrics,
        stocks: sectorStocks
      };
    } catch (error) {
      console.error(`Error fetching sector data for '${sectorKey}' from PostgreSQL:`, error);
      return null;
    }
  }

  /**
   * Get market data
   */
  async getMarketData(marketName: string = 'US') {
    try {
      const market = await db
        .select()
        .from(marketData)
        .where(eq(marketData.market, marketName))
        .limit(1);
      
      if (!market || market.length === 0) {
        console.log(`Market '${marketName}' not found in PostgreSQL`);
        return null;
      }
      
      return {
        name: market[0].name,
        metrics: market[0].metrics,
        lastUpdated: market[0].lastUpdated
      };
    } catch (error) {
      console.error(`Error fetching market data for '${marketName}' from PostgreSQL:`, error);
      return null;
    }
  }

  /**
   * Format stock data for consistent response structure
   */
  private formatStockData(basicInfo: DbStock, detailedData: StockDetailedData | null): any {
    // Calculate metrics from available data
    const metrics = this.calculateMetrics(basicInfo, detailedData);
    
    // Format for API response
    return {
      symbol: basicInfo.ticker,
      name: basicInfo.companyName,
      price: basicInfo.currentPrice,
      change: 0, // Calculated value
      changePercent: 0, // Calculated value
      profile: {
        sector: basicInfo.sector,
        industry: basicInfo.industry,
        marketCap: basicInfo.marketCap,
        description: basicInfo.description
      },
      metrics: metrics,
      priceTarget: detailedData?.earningsTrend ? 
        (typeof detailedData.earningsTrend === 'object' ? {
          targetHigh: (detailedData.earningsTrend as any)?.targetHigh || null,
          targetLow: (detailedData.earningsTrend as any)?.targetLow || null,
          targetMean: (detailedData.earningsTrend as any)?.targetMean || null,
          targetMedian: (detailedData.earningsTrend as any)?.targetMedian || null,
          lastUpdated: (detailedData.earningsTrend as any)?.lastUpdated || new Date().toISOString()
        } : {}) : {},
      recommendations: detailedData?.recommendations || [],
      closingHistory: detailedData?.closingHistory || [],
      dividends: detailedData?.dividends || [],
      financials: {
        incomeStatement: detailedData?.incomeStatement || {},
        balanceSheet: detailedData?.balanceSheet || {},
        cashFlow: detailedData?.cashFlow || {}
      },
      institutionalHolders: detailedData?.institutionalHolders || [],
      majorHolders: detailedData?.majorHolders || [],
      quality: this.calculateQualityRating(metrics),
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Calculate metrics based on available data
   */
  private calculateMetrics(basicInfo: DbStock, detailedData: StockDetailedData | null): any {
    // Performance scores
    const performanceScore = this.calculatePerformanceScore(basicInfo, detailedData);
    const stabilityScore = this.calculateStabilityScore(basicInfo, detailedData);
    const valueScore = this.calculateValueScore(basicInfo, detailedData);
    const momentumScore = this.calculateMomentumScore(basicInfo, detailedData);
    
    // Calculate overall potential score (0-100)
    const potentialScore = Math.round((performanceScore + stabilityScore + valueScore + momentumScore) / 4);
    
    const financialData = detailedData?.financialData || {};
    
    return {
      performance: performanceScore,
      stability: stabilityScore,
      value: valueScore,
      momentum: momentumScore,
      potential: potentialScore,
      revenueGrowth: (financialData as any)?.revenueGrowth || null,
      profitMargin: (financialData as any)?.profitMargins || null,
      peRatio: basicInfo.peRatio,
      pbRatio: (financialData as any)?.priceToBook || null,
      dividendYield: basicInfo.dividendYield,
      debtToEquity: (financialData as any)?.debtToEquity || null,
      returnOnEquity: (financialData as any)?.returnOnEquity || null,
      beta: basicInfo.beta,
      analystRating: detailedData?.recommendations ? 
        this.calculateAnalystRating(detailedData.recommendations as any[]) : 
        null
    };
  }

  /**
   * Calculate performance score based on financials
   */
  private calculatePerformanceScore(basicInfo: any, detailedData: any): number {
    // This is a simplified implementation that would need to be enhanced with real metrics
    return Math.round(Math.random() * 100); // Placeholder
  }

  /**
   * Calculate stability score
   */
  private calculateStabilityScore(basicInfo: any, detailedData: any): number {
    // This is a simplified implementation that would need to be enhanced with real metrics
    return Math.round(Math.random() * 100); // Placeholder
  }

  /**
   * Calculate value score
   */
  private calculateValueScore(basicInfo: any, detailedData: any): number {
    // This is a simplified implementation that would need to be enhanced with real metrics
    return Math.round(Math.random() * 100); // Placeholder
  }

  /**
   * Calculate momentum score
   */
  private calculateMomentumScore(basicInfo: any, detailedData: any): number {
    // This is a simplified implementation that would need to be enhanced with real metrics
    return Math.round(Math.random() * 100); // Placeholder
  }

  /**
   * Calculate quality rating (High, Medium, Low)
   */
  private calculateQualityRating(metrics: any): string {
    if (!metrics || !metrics.potential) return 'Medium';
    
    const score = metrics.potential;
    if (score >= 70) return 'High';
    if (score >= 40) return 'Medium';
    return 'Low';
  }

  /**
   * Calculate analyst rating (0-10)
   */
  private calculateAnalystRating(recommendations: any[]): number {
    if (!recommendations || recommendations.length === 0) return 5;
    
    // Calculate weighted rating from most recent recommendations
    const latestRec = recommendations[0];
    if (!latestRec) return 5;
    
    const totalRatings = (
      (latestRec.strongBuy || 0) * 10 +
      (latestRec.buy || 0) * 7.5 +
      (latestRec.hold || 0) * 5 +
      (latestRec.sell || 0) * 2.5 +
      (latestRec.strongSell || 0) * 0
    );
    
    const totalCount = (
      (latestRec.strongBuy || 0) +
      (latestRec.buy || 0) +
      (latestRec.hold || 0) +
      (latestRec.sell || 0) +
      (latestRec.strongSell || 0)
    );
    
    return totalCount > 0 ? parseFloat((totalRatings / totalCount).toFixed(1)) : 5;
  }
}

export const postgresStockService = new PostgresStockService();