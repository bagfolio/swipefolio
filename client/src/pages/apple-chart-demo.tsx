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

// Sample Apple stock data for demonstration
const demoData = [
  {"date":"2024-04-01","price":217.1},
  {"date":"2024-03-31","price":216.32},
  {"date":"2024-03-30","price":216.32},
  {"date":"2024-03-29","price":216.32},
  {"date":"2024-03-28","price":215.52},
  {"date":"2024-03-27","price":215.88},
  {"date":"2024-03-26","price":216.32},
  {"date":"2024-03-25","price":216.95},
  {"date":"2024-03-24","price":217.45},
  {"date":"2024-03-23","price":217.45},
  {"date":"2024-03-22","price":217.45},
  {"date":"2024-03-21","price":218.12},
  {"date":"2024-03-20","price":216.8},
  {"date":"2024-03-19","price":215.32},
  {"date":"2024-03-18","price":214.2},
  {"date":"2024-03-17","price":213.02},
  {"date":"2024-03-16","price":213.02},
  {"date":"2024-03-15","price":213.02},
  {"date":"2024-03-14","price":213.95},
  {"date":"2024-03-13","price":214.82},
  {"date":"2024-03-12","price":215.32},
  {"date":"2024-03-11","price":215.88},
  {"date":"2024-03-10","price":216.45},
  {"date":"2024-03-09","price":216.45},
  {"date":"2024-03-08","price":216.45},
  {"date":"2024-03-07","price":214.92},
  {"date":"2024-03-06","price":214.1},
  {"date":"2024-03-05","price":213.8},
  {"date":"2024-03-04","price":214.72},
  {"date":"2024-03-03","price":215.01}
];

export default function AppleChartDemo() {
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    // Format the data for the chart (with formatted dates)
    const formattedData = demoData.map(item => ({
      date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      price: item.price
    }));
    
    // Reverse to show oldest to newest
    setChartData(formattedData.reverse());
  }, []);
  
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
  
  // If still loading initial data
  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-700">Loading Apple stock data...</p>
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
              
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">1 Month View</span>
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
              <span>Data source: Replit Financial Service</span>
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