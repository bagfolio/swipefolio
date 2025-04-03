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
    // ... (keep your existing /api/stock/:symbol implementation using stockService)
    try {
      const { symbol } = req.params;
      const normalizedSymbol = symbol.toUpperCase();
      log(`[API] Getting stock data for ${normalizedSymbol}`, 'routes');
      const stockData = await stockService.getStockData(normalizedSymbol);

      if (stockData) {
        log(`[API] Retrieved stock data for ${normalizedSymbol} from ${stockService.isUsingPostgres() ? 'PostgreSQL' : 'JSON'}`, 'routes');
        return res.json({
          ...stockData,
          dataSource: stockService.isUsingPostgres() ? 'postgresql' : 'json'
        });
      } else {
        log(`[API] Stock data not found for ${normalizedSymbol}`, 'routes');
        return res.status(404).json({ error: "Stock data not found", message: `No data found for symbol: ${normalizedSymbol}` });
      }
    } catch (error: any) {
      log(`[API] Error getting stock data: ${error}`, 'routes');
      res.status(500).json({ error: "Failed to fetch stock data", message: error.message });
    }
  });

  // --- NEW Historical Price Data Endpoint ---
  app.get("/api/stock/:ticker/period/:period", async (req, res) => {
    const ticker = req.params.ticker.toUpperCase();
    const period = req.params.period;
    log(`[API Routes] Request received for NEW endpoint: /api/stock/${ticker}/period/${period}`, 'routes');

    try {
      // Always try the PG service first for this dedicated endpoint
      const historyData = await pgStockService.getPriceHistoryForPeriod(ticker, period);

      if (historyData && historyData.dates && historyData.prices) {
        log(`[API Routes] Success: Found data for ${ticker} (${period}) via PG Service`, 'routes');
        return res.json({
          ticker: ticker,
          period: period,
          data: { // Nest dates and prices under 'data'
             dates: historyData.dates,
             prices: historyData.prices
          },
          source: 'postgresql',
          last_updated: new Date().toISOString()
        });
      } else {
        // If PG service returns null (data not found or invalid)
        log(`[API Routes] Not Found: No valid data from PG Service for ${ticker} (${period})`, 'routes');
        return res.status(404).json({
          error: "Not Found",
          message: `No historical data available for ${ticker} for the period ${period}`
        });
      }
    } catch (error: any) {
      log(`[API Routes] Server Error fetching history for ${ticker} (${period}): ${error.message}`, 'routes');
      res.status(500).json({ error: "Server Error", message: "Failed to fetch historical data" });
    }
  });

  // --- OLD Historical Price Data Endpoint (Now returns error) ---
  app.get("/api/stock/:symbol/history", async (req, res) => {
     log(`[API Routes] Request received for OLD DEPRECATED endpoint: /api/stock/${req.params.symbol}/history`, 'routes');
     return res.status(410).json({
         error: "Endpoint Deprecated",
         message: "This endpoint is no longer supported. Please use the new endpoint: /api/stock/:ticker/period/:period"
     });
  });

  // --- Other Endpoints (News, Recommendations, Metrics, Ownership, etc.) ---
  // ... (keep your existing implementations for other endpoints)
  app.get("/api/stock/:symbol/available-periods", async (req, res) => { /* ... */ });
  app.get("/api/pg/stock/:ticker/news", async (req, res) => { /* ... */ });
  app.get("/api/pg/stock/:ticker/recommendations", async (req, res) => { /* ... */ });
  app.get("/api/pg/stock/:ticker/metrics", async (req, res) => { /* ... */ });
  app.get("/api/pg/stock/:symbol/esg-data", async (req, res) => { /* ... */ });
  app.get("/api/pg/stock/:symbol/major-holders", async (req, res) => { /* ... */ });
  app.get("/api/pg/stock/:symbol/institutional-holders", async (req, res) => { /* ... */ });
  app.post("/api/stocks/news/analyze", async (req, res) => { /* ... */ });
  // ... any other routes ...

  const httpServer = createServer(app);
  return httpServer;
}
