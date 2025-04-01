import * as fs from 'fs';
import * as path from 'path';
import { log } from '../vite';
import { getMockStockData } from '../../shared/mock-stocks';

/**
 * Service for accessing JSON stock data files
 */
export class JsonStockService {
  private basePath: string;
  
  constructor() {
    // Set path to JSON stock data files
    this.basePath = path.join(process.cwd(), 'client', 'src', 'data');
    log(`JsonStockService initialized with path: ${this.basePath}`, 'json-stock');
  }
  
  /**
   * Check if a stock JSON file exists
   */
  public fileExists(symbol: string): boolean {
    const filePath = path.join(this.basePath, `${symbol}.json`);
    return fs.existsSync(filePath);
  }
  
  /**
   * Get available stock symbols
   */
  public getAvailableSymbols(): string[] {
    try {
      // Get all JSON files in the directory
      const files = fs.readdirSync(this.basePath).filter(file => file.endsWith('.json'));
      // Extract symbol names without the .json extension
      return files.map(file => path.basename(file, '.json'));
    } catch (error) {
      console.error('Error getting available symbols from JSON files:', error);
      return [];
    }
  }
  
  /**
   * Get stock data from JSON file
   */
  public getStockData(symbol: string): any {
    try {
      const filePath = path.join(this.basePath, `${symbol}.json`);
      
      // Check if the file exists
      if (!fs.existsSync(filePath)) {
        log(`JSON file for ${symbol} not found. Falling back to mock data.`, 'json-stock');
        return getMockStockData(symbol);
      }
      
      // Read the JSON file
      const rawData = fs.readFileSync(filePath, 'utf8');
      
      // Fix common JSON parsing issues before parsing
      const cleanedData = this.cleanJsonString(rawData);
      
      // Parse the cleaned JSON
      const data = JSON.parse(cleanedData);
      
      log(`Successfully loaded JSON data for ${symbol}`, 'json-stock');
      
      // Format the data in a consistent way
      return this.formatStockData(symbol, data);
    } catch (error) {
      console.error(`Error getting JSON stock data for ${symbol}:`, error);
      
      // Fall back to mock data
      log(`Error accessing JSON file for ${symbol}. Falling back to mock data.`, 'json-stock');
      return getMockStockData(symbol);
    }
  }
  
  /**
   * Clean JSON string to fix common parsing issues like NaN values
   */
  private cleanJsonString(jsonString: string): string {
    // Replace NaN, Infinity, and undefined with valid JSON values
    // These are not valid in JSON but sometimes appear in JavaScript objects
    return jsonString
      .replace(/:\s*NaN\s*([,}])/g, ': 0$1')         // Replace NaN with 0
      .replace(/:\s*Infinity\s*([,}])/g, ': 0$1')    // Replace Infinity with 0
      .replace(/:\s*-Infinity\s*([,}])/g, ': 0$1')   // Replace -Infinity with 0
      .replace(/:\s*undefined\s*([,}])/g, ': null$1'); // Replace undefined with null
  }
  
  /**
   * Format the stock data for consistent response structure
   */
  private formatStockData(symbol: string, data: any): any {
    // Extract relevant data from the Yahoo Finance JSON structure
    // and format it to match our expected API response format
    
    const info = data.info || {};
    
    // Extract history for charts
    const history = data.history || [];
    
    return {
      symbol: symbol,
      name: info.longName || info.shortName || info.displayName || symbol,
      price: info.regularMarketPrice || info.currentPrice || 0,
      change: info.regularMarketChange || 0,
      changePercent: info.regularMarketChangePercent || 0,
      previousClose: info.regularMarketPreviousClose || 0,
      dayHigh: info.regularMarketDayHigh || 0,
      dayLow: info.regularMarketDayLow || 0,
      volume: info.regularMarketVolume || 0,
      averageVolume: info.averageVolume || 0,
      marketCap: info.marketCap || 0,
      beta: info.beta || 0,
      peRatio: info.trailingPE || 0,
      eps: info.epsTrailingTwelveMonths || 0,
      industry: info.industry || info.sector || "",
      sector: info.sector || "",
      dividendYield: info.dividendYield ? (info.dividendYield * 100) : 0,
      targetHighPrice: info.targetHighPrice || 0,
      targetLowPrice: info.targetLowPrice || 0,
      targetMeanPrice: info.targetMeanPrice || 0,
      recommendationKey: info.recommendationKey || "",
      description: info.longBusinessSummary || "",
      
      // Calculated metrics
      metrics: {
        performance: this.calculatePerformanceScore(info),
        stability: this.calculateStabilityScore(info),
        value: this.calculateValueScore(info),
        momentum: this.calculateMomentumScore(info, history),
        quality: this.calculateQualityRating(info),
        profitMargin: (info.profitMargins || 0) * 100,
        returnOnEquity: (info.returnOnEquity || 0) * 100,
        debtToEquity: info.debtToEquity || 0,
        revenueGrowth: (info.revenueGrowth || 0) * 100,
        earningsGrowth: (info.earningsGrowth || 0) * 100
      },
      
      // Include history data for charts
      history: history.slice(0, 90) // Limit to 90 days for charts
    };
  }
  
  /**
   * Calculate performance score based on financials
   */
  private calculatePerformanceScore(info: any): number {
    let score = 50; // Base score
    
    // Adjust based on profit margins
    if (info.profitMargins > 0.2) score += 10;
    else if (info.profitMargins > 0.1) score += 5;
    else if (info.profitMargins < 0) score -= 10;
    
    // Adjust based on return on equity
    if (info.returnOnEquity > 0.2) score += 10;
    else if (info.returnOnEquity > 0.1) score += 5;
    else if (info.returnOnEquity < 0) score -= 5;
    
    // Adjust based on revenue growth
    if (info.revenueGrowth > 0.1) score += 10;
    else if (info.revenueGrowth > 0.05) score += 5;
    else if (info.revenueGrowth < 0) score -= 5;
    
    // Cap score between 0-100
    return Math.max(0, Math.min(100, score));
  }
  
  /**
   * Calculate stability score
   */
  private calculateStabilityScore(info: any): number {
    let score = 50; // Base score
    
    // Adjust based on beta (volatility)
    if (info.beta < 0.8) score += 10;
    else if (info.beta < 1) score += 5;
    else if (info.beta > 1.5) score -= 10;
    
    // Adjust based on debt to equity
    if (info.debtToEquity < 0.3) score += 10;
    else if (info.debtToEquity < 0.6) score += 5;
    else if (info.debtToEquity > 1) score -= 10;
    
    // Adjust based on dividend yield (if applicable)
    if (info.dividendYield > 0.03) score += 10;
    else if (info.dividendYield > 0.015) score += 5;
    
    // Cap score between 0-100
    return Math.max(0, Math.min(100, score));
  }
  
  /**
   * Calculate value score
   */
  private calculateValueScore(info: any): number {
    let score = 50; // Base score
    
    // Adjust based on P/E ratio
    if (info.trailingPE < 15) score += 10;
    else if (info.trailingPE < 25) score += 5;
    else if (info.trailingPE > 40) score -= 10;
    
    // Adjust based on P/B ratio
    if (info.priceToBook < 1.5) score += 10;
    else if (info.priceToBook < 3) score += 5;
    else if (info.priceToBook > 5) score -= 10;
    
    // Adjust based on current price vs target price
    if (info.targetMeanPrice && info.regularMarketPrice) {
      const priceDiff = (info.targetMeanPrice / info.regularMarketPrice) - 1;
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
  private calculateMomentumScore(info: any, history: any[]): number {
    let score = 50; // Base score
    
    // Adjust based on recent price change
    if (info.regularMarketChangePercent > 5) score += 10;
    else if (info.regularMarketChangePercent > 2) score += 5;
    else if (info.regularMarketChangePercent < -5) score -= 10;
    
    // Adjust based on 50-day average vs current price
    if (info.fiftyDayAverage && info.regularMarketPrice) {
      const diff = (info.regularMarketPrice / info.fiftyDayAverage) - 1;
      if (diff > 0.1) score += 10;
      else if (diff > 0.05) score += 5;
      else if (diff < -0.1) score -= 10;
    }
    
    // Adjust based on earnings growth
    if (info.earningsGrowth > 0.2) score += 10;
    else if (info.earningsGrowth > 0.1) score += 5;
    else if (info.earningsGrowth < 0) score -= 10;
    
    // Cap score between 0-100
    return Math.max(0, Math.min(100, score));
  }
  
  /**
   * Calculate quality rating (High, Medium, Low)
   */
  private calculateQualityRating(info: any): string {
    // Calculate average of performance-related metrics
    const metrics = [
      info.profitMargins || 0,
      info.returnOnEquity || 0,
      (info.revenueGrowth || 0),
      (info.earningsGrowth || 0)
    ];
    
    const avgMetric = metrics.reduce((sum, val) => sum + val, 0) / metrics.length;
    
    // Determine quality rating
    if (avgMetric > 0.15) return "High";
    if (avgMetric > 0.05) return "Medium";
    return "Low";
  }
}

export const jsonStockService = new JsonStockService();