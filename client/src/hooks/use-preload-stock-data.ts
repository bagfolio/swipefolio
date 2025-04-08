import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getIndustryStocks } from '@/lib/stock-data';
import { fetchStockChartData, timeFrameToRange } from '@/lib/yahoo-finance-client';

/**
 * This hook aggressively preloads all first stock data in every industry
 * to ensure there are NEVER any empty placeholders for price data
 * when browsing the app.
 */
export function usePreloadStockData() {
  const queryClient = useQueryClient();

  useEffect(() => {
    async function preloadAllFirstCards() {
      console.log('🚀 Aggressively preloading all first stock cards on app startup...');
      
      try {
        // List of all industries in the app
        const industries = [
          'Tech', 'Healthcare', 'Retail', 'Consumer', 'Energy', 
          'Real Estate', 'ESG', 'Fintech', 'Automotive'
        ];
        
        // For tracking preload progress
        let preloadedCount = 0;
        const totalToPreload = industries.length;
        
        // Timeframes to preload (most important ones first)
        const timeFramesToPreload = ['1D', '1M', '1Y'];
        
        // Create a batch of preload promises to run simultaneously
        const preloadPromises = industries.map(async (industry) => {
          const stocks = getIndustryStocks(industry);
          
          if (stocks && stocks.length > 0) {
            const firstStock = stocks[0];
            const symbol = firstStock.ticker;
            
            // Preload multiple timeframes for this stock
            for (const timeframe of timeFramesToPreload) {
              const range = timeFrameToRange[timeframe];
              const queryKey = ['/api/yahoo-finance/chart', symbol, range];
              
              try {
                // Prefetch data with longer staleTime to avoid refetching
                await queryClient.prefetchQuery({
                  queryKey,
                  queryFn: async () => fetchStockChartData(symbol, range),
                  staleTime: 5 * 60 * 1000, // 5 minutes
                  gcTime: 30 * 60 * 1000    // 30 minutes
                });
                
                console.log(`✅ Preloaded ${symbol} (${timeframe}) for ${industry}`);
              } catch (error) {
                console.error(`Failed to preload ${symbol} (${timeframe}):`, error);
              }
            }
            
            // Optionally preload the second stock as well
            if (stocks.length > 1) {
              const secondStock = stocks[1];
              const secondSymbol = secondStock.ticker;
              
              // Only preload 1D for second stock to prioritize first stocks
              const queryKey = ['/api/yahoo-finance/chart', secondSymbol, timeFrameToRange['1D']];
              
              try {
                await queryClient.prefetchQuery({
                  queryKey,
                  queryFn: async () => fetchStockChartData(secondSymbol, timeFrameToRange['1D']),
                  staleTime: 5 * 60 * 1000
                });
                
                console.log(`✅ Preloaded ${secondSymbol} (1D) for ${industry}`);
              } catch (error) {
                console.error(`Failed to preload second stock ${secondSymbol}:`, error);
              }
            }
            
            preloadedCount++;
            console.log(`Preload progress: ${preloadedCount}/${totalToPreload} industries`);
          }
        });
        
        // Execute all preload operations
        await Promise.all(preloadPromises);
        console.log('🎉 Finished preloading all first stock cards!');
        
      } catch (error) {
        console.error('Error in preloading stock data:', error);
      }
    }
    
    // Start preloading immediately
    preloadAllFirstCards();
    
    // No cleanup needed for this effect
  }, [queryClient]);
}