import { useContext, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowUp, ArrowDown, MoreHorizontal, PieChart, TrendingUp, Briefcase, 
  Settings, Clock, DollarSign, MessageSquare, Sparkles, Loader2,
  AlertTriangle, BarChart2
} from 'lucide-react';
import AppHeader from '@/components/app-header';
import AppNavigation from '@/components/app-navigation';
import { PortfolioContext, PortfolioHolding } from '@/contexts/portfolio-context';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getIndustryAverages } from '@/lib/industry-data';
import { getQualityScoreColor, getQualityScoreBgColor } from '@/data/leaderboard-data';
// import PortfolioAnalyzer from '@/components/portfolio-analyzer';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, 
  DialogDescription, DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select';
import { StockData, getAllStocks, getIndustryStocks } from '@/lib/stock-data';
import { getAdvancedMetricScore } from '@/lib/advanced-metric-scoring';
import { cn } from '@/lib/utils';

// Define interfaces for impact data
interface ImpactMetrics {
  performance: number;
  stability: number;
  value: number;
  momentum: number;
  qualityScore: number;
  trades: number;
  roi: number;
}

// Define type for stock suggestion with impact data
interface StockSuggestion {
  stock: StockData;
  impact: {
    performance: number;
    stability: number;
    value: number;
    momentum: number;
    qualityScore: number;
    trades: number;
    roi: number;
    industryAllocation: Record<string, { current: number; new: number }>;
  };
}

export default function PortfolioPage() {
  const portfolio = useContext(PortfolioContext);
  const [activeTab, setActiveTab] = useState('metrics');
  
  // Improve with AI feature states
  const [isImproveDialogOpen, setIsImproveDialogOpen] = useState(false);
  const [improvementGoal, setImprovementGoal] = useState('roi');
  const [selectedIndustry, setSelectedIndustry] = useState('all');
  const [investmentAmount, setInvestmentAmount] = useState('10');
  const [suggestions, setSuggestions] = useState<StockSuggestion[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [errorSuggestions, setErrorSuggestions] = useState('');
  
  // Handler for finding stock suggestions based on selected improvement goal
  const handleFindSuggestions = async () => {
    setIsLoadingSuggestions(true);
    setErrorSuggestions('');
    setSuggestions([]);
    
    try {
      // Validate investment amount
      const amount = parseFloat(investmentAmount);
      if (isNaN(amount) || amount <= 0) {
        throw new Error('Please enter a valid investment amount');
      }
      
      if (amount > cash) {
        throw new Error(`You only have $${cash.toFixed(2)} available to invest`);
      }
      
      // Get stocks based on selected industry or all stocks
      const availableStocks = selectedIndustry === 'all' 
        ? getAllStocks() 
        : getIndustryStocks(selectedIndustry);
      
      // Filter out stocks already in portfolio to avoid duplicates
      const filteredStocks = availableStocks.filter(stock => 
        !holdings.some(holding => holding.stock.ticker === stock.ticker)
      );
      
      if (filteredStocks.length === 0) {
        throw new Error(
          selectedIndustry === 'all' 
            ? 'No new stocks available to suggest' 
            : `No new ${selectedIndustry} stocks available to suggest`
        );
      }
      
      // Rank stocks based on selected goal
      let rankedStocks: StockData[] = [];
      
      switch (improvementGoal) {
        case 'roi':
          // Rank by projected 1-year return
          rankedStocks = filteredStocks.sort((a, b) => {
            const aReturn = typeof a.oneYearReturn === 'number' ? a.oneYearReturn :
                           typeof a.oneYearReturn === 'string' ? parseFloat(a.oneYearReturn.replace('%', '')) : 0;
            const bReturn = typeof b.oneYearReturn === 'number' ? b.oneYearReturn :
                           typeof b.oneYearReturn === 'string' ? parseFloat(b.oneYearReturn.replace('%', '')) : 0;
            return bReturn - aReturn; // Descending order (highest first)
          });
          break;
          
        case 'performance':
        case 'stability':
        case 'value':
        case 'momentum':
          // Rank by the specific metric score
          rankedStocks = filteredStocks.sort((a, b) => {
            const aScore = getAdvancedMetricScore(a, improvementGoal as any);
            const bScore = getAdvancedMetricScore(b, improvementGoal as any);
            return bScore - aScore; // Descending order (highest first)
          });
          break;
          
        default:
          throw new Error('Invalid improvement goal selected');
      }
      
      // Get top 3 suggestions and calculate impact
      const topSuggestions = rankedStocks.slice(0, 3);
      const suggestionsWithImpact = await Promise.all(topSuggestions.map(async (stock) => {
        // Non-null assertion is safe because we check for portfolio existence earlier
        const impactData = portfolio!.calculateImpact(stock, amount);
        
        // Convert to our StockSuggestion type
        return { 
          stock, 
          impact: {
            performance: impactData.impact.performance,
            stability: impactData.impact.stability,
            value: impactData.impact.value,
            momentum: impactData.impact.momentum,
            qualityScore: impactData.impact.qualityScore,
            trades: impactData.impact.trades,
            roi: impactData.impact.roi,
            industryAllocation: impactData.industryAllocation
          } 
        };
      }));
      
      setSuggestions(suggestionsWithImpact);
    } catch (error) {
      setErrorSuggestions(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsLoadingSuggestions(false);
    }
  };
  
  if (!portfolio) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 mx-auto mb-4 text-sky-500">
            <DollarSign />
          </div>
          <p className="text-slate-400">Loading portfolio data...</p>
        </div>
      </div>
    );
  }
  
  const { 
    holdings, 
    cash, 
    portfolioValue, 
    totalValue,
    portfolioMetrics
  } = portfolio;
  
  // Calculate performance values
  const totalReturn = holdings.reduce((total, h) => {
    const currentValue = h.shares * h.stock.price;
    const investedValue = h.shares * h.purchasePrice;
    return total + (currentValue - investedValue);
  }, 0);
  
  const totalReturnPercent = holdings.length > 0 
    ? (totalReturn / (portfolioValue - totalReturn)) * 100 
    : 0;
    
  // Calculate the total invested amount (original purchase cost)
  const totalInvested = holdings.reduce((total, h) => {
    return total + (h.shares * h.purchasePrice);
  }, 0);
  
  // Calculate projected 1-year return based on holdings
  const projectedReturn = holdings.reduce((total, h) => {
    // Parse the oneYearReturn string (remove % sign and convert to number)
    const oneYearReturnPercent = 
      typeof h.stock.oneYearReturn === 'number' ? h.stock.oneYearReturn :
      typeof h.stock.oneYearReturn === 'string' ? parseFloat(h.stock.oneYearReturn.replace('%', '')) : 
      0;
    
    // Use the original invested amount (purchase price)
    const investedAmount = h.shares * h.purchasePrice;
    const stockReturn = investedAmount * (oneYearReturnPercent / 100);
    return total + stockReturn;
  }, 0);
  
  // Calculate the percentage based on total invested amount
  const projectedReturnPercent = totalInvested > 0.01
    ? (projectedReturn / totalInvested) * 100
    : 0;
    
  // Calculate the projected future value (invested amount + projected return)
  const projectedValue = totalInvested + projectedReturn;
  
  const sortedHoldings = [...holdings].sort((a, b) => b.value - a.value);
  
  // Calculate asset allocation by industry
  const industryAllocation = holdings.reduce<Record<string, { value: number, percent: number }>>((acc, holding) => {
    const industry = holding.stock.industry;
    
    if (!acc[industry]) {
      acc[industry] = { value: 0, percent: 0 };
    }
    
    acc[industry].value += holding.value;
    return acc;
  }, {});
  
  // Calculate percentages
  Object.keys(industryAllocation).forEach(industry => {
    industryAllocation[industry].percent = (industryAllocation[industry].value / portfolioValue) * 100;
  });
  
  // Sort industries by value
  const sortedIndustries = Object.entries(industryAllocation)
    .sort(([, a], [, b]) => b.value - a.value)
    .map(([industry, data]) => ({ industry, ...data }));
  
  // Generate random colors for each industry (in a real app, these would be consistent)
  const industryColors: Record<string, string> = {
    Technology: 'bg-blue-500',
    Healthcare: 'bg-green-500',
    'Real Estate': 'bg-purple-500',
    Financial: 'bg-amber-500',
    Consumer: 'bg-red-500',
    Energy: 'bg-emerald-500',
    Utilities: 'bg-cyan-500',
    Industrial: 'bg-slate-500',
    Materials: 'bg-orange-500',
    Other: 'bg-gray-500'
  };
  
  return (
    <>
      <AppHeader />
      
      <main className="main-content pb-24 pt-20 px-4 bg-slate-50">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6"
        >
          <h1 className="text-2xl font-bold text-slate-800 mb-4 flex items-center">
            <Briefcase className="mr-2 h-6 w-6 text-slate-600" />
            Your Portfolio
          </h1>
          
          {/* Redesigned Portfolio Summary Card */}
          <div className="bg-white rounded-xl shadow-md border border-slate-200 mb-6">
            <div className="p-4">
              {/* Top Row - Projected Value and Quality Score */}
              <div className="flex justify-between items-center mb-4">
                <div className="flex-1">
                  <p className="text-sm text-slate-500 mb-1">Projected Value (1-Year)</p>
                  <div className="flex items-baseline">
                    <p className="text-2xl font-bold text-slate-800">
                      ${projectedValue.toFixed(2)}
                    </p>
                    <span className={`ml-2 text-sm font-medium ${projectedReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {projectedReturn >= 0 ? '+' : ''}{projectedReturnPercent.toFixed(1)}%
                    </span>
                  </div>
                </div>
                
                {/* Redesigned Quality Score with horizontal bar instead of circle */}
                <div className="bg-slate-50 rounded-lg py-2 px-4 shadow-sm border border-slate-100 min-w-[140px]">
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-xs text-slate-500">Quality Score</p>
                    <p className={`text-lg font-bold ${getQualityScoreColor(portfolioMetrics.qualityScore || 0)}`}>
                      {portfolioMetrics.qualityScore || 0}
                    </p>
                  </div>
                  <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${getQualityScoreBgColor(portfolioMetrics.qualityScore || 0)} rounded-full`} 
                      style={{ width: `${portfolioMetrics.qualityScore || 0}%` }}
                    ></div>
                  </div>
                </div>
              </div>
              
              {/* Bottom Row - Allocation, Invested/Cash */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs text-slate-500 mb-1">Invested</p>
                  <p className="text-lg font-semibold text-slate-800">${portfolioValue.toFixed(2)}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs text-slate-500 mb-1">Cash</p>
                  <p className="text-lg font-semibold text-emerald-600">${cash.toFixed(2)}</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
        
        <Tabs 
          defaultValue={activeTab} 
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="metrics" className="text-sm">
              Metrics
            </TabsTrigger>
            <TabsTrigger value="ai-advisor" className="text-sm flex items-center justify-center">
              <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
              AI Advisor
            </TabsTrigger>
            <TabsTrigger value="holdings" className="text-sm">
              Holdings
            </TabsTrigger>
            <TabsTrigger value="allocation" className="text-sm">
              Allocation
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="holdings" className="space-y-4">
            {sortedHoldings.length === 0 ? (
              <EmptyState 
                title="No holdings yet"
                description="Start investing in companies to build your portfolio"
              />
            ) : (
              sortedHoldings.map(holding => (
                <HoldingCard 
                  key={holding.stock.ticker} 
                  holding={holding} 
                  onSell={(shares) => portfolio.sellStock(holding.stock.ticker, shares)}
                />
              ))
            )}
          </TabsContent>
          
          <TabsContent value="allocation" className="space-y-4">
            {sortedHoldings.length === 0 ? (
              <EmptyState 
                title="No allocation data"
                description="Start investing to see your portfolio allocation"
              />
            ) : (
              <>
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                  <h3 className="text-lg font-medium text-slate-800 mb-3">Asset Allocation</h3>
                  
                  <div className="flex items-center justify-center mb-4">
                    <div className="relative w-32 h-32">
                      <PieChart className="absolute h-full w-full text-slate-300" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <p className="text-xs text-slate-500">Industries</p>
                          <p className="text-lg font-bold text-slate-700">{sortedIndustries.length}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    {sortedIndustries.map(({ industry, value, percent }) => (
                      <div key={industry} className="group">
                        <div className="flex justify-between text-sm mb-1">
                          <p className="font-medium text-slate-700">{industry}</p>
                          <p className="text-slate-900">{percent.toFixed(1)}%</p>
                        </div>
                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${industryColors[industry] || 'bg-slate-500'} rounded-full`}
                            style={{ width: `${percent}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Industry Benchmarks */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-lg font-medium text-slate-800">Industry Benchmarks</h3>
                    <TrendingUp className="h-4 w-4 text-slate-400" />
                  </div>
                  
                  <div className="space-y-4">
                    {sortedIndustries.map(({ industry }) => {
                      const industryAvg = getIndustryAverages(industry);
                      return (
                        <div key={`benchmark-${industry}`} className="bg-slate-50 rounded-lg p-3">
                          <p className="font-medium text-slate-700 mb-2">{industry}</p>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <p className="text-slate-500">Avg. Growth</p>
                              <p className="font-medium text-slate-700">{industryAvg.performance.revenueGrowth}%</p>
                            </div>
                            <div>
                              <p className="text-slate-500">Avg. P/E</p>
                              <p className="font-medium text-slate-700">{industryAvg.value.peRatio}</p>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </>
            )}
          </TabsContent>
          
          <TabsContent value="metrics" className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
              <div className="flex justify-between items-center mb-3">
                <p className="text-sm font-medium text-slate-700">Portfolio Metrics</p>
                {sortedHoldings.length > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="flex items-center text-xs text-blue-600 hover:text-blue-800 font-medium"
                    onClick={() => setIsImproveDialogOpen(true)}
                  >
                    <Sparkles className="h-3.5 w-3.5 mr-1" />
                    See How You Can Improve
                  </Button>
                )}
              </div>
              {sortedHoldings.length === 0 ? (
                <EmptyState 
                  title="No metrics data yet"
                  description="Start investing to see your portfolio metrics"
                  className="py-8"
                />
              ) : (
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  <MetricItem 
                    label="Performance" 
                    value={portfolioMetrics.performance} 
                    color="bg-blue-500" 
                  />
                  <MetricItem 
                    label="Stability" 
                    value={portfolioMetrics.stability} 
                    color="bg-purple-500" 
                  />
                  <MetricItem 
                    label="Value" 
                    value={portfolioMetrics.value} 
                    color="bg-emerald-500" 
                  />
                  <MetricItem 
                    label="Momentum" 
                    value={portfolioMetrics.momentum} 
                    color="bg-amber-500" 
                  />
                </div>
              )}
            </div>
            
            {/* Recent Activity section */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-medium text-slate-800">Recent Activity</h3>
                <Clock className="h-4 w-4 text-slate-400" />
              </div>
              
              {sortedHoldings.length === 0 ? (
                <EmptyState 
                  title="No activity yet"
                  description="Your investment history will appear here"
                  className="py-8"
                />
              ) : (
                <div className="space-y-3">
                  {sortedHoldings.map(holding => (
                    <div key={`activity-${holding.stock.ticker}`} className="flex items-center p-2 hover:bg-slate-50 rounded-lg">
                      <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                        <DollarSign className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-700">Purchased {holding.stock.ticker}</p>
                        <p className="text-xs text-slate-500">{new Date(holding.purchaseDate).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-slate-800">
                          ${(holding.shares * holding.purchasePrice).toFixed(2)}
                        </p>
                        <p className="text-xs text-slate-500">{holding.shares.toFixed(4)} shares</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="ai-advisor" className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-slate-800">Portfolio Advisor</h3>
                {sortedHoldings.length > 0 && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setIsImproveDialogOpen(true)}
                    className="flex items-center text-sm"
                  >
                    <Sparkles className="h-3.5 w-3.5 mr-1.5 text-blue-500" />
                    Improve with AI
                  </Button>
                )}
              </div>
              
              {sortedHoldings.length === 0 ? (
                <EmptyState 
                  title="Start building your portfolio"
                  description="The AI advisor can help analyze your investments once you have holdings"
                  className="py-8"
                />
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-slate-600">
                    Based on your current portfolio, we have the following suggestions:
                  </p>
                  
                  <div className="bg-slate-50 p-4 rounded-lg">
                    <div className="flex items-start">
                      <AlertTriangle className="h-5 w-5 text-amber-500 mr-3 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-slate-800">Diversification Opportunity</p>
                        <p className="text-sm text-slate-600 mt-1">
                          Your portfolio is currently concentrated in {sortedIndustries.length} {sortedIndustries.length === 1 ? 'industry' : 'industries'}.
                          Consider adding stocks from different sectors to reduce risk.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-slate-50 p-4 rounded-lg">
                    <div className="flex items-start">
                      <BarChart2 className="h-5 w-5 text-blue-500 mr-3 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-slate-800">Performance Analysis</p>
                        <p className="text-sm text-slate-600 mt-1">
                          Your portfolio has a projected 1-year return of {projectedReturnPercent.toFixed(1)}%.
                          {projectedReturnPercent < 10 
                            ? " There's potential to increase your returns with tactical adjustments."
                            : " This is a solid projected return based on current holdings."}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-slate-50 p-4 rounded-lg">
                    <div className="flex items-start">
                      <TrendingUp className="h-5 w-5 text-green-500 mr-3 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-slate-800">Growth Potential</p>
                        <p className="text-sm text-slate-600 mt-1">
                          Your portfolio's quality score is {portfolioMetrics.qualityScore}.
                          {portfolioMetrics.qualityScore < 70 
                            ? " There's room for optimizing your investments for better performance."
                            : " This is a strong score indicating a well-balanced portfolio."}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6 pt-4 border-t border-slate-200">
                    <p className="text-sm text-slate-700 mb-3 font-medium">Ready to optimize your portfolio?</p>
                    <Button 
                      onClick={() => setIsImproveDialogOpen(true)}
                      className="w-full flex items-center justify-center"
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      Get AI-Powered Suggestions
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>
      
      <AppNavigation />
      
      {/* Improve with AI Dialog */}
      <Dialog open={isImproveDialogOpen} onOpenChange={setIsImproveDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Sparkles className="h-4 w-4 mr-2 text-blue-500" />
              Improve Your Portfolio
            </DialogTitle>
            <DialogDescription>
              Discover stocks that could enhance your portfolio based on your investment goals.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            {/* Improvement Goal Selection */}
            <div className="grid grid-cols-1 gap-2">
              <Label htmlFor="improvement-goal">What would you like to improve?</Label>
              <Select 
                value={improvementGoal} 
                onValueChange={setImprovementGoal}
              >
                <SelectTrigger id="improvement-goal">
                  <SelectValue placeholder="Select a goal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="roi">Projected ROI</SelectItem>
                  <SelectItem value="performance">Performance</SelectItem>
                  <SelectItem value="stability">Stability</SelectItem>
                  <SelectItem value="value">Value</SelectItem>
                  <SelectItem value="momentum">Momentum</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Industry Selection */}
            <div className="grid grid-cols-1 gap-2">
              <Label htmlFor="industry">Industry Preference (Optional)</Label>
              <Select 
                value={selectedIndustry} 
                onValueChange={setSelectedIndustry}
              >
                <SelectTrigger id="industry">
                  <SelectValue placeholder="Select an industry" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Industries</SelectItem>
                  <SelectItem value="Tech">Technology</SelectItem>
                  <SelectItem value="Retail">Retail</SelectItem>
                  <SelectItem value="Real Estate">Real Estate</SelectItem>
                  <SelectItem value="Healthcare">Healthcare</SelectItem>
                  <SelectItem value="ESG">ESG / Sustainable</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Investment Amount */}
            <div className="grid grid-cols-1 gap-2">
              <Label htmlFor="investment-amount">
                Investment Amount (Max: ${cash.toFixed(2)})
              </Label>
              <Input
                id="investment-amount"
                type="number"
                min="1"
                max={cash}
                step="1"
                value={investmentAmount}
                onChange={(e) => setInvestmentAmount(e.target.value)}
                className="w-full"
              />
            </div>
          </div>
          
          {/* Loading State */}
          {isLoadingSuggestions && (
            <div className="py-8 text-center">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-blue-500" />
              <p className="text-sm text-slate-500">Analyzing portfolio and finding suggestions...</p>
            </div>
          )}
          
          {/* Error State */}
          {errorSuggestions && (
            <div className="py-4 text-center">
              <p className="text-sm text-red-500">{errorSuggestions}</p>
            </div>
          )}
          
          {/* Results */}
          {!isLoadingSuggestions && suggestions.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-slate-700">Top Recommendations</h3>
              
              {suggestions.map(({ stock, impact }) => (
                <div 
                  key={stock.ticker} 
                  className="border border-slate-200 rounded-lg p-4 hover:shadow-sm transition-shadow duration-200"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-medium text-slate-800 flex items-center">
                        {stock.name}
                        <span className="ml-2 text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                          {stock.ticker}
                        </span>
                      </h4>
                      <p className="text-xs text-slate-500">{stock.industry}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-slate-800">${stock.price.toFixed(2)}</p>
                      {stock.oneYearReturn && (
                        <p className={`text-xs ${
                          (typeof stock.oneYearReturn === 'string' 
                            ? parseFloat(stock.oneYearReturn) >= 0 
                            : (stock.oneYearReturn as number) >= 0)
                            ? 'text-green-600' 
                            : 'text-red-600'
                        }`}>
                          {stock.oneYearReturn}% (1Y)
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <p className="text-xs font-medium text-slate-700 mb-2">
                      Projected Impact on Your Portfolio
                    </p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                      <ImpactMetricDisplay 
                        label="Performance" 
                        value={impact.performance} 
                        color="text-blue-500"
                      />
                      <ImpactMetricDisplay 
                        label="Stability" 
                        value={impact.stability} 
                        color="text-purple-500"
                      />
                      <ImpactMetricDisplay 
                        label="Value" 
                        value={impact.value} 
                        color="text-emerald-500"
                      />
                      <ImpactMetricDisplay 
                        label="Momentum" 
                        value={impact.momentum} 
                        color="text-amber-500"
                      />
                      <div className="col-span-2">
                        <ImpactMetricDisplay 
                          label="Quality Score" 
                          value={impact.qualityScore} 
                          color="text-indigo-500"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <Button 
                      onClick={() => {
                        portfolio.buyStock(stock, parseFloat(investmentAmount));
                        setIsImproveDialogOpen(false);
                      }}
                      className="w-full"
                    >
                      Invest ${investmentAmount} in {stock.ticker}
                    </Button>
                  </div>
                </div>
              ))}
              
              <p className="text-xs text-slate-500 text-center italic">
                AI-powered recommendations based on your portfolio metrics and goals.
              </p>
            </div>
          )}
          
          <DialogFooter>
            <div className="flex justify-between w-full">
              <Button 
                variant="outline" 
                onClick={() => setIsImproveDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleFindSuggestions} 
                disabled={isLoadingSuggestions}
                className="flex items-center"
              >
                {isLoadingSuggestions ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4 mr-2" />
                )}
                Find Suggestions
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Helper components
function MetricItem({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-white rounded-lg p-2 border border-slate-200">
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <div className="flex items-center">
        <div className={`h-2 w-2 rounded-full ${color} mr-2`}></div>
        <p className="font-bold text-lg">{value}</p>
      </div>
      <Progress value={value} className="h-1 mt-1" />
    </div>
  );
}

function HoldingCard({ 
  holding, 
  onSell 
}: { 
  holding: PortfolioHolding; 
  onSell: (shares: number) => void;
}) {
  const [showSellOptions, setShowSellOptions] = useState(false);
  
  const currentValue = holding.shares * holding.stock.price;
  const investedValue = holding.shares * holding.purchasePrice;
  const returnValue = currentValue - investedValue;
  const returnPercent = (returnValue / investedValue) * 100;
  
  const handleSell = (percentage: number) => {
    const sharesToSell = holding.shares * (percentage / 100);
    onSell(sharesToSell);
    setShowSellOptions(false);
  };

  return (
    <div className="bg-white rounded-xl overflow-hidden border border-slate-200 shadow-sm">
      <div className="p-4 flex justify-between items-center">
        <div className="flex items-center">
          <div className="mr-3 h-10 w-10 bg-slate-100 rounded-lg flex items-center justify-center font-bold text-slate-800">
            {holding.stock.ticker.substring(0, 2)}
          </div>
          <div>
            <h3 className="font-medium text-slate-800">{holding.stock.name}</h3>
            <p className="text-xs text-slate-500">{holding.stock.ticker} • {holding.stock.industry}</p>
          </div>
        </div>
        
        <div className="relative">
          <button 
            onClick={() => setShowSellOptions(!showSellOptions)}
            className="p-1 rounded-full hover:bg-slate-100"
          >
            <MoreHorizontal className="h-5 w-5 text-slate-400" />
          </button>
          
          {showSellOptions && (
            <div className="absolute right-0 z-10 mt-1 w-48 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5">
              <div className="py-1 divide-y divide-slate-100">
                <button
                  onClick={() => handleSell(25)}
                  className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                >
                  Sell 25%
                </button>
                <button
                  onClick={() => handleSell(50)}
                  className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                >
                  Sell 50%
                </button>
                <button
                  onClick={() => handleSell(100)}
                  className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-slate-100"
                >
                  Sell All
                </button>
                <button
                  onClick={() => setShowSellOptions(false)}
                  className="block w-full text-left px-4 py-2 text-sm text-slate-500 hover:bg-slate-100"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="px-4 pb-3">
        <div className="flex justify-between text-sm">
          <div>
            <p className="text-slate-500">Shares</p>
            <p className="font-medium">{holding.shares.toFixed(4)}</p>
          </div>
          <div>
            <p className="text-slate-500">Avg. Price</p>
            <p className="font-medium">${holding.purchasePrice.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-slate-500">Current</p>
            <p className="font-medium">${holding.stock.price.toFixed(2)}</p>
          </div>
        </div>
      </div>
      
      <div className="bg-slate-50 px-4 py-3 border-t border-slate-100">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-slate-500">Value</p>
            <p className="font-bold text-slate-800">${currentValue.toFixed(2)}</p>
          </div>
          
          <div className="text-right">
            <p className="text-sm text-slate-500">Return</p>
            <p className={`font-bold flex items-center ${returnValue >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {returnValue >= 0 ? (
                <ArrowUp className="h-3 w-3 mr-1" />
              ) : (
                <ArrowDown className="h-3 w-3 mr-1" />
              )}
              ${Math.abs(returnValue).toFixed(2)} ({returnValue >= 0 ? '+' : ''}{returnPercent.toFixed(2)}%)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ 
  title, 
  description, 
  className = "" 
}: { 
  title: string; 
  description: string;
  className?: string;
}) {
  return (
    <div className={`text-center py-10 ${className}`}>
      <Settings className="h-10 w-10 mx-auto mb-3 text-slate-300" />
      <h3 className="text-lg font-medium text-slate-700 mb-1">{title}</h3>
      <p className="text-sm text-slate-500">{description}</p>
    </div>
  );
}

// Impact metric display component for portfolio suggestions
function ImpactMetricDisplay({ 
  label, 
  value, 
  color 
}: { 
  label: string; 
  value: number; 
  color: string;
}) {
  const isPositive = value >= 0;
  
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-slate-600">{label}</span>
      <span className={`flex items-center text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? (
          <ArrowUp className="h-3 w-3 mr-1" />
        ) : (
          <ArrowDown className="h-3 w-3 mr-1" />
        )}
        {isPositive ? '+' : ''}{value.toFixed(1)}
      </span>
    </div>
  );
}