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
  date: string | number;   // Date of dividend (can be string or Unix timestamp)
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

export interface UpgradeHistoryItem {
  firm: string;
  toGrade: string;
  fromGrade: string;
  action: 'upgrade' | 'downgrade' | 'maintain' | 'init' | 'reiterated';
  date: string;
  epochGradeDate: number;
}

export const timeFrameToRange: Record<string, string> = {
  "1D": "1d",
  "5D": "5d",
  "1M": "1mo",
  "3M": "3mo",
  "6M": "6mo",
  "1Y": "1y",
  "3Y": "3y", // Add 3Y mapping explicitly
  "5Y": "5y",
  "MAX": "max"
};

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

export function useYahooChartData(symbol: string, timeFrame: string) {
  const range = timeFrameToRange[timeFrame] || "1mo";
  return useQuery<YahooChartResponse>({
    queryKey: ['/api/yahoo-finance/chart', symbol, range],
    queryFn: async () => fetchStockChartData(symbol, range),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!symbol,
  });
}

export function useSP500ChartData(timeFrame: string) {
  const range = timeFrameToRange[timeFrame] || "1mo";
  return useQuery<YahooChartResponse>({
    queryKey: ['/api/yahoo-finance/chart', '^GSPC', range],
    queryFn: async () => fetchStockChartData('^GSPC', range),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function extractChartPrices(chartData?: YahooChartResponse): number[] {
  if (!chartData?.quotes || chartData.quotes.length === 0) {
    return [];
  }
  return chartData.quotes.map(quote => quote.close);
}

export function getYahooTimeScaleLabels(timeFrame: string, chartData?: YahooChartResponse): string[] {
  if (!chartData?.quotes || chartData.quotes.length === 0) {
    return ["", "", "", "", ""];
  }
  const maxLabels = 5;
  const quotes = chartData.quotes;
  const labelCount = Math.min(maxLabels, quotes.length);

  if (labelCount <= 1) return [formatDateByTimeFrame(quotes[0].date, timeFrame)];

  const result: string[] = [];
  const step = Math.floor(quotes.length / (labelCount - 1));

  for (let i = 0; i < labelCount - 1; i++) {
    const index = i * step;
    result.push(formatDateByTimeFrame(quotes[index].date, timeFrame));
  }
  result.push(formatDateByTimeFrame(quotes[quotes.length - 1].date, timeFrame));

  return result;
}

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
    case "3Y": // Add explicit 3Y case
      return date.toLocaleDateString([], { month: 'short', year: 'numeric' });
    case "5Y":
    case "MAX":
      return date.getFullYear().toString();
    default:
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
}

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

export function useAnalystRecommendations(symbol: string) {
  return useQuery<AnalystRecommendation>({
    queryKey: ['/api/yahoo-finance/recommendations', symbol],
    queryFn: async () => fetchAnalystRecommendations(symbol),
    staleTime: 24 * 60 * 60 * 1000, // 24 hours since analyst ratings don't change frequently
    enabled: !!symbol,
  });
}

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

export function useUpgradeHistory(symbol: string) {
  return useQuery<UpgradeHistoryItem[]>({
    queryKey: ['/api/yahoo-finance/upgrade-history', symbol],
    queryFn: async () => fetchUpgradeHistory(symbol),
    staleTime: 24 * 60 * 60 * 1000, // 24 hours since analyst ratings don't change frequently
    enabled: !!symbol,
  });
}

export interface DividendData {
  symbol: string;
  dividendYield: number;
  sectorMedian: number;
  marketMedian: number;
  payoutAmount: number;
  lastPaidDate: string | number;
}

export interface DividendChartData {
  name: string;
  value: number;
  type: string;
}

export interface DividendComparisonData {
  quarters: string[];
  stockDividends: number[];
  sp500Dividends: number[]; // Actually VOO dividends but kept for backwards compatibility
  stockYields: number[];
  sp500Yields: number[]; // Actually VOO yields but kept for backwards compatibility
  stockSymbol: string;
  summary?: {
    timeFrameYears: number;
    totalStockDividend: number;
    totalVooDividend: number;
    avgStockYield: number;
    avgVooYield: number;
  };
}

export interface EarningsData {
  quarter: string;
  actual: number;
  expected: number;
  surprise: string;
  date: string;
}

export interface RevenueData {
  year: string;
  value: number;
  growth?: string;
}

export function extractDividendEvents(chartData?: YahooChartResponse): YahooDividendEvent[] {
  if (!chartData?.events?.dividends || !Array.isArray(chartData.events.dividends)) {
    return [];
  }

  return chartData.events.dividends.map(div => ({
    date: div.date, // Preserve original date format for safe parsing later
    amount: div.amount
  })).sort((a, b) => {
    const dateA = parseSafeDividendDate(a.date);
    const dateB = parseSafeDividendDate(b.date);
    return dateB.getTime() - dateA.getTime(); // Descending order
  });
}

export function formatDividendEventsForChart(dividendEvents: YahooDividendEvent[], spYield: number = 1.5): { name: string; value: number; type: string }[] {
  if (!dividendEvents || dividendEvents.length === 0) {
    return [];
  }

  const sortedEvents = [...dividendEvents].sort((a, b) => {
    const dateA = parseSafeDividendDate(a.date);
    const dateB = parseSafeDividendDate(b.date);
    return dateA.getTime() - dateB.getTime();
  });

  return sortedEvents.map((div, index) => {
    let formattedDate = "Unknown";
    try {
      const date = parseSafeDividendDate(div.date);
      const year = date.getFullYear();
      const currentYear = new Date().getFullYear();

      if (year < 2000 || year > currentYear) {
        if (typeof div.date === 'string' && !isNaN(parseInt(div.date, 10))) {
          const timestamp = parseInt(div.date, 10) * 1000;
          const timestampDate = new Date(timestamp);

          if (timestampDate.getFullYear() >= 2000 && timestampDate.getFullYear() <= currentYear) {
            formattedDate = timestampDate.toLocaleDateString(undefined, { 
              month: 'short', 
              year: 'numeric' 
            });
            console.log(`Using valid date conversion for timestamp ${div.date} → ${timestampDate.toISOString()}`);
          } else {
            const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
            const currentQuarter = Math.floor((new Date().getMonth() / 3));
            formattedDate = `${quarters[currentQuarter]} ${currentYear}`;
          }
        } else {
          const parts = typeof div.date === 'string' ? div.date.split(' ') : [];
          if (parts.length > 1) {
            formattedDate = `${parts[0]} ${currentYear}`;
          } else {
            const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
            const currentQuarter = Math.floor((new Date().getMonth() / 3));
            formattedDate = `${quarters[currentQuarter]} ${currentYear}`;
          }
        }
      } else {
        formattedDate = date.toLocaleDateString(undefined, { 
          month: 'short', 
          year: 'numeric' 
        });
      }
    } catch (e) {
      console.error("Error formatting dividend date:", e);
      formattedDate = `Payment ${index + 1}`;
    }

    return {
      name: formattedDate,
      value: div.amount,
      type: 'Dividend Payment'
    };
  });
}

function parseSafeDividendDate(dateInput: string | number): Date {
  // Always try to use current time for logging purposes
  const currentYear = new Date().getFullYear();
  const fallbackDate = new Date();
  // Allow dates up to 20 years in the past for MAX timeframe support
  const minYear = currentYear - 20;
  
  // Handle numeric timestamps
  if (typeof dateInput === 'number' || !isNaN(parseInt(String(dateInput), 10))) {
    const timestamp = typeof dateInput === 'number' ? dateInput : parseInt(String(dateInput), 10);
    
    // Unix timestamp (seconds since epoch)
    if (timestamp < 10000000000) {
      const date = new Date(timestamp * 1000);
      
      // Validate the resulting year is reasonable (within 20 years of current date)
      if (date.getFullYear() >= minYear && date.getFullYear() <= (currentYear + 1)) {
        console.log(`Valid date from seconds: ${timestamp} → ${date.toISOString()}`);
        return date;
      } else {
        console.log(`Invalid year (${date.getFullYear()}) from seconds timestamp: ${timestamp}`);
        // For dividend data, recent dates are more important, so we'll adjust
        return fallbackDate;
      }
    } else {
      // JavaScript timestamp (milliseconds since epoch)
      const date = new Date(timestamp);
      if (date.getFullYear() >= minYear && date.getFullYear() <= (currentYear + 1)) {
        console.log(`Valid date from ms: ${timestamp} → ${date.toISOString()}`);
        return date;
      } else {
        console.log(`Invalid year (${date.getFullYear()}) from ms timestamp: ${timestamp}`);
        return fallbackDate;
      }
    }
  }

  // Handle string dates
  if (typeof dateInput === 'string') {
    // Try direct parsing
    const directDate = new Date(dateInput);
    if (!isNaN(directDate.getTime())) {
      // Validate the year is reasonable
      if (directDate.getFullYear() >= minYear && directDate.getFullYear() <= (currentYear + 1)) {
        return directDate;
      }
    }

    // Try to match date patterns
    const datePattern = /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/;
    const match = dateInput.match(datePattern);
    if (match) {
      const [_, month, day, year] = match;
      const parsedDate = new Date(
        parseInt(year.length === 2 ? `20${year}` : year, 10),
        parseInt(month, 10) - 1,
        parseInt(day, 10)
      );
      
      // Validate the year
      if (parsedDate.getFullYear() >= minYear && parsedDate.getFullYear() <= (currentYear + 1)) {
        return parsedDate;
      }
    }
    
    // Try to parse Unix timestamp in string format
    if (/^\d+$/.test(dateInput)) {
      const timestamp = parseInt(dateInput, 10);
      if (!isNaN(timestamp)) {
        // Determine if it's seconds or milliseconds
        const date = timestamp < 10000000000 
          ? new Date(timestamp * 1000) // seconds
          : new Date(timestamp);       // milliseconds
        
        if (date.getFullYear() >= minYear && date.getFullYear() <= (currentYear + 1)) {
          return date;
        }
      }
    }
  }

  // If we get here, we couldn't parse a reasonable date
  console.log(`Could not parse date: ${dateInput}, using current date`);
  return fallbackDate;
}

export function calculateDividendYield(currentPrice: number, annualDividend: number): number {
  if (!currentPrice || !annualDividend || currentPrice <= 0) {
    return 0;
  }
  return (annualDividend / currentPrice) * 100;
}

export function useYahooDividendData(symbol: string, timeFrame: string = '1Y') {
  const range = timeFrameToRange[timeFrame] || "1y";
  const chartDataQuery = useQuery<YahooChartResponse>({
    queryKey: ['/api/yahoo-finance/chart', symbol, range, 'dividends'],
    queryFn: async () => fetchStockChartData(symbol, range),
    staleTime: 60 * 60 * 1000, // 1 hour
    enabled: !!symbol,
  });

  return useQuery<DividendData>({
    queryKey: ['/api/yahoo-finance/dividend', symbol, range],
    queryFn: async () => {
      const chartData = chartDataQuery.data;

      if (!chartData) {
        throw new Error('Chart data not available');
      }

      const dividendEvents = extractDividendEvents(chartData);
      const currentPrice = chartData.meta.regularMarketPrice || 
                          (chartData.quotes && chartData.quotes.length > 0 
                            ? chartData.quotes[chartData.quotes.length - 1].close 
                            : 0);
      const recentDividends = dividendEvents.slice(0, 4);
      let totalDividends = recentDividends.reduce((sum, div) => sum + div.amount, 0);
      let annualDividend = totalDividends;
      if (recentDividends.length > 0 && recentDividends.length < 4) {
        annualDividend = (totalDividends / recentDividends.length) * 4;
      }

      const dividendYield = calculateDividendYield(currentPrice, annualDividend);
      const lastPaidDate = dividendEvents.length > 0 ? dividendEvents[0].date : 'N/A';
      const payoutAmount = dividendEvents.length > 0 ? dividendEvents[0].amount : 0;

      return {
        symbol,
        dividendYield,
        sectorMedian: 2.1,
        marketMedian: 1.5,
        payoutAmount,
        lastPaidDate
      };
    },
    staleTime: 60 * 60 * 1000, // 1 hour
    enabled: !!symbol && chartDataQuery.isSuccess,
  });
}

export function useYahooEarningsData(symbol: string) {
  return useQuery<EarningsData[]>({
    queryKey: ['/api/yahoo-finance/earnings', symbol],
    queryFn: async () => {
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

// Use this to get the most recent dividend regardless of timeframe
export function useYahooLatestDividend(symbol: string) {
  // Always use 5y range to ensure we get the most recent dividend
  const range = "5y";
  const chartDataQuery = useQuery<YahooChartResponse>({
    queryKey: ['/api/yahoo-finance/chart', symbol, range, 'latest-dividend'],
    queryFn: async () => fetchStockChartData(symbol, range),
    staleTime: 60 * 60 * 1000, // 1 hour
    enabled: !!symbol,
  });

  return useQuery<DividendChartData | null>({
    queryKey: ['/api/yahoo-finance/latest-dividend', symbol],
    queryFn: async () => {
      const chartData = chartDataQuery.data;

      if (!chartData) {
        return null;
      }

      const dividendEvents = extractDividendEvents(chartData);
      const formattedDividends = formatDividendEventsForChart(dividendEvents);
      
      // Return the most recent dividend or null if none found
      return formattedDividends.length > 0 ? formattedDividends[0] : null;
    },
    staleTime: 60 * 60 * 1000, // 1 hour
    enabled: !!symbol && chartDataQuery.isSuccess,
  });
}

export function useYahooDividendEvents(symbol: string, timeFrame: string) {
  const range = timeFrameToRange[timeFrame] || "1y";
  const chartDataQuery = useQuery<YahooChartResponse>({
    queryKey: ['/api/yahoo-finance/chart', symbol, range, 'dividends'],
    queryFn: async () => fetchStockChartData(symbol, range),
    staleTime: 60 * 60 * 1000, // 1 hour
    enabled: !!symbol,
  });

  return useQuery<DividendChartData[]>({
    queryKey: ['/api/yahoo-finance/dividend-events', symbol, range],
    queryFn: async () => {
      const chartData = chartDataQuery.data;

      if (!chartData) {
        return [];
      }

      const dividendEvents = extractDividendEvents(chartData);
      return formatDividendEventsForChart(dividendEvents);
    },
    staleTime: 60 * 60 * 1000, // 1 hour
    enabled: !!symbol && chartDataQuery.isSuccess,
  });
}

export function useYahooDividendComparison(symbol: string, timeFrame: string) {
  const range = timeFrameToRange[timeFrame] || "1y";
  const stockChartQuery = useQuery<YahooChartResponse>({
    queryKey: ['/api/yahoo-finance/chart', symbol, range, 'dividends'],
    queryFn: async () => fetchStockChartData(symbol, range),
    staleTime: 60 * 60 * 1000, // 1 hour
    enabled: !!symbol,
  });
  // Use VOO (Vanguard S&P 500 ETF) instead of ^GSPC for better dividend data
  const vooChartQuery = useQuery<YahooChartResponse>({
    queryKey: ['/api/yahoo-finance/chart', 'VOO', range, 'dividends'],
    queryFn: async () => fetchStockChartData('VOO', range),
    staleTime: 60 * 60 * 1000, // 1 hour
    enabled: !!symbol,
  });

  return useQuery<DividendComparisonData>({
    queryKey: ['/api/yahoo-finance/dividend-comparison', symbol, 'VOO', range],
    queryFn: async () => {
      const stockData = stockChartQuery.data;
      const vooData = vooChartQuery.data;

      if (!stockData || !vooData) {
        throw new Error('Chart data not available');
      }
      
      // Extract dividend events and convert to normal Date objects
      const stockDividends = extractDividendEvents(stockData).map(div => ({
        ...div,
        dateObj: parseSafeDividendDate(div.date)
      }));
      
      const vooDividends = extractDividendEvents(vooData).map(div => ({
        ...div,
        dateObj: parseSafeDividendDate(div.date)
      }));
      
      console.log(`[DEBUG] Processing dividend data for timeFrame: ${timeFrame}`);
      console.log(`[DEBUG] Stock dividend count: ${stockDividends.length}`);
      console.log(`[DEBUG] VOO dividend count: ${vooDividends.length}`);
      
      // Determine the time range to use based on the timeFrame
      const now = new Date();
      let startDate: Date;
      
      // Set appropriate start date based on timeFrame
      switch(timeFrame) {
        case '1Y':
          startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
          break;
        case '3Y':
          startDate = new Date(now.getFullYear() - 3, now.getMonth(), now.getDate());
          break;
        case '5Y':
          startDate = new Date(now.getFullYear() - 5, now.getMonth(), now.getDate());
          break;
        case 'MAX':
          startDate = new Date(2000, 0, 1); // Reasonable starting point
          break;
        default:
          startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
      }
      
      console.log(`[DEBUG] Using start date: ${startDate.toISOString()} for timeFrame: ${timeFrame}`);
      
      // Filter dividends to the chosen time range
      const filteredStockDividends = stockDividends
        .filter(div => div.dateObj >= startDate)
        .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());
      
      const filteredVooDividends = vooDividends
        .filter(div => div.dateObj >= startDate)
        .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());
      
      console.log(`[DEBUG] Filtered stock dividend count: ${filteredStockDividends.length}`);
      console.log(`[DEBUG] Filtered VOO dividend count: ${filteredVooDividends.length}`);
      
      // Generate a complete set of quarters for the time range
      const quarters: string[] = [];
      const startYear = startDate.getFullYear();
      const startQuarter = Math.floor(startDate.getMonth() / 3) + 1;
      const endYear = now.getFullYear();
      const endQuarter = Math.floor(now.getMonth() / 3) + 1;
      
      // Generate all quarters in the range
      for (let year = startYear; year <= endYear; year++) {
        const startQ = (year === startYear) ? startQuarter : 1;
        const endQ = (year === endYear) ? endQuarter : 4;
        
        for (let quarter = startQ; quarter <= endQ; quarter++) {
          quarters.push(`Q${quarter} ${year}`);
        }
      }
      
      console.log(`[DEBUG] Generated ${quarters.length} quarters from ${quarters[0]} to ${quarters[quarters.length - 1]}`);
      
      // Calculate dividend values for each quarter
      const stockDividendValues: number[] = [];
      const vooDividendValues: number[] = [];
      const stockYields: number[] = [];
      const vooYields: number[] = [];
      
      quarters.forEach((quarter, index) => {
        const [q, year] = quarter.split(' ');
        const quarterNum = parseInt(q.substring(1)) - 1; // Q1 -> 0, Q2 -> 1, etc.
        const yearNum = parseInt(year);
        const startMonth = quarterNum * 3;
        const endMonth = startMonth + 2; // End month is inclusive (0-2, 3-5, 6-8, 9-11)
        const startDate = new Date(yearNum, startMonth, 1);
        const endDate = new Date(yearNum, endMonth, 31); // Set to max day, Date() will adjust
        
        // Find dividend for this quarter
        const stockDiv = filteredStockDividends.find(div => 
          div.dateObj >= startDate && div.dateObj <= endDate
        );
        
        const vooDiv = filteredVooDividends.find(div => 
          div.dateObj >= startDate && div.dateObj <= endDate
        );
        
        // Add the dividend amount for this quarter
        const stockDivAmount = stockDiv ? stockDiv.amount : 0;
        const vooDivAmount = vooDiv ? vooDiv.amount : 0;
        
        stockDividendValues.push(stockDivAmount);
        vooDividendValues.push(vooDivAmount);
        
        // Find stock prices near end of quarter
        let stockPrice = 0;
        let vooPrice = 0;
        
        // Try to find matching prices near the end of the quarter
        if (stockData.quotes && stockData.quotes.length > 0) {
          const quotesNearEnd = stockData.quotes.filter(quote => {
            const quoteDate = new Date(quote.date);
            // Include quotes within the quarter or slightly after
            return quoteDate >= startDate && quoteDate <= new Date(endDate.getTime() + 7 * 24 * 60 * 60 * 1000);
          });
          
          if (quotesNearEnd.length > 0) {
            // Sort by date to find the closest to end of quarter
            quotesNearEnd.sort((a, b) => 
              Math.abs(new Date(b.date).getTime() - endDate.getTime()) - 
              Math.abs(new Date(a.date).getTime() - endDate.getTime())
            );
            
            stockPrice = quotesNearEnd[0].close;
            console.log(`[DEBUG] ${symbol} price for ${quarter}: $${stockPrice.toFixed(2)} (${quotesNearEnd[0].date})`);
          } else {
            // Fallback: use the last available quote
            stockPrice = stockData.quotes[stockData.quotes.length - 1].close;
            console.log(`[DEBUG] ${symbol} fallback price for ${quarter}: $${stockPrice.toFixed(2)}`);
          }
        }
        
        // Similarly for VOO
        if (vooData.quotes && vooData.quotes.length > 0) {
          const quotesNearEnd = vooData.quotes.filter(quote => {
            const quoteDate = new Date(quote.date);
            return quoteDate >= startDate && quoteDate <= new Date(endDate.getTime() + 7 * 24 * 60 * 60 * 1000);
          });
          
          if (quotesNearEnd.length > 0) {
            quotesNearEnd.sort((a, b) => 
              Math.abs(new Date(b.date).getTime() - endDate.getTime()) - 
              Math.abs(new Date(a.date).getTime() - endDate.getTime())
            );
            
            vooPrice = quotesNearEnd[0].close;
            console.log(`[DEBUG] VOO price for ${quarter}: $${vooPrice.toFixed(2)} (${quotesNearEnd[0].date})`);
          } else {
            vooPrice = vooData.quotes[vooData.quotes.length - 1].close;
            console.log(`[DEBUG] VOO fallback price for ${quarter}: $${vooPrice.toFixed(2)}`);
          }
        }
        
        // Calculate quarterly yields
        const stockQuarterlyYield = stockPrice > 0 && stockDivAmount > 0 ? (stockDivAmount / stockPrice) * 100 : 0;
        const vooQuarterlyYield = vooPrice > 0 && vooDivAmount > 0 ? (vooDivAmount / vooPrice) * 100 : 0;
        
        // Annualize the yields (multiply by 4 for quarterly dividends)
        const annualizedStockYield = stockQuarterlyYield * 4;
        const annualizedVooYield = vooQuarterlyYield * 4;
        
        stockYields.push(annualizedStockYield);
        vooYields.push(annualizedVooYield);
        
        console.log(`[DEBUG] ${quarter} - ${symbol} div: $${stockDivAmount.toFixed(4)}, yield: ${annualizedStockYield.toFixed(2)}%`);
        console.log(`[DEBUG] ${quarter} - VOO div: $${vooDivAmount.toFixed(4)}, yield: ${annualizedVooYield.toFixed(2)}%`);
      });
      
      // Calculate summary statistics
      const totalStockDividend = stockDividendValues.reduce((sum, div) => sum + div, 0);
      const totalVooDividend = vooDividendValues.reduce((sum, div) => sum + div, 0);
      
      const nonZeroStockDividends = stockDividendValues.filter(div => div > 0);
      const nonZeroVooDividends = vooDividendValues.filter(div => div > 0);
      
      const avgStockYield = stockYields.filter(y => y > 0).length > 0 
        ? stockYields.filter(y => y > 0).reduce((sum, y) => sum + y, 0) / stockYields.filter(y => y > 0).length 
        : 0;
      
      const avgVooYield = vooYields.filter(y => y > 0).length > 0 
        ? vooYields.filter(y => y > 0).reduce((sum, y) => sum + y, 0) / vooYields.filter(y => y > 0).length 
        : 0;
        
      // Get time frame in years as a number
      const timeFrameYears = timeFrame === '1Y' ? 1 : 
                           timeFrame === '3Y' ? 3 : 
                           timeFrame === '5Y' ? 5 : 
                           timeFrame === 'MAX' ? 10 : 1;
                           
      console.log(`[DEBUG] Final summary: timeFrame=${timeFrameYears}yrs, total ${symbol}=${totalStockDividend.toFixed(2)}, total VOO=${totalVooDividend.toFixed(2)}`);
      console.log(`[DEBUG] Yields: avg ${symbol}=${avgStockYield.toFixed(2)}%, avg VOO=${avgVooYield.toFixed(2)}%`);
      
      return {
        quarters,
        stockDividends: stockDividendValues,
        sp500Dividends: vooDividendValues, // Keep property name for backward compatibility
        stockYields,
        sp500Yields: vooYields, // Keep property name for backward compatibility
        stockSymbol: symbol,
        summary: {
          timeFrameYears,
          totalStockDividend,
          totalVooDividend,
          avgStockYield,
          avgVooYield
        }
      };
    },
    staleTime: 60 * 60 * 1000, // 1 hour
    enabled: !!symbol && stockChartQuery.isSuccess && vooChartQuery.isSuccess,
  });
}

export function useYahooRevenueData(symbol: string) {
  return useQuery<RevenueData[]>({
    queryKey: ['/api/yahoo-finance/revenue', symbol],
    queryFn: async () => {
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