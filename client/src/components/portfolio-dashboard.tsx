import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowUp, ArrowDown, Wallet, TrendingUp, Clock, DollarSign, PieChart, Sparkles } from 'lucide-react';
import { Progress } from './ui/progress';
import ProgressRing from './ui/progress-ring';
import { usePortfolio, PortfolioHolding } from '@/contexts/portfolio-context';
import { Link } from "wouter";

// Helper component for metrics with animated progress
function MetricItem({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <motion.div 
      className="bg-white rounded-lg p-4 border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-200"
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 400, damping: 10 }}
    >
      <div className="flex justify-between items-center mb-2">
        <p className="text-sm font-medium text-slate-600">{label}</p>
        <div className={`h-2.5 w-2.5 rounded-full ${color}`}></div>
      </div>
      <div className="flex items-baseline">
        <p className="font-bold text-2xl text-slate-800">{value}</p>
        <span className="ml-1 text-xs text-slate-500">/100</span>
      </div>
      <Progress 
        value={value} 
        className={`h-2.5 mt-2.5 ${
          color === 'bg-blue-500' ? 'bg-blue-100' : 'bg-purple-100'
        }`} 
      />
    </motion.div>
  );
}

export default function PortfolioDashboard() {
  // Get data from context
  const portfolio = usePortfolio();
  const {
    cash,
    holdings,
    portfolioMetrics,
    lastUpdated
  } = portfolio;

  // Calculate derived values
  const portfolioValue = useMemo(() => {
    console.log("Dashboard: Recalculating portfolioValue");
    return holdings.reduce((total, h) => total + (h.shares * h.stock.price), 0);
  }, [holdings]);

  const totalValue = useMemo(() => {
    console.log("Dashboard: Recalculating totalValue");
    return cash + portfolioValue;
  }, [cash, portfolioValue]);

  const totalReturn = useMemo(() => {
    console.log("Dashboard: Recalculating totalReturn");
    return holdings.reduce((total, h) => {
      const currentValue = h.shares * h.stock.price;
      const investedValue = h.shares * h.purchasePrice;
      if (!isNaN(currentValue) && !isNaN(investedValue)) {
        return total + (currentValue - investedValue);
      }
      return total;
    }, 0);
  }, [holdings]);

  const totalInvested = useMemo(() => {
    console.log("Dashboard: Recalculating totalInvested");
    return holdings.reduce((total, h) => total + (h.shares * h.purchasePrice), 0);
  }, [holdings]);

  const totalReturnPercent = useMemo(() => {
    console.log("Dashboard: Recalculating totalReturnPercent");
    return totalInvested > 0.01
      ? (totalReturn / totalInvested) * 100
      : 0;
  }, [totalReturn, totalInvested]);

  const projectedReturn = useMemo(() => {
    console.log("Dashboard: Recalculating projectedReturn");
    
    // Calculate the weighted 1-year return based on the amount invested in each stock
    let totalWeightedReturnDollars = 0;
    
    holdings.forEach(h => {
      // Parse the oneYearReturn string (remove % sign and convert to number)
      const oneYearReturnPercent = 
        typeof h.stock.oneYearReturn === 'number' ? h.stock.oneYearReturn :
        typeof h.stock.oneYearReturn === 'string' ? parseFloat(h.stock.oneYearReturn.replace('%', '')) : 
        0;
      
      // For each holding, use the original invested amount (not current value)
      const investedAmount = h.shares * h.purchasePrice;
      
      // Calculate the projected return for this holding in dollars
      const holdingProjectedReturn = investedAmount * (oneYearReturnPercent / 100);
      totalWeightedReturnDollars += holdingProjectedReturn;
    });
    
    // Return the total projected return in dollars
    return totalWeightedReturnDollars;
  }, [holdings]);

  const projectedReturnPercent = useMemo(() => {
    console.log("Dashboard: Recalculating projectedReturnPercent");
    return totalInvested > 0.01
      ? (projectedReturn / totalInvested) * 100
      : 0;
  }, [projectedReturn, totalInvested]);

  const allocationPercentage = useMemo(() => {
    console.log("Dashboard: Recalculating allocationPercentage");
    return Math.round((portfolioValue / Math.max(0.01, totalValue)) * 100);
  }, [portfolioValue, totalValue]);

  // Get metrics directly
  const performanceMetric = portfolioMetrics.performance;
  const stabilityMetric = portfolioMetrics.stability;

  // Prepare sorted holdings for the "Top Holdings" section
  const sortedHoldings = useMemo(() => {
    console.log("Dashboard: Recalculating sortedHoldings");
    // Ensure holding.value is calculated correctly if not already present
    const holdingsWithValue = holdings.map(h => ({
      ...h,
      value: h.shares * h.stock.price // Calculate current value here
    }));
    return [...holdingsWithValue] // Create a new array reference for sorting
      .sort((a, b) => b.value - a.value)
      .slice(0, 2);
  }, [holdings]);

  console.log("PortfolioDashboard rendering. Total Value:", totalValue.toFixed(2), "Holdings Count:", holdings.length);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="portfolio-dashboard rounded-xl p-4 mb-6 border border-slate-200 shadow-lg bg-white"
      style={{ boxShadow: "0 10px 30px -5px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.05)" }}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="flex items-center text-slate-800 font-semibold">
          <Wallet className="w-4 h-4 mr-1.5 text-blue-500" />
          Your Portfolio
        </h3>
        <Link href="/portfolio">
          <motion.button
            className="flex items-center px-2 py-1 text-xs bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-md shadow-sm transition-shadow duration-200"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span>View More</span>
            <span className="ml-1">&rarr;</span>
          </motion.button>
        </Link>
      </div>

      {/* Portfolio Summary Card - Updated Format with Projected Value */}
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 mb-4 overflow-hidden" style={{ boxShadow: "0 8px 25px -5px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.03)" }}>
        {/* Top Metrics Row - Clear Icon-Text Pairing */}
        <div className="grid grid-cols-2 gap-0">
          {/* Left Side - Projected 1-Year Value */}
          <div className="px-4 py-5 border-r border-slate-100 flex flex-col items-center justify-between h-32">
            <div className="flex items-center">
              <TrendingUp className="w-4 h-4 text-blue-500 mr-1.5" />
              <span className="text-sm font-medium text-slate-500">Projected Value</span>
            </div>
            
            <div className="text-center flex flex-col items-center space-y-2 my-1">
              {/* Calculate projected future value: invested amount + projected return */}
              <span className="text-xl font-bold text-slate-800">
                ${(totalInvested + projectedReturn).toFixed(2)}
              </span>
              
              <div className={`flex items-center justify-center text-xs ${projectedReturn >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {projectedReturn >= 0 ? (
                  <ArrowUp className="h-3 w-3 mr-0.5" />
                ) : (
                  <ArrowDown className="h-3 w-3 mr-0.5" />
                )}
                <span>{projectedReturn >= 0 ? '+' : ''}{projectedReturnPercent.toFixed(1)}%</span>
              </div>
            </div>
            
            <div className="h-1"></div> {/* Spacer */}
          </div>
          
          {/* Right Side - Quality Score with Circle Chart */}
          <div className="px-4 py-5 border-l border-slate-100 flex flex-col items-center justify-between h-32">
            <div className="flex items-center">
              <TrendingUp className="w-4 h-4 text-blue-500 mr-1.5" />
              <span className="text-sm font-medium text-slate-500">Quality Score</span>
            </div>
            
            <div className="text-center flex flex-col items-center justify-center my-1">
              <div className="relative w-14 h-14">
                <svg width="56" height="56" viewBox="0 0 56 56">
                  <circle 
                    cx="28" 
                    cy="28" 
                    r="24" 
                    fill="none" 
                    stroke="#e2e8f0" 
                    strokeWidth="5"
                  />
                  <circle 
                    cx="28" 
                    cy="28" 
                    r="24" 
                    fill="none" 
                    stroke={portfolioMetrics.qualityScore > 70 ? '#22c55e' : (portfolioMetrics.qualityScore > 50 ? '#f59e0b' : '#ef4444')} 
                    strokeWidth="5"
                    strokeDasharray={24 * 2 * Math.PI}
                    strokeDashoffset={24 * 2 * Math.PI * (1 - (portfolioMetrics.qualityScore || 0) / 100)}
                    strokeLinecap="round"
                    transform="rotate(-90 28 28)"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-bold">{portfolioMetrics.qualityScore || 0}</span>
                </div>
              </div>
            </div>
            
            <div className="h-1"></div> {/* Spacer */}
          </div>
        </div>
      </div>

      {/* Allocation with integrated AI promotion button - using a clean white background and iOS-style progress bar */}
      <div className="px-4 py-3 mb-3 rounded-xl bg-white border border-slate-200 shadow-md relative overflow-hidden" style={{ boxShadow: "0 10px 30px -5px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.03)" }}>
        <div className="mb-2 flex justify-between items-center">
          <span className="text-sm text-slate-700 font-medium">Portfolio allocation</span>
          <Link href="/portfolio">
            <motion.button
              className="px-3 py-0.5 rounded-full bg-indigo-500 text-xs font-medium text-white shadow-sm flex items-center"
              whileHover={{ scale: 1.05, backgroundColor: "#4F46E5" }}
              whileTap={{ scale: 0.95 }}
              style={{
                boxShadow: "0 2px 8px -2px rgba(99, 102, 241, 0.3)"
              }}
            >
              <Sparkles className="w-3.5 h-3.5 mr-1 text-white" />
              <span>Boost</span>
            </motion.button>
          </Link>
        </div>

        <div className="relative mb-0.5">
          {/* Base bar with light gray stroke to be visible at 0% */}
          <div className="h-6 w-full bg-slate-100 rounded-full border border-slate-200 overflow-hidden relative">
            {/* Filled progress portion */}
            <div 
              className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full"
              style={{ 
                width: `${allocationPercentage}%`,
                transition: "width 0.5s ease-in-out"
              }}
            />
            
            {/* Percentage text (always centered) */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`text-xs font-medium ${allocationPercentage > 30 ? 'text-white' : 'text-slate-700'}`}>
                {allocationPercentage}%
              </span>
            </div>
          </div>
        </div>
        
        {/* Subtle glow effects behind the progress bar */}
        <div className="absolute bottom-0 left-1/4 w-16 h-16 rounded-full bg-indigo-200/10 blur-xl -z-10"></div>
        <div className="absolute bottom-0 right-1/4 w-12 h-12 rounded-full bg-purple-200/10 blur-xl -z-10"></div>
      </div>
      

    </motion.div>
  );
}