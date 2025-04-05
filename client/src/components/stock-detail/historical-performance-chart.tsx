import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useYahooChartData, useSP500ChartData, timeFrameToRange } from '@/lib/yahoo-finance-client';
import { Area, AreaChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Line, LineChart, Bar, BarChart } from 'recharts';
import { ChevronDown, Calendar, BarChart as BarChartIcon, LineChart as LineChartIcon, TrendingUp, DollarSign } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

// Helper to combine stock data with S&P 500 data
const combineChartData = (stockData: any[] = [], sp500Data: any = null) => {
  if (!stockData.length || !sp500Data?.quotes) return stockData;
  
  // Map to convert date string to timestamp for easier comparison
  const sp500DateMap = new Map();
  sp500Data.quotes.forEach((quote: any) => {
    const date = new Date(quote.date);
    sp500DateMap.set(date.getTime(), quote.close);
  });
  
  // Combine data with normalized values for fair comparison
  return stockData.map((point) => {
    const timestamp = new Date(point.rawDate).getTime();
    const sp500Value = sp500DateMap.get(timestamp);
    
    return {
      ...point,
      sp500: sp500Value
    };
  });
};

// Sample dividend data
const getDividendData = (symbol: string) => {
  // This would normally come from an API
  return [
    { date: 'Jan 2024', amount: 0.85, yield: "1.2%" },
    { date: 'Apr 2024', amount: 0.87, yield: "1.25%" },
    { date: 'Jul 2023', amount: 0.85, yield: "1.2%" },
    { date: 'Oct 2023', amount: 0.85, yield: "1.1%" },
    { date: 'Jul 2023', amount: 0.82, yield: "1.1%" },
    { date: 'Apr 2023', amount: 0.80, yield: "1.0%" },
    { date: 'Jan 2023', amount: 0.78, yield: "1.0%" },
  ];
};

// Sample earnings data
const getEarningsData = (symbol: string) => {
  // This would normally come from an API
  return [
    { quarter: 'Q1 2024', actual: 2.35, estimated: 2.28, surprise: "+3.1%" },
    { quarter: 'Q4 2023', actual: 2.18, estimated: 2.10, surprise: "+3.8%" },
    { quarter: 'Q3 2023', actual: 2.06, estimated: 2.12, surprise: "-2.8%" },
    { quarter: 'Q2 2023', actual: 1.98, estimated: 1.95, surprise: "+1.5%" },
    { quarter: 'Q1 2023', actual: 1.89, estimated: 1.79, surprise: "+5.6%" },
    { quarter: 'Q4 2022', actual: 1.76, estimated: 1.80, surprise: "-2.2%" },
    { quarter: 'Q3 2022', actual: 1.68, estimated: 1.65, surprise: "+1.8%" },
  ];
};

// Monthly return calculation
const calculateMonthlyReturns = (stockData: any[]) => {
  if (stockData.length < 2) return [];
  
  const monthlyData: any[] = [];
  let previousMonthValue = stockData[0].value;
  let currentMonth = new Date(stockData[0].date).getMonth();
  
  stockData.forEach((point, index) => {
    const pointDate = new Date(point.date);
    const pointMonth = pointDate.getMonth();
    
    if (pointMonth !== currentMonth || index === stockData.length - 1) {
      // Calculate return for the previous month
      const monthReturn = ((point.value - previousMonthValue) / previousMonthValue) * 100;
      
      monthlyData.push({
        date: new Date(pointDate.getFullYear(), currentMonth, 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        return: monthReturn.toFixed(2),
        positive: monthReturn >= 0
      });
      
      // Reset for the new month
      previousMonthValue = point.value;
      currentMonth = pointMonth;
    }
  });
  
  return monthlyData;
};

interface HistoricalPerformanceChartProps {
  symbol: string;
  companyName?: string;
}

// Define chart data types for type safety
interface ProcessedDataPoint {
  date: string;
  rawDate: string;
  value: string; // percentage return
  originalValue: number; // actual price
  timestamp: number;
}

interface CombinedDataPoint extends ProcessedDataPoint {
  sp500?: string; // S&P 500 percentage return
}

interface PercentageReturnPoint {
  date: string;
  stockReturn: string;
  benchmarkReturn?: string;
}

const HistoricalPerformanceChart: React.FC<HistoricalPerformanceChartProps> = ({ 
  symbol,
  companyName
}) => {
  const [timeFrame, setTimeFrame] = useState('1Y');
  const [showMonthlyReturns, setShowMonthlyReturns] = useState(false);
  const [activeDataTab, setActiveDataTab] = useState('main');
  // S&P 500 comparison is always shown by default
  const showBenchmarks = true;
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');
  
  // Fetch stock chart data
  const { 
    data: chartData, 
    isLoading: stockLoading, 
    error: stockError 
  } = useYahooChartData(symbol, timeFrame);
  
  // Fetch S&P 500 data
  const {
    data: sp500Data,
    isLoading: sp500Loading,
    error: sp500Error
  } = useSP500ChartData(timeFrame);
  
  const isLoading = stockLoading || sp500Loading;
  const error = stockError || sp500Error;
  
  // Process chart data for display
  const processedData: ProcessedDataPoint[] = useMemo(() => {
    if (!chartData?.quotes || chartData.quotes.length === 0) {
      return [];
    }
    
    // Get initial price for calculating returns
    const initialStockPrice = chartData.quotes[0].close;
    
    return chartData.quotes.map(quote => {
      // Calculate % return from starting point
      const stockReturn = ((quote.close - initialStockPrice) / initialStockPrice) * 100;
      
      return {
        date: new Date(quote.date).toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric',
          year: timeFrame === '1Y' || timeFrame === '5Y' || timeFrame === 'MAX' ? 'numeric' : undefined
        }),
        rawDate: quote.date,
        value: stockReturn.toFixed(2), // Store as % return
        originalValue: quote.close,  // Keep original price for reference
        timestamp: new Date(quote.date).getTime()
      };
    });
  }, [chartData, timeFrame]);
  
  // Process and combine with S&P 500 data
  const combinedData: CombinedDataPoint[] = useMemo(() => {
    if (!sp500Data?.quotes || sp500Data.quotes.length === 0 || !processedData.length) {
      return processedData;
    }
    
    // Get initial price for calculating returns
    const initialSP500Price = sp500Data.quotes[0].close;
    
    // Create a map for easier matching by date
    const sp500ReturnsByDate = new Map();
    
    sp500Data.quotes.forEach(quote => {
      const date = new Date(quote.date);
      const spReturn = ((quote.close - initialSP500Price) / initialSP500Price) * 100;
      sp500ReturnsByDate.set(date.getTime(), spReturn.toFixed(2));
    });
    
    // Combine the data
    return processedData.map(point => {
      const timestamp = new Date(point.rawDate).getTime();
      const sp500Return = sp500ReturnsByDate.get(timestamp);
      
      return {
        ...point,
        sp500: sp500Return
      };
    });
  }, [processedData, sp500Data]);
  
  // Create data specifically for bar chart view comparison  
  const percentageReturnData: PercentageReturnPoint[] = useMemo(() => {
    if (!combinedData.length) return [];
    
    // Filter out incomplete data points and create bar chart data
    return combinedData
      .filter(point => {
        return point && (!showBenchmarks || point.sp500 !== undefined);
      })
      .map(point => {
        return {
          date: point.date,
          stockReturn: point.value, // Already percentage from processedData
          benchmarkReturn: point.sp500, // Already percentage from sp500ReturnsByDate
        };
      });
  }, [combinedData, showBenchmarks]);
  
  // Calculate monthly returns
  const monthlyReturnsData = useMemo(() => {
    return calculateMonthlyReturns(processedData);
  }, [processedData]);
  
  // Get dividend data
  const dividendData = useMemo(() => {
    return getDividendData(symbol);
  }, [symbol]);
  
  // Get earnings data
  const earningsData = useMemo(() => {
    return getEarningsData(symbol);
  }, [symbol]);
  
  // Format tooltip values with null safety
  const formatTooltipValue = (value: number | string | null | undefined) => {
    if (value === null || value === undefined) return 'N/A';
    
    // Parse string values to numbers if needed
    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      return isNaN(parsed) ? value : parsed.toFixed(2);
    }
    
    return value.toFixed(2);
  };
  
  // Set up chart colors
  const stockColor = '#2563eb'; // blue-600
  const sp500Color = '#10b981'; // emerald-500
  const gradientStartColor = 'rgba(37, 99, 235, 0.2)'; // blue-600 with alpha
  const gradientEndColor = 'rgba(37, 99, 235, 0)'; // transparent
  
  // Handle timeframe change
  const handleTimeFrameChange = (newTimeFrame: string) => {
    setTimeFrame(newTimeFrame);
  };
  
  // Custom tooltip component for line chart (percentage return view)
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded-md shadow-md text-xs">
          <p className="font-semibold text-gray-800">{label}</p>
          <div className="mt-1">
            <p className="flex items-center">
              <span className="w-3 h-3 inline-block bg-blue-600 rounded-full mr-2"></span>
              <span className="text-gray-700">{companyName || symbol}: </span>
              <span className="ml-1 font-medium">
                {formatTooltipValue(payload[0]?.value)}%
              </span>
            </p>
            {showBenchmarks && payload[1] && (
              <p className="flex items-center mt-1">
                <span className="w-3 h-3 inline-block bg-emerald-500 rounded-full mr-2"></span>
                <span className="text-gray-700">S&P 500: </span>
                <span className="ml-1 font-medium">
                  {formatTooltipValue(payload[1]?.value)}%
                </span>
              </p>
            )}
          </div>
        </div>
      );
    }
    return null;
  };
  
  // Custom tooltip component for bar chart (comparison view)
  const ComparisonTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded-md shadow-md text-xs">
          <p className="font-semibold text-gray-800">{label}</p>
          <div className="mt-1">
            {payload.map((entry: any, index: number) => (
              <p 
                key={`tooltip-${index}`} 
                className="flex items-center mt-1"
              >
                <span 
                  className={`w-3 h-3 inline-block rounded-full mr-2 ${
                    entry.name === 'stock' ? 'bg-blue-600' : 'bg-emerald-500'
                  }`}
                />
                <span className="text-gray-700">
                  {entry.name === 'stock' ? companyName || symbol : 'S&P 500'}:
                </span>
                <span className={`ml-1 font-medium ${
                  parseFloat(entry.value) >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {parseFloat(entry.value) >= 0 ? '+' : ''}{formatTooltipValue(entry.value)}%
                </span>
              </p>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };
  
  // Monthly returns tooltip with null safety
  const MonthlyReturnsTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length && payload[0]?.value !== undefined) {
      const returnValue = parseFloat(payload[0].value);
      return (
        <div className="bg-white p-3 border rounded-md shadow-md text-xs">
          <p className="font-semibold text-gray-800">{label || 'N/A'}</p>
          <p className={cn(
            "flex items-center mt-1 font-medium",
            returnValue >= 0 ? "text-green-600" : "text-red-600"
          )}>
            {returnValue >= 0 ? "+" : ""}{returnValue}%
          </p>
        </div>
      );
    }
    return null;
  };
  
  return (
    <Card className="w-full my-4 overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Historical Performance</h3>
          
          {/* Tab navigation for different views */}
          <Tabs
            value={activeDataTab}
            onValueChange={setActiveDataTab}
            className="w-auto"
          >
            <TabsList className="bg-gray-100">
              <TabsTrigger 
                value="main" 
                className="relative data-[state=active]:text-blue-600"
              >
                <LineChartIcon className="h-4 w-4 mr-1.5" />
                <span>Chart</span>
              </TabsTrigger>
              <TabsTrigger 
                value="dividends" 
                className="relative data-[state=active]:text-blue-600"
              >
                <DollarSign className="h-4 w-4 mr-1.5" />
                <span>Dividends</span>
              </TabsTrigger>
              <TabsTrigger 
                value="earnings" 
                className="relative data-[state=active]:text-blue-600"
              >
                <BarChartIcon className="h-4 w-4 mr-1.5" />
                <span>Earnings</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        
        <AnimatePresence mode="wait">
          {/* Main Chart View */}
          {activeDataTab === 'main' && (
            <motion.div
              key="main-chart"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Controls row */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                {/* Time frame buttons */}
                <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
                  {['1M', '3M', '6M', '1Y', '5Y'].map((frame) => (
                    <button
                      key={frame}
                      onClick={() => handleTimeFrameChange(frame)}
                      className={cn(
                        "px-3 py-1 text-sm rounded-md transition-colors",
                        timeFrame === frame
                          ? "bg-white text-blue-600 shadow-sm"
                          : "text-gray-600 hover:text-gray-900"
                      )}
                    >
                      {frame}
                    </button>
                  ))}
                </div>
                
                {/* Toggle controls */}
                <div className="flex space-x-4">
                  {/* Chart type toggle */}
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center bg-gray-100 rounded-lg p-1">
                      <button
                        onClick={() => setChartType('line')}
                        className={cn(
                          "p-1.5 rounded-md",
                          chartType === 'line' ? "bg-white shadow-sm" : "text-gray-600"
                        )}
                        title="Line chart"
                      >
                        <LineChartIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setChartType('bar')}
                        className={cn(
                          "p-1.5 rounded-md",
                          chartType === 'bar' ? "bg-white shadow-sm" : "text-gray-600"
                        )}
                        title="Bar chart"
                      >
                        <BarChartIcon className="h-4 w-4" />
                      </button>
                    </div>
                    <Label className="text-sm text-gray-700">
                      Chart Type
                    </Label>
                  </div>
                  
                  {/* Chart type label only */}
                </div>
              </div>
              
              {/* Chart area */}
              {chartType === 'bar' ? (
                // Comparison bar chart
                <div className="w-full h-[350px] mt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={percentageReturnData}
                      margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
                      barSize={24}
                      barGap={4}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="date"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: '#6b7280' }}
                        tickMargin={8}
                      />
                      <YAxis 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: '#6b7280' }}
                        tickFormatter={(value) => `${value}%`}
                        tickMargin={8}
                      />
                      <Tooltip content={<ComparisonTooltip />} />
                      <Legend />
                      <Bar 
                        name={companyName || symbol}
                        dataKey="stockReturn" 
                        fill={stockColor}
                        radius={[4, 4, 0, 0]}
                      />
                      {showBenchmarks && (
                        <Bar 
                          name="S&P 500"
                          dataKey="benchmarkReturn" 
                          fill={sp500Color}
                          radius={[4, 4, 0, 0]}
                        />
                      )}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : showMonthlyReturns ? (
                // Monthly returns bar chart
                <div className="w-full h-[350px] mt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={monthlyReturnsData}
                      margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
                      barSize={24}
                    >
                      <CartesianGrid 
                        strokeDasharray="3 3" 
                        vertical={false} 
                        stroke="#f0f0f0" 
                      />
                      <XAxis 
                        dataKey="date" 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: '#6b7280' }}
                        tickMargin={8} 
                      />
                      <YAxis 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: '#6b7280' }}
                        tickFormatter={(value) => `${value}%`}
                        tickMargin={8}
                      />
                      <Tooltip content={<MonthlyReturnsTooltip />} />
                      <Bar 
                        dataKey="return" 
                        radius={[4, 4, 0, 0]}
                        fill="#10b981" 
                        // Use a function to determine bar color based on positive/negative value
                        isAnimationActive={true}
                        shape={(props: any) => {
                          const { x, y, width, height, fill, background } = props;
                          const value = parseFloat(props.payload.return);
                          const barColor = value >= 0 ? '#10b981' : '#ef4444';
                          return (
                            <rect 
                              x={x} 
                              y={y} 
                              width={width} 
                              height={height} 
                              fill={barColor}
                              rx={4}
                              ry={4}
                            />
                          );
                        }}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                // Main line chart
                <div className="w-full h-[350px] mt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={combinedData}
                      margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
                    >
                      <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={gradientStartColor} stopOpacity={1} />
                          <stop offset="95%" stopColor={gradientEndColor} stopOpacity={1} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid 
                        strokeDasharray="3 3" 
                        vertical={false} 
                        stroke="#f0f0f0" 
                      />
                      <XAxis 
                        dataKey="date" 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: '#6b7280' }}
                        tickMargin={8}
                        minTickGap={30}
                      />
                      <YAxis 
                        domain={['auto', 'auto']}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: '#6b7280' }}
                        tickFormatter={(value) => `$${value.toFixed(0)}`}
                        tickMargin={8}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      
                      {/* Main stock line with gradient area */}
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke={stockColor}
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 6, strokeWidth: 0 }}
                        fill="url(#colorValue)"
                      />
                      
                      {/* Benchmark lines */}
                      {showBenchmarks && (
                        <>
                          <Line
                            type="monotone"
                            dataKey="sp500"
                            stroke={sp500Color}
                            strokeWidth={1.5}
                            dot={false}
                            activeDot={{ r: 4, strokeWidth: 0 }}
                          />

                        </>
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
              
              {/* Legend */}
              {!showMonthlyReturns && (
                <div className="flex flex-wrap items-center gap-4 pt-1">
                  <div className="flex items-center">
                    <span className="inline-block w-3 h-3 bg-blue-600 rounded-full mr-2"></span>
                    <span className="text-sm text-gray-700">{companyName || symbol}</span>
                  </div>
                  
                  {showBenchmarks && (
                    <>
                      <div className="flex items-center">
                        <span className="inline-block w-3 h-3 bg-emerald-500 rounded-full mr-2"></span>
                        <span className="text-sm text-gray-700">S&P 500</span>
                      </div>

                    </>
                  )}
                </div>
              )}
            </motion.div>
          )}
          
          {/* Dividends View */}
          {activeDataTab === 'dividends' && (
            <motion.div
              key="dividends"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              <div className="overflow-hidden rounded-lg border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Yield</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {dividendData.map((dividend, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{dividend.date}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${dividend.amount.toFixed(2)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{dividend.yield}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Dividend trend chart */}
              <div className="w-full h-[200px] mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={dividendData.slice().reverse()}
                    margin={{ top: 10, right: 10, left: 0, bottom: 10 }}
                  >
                    <defs>
                      <linearGradient id="colorDividend" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="rgba(16, 185, 129, 0.2)" stopOpacity={1} />
                        <stop offset="95%" stopColor="rgba(16, 185, 129, 0)" stopOpacity={1} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="date" 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: '#6b7280' }}
                    />
                    <YAxis 
                      domain={['dataMin', 'dataMax']}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: '#6b7280' }}
                      tickFormatter={(value) => `$${value.toFixed(2)}`}
                    />
                    <Tooltip 
                      formatter={(value: number) => [`$${value.toFixed(2)}`, 'Dividend']}
                      labelFormatter={(label) => `Date: ${label}`}
                    />
                    <Area
                      type="monotone"
                      dataKey="amount"
                      stroke="#10b981"
                      strokeWidth={2}
                      fill="url(#colorDividend)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          )}
          
          {/* Earnings View */}
          {activeDataTab === 'earnings' && (
            <motion.div
              key="earnings"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              <div className="overflow-hidden rounded-lg border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quarter</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actual EPS</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estimated EPS</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Surprise</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {earningsData.map((earning, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{earning.quarter}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${earning.actual.toFixed(2)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${earning.estimated.toFixed(2)}</td>
                        <td className={cn(
                          "px-6 py-4 whitespace-nowrap text-sm font-medium",
                          earning.surprise.startsWith('+') ? "text-green-600" : "text-red-600"
                        )}>
                          {earning.surprise}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Earnings trend chart */}
              <div className="w-full h-[200px] mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={earningsData.slice().reverse()}
                    margin={{ top: 10, right: 10, left: 0, bottom: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="quarter" 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: '#6b7280' }}
                    />
                    <YAxis 
                      domain={['dataMin - 0.5', 'dataMax + 0.5']}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: '#6b7280' }}
                      tickFormatter={(value) => `$${value.toFixed(2)}`}
                    />
                    <Tooltip 
                      formatter={(value: number) => [`$${value.toFixed(2)}`, 'EPS']}
                      labelFormatter={(label) => `Quarter: ${label}`}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="actual"
                      name="Actual EPS"
                      stroke="#2563eb"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="estimated"
                      name="Estimated EPS"
                      stroke="#9ca3af"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};

export default HistoricalPerformanceChart;