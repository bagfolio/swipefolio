import React from 'react';
import { MacroMastermindGame } from '@/components/macro-mastermind-game';
import { GameBackButton } from '@/components/ui/game-back-button';

export default function MacroMastermindPage() {
  return (
    <div className="pb-20 pt-16">
      <GameBackButton />
      <MacroMastermindGame />
    </div>
  );
}