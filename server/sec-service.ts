/**
 * SEC Filing Service
 * Handles fetching and processing SEC data from Yahoo Finance
 */

import yahooFinance from 'yahoo-finance2';
import { default as axios } from 'axios';

export interface SecFiling {
  type: string;
  date: string;
  title?: string;
  url: string;
  description?: string;
  formattedDate?: string;
}

export class SecService {
  private readonly yf;
  
  constructor() {
    this.yf = yahooFinance;
    console.log("[sec-service] SEC Service initialized");
  }
  
  /**
   * Get SEC filings for a specific symbol
   */
  async getSecFilings(symbol: string): Promise<any> {
    try {
      // Fetch from Yahoo Finance
      const secData = await this.yf.quoteSummary(symbol, {
        modules: ['secFilings']
      });
      
      // Extract and process filings
      if (secData?.secFilings?.filings && Array.isArray(secData.secFilings.filings)) {
        // Process and enrich filing data
        const filings = secData.secFilings.filings.map(filing => this.processSecFiling(filing, symbol));
        
        return {
          success: true,
          symbol,
          filings
        };
      }
      
      return {
        success: false,
        symbol,
        message: "No SEC filings data available",
        filings: []
      };
    } catch (error: any) {
      console.error(`[SEC] Error fetching SEC filings for ${symbol}:`, error);
      return {
        success: false,
        symbol,
        message: "Failed to fetch SEC filings",
        error: error instanceof Error ? error.message : String(error),
        filings: []
      };
    }
  }
  
  /**
   * Get SEC filings from an alternate source
   * This method can be implemented as a fallback
   */
  async getSecFilingsAlternate(symbol: string): Promise<any> {
    try {
      // Example of an alternative method if Yahoo Finance doesn't have the data
      // This could be replaced with a different API or method
      
      // For now, we'll use a simple stub
      return {
        success: false,
        symbol,
        message: "Alternative SEC filings method not implemented",
        filings: []
      };
    } catch (error: any) {
      console.error(`[SEC] Error in alternative SEC filings for ${symbol}:`, error);
      return {
        success: false,
        symbol,
        message: "Failed to fetch alternative SEC filings",
        error: error instanceof Error ? error.message : String(error),
        filings: []
      };
    }
  }
  
  /**
   * Process an individual SEC filing to add additional context
   */
  private processSecFiling(filing: any, symbol: string): SecFiling {
    // Extract basic filing info
    const type = filing.type || '';
    const date = filing.date || '';
    const title = filing.title || this.generateFilingTitle(type, date, symbol);
    const url = filing.url || this.generateSecUrl(symbol, type, date);
    
    // Convert date to formatted string if needed
    const formattedDate = this.formatSecDate(date);
    
    // Generate description based on filing type
    const description = this.generateFilingDescription(type, date, symbol);
    
    return {
      type,
      date,
      title,
      url,
      description,
      formattedDate
    };
  }
  
  /**
   * Format SEC filing date
   */
  private formatSecDate(dateStr: string): string {
    if (!dateStr) return '';
    
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      return dateStr;
    }
  }
  
  /**
   * Generate a title for a filing if not provided
   */
  private generateFilingTitle(type: string, date: string, symbol: string): string {
    if (type === '10-K') {
      return `Annual Report (10-K) for ${symbol}`;
    } else if (type === '10-Q') {
      return `Quarterly Report (10-Q) for ${symbol}`;
    } else if (type === '8-K') {
      return `Current Report (8-K) for ${symbol}`;
    } else {
      return `${type} Filing for ${symbol}`;
    }
  }
  
  /**
   * Generate a description for a filing based on type
   */
  private generateFilingDescription(type: string, date: string, symbol: string): string {
    if (type === '10-K') {
      return `Annual report which provides a comprehensive overview of ${symbol}'s business and financial condition.`;
    } else if (type === '10-Q') {
      return `Quarterly report which provides a continuing view of ${symbol}'s financial position.`;
    } else if (type === '8-K') {
      return `Current report to announce major events that shareholders should know about.`;
    } else if (type === 'DEF 14A') {
      return `Proxy statement for shareholder meeting.`;
    } else {
      return `SEC filing document for ${symbol}.`;
    }
  }
  
  /**
   * Generate a SEC URL if not provided
   */
  private generateSecUrl(symbol: string, type: string, date: string): string {
    // This is a simplified fallback - actual SEC URLs have more components
    return `https://www.sec.gov/edgar/search/#/q=${symbol}`;
  }
}

export const secService = new SecService();