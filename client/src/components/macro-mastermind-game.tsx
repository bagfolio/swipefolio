import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from './ui/card';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { useGameState } from '@/hooks/use-game-state';
import { GameHeader, GameOver } from './ui/game-elements';
import { 
  Globe, TrendingUp, TrendingDown, AlertTriangle, DollarSign, ArrowLeft, 
  Briefcase, LineChart, Scale, X, CreditCard, Users
} from 'lucide-react';

// Interfaces for the game
interface MarketSector {
  id: string;
  name: string;
  performance: number;
  volatility: number;
  trend: number;
  history: { timestamp: number; value: number }[];
}

interface Region {
  id: string;
  name: string;
  path: string;
  center: { x: number, y: number };
  sectors: {
    technology: MarketSector;
    manufacturing: MarketSector;
    services: MarketSector;
    energy: MarketSector;
    finance: MarketSector;
  };
  economicStats: {
    gdp: number;
    politicalStability: number;
    marketHealth: number;
    interestRate: number;
    tradeBalance: number;
  };
  events: GameEvent[];
  relationships: { [key: string]: number };
}

interface GameEvent {
  id: string;
  type: 'political' | 'economic' | 'trade' | 'social' | 'environmental';
  title: string;
  description: string;
  timestamp: number;
  globalImpactFactor: number;
  sectorImpacts: { [sectorId: string]: number };
  policyOptions: PolicyOption[];
  timeLimit: number;
  educationalContent: {
    theory: string;
    realWorldExample: string;
    keyTerms: string[];
  };
}

interface PolicyOption {
  id: string;
  title: string;
  description: string;
  effects: {
    [sectorId: string]: number;
    interestRate?: number;
    tradeBalance?: number;
    marketHealth?: number;
  };
  longTermEffects: {
    description: string;
    duration: number;
    sectorEffects: { [sectorId: string]: number };
  };
}

interface InternationalEvent {
  id: string;
  sourceRegion: string;
  title: string;
  description: string;
  severity: number;
  type: 'trade' | 'political' | 'economic' | 'diplomatic' | 'environmental';
  affectedSectors: string[];
  policyResponses: PolicyResponse[];
  timeToRespond: number; // seconds
  impactDelay: number; // turns before impact if no response
  potentialImpact: {
    market: number;
    diplomatic: { [regionId: string]: number };
    sectors: { [sectorId: string]: number };
  };
}

interface PolicyResponse {
  id: string;
  title: string;
  description: string;
  cost: number;
  effects: {
    domesticMarket: number;
    internationalRelations: { [regionId: string]: number };
    politicalStability: number;
    economicImpact: {
      gdp: number;
      marketHealth: number;
      tradeBalance: number;
    };
    sectorImpacts: { [sectorId: string]: number };
  };
}

interface GameState {
  turn: number;
  availableFunds: number;
  overallMarketHealth: number;
  eventHistory: GameEvent[];
  activeEvents: GameEvent[];
  difficulty: 'easy' | 'medium' | 'hard';
  tutorialCompleted: boolean;
  achievements: string[];
}

// Initial market sectors configuration
const INITIAL_SECTORS: { [key: string]: MarketSector } = {
  technology: {
    id: 'tech',
    name: 'Technology',
    performance: 100,
    volatility: 0.8,
    trend: 0.1,
    history: []
  },
  manufacturing: {
    id: 'mfg',
    name: 'Manufacturing',
    performance: 100,
    volatility: 0.5,
    trend: 0.05,
    history: []
  },
  services: {
    id: 'srv',
    name: 'Services',
    performance: 100,
    volatility: 0.3,
    trend: 0.03,
    history: []
  },
  energy: {
    id: 'nrg',
    name: 'Energy',
    performance: 100,
    volatility: 0.6,
    trend: 0.02,
    history: []
  },
  finance: {
    id: 'fin',
    name: 'Finance',
    performance: 100,
    volatility: 0.7,
    trend: 0.04,
    history: []
  }
};

// World regions with sector-based configuration
const WORLD_REGIONS: Region[] = [
  {
    id: 'na',
    name: 'North America',
    path: 'M 150 70 L 280 70 L 300 150 L 250 200 L 150 180 Z',
    center: { x: 200, y: 120 },
    sectors: {
      technology: { ...INITIAL_SECTORS.technology, performance: 110, trend: 0.15 },
      manufacturing: { ...INITIAL_SECTORS.manufacturing, performance: 95 },
      services: { ...INITIAL_SECTORS.services, performance: 105 },
      energy: { ...INITIAL_SECTORS.energy, performance: 100 },
      finance: { ...INITIAL_SECTORS.finance, performance: 108 }
    },
    economicStats: {
      gdp: 100,
      politicalStability: 85,
      marketHealth: 90,
      interestRate: 2.5,
      tradeBalance: 0
    },
    events: [],
    relationships: { eu: 90, asia: 70, sa: 85, af: 60 }
  },
  {
    id: 'eu',
    name: 'Europe',
    path: 'M 350 60 L 420 60 L 440 100 L 400 140 L 340 120 Z',
    center: { x: 380, y: 90 },
    sectors: {
      technology: { ...INITIAL_SECTORS.technology, performance: 105, trend: 0.1 },
      manufacturing: { ...INITIAL_SECTORS.manufacturing, performance: 90 },
      services: { ...INITIAL_SECTORS.services, performance: 100 },
      energy: { ...INITIAL_SECTORS.energy, performance: 95 },
      finance: { ...INITIAL_SECTORS.finance, performance: 102 }
    },
    economicStats: {
      gdp: 90,
      politicalStability: 80,
      marketHealth: 85,
      interestRate: 2.0,
      tradeBalance: -5
    },
    events: [],
    relationships: { na: 90, asia: 75, sa: 70, af: 65 }
  },
  {
    id: 'asia',
    name: 'Asia',
    path: 'M 450 80 L 580 80 L 600 160 L 520 200 L 440 150 Z',
    center: { x: 520, y: 130 },
    sectors: {
      technology: { ...INITIAL_SECTORS.technology, performance: 108, trend: 0.12 },
      manufacturing: { ...INITIAL_SECTORS.manufacturing, performance: 92 },
      services: { ...INITIAL_SECTORS.services, performance: 102 },
      energy: { ...INITIAL_SECTORS.energy, performance: 98 },
      finance: { ...INITIAL_SECTORS.finance, performance: 105 }
    },
    economicStats: {
      gdp: 95,
      politicalStability: 75,
      marketHealth: 80,
      interestRate: 3.0,
      tradeBalance: 10
    },
    events: [],
    relationships: { na: 70, eu: 75, sa: 60, af: 70 }
  },
  {
    id: 'sa',
    name: 'South America',
    path: 'M 200 220 L 280 220 L 300 320 L 240 350 L 180 300 Z',
    center: { x: 240, y: 280 },
    sectors: {
      technology: { ...INITIAL_SECTORS.technology, performance: 98, trend: 0.08 },
      manufacturing: { ...INITIAL_SECTORS.manufacturing, performance: 75 },
      services: { ...INITIAL_SECTORS.services, performance: 85 },
      energy: { ...INITIAL_SECTORS.energy, performance: 80 },
      finance: { ...INITIAL_SECTORS.finance, performance: 88 }
    },
    economicStats: {
      gdp: 75,
      politicalStability: 65,
      marketHealth: 70,
      interestRate: 5.0,
      tradeBalance: -2
    },
    events: [],
    relationships: { na: 85, eu: 70, asia: 60, af: 55 }
  },
  {
    id: 'af',
    name: 'Africa',
    path: 'M 350 180 L 450 180 L 470 300 L 400 340 L 330 280 Z',
    center: { x: 400, y: 250 },
    sectors: {
      technology: { ...INITIAL_SECTORS.technology, performance: 95, trend: 0.07 },
      manufacturing: { ...INITIAL_SECTORS.manufacturing, performance: 60 },
      services: { ...INITIAL_SECTORS.services, performance: 65 },
      energy: { ...INITIAL_SECTORS.energy, performance: 60 },
      finance: { ...INITIAL_SECTORS.finance, performance: 68 }
    },
    economicStats: {
      gdp: 60,
      politicalStability: 60,
      marketHealth: 65,
      interestRate: 7.0,
      tradeBalance: -8
    },
    events: [],
    relationships: { na: 60, eu: 65, asia: 70, sa: 55 }
  }
];

// Event templates that can occur in the game
const EVENT_TEMPLATES: GameEvent[] = [
  {
    id: 'evt_trade_agreement',
    type: 'trade',
    title: 'International Trade Agreement',
    description: 'Major trading partners have proposed a new trade agreement that could reshape international commerce.',
    timestamp: 0,
    globalImpactFactor: 0.7,
    sectorImpacts: {
      technology: 5,
      manufacturing: 8,
      services: 3,
      energy: 2,
      finance: 4
    },
    policyOptions: [
      {
        id: 'policy_embrace',
        title: 'Embrace Agreement',
        description: 'Fully support and sign the trade agreement.',
        effects: {
          technology: 5,
          manufacturing: 8,
          services: 3,
          energy: 2,
          finance: 4,
          tradeBalance: 10
        },
        longTermEffects: {
          description: 'Strengthened international trade relationships but some domestic industries may struggle with competition.',
          duration: 5,
          sectorEffects: {
            manufacturing: -2,
            technology: 5
          }
        }
      },
      {
        id: 'policy_negotiate',
        title: 'Negotiate Terms',
        description: 'Seek modifications to better protect your interests.',
        effects: {
          technology: 2,
          manufacturing: 3,
          services: 2,
          energy: 1,
          finance: 2,
          tradeBalance: 5
        },
        longTermEffects: {
          description: 'Balanced approach maintains stability while gaining some benefits.',
          duration: 3,
          sectorEffects: {
            manufacturing: 1,
            technology: 2
          }
        }
      },
      {
        id: 'policy_reject',
        title: 'Reject Agreement',
        description: 'Decline participation to protect domestic markets.',
        effects: {
          technology: -2,
          manufacturing: -3,
          services: -1,
          energy: -1,
          finance: -2,
          tradeBalance: -5
        },
        longTermEffects: {
          description: 'Protected domestic industries but international relationships strained.',
          duration: 4,
          sectorEffects: {
            manufacturing: 3,
            technology: -4
          }
        }
      }
    ],
    timeLimit: 30,
    educationalContent: {
      theory: 'Trade agreements typically aim to reduce barriers to international commerce through tariff reduction and standardization.',
      realWorldExample: 'The USMCA (United States-Mexico-Canada Agreement) replaced NAFTA in 2020, modernizing trade relations in North America.',
      keyTerms: ['Tariff', 'Trade Deficit', 'Protectionism', 'Free Trade']
    }
  },
  {
    id: 'evt_tech_innovation',
    type: 'economic',
    title: 'Technological Breakthrough',
    description: 'A major technological breakthrough has emerged that could transform multiple industries.',
    timestamp: 0,
    globalImpactFactor: 0.8,
    sectorImpacts: {
      technology: 12,
      manufacturing: 6,
      services: 4,
      energy: 5,
      finance: 3
    },
    policyOptions: [
      {
        id: 'policy_invest',
        title: 'Government Investment',
        description: 'Provide substantial funding to accelerate adoption.',
        effects: {
          technology: 12,
          manufacturing: 6,
          services: 4,
          energy: 5,
          finance: 3,
          marketHealth: 10
        },
        longTermEffects: {
          description: 'Accelerated technological transformation with competitive advantage.',
          duration: 6,
          sectorEffects: {
            technology: 8,
            manufacturing: 4
          }
        }
      },
      {
        id: 'policy_partnership',
        title: 'Public-Private Partnership',
        description: 'Collaborate with private industry for balanced implementation.',
        effects: {
          technology: 8,
          manufacturing: 4,
          services: 3,
          energy: 3,
          finance: 2,
          marketHealth: 5
        },
        longTermEffects: {
          description: 'Sustainable integration with balanced risk and reward.',
          duration: 4,
          sectorEffects: {
            technology: 5,
            manufacturing: 3
          }
        }
      },
      {
        id: 'policy_wait',
        title: 'Wait and See',
        description: 'Allow market forces to naturally integrate the technology.',
        effects: {
          technology: 4,
          manufacturing: 2,
          services: 1,
          energy: 1,
          finance: 1,
          marketHealth: 0
        },
        longTermEffects: {
          description: 'Slower adoption but fewer disruptions to existing systems.',
          duration: 2,
          sectorEffects: {
            technology: 2,
            manufacturing: 1
          }
        }
      }
    ],
    timeLimit: 25,
    educationalContent: {
      theory: 'Technological innovation drives economic growth through improved productivity and creation of new markets.',
      realWorldExample: 'The internet revolution transformed global business models and created trillion-dollar tech companies.',
      keyTerms: ['Innovation', 'Disruption', 'Productivity', 'Research & Development']
    }
  },
  {
    id: 'evt_financial_crisis',
    type: 'economic',
    title: 'Financial Market Turbulence',
    description: 'Financial markets are experiencing extreme volatility, threatening economic stability.',
    timestamp: 0,
    globalImpactFactor: 0.9,
    sectorImpacts: {
      technology: -6,
      manufacturing: -5,
      services: -7,
      energy: -4,
      finance: -15
    },
    policyOptions: [
      {
        id: 'policy_bailout',
        title: 'Financial Sector Bailout',
        description: 'Provide emergency funds to stabilize financial institutions.',
        effects: {
          technology: -3,
          manufacturing: -2,
          services: -3,
          energy: -2,
          finance: -5,
          marketHealth: 15
        },
        longTermEffects: {
          description: 'Immediate stability but potential moral hazard and public debt concerns.',
          duration: 5,
          sectorEffects: {
            finance: 10,
            technology: -1
          }
        }
      },
      {
        id: 'policy_regulation',
        title: 'Increase Regulation',
        description: 'Implement stricter financial regulations to prevent future crises.',
        effects: {
          technology: -4,
          manufacturing: -3,
          services: -4,
          energy: -3,
          finance: -8,
          marketHealth: 5
        },
        longTermEffects: {
          description: 'More stable financial system but potentially slower growth.',
          duration: 7,
          sectorEffects: {
            finance: 5,
            technology: -2
          }
        }
      },
      {
        id: 'policy_austerity',
        title: 'Austerity Measures',
        description: 'Cut government spending to maintain fiscal discipline.',
        effects: {
          technology: -5,
          manufacturing: -4,
          services: -6,
          energy: -3,
          finance: -10,
          marketHealth: -5
        },
        longTermEffects: {
          description: 'Reduced debt but prolonged economic downturn.',
          duration: 8,
          sectorEffects: {
            finance: -2,
            technology: -3
          }
        }
      }
    ],
    timeLimit: 20,
    educationalContent: {
      theory: 'Financial crises can originate from asset bubbles, excessive leverage, or systemic risk, requiring decisive policy intervention.',
      realWorldExample: 'The 2008 Global Financial Crisis led to unprecedented government intervention in financial markets worldwide.',
      keyTerms: ['Systemic Risk', 'Liquidity', 'Bailout', 'Moral Hazard']
    }
  }
];

export function MacroMastermindGame() {
  const {
    gameState: externalGameState,
    updateScore,
    addTickets,
    resetGame
  } = useGameState();
  
  // Game phase management
  const [gamePhase, setGamePhase] = useState<'selection' | 'tutorial' | 'playing' | 'ended'>('selection');
  const [playerRegion, setPlayerRegion] = useState<Region | null>(null);
  const [regions, setRegions] = useState<Region[]>(WORLD_REGIONS);
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  const [activeEvents, setActiveEvents] = useState<InternationalEvent[]>([]);
  const [currentEvent, setCurrentEvent] = useState<GameEvent | null>(null);
  const [showEventDetails, setShowEventDetails] = useState(false);
  const [gameTurn, setGameTurn] = useState(1);
  const [gameSpeed, setGameSpeed] = useState<'Slow' | 'Normal' | 'Fast'>('Normal');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [showTutorial, setShowTutorial] = useState(false);
  
  // Game state tracking
  const [internalGameState, setInternalGameState] = useState<GameState>({
    turn: 1,
    availableFunds: 1000,
    overallMarketHealth: 100,
    eventHistory: [],
    activeEvents: [],
    difficulty: 'medium',
    tutorialCompleted: false,
    achievements: []
  });
  
  // SVG reference for the world map
  const svgRef = useRef<SVGSVGElement>(null);
  
  // Game simulation interval
  const [simInterval, setSimIntervalState] = useState<NodeJS.Timeout | null>(null);
  
  // Initialize the game when a region is selected
  const initializeGame = (regionId: string) => {
    const selected = regions.find(r => r.id === regionId);
    if (!selected) return;
    
    setPlayerRegion(selected);
    setGamePhase('playing');
    
    // Setup interval for market simulation based on game speed
    const speedMap = { 'Slow': 5000, 'Normal': 3000, 'Fast': 1500 };
    const interval = setInterval(() => {
      simulateMarketMovements();
      checkForEvents();
      advanceTurn();
    }, speedMap[gameSpeed]);
    
    setSimIntervalState(interval);
    
    // Trigger first event after a short delay
    setTimeout(() => {
      triggerRandomEvent();
    }, 10000);
    
    return () => {
      if (simInterval) clearInterval(simInterval);
    };
  };
  
  // Clean up interval on component unmount
  useEffect(() => {
    return () => {
      if (simInterval) clearInterval(simInterval);
    };
  }, [simInterval]);
  
  // Simulate market movements
  const simulateMarketMovements = () => {
    if (!playerRegion) return;
    
    setRegions(prevRegions => {
      return prevRegions.map(region => {
        // Only simulate detailed movements for player's region
        if (region.id === playerRegion.id) {
          const updatedSectors = Object.entries(region.sectors).reduce((acc, [key, sector]) => {
            // Calculate random market movement
            const volatilityFactor = sector.volatility * (Math.random() - 0.5) * 2;
            const trendFactor = sector.trend;
            const eventImpact = activeEvents
              .filter(event => event.sourceRegion !== region.id)
              .reduce((sum, event) => sum + (event.potentialImpact.sectors[key] || 0) / 100, 0);
            
            // Update performance with bounds
            let newPerformance = sector.performance * (1 + (volatilityFactor + trendFactor + eventImpact) / 100);
            newPerformance = Math.max(40, Math.min(160, newPerformance)); // Keep between 40% and 160%
            
            // Update trend with some randomness
            let newTrend = sector.trend + (volatilityFactor / 50);
            newTrend = Math.max(-0.2, Math.min(0.2, newTrend)); // Keep trend between -20% and +20%
            
            // Update history
            const newHistory = [...sector.history, { timestamp: Date.now(), value: newPerformance }];
            if (newHistory.length > 50) newHistory.shift(); // Keep last 50 data points
            
            return {
              ...acc,
              [key]: {
                ...sector,
                performance: newPerformance,
                trend: newTrend,
                history: newHistory
              }
            };
          }, {});
          
          // Update economic stats
          const avgPerformance = Object.values(updatedSectors).reduce((sum, sector) => sum + sector.performance, 0) / 5;
          const updatedStats = {
            ...region.economicStats,
            marketHealth: Math.min(100, Math.max(0, avgPerformance * 0.8 + region.economicStats.marketHealth * 0.2)),
            gdp: Math.min(100, Math.max(0, avgPerformance * 0.6 + region.economicStats.gdp * 0.4)),
            politicalStability: Math.min(100, Math.max(0, region.economicStats.politicalStability * 0.95 + Math.random() * 5))
          };
          
          return {
            ...region,
            sectors: updatedSectors as typeof region.sectors,
            economicStats: updatedStats
          };
        }
        
        // Simple simulation for non-player regions
        return {
          ...region,
          economicStats: {
            ...region.economicStats,
            marketHealth: Math.min(100, Math.max(0, region.economicStats.marketHealth + (Math.random() * 6 - 3))),
            gdp: Math.min(100, Math.max(0, region.economicStats.gdp + (Math.random() * 4 - 2))),
            politicalStability: Math.min(100, Math.max(0, region.economicStats.politicalStability + (Math.random() * 4 - 2)))
          }
        };
      });
    });
    
    // Update game score based on economic performance of player's region
    if (playerRegion) {
      const score = Math.floor(playerRegion.economicStats.marketHealth * 10);
      updateScore(score);
    }
  };
  
  // Check for events
  const checkForEvents = () => {
    // Process existing events
    setActiveEvents(prev => {
      return prev.filter(event => {
        // Apply event impacts if the time to respond has passed
        if (event.impactDelay <= 0) {
          applyEventImpact(event);
          return false; // Remove the event
        }
        
        // Decrement the impact delay
        return {
          ...event,
          impactDelay: event.impactDelay - 1
        };
      });
    });
  };
  
  // Apply event impact if no response was chosen
  const applyEventImpact = (event: InternationalEvent) => {
    if (!playerRegion) return;
    
    setRegions(prevRegions => {
      return prevRegions.map(region => {
        if (region.id === playerRegion.id) {
          // Apply sector impacts
          const updatedSectors = Object.entries(region.sectors).reduce((acc, [key, sector]) => {
            const impact = event.potentialImpact.sectors[key] || 0;
            
            return {
              ...acc,
              [key]: {
                ...sector,
                performance: Math.max(40, Math.min(160, sector.performance * (1 + impact / 100)))
              }
            };
          }, {});
          
          // Apply market health impact
          const updatedStats = {
            ...region.economicStats,
            marketHealth: Math.max(0, Math.min(100, region.economicStats.marketHealth + event.potentialImpact.market))
          };
          
          // Apply diplomatic impacts
          const updatedRelationships = { ...region.relationships };
          Object.entries(event.potentialImpact.diplomatic).forEach(([regionId, impact]) => {
            if (regionId in updatedRelationships) {
              updatedRelationships[regionId] = Math.max(0, Math.min(100, updatedRelationships[regionId] + impact));
            }
          });
          
          return {
            ...region,
            sectors: updatedSectors as typeof region.sectors,
            economicStats: updatedStats,
            relationships: updatedRelationships
          };
        }
        return region;
      });
    });
  };
  
  // Trigger a random event
  const triggerRandomEvent = () => {
    if (!playerRegion) return;
    
    // Select a random event template
    const template = EVENT_TEMPLATES[Math.floor(Math.random() * EVENT_TEMPLATES.length)];
    
    // Create a new event with current timestamp
    const newEvent: GameEvent = {
      ...template,
      id: `${template.id}_${Date.now()}`,
      timestamp: Date.now()
    };
    
    setCurrentEvent(newEvent);
    setShowEventDetails(true);
  };
  
  // Advance the game turn
  const advanceTurn = () => {
    setGameTurn(prev => {
      const newTurn = prev + 1;
      
      // Check for game end condition (e.g., 20 turns)
      if (newTurn > 20) {
        endGame();
      }
      
      // Random chance for new events
      if (Math.random() < 0.2 && !currentEvent) { // 20% chance each turn if no active event
        triggerRandomEvent();
      }
      
      return newTurn;
    });
  };
  
  // Handle policy selection for an event
  const handlePolicySelection = (policyOption: PolicyOption) => {
    if (!playerRegion || !currentEvent) return;
    
    // Apply immediate policy effects to the player's region
    setRegions(prevRegions => {
      return prevRegions.map(region => {
        if (region.id === playerRegion.id) {
          // Apply sector effects
          const updatedSectors = Object.entries(region.sectors).reduce((acc, [key, sector]) => {
            const impact = policyOption.effects[key] || 0;
            
            return {
              ...acc,
              [key]: {
                ...sector,
                performance: Math.max(40, Math.min(160, sector.performance * (1 + impact / 100))),
                trend: sector.trend + (impact / 500) // Small adjustment to trend
              }
            };
          }, {});
          
          // Apply economic stat changes
          const updatedStats = {
            ...region.economicStats
          };
          
          if (policyOption.effects.marketHealth !== undefined) {
            updatedStats.marketHealth = Math.max(0, Math.min(100, region.economicStats.marketHealth + policyOption.effects.marketHealth));
          }
          
          if (policyOption.effects.interestRate !== undefined) {
            updatedStats.interestRate = Math.max(0, region.economicStats.interestRate + policyOption.effects.interestRate);
          }
          
          if (policyOption.effects.tradeBalance !== undefined) {
            updatedStats.tradeBalance = region.economicStats.tradeBalance + policyOption.effects.tradeBalance;
          }
          
          return {
            ...region,
            sectors: updatedSectors as typeof region.sectors,
            economicStats: updatedStats,
            events: [...region.events, currentEvent]
          };
        }
        return region;
      });
    });
    
    // Add to event history
    setInternalGameState(prev => ({
      ...prev,
      eventHistory: [...prev.eventHistory, currentEvent],
      availableFunds: prev.availableFunds - 100 // Example cost for policy implementation
    }));
    
    // Close the event modal
    setCurrentEvent(null);
    setShowEventDetails(false);
    
    // Award XP for handling an event
    const eventImpact = Math.abs(
      Object.values(currentEvent.sectorImpacts).reduce((sum, val) => sum + val, 0)
    );
    const xpGained = Math.floor(eventImpact / 5);
    addXP(xpGained);
  };
  
  // Add XP and possibly tickets
  const addXP = (amount: number) => {
    // For this game, we'll directly convert XP to score
    updateScore(prev => prev + amount);
    
    // Potentially award tickets for significant policy decisions
    if (amount >= 10) {
      addTickets(1);
    }
  };
  
  // End the game
  const endGame = () => {
    // Clean up interval
    if (simInterval) {
      clearInterval(simInterval);
      setSimIntervalState(null);
    }
    
    setGamePhase('ended');
    
    // Calculate final score based on economic health and relationships
    if (playerRegion) {
      const economicScore = playerRegion.economicStats.marketHealth +
                          playerRegion.economicStats.gdp +
                          playerRegion.economicStats.politicalStability;
      
      const relationshipScore = Object.values(playerRegion.relationships).reduce((sum, val) => sum + val, 0) / 4;
      
      const sectorScore = Object.values(playerRegion.sectors).reduce((sum, sector) => sum + sector.performance, 0) / 5;
      
      const finalScore = Math.floor((economicScore + relationshipScore + sectorScore) / 3);
      
      // Update final score
      updateScore(finalScore);
      
      // Award tickets based on final score
      const ticketsEarned = Math.floor(finalScore / 50);
      addTickets(ticketsEarned);
    }
  };
  
  // Restart game
  const restartGame = () => {
    // Reset game state
    setRegions(WORLD_REGIONS);
    setPlayerRegion(null);
    setSelectedRegion(null);
    setActiveEvents([]);
    setCurrentEvent(null);
    setShowEventDetails(false);
    setGameTurn(1);
    setInternalGameState({
      turn: 1,
      availableFunds: 1000,
      overallMarketHealth: 100,
      eventHistory: [],
      activeEvents: [],
      difficulty: difficulty,
      tutorialCompleted: true,
      achievements: []
    });
    
    // Clean up interval
    if (simInterval) {
      clearInterval(simInterval);
      setSimIntervalState(null);
    }
    
    // Reset to selection phase
    setGamePhase('selection');
    
    // Reset external game state
    resetGame();
  };
  
  // Return to games hub
  const returnToHub = () => {
    resetGame();
  };
  
  // Tutorial component
  const renderTutorial = () => {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
      >
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle className="text-xl sm:text-2xl">Welcome to Macro Mastermind</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-bold mb-2">Game Overview</h3>
              <p>In this economic simulation game, you'll manage a region's economy through global events and policy decisions:</p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>Choose a region to lead (each with unique strengths)</li>
                <li>Monitor and manage 5 key economic sectors</li>
                <li>Respond to global events with policy decisions</li>
                <li>Watch how your choices affect economic indicators</li>
                <li>Build relationships with other regions</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-bold mb-2">How to Play</h3>
              <ol className="list-decimal pl-6 space-y-2">
                <li>Select a region on the world map</li>
                <li>Monitor sector performance and economic indicators</li>
                <li>When events occur, carefully consider policy options</li>
                <li>Balance short-term gains with long-term stability</li>
                <li>Reach the end of 20 turns with the strongest economy to win</li>
              </ol>
            </div>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button onClick={() => setShowTutorial(false)}>Got It</Button>
          </CardFooter>
        </Card>
      </motion.div>
    );
  };
  
  // Region selection component
  const renderRegionSelection = () => {
    return (
      <div className="max-w-4xl mx-auto mt-6 p-4">
        <GameHeader
          title="Macro Mastermind"
          description="Global Economic Simulation"
          icon={<Globe className="h-6 w-6" />}
        />
        
        <Card className="mt-6 overflow-hidden">
          <CardHeader>
            <CardTitle>Select Your Region</CardTitle>
            <CardDescription>Each region has unique economic strengths and challenges</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative">
              {/* Simple region selection with colored blocks instead of SVG map */}
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                {regions.map(region => (
                  <motion.div
                    key={region.id}
                    className={`p-4 rounded-lg border cursor-pointer ${
                      selectedRegion?.id === region.id ? 'border-primary bg-primary/10' : 'border-gray-200 hover:bg-gray-50'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => setSelectedRegion(region)}
                  >
                    <h3 className="font-bold mb-2">{region.name}</h3>
                    <div className="text-sm space-y-1">
                      <div className="flex justify-between">
                        <span>GDP:</span>
                        <span>{region.economicStats.gdp}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tech:</span>
                        <span>{Math.round(region.sectors.technology.performance)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Finance:</span>
                        <span>{Math.round(region.sectors.finance.performance)}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
            
            {selectedRegion && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 p-4 border rounded-lg"
              >
                <h3 className="font-bold text-lg mb-2">{selectedRegion.name}</h3>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  <div>
                    <div className="text-sm text-gray-500">GDP Rating</div>
                    <div className="flex items-center">
                      <Progress value={selectedRegion.economicStats.gdp} className="h-2 flex-grow" />
                      <span className="ml-2 text-sm font-medium">{selectedRegion.economicStats.gdp}</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Market Health</div>
                    <div className="flex items-center">
                      <Progress value={selectedRegion.economicStats.marketHealth} className="h-2 flex-grow" />
                      <span className="ml-2 text-sm font-medium">{selectedRegion.economicStats.marketHealth}</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Political Stability</div>
                    <div className="flex items-center">
                      <Progress value={selectedRegion.economicStats.politicalStability} className="h-2 flex-grow" />
                      <span className="ml-2 text-sm font-medium">{selectedRegion.economicStats.politicalStability}</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Interest Rate</div>
                    <div className="font-medium">{selectedRegion.economicStats.interestRate}%</div>
                  </div>
                </div>
                
                <h4 className="font-medium mt-4 mb-2">Key Sectors</h4>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(selectedRegion.sectors).map(([id, sector]) => (
                    <div key={id} className="text-sm">
                      <div className="font-medium">{sector.name}</div>
                      <div className={`flex items-center ${
                        sector.performance > 100 ? 'text-green-500' : sector.performance < 95 ? 'text-red-500' : 'text-yellow-500'
                      }`}>
                        {sector.performance.toFixed(1)}
                        {sector.trend > 0 ? <TrendingUp className="h-3 w-3 ml-1" /> : <></>}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => setShowTutorial(true)}>
              Tutorial
            </Button>
            <div className="space-x-2">
              <Button
                variant="outline"
                onClick={returnToHub}
              >
                Cancel
              </Button>
              <Button
                disabled={!selectedRegion}
                onClick={() => selectedRegion && initializeGame(selectedRegion.id)}
              >
                Start Game
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    );
  };
  
  // Game play screen
  const renderGamePlay = () => {
    if (!playerRegion) return null;
    
    return (
      <div className="max-w-4xl mx-auto mt-6 mb-20 p-4">
        <GameHeader
          title="Macro Mastermind"
          description={`Turn ${gameTurn}/20 - ${playerRegion.name}`}
          icon={<Globe className="h-6 w-6" />}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          {/* Economic Overview Card */}
          <Card className="col-span-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Economic Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm text-gray-500">Available Funds</div>
                <div className="text-xl font-bold flex items-center">
                  <DollarSign className="h-5 w-5 mr-1" />
                  {internalGameState.availableFunds}M
                </div>
              </div>
              
              <div>
                <div className="text-sm text-gray-500">Market Health</div>
                <div className="flex items-center">
                  <Progress 
                    value={playerRegion.economicStats.marketHealth} 
                    className="h-2 flex-grow"
                    // Apply color based on value
                    style={{
                      background: playerRegion.economicStats.marketHealth < 40 ? '#fee2e2' : 
                               playerRegion.economicStats.marketHealth < 70 ? '#fef3c7' : '#dcfce7'
                    }}
                  />
                  <span className="ml-2 text-sm font-medium">{Math.round(playerRegion.economicStats.marketHealth)}</span>
                </div>
              </div>
              
              <div>
                <div className="text-sm text-gray-500">GDP Rating</div>
                <div className="flex items-center">
                  <Progress 
                    value={playerRegion.economicStats.gdp} 
                    className="h-2 flex-grow"
                    style={{
                      background: playerRegion.economicStats.gdp < 40 ? '#fee2e2' : 
                               playerRegion.economicStats.gdp < 70 ? '#fef3c7' : '#dcfce7'
                    }}
                  />
                  <span className="ml-2 text-sm font-medium">{Math.round(playerRegion.economicStats.gdp)}</span>
                </div>
              </div>
              
              <div>
                <div className="text-sm text-gray-500">Political Stability</div>
                <div className="flex items-center">
                  <Progress 
                    value={playerRegion.economicStats.politicalStability} 
                    className="h-2 flex-grow"
                    style={{
                      background: playerRegion.economicStats.politicalStability < 40 ? '#fee2e2' : 
                               playerRegion.economicStats.politicalStability < 70 ? '#fef3c7' : '#dcfce7'
                    }}
                  />
                  <span className="ml-2 text-sm font-medium">{Math.round(playerRegion.economicStats.politicalStability)}</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="text-sm text-gray-500">Interest Rate</div>
                  <div className="font-medium">{playerRegion.economicStats.interestRate.toFixed(1)}%</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Trade Balance</div>
                  <div className={`font-medium ${playerRegion.economicStats.tradeBalance >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {playerRegion.economicStats.tradeBalance >= 0 ? '+' : ''}{playerRegion.economicStats.tradeBalance}B
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Market Sectors Card */}
          <Card className="col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Market Sectors</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(playerRegion.sectors).map(([id, sector]) => (
                  <div key={id} className="flex items-center">
                    <div className="w-28">
                      <div className="font-medium">{sector.name}</div>
                      <div className={`text-sm ${
                        sector.performance > 100 ? 'text-green-500' : sector.performance < 90 ? 'text-red-500' : 'text-yellow-500'
                      }`}>
                        {sector.performance.toFixed(1)}
                        {sector.trend > 0 ? 
                          <TrendingUp className="h-3 w-3 inline ml-1" /> : 
                          sector.trend < 0 ? 
                            <TrendingDown className="h-3 w-3 inline ml-1" /> : null}
                      </div>
                    </div>
                    <Progress 
                      value={(sector.performance / 160) * 100} 
                      className="h-3 flex-grow"
                      style={{
                        background: sector.performance < 80 ? '#fee2e2' : 
                                 sector.performance < 100 ? '#fef3c7' : '#dcfce7'
                      }}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          {/* International Relations Card */}
          <Card className="col-span-3">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">International Relations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {Object.entries(playerRegion.relationships).map(([regionId, value]) => {
                  const region = regions.find(r => r.id === regionId);
                  if (!region) return null;
                  
                  return (
                    <div key={regionId} className="border rounded-lg p-2">
                      <div className="text-sm font-medium mb-1">{region.name}</div>
                      <Progress 
                        value={value} 
                        className="h-2"
                        style={{
                          background: value < 40 ? '#fee2e2' : 
                                   value < 70 ? '#fef3c7' : '#dcfce7'
                        }}
                      />
                      <div className="mt-1 text-xs text-right">{value}/100</div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Game controls */}
        <div className="fixed bottom-0 left-0 right-0 border-t bg-background p-3">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={() => setShowTutorial(true)}>
                Tutorial
              </Button>
              <select
                className="p-1 rounded border text-sm"
                value={gameSpeed}
                onChange={(e) => setGameSpeed(e.target.value as 'Slow' | 'Normal' | 'Fast')}
              >
                <option value="Slow">Slow</option>
                <option value="Normal">Normal</option>
                <option value="Fast">Fast</option>
              </select>
            </div>
            
            <Button variant="outline" size="sm" onClick={endGame}>
              End Game
            </Button>
          </div>
        </div>
        
        {/* Event popup */}
        <AnimatePresence>
          {currentEvent && showEventDetails && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
            >
              <Card className="w-full max-w-2xl">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl">{currentEvent.title}</CardTitle>
                      <CardDescription>{currentEvent.type.charAt(0).toUpperCase() + currentEvent.type.slice(1)} Event</CardDescription>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setShowEventDetails(false)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p>{currentEvent.description}</p>
                  
                  <div>
                    <h3 className="font-bold text-sm mb-2">Sector Impacts</h3>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      {Object.entries(currentEvent.sectorImpacts).map(([sector, impact]) => (
                        <div key={sector} className="flex items-center">
                          <span className="capitalize mr-2">{sector}</span>
                          <span className={impact >= 0 ? 'text-green-500' : 'text-red-500'}>
                            {impact >= 0 ? '+' : ''}{impact}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-bold text-sm mb-2">Educational Note</h3>
                    <p className="text-sm">{currentEvent.educationalContent.theory}</p>
                    <p className="text-sm mt-1 italic">{currentEvent.educationalContent.realWorldExample}</p>
                  </div>
                  
                  <div>
                    <h3 className="font-bold mb-2">Policy Options</h3>
                    <div className="space-y-3">
                      {currentEvent.policyOptions.map(policy => (
                        <Card key={policy.id} className="overflow-hidden">
                          <CardContent className="p-3">
                            <div className="font-bold">{policy.title}</div>
                            <p className="text-sm mb-2">{policy.description}</p>
                            
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                              {Object.entries(policy.effects)
                                .filter(([key]) => typeof policy.effects[key] === 'number' && key !== 'interestRate' && key !== 'tradeBalance' && key !== 'marketHealth')
                                .map(([sector, impact]) => (
                                  <div key={sector} className="flex justify-between">
                                    <span className="capitalize">{sector}</span>
                                    <span className={Number(impact) >= 0 ? 'text-green-500' : 'text-red-500'}>
                                      {Number(impact) >= 0 ? '+' : ''}{impact}%
                                    </span>
                                  </div>
                              ))}
                              
                              {policy.effects.interestRate !== undefined && (
                                <div className="flex justify-between">
                                  <span>Interest Rate</span>
                                  <span className={policy.effects.interestRate >= 0 ? 'text-red-500' : 'text-green-500'}>
                                    {policy.effects.interestRate >= 0 ? '+' : ''}{policy.effects.interestRate}%
                                  </span>
                                </div>
                              )}
                              
                              {policy.effects.tradeBalance !== undefined && (
                                <div className="flex justify-between">
                                  <span>Trade Balance</span>
                                  <span className={policy.effects.tradeBalance >= 0 ? 'text-green-500' : 'text-red-500'}>
                                    {policy.effects.tradeBalance >= 0 ? '+' : ''}{policy.effects.tradeBalance}B
                                  </span>
                                </div>
                              )}
                              
                              {policy.effects.marketHealth !== undefined && (
                                <div className="flex justify-between">
                                  <span>Market Health</span>
                                  <span className={policy.effects.marketHealth >= 0 ? 'text-green-500' : 'text-red-500'}>
                                    {policy.effects.marketHealth >= 0 ? '+' : ''}{policy.effects.marketHealth}%
                                  </span>
                                </div>
                              )}
                            </div>
                          </CardContent>
                          <div className="border-t p-2 text-center">
                            <Button 
                              size="sm" 
                              className="w-full"
                              onClick={() => handlePolicySelection(policy)}
                            >
                              Select
                            </Button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };
  
  // Game over screen
  const renderGameOver = () => {
    // Calculate final score
    const finalScore = playerRegion ? Math.floor(
      (playerRegion.economicStats.marketHealth + 
       playerRegion.economicStats.gdp + 
       playerRegion.economicStats.politicalStability +
       Object.values(playerRegion.sectors).reduce((sum, sector) => sum + sector.performance, 0) / 5 +
       Object.values(playerRegion.relationships).reduce((sum, val) => sum + val, 0) / 4) / 3
    ) : 0;
    
    // Calculate tickets earned (1 per 50 points)
    const ticketsEarned = Math.floor(finalScore / 50);
    
    return (
      <GameOver
        score={finalScore}
        message={`You completed ${gameTurn} turns as leader of ${playerRegion?.name}!`}
        tickets={ticketsEarned}
        onPlayAgain={restartGame}
        onReturnToHub={returnToHub}
      />
    );
  };
  
  // Main render
  if (gamePhase === 'selection') {
    return (
      <div>
        {showTutorial && renderTutorial()}
        {renderRegionSelection()}
      </div>
    );
  }
  
  if (gamePhase === 'playing') {
    return (
      <div>
        {showTutorial && renderTutorial()}
        {renderGamePlay()}
      </div>
    );
  }
  
  if (gamePhase === 'ended') {
    return renderGameOver();
  }
  
  return null;
}