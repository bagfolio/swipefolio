import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { AnimatePresence } from "framer-motion";
import { Card, Stack, UserProgress } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { useUserProgress } from "@/contexts/user-progress-context";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { X, ArrowLeft, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import SwipeableCard from "@/components/SwipeableCard";
import { toast } from "@/hooks/use-toast";

// Congratulations Popup Component
function CongratulationsPopup({ 
  earnedXp, 
  onReturn 
}: { 
  earnedXp: number, 
  onReturn: () => void 
}) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full mx-4 animate-in zoom-in-95 duration-300">
        <div className="text-center mb-4">
          <h2 className="text-2xl font-bold mb-2">Stack Complete! 🎉</h2>
          <p className="text-gray-600">
            You've completed this learning stack and earned {earnedXp} XP.
          </p>
        </div>
        <div className="flex justify-center">
          <Button onClick={onReturn} className="px-8">
            Return to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function LearnPage() {
  const { stackId } = useParams();
  const [_, setLocation] = useLocation();
  const { user } = useAuth();
  const { updateUserXp } = useUserProgress();
  
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showCompleteCard, setShowCompleteCard] = useState(false);
  const [earnedXp, setEarnedXp] = useState(0);
  
  // Number of cards to display in the stack visually (current card + preview cards)
  const CARDS_TO_RENDER = 3;
  
  // Get stack details
  const { data: stack, isLoading: isLoadingStack } = useQuery<Stack>({
    queryKey: [`/api/stacks/${stackId}`],
    enabled: !!stackId,
  });
  
  // Get cards for this stack
  const { data: cards, isLoading: isLoadingCards } = useQuery<Card[]>({
    queryKey: [`/api/stacks/${stackId}/cards`],
    enabled: !!stackId,
  });
  
  // Get user progress for this stack
  const { data: userProgress, isLoading: isLoadingProgress } = useQuery<UserProgress>({
    queryKey: [`/api/user-progress/${stackId}`],
    enabled: !!stackId && !!user,
  });
  
  // Update user progress mutation
  const updateProgressMutation = useMutation({
    mutationFn: async (data: { currentCardIndex: number, completed: boolean, earnedXp: number }) => {
      const res = await apiRequest("PATCH", `/api/user-progress/${stackId}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/user-progress/${stackId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/user-progress"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user-daily-progress"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user-badges"] });
    }
  });
  
  // Initialize with user's saved progress
  useEffect(() => {
    if (userProgress && !isLoadingProgress) {
      setCurrentCardIndex(userProgress.currentCardIndex);
    }
  }, [userProgress, isLoadingProgress]);
  
  // Handle card swipe left (skip/not confident)
  const handleSwipeLeft = () => {
    if (!cards) return;
    handleNextCard(3); // Less XP for skipping
  };
  
  // Handle card swipe right (got it/confident)
  const handleSwipeRight = () => {
    if (!cards) return;
    handleNextCard(5); // More XP for confidence
  };
  
  // Update progress when moving to next card
  const handleNextCard = (xpToAdd = 5) => {
    if (!cards) return;
    
    setEarnedXp(prev => prev + xpToAdd);
    
    const newIndex = currentCardIndex + 1;
    setCurrentCardIndex(newIndex);
    
    // Check if lesson is complete
    if (newIndex >= cards.length) {
      setShowCompleteCard(true);
      updateProgressMutation.mutate({
        currentCardIndex: newIndex,
        completed: true,
        earnedXp: earnedXp + xpToAdd
      });
      
      // Update user XP context
      updateUserXp(earnedXp + xpToAdd);
      
      // Show toast
      toast({
        title: "Stack Complete!",
        description: `You've earned ${earnedXp + xpToAdd} XP`,
      });
    } else {
      updateProgressMutation.mutate({
        currentCardIndex: newIndex,
        completed: false,
        earnedXp: 0 // We only award XP when the stack is completed
      });
    }
  };
  
  const handleReturn = () => {
    setLocation("/");
  };
  
  const isLoading = isLoadingStack || isLoadingCards || isLoadingProgress;
  
  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-gray-50 z-40 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!stack || !cards) {
    return (
      <div className="fixed inset-0 bg-gray-50 z-40 flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">Content Not Found</h3>
          <p className="text-gray-600 mb-4">We couldn't find this learning content.</p>
          <Button onClick={handleReturn}>Return to Dashboard</Button>
        </div>
      </div>
    );
  }
  
  // Calculate progress percentage
  const progressPercentage = (currentCardIndex / cards.length) * 100;
  
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="icon" 
            className="mr-2"
            onClick={handleReturn}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">{stack.title}</h1>
        </div>
        <div className="flex items-center text-sm">
          <div className="font-medium mr-2">Progress</div>
          <div className="w-32 mr-2">
            <Progress value={progressPercentage} className="h-2" />
          </div>
          <div className="text-gray-500">
            {currentCardIndex}/{cards.length}
          </div>
        </div>
      </header>
      
      {/* Main content */}
      <main className="flex-1 flex items-center justify-center p-4 relative">
        <div className="w-full max-w-md h-[500px] relative">
          <div className="relative h-full w-full">
            <AnimatePresence initial={false}>
              {/* Render a slice of cards from the current index */}
              {cards
                .slice(currentCardIndex, currentCardIndex + CARDS_TO_RENDER)
                .map((card, index) => (
                  <SwipeableCard
                    key={card.id}
                    card={card}
                    onSwipeLeft={handleSwipeLeft}
                    onSwipeRight={handleSwipeRight}
                    indexInStack={index}
                    totalInStack={Math.min(CARDS_TO_RENDER, cards.length - currentCardIndex)}
                  />
                ))
              }
            </AnimatePresence>
            
            {/* Empty stack indicator */}
            {currentCardIndex >= cards.length && !showCompleteCard && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <h3 className="text-lg font-semibold mb-2">All Done!</h3>
                  <p className="text-gray-600 mb-4">You've completed all cards in this stack.</p>
                  <Button onClick={handleReturn}>Return to Dashboard</Button>
                </div>
              </div>
            )}
          </div>
          
          {/* Swipe instructions */}
          <div className="mt-6 flex justify-between px-8 text-sm text-gray-500">
            <div className="flex items-center">
              <X className="h-4 w-4 mr-1" />
              <span>Swipe left to skip</span>
            </div>
            <div className="flex items-center">
              <span>Swipe right when confident</span>
              <X className="h-4 w-4 ml-1 rotate-45" />
            </div>
          </div>
        </div>
      </main>
      
      {/* Complete popup */}
      {showCompleteCard && (
        <CongratulationsPopup earnedXp={earnedXp} onReturn={handleReturn} />
      )}
    </div>
  );
}