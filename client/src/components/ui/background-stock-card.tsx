import { StockData } from "@/lib/stock-data";
import { CardContent, Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { TrendingDown, TrendingUp } from "lucide-react";
import React from "react";

/**
 * BackgroundStockCard - A component for displaying a stock card as a background element
 * This card is designed to be shown behind the main card in stacked card interfaces
 */
interface BackgroundStockCardProps {
  stock: StockData;
  className?: string;
}

const BackgroundStockCard = React.forwardRef<HTMLDivElement, BackgroundStockCardProps>(
  ({ stock, className }, ref) => {
    if (!stock) return null;
    
    // Determine if stock is up or down
    const isPositive = stock.change >= 0;
    const changeColor = isPositive ? 'text-green-500' : 'text-red-500';
    const chartLineColor = isPositive ? '#22c55e' : '#ef4444';
    
    return (
      <Card
        ref={ref}
        className={cn(
          "border-0 shadow-xl overflow-hidden bg-white dark:bg-gray-900 cursor-grab active:cursor-grabbing transition-all duration-300",
          className
        )}
        data-testid="background-stock-card"
      >
        <CardContent className="p-6">
          {/* Stock Header */}
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-bold truncate">{stock.name}</h2>
            <div className="rounded-md px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-800">
              {stock.ticker}
            </div>
          </div>
          
          {/* Price and Change */}
          <div className="flex items-center justify-between mb-4">
            <div className="text-2xl font-bold">${stock.price.toFixed(2)}</div>
            <div className={`flex items-center space-x-1 ${changeColor}`}>
              {isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
              <span className="font-semibold">{Math.abs(stock.changePercent).toFixed(2)}%</span>
            </div>
          </div>
          
          {/* Chart Area - Simplified for background */}
          <div className="h-24 w-full mb-4 bg-gray-100 dark:bg-gray-800 rounded-lg opacity-75" />
          
          {/* Metrics Preview */}
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg p-3 bg-gray-100 dark:bg-gray-800">
              <div className="text-sm text-gray-500 dark:text-gray-400">Performance</div>
              <div className="flex items-center space-x-1 mt-1">
                <div className={`w-3 h-3 rounded-full ${stock.metrics.performance.color === 'green' ? 'bg-green-500' : stock.metrics.performance.color === 'yellow' ? 'bg-yellow-500' : 'bg-red-500'}`} />
                <span className="font-medium">{stock.metrics.performance.value}</span>
              </div>
            </div>
            <div className="rounded-lg p-3 bg-gray-100 dark:bg-gray-800">
              <div className="text-sm text-gray-500 dark:text-gray-400">Stability</div>
              <div className="flex items-center space-x-1 mt-1">
                <div className={`w-3 h-3 rounded-full ${stock.metrics.stability.color === 'green' ? 'bg-green-500' : stock.metrics.stability.color === 'yellow' ? 'bg-yellow-500' : 'bg-red-500'}`} />
                <span className="font-medium">{stock.metrics.stability.value}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
);

BackgroundStockCard.displayName = "BackgroundStockCard";

export default BackgroundStockCard;