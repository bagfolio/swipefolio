import { Router } from 'express';
import { yahooFinanceService } from '../services/yahoo-finance-service';

const router = Router();

/**
 * Search for stocks
 * GET /api/yahoo-finance/search?query=AAPL
 */
router.get('/search', async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Query parameter is required' });
    }
    
    const results = await yahooFinanceService.searchStocks(query);
    return res.json(results);
  } catch (error) {
    console.error('Search error:', error);
    return res.status(500).json({ 
      error: 'Failed to search stocks',
      message: (error as Error).message 
    });
  }
});

/**
 * Get current quote for a symbol
 * GET /api/yahoo-finance/quote/AAPL
 */
router.get('/quote/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    
    if (!symbol) {
      return res.status(400).json({ error: 'Symbol is required' });
    }
    
    const quote = await yahooFinanceService.getQuote(symbol);
    return res.json(quote);
  } catch (error) {
    console.error(`Quote error for ${req.params.symbol}:`, error);
    return res.status(500).json({ 
      error: 'Failed to fetch quote',
      message: (error as Error).message 
    });
  }
});

/**
 * Get historical data for a symbol
 * GET /api/yahoo-finance/historical/AAPL?period1=2023-01-01&period2=2023-12-31&interval=1d
 */
router.get('/historical/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { period1, period2, interval } = req.query;
    
    if (!symbol) {
      return res.status(400).json({ error: 'Symbol is required' });
    }
    
    // Default to last 1 year of data if no dates provided
    const defaultPeriod1 = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const defaultPeriod2 = new Date().toISOString().split('T')[0];
    
    const data = await yahooFinanceService.getHistoricalData(
      symbol,
      typeof period1 === 'string' ? period1 : defaultPeriod1,
      typeof period2 === 'string' ? period2 : defaultPeriod2,
      (typeof interval === 'string' && ['1d', '1wk', '1mo'].includes(interval)) 
        ? interval as '1d' | '1wk' | '1mo' 
        : '1d'
    );
    
    return res.json(data);
  } catch (error) {
    console.error(`Historical data error for ${req.params.symbol}:`, error);
    return res.status(500).json({ 
      error: 'Failed to fetch historical data',
      message: (error as Error).message 
    });
  }
});

/**
 * Get company data for a symbol
 * GET /api/yahoo-finance/company/AAPL?modules=assetProfile,financialData,summaryDetail
 */
router.get('/company/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    let { modules } = req.query;
    
    if (!symbol) {
      return res.status(400).json({ error: 'Symbol is required' });
    }
    
    // Define valid module types based on Yahoo Finance API
    type ValidModuleType = "assetProfile" | "financialData" | "summaryDetail" | "quoteType" | 
                          "price" | "balanceSheetHistory" | "calendarEvents";
    
    // Default modules
    const defaultModules: ValidModuleType[] = ['assetProfile', 'financialData', 'summaryDetail'];
    
    // Parse modules if provided
    let moduleList: ValidModuleType[] = [...defaultModules];
    if (modules && typeof modules === 'string') {
      // The Yahoo Finance API has specific module types, we need to validate them
      const validModules = modules.split(',').filter(m => 
        ['assetProfile', 'financialData', 'summaryDetail', 'quoteType', 
         'balanceSheetHistory', 'calendarEvents', 'price'].includes(m)
      ) as ValidModuleType[];
      
      if (validModules.length > 0) {
        moduleList = validModules;
      }
    }
    
    const data = await yahooFinanceService.getCompanyData(symbol, moduleList);
    return res.json(data);
  } catch (error) {
    console.error(`Company data error for ${req.params.symbol}:`, error);
    return res.status(500).json({ 
      error: 'Failed to fetch company data',
      message: (error as Error).message 
    });
  }
});

/**
 * Get recommendations for a symbol
 * GET /api/yahoo-finance/recommendations/AAPL
 */
router.get('/recommendations/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    
    if (!symbol) {
      return res.status(400).json({ error: 'Symbol is required' });
    }
    
    const data = await yahooFinanceService.getRecommendations(symbol);
    return res.json(data);
  } catch (error) {
    console.error(`Recommendations error for ${req.params.symbol}:`, error);
    return res.status(500).json({ 
      error: 'Failed to fetch recommendations',
      message: (error as Error).message 
    });
  }
});

/**
 * Get trending symbols
 * GET /api/yahoo-finance/trending?region=US
 */
router.get('/trending', async (req, res) => {
  try {
    const { region } = req.query;
    
    const data = await yahooFinanceService.getTrendingSymbols(
      typeof region === 'string' ? region : 'US'
    );
    
    return res.json(data);
  } catch (error) {
    console.error('Trending symbols error:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch trending symbols',
      message: (error as Error).message 
    });
  }
});

/**
 * Get chart data for a symbol
 * GET /api/yahoo-finance/chart/AAPL?interval=1d&range=1mo
 */
router.get('/chart/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { interval, range } = req.query;
    
    if (!symbol) {
      return res.status(400).json({ error: 'Symbol is required' });
    }
    
    // Validate interval
    let validInterval: "1d" | "1wk" | "1mo" = "1d";
    if (
      typeof interval === 'string' && 
      (interval === "1d" || interval === "1wk" || interval === "1mo")
    ) {
      validInterval = interval;
    }
    
    const data = await yahooFinanceService.getChartData(
      symbol,
      validInterval,
      typeof range === 'string' ? range : '1mo'
    );
    
    return res.json(data);
  } catch (error) {
    console.error(`Chart data error for ${req.params.symbol}:`, error);
    return res.status(500).json({ 
      error: 'Failed to fetch chart data',
      message: (error as Error).message 
    });
  }
});

/**
 * Get formatted stock data (combined data from multiple endpoints)
 * GET /api/yahoo-finance/stock/AAPL
 */
router.get('/stock/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    
    if (!symbol) {
      return res.status(400).json({ error: 'Symbol is required' });
    }
    
    const data = await yahooFinanceService.getFormattedStockData(symbol);
    return res.json(data);
  } catch (error) {
    console.error(`Formatted stock data error for ${req.params.symbol}:`, error);
    return res.status(500).json({ 
      error: 'Failed to fetch formatted stock data',
      message: (error as Error).message 
    });
  }
});

export default router;