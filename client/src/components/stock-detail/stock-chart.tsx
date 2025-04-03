import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { RefreshCw } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

// Simplified interfaces
interface ChartDataPoint {
  date: string;
  price: number;
}

// Supported time periods
type TimeFrame = '1D' | '5D' | '1W' | '1M' | '3M' | '6M' | '1Y' | '5Y';

interface StockChartProps {
  symbol: string;
}

export default function StockChart({ symbol }: StockChartProps) {
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('1M');
  
  // Directly fetch price history with a fixed set of periods that we know work
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['/api/history', symbol, timeFrame],
    queryFn: async () => {
      if (!symbol) {
        console.log('Cannot fetch history: Symbol is undefined');
        return { chartData: [] };
      }
      
      console.log(`Fetching direct price history for ${symbol} with period ${timeFrame}`);
      
      // Get the raw data directly from the closing history in PostgreSQL
      const response = await fetch(`/api/historical/${symbol}?period=${timeFrame.toLowerCase()}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch price history for ${symbol}`);
      }
      
      const result = await response.json();
      console.log(`Received data for ${symbol}:`, result);
      
      // Extract and format the price data
      let chartData: ChartDataPoint[] = [];
      
      if (result.prices && Array.isArray(result.prices)) {
        if (typeof result.prices[0] === 'object' && 'date' in result.prices[0] && 'price' in result.prices[0]) {
          // Already in the correct format
          chartData = result.prices.map((point: any) => ({
            date: new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            price: typeof point.price === 'number' ? point.price : parseFloat(point.price)
          }));
        } else if (typeof result.prices[0] === 'number' && result.dates && Array.isArray(result.dates)) {
          // Convert parallel arrays to array of objects
          chartData = result.prices.map((price: number, index: number) => ({
            date: new Date(result.dates[index]).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            price
          }));
        }
      }
      
      console.log(`Formatted ${chartData.length} data points for ${symbol}`);
      return { chartData, source: result.source };
    },
    staleTime: 60 * 1000, // 1 minute cache
    enabled: !!symbol, // Only run when symbol is available
  });
  
  // Calculate price change
  const calculateChange = () => {
    if (!data?.chartData || data.chartData.length < 2) {
      return { change: 0, percentage: 0 };
    }
    
    const firstPrice = data.chartData[0].price;
    const lastPrice = data.chartData[data.chartData.length - 1].price;
    
    return {
      change: +(lastPrice - firstPrice).toFixed(2),
      percentage: +((lastPrice - firstPrice) / firstPrice * 100).toFixed(2)
    };
  };
  
  const { change, percentage } = calculateChange();
  const isPositiveChange = change >= 0;
  
  // Format currency
  const formatPrice = (value: number) => {
    return `$${value.toFixed(2)}`;
  };
  
  // Loading state
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-2">
            <Skeleton className="h-7 w-32" />
            <Skeleton className="h-7 w-24" />
          </div>
          <div className="flex items-center">
            <Skeleton className="h-8 w-28 mr-2" />
            <Skeleton className="h-6 w-20" />
          </div>
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Price History</h2>
        </div>
        <div className="p-8 text-center text-red-600">
          <p>Failed to load chart data</p>
          <p className="text-sm text-gray-500 mt-2">
            {error instanceof Error ? error.message : "An error occurred while fetching stock history"}
          </p>
        </div>
      </div>
    );
  }
  
  // No data state
  if (!data?.chartData || data.chartData.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Price History</h2>
        </div>
        <div className="p-8 text-center text-gray-600">
          <p>No historical data available for {symbol}</p>
        </div>
      </div>
    );
  }
  
  // The last price point is the current price
  const currentPrice = data.chartData[data.chartData.length - 1].price;
  
  // Chart component with data
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold">Price History</h2>
          
          {/* Time frame selector */}
          <div className="flex space-x-1 items-center">
            {/* Refresh button */}
            <button
              onClick={() => refetch()}
              className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full"
              title="Refresh chart data"
            >
              <RefreshCw size={16} />
            </button>
            
            {/* Available time periods - fixed set */}
            <div className="flex flex-wrap justify-end space-x-1">
              {['1D', '5D', '1W', '1M', '3M', '6M', '1Y'].map((tf) => (
                <button
                  key={tf}
                  onClick={() => setTimeFrame(tf as TimeFrame)}
                  className={`text-xs px-2 py-1 rounded-md ${
                    timeFrame === tf
                      ? 'bg-blue-100 text-blue-700 font-medium'
                      : 'text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>
        </div>
        
        {/* Current price and change */}
        <div className="flex items-center">
          <span className="text-2xl font-semibold mr-2">
            {formatPrice(currentPrice)}
          </span>
          <span 
            className={`text-sm font-medium px-2 py-0.5 rounded ${
              isPositiveChange ? 'text-green-700 bg-green-100' : 'text-red-700 bg-red-100'
            }`}
          >
            {isPositiveChange ? '+' : ''}{change} ({isPositiveChange ? '+' : ''}{percentage}%)
          </span>
        </div>
      </div>
      
      {/* Chart */}
      <div className="p-4 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data.chartData}
            margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
          >
            <defs>
              <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                <stop 
                  offset="5%" 
                  stopColor={isPositiveChange ? "#10B981" : "#EF4444"} 
                  stopOpacity={0.3} 
                />
                <stop 
                  offset="95%" 
                  stopColor={isPositiveChange ? "#10B981" : "#EF4444"} 
                  stopOpacity={0} 
                />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }} 
              tickLine={false}
              axisLine={{ stroke: '#E5E7EB' }}
              tickMargin={10}
              minTickGap={30}
            />
            <YAxis 
              tickFormatter={formatPrice}
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              domain={['auto', 'auto']}
            />
            <Tooltip
              formatter={(value: number) => [formatPrice(value), 'Price']}
              labelFormatter={(label) => `Date: ${label}`}
              contentStyle={{ 
                borderRadius: '4px', 
                border: '1px solid #E5E7EB',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
              }}
            />
            <Area 
              type="monotone" 
              dataKey="price" 
              stroke={isPositiveChange ? "#10B981" : "#EF4444"} 
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorPrice)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      
      {/* Source attribution */}
      <div className="px-4 pb-4 text-right text-xs text-gray-500">
        <div className="flex items-center justify-end">
          <span>Period: {timeFrame}</span>
          <span className="mx-2">•</span>
          <span>Source: {data.source || 'Replit Financial'}</span>
        </div>
      </div>
    </div>
  );
}