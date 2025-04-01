import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Check, 
  TrendingUp,
  TrendingDown,
  Minus,
  Award, 
  Users, 
  ChevronDown,
  ArrowUpRight,
  Shield,
  Zap,
  Flame,
  BarChart2,
  PieChart,
  GitBranch,
  Lightbulb,
  Target,
  Feather,
  Clock,
  BookOpen,
  Rocket,
  Briefcase,
  Coffee,
  DollarSign,
  User,
  Building2,
  Lock,
  Wallet,
  CandlestickChart,
  LineChart
} from 'lucide-react';
import { LeaderboardUser } from '@/data/leaderboard-data';
import { Progress } from '@/components/ui/progress';

interface InvestorProfilePopupProps {
  investor: LeaderboardUser | null;
  onClose: () => void;
}

// Investor personality data
interface InvestorData {
  quote: string;
  about: string;
  strategy: string;
  icon: React.ReactNode;
  gradient: string;
  strongestSectors: {name: string; value: number; trend: 'up' | 'down' | 'neutral'}[];
  tradeStyle: string;
  riskTolerance: number;
  favoriteSector: string;
}

// Get investor personalized data
const investorData: Record<string, InvestorData> = {
  "KingJames": {
    quote: "Court domination is temporary. Portfolio domination is forever.",
    about: "Just bringing the same championship mindset from the court to my portfolio—striving for greatness in everything I do.",
    strategy: "Plays the market like the fourth quarter of a finals game—calculated risks when behind, conservative moves to protect the lead.",
    icon: <Flame />,
    gradient: "from-purple-500 to-blue-500",
    strongestSectors: [
      {name: "Consumer Discretionary", value: 99, trend: 'up'},
      {name: "Media & Entertainment", value: 99, trend: 'up'}
    ],
    tradeStyle: "Momentum investor",
    riskTolerance: 65,
    favoriteSector: "Sports & Entertainment"
  },
  "ValueBuffet": {
    quote: "I don't pick stocks. I pick businesses worth owning.",
    about: "I still enjoy a good hamburger and cherry Coke while looking for wonderful companies at fair prices.",
    strategy: "Patiently waiting for the market to serve up fat pitches, then betting big when the odds are overwhelmingly in my favor.",
    icon: <BookOpen />,
    gradient: "from-green-500 to-emerald-400",
    strongestSectors: [
      {name: "Financials", value: 92, trend: 'up'},
      {name: "Consumer Staples", value: 87, trend: 'neutral'}
    ],
    tradeStyle: "Value investor",
    riskTolerance: 30,
    favoriteSector: "Insurance"
  },
  "OutsiderTrading": {
    quote: "The best investments are boring on CNBC but exciting in your portfolio.",
    about: "Just a public servant with an uncanny knack for perfectly timed stock purchases—pure coincidence, I assure you.",
    strategy: "Somehow always managing to invest in companies right before favorable legislation passes or major government contracts are announced.",
    icon: <GitBranch />,
    gradient: "from-blue-400 to-indigo-400",
    strongestSectors: [
      {name: "Technology", value: 84, trend: 'up'},
      {name: "Defense", value: 79, trend: 'up'}
    ],
    tradeStyle: "Information advantage",
    riskTolerance: 85,
    favoriteSector: "Government Contractors"
  },
  "JulieSweetCEO": {
    quote: "Success isn't just measured in quarters, but in decades.",
    about: "Transforming companies and portfolios with the same strategic vision—excellence isn't a goal, it's a requirement.",
    strategy: "Identifying companies with strong fundamentals but outdated operating models, then watching them soar as they modernize.",
    icon: <Briefcase />,
    gradient: "from-pink-500 to-rose-400",
    strongestSectors: [
      {name: "Technology Services", value: 91, trend: 'up'},
      {name: "Business Services", value: 85, trend: 'up'}
    ],
    tradeStyle: "Growth at reasonable price",
    riskTolerance: 60,
    favoriteSector: "Consulting"
  },
  "MichelleO": {
    quote: "When markets go low, my investments go high.",
    about: "When they go low with their investments, I go high—building wealth with purpose and integrity.",
    strategy: "Investing in companies that strengthen communities while delivering the steady returns that build generational wealth.",
    icon: <Target />,
    gradient: "from-amber-400 to-orange-400",
    strongestSectors: [
      {name: "Education", value: 82, trend: 'up'},
      {name: "Healthcare", value: 76, trend: 'up'}
    ],
    tradeStyle: "Socially responsible",
    riskTolerance: 50,
    favoriteSector: "Community Development"
  },
  "MrBeast": {
    quote: "I give away millions because my investments make more millions.",
    about: "I approach investing exactly like my videos—go big, be first, and make sure everyone's talking about it.",
    strategy: "Looking for explosive growth opportunities that others dismiss as crazy, while backing them up with surprisingly meticulous research.",
    icon: <Rocket />,
    gradient: "from-red-500 to-red-400",
    strongestSectors: [
      {name: "Digital Media", value: 88, trend: 'up'},
      {name: "Consumer Tech", value: 73, trend: 'up'}
    ],
    tradeStyle: "Growth investor",
    riskTolerance: 90,
    favoriteSector: "Digital Entertainment"
  },
  "ElonMusk": {
    quote: "The market is just crowd-sourced capital allocation.",
    about: "Making life multiplanetary, electrifying transportation, and occasionally moving markets with tweets—just another Tuesday.",
    strategy: "Betting heavily on paradigm-shifting technologies that most people think are impossible until suddenly they're inevitable.",
    icon: <Lightbulb />,
    gradient: "from-blue-500 to-cyan-400",
    strongestSectors: [
      {name: "Electric Vehicles", value: 94, trend: 'up'},
      {name: "Space Technology", value: 89, trend: 'up'}
    ],
    tradeStyle: "Disruptive innovation",
    riskTolerance: 95,
    favoriteSector: "Emerging Technologies"
  },
  "Oprah": {
    quote: "You get a dividend! And YOU get a dividend! EVERYBODY gets dividends!",
    about: "You get returns! And YOU get returns! EVERYBODY gets returns when you invest in what you truly understand.",
    strategy: "Identifying authentic brands and untold stories that resonate deeply with consumers before they become household names.",
    icon: <DollarSign />,
    gradient: "from-purple-400 to-pink-400",
    strongestSectors: [
      {name: "Media", value: 90, trend: 'up'},
      {name: "Consumer Brands", value: 85, trend: 'up'}
    ],
    tradeStyle: "Brand-focused",
    riskTolerance: 55,
    favoriteSector: "Media & Publishing"
  },
  "BettiestWhite": {
    quote: "I've been bullish since before your grandparents were born.",
    about: "I've been investing since before your grandparents were born, and I'll probably outlive your portfolio too.",
    strategy: "Sticking to time-tested blue chips that have survived multiple crashes and still deliver reliable dividends decades later.",
    icon: <Clock />,
    gradient: "from-emerald-400 to-teal-400",
    strongestSectors: [
      {name: "Consumer Staples", value: 85, trend: 'neutral'},
      {name: "Utilities", value: 80, trend: 'neutral'}
    ],
    tradeStyle: "Dividend investor",
    riskTolerance: 20,
    favoriteSector: "Blue Chip Staples"
  },
  "Belford&Co": {
    quote: "The Wolf only loses when he stops hunting.",
    about: "Finding opportunities in markets where others only see chaos. Every volatility spike is just another chance to strike.",
    strategy: "Spotting momentum shifts early and trading aggressively when market sentiment changes direction.",
    icon: <Zap />,
    gradient: "from-blue-600 to-indigo-600",
    strongestSectors: [
      {name: "Technology", value: 75, trend: 'up'},
      {name: "Financials", value: 82, trend: 'up'}
    ],
    tradeStyle: "Tactical trader",
    riskTolerance: 75,
    favoriteSector: "Fintech"
  }
};

// Define the tabs for the profile
type TabType = 'overview' | 'portfolio' | 'badges' | 'properties';

export default function InvestorProfilePopup({ investor, onClose }: InvestorProfilePopupProps) {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const profileRef = useRef<HTMLDivElement>(null);
  const [touchStartX, setTouchStartX] = useState(0);
  const [touchStartY, setTouchStartY] = useState(0);
  const [showFollowAnimation, setShowFollowAnimation] = useState(false);
  const [followers, setFollowers] = useState(Math.floor(Math.random() * 5000) + 100);
  const [isFollowing, setIsFollowing] = useState(false);
  const [headingGlow, setHeadingGlow] = useState(false);
  
  // Handle click outside to dismiss
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    
    // Add event listener
    document.addEventListener('mousedown', handleClickOutside);
    
    // Enhanced swipe down listener for mobile with improved touch handling
    const handleTouchStart = (e: TouchEvent) => {
      const target = e.target as HTMLElement;
      const scrollContainer = document.querySelector('.investor-profile-scroll-container');
      const header = document.querySelector('.profile-header-area');
      const dragHandle = document.querySelector('.drag-handle');
      
      // Track if we're touching the header or drag handle specifically
      const isTouchingHeader = header && (header.contains(target) || (dragHandle && dragHandle.contains(target)));
      
      // Check if we're touching inside the scroll container and it can actually scroll
      if (scrollContainer && scrollContainer.contains(target)) {
        const isScrollable = scrollContainer.scrollHeight > scrollContainer.clientHeight;
        
        // If the content isn't scrollable or we're specifically on the header/drag handle, 
        // we'll handle the swipe for dismissal
        if (!isScrollable || isTouchingHeader) {
          setTouchStartY(e.touches[0].clientY);
          setTouchStartX(e.touches[0].pageX);
          
          // Add visual feedback for dragging if on the header
          if (isTouchingHeader && profileRef.current) {
            profileRef.current.classList.add('dragging-enabled');
          }
        } else {
          // Just track coordinates for tab switching but don't enable close gesture
          // unless we're at the top of the scroll container
          setTouchStartY(e.touches[0].clientY);
          setTouchStartX(e.touches[0].pageX);
          return;
        }
      } else {
        // Outside scroll container, track coordinates for all gestures
        setTouchStartY(e.touches[0].clientY);
        setTouchStartX(e.touches[0].pageX);
      }
      
      const handleTouchMove = (e: TouchEvent) => {
        // Prevent default scrolling behavior when dragging from header or drag handle
        if (isTouchingHeader) {
          e.preventDefault();
        }
        
        const currentY = e.touches[0].clientY;
        const currentX = e.touches[0].pageX;
        
        // Detect swipe direction and distance
        const deltaY = currentY - touchStartY;
        const deltaX = currentX - touchStartX;
        
        // Check if we're touching inside a scrollable element
        const target = e.target as HTMLElement;
        let isInsideScrollContainer = false;
        
        if (scrollContainer && scrollContainer.contains(target) && !isTouchingHeader) {
          const isScrollable = scrollContainer.scrollHeight > scrollContainer.clientHeight;
          
          // If at the top of scroll and swiping down, or at the bottom and swiping up,
          // allow popup to handle the swipe, otherwise let the content scroll
          if (isScrollable) {
            const isAtTop = scrollContainer.scrollTop === 0;
            const isAtBottom = scrollContainer.scrollTop + scrollContainer.clientHeight >= scrollContainer.scrollHeight;
            
            // Only trigger popup close if at the top and swiping down
            if (isAtTop && deltaY > 0) {
              isInsideScrollContainer = false;
            } else if (isAtBottom && deltaY < 0) {
              isInsideScrollContainer = false;
            } else {
              isInsideScrollContainer = true;
              return; // Let the container scroll normally
            }
          }
        }
        
        // Apply dynamic transform for visual feedback when dragging from header or handle
        if (isTouchingHeader && deltaY > 0 && profileRef.current) {
          // Apply resistance to make the drag feel more natural
          const resistedDelta = Math.pow(deltaY, 0.8);
          profileRef.current.style.transform = `translateY(${resistedDelta}px)`;
          profileRef.current.style.opacity = `${1 - (resistedDelta / 500)}`;
        }
        
        // If primarily vertical swipe down and not inside scrollable content (or at the top)
        // More restrictive - requires a deliberate swipe to close to prevent accidental closes
        if ((!isInsideScrollContainer || isTouchingHeader) && 
            Math.abs(deltaY) > Math.abs(deltaX) * 1.5 && 
            deltaY > 100) { // Increased threshold from 70px to 100px for more deliberate action
          if (profileRef.current) {
            // Apply smooth closing animation
            profileRef.current.style.transition = 'transform 0.2s ease, opacity 0.2s ease';
            profileRef.current.style.transform = `translateY(${window.innerHeight}px)`;
            profileRef.current.style.opacity = '0';
            
            // Slight delay before actually closing
            setTimeout(() => {
              onClose();
              document.removeEventListener('touchmove', handleTouchMove);
            }, 180);
          } else {
            onClose();
            document.removeEventListener('touchmove', handleTouchMove);
          }
        } 
        // If primarily horizontal swipe for tab navigation
        else if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50 && investor) {
          // Determine which direction to swipe
          if (deltaX > 0) {
            // Swipe right - previous tab
            const tabs: TabType[] = ['overview', 'portfolio', 'badges', 'properties'];
            const currentIndex = tabs.indexOf(activeTab);
            if (currentIndex > 0) {
              // Only switch if not trying to access premium content without premium
              const targetTab = tabs[currentIndex - 1];
              const isPremiumTab = (targetTab === 'portfolio' || targetTab === 'properties');
              const isRestrictedContent = isPremiumTab && !isPremium && investor.id !== 'current-user';
              
              if (!isRestrictedContent) {
                setActiveTab(targetTab);
              } else if (navigator.vibrate) {
                navigator.vibrate([10, 30, 10]); // Haptic feedback for locked tab
              }
            }
          } else {
            // Swipe left - next tab
            const tabs: TabType[] = ['overview', 'portfolio', 'badges', 'properties'];
            const currentIndex = tabs.indexOf(activeTab);
            if (currentIndex < tabs.length - 1) {
              // Only switch if not trying to access premium content without premium
              const targetTab = tabs[currentIndex + 1];
              const isPremiumTab = (targetTab === 'portfolio' || targetTab === 'properties');
              const isRestrictedContent = isPremiumTab && !isPremium && investor.id !== 'current-user';
              
              if (!isRestrictedContent) {
                setActiveTab(targetTab);
              } else if (navigator.vibrate) {
                navigator.vibrate([10, 30, 10]); // Haptic feedback for locked tab
              }
            }
          }
          document.removeEventListener('touchmove', handleTouchMove);
        }
      };
      
      document.addEventListener('touchmove', handleTouchMove);
      
      const handleTouchEnd = () => {
        // Reset any transform or transition on the profile element
        if (profileRef.current) {
          if (!profileRef.current.style.transform.includes(`translateY(${window.innerHeight}px)`)) {
            // Only reset if we're not in the process of closing
            profileRef.current.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
            profileRef.current.style.transform = '';
            profileRef.current.style.opacity = '1';
            
            // Remove the transition after animation completes
            setTimeout(() => {
              if (profileRef.current) {
                profileRef.current.style.transition = '';
              }
            }, 300);
          }
          
          // Remove the dragging class
          profileRef.current.classList.remove('dragging-enabled');
        }
        
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      };
      
      document.addEventListener('touchend', handleTouchEnd);
    };
    
    if (profileRef.current) {
      profileRef.current.addEventListener('touchstart', handleTouchStart);
    }
    
    // Add haptic feedback if available
    if (navigator.vibrate) {
      navigator.vibrate(10); // Subtle vibration on open
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (profileRef.current) {
        profileRef.current.removeEventListener('touchstart', handleTouchStart);
      }
    };
  }, [onClose, activeTab, touchStartY, touchStartX]);
  
  if (!investor) return null;
  
  // Animation for the follow button
  const handleFollowClick = () => {
    setIsFollowing(!isFollowing);
    setShowFollowAnimation(true);
    
    if (isFollowing) {
      setFollowers(prev => Math.max(0, prev - 1));
    } else {
      setFollowers(prev => prev + 1);
      setHeadingGlow(true);
      setTimeout(() => setHeadingGlow(false), 2000);
    }
    
    if (navigator.vibrate) {
      navigator.vibrate([15, 30, 15]); // Haptic feedback pattern
    }
    
    setTimeout(() => setShowFollowAnimation(false), 1500);
  };

  // Determine if this is a premium user (for demo, use isVerified)
  const isPremium = investor.isVerified;
  
  // Get personalized data for this investor
  const personalData = investorData[investor.username] || {
    quote: "Investing is the only place where saving is spending.",
    about: "Finding unique opportunities in the market that others overlook.",
    strategy: "Balanced approach with a focus on long-term growth and capital preservation.",
    icon: <BarChart2 />,
    gradient: "from-blue-500 to-indigo-500",
    strongestSectors: [
      {name: "Technology", value: 75, trend: 'up'},
      {name: "Healthcare", value: 65, trend: 'up'}
    ],
    tradeStyle: "Balanced investor",
    riskTolerance: 60,
    favoriteSector: "Technology"
  };
  
  // Calculate rank badge style
  const getBadgeStyles = (rank: number = 99) => {
    if (rank === 1) return { color: 'gold', label: '#1' };
    if (rank === 2) return { color: 'silver', label: '#2' };
    if (rank === 3) return { color: 'bronze', label: '#3' };
    return { color: 'blue', label: `#${rank}` };
  };
  
  const rankBadge = getBadgeStyles(investor.rank);
  
  // Calculate membership time - for demo purposes, random between 1-24 months
  const memberMonths = investor.id === 'current-user' ? 3 : Math.floor(Math.random() * 24) + 1;
  const memberSince = new Date();
  memberSince.setMonth(memberSince.getMonth() - memberMonths);
  const memberSinceFormatted = memberSince.toLocaleString('default', { month: 'short', year: 'numeric' });

  // Mock data for tabs
  const mockBadges = [
    { name: 'Quick Starter', icon: '🚀', earned: true, progress: 100 },
    { name: 'Diversification Pro', icon: '🌈', earned: investor.portfolioQuality > 70, progress: Math.min(100, investor.portfolioQuality) },
    { name: 'Social Butterfly', icon: '🦋', earned: investor.referrals > 50, progress: Math.min(100, investor.referrals * 2) },
    { name: 'Trade Master', icon: '📊', earned: investor.trades > 100, progress: Math.min(100, investor.trades) },
    { name: 'ROI Champion', icon: '🏆', earned: investor.roi > 100, progress: Math.min(100, investor.roi) },
    { name: 'Diamond Hands', icon: '💎', earned: false, progress: 45 },
  ];
  
  const mockProperties = [
    { name: 'Luxury Penthouse', value: '1,500,000 FB', acquired: '3 months ago', image: '/images/property-penthouse.jpg' },
    { name: 'Sports Car', value: '350,000 FB', acquired: '1 month ago', image: '/images/property-car.jpg' },
    { name: 'Yacht Club Membership', value: '250,000 FB', acquired: '2 weeks ago', image: '/images/property-yacht.jpg' },
  ];

  // Animation variants for the popup
  const popupVariants = {
    hidden: { opacity: 0, y: 50, scale: 0.9 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1, 
      transition: { 
        type: 'spring', 
        damping: 25, 
        stiffness: 500 
      } 
    },
    exit: { opacity: 0, y: 20, scale: 0.95, transition: { duration: 0.2 } }
  };

  // Function to render appropriate tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-4">
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <h4 className="text-sm font-medium text-slate-700 mb-2">About</h4>
              <p className="text-sm text-slate-600">
                {investor.id === 'current-user'
                  ? 'Your investment journey is just beginning. Build your portfolio and climb the leaderboard!'
                  : personalData.about
                }
              </p>
            </div>
            
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <h4 className="text-sm font-medium text-slate-700 mb-2">Investment Strategy</h4>
              <p className="text-sm text-slate-600">
                {investor.id === 'current-user'
                  ? 'Developing a more refined approach to stock selection and portfolio construction as you learn more about the markets.'
                  : personalData.strategy
                }
              </p>
            </div>
            
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <h4 className="text-sm font-medium text-slate-700 mb-2">Strongest Sectors</h4>
              {investor.id === 'current-user' ? (
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-white p-2 rounded-lg border border-slate-200">
                    <div className="text-xs font-medium text-slate-500">Technology</div>
                    <div className="flex items-end justify-between">
                      <div className="text-sm font-bold text-slate-700">65%</div>
                      <TrendingUp className="h-3 w-3 text-green-500" />
                    </div>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-200">
                    <div className="text-xs font-medium text-slate-500">Financials</div>
                    <div className="flex items-end justify-between">
                      <div className="text-sm font-bold text-slate-700">52%</div>
                      <TrendingUp className="h-3 w-3 text-green-500" />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {personalData.strongestSectors.map((sector, index) => (
                    <div key={index} className="bg-white p-2 rounded-lg border border-slate-200">
                      <div className="text-xs font-medium text-slate-500">{sector.name}</div>
                      <div className="flex items-end justify-between">
                        <div className="text-sm font-bold text-slate-700">{sector.value}%</div>
                        {sector.trend === 'up' && <TrendingUp className="h-3 w-3 text-green-500" />}
                        {sector.trend === 'down' && <TrendingDown className="h-3 w-3 text-red-500" />}
                        {sector.trend === 'neutral' && <Minus className="h-3 w-3 text-slate-500" />}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {isPremium && (
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-slate-700">FinBucks Balance</h4>
                  <div className="px-2 py-1 bg-purple-100 rounded-full">
                    <span className="text-xs font-medium text-purple-700">Premium</span>
                  </div>
                </div>
                <div className="text-xl font-bold text-slate-800 mt-1">
                  {(investor.roi * 1000 + investor.portfolioQuality * 100).toLocaleString()} FB
                </div>
              </div>
            )}
          </div>
        );
        
      case 'portfolio':
        // For non-premium users, show a modern premium lock screen with frosted glass effect
        if (!isPremium && investor.id !== 'current-user' && 
            investor.username.toLowerCase() !== 'lebron james' && 
            investor.username.toLowerCase() !== 'valuebuffet') {
          return (
            <div className="relative h-full">
              <div className="absolute inset-0 backdrop-blur-md bg-gradient-to-br from-purple-500/20 to-indigo-500/30 z-10 flex flex-col items-center justify-center rounded-xl border border-white/20 shadow-lg">
                {/* Premium lock icon with animation */}
                <motion.div 
                  className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full p-4 mb-4 shadow-lg border border-white/20"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", duration: 0.8 }}
                >
                  <Shield className="h-8 w-8 text-white" />
                </motion.div>
                
                {/* Premium content text */}
                <motion.div
                  className="text-center px-6"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                >
                  <h3 className="text-xl font-bold text-white mb-2">Premium Content</h3>
                  <p className="text-sm text-white/80 text-center mb-5 max-w-xs">
                    Unlock this investor's portfolio insights and learn their secret strategies with Premium.
                  </p>
                  
                  {/* Visually appealing premium button */}
                  <motion.button 
                    className="px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl text-sm font-bold hover:shadow-lg transition-all duration-300 shadow-md relative overflow-hidden"
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span className="relative z-10 flex items-center justify-center">
                      <Zap className="w-4 h-4 mr-1.5" />
                      Upgrade to Premium
                    </span>
                    
                    {/* Button shine effect */}
                    <div className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent to-white opacity-20 animate-shine" />
                  </motion.button>
                </motion.div>
              </div>
              
              {/* Blurred background content */}
              <div className="opacity-20 pointer-events-none">
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 mb-4">
                  <h4 className="text-sm font-medium text-slate-700 mb-3">Sector Allocation</h4>
                  <div className="h-40 bg-slate-200 rounded-lg"></div>
                </div>
                
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <h4 className="text-sm font-medium text-slate-700 mb-2">Top Holdings</h4>
                  <div className="space-y-2">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="p-2 bg-white rounded-lg border border-slate-200">
                        <div className="h-6 bg-slate-200 rounded"></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        }
        
        // For premium users or own profile
        return (
          <div className="space-y-4">
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <h4 className="text-sm font-medium text-slate-700 mb-3">Sector Allocation</h4>
              <div className="relative h-40 rounded-lg overflow-hidden">
                {/* Simple mock chart - in real app, use a proper chart library */}
                <div className="absolute inset-0 flex">
                  <div className="h-full bg-blue-500" style={{ width: '30%' }}></div>
                  <div className="h-full bg-green-500" style={{ width: '25%' }}></div>
                  <div className="h-full bg-yellow-500" style={{ width: '20%' }}></div>
                  <div className="h-full bg-red-500" style={{ width: '15%' }}></div>
                  <div className="h-full bg-purple-500" style={{ width: '10%' }}></div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-xs text-white font-medium bg-slate-800/70 px-2 py-1 rounded-full">
                    Interactive chart (Premium)
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                <div className="flex items-center text-xs">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mr-1"></div>
                  <span>Tech 30%</span>
                </div>
                <div className="flex items-center text-xs">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-1"></div>
                  <span>Finance 25%</span>
                </div>
                <div className="flex items-center text-xs">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full mr-1"></div>
                  <span>Energy 20%</span>
                </div>
                <div className="flex items-center text-xs">
                  <div className="w-3 h-3 bg-red-500 rounded-full mr-1"></div>
                  <span>Health 15%</span>
                </div>
                <div className="flex items-center text-xs">
                  <div className="w-3 h-3 bg-purple-500 rounded-full mr-1"></div>
                  <span>Other 10%</span>
                </div>
              </div>
            </div>
            
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <h4 className="text-sm font-medium text-slate-700 mb-2">Recent Trades</h4>
              <div className="space-y-2">
                <div className="p-2 bg-white rounded-lg border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="bg-emerald-100 rounded-lg h-8 w-8 flex items-center justify-center mr-2">
                      <span className="text-xs font-medium text-emerald-700">AAPL</span>
                    </div>
                    <span className="text-sm font-medium">Buy</span>
                  </div>
                  <div className="text-sm text-slate-500">10 shares</div>
                </div>
                <div className="p-2 bg-white rounded-lg border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="bg-red-100 rounded-lg h-8 w-8 flex items-center justify-center mr-2">
                      <span className="text-xs font-medium text-red-700">TSLA</span>
                    </div>
                    <span className="text-sm font-medium">Sell</span>
                  </div>
                  <div className="text-sm text-slate-500">5 shares</div>
                </div>
              </div>
            </div>
            
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <h4 className="text-sm font-medium text-slate-700 mb-2">Top Holdings</h4>
              <div className="space-y-2">
                <div className="p-2 bg-white rounded-lg border border-slate-200 flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="bg-blue-100 rounded-lg h-8 w-8 flex items-center justify-center mr-2">
                      <span className="text-xs font-medium text-blue-700">AAPL</span>
                    </div>
                    <div>
                      <div className="text-sm font-medium">Apple Inc.</div>
                      <div className="text-xs text-slate-500">Technology</div>
                    </div>
                  </div>
                  <div className="text-sm font-medium text-green-600">+4.2%</div>
                </div>
                <div className="p-2 bg-white rounded-lg border border-slate-200 flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="bg-blue-100 rounded-lg h-8 w-8 flex items-center justify-center mr-2">
                      <span className="text-xs font-medium text-blue-700">MSFT</span>
                    </div>
                    <div>
                      <div className="text-sm font-medium">Microsoft</div>
                      <div className="text-xs text-slate-500">Technology</div>
                    </div>
                  </div>
                  <div className="text-sm font-medium text-green-600">+2.8%</div>
                </div>
              </div>
            </div>
          </div>
        );
        
      case 'badges':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {mockBadges.map((badge, index) => (
                <div 
                  key={index}
                  className={`p-3 rounded-xl border ${badge.earned ? 'bg-white border-slate-200' : 'bg-slate-50 border-slate-100'}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="text-2xl">{badge.icon}</div>
                    {badge.earned && (
                      <div className="bg-green-100 rounded-full p-0.5">
                        <Check className="h-3 w-3 text-green-600" />
                      </div>
                    )}
                  </div>
                  <div className="text-sm font-medium text-slate-700 mb-1">{badge.name}</div>
                  
                  {badge.earned ? (
                    <div className="text-xs text-green-600 font-medium">Earned</div>
                  ) : (
                    <div>
                      <Progress value={badge.progress} max={100} className="h-1.5 mb-1" />
                      <div className="text-xs text-slate-500">{badge.progress}% Complete</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-slate-700">Locked Badges</h4>
                <div className="text-xs text-slate-500">3 remaining</div>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="aspect-square rounded-lg bg-slate-200 flex items-center justify-center">
                    <div className="w-6 h-6 rounded-full bg-slate-300"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
        
      case 'properties':
        // For non-premium users, show a modern premium lock screen with frosted glass effect
        if (!isPremium && investor.id !== 'current-user' && 
            investor.username.toLowerCase() !== 'lebron james' && 
            investor.username.toLowerCase() !== 'valuebuffet') {
          return (
            <div className="relative h-full">
              <div className="absolute inset-0 backdrop-blur-md bg-gradient-to-br from-purple-500/20 to-indigo-500/30 z-10 flex flex-col items-center justify-center rounded-xl border border-white/20 shadow-lg">
                {/* Premium lock icon with animation */}
                <motion.div 
                  className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full p-4 mb-4 shadow-lg border border-white/20"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", duration: 0.8 }}
                >
                  <Shield className="h-8 w-8 text-white" />
                </motion.div>
                
                {/* Premium content text */}
                <motion.div
                  className="text-center px-6"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                >
                  <h3 className="text-xl font-bold text-white mb-2">Premium Content</h3>
                  <p className="text-sm text-white/80 text-center mb-5 max-w-xs">
                    Unlock access to this investor's luxury assets and property portfolio with Premium.
                  </p>
                  
                  {/* Visually appealing premium button */}
                  <motion.button 
                    className="px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl text-sm font-bold hover:shadow-lg transition-all duration-300 shadow-md relative overflow-hidden"
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span className="relative z-10 flex items-center justify-center">
                      <Zap className="w-4 h-4 mr-1.5" />
                      Upgrade to Premium
                    </span>
                    
                    {/* Button shine effect */}
                    <div className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent to-white opacity-20 animate-shine" />
                  </motion.button>
                </motion.div>
              </div>
              
              {/* Blurred background content */}
              <div className="opacity-20 pointer-events-none">
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 mb-4">
                  <h4 className="text-sm font-medium text-slate-700 mb-3">Virtual Assets</h4>
                  <div className="space-y-3">
                    {[1, 2].map((i) => (
                      <div key={i} className="bg-white p-3 rounded-lg border border-slate-200">
                        <div className="h-20 bg-slate-200 rounded w-full mb-2"></div>
                        <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        }
        
        // For premium users or own profile
        return (
          <div className="space-y-4">
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <h4 className="text-sm font-medium text-slate-700 mb-3">Virtual Assets</h4>
              <div className="space-y-3">
                {mockProperties.map((property, index) => (
                  <div 
                    key={index}
                    className="bg-white rounded-lg border border-slate-200 overflow-hidden"
                  >
                    <div className="h-24 bg-slate-300 w-full"></div>
                    <div className="p-3">
                      <div className="flex items-center justify-between">
                        <h5 className="text-sm font-medium text-slate-800">{property.name}</h5>
                        <div className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                          {property.value}
                        </div>
                      </div>
                      <div className="text-xs text-slate-500 mt-1">Acquired {property.acquired}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-slate-700">Total Asset Value</h4>
                <div className="px-2 py-0.5 bg-green-100 rounded-full">
                  <span className="text-xs font-medium text-green-700">+12% this month</span>
                </div>
              </div>
              <div className="text-xl font-bold text-slate-800">
                2,100,000 FB
              </div>
            </div>
          </div>
        );
    }
  };

  // Render the popup
  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={(e) => {
          // Only close if clicking directly on the backdrop element itself, 
          // not when interacting with the popup content or any child element
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <motion.div
          ref={profileRef}
          variants={popupVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="bg-white rounded-2xl shadow-xl max-w-sm w-full max-h-[90vh] flex flex-col"
        >
          {/* Close button */}
          <button 
            onClick={onClose}
            className="absolute top-3 right-3 z-20 bg-slate-100 rounded-full p-1.5 hover:bg-slate-200 transition-colors"
          >
            <X className="h-4 w-4 text-slate-600" />
          </button>
          
          {/* Header Section - Dynamic Animated Header */}
          <div className="relative profile-header-area">
            {/* Drag handle bar indicator */}
            <div className="absolute top-1 left-0 right-0 flex justify-center z-20 drag-handle">
              <div className="w-10 h-1 bg-white/30 rounded-full"></div>
            </div>
            {/* Dynamic performance-based gradient background with drag handle */}
            <div 
              className={`absolute inset-0 z-0 ${
                investor.roi >= 15 ? 'bg-gradient-to-r from-emerald-500/70 via-teal-500/65 to-emerald-400/70' :
                investor.roi >= 0 ? 'bg-gradient-to-r from-blue-500/65 via-indigo-400/60 to-blue-400/65' :
                'bg-gradient-to-r from-orange-500/65 via-amber-400/60 to-orange-400/65'
              }`}
            >
              {/* Animated gradient overlay */}
              <div className="absolute inset-0 bg-white/10 mix-blend-overlay"></div>
              
              {/* Animated pattern overlay */}
              <div className="absolute inset-0 opacity-30" 
                style={{
                  backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.2' fill-rule='evenodd'%3E%3Ccircle cx='3' cy='3' r='3'/%3E%3Ccircle cx='13' cy='13' r='3'/%3E%3C/g%3E%3C/svg%3E\")",
                  backgroundSize: "24px 24px"
                }}
              ></div>
            </div>
            
            <div className="relative z-10 p-4">
              <div className="flex items-start">
                {/* Animated floating avatar with enhanced visuals */}
                <div className="relative mr-3">
                  <motion.div
                    className="w-16 h-16 rounded-full overflow-hidden border-[3px] border-white shadow-lg"
                    initial={{ y: 0 }}
                    animate={{ y: [0, -4, 0] }}
                    transition={{ 
                      repeat: Infinity, 
                      duration: 3,
                      ease: "easeInOut",
                    }}
                    style={{
                      filter: "drop-shadow(0 4px 10px rgba(0,0,0,0.1))"
                    }}
                  >
                    <img 
                      src={investor.avatar || "/images/default-avatar.png"} 
                      alt={investor.username} 
                      className="w-full h-full object-cover"
                    />
                    
                    {/* Subtle glow effect for avatar */}
                    <div className="absolute inset-0 rounded-full bg-white/20 mix-blend-overlay"></div>
                  </motion.div>
                  
                  {/* Animated rank badge with shine effect */}
                  <motion.div 
                    className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-md border-2 border-white overflow-hidden
                      ${rankBadge.color === 'gold' ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' :
                        rankBadge.color === 'silver' ? 'bg-gradient-to-br from-slate-400 to-slate-600' :
                        rankBadge.color === 'bronze' ? 'bg-gradient-to-br from-amber-500 to-amber-700' :
                        'bg-gradient-to-br from-blue-500 to-blue-700'}`
                    }
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2, type: "spring" }}
                  >
                    {/* Shine effect on badge */}
                    {(investor.rank !== undefined && investor.rank <= 3) && (
                      <motion.div 
                        className="absolute inset-0 bg-white/60"
                        style={{ 
                          clipPath: "polygon(0 0, 30% 0, 70% 100%, 0% 100%)",
                        }}
                        initial={{ x: -40 }}
                        animate={{ x: 60 }}
                        transition={{ 
                          repeat: Infinity, 
                          duration: 1.5,
                          repeatDelay: 3
                        }}
                      />
                    )}
                    
                    {rankBadge.label}
                  </motion.div>
                </div>
                
                {/* Enhanced user details with animations */}
                <div className="flex-1">
                  <div className="flex items-center">
                    <motion.h2 
                      className={`text-xl font-bold mr-1 ${
                        investor.roi >= 0 ? 'text-white' : 'text-white/90'
                      } ${headingGlow ? 'text-shadow-glow' : ''}`}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                    >
                      {investor.username}
                    </motion.h2>
                    
                    {/* Animated verification badge */}
                    {isPremium && (
                      <motion.div 
                        className="ml-1.5 bg-blue-500 rounded-full p-0.5 flex items-center justify-center"
                        whileHover={{ scale: 1.2 }}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ 
                          type: "spring",
                          delay: 0.3
                        }}
                      >
                        <Check className="w-3 h-3 text-white" />
                      </motion.div>
                    )}
                  </div>
                  
                  {investor.name && (
                    <motion.p 
                      className="text-sm text-white/80 font-medium"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      {investor.name}
                    </motion.p>
                  )}
                  
                  {/* Enhanced membership info with custom styling */}
                  <motion.div 
                    className="flex items-center text-sm text-white/90 mt-1"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <span className="flex items-center">
                      <Clock className="h-3 w-3 mr-1 inline" />
                      <span className="text-white/80 font-medium">Member since {memberSinceFormatted}</span>
                    </span>
                    <span className="mx-2 text-white/60">•</span>
                    <span className="flex items-center">
                      <Award className="h-3 w-3 mr-1 inline" />
                      <span className="font-semibold text-white">{investor.portfolioQuality}</span>
                      <span className="text-white/80 ml-0.5">Quality</span>
                    </span>
                  </motion.div>
                  
                  {/* Follower count display for social element */}
                  <motion.div 
                    className="mt-1 text-xs text-white/80 flex items-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <Users className="h-3 w-3 mr-1" />
                    <span className="font-medium">{followers.toLocaleString()}</span>
                    <span className="ml-1">followers</span>
                    
                    {/* Advanced Investment Tier Badge */}
                    <span className="ml-2 px-2 py-0.5 rounded-full 
                      bg-gradient-to-r from-white/20 to-white/10 backdrop-blur-sm border border-white/20 
                      flex items-center shadow-sm"
                    >
                      {rankBadge.color === 'gold' ? (
                        <span className="text-xs font-medium text-white">Diamond Tier</span>
                      ) : rankBadge.color === 'silver' ? (
                        <span className="text-xs font-medium text-white">Platinum Tier</span>
                      ) : rankBadge.color === 'bronze' ? (
                        <span className="text-xs font-medium text-white">Gold Tier</span>
                      ) : (
                        <span className="text-xs font-medium text-white">Silver Tier</span>
                      )}
                    </span>
                  </motion.div>
                </div>
              </div>
              
              {/* Enhanced quote section with card-specific styling */}
              <motion.div 
                className={`mt-3 backdrop-blur-md rounded-xl p-3 shadow-lg overflow-hidden relative
                  ${personalData.gradient ? `bg-gradient-to-br ${personalData.gradient}` : 'bg-gradient-to-br from-blue-500/80 to-indigo-600/80'}
                `}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full transform translate-x-10 -translate-y-10"></div>
                <div className="absolute bottom-0 left-0 w-16 h-16 bg-black/10 rounded-full transform -translate-x-8 translate-y-8"></div>
                
                <div className="flex relative z-10">
                  <div className="text-white/40 text-2xl font-serif leading-none">"</div>
                  <p className="text-sm text-white font-medium flex-1 px-1.5 leading-5">{personalData.quote}</p>
                  <div className="text-white/40 text-2xl font-serif leading-none self-end">"</div>
                
                  {/* Investor icon as decorative element */}
                  <div className="absolute right-0 bottom-0 text-white/20 opacity-40 transform translate-x-2 translate-y-2">
                    {personalData.icon}
                  </div>
                </div>
              </motion.div>
              
              {/* Enhanced Stats cards with micro-charts and animations */}
              <motion.div 
                className="grid grid-cols-4 gap-2 mt-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                {/* ROI card with sparkline */}
                <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-md p-2 border border-slate-100 overflow-hidden relative">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-xs text-slate-500 font-medium">ROI</span>
                    <TrendingUp className="h-3 w-3 text-green-500" />
                  </div>
                  <div className="flex items-baseline">
                    <span className={`text-sm font-bold ${investor.roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {investor.roi.toFixed(1)}%
                    </span>
                    <span className="text-[10px] text-slate-400 ml-1">
                      {investor.roi >= 0 ? '↑' : '↓'}
                    </span>
                  </div>
                  {/* Simple micro sparkline */}
                  <div className="h-1 w-full mt-1 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${investor.roi >= 0 ? 'bg-green-500' : 'bg-red-500'}`} 
                      style={{width: `${Math.min(100, Math.max(20, Math.abs(investor.roi * 2)))}%`}}
                    ></div>
                  </div>
                  
                  {/* Decorative gradient corner */}
                  <div className={`absolute -bottom-4 -right-4 w-8 h-8 rounded-full opacity-20 
                    ${investor.roi >= 0 ? 'bg-green-500' : 'bg-red-500'}`}></div>
                </div>
                
                {/* Quality score with circular indicator */}
                <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-md p-2 border border-slate-100 relative">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-xs text-slate-500 font-medium">Quality</span>
                    <Award className="h-3 w-3 text-blue-500" />
                  </div>
                  <div className="flex items-baseline">
                    <span className="text-sm font-bold text-slate-700">
                      {investor.portfolioQuality}
                    </span>
                  </div>
                  {/* Circular progress */}
                  <div className="absolute bottom-1 right-2 w-6 h-6">
                    <svg width="24" height="24" viewBox="0 0 24 24">
                      <circle 
                        cx="12" cy="12" r="10" 
                        fill="none" 
                        stroke="#e2e8f0" 
                        strokeWidth="2" 
                      />
                      <circle 
                        cx="12" cy="12" r="10" 
                        fill="none" 
                        stroke="#3b82f6" 
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeDasharray={`${investor.portfolioQuality * 0.6} 100`}
                        transform="rotate(-90 12 12)"
                      />
                    </svg>
                  </div>
                </div>
                
                {/* Trades with tiny bar chart */}
                <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-md p-2 border border-slate-100">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-xs text-slate-500 font-medium">Trades</span>
                    <ArrowUpRight className="h-3 w-3 text-slate-500" />
                  </div>
                  <div className="text-sm font-bold text-slate-700">
                    {investor.trades}
                  </div>
                  {/* Micro bar chart */}
                  <div className="flex items-end h-2 mt-1 space-x-0.5">
                    {[...Array(5)].map((_, i) => (
                      <div 
                        key={i} 
                        className="w-1 bg-indigo-400 rounded-sm"
                        style={{ 
                          height: `${Math.max(20, Math.min(100, Math.random() * 100))}%`,
                          opacity: 0.6 + (i * 0.1)
                        }}
                      ></div>
                    ))}
                  </div>
                </div>
                
                {/* Refs with growth indicator */}
                <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-md p-2 border border-slate-100">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-xs text-slate-500 font-medium">Refs</span>
                    <Users className="h-3 w-3 text-purple-500" />
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm font-bold text-slate-700">
                      {investor.referrals}
                    </span>
                    <span className="text-[10px] ml-1 px-1 py-0.5 bg-green-100 text-green-600 rounded-full font-medium">
                      +{Math.floor(Math.random() * 15) + 1}%
                    </span>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
          
          {/* Modern Tab navigation with premium indicators */}
          <div className="px-4 border-b border-slate-200 bg-white">
            <div className="flex space-x-4">
              {(["overview", "portfolio", "badges", "properties"] as const).map((tab) => (
                <motion.button
                  key={tab}
                  className={`py-3.5 px-2 text-sm font-medium relative ${
                    activeTab === tab 
                      ? 'text-blue-600' 
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                  onClick={() => {
                    // For premium tabs, only allow access if user is premium or viewing their own profile
                    if ((tab === 'portfolio' || tab === 'properties') && 
                        !isPremium && investor.id !== 'current-user') {
                      // Show premium lock animation instead of changing tab
                      if (navigator.vibrate) navigator.vibrate([10, 30, 10]); // Haptic feedback for locked tab
                    } else {
                      setActiveTab(tab);
                    }
                  }}
                  whileHover={{ y: -1 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  <div className="flex items-center">
                    {/* Tab Icons */}
                    {tab === 'overview' && <DollarSign className="w-3.5 h-3.5 mr-1.5" />}
                    {tab === 'portfolio' && <PieChart className="w-3.5 h-3.5 mr-1.5" />}
                    {tab === 'badges' && <Award className="w-3.5 h-3.5 mr-1.5" />}
                    {tab === 'properties' && <Briefcase className="w-3.5 h-3.5 mr-1.5" />}
                    
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    
                    {/* Premium indicator for locked tabs */}
                    {(tab === 'portfolio' || tab === 'properties') && 
                     !isPremium && 
                     investor.id !== 'current-user' && (
                      <div className="ml-1.5 flex items-center">
                        <motion.div 
                          className="w-3.5 h-3.5 text-purple-500"
                          initial={{ rotate: 0 }}
                          animate={{ rotate: 360 }}
                          transition={{ 
                            duration: 1.5, 
                            repeat: Infinity, 
                            repeatDelay: 1.5,
                            ease: "easeInOut" 
                          }}
                        >
                          <Shield className="w-full h-full" />
                        </motion.div>
                      </div>
                    )}
                  </div>
                  
                  {/* Animated active indicator */}
                  {activeTab === tab && (
                    <motion.div 
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full"
                      initial={{ opacity: 0, scaleX: 0 }}
                      animate={{ opacity: 1, scaleX: 1 }}
                      transition={{ duration: 0.2 }}
                    />
                  )}
                </motion.button>
              ))}
            </div>
          </div>
          
          {/* Tab content with scrolling */}
          <div className="flex-1 overflow-y-auto p-4 investor-profile-scroll-container">
            {renderTabContent()}
          </div>
          
          {/* Enhanced action buttons with animation effects */}
          <div className="p-4 border-t border-slate-100 bg-white flex space-x-3">
            {isPremium && (
              <motion.button 
                className="flex-1 py-2.5 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-xl font-medium text-sm shadow-md relative overflow-hidden"
                whileHover={{ scale: 1.02, boxShadow: "0 5px 15px rgba(0, 0, 0, 0.1)" }}
                whileTap={{ scale: 0.98 }}
                onClick={handleFollowClick}
              >
                <span className="relative z-10 flex items-center justify-center">
                  <Users className="w-4 h-4 mr-1.5" />
                  {isFollowing ? 'Following' : 'Follow'}
                </span>
                
                {/* Follow animation overlay */}
                {showFollowAnimation && (
                  <motion.div 
                    className="absolute inset-0 bg-white/20"
                    initial={{ scale: 0, opacity: 0.8, x: 0, y: 0 }}
                    animate={{ 
                      scale: [0, 1.5], 
                      opacity: [0.8, 0],
                      x: [0, 0],
                      y: [0, 0]
                    }}
                    transition={{ duration: 0.8 }}
                  />
                )}
                
                {/* Button shine effect */}
                <div className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent to-white opacity-20 animate-shine" />
              </motion.button>
            )}
            
            <motion.button 
              className="flex-1 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-medium text-sm shadow-md relative overflow-hidden"
              whileHover={{ scale: 1.02, boxShadow: "0 5px 15px rgba(0, 0, 0, 0.1)" }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="relative z-10 flex items-center justify-center">
                <Zap className="w-4 h-4 mr-1.5" />
                Challenge
              </span>
              
              {/* Button shine effect */}
              <div className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent to-white opacity-20 animate-shine" />
            </motion.button>
            
            <motion.button 
              className="flex items-center justify-center w-12 h-12 bg-slate-100 rounded-xl hover:bg-slate-200 relative shadow-sm"
              whileHover={{ 
                backgroundColor: "#f1f5f9",
                y: -2,
                boxShadow: "0 4px 8px rgba(0, 0, 0, 0.05)" 
              }}
              whileTap={{ scale: 0.95 }}
              onClick={() => window.open(`/profile/${investor.username}`, '_blank')}
            >
              <ChevronDown className="h-5 w-5 text-slate-600 rotate-270" />
            </motion.button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}