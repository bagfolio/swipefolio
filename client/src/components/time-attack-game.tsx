import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from './ui/card';
import { useGameState } from '@/hooks/use-game-state';
import { GameHeader, MetricCard, GameButton, GameProgress, GameOver } from './ui/game-elements';
import { METRIC_QUESTIONS, GAME_CONSTANTS } from '@/constants/game-data';
import { Ticket } from 'lucide-react';
import type { MetricQuestion } from '@/types/game';

export function TimeAttackGame() {
  const {
    gameState,
    updateScore,
    addTickets,
    resetGame
  } = useGameState();

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_CONSTANTS.GAME_TIME_LIMIT);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [questions, setQuestions] = useState<MetricQuestion[]>([]);
  const [correctAnswers, setCorrectAnswers] = useState(0);

  // Initialize randomized questions when game starts
  useEffect(() => {
    if (gameStarted && !gameOver) {
      // Create a copy of questions and shuffle them
      const shuffledQuestions = [...METRIC_QUESTIONS]
        .sort(() => Math.random() - 0.5)
        .slice(0, GAME_CONSTANTS.QUESTIONS_PER_GAME);
      setQuestions(shuffledQuestions);
      setCurrentQuestion(0);
      setCorrectAnswers(0);
    }
  }, [gameStarted, gameOver]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (gameStarted && !gameOver && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setGameOver(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [gameStarted, gameOver, timeLeft]);

  const handleAnswer = (isGood: boolean) => {
    const currentQ = questions[currentQuestion];
    if (isGood === currentQ.isGood) {
      const newCorrectAnswers = correctAnswers + 1;
      setCorrectAnswers(newCorrectAnswers);
      updateScore(1);
      
      // Award ticket for every 10 correct answers
      if (newCorrectAnswers % 10 === 0) {
        addTickets(GAME_CONSTANTS.TICKETS_PER_10_CORRECT);
      }
    }
    
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setGameOver(true);
    }
  };

  const handleReset = () => {
    setCurrentQuestion(0);
    setTimeLeft(GAME_CONSTANTS.GAME_TIME_LIMIT);
    setGameStarted(false);
    setGameOver(false);
    setQuestions([]);
    setCorrectAnswers(0);
    resetGame();
  };

  const TicketAnimation = () => (
    <div className="flex flex-col items-center justify-center py-12 space-y-8">
      <motion.div
        className="relative"
        animate={{
          y: [0, -10, 0],
          rotate: [0, -5, 5, 0],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <motion.div
          animate={{
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <div className="relative bg-gradient-to-br from-green-400 to-green-500 p-8 rounded-xl shadow-lg">
            <Ticket className="w-20 h-20 text-white" strokeWidth={1.5} />
            <motion.div
              className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-300 rounded-full"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          </div>
        </motion.div>
      </motion.div>

      <div className="space-y-6">
        <h3 className="text-2xl font-semibold">Ready to test your knowledge?</h3>
        <p className="text-gray-600">Answer 10 questions correctly to earn a raffle ticket!</p>
        <GameButton 
          onClick={() => setGameStarted(true)} 
          variant="default"
        >
          Start Game
        </GameButton>
      </div>
    </div>
  );

  return (
    <motion.div 
      className="container mx-auto px-4 py-4 sm:py-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <GameHeader 
        title="Metric Time Attack" 
        tickets={gameState.tickets}
        timeLeft={gameStarted && !gameOver ? timeLeft : undefined}
      />

      <AnimatePresence mode="wait">
        {!gameStarted && !gameOver && (
          <motion.div
            key="start"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="mb-4 sm:mb-6">
              <div className="p-4 sm:p-6">
                <TicketAnimation />
              </div>
            </Card>
          </motion.div>
        )}

        {gameStarted && !gameOver && questions.length > 0 && (
          <motion.div
            key="game"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="mb-4">
              <GameProgress current={currentQuestion + 1} total={questions.length} />
            </div>
            
            <MetricCard 
              title={questions[currentQuestion].metric}
              value={questions[currentQuestion].companyValue}
              industryAverage={questions[currentQuestion].industryAverage}
              explanation={questions[currentQuestion].explanation}
            />
            
            <div className="grid grid-cols-2 gap-4 mt-4">
              <GameButton 
                onClick={() => handleAnswer(true)} 
                variant="good"
              >
                This is Good
              </GameButton>
              <GameButton 
                onClick={() => handleAnswer(false)} 
                variant="bad"
              >
                This is Bad
              </GameButton>
            </div>
          </motion.div>
        )}

        {gameOver && (
          <motion.div
            key="end"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card>
              <div className="p-4 sm:p-6">
                <GameOver 
                  score={correctAnswers}
                  correctAnswers={correctAnswers}
                  totalQuestions={questions.length}
                  onRestart={handleReset}
                />
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}