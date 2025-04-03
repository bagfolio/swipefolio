import yahooFinance from 'yahoo-finance2';

/**
 * This file explores the functionality of yahoo-finance2 API
 * Used to test different endpoints and understand the data structure
 */
async function exploreYahooFinance() {
  try {
    // 1. Basic Search
    console.log('1. PERFORMING SEARCH...');
    const searchResults = await yahooFinance.search('AAPL');
    console.log('Search Results:', JSON.stringify(searchResults, null, 2));
    
    // 2. Quote data (current price and basic info)
    console.log('\n2. GETTING QUOTE DATA...');
    const quote = await yahooFinance.quote('AAPL');
    console.log('Quote Data:', JSON.stringify(quote, null, 2));
    
    // 3. Quote Summary (detailed company information)
    console.log('\n3. GETTING QUOTE SUMMARY...');
    const quoteSummary = await yahooFinance.quoteSummary('AAPL', { modules: ['assetProfile', 'financialData'] });
    console.log('Quote Summary:', JSON.stringify(quoteSummary, null, 2));
    
    // 4. Historical Data
    console.log('\n4. GETTING HISTORICAL DATA...');
    const historical = await yahooFinance.historical('AAPL', {
      period1: '2023-01-01',
      period2: '2023-12-31'
    });
    console.log(`Historical Data: ${historical.length} records`);
    console.log('First Entry:', JSON.stringify(historical[0], null, 2));
    
    // 5. Recommendations
    console.log('\n5. GETTING RECOMMENDATIONS...');
    const recommendations = await yahooFinance.recommendationsBySymbol('AAPL');
    console.log('Recommendations:', JSON.stringify(recommendations, null, 2));
    
    // 6. Trending Symbols
    console.log('\n6. GETTING TRENDING SYMBOLS...');
    const trending = await yahooFinance.trendingSymbols('US');
    console.log('Trending Symbols:', JSON.stringify(trending, null, 2));
  } catch (error) {
    console.error('Error exploring Yahoo Finance API:', error);
  }
}

exploreYahooFinance();