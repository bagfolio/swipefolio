import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { jsonStockService } from "./services/json-stock-service";
import cron from 'node-cron';

// Common stock symbols to preload
const COMMON_SYMBOLS = [
  // Tech stocks
  'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META',
  // Real Estate
  'AVB', 'O', 'PLD', 'SPG', 'AMT',
  // Healthcare
  'JNJ', 'PFE', 'UNH', 'ABBV', 'SYK'
];

// Initialize stock data
async function initializeStockCache() {
  try {
    log('Loading stock data from JSON files...');
    
    const availableSymbols = jsonStockService.getAvailableSymbols();
    const successSymbols = [];
    const failedSymbols = [];
    
    for (const symbol of COMMON_SYMBOLS) {
      if (availableSymbols.includes(symbol)) {
        try {
          // Load data from JSON file to verify it's available
          jsonStockService.getStockData(symbol);
          successSymbols.push(symbol);
        } catch (err) {
          failedSymbols.push(symbol);
        }
      } else {
        failedSymbols.push(symbol);
      }
    }
    
    log(`JSON stock data initialization complete: ${successSymbols.length} available, ${failedSymbols.length} not available`);
    
    if (failedSymbols.length > 0) {
      log(`Stocks not available as JSON: ${failedSymbols.join(', ')}`);
    }
  } catch (error) {
    log(`Error initializing stock data: ${error}`);
  }
}

// No scheduled updates needed as JSON data is static
function setupScheduledCacheUpdates() {
  // This function remains for API compatibility but doesn't do anything
  // since we're using static JSON files
  log('Note: Using static JSON data, no scheduled updates will occur');
}

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
    
    // Initialize cache for commonly used stock symbols
    initializeStockCache();
    
    // Schedule periodic cache updates
    setupScheduledCacheUpdates();
  });
})();
