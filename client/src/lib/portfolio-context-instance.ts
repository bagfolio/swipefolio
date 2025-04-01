// This file provides a singleton instance to access the portfolio context
// It allows components outside the React component hierarchy to access portfolio data

import { PortfolioContextProps } from '../contexts/portfolio-context';

class PortfolioContextInstance {
  private context: PortfolioContextProps | null = null;

  setContext(context: PortfolioContextProps) {
    this.context = context;
    console.log('Setting portfolio context instance');
  }

  getContext(): PortfolioContextProps | null {
    return this.context;
  }
}

// Create a singleton instance
export const portfolioContextInstance = new PortfolioContextInstance();