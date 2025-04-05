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
  sp500Dividends: number[];
  stockYields: number[];
  sp500Yields: number[];
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
  if (typeof dateInput === 'number' || !isNaN(parseInt(String(dateInput), 10))) {
    const timestamp = typeof dateInput === 'number' ? dateInput : parseInt(String(dateInput), 10);
    if (timestamp < 10000000000) {
      return new Date(timestamp * 1000);
    } else {
      return new Date(timestamp);
    }
  }

  if (typeof dateInput === 'string') {
    const directDate = new Date(dateInput);
    if (!isNaN(directDate.getTime())) {
      return directDate;
    }

    const datePattern = /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/;
    const match = dateInput.match(datePattern);
    if (match) {
      const [_, month, day, year] = match;
      return new Date(
        parseInt(year.length === 2 ? `20${year}` : year, 10),
        parseInt(month, 10) - 1,
        parseInt(day, 10)
      );
    }
  }

  return new Date();
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
  const sp500ChartQuery = useQuery<YahooChartResponse>({
    queryKey: ['/api/yahoo-finance/chart', '^GSPC', range, 'dividends'],
    queryFn: async () => fetchStockChartData('^GSPC', range),
    staleTime: 60 * 60 * 1000, // 1 hour
    enabled: !!symbol,
  });

  return useQuery<DividendComparisonData>({
    queryKey: ['/api/yahoo-finance/dividend-comparison', symbol, '^GSPC', range],
    queryFn: async () => {
      const stockData = stockChartQuery.data;
      const sp500Data = sp500ChartQuery.data;

      if (!stockData || !sp500Data) {
        throw new Error('Chart data not available');
      }

      const stockDividends = extractDividendEvents(stockData);
      const sp500Dividends = extractDividendEvents(sp500Data);
      const allDates = [...stockDividends, ...sp500Dividends].map(div => parseSafeDividendDate(div.date));
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

      const recentQuarters = quarters.slice(-8);
      const stockDividendValues: number[] = [];
      const sp500DividendValues: number[] = [];

      recentQuarters.forEach(quarter => {
        const [q, year] = quarter.split(' ');
        const quarterNum = parseInt(q.substring(1)) - 1;
        const yearNum = parseInt(year);
        const startMonth = quarterNum * 3;
        const endMonth = startMonth + 3;
        const startDate = new Date(yearNum, startMonth, 1);
        const endDate = new Date(yearNum, endMonth, 0);

        const stockDiv = stockDividends.find(div => {
          const divDate = parseSafeDividendDate(div.date);
          return divDate >= startDate && divDate <= endDate;
        });
        const sp500Div = sp500Dividends.find(div => {
          const divDate = parseSafeDividendDate(div.date);
          return divDate >= startDate && divDate <= endDate;
        });

        stockDividendValues.push(stockDiv ? stockDiv.amount : 0);
        sp500DividendValues.push(sp500Div ? sp500Div.amount : 0);
      });

      const stockYields: number[] = [];
      const sp500Yields: number[] = [];
      
      console.log(`[DEBUG] Calculating dividend yields for ${symbol} vs S&P 500`);
      console.log(`[DEBUG] Stock dividend events:`, stockData.events?.dividends);
      console.log(`[DEBUG] S&P 500 dividend events:`, sp500Data.events?.dividends);
      console.log(`[DEBUG] Recent quarters:`, recentQuarters);
      console.log(`[DEBUG] Stock dividend values:`, stockDividendValues);
      console.log(`[DEBUG] S&P 500 dividend values:`, sp500DividendValues);

      recentQuarters.forEach((quarter, index) => {
        const stockDiv = stockDividendValues[index];
        const sp500Div = sp500DividendValues[index];
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
            .filter(quote => new Date(quote.date) <= endDate)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
          
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
        
        // Do the same for S&P 500
        let sp500Price = 0;
        if (sp500Data.quotes && sp500Data.quotes.length > 0) {
          const lastQuoteBeforeEnd = sp500Data.quotes
            .filter(quote => new Date(quote.date) <= endDate)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
          
          if (lastQuoteBeforeEnd) {
            sp500Price = lastQuoteBeforeEnd.close;
            console.log(`[DEBUG] S&P 500 price for ${quarter}: $${sp500Price.toFixed(2)} (${lastQuoteBeforeEnd.date})`);
          } else {
            // Fall back to the last quote
            sp500Price = sp500Data.quotes[sp500Data.quotes.length - 1].close;
            console.log(`[DEBUG] S&P 500 fallback price: $${sp500Price.toFixed(2)}`);
          }
        } else {
          console.log(`[DEBUG] No quote data available for S&P 500`);
        }
        
        // Calculate quarterly dividend yield
        const stockQuarterlyYield = stockPrice > 0 ? (stockDiv / stockPrice) * 100 : 0;
        const sp500QuarterlyYield = sp500Price > 0 ? (sp500Div / sp500Price) * 100 : 0;
        
        // Annualize the yield (multiply by 4 for quarterly)
        const annualizedStockYield = stockQuarterlyYield * 4;
        const annualizedSP500Yield = sp500QuarterlyYield * 4;
        
        console.log(`[DEBUG] ${quarter} - ${symbol} div: $${stockDiv.toFixed(4)}, yield: ${annualizedStockYield.toFixed(2)}%`);
        console.log(`[DEBUG] ${quarter} - S&P 500 div: $${sp500Div.toFixed(4)}, yield: ${annualizedSP500Yield.toFixed(2)}%`);
        
        stockYields.push(annualizedStockYield);
        sp500Yields.push(annualizedSP500Yield);
      });

      return {
        quarters: recentQuarters,
        stockDividends: stockDividendValues,
        sp500Dividends: sp500DividendValues,
        stockYields: stockYields,
        sp500Yields: sp500Yields,
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