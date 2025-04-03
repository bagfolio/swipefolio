import React, { useState, useEffect, useMemo } from 'react';
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
import { CalendarIcon, ChevronDown } from 'lucide-react';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

// Define types for Yahoo Finance data
interface YahooChartQuote {
  date: string;
  high: number;
  low: number;
  open: number;
  close: number;
  volume: number;
  adjclose: number;
}

interface YahooChartResponse {
  meta: {
    currency: string;
    symbol: string;
    regularMarketPrice: number;
    chartPreviousClose: number;
    previousClose: number;
    dataGranularity: string;
    range: string;
  };
  quotes: YahooChartQuote[];
}

// Type for our chart data format 
interface ChartDataItem {
  Date: string;
  Open: number;
  High: number;
  Low: number;
  Close: number;
  Volume: number;
}

type TimeFrame = '1W' | '1M' | '3M' | '6M' | '1Y' | '5Y' | 'MAX';

// Map TimeFrame to Yahoo Finance range parameter
const timeFrameToRange: Record<TimeFrame, string> = {
  '1W': '5d',   // Yahoo has 5d not 7d
  '1M': '1mo',
  '3M': '3mo',
  '6M': '6mo',
  '1Y': '1y',
  '5Y': '5y',
  'MAX': 'max'
};

interface StockChartProps {
  symbol: string;
}

export default function StockChart({ symbol }: StockChartProps) {
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('3M');
  
  // Fetch stock chart data from Yahoo Finance API
  const { data, isLoading, error } = useQuery<YahooChartResponse>({
    queryKey: ['/api/yahoo-finance/chart', symbol, timeFrameToRange[timeFrame]],
    queryFn: async () => {
      const response = await fetch(`/api/yahoo-finance/chart/${symbol}?interval=1d&range=${timeFrameToRange[timeFrame]}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `Failed to fetch chart data for ${symbol}`
        );
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  // Process Yahoo Finance data into our chart format
  const chartData = useMemo(() => {
    if (!data?.quotes || data.quotes.length === 0) {
      return [];
    }
    
    return data.quotes.map(quote => ({
      Date: new Date(quote.date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
      Open: quote.open,
      High: quote.high,
      Low: quote.low,
      Close: quote.close,
      Volume: quote.volume
    }));
  }, [data]);
  
  // Calculate price change and percentage
  const calculateChange = () => {
    if (chartData.length < 2) {
      // If we have market data but not enough chart points, use meta info
      if (data?.meta) {
        const lastPrice = data.meta.regularMarketPrice;
        const previousClose = data.meta.previousClose || data.meta.chartPreviousClose;
        const change = +(lastPrice - previousClose).toFixed(2);
        const percentage = +((change / previousClose) * 100).toFixed(2);
        return { change, percentage };
      }
      return { change: 0, percentage: 0 };
    }
    
    const firstClose = chartData[0].Close;
    const lastClose = chartData[chartData.length - 1].Close;
    
    return {
      change: +(lastClose - firstClose).toFixed(2),
      percentage: +((lastClose - firstClose) / firstClose * 100).toFixed(2)
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
          <div className="flex space-x-2">
            {['1W', '1M', '3M', '6M', '1Y', '5Y', 'MAX'].map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeFrame(tf as TimeFrame)}
                className={`text-sm px-2 py-1 rounded-md ${
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
        
        {/* Current price and change */}
        <div className="flex items-center">
          <span className="text-2xl font-semibold mr-2">
            {formatPrice(chartData[chartData.length - 1].Close)}
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
              dataKey="Date" 
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
              dataKey="Close" 
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
        Source: Yahoo Finance
      </div>
    </div>
  );
}