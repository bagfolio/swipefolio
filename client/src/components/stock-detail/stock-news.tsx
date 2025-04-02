import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { ChevronRight, ExternalLink, ChevronDown, TrendingUp, TrendingDown, Zap, Scale, DollarSign, BarChart } from 'lucide-react';
import { cn } from '@/lib/utils';

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

interface StockNewsProps {
  symbol: string;
  className?: string;
}

export function StockNews({ symbol, className }: StockNewsProps) {
  const [expandedNews, setExpandedNews] = useState<number | null>(null);

  const { data: newsItems, isLoading, error } = useQuery({
    queryKey: ['/api/stocks', symbol, 'news'],
    queryFn: async () => {
      const response = await fetch(`/api/stocks/${symbol}/news`);
      if (!response.ok) {
        throw new Error('Failed to fetch news');
      }
      return response.json() as Promise<NewsWithImpact[]>;
    },
    enabled: !!symbol,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const toggleExpand = (id: number) => {
    setExpandedNews(expandedNews === id ? null : id);
  };

  // Helper function to get the appropriate icon for a metric
  const getMetricIcon = (metric: string) => {
    switch (metric) {
      case 'performance':
        return <Zap className="w-4 h-4" />;
      case 'stability':
        return <Scale className="w-4 h-4" />;
      case 'value':
        return <DollarSign className="w-4 h-4" />;
      case 'momentum':
        return <BarChart className="w-4 h-4" />;
      default:
        return null;
    }
  };

  // Helper function to get impact color
  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'positive':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
      case 'negative':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100';
    }
  };

  // Format date from the API response
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'MMM d, yyyy');
    } catch (e) {
      return 'Unknown date';
    }
  };

  if (isLoading) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader>
          <CardTitle>Latest News</CardTitle>
          <CardDescription>Recent articles about {symbol}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error || !newsItems || newsItems.length === 0) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader>
          <CardTitle>Latest News</CardTitle>
          <CardDescription>Recent articles about {symbol}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            No recent news available for {symbol}.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle>Latest News</CardTitle>
        <CardDescription>Recent articles about {symbol}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {newsItems.map((news) => (
          <div key={news.id} className="border rounded-lg overflow-hidden">
            <div 
              className="p-3 flex justify-between items-start cursor-pointer hover:bg-muted/50"
              onClick={() => toggleExpand(news.id)}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "px-2 py-0.5 rounded text-xs font-medium",
                    news.sentiment === 'positive' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' : 
                    news.sentiment === 'negative' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100' : 
                    'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100'
                  )}>
                    {news.sentiment === 'positive' ? (
                      <span className="flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" /> Positive
                      </span>
                    ) : news.sentiment === 'negative' ? (
                      <span className="flex items-center gap-1">
                        <TrendingDown className="w-3 h-3" /> Negative
                      </span>
                    ) : (
                      'Neutral'
                    )}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {news.source} • {formatDate(news.publishedDate.toString())}
                  </span>
                </div>
                <h3 className="font-semibold">{news.title}</h3>
              </div>
              <div>
                {expandedNews === news.id ? (
                  <ChevronDown className="w-5 h-5 text-muted-foreground" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                )}
              </div>
            </div>
            
            {expandedNews === news.id && (
              <div className="px-3 pb-3 pt-1 border-t">
                <p className="text-sm mb-3">{news.summary}</p>
                
                {news.impactedMetrics && Object.keys(news.impactedMetrics).length > 0 && (
                  <>
                    <Separator className="my-2" />
                    <div className="mt-2">
                      <h4 className="text-sm font-medium mb-2">Impact Analysis:</h4>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(news.impactedMetrics).map(([metric, data]) => (
                          <Badge 
                            key={metric} 
                            variant="outline"
                            className={cn(
                              "flex items-center gap-1 py-1",
                              getImpactColor(data.impact),
                            )}
                          >
                            {getMetricIcon(metric)}
                            <span className="capitalize">{metric}</span>
                            <span className="font-semibold">{data.score}/10</span>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </>
                )}
                
                <div className="mt-3 text-right">
                  <a 
                    href={news.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-sm font-medium text-primary hover:underline"
                  >
                    Read full article <ExternalLink className="ml-1 w-3 h-3" />
                  </a>
                </div>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}