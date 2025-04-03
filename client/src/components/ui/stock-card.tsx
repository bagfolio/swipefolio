import React, { useState, useRef, useMemo, useEffect } from 'react';
import { useMotionValue, useTransform, motion, AnimationControls, PanInfo } from 'framer-motion';
import { Link } from 'wouter';
import {
  Calendar,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Info,
  MessageCircle,
  Layers,
  RefreshCw,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery } from '@tanstack/react-query';
import { StockData, fetchStockMetrics, formatMetricsFromDatabase } from "@/lib/stock-data";
import { getIndustryAverages } from '@/lib/industry-data';
import AskAI from '@/components/ui/ask-ai';

// Define metric type to satisfy TypeScript
export interface MetricClickData {
  name: string;
  color: "green" | "yellow" | "red";
  data: {
    values: Array<{
      label: string;
      value: string | number;
      suffix?: string;
      explanation?: string;
    }>;
    rating: string;
    industryAverage: Array<{ label: string; value: string }>;
    industry: string;
    explanation: string;
    name: string;
  };
}

// Define Metrics interface
export interface Metrics {
  performance: {
    value: string;
    color: string;
    details: any;
    explanation?: string;
  };
  stability: {
    value: string;
    color: string;
    details: any;
    explanation?: string;
  };
  value: {
    value: string;
    color: string;
    details: any;
    explanation?: string;
  };
  momentum: {
    value: string;
    color: string;
    details: any;
    explanation?: string;
  };
  potential?: {
    value: string;
    color: string;
    details: any;
    explanation?: string;
  };
}

interface PurchaseData {
  symbol: string;
  amount: number;
  price: number;
  shares: number;
}

// Interface for stock prop with full typing to work with TypeScript
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

type TimeFrame = '1D' | '5D' | '1W' | '1M' | '3M' | '6M' | '1Y';

// Add CSS to hide scrollbars while preserving scroll functionality
const scrollbarHidingCSS = `
  .hide-scrollbar::-webkit-scrollbar {
    display: none;
  }
  .hide-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
`;

// Get industry average data for comparisons
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
        return { availablePeriods: ['5D', '1W', '1M', '3M', '6M', '1Y'] };
      }
    },
    staleTime: 60 * 1000, // 1 minute
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
  
  // Use changePercent if available (from PostgreSQL), otherwise calculate it from change
  let realTimeChange: number;
  if (stock.changePercent !== undefined) {
    realTimeChange = parseFloat(formatNumber(stock.changePercent));
  } else if (stock.change !== undefined && stock.price !== undefined) {
    // If we have change but no changePercent, estimate it based on price
    realTimeChange = parseFloat(formatNumber((stock.change / stock.price) * 100));
  } else {
    realTimeChange = 0;
  }
  
  const latestTradingDay = new Date().toISOString().split('T')[0];

  // Refresh handler to refetch data from API
  const refreshData = async () => {
    setIsRefreshing(true);
    try {
      // Refetch all API calls
      await periodsQuery.refetch();
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
  const dragStartYRef = useRef<number>(0);
  const dragDistanceThresholdRef = useRef<number>(0);
  const isDraggingIntentionallyRef = useRef<boolean>(false);
  const screenWidthRef = useRef<number>(0);
  
  // Track when drag starts with initial position
  const handleDragStart = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    dragStartTimeRef.current = Date.now();
    dragStartXRef.current = info.point.x;
    dragStartYRef.current = info.point.y;
    isDraggingIntentionallyRef.current = false;
    dragDistanceThresholdRef.current = 0;
    
    // Get screen width to use as a percentage reference
    screenWidthRef.current = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
  };
  
  // Handle drag during movement to determine intentional vs accidental
  const handleDrag = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (!cardControls) return;
    
    // Calculate absolute distances moved horizontally and vertically
    const horizontalDistance = Math.abs(info.point.x - dragStartXRef.current);
    const verticalDistance = Math.abs(info.point.y - dragStartYRef.current);
    dragDistanceThresholdRef.current = Math.max(dragDistanceThresholdRef.current, horizontalDistance);
    
    // Get drag duration and screen width percentage (how far they've swiped)
    const dragDuration = Date.now() - dragStartTimeRef.current;
    const screenWidthPercentage = (horizontalDistance / screenWidthRef.current) * 100;
    
    // Much more restrictive conditions:
    // 1. Horizontal movement must be at least 3x greater than vertical
    // 2. Horizontal distance must exceed minimum 25% of screen width
    // 3. Longer drag duration required (250ms)
    // 4. Must be a deliberate swipe with some velocity
    if (horizontalDistance > verticalDistance * 3 && 
        screenWidthPercentage > 25 &&  // Require at least 25% of screen width
        dragDuration > 250 && 
        horizontalDistance > 80) {   // Minimum pixel threshold regardless of screen size
      isDraggingIntentionallyRef.current = true;
    }
  };
  
  // Drag handler with improved responsiveness - much more restrictive
  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (!cardControls) return; // Not interactive if no controls

    // ALWAYS snap back to center position first - this ensures consistent behavior
    const snapBack = (stiffness = 250, damping = 20, duration = 0.3) => {
      cardControls.start({ 
        x: 0, 
        transition: { 
          type: "spring", 
          stiffness,
          damping,
          duration,
          ease: "easeOut"
        }
      });
    };

    // If the drag wasn't explicitly intentional, just snap back and return immediately
    if (!isDraggingIntentionallyRef.current) {
      snapBack(300, 25, 0.25); // Very quick snapback for unintentional movements
      return;
    }

    // Even after passing intentionality check, verify we didn't have significant vertical movement
    const verticalDistance = Math.abs(info.point.y - dragStartYRef.current);
    const horizontalDistance = Math.abs(info.offset.x);
    
    // If vertical movement is at all significant, treat as vertical scroll not swipe
    if (verticalDistance > horizontalDistance * 0.5) {
      snapBack(300, 25, 0.25);
      return;
    }

    // Get screen width to calculate percentage
    const screenWidth = screenWidthRef.current;
    const dragOffsetPercentage = (Math.abs(info.offset.x) / screenWidth) * 100;
    
    // Much more demanding swipe thresholds - require very deliberate movement
    // Require 1/3 of screen width OR high velocity
    const offsetThreshold = screenWidth / 3; // 33% of screen width
    const velocityThreshold = 500; // Much higher velocity threshold
    
    const dragVelocity = info.velocity.x;
    const dragOffset = info.offset.x;
    
    // Only trigger swipe action if user has dragged at least 33% of screen width 
    // OR has a very high velocity + 20% of screen width
    if ((Math.abs(dragOffset) > offsetThreshold) || 
        (Math.abs(dragVelocity) > velocityThreshold && dragOffsetPercentage > 20)) {
      
      // Right swipe (positive offset)
      if (dragOffset > 0) {
        if (displayMode === 'realtime') {
          if (onInvest) onInvest();
          // Animation with rotation
          cardControls.start({ 
            x: 0, 
            rotate: [3, 0],
            transition: { 
              type: "spring", 
              stiffness: 150,  
              damping: 12,     
              duration: 0.35,  
              ease: "easeOut"
            }
          });
        } else { // Simple mode: Right swipe = Previous
          if (onPrevious) onPrevious();
        }
      } 
      // Left swipe (negative offset)
      else if (dragOffset < 0) {
        if (onNext) onNext(); // Both modes: Left swipe = Next/Skip
      }
    } else {
      // Not enough movement - snap back with smooth animation
      snapBack(250, 25, 0.4);
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
    // Outer wrapper
    <motion.div
      ref={cardRef}
      className="h-full w-full rounded-2xl shadow-xl"
      drag={cardControls ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.3}
      dragTransition={{ 
        power: 0.15,
        timeConstant: 350,
        modifyTarget: (target) => Math.round(target / 50) * 50
      }}
      dragPropagation={false}
      onDragStart={handleDragStart}
      onDrag={handleDrag}
      onDragEnd={handleDragEnd}
      animate={cardControls}
      style={{
        x: xToUse,
        opacity: cardOpacity,
        rotate: cardRotate,
        scale: cardScale,
        backgroundColor: displayMode === 'simple' ? '#111827' : '#FFFFFF',
        color: displayMode === 'simple' ? 'white' : '#1F2937',
        cursor: cardControls ? 'grab' : 'default',
        willChange: 'transform'
      }}
      whileTap={cardControls ? { cursor: 'grabbing' } : {}}
    >
      {/* Add custom style to hide scrollbars */}
      <style>{scrollbarHidingCSS}</style>
      
      {/* Inner scroll container */}
      <div
        className={`absolute inset-0 overflow-y-auto overflow-x-hidden pb-16 stock-card-scroll-content rounded-2xl hide-scrollbar ${
          displayMode === 'simple' ? 'bg-gradient-to-b from-gray-900 to-black text-white' : 'bg-white text-slate-900'
        }`}
        style={{ 
          touchAction: 'pan-y', 
          WebkitOverflowScrolling: 'touch',
          scrollBehavior: 'smooth',
          overscrollBehavior: 'contain'
        }} 
      >
        {/* Time period selector */}
        <div className="sticky top-0 z-20 flex flex-col px-4 py-3 border-b border-slate-200 bg-white shadow-lg">
          <h3 className="text-base font-bold text-gray-700 mb-2 uppercase tracking-wider flex items-center">
            <Calendar size={16} className="mr-2" />
            TIME PERIOD
          </h3>
          <div className="flex flex-wrap justify-center gap-2 py-2">
            {periodsQuery.isLoading ? (
              <div className="flex justify-center gap-2">
                {["5D", "1M", "3M", "6M", "1Y"].map((period) => (
                  <Skeleton key={period} className="w-20 h-12 rounded-md" />
                ))}
              </div>
            ) : (
              ["5D", "1M", "3M", "6M", "1Y"].map((period) => (
                <button
                  key={period}
                  className={`px-4 py-3 text-base font-bold rounded-lg transition-all duration-200 min-w-[4.5rem] ${
                    timeFrame === period
                      ? `${realTimeChange >= 0 
                          ? 'text-green-800 bg-green-100 border-2 border-green-400 shadow-md scale-105' 
                          : 'text-red-800 bg-red-100 border-2 border-red-400 shadow-md scale-105'}`
                      : 'text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300 hover:scale-105'
                  }`}
                  onClick={() => setTimeFrame(period as TimeFrame)}
                >
                  {period}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Simplified content for both modes */}
        <div className="bg-white p-4 flex flex-col border-b border-slate-100 shadow-sm">
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
          <div className="mt-2 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-3xl font-bold text-slate-900 drop-shadow-sm">${displayPrice}</span>
              <div className="mt-1 flex items-center text-xs text-slate-500">
                <span className="mr-2">Day's Range:</span>
                <span className="font-medium">${formatNumber((stock.dayLow !== undefined) ? stock.dayLow : parseFloat(displayPrice) * 0.98)} - ${formatNumber((stock.dayHigh !== undefined) ? stock.dayHigh : parseFloat(displayPrice) * 1.02)}</span>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <div className={`flex items-center font-semibold px-3 py-1.5 rounded-lg ${realTimeChange >= 0 ? 'text-green-700 bg-green-100 border border-green-200' : 'text-red-700 bg-red-100 border border-red-200'}`}>
                {realTimeChange >= 0 ? <TrendingUp size={16} className="mr-1.5" /> : <TrendingDown size={16} className="mr-1.5" />}
                {realTimeChange >= 0 ? '+' : ''}{formatNumber(realTimeChange)}%
              </div>
              <span className="text-xs text-slate-500 mt-1 italic">Last price: ${formatNumber(stock.previousClose !== undefined ? stock.previousClose : (stock.price - stock.change))}</span>
            </div>
          </div>
          
          {/* Message about charts being removed */}
          <div className="mt-4 bg-slate-50 p-6 rounded-lg text-center border border-slate-200">
            <div className="font-medium text-slate-700">
              Stock charts have been removed from this view. 
              <br />
              Please view detailed charts on the stock details page.
            </div>
            <Link 
              to={`/stock-detail/${stock.ticker}`} 
              className="mt-3 inline-block px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors"
            >
              View detailed charts
            </Link>
          </div>
        </div>
        
        {/* Key Performance Metrics */}
        <div className="bg-white p-4 border-b border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-3 flex items-center">
            <TrendingUp size={18} className="mr-2 text-blue-500" /> 
            Key Performance Metrics
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(stockWithMetrics.metrics).filter(([key]) => key !== 'potential').map(([key, metric]) => {
              // Type assertion to work with the metric object
              const typedMetric = metric as {
                value: string;
                color: string;
                details: any;
                explanation?: string;
              };
              const metricName = key.charAt(0).toUpperCase() + key.slice(1);
              return (
                <div 
                  key={key}
                  onClick={() => handleMetricClickInternal(metricName)}
                  className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 hover:shadow-md ${
                    typedMetric.color === 'green' ? 'border-green-200 bg-green-50' : 
                    typedMetric.color === 'yellow' ? 'border-yellow-200 bg-yellow-50' :
                    'border-red-200 bg-red-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-800">{metricName}</span>
                    <Info size={16} className={`${
                      typedMetric.color === 'green' ? 'text-green-600' : 
                      typedMetric.color === 'yellow' ? 'text-yellow-600' : 
                      'text-red-600'
                    }`} />
                  </div>
                  <div className={`mt-2 text-lg font-bold ${
                    typedMetric.color === 'green' ? 'text-green-700' : 
                    typedMetric.color === 'yellow' ? 'text-yellow-700' : 
                    'text-red-700'
                  }`}>
                    {typedMetric.value}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Stock Details */}
        <div className="bg-white p-4 border-b border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-3">Stock Overview</h3>
          <p className="text-slate-600 mb-4">{stock.description || "No description available."}</p>
          
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Industry:</span>
              <span className="font-medium text-slate-800">{stock.industry}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">P/E Ratio:</span>
              <span className="font-medium text-slate-800">
                {stockWithMetrics.metrics.value.details.peRatio !== undefined 
                  ? formatNumber(stockWithMetrics.metrics.value.details.peRatio as number) 
                  : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Dividend Yield:</span>
              <span className="font-medium text-slate-800">
                {stockWithMetrics.metrics.value.details.dividendYield !== undefined && stockWithMetrics.metrics.value.details.dividendYield !== 'N/A'
                  ? `${formatNumber(stockWithMetrics.metrics.value.details.dividendYield as number)}%` 
                  : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Beta:</span>
              <span className="font-medium text-slate-800">
                {stockWithMetrics.metrics.stability.details.beta !== undefined 
                  ? formatNumber(stockWithMetrics.metrics.stability.details.beta as number) 
                  : 'N/A'}
              </span>
            </div>
          </div>
          
          {/* Quick Buy Button (Investment) */}
          {onInvest && (
            <button
              onClick={onInvest}
              className="mt-4 w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg flex items-center justify-center transition-colors"
            >
              <span>Invest in {stock.ticker}</span>
            </button>
          )}
        </div>
        
        {/* AI Assistant */}
        <div className="bg-white p-4 border-b border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-3 flex items-center">
            <MessageCircle size={18} className="mr-2 text-purple-500" /> 
            AI Assistant
          </h3>
          <div className="border border-purple-100 rounded-lg bg-purple-50 overflow-hidden">
            <AskAI stock={stockWithMetrics} />
          </div>
        </div>
        
        {/* Swipe Instructions */}
        <div className="bg-white p-4 flex justify-center items-center text-sm text-slate-500">
          <ChevronLeft size={16} className="mr-1" />
          <span>Swipe to navigate</span>
          <ChevronRight size={16} className="ml-1" />
        </div>
      </div>
    </motion.div>
  );
}