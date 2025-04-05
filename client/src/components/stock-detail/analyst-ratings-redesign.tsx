import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Loader2, HelpCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { format, subMonths } from 'date-fns';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Cell,
  LabelList,
} from 'recharts';

// Components for visualization
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Helper functions
import { cn } from '@/lib/utils';

// Types
interface AnalystRatingsProps {
  symbol: string;
  companyName?: string;
  onError?: (error: Error) => void;
  className?: string;
}

// Distribution data type as received from API
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
  ratingHistoryForChart: any[]; // We don't use this in our current design
}

// Function to fetch analyst data from our enhanced API endpoint
async function getAnalystData(symbol: string): Promise<AnalystData | null> {
  try {
    // Use our unified analyst data endpoint
    const response = await fetch(`/api/yahoo-finance/analyst-data/${symbol}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error(`Server error fetching analyst data: ${errorData.message || 'Unknown error'}`);
      throw new Error(`Failed to fetch analyst data for ${symbol}: ${errorData.message || response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`Received analyst data for ${symbol}:`, data);
    
    if (!data) {
      console.warn(`No analyst data returned for ${symbol}`);
      return null;
    }
    
    return data as AnalystData;
  } catch (error) {
    console.error(`Error fetching analyst data for ${symbol}:`, error);
    throw error;
  }
}

// Helper to generate formatted months for the chart
function generateMonthLabels(count: number = 5): string[] {
  const today = new Date();
  const labels = [];
  
  for (let i = 0; i < count; i++) {
    const date = subMonths(today, i);
    labels.unshift(format(date, 'MMM yy'));
  }
  
  return labels;
}

// Custom circular gauge component matching reference image
const AnalystGauge: React.FC<{
  score: number;
  consensus: string;
}> = ({ score, consensus }) => {
  // Calculate which position the needle should point to
  const getActivePosition = (score: number) => {
    if (score < 1.6) return 1; // Strong Sell
    if (score < 2.6) return 2; // Sell
    if (score < 3.6) return 3; // Hold
    if (score < 4.6) return 4; // Buy
    return 5; // Strong Buy
  };

  const activePosition = getActivePosition(score);

  return (
    <div className="relative flex flex-col items-center pt-4">
      {/* Semi-circle gauge background */}
      <div className="relative w-48 h-24">
        <svg 
          viewBox="0 0 200 100" 
          className="w-full h-full"
        >
          {/* Background arc */}
          <path 
            d="M20,90 A80,80 0 0,1 180,90" 
            fill="none" 
            stroke="#f0f0f0" 
            strokeWidth="20" 
            strokeLinecap="round"
          />
          
          {/* Colored segments */}
          <path 
            d="M20,90 A80,80 0 0,1 60,30" 
            fill="none" 
            stroke={activePosition === 1 ? "#ef4444" : "#f0f0f0"} 
            strokeWidth="20" 
            strokeLinecap="round"
          />
          <path 
            d="M60,30 A80,80 0 0,1 100,20" 
            fill="none" 
            stroke={activePosition === 2 ? "#f97316" : "#f0f0f0"} 
            strokeWidth="20" 
            strokeLinecap="round"
          />
          <path 
            d="M100,20 A80,80 0 0,1 140,30" 
            fill="none" 
            stroke={activePosition === 3 ? "#84cc16" : "#f0f0f0"} 
            strokeWidth="20" 
            strokeLinecap="round"
          />
          <path 
            d="M140,30 A80,80 0 0,1 180,90" 
            fill="none" 
            stroke={activePosition === 4 ? "#22c55e" : "#f0f0f0"} 
            strokeWidth="20" 
            strokeLinecap="round"
          />
          
          {/* Position markers with labels */}
          <g className="text-sm font-medium">
            <circle cx="30" cy="80" r="12" fill={activePosition === 1 ? "#ef4444" : "#d1d5db"} />
            <text x="30" y="84" textAnchor="middle" fill="white">1</text>
            
            <circle cx="75" cy="40" r="12" fill={activePosition === 2 ? "#f97316" : "#d1d5db"} />
            <text x="75" y="44" textAnchor="middle" fill="white">2</text>
            
            <circle cx="100" cy="30" r="12" fill={activePosition === 3 ? "#84cc16" : "#d1d5db"} />
            <text x="100" y="34" textAnchor="middle" fill="white">3</text>
            
            <circle cx="125" cy="40" r="12" fill={activePosition === 4 ? "#22c55e" : "#d1d5db"} />
            <text x="125" y="44" textAnchor="middle" fill="white">4</text>
            
            <circle cx="170" cy="80" r="12" fill={activePosition === 5 ? "#10b981" : "#d1d5db"} />
            <text x="170" y="84" textAnchor="middle" fill="white">5</text>
          </g>
        </svg>
      </div>
      
      {/* Score display */}
      <div className="flex flex-col items-center mt-2">
        <div className="bg-green-100 text-green-600 rounded-full px-4 py-1 font-medium text-lg">
          {score.toFixed(1)}
        </div>
        <div className="font-medium mt-1 text-gray-700">
          {consensus}
        </div>
      </div>
      
      {/* Legend */}
      <div className="flex justify-between w-full text-xs mt-4 px-2 text-gray-500">
        <div className="flex items-center">
          <span className="inline-block w-3 h-3 bg-red-500 rounded-full mr-1"></span>
          <span>Strong Sell</span>
        </div>
        <div className="flex items-center">
          <span className="inline-block w-3 h-3 bg-amber-400 rounded-full mr-1"></span>
          <span>Hold</span>
        </div>
        <div className="flex items-center">
          <span className="inline-block w-3 h-3 bg-green-500 rounded-full mr-1"></span>
          <span>Strong Buy</span>
        </div>
      </div>
    </div>
  );
};

// Main component
export const AnalystRatingsRedesign: React.FC<AnalystRatingsProps> = ({ 
  symbol, 
  companyName,
  onError,
  className 
}) => {
  // --- DATA FETCHING ---
  const { data: analystData, isLoading, error, isError } = useQuery<AnalystData | null>({
    queryKey: ['analystData', symbol],
    queryFn: () => getAnalystData(symbol),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
  
  // Report errors to parent if needed
  useEffect(() => {
    if (isError && error && onError) {
      onError(error as Error);
    }
  }, [isError, error, onError]);
  
  // Prepare data for visualization
  const chartData = useMemo(() => {
    if (!analystData?.distributionOverTime) {
      return [];
    }
    
    // Get month labels (we'll simulate 5 months of data as shown in the image)
    const monthLabels = generateMonthLabels(5);
    
    // Create chart data using real data for current month, and simulate past months
    // if we don't have historical data (to match reference design)
    const currentDistribution = analystData.distributionOverTime['0m'] || {
      strongBuy: 0, buy: 0, hold: 0, sell: 0, strongSell: 0
    };
    
    // Generate chart data
    return monthLabels.map((month, index) => {
      // Use real data for months we have, or generate simulated data for visualization
      const isCurrentMonth = index === monthLabels.length - 1;
      const dist = isCurrentMonth 
        ? currentDistribution
        : analystData.distributionOverTime[`-${index + 1}m`] || currentDistribution;
      
      return {
        month,
        strongBuy: dist.strongBuy,
        buy: dist.buy,
        hold: dist.hold,
        sell: dist.sell,
        strongSell: dist.strongSell,
        total: dist.strongBuy + dist.buy + dist.hold + dist.sell + dist.strongSell
      };
    });
  }, [analystData?.distributionOverTime]);
  
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
  
  // Extract score and consensus from the data
  const gaugeScore = analystData.gaugeScore || 3.0;
  const consensus = analystData.consensusKey || 'Buy';
  
  // Create the two-panel layout
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Left panel - Trend chart */}
      <Card className={cn("overflow-hidden", className)}>
        <CardHeader className="px-4 pt-4 pb-0">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-medium">
              Analyst Trends and Forecast
            </CardTitle>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-4 w-4 text-gray-400" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">
                    Shows the distribution of analyst ratings over time.
                    Each bar represents a month, stacked with different ratings.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardHeader>
        <CardContent className="p-0 h-[340px]">
          <div className="w-full h-full pt-6">
            <ResponsiveContainer width="100%" height="85%">
              <BarChart
                data={chartData}
                margin={{ top: 10, right: 30, left: 10, bottom: 20 }}
                barSize={40}
              >
                <XAxis 
                  dataKey="month" 
                  tickLine={false}
                  axisLine={false}
                  fontSize={12}
                  tick={{ fill: '#6b7280' }}
                />
                <YAxis hide={true} />
                
                {/* Strong Sell */}
                <Bar 
                  dataKey="strongSell" 
                  stackId="a" 
                  fill="#ef4444"
                >
                  <LabelList 
                    dataKey="strongSell" 
                    position="center" 
                    fill="white" 
                    formatter={(value: number) => (value > 0 ? value : '')} 
                  />
                </Bar>
                
                {/* Sell */}
                <Bar 
                  dataKey="sell" 
                  stackId="a" 
                  fill="#f97316"
                >
                  <LabelList 
                    dataKey="sell" 
                    position="center" 
                    fill="white" 
                    formatter={(value: number) => (value > 0 ? value : '')} 
                  />
                </Bar>
                
                {/* Hold */}
                <Bar 
                  dataKey="hold" 
                  stackId="a" 
                  fill="#facc15"
                >
                  <LabelList 
                    dataKey="hold" 
                    position="center" 
                    fill="white" 
                    formatter={(value: number) => (value > 0 ? value : '')} 
                  />
                </Bar>
                
                {/* Buy */}
                <Bar 
                  dataKey="buy" 
                  stackId="a" 
                  fill="#84cc16"
                >
                  <LabelList 
                    dataKey="buy" 
                    position="center" 
                    fill="white" 
                    formatter={(value: number) => (value > 0 ? value : '')} 
                  />
                </Bar>
                
                {/* Strong Buy */}
                <Bar 
                  dataKey="strongBuy" 
                  stackId="a" 
                  fill="#22c55e"
                >
                  <LabelList 
                    dataKey="strongBuy" 
                    position="center" 
                    fill="white" 
                    formatter={(value: number) => (value > 0 ? value : '')} 
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            
            {/* Legend */}
            <div className="flex items-center justify-center gap-2 mt-1 text-xs text-gray-600">
              <div className="flex items-center">
                <span className="inline-block w-3 h-3 bg-green-500 mr-1"></span>
                <span>Buy</span>
              </div>
              <div className="flex items-center ml-2">
                <span className="inline-block w-3 h-3 bg-yellow-400 mr-1"></span>
                <span>Hold</span>
              </div>
              <div className="flex items-center ml-2">
                <span className="inline-block w-3 h-3 bg-red-500 mr-1"></span>
                <span>Sell</span>
              </div>
              <div className="flex items-center ml-2">
                <span className="inline-block w-3 h-3 bg-red-700 mr-1"></span>
                <span>Strong Sell</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Right panel - Rating gauge */}
      <Card className={cn("overflow-hidden", className)}>
        <CardHeader className="px-4 pt-4 pb-0">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-medium">
              Analyst Rating and Forecast
            </CardTitle>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-4 w-4 text-gray-400" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">
                    Shows the consensus analyst rating on a scale of 1-5.
                    Higher scores indicate stronger buy recommendations.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardHeader>
        <CardContent className="p-0 flex items-center justify-center h-[320px]">
          <AnalystGauge 
            score={gaugeScore} 
            consensus={consensus}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalystRatingsRedesign;