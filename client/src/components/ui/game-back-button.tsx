import React from 'react';
import { useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';

interface GameBackButtonProps {
  label?: string;
}

export function GameBackButton({ label = 'Back to Games Hub' }: GameBackButtonProps) {
  const [_, navigate] = useLocation();

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed top-4 left-4 z-50"
    >
      <button
        onClick={() => navigate('/games')}
        className="flex items-center py-2 px-4 bg-white rounded-full shadow-md hover:shadow-lg transition-all duration-300 group"
      >
        <ChevronLeft className="w-5 h-5 text-gray-600 group-hover:text-blue-500 transition-colors" />
        <span className="ml-1 text-gray-700 text-sm font-medium group-hover:text-blue-500 transition-colors">
          {label}
        </span>
      </button>
    </motion.div>
  );
}