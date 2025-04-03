import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import axios from "axios";
import { getAIResponse } from "./ai-service";
import { pool } from "./db";

// Import stock services
import { jsonStockService } from "./services/json-stock-service";
import { pgStockService } from "./services/pg-stock-service"; // Use the updated service
import { stockService } from "./services/stock-service";
import { stockNewsService } from "./services/stock-news-service";
import { ownershipService } from "./services/ownership-service";
import { log } from "./vite"; // Assuming log is available

// --- Helper Functions (getCurrentPrice, etc. - keep if needed elsewhere) ---
// ... (keep helper functions if they are used by other routes)

export async function registerRoutes(app: Express): Promise<Server> {
  // --- Existing Auth, System, AI, User Progress routes ---
  setupAuth(app);
  // ... (keep existing routes like /api/stacks, /api/user-progress, /api/ai/*, etc.)

  // --- Data Source Control ---
  app.get("/api/system/data-source", (req, res) => {
    const currentSource = stockService.isUsingPostgres() ? "postgresql" : "json";
    res.json({
      dataSource: currentSource,
      postgresAvailable: true // Assume available for now
    });
  });

  app.post("/api/system/data-source", (req, res) => {
    const { source } = req.body;
    if (source !== "postgresql" && source !== "json") {
      return res.status(400).json({ error: "Invalid data source. Must be 'postgresql' or 'json'" });
    }
    stockService.setUsePostgres(source === "postgresql");
    res.json({ success: true, dataSource: source });
  });

  // --- Core Stock Data Endpoint ---
  app.get("/api/stock/:symbol", async (req, res) => {
    try {
      const { symbol } = req.params;
      const normalizedSymbol = symbol.toUpperCase();
      log(`[API] Getting stock data for ${normalizedSymbol}`, 'routes');
      const stockData = await stockService.getStockData(normalizedSymbol); // Use the main service

      if (stockData) {
        log(`[API] Retrieved stock data for ${normalizedSymbol} from ${stockService.isUsingPostgres() ? 'PostgreSQL' : 'JSON'}`, 'routes');
        return res.json({
          ...stockData,
          dataSource: stockService.isUsingPostgres() ? 'postgresql' : 'json'
        });
      } else {
        log(`[API] Stock data not found for ${normalizedSymbol}`, 'routes');
        return res.status(404).json({
          error: "Stock data not found",
          message: `No data found for symbol: ${normalizedSymbol}`
        });
      }
    } catch (error: any) {
      log(`[API] Error getting stock data: ${error}`, 'routes');
      res.status(500).json({ error: "Failed to fetch stock data", message: error.message });
    }
  });

  // --- NEW Historical Price Data Endpoint ---
  app.get("/api/stock/:ticker/period/:period", async (req, res) => {
    try {
      const ticker = req.params.ticker.toUpperCase();
      const period = req.params.period; // e.g., '1M', '1Y'
      log(`[API] NEW: Getting pre-processed history for ${ticker} (${period})`, 'routes');

      // Only use PostgreSQL for this new endpoint
      if (!stockService.isUsingPostgres()) {
         log(`[API] NEW: PostgreSQL not active, cannot serve period data for ${ticker}`, 'routes');
         return res.status(503).json({
           error: "Service Unavailable",
           message: "Database connection for historical data is not active."
         });
      }

      const historyData = await pgStockService.getPriceHistoryForPeriod(ticker, period);

      if (historyData && historyData.dates && historyData.prices) {
        log(`[API] NEW: Retrieved pre-processed history for ${ticker} (${period})`, 'routes');
        return res.json({
          ticker: ticker,
          period: period,
          data: { // Nest dates and prices under 'data' as per AI description
             dates: historyData.dates,
             prices: historyData.prices
          },
          source: 'postgresql',
          last_updated: new Date().toISOString() // Add timestamp
        });
      } else {
        log(`[API] NEW: No pre-processed history found for ${ticker} (${period})`, 'routes');
        return res.status(404).json({
          error: "Not Found",
          message: `No pre-processed historical data available for ${ticker} for the period ${period}`
        });
      }
    } catch (error: any) {
      log(`[API] NEW: Error fetching pre-processed history: ${error}`, 'routes');
      res.status(500).json({ error: "Failed to fetch historical data", message: error.message });
    }
  });


  // --- OLD Historical Price Data Endpoint (Modified/Commented Out) ---
  app.get("/api/stock/:symbol/history", async (req, res) => {
     // ** OPTION 1: Redirect to the new endpoint (Recommended) **
     // const symbol = req.params.symbol.toUpperCase();
     // const period = (req.query.period as string) || '1M';
     // return res.redirect(301, `/api/stock/${symbol}/period/${period}`);

     // ** OPTION 2: Return an error indicating endpoint is deprecated **
     return res.status(410).json({
         error: "Endpoint Deprecated",
         message: "Please use the new endpoint: /api/stock/:ticker/period/:period"
     });

     /* --- Original Logic (Commented Out - Contains Random Data Fallback) ---
     try {
       const symbol = req.params.symbol.toUpperCase();
       const period = (req.query.period as string) || '1M';
       log(`[API] OLD: Getting price history for: ${symbol}, period: ${period}`, 'routes');

       if (stockService.isUsingPostgres()) {
         try {
           // Note: This calls the OLD pgStockService method which might have issues
           const pgPriceHistory = await pgStockService.getPriceHistory(symbol, period);
           if (pgPriceHistory && pgPriceHistory.prices) {
             log(`[API] OLD: Retrieved price history for ${symbol} (${period}) from PostgreSQL`, 'routes');
             return res.json({
               symbol,
               period,
               prices: pgPriceHistory.prices, // Format might be inconsistent
               dates: pgPriceHistory.dates,   // Might be missing
               source: 'postgresql'
             });
           }
         } catch (dbError) {
            log(`[API] OLD: Error getting PostgreSQL price history for ${symbol}: ${dbError}`, 'routes');
         }
       }

       log(`[API] OLD: PostgreSQL failed or inactive for ${symbol}, trying JSON`, 'routes');
       if (jsonStockService.fileExists(symbol)) {
         const stockData = jsonStockService.getStockData(symbol);
         if (stockData) {
           // *** PROBLEM AREA: Generates RANDOM data if chartData is missing ***
           const chartData = stockData.chartData || [];
           if (chartData.length > 0) {
              log(`[API] OLD: Retrieved chartData for ${symbol} from JSON`, 'routes');
              return res.json({ symbol, period, prices: chartData, source: 'json' });
           } else {
              log(`[API] OLD: JSON exists but chartData missing for ${symbol}. Generating RANDOM data!`, 'routes');
              const currentPrice = await getCurrentPrice(symbol);
              const dataPoints = getPeriodDataPoints(period);
              const prices = generateRealisticPriceHistory(currentPrice, period, dataPoints);
              return res.json({ symbol, period, prices: prices, source: 'generated-random' }); // Indicate random
           }
         }
       }

       log(`[API] OLD: No history found for ${symbol}. Generating RANDOM data!`, 'routes');
       const currentPrice = await getCurrentPrice(symbol);
       const dataPoints = getPeriodDataPoints(period);
       const prices = generateRealisticPriceHistory(currentPrice, period, dataPoints);
       return res.json({ symbol, period, prices: prices, source: 'generated-random' }); // Indicate random

     } catch (error: any) {
       log(`[API] OLD: Error in price history endpoint: ${error}`, 'routes');
       res.status(500).json({ error: "Failed to fetch price history", message: error.message });
     }
     */
  });

  // --- Other Endpoints (News, Recommendations, Metrics, Ownership) ---
  // Keep or adjust these as needed, ensuring they use the correct services

  // Get available periods (using pgStockService for now, adapt if needed)
  app.get("/api/stock/:symbol/available-periods", async (req, res) => {
    try {
      const symbol = req.params.symbol.toUpperCase();
      log(`[API] Getting available periods for: ${symbol}`, 'routes');

      // If using PostgreSQL, query the time_period_data table for distinct periods
      if (stockService.isUsingPostgres()) {
          try {
              const result = await pool.query<{ period: string }>(
                  `SELECT DISTINCT LOWER(period) as period FROM time_period_data WHERE ticker = $1`,
                  [symbol]
              );
              const availablePeriods = result.rows.map(r => r.period.toUpperCase()); // Ensure uppercase
              if (availablePeriods.length > 0) {
                  return res.json({
                      symbol,
                      availablePeriods,
                      source: 'postgresql-time-periods'
                  });
              }
          } catch (dbError) {
              log(`[API] Error querying time_period_data for periods: ${dbError}`, 'routes');
          }
      }

      // Fallback to default periods if DB query fails or not using PG
      log(`[API] Falling back to default periods for ${symbol}`, 'routes');
      return res.json({
        symbol,
        availablePeriods: ['1D', '5D', '1W', '1M', '3M', '6M', '1Y', '5Y'], // Standard set
        source: 'default'
      });
    } catch (error: any) {
      log(`[API] Error in available periods endpoint: ${error}`, 'routes');
      return res.status(500).json({ error: "Failed to fetch available periods", message: error.message });
    }
  });

  // Get news (using columnar endpoint)
  app.get("/api/pg/stock/:ticker/news", async (req, res) => {
    try {
      const ticker = req.params.ticker.toUpperCase();
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const result = await stockNewsService.getNewsForStockColumnar(ticker, limit);
      res.json(result);
    } catch (error: any) {
      log(`[API] Error fetching columnar news: ${error}`, 'routes');
      res.status(500).json({ success: false, error: "Failed to fetch news", message: error.message });
    }
  });

  // Get recommendations
  app.get("/api/pg/stock/:ticker/recommendations", async (req, res) => {
    try {
      const ticker = req.params.ticker.toUpperCase();
      const result = await pgStockService.getRecommendations(ticker); // Assuming this exists in pgStockService
      res.json(result || { success: false, error: "Not found" });
    } catch (error: any) {
      log(`[API] Error fetching recommendations: ${error}`, 'routes');
      res.status(500).json({ success: false, error: "Failed to fetch recommendations", message: error.message });
    }
  });

  // Get metrics
  app.get("/api/pg/stock/:ticker/metrics", async (req, res) => {
     try {
       const ticker = req.params.ticker.toUpperCase();
       log(`[API] Getting metrics for ${ticker}`, 'routes');
       const stockData = await stockService.getStockData(ticker); // Use main service

       if (stockData && stockData.metrics) {
         return res.json({ success: true, data: { ticker, metrics: stockData.metrics } });
       } else {
         return res.status(404).json({ success: false, error: "Metrics not found" });
       }
     } catch (error: any) {
       log(`[API] Error fetching metrics: ${error}`, 'routes');
       res.status(500).json({ success: false, error: "Failed to fetch metrics", message: error.message });
     }
  });

  // Get ESG data (assuming pgStockService has a method or it's part of getStockData)
  app.get("/api/pg/stock/:symbol/esg-data", async (req, res) => {
      try {
          const symbol = req.params.symbol.toUpperCase();
          log(`[API] Getting ESG data for ${symbol}`, 'routes');
          // Placeholder: In a real scenario, fetch this from DB or calculate
          const mockEsg = {
              esgScore: Math.floor(Math.random() * 50) + 40, // Random score 40-90
              environmentalScore: Math.floor(Math.random() * 50) + 40,
              socialScore: Math.floor(Math.random() * 50) + 40,
              governanceScore: Math.floor(Math.random() * 50) + 40,
              controversyLevel: Math.floor(Math.random() * 3) + 1, // 1-3
              managementRisk: ['Low', 'Medium', 'High'][Math.floor(Math.random() * 3)],
              boardRisk: ['Low', 'Medium', 'High'][Math.floor(Math.random() * 3)],
              auditRisk: ['Low', 'Medium'][Math.floor(Math.random() * 2)],
              compensationRisk: ['Low', 'Medium'][Math.floor(Math.random() * 2)],
          };
          res.json({ success: true, data: mockEsg });
      } catch (error: any) {
          log(`[API] Error fetching ESG data: ${error}`, 'routes');
          res.status(500).json({ success: false, error: "Failed to fetch ESG data", message: error.message });
      }
  });

  // Get Major Holders
  app.get("/api/pg/stock/:symbol/major-holders", async (req, res) => {
      try {
          const symbol = req.params.symbol.toUpperCase();
          const data = await ownershipService.getMajorHolders(symbol);
          if (data) {
              res.json({ success: true, data });
          } else {
              res.status(404).json({ success: false, error: "Not found" });
          }
      } catch (error: any) {
          log(`[API] Error fetching major holders: ${error}`, 'routes');
          res.status(500).json({ success: false, error: "Failed to fetch data", message: error.message });
      }
  });

  // Get Institutional Holders
  app.get("/api/pg/stock/:symbol/institutional-holders", async (req, res) => {
      try {
          const symbol = req.params.symbol.toUpperCase();
          const data = await ownershipService.getInstitutionalHolders(symbol);
          if (data) {
              res.json({ success: true, data });
          } else {
              res.status(404).json({ success: false, error: "Not found" });
          }
      } catch (error: any) {
          log(`[API] Error fetching institutional holders: ${error}`, 'routes');
          res.status(500).json({ success: false, error: "Failed to fetch data", message: error.message });
      }
  });


  const httpServer = createServer(app);
  return httpServer;
}
