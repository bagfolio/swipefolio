import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Timer, Ticket, Trophy, Sparkles, LineChart, BarChart, PieChart } from 'lucide-react';
import { cn } from '@/lib/utils';
import * as ConfettiModule from 'react-canvas-confetti';

// Game Header Component
export function GameHeader({ 
  title, 
  description,
  tickets, 
  timeLeft,
  icon 
}: { 
  title: string;
  description?: string; 
  tickets?: number;
  timeLeft?: number;
  icon?: React.ReactNode;
}) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="flex flex-col mb-6 sm:mb-8 mt-4">
      <div className="flex justify-between items-center bg-white rounded-xl shadow-md p-4 sm:p-5 border border-gray-100">
        <div className="flex items-center">
          {icon && (
            <div className="mr-3 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 p-3 rounded-lg">
              <span className="text-blue-500">{icon}</span>
            </div>
          )}
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{title}</h1>
            {description && <p className="text-gray-600 text-sm mt-1">{description}</p>}
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          {timeLeft !== undefined && (
            <div className="flex items-center bg-red-50 rounded-lg px-3 py-2 border border-red-100">
              <Timer className="w-4 h-4 text-red-500 mr-2" />
              <div className="font-mono text-lg font-medium text-red-600">
                {formatTime(timeLeft)}
              </div>
            </div>
          )}
          
          {tickets !== undefined && (
            <div className="flex items-center bg-gradient-to-r from-amber-100 to-amber-50 rounded-lg px-3 py-2 border border-amber-200 shadow-sm">
              <Ticket className="w-4 h-4 text-amber-500 mr-1.5" />
              <span className="font-medium text-amber-700">{tickets}</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Progress indicator bar - subtle animation */}
      <div className="h-1 w-full bg-gray-100 rounded-full mt-4 overflow-hidden">
        <motion.div 
          className="h-full bg-gradient-to-r from-blue-500 to-indigo-500"
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ duration: 30, ease: "linear", repeat: Infinity }}
        />
      </div>
    </div>
  );
}

// Game Progress Component
export function GameProgress({ 
  current, 
  total 
}: { 
  current: number; 
  total: number; 
}) {
  const progress = (current / total) * 100;
  
  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-5">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center">
          <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center mr-2">
            <span className="text-sm font-bold text-indigo-700">{current}</span>
          </div>
          <span className="text-sm font-medium text-gray-700">
            Question {current} of {total}
          </span>
        </div>
        <div className="flex items-center bg-indigo-50 rounded-full px-3 py-1">
          <motion.span 
            key={progress}
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="text-sm font-bold text-indigo-700"
          >
            {Math.round(progress)}%
          </motion.span>
        </div>
      </div>
      
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <motion.div 
          className="h-full bg-gradient-to-r from-indigo-500 to-blue-500"
          initial={{ width: `${(current - 1) / total * 100}%` }} 
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

// Metric Card Component
export function MetricCard({ 
  title, 
  value, 
  industryAverage, 
  explanation 
}: { 
  title: string; 
  value: string | number; 
  industryAverage: string | number;
  explanation?: string;
}) {
  return (
    <Card className="p-5 sm:p-6 border-2 border-indigo-100">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-indigo-900">{title}</h3>
          <div className="bg-indigo-50 px-2 py-1 rounded text-sm font-medium text-indigo-700">
            Industry: {industryAverage}
          </div>
        </div>
        
        <div className="flex justify-center">
          <div className="text-3xl sm:text-4xl font-bold text-indigo-600">{value}</div>
        </div>
        
        {explanation && (
          <div className="mt-4 p-3 bg-indigo-50 rounded-md text-sm text-indigo-900 border border-indigo-100">
            {explanation}
          </div>
        )}
      </div>
    </Card>
  );
}

// Game Button Component
export function GameButton({ 
  children, 
  onClick, 
  variant = 'default',
  disabled = false
}: { 
  children: React.ReactNode; 
  onClick: () => void; 
  variant?: 'default' | 'good' | 'bad'; 
  disabled?: boolean;
}) {
  const getButtonStyles = () => {
    switch (variant) {
      case 'good':
        return 'bg-green-500 hover:bg-green-600 text-white shadow-md shadow-green-200';
      case 'bad':
        return 'bg-red-500 hover:bg-red-600 text-white shadow-md shadow-red-200';
      default:
        return 'bg-blue-500 hover:bg-blue-600 text-white shadow-md shadow-blue-200';
    }
  };

  return (
    <Button
      onClick={onClick}
      className={cn(
        'w-full py-6 text-lg font-medium rounded-xl transition-all',
        getButtonStyles(),
        disabled && 'opacity-50 cursor-not-allowed'
      )}
      disabled={disabled}
    >
      {children}
    </Button>
  );
}

// Game Over Component
export function GameOver({ 
  score, 
  message,
  tickets,
  onPlayAgain,
  onReturnToHub,
  correctAnswers,
  totalQuestions,
  onRestart 
}: { 
  score: number; 
  message?: string;
  tickets?: number;
  onPlayAgain?: () => void;
  onReturnToHub?: () => void;
  // Legacy parameters for compatibility
  correctAnswers?: number;
  totalQuestions?: number;
  onRestart?: () => void; 
}) {
  // Trigger confetti effect with slight delay
  React.useEffect(() => {
    // Add slight delay for better user experience
    const timer = setTimeout(() => {
      const canvas = document.createElement('canvas');
      canvas.style.position = 'fixed';
      canvas.style.inset = '0';
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      canvas.style.pointerEvents = 'none';
      canvas.style.zIndex = '9999';
      document.body.appendChild(canvas);
  
      const createConfetti = (ConfettiModule as any).default;
      const myConfetti = createConfetti(canvas, {
        resize: true,
        useWorker: true,
      });
  
      // More colorful and dynamic confetti
      myConfetti({
        particleCount: 150,
        spread: 90,
        origin: { y: 0.6 },
        colors: ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'],
        shapes: ['circle', 'square'],
        gravity: 0.8,
        scalar: 1.2
      });
  
      // Second burst after a delay
      setTimeout(() => {
        myConfetti({
          particleCount: 80,
          spread: 120,
          origin: { y: 0.7, x: 0.3 },
          colors: ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'],
          startVelocity: 45
        });
      }, 700);
  
      // Third burst
      setTimeout(() => {
        myConfetti({
          particleCount: 80,
          spread: 120,
          origin: { y: 0.7, x: 0.7 },
          colors: ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'],
          startVelocity: 45
        });
      }, 1200);
  
      // Clean up
      return () => {
        document.body.removeChild(canvas);
      };
    }, 400); // Delay the confetti slightly

    return () => clearTimeout(timer);
  }, []);

  // Handle the two different interfaces
  const handlePlayAgain = onPlayAgain || onRestart;

  return (
    <motion.div 
      className="max-w-lg mx-auto py-6 space-y-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div className="bg-white p-8 rounded-2xl shadow-lg border border-indigo-100 text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ 
            type: "spring",
            stiffness: 260,
            damping: 20,
            delay: 0.1
          }}
          className="flex justify-center"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-300 to-purple-500 blur-xl opacity-30 rounded-full"></div>
            <div className="relative bg-gradient-to-br from-indigo-500 to-purple-600 p-6 rounded-full shadow-lg">
              <Trophy className="w-16 h-16 text-white" />
            </div>
            <motion.div
              className="absolute -top-3 -right-3"
              animate={{ 
                scale: [1, 1.2, 1],
                rotate: [0, 10, 0, -10, 0]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                repeatType: "reverse"
              }}
            >
              <Sparkles className="w-7 h-7 text-yellow-400" />
            </motion.div>
          </div>
        </motion.div>

        <motion.div 
          className="space-y-4 mt-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
            Game Complete!
          </h2>
          
          {message && (
            <p className="text-gray-600 text-lg">{message}</p>
          )}
          
          {(correctAnswers !== undefined && totalQuestions !== undefined) && (
            <div className="bg-indigo-50 p-3 rounded-lg inline-block">
              <p className="text-indigo-700">
                You got <span className="font-bold">{correctAnswers}</span> out of <span className="font-bold">{totalQuestions}</span> correct!
              </p>
            </div>
          )}
          
          <div className="mt-6">
            <motion.div
              className="text-3xl sm:text-4xl font-bold text-indigo-600 inline-block"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ 
                type: "spring", 
                stiffness: 300,
                delay: 0.5,
                duration: 0.5
              }}
            >
              {score} points
            </motion.div>
          </div>
          
          {tickets !== undefined && (
            <motion.div 
              className="flex justify-center items-center mt-4"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              <div className="bg-gradient-to-r from-amber-100 to-amber-200 px-5 py-3 rounded-lg flex items-center shadow-md">
                <Ticket className="w-6 h-6 text-amber-600 mr-3" />
                <span className="font-bold text-amber-800 text-lg">
                  +{tickets} Tickets
                </span>
              </div>
            </motion.div>
          )}
        </motion.div>
        
        <motion.div 
          className="flex flex-col sm:flex-row justify-center gap-4 mt-8"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
        >
          {handlePlayAgain && (
            <Button 
              onClick={handlePlayAgain}
              className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-8 py-3 font-semibold text-lg rounded-xl shadow-md hover:shadow-lg transition-all"
            >
              Play Again
            </Button>
          )}
          
          {onReturnToHub && (
            <Button 
              onClick={onReturnToHub}
              variant="outline"
              className="px-8 py-3 text-lg font-medium hover:bg-gray-50"
            >
              Return to Hub
            </Button>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}

// Decision Card Component for Board Room Game
export function DecisionCard({ 
  title, 
  description, 
  options,
  onSelect
}: { 
  title: string; 
  description: string; 
  options: { id: string; text: string; impact: string }[];
  onSelect: (id: string) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="p-6 sm:p-7 border border-indigo-100 shadow-lg rounded-xl bg-white">
        <div className="space-y-5">
          <div className="border-b border-indigo-100 pb-4">
            <h3 className="text-xl sm:text-2xl font-bold text-indigo-900 mb-2">{title}</h3>
            <p className="text-gray-600">{description}</p>
          </div>
          
          <div className="pt-2 space-y-4">
            {options.map((option, index) => (
              <motion.div
                key={option.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index, duration: 0.3 }}
              >
                <Button
                  onClick={() => onSelect(option.id)}
                  className="w-full justify-start text-left py-5 px-5 bg-gradient-to-r from-indigo-50 to-white hover:from-indigo-100 hover:to-indigo-50 text-indigo-900 font-medium border border-indigo-100 shadow-sm rounded-lg transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
                >
                  <div>
                    <span className="block text-base font-semibold">{option.text}</span>
                    {option.impact && (
                      <span className="text-xs text-indigo-600 mt-1 block opacity-80">
                        Impact: {option.impact}
                      </span>
                    )}
                  </div>
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

// Impact Card Component for Board Room Game
export function ImpactCard({ 
  metrics, 
  onContinue 
}: { 
  metrics: { name: string; change: number }[];
  onContinue: () => void;
}) {
  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-emerald-600 bg-emerald-50 border-emerald-100';
    if (change < 0) return 'text-red-600 bg-red-50 border-red-100';
    return 'text-gray-600 bg-gray-50 border-gray-100';
  };

  const getChangeSymbol = (change: number) => {
    if (change > 0) return '+';
    if (change < 0) return '';
    return '';
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="p-6 sm:p-7 border border-blue-100 shadow-lg rounded-xl overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
        <div className="space-y-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-full">
              <LineChart className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Impact on Metrics</h3>
          </div>
          
          <div className="space-y-3">
            {metrics.map((metric, index) => (
              <motion.div 
                key={metric.name}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index, duration: 0.3 }}
              >
                <div className="flex justify-between items-center p-4 rounded-lg border shadow-sm" 
                  style={{ backgroundColor: 'white' }}>
                  <span className="font-medium text-gray-800">{metric.name}</span>
                  <span className={`font-bold py-1 px-3 rounded-full text-sm border ${getChangeColor(metric.change)}`}>
                    {getChangeSymbol(metric.change)}{metric.change}%
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
          
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.3 }}
          >
            <Button 
              onClick={onContinue}
              className="w-full py-4 mt-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold text-lg rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
            >
              Continue
            </Button>
          </motion.div>
        </div>
      </Card>
    </motion.div>
  );
}