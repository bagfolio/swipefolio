/**
 * This script explores the Yahoo Finance search API
 * to understand what data is returned for news items
 */

import yahooFinance from 'yahoo-finance2';

async function exploreYahooSearch() {
  try {
    console.log('Testing Yahoo Finance search...');
    
    // Test search for a few different symbols
    const symbols = ['AAPL', 'MSFT', 'TSLA', 'AMZN'];
    
    for (const symbol of symbols) {
      console.log(`\n--- Searching for ${symbol} ---`);
      
      try {
        const searchResults = await yahooFinance.search(symbol);
        
        console.log('Search result keys:', Object.keys(searchResults));
        
        // Focus on news items
        if (searchResults.news && Array.isArray(searchResults.news)) {
          console.log(`\nFound ${searchResults.news.length} news items for ${symbol}`);
          
          searchResults.news.slice(0, 3).forEach((newsItem: any, i) => {
            console.log(`\n-- News Item ${i + 1} --`);
            
            // Show all keys in the news item
            console.log('Keys:', Object.keys(newsItem));
            
            // Print the item as JSON
            console.log('Full news item:', JSON.stringify(newsItem, null, 2));
            
            // Now print specific fields we're interested in
            console.log('Title:', newsItem.title);
            console.log('Publisher:', newsItem.publisher);
            
            // Check the providerPublishTime field
            console.log('Raw providerPublishTime:', newsItem.providerPublishTime);
            
            if (newsItem.providerPublishTime) {
              // Test if it's a timestamp in seconds (Unix format)
              const dateFromSeconds = new Date(newsItem.providerPublishTime * 1000);
              console.log('Date (if seconds):', dateFromSeconds.toLocaleString());
              
              // Test if it's already in milliseconds (JavaScript Date format)
              const dateFromMilliseconds = new Date(newsItem.providerPublishTime);
              console.log('Date (if milliseconds):', dateFromMilliseconds.toLocaleString());
            }
            
            // Thumbnail information
            if (newsItem.thumbnail) {
              console.log('Thumbnail:', newsItem.thumbnail);
              if (newsItem.thumbnail.resolutions) {
                console.log('Thumbnail resolutions:', 
                  newsItem.thumbnail.resolutions.map((r: any) => `${r.width}x${r.height}: ${r.url}`));
              }
            }
            
            console.log('Link:', newsItem.link);
            console.log('Type:', newsItem.type);
            console.log('Related tickers:', newsItem.relatedTickers);
          });
          
          // Check for providerPublishTime being present in all news items
          const hasTime = searchResults.news.every((item: any) => item.providerPublishTime);
          console.log(`\nAll news items have providerPublishTime: ${hasTime}`);
          
          // Check if any item has publishTime instead of providerPublishTime
          const publishTimeItems = searchResults.news.filter((item: any) => item.publishTime);
          console.log(`Items with publishTime field: ${publishTimeItems.length}`);
        }
      } catch (err) {
        console.error(`Error searching for ${symbol}:`, err);
      }
    }
  } catch (error) {
    console.error('Error exploring Yahoo Finance search:', error);
  }
}

// Run the exploration
exploreYahooSearch().then(() => {
  console.log('\nExploration complete!');
}).catch(error => {
  console.error('Exploration failed:', error);
});