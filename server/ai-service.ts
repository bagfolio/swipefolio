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
}

export async function getAIResponse(message: string, context?: AIRequestContext): Promise<string> {
  try {
    // Set up system message with instructions about the app
    const systemMessage = `You are an AI financial advisor in the Swipefolio app, helping users understand investments in a fun, engaging way.

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
        max_tokens: 500,
        temperature: 0.7,
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