import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronUp, ChevronDown, Minus, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AnalystRecommendation {
  period: string;
  strongBuy: number;
  buy: number;
  hold: number;
  sell: number;
  strongSell: number;
  symbol: string;
}

interface PriceTarget {
  targetHigh: number;
  targetLow: number;
  targetMean: number;
  targetMedian: number;
  lastUpdated: string;
}

interface AnalystRecommendationsProps {
  symbol: string;
  recommendations?: AnalystRecommendation[];
  priceTarget?: PriceTarget;
  currentPrice?: number;
  className?: string;
}

export function AnalystRecommendations({ 
  symbol, 
  recommendations, 
  priceTarget, 
  currentPrice = 0,
  className 
}: AnalystRecommendationsProps) {
  const hasRecommendations = recommendations && recommendations.length > 0;
  const hasPriceTarget = priceTarget && 
    (priceTarget.targetMean || priceTarget.targetMedian || priceTarget.targetHigh || priceTarget.targetLow);

  if (!hasRecommendations && !hasPriceTarget) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader>
          <CardTitle>Analyst Recommendations</CardTitle>
          <CardDescription>Professional opinions on {symbol}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            No analyst recommendations available for this stock.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Get the most recent recommendation
  const latestRecommendation = hasRecommendations ? recommendations![0] : null;

  // Calculate percentages and total for the recommendation
  const calculateRecommendationData = () => {
    if (!latestRecommendation) return null;

    const total = 
      latestRecommendation.strongBuy + 
      latestRecommendation.buy + 
      latestRecommendation.hold + 
      latestRecommendation.sell + 
      latestRecommendation.strongSell;

    if (total === 0) return null;

    // Calculate percentages
    const strongBuyPercent = (latestRecommendation.strongBuy / total) * 100;
    const buyPercent = (latestRecommendation.buy / total) * 100;
    const holdPercent = (latestRecommendation.hold / total) * 100;
    const sellPercent = (latestRecommendation.sell / total) * 100;
    const strongSellPercent = (latestRecommendation.strongSell / total) * 100;

    // Calculate overall sentiment score (0-10 scale)
    const sentimentScore = (
      (latestRecommendation.strongBuy * 10) +
      (latestRecommendation.buy * 7.5) +
      (latestRecommendation.hold * 5) +
      (latestRecommendation.sell * 2.5) + 
      (latestRecommendation.strongSell * 0)
    ) / total;

    // Determine overall sentiment
    let sentiment = 'neutral';
    if (sentimentScore >= 7.5) sentiment = 'strongBuy';
    else if (sentimentScore >= 6) sentiment = 'buy';
    else if (sentimentScore <= 2.5) sentiment = 'strongSell';
    else if (sentimentScore <= 4) sentiment = 'sell';

    return {
      strongBuyPercent,
      buyPercent,
      holdPercent,
      sellPercent,
      strongSellPercent,
      sentiment,
      sentimentScore,
      total,
      period: latestRecommendation.period
    };
  };

  const recommendationData = calculateRecommendationData();

  // Calculate price target upside/downside
  const calculatePriceTargetData = () => {
    if (!hasPriceTarget || !currentPrice) return null;

    const meanTargetDiff = priceTarget!.targetMean 
      ? ((priceTarget!.targetMean - currentPrice) / currentPrice) * 100
      : 0;
    
    const medianTargetDiff = priceTarget!.targetMedian 
      ? ((priceTarget!.targetMedian - currentPrice) / currentPrice) * 100
      : meanTargetDiff; // Fall back to mean if median is not available

    return {
      high: priceTarget!.targetHigh || 0,
      low: priceTarget!.targetLow || 0,
      mean: priceTarget!.targetMean || 0,
      median: priceTarget!.targetMedian || 0,
      meanDiffPercent: meanTargetDiff,
      medianDiffPercent: medianTargetDiff,
      trend: medianTargetDiff > 0 ? 'up' : medianTargetDiff < 0 ? 'down' : 'neutral'
    };
  };

  const priceTargetData = calculatePriceTargetData();

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle>Analyst Recommendations</CardTitle>
        <CardDescription>Professional opinions on {symbol}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Price Target Section */}
        {hasPriceTarget && priceTargetData && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Price Target</h3>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Median Target</p>
                <p className="text-lg font-semibold">${priceTargetData.median.toFixed(2)}</p>
              </div>
              
              <div className={cn(
                "px-3 py-2 rounded-md flex items-center gap-1",
                priceTargetData.trend === 'up' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' :
                priceTargetData.trend === 'down' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100' :
                'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100'
              )}>
                {priceTargetData.trend === 'up' ? (
                  <TrendingUp className="w-4 h-4" />
                ) : priceTargetData.trend === 'down' ? (
                  <TrendingDown className="w-4 h-4" />
                ) : (
                  <Minus className="w-4 h-4" />
                )}
                <span className="font-medium">
                  {priceTargetData.medianDiffPercent > 0 ? '+' : ''}
                  {priceTargetData.medianDiffPercent.toFixed(2)}%
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div>
                <p className="text-xs text-muted-foreground">High Target</p>
                <p className="font-medium">${priceTargetData.high.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Low Target</p>
                <p className="font-medium">${priceTargetData.low.toFixed(2)}</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Recommendations Section */}
        {hasRecommendations && recommendationData && (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-semibold">Analyst Consensus</h3>
              <span className="text-xs text-muted-foreground">
                Based on {recommendationData.total} analysts ({recommendationData.period})
              </span>
            </div>
            
            {/* Overall sentiment */}
            <div className={cn(
              "px-3 py-2 rounded-md inline-block",
              recommendationData.sentiment === 'strongBuy' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' :
              recommendationData.sentiment === 'buy' ? 'bg-green-50 text-green-700 dark:bg-green-800 dark:text-green-50' :
              recommendationData.sentiment === 'sell' ? 'bg-red-50 text-red-700 dark:bg-red-800 dark:text-red-50' :
              recommendationData.sentiment === 'strongSell' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100' :
              'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100'
            )}>
              {recommendationData.sentiment === 'strongBuy' ? 'Strong Buy' :
               recommendationData.sentiment === 'buy' ? 'Buy' :
               recommendationData.sentiment === 'sell' ? 'Sell' :
               recommendationData.sentiment === 'strongSell' ? 'Strong Sell' : 'Hold'}
            </div>
            
            {/* Recommendation breakdown */}
            <div className="space-y-2 mt-2">
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-medium">Strong Buy</span>
                  <span>{latestRecommendation!.strongBuy} ({recommendationData.strongBuyPercent.toFixed(0)}%)</span>
                </div>
                <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-green-600" 
                    style={{ width: `${recommendationData.strongBuyPercent}%` }}
                  />
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-medium">Buy</span>
                  <span>{latestRecommendation!.buy} ({recommendationData.buyPercent.toFixed(0)}%)</span>
                </div>
                <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-green-400" 
                    style={{ width: `${recommendationData.buyPercent}%` }}
                  />
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-medium">Hold</span>
                  <span>{latestRecommendation!.hold} ({recommendationData.holdPercent.toFixed(0)}%)</span>
                </div>
                <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gray-400" 
                    style={{ width: `${recommendationData.holdPercent}%` }}
                  />
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-medium">Sell</span>
                  <span>{latestRecommendation!.sell} ({recommendationData.sellPercent.toFixed(0)}%)</span>
                </div>
                <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-red-400" 
                    style={{ width: `${recommendationData.sellPercent}%` }}
                  />
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-medium">Strong Sell</span>
                  <span>{latestRecommendation!.strongSell} ({recommendationData.strongSellPercent.toFixed(0)}%)</span>
                </div>
                <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-red-600" 
                    style={{ width: `${recommendationData.strongSellPercent}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}