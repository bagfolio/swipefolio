import { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  useAnalystRecommendations, 
  useUpgradeHistory,
  type AnalystRecommendation,
  type UpgradeHistoryItem
} from "@/lib/yahoo-finance-client";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { 
  ArrowDownIcon, 
  ArrowUpIcon, 
  InfoIcon, 
  Loader2Icon,
  BarChart2Icon,
  TrendingUpIcon
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { motion, AnimatePresence } from "framer-motion";

interface AnalystRatingsProps {
  symbol: string;
  companyName?: string;
}

const AnalystRatings: React.FC<AnalystRatingsProps> = ({ symbol, companyName }) => {
  const [activeTab, setActiveTab] = useState<'current' | 'history'>('current');
  
  // Fetch analyst recommendations data
  const { 
    data: recommendationsData, 
    isLoading: isRecommendationsLoading,
    error: recommendationsError
  } = useAnalystRecommendations(symbol);
  
  // Fetch upgrade/downgrade history
  const {
    data: upgradeHistoryData,
    isLoading: isHistoryLoading,
    error: historyError
  } = useUpgradeHistory(symbol);
  
  const isLoading = isRecommendationsLoading || isHistoryLoading;
  const hasError = recommendationsError || historyError;
  
  // Derived data for visualizations
  const ratingSummary = useMemo(() => {
    if (!recommendationsData) return null;
    
    const buyPercentage = recommendationsData.buyPercentage || 0;
    const holdPercentage = recommendationsData.holdPercentage || 0;
    const sellPercentage = recommendationsData.sellPercentage || 0;
    
    const buyCount = recommendationsData.strongBuy + recommendationsData.buy;
    const holdCount = recommendationsData.hold;
    const sellCount = recommendationsData.strongSell + recommendationsData.sell;
    
    // Calculate consensus score (1-5 scale, 1=Strong Sell, 5=Strong Buy)
    // This gives us a normalized score for the gauge
    const consensusScore = recommendationsData.averageRating || 3;
    const normalizedScore = ((consensusScore - 1) / 4) * 100; // Convert to 0-100 for the gauge
    
    return {
      buyPercentage,
      holdPercentage,
      sellPercentage,
      buyCount,
      holdCount,
      sellCount,
      consensusScore,
      normalizedScore,
      consensus: recommendationsData.consensus,
      total: recommendationsData.total,
      lastUpdated: recommendationsData.lastUpdated
    };
  }, [recommendationsData]);
  
  // Format label for consensus score
  const getConsensusLabel = (score?: number): string => {
    if (!score) return 'Neutral';
    
    if (score > 4.5) return 'Strong Buy';
    if (score > 3.75) return 'Buy';
    if (score > 3.25) return 'Outperform';
    if (score > 2.75) return 'Hold';
    if (score > 2.25) return 'Underperform';
    if (score > 1.5) return 'Sell';
    return 'Strong Sell';
  };
  
  // Get color for ratings based on consensus
  const getConsensusColor = (consensus?: string): string => {
    if (!consensus) return 'text-gray-500';
    
    switch (consensus) {
      case 'buy':
        return 'text-green-600';
      case 'sell':
        return 'text-red-600';
      case 'hold':
        return 'text-amber-500';
      default:
        return 'text-blue-500';
    }
  };
  
  // Get background color for gauge
  const getGaugeColor = (score?: number): string => {
    if (!score) return 'bg-gray-300';
    
    if (score > 4) return 'bg-green-500';
    if (score > 3) return 'bg-green-400';
    if (score > 2.75) return 'bg-amber-400';
    if (score > 2) return 'bg-amber-500';
    return 'bg-red-500';
  };
  
  // Get icon and style for action type
  const getActionDetails = (action: string) => {
    switch (action) {
      case 'upgrade':
        return {
          icon: <ArrowUpIcon className="h-4 w-4" />,
          badge: 'bg-green-100 text-green-800 border-green-300',
          text: 'Upgrade'
        };
      case 'downgrade':
        return {
          icon: <ArrowDownIcon className="h-4 w-4" />,
          badge: 'bg-red-100 text-red-800 border-red-300',
          text: 'Downgrade'
        };
      case 'init':
        return {
          icon: <InfoIcon className="h-4 w-4" />,
          badge: 'bg-blue-100 text-blue-800 border-blue-300',
          text: 'New Coverage'
        };
      case 'reiterated':
        return {
          icon: null,
          badge: 'bg-gray-100 text-gray-600 border-gray-300',
          text: 'Reiterated'
        };
      default:
        return {
          icon: null,
          badge: 'bg-gray-100 text-gray-600 border-gray-300',
          text: action.charAt(0).toUpperCase() + action.slice(1)
        };
    }
  };
  
  // Get color for rating grade
  const getRatingColor = (rating: string): string => {
    rating = rating.toLowerCase();
    
    if (rating.includes('buy') || rating.includes('outperform') || rating.includes('overweight')) {
      return 'text-green-600';
    } else if (rating.includes('sell') || rating.includes('underperform') || rating.includes('underweight')) {
      return 'text-red-600';
    } else if (rating.includes('neutral') || rating.includes('hold') || rating.includes('equal')) {
      return 'text-amber-500';
    } else {
      return 'text-gray-600';
    }
  };
  
  // Render loading state
  if (isLoading) {
    return (
      <Card className="w-full my-3 overflow-hidden">
        <CardContent className="p-4 flex items-center justify-center h-64">
          <Loader2Icon className="h-8 w-8 text-primary animate-spin" />
          <span className="ml-2">Loading analyst data...</span>
        </CardContent>
      </Card>
    );
  }
  
  // Render error state
  if (hasError) {
    return (
      <Card className="w-full my-3 overflow-hidden">
        <CardContent className="p-4">
          <div className="text-center text-red-500">
            <p>Error loading analyst data</p>
            <p className="text-sm text-gray-500 mt-1">
              {recommendationsError?.toString() || historyError?.toString()}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Render no data state
  if (!recommendationsData && !upgradeHistoryData) {
    return (
      <Card className="w-full my-3 overflow-hidden">
        <CardContent className="p-4">
          <div className="text-center text-gray-500">
            <p>No analyst data available for {companyName || symbol}</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="w-full my-3 overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Analyst Ratings</h3>
          
          {/* Tab toggle - styled as a modern switch */}
          <div className="relative flex items-center space-x-1 bg-gray-100 p-1 rounded-full">
            <button
              onClick={() => setActiveTab('current')}
              className={cn(
                "relative flex items-center rounded-full px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none",
                activeTab === 'current' ? "text-white" : "text-gray-500 hover:text-gray-900"
              )}
            >
              <BarChart2Icon className="h-4 w-4 mr-1.5" />
              <span>Current</span>
              {activeTab === 'current' && (
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
              <TrendingUpIcon className="h-4 w-4 mr-1.5" />
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
          {activeTab === 'current' ? (
            <motion.div 
              key="current-view"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {ratingSummary ? (
                <>
                  {/* Consensus Gauge */}
                  <div className="flex flex-col items-center justify-center pt-2">
                    <div className="relative w-44 h-22 flex flex-col items-center justify-center">
                      {/* Gauge background */}
                      <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className={cn("h-full transition-all duration-700 ease-out", getGaugeColor(ratingSummary.consensusScore))}
                          style={{ width: `${ratingSummary.normalizedScore}%` }}
                        />
                      </div>
                      
                      {/* Gauge markers */}
                      <div className="w-full flex justify-between mt-1 px-1">
                        <div className="h-1.5 w-0.5 bg-gray-300" />
                        <div className="h-1.5 w-0.5 bg-gray-300" />
                        <div className="h-1.5 w-0.5 bg-gray-300" />
                        <div className="h-1.5 w-0.5 bg-gray-300" />
                        <div className="h-1.5 w-0.5 bg-gray-300" />
                      </div>
                      
                      {/* Consensus text */}
                      <div className="mt-3 text-center">
                        <p className={cn("text-xl font-bold leading-none", getConsensusColor(ratingSummary.consensus))}>
                          {getConsensusLabel(ratingSummary.consensusScore)}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          Score: {ratingSummary.consensusScore.toFixed(1)}/5
                        </p>
                      </div>
                    </div>
                    
                    {/* Label scale */}
                    <div className="w-full flex justify-between text-xs text-gray-500 mt-1 px-1">
                      <span>Sell</span>
                      <span>Hold</span>
                      <span>Buy</span>
                    </div>
                  </div>
                  
                  {/* Distribution visualization */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-gray-700">Rating Distribution</h4>
                    
                    {/* Buy group */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-green-600">Buy</span>
                        <span className="text-sm font-medium">{ratingSummary.buyCount} ({Math.round(ratingSummary.buyPercentage)}%)</span>
                      </div>
                      <Progress value={ratingSummary.buyPercentage} className="h-2" indicatorClassName="bg-green-500" />
                    </div>
                    
                    {/* Hold group */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-amber-500">Hold</span>
                        <span className="text-sm font-medium">{ratingSummary.holdCount} ({Math.round(ratingSummary.holdPercentage)}%)</span>
                      </div>
                      <Progress value={ratingSummary.holdPercentage} className="h-2" indicatorClassName="bg-amber-400" />
                    </div>
                    
                    {/* Sell group */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-red-600">Sell</span>
                        <span className="text-sm font-medium">{ratingSummary.sellCount} ({Math.round(ratingSummary.sellPercentage)}%)</span>
                      </div>
                      <Progress value={ratingSummary.sellPercentage} className="h-2" indicatorClassName="bg-red-500" />
                    </div>
                  </div>
                  
                  {/* Summary stats */}
                  <div className="flex justify-between text-sm text-gray-500 pt-2">
                    <span>Based on {ratingSummary.total} analyst ratings</span>
                    <span>Updated: {ratingSummary.lastUpdated}</span>
                  </div>
                </>
              ) : (
                <div className="py-8 text-center text-gray-500">
                  No analyst recommendations available for {symbol}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div 
              key="history-view"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              {upgradeHistoryData && upgradeHistoryData.length > 0 ? (
                <>
                  <div className="flex justify-between items-center">
                    <h4 className="text-sm font-medium text-gray-700">Recent Rating Changes</h4>
                    <span className="text-xs text-gray-500">
                      Showing {Math.min(upgradeHistoryData.length, 8)} of {upgradeHistoryData.length}
                    </span>
                  </div>
                  
                  <div className="space-y-0 max-h-[350px] overflow-y-auto pr-1">
                    {upgradeHistoryData.slice(0, 8).map((item, index) => {
                      const actionDetails = getActionDetails(item.action);
                      
                      return (
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
                                  {item.date}
                                </span>
                              </div>
                              
                              <div className="flex items-center mt-1 text-sm">
                                {item.action !== 'init' && (
                                  <>
                                    <span className={cn("font-medium", getRatingColor(item.fromGrade))}>
                                      {item.fromGrade === "New Coverage" ? "New" : item.fromGrade}
                                    </span>
                                    <span className="mx-1.5 text-gray-400">→</span>
                                  </>
                                )}
                                <span className={cn("font-medium", getRatingColor(item.toGrade))}>
                                  {item.toGrade}
                                </span>
                              </div>
                            </div>
                            
                            <Badge 
                              variant="outline" 
                              className={cn(
                                "text-xs px-2 py-0.5 flex items-center", 
                                actionDetails.badge
                              )}
                            >
                              {actionDetails.icon && <span className="mr-1">{actionDetails.icon}</span>}
                              {actionDetails.text}
                            </Badge>
                          </div>
                          
                          {index < upgradeHistoryData.slice(0, 8).length - 1 && (
                            <Separator className="mt-3" />
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="py-8 text-center text-gray-500">
                  No analyst upgrade/downgrade history available
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};

export default AnalystRatings;