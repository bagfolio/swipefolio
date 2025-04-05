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
  
  // Handle numeric timestamps
  if (typeof dateInput === 'number' || !isNaN(parseInt(String(dateInput), 10))) {
    const timestamp = typeof dateInput === 'number' ? dateInput : parseInt(String(dateInput), 10);
    
    // Unix timestamp (seconds since epoch)
    if (timestamp < 10000000000) {
      const date = new Date(timestamp * 1000);
      
      // Validate the resulting year is reasonable (within 5 years of current date)
      if (date.getFullYear() >= (currentYear - 5) && date.getFullYear() <= (currentYear + 1)) {
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
      if (date.getFullYear() >= (currentYear - 5) && date.getFullYear() <= (currentYear + 1)) {
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
      if (directDate.getFullYear() >= (currentYear - 5) && directDate.getFullYear() <= (currentYear + 1)) {
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
      if (parsedDate.getFullYear() >= (currentYear - 5) && parsedDate.getFullYear() <= (currentYear + 1)) {
        return parsedDate;
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

      const stockDividends = extractDividendEvents(stockData);
      const vooDividends = extractDividendEvents(vooData);
      const allDates = [...stockDividends, ...vooDividends].map(div => parseSafeDividendDate(div.date));
      const sortedDates = allDates.sort((a, b) => a.getTime() - b.getTime());
      const quarters: string[] = [];
      const seenQuarters = new Set<string>();

      sortedDates.forEach(date => {
        const quarter = `Q${Math.floor(date.getMonth() / 3) + 1} ${date.getFullYear()}`;
        if (!seenQuarters.has(quarter)) {
          seenQuarters.add(quarter);
          quarters.push(quarter);
        }
      });

      // Adjust the number of quarters to show based on the timeFrame
      let numQuarters = 8; // Default for 1Y-2Y
      
      if (timeFrame === '3Y') {
        numQuarters = 12; // Show 3 years (12 quarters)
      } else if (timeFrame === '5Y' || timeFrame === 'MAX') {
        numQuarters = 20; // Show 5 years (20 quarters)
      }
      
      // Get the most recent quarters based on the timeFrame
      const recentQuarters = quarters.slice(-numQuarters);
      const stockDividendValues: number[] = [];
      const vooDividendValues: number[] = [];

      recentQuarters.forEach(quarter => {
        const [q, year] = quarter.split(' ');
        const quarterNum = parseInt(q.substring(1)) - 1;
        const yearNum = parseInt(year);
        const startMonth = quarterNum * 3;
        const endMonth = startMonth + 3;
        const startDate = new Date(yearNum, startMonth, 1);
        const endDate = new Date(yearNum, endMonth, 0);

        const stockDiv = stockDividends.find((div: YahooDividendEvent) => {
          const divDate = parseSafeDividendDate(div.date);
          return divDate >= startDate && divDate <= endDate;
        });
        const vooDiv = vooDividends.find((div: YahooDividendEvent) => {
          const divDate = parseSafeDividendDate(div.date);
          return divDate >= startDate && divDate <= endDate;
        });

        stockDividendValues.push(stockDiv ? stockDiv.amount : 0);
        vooDividendValues.push(vooDiv ? vooDiv.amount : 0);
      });

      const stockYields: number[] = [];
      const vooYields: number[] = [];
      
      console.log(`[DEBUG] Calculating dividend yields for ${symbol} vs VOO (S&P 500 ETF)`);
      console.log(`[DEBUG] Stock dividend events:`, stockData.events?.dividends);
      console.log(`[DEBUG] VOO dividend events:`, vooData.events?.dividends);
      console.log(`[DEBUG] Recent quarters:`, recentQuarters);
      console.log(`[DEBUG] Stock dividend values:`, stockDividendValues);
      console.log(`[DEBUG] VOO dividend values:`, vooDividendValues);

      recentQuarters.forEach((quarter, index) => {
        const stockDiv = stockDividendValues[index];
        const vooDiv = vooDividendValues[index];
        const [q, year] = quarter.split(' ');
        const quarterNum = parseInt(q.substring(1)) - 1;
        const yearNum = parseInt(year);
        const endMonth = (quarterNum * 3) + 2;
        const endDate = new Date(yearNum, endMonth, 31);
        console.log(`[DEBUG] Quarter: ${quarter}, End date: ${endDate.toISOString()}`);

        // Try to find a quote close to the end of the quarter for the stock
        let stockPrice = 0;
        if (stockData.quotes && stockData.quotes.length > 0) {
          const lastQuoteBeforeEnd = stockData.quotes
            .filter((quote: YahooChartQuote) => new Date(quote.date) <= endDate)
            .sort((a: YahooChartQuote, b: YahooChartQuote) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
          
          if (lastQuoteBeforeEnd) {
            stockPrice = lastQuoteBeforeEnd.close;
            console.log(`[DEBUG] ${symbol} price for ${quarter}: $${stockPrice.toFixed(2)} (${lastQuoteBeforeEnd.date})`);
          } else {
            // Fall back to the last quote
            stockPrice = stockData.quotes[stockData.quotes.length - 1].close;
            console.log(`[DEBUG] ${symbol} fallback price: $${stockPrice.toFixed(2)}`);
          }
        } else {
          console.log(`[DEBUG] No quote data available for ${symbol}`);
        }
        
        // Do the same for VOO
        let vooPrice = 0;
        if (vooData.quotes && vooData.quotes.length > 0) {
          const lastQuoteBeforeEnd = vooData.quotes
            .filter((quote: YahooChartQuote) => new Date(quote.date) <= endDate)
            .sort((a: YahooChartQuote, b: YahooChartQuote) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
          
          if (lastQuoteBeforeEnd) {
            vooPrice = lastQuoteBeforeEnd.close;
            console.log(`[DEBUG] VOO price for ${quarter}: $${vooPrice.toFixed(2)} (${lastQuoteBeforeEnd.date})`);
          } else {
            // Fall back to the last quote
            vooPrice = vooData.quotes[vooData.quotes.length - 1].close;
            console.log(`[DEBUG] VOO fallback price: $${vooPrice.toFixed(2)}`);
          }
        } else {
          console.log(`[DEBUG] No quote data available for VOO`);
        }
        
        // Calculate quarterly dividend yield
        const stockQuarterlyYield = stockPrice > 0 ? (stockDiv / stockPrice) * 100 : 0;
        const vooQuarterlyYield = vooPrice > 0 ? (vooDiv / vooPrice) * 100 : 0;
        
        // Annualize the yield (multiply by 4 for quarterly)
        const annualizedStockYield = stockQuarterlyYield * 4;
        const annualizedVOOYield = vooQuarterlyYield * 4;
        
        console.log(`[DEBUG] ${quarter} - ${symbol} div: $${stockDiv.toFixed(4)}, yield: ${annualizedStockYield.toFixed(2)}%`);
        console.log(`[DEBUG] ${quarter} - VOO div: $${vooDiv.toFixed(4)}, yield: ${annualizedVOOYield.toFixed(2)}%`);
        
        stockYields.push(annualizedStockYield);
        vooYields.push(annualizedVOOYield);
      });

      // Calculate summary statistics
      const totalStockDividend = stockDividendValues.reduce((sum, div) => sum + div, 0);
      const totalVooDividend = vooDividendValues.reduce((sum, div) => sum + div, 0);
      
      const avgStockDividend = stockDividendValues.length > 0 
        ? totalStockDividend / stockDividendValues.filter(div => div > 0).length 
        : 0;
      const avgVooDividend = vooDividendValues.length > 0 
        ? totalVooDividend / vooDividendValues.filter(div => div > 0).length 
        : 0;
      
      const avgStockYield = stockYields.length > 0 
        ? stockYields.reduce((sum, yield_val) => sum + yield_val, 0) / stockYields.filter(yield_val => yield_val > 0).length 
        : 0;
      const avgVooYield = vooYields.length > 0 
        ? vooYields.reduce((sum, yield_val) => sum + yield_val, 0) / vooYields.filter(yield_val => yield_val > 0).length 
        : 0;
        
      return {
        quarters: recentQuarters,
        stockDividends: stockDividendValues,
        sp500Dividends: vooDividendValues, // Keep property name for backward compatibility
        stockYields: stockYields,
        sp500Yields: vooYields, // Keep property name for backward compatibility
        stockSymbol: symbol,
        summary: {
          totalStockDividend,
          totalVooDividend,
          avgStockDividend,
          avgVooDividend,
          avgStockYield,
          avgVooYield,
          timeFrameYears: timeFrame === '1Y' ? 1 : timeFrame === '2Y' ? 2 : timeFrame === '3Y' ? 3 : timeFrame === '5Y' ? 5 : 5
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