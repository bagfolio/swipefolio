import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { useGameState } from '@/hooks/use-game-state';
import { GameHeader, GameOver } from './ui/game-elements';
import { 
  ArrowLeft, ArrowRight, Coins, Trophy, Star, TrendingUp, TrendingDown, 
  Save, Lock, Rocket, Leaf, Heart, Database, Zap, Building2, Globe, 
  Cpu, Landmark, Car, Cloud, Brain, Space, Atom, RefreshCcw
} from 'lucide-react';

// Interfaces
interface Stock {
  id: number;
  name: string;
  symbol: string;
  price: number;
  change: number;
  marketCap: number;
  industry: string;
  description: string;
  tier: number;
  volatility: number;
}

interface MarketEvent {
  type: "positive" | "negative";
  message: string;
  icon: JSX.Element;
  color: string;
}

// Constants
const XP_PER_LEVEL = 100;
const INITIAL_MONEY = 1000;

// Stock tiers
const STOCK_TIERS = [
  { name: "Penny Stocks", minPrice: 0.05, maxPrice: 1, requiredLevel: 1 },
  { name: "Small Caps", minPrice: 1, maxPrice: 10, requiredLevel: 2 },
  { name: "Mid Caps", minPrice: 10, maxPrice: 50, requiredLevel: 3 },
  { name: "Large Caps", minPrice: 50, maxPrice: 200, requiredLevel: 5 },
  { name: "Blue Chips", minPrice: 200, maxPrice: 1000, requiredLevel: 8 }
];

// Initial stocks
const INITIAL_STOCKS: Stock[] = [
  // Tier 1 - Penny Stocks
  {
    id: 101,
    name: "MicroTech Solutions",
    symbol: "MCRO",
    price: 0.05,
    change: 0,
    marketCap: 100000,
    industry: "Technology",
    description: "Small tech startup with innovative software solutions.",
    tier: 1,
    volatility: 0.05
  },
  {
    id: 102,
    name: "GreenLeaf Farms",
    symbol: "LEAF",
    price: 0.08,
    change: 0,
    marketCap: 150000,
    industry: "Agriculture",
    description: "Sustainable farming and organic produce.",
    tier: 1,
    volatility: 0.04
  },
  {
    id: 103,
    name: "HealthCore Labs",
    symbol: "HLTH",
    price: 0.15,
    change: 0,
    marketCap: 200000,
    industry: "Healthcare",
    description: "Medical research and diagnostics.",
    tier: 1,
    volatility: 0.06
  },
  // Tier 2 - Small Caps
  {
    id: 201,
    name: "DataFlow Analytics",
    symbol: "DATA",
    price: 2.50,
    change: 0,
    marketCap: 5000000,
    industry: "Technology",
    description: "Business analytics solutions.",
    tier: 2,
    volatility: 0.06
  },
  {
    id: 202,
    name: "EcoEnergy Systems",
    symbol: "ECO",
    price: 3.25,
    change: 0,
    marketCap: 6000000,
    industry: "Energy",
    description: "Renewable energy technology.",
    tier: 2,
    volatility: 0.07
  },
  // Tier 3 - Mid Caps
  {
    id: 301,
    name: "GlobalTech Solutions",
    symbol: "GTEC",
    price: 25.00,
    change: 0,
    marketCap: 50000000,
    industry: "Technology",
    description: "Global technology solutions provider.",
    tier: 3,
    volatility: 0.08
  },
  {
    id: 302,
    name: "RenewPower",
    symbol: "RNPW",
    price: 30.00,
    change: 0,
    marketCap: 60000000,
    industry: "Energy",
    description: "Renewable energy infrastructure.",
    tier: 3,
    volatility: 0.07
  }
];

// Market events
const MARKET_EVENTS: MarketEvent[] = [
  {
    type: "positive",
    message: "Economic stimulus announced! Markets are up.",
    icon: <TrendingUp />,
    color: "text-green-500"
  },
  {
    type: "negative",
    message: "Inflation concerns are affecting markets.",
    icon: <TrendingDown />,
    color: "text-red-500"
  },
  {
    type: "positive",
    message: "Tech sector experiencing innovation boom!",
    icon: <Cpu />,
    color: "text-blue-500"
  },
  {
    type: "negative",
    message: "Energy crisis affecting manufacturing.",
    icon: <Zap />,
    color: "text-orange-500"
  }
];

export function MarketAdventureGame() {
  const {
    gameState,
    updateScore,
    addTickets,
    resetGame
  } = useGameState();

  // Game state
  const [money, setMoney] = useState(INITIAL_MONEY);
  const [portfolio, setPortfolio] = useState<Record<string, number>>({});
  const [level, setLevel] = useState(1);
  const [xp, setXp] = useState(0);
  const [stocks, setStocks] = useState<Stock[]>(INITIAL_STOCKS);
  const [unlockedStocks, setUnlockedStocks] = useState<string[]>(["MCRO", "LEAF", "HLTH"]);
  const [currentEvent, setCurrentEvent] = useState<MarketEvent | null>(null);
  const [selectedTier, setSelectedTier] = useState<number | null>(1);
  const [showTutorial, setShowTutorial] = useState(true);
  const [totalTrades, setTotalTrades] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [dayCount, setDayCount] = useState(1);
  
  // Calculate XP progress
  const xpProgress = (xp % XP_PER_LEVEL) / XP_PER_LEVEL * 100;

  // Start the game
  const startGame = () => {
    setGameStarted(true);
    setShowTutorial(false);
    
    // Start market simulation
    const simInterval = setInterval(() => {
      simulateMarketMovements();
      incrementDay();
      
      // Random events
      if (Math.random() < 0.2) { // 20% chance for an event
        triggerRandomEvent();
      }
    }, 3000); // Update every 3 seconds
    
    return () => clearInterval(simInterval);
  };
  
  // Handle beginning tutorial
  const handleTutorialComplete = () => {
    setShowTutorial(false);
  };
  
  // Add XP to player
  const addXP = (amount: number) => {
    const newXP = xp + amount;
    const newLevel = Math.floor(newXP / XP_PER_LEVEL) + 1;
    const leveledUp = newLevel > level;
    
    setXp(newXP);
    
    if (leveledUp) {
      setLevel(newLevel);
      
      // Unlock new stocks when leveling up
      const newTierStocks = INITIAL_STOCKS.filter(stock => 
        !unlockedStocks.includes(stock.symbol) && 
        STOCK_TIERS[stock.tier - 1].requiredLevel <= newLevel
      );
      
      if (newTierStocks.length > 0) {
        const newUnlocked = [...unlockedStocks];
        newTierStocks.slice(0, 2).forEach(stock => {
          newUnlocked.push(stock.symbol);
        });
        setUnlockedStocks(newUnlocked);
      }
    }
  };
  
  // Increment game day
  const incrementDay = () => {
    setDayCount(prev => prev + 1);
    
    // Add a little XP each day
    addXP(1);
    
    // End game after 30 days
    if (dayCount >= 30) {
      endGame();
    }
  };
  
  // Trigger a random market event
  const triggerRandomEvent = () => {
    const randomEvent = MARKET_EVENTS[Math.floor(Math.random() * MARKET_EVENTS.length)];
    setCurrentEvent(randomEvent);
    
    // Apply event effects
    setStocks(prevStocks => {
      return prevStocks.map(stock => {
        const impactFactor = randomEvent.type === "positive" ? 1 : -1;
        const impactStrength = 0.01 + (Math.random() * 0.04); // 1-5% impact
        
        // Adjust price
        const newPrice = stock.price * (1 + (impactFactor * impactStrength * (1.5 - stock.volatility)));
        const priceChange = ((newPrice - stock.price) / stock.price) * 100;
        
        return {
          ...stock,
          price: parseFloat(newPrice.toFixed(2)),
          change: parseFloat(priceChange.toFixed(2))
        };
      });
    });
    
    // Clear event after 5 seconds
    setTimeout(() => {
      setCurrentEvent(null);
    }, 5000);
  };
  
  // Simulate market movements
  const simulateMarketMovements = () => {
    setStocks(prevStocks => {
      return prevStocks.map(stock => {
        // Calculate random market movement
        const volatilityFactor = stock.volatility * (Math.random() - 0.5) * 2;
        const trendFactor = 0.005; // Small upward trend over time
        
        // Update price with bounds to prevent negative values
        let newPrice = stock.price * (1 + (volatilityFactor + trendFactor));
        newPrice = Math.max(0.01, newPrice); // Ensure price doesn't go below 0.01
        
        // Calculate price change percentage
        const priceChange = ((newPrice - stock.price) / stock.price) * 100;
        
        return {
          ...stock,
          price: parseFloat(newPrice.toFixed(2)),
          change: parseFloat(priceChange.toFixed(2))
        };
      });
    });
    
    // Update portfolio value
    updatePortfolioValue();
  };
  
  // Buy stock
  const buyStock = (stock: Stock) => {
    // Check if player has enough money
    if (money < stock.price) {
      return false;
    }
    
    // Update portfolio
    const newPortfolio = { ...portfolio };
    newPortfolio[stock.symbol] = (newPortfolio[stock.symbol] || 0) + 1;
    setPortfolio(newPortfolio);
    
    // Deduct money
    setMoney(prevMoney => parseFloat((prevMoney - stock.price).toFixed(2)));
    
    // Track trade
    setTotalTrades(prev => prev + 1);
    
    // Add XP for trading
    addXP(5);
    
    return true;
  };
  
  // Sell stock
  const sellStock = (stock: Stock) => {
    // Check if player owns this stock
    if (!portfolio[stock.symbol] || portfolio[stock.symbol] <= 0) {
      return false;
    }
    
    // Update portfolio
    const newPortfolio = { ...portfolio };
    newPortfolio[stock.symbol] -= 1;
    
    // Remove from portfolio if zero shares
    if (newPortfolio[stock.symbol] === 0) {
      delete newPortfolio[stock.symbol];
    }
    
    setPortfolio(newPortfolio);
    
    // Add money
    setMoney(prevMoney => parseFloat((prevMoney + stock.price).toFixed(2)));
    
    // Track trade
    setTotalTrades(prev => prev + 1);
    
    // Add XP for trading
    addXP(5);
    
    return true;
  };
  
  // Update portfolio value
  const updatePortfolioValue = () => {
    // Calculate total portfolio value
    const portfolioValue = Object.entries(portfolio).reduce((total, [symbol, shares]) => {
      const stock = stocks.find(s => s.symbol === symbol);
      if (stock) {
        return total + (stock.price * shares);
      }
      return total;
    }, 0);
    
    // Total net worth is cash + portfolio value
    const netWorth = money + portfolioValue;
    
    // Update game score based on net worth
    updateScore(Math.floor(netWorth));
  };
  
  // End game
  const endGame = () => {
    setGameOver(true);
    
    // Calculate final portfolio value
    const portfolioValue = Object.entries(portfolio).reduce((total, [symbol, shares]) => {
      const stock = stocks.find(s => s.symbol === symbol);
      if (stock) {
        return total + (stock.price * shares);
      }
      return total;
    }, 0);
    
    // Final score is cash + portfolio value
    const finalScore = money + portfolioValue;
    
    // Award tickets based on performance
    const ticketsEarned = Math.floor(finalScore / 1000); // 1 ticket per $1000
    addTickets(ticketsEarned);
    
    // Update final score
    updateScore(Math.floor(finalScore));
  };
  
  // Start a new game
  const startNewGame = () => {
    resetGame();
    setMoney(INITIAL_MONEY);
    setPortfolio({});
    setLevel(1);
    setXp(0);
    setStocks(INITIAL_STOCKS);
    setUnlockedStocks(["MCRO", "LEAF", "HLTH"]);
    setCurrentEvent(null);
    setSelectedTier(1);
    setTotalTrades(0);
    setDayCount(1);
    setGameStarted(true);
    setGameOver(false);
    
    startGame();
  };
  
  // Return to games hub
  const returnToHub = () => {
    resetGame();
  };
  
  // Get stocks for the selected tier
  const getStocksForTier = () => {
    if (!selectedTier) return [];
    return stocks.filter(stock => stock.tier === selectedTier && unlockedStocks.includes(stock.symbol));
  };
  
  // Tutorial component
  const renderTutorial = () => {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
      >
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle className="text-xl sm:text-2xl">Welcome to Market Adventure!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>In this game, you'll experience the excitement of stock trading:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Start with ${INITIAL_MONEY} and grow your wealth</li>
              <li>Buy low, sell high to maximize profits</li>
              <li>Level up to unlock more advanced stocks</li>
              <li>React to market events that affect stock prices</li>
              <li>Complete 30 trading days to finish the game</li>
            </ul>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button onClick={startGame}>Start Trading</Button>
          </CardFooter>
        </Card>
      </motion.div>
    );
  };
  
  // Component for stock
  const StockCard = ({ stock }: { stock: Stock }) => {
    const owned = portfolio[stock.symbol] || 0;
    
    return (
      <Card className="mb-2">
        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-2">
            <div>
              <div className="font-bold">{stock.name}</div>
              <div className="text-sm text-gray-500">{stock.symbol} • {stock.industry}</div>
            </div>
            <div className="text-right">
              <div className="font-bold">${stock.price.toFixed(2)}</div>
              <div className={`text-sm ${stock.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)}%
              </div>
            </div>
          </div>
          <div className="text-sm mb-2">{stock.description}</div>
          <div className="flex justify-between items-center">
            <div className="text-sm">
              {owned > 0 && <span className="font-bold">You own: {owned} shares</span>}
            </div>
            <div className="flex space-x-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => sellStock(stock)}
                disabled={!owned}
              >
                Sell
              </Button>
              <Button
                size="sm"
                onClick={() => buyStock(stock)}
                disabled={money < stock.price}
              >
                Buy
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };
  
  // Game layout
  if (!gameStarted) {
    return (
      <div className="max-w-lg mx-auto mt-6 p-4">
        <GameHeader title="Market Adventure" description="Virtual Stock Trading Simulation" icon={<Globe className="h-6 w-6" />} />
        <Card className="mt-6">
          <CardContent className="p-6 text-center">
            <h2 className="text-2xl font-bold mb-4">Market Adventure</h2>
            <p className="mb-6">
              Experience the thrill of stock trading! Buy low, sell high, and build your portfolio
              in this virtual stock market simulation.
            </p>
            <Button size="lg" onClick={startGame}>
              Start Game
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (gameOver) {
    // Calculate final portfolio value
    const portfolioValue = Object.entries(portfolio).reduce((total, [symbol, shares]) => {
      const stock = stocks.find(s => s.symbol === symbol);
      if (stock) {
        return total + (stock.price * shares);
      }
      return total;
    }, 0);
    
    const finalScore = money + portfolioValue;
    
    return (
      <GameOver
        score={Math.floor(finalScore)}
        message={`You completed ${dayCount} trading days and made ${totalTrades} trades!`}
        tickets={Math.floor(finalScore / 1000)}
        onPlayAgain={startNewGame}
        onReturnToHub={returnToHub}
      />
    );
  }
  
  return (
    <div className="max-w-lg mx-auto mb-20 p-4">
      {showTutorial && renderTutorial()}
      
      <GameHeader 
        title="Market Adventure" 
        description={`Day ${dayCount}/30`} 
        icon={<Globe className="h-6 w-6" />} 
      />
      
      <div className="my-4 flex justify-between items-center">
        <div>
          <div className="text-sm text-gray-500">Available Cash</div>
          <div className="text-xl font-bold">${money.toFixed(2)}</div>
        </div>
        
        <div>
          <div className="text-sm text-gray-500">Level {level}</div>
          <Progress value={xpProgress} className="w-24 h-2" />
        </div>
      </div>
      
      {/* Market event notification */}
      <AnimatePresence>
        {currentEvent && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`mb-4 p-3 rounded-lg border flex items-center space-x-2 ${
              currentEvent.type === 'positive' ? 'bg-green-100 border-green-300' : 'bg-red-100 border-red-300'
            }`}
          >
            <div className={currentEvent.color}>{currentEvent.icon}</div>
            <div className="text-sm">{currentEvent.message}</div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Stock tier selection */}
      <div className="mb-4 flex overflow-x-auto py-2 space-x-2">
        {STOCK_TIERS.map((tier, index) => (
          <Button
            key={index}
            variant={selectedTier === index + 1 ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedTier(index + 1)}
            disabled={tier.requiredLevel > level}
            className="whitespace-nowrap"
          >
            {tier.requiredLevel > level && <Lock className="h-3 w-3 mr-1" />}
            {tier.name}
          </Button>
        ))}
      </div>
      
      {/* Stock listings */}
      <div className="space-y-1 mb-10">
        {getStocksForTier().map(stock => (
          <StockCard key={stock.id} stock={stock} />
        ))}
        
        {getStocksForTier().length === 0 && (
          <Card className="p-8 text-center">
            <p className="text-gray-500">
              {selectedTier && STOCK_TIERS[selectedTier - 1].requiredLevel > level
                ? `Reach level ${STOCK_TIERS[selectedTier - 1].requiredLevel} to unlock ${STOCK_TIERS[selectedTier - 1].name}`
                : 'No stocks available in this category'}
            </p>
          </Card>
        )}
      </div>
      
      {/* Portfolio summary */}
      <div className="fixed bottom-0 left-0 right-0 border-t bg-background p-4">
        <div className="max-w-lg mx-auto">
          <h3 className="font-bold mb-2">Your Portfolio</h3>
          {Object.keys(portfolio).length > 0 ? (
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(portfolio).map(([symbol, shares]) => {
                const stock = stocks.find(s => s.symbol === symbol);
                if (!stock) return null;
                
                return (
                  <div key={symbol} className="text-sm border rounded p-2">
                    <div className="font-bold">{symbol}</div>
                    <div>{shares} shares</div>
                    <div className={stock.change >= 0 ? 'text-green-500' : 'text-red-500'}>
                      {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)}%
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-500">You don't own any stocks yet. Start trading!</p>
          )}
        </div>
      </div>
    </div>
  );
}