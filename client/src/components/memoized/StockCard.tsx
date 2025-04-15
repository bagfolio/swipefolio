import React, { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface StockCardProps {
  symbol: string;
  name: string;
  price: number;
  change: number;
  isLoading?: boolean;
}

const StockCard: React.FC<StockCardProps> = memo(({ symbol, name, price, change, isLoading = false }) => {
  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <Skeleton className="h-4 w-3/4" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-full mb-2" />
          <Skeleton className="h-4 w-1/2" />
        </CardContent>
      </Card>
    );
  }

  const isPositive = change >= 0;
  const changeColor = isPositive ? 'text-green-500' : 'text-red-500';

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg">{name}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">${price.toFixed(2)}</div>
        <div className={`text-sm ${changeColor}`}>
          {isPositive ? '+' : ''}{change.toFixed(2)}%
        </div>
      </CardContent>
    </Card>
  );
});

StockCard.displayName = 'StockCard';

export default StockCard; 