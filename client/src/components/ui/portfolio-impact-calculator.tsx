import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import { X, DollarSign, ChevronDown, ChevronUp, Info, TrendingUp, Shield, Zap, ArrowRight, Check } from "lucide-react";
import { StockData } from "@/lib/stock-data";
import { usePortfolio } from "@/contexts/portfolio-context";
import { cn } from "@/lib/utils";

interface PortfolioImpactCalculatorProps {
  isOpen: boolean;
  onClose: () => void;
  onPurchaseComplete: (data: { shares: number; amount: number; projectedReturn: number }) => void;
  stock: StockData;
}

export default function PortfolioImpactCalculator({
  isOpen,
  onClose,
  onPurchaseComplete,
  stock,
}: PortfolioImpactCalculatorProps) {
  const { cash, calculateImpact, buyStock, isLoading } = usePortfolio();
  
  // State for investment amount - start with min $1
  const [investmentAmount, setInvestmentAmount] = useState<number>(1);
  const [showValueShares, setShowValueShares] = useState<boolean>(true); // true for value, false for shares
  
  // State for metric info tooltips
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  
  // No longer need internal success modal state as it's managed by parent
  
  // Metric explanations
  const metricExplanations = {
    performance: "Shows how much your portfolio has grown over time through stock price increases and dividends.",
    stability: "Measures how consistent your portfolio's value remains during market ups and downs.",
    value: "Indicates whether the companies in your portfolio are reasonably priced compared to what they're actually worth.",
    momentum: "Shows the strength and direction of your portfolio's recent price movements."
  };
  
  // Slide-to-invest state variables
  const slideTrackRef = useRef<HTMLDivElement>(null);
  const [slideTrackWidth, setSlideTrackWidth] = useState(0);
  const [slidingInProgress, setSlidingInProgress] = useState(false);
  const [slideSuccess, setSlideSuccess] = useState(false);
  const slideX = useMotionValue(0);
  const successOpacity = useTransform(
    slideX,
    [0, slideTrackWidth * 0.7, slideTrackWidth],
    [0, 0.5, 1]
  );
  
  // Maximum amount available to invest
  const maxInvestment = cash; // Allow using all available cash
  
  // Calculate impact of adding this stock
  const impact = calculateImpact(stock, investmentAmount);
  
  // Calculate shares that would be purchased
  const shares = investmentAmount / stock.price;
  
  // Calculate projected 1-year return based on stock oneYearReturn
  const oneYearReturnValue = typeof stock.oneYearReturn === 'string' ? parseFloat(stock.oneYearReturn) : stock.oneYearReturn ?? 0;
  const projectedReturn = investmentAmount * (1 + oneYearReturnValue / 100);
  
  // Update slideTrackWidth when the component mounts or window resizes
  useEffect(() => {
    if (!isOpen) return;
    
    const updateTrackWidth = () => {
      if (slideTrackRef.current) {
        const width = slideTrackRef.current.offsetWidth;
        setSlideTrackWidth(width);
      }
    };
    
    updateTrackWidth();
    window.addEventListener('resize', updateTrackWidth);
    
    return () => window.removeEventListener('resize', updateTrackWidth);
  }, [slideTrackRef, isOpen]);
  
  // Handle slide end
  const handleSlideEnd = () => {
    setSlidingInProgress(false);
    
    // If slid more than 70% of the way, trigger success (making it easier to complete)
    if (slideX.get() > slideTrackWidth * 0.7) {
      // Animate to completion
      slideX.set(slideTrackWidth);
      setSlideSuccess(true);
      
      // Wait for animation to complete before triggering actual action
      setTimeout(() => {
        handleInvest();
      }, 500);
    } else {
      // Reset to start
      slideX.set(0);
    }
  };
  
  // Format currency for value display
  const formatValue = (value: number) => {
    if (showValueShares) {
      // Show currency
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(value);
    } else {
      // Show shares
      return `${(value / stock.price).toFixed(4)} shares`;
    }
  };
  
  // Format positive/negative values
  const formatChange = (value: number) => {
    const formatted = value.toFixed(1) + '%';
    if (value > 0) {
      return <span className="text-green-500 flex items-center"><ChevronUp size={16} />{formatted}</span>;
    } else if (value < 0) {
      return <span className="text-red-500 flex items-center"><ChevronDown size={16} />{Math.abs(parseFloat(formatted))}</span>;
    } else {
      return <span className="text-gray-500">0</span>;
    }
  };
  
  // Function to get icon for metric
  const getMetricIcon = (metricName: string, size: number = 16) => {
    switch (metricName.toLowerCase()) {
      case "performance":
        return <TrendingUp size={size} />;
      case "value":
        return <DollarSign size={size} />;
      case "stability":
        return <Shield size={size} />;
      case "momentum":
        return <Zap size={size} />;
      default:
        return <Info size={size} />;
    }
  };
  
  // Handle investment amount changes
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value)) {
      setInvestmentAmount(Math.min(value, maxInvestment));
    }
  };
  
  // Handle increment/decrement buttons
  const incrementAmount = () => {
    setInvestmentAmount(prev => Math.min(prev + 1, maxInvestment));
  };
  
  const decrementAmount = () => {
    setInvestmentAmount(prev => Math.max(prev - 1, 1));
  };
  
  // Handle invest action - simplified to call parent component's handlers
  const handleInvest = () => {
    buyStock(stock, investmentAmount);
    // Call the onPurchaseComplete callback with the data
    // The parent component will handle showing the success modal
    onPurchaseComplete({ 
      shares, 
      amount: investmentAmount, 
      projectedReturn 
    });
    // No longer directly closing - StockCard will manage state transitions
  };
  
  // Format number for display
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };
  
  // Format percentage for display
  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };
  
  return (
    <div className="portfolio-impact-wrapper fixed inset-0 flex items-center justify-center z-[9999]" style={{ isolation: 'isolate' }}>
      {/* Calculator Modal */}
      <AnimatePresence mode="wait" key="calculator-modal">
        {isOpen && (
          <>
            {/* Backdrop with simplified effect - removed blur for iOS compatibility */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.7 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="fixed inset-0 bg-black"
              style={{ zIndex: 50 }}
              onClick={onClose}
            />
            
            {/* Modal with enhanced animations and iOS-friendly rendering */}
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 30 }}
              animate={{ 
                opacity: 1, 
                scale: 1, 
                y: 0,
                transition: { 
                  duration: 0.3, 
                  ease: 'easeOut',
                  delay: 0.05 // slight delay to ensure backdrop renders first
                }
              }}
              exit={{ 
                opacity: 0, 
                scale: 0.95, 
                y: 20,
                transition: { duration: 0.25, ease: 'easeIn' }
              }}
              className="relative w-[85%] max-w-sm mx-auto bg-white rounded-2xl overflow-hidden"
              style={{
                zIndex: 51,
                maxHeight: '90vh',
                overflowY: 'auto',
                boxShadow: '0 20px 60px -15px rgba(0, 0, 0, 0.6)'
              }}
            >
              {/* Enhanced Modern Header */}
              <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-gradient-to-b from-white to-slate-50">
                <div className="flex items-center">
                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-2.5 rounded-xl mr-4 shadow-lg flex items-center justify-center w-12 h-12">
                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold bg-gradient-to-r from-slate-800 to-slate-700 bg-clip-text text-transparent mb-0.5">
                      Portfolio Impact
                    </h2>
                    <div className="flex items-center">
                      {/* Display Stock Rating */}
                      <div className="flex items-center mr-3">
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-md text-xs font-bold">
                          Rating: {(stock as any).qualityScore || impact.newMetrics.qualityScore.toFixed(0)}/100
                        </span>
                      </div>
                      <span className="text-sm text-slate-600 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                        </svg>
                        {stock.name} ({stock.ticker})
                      </span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={onClose}
                  className="p-2.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all duration-200"
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>
              
              {/* Content */}
              <div className="p-5">
                <div className="mb-4">
                  {/* Title removed as it's redundant with the header */}
                  
                  {/* Modern Pie Chart showing industry allocation */}
                  <div className="relative h-48 mb-4 bg-white rounded-xl overflow-hidden border border-slate-100 shadow-sm">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <svg viewBox="0 0 100 100" width="160" height="160">
                        {/* Background circle - lighter when empty */}
                        <circle 
                          cx="50" 
                          cy="50" 
                          r="40" 
                          fill="none" 
                          stroke={Object.keys(impact.industryAllocation).length === 0 ? "#f3f4f6" : "#e5e7eb"} 
                          strokeWidth="20" 
                        />
                        
                        {/* Dynamic segments - only rendered when data exists */}
                        {Object.entries(impact.industryAllocation).length > 0 && 
                          Object.entries(impact.industryAllocation).map(([industry, allocation], index) => {
                            // Calculate segment parameters
                            const colors = ["#06b6d4", "#8b5cf6", "#fbbf24", "#34d399", "#f87171"];
                            const color = colors[index % colors.length];
                            const segmentPct = allocation.new;
                            const circumference = 2 * Math.PI * 40;
                            const previousSegments = Object.entries(impact.industryAllocation)
                              .slice(0, index)
                              .reduce((sum, [_, alloc]) => sum + alloc.new, 0);
                            const rotation = (previousSegments * 3.6) - 90; // -90 to start at top
                            
                            // Only render segments with actual percentage values
                            return segmentPct > 0 ? (
                              <circle 
                                key={industry}
                                cx="50" 
                                cy="50" 
                                r="40" 
                                fill="none" 
                                stroke={color} 
                                strokeWidth="20"
                                strokeDasharray={`${circumference * (segmentPct / 100)} ${circumference}`}
                                transform={`rotate(${rotation} 50 50)`}
                                strokeLinecap="butt"
                              />
                            ) : null;
                          })
                        }
                        
                        {/* Central circle - clean white center */}
                        <circle cx="50" cy="50" r="30" fill="white" />
                      </svg>
                    </div>
                    
                    {/* Simple industry indicators in the top left */}
                    <div className="absolute top-3 left-3">
                      <div className="space-y-1">
                        {Object.entries(impact.industryAllocation)
                          .filter(([_, allocation]) => allocation.new > 0)
                          .map(([industry, allocation], index) => {
                            const colors = ["#06b6d4", "#8b5cf6", "#fbbf24", "#34d399", "#f87171"];
                            const color = colors[index % colors.length];
                            
                            return (
                              <div key={industry} className="flex items-center">
                                <div 
                                  className="w-2.5 h-2.5 rounded-full mr-1.5" 
                                  style={{ backgroundColor: color }}
                                ></div>
                                <span className="text-xs text-slate-900 font-medium">{industry}</span>
                              </div>
                            );
                          })
                        }
                      </div>
                    </div>
                  </div>
                  
                  {/* 2x2 Grid Metrics - Compact and readable */}
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {Object.entries(impact.impact)
                      .filter(([metric]) => ['performance', 'stability', 'value', 'momentum'].includes(metric.toLowerCase()))
                      .map(([metric, change]) => (
                      <div 
                        key={metric} 
                        className="p-2.5 bg-white rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 hover:border-sky-200"
                      >
                        <div className="flex items-center justify-center mb-1.5">
                          <div className={`p-1 rounded-md mr-1.5 ${
                            change > 0 ? "bg-green-100 text-green-600" : 
                            change < 0 ? "bg-red-100 text-red-600" : 
                            "bg-slate-100 text-slate-600"
                          }`}>
                            {getMetricIcon(metric, 14)}
                          </div>
                          <h4 className="font-semibold text-sm text-slate-900 capitalize">{metric}</h4>
                          <button 
                            className="ml-1 text-slate-400 hover:text-slate-600 transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveTooltip(activeTooltip === metric ? null : metric);
                            }}
                            aria-label={`Info about ${metric}`}
                          >
                            <Info size={12} />
                          </button>
                          {activeTooltip === metric && (
                            <div 
                              className="absolute z-50 bg-white p-2 rounded-lg shadow-lg border border-slate-200 text-xs text-slate-700 max-w-[180px] mt-1 left-1/2 transform -translate-x-1/2"
                              style={{ top: '100%' }}
                            >
                              {(metricExplanations as any)[metric.toLowerCase()]}
                              <div className="absolute w-2 h-2 bg-white transform rotate-45 left-1/2 -mt-5 -ml-1 border-t border-l border-slate-200"></div>
                            </div>
                          )}
                        </div>
                        
                        {/* New metric value with change indicator - centered */}
                        <div className="flex items-center justify-center">
                          <div className="text-base font-bold text-slate-900 mr-1.5">
                            {impact.newMetrics[metric as keyof typeof impact.newMetrics].toFixed(1)}
                          </div>
                          <div className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${
                            change > 0 ? "bg-green-100 text-green-800" : 
                            change < 0 ? "bg-red-100 text-red-800" : 
                            "bg-slate-100 text-slate-800"
                          }`}>
                            {change > 0 ? "+" : ""}{change.toFixed(1)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Investment amount control with increment/decrement buttons */}
                  <div className="mt-6">
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-sm font-medium text-slate-700">Invest Amount</label>
                      <div className="text-sm font-semibold text-emerald-600 px-2.5 py-1 bg-emerald-50 border border-emerald-100 rounded-md flex items-center shadow-sm">
                        <DollarSign className="h-3.5 w-3.5 mr-1.5" />
                        <span className="mr-1">Available:</span>
                        <span className="text-emerald-700">{formatCurrency(maxInvestment)}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button 
                        className="p-2 bg-slate-100 text-slate-500 rounded-md hover:bg-slate-200 focus:outline-none"
                        onClick={decrementAmount}
                        disabled={investmentAmount <= 1}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M5 12h14"></path>
                        </svg>
                      </button>
                      
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500">$</span>
                        <input 
                          type="number" 
                          min="1"
                          max={maxInvestment}
                          value={investmentAmount}
                          onChange={handleAmountChange}
                          className="w-full rounded-md px-8 py-2.5 border border-slate-200 focus:border-green-300 focus:outline-none focus:ring-2 focus:ring-green-100 text-center font-medium text-slate-900"
                        />
                      </div>
                      
                      <button 
                        className="p-2 bg-slate-100 text-slate-500 rounded-md hover:bg-slate-200 focus:outline-none"
                        onClick={incrementAmount}
                        disabled={investmentAmount >= maxInvestment}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M5 12h14"></path>
                          <path d="M12 5v14"></path>
                        </svg>
                      </button>
                    </div>
                  </div>
                  
                  {/* Enhanced Calculation summary - Smaller size */}
                  <div className="flex flex-col mt-5 mb-1">
                    <div className="flex justify-center items-center gap-3 p-3 bg-slate-50 rounded-lg">
                      <div className="text-center">
                        <div className="text-xs font-medium text-slate-700 mb-0.5">You'll get</div>
                        <div className="text-xl font-bold text-slate-900">{shares.toFixed(4)} shares</div>
                      </div>
                      
                      <div className="text-slate-500 flex items-center justify-center">
                        <ArrowRight size={20} strokeWidth={2} />
                      </div>
                      
                      <div className="text-center">
                        <div className="text-xs font-medium text-slate-700 mb-0.5">Projected 1y return</div>
                        <div className="text-xl font-bold text-green-600">
                          {formatCurrency(projectedReturn)}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Invest button */}
                  <button 
                    onClick={handleInvest}
                    disabled={isLoading}
                    className="w-full py-3 mt-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-xl transition-all hover:shadow-md hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <span className="flex items-center text-white">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </span>
                    ) : (
                      <span className="flex items-center text-white">
                        <Check className="mr-1" size={18} />
                        Invest {formatCurrency(investmentAmount)}
                      </span>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}