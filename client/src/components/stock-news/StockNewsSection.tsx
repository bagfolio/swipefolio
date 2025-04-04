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
  // Remove theme prop - we'll use light theme only
}

// Helper function to format date from timestamp or ISO string
const formatNewsDate = (dateValue: number | string): string => {
  if (!dateValue) return 'Recent';
  
  try {
    let date: Date;
    let useRelativeDates = false;
    
    // For Yahoo Finance, we need to determine the correct interpretation of the timestamp
    if (typeof dateValue === 'number') {
      // Yahoo Finance uses Unix timestamps (seconds since epoch)
      // The current Unix timestamp for 2025 is around 1743 million
      // If it's a 10-digit number around this magnitude, it's likely a Unix timestamp in seconds
      
      // Convert to milliseconds for JavaScript Date
      const timestampMs = dateValue * 1000;
      date = new Date(timestampMs);
      
      // Check if this is a valid date within a realistic range (2000-2030)
      const year = date.getFullYear();
      if (year >= 2000 && year <= 2030) {
        // Valid date - no adjustments needed
        console.log(`Using valid date conversion for timestamp ${dateValue} → ${date.toISOString()}`);
      } else {
        // Might be a different format or corrupt data - use relative date instead
        useRelativeDates = true;
        console.log(`Invalid year ${year} from timestamp ${dateValue}, using relative time`);
      }
    } else if (typeof dateValue === 'string') {
      // If it's a string, parse as ISO date
      date = new Date(dateValue);
      if (isNaN(date.getTime())) {
        useRelativeDates = true;
      }
    } else {
      console.warn('Unexpected date format:', dateValue);
      return 'Recent';
    }
    
    // If date validation failed, use a relative time description
    if (useRelativeDates) {
      return 'Recent';
    }
    
    // Get current date for comparison
    const now = new Date();
    const timeDiff = now.getTime() - date.getTime();
    const dayDiff = Math.floor(timeDiff / (1000 * 3600 * 24));
    
    // Format based on how recent the news is
    if (dayDiff === 0) {
      // Today
      return 'Today';
    } else if (dayDiff === 1) {
      // Yesterday
      return 'Yesterday';
    } else if (dayDiff < 7) {
      // Within the last week - show day of week
      return date.toLocaleDateString(undefined, { weekday: 'short' });
    } else {
      // Format with month and day, plus year if not current year
      const isCurrentYear = date.getFullYear() === now.getFullYear();
      
      if (isCurrentYear) {
        // Format: "Apr 4" for current year
        return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      } else {
        // Format: "Apr 4, 2024" for past years
        return date.toLocaleDateString(undefined, { 
          month: 'short', 
          day: 'numeric', 
          year: 'numeric'
        });
      }
    }
  } catch (error) {
    console.error('Error formatting date:', error, dateValue);
    return 'Recent'; 
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
  // State for scroll position tracking
  const [scrollPosition, setScrollPosition] = useState<number>(0);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  
  // Debug function to log news timestamps
  const debugNewsTimestamps = (newsItems: YahooNewsItem[]) => {
    if (newsItems && newsItems.length > 0) {
      console.log('News timestamps for', stock.ticker);
      newsItems.forEach((item, index) => {
        const timestamp = item.providerPublishTime;
        
        // Try both ways of interpreting the timestamp
        const dateFromDirect = new Date(timestamp);
        const dateFromSeconds = new Date(timestamp * 1000);
        
        console.log(`News #${index + 1} RAW Timestamp:`, timestamp);
        console.log(`News #${index + 1}:`, {
          title: item.title.substring(0, 40) + '...',
          timestamp: timestamp,
          directDate: dateFromDirect.toLocaleString(),
          secondsMultiplied: dateFromSeconds.toLocaleString(),
          publisher: item.publisher
        });
        
        // Check validity
        console.log(`News #${index + 1} Date validity:`, {
          direct: !isNaN(dateFromDirect.getTime()),
          seconds: !isNaN(dateFromSeconds.getTime())
        });
      });
    }
  };
  
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
  
  // Scroll handler functions
  const handleScroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;
    
    const container = scrollContainerRef.current;
    const cardWidth = 272; // 256px card width + 16px spacing
    const scrollAmount = direction === 'left' ? -cardWidth : cardWidth;
    
    container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    setScrollPosition(container.scrollLeft + scrollAmount);
  };
  
  // Process news items with sentiment analysis
  const processedNews: StockNewsItem[] = newsData?.items 
    ? newsData.items.map(item => ({
        ...item,
        metrics: analyzeNewsSentiment(item.title, stock.ticker)
      }))
    : [];
    
  // Log timestamp information for debugging
  if (newsData?.items && newsData.items.length > 0) {
    debugNewsTimestamps(newsData.items);
    console.log(`Found ${newsData.items.length} news items for ${stock.ticker}`);
  } else {
    console.log(`No news items found for ${stock.ticker}`, newsData);
  }
  
  // Log processed news for debugging
  console.log(`Processed news items: ${processedNews.length}`);

  // Define light theme styles
  const styles = {
    container: "p-4 bg-white",
    title: "font-semibold text-slate-900 mb-3 flex items-center",
    iconColor: "text-blue-500",
    emptyText: "text-slate-500",
    errorText: "text-rose-500",
    skeletonBg: "bg-slate-200",
    newsItem: "block p-3 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 transition-all duration-200 group",
    newsTitle: "text-sm font-medium text-slate-700 group-hover:text-blue-600 pr-4 transition-colors",
    icon: "w-4 h-4 text-slate-400 group-hover:text-blue-500 transition-colors flex-shrink-0",
    publisherBadge: "bg-slate-100 rounded-full px-2 py-1 mr-2 text-slate-600",
    metricTag: "text-xs mr-1 capitalize bg-slate-100 px-2 py-1 rounded-full text-slate-600"
  };

  if (error) {
    return (
      <div className={styles.container}>
        <h3 className={styles.title}>
          <Calendar className={`w-5 h-5 mr-2 ${styles.iconColor}`} /> Latest News
        </h3>
        <div className={`text-center py-6 ${styles.errorText}`}>
          <AlertCircle className="h-10 w-10 mx-auto mb-2" />
          <p>Could not load news for {stock.ticker}</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={styles.container}>
        <h3 className={styles.title}>
          <Calendar className={`w-5 h-5 mr-2 ${styles.iconColor}`} /> Latest News
        </h3>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className={`h-4 ${styles.skeletonBg} rounded w-3/4 mb-2`}></div>
              <div className={`h-3 ${styles.skeletonBg} rounded w-1/2 mb-1`}></div>
              <div className={`h-3 ${styles.skeletonBg} rounded w-1/4`}></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Function to get publisher logo
  const getPublisherLogo = (publisher: string) => {
    // Map of common publishers to their logo URLs
    const publisherLogos: Record<string, string> = {
      'CNBC': 'https://www.cnbc.com/favicon.ico',
      'Yahoo Finance': 'https://s.yimg.com/cv/apiv2/default/20220929/logo-yahoo-finance.png',
      'Seeking Alpha': 'https://seekingalpha.com/samw/static/images/favicon-32x32.png',
      'Benzinga': 'https://www.benzinga.com/images/icons/favicon-32x32.png',
      'MarketWatch': 'https://www.marketwatch.com/favicon.ico',
      'Bloomberg': 'https://www.bloomberg.com/favicon.ico',
      'Reuters': 'https://www.reuters.com/apple-touch-icon.png',
      'Financial Times': 'https://www.ft.com/__origami/service/image/v2/images/raw/ftlogo-v1:brand-ft-logo-square-coloured?source=update-logos&format=png&width=60',
      'The Wall Street Journal': 'https://www.wsj.com/favicon.ico',
      'Motley Fool': 'https://www.fool.com/favicon.ico',
      'Nasdaq': 'https://www.nasdaq.com/favicon.ico',
      'Forbes': 'https://www.forbes.com/favicon.ico',
      'Business Insider': 'https://www.businessinsider.com/favicon.ico',
      'CNBC Video': 'https://www.cnbc.com/favicon.ico'
    };
    
    return publisherLogos[publisher] || `https://www.google.com/s2/favicons?domain=${encodeURIComponent(publisher.toLowerCase() + '.com')}`;
  };
  
  // Component is ready for production  
  return (
    <div className={styles.container}>
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold text-slate-900 flex items-center">
          <Calendar className={`w-5 h-5 mr-2 ${styles.iconColor}`} /> Latest News
        </h3>
        
        {/* Navigation buttons */}
        {processedNews.length > 1 && (
          <div className="flex space-x-2">
            <button
              onClick={() => handleScroll('left')}
              className="p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 active:bg-slate-300 transition-colors"
              aria-label="Scroll left"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" 
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" 
                className="text-slate-600">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <button
              onClick={() => handleScroll('right')}
              className="p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 active:bg-slate-300 transition-colors"
              aria-label="Scroll right"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" 
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" 
                className="text-slate-600">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </div>
        )}
      </div>
      
      {processedNews.length === 0 ? (
        <div className={`text-center py-6 ${styles.emptyText}`}>
          <p>No recent news available for {stock.ticker}</p>
        </div>
      ) : (
        <div className="relative">
          {/* Scroll container */}
          <div 
            ref={scrollContainerRef}
            className="overflow-x-auto pb-2 -mx-4 px-4 scroll-smooth"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            <div className="flex space-x-4" style={{ minWidth: 'max-content' }}>
              {processedNews.map((newsItem, index) => {
                // Get the first metric for this news item
                const metrics = Object.entries(newsItem.metrics);
                const primaryMetric = metrics.length > 0 ? metrics[0] : null;
                
                // Get a suitable thumbnail URL if available
                // Try to get a medium-sized image first, if not available use any available image
                const thumbnailUrl = newsItem.thumbnail?.resolutions 
                  ? newsItem.thumbnail.resolutions.find(res => res.width >= 100 && res.width <= 300)?.url 
                    || newsItem.thumbnail.resolutions[0]?.url
                  : null;
                
                return (
                  <a 
                    key={index} 
                    href={newsItem.link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex-shrink-0 w-64 bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-md transition-all duration-200 hover:border-blue-400"
                  >
                    {/* Card Content */}
                    <div className="p-3">
                      {/* Publisher Logo and Date */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <img 
                            src={getPublisherLogo(newsItem.publisher)} 
                            alt={newsItem.publisher}
                            className="w-5 h-5 mr-2 rounded-full"
                            onError={(e) => {
                              // Fallback if logo fails to load
                              (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='3' width='18' height='18' rx='2' ry='2'%3E%3C/rect%3E%3Cline x1='3' y1='9' x2='21' y2='9'%3E%3C/line%3E%3Cline x1='9' y1='21' x2='9' y2='9'%3E%3C/line%3E%3C/svg%3E";
                            }}
                          />
                          <span className="text-xs font-semibold text-slate-800">{newsItem.publisher}</span>
                        </div>
                        <div className="flex items-center text-xs text-slate-500">
                          <Clock className="w-3 h-3 mr-1" />
                          {formatNewsDate(newsItem.providerPublishTime)}
                        </div>
                      </div>
                      
                      {/* News Thumbnail if available */}
                      <div className="mb-2 rounded-lg overflow-hidden bg-slate-50 h-24">
                        {thumbnailUrl ? (
                          <img 
                            src={thumbnailUrl} 
                            alt="News thumbnail" 
                            className="w-full h-full object-cover"
                            loading="lazy"
                            onError={(e) => {
                              // Try to use a fallback image with news topic icon
                              (e.target as HTMLImageElement).src = `https://via.placeholder.com/300x200/f1f5f9/64748b?text=${encodeURIComponent(newsItem.publisher)}`;
                            }}
                          />
                        ) : (
                          // Placeholder when no thumbnail is available
                          <div className="w-full h-full flex items-center justify-center bg-slate-100">
                            <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" 
                              stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" 
                              className="text-slate-400">
                              <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
                              <path d="M18 14h-8" />
                              <path d="M15 18h-5" />
                              <path d="M10 6h8v4h-8V6Z" />
                            </svg>
                          </div>
                        )}
                      </div>
                      
                      {/* News Title */}
                      <h4 className="text-sm font-medium text-slate-800 line-clamp-3 h-[4.5rem]">
                        {newsItem.title}
                      </h4>
                      
                      {/* Metrics and Read More */}
                      <div className="mt-2 flex items-center justify-between">
                        {primaryMetric && (
                          <div className="flex items-center">
                            <span className="text-xs capitalize bg-slate-100 px-2 py-1 rounded-full text-slate-600 mr-1">
                              {primaryMetric[0]}
                            </span>
                            {getMetricIcon(primaryMetric[0], primaryMetric[1])}
                          </div>
                        )}
                        <button 
                          className="text-xs font-medium text-blue-600 flex items-center hover:text-blue-700 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(newsItem.link, '_blank', 'noopener,noreferrer');
                          }}
                        >
                          Read more <ExternalLink className="w-3 h-3 ml-1" />
                        </button>
                      </div>
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
          
          {/* Mobile swipe indicator */}
          <div className="mt-2 text-center text-xs text-slate-400 md:hidden">
            <span>Swipe to see more news</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockNewsSection;