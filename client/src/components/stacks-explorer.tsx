import { useLocation } from "wouter";
import StackCard from "./ui/stack-card";
import type { Stack } from "@shared/schema";
import { getIndustryStocks } from "@/lib/stock-data";
import { useQueryClient } from "@tanstack/react-query";
import { fetchStockChartData, timeFrameToRange } from "@/lib/yahoo-finance-client";

interface StacksExplorerProps {
  stacks: Stack[];
}

export default function StacksExplorer({ stacks }: StacksExplorerProps) {
  const [_, setLocation] = useLocation();
  const queryClient = useQueryClient();

  // This function preloads the chart data for the first stock in the stack
  const preloadStackData = async (industry: string) => {
    try {
      // Get the stocks for this industry
      const stocks = getIndustryStocks(industry);
      
      // If we have stocks, preload the data for the first few stocks
      if (stocks && stocks.length > 0) {
        // Preload first stock (the one that will be shown immediately)
        const firstStock = stocks[0];
        const firstSymbol = firstStock.ticker;
        
        console.log(`Preloading chart data for ${firstSymbol} (first stock in ${industry})`);
        
        // Get range for default timeframe (1Y is most commonly viewed)
        const defaultTimeframes = ["1Y", "1D"]; // Preload both 1Y and 1D data
        
        for (const timeframe of defaultTimeframes) {
          const range = timeFrameToRange[timeframe];
          
          // Prefetch first stock data and store in cache with higher priority
          const queryKey = ['/api/yahoo-finance/chart', firstSymbol, range];
          await queryClient.prefetchQuery({
            queryKey,
            queryFn: async () => fetchStockChartData(firstSymbol, range),
            staleTime: 5 * 60 * 1000, // 5 minutes
          });
        }
        
        // If there's a second stock, preload that too in background
        if (stocks.length > 1) {
          const secondStock = stocks[1];
          console.log(`Prefetching chart data for ${secondStock.ticker} (next stock in stack)`);
          
          // Prefetch in background without awaiting
          queryClient.prefetchQuery({
            queryKey: ['/api/yahoo-finance/chart', secondStock.ticker, timeFrameToRange["1Y"]],
            queryFn: async () => fetchStockChartData(secondStock.ticker, timeFrameToRange["1Y"]),
            staleTime: 5 * 60 * 1000, // 5 minutes
          });
        }
      }
    } catch (error) {
      console.error(`Error preloading chart data:`, error);
      // Don't throw - we don't want to interrupt the stack click navigation
    }
  };

  const handleStackClick = (stackId: number) => {
    // Find the stack that was clicked
    const clickedStack = stacks.find(stack => stack.id === stackId);
    
    if (clickedStack?.industry) {
      // Start preloading the chart data for the first stock in this industry
      preloadStackData(clickedStack.industry);
    }
    
    // Navigate to the stack detail page
    setLocation(`/stock/${stackId}`);
  };

  // Industry names and images with vibrant mobile-friendly imagery
  const industryDetails: Record<string, { name: string, image: string }> = {
    "Tech": { 
      name: "Tech Titans", 
      image: "Profiles/Industry_Tech.png" 
    },
    "Healthcare": { 
      name: "Med-Tech Innovators", 
      image: "Profiles/savelives.png"
    },
    "Consumer": { 
      name: "Retail Champions", 
      image: "Profiles/Industry_Retail.png"
    },
    "Retail": { 
      name: "Retail Champions", 
      image: "Profiles/Industry_Retail.png"
    },
    "Real Estate": { 
      name: "Property Players", 
      image: "Profiles/Industry_RealEstate.png" 
    },
    "Energy": { 
      name: "Energy Innovators", 
      image: "https://images.unsplash.com/photo-1591964006776-90d33e597522?q=80&w=580&auto=format&fit=crop" 
    },
    "Automotive": { 
      name: "Mobility Disruptors", 
      image: "https://images.unsplash.com/photo-1533106418989-88406c7cc8ca?q=80&w=580&auto=format&fit=crop" 
    },
    "Fintech": { 
      name: "Banking Disruptors", 
      image: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?q=80&w=580&auto=format&fit=crop" 
    },
    "ESG": { 
      name: "Green Giants", 
      image: "Profiles/green.png" 
    },
    "Industrials": { 
      name: "Industrial Leaders", 
      image: "https://images.unsplash.com/photo-1516937941344-00b4e0337589?q=80&w=580&auto=format&fit=crop" 
    },
    "Communication": { 
      name: "Media Movers", 
      image: "https://images.unsplash.com/photo-1516321497487-e288fb19713f?q=80&w=580&auto=format&fit=crop" 
    },
    "Technology": {
      name: "Tech Titans",
      image: "Profiles/Industry_Tech.png"
    },
    "Investing": {
      name: "Investment Essentials",
      image: "https://images.unsplash.com/photo-1621951753163-ee63e7fc0743?q=80&w=580&auto=format&fit=crop"
    },
    "Cryptocurrency": {
      name: "Crypto Explorer",
      image: "https://images.unsplash.com/photo-1518546305927-5a555bb7020d?q=80&w=580&auto=format&fit=crop"
    }
  };

  // Filter out non-industry stacks (like "investing" and "crypto currency" guides)
  const industryStacksOnly = stacks.filter(stack => {
    // Keep stacks if they have a real industry name, filter out educational stacks
    const isEducational = stack.title.includes("Investing") || 
                          stack.title.includes("Basics") || 
                          stack.title.includes("101") ||
                          stack.title.includes("Learn");
                          
    console.log(`Stack: ${stack.title}, Industry: ${stack.industry}, Educational: ${isEducational}`);
    return !isEducational;
  });

  // Add some default industry stacks if we don't have enough
  if (industryStacksOnly.length < 5) {
    // Example industries to add if there aren't enough
    const defaultIndustries = ["Tech", "Healthcare", "Retail", "Real Estate", "ESG"];
    const industryStockCounts: Record<string, number> = {
      "Real Estate": 10, // We have real estate stocks
      "Healthcare": 8,   // Currently using tech stocks as a fallback
      "Tech": 12,        // We have tech stocks
      "Retail": 10,       // We have retail stocks
      "ESG": 10           // Currently using tech stocks as a fallback
    };

    // Add missing industries from our defaults
    defaultIndustries.forEach((industry, index) => {
      if (!industryStacksOnly.some(s => s.industry === industry)) {
        industryStacksOnly.push({
          id: 100 + index, // Avoid ID conflicts
          title: industryDetails[industry].name,
          description: `Explore top companies in the ${industry} sector`,
          industry: industry,
          iconName: "trending-up", // Default icon
          difficulty: "intermediate",
          cardCount: industryStockCounts[industry] || 8, // Use specific count or default to 8
          rating: 4.5,
          estimatedMinutes: 15,
          color: "#000"
        });
      }
    });
  }

  // Get details for a given industry
  const getIndustryDetails = (industry: string) => {
    return industryDetails[industry] || { 
      name: industry, 
      image: "https://images.unsplash.com/photo-1579532537598-459ecdaf39cc?q=80&w=580&auto=format&fit=crop" 
    };
  };

  // Enhance stack data with industry details
  const enhancedStacks = industryStacksOnly.map(stack => {
    const details = getIndustryDetails(stack.industry);
    console.log(`Enhancing stack: ID ${stack.id}, Industry: ${stack.industry}, Display name: ${details.name}`);
    return {
      ...stack,
      title: details.name, // Replace title with industry-specific name
      imageUrl: details.image
    };
  });
  
  console.log("Final stacks for display:", enhancedStacks);

  return (
    <div className="grid-cols-stacks">
      {enhancedStacks.map((stack) => (
        <StackCard
          key={stack.id}
          stack={stack}
          onClick={handleStackClick}
          imageUrl={stack.imageUrl}
          category={stack.industry}
        />
      ))}
    </div>
  );
}