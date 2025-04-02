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
import BackgroundStockCard from "./background-stock-card";

interface StockCardProps {
  stock: StockData;
  onNext: () => void;
  onPrevious: () => void;
  currentIndex: number;
  totalCount: number;
  nextStock?: StockData;
  displayMode?: 'simple' | 'realtime';
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
  displayMode = 'realtime'
}: StockCardProps) {
  const cardControls = useAnimation();
  const x = useMotionValue(0);
  // Smoother opacity transform for better visual experience
  const cardOpacity = useTransform(x, [-300, -100, 0, 100, 300], [0, 0.9, 1, 0.9, 0]);
  // Smoother rotation transform for more natural feel
  const cardRotate = useTransform(x, [-300, 0, 300], [-6, 0, 6]);
  // Scale effect for better tactile feel
  const cardScale = useTransform(x, [-300, -150, 0, 150, 300], [0.95, 0.97, 1, 0.97, 0.95]);
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

  // Enhanced drag handler with smoother transitions and feedback
  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 100;

    if (displayMode === 'realtime') {
      // Right swipe (positive x) - Open portfolio impact calculator
      if (info.offset.x > threshold) {
        setSwipeDirection("right");
        // Haptic feedback if available
        if (navigator.vibrate) {
          navigator.vibrate(50);
        }
        
        // Start spring-back animation first
        cardControls.start({
          x: 0,
          opacity: 1,
          scale: 1,
          transition: { 
            type: "spring", 
            stiffness: 400, 
            damping: 30,
            duration: 0.4
          }
        });
        
        // THEN, after a short delay, set the modal state to 'calculator'
        setTimeout(() => {
          setModalState('calculator');
        }, 150); // 150ms delay
        
        setSwipeDirection(null);
      } 
      // Left swipe (negative x) - Skip to next card
      else if (info.offset.x < -threshold) {
        setSwipeDirection("left");
        // Haptic feedback if available
        if (navigator.vibrate) {
          navigator.vibrate(30);
        }

        // Animate card off screen to the left
        cardControls.start({
          x: -500,
          opacity: 0,
          transition: { duration: 0.3 }
        }).then(() => {
          onNext();
          cardControls.set({ x: 0, opacity: 1 });
          setSwipeDirection(null);
        });
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
        // Right swipe
        setSwipeDirection("right");
        cardControls.start({
          x: window.innerWidth,
          opacity: 0,
          transition: { duration: 0.3 }
        }).then(() => {
          onPrevious();
          cardControls.set({ x: 0, opacity: 1 });
          setSwipeDirection(null);
        });
      } else if (info.offset.x < -threshold) {
        // Left swipe
        setSwipeDirection("left");
        cardControls.start({
          x: -window.innerWidth,
          opacity: 0,
          transition: { duration: 0.3 }
        }).then(() => {
          onNext();
          cardControls.set({ x: 0, opacity: 1 });
          setSwipeDirection(null);
        });
      } else {
        // Return to center
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
    let metricObj: any;
    let metricDetails: any;

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
    }

    // Set the selected metric data for the popup
    setSelectedMetric({
      name: metricName,
      color: color,
      data: metricValues
    });

    // Open the metric popup
    setIsMetricPopupOpen(true);
  };

  // Real-time display mode
  return (
    <div className="relative h-full" data-testid="stock-card">
      {/* Next stock preview card - Using dedicated background card component */}
      {nextStock && (
        <div 
          className="absolute inset-0 z-0"
          style={{
            transform: 'scale(0.92) translateY(20px)',
            opacity: 0.85
          }}
        >
          <BackgroundStockCard stock={nextStock} />
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
        className="h-full overflow-y-auto overflow-x-hidden pb-16 stock-card relative z-10 bg-white rounded-xl shadow-xl"
        ref={cardRef}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.7}
        onDragEnd={handleDragEnd}
        animate={cardControls}
        style={{ x, opacity: cardOpacity, rotateZ: cardRotate, scale: cardScale }}
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

        {/* Metric popup */}
        {selectedMetric && (
          <MetricPopup 
            isOpen={isMetricPopupOpen} 
            onClose={() => setIsMetricPopupOpen(false)}
            title={selectedMetric.name}
            color={selectedMetric.color}
            metrics={selectedMetric.data}
            industryAverages={getIndustryAverageData(stock, selectedMetric.name.toLowerCase())}
          />
        )}

        {/* Portfolio Impact Calculator Modal */}
        {modalState === 'calculator' && (
          <PortfolioImpactCalculator
            onClose={() => setModalState('closed')}
            onPurchaseComplete={handlePurchaseComplete}
            stock={stock}
          />
        )}

        {/* Purchase Success Modal */}
        {modalState === 'success' && purchaseData && (
          <PurchaseSuccessModal
            onClose={handleSuccessModalClose}
            stock={stock}
            shares={purchaseData.shares}
            amount={purchaseData.amount}
            projectedReturn={purchaseData.projectedReturn}
          />
        )}

        {/* Bottom Action Button */}
        <div className="p-4 bg-white border-t border-b border-slate-100 mb-4">
          <button
            onClick={openPortfolioCalculator}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2.5 text-center font-medium flex items-center justify-center"
          >
            <DollarSign size={18} className="mr-1" />
            Add to Portfolio
          </button>
        </div>
      </motion.div>
    </div>
  );
}