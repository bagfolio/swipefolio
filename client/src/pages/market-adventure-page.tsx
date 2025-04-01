import React from 'react';
import { MarketAdventureGame } from '@/components/market-adventure-game';
import { GameBackButton } from '@/components/ui/game-back-button';

export default function MarketAdventurePage() {
  return (
    <div className="pb-20 pt-16">
      <GameBackButton />
      <MarketAdventureGame />
    </div>
  );
}