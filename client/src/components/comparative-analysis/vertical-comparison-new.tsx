import React, { useState, useEffect } from "react";
import { StockData } from "../../lib/stock-data";
import { getIndustryStocks } from "../../lib/stock-data";
import { getAdvancedMetricScore } from "../../lib/advanced-metric-scoring";
import { getIndustryAverages } from "../../lib/industry-data";
import { marketAverages } from "../../lib/market-averages";

interface VerticalStockComparisonProps {
  currentStock: StockData;
  industry?: string;
}

interface ComparisonStockData {
  symbol: string;
  name: string;
  color: string;
  scores: {
    Performance: number;
    Stability: number;
    Value: number;
    Momentum: number;
  };
}

/**
 * A vertical comparison component that shows how a stock compares to ALL other stocks in its industry
 * using vertical bars for easy comparison.
 */
export default function VerticalStockComparison({
  currentStock,
  industry: propIndustry,
}: VerticalStockComparisonProps) {
  // Get the industry for the current stock (from props or the stock itself)
  const industry = propIndustry || currentStock.industry || "Other";

  // Load all stocks in this industry
  const allIndustryStocks: StockData[] = []; // Empty for now, we'll implement this properly later

  // State for UI controls
  const [selectedCompetitor, setSelectedCompetitor] = useState("");

  // Prepare industry averages and market data
  const industryAverages = getIndustryAverages(industry);

  // Create a mapping of all stocks with their scores
  const [industryStocksWithScores, setIndustryStocksWithScores] = useState<
    Record<string, ComparisonStockData>
  >({});
  
  const [currentStockScores, setCurrentStockScores] = useState<ComparisonStockData>({
    symbol: currentStock.ticker,
    name: currentStock.name,
    color: "#10b981", // emerald-500 for main stock
    scores: {
      Performance: 0,
      Stability: 0,
      Value: 0,
      Momentum: 0,
    },
  });

  // Selected competitor data
  const [competitorData, setCompetitorData] = useState<ComparisonStockData | null>(null);

  // Calculate scores for all stocks in the industry
  useEffect(() => {
    const calculateScores = () => {
      console.log(`Calculating scores for industry: ${industry}`);
      console.log(`Current stock: ${currentStock.ticker} (${currentStock.name})`);
      console.log(`All industry stocks found: ${allIndustryStocks.length}`);
      console.log("Industry stocks:", allIndustryStocks.map(stock => stock.ticker).join(", "));
      
      // Calculate scores for the current stock
      const mainPerformanceScore = getAdvancedMetricScore(currentStock, 'performance');
      const mainStabilityScore = getAdvancedMetricScore(currentStock, 'stability');
      const mainValueScore = getAdvancedMetricScore(currentStock, 'value');
      const mainMomentumScore = getAdvancedMetricScore(currentStock, 'momentum');
      
      console.log(`Main stock scores - Performance: ${mainPerformanceScore}, Stability: ${mainStabilityScore}, Value: ${mainValueScore}, Momentum: ${mainMomentumScore}`);
      
      setCurrentStockScores({
        symbol: currentStock.ticker,
        name: currentStock.name,
        color: '#10b981', // emerald-500 for main stock
        scores: {
          Performance: mainPerformanceScore,
          Stability: mainStabilityScore,
          Value: mainValueScore,
          Momentum: mainMomentumScore
        }
      });
      
      // Calculate scores for all other stocks in the industry
      const stockScoresMap: Record<string, ComparisonStockData> = {};
      
      // Process actual stocks from the industry
      console.log(`Processing ${allIndustryStocks.length} industry stocks for comparison...`);
      
      allIndustryStocks.forEach(stock => {
        // Skip the current stock as we already calculated it
        if (stock.ticker === currentStock.ticker) return;
        
        try {
          const performanceScore = getAdvancedMetricScore(stock, 'performance');
          const stabilityScore = getAdvancedMetricScore(stock, 'stability');
          const valueScore = getAdvancedMetricScore(stock, 'value');
          const momentumScore = getAdvancedMetricScore(stock, 'momentum');
          
          stockScoresMap[stock.ticker] = {
            symbol: stock.ticker,
            name: stock.name,
            color: '#a855f7', // purple-500 for competitors
            scores: {
              Performance: performanceScore,
              Stability: stabilityScore,
              Value: valueScore,
              Momentum: momentumScore
            }
          };
          
          console.log(`Added competitor ${stock.ticker} with scores - Performance: ${performanceScore}, Stability: ${stabilityScore}, Value: ${valueScore}, Momentum: ${momentumScore}`);
        } catch (error) {
          console.error(`Error calculating scores for ${stock.ticker}:`, error);
        }
      });
      
      console.log(`Total competitors found: ${Object.keys(stockScoresMap).length}`);
      setIndustryStocksWithScores(stockScoresMap);
      
      // Set initial competitor if available
      const competitorTickers = Object.keys(stockScoresMap);
      if (competitorTickers.length > 0 && !selectedCompetitor) {
        setSelectedCompetitor(competitorTickers[0]);
        setCompetitorData(stockScoresMap[competitorTickers[0]]);
        console.log(`Set initial competitor to: ${competitorTickers[0]}`);
      }
    };
    
    calculateScores();
  }, [currentStock, allIndustryStocks, industry, selectedCompetitor]);
  
  // Update competitor data when selection changes
  useEffect(() => {
    if (selectedCompetitor && industryStocksWithScores[selectedCompetitor]) {
      setCompetitorData(industryStocksWithScores[selectedCompetitor]);
    }
  }, [selectedCompetitor, industryStocksWithScores]);
  
  // Calculate industry and market benchmarks
  const industryBenchmarks = {
    Performance: 50, // Default value
    Stability: 50,   // Default value
    Value: 50,       // Default value
    Momentum: 50     // Default value
  };
  
  const marketBenchmarks = {
    Performance: 50, // Default value
    Stability: 50,   // Default value
    Value: 50,       // Default value
    Momentum: 50     // Default value
  };
  
  // Define the metrics to show
  const metrics = ['Performance', 'Stability', 'Value', 'Momentum'];

  // Check if we have competitor data available
  const hasCompetitors = Object.keys(industryStocksWithScores).length > 0;
  
  if (!hasCompetitors) {
    return (
      <div className="rounded-xl bg-white p-4 border border-gray-200">
        <div className="text-sm text-gray-600 font-medium">
          No other stocks available in this industry for comparison.
        </div>
      </div>
    );
  }
  
  return (
    <div className="comparison-container rounded-xl bg-white border border-gray-200 shadow-sm overflow-hidden">
      <div className="p-4">
        {/* Competitor selector - Enhanced & more visible */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-800 mb-2">Compare with competitor:</label>
          <div className="relative">
            <select 
              className="appearance-none w-full px-4 py-3 border border-gray-300 bg-white rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 text-gray-800 text-base transition-colors duration-200"
              value={selectedCompetitor}
              onChange={(e) => setSelectedCompetitor(e.target.value)}
            >
              {Object.entries(industryStocksWithScores).map(([ticker, data]) => (
                <option key={ticker} value={ticker} className="text-gray-800">
                  {data.name} ({ticker})
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-600">
              <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          <div className="mt-1 text-xs text-gray-500">
            {Object.keys(industryStocksWithScores).length} competitor stocks in {industry} industry
          </div>
        </div>
        
        {/* Legend with improved styling and clear text contrast */}
        <div className="flex items-center justify-between mb-4 px-2">
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 bg-emerald-500 rounded-full"></span>
            <span className="text-xs font-semibold text-gray-800">{currentStock.name} ({currentStock.ticker})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 bg-purple-500 rounded-full"></span>
            <span className="text-xs font-semibold text-gray-800">{competitorData?.name || ''} ({competitorData?.symbol || ''})</span>
          </div>
        </div>
        
        {/* Vertical bar comparison for each metric - Enhanced styling */}
        {competitorData && (
          <div className="space-y-6">
            {metrics.map(metric => {
              // Get values for this metric
              const mainValue = currentStockScores.scores[metric as keyof typeof currentStockScores.scores] || 0;
              const compValue = competitorData.scores[metric as keyof typeof competitorData.scores] || 0;
              const industryValue = industryBenchmarks[metric as keyof typeof industryBenchmarks] || 0;
              const marketValue = marketBenchmarks[metric as keyof typeof marketBenchmarks] || 0;
              
              // Determine higher value
              const mainHigher = mainValue > compValue;
              const compHigher = compValue > mainValue;
              
              // Calculate difference between stocks
              const difference = Math.abs(mainValue - compValue).toFixed(0);
              const diffText = mainHigher 
                ? `${currentStock.ticker} outperforms by ${difference} points` 
                : mainValue === compValue 
                  ? 'Equal performance' 
                  : `${competitorData.symbol} outperforms by ${difference} points`;
              
              return (
                <div key={metric} className="space-y-2 bg-gray-50 p-3 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div className="font-semibold text-gray-800">{metric}</div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center">
                        <span className="inline-block h-2 w-2 bg-gray-600 rounded-full mr-1"></span>
                        <span className="text-xs text-gray-600">Industry</span>
                      </div>
                      <div className="flex items-center">
                        <span className="inline-block h-2 w-2 bg-gray-400 rounded-full mr-1"></span>
                        <span className="text-xs text-gray-600">Market</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Main stock bar - Improved with shadow and animation */}
                  <div>
                    <div className="h-10 bg-gray-200 rounded-xl relative overflow-hidden shadow-inner">
                      <div 
                        className="h-full rounded-xl flex items-center justify-end pr-3 shadow-md"
                        style={{ 
                          width: `${mainValue}%`, 
                          backgroundColor: '#10b981', // Emerald-500 for consistency
                          transition: 'width 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)'
                        }}
                      >
                        {/* Only show text if bar is wide enough */}
                        {mainValue > 25 && (
                          <span className="text-sm font-bold text-white drop-shadow-md tracking-wide">{mainValue.toFixed(0)}</span>
                        )}
                      </div>
                      
                      {/* Show value outside the bar if it's too narrow */}
                      {mainValue <= 25 && (
                        <span className="absolute text-sm font-bold text-emerald-600 left-[101%] top-1/2 transform -translate-y-1/2">{mainValue.toFixed(0)}</span>
                      )}
                      
                      {/* Industry marker */}
                      <div 
                        className="absolute h-full w-1 bg-gray-600 z-10 shadow-md" 
                        style={{ left: `${industryValue}%` }}
                      ></div>
                      
                      {/* Market marker */}
                      <div 
                        className="absolute h-full w-1 bg-gray-400 z-10 shadow-md" 
                        style={{ left: `${marketValue}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  {/* Competitor stock bar */}
                  <div>
                    <div className="h-10 bg-gray-200 rounded-xl relative overflow-hidden shadow-inner">
                      <div 
                        className="h-full rounded-xl flex items-center justify-end pr-3 shadow-md"
                        style={{ 
                          width: `${compValue}%`, 
                          backgroundColor: '#a855f7', // Purple-500 for competitor
                          transition: 'width 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)'
                        }}
                      >
                        {/* Only show text if bar is wide enough */}
                        {compValue > 25 && (
                          <span className="text-sm font-bold text-white drop-shadow-md tracking-wide">{compValue.toFixed(0)}</span>
                        )}
                      </div>
                      
                      {/* Show value outside the bar if it's too narrow */}
                      {compValue <= 25 && (
                        <span className="absolute text-sm font-bold text-purple-600 left-[101%] top-1/2 transform -translate-y-1/2">{compValue.toFixed(0)}</span>
                      )}
                      
                      {/* Industry marker */}
                      <div 
                        className="absolute h-full w-1 bg-gray-600 z-10 shadow-md" 
                        style={{ left: `${industryValue}%` }}
                      ></div>
                      
                      {/* Market marker */}
                      <div 
                        className="absolute h-full w-1 bg-gray-400 z-10 shadow-md" 
                        style={{ left: `${marketValue}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  {/* Comparison summary */}
                  <div className="text-xs font-medium mt-1 text-center text-gray-600">
                    {diffText}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}