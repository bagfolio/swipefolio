import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Sparkles, Brain, ChevronRight, Zap, TrendingUp, BarChart3, PieChart, Bot, Trophy } from "lucide-react";
import { Stack } from "@shared/schema";
import AppHeader from "@/components/app-header";
import AppNavigation from "@/components/app-navigation";
import CategoryChips from "@/components/category-chips";
import SectionHeader from "@/components/section-header";
import StacksExplorer from "@/components/stacks-explorer";

import { useAuth } from "@/hooks/use-auth";
import { useState, useContext, useRef, useEffect } from "react";
import HeroSection from "@/components/hero-section";
import ModernUserWelcome from "@/components/modern-user-welcome";
import PortfolioDashboard from "@/components/portfolio-dashboard";
import CompetitionTracker from "@/components/competition-tracker";
import { PortfolioContext, usePortfolio } from "@/contexts/portfolio-context";
import AIAssistant from "@/components/ui/ai-assistant";

// iOS-style frosted glass background for AI sections
const GradientBackground = ({ children }: { children: React.ReactNode }) => (
  <div className="relative overflow-hidden rounded-xl mb-4">
    {/* Subtle gradient background - iOS style */}
    <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/70 via-blue-50/70 to-violet-50/70 rounded-xl" />
    
    {/* iOS-style blur effect overlay */}
    <div className="absolute inset-0 backdrop-blur-md bg-white/50 rounded-xl" />
    
    {/* Subtle animated particles - more subtle for iOS feel */}
    <div className="absolute inset-0 overflow-hidden">
      {[...Array(12)].map((_, i) => (
        <div 
          key={i}
          className="absolute w-[2px] h-[2px] rounded-full bg-blue-400 opacity-20"
          style={{
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            animation: `float ${7 + Math.random() * 8}s infinite ease-in-out ${Math.random() * 5}s`,
          }}
        />
      ))}
    </div>
    
    {/* iOS-style inner shadow border */}
    <div className="absolute inset-0 rounded-xl shadow-inner border border-slate-200/80" />
    
    {/* Content */}
    <div className="relative z-10">
      {children}
    </div>
  </div>
);

// Container for applying animations to child elements
const AnimatedContainer = ({ children, delay = 0 }: { children: React.ReactNode, delay?: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay }}
  >
    {children}
  </motion.div>
);

// iOS-style AI Feature Card for the AI Hub
const AIFeatureCard = ({ 
  icon, 
  title, 
  description, 
  link 
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string; 
  link: string;
}) => (
  <motion.a
    href={link}
    className="flex-shrink-0 w-48 p-4 rounded-xl backdrop-blur-sm bg-white/60 border border-slate-200/60 shadow-sm transition-all duration-300"
    whileHover={{ 
      y: -3, 
      scale: 1.01,
      boxShadow: "0 8px 20px -5px rgba(0, 0, 0, 0.08)",
      backgroundColor: "rgba(255, 255, 255, 0.8)"
    }}
    whileTap={{ scale: 0.97, y: 0 }}
    style={{ 
      boxShadow: "0 4px 12px -2px rgba(0, 0, 0, 0.05)",
    }}
  >
    {/* iOS style icon with subtle gradient and slight shadow */}
    <div className="w-11 h-11 mb-3 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-500 flex items-center justify-center text-white shadow-sm">
      {icon}
    </div>
    
    {/* iOS-style typography */}
    <h3 className="font-semibold text-sm text-slate-800 mb-1 tracking-tight">{title}</h3>
    <p className="text-xs leading-relaxed text-slate-500">{description}</p>
  </motion.a>
);

export default function HomePage() {
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState("Trending");
  
  // Ref for the AI Hub scrolling container
  const aiHubScrollRef = useRef<HTMLDivElement>(null);
  
  const { data: stacks, isLoading: isLoadingStacks } = useQuery<Stack[]>({
    queryKey: ["/api/stacks"],
  });
  
  const filterStacksByCategory = (stacks: Stack[], category: string) => {
    if (category === "Trending") {
      return stacks;
    }
    return stacks.filter(stack => stack.industry.includes(category));
  };

  // Add scroll shadow effect for AI hub
  const [showLeftShadow, setShowLeftShadow] = useState(false);
  const [showRightShadow, setShowRightShadow] = useState(true);

  const handleScroll = () => {
    if (aiHubScrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = aiHubScrollRef.current;
      setShowLeftShadow(scrollLeft > 10);
      setShowRightShadow(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    const scrollContainer = aiHubScrollRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll);
      return () => scrollContainer.removeEventListener('scroll', handleScroll);
    }
  }, []);
  
  return (
    <>
      <AppHeader />
      
      <main className="main-content pb-24 pt-20 px-4 bg-gradient-to-br from-slate-50 via-white to-blue-50/40">
        <AnimatedContainer>
          <HeroSection />
          <ModernUserWelcome name="Belford&Co" rank={11} />
          <CompetitionTracker />
        </AnimatedContainer>
        
        <AnimatedContainer delay={0.15}>
          <div className="md:grid md:grid-cols-1 md:gap-4">
            <PortfolioDashboard />
          </div>
        </AnimatedContainer>
        
        <AnimatedContainer delay={0.25}>
          <div className="mb-2 mt-4">
            <h2 className="text-xl font-semibold text-slate-800">Popular Picks</h2>
          </div>
          <CategoryChips 
            onCategoryChange={setSelectedCategory}
          />
        </AnimatedContainer>
        
        <AnimatedContainer delay={0.4}>
          <div className="mt-6"></div>
          <SectionHeader 
            title={selectedCategory} 
          />
          
          {isLoadingStacks ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            </div>
          ) : stacks ? (
            <StacksExplorer 
              stacks={filterStacksByCategory(stacks, selectedCategory)}
            />
          ) : (
            <div className="text-center py-12 text-gray-400">
              No stacks available
            </div>
          )}
        </AnimatedContainer>
      </main>
      
      
      <AIAssistant />
      <AppNavigation />
    </>
  );
}