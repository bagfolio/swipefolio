import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart2, TrendingUp, TrendingDown, ArrowUpRight, 
  InfoIcon, RotateCcw, Calendar, Loader2 
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { format, isValid, parseISO } from 'date-fns';

// Components for visualization
import { 
  Card, 
  CardContent 
} from '@/components/ui/card';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

// Helper functions
import { cn } from '@/lib/utils';

// Types
interface ModernAnalystRatingsProps {
  symbol: string;
  companyName?: string;
  onError?: (error: Error) => void;
  className?: string;
}

// Distribution data type
interface DistributionData {
  strongBuy: number;
  buy: number;
  hold: number;
  sell: number;
  strongSell: number;
}

// Analyst data type
interface AnalystData {
  consensusKey: string;
  consensusMean: number | null;
  numberOfAnalysts: number;
  gaugeScore: number | null;
  distributionOverTime: Record<string, DistributionData>;
  ratingHistoryForChart: Array<{
    firm: string;
    displayDate: string;
    actionType: string;
    standardizedToGrade: string;
    standardizedFromGrade: string;
  }>;
}

// Color scheme for ratings
const ratingColors = {
  'Strong Buy': 'bg-emerald-500',
  'Buy': 'bg-green-500',
  'Hold': 'bg-amber-400',
  'Sell': 'bg-red-500',
  'Strong Sell': 'bg-red-700',
  'N/A': 'bg-gray-400',
};

const ratingTextColors = {
  'Strong Buy': 'text-emerald-500',
  'Buy': 'text-green-500',
  'Hold': 'text-amber-500',
  'Sell': 'text-red-500',
  'Strong Sell': 'text-red-700',
  'N/A': 'text-gray-500',
};

const actionColors = {
  'upgrade': 'text-green-500',
  'downgrade': 'text-red-500',
  'maintain': 'text-amber-500',
  'init': 'text-blue-500',
};

const actionBgColors = {
  'upgrade': 'bg-green-100 border-green-200',
  'downgrade': 'bg-red-100 border-red-200',
  'maintain': 'bg-amber-100 border-amber-200',
  'init': 'bg-blue-100 border-blue-200',
};

// Period map for user-friendly display
const periodMap: Record<string, string> = {
  '0m': 'Current',
  '-1m': '1 Mo Ago',
  '-2m': '2 Mo Ago',
  '-3m': '3 Mo Ago',
};

// Custom hook to fetch analyst data
function useAnalystData(symbol: string) {
  return useQuery({
    queryKey: ['analystData', symbol],
    queryFn: async () => {
      try {
        // First try to get data from our recommendations endpoint
        const recommendationsResponse = await fetch(`/api/yahoo-finance/recommendations/${symbol}`);
        if (!recommendationsResponse.ok) {
          throw new Error(`Failed to fetch recommendations for ${symbol}`);
        }
        const recommendationsData = await recommendationsResponse.json();

        // Then get upgrade history data
        const upgradeHistoryResponse = await fetch(`/api/yahoo-finance/upgrade-history/${symbol}`);
        if (!upgradeHistoryResponse.ok) {
          throw new Error(`Failed to fetch upgrade history for ${symbol}`);
        }
        const upgradeHistoryData = await upgradeHistoryResponse.json();

        // Process and combine the data to match our expected format
        const processedData = {
          consensusKey: recommendationsData.consensus || 'N/A',
          consensusMean: recommendationsData.averageRating || null,
          numberOfAnalysts: recommendationsData.total || 0,
          gaugeScore: recommendationsData.averageRating || null,
          distributionOverTime: {
            '0m': {
              strongBuy: recommendationsData.strongBuy || 0,
              buy: recommendationsData.buy || 0,
              hold: recommendationsData.hold || 0,
              sell: recommendationsData.sell || 0,
              strongSell: recommendationsData.strongSell || 0,
            }
          },
          ratingHistoryForChart: upgradeHistoryData.map((item: any) => ({
            firm: item.firm,
            displayDate: item.date,
            actionType: item.action,
            standardizedToGrade: item.toGrade,
            standardizedFromGrade: item.fromGrade || 'New Coverage',
          }))
        };
        
        return processedData;
      } catch (error) {
        console.error(`Error fetching analyst data for ${symbol}:`, error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Gauge Component
const AnalystGauge: React.FC<{score: number; consensus: string; className?: string}> = ({ 
  score, 
  consensus,
  className
}) => {
  const [animated, setAnimated] = useState(false);
  
  // Normalize score to percentage (1-5 scale to 0-100%)
  const normalizedScore = ((score - 1) / 4) * 100;
  
  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={cn("relative flex flex-col items-center", className)}>
      <div className="relative w-44 h-28 flex flex-col items-center justify-center">
        {/* Gauge background */}
        <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
          <motion.div 
            className={cn("h-full transition-colors", getGaugeColorClass(score))}
            initial={{ width: "0%" }}
            animate={{ width: animated ? `${normalizedScore}%` : "0%" }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </div>
        
        {/* Gauge markers */}
        <div className="w-full flex justify-between mt-1 px-1">
          {[1, 2, 3, 4, 5].map((_, i) => (
            <div key={i} className="h-1.5 w-0.5 bg-gray-300" />
          ))}
        </div>
        
        {/* Score and label */}
        <div className="mt-3 text-center">
          <p className={cn("text-xl font-bold", getConsensusTextColor(consensus))}>
            {consensus}
          </p>
          <motion.p 
            className="text-sm text-gray-500 mt-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            Score: {score.toFixed(1)}/5
          </motion.p>
        </div>
      </div>
      
      {/* Label scale */}
      <div className="w-full flex justify-between text-xs text-gray-500 mt-1 px-1">
        <span>Sell</span>
        <span>Hold</span>
        <span>Buy</span>
      </div>
    </div>
  );
};

// Donut Chart Component
const DistributionDonut: React.FC<{
  distribution: {
    strongBuy: number;
    buy: number;
    hold: number;
    sell: number;
    strongSell: number;
  };
  totalAnalysts: number;
}> = ({ distribution, totalAnalysts }) => {
  const segments = [
    { label: 'Strong Buy', count: distribution.strongBuy, color: 'emerald' },
    { label: 'Buy', count: distribution.buy, color: 'green' },
    { label: 'Hold', count: distribution.hold, color: 'amber' },
    { label: 'Sell', count: distribution.sell, color: 'red' },
    { label: 'Strong Sell', count: distribution.strongSell, color: 'red-700' },
  ];
  
  // Filter out zero-count segments
  const filteredSegments = segments.filter(segment => segment.count > 0);
  
  // Calculate percentages and stroke-dasharray values
  const total = totalAnalysts || filteredSegments.reduce((sum: number, segment) => sum + segment.count, 0);
  let cumulativePercentage = 0;
  
  const segmentsWithData = filteredSegments.map(segment => {
    const percentage = total > 0 ? (segment.count / total) * 100 : 0;
    const startPercentage = cumulativePercentage;
    cumulativePercentage += percentage;
    
    return {
      ...segment,
      percentage,
      startPercentage,
      endPercentage: cumulativePercentage,
      strokeDasharray: `${percentage} ${100 - percentage}`,
      strokeDashoffset: `${-startPercentage}`,
    };
  });

  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  
  return (
    <div className="relative w-48 h-48 mx-auto">
      <svg className="w-full h-full" viewBox="0 0 100 100">
        <circle 
          className="fill-none stroke-gray-200" 
          cx="50" 
          cy="50" 
          r={radius} 
          strokeWidth="12"
        />
        
        {segmentsWithData.map((segment, i) => (
          <motion.circle
            key={i}
            className={`fill-none stroke-${segment.color} transition-all`}
            cx="50"
            cy="50"
            r={radius}
            strokeWidth="12"
            strokeDasharray={`${(segment.percentage * circumference) / 100} ${circumference}`}
            strokeDashoffset={`${(-segment.startPercentage * circumference) / 100}`}
            transform="rotate(-90 50 50)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: i * 0.1 }}
          />
        ))}
      </svg>
      
      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold">{totalAnalysts}</span>
        <span className="text-xs text-gray-500">Analysts</span>
      </div>
    </div>
  );
};

// Timeline Component
const RatingTimeline: React.FC<{
  history: Array<{
    firm: string;
    displayDate: string;
    actionType: string;
    standardizedToGrade: string;
    standardizedFromGrade: string;
  }>;
}> = ({ history }) => {
  if (!history?.length) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-gray-500">
        <RotateCcw className="h-8 w-8 mb-2 opacity-50" />
        <p>No rating history available</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-1 max-h-[350px] overflow-y-auto pr-1">
      {history.slice(0, 8).map((item, index) => (
        <motion.div 
          key={index}
          initial={{ opacity: 0, y: 10 }}
          animate={{ 
            opacity: 1, 
            y: 0,
            transition: { delay: index * 0.05 }
          }}
          className="p-3 hover:bg-gray-50 rounded-lg transition-colors"
        >
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center">
                <span className="font-medium">{item.firm}</span>
                <span className="text-xs text-gray-500 ml-2">
                  {item.displayDate}
                </span>
              </div>
              
              <div className="flex items-center mt-1.5 text-sm">
                <Badge 
                  className={cn(
                    "mr-2 capitalize font-normal", 
                    actionBgColors[item.actionType as keyof typeof actionBgColors] || 'bg-gray-100'
                  )}
                >
                  {item.actionType === 'init' ? 'New Coverage' : item.actionType}
                </Badge>
                
                {/* From → To rating change */}
                {item.actionType !== 'init' && item.standardizedFromGrade !== 'N/A' && (
                  <div className="flex items-center">
                    <span className={getConsensusTextColor(item.standardizedFromGrade)}>
                      {item.standardizedFromGrade}
                    </span>
                    <ArrowUpRight className="h-3.5 w-3.5 mx-1 text-gray-400 transform rotate-90" />
                    <span className={getConsensusTextColor(item.standardizedToGrade)}>
                      {item.standardizedToGrade}
                    </span>
                  </div>
                )}
                
                {/* Just show the rating for new coverage */}
                {item.actionType === 'init' && (
                  <span className={getConsensusTextColor(item.standardizedToGrade)}>
                    {item.standardizedToGrade}
                  </span>
                )}
              </div>
            </div>
            
            {/* Action icon */}
            <div className="ml-2">
              {item.actionType === 'upgrade' && (
                <TrendingUp className="h-5 w-5 text-green-500" />
              )}
              {item.actionType === 'downgrade' && (
                <TrendingDown className="h-5 w-5 text-red-500" />
              )}
              {item.actionType === 'maintain' && (
                <BarChart2 className="h-5 w-5 text-amber-500" />
              )}
              {item.actionType === 'init' && (
                <InfoIcon className="h-5 w-5 text-blue-500" />
              )}
            </div>
          </div>
        </motion.div>
      ))}
      
      {history.length > 8 && (
        <div className="text-center text-xs text-blue-600 pt-2 pb-1">
          <Button variant="link" size="sm" className="p-0 h-auto">
            View all {history.length} ratings
          </Button>
        </div>
      )}
    </div>
  );
};

// Helper functions for color classes
function getGaugeColorClass(score: number): string {
  if (!score) return 'bg-gray-300';
  
  if (score > 4) return 'bg-emerald-500';
  if (score > 3) return 'bg-green-500';
  if (score > 2.5) return 'bg-amber-400';
  if (score > 2) return 'bg-orange-500';
  return 'bg-red-500';
}

function getConsensusTextColor(consensus: string): string {
  return ratingTextColors[consensus as keyof typeof ratingTextColors] || 'text-gray-500';
}

// Main component
export const ModernAnalystRatings: React.FC<ModernAnalystRatingsProps> = ({ 
  symbol, 
  companyName,
  onError,
  className 
}) => {
  const [activeTab, setActiveTab] = useState<'snapshot' | 'history'>('snapshot');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('0m');
  
  const { data: analystData, isLoading, error } = useAnalystData(symbol);
  
  // Report errors to parent if needed
  useEffect(() => {
    if (error && onError) {
      onError(error as Error);
    }
  }, [error, onError]);
  
  if (isLoading) {
    return (
      <Card className={cn("overflow-hidden", className)}>
        <CardContent className="p-4 flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
          <span className="ml-2">Loading analyst data...</span>
        </CardContent>
      </Card>
    );
  }
  
  if (error || !analystData) {
    return (
      <Card className={cn("overflow-hidden", className)}>
        <CardContent className="p-4">
          <div className="text-center text-red-500">
            <p>Unable to load analyst data</p>
            {error && (
              <p className="text-sm text-gray-500 mt-1">
                {(error as Error).message}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Calculate some derived data
  // Explicitly define default distribution data for type safety
  const defaultDistribution: DistributionData = {
    strongBuy: 0,
    buy: 0,
    hold: 0,
    sell: 0,
    strongSell: 0
  };
  
  // Safely access the distribution data using explicit type checks
  const currentDistribution = (
    analystData.distributionOverTime && 
    typeof selectedPeriod === 'string' && 
    selectedPeriod in analystData.distributionOverTime
  ) 
    ? analystData.distributionOverTime[selectedPeriod as keyof typeof analystData.distributionOverTime] 
    : (analystData.distributionOverTime && '0m' in analystData.distributionOverTime)
      ? analystData.distributionOverTime['0m']
      : defaultDistribution;
  
  const totalAnalysts = analystData.numberOfAnalysts;
  const consensusScore = analystData.gaugeScore || 3; // Default to neutral if missing
  
  // Distribution percentages for bar chart
  const distributionData = [
    { label: 'Strong Buy', count: currentDistribution.strongBuy, color: 'bg-emerald-500' },
    { label: 'Buy', count: currentDistribution.buy, color: 'bg-green-500' },
    { label: 'Hold', count: currentDistribution.hold, color: 'bg-amber-400' },
    { label: 'Sell', count: currentDistribution.sell, color: 'bg-red-500' },
    { label: 'Strong Sell', count: currentDistribution.strongSell, color: 'bg-red-700' }
  ].filter(item => item.count > 0);
  
  // Available periods - use safer type handling and explicit casting
  const availablePeriods = Object.keys(analystData.distributionOverTime || {})
    .filter(period => {
      // Only get periods if they exist in the data
      if (!(period in (analystData.distributionOverTime || {}))) return false;
      
      // Safely access the distribution data
      const distribution = analystData.distributionOverTime?.[period as keyof typeof analystData.distributionOverTime];
      
      // Calculate total ratings for this period
      let total = 0;
      if (distribution) {
        // Use safer iteration approach rather than Object.values
        if (typeof distribution.strongBuy === 'number') total += distribution.strongBuy;
        if (typeof distribution.buy === 'number') total += distribution.buy;
        if (typeof distribution.hold === 'number') total += distribution.hold;
        if (typeof distribution.sell === 'number') total += distribution.sell;
        if (typeof distribution.strongSell === 'number') total += distribution.strongSell;
      }
      
      return total > 0;
    })
    .sort(); // Sort chronologically, newer periods first
  
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center">
            <BarChart2 className="h-5 w-5 mr-2 text-primary" />
            Analyst Ratings
          </h3>
          
          {/* Tab toggle - styled as a modern switch */}
          <div className="relative flex items-center space-x-1 bg-gray-100 p-1 rounded-full">
            <button
              onClick={() => setActiveTab('snapshot')}
              className={cn(
                "relative flex items-center rounded-full px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none",
                activeTab === 'snapshot' ? "text-white" : "text-gray-500 hover:text-gray-900"
              )}
            >
              <BarChart2 className="h-4 w-4 mr-1.5" />
              <span>Snapshot</span>
              {activeTab === 'snapshot' && (
                <motion.div
                  className="absolute inset-0 bg-primary rounded-full"
                  layoutId="active-tab"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  style={{ zIndex: -1 }}
                />
              )}
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={cn(
                "relative flex items-center rounded-full px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none",
                activeTab === 'history' ? "text-white" : "text-gray-500 hover:text-gray-900"
              )}
            >
              <Calendar className="h-4 w-4 mr-1.5" />
              <span>History</span>
              {activeTab === 'history' && (
                <motion.div
                  className="absolute inset-0 bg-primary rounded-full"
                  layoutId="active-tab"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  style={{ zIndex: -1 }}
                />
              )}
            </button>
          </div>
        </div>
        
        <AnimatePresence mode="wait">
          {activeTab === 'snapshot' ? (
            <motion.div 
              key="snapshot-view"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-around gap-6">
                {/* Gauge */}
                <AnalystGauge 
                  score={consensusScore} 
                  consensus={analystData.consensusKey || 'N/A'} 
                />
                
                {/* Distribution chart */}
                <div className="space-y-3">
                  {/* Period toggle buttons */}
                  {availablePeriods.length > 1 && (
                    <div className="flex justify-center space-x-2 mb-4">
                      {availablePeriods.map(period => (
                        <Button
                          key={period}
                          size="sm"
                          variant={selectedPeriod === period ? "default" : "outline"}
                          onClick={() => setSelectedPeriod(period)}
                          className={cn(
                            "text-xs rounded-full px-3 py-1 h-auto",
                            selectedPeriod === period ? "bg-primary text-white" : ""
                          )}
                        >
                          {periodMap[period] || period}
                        </Button>
                      ))}
                    </div>
                  )}
                  
                  {/* Donut chart */}
                  <DistributionDonut 
                    distribution={currentDistribution} 
                    totalAnalysts={totalAnalysts} 
                  />
                </div>
              </div>
              
              {/* Distribution bars */}
              <div className="space-y-3 mt-2">
                <h4 className="text-sm font-medium text-gray-700">Rating Distribution</h4>
                
                {distributionData.map(item => {
                  const percentage = totalAnalysts > 0 
                    ? (item.count / totalAnalysts) * 100 
                    : 0;
                  
                  return (
                    <div key={item.label} className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className={cn(
                          "text-sm font-medium",
                          ratingTextColors[item.label as keyof typeof ratingTextColors]
                        )}>
                          {item.label}
                        </span>
                        <span className="text-sm font-medium">
                          {item.count} ({Math.round(percentage)}%)
                        </span>
                      </div>
                      <motion.div 
                        className="h-2 bg-gray-200 rounded-full overflow-hidden"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        <motion.div 
                          className={cn("h-full", item.color)}
                          initial={{ width: "0%" }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ duration: 0.7, ease: "easeOut" }}
                        />
                      </motion.div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="history-view"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <RatingTimeline history={analystData.ratingHistoryForChart} />
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};

export default ModernAnalystRatings;