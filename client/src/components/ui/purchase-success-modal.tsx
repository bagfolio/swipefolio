import React, { useEffect, useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, TrendingUp } from "lucide-react";
import { StockData } from "@/lib/stock-data";

interface PurchaseSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  stock: StockData;
  shares: number;
  amount: number;
  projectedReturn: number;
}

export default function PurchaseSuccessModal({
  isOpen,
  onClose,
  stock,
  shares,
  amount,
  projectedReturn,
}: PurchaseSuccessModalProps) {
  // For confetti effect, we'll use a simpler approach with CSS animation
  const [showConfetti, setShowConfetti] = useState(false);
  
  // Format currency for display
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  // Body lock when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      // Show confetti with a slight delay
      const confettiTimer = setTimeout(() => {
        setShowConfetti(true);
        
        // Hide confetti after a short burst
        setTimeout(() => {
          setShowConfetti(false);
        }, 2000);
      }, 150);
      
      return () => {
        clearTimeout(confettiTimer);
      };
    } else {
      document.body.style.overflow = '';
      setShowConfetti(false);
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <AnimatePresence mode="wait" key="success-modal">
      {isOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-[9999]" style={{ isolation: 'isolate' }}>
          {/* Confetti effect - centered burst */}
          {showConfetti && (
            <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-[55]">
              <div className="relative w-24 h-24">
                {Array.from({ length: 60 }).map((_, i) => {
                  // Generate random direction for each confetti piece
                  const angle = (Math.random() * 360); // random angle in degrees
                  const distance = 50 + Math.random() * 100; // random distance from center
                  const tx = Math.cos(angle * Math.PI / 180) * distance; // x-coordinate
                  const ty = Math.sin(angle * Math.PI / 180) * distance; // y-coordinate
                  const rotation = Math.random() * 720 - 360; // random rotation

                  return (
                    <div
                      key={i}
                      className="absolute top-1/2 left-1/2 w-2 h-5 rounded-sm animate-confetti-burst"
                      style={{
                        backgroundColor: ['#26a269', '#33d17a', '#f6d32d', '#1c71d8', '#c061cb', '#ed333b'][i % 6],
                        '--tx': `${tx}px`,
                        '--ty': `${ty}px`,
                        '--r': `${rotation}deg`,
                        transform: 'translate(-50%, -50%)',
                        opacity: 0.9,
                        animationDelay: `${Math.random() * 0.2}s`,
                      } as React.CSSProperties}
                    />
                  );
                })}
              </div>
            </div>
          )}
        
          {/* iOS-friendly backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.7 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="fixed inset-0 bg-black"
            style={{ zIndex: 50 }}
            onClick={onClose}
          />
          
          {/* Success modal with iOS-optimized animations and improved timing */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ 
              duration: 0.35, 
              ease: 'easeOut',
              delay: 0.15 // Increased delay for more satisfying effect
            }}
            className="w-[80%] max-w-xs mx-auto rounded-xl overflow-hidden bg-gradient-to-b from-green-500 to-green-600 
                       shadow-2xl border border-green-400"
            style={{
              zIndex: 52,
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 60px -15px rgba(0, 0, 0, 0.6)'
            }}
          >
            {/* Header with close button */}
            <div className="flex justify-between items-center p-3 border-b border-green-400">
              <div className="flex items-center">
                <div className="bg-white rounded-full p-1.5 mr-2">
                  <Check size={16} className="text-green-600" />
                </div>
                <h2 className="text-lg font-bold text-white">Congratulations!</h2>
              </div>
              <button 
                onClick={onClose}
                className="p-1.5 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors
                           flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-white/50"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>
            
            {/* Content */}
            <div className="p-4 text-white">
              <div className="mb-4 text-center">
                <p className="text-2xl font-bold mb-1">
                  {shares.toFixed(4)} shares
                </p>
                <p className="text-lg font-semibold mb-3">
                  of {stock.name} ({stock.ticker})
                </p>
                
                <div className="flex justify-center items-center space-x-2 mb-2">
                  <div className="bg-white/20 px-3 py-1.5 rounded-lg flex-1">
                    <p className="text-xs font-medium">Investment</p>
                    <p className="text-lg font-bold">{formatCurrency(amount)}</p>
                  </div>
                  
                  <div className="flex items-center text-white/60">
                    <TrendingUp size={16} />
                  </div>
                  
                  <div className="bg-white/20 px-3 py-1.5 rounded-lg flex-1">
                    <p className="text-xs font-medium">Projected Return</p>
                    <p className="text-lg font-bold">{formatCurrency(projectedReturn)}</p>
                  </div>
                </div>
              </div>
              
              {/* Action button */}
              <button
                onClick={onClose}
                className="w-full py-2.5 bg-white rounded-lg text-green-600 font-bold text-base
                           hover:bg-green-50 transition-colors shadow-md"
              >
                Continue Investing
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}