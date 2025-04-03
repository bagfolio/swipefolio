import { useAnalystRecommendations } from "@/lib/yahoo-finance-client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { 
  ThumbsUp, 
  ThumbsDown, 
  PauseCircle, 
  Star, 
  StarHalf, 
  StarOff 
} from "lucide-react";

interface AnalystSentimentProps {
  symbol: string;
}

export function AnalystSentiment({ symbol }: AnalystSentimentProps) {
  const { data: recommendations, isLoading, error } = useAnalystRecommendations(symbol);

  if (isLoading) {
    return (
      <Card className="mb-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-md">Analyst Sentiment</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-32 flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground">Loading analyst data...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !recommendations) {
    return (
      <Card className="mb-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-md">Analyst Sentiment</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-32 flex items-center justify-center">
            <div className="text-muted-foreground text-center">
              <p>No analyst recommendations available</p>
              <p className="text-xs mt-1">Check back later for updates</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Colors for different consensus ratings
  const consensusColors = {
    buy: 'text-green-600 dark:text-green-500',
    sell: 'text-red-600 dark:text-red-500',
    hold: 'text-amber-600 dark:text-amber-500',
    neutral: 'text-slate-600 dark:text-slate-400',
  };

  // Function to render rating stars
  const renderRatingStars = (rating: number) => {
    // Round to nearest 0.5
    const roundedRating = Math.round(rating * 2) / 2;
    const stars = [];
    
    // Full stars
    for (let i = 1; i <= Math.floor(roundedRating); i++) {
      stars.push(<Star key={`star-${i}`} className="w-4 h-4 fill-amber-500 text-amber-500" />);
    }
    
    // Half star if needed
    if (roundedRating % 1 !== 0) {
      stars.push(<StarHalf key="half-star" className="w-4 h-4 fill-amber-500 text-amber-500" />);
    }
    
    // Empty stars
    const emptyStars = 5 - stars.length;
    for (let i = 1; i <= emptyStars; i++) {
      stars.push(<StarOff key={`empty-${i}`} className="w-4 h-4 text-gray-300" />);
    }
    
    return stars;
  };

  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-md">Analyst Sentiment</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Average Rating */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Average Rating:</span>
            <div className="flex items-center">
              <div className="flex mr-1">
                {renderRatingStars(recommendations.averageRating)}
              </div>
              <span className="text-sm font-semibold">
                {recommendations.averageRating.toFixed(1)}/5
              </span>
            </div>
          </div>
          
          {/* Consensus */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Consensus:</span>
            <div className="flex items-center">
              <span className={`text-sm font-semibold capitalize ${consensusColors[recommendations.consensus]}`}>
                {recommendations.consensus}
              </span>
              <span className="ml-1 text-xs text-muted-foreground">
                ({recommendations.lastUpdated})
              </span>
            </div>
          </div>
          
          {/* Buy Recommendation */}
          <div>
            <div className="flex items-center mb-1">
              <ThumbsUp className="w-4 h-4 text-green-600 mr-2" />
              <span className="text-xs font-medium">Buy</span>
              <span className="ml-auto text-xs font-medium">{Math.round(recommendations.buyPercentage)}%</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-green-600 transition-all duration-500 ease-out" 
                style={{ width: `${Math.min(recommendations.buyPercentage, 100)}%` }}
              ></div>
            </div>
            <div className="flex justify-between mt-1 text-xs text-muted-foreground">
              <span>Strong Buy: {recommendations.strongBuy}</span>
              <span>Buy: {recommendations.buy}</span>
            </div>
          </div>
          
          {/* Hold Recommendation */}
          <div>
            <div className="flex items-center mb-1">
              <PauseCircle className="w-4 h-4 text-amber-600 mr-2" />
              <span className="text-xs font-medium">Hold</span>
              <span className="ml-auto text-xs font-medium">{Math.round(recommendations.holdPercentage)}%</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-amber-600 transition-all duration-500 ease-out" 
                style={{ width: `${Math.min(recommendations.holdPercentage, 100)}%` }}
              ></div>
            </div>
            <div className="flex justify-between mt-1 text-xs text-muted-foreground">
              <span>Hold: {recommendations.hold}</span>
            </div>
          </div>
          
          {/* Sell Recommendation */}
          <div>
            <div className="flex items-center mb-1">
              <ThumbsDown className="w-4 h-4 text-red-600 mr-2" />
              <span className="text-xs font-medium">Sell</span>
              <span className="ml-auto text-xs font-medium">{Math.round(recommendations.sellPercentage)}%</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-red-600 transition-all duration-500 ease-out" 
                style={{ width: `${Math.min(recommendations.sellPercentage, 100)}%` }}
              ></div>
            </div>
            <div className="flex justify-between mt-1 text-xs text-muted-foreground">
              <span>Sell: {recommendations.sell}</span>
              <span>Strong Sell: {recommendations.strongSell}</span>
            </div>
          </div>
          
          <div className="text-xs text-center text-muted-foreground mt-2">
            Based on {recommendations.total} analyst recommendations
          </div>
        </div>
      </CardContent>
    </Card>
  );
}