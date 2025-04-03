import { useState, useRef, useMemo, useEffect } from "react";
import { Link } from "wouter";
import { StockData, fetchStockMetrics, formatMetricsFromDatabase } from "@/lib/stock-data";

// Define metric type to satisfy TypeScript
interface MetricObject {
  value: string | number;
  color: "green" | "yellow" | "red";
  details: any;
  explanation: string;
}

// Define metrics structure in StockData
interface Metrics {
  [key: string]: MetricObject;
}
import { useQuery } from "@tanstack/react-query";
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
  Building
} from "lucide-react";
import { motion, useAnimation, useMotionValue, useTransform, PanInfo, AnimationControls } from "framer-motion";
import OverallAnalysisCard from "@/components/overall-analysis-card";

import { AnalystRecommendations } from "@/components/stock-detail/analyst-recommendations";
import { ModernAnalystRating } from "@/components/stock-detail/modern-analyst-rating";
import { SwipeableNews } from "@/components/stock-detail/swipeable-news";
import { ManagementSection } from "@/components/stock-detail/management-section";
import { Skeleton } from "@/components/ui/skeleton";
import ComparativeAnalysis from "@/components/comparative-analysis";
import AskAI from "./ask-ai";
import { StockCardNews } from "./stock-card-news";
import { getIndustryAverages } from "@/lib/industry-data";


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
  displayMode?: 'simple' | 'realtime';
  cardControls?: AnimationControls; // Optional controls from parent
  x?: ReturnType<typeof useMotionValue<number>>; // Optional motion value from parent
}

type TimeFrame = "1D" | "5D" | "1M" | "6M" | "YTD" | "1Y" | "5Y" | "MAX";

// Helper functions (getTimeScaleLabels, getIndustryAverageData)
// Note: generateTimeBasedData removed - we now only use real data from PostgreSQL
const getTimeScaleLabels = (timeFrame: TimeFrame): string[] => {
  switch(timeFrame) {
    case "1D": return ["9:30", "11:00", "12:30", "14:00", "15:30", "16:00"];
    case "5D": return ["Mon", "Tue", "Wed", "Thu", "Fri"];
    case "1M": return ["Week 1", "Week 2", "Week 3", "Week 4"];
    case "6M": return ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
    case "YTD": return ["Jan", "Mar", "May", "Jul", "Sep", "Nov"];
    case "1Y": return ["Jan", "Mar", "May", "Jul", "Sep", "Nov"];
    case "5Y": return ["2020", "2021", "2022", "2023", "2024"];
    case "MAX": return ["2015", "2017", "2019", "2021", "2023"];
    default: return ["9:30", "11:00", "12:30", "14:00", "15:30", "16:00"];
  }
};
const getIndustryAverageData = (stock: StockData, metricType: string) => {
  const industryAvgs = getIndustryAverages(stock.industry);
  if (!industryAvgs) return []; // Handle case where averages might not exist

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
  displayMode = 'realtime',
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
  const [timeFrame, setTimeFrame] = useState<TimeFrame>("1M");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [availablePeriods, setAvailablePeriods] = useState<string[]>([]);
  
  // Fetch available periods for the stock
  const periodsQuery = useQuery({
    queryKey: ['/api/stock/available-periods', stock.ticker],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/stock/${stock.ticker}/available-periods`);
        if (!response.ok) {
          throw new Error(`Failed to fetch available periods for ${stock.ticker}`);
        }
        return response.json();
      } catch (error) {
        console.error('Error fetching available periods:', error);
        return { availablePeriods: ['5D', '1W', '1M', '3M', '6M', '1Y', '5Y'] };
      }
    },
    staleTime: 60 * 1000, // 1 minute
  });
  
  // Set available periods when data is received
  useEffect(() => {
    if (periodsQuery.data?.availablePeriods) {
      setAvailablePeriods(periodsQuery.data.availablePeriods);
      
      // If the current timeFrame isn't available, set it to the first available one
      if (periodsQuery.data.availablePeriods.includes('1M')) {
        setTimeFrame('1M');
      } else if (periodsQuery.data.availablePeriods.length > 0) {
        // Filter out non-timeframe keys like "last_update"
        const validPeriods = periodsQuery.data.availablePeriods.filter((p: string) => 
          ['1D', '5D', '1W', '1M', '3M', '6M', '1Y', '5Y'].includes(p)
        );
        if (validPeriods.length > 0) {
          setTimeFrame(validPeriods[0] as TimeFrame);
        }
      }
    }
  }, [periodsQuery.data]);
  
  // Fetch price history data
  const historyQuery = useQuery({
    queryKey: ['/api/stock/history', stock.ticker, timeFrame],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/stock/${stock.ticker}/history?period=${timeFrame}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch price history for ${stock.ticker}`);
        }
        return response.json();
      } catch (error) {
        console.error('Error fetching price history:', error);
        return null;
      }
    },
    staleTime: 60 * 1000, // 1 minute
    enabled: Boolean(timeFrame), // Only run query when timeFrame is available
  });
  
  // Fetch metrics data from PostgreSQL
  const metricsQuery = useQuery({
    queryKey: ['/api/pg/stock/metrics', stock.ticker],
    queryFn: async () => {
      try {
        return await fetchStockMetrics(stock.ticker);
      } catch (error) {
        console.error('Error fetching metrics:', error);
        return null;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  // Merge PostgreSQL metrics with stock data if available
  const stockWithMetrics = useMemo(() => {
    if (metricsQuery.data && !metricsQuery.isError) {
      try {
        // Format metrics from PostgreSQL into the expected format
        const formattedMetrics = formatMetricsFromDatabase(metricsQuery.data);
        
        console.log(`Got metrics for ${stock.ticker}:`, metricsQuery.data);
        console.log(`Formatted metrics:`, formattedMetrics);
        
        // The proper way to merge metrics is to keep the structure intact
        // but merge at the detailed level to preserve existing values
        return {
          ...stock,
          metrics: {
            performance: {
              ...stock.metrics.performance,
              details: {
                ...stock.metrics.performance.details,
                // Override with PostgreSQL values where available
                ...(formattedMetrics.performance.details || {})
              },
              value: formattedMetrics.performance.value || stock.metrics.performance.value,
              color: formattedMetrics.performance.color || stock.metrics.performance.color,
            },
            stability: {
              ...stock.metrics.stability,
              details: {
                ...stock.metrics.stability.details,
                // Override with PostgreSQL values where available
                ...(formattedMetrics.stability.details || {})
              },
              value: formattedMetrics.stability.value || stock.metrics.stability.value,
              color: formattedMetrics.stability.color || stock.metrics.stability.color,
            },
            value: {
              ...stock.metrics.value,
              details: {
                ...stock.metrics.value.details,
                // Override with PostgreSQL values where available
                ...(formattedMetrics.value.details || {})
              },
              value: formattedMetrics.value.value || stock.metrics.value.value,
              color: formattedMetrics.value.color || stock.metrics.value.color,
            },
            momentum: {
              ...stock.metrics.momentum,
              details: {
                ...stock.metrics.momentum.details,
                // Override with PostgreSQL values where available
                ...(formattedMetrics.momentum.details || {})
              },
              value: formattedMetrics.momentum.value || stock.metrics.momentum.value,
              color: formattedMetrics.momentum.color || stock.metrics.momentum.color,
            },
            // Keep potential if it exists
            ...(stock.metrics.potential ? { potential: stock.metrics.potential } : {})
          },
          // Keep any existing fields
          rating: stock.rating,
          smartScore: stock.smartScore,
          oneYearReturn: stock.oneYearReturn,
          predictedPrice: stock.predictedPrice,
        };
      } catch (error) {
        console.error('Error formatting metrics:', error);
      }
    }
    // If no metrics data or error, return original stock
    return stock;
  }, [stock, metricsQuery.data, metricsQuery.isError]);
  
  // Use real data from API only - we've removed all fallbacks to hardcoded data
  const chartData = useMemo(() => {
    // If we have real data from the API, use it
    if (historyQuery.data?.prices && Array.isArray(historyQuery.data.prices)) {
      return historyQuery.data.prices;
    }
    // Empty array if no data available - will show blank chart (better than fake data)
    console.warn(`No price history data available for ${stock.ticker} (${timeFrame})`);
    return [stock.price, stock.price, stock.price]; // Minimum fallback to show flat line at current price
  }, [historyQuery.data, stock.ticker, timeFrame, stock.price]);
  
  // Format numbers based on the requirements:
  // - 2 decimal places max for numbers less than 10
  // - 1 decimal place for numbers 10 or greater
  const formatNumber = (value: number): string => {
    if (Math.abs(value) < 10) {
      return value.toFixed(2);
    } else {
      return value.toFixed(1);
    }
  };
  
  const displayPrice = formatNumber(stock.price);
  const realTimeChange = parseFloat(formatNumber(stock.change));
  const minValue = Math.min(...(chartData || [1])) - 5;
  const maxValue = Math.max(...(chartData || [1])) + 5;
  const timeScaleLabels = useMemo(() => getTimeScaleLabels(timeFrame), [timeFrame]);
  const priceRangeMin = Math.floor(minValue);
  const priceRangeMax = Math.ceil(maxValue);
  const latestTradingDay = new Date().toISOString().split('T')[0];

  // Refresh handler to refetch data from API
  const refreshData = async () => {
    setIsRefreshing(true);
    try {
      // Refetch all API calls
      await periodsQuery.refetch();
      await historyQuery.refetch();
      await metricsQuery.refetch();
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setTimeout(() => setIsRefreshing(false), 1000);
    }
  };

  // Handler to prepare data and call parent's onMetricClick
  const handleMetricClickInternal = (metricName: string) => {
    // Only trigger if the callback exists and card is interactive
    if (!onMetricClick || !cardControls) return;

     let color: "green" | "yellow" | "red" = "green";
     let metricObj;
     let metricDetails;

     // Use stockWithMetrics instead of stock to get real PostgreSQL data
     switch(metricName) {
       case "Performance": metricObj = stockWithMetrics.metrics.performance; metricDetails = stockWithMetrics.metrics.performance.details; break;
       case "Stability": metricObj = stockWithMetrics.metrics.stability; metricDetails = stockWithMetrics.metrics.stability.details; break;
       case "Value": metricObj = stockWithMetrics.metrics.value; metricDetails = stockWithMetrics.metrics.value.details; break;
       case "Momentum": metricObj = stockWithMetrics.metrics.momentum; metricDetails = stockWithMetrics.metrics.momentum.details; break;
       default: return;
     }
     if (!metricObj || !metricDetails) return; // Guard if metrics are somehow missing

     if (metricObj.color === "green") color = "green";
     else if (metricObj.color === "yellow") color = "yellow";
     else if (metricObj.color === "red") color = "red";

     const metricValues = [];
     if (metricName === "Performance") {
        const perfDetails = metricDetails as { revenueGrowth: number; profitMargin: number; returnOnCapital: number; revenueGrowthExplanation?: string; profitMarginExplanation?: string; returnOnCapitalExplanation?: string; };
        metricValues.push( { label: "Revenue Growth", value: typeof perfDetails.revenueGrowth === 'number' ? formatNumber(perfDetails.revenueGrowth) : perfDetails.revenueGrowth, suffix: "%", explanation: perfDetails.revenueGrowthExplanation || "..." } );
        metricValues.push( { label: "Profit Margin", value: typeof perfDetails.profitMargin === 'number' ? formatNumber(perfDetails.profitMargin) : perfDetails.profitMargin, suffix: "%", explanation: perfDetails.profitMarginExplanation || "..." } );
        metricValues.push( { label: "Return on Capital", value: typeof perfDetails.returnOnCapital === 'number' ? formatNumber(perfDetails.returnOnCapital) : perfDetails.returnOnCapital, suffix: "%", explanation: perfDetails.returnOnCapitalExplanation || "..." } );
     } else if (metricName === "Stability") {
         const stabDetails = metricDetails as { volatility: number; beta: number; dividendConsistency: string; volatilityExplanation?: string; betaExplanation?: string; dividendConsistencyExplanation?: string; };
         metricValues.push( { label: "Volatility", value: typeof stabDetails.volatility === 'number' ? formatNumber(stabDetails.volatility) : stabDetails.volatility, suffix: "", explanation: stabDetails.volatilityExplanation || "..." } );
         metricValues.push( { label: "Beta", value: typeof stabDetails.beta === 'number' ? formatNumber(stabDetails.beta) : stabDetails.beta, suffix: "", explanation: stabDetails.betaExplanation || "..." } );
         metricValues.push( { label: "Dividend Consistency", value: stabDetails.dividendConsistency, suffix: "", explanation: stabDetails.dividendConsistencyExplanation || "..." } );
     } else if (metricName === "Value") {
         const valDetails = metricDetails as { peRatio: number; pbRatio: number; dividendYield: number | "N/A"; peRatioExplanation?: string; pbRatioExplanation?: string; dividendYieldExplanation?: string; };
         metricValues.push( { label: "P/E Ratio", value: typeof valDetails.peRatio === 'number' ? formatNumber(valDetails.peRatio) : valDetails.peRatio, suffix: "", explanation: valDetails.peRatioExplanation || "..." } );
         metricValues.push( { label: "P/B Ratio", value: typeof valDetails.pbRatio === 'number' ? formatNumber(valDetails.pbRatio) : valDetails.pbRatio, suffix: "", explanation: valDetails.pbRatioExplanation || "..." } );
         metricValues.push( { label: "Dividend Yield", value: valDetails.dividendYield === "N/A" ? "N/A" : typeof valDetails.dividendYield === 'number' ? formatNumber(valDetails.dividendYield) : valDetails.dividendYield, suffix: valDetails.dividendYield === "N/A" ? "" : "%", explanation: valDetails.dividendYieldExplanation || "..." } );
     } else if (metricName === "Momentum") {
         const momDetails = metricDetails as { threeMonthReturn: number; relativePerformance: number; rsi: number; threeMonthReturnExplanation?: string; relativePerformanceExplanation?: string; rsiExplanation?: string; };
         metricValues.push( { label: "3-Month Return", value: typeof momDetails.threeMonthReturn === 'number' ? formatNumber(momDetails.threeMonthReturn) : momDetails.threeMonthReturn, suffix: "%", explanation: momDetails.threeMonthReturnExplanation || "..." } );
         metricValues.push( { label: "Relative Performance", value: typeof momDetails.relativePerformance === 'number' ? formatNumber(momDetails.relativePerformance) : momDetails.relativePerformance, suffix: "%", explanation: momDetails.relativePerformanceExplanation || "..." } );
         metricValues.push( { label: "RSI", value: typeof momDetails.rsi === 'number' ? formatNumber(momDetails.rsi) : momDetails.rsi, suffix: "", explanation: momDetails.rsiExplanation || "..." } );
     }

     const industryAverage = displayMode === 'realtime'
       ? getIndustryAverageData(stock, metricName.toLowerCase())
       : [];

     // Call the parent's handler
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
  };

  // Reference to track start time and position of drag
  const dragStartTimeRef = useRef<number>(0);
  const dragStartXRef = useRef<number>(0);
  const dragDistanceThresholdRef = useRef<number>(0);
  const isDraggingIntentionallyRef = useRef<boolean>(false);
  
  // Track when drag starts with initial position
  const handleDragStart = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    dragStartTimeRef.current = Date.now();
    dragStartXRef.current = info.point.x;
    isDraggingIntentionallyRef.current = false;
    dragDistanceThresholdRef.current = 0;
  };
  
  // Handle drag during movement to determine intentional vs accidental
  const handleDrag = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (!cardControls) return;
    
    // Calculate absolute distance moved during this drag session
    const distanceMoved = Math.abs(info.point.x - dragStartXRef.current);
    dragDistanceThresholdRef.current = Math.max(dragDistanceThresholdRef.current, distanceMoved);
    
    // Only consider it an intentional drag if they've moved a significant distance
    // AND they've been dragging for at least 150ms (to prevent accidental swipes)
    const dragDuration = Date.now() - dragStartTimeRef.current;
    
    if (distanceMoved > 20 && dragDuration > 50) {
      isDraggingIntentionallyRef.current = true;
    }
  };
  
  // Drag handler with improved responsiveness
  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (!cardControls) return; // Not interactive if no controls

    // If the drag wasn't intentional, just snap back
    if (!isDraggingIntentionallyRef.current) {
      cardControls.start({ 
        x: 0, 
        transition: { 
          type: "spring", 
          stiffness: 180,  // Softer spring
          damping: 15,     // Less damping for more natural feel
          duration: 0.4    // Faster reset
        }
      });
      return;
    }

    // More natural swipe thresholds
    const rightThreshold = 80; 
    const leftThreshold = 60;
    // Lower velocity threshold for more responsive swipes
    const velocityThreshold = 150;
    
    const dragVelocity = info.velocity.x;
    const dragOffset = info.offset.x;

    // Determine swipe direction based on stricter combination of offset and velocity
    if (dragOffset > rightThreshold || (dragOffset > 80 && dragVelocity > velocityThreshold)) { 
      // Swipe Right - needs very deliberate movement
      if (displayMode === 'realtime') {
        if (onInvest) onInvest();
        // More dramatic and slower animation with rotation
        cardControls.start({ 
          x: 0, 
          rotate: [3, 0],
          transition: { 
            type: "spring", 
            stiffness: 150,  // Much softer spring
            damping: 12,     // Lower damping for smooth motion
            duration: 0.35,  // Faster animation
            ease: "easeOut"
          }
        });
      } else { // Simple mode: Right swipe = Previous
        if (onPrevious) onPrevious();
      }
    } else if (dragOffset < -leftThreshold || (dragOffset < -80 && dragVelocity < -velocityThreshold)) { 
      // Swipe Left - requires deliberate movement
      if (onNext) onNext(); // Both modes: Left swipe = Next/Skip
    } else { // Snap back with more dramatic animation
      cardControls.start({ 
        x: 0, 
        transition: { 
          type: "spring", 
          stiffness: 250,  // Reduced stiffness for slower movement
          damping: 30,     // Increased damping for smoother animation
          duration: 0.8,   // Extended duration
          ease: "easeOut"
        }
      });
    }
  };

  // Handler for the hidden button to call parent's open calculator callback
  const handleOpenCalculatorClick = () => {
      if(onOpenCalculator) {
          console.log("Hidden button clicked, calling onOpenCalculator");
          onOpenCalculator();
      } else {
          console.warn("Hidden button clicked, but onOpenCalculator prop is missing");
      }
  };


 return (
  // Outer wrapper - No overflow-hidden, add dragPropagation
  <motion.div
    ref={cardRef}
    className="h-full w-full rounded-2xl shadow-xl" // Added larger rounded corners for better appearance
    drag={cardControls ? "x" : false} // Only draggable if interactive
    dragConstraints={{ left: 0, right: 0 }}
    dragElastic={0.5}
    dragPropagation // Allow scroll events to propagate
    onDragStart={handleDragStart}
    onDrag={handleDrag}
    onDragEnd={handleDragEnd}
    animate={cardControls} // Use controls from parent (can be undefined)
    style={{
      x: xToUse, // Use our safe motion value
      opacity: cardOpacity,
      rotate: cardRotate,
      scale: cardScale,
      backgroundColor: displayMode === 'simple' ? '#111827' : '#FFFFFF',
      color: displayMode === 'simple' ? 'white' : '#1F2937',
      cursor: cardControls ? 'grab' : 'default'
    }}
    whileTap={cardControls ? { cursor: 'grabbing' } : {}}
  >
    {/* Inner scroll container - Absolutely positioned */}
    <div
        className={`absolute inset-0 overflow-y-auto overflow-x-hidden pb-16 stock-card-scroll-content rounded-2xl ${displayMode === 'simple' ? 'bg-gradient-to-b from-gray-900 to-black text-white' : 'bg-white text-slate-900'}`}
        style={{ touchAction: 'pan-y', WebkitOverflowScrolling: 'touch' }} 
    >

      {/* --- Time frame selector (realtime mode only) --- */}
      {displayMode === 'realtime' && (
          <div className="sticky top-0 z-20 flex justify-center space-x-1 px-4 py-3 border-b border-slate-100 bg-white shadow-sm">
               {periodsQuery.isLoading ? (
                 // Show loading state for time periods
                 <div className="flex justify-center space-x-1">
                   {["1M", "3M", "6M"].map((period) => (
                     <Skeleton key={period} className="w-10 h-6 rounded-full" />
                   ))}
                 </div>
               ) : (
                 // Show available periods from API, filtering out non-timeframe keys
                 (availablePeriods || ["5D", "1M", "3M", "6M", "1Y"])
                   .filter(period => 
                     ["1D", "5D", "1W", "1M", "3M", "6M", "YTD", "1Y", "5Y", "MAX"].includes(period)
                   )
                   .map((period) => (
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
               )))}
           </div>
      )}
      {displayMode === 'simple' && <div className="pt-4"></div>}

      {/* --- Content Specific to Mode --- */}
      {displayMode === 'simple' ? (
        <>
          {/* Paste the *content* blocks for simple mode here */}
             {/* Enhanced Header */}
             <div className="p-5 border-b border-gray-800">
                 {/* ... Simple Header JSX ... */}
                  <div className="flex justify-between items-start">
                    <div>
                      <a
                        href={`/stock-detail/${stock.ticker}`}
                        className="group inline-flex items-center gap-1.5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <h2 className="text-xl md:text-2xl font-bold text-white mb-1 group-hover:text-blue-300 transition-colors">{stock.name} <span className="text-gray-400 group-hover:text-blue-400 transition-colors">({stock.ticker})</span></h2>
                        <BarChart3 size={20} className="text-gray-400 group-hover:text-blue-300 transition-colors" />
                      </a>
                      <div className="flex items-center text-xs text-gray-400 mt-1 mb-2">
                        <span className="mr-2">Day's Range:</span>
                        <span className="font-medium">${formatNumber(stock.price * 0.98)} - ${formatNumber(stock.price * 1.02)}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <div className={`flex items-center py-1.5 px-4 rounded-full ${stock.change >= 0 ? 'bg-green-900/30 text-green-300 border border-green-700/30' : 'bg-red-900/30 text-red-300 border border-red-700/30'} shadow-lg`}>
                        <span className="font-bold text-2xl">${formatNumber(stock.price)}</span>
                        <span className="ml-2 text-sm font-medium">{stock.change >= 0 ? '+' : ''}{formatNumber(stock.change)}%</span>
                      </div>
                      <span className="text-xs text-gray-500 mt-2">Updated: {new Date().toLocaleDateString()}</span>
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-gray-300 leading-relaxed">
                    {stock.description}
                  </p>
             </div>
             {/* Metrics */}
             <div className="grid grid-cols-2 gap-5 p-5 border-b border-gray-800">
                 <h3 className="text-white text-lg font-bold col-span-2 mb-1 flex items-center">
                     <TrendingUp className="w-5 h-5 mr-2 text-blue-400" /> Stock Metrics
                 </h3>
                 {Object.entries(stockWithMetrics.metrics as Metrics).map(([key, metricObj]) => {
                    const metricName = key.charAt(0).toUpperCase() + key.slice(1);
                    return (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: Math.random() * 0.3 }}
                            key={key}
                            className={`p-4 rounded-xl relative ${
                              metricObj.color === 'green' ? 'bg-gradient-to-br from-green-900/40 to-black border border-green-500/30' :
                              metricObj.color === 'yellow' ? 'bg-gradient-to-br from-yellow-900/40 to-black border border-yellow-500/30' :
                              'bg-gradient-to-br from-red-900/40 to-black border border-red-500/30'
                            } active:scale-98 transition-all duration-150 cursor-pointer shadow-lg hover:shadow-xl`}
                            onClick={() => handleMetricClickInternal(metricName)} // Use internal handler
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                        >
                           <div className="absolute top-3 right-3 rounded-full bg-black/30 p-1">
                              <Info size={16} className={`${ metricObj.color === 'green' ? 'text-green-400' : metricObj.color === 'yellow' ? 'text-yellow-400' : 'text-red-400' }`} />
                           </div>
                           <div className={`text-2xl font-bold ${ metricObj.color === 'green' ? 'text-green-300' : metricObj.color === 'yellow' ? 'text-yellow-300' : 'text-red-300' }`}>
                               {typeof metricObj.value === 'number' ? formatNumber(metricObj.value) : metricObj.value}
                           </div>
                           <div className="text-white text-sm font-medium capitalize mt-1 mb-3">
                               {metricName}
                           </div>
                           <div className={`absolute bottom-1 left-1 w-12 h-12 rounded-full opacity-20 blur-xl -z-10 ${ metricObj.color === 'green' ? 'bg-green-400' : metricObj.color === 'yellow' ? 'bg-yellow-400' : 'bg-red-400' }`} />
                        </motion.div>
                    );
                 })}
             </div>

             {/* Ask AI */}
             <div className="p-5 border-b border-gray-800">
                 <h3 className="text-lg font-bold text-white mb-3 flex items-center">
                     <MessageCircle className="w-5 h-5 mr-2 text-purple-400" /> Ask AI About {stock.ticker}
                 </h3>
                 <motion.div
                     initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}
                     className="rounded-xl border border-gray-700/50 overflow-hidden shadow-lg relative"
                 >
                     <div className="absolute -inset-1 bg-purple-500/5 blur-xl rounded-xl z-0"></div>
                     <div className="relative z-10"> <AskAI stock={stockWithMetrics} /> </div>
                 </motion.div>
             </div>
             {/* Forecast */}
             <div className="p-5 border-b border-gray-800">
                 <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                     <TrendingUp className="w-5 h-5 mr-2 text-amber-400" /> Price Forecast <span className="text-xs bg-gradient-to-r from-amber-800 to-amber-600 text-amber-100 px-3 py-1 rounded-full ml-2 shadow-inner shadow-amber-900/20 border border-amber-700/30">Premium</span>
                 </h3>
                 <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.3 }} className="grid grid-cols-2 gap-4">
                     <div> {/* ... 1-Year Return ... */} </div>
                     <div> {/* ... Predicted Price (Premium Lock) ... */} </div>
                 </motion.div>
             </div>
             {/* Analysis */}
             <div className="p-5">
                 <h3 className="text-lg font-bold text-white mb-4 flex items-center"> <BarChart3 className="w-5 h-5 mr-2 text-blue-400" /> Stock Analysis </h3>
                 <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.4 }}>
                     <OverallAnalysisCard stock={stockWithMetrics} />
                 </motion.div>
                 <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.5 }} className="mt-4">
                     <h3 className="text-lg font-bold text-white mb-4 flex items-center"> <Layers className="w-5 h-5 mr-2 text-indigo-400" /> Industry Comparison </h3>
                     <ComparativeAnalysis currentStock={stockWithMetrics} />
                 </motion.div>
                 <div className="mt-8 mb-2 flex justify-center">
                     <div className="text-gray-500 text-sm flex items-center"> <ChevronLeft className="w-4 h-4 mr-1" /> <span>Swipe to navigate</span> <ChevronRight className="w-4 h-4 ml-1" /> </div>
                 </div>
             </div>
        </>
      ) : ( // Realtime Mode
          <>
            {/* Paste the *content* blocks for realtime mode here */}
             {/* Header/Chart */}
             <div className="bg-white p-4 flex flex-col border-b border-slate-100 shadow-sm">
                 {/* ... Realtime Header/Chart JSX ... */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Link
                        to={`/stock-detail/${stock.ticker}`}
                        className="group flex items-center gap-1.5"
                        onClick={(e: React.MouseEvent) => e.stopPropagation()}
                      >
                        <h2 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{stock.name}</h2>
                        <span className="text-slate-500 font-medium bg-slate-50 px-2 py-0.5 rounded-md group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">{stock.ticker}</span>
                        <BarChart3 size={18} className="text-slate-400 group-hover:text-blue-500 ml-1 transition-colors" />
                      </Link>
                    </div>
                    <div className="flex items-center">
                      <button onClick={refreshData} className="p-1.5 rounded-full hover:bg-slate-100 transition-colors" disabled={isRefreshing}>
                        <RefreshCw size={17} className={`text-slate-500 ${isRefreshing ? 'animate-spin' : ''}`} />
                      </button>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center">
                    <span className="text-3xl font-bold text-slate-900 drop-shadow-sm">${displayPrice}</span>
                    <div className="ml-2 flex items-center">
                      <span className={`flex items-center text-sm font-semibold px-2 py-0.5 rounded-full ${realTimeChange >= 0 ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'}`}>
                        {realTimeChange >= 0 ? <TrendingUp size={14} className="mr-1" /> : <ChevronLeft size={14} className="mr-1 rotate-90" />}
                        {realTimeChange >= 0 ? '+' : ''}{formatNumber(realTimeChange)}%
                      </span>
                    </div>
                  </div>
                  <div className="mt-1 flex items-center text-xs text-slate-500">
                    <span className="mr-2">Day's Range:</span>
                    <span className="font-medium">${formatNumber(parseFloat(displayPrice) * 0.98)} - ${formatNumber(parseFloat(displayPrice) * 1.02)}</span>
                  </div>
                  <div className="relative mt-3 h-44 py-2"> {/* Chart Area */}
                    <div className="absolute inset-0 px-4"> {/* Chart Visual */}
                        <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-[10px] text-slate-900 font-medium pointer-events-none py-3 z-10 w-12"> {/* Y Axis */}
                            <span>${Math.round(priceRangeMax)}</span> <span>${Math.round((priceRangeMax + priceRangeMin) / 2)}</span> <span>${Math.round(priceRangeMin)}</span>
                        </div>
                        <div className="absolute inset-0 pl-12 pr-4"> {/* Chart Path */}
                           <svg className="w-full h-full" viewBox={`0 0 100 100`} preserveAspectRatio="none">
                             <path d={`M-5,${100 - ((chartData[0] - minValue) / (maxValue - minValue)) * 100} ${chartData.map((point: number, i: number) => `L${(i / (chartData.length - 1)) * 110 - 5},${100 - ((point - minValue) / (maxValue - minValue)) * 100}`).join(' ')} L105,${100 - ((chartData[chartData.length-1] - minValue) / (maxValue - minValue)) * 100}`} className={`${realTimeChange >= 0 ? 'stroke-green-500' : 'stroke-red-500'} fill-none`} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                           </svg>
                        </div>
                    </div>
                    <div className="absolute left-0 right-0 bottom-1 pl-12 pr-4 flex justify-between text-[10px] text-slate-900 font-medium pointer-events-none"> {/* X Axis */}
                        {timeScaleLabels.map((label, index) => (<span key={index}>{label}</span>))}
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between text-xs h-6">
                    <span className="text-slate-900 font-medium">Last updated: {latestTradingDay}</span>
                    <span className="text-slate-700 italic">Swipe <span className="text-red-600 font-medium">left to skip</span> • Swipe <span className="text-green-600 font-medium">right to invest</span></span>
                  </div>
             </div>
             {/* Metrics */}
             <div className="grid grid-cols-2 gap-4 p-4 bg-white border-b border-slate-100">
                 {Object.entries(stockWithMetrics.metrics as Metrics).map(([key, metricObj]) => {
                    const metricName = key.charAt(0).toUpperCase() + key.slice(1);
                     return (
                        <div key={key} className="group relative" onClick={() => handleMetricClickInternal(metricName)} >
                            <div className={`absolute inset-0 rounded-xl blur-sm transform scale-[0.98] translate-y-1 opacity-0 group-hover:opacity-100 transition-all duration-300 ${ metricObj.color === 'green' ? 'bg-gradient-to-r from-green-100/30 to-emerald-100/30' : metricObj.color === 'yellow' ? 'bg-gradient-to-r from-amber-100/30 to-yellow-100/30' : 'bg-gradient-to-r from-red-100/30 to-rose-100/30'}`}></div>
                            <div className={`p-4 rounded-xl border relative z-10 overflow-hidden active:scale-95 transition-all duration-150 cursor-pointer shadow-md hover:shadow-lg group-hover:translate-y-[-2px] ${ metricObj.color === 'green' ? 'bg-white border-green-200 group-hover:border-green-300' : metricObj.color === 'yellow' ? 'bg-white border-amber-200 group-hover:border-amber-300' : 'bg-white border-red-200 group-hover:border-red-300'}`}>
                               <div className={`absolute top-0 left-0 w-full h-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${ metricObj.color === 'green' ? 'bg-gradient-to-r from-green-400 to-emerald-500' : metricObj.color === 'yellow' ? 'bg-gradient-to-r from-amber-400 to-yellow-500' : 'bg-gradient-to-r from-red-400 to-rose-500'}`}></div>
                               <div className="flex items-center justify-between mb-2">
                                 <div className={`flex items-center justify-center rounded-full w-8 h-8 ${ metricObj.color === 'green' ? 'bg-green-100 text-green-600' : metricObj.color === 'yellow' ? 'bg-amber-100 text-amber-600' : 'bg-red-100 text-red-600'}`}>
                                    {key === 'performance' && <TrendingUp size={16} />} {key === 'stability' && <Shield size={16} />} {key === 'value' && <DollarSign size={16} />} {key === 'momentum' && <Zap size={16} />}
                                 </div>
                                 <Info size={15} className="text-slate-400 group-hover:text-slate-600 transition-colors" />
                               </div>
                               <div className={`text-lg font-semibold text-slate-900`}>{typeof metricObj.value === 'number' ? formatNumber(metricObj.value) : metricObj.value}</div>
                               <div className="text-slate-500 text-sm font-medium mt-0.5 capitalize">{metricName}</div>
                            </div>
                        </div>
                     );
                 })}
             </div>
             {/* Modern Swipeable News */}
             <div className="p-4 bg-gradient-to-br from-blue-50 to-white border-b border-slate-100">
               <SwipeableNews symbol={stock.ticker} />
             </div>

             {/* Modern Analyst Ratings */}
             <div className="mb-4">
               <ModernAnalystRating 
                 symbol={stock.ticker}
                 recommendations={stockWithMetrics.recommendations}
                 priceTarget={stockWithMetrics.priceTarget}
                 currentPrice={stock.price}
                 metrics={metricsQuery.data} // Pass the raw metrics data from PostgreSQL
               />
             </div>
             
             {/* Management Section */}
             <div className="mb-4">
               <ManagementSection symbol={stock.ticker} />
             </div>

             {/* Synopsis */}
             <div className="bg-white rounded-xl border border-slate-200 shadow-md overflow-hidden mb-4">
                 <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 to-indigo-50/30 rounded-xl opacity-30"></div>
                 
                 {/* Price Trend */}
                 <div className="p-4 border-b border-slate-100 relative">
                     <h3 className="font-semibold text-slate-900 mb-2 flex items-center">
                         <TrendingUp size={16} className="text-blue-500 mr-2" />
                         Price Trend
                     </h3>
                     <p className="text-sm text-slate-600 leading-relaxed">
                         {stock.change >= 0 
                            ? `${stock.name} has shown positive momentum, rising ${formatNumber(stock.change)}% recently.` 
                            : `${stock.name} has been under pressure, falling ${formatNumber(Math.abs(stock.change))}% recently.`} 
                         The current price of ${formatNumber(stock.price)} places it 
                         {stockWithMetrics.metrics.value.color === "green" 
                            ? " at an attractive valuation compared to peers."
                            : " above average valuation metrics for its sector."}
                     </p>
                 </div>
                 
                 {/* Company Overview */}
                 <div className="p-4 border-b border-slate-100 relative">
                     <h3 className="font-semibold text-slate-900 mb-2 flex items-center">
                         <Building size={16} className="text-indigo-500 mr-2" />
                         Company Overview
                     </h3>
                     <p className="text-sm text-slate-600 leading-relaxed">
                         {stock.description.length > 200 
                            ? stock.description.substring(0, 200) + "..." 
                            : stock.description}
                     </p>
                 </div>
                 
                 {/* Portfolio Role */}
                 <div className="p-4 relative">
                     <h3 className="font-semibold text-slate-900 mb-2 flex items-center">
                         <BarChart3 size={16} className="text-amber-500 mr-2" />
                         Portfolio Role
                     </h3>
                     <p className="text-sm text-slate-600 leading-relaxed">
                         This {stock.industry} stock 
                         {stockWithMetrics.metrics.stability.color === "green" 
                            ? " offers strong stability and could serve as a defensive holding."
                            : stockWithMetrics.metrics.performance.color === "green"
                                ? " provides growth potential and could boost portfolio returns."
                                : " has balanced metrics and fits well in a diversified portfolio."}
                         {stockWithMetrics.metrics.stability.value === "Excellent" || stockWithMetrics.metrics.performance.value === "Excellent" 
                            ? " Rated high quality by our analysis."
                            : stockWithMetrics.metrics.stability.value === "Good" || stockWithMetrics.metrics.performance.value === "Good"
                                ? " Considered medium quality in our assessment."
                                : " Currently rated lower in our quality metrics."}
                     </p>
                 </div>
             </div>
             {/* Comparison */}
             <div className="bg-white border-t border-b border-slate-100 comparative-analysis-container" onClick={(e) => { /* Stop propagation for inner clicks */ }}>
               <ComparativeAnalysis currentStock={stockWithMetrics} />
             </div>
             {/* Bottom Buttons */}
             <div className="p-4 bg-white border-t border-b border-slate-100 mb-4">
                 <Link to={`/stock-detail/${stock.ticker}`} className="..." onClick={(e) => e.stopPropagation()}> View Detailed Chart </Link>
                 <div className="text-center text-sm font-medium text-slate-600 my-2"> Swipe <span className="text-red-600 font-medium">left to skip</span> • Swipe <span className="text-green-600 font-medium">right to invest</span> </div>
             </div>
             {/* Analysis */}
             {stockWithMetrics.overallAnalysis && ( <div className="p-5 bg-gradient-to-b from-white to-slate-50"> <div className="mb-1"> <OverallAnalysisCard stock={stockWithMetrics} /> </div> </div> )}
          </>
      )}

      {/* Action Buttons - Render only for interactive card */}
      {cardControls && (
        <div className="fixed bottom-0 left-0 right-0 px-2 pb-2 z-30 flex justify-center space-x-2">
            {/* Card shadow/gradient edge - only at the very bottom of screen */}
            <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black to-transparent opacity-25 -z-10 pointer-events-none"></div>
            
            <button
                className="px-6 py-3.5 rounded-xl bg-gradient-to-br from-red-500 to-red-600 text-white font-semibold shadow-lg flex items-center justify-center w-1/2 hover:from-red-600 hover:to-red-700 active:scale-95 transition-all duration-300 border border-red-400"
                onClick={() => onNext && onNext()}
            >
                <ChevronLeft className="mr-2" size={18} />
                Skip
            </button>
            
            <button
                className="px-6 py-3.5 rounded-xl bg-gradient-to-br from-green-500 to-green-600 text-white font-semibold shadow-lg flex items-center justify-center w-1/2 hover:from-green-600 hover:to-green-700 active:scale-95 transition-all duration-300 border border-green-400"
                data-testid="buy-button"
                onClick={() => onInvest && onInvest()}
            >
                <DollarSign className="mr-2" size={18} />
                Buy
            </button>
        </div>
      )}

      {/* MODALS ARE RENDERED IN PARENT */}

    </div> {/* End scrollable inner container */}
  </motion.div> // End main motion wrapper
 );
}