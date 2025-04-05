import { useQuery } from "@tanstack/react-query";

// Type definitions
export interface YahooChartQuote {
  date: string;
  high: number;
  low: number;
  open: number;
  close: number;
  volume: number;
  adjclose: number;
}

export interface YahooDividendEvent {
  date: string;   // Date of dividend
  amount: number; // Dividend amount
}

export interface YahooChartResponse {
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
  events?: {
    dividends?: YahooDividendEvent[];
    splits?: any[];
  };
}

// Analyst recommendation types
export interface AnalystRecommendation {
  buy: number;
  hold: number;
  sell: number;
  strongBuy: number;
  strongSell: number;
  period: string;
  symbol: string;
  total: number;
  buyPercentage: number;
  sellPercentage: number;
  holdPercentage: number;
  consensus: 'buy' | 'sell' | 'hold' | 'neutral';
  lastUpdated: string;
  averageRating: number; // 1-5 scale (1=Strong Sell, 5=Strong Buy)
}

// Analyst upgrade/downgrade history item
export interface UpgradeHistoryItem {
  firm: string;
  toGrade: string;
  fromGrade: string;
  action: 'upgrade' | 'downgrade' | 'maintain' | 'init' | 'reiterated';
  date: string;
  epochGradeDate: number;
}

// Map TimeFrame to Yahoo Finance range parameter
export const timeFrameToRange: Record<string, string> = {
  "1D": "1d",
  "5D": "5d",
  "1M": "1mo",
  "3M": "3mo",
  "6M": "6mo",
  "1Y": "1y",
  "5Y": "5y",
  "MAX": "max"
};

/**
 * Fetch chart data for a stock symbol with the given time range
 */
export async function fetchStockChartData(symbol: string, range: string = "1mo", interval: string = "1d"): Promise<YahooChartResponse> {
  try {
    const response = await fetch(`/api/yahoo-finance/chart/${symbol}?interval=${interval}&range=${range}`);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `Failed to fetch chart data for ${symbol}`
      );
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error fetching chart data for ${symbol}:`, error);
    throw error;
  }
}

/**
 * Hook to query Yahoo Finance chart data
 */
export function useYahooChartData(symbol: string, timeFrame: string) {
  // Map timeFrame to corresponding Yahoo Finance range
  const range = timeFrameToRange[timeFrame] || "1mo";
  
  // Get primary chart data
  return useQuery<YahooChartResponse>({
    queryKey: ['/api/yahoo-finance/chart', symbol, range],
    queryFn: async () => fetchStockChartData(symbol, range),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!symbol,
  });
}

/**
 * Hook to fetch S&P 500 data (^GSPC)
 */
export function useSP500ChartData(timeFrame: string) {
  // Map timeFrame to corresponding Yahoo Finance range
  const range = timeFrameToRange[timeFrame] || "1mo";
  
  // Get S&P 500 data using the ^GSPC symbol
  return useQuery<YahooChartResponse>({
    queryKey: ['/api/yahoo-finance/chart', '^GSPC', range],
    queryFn: async () => fetchStockChartData('^GSPC', range),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Extract and format chart data from Yahoo Finance response
 * Returns an array of close prices for simplified chart view
 */
export function extractChartPrices(chartData?: YahooChartResponse): number[] {
  if (!chartData?.quotes || chartData.quotes.length === 0) {
    return [];
  }
  
  // Extract close prices
  return chartData.quotes.map(quote => quote.close);
}

/**
 * Get appropriate time scale labels based on the time frame
 */
export function getYahooTimeScaleLabels(timeFrame: string, chartData?: YahooChartResponse): string[] {
  if (!chartData?.quotes || chartData.quotes.length === 0) {
    // Fallback labels if no data
    return ["", "", "", "", ""];
  }
  
  // Determine how many labels to show (avoid overcrowding)
  const maxLabels = 5;
  const quotes = chartData.quotes;
  const labelCount = Math.min(maxLabels, quotes.length);
  
  if (labelCount <= 1) return [formatDateByTimeFrame(quotes[0].date, timeFrame)];
  
  // Create evenly spaced labels
  const result: string[] = [];
  const step = Math.floor(quotes.length / (labelCount - 1));
  
  for (let i = 0; i < labelCount - 1; i++) {
    const index = i * step;
    result.push(formatDateByTimeFrame(quotes[index].date, timeFrame));
  }
  
  // Always add the most recent date as the last label
  result.push(formatDateByTimeFrame(quotes[quotes.length - 1].date, timeFrame));
  
  return result;
}

/**
 * Format date according to timeframe
 */
function formatDateByTimeFrame(dateStr: string, timeFrame: string): string {
  const date = new Date(dateStr);
  
  switch (timeFrame) {
    case "1D":
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    case "5D":
      return date.toLocaleDateString([], { weekday: 'short' });
    case "1M":
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    case "3M":
    case "6M":
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    case "1Y":
      return date.toLocaleDateString([], { month: 'short' });
    case "5Y":
    case "MAX":
      return date.getFullYear().toString();
    default:
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
}

/**
 * Fetch analyst recommendations for a stock symbol
 */
export async function fetchAnalystRecommendations(symbol: string): Promise<AnalystRecommendation> {
  try {
    const response = await fetch(`/api/yahoo-finance/recommendations/${symbol}`);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `Failed to fetch recommendations for ${symbol}`
      );
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error fetching recommendations for ${symbol}:`, error);
    throw error;
  }
}

/**
 * Hook to query Yahoo Finance analyst recommendations
 */
export function useAnalystRecommendations(symbol: string) {
  return useQuery<AnalystRecommendation>({
    queryKey: ['/api/yahoo-finance/recommendations', symbol],
    queryFn: async () => fetchAnalystRecommendations(symbol),
    staleTime: 24 * 60 * 60 * 1000, // 24 hours since analyst ratings don't change frequently
    enabled: !!symbol,
  });
}

/**
 * Fetch analyst upgrade/downgrade history for a stock symbol
 */
export async function fetchUpgradeHistory(symbol: string): Promise<UpgradeHistoryItem[]> {
  try {
    const response = await fetch(`/api/yahoo-finance/upgrade-history/${symbol}`);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `Failed to fetch upgrade/downgrade history for ${symbol}`
      );
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error fetching upgrade history for ${symbol}:`, error);
    throw error;
  }
}

/**
 * Hook to query Yahoo Finance analyst upgrade/downgrade history
 */
export function useUpgradeHistory(symbol: string) {
  return useQuery<UpgradeHistoryItem[]>({
    queryKey: ['/api/yahoo-finance/upgrade-history', symbol],
    queryFn: async () => fetchUpgradeHistory(symbol),
    staleTime: 24 * 60 * 60 * 1000, // 24 hours since analyst ratings don't change frequently
    enabled: !!symbol,
  });
}

// Interface for dividend data
export interface DividendData {
  symbol: string;
  dividendYield: number;
  sectorMedian: number;
  marketMedian: number;
  payoutAmount: number;
  lastPaidDate: string;
}

// Interface for formatted dividend chart data
export interface DividendChartData {
  name: string;
  value: number;
  type: string;
}

// Interface for dividend comparison data
export interface DividendComparisonData {
  quarters: string[];
  stockDividends: number[];
  sp500Dividends: number[];
  stockSymbol: string;
}

// Interface for earnings data
export interface EarningsData {
  quarter: string;
  actual: number;
  expected: number;
  surprise: string;
  date: string;
}

// Interface for revenue data
export interface RevenueData {
  year: string;
  value: number;
  growth?: string;
}

/**
 * Extract dividend events from chart data
 */
export function extractDividendEvents(chartData?: YahooChartResponse): YahooDividendEvent[] {
  if (!chartData?.events?.dividends || !Array.isArray(chartData.events.dividends)) {
    return [];
  }
  
  return chartData.events.dividends.map(div => ({
    date: new Date(div.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }),
    amount: div.amount
  })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

/**
 * Format dividend events for visualization in a bar chart
 */
export function formatDividendEventsForChart(dividendEvents: YahooDividendEvent[], spYield: number = 1.5): { name: string; value: number; type: string }[] {
  if (!dividendEvents || dividendEvents.length === 0) {
    return [];
  }
  
  // Sort chronologically (oldest to newest)
  const sortedEvents = [...dividendEvents].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  
  // Create data points for the bar chart
  return sortedEvents.map((div, index) => {
    const date = new Date(div.date);
    const formattedDate = date.toLocaleDateString(undefined, { 
      month: 'short', 
      year: '2-digit' 
    });
    
    return {
      name: formattedDate,
      value: div.amount,
      type: 'Dividend Payment'
    };
  });
}

/**
 * Calculate dividend yield from price and annual dividends
 */
export function calculateDividendYield(currentPrice: number, annualDividend: number): number {
  if (!currentPrice || !annualDividend || currentPrice <= 0) {
    return 0;
  }
  return (annualDividend / currentPrice) * 100; // Convert to percentage
}

/**
 * Hook to query Yahoo Finance dividend data
 * Uses dividend events from chart data (1Y timeframe)
 */
export function useYahooDividendData(symbol: string, timeFrame: string = '1Y') {
  const range = timeFrameToRange[timeFrame] || "1y";
  
  // First, get the chart data that includes dividends
  const chartDataQuery = useQuery<YahooChartResponse>({
    queryKey: ['/api/yahoo-finance/chart', symbol, range, 'dividends'],
    queryFn: async () => fetchStockChartData(symbol, range),
    staleTime: 60 * 60 * 1000, // 1 hour
    enabled: !!symbol,
  });
  
  // Extract and process dividend data
  return useQuery<DividendData>({
    queryKey: ['/api/yahoo-finance/dividend', symbol, range],
    queryFn: async () => {
      const chartData = chartDataQuery.data;
      
      if (!chartData) {
        throw new Error('Chart data not available');
      }
      
      // Get dividend events
      const dividendEvents = extractDividendEvents(chartData);
      
      // Calculate current price
      const currentPrice = chartData.meta.regularMarketPrice || 
                          (chartData.quotes && chartData.quotes.length > 0 
                            ? chartData.quotes[chartData.quotes.length - 1].close 
                            : 0);
      
      // Calculate annual dividend (sum of the most recent up to 4 dividends)
      const recentDividends = dividendEvents.slice(0, 4);
      const totalDividends = recentDividends.reduce((sum, div) => sum + div.amount, 0);
      
      // Adjust for frequency (quarterly, monthly, etc.)
      let annualDividend = totalDividends;
      if (recentDividends.length > 0 && recentDividends.length < 4) {
        // Estimate annual dividend based on available data
        annualDividend = (totalDividends / recentDividends.length) * 4;
      }
      
      // Calculate dividend yield
      const dividendYield = calculateDividendYield(currentPrice, annualDividend);
      
      // Get last paid date
      const lastPaidDate = dividendEvents.length > 0 ? dividendEvents[0].date : 'N/A';
      
      // Get payout amount (most recent dividend)
      const payoutAmount = dividendEvents.length > 0 ? dividendEvents[0].amount : 0;
      
      // For the sector and market median, we would ideally get this from another source
      // For now, we'll use placeholder values that are realistic
      return {
        symbol,
        dividendYield,
        sectorMedian: 2.1, // Industry average placeholder
        marketMedian: 1.5, // S&P 500 average placeholder
        payoutAmount,
        lastPaidDate
      };
    },
    staleTime: 60 * 60 * 1000, // 1 hour
    enabled: !!symbol && chartDataQuery.isSuccess,
  });
}

/**
 * Hook to query Yahoo Finance earnings data
 * Currently returns mock data - will be replaced with actual API data
 */
export function useYahooEarningsData(symbol: string) {
  return useQuery<EarningsData[]>({
    queryKey: ['/api/yahoo-finance/earnings', symbol],
    queryFn: async () => {
      // This will be replaced with actual API data when endpoint is available
      // For now, return test data
      const mockEarnings: EarningsData[] = [
        { 
          quarter: 'Q1 2024', 
          actual: symbol === 'AAPL' ? 2.35 : symbol === 'MSFT' ? 2.94 : 1.98, 
          expected: symbol === 'AAPL' ? 2.28 : symbol === 'MSFT' ? 2.82 : 1.95, 
          surprise: symbol === 'AAPL' ? '+3.1%' : symbol === 'MSFT' ? '+4.3%' : '+1.5%',
          date: 'Apr 26, 2024'
        },
        { 
          quarter: 'Q4 2023', 
          actual: symbol === 'AAPL' ? 2.18 : symbol === 'MSFT' ? 2.69 : 1.85, 
          expected: symbol === 'AAPL' ? 2.10 : symbol === 'MSFT' ? 2.65 : 1.87, 
          surprise: symbol === 'AAPL' ? '+3.8%' : symbol === 'MSFT' ? '+1.5%' : '-1.1%',
          date: 'Jan 15, 2024'
        },
        { 
          quarter: 'Q3 2023', 
          actual: symbol === 'AAPL' ? 2.06 : symbol === 'MSFT' ? 2.51 : 1.75, 
          expected: symbol === 'AAPL' ? 2.12 : symbol === 'MSFT' ? 2.41 : 1.78, 
          surprise: symbol === 'AAPL' ? '-2.8%' : symbol === 'MSFT' ? '+4.1%' : '-1.7%',
          date: 'Oct 12, 2023'
        },
        { 
          quarter: 'Q2 2023', 
          actual: symbol === 'AAPL' ? 1.98 : symbol === 'MSFT' ? 2.40 : 1.65, 
          expected: symbol === 'AAPL' ? 1.95 : symbol === 'MSFT' ? 2.35 : 1.62, 
          surprise: symbol === 'AAPL' ? '+1.5%' : symbol === 'MSFT' ? '+2.1%' : '+1.9%',
          date: 'Jul 21, 2023'
        },
      ];
      
      return mockEarnings;
    },
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
    enabled: !!symbol,
  });
}

/**
 * Hook to get dividend events for chart visualization
 * This fetches data in the specified timeframe and formats it for a bar chart
 */
export function useYahooDividendEvents(symbol: string, timeFrame: string) {
  const range = timeFrameToRange[timeFrame] || "1y";
  
  // Get the chart data with dividend events
  const chartDataQuery = useQuery<YahooChartResponse>({
    queryKey: ['/api/yahoo-finance/chart', symbol, range, 'dividends'],
    queryFn: async () => fetchStockChartData(symbol, range),
    staleTime: 60 * 60 * 1000, // 1 hour
    enabled: !!symbol,
  });
  
  // Format the dividend events for visualization
  return useQuery<DividendChartData[]>({
    queryKey: ['/api/yahoo-finance/dividend-events', symbol, range],
    queryFn: async () => {
      const chartData = chartDataQuery.data;
      
      if (!chartData) {
        return [];
      }
      
      // Extract and format dividend events
      const dividendEvents = extractDividendEvents(chartData);
      return formatDividendEventsForChart(dividendEvents);
    },
    staleTime: 60 * 60 * 1000, // 1 hour
    enabled: !!symbol && chartDataQuery.isSuccess,
  });
}

/**
 * Hook to compare dividend data between a stock and S&P 500
 * Returns quarterly dividend data for both the stock and the S&P 500
 */
export function useYahooDividendComparison(symbol: string, timeFrame: string) {
  const range = timeFrameToRange[timeFrame] || "1y";
  
  // Get the stock dividend data
  const stockChartQuery = useQuery<YahooChartResponse>({
    queryKey: ['/api/yahoo-finance/chart', symbol, range, 'dividends'],
    queryFn: async () => fetchStockChartData(symbol, range),
    staleTime: 60 * 60 * 1000, // 1 hour
    enabled: !!symbol,
  });
  
  // Get the S&P 500 dividend data
  const sp500ChartQuery = useQuery<YahooChartResponse>({
    queryKey: ['/api/yahoo-finance/chart', '^GSPC', range, 'dividends'],
    queryFn: async () => fetchStockChartData('^GSPC', range),
    staleTime: 60 * 60 * 1000, // 1 hour
    enabled: !!symbol,
  });
  
  // Process and compare the dividend data
  return useQuery<DividendComparisonData>({
    queryKey: ['/api/yahoo-finance/dividend-comparison', symbol, '^GSPC', range],
    queryFn: async () => {
      const stockData = stockChartQuery.data;
      const sp500Data = sp500ChartQuery.data;
      
      if (!stockData || !sp500Data) {
        throw new Error('Chart data not available');
      }
      
      // Extract dividend events
      const stockDividends = extractDividendEvents(stockData);
      const sp500Dividends = extractDividendEvents(sp500Data);
      
      // Group by quarter for comparison
      // First, create a combined timeline of quarters
      const allDates = [...stockDividends, ...sp500Dividends].map(div => new Date(div.date));
      
      // Sort dates chronologically
      const sortedDates = allDates.sort((a, b) => a.getTime() - b.getTime());
      
      // Get unique quarters represented in the data
      const quarters: string[] = [];
      const seenQuarters = new Set<string>();
      
      sortedDates.forEach(date => {
        const quarter = `Q${Math.floor(date.getMonth() / 3) + 1} ${date.getFullYear()}`;
        if (!seenQuarters.has(quarter)) {
          seenQuarters.add(quarter);
          quarters.push(quarter);
        }
      });
      
      // If we have more than 8 quarters, just take the most recent 8
      const recentQuarters = quarters.slice(-8);
      
      // Create arrays for stock and SP500 dividend values
      const stockDividendValues: number[] = [];
      const sp500DividendValues: number[] = [];
      
      // For each quarter, find the corresponding dividend amount
      recentQuarters.forEach(quarter => {
        // Parse quarter string (e.g., "Q1 2023")
        const [q, year] = quarter.split(' ');
        const quarterNum = parseInt(q.substring(1)) - 1; // Q1 -> 0, Q2 -> 1, etc.
        const yearNum = parseInt(year);
        
        // Calculate start and end dates for this quarter
        const startMonth = quarterNum * 3;
        const endMonth = startMonth + 3;
        const startDate = new Date(yearNum, startMonth, 1);
        const endDate = new Date(yearNum, endMonth, 0); // Last day of the end month
        
        // Find stock dividend in this quarter
        const stockDiv = stockDividends.find(div => {
          const divDate = new Date(div.date);
          return divDate >= startDate && divDate <= endDate;
        });
        
        // Find S&P 500 dividend in this quarter
        const sp500Div = sp500Dividends.find(div => {
          const divDate = new Date(div.date);
          return divDate >= startDate && divDate <= endDate;
        });
        
        // Add to arrays (use 0 if no dividend found)
        stockDividendValues.push(stockDiv ? stockDiv.amount : 0);
        sp500DividendValues.push(sp500Div ? sp500Div.amount : 0);
      });
      
      return {
        quarters: recentQuarters,
        stockDividends: stockDividendValues,
        sp500Dividends: sp500DividendValues,
        stockSymbol: symbol
      };
    },
    staleTime: 60 * 60 * 1000, // 1 hour
    enabled: !!symbol && stockChartQuery.isSuccess && sp500ChartQuery.isSuccess,
  });
}

export function useYahooRevenueData(symbol: string) {
  return useQuery<RevenueData[]>({
    queryKey: ['/api/yahoo-finance/revenue', symbol],
    queryFn: async () => {
      // This will be replaced with actual API data when endpoint is available
      
      // Different revenue data based on the symbol
      let mockRevenue: RevenueData[];
      
      if (symbol === 'AAPL') {
        mockRevenue = [
          { year: '2020', value: 274.5, growth: '+5.5%' },
          { year: '2021', value: 365.8, growth: '+33.3%' },
          { year: '2022', value: 394.3, growth: '+7.8%' },
          { year: '2023', value: 383.3, growth: '-2.8%' },
          { year: '2024', value: 400.9, growth: '+4.6%' },
        ];
      } else if (symbol === 'MSFT') {
        mockRevenue = [
          { year: '2020', value: 143.0, growth: '+13.6%' },
          { year: '2021', value: 168.1, growth: '+17.5%' },
          { year: '2022', value: 198.3, growth: '+18.0%' },
          { year: '2023', value: 211.9, growth: '+6.9%' },
          { year: '2024', value: 227.6, growth: '+7.4%' },
        ];
      } else {
        mockRevenue = [
          { year: '2020', value: 122.3, growth: '+8.2%' },
          { year: '2021', value: 135.7, growth: '+10.9%' },
          { year: '2022', value: 149.2, growth: '+9.9%' },
          { year: '2023', value: 156.8, growth: '+5.1%' },
          { year: '2024', value: 168.4, growth: '+7.4%' },
        ];
      }
      
      return mockRevenue;
    },
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
    enabled: !!symbol,
  });
}