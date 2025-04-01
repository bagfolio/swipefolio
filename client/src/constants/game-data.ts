import type { MetricQuestion, BoardRoomDecision, GameReward, LevelRequirement } from '@/types/game';

// Game constants
export const GAME_CONSTANTS = {
  GAME_TIME_LIMIT: 90, // seconds
  QUESTIONS_PER_GAME: 10,
  TICKETS_PER_10_CORRECT: 1,
  TICKETS_PER_DECISION_ROUND: 2,
  DECISIONS_PER_GAME: 5,
  XP_PER_CORRECT_ANSWER: 10,
  XP_PER_COMPLETED_GAME: 50
};

// Sample questions for the Time Attack game
export const METRIC_QUESTIONS: MetricQuestion[] = [
  {
    metric: "P/E Ratio",
    companyValue: 35.2,
    industryAverage: 22.4,
    isGood: false,
    explanation: "A higher P/E ratio than industry average often indicates the stock is overvalued compared to peers."
  },
  {
    metric: "Revenue Growth",
    companyValue: "12.5%",
    industryAverage: "8.2%",
    isGood: true,
    explanation: "Growing revenue faster than industry peers shows the company is gaining market share."
  },
  {
    metric: "Profit Margin",
    companyValue: "8.3%",
    industryAverage: "11.5%",
    isGood: false,
    explanation: "Lower profit margins than industry suggest the company is less efficient at converting revenue to profit."
  },
  {
    metric: "Dividend Yield",
    companyValue: "4.2%",
    industryAverage: "2.8%",
    isGood: true,
    explanation: "Higher dividend yield provides better income for investors while maintaining reasonable payout ratio."
  },
  {
    metric: "Debt to Equity",
    companyValue: 2.1,
    industryAverage: 1.4,
    isGood: false,
    explanation: "Higher debt levels increase financial risk and vulnerability during downturns."
  },
  {
    metric: "Return on Equity",
    companyValue: "18.5%",
    industryAverage: "14.2%",
    isGood: true,
    explanation: "Higher ROE indicates better efficiency at generating profit from shareholder equity."
  },
  {
    metric: "Current Ratio",
    companyValue: 0.8,
    industryAverage: 1.2,
    isGood: false,
    explanation: "Current ratio below 1.0 suggests potential liquidity problems meeting short-term obligations."
  },
  {
    metric: "Price to Book",
    companyValue: 3.2,
    industryAverage: 4.5,
    isGood: true,
    explanation: "Lower P/B ratio suggests the stock might be undervalued relative to its assets compared to peers."
  },
  {
    metric: "Operating Margin",
    companyValue: "12.3%",
    industryAverage: "9.7%",
    isGood: true,
    explanation: "Higher operating margins indicate stronger operational efficiency than competitors."
  },
  {
    metric: "Inventory Turnover",
    companyValue: 4.2,
    industryAverage: 6.8,
    isGood: false,
    explanation: "Lower inventory turnover means the company is less efficient at selling through its inventory."
  },
  {
    metric: "Free Cash Flow",
    companyValue: "$1.2B",
    industryAverage: "$950M",
    isGood: true,
    explanation: "Stronger free cash flow generation provides flexibility for investments, debt reduction, or shareholder returns."
  },
  {
    metric: "R&D as % of Revenue",
    companyValue: "3.5%",
    industryAverage: "8.2%",
    isGood: false,
    explanation: "Significantly lower R&D investment may impact future innovation and competitiveness."
  },
  {
    metric: "Employee Revenue",
    companyValue: "$420K",
    industryAverage: "$380K",
    isGood: true,
    explanation: "Higher revenue per employee indicates better workforce productivity and operational efficiency."
  },
  {
    metric: "Price to Sales",
    companyValue: 6.8,
    industryAverage: 4.2,
    isGood: false,
    explanation: "Higher P/S ratio suggests the company may be overvalued relative to its revenue generation."
  },
  {
    metric: "Quick Ratio",
    companyValue: 1.4,
    industryAverage: 1.1,
    isGood: true,
    explanation: "Stronger quick ratio indicates better ability to meet short-term obligations with liquid assets."
  }
];

// Sample decisions for the Board Room game
export const BOARD_ROOM_DECISIONS: BoardRoomDecision[] = [
  {
    id: "cost_cutting",
    title: "Cost Cutting Initiative",
    description: "Your CFO has proposed a company-wide cost-cutting program to improve margins. How would you like to approach this?",
    options: [
      {
        id: "aggressive",
        text: "Implement aggressive cost-cutting across all departments with 15% budget reduction targets",
        impact: [
          { name: "Profit Margin", change: 4.2 },
          { name: "Employee Satisfaction", change: -8.5 },
          { name: "Innovation Score", change: -6.1 }
        ]
      },
      {
        id: "targeted",
        text: "Target inefficient departments for 10% cuts while protecting R&D and customer service",
        impact: [
          { name: "Profit Margin", change: 2.8 },
          { name: "Employee Satisfaction", change: -3.2 },
          { name: "Innovation Score", change: -1.5 }
        ]
      },
      {
        id: "strategic",
        text: "Implement a strategic efficiency program focused on process improvements rather than cuts",
        impact: [
          { name: "Profit Margin", change: 1.5 },
          { name: "Employee Satisfaction", change: 1.0 },
          { name: "Innovation Score", change: 0.5 }
        ]
      }
    ]
  },
  {
    id: "expansion",
    title: "Market Expansion",
    description: "Your company has an opportunity to expand into new markets. What's your approach?",
    options: [
      {
        id: "aggressive",
        text: "Rapid expansion into multiple international markets simultaneously",
        impact: [
          { name: "Revenue Growth", change: 8.5 },
          { name: "Profit Margin", change: -3.2 },
          { name: "Debt Ratio", change: 7.5 }
        ]
      },
      {
        id: "sequential",
        text: "Phased approach with one market at a time to learn and adapt",
        impact: [
          { name: "Revenue Growth", change: 4.2 },
          { name: "Profit Margin", change: -1.0 },
          { name: "Debt Ratio", change: 2.5 }
        ]
      },
      {
        id: "partnership",
        text: "Enter new markets through local partnerships and joint ventures",
        impact: [
          { name: "Revenue Growth", change: 3.5 },
          { name: "Profit Margin", change: 0.8 },
          { name: "Debt Ratio", change: 0.5 }
        ]
      }
    ]
  },
  {
    id: "product_development",
    title: "Product Development Direction",
    description: "Your product team needs direction on the next generation product line. What approach would you take?",
    options: [
      {
        id: "new_features",
        text: "Focus on adding new features to existing products to attract new customers",
        impact: [
          { name: "Market Share", change: 2.5 },
          { name: "Development Cost", change: 4.0 },
          { name: "Customer Satisfaction", change: -1.5 }
        ]
      },
      {
        id: "quality",
        text: "Improve quality and reliability of existing products to retain customers",
        impact: [
          { name: "Market Share", change: 0.5 },
          { name: "Development Cost", change: 1.5 },
          { name: "Customer Satisfaction", change: 6.0 }
        ]
      },
      {
        id: "disruptive",
        text: "Invest in potentially disruptive new product categories",
        impact: [
          { name: "Market Share", change: -0.5 },
          { name: "Development Cost", change: 8.5 },
          { name: "Long-term Growth Potential", change: 9.5 }
        ]
      }
    ]
  },
  {
    id: "pricing_strategy",
    title: "Pricing Strategy Adjustment",
    description: "Market conditions have changed. How would you adjust pricing strategy?",
    options: [
      {
        id: "premium",
        text: "Move upmarket with premium pricing and enhanced product quality",
        impact: [
          { name: "Profit Margin", change: 5.5 },
          { name: "Market Share", change: -3.5 },
          { name: "Brand Perception", change: 4.0 }
        ]
      },
      {
        id: "competitive",
        text: "Maintain competitive pricing while adding incremental value",
        impact: [
          { name: "Profit Margin", change: 0.0 },
          { name: "Market Share", change: 1.0 },
          { name: "Brand Perception", change: 0.5 }
        ]
      },
      {
        id: "value",
        text: "Reduce prices to gain market share through a value proposition",
        impact: [
          { name: "Profit Margin", change: -4.0 },
          { name: "Market Share", change: 7.5 },
          { name: "Brand Perception", change: -2.0 }
        ]
      }
    ]
  },
  {
    id: "acquisition",
    title: "Acquisition Opportunity",
    description: "A smaller competitor is available for acquisition. How do you proceed?",
    options: [
      {
        id: "full",
        text: "Make a full acquisition offer at a premium to market value",
        impact: [
          { name: "Market Share", change: 5.5 },
          { name: "Debt Ratio", change: 8.0 },
          { name: "Integration Complexity", change: 7.0 }
        ]
      },
      {
        id: "partial",
        text: "Propose a strategic partnership with option to acquire later",
        impact: [
          { name: "Market Share", change: 2.0 },
          { name: "Debt Ratio", change: 1.5 },
          { name: "Strategic Flexibility", change: 6.0 }
        ]
      },
      {
        id: "pass",
        text: "Pass on the acquisition and focus on organic growth",
        impact: [
          { name: "Market Share", change: 0.0 },
          { name: "Debt Ratio", change: -1.0 },
          { name: "Internal Focus", change: 5.0 }
        ]
      }
    ]
  }
];

// Game rewards that players can earn through tickets
export const GAME_REWARDS: GameReward[] = [
  {
    id: "premium_badge",
    name: "Premium Investor Badge",
    description: "Show off your financial expertise with this exclusive badge on your profile and leaderboard.",
    ticketCost: 10,
    acquired: false,
    type: "badge"
  },
  {
    id: "dark_theme",
    name: "Dark Mode Theme",
    description: "Unlock a sleek dark mode theme for the entire application.",
    ticketCost: 15,
    acquired: false,
    type: "theme"
  },
  {
    id: "advanced_metrics",
    name: "Advanced Metrics Pack",
    description: "Unlock additional advanced financial metrics and comparisons for all stocks.",
    ticketCost: 25,
    acquired: false,
    type: "unlock"
  },
  {
    id: "portfolio_simulator",
    name: "Portfolio Simulator",
    description: "Advanced tool to simulate different portfolio allocations and test strategies.",
    ticketCost: 40,
    acquired: false,
    type: "unlock"
  }
];

// Level progression system
export const LEVEL_REQUIREMENTS: LevelRequirement[] = [
  {
    level: 1,
    xpRequired: 0,
    rewards: {
      tickets: 0,
      description: "Starting level"
    }
  },
  {
    level: 2,
    xpRequired: 100,
    rewards: {
      tickets: 1,
      description: "Basic investor skills"
    }
  },
  {
    level: 3,
    xpRequired: 250,
    rewards: {
      tickets: 2,
      description: "Intermediate knowledge"
    }
  },
  {
    level: 4,
    xpRequired: 500,
    rewards: {
      tickets: 3,
      description: "Advanced understanding"
    }
  },
  {
    level: 5,
    xpRequired: 1000,
    rewards: {
      tickets: 5,
      description: "Expert analyst"
    }
  }
];