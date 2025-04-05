import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { 
  BarChart2, ArrowRight, InfoIcon, Loader2, 
  TrendingUp, TrendingDown, RotateCcw, Calendar 
} from 'lucide-react';

// UI Components
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Types
interface AnalystRatingsProps {
  symbol: string;
  className?: string;
}

// Rating data types
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
  distributionOverTime: Record<string, DistributionData>;
  ratingHistoryForChart: Array<{
    date: Date | null;
    firm: string;
    displayDate: string;
    actionType: string;
    standardizedToGrade: string;
    standardizedFromGrade: string;
  }>;
}

// Style constants - rating colors
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
  'upgrade': 'text-green-500 bg-green-50',
  'downgrade': 'text-red-500 bg-red-50',
  'maintain': 'text-amber-500 bg-amber-50',
  'init': 'text-blue-500 bg-blue-50',
};

const periodLabels: Record<string, string> = {
  '0m': 'Current',
  '-1m': '1 Month Ago',
  '-2m': '2 Months Ago',
  '-3m': '3 Months Ago',
};

// Fetch analyst data
async function fetchAnalystData(symbol: string): Promise<AnalystData | null> {
  try {
    const response = await fetch(`/api/yahoo-finance/analyst-data/${symbol}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch analyst data: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`Received analyst data for ${symbol}:`, data);
    return data;
  } catch (error) {
    console.error(`Error fetching analyst data for ${symbol}:`, error);
    throw error;
  }
}

// Calculate gauge score color
function getGaugeColor(score: number | null): string {
  if (!score) return 'bg-gray-300';
  
  if (score > 4) return 'bg-emerald-500'; // Strong Buy
  if (score > 3) return 'bg-green-500';   // Buy
  if (score > 2.5) return 'bg-amber-400'; // Hold
  if (score > 2) return 'bg-orange-500';  // Sell
  return 'bg-red-500';                    // Strong Sell
}

// Determine consensus text from score
function getConsensusText(score: number | null): string {
  if (!score) return 'N/A';
  
  if (score > 4.5) return 'Strong Buy';
  if (score > 3.5) return 'Buy';
  if (score > 2.5) return 'Hold';
  if (score > 1.5) return 'Sell';
  return 'Strong Sell';
}

// Gauge Chart Component
const AnalystGauge: React.FC<{ score: number | null }> = ({ score }) => {
  if (!score) return <div className="h-32 flex items-center justify-center text-gray-400">No score available</div>;
  
  // Normalize score to percentage (1-5 scale to 0-100%)
  const normalizedScore = ((score - 1) / 4) * 100;
  const consensus = getConsensusText(score);
  const gaugeColor = getGaugeColor(score);
  const textColor = ratingTextColors[consensus as keyof typeof ratingTextColors] || 'text-gray-500';
  
  return (
    <div className="flex flex-col items-center my-2">
      <div className="relative w-full h-6 px-6 mb-3">
        {/* Gauge track */}
        <div className="absolute top-0 left-0 w-full h-4 bg-gray-200 rounded-full overflow-hidden">
          {/* Gauge fill */}
          <motion.div 
            className={cn("h-full", gaugeColor)}
            initial={{ width: "0%" }}
            animate={{ width: `${normalizedScore}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>
        
        {/* Pointer */}
        <motion.div 
          className="absolute top-0 w-2 h-6 -ml-1"
          initial={{ left: "0%" }}
          animate={{ left: `${normalizedScore}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <div className="w-0 h-0 border-l-8 border-r-8 border-b-8 border-l-transparent border-r-transparent border-b-gray-700"></div>
        </motion.div>
        
        {/* Scale markers */}
        <div className="absolute top-5 left-0 w-full flex justify-between mt-2">
          {['Sell', 'Hold', 'Buy'].map((label, i) => (
            <div key={i} className="text-xs text-gray-500">{label}</div>
          ))}
        </div>
      </div>
      
      {/* Score and consensus display */}
      <div className="text-center mt-2">
        <div className={cn("text-lg font-semibold", textColor)}>{consensus}</div>
        <div className="text-sm text-gray-500">Score: {score.toFixed(1)}/5</div>
      </div>
    </div>
  );
};

// Rating Distribution Bar Chart
const RatingDistributionBars: React.FC<{ distribution: DistributionData }> = ({ distribution }) => {
  // Calculate total analysts
  const total = Object.values(distribution).reduce((sum, count) => sum + count, 0);
  
  if (total === 0) {
    return <div className="h-32 flex items-center justify-center text-gray-400">No ratings data available</div>;
  }
  
  // Format data for visualization
  const ratingData = [
    { label: 'Strong Buy', count: distribution.strongBuy, color: 'bg-emerald-500' },
    { label: 'Buy', count: distribution.buy, color: 'bg-green-500' },
    { label: 'Hold', count: distribution.hold, color: 'bg-amber-400' },
    { label: 'Sell', count: distribution.sell, color: 'bg-red-500' },
    { label: 'Strong Sell', count: distribution.strongSell, color: 'bg-red-700' },
  ];
  
  return (
    <div className="space-y-3 my-4">
      {ratingData.map((rating, index) => {
        const percentage = total > 0 ? (rating.count / total) * 100 : 0;
        
        return (
          <div key={index} className="space-y-1">
            <div className="flex justify-between text-sm">
              <span>{rating.label}</span>
              <span className="font-medium">{rating.count} ({percentage.toFixed(0)}%)</span>
            </div>
            <div className="h-3 w-full bg-gray-200 rounded-full overflow-hidden">
              <motion.div 
                className={cn("h-full", rating.color)}
                initial={{ width: "0%" }}
                animate={{ width: `${percentage}%` }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              />
            </div>
          </div>
        );
      })}
      
      <div className="text-sm text-center text-gray-500 mt-2">
        Based on {total} analyst ratings
      </div>
    </div>
  );
};

// Rating History Timeline Component
const RatingHistoryTimeline: React.FC<{ history: AnalystData['ratingHistoryForChart'] }> = ({ history }) => {
  if (!history || history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-gray-400">
        <RotateCcw className="h-8 w-8 mb-2 opacity-50" />
        <p>No rating history available</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4 my-2 max-h-[400px] overflow-y-auto pr-2">
      {history.slice(0, 10).map((item, index) => (
        <motion.div 
          key={index}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className="p-3 border rounded-lg hover:bg-gray-50 transition-colors"
        >
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center">
                <span className="font-medium">{item.firm}</span>
                <span className="text-xs text-gray-500 ml-2">{item.displayDate}</span>
              </div>
              
              <div className="flex items-center mt-1.5 text-sm">
                <Badge className={cn("mr-2", actionColors[item.actionType as keyof typeof actionColors] || 'bg-gray-100')}>
                  {item.actionType === 'init' ? 'New Coverage' : item.actionType}
                </Badge>
                
                {/* Rating change indication */}
                {item.actionType !== 'init' && item.standardizedFromGrade !== 'N/A' && (
                  <div className="flex items-center">
                    <span className={ratingTextColors[item.standardizedFromGrade as keyof typeof ratingTextColors] || 'text-gray-500'}>
                      {item.standardizedFromGrade}
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 mx-1 text-gray-400" />
                    <span className={ratingTextColors[item.standardizedToGrade as keyof typeof ratingTextColors] || 'text-gray-500'}>
                      {item.standardizedToGrade}
                    </span>
                  </div>
                )}
                
                {/* Initial rating display */}
                {item.actionType === 'init' && (
                  <span className={ratingTextColors[item.standardizedToGrade as keyof typeof ratingTextColors] || 'text-gray-500'}>
                    {item.standardizedToGrade}
                  </span>
                )}
              </div>
            </div>
            
            {/* Action icon */}
            <div>
              {item.actionType === 'upgrade' && <TrendingUp className="h-5 w-5 text-green-500" />}
              {item.actionType === 'downgrade' && <TrendingDown className="h-5 w-5 text-red-500" />}
              {item.actionType === 'maintain' && <BarChart2 className="h-5 w-5 text-amber-500" />}
              {item.actionType === 'init' && <InfoIcon className="h-5 w-5 text-blue-500" />}
            </div>
          </div>
        </motion.div>
      ))}
      
      {history.length > 10 && (
        <div className="text-center text-sm text-gray-500">
          Showing 10 of {history.length} rating changes
        </div>
      )}
    </div>
  );
};

// Period Selector for Historical Data
const PeriodSelector: React.FC<{ 
  periods: string[],
  selectedPeriod: string,
  onChange: (period: string) => void
}> = ({ periods, selectedPeriod, onChange }) => {
  return (
    <div className="flex items-center space-x-2 mb-4">
      <Calendar className="h-4 w-4 text-gray-500" />
      <span className="text-sm text-gray-500 mr-2">Period:</span>
      <div className="flex space-x-1">
        {periods.map((period) => (
          <Button 
            key={period}
            size="sm"
            variant={selectedPeriod === period ? "default" : "outline"}
            className="h-7 px-2 text-xs"
            onClick={() => onChange(period)}
          >
            {periodLabels[period] || period}
          </Button>
        ))}
      </div>
    </div>
  );
};

// Main Component
export const AnalystRatingsRedesign: React.FC<AnalystRatingsProps> = ({ symbol, className }) => {
  const [activeTab, setActiveTab] = useState<'snapshot' | 'history'>('snapshot');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('0m');
  
  // Fetch analyst data
  const { data: analystData, isLoading, error } = useQuery<AnalystData | null>({
    queryKey: ['analystData', symbol],
    queryFn: () => fetchAnalystData(symbol),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
  
  // Get available periods from data
  const availablePeriods = useMemo(() => {
    if (!analystData?.distributionOverTime) return ['0m'];
    return Object.keys(analystData.distributionOverTime).sort((a, b) => {
      // Sort '0m' first, then '-1m', '-2m', etc.
      const numA = parseInt(a.replace('m', ''), 10);
      const numB = parseInt(b.replace('m', ''), 10);
      return numA - numB;
    });
  }, [analystData?.distributionOverTime]);
  
  // Ensure selected period is valid
  React.useEffect(() => {
    if (availablePeriods && !availablePeriods.includes(selectedPeriod)) {
      setSelectedPeriod(availablePeriods[0] || '0m');
    }
  }, [availablePeriods, selectedPeriod]);
  
  // Get current distribution data based on selected period
  const currentDistribution = useMemo(() => {
    return analystData?.distributionOverTime?.[selectedPeriod] || 
           analystData?.distributionOverTime?.['0m'] || 
           { strongBuy: 0, buy: 0, hold: 0, sell: 0, strongSell: 0 };
  }, [analystData?.distributionOverTime, selectedPeriod]);
  
  // Loading state
  if (isLoading) {
    return (
      <Card className={cn("overflow-hidden", className)}>
        <CardContent className="p-6 flex items-center justify-center h-60">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
          <span className="ml-2">Loading analyst data...</span>
        </CardContent>
      </Card>
    );
  }
  
  // Error state
  if (error || !analystData) {
    return (
      <Card className={cn("overflow-hidden", className)}>
        <CardContent className="p-6 text-center">
          <div className="text-red-500 font-medium">Unable to load analyst data</div>
          <p className="text-sm text-gray-500 mt-1">
            {error instanceof Error ? error.message : 'Could not retrieve analyst recommendations'}
          </p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold flex items-center">
          Analyst Ratings
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <InfoIcon className="h-4 w-4 ml-2 text-gray-400 cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>Recommendations from {analystData.numberOfAnalysts} financial analysts covering this stock</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
        <CardDescription>
          Based on {analystData.numberOfAnalysts} analyst ratings
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pt-0 pb-4">
        <Tabs defaultValue="snapshot" value={activeTab} onValueChange={(val) => setActiveTab(val as 'snapshot' | 'history')}>
          <TabsList className="w-full mb-4">
            <TabsTrigger value="snapshot" className="flex-1">Current Snapshot</TabsTrigger>
            <TabsTrigger value="history" className="flex-1">Rating History</TabsTrigger>
          </TabsList>
          
          <TabsContent value="snapshot" className="space-y-4">
            {/* Period selector for snapshot tab */}
            <PeriodSelector 
              periods={availablePeriods}
              selectedPeriod={selectedPeriod}
              onChange={setSelectedPeriod}
            />
            
            {/* Consensus gauge */}
            <div className="mb-4">
              <h4 className="text-sm font-medium mb-2">Consensus Rating</h4>
              <AnalystGauge score={analystData.gaugeScore} />
            </div>
            
            {/* Rating distribution */}
            <div>
              <h4 className="text-sm font-medium mb-2">Rating Distribution</h4>
              <RatingDistributionBars distribution={currentDistribution} />
            </div>
          </TabsContent>
          
          <TabsContent value="history">
            <div>
              <h4 className="text-sm font-medium mb-3">Recent Rating Changes</h4>
              <RatingHistoryTimeline history={analystData.ratingHistoryForChart} />
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default AnalystRatingsRedesign;