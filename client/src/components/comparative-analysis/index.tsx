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
  const industry = currentStock?.industry || 'Other';
  const [scores, setScores] = useState<StockScores>({
    Performance: 0,
    Stability: 0,
    Value: 0,
    Momentum: 0
  });
  const [rank, setRank] = useState(50); // Default to middle ranking
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    if (!currentStock) {
      setIsLoading(false);
      return;
    }
    
    // Calculate the current stock's scores using the advanced scoring system
    const calcScores = {
      Performance: getAdvancedMetricScore(currentStock, "performance"),
      Stability: getAdvancedMetricScore(currentStock, "stability"),
      Value: getAdvancedMetricScore(currentStock, "value"),
      Momentum: getAdvancedMetricScore(currentStock, "momentum")
    };
    
    setScores(calcScores);
    
    // For now, just use a static rank until we implement the industry comparison properly
    setRank(65); // Placeholder rank - this would normally be calculated
    setIsLoading(false);
    
  }, [currentStock, industry]);

  return (
    <div className="comparative-analysis">
      {!isLoading && currentStock && (
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