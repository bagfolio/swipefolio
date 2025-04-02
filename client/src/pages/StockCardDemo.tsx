import { useState, useEffect, useMemo } from "react";
import { motion, PanInfo, useAnimationControls } from "framer-motion";
import StockCard from "@/components/ui/stock-card";
import BackgroundStockCard from "@/components/ui/background-stock-card";
import { jsonStockService } from "@/services/json-stock-service";
import { StockData } from "@/lib/stock-data";
import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

/**
 * This is a demo page to showcase our stock card stack and the BackgroundStockCard component.
 * It uses mock stock data to demonstrate the card stack functionality.
 */
export default function StockCardDemo() {
  const [_, setLocation] = useLocation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [stocks, setStocks] = useState<StockData[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Load stock data
  useEffect(() => {
    const loadStocks = async () => {
      try {
        const allStocks = await jsonStockService.getAllStocks();
        // Take the first 10 stocks or all if less than 10
        const demoStocks = allStocks.slice(0, Math.min(10, allStocks.length));
        setStocks(demoStocks);
        setLoading(false);
      } catch (error) {
        console.error("Error loading stocks:", error);
        setLoading(false);
      }
    };
    
    loadStocks();
  }, []);
  
  // Controls for the main card animation
  const mainCardControls = useAnimationControls();
  
  // Handle next card
  const handleNextCard = () => {
    if (currentIndex < stocks.length - 1) {
      // Animate the card off to the right
      mainCardControls.start({ 
        x: "100%", 
        rotate: 5,
        transition: { duration: 0.3 } 
      }).then(() => {
        setCurrentIndex(prev => prev + 1);
        // Reset position for next card
        mainCardControls.set({ x: 0, rotate: 0 });
      });
    }
  };
  
  // Handle previous card
  const handlePreviousCard = () => {
    if (currentIndex > 0) {
      // Animate the card off to the left
      mainCardControls.start({ 
        x: "-100%", 
        rotate: -5,
        transition: { duration: 0.3 } 
      }).then(() => {
        setCurrentIndex(prev => prev - 1);
        // Reset position for next card
        mainCardControls.set({ x: 0, rotate: 0 });
      });
    }
  };
  
  // Handle drag end to determine swipe direction
  const handleDragEnd = (_: any, info: PanInfo) => {
    const { offset, velocity } = info;
    
    // Determine swipe threshold - higher velocity requires less offset
    const swipeThreshold = velocity.x > 1 ? 50 : 100;
    
    if (offset.x > swipeThreshold) {
      // Swiped right - go to previous
      handlePreviousCard();
    } else if (offset.x < -swipeThreshold) {
      // Swiped left - go to next
      handleNextCard();
    } else {
      // Reset position if not passed threshold
      mainCardControls.start({ 
        x: 0, 
        rotate: 0,
        transition: { type: "spring", stiffness: 300, damping: 20 } 
      });
    }
  };
  
  // Handle back navigation
  const handleBack = () => {
    setLocation('/');
  };
  
  // Return current and next stock if available
  const currentStock = stocks[currentIndex];
  const nextStock = currentIndex < stocks.length - 1 ? stocks[currentIndex + 1] : null;
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 to-black text-white">
        <div className="animate-spin w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }
  
  if (stocks.length === 0) {
    return (
      <div className="flex items-center justify-center flex-col min-h-screen bg-gradient-to-br from-gray-900 to-black text-white p-4">
        <div className="max-w-md text-center">
          <h2 className="text-2xl font-bold mb-4">No Stock Data Available</h2>
          <p className="mb-6">Could not load stock data for the demonstration. Please check the console for errors.</p>
          <button 
            onClick={handleBack}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-gray-900 to-black text-white overflow-hidden">
      {/* Back button */}
      <div className="absolute top-4 left-4 z-30">
        <button 
          onClick={handleBack}
          className="p-2 rounded-full bg-black/40 backdrop-blur-sm hover:bg-black/60 transition-all"
        >
          <ArrowLeft size={20} />
        </button>
      </div>
      
      {/* Page title */}
      <div className="text-center pt-6 pb-3">
        <h1 className="text-2xl font-bold">Stock Card Stack Demo</h1>
        <p className="text-gray-400">Swipe left or right to navigate cards</p>
      </div>
      
      {/* Card stack container */}
      <div className="relative w-full max-w-md mx-auto pt-8 perspective-1000 h-[500px]">
        {/* Background card (next in stack) */}
        {nextStock && (
          <div className="absolute inset-0 z-10 scale-[0.93] -translate-y-4 opacity-60 blur-[1px]">
            <BackgroundStockCard stock={nextStock} />
          </div>
        )}
        
        {/* Main card (current) */}
        <motion.div 
          className="absolute inset-0 z-20 will-change-transform"
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragEnd={handleDragEnd}
          animate={mainCardControls}
          style={{ touchAction: "none" }}
        >
          <StockCard 
            stock={currentStock}
            onNext={handleNextCard}
            onPrevious={handlePreviousCard}
            currentIndex={currentIndex}
            totalCount={stocks.length}
            nextStock={nextStock || undefined}
            displayMode="simple"
          />
        </motion.div>
      </div>
      
      {/* Navigation buttons */}
      <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-8 z-30">
        <button 
          onClick={handlePreviousCard}
          disabled={currentIndex === 0}
          className="px-6 py-3 rounded-full bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          Previous
        </button>
        <button 
          onClick={handleNextCard}
          disabled={currentIndex === stocks.length - 1}
          className="px-6 py-3 rounded-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          Next
        </button>
      </div>
      
      {/* Card count indicator */}
      <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1 z-30">
        {stocks.map((_, index) => (
          <div 
            key={index} 
            className={`h-2 w-2 rounded-full ${index === currentIndex ? 'bg-blue-500' : 'bg-gray-500'}`}
          />
        ))}
      </div>
    </div>
  );
}