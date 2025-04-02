import { pgTable, text, serial, integer, boolean, jsonb, timestamp, varchar, numeric, doublePrecision, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  displayName: text("display_name").notNull(),
  xp: integer("xp").notNull().default(0),
  streakCount: integer("streak_count").notNull().default(0),
  lastActive: timestamp("last_active").notNull().default(new Date()),
  level: integer("level").notNull().default(1),
  dailyGoal: integer("daily_goal").notNull().default(3),
  interests: text("interests").array().notNull().default([]),
  experienceLevel: text("experience_level").notNull().default("beginner"),
  onboarded: boolean("onboarded").notNull().default(false)
});

export const stacks = pgTable("stacks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  cardCount: integer("card_count").notNull(),
  estimatedMinutes: integer("estimated_minutes").notNull(),
  industry: text("industry").notNull(),
  iconName: text("icon_name").notNull(),
  color: text("color").notNull(),
  difficulty: text("difficulty").notNull(), // beginner, intermediate, advanced
  rating: integer("rating").notNull().default(0),
});

export const cards = pgTable("cards", {
  id: serial("id").primaryKey(),
  stackId: integer("stack_id").notNull(),
  type: text("type").notNull(), // info, quiz, data-viz
  title: text("title").notNull(),
  subtitle: text("subtitle"),
  content: jsonb("content").notNull(), // Stores the card content in JSON format
  order: integer("order").notNull(),
});

export const userProgress = pgTable("user_progress", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  stackId: integer("stack_id").notNull(),
  completed: boolean("completed").notNull().default(false),
  currentCardIndex: integer("current_card_index").notNull().default(0),
  earnedXp: integer("earned_xp").notNull().default(0),
  lastAccessed: timestamp("last_accessed"),
});

export const userBadges = pgTable("user_badges", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  badgeName: text("badge_name").notNull(),
  earnedOn: timestamp("earned_on").notNull().default(new Date()),
  badgeDescription: text("badge_description").notNull(),
  iconName: text("icon_name").notNull(),
});

export const userDailyProgress = pgTable("user_daily_progress", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  date: timestamp("date").notNull().default(new Date()),
  lessonsCompleted: integer("lessons_completed").notNull().default(0),
  xpEarned: integer("xp_earned").notNull().default(0),
  goalCompleted: boolean("goal_completed").notNull().default(false),
});

export const stockCache = pgTable("stock_cache", {
  id: serial("id").primaryKey(),
  symbol: varchar("symbol", { length: 20 }).notNull().unique(),
  data: text("data").notNull(), // JSON string of the stock data
  updatedAt: timestamp("updated_at").notNull().default(new Date()),
});

// New stock tables based on the provided database schema
export const stocks = pgTable("stocks", {
  ticker: varchar("ticker", { length: 10 }).primaryKey(),
  companyName: text("company_name").notNull(),
  sector: text("sector"),
  industry: text("industry"),
  currentPrice: numeric("current_price"),
  marketCap: numeric("market_cap"),
  dividendYield: numeric("dividend_yield"),
  beta: numeric("beta"),
  peRatio: numeric("pe_ratio"),
  eps: numeric("eps"),
  fiftyTwoWeekHigh: numeric("fifty_two_week_high"),
  fiftyTwoWeekLow: numeric("fifty_two_week_low"),
  averageVolume: numeric("average_volume"),
  description: text("description"),
});

export const stockData = pgTable("stock_data", {
  ticker: varchar("ticker", { length: 10 }).primaryKey().references(() => stocks.ticker),
  closingHistory: jsonb("closing_history"), // JSON array of historical closing prices
  dividends: jsonb("dividends"), // JSON array of dividend data
  incomeStatement: jsonb("income_statement"), // JSON object with income statement data
  balanceSheet: jsonb("balance_sheet"), // JSON object with balance sheet data
  cashFlow: jsonb("cash_flow"), // JSON object with cash flow data
  recommendations: jsonb("recommendations"), // JSON array of analyst recommendations
  earningsDates: jsonb("earnings_dates"), // JSON array of upcoming earnings dates
  earningsHistory: jsonb("earnings_history"), // JSON array of historical earnings
  earningsTrend: jsonb("earnings_trend"), // JSON object with earnings trend data
  upgradesDowngrades: jsonb("upgrades_downgrades"), // JSON array of analyst upgrades/downgrades
  financialData: jsonb("financial_data"), // JSON object with financial metrics
  institutionalHolders: jsonb("institutional_holders"), // JSON array of institutional holders
  majorHolders: jsonb("major_holders"), // JSON array of major holders
  newsData: jsonb("news_data"), // JSON array of news articles
});

export const stockNews = pgTable("stock_news", {
  id: serial("id").primaryKey(),
  ticker: varchar("ticker", { length: 10 }).notNull().references(() => stocks.ticker),
  title: text("title").notNull(),
  summary: text("summary"),
  url: text("url").notNull(),
  source: text("source"),
  publishedDate: timestamp("published_date").notNull(),
  impactedMetrics: jsonb("impacted_metrics"), // Metrics affected by the news (performance, stability, etc.)
  aiAnalysis: jsonb("ai_analysis"), // AI analysis of the news article
  sentiment: text("sentiment"), // positive, negative, neutral
  created: timestamp("created").notNull().defaultNow(),
});

export const sectors = pgTable("sectors", {
  sectorKey: varchar("sector_key", { length: 50 }).primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  metrics: jsonb("metrics"), // JSON object with sector metrics
});

export const marketData = pgTable("market_data", {
  market: varchar("market", { length: 20 }).primaryKey(),
  name: text("name").notNull(),
  metrics: jsonb("metrics"), // JSON object with market metrics
  lastUpdated: timestamp("last_updated").notNull().default(new Date()),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  displayName: true,
}).extend({
  password: z.string().min(6, "Password must be at least 6 characters")
});

export const insertStackSchema = createInsertSchema(stacks).omit({
  id: true,
});

export const insertCardSchema = createInsertSchema(cards).omit({
  id: true,
});

export const insertUserProgressSchema = createInsertSchema(userProgress).omit({
  id: true,
});

export const insertUserBadgeSchema = createInsertSchema(userBadges).omit({
  id: true,
});

export const insertUserDailyProgressSchema = createInsertSchema(userDailyProgress).omit({
  id: true,
});

export const insertStockCacheSchema = createInsertSchema(stockCache).omit({
  id: true,
});

// Insert schemas for stock tables
export const insertStocksSchema = createInsertSchema(stocks);
export const insertStockDataSchema = createInsertSchema(stockData);
export const insertStockNewsSchema = createInsertSchema(stockNews).omit({
  id: true, 
  created: true
});
export const insertSectorsSchema = createInsertSchema(sectors);
export const insertMarketDataSchema = createInsertSchema(marketData);

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Stack = typeof stacks.$inferSelect;
export type Card = typeof cards.$inferSelect;
export type UserProgress = typeof userProgress.$inferSelect;
export type UserBadge = typeof userBadges.$inferSelect;
export type UserDailyProgress = typeof userDailyProgress.$inferSelect;
export type StockCache = typeof stockCache.$inferSelect;
export type Stock = typeof stocks.$inferSelect;
export type StockDetailedData = typeof stockData.$inferSelect;
export type StockNews = typeof stockNews.$inferSelect;
export type InsertStockNews = z.infer<typeof insertStockNewsSchema>;
export type Sector = typeof sectors.$inferSelect;
export type MarketData = typeof marketData.$inferSelect;
