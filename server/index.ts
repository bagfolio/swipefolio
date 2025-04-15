import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { createServer } from 'http';
import { registerRoutes } from './routes';
import logger from './lib/logger';
import { errorHandler } from './middleware/error-handler';
import { setupVite } from './vite';

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('combined', { stream: { write: (message: string) => logger.info(message.trim()) } }));

// Health check endpoint
app.get('/health', (req, res) => {
  logger.info('Health check requested');
  res.json({ status: 'ok' });
});

// Create server instance
const server = createServer(app);

// Register routes
registerRoutes(app).then(async () => {
  // Setup Vite in development mode
  if (process.env.NODE_ENV !== 'production') {
    await setupVite(app, server);
  }

  // Error handling middleware
  app.use(errorHandler);

  // Start server
  server.listen(port, () => {
    logger.info(`Server is running on port ${port}`);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});
