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
import { RefreshCw } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button'; // Import Button for retry

// Interface for the data points used by the chart
interface ChartDataPoint {
  date: string; // Formatted date string for display
  price: number;
}

// Interface for the API response from the new endpoint
interface PriceHistoryApiResponse {
  ticker: string;
  period: string;
  data: {
    dates: string[]; // Array of date strings (e.g., "2024-07-10")
    prices: number[]; // Array of corresponding prices
  };
  source: string;
  last_updated: string;
}

// Supported time periods
type TimeFrame = '1D' | '5D' | '1W' | '1M' | '3M' | '6M' | '1Y' | '5Y' | 'MAX'; // Added MAX

interface StockChartProps {
  symbol: string;
}

export default function StockChart({ symbol }: StockChartProps) {
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('1M'); // Default to 1 Month

  // Fetch price history using the NEW endpoint: /api/stock/:ticker/period/:period
  const { data: apiResponse, isLoading, error, refetch, isFetching } = useQuery<PriceHistoryApiResponse, Error>({
    // Key structure: [endpoint_base, ticker, 'period', period_value]
    queryKey: ['/api/stock', symbol, 'period', timeFrame],
    queryFn: async () => {
      if (!symbol) {
        console.warn('Cannot fetch history: Symbol is undefined', 'StockChart'); // Use console.warn
        throw new Error('Stock symbol is missing');
      }
      const endpoint = `/api/stock/${symbol}/period/${timeFrame}`;
      console.log(`Fetching history from NEW endpoint: ${endpoint}`, 'StockChart'); // Use console.log

      const response = await fetch(endpoint);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error(`Error fetching history: ${response.status} ${response.statusText}`, 'StockChart', errorData); // Use console.error
        throw new Error(errorData.message || `Failed to fetch price history for ${symbol} (${timeFrame})`);
      }
      const result = await response.json();
      console.log(`Received data from NEW endpoint for ${symbol} (${timeFrame}):`, 'StockChart', { source: result.source, points: result.data?.prices?.length }); // Use console.log
      return result;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    enabled: !!symbol, // Only run when symbol is available
    refetchOnWindowFocus: false, // Avoid unnecessary refetches
  });

  // Memoized function to format data for Recharts
  const chartData = useMemo(() => {
    if (!apiResponse?.data?.dates || !apiResponse?.data?.prices) {
      console.warn('No dates or prices found in API response', 'StockChart'); // Use console.warn
      return [];
    }

    const { dates, prices } = apiResponse.data;

    if (dates.length !== prices.length) {
      console.warn(`Data mismatch: ${dates.length} dates, ${prices.length} prices`, 'StockChart'); // Use console.warn
      return [];
    }

    // Combine dates and prices into the format Recharts expects
    const formattedData = dates.map((dateStr, index) => {
      // Format date for display on X-axis
      let displayDate: string;
      try {
        const dateObj = new Date(dateStr);
         // Adjust formatting based on timeframe for clarity
         if (timeFrame === '1D' || timeFrame === '5D' || timeFrame === '1W') {
            displayDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); // e.g., Jul 10
         } else if (timeFrame === '1M' || timeFrame === '3M' || timeFrame === '6M') {
            displayDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); // e.g., Jul 10
         } else if (timeFrame === '1Y') {
            displayDate = dateObj.toLocaleDateString('en-US', { month: 'short' }); // e.g., Jul
         } else { // 5Y, MAX
            displayDate = dateObj.toLocaleDateString('en-US', { year: 'numeric' }); // e.g., 2024
         }
      } catch (e) {
         console.error(`Error parsing date: ${dateStr}`, 'StockChart', e); // Use console.error
         displayDate = dateStr; // Fallback to original string
      }

      return {
        date: displayDate,
        price: Number(prices[index]) || 0 // Ensure price is a number
      };
    });

    console.log(`Formatted ${formattedData.length} data points for chart`, 'StockChart'); // Use console.log
    return formattedData;

  }, [apiResponse, timeFrame]); // Depend on apiResponse and timeFrame

  // Calculate price change based on the *formatted* chartData
  const { change, percentage } = useMemo(() => {
    if (!chartData || chartData.length < 2) {
      return { change: 0, percentage: 0 };
    }
    const firstPrice = chartData[0].price;
    const lastPrice = chartData[chartData.length - 1].price;

    // Ensure prices are valid numbers before calculating
    if (isNaN(firstPrice) || isNaN(lastPrice) || firstPrice === 0) {
        return { change: 0, percentage: 0 };
    }

    const changeValue = lastPrice - firstPrice;
    const percentageValue = (changeValue / firstPrice) * 100;

    return {
      change: +changeValue.toFixed(2),
      percentage: +percentageValue.toFixed(2)
    };
  }, [chartData]); // Depend only on chartData

  const isPositiveChange = change >= 0;

  // Format currency
  const formatPrice = (value: number) => {
    if (isNaN(value)) return '$--.--';
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
            {error.message || "An error occurred while fetching stock history"}
          </p>
           <Button onClick={() => refetch()} variant="outline" size="sm" className="mt-4">
             Retry
           </Button>
        </div>
      </div>
    );
  }

  // No data state
  if (!chartData || chartData.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Price History</h2>
        </div>
        <div className="p-8 text-center text-gray-600">
          <p>No historical data available for {symbol} ({timeFrame})</p>
          <p className="text-sm text-gray-500 mt-2">
             Data source: {apiResponse?.source || 'Unknown'}
          </p>
           <Button onClick={() => refetch()} variant="outline" size="sm" className="mt-4">
             Retry
           </Button>
        </div>
      </div>
    );
  }

  // The last price point is the current price shown in the header
  const currentPrice = chartData[chartData.length - 1]?.price ?? 0;

  // Determine min/max for Y-axis domain
  const prices = chartData.map(p => p.price);
  const yMin = Math.min(...prices);
  const yMax = Math.max(...prices);
  // Add padding to the domain
  const yDomainPadding = (yMax - yMin) * 0.1; // 10% padding
  const yDomain = [
      Math.max(0, yMin - yDomainPadding), // Ensure min is not negative
      yMax + yDomainPadding
  ];


  // Chart component with data
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold">Price History ({timeFrame})</h2>

          {/* Time frame selector */}
          <div className="flex space-x-1 items-center">
            {/* Refresh button */}
            <button
              onClick={() => refetch()}
              className={`p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full ${isFetching ? 'animate-spin' : ''}`}
              title="Refresh chart data"
              disabled={isFetching}
            >
              <RefreshCw size={16} />
            </button>

            {/* Available time periods - fixed set */}
            <div className="flex flex-wrap justify-end space-x-1">
              {['1D', '5D', '1W', '1M', '3M', '6M', '1Y', '5Y', 'MAX'].map((tf) => (
                <button
                  key={tf}
                  onClick={() => setTimeFrame(tf as TimeFrame)}
                  className={`text-xs px-2 py-1 rounded-md transition-colors duration-150 ${
                    timeFrame === tf
                      ? 'bg-blue-600 text-white font-medium shadow-sm'
                      : 'text-gray-500 hover:bg-gray-100'
                  }`}
                  disabled={isFetching} // Disable while fetching
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
          <span className="text-xs text-gray-500 ml-2">
              (Change over {timeFrame})
          </span>
        </div>
      </div>

      {/* Chart */}
      <div className="p-4 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 5, right: 5, left: -25, bottom: 5 }} // Adjusted left margin for Y-axis ticks
          >
            <defs>
              <linearGradient id="chartGradientPositive" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="chartGradientNegative" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" opacity={0.5} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: '#6b7280' }} // Smaller font size, gray color
              tickLine={false}
              axisLine={{ stroke: '#e5e7eb' }}
              tickMargin={8}
              minTickGap={20} // Adjust gap between ticks
            />
            <YAxis
              tickFormatter={formatPrice}
              tick={{ fontSize: 10, fill: '#6b7280' }} // Smaller font size, gray color
              tickLine={false}
              axisLine={false}
              tickMargin={5}
              domain={yDomain} // Use calculated domain with padding
              allowDataOverflow={false} // Prevent line going outside bounds
              width={35} // Explicit width for Y-axis
            />
            <Tooltip
              formatter={(value: number) => [formatPrice(value), 'Price']}
              labelFormatter={(label) => `Date: ${label}`} // Use the formatted date label
              contentStyle={{
                borderRadius: '6px',
                border: '1px solid #e5e7eb',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
                fontSize: '12px',
                padding: '6px 10px'
              }}
              itemStyle={{ color: '#374151' }}
              labelStyle={{ color: '#6b7280', marginBottom: '4px' }}
            />
            <Area
              type="monotone"
              dataKey="price"
              stroke={isPositiveChange ? "#10B981" : "#EF4444"}
              strokeWidth={2}
              fillOpacity={1}
              fill={isPositiveChange ? "url(#chartGradientPositive)" : "url(#chartGradientNegative)"}
              connectNulls={true} // Connect gaps if any data points are missing
              isAnimationActive={false} // Disable default animation for smoother updates
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Source attribution */}
      <div className="px-4 pb-4 text-right text-xs text-gray-500">
        <div className="flex items-center justify-end">
          <span>Source: {apiResponse?.source || 'Replit Financial'}</span>
          <span className="mx-2">•</span>
          <span>Last Updated: {apiResponse?.last_updated ? new Date(apiResponse.last_updated).toLocaleTimeString() : 'N/A'}</span>
        </div>
      </div>
    </div>
  );
}
