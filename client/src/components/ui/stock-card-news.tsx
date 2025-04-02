import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { MessageCircle, ChevronDown, ChevronUp, TrendingUp, TrendingDown, Zap, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

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

interface StockCardNewsProps {
  symbol: string;
  className?: string;
  mode?: 'light' | 'dark';
}

export function StockCardNews({ symbol, className, mode = 'dark' }: StockCardNewsProps) {
  const [expanded, setExpanded] = useState(false);

  const { data: newsItems, isLoading, error } = useQuery({
    queryKey: ['/api/stocks', symbol, 'news'],
    queryFn: async () => {
      const response = await fetch(`/api/stocks/${symbol}/news?limit=3`);
      if (!response.ok) {
        throw new Error('Failed to fetch news');
      }
      return response.json() as Promise<NewsWithImpact[]>;
    },
    enabled: !!symbol,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Generate a summary of news trends
  const generateTrendSummary = () => {
    if (!newsItems || newsItems.length === 0) return null;
    
    // Count sentiment
    let positiveCount = 0;
    let negativeCount = 0;
    let neutralCount = 0;
    
    newsItems.forEach(item => {
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
    
    newsItems.forEach(item => {
      if (item.impactedMetrics.performance) {
        metricImpact.performance += item.impactedMetrics.performance.impact === 'positive' ? 1 : 
                                  item.impactedMetrics.performance.impact === 'negative' ? -1 : 0;
      }
      if (item.impactedMetrics.stability) {
        metricImpact.stability += item.impactedMetrics.stability.impact === 'positive' ? 1 : 
                                item.impactedMetrics.stability.impact === 'negative' ? -1 : 0;
      }
      if (item.impactedMetrics.value) {
        metricImpact.value += item.impactedMetrics.value.impact === 'positive' ? 1 : 
                             item.impactedMetrics.value.impact === 'negative' ? -1 : 0;
      }
      if (item.impactedMetrics.momentum) {
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
  };

  const trendSummary = !isLoading && !error && newsItems ? generateTrendSummary() : null;
  
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

  if (error || !newsItems || newsItems.length === 0) {
    return null; // Don't show anything if there's an error or no news
  }

  return (
    <div className={cn("relative", className)}>
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className={cn(
          "rounded-xl p-3 shadow-lg border", 
          mode === 'dark' 
            ? 'bg-gray-800 text-white border-gray-700' 
            : 'bg-white text-gray-800 border-gray-200'
        )}
      >
        {/* News trend summary */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 mb-2">
            <Badge className={cn(
              "text-xs font-medium",
              trendSummary?.sentiment === 'positive' 
                ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' 
                : trendSummary?.sentiment === 'negative'
                  ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                  : 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
            )}>
              {trendSummary?.sentiment === 'positive' ? <TrendingUp className="w-3 h-3 mr-1" /> : 
               trendSummary?.sentiment === 'negative' ? <TrendingDown className="w-3 h-3 mr-1" /> : 
               <MessageCircle className="w-3 h-3 mr-1" />}
              News
            </Badge>
            
            {trendSummary?.impactedMetric && (
              <Badge variant="outline" className="text-xs font-medium">
                {getMetricIcon(trendSummary.impactedMetric)}
                <span className="ml-1 capitalize">{trendSummary.impactedMetric}</span>
              </Badge>
            )}
          </div>
          
          <button 
            onClick={() => setExpanded(!expanded)}
            className={`${mode === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'} focus:outline-none`}
          >
            {expanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </button>
        </div>
        
        <p className={`text-sm ${mode === 'dark' ? 'text-gray-300' : 'text-gray-700'} leading-tight mb-1`}>
          {trendSummary?.message}
        </p>
        
        {/* Expanded news details */}
        {expanded && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-3 space-y-3"
          >
            {newsItems.map((item) => (
              <div key={item.id} className={`text-xs rounded-lg p-2 ${mode === 'dark' ? 'bg-gray-700/50' : 'bg-gray-100'}`}>
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
                    className={`text-xs ${mode === 'dark' ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'}`}
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