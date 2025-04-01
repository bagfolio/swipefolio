import { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import { Users, ChevronRight, ExternalLink } from 'lucide-react';
import { PortfolioContext } from '@/contexts/portfolio-context';
import { Link } from 'wouter';
import { 
  getLeaderboardData, 
  getCurrentUserRank, 
  LeaderboardUser
} from '@/data/leaderboard-data';
import InvestorProfilePopup from './investor-profile-popup';

// Define the investor type
interface Investor {
  id: number;
  name: string;
  avatar: string;
  returns: number;
  qualityScore?: number; // Added for quality score
  isUser?: boolean;
  gain?: string;
  originalUser?: LeaderboardUser; // Reference to original leaderboard user data
}

export default function CompetitionTracker({ defaultExpanded = false }: { defaultExpanded?: boolean }) {
  const portfolio = useContext(PortfolioContext);
  const [expanded, setExpanded] = useState(false); // Always start collapsed
  const [userRank, setUserRank] = useState(10); // Start at rank 10 (bottom)
  const [userReturns, setUserReturns] = useState(0);
  const [leaderboardData, setLeaderboardData] = useState<Investor[]>([]);
  const [selectedInvestor, setSelectedInvestor] = useState<LeaderboardUser | null>(null);
  
  // Refresh data from portfolio context when portfolio changes 
  useEffect(() => {
    // Calculate metrics if portfolio exists
    if (portfolio) {
      // Schedule a refresh after portfolio updates with small delay for state propagation
      const timer = setTimeout(() => {
        console.log("Portfolio updated in CompetitionTracker:", {
          holdings: portfolio.holdings.length,
          version: portfolio.version,
          lastUpdated: new Date(portfolio.lastUpdated).toISOString()
        });
        
        // Use ROI directly from portfolio context
        setUserReturns(portfolio.portfolioMetrics.roi);
        
        // Fetch updated leaderboard data (which will now read from portfolio context)
        fetchUpdatedLeaderboard();
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [
    portfolio?.version,
    portfolio?.lastUpdated,
    portfolio?.portfolioMetrics
  ]);
  
  // Function to fetch latest leaderboard data
  const fetchUpdatedLeaderboard = () => {
    const leaderboardUsers = getLeaderboardData();
    const currentUser = getCurrentUserRank();
    
    // Convert to the format used by this component
    const convertedData: Investor[] = leaderboardUsers.map(user => ({
      id: user.rank || (user.id === 'current-user' ? 999 : Number(user.id.replace(/\D/g, '')) || 99), // Use rank as id, fallback to extracted number
      name: user.username,
      avatar: user.avatar,
      returns: user.roi,
      qualityScore: user.portfolioQuality, // Add quality score
      isUser: user.id === 'current-user',
      originalUser: user // Store reference to original user data
    }));
    
    setLeaderboardData(convertedData);
    
    if (currentUser) {
      setUserRank(currentUser.rank || 10);
    }
  };
  
  // Initial fetch on mount
  useEffect(() => {
    fetchUpdatedLeaderboard();
  }, []);
  
  // Format the gain/loss values as percentages (projected ROI)
  const formattedLeaderboardData = leaderboardData.map(item => ({
    ...item,
    gain: `${item.returns >= 0 ? '+' : ''}${Math.abs(item.returns).toFixed(1)}%`
  }));
  
  // Get top 3 and user's position
  const topThree = formattedLeaderboardData.slice(0, 3);
  const userPosition = formattedLeaderboardData.find(item => item.isUser) || 
    { id: 5, name: 'Belford&Co', avatar: '/images/default-avatar.png', returns: 0, gain: '0.0%', isUser: true, qualityScore: 0 };
  
  return (
    <>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="competition-tracker mb-6"
      >
        <div className="bg-white/95 backdrop-blur-lg rounded-xl overflow-hidden border border-slate-200 shadow-lg" style={{ boxShadow: "0 10px 30px -5px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.05)" }}>
          {/* iOS-style header with subtle gradient */}
          <motion.div 
            onClick={() => setExpanded(!expanded)}
            className="cursor-pointer relative overflow-hidden"
            whileHover={{ backgroundColor: 'rgba(249, 250, 251, 0.7)' }}
            transition={{ duration: 0.2 }}
          >
            {/* Subtle gradient background */}
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-50/50 via-violet-50/50 to-blue-50/50 z-0"></div>
            
            <div className="flex items-center justify-between p-4 relative z-10">
              <div className="flex items-center">
                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center mr-3 shadow-sm">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-slate-800 font-semibold">Competition Standings</h3>
                  <div className="flex items-center mt-0.5">
                    <div className="mr-2 px-2 py-0.5 bg-indigo-100 rounded-full flex items-center">
                      <span className="text-xs font-medium text-indigo-700">Rank #{userRank}</span>
                    </div>
                    <div className="px-2 py-0.5 bg-purple-100 rounded-full flex items-center">
                      <span className="text-xs font-medium text-purple-700">Score: {portfolio?.portfolioMetrics?.qualityScore || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Animated chevron with iOS-style appearance */}
              <div className="bg-slate-100 h-7 w-7 rounded-full flex items-center justify-center">
                <ChevronRight 
                  className={`h-4 w-4 text-slate-500 transition-transform duration-300 ease-in-out ${expanded ? 'rotate-90' : ''}`} 
                />
              </div>
            </div>
          </motion.div>
          
          {expanded && (
            <div className="px-4 pb-4">
              {/* Top 3 leaderboard with iOS-style cards */}
              <div className="mb-4">
                <div className="text-xs font-medium text-slate-500 mb-2 px-0.5">Top performers</div>
                <div className="space-y-2.5">
                  {topThree.map((investor, index) => {
                    // Define colors for each position
                    const medalColors = [
                      {
                        bg: "bg-gradient-to-r from-amber-400 to-yellow-500",
                        accent: "bg-yellow-100",
                        text: "text-amber-800",
                        border: "border-yellow-200"
                      },
                      {
                        bg: "bg-gradient-to-r from-slate-400 to-slate-500",
                        accent: "bg-slate-100",
                        text: "text-slate-600",
                        border: "border-slate-200"
                      },
                      {
                        bg: "bg-gradient-to-r from-amber-700 to-amber-600",
                        accent: "bg-amber-50",
                        text: "text-amber-700",
                        border: "border-amber-100"
                      }
                    ];
                    
                    // Safely get color scheme by position
                    const color = medalColors[Math.min(index, medalColors.length - 1)];
                    
                    return (
                      <motion.div 
                        key={investor.id}
                        initial={{ opacity: 0, x: -5, y: 5 }}
                        animate={{ opacity: 1, x: 0, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        className="p-2.5 rounded-lg bg-white/80 backdrop-blur-sm border border-slate-100 shadow-sm flex items-center justify-between cursor-pointer hover:bg-slate-50/80 transition-colors"
                        style={{
                          boxShadow: "0 2px 10px -2px rgba(0,0,0,0.05)"
                        }}
                        onClick={() => setSelectedInvestor(investor.originalUser || null)}
                      >
                        <div className="flex items-center">
                          <div className={`h-7 w-7 rounded-full ${color.bg} flex items-center justify-center mr-2.5 shadow-sm text-xs font-bold text-white`}>
                            {index + 1}
                          </div>
                          <div className="flex items-center">
                            <div 
                              className="w-16 h-16 rounded-full overflow-hidden border border-slate-200 flex-shrink-0 mr-3 shadow-sm cursor-pointer transition-transform hover:scale-105"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedInvestor(investor.originalUser || null);
                              }}
                            >
                              <img src={investor.avatar || "/images/default-avatar.png"} alt={investor.name} className="w-full h-full object-cover" />
                            </div>
                            <span className="text-lg font-semibold text-slate-800">{investor.name}</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end">
                          <div className="text-sm font-semibold text-emerald-600">
                            {investor.gain}
                          </div>
                          <div className="mt-0.5">
                            <div className={`px-1.5 py-0.5 ${color.accent} rounded-full border ${color.border}`}>
                              <span className={`text-xs font-medium ${color.text}`}>
                                Score: {investor.qualityScore || 0}
                              </span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
              
              {/* User position with iOS-style glass effect */}
              <div className="mb-3">
                <div className="text-xs font-medium text-slate-500 mb-2 px-0.5">Your position</div>
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                  className="relative overflow-hidden rounded-xl p-3.5 cursor-pointer hover:bg-slate-50/60 transition-colors"
                  style={{
                    background: "linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(249,250,251,0.9) 100%)",
                    boxShadow: "0 4px 15px -3px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.05)"
                  }}
                  onClick={() => setSelectedInvestor(userPosition.originalUser || null)}
                >
                  {/* Subtle background glows for iOS effect */}
                  <div className="absolute -top-6 -right-6 w-16 h-16 rounded-full bg-blue-200/30 blur-xl"></div>
                  <div className="absolute -bottom-3 -left-3 w-12 h-12 rounded-full bg-indigo-200/30 blur-xl"></div>
                  
                  <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center mr-2.5 shadow-md text-sm font-bold text-white">
                        {userRank}
                      </div>
                      <div className="flex items-center">
                        <div 
                          className="w-16 h-16 rounded-full overflow-hidden border border-slate-200 flex-shrink-0 mr-3 shadow-sm cursor-pointer transition-transform hover:scale-105"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedInvestor(userPosition.originalUser || null);
                          }}
                        >
                          <img src={userPosition.avatar || "/images/default-avatar.png"} alt={userPosition.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex flex-col">
                          <div className="flex items-center">
                            <span className="text-lg font-semibold text-slate-800">{userPosition.name}</span>
                            <span className="ml-2 text-xs font-medium text-blue-600 bg-blue-50/80 px-2 py-0.5 rounded-full shadow-sm border border-blue-100">You</span>
                          </div>
                          <span className="text-xs text-slate-500 mt-0.5">Active investor</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end">
                      <div className={`text-sm font-bold ${userPosition.returns > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {userPosition.gain}
                      </div>
                      <div className="flex items-center mt-1">
                        <div className="px-2 py-0.5 bg-indigo-100/80 rounded-full border border-indigo-200/50">
                          <span className="text-xs font-medium text-indigo-700">Score: {userPosition.qualityScore || 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
              
              {/* Positions to beat - iOS-style */}
              <div className="mt-3.5">
                <div className="text-xs font-medium text-slate-500 mb-2 px-0.5">Your next challenge</div>
                
                <div className="space-y-2.5">
                  {/* Find the next position to beat - use proper rank to find it */}
                  {formattedLeaderboardData
                    .filter(investor => {
                      // Find the investor with the next rank above the user
                      return !investor.isUser && // Not the current user
                             userRank > 1 && // User is not already at the top
                             investor.id === userRank - 1; // This is the next rank above
                    })
                    .map((investor) => (
                      <motion.div 
                        key={`next-${investor.id}`}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="p-3 rounded-xl bg-gradient-to-r from-blue-50/80 to-indigo-50/80 backdrop-blur-sm border border-blue-100/70 shadow-sm relative overflow-hidden cursor-pointer hover:bg-blue-50/90 transition-colors"
                        onClick={() => setSelectedInvestor(investor.originalUser || null)}
                      >
                        {/* Subtle glow effect in background */}
                        <div className="absolute top-0 right-0 w-12 h-12 rounded-full bg-blue-200/30 blur-xl -z-10"></div>
                        
                        <div className="flex items-center justify-between relative z-10">
                          <div className="flex items-center">
                            <div className="h-7 w-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center mr-2.5 shadow-sm text-xs font-bold text-white">
                              {userRank - 1}
                            </div>
                            <div className="flex items-center">
                              <div 
                                className="w-16 h-16 rounded-full overflow-hidden border border-slate-200 shadow-sm flex-shrink-0 mr-3 cursor-pointer transition-transform hover:scale-105"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedInvestor(investor.originalUser || null);
                                }}
                              >
                                <img src={investor.avatar || "/images/default-avatar.png"} alt={investor.name} className="w-full h-full object-cover" />
                              </div>
                              <div className="flex flex-col">
                                <span className="text-lg font-semibold text-slate-800">{investor.name}</span>
                                <span className="text-xs text-blue-600 mt-0.5">Next position to beat</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex flex-col items-end">
                            <div className={`text-sm font-bold ${investor.returns > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                              {investor.gain}
                            </div>
                            <div className="mt-1">
                              <div className="px-2 py-0.5 bg-indigo-100/80 rounded-full border border-indigo-200/50">
                                <span className="text-xs font-medium text-indigo-700">Score: {investor.qualityScore || 0}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  }
                  
                  {/* If there are no positions above (user is at rank 1) or no match found, show a motivational message */}
                  {(userRank === 1 || formattedLeaderboardData.filter(inv => !inv.isUser && inv.id === userRank - 1).length === 0) && (
                    <motion.div 
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="p-3.5 rounded-xl bg-gradient-to-r from-blue-50/80 to-indigo-50/80 backdrop-blur-sm border border-blue-100/70 shadow-sm text-center relative overflow-hidden"
                    >
                      {/* Subtle glow effect in background */}
                      <div className="absolute -bottom-2 right-0 w-20 h-20 rounded-full bg-blue-200/30 blur-xl -z-10"></div>
                      <div className="absolute top-0 left-5 w-10 h-10 rounded-full bg-indigo-200/20 blur-xl -z-10"></div>
                      
                      {userRank === 1 ? (
                        <div className="relative z-10">
                          <div className="w-12 h-12 mx-auto mb-2 bg-yellow-100 rounded-full flex items-center justify-center">
                            <span className="text-2xl">🏆</span>
                          </div>
                          <p className="text-sm font-medium text-blue-700">You're at the top! Keep it up!</p>
                        </div>
                      ) : (
                        <div className="relative z-10">
                          <p className="text-sm font-medium text-blue-700">
                            Improve your Quality Score to reach rank #{userRank - 1}
                          </p>
                          <p className="text-xs text-blue-500 mt-1">Add more quality stocks to your portfolio</p>
                        </div>
                      )}
                    </motion.div>
                  )}
                </div>
              </div>
              
              {/* iOS-style button */}
              <div className="mt-5 text-center">
                <Link href="/leaderboard">
                  <motion.button
                    whileHover={{ scale: 1.03, boxShadow: "0 8px 20px -4px rgba(79, 70, 229, 0.4)" }}
                    whileTap={{ scale: 0.97 }}
                    className="py-2.5 px-5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-sm
                             font-medium shadow-lg flex items-center justify-center mx-auto"
                    style={{
                      boxShadow: "0 6px 16px -3px rgba(79, 70, 229, 0.35)"
                    }}
                  >
                    <span>See full leaderboard</span>
                    <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
                  </motion.button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Investor profile popup */}
      {selectedInvestor && (
        <InvestorProfilePopup 
          investor={selectedInvestor}
          onClose={() => setSelectedInvestor(null)}
        />
      )}
    </>
  );
}