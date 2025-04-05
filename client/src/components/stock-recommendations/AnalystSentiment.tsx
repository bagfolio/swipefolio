import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import AnalystRatingsRedesign from '@/components/stock-detail/analyst-ratings-redesign';

interface AnalystSentimentProps {
  symbol: string;
}

export function AnalystSentiment({ symbol }: AnalystSentimentProps) {
  return (
    <div className="w-full max-w-3xl">
      <AnalystRatingsRedesign 
        symbol={symbol} 
        className="w-full shadow-md"
      />
    </div>
  );
}