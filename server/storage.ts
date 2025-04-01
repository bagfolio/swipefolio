import { users, stacks, cards, userProgress, userBadges, userDailyProgress } from "@shared/schema";
import type { User, InsertUser, Stack, Card, UserProgress, UserBadge, UserDailyProgress } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

// modify the interface with any CRUD methods
// you might need
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<User>): Promise<User | undefined>;
  
  // Stack methods
  getStacks(): Promise<Stack[]>;
  getStackById(id: number): Promise<Stack | undefined>;
  createStack(stack: Omit<Stack, "id">): Promise<Stack>;
  
  // Card methods
  getCardsByStackId(stackId: number): Promise<Card[]>;
  getCardById(id: number): Promise<Card | undefined>;
  createCard(card: Omit<Card, "id">): Promise<Card>;
  
  // User progress methods
  getUserProgressByUserId(userId: number): Promise<UserProgress[]>;
  getUserProgressByStackId(userId: number, stackId: number): Promise<UserProgress | undefined>;
  createUserProgress(userProgress: Omit<UserProgress, "id">): Promise<UserProgress>;
  updateUserProgress(id: number, progressData: Partial<UserProgress>): Promise<UserProgress | undefined>;
  
  // Badge methods
  getUserBadges(userId: number): Promise<UserBadge[]>;
  createUserBadge(badge: Omit<UserBadge, "id">): Promise<UserBadge>;
  
  // Daily progress methods
  getUserDailyProgress(userId: number, date?: Date): Promise<UserDailyProgress | undefined>;
  createUserDailyProgress(dailyProgress: Omit<UserDailyProgress, "id">): Promise<UserDailyProgress>;
  updateUserDailyProgress(id: number, dailyProgressData: Partial<UserDailyProgress>): Promise<UserDailyProgress | undefined>;
  
  // Session store
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private stacks: Map<number, Stack>;
  private cards: Map<number, Card>;
  private userProgress: Map<number, UserProgress>;
  private userBadges: Map<number, UserBadge>;
  private userDailyProgress: Map<number, UserDailyProgress>;
  
  currentUserId: number;
  currentStackId: number;
  currentCardId: number;
  currentProgressId: number;
  currentBadgeId: number;
  currentDailyProgressId: number;
  
  sessionStore: session.SessionStore;

  constructor() {
    this.users = new Map();
    this.stacks = new Map();
    this.cards = new Map();
    this.userProgress = new Map();
    this.userBadges = new Map();
    this.userDailyProgress = new Map();
    
    this.currentUserId = 1;
    this.currentStackId = 1;
    this.currentCardId = 1;
    this.currentProgressId = 1;
    this.currentBadgeId = 1;
    this.currentDailyProgressId = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // One day in ms
    });
    
    // Initialize with sample stacks
    this.initSampleData();
  }

  private initSampleData() {
    // Tech Industry stack
    const techStack: Omit<Stack, "id"> = {
      title: "Tech Giants",
      description: "Explore leading technology companies and their market impact",
      cardCount: 10,
      estimatedMinutes: 15,
      industry: "Tech",
      iconName: "cpu-line",
      color: "from-blue-600 to-blue-400",
      difficulty: "Beginner",
      rating: 48,
    };

    const retailStack: Omit<Stack, "id"> = {
      title: "Consumer & Retail",
      description: "Analyze major retail and consumer goods companies",
      cardCount: 8,
      estimatedMinutes: 12,
      industry: "Beginner",
      iconName: "shopping-bag-line",
      color: "from-orange-500 to-orange-400",
      difficulty: "beginner",
      rating: 45,
    };
    
    // Stock Investing stack
    const stockStack: Omit<Stack, "id"> = {
      title: "Stock Investing",
      description: "Master the fundamentals of stock market investing",
      cardCount: 10,
      estimatedMinutes: 15,
      industry: "Investing",
      iconName: "line-chart-line",
      color: "from-secondary-500 to-green-400",
      difficulty: "beginner",
      rating: 48,
    };
    
    // Real Estate stack
    const realEstateStack: Omit<Stack, "id"> = {
      title: "Real Estate",
      description: "Learn about real estate investment fundamentals",
      cardCount: 8,
      estimatedMinutes: 12,
      industry: "Real Estate",
      iconName: "building-line",
      color: "from-blue-500 to-blue-400",
      difficulty: "Intermediate",
      rating: 46,
    };
    
    // Crypto Basics stack
    const cryptoStack: Omit<Stack, "id"> = {
      title: "Crypto Basics",
      description: "Understand cryptocurrency fundamentals",
      cardCount: 12,
      estimatedMinutes: 20,
      industry: "Cryptocurrency",
      iconName: "coins-line",
      color: "from-accent-500 to-yellow-400",
      difficulty: "beginner",
      rating: 47,
    };
    
    // Healthcare stack
    const healthcareStack: Omit<Stack, "id"> = {
      title: "Healthcare",
      description: "Financial aspects of the healthcare industry",
      cardCount: 9,
      estimatedMinutes: 14,
      industry: "Healthcare",
      iconName: "heart-pulse-line",
      color: "from-purple-500 to-purple-400",
      difficulty: "Intermediate",
      rating: 45,
    };
    
    const esgStack: Omit<Stack, "id"> = {
      title: "Green Giants",
      description: "Explore sustainable and environmentally conscious investments",
      cardCount: 8,
      estimatedMinutes: 15,
      industry: "ESG",
      iconName: "leaf-line",
      color: "from-green-500 to-green-400",
      difficulty: "Hard",
      rating: 47,
    };

    this.createStack(techStack);
    this.createStack(retailStack);
    this.createStack(stockStack);
    this.createStack(realEstateStack);
    this.createStack(cryptoStack);
    this.createStack(healthcareStack);
    this.createStack(esgStack);
    
    // Create some cards for the Tech stack
    this.createCard({
      stackId: 1,
      type: "info",
      title: "Revenue Models in Tech",
      subtitle: "Understanding how tech companies make money",
      content: {
        text: "Tech companies typically use one of these revenue models: E-commerce, Subscription, or Advertising.",
        models: [
          {
            icon: "shopping-cart-line",
            name: "E-commerce",
            description: "Direct sales of products through online platforms"
          },
          {
            icon: "calendar-check-line",
            name: "Subscription",
            description: "Recurring revenue from regular payments"
          },
          {
            icon: "advertisement-line",
            name: "Advertising",
            description: "Monetizing user attention through targeted ads"
          }
        ],
        funFact: "Companies with subscription models typically have 2-3x higher valuations than those with one-time purchases."
      },
      order: 1
    });
    
    this.createCard({
      stackId: 1,
      type: "data-viz",
      title: "Revenue Distribution",
      subtitle: "How tech giants generate their income",
      content: {
        companies: [
          {
            name: "Apple",
            revenue: "$366B (2021)",
            segments: [
              { name: "iPhone", percentage: 52, color: "bg-blue-500" },
              { name: "Mac", percentage: 11, color: "bg-green-500" },
              { name: "iPad", percentage: 9, color: "bg-purple-500" },
              { name: "Services", percentage: 21, color: "bg-yellow-500" },
              { name: "Wearables", percentage: 7, color: "bg-red-500" }
            ]
          },
          {
            name: "Google",
            revenue: "$258B (2021)",
            segments: [
              { name: "Advertising", percentage: 81, color: "bg-red-500" },
              { name: "Cloud", percentage: 11, color: "bg-blue-500" },
              { name: "Other", percentage: 8, color: "bg-green-500" }
            ]
          }
        ],
        insight: "Tech companies with diversified revenue streams are generally more resilient to market changes and economic downturns.",
        keyPoint: "Apple's services revenue (App Store, Apple Music, etc.) is growing at 2x the rate of their product revenue."
      },
      order: 2
    });
    
    this.createCard({
      stackId: 1,
      type: "quiz",
      title: "Quick Quiz",
      subtitle: "Test your knowledge on tech revenue models",
      content: {
        question: "Which revenue model is Google primarily known for?",
        options: [
          { text: "Advertising", value: "advertising", isCorrect: true },
          { text: "Subscription", value: "subscription", isCorrect: false },
          { text: "E-commerce", value: "ecommerce", isCorrect: false },
          { text: "Licensing", value: "licensing", isCorrect: false }
        ],
        correctFeedback: "Google makes over 80% of its revenue from online advertising.",
        incorrectFeedback: "Google's primary revenue comes from advertising, making up over 80% of its total income."
      },
      order: 3
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { 
      ...insertUser, 
      id,
      xp: 0,
      streakCount: 0,
      lastActive: new Date(),
      level: 1,
      dailyGoal: 3,
      interests: [],
      experienceLevel: "beginner",
      onboarded: false
    };
    this.users.set(id, user);
    return user;
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async getStacks(): Promise<Stack[]> {
    return Array.from(this.stacks.values());
  }
  
  async getStackById(id: number): Promise<Stack | undefined> {
    return this.stacks.get(id);
  }
  
  async createStack(stack: Omit<Stack, "id">): Promise<Stack> {
    const id = this.currentStackId++;
    const newStack: Stack = { ...stack, id };
    this.stacks.set(id, newStack);
    return newStack;
  }
  
  async getCardsByStackId(stackId: number): Promise<Card[]> {
    return Array.from(this.cards.values())
      .filter(card => card.stackId === stackId)
      .sort((a, b) => a.order - b.order);
  }
  
  async getCardById(id: number): Promise<Card | undefined> {
    return this.cards.get(id);
  }
  
  async createCard(card: Omit<Card, "id">): Promise<Card> {
    const id = this.currentCardId++;
    const newCard: Card = { ...card, id };
    this.cards.set(id, newCard);
    return newCard;
  }
  
  async getUserProgressByUserId(userId: number): Promise<UserProgress[]> {
    return Array.from(this.userProgress.values())
      .filter(progress => progress.userId === userId);
  }
  
  async getUserProgressByStackId(userId: number, stackId: number): Promise<UserProgress | undefined> {
    return Array.from(this.userProgress.values())
      .find(progress => progress.userId === userId && progress.stackId === stackId);
  }
  
  async createUserProgress(userProgress: Omit<UserProgress, "id">): Promise<UserProgress> {
    const id = this.currentProgressId++;
    const newProgress: UserProgress = { ...userProgress, id };
    this.userProgress.set(id, newProgress);
    return newProgress;
  }
  
  async updateUserProgress(id: number, progressData: Partial<UserProgress>): Promise<UserProgress | undefined> {
    const progress = this.userProgress.get(id);
    if (!progress) return undefined;
    
    const updatedProgress = { ...progress, ...progressData };
    this.userProgress.set(id, updatedProgress);
    return updatedProgress;
  }
  
  async getUserBadges(userId: number): Promise<UserBadge[]> {
    return Array.from(this.userBadges.values())
      .filter(badge => badge.userId === userId);
  }
  
  async createUserBadge(badge: Omit<UserBadge, "id">): Promise<UserBadge> {
    const id = this.currentBadgeId++;
    const newBadge: UserBadge = { ...badge, id };
    this.userBadges.set(id, newBadge);
    return newBadge;
  }
  
  async getUserDailyProgress(userId: number, date?: Date): Promise<UserDailyProgress | undefined> {
    const today = date || new Date();
    const todayString = today.toISOString().split('T')[0];
    
    return Array.from(this.userDailyProgress.values())
      .find(progress => {
        const progressDate = progress.date.toISOString().split('T')[0];
        return progress.userId === userId && progressDate === todayString;
      });
  }
  
  async createUserDailyProgress(dailyProgress: Omit<UserDailyProgress, "id">): Promise<UserDailyProgress> {
    const id = this.currentDailyProgressId++;
    const newDailyProgress: UserDailyProgress = { ...dailyProgress, id };
    this.userDailyProgress.set(id, newDailyProgress);
    return newDailyProgress;
  }
  
  async updateUserDailyProgress(id: number, dailyProgressData: Partial<UserDailyProgress>): Promise<UserDailyProgress | undefined> {
    const dailyProgress = this.userDailyProgress.get(id);
    if (!dailyProgress) return undefined;
    
    const updatedDailyProgress = { ...dailyProgress, ...dailyProgressData };
    this.userDailyProgress.set(id, updatedDailyProgress);
    return updatedDailyProgress;
  }
}

export const storage = new MemStorage();
