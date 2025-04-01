import React from 'react';
import BoardRoomGame from '@/components/board-room-game';
import { GameBackButton } from '@/components/ui/game-back-button';

export default function BoardRoomPage() {
  return (
    <div className="pb-20 pt-16">
      <GameBackButton />
      <BoardRoomGame />
    </div>
  );
}