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
  internationalOperations?: {
    regions: string[];
    revenuePercentage?: number;
    description?: string;
  };
  tariffRisk?: {
    level: 'low' | 'medium' | 'high';
    affectedRegions?: string[];
    description?: string;
  };
  highlights?: {
    category: string;
    value: string;
    description: string;
    regions?: string[];
    riskLevel?: 'low' | 'medium' | 'high';
  }[];
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
   * This is our fallback implementation with international operations data
   */
  async getSecFilingsAlternate(symbol: string): Promise<any> {
    try {
      // Generate sample filings with international operations data
      const filings = this.generateSampleFilings(symbol);
      
      if (filings.length > 0) {
        return {
          success: true,
          symbol,
          filings
        };
      }
      
      return {
        success: false,
        symbol,
        message: "No alternative SEC filings data available",
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
   * Generate sample SEC filings with international operations data
   */
  private generateSampleFilings(symbol: string): SecFiling[] {
    // Define available symbols with sample data
    const availableSymbols = ['AAPL', 'MSFT', 'AMZN', 'TSLA', 'GOOG', 'META', 'NVDA', 'WMT', 'COST', 'NKE', 'HD'];
    
    if (!availableSymbols.includes(symbol)) {
      return [];
    }
    
    const currentYear = new Date().getFullYear();
    const filings: SecFiling[] = [];
    
    // Add annual reports (10-K)
    filings.push(this.createSecFiling(symbol, '10-K', `${currentYear-1}-02-15`));
    filings.push(this.createSecFiling(symbol, '10-K', `${currentYear-2}-02-18`));
    
    // Add quarterly reports (10-Q)
    filings.push(this.createSecFiling(symbol, '10-Q', `${currentYear-1}-10-25`));
    filings.push(this.createSecFiling(symbol, '10-Q', `${currentYear-1}-07-20`));
    filings.push(this.createSecFiling(symbol, '10-Q', `${currentYear-1}-04-22`));
    
    // Add other report types
    filings.push(this.createSecFiling(symbol, '8-K', `${currentYear-1}-12-10`));
    filings.push(this.createSecFiling(symbol, 'DEF 14A', `${currentYear-1}-01-05`));
    
    return filings;
  }
  
  /**
   * Create a sample SEC filing with appropriate data
   */
  private createSecFiling(symbol: string, type: string, dateStr: string): SecFiling {
    const date = dateStr;
    const title = this.generateFilingTitle(type, date, symbol);
    const url = this.generateSecUrl(symbol, type, date);
    const formattedDate = this.formatSecDate(date);
    const description = this.generateFilingDescription(type, date, symbol);
    
    // Only add international operations and tariff risk to annual and quarterly reports
    let internationalOperations = undefined;
    let tariffRisk = undefined;
    let highlights = [];
    
    if (type === '10-K' || type === '10-Q') {
      // Add international operations data based on company
      internationalOperations = this.getInternationalOperations(symbol, type);
      
      // Add tariff risk assessment
      tariffRisk = this.getTariffRisk(symbol, internationalOperations);
      
      // Generate highlights based on filing type and company
      highlights = this.generateFilingHighlights(symbol, type, internationalOperations, tariffRisk);
    }
    
    return {
      type,
      date,
      title,
      url,
      description,
      formattedDate,
      internationalOperations,
      tariffRisk,
      highlights
    };
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
    
    // For annual and quarterly reports, add international operations and tariff risk analysis
    let internationalOperations = undefined;
    let tariffRisk = undefined;
    let highlights = [];
    
    if (type === '10-K' || type === '10-Q') {
      // Add international operations data based on company
      internationalOperations = this.getInternationalOperations(symbol, type);
      
      // Add tariff risk assessment
      tariffRisk = this.getTariffRisk(symbol, internationalOperations);
      
      // Generate highlights based on filing type and company
      highlights = this.generateFilingHighlights(symbol, type, internationalOperations, tariffRisk);
    }
    
    return {
      type,
      date,
      title,
      url,
      description,
      formattedDate,
      internationalOperations,
      tariffRisk,
      highlights
    };
  }
  
  /**
   * Extract international operations data for a company
   * This would typically come from parsing the actual SEC filing content
   * Currently using pre-defined data for demonstration
   */
  private getInternationalOperations(symbol: string, filingType: string): { regions: string[], revenuePercentage?: number, description?: string } | undefined {
    // Company-specific international operations data
    const companyInternationalData: Record<string, { regions: string[], revenuePercentage?: number, description?: string }> = {
      'AAPL': {
        regions: ['China', 'Europe', 'Japan', 'Rest of Asia Pacific'],
        revenuePercentage: 58,
        description: 'Apple generates a significant portion of its revenue internationally, with Greater China being a key market. Manufacturing is primarily in Asia.'
      },
      'MSFT': {
        regions: ['Europe', 'Asia', 'Japan', 'Canada', 'Latin America'],
        revenuePercentage: 51,
        description: 'Microsoft has data centers and operations across multiple continents with significant cloud and software sales internationally.'
      },
      'AMZN': {
        regions: ['Europe', 'Asia', 'Canada', 'Latin America'],
        revenuePercentage: 30,
        description: 'Amazon has marketplaces, fulfillment centers and AWS regions across multiple countries.'
      },
      'TSLA': {
        regions: ['China', 'Europe', 'Asia-Pacific'],
        revenuePercentage: 35,
        description: 'Tesla has production facilities in China and sells vehicles globally, with significant exposure to the Chinese market.'
      },
      'WMT': {
        regions: ['Mexico', 'China', 'Central America', 'UK', 'Canada'],
        revenuePercentage: 24,
        description: 'Walmart operates retail stores internationally, with significant presence in Mexico, China, and the UK.'
      },
      'COST': {
        regions: ['Canada', 'Mexico', 'Japan', 'UK', 'Australia', 'South Korea'],
        revenuePercentage: 27,
        description: 'Costco operates warehouses in multiple countries, with expansion plans in Asia.'
      },
      'HD': {
        regions: ['Canada', 'Mexico'],
        revenuePercentage: 8,
        description: 'Home Depot has limited international exposure, mainly in Canada and Mexico.'
      },
      'NKE': {
        regions: ['China', 'Europe', 'Asia-Pacific', 'Latin America'],
        revenuePercentage: 61,
        description: 'Nike has extensive global operations, with manufacturing across Asia and retail worldwide.'
      }
    };
    
    return companyInternationalData[symbol] || {
      regions: ['International markets'],
      description: 'The company has some international operations, but specific details are not available.'
    };
  }
  
  /**
   * Assess tariff risks based on international operations
   */
  private getTariffRisk(symbol: string, internationalOps?: { regions: string[], revenuePercentage?: number }): { level: 'low' | 'medium' | 'high', affectedRegions?: string[], description?: string } | undefined {
    if (!internationalOps) return undefined;
    
    // High-risk countries for tariffs
    const highRiskRegions = ['China', 'Russia', 'Mexico'];
    const mediumRiskRegions = ['Europe', 'Canada', 'Japan', 'South Korea'];
    
    // Check for overlaps
    const highRiskOverlap = internationalOps.regions.filter(region => 
      highRiskRegions.some(r => region.includes(r))
    );
    
    const mediumRiskOverlap = internationalOps.regions.filter(region => 
      mediumRiskRegions.some(r => region.includes(r))
    );
    
    // Determine risk level
    let level: 'low' | 'medium' | 'high' = 'low';
    let description = 'Limited tariff risk due to minimal international exposure or exposure to low-risk regions.';
    
    if (highRiskOverlap.length > 0 && (internationalOps.revenuePercentage || 0) > 20) {
      level = 'high';
      description = `High tariff risk due to significant exposure to ${highRiskOverlap.join(', ')}.`;
    } else if (highRiskOverlap.length > 0 || mediumRiskOverlap.length > 1) {
      level = 'medium';
      const regions = [...highRiskOverlap, ...mediumRiskOverlap].slice(0, 3);
      description = `Moderate tariff risk due to operations in ${regions.join(', ')}.`;
    }
    
    return {
      level,
      affectedRegions: [...highRiskOverlap, ...mediumRiskOverlap],
      description
    };
  }
  
  /**
   * Generate filing highlights based on company and filing type
   */
  private generateFilingHighlights(
    symbol: string, 
    filingType: string,
    internationalOps?: { regions: string[], revenuePercentage?: number, description?: string },
    tariffRisk?: { level: 'low' | 'medium' | 'high', affectedRegions?: string[], description?: string }
  ): any[] {
    const highlights = [];
    
    // Add international operations highlight
    if (internationalOps && internationalOps.regions.length > 0) {
      highlights.push({
        category: 'international',
        value: internationalOps.revenuePercentage ? `${internationalOps.revenuePercentage}% of revenue` : 'Multiple regions',
        description: internationalOps.description || `Operations across ${internationalOps.regions.join(', ')}`,
        regions: internationalOps.regions
      });
    }
    
    // Add tariff risk highlight
    if (tariffRisk) {
      highlights.push({
        category: 'tariff',
        value: `${tariffRisk.level.charAt(0).toUpperCase() + tariffRisk.level.slice(1)} Risk`,
        description: tariffRisk.description || `Tariff risk assessment based on international exposure`,
        riskLevel: tariffRisk.level,
        regions: tariffRisk.affectedRegions
      });
    }
    
    return highlights;
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