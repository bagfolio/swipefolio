import React, { useEffect, useState } from 'react';
import { StockData, getIndustryStocks } from '../../lib/stock-data';
import IndustryPosition from './industry-position';
import { getAdvancedMetricScore } from '../../lib/advanced-metric-scoring';

interface ComparativeAnalysisProps {
  currentStock: StockData;
}

interface StockScores {
  Performance: number;
  Stability: number;
  Value: number;
  Momentum: number;
}

/**
 * Main container component for comparative analysis.
 * Shows industry position card with toggle for detailed comparison.
 */
export default function ComparativeAnalysis({ currentStock }: ComparativeAnalysisProps) {
  const industry = currentStock.industry || 'Other';
  const [scores, setScores] = useState<StockScores>({
    Performance: 0,
    Stability: 0,
    Value: 0,
    Momentum: 0
  });
  const [rank, setRank] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Calculate the current stock's scores using the advanced scoring system
    const calcScores = {
      Performance: getAdvancedMetricScore(currentStock, "performance"),
      Stability: getAdvancedMetricScore(currentStock, "stability"),
      Value: getAdvancedMetricScore(currentStock, "value"),
      Momentum: getAdvancedMetricScore(currentStock, "momentum")
    };
    
    setScores(calcScores);
    
    // Load all stocks in this industry to calculate percentile rank
    const allIndustryStocks = getIndustryStocks(industry);
    
    // Calculate score percentile rank compared to all stocks in industry
    if (allIndustryStocks.length > 0) {
      // Get current stock's average score across all metrics
      const currentAvgScore = Object.values(calcScores).reduce((sum, val) => sum + val, 0) / 4;
      
      // Calculate scores for all other stocks
      const allScores = allIndustryStocks.map(stock => {
        const performanceScore = getAdvancedMetricScore(stock, "performance");
        const stabilityScore = getAdvancedMetricScore(stock, "stability");
        const valueScore = getAdvancedMetricScore(stock, "value");
        const momentumScore = getAdvancedMetricScore(stock, "momentum");
        
        // Calculate average score
        return (performanceScore + stabilityScore + valueScore + momentumScore) / 4;
      });
      
      // Sort all scores to find percentile
      const sortedScores = [...allScores].sort((a, b) => a - b);
      
      // Find the position of the current stock's score
      const position = sortedScores.findIndex(score => score >= currentAvgScore);
      
      // Calculate percentile (higher is better)
      const percentile = Math.round((position / sortedScores.length) * 100);
      setRank(percentile);
    } else {
      // Fallback if we don't have industry data
      setRank(50);
    }
    
    setIsLoading(false);
  }, [currentStock, industry]);

  return (
    <div className="comparative-analysis">
      {!isLoading && (
        <IndustryPosition 
          currentStock={currentStock}
          industry={industry}
          scores={scores}
          rank={rank}
        />
      )}
    </div>
  );
}