import React, { useRef } from "react";
import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { Card as CardType } from "@shared/schema";

export interface SwipeableCardProps {
  card: CardType;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  indexInStack: number;
  totalInStack: number;
}

export default function SwipeableCard({
  card,
  onSwipeLeft,
  onSwipeRight,
  indexInStack,
  totalInStack,
}: SwipeableCardProps) {
  // Refs
  const cardRef = useRef<HTMLDivElement>(null);
  
  // Motion values
  const x = useMotionValue(0);
  const motionY = useMotionValue(0); // We won't use this directly for positioning
  const rotate = useTransform(x, [-200, 0, 200], [-10, 0, 10]);
  const opacity = useTransform(
    x, 
    [-200, -150, 0, 150, 200], 
    [0.7, 0.9, 1, 0.9, 0.7]
  );
  
  // Calculate z-index based on position in stack
  const zIndex = totalInStack - indexInStack;
  
  // Scaling for cards in the stack (less reduction for better visibility)
  const scale = 1 - indexInStack * 0.03;
  
  // Slight vertical offset for stacked appearance (smaller offset to show more of the card)
  const yOffset = indexInStack * 15;
  
  // Handle drag end
  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 100;
    
    if (info.offset.x > threshold) {
      // Swiped right
      onSwipeRight();
    } else if (info.offset.x < -threshold) {
      // Swiped left
      onSwipeLeft();
    } else {
      // Reset position
      x.set(0);
      motionY.set(0);
    }
  };

  return (
    <motion.div
      ref={cardRef}
      className="absolute top-0 left-0 right-0 bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100"
      style={{
        x,
        y: yOffset, // Using yOffset for the y position
        rotate,
        opacity: indexInStack === 0 ? opacity : 0.95, // Keep back card visible
        zIndex,
        scale,
      }}
      drag={indexInStack === 0 ? "x" : false}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.7}
      onDragEnd={handleDragEnd}
      initial={{ scale, y: yOffset }}
      animate={{ scale, y: yOffset }}
      transition={{ 
        type: "spring", 
        stiffness: 250, // Reduced stiffness for slower animation
        damping: 25,   // Increased damping for smoother motion
        duration: 0.8  // Extended duration 
      }}
      whileTap={{ cursor: "grabbing" }}
    >
      <div className="p-6 bg-white">
        <h3 className="text-lg font-semibold mb-3">{card.title}</h3>
        <div className="prose prose-sm">
          <div dangerouslySetInnerHTML={{ __html: card.content || "" }} />
        </div>
      </div>
      
      {/* Gradient indicators for swipe directions (only shown for the top card) */}
      {indexInStack === 0 && (
        <>
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-red-500/20 to-transparent"
            style={{ 
              opacity: useTransform(x, [0, -100], [0, 1]) 
            }}
          />
          <motion.div
            className="absolute inset-0 bg-gradient-to-l from-green-500/20 to-transparent"
            style={{ 
              opacity: useTransform(x, [0, 100], [0, 1]) 
            }}
          />
        </>
      )}
      
      {/* Card index indicator */}
      <div className="absolute bottom-2 right-2 opacity-50 text-xs">
        {indexInStack === 0 && (
          <div className="flex gap-1 items-center">
            <span>Swipe to continue</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}