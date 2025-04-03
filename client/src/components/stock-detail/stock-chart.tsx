import React, { useState, useEffect } from 'react';
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
import { CalendarIcon, ChevronDown, RefreshCw } from 'lucide-react';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

// New interfaces for the updated API response format
interface PriceDataPoint {
  date: string;
  price: number;
}

interface StockPriceHistoryResponse {
  symbol: string;
  period: string;
  prices: number[] | PriceDataPoint[];
  source: string;
}

interface AvailablePeriodsResponse {
  symbol: string;
  availablePeriods: string[];
  source: string;
}

// Type for our formatted chart data
interface ChartDataPoint {
  date: string;
  price: number;
}

type TimeFrame = '5D' | '1W' | '1M' | '3M' | '6M' | '1Y' | '5Y';

interface StockChartProps {
  symbol: string;
}

export default function StockChart({ symbol }: StockChartProps) {
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('1M');
  
  // First, fetch available periods for this stock - but only if we have a valid symbol
  const periodsQuery = useQuery<AvailablePeriodsResponse>({
    queryKey: ['/api/stock/available-periods', symbol],
    queryFn: async () => {
      // Guard against undefined or empty symbol
      if (!symbol) {
        console.warn('Cannot fetch available periods: No symbol provided');
        return { symbol: '', availablePeriods: ['1M'], source: 'default' };
      }
      
      console.log(`Fetching available periods for: ${symbol}`);
      const response = await fetch(`/api/stock/${symbol}/available-periods`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error(`Error fetching available periods: ${JSON.stringify(errorData)}`);
        throw new Error(
          errorData.message || `Failed to fetch available periods for ${symbol}`
        );
      }
      const data = await response.json();
      console.log(`Got available periods for ${symbol}:`, data.availablePeriods);
      return data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    enabled: !!symbol, // Only run when we have a symbol
  });
  
  // Make sure we're using a time frame that's available
  useEffect(() => {
    if (periodsQuery.data?.availablePeriods && periodsQuery.data.availablePeriods.length > 0) {
      // If the current timeFrame isn't available, set it to the first available one
      if (!periodsQuery.data.availablePeriods.includes(timeFrame)) {
        setTimeFrame(periodsQuery.data.availablePeriods[0] as TimeFrame);
      }
    }
  }, [periodsQuery.data, timeFrame]);
  
  // Fetch price history data for the selected time frame
  const { data, isLoading, error, refetch } = useQuery<StockPriceHistoryResponse>({
    queryKey: ['/api/historical', symbol, timeFrame],
    queryFn: async () => {
      // Guard against undefined or empty symbol
      if (!symbol) {
        console.warn('Cannot fetch historical data: No symbol provided');
        throw new Error('Stock symbol is required to fetch price history');
      }
      
      console.log(`Fetching historical data for ${symbol} with period ${timeFrame}`);
      const response = await fetch(`/api/historical/${symbol}?period=${timeFrame.toLowerCase()}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error(`Error fetching historical data: ${JSON.stringify(errorData)}`);
        throw new Error(
          errorData.message || `Failed to fetch price history for ${symbol}`
        );
      }
      const data = await response.json();
      console.log(`Got historical data: ${data.prices?.length} data points for ${symbol}`);
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: Boolean(symbol) && Boolean(timeFrame), // Only run query when we have both symbol and timeFrame
  });
  
  // Format the data for the chart
  const formatChartData = (): ChartDataPoint[] => {
    if (!data || !data.prices || data.prices.length === 0) {
      console.log(`No chart data available for ${symbol}`);
      return [];
    }
    
    console.log(`Formatting chart data for ${symbol}: `, data.prices);
    
    try {
      // Handle array of numbers (simple price array)
      if (typeof data.prices[0] === 'number') {
        console.log(`Handling number array format for ${symbol}`);
        // Create dates based on the number of price points - going backward from today
        const prices = data.prices as number[];
        const result: ChartDataPoint[] = [];
        
        // Create a date range based on the selected time frame
        let days = 30; // Default for 1M
        switch (timeFrame) {
          case '5D': days = 5; break;
          case '1W': days = 7; break;
          case '3M': days = 90; break;
          case '6M': days = 180; break;
          case '1Y': days = 365; break;
          case '5Y': days = 1825; break;
        }
        
        // Only use as many days as we have prices
        const pointsToUse = Math.min(prices.length, days);
        
        // Create dates going backward from today
        const today = new Date();
        
        for (let i = 0; i < pointsToUse; i++) {
          const date = new Date(today);
          date.setDate(today.getDate() - (pointsToUse - i - 1));
          
          result.push({
            date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            price: prices[i]
          });
        }
        
        console.log(`Generated ${result.length} chart data points`);
        return result;
      }
      
      // Handle array of objects with date and price properties
      if (typeof data.prices[0] === 'object' && 'date' in data.prices[0] && 'price' in data.prices[0]) {
        console.log(`Handling object array format for ${symbol}`);
        const result = (data.prices as PriceDataPoint[]).map(point => ({
          date: new Date(point.date).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric' 
          }),
          price: typeof point.price === 'string' ? parseFloat(point.price) : point.price
        }));
        
        console.log(`Processed ${result.length} chart data points`);
        return result;
      }
      
      // If we got here, the data format is unexpected
      console.error(`Unexpected data format for ${symbol} chart data:`, data.prices[0]);
      return [];
    } catch (err) {
      console.error(`Error formatting chart data for ${symbol}:`, err);
      return [];
    }
  };
  
  const chartData = formatChartData();
  
  // Calculate price change and percentage
  const calculateChange = () => {
    if (chartData.length < 2) return { change: 0, percentage: 0 };
    
    const firstPrice = chartData[0].price;
    const lastPrice = chartData[chartData.length - 1].price;
    
    return {
      change: +(lastPrice - firstPrice).toFixed(2),
      percentage: +((lastPrice - firstPrice) / firstPrice * 100).toFixed(2)
    };
  };
  
  const { change, percentage } = calculateChange();
  const isPositiveChange = change >= 0;
  
  // Format price to show 2 decimal places
  const formatPrice = (value: number) => {
    return `$${value.toFixed(2)}`;
  };
  
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
  
  if (error || !data) {
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
  
  // If no data available
  if (chartData.length === 0) {
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
            
            {/* Available time periods */}
            <div className="flex flex-wrap justify-end space-x-1">
              {periodsQuery.isLoading ? (
                <Skeleton className="h-8 w-32" />
              ) : (
                (periodsQuery.data?.availablePeriods || ['5D', '1W', '1M', '3M', '6M', '1Y', '5Y']).map((tf) => (
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
                ))
              )}
            </div>
          </div>
        </div>
        
        {/* Current price and change */}
        <div className="flex items-center">
          <span className="text-2xl font-semibold mr-2">
            {chartData.length > 0 ? formatPrice(chartData[chartData.length - 1].price) : '$0.00'}
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
            data={chartData}
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
          <span>Source: {data.source || 'Stock Data Provider'}</span>
        </div>
      </div>
    </div>
  );
}