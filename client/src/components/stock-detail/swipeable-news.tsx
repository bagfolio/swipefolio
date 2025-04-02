import React, { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ExternalLink, TrendingUp, TrendingDown, Zap, Scale, DollarSign, BarChart, ChevronLeft, ChevronRight } from 'lucide-react';
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

interface ColumnarNewsResponse {
  success: boolean;
  data: {
    id: string[];
    title: string[];
    publisher: string[];
    publishDate: string[];
    url: string[];
    summary: string[];
    contentType: string[];
    sentiment?: string[];
    impactedMetrics?: any[];
  };
}

interface SwipeableNewsProps {
  symbol: string;
  className?: string;
}

export function SwipeableNews({ symbol, className }: SwipeableNewsProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  // Try first to fetch from the columnar format
  const { data: columnarData, isLoading: isColumnarLoading, error: columnarError } = useQuery({
    queryKey: ['/api/pg/stock', symbol, 'news'],
    queryFn: async () => {
      const response = await fetch(`/api/pg/stock/${symbol}/news?limit=10`);
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
      const response = await fetch(`/api/stocks/${symbol}/news?limit=10`);
      if (!response.ok) {
        throw new Error('Failed to fetch news');
      }
      return response.json() as Promise<NewsWithImpact[]>;
    },
    enabled: !!symbol && !!columnarError,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

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

  // Determine which data to use - prefer columnar if available
  const transformedNewsItems = React.useMemo(() => {
    if (columnarData?.success && columnarData?.data && columnarData.data.title.length > 0) {
      // Transform columnar data to NewsWithImpact[] format
      const items: NewsWithImpact[] = [];

      for (let i = 0; i < columnarData.data.title.length; i++) {
        const impactedMetrics: any = columnarData.data.impactedMetrics?.[i] || {};
        
        // Generate sentiment if not available
        const sentiment = columnarData.data.sentiment?.[i] || 'neutral';
          
        // Create a guaranteed unique ID using the index and timestamp
        const uniqueId = `news-${symbol}-${i}-${Date.now()}`;
          
        items.push({
          id: uniqueId,
          ticker: symbol,
          title: columnarData.data.title[i],
          summary: columnarData.data.summary[i] || '',
          url: columnarData.data.url[i],
          source: columnarData.data.publisher[i] || 'News Source',
          publishedDate: new Date(columnarData.data.publishDate[i]),
          sentiment: sentiment,
          impactedMetrics: impactedMetrics
        });
      }
      
      return items;
    }
    
    return newsItems || [];
  }, [columnarData, newsItems, symbol]);

  const isLoading = isColumnarLoading || isRegularLoading;
  const error = columnarError && regularError;

  // Mouse/touch events for swiping
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - containerRef.current.offsetLeft);
    setScrollLeft(containerRef.current.scrollLeft);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    e.preventDefault();
    const x = e.pageX - containerRef.current.offsetLeft;
    const walk = (x - startX) * 2; // Scroll speed multiplier
    containerRef.current.scrollLeft = scrollLeft - walk;
  };

  // Touch events for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!containerRef.current) return;
    setIsDragging(true);
    setStartX(e.touches[0].pageX - containerRef.current.offsetLeft);
    setScrollLeft(containerRef.current.scrollLeft);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !containerRef.current) return;
    const x = e.touches[0].pageX - containerRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    containerRef.current.scrollLeft = scrollLeft - walk;
  };

  // Navigation buttons
  const scrollPrev = () => {
    if (!containerRef.current) return;
    containerRef.current.scrollBy({ left: -300, behavior: 'smooth' });
  };

  const scrollNext = () => {
    if (!containerRef.current) return;
    containerRef.current.scrollBy({ left: 300, behavior: 'smooth' });
  };

  // Update active slide based on scroll position
  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      const scrollPos = containerRef.current.scrollLeft;
      const cardWidth = containerRef.current.offsetWidth;
      const newIndex = Math.round(scrollPos / cardWidth);
      setCurrentIndex(newIndex);
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, []);

  if (isLoading) {
    return (
      <div className={cn("w-full", className)}>
        <h3 className="font-semibold text-lg mb-3">Latest News</h3>
        <div className="flex space-x-4 overflow-x-auto py-2">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="min-w-[300px] flex-shrink-0">
              <CardContent className="p-4 space-y-2">
                <Skeleton className="h-4 w-16 mb-2" />
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error || !transformedNewsItems || transformedNewsItems.length === 0) {
    return (
      <div className={cn("w-full", className)}>
        <h3 className="font-semibold text-lg mb-3">Latest News</h3>
        <Card>
          <CardContent className="p-4">
            <p className="text-muted-foreground text-sm">
              No recent news available for {symbol}.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn("w-full relative", className)}>
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold text-lg">Latest News</h3>
        <div className="flex space-x-2">
          <button 
            onClick={scrollPrev}
            className="p-1 rounded-full bg-secondary hover:bg-secondary/80"
            aria-label="Previous news"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button 
            onClick={scrollNext}
            className="p-1 rounded-full bg-secondary hover:bg-secondary/80"
            aria-label="Next news"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      <div 
        ref={containerRef}
        className="flex space-x-4 overflow-x-auto py-2 scroll-smooth hide-scrollbar"
        style={{ scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onMouseMove={handleMouseMove}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchMove={handleTouchMove}
      >
        {transformedNewsItems.map((news) => (
          <Card 
            key={news.id} 
            className="min-w-[300px] max-w-[300px] flex-shrink-0 scroll-snap-align-start hover:shadow-md transition-shadow duration-200"
            style={{ scrollSnapAlign: 'start' }}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                {news.source && (
                  <div className="flex items-center">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                      {news.source.charAt(0)}
                    </div>
                    <span className="text-xs text-muted-foreground ml-1">{news.source}</span>
                  </div>
                )}
                <span className="text-xs text-muted-foreground ml-auto">
                  {formatDate(news.publishedDate.toString())}
                </span>
              </div>
              
              <h3 className="font-semibold text-sm mb-2 line-clamp-2">{news.title}</h3>
              
              <p className="text-sm text-muted-foreground mb-3 line-clamp-3">{news.summary}</p>
              
              <div className="flex flex-wrap gap-1 mb-2">
                {news.impactedMetrics && Object.entries(news.impactedMetrics).map(([metric, data]: [string, any]) => (
                  <Badge 
                    key={metric} 
                    variant="outline"
                    className={cn(
                      "flex items-center gap-1 py-0.5 text-xs",
                      getImpactColor(data.impact),
                    )}
                  >
                    {getMetricIcon(metric)}
                    <span className="capitalize">{metric}</span>
                  </Badge>
                ))}
              </div>
              
              <div className="flex justify-between items-center mt-3 pt-2 border-t">
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
                
                <a 
                  href={news.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-xs font-medium text-primary hover:underline"
                >
                  Read more <ExternalLink className="ml-1 w-3 h-3" />
                </a>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Dots for navigation on mobile */}
      <div className="flex justify-center mt-2 space-x-1">
        {transformedNewsItems.slice(0, Math.min(5, transformedNewsItems.length)).map((_, index) => (
          <button
            key={index}
            className={`h-1.5 rounded-full transition-all ${
              index === currentIndex ? 'w-4 bg-primary' : 'w-1.5 bg-gray-300 dark:bg-gray-700'
            }`}
            onClick={() => {
              if (containerRef.current) {
                const cardWidth = containerRef.current.offsetWidth;
                containerRef.current.scrollTo({
                  left: index * cardWidth,
                  behavior: 'smooth',
                });
              }
            }}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
      
      {/* Add style for hiding scrollbar */}
      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}