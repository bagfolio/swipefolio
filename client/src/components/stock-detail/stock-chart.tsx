import React, { useState, useEffect } from 'react';
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
import { usePreloadedData } from '@/contexts/preload-context';

// Super simple props
interface StockChartProps {
  symbol: string;
}

export default function StockChart({ symbol }: StockChartProps) {
  const [timeFrame, setTimeFrame] = useState('1M');
  const [isLoading, setIsLoading] = useState(true);
  const [chartData, setChartData] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState('');
  
  // Get preloaded data context
  const { getStockData } = usePreloadedData();
  
  // Format currency
  const formatPrice = (value: number) => {
    return `$${value.toFixed(2)}`;
  };
  
  // Fetch data on mount or when symbol/timeFrame changes
  const fetchData = async () => {
    if (!symbol) {
      setChartData([]);
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log(`CHART: Fetching data for ${symbol} with period ${timeFrame}...`);
      
      // First, try to get preloaded data
      const preloadedData = getStockData(symbol, timeFrame);
      let result;
      
      if (preloadedData) {
        // Use preloaded data if available
        console.log(`CHART: Using preloaded data for ${symbol} (${timeFrame})`);
        result = preloadedData;
      } else {
        // Fetch from API if no preloaded data is available
        console.log(`CHART: No preloaded data found, fetching from API...`);
        const response = await fetch(`/api/historical/${symbol}?period=${timeFrame.toLowerCase()}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch data (status ${response.status})`);
        }
        
        result = await response.json();
      }
      
      console.log(`CHART: Got data:`, result);
      
      if (!result.prices || !Array.isArray(result.prices) || result.prices.length === 0) {
        setChartData([]);
        setIsLoading(false);
        return;
      }
      
      // Format data for chart
      let formattedData = [];
      
      // If prices are objects with date and price
      if (typeof result.prices[0] === 'object' && 'date' in result.prices[0] && 'price' in result.prices[0]) {
        formattedData = result.prices.map((item: any) => ({
          date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          price: typeof item.price === 'number' ? item.price : parseFloat(item.price)
        }));
      } 
      // If prices are numbers and we have separate dates array
      else if (typeof result.prices[0] === 'number' && result.dates) {
        formattedData = result.prices.map((price: number, index: number) => ({
          date: new Date(result.dates[index]).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          price: price
        }));
      }
      
      console.log(`CHART: Formatted ${formattedData.length} data points`);
      setChartData(formattedData);
      setSource(result.source || 'Market Data');
      setIsLoading(false);
    } catch (err) {
      console.error('Error fetching price history:', err);
      setError(err instanceof Error ? err.message : 'Failed to load price data');
      setIsLoading(false);
    }
  };
  
  // Initial fetch and when dependencies change
  useEffect(() => {
    fetchData();
  }, [symbol, timeFrame]);
  
  // Calculate price change
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
  
  // Loading state
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Loading Price History...</h2>
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
          <p className="text-sm text-gray-500 mt-2">{error}</p>
        </div>
      </div>
    );
  }
  
  // No data state
  if (chartData.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Price History</h2>
        </div>
        <div className="p-8 text-center text-gray-600">
          <p>No price history available for {symbol}</p>
        </div>
      </div>
    );
  }
  
  // Current price (latest data point)
  const currentPrice = chartData[chartData.length - 1].price;
  
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold">Price History</h2>
          
          {/* Time frame selector */}
          <div className="flex space-x-1 items-center">
            {/* Refresh button */}
            <button
              onClick={fetchData}
              className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full"
              title="Refresh chart data"
            >
              <RefreshCw size={16} />
            </button>
            
            {/* Time periods */}
            <div className="flex flex-wrap justify-end space-x-1">
              {['1D', '5D', '1W', '1M', '3M', '6M', '1Y'].map((period) => (
                <button
                  key={period}
                  onClick={() => setTimeFrame(period)}
                  className={`text-xs px-2 py-1 rounded-md ${
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
          <span>Source: {source}</span>
        </div>
      </div>
    </div>
  );
}