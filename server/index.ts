import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { postgresStockService } from "./services/postgres-stock-service";
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
    // Initialize PostgreSQL stock service
    log('Initializing PostgreSQL stock service...');
    const pgInitResult = await postgresStockService.loadStockData().catch(error => {
      log(`Error initializing PostgreSQL stock service: ${error}`);
      return false;
    });
    
    if (pgInitResult) {
      log('Successfully connected to PostgreSQL database for stock data');
    } else {
      log('Failed to connect to PostgreSQL database for stock data');
    }
  } catch (error) {
    log(`Error initializing stock data: ${error}`);
  }
}

// Set up cache updates for stock data
function setupScheduledCacheUpdates() {
  // Schedule cache updates every day at midnight
  cron.schedule('0 0 * * *', async () => {
    log('Running scheduled stock data update...');
    try {
      // If we have symbols in the cache, refresh them
      const symbols = COMMON_SYMBOLS;
      log(`Refreshing data for ${symbols.length} symbols...`);
      
      // Try to use PostgreSQL service
      try {
        await postgresStockService.loadStockData();
        log('Successfully refreshed stock data from PostgreSQL');
      } catch (error) {
        log(`Error refreshing PostgreSQL stock data: ${error}`);
      }
    } catch (error) {
      log(`Error in scheduled cache update: ${error}`);
    }
  });
  
  log('Scheduled daily stock data updates (midnight)');
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
