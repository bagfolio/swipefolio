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
type TimeFrame = '1D' | '5D' | '1W' | '1M' | '3M' | '6M' | '1Y' | '5Y' | 'MAX';

interface StockChartProps {
  symbol: string;
}

export default function StockChart({ symbol }: StockChartProps) {
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('1M'); // Default to 1 Month

  // Fetch price history using the NEW endpoint: /api/stock/:ticker/period/:period
  const { data: apiResponse, isLoading, error, refetch, isFetching, isError } = useQuery<PriceHistoryApiResponse, Error>({
    // ** CRITICAL: Ensure the queryKey matches the API endpoint structure **
    queryKey: ['/api/stock', symbol, 'period', timeFrame], // Correct key structure
    queryFn: async ({ queryKey }) => {
      // Destructure key for clarity
      const [_base, ticker, _periodStr, period] = queryKey as [string, string, string, string];

      if (!ticker) {
        console.warn('StockChart: Cannot fetch history: Symbol is undefined');
        throw new Error('Stock symbol is missing');
      }
      // ** CRITICAL: Use the correct endpoint format **
      const endpoint = `/api/stock/${ticker}/period/${period}`;
      console.log(`StockChart: Fetching history from NEW endpoint: ${endpoint}`);

      const response = await fetch(endpoint);

      if (!response.ok) {
        let errorData: any = { message: `HTTP error! status: ${response.status}` };
        try {
          errorData = await response.json();
        } catch (e) {
          // Ignore if response body is not JSON
        }
        console.error(`StockChart: Error fetching history: ${response.status} ${response.statusText}`, errorData);
        throw new Error(errorData.message || `Failed to fetch price history for ${ticker} (${period})`);
      }
      const result = await response.json();
      console.log(`StockChart: Received data from NEW endpoint for ${ticker} (${period}):`, { source: result.source, points: result.data?.prices?.length });

      // ** CRITICAL: Validate the structure of the received data **
      if (!result || !result.data || !Array.isArray(result.data.dates) || !Array.isArray(result.data.prices)) {
        console.error('StockChart: Invalid data structure received from API:', result);
        throw new Error('Invalid data structure received from API');
      }
      if (result.data.dates.length !== result.data.prices.length) {
        console.error(`StockChart: Data length mismatch - Dates: ${result.data.dates.length}, Prices: ${result.data.prices.length}`);
        throw new Error('API returned mismatched dates and prices arrays');
      }

      return result;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    enabled: !!symbol, // Only run when symbol is available
    refetchOnWindowFocus: false, // Avoid unnecessary refetches
    retry: 1, // Retry once on failure
  });

  // Memoized function to format data for Recharts
  const chartData = useMemo(() => {
    if (isLoading || isError || !apiResponse?.data?.dates || !apiResponse?.data?.prices) {
      console.log('StockChart: No valid API response data to format.', { isLoading, isError, apiResponse });
      return [];
    }

    const { dates, prices } = apiResponse.data;

    // Combine dates and prices into the format Recharts expects
    const formattedData = dates.map((dateStr, index) => {
      let displayDate: string;
      try {
        const dateObj = new Date(dateStr);
        // Ensure date is valid before formatting
        if (isNaN(dateObj.getTime())) {
            throw new Error('Invalid Date');
        }
         // Adjust formatting based on timeframe for clarity
         if (timeFrame === '1D') {
             displayDate = dateObj.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }); // e.g., 10:30 AM
         } else if (timeFrame === '5D' || timeFrame === '1W') {
            displayDate = dateObj.toLocaleDateString('en-US', { weekday: 'short' }); // e.g., Mon
         } else if (timeFrame === '1M' || timeFrame === '3M' || timeFrame === '6M') {
            displayDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); // e.g., Jul 10
         } else if (timeFrame === '1Y') {
            displayDate = dateObj.toLocaleDateString('en-US', { month: 'short' }); // e.g., Jul
         } else { // 5Y, MAX
            displayDate = dateObj.toLocaleDateString('en-US', { year: '2-digit' }); // e.g., '24
         }
      } catch (e) {
         console.error(`StockChart: Error parsing date: ${dateStr}`, e);
         displayDate = 'Invalid Date'; // Indicate error
      }

      // Ensure price is a valid number, default to 0 if not
      const priceValue = Number(prices[index]);

      return {
        date: displayDate,
        price: isNaN(priceValue) ? 0 : priceValue
      };
    }).filter(dp => dp.date !== 'Invalid Date'); // Filter out points with invalid dates

    console.log(`StockChart: Formatted ${formattedData.length} valid data points for chart`, formattedData.slice(0, 5)); // Log first few points
    return formattedData;

  }, [apiResponse, timeFrame, isLoading, isError]); // Added isLoading/isError dependency

  // Calculate price change based on the *formatted* chartData
  const { change, percentage } = useMemo(() => {
    if (!chartData || chartData.length < 2) {
      return { change: 0, percentage: 0 };
    }
    const firstPrice = chartData[0].price;
    const lastPrice = chartData[chartData.length - 1].price;

    if (isNaN(firstPrice) || isNaN(lastPrice) || firstPrice === 0) {
        return { change: 0, percentage: 0 };
    }
    const changeValue = lastPrice - firstPrice;
    const percentageValue = (changeValue / firstPrice) * 100;
    return {
      change: +changeValue.toFixed(2),
      percentage: +percentageValue.toFixed(2)
    };
  }, [chartData]);

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
          {/* Placeholder for header */}
          <Skeleton className="h-7 w-32 mb-2" />
          <Skeleton className="h-8 w-28" />
        </div>
        {/* Placeholder for chart area */}
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Price History Error</h2>
        </div>
        <div className="p-8 text-center text-red-600">
          <p>Failed to load chart data for {symbol} ({timeFrame})</p>
          <p className="text-sm text-gray-500 mt-2">
            {error?.message || "An error occurred."}
          </p>
           <Button onClick={() => refetch()} variant="outline" size="sm" className="mt-4">
             Retry
           </Button>
        </div>
      </div>
    );
  }

  // No data state (after successful fetch but empty/invalid data)
  if (!chartData || chartData.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Price History</h2>
        </div>
        <div className="p-8 text-center text-gray-600">
          <p>No valid historical data available for {symbol} ({timeFrame})</p>
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
  const yDomainPadding = (yMax - yMin) * 0.1 || 1; // Add padding, ensure it's at least 1 if min/max are same
  const yDomain = [
      Math.max(0, yMin - yDomainPadding),
      yMax + yDomainPadding
  ];

  // Chart component with data
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold">Price History ({timeFrame})</h2>
          <div className="flex space-x-1 items-center">
            <button
              onClick={() => refetch()}
              className={`p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full ${isFetching ? 'animate-spin' : ''}`}
              title="Refresh chart data"
              disabled={isFetching}
            >
              <RefreshCw size={16} />
            </button>
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
                  disabled={isFetching}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>
        </div>
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
      <div className="p-4 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 5, right: 5, left: -25, bottom: 5 }}
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
              tick={{ fontSize: 10, fill: '#6b7280' }}
              tickLine={false}
              axisLine={{ stroke: '#e5e7eb' }}
              tickMargin={8}
              minTickGap={20} // Adjust gap
              // Dynamically adjust interval based on data length and timeframe
              interval={chartData.length > 50 && (timeFrame === '5Y' || timeFrame === 'MAX') ? Math.floor(chartData.length / 6) : 'preserveStartEnd'}
            />
            <YAxis
              tickFormatter={formatPrice}
              tick={{ fontSize: 10, fill: '#6b7280' }}
              tickLine={false}
              axisLine={false}
              tickMargin={5}
              domain={yDomain} // Use calculated domain
              allowDataOverflow={false}
              width={35}
            />
            <Tooltip
              formatter={(value: number) => [formatPrice(value), 'Price']}
              labelFormatter={(label) => `Date: ${label}`}
              contentStyle={{
                borderRadius: '6px', border: '1px solid #e5e7eb',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
                fontSize: '12px', padding: '6px 10px'
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
              connectNulls={true}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
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
