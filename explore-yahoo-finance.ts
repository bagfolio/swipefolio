import yahooFinance from 'yahoo-finance2';
import fs from 'fs';

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
    
    // 7. News Data from Search
    console.log('\n7. GETTING NEWS DATA FROM SEARCH...');
    await exploreNewsData('AAPL');
  } catch (error) {
    console.error('Error exploring Yahoo Finance API:', error);
  }
}

/**
 * Dedicated function to explore news data for a symbol
 */
async function exploreNewsData(symbol: string) {
  try {
    const searchResults = await yahooFinance.search(symbol);
    
    if (searchResults && searchResults.news && Array.isArray(searchResults.news)) {
      console.log(`Found ${searchResults.news.length} news items for ${symbol}`);
      
      // Display news items
      searchResults.news.forEach((item, index) => {
        console.log(`\nNews Item #${index + 1}:`);
        console.log(`- Title: ${item.title}`);
        console.log(`- Publisher: ${item.publisher}`);
        console.log(`- Date: ${new Date(item.providerPublishTime).toLocaleString()}`);
        console.log(`- Link: ${item.link}`);
        console.log(`- Related Tickers: ${item.relatedTickers ? item.relatedTickers.join(', ') : 'None'}`);
        
        if (item.thumbnail && item.thumbnail.resolutions) {
          console.log(`- Has ${item.thumbnail.resolutions.length} thumbnail images`);
        } else {
          console.log(`- No thumbnail images`);
        }
      });
      
      // Save news data to a file for reference
      fs.writeFileSync(
        `yahoo-finance-news-${symbol}.json`, 
        JSON.stringify(searchResults.news, null, 2)
      );
      console.log(`\nSaved news data to yahoo-finance-news-${symbol}.json`);
    } else {
      console.log(`No news found for ${symbol} in search results`);
      console.log('Search result structure:', JSON.stringify(searchResults, null, 2));
    }
  } catch (error) {
    console.error(`Error exploring news data for ${symbol}:`, error);
  }
}

exploreYahooFinance();