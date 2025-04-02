import React, { useState, useEffect } from 'react';
import { ChevronDown, Award, TrendingUp, Shield, DollarSign, Zap, BarChart2 } from 'lucide-react';
import VerticalStockComparison from './vertical-comparison-new';
import MetricRankingPopup from './metric-ranking-popup';
import { StockData, getIndustryStocks } from '../../lib/stock-data';

interface IndustryPositionProps {
  currentStock: StockData;
  industry: string;
  scores: {
    Performance: number;
    Stability: number;
    Value: number;
    Momentum: number;
  };
  rank: number; // Percentile rank (0-100)
}

// Function to get letter grade based on percentile rank
const getGradeFromRank = (rank: number): string => {
  if (rank >= 90) return 'A+';
  if (rank >= 80) return 'A';
  if (rank >= 75) return 'A-';
  if (rank >= 70) return 'B+';
  if (rank >= 65) return 'B';
  if (rank >= 60) return 'B-';
  if (rank >= 55) return 'C+';
  if (rank >= 50) return 'C';
  if (rank >= 45) return 'C-';
  if (rank >= 40) return 'D+';
  if (rank >= 35) return 'D';
  if (rank >= 30) return 'D-';
  return 'F';
};

const IndustryPosition: React.FC<IndustryPositionProps> = ({
  currentStock,
  industry,
  scores,
  rank
}) => {
  const [showComparison, setShowComparison] = useState(false);
  const [industryStocks, setIndustryStocks] = useState<StockData[]>([]);
  const [industryStocksCount, setIndustryStocksCount] = useState(0);
  const [rankOrdinal, setRankOrdinal] = useState('');
  const stockGrade = getGradeFromRank(rank);
  
  // State for metric ranking popup
  const [isRankingPopupOpen, setIsRankingPopupOpen] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);

  // Get industry stocks and calculate actual rank position
  useEffect(() => {
    // Use an empty array for now - we'll properly implement this later
    const stocks: StockData[] = []; 
    setIndustryStocks(stocks);
    setIndustryStocksCount(stocks.length);
    
    // Calculate actual rank position (e.g., 3rd out of 10)
    if (stocks.length > 0) {
      const actualPosition = Math.max(1, Math.ceil(stocks.length * (1 - rank / 100)));
      const ordinal = getOrdinalSuffix(actualPosition);
      setRankOrdinal(`${actualPosition}${ordinal} of ${stocks.length}`);
    }
  }, [industry, rank]);

  // Function to get ordinal suffix (1st, 2nd, 3rd, etc.)
  const getOrdinalSuffix = (num: number): string => {
    const j = num % 10;
    const k = num % 100;
    if (j === 1 && k !== 11) return 'st';
    if (j === 2 && k !== 12) return 'nd';
    if (j === 3 && k !== 13) return 'rd';
    return 'th';
  };

  // Generate a more specific performance statement based on rank and actual position
  const getPerformanceStatement = () => {
    const name = currentStock.name;
    let statement = '';
    
    if (rank >= 80) {
      statement = `${name} stands out as a top performer in the ${industry} sector.`;
    } else if (rank >= 60) {
      statement = `${name} outperforms most competitors in the ${industry} sector.`;
    } else if (rank >= 40) {
      statement = `${name} delivers average performance for its ${industry} sector.`;
    } else if (rank >= 20) {
      statement = `${name} lags behind compared to others in the ${industry} sector.`;
    } else {
      statement = `${name} significantly underperforms within the ${industry} sector.`;
    }
    
    // Add rank information if available
    if (rankOrdinal) {
      statement += ` Ranked ${rankOrdinal} companies.`;
    }
    
    return statement;
  };

  // Get color for metric based on value
  const getMetricColor = (value: number) => {
    if (value >= 80) return 'text-emerald-600';
    if (value >= 60) return 'text-green-600';
    if (value >= 40) return 'text-amber-600';
    if (value < 40) return 'text-red-600';
    return 'text-gray-700';
  };

  // Get background color gradient for metric bubbles
  const getMetricBgGradient = (value: number) => {
    if (value >= 80) return 'bg-gradient-to-br from-emerald-400 to-emerald-600';
    if (value >= 60) return 'bg-gradient-to-br from-green-400 to-green-600';
    if (value >= 40) return 'bg-gradient-to-br from-amber-400 to-amber-600';
    return 'bg-gradient-to-br from-red-400 to-red-600';
  };

  // Get icon for each metric
  const getMetricIcon = (metricName: string) => {
    switch(metricName) {
      case 'Performance': return <TrendingUp className="h-4 w-4" />;
      case 'Stability': return <Shield className="h-4 w-4" />;
      case 'Value': return <DollarSign className="h-4 w-4" />;
      case 'Momentum': return <Zap className="h-4 w-4" />;
      default: return null;
    }
  };

  // Toggle comparison view
  const toggleComparison = () => {
    setShowComparison(!showComparison);
  };
  
  // Handle opening the metric ranking popup
  const handleMetricClick = (metricName: string) => {
    setSelectedMetric(metricName);
    setIsRankingPopupOpen(true);
  };
  
  // Close the metric ranking popup
  const closeRankingPopup = () => {
    setIsRankingPopupOpen(false);
  };

  // Calculate average score
  const averageScore = Object.values(scores).reduce((sum, score) => sum + score, 0) / 4;

  return (
    <div className="mt-6">
      {/* Industry Position Card with subtle pattern background */}
      <div className="border border-gray-200 rounded-xl shadow-sm overflow-hidden bg-white relative">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 opacity-5 pointer-events-none" 
             style={{ 
               backgroundImage: `radial-gradient(circle, #3b82f6 1px, transparent 1px)`,
               backgroundSize: '20px 20px' 
             }}>
        </div>
        
        <div className="p-5 relative border-b border-gray-100">
          <div className="flex flex-wrap justify-between items-start mb-4 gap-4">
            <div className="flex-1">
              <div className="flex items-center">
                <h3 className="text-xl font-bold text-gray-900">Industry Position</h3>
                <div className="ml-2 px-2 py-0.5 bg-blue-50 rounded-full border border-blue-100 text-xs font-medium text-blue-600">
                  {industry}
                </div>
              </div>
              
              {/* Enhanced performance statement with specific ranking */}
              <p className="text-gray-700 text-sm font-medium mt-2">{getPerformanceStatement()}</p>
            </div>
            
            {/* Modern Grade Circle with Progress Indicator */}
            <div className="relative h-24 w-24 flex-shrink-0">
              {/* Outer semi-circular track */}
              <div className="absolute inset-0 rounded-full overflow-hidden">
                <div className="w-full h-full bg-gray-100"></div>
                {/* Colored progress arc */}
                <div className="absolute top-0 left-0 w-full h-full"
                     style={{ 
                       clipPath: `polygon(50% 50%, 50% 0, ${50 + 50 * Math.sin(rank * 0.01 * 2 * Math.PI)}% ${50 - 50 * Math.cos(rank * 0.01 * 2 * Math.PI)}%, 50% 50%)`,
                       background: `conic-gradient(from 0deg, hsl(${Math.min(120, rank * 1.2)}, 70%, 50%) ${rank}%, transparent ${rank}%)`
                     }}>
                </div>
                {/* Inner white circle */}
                <div className="absolute inset-[15%] bg-white rounded-full shadow-inner"></div>
                
                {/* Grade content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-sm font-bold tracking-wide" 
                       style={{ color: `hsl(${Math.min(120, rank * 1.2)}, 70%, 45%)` }}>
                    {stockGrade}
                  </div>
                  <div className="flex items-center gap-0.5 mt-1">
                    <BarChart2 className="h-3 w-3 text-blue-500" />
                    <span className="text-xs font-semibold text-gray-600">{rank}<span className="text-xs font-normal">%</span></span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Metric Scores - Enhanced with modern design and better responsiveness */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
            {Object.entries(scores).map(([metric, score]) => (
              <div 
                key={metric} 
                className="relative group"
                onClick={() => handleMetricClick(metric)}
              >
                {/* Background glow effect on hover */}
                <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-30 transition-opacity duration-300 blur-sm -m-1"
                     style={{ backgroundColor: score >= 60 ? '#10b981' : score >= 40 ? '#f59e0b' : '#ef4444' }}></div>
                
                {/* Metric card with improved design */}
                <div className="bg-white border border-gray-200 p-3 rounded-xl shadow-sm group-hover:shadow-md transition-all duration-300 flex flex-col items-center cursor-pointer active:scale-95">
                  {/* Progress circle */}
                  <div className="relative w-10 h-10 mb-2">
                    {/* Background circle */}
                    <div className="absolute inset-0 rounded-full bg-gray-100"></div>
                    
                    {/* Progress circle */}
                    <div className="absolute inset-0 rounded-full"
                         style={{ 
                           background: `conic-gradient(${score >= 60 ? '#10b981' : score >= 40 ? '#f59e0b' : '#ef4444'} ${score}%, transparent ${score}%)` 
                         }}>
                    </div>
                    
                    {/* Inner white circle */}
                    <div className="absolute inset-[15%] bg-white rounded-full"></div>
                    
                    {/* Icon */}
                    <div className={`absolute inset-0 flex items-center justify-center ${score >= 60 ? 'text-emerald-600' : score >= 40 ? 'text-amber-600' : 'text-red-600'}`}>
                      {getMetricIcon(metric)}
                    </div>
                  </div>
                  
                  <p className="text-xs font-semibold text-gray-700 mb-1">{metric}</p>
                  <p className={`text-lg font-bold ${getMetricColor(score)}`}>
                    {score}
                  </p>
                </div>
              </div>
            ))}
          </div>
          
          {/* Compare Button - Enhanced with gradient and animation */}
          <button 
            className="w-full mt-5 py-3.5 px-4 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl flex items-center justify-center transition-all duration-300 font-semibold shadow-md hover:shadow-lg transform hover:-translate-y-0.5 active:translate-y-0"
            onClick={toggleComparison}
          >
            <span className="mr-2">{showComparison ? 'Hide Comparison' : 'See How It Compares'}</span>
            <ChevronDown className={`h-5 w-5 transition-transform duration-300 ${showComparison ? 'transform rotate-180' : ''}`} />
          </button>
        </div>
        
        {/* Comparison Section (toggled) - Improved transition and slight background color */}
        <div className={`overflow-hidden transition-all duration-500 ease-in-out bg-gray-50 ${showComparison ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
          <div className="p-4">
            <VerticalStockComparison 
              currentStock={currentStock}
              industry={industry}
            />
          </div>
        </div>
      </div>
      
      {/* Metric Ranking Popup */}
      {selectedMetric && (
        <MetricRankingPopup
          isOpen={isRankingPopupOpen}
          onClose={closeRankingPopup}
          metricName={selectedMetric}
          currentStock={currentStock}
          industryStocks={industryStocks}
        />
      )}
    </div>
  );
};

export default IndustryPosition;