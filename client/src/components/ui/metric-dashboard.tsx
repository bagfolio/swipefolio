import React from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingDown, 
  TrendingUp, 
  Minus,
  Info
} from 'lucide-react';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export interface MetricValue {
  name: string;
  value: number;
  previousValue?: number;
  category: 'Growth' | 'Stability' | 'Momentum' | 'Value';
  description?: string;
}

interface MetricDashboardProps {
  metrics: MetricValue[];
  companyName: string;
  className?: string;
}

export function MetricDashboard({ metrics, companyName, className }: MetricDashboardProps) {
  // Group metrics by category
  const metricsByCategory = metrics.reduce((acc, metric) => {
    if (!acc[metric.category]) {
      acc[metric.category] = [];
    }
    acc[metric.category].push(metric);
    return acc;
  }, {} as Record<string, MetricValue[]>);
  
  // Calculate overall category scores
  const categoryScores = Object.entries(metricsByCategory).map(([category, metrics]) => {
    // Simple average for demonstration
    const average = metrics.reduce((sum, metric) => sum + metric.value, 0) / metrics.length;
    return {
      category,
      score: Math.round(average)
    };
  });

  return (
    <div className={cn("space-y-4", className)}>
      <div className="px-4">
        <h2 className="text-xl font-bold mb-1">{companyName} Metrics</h2>
        <p className="text-sm text-gray-500">
          Current company performance metrics across key categories
        </p>
      </div>
      
      {/* Category Score Cards */}
      <div className="grid grid-cols-2 gap-3 px-4">
        {categoryScores.map(({ category, score }) => (
          <Card key={category} className="overflow-hidden">
            <div className={cn(
              "h-1 w-full",
              category === 'Growth' ? "bg-emerald-500" : "",
              category === 'Stability' ? "bg-blue-500" : "",
              category === 'Momentum' ? "bg-purple-500" : "",
              category === 'Value' ? "bg-amber-500" : ""
            )} />
            <CardContent className="p-3">
              <div className="flex justify-between items-center">
                <h3 className="font-medium text-sm">{category}</h3>
                <span className={cn(
                  "text-lg font-bold",
                  score >= 70 ? "text-green-600" : "",
                  score >= 40 && score < 70 ? "text-amber-600" : "",
                  score < 40 ? "text-red-600" : ""
                )}>
                  {score}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Metric Details by Category */}
      <div className="space-y-4">
        {Object.entries(metricsByCategory).map(([category, metrics]) => (
          <div key={category} className="space-y-2">
            <h3 className={cn(
              "text-sm font-semibold px-4",
              category === 'Growth' ? "text-emerald-700" : "",
              category === 'Stability' ? "text-blue-700" : "",
              category === 'Momentum' ? "text-purple-700" : "",
              category === 'Value' ? "text-amber-700" : ""
            )}>
              {category} Metrics
            </h3>
            <div className="space-y-2 px-4">
              {metrics.map((metric) => (
                <MetricCard key={metric.name} metric={metric} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MetricCard({ metric }: { metric: MetricValue }) {
  // Calculate change percentage if previous value exists
  const hasChange = metric.previousValue !== undefined;
  const changePercent = hasChange 
    ? ((metric.value - metric.previousValue!) / Math.abs(metric.previousValue!) * 100)
    : 0;
  
  // Determine if change is positive, negative or neutral
  const changeType = !hasChange 
    ? 'neutral' 
    : changePercent > 0 
      ? 'positive' 
      : changePercent < 0 
        ? 'negative' 
        : 'neutral';
  
  return (
    <Card className="border-gray-200">
      <CardContent className="p-3 flex justify-between items-center">
        <div className="flex items-center">
          <span className="font-medium">{metric.name}</span>
          
          {metric.description && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info size={14} className="ml-1 text-gray-400" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs text-sm">{metric.description}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        
        <div className="flex items-center">
          <span className="font-bold mr-2">{formatMetricValue(metric.value, metric.name)}</span>
          
          {hasChange && (
            <div className={cn(
              "flex items-center text-xs rounded-full px-1.5 py-0.5",
              changeType === 'positive' ? "text-green-700 bg-green-100" : "",
              changeType === 'negative' ? "text-red-700 bg-red-100" : "",
              changeType === 'neutral' ? "text-gray-700 bg-gray-100" : "",
            )}>
              {changeType === 'positive' && <TrendingUp size={12} className="mr-0.5" />}
              {changeType === 'negative' && <TrendingDown size={12} className="mr-0.5" />}
              {changeType === 'neutral' && <Minus size={12} className="mr-0.5" />}
              
              {changePercent !== 0 && (
                <span>
                  {changeType === 'positive' ? '+' : ''}
                  {changePercent.toFixed(1)}%
                </span>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Helper to format metric values based on their name
function formatMetricValue(value: number, metricName: string): string {
  // Common financial metrics formatting
  if (metricName.includes('Ratio') || metricName === 'Beta') {
    return value.toFixed(2);
  }
  
  if (metricName.includes('Yield') || metricName.includes('Margin') || metricName.includes('Growth')) {
    return `${value.toFixed(1)}%`;
  }
  
  if (metricName === 'EPS') {
    return `$${value.toFixed(2)}`;
  }
  
  // Default formatting
  if (value >= 100) {
    return value.toFixed(0);
  }
  
  return value.toFixed(1);
}