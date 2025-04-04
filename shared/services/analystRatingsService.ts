import yahooFinance from 'yahoo-finance2';
import { format, isValid } from 'date-fns';

// --- Helper Functions ---

/**
 * Standardizes various analyst rating terms into consistent categories.
 * @param rating Raw rating string (e.g., "Outperform", "Hold", "underperform")
 * @returns Standardized category (e.g., "Buy", "Hold", "Sell") or "N/A"
 */
function standardizeRating(rating: string): string {
  const lowerCaseRating = rating?.toLowerCase() || '';
  if (['strong buy', 'star performer'].includes(lowerCaseRating)) return 'Strong Buy';
  if (['buy', 'outperform', 'accumulate', 'overweight', 'positive'].includes(lowerCaseRating)) return 'Buy';
  if (['hold', 'neutral', 'market perform', 'equal-weight'].includes(lowerCaseRating)) return 'Hold';
  if (['sell', 'underperform', 'reduce', 'underweight', 'negative'].includes(lowerCaseRating)) return 'Sell';
  if (['strong sell'].includes(lowerCaseRating)) return 'Strong Sell';
  return 'N/A'; // Handle unknowns, empty strings, or nulls
}

/**
 * Calculates a weighted average score (1-5 scale) based on analyst distribution.
 * @param trendEntry An object with counts for strongBuy, buy, hold, sell, strongSell.
 * @returns A numerical score (1-5) or null if input is invalid or has no analysts.
 */
function calculateGaugeScore(trendEntry: any): number | null {
  if (!trendEntry) return null;
  const weights: { [key: string]: number } = { strongBuy: 5, buy: 4, hold: 3, sell: 2, strongSell: 1 };
  let weightedSum = 0;
  let totalAnalysts = 0;
  for (const key in weights) {
    // Ensure the property exists and is a number before using it
    const count = typeof trendEntry[key] === 'number' ? trendEntry[key] : 0;
    weightedSum += count * weights[key];
    totalAnalysts += count;
  }
  if (totalAnalysts === 0) return null; // Avoid division by zero
  return weightedSum / totalAnalysts; // Return the 1-5 score
}

// --- Main Data Processing Function ---

/**
 * Processes the raw API response from yahooFinance.quoteSummary.
 * @param result The raw result object from the API call.
 * @param symbol The stock symbol (used for logging).
 * @returns A structured object containing processed analyst data for the UI, or null on failure.
 */
function processAnalystData(result: any, symbol: string) {
  if (!result) {
    console.warn(`[${symbol}] No result received for analyst data processing.`);
    return null;
  }

  const financialData = result.financialData;
  const recommendationTrend = result.recommendationTrend;
  const upgradeDowngradeHistory = result.upgradeDowngradeHistory;

  // --- 1. Process Upgrade/Downgrade History ---
  let processedHistory: any[] = [];
  try {
    processedHistory = upgradeDowngradeHistory?.history?.map((item: any) => {
      let displayDate = "Invalid Date";
      let dateObject: Date | null = null;

      // Attempt to create a valid Date object
      if (item.epochGradeDate) {
        try {
          // Yahoo provides epochGradeDate in seconds - CONVERT TO MILLISECONDS 
          const timestampInMillis = item.epochGradeDate * 1000;
          const potentialDate = new Date(timestampInMillis);

          if (isValid(potentialDate)) {
            dateObject = potentialDate;
            const year = dateObject.getFullYear();
            // Check for realistic year range to catch bad dates
            if (year < 1980 || year > new Date().getFullYear() + 5) {
              console.warn(`[${symbol}] Parsed date has unlikely year (${year}) from epoch:`, item.epochGradeDate);
              displayDate = "Unlikely Date";
              dateObject = null; // Invalidate if year is out of range
            } else {
              displayDate = format(dateObject, 'MMM dd, yyyy');
              console.log(`Processed date for ${item.firm}: ${displayDate} (raw=${item.epochGradeDate})`);
            }
          } else {
            console.warn(`[${symbol}] Invalid date object created from epoch:`, item.epochGradeDate);
          }
        } catch (parseError) {
          console.error(`[${symbol}] Error parsing date from epoch:`, item.epochGradeDate, parseError);
        }
      } else {
        console.warn(`[${symbol}] Missing epochGradeDate in history item:`, item);
      }

      return {
        date: dateObject, // Store valid Date object or null
        displayDate: displayDate,
        firm: item.firm || 'N/A',
        action: item.action || 'N/A', // Used internally for action type
        // Determine the action type for UI presentation
        actionType: !item.fromGrade ? 'init' : 
                    item.toGrade === item.fromGrade ? 'maintain' :
                    standardizeRating(item.toGrade) > standardizeRating(item.fromGrade) ? 'upgrade' : 'downgrade',
        standardizedToGrade: standardizeRating(item.toGrade),
        standardizedFromGrade: standardizeRating(item.fromGrade),
        originalToGrade: item.toGrade || '', // Keep original for tooltips if needed
      };
    }) || [];

    // Filter out items where we couldn't get a valid date for charting
    processedHistory = processedHistory.filter(item => item.date !== null);
    // Sort valid history items by date, most recent first
    processedHistory.sort((a, b) => (b.date?.getTime() || 0) - (a.date?.getTime() || 0));

  } catch (e) {
    console.error(`[${symbol}] Error processing upgrade/downgrade history:`, e);
  }

  // --- 2. Process Recommendation Trend for Toggling ---
  const trendDataByPeriod: { [key: string]: any } = {};
  recommendationTrend?.trend?.forEach((trend: any) => {
    if (trend && typeof trend.period === 'string') { // Basic validation
      trendDataByPeriod[trend.period] = {
        strongBuy: typeof trend.strongBuy === 'number' ? trend.strongBuy : 0,
        buy: typeof trend.buy === 'number' ? trend.buy : 0,
        hold: typeof trend.hold === 'number' ? trend.hold : 0,
        sell: typeof trend.sell === 'number' ? trend.sell : 0,
        strongSell: typeof trend.strongSell === 'number' ? trend.strongSell : 0,
      };
    } else {
      console.warn(`[${symbol}] Skipping invalid recommendation trend item:`, trend);
    }
  });

  // --- 3. Calculate Overall Score (based on current '0m' trend) ---
  const currentTrend = trendDataByPeriod['0m'];
  const gaugeScore = calculateGaugeScore(currentTrend);
  const totalAnalysts = financialData?.numberOfAnalystOpinions ||
                        (currentTrend ? Object.values(currentTrend).reduce((sum: any, count: any) => sum + count, 0) : 0);

  // --- 4. Structure Final Output for UI ---
  const output = {
    consensusKey: standardizeRating(financialData?.recommendationKey || ''),
    consensusMean: financialData?.recommendationMean || null,
    numberOfAnalysts: totalAnalysts,
    gaugeScore: gaugeScore, // The calculated 1-5 score for the main gauge
    // Trend data structured for easy access by period key ('0m', '-1m', etc.)
    // Used for the Donut/Stacked Bar chart with time toggles
    distributionOverTime: trendDataByPeriod,
    // Processed and sorted history with valid dates, ready for the timeline chart
    ratingHistoryForChart: processedHistory,
  };

  console.log(`[${symbol}] Processed Analyst Data:`, JSON.stringify(output, null, 2)); // Added logging of the final output

  return output;
}

// --- Main API Fetching Function ---

/**
 * Fetches and processes analyst data for a given stock symbol.
 * @param symbol The stock ticker (e.g., "AAPL").
 * @returns A promise resolving to the structured analyst data or null.
 */
export async function getAnalystData(symbol: string): Promise<any | null> {
  console.log(`Fetching analyst data for ${symbol}...`);
  try {
    // Skip type issues for now - cast to any to avoid typescript errors
    // @ts-ignore - Yahoo Finance typings are difficult to work with
    const result = await yahooFinance.quoteSummary(symbol, {
      modules: ['financialData', 'recommendationTrend', 'upgradeDowngradeHistory']
    });
    return processAnalystData(result, symbol); // Pass result and symbol to processor

  } catch (error: any) {
    // Log specific errors if available (e.g., network error, validation error)
    console.error(`[${symbol}] Error in getAnalystData:`, error.message || error);
    return null;
  }
}

// Export the service
export default {
  getAnalystData
};