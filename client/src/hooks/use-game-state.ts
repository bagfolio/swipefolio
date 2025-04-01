import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

interface GameState {
  score: number;
  tickets: number;
  level: number;
  highScores: {
    boardRoom: number;
    timeAttack: number;
  }
}

const DEFAULT_GAME_STATE: GameState = {
  score: 0,
  tickets: 0,
  level: 1,
  highScores: {
    boardRoom: 0,
    timeAttack: 0
  }
};

// Local storage key
const GAME_STATE_KEY = 'swipefolio_game_state';

export function useGameState() {
  const [gameState, setGameState] = useState<GameState>(DEFAULT_GAME_STATE);
  const { toast } = useToast();

  // Initialize game state from localStorage
  useEffect(() => {
    const storedState = localStorage.getItem(GAME_STATE_KEY);
    if (storedState) {
      try {
        const parsedState = JSON.parse(storedState);
        setGameState(parsedState);
      } catch (error) {
        console.error('Failed to parse game state from localStorage:', error);
        // If parsing fails, reset to default
        setGameState(DEFAULT_GAME_STATE);
      }
    }
  }, []);

  // Save game state to localStorage when it changes
  useEffect(() => {
    localStorage.setItem(GAME_STATE_KEY, JSON.stringify(gameState));
  }, [gameState]);

  /**
   * Update score, increasing it by the given amount
   */
  const updateScore = (amount: number) => {
    setGameState(prev => ({
      ...prev,
      score: prev.score + amount
    }));
  };

  /**
   * Update high score for a specific game if the new score is higher
   */
  const updateHighScore = (game: 'boardRoom' | 'timeAttack', newScore: number) => {
    setGameState(prev => {
      const currentHighScore = prev.highScores[game];
      if (newScore > currentHighScore) {
        return {
          ...prev,
          highScores: {
            ...prev.highScores,
            [game]: newScore
          }
        };
      }
      return prev;
    });
  };

  /**
   * Add tickets to the player's balance
   */
  const addTickets = (amount: number) => {
    setGameState(prev => {
      const newState = {
        ...prev,
        tickets: prev.tickets + amount
      };
      
      // Show toast notification
      toast({
        title: `Earned ${amount} Tickets!`,
        description: `You now have ${newState.tickets} tickets total.`,
        variant: "default",
      });
      
      return newState;
    });
  };

  /**
   * Use tickets if the player has enough
   * Returns true if successful, false if not enough tickets
   */
  const useTickets = (amount: number): boolean => {
    if (gameState.tickets < amount) {
      toast({
        title: "Not Enough Tickets",
        description: `You need ${amount} tickets, but only have ${gameState.tickets}.`,
        variant: "destructive",
      });
      return false;
    }

    setGameState(prev => ({
      ...prev,
      tickets: prev.tickets - amount
    }));
    
    toast({
      title: `Used ${amount} Tickets`,
      description: `You have ${gameState.tickets - amount} tickets remaining.`,
      variant: "default",
    });
    
    return true;
  };

  /**
   * Increase player's level
   */
  const levelUp = () => {
    setGameState(prev => ({
      ...prev,
      level: prev.level + 1
    }));
    
    toast({
      title: "Level Up!",
      description: `You've reached level ${gameState.level + 1}!`,
      variant: "default",
    });
  };

  /**
   * Reset the game state
   */
  const resetGame = () => {
    setGameState(prev => ({
      ...prev,
      score: 0
    }));
  };

  /**
   * Reset the entire game state including high scores
   */
  const resetAllGameState = () => {
    setGameState(DEFAULT_GAME_STATE);
    localStorage.removeItem(GAME_STATE_KEY);
  };

  return {
    gameState,
    updateScore,
    updateHighScore,
    addTickets,
    useTickets,
    levelUp,
    resetGame,
    resetAllGameState
  };
}