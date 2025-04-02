import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AnalystRecommendation, PriceTarget, fetchAnalystRecommendations } from '@/lib/stock-data';
import { cn } from '@/lib/utils';

interface ModernAnalystRatingProps {
  symbol: string;
  recommendations?: AnalystRecommendation[];
  priceTarget?: PriceTarget;
  currentPrice?: number;
  className?: string;
}

export function ModernAnalystRating({
  symbol,
  recommendations: propRecommendations,
  priceTarget,
  currentPrice = 0,
  className
}: ModernAnalystRatingProps) {
  const [pgRecommendations, setPgRecommendations] = useState<AnalystRecommendation[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('current');
  
  // Use recommendations from props or from PostgreSQL
  const recommendations = pgRecommendations || propRecommendations;
  
  // Fetch recommendations from PostgreSQL if not provided via props
  useEffect(() => {
    async function fetchRecommendations() {
      if (!propRecommendations && symbol) {
        setLoading(true);
        try {
          const data = await fetchAnalystRecommendations(symbol);
          if (data) {
            setPgRecommendations(data);
            console.log(`Loaded ${data.length} recommendations for ${symbol} from PostgreSQL`);
          }
        } catch (error) {
          console.error(`Error fetching recommendations for ${symbol}:`, error);
        } finally {
          setLoading(false);
        }
      }
    }
    
    fetchRecommendations();
  }, [symbol, propRecommendations]);
  
  const hasRecommendations = recommendations && recommendations.length > 0;
  const hasPriceTarget = priceTarget && 
    (priceTarget.targetMean || priceTarget.targetMedian || priceTarget.targetHigh || priceTarget.targetLow);
    
  // Show loading skeleton when fetching recommendations
  if (loading) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader>
          <CardTitle><Skeleton className="h-6 w-48" /></CardTitle>
          <CardDescription><Skeleton className="h-4 w-64" /></CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Skeleton className="h-40 w-full" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Calculate data for the gauge and recommendations
  const latestRecommendation = hasRecommendations ? recommendations![0] : null;
  
  // Process the price target data
  const priceTargetData = hasPriceTarget ? {
    high: priceTarget!.targetHigh || 0,
    low: priceTarget!.targetLow || 0,
    mean: priceTarget!.targetMean || 0,
    median: priceTarget!.targetMedian || 0,
    medianDiffPercent: currentPrice > 0 ? ((priceTarget!.targetMedian || 0) - currentPrice) / currentPrice * 100 : 0,
    trend: priceTarget!.targetMedian && currentPrice ? 
      (priceTarget!.targetMedian > currentPrice ? 'up' : priceTarget!.targetMedian < currentPrice ? 'down' : 'neutral') : 'neutral'
  } : null;
  
  // Calculate recommendation data for display
  const recommendationData = latestRecommendation ? (() => {
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
    
    // Determine overall sentiment
    const buySentiment = strongBuyPercent + buyPercent;
    const sellSentiment = sellPercent + strongSellPercent;
    let sentiment = 'hold';
    
    if (buySentiment > 60) {
      sentiment = buySentiment > 80 ? 'strongBuy' : 'buy';
    } else if (sellSentiment > 60) {
      sentiment = sellSentiment > 80 ? 'strongSell' : 'sell';
    }
    
    // Calculate overall score for gauge (0-100, where 0 is Strong Sell and 100 is Strong Buy)
    const score = (
      (strongBuyPercent * 100) +
      (buyPercent * 75) +
      (holdPercent * 50) +
      (sellPercent * 25) +
      (strongSellPercent * 0)
    ) / 100;
    
    // Determine period from data
    const period = latestRecommendation.period || 'Recent';
    
    return {
      total,
      strongBuyPercent,
      buyPercent,
      holdPercent,
      sellPercent,
      strongSellPercent,
      sentiment,
      score,
      period
    };
  })() : null;
  
  // Create the gauge pointer angle based on score (0 to 180 degrees)
  const gaugeAngle = recommendationData ? (recommendationData.score * 1.8) : 90; // Scale 0-100 to 0-180 degrees
  
  // Check if we don't have any data to show
  if (!hasRecommendations && !hasPriceTarget) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader>
          <CardTitle>Analyst Rating</CardTitle>
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
  
  // Function to get historical data for past tab
  const getHistoricalData = () => {
    if (!recommendations || recommendations.length <= 1) return null;
    
    const histories = recommendations.slice(0, 6).map(rec => {
      const total = 
        rec.strongBuy + 
        rec.buy + 
        rec.hold + 
        rec.sell + 
        rec.strongSell;
      
      if (total === 0) return null;
      
      // Calculate percentages
      const strongBuyPercent = (rec.strongBuy / total) * 100;
      const buyPercent = (rec.buy / total) * 100;
      const holdPercent = (rec.hold / total) * 100;
      const sellPercent = (rec.sell / total) * 100;
      const strongSellPercent = (rec.strongSell / total) * 100;
      
      // Calculate overall score (0-100)
      const score = (
        (strongBuyPercent * 100) +
        (buyPercent * 75) +
        (holdPercent * 50) +
        (sellPercent * 25) +
        (strongSellPercent * 0)
      ) / 100;
      
      return {
        period: rec.period,
        score,
        total,
        strongBuy: rec.strongBuy,
        buy: rec.buy,
        hold: rec.hold,
        sell: rec.sell,
        strongSell: rec.strongSell
      };
    }).filter(item => item !== null);
    
    return histories;
  };
  
  // Get label for recommendation sentiment
  const getRecommendationLabel = (sentiment: string) => {
    switch (sentiment) {
      case 'strongBuy': return 'Strong Buy';
      case 'buy': return 'Buy';
      case 'hold': return 'Hold';
      case 'sell': return 'Sell';
      case 'strongSell': return 'Strong Sell';
      default: return 'Hold';
    }
  };
  
  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle>Analyst Rating</CardTitle>
        <CardDescription>
          {recommendationData && 
            `Based on ${recommendationData.total} analysts giving stock ratings to ${symbol} in the past 3 months.`
          }
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <Tabs defaultValue="current" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="current">Current</TabsTrigger>
            <TabsTrigger value="past">Past Ratings</TabsTrigger>
            <TabsTrigger value="future">Future Outlook</TabsTrigger>
          </TabsList>
          
          {/* Current Ratings Tab */}
          <TabsContent value="current" className="pt-4">
            {/* Circular Gauge Component */}
            {recommendationData && (
              <div className="flex flex-col items-center mb-6">
                {/* Gauge display */}
                <div className="relative w-48 h-24 overflow-hidden">
                  {/* Gauge Background */}
                  <div className="absolute w-full h-full bottom-0 rounded-t-full overflow-hidden">
                    {/* Color segments */}
                    <div className="absolute w-full h-full" 
                         style={{
                           background: 'linear-gradient(90deg, #ef4444 0%, #f97316 20%, #eab308 40%, #84cc16 60%, #22c55e 80%)',
                           clipPath: 'polygon(0% 100%, 50% 0%, 100% 100%)',
                         }} />
                  </div>
                  
                  {/* Labels */}
                  <div className="absolute bottom-0 left-0 ml-2 text-xs font-semibold text-gray-600">
                    Strong<br/>sell
                  </div>
                  <div className="absolute bottom-0 right-0 mr-2 text-xs font-semibold text-gray-600">
                    Strong<br/>buy
                  </div>
                  <div className="absolute top-5 left-1/2 transform -translate-x-1/2 text-xs font-semibold text-gray-600">
                    Neutral
                  </div>
                  
                  {/* Pointer */}
                  <div className="absolute bottom-0 left-1/2 w-1 h-20 origin-bottom transform -translate-x-1/2"
                       style={{ transform: `translateX(-50%) rotate(${gaugeAngle - 90}deg)` }}>
                    <div className="w-2 h-2 bg-black dark:bg-white rounded-full absolute top-0 left-1/2 transform -translate-x-1/2" />
                    <div className="w-0.5 h-20 bg-black dark:bg-white absolute top-2 left-1/2 transform -translate-x-1/2" />
                  </div>
                </div>
                
                {/* Current Rating Label */}
                <div className="text-center mt-2">
                  <div className="text-primary text-xl font-semibold">
                    {getRecommendationLabel(recommendationData.sentiment)}
                  </div>
                </div>
              </div>
            )}
            
            {/* Current Ratings Breakdown */}
            {recommendationData && (
              <div className="space-y-3">
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium">Strong buy</span>
                    <span className="tabular-nums">{latestRecommendation!.strongBuy}</span>
                  </div>
                  <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-500" 
                      style={{ width: `${recommendationData.strongBuyPercent}%` }}
                    />
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium">Buy</span>
                    <span className="tabular-nums">{latestRecommendation!.buy}</span>
                  </div>
                  <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-300" 
                      style={{ width: `${recommendationData.buyPercent}%` }}
                    />
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium">Hold</span>
                    <span className="tabular-nums">{latestRecommendation!.hold}</span>
                  </div>
                  <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-yellow-300" 
                      style={{ width: `${recommendationData.holdPercent}%` }}
                    />
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium">Sell</span>
                    <span className="tabular-nums">{latestRecommendation!.sell}</span>
                  </div>
                  <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-orange-400" 
                      style={{ width: `${recommendationData.sellPercent}%` }}
                    />
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium">Strong sell</span>
                    <span className="tabular-nums">{latestRecommendation!.strongSell}</span>
                  </div>
                  <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-red-500" 
                      style={{ width: `${recommendationData.strongSellPercent}%` }}
                    />
                  </div>
                </div>
              </div>
            )}
            
            {/* Price Target Information */}
            {hasPriceTarget && priceTargetData && (
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-800">
                <h3 className="text-sm font-semibold mb-3">Price Target</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">Current Price</div>
                    <div className="font-semibold">${currentPrice.toFixed(2)}</div>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">Median Target</div>
                    <div className="font-semibold">
                      ${priceTargetData.median.toFixed(2)}
                      <span className={cn(
                        "ml-1 text-xs",
                        priceTargetData.medianDiffPercent > 0 ? "text-green-600" : 
                        priceTargetData.medianDiffPercent < 0 ? "text-red-600" : ""
                      )}>
                        ({priceTargetData.medianDiffPercent > 0 ? "+" : ""}
                        {priceTargetData.medianDiffPercent.toFixed(2)}%)
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">Low Target</div>
                    <div className="font-semibold">${priceTargetData.low.toFixed(2)}</div>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">High Target</div>
                    <div className="font-semibold">${priceTargetData.high.toFixed(2)}</div>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
          
          {/* Past Ratings Tab */}
          <TabsContent value="past" className="pt-4">
            {!recommendations || recommendations.length <= 1 ? (
              <p className="text-sm text-muted-foreground">No historical analyst ratings data available.</p>
            ) : (
              <div className="space-y-6">
                <h3 className="text-sm font-semibold">Analyst Rating History</h3>
                
                {/* Simple visualization of past ratings */}
                <div className="space-y-4">
                  {getHistoricalData()?.map((history, index) => (
                    <div key={index} className="border rounded-md p-3">
                      <div className="flex justify-between mb-2">
                        <div className="text-sm font-medium">{history.period || `Period ${index + 1}`}</div>
                        <div className="text-xs text-muted-foreground">{`${history.total} analysts`}</div>
                      </div>
                      
                      {/* Stacked bar for the rating distribution */}
                      <div className="h-2 w-full flex rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-green-500" 
                          style={{ width: `${(history.strongBuy / history.total) * 100}%` }}
                        />
                        <div 
                          className="h-full bg-green-300" 
                          style={{ width: `${(history.buy / history.total) * 100}%` }}
                        />
                        <div 
                          className="h-full bg-yellow-300" 
                          style={{ width: `${(history.hold / history.total) * 100}%` }}
                        />
                        <div 
                          className="h-full bg-orange-400" 
                          style={{ width: `${(history.sell / history.total) * 100}%` }}
                        />
                        <div 
                          className="h-full bg-red-500" 
                          style={{ width: `${(history.strongSell / history.total) * 100}%` }}
                        />
                      </div>
                      
                      <div className="mt-2 flex justify-between text-xs">
                        <div>
                          <span className="font-semibold">{
                            history.score >= 70 ? 'Buy' : 
                            history.score <= 30 ? 'Sell' : 
                            'Hold'
                          }</span>
                        </div>
                        <div className="text-muted-foreground">
                          Buy: {history.strongBuy + history.buy}, 
                          Hold: {history.hold}, 
                          Sell: {history.sell + history.strongSell}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
          
          {/* Future Outlook Tab */}
          <TabsContent value="future" className="pt-4">
            <div className="space-y-6">
              <h3 className="text-sm font-semibold">Future Price Prospects</h3>
              
              {hasPriceTarget && priceTargetData ? (
                <div className="space-y-4">
                  {/* Price target visualization */}
                  <div className="relative h-12 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    {/* Low to high range */}
                    {priceTargetData.high > priceTargetData.low && (
                      <div 
                        className="absolute h-full bg-blue-100 dark:bg-blue-900/30" 
                        style={{ 
                          left: `${((priceTargetData.low - (priceTargetData.low * 0.1)) / (priceTargetData.high * 1.1)) * 100}%`,
                          width: `${((priceTargetData.high - priceTargetData.low) / (priceTargetData.high * 1.1)) * 100}%`
                        }}
                      />
                    )}
                    
                    {/* Current price marker */}
                    <div 
                      className="absolute h-full w-0.5 bg-gray-600 dark:bg-gray-400" 
                      style={{ 
                        left: `${(currentPrice / (priceTargetData.high * 1.1)) * 100}%`,
                      }}
                    >
                      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gray-600 dark:bg-gray-400 text-white text-xs px-1 rounded">
                        Current
                      </div>
                    </div>
                    
                    {/* Target price marker */}
                    <div 
                      className="absolute h-full w-0.5 bg-green-600 dark:bg-green-500" 
                      style={{ 
                        left: `${(priceTargetData.median / (priceTargetData.high * 1.1)) * 100}%`,
                      }}
                    >
                      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 bg-green-600 dark:bg-green-500 text-white text-xs px-1 rounded">
                        Target
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>${(priceTargetData.low * 0.9).toFixed(2)}</span>
                    <span>${(priceTargetData.high * 1.1).toFixed(2)}</span>
                  </div>
                  
                  {/* Potential gain/loss calculation */}
                  <div className="p-3 border rounded-md">
                    <h4 className="text-sm font-medium mb-2">Analyst Consensus</h4>
                    <p className="text-sm">
                      Analysts predict a 
                      <span className={cn(
                        "font-semibold mx-1",
                        priceTargetData.medianDiffPercent > 0 ? "text-green-600" : 
                        priceTargetData.medianDiffPercent < 0 ? "text-red-600" : ""
                      )}>
                        {priceTargetData.medianDiffPercent > 0 ? "gain" : "loss"} of 
                        {priceTargetData.medianDiffPercent > 0 ? "+" : ""}
                        {Math.abs(priceTargetData.medianDiffPercent).toFixed(2)}%
                      </span>
                      from the current price to the median target of ${priceTargetData.median.toFixed(2)}.
                    </p>
                    
                    <p className="text-xs text-muted-foreground mt-2">
                      Potential range: ${priceTargetData.low.toFixed(2)} to ${priceTargetData.high.toFixed(2)}
                    </p>
                  </div>
                  
                  {/* Estimated timeframe */}
                  <div className="p-3 border rounded-md">
                    <h4 className="text-sm font-medium mb-1">Timeframe</h4>
                    <p className="text-sm">Analyst price targets typically reflect a 12-month outlook.</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No price target data available for future outlook.</p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}