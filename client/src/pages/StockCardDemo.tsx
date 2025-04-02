import React, { useState } from "react";
import { useLocation } from "wouter";
import { techStocks } from "@shared/mock-stocks";
import { StockData } from "@/lib/stock-data";
import StockCard from "@/components/ui/stock-card-new";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

/**
 * This is a demo page to showcase our stock card stack and the BackgroundStockCard component.
 * It uses mock stock data to demonstrate the card stack functionality.
 */
export default function StockCardDemo() {
  const [_, setLocation] = useLocation();
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Format mock data to match StockData interface
  const stockArray = Object.values(techStocks).map(stock => {
    // Create metrics in the correct format
    const metrics = {
      performance: {
        value: stock.metrics.performance,
        color: stock.metrics.performance > 70 ? 'green' : stock.metrics.performance > 40 ? 'yellow' : 'red',
        details: {
          revenueGrowth: stock.metrics.revenueGrowth || 10,
          profitMargin: stock.metrics.profitMargin || 15,
          returnOnCapital: stock.metrics.returnOnEquity || 12
        }
      },
      stability: {
        value: stock.metrics.stability || 65,
        color: stock.metrics.stability > 70 ? 'green' : stock.metrics.stability > 40 ? 'yellow' : 'red',
        details: {
          volatility: stock.metrics.beta || 1.2,
          beta: stock.metrics.beta || 1.2,
          dividendConsistency: 'Good'
        }
      },
      value: {
        value: stock.metrics.value || 70,
        color: stock.metrics.value > 70 ? 'green' : stock.metrics.value > 40 ? 'yellow' : 'red',
        details: {
          peRatio: stock.metrics.peRatio || 25,
          pbRatio: stock.metrics.pbRatio || 5,
          dividendYield: stock.metrics.dividendYield || 2.5
        }
      },
      momentum: {
        value: stock.metrics.momentum || 80,
        color: stock.metrics.momentum > 70 ? 'green' : stock.metrics.momentum > 40 ? 'yellow' : 'red',
        details: {
          threeMonthReturn: 8.5,
          relativePerformance: 5.2,
          rsi: 65
        }
      }
    };
    
    return {
      ticker: stock.symbol,
      symbol: stock.symbol,
      name: stock.name,
      price: stock.price,
      change: stock.change,
      changePercent: stock.changePercent,
      industry: stock.industry,
      description: stock.description,
      metrics: metrics,
      chartData: Array(12).fill(0).map((_, i) => stock.price * (1 + (i % 3 === 0 ? 0.01 : -0.01) * i)),
      predictedPrice: stock.predictedPrice,
      returnYear: stock.returnYear,
      quality: stock.quality,
      synopsis: {
        price: "This stock has been showing a steady upward trend over the past months.",
        company: "A leading technology company with strong market presence.",
        role: "Good for growth and innovation exposure in your portfolio."
      }
    } as StockData;
  });

  // Handle navigation
  const handleReturn = () => {
    setLocation("/");
  };

  // Handle next card
  const handleNext = () => {
    if (currentIndex < stockArray.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  // Handle previous card
  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };
  
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="icon" 
            className="mr-2"
            onClick={handleReturn}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">Stock Card Demo</h1>
        </div>
        <div className="flex items-center text-sm">
          <div className="text-gray-500">
            {currentIndex + 1}/{stockArray.length}
          </div>
        </div>
      </header>
      
      {/* Main content */}
      <main className="flex-1 flex items-center justify-center p-4 relative">
        <div className="w-full max-w-md h-[600px] relative">
          <div className="relative h-full w-full perspective-1000">
            {/* Current Stock Card */}
            <StockCard
              stock={stockArray[currentIndex]}
              nextStock={currentIndex < stockArray.length - 1 ? stockArray[currentIndex + 1] : undefined}
              onNext={handleNext}
              onPrevious={handlePrevious}
              currentIndex={currentIndex}
              totalCount={stockArray.length}
              displayMode="realtime"
            />
          </div>
        </div>
      </main>
    </div>
  );
}