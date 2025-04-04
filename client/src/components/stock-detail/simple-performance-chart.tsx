import { useYahooChartData } from '@/lib/yahoo-finance-client';
import { Card, CardContent } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface SimplePerformanceChartProps {
  symbol: string;
  companyName?: string;
}

const SimplePerformanceChart: React.FC<SimplePerformanceChartProps> = ({ 
  symbol,
  companyName
}) => {
  // Fetch stock chart data
  const { 
    data: chartData,
    isLoading,
    error
  } = useYahooChartData(symbol, '1Y');
  
  // Process chart data for display
  const processedData = chartData?.quotes?.map(quote => ({
    date: new Date(quote.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
    value: quote.close
  })) || [];
  
  if (isLoading) {
    return (
      <Card className="w-full my-4">
        <CardContent className="p-4 h-60 flex items-center justify-center">
          <p>Loading historical performance data...</p>
        </CardContent>
      </Card>
    );
  }
  
  if (error || !chartData) {
    return (
      <Card className="w-full my-4">
        <CardContent className="p-4 h-40 flex items-center justify-center">
          <p className="text-red-500">Error loading chart data</p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="w-full my-4">
      <CardContent className="p-4">
        <h3 className="text-lg font-semibold mb-4">Historical Performance Chart</h3>
        <div className="h-60 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={processedData}
              margin={{ top: 10, right: 10, left: 10, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis 
                dataKey="date" 
                axisLine={false}
                tickLine={false}
                padding={{ left: 10, right: 10 }}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                domain={['auto', 'auto']}
                tickFormatter={(value) => `$${value.toFixed(0)}`}
              />
              <Tooltip 
                formatter={(value: number) => [`$${value.toFixed(2)}`, 'Price']}
                labelFormatter={(label) => `Date: ${label}`}
              />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="#2563eb" 
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default SimplePerformanceChart;