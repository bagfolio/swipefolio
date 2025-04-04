/**
 * This script tests the Yahoo Finance insights API
 * to see what data is returned for a given symbol
 */

import yahooFinance from 'yahoo-finance2';

async function exploreYahooInsights() {
  try {
    console.log('Testing Yahoo Finance insights...');
    
    // Test insights for a few different symbols
    const symbols = ['AYX', 'AAPL', 'MSFT', 'TSLA', 'AMZN'];
    
    for (const symbol of symbols) {
      console.log(`\n--- Getting insights for ${symbol} ---`);
      const queryOptions = { lang: 'en-US', reportsCount: 2, region: 'US' };
      
      try {
        // Use any type to avoid TypeScript errors since we're exploring the structure
        const result = await yahooFinance.insights(symbol, queryOptions) as any;
        
        // Print out high-level keys first
        console.log('Available data sections:', Object.keys(result));
        
        // Dynamic exploration of all data sections
        Object.keys(result).forEach(section => {
          if (section === 'reports' || section === 'symbol' || section === 'upsell') {
            // We'll handle reports separately
            return;
          }
          
          // For each section, print its keys and some sample values
          console.log(`\n${section.toUpperCase()} SECTION:`);
          
          const sectionData = result[section];
          if (typeof sectionData === 'object' && sectionData !== null) {
            console.log('- Keys:', Object.keys(sectionData));
            
            // Print a sample of each key's data
            Object.entries(sectionData).forEach(([key, value]) => {
              if (typeof value === 'object' && value !== null) {
                console.log(`- ${key}:`, 'Object with keys:', Object.keys(value));
              } else {
                console.log(`- ${key}:`, value);
              }
            });
          } else {
            console.log('- Value:', sectionData);
          }
        });
        
        // Specific handling for recommendation section
        if (result.recommendation) {
          console.log('\nRECOMMENDATION DETAILS:');
          const rec = result.recommendation;
          console.log('- Rating:', rec.rating);
          console.log('- Target price:', rec.targetPrice);
          console.log('- Provider:', rec.provider);
        }
        
        // Instrument insights - better way to explore
        if (result.instrumentInfo) {
          console.log('\nINSTRUMENT INFO DETAILS:');
          const info = result.instrumentInfo;
          
          // Safely explore nested objects
          Object.keys(info).forEach(key => {
            if (typeof info[key] === 'object' && info[key] !== null) {
              console.log(`- ${key}: Object with keys:`, Object.keys(info[key]));
            } else {
              console.log(`- ${key}:`, info[key]);
            }
          });
        }
        
        // News insights
        if (result.reports && result.reports.length > 0) {
          console.log('\nNews reports:');
          result.reports.forEach((report: any, i) => {
            console.log(`\n-- Report ${i + 1} --`);
            console.log('- All report keys:', Object.keys(report));
            
            // Print all fields directly
            console.log('- Full report object:', JSON.stringify(report, null, 2));
            
            // Explore all properties safely
            Object.entries(report).forEach(([key, value]) => {
              // Skip printing the full object again
              if (key === 'publishedOn' && typeof value === 'number') {
                // Try to convert publishedOn to a date if it exists and is a number
                const date1 = new Date(value * 1000);
                const date2 = new Date(value);
                console.log(`- ${key} as timestamp (* 1000):`, date1.toLocaleString());
                console.log(`- ${key} as direct date:`, date2.toLocaleString());
              } 
              else if (key !== 'content' && typeof value !== 'object') {
                // Only print non-object values to avoid too much output
                console.log(`- ${key}:`, value);
              }
              else if (typeof value === 'object' && value !== null) {
                console.log(`- ${key}:`, 'Object with keys', Object.keys(value));
              }
            });
          });
        }
      } catch (err) {
        console.error(`Error getting insights for ${symbol}:`, err);
      }
    }
  } catch (error) {
    console.error('Error exploring Yahoo Finance insights:', error);
  }
}

// Run the exploration
exploreYahooInsights().then(() => {
  console.log('\nExploration complete!');
}).catch(error => {
  console.error('Exploration failed:', error);
});