/**
 * SEC Filings helper functions to process and format SEC data
 */
import { UpgradeHistoryItem } from './yahoo-finance-client';

export interface SecFiling {
  type: string;      // Filing type (10-K, 10-Q, 8-K, etc.)
  date: string;      // Filing date
  title: string;     // Filing title or description
  url: string;       // URL to the filing on SEC website
  formattedDate?: string; // Human-readable formatted date
  quarterlyReport?: boolean; // Indicates if this is a quarterly report
  annualReport?: boolean;    // Indicates if this is an annual report
  highlights?: SecFilingHighlight[]; // Extracted highlights
}

export interface SecFilingHighlight {
  category: 'revenue' | 'income' | 'earnings' | 'guidance' | 'dividend' | 'international' | 'tariff' | 'other';
  value: string;      // Value with proper formatting
  description: string; // Short description
  percentChange?: number; // Percent change if applicable
  previousValue?: string; // Previous period value for comparison
  regions?: string[];  // International regions mentioned
  riskLevel?: 'low' | 'medium' | 'high'; // Tariff risk level assessment
}

/**
 * Format SEC filing data for display
 */
export function formatSecFilings(rawFilings: any[]): SecFiling[] {
  if (!rawFilings || !Array.isArray(rawFilings)) {
    return [];
  }

  return rawFilings.map(filing => {
    const formattedDate = formatSecFilingDate(filing.date);
    const type = filing.type || 'Unknown';
    const title = filing.title || `SEC ${type} Filing`;
    
    // Determine if annual or quarterly report
    const isAnnual = type === '10-K';
    const isQuarterly = type === '10-Q';
    
    return {
      type,
      date: filing.date,
      formattedDate,
      title,
      url: filing.url || '#',
      annualReport: isAnnual,
      quarterlyReport: isQuarterly,
      highlights: extractFilingHighlights(filing)
    };
  });
}

/**
 * Format SEC filing date into a readable format
 */
function formatSecFilingDate(dateStr: string): string {
  if (!dateStr) return 'Unknown date';
  
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (e) {
    return dateStr; // Fallback to original string if parsing fails
  }
}

/**
 * Extract highlights from a SEC filing based on available data
 */
function extractFilingHighlights(filing: any): SecFilingHighlight[] {
  const highlights: SecFilingHighlight[] = [];
  
  // Only include highlights if we have actual data
  if (filing.highlights && Array.isArray(filing.highlights)) {
    // Use pre-extracted highlights if they exist
    return filing.highlights;
  }
  
  // If we have description, use that as other highlight
  if (filing.description) {
    highlights.push({
      category: 'other',
      value: filing.type || 'SEC Filing',
      description: filing.description
    });
  }
  
  return highlights;
}

/**
 * Generate text summary of key SEC filing insights
 */
export function generateSecFilingSummary(filings: SecFiling[]): string {
  if (!filings || filings.length === 0) {
    return 'No SEC filings available.';
  }
  
  const annualReports = filings.filter(f => f.annualReport);
  const quarterlyReports = filings.filter(f => f.quarterlyReport);
  const otherFilings = filings.filter(f => !f.annualReport && !f.quarterlyReport);
  
  // Create summary text
  let summary = '';
  
  if (annualReports.length > 0) {
    const latest = annualReports[0];
    summary += `Most recent annual report (10-K) filed on ${latest.formattedDate}. `;
  }
  
  if (quarterlyReports.length > 0) {
    const latest = quarterlyReports[0];
    summary += `Most recent quarterly report (10-Q) filed on ${latest.formattedDate}. `;
  }
  
  if (otherFilings.length > 0) {
    summary += `${otherFilings.length} other filings in the past year.`;
  }
  
  return summary;
}

/**
 * Categorize filings by type for easier consumption
 */
export function categorizeSecFilings(filings: SecFiling[]) {
  return {
    annual: filings.filter(f => f.annualReport),
    quarterly: filings.filter(f => f.quarterlyReport),
    other: filings.filter(f => !f.annualReport && !f.quarterlyReport)
  };
}