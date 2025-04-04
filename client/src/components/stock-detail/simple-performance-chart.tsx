import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface SimplePerformanceChartProps {
  symbol: string;
  companyName?: string;
}

// This is a placeholder component that will be replaced by the improved performance chart
const SimplePerformanceChart: React.FC<SimplePerformanceChartProps> = ({ 
  symbol, 
  companyName 
}) => {
  return (
    <Card className="w-full my-4">
      <CardContent className="p-4">
        <h3 className="text-lg font-semibold mb-2">Historical Performance</h3>
        <p className="text-sm text-gray-500">
          Loading performance data for {companyName || symbol}...
        </p>
      </CardContent>
    </Card>
  );
};

export default SimplePerformanceChart;