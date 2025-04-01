import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { StockData, getIndustryStocks } from "@/lib/stock-data";
import StockChart from "@/components/stock-detail/stock-chart";
import ComparativeAnalysis from "@/components/comparative-analysis";
import OverallAnalysisCard from "@/components/overall-analysis-card";
import { Skeleton } from "@/components/ui/skeleton";

export default function StockDetailView() {
  const { symbol } = useParams<{ symbol: string }>();
  const [_, setLocation] = useLocation();
  
  // Handle back button click
  const handleBack = () => {
    setLocation("/");
  };
  
  // Fetch the stock data using the symbol from the URL parameters
  const { data: stock, isLoading, error } = useQuery<StockData>({
    queryKey: ['/api/finnhub/stock', symbol],
    queryFn: async () => {
      // Check if symbol parameter exists
      if (!symbol) {
        throw new Error("Stock symbol not provided");
      }
      
      const response = await fetch(`/api/finnhub/stock/${symbol}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch stock data for ${symbol}`);
      }
      
      return response.json();
    },
    enabled: !!symbol, // Only run the query if we have a symbol
    staleTime: 60 * 1000, // 1 minute
  });
  
  if (isLoading) {
    return (
      <div className="p-4 md:p-8 max-w-6xl mx-auto">
        <div className="flex items-center mb-4">
          <button 
            onClick={handleBack}
            className="mr-4 p-2 rounded-full hover:bg-slate-100"
          >
            <ArrowLeft size={20} />
          </button>
          <Skeleton className="h-8 w-48" />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Skeleton className="h-80 w-full mb-6" />
            <Skeleton className="h-64 w-full" />
          </div>
          <div>
            <Skeleton className="h-40 w-full mb-6" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    );
  }
  
  if (error || !stock) {
    return (
      <div className="p-4 md:p-8 max-w-6xl mx-auto">
        <div className="flex items-center mb-4">
          <button 
            onClick={handleBack}
            className="mr-4 p-2 rounded-full hover:bg-slate-100"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-bold">Stock Not Found</h1>
        </div>
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">
            {error instanceof Error ? error.message : "Unable to load stock data"}
          </p>
          <button 
            onClick={handleBack}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      {/* Header with back button */}
      <div className="flex items-center mb-4">
        <button 
          onClick={handleBack}
          className="mr-4 p-2 rounded-full hover:bg-slate-100"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold">{stock.name} ({stock.ticker})</h1>
          <div className="flex items-center">
            <span className="text-2xl font-semibold">${stock.price.toFixed(2)}</span>
            <span 
              className={`ml-2 text-sm font-medium px-2 py-0.5 rounded ${
                stock.change >= 0 ? 'text-green-700 bg-green-100' : 'text-red-700 bg-red-100'
              }`}
            >
              {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)}%
            </span>
          </div>
        </div>
      </div>
      
      {/* Main content layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column with chart and analysis */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stock price chart */}
          <StockChart symbol={stock.ticker} />
          
          {/* Company overview */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold">Company Overview</h2>
            </div>
            <div className="p-4">
              <p className="text-gray-700">{stock.synopsis.company}</p>
              {stock.overallAnalysis && (
                <div className="mt-4 p-4 bg-gray-50 rounded-md">
                  <h3 className="font-medium text-gray-900 mb-2">Analysis</h3>
                  <p className="text-gray-600">{stock.overallAnalysis}</p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Right column with metrics and related info */}
        <div className="space-y-6">
          {/* Metrics card */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold">Key Metrics</h2>
            </div>
            <div className="p-4 grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Performance</p>
                <p className={`text-lg font-medium ${
                  stock.metrics.performance.color === 'green' ? 'text-green-600' : 
                  stock.metrics.performance.color === 'yellow' ? 'text-amber-600' : 'text-red-600'
                }`}>
                  {stock.metrics.performance.value}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Stability</p>
                <p className={`text-lg font-medium ${
                  stock.metrics.stability.color === 'green' ? 'text-green-600' : 
                  stock.metrics.stability.color === 'yellow' ? 'text-amber-600' : 'text-red-600'
                }`}>
                  {stock.metrics.stability.value}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Value</p>
                <p className={`text-lg font-medium ${
                  stock.metrics.value.color === 'green' ? 'text-green-600' : 
                  stock.metrics.value.color === 'yellow' ? 'text-amber-600' : 'text-red-600'
                }`}>
                  {stock.metrics.value.value}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Momentum</p>
                <p className={`text-lg font-medium ${
                  stock.metrics.momentum.color === 'green' ? 'text-green-600' : 
                  stock.metrics.momentum.color === 'yellow' ? 'text-amber-600' : 'text-red-600'
                }`}>
                  {stock.metrics.momentum.value}
                </p>
              </div>
            </div>
          </div>
          
          {/* Comparative analysis card */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold">Industry Comparison</h2>
            </div>
            <div className="p-4">
              <ComparativeAnalysis currentStock={stock} />
            </div>
          </div>
          
          {/* Add to portfolio button */}
          <button 
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow transition-colors"
          >
            Add to Portfolio
          </button>
        </div>
      </div>
    </div>
  );
}