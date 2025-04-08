import { Router } from 'express';
import { yahooFinanceService } from '../services/yahoo-finance-service';
import { getAnalystData } from '../../shared/services/analystRatingsService';
import { secService } from '../sec-service';

const router = Router();

/**
 * GET /api/yahoo-finance/chart/:symbol
 * Get chart data for a stock symbol
 */
router.get('/chart/:symbol', (req, res) => {
  yahooFinanceService.handleChartRequest(req, res);
});

/**
 * GET /api/yahoo-finance/news/:symbol
 * Get news data for a stock symbol
 */
router.get('/news/:symbol', (req, res) => {
  yahooFinanceService.handleNewsRequest(req, res);
});

/**
 * GET /api/yahoo-finance/recommendations/:symbol
 * Get analyst recommendations for a stock symbol
 */
router.get('/recommendations/:symbol', (req, res) => {
  yahooFinanceService.handleRecommendationsRequest(req, res);
});

/**
 * GET /api/yahoo-finance/upgrade-history/:symbol
 * Get analyst upgrade/downgrade history for a stock symbol
 */
router.get('/upgrade-history/:symbol', (req, res) => {
  yahooFinanceService.handleUpgradeHistoryRequest(req, res);
});

/**
 * GET /api/yahoo-finance/analyst-data/:symbol
 * Get comprehensive analyst data using the enhanced analystRatingsService
 * This endpoint provides a single, unified data object with all analyst information
 */
router.get('/analyst-data/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    console.log(`Fetching comprehensive analyst data for ${symbol}`);
    
    const data = await getAnalystData(symbol);
    
    if (!data) {
      return res.status(404).json({
        error: 'No analyst data found',
        message: `No comprehensive analyst data available for ${symbol}`
      });
    }
    
    res.json(data);
  } catch (error) {
    console.error(`Failed to fetch analyst data for ${req.params.symbol}:`, error);
    res.status(500).json({
      error: 'Failed to fetch analyst data',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/yahoo-finance/sec-filings/:symbol
 * Get SEC filings for a stock symbol
 */
router.get('/sec-filings/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    console.log(`Fetching SEC filings for ${symbol}`);
    
    const data = await secService.getSecFilings(symbol);
    
    if (!data.success) {
      console.log(`No SEC filings found for ${symbol}, trying alternate method`);
      const alternateData = await secService.getSecFilingsAlternate(symbol);
      
      if (alternateData.success) {
        return res.json(alternateData);
      }
      
      return res.status(404).json({
        error: 'No SEC filings found',
        message: `No SEC filings available for ${symbol}`,
        filings: [] // Return empty array instead of null/undefined
      });
    }
    
    res.json(data);
  } catch (error: any) {
    console.error(`Failed to fetch SEC filings for ${req.params.symbol}:`, error);
    res.status(500).json({
      error: 'Failed to fetch SEC filings',
      message: error instanceof Error ? error.message : 'Unknown error',
      filings: [] // Return empty array instead of null/undefined
    });
  }
});

export default router;