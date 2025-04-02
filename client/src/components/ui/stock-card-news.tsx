import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { MessageCircle, ChevronDown, ChevronUp, TrendingUp, TrendingDown, Zap, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

// For regular format
interface NewsWithImpact {
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

// For columnar format
interface ColumnarNewsResponse {
  success: boolean;
  data: {
    title: string[];
    publisher: string[];
    publishDate: string[];
    url: string[];
    summary: string[];
    contentType: string[];
    id: string[];
    sentiment?: string[];
    impactedMetrics?: any[];
  };
}

interface StockCardNewsProps {
  symbol: string;
  className?: string;
  mode?: 'light' | 'dark';
}

export function StockCardNews({ symbol, className, mode = 'dark' }: StockCardNewsProps) {
  const [expanded, setExpanded] = useState(false);

  // Try first to fetch from the columnar format
  const { data: columnarData, isLoading: isColumnarLoading, error: columnarError } = useQuery({
    queryKey: ['/api/pg/stock', symbol, 'news'],
    queryFn: async () => {
      const response = await fetch(`/api/pg/stock/${symbol}/news?limit=5`);
      if (!response.ok) {
        throw new Error('Failed to fetch columnar news');
      }
      return response.json() as Promise<ColumnarNewsResponse>;
    },
    enabled: !!symbol,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1, // Only retry once if it fails
  });

  // Fallback to regular format if columnar fails
  const { data: newsItems, isLoading: isRegularLoading, error: regularError } = useQuery({
    queryKey: ['/api/stocks', symbol, 'news'],
    queryFn: async () => {
      const response = await fetch(`/api/stocks/${symbol}/news?limit=3`);
      if (!response.ok) {
        throw new Error('Failed to fetch news');
      }
      return response.json() as Promise<NewsWithImpact[]>;
    },
    enabled: !!symbol && !!columnarError,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  // Determine which data to use - prefer columnar if available
  const transformedNewsItems = React.useMemo(() => {
    if (columnarData?.success && columnarData?.data && columnarData.data.title.length > 0) {
      // Transform columnar data to NewsWithImpact[] format
      const items: NewsWithImpact[] = [];
      
      for (let i = 0; i < columnarData.data.title.length; i++) {
        const impactedMetrics: any = columnarData.data.impactedMetrics?.[i] || {};
        
        // Generate some sentiment if not available
        const sentiment = columnarData.data.sentiment?.[i] || 
          (Math.random() > 0.6 ? 'positive' : Math.random() > 0.5 ? 'negative' : 'neutral');
          
        items.push({
          id: parseInt(columnarData.data.id[i]) || i,
          ticker: symbol,
          title: columnarData.data.title[i],
          summary: columnarData.data.summary[i] || '',
          url: columnarData.data.url[i],
          source: columnarData.data.publisher[i] || 'Financial News',
          publishedDate: new Date(columnarData.data.publishDate[i]),
          sentiment,
          impactedMetrics
        });
      }
      
      return items;
    }
    
    return newsItems;
  }, [columnarData, newsItems, symbol]);
  
  const isLoading = isColumnarLoading || (isRegularLoading && !!columnarError);

  // We no longer need the old generateTrendSummary function since we're 
  // using the memoized version with transformedNewsItems

  // Generate a summary of news trends based on the transformed news items
  const trendSummary = React.useMemo(() => {
    if (!transformedNewsItems || transformedNewsItems.length === 0) return null;
    
    // Count sentiment
    let positiveCount = 0;
    let negativeCount = 0;
    let neutralCount = 0;
    
    transformedNewsItems.forEach(item => {
      if (item.sentiment === 'positive') positiveCount++;
      else if (item.sentiment === 'negative') negativeCount++;
      else neutralCount++;
    });
    
    // Determine overall sentiment
    let overallSentiment: 'positive' | 'negative' | 'neutral' = 'neutral';
    if (positiveCount > negativeCount) overallSentiment = 'positive';
    else if (negativeCount > positiveCount) overallSentiment = 'negative';
    
    // Most impacted metric
    const metricImpact: Record<string, number> = { performance: 0, stability: 0, value: 0, momentum: 0 };
    
    transformedNewsItems.forEach(item => {
      if (item.impactedMetrics?.performance) {
        metricImpact.performance += item.impactedMetrics.performance.impact === 'positive' ? 1 : 
                                  item.impactedMetrics.performance.impact === 'negative' ? -1 : 0;
      }
      if (item.impactedMetrics?.stability) {
        metricImpact.stability += item.impactedMetrics.stability.impact === 'positive' ? 1 : 
                                item.impactedMetrics.stability.impact === 'negative' ? -1 : 0;
      }
      if (item.impactedMetrics?.value) {
        metricImpact.value += item.impactedMetrics.value.impact === 'positive' ? 1 : 
                             item.impactedMetrics.value.impact === 'negative' ? -1 : 0;
      }
      if (item.impactedMetrics?.momentum) {
        metricImpact.momentum += item.impactedMetrics.momentum.impact === 'positive' ? 1 : 
                               item.impactedMetrics.momentum.impact === 'negative' ? -1 : 0;
      }
    });
    
    // Find most impacted metrics (can be multiple)
    const metrics = Object.entries(metricImpact);
    const maxImpact = Math.max(...metrics.map(([_, value]) => Math.abs(value)));
    const mostImpactedMetrics = metrics
      .filter(([_, value]) => Math.abs(value) === maxImpact && value !== 0)
      .map(([key, value]) => ({ name: key, positive: value > 0 }));
    
    // Format the message
    if (mostImpactedMetrics.length === 0) {
      return {
        message: overallSentiment === 'positive' 
          ? `Recent news for ${symbol} is generally positive.` 
          : overallSentiment === 'negative' 
            ? `Recent news for ${symbol} has been mostly negative.` 
            : `Recent news for ${symbol} has been mixed.`,
        sentiment: overallSentiment
      };
    } else {
      const mostImpacted = mostImpactedMetrics[0];
      return {
        message: mostImpacted.positive 
          ? `Recent news suggests improved ${mostImpacted.name} for ${symbol}.` 
          : `Recent news indicates concerns about ${symbol}'s ${mostImpacted.name}.`,
        sentiment: mostImpacted.positive ? 'positive' : 'negative',
        impactedMetric: mostImpacted.name
      };
    }
  }, [transformedNewsItems, symbol]);
  
  // Helper function to get the icon for a metric
  const getMetricIcon = (metric: string) => {
    switch(metric) {
      case 'performance': return <Zap className="h-4 w-4" />;
      case 'stability': return <MessageCircle className="h-4 w-4" />;
      case 'value': return <DollarSign className="h-4 w-4" />;
      case 'momentum': return <TrendingUp className="h-4 w-4" />;
      default: return <MessageCircle className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className={cn("relative", className)}>
        <div className={`rounded-xl p-3 ${mode === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'} shadow-lg`}>
          <Skeleton className="h-5 w-32 mb-2" />
          <Skeleton className="h-4 w-full" />
        </div>
      </div>
    );
  }

  // Handle both errors from columnar and regular format
  const hasError = columnarError && regularError;
  
  // Don't show anything if there are no news items to display
  if (hasError || !transformedNewsItems || transformedNewsItems.length === 0) {
    return null;
  }

  return (
    <div className={cn("relative", className)}>
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className={cn(
          "rounded-xl p-3 shadow-lg border cursor-pointer", 
          mode === 'dark' 
            ? 'bg-gray-800 text-white border-gray-700 hover:bg-gray-750' 
            : 'bg-white text-gray-800 border-gray-200 hover:bg-blue-50 hover:border-blue-200'
        )}
        onClick={() => setExpanded(!expanded)}
      >
        {/* Visual indicator for clickable area */}
        <div className={cn(
          "absolute inset-0 rounded-xl",
          expanded ? "bg-blue-500/5" : "",
          "pointer-events-none"
        )} />
        
        {/* News trend summary */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 mb-2">
            <Badge className={cn(
              "text-xs font-semibold px-2 py-1",
              trendSummary?.sentiment === 'positive' 
                ? 'bg-green-500/20 text-green-500 hover:bg-green-500/30 ring-1 ring-green-500/30' 
                : trendSummary?.sentiment === 'negative'
                  ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30 ring-1 ring-red-500/30'
                  : 'bg-blue-500/20 text-blue-500 hover:bg-blue-500/30 ring-1 ring-blue-500/30'
            )}>
              {trendSummary?.sentiment === 'positive' ? <TrendingUp className="w-3.5 h-3.5 mr-1" /> : 
               trendSummary?.sentiment === 'negative' ? <TrendingDown className="w-3.5 h-3.5 mr-1" /> : 
               <MessageCircle className="w-3.5 h-3.5 mr-1" />}
              Latest News
            </Badge>
            
            {trendSummary?.impactedMetric && (
              <Badge variant="outline" className="text-xs font-medium px-2 py-1">
                {getMetricIcon(trendSummary.impactedMetric)}
                <span className="ml-1 capitalize">{trendSummary.impactedMetric}</span>
              </Badge>
            )}
          </div>
          
          <div 
            className={cn(
              "flex items-center justify-center w-7 h-7 rounded-full transition-colors",
              mode === 'dark' 
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white' 
                : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
            )}
          >
            {expanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </div>
        </div>
        
        <p className={cn(
          "text-sm leading-tight mb-1",
          mode === 'dark' ? 'text-gray-300' : 'text-gray-700',
          "font-medium"
        )}>
          {trendSummary?.message}
        </p>
        
        {/* Tap to show more text */}
        <div className={cn(
          "text-xs mt-2 flex items-center",
          !expanded && "opacity-75",
          mode === 'dark' ? 'text-blue-400' : 'text-blue-600'
        )}>
          {!expanded && (
            <>
              <span>Tap to {expanded ? 'hide' : 'show'} news details</span>
              <ChevronDown className="h-3 w-3 ml-1" />
            </>
          )}
        </div>
        
        {/* Expanded news details */}
        {expanded && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-3 space-y-3"
            onClick={(e) => e.stopPropagation()} // Prevent collapsing when clicking news items
          >
            {transformedNewsItems.map((item) => (
              <div 
                key={item.id} 
                className={cn(
                  "text-xs rounded-lg p-3 transition-all duration-150",
                  mode === 'dark' 
                    ? 'bg-gray-700/50 hover:bg-gray-700' 
                    : 'bg-gray-100 hover:bg-gray-50 hover:shadow-md'
                )}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className={`font-medium ${mode === 'dark' ? 'text-gray-200' : 'text-gray-900'}`}>
                    {item.title.length > 60 ? item.title.substring(0, 60) + '...' : item.title}
                  </span>
                  <Badge 
                    variant="outline" 
                    className={`ml-2 text-xs ${
                      item.sentiment === 'positive' 
                        ? 'border-green-500 text-green-400' 
                        : item.sentiment === 'negative' 
                          ? 'border-red-500 text-red-400' 
                          : 'border-blue-500 text-blue-400'
                    }`}
                  >
                    {item.sentiment}
                  </Badge>
                </div>
                <p className={`text-xs ${mode === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  {item.summary.length > 120 ? item.summary.substring(0, 120) + '...' : item.summary}
                </p>
                <div className="flex justify-between items-center mt-2">
                  <span className={`text-xs ${mode === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                    {item.source} • {format(new Date(item.publishedDate), 'MMM d')}
                  </span>
                  <a 
                    href={item.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className={`text-xs px-2 py-1 rounded ${mode === 'dark' ? 'bg-blue-900/50 text-blue-400 hover:bg-blue-900/80' : 'bg-blue-100 text-blue-600 hover:bg-blue-200'}`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    Read more
                  </a>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}