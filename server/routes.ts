import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import axios from "axios";
import { getAIResponse } from "./ai-service";

import yahooFinanceRoutes from "./api/yahoo-finance";
import { yahooFinanceService } from "./services/yahoo-finance-service";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);

  // Get all stacks
  app.get("/api/stacks", async (req, res) => {
    const stacks = await storage.getStacks();
    res.json(stacks);
  });

  // Get stack by ID
  app.get("/api/stacks/:id", async (req, res) => {
    const stackId = parseInt(req.params.id);
    const stack = await storage.getStackById(stackId);
    
    if (!stack) {
      return res.status(404).json({ message: "Stack not found" });
    }
    
    res.json(stack);
  });

  // Get cards by stack ID
  app.get("/api/stacks/:id/cards", async (req, res) => {
    const stackId = parseInt(req.params.id);
    const cards = await storage.getCardsByStackId(stackId);
    res.json(cards);
  });

  // Protected routes - require authentication
  app.use("/api/user-progress", (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    next();
  });

  // Get user progress for all stacks
  app.get("/api/user-progress", async (req, res) => {
    const userId = req.user!.id;
    const progress = await storage.getUserProgressByUserId(userId);
    res.json(progress);
  });

  // Get user progress for a specific stack
  app.get("/api/user-progress/:stackId", async (req, res) => {
    const userId = req.user!.id;
    const stackId = parseInt(req.params.stackId);
    
    const progress = await storage.getUserProgressByStackId(userId, stackId);
    
    if (!progress) {
      // If no progress exists, create a new one
      const newProgress = await storage.createUserProgress({
        userId,
        stackId,
        completed: false,
        currentCardIndex: 0,
        earnedXp: 0,
        lastAccessed: new Date()
      });
      return res.json(newProgress);
    }
    
    res.json(progress);
  });

  // Update user progress for a stack
  app.patch("/api/user-progress/:stackId", async (req, res) => {
    const userId = req.user!.id;
    const stackId = parseInt(req.params.stackId);
    
    const { currentCardIndex, completed, earnedXp } = req.body;
    let progress = await storage.getUserProgressByStackId(userId, stackId);
    
    if (!progress) {
      // If no progress exists, create a new one
      progress = await storage.createUserProgress({
        userId,
        stackId,
        completed: completed || false,
        currentCardIndex: currentCardIndex || 0,
        earnedXp: earnedXp || 0,
        lastAccessed: new Date()
      });
    } else {
      // Update existing progress
      progress = await storage.updateUserProgress(progress.id, {
        currentCardIndex: currentCardIndex !== undefined ? currentCardIndex : progress.currentCardIndex,
        completed: completed !== undefined ? completed : progress.completed,
        earnedXp: earnedXp !== undefined ? earnedXp : progress.earnedXp,
        lastAccessed: new Date()
      });
    }
    
    // If a lesson was completed, update daily progress
    if (completed && !progress?.completed) {
      // Check if user has daily progress for today
      const today = new Date();
      let dailyProgress = await storage.getUserDailyProgress(userId, today);
      
      if (!dailyProgress) {
        // Create new daily progress
        dailyProgress = await storage.createUserDailyProgress({
          userId,
          date: today,
          lessonsCompleted: 1,
          xpEarned: earnedXp || 0,
          goalCompleted: false
        });
      } else {
        // Update existing daily progress
        const newLessonsCompleted = dailyProgress.lessonsCompleted + 1;
        const newXpEarned = dailyProgress.xpEarned + (earnedXp || 0);
        const newGoalCompleted = newLessonsCompleted >= req.user!.dailyGoal;
        
        dailyProgress = await storage.updateUserDailyProgress(dailyProgress.id, {
          lessonsCompleted: newLessonsCompleted,
          xpEarned: newXpEarned,
          goalCompleted: newGoalCompleted
        });
      }
      
      // Update user XP
      const user = await storage.updateUser(userId, {
        xp: req.user!.xp + (earnedXp || 0)
      });
      
      // Check if a badge should be awarded (for the tech rookie badge)
      if (stackId === 1) {
        const existingBadges = await storage.getUserBadges(userId);
        const hasTechRookie = existingBadges.some(b => b.badgeName === "Tech Rookie");
        
        if (!hasTechRookie) {
          await storage.createUserBadge({
            userId,
            badgeName: "Tech Rookie",
            badgeDescription: "Completed your first tech industry stack",
            iconName: "computer-line",
            earnedOn: new Date()
          });
        }
      }
    }
    
    res.json(progress);
  });

  // Get user badges
  app.get("/api/user-badges", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const userId = req.user!.id;
    const badges = await storage.getUserBadges(userId);
    res.json(badges);
  });

  // Get user daily progress
  app.get("/api/user-daily-progress", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const userId = req.user!.id;
    const today = new Date();
    let dailyProgress = await storage.getUserDailyProgress(userId, today);
    
    if (!dailyProgress) {
      dailyProgress = await storage.createUserDailyProgress({
        userId,
        date: today,
        lessonsCompleted: 0,
        xpEarned: 0,
        goalCompleted: false
      });
    }
    
    res.json(dailyProgress);
  });

  // Ask AI endpoint
  app.post("/api/ai/ask-stock", async (req, res) => {
    try {
      console.log("Received AI request with body:", JSON.stringify(req.body, null, 2));
      const { userQuestion, stockContext } = req.body;
      
      if (!userQuestion || !stockContext) {
        console.error("Missing required fields in request:", req.body);
        return res.status(400).json({ 
          error: "Missing required fields", 
          message: "Both userQuestion and stockContext are required" 
        });
      }
      
      // Try to ensure we have the latest environment variable value
      const apiKey = process.env.OPENROUTER_API_KEY;
      console.log("Using OpenRouter API key (first 5 chars):", apiKey ? apiKey.substring(0, 5) + "..." : "undefined");
      
      if (!apiKey) {
        console.error("OpenRouter API key is missing");
        return res.status(500).json({ 
          error: "API key missing", 
          message: "OpenRouter API key is not configured" 
        });
      }
      
      // Construct the system prompt and user message
      const systemPrompt = "You're a knowledgeable and friendly financial guide helping users understand stocks in the Swipefolio app. " +
        "Use a conversational, slightly casual tone with simple language that Gen Z users will connect with. " +
        "When discussing stocks, you should: " +
        "- Explain key metrics, financials, and industry context in plain language " +
        "- Compare the stock to industry standards and competitors when relevant " +
        "- Highlight potential strengths, weaknesses, and interesting aspects based on the data " +
        "- Use occasional emojis for emphasis, but not excessively " +
        "- Make qualitative assessments based on the data (like 'strong fundamentals' or 'higher volatility') " +
        "- Feel free to note if the stock appears overvalued or undervalued based on metrics " +
        "- You can discuss whether the stock fits particular investment strategies (growth, value, etc.) " +
        "While you can provide educated perspectives, always make clear: " +
        "- You're not giving direct buy/sell recommendations but its okay to be suggestive in one way (not TOO explicit) based on the discussion " +
        "- Past performance doesn't guarantee future results " +
        "- You're providing education, and to a certain extent personalized financial advice (on the app specific situation) " +
        "Keep responses concise (1 paragraph max) and conversational, feel free to follow up question to continue the convrseation. Be helpful and informative! ";;
      
      // Build context string with stock information
      const contextString = `
        Stock Name: ${stockContext.name}
        Ticker: ${stockContext.ticker}
        ${stockContext.description ? `Description: ${stockContext.description}` : ''}
        ${stockContext.price ? `Current Price: $${stockContext.price}` : ''}
        ${stockContext.metrics && stockContext.metrics.performance ? `Performance Score: ${stockContext.metrics.performance}` : ''}
        ${stockContext.metrics && stockContext.metrics.value ? `Value Score: ${stockContext.metrics.value}` : ''}
        ${stockContext.industry ? `Industry: ${stockContext.industry}` : ''}
      `;
      
      const userMessage = `Context: ${contextString.trim()}\n\nQuestion: ${userQuestion}`;
      
      console.log("Making API call to OpenRouter with prompt:", userMessage);
      console.log("Using API key:", apiKey.substring(0, 5) + "..." + apiKey.substring(apiKey.length - 4));
      
      // Make the API call to OpenRouter following their documentation exactly
      const openRouterUrl = 'https://openrouter.ai/api/v1/chat/completions';
      const requestData = {
        model: "google/gemini-2.0-flash-lite-001", // Using correct model ID from documentation
        messages: [
          { role: "system", content: systemPrompt },
          { 
            role: "user", 
            content: [
              {
                type: "text",
                text: userMessage
              }
            ]
          }
        ]
      };
      
      // Ensure we're using the correct API key format
      const apiKeyValue = process.env.OPENROUTER_API_KEY;
      console.log("Sending request to OpenRouter with API key starting with:", 
        apiKeyValue ? apiKeyValue.substring(0, 8) + "..." : "undefined");
      
      // Following the example in the OpenRouter documentation exactly
      const response = await axios.post(
        openRouterUrl,
        requestData,
        {
          headers: {
            'Authorization': `Bearer ${apiKeyValue}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://swipefolio.replit.app', // Site URL for OpenRouter rankings
            'X-Title': 'Swipefolio Finance' // Site name for OpenRouter rankings
          }
        }
      );
      
      console.log("OpenRouter API response status:", response.status);
      console.log("OpenRouter API response data:", JSON.stringify(response.data, null, 2));
      
      // Extract the AI's response - handling both formats (string or array of content objects)
      if (response.data && response.data.choices && response.data.choices.length > 0) {
        let answer;
        const content = response.data.choices[0].message.content;
        
        // Handle different response formats
        if (typeof content === 'string') {
          answer = content;
        } else if (Array.isArray(content) && content.length > 0) {
          // Extract from content array structure (if API returns in this format)
          const textContents = content
            .filter(item => item.type === 'text')
            .map(item => item.text)
            .join('\n');
          answer = textContents || 'No text content found in response';
        } else {
          // Fallback - try to stringify the content if it's neither string nor array
          answer = JSON.stringify(content);
        }
        
        console.log("Successfully extracted answer:", answer.substring(0, 50) + "...");
        return res.json({ answer });
      } else {
        console.error("Invalid API response format:", response.data);
        return res.status(500).json({ 
          error: "Invalid API response", 
          message: "The AI service returned an unexpected response format",
          data: response.data
        });
      }
    } catch (error: any) {
      console.error("Error in AI request:", error);
      
      // Define the structure for our error response
      interface AIErrorResponse {
        error: string;
        message: string;
        details?: {
          status?: number;
          data?: any;
        };
      }
      
      let errorResponse: AIErrorResponse = { 
        error: "AI service error", 
        message: error instanceof Error ? error.message : "Unknown error occurred"
      };
      
      // Add more detailed error information if available
      if (error.response) {
        console.error("Error response status:", error.response.status);
        console.error("Error response data:", error.response.data);
        
        // Create a new custom error response with additional details
        errorResponse = {
          error: "AI service error", 
          message: error instanceof Error ? error.message : "Unknown error occurred",
          details: {
            status: error.response.status,
            data: error.response.data
          }
        };
      }
      
      return res.status(500).json(errorResponse);
    }
  });
  
  // Portfolio Analysis AI endpoint
  app.post("/api/ai/portfolio-analysis", async (req, res) => {
    try {
      console.log("Received portfolio analysis request");
      const { query, portfolioData, totalValue, overallReturn, portfolioQuality } = req.body;
      
      // Validate request body
      if (!query || !portfolioData) {
        return res.status(400).json({ 
          error: "INVALID_REQUEST", 
          message: "Query and portfolio data are required" 
        });
      }
      
      // Prepare system message with instructions
      const systemPrompt = " You're a savvy financial coach for Gen Z investors using Swipefolio. Make investing accessible and engaging! " +
        "When analyzing portfolios: " +
        "- Be direct and conversational - talk like a knowledgeable friend, not a textbook " +
        "- Give specific feedback about their actual holdings and allocation " +
        "- Point out potential strengths ('Your tech picks are diversified across different segments 👍') " +
        "- Highlight issues clearly ('Your portfolio is heavily weighted toward tech, which increases risk') " +
        "- Suggest specific improvements they could consider " +
        "- Use 1-2 emojis strategically to emphasize key points " +
        "- Acknowledge both good moves and areas for improvement " +
        "- Break down complex concepts into simple terms " +
        "- Give them actionable next steps they could take " +
        "Format your response with: " +
        "- A quick assessment of their current situation " +
        "- 2-3 specific insights about their holdings or strategy " +
        "- 1-2 clear suggestions they could implement " +
        "Keep it under 200 words total, using short paragraphs with natural breaks. " +
        "You can make qualitative judgments about their portfolio composition, diversification, risk level, " +
        "and alignment with common investment strategies. Just avoid specific buy/sell recommendations (its okay to be pretty suggestive but do not EXPLCIITLY say a name) for individual stocks.";;
      
      // Prepare portfolio context
      const portfolioContext = `
        Total Value: $${totalValue ? totalValue.toFixed(2) : '0.00'}
        Overall Return: ${overallReturn ? overallReturn.toFixed(2) : '0.00'}%
        Portfolio Quality Score: ${portfolioQuality || 0}/100
        
        Holdings:
        ${portfolioData.map((stock: any) => 
          `${stock.name} (${stock.symbol}): $${stock.value.toFixed(2)} (${stock.allocation.toFixed(2)}% of portfolio) | Return: ${stock.return.toFixed(2)}%`
        ).join('\n')}
      `;
      
      const userMessage = `${portfolioContext.trim()}\n\nQuery: ${query}`;
      
      console.log("Calling AI API for portfolio analysis...");
      
      // Get the portfolio advice
      try {
        const answer = await getAIResponse(userMessage, {
          portfolio: {
            holdings: portfolioData.length,
            totalValue: totalValue || 0,
            metrics: {
              overallReturn: overallReturn || 0,
              portfolioQuality: portfolioQuality || 0,
            }
          },
          gameMode: false
        });
        
        console.log("Successfully got portfolio analysis:", answer.substring(0, 50) + "...");
        return res.json({ analysis: answer });
      } catch (aiError: any) {
        console.error("Error getting AI response:", aiError);
        
        return res.status(500).json({
          error: "AI_SERVICE_ERROR",
          message: aiError instanceof Error ? aiError.message : "Failed to get AI response"
        });
      }
    } catch (error: any) {
      console.error("Error in portfolio analysis request:", error);
      
      // Define the structure for our error response
      interface AIErrorResponse {
        error: string;
        message: string;
        details?: {
          status?: number;
          data?: any;
        };
      }
      
      let errorResponse: AIErrorResponse = { 
        error: "Portfolio analysis error", 
        message: error instanceof Error ? error.message : "Unknown error occurred"
      };
      
      return res.status(500).json(errorResponse);
    }
  });
  
  // Financial Game AI endpoint
  app.post("/api/ai/financial-game", async (req, res) => {
    try {
      console.log("Received financial game request");
      const { gameContext, playerInput, gameMode } = req.body;
      
      if (!gameContext || !playerInput) {
        return res.status(400).json({ 
          error: "INVALID_REQUEST", 
          message: "Game context and player input are required" 
        });
      }
      
      console.log(`Game mode: ${gameMode}, Player input: ${playerInput.substring(0, 50)}...`);
      
      const gameRole = gameMode || "Financial Advisor";
      
      try {
        const response = await getAIResponse(playerInput, {
          gameMode: true,
          gameRole: gameRole,
          previousMessages: gameContext.messages || []
        });
        
        console.log("Successfully got game response:", response.substring(0, 50) + "...");
        return res.json({ 
          response,
          gameState: {
            currentMode: gameMode
          }
        });
      } catch (aiError: any) {
        console.error("Error getting AI game response:", aiError);
        
        return res.status(500).json({
          error: "AI_SERVICE_ERROR",
          message: aiError instanceof Error ? aiError.message : "Failed to get AI response for game"
        });
      }
    } catch (error: any) {
      console.error("Error in financial game request:", error);
      
      // Define the structure for our error response
      interface AIErrorResponse {
        error: string;
        message: string;
        details?: {
          status?: number;
          data?: any;
        };
      }
      
      let errorResponse: AIErrorResponse = { 
        error: "Financial game error", 
        message: error instanceof Error ? error.message : "Unknown error occurred"
      };
      
      return res.status(500).json(errorResponse);
    }
  });
  
  // Market Analysis AI endpoint
  app.post("/api/ai/market-analysis", async (req, res) => {
    try {
      console.log("Received market analysis request");
      const { query, marketData } = req.body;
      
      if (!query) {
        return res.status(400).json({ 
          error: "INVALID_REQUEST", 
          message: "Query is required" 
        });
      }
      
      // Construct market context
      const marketContext = marketData ? 
        `Market Data:\n${JSON.stringify(marketData, null, 2)}` : 
        "No specific market data provided.";
      
      const userMessage = `${marketContext}\n\nQuery: ${query}`;
      
      try {
        const answer = await getAIResponse(userMessage, {
          gameMode: false
        });
        
        console.log("Successfully got market analysis:", answer.substring(0, 50) + "...");
        return res.json({ analysis: answer });
      } catch (aiError: any) {
        console.error("Error getting AI market analysis:", aiError);
        
        return res.status(500).json({
          error: "AI_SERVICE_ERROR",
          message: aiError instanceof Error ? aiError.message : "Failed to get AI response for market analysis"
        });
      }
    } catch (error: any) {
      console.error("Error in market analysis request:", error);
      
      // Define the structure for our error response
      interface AIErrorResponse {
        error: string;
        message: string;
        details?: {
          status?: number;
          data?: any;
        };
      }
      
      let errorResponse: AIErrorResponse = { 
        error: "Market analysis error", 
        message: error instanceof Error ? error.message : "Unknown error occurred"
      };
      
      return res.status(500).json(errorResponse);
    }
  });
  
  // Stock data endpoint that redirects to Yahoo Finance API
  app.get("/api/stock/:symbol", async (req, res) => {
    try {
      const { symbol } = req.params;
      if (!symbol) {
        return res.status(400).json({ error: "Symbol is required" });
      }
      
      // Uppercase the symbol for consistency
      const normalizedSymbol = symbol.toUpperCase();
      
      console.log(`[API] Getting stock data for ${normalizedSymbol}`);
      
      // Redirect to Yahoo Finance API
      return res.redirect(`/api/yahoo-finance/chart/${normalizedSymbol}`);
    } catch (error: any) {
      console.error(`[API] Error getting stock data:`, error);
      res.status(500).json({ 
        error: "Failed to get stock data", 
        message: error.message 
      });
    }
  });
  
  // Stock history endpoint that redirects to Yahoo Finance API
  app.get("/api/stock/:symbol/history", async (req, res) => {
    try {
      const { symbol } = req.params;
      const { range, interval } = req.query;
      
      if (!symbol) {
        return res.status(400).json({ error: "Symbol is required" });
      }
      
      // Uppercase the symbol for consistency
      const normalizedSymbol = symbol.toUpperCase();
      
      console.log(`[API] Getting history for ${normalizedSymbol}, range: ${range}, interval: ${interval}`);
      
      // Redirect to Yahoo Finance API with query parameters
      const redirectUrl = `/api/yahoo-finance/chart/${normalizedSymbol}?range=${range || '1mo'}&interval=${interval || '1d'}`;
      return res.redirect(redirectUrl);
    } catch (error: any) {
      console.error(`[API] Error getting history:`, error);
      res.status(500).json({ 
        error: "Failed to get history data", 
        message: error.message 
      });
    }
  });
  
  // Register Yahoo Finance routes
  app.use('/api/yahoo-finance', yahooFinanceRoutes);
  
  // Create an HTTP server for the Express app
  const server = createServer(app);
  
  return server;
}