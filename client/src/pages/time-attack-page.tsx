import React from 'react';
import { TimeAttackGame } from '@/components/time-attack-game';
import { GameBackButton } from '@/components/ui/game-back-button';

export default function TimeAttackPage() {
  return (
    <div className="pb-20 pt-16">
      <GameBackButton />
      <TimeAttackGame />
    </div>
  );
}