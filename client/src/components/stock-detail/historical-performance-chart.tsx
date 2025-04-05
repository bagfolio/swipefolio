import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  useYahooChartData, 
  useSP500ChartData, 
  useYahooDividendEvents,
  useYahooDividendComparison,
  timeFrameToRange 
} from '@/lib/yahoo-finance-client';
import { Area, AreaChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Line, LineChart, Bar, BarChart, ComposedChart } from 'recharts';
import { ChevronDown, Calendar, BarChart as BarChartIcon, LineChart as LineChartIcon, TrendingUp, DollarSign, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

// Helper to combine stock data with VOO (S&P 500 ETF) data
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

// Helper formatting functions
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
  value: number; // actual price for main chart
  percentReturn: string; // percentage return for comparison
  originalValue: number; // redundant, keeping for compatibility
  timestamp: number;
}

interface CombinedDataPoint extends ProcessedDataPoint {
  sp500?: string; // VOO (S&P 500 ETF) percentage return
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
  // VOO (S&P 500 ETF) comparison is always shown by default
  const showBenchmarks = true;
  const [chartType, setChartType] = useState<'line' | 'bar'>('bar');

  // Fetch stock chart data
  const { 
    data: chartData, 
    isLoading: stockLoading, 
    error: stockError 
  } = useYahooChartData(symbol, timeFrame);

  // Fetch VOO (S&P 500 ETF) data
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

    // Get initial price for calculating returns (for percentage calculation only)
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
        value: quote.close, // Use actual price for the main chart
        percentReturn: stockReturn.toFixed(2), // Store % return for comparison charts
        originalValue: quote.close,  // Keep original price for reference
        timestamp: new Date(quote.date).getTime()
      };
    });
  }, [chartData, timeFrame]);

  // Process and combine with VOO (S&P 500 ETF) data
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
          stockReturn: point.percentReturn, // Use percentage return for comparison
          benchmarkReturn: point.sp500, // Already percentage from sp500ReturnsByDate
        };
      });
  }, [combinedData, showBenchmarks]);

  // Create aggregated bar chart data (5-6 columns instead of granular data)
  const aggregatedBarData = useMemo(() => {
    if (!percentageReturnData.length) return [];

    // Determine number of divisions
    const numDivisions = 5; // We want 5 consolidated bars
    const totalPoints = percentageReturnData.length;
    const pointsPerDivision = Math.ceil(totalPoints / numDivisions);

    const result = [];

    // Group data into chunks
    for (let i = 0; i < numDivisions; i++) {
      const startIndex = i * pointsPerDivision;
      const endIndex = Math.min(startIndex + pointsPerDivision, totalPoints);

      if (startIndex >= totalPoints) break;

      // Get points in this division
      const divisionPoints = percentageReturnData.slice(startIndex, endIndex);

      // Use the last point in the division for comparison
      const lastPoint = divisionPoints[divisionPoints.length - 1];

      // Format period label with cleaner month-year format
      let periodLabel;

      // Create clean date formatter for month-year only
      const formatMonthYear = (dateStr: string) => {
        try {
          const dateParts = dateStr.split(', ');
          // If we have month and day, extract just the month
          if (dateParts[0].includes(' ')) {
            const monthPart = dateParts[0].split(' ')[0];
            return `${monthPart} ${dateParts[1] || ''}`.trim();
          }
          return dateStr;
        } catch (e) {
          return dateStr;
        }
      };

      if (divisionPoints.length > 1) {
        // Only show month and year for cleaner labels
        const startDate = formatMonthYear(divisionPoints[0].date);
        const endDate = formatMonthYear(lastPoint.date);
        periodLabel = `${startDate} - ${endDate}`;
      } else {
        periodLabel = formatMonthYear(lastPoint.date);
      }

      // For shorter timeframes, just use the date with month-year format
      if (timeFrame === '1M' || timeFrame === '3M') {
        periodLabel = formatMonthYear(lastPoint.date);
      }

      result.push({
        period: periodLabel,
        stockReturn: parseFloat(lastPoint.stockReturn),
        sp500Return: lastPoint.benchmarkReturn ? parseFloat(lastPoint.benchmarkReturn) : 0
      });
    }

    return result;
  }, [percentageReturnData, timeFrame]);

  // Calculate monthly returns
  const monthlyReturnsData = useMemo(() => {
    return calculateMonthlyReturns(processedData);
  }, [processedData]);

  // Fetch real dividend data from Yahoo Finance
  const { 
    data: dividendEvents, 
    isLoading: dividendsLoading 
  } = useYahooDividendEvents(symbol, timeFrame);

  // Fetch dividend comparison data between stock and VOO (Vanguard S&P 500 ETF)
  const {
    data: dividendComparisonData,
    isLoading: dividendComparisonLoading
  } = useYahooDividendComparison(symbol, timeFrame);

  // Get dividend data with fallback for compatibility
  const dividendData = useMemo(() => {
    if (dividendEvents && dividendEvents.length > 0) {
      return dividendEvents.map(event => ({
        date: event.name,
        amount: event.value,
        yield: "~" // Yield isn't directly available from the event data
      }));
    }
    // If no real data is available, return empty array
    return [];
  }, [dividendEvents, timeFrame]);

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

  // Custom tooltip component for line chart (price view)
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded-md shadow-md text-xs">
          <p className="font-semibold text-gray-800">{label}</p>
          <div className="mt-1">
            {payload.map((entry: any, index: number) => (
              <p key={`tooltip-entry-${index}`} className="flex items-center">
                <span 
                  className={`w-3 h-3 inline-block rounded-full mr-2 ${
                    entry.name === companyName || entry.name === symbol || entry.dataKey === "value" 
                      ? "bg-blue-600" 
                      : "bg-emerald-500"
                  }`}
                ></span>
                <span className="text-gray-700">{entry.name || (entry.dataKey === "value" ? (companyName || symbol) : "VOO (S&P 500 ETF)")}: </span>
                <span className="ml-1 font-medium">
                  {entry.dataKey === "value" ? "$" : ""}{formatTooltipValue(entry.value)}{entry.dataKey === "sp500" ? "%" : ""}
                </span>
              </p>
            ))}
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
                  {entry.name === 'stock' ? companyName || symbol : 'VOO (S&P 500 ETF)'}:
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
                // Aggregated comparison bar chart
                <div className="w-full h-[350px] mt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={aggregatedBarData}
                      margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
                      barSize={40}
                      barGap={8}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="period"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fill: '#6b7280' }}
                        tickMargin={8}
                        height={60}
                        angle={-20}
                        textAnchor="end"
                      />
                      <YAxis 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: '#6b7280' }}
                        tickFormatter={(value) => `${value}%`}
                        tickMargin={8}
                        // Apply fixed domain with padding for bar chart
                        domain={[(dataMin: number) => Math.floor(dataMin * 1.2), (dataMax: number) => Math.ceil(dataMax * 1.2)]}
                      />
                      <Tooltip 
                        content={({ active, payload, label }) => {
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
                                          entry.dataKey === 'stockReturn' ? 'bg-blue-600' : 'bg-emerald-500'
                                        }`}
                                      />
                                      <span className="text-gray-700">
                                        {entry.dataKey === 'stockReturn' ? companyName || symbol : 'VOO (S&P 500 ETF)'}:
                                      </span>
                                      <span className={`ml-1 font-medium ${
                                        entry.value >= 0 ? 'text-green-600' : 'text-red-600'
                                      }`}>
                                        {entry.value >= 0 ? '+' : ''}{formatTooltipValue(entry.value)}%
                                      </span>
                                    </p>
                                  ))}
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Legend />
                      <Bar 
                        name={companyName || symbol}
                        dataKey="stockReturn" 
                        fill={stockColor}
                        radius={[4, 4, 0, 0]}
                      />
                      {showBenchmarks && (
                        <Bar 
                          name="VOO (S&P 500 ETF)"
                          dataKey="sp500Return" 
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
                        // Add padding to ensure all monthly return bars are visible
                        domain={[(dataMin: number) => Math.floor(dataMin * 1.1), 
                                (dataMax: number) => Math.ceil(dataMax * 1.1)]}
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
                // Line chart showing percentage returns for both metrics
                <div className="w-full h-[350px] mt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                      data={percentageReturnData}
                      margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
                    >
                      <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={gradientStartColor} stopOpacity={0.2} />
                          <stop offset="95%" stopColor={gradientEndColor} stopOpacity={0} />
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

                      {/* Unified Y-axis with fixed domain and padding */}
                      <YAxis 
                        domain={[
                          (dataMin: number) => {
                            // Find all values (including both metrics)
                            const allValues = percentageReturnData.flatMap(point => [
                              parseFloat(point.stockReturn),
                              point.benchmarkReturn ? parseFloat(point.benchmarkReturn) : null
                            ]).filter(v => v !== null) as number[];

                            const min = Math.min(...allValues);
                            // Add 20% padding below for better visibility
                            return Math.floor(min * 1.2);
                          },
                          (dataMax: number) => {
                            // Find all values (including both metrics)
                            const allValues = percentageReturnData.flatMap(point => [
                              parseFloat(point.stockReturn),
                              point.benchmarkReturn ? parseFloat(point.benchmarkReturn) : null
                            ]).filter(v => v !== null) as number[];

                            const max = Math.max(...allValues);
                            // Add 20% padding above for better visibility
                            return Math.ceil(max * 1.2);
                          }
                        ]}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: '#6b7280' }}
                        tickFormatter={(value) => `${value}%`}
                        tickMargin={8}
                      />

                      <Tooltip content={<ComparisonTooltip />} />
                      <Legend />

                      {/* Stock percentage line with light fill */}
                      <Area
                        type="monotone"
                        dataKey="stockReturn"
                        name={companyName || symbol}
                        stroke={stockColor}
                        strokeWidth={2}
                        fillOpacity={0.3}
                        fill="url(#colorValue)"
                        dot={false}
                        activeDot={{ r: 6, strokeWidth: 0 }}
                      />

                      {/* VOO (S&P 500 ETF) percentage line */}
                      {showBenchmarks && (
                        <Line
                          type="monotone"
                          dataKey="benchmarkReturn"
                          name="VOO (S&P 500 ETF)"
                          stroke={sp500Color}
                          strokeWidth={1.5}
                          dot={false}
                          activeDot={{ r: 4, strokeWidth: 0 }}
                        />
                      )}
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Legend */}
              {!showMonthlyReturns && (
                <div className="flex flex-wrap items-center gap-4 pt-1">
                  <div className="flex items-center">
                    <span className="inline-block w-3 h-3 bg-blue-600 rounded-full mr-2"></span>
                    <span className="text-sm text-gray-700">
                      {companyName || symbol} (% Return)
                    </span>
                  </div>

                  {showBenchmarks && (
                    <>
                      <div className="flex items-center">
                        <span className="inline-block w-3 h-3 bg-emerald-500 rounded-full mr-2"></span>
                        <span className="text-sm text-gray-700">VOO (S&P 500 ETF) (% Return)</span>
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
              {/* Time frame controls for dividends */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
                  {['1Y', '3Y', '5Y', 'MAX'].map((frame) => (
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
                <div className="text-sm text-gray-500">
                  {dividendsLoading || dividendComparisonLoading ? (
                    <span className="flex items-center">
                      <RefreshCw className="animate-spin h-3 w-3 mr-2" />
                      Loading dividend data...
                    </span>
                  ) : !dividendData.length ? (
                    <span>No dividend data found for {symbol}</span>
                  ) : null}
                </div>
              </div>

              {/* Summary statistics for dividends */}
              {dividendData.length > 0 && (
                <div className="flex flex-wrap gap-4 p-4 bg-gray-50 rounded-lg mt-4">
                  <div className="flex-1 min-w-[160px]">
                    <h5 className="text-xs text-gray-500 mb-1">Latest Dividend</h5>
                    <div className="text-xl font-semibold text-blue-600">
                      ${dividendData[0]?.amount.toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-700 mt-1">
                      {dividendData[0]?.date}
                    </div>
                  </div>

                  <div className="flex-1 min-w-[160px]">
                    <h5 className="text-xs text-gray-500 mb-1">Annual Yield</h5>
                    <div className="text-xl font-semibold text-emerald-600">
                      {dividendData.length >= 4 ? 
                        `${((dividendData.slice(0, 4).reduce((sum, div) => sum + div.amount, 0) / 
                        (chartData?.quotes?.[chartData.quotes.length - 1]?.close || 100)) * 100).toFixed(2)}%` : 
                        'N/A'}
                    </div>
                    <div className="text-xs text-gray-700 mt-1">
                      Based on current price
                    </div>
                  </div>

                  <div className="flex-1 min-w-[160px]">
                    <h5 className="text-xs text-gray-500 mb-1">Payment Frequency</h5>
                    <div className="text-xl font-semibold text-gray-700">
                      {dividendData.length >= 3 ? 'Quarterly' : 'N/A'}
                    </div>
                    <div className="text-xs text-gray-700 mt-1">
                      {dividendData.length} payment(s) found
                    </div>
                  </div>
                </div>
              )}

              {/* Dividend payment history button */}
              {dividendData.length > 0 && (
                <div className="mt-6">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="w-full border-dashed"
                    onClick={() => {
                      const element = document.getElementById('dividend-history-details');
                      if (element) {
                        element.style.display = element.style.display === 'none' ? 'block' : 'none';
                      }
                    }}
                  >
                    <DollarSign className="h-4 w-4 mr-1.5" />
                    <span>Show Dividend History Details</span>
                  </Button>

                  <div id="dividend-history-details" className="mt-4 space-y-6" style={{ display: 'none' }}>
                    {/* Dividend payment history bar chart */}
                    <div className="w-full h-[250px]">
                      <h4 className="text-sm font-medium mb-3">Dividend Trend Over Time</h4>
                      <ResponsiveContainer width="100%" height="100%" minHeight={200}>
                        <AreaChart
                          data={dividendData.slice().reverse()}
                          margin={{ top: 10, right: 10, left: 0, bottom: 10 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                          <XAxis 
                            dataKey="date" 
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 10, fill: '#6b7280' }}
                            angle={-30}
                            textAnchor="end"
                            height={50}
                          />
                          <YAxis 
                            domain={[(dataMin: number) => Math.floor(dataMin * 0.9), 
                                    (dataMax: number) => Math.ceil(dataMax * 1.1)]}
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
                            fill={stockColor}
                            strokeWidth={2}
                            dot={false}
                            activeDot={{ r: 6, strokeWidth: 0 }}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Dividend data table */}
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
                  </div>
                </div>
              )}

              {/* Dividend payments bar chart - hidden inside history details */}
              {/* Moved inside the history details section */}

              {/* Dividend payment amount comparison (hidden by default) */}
              {dividendComparisonData && dividendComparisonData.quarters && dividendComparisonData.quarters.length > 0 && (
                <div className="space-y-2 mt-6">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium">Dividend Yield Comparison with VOO (Vanguard S&P 500 ETF)</h4>

                    <Button 
                      variant="outline" 
                      size="sm"
                      className="text-xs h-8"
                      onClick={() => {
                        const element = document.getElementById('dividend-payment-details');
                        if (element) {
                          element.style.display = element.style.display === 'none' ? 'block' : 'none';
                        }
                      }}
                    >
                      Payment Details
                    </Button>
                  </div>

                  {/* Dividend Yield Comparison Chart - ALWAYS SHOWN */}
                  <div className="w-full h-[250px]" style={{ minHeight: "250px" }}>
                    <ResponsiveContainer width="100%" height="100%" minHeight={200}>
                      <BarChart
                        data={
                          dividendComparisonData && dividendComparisonData.quarters ? 
                          dividendComparisonData.quarters.map((quarter, index) => ({
                            quarter,
                            stockYield: dividendComparisonData.stockYields[index] || 0,
                            sp500Yield: dividendComparisonData.sp500Yields[index] || 0
                          })) : 
                          [
                            { quarter: 'Q1 2023', stockYield: 0.85, sp500Yield: 0.63 },
                            { quarter: 'Q2 2023', stockYield: 0.87, sp500Yield: 0.65 },
                            { quarter: 'Q3 2023', stockYield: 0.88, sp500Yield: 0.66 },
                            { quarter: 'Q4 2023', stockYield: 0.90, sp500Yield: 0.67 },
                            { quarter: 'Q1 2024', stockYield: 0.92, sp500Yield: 0.69 }
                          ]
                        }
                        margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
                        barSize={20}
                        barGap={8}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                        <XAxis 
                          dataKey="quarter" 
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 10, fill: '#6b7280' }}
                          angle={-30}
                          textAnchor="end"
                          height={50}
                        />
                        <YAxis 
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 12, fill: '#6b7280' }}
                          tickFormatter={(value) => `${value.toFixed(2)}%`}
                        />
                        <Tooltip 
                          formatter={(value: number, name: string) => {
                            let label = name === 'stockYield' ? `${symbol} Yield` : 'VOO (S&P 500 ETF) Yield';
                            return [`${value.toFixed(2)}%`, label];
                          }}
                          labelFormatter={(label) => `Quarter: ${label}`}
                        />
                        <Legend />
                        <Bar
                          name={`${symbol} Yield`}
                          dataKey="stockYield"
                          fill={stockColor}
                          radius={[4, 4, 0, 0]}
                        />
                        <Bar
                          name="VOO (S&P 500 ETF) Yield"
                          dataKey="sp500Yield"
                          fill={sp500Color}
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Dividend Payment Amount Comparison Chart - HIDDEN BY DEFAULT */}
                  <div id="dividend-payment-details" className="w-full h-[250px] mt-8" style={{ display: 'none' }}>
                    <h4 className="text-sm font-medium mb-3">Dividend Payment Amounts</h4>
                    <ResponsiveContainer width="100%" height="100%" minHeight={200}>
                      <BarChart
                        data={dividendComparisonData && dividendComparisonData.quarters ? 
                        dividendComparisonData.quarters.map((quarter, index) => ({
                          quarter,
                          stockDividend: dividendComparisonData.stockDividends[index] || 0,
                          sp500Dividend: dividendComparisonData.sp500Dividends[index] || 0
                        })) : 
                        [
                          { quarter: 'Q1 2023', stockDividend: 0.85, sp500Dividend: 0.63 },
                          { quarter: 'Q2 2023', stockDividend: 0.87, sp500Dividend: 0.65 },
                          { quarter: 'Q3 2023', stockDividend: 0.88, sp500Dividend: 0.66 },
                          { quarter: 'Q4 2023', stockDividend: 0.90, sp500Dividend: 0.67 },
                          { quarter: 'Q1 2024', stockDividend: 0.92, sp500Dividend: 0.69 }
                        ]
                      }
                        margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
                        barSize={20}
                        barGap={8}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                        <XAxis 
                          dataKey="quarter" 
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 10, fill: '#6b7280' }}
                          angle={-30}
                          textAnchor="end"
                          height={50}
                        />
                        <YAxis 
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 12, fill: '#6b7280' }}
                          tickFormatter={(value) => `$${value.toFixed(2)}`}
                        />
                        <Tooltip 
                          formatter={(value: number, name: string) => {
                            let label = name === 'stockDividend' ? `${symbol} Dividend` : 'VOO (S&P 500 ETF) Dividend';
                            return [`$${value.toFixed(2)}`, label];
                          }}
                          labelFormatter={(label) => `Quarter: ${label}`}
                        />
                        <Legend />
                        <Bar
                          name={`${symbol}`}
                          dataKey="stockDividend"
                          fill={stockColor}
                          radius={[4, 4, 0, 0]}
                        />
                        <Bar
                          name="VOO (S&P 500 ETF)"
                          dataKey="sp500Dividend"
                          fill={sp500Color}
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Empty state - show when no dividend data is available */}
              {!dividendsLoading && !dividendComparisonLoading && dividendData.length === 0 && (
                <div className="flex flex-col items-center justify-center p-8 text-center bg-gray-50 rounded-lg mt-4">
                  <DollarSign className="h-12 w-12 text-gray-300 mb-2" />
                  <h3 className="text-lg font-medium text-gray-600 mb-1">No Dividend Data</h3>
                  <p className="text-sm text-gray-500 max-w-md">
                    {symbol} does not appear to pay dividends or no dividend data was found for the selected time period.
                  </p>
                </div>
              )}
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
                      domain={[(dataMin: number) => Math.floor(dataMin * 0.9), 
                              (dataMax: number) => Math.ceil(dataMax * 1.1)]}
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