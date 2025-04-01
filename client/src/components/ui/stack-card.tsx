import { BarChart2, Star, Clock, ChevronLeft, ChevronRight, Heart } from "lucide-react";
import type { Stack } from "@shared/schema";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";

interface StackCardProps {
  stack: Stack;
  onClick: (stackId: number) => void;
  imageUrl?: string;
  category?: string;
}

export default function StackCard({ stack, onClick, imageUrl, category }: StackCardProps) {
  // State for swipe animation cues
  const [showSwipeCues, setShowSwipeCues] = useState(true);
  const [currentCardIndex, setCurrentCardIndex] = useState(1);
  const totalCards = stack.cardCount || 10;
  
  // Hide swipe cues after a few seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSwipeCues(false);
    }, 3000);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Get a unique gradient based on stack id or title
  const getGradient = () => {
    const gradients = [
      "from-cyan-500 to-blue-600", // Tech
      "from-green-500 to-emerald-600", // ESG
      "from-purple-500 to-indigo-600", // Financial
      "from-red-500 to-rose-600", // Healthcare
      "from-orange-500 to-amber-600", // Consumer
      "from-blue-500 to-violet-600", // Real Estate
      "from-yellow-500 to-orange-600", // Bonds
      "from-teal-500 to-green-600", // ETFs
      "from-pink-500 to-rose-600", // Crypto
      "from-indigo-500 to-blue-600", // Stocks
    ];

    const index = stack.id % gradients.length;
    return gradients[index];
  };

  return (
    <motion.div 
      className="stack-card rounded-xl overflow-hidden flex flex-row shadow-lg border border-gray-200 bg-white h-[120px]"
      onClick={() => onClick(stack.id)}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      whileTap={{ scale: 0.99 }}
    >
      {/* Left side image */}
      <div className="relative w-[120px] overflow-hidden">
        {/* Gradient overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-black/20 to-transparent z-10" />

        <div 
          className="w-full h-full bg-cover bg-center" 
          style={{ 
            backgroundImage: imageUrl ? `url(${imageUrl})` : 'none'
          }}
        />
        
        {/* Category badge - Moved to top for better visibility */}
        {category && (
          <div className="absolute top-3 left-3 bg-black/60 border border-gray-700 backdrop-blur-sm rounded-full px-2.5 py-0.5 text-xs font-medium z-20 text-white">
            {category}
          </div>
        )}

        {/* Bottom indicators row - Only showing stock count */}
        <div className="absolute bottom-2 left-2 z-20">
          {/* Card count with progress - Simplified */}
          <div className="bg-black/60 backdrop-blur-sm border border-gray-700 rounded-full px-2 py-0.5 flex items-center space-x-1 text-xs">
            <BarChart2 className="w-3 h-3 text-cyan-400" />
            <span className="text-white">{totalCards}</span>
          </div>
        </div>
      </div>

      {/* Card Body - Better spacing and hierarchy */}
      <div className="p-3 flex-1 flex flex-col justify-between bg-white">
        {/* Title with icon - Improved spacing */}
        <div>
          <h3 className="font-bold text-base text-gray-800 leading-tight mb-1">{stack.title}</h3>
          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{stack.description}</p>
        </div>

        <div className="mt-auto pt-1">
          {/* Bottom badges with better spacing */}
          <div className="flex items-center justify-between">
            <div className={`badge ${
              stack.difficulty === 'beginner' ? 'bg-green-50 text-green-600 border-green-200' :
              stack.difficulty === 'intermediate' ? 'bg-yellow-50 text-yellow-600 border-yellow-200' :
              'bg-red-50 text-red-600 border-red-200'
            } text-xs px-2 py-0.5 rounded-full border`}>
              {stack.difficulty || 'intermediate'}
            </div>
            
            {/* Favorite button */}
            <button 
              className="rounded-full p-1.5 bg-gray-100 hover:bg-gray-200 transition-colors border border-gray-200"
              onClick={(e) => {
                e.stopPropagation(); // Prevent triggering the card click
                // Implement favorite functionality later
              }}
            >
              <Heart className="w-3.5 h-3.5 text-pink-500" />
            </button>
          </div>
        </div>
      </div>

      {/* Decorative gradient accent line at right */}
      <div className={`w-1 bg-gradient-to-b ${getGradient()}`} />
    </motion.div>
  );
}