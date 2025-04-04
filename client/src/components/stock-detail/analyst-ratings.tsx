import { useState } from "react";
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
import { ArrowDownIcon, ArrowUpIcon, InfoIcon, Loader2Icon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

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
  
  // Color mapping for ratings/grades
  const getRatingColor = (rating: string): string => {
    rating = rating.toLowerCase();
    
    if (rating.includes('buy') || rating.includes('outperform') || rating.includes('overweight')) {
      return 'text-green-600';
    } else if (rating.includes('sell') || rating.includes('underperform') || rating.includes('underweight')) {
      return 'text-red-600';
    } else {
      return 'text-orange-500'; // neutral, hold, etc.
    }
  };
  
  // Get background color for rating bar
  const getRatingBarColor = (consensus: string): string => {
    switch (consensus) {
      case 'buy':
        return 'bg-green-500';
      case 'sell':
        return 'bg-red-500';
      case 'hold':
        return 'bg-orange-400';
      default:
        return 'bg-gray-400';
    }
  };
  
  // Get icon for upgrade/downgrade action
  const getActionIcon = (action: string) => {
    switch (action) {
      case 'upgrade':
        return <ArrowUpIcon className="h-4 w-4 text-green-500" />;
      case 'downgrade':
        return <ArrowDownIcon className="h-4 w-4 text-red-500" />;
      case 'init':
        return <InfoIcon className="h-4 w-4 text-blue-500" />;
      default:
        return null;
    }
  };
  
  // Get badge style for action type
  const getActionBadgeStyle = (action: string): string => {
    switch (action) {
      case 'upgrade':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'downgrade':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'init':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'reiterated':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };
  
  // Render loading state
  if (isLoading) {
    return (
      <Card className="w-full my-3">
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
      <Card className="w-full my-3">
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
  
  return (
    <Card className="w-full my-3">
      <CardContent className="p-4">
        <h3 className="text-lg font-semibold mb-3">Analyst Ratings</h3>
        
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'current' | 'history')} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="current">Current Ratings</TabsTrigger>
            <TabsTrigger value="history">Rating History</TabsTrigger>
          </TabsList>
          
          {/* Current Ratings Tab */}
          <TabsContent value="current" className="space-y-4">
            {recommendationsData ? (
              <div className="space-y-4">
                {/* Consensus & Rating Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Consensus:</span>
                    <span className={cn(
                      "font-bold capitalize",
                      getRatingColor(recommendationsData.consensus)
                    )}>
                      {recommendationsData.consensus}
                    </span>
                  </div>
                  
                  <Progress 
                    value={recommendationsData.buyPercentage} 
                    className="h-2" 
                    indicatorClassName={getRatingBarColor(recommendationsData.consensus)} 
                  />
                  
                  <div className="flex justify-between text-xs text-gray-500 pt-1">
                    <span>Strong Sell</span>
                    <span>Hold</span>
                    <span>Strong Buy</span>
                  </div>
                </div>
                
                {/* Analyst Breakdown */}
                <div className="space-y-2 pt-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Strong Buy:</span>
                        <span className="font-medium">{recommendationsData.strongBuy}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Buy:</span>
                        <span className="font-medium">{recommendationsData.buy}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Hold:</span>
                        <span className="font-medium">{recommendationsData.hold}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Sell:</span>
                        <span className="font-medium">{recommendationsData.sell}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Strong Sell:</span>
                        <span className="font-medium">{recommendationsData.strongSell}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Total Analysts:</span>
                        <span className="font-medium">{recommendationsData.total}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-3 text-xs text-gray-500">
                    Last Updated: {recommendationsData.lastUpdated}
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-gray-500">
                No analyst recommendations available for {symbol}
              </div>
            )}
          </TabsContent>
          
          {/* Rating History Tab */}
          <TabsContent value="history">
            {upgradeHistoryData && upgradeHistoryData.length > 0 ? (
              <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
                {upgradeHistoryData.slice(0, 10).map((item, index) => (
                  <div key={index} className="space-y-2">
                    {index > 0 && <Separator />}
                    <div className="pt-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{item.firm}</span>
                        <Badge variant="outline" className={cn("text-xs px-2 py-0.5", getActionBadgeStyle(item.action))}>
                          {getActionIcon(item.action)} 
                          <span className="ml-1">{item.action.charAt(0).toUpperCase() + item.action.slice(1)}</span>
                        </Badge>
                      </div>
                      
                      <div className="flex items-center text-sm mt-1">
                        <span 
                          className={cn(
                            "font-medium", 
                            getRatingColor(item.fromGrade)
                          )}
                        >
                          {item.fromGrade === "New Coverage" ? "New" : item.fromGrade}
                        </span>
                        
                        {item.action !== 'init' && (
                          <>
                            <span className="mx-1">→</span>
                            <span 
                              className={cn(
                                "font-medium", 
                                getRatingColor(item.toGrade)
                              )}
                            >
                              {item.toGrade}
                            </span>
                          </>
                        )}
                      </div>
                      
                      <div className="text-xs text-gray-500 mt-1">
                        {item.date}
                      </div>
                    </div>
                  </div>
                ))}
                
                {upgradeHistoryData.length > 10 && (
                  <div className="py-2 text-center text-xs text-gray-500">
                    Showing 10 of {upgradeHistoryData.length} ratings
                  </div>
                )}
              </div>
            ) : (
              <div className="py-8 text-center text-gray-500">
                No analyst upgrade/downgrade history available for {symbol}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default AnalystRatings;