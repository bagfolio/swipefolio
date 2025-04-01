import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Progress } from './ui/progress';
import { useGameState } from '@/hooks/use-game-state';
import { GameHeader, GameOver } from './ui/game-elements';
import { 
  ArrowLeft, BookOpen, Briefcase, DollarSign, Award, Zap, TrendingUp, TrendingDown, Check, X
} from 'lucide-react';

// Game state interfaces
interface GameState {
  playerName: string;
  initialCapital: number;
  currentCapital: number;
  portfolio: Record<string, number>;
  dayCount: number;
  marketSentiment: string;
  riskTolerance: string;
  investmentStrategy: string;
  learnedBasics: boolean;
  firstTrade: boolean;
  marketKnowledge: number;
  tradingExperience: number;
  currentSector: string;
  lastTradeResult: string;
  tutorialCompleted: boolean;
}

interface InvestorProfile {
  id: string;
  name: string;
  strategy: string;
  philosophy: string;
  successStory: string;
  keyPrinciples: string[];
  famousQuotes: string[];
  performanceStats: {
    annualReturn: number;
    majorWins: string[];
    industries: string[];
    successYears: number;
  };
  implementationTips: string[];
  image?: string;
}

interface Challenge {
  id: string;
  title: string;
  description: string;
  scenario: string;
  options: {
    id: string;
    text: string;
    outcome: string;
    capitalEffect: number;
    knowledgeEffect: number;
    experienceEffect: number;
    alignment: Record<string, number>; // how well it aligns with each investor
  }[];
  difficulty: number;
  sector: string;
  context: string;
}

// Famous investor profiles
const INVESTOR_PROFILES: InvestorProfile[] = [
  {
    id: "buffett",
    name: "Warren Buffett",
    strategy: "Value Investing",
    philosophy: "Invest in companies with strong fundamentals at reasonable prices for the long term.",
    successStory: "Built Berkshire Hathaway into one of the world's largest holding companies by identifying undervalued companies with strong economic moats.",
    keyPrinciples: [
      "Buy wonderful companies at fair prices",
      "Invest for the long-term",
      "Focus on business fundamentals, not market trends",
      "Be fearful when others are greedy, and greedy when others are fearful",
      "Invest within your circle of competence"
    ],
    famousQuotes: [
      "Price is what you pay. Value is what you get.",
      "It's far better to buy a wonderful company at a fair price than a fair company at a wonderful price.",
      "Our favorite holding period is forever."
    ],
    performanceStats: {
      annualReturn: 20.1,
      majorWins: ["Coca-Cola", "American Express", "Apple"],
      industries: ["Consumer Goods", "Financial Services", "Insurance"],
      successYears: 60
    },
    implementationTips: [
      "Focus on companies with sustainable competitive advantages",
      "Look for businesses with consistent earnings and high return on equity",
      "Prioritize management quality and integrity",
      "Be patient and think long-term"
    ]
  },
  {
    id: "graham",
    name: "Benjamin Graham",
    strategy: "Defensive Value Investing",
    philosophy: "Protect capital first and foremost by buying stocks significantly below their intrinsic value.",
    successStory: "Known as the 'Father of Value Investing', Graham developed systematic approaches to analyzing securities that influenced generations of investors.",
    keyPrinciples: [
      "Maintain a margin of safety",
      "Focus on quantitative analysis",
      "Separate investing from speculation",
      "Use both qualitative and quantitative analysis",
      "Diversify broadly to reduce risk"
    ],
    famousQuotes: [
      "The investor's chief problem – and even his worst enemy – is likely to be himself.",
      "In the short run, the market is a voting machine, but in the long run, it is a weighing machine.",
      "Investment is most intelligent when it is most businesslike."
    ],
    performanceStats: {
      annualReturn: 17.0,
      majorWins: ["GEICO", "Marshall Field"],
      industries: ["Insurance", "Retail", "Diversified"],
      successYears: 40
    },
    implementationTips: [
      "Look for stocks trading below their net current asset value",
      "Diversify across at least 20-30 different securities",
      "Focus on price-to-earnings, price-to-book, and dividend yield",
      "Be disciplined and methodical in your approach"
    ]
  },
  {
    id: "lynch",
    name: "Peter Lynch",
    strategy: "Growth at a Reasonable Price",
    philosophy: "Invest in companies you understand, with strong growth potential at reasonable valuations.",
    successStory: "As manager of Fidelity's Magellan Fund, Lynch achieved 29.2% average annual returns over 13 years, outperforming all other mutual funds.",
    keyPrinciples: [
      "Invest in what you know and understand",
      "Look for companies with growth potential at reasonable prices",
      "Categorize companies by type (slow growers, stalwarts, fast growers, etc.)",
      "Pay attention to the PEG ratio (price-to-earnings to growth)",
      "Do your homework and research thoroughly"
    ],
    famousQuotes: [
      "Know what you own, and why you own it.",
      "The best stock to buy is the one you already own.",
      "Go for a business that any idiot can run – because sooner or later, any idiot probably is going to run it."
    ],
    performanceStats: {
      annualReturn: 29.2,
      majorWins: ["Dunkin' Donuts", "Taco Bell", "Volvo"],
      industries: ["Consumer Retail", "Automotive", "Food Service"],
      successYears: 13
    },
    implementationTips: [
      "Pay attention to PEG ratio (Price/Earnings divided by Growth Rate)",
      "Look for stocks where you have personal insight or experience",
      "Regularly review your holdings and their stories",
      "Be patient with good companies during temporary setbacks"
    ]
  },
  {
    id: "munger",
    name: "Charlie Munger",
    strategy: "Mental Models & Quality Focus",
    philosophy: "Apply multidisciplinary thinking to invest in high-quality businesses at fair prices.",
    successStory: "As Warren Buffett's partner at Berkshire Hathaway, Munger pushed for a shift from Graham's deep value approach to buying higher-quality businesses.",
    keyPrinciples: [
      "Use multiple mental models from various disciplines",
      "Focus on quality businesses with economic moats",
      "Avoid making stupid decisions by inverting problems",
      "Be rational and avoid psychological biases",
      "Practice extreme patience and rationality"
    ],
    famousQuotes: [
      "All I want to know is where I'm going to die, so I'll never go there.",
      "Knowing what you don't know is more useful than being brilliant.",
      "The big money is not in the buying and selling, but in the waiting."
    ],
    performanceStats: {
      annualReturn: 19.8,
      majorWins: ["Costco", "BYD", "See's Candies"],
      industries: ["Retail", "Technology", "Consumer Goods"],
      successYears: 50
    },
    implementationTips: [
      "Study across disciplines to build a latticework of mental models",
      "Focus on avoiding big mistakes rather than seeking home runs",
      "Look for businesses with pricing power and competitive advantages",
      "Hold great companies for very long periods"
    ]
  }
];

// Investment challenges
const INVESTMENT_CHALLENGES: Challenge[] = [
  {
    id: "bubble_tech",
    title: "Tech Bubble Dilemma",
    description: "It's 1999, and technology stocks are soaring to unprecedented heights.",
    scenario: "Technology stocks have risen dramatically, with many companies trading at enormous P/E ratios. Everyone is talking about 'the new economy' and how 'this time is different.' Your research shows most of these companies have little earnings and questionable business models, but they continue to rise in value daily.",
    options: [
      {
        id: "tech_all_in",
        text: "Invest heavily in the hottest tech stocks to maximize gains while the trend continues",
        outcome: "Initially you see significant paper gains, but when the bubble bursts in 2000, you lose 75% of your investment, significantly worse than the broader market.",
        capitalEffect: -30,
        knowledgeEffect: 10,
        experienceEffect: 15,
        alignment: { buffett: 0, graham: 0, lynch: 40, munger: 0 }
      },
      {
        id: "tech_value",
        text: "Seek established tech companies with real earnings and reasonable valuations",
        outcome: "You invest in companies like Microsoft and Intel that have proven business models and actual earnings. When the bubble bursts, your stocks decline but significantly less than the overall tech sector.",
        capitalEffect: 10,
        knowledgeEffect: 15,
        experienceEffect: 10,
        alignment: { buffett: 70, graham: 60, lynch: 90, munger: 80 }
      },
      {
        id: "tech_avoid",
        text: "Avoid tech stocks entirely and focus on undervalued companies in other sectors",
        outcome: "You miss the tech bubble gains, but also avoid the devastating crash. Your investments in undervalued sectors like energy and utilities perform steadily over the period.",
        capitalEffect: 15,
        knowledgeEffect: 10,
        experienceEffect: 5,
        alignment: { buffett: 90, graham: 95, lynch: 50, munger: 80 }
      },
      {
        id: "tech_short",
        text: "Short overvalued tech stocks, betting on the bubble bursting",
        outcome: "Your timing is off - the bubble continues for months longer than expected, causing significant losses on your short positions before eventually proving correct.",
        capitalEffect: -20,
        knowledgeEffect: 20,
        experienceEffect: 20,
        alignment: { buffett: 20, graham: 40, lynch: 10, munger: 30 }
      }
    ],
    difficulty: 4,
    sector: "Technology",
    context: "The late 1990s tech bubble saw astronomical valuations disconnected from fundamentals. When it burst, the NASDAQ lost over 75% of its value from 2000 to 2002."
  },
  {
    id: "financial_crisis",
    title: "2008 Financial Crisis",
    description: "It's 2008, and the housing market is collapsing, triggering a global financial crisis.",
    scenario: "Major financial institutions are failing, credit markets are freezing, and stock markets are in freefall. Fear is widespread, and many investors are selling everything.",
    options: [
      {
        id: "crisis_sell",
        text: "Sell your investments to protect against further losses",
        outcome: "You avoid some of the worst market declines, but fail to re-enter the market at the bottom, missing much of the subsequent recovery.",
        capitalEffect: -15,
        knowledgeEffect: 10,
        experienceEffect: 15,
        alignment: { buffett: 0, graham: 30, lynch: 20, munger: 0 }
      },
      {
        id: "crisis_hold",
        text: "Hold your existing investments and maintain a long-term perspective",
        outcome: "Your portfolio suffers significant paper losses during the crisis, but fully recovers and surpasses previous highs within 4 years as markets rebound.",
        capitalEffect: 20,
        knowledgeEffect: 15,
        experienceEffect: 20,
        alignment: { buffett: 80, graham: 70, lynch: 80, munger: 90 }
      },
      {
        id: "crisis_buy",
        text: "Substantially increase investments, especially in undervalued financial stocks",
        outcome: "Despite initial further declines, you buy quality companies at once-in-a-generation prices. Over the next decade, these investments provide exceptional returns.",
        capitalEffect: 40,
        knowledgeEffect: 20,
        experienceEffect: 25,
        alignment: { buffett: 100, graham: 80, lynch: 90, munger: 90 }
      },
      {
        id: "crisis_gold",
        text: "Shift assets to gold and other 'safe haven' investments",
        outcome: "Your gold investments perform well during the acute crisis, but lag significantly during the market recovery, resulting in underperformance over the full cycle.",
        capitalEffect: 0,
        knowledgeEffect: 10,
        experienceEffect: 10,
        alignment: { buffett: 10, graham: 40, lynch: 30, munger: 20 }
      }
    ],
    difficulty: 5,
    sector: "Finance",
    context: "The 2008 financial crisis saw the collapse of major institutions like Lehman Brothers and a market decline of over 50%. However, this created once-in-a-generation buying opportunities for those with cash and courage."
  },
  {
    id: "retail_disruption",
    title: "Retail Disruption",
    description: "It's 2010, and e-commerce is beginning to seriously challenge traditional retail.",
    scenario: "Traditional brick-and-mortar retailers are starting to feel the pressure from online competitors, particularly Amazon. Many established retail stocks are trading at low valuations due to concerns about their future.",
    options: [
      {
        id: "retail_traditional",
        text: "Invest in established retailers with strong brands at their discounted valuations",
        outcome: "Some retailers successfully adapt to the new environment, while others decline sharply. Your mixed results lead to modest underperformance compared to the broader market.",
        capitalEffect: -5,
        knowledgeEffect: 15,
        experienceEffect: 10,
        alignment: { buffett: 50, graham: 70, lynch: 40, munger: 40 }
      },
      {
        id: "retail_ecommerce",
        text: "Focus investments on leading e-commerce companies, despite their higher valuations",
        outcome: "Your investments in companies like Amazon deliver exceptional returns as they capture market share from traditional retailers and expand into new areas.",
        capitalEffect: 45,
        knowledgeEffect: 20,
        experienceEffect: 15,
        alignment: { buffett: 60, graham: 30, lynch: 80, munger: 70 }
      },
      {
        id: "retail_adapt",
        text: "Identify traditional retailers with the best omnichannel strategies",
        outcome: "Your careful analysis identifies retailers that successfully integrate online and physical presence. These companies thrive while their less adaptive competitors struggle.",
        capitalEffect: 25,
        knowledgeEffect: 25,
        experienceEffect: 20,
        alignment: { buffett: 80, graham: 60, lynch: 90, munger: 80 }
      },
      {
        id: "retail_avoid",
        text: "Avoid the retail sector entirely due to the uncertainty",
        outcome: "You miss both the significant declines in failed retailers and the substantial gains from successful ones. Your investments in other sectors provide average returns.",
        capitalEffect: 10,
        knowledgeEffect: 5,
        experienceEffect: 5,
        alignment: { buffett: 40, graham: 60, lynch: 30, munger: 50 }
      }
    ],
    difficulty: 3,
    sector: "Retail",
    context: "The retail landscape underwent massive transformation in the 2010s. Amazon's stock increased by over 2,000% from 2010 to 2020, while many traditional retailers filed for bankruptcy."
  },
  {
    id: "dividend_growth",
    title: "Income Strategy Decision",
    description: "You need to establish a reliable income stream from your investments.",
    scenario: "You're developing the income-generating portion of your portfolio. You need to decide on an approach that balances current yield, income growth, and capital preservation.",
    options: [
      {
        id: "income_high_yield",
        text: "Focus on the highest-yielding dividend stocks and bonds",
        outcome: "Your portfolio generates significant current income, but many high-yield investments cut dividends during economic stress. Total return lags due to limited growth and some permanent capital loss.",
        capitalEffect: -10,
        knowledgeEffect: 15,
        experienceEffect: 10,
        alignment: { buffett: 20, graham: 50, lynch: 30, munger: 20 }
      },
      {
        id: "income_dividend_growth",
        text: "Invest in companies with moderate yields but consistent dividend growth",
        outcome: "Initial income is lower, but your income stream grows steadily each year. Companies consistently raise dividends and experience reasonable capital appreciation.",
        capitalEffect: 30,
        knowledgeEffect: 20,
        experienceEffect: 15,
        alignment: { buffett: 90, graham: 70, lynch: 80, munger: 90 }
      },
      {
        id: "income_total_return",
        text: "Focus on total return and sell positions as needed for income",
        outcome: "Your portfolio achieves strong capital growth, allowing you to generate income through strategic selling. This approach gives flexibility but requires more active management.",
        capitalEffect: 25,
        knowledgeEffect: 15,
        experienceEffect: 20,
        alignment: { buffett: 60, graham: 40, lynch: 70, munger: 60 }
      },
      {
        id: "income_bonds",
        text: "Create a bond ladder for predictable income",
        outcome: "Your income stream is highly predictable, but total returns are limited. During periods of rising interest rates, your bond portfolio experiences temporary mark-to-market declines.",
        capitalEffect: 5,
        knowledgeEffect: 10,
        experienceEffect: 10,
        alignment: { buffett: 40, graham: 80, lynch: 30, munger: 50 }
      }
    ],
    difficulty: 2,
    sector: "Multi-sector",
    context: "Dividend growth investing has historically outperformed high-yield investing, with companies that consistently raise dividends delivering superior long-term total returns compared to static high-yield investments."
  }
];

export function InvestorSimulatorGame() {
  const {
    gameState: externalGameState,
    updateScore,
    addTickets,
    resetGame
  } = useGameState();

  // Game state management
  const [gameState, setGameState] = useState<GameState>({
    playerName: "",
    initialCapital: 100000,
    currentCapital: 100000,
    portfolio: {},
    dayCount: 1,
    marketSentiment: "neutral",
    riskTolerance: "moderate",
    investmentStrategy: "",
    learnedBasics: false,
    firstTrade: false,
    marketKnowledge: 10,
    tradingExperience: 5,
    currentSector: "",
    lastTradeResult: "",
    tutorialCompleted: false
  });

  // Game phase tracking
  const [gamePhase, setGamePhase] = useState<'intro' | 'investor-selection' | 'learning' | 'challenges' | 'results'>('intro');
  const [showTutorial, setShowTutorial] = useState(false);
  const [selectedInvestor, setSelectedInvestor] = useState<InvestorProfile | null>(null);
  const [currentChallenge, setCurrentChallenge] = useState<Challenge | null>(null);
  const [completedChallenges, setCompletedChallenges] = useState<string[]>([]);
  const [playerName, setPlayerName] = useState("");
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [principlesMastered, setPrinciplesMastered] = useState<string[]>([]);
  
  // Start a new game
  const startGame = () => {
    if (!playerName.trim()) {
      return; // Require a player name
    }
    
    setGameStarted(true);
    setGameState({
      ...gameState,
      playerName: playerName,
    });
    setGamePhase('investor-selection');
  };
  
  // Select an investor to follow
  const selectInvestor = (investor: InvestorProfile) => {
    setSelectedInvestor(investor);
    setGameState({
      ...gameState,
      investmentStrategy: investor.strategy
    });
    setGamePhase('learning');
  };
  
  // Complete learning phase and move to challenges
  const completeLearnPhase = () => {
    setGameState({
      ...gameState,
      learnedBasics: true,
      marketKnowledge: gameState.marketKnowledge + 15
    });
    setGamePhase('challenges');
    
    // Master one principle immediately
    if (selectedInvestor) {
      const firstPrinciple = selectedInvestor.keyPrinciples[0];
      setPrinciplesMastered([firstPrinciple]);
    }
  };
  
  // Start a challenge
  const startChallenge = (challenge: Challenge) => {
    setCurrentChallenge(challenge);
  };
  
  // Make a decision on the current challenge
  const makeDecision = (optionId: string) => {
    if (!currentChallenge || !selectedInvestor) return;
    
    // Find the selected option
    const selectedOption = currentChallenge.options.find(option => option.id === optionId);
    if (!selectedOption) return;
    
    // Apply the outcome to the game state
    const newCapital = gameState.currentCapital * (1 + selectedOption.capitalEffect / 100);
    
    // Check alignment with chosen investor
    const alignment = selectedOption.alignment[selectedInvestor.id] || 0;
    const alignmentBonus = alignment >= 70 ? 10 : alignment >= 50 ? 5 : 0;
    
    // Update game state
    setGameState({
      ...gameState,
      currentCapital: newCapital,
      marketKnowledge: Math.min(100, gameState.marketKnowledge + selectedOption.knowledgeEffect + alignmentBonus),
      tradingExperience: Math.min(100, gameState.tradingExperience + selectedOption.experienceEffect),
      lastTradeResult: selectedOption.outcome,
      dayCount: gameState.dayCount + 1
    });
    
    // Add this challenge to completed list
    setCompletedChallenges([...completedChallenges, currentChallenge.id]);
    
    // Potentially master a new principle
    if (alignment >= 80 && selectedInvestor.keyPrinciples.length > principlesMastered.length) {
      const newPrinciple = selectedInvestor.keyPrinciples[principlesMastered.length];
      setPrinciplesMastered([...principlesMastered, newPrinciple]);
    }
    
    // Check if all challenges are completed
    if (completedChallenges.length + 1 >= INVESTMENT_CHALLENGES.length) {
      // Game is over
      finishGame();
    } else {
      // Continue to next challenge
      setCurrentChallenge(null);
    }
    
    // Update score on the game state
    updateScore(Math.floor(newCapital / 1000));
  };
  
  // Finish the game
  const finishGame = () => {
    setGameOver(true);
    
    // Calculate final score based on capital, knowledge, and principles mastered
    const capitalScore = gameState.currentCapital / gameState.initialCapital * 100;
    const knowledgeScore = gameState.marketKnowledge;
    const principlesScore = principlesMastered.length * 10;
    
    const finalScore = Math.floor((capitalScore + knowledgeScore + principlesScore) / 3);
    
    // Update final score
    updateScore(finalScore);
    
    // Award tickets based on performance
    const ticketsEarned = Math.floor(finalScore / 20); // 1 ticket per 20 points
    addTickets(ticketsEarned);
  };
  
  // Restart game
  const restartGame = () => {
    setGameStarted(false);
    setGameOver(false);
    setPlayerName("");
    setSelectedInvestor(null);
    setCurrentChallenge(null);
    setCompletedChallenges([]);
    setPrinciplesMastered([]);
    setGameState({
      playerName: "",
      initialCapital: 100000,
      currentCapital: 100000,
      portfolio: {},
      dayCount: 1,
      marketSentiment: "neutral",
      riskTolerance: "moderate",
      investmentStrategy: "",
      learnedBasics: false,
      firstTrade: false,
      marketKnowledge: 10,
      tradingExperience: 5,
      currentSector: "",
      lastTradeResult: "",
      tutorialCompleted: false
    });
    setGamePhase('intro');
    resetGame();
  };
  
  // Return to games hub
  const returnToHub = () => {
    resetGame();
  };
  
  // Tutorial component
  const renderTutorial = () => {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
      >
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle className="text-xl sm:text-2xl">Historical Investor Journey</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>In this educational game, you'll follow in the footsteps of legendary investors and test your decision-making skills:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Select a famous investor whose philosophy resonates with you</li>
              <li>Learn their key investment principles and strategies</li>
              <li>Face historical market scenarios and make investment decisions</li>
              <li>See how your choices align with your chosen investor's approach</li>
              <li>Build your knowledge and master investment principles</li>
            </ul>
            <p>Your final score will be based on your investment performance, knowledge gained, and principles mastered.</p>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button onClick={() => setShowTutorial(false)}>Start Learning</Button>
          </CardFooter>
        </Card>
      </motion.div>
    );
  };
  
  // Intro screen
  const renderIntro = () => {
    return (
      <div className="max-w-2xl mx-auto mt-6 p-4">
        <GameHeader
          title="Historical Investor Journey"
          description="Learn from Investment Legends"
          icon={<BookOpen className="h-6 w-6" />}
        />
        
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Begin Your Investment Journey</CardTitle>
            <CardDescription>Follow the footsteps of legendary investors</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>Enter the world of legendary investors and learn their strategies through historical market challenges.</p>
            
            <div>
              <label htmlFor="playerName" className="block text-sm font-medium mb-2">Your Investor Name</label>
              <Input
                id="playerName"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Enter your name"
                className="w-full"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="text-sm text-gray-500">Starting Capital</div>
                <div className="font-medium">${gameState.initialCapital.toLocaleString()}</div>
              </div>
              
              <Button variant="outline" size="sm" onClick={() => setShowTutorial(true)}>
                How to Play
              </Button>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={returnToHub}>
              Cancel
            </Button>
            <Button 
              onClick={startGame}
              disabled={!playerName.trim()}
            >
              Begin Journey
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  };
  
  // Investor selection screen
  const renderInvestorSelection = () => {
    return (
      <div className="max-w-4xl mx-auto my-6 p-4">
        <GameHeader
          title="Historical Investor Journey"
          description="Choose Your Investment Mentor"
          icon={<BookOpen className="h-6 w-6" />}
        />
        
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {INVESTOR_PROFILES.map(investor => (
            <Card 
              key={investor.id}
              className="overflow-hidden h-full flex flex-col"
            >
              <CardHeader className="pb-2">
                <CardTitle>{investor.name}</CardTitle>
                <CardDescription>{investor.strategy}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-sm mb-3">{investor.philosophy}</p>
                <div className="space-y-2">
                  <div>
                    <div className="text-sm font-medium">Annual Return</div>
                    <div className="flex items-center">
                      <Progress value={investor.performanceStats.annualReturn} max={30} className="h-2 flex-grow" />
                      <span className="ml-2 text-sm">{investor.performanceStats.annualReturn}%</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium">Years of Success</div>
                    <div className="text-sm">{investor.performanceStats.successYears} years</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium">Key Quote</div>
                    <div className="text-sm italic">"{investor.famousQuotes[0]}"</div>
                  </div>
                </div>
              </CardContent>
              <div className="p-3 border-t mt-auto">
                <Button 
                  className="w-full"
                  onClick={() => selectInvestor(investor)}
                >
                  Learn from {investor.name.split(' ')[0]}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  };
  
  // Learning screen
  const renderLearning = () => {
    if (!selectedInvestor) return null;
    
    return (
      <div className="max-w-4xl mx-auto my-6 p-4">
        <GameHeader
          title="Historical Investor Journey"
          description={`Learning from ${selectedInvestor.name}`}
          icon={<BookOpen className="h-6 w-6" />}
        />
        
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>{selectedInvestor.name}</CardTitle>
            <CardDescription>{selectedInvestor.strategy}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-bold mb-2">Investment Philosophy</h3>
              <p>{selectedInvestor.philosophy}</p>
            </div>
            
            <div>
              <h3 className="font-bold mb-2">Success Story</h3>
              <p>{selectedInvestor.successStory}</p>
            </div>
            
            <div>
              <h3 className="font-bold mb-2">Key Investment Principles</h3>
              <ul className="list-disc pl-6 space-y-1">
                {selectedInvestor.keyPrinciples.map((principle, index) => (
                  <li key={index}>{principle}</li>
                ))}
              </ul>
            </div>
            
            <div>
              <h3 className="font-bold mb-2">Famous Quotes</h3>
              <ul className="space-y-2">
                {selectedInvestor.famousQuotes.map((quote, index) => (
                  <li key={index} className="italic">"{quote}"</li>
                ))}
              </ul>
            </div>
            
            <div>
              <h3 className="font-bold mb-2">Notable Investments</h3>
              <div className="flex flex-wrap gap-2">
                {selectedInvestor.performanceStats.majorWins.map((company, index) => (
                  <span key={index} className="inline-block px-2 py-1 rounded-full text-xs bg-green-100">
                    {company}
                  </span>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="font-bold mb-2">Implementation Tips</h3>
              <ul className="list-disc pl-6 space-y-1">
                {selectedInvestor.implementationTips.map((tip, index) => (
                  <li key={index}>{tip}</li>
                ))}
              </ul>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => setGamePhase('investor-selection')}>
              <ArrowLeft className="mr-1 h-4 w-4" /> Change Investor
            </Button>
            <Button onClick={completeLearnPhase}>
              Begin Challenges
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  };
  
  // Challenges screen
  const renderChallenges = () => {
    if (!selectedInvestor) return null;
    
    if (currentChallenge) {
      return (
        <div className="max-w-4xl mx-auto my-6 p-4">
          <GameHeader
            title="Investment Challenge"
            description={currentChallenge.title}
            icon={<Briefcase className="h-6 w-6" />}
          />
          
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>{currentChallenge.title}</CardTitle>
              <CardDescription>Sector: {currentChallenge.sector}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="font-medium">{currentChallenge.description}</p>
              <p>{currentChallenge.scenario}</p>
              
              <div className="mt-4">
                <h3 className="font-bold mb-2">Your Options:</h3>
                <div className="space-y-3">
                  {currentChallenge.options.map(option => (
                    <Card key={option.id} className="overflow-hidden">
                      <CardContent className="p-3">
                        <p>{option.text}</p>
                      </CardContent>
                      <div className="p-2 border-t text-center">
                        <Button 
                          size="sm" 
                          className="w-full"
                          onClick={() => makeDecision(option.id)}
                        >
                          Select
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }
    
    // Show the list of available challenges
    return (
      <div className="max-w-4xl mx-auto my-6 p-4">
        <GameHeader
          title="Historical Investor Journey"
          description="Face Historical Market Challenges"
          icon={<BookOpen className="h-6 w-6" />}
        />
        
        <div className="grid grid-cols-1 gap-4 mt-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-bold">{selectedInvestor.name}'s Approach</h3>
                  <p className="text-sm">{selectedInvestor.strategy}</p>
                </div>
                
                <div className="text-right">
                  <div className="text-sm text-gray-500">Your Capital</div>
                  <div className="font-bold">${Math.floor(gameState.currentCapital).toLocaleString()}</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {gameState.lastTradeResult && (
            <Card className="bg-muted">
              <CardContent className="p-4">
                <h3 className="font-bold mb-1">Previous Decision Outcome</h3>
                <p className="text-sm">{gameState.lastTradeResult}</p>
              </CardContent>
            </Card>
          )}
          
          <div className="mt-2">
            <h3 className="font-bold mb-2">Principles Mastered</h3>
            <div className="space-y-2">
              {principlesMastered.length > 0 ? (
                principlesMastered.map((principle, index) => (
                  <div key={index} className="flex items-center">
                    <Check className="text-green-500 h-4 w-4 mr-2" />
                    <span>{principle}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">You haven't mastered any principles yet. Make decisions that align with your chosen investor's philosophy.</p>
              )}
            </div>
          </div>
          
          <div className="mt-4">
            <h3 className="font-bold mb-2">Available Challenges</h3>
            <div className="space-y-3">
              {INVESTMENT_CHALLENGES.filter(challenge => !completedChallenges.includes(challenge.id)).map(challenge => (
                <Card key={challenge.id} className="overflow-hidden">
                  <CardContent className="p-3">
                    <div className="flex justify-between items-center mb-1">
                      <h4 className="font-bold">{challenge.title}</h4>
                      <div className="text-sm text-gray-500">
                        Difficulty: {Array(challenge.difficulty).fill('★').join('')}
                      </div>
                    </div>
                    <p className="text-sm">{challenge.description}</p>
                    <div className="text-xs mt-1">Sector: {challenge.sector}</div>
                  </CardContent>
                  <div className="p-2 border-t text-center">
                    <Button 
                      size="sm" 
                      className="w-full"
                      onClick={() => startChallenge(challenge)}
                    >
                      Face Challenge
                    </Button>
                  </div>
                </Card>
              ))}
              
              {INVESTMENT_CHALLENGES.filter(challenge => !completedChallenges.includes(challenge.id)).length === 0 && (
                <div className="text-center p-4">
                  <p>You've completed all challenges!</p>
                  <Button className="mt-4" onClick={finishGame}>See Final Results</Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Game over
  if (gameOver) {
    // Calculate final stats
    const capitalGrowth = ((gameState.currentCapital - gameState.initialCapital) / gameState.initialCapital) * 100;
    const knowledgeLevel = gameState.marketKnowledge;
    const principlesCount = principlesMastered.length;
    
    const finalScore = Math.floor((capitalGrowth + knowledgeLevel + (principlesCount * 10)) / 3);
    const ticketsEarned = Math.floor(finalScore / 20);
    
    return (
      <GameOver
        score={finalScore}
        message={`You completed your journey learning from ${selectedInvestor?.name}!`}
        tickets={ticketsEarned}
        onPlayAgain={restartGame}
        onReturnToHub={returnToHub}
      />
    );
  }

  // Render the appropriate screen based on game phase
  if (!gameStarted) {
    return (
      <div>
        {showTutorial && renderTutorial()}
        {renderIntro()}
      </div>
    );
  }

  switch (gamePhase) {
    case 'investor-selection':
      return (
        <div>
          {showTutorial && renderTutorial()}
          {renderInvestorSelection()}
        </div>
      );
    case 'learning':
      return (
        <div>
          {showTutorial && renderTutorial()}
          {renderLearning()}
        </div>
      );
    case 'challenges':
      return (
        <div>
          {showTutorial && renderTutorial()}
          {renderChallenges()}
        </div>
      );
    default:
      return null;
  }
}