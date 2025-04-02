export interface StockData {
  ticker: string;
  symbol: string;  // Legacy field, same as ticker
  name: string;
  price: number;
  change: number;
  changePercent: number;
  industry: string;
  description: string;
  metrics: {
    performance: {
      value: number;
      color: 'green' | 'yellow' | 'red';
      details: {
        revenueGrowth: number;
        profitMargin: number;
        returnOnCapital: number;
        revenueGrowthExplanation?: string;
        profitMarginExplanation?: string;
        returnOnCapitalExplanation?: string;
      }
    };
    stability: {
      value: number;
      color: 'green' | 'yellow' | 'red';
      details: {
        volatility: number;
        beta: number;
        dividendConsistency: string;
        volatilityExplanation?: string;
        betaExplanation?: string;
        dividendConsistencyExplanation?: string;
      }
    };
    value: {
      value: number;
      color: 'green' | 'yellow' | 'red';
      details: {
        peRatio: number;
        pbRatio: number;
        dividendYield: number | "N/A";
        peRatioExplanation?: string;
        pbRatioExplanation?: string;
        dividendYieldExplanation?: string;
      }
    };
    momentum: {
      value: number;
      color: 'green' | 'yellow' | 'red';
      details: {
        threeMonthReturn: number;
        relativePerformance: number;
        rsi: number;
        threeMonthReturnExplanation?: string;
        relativePerformanceExplanation?: string;
        rsiExplanation?: string;
      }
    };
  };
  chartData: number[];
  predictedPrice: number;
  returnYear: number;
  quality: string;
  synopsis: {
    price: string;
    company: string;
    role: string;
  }
}

// Helper function to get stocks in the same industry
export function getIndustryStocks(industry: string, stockData: StockData[]): StockData[] {
  return stockData.filter(stock => stock.industry === industry);
}

// Helper function to get a stock by its ticker
export function getStockByTicker(ticker: string, stockData: StockData[]): StockData | undefined {
  return stockData.find(stock => stock.ticker === ticker || stock.symbol === ticker);
}

// Helper function to get stocks with similar performance
export function getSimilarStocks(stockMetrics: any, stockData: StockData[], limit: number = 5): StockData[] {
  // Sort by similarity to the given stock metrics
  return stockData
    .slice()
    .sort((a, b) => {
      const aDiff = Math.abs(a.metrics.performance.value - stockMetrics.performance.value);
      const bDiff = Math.abs(b.metrics.performance.value - stockMetrics.performance.value);
      return aDiff - bDiff;
    })
    .slice(0, limit);
}

// Helper function to get all available stocks
export function getAllStocks(stockData: StockData[]): StockData[] {
  return stockData;
}