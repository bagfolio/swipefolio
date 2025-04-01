import React, { useState, useEffect, useContext } from "react";
import { Link } from "wouter";
import { 
  Trophy, 
  TrendingUp, 
  BarChart3, 
  Users, 
  ChevronUp, 
  Search, 
  ArrowLeft, 
  Star,
  Check,
  UserPlus,
  ChevronRight,
  Zap
} from "lucide-react";
import { motion } from "framer-motion";
import { 
  getLeaderboardData, 
  getCurrentUserRank, 
  LeaderboardUser
} from "@/data/leaderboard-data";
import { PortfolioContext } from "@/contexts/portfolio-context";
import InvestorProfilePopup from "@/components/investor-profile-popup";

const LeaderboardPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"all" | "friends">("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [friendsList, setFriendsList] = useState<LeaderboardUser[]>([]);
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardUser[]>([]);
  const [currentUser, setCurrentUser] = useState<LeaderboardUser | undefined>();
  const [selectedInvestor, setSelectedInvestor] = useState<LeaderboardUser | null>(null);
  const [showProfilePopup, setShowProfilePopup] = useState<boolean>(false);
  const portfolio = useContext(PortfolioContext);
  
  // Handler to open investor profile popup
  const handleOpenProfile = (investor: LeaderboardUser) => {
    setSelectedInvestor(investor);
    setShowProfilePopup(true);
  };
  
  // Handler to close investor profile popup
  const handleCloseProfile = () => {
    setShowProfilePopup(false);
  };
  
  // Update user stats and refetch leaderboard data when portfolio changes
  useEffect(() => {
    if (!portfolio) return;
    
    // Fetch the base leaderboard data (bots only)
    let baseLeaderboardData = getLeaderboardData();
    
    // Construct live user data from the portfolio context
    const userStats: LeaderboardUser = {
      id: "current-user",
      name: "Belford & Co",
      username: "Belford&Co",
      avatar: "/images/default-avatar.png",
      referrals: 0,
      roi: 0,
      trades: 0,
      portfolioQuality: 0
    };
    
    // Get metrics directly from the portfolio context
    userStats.roi = portfolio.portfolioMetrics.roi;
    userStats.trades = portfolio.portfolioMetrics.trades;
    userStats.portfolioQuality = portfolio.portfolioMetrics.qualityScore;
    
    console.log("Leaderboard using portfolio metrics:", {
      roi: userStats.roi.toFixed(2),
      trades: userStats.trades,
      qualityScore: userStats.portfolioQuality
    });
    
    // Update the current user in the base data
    const updatedLeaderboardData = baseLeaderboardData.map(user => 
      user.id === "current-user" ? userStats : user
    );
    
    // Sort by portfolioQuality (quality score) instead of ROI
    const sortedData = [...updatedLeaderboardData].sort((a, b) => b.portfolioQuality - a.portfolioQuality)
      .map((user, index) => ({
        ...user,
        rank: index + 1
      }));
    
    // Update component state
    setLeaderboardData(sortedData);
    setCurrentUser(sortedData.find(u => u.id === "current-user"));
    
  }, [
    portfolio, 
    portfolio?.holdings.length,
    portfolio?.version,
    portfolio?.lastUpdated,
    portfolio?.portfolioMetrics
  ]);
  
  // Initialize data on component mount
  useEffect(() => {
    setLeaderboardData(getLeaderboardData());
    setCurrentUser(getCurrentUserRank());
  }, []);
  
  // Filter data based on search query
  const filteredData = leaderboardData.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Metrics with shorter display names for better mobile layout
  const metrics = [
    { name: "ROI", icon: <TrendingUp className="w-3 h-3" />, key: "roi", format: (val: number) => `${val.toFixed(1)}%` },
    { name: "Trades", icon: <BarChart3 className="w-3 h-3" />, key: "trades", format: (val: number) => val.toString() },
    { 
      name: "Quality", 
      icon: <Star className="w-3 h-3" />, 
      key: "portfolioQuality", 
      format: (val: number) => val.toString(),
      isBold: true // Mark this metric to be displayed in bold
    },
    { name: "Refs", icon: <Users className="w-3 h-3" />, key: "referrals", format: (val: number) => val.toString() },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 pb-20">
      {/* Header - Lighter Background */}
      <div className="bg-gradient-to-r from-slate-100 to-blue-50 text-slate-800 pt-10 pb-8 px-4 rounded-b-3xl shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <Link href="/">
            <button className="flex items-center text-slate-600 hover:text-slate-800 transition-colors">
              <ArrowLeft className="w-5 h-5 mr-1" />
              <span>Back</span>
            </button>
          </Link>
          <div className="w-5"></div> {/* Empty div for even spacing */}
        </div>
        
        {/* iOS-Style Tab Selector - Moved to top as requested */}
        <div className="flex justify-center mb-4">
          <div className="bg-white/90 backdrop-blur-sm p-1 rounded-full flex shadow-sm border border-slate-200">
            <button 
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${activeTab === 'all' ? 'bg-blue-500 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}
              onClick={() => setActiveTab('all')}
            >
              All Investors
            </button>
            <button 
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${activeTab === 'friends' ? 'bg-blue-500 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}
              onClick={() => setActiveTab('friends')}
            >
              Friends
            </button>
          </div>
        </div>
        
        {/* Enhanced Leaderboard Title */}
        <div className="text-center mb-5">
          <h1 className="text-3xl font-bold text-slate-800 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Leaderboard</h1>
          <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-indigo-500 mx-auto mt-1 rounded-full"></div>
        </div>
        
        {/* iOS-Style Card Podium Layout for Top 3 */}
        <div className="py-3 px-2 mb-8">
          {/* New 3-card arrangement for top performers */}
          <div className="flex flex-col items-center mb-6">
            <div className="flex mb-1 -space-x-1">
              <span className="text-xs font-medium text-slate-500">TOP PERFORMERS</span>
              <div className="w-1 h-1 rounded-full bg-slate-400 my-auto mx-2"></div>
              <Trophy className="w-3.5 h-3.5 text-yellow-500" />
            </div>
          </div>
          
          <div className="relative flex justify-center items-end space-x-3 max-w-md mx-auto">
            {/* 2nd Place Card */}
            <motion.div 
              className="relative z-10 w-[30%]"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.3 }}
            >
              <div 
                onClick={() => filteredData[1] && handleOpenProfile(filteredData[1])}
                className="bg-white rounded-2xl shadow-md p-3 transform -translate-y-6 cursor-pointer hover:shadow-lg transition-all active:scale-[0.98]">
                <div className="flex flex-col items-center">
                  {/* Rank indicator */}
                  <div className="absolute -top-2 right-3 bg-slate-400 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold text-white shadow border border-white">
                    2
                  </div>
                  
                  {/* Avatar with silver frame */}
                  <div className="relative mb-3">
                    <div className="w-16 h-16 rounded-full overflow-hidden border-[3px] border-slate-300 bg-white">
                      <img 
                        src={filteredData[1]?.avatar || "/images/default-avatar.png"} 
                        alt={filteredData[1]?.name} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                  
                  {/* User info */}
                  <p className="font-semibold text-sm truncate max-w-full text-slate-700">{filteredData[1]?.username}</p>
                  
                  {/* Stats */}
                  <div className="flex flex-col w-full space-y-1.5 mt-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-slate-400 font-medium">Quality</span>
                      <span className="text-sm font-bold text-slate-700">{filteredData[1]?.portfolioQuality}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-slate-400 font-medium">ROI</span>
                      <span className="text-sm font-bold text-green-600">{filteredData[1]?.roi.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Podium bar */}
              <div className="h-14 bg-gradient-to-t from-slate-400 to-slate-300 rounded-lg mx-auto w-full"></div>
            </motion.div>
            
            {/* 1st Place Card */}
            <motion.div 
              className="relative z-20 w-[36%]"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0, duration: 0.3 }}
            >
              <div 
                onClick={() => filteredData[0] && handleOpenProfile(filteredData[0])}
                className="bg-white rounded-2xl shadow-lg p-4 transform -translate-y-10 border-[0.5px] border-yellow-100 cursor-pointer hover:shadow-xl transition-all active:scale-[0.98]">
                {/* Trophy on top - outside the card */}
                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                  <div className="relative">
                    <div className="absolute inset-0 rounded-full bg-yellow-400 opacity-30 blur-sm"></div>
                    <Trophy className="w-8 h-8 text-yellow-500 drop-shadow-md" />
                  </div>
                </div>
                
                <div className="flex flex-col items-center">
                  {/* Crown indicator */}
                  <div className="absolute -top-2 right-3 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold text-white shadow-md border-2 border-white">
                    1
                  </div>
                  
                  {/* Avatar with gold glow */}
                  <div className="relative mb-3">
                    <div className="absolute -inset-1 bg-yellow-300/40 rounded-full blur-md"></div>
                    <div className="w-20 h-20 rounded-full overflow-hidden border-[3px] border-yellow-400 bg-white relative">
                      <img 
                        src={filteredData[0]?.avatar || "/images/default-avatar.png"} 
                        alt={filteredData[0]?.name} 
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent"></div>
                    </div>
                  </div>
                  
                  {/* User info with verified badge */}
                  <div className="flex items-center">
                    <p className="font-bold text-base truncate max-w-[100px] text-slate-800">{filteredData[0]?.username}</p>
                    {filteredData[0]?.isVerified && (
                      <div className="ml-1 bg-blue-500 rounded-full p-0.5">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>
                  
                  {/* Stats */}
                  <div className="flex flex-col w-full space-y-2 mt-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-slate-400 font-medium">Quality</span>
                      <span className="text-base font-bold text-slate-800">{filteredData[0]?.portfolioQuality}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-slate-400 font-medium">ROI</span>
                      <span className="text-base font-bold text-green-600">{filteredData[0]?.roi.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Podium bar - gold gradient */}
              <div className="h-20 bg-gradient-to-t from-yellow-500 to-yellow-300 rounded-lg mx-auto w-full shadow-sm"></div>
            </motion.div>
            
            {/* 3rd Place Card */}
            <motion.div 
              className="relative z-10 w-[30%]"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.3 }}
            >
              <div 
                onClick={() => filteredData[2] && handleOpenProfile(filteredData[2])}
                className="bg-white rounded-2xl shadow-md p-3 transform -translate-y-6 cursor-pointer hover:shadow-lg transition-all active:scale-[0.98]">
                <div className="flex flex-col items-center">
                  {/* Rank indicator */}
                  <div className="absolute -top-2 right-3 bg-amber-700 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold text-white shadow border border-white">
                    3
                  </div>
                  
                  {/* Avatar with bronze frame */}
                  <div className="relative mb-3">
                    <div className="w-16 h-16 rounded-full overflow-hidden border-[3px] border-amber-700 bg-white">
                      <img 
                        src={filteredData[2]?.avatar || "/images/default-avatar.png"} 
                        alt={filteredData[2]?.name} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                  
                  {/* User info */}
                  <p className="font-semibold text-sm truncate max-w-full text-slate-700">{filteredData[2]?.username}</p>
                  
                  {/* Stats */}
                  <div className="flex flex-col w-full space-y-1.5 mt-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-slate-400 font-medium">Quality</span>
                      <span className="text-sm font-bold text-slate-700">{filteredData[2]?.portfolioQuality}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-slate-400 font-medium">ROI</span>
                      <span className="text-sm font-bold text-green-600">{filteredData[2]?.roi.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Podium bar */}
              <div className="h-10 bg-gradient-to-t from-amber-800 to-amber-600 rounded-lg mx-auto w-full"></div>
            </motion.div>
          </div>
        </div>
        

      </div>
      
      {/* Removed search bar to bring leaderboard closer to top */}
      
      {/* Leaderboard Content */}
      <div className="px-4 mt-3">
        {activeTab === 'friends' && friendsList.length === 0 ? (
          <motion.div 
            className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 flex flex-col items-center justify-center"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Users className="w-8 h-8 text-blue-500" />
            </div>
            <h3 className="text-lg font-medium text-slate-800 mb-2">No Friends Yet</h3>
            <p className="text-sm text-slate-500 text-center mb-4">
              Invite friends to compete and compare investment performance!
            </p>
            <Link to="/" className="flex items-center px-5 py-2.5 bg-blue-500 text-white rounded-full text-sm font-medium hover:bg-blue-600 transition-colors shadow-sm">
              <UserPlus className="w-4 h-4 mr-2" />
              Add Friends via Referral
            </Link>
          </motion.div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Jump to My Position Button - iOS Style */}
            {currentUser && (
              <div className="p-3 bg-slate-50/60">
                <button 
                  onClick={() => {
                    const userElement = document.getElementById(`leaderboard-user-${currentUser.id}`);
                    if (userElement) {
                      userElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      // Highlight briefly
                      userElement.classList.add('bg-blue-50');
                      setTimeout(() => userElement.classList.remove('bg-blue-50'), 1500);
                    }
                  }}
                  className="w-full flex items-center justify-center text-sm font-medium 
                           bg-white hover:bg-blue-50 text-blue-500 py-2.5 px-4 rounded-xl 
                           transition-all shadow-sm hover:shadow border border-slate-200"
                >
                  <div className="mr-2 bg-blue-100 rounded-full p-1">
                    <ChevronUp className="w-4 h-4 text-blue-500" />
                  </div>
                  Find my position (#{currentUser.rank})
                </button>
              </div>
            )}
            
            {/* iOS-Style Header Row */}
            <div className="grid grid-cols-[40px_minmax(100px,1.5fr)_repeat(4,_minmax(45px,1fr))] items-center px-3 py-3 border-b border-slate-100 bg-slate-50/70">
              <div className="text-xs font-medium text-slate-500 text-center">Rank</div>
              <div className="text-xs font-medium text-slate-500 pl-1">Investor</div>
              {metrics.map((metric) => (
                <div key={metric.key} className="text-[11px] font-medium text-slate-500 flex items-center justify-center">
                  <span className="mr-0.5">{metric.name}</span>
                  {metric.icon}
                </div>
              ))}
            </div>
            
            {/* Scrollable Leaderboard List - iOS Style with Better Visual Cues */}
            <div className="max-h-[calc(100vh-400px)] overflow-y-auto overflow-x-hidden -webkit-overflow-scrolling-touch pb-1">
              {/* Visible scroll indicator for iOS */}
              <div className="absolute right-0 top-1/3 bottom-1/3 w-1 bg-slate-200/60 rounded-full"></div>
              
              {filteredData.map((user, index) => {
                const isCurrentUser = user.id === 'current-user';
                const isTopThree = index < 3;
                const isEvenRow = index % 2 === 0;
                
                return (
                  <motion.div 
                    key={user.id}
                    id={`leaderboard-user-${user.id}`}
                    onClick={() => handleOpenProfile(user)}
                    className={`grid grid-cols-[40px_minmax(100px,1.5fr)_repeat(4,_minmax(45px,1fr))] items-center px-3 py-4 
                      ${isTopThree ? 'bg-gradient-to-r from-slate-50 to-white border-t border-slate-100' : 
                        isCurrentUser ? 'bg-blue-50/80' : 
                        isEvenRow ? 'bg-white border-t border-slate-100' : 'bg-slate-50/30 border-t border-slate-100'
                      }
                      ${isCurrentUser ? 'border-l-3 border-blue-500' : ''}
                      hover:bg-blue-50/30 transition-colors duration-200 relative
                      cursor-pointer active:bg-blue-100/50 hover:shadow-sm`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.2 }}
                  >
                    {/* Rank column with better styling */}
                    <div className="flex items-center justify-center">
                      {isTopThree ? (
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm 
                                      ${index === 0 ? 'bg-gradient-to-br from-yellow-300 to-yellow-500' : 
                                        index === 1 ? 'bg-gradient-to-br from-slate-300 to-slate-500' : 
                                        'bg-gradient-to-br from-amber-600 to-amber-800'}`}
                        >
                          {index + 1}
                        </div>
                      ) : (
                        <div className="text-sm font-medium text-slate-500">#{index + 1}</div>
                      )}
                    </div>
                    
                    {/* User info column */}
                    <div className="flex items-center overflow-hidden">
                      <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-200 flex-shrink-0 mr-2.5 shadow-sm">
                        <img src={user.avatar || "/images/default-avatar.png"} alt={user.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center">
                          <p className="font-semibold text-sm truncate text-slate-700">{user.username}</p>
                          {user.isVerified && (
                            <div className="ml-1 bg-blue-500 rounded-full p-0.5 flex-shrink-0">
                              <Check className="w-2.5 h-2.5 text-white" />
                            </div>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-500 truncate">{user.name}</p>
                      </div>
                    </div>
                    
                    {/* Metrics with improved styling */}
                    {metrics.map((metric, mIndex) => {
                      // Determine styling based on metric type
                      const isQuality = metric.key === 'portfolioQuality';
                      const isROI = metric.key === 'roi';
                      const value = user[metric.key as keyof LeaderboardUser] as number;
                      
                      return (
                        <div 
                          key={metric.key} 
                          className={`text-xs flex flex-col items-center justify-center 
                                    ${isQuality ? 'font-semibold' : ''}`}
                        >
                          {/* Styled metric display */}
                          <span className={`
                            ${isQuality ? 'text-indigo-600 font-semibold text-sm' : 
                             isROI && value > 0 ? 'text-green-600 font-medium' : 
                             isROI && value < 0 ? 'text-red-500 font-medium' : 
                             'text-slate-700'} 
                          `}>
                            {metric.format(value)}
                          </span>
                          
                          {/* Show mini label on mobile */}
                          <span className="text-[9px] text-slate-400 mt-0.5 hidden sm:block">
                            {metric.name}
                          </span>
                        </div>
                      );
                    })}
                    
                    {/* iOS-style disclosure indicator for top performers */}
                    {isTopThree && (
                      <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-slate-300">
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    )}
                  </motion.div>
                );
              })}
              
              {/* Add shadow fade at the bottom to indicate more content */}
              <div className="h-6 bg-gradient-to-t from-white to-transparent sticky bottom-0 w-full"></div>
            </div>
          </div>
        )}
      </div>
      
      {/* iOS-Style Info Box */}
      <div className="px-4 mt-6 mb-8">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 text-center shadow-sm">
          <div className="flex justify-center mb-2">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Star className="w-5 h-5 text-blue-500" />
            </div>
          </div>
          <h4 className="text-base font-semibold text-slate-800 mb-1">Quality Score Matters</h4>
          <p className="text-sm text-slate-600 mb-3">
            Your ranking is determined by your portfolio's quality score. Build a balanced portfolio with strong performance, stability, and value metrics.
          </p>
          <div className="flex justify-center">
            <Link to="/portfolio" className="text-xs font-medium text-blue-500 flex items-center">
              View Portfolio Details
              <ChevronRight className="w-3 h-3 ml-0.5" />
            </Link>
          </div>
        </div>
      </div>
      
      {/* Investor Profile Popup */}
      {showProfilePopup && (
        <InvestorProfilePopup 
          investor={selectedInvestor} 
          onClose={handleCloseProfile} 
        />
      )}
    </div>
  );
};

export default LeaderboardPage;