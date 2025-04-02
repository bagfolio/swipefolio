/**
 * stock-news-service.ts
 * 
 * This service handles fetching and managing stock news data.
 */

import { db } from '../db';
import { stockNews, stocks, stockData } from '../../shared/schema';
import { eq, desc, and, sql, like } from 'drizzle-orm';
import { StockNews, InsertStockNews } from '../../shared/schema';
import { getAIResponse } from '../ai-service';

// Interface for news data with metric impact
export interface NewsWithImpact {
  id: number;
  ticker: string;
  title: string;
  summary: string;
  url: string;
  source: string;
  publishedDate: Date;
  sentiment: string;
  impactedMetrics: {
    performance?: { impact: 'positive' | 'negative' | 'neutral', score: number };
    stability?: { impact: 'positive' | 'negative' | 'neutral', score: number };
    value?: { impact: 'positive' | 'negative' | 'neutral', score: number };
    momentum?: { impact: 'positive' | 'negative' | 'neutral', score: number };
  };
}

// Mock news data for initial implementation
const getMockNewsForStock = (ticker: string): NewsWithImpact[] => {
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const twoDaysAgo = new Date(now);
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
  
  const threeDaysAgo = new Date(now);
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
  
  const fourDaysAgo = new Date(now);
  fourDaysAgo.setDate(fourDaysAgo.getDate() - 4);
  
  // Create mock news for the given ticker
  switch (ticker) {
    case "AAPL":
      return [
        {
          id: 1,
          ticker: "AAPL",
          title: "Apple to Increase iPhone Production Amid Strong Demand",
          summary: "Apple is ramping up iPhone production by 20% to meet higher-than-expected demand for new models.",
          url: "https://example.com/news/1",
          source: "Market Watch",
          publishedDate: yesterday,
          sentiment: "positive",
          impactedMetrics: {
            performance: { impact: "positive", score: 8 },
            momentum: { impact: "positive", score: 7 }
          }
        },
        {
          id: 2,
          ticker: "AAPL",
          title: "Apple Announces New AI Features for iOS",
          summary: "Apple unveiled advanced AI capabilities for its upcoming iOS update, positioning itself against competitors.",
          url: "https://example.com/news/2",
          source: "Tech Review",
          publishedDate: twoDaysAgo,
          sentiment: "positive",
          impactedMetrics: {
            performance: { impact: "positive", score: 6 },
            stability: { impact: "positive", score: 5 }
          }
        },
        {
          id: 3,
          ticker: "AAPL",
          title: "Apple Facing Supply Chain Challenges in Asia",
          summary: "Manufacturing delays in Asia could impact Apple's product delivery timeline for the holiday season.",
          url: "https://example.com/news/3",
          source: "Financial Times",
          publishedDate: threeDaysAgo,
          sentiment: "negative",
          impactedMetrics: {
            stability: { impact: "negative", score: 6 },
            momentum: { impact: "negative", score: 5 }
          }
        },
        {
          id: 4,
          ticker: "AAPL",
          title: "Apple Reports Record Quarterly Revenue",
          summary: "Apple announced quarterly revenue exceeding analyst expectations, driven by strong services growth.",
          url: "https://example.com/news/4",
          source: "Business Insider",
          publishedDate: fourDaysAgo,
          sentiment: "positive",
          impactedMetrics: {
            performance: { impact: "positive", score: 9 },
            value: { impact: "positive", score: 7 }
          }
        },
        {
          id: 5,
          ticker: "AAPL",
          title: "Apple Expands Renewable Energy Investments",
          summary: "Apple announced plans to invest $2 billion in renewable energy projects, furthering its carbon-neutral goals.",
          url: "https://example.com/news/5",
          source: "Green Tech",
          publishedDate: fourDaysAgo,
          sentiment: "positive",
          impactedMetrics: {
            stability: { impact: "positive", score: 7 },
            value: { impact: "positive", score: 4 }
          }
        }
      ];
    case "MSFT":
      return [
        {
          id: 6,
          ticker: "MSFT",
          title: "Microsoft Cloud Services Exceed Growth Expectations",
          summary: "Azure cloud services growth accelerates as more businesses transition to cloud infrastructure.",
          url: "https://example.com/news/6",
          source: "Tech Analyst",
          publishedDate: yesterday,
          sentiment: "positive",
          impactedMetrics: {
            performance: { impact: "positive", score: 8 },
            momentum: { impact: "positive", score: 7 }
          }
        },
        {
          id: 7,
          ticker: "MSFT",
          title: "Microsoft Expands AI Integration Across Products",
          summary: "New AI features are being rolled out across Microsoft 365 applications, enhancing productivity tools.",
          url: "https://example.com/news/7",
          source: "Digital Trends",
          publishedDate: twoDaysAgo,
          sentiment: "positive",
          impactedMetrics: {
            performance: { impact: "positive", score: 6 },
            stability: { impact: "positive", score: 5 }
          }
        },
        {
          id: 8,
          ticker: "MSFT",
          title: "Microsoft Faces Regulatory Scrutiny in EU",
          summary: "European regulators announce investigation into Microsoft's market practices and data handling.",
          url: "https://example.com/news/8",
          source: "EU Business",
          publishedDate: threeDaysAgo,
          sentiment: "negative",
          impactedMetrics: {
            stability: { impact: "negative", score: 6 },
            value: { impact: "negative", score: 5 }
          }
        },
        {
          id: 9,
          ticker: "MSFT",
          title: "Microsoft Gaming Division Revenue Increases",
          summary: "Xbox and Game Pass subscriptions drive significant revenue growth for Microsoft's gaming division.",
          url: "https://example.com/news/9",
          source: "Game Industry",
          publishedDate: fourDaysAgo,
          sentiment: "positive",
          impactedMetrics: {
            performance: { impact: "positive", score: 7 },
            momentum: { impact: "positive", score: 6 }
          }
        },
        {
          id: 10,
          ticker: "MSFT",
          title: "Microsoft Announces Stock Buyback Program",
          summary: "Board approves $60 billion stock repurchase program, signaling confidence in future performance.",
          url: "https://example.com/news/10",
          source: "Market Daily",
          publishedDate: fourDaysAgo,
          sentiment: "positive",
          impactedMetrics: {
            value: { impact: "positive", score: 8 },
            stability: { impact: "positive", score: 7 }
          }
        }
      ];
    default:
      // For other stocks, create generic news items
      return [
        {
          id: Math.floor(Math.random() * 1000) + 100,
          ticker: ticker,
          title: `${ticker} Announces Quarterly Earnings`,
          summary: `${ticker} reported earnings that slightly exceeded analyst expectations for the last quarter.`,
          url: "https://example.com/news/generic-1",
          source: "Financial News",
          publishedDate: yesterday,
          sentiment: "positive",
          impactedMetrics: {
            performance: { impact: "positive", score: 6 },
            value: { impact: "positive", score: 5 }
          }
        },
        {
          id: Math.floor(Math.random() * 1000) + 200,
          ticker: ticker,
          title: `${ticker} Expands Into New Markets`,
          summary: `${ticker} announced plans to expand operations into emerging markets to drive growth.`,
          url: "https://example.com/news/generic-2",
          source: "Business Review",
          publishedDate: twoDaysAgo,
          sentiment: "positive",
          impactedMetrics: {
            performance: { impact: "positive", score: 7 },
            momentum: { impact: "positive", score: 7 }
          }
        },
        {
          id: Math.floor(Math.random() * 1000) + 300,
          ticker: ticker,
          title: `Analyst Upgrades ${ticker} Stock Rating`,
          summary: `Major investment firm upgrades ${ticker} stock from "hold" to "buy" citing strong future outlook.`,
          url: "https://example.com/news/generic-3",
          source: "Investment Weekly",
          publishedDate: threeDaysAgo,
          sentiment: "positive",
          impactedMetrics: {
            value: { impact: "positive", score: 8 },
            momentum: { impact: "positive", score: 6 }
          }
        },
        {
          id: Math.floor(Math.random() * 1000) + 400,
          ticker: ticker,
          title: `${ticker} Announces Leadership Changes`,
          summary: `${ticker} appoints new Chief Financial Officer as part of executive leadership restructuring.`,
          url: "https://example.com/news/generic-4",
          source: "Corporate News",
          publishedDate: fourDaysAgo,
          sentiment: "neutral",
          impactedMetrics: {
            stability: { impact: "neutral", score: 5 }
          }
        },
        {
          id: Math.floor(Math.random() * 1000) + 500,
          ticker: ticker,
          title: `${ticker} Invests in Sustainable Practices`,
          summary: `${ticker} announces new environmental initiatives to reduce carbon footprint across operations.`,
          url: "https://example.com/news/generic-5",
          source: "Sustainability Report",
          publishedDate: fourDaysAgo,
          sentiment: "positive",
          impactedMetrics: {
            stability: { impact: "positive", score: 7 },
            value: { impact: "positive", score: 5 }
          }
        }
      ];
  }
};

/**
 * Service for managing stock news data
 */
export class StockNewsService {
  constructor() {
    console.log('Stock news service initialized');
  }

  /**
   * Get news for a specific stock ticker
   * @param ticker The stock ticker symbol
   * @param limit Maximum number of news items to return
   */
  async getNewsForStock(ticker: string, limit: number = 5): Promise<NewsWithImpact[]> {
    try {
      // Check if we have news data in the database
      const newsItems = await db
        .select()
        .from(stockNews)
        .where(eq(stockNews.ticker, ticker))
        .orderBy(desc(stockNews.publishedDate))
        .limit(limit);
      
      if (newsItems && newsItems.length > 0) {
        // Convert database items to NewsWithImpact format
        return newsItems.map(item => ({
          id: item.id,
          ticker: item.ticker,
          title: item.title,
          summary: item.summary || '',
          url: item.url,
          source: item.source || '',
          publishedDate: item.publishedDate,
          sentiment: item.sentiment || 'neutral',
          impactedMetrics: item.impactedMetrics as any || {}
        }));
      }
      
      // If no news in database, return mock data (in real world, would fetch from API)
      return getMockNewsForStock(ticker);
    } catch (error) {
      console.error(`Error fetching news for stock '${ticker}':`, error);
      // Fall back to mock data
      return getMockNewsForStock(ticker);
    }
  }
  
  /**
   * Get news for a specific stock ticker in columnar format
   * This matches the format from the PostgreSQL database as described in the documentation
   * @param ticker The stock ticker symbol
   * @param limit Maximum number of news items to return
   */
  async getNewsForStockColumnar(ticker: string, limit: number = 5): Promise<any> {
    try {
      // First try to get the news data directly from the stock_data table using the news field
      // We're already importing db, stockData, and eq at the top of the file
      const result = await db
        .select({
          ticker: stockData.ticker,
          news: stockData.news,
        })
        .from(stockData)
        .where(eq(stockData.ticker, ticker))
        .limit(1);
      
      // If we found news data in the stock_data table
      if (result && result.length > 0 && result[0].news) {
        console.log(`Found news data in stock_data table for ${ticker}`);
        
        // The data is already in columnar format
        const newsData = result[0].news as any;
        
        // Apply the limit to each array
        if (newsData.title && newsData.title.length > 0) {
          // Ensure the limit doesn't exceed the available data
          const effectiveLimit = Math.min(limit, newsData.title.length);
          
          // Limit the arrays
          Object.keys(newsData).forEach(key => {
            if (Array.isArray(newsData[key])) {
              newsData[key] = newsData[key].slice(0, effectiveLimit);
            }
          });
          
          return {
            success: true,
            data: newsData
          };
        }
      }
      
      // If no data in the stock_data table, fallback to our standard method and transform
      const newsItems = await this.getNewsForStock(ticker, limit);
      
      // Transform to columnar format
      if (newsItems && newsItems.length > 0) {
        // Initialize columnar structure
        const columnarData = {
          title: [] as string[],
          publisher: [] as string[],
          publishDate: [] as string[],
          url: [] as string[],
          summary: [] as string[],
          contentType: [] as string[],
          id: [] as string[],
          sentiment: [] as string[],
          impactedMetrics: [] as any[]
        };
        
        // Fill with data
        newsItems.forEach(item => {
          columnarData.title.push(item.title);
          columnarData.publisher.push(item.source);
          columnarData.publishDate.push(new Date(item.publishedDate).toISOString().split('T')[0]);
          columnarData.url.push(item.url);
          columnarData.summary.push(item.summary);
          columnarData.contentType.push('STORY');
          columnarData.id.push(item.id.toString());
          columnarData.sentiment.push(item.sentiment);
          columnarData.impactedMetrics.push(item.impactedMetrics);
        });
        
        return {
          success: true,
          data: columnarData
        };
      }
      
      // Return empty columnar structure if no news
      return {
        success: true,
        data: {
          title: [],
          publisher: [],
          publishDate: [],
          url: [],
          summary: [],
          contentType: [],
          id: []
        }
      };
    } catch (error) {
      console.error(`Error fetching columnar news for stock '${ticker}':`, error);
      return {
        success: false,
        error: "Failed to fetch news data"
      };
    }
  }

  /**
   * Add a news item for a stock
   */
  async addNewsItem(newsItem: InsertStockNews): Promise<StockNews | null> {
    try {
      const result = await db.insert(stockNews).values(newsItem).returning();
      return result[0] || null;
    } catch (error) {
      console.error('Error adding news item:', error);
      return null;
    }
  }

  /**
   * Analyze the impact of a news article on stock metrics
   * @param ticker The stock ticker
   * @param newsTitle The news article title
   * @param newsSummary The news article summary
   */
  async analyzeNewsImpact(ticker: string, newsTitle: string, newsSummary: string): Promise<any> {
    try {
      // In a real implementation, use the AI service to analyze the impact
      const query = `Analyze how this news about ${ticker} impacts the company's Performance, Stability, Value, and Momentum. 
      News Title: "${newsTitle}"
      News Summary: "${newsSummary}"
      
      For each of these metrics (Performance, Stability, Value, Momentum), determine:
      1. If the impact is positive, negative, or neutral
      2. The magnitude of impact on a scale of 1-10
      
      Format your response as a JSON object with this structure:
      {
        "performance": {"impact": "positive|negative|neutral", "score": number},
        "stability": {"impact": "positive|negative|neutral", "score": number},
        "value": {"impact": "positive|negative|neutral", "score": number},
        "momentum": {"impact": "positive|negative|neutral", "score": number}
      }`;
      
      // In development, return a mock analysis
      // In production, we would use:
      // const analysisResponse = await getAIResponse(query);
      // const analysis = JSON.parse(analysisResponse);
      
      // Mock analysis based on sentiment detection from title and summary
      const text = (newsTitle + " " + newsSummary).toLowerCase();
      
      // Simple sentiment analysis
      const positiveWords = ['increase', 'growth', 'profit', 'success', 'exceeded', 'strong', 'positive', 'higher', 'gain', 'improved'];
      const negativeWords = ['decrease', 'loss', 'decline', 'fail', 'below', 'weak', 'negative', 'lower', 'drop', 'reduced'];
      
      let positiveCount = 0;
      let negativeCount = 0;
      
      positiveWords.forEach(word => {
        if (text.includes(word)) positiveCount++;
      });
      
      negativeWords.forEach(word => {
        if (text.includes(word)) negativeCount++;
      });
      
      const sentiment = positiveCount > negativeCount ? 'positive' : 
                        negativeCount > positiveCount ? 'negative' : 'neutral';
      
      const score = sentiment === 'positive' ? 6 + Math.min(positiveCount, 4) :
                    sentiment === 'negative' ? 6 + Math.min(negativeCount, 4) : 5;
      
      // Randomly assign impact to different metrics
      const analysis = {
        performance: { impact: sentiment, score: Math.max(1, Math.min(10, score + Math.floor(Math.random() * 3) - 1)) },
        stability: { impact: sentiment, score: Math.max(1, Math.min(10, score + Math.floor(Math.random() * 3) - 1)) },
        value: { impact: sentiment, score: Math.max(1, Math.min(10, score + Math.floor(Math.random() * 3) - 1)) },
        momentum: { impact: sentiment, score: Math.max(1, Math.min(10, score + Math.floor(Math.random() * 3) - 1)) }
      };
      
      // Decide which metrics to include in the analysis result
      
      // Just pick 1-2 metrics to include
      const result: Record<string, { impact: string, score: number }> = {};
      
      if (Math.random() > 0.5) {
        result.performance = analysis.performance;
      }
      
      if (Math.random() > 0.5) {
        result.stability = analysis.stability;
      }
      
      // Ensure we have at least one metric
      if (Object.keys(result).length === 0) {
        if (Math.random() > 0.5) {
          result.value = analysis.value;
        } else {
          result.momentum = analysis.momentum;
        }
      }
      
      return result;
    } catch (error) {
      console.error('Error analyzing news impact:', error);
      return {
        performance: { impact: 'neutral', score: 5 }
      };
    }
  }
}

export const stockNewsService = new StockNewsService();