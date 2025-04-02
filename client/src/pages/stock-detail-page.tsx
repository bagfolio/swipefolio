import { useState, useEffect, useMemo } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Stack } from "@shared/schema";
import { ArrowLeft, BellRing, Zap } from "lucide-react";
import { getQueryFn } from "@/lib/queryClient";
import { StockData, getIndustryStocks } from "@/lib/stock-data";
import StockCard from "@/components/ui/stock-card";
import StackCompletedModal from "@/components/stack-completed-modal";
import AIAssistant from "@/components/ui/ai-assistant";
import { AnimatePresence } from "framer-motion";

export default function StockDetailPage() {
  const { stackId } = useParams<{ stackId: string }>();
  const [_, setLocation] = useLocation();
  const [currentStockIndex, setCurrentStockIndex] = useState(0);
  const [completedModalOpen, setCompletedModalOpen] = useState(false);
  const [useRealTimeData, setUseRealTimeData] = useState(true);
  
  // Fetch stack data
  const { data: stack, isLoading, error } = useQuery<Stack>({
    queryKey: [`/api/stacks/${stackId}`],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!stackId,
  });
  
  // Debug logging
  useEffect(() => {
    if (error) {
      console.error("Error fetching stack:", error);
    }
    if (stack) {
      console.log("Successfully fetched stack:", stack);
      console.log("Stack industry:", stack.industry);
    }
  }, [stack, error]);

  // Generate stocks data for the industry
  const stocks = useMemo(() => {
    if (!stack) return [];
    console.log("Fetching stocks for industry:", stack.industry);
    const industryStocks = getIndustryStocks(stack.industry);
    console.log(`Found ${industryStocks.length} stocks for industry ${stack.industry}`);
    return industryStocks;
  }, [stack]);

  // Handle navigation between stocks
  const handleNextStock = () => {
    if (currentStockIndex < stocks.length - 1) {
      setCurrentStockIndex(currentStockIndex + 1);
    } else {
      // Open completed modal when the user has swiped through all stocks
      setCompletedModalOpen(true);
    }
  };

  const handlePreviousStock = () => {
    if (currentStockIndex > 0) {
      setCurrentStockIndex(currentStockIndex - 1);
    }
  };

  // Handle resetting the stack to view again
  const handleResetStack = () => {
    setCurrentStockIndex(0);
    setCompletedModalOpen(false);
  };

  // Handle back button click
  const handleBack = () => {
    setLocation("/");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <div className="animate-spin w-10 h-10 border-4 border-cyan-400 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!stack || stocks.length === 0) {
    return (
      <div className="flex items-center justify-center flex-col min-h-screen bg-slate-900">
        <p className="text-white mb-4">No stocks available for this industry.</p>
        <button 
          onClick={handleBack}
          className="text-cyan-400 hover:bg-gray-800 px-4 py-2 rounded-full transition-colors border border-cyan-400"
        >
          Go Back
        </button>
      </div>
    );
  }

  const currentStock = stocks[currentStockIndex];
  
  // Get next stock for preview during swipes
  const nextStock = currentStockIndex < stocks.length - 1 
    ? stocks[currentStockIndex + 1] 
    : stocks[0]; // Loop back to the first stock if we're at the end

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-slate-800 to-slate-900 text-white">
      {/* Back button placed at the top-left corner */}
      <div className="absolute top-4 left-4 z-20">
        <button 
          onClick={handleBack}
          className="text-cyan-400 hover:bg-gray-800 p-2 rounded-full transition-colors bg-slate-800/60 backdrop-blur-sm"
        >
          <ArrowLeft size={20} />
        </button>
      </div>
      
      {/* Live Data button removed as requested */}

      {/* Main content with stacked cards */}
      <div className="flex-1 relative flex items-center justify-center p-4">
        <div className="w-full h-[600px] relative">
          <AnimatePresence initial={false}>
            {stocks.length > 0 && stocks
              .slice(currentStockIndex, Math.min(currentStockIndex + 2, stocks.length))
              .reverse() // Render next card first in the DOM so it appears underneath
              .map((stock, index) => {
                // index 0 = next card, index 1 = current card (because of reverse)
                const indexInStack = (1 - index);
                return (
                  <StockCard
                    key={stock.ticker} // IMPORTANT: Use a stable key!
                    stock={stock}
                    onNext={handleNextStock}
                    onPrevious={handlePreviousStock}
                    currentIndex={currentStockIndex + indexInStack}
                    totalCount={stocks.length}
                    displayMode={useRealTimeData ? 'realtime' : 'simple'}
                    // Pass the stacking props:
                    indexInStack={indexInStack}
                    totalInStack={Math.min(2, stocks.length - currentStockIndex)}
                  />
                );
              })}
          </AnimatePresence>
        </div>
      </div>

      {/* Modern Buy/Skip Buttons */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-slate-900 to-transparent z-10">
        <div className="flex justify-between gap-4 max-w-md mx-auto">
          <button
            onClick={handleNextStock}
            className="w-1/2 py-3 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white font-medium shadow-lg transition transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
            Skip
          </button>
          <button
            onClick={() => {
              // Open portfolio impact calculator
              const stockCardElement = document.querySelector('[data-testid="stock-card"]');
              const buyButtonElement = stockCardElement?.querySelector('[data-testid="buy-button"]');
              
              if (buyButtonElement && 'click' in buyButtonElement) {
                (buyButtonElement as HTMLButtonElement).click();
              } else {
                // Fallback - just move to next stock
                handleNextStock();
              }
            }}
            className="w-1/2 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 text-white font-medium shadow-lg transition transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h6"></path>
              <path d="M12 12h4l-1.8-1.8"></path>
              <path d="M14.2 13.8L16 12"></path>
              <circle cx="17" cy="7" r="3"></circle>
            </svg>
            Buy
          </button>
        </div>
      </div>

      {/* Completed modal */}
      <StackCompletedModal
        isOpen={completedModalOpen}
        onClose={() => setCompletedModalOpen(false)}
        onReset={handleResetStack}
        stackName={stack?.title || ""}
        stocksCount={stocks.length}
      />
      
      {/* AI Assistant */}
      <AIAssistant />
    </div>
  );
}