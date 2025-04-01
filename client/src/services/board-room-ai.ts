import axios from 'axios';
import { CompanyMetrics, EnhancedBoardRoomDecision } from '@/types/game';

// Type for the decision history used for AI context
interface DecisionHistory {
  title: string;
  selectedOptionId: string;
  impacts: {
    metric: string;
    value: number;
    category: 'Growth' | 'Stability' | 'Momentum' | 'Value';
  }[];
}

// Type for the game state passed to AI
interface GameState {
  playerName: string;
  companyName: string;
  industry: string;
  metrics: CompanyMetrics;
  decisions: DecisionHistory[];
}

// Constants for the narrative arc
export const NARRATIVE_STAGES = [
  "Company Establishment",
  "Market Expansion",
  "Competitive Challenge",
  "Innovation Decision",
  "Economic Downturn",
  "Regulatory Issue",
  "Talent Management",
  "Acquisition Opportunity",
  "International Expansion",
  "Legacy Planning"
];

// Fallback pre-written scenarios by stage
const FALLBACK_SCENARIOS: Record<string, EnhancedBoardRoomDecision[]> = {
  "Company Establishment": [
    {
      id: "initial_funding",
      title: "Initial Funding Strategy",
      description: "As the new CEO of your company, you need to decide how to secure initial funding for operations and growth.",
      stage: "Company Establishment",
      learningObjective: "Understanding different funding sources and their impact on company ownership and finances.",
      options: [
        {
          id: "venture_capital",
          text: "Seek venture capital funding by selling 30% equity stake",
          impacts: [
            { metric: "Cash Reserves", value: 25, category: "Stability" },
            { metric: "Ownership Control", value: -15, category: "Value" },
            { metric: "Growth Potential", value: 20, category: "Growth" }
          ],
          explanation: "Venture capital provides significant upfront cash but dilutes your ownership and adds pressure for rapid growth."
        },
        {
          id: "bootstrapping",
          text: "Bootstrap the company with minimal external funding",
          impacts: [
            { metric: "Cash Reserves", value: -5, category: "Stability" },
            { metric: "Ownership Control", value: 30, category: "Value" },
            { metric: "Growth Potential", value: -10, category: "Growth" }
          ],
          explanation: "Bootstrapping maintains full control but limits your ability to scale quickly or weather financial challenges."
        },
        {
          id: "strategic_partner",
          text: "Partner with an established company in your industry",
          impacts: [
            { metric: "Cash Reserves", value: 15, category: "Stability" },
            { metric: "Market Access", value: 25, category: "Growth" },
            { metric: "Operational Independence", value: -10, category: "Value" }
          ],
          explanation: "Strategic partnerships provide resources and market access but may restrict some business decisions."
        }
      ]
    },
    {
      id: "headquarters_selection",
      title: "Headquarters Location",
      description: "You need to decide where to establish your company headquarters, which will affect recruitment, costs, and business environment.",
      stage: "Company Establishment",
      learningObjective: "How location decisions impact operational costs, talent acquisition, and tax implications.",
      options: [
        {
          id: "major_tech_hub",
          text: "Establish in a major tech hub with high visibility (San Francisco, NYC)",
          impacts: [
            { metric: "Operating Costs", value: -20, category: "Stability" },
            { metric: "Talent Acquisition", value: 30, category: "Growth" },
            { metric: "Brand Reputation", value: 20, category: "Value" }
          ],
          explanation: "Major hubs offer excellent talent pools and networking but come with significantly higher costs."
        },
        {
          id: "emerging_city",
          text: "Choose an emerging tech city with lower costs (Austin, Raleigh)",
          impacts: [
            { metric: "Operating Costs", value: 15, category: "Stability" },
            { metric: "Talent Acquisition", value: 15, category: "Growth" },
            { metric: "Work-Life Balance", value: 20, category: "Value" }
          ],
          explanation: "Emerging tech cities balance reasonable costs with good talent availability and quality of life."
        },
        {
          id: "remote_first",
          text: "Adopt a remote-first approach with minimal office space",
          impacts: [
            { metric: "Operating Costs", value: 30, category: "Stability" },
            { metric: "Company Culture", value: -10, category: "Value" },
            { metric: "Talent Pool Size", value: 25, category: "Growth" }
          ],
          explanation: "Remote-first significantly reduces costs and expands your talent pool globally, but can make building culture more challenging."
        }
      ]
    }
  ],
  "Market Expansion": [
    {
      id: "expansion_strategy",
      title: "Market Expansion Strategy",
      description: "Your company is ready to expand. Which approach will you take to enter new markets?",
      stage: "Market Expansion",
      learningObjective: "The financial implications of different growth strategies and their risk/reward profiles.",
      options: [
        {
          id: "new_geographies",
          text: "Expand to new geographic regions with existing products",
          impacts: [
            { metric: "Revenue Growth", value: 15, category: "Growth" },
            { metric: "Operational Complexity", value: 10, category: "Stability" },
            { metric: "Marketing Expenses", value: 20, category: "Value" }
          ],
          explanation: "Geographic expansion leverages your proven products but requires understanding new markets and cultures."
        },
        {
          id: "new_products",
          text: "Develop new product lines for existing markets",
          impacts: [
            { metric: "R&D Expenses", value: 25, category: "Growth" },
            { metric: "Brand Synergy", value: 15, category: "Value" },
            { metric: "Product Risk", value: 20, category: "Stability" }
          ],
          explanation: "New product development capitalizes on your market knowledge but increases R&D costs and product risk."
        },
        {
          id: "acquisition",
          text: "Acquire a smaller competitor with complementary offerings",
          impacts: [
            { metric: "Debt Level", value: 30, category: "Stability" },
            { metric: "Market Share", value: 20, category: "Growth" },
            { metric: "Integration Complexity", value: 25, category: "Value" }
          ],
          explanation: "Acquisitions provide immediate scale but require careful integration and often increase debt."
        }
      ]
    }
  ],
  // Additional fallback scenarios would be added for other stages
};

// Default company metrics used when creating a new game
export const DEFAULT_COMPANY_METRICS: CompanyMetrics = {
  EPS: 1.5,
  PE_Ratio: 25.0,
  DebtLoad: 30.0,
  PB_Ratio: 3.2,
  Beta: 1.1,
  Volatility: 25.0,
  RevenueGrowth: 8.0,
  ProfitMargin: 12.0,
  RSI: 55.0,
  ROI: 15.0,
  ReturnOnCapital: 12.0,
  DividendYield: 1.8,
  
  // Core category scores
  Growth: 65.0,
  Stability: 60.0,
  Momentum: 55.0,
  Value: 50.0
};

/**
 * Generates an initial scenario for the Board Room game using AI
 */
export async function generateInitialScenario(
  playerName: string,
  companyName: string,
  industry: string
): Promise<EnhancedBoardRoomDecision> {
  const initialPrompt = `
    Generate a business scenario for ${playerName}, the new CEO of ${companyName} in the ${industry} industry.
    This is the beginning of their journey as CEO ("Company Establishment" stage). Create a compelling situation that involves
    early leadership decisions that will affect the company's future.
    
    The scenario should impact metrics like EPS, Revenue Growth, and Stability.
    
    Format the response as a JSON object with these fields:
    - id: unique ID string
    - title: short title for the decision
    - description: 1-2 paragraph scenario description
    - stage: "Company Establishment"
    - learningObjective: brief financial literacy concept being taught
    - options: array of 2-3 options, each with:
      - id: unique ID string
      - text: description of the option
      - impacts: array of impacts, each with:
        - metric: name of the metric affected
        - value: numeric value of impact (-30 to +30)
        - category: one of "Growth", "Stability", "Momentum", or "Value"
      - explanation: brief explanation of why this choice impacts the metrics
  `;

  try {
    const response = await axios.post('/api/ai-scenario', {
      prompt: initialPrompt
    });
    
    if (response.data && response.data.scenario) {
      return response.data.scenario as EnhancedBoardRoomDecision;
    } else {
      throw new Error("Invalid response format from AI service");
    }
  } catch (error) {
    console.error("Failed to generate initial scenario:", error);
    // Return a fallback scenario from pre-written content
    return FALLBACK_SCENARIOS["Company Establishment"][0];
  }
}

/**
 * Generates the next scenario based on game state and history
 */
export async function generateNextScenario(
  gameState: GameState,
  currentStage: string
): Promise<EnhancedBoardRoomDecision> {
  // Convert decision history to a text format for the AI prompt
  const decisionHistory = gameState.decisions.map(d => 
    `Decision: ${d.title}, Choice: ${d.selectedOptionId}, Impacts: ${d.impacts.map(i => `${i.metric} ${i.value > 0 ? '+' : ''}${i.value}%`).join(', ')}`
  ).join('\n');
  
  // Convert metrics to a readable format
  const metricsText = Object.entries(gameState.metrics)
    .map(([key, value]) => `${key}: ${value}`)
    .join(', ');
  
  const nextPrompt = `
    The player is ${gameState.playerName}, CEO of ${gameState.companyName} in the ${gameState.industry} industry.
    
    Their company currently has these metrics:
    ${metricsText}
    
    Previous decisions:
    ${decisionHistory}
    
    Current narrative stage: ${currentStage}
    
    Generate the next business scenario that logically follows from these decisions and fits the current
    narrative stage. The scenario should affect 2-3 metrics and impact one or more core categories: Growth, Stability, Momentum, Value.
    
    Include a relevant financial literacy concept explanation.
    
    Format the response as a JSON object with these fields:
    - id: unique ID string
    - title: short title for the decision
    - description: 1-2 paragraph scenario description
    - stage: "${currentStage}"
    - learningObjective: brief financial literacy concept being taught
    - options: array of 2-3 options, each with:
      - id: unique ID string
      - text: description of the option
      - impacts: array of impacts, each with:
        - metric: name of the metric affected
        - value: numeric value of impact (-30 to +30)
        - category: one of "Growth", "Stability", "Momentum", or "Value"
      - explanation: brief explanation of why this choice impacts the metrics
  `;

  try {
    const response = await axios.post('/api/ai-scenario', {
      prompt: nextPrompt
    });
    
    if (response.data && response.data.scenario) {
      return response.data.scenario as EnhancedBoardRoomDecision;
    } else {
      throw new Error("Invalid response format from AI service");
    }
  } catch (error) {
    console.error("Failed to generate next scenario:", error);
    
    // Find the appropriate fallback scenarios for this stage
    const stageFallbacks = FALLBACK_SCENARIOS[currentStage];
    if (stageFallbacks && stageFallbacks.length > 0) {
      // Choose a random scenario from the available fallbacks for this stage
      const randomIndex = Math.floor(Math.random() * stageFallbacks.length);
      return stageFallbacks[randomIndex];
    }
    
    // If no fallbacks for this stage, use Company Establishment as a last resort
    return FALLBACK_SCENARIOS["Company Establishment"][0];
  }
}

/**
 * Generates an explanation for why a specific decision impacts certain metrics
 */
export async function generateExplanation(
  metric: string,
  change: number,
  playerChoice: string
): Promise<string> {
  const prompt = `
    Explain in 2-3 sentences why a CEO's decision to "${playerChoice}" 
    would cause the company's ${metric} to change by ${change > 0 ? '+' : ''}${change}%.
    Make this explanation educational but conversational, as if a financial advisor
    is explaining it to a new investor.
  `;

  try {
    const response = await axios.post('/api/ai-insight', {
      prompt
    });
    
    if (response.data && response.data.explanation) {
      return response.data.explanation;
    } else {
      throw new Error("Invalid response format from AI service");
    }
  } catch (error) {
    console.error("Failed to generate explanation:", error);
    
    // Return a generic explanation if AI fails
    return change > 0
      ? `Choosing to ${playerChoice} typically improves ${metric} by increasing efficiency and creating new opportunities.`
      : `While choosing to ${playerChoice} may serve other strategic goals, it often negatively impacts ${metric} due to increased costs or market adjustments.`;
  }
}