// Define types for the game features

export interface MetricQuestion {
  metric: string;
  companyValue: string | number;
  industryAverage: string | number;
  isGood: boolean;
  explanation: string;
  id?: string; // Optional ID for easier reference
}

export interface BoardRoomDecision {
  id: string;
  title: string;
  description: string;
  options: {
    id: string;
    text: string;
    impact: {
      name: string;
      change: number;
    }[];
  }[];
}

export interface EnhancedBoardRoomDecision {
  id: string;
  title: string;
  description: string;
  stage: string; // narrative stage (e.g., "Company Establishment")
  learningObjective?: string; // financial literacy concept being taught
  options: {
    id: string;
    text: string;
    impacts: {
      metric: string;
      value: number;
      category: 'Growth' | 'Stability' | 'Momentum' | 'Value';
    }[];
    explanation?: string; // explanation of why this choice impacts metrics
  }[];
}

export interface MetricValue {
  name: string;
  value: number;
  previousValue?: number;
  category: 'Growth' | 'Stability' | 'Momentum' | 'Value';
  description?: string;
}

export interface CompanyMetrics {
  // Core financial metrics 
  EPS: number;
  PE_Ratio: number;
  DebtLoad: number;
  PB_Ratio: number;
  Beta: number;
  Volatility: number;
  RevenueGrowth: number;
  ProfitMargin: number;
  RSI: number;
  ROI: number;
  ReturnOnCapital: number;
  DividendYield: number;
  
  // Core category scores
  Growth: number;
  Stability: number;
  Momentum: number;
  Value: number;
}

export interface GameReward {
  id: string;
  name: string;
  description: string;
  ticketCost: number;
  acquired: boolean;
  type: 'badge' | 'theme' | 'unlock';
  icon?: string;
}

export interface LevelRequirement {
  level: number;
  xpRequired: number;
  rewards: {
    tickets: number;
    description: string;
  };
}