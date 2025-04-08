// File: client/src/components/ui/stock-card.tsx
import { useState, useRef, useMemo, useEffect, useCallback } from "react";
import { Link } from "wouter";
import { StockData } from "@/lib/stock-data";
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
  Layers,
  Check,
  X,
  Building,
  Clock,
  ExternalLink
} from "lucide-react";
import { motion, useAnimation, useMotionValue, useTransform, PanInfo, AnimationControls } from "framer-motion";
import OverallAnalysisCard from "@/components/overall-analysis-card";
import { Skeleton } from "@/components/ui/skeleton";
import ComparativeAnalysis from "@/components/comparative-analysis";
import AskAI from "./ask-ai";
import { getIndustryAverages } from "@/lib/industry-data";
import StockNewsSection from "@/components/stock-news/StockNewsSection"; // Ensure import
import AnalystRatings from "@/components/stock-detail/analyst-ratings"; // Legacy Analyst Ratings
import ModernAnalystRatings from "@/components/stock-detail/modern-analyst-ratings"; // Modern Analyst Ratings
import AnalystRatingsRedesign from "@/components/stock-detail/analyst-ratings-redesign"; // New Redesigned Analyst Ratings
import HistoricalPerformanceChart from "@/components/stock-detail/historical-performance-chart"; // Import HistoricalPerformanceChart
import {
  useYahooChartData,
  extractChartPrices,
  getYahooTimeScaleLabels,
  timeFrameToRange,
  YahooChartResponse // Import the type
} from "@/lib/yahoo-finance-client";
import { cn } from "@/lib/utils"; // Make sure cn is imported

// Define Metric structure used in handleMetricClick callback
export interface MetricClickData {
  name: string;
  color: "green" | "yellow" | "red";
  data: any; // Keep the detailed data structure needed by the modal
}

interface StockCardProps {
  stock: StockData;
  onNext?: () => void;
  onPrevious?: () => void;
  onInvest?: () => void;
  onMetricClick?: (metricData: MetricClickData) => void; // Callback for parent
  onOpenCalculator?: () => void; // Callback for parent
  currentIndex: number;
  totalCount: number;
  displayMode?: 'simple' | 'realtime'; // Keep displayMode if needed elsewhere
  cardControls?: AnimationControls; // Optional controls from parent
  x?: ReturnType<typeof useMotionValue<number>>; // Optional motion value from parent
}

// Define TimeFrame type locally if not imported
type TimeFrame = "1D" | "5D" | "1M" | "6M" | "YTD" | "1Y" | "5Y" | "MAX";

// Helper function to get industry average data (keep if needed for metrics)
const getIndustryAverageData = (stock: StockData, metricType: string) => {
    const industryAvgs = getIndustryAverages(stock.industry);
    if (!industryAvgs) return [];

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
    return [];
};


export default function StockCard({
  stock,
  onNext,
  onPrevious,
  onInvest,
  onMetricClick,
  onOpenCalculator,
  currentIndex,
  totalCount,
  displayMode = 'realtime', // Default to realtime
  cardControls,
  x // Optional motion value from parent
}: StockCardProps) {

  // Create a local motion value if none is provided from the parent
  const localX = useMotionValue(0);
  const xToUse = x ?? localX;

  // Use the appropriate motion value
  const cardOpacity = useTransform(xToUse, [-200, 0, 200], [0.5, 1, 0.5]);
  const cardRotate = useTransform(xToUse, [-200, 0, 200], [-10, 0, 10]);
  const cardScale = useTransform(xToUse, [-200, 0, 200], [0.95, 1, 0.95]);

  const cardRef = useRef<HTMLDivElement>(null);

  // Internal state for UI ONLY within the card
  const [timeFrame, setTimeFrame] = useState<TimeFrame>("1D");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch Yahoo Finance data with stable arguments to fix React Hook dependency issue
  const stockTicker = useMemo(() => stock.ticker, [stock.ticker]);
  const selectedTimeFrame = useMemo(() => timeFrame, [timeFrame]);
  
  const { data: yahooChartData, isLoading: isLoadingYahooData, error: yahooError, refetch: refetchYahooData } =
    useYahooChartData(stockTicker, selectedTimeFrame);

  // Process Yahoo Finance chart data
  const chartPrices = useMemo(() => {
    if (yahooChartData?.quotes && yahooChartData.quotes.length > 0) {
      const closePrices = yahooChartData.quotes
        .map(quote => typeof quote.close === 'number' ? quote.close : 0)
        .filter(price => price > 0);

      if (closePrices.length > 0) {
        // Sampling logic for 1D/5D remains the same
         if (timeFrame === "1D" || timeFrame === "5D") {
          if (closePrices.length > 50) {
            const samplingRate = Math.floor(closePrices.length / 30);
            return closePrices.filter((_, i) => i % samplingRate === 0 || i === closePrices.length - 1);
          }
        }
        return closePrices;
      }
    }
    console.warn(`No valid Yahoo Finance chart data for <span class="math-inline">\{stock\.ticker\} \(</span>{timeFrame}). Displaying empty chart.`);
    return []; // Return empty array if no valid data
  }, [timeFrame, yahooChartData, stock.ticker]);

  // --- Get current/closing price exclusively from Yahoo Finance data ---
  const yahooCurrentPrice = useMemo(() => {
    if (yahooChartData?.quotes && yahooChartData.quotes.length > 0) {
      // Get the latest price from Yahoo Finance data
      const lastQuote = yahooChartData.quotes[yahooChartData.quotes.length - 1];
      return lastQuote.close || lastQuote.open || lastQuote.high || lastQuote.low || 0;
    }
    return 0; // Will only show if Yahoo data is not loaded yet
  }, [yahooChartData]);
  
  // Calculate day's price range strictly from Yahoo data
  const dayRange = useMemo(() => {
    if (yahooChartData?.quotes && yahooChartData.quotes.length > 0) {
      let low = Number.MAX_VALUE;
      let high = 0;
      
      // Find min/max across all quotes
      yahooChartData.quotes.forEach(quote => {
        if (quote.low && quote.low < low) low = quote.low;
        if (quote.high && quote.high > high) high = quote.high;
      });
      
      if (low !== Number.MAX_VALUE && high !== 0) {
        return { low, high };
      }
    }
    // Return zeros which will hide the range display if not available
    return { low: 0, high: 0 };
  }, [yahooChartData]);
  
  // Calculate price change strictly from Yahoo data
  const priceChange = useMemo(() => {
    if (yahooChartData?.quotes && yahooChartData.quotes.length > 0) {
      const firstQuote = yahooChartData.quotes[0];
      const lastQuote = yahooChartData.quotes[yahooChartData.quotes.length - 1];
      
      // Get accurate open and close prices
      const openPrice = firstQuote.open || firstQuote.close || firstQuote.high || firstQuote.low || 0;
      const closePrice = lastQuote.close || lastQuote.open || lastQuote.high || lastQuote.low || 0;
      
      if (openPrice > 0 && closePrice > 0) {
        // Calculate change amount
        const change = closePrice - openPrice;
        // Calculate percentage change
        const percentChange = (change / openPrice) * 100;
        
        return {
          value: change,
          percent: percentChange
        };
      }
    }
    
    // Return zeros which will hide the change indicator if not available
    return {
      value: 0,
      percent: 0
    };
  }, [yahooChartData]);
  
  // Format for display - will only show valid data when Yahoo data is available
  const displayPrice = yahooCurrentPrice > 0 ? yahooCurrentPrice.toFixed(2) : "--";
  const realTimeChange = priceChange.percent;

  // Calculate min/max for chart axis exclusively from chart data
  const minValue = chartPrices.length > 0 ? Math.min(...chartPrices) * 0.98 : 0; 
  const maxValue = chartPrices.length > 0 ? Math.max(...chartPrices) * 1.02 : 0;
  const priceRangeMin = Math.floor(minValue);
  const priceRangeMax = Math.ceil(maxValue);

  // Get appropriate time labels based on data source
  const timeScaleLabels = useMemo(() => {
    return getYahooTimeScaleLabels(timeFrame, yahooChartData);
  }, [timeFrame, yahooChartData]);

  // Use the latest trading day exclusively from Yahoo data
  const latestTradingDay = useMemo(() => {
    if (yahooChartData?.quotes && yahooChartData.quotes.length > 0) {
      const lastQuote = yahooChartData.quotes[yahooChartData.quotes.length - 1];
      if (lastQuote.date) {
        return new Date(lastQuote.date).toISOString().split('T')[0];
      }
    }
    return null; // No fallback - will hide the last updated text if not available
  }, [yahooChartData]);

  // --- Handlers ---
  const refreshData = async () => {
    setIsRefreshing(true);
    try {
      await refetchYahooData();
    } catch (error) {
      console.error(`Error refreshing data for ${stock.ticker}:`, error);
    }
    setTimeout(() => setIsRefreshing(false), 1000); // Simulate refresh delay
  };

  const handleMetricClickInternal = useCallback((metricName: string) => {
    if (!onMetricClick || !cardControls || !stock?.metrics) return;

    let color: "green" | "yellow" | "red" = "yellow"; // Default color
    const metricKey = metricName.toLowerCase() as keyof StockData['metrics'];
    const metricObj = stock.metrics[metricKey];

    if (!metricObj || !metricObj.details) {
        console.warn(`Metric details not found for ${metricName}`);
        return; // Exit if metric details are missing
    }

    if (metricObj.color === "green") color = "green";
    else if (metricObj.color === "red") color = "red";

    // Prepare metric values from details
    const metricValues = Object.entries(metricObj.details)
        .filter(([key]) => !key.endsWith('Explanation')) // Exclude explanation keys
        .map(([label, value]) => {
            // Basic formatting - enhance as needed
            let suffix = "";
            if (label.toLowerCase().includes('growth') || label.toLowerCase().includes('margin') || label.toLowerCase().includes('yield') || label.toLowerCase().includes('return')) {
                suffix = "%";
            }
             // Find the corresponding explanation
            const explanationKey = `${label}Explanation` as keyof typeof metricObj.details;
            const explanation = metricObj.details[explanationKey] as string || "No details available.";

            return {
                label: label.replace(/([A-Z])/g, ' $1').trim(), // Add spaces for camelCase
                value: typeof value === 'number' ? value.toFixed(1) : String(value),
                suffix: suffix,
                explanation: explanation
            };
        });

    const industryAverage = getIndustryAverageData(stock, metricName.toLowerCase());

    onMetricClick({
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
  }, [stock, onMetricClick, cardControls]); // Added stock dependency


  // Drag handlers remain the same as provided previously
  const dragStartTimeRef = useRef<number>(0);
  const dragStartXRef = useRef<number>(0);
  const dragDistanceThresholdRef = useRef<number>(0);
  const isDraggingIntentionallyRef = useRef<boolean>(false);

  const handleDragStart = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    dragStartTimeRef.current = Date.now();
    dragStartXRef.current = info.point.x;
    isDraggingIntentionallyRef.current = false;
    dragDistanceThresholdRef.current = 0;
  };

  const handleDrag = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (!cardControls) return;
    const distanceMoved = Math.abs(info.point.x - dragStartXRef.current);
    dragDistanceThresholdRef.current = Math.max(dragDistanceThresholdRef.current, distanceMoved);
    const dragDuration = Date.now() - dragStartTimeRef.current;
    
    // Increase drag threshold to require more intentional horizontal movement
    if (distanceMoved > 75 && dragDuration > 150) {
      // Also check if horizontal drag is more dominant than vertical
      const verticalDistance = Math.abs(info.offset.y);
      if (distanceMoved > verticalDistance * 1.25) {
        isDraggingIntentionallyRef.current = true;
      }
    }
  };

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (!cardControls) return;

    // Check if this was primarily a vertical drag (scrolling)
    const verticalDragDistance = Math.abs(info.offset.y);
    const horizontalDragDistance = Math.abs(info.offset.x);

    // If vertical drag is much larger than horizontal, treat as scroll and ignore swipe
    if (verticalDragDistance > horizontalDragDistance * 1.5) {
      cardControls.start({ 
        x: 0, 
        transition: { type: "spring", stiffness: 400, damping: 40, duration: 0.4 } 
      });
      isDraggingIntentionallyRef.current = false; // Reset intention flag
      return; // Stop further processing
    }
    
    if (!isDraggingIntentionallyRef.current) {
      cardControls.start({ x: 0, transition: { type: "spring", stiffness: 250, damping: 35, duration: 0.8 } });
      return;
    }

    const rightThreshold = 300; // Increased from 150
    const leftThreshold = 240;  // Increased from 120
    const velocityThreshold = 500; // Increased from 250
    const dragVelocity = info.velocity.x;
    const dragOffset = info.offset.x;

    if (dragOffset > rightThreshold || (dragOffset > 120 && dragVelocity > velocityThreshold)) {
      if (onInvest) onInvest();
      cardControls.start({ x: 0, rotate: [5, 0], transition: { type: "spring", stiffness: 280, damping: 22, duration: 0.85, ease: "easeInOut" } });
    } else if (dragOffset < -leftThreshold || (dragOffset < -120 && dragVelocity < -velocityThreshold)) {
      if (onNext) onNext();
    } else {
      cardControls.start({ x: 0, transition: { type: "spring", stiffness: 250, damping: 30, duration: 0.8, ease: "easeOut" } });
    }
  };

  const handleOpenCalculatorClick = () => {
      if(onOpenCalculator) {
          console.log("Hidden button clicked, calling onOpenCalculator");
          onOpenCalculator();
      } else {
          console.warn("Hidden button clicked, but onOpenCalculator prop is missing");
      }
  };

  // --- Render Logic ---
  // Main render uses realtime mode structure
 return (
  <motion.div
    ref={cardRef}
    className="h-full w-full rounded-2xl shadow-xl"
    drag={cardControls ? "x" : false}
    dragConstraints={{ left: 0, right: 0 }}
    dragElastic={0.3} // Reduced from 0.5 to make dragging feel more direct
    dragTransition={{ 
      power: 0.3, // Reduced power for smoother drag feel
      timeConstant: 250, // Slightly faster response time
      modifyTarget: (target) => Math.round(target / 50) * 50 // Snaps to 50px increments for cleaner action
    }}
    dragPropagation={false} // Prevent drag propagation to parent elements
    dragMomentum={false} // Disable momentum for more precise control
    onDragStart={handleDragStart}
    onDrag={handleDrag}
    onDragEnd={handleDragEnd}
    animate={cardControls}
    style={{
      x: xToUse,
      opacity: cardOpacity,
      rotate: cardRotate,
      scale: cardScale,
      backgroundColor: '#FFFFFF', // Force light mode background
      color: '#1F2937',         // Force light mode text
      cursor: cardControls ? 'grab' : 'default',
      willChange: 'transform' // Optimize for animation performance
    }}
    whileTap={cardControls ? { cursor: 'grabbing', scale: 0.995 } : {}}
  >
    {/* Inner scroll container - improved for iOS */}
    <div
        className="absolute inset-0 overflow-y-auto overflow-x-hidden pb-20 stock-card-scroll-content touch-optimized rounded-2xl bg-white text-slate-900" // Added touch-optimized class
        style={{ 
          overflowAnchor: 'none',  // Prevent scroll anchoring
          scrollBehavior: 'smooth' // Enable smooth scrolling
        }}
    >
      {/* --- Header/Chart Section (Robinhood Style) --- */}
      <div className="bg-white flex flex-col w-full">
            {/* Stock Name & Ticker - Robinhood Style, moved down */}
            <div className="flex items-center justify-between px-5 pt-5 pb-1 mt-4">
              <div className="flex flex-col">
                <Link
                  to={`/stock-detail/${stock.ticker}`}
                  className="group"
                  onClick={(e: React.MouseEvent) => e.stopPropagation()}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium rounded-full bg-gray-100 px-2 py-0.5 text-gray-600">{stock.ticker}</span>
                    <span className="text-base font-bold text-slate-900">{stock.name}</span>
                  </div>
                </Link>
                {onPrevious && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onPrevious();
                    }}
                    className="absolute left-3 top-5 bg-transparent text-gray-400 p-1.5 rounded-full hover:text-gray-600 transition-colors"
                    aria-label="Previous Stock"
                  >
                    <ChevronLeft size={20} />
                  </button>
                )}
              </div>
              <div className="flex items-center">
                <button onClick={refreshData} className="p-1.5 rounded-full hover:bg-slate-100 transition-colors" disabled={isRefreshing}>
                  <RefreshCw size={14} className={`text-slate-400 ${isRefreshing ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>
             
            {/* Price and Change - Larger, bolder, cleaner - with fixed height */}
            <div className="flex items-start px-5 pb-2 h-14"> {/* Added fixed height */}
                <span className="text-3xl font-bold text-slate-900">${displayPrice}</span>
                <div className="ml-2 flex items-center mt-1.5">
                <span className={`flex items-center text-sm px-3 py-1 rounded-full ${realTimeChange >= 0 ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'}`}>
                    {realTimeChange >= 0 ? <TrendingUp size={12} className="mr-1" /> : <ChevronLeft size={12} className="mr-1 rotate-90" />}
                    {realTimeChange >= 0 ? '+' : ''}{realTimeChange.toFixed(2)}%
                </span>
                </div>
            </div>
            
            {/* Day's Range - Only shown when Yahoo data is available - with fixed height */}
            <div className="h-6"> {/* Fixed height container */}
              {dayRange.low > 0 && dayRange.high > 0 && (
                <div className="px-5 flex items-center text-xs text-slate-500">
                  <span className="mr-2">Day's Range:</span>
                  <span className="font-medium">${dayRange.low.toFixed(2)} - ${dayRange.high.toFixed(2)}</span>
                </div>
              )}
            </div>
            
            {/* Chart Area - Full-screen, edge-to-edge */}
            <div className="relative h-64 w-full -mx-1 mt-3"> {/* Added margin-top and negative x-margin */}
                {isLoadingYahooData && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white">
                        <Skeleton className="h-full w-full bg-white/80" />
                    </div>
                )}
                {!isLoadingYahooData && yahooError && (
                     <div className="absolute inset-0 flex items-center justify-center text-xs text-red-500 p-2 bg-white rounded">
                        Error loading chart data.
                    </div>
                )}
                {!isLoadingYahooData && !yahooError && chartPrices.length > 0 && (
                    <>
                        {/* Chart SVG with enhanced styling - Edge to edge */}
                        <div className="absolute inset-0 touch-manipulation"> {/* Using touch-manipulation to optimize for mobile */}
                            <svg className="w-full h-full" viewBox={`0 0 100 100`} preserveAspectRatio="none">
                                {/* Minimal defs - removed gradient fill as requested */}
                                <defs>
                                    {/* Subtle glow effect for the line */}
                                    <filter id="glow" x="-5%" y="-5%" width="110%" height="110%">
                                        <feGaussianBlur in="SourceGraphic" stdDeviation="0.5" result="blur" />
                                        <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 12 -7" result="glow" />
                                        <feComposite in="SourceGraphic" in2="glow" operator="over" />
                                    </filter>
                                </defs>
                                
                                {/* Horizontal dotted grid lines - more subtle */}
                                <line x1="0" y1="25" x2="100" y2="25" stroke={realTimeChange >= 0 ? 'rgba(34, 197, 94, 0.07)' : 'rgba(239, 68, 68, 0.07)'} strokeWidth="0.3" strokeDasharray="1,2" />
                                <line x1="0" y1="50" x2="100" y2="50" stroke={realTimeChange >= 0 ? 'rgba(34, 197, 94, 0.07)' : 'rgba(239, 68, 68, 0.07)'} strokeWidth="0.3" strokeDasharray="1,2" />
                                <line x1="0" y1="75" x2="100" y2="75" stroke={realTimeChange >= 0 ? 'rgba(34, 197, 94, 0.07)' : 'rgba(239, 68, 68, 0.07)'} strokeWidth="0.3" strokeDasharray="1,2" />
                                
                                {/* Chart Line - THINNER with subtle glow effect - always starts from far left edge */}
                                {chartPrices.length > 1 && (
                                  <path
                                  d={`M0,${100 - ((chartPrices[0] - minValue) / (maxValue - minValue || 1)) * 100} ${
                                      chartPrices.map((point: number, i: number) =>
                                      `L${(i / (chartPrices.length - 1)) * 100},${100 - ((point - minValue) / (maxValue - minValue || 1)) * 100}`
                                      ).join(' ')
                                  }`}
                                  className={`${realTimeChange >= 0 ? 'stroke-green-500' : 'stroke-red-500'} fill-none`}
                                  strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                                  filter="url(#glow)"
                                  style={{
                                    strokeDasharray: "1000",
                                    strokeDashoffset: "1000",
                                    animation: currentIndex === 0 ? "none" : "draw-line 1.5s ease-in-out forwards"
                                  }}
                                  />
                                )}
                                
                                {/* Interactive Price Tracker - Robinhood Style */}
                                {chartPrices.length > 1 && (
                                  <>
                                    {/* Invisible overlay for touch/mouse interaction */}
                                    <rect 
                                      x="0" 
                                      y="0" 
                                      width="100" 
                                      height="100" 
                                      fill="transparent" 
                                      className="touch-manipulation cursor-crosshair"
                                      onMouseMove={(e) => {
                                        // Get SVG element
                                        const svg = e.currentTarget.ownerSVGElement;
                                        if (!svg) return;
                                        
                                        // Get SVG dimensions and position
                                        const svgRect = svg.getBoundingClientRect();
                                        
                                        // Calculate position as percentage
                                        const xPercent = (e.clientX - svgRect.left) / svgRect.width * 100;
                                        
                                        // Find nearest data point from chart
                                        const pointIndex = Math.min(
                                          Math.round(xPercent / 100 * (chartPrices.length - 1)),
                                          chartPrices.length - 1
                                        );
                                        
                                        // Set dynamic cursor elements - Display at touch position
                                        const cursorLine = svg.querySelector('#cursorLine');
                                        const pricePoint = svg.querySelector('#pricePoint');
                                        const priceLabel = svg.querySelector('#priceLabel');
                                        
                                        if (cursorLine && pricePoint && priceLabel) {
                                          // Clamp position within chart boundaries
                                          const clampedX = Math.max(0, Math.min(100, xPercent));
                                          
                                          // Calculate Y position for the selected price
                                          const price = chartPrices[pointIndex];
                                          const yPos = 100 - ((price - minValue) / (maxValue - minValue || 1)) * 100;
                                          
                                          // Update elements
                                          cursorLine.setAttribute('x1', clampedX.toString());
                                          cursorLine.setAttribute('x2', clampedX.toString());
                                          cursorLine.setAttribute('opacity', '1');
                                          
                                          pricePoint.setAttribute('cx', clampedX.toString());
                                          pricePoint.setAttribute('cy', yPos.toString());
                                          pricePoint.setAttribute('opacity', '1');
                                          
                                          priceLabel.setAttribute('x', clampedX < 50 ? (clampedX + 5).toString() : (clampedX - 25).toString());
                                          priceLabel.setAttribute('y', (yPos - 8).toString());
                                          priceLabel.textContent = `$${price.toFixed(2)}`;
                                          priceLabel.setAttribute('opacity', '1');
                                        }
                                      }}
                                      onMouseLeave={(e) => {
                                        // Hide cursor elements on mouse leave
                                        const svg = e.currentTarget.ownerSVGElement;
                                        if (!svg) return;
                                        
                                        const cursorLine = svg.querySelector('#cursorLine');
                                        const pricePoint = svg.querySelector('#pricePoint');
                                        const priceLabel = svg.querySelector('#priceLabel');
                                        
                                        if (cursorLine && pricePoint && priceLabel) {
                                          cursorLine.setAttribute('opacity', '0');
                                          pricePoint.setAttribute('opacity', '0');
                                          priceLabel.setAttribute('opacity', '0');
                                        }
                                      }}
                                      // Touch support
                                      onTouchMove={(e) => {
                                        // Prevent scrolling
                                        e.preventDefault();
                                        
                                        // Get SVG element
                                        const svg = e.currentTarget.ownerSVGElement;
                                        if (!svg || !e.touches[0]) return;
                                        
                                        // Get SVG dimensions and position
                                        const svgRect = svg.getBoundingClientRect();
                                        
                                        // Calculate position as percentage
                                        const xPercent = (e.touches[0].clientX - svgRect.left) / svgRect.width * 100;
                                        
                                        // Find nearest data point from chart
                                        const pointIndex = Math.min(
                                          Math.round(xPercent / 100 * (chartPrices.length - 1)),
                                          chartPrices.length - 1
                                        );
                                        
                                        // Set dynamic cursor elements - Display at touch position
                                        const cursorLine = svg.querySelector('#cursorLine');
                                        const pricePoint = svg.querySelector('#pricePoint');
                                        const priceLabel = svg.querySelector('#priceLabel');
                                        
                                        if (cursorLine && pricePoint && priceLabel) {
                                          // Clamp position within chart boundaries
                                          const clampedX = Math.max(0, Math.min(100, xPercent));
                                          
                                          // Calculate Y position for the selected price
                                          const price = chartPrices[pointIndex];
                                          const yPos = 100 - ((price - minValue) / (maxValue - minValue || 1)) * 100;
                                          
                                          // Update elements
                                          cursorLine.setAttribute('x1', clampedX.toString());
                                          cursorLine.setAttribute('x2', clampedX.toString());
                                          cursorLine.setAttribute('opacity', '1');
                                          
                                          pricePoint.setAttribute('cx', clampedX.toString());
                                          pricePoint.setAttribute('cy', yPos.toString());
                                          pricePoint.setAttribute('opacity', '1');
                                          
                                          priceLabel.setAttribute('x', clampedX < 50 ? (clampedX + 5).toString() : (clampedX - 25).toString());
                                          priceLabel.setAttribute('y', (yPos - 8).toString());
                                          priceLabel.textContent = `$${price.toFixed(2)}`;
                                          priceLabel.setAttribute('opacity', '1');
                                        }
                                      }}
                                      onTouchEnd={(e) => {
                                        // Hide cursor elements on touch end
                                        const svg = e.currentTarget.ownerSVGElement;
                                        if (!svg) return;
                                        
                                        const cursorLine = svg.querySelector('#cursorLine');
                                        const pricePoint = svg.querySelector('#pricePoint');
                                        const priceLabel = svg.querySelector('#priceLabel');
                                        
                                        if (cursorLine && pricePoint && priceLabel) {
                                          cursorLine.setAttribute('opacity', '0');
                                          pricePoint.setAttribute('opacity', '0');
                                          priceLabel.setAttribute('opacity', '0');
                                        }
                                      }}
                                    />
                                    
                                    {/* Interactive vertical cursor line */}
                                    <line 
                                      id="cursorLine" 
                                      x1="0" 
                                      y1="0" 
                                      x2="0" 
                                      y2="100" 
                                      stroke={realTimeChange >= 0 ? 'rgba(34, 197, 94, 0.4)' : 'rgba(239, 68, 68, 0.4)'} 
                                      strokeDasharray="2,2" 
                                      strokeWidth="0.5" 
                                      opacity="0"
                                    />
                                    
                                    {/* Interactive price point bubble */}
                                    <circle 
                                      id="pricePoint" 
                                      cx="0" 
                                      cy="0" 
                                      r="2"
                                      fill={realTimeChange >= 0 ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)'} 
                                      opacity="0"
                                      filter="url(#glow)"
                                    />
                                    
                                    {/* Interactive price label - Robinhood Style */}
                                    <g id="priceLabel" opacity="0">
                                      <rect
                                        x="0"
                                        y="0"
                                        width="36"
                                        height="16"
                                        rx="8"
                                        fill="white"
                                        stroke={realTimeChange >= 0 ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)'}
                                        strokeWidth="0.5"
                                        filter="drop-shadow(0px 1px 2px rgba(0,0,0,0.08))"
                                      />
                                      <text 
                                        x="18" 
                                        y="11" 
                                        fill={realTimeChange >= 0 ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)'} 
                                        fontSize="7" 
                                        fontWeight="bold" 
                                        textAnchor="middle" 
                                        alignmentBaseline="middle"
                                      >
                                        $0.00
                                      </text>
                                    </g>
                                  </>
                                )}
                            </svg>
                        </div>
                        
                        {/* X Axis Labels - Edge to edge */}
                        <div className="absolute left-0 right-0 bottom-1 px-2 flex justify-between text-[9px] text-slate-500 font-medium pointer-events-none">
                            {timeScaleLabels.map((label, index) => (<span key={index}>{label}</span>))}
                        </div>
                    </>
                )}
                {!isLoadingYahooData && !yahooError && chartPrices.length === 0 && (
                     <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-400 p-2 bg-slate-50 rounded">
                        No chart data available for this period.
                    </div>
                )}
            </div>
            
            {/* --- Time frame selector (Robinhood style below chart) - Moved up slightly --- */}
            <div className="flex justify-around px-3 pt-2 pb-1 -mt-1">
                {["1D", "1W", "1M", "3M", "1Y", "5Y"].map((period) => (
                    <button
                        key={period}
                        className={`px-3 py-1 text-xs rounded-full transition-all duration-150 ${
                            timeFrame === (period === "1W" ? "5D" : period)
                                ? `font-medium ${realTimeChange >= 0 ? 'text-green-600 bg-green-50 border border-green-100' : 'text-red-600 bg-red-50 border border-red-100'}`
                                : 'text-slate-500 hover:bg-slate-50'
                        }`}
                        onClick={() => setTimeFrame((period === "1W" ? "5D" : period) as TimeFrame)}
                    >
                        {period}
                    </button>
                ))}
            </div>
            
            {/* Last Updated Info - Only shown when Yahoo data provides a trading date */}
            <div className="mt-1 flex items-center justify-between px-5 text-xs h-6">
                {latestTradingDay && (
                  <span className="text-slate-400 text-[10px]">Last updated: {latestTradingDay}</span>
                )}
                {!latestTradingDay && (
                  <span></span> /* Empty span to maintain flex layout */
                )}
                <span className="text-slate-400 text-[10px] italic">Swipe for more</span>
            </div>
      </div>

      {/* --- Metrics - Robinhood-inspired --- */}
      <div className="grid grid-cols-2 gap-4 p-4 bg-white border-b border-slate-100">
          {Object.entries(stock.metrics).filter(([key]) => ['performance', 'stability', 'value', 'momentum'].includes(key)).map(([key, metricObj]) => {
          const metricName = key.charAt(0).toUpperCase() + key.slice(1);
          return (
              <div key={key} className="group relative" onClick={() => handleMetricClickInternal(metricName)} >
                  {/* Enhanced Hover Glow Effect */}
                  <div className={`absolute inset-0 rounded-xl blur-sm transform scale-[0.98] translate-y-1 opacity-0 group-hover:opacity-100 transition-all duration-300 ${ 
                    metricObj.color === 'green' ? 'bg-gradient-to-r from-green-200/60 to-emerald-200/60 shadow-lg shadow-green-50' : 
                    metricObj.color === 'yellow' ? 'bg-gradient-to-r from-amber-200/60 to-yellow-200/60 shadow-lg shadow-amber-50' : 
                    'bg-gradient-to-r from-red-200/60 to-rose-200/60 shadow-lg shadow-red-50'
                  }`}></div>
                  
                  {/* Main Metric Box with enhanced styling */}
                  <div className={`p-4 rounded-xl border-2 relative z-10 overflow-hidden active:scale-95 transition-all duration-150 cursor-pointer 
                    ${metricObj.color === 'green' 
                    ? 'bg-gradient-to-br from-white to-green-50 border-green-300 group-hover:border-green-400 shadow-md shadow-green-100/50' 
                    : metricObj.color === 'yellow' 
                    ? 'bg-gradient-to-br from-white to-amber-50 border-amber-300 group-hover:border-amber-400 shadow-md shadow-amber-100/50'
                    : 'bg-gradient-to-br from-white to-red-50 border-red-300 group-hover:border-red-400 shadow-md shadow-red-100/50'}`}>
                      
                      {/* Enhanced Top Color Bar */}
                      <div className={`absolute top-0 left-0 w-full h-[3px] ${
                        metricObj.color === 'green' 
                        ? 'bg-gradient-to-r from-green-500 to-emerald-600' 
                        : metricObj.color === 'yellow' 
                        ? 'bg-gradient-to-r from-amber-500 to-yellow-600' 
                        : 'bg-gradient-to-r from-red-500 to-rose-600'}`}>
                      </div>
                      
                      {/* Icon and Info with enhanced styling */}
                      <div className="flex items-center justify-between mb-2.5">
                        <div className={`flex items-center justify-center rounded-full w-9 h-9 shadow-sm ${
                          metricObj.color === 'green' 
                          ? 'bg-gradient-to-br from-green-100 to-green-200 text-green-600' 
                          : metricObj.color === 'yellow' 
                          ? 'bg-gradient-to-br from-amber-100 to-amber-200 text-amber-600' 
                          : 'bg-gradient-to-br from-red-100 to-red-200 text-red-600'}`}>
                            {key === 'performance' && <TrendingUp size={17} />} 
                            {key === 'stability' && <Shield size={17} />} 
                            {key === 'value' && <DollarSign size={17} />} 
                            {key === 'momentum' && <Zap size={17} />}
                        </div>
                        <Info size={16} className="text-slate-500 group-hover:text-slate-700 transition-colors mr-1" />
                      </div>
                      
                      {/* Value and Name with enhanced styling */}
                      <div className={`text-xl font-bold ${
                        metricObj.color === 'green' 
                        ? 'text-green-700' 
                        : metricObj.color === 'yellow' 
                        ? 'text-amber-700' 
                        : 'text-red-700'}`}>
                        {metricObj.value}
                      </div>
                      
                      <div className="text-slate-600 text-sm font-semibold mt-1 capitalize">{metricName}</div>
                  </div>
              </div>
          );
          })}
      </div>

      {/* --- Synopsis Section --- */}
       <div className="bg-white rounded-xl border border-slate-200 shadow-md overflow-hidden my-4 mx-4"> {/* Added mx-4 for horizontal margin */}
             {/* Price Trend */}
            <div className="p-4 border-b border-slate-100 relative">
                <h3 className="font-semibold text-slate-900 mb-2 flex items-center">
                    <TrendingUp size={16} className="text-blue-500 mr-2" /> Price Trend
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                    {stock.synopsis?.price || "Price movement analysis is currently unavailable."}
                </p>
            </div>
            {/* Company Overview */}
            <div className="p-4 border-b border-slate-100 relative">
                <h3 className="font-semibold text-slate-900 mb-2 flex items-center">
                    <Building size={16} className="text-indigo-500 mr-2" /> Company Overview
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                    {stock.synopsis?.company || stock.description || "Company overview is currently unavailable."}
                </p>
            </div>
            {/* Portfolio Role */}
            <div className="p-4 relative">
                <h3 className="font-semibold text-slate-900 mb-2 flex items-center">
                    <BarChart3 size={16} className="text-amber-500 mr-2" /> Portfolio Role
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                    {stock.synopsis?.role || "Analysis of this stock's role in a portfolio is currently unavailable."}
                </p>
            </div>
        </div>

        {/* --- Comparative Analysis --- */}
         <div className="bg-white border-t border-b border-slate-100 comparative-analysis-container mx-4 mb-4 rounded-xl shadow-md" onClick={(e) => e.stopPropagation()}> {/* Added margin and rounded corners */}
            <ComparativeAnalysis currentStock={stock} />
        </div>

       {/* --- Analyst Ratings Section --- */}
        <div className="bg-white border-t border-slate-100 mb-4 mx-4 rounded-xl shadow-md overflow-hidden">
            <AnalystRatingsRedesign symbol={stock.ticker} className="mb-4" />
        </div>
        
        {/* --- Historical Performance Chart --- */}
        <div className="bg-white border-t border-slate-100 mb-4 mx-4 rounded-xl shadow-md overflow-hidden">
            <HistoricalPerformanceChart symbol={stock.ticker} companyName={stock.name} />
        </div>

       {/* --- News Section --- */}
        <div className="bg-white border-t border-slate-100 mb-4 mx-4 rounded-xl shadow-md overflow-hidden"> {/* Added margin and rounded corners */}
            <StockNewsSection stock={stock} />
        </div>

        {/* --- Ask AI --- */}
        <div className="bg-white border-t border-slate-100 mx-4 mb-4 rounded-xl shadow-md"> {/* Added margin and rounded corners */}
             <AskAI stock={stock} />
        </div>


      {/* Spacer at the bottom to ensure content doesn't hide behind fixed buttons */}
      <div className="h-4"></div>

    </div> {/* End scrollable inner container */}

     {/* --- Action Buttons (Fixed at Bottom) --- */}
     {cardControls && (
        <div className="fixed bottom-0 left-0 right-0 px-4 pb-4 pt-3 z-30 flex justify-center space-x-3 bg-gradient-to-t from-white via-white/95 to-white/0">
             {/* Shadow/gradient edge */}
            <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-white to-transparent -z-10 pointer-events-none"></div>

            <button
                className="px-6 py-3.5 rounded-xl bg-gradient-to-br from-red-500 to-red-600 text-white font-semibold shadow-lg flex items-center justify-center w-1/2 hover:from-red-600 hover:to-red-700 active:scale-95 transition-all duration-300 border border-red-400"
                onClick={() => onNext && onNext()}
                aria-label="Skip Stock"
            >
                <X className="mr-2" size={18} /> {/* Using X instead of ChevronLeft for skip */}
                Skip
            </button>

            <button
                className="px-6 py-3.5 rounded-xl bg-gradient-to-br from-green-500 to-green-600 text-white font-semibold shadow-lg flex items-center justify-center w-1/2 hover:from-green-600 hover:to-green-700 active:scale-95 transition-all duration-300 border border-green-400"
                data-testid="buy-button"
                onClick={() => onInvest && onInvest()}
                 aria-label="Buy Stock"
            >
                <Check className="mr-2" size={18} /> {/* Using Check instead of DollarSign for buy */}
                Buy
            </button>
        </div>
      )}

  </motion.div> // End main motion wrapper
 );
}
