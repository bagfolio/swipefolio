import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart2, TrendingUp, TrendingDown, ArrowUpRight,
  InfoIcon, RotateCcw, Calendar, Loader2
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { format, isValid } from 'date-fns'; // Keep date-fns import if needed for display elsewhere

// Components
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
// import { Progress } from '@/components/ui/progress'; // Can remove if not using bars
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

// Utils
import { cn } from '@/lib/utils';

// --- Keep Types (Assuming they match the service output) ---
interface DistributionData {
  strongBuy: number;
  buy: number;
  hold: number;
  sell: number;
  strongSell: number;
}

interface AnalystData {
  consensusKey: string;
  consensusMean: number | null;
  numberOfAnalysts: number;
  gaugeScore: number | null;
  distributionOverTime: Record<string, DistributionData>; // Expecting '0m', '-1m', etc.
  ratingHistoryForChart: Array<{
    date: Date | null;
    firm: string;
    displayDate: string;
    actionType: string;
    standardizedToGrade: string;
    standardizedFromGrade: string;
  }>;
}

interface ModernAnalystRatingsProps {
  symbol: string;
  companyName?: string;
  onError?: (error: Error) => void;
  className?: string;
}

// --- REMOVE Locally Defined Helper Functions ---
// REMOVE: standardizeRating() - This logic is in the service
// REMOVE: calculateGaugeScore() - This logic is in the service
// REMOVE: getAnalystData() - This entire async function should be removed from the component file

// --- Keep Color/Period Maps ---
const ratingColors = { /* ... colors ... */ };
const ratingTextColors = { /* ... colors ... */ };
const actionBgColors = { /* ... colors ... */ };
const actionIcons = { // Map action types to icons
  upgrade: <TrendingUp className="h-5 w-5 text-green-500" />,
  downgrade: <TrendingDown className="h-5 w-5 text-red-500" />,
  maintain: <BarChart2 className="h-5 w-5 text-amber-500" />,
  init: <InfoIcon className="h-5 w-5 text-blue-500" />,
};
const periodMap: Record<string, string> = {
  '0m': 'Current',
  '-1m': '1 Mo Ago',
  '-2m': '2 Mo Ago',
  '-3m': '3 Mo Ago',
};


// --- Gauge Component (Looks OK, keep as is or refine styling) ---
const AnalystGauge: React.FC<{score: number; consensus: string; className?: string}> = ({ /* ... props ... */ }) => {
    // ... existing gauge implementation ...
    // Make sure getGaugeColorClass and getConsensusTextColor helpers are defined or imported if needed here
};

// Helper function for Gauge color (can live here or be imported)
function getGaugeColorClass(score: number | null): string {
  if (score === null) return 'bg-gray-300';
  if (score > 4) return 'bg-emerald-500';
  if (score > 3.5) return 'bg-green-500'; // Adjusted threshold
  if (score > 2.5) return 'bg-amber-400';
  if (score >= 2) return 'bg-orange-500'; // Adjusted threshold
  return 'bg-red-500';
}

// Helper function for Consensus text color (can live here or be imported)
function getConsensusTextColor(consensus: string): string {
    return ratingTextColors[consensus as keyof typeof ratingTextColors] || 'text-gray-500';
}


// --- DistributionDonut Component (Modified as per previous instructions) ---
const DistributionDonut: React.FC<{
  distribution: DistributionData;
}> = ({ distribution }) => {
   // ... Use the previously provided corrected code for DistributionDonut ...
   // Ensure it defines ALL segments and calculates total correctly
   // Ensure it DOES NOT display totalAnalysts in the center
};

// --- RatingTimeline Component (Placeholder for Chart) ---
const RatingTimeline: React.FC<{
  history: AnalystData['ratingHistoryForChart']; // Use type from AnalystData
}> = ({ history }) => {
   // ... Use the previously provided code with chart implementation instructions/placeholder ...
};


// --- Main Component ---
export const ModernAnalystRatings: React.FC<ModernAnalystRatingsProps> = ({
  symbol,
  companyName,
  onError,
  className
}) => {
  const [activeTab, setActiveTab] = useState<'snapshot' | 'history'>('snapshot');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('0m');

  // --- CORRECTED DATA FETCHING using useQuery and hitting the *single* backend endpoint ---
  const { data: analystData, isLoading, error, isError } = useQuery<AnalystData | null>({
    queryKey: ['analystData', symbol],
    // *** THIS IS THE CRUCIAL CHANGE: Point to the correct single API endpoint ***
    queryFn: async () => {
       // Use the actual endpoint that calls the service on the backend
      const response = await fetch(`/api/analyst-data/${symbol}`); // ADJUST ENDPOINT AS NEEDED
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({})); // Try to get error details
        throw new Error(errorData.message || `Failed to fetch analyst data for ${symbol}`);
      }
      const data = await response.json();
      // **Optional but Recommended:** Add validation here to ensure 'data' matches 'AnalystData' type
      // Convert date strings back to Date objects if needed for the timeline chart library
      if (data?.ratingHistoryForChart) {
          data.ratingHistoryForChart = data.ratingHistoryForChart.map((item: any) => ({
              ...item,
              date: item.date ? new Date(item.date) : null // Ensure date is a Date object
          }));
      }
      return data as AnalystData; // Cast after processing/validation
    },
    // --- End of queryFn ---
    staleTime: 15 * 60 * 1000, // 15 minutes (adjust as needed)
    refetchOnWindowFocus: false,
  });
  // --- END CORRECTED DATA FETCHING ---

  useEffect(() => {
    if (isError && error && onError) {
      onError(error as Error);
    }
  }, [isError, error, onError]);

  // --- Calculate Available Periods (Should work now if service provides the data) ---
  const availablePeriods = useMemo(() => {
    if (!analystData?.distributionOverTime) return ['0m'];
    return Object.keys(analystData.distributionOverTime).sort((a, b) => {
      const numA = parseInt(a.replace('m', ''), 10);
      const numB = parseInt(b.replace('m', ''), 10);
      return numA - numB;
    });
  }, [analystData?.distributionOverTime]);

  // Ensure selectedPeriod is valid
  useEffect(() => {
    if (availablePeriods.length > 0 && !availablePeriods.includes(selectedPeriod)) {
      setSelectedPeriod(availablePeriods[0]); // Default to the first available (usually '0m')
    }
  }, [availablePeriods, selectedPeriod]);


  if (isLoading) {
    // ... Loading state ...
  }

  if (isError || !analystData) {
    // ... Error state ...
  }


  // --- Prepare Data for Display ---
  const defaultDistribution: DistributionData = { strongBuy: 0, buy: 0, hold: 0, sell: 0, strongSell: 0 };
  const currentDistribution = analystData.distributionOverTime?.[selectedPeriod] || defaultDistribution;
  const totalAnalysts = analystData.numberOfAnalysts;
  const consensusScore = analystData.gaugeScore ?? 3; // Use ?? for nullish coalescing

  // Data for Legend/List - Includes ALL categories
  const fullDistributionData = [
    { label: 'Strong Buy', count: currentDistribution.strongBuy || 0, colorClass: ratingColors['Strong Buy'], textColorClass: ratingTextColors['Strong Buy'] },
    { label: 'Buy', count: currentDistribution.buy || 0, colorClass: ratingColors['Buy'], textColorClass: ratingTextColors['Buy'] },
    { label: 'Hold', count: currentDistribution.hold || 0, colorClass: ratingColors['Hold'], textColorClass: ratingTextColors['Hold'] },
    { label: 'Sell', count: currentDistribution.sell || 0, colorClass: ratingColors['Sell'], textColorClass: ratingTextColors['Sell'] },
    { label: 'Strong Sell', count: currentDistribution.strongSell || 0, colorClass: ratingColors['Strong Sell'], textColorClass: ratingTextColors['Strong Sell'] }
  ];

  // --- Render Logic ---
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-4">
        {/* Header & Tab Toggle */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center">
            <BarChart2 className="h-5 w-5 mr-2 text-primary" /> Analyst Ratings
          </h3>
          {/* Snapshot/History Toggle */}
          <div className="relative flex items-center space-x-1 bg-gray-100 p-1 rounded-full">
             {/* Snapshot Button */}
             <button onClick={() => setActiveTab('snapshot')} /* ... styling ... */ >
                <BarChart2 className="h-4 w-4 mr-1.5" /> Snapshot
                {activeTab === 'snapshot' && <motion.div layoutId="active-tab" /* ... animation ... */ />}
             </button>
             {/* History Button */}
             <button onClick={() => setActiveTab('history')} /* ... styling ... */ >
                 <Calendar className="h-4 w-4 mr-1.5" /> History
                 {activeTab === 'history' && <motion.div layoutId="active-tab" /* ... animation ... */ />}
             </button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'snapshot' ? (
            <motion.div key="snapshot-view" /* ... animations ... */ className="space-y-6">
              {/* Snapshot Layout */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-around gap-6">
                {/* Gauge */}
                <AnalystGauge score={consensusScore} consensus={analystData.consensusKey || 'N/A'} />

                {/* Distribution Section */}
                <div className="flex flex-col items-center space-y-3">
                   {/* --- Time Period Toggle Buttons --- */}
                   {/* Render only if actual historical data exists */}
                   {availablePeriods.length > 1 && (
                      <div className="flex justify-center flex-wrap gap-2 mb-2">
                          {availablePeriods.map(period => (
                              <Button key={period} /* ... props ... */ onClick={() => setSelectedPeriod(period)}>
                                 {periodMap[period] || period}
                              </Button>
                          ))}
                      </div>
                   )}
                   {/* Display message if only current data is available */}
                   {/* {availablePeriods.length <= 1 && (
                       <p className="text-xs text-muted-foreground mb-2">(Current data only)</p>
                   )} */}

                   {/* Donut Chart */}
                   <DistributionDonut distribution={currentDistribution} />

                   {/* Total Analysts Text */}
                   <p className="text-sm text-muted-foreground mt-2">
                      Based on {totalAnalysts} analyst{totalAnalysts !== 1 ? 's' : ''}
                   </p>
                </div>
              </div>

              {/* --- Legend/List (Showing ALL Categories) --- */}
              <div className="space-y-2 mt-4">
                 <h4 className="text-sm font-medium text-center md:text-left text-gray-700">
                   Rating Breakdown ({periodMap[selectedPeriod] || selectedPeriod})
                 </h4>
                 {fullDistributionData.map(item => {
                   const percentage = totalAnalysts > 0 ? (item.count / totalAnalysts) * 100 : 0;
                   return (
                     <div key={item.label} className="flex justify-between items-center text-sm py-0.5"> {/* Added padding */}
                       <span className={cn("font-medium w-20", item.textColorClass || ratingTextColors['N/A'])}> {/* Fixed width */}
                         {item.label}
                       </span>
                       <span className="font-medium text-gray-600 text-right w-20"> {/* Fixed width & alignment */}
                         {item.count} ({Math.round(percentage)}%)
                       </span>
                     </div>
                   );
                 })}
              </div>
            </motion.div> /* End Snapshot View */

          ) : ( /* History View */
            <motion.div key="history-view" /* ... animations ... */>
              <RatingTimeline history={analystData.ratingHistoryForChart} />
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};

export default ModernAnalystRatings;