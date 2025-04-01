// Import necessary modules
import { portfolioContextInstance } from '../lib/portfolio-context-instance';

export interface LeaderboardUser {
  id: string;
  name: string;
  username: string;
  avatar: string;
  roi: number; // Percentage
  trades: number;
  portfolioQuality: number; // 0-100 score
  referrals: number;
  isVerified?: boolean;
  rank?: number; // Current rank position
}

export const leaderboardUsers: LeaderboardUser[] = [
  {
    id: "lebron-james",
    name: "Lebron James",
    username: "KingJames",
    avatar: "/images/BRONY.png", 
    roi: 545.8,
    trades: 100,
    portfolioQuality: 99,
    referrals: 10482,
    isVerified: true,
  },
  {
    id: "value-buffet",
    name: "Warren Buffet",
    username: "ValueBuffet",
    avatar: "/images/Warren.png", 
    roi: 156.3,
    trades: 89,
    portfolioQuality: 94,
    referrals: 538,
    isVerified: true,
  },
  {
    id: "outsider-trading",
    name: "Nancy Pelosi",
    username: "OutsiderTrading",
    avatar: "/images/OUTSIDERTRADING.png",
    roi: 128.7,
    trades: 1013,
    portfolioQuality: 90,
    referrals: 1057,
  },
  {
    id: "investor-4",
    name: "Julie Sweet",
    username: "JulieSweetCEO",
    avatar: "/images/Julie.png", 
    roi: 97.5,
    trades: 76,
    portfolioQuality: 89,
    referrals: 124,
  },
  {
    id: "investor-5",
    name: "Jimmy",
    username: "MrBeast",
    avatar: "/images/Jimmy.png",
    roi: 83.2,
    trades: 103,
    portfolioQuality: 81,
    referrals: 992,
  },
  {
    id: "investor-6",
    name: "Elon Musk",
    username: "ElonMusk",
    avatar: "/images/Musk.png",
    roi: 76.8,
    trades: 158,
    portfolioQuality: 77,
    referrals: 63,
  },
  {
    id: "investor-7",
    name: "Michelle Obama",
    username: "MichelleO",
    avatar: "/images/OBAMA.png",
    roi: 65.4,
    trades: 67,
    portfolioQuality: 82,
    referrals: 51,
  },
  {
    id: "investor-8",
    name: "Oprah Winfrey",
    username: "Oprah",
    avatar: "/images/OPRAH.png",
    roi: 53.9,
    trades: 91,
    portfolioQuality: 71,
    referrals: 38,
  },
  {
    id: "investor-9",
    name: "Kanye West",
    username: "Ye",
    avatar: "/images/Kanye.jpg",
    roi: 42.7,
    trades: 58,
    portfolioQuality: 68,
    referrals: 24,
  },
  {
    id: "investor-10",
    name: "Kurt Fass",
    username: "BettiestWhite",
    avatar: "/images/Betty.png",
    roi: 36.5,
    trades: 42,
    portfolioQuality: 63,
    referrals: 15,
  },
  {
    id: "current-user",
    name: "Belford & Co",
    username: "Belford&Co",
    avatar: "/images/default-avatar.png",
    roi: 0, // Will be dynamically calculated from portfolio context
    trades: 0, // Will be dynamically calculated from portfolio context
    portfolioQuality: 0, // Will be dynamically calculated from portfolio context 
    referrals: 0,
  }
];

// Function to get leaderboard data with rankings applied
export function getLeaderboardData(): LeaderboardUser[] {
  // Get portfolio context metrics
  const portfolioContext = portfolioContextInstance.getContext();

  // Update the current user with latest stats from context
  const updatedUsers = leaderboardUsers.map(user => {
    if (user.id === "current-user" && portfolioContext) {
      return {
        ...user,
        roi: portfolioContext.portfolioMetrics.roi,
        trades: portfolioContext.portfolioMetrics.trades,
        portfolioQuality: portfolioContext.portfolioMetrics.qualityScore
      };
    }
    return user;
  });

  // Sort by portfolioQuality (highest first)
  const sortedUsers = [...updatedUsers].sort((a, b) => b.portfolioQuality - a.portfolioQuality);

  // Add rank property
  return sortedUsers.map((user, index) => ({
    ...user,
    rank: index + 1
  }));
}

// Function to get top N users for the competition tracker
export function getTopUsers(count: number = 3): LeaderboardUser[] {
  return getLeaderboardData().slice(0, count);
}

// Function to get current user's rank and data
export function getCurrentUserRank(): LeaderboardUser | undefined {
  const rankedData = getLeaderboardData();
  return rankedData.find(user => user.id === "current-user");
}

// Calculate trade count from holdings (will be called from components)
export function calculateTrades(holdings: any[]): number {
  return holdings.length;
}

// Calculate portfolio quality (based on equal weighting of performance, momentum, stability, and value)
export function calculatePortfolioQuality(holdings: any[]): number {
  if (holdings.length === 0) return 0; // Default is 0 for empty portfolio

  // 1. PERFORMANCE: Based on projected returns
  const performanceScore = holdings.reduce((total, holding) => {
    const oneYearReturnPercent = 
      typeof holding.stock.oneYearReturn === 'number' ? holding.stock.oneYearReturn :
      typeof holding.stock.oneYearReturn === 'string' ? parseFloat(holding.stock.oneYearReturn.replace('%', '')) : 
      0;

    // Scale performance score - 20% return or higher gets full 100 points
    const holdingPerformanceScore = Math.min(100, (oneYearReturnPercent / 20) * 100);
    return total + holdingPerformanceScore;
  }, 0) / (holdings.length || 1);

  // 2. MOMENTUM: Based on 3-month returns and RSI
  const momentumScore = holdings.reduce((total, holding) => {
    // Extract RSI if available, or use a default value
    const rsi = holding.stock.rsi || 50;

    // Extract 3-month return if available, or use a default value
    const threeMonthReturn = 
      holding.stock.threeMonthReturn || 
      (typeof holding.stock.oneYearReturn === 'number' ? holding.stock.oneYearReturn / 4 : 
      typeof holding.stock.oneYearReturn === 'string' ? parseFloat(holding.stock.oneYearReturn.replace('%', '')) / 4 : 
      0);

    // RSI score - 50 is neutral, higher is better up to 70 (above 70 is overbought)
    // Score peaks at RSI of 65 (ideal momentum) and decreases after that
    const rsiScore = rsi <= 65 ? (rsi / 65) * 100 : 100 - ((rsi - 65) / 15) * 100;

    // 3-month return score - 5% or higher gets full score
    const returnScore = Math.min(100, (threeMonthReturn / 5) * 100);

    // Combined momentum score - equal weight to RSI and 3-month return
    const holdingMomentumScore = (rsiScore + returnScore) / 2;
    return total + holdingMomentumScore;
  }, 0) / (holdings.length || 1);

  // 3. STABILITY: Based on diversification and beta
  // Diversification component - more holdings = more stable
  const diversificationScore = Math.min(100, holdings.length * 20); // 5+ holdings = full diversification score

  // Beta component - average stock beta, where 1.0 is market average
  // Lower beta = more stable
  const betaScore = holdings.reduce((total, holding) => {
    const beta = holding.stock.beta || 1.0;
    // Ideal beta is 0.8 (stable but not stagnant)
    // Score decreases as beta gets farther from 0.8 in either direction
    const betaDistance = Math.abs(beta - 0.8);
    const holdingBetaScore = Math.max(0, 100 - (betaDistance * 50));
    return total + holdingBetaScore;
  }, 0) / (holdings.length || 1);

  // Combined stability score
  const stabilityScore = (diversificationScore + betaScore) / 2;

  // 4. VALUE: Based on P/E ratio, dividend yield, and price-to-book
  const valueScore = holdings.reduce((total, holding) => {
    // Extract metrics if available, or use default values
    const pe = holding.stock.pe || 20;
    const dividendYield = holding.stock.dividendYield || 0;
    const priceToBook = holding.stock.priceToBook || 3;

    // P/E score - lower is better (15 or below is good value)
    const peScore = pe <= 15 ? 100 : Math.max(0, 100 - ((pe - 15) / 25) * 100);

    // Dividend yield score - higher is better (4% or above is excellent)
    const dividendScore = Math.min(100, (dividendYield / 4) * 100);

    // Price-to-book score - lower is better (1.5 or below is good value)
    const ptbScore = priceToBook <= 1.5 ? 100 : Math.max(0, 100 - ((priceToBook - 1.5) / 3) * 100);

    // Combined value score - equal weight to all three metrics
    const holdingValueScore = (peScore + dividendScore + ptbScore) / 3;
    return total + holdingValueScore;
  }, 0) / (holdings.length || 1);

  // Final quality score - equal weighting of all four components
  const qualityScore = Math.round((performanceScore + momentumScore + stabilityScore + valueScore) / 4);

  // For debugging - log the component scores
  console.log("New portfolio metrics calculated:");
  console.log(`- Performance: ${Math.round(performanceScore)}`);
  console.log(`- Stability: ${Math.round(stabilityScore)}`);
  console.log(`- Value: ${Math.round(valueScore)}`);
  console.log(`- Momentum: ${Math.round(momentumScore)}`);

  return qualityScore;
}

// Get color based on quality score
export function getQualityScoreColor(score: number): string {
  if (score >= 90) return 'text-emerald-500'; // Excellent
  if (score >= 80) return 'text-green-500';   // Very Good
  if (score >= 70) return 'text-lime-500';    // Good
  if (score >= 60) return 'text-yellow-500';  // Fair
  if (score >= 50) return 'text-amber-500';   // Moderate
  if (score >= 40) return 'text-orange-500';  // Below Average
  if (score >= 30) return 'text-red-500';     // Poor
  return 'text-red-700';                      // Very Poor
}

// Get background color based on quality score (for visual elements)
export function getQualityScoreBgColor(score: number): string {
  if (score >= 90) return 'bg-emerald-500'; // Excellent
  if (score >= 80) return 'bg-green-500';   // Very Good
  if (score >= 70) return 'bg-lime-500';    // Good
  if (score >= 60) return 'bg-yellow-500';  // Fair
  if (score >= 50) return 'bg-amber-500';   // Moderate
  if (score >= 40) return 'bg-orange-500';  // Below Average
  if (score >= 30) return 'bg-red-500';     // Poor
  return 'bg-red-700';                      // Very Poor
}