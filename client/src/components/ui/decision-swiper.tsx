import React, { useState, useRef } from 'react';
import { motion, PanInfo, useMotionValue, useTransform } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowBigLeft, ArrowBigRight, Check, X } from 'lucide-react';

interface Option {
  id: string;
  text: string;
  impacts: {
    metric: string;
    value: number;
    category: 'Growth' | 'Stability' | 'Momentum' | 'Value';
  }[];
}

interface DecisionSwiperProps {
  title: string;
  description: string;
  options: Option[];
  onDecision: (optionId: string) => void;
  learningObjective?: string; // Optional learning objective for educational content
}

export function DecisionSwiper({ 
  title, 
  description, 
  options, 
  onDecision,
  learningObjective
}: DecisionSwiperProps) {
  const [currentOptionIndex, setCurrentOptionIndex] = useState(0);
  const [direction, setDirection] = useState<'left' | 'right' | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  
  // Get current option
  const currentOption = options[currentOptionIndex];
  
  // Motion values for drag interactions
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 0, 200], [-10, 0, 10]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0.5, 0.8, 1, 0.8, 0.5]);
  
  // Calculate background for swipe directions
  const leftBgOpacity = useTransform(x, [-200, 0], [0.8, 0]);
  const rightBgOpacity = useTransform(x, [0, 200], [0, 0.8]);
  
  // Handle drag start
  const handleDragStart = () => {
    setIsDragging(true);
  };
  
  // Handle drag end
  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setIsDragging(false);
    
    // Check if the card was dragged beyond the threshold
    const threshold = 100;
    
    if (info.offset.x > threshold) {
      // Swiped right (Accept)
      setDirection('right');
      makeDecision();
    } else if (info.offset.x < -threshold) {
      // Swiped left (Decline)
      setDirection('left');
      moveToNextOption();
    } else {
      // Reset position if not dragged far enough
      x.set(0);
    }
  };
  
  // Make a decision (accept the current option)
  const makeDecision = () => {
    onDecision(currentOption.id);
  };
  
  // Move to the next option (decline the current option)
  const moveToNextOption = () => {
    const nextIndex = (currentOptionIndex + 1) % options.length;
    
    // Animate the card off screen
    x.set(-window.innerWidth);
    
    // After animation, reset position and update index
    setTimeout(() => {
      x.set(0);
      setCurrentOptionIndex(nextIndex);
      setDirection(null);
    }, 300);
  };
  
  // Get color based on impact value
  const getImpactColor = (value: number) => {
    if (value > 0) return 'text-green-600';
    if (value < 0) return 'text-red-600';
    return 'text-gray-600';
  };
  
  // Get impact symbol based on value
  const getImpactSymbol = (value: number) => {
    if (value > 0) return '+';
    if (value < 0) return '';  // negative value already has - sign
    return '';
  };
  
  // Category colors
  const getCategoryColor = (category: string) => {
    switch(category) {
      case 'Growth': return 'bg-emerald-100 text-emerald-800';
      case 'Stability': return 'bg-blue-100 text-blue-800';
      case 'Momentum': return 'bg-purple-100 text-purple-800';
      case 'Value': return 'bg-amber-100 text-amber-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="relative flex flex-col items-center w-full max-w-md mx-auto">
      {/* Decision header */}
      <div className="w-full text-center mb-4">
        <h2 className="text-xl font-bold">{title}</h2>
        <p className="text-sm text-gray-600 mt-1">{description}</p>
        
        {learningObjective && (
          <div className="mt-2 bg-blue-50 text-blue-700 p-2 rounded-lg text-sm">
            <span className="font-medium">Learning Objective:</span> {learningObjective}
          </div>
        )}
      </div>
      
      {/* Swipe indicators */}
      <div className="flex justify-between w-full px-4 mb-2">
        <div className="flex items-center text-red-500">
          <X size={16} className="mr-1" />
          <span className="text-sm font-medium">Decline</span>
        </div>
        <div className="flex items-center text-green-500">
          <span className="text-sm font-medium">Accept</span>
          <Check size={16} className="ml-1" />
        </div>
      </div>
      
      {/* Swipeable card */}
      <div className="relative w-full h-[330px]">
        {/* Left background (red) */}
        <motion.div 
          className="absolute inset-0 bg-red-100 rounded-xl flex items-center justify-center"
          style={{ opacity: leftBgOpacity }}
        >
          <ArrowBigLeft className="text-red-500" size={48} />
        </motion.div>
        
        {/* Right background (green) */}
        <motion.div 
          className="absolute inset-0 bg-green-100 rounded-xl flex items-center justify-center"
          style={{ opacity: rightBgOpacity }}
        >
          <ArrowBigRight className="text-green-500" size={48} />
        </motion.div>
        
        {/* Card */}
        <motion.div
          ref={cardRef}
          className="absolute inset-0"
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.9}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          style={{ 
            x, 
            rotate,
            opacity
          }}
          whileTap={{ scale: 0.98 }}
        >
          <Card className="w-full h-full overflow-hidden shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{currentOption.text}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold mb-2">Impacts:</h3>
                  <div className="space-y-2">
                    {currentOption.impacts.map((impact, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <div className="flex items-center">
                          <Badge variant="outline" className={getCategoryColor(impact.category)}>
                            {impact.category}
                          </Badge>
                          <span className="ml-2 text-sm">{impact.metric}</span>
                        </div>
                        <span className={`font-medium ${getImpactColor(impact.value)}`}>
                          {getImpactSymbol(impact.value)}{impact.value}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
      
      {/* Option counter */}
      <div className="mt-4 text-sm text-gray-500">
        Option {currentOptionIndex + 1} of {options.length}
      </div>
      
      {/* Manual controls (for accessibility or when swipe not available) */}
      <div className="flex justify-between w-full mt-4">
        <button
          onClick={moveToNextOption}
          className="flex items-center px-4 py-2 bg-red-100 text-red-700 rounded-lg"
        >
          <X size={16} className="mr-1" />
          Decline
        </button>
        <button
          onClick={makeDecision}
          className="flex items-center px-4 py-2 bg-green-100 text-green-700 rounded-lg"
        >
          Accept
          <Check size={16} className="ml-1" />
        </button>
      </div>
    </div>
  );
}