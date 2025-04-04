import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useYahooChartData, timeFrameToRange } from '@/lib/yahoo-finance-client';
import { Area, AreaChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Line, LineChart, Bar, BarChart } from 'recharts';
import { ChevronDown, Calendar, BarChart as BarChartIcon, LineChart as LineChartIcon, TrendingUp, DollarSign } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

// Sample market benchmarks data (S&P 500, Industry average)
const getBenchmarkData = (timeFrame: string, stockData: any[] = []) => {
  // This would normally come from an API
  if (!stockData.length) return [];
  
  // Create synthetic benchmark data based on the stock's performance
  // In a real app, you would fetch actual benchmark data
  return stockData.map((point, i) => {
    // Adjust the values to create slightly different benchmark lines
    const sp500Value = point.value * (0.9 + Math.sin(i * 0.1) * 0.1);
    const industryValue = point.value * (0.8 + Math.cos(i * 0.1) * 0.2);
    
    return {
      ...point,
      sp500: sp500Value,
      industry: industryValue
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

const HistoricalPerformanceChart: React.FC<HistoricalPerformanceChartProps> = ({ 
  symbol,
  companyName
}) => {
  const [timeFrame, setTimeFrame] = useState('1Y');
  const [showMonthlyReturns, setShowMonthlyReturns] = useState(false);
  const [activeDataTab, setActiveDataTab] = useState('main');
  const [showBenchmarks, setShowBenchmarks] = useState(true);
  
  // Fetch stock chart data
  const { 
    data: chartData, 
    isLoading, 
    error 
  } = useYahooChartData(symbol, timeFrame);
  
  // Process chart data for display
  const processedData = useMemo(() => {
    if (!chartData?.quotes || chartData.quotes.length === 0) {
      return [];
    }
    
    return chartData.quotes.map(quote => ({
      date: new Date(quote.date).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: timeFrame === '1Y' || timeFrame === '5Y' || timeFrame === 'MAX' ? 'numeric' : undefined
      }),
      value: quote.close,
      timestamp: new Date(quote.date).getTime()
    }));
  }, [chartData, timeFrame]);
  
  // Get benchmark data
  const benchmarkData = useMemo(() => {
    return getBenchmarkData(timeFrame, processedData);
  }, [timeFrame, processedData]);
  
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
  const formatTooltipValue = (value: number | null | undefined) => {
    if (value === null || value === undefined) return 'N/A';
    return value.toFixed(2);
  };
  
  // Set up chart colors
  const stockColor = '#2563eb'; // blue-600
  const sp500Color = '#10b981'; // emerald-500
  const industryColor = '#8b5cf6'; // violet-500
  const gradientStartColor = 'rgba(37, 99, 235, 0.2)'; // blue-600 with alpha
  const gradientEndColor = 'rgba(37, 99, 235, 0)'; // transparent
  
  // Handle timeframe change
  const handleTimeFrameChange = (newTimeFrame: string) => {
    setTimeFrame(newTimeFrame);
  };
  
  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded-md shadow-md text-xs">
          <p className="font-semibold text-gray-800">{label}</p>
          <div className="mt-1">
            <p className="flex items-center">
              <span className="w-3 h-3 inline-block bg-blue-600 rounded-full mr-2"></span>
              <span className="text-gray-700">{companyName || symbol}: </span>
              <span className="ml-1 font-medium">${formatTooltipValue(payload[0].value)}</span>
            </p>
            {showBenchmarks && (
              <>
                <p className="flex items-center mt-1">
                  <span className="w-3 h-3 inline-block bg-emerald-500 rounded-full mr-2"></span>
                  <span className="text-gray-700">S&P 500: </span>
                  <span className="ml-1 font-medium">${formatTooltipValue(payload[1]?.value)}</span>
                </p>
                <p className="flex items-center mt-1">
                  <span className="w-3 h-3 inline-block bg-violet-500 rounded-full mr-2"></span>
                  <span className="text-gray-700">Industry: </span>
                  <span className="ml-1 font-medium">${formatTooltipValue(payload[2]?.value)}</span>
                </p>
              </>
            )}
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
                  {/* Benchmarks toggle */}
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="benchmark-toggle"
                      checked={showBenchmarks}
                      onCheckedChange={setShowBenchmarks}
                    />
                    <Label
                      htmlFor="benchmark-toggle"
                      className="text-sm text-gray-700 cursor-pointer"
                    >
                      Benchmarks
                    </Label>
                  </div>
                  
                  {/* Monthly returns toggle */}
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="monthly-toggle"
                      checked={showMonthlyReturns}
                      onCheckedChange={setShowMonthlyReturns}
                    />
                    <Label
                      htmlFor="monthly-toggle"
                      className="text-sm text-gray-700 cursor-pointer"
                    >
                      Return per Month
                    </Label>
                  </div>
                </div>
              </div>
              
              {/* Chart area */}
              {showMonthlyReturns ? (
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
                      data={benchmarkData}
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
                          <Line
                            type="monotone"
                            dataKey="industry"
                            stroke={industryColor}
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
                      <div className="flex items-center">
                        <span className="inline-block w-3 h-3 bg-violet-500 rounded-full mr-2"></span>
                        <span className="text-sm text-gray-700">Industry Average</span>
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