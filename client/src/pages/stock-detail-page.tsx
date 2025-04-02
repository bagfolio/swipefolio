import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Stack } from "@shared/schema";
import { ArrowLeft } from "lucide-react";
import { getQueryFn } from "@/lib/queryClient";
import { StockData, getIndustryStocks } from "@/lib/stock-data";
// Import StockCard and the data type for its callback
import StockCard, { MetricClickData } from "@/components/ui/stock-card"; // Ensure path is correct
import StackCompletedModal from "@/components/stack-completed-modal";    // Ensure path is correct
import AIAssistant from "@/components/ui/ai-assistant";              // Ensure path is correct
// Import Modals to render here
import MetricPopup from "@/components/ui/metric-popup-fixed";         // Ensure path is correct
import PortfolioImpactCalculator from "@/components/ui/portfolio-impact-calculator"; // Ensure path is correct
import PurchaseSuccessModal from "@/components/ui/purchase-success-modal";     // Ensure path is correct
// Import motion and hooks
// Import motion and hooks
import { motion, useAnimation, useMotionValue, AnimatePresence, motionValue } from "framer-motion";

// Define animation variants (adjust timing/easing as needed)
const cardVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
    scale: 0.8,
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.3, ease: "easeOut" }
  },
  exit: (direction: number) => ({
    zIndex: 0,
    x: direction < 0 ? 300 : -300,
    opacity: 0,
    scale: 0.8,
    transition: { duration: 0.3, ease: "easeIn" }
  }),
  background: {
    zIndex: 0,
    opacity: 0.7,
    scale: 0.90,
    y: 25,
    transition: { duration: 0.3 }
  }
};

// Define structure for purchase data state
interface PurchaseData {
    shares: number;
    amount: number;
    projectedReturn: number;
}

export default function StockDetailPage() {
const { stackId } = useParams<{ stackId: string }>();
const [location, setLocation] = useLocation();
const [currentStockIndex, setCurrentStockIndex] = useState(0);
const [completedModalOpen, setCompletedModalOpen] = useState(false);
const [useRealTimeData] = useState(true); // Keep state if mode switching is planned, else just use true
  const [swipeDirection, setSwipeDirection] = useState(0);

  // State Lifted from StockCard
  const [isMetricPopupOpen, setIsMetricPopupOpen] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<MetricClickData | null>(null);
  const [modalState, setModalState] = useState<'closed' | 'calculator' | 'success'>('closed');
  const [purchaseData, setPurchaseData] = useState<PurchaseData | null>(null);

// Fetch stack data
  const { data: stack, isLoading, error } = useQuery<Stack>({
    queryKey: [`/api/stacks/${stackId}`],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!stackId,
  });

// Generate stocks data robustly
  const stocks = useMemo(() => {
    if (!stack?.industry) return []; // Check stack and industry exist
    try {
        const industryStocks = getIndustryStocks(stack.industry);
        // Ensure the function actually returned an array
        return Array.isArray(industryStocks) ? industryStocks : [];
    } catch (err) {
        console.error("Error getting industry stocks:", err);
        return []; // Return empty array on error
    }
  }, [stack]);

  // Motion value and controls (called unconditionally)
  const x = useMotionValue(0);
  const cardControls = useAnimation();

// Navigation Handlers
const handleNextStock = useCallback(() => {
    const safeTotalCount = stocks?.length ?? 0; // Use safe length
    if (safeTotalCount === 0) return; // Safety check

    if (currentStockIndex >= safeTotalCount - 1) {
        setCompletedModalOpen(true);
        return;
    }
    setSwipeDirection(1);
    setCurrentStockIndex((prevIndex) => prevIndex + 1);
    x.set(0);
    cardControls.set({ x: 0 });
}, [currentStockIndex, stocks, x, cardControls]); // Added stocks dependency

const handlePreviousStock = useCallback(() => {
    if (currentStockIndex <= 0) return;
    setSwipeDirection(-1);
    setCurrentStockIndex((prevIndex) => prevIndex - 1);
    x.set(0);
    cardControls.set({ x: 0 });
}, [currentStockIndex, x, cardControls]);

  // Handlers Lifted from StockCard
  const handleOpenCalculator = useCallback(() => {
      setModalState('calculator');
      // Reset card position after opening calculator
      if (cardControls) {
          cardControls.start({ x: 0, transition: { type: "spring", stiffness: 500, damping: 30 }});
      }
  }, [cardControls]);

  const handleMetricClick = useCallback((metricData: MetricClickData) => {
      setSelectedMetric(metricData);
      setIsMetricPopupOpen(true);
  }, []);

  const handlePurchaseComplete = useCallback((data: PurchaseData) => {
    setPurchaseData(data);
    setModalState('success');
  }, []);

  const handleSuccessModalClose = useCallback(() => {
    setModalState('closed');
    setPurchaseData(null);
    // Optionally call handleNextStock() here if desired
  }, [/* handleNextStock if used */]);

// Reset Handler
  const handleResetStack = useCallback(() => {
    setCompletedModalOpen(false);
    setSwipeDirection(0);
    setCurrentStockIndex(0);
    x.set(0);
    cardControls.set({x: 0});
  }, [x, cardControls]); // Added dependencies

// Back Handler
  const handleBack = useCallback(() => {
    setLocation("/");
  }, [setLocation]);

  // --- Loading / Error / Empty States ---
   if (isLoading) {
     return (
       <div className="flex items-center justify-center min-h-screen bg-black">
         <div className="animate-spin w-10 h-10 border-4 border-cyan-400 border-t-transparent rounded-full"></div>
       </div>
     );
   }

   // Handle error or missing stack *after* loading is false
   if (error || !stack) {
     // Check if error is an instance of Error to display message
     const errorMessage = error instanceof Error ? error.message : "Error loading stack data.";
     return (
       <div className="flex items-center justify-center flex-col min-h-screen bg-black text-white p-4">
         <p className="mb-4 text-center text-red-400">{errorMessage}</p>
         <button
            onClick={handleBack}
            className="text-cyan-400 hover:bg-gray-800 px-4 py-2 rounded-full transition-colors border border-cyan-400"
        >
            Go Back
        </button>
       </div>
     );
   }

   // Handle case where stack exists but no stocks were found (stocks array is checked for validity)
   if (!stocks || stocks.length === 0) {
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
   // --- End Loading / Error / Empty States ---


 // Safely get current and next stock - At this point, stocks is a valid array with length > 0
 const currentStockData = stocks[currentStockIndex];
 const nextStockData = currentStockIndex < stocks.length - 1 ? stocks[currentStockIndex + 1] : null;

 return (
    <div className="flex flex-col h-screen overflow-hidden bg-black text-white relative">
      {/* Header Area */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-30 pointer-events-none"> {/* Make header non-interactive initially */}
         <button
           onClick={handleBack}
           className="text-cyan-400 hover:bg-gray-800 p-2 rounded-full transition-colors bg-black/60 backdrop-blur-sm pointer-events-auto" // Enable pointer events for button
         >
           <ArrowLeft size={20} />
         </button>
         <div className="text-center text-sm font-medium text-gray-400">
             {stack.title}
         </div>
         <div className="w-8"></div> {/* Placeholder */}
      </div>

      {/* Main Card Stack Area */}
      <div className="flex-1 flex items-center justify-center p-4 pt-12 relative perspective-1000"> {/* Reduced pt */}
         {/* Adjusted height */}
         <div className="relative w-full h-full max-w-md">
           <AnimatePresence initial={false} custom={swipeDirection}>

             {/* Background Card */}
             {nextStockData && (
                <motion.div
                    key={currentStockIndex + 1} // Unique key
                    className="absolute inset-0"
                    variants={cardVariants}
                    initial="background"
                    animate="background"
                    style={{ pointerEvents: 'none' }} // Disable interaction
                >
                  <StockCard
                    stock={nextStockData}
                    currentIndex={currentStockIndex + 1}
                    totalCount={stocks.length} // Access length safely now
                    displayMode={useRealTimeData ? 'realtime' : 'simple'}
                    x={motionValue(0)}
                  />
                </motion.div>
              )}

              {/* Foreground Card */}
              {currentStockData && ( // Check currentStockData exists
                 <motion.div
                    key={currentStockIndex} // Key triggers animation
                    className="absolute inset-0"
                    data-stock-key={currentStockIndex} // For querySelector
                    variants={cardVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    custom={swipeDirection}
                 >
                   <StockCard
                     stock={currentStockData}
                     onNext={handleNextStock}
                     onPrevious={handlePreviousStock}
                     onInvest={handleOpenCalculator} // Use direct handler
                     onMetricClick={handleMetricClick}
                     onOpenCalculator={handleOpenCalculator} // For hidden button
                     currentIndex={currentStockIndex}
                     totalCount={stocks.length} // Access length safely now
                     displayMode={useRealTimeData ? 'realtime' : 'simple'}
                     cardControls={cardControls}
                     x={x} // Pass the real x
                   />
                 </motion.div>
              )}

           </AnimatePresence>
         </div>
      </div>

      {/* --- Render Modals Here (Outside Card Stack) --- */}
      {/* Ensure they have high z-index using Tailwind (e.g., z-40 or z-50) */}

      {/* Metric Popup */}
      {isMetricPopupOpen && selectedMetric && currentStockData && (
        <div className="absolute inset-0 z-40"> {/* Wrapper for positioning/z-index */}
            <MetricPopup
            isOpen={isMetricPopupOpen}
            onClose={() => setIsMetricPopupOpen(false)}
            metricName={selectedMetric.name}
            metricColor={selectedMetric.color}
            metricData={selectedMetric.data}
            />
        </div>
      )}

      {/* Portfolio Impact Calculator */}
      {modalState === 'calculator' && currentStockData && (
         <div className="absolute inset-0 z-40"> {/* Wrapper */}
            <PortfolioImpactCalculator
            isOpen={true}
            onClose={() => setModalState('closed')}
            onPurchaseComplete={handlePurchaseComplete}
            stock={currentStockData}
            />
         </div>
      )}

      {/* Purchase Success Modal */}
      {modalState === 'success' && purchaseData && currentStockData && (
         <div className="absolute inset-0 z-40"> {/* Wrapper */}
            <PurchaseSuccessModal
            isOpen={true}
            onClose={handleSuccessModalClose}
            stock={currentStockData}
            shares={purchaseData.shares}
            amount={purchaseData.amount}
            projectedReturn={purchaseData.projectedReturn}
            />
        </div>
      )}

      {/* --- Other Overlays --- */}
       <div className="absolute inset-0 z-40 pointer-events-none"> {/* Wrapper for stack completed modal */}
            <StackCompletedModal
                isOpen={completedModalOpen}
                onClose={() => setCompletedModalOpen(false)}
                onReset={handleResetStack}
                stackName={stack?.title || ""} // Use optional chaining
                stocksCount={stocks.length} // Access length safely
            />
       </div>
      {/* AI Assistant - position as needed, ensure z-index is appropriate */}
      <div className="absolute bottom-4 right-4 z-30">
        <AIAssistant />
      </div>
    </div>
 );
}