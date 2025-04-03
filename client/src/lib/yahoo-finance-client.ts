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
  
  return useQuery<YahooChartResponse>({
    queryKey: ['/api/yahoo-finance/chart', symbol, range],
    queryFn: async () => fetchStockChartData(symbol, range),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!symbol,
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