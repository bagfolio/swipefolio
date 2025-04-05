
const yahooFinance = require('yahoo-finance2');

async function fetchDividendHistory() {
  console.log('Fetching dividend history...');
  
  try {
    // Fetch VOO dividend history
    console.log('\n--- VOO Dividend History ---');
    const vooQuoteSummary = await yahooFinance.quoteSummary('VOO', { 
      modules: ['price', 'summaryDetail'] 
    });
    
    console.log(`Current dividend yield: ${vooQuoteSummary.summaryDetail.dividendYield * 100}%`);
    console.log(`Annual dividend rate: $${vooQuoteSummary.summaryDetail.dividendRate}`);

    // Fetch historical data with dividends
    const vooHistory = await yahooFinance.historical('VOO', {
      period1: '2022-01-01',
      period2: '2024-05-01',
      events: 'dividends'
    });
    
    // Filter out entries without dividends
    const vooDividends = vooHistory.filter(item => item.dividends);
    
    console.log('\nVOO Recent Dividends:');
    console.table(vooDividends.map(item => ({
      date: item.date.toISOString().split('T')[0],
      dividend: item.dividends.toFixed(4)
    })));
    
    // Now do the same for S&P 500 ETF (SPY) for comparison
    console.log('\n--- S&P 500 (SPY) Dividend History ---');
    const spyQuoteSummary = await yahooFinance.quoteSummary('SPY', { 
      modules: ['price', 'summaryDetail'] 
    });
    
    console.log(`Current dividend yield: ${spyQuoteSummary.summaryDetail.dividendYield * 100}%`);
    console.log(`Annual dividend rate: $${spyQuoteSummary.summaryDetail.dividendRate}`);
    
    const spyHistory = await yahooFinance.historical('SPY', {
      period1: '2022-01-01',
      period2: '2024-05-01',
      events: 'dividends'
    });
    
    const spyDividends = spyHistory.filter(item => item.dividends);
    
    console.log('\nSPY Recent Dividends:');
    console.table(spyDividends.map(item => ({
      date: item.date.toISOString().split('T')[0],
      dividend: item.dividends.toFixed(4)
    })));
  } catch (error) {
    console.error('Error fetching dividend data:', error);
  }
}

fetchDividendHistory();
