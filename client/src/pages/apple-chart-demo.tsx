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

// Define types for chart data
interface ChartDataPoint {
  date: string;
  price: number;
}

// API response interfaces
interface PriceResponse {
  symbol: string;
  period: string;
  interval: string;
  prices: any[];
  dates?: string[];
  source: string;
}

export default function AppleChartDemo() {
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeFrame, setTimeFrame] = useState('1M');
  
  // Fetch data from API
  useEffect(() => {
    async function fetchAppleStockData() {
      setIsLoading(true);
      setError(null);
      
      try {
        console.log('Fetching Apple stock data from API...');
        
        // Make the API call
        const response = await fetch(`/api/historical/AAPL?period=${timeFrame.toLowerCase()}`);
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
        
        const data: PriceResponse = await response.json();
        console.log('Received API data:', data);
        
        if (!data || !data.prices || !Array.isArray(data.prices) || data.prices.length === 0) {
          setChartData([]);
          setIsLoading(false);
          return;
        }
        
        // Process the data based on its format
        let formattedData: ChartDataPoint[] = [];
        
        if (typeof data.prices[0] === 'object' && 'date' in data.prices[0] && 'price' in data.prices[0]) {
          // Already in the right format with date/price objects
          formattedData = data.prices.map((item: any) => ({
            date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            price: typeof item.price === 'number' ? item.price : parseFloat(item.price)
          }));
        } else if (typeof data.prices[0] === 'number' && data.dates && Array.isArray(data.dates)) {
          // Separate arrays for dates and prices
          formattedData = data.prices.map((price: number, index: number) => ({
            date: new Date(data.dates![index]).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            price: price
          }));
        }
        
        console.log(`Processed ${formattedData.length} data points`);
        
        // Sort from oldest to newest (if needed)
        // formattedData.reverse();
        
        setChartData(formattedData);
      } catch (err) {
        console.error('Error fetching Apple stock data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load stock data');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchAppleStockData();
  }, [timeFrame]);
  
  // Calculate price change
  const calculateChange = () => {
    if (chartData.length < 2) return { change: 0, percentage: 0 };
    
    const firstPrice = chartData[0]?.price || 0;
    const lastPrice = chartData[chartData.length - 1]?.price || 0;
    
    return {
      change: +(lastPrice - firstPrice).toFixed(2),
      percentage: +((lastPrice - firstPrice) / firstPrice * 100).toFixed(2)
    };
  };
  
  const { change, percentage } = calculateChange();
  const isPositiveChange = change >= 0;
  
  // Format currency
  const formatPrice = (value: number): string => {
    return `$${value.toFixed(2)}`;
  };
  
  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-700">Loading Apple stock data from API...</p>
        </div>
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center max-w-lg mx-auto">
          <div className="bg-red-100 border border-red-300 text-red-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-2">Error Loading Data</h2>
            <p className="mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  // Empty data state
  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center max-w-lg mx-auto">
          <div className="bg-yellow-100 border border-yellow-300 text-yellow-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-2">No Data Available</h2>
            <p className="mb-4">No stock price history is available for AAPL.</p>
            <button 
              onClick={() => window.location.reload()}
              className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  // Current price (latest data point)
  const currentPrice = chartData[chartData.length - 1].price;
  
  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Apple Inc. (AAPL) Price History</h1>
          <p className="text-gray-600">Last 30 days of closing prices</p>
        </div>
        
        {/* Chart Card */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold">Stock Price Chart</h2>
              
              <div className="flex items-center">
                {/* Time period selectors */}
                <div className="flex space-x-1">
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
          <div className="p-4 h-96">
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
              <span>Data source: PostgreSQL</span>
            </div>
          </div>
        </div>
        
        {/* Price Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">AAPL Price History Data</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {chartData.map((item, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-900">{item.date}</td>
                    <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-900">{formatPrice(item.price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}