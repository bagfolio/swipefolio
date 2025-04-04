import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  useYahooChartData, 
  useYahooDividendData, 
  useYahooEarningsData, 
  useYahooRevenueData,
  DividendData,
  EarningsData,
  RevenueData
} from '@/lib/yahoo-finance-client';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, ScatterChart, Scatter, ZAxis } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ArrowRight, BarChart as BarChartIcon, DollarSign, TrendingUp } from 'lucide-react';

interface ImprovedPerformanceChartProps {
  symbol: string;
  companyName?: string;
}

const ImprovedPerformanceChart: React.FC<ImprovedPerformanceChartProps> = ({ 
  symbol,
  companyName
}) => {
  const [activeView, setActiveView] = useState<string | null>(null);
  
  // Fetch data using the Yahoo Finance hooks
  const { data: dividendInfo, isLoading: isLoadingDividends } = useYahooDividendData(symbol);
  const { data: earningsInfo, isLoading: isLoadingEarnings } = useYahooEarningsData(symbol);
  const { data: revenueInfo, isLoading: isLoadingRevenue } = useYahooRevenueData(symbol);
  
  // Transform dividend data for the chart
  const dividendData = useMemo(() => {
    if (!dividendInfo) return [];
    
    return [
      {
        name: symbol,
        value: dividendInfo.dividendYield,
        fill: '#4f46e5'
      },
      {
        name: 'Sector Median',
        value: dividendInfo.sectorMedian,
        fill: '#60a5fa'
      },
      {
        name: 'Market Median',
        value: dividendInfo.marketMedian,
        fill: '#60a5fa'
      }
    ];
  }, [dividendInfo, symbol]);
  
  // Use earnings data from the hook
  const earningsData = useMemo(() => {
    return earningsInfo || [];
  }, [earningsInfo]);
  
  // Use revenue data from the hook  
  const revenueData = useMemo(() => {
    return revenueInfo || [];
  }, [revenueInfo]);
  
  const handleViewClick = (view: string) => {
    if (activeView === view) {
      setActiveView(null); // Toggle off if already active
    } else {
      setActiveView(view); // Set new active view
    }
  };
  
  // Formatter for tooltip values
  const formatCurrency = (value: number) => {
    return `$${value.toFixed(2)}`;
  };
  
  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`;
  };
  
  return (
    <Card className="w-full my-4 overflow-hidden">
      <CardContent className="p-4">
        <h3 className="text-lg font-semibold mb-4">Historical Performance</h3>
        
        {/* View selection buttons */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <Button 
            variant={activeView === 'dividends' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleViewClick('dividends')}
            className="flex items-center justify-center gap-2"
          >
            <DollarSign className="h-4 w-4" />
            <span>Dividends</span>
          </Button>
          
          <Button 
            variant={activeView === 'earnings' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleViewClick('earnings')}
            className="flex items-center justify-center gap-2"
          >
            <BarChartIcon className="h-4 w-4" />
            <span>Earnings</span>
          </Button>
          
          <Button 
            variant={activeView === 'revenue' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleViewClick('revenue')}
            className="flex items-center justify-center gap-2"
          >
            <TrendingUp className="h-4 w-4" />
            <span>Revenue</span>
          </Button>
        </div>
        
        {/* Content area */}
        <AnimatePresence mode="wait">
          {activeView === null ? (
            <motion.div
              key="empty-state"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-12 text-center text-gray-500"
            >
              <p>Select a metric above to view historical data</p>
            </motion.div>
          ) : activeView === 'dividends' ? (
            <motion.div
              key="dividends-view"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="mb-4">
                <h4 className="text-base font-medium mb-2">Dividend Yield Comparison</h4>
                {dividendInfo ? (
                  <div className="text-sm text-gray-500 mb-2">
                    <span className="font-medium">${dividendInfo.payoutAmount.toFixed(2)}</span> per share
                    <span className="mx-1">•</span>
                    <span className="text-gray-400">Last paid: {dividendInfo.lastPaidDate}</span>
                  </div>
                ) : (
                  <div className="text-sm text-gray-500 mb-2">
                    Loading dividend information...
                  </div>
                )}
              </div>
              
              {/* Dividend yield bar chart */}
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  {dividendData.length > 0 ? (
                    <BarChart
                      data={dividendData}
                      margin={{ top: 10, right: 10, left: 10, bottom: 30 }}
                      barGap={10}
                      barCategoryGap="20%"
                    >
                      <XAxis 
                        dataKey="name" 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: '#6b7280' }}
                        interval={0}
                      />
                      <YAxis 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: '#6b7280' }}
                        tickFormatter={(value) => `${value}%`}
                        domain={[0, 'dataMax + 1']}
                      />
                      <Tooltip 
                        formatter={(value: number) => [`${value}%`, 'Dividend Yield']}
                        labelStyle={{ color: '#374151' }}
                        contentStyle={{ 
                          backgroundColor: 'white', 
                          border: '1px solid #e5e7eb',
                          borderRadius: '0.375rem',
                          padding: '0.5rem'
                        }}
                      />
                      <Bar 
                        dataKey="value" 
                        name="Dividend Yield"
                        radius={[4, 4, 0, 0]}
                        fill="#4f46e5"
                        animationDuration={750}
                      />
                    </BarChart>
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      <p className="text-gray-500">Loading dividend data...</p>
                    </div>
                  )}
                </ResponsiveContainer>
              </div>
              
              <div className="mt-2 text-xs text-gray-500">
                <p>Morningstar calculates dividend yield based on distributions. It measures the income generated by investing in the stock.</p>
              </div>
            </motion.div>
          ) : activeView === 'earnings' ? (
            <motion.div
              key="earnings-view"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="mb-4">
                <h4 className="text-base font-medium mb-2">Earnings Per Share (EPS)</h4>
                <div className="text-sm text-gray-500 mb-2">
                  Quarterly earnings data with analyst expectations
                </div>
              </div>
              
              {/* EPS comparison */}
              <div className="space-y-4">
                {earningsData && earningsData.length > 0 ? (
                  earningsData.map((quarter, index) => (
                    <div key={quarter.quarter} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">{quarter.quarter}</span>
                        <span className={cn(
                          "text-sm font-medium px-2 py-0.5 rounded-full",
                          quarter.surprise.startsWith('+') 
                            ? "bg-green-100 text-green-800" 
                            : "bg-red-100 text-red-800"
                        )}>
                          {quarter.surprise}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-6">
                        <div>
                          <div className="text-xs text-gray-500">Actual</div>
                          <div className="text-lg font-semibold">${quarter.actual.toFixed(2)}</div>
                        </div>
                        <ArrowRight className="h-4 w-4 text-gray-400" />
                        <div>
                          <div className="text-xs text-gray-500">Expected</div>
                          <div className="text-lg">${quarter.expected.toFixed(2)}</div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-12 text-center text-gray-500">
                    <p>Loading earnings data...</p>
                  </div>
                )}
              </div>
            </motion.div>
          ) : activeView === 'revenue' ? (
            <motion.div
              key="revenue-view"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="mb-4">
                <h4 className="text-base font-medium mb-2">Annual Revenue</h4>
                <div className="text-sm text-gray-500 mb-2">
                  Revenue in billions USD
                </div>
              </div>
              
              {/* Revenue growth chart */}
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  {revenueData && revenueData.length > 0 ? (
                    <BarChart
                      data={revenueData}
                      margin={{ top: 10, right: 10, left: 10, bottom: 30 }}
                    >
                      <XAxis 
                        dataKey="year" 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: '#6b7280' }}
                      />
                      <YAxis 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: '#6b7280' }}
                        tickFormatter={(value) => `$${value}B`}
                        domain={[0, 'dataMax + 50']}
                      />
                      <Tooltip 
                        formatter={(value: number) => [`$${value}B`, 'Revenue']}
                        labelStyle={{ color: '#374151' }}
                        contentStyle={{ 
                          backgroundColor: 'white', 
                          border: '1px solid #e5e7eb',
                          borderRadius: '0.375rem',
                          padding: '0.5rem'
                        }}
                      />
                      <Bar 
                        dataKey="value" 
                        fill="#4f46e5"
                        radius={[4, 4, 0, 0]}
                        animationDuration={750}
                      />
                    </BarChart>
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      <p className="text-gray-500">Loading revenue data...</p>
                    </div>
                  )}
                </ResponsiveContainer>
              </div>
              
              <div className="mt-2 text-xs text-gray-500">
                <p>Annual revenue figures are from company's fiscal year reports.</p>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};

export default ImprovedPerformanceChart;