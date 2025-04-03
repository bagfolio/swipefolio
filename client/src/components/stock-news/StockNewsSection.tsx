import React, { useState } from 'react';
import { Link } from 'wouter';
import { TrendingUp, TrendingDown, ArrowUpRight, BarChart2, Calendar, Clock, ExternalLink, AlertCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { StockData } from '../../lib/stock-data';

// Define news item interface
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

interface NewsItemMetrics {
  performance?: 'positive' | 'negative' | 'neutral';
  stability?: 'positive' | 'negative' | 'neutral';
  value?: 'positive' | 'negative' | 'neutral';
  momentum?: 'positive' | 'negative' | 'neutral';
}

interface StockNewsItem extends YahooNewsItem {
  metrics: NewsItemMetrics;
}

interface StockNewsSectionProps {
  stock: StockData;
}

// Helper function to format date from timestamp
const formatNewsDate = (timestamp: number): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  
  if (diffHours < 24) {
    return diffHours === 0 ? 'Just now' : `${diffHours}h ago`;
  } else {
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }
};

// Analyze news sentiment based on title
const analyzeNewsSentiment = (title: string, ticker: string): NewsItemMetrics => {
  // Convert title to lowercase for case-insensitive matching
  const lowerTitle = title.toLowerCase();
  const metrics: NewsItemMetrics = {};
  
  // Keywords that might indicate positive or negative sentiment for different metrics
  const keywords = {
    performance: {
      positive: ['beat', 'earnings', 'profit', 'growth', 'revenue', 'increase', 'exceeded', 'surpass'],
      negative: ['miss', 'loss', 'decline', 'drop', 'below expectations', 'disappointing', 'fell short']
    },
    stability: {
      positive: ['stable', 'consistent', 'reliable', 'dividend', 'steady', 'low volatility'],
      negative: ['volatility', 'unstable', 'uncertain', 'risky', 'turbulent']
    },
    value: {
      positive: ['undervalued', 'bargain', 'buy', 'opportunity', 'attractive valuation'],
      negative: ['overvalued', 'expensive', 'high valuation', 'overpriced']
    },
    momentum: {
      positive: ['upgrade', 'bullish', 'upward', 'momentum', 'breakthrough', 'new high'],
      negative: ['downgrade', 'bearish', 'downward', 'resistance', 'selling pressure']
    }
  };
  
  // Check for each metric
  for (const [metric, values] of Object.entries(keywords)) {
    let score = 0;
    
    // Count positive and negative keywords
    for (const word of values.positive) {
      if (lowerTitle.includes(word)) {
        score += 1;
      }
    }
    
    for (const word of values.negative) {
      if (lowerTitle.includes(word)) {
        score -= 1;
      }
    }
    
    // Assign sentiment based on score
    if (score > 0) {
      metrics[metric as keyof NewsItemMetrics] = 'positive';
    } else if (score < 0) {
      metrics[metric as keyof NewsItemMetrics] = 'negative';
    } else {
      // Check if the title mentions the metric at all
      const allKeywords = [...values.positive, ...values.negative];
      const mentionsMetric = allKeywords.some(word => lowerTitle.includes(word));
      
      if (mentionsMetric) {
        metrics[metric as keyof NewsItemMetrics] = 'neutral';
      }
    }
  }
  
  // Ensure at least one metric is set
  if (Object.keys(metrics).length === 0) {
    // Pick a random metric for neutral sentiment
    const metricKeys = ['performance', 'stability', 'value', 'momentum'];
    const randomMetric = metricKeys[Math.floor(Math.random() * metricKeys.length)];
    metrics[randomMetric as keyof NewsItemMetrics] = 'neutral';
  }
  
  return metrics;
};

// Get metric icon based on sentiment
const getMetricIcon = (metric: string, sentiment: 'positive' | 'negative' | 'neutral') => {
  // Define color based on sentiment
  const color = sentiment === 'positive' ? 'text-green-500' : 
                sentiment === 'negative' ? 'text-red-500' : 'text-amber-500';
  
  // Define icon based on metric
  switch (metric) {
    case 'performance':
      return sentiment === 'positive' ? 
        <TrendingUp className={`${color} w-4 h-4`} /> : 
        <TrendingDown className={`${color} w-4 h-4`} />;
    case 'stability':
      return <BarChart2 className={`${color} w-4 h-4`} />;
    case 'value':
      return <ArrowUpRight className={`${color} w-4 h-4 ${sentiment === 'negative' ? 'rotate-180' : ''}`} />;
    case 'momentum':
      return <ArrowUpRight className={`${color} w-4 h-4 ${sentiment === 'negative' ? 'rotate-180' : ''}`} />;
    default:
      return <ArrowUpRight className={`${color} w-4 h-4`} />;
  }
};

export const StockNewsSection: React.FC<StockNewsSectionProps> = ({ stock }) => {
  // Fetch news data from the API
  const { data: newsData, isLoading, error } = useQuery<{ items: YahooNewsItem[] }>({
    queryKey: ['/api/yahoo-finance/news', stock.ticker],
    queryFn: async () => {
      // Default to fetch from API
      try {
        const response = await fetch(`/api/yahoo-finance/news/${stock.ticker}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch news for ${stock.ticker}`);
        }
        return await response.json();
      } catch (error) {
        console.error(`Error fetching news for ${stock.ticker}:`, error);
        throw error;
      }
    },
    enabled: !!stock.ticker, // Only fetch if stock ticker is available
  });
  
  // Process news items with sentiment analysis
  const processedNews: StockNewsItem[] = newsData?.items 
    ? newsData.items.map(item => ({
        ...item,
        metrics: analyzeNewsSentiment(item.title, stock.ticker)
      }))
    : [];

  if (error) {
    return (
      <div className="p-4 bg-gray-800/70 border-t border-b border-gray-700">
        <h3 className="text-lg font-bold text-white mb-3 flex items-center">
          <Calendar className="w-5 h-5 mr-2 text-blue-400" /> Latest News
        </h3>
        <div className="text-center py-6 text-rose-400">
          <AlertCircle className="h-10 w-10 mx-auto mb-2" />
          <p>Could not load news for {stock.ticker}</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-4 bg-gray-800/70 border-t border-b border-gray-700">
        <h3 className="text-lg font-bold text-white mb-3 flex items-center">
          <Calendar className="w-5 h-5 mr-2 text-blue-400" /> Latest News
        </h3>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-700 rounded w-1/2 mb-1"></div>
              <div className="h-3 bg-gray-700 rounded w-1/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-gray-800/70 border-t border-b border-gray-700">
      <h3 className="text-lg font-bold text-white mb-3 flex items-center">
        <Calendar className="w-5 h-5 mr-2 text-blue-400" /> Latest News
      </h3>
      
      {processedNews.length === 0 ? (
        <div className="text-center py-6 text-gray-400">
          <p>No recent news available for {stock.ticker}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {processedNews.map((newsItem, index) => {
            // Get the first metric for this news item
            const metrics = Object.entries(newsItem.metrics);
            const primaryMetric = metrics.length > 0 ? metrics[0] : null;
            
            return (
              <a 
                key={index} 
                href={newsItem.link} 
                target="_blank" 
                rel="noopener noreferrer"
                className="block p-3 rounded-xl border border-gray-700 hover:border-blue-500 hover:bg-blue-900/10 transition-all duration-200 group"
              >
                <div className="flex justify-between items-start">
                  <h4 className="text-sm font-medium text-gray-300 group-hover:text-blue-400 pr-4 transition-colors">
                    {newsItem.title}
                  </h4>
                  <ExternalLink className="w-4 h-4 text-gray-500 group-hover:text-blue-400 transition-colors flex-shrink-0" />
                </div>
                
                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center text-xs text-gray-500">
                    <div className="bg-gray-800 rounded-full px-2 py-1 mr-2">
                      {newsItem.publisher}
                    </div>
                    <Clock className="w-3 h-3 mr-1" />
                    {formatNewsDate(newsItem.providerPublishTime)}
                  </div>
                  
                  {primaryMetric && (
                    <div className="flex items-center">
                      <span className="text-xs mr-1 capitalize bg-gray-800 px-2 py-1 rounded-full text-gray-400">
                        {primaryMetric[0]}
                      </span>
                      {getMetricIcon(primaryMetric[0], primaryMetric[1])}
                    </div>
                  )}
                </div>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default StockNewsSection;