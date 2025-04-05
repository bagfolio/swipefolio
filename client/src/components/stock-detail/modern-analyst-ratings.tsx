import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart2, Info, Loader2, ArrowRight,
  HelpCircle, RotateCcw, ArrowUpRight, 
  TrendingUp, TrendingDown, Calendar, 
  InfoIcon
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { format, isValid, parseISO, sub } from 'date-fns';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Cell,
  LabelList
} from 'recharts';

// Components for visualization
import { 
  Card, 
  CardContent,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

// Helper functions
import { cn } from '@/lib/utils';

// Custom function to fetch analyst data (without importing the service)
function standardizeRating(rating: string): string {
  const lowerCaseRating = rating?.toLowerCase() || '';
  if (['strong buy', 'star performer'].includes(lowerCaseRating)) return 'Strong Buy';
  if (['buy', 'outperform', 'accumulate', 'overweight', 'positive'].includes(lowerCaseRating)) return 'Buy';
  if (['hold', 'neutral', 'market perform', 'equal-weight'].includes(lowerCaseRating)) return 'Hold';
  if (['sell', 'underperform', 'reduce', 'underweight', 'negative'].includes(lowerCaseRating)) return 'Sell';
  if (['strong sell'].includes(lowerCaseRating)) return 'Strong Sell';
  return 'N/A';
}

// Calculate a gauge score from analyst distributions (1-5 scale)
function calculateGaugeScore(distribution: any): number | null {
  if (!distribution) return null;
  
  const weights = { strongBuy: 5, buy: 4, hold: 3, sell: 2, strongSell: 1 };
  let weightedSum = 0;
  let totalAnalysts = 0;
  
  for (const key in weights) {
    const count = typeof distribution[key] === 'number' ? distribution[key] : 0;
    weightedSum += count * weights[key as keyof typeof weights];
    totalAnalysts += count;
  }
  
  if (totalAnalysts === 0) return null;
  return weightedSum / totalAnalysts;
}

// Function to fetch analyst data from our enhanced API endpoint
async function getAnalystData(symbol: string): Promise<AnalystData | null> {
  try {
    // Use our new unified analyst data endpoint
    const response = await fetch(`/api/yahoo-finance/analyst-data/${symbol}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error(`Server error fetching analyst data: ${errorData.message || 'Unknown error'}`);
      throw new Error(`Failed to fetch analyst data for ${symbol}: ${errorData.message || response.statusText}`);
    }
    
    const data = await response.json();
    
    // Log the received data for debugging
    console.log(`Received analyst data for ${symbol}:`, data);
    
    if (!data) {
      console.warn(`No analyst data returned for ${symbol}`);
      return null;
    }
    
    // Return the data directly as it matches our expected format from analystRatingsService
    return data as AnalystData;
  } catch (error) {
    console.error(`Error fetching analyst data for ${symbol}:`, error);
    throw error;
  }
}

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
    date: Date | null; // Now uses actual Date object
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

// Donut Chart Component (modified to remove center text and include all segments)
const DistributionDonut: React.FC<{
  distribution: DistributionData; // Use the defined type
  // Removed totalAnalysts from props
}> = ({ distribution }) => {
  // Define ALL segments, regardless of count
  const segments = [
    { label: 'Strong Buy', count: distribution?.strongBuy || 0, color: 'emerald-500' },
    { label: 'Buy', count: distribution?.buy || 0, color: 'green-500' },
    { label: 'Hold', count: distribution?.hold || 0, color: 'amber-400' },
    { label: 'Sell', count: distribution?.sell || 0, color: 'red-500' },
    { label: 'Strong Sell', count: distribution?.strongSell || 0, color: 'red-700' },
  ];

  // Calculate total based on ALL segments provided
  const total = Object.values(distribution || {}).reduce(
    (sum, count) => sum + (typeof count === 'number' ? count : 0), 
    0
  );

  let cumulativePercentage = 0;

  const segmentsWithData = segments.map(segment => {
    const percentage = total > 0 ? (segment.count / total) * 100 : 0;
    const startPercentage = cumulativePercentage;
    cumulativePercentage += percentage;

    return {
      ...segment,
      percentage,
      startPercentage,
      endPercentage: cumulativePercentage,
    };
  });

  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  
  return (
    <div className="relative w-48 h-48 mx-auto">
      <svg className="w-full h-full" viewBox="0 0 100 100">
        {/* Background circle */}
        <circle
          className="fill-none stroke-gray-200"
          cx="50" cy="50" r={radius} strokeWidth="12"
        />

        {/* Data Segments - only render if percentage > 0 */}
        {segmentsWithData.map((segment, i) => (
          segment.percentage > 0 && (
            <motion.circle
              key={i}
              className={`fill-none stroke-${segment.color} transition-all`}
              cx="50" cy="50" r={radius} strokeWidth="12"
              strokeDasharray={`${(segment.percentage * circumference) / 100} ${circumference}`}
              strokeDashoffset={`${(-segment.startPercentage * circumference) / 100}`}
              transform="rotate(-90 50 50)"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: i * 0.1, ease: "easeOut" }}
            />
          )
        ))}
      </svg>
      
      {/* Removed center text - will display totalAnalysts separately */}
    </div>
  );
};

// Timeline Component (with placeholder for chart implementation)
const RatingTimeline: React.FC<{
  history: Array<{
    date: Date | null; // Using Date object
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
  
  // Placeholder for timeline chart - in the future, this would use a proper chart library
  return (
    <div className="p-4 border border-dashed border-gray-300 rounded-lg text-center text-gray-500">
      <p className="font-semibold mb-2">Rating History Timeline Chart</p>
      <p className="text-sm">(Chart implementation pending)</p>
      <p className="text-xs mt-1">Showing {history.length} historical rating changes.</p>
      <div className="mt-6 space-y-1 max-h-[320px] overflow-y-auto pr-1">
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
      </div>
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
  
  // --- CORRECTED DATA FETCHING ---
  const { data: analystData, isLoading, error, isError } = useQuery<AnalystData | null>({
    queryKey: ['analystData', symbol],
    queryFn: () => getAnalystData(symbol), // Using imported function directly
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
  // --- END CORRECTED DATA FETCHING ---
  
  // Report errors to parent if needed
  useEffect(() => {
    if (isError && error && onError) {
      onError(error as Error);
    }
  }, [isError, error, onError]);
  
  // --- Calculate Available Periods Correctly ---
  const availablePeriods = useMemo(() => {
    if (!analystData?.distributionOverTime) return ['0m']; // Default if no data
    return Object.keys(analystData.distributionOverTime).sort((a, b) => {
      // Sort '0m' first, then '-1m', '-2m', etc.
      const numA = parseInt(a.replace('m', ''), 10);
      const numB = parseInt(b.replace('m', ''), 10);
      return numA - numB; // Should place 0m before -1m etc.
    });
  }, [analystData?.distributionOverTime]);

  // Ensure selectedPeriod is valid, fallback to '0m' if needed
  useEffect(() => {
    if (availablePeriods && !availablePeriods.includes(selectedPeriod)) {
      setSelectedPeriod(availablePeriods[0] || '0m');
    }
  }, [availablePeriods, selectedPeriod]);
  // --- End Period Calculation ---
  
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
  
  if (isError || !analystData) {
    return (
      <Card className={cn("overflow-hidden", className)}>
        <CardContent className="p-4">
          <div className="text-center text-red-500">
            <p>Unable to load analyst data</p>
            {error && (
              <p className="text-sm text-gray-500 mt-1">
                {(error as Error).message || 'An unknown error occurred'}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // --- Prepare Default Distribution Data ---
  const defaultDistribution: DistributionData = {
    strongBuy: 0,
    buy: 0,
    hold: 0,
    sell: 0,
    strongSell: 0
  };
  
  // Log the analyst data for debugging
  console.log(`[DEBUG][Analyst Ratings] Full data for ${symbol}:`, analystData);
  console.log(`[DEBUG][Analyst Ratings] Available periods:`, availablePeriods);
  console.log(`[DEBUG][Analyst Ratings] Selected period:`, selectedPeriod);
  console.log(`[DEBUG][Analyst Ratings] Distribution over time:`, analystData.distributionOverTime);
  
  // Safely access the distribution data for the selected period
  const currentDistribution = analystData.distributionOverTime?.[selectedPeriod] || 
                              analystData.distributionOverTime?.['0m'] || 
                              defaultDistribution;
  
  // Log the selected distribution
  console.log(`[DEBUG][Analyst Ratings] Using distribution for period ${selectedPeriod}:`, currentDistribution);
  
  const totalAnalysts = analystData.numberOfAnalysts;
  // Calculate sum from current distribution for comparison
  const distributionSum = Object.values(currentDistribution).reduce((sum, count) => sum + (count || 0), 0);
  
  console.log(`[DEBUG][Analyst Ratings] Total analysts reported: ${totalAnalysts}`);
  console.log(`[DEBUG][Analyst Ratings] Sum of distribution values: ${distributionSum}`);
  console.log(`[DEBUG][Analyst Ratings] Breakdown:`, {
    strongBuy: currentDistribution.strongBuy || 0,
    buy: currentDistribution.buy || 0,
    hold: currentDistribution.hold || 0,
    sell: currentDistribution.sell || 0,
    strongSell: currentDistribution.strongSell || 0
  });
  
  const consensusScore = analystData.gaugeScore || 3; // Default to neutral if missing
  
  // --- Update Distribution Data to Show All Categories ---
  const fullDistributionData = [
    { label: 'Strong Buy', count: currentDistribution.strongBuy || 0, color: ratingColors['Strong Buy'], textColor: ratingTextColors['Strong Buy'] },
    { label: 'Buy', count: currentDistribution.buy || 0, color: ratingColors['Buy'], textColor: ratingTextColors['Buy'] },
    { label: 'Hold', count: currentDistribution.hold || 0, color: ratingColors['Hold'], textColor: ratingTextColors['Hold'] },
    { label: 'Sell', count: currentDistribution.sell || 0, color: ratingColors['Sell'], textColor: ratingTextColors['Sell'] },
    { label: 'Strong Sell', count: currentDistribution.strongSell || 0, color: ratingColors['Strong Sell'], textColor: ratingTextColors['Strong Sell'] }
  ];
  
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
                
                {/* Distribution Section */}
                <div className="flex flex-col items-center space-y-3">
                  {/* --- Time Period Toggle Buttons --- */}
                  {availablePeriods.length > 1 && (
                    <div className="flex justify-center flex-wrap gap-2 mb-2">
                      {availablePeriods.map(period => (
                        <Button
                          key={period}
                          size="sm"
                          variant={selectedPeriod === period ? "default" : "outline"}
                          onClick={() => setSelectedPeriod(period)}
                          className={cn(
                            "text-xs rounded-full px-3 py-1 h-auto transition-all",
                            selectedPeriod === period ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"
                          )}
                        >
                          {periodMap[period] || period}
                        </Button>
                      ))}
                    </div>
                  )}
                  
                  {/* Donut chart - no analyst count in center */}
                  <DistributionDonut distribution={currentDistribution} />
                  
                  {/* Display Total Analysts Separately */}
                  <p className="text-sm text-muted-foreground mt-2">
                    Based on {totalAnalysts} analyst{totalAnalysts !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              
              {/* --- Legend/List (Using fullDistributionData) --- */}
              <div className="space-y-2 mt-4">
                <h4 className="text-sm font-medium text-center md:text-left text-gray-700">
                  Rating Breakdown ({periodMap[selectedPeriod] || selectedPeriod})
                </h4>
                {fullDistributionData.map(item => {
                  const percentage = totalAnalysts > 0
                    ? (item.count / totalAnalysts) * 100
                    : 0;
                  return (
                    // Render list items for ALL categories, showing 0 if count is 0
                    <div key={item.label} className="flex justify-between items-center text-sm">
                      <span className={cn("font-medium", item.textColor || ratingTextColors['N/A'])}>
                        {item.label}
                      </span>
                      <span className="font-medium text-gray-600">
                        {item.count} ({Math.round(percentage)}%)
                      </span>
                    </div>
                  );
                })}
              </div>
              {/* --- REMOVED Redundant Horizontal Bars --- */}
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