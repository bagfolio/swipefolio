import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import TopicBubble from "@/components/ui/topic-bubble";
import ChoiceButton from "@/components/ui/choice-button";
import { ArrowLeft, ArrowRight, Home } from "lucide-react";

type ExperienceLevel = "beginner" | "some-knowledge" | "intermediate" | "advanced";
type DailyGoalOption = 1 | 3 | 5;

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>("beginner");
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [dailyGoal, setDailyGoal] = useState<DailyGoalOption>(3);
  
  const { updateOnboardingMutation } = useAuth();
  const [_, setLocation] = useLocation();
  
  const handleNextStep = () => {
    setStep(prev => prev + 1);
  };
  
  const handlePrevStep = () => {
    setStep(prev => prev - 1);
  };
  
  const handleTopicToggle = (topic: string) => {
    setSelectedTopics(prev => 
      prev.includes(topic) 
        ? prev.filter(t => t !== topic) 
        : [...prev, topic]
    );
  };
  
  const handleCompleteOnboarding = () => {
    updateOnboardingMutation.mutate({
      experienceLevel,
      interests: selectedTopics,
      dailyGoal
    }, {
      onSuccess: () => {
        setLocation("/");
      }
    });
  };
  
  const handleSkip = () => {
    updateOnboardingMutation.mutate({
      experienceLevel: "beginner",
      interests: ["Technology", "Stock Market"],
      dailyGoal: 3
    }, {
      onSuccess: () => {
        setLocation("/");
      }
    });
  };
  
  const topics = [
    "Tech Industry", "Stock Market", "Crypto", "Real Estate", 
    "Personal Finance", "Retirement", "Healthcare", 
    "Consumer Goods", "Renewable Energy", "Banking"
  ];
  
  return (
    <div className="fixed inset-0 bg-white z-50">
      <div className="relative h-full flex flex-col">
        {/* Onboarding Header */}
        <div className="p-4 flex items-center justify-between">
          <div className="w-8">
            {step > 0 && (
              <button 
                onClick={handlePrevStep}
                className="p-2 rounded-full hover:bg-gray-100 transition"
              >
                <ArrowLeft className="text-gray-700" size={16} />
              </button>
            )}
          </div>
          
          <div className="flex space-x-1">
            {[0, 1, 2, 3].map(i => (
              <div 
                key={i}
                className={`h-1 w-6 rounded-full transition-colors ${
                  i <= step ? "bg-primary-500" : "bg-gray-200"
                }`}
              />
            ))}
          </div>
          
          <div className="w-8">
            <button 
              onClick={handleSkip}
              className="text-sm text-gray-500 font-medium"
            >
              Skip
            </button>
          </div>
        </div>
        
        {/* Onboarding Content */}
        <div className="flex-1 relative overflow-hidden">
          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div
                key="welcome"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0 flex flex-col items-center justify-between p-6"
              >
                <div></div>
                
                <div className="text-center">
                  <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-12 h-12 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <h1 className="text-2xl font-semibold text-gray-800 mb-3 font-poppins">Welcome to Swipefolio<sup className="text-xs">™</sup></h1>
                  <p className="text-gray-600">Your personal finance learning journey starts here. Swipe through bite-sized lessons and build your financial knowledge, one card at a time.</p>
                </div>
                
                <button 
                  onClick={handleNextStep}
                  className="bg-primary-500 hover:bg-primary-600 text-white font-medium py-3 px-6 rounded-lg w-full flex items-center justify-center transition duration-200 ease-in-out"
                >
                  <span>Get Started</span>
                  <ArrowRight className="ml-2" size={18} />
                </button>
              </motion.div>
            )}
            
            {step === 1 && (
              <motion.div
                key="experience"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0 flex flex-col items-center justify-between p-6"
              >
                <div></div>
                
                <div className="w-full">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4 font-poppins">What's your experience with finance?</h2>
                  <p className="text-gray-600 mb-6">We'll tailor your learning journey based on your current knowledge.</p>
                  
                  <div className="space-y-3">
                    <ChoiceButton
                      selected={experienceLevel === "beginner"}
                      onClick={() => setExperienceLevel("beginner")}
                      title="I'm a beginner"
                      description="New to finance concepts and terminology"
                    />
                    
                    <ChoiceButton
                      selected={experienceLevel === "some-knowledge"}
                      onClick={() => setExperienceLevel("some-knowledge")}
                      title="I have some knowledge"
                      description="Familiar with basic concepts but want to learn more"
                    />
                    
                    <ChoiceButton
                      selected={experienceLevel === "intermediate"}
                      onClick={() => setExperienceLevel("intermediate")}
                      title="I'm intermediate"
                      description="Comfortable with many finance topics but looking to expand"
                    />
                    
                    <ChoiceButton
                      selected={experienceLevel === "advanced"}
                      onClick={() => setExperienceLevel("advanced")}
                      title="I'm advanced"
                      description="Experienced with finance and seeking specialized knowledge"
                    />
                  </div>
                </div>
                
                <button
                  onClick={handleNextStep}
                  className="bg-primary-500 hover:bg-primary-600 text-white font-medium py-3 px-6 rounded-lg w-full flex items-center justify-center transition duration-200 ease-in-out mt-6"
                >
                  <span>Continue</span>
                  <ArrowRight className="ml-2" size={18} />
                </button>
              </motion.div>
            )}
            
            {step === 2 && (
              <motion.div
                key="interests"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0 flex flex-col items-center justify-between p-6"
              >
                <div></div>
                
                <div className="w-full">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4 font-poppins">What interests you most?</h2>
                  <p className="text-gray-600 mb-6">Select topics you'd like to learn about. You can change these later.</p>
                  
                  <div className="flex flex-wrap">
                    {topics.map(topic => (
                      <TopicBubble
                        key={topic}
                        label={topic}
                        selected={selectedTopics.includes(topic)}
                        onClick={() => handleTopicToggle(topic)}
                      />
                    ))}
                  </div>
                </div>
                
                <button
                  onClick={handleNextStep}
                  className="bg-primary-500 hover:bg-primary-600 text-white font-medium py-3 px-6 rounded-lg w-full flex items-center justify-center transition duration-200 ease-in-out mt-6"
                  disabled={selectedTopics.length === 0}
                >
                  <span>Continue</span>
                  <ArrowRight className="ml-2" size={18} />
                </button>
              </motion.div>
            )}
            
            {step === 3 && (
              <motion.div
                key="daily-goal"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0 flex flex-col items-center justify-between p-6"
              >
                <div></div>
                
                <div className="w-full">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4 font-poppins">Set your daily goal</h2>
                  <p className="text-gray-600 mb-6">How many lessons would you like to complete each day?</p>
                  
                  <div className="space-y-3">
                    <ChoiceButton
                      selected={dailyGoal === 1}
                      onClick={() => setDailyGoal(1)}
                      title="Casual (1 lesson)"
                      rightText="~5 min/day"
                    />
                    
                    <ChoiceButton
                      selected={dailyGoal === 3}
                      onClick={() => setDailyGoal(3)}
                      title="Regular (3 lessons)"
                      rightText="~15 min/day"
                    />
                    
                    <ChoiceButton
                      selected={dailyGoal === 5}
                      onClick={() => setDailyGoal(5)}
                      title="Ambitious (5 lessons)"
                      rightText="~25 min/day"
                    />
                  </div>
                </div>
                
                <button
                  onClick={handleCompleteOnboarding}
                  className="bg-primary-500 hover:bg-primary-600 text-white font-medium py-3 px-6 rounded-lg w-full flex items-center justify-center transition duration-200 ease-in-out mt-6"
                  disabled={updateOnboardingMutation.isPending}
                >
                  {updateOnboardingMutation.isPending ? (
                    <>
                      <span>Setting up...</span>
                      <Loader2 className="ml-2 animate-spin" size={18} />
                    </>
                  ) : (
                    <>
                      <span>Start Learning</span>
                      <Home className="ml-2" size={18} />
                    </>
                  )}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
