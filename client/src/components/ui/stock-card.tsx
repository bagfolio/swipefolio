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

  // Fetch Yahoo Finance data
  const { data: yahooChartData, isLoading: isLoadingYahooData, error: yahooError, refetch: refetchYahooData } =
    useYahooChartData(stock.ticker, timeFrame);

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

  // --- Other calculations based on stock prop (displayPrice, realTimeChange, etc.) ---
  // Ensure stock and stock.price are valid before calculations
  const validPrice = stock && typeof stock.price === 'number' ? stock.price : 0;
  const validChange = stock && typeof stock.change === 'number' ? stock.change : 0;

  const displayPrice = validPrice.toFixed(2);
  const realTimeChange = validChange; // Assuming change is already a percentage

  // Calculate min/max for chart axis safely
  const minValue = chartPrices.length > 0 ? Math.min(...chartPrices) * 0.98 : validPrice * 0.95; // Add fallback
  const maxValue = chartPrices.length > 0 ? Math.max(...chartPrices) * 1.02 : validPrice * 1.05; // Add fallback
  const priceRangeMin = Math.floor(minValue);
  const priceRangeMax = Math.ceil(maxValue);

  // Get appropriate time labels based on data source
  const timeScaleLabels = useMemo(() => {
    return getYahooTimeScaleLabels(timeFrame, yahooChartData);
  }, [timeFrame, yahooChartData]);

  // Use the latest trading day from Yahoo data if available
  const latestTradingDay = useMemo(() => {
    if (yahooChartData?.quotes?.length > 0) {
      const lastQuote = yahooChartData.quotes[yahooChartData.quotes.length - 1];
      return new Date(lastQuote.date).toISOString().split('T')[0];
    }
    // Fallback or default date if needed
    return new Date().toISOString().split('T')[0];
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
    if (distanceMoved > 50 && dragDuration > 150) {
      isDraggingIntentionallyRef.current = true;
    }
  };

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (!cardControls) return;

    if (!isDraggingIntentionallyRef.current) {
      cardControls.start({ x: 0, transition: { type: "spring", stiffness: 250, damping: 35, duration: 0.8 } });
      return;
    }

    const rightThreshold = 150;
    const leftThreshold = 120;
    const velocityThreshold = 250;
    const dragVelocity = info.velocity.x;
    const dragOffset = info.offset.x;

    if (dragOffset > rightThreshold || (dragOffset > 80 && dragVelocity > velocityThreshold)) {
      if (onInvest) onInvest();
      cardControls.start({ x: 0, rotate: [5, 0], transition: { type: "spring", stiffness: 280, damping: 22, duration: 0.85, ease: "easeInOut" } });
    } else if (dragOffset < -leftThreshold || (dragOffset < -80 && dragVelocity < -velocityThreshold)) {
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
    dragElastic={0.5}
    dragPropagation
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
      cursor: cardControls ? 'grab' : 'default'
    }}
    whileTap={cardControls ? { cursor: 'grabbing' } : {}}
  >
    {/* Inner scroll container */}
    <div
        className="absolute inset-0 overflow-y-auto overflow-x-hidden pb-20 stock-card-scroll-content rounded-2xl bg-white text-slate-900" // Increased bottom padding
        style={{ touchAction: 'pan-y', WebkitOverflowScrolling: 'touch' }}
    >
      {/* --- Time frame selector --- */}
      <div className="sticky top-0 z-20 flex justify-center space-x-1 px-4 py-3 border-b border-slate-100 bg-white shadow-sm">
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

      {/* --- Header/Chart --- */}
      <div className="bg-white p-4 flex flex-col border-b border-slate-100 shadow-sm">
            {/* Stock Name & Ticker */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Link
                  to={`/stock-detail/${stock.ticker}`} // Link to detailed view
                  className="group flex items-center gap-1.5"
                  onClick={(e: React.MouseEvent) => e.stopPropagation()} // Prevent card drag/swipe
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
             {/* Price and Change */}
            <div className="mt-2 flex items-center">
                <span className="text-3xl font-bold text-slate-900 drop-shadow-sm">${displayPrice}</span>
                <div className="ml-2 flex items-center">
                <span className={`flex items-center text-sm font-semibold px-2 py-0.5 rounded-full ${realTimeChange >= 0 ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'}`}>
                    {realTimeChange >= 0 ? <TrendingUp size={14} className="mr-1" /> : <ChevronLeft size={14} className="mr-1 rotate-90" />} {/* Assuming TrendingDown isn't available */}
                    {realTimeChange >= 0 ? '+' : ''}{realTimeChange.toFixed(2)}%
                </span>
                </div>
            </div>
            {/* Day's Range */}
            <div className="mt-1 flex items-center text-xs text-slate-500">
                <span className="mr-2">Day's Range:</span>
                {/* Safely calculate range */}
                <span className="font-medium">${(validPrice * 0.98).toFixed(2)} - ${(validPrice * 1.02).toFixed(2)}</span>
            </div>
             {/* Chart Area */}
            <div className="relative mt-3 h-44 py-2">
                {isLoadingYahooData && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/50">
                        <Skeleton className="h-full w-full" />
                    </div>
                )}
                {!isLoadingYahooData && yahooError && (
                     <div className="absolute inset-0 flex items-center justify-center text-xs text-red-500 p-2 bg-red-50 rounded">
                        Error loading chart data.
                    </div>
                )}
                {!isLoadingYahooData && !yahooError && chartPrices.length > 0 && (
                    <>
                        {/* Y Axis Labels */}
                        <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-[10px] text-slate-900 font-medium pointer-events-none py-3 z-10 w-12">
                            <span>${priceRangeMax.toFixed(0)}</span>
                            <span>${((priceRangeMax + priceRangeMin) / 2).toFixed(0)}</span>
                            <span>${priceRangeMin.toFixed(0)}</span>
                        </div>
                        {/* Chart SVG */}
                        <div className="absolute inset-0 pl-12 pr-4">
                            <svg className="w-full h-full" viewBox={`0 0 100 100`} preserveAspectRatio="none">
                                {/* Gradient Definition */}
                                <defs>
                                <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <stop offset="0%" stopColor={realTimeChange >= 0 ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)'} />
                                    <stop offset="100%" stopColor={realTimeChange >= 0 ? 'rgba(34, 197, 94, 0.01)' : 'rgba(239, 68, 68, 0.01)'} />
                                </linearGradient>
                                </defs>
                                {/* Chart Line */}
                                <path
                                d={`M-5,${100 - ((chartPrices[0] - minValue) / (maxValue - minValue || 1)) * 100} ${
                                    chartPrices.map((point: number, i: number) =>
                                    `L${(i / (chartPrices.length - 1)) * 110 - 5},${100 - ((point - minValue) / (maxValue - minValue || 1)) * 100}`
                                    ).join(' ')
                                } L105,${100 - ((chartPrices[chartPrices.length - 1] - minValue) / (maxValue - minValue || 1)) * 100}`}
                                className={`${realTimeChange >= 0 ? 'stroke-green-500' : 'stroke-red-500'} fill-none`}
                                strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                                />
                                {/* Area Fill */}
                                <path
                                d={`M-5,${100 - ((chartPrices[0] - minValue) / (maxValue - minValue || 1)) * 100} ${
                                    chartPrices.map((point: number, i: number) =>
                                    `L${(i / (chartPrices.length - 1)) * 110 - 5},${100 - ((point - minValue) / (maxValue - minValue || 1)) * 100}`
                                    ).join(' ')
                                } L105,${100 - ((chartPrices[chartPrices.length - 1] - minValue) / (maxValue - minValue || 1)) * 100} L105,100 L-5,100 Z`}
                                fill="url(#chartGradient)" fillOpacity="0.5"
                                />
                            </svg>
                        </div>
                        {/* X Axis Labels */}
                         <div className="absolute left-0 right-0 bottom-1 pl-12 pr-4 flex justify-between text-[10px] text-slate-900 font-medium pointer-events-none">
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
             {/* Last Updated Info */}
             <div className="mt-4 flex items-center justify-between text-xs h-6">
                <span className="text-slate-900 font-medium">Last updated: {latestTradingDay}</span>
                <span className="text-slate-700 italic">Swipe <span className="text-red-600 font-medium">left to skip</span> • Swipe <span className="text-green-600 font-medium">right to invest</span></span>
            </div>
      </div>

      {/* --- Metrics --- */}
      <div className="grid grid-cols-2 gap-4 p-4 bg-white border-b border-slate-100">
          {Object.entries(stock.metrics).filter(([key]) => ['performance', 'stability', 'value', 'momentum'].includes(key)).map(([key, metricObj]) => {
          const metricName = key.charAt(0).toUpperCase() + key.slice(1);
          return (
              <div key={key} className="group relative" onClick={() => handleMetricClickInternal(metricName)} >
                  {/* Hover Glow Effect */}
                  <div className={`absolute inset-0 rounded-xl blur-sm transform scale-[0.98] translate-y-1 opacity-0 group-hover:opacity-100 transition-all duration-300 ${ metricObj.color === 'green' ? 'bg-gradient-to-r from-green-100/30 to-emerald-100/30' : metricObj.color === 'yellow' ? 'bg-gradient-to-r from-amber-100/30 to-yellow-100/30' : 'bg-gradient-to-r from-red-100/30 to-rose-100/30'}`}></div>
                  {/* Main Metric Box */}
                  <div className={`p-4 rounded-xl border relative z-10 overflow-hidden active:scale-95 transition-all duration-150 cursor-pointer shadow-md hover:shadow-lg group-hover:translate-y-[-2px] ${ metricObj.color === 'green' ? 'bg-white border-green-200 group-hover:border-green-300' : metricObj.color === 'yellow' ? 'bg-white border-amber-200 group-hover:border-amber-300' : 'bg-white border-red-200 group-hover:border-red-300'}`}>
                      {/* Top Color Bar */}
                      <div className={`absolute top-0 left-0 w-full h-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${ metricObj.color === 'green' ? 'bg-gradient-to-r from-green-400 to-emerald-500' : metricObj.color === 'yellow' ? 'bg-gradient-to-r from-amber-400 to-yellow-500' : 'bg-gradient-to-r from-red-400 to-rose-500'}`}></div>
                      {/* Icon and Info */}
                      <div className="flex items-center justify-between mb-2">
                      <div className={`flex items-center justify-center rounded-full w-8 h-8 ${ metricObj.color === 'green' ? 'bg-green-100 text-green-600' : metricObj.color === 'yellow' ? 'bg-amber-100 text-amber-600' : 'bg-red-100 text-red-600'}`}>
                          {key === 'performance' && <TrendingUp size={16} />} {key === 'stability' && <Shield size={16} />} {key === 'value' && <DollarSign size={16} />} {key === 'momentum' && <Zap size={16} />}
                      </div>
                      <Info size={15} className="text-slate-400 group-hover:text-slate-600 transition-colors" />
                      </div>
                      {/* Value and Name */}
                      <div className={`text-lg font-semibold text-slate-900`}>{metricObj.value}</div>
                      <div className="text-slate-500 text-sm font-medium mt-0.5 capitalize">{metricName}</div>
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

       {/* --- News Section --- */}
        <div className="bg-white border-t border-slate-100 mb-4 mx-4 rounded-xl shadow-md"> {/* Added margin and rounded corners */}
            <div className="p-4">
                <h3 className="font-semibold text-slate-900 mb-3 flex items-center">
                    <Calendar size={16} className="text-blue-500 mr-2" /> Latest News
                </h3>
                <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                    <StockNewsSection stock={stock} />
                </div>
            </div>
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
