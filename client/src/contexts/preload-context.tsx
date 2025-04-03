import React, { createContext, useContext, ReactNode } from 'react';
import { usePreloadFirstStocksFromStacks, getAllPreloadedData, getPreloadedStockData } from '@/services/preload-service';

interface PreloadContextType {
  isLoading: boolean;
  error: string | null;
  preloadedData: Record<string, any>;
  getStockData: (symbol: string, period?: string) => any;
}

const PreloadContext = createContext<PreloadContextType>({
  isLoading: true,
  error: null,
  preloadedData: {},
  getStockData: () => null,
});

export const usePreloadedData = () => useContext(PreloadContext);

interface PreloadProviderProps {
  children: ReactNode;
}

export const PreloadProvider: React.FC<PreloadProviderProps> = ({ children }) => {
  // Use the preloading hook to load data from first stocks in all stacks
  const { loading, error } = usePreloadFirstStocksFromStacks();
  
  // Get all preloaded data
  const preloadedData = getAllPreloadedData();
  
  // Function to get stock data for a specific symbol and period
  const getStockData = (symbol: string, period?: string) => {
    return getPreloadedStockData(symbol, period);
  };
  
  // Value for the context
  const value = {
    isLoading: loading,
    error,
    preloadedData,
    getStockData,
  };
  
  return (
    <PreloadContext.Provider value={value}>
      {children}
    </PreloadContext.Provider>
  );
};