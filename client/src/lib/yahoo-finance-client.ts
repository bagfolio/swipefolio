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
 * Hook to query Yahoo Finance dividend data
 * Currently returns mock data - will be replaced with actual API data
 */
export function useYahooDividendData(symbol: string) {
  return useQuery<DividendData>({
    queryKey: ['/api/yahoo-finance/dividend', symbol],
    queryFn: async () => {
      // This will be replaced with actual API data when endpoint is available
      // For now, return test data based on the symbol
      const mockResponse: DividendData = {
        symbol,
        dividendYield: symbol === 'AAPL' ? 0.5 : 
                       symbol === 'MSFT' ? 0.8 : 
                       symbol === 'GOOGL' ? 0.0 : 0.4,
        sectorMedian: 2.1,
        marketMedian: 3.9,
        payoutAmount: symbol === 'AAPL' ? 0.24 : 
                      symbol === 'MSFT' ? 0.68 : 0.0,
        lastPaidDate: 'Aug 11, 2023'
      };
      
      return mockResponse;
    },
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
    enabled: !!symbol,
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
 * Hook to query Yahoo Finance revenue data
 * Currently returns mock data - will be replaced with actual API data
 */
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