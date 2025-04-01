import React from 'react';
import { Link, useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { 
  Building2, Timer, Ticket, ArrowRight, Globe, BookOpen, DollarSign,
  ChevronLeft, Trophy, BarChart3
} from 'lucide-react';
import AppNavigation from '@/components/app-navigation';

export default function GamesHubPage() {
  const [location, navigate] = useLocation();
  
  const gameCards = [
    {
      title: "Board Room",
      description: "Make strategic business decisions and see their impact on your company.",
      icon: <Building2 className="w-12 h-12 text-blue-500" />,
      color: "from-blue-500 to-blue-600",
      link: "/games/board-room",
      category: "Strategy"
    },
    {
      title: "Time Attack",
      description: "Test your financial knowledge against the clock in this fast-paced quiz game.",
      icon: <Timer className="w-12 h-12 text-green-500" />,
      color: "from-green-500 to-green-600",
      link: "/games/time-attack",
      category: "Quiz"
    },
    {
      title: "Market Adventure",
      description: "Build a virtual portfolio and navigate challenging market scenarios.",
      icon: <DollarSign className="w-12 h-12 text-emerald-500" />,
      color: "from-emerald-500 to-emerald-600",
      link: "/games/market-adventure",
      category: "Simulation"
    },
    {
      title: "Macro Mastermind",
      description: "Manage a region's economy through global events and policy decisions.",
      icon: <Globe className="w-12 h-12 text-purple-500" />,
      color: "from-purple-500 to-purple-600", 
      link: "/games/macro-mastermind",
      category: "Simulation"
    },
    {
      title: "Investor Simulator",
      description: "Follow legendary investors and make decisions in historical scenarios.",
      icon: <BookOpen className="w-12 h-12 text-orange-500" />,
      color: "from-orange-500 to-orange-600",
      link: "/games/investor-simulator",
      category: "Story"
    }
  ];

  // Organize games into a grid layout with 2 rows of 2 games and a centered final game
  // First 4 games arranged in 2x2 grid
  const gridGames = gameCards.slice(0, 4);
  // 5th game (if exists) will be styled differently
  const finalGame = gameCards.length > 4 ? gameCards[4] : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <AppNavigation />
      
      <div className="container mx-auto px-4 py-6 sm:py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center mb-6"
        >
          <button 
            onClick={() => navigate('/')}
            className="mr-3 p-2 rounded-full bg-white shadow-sm hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-700" />
          </button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-1">Games Hub</h1>
            <p className="text-gray-600">Play games, earn tickets, build your finance skills</p>
          </div>
        </motion.div>

        <motion.div 
          className="flex items-center mb-6 sm:mb-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-5 sm:p-6 text-white shadow-lg"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          <div className="relative mr-5">
            <div className="absolute inset-0 bg-white opacity-20 rounded-full blur-md"></div>
            <Ticket className="w-8 h-8 sm:w-10 sm:h-10 relative z-10" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-semibold mb-1">Earn Raffle Tickets</h2>
            <p className="sm:text-base text-purple-100">
              Win games to earn tickets for premium features and in-app rewards!
            </p>
          </div>
        </motion.div>

        {/* Main Games 2x2 Grid */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4 flex items-center">
            <Trophy className="w-5 h-5 mr-2 text-amber-500" />
            Games
          </h3>
          <div className="grid grid-cols-2 gap-4 sm:gap-6">
            {gridGames.map((game, index) => (
              <motion.div
                key={game.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1, duration: 0.4 }}
              >
                <Link href={game.link}>
                  <Card className="overflow-hidden h-full hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 cursor-pointer">
                    <div className={`bg-gradient-to-r ${game.color} p-3 sm:p-6 text-white relative`}>
                      <div className="flex justify-between items-start">
                        <div className="bg-white/20 p-2 sm:p-3 rounded-lg">
                          {React.cloneElement(game.icon as React.ReactElement, { className: "w-8 h-8 sm:w-12 sm:h-12" })}
                        </div>
                        <span className="bg-white/30 text-white text-xs font-semibold px-2 py-1 rounded-full">
                          {game.category}
                        </span>
                      </div>
                      <h2 className="text-lg sm:text-2xl font-bold mt-3 mb-1">{game.title}</h2>
                    </div>
                    <div className="p-3 sm:p-6">
                      <p className="text-gray-600 mb-3 text-sm sm:text-base line-clamp-2 sm:line-clamp-none">
                        {game.description}
                      </p>
                      <div className="flex items-center text-blue-600 font-medium text-sm sm:text-base">
                        <span>Play Now</span>
                        <ArrowRight className="ml-1 w-3 h-3 sm:w-4 sm:h-4" />
                      </div>
                    </div>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
          
          {/* Additional Featured Game (centered) */}
          {finalGame && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.4 }}
              className="mt-6 sm:w-3/4 mx-auto"
            >
              <Link href={finalGame.link}>
                <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 cursor-pointer">
                  <div className={`bg-gradient-to-r ${finalGame.color} p-3 sm:p-6 text-white relative`}>
                    <div className="flex justify-between items-start">
                      <div className="bg-white/20 p-2 sm:p-3 rounded-lg">
                        {React.cloneElement(finalGame.icon as React.ReactElement, { className: "w-8 h-8 sm:w-12 sm:h-12" })}
                      </div>
                      <span className="bg-white/30 text-white text-xs font-semibold px-2 py-1 rounded-full">
                        {finalGame.category}
                      </span>
                    </div>
                    <h2 className="text-lg sm:text-2xl font-bold mt-3 mb-1">{finalGame.title}</h2>
                  </div>
                  <div className="p-3 sm:p-6">
                    <p className="text-gray-600 mb-3 text-sm sm:text-base line-clamp-2 sm:line-clamp-none">
                      {finalGame.description}
                    </p>
                    <div className="flex items-center text-blue-600 font-medium text-sm sm:text-base">
                      <span>Play Now</span>
                      <ArrowRight className="ml-1 w-3 h-3 sm:w-4 sm:h-4" />
                    </div>
                  </div>
                </Card>
              </Link>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}