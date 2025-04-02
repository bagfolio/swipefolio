import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Stack } from "@shared/schema";
import { ArrowLeft } from "lucide-react";
import { getQueryFn } from "@/lib/queryClient";
import { StockData, getIndustryStocks } from "@/lib/stock-data";
import StockCard from "@/components/ui/stock-card";
import StackCompletedModal from "@/components/stack-completed-modal";
import AIAssistant from "@/components/ui/ai-assistant";
// Import motion and hooks
import { motion, useAnimation, useMotionValue, AnimatePresence } from "framer-motion";

// Define animation variants (slightly adjusted for clarity)
const cardVariants = {
  // State for card entering the center stack
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300, // Enter from further off-screen
    opacity: 0,
    scale: 0.8, // Start smaller
  }),
  // State for the card actively in the center
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1,
    scale: 1,
    y: 0, // Explicitly set y to 0
    transition: { duration: 0.3, ease: "easeOut" } // Smooth transition
  },
   // State for the card exiting the center stack
  exit: (direction: number) => ({
    zIndex: 0,
    x: direction < 0 ? 300 : -300, // Exit further off-screen
    opacity: 0,
    scale: 0.8, // Shrink on exit
    transition: { duration: 0.3, ease: "easeIn" } // Smooth transition
  }),
  // State for the card sitting in the background
  background: {
    zIndex: 0,
    opacity: 0.7, // Make it slightly more transparent
    scale: 0.90, // Slightly smaller scale
    y: 25, // Adjust vertical position if needed
    transition: { duration: 0.3 }
  }
};

export default function StockDetailPage() {
const { stackId } = useParams<{ stackId: string }>();
const [location, setLocation] = useLocation(); // Use location state
const [currentStockIndex, setCurrentStockIndex] = useState(0);
const [completedModalOpen, setCompletedModalOpen] = useState(false);
const [useRealTimeData] = useState(true); // Removed setter if not used
  const [swipeDirection, setSwipeDirection] = useState(0);

// Fetch stack data
  const { data: stack, isLoading, error } = useQuery<Stack>({
    queryKey: [`/api/stacks/${stackId}`],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!stackId,
  });

// Generate stocks data
  const stocks = useMemo(() => {
    if (!stack) return [];
    const industryStocks = getIndustryStocks(stack.industry);
    return industryStocks;
  }, [stack]);

  // *** Create motion value and controls ONCE at the top level ***
  const x = useMotionValue(0);
  const cardControls = useAnimation();

// Navigation Handlers
const handleNextStock = useCallback(() => {
    if (currentStockIndex >= stocks.length -1) {
         setCompletedModalOpen(true);
         return; // Don't change index if already at the end
    }
    setSwipeDirection(1);
    setCurrentStockIndex((prevIndex) => prevIndex + 1);
    x.set(0); // Reset motion value for the new card
    cardControls.set({ x: 0 });
}, [currentStockIndex, stocks.length, x, cardControls]);

const handlePreviousStock = useCallback(() => {
    if (currentStockIndex <= 0) return; // Can't go back from first card
    setSwipeDirection(-1);
    setCurrentStockIndex((prevIndex) => prevIndex - 1);
    x.set(0); // Reset motion value
    cardControls.set({ x: 0 });
}, [currentStockIndex, x, cardControls]);

  // Invest Handler (triggers modal via StockCard's hidden button)
  const handleInvest = useCallback(() => {
    console.log("Attempting invest action for:", stocks[currentStockIndex]?.ticker);
    // Query selector might be fragile, relies on data-stock-key matching index
    const activeCardElement = document.querySelector(`[data-stock-key="${currentStockIndex}"]`);
    const buyButton = activeCardElement?.querySelector('[data-testid="buy-button"]');

    if (buyButton && buyButton instanceof HTMLButtonElement) {
        console.log("Found buy button, clicking...");
        buyButton.click();
    } else {
        console.warn("Buy button not found in active card element:", activeCardElement);
        // Optional: Provide feedback to the user that action failed
    }
  }, [currentStockIndex, stocks]);

// Reset Handler
  const handleResetStack = () => {
    setCompletedModalOpen(false);
    setSwipeDirection(0); // Reset direction
    setCurrentStockIndex(0); // Go back to first card
    x.set(0);
    cardControls.set({x: 0});
  };

// Back Handler
  const handleBack = () => {
    setLocation("/"); // Use wouter's setLocation
  };

  // --- Loading / Error / Empty States ---
  if (isLoading) {
     return (
       <div className="flex items-center justify-center min-h-screen bg-black">
         <div className="animate-spin w-10 h-10 border-4 border-cyan-400 border-t-transparent rounded-full"></div>
       </div>
     );
   }

   if (error || !stack) {
     return (
       <div className="flex items-center justify-center flex-col min-h-screen bg-black text-white p-4">
         <p className="mb-4 text-center">Error loading stack data.</p>
         <button
           onClick={handleBack}
           className="text-cyan-400 hover:bg-gray-800 px-4 py-2 rounded-full transition-colors border border-cyan-400"
         >
           Go Back
         </button>
       </div>
     );
   }

   if (stocks.length === 0) {
      return (
       <div className="flex items-center justify-center flex-col min-h-screen bg-black text-white p-4">
         <p className="text-white mb-4 text-center">No stocks available for the '{stack.industry}' industry.</p>
         <button
           onClick={handleBack}
           className="text-cyan-400 hover:bg-gray-800 px-4 py-2 rounded-full transition-colors border border-cyan-400"
         >
           Go Back
         </button>
       </div>
     );
   }

 // Safely get current and next stock
 const currentStockData = stocks[currentStockIndex];
 const nextStockData = currentStockIndex < stocks.length - 1 ? stocks[currentStockIndex + 1] : null;

 return (
    <div className="flex flex-col h-screen overflow-hidden bg-black text-white">
      {/* Header Area */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-30">
         <button
           onClick={handleBack}
           className="text-cyan-400 hover:bg-gray-800 p-2 rounded-full transition-colors bg-black/60 backdrop-blur-sm"
         >
           <ArrowLeft size={20} />
         </button>
         {/* Can add stack title or other header elements here */}
         <div className="text-center text-sm font-medium text-gray-400">
             {stack.title}
         </div>
         {/* Placeholder for potential right-side icons */}
         <div className="w-8"></div>
      </div>

      {/* Main Card Stack Area */}
      {/* Added padding top to avoid overlap with fixed header */}
      <div className="flex-1 flex items-center justify-center p-4 pt-16 relative perspective-1000">
         <div className="relative w-full h-[80vh] max-w-md"> {/* Adjust height */}
           {/* Use AnimatePresence to handle enter/exit animations */}
           <AnimatePresence initial={false} custom={swipeDirection}>

             {/* Background Card */}
             {nextStockData && (
                <motion.div
                    // Key is index + 1 to differentiate from current card
                    key={currentStockIndex + 1}
                    className="absolute inset-0" // Position absolutely
                    variants={cardVariants}
                    initial="background" // Start in background state
                    animate="background" // Stay in background state
                    style={{ pointerEvents: 'none' }} // Disable interaction
                >
                  {/* Render StockCard without interactive props */}
                  <StockCard
                    stock={nextStockData}
                    currentIndex={currentStockIndex + 1}
                    totalCount={stocks.length}
                    displayMode={useRealTimeData ? 'realtime' : 'simple'}
                    // No controls or x value passed here
                  />
                </motion.div>
              )}

              {/* Foreground Card - currentStockData should always exist if stocks array is not empty */}
              {currentStockData && (
                 <motion.div
                    // Key is the current index, triggers animation on change
                    key={currentStockIndex}
                    className="absolute inset-0" // Position absolutely
                    data-stock-key={currentStockIndex} // For querySelector in handleInvest
                    variants={cardVariants}
                    initial="enter"  // Enter animation state
                    animate="center" // Active animation state
                    exit="exit"      // Exit animation state
                    custom={swipeDirection} // Pass direction for enter/exit variants
                    // Drag is handled within StockCard component now
                 >
                   {/* Render StockCard WITH interactive props */}
                   <StockCard
                     stock={currentStockData}
                     onNext={handleNextStock}
                     onPrevious={handlePreviousStock}
                     onInvest={handleInvest}
                     currentIndex={currentStockIndex}
                     totalCount={stocks.length}
                     displayMode={useRealTimeData ? 'realtime' : 'simple'}
                     // Pass the controls and motion value
                     cardControls={cardControls}
                     x={x}
                   />
                 </motion.div>
              )}

           </AnimatePresence>
         </div>
      </div>

      {/* --- Modals and Overlays --- */}
      <StackCompletedModal
        isOpen={completedModalOpen}
        onClose={() => setCompletedModalOpen(false)}
        onReset={handleResetStack}
        stackName={stack?.title || ""}
        stocksCount={stocks.length}
      />
      <AIAssistant /> {/* Ensure this doesn't conflict with card z-index */}
    </div>
 );
}