import React from 'react';
import { InvestorSimulatorGame } from '@/components/investor-simulator-game';
import { GameBackButton } from '@/components/ui/game-back-button';

export default function InvestorSimulatorPage() {
  return (
    <div className="pb-20 pt-16">
      <GameBackButton />
      <InvestorSimulatorGame />
    </div>
  );
}