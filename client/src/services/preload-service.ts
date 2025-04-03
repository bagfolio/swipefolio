/**
 * Stock Data Preloading Service
 * 
 * This service preloads stock data for the first stock in each stack
 * to ensure that data is immediately available when a user views stock details.
 */

import { useState, useEffect } from 'react';

// Time periods to preload for each stock
const PERIODS_TO_PRELOAD = ['1D', '1W', '1M', '3M', '6M', '1Y'];

// In-memory cache for preloaded stock data
const stockDataCache: Record<string, PreloadedStockData> = {};

export interface PreloadedStockData {
  symbol: string;
  historicalData: {
    '1D'?: any[];
    '5D'?: any[];
    '1W'?: any[];
    '1M'?: any[];
    '3M'?: any[];
    '6M'?: any[];
    '1Y'?: any[];
  };
  details?: any;
  lastUpdated: Date;
}

/**
 * Preload stock data for a given symbol and periods
 */
export async function preloadStockData(symbol: string, periods = PERIODS_TO_PRELOAD): Promise<void> {
  if (!symbol) return;
  console.log(`PRELOAD: Starting to preload data for ${symbol}`);
  
  try {
    // Initialize the cache entry if it doesn't exist
    if (!stockDataCache[symbol]) {
      stockDataCache[symbol] = {
        symbol,
        historicalData: {},
        lastUpdated: new Date()
      };
    }
    
    // Fetch data for each period
    for (const period of periods) {
      try {
        console.log(`PRELOAD: Fetching ${symbol} data for period ${period}`);
        const response = await fetch(`/api/historical/${symbol}?period=${period.toLowerCase()}`);
        
        if (response.ok) {
          const data = await response.json();
          stockDataCache[symbol].historicalData[period as keyof PreloadedStockData['historicalData']] = data;
          console.log(`PRELOAD: Successfully preloaded ${symbol} data for period ${period}`);
        } else {
          console.warn(`PRELOAD: Failed to preload ${symbol} data for period ${period}`);
        }
      } catch (error) {
        console.error(`PRELOAD: Error preloading ${symbol} data for period ${period}:`, error);
      }
    }
    
    // Update the lastUpdated timestamp
    stockDataCache[symbol].lastUpdated = new Date();
  } catch (error) {
    console.error(`PRELOAD: Error in preloadStockData for ${symbol}:`, error);
  }
}

/**
 * Get preloaded stock data for a symbol and period
 */
export function getPreloadedStockData(symbol: string, period?: string): any {
  if (!symbol || !stockDataCache[symbol]) return null;
  
  // If no period is specified, return all data for the symbol
  if (!period) {
    return stockDataCache[symbol];
  }
  
  // Return data for the specified period
  const periodData = stockDataCache[symbol].historicalData[period as keyof PreloadedStockData['historicalData']];
  return periodData || null;
}

/**
 * Check if data for a symbol and period is preloaded
 */
export function isDataPreloaded(symbol: string, period?: string): boolean {
  if (!symbol || !stockDataCache[symbol]) return false;
  
  // If no period is specified, check if any data is preloaded for the symbol
  if (!period) {
    return Object.keys(stockDataCache[symbol].historicalData).length > 0;
  }
  
  // Check if data for the specified period is preloaded
  return !!stockDataCache[symbol].historicalData[period as keyof PreloadedStockData['historicalData']];
}

/**
 * React Hook to preload first stock from each stack
 */
export function usePreloadFirstStocksFromStacks(): { loading: boolean, error: string | null } {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    async function preloadFirstStocks() {
      try {
        // Fetch all stacks
        const stacksResponse = await fetch('/api/stacks');
        
        if (!stacksResponse.ok) {
          throw new Error('Failed to fetch stacks');
        }
        
        const stacks = await stacksResponse.json();
        
        // For each stack, get the first stock and preload its data
        for (const stack of stacks) {
          try {
            // Fetch cards for the stack to find the first stock
            const cardsResponse = await fetch(`/api/cards/stack/${stack.id}`);
            
            if (!cardsResponse.ok) continue;
            
            const cards = await cardsResponse.json();
            
            // Find the first card with a stock symbol
            const firstStockCard = cards.find((card: any) => card.stock && card.stock.symbol);
            
            if (firstStockCard && firstStockCard.stock && firstStockCard.stock.symbol) {
              // Preload data for the stock
              await preloadStockData(firstStockCard.stock.symbol);
            }
          } catch (stackError) {
            console.error('Error preloading stock for stack:', stackError);
          }
        }
        
        // Also preload some commonly viewed stocks like AAPL, MSFT, GOOG
        const commonStocks = ['AAPL', 'MSFT', 'GOOG', 'AMZN'];
        for (const symbol of commonStocks) {
          try {
            await preloadStockData(symbol);
          } catch (stockError) {
            console.error(`Error preloading common stock ${symbol}:`, stockError);
          }
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error in preloadFirstStocks:', err);
        setError('Failed to preload stock data');
        setLoading(false);
      }
    }
    
    preloadFirstStocks();
  }, []);
  
  return { loading, error };
}

export function getAllPreloadedData(): Record<string, PreloadedStockData> {
  return { ...stockDataCache };
}