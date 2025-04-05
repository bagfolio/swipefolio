import yahooFinance from 'yahoo-finance2';
import { Request, Response } from 'express';

// Define interfaces based on Yahoo Finance API
interface YahooNewsItem {
  title: string;
  publisher: string;
  link: string;
  providerPublishTime: number;
  thumbnail?: {
    resolutions: Array<{
      url: string;
      width: number;
      height: number;
      tag: string;
    }>;
  };
  type: string;
  relatedTickers?: string[];
}

// Recommendation interface based on Yahoo Finance API
interface YahooRecommendation {
  buy: number;
  hold: number;
  sell: number;
  strongBuy: number;
  strongSell: number;
  period: string;
  symbol: string;
}

// Modified recommendation interface with additional calculated metrics
interface AnalystRecommendation extends YahooRecommendation {
  total: number;
  buyPercentage: number;
  sellPercentage: number;
  holdPercentage: number;
  consensus: 'buy' | 'sell' | 'hold' | 'neutral';
  lastUpdated: string;
  averageRating: number; // 1-5 scale (1=Strong Sell, 5=Strong Buy)
}

// Analyst upgrade/downgrade history item
interface UpgradeHistoryItem {
  firm: string;
  toGrade: string;
  fromGrade: string;
  action: 'upgrade' | 'downgrade' | 'maintain' | 'init' | 'reiterated';
  date: string;
  epochGradeDate: number;
}

class YahooFinanceService {
  /**
   * Initialize the Yahoo Finance service
   */
  constructor() {
    console.log('[yahoo-finance] Yahoo Finance Service initialized');
  }

  /**
   * Fetch chart data for a stock symbol
   */
  async getChartData(symbol: string, range: string = '1mo', interval: string = '1d') {
    try {
      console.log(`Fetching chart data for ${symbol} with range: ${range}, interval: ${interval}`);
      
      // For intraday data (1d, 5d), use different interval settings
      if (range === '1d' || range === '5d') {
        // For intraday data, we need more granular intervals
        // Use '5m' (5-minute) intervals for 1d and '60m' (60-minute) for 5d
        const intradayInterval = range === '1d' ? '5m' : '60m';
        console.log(`Using intraday interval ${intradayInterval} for ${range} range`);
        
        const result = await yahooFinance.chart(symbol, {
          period1: this.getDateFromRange(range),
          interval: intradayInterval as any,
          includePrePost: true,
          events: 'div,split', // Include dividend and split events
        });
        
        return result;
      } else {
        // For non-intraday data, use the regular interval
        const validInterval = this.getValidInterval(interval);
        
        const result = await yahooFinance.chart(symbol, {
          period1: this.getDateFromRange(range),
          interval: validInterval,
          includePrePost: true,
          events: 'div,split', // Include dividend and split events
        });
        
        return result;
      }
    } catch (error) {
      console.error(`Error fetching chart data for ${symbol}:`, error);
      throw error;
    }
  }

  /**
   * Convert user-provided interval to Yahoo Finance supported interval
   */
  private getValidInterval(interval: string): '1d' | '1wk' | '1mo' | '1m' | '2m' | '5m' | '15m' | '30m' | '60m' | '90m' | '1h' | '5d' | '3mo' {
    // Map of common intervals to supported Yahoo Finance intervals
    const intervalMap: Record<string, '1d' | '1wk' | '1mo' | '1m' | '2m' | '5m' | '15m' | '30m' | '60m' | '90m' | '1h' | '5d' | '3mo'> = {
      '1d': '1d',
      '1wk': '1wk',
      '1mo': '1mo',
      '1m': '1m',
      '2m': '2m',
      '5m': '5m',
      '15m': '15m',
      '30m': '30m',
      '60m': '60m',
      '90m': '90m',
      '1h': '1h',
      '5d': '5d',
      '3mo': '3mo'
    };
    
    return intervalMap[interval] || '1d';
  }

  /**
   * Fetch analyst recommendations for a stock symbol
   * Uses the quoteSummary endpoint with recommendationTrend module
   */
  async getRecommendations(symbol: string): Promise<AnalystRecommendation | null> {
    try {
      console.log(`Fetching analyst recommendations for ${symbol}`);
      
      // Get the recommendation trend from quoteSummary
      const quoteSummary = await yahooFinance.quoteSummary(symbol, {
        modules: ['recommendationTrend']
      });
      
      if (!quoteSummary?.recommendationTrend?.trend || 
          !Array.isArray(quoteSummary.recommendationTrend.trend) || 
          quoteSummary.recommendationTrend.trend.length === 0) {
        console.warn(`No recommendation trends found for ${symbol}`);
        return null;
      }
      
      // Get the most recent recommendation trend
      const latestRec = quoteSummary.recommendationTrend.trend[0];
      
      // Calculate total recommendations
      const total = latestRec.strongBuy + latestRec.buy + latestRec.hold + latestRec.sell + latestRec.strongSell;
      
      if (total === 0) {
        console.warn(`No analyst counts available for ${symbol}`);
        return null;
      }
      
      // Calculate percentages
      const buyPercentage = ((latestRec.strongBuy + latestRec.buy) / total) * 100;
      const sellPercentage = ((latestRec.strongSell + latestRec.sell) / total) * 100;
      const holdPercentage = (latestRec.hold / total) * 100;
      
      // Calculate average rating (1=Strong Sell, 5=Strong Buy)
      const averageRating = (
        (latestRec.strongBuy * 5) + 
        (latestRec.buy * 4) + 
        (latestRec.hold * 3) + 
        (latestRec.sell * 2) + 
        (latestRec.strongSell * 1)
      ) / total;
      
      // Determine consensus
      let consensus: 'buy' | 'sell' | 'hold' | 'neutral' = 'neutral';
      
      if (buyPercentage > 60) {
        consensus = 'buy';
      } else if (sellPercentage > 60) {
        consensus = 'sell';
      } else if (holdPercentage > 60) {
        consensus = 'hold';
      } else if (buyPercentage > sellPercentage && buyPercentage > holdPercentage) {
        consensus = 'buy';
      } else if (sellPercentage > buyPercentage && sellPercentage > holdPercentage) {
        consensus = 'sell';
      } else if (holdPercentage > buyPercentage && holdPercentage > sellPercentage) {
        consensus = 'hold';
      }
      
      // Format the period date exactly as received from Yahoo Finance
      // We'll use the date directly without any fallbacks to ensure data integrity
      let lastUpdated = 'Unknown';
      if (latestRec.period) {
        try {
          const dateObj = new Date(latestRec.period);
          
          // Format date using a standard format
          lastUpdated = dateObj.toLocaleDateString(undefined, { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
          });
          
          // Log the raw date for debugging
          console.log(`Recommendation period date: raw=${latestRec.period}, formatted=${lastUpdated}`);
        } catch (err) {
          console.error('Error formatting recommendation date:', err);
          // Keep as "Unknown" if there's an error, don't substitute
        }
      }
      
      // Return the processed recommendation data
      return {
        ...latestRec,
        symbol: symbol,
        total,
        buyPercentage,
        sellPercentage,
        holdPercentage,
        consensus,
        lastUpdated,
        averageRating
      };
    } catch (error) {
      console.error(`Error fetching recommendations for ${symbol}:`, error);
      return null;
    }
  }
  
  /**
   * Fetch news data for a stock symbol
   * Uses quoteSummary with 'assetProfile' module and additional search
   */
  async getNewsData(symbol: string, count: number = 5) {
    try {
      console.log(`Fetching news data for ${symbol}, count: ${count}`);
      
      // First get the quote to confirm symbol
      const quote = await yahooFinance.quote(symbol);
      
      if (!quote) {
        throw new Error(`No quote data found for ${symbol}`);
      }
      
      // Get news through a search for the symbol
      // This gives us the most recent news articles related to the symbol
      const searchResults = await yahooFinance.search(symbol);
      
      // Extract news items from the search results
      let newsItems: YahooNewsItem[] = [];
      
      if (searchResults && searchResults.news && Array.isArray(searchResults.news)) {
        // Convert the news items to our YahooNewsItem format
        newsItems = searchResults.news.map(item => {
          // Convert the providerPublishTime to a timestamp
          let publishTime: number;
          if (typeof item.providerPublishTime === 'number') {
            publishTime = item.providerPublishTime;
          } else if (typeof item.providerPublishTime === 'string') {
            publishTime = new Date(item.providerPublishTime).getTime() / 1000; // Convert to seconds to match Yahoo API format
          } else {
            publishTime = Math.floor(Date.now() / 1000); // Convert to seconds to match Yahoo API format
          }
          
          return {
            title: item.title || `News about ${symbol}`,
            publisher: item.publisher || 'Yahoo Finance',
            link: item.link || `https://finance.yahoo.com/quote/${symbol}`,
            providerPublishTime: publishTime,
            thumbnail: item.thumbnail,
            type: item.type || 'article',
            relatedTickers: item.relatedTickers || [symbol]
          };
        });
      }
      
      // Also try to get news from the quoteSummary with assetProfile if search didn't yield results
      if (newsItems.length === 0) {
        try {
          const summary = await yahooFinance.quoteSummary(symbol, {
            modules: ['assetProfile']
          });
          
          if (summary.assetProfile && summary.assetProfile.companyOfficers) {
            // Create a news item about company officers
            newsItems.push({
              title: `Leadership Team at ${quote.shortName || symbol}`,
              publisher: "Yahoo Finance",
              link: `https://finance.yahoo.com/quote/${symbol}/profile`,
              providerPublishTime: Date.now() / 1000,
              type: "article",
              relatedTickers: [symbol]
            });
          }
        } catch (summaryError) {
          console.warn(`Could not fetch quoteSummary for ${symbol}:`, summaryError);
          // Continue with whatever news we have
        }
      }
      
      // If we still don't have news, add at least one general item
      if (newsItems.length === 0) {
        newsItems.push({
          title: `Market data for ${quote.shortName || symbol}`,
          publisher: "Yahoo Finance",
          link: `https://finance.yahoo.com/quote/${symbol}`,
          providerPublishTime: Date.now() / 1000,
          type: "article",
          relatedTickers: [symbol]
        });
      }
      
      // Sort news by publish time (newest first) and limit to requested count
      newsItems.sort((a, b) => b.providerPublishTime - a.providerPublishTime);
      
      return {
        items: newsItems.slice(0, count),
        symbol: symbol,
        name: quote.shortName || quote.longName || symbol
      };
    } catch (error) {
      console.error(`Error fetching news for ${symbol}:`, error);
      throw error;
    }
  }
  
  /**
   * Fetch analyst upgrade/downgrade history for a stock symbol
   * Uses the quoteSummary endpoint with upgradeDowngradeHistory module
   */
  async getUpgradeHistory(symbol: string): Promise<UpgradeHistoryItem[] | null> {
    try {
      console.log(`Fetching upgrade/downgrade history for ${symbol}`);
      
      // Get the upgrade/downgrade history from quoteSummary
      const quoteSummary = await yahooFinance.quoteSummary(symbol, {
        modules: ['upgradeDowngradeHistory']
      });
      
      if (!quoteSummary?.upgradeDowngradeHistory?.history || 
          !Array.isArray(quoteSummary.upgradeDowngradeHistory.history) || 
          quoteSummary.upgradeDowngradeHistory.history.length === 0) {
        console.warn(`No upgrade/downgrade history found for ${symbol}`);
        return null;
      }
      
      // Map and process the history items
      const historyItems = quoteSummary.upgradeDowngradeHistory.history.map(item => {
        // Ensure epochGradeDate is a number
        const epochGradeDate = typeof item.epochGradeDate === 'number' ? 
          item.epochGradeDate : 
          (item.epochGradeDate ? Number(item.epochGradeDate) : 0);
        // Determine action type based on from/to grades
        let action: 'upgrade' | 'downgrade' | 'maintain' | 'init' | 'reiterated' = 'maintain';
        
        if (!item.fromGrade) {
          action = 'init'; // Initial coverage
        } else if (item.toGrade === item.fromGrade) {
          action = 'reiterated'; // Same rating
        } else {
          // Map common analyst ratings to a numeric scale
          const ratingMap: Record<string, number> = {
            'strong buy': 5,
            'buy': 4,
            'overweight': 4,
            'outperform': 4,
            'neutral': 3,
            'hold': 3,
            'equal-weight': 3,
            'market perform': 3,
            'underperform': 2,
            'underweight': 2,
            'sell': 1,
            'strong sell': 0
          };
          
          // Get numeric values for the from/to grades
          const fromValue = ratingMap[(item.fromGrade || '').toLowerCase()] || 3;
          const toValue = ratingMap[(item.toGrade || '').toLowerCase()] || 3;
          
          if (toValue > fromValue) {
            action = 'upgrade';
          } else if (toValue < fromValue) {
            action = 'downgrade';
          }
        }
        
        // Format the date exactly as received from Yahoo Finance
        // The epochGradeDate is provided directly by Yahoo Finance API, so we use it as-is
        // without any fallbacks to ensure data integrity
        let date = 'Unknown';
        if (epochGradeDate) {
          try {
            // Convert timestamp (seconds) to milliseconds for JavaScript Date
            const timestamp = epochGradeDate * 1000;
            const dateObj = new Date(timestamp);
            
            // Format the date string using standard formatting
            date = dateObj.toLocaleDateString(undefined, { 
              year: 'numeric', 
              month: 'short', 
              day: 'numeric' 
            });
            
            // Log the raw date information for debugging
            console.log(`Analyst rating date for ${item.firm}: raw=${epochGradeDate}, formatted=${date}`);
          } catch (err) {
            console.error(`Error formatting date for ${item.firm}:`, err);
            // Keep the default "Unknown" in case of error
          }
        }
        
        return {
          firm: item.firm || 'Unknown Firm',
          toGrade: item.toGrade || 'Not Specified',
          fromGrade: item.fromGrade || 'New Coverage',
          action,
          date,
          epochGradeDate
        };
      });
      
      // Sort by date (newest first)
      return historyItems.sort((a, b) => Number(b.epochGradeDate) - Number(a.epochGradeDate));
    } catch (error) {
      console.error(`Error fetching upgrade/downgrade history for ${symbol}:`, error);
      return null;
    }
  }

  /**
   * Handle chart data request
   */
  async handleChartRequest(req: Request, res: Response) {
    const { symbol } = req.params;
    const { range = '1mo', interval = '1d' } = req.query;
    
    try {
      const data = await this.getChartData(
        symbol, 
        range as string, 
        interval as string
      );
      
      res.json(data);
    } catch (error) {
      console.error(`Failed to fetch chart data for ${symbol}:`, error);
      res.status(500).json({
        error: 'Failed to fetch chart data',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Handle news data request
   */
  async handleNewsRequest(req: Request, res: Response) {
    const { symbol } = req.params;
    const { count = 5 } = req.query;
    
    try {
      const data = await this.getNewsData(
        symbol, 
        parseInt(count as string, 10) || 5
      );
      
      res.json(data);
    } catch (error) {
      console.error(`Failed to fetch news data for ${symbol}:`, error);
      res.status(500).json({
        error: 'Failed to fetch news data',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
  
  /**
   * Handle recommendations data request
   */
  async handleRecommendationsRequest(req: Request, res: Response) {
    const { symbol } = req.params;
    
    try {
      const data = await this.getRecommendations(symbol);
      
      if (!data) {
        return res.status(404).json({
          error: 'No recommendations found',
          message: `No analyst recommendations available for ${symbol}`
        });
      }
      
      res.json(data);
    } catch (error) {
      console.error(`Failed to fetch recommendations for ${symbol}:`, error);
      res.status(500).json({
        error: 'Failed to fetch recommendations',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
  
  /**
   * Handle upgrade/downgrade history request
   */
  async handleUpgradeHistoryRequest(req: Request, res: Response) {
    const { symbol } = req.params;
    
    try {
      const data = await this.getUpgradeHistory(symbol);
      
      if (!data) {
        return res.status(404).json({
          error: 'No upgrade/downgrade history found',
          message: `No analyst upgrade/downgrade history available for ${symbol}`
        });
      }
      
      res.json(data);
    } catch (error) {
      console.error(`Failed to fetch upgrade/downgrade history for ${symbol}:`, error);
      res.status(500).json({
        error: 'Failed to fetch upgrade/downgrade history',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Helper to convert range string to Date object
   */
  private getDateFromRange(range: string): Date {
    const now = new Date();
    
    switch (range) {
      case '1d':
        return new Date(now.setDate(now.getDate() - 1));
      case '5d':
        return new Date(now.setDate(now.getDate() - 5));
      case '1mo':
        return new Date(now.setMonth(now.getMonth() - 1));
      case '3mo':
        return new Date(now.setMonth(now.getMonth() - 3));
      case '6mo':
        return new Date(now.setMonth(now.getMonth() - 6));
      case '1y':
        return new Date(now.setFullYear(now.getFullYear() - 1));
      case '2y':
        return new Date(now.setFullYear(now.getFullYear() - 2));
      case '5y':
        return new Date(now.setFullYear(now.getFullYear() - 5));
      case '10y':
        return new Date(now.setFullYear(now.getFullYear() - 10));
      case 'ytd':
        return new Date(now.getFullYear(), 0, 1);
      case 'max':
        return new Date(1970, 0, 1);
      default:
        return new Date(now.setMonth(now.getMonth() - 1));
    }
  }
}

export const yahooFinanceService = new YahooFinanceService();
export type { YahooNewsItem, AnalystRecommendation, UpgradeHistoryItem };