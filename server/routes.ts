import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import axios from "axios";
import { getAIResponse } from "./ai-service";

import { jsonStockService } from "./services/json-stock-service";

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
          `${stock.ticker} (${stock.name}): ${stock.shares} shares, current value $${stock.currentValue.toFixed(2)}, return ${stock.return.toFixed(2)}%`
        ).join('\n')}
      `;
      
      const userMessage = `${query}\n\nMy portfolio information:\n${portfolioContext}`;
      
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
      
      // Make the API call to OpenRouter following their documentation
      const openRouterUrl = 'https://openrouter.ai/api/v1/chat/completions';
      const requestData = {
        model: "google/gemini-2.0-flash-lite-001",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage }
        ],
        temperature: 0.7,
        max_tokens: 1024
      };
      
      console.log("Making API call to OpenRouter for portfolio analysis");
      
      const response = await axios.post(
        openRouterUrl,
        requestData,
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://swipefolio.replit.app',
            'X-Title': 'Swipefolio Portfolio Advisor'
          }
        }
      );
      
      console.log("OpenRouter API response status:", response.status);
      
      // Extract the AI's response
      if (response.data && response.data.choices && response.data.choices.length > 0) {
        const answer = response.data.choices[0].message.content;
        return res.json({ response: answer });
      } else {
        console.error("Invalid API response format:", response.data);
        return res.status(500).json({ 
          error: "Invalid API response", 
          message: "The AI service returned an unexpected response format"
        });
      }
    } catch (error: any) {
      console.error("Error in portfolio analysis request:", error);
      
      // Structure for our error response
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

  // AI Chat endpoint - General purpose chatbot for the application
  app.post("/api/ai/chat", async (req, res) => {
    try {
      console.log("Received AI chat request");
      const { message, context } = req.body;
      
      // Validate request body
      if (!message) {
        return res.status(400).json({ 
          error: "INVALID_REQUEST", 
          message: "A message is required" 
        });
      }
      
      // Get AI response using our service
      const response = await getAIResponse(message, context);
      
      // Return the response
      return res.json({ response });
    } catch (error: any) {
      console.error("Error in AI chat request:", error);
      
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
  
  // Board Room Game - AI scenario generation
  app.post("/api/ai-scenario", async (req, res) => {
    try {
      console.log("Received AI scenario request");
      const { prompt } = req.body;
      
      // Validate request body
      if (!prompt) {
        return res.status(400).json({ 
          error: "INVALID_REQUEST", 
          message: "A prompt is required" 
        });
      }
      
      // Get AI response with game context
      const response = await getAIResponse(prompt, { 
        gameMode: true,
        gameRole: "CEO Simulator"
      });
      
      try {
        // Try to parse as JSON
        const scenario = JSON.parse(response);
        return res.json({ scenario });
      } catch (parseError) {
        console.error('Failed to parse AI response as JSON:', parseError);
        
        // If the response isn't valid JSON, return the raw response for debugging
        return res.status(500).json({ 
          message: 'Failed to parse AI response as JSON',
          rawResponse: response
        });
      }
    } catch (error: any) {
      console.error("Error generating AI scenario:", error);
      
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
  
  // Board Room Game - AI insight/explanation generation
  app.post("/api/ai-insight", async (req, res) => {
    try {
      console.log("Received AI insight request");
      const { prompt } = req.body;
      
      // Validate request body
      if (!prompt) {
        return res.status(400).json({ 
          error: "INVALID_REQUEST", 
          message: "A prompt is required" 
        });
      }
      
      // Get AI response with game context
      const explanation = await getAIResponse(prompt, { 
        gameMode: true,
        gameRole: "CEO Simulator"
      });
      
      return res.json({ explanation });
    } catch (error: any) {
      console.error("Error generating AI insight:", error);
      
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

  // Stock Data API Endpoints
  

  // Get stock data from JSON files
  // Get all available stocks
  app.get("/api/stocks", async (req, res) => {
    try {
      const availableStocks = jsonStockService.getAvailableSymbols();
      console.log(`[API] Returning list of ${availableStocks.length} available stocks`);
      res.json({ availableStocks });
    } catch (error: any) {
      console.error(`[API] Error getting available stocks:`, error);
      res.status(500).json({ 
        error: "Failed to fetch available stocks", 
        message: error.message 
      });
    }
  });

  // Get stock data for a specific symbol
  app.get("/api/stock/:symbol", async (req, res) => {
    try {
      const { symbol } = req.params;
      if (!symbol) {
        return res.status(400).json({ error: "Symbol is required" });
      }
      
      // Uppercase the symbol for consistency
      const normalizedSymbol = symbol.toUpperCase();
      
      console.log(`[API] Getting stock data for ${normalizedSymbol}`);
      

      // Get stock data directly from JSON files
      if (jsonStockService.fileExists(normalizedSymbol)) {
        const stockData = jsonStockService.getStockData(normalizedSymbol);
        if (stockData) {
          return res.json(stockData);
        }
      }
      
      // Return error if no data found
      return res.status(404).json({ 
        error: "Stock data not found", 
        message: `No JSON file found for symbol: ${normalizedSymbol}` 
      });
    } catch (error: any) {
      console.error(`[API] Error getting stock data:`, error);
      res.status(500).json({ 
        error: "Failed to fetch stock data", 
        message: error.message 
      });
    }
  });
  
  // Refresh cache for a specific stock symbol - Not needed for JSON files
  app.post("/api/stock/refresh-cache", async (req, res) => {
    try {
      const { symbols } = req.body;
      
      if (!symbols || !Array.isArray(symbols) || symbols.length === 0) {
        return res.status(400).json({ error: "Array of symbols is required" });
      }
      
      // Get the list of symbols to refresh
      const symbolsToRefresh = symbols.map(s => s.toUpperCase());
      
      console.log(`[API] Request to refresh cache for ${symbolsToRefresh.length} symbols: ${symbolsToRefresh.join(', ')}`);
      
      // For JSON files, we just check if they exist

      const success = [];
      const failures = [];
      
      // Check each symbol to see if its JSON file exists
      for (const symbol of symbolsToRefresh) {
        if (jsonStockService.fileExists(symbol)) {
          success.push(symbol);
        } else {
          failures.push(symbol);
        }
      }
      
      res.json({
        message: `JSON files found for ${success.length} symbols. Missing: ${failures.length}`,
        success,
        failures
      });
    } catch (error: any) {
      console.error(`[API] Error checking JSON files:`, error);
      res.status(500).json({ 
        error: "Failed to check JSON files", 
        message: error.message 
      });
    }
  });
  
  // Clear cache endpoint - Not needed for JSON files since they're read-only
  app.post("/api/stock/clear-cache", async (req, res) => {
    try {
      console.log(`[API] Clearing stock cache requested - Not implemented for JSON files`);
      

      // For JSON files, we don't need to clear anything since they're read directly from disk
      res.json({
        message: "No cache to clear with JSON files. They are read directly from disk.",
        availableFiles: jsonStockService.getAvailableSymbols().length

      });
    } catch (error: any) {
      console.error(`[API] Error in clear cache endpoint:`, error);
      res.status(500).json({ 
        error: "Error processing clear cache request", 

        message: error.message 
      });
    }
  });

  // We are now using only JSON data files, YFinance endpoints removed
  
  // Get stock price history for charts
  app.get("/api/stock/:symbol/history", async (req, res) => {
    try {
      const symbol = req.params.symbol.toUpperCase();
      console.log(`[API] Getting price history for: ${symbol}`);
      
      // Get data from JSON files
      const { jsonStockService } = await import('./services/json-stock-service');
      
      if (jsonStockService.fileExists(symbol)) {
        const stockData = jsonStockService.getStockData(symbol);
        
        if (stockData && stockData.history && stockData.history.length > 0) {
          return res.json({
            symbol,
            history: stockData.history,
            source: 'json'
          });
        }
      }
      
      // If JSON file doesn't exist or no history data, return an error
      return res.status(404).json({ 
        error: "No history data available", 
        message: `No JSON file found for symbol: ${symbol}` 
      });
    } catch (error: any) {
      console.error(`[API] Error getting price history:`, error);
      res.status(500).json({ 
        error: "Failed to fetch price history", 
        message: error.message 
      });
    }
  });
  
  // No longer generating mock history data - using real JSON data only

  const httpServer = createServer(app);
  return httpServer;
}
