import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import LessonPage from "@/pages/lesson-page";
import LearnPage from "@/pages/LearnPage";
import OnboardingPage from "@/pages/onboarding-page";
import StockDetailPage from "@/pages/stock-detail-page";
import StockDetailView from "@/pages/stock-detail-view";
import PortfolioPage from "@/pages/portfolio-page";
import LeaderboardPage from "@/pages/leaderboard-page-new";
import GamesHubPage from "@/pages/games-hub-page";
import BoardRoomPage from "@/pages/board-room-page";
import TimeAttackPage from "@/pages/time-attack-page";
import MarketAdventurePage from "@/pages/market-adventure-page";
import MacroMastermindPage from "@/pages/macro-mastermind-page";
import InvestorSimulatorPage from "@/pages/investor-simulator-page";
import AdminSettingsPage from "@/pages/admin-settings-page";
import AppleChartDemo from "@/pages/apple-chart-demo";
import { AuthProvider } from "@/hooks/use-auth";
import { UserProgressProvider } from "@/contexts/user-progress-context";
import { PortfolioProvider } from "@/contexts/portfolio-context";

function Router() {
  return (
    <PortfolioProvider>
      <Switch>
        <Route path="/" component={HomePage} />
        <Route path="/stock/:stackId" component={StockDetailPage} />
        <Route path="/stock-detail/:symbol" component={StockDetailView} />
        <Route path="/lesson/:stackId" component={LessonPage} />
        <Route path="/learn/:stackId" component={LearnPage} />
        <Route path="/learn" component={HomePage} />
        <Route path="/market" component={HomePage} />
        <Route path="/portfolio" component={PortfolioPage} />
        <Route path="/leaderboard" component={LeaderboardPage} />
        <Route path="/achievements" component={HomePage} />
        <Route path="/profile" component={HomePage} />
        <Route path="/onboarding" component={OnboardingPage} />
        <Route path="/auth" component={AuthPage} />
        <Route path="/games" component={GamesHubPage} />
        <Route path="/games/board-room" component={BoardRoomPage} />
        <Route path="/games/time-attack" component={TimeAttackPage} />
        <Route path="/games/market-adventure" component={MarketAdventurePage} />
        <Route path="/games/macro-mastermind" component={MacroMastermindPage} />
        <Route path="/games/investor-simulator" component={InvestorSimulatorPage} />
        <Route path="/admin/settings" component={AdminSettingsPage} />
        <Route path="/apple-chart" component={AppleChartDemo} />
        <Route component={NotFound} />
      </Switch>
    </PortfolioProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <UserProgressProvider>
          <Router />
          <Toaster />
        </UserProgressProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
