import { useState, useRef, useMemo, useCallback } from "react";
import { Link } from "wouter";
import { StockData } from "@/lib/stock-data";
import { getIndustryAverages } from "@/lib/industry-data";
import { 
  Info, 
  ChevronLeft, 
  ChevronRight, 
  RefreshCw, 
  DollarSign, 
  TrendingUp, 
  Shield, 
  Zap, 
  MessageCircle, 
  Calendar, 
  Lock,
  BarChart3,
  Layers
} from "lucide-react";
import { motion, useAnimation, useMotionValue, useTransform, PanInfo } from "framer-motion";
import MetricPopup from "./metric-popup-fixed";
import PortfolioImpactCalculator from "./portfolio-impact-calculator";
import OverallAnalysisCard from "@/components/overall-analysis-card";
import { Skeleton } from "@/components/ui/skeleton";
import ComparativeAnalysis from "@/components/comparative-analysis";
import AskAI from "./ask-ai";
import PurchaseSuccessModal from "./purchase-success-modal";

interface StockCardProps {
  stock: StockData;
  onNext: () => void;
  onPrevious: () => void;
  currentIndex: number;
  totalCount: number;
  nextStock?: StockData;
  displayMode?: 'simple' | 'realtime';
  // New stacking props
  indexInStack?: number; // Position in stack (0 = top card)
  totalInStack?: number; // Total cards in stack
}

type TimeFrame = "1D" | "5D" | "1M" | "6M" | "YTD" | "1Y" | "5Y" | "MAX";

// Helper to generate new chart data based on the selected time frame
const generateTimeBasedData = (data: number[], timeFrame: TimeFrame) => {
  // Create variations of the chart data based on timeframe
  switch(timeFrame) {
    case "1D":
      // 1-day data will be more volatile with hourly fluctuations
      return data.map((point, i) => point * (1 + Math.sin(i * 0.5) * 0.03));
    case "5D":
      // 5-day data will have bigger swings
      return data.map((point, i) => point * (1 + Math.sin(i * 0.3) * 0.05));
    case "1M":
      // Default monthly data
      return data;
    case "6M":
      // 6-month data will be smoother with an overall trend
      return data.map((point, i) => point * (1 + (i/data.length) * 0.1));
    case "1Y":
      // 1-year data with more pronounced trends
      return data.map((point, i) => point * (1 + Math.sin(i * 0.2) * 0.08 + (i/data.length) * 0.15));
    case "5Y":
      // 5-year data with longer cycles
      return data.map((point, i) => point * (1 + Math.sin(i * 0.1) * 0.12 + (i/data.length) * 0.3));
    case "MAX":
      // Lifetime data with very long cycles 
      return data.map((point, i) => point * (1 + Math.sin(i * 0.05) * 0.15 + (i/data.length) * 0.5));
    default:
      return data;
  }
};

// Function to get time scale labels based on timeframe
const getTimeScaleLabels = (timeFrame: TimeFrame): string[] => {
  switch(timeFrame) {
    case "1D":
      return ["9:30", "11:00", "12:30", "14:00", "15:30", "16:00"];
    case "5D":
      return ["Mon", "Tue", "Wed", "Thu", "Fri"];
    case "1M":
      return ["Week 1", "Week 2", "Week 3", "Week 4"];
    case "6M":
      return ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
    case "YTD":
      return ["Jan", "Mar", "May", "Jul", "Sep", "Nov"];
    case "1Y":
      return ["Jan", "Mar", "May", "Jul", "Sep", "Nov"];
    case "5Y":
      return ["2020", "2021", "2022", "2023", "2024"];
    case "MAX":
      return ["2015", "2017", "2019", "2021", "2023"];
    default:
      return ["9:30", "11:00", "12:30", "14:00", "15:30", "16:00"];
  }
};

// Function to get industry average metrics for the metric popup using our industry-data module
const getIndustryAverageData = (stock: StockData, metricType: string) => {
  // Get industry averages from our centralized data
  const industryAvgs = getIndustryAverages(stock.industry);

  // Format for display
  if (metricType === 'performance') {
    return [
      { label: "Revenue Growth", value: `${industryAvgs.performance.revenueGrowth}` },
      { label: "Profit Margin", value: `${industryAvgs.performance.profitMargin}` },
      { label: "Return on Capital", value: `${industryAvgs.performance.returnOnCapital}` }
    ];
  } else if (metricType === 'stability') {
    return [
      { label: "Volatility", value: `${industryAvgs.stability.volatility}` },
      { label: "Beta", value: `${industryAvgs.stability.beta}` },
      { label: "Dividend Consistency", value: `${industryAvgs.stability.dividendConsistency}` }
    ];
  } else if (metricType === 'value') {
    return [
      { label: "P/E Ratio", value: `${industryAvgs.value.peRatio}` },
      { label: "P/B Ratio", value: `${industryAvgs.value.pbRatio}` },
      { label: "Dividend Yield", value: `${industryAvgs.value.dividendYield}` }
    ];
  } else if (metricType === 'momentum') {
    return [
      { label: "3-Month Return", value: `${industryAvgs.momentum.threeMonthReturn}` },
      { label: "Relative Performance", value: `${industryAvgs.momentum.relativePerformance}` },
      { label: "RSI", value: `${industryAvgs.momentum.rsi}` }
    ];
  }

  // Default empty array if metric type is not recognized
  return [];
};

export default function StockCard({ 
  stock, 
  onNext, 
  onPrevious, 
  currentIndex, 
  totalCount,
  nextStock,
  displayMode = 'realtime',
  indexInStack = 0,  // Default to top card
  totalInStack = 1   // Default to single card
}: StockCardProps) {
  // Calculate stacking variables
  const zIndex = 100 - indexInStack; // Higher z-index for top card
  const scale = 1 - indexInStack * 0.05; // Card underneath is smaller
  const y = 0; // Keep cards at the same vertical position
  const stackOpacity = indexInStack === 0 ? 1 : 0.9; // Slight transparency for cards underneath
  const cardControls = useAnimation();
  const x = useMotionValue(0);
  // Smoother opacity transform for better visual experience
  const cardOpacity = useTransform(x, [-300, -100, 0, 100, 300], [0, 0.9, 1, 0.9, 0]);
  // Smoother rotation transform for more natural feel
  const cardRotate = useTransform(x, [-300, 0, 300], [-6, 0, 6]);
  // Scale effect for better tactile feel
  const cardScale = useTransform(x, [-300, -150, 0, 150, 300], [0.95, 0.97, 1, 0.97, 0.95]);
  // Preview opacity for the next card
  // We deleted the transform-based opacity effect in favor of direct calculations
  // to avoid TypeScript errors and simplify the animation logic
  const cardRef = useRef<HTMLDivElement>(null);

  const [timeFrame, setTimeFrame] = useState<TimeFrame>("1D");
  const [swipeDirection, setSwipeDirection] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showSkippedMessage, setShowSkippedMessage] = useState(false);

  // State for metric popup
  const [isMetricPopupOpen, setIsMetricPopupOpen] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<{
    name: string;
    color: "green" | "yellow" | "red";
    data: any;
  } | null>(null);

  // Unified modal state management to prevent iOS flickering issues
  const [modalState, setModalState] = useState<'closed' | 'calculator' | 'success'>('closed');
  const [purchaseData, setPurchaseData] = useState<{ 
    shares: number; 
    amount: number; 
    projectedReturn: number 
  } | null>(null);
  
  // Handle purchase completion - transition from calculator to success modal
  const handlePurchaseComplete = (data: { shares: number; amount: number; projectedReturn: number }) => {
    setPurchaseData(data);
    setModalState('success'); // Show success modal
  };

  // Handle success modal close - also move to next card after closing
  const handleSuccessModalClose = () => {
    setModalState('closed'); // Close the modal
    setPurchaseData(null);
    onNext(); // Trigger moving to the next card AFTER closing
  };

  // Use static data only
  const chartData = useMemo(() => 
    generateTimeBasedData(stock.chartData, timeFrame),
    [stock.chartData, timeFrame]
  );

  // Format display price
  const displayPrice = stock.price.toFixed(2);
  const realTimeChange = stock.change;

  // Calculate min/max for chart display
  const minValue = Math.min(...chartData) - 5;
  const maxValue = Math.max(...chartData) + 5;

  // Get time scale labels based on selected timeframe
  const timeScaleLabels = useMemo(() => 
    getTimeScaleLabels(timeFrame),
    [timeFrame]
  );

  // Calculate price range for Y-axis
  const priceRangeMin = Math.floor(minValue);
  const priceRangeMax = Math.ceil(maxValue);

  // Get current date for the trading day
  const latestTradingDay = new Date().toISOString().split('T')[0];

  // Function to refresh data - now just a visual effect with no actual data refresh
  const refreshData = async () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000); // Add a small delay for the animation
  };

  // Add a direct button for easier testing/accessibility (real-time mode only)
  const openPortfolioCalculator = () => {
    setModalState('calculator');
  };
  
  // Function to handle investment button click - used by the Buy button in stock detail page
  const handleInvestButtonClick = () => {
    openPortfolioCalculator();
  };

  // Simplified drag handler that works with AnimatePresence
  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    // Only allow the top card to be dragged
    if (indexInStack !== 0) return;
    
    const threshold = 100;

    if (displayMode === 'realtime') {
      // Right swipe (positive x) - Open portfolio impact calculator
      if (info.offset.x > threshold) {
        setSwipeDirection("right");
        // Haptic feedback if available
        if (navigator.vibrate) {
          navigator.vibrate(50);
        }
        
        // Spring back to center and show calculator
        cardControls.start({
          x: 0,
          opacity: 1,
          scale: 1,
          transition: { 
            type: "spring", 
            stiffness: 400, 
            damping: 30,
            duration: 0.3
          }
        });
        
        // Open calculator after animation completes
        setTimeout(() => {
          setModalState('calculator');
        }, 150);
        
        setSwipeDirection(null);
      } 
      // Left swipe (negative x) - Skip to next card
      else if (info.offset.x < -threshold) {
        setSwipeDirection("left");
        // Haptic feedback if available
        if (navigator.vibrate) {
          navigator.vibrate(30);
        }

        // Let the parent know to show the next card
        // AnimatePresence will handle the animation
        onNext();
        
        // Reset for potential re-use
        cardControls.set({ 
          x: 0, 
          opacity: 1,
          scale: 1 
        });
        
        setSwipeDirection(null);
      } 
      // Not enough drag - Spring back
      else {
        cardControls.start({
          x: 0,
          opacity: 1,
          scale: 1,
          transition: { 
            type: "spring", 
            stiffness: 500, 
            damping: 30,
            duration: 0.3
          }
        });
        setSwipeDirection(null);
      }
    } else {
      // Simple mode swipe handling
      if (info.offset.x > threshold) {
        // Right swipe - Go to previous
        setSwipeDirection("right");
        onPrevious();
        cardControls.set({ x: 0, opacity: 1, scale: 1 });
        setSwipeDirection(null);
      } else if (info.offset.x < -threshold) {
        // Left swipe - Go to next
        setSwipeDirection("left");
        onNext();
        cardControls.set({ x: 0, opacity: 1, scale: 1 });
        setSwipeDirection(null);
      } else {
        // Not enough drag - Return to center
        cardControls.start({
          x: 0,
          opacity: 1,
          scale: 1,
          transition: { type: "spring", stiffness: 300, damping: 25 }
        });
        setSwipeDirection(null);
      }
    }
  };

  // Handler for metric button clicks
  const handleMetricClick = (metricName: string) => {
    // Get color and data for the selected metric
    let color: "green" | "yellow" | "red" = "green";
    let metricObj;
    let metricDetails;

    switch(metricName) {
      case "Performance":
        metricObj = stock.metrics.performance;
        metricDetails = stock.metrics.performance.details;
        break;
      case "Stability":
        metricObj = stock.metrics.stability;
        metricDetails = stock.metrics.stability.details;
        break;
      case "Value":
        metricObj = stock.metrics.value;
        metricDetails = stock.metrics.value.details;
        break;
      case "Momentum":
        metricObj = stock.metrics.momentum;
        metricDetails = stock.metrics.momentum.details;
        break;
      default:
        return;
    }

    // Map color string to type
    if (metricObj.color === "green") color = "green";
    else if (metricObj.color === "yellow") color = "yellow";
    else if (metricObj.color === "red") color = "red";

    // Format metric values for display
    const metricValues = [];
    if (metricName === "Performance") {
      const perfDetails = metricDetails as { 
        revenueGrowth: number; 
        profitMargin: number; 
        returnOnCapital: number;
        revenueGrowthExplanation?: string;
        profitMarginExplanation?: string;
        returnOnCapitalExplanation?: string;
      };
      metricValues.push(
        { 
          label: "Revenue Growth", 
          value: perfDetails.revenueGrowth, 
          suffix: "%",
          explanation: perfDetails.revenueGrowthExplanation || "How much the company's total sales have grown compared to last year."
        },
        { 
          label: "Profit Margin", 
          value: perfDetails.profitMargin, 
          suffix: "%",
          explanation: perfDetails.profitMarginExplanation || "The percentage of sales that become profit after all expenses."
        },
        { 
          label: "Return on Capital", 
          value: perfDetails.returnOnCapital, 
          suffix: "%",
          explanation: perfDetails.returnOnCapitalExplanation || "How efficiently the company uses its investments to generate profits."
        }
      );
    } else if (metricName === "Stability") {
      const stabDetails = metricDetails as { 
        volatility: number; 
        beta: number; 
        dividendConsistency: string;
        volatilityExplanation?: string;
        betaExplanation?: string;
        dividendConsistencyExplanation?: string;
      };
      metricValues.push(
        { 
          label: "Volatility", 
          value: stabDetails.volatility, 
          suffix: "",
          explanation: stabDetails.volatilityExplanation || "How dramatically the stock price fluctuates; lower means more stable."
        },
        { 
          label: "Beta", 
          value: stabDetails.beta, 
          suffix: "",
          explanation: stabDetails.betaExplanation || "How much the stock moves relative to the market. 1.0 means it moves with the market."
        },
        { 
          label: "Dividend Consistency", 
          value: stabDetails.dividendConsistency, 
          suffix: "",
          explanation: stabDetails.dividendConsistencyExplanation || "How reliably the company pays and increases its dividends over time."
        }
      );
    } else if (metricName === "Value") {
      const valDetails = metricDetails as { 
        peRatio: number; 
        pbRatio: number; 
        dividendYield: number | "N/A";
        peRatioExplanation?: string;
        pbRatioExplanation?: string;
        dividendYieldExplanation?: string;
      };
      metricValues.push(
        { 
          label: "P/E Ratio", 
          value: valDetails.peRatio, 
          suffix: "",
          explanation: valDetails.peRatioExplanation || "The price you pay for each dollar of company earnings."
        },
        { 
          label: "P/B Ratio", 
          value: valDetails.pbRatio, 
          suffix: "",
          explanation: valDetails.pbRatioExplanation || "The price compared to the company's accounting book value."
        },
        { 
          label: "Dividend Yield", 
          value: valDetails.dividendYield === "N/A" ? "N/A" : valDetails.dividendYield, 
          suffix: valDetails.dividendYield === "N/A" ? "" : "%",
          explanation: valDetails.dividendYieldExplanation || "The percentage return you receive annually from dividends."
        }
      );
    } else if (metricName === "Momentum") {
      const momDetails = metricDetails as { 
        threeMonthReturn: number; 
        relativePerformance: number; 
        rsi: number;
        threeMonthReturnExplanation?: string;
        relativePerformanceExplanation?: string;
        rsiExplanation?: string;
      };
      metricValues.push(
        { 
          label: "3-Month Return", 
          value: momDetails.threeMonthReturn, 
          suffix: "%",
          explanation: momDetails.threeMonthReturnExplanation || "How much the stock price has changed in the last three months."
        },
        { 
          label: "Relative Performance", 
          value: momDetails.relativePerformance, 
          suffix: "%",
          explanation: momDetails.relativePerformanceExplanation || "How the stock has performed compared to the overall market."
        },
        { 
          label: "RSI", 
          value: momDetails.rsi, 
          suffix: "",
          explanation: momDetails.rsiExplanation || "Technical indicator showing if a stock is potentially oversold or overbought."
        }
      );
    }

    // Get industry average data
    const industryAverage = displayMode === 'realtime' 
      ? getIndustryAverageData(stock, metricName.toLowerCase())
      : [];

    // Set selected metric data and open popup
    setSelectedMetric({
      name: metricName,
      color,
      data: {
        values: metricValues,
        rating: metricObj.value,
        industryAverage,
        industry: stock.industry,
        explanation: metricObj.explanation || "",
        name: stock.name
      }
    });

    setIsMetricPopupOpen(true);
  };

  // Render appropriate stock card based on display mode
  if (displayMode === 'simple') {
    return (
      <div className="relative h-full w-full overflow-hidden">
        {/* Card stack container */}
        <div className="absolute inset-0 flex items-center justify-center top-4 md:top-12 -bottom-24">
          {/* Next card in stack (positioned behind) */}
          {nextStock && (
            <div 
              className="absolute inset-0 z-0 flex flex-col rounded-xl overflow-hidden"
              style={{
                transform: 'scale(0.92) translateY(20px)',
                opacity: 0.6,
                filter: 'blur(3px)'
              }}
            >
              {/* Very simple next card preview - improved with slate instead of black */}
              <div className="w-full h-full bg-slate-800 py-12 px-4 flex flex-col items-center justify-center">
                <div className="bg-slate-700/60 rounded-xl p-6 border border-slate-600/40 shadow-xl backdrop-blur-sm w-11/12 max-w-md flex flex-col items-center text-center space-y-4">
                  <h2 className="text-2xl font-bold text-white">{nextStock.name}</h2>
                  <p className="text-xl font-medium text-gray-300">{nextStock.ticker}</p>
                  <div className={`text-lg font-bold px-4 py-1 rounded-full ${nextStock.change >= 0 ? 'text-green-300 bg-green-900/30' : 'text-red-300 bg-red-900/30'}`}>
                    ${nextStock.price.toFixed(2)} <span>{nextStock.change >= 0 ? '↑' : '↓'} {Math.abs(nextStock.change)}%</span>
                  </div>

                  {/* Blurred content suggestion */}
                  <div className="w-3/4 h-2 bg-gray-500/50 rounded-full mt-2"></div>
                  <div className="w-2/3 h-2 bg-gray-500/50 rounded-full"></div>
                </div>
              </div>
            </div>
          )}

          {/* Main stock card - enhanced with softer shadows and better rounded corners */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-b from-slate-800 to-slate-900 rounded-xl overflow-y-auto"
            ref={cardRef}
            drag={indexInStack === 0 ? "x" : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.7}
            onDragEnd={handleDragEnd}
            animate={{
              y: indexInStack === 0 ? -250 : 0, // Significantly move top card up 
              scale,
              opacity: stackOpacity
            }}
            transition={{ type: "spring", stiffness: 400, damping: 40 }}
            whileDrag={{ scale: 0.98 }}
            style={{
              x,
              rotateZ: cardRotate,
              boxShadow: "0 20px 50px -15px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)",
              borderRadius: "16px",
              zIndex
            }}
          >
            {/* Page indicator */}
            <div className="sticky top-2 left-0 right-0 z-20 flex justify-center">
              <div className="bg-gray-800/80 backdrop-blur-sm rounded-full px-3 py-1 text-xs border border-gray-700">
                {currentIndex + 1} / {totalCount}
              </div>
            </div>

            {/* Enhanced Header with stock name and price */}
            <div className="p-5 border-b border-gray-800">
              <div className="flex justify-between items-start">
                <div>
                  <a 
                    href={`/stock-detail/${stock.ticker}`} 
                    className="group inline-flex items-center gap-1.5"
                    onClick={(e) => e.stopPropagation()} // Prevent triggering card swipe actions
                  >
                    <h2 className="text-xl md:text-2xl font-bold text-white mb-1 group-hover:text-blue-300 transition-colors">{stock.name} <span className="text-gray-400 group-hover:text-blue-400 transition-colors">({stock.ticker})</span></h2>
                    <BarChart3 size={20} className="text-gray-400 group-hover:text-blue-300 transition-colors" />
                  </a>
                  
                  {/* Day's range information */}
                  <div className="flex items-center text-xs text-gray-400 mt-1 mb-2">
                    <span className="mr-2">Day's Range:</span>
                    <span className="font-medium">${(parseFloat(stock.price.toFixed(2)) * 0.98).toFixed(2)} - ${(parseFloat(stock.price.toFixed(2)) * 1.02).toFixed(2)}</span>
                  </div>
                </div>
                
                <div className="flex flex-col items-end">
                  <div className={`flex items-center py-1.5 px-4 rounded-full ${stock.change >= 0 ? 'bg-green-900/30 text-green-300 border border-green-700/30' : 'bg-red-900/30 text-red-300 border border-red-700/30'} shadow-lg`}>
                    <span className="font-bold text-2xl">${stock.price.toFixed(2)}</span>
                    <span className="ml-2 text-sm font-medium">{stock.change >= 0 ? '+' : ''}{stock.change}%</span>
                  </div>
                  
                  <span className="text-xs text-gray-500 mt-2">Updated: {new Date().toLocaleDateString()}</span>
                </div>
              </div>

              <p className="mt-3 text-sm text-gray-300 leading-relaxed">
                {stock.description}
              </p>
            </div>

            {/* Performance Metrics - Enhanced Card Style */}
            <div className="grid grid-cols-2 gap-5 p-5 border-b border-gray-800">
              <h3 className="text-white text-lg font-bold col-span-2 mb-1 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-blue-400" />
                Stock Metrics
              </h3>
              
              {Object.entries(stock.metrics).map(([key, metricObj]) => {
                const metricName = key.charAt(0).toUpperCase() + key.slice(1);

                return (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: Math.random() * 0.3 }}
                    key={key}
                    className={`p-4 rounded-xl relative ${
                      metricObj.color === 'green' ? 'bg-gradient-to-br from-green-900/40 to-slate-900 border border-green-500/30' :
                      metricObj.color === 'yellow' ? 'bg-gradient-to-br from-yellow-900/40 to-slate-900 border border-yellow-500/30' : 
                      'bg-gradient-to-br from-red-900/40 to-slate-900 border border-red-500/30'
                    } active:scale-98 transition-all duration-150 cursor-pointer shadow-lg hover:shadow-xl`}
                    onClick={() => handleMetricClick(metricName)}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <div className="absolute top-3 right-3 rounded-full bg-black/30 p-1">
                      <Info size={16} className={`${
                        metricObj.color === 'green' ? 'text-green-400' :
                        metricObj.color === 'yellow' ? 'text-yellow-400' : 
                        'text-red-400'
                      }`} />
                    </div>
                    
                    <div 
                      className={`text-2xl font-bold ${
                        metricObj.color === 'green' ? 'text-green-300' :
                        metricObj.color === 'yellow' ? 'text-yellow-300' : 
                        'text-red-300'
                      }`}
                    >
                      {metricObj.value}
                    </div>
                    
                    <div className="text-white text-sm font-medium capitalize mt-1 mb-3">
                      {metricName}
                    </div>
                    
                    {/* Subtle glow effect */}
                    <div className={`absolute bottom-1 left-1 w-12 h-12 rounded-full opacity-20 blur-xl -z-10 ${
                      metricObj.color === 'green' ? 'bg-green-400' :
                      metricObj.color === 'yellow' ? 'bg-yellow-400' : 
                      'bg-red-400'
                    }`} />
                  </motion.div>
                );
              })}
            </div>

            {/* Stock Synopsis with AI Integration */}
            <div className="p-5 border-b border-gray-800">
              <h3 className="text-lg font-bold text-white mb-3 flex items-center">
                <MessageCircle className="w-5 h-5 mr-2 text-purple-400" />
                Ask AI About {stock.ticker}
              </h3>

              {/* Ask AI component integrated in dark mode with enhanced visuals */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="rounded-xl border border-gray-700/50 overflow-hidden shadow-lg relative"
              >
                {/* Subtle purple glow effect behind the component */}
                <div className="absolute -inset-1 bg-purple-500/5 blur-xl rounded-xl z-0"></div>
                <div className="relative z-10">
                  <AskAI stock={stock} />
                </div>
              </motion.div>
            </div>

            {/* Future predictions with enhanced premium styling */}
            <div className="p-5 border-b border-gray-800">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-amber-400" />
                Price Forecast 
                <span className="text-xs bg-gradient-to-r from-amber-800 to-amber-600 text-amber-100 px-3 py-1 rounded-full ml-2 shadow-inner shadow-amber-900/20 border border-amber-700/30">Premium</span>
              </h3>

              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
                className="grid grid-cols-2 gap-4"
              >
                <div>
                  <h4 className="text-sm font-medium text-gray-300 mb-2 flex items-center">
                    <Calendar className="w-4 h-4 mr-1 text-gray-400" />
                    1-Year Return
                  </h4>
                  <div className="p-3 bg-gradient-to-br from-gray-800/60 to-gray-900/60 rounded-lg border border-gray-700/50 shadow-lg">
                    <span className="text-white text-lg font-bold">{stock.oneYearReturn || "N/A"}</span>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-300 mb-2 flex items-center">
                    <Lock className="w-4 h-4 mr-1 text-amber-400" />
                    Predicted Price
                  </h4>
                  <div className="p-3 bg-gradient-to-br from-amber-900/20 to-gray-900/90 rounded-lg border border-amber-700/30 relative overflow-hidden shadow-lg">
                    <span className="text-white text-lg font-bold blur-sm select-none">{stock.predictedPrice || "$0.00"}</span>
                    <div className="absolute inset-0 flex items-center justify-center backdrop-blur-sm bg-black/30">
                      <div className="flex items-center bg-amber-800/90 text-amber-100 px-3 py-1.5 rounded-lg border border-amber-600/50 shadow-md">
                        <Lock className="w-4 h-4 mr-2" />
                        <span className="text-sm font-medium">Unlock with Premium</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Full analysis with enhanced styling */}
            <div className="p-5">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                <BarChart3 className="w-5 h-5 mr-2 text-blue-400" />
                Stock Analysis
              </h3>
              
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.4 }}
              >
                <OverallAnalysisCard stock={stock} />
              </motion.div>

              {/* Industry Position & Comparative Analysis */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.5 }}
                className="mt-4"
              >
                <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                  <Layers className="w-5 h-5 mr-2 text-indigo-400" />
                  Industry Comparison
                </h3>
                <ComparativeAnalysis currentStock={stock} />
              </motion.div>
              
              {/* Swipe call-to-action */}
              <div className="mt-8 mb-2 flex justify-center">
                <div className="text-gray-500 text-sm flex items-center">
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  <span>Swipe to navigate</span>
                  <ChevronRight className="w-4 h-4 ml-1" />
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Swipe indicators */}
        <div className="absolute top-1/2 left-4 z-20 transform -translate-y-1/2 opacity-50">
          <ChevronLeft size={40} className={`text-white/30 ${currentIndex === 0 ? 'invisible' : ''}`} />
        </div>
        <div className="absolute top-1/2 right-4 z-20 transform -translate-y-1/2 opacity-50">
          <ChevronRight size={40} className="text-white/30" />
        </div>

        {/* Metric Popup */}
        {isMetricPopupOpen && selectedMetric && (
          <MetricPopup
            isOpen={isMetricPopupOpen}
            onClose={() => setIsMetricPopupOpen(false)}
            metricName={selectedMetric.name}
            metricColor={selectedMetric.color}
            metricData={selectedMetric.data}
          />
        )}
      </div>
    );
  }

  // Real-time display mode
  return (
    <div className="relative h-full transform -translate-y-40" data-testid="stock-card">
      {/* Blurred background stock (next in stack) - visible during swipes */}
      {nextStock && (
        <div 
          className="absolute inset-0 overflow-hidden pointer-events-none"
          style={{
            opacity: Math.abs(x.get()) > 50 ? 0.7 : 0,
            transform: `translateX(${x.get() < 0 ? '60px' : '-60px'})`,
            filter: 'blur(5px)',
            zIndex: 0
          }}
        >
          {/* This is the actual next stock preview - without the black background that causes flashing */}
          <div className="w-full h-full bg-gradient-to-b from-slate-800 to-slate-900">
            <div className="h-full w-full flex flex-col">
              {/* Simplified header with stock symbol and name */}
              <div className="px-6 py-4 bg-slate-800/70 backdrop-blur-sm">
                <div className="text-xl font-bold text-white">{nextStock.ticker}</div>
                <div className="text-sm text-gray-300">{nextStock.name}</div>
              </div>
              
              {/* Simplified chart area */}
              <div className="flex-1 bg-slate-800/50 backdrop-blur-sm flex items-center justify-center">
                <div className="text-center text-gray-200">
                  <div className="text-2xl font-semibold">${nextStock.price.toFixed(2)}</div>
                  <div className={`text-sm font-medium ${nextStock.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {nextStock.change >= 0 ? '+' : ''}{nextStock.change.toFixed(2)}%
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Skipped message - shows when swiping left */}
      {showSkippedMessage && (
        <motion.div
          className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
        >
          <div className="text-xl font-semibold bg-red-800/90 text-white px-6 py-3 rounded-xl border border-red-500/40 shadow-xl">
            Stock Skipped
          </div>
        </motion.div>
      )}

      <motion.div
        className="h-full overflow-y-auto overflow-x-hidden pb-16 stock-card absolute inset-0"
        ref={cardRef}
        drag={indexInStack === 0 ? "x" : false}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.7}
        onDragEnd={handleDragEnd}
        animate={{
          y,
          scale,
          opacity: stackOpacity
        }}
        transition={{ type: "spring", stiffness: 400, damping: 40 }}
        style={{ 
          x, 
          rotateZ: cardRotate, 
          scale: cardScale,
          zIndex
        }}
      >
        {/* Time Frame Selector - Enhanced with better visual contrast */}
        <div className="flex justify-center space-x-1 px-4 py-3 border-b border-slate-100 bg-white shadow-sm">
          {["1D", "5D", "1M", "6M", "YTD", "1Y", "5Y", "MAX"].map((period) => (
            <button
              key={period}
              className={`px-3 py-1 text-xs rounded-full transition-all duration-200 ${
                timeFrame === period 
                  ? `${realTimeChange >= 0 ? 'text-green-600 bg-green-50 border border-green-200 shadow-sm' : 'text-red-600 bg-red-50 border border-red-200 shadow-sm'} font-medium` 
                  : 'text-slate-600 hover:bg-slate-50 border border-transparent'
              }`}
              onClick={() => setTimeFrame(period as TimeFrame)}
            >
              {period}
            </button>
          ))}
        </div>

        {/* Stock Price and Chart - Enhanced with better visual hierarchy */}
        <div className="bg-white p-4 flex flex-col border-b border-slate-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Link 
                to={`/stock-detail/${stock.ticker}`} 
                className="group flex items-center gap-1.5"
                onClick={(e: React.MouseEvent) => e.stopPropagation()} // Prevent triggering card swipe actions
              >
                <h2 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{stock.name}</h2>
                <span className="text-slate-500 font-medium bg-slate-50 px-2 py-0.5 rounded-md group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">{stock.ticker}</span>
                <BarChart3 size={18} className="text-slate-400 group-hover:text-blue-500 ml-1 transition-colors" />
              </Link>
            </div>
            <div className="flex items-center">
              <button 
                onClick={refreshData}
                className="p-1.5 rounded-full hover:bg-slate-100 transition-colors"
                disabled={isRefreshing}
              >
                <RefreshCw size={17} className={`text-slate-500 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          <div className="mt-2 flex items-center">
            <span className="text-3xl font-bold text-slate-900 drop-shadow-sm">${displayPrice}</span>
            <div className="ml-2 flex items-center">
              <span className={`flex items-center text-sm font-semibold px-2 py-0.5 rounded-full ${realTimeChange >= 0 ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'}`}>
                {realTimeChange >= 0 ? 
                  <TrendingUp size={14} className="mr-1" /> : 
                  <ChevronLeft size={14} className="mr-1 rotate-90" />}
                {realTimeChange >= 0 ? '+' : ''}{realTimeChange}%
              </span>
            </div>
          </div>
          
          {/* Day's range information */}
          <div className="mt-1 flex items-center text-xs text-slate-500">
            <span className="mr-2">Day's Range:</span>
            <span className="font-medium">${(parseFloat(displayPrice) * 0.98).toFixed(2)} - ${(parseFloat(displayPrice) * 1.02).toFixed(2)}</span>
          </div>

          {/* Chart placeholder - visualize the data */}
          <div className="relative mt-3 h-44 py-2">
            {/* Chart visual */}
            <div className="absolute inset-0 px-4">
              {/* Y-axis labels */}
              <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-[10px] text-slate-900 font-medium pointer-events-none py-3 z-10 w-12">
                <span>${Math.round(priceRangeMax)}</span>
                <span>${Math.round((priceRangeMax + priceRangeMin) / 2)}</span>
                <span>${Math.round(priceRangeMin)}</span>
              </div>

              {/* Chart path - dynamically draw based on chartData with extension to edge */}
              <div className="absolute inset-0 pl-12 pr-4">
                <svg className="w-full h-full" viewBox={`0 0 100 100`} preserveAspectRatio="none">
                  {/* Main chart line only - no fill */}
                  <path
                    d={`M-5,${100 - ((chartData[0] - minValue) / (maxValue - minValue)) * 100} ${chartData.map((point, i) => {
                      // Plot points with x-coordinates extending beyond the visible area
                      const x = (i / (chartData.length - 1)) * 110 - 5; // Extend from -5 to 105
                      const y = 100 - ((point - minValue) / (maxValue - minValue)) * 100;
                      return `L${x},${y}`;
                    }).join(' ')} L105,${100 - ((chartData[chartData.length-1] - minValue) / (maxValue - minValue)) * 100}`}
                    className={`${realTimeChange >= 0 ? 'stroke-green-500' : 'stroke-red-500'} fill-none`}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>

            {/* X-axis labels */}
            <div className="absolute left-0 right-0 bottom-1 pl-12 pr-4 flex justify-between text-[10px] text-slate-900 font-medium pointer-events-none">
              {timeScaleLabels.map((label, index) => (
                <span key={index}>{label}</span>
              ))}
            </div>
          </div>

          {/* Trading date and swipe instruction */}
          <div className="mt-4 flex items-center justify-between text-xs h-6">
            <span className="text-slate-900 font-medium">Last updated: {latestTradingDay}</span>
            <span className="text-slate-700 italic">Swipe <span className="text-red-600 font-medium">left to skip</span> • Swipe <span className="text-green-600 font-medium">right to invest</span></span>
          </div>
        </div>

        {/* Stock Metrics - Enhanced Card Style */}
        <div className="grid grid-cols-2 gap-4 p-4 bg-white border-b border-slate-100">
          {Object.entries(stock.metrics).map(([key, metricObj]) => {
            const metricName = key.charAt(0).toUpperCase() + key.slice(1);

            return (
              <div 
                key={key}
                className="group relative"
                onClick={() => handleMetricClick(metricName)}
              >
                {/* Background effect for hover that appears behind the card */}
                <div className={`absolute inset-0 rounded-xl blur-sm transform scale-[0.98] translate-y-1 opacity-0 group-hover:opacity-100 transition-all duration-300
                  ${metricObj.color === 'green' ? 'bg-gradient-to-r from-green-100/30 to-emerald-100/30' :
                  metricObj.color === 'yellow' ? 'bg-gradient-to-r from-amber-100/30 to-yellow-100/30' : 
                  'bg-gradient-to-r from-red-100/30 to-rose-100/30'}`}>
                </div>

                {/* Metric Card */}
                <div 
                  className={`p-4 rounded-xl border relative z-10 overflow-hidden active:scale-95 transition-all duration-150 cursor-pointer shadow-md hover:shadow-lg group-hover:translate-y-[-2px]
                    ${metricObj.color === 'green' ? 'bg-white border-green-200 group-hover:border-green-300' :
                    metricObj.color === 'yellow' ? 'bg-white border-amber-200 group-hover:border-amber-300' : 
                    'bg-white border-red-200 group-hover:border-red-300'}`}
                >
                  {/* Top gradient bar that appears on hover */}
                  <div className={`absolute top-0 left-0 w-full h-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300
                    ${metricObj.color === 'green' ? 'bg-gradient-to-r from-green-400 to-emerald-500' :
                    metricObj.color === 'yellow' ? 'bg-gradient-to-r from-amber-400 to-yellow-500' : 
                    'bg-gradient-to-r from-red-400 to-rose-500'}`}>
                  </div>

                  {/* Metric indicator with icon */}
                  <div className="flex items-center justify-between mb-2">
                    <div className={`flex items-center justify-center rounded-full w-8 h-8 
                      ${metricObj.color === 'green' ? 'bg-green-100 text-green-600' :
                       metricObj.color === 'yellow' ? 'bg-amber-100 text-amber-600' : 
                       'bg-red-100 text-red-600'}`}
                    >
                      {key === 'performance' && <TrendingUp size={16} />}
                      {key === 'stability' && <Shield size={16} />}
                      {key === 'value' && <DollarSign size={16} />}
                      {key === 'momentum' && <Zap size={16} />}
                    </div>
                    <Info size={15} className="text-slate-400 group-hover:text-slate-600 transition-colors" />
                  </div>

                  {/* Metric value and name */}
                  <div className={`text-lg font-semibold 
                    ${metricObj.color === 'green' ? 'text-slate-900' :
                     metricObj.color === 'yellow' ? 'text-slate-900' : 
                     'text-slate-900'}`}
                  >
                    {metricObj.value}
                  </div>
                  <div className="text-slate-500 text-sm font-medium mt-0.5 capitalize">{metricName}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Unified cards with consistent styling */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-md overflow-hidden mb-4">
          {/* Common background with slight highlight */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 to-indigo-50/30 rounded-xl opacity-30"></div>

          {/* Price Trend */}
          <div className="p-4 border-b border-slate-100 relative">
            <div className="flex items-center gap-4">
              <div className={`${realTimeChange >= 0 ? 'text-white bg-gradient-to-br from-green-400 to-green-600' : 'text-white bg-gradient-to-br from-red-400 to-red-600'} 
                w-12 h-12 min-w-12 flex items-center justify-center rounded-lg shadow-md`}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </div>
              <div className="flex-1 relative">
                <div className="font-bold text-slate-800 text-base flex items-center">
                  Price Trend
                  <div className={`ml-2 text-xs px-2 py-0.5 rounded-full ${realTimeChange >= 0 ? 'text-green-600 bg-green-50 border border-green-100' : 'text-red-600 bg-red-50 border border-red-100'}`}>
                    {realTimeChange >= 0 ? 'Bullish' : 'Bearish'}
                  </div>
                </div>
                <p className="text-slate-600 text-sm mt-1">
                  {stock.synopsis.price}
                </p>
              </div>
            </div>
          </div>

          {/* Company Overview */}
          <div className="p-4 border-b border-slate-100 relative">
            <div className="flex items-center gap-4">
              <div className="text-white bg-gradient-to-br from-blue-400 to-indigo-600 w-12 h-12 min-w-12 flex items-center justify-center rounded-lg shadow-md">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                </svg>
              </div>
              <div className="flex-1 relative">
                <div className="font-bold text-slate-800 text-base flex items-center">
                  Company Overview
                </div>
                <p className="text-slate-600 text-sm mt-1">
                  {stock.synopsis.company}
                </p>
              </div>
            </div>
          </div>

          {/* Portfolio Role */}
          <div className="p-4 relative">
            <div className="flex items-center gap-4">
              <div className="text-white bg-gradient-to-br from-violet-400 to-purple-600 w-12 h-12 min-w-12 flex items-center justify-center rounded-lg shadow-md">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M12 16v-4"></path>
                  <path d="M12 8h.01"></path>
                </svg>
              </div>
              <div className="flex-1 relative">
                <div className="font-bold text-slate-800 text-base flex items-center">
                  Portfolio Role
                </div>
                <p className="text-slate-600 text-sm mt-1">
                  {stock.synopsis.role}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Comparative Analysis Section - Modified for better touch interaction */}
        <div 
          className="bg-white border-t border-b border-slate-100 comparative-analysis-container"
          onClick={(e) => {
            // Only stop propagation if interacting with an interactive element
            if (e.target instanceof Element && 
                (e.target.closest('button') || e.target.closest('input') || 
                 e.target.closest('select') || e.target.closest('a'))) {
              e.stopPropagation();
            }
          }}
          // Remove touch handlers that interfere with mobile interactions
        >
          <ComparativeAnalysis currentStock={stock} />
        </div>
        
        {/* Ask AI Component has been removed */}

        {/* Bottom Swipe Instruction and View Details button */}
        <div className="p-4 bg-white border-t border-b border-slate-100 mb-4">
          <Link 
            to={`/stock-detail/${stock.ticker}`}
            className="block w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2.5 mb-3 text-center font-medium transition-colors"
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
          >
            View Detailed Chart
          </Link>
          <div className="text-center text-sm font-medium text-slate-600 my-2">
            Swipe <span className="text-red-600 font-medium">left to skip</span> • Swipe <span className="text-green-600 font-medium">right to invest</span>
          </div>
        </div>

        {/* Overall Analysis - Enhanced with consistent spacing */}
        {stock.overallAnalysis && (
          <div className="p-5 bg-gradient-to-b from-white to-slate-50">
            <div className="mb-1">
              <OverallAnalysisCard stock={stock} />
            </div>
          </div>
        )}
      </motion.div>

      {/* Metric Popup */}
      {selectedMetric && (
        <MetricPopup
          isOpen={isMetricPopupOpen}
          onClose={() => setIsMetricPopupOpen(false)}
          metricName={selectedMetric.name}
          metricColor={selectedMetric.color}
          metricData={selectedMetric.data}
        />
      )}

      {/* Hidden Buy Button - used for programmatic clicking */}
      <button 
        className="hidden"
        data-testid="buy-button"
        onClick={openPortfolioCalculator}
      >
        Buy
      </button>

      {/* Portfolio Impact Calculator - Unified state management */}
      {modalState === 'calculator' && (
        <PortfolioImpactCalculator
          isOpen={true} // Controlled by mounting/unmounting via modalState
          onClose={() => setModalState('closed')} // Directly close
          onPurchaseComplete={handlePurchaseComplete} // Pass completion handler
          stock={stock}
        />
      )}
      
      {/* Purchase Success Modal - Unified state management */}
      {modalState === 'success' && purchaseData && (
        <PurchaseSuccessModal
          isOpen={true} // Controlled by mounting/unmounting via modalState
          onClose={handleSuccessModalClose} // Use specific close handler
          stock={stock}
          shares={purchaseData.shares}
          amount={purchaseData.amount}
          projectedReturn={purchaseData.projectedReturn}
        />
      )}
    </div>
  );
}