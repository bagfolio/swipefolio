// Define the detail types for each metric category
export interface PerformanceDetails {
  revenueGrowth: number;
  profitMargin: number;
  returnOnCapital: number;
  // Individual metric 1-liners
  revenueGrowthExplanation?: string;
  profitMarginExplanation?: string;
  returnOnCapitalExplanation?: string;
}

export interface StabilityDetails {
  volatility: number;
  beta: number;
  dividendConsistency: string;
  // Individual metric 1-liners
  volatilityExplanation?: string;
  betaExplanation?: string;
  dividendConsistencyExplanation?: string;
}

export interface ValueDetails {
  peRatio: number;
  pbRatio: number;
  dividendYield: number | string;
  predictedUpside?: number; // Added for consistency with advanced metric scoring
  // Individual metric 1-liners
  peRatioExplanation?: string;
  pbRatioExplanation?: string;
  dividendYieldExplanation?: string;
  predictedUpsideExplanation?: string;
}

export interface MomentumDetails {
  threeMonthReturn: number;
  relativePerformance: number;
  rsi: number;
  oneYearReturn?: number; // Added for consistency with advanced metric scoring
  oneYearReturnAvg?: number; // Added for consistency with industry averages
  // Individual metric 1-liners
  threeMonthReturnExplanation?: string;
  relativePerformanceExplanation?: string;
  rsiExplanation?: string;
  oneYearReturnExplanation?: string;
}

export interface PotentialDetails {
  predictedUpside?: number;
  revenueGrowth?: number;
  relativePerformance?: number;
  // Individual metric 1-liners
  predictedUpsideExplanation?: string;
  revenueGrowthExplanation?: string;
  relativePerformanceExplanation?: string;
}

export interface AnalystRecommendation {
  period: string;
  strongBuy: number;
  buy: number;
  hold: number;
  sell: number;
  strongSell: number;
  symbol: string;
}

export interface PriceTarget {
  targetHigh: number;
  targetLow: number;
  targetMean: number;
  targetMedian: number;
  lastUpdated: string;
}

export interface StockData {
  name: string;
  ticker: string;
  price: number;
  change: number;
  rating: number;
  smartScore?: string;
  description: string;
  oneYearReturn?: string; // 1-year return percentage (e.g., "13.27%")
  predictedPrice?: string; // Predicted future price (e.g., "$128.79")
  metrics: {
    performance: {
      value: string;
      color: string;
      details: PerformanceDetails;
      explanation: string;
    };
    stability: {
      value: string;
      color: string;
      details: StabilityDetails;
      explanation: string;
    };
    value: {
      value: string;
      color: string;
      details: ValueDetails;
      explanation: string;
    };
    momentum: {
      value: string;
      color: string;
      details: MomentumDetails;
      explanation: string;
    };
    potential?: {
      value: string;
      color: string;
      details: PotentialDetails;
      explanation: string;
    };
  };
  synopsis: {
    price: string;
    company: string;
    role: string;
  };
  overallAnalysis: string;
  chartData: number[];
  industry: string;
  recommendations?: AnalystRecommendation[];
  priceTarget?: PriceTarget;
}

const hardcodedStocks: Record<string, StockData[]> = {
  
  "ESG": [
    {
      name: "Tesla Inc",
      ticker: "TSLA",
      price: 263.55,
      change: 2.5, // Placeholder
      rating: 4.5, // Placeholder
      smartScore: "Poor", // Calculated Placeholder
      description: "Designs, develops, manufactures, leases, and sells electric vehicles, and energy generation and storage systems.",
      oneYearReturn: "48.34%",
      predictedPrice: "$358.70",
      metrics: {
        performance: {
          value: "Poor", // Score: 19
          color: "red",
          details: {
            revenueGrowth: 0.95,
            profitMargin: 7.30,
            returnOnCapital: 8.56,
            revenueGrowthExplanation: "Sales growth nearly stalled (+0.95%) – way slow for ESG expectations.",
            profitMarginExplanation: "Keeps 7.3¢ profit per $1 sold – kinda low.",
            returnOnCapitalExplanation: "Earns back 8.6% on investments – meh efficiency."
          },
          explanation: "Tesla's growth has hit the brakes, and profits/efficiency are weak compared to ESG averages."
        },
        stability: {
          value: "Poor", // Score: 2
          color: "red",
          details: {
            volatility: 61.3, // Using raw % value
            beta: 2.58,
            dividendConsistency: "N/A", // No dividend
            volatilityExplanation: "Super volatile (61.3%)! Expect HUGE swings daily.",
            betaExplanation: "Moves >2.5x the market (2.58 beta)! Extra wild.",
            dividendConsistencyExplanation: "Doesn't pay dividends."
          },
          explanation: "Tesla is EXTREMELY volatile and reacts massively to market shifts. No dividends."
        },
        value: {
          value: "Poor", // Score: 0 (Capped)
          color: "red",
          details: {
            peRatio: 129.3,
            pbRatio: 11.62,
            dividendYield: 0,
            peRatioExplanation: "Costs $129 per $1 profit (P/E) – insanely expensive!",
            pbRatioExplanation: "Stock price ~11.6x 'book value' (P/B) – sky-high.",
            dividendYieldExplanation: "Pays no dividend."
          },
          explanation: "Tesla costs a fortune relative to its profits and assets. You're paying purely for future hype."
        },
        momentum: {
          value: "Poor", // Score: 14
          color: "red",
          details: {
            threeMonthReturn: -42.99,
            relativePerformance: -35.4,
            rsi: 45.19,
            threeMonthReturnExplanation: "Down 43% recently – total collapse.",
            relativePerformanceExplanation: "Did WAY worse than the market index (-35.4%).",
            rsiExplanation: "Buying is super weak (RSI 45.2), very oversold."
          },
          explanation: "Tesla stock crashed hard recently, badly underperforming. Looks extremely weak and oversold."
        }
      },
      synopsis: { // Placeholder
        price: "Highly volatile, driven by EV sentiment and production numbers.",
        company: "Leader in electric vehicles, expanding into energy storage and AI.",
        role: "High-risk, high-reward growth stock tied to EV adoption."
      },
      overallAnalysis: "Tesla is the EV king but comes with extreme volatility and a very high price tag. Recent performance and momentum are poor.",
      chartData: [300, 290, 280, 270, 260, 250, 255, 260, 265, 270, 265, 263.55], // Placeholder
      industry: "ESG" // Mapped from Auto
    },
    {
      name: "NextEra Energy",
      ticker: "NEE",
      price: 70.45,
      change: 0.5, // Placeholder
      rating: 7.0, // Placeholder
      smartScore: "Good", // Calculated Placeholder
      description: "Electric power and energy infrastructure company, leader in renewable energy.",
      oneYearReturn: "14.68%",
      predictedPrice: "$86.00",
      metrics: {
        performance: {
          value: "Good", // Score: 79
          color: "green",
          details: {
            revenueGrowth: 26.91,
            profitMargin: 28.46,
            returnOnCapital: 5.65,
            revenueGrowthExplanation: "Sales grew 26.9% - super strong growth!",
            profitMarginExplanation: "Keeps 28.5¢ profit per $1 sold – very profitable for a utility!",
            returnOnCapitalExplanation: "Earns back 5.6% on investments – a bit low, expected for utilities."
          },
          explanation: "NextEra grows fast and is very profitable for a utility, though returns on big investments are modest."
        },
        stability: {
          value: "Good", // Score: 79
          color: "green",
          details: {
            volatility: 31.85,
            beta: 0.59,
            dividendConsistency: "High", // 1=High
            volatilityExplanation: "Above average volatility (31.8%) for a utility.",
            betaExplanation: "Moves way less than the market (0.59 beta) - very stable anchor!",
            dividendConsistencyExplanation: "Super reliable dividend payer."
          },
          explanation: "NextEra is way less reactive to market swings than most stocks and pays reliable dividends, though daily price swings are notable."
        },
        value: {
          value: "Average", // Score: 62
          color: "yellow",
          details: {
            peRatio: 20.88,
            pbRatio: 2.89,
            dividendYield: 3.0,
            peRatioExplanation: "Costs $20.88 per $1 profit (P/E) – slightly pricey for ESG.",
            pbRatioExplanation: "Stock price ~2.9x 'book value' (P/B) – fair value.",
            dividendYieldExplanation: "Pays a solid dividend (3.0%) - nice income!"
          },
          explanation: "NextEra is fairly valued, maybe a little pricey on earnings, but offers a great dividend yield for the ESG space."
        },
        momentum: {
          value: "Average", // Score: 57
          color: "yellow",
          details: {
            threeMonthReturn: -3.37,
            relativePerformance: 4.22,
            rsi: 48.14,
            threeMonthReturnExplanation: "Down 3.4% recently – small dip.",
            relativePerformanceExplanation: "Still beat the market index slightly (+4.2%)!",
            rsiExplanation: "Buying interest is neutral (RSI 48.1)."
          },
          explanation: "NextEra dipped slightly but still outperformed the market. Momentum is neutral right now."
        }
      },
      synopsis: { // Placeholder
        price: "Stable utility with strong renewable energy portfolio.",
        company: "Leading US utility investing heavily in wind and solar.",
        role: "Core ESG holding, provides defensive qualities and dividend growth."
      },
      overallAnalysis: "NextEra is a top renewable energy utility. It offers strong growth for its sector, great stability, and a solid dividend. A core ESG choice.",
      chartData: [75, 74, 73, 72, 71, 70, 71, 72, 70, 69, 70, 70.45], // Placeholder
      industry: "ESG" // Mapped from Utilities
    },
    // ... Add Brookfield Renewable (BEP) ...
    {
      name: "Brookfield Renewable",
      ticker: "BEP",
      price: 22.25,
      change: -0.1, // Placeholder
      rating: 4.0, // Placeholder
      smartScore: "Poor", // Calculated Placeholder
      description: "Owns and operates renewable power assets globally.",
      oneYearReturn: "-2.71%",
      predictedPrice: "$29.86",
      metrics: {
        performance: {
          value: "Poor", // Score: 28
          color: "red",
          details: {
            revenueGrowth: 20.29,
            profitMargin: -4.45, // Negative
            returnOnCapital: -0.75, // Negative
            revenueGrowthExplanation: "Sales grew 20.3% - strong growth!",
            profitMarginExplanation: "Loses 4.5¢ per $1 sold – currently unprofitable.",
            returnOnCapitalExplanation: "Losing money (-0.75%) on its investments."
          },
          explanation: "Brookfield Renewable is growing sales fast but losing money right now, making it inefficient financially."
        },
        stability: {
          value: "Poor", // Score: 30
          color: "red",
          details: {
            volatility: 46.8, // Using raw % value
            beta: 1.04,
            dividendConsistency: "High", // 1=High
            volatilityExplanation: "Very volatile (46.8%) - expect big swings.",
            betaExplanation: "Moves slightly more than the market (1.04 beta).",
            dividendConsistencyExplanation: "Reliable dividend payer, surprisingly."
          },
          explanation: "Brookfield stock is quite volatile and moves with the market, but it surprisingly pays reliable dividends despite losses."
        },
        value: {
          value: "Good", // Score: 86 (PE N/A, uses PB & Yield)
          color: "green",
          details: {
            peRatio: 9999, // N/A
            pbRatio: 1.76,
            dividendYield: 6.46,
            peRatioExplanation: "Losing money, so P/E doesn't apply.",
            pbRatioExplanation: "Stock price 1.76x 'book value' (P/B) – looks cheap on assets!",
            dividendYieldExplanation: "HUGE dividend (6.46%)! Massive income potential."
          },
          explanation: "Brookfield looks cheap based on its assets and pays a massive dividend, but it's currently unprofitable."
        },
        momentum: {
          value: "Average", // Score: 58
          color: "yellow",
          details: {
            threeMonthReturn: -4.67,
            relativePerformance: 2.92,
            rsi: 43.04,
            threeMonthReturnExplanation: "Down 4.7% recently – slight dip.",
            relativePerformanceExplanation: "Still managed to beat the market index (+2.9%).",
            rsiExplanation: "Buying interest is weak (RSI 43), getting oversold."
          },
          explanation: "Brookfield dipped recently but still beat the market. Buying momentum is weak."
        }
      },
      synopsis: { // Placeholder
        price: "Trading lower, high dividend yield attracts income investors.",
        company: "Globally diversified renewable power operator.",
        role: "High-yield ESG play, sensitive to interest rates."
      },
      overallAnalysis: "Brookfield Renewable offers exposure to global green energy and a huge dividend. However, it's currently unprofitable and volatile. High risk, high yield.",
      chartData: [24, 23.5, 23, 22.5, 22, 21.5, 22, 22.5, 23, 22.8, 22.5, 22.25], // Placeholder
      industry: "ESG" // Mapped from Utilities
    },
    // ... Add First Solar (FSLR) ...
    {
      name: "First Solar",
      ticker: "FSLR",
      price: 127.32,
      change: -2.5, // Placeholder
      rating: 4.8, // Placeholder
      smartScore: "Poor", // Calculated Placeholder
      description: "Designs, manufactures, and sells photovoltaic solar modules.",
      oneYearReturn: "-16.87%",
      predictedPrice: "$243.43",
      metrics: {
        performance: {
          value: "Good", // Score: 89
          color: "green",
          details: {
            revenueGrowth: 26.75,
            profitMargin: 30.72,
            returnOnCapital: 15.30,
            revenueGrowthExplanation: "Sales grew 26.7% - very strong!",
            profitMarginExplanation: "Keeps 30.7¢ profit per $1 sold – highly profitable!",
            returnOnCapitalExplanation: "Earns back 15.3% on investments – good efficiency!"
          },
          explanation: "First Solar shows fantastic growth, profits, and efficiency. Top-tier performance in the solar space."
        },
        stability: {
          value: "Poor", // Score: 12
          color: "red",
          details: {
            volatility: 69.84,
            beta: 1.49,
            dividendConsistency: "N/A", // 0=N/A
            volatilityExplanation: "Extremely volatile (69.8%) - massive swings!",
            betaExplanation: "Moves ~50% more than the market (1.49 beta).",
            dividendConsistencyExplanation: "Doesn't pay dividends."
          },
          explanation: "First Solar is super volatile and reactive to market changes. Don't expect dividends."
        },
        value: {
          value: "Good", // Score: 78
          color: "green",
          details: {
            peRatio: 10.60,
            pbRatio: 1.71,
            dividendYield: 0,
            peRatioExplanation: "Costs $10.60 per $1 profit (P/E) – super cheap for tech/ESG!",
            pbRatioExplanation: "Stock price 1.7x 'book value' (P/B) – looks very cheap!",
            dividendYieldExplanation: "Pays no dividend."
          },
          explanation: "First Solar looks surprisingly cheap based on profits and assets, a rare find for a high-performer. No dividend."
        },
        momentum: {
          value: "Poor", // Score: 1
          color: "red",
          details: {
            threeMonthReturn: -31.63,
            relativePerformance: -24.04,
            rsi: 37.79,
            threeMonthReturnExplanation: "Down 31.6% recently – collapsed.",
            relativePerformanceExplanation: "Way underperformed the market (-24%).",
            rsiExplanation: "Very weak buying (RSI 37.8), looks very oversold."
          },
          explanation: "First Solar stock crashed hard recently, badly underperforming. Looks extremely weak and oversold."
        }
      },
      synopsis: { // Placeholder
        price: "Under pressure due to solar industry volatility and competition.",
        company: "Leading US-based thin-film solar panel manufacturer.",
        role: "Cyclical growth stock tied to solar installations and policy."
      },
      overallAnalysis: "First Solar is a major US solar panel maker with strong performance, but the stock is incredibly volatile and momentum is terrible right now. Looks cheap, but very risky.",
      chartData: [150, 145, 140, 135, 130, 125, 128, 132, 130, 128, 126, 127.32], // Placeholder
      industry: "ESG" // Mapped from Solar
    },
    // ... Add Enphase Energy (ENPH) ...
     {
      name: "Enphase Energy",
      ticker: "ENPH",
      price: 61.65,
      change: -1.8, // Placeholder
      rating: 3.2, // Placeholder
      smartScore: "Poor", // Calculated Placeholder
      description: "Designs, develops, manufactures, and sells home energy solutions for the solar photovoltaic industry.",
      oneYearReturn: "-43.62%",
      predictedPrice: "$78.15",
      metrics: {
        performance: {
          value: "Poor", // Score: 8
          color: "red",
          details: {
            revenueGrowth: -41.92, // Negative Growth
            profitMargin: 7.72,
            returnOnCapital: 4.99,
            revenueGrowthExplanation: "Sales collapsed (-41.9%)! Big trouble.",
            profitMarginExplanation: "Keeps only 7.7¢ profit per $1 sold – weak profit.",
            returnOnCapitalExplanation: "Earns back only 5% on investments – low efficiency."
          },
          explanation: "Enphase's sales have plummeted, and profits/efficiency are low. Very poor recent performance."
        },
        stability: {
          value: "Poor", // Score: 9
          color: "red",
          details: {
            volatility: 53.26,
            beta: 1.98,
            dividendConsistency: "N/A", // 0=N/A
            volatilityExplanation: "Very volatile (53.3%) - big swings.",
            betaExplanation: "Moves almost twice the market (1.98 beta) - very reactive.",
            dividendConsistencyExplanation: "Doesn't pay dividends."
          },
          explanation: "Enphase stock is very volatile and reacts strongly to market news. No dividend income."
        },
        value: {
          value: "Poor", // Score: 10
          color: "red",
          details: {
            peRatio: 83.51,
            pbRatio: 9.80,
            dividendYield: 0,
            peRatioExplanation: "Costs $83.51 per $1 profit (P/E) – extremely expensive!",
            pbRatioExplanation: "Stock price ~10x 'book value' (P/B) – very high expectations.",
            dividendYieldExplanation: "Pays no dividend."
          },
          explanation: "Enphase is priced very expensively, likely based on past growth, despite current struggles. No dividend."
        },
        momentum: {
          value: "Average", // Score: 46
          color: "yellow",
          details: {
            threeMonthReturn: -15.87,
            relativePerformance: -8.28,
            rsi: 50.12,
            threeMonthReturnExplanation: "Down 15.9% recently – sharp drop.",
            relativePerformanceExplanation: "Also underperformed the market (-8.3%).",
            rsiExplanation: "Perfectly neutral buying interest (RSI 50.1)."
          },
          explanation: "Enphase stock dropped sharply, lagging the market. Buying momentum is totally flat right now."
        }
      },
      synopsis: { // Placeholder
        price: "Struggling near lows amid solar installation slowdown.",
        company: "Microinverter leader facing inventory issues and weaker demand.",
        role: "Volatile solar stock, sensitive to interest rates and consumer spending."
      },
      overallAnalysis: "Enphase, a leader in solar microinverters, is facing a major sales downturn and inventory problems. The stock is volatile, expensive, and performing poorly.",
      chartData: [75, 70, 68, 65, 63, 60, 62, 64, 63, 61, 60, 61.65], // Placeholder
      industry: "ESG" // Mapped from Solar
    },
    // ... Add SolarEdge (SEDG) ...
    {
      name: "SolarEdge Tech.",
      ticker: "SEDG",
      price: 15.85,
      change: 0.2, // Placeholder
      rating: 1.2, // Placeholder
      smartScore: "Underperform", // Calculated Placeholder
      description: "Designs, develops, and sells direct current (DC) optimized inverter systems for solar PV installations.",
      oneYearReturn: "-75.01%",
      predictedPrice: "$17.33",
      metrics: {
        performance: {
          value: "Poor", // Score: 0 (Capped)
          color: "red",
          details: {
            revenueGrowth: -68.86, // Negative
            profitMargin: -192.13, // Negative
            returnOnCapital: -168.40, // Negative
            revenueGrowthExplanation: "Sales crashed (-68.9%)! Disaster zone.",
            profitMarginExplanation: "Losing almost $2 for every $1 sold! Burning cash intensely.",
            returnOnCapitalExplanation: "Massive negative return (-168%) on investments."
          },
          explanation: "SolarEdge is in deep trouble. Sales collapsed, and it's losing huge amounts of money."
        },
        stability: {
          value: "Poor", // Score: 16
          color: "red",
          details: {
            volatility: 66.0, // Using raw % value
            beta: 1.66,
            dividendConsistency: "N/A", // 0=N/A
            volatilityExplanation: "Extremely volatile (66%) - huge swings.",
            betaExplanation: "Moves ~66% more than the market (1.66 beta).",
            dividendConsistencyExplanation: "Doesn't pay dividends."
          },
          explanation: "SolarEdge stock is extremely volatile and reactive. No dividends here."
        },
        value: {
          value: "Poor", // Score: 42 (PE N/A, uses PB & Yield)
          color: "red",
          details: {
            peRatio: 9999, // N/A
            pbRatio: 1.40,
            dividendYield: 0,
            peRatioExplanation: "Losing money, P/E doesn't apply.",
            pbRatioExplanation: "Stock price 1.4x 'book value' (P/B) – looks cheap on assets!",
            dividendYieldExplanation: "Pays no dividend."
          },
          explanation: "SolarEdge isn't profitable. Looks cheap based on assets (low P/B), likely reflecting its major problems."
        },
        momentum: {
          value: "Average", // Score: 67
          color: "yellow",
          details: {
            threeMonthReturn: 6.88,
            relativePerformance: 14.47,
            rsi: 46.76,
            threeMonthReturnExplanation: "Up 6.9% recently – small bounce?",
            relativePerformanceExplanation: "Still managed to beat the market index (+14.5%) lately!",
            rsiExplanation: "Buying interest is average (RSI 46.8)."
          },
          explanation: "SolarEdge bounced a bit recently, beating the market, but overall trend is terrible. Momentum is neutral."
        }
      },
      synopsis: { // Placeholder
        price: "Deeply depressed stock price, trying to stabilize.",
        company: "Solar inverter company hit hard by industry slowdown.",
        role: "Extremely speculative turnaround bet in the solar sector."
      },
      overallAnalysis: "SolarEdge is another solar company facing a severe downturn, with collapsing sales and massive losses. Extremely volatile and risky.",
      chartData: [20, 18, 16, 15, 14, 13, 14, 15, 16, 17, 16, 15.85], // Placeholder
      industry: "ESG" // Mapped from Solar
    },
     // --- Add Plug Power (PLUG) ---
    {
      name: "Plug Power",
      ticker: "PLUG",
      price: 1.34,
      change: -0.1, // Placeholder
      rating: 0.8, // Placeholder
      smartScore: "Underperform", // Calculated Placeholder
      description: "Provides hydrogen fuel cell turnkey solutions.",
      oneYearReturn: "-58.39%",
      predictedPrice: "$2.23",
      metrics: {
        performance: {
          value: "Poor", // Score: 0 (Capped)
          color: "red",
          details: {
            revenueGrowth: -29.45, // Negative
            profitMargin: -334.71, // Negative
            returnOnCapital: -81.38, // Negative
            revenueGrowthExplanation: "Sales dropped 29.5% - bad sign.",
            profitMarginExplanation: "Losing over $3 for every $1 sold!! Burning cash extremely fast.",
            returnOnCapitalExplanation: "Huge negative return (-81%) on investments."
          },
          explanation: "Plug Power's sales are falling, and it's losing enormous amounts of money. Dire financial performance."
        },
        stability: {
          value: "Poor", // Score: 5
          color: "red",
          details: {
            volatility: 78.3, // Using raw % value
            beta: 2.06,
            dividendConsistency: "N/A", // 0=N/A
            volatilityExplanation: "Insanely volatile (78.3%) - wild west stock!",
            betaExplanation: "Moves more than twice the market (2.06 beta)!",
            dividendConsistencyExplanation: "Doesn't pay dividends."
          },
          explanation: "Plug Power is about as volatile and market-sensitive as it gets. Extremely risky, no dividend."
        },
        value: {
          value: "Poor", // Score: 50 (PE N/A, uses PB & Yield)
          color: "red",
          details: {
            peRatio: 9999, // N/A
            pbRatio: 0.71,
            dividendYield: 0,
            peRatioExplanation: "No profits, P/E doesn't apply.",
            pbRatioExplanation: "Stock price below 'book value' (0.71 P/B) – looks super cheap on assets!",
            dividendYieldExplanation: "Pays no dividend."
          },
          explanation: "Plug Power isn't profitable. The stock trades for less than its assets are worth, likely due to its massive losses."
        },
        momentum: {
          value: "Poor", // Score: 0 (Capped)
          color: "red",
          details: {
            threeMonthReturn: -44.63,
            relativePerformance: -37.04,
            rsi: 29.48,
            threeMonthReturnExplanation: "Down 44.6% recently – collapsed further.",
            relativePerformanceExplanation: "Way underperformed the market (-37%).",
            rsiExplanation: "Extremely weak buying (RSI 29.5), deeply oversold."
          },
          explanation: "Plug Power stock continued its crash, badly lagging the market. Looks extremely weak and oversold."
        }
      },
      synopsis: { // Placeholder
        price: "Penny stock territory, facing existential financial challenges.",
        company: "Hydrogen fuel cell company struggling with costs and profitability.",
        role: "Highly speculative, high-risk bet on hydrogen economy adoption."
      },
      overallAnalysis: "Plug Power is a hydrogen fuel cell company burning through cash with massive losses and falling sales. Extremely volatile and risky 'penny stock'.",
      chartData: [2.5, 2.2, 2.0, 1.8, 1.6, 1.5, 1.4, 1.3, 1.2, 1.4, 1.3, 1.34], // Placeholder
      industry: "ESG" // Mapped from Electrical Equip.
    },
    // --- Add ChargePoint (CHPT) ---
    {
      name: "ChargePoint",
      ticker: "CHPT",
      price: 0.62,
      change: -0.05, // Placeholder
      rating: 1.0, // Placeholder
      smartScore: "Underperform", // Calculated Placeholder
      description: "Provides electric vehicle (EV) charging networks and solutions.",
      oneYearReturn: "-64.45%",
      predictedPrice: "$1.36",
      metrics: {
        performance: {
          value: "Poor", // Score: 0 (Capped)
          color: "red",
          details: {
            revenueGrowth: -17.68, // Negative
            profitMargin: -67.83, // Negative
            returnOnCapital: -63.25, // Negative
            revenueGrowthExplanation: "Sales dropped 17.7% - going backwards.",
            profitMarginExplanation: "Losing 68¢ per $1 sold – significant losses.",
            returnOnCapitalExplanation: "Massive negative return (-63%) on investments."
          },
          explanation: "ChargePoint's sales are falling, and it's losing a lot of money. Very poor financial performance."
        },
        stability: {
          value: "Poor", // Score: 5
          color: "red",
          details: {
            volatility: 80.0, // Estimated raw value
            beta: 2.04,
            dividendConsistency: "N/A", // 0=N/A
            volatilityExplanation: "Dangerously volatile (~80%) - extreme swings!",
            betaExplanation: "Moves more than twice the market (2.04 beta)!",
            dividendConsistencyExplanation: "Doesn't pay dividends."
          },
          explanation: "ChargePoint is extremely volatile and reactive to market trends. High risk, no dividends."
        },
        value: {
          value: "Poor", // Score: 37 (PE N/A, uses PB & Yield)
          color: "red",
          details: {
            peRatio: 9999, // N/A
            pbRatio: 2.14,
            dividendYield: 0,
            peRatioExplanation: "No profits, P/E doesn't apply.",
            pbRatioExplanation: "Stock price ~2.1x 'book value' (P/B) – maybe fair based on assets?",
            dividendYieldExplanation: "Pays no dividend."
          },
          explanation: "ChargePoint isn't profitable. It looks somewhat reasonably priced based on assets, but the losses are huge."
        },
        momentum: {
          value: "Poor", // Score: 3
          color: "red",
          details: {
            threeMonthReturn: -46.68,
            relativePerformance: -39.09,
            rsi: 37.84,
            threeMonthReturnExplanation: "Down 46.7% recently – another collapse.",
            relativePerformanceExplanation: "Way underperformed the market (-39.1%).",
            rsiExplanation: "Very weak buying (RSI 37.8), looks very oversold."
          },
          explanation: "ChargePoint stock collapsed again, badly lagging the market. Looks extremely weak and oversold."
        }
      },
      synopsis: { // Placeholder
        price: "Deeply distressed stock price, facing EV charging competition.",
        company: "EV charging network provider struggling with profitability.",
        role: "Highly speculative bet on EV infrastructure growth."
      },
      overallAnalysis: "ChargePoint operates EV charging stations, a growing market, but faces intense competition and significant losses. Very high risk, poor performance.",
      chartData: [1.5, 1.3, 1.1, 0.9, 0.8, 0.7, 0.6, 0.5, 0.7, 0.65, 0.6, 0.62], // Placeholder
      industry: "ESG" // Mapped from Specialty Retail
    },
    // --- Add Hannon Armstrong (HASI) ---
    {
      name: "Hannon Armstrong",
      ticker: "HASI",
      price: 29.44,
      change: 0.8, // Placeholder
      rating: 6.8, // Placeholder
      smartScore: "Good", // Calculated Placeholder
      description: "Invests in climate solutions, providing capital to companies in energy efficiency, renewable energy, and sustainable infrastructure.",
      oneYearReturn: "10.14%",
      predictedPrice: "$39.25",
      metrics: {
        performance: {
          value: "Good", // Score: 81
          color: "green",
          details: {
            revenueGrowth: 19.92,
            profitMargin: 51.63,
            returnOnCapital: 2.96,
            revenueGrowthExplanation: "Sales grew 19.9% - strong growth!",
            profitMarginExplanation: "Keeps 51.6¢ profit per $1 sold – very profitable!",
            returnOnCapitalExplanation: "Earns back only 3% on investments – low efficiency."
          },
          explanation: "Hannon Armstrong is growing fast and is highly profitable, but doesn't get great returns on its investments yet."
        },
        stability: {
          value: "Poor", // Score: 15
          color: "red",
          details: {
            volatility: 45.9, // Using raw % value
            beta: 1.86,
            dividendConsistency: "High", // 1=High
            volatilityExplanation: "Very volatile (45.9%) - big swings.",
            betaExplanation: "Moves almost twice the market (1.86 beta) - reactive.",
            dividendConsistencyExplanation: "Reliable dividend payer."
          },
          explanation: "Hannon Armstrong is volatile and market-sensitive, but it does pay reliable dividends."
        },
        value: {
          value: "Good", // Score: 75
          color: "green",
          details: {
            peRatio: 19.01,
            pbRatio: 1.50,
            dividendYield: 5.64,
            peRatioExplanation: "Costs $19 per $1 profit (P/E) – looks fairly priced.",
            pbRatioExplanation: "Stock price 1.5x 'book value' (P/B) – looks cheap on assets!",
            dividendYieldExplanation: "HUGE dividend (5.64%)! Great income."
          },
          explanation: "Hannon Armstrong seems fairly priced to cheap, and offers a very attractive dividend yield."
        },
        momentum: {
          value: "Good", // Score: 72
          color: "green",
          details: {
            threeMonthReturn: 6.20,
            relativePerformance: 13.79,
            rsi: 54.99,
            threeMonthReturnExplanation: "Up 6.2% recently – solid gain.",
            relativePerformanceExplanation: "Beat the market index nicely (+13.8%)!",
            rsiExplanation: "Decent buying interest (RSI 55), balanced momentum."
          },
          explanation: "Hannon Armstrong stock has solid momentum, gaining nicely and beating the market recently."
        }
      },
      synopsis: { // Placeholder
        price: "Gaining momentum, benefiting from renewable energy investments.",
        company: "Finances sustainable infrastructure projects.",
        role: "ESG investment with focus on climate solutions and income."
      },
      overallAnalysis: "Hannon Armstrong invests in green projects and offers a hefty dividend. Growth and profitability are strong, but efficiency and stability are low. Looks reasonably valued with good momentum.",
      chartData: [25, 26, 27, 28, 29, 30, 29.5, 29, 28.5, 29, 29.5, 29.44], // Placeholder
      industry: "ESG" // Mapped from REIT/Infra
    },
     // --- Add AES Corp (AES) ---
    {
      name: "AES Corp",
      ticker: "AES",
      price: 12.41,
      change: -0.2, // Placeholder
      rating: 4.3, // Placeholder
      smartScore: "Average", // Calculated Placeholder
      description: "A diversified power generation and utility company.",
      oneYearReturn: "-25.42%",
      predictedPrice: "$14.60",
      metrics: {
        performance: {
          value: "Poor", // Score: 36
          color: "red",
          details: {
            revenueGrowth: -3.14, // Negative
            profitMargin: 13.78,
            returnOnCapital: 5.56,
            revenueGrowthExplanation: "Sales shrank 3.1% - slipping backwards.",
            profitMarginExplanation: "Keeps 13.8¢ profit per $1 sold – okay margin.",
            returnOnCapitalExplanation: "Earns back 5.6% on investments – low efficiency."
          },
          explanation: "AES Corp's sales are falling, and while margins are okay, its efficiency is low. Weak performance."
        },
        stability: {
          value: "Good", // Score: 80
          color: "green",
          details: {
            volatility: 45.08, // Using raw % value
            beta: 0.82,
            dividendConsistency: "High", // 1=High
            volatilityExplanation: "Very volatile (45.1%) for a utility!",
            betaExplanation: "Moves less than the market (0.82 beta) - relatively stable.",
            dividendConsistencyExplanation: "Reliable dividend payer."
          },
          explanation: "AES Corp is surprisingly volatile day-to-day for a utility, but overall less reactive to market trends. Pays reliable dividends."
        },
        value: {
          value: "Poor", // Score: 38
          color: "red",
          details: {
            peRatio: 37.79,
            pbRatio: 2.42,
            dividendYield: 5.59,
            peRatioExplanation: "Costs $37.79 per $1 profit (P/E) – very expensive!",
            pbRatioExplanation: "Stock price ~2.4x 'book value' (P/B) – seems fair.",
            dividendYieldExplanation: "HUGE dividend (5.6%)! Great income source."
          },
          explanation: "AES Corp looks very expensive based on earnings, but fairly valued on assets. Its huge dividend is the main appeal."
        },
        momentum: {
          value: "Good", // Score: 72
          color: "green",
          details: {
            threeMonthReturn: -4.69,
            relativePerformance: 2.90,
            rsi: 56.02,
            threeMonthReturnExplanation: "Down 4.7% recently – slight dip.",
            relativePerformanceExplanation: "Still beat the market index slightly (+2.9%).",
            rsiExplanation: "Good buying interest (RSI 56), solid momentum."
          },
          explanation: "AES stock dipped recently but still edged out the market. Momentum looks decent right now."
        }
      },
      synopsis: { // Placeholder
        price: "Utility stock offering high yield, navigating energy transition.",
        company: "Global power company shifting towards renewable energy sources.",
        role: "High-dividend utility stock with exposure to energy transition."
      },
      overallAnalysis: "AES is a utility company offering a very high dividend. Performance is weak and it's expensive, but stability is good and momentum is picking up. Primarily an income play.",
      chartData: [14, 13.5, 13, 12.5, 12, 11.8, 12.0, 12.2, 12.5, 12.3, 12.2, 12.41], // Placeholder
      industry: "ESG" // Mapped from Utilities
    }
  ],

  "Healthcare": [
      {
        name: "Medtronic plc",
        ticker: "MDT",
        price: 87.63,
        change: 0.3, // Placeholder
        rating: 6.5, // Placeholder
        smartScore: "Neutral", // Calculated Placeholder
        description: "Develops, manufactures, distributes, and sells device-based medical therapies and services worldwide.",
        oneYearReturn: "4.70%",
        predictedPrice: "$95.48",
        metrics: {
          performance: {
            value: "Poor", // Score: 23
            color: "red",
            details: {
              revenueGrowth: 2.72,
              profitMargin: 12.83,
              returnOnCapital: 5.81,
              revenueGrowthExplanation: "Sales grew only 2.7% - very slow for MedTech.",
              profitMarginExplanation: "Keeps 12.8¢ profit per $1 sold – way below average.",
              returnOnCapitalExplanation: "Earns back only 5.8% on investments – inefficient."
            },
            explanation: "Medtronic's growth, profitability, and efficiency are all lagging behind MedTech industry averages."
          },
          stability: {
            value: "Good", // Score: 85
            color: "green",
            details: {
              volatility: 21.96, // Using raw % value
              beta: 0.83,
              dividendConsistency: "High", // 1=High
              volatilityExplanation: "Low volatility (22%) for a healthcare stock - quite stable!",
              betaExplanation: "Moves less than the market (0.83 beta) - defensive.",
              dividendConsistencyExplanation: "Super reliable dividend payer."
            },
            explanation: "Medtronic is a very stable stock, less volatile than peers and the market, with great dividend consistency."
          },
          value: {
            value: "Average", // Score: 68
            color: "yellow",
            details: {
              peRatio: 26.63,
              pbRatio: 2.28,
              dividendYield: 3.20,
              peRatioExplanation: "Costs $26.63 per $1 profit (P/E) – right around average.",
              pbRatioExplanation: "Stock price 2.3x 'book value' (P/B) – looks cheap!",
              dividendYieldExplanation: "Pays a solid dividend (3.2%) - good income!"
            },
            explanation: "Medtronic seems fairly valued to cheap, especially based on assets, and offers a strong dividend."
          },
          momentum: {
            value: "Average", // Score: 47
            color: "yellow",
            details: {
              threeMonthReturn: 7.47,
              relativePerformance: -2.40,
              rsi: 37.30,
              threeMonthReturnExplanation: "Up 7.5% recently – nice gain!",
              relativePerformanceExplanation: "But still lagged the market index (-2.4%).",
              rsiExplanation: "Buying interest is very weak (RSI 37.3), looks oversold."
            },
            explanation: "Medtronic bounced recently but still underperformed the market. Looks weak and potentially oversold."
          }
        },
        synopsis: { // Placeholder
          price: "Stable medical device giant, slower growth but reliable.",
          company: "Diversified medical technology leader across multiple therapy areas.",
          role: "Core defensive healthcare holding with strong dividend history."
        },
        overallAnalysis: "Medtronic is a large, stable medical device company. Performance is sluggish, but it's very stable, looks reasonably valued, and pays a great dividend.",
        chartData: [80, 82, 84, 86, 88, 87, 85, 86, 87, 88, 87, 87.63], // Placeholder
        industry: "Healthcare" // Mapped from Medical Devices
      },
      {
        name: "Stryker Corp",
        ticker: "SYK",
        price: 364.50,
        change: 1.8, // Placeholder
        rating: 6.8, // Placeholder
        smartScore: "Neutral", // Calculated Placeholder
        description: "Operates as a medical technology company.",
        oneYearReturn: "4.03%",
        predictedPrice: "$430.00",
        metrics: {
          performance: {
            value: "Poor", // Score: 30
            color: "red",
            details: {
              revenueGrowth: 10.23,
              profitMargin: 13.25,
              returnOnCapital: 9.01,
              revenueGrowthExplanation: "Sales grew 10.2% - below the MedTech average.",
              profitMarginExplanation: "Keeps 13.2¢ profit per $1 sold – quite low.",
              returnOnCapitalExplanation: "Earns back 9% on investments – also below average."
            },
            explanation: "Stryker's growth, profitability, and efficiency are all below average for the MedTech industry."
          },
          stability: {
            value: "Good", // Score: 81
            color: "green",
            details: {
              volatility: 20.0, // Using raw % value
              beta: 0.95,
              dividendConsistency: "High", // 1=High
              volatilityExplanation: "Low volatility (20%) - very stable!",
              betaExplanation: "Moves slightly less than the market (0.95 beta).",
              dividendConsistencyExplanation: "Super reliable dividend payer."
            },
            explanation: "Stryker is a very stable stock with low volatility and reliable dividends."
          },
          value: {
            value: "Poor", // Score: 16
            color: "red",
            details: {
              peRatio: 46.95,
              pbRatio: 6.74,
              dividendYield: 0.67,
              peRatioExplanation: "Costs $47 per $1 profit (P/E) – very expensive!",
              pbRatioExplanation: "Stock price ~6.7x 'book value' (P/B) – also quite high.",
              dividendYieldExplanation: "Pays a small dividend (0.67%) - right at average."
            },
            explanation: "Stryker looks very expensive based on earnings and assets. Dividend is average for the sector."
          },
          momentum: {
            value: "Average", // Score: 49
            color: "yellow",
            details: {
              threeMonthReturn: -1.69,
              relativePerformance: 5.90,
              rsi: 37.57,
              threeMonthReturnExplanation: "Down 1.7% recently – slightly down.",
              relativePerformanceExplanation: "Still beat the market index (+5.9%) though!",
              rsiExplanation: "Buying interest is weak (RSI 37.6), looks oversold."
            },
            explanation: "Stryker dipped slightly but still beat the market. Looks weak and potentially oversold."
          }
        },
        synopsis: { // Placeholder
          price: "Consolidating, focus on orthopedic and surgical tech recovery.",
          company: "Leader in orthopedics, medical/surgical equipment, and neurotechnology.",
          role: "Quality medical device stock, less volatile than some peers."
        },
        overallAnalysis: "Stryker is a major player in medical devices, especially orthopedics. Performance is lagging, stability is good, but it's very expensive. Momentum is weak.",
        chartData: [370, 368, 365, 363, 360, 362, 364, 366, 365, 363, 364, 364.50], // Placeholder
        industry: "Healthcare" // Mapped from Medical Devices
      },
       // ... Add Boston Scientific (BSX) ...
      {
        name: "Boston Scientific",
        ticker: "BSX",
        price: 99.36,
        change: 1.2, // Placeholder
        rating: 7.2, // Placeholder
        smartScore: "Outperform", // Calculated Placeholder
        description: "Develops, manufactures, and markets medical devices for use in various interventional medical specialties worldwide.",
        oneYearReturn: "46.25%",
        predictedPrice: "$119.14",
        metrics: {
          performance: {
            value: "Average", // Score: 44
            color: "yellow",
            details: {
              revenueGrowth: 17.60,
              profitMargin: 11.07,
              returnOnCapital: 5.95,
              revenueGrowthExplanation: "Sales grew 17.6% - faster than average!",
              profitMarginExplanation: "Keeps 11¢ profit per $1 sold – very low for MedTech.",
              returnOnCapitalExplanation: "Earns back only 6% on investments – inefficient."
            },
            explanation: "Boston Scientific has strong sales growth, but its profitability and efficiency are weak points."
          },
          stability: {
            value: "Good", // Score: 87
            color: "green",
            details: {
              volatility: 25.0, // Using raw % value
              beta: 0.74,
              dividendConsistency: "N/A", // 0=N/A
              volatilityExplanation: "Average volatility (25.0%).",
              betaExplanation: "Moves much less than the market (0.74 beta) - nice stability!",
              dividendConsistencyExplanation: "Doesn't pay dividends."
            },
            explanation: "Boston Scientific offers good stability, moving less than the market, but pays no dividends."
          },
          value: {
            value: "Poor", // Score: 6
            color: "red",
            details: {
              peRatio: 79.65,
              pbRatio: 6.73,
              dividendYield: 0,
              peRatioExplanation: "Costs $79.65 per $1 profit (P/E) – extremely expensive!",
              pbRatioExplanation: "Stock price ~6.7x 'book value' (P/B) – very high.",
              dividendYieldExplanation: "Pays no dividend."
            },
            explanation: "Boston Scientific is priced very high relative to its earnings and assets. A pure growth bet, no income."
          },
          momentum: {
            value: "Good", // Score: 78
            color: "green",
            details: {
              threeMonthReturn: 9.10,
              relativePerformance: 16.69,
              rsi: 45.98,
              threeMonthReturnExplanation: "Up 9.1% recently – strong gain!",
              relativePerformanceExplanation: "Crushed the market index (+16.7%)!",
              rsiExplanation: "Buying interest is okay (RSI 46), slightly weak side."
            },
            explanation: "Boston Scientific stock showed strong gains recently, beating the market. Buying momentum is okay."
          }
        },
        synopsis: { // Placeholder
          price: "Strong performer, driven by new product cycles and acquisitions.",
          company: "Diversified medical device company with leadership in cardiology and endoscopy.",
          role: "Growth-focused medical device stock with solid momentum."
        },
        overallAnalysis: "Boston Scientific is growing fast and the stock has momentum. It's stable but very expensive and doesn't pay dividends. Weak profitability is a concern.",
        chartData: [90, 92, 94, 96, 98, 100, 99, 98, 97, 99, 100, 99.36], // Placeholder
        industry: "Healthcare" // Mapped from Medical Devices
      },
      // ... Add Abbott Labs (ABT) ...
      {
        name: "Abbott Labs",
        ticker: "ABT",
        price: 130.82,
        change: 0.9, // Placeholder
        rating: 7.5, // Placeholder
        smartScore: "Outperform", // Calculated Placeholder
        description: "Discovers, develops, manufactures, and sells health care products worldwide.",
        oneYearReturn: "17.33%",
        predictedPrice: "$138.14",
        metrics: {
          performance: {
            value: "Good", // Score: 75
            color: "green",
            details: {
              revenueGrowth: 4.59,
              profitMargin: 31.83, // High Profit Margin
              returnOnCapital: 21.82, // High ROC
              revenueGrowthExplanation: "Sales grew 4.6% - a bit slow.",
              profitMarginExplanation: "Keeps 31.8¢ profit per $1 sold – extremely profitable!",
              returnOnCapitalExplanation: "Earns back 21.8% on investments – very efficient!"
            },
            explanation: "Abbott Labs has slow growth but makes HUGE profits and uses its money very efficiently."
          },
          stability: {
            value: "Good", // Score: 85
            color: "green",
            details: {
              volatility: 23.0, // Using raw % value
              beta: 0.81,
              dividendConsistency: "High", // 1=High
              volatilityExplanation: "Low volatility (23%) - nice and stable.",
              betaExplanation: "Moves less than the market (0.81 beta) - defensive.",
              dividendConsistencyExplanation: "Super reliable dividend payer."
            },
            explanation: "Abbott Labs is a very stable stock with low volatility and great dividend consistency."
          },
          value: {
            value: "Good", // Score: 75
            color: "green",
            details: {
              peRatio: 17.07,
              pbRatio: 4.75,
              dividendYield: 1.71,
              peRatioExplanation: "Costs $17 per $1 profit (P/E) – looks cheap!",
              pbRatioExplanation: "Stock price ~4.75x 'book value' (P/B) – slightly high.",
              dividendYieldExplanation: "Pays a decent dividend (1.71%)."
            },
            explanation: "Abbott Labs looks cheap based on profits and pays a decent dividend. Good value."
          },
          momentum: {
            value: "Good", // Score: 85
            color: "green",
            details: {
              threeMonthReturn: 13.99,
              relativePerformance: 21.58,
              rsi: 52.64,
              threeMonthReturnExplanation: "Up 14% recently – strong performance!",
              relativePerformanceExplanation: "Crushed the market index (+21.6%)!",
              rsiExplanation: "Good buying interest (RSI 52.6), balanced."
            },
            explanation: "Abbott Labs stock has been strong lately, easily beating the market. Momentum looks solid."
          }
        },
        synopsis: { // Placeholder
          price: "Steady performer, driven by diagnostics and medical devices.",
          company: "Diversified healthcare giant with strong positions in diagnostics, devices, nutrition, and pharma.",
          role: "Blue-chip healthcare stock, considered defensive with growth."
        },
        overallAnalysis: "Abbott Labs is a diversified healthcare leader. It's highly profitable, efficient, stable, and looks cheap, with solid momentum. Strong all-around profile.",
        chartData: [120, 122, 125, 128, 130, 132, 131, 130, 129, 131, 132, 130.82], // Placeholder
        industry: "Healthcare" // Mapped from Medical Devices
      },
      // ... Add Intuitive Surgical (ISRG) ...
      {
        name: "Intuitive Surgical",
        ticker: "ISRG",
        price: 491.84,
        change: 5.2, // Placeholder
        rating: 7.0, // Placeholder
        smartScore: "Neutral", // Calculated Placeholder
        description: "Develops, manufactures, and markets robotic products designed to improve clinical outcomes of patients through minimally invasive surgery.",
        oneYearReturn: "23.69%",
        predictedPrice: "$631.96", // High target
        metrics: {
          performance: {
            value: "Good", // Score: 77
            color: "green",
            details: {
              revenueGrowth: 17.24,
              profitMargin: 27.81,
              returnOnCapital: 14.04,
              revenueGrowthExplanation: "Sales grew 17.2% - faster than average!",
              profitMarginExplanation: "Keeps 27.8¢ profit per $1 sold – very profitable!",
              returnOnCapitalExplanation: "Earns back 14% on investments – good efficiency."
            },
            explanation: "Intuitive Surgical shows strong growth, high profits, and good efficiency, driven by its robotic surgery systems."
          },
          stability: {
            value: "Poor", // Score: 20
            color: "red",
            details: {
              volatility: 30.0, // Using raw % value
              beta: 1.55,
              dividendConsistency: "N/A", // 0=N/A
              volatilityExplanation: "High volatility (30.0%).",
              betaExplanation: "Moves ~55% more than the market (1.55 beta) - reactive.",
              dividendConsistencyExplanation: "Doesn't pay dividends."
            },
            explanation: "Intuitive Surgical stock is volatile and reacts strongly to market shifts. No dividend income."
          },
          value: {
            value: "Poor", // Score: 4
            color: "red",
            details: {
              peRatio: 76.69,
              pbRatio: 10.67,
              dividendYield: 0,
              peRatioExplanation: "Costs $76.69 per $1 profit (P/E) – extremely expensive!",
              pbRatioExplanation: "Stock price ~10.7x 'book value' (P/B) – sky-high!",
              dividendYieldExplanation: "Pays no dividend."
            },
            explanation: "Intuitive Surgical is very expensive, reflecting its dominance in robotic surgery. Pure growth play."
          },
          momentum: {
            value: "Poor", // Score: 34
            color: "red",
            details: {
              threeMonthReturn: -8.41,
              relativePerformance: -0.82,
              rsi: 50, // Placeholder for N/A RSI
              threeMonthReturnExplanation: "Down 8.4% recently – pulled back.",
              relativePerformanceExplanation: "Slightly lagged the market index (-0.8%).",
              rsiExplanation: "Buying interest is perfectly neutral (RSI 50)."
            },
            explanation: "Intuitive Surgical stock dropped recently, lagging the market slightly. Momentum is currently neutral."
          }
        },
        synopsis: { // Placeholder
          price: "High-growth stock, leader in robotic-assisted surgery.",
          company: "Dominates the surgical robotics market with da Vinci systems.",
          role: "Premium growth stock in medical technology."
        },
        overallAnalysis: "Intuitive Surgical leads the robotic surgery market with strong growth and profits. However, it's very expensive and volatile.",
        chartData: [500, 490, 480, 470, 485, 495, 500, 495, 490, 488, 492, 491.84], // Placeholder
        industry: "Healthcare" // Mapped from Medical Instruments
      },
        // ... Add Edwards Lifesciences (EW) ...
      {
        name: "Edwards LifeSci.",
        ticker: "EW",
        price: 70.91,
        change: -0.5, // Placeholder
        rating: 4.1, // Placeholder
        smartScore: "Poor", // Calculated Placeholder
        description: "Provides products and technologies for structural heart disease, and critical care and surgical monitoring.",
        oneYearReturn: "-24.10%",
        predictedPrice: "$79.51",
        metrics: {
          performance: {
            value: "Poor", // Score: 28
            color: "red",
            details: {
              revenueGrowth: -4.67, // Negative
              profitMargin: 25.63, // High margin
              returnOnCapital: 13.75, // Good ROC
              revenueGrowthExplanation: "Sales shrank (-4.7%) - falling behind.",
              profitMarginExplanation: "Keeps 25.6¢ profit per $1 sold – very profitable!",
              returnOnCapitalExplanation: "Earns back 13.75% on investments – good efficiency!"
            },
            explanation: "Edwards LifeSci's sales are dropping, but it remains highly profitable and efficient."
          },
          stability: {
            value: "Poor", // Score: 34
            color: "red",
            details: {
              volatility: 49.31, // Using raw % value
              beta: 1.17,
              dividendConsistency: "N/A", // 0=N/A
              volatilityExplanation: "Very volatile (49.3%) - big swings.",
              betaExplanation: "Moves ~17% more than the market (1.17 beta).",
              dividendConsistencyExplanation: "Doesn't pay dividends."
            },
            explanation: "Edwards Lifesciences stock is very volatile and moves with the market. No dividends."
          },
          value: {
            value: "Average", // Score: 50
            color: "yellow",
            details: {
              peRatio: 28.95,
              pbRatio: 4.17,
              dividendYield: 0,
              peRatioExplanation: "Costs $29 per $1 profit (P/E) – slightly expensive.",
              pbRatioExplanation: "Stock price ~4.2x 'book value' (P/B) – right at average.",
              dividendYieldExplanation: "Pays no dividend."
            },
            explanation: "Edwards looks fairly valued based on assets, maybe a bit pricey on earnings. No dividend."
          },
          momentum: {
            value: "Average", // Score: 60
            color: "yellow",
            details: {
              threeMonthReturn: -5.93,
              relativePerformance: 1.66,
              rsi: 49.31,
              threeMonthReturnExplanation: "Down 5.9% recently – pulled back.",
              relativePerformanceExplanation: "Still slightly beat the market index (+1.7%).",
              rsiExplanation: "Buying interest is neutral (RSI 49.3)."
            },
            explanation: "Edwards stock dropped but still edged out the market. Momentum is neutral."
          }
        },
        synopsis: { // Placeholder
          price: "Facing competition in heart valve market, cyclical trends.",
          company: "Leader in transcatheter heart valves (TAVR).",
          role: "Medical device stock focused on structural heart disease."
        },
        overallAnalysis: "Edwards Lifesciences is a leader in heart valve technology. Sales are currently weak, and the stock is volatile. It's fairly valued but faces competition.",
        chartData: [80, 78, 75, 73, 70, 68, 70, 72, 71, 70, 69, 70.91], // Placeholder
        industry: "Healthcare" // Mapped from Medical Devices
      },
      // ... Add Dexcom Inc (DXCM) ...
      {
        name: "Dexcom Inc",
        ticker: "DXCM",
        price: 67.74,
        change: -1.1, // Placeholder
        rating: 5.0, // Placeholder
        smartScore: "Poor", // Calculated Placeholder
        description: "Focuses on the design, development, and commercialization of continuous glucose monitoring (CGM) systems.",
        oneYearReturn: "-51.59%",
        predictedPrice: "$103.45",
        metrics: {
          performance: {
            value: "Average", // Score: 51
            color: "yellow",
            details: {
              revenueGrowth: 11.34,
              profitMargin: 14.29,
              returnOnCapital: 16.64, // High ROC
              revenueGrowthExplanation: "Sales grew 11.3% - below average for MedTech.",
              profitMarginExplanation: "Keeps 14.3¢ profit per $1 sold – quite low.",
              returnOnCapitalExplanation: "Earns back 16.6% on investments – efficient!"
            },
            explanation: "Dexcom's growth and profitability are lagging, but it uses its investment money efficiently."
          },
          stability: {
            value: "Poor", // Score: 17
            color: "red",
            details: {
              volatility: 55.0, // Using raw % value
              beta: 1.49,
              dividendConsistency: "N/A", // 0=N/A
              volatilityExplanation: "Very volatile (55.0%) - expect big swings.",
              betaExplanation: "Moves ~50% more than the market (1.49 beta).",
              dividendConsistencyExplanation: "Doesn't pay dividends."
            },
            explanation: "Dexcom stock is very volatile and reactive to market shifts. No dividend income."
          },
          value: {
            value: "Poor", // Score: 9
            color: "red",
            details: {
              peRatio: 47.55,
              pbRatio: 12.59, // Very High P/B
              dividendYield: 0,
              peRatioExplanation: "Costs $47.55 per $1 profit (P/E) – very expensive!",
              pbRatioExplanation: "Stock price ~12.6x 'book value' (P/B) – extremely high!",
              dividendYieldExplanation: "Pays no dividend."
            },
            explanation: "Dexcom is priced very high, reflecting past growth, despite current struggles. No dividend."
          },
          momentum: {
            value: "Poor", // Score: 24
            color: "red",
            details: {
              threeMonthReturn: -15.58,
              relativePerformance: -7.99,
              rsi: 50, // Placeholder for N/A RSI
              threeMonthReturnExplanation: "Down 15.6% recently – sharp decline.",
              relativePerformanceExplanation: "Also lagged the market (-8.0%).",
              rsiExplanation: "Buying interest is perfectly neutral (RSI 50)."
            },
            explanation: "Dexcom stock dropped significantly, underperforming the market. Momentum is neutral at best."
          }
        },
        synopsis: { // Placeholder
          price: "Stock under pressure due to competition and market saturation concerns.",
          company: "Leading provider of continuous glucose monitoring (CGM) systems.",
          role: "Growth stock in diabetes tech, sensitive to competitive pressures."
        },
        overallAnalysis: "Dexcom leads in CGM technology for diabetes. Performance has slowed, and the stock is volatile and expensive. Faces increasing competition.",
        chartData: [80, 75, 70, 68, 65, 63, 64, 66, 68, 69, 67, 67.74], // Placeholder
        industry: "Healthcare" // Mapped from Medical Devices
      },
      // ... Add Becton Dickinson (BDX) ...
      {
        name: "Becton Dickinson",
        ticker: "BDX",
        price: 227.50,
        change: 0.8, // Placeholder
        rating: 5.9, // Placeholder
        smartScore: "Neutral", // Calculated Placeholder
        description: "Develops, manufactures, and sells medical supplies, devices, laboratory equipment, and diagnostic products.",
        oneYearReturn: "-5.95%",
        predictedPrice: "$271.25",
        metrics: {
          performance: {
            value: "Poor", // Score: 15
            color: "red",
            details: {
              revenueGrowth: 5.89,
              profitMargin: 8.47,
              returnOnCapital: 4.10,
              revenueGrowthExplanation: "Sales grew only 5.9% - slow for MedTech.",
              profitMarginExplanation: "Keeps only 8.5¢ profit per $1 sold – very low.",
              returnOnCapitalExplanation: "Earns back only 4.1% on investments – very inefficient."
            },
            explanation: "Becton Dickinson shows weak growth, low profitability, and poor efficiency compared to peers."
          },
          stability: {
            value: "Good", // Score: 93 (Capped at 100 from Beta calc > 100)
            color: "green",
            details: {
              volatility: 18.0, // Using raw % value
              beta: 0.37, // Very low beta
              dividendConsistency: "High", // 1=High
              volatilityExplanation: "Extremely low volatility (18%) - super stable!",
              betaExplanation: "Moves way less than the market (0.37 beta) - solid anchor!",
              dividendConsistencyExplanation: "Super reliable dividend payer."
            },
            explanation: "Becton Dickinson is exceptionally stable, with very low volatility and market sensitivity. Great dividend record."
          },
          value: {
            value: "Poor", // Score: 37
            color: "red",
            details: {
              peRatio: 37.79,
              pbRatio: 2.59,
              dividendYield: 1.75,
              peRatioExplanation: "Costs $37.79 per $1 profit (P/E) – quite expensive.",
              pbRatioExplanation: "Stock price ~2.6x 'book value' (P/B) – looks cheap!",
              dividendYieldExplanation: "Pays a decent dividend (1.75%)."
            },
            explanation: "Becton Dickinson looks expensive based on earnings but cheap based on assets. Offers a solid dividend."
          },
          momentum: {
            value: "Good", // Score: 71
            color: "green",
            details: {
              threeMonthReturn: 0.24,
              relativePerformance: 7.83,
              rsi: 47.12,
              threeMonthReturnExplanation: "Basically flat (+0.24%) recently.",
              relativePerformanceExplanation: "Still beat the market index (+7.8%) though!",
              rsiExplanation: "Buying interest is neutral (RSI 47.1)."
            },
            explanation: "Becton Dickinson stock was flat but still beat the market recently. Momentum is neutral."
          }
        },
        synopsis: { // Placeholder
          price: "Stable performer, benefiting from diverse medical product portfolio.",
          company: "Global medical technology company with strong positions in multiple segments.",
          role: "Defensive healthcare stock with consistent dividend growth."
        },
        overallAnalysis: "Becton Dickinson is a large, diversified, and very stable medical tech company. Financial performance is weak, and it looks expensive on earnings, but it's cheap on assets and has great stability.",
        chartData: [230, 228, 226, 225, 227, 229, 228, 227, 226, 228, 227, 227.50], // Placeholder
        industry: "Healthcare" // Mapped from Medical Instruments
      }
  ],
  
  "Retail": [
    {
      name: "Costco",
      ticker: "COST",
      price: 929.66,
      change: 1.5, // Placeholder daily change
      rating: 7.8, // Placeholder overall rating
      smartScore: "Outperform", // Calculated Placeholder
      description: "Operates membership warehouses offering a selection of branded and private-label products.",
      oneYearReturn: "28.40%",
      predictedPrice: "$N/A", // Analyst Target not in schema
      metrics: {
        performance: {
          value: "Good", // Score: 71
          color: "green",
          details: {
            revenueGrowth: 6.1,
            profitMargin: 2.9,
            returnOnCapital: 22.7,
            revenueGrowthExplanation: "Sales grew 6.1% - pretty decent hustle!",
            profitMarginExplanation: "Keeps only 3¢ profit per $1 sold – super thin margins!",
            returnOnCapitalExplanation: "Earns back 22.7% on investments – solid returns on their cash."
          },
          explanation: "Costco keeps growing sales nicely and makes good money back on its investments, even with razor-thin profit margins per item."
        },
        stability: {
          value: "Good", // Score: 77
          color: "green",
          details: {
            volatility: 2.4, // Lower is better, but using raw % for now
            beta: 0.95,
            dividendConsistency: "High", // ~21 years no cuts
            volatilityExplanation: "Price swings are pretty average (2.4%).",
            betaExplanation: "Moves almost exactly with the market (0.95 beta). Predictable vibes.",
            dividendConsistencyExplanation: "Super reliable dividends, hasn't cut in ages (21+ yrs)."
          },
          explanation: "Costco's a steady player. Price moves are typical, follows the market closely, and those dividends are super reliable."
        },
        value: {
          value: "Poor", // Score: 5
          color: "red",
          details: {
            peRatio: 54.3,
            pbRatio: 16.1,
            dividendYield: 0.5,
            peRatioExplanation: "Costs $54 per $1 profit (P/E) – VERY expensive, investors expect huge things!",
            pbRatioExplanation: "Stock price is ~16x its 'book value' (P/B) – way higher than assets suggest.",
            dividendYieldExplanation: "Tiny dividend (0.5%), basically zero income."
          },
          explanation: "Costco stock is EXPENSIVE. You're paying a massive premium for its rep and growth expectations. Don't expect income."
        },
        momentum: {
          value: "Average", // Score: 52
          color: "yellow",
          details: {
            threeMonthReturn: -3.0,
            relativePerformance: 12.1, // Relative to XRT index provided
            rsi: 42.9,
            threeMonthReturnExplanation: "Down 3% recently – slight dip.",
            relativePerformanceExplanation: "BUT it crushed its industry index (+12.1%)!",
            rsiExplanation: "Buying interest is kinda weak (RSI 42.9), might be getting cheap."
          },
          explanation: "Costco's stock dipped a bit lately, but it still smoked its industry competitors. Buying is slow right now."
        }
      },
      synopsis: { // Placeholder synopsis
        price: "Trading near highs, showing resilience in consumer spending.",
        company: "Membership model drives loyalty and consistent traffic.",
        role: "Defensive retail stock with strong brand loyalty."
      },
      overallAnalysis: "Costco is a retail powerhouse known for its membership model and customer loyalty. While the stock is very expensive, its business is stable and profitable. Good stability but high valuation.",
      chartData: [900, 910, 920, 915, 925, 930, 935, 932, 928, 925, 927, 929.66], // Placeholder
      industry: "Retail"
    },
    {
      name: "Walmart",
      ticker: "WMT",
      price: 85.15,
      change: 0.5, // Placeholder
      rating: 7.2, // Placeholder
      smartScore: "Outperform", // Calculated Placeholder
      description: "Operates retail, wholesale, and other units worldwide.",
      oneYearReturn: "+N/A", // Not provided in table
      predictedPrice: "$N/A", // Not provided in table
      metrics: {
        performance: {
          value: "Average", // Score: 57
          color: "yellow",
          details: {
            revenueGrowth: 5.1,
            profitMargin: 2.8,
            returnOnCapital: 13.6,
            revenueGrowthExplanation: "Sales growth 5.1% - keeping pace.",
            profitMarginExplanation: "Keeps 2.8¢ profit per $1 sold – super thin margins!",
            returnOnCapitalExplanation: "Earns back 13.6% on investments – decent efficiency."
          },
          explanation: "Walmart grows steadily and uses its money okay, but like Costco, makes very little profit on each sale."
        },
        stability: {
          value: "Good", // Score: 88
          color: "green",
          details: {
            volatility: 2.4,
            beta: 0.70,
            dividendConsistency: "High", // 52-year streak
            volatilityExplanation: "Price swings are pretty normal (2.4%).",
            betaExplanation: "Moves less than the market (0.70 beta) - chill stock.",
            dividendConsistencyExplanation: "INCREDIBLE dividend streak (52 yrs!) - ultra reliable."
          },
          explanation: "Walmart is super stable. Doesn't jump around much and has an amazing record of paying dividends."
        },
        value: {
          value: "Poor", // Score: 21
          color: "red",
          details: {
            peRatio: 35.4,
            pbRatio: 7.5,
            dividendYield: 1.1,
            peRatioExplanation: "Costs $35 per $1 profit (P/E) – expensive.",
            pbRatioExplanation: "Stock price is 7.5x 'book value' (P/B) – investors expect growth.",
            dividendYieldExplanation: "Small dividend (1.1%) - not an income focus."
          },
          explanation: "Walmart stock is pricey relative to its profits and assets. The dividend is small."
        },
        momentum: {
          value: "Average", // Score: 44
          color: "yellow",
          details: {
            threeMonthReturn: -8.1,
            relativePerformance: 7.0, // Relative to XRT index provided
            rsi: 36.9,
            threeMonthReturnExplanation: "Down 8.1% recently – noticeable drop.",
            relativePerformanceExplanation: "Still beat its industry index (+7.0%) though!",
            rsiExplanation: "Very weak buying (RSI 36.9), looks oversold."
          },
          explanation: "Walmart stock dropped lately but still beat its competitors. Looks weak and maybe oversold."
        }
      },
      synopsis: { // Placeholder synopsis
        price: "Showing resilience, leveraging grocery and online sales.",
        company: "Retail giant adapting to e-commerce while maintaining store footprint.",
        role: "Defensive anchor in retail, less sensitive to economic downturns."
      },
      overallAnalysis: "Walmart is a retail behemoth, incredibly stable with legendary dividend reliability. Performance is okay, but the stock trades at a high valuation.",
      chartData: [90, 88, 86, 87, 85, 84, 86, 87, 85, 84, 85, 85.15], // Placeholder
      industry: "Retail"
    },
    {
      name: "Target",
      ticker: "TGT",
      price: 103.65,
      change: -1.0, // Placeholder
      rating: 4.5, // Placeholder
      smartScore: "Poor", // Calculated Placeholder
      description: "Operates as a general merchandise retailer in the United States.",
      oneYearReturn: "+N/A", // Not provided
      predictedPrice: "$N/A", // Not provided
      metrics: {
        performance: {
          value: "Poor", // Score: 30
          color: "red",
          details: {
            revenueGrowth: -0.8,
            profitMargin: 3.8,
            returnOnCapital: 12.6,
            revenueGrowthExplanation: "Sales actually shrunk (-0.8%) - not great.",
            profitMarginExplanation: "Keeps 3.8¢ profit per $1 sold – thin margins.",
            returnOnCapitalExplanation: "Earns back 12.6% on investments – decent use of cash."
          },
          explanation: "Target's sales dipped, and profits are slim, though they use their investment money reasonably well."
        },
        stability: {
          value: "Average", // Score: 60
          color: "yellow",
          details: {
            volatility: 3.0,
            beta: 1.28,
            dividendConsistency: "High", // 53-year streak
            volatilityExplanation: "A bit jumpier than average (3.0% swings).",
            betaExplanation: "Moves more than the market (1.28 beta) - amplifies trends.",
            dividendConsistencyExplanation: "Dividend KING status (53 yrs!) - extremely reliable payouts."
          },
          explanation: "Target's stock can swing more than average, but its dividend payment record is legendary (Dividend King)."
        },
        value: {
          value: "Good", // Score: 91
          color: "green",
          details: {
            peRatio: 11.7,
            pbRatio: 3.2,
            dividendYield: 4.3,
            peRatioExplanation: "Costs $11.70 per $1 profit (P/E) – that looks cheap!",
            pbRatioExplanation: "Stock price ~3.2x 'book value' (P/B) – reasonable.",
            dividendYieldExplanation: "Pays a big dividend (4.3%) - strong income!"
          },
          explanation: "Target looks cheap based on its profits (low P/E) and pays a very nice dividend. Good value potential."
        },
        momentum: {
          value: "Poor", // Score: 0 (Capped)
          color: "red",
          details: {
            threeMonthReturn: -21.7,
            relativePerformance: -6.6, // Relative to XRT index provided
            rsi: 30.7,
            threeMonthReturnExplanation: "Down 21.7% recently – big yikes.",
            relativePerformanceExplanation: "Also did worse than its industry (-6.6%).",
            rsiExplanation: "Extremely weak buying (RSI 30.7), very oversold."
          },
          explanation: "Target stock got hammered recently, doing worse than competitors. Looks extremely oversold."
        }
      },
      synopsis: { // Placeholder synopsis
        price: "Struggling with changing consumer habits and inventory issues.",
        company: "Focusing on owned brands and digital fulfillment.",
        role: "Turnaround potential with high dividend, but facing headwinds."
      },
      overallAnalysis: "Target is a well-known retailer, famous for its reliable dividends (Dividend King). However, recent performance and stock momentum have been weak, though it looks potentially cheap.",
      chartData: [120, 115, 110, 108, 105, 103, 104, 102, 100, 101, 103, 103.65], // Placeholder
      industry: "Retail"
    },
    // --- Add Kroger ---
    {
      name: "Kroger",
      ticker: "KR",
      price: 66.72,
      change: 0.7, // Placeholder
      rating: 5.0, // Placeholder
      smartScore: "Average", // Calculated Placeholder
      description: "Operates supermarkets and multi-department stores throughout the United States.",
      oneYearReturn: "+N/A", // Not provided
      predictedPrice: "$N/A", // Not provided
      metrics: {
        performance: {
          value: "Poor", // Score: 21
          color: "red",
          details: {
            revenueGrowth: -1.9,
            profitMargin: 1.8,
            returnOnCapital: 8.1,
            revenueGrowthExplanation: "Sales dipped slightly (-1.9%).",
            profitMarginExplanation: "Keeps only 1.8¢ profit per $1 sold – razor thin!",
            returnOnCapitalExplanation: "Earns back 8.1% on investments – kinda low efficiency."
          },
          explanation: "Kroger's sales slipped, and profit margins are tiny. Not a strong performance picture."
        },
        stability: {
          value: "Good", // Score: 86
          color: "green",
          details: {
            volatility: 2.5,
            beta: 0.61,
            dividendConsistency: "High", // 18-year streak
            volatilityExplanation: "Average price swings (2.5%).",
            betaExplanation: "Moves way less than the market (0.61 beta) - very stable.",
            dividendConsistencyExplanation: "Reliably increases dividends (18 yrs)."
          },
          explanation: "Kroger is a very stable stock, less jumpy than the market, with a solid dividend growth history."
        },
        value: {
          value: "Average", // Score: 55
          color: "yellow",
          details: {
            peRatio: 18.2,
            pbRatio: 5.3,
            dividendYield: 2.0,
            peRatioExplanation: "Costs $18.20 per $1 profit (P/E) – pretty fair.",
            pbRatioExplanation: "Stock price is 5.3x 'book value' (P/B) – a bit high.",
            dividendYieldExplanation: "Pays an okay dividend (2.0%)."
          },
          explanation: "Kroger's valuation seems fair based on profits, though a bit high based on assets. Dividend is decent."
        },
        momentum: {
          value: "Good", // Score: 86
          color: "green",
          details: {
            threeMonthReturn: 7.9,
            relativePerformance: 23.0, // Relative to XRT index provided
            rsi: 57.5,
            threeMonthReturnExplanation: "Up 7.9% recently – nice gain!",
            relativePerformanceExplanation: "Absolutely crushed its industry (+23%)!",
            rsiExplanation: "Strong buying interest (RSI 57.5), but not overhyped."
          },
          explanation: "Kroger stock has been hot lately, easily beating competitors. Strong momentum right now."
        }
      },
      synopsis: { // Placeholder synopsis
        price: "Showing recent strength, benefiting from grocery demand.",
        company: "Major US grocer focusing on digital sales and private label.",
        role: "Defensive consumer staple stock with reliable dividends."
      },
      overallAnalysis: "Kroger is a major grocery chain, known for being stable and paying reliable dividends. Recent stock performance has been very strong, though its core business performance is just okay.",
      chartData: [60, 62, 64, 63, 65, 67, 68, 66, 65, 67, 66, 66.72], // Placeholder
      industry: "Retail"
    },
    // --- Add Albertsons ---
    {
      name: "Albertsons",
      ticker: "ACI",
      price: 21.62,
      change: 0.2, // Placeholder
      rating: 5.2, // Placeholder
      smartScore: "Good", // Calculated Placeholder
      description: "Operates food and drug stores in the United States.",
      oneYearReturn: "+N/A", // Not provided
      predictedPrice: "$N/A", // Not provided
      metrics: {
        performance: {
          value: "Poor", // Score: 20
          color: "red",
          details: {
            revenueGrowth: 1.0,
            profitMargin: 1.3,
            returnOnCapital: 6.2,
            revenueGrowthExplanation: "Sales barely grew (1.0%).",
            profitMarginExplanation: "Keeps only 1.3¢ profit per $1 sold – extremely thin!",
            returnOnCapitalExplanation: "Earns back only 6.2% on investments – poor efficiency."
          },
          explanation: "Albertsons has very slow growth and tiny profit margins. Not performing well financially."
        },
        stability: {
          value: "Good", // Score: 83
          color: "green",
          details: {
            volatility: 2.6,
            beta: 0.49,
            dividendConsistency: "Medium", // ~3 years, no cuts
            volatilityExplanation: "Average price swings (2.6%).",
            betaExplanation: "Moves way less than the market (0.49 beta) - very stable anchor.",
            dividendConsistencyExplanation: "Pays dividends, but only started recently (~3 yrs)."
          },
          explanation: "Albertsons stock is very stable and doesn't follow the market much. Started paying dividends recently."
        },
        value: {
          value: "Good", // Score: 79
          color: "green",
          details: {
            peRatio: 12.2,
            pbRatio: 3.7,
            dividendYield: 2.4,
            peRatioExplanation: "Costs $12.20 per $1 profit (P/E) – looks cheap!",
            pbRatioExplanation: "Stock price ~3.7x 'book value' (P/B) – seems reasonable.",
            dividendYieldExplanation: "Pays a solid dividend (2.4%)."
          },
          explanation: "Albertsons looks cheap based on profits and pays a good dividend. Good value metrics overall."
        },
        momentum: {
          value: "Good", // Score: 88
          color: "green",
          details: {
            threeMonthReturn: 10.1,
            relativePerformance: 25.2, // Relative to XRT index provided
            rsi: 57.3,
            threeMonthReturnExplanation: "Up 10.1% recently – strong gains!",
            relativePerformanceExplanation: "Totally smoked its industry competitors (+25.2%)!",
            rsiExplanation: "Good buying interest (RSI 57.3), solid momentum."
          },
          explanation: "Albertsons stock is on a roll lately, easily beating its competitors. Momentum looks strong."
        }
      },
      synopsis: { // Placeholder synopsis
        price: "Gaining traction amid merger talks and stable grocery demand.",
        company: "Large grocery chain potentially merging with Kroger.",
        role: "Consumer staple stock with potential merger catalyst."
      },
      overallAnalysis: "Albertsons is another large, stable grocery store chain. Performance isn't great, but it looks cheap, pays a dividend, and the stock has strong momentum, possibly due to merger news.",
      chartData: [19, 20, 21, 20.5, 21.5, 22, 21.8, 21.5, 21.2, 21.4, 21.6, 21.62], // Placeholder
      industry: "Retail"
    },
     // --- Add Best Buy ---
    {
      name: "Best Buy",
      ticker: "BBY",
      price: 72.45,
      change: -0.8, // Placeholder
      rating: 3.8, // Placeholder
      smartScore: "Poor", // Calculated Placeholder
      description: "Retailer of consumer electronics, computing and mobile phones, entertainment products, appliances, and related services.",
      oneYearReturn: "+N/A", // Not provided
      predictedPrice: "$N/A", // Not provided
      metrics: {
        performance: {
          value: "Poor", // Score: 31
          color: "red",
          details: {
            revenueGrowth: -4.4,
            profitMargin: 2.2,
            returnOnCapital: 14.9,
            revenueGrowthExplanation: "Sales shrank 4.4% - shrinking business.",
            profitMarginExplanation: "Keeps only 2.2¢ profit per $1 sold – razor thin.",
            returnOnCapitalExplanation: "Earns back 14.9% on investments – decent efficiency."
          },
          explanation: "Best Buy's sales are dropping, and profits are tiny. Only bright spot is decent return on capital."
        },
        stability: {
          value: "Poor", // Score: 34
          color: "red",
          details: {
            volatility: 3.6,
            beta: 1.44,
            dividendConsistency: "High", // 22-year streak
            volatilityExplanation: "Pretty volatile (3.6% daily swings).",
            betaExplanation: "Moves ~44% more than the market (1.44 beta) - reactive.",
            dividendConsistencyExplanation: "Solid dividend growth record (22 yrs)."
          },
          explanation: "Best Buy stock is jumpy and reacts strongly to market shifts, but it has a good dividend history."
        },
        value: {
          value: "Good", // Score: 78
          color: "green",
          details: {
            peRatio: 16.9,
            pbRatio: 5.5,
            dividendYield: 5.3,
            peRatioExplanation: "Costs $16.90 per $1 profit (P/E) – looks pretty cheap!",
            pbRatioExplanation: "Stock price 5.5x 'book value' (P/B) – a bit high.",
            dividendYieldExplanation: "HUGE dividend (5.3%)! Major income appeal."
          },
          explanation: "Best Buy looks cheap based on profits and pays a massive dividend, but seems expensive based on assets."
        },
        momentum: {
          value: "Poor", // Score: 14
          color: "red",
          details: {
            threeMonthReturn: -16.6,
            relativePerformance: -1.5, // Relative to XRT index provided
            rsi: 36.1,
            threeMonthReturnExplanation: "Down 16.6% recently – ouch.",
            relativePerformanceExplanation: "Also lagged its industry (-1.5%).",
            rsiExplanation: "Very weak buying (RSI 36.1), looks very oversold."
          },
          explanation: "Best Buy stock has been weak, falling behind competitors. It looks very oversold right now."
        }
      },
      synopsis: { // Placeholder synopsis
        price: "Facing challenges from online competition and consumer electronics slowdown.",
        company: "Adapting retail model with focus on services and healthcare tech.",
        role: "High-dividend stock with turnaround potential, but significant risks."
      },
      overallAnalysis: "Best Buy struggles with online competition and slowing electronics sales. Performance is weak, stability is low, but it looks cheap and pays a huge dividend. Risky turnaround play.",
      chartData: [80, 78, 75, 73, 71, 70, 72, 74, 73, 71, 72, 72.45], // Placeholder
      industry: "Retail"
    },
    // --- Add BJ's Wholesale ---
    {
      name: "BJ's Wholesale",
      ticker: "BJ",
      price: 111.91,
      change: 1.1, // Placeholder
      rating: 6.0, // Placeholder
      smartScore: "Good", // Calculated Placeholder
      description: "Operates membership warehouse clubs on the East Coast of the United States.",
      oneYearReturn: "+N/A", // Not provided
      predictedPrice: "$N/A", // Not provided
      metrics: {
        performance: {
          value: "Poor", // Score: 29
          color: "red",
          details: {
            revenueGrowth: 2.7,
            profitMargin: 2.6,
            returnOnCapital: 12.4,
            revenueGrowthExplanation: "Sales grew only 2.7% - quite slow.",
            profitMarginExplanation: "Keeps 2.6¢ profit per $1 sold – tiny margins.",
            returnOnCapitalExplanation: "Earns back 12.4% on investments – okay efficiency."
          },
          explanation: "BJ's growth is slow and margins are thin, similar to other warehouse clubs. Efficiency is just okay."
        },
        stability: {
          value: "Good", // Score: 90 (Capped at 100 from beta calc > 100)
          color: "green",
          details: {
            volatility: 3.3,
            beta: 0.57,
            dividendConsistency: "N/A", // No dividend paid
            volatilityExplanation: "Above average volatility (3.3%).",
            betaExplanation: "Moves way less than the market (0.57 beta) - very stable anchor!",
            dividendConsistencyExplanation: "Doesn't pay dividends."
          },
          explanation: "BJ's stock is surprisingly stable, moving much less than the overall market, but it's a bit jumpy day-to-day. No dividends."
        },
        value: {
          value: "Poor", // Score: 31 (P/B high)
          color: "red",
          details: {
            peRatio: 28.0,
            pbRatio: 8.0,
            dividendYield: 0.0,
            peRatioExplanation: "Costs $28 per $1 profit (P/E) – expensive.",
            pbRatioExplanation: "Stock price is 8x 'book value' (P/B) – quite high.",
            dividendYieldExplanation: "Pays no dividend."
          },
          explanation: "BJ's looks expensive based on earnings and assets. No income potential from dividends."
        },
        momentum: {
          value: "Good", // Score: 85
          color: "green",
          details: {
            threeMonthReturn: 19.3,
            relativePerformance: 34.4, // Relative to XRT index provided
            rsi: 58.5,
            threeMonthReturnExplanation: "Up 19.3% recently – huge gains!",
            relativePerformanceExplanation: "Totally smoked its industry competitors (+34.4%)!",
            rsiExplanation: "Strong buying interest (RSI 58.5), good momentum."
          },
          explanation: "BJ's stock has been on fire lately, crushing competitors. Momentum looks really strong."
        }
      },
      synopsis: { // Placeholder synopsis
        price: "Strong recent performance, benefiting from value focus.",
        company: "Expanding club footprint and digital offerings.",
        role: "Growth potential in warehouse club segment, less saturated than Costco."
      },
      overallAnalysis: "BJ's Wholesale is a smaller competitor to Costco, but its stock has shown amazing momentum recently. Performance is meh and it looks expensive, but stability is surprisingly good.",
      chartData: [95, 100, 105, 108, 110, 112, 115, 113, 111, 110, 112, 111.91], // Placeholder
      industry: "Retail"
    },
     // --- Add Lowe's ---
    {
      name: "Lowe's",
      ticker: "LOW",
      price: 228.42,
      change: -2.0, // Placeholder
      rating: 6.2, // Placeholder
      smartScore: "Average", // Calculated Placeholder
      description: "Operates as a home improvement retailer in the United States and internationally.",
      oneYearReturn: "+N/A", // Not provided
      predictedPrice: "$N/A", // Not provided
      metrics: {
        performance: {
          value: "Average", // Score: 68
          color: "yellow",
          details: {
            revenueGrowth: -3.1,
            profitMargin: 8.3,
            returnOnCapital: 31.1, // Very high ROC
            revenueGrowthExplanation: "Sales shrank 3.1% - rough patch.",
            profitMarginExplanation: "Keeps 8.3¢ profit per $1 sold – okay margin.",
            returnOnCapitalExplanation: "Earns back a strong 31.1% on investments – very efficient!"
          },
          explanation: "Lowe's sales dipped, but it's still decently profitable and uses its investment money very effectively."
        },
        stability: {
          value: "Good", // Score: 73
          color: "green",
          details: {
            volatility: 2.3,
            beta: 1.07,
            dividendConsistency: "High", // Dividend King 60+ years
            volatilityExplanation: "Pretty average price swings (2.3%).",
            betaExplanation: "Moves slightly more than the market (1.07 beta).",
            dividendConsistencyExplanation: "Dividend KING! 60+ years of increases - ultra-reliable."
          },
          explanation: "Lowe's has typical volatility but is a true Dividend King with an incredible dividend history."
        },
        value: {
          value: "Good", // Score: 75 (P/B N/M ignored)
          color: "green",
          details: {
            peRatio: 18.7,
            pbRatio: 9999, // Placeholder for N/M
            dividendYield: 2.1,
            peRatioExplanation: "Costs $18.70 per $1 profit (P/E) – looks cheap!",
            pbRatioExplanation: "P/B not meaningful due to accounting.",
            dividendYieldExplanation: "Pays a solid dividend (2.1%)."
          },
          explanation: "Lowe's looks cheap based on profits and pays a solid, reliable dividend."
        },
        momentum: {
          value: "Poor", // Score: 38
          color: "red",
          details: {
            threeMonthReturn: -8.7,
            relativePerformance: 6.4, // Relative to XRT index provided
            rsi: 40.2,
            threeMonthReturnExplanation: "Down 8.7% recently – notable drop.",
            relativePerformanceExplanation: "Still beat its industry (+6.4%) though!",
            rsiExplanation: "Weak buying (RSI 40.2), getting oversold."
          },
          explanation: "Lowe's stock dipped recently but still beat competitors. Looks weak and potentially oversold."
        }
      },
      synopsis: { // Placeholder synopsis
        price: "Tracking housing market trends, focus on Pro customers.",
        company: "Major home improvement retailer competing with Home Depot.",
        role: "Cyclical stock tied to housing, strong dividend grower."
      },
      overallAnalysis: "Lowe's is a home improvement giant and a Dividend King. While sales dipped recently, it's efficient and looks cheap. Stock momentum is weak.",
      chartData: [240, 235, 230, 228, 225, 227, 230, 228, 226, 229, 230, 228.42], // Placeholder
      industry: "Retail"
    },
    // --- Add Home Depot ---
    {
      name: "Home Depot",
      ticker: "HD",
      price: 358.15,
      change: -1.2, // Placeholder
      rating: 7.0, // Placeholder
      smartScore: "Good", // Calculated Placeholder
      description: "Operates as a home improvement retailer.",
      oneYearReturn: "+N/A", // Not provided
      predictedPrice: "$N/A", // Not provided
      metrics: {
        performance: {
          value: "Good", // Score: 75
          color: "green",
          details: {
            revenueGrowth: 4.5,
            profitMargin: 9.3,
            returnOnCapital: 23.6, // Assuming this is the ROC, based on position
            revenueGrowthExplanation: "Sales grew 4.5% - solid for its size.",
            profitMarginExplanation: "Keeps 9.3¢ profit per $1 sold – decent margin.",
            returnOnCapitalExplanation: "Earns back 23.6% on investments – very efficient!"
          },
          explanation: "Home Depot shows solid growth and good profitability, and it's very efficient with its money."
        },
        stability: {
          value: "Good", // Score: 73
          color: "green",
          details: {
            volatility: 2.2,
            beta: 1.10,
            dividendConsistency: "High", // 38 years uninterrupted, 15yr growth
            volatilityExplanation: "Pretty average price swings (2.2%).",
            betaExplanation: "Moves slightly more than the market (1.10 beta).",
            dividendConsistencyExplanation: "Very reliable dividend payer (38+ yrs)."
          },
          explanation: "Home Depot has average volatility but a long, reliable history of paying dividends."
        },
        value: {
          value: "Poor", // Score: 11
          color: "red",
          details: {
            peRatio: 24.0,
            pbRatio: 53.6, // Very high P/B
            dividendYield: 2.6,
            peRatioExplanation: "Costs $24 per $1 profit (P/E) – getting expensive.",
            pbRatioExplanation: "Stock price 53x 'book value' (P/B) – extremely high!",
            dividendYieldExplanation: "Pays a good dividend (2.6%)."
          },
          explanation: "Home Depot looks expensive, especially based on assets (P/B), but offers a nice dividend."
        },
        momentum: {
          value: "Poor", // Score: 38
          color: "red",
          details: {
            threeMonthReturn: -9.6,
            relativePerformance: 5.5, // Relative to XRT index provided
            rsi: 39.8,
            threeMonthReturnExplanation: "Down 9.6% recently – took a dip.",
            relativePerformanceExplanation: "Still beat its industry (+5.5%) though.",
            rsiExplanation: "Weak buying (RSI 39.8), nearing oversold."
          },
          explanation: "Home Depot stock dropped recently but still outperformed competitors. Looks weak and maybe oversold."
        }
      },
      synopsis: { // Placeholder synopsis
        price: "Holding up well despite housing slowdown, strong brand.",
        company: "Leading home improvement retailer benefiting from home renovation trends.",
        role: "Blue-chip retail stock, considered a bellwether for housing."
      },
      overallAnalysis: "Home Depot is the leader in home improvement. Performs well, very stable dividend history, but looks expensive. Recent stock performance is weak.",
      chartData: [370, 365, 360, 355, 358, 362, 360, 358, 355, 357, 359, 358.15], // Placeholder
      industry: "Retail"
    },
    // --- Add Amazon ---
    {
      name: "Amazon",
      ticker: "AMZN",
      price: 192.72,
      change: 1.8, // Placeholder
      rating: 7.6, // Placeholder
      smartScore: "Outperform", // Calculated Placeholder
      description: "Engages in retail sale of consumer products and subscriptions in North America and internationally.",
      oneYearReturn: "+N/A", // Not provided
      predictedPrice: "$N/A", // Not provided
      metrics: {
        performance: {
          value: "Good", // Score: 75
          color: "green",
          details: {
            revenueGrowth: 11.0,
            profitMargin: 9.3,
            returnOnCapital: 14.2,
            revenueGrowthExplanation: "Sales grew 11% - strong growth!",
            profitMarginExplanation: "Keeps 9.3¢ profit per $1 sold – getting better.",
            returnOnCapitalExplanation: "Earns back 14.2% on investments – solid efficiency."
          },
          explanation: "Amazon's growing strongly again, with improving profits and solid returns on its massive investments."
        },
        stability: {
          value: "Poor", // Score: 31
          color: "red",
          details: {
            volatility: 3.1,
            beta: 1.38,
            dividendConsistency: "N/A", // No dividend
            volatilityExplanation: "Above average volatility (3.1%).",
            betaExplanation: "Moves ~38% more than the market (1.38 beta) - reactive.",
            dividendConsistencyExplanation: "Doesn't pay dividends."
          },
          explanation: "Amazon stock is quite volatile and reacts strongly to market news. No dividends."
        },
        value: {
          value: "Poor", // Score: 24
          color: "red",
          details: {
            peRatio: 34.9,
            pbRatio: 7.1,
            dividendYield: 0.0,
            peRatioExplanation: "Costs $35 per $1 profit (P/E) – expensive.",
            pbRatioExplanation: "Stock price is 7.1x 'book value' (P/B) – high expectations.",
            dividendYieldExplanation: "Pays no dividend."
          },
          explanation: "Amazon trades at a high price relative to earnings and assets. Purely a growth stock, no income."
        },
        momentum: {
          value: "Poor", // Score: 18
          color: "red",
          details: {
            threeMonthReturn: -15.9,
            relativePerformance: -0.8, // Relative to XRT index provided
            rsi: 37.3,
            threeMonthReturnExplanation: "Down 15.9% recently – sharp drop.",
            relativePerformanceExplanation: "Slightly lagged its industry too (-0.8%).",
            rsiExplanation: "Very weak buying (RSI 37.3), looks oversold."
          },
          explanation: "Amazon stock took a hit recently, slightly underperforming competitors. Looks weak and oversold."
        }
      },
      synopsis: { // Placeholder synopsis
        price: "Consolidating gains, AWS cloud growth and retail efficiency are key.",
        company: "E-commerce and cloud computing giant, expanding into advertising and AI.",
        role: "Mega-cap growth stock, leader in multiple tech sectors."
      },
      overallAnalysis: "Amazon dominates e-commerce and cloud (AWS). Growth is strong again, but the stock is volatile and expensive. Recent momentum is poor.",
      chartData: [200, 198, 195, 193, 190, 192, 194, 191, 188, 190, 193, 192.72], // Placeholder
      industry: "Retail" // Categorizing as Retail based on description, though it's also Tech
      }
    ],

  "Tech": [
      {
        name: "Apple",
        ticker: "AAPL",
        price: 217.90,
        change: 1.2, // Placeholder, original data didn't have daily change
        rating: 7.5, // Placeholder rating
        smartScore: "High", // Calculated Placeholder
        description: "Designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories worldwide.",
        oneYearReturn: "28.40%",
        predictedPrice: "$253.71", // Using Analyst Target as predicted price
        metrics: {
          performance: {
            value: "Average", // Score: 69
            color: "yellow",
            details: {
              revenueGrowth: 2.61,
              profitMargin: 24.30,
              returnOnCapital: 63.80,
              revenueGrowthExplanation: "Sales grew a bit (2.6%), kinda slow for tech.",
              profitMarginExplanation: "Keeps about 24¢ profit for every $1 sold - solid!",
              returnOnCapitalExplanation: "Makes back a HUGE 64% on its investments each year – very efficient."
            },
            explanation: "Apple's profit machine is strong, even if sales growth is slower lately. They're masters at making money from what they invest."
          },
          stability: {
            value: "Poor", // Score: 38
            color: "red",
            details: {
              volatility: 24.5, // Assuming Volatility is % -> convert to ratio? Needs clarification. Using % as value for now.
              beta: 1.26,
              dividendConsistency: "High", // Yield > 0 and Consistency = 1
              volatilityExplanation: "Price swings are kinda normal for a big tech stock (24.5%).",
              betaExplanation: "Moves a bit more than the market (1.26 beta) - expect bigger swings.",
              dividendConsistencyExplanation: "Pays dividends reliably every time."
            },
            explanation: "Apple's stock can be a bit more jumpy than the average tech stock, but they reliably pay dividends."
          },
          value: {
            value: "Poor", // Score: 18
            color: "red",
            details: {
              peRatio: 34.64,
              pbRatio: 49.09,
              dividendYield: 0.46,
              peRatioExplanation: "Costs $34.64 for $1 of profit – kinda pricey.",
              pbRatioExplanation: "Stock price is way higher (49x) than its 'book value' – investors expect a lot!",
              dividendYieldExplanation: "Pays a tiny dividend (0.46%), not really an income stock."
            },
            explanation: "Apple's expensive based on profits and assets, paying very little back as dividends. Investors bet big on its future."
          },
          momentum: {
            value: "Poor", // Score: 35
            color: "red",
            details: {
              threeMonthReturn: -15.61,
              relativePerformance: 21.30, // Note: Positive Rel Perf despite negative 3M return? Using as is.
              rsi: 41.50,
              threeMonthReturnExplanation: "Down 15.6% recently – took a hit.",
              relativePerformanceExplanation: "Still did WAY better than the market index (+21%) lately though!",
              rsiExplanation: "Buyers are hesitant (RSI 41.5), maybe waiting for a dip."
            },
            explanation: "Apple's stock price dropped recently, but it still outperformed the overall market by a lot. Buying interest is low right now."
          }
        },
        synopsis: { // Placeholder synopsis
          price: "Trading near all-time highs, supported by brand loyalty.",
          company: "Dominates premium electronics, expanding services revenue.",
          role: "Core tech holding, often seen as a benchmark for the sector."
        },
        overallAnalysis: "Apple remains a tech giant with incredible profitability and brand power. While recent growth has slowed and the stock looks expensive, its ecosystem and service revenue provide resilience. High volatility compared to the market average.",
        chartData: [210, 212, 215, 213, 216, 218, 217, 219, 220, 218, 217, 217.90], // Placeholder
        industry: "Tech" // Simplified industry
      },
      {
        name: "Microsoft",
        ticker: "MSFT",
        price: 378.80,
        change: -1.5, // Placeholder
        rating: 8.0, // Placeholder rating
        smartScore: "High", // Calculated Placeholder
        description: "Develops, licenses, and supports software, services, devices, and solutions worldwide.",
        oneYearReturn: "-10.16%",
        predictedPrice: "$504.89",
        metrics: {
          performance: {
            value: "Good", // Score: 77
            color: "green",
            details: {
              revenueGrowth: 15.04,
              profitMargin: 35.43,
              returnOnCapital: 23.60,
              revenueGrowthExplanation: "Sales grew 15% - faster than the tech average!",
              profitMarginExplanation: "Keeps 35¢ profit per $1 sold – very strong.",
              returnOnCapitalExplanation: "Earns back 23.6% on investments – efficient money-maker."
            },
            explanation: "Microsoft is crushing it with strong sales growth, high profits, and efficient use of its money."
          },
          stability: {
            value: "Good", // Score: 78
            color: "green",
            details: {
              volatility: 20.1,
              beta: 0.99,
              dividendConsistency: "High", // Yield > 0 and Consistency = 1
              volatilityExplanation: "Price swings are lower than average tech stocks (20.1%).",
              betaExplanation: "Moves almost exactly with the market (0.99 beta) - predictable.",
              dividendConsistencyExplanation: "Always pays its dividends, very reliable."
            },
            explanation: "Microsoft is a steady giant. Its price doesn't swing wildly, and it reliably pays dividends."
          },
          value: {
            value: "Poor", // Score: 37
            color: "red",
            details: {
              peRatio: 30.51,
              pbRatio: 9.30,
              dividendYield: 0.83,
              peRatioExplanation: "Costs $30.51 for $1 profit – pricier than average tech.",
              pbRatioExplanation: "Stock price is ~9x its 'book value' – high expectations built-in.",
              dividendYieldExplanation: "Pays a small dividend (0.83%), focus is elsewhere."
            },
            explanation: "You pay a premium for Microsoft's quality and growth prospects; it's not a high-income stock."
          },
          momentum: {
            value: "Poor", // Score: 9
            color: "red",
            details: {
              threeMonthReturn: -13.78,
              relativePerformance: -17.26,
              rsi: 37.55,
              threeMonthReturnExplanation: "Down 13.8% lately – significant drop.",
              relativePerformanceExplanation: "Did worse than the market index (-17.3%) too.",
              rsiExplanation: "Very weak buying interest (RSI 37.6), looks oversold."
            },
            explanation: "Microsoft's stock has been weak recently, falling more than the market. It might be oversold."
          }
        },
        synopsis: { // Placeholder synopsis
          price: "Consolidating after strong run, cloud growth remains key focus.",
          company: "Leader in cloud, software, and AI, integrating new tech across products.",
          role: "Essential tech holding, often less volatile than other large-cap tech."
        },
        overallAnalysis: "Microsoft is a tech powerhouse with dominant positions in cloud (Azure) and software. Strong performance and stability, but valuation is high and recent momentum is weak. A core holding for many tech investors.",
        chartData: [390, 385, 382, 380, 378, 375, 377, 379, 381, 380, 379, 378.80], // Placeholder
        industry: "Tech"
      },
      {
        name: "Alphabet (GOOG)",
        ticker: "GOOG",
        price: 156.06,
        change: 0.9, // Placeholder
        rating: 7.0, // Placeholder rating
        smartScore: "High", // Calculated Placeholder
        description: "Provides online advertising services, search engine, cloud computing, software, and hardware.",
        oneYearReturn: "2.87%",
        predictedPrice: "$218.39",
        metrics: {
          performance: {
            value: "Good", // Score: 79
            color: "green",
            details: {
              revenueGrowth: 13.89,
              profitMargin: 28.62,
              returnOnCapital: 28.68,
              revenueGrowthExplanation: "Sales up 13.9% - growing faster than average tech!",
              profitMarginExplanation: "Keeps 28.6¢ profit per $1 sold – very healthy.",
              returnOnCapitalExplanation: "Earns back 28.7% on investments – great returns!"
            },
            explanation: "Alphabet (Google) is a money-making machine with strong growth, high profits, and efficient use of capital."
          },
          stability: {
            value: "Good", // Score: 75
            color: "green",
            details: {
              volatility: 26.6,
              beta: 1.03,
              dividendConsistency: "High", // Yield > 0 and Consistency = 1
              volatilityExplanation: "Average tech stock volatility (26.6%).",
              betaExplanation: "Moves slightly more than the market (1.03 beta).",
              dividendConsistencyExplanation: "Recently started paying dividends reliably."
            },
            explanation: "Alphabet offers average tech stock stability with reliable (but new) dividends."
          },
          value: {
            value: "Good", // Score: 70
            color: "green",
            details: {
              peRatio: 19.40,
              pbRatio: 5.86,
              dividendYield: 0.51,
              peRatioExplanation: "Costs $19.40 for $1 profit – cheaper than average tech!",
              pbRatioExplanation: "Stock price is ~6x its 'book value' – reasonable for its growth.",
              dividendYieldExplanation: "Tiny dividend (0.51%) - just started paying."
            },
            explanation: "Alphabet looks reasonably valued, especially compared to other big tech, and now pays a small dividend."
          },
          momentum: {
            value: "Poor", // Score: 11
            color: "red",
            details: {
              threeMonthReturn: -21.01,
              relativePerformance: -4.23,
              rsi: 32.84,
              threeMonthReturnExplanation: "Down 21% recently – a major slump.",
              relativePerformanceExplanation: "Also did worse than the market (-4.2%).",
              rsiExplanation: "Very oversold (RSI 32.8), extreme weakness."
            },
            explanation: "Alphabet's stock took a big hit recently, underperforming the market. It looks very oversold."
          }
        },
        synopsis: { // Placeholder synopsis
          price: "Recovering from dip, focus on AI integration and ad market.",
          company: "Dominates search advertising, rapidly growing cloud and AI divisions.",
          role: "Core holding for exposure to digital advertising and AI trends."
        },
        overallAnalysis: "Alphabet (Google) remains a dominant force in advertising and a major player in cloud and AI. Strong financials and reasonable valuation make it appealing, despite recent weak stock momentum.",
        chartData: [165, 162, 160, 158, 155, 153, 154, 156, 157, 155, 156, 156.06], // Placeholder
        industry: "Tech"
      },
      {
        name: "NVIDIA",
        ticker: "NVDA",
        price: 111.43,
        change: 3.1, // Placeholder
        rating: 8.5, // Placeholder rating
        smartScore: "Outperform", // Calculated Placeholder
        description: "Designs graphics processing units (GPUs), chipsets, and related multimedia software.",
        oneYearReturn: "18.48%",
        predictedPrice: "$174.19",
        metrics: {
          performance: {
            value: "Good", // Score: 100 (Capped)
            color: "green",
            details: {
              revenueGrowth: 114.20,
              profitMargin: 55.85,
              returnOnCapital: 81.60,
              revenueGrowthExplanation: "Sales exploded +114%! Absolutely insane growth.",
              profitMarginExplanation: "Keeps 56¢ profit per $1 sold – unbelievably profitable.",
              returnOnCapitalExplanation: "Makes back 81.6% on investments – phenomenal returns."
            },
            explanation: "NVIDIA's growth and profits are off the charts, driven by AI chip demand. Best-in-class performance."
          },
          stability: {
            value: "Poor", // Score: 15
            color: "red",
            details: {
              volatility: 56.7,
              beta: 1.95,
              dividendConsistency: "High", // Yield > 0 and Consistency = 1
              volatilityExplanation: "Very volatile (56.7%) - big daily price swings.",
              betaExplanation: "Moves almost twice as much as the market (1.95 beta)!",
              dividendConsistencyExplanation: "Pays its tiny dividend reliably."
            },
            explanation: "NVIDIA is a wild ride – very volatile and moves way more than the market. Dividend is stable but tiny."
          },
          value: {
            value: "Poor", // Score: 2
            color: "red",
            details: {
              peRatio: 37.31,
              pbRatio: 33.84,
              dividendYield: 0.04,
              peRatioExplanation: "Costs $37 for $1 profit – very expensive, even for tech.",
              pbRatioExplanation: "Stock price is ~34x its 'book value' – astronomical expectations.",
              dividendYieldExplanation: "Dividend is basically zero (0.04%)."
            },
            explanation: "NVIDIA is extremely expensive by almost every measure. You're paying a massive premium for its growth."
          },
          momentum: {
            value: "Poor", // Score: 29
            color: "red",
            details: {
              threeMonthReturn: -21.79,
              relativePerformance: 11.38,
              rsi: 39.23,
              threeMonthReturnExplanation: "Down 21.8% recently – sharp pullback.",
              relativePerformanceExplanation: "Still beat the market index (+11.4%) despite the drop!",
              rsiExplanation: "Very weak buying (RSI 39.2), nearing oversold."
            },
            explanation: "NVIDIA pulled back hard recently but still outperformed the market index. Looks weak and possibly oversold short-term."
          }
        },
        synopsis: { // Placeholder synopsis
          price: "Consolidating after massive AI-driven rally.",
          company: "Leader in AI accelerators and GPUs, benefiting from data center boom.",
          role: "High-growth, high-volatility play on AI and computing trends."
        },
        overallAnalysis: "NVIDIA is the undisputed leader in AI chips, leading to explosive growth. However, it's extremely volatile and trades at very high valuation multiples. High risk, high reward.",
        chartData: [120, 118, 115, 112, 110, 108, 110, 112, 114, 113, 111, 111.43], // Placeholder
        industry: "Tech"
      },
      {
          name: "IBM",
          ticker: "IBM",
          price: 244.00,
          change: -0.5, // Placeholder
          rating: 5.5, // Placeholder rating
          smartScore: "Average", // Calculated Placeholder
          description: "Provides integrated solutions and services worldwide through software, consulting, and infrastructure.",
          oneYearReturn: "29.44%",
          predictedPrice: "$255.71",
          metrics: {
            performance: {
              value: "Poor", // Score: 27
              color: "red",
              details: {
                revenueGrowth: 1.45,
                profitMargin: 9.60,
                returnOnCapital: 7.54,
                revenueGrowthExplanation: "Sales growth is very slow (1.45%).",
                profitMarginExplanation: "Keeps only 9.6¢ profit per $1 sold – quite low for tech.",
                returnOnCapitalExplanation: "Earns back only 7.5% on investments – not very efficient."
              },
              explanation: "IBM's growth and profitability are sluggish compared to the tech average. It's struggling to keep up."
            },
            stability: {
              value: "Good", // Score: 89
              color: "green",
              details: {
                volatility: 27.0,
                beta: 0.66,
                dividendConsistency: "High", // Yield > 0 and Consistency = 1
                volatilityExplanation: "Average tech stock volatility (27.0%).",
                betaExplanation: "Moves much less than the market (0.66 beta) - quite stable!",
                dividendConsistencyExplanation: "Very reliable dividend payer."
              },
              explanation: "IBM is surprisingly stable for a tech stock, moving less than the market and paying reliable dividends."
            },
            value: {
              value: "Poor", // Score: 33
              color: "red",
              details: {
                peRatio: 38.02,
                pbRatio: 8.28,
                dividendYield: 2.74,
                peRatioExplanation: "Costs $38 for $1 profit – expensive for its slow growth.",
                pbRatioExplanation: "Stock price is ~8x its 'book value' – seems high.",
                dividendYieldExplanation: "Pays a decent dividend (2.74%) - income appeal."
              },
              explanation: "IBM looks expensive given its slow growth, but it offers a solid dividend yield for income seekers."
            },
            momentum: {
              value: "Average", // Score: 60
              color: "yellow",
              details: {
                threeMonthReturn: 8.73,
                relativePerformance: 22.34,
                rsi: 44.34,
                threeMonthReturnExplanation: "Up 8.7% recently – decent short-term gain.",
                relativePerformanceExplanation: "Crushed the market index (+22.3%) lately!",
                rsiExplanation: "Buying interest is weak (RSI 44.3), but not oversold."
              },
              explanation: "IBM had a good run recently, strongly beating the market, but buying interest remains weak."
            }
          },
          synopsis: { // Placeholder synopsis
            price: "Showing strength, focusing on hybrid cloud and AI consulting.",
            company: "Legacy tech giant pivoting to cloud and AI, leveraging enterprise relationships.",
            role: "Value/income play in tech, less volatile than high-growth names."
          },
          overallAnalysis: "IBM is an 'old tech' company trying to reinvent itself with cloud and AI. It's more stable and pays a better dividend than most tech, but growth is slow and valuation seems high for its performance.",
          chartData: [230, 235, 238, 240, 242, 245, 243, 241, 244, 246, 245, 244.00], // Placeholder
          industry: "Tech"
      },
      {
          name: "Zoom Video (ZM)",
          ticker: "ZM",
          price: 76.78,
          change: 0.8, // Placeholder
          rating: 4.0, // Placeholder rating
          smartScore: "Average", // Calculated Placeholder
          description: "Provides a video-first communications platform.",
          oneYearReturn: "12.80%",
          predictedPrice: "$91.61",
          metrics: {
            performance: {
              value: "Poor", // Score: 36
              color: "red",
              details: {
                revenueGrowth: 3.05,
                profitMargin: 21.65,
                returnOnCapital: 11.26,
                revenueGrowthExplanation: "Sales growth slowed way down (3%).",
                profitMarginExplanation: "Keeps 21.6¢ profit per $1 sold – still decent.",
                returnOnCapitalExplanation: "Earns back 11.3% on investments – okay efficiency."
              },
              explanation: "Zoom's growth has slowed dramatically post-pandemic, but it remains reasonably profitable."
            },
            stability: {
              value: "Good", // Score: 86
              color: "green",
              details: {
                volatility: 29.0,
                beta: 0.66,
                dividendConsistency: "N/A", // Yield = 0
                volatilityExplanation: "Average tech volatility (29.0%).",
                betaExplanation: "Moves way less than the market (0.66 beta) - surprisingly stable.",
                dividendConsistencyExplanation: "Doesn't pay dividends."
              },
              explanation: "Zoom stock is less jumpy than you might expect and doesn't follow the market closely. Doesn't pay dividends."
            },
            value: {
              value: "Average", // Score: 60
              color: "yellow",
              details: {
                peRatio: 23.37,
                pbRatio: 2.56,
                dividendYield: 0.00,
                peRatioExplanation: "Costs $23.37 for $1 profit – reasonable for tech.",
                pbRatioExplanation: "Stock price is ~2.6x 'book value' – looks fair.",
                dividendYieldExplanation: "Pays no dividend."
              },
              explanation: "Zoom looks fairly valued based on its numbers, unlike many high-growth tech stories. No dividend income."
            },
            momentum: {
              value: "Average", // Score: 50
              color: "yellow",
              details: {
                threeMonthReturn: -12.64,
                relativePerformance: 5.70,
                rsi: 41.72,
                threeMonthReturnExplanation: "Down 12.6% recently – continued weakness.",
                relativePerformanceExplanation: "Still managed to beat the market index (+5.7%) though.",
                rsiExplanation: "Weak buying interest (RSI 41.7), nearing oversold."
              },
              explanation: "Zoom stock dropped recently but still beat the market. Buying interest is pretty weak."
            }
          },
          synopsis: { // Placeholder synopsis
            price: "Stabilizing after post-pandemic correction, focus on enterprise growth.",
            company: "Expanding beyond video conferencing into broader communication platform.",
            role: "Potential value play in software, sensitive to remote work trends."
          },
          overallAnalysis: "Zoom is trying to find its footing after the pandemic boom. Growth has slowed, but it's fairly valued and surprisingly stable. Future depends on expanding its business offerings.",
          chartData: [80, 78, 76, 75, 77, 79, 78, 77, 76, 75, 76, 76.78], // Placeholder
          industry: "Tech"
      },
       {
        name: "Shopify",
        ticker: "SHOP",
        price: 102.52,
        change: 2.5, // Placeholder
        rating: 6.5, // Placeholder rating
        smartScore: "Outperform", // Calculated Placeholder
        description: "Provides a cloud-based commerce platform for small and medium-sized businesses.",
        oneYearReturn: "23.11%",
        predictedPrice: "$133.27",
        metrics: {
          performance: {
            value: "Good", // Score: 83
            color: "green",
            details: {
              revenueGrowth: 25.78,
              profitMargin: 22.74,
              returnOnCapital: 17.19,
              revenueGrowthExplanation: "Sales grew 25.8% - very strong growth!",
              profitMarginExplanation: "Keeps 22.7¢ profit per $1 sold – healthy profits.",
              returnOnCapitalExplanation: "Earns back 17.2% on investments – solid efficiency."
            },
            explanation: "Shopify is growing fast and making good profits while using its money efficiently. Strong performance."
          },
          stability: {
            value: "Poor", // Score: 6
            color: "red",
            details: {
              volatility: 59.0,
              beta: 2.82,
              dividendConsistency: "N/A", // Yield = 0
              volatilityExplanation: "Extremely volatile (59.0%) - expect huge swings!",
              betaExplanation: "Moves almost 3x the market (2.82 beta)! Very sensitive.",
              dividendConsistencyExplanation: "Doesn't pay dividends."
            },
            explanation: "Shopify is a rollercoaster stock – very volatile and reacts strongly to market moves. No dividends."
          },
          value: {
            value: "Poor", // Score: 4
            color: "red",
            details: {
              peRatio: 62.20,
              pbRatio: 10.83,
              dividendYield: 0.00,
              peRatioExplanation: "Costs $62 for $1 profit – very expensive!",
              pbRatioExplanation: "Stock price ~11x 'book value' – sky-high expectations.",
              dividendYieldExplanation: "Pays no dividend."
            },
            explanation: "Shopify is very expensive, reflecting high growth expectations from investors. Not an income stock."
          },
          momentum: {
            value: "Average", // Score: 52
            color: "yellow",
            details: {
              threeMonthReturn: -12.25,
              relativePerformance: 16.01,
              rsi: 41.51,
              threeMonthReturnExplanation: "Down 12.2% recently – pulling back.",
              relativePerformanceExplanation: "Still crushed the market index (+16%) though!",
              rsiExplanation: "Weak buying (RSI 41.5), maybe getting oversold."
            },
            explanation: "Shopify stock dropped lately but still outperformed the market significantly. Buying interest is weak."
          }
        },
        synopsis: { // Placeholder synopsis
          price: "Volatile trading, tied to e-commerce trends and merchant growth.",
          company: "Leading platform for online stores, expanding into enterprise and offline.",
          role: "High-growth e-commerce play, sensitive to consumer spending."
        },
        overallAnalysis: "Shopify empowers online businesses and has grown incredibly fast. It's highly volatile and expensive, making it a high-risk, high-reward bet on e-commerce growth.",
        chartData: [110, 108, 105, 103, 100, 102, 105, 103, 101, 104, 103, 102.52], // Placeholder
        industry: "Tech"
      },
      {
        name: "Palantir (PLTR)",
        ticker: "PLTR",
        price: 90.09,
        change: 4.1, // Placeholder
        rating: 7.8, // Placeholder rating
        smartScore: "Outperform", // Calculated Placeholder
        description: "Builds software platforms for data analysis for government agencies and large corporations.",
        oneYearReturn: "244.92%",
        predictedPrice: "$94.39", // Note: Analyst target is lower than current price
        metrics: {
          performance: {
            value: "Average", // Score: 54
            color: "yellow",
            details: {
              revenueGrowth: 28.79,
              profitMargin: 16.13,
              returnOnCapital: 8.89,
              revenueGrowthExplanation: "Sales grew 28.8% - very fast!",
              profitMarginExplanation: "Keeps 16¢ profit per $1 sold – okay, improving.",
              returnOnCapitalExplanation: "Earns back 8.9% on investments – could be better."
            },
            explanation: "Palantir is growing revenues very quickly, but profitability and efficiency still need improvement."
          },
          stability: {
            value: "Poor", // Score: 8
            color: "red",
            details: {
              volatility: 59.9,
              beta: 2.74,
              dividendConsistency: "N/A", // Yield = 0
              volatilityExplanation: "Super volatile (59.9%) - massive price swings!",
              betaExplanation: "Moves almost 3x the market (2.74 beta) - very reactive!",
              dividendConsistencyExplanation: "Doesn't pay dividends."
            },
            explanation: "Palantir stock is extremely volatile and reacts strongly to market news. No dividends here."
          },
          value: {
            value: "Poor", // Score: 0 (Capped)
            color: "red",
            details: {
              peRatio: 453.99,
              pbRatio: 40.13,
              dividendYield: 0.00,
              peRatioExplanation: "Costs $454 for $1 profit – astronomically expensive!",
              pbRatioExplanation: "Stock price is 40x its 'book value' – insane expectations.",
              dividendYieldExplanation: "Pays no dividend."
            },
            explanation: "Palantir is one of the most expensively valued tech stocks based on current earnings. Pure growth bet."
          },
          momentum: {
            value: "Average", // Score: 68
            color: "yellow",
            details: {
              threeMonthReturn: 4.21,
              relativePerformance: 237.82, // Note: Extreme relative performance
              rsi: 46.51,
              threeMonthReturnExplanation: "Up 4.2% recently – modest gain.",
              relativePerformanceExplanation: "BUT it absolutely destroyed the market index (+237%)!!",
              rsiExplanation: "Buying interest is average (RSI 46.5)."
            },
            explanation: "Palantir gained a bit recently but its longer-term outperformance vs the market is staggering. Momentum is currently neutral."
          }
        },
        synopsis: { // Placeholder synopsis
          price: "Highly volatile, driven by government contracts and AI narrative.",
          company: "Data analytics platform expanding commercial business alongside government work.",
          role: "Speculative high-growth play on data analytics and AI adoption."
        },
        overallAnalysis: "Palantir provides powerful data analysis tools, especially for governments. It's growing fast but is extremely volatile and very expensive. A high-risk stock tied to AI hype and contract wins.",
        chartData: [85, 88, 92, 90, 88, 91, 93, 95, 92, 91, 90, 90.09], // Placeholder
        industry: "Tech"
      },
      {
        name: "Fortinet (FTNT)",
        ticker: "FTNT",
        price: 99.54,
        change: 1.1, // Placeholder
        rating: 7.9, // Placeholder rating
        smartScore: "Outperform", // Calculated Placeholder
        description: "Provides broad, integrated, and automated cybersecurity solutions worldwide.",
        oneYearReturn: "43.22%",
        predictedPrice: "$115.44",
        metrics: {
          performance: {
            value: "Good", // Score: 88
            color: "green",
            details: {
              revenueGrowth: 12.27,
              profitMargin: 29.30,
              returnOnCapital: 68.86,
              revenueGrowthExplanation: "Sales grew 12.3% - right at the tech average.",
              profitMarginExplanation: "Keeps 29.3¢ profit per $1 sold – very profitable!",
              returnOnCapitalExplanation: "Earns back an amazing 68.9% on investments – super efficient!"
            },
            explanation: "Fortinet performs strongly with average growth but excellent profitability and capital returns."
          },
          stability: {
            value: "Good", // Score: 71
            color: "green",
            details: {
              volatility: 33.0,
              beta: 1.08,
              dividendConsistency: "N/A", // Yield = 0
              volatilityExplanation: "Above average tech volatility (33.0%).",
              betaExplanation: "Moves slightly more than the market (1.08 beta).",
              dividendConsistencyExplanation: "Doesn't pay dividends."
            },
            explanation: "Fortinet is a bit more volatile than average tech but mostly moves with the market. No dividends paid."
          },
          value: {
            value: "Poor", // Score: 14
            color: "red",
            details: {
              peRatio: 42.74,
              pbRatio: 49.60,
              dividendYield: 0.00,
              peRatioExplanation: "Costs $42.74 for $1 profit – quite expensive.",
              pbRatioExplanation: "Stock price is ~50x 'book value' – very high expectations.",
              dividendYieldExplanation: "Pays no dividend."
            },
            explanation: "Fortinet is expensive by standard measures, reflecting its strong performance and cybersecurity demand."
          },
          momentum: {
            value: "Average", // Score: 62
            color: "yellow",
            details: {
              threeMonthReturn: -1.24,
              relativePerformance: 36.12,
              rsi: 39.98,
              threeMonthReturnExplanation: "Down 1.2% recently – basically flat.",
              relativePerformanceExplanation: "Still crushed the market index (+36.1%)!",
              rsiExplanation: "Weak buying interest (RSI 40), slightly oversold."
            },
            explanation: "Fortinet's price was flat recently but still way outperformed the market index. Buying interest is low."
          }
        },
        synopsis: { // Placeholder synopsis
          price: "Consolidating near highs, benefiting from cybersecurity demand.",
          company: "Leader in network security, expanding into cloud and endpoint protection.",
          role: "Growth stock in the resilient cybersecurity sector."
        },
        overallAnalysis: "Fortinet is a top cybersecurity company with excellent profitability and efficiency. While expensive, its strong market position and the growing need for security provide tailwinds. Stock momentum is currently muted.",
        chartData: [95, 97, 99, 101, 103, 102, 100, 98, 99, 100, 99, 99.54], // Placeholder
        industry: "Tech"
      },
       {
        name: "C3.ai (AI)",
        ticker: "AI",
        price: 22.53,
        change: -0.8, // Placeholder
        rating: 2.1, // Placeholder rating
        smartScore: "Underperform", // Calculated Placeholder
        description: "Provides enterprise artificial intelligence software for digital transformation.",
        oneYearReturn: "-19.40%",
        predictedPrice: "$30.79",
        metrics: {
          performance: {
            value: "Poor", // Score: 21
            color: "red",
            details: {
              revenueGrowth: 23.79,
              profitMargin: -76.84, // Negative Profit Margin
              returnOnCapital: -32.78, // Negative ROC
              revenueGrowthExplanation: "Sales grew 23.8% - strong growth!",
              profitMarginExplanation: "Loses 77¢ for every $1 sold – burning cash fast.",
              returnOnCapitalExplanation: "Losing 32.8% on investments – highly inefficient currently."
            },
            explanation: "C3.ai is growing sales quickly but losing a LOT of money. It's far from profitable or efficient right now."
          },
          stability: {
            value: "Poor", // Score: 15
            color: "red",
            details: {
              volatility: 89.0,
              beta: 1.98,
              dividendConsistency: "N/A", // Yield = 0
              volatilityExplanation: "Insanely volatile (89.0%) - huge price swings!",
              betaExplanation: "Moves about twice as much as the market (1.98 beta).",
              dividendConsistencyExplanation: "Doesn't pay dividends."
            },
            explanation: "C3.ai is extremely volatile and highly sensitive to market moves. A very risky stock, no dividends."
          },
          value: {
            value: "Poor", // Score: 34 (P/E N/A, uses PB & Yield)
            color: "red",
            details: {
              peRatio: 9999, // Using placeholder for N/A
              pbRatio: 3.36,
              dividendYield: 0.00,
              peRatioExplanation: "Doesn't have profits, so P/E ratio doesn't apply.",
              pbRatioExplanation: "Stock price ~3.4x 'book value' – fair for a tech company.",
              dividendYieldExplanation: "Pays no dividend."
            },
            explanation: "C3.ai isn't profitable, so P/E doesn't work. Based on assets, it looks fairly valued, but pays no dividend."
          },
          momentum: {
            value: "Poor", // Score: 18
            color: "red",
            details: {
              threeMonthReturn: -38.92,
              relativePerformance: -26.50,
              rsi: 36.69,
              threeMonthReturnExplanation: "Down 38.9% recently – collapsed.",
              relativePerformanceExplanation: "Did much worse than the market index (-26.5%).",
              rsiExplanation: "Very weak buying (RSI 36.7), looks very oversold."
            },
            explanation: "C3.ai stock crashed recently, badly underperforming the market. Looks extremely oversold."
          }
        },
        synopsis: { // Placeholder synopsis
          price: "Highly volatile stock driven by AI hype and financial results.",
          company: "Enterprise AI platform seeking broader adoption and path to profitability.",
          role: "Highly speculative play on enterprise AI adoption."
        },
        overallAnalysis: "C3.ai offers enterprise AI software, tapping into a major trend. However, it's losing significant money, highly volatile, and its stock has performed poorly recently. A very speculative investment.",
        chartData: [30, 28, 25, 23, 21, 20, 22, 24, 23, 22, 21, 22.53], // Placeholder
        industry: "Tech"
      },
      {
        name: "DigitalOcean (DOCN)",
        ticker: "DOCN",
        price: 35.53,
        change: -0.2, // Placeholder
        rating: 4.5, // Placeholder rating
        smartScore: "Neutral", // Calculated Placeholder
        description: "Provides cloud computing platform for developers and small-to-medium businesses.",
        oneYearReturn: "-12.09%",
        predictedPrice: "$45.46",
        metrics: {
          performance: {
            value: "Poor", // Score: 31
            color: "red",
            details: {
              revenueGrowth: 12.66,
              profitMargin: 10.82,
              returnOnCapital: 5.98,
              revenueGrowthExplanation: "Sales grew 12.7% - matching tech average.",
              profitMarginExplanation: "Keeps 10.8¢ profit per $1 sold – quite low.",
              returnOnCapitalExplanation: "Earns back only 6% on investments – inefficient."
            },
            explanation: "DigitalOcean's growth is average, but profitability and efficiency are weak compared to other tech."
          },
          stability: {
            value: "Poor", // Score: 24
            color: "red",
            details: {
              volatility: 37.0,
              beta: 1.84,
              dividendConsistency: "N/A", // Yield = 0
              volatilityExplanation: "High volatility (37.0%) - expect significant swings.",
              betaExplanation: "Moves almost twice the market (1.84 beta) - very reactive.",
              dividendConsistencyExplanation: "Doesn't pay dividends."
            },
            explanation: "DigitalOcean stock is quite volatile and sensitive to market moves. It pays no dividend."
          },
          value: {
            value: "Poor", // Score: 28 (P/B N/A, uses PE & Yield)
            color: "red",
            details: {
              peRatio: 39.30,
              pbRatio: 9999, // Placeholder for N/A
              dividendYield: 0.00,
              peRatioExplanation: "Costs $39.30 for $1 profit – expensive.",
              pbRatioExplanation: "P/B ratio not available.",
              dividendYieldExplanation: "Pays no dividend."
            },
            explanation: "DigitalOcean looks expensive based on its earnings (P/E). No dividend income."
          },
          momentum: {
            value: "Poor", // Score: 25
            color: "red",
            details: {
              threeMonthReturn: -3.96,
              relativePerformance: -19.19,
              rsi: 35.52,
              threeMonthReturnExplanation: "Down 4% recently – modest drop.",
              relativePerformanceExplanation: "Did much worse than the market index (-19.2%).",
              rsiExplanation: "Very weak buying (RSI 35.5), looks oversold."
            },
            explanation: "DigitalOcean stock dropped slightly but lagged the market significantly. Looks weak and oversold."
          }
        },
        synopsis: { // Placeholder synopsis
          price: "Trading sideways, focus on SMB cloud market.",
          company: "Cloud provider targeting developers and startups with simple offerings.",
          role: "Growth potential in niche cloud market, but faces intense competition."
        },
        overallAnalysis: "DigitalOcean serves developers and smaller businesses in the cloud market. Performance is weak, and the stock is volatile and expensive. Faces tough competition from larger cloud providers.",
        chartData: [38, 37, 36, 35, 34, 36, 37, 36, 35, 34, 35, 35.53], // Placeholder
        industry: "Tech"
      },
      {
        name: "Fastly (FSLY)",
        ticker: "FSLY",
        price: 6.69,
        change: -0.3, // Placeholder
        rating: 1.5, // Placeholder rating
        smartScore: "Underperform", // Calculated Placeholder
        description: "Provides edge cloud platform for processing, serving, and securing applications.",
        oneYearReturn: "-48.37%",
        predictedPrice: "$7.79",
        metrics: {
          performance: {
            value: "Poor", // Score: 1
            color: "red",
            details: {
              revenueGrowth: 7.45,
              profitMargin: -29.07, // Negative Profit Margin
              returnOnCapital: -11.77, // Negative ROC
              revenueGrowthExplanation: "Sales growth is slow (7.4%).",
              profitMarginExplanation: "Loses 29¢ for every $1 sold – losing money.",
              returnOnCapitalExplanation: "Losing 11.8% on investments – burning cash."
            },
            explanation: "Fastly's growth is slow, and it's losing money with negative returns on investment. Poor performance."
          },
          stability: {
            value: "Poor", // Score: 24
            color: "red",
            details: {
              volatility: 68.9,
              beta: 1.41,
              dividendConsistency: "N/A", // Yield = 0
              volatilityExplanation: "Extremely volatile (68.9%) - massive price swings likely.",
              betaExplanation: "Moves ~40% more than the market (1.41 beta).",
              dividendConsistencyExplanation: "Doesn't pay dividends."
            },
            explanation: "Fastly is a very volatile stock, reacting strongly to market shifts. No dividend income."
          },
          value: {
            value: "Poor", // Score: 48 (P/E N/A, uses PB & Yield)
            color: "red",
            details: {
              peRatio: 9999, // Placeholder for N/A
              pbRatio: 0.96,
              dividendYield: 0.00,
              peRatioExplanation: "No profits, so P/E doesn't apply.",
              pbRatioExplanation: "Stock price is below 'book value' (0.96) – might be cheap on assets.",
              dividendYieldExplanation: "Pays no dividend."
            },
            explanation: "Fastly isn't profitable. It looks cheap based on assets (P/B < 1), but that reflects its struggles. No dividend."
          },
          momentum: {
            value: "Poor", // Score: 5
            color: "red",
            details: {
              threeMonthReturn: -35.16,
              relativePerformance: -55.47,
              rsi: 36.37,
              threeMonthReturnExplanation: "Down 35% recently – major drop.",
              relativePerformanceExplanation: "Way underperformed the market (-55.5%).",
              rsiExplanation: "Very weak buying (RSI 36.4), looks very oversold."
            },
            explanation: "Fastly stock has performed terribly recently, much worse than the market. Looks extremely weak and oversold."
          }
        },
        synopsis: { // Placeholder synopsis
          price: "Near lows, struggling with competition and profitability.",
          company: "Edge cloud provider facing intense competition in CDN and security.",
          role: "Highly speculative turnaround play in edge computing."
        },
        overallAnalysis: "Fastly operates in the competitive edge cloud space. It's struggling with slow growth, significant losses, and poor stock performance. Very high risk.",
        chartData: [8, 7.5, 7, 6.8, 6.5, 6.3, 6.5, 6.7, 6.9, 6.8, 6.7, 6.69], // Placeholder
        industry: "Tech"
      }
    ],

  "Real Estate": [
    {
      name: "Prologis",
      ticker: "PLD",
      price: 110.26,
      change: 0.8,
      rating: 3.6,
      oneYearReturn: "-13.27%",
      predictedPrice: "$128.79",
      metrics: {
        performance: {
          value: "Average",
          color: "yellow",
          details: {
            revenueGrowth: 2.2,
            profitMargin: 45.4,
            returnOnCapital: 4.3,
            revenueGrowthExplanation: "Prologis isn't making much more money than last year (2.2% growth is sluggish).",
            profitMarginExplanation: "Prologis keeps $45 of every $100 it makes - very profitable for real estate.",
            returnOnCapitalExplanation: "Average return on investment - getting $4.30 for every $100 invested."
          },
          explanation: "Prologis isn't making much more money than last year (growth is OK, not great)."
        },
        stability: {
          value: "Poor",
          color: "red",
          details: {
            volatility: 8.6,
            beta: 1.24,
            dividendConsistency: "Medium",
            volatilityExplanation: "Price moves are moderate - not too wild but not super steady either.",
            betaExplanation: "When the market drops 10%, Prologis often falls a bit more (about 12%).",
            dividendConsistencyExplanation: "Prologis reliably pays dividends but sometimes changes the amount."
          },
          explanation: "Prologis is one of the steadier REITs with consistent payouts. It doesn't swing wildly."
        },
        value: {
          value: "Average",
          color: "yellow",
          details: {
            peRatio: 28.0,
            pbRatio: 1.9,
            dividendYield: 3.7,
            peRatioExplanation: "You pay $28 for every $1 of yearly earnings - slightly expensive.",
            pbRatioExplanation: "The stock costs less than twice the value of the company's assets.",
            dividendYieldExplanation: "Prologis pays you $3.70 per year for every $100 invested."
          },
          explanation: "Prologis is fairly priced for what you get - a solid company with decent income."
        },
        momentum: {
          value: "Average",
          color: "yellow",
          details: {
            threeMonthReturn: 6.1,
            relativePerformance: -2.0,
            rsi: 37.4,
            threeMonthReturnExplanation: "Prologis has grown 6.1% over the last three months - better than most REITs.",
            relativePerformanceExplanation: "It's falling slightly behind the wider market by about 2%.",
            rsiExplanation: "Buying interest is a bit weak right now - could be ready for a comeback."
          },
          explanation: "Prologis isn't making big moves either way lately. It's just coasting."
        }
      },
      description: "A leading global owner, operator and developer of logistics real estate.",
      synopsis: {
        price: "Trading at 110.26, reflecting modest recent gains despite market volatility.",
        company: "Global leader in logistics real estate with significant e-commerce exposure.",
        role: "Core holding for real estate allocation with balance of growth and income."
      },
      overallAnalysis: "Prologis brings in reliable income and holds its value over time. It's a strong option for people who prefer stability and are okay with slower movement.",
      chartData: [96, 101, 97, 104, 108, 96, 98, 103, 107, 109, 110.26],
      industry: "Real Estate"
    },
    {
      name: "Realty Income Corp",
      ticker: "O",
      price: 56.28,
      change: 1.29,
      rating: 4.0,
      oneYearReturn: "7.88%",
      predictedPrice: "$62.04",
      description: "A monthly dividend paying REIT focused on single-tenant commercial properties.",
      metrics: {
        performance: {
          value: "Average",
          color: "yellow",
          details: {
            revenueGrowth: 29.5,
            profitMargin: 16.0,
            returnOnCapital: 1.30,
            revenueGrowthExplanation: "Sales grew nearly 30% - much faster than most REITs due to acquisitions.",
            profitMarginExplanation: "Keeps $16 of every $100 it makes - decent but not stellar for real estate.",
            returnOnCapitalExplanation: "Gets only $1.30 back for every $100 invested - below average efficiency."
          },
          explanation: "Realty Income is expanding and profitable, but not very efficient with its money."
        },
        stability: {
          value: "Average",
          color: "yellow",
          details: {
            volatility: 6.93,
            beta: 0.82,
            dividendConsistency: "Good",
            volatilityExplanation: "Price moves are mild - this stock doesn't jump around much day-to-day.",
            betaExplanation: "When markets fall 10%, Realty Income typically falls only about 8%.",
            dividendConsistencyExplanation: "Famous for monthly dividends that have grown for 25+ consecutive years."
          },
          explanation: "Realty Income doesn't move around much and pays consistently. It's a safe pick for steady hands."
        },
        value: {
          value: "Average",
          color: "yellow",
          details: {
            peRatio: 57.6,
            pbRatio: 1.29,
            dividendYield: 5.7,
            peRatioExplanation: "You pay nearly $58 for every $1 of yearly earnings - expensive by normal standards.",
            pbRatioExplanation: "Trading at only 1.3x its book value - a reasonable price for its physical assets.",
            dividendYieldExplanation: "Pays you $5.70 per year for every $100 invested - that's excellent income."
          },
          explanation: "Realty Income is all about slow, steady income. It won't skyrocket, but it'll keep delivering."
        },
        momentum: {
          value: "Average",
          color: "yellow",
          details: {
            threeMonthReturn: 6.6,
            relativePerformance: -1.5,
            rsi: 49.3,
            threeMonthReturnExplanation: "Gained 6.6% in the last three months - decent but not spectacular.",
            relativePerformanceExplanation: "Performing slightly worse than the broader market by about 1.5%.",
            rsiExplanation: "Buying and selling pressure are balanced - the stock isn't overbought or oversold."
          },
          explanation: "Realty Income hasn't made big moves lately and isn't drawing much investor attention."
        }
      },
      synopsis: {
        price: "Trading at 56.28 with slight recent weakness despite attractive yield.",
        company: "Premier monthly dividend REIT with diverse commercial property portfolio.",
        role: "Income cornerstone for dividend-focused investors seeking reliability."
      },
      overallAnalysis: "Realty Income is a slow-moving stock that focuses on steady, reliable income. It won't deliver fast gains, but it's great for investors who want monthly dividends and long-term stability.",
      chartData: [52, 54, 51, 54, 58, 56, 55, 57, 58, 56, 56.28],
      industry: "Real Estate"
    },
    {
      name: "Simon Property Group",
      ticker: "SPG",
      price: 166.12,
      change: 0.55,
      rating: 3.2,
      oneYearReturn: "9.97%",
      predictedPrice: "$180.33",
      description: "The largest owner and operator of shopping malls and premium outlets in the US.",
      metrics: {
        performance: {
          value: "Good",
          color: "green",
          details: {
            revenueGrowth: 5.4,
            profitMargin: 41.9,
            returnOnCapital: 9.97
          },
          explanation: "Simon Property Group is profitable and efficient, even if growth is a bit slow."
        },
        stability: {
          value: "Poor",
          color: "red",
          details: {
            volatility: 9.01,
            beta: 1.49,
            dividendConsistency: "Poor"
          },
          explanation: "Simon Property Group moves around a lot and doesn't always pay on time. It's not the safest option."
        },
        value: {
          value: "Average",
          color: "yellow",
          details: {
            peRatio: 22,
            pbRatio: 18.68,
            dividendYield: 5.1
          },
          explanation: "Simon Property Group may look pricey on paper, but its dividend helps justify the value."
        },
        momentum: {
          value: "Poor",
          color: "red",
          details: {
            threeMonthReturn: -3.1,
            relativePerformance: -11,
            rsi: 41.9
          },
          explanation: "Simon Property Group hasn't had much recent action and is underperforming."
        }
      },
      synopsis: {
        price: "Trading at 166.12 with some recent strength despite longer-term underperformance.",
        company: "Dominant mall operator with premium locations and evolving business model.",
        role: "Value opportunity in retail real estate with above-average income potential."
      },
      overallAnalysis: "Simon Property Group owns top-tier malls and shopping centers. While retail has challenges, their premium locations give them staying power and a solid income stream.",
      chartData: [158, 162, 155, 159, 163, 155, 157, 162, 167, 164, 166.12],
      industry: "Real Estate"
    },
    {
      name: "AvalonBay Communities",
      ticker: "AVB",
      price: 214.36,
      change: 0.82,
      rating: 4.1,
      oneYearReturn: "17.77%",
      predictedPrice: "$238.64",
      description: "A leading apartment REIT focused on high-quality properties in premium coastal markets.",
      metrics: {
        performance: {
          value: "Good",
          color: "green",
          details: {
            revenueGrowth: 4.9,
            profitMargin: 36.5,
            returnOnCapital: 5.6
          },
          explanation: "AvalonBay is making good money from the high rents in its luxury apartments."
        },
        stability: {
          value: "Average",
          color: "yellow",
          details: {
            volatility: 6.93,
            beta: 0.89,
            dividendConsistency: "Good"
          },
          explanation: "AvalonBay moves at its own pace and not by market swings too much. Its dividend is reliable."
        },
        value: {
          value: "Average",
          color: "yellow",
          details: {
            peRatio: 28.2,
            pbRatio: 2.55,
            dividendYield: 3.3
          },
          explanation: "AvalonBay has a modest price tag and pays a fair dividend."
        },
        momentum: {
          value: "Poor",
          color: "red",
          details: {
            threeMonthReturn: -2.4,
            relativePerformance: -10,
            rsi: 47.8
          },
          explanation: "AvalonBay has been lagging behind other stocks lately."
        }
      },
      synopsis: {
        price: "Trading at 214.36 with modest recent gains despite quarter-to-date weakness.",
        company: "Premium apartment owner/operator in supply-constrained coastal markets.",
        role: "Quality residential real estate exposure with inflation protection features."
      },
      overallAnalysis: "AvalonBay owns luxury apartments in places where it's expensive to buy a home. They do well when housing prices are high because more people need to rent instead of buy.",
      chartData: [205, 210, 202, 208, 215, 204, 207, 211, 219, 213, 214.36],
      industry: "Real Estate"
    },
    {
      name: "Public Storage",
      ticker: "PSA",
      price: 294.93,
      change: -0.3,
      rating: 6.9,
      oneYearReturn: "6.94%",
      predictedPrice: "$338",
      description: "The world's largest owner and operator of self-storage facilities.",
      metrics: {
        performance: {
          value: "Good",
          color: "green",
          details: {
            revenueGrowth: 3.9,
            profitMargin: 39.9,
            returnOnCapital: 10.2
          },
          explanation: "Public Storage makes good money with little effort - their business basically runs itself."
        },
        stability: {
          value: "Average",
          color: "yellow",
          details: {
            volatility: 9.01,
            beta: 0.8,
            dividendConsistency: "Good"
          },
          explanation: "Public Storage isn't too worried about what the market does - it follows its own path and pays steady dividends."
        },
        value: {
          value: "Poor",
          color: "red",
          details: {
            peRatio: 27.7,
            pbRatio: 9.65,
            dividendYield: "4.2%"
          },
          explanation: "Public Storage is expensive compared to what it owns, but the 4.2% dividend helps make up for that."
        },
        momentum: {
          value: "Poor",
          color: "red",
          details: {
            threeMonthReturn: -1.7,
            relativePerformance: -9.7,
            rsi: 43.5
          },
          explanation: "Public Storage isn't attracting much attention lately and has slipped a bit compared to similar stocks."
        }
      },
      synopsis: {
        price: "Trading at 294.93 with slight recent weakness following longer downtrend.",
        company: "Dominant self-storage operator with recession-resistant business model.",
        role: "Defensive real estate holding with steady income and inflation protection."
      },
      overallAnalysis: "Public Storage runs a simple business renting storage units, which keeps making money in good times and bad. It's a boring but reliable stock with good income.",
      chartData: [285, 290, 283, 288, 296, 287, 290, 295, 301, 296, 294.93],
      industry: "Real Estate"
    },
    {
      name: "Digital Realty Trust",
      ticker: "DLR",
      price: 155.49,
      change: 0.88,
      rating: 5.8,
      oneYearReturn: "12.81%",
      predictedPrice: "$179.95",
      description: "A leading global provider of data center, colocation and interconnection solutions.",
      metrics: {
        performance: {
          value: "Poor",
          color: "red",
          details: {
            revenueGrowth: 1.4,
            profitMargin: 10.1,
            returnOnCapital: 1.43
          },
          explanation: "Below-average revenue growth with significantly lower profit margins and returns on capital than REIT peers. High capital intensity of data center development creates financial performance challenges."
        },
        stability: {
          value: "Poor",
          color: "red",
          details: {
            volatility: 10.74,
            beta: 0.92,
            dividendConsistency: "Good"
          },
          explanation: "Higher volatility despite moderate beta indicates price instability regardless of market direction. Strong dividend growth history is a positive counterbalance to price volatility."
        },
        value: {
          value: "Poor",
          color: "red",
          details: {
            peRatio: 95.6,
            pbRatio: 2.54,
            dividendYield: 3.2
          },
          explanation: "Very high P/E ratio and moderate price-to-book suggests premium valuation with growth expectations. Below-average dividend yield for a REIT reflects the market's focus on future growth over current income."
        },
        momentum: {
          value: "Poor",
          color: "red",
          details: {
            threeMonthReturn: -12.1,
            relativePerformance: -20,
            rsi: 50.1
          },
          explanation: "Significant price weakness both on absolute basis and relative to peers. Neutral RSI despite underperformance suggests selling pressure may be stabilizing."
        }
      },
      synopsis: {
        price: "Trading at 155.49 with recent strength following notable prior weakness.",
        company: "Global data center provider with both colocation and hyperscale offerings.",
        role: "Technology-oriented real estate exposure with growth and income potential."
      },
      overallAnalysis: "Technology-focused REIT providing data center exposure with better growth than traditional real estate while maintaining income characteristics. Benefits from cloud computing, AI workloads, and growing digital infrastructure demands.",
      chartData: [168, 172, 165, 160, 158, 149, 146, 151, 157, 152, 155.49],
      industry: "Real Estate"
    },
    {
      name: "American Tower Corp",
      ticker: "AMT",
      price: 212.8,
      change: 1.5,
      rating: 7.3,
      oneYearReturn: "15.42%",
      predictedPrice: "$245.35",
      description: "The largest global owner and operator of wireless communications infrastructure.",
      metrics: {
        performance: {
          value: "Average",
          color: "yellow",
          details: {
            revenueGrowth: -3.0,
            profitMargin: 20.9,
            returnOnCapital: 5.24
          },
          explanation: "Revenue contraction is a concern, partially offset by decent profit margins and return on capital. Recent financial performance reflects temporary integration challenges with acquisitions."
        },
        stability: {
          value: "Average",
          color: "yellow",
          details: {
            volatility: 9.01,
            beta: 0.89,
            dividendConsistency: "Good"
          },
          explanation: "Slightly higher volatility but below-average beta indicates less correlation with broader market movements. Consistent dividend growth history demonstrates financial stability."
        },
        value: {
          value: "Poor",
          color: "red",
          details: {
            peRatio: 44.2,
            pbRatio: 29.41,
            dividendYield: 3.2
          },
          explanation: "High P/E ratio and extremely high price-to-book value indicate significant premium to asset value. Below-average dividend yield for a REIT suggests investors are paying for expected future growth."
        },
        momentum: {
          value: "Good",
          color: "green",
          details: {
            threeMonthReturn: 15.1,
            relativePerformance: 7.1,
            rsi: 61.1
          },
          explanation: "Strong recent price performance both on absolute basis and compared to peers. Moderately high RSI indicates positive momentum without reaching extreme overbought levels."
        }
      },
      synopsis: {
        price: "Trading at 212.80 with solid momentum after extended period of weakness.",
        company: "Global leader in wireless tower infrastructure essential for mobile networks.",
        role: "Technology-adjacent real estate with combination of growth and income."
      },
      overallAnalysis: "Essential wireless infrastructure provider with defensive characteristics and consistent income from long-term leases. Benefits from increasing data consumption and 5G expansion for continued stable growth.",
      chartData: [185, 190, 182, 195, 200, 189, 196, 204, 208, 210, 212.8],
      industry: "Real Estate"
    },
    {
      name: "Welltower Inc",
      ticker: "WELL",
      price: 149.84,
      change: 1.8,
      rating: 6.4,
      oneYearReturn: "19.65%",
      predictedPrice: "$167.30",
      description: "A healthcare REIT specializing in senior housing, post-acute care, and outpatient medical properties.",
      metrics: {
        performance: {
          value: "Poor",
          color: "red",
          details: {
            revenueGrowth: 20.4,
            profitMargin: 6.3,
            returnOnCapital: 1.06
          },
          explanation: "Exceptional revenue growth but significantly below-average profit margins and return on capital. Growth-focused strategy currently prioritizes scale over operational efficiency."
        },
        stability: {
          value: "Average",
          color: "yellow",
          details: {
            volatility: 7.62,
            beta: 0.94,
            dividendConsistency: "Poor"
          },
          explanation: "Moderate volatility and beta indicate average price stability. Historic dividend cuts during pandemic reflect vulnerability of healthcare properties to certain crisis scenarios."
        },
        value: {
          value: "Poor",
          color: "red",
          details: {
            peRatio: 182.2,
            pbRatio: 2.98,
            dividendYield: 1.9
          },
          explanation: "Extremely high P/E ratio and average price-to-book value indicate significant premium valuation. Very low dividend yield for a REIT reflects both valuation and lower payout ratio focused on growth."
        },
        momentum: {
          value: "Good",
          color: "green",
          details: {
            threeMonthReturn: 19.3,
            relativePerformance: 11.3,
            rsi: 54.7
          },
          explanation: "Exceptional recent price performance both on absolute basis and relative to peers. Moderate RSI suggests strong buying interest without reaching extreme levels."
        }
      },
      synopsis: {
        price: "Trading at 149.84 with strong recent momentum reflecting sector recovery.",
        company: "Leading senior housing and healthcare property owner with demographic tailwinds.",
        role: "Growth-oriented healthcare real estate exposure with aging population thesis."
      },
      overallAnalysis: "Healthcare REIT with strong demographic tailwinds from an aging population. Combines defensive characteristics and recession resistance with above-average growth potential in senior housing and medical facilities.",
      chartData: [125, 130, 127, 132, 138, 128, 135, 140, 145, 147, 149.84],
      industry: "Real Estate"
    },
    {
      name: "Boston Properties",
      ticker: "BXP",
      price: 69.48,
      change: -1.2,
      rating: 5.5,
      oneYearReturn: "-5.32%",
      predictedPrice: "$74.90",
      description: "The largest publicly-traded developer, owner and manager of Class A office properties.",
      metrics: {
        performance: {
          value: "Poor",
          color: "red",
          details: {
            revenueGrowth: 4.1,
            profitMargin: 0.4,
            returnOnCapital: 0.06
          },
          explanation: "Modest revenue growth but extremely poor profit margins and negligible return on capital. Office property challenges have severely impacted financial performance metrics."
        },
        stability: {
          value: "Average",
          color: "yellow",
          details: {
            volatility: 10.39,
            beta: 1.08,
            dividendConsistency: "Poor"
          },
          explanation: "Higher volatility and above-average beta indicate more price instability and market correlation. Past dividend cuts reflect vulnerability to office sector challenges."
        },
        value: {
          value: "Average",
          color: "yellow",
          details: {
            peRatio: 785,
            pbRatio: 2.03,
            dividendYield: 5.7
          },
          explanation: "Extremely high P/E ratio due to depressed earnings, but reasonable price-to-book value suggests potential value. Very attractive dividend yield offers compelling income if sustainable."
        },
        momentum: {
          value: "Poor",
          color: "red",
          details: {
            threeMonthReturn: -6.4,
            relativePerformance: -14.4,
            rsi: 52.5
          },
          explanation: "Significant price weakness both on absolute basis and compared to peers. Neutral RSI suggests balanced buying and selling despite underperformance."
        }
      },
      synopsis: {
        price: "Trading at 69.48 with recent weakness indicating ongoing sector concerns.",
        company: "Premium office property owner facing work-from-home and oversupply challenges.",
        role: "Deep value opportunity in office real estate with significant income yield."
      },
      overallAnalysis: "Premium office REIT trading at historical discount due to work-from-home trends and financing concerns. Offers exceptional value for contrarian investors willing to accept higher risk for potential recovery upside.",
      chartData: [75, 78, 72, 74, 76, 71, 73, 75, 70, 70.5, 69.48],
      industry: "Real Estate"
    },
    {
      name: "Equity Residential",
      ticker: "EQR",
      price: 71.36,
      change: 0.4,
      rating: 6.7,
      oneYearReturn: "4.25%",
      predictedPrice: "$77.50",
      description: "A leading multifamily residential REIT focused on urban and high-density suburban communities.",
      metrics: {
        performance: {
          value: "Good",
          color: "green",
          details: {
            revenueGrowth: 3.8,
            profitMargin: 34.9,
            returnOnCapital: 5.59
          },
          explanation: "Moderate revenue growth with strong profit margins and solid return on capital. Effective property management and operational efficiency support financial performance."
        },
        stability: {
          value: "Average",
          color: "yellow",
          details: {
            volatility: 7.97,
            beta: 0.88,
            dividendConsistency: "Medium"
          },
          explanation: "Moderate volatility with below-average beta indicates reasonable price stability. Mixed dividend history with some variability but general upward trend over time."
        },
        value: {
          value: "Average",
          color: "yellow",
          details: {
            peRatio: 26.8,
            pbRatio: 2.46,
            dividendYield: 3.9
          },
          explanation: "Trades at a reasonable P/E multiple with typical price-to-book value for apartment REITs. Slightly below-average dividend yield is balanced by superior property quality and locations."
        },
        momentum: {
          value: "Poor",
          color: "red",
          details: {
            threeMonthReturn: 1.7,
            relativePerformance: -6.3,
            rsi: 52.8
          },
          explanation: "Modest absolute price gains but underperformance compared to broader real estate sector. Neutral RSI suggests balanced market sentiment currently."
        }
      },
      synopsis: {
        price: "Trading at 71.36 with modest recent gains despite sector rotation headwinds.",
        company: "Premier apartment owner focusing on urban and transit-oriented communities.",
        role: "Quality residential real estate exposure with focus on millennial renters."
      },
      overallAnalysis: "High-quality apartment REIT with superior property locations and demographic advantages. Well-positioned for urban rental recovery as return-to-office trends increase demand for convenient housing in employment centers.",
      chartData: [69, 72, 68, 71, 73, 68, 70, 72, 74, 71, 71.36],
      industry: "Real Estate"
    }
  ]
};

Object.keys(hardcodedStocks).forEach(industry => {
  hardcodedStocks[industry].forEach(stock => {
    if (!stock.chartData) {
      // Generate random chart data if not present
      const basePrice = stock.price * 0.99;
      stock.chartData = Array(12).fill(0).map((_, i) => {
        return +(basePrice + (Math.random() * stock.price * 0.03)).toFixed(2);
      });
      // Make the last data point match the current price
      stock.chartData[stock.chartData.length - 1] = stock.price;
    }
  });
});

// Get all available stocks from all industries
export const getAllStocks = (): StockData[] => {
  const allStocks: StockData[] = [];
  
  // Combine stocks from all available industries
  Object.keys(hardcodedStocks).forEach(industry => {
    allStocks.push(...hardcodedStocks[industry]);
  });
  
  console.log(`Found ${allStocks.length} total stocks across all industries`);
  return allStocks;
};

export const getIndustryStocks = (industry: string): StockData[] => {
  // Map from the stack industry names to the hardcoded stock industry names
  const industryMapping: Record<string, string> = {
    // Direct mappings
    "Tech": "Tech",
    "Retail": "Retail",
    "Real Estate": "Real Estate",

    
    // Map stack explorer industry names to our existing hardcoded stocks
    "Technology": "Tech",
    "Consumer": "Retail",
    "Healthcare": "Healthcare", // Temporarily using Tech stocks for Healthcare until we have real healthcare data
    "ESG": "ESG", // Temporarily using Tech stocks for ESG until we have real ESG data
    
    // Map server-defined stack industries to our hardcoded stock industries
    "Investing": "Tech", // Fallback to Tech for now
    "Cryptocurrency": "Tech", // Fallback to Tech for now
  };

  console.log(`Industry mapping: "${industry}" → "${industryMapping[industry] || industry}"`);
  
  // Get the mapped industry or use the original
  const mappedIndustry = industryMapping[industry] || industry;
  
  // Return hardcoded stocks if available for the industry
  const stocks = hardcodedStocks[mappedIndustry] || [];
  console.log(`Found ${stocks.length} stocks for mapped industry "${mappedIndustry}"`);
  
  return stocks;
};