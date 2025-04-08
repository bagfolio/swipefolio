/**
 * This script explores SEC filing data for a given company symbol
 * It demonstrates how to fetch and display key information from SEC filings
 */

import axios from 'axios';

// Main function to explore SEC filings
async function exploreSecFilings(ticker: string = 'AAPL') {
  console.log(`Exploring SEC filings for ${ticker}...`);
  
  try {
    // Fetch recent filings using the SEC EDGAR API
    const response = await axios.get(
      `https://data.sec.gov/api/xbrl/companyfacts/${ticker}.json`,
      {
        headers: {
          // SEC requires a user agent with contact information
          'User-Agent': 'ExampleApp contact@example.com'
        }
      }
    );
    
    const data = response.data;
    console.log('SEC Company Facts Response:', data);
    
    // Extract company details
    const companyInfo = {
      name: data.entityName,
      cik: data.cik,
      sic: data.sic,
      sicDescription: data.sicDescription,
      tickers: data.tickers,
    };
    
    console.log('\nCompany Information:');
    console.log(JSON.stringify(companyInfo, null, 2));
    
    // Extract key financial metrics from filings
    if (data.facts && data.facts['us-gaap']) {
      console.log('\nKey Financial Metrics:');
      
      // Revenue
      extractMetric(data, 'us-gaap', 'Revenue', 'Revenue');
      
      // Net Income
      extractMetric(data, 'us-gaap', 'NetIncomeLoss', 'Net Income');
      
      // Assets
      extractMetric(data, 'us-gaap', 'Assets', 'Total Assets');
      
      // Liabilities
      extractMetric(data, 'us-gaap', 'Liabilities', 'Total Liabilities');
      
      // Earnings Per Share
      extractMetric(data, 'us-gaap', 'EarningsPerShareBasic', 'EPS (Basic)');
      
      // Cash and Equivalents
      extractMetric(data, 'us-gaap', 'CashAndCashEquivalentsAtCarryingValue', 'Cash & Equivalents');
    }
    
    // Extract recent filing list
    console.log('\nRecent SEC Filings:');
    if (data.facts && data.facts['dei'] && data.facts['dei']['DocumentType']) {
      const filings = data.facts['dei']['DocumentType'].units.shares;
      
      // Sort by most recent first
      const recentFilings = filings
        .sort((a, b) => new Date(b.filed).getTime() - new Date(a.filed).getTime())
        .slice(0, 10);
      
      recentFilings.forEach((filing, index) => {
        console.log(`${index + 1}. Form ${filing.val} - Filed: ${filing.filed} - For period ending: ${filing.end}`);
      });
    }
    
  } catch (error) {
    console.error('Error fetching SEC data:', error.response ? error.response.data : error.message);
    
    if (error.response && error.response.status === 403) {
      console.log('\nNote: The SEC API requires a valid User-Agent header with contact information.');
      console.log('You can also try the alternative method of fetching SEC data below:');
      await exploreSecAlternativeMethod(ticker);
    }
  }
}

// Alternative method using Yahoo Finance API
async function exploreSecAlternativeMethod(ticker: string) {
  try {
    console.log(`\nFetching SEC filings for ${ticker} using alternative method...`);
    
    // Fetch SEC filings using Yahoo Finance API
    const response = await axios.get(`/api/yahoo-finance/sec-filings/${ticker}`);
    console.log('SEC Filings Response:', response.data);
    
    // Display recent filings
    if (response.data && response.data.filings && response.data.filings.length > 0) {
      console.log('\nRecent SEC Filings (Yahoo Finance):');
      
      response.data.filings.forEach((filing, index) => {
        console.log(`${index + 1}. Form ${filing.type} - Filed: ${filing.date} - ${filing.title || 'No title'}`);
        console.log(`   URL: ${filing.url}`);
      });
    }
    
  } catch (error) {
    console.error('Error fetching SEC data (alternative method):', error.response ? error.response.data : error.message);
  }
}

// Helper function to extract and display a specific financial metric
function extractMetric(data, taxonomy: string, metricName: string, displayName: string) {
  try {
    if (data.facts[taxonomy] && data.facts[taxonomy][metricName]) {
      const unitsKey = Object.keys(data.facts[taxonomy][metricName].units)[0];
      const values = data.facts[taxonomy][metricName].units[unitsKey];
      
      // Sort by most recent and get the latest annual report value
      const sortedValues = values
        .filter(v => v.form === '10-K')  // Annual reports only
        .sort((a, b) => new Date(b.end).getTime() - new Date(a.end).getTime());
      
      if (sortedValues.length > 0) {
        const latestValue = sortedValues[0];
        console.log(`${displayName}: ${formatNumber(latestValue.val)} (FY ending ${latestValue.end})`);
      }
    }
  } catch (error) {
    console.log(`${displayName}: Not available`);
  }
}

// Helper function to format numbers with commas and dollar signs for readability
function formatNumber(value) {
  if (value >= 1000000000) {
    return `$${(value / 1000000000).toFixed(2)} billion`;
  } else if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(2)} million`;
  } else {
    return `$${value.toLocaleString()}`;
  }
}

// Execute the script for Apple by default
const ticker = process.argv[2] || 'AAPL';
exploreSecFilings(ticker).catch(console.error);

export {};