import { useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, LineChart, DollarSign, BarChartHorizontal, Building } from "lucide-react";

interface CategoryChipsProps {
  onCategoryChange?: (category: string) => void;
}

// Define category icons lookup object
const categoryIcons = {
  "Trending": <TrendingUp className="w-3.5 h-3.5" />,
  "Stocks": <LineChart className="w-3.5 h-3.5" />,
  "Crypto": <DollarSign className="w-3.5 h-3.5" />,
  "ETFs": <BarChartHorizontal className="w-3.5 h-3.5" />,
  "Alternatives": <Building className="w-3.5 h-3.5" />
};

export default function CategoryChips({ onCategoryChange }: CategoryChipsProps) {
  const [activeCategory, setActiveCategory] = useState("Trending");
  
  const categories = ["Trending", "Stocks", "Crypto", "ETFs", "Alternatives"];
  
  const handleCategoryClick = (category: string) => {
    setActiveCategory(category);
    if (onCategoryChange) {
      onCategoryChange(category);
    }
  };
  
  return (
    <div className="relative">
      <div className="flex overflow-x-auto py-4 space-x-3 no-scrollbar">
        {categories.map(category => (
          <motion.button
            key={category}
            className={`relative flex items-center space-x-1.5 whitespace-nowrap rounded-full px-4 py-2 text-sm transition-all duration-150
              ${activeCategory === category 
                ? 'text-white shadow-md bg-blue-500' 
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
            onClick={() => handleCategoryClick(category)}
            whileTap={{ scale: 0.95 }}
          >
            {/* Background pill that animates */}
            {activeCategory === category && (
              <motion.div 
                className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 -z-10"
                layoutId="categoryBackground"
                initial={false}
                transition={{ type: "spring", duration: 0.5 }}
              />
            )}
            
            {/* Icon */}
            <span className={`${activeCategory === category ? 'text-white' : 'text-slate-500'}`}>
              {categoryIcons[category as keyof typeof categoryIcons]}
            </span>
            
            {/* Category name */}
            <span>{category}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}