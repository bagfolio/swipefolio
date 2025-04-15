import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Suspense, lazy } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { AuthProvider } from "@/hooks/use-auth";
import { UserProgressProvider } from "@/contexts/user-progress-context";
import { PortfolioProvider } from "@/contexts/portfolio-context";
import { usePreloadStockData } from "@/hooks/use-preload-stock-data";
import { ThemeProvider } from "@/contexts/theme-context";
import { ErrorBoundary } from "@/components/error-boundary";

// Lazy load components
const NotFound = lazy(() => import("@/pages/not-found"));
const HomePage = lazy(() => import("@/pages/home-page"));
const AuthPage = lazy(() => import("@/pages/auth-page"));
const LessonPage = lazy(() => import("@/pages/lesson-page"));
const LearnPage = lazy(() => import("@/pages/LearnPage"));
const OnboardingPage = lazy(() => import("@/pages/onboarding-page"));
const StockDetailPage = lazy(() => import("@/pages/stock-detail-page"));
const StockDetailView = lazy(() => import("@/pages/stock-detail-view"));
const PortfolioPage = lazy(() => import("@/pages/portfolio-page"));
const LeaderboardPage = lazy(() => import("@/pages/leaderboard-page-new"));
const GamesHubPage = lazy(() => import("@/pages/games-hub-page"));
const BoardRoomPage = lazy(() => import("@/pages/board-room-page"));
const TimeAttackPage = lazy(() => import("@/pages/time-attack-page"));
const MarketAdventurePage = lazy(() => import("@/pages/market-adventure-page"));
const MacroMastermindPage = lazy(() => import("@/pages/macro-mastermind-page"));
const InvestorSimulatorPage = lazy(() => import("@/pages/investor-simulator-page"));

// Loading component
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <Skeleton className="w-[300px] h-[200px]" />
  </div>
);

function Router() {
  return (
    <PortfolioProvider>
      <Switch>
        <Route path="/">
          <Suspense fallback={<LoadingFallback />}>
            <HomePage />
          </Suspense>
        </Route>
        <Route path="/stock/:stackId">
          <Suspense fallback={<LoadingFallback />}>
            <StockDetailPage />
          </Suspense>
        </Route>
        <Route path="/stock-detail/:symbol">
          <Suspense fallback={<LoadingFallback />}>
            <StockDetailView />
          </Suspense>
        </Route>
        <Route path="/lesson/:stackId">
          <Suspense fallback={<LoadingFallback />}>
            <LessonPage />
          </Suspense>
        </Route>
        <Route path="/learn/:stackId">
          <Suspense fallback={<LoadingFallback />}>
            <LearnPage />
          </Suspense>
        </Route>
        <Route path="/learn">
          <Suspense fallback={<LoadingFallback />}>
            <HomePage />
          </Suspense>
        </Route>
        <Route path="/market">
          <Suspense fallback={<LoadingFallback />}>
            <HomePage />
          </Suspense>
        </Route>
        <Route path="/portfolio">
          <Suspense fallback={<LoadingFallback />}>
            <PortfolioPage />
          </Suspense>
        </Route>
        <Route path="/leaderboard">
          <Suspense fallback={<LoadingFallback />}>
            <LeaderboardPage />
          </Suspense>
        </Route>
        <Route path="/achievements">
          <Suspense fallback={<LoadingFallback />}>
            <HomePage />
          </Suspense>
        </Route>
        <Route path="/profile">
          <Suspense fallback={<LoadingFallback />}>
            <HomePage />
          </Suspense>
        </Route>
        <Route path="/onboarding">
          <Suspense fallback={<LoadingFallback />}>
            <OnboardingPage />
          </Suspense>
        </Route>
        <Route path="/auth">
          <Suspense fallback={<LoadingFallback />}>
            <AuthPage />
          </Suspense>
        </Route>
        <Route path="/games">
          <Suspense fallback={<LoadingFallback />}>
            <GamesHubPage />
          </Suspense>
        </Route>
        <Route path="/games/board-room">
          <Suspense fallback={<LoadingFallback />}>
            <BoardRoomPage />
          </Suspense>
        </Route>
        <Route path="/games/time-attack">
          <Suspense fallback={<LoadingFallback />}>
            <TimeAttackPage />
          </Suspense>
        </Route>
        <Route path="/games/market-adventure">
          <Suspense fallback={<LoadingFallback />}>
            <MarketAdventurePage />
          </Suspense>
        </Route>
        <Route path="/games/macro-mastermind">
          <Suspense fallback={<LoadingFallback />}>
            <MacroMastermindPage />
          </Suspense>
        </Route>
        <Route path="/games/investor-simulator">
          <Suspense fallback={<LoadingFallback />}>
            <InvestorSimulatorPage />
          </Suspense>
        </Route>
        <Route>
          <Suspense fallback={<LoadingFallback />}>
            <NotFound />
          </Suspense>
        </Route>
      </Switch>
    </PortfolioProvider>
  );
}

// Global data preloader wrapped component
function GlobalDataProvider({ children }: { children: React.ReactNode }) {
  // This hook will aggressively preload all first stock cards data
  // to ensure there are NEVER any empty price placeholders
  usePreloadStockData();
  
  return <>{children}</>;
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <UserProgressProvider>
              <GlobalDataProvider>
                <Router />
                <Toaster />
              </GlobalDataProvider>
            </UserProgressProvider>
          </AuthProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
