import { Router } from 'express';
import { yahooFinanceService } from '../services/yahoo-finance-service';

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

export default router;