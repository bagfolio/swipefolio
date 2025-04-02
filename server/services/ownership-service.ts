/**
 * ownership-service.ts
 * 
 * Service for managing stock ownership data including institutional holders
 * and major holders data.
 */

import { db } from '../db';
import { stockData } from '../../shared/schema';
import { eq } from 'drizzle-orm';

// Types for ownership data
export interface MajorHolders {
  insidersPercentHeld: number;
  institutionsPercentHeld: number;
  institutionsFloatPercentHeld: number;
  institutionsCount: number;
}

export interface InstitutionalHolder {
  holder: string;
  shares: number;
  value: number;
  percentHeld: number;
  percentChange: number;
  dateReported: string;
}

export class OwnershipService {
  constructor() {
    console.log('Ownership service initialized');
  }
  
  /**
   * Get major holders data for a stock
   * @param ticker Stock ticker symbol
   */
  async getMajorHolders(ticker: string): Promise<MajorHolders | null> {
    try {
      // Get major holders data from the database
      const result = await db
        .select({
          majorHolders: stockData.majorHolders,
        })
        .from(stockData)
        .where(eq(stockData.ticker, ticker))
        .limit(1);
      
      if (!result || !result.length || !result[0].majorHolders) {
        return null;
      }
      
      // The major holders data is stored in columnar format with index and Value arrays
      const majorHoldersData = result[0].majorHolders as any;
      
      if (!majorHoldersData.index || !majorHoldersData.Value) {
        return null;
      }
      
      // Map the columnar data to the expected format
      const majorHolders: MajorHolders = {
        insidersPercentHeld: 0,
        institutionsPercentHeld: 0,
        institutionsFloatPercentHeld: 0,
        institutionsCount: 0
      };
      
      // Iterate through the index array to find the values
      for (let i = 0; i < majorHoldersData.index.length; i++) {
        const key = majorHoldersData.index[i];
        const value = majorHoldersData.Value[i];
        
        switch (key) {
          case 'insidersPercentHeld':
            majorHolders.insidersPercentHeld = value;
            break;
          case 'institutionsPercentHeld':
            majorHolders.institutionsPercentHeld = value;
            break;
          case 'institutionsFloatPercentHeld':
            majorHolders.institutionsFloatPercentHeld = value;
            break;
          case 'institutionsCount':
            majorHolders.institutionsCount = value;
            break;
        }
      }
      
      return majorHolders;
      
    } catch (error) {
      console.error(`Error fetching major holders for ${ticker}:`, error);
      return null;
    }
  }
  
  /**
   * Get institutional holders data for a stock
   * @param ticker Stock ticker symbol
   */
  async getInstitutionalHolders(ticker: string): Promise<InstitutionalHolder[] | null> {
    try {
      // Get institutional holders data from the database
      const result = await db
        .select({
          institutionalHolders: stockData.institutionalHolders,
        })
        .from(stockData)
        .where(eq(stockData.ticker, ticker))
        .limit(1);
      
      if (!result || !result.length || !result[0].institutionalHolders) {
        return null;
      }
      
      // The institutional holders data is stored in columnar format
      const holdersData = result[0].institutionalHolders as any;
      
      if (!holdersData.Holder || !holdersData.Shares) {
        return null;
      }
      
      // Map the columnar data to an array of InstitutionalHolder objects
      const institutionalHolders: InstitutionalHolder[] = [];
      
      for (let i = 0; i < holdersData.Holder.length; i++) {
        institutionalHolders.push({
          holder: holdersData.Holder[i],
          shares: holdersData.Shares[i],
          value: holdersData.Value[i] || 0,
          percentHeld: holdersData.pctHeld[i] || 0,
          percentChange: holdersData.pctChange?.[i] || 0,
          dateReported: holdersData['Date Reported']?.[i] || ''
        });
      }
      
      return institutionalHolders;
      
    } catch (error) {
      console.error(`Error fetching institutional holders for ${ticker}:`, error);
      return null;
    }
  }
}

export const ownershipService = new OwnershipService();