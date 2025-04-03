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
  metrics?: any; // Adding metrics parameter to hold future projections data
}

export function ModernAnalystRating({
  symbol,
  recommendations: propRecommendations,
  priceTarget,
  currentPrice = 0,
  className,
  metrics = {} // Adding metrics parameter with default empty object
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
                {/* Improved Semicircular Gauge with cleaner design */}
                <div className="relative w-64 h-36 mx-auto mb-2">
                  <div className="absolute w-full h-full">
                    <svg viewBox="0 0 200 120" className="w-full h-full">
                      {/* Background track with lighter coloring */}
                      <defs>
                        <linearGradient id="gauge-bg-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#fee2e2" /> {/* Light Red */}
                          <stop offset="25%" stopColor="#ffedd5" /> {/* Light Orange */}
                          <stop offset="50%" stopColor="#fef9c3" /> {/* Light Yellow */}
                          <stop offset="75%" stopColor="#dcfce7" /> {/* Light Green */}
                          <stop offset="100%" stopColor="#bbf7d0" /> {/* Light Green */}
                        </linearGradient>
                        <linearGradient id="gauge-active-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#ef4444" /> {/* Strong Sell - Red */}
                          <stop offset="25%" stopColor="#f97316" /> {/* Sell - Orange */}
                          <stop offset="50%" stopColor="#eab308" /> {/* Hold - Yellow */}
                          <stop offset="75%" stopColor="#84cc16" /> {/* Buy - Light Green */}
                          <stop offset="100%" stopColor="#22c55e" /> {/* Strong Buy - Green */}
                        </linearGradient>
                      </defs>
                      
                      {/* Background track filled with gradient */}
                      <path 
                        d="M20,100 A80,80 0 0,1 180,100" 
                        stroke="url(#gauge-bg-gradient)" 
                        strokeWidth="10" 
                        strokeLinecap="round"
                        fill="none"
                        className="dark:opacity-40"
                      />
                      
                      {/* Calculate and render the active segment */}
                      {(() => {
                        // Convert score to angle percentage (0-100 score to 0-180 degrees)
                        const scorePercent = recommendationData.score / 100;
                        // Calculate arc length based on score
                        const arcLength = scorePercent * 180;
                        
                        // Get the best color for the pointer based on score
                        const pointerColor = 
                          recommendationData.score >= 80 ? "#22c55e" : // Strong Buy - Green
                          recommendationData.score >= 60 ? "#84cc16" : // Buy - Light Green
                          recommendationData.score >= 40 ? "#eab308" : // Hold - Yellow
                          recommendationData.score >= 20 ? "#f97316" : // Sell - Orange
                          "#ef4444";                                   // Strong Sell - Red
                        
                        return (
                          <>
                            {/* Active gauge segment */}
                            <path 
                              d="M20,100 A80,80 0 0,1 180,100" 
                              stroke="url(#gauge-active-gradient)"
                              strokeWidth="10"
                              strokeLinecap="round"
                              strokeDasharray={`${arcLength} 180`}
                              fill="none"
                            />
                            
                            {/* Add a circle at the current position */}
                            <circle 
                              cx={100 - 80 * Math.cos(gaugeAngle * Math.PI / 180)}
                              cy={100 - 80 * Math.sin(gaugeAngle * Math.PI / 180)}
                              r="6" 
                              fill={pointerColor}
                              stroke="white"
                              strokeWidth="2"
                            />
                          </>
                        );
                      })()}
                      
                      {/* Clean, modern style labels */}
                      <text x="20" y="86" className="text-xs font-medium" fill="currentColor">Strong</text>
                      <text x="20" y="98" className="text-xs font-medium" fill="currentColor">Sell</text>
                      
                      <text x="73" y="80" className="text-xs font-medium" fill="currentColor">Sell</text>
                      
                      <text x="100" y="37" className="text-xs font-medium" fill="currentColor" textAnchor="middle">Hold</text>
                      
                      <text x="127" y="80" className="text-xs font-medium" fill="currentColor" textAnchor="end">Buy</text>
                      
                      <text x="180" y="86" className="text-xs font-medium" fill="currentColor" textAnchor="end">Strong</text>
                      <text x="180" y="98" className="text-xs font-medium" fill="currentColor" textAnchor="end">Buy</text>
                    </svg>
                  </div>
                </div>
                
                {/* Rating text below gauge */}
                <div className="text-center mb-4">
                  <div className="text-primary text-2xl font-bold">
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
                
                {/* Improved visualization with modern chart styling */}
                <div className="h-64 mt-6 bg-white dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-800 shadow-sm p-4">
                  {(() => {
                    const data = getHistoricalData() || [];
                    if (data.length === 0) return <div className="flex h-full items-center justify-center text-sm text-gray-500">No historical data available</div>;
                    
                    // Calculate percentages for each rating type
                    const processedData = data.map(d => {
                      const total = d.total;
                      return {
                        period: d.period?.substring(0, 7) || 'N/A',
                        // Convert raw counts to percentages
                        strongBuy: (d.strongBuy / total) * 100,
                        buy: (d.buy / total) * 100,
                        hold: (d.hold / total) * 100,
                        sell: (d.sell / total) * 100,
                        strongSell: (d.strongSell / total) * 100,
                        // Calculate overall score for the trend line
                        score: (
                          (d.strongBuy * 100) + 
                          (d.buy * 75) + 
                          (d.hold * 50) + 
                          (d.sell * 25) + 
                          (d.strongSell * 0)
                        ) / total
                      };
                    });
                    
                    // Calculate chart dimensions
                    const padding = { top: 20, right: 20, bottom: 30, left: 50 };
                    const chartWidth = 100 - padding.left - padding.right;
                    const chartHeight = 100 - padding.top - padding.bottom;
                    
                    // Calculate x positions for each period
                    const barWidth = chartWidth / (processedData.length * 1.5);
                    const barPositions = processedData.map((_, i) => 
                      padding.left + (i * (chartWidth / (processedData.length - 1 || 1)))
                    );
                    
                    // Calculate points for trend line
                    const trendPoints = barPositions.map((x, i) => {
                      // Map score (0-100) to chart height
                      const y = padding.top + chartHeight - (processedData[i].score / 100) * chartHeight;
                      return `${x},${y}`;
                    }).join(' ');
                    
                    return (
                      <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
                        {/* Chart background and grid */}
                        <rect x={padding.left} y={padding.top} width={chartWidth} height={chartHeight} 
                              fill="#f9fafb" className="dark:fill-gray-800" stroke="#f3f4f6" strokeWidth="0.5" />
                        
                        {/* Horizontal grid lines with labels */}
                        {[0, 25, 50, 75, 100].map(percent => {
                          const y = padding.top + chartHeight - (percent / 100) * chartHeight;
                          return (
                            <g key={percent}>
                              <line x1={padding.left} y1={y} x2={padding.left + chartWidth} y2={y} 
                                    stroke="#e5e7eb" className="dark:stroke-gray-700" strokeWidth="0.3" strokeDasharray="1,1" />
                              <text x={padding.left - 2} y={y} fontSize="2.5" 
                                    fill="#6b7280" className="dark:fill-gray-400" textAnchor="end" dominantBaseline="middle">
                                {percent}%
                              </text>
                            </g>
                          );
                        })}
                        
                        {/* X-axis labels (periods) */}
                        {barPositions.map((x, i) => (
                          <text key={i} x={x} y={padding.top + chartHeight + 5} 
                                fontSize="3" fill="#6b7280" className="dark:fill-gray-400" textAnchor="middle">
                            {processedData[i].period}
                          </text>
                        ))}
                        
                        {/* Y-axis label */}
                        <text x={padding.left - 40} y={padding.top + chartHeight/2} 
                              fontSize="3" fill="#6b7280" className="dark:fill-gray-400" textAnchor="middle"
                              transform={`rotate(-90 ${padding.left - 40} ${padding.top + chartHeight/2})`}>
                          Ratings Distribution
                        </text>
                        
                        {/* Legend */}
                        <g transform="translate(70, 10)">
                          {[
                            { label: "Strong Buy", color: "#22c55e" },
                            { label: "Buy", color: "#84cc16" },
                            { label: "Hold", color: "#eab308" },
                            { label: "Sell", color: "#f97316" },
                            { label: "Strong Sell", color: "#ef4444" }
                          ].map((item, i) => (
                            <g key={i} transform={`translate(0, ${i * 4})`}>
                              <rect width="3" height="3" fill={item.color} />
                              <text x="4" y="2.5" fontSize="2.5" fill="#6b7280" className="dark:fill-gray-400" dominantBaseline="middle">{item.label}</text>
                            </g>
                          ))}
                        </g>
                        
                        {/* Stacked bar charts */}
                        {processedData.map((d, i) => {
                          const x = barPositions[i] - barWidth/2;
                          let yOffset = padding.top + chartHeight; // Start from bottom
                          
                          return (
                            <g key={i}>
                              {/* Strong Buy (bottom of stack) */}
                              {d.strongBuy > 0 && (() => {
                                const height = (d.strongBuy / 100) * chartHeight;
                                yOffset -= height;
                                return (
                                  <rect x={x} y={yOffset} width={barWidth} height={height} 
                                        fill="#22c55e" rx="1" />
                                );
                              })()}
                              
                              {/* Buy */}
                              {d.buy > 0 && (() => {
                                const height = (d.buy / 100) * chartHeight;
                                yOffset -= height;
                                return (
                                  <rect x={x} y={yOffset} width={barWidth} height={height} 
                                        fill="#84cc16" rx="1" />
                                );
                              })()}
                              
                              {/* Hold */}
                              {d.hold > 0 && (() => {
                                const height = (d.hold / 100) * chartHeight;
                                yOffset -= height;
                                return (
                                  <rect x={x} y={yOffset} width={barWidth} height={height} 
                                        fill="#eab308" rx="1" />
                                );
                              })()}
                              
                              {/* Sell */}
                              {d.sell > 0 && (() => {
                                const height = (d.sell / 100) * chartHeight;
                                yOffset -= height;
                                return (
                                  <rect x={x} y={yOffset} width={barWidth} height={height} 
                                        fill="#f97316" rx="1" />
                                );
                              })()}
                              
                              {/* Strong Sell (top of stack) */}
                              {d.strongSell > 0 && (() => {
                                const height = (d.strongSell / 100) * chartHeight;
                                yOffset -= height;
                                return (
                                  <rect x={x} y={yOffset} width={barWidth} height={height} 
                                        fill="#ef4444" rx="1" />
                                );
                              })()}
                            </g>
                          );
                        })}
                        
                        {/* Trend line showing overall score */}
                        <polyline 
                          points={trendPoints}
                          fill="none"
                          stroke="#3b82f6"
                          strokeWidth="0.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        
                        {/* Trend data points */}
                        {barPositions.map((x, i) => {
                          const y = padding.top + chartHeight - (processedData[i].score / 100) * chartHeight;
                          return (
                            <circle 
                              key={i} 
                              cx={x} 
                              cy={y} 
                              r="1.2" 
                              fill="#3b82f6" 
                              stroke="white" 
                              strokeWidth="0.4"
                            />
                          );
                        })}
                      </svg>
                    );
                  })()}
                </div>
                
                <div className="p-3 border rounded-md">
                  <h4 className="text-sm font-medium mb-2">Rating Changes</h4>
                  <p className="text-sm">
                    {(() => {
                      const data = getHistoricalData() || [];
                      if (data.length < 2) return "Insufficient historical data to determine rating trends.";
                      
                      const latestScore = data[0].score;
                      const previousScore = data[1].score;
                      const diff = latestScore - previousScore;
                      
                      if (Math.abs(diff) < 5) return "Analyst ratings have remained relatively stable over the past periods.";
                      
                      return diff > 0 
                        ? `Analyst sentiment has improved by ${diff.toFixed(1)} points in the latest period.`
                        : `Analyst sentiment has declined by ${Math.abs(diff).toFixed(1)} points in the latest period.`;
                    })()}
                  </p>
                </div>
                
                {/* Legend */}
                <div className="flex flex-wrap gap-2 text-xs">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-500 mr-1 rounded-sm"></div>
                    <span>Strong Buy</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-300 mr-1 rounded-sm"></div>
                    <span>Buy</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-yellow-300 mr-1 rounded-sm"></div>
                    <span>Hold</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-orange-400 mr-1 rounded-sm"></div>
                    <span>Sell</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-red-500 mr-1 rounded-sm"></div>
                    <span>Strong Sell</span>
                  </div>
                  <div className="flex items-center ml-auto">
                    <div className="w-3 h-0.5 bg-blue-500 mr-1"></div>
                    <span>Trend</span>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
          
          {/* Future Outlook Tab */}
          <TabsContent value="future" className="pt-4">
            <div className="space-y-6">
              <h3 className="text-sm font-semibold">Future Projections</h3>
              
              {/* Fetch and use PostgreSQL future data */}
              {(() => {
                // Extract potential future data from metrics
                const rawMetrics = metrics || {};
                
                // Extract projected metrics from raw data
                const projectedMetrics = {
                  price: priceTargetData?.median || 0,
                  priceChangePercent: priceTargetData?.medianDiffPercent || 0,
                  revenueGrowth: rawMetrics.forwardRevenueGrowth || rawMetrics.revenueGrowth || 0,
                  earningsGrowth: rawMetrics.forwardEPS || rawMetrics.earningsGrowth || 0,
                  salesGrowth: rawMetrics.forwardSalesGrowth || rawMetrics.salesGrowth || 0,
                  dividendGrowth: rawMetrics.forwardDividendRate || rawMetrics.dividendGrowth || 0
                };
                
                // Only show this section if we have any projected data
                const hasProjections = 
                  projectedMetrics.price > 0 || 
                  projectedMetrics.revenueGrowth !== 0 || 
                  projectedMetrics.earningsGrowth !== 0 ||
                  projectedMetrics.salesGrowth !== 0;
                  
                if (!hasProjections) {
                  return (
                    <p className="text-sm text-muted-foreground">
                      No future projections data available for {symbol}.
                    </p>
                  );
                }
                
                return (
                  <div className="space-y-5">
                    {/* Price target visualization */}
                    {hasPriceTarget && priceTargetData && (
                      <div className="space-y-2">
                        <div className="relative h-12 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden shadow-inner">
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
                            className="absolute h-full w-1 bg-gray-800 dark:bg-gray-400 shadow-md" 
                            style={{ 
                              left: `${(currentPrice / (priceTargetData.high * 1.1)) * 100}%`,
                            }}
                          >
                            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gray-800 dark:bg-gray-400 text-white text-xs px-1.5 py-0.5 rounded shadow">
                              Current
                            </div>
                          </div>
                          
                          {/* Target price marker */}
                          <div 
                            className="absolute h-full w-1 bg-green-600 dark:bg-green-500 shadow-md" 
                            style={{ 
                              left: `${(priceTargetData.median / (priceTargetData.high * 1.1)) * 100}%`,
                            }}
                          >
                            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 bg-green-600 dark:bg-green-500 text-white text-xs px-1.5 py-0.5 rounded shadow">
                              Target
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>${(priceTargetData.low * 0.9).toFixed(2)}</span>
                          <span>${(priceTargetData.high * 1.1).toFixed(2)}</span>
                        </div>
                      </div>
                    )}
                    
                    {/* Growth Metrics - in a grid of cards */}
                    <div className="grid grid-cols-2 gap-3">
                      {/* Projected Price */}
                      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-3 hover:shadow-md transition-shadow">
                        <div className="text-xs text-muted-foreground mb-1">Projected Price</div>
                        <div className="flex items-baseline">
                          <div className="text-lg font-bold">
                            ${projectedMetrics.price.toFixed(2)}
                          </div>
                          {projectedMetrics.priceChangePercent !== 0 && (
                            <div className={cn(
                              "ml-2 text-xs font-medium",
                              projectedMetrics.priceChangePercent > 0 ? "text-green-600" : "text-red-600"
                            )}>
                              {projectedMetrics.priceChangePercent > 0 ? "+" : ""}
                              {projectedMetrics.priceChangePercent.toFixed(2)}%
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Revenue Growth */}
                      {projectedMetrics.revenueGrowth !== 0 && (
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-3 hover:shadow-md transition-shadow">
                          <div className="text-xs text-muted-foreground mb-1">Revenue Growth</div>
                          <div className="flex items-baseline">
                            <div className="text-lg font-bold">
                              {(projectedMetrics.revenueGrowth * 100).toFixed(2)}%
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Earnings Growth */}
                      {projectedMetrics.earningsGrowth !== 0 && (
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-3 hover:shadow-md transition-shadow">
                          <div className="text-xs text-muted-foreground mb-1">EPS Growth</div>
                          <div className="flex items-baseline">
                            <div className="text-lg font-bold">
                              ${typeof projectedMetrics.earningsGrowth === 'number' ? 
                                projectedMetrics.earningsGrowth.toFixed(2) : 
                                projectedMetrics.earningsGrowth}
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Sales Growth */}
                      {projectedMetrics.salesGrowth !== 0 && (
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-3 hover:shadow-md transition-shadow">
                          <div className="text-xs text-muted-foreground mb-1">Sales Growth</div>
                          <div className="flex items-baseline">
                            <div className="text-lg font-bold">
                              {(projectedMetrics.salesGrowth * 100).toFixed(2)}%
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Dividend Growth */}
                      {projectedMetrics.dividendGrowth !== 0 && (
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-3 hover:shadow-md transition-shadow">
                          <div className="text-xs text-muted-foreground mb-1">Dividend Forecast</div>
                          <div className="flex items-baseline">
                            <div className="text-lg font-bold">
                              ${projectedMetrics.dividendGrowth.toFixed(2)}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Analyst Commentary */}
                    <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                      <h4 className="text-sm font-medium mb-2 flex items-center">
                        <span className="mr-2">💡</span> Future Outlook
                      </h4>
                      <p className="text-sm">
                        {(() => {
                          // Generate a narrative based on price target and growth metrics
                          if (projectedMetrics.priceChangePercent > 15) {
                            return `Analysts are highly bullish on ${symbol}, projecting significant growth potential with a price target ${projectedMetrics.priceChangePercent.toFixed(1)}% above current levels.`;
                          } else if (projectedMetrics.priceChangePercent > 5) {
                            return `Analysts maintain a positive outlook for ${symbol}, with moderate upside potential and a price target ${projectedMetrics.priceChangePercent.toFixed(1)}% above current value.`;
                          } else if (projectedMetrics.priceChangePercent > -5) {
                            return `Analysts expect ${symbol} to maintain relatively stable performance with a price target near current market value.`;
                          } else {
                            return `Analysts forecast challenges ahead for ${symbol}, with a price target ${Math.abs(projectedMetrics.priceChangePercent).toFixed(1)}% below current levels.`;
                          }
                        })()}
                        
                        {/* Add revenue commentary if available */}
                        {projectedMetrics.revenueGrowth > 0 && ` Revenue is projected to grow by ${(projectedMetrics.revenueGrowth * 100).toFixed(1)}% year-over-year.`}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Forecasts typically reflect a 12-month outlook and are subject to market conditions.
                      </p>
                    </div>
                  </div>
                );
              })()}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}