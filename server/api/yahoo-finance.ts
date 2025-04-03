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

export default router;