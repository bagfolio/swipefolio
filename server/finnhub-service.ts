import axios from 'axios';
import { db } from './db';
import { stockCache } from '../shared/schema';
import { eq, sql } from 'drizzle-orm';
// Using Yahoo Finance API directly
import * as finnhub from 'finnhub';
// Using Yahoo Finance API directly for stock data needs

// Configure API key
// Use the API key provided by the user
const FINNHUB_API_KEY = 'cvl4fkpr01qs0ops0kr0cvl4fkpr01qs0ops0krg';

// Configure the Finnhub client
const api_key = finnhub.ApiClient.instance.authentications['api_key'];
api_key.apiKey = FINNHUB_API_KEY;
const finnhubClient = new finnhub.DefaultApi();

// Log API key status (only first few characters for security)
if (!FINNHUB_API_KEY) {
  console.error('[Finnhub] API key is missing');
} else {
  console.log(`[Finnhub] Using API key beginning with: ${FINNHUB_API_KEY.substring(0, 5)}...`);
}

// Types for Finnhub API responses
interface QuoteResponse {
  c: number; // Current price
  d: number; // Change
  dp: number; // Percent change
  h: number; // High price of the day
  l: number; // Low price of the day
  o: number; // Open price of the day
  pc: number; // Previous close price
  t: number; // Timestamp
}

interface CompanyProfileResponse {
  country: string;
  currency: string;
  exchange: string;
  ipo: string;
  marketCapitalization: number;
  name: string;
  phone: string;
  shareOutstanding: number;
  ticker: string;
  weburl: string;
  logo: string;
  finnhubIndustry: string;
}

interface MetricsResponse {
  metric: {
    [key: string]: number | string | null;
  };
}

interface PriceTargetResponse {
  targetHigh: number;
  targetLow: number;
  targetMean: number;
  targetMedian: number;
  lastUpdated: string;
}

interface RecommendationResponse {
  buy: number;
  hold: number;
  sell: number;
  strongBuy: number;
  strongSell: number;
  period: string;
  symbol: string;
}

// Main service class
export class FinnhubService {
  // Get data from cache or API
  async getStockData(symbol: string): Promise<any> {
    try {
      // Check if we have cached data and it's fresh (less than 24 hours old)
      const cachedData = await db.select().from(stockCache).where(eq(stockCache.symbol, symbol)).limit(1);
      
      if (cachedData.length > 0) {
        const lastUpdated = new Date(cachedData[0].updatedAt).getTime();
        const now = Date.now();
        const hoursSinceUpdate = (now - lastUpdated) / (1000 * 60 * 60);
        
        // If data is fresh enough, return it
        if (hoursSinceUpdate < 24) {
          console.log(`[Finnhub] Serving cached data for ${symbol} (${hoursSinceUpdate.toFixed(2)} hours old)`);
          return JSON.parse(cachedData[0].data);
        }
      }
      
      // Otherwise fetch from API and update cache
      console.log(`[Finnhub] Fetching fresh data for ${symbol}`);
      const stockData = await this.fetchStockData(symbol);
      await this.saveToCache(symbol, stockData);
      
      return stockData;
    } catch (error) {
      console.error(`[Finnhub] Error getting stock data for ${symbol}:`, error);
      throw error;
    }
  }
  
  // Fetch stock data from Finnhub
  async fetchStockData(symbol: string): Promise<any> {
    try {
      // Check if API key is available
      if (!FINNHUB_API_KEY) {
        console.warn(`[Finnhub] API key is missing, using postgres/mock data for ${symbol}`);
        return await this.getMockData(symbol);
      }
      
      // Fetch only the quote data which works with the free tier
      console.log(`[Finnhub] Fetching quote data for ${symbol}`);
      const quote = await this.getQuote(symbol).catch(err => {
        console.warn(`[Finnhub] Error fetching quote for ${symbol}:`, err.message);
        return null;
      });
      
      // If quote failed (which is our most basic endpoint), use postgres/mock data
      if (!quote) {
        console.warn(`[Finnhub] Quote fetch failed for ${symbol}, using postgres/mock data`);
        return await this.getMockData(symbol);
      }
      
      // Try to get company profile which might work with the free tier
      const profile = await this.getCompanyProfile(symbol).catch(err => {
        console.warn(`[Finnhub] Error or no access fetching company profile for ${symbol}:`, err.message);
        return null;
      });

      // For the remaining premium endpoints, we'll use postgres/mock data as our free tier doesn't have access
      // Get postgres/mock data to fill in the missing pieces
      const backupData = await this.getMockData(symbol);
      
      // Create a structured response combining real API data with postgres/mock data
      return {
        symbol,
        quote: quote || {},
        profile: profile || {},
        metrics: backupData?.metrics || {},
        priceTarget: backupData?.priceTarget || {},
        recommendations: backupData?.recommendations || [],
        lastUpdated: new Date().toISOString(),
        partiallyMocked: true // Flag to indicate some data is from mock sources
      };
    } catch (error) {
      console.error(`[Finnhub] Error fetching data for ${symbol}:`, error);
      
      // Try to get postgres/mock data as a fallback
      console.warn(`[Finnhub] Attempting to use postgres/mock data for ${symbol}`);
      const mockData = await this.getMockData(symbol);
      
      if (mockData) {
        return mockData;
      }
      
      throw error;
    }
  }
  
  // Redirects to Yahoo Finance API instead of using mock data
  private async getMockData(symbol: string): Promise<any> {
    try {
      console.log(`[Finnhub] Yahoo Finance API will be used for ${symbol} data instead`);
      
      // Return empty object to trigger Yahoo Finance API usage
      return {
        symbol,
        quote: {},
        profile: {},
        metrics: {},
        priceTarget: {},
        recommendations: [],
        lastUpdated: new Date().toISOString(),
        yahooFinanceRedirect: true
      };
    } catch (error) {
      console.error(`[Finnhub] Error getting data for ${symbol}:`, error);
      return null;
    }
  }
  
  // Save data to cache
  async saveToCache(symbol: string, data: any): Promise<void> {
    try {
      // Insert or update cache
      await db.insert(stockCache)
        .values({
          symbol,
          data: JSON.stringify(data),
          updatedAt: new Date()
        })
        .onConflictDoUpdate({
          target: stockCache.symbol,
          set: {
            data: JSON.stringify(data),
            updatedAt: new Date()
          }
        });
      
      console.log(`[Finnhub] Cached data updated for ${symbol}`);
    } catch (error) {
      console.error(`[Finnhub] Error saving to cache for ${symbol}:`, error);
    }
  }
  
  // Helper methods for different API endpoints using official SDK
  
  async getQuote(symbol: string): Promise<QuoteResponse> {
    return new Promise((resolve, reject) => {
      finnhubClient.quote(symbol, (error, data, response) => {
        if (error) {
          console.error(`[Finnhub] Error fetching quote for ${symbol}:`, error);
          reject(error);
        } else {
          resolve(data as QuoteResponse);
        }
      });
    });
  }
  
  async getCompanyProfile(symbol: string): Promise<CompanyProfileResponse> {
    return new Promise((resolve, reject) => {
      finnhubClient.companyProfile2({ 'symbol': symbol }, (error, data, response) => {
        if (error) {
          console.error(`[Finnhub] Error fetching company profile for ${symbol}:`, error);
          reject(error);
        } else {
          resolve(data as CompanyProfileResponse);
        }
      });
    });
  }
  
  async getMetrics(symbol: string): Promise<MetricsResponse> {
    return new Promise((resolve, reject) => {
      finnhubClient.companyBasicFinancials(symbol, 'all', (error, data, response) => {
        if (error) {
          console.error(`[Finnhub] Error fetching metrics for ${symbol}:`, error);
          reject(error);
        } else {
          resolve(data as MetricsResponse);
        }
      });
    });
  }
  
  async getPriceTarget(symbol: string): Promise<PriceTargetResponse> {
    return new Promise((resolve, reject) => {
      finnhubClient.priceTarget(symbol, (error, data, response) => {
        if (error) {
          console.error(`[Finnhub] Error fetching price target for ${symbol}:`, error);
          reject(error);
        } else {
          resolve(data as PriceTargetResponse);
        }
      });
    });
  }
  
  async getRecommendations(symbol: string): Promise<RecommendationResponse[]> {
    return new Promise((resolve, reject) => {
      finnhubClient.recommendationTrends(symbol, (error, data, response) => {
        if (error) {
          console.error(`[Finnhub] Error fetching recommendations for ${symbol}:`, error);
          reject(error);
        } else {
          resolve(data as RecommendationResponse[]);
        }
      });
    });
  }
  
  // Refresh cache for a list of symbols
  async refreshCache(symbols: string[]): Promise<{ success: string[], failures: string[] }> {
    const results = {
      success: [] as string[],
      failures: [] as string[]
    };
    
    // Process symbols one at a time to avoid API rate limits
    for (const symbol of symbols) {
      try {
        console.log(`[Finnhub] Refreshing cache for ${symbol}`);
        const data = await this.fetchStockData(symbol);
        await this.saveToCache(symbol, data);
        results.success.push(symbol);
      } catch (error) {
        console.error(`[Finnhub] Failed to refresh cache for ${symbol}:`, error);
        results.failures.push(symbol);
      }
      
      // Sleep for 250ms between requests to avoid hitting rate limits
      await new Promise(resolve => setTimeout(resolve, 250));
    }
    
    return results;
  }
  
  // Clear cache
  async clearCache(): Promise<void> {
    try {
      await db.delete(stockCache);
      console.log('[Finnhub] Cache cleared');
    } catch (error) {
      console.error('[Finnhub] Error clearing cache:', error);
      throw error;
    }
  }
}

// Export a singleton instance
export const finnhubService = new FinnhubService();