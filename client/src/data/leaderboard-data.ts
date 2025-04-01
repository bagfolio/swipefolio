// Define the LeaderboardUser interface
export interface LeaderboardUser {
  id: string;
  name: string;
  username: string;
  avatar: string;
  roi: number;
  trades: number;
  referrals: number;
  portfolioQuality: number;
  rank?: number;
}

// Generate sample leaderboard data
const leaderboardUsers: LeaderboardUser[] = [
  {
    id: "current-user",
    name: "Belford & Co",
    username: "Belford&Co",
    avatar: "/images/avatars/belford-avatar.png",
    roi: 12.5,
    trades: 23,
    referrals: 0,
    portfolioQuality: 78,
    rank: 4
  },
  {
    id: "user-1",
    name: "Investment Titans",
    username: "InvestTitans",
    avatar: "/images/avatars/avatar-1.png",
    roi: 21.8,
    trades: 42,
    referrals: 15,
    portfolioQuality: 91,
    rank: 1
  },
  {
    id: "user-2",
    name: "Capital Ventures",
    username: "CapVentures",
    avatar: "/images/avatars/avatar-2.png",
    roi: 18.3,
    trades: 31,
    referrals: 8,
    portfolioQuality: 87,
    rank: 2
  },
  {
    id: "user-3",
    name: "Growth Accelerated",
    username: "GrowthAccel",
    avatar: "/images/avatars/avatar-3.png",
    roi: 15.7,
    trades: 27,
    referrals: 5,
    portfolioQuality: 82,
    rank: 3
  },
  {
    id: "user-5",
    name: "Value Investors",
    username: "ValueInv",
    avatar: "/images/avatars/avatar-5.png",
    roi: 11.2,
    trades: 19,
    referrals: 3,
    portfolioQuality: 75,
    rank: 5
  },
  {
    id: "user-6",
    name: "Dividend Kings",
    username: "DivKings",
    avatar: "/images/avatars/avatar-6.png",
    roi: 9.8,
    trades: 15,
    referrals: 2,
    portfolioQuality: 72,
    rank: 6
  },
  {
    id: "user-7",
    name: "Tech Investors",
    username: "TechInv",
    avatar: "/images/avatars/avatar-7.png",
    roi: 8.5,
    trades: 12,
    referrals: 1,
    portfolioQuality: 68,
    rank: 7
  },
  {
    id: "user-8",
    name: "Momentum Traders",
    username: "MomentumT",
    avatar: "/images/avatars/avatar-8.png",
    roi: 7.1,
    trades: 28,
    referrals: 0,
    portfolioQuality: 65,
    rank: 8
  },
  {
    id: "user-9",
    name: "Index Followers",
    username: "IndexFol",
    avatar: "/images/avatars/avatar-9.png",
    roi: 6.4,
    trades: 8,
    referrals: 0,
    portfolioQuality: 62,
    rank: 9
  },
  {
    id: "user-10",
    name: "Emerging Markets",
    username: "EmMarkets",
    avatar: "/images/avatars/avatar-10.png",
    roi: 5.2,
    trades: 10,
    referrals: 0,
    portfolioQuality: 58,
    rank: 10
  }
];

// Function to get all leaderboard data
export function getLeaderboardData(): LeaderboardUser[] {
  return leaderboardUsers;
}

// Function to get current user's ranking info
export function getCurrentUserRank(): LeaderboardUser | undefined {
  return leaderboardUsers.find(user => user.id === "current-user");
}

// Function to get top performers (top 3)
export function getTopPerformers(count: number = 3): LeaderboardUser[] {
  return [...leaderboardUsers]
    .sort((a, b) => b.portfolioQuality - a.portfolioQuality)
    .slice(0, count);
}

// Function to search users by name
export function searchUsers(query: string): LeaderboardUser[] {
  if (!query) return leaderboardUsers;
  
  const lowerCaseQuery = query.toLowerCase();
  return leaderboardUsers.filter(user => 
    user.name.toLowerCase().includes(lowerCaseQuery) || 
    user.username.toLowerCase().includes(lowerCaseQuery)
  );
}