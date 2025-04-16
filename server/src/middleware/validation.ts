import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

// Validation schemas
const stockSymbolSchema = z.string().regex(/^[A-Z]{1,5}$/);
const userIdSchema = z.number().int().positive();
const stackIdSchema = z.number().int().positive();
const userProgressSchema = z.object({
  currentCardIndex: z.number().int().min(0),
  completed: z.boolean(),
  earnedXp: z.number().int().min(0)
});

// Validation middleware
export const validateStockSymbol = (req: Request, res: Response, next: NextFunction) => {
  try {
    const symbol = stockSymbolSchema.parse(req.params.symbol);
    req.params.symbol = symbol;
    next();
  } catch (error) {
    res.status(400).json({ error: 'Invalid stock symbol' });
  }
};

export const validateUserId = (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = userIdSchema.parse(Number(req.params.userId));
    req.params.userId = userId.toString();
    next();
  } catch (error) {
    res.status(400).json({ error: 'Invalid user ID' });
  }
};

export const validateStackId = (req: Request, res: Response, next: NextFunction) => {
  try {
    const stackId = stackIdSchema.parse(Number(req.params.stackId));
    req.params.stackId = stackId.toString();
    next();
  } catch (error) {
    res.status(400).json({ error: 'Invalid stack ID' });
  }
};

export const validateUserProgress = (req: Request, res: Response, next: NextFunction) => {
  try {
    const progress = userProgressSchema.parse(req.body);
    req.body = progress;
    next();
  } catch (error) {
    res.status(400).json({ error: 'Invalid progress data' });
  }
};

// Sanitization middleware
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  // Sanitize query parameters
  if (req.query) {
    Object.keys(req.query).forEach(key => {
      if (typeof req.query[key] === 'string') {
        req.query[key] = (req.query[key] as string).trim();
      }
    });
  }

  // Sanitize body parameters
  if (req.body) {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        req.body[key] = req.body[key].trim();
      }
    });
  }

  next();
}; 