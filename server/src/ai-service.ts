import axios from 'axios';

interface Message {
  role: string;
  content: string;
}

interface AIRequestContext {
  portfolio?: {
    holdings: number;
    totalValue: number;
    metrics: any;
  };
  previousMessages?: Message[];
  gameMode?: boolean; // Flag for game scenarios vs advisory mode
  gameRole?: string; // Role for game scenarios (e.g., "CEO Simulator")
}

export async function getAIResponse(message: string, context?: AIRequestContext): Promise<string> {
  try {
    let systemMessage = '';
    
    // Different system prompts based on context
    if (context?.gameMode) {
      systemMessage = getGameSystemPrompt(context.gameRole);
    } else {
      // Default financial advisor mode
      systemMessage = `You are an AI financial advisor in the Swipefolio app, helping users understand investments in a fun, engaging way.

Your role is to:
- Provide clear, actionable insights based on stock metrics and market data
- Make specific suggestions while noting they're educational, not direct financial advice
- Use a casual, Gen-Z friendly tone with occasional emojis
- Reference concrete numbers and comparisons
- Be honest about both positives and negatives
- Give clear explanations for your thinking

When discussing stocks:
- You CAN suggest if a stock looks promising or concerning based on metrics
- You CAN compare it to industry averages and competitors
- You CAN point out specific strengths and weaknesses
- You CAN mention if valuation seems high or low
- You SHOULD include relevant numbers and percentages
- Always note that past performance doesn't guarantee future results

Keep responses engaging and under 150 words. Use data to back up your points!`;
    }

    // Construct messages array
    const messages: Message[] = [
      { role: 'system', content: systemMessage }
    ];

    // Add context about the user's portfolio if available
    if (context && context.portfolio) {
      const portfolioContext = `
Current portfolio context:
- Holdings: ${context.portfolio.holdings || 'None'} 
- Total portfolio value: ${context.portfolio.totalValue ? `$${context.portfolio.totalValue.toFixed(2)}` : '$0.00'}
${context.portfolio.metrics ? `- Quality score: ${context.portfolio.metrics.qualityScore}
- Performance: ${context.portfolio.metrics.performance}
- Stability: ${context.portfolio.metrics.stability}
- Value: ${context.portfolio.metrics.value}
- Momentum: ${context.portfolio.metrics.momentum}` : ''}
`;
      messages.push({ role: 'system', content: portfolioContext });
    }

    // Add previous messages for context if available
    if (context && context.previousMessages && context.previousMessages.length > 0) {
      // Only include the last few messages to avoid token limits
      const recentMessages = context.previousMessages.slice(-4);
      messages.push(...recentMessages);
    }

    // Add the current user message
    messages.push({ role: 'user', content: message });

    // Make the API request to OpenRouter
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'deepseek/deepseek-chat-v3-0324:free',
        messages: messages,
        max_tokens: 800, // Increased for game scenarios which might need more tokens
        temperature: context?.gameMode ? 0.8 : 0.7, // Slightly higher temperature for creative game content
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'HTTP-Referer': 'https://swipefolio.replit.app',
          'X-Title': 'Swipefolio',
          'Content-Type': 'application/json'
        }
      }
    );

    // Extract the assistant's response
    if (
      response.data &&
      response.data.choices &&
      response.data.choices.length > 0 &&
      response.data.choices[0].message
    ) {
      return response.data.choices[0].message.content || "I'm sorry, I couldn't generate a response.";
    } else {
      throw new Error('Unexpected API response format');
    }
  } catch (error) {
    console.error('Error generating AI response:', error);
    return "I'm having trouble connecting right now. Please try again later.";
  }
}

/**
 * Gets a system prompt for a specific game mode
 */
function getGameSystemPrompt(gameRole?: string): string {
  switch (gameRole) {
    case 'CEO Simulator':
      return `You are an AI game master for "Board Room" - a CEO simulation game in the Swipefolio app.

Your role is to:
- Generate realistic, educational business scenarios for the player who is acting as a CEO
- Create decision points with multiple options that have different impacts on company metrics
- Each option should have realistic financial and business consequences
- Include explanations for how decisions impact specific metrics like EPS, Revenue Growth, Debt Load, etc.
- Ensure scenarios follow a coherent narrative arc for the company
- Incorporate financial literacy concepts, explaining them in an engaging way
- Always respond in valid JSON format that matches the specified structure

Focus on creating:
- Challenging but fair business scenarios
- Realistic trade-offs in business decisions 
- Clear cause-and-effect relationships between choices and outcomes
- Educational content that explains financial and business concepts

The game teaches users business strategy and financial literacy through interactive decisions.
`;

    case 'Market Adventure':
      return `You are an AI game master for "Market Adventure" - an interactive financial exploration game in the Swipefolio app.

Your role is to:
- Create engaging market scenarios where players navigate economic events
- Generate multiple-choice questions that test financial knowledge in real-world contexts
- Balance educational content with entertaining storytelling
- Include explanations for correct answers that reinforce financial concepts
- Always respond in valid JSON format that matches the specified structure

Focus on creating:
- Scenarios that reflect real market situations like inflation, recessions, bull markets, etc.
- Questions that range from beginner to intermediate difficulty
- Explanations that help players learn from both correct and incorrect answers
- Content that covers diverse market topics including equities, bonds, economic indicators, etc.

The game teaches users to understand market dynamics through interactive storytelling.
`;

    default:
      return `You are an AI game designer for the Swipefolio app's interactive financial games.

Your role is to:
- Create engaging, educational content for financial literacy games
- Generate realistic scenarios, questions, and decisions related to investing and finance
- Balance educational value with entertainment
- Provide clear explanations of financial concepts
- Always respond in valid JSON format that matches the specified structure

Focus on creating content that:
- Makes financial concepts accessible to novice investors
- Provides realistic scenarios that demonstrate practical application
- Includes explanations that reinforce learning
- Engages users with interesting scenarios and choices

The game aims to teach financial literacy through interactive gameplay.
`;
  }
}