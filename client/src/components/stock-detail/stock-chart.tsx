import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { RefreshCw } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

// Simplified interface for stock data
interface StockDataPoint {
  date: string;
  price: number;
}

type TimeFrame = '5D' | '1W' | '1M' | '3M' | '6M' | '1Y';

interface StockChartProps {
  symbol: string;
}

export default function StockChart({ symbol }: StockChartProps) {
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('1M');
  
  // Fetch available periods for this stock
  const { data: periodsData } = useQuery({
    queryKey: ['/api/stock/available-periods', symbol],
    queryFn: async () => {
      const response = await fetch(`/api/stock/${symbol}/available-periods`);
      if (!response.ok) {
        throw new Error(`Failed to fetch available periods for ${symbol}`);
      }
      return response.json();
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
  
  // Fetch the historical price data
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['/api/historical', symbol, timeFrame],
    queryFn: async () => {
      console.log(`Fetching data for ${symbol} with period ${timeFrame}`);
      const response = await fetch(`/api/historical/${symbol}?period=${timeFrame}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch price history for ${symbol}`);
      }
      
      const result = await response.json();
      console.log('Historical data response:', result);
      
      // Transform the data into chart-friendly format
      if (result.prices) {
        // If prices is already an array of objects with date and price
        if (typeof result.prices[0] === 'object' && result.prices[0].date && result.prices[0].price !== undefined) {
          console.log('Using object array format', result.prices.slice(0, 3));
          return {
            ...result,
            chartData: result.prices
          };
        }
        
        // If we have separate prices and dates arrays
        if (Array.isArray(result.dates) && result.dates.length === result.prices.length) {
          console.log('Using separate prices/dates arrays');
          const chartData = result.dates.map((date: string, i: number) => ({
            date: new Date(date).toLocaleDateString(),
            price: result.prices[i]
          }));
          
          return {
            ...result,
            chartData
          };
        }
        
        // If we just have prices array, generate dates
        if (Array.isArray(result.prices) && typeof result.prices[0] === 'number') {
          console.log('Using prices array only, generating dates');
          const chartData = result.prices.map((price: number, i: number) => ({
            date: `Day ${i+1}`,
            price
          }));
          
          return {
            ...result,
            chartData
          };
        }
      }
      
      console.log('No valid price data found');
      return { ...result, chartData: [] };
    },
    staleTime: 5 * 60 * 1000,
    enabled: Boolean(symbol),
  });
  
  // If we have periods data, make sure we use an available period
  useEffect(() => {
    if (periodsData?.availablePeriods?.length > 0) {
      if (!periodsData.availablePeriods.includes(timeFrame)) {
        setTimeFrame(periodsData.availablePeriods[0] as TimeFrame);
      }
    }
  }, [periodsData, timeFrame]);
  
  // Format price with proper currency display
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price);
  };
  
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
  
  // Loading state
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex justify-between items-center mb-4">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-6 w-24" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4">
        <h2 className="text-lg font-semibold mb-2">Price History</h2>
        <div className="p-4 text-center text-red-500">
          <p>Failed to load chart data</p>
        </div>
      </div>
    );
  }
  
  // No data state
  if (!data?.chartData || data.chartData.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4">
        <h2 className="text-lg font-semibold mb-2">Price History</h2>
        <div className="p-4 text-center text-gray-500">
          <p>No price history data available for {symbol}</p>
        </div>
      </div>
    );
  }
  
  // Calculate current price (last data point)
  const currentPrice = data.chartData[data.chartData.length - 1].price;
  
  return (
    <div className="bg-white rounded-lg shadow-md">
      <div className="p-4 border-b">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-semibold">Price History</h2>
          
          <div className="flex space-x-1">
            {/* Refresh button */}
            <button 
              onClick={() => refetch()}
              className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full"
            >
              <RefreshCw size={16} />
            </button>
            
            {/* Time period selectors */}
            <div className="flex space-x-1">
              {(periodsData?.availablePeriods || ['5D', '1W', '1M', '3M', '6M', '1Y']).map((period: string) => (
                <button
                  key={period}
                  onClick={() => setTimeFrame(period as TimeFrame)}
                  className={`px-2 py-1 text-xs rounded ${
                    timeFrame === period
                      ? 'bg-blue-100 text-blue-700 font-medium'
                      : 'text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  {period}
                </button>
              ))}
            </div>
          </div>
        </div>
        
        {/* Price and change display */}
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
          <LineChart data={data.chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={{ stroke: '#E5E7EB' }}
            />
            <YAxis 
              tickFormatter={(value) => `$${value}`}
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              domain={['auto', 'auto']}
            />
            <Tooltip 
              formatter={(value: number) => [formatPrice(value), 'Price']}
              labelFormatter={(label) => `Date: ${label}`}
            />
            <Line 
              type="monotone" 
              dataKey="price" 
              stroke={isPositiveChange ? "#10B981" : "#EF4444"} 
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      {/* Attribution */}
      <div className="px-4 pb-4 text-right text-xs text-gray-500">
        <div className="flex justify-end items-center">
          <span>Period: {timeFrame}</span>
          <span className="mx-2">•</span>
          <span>Source: {data.source || 'Stock API'}</span>
        </div>
      </div>
    </div>
  );
}