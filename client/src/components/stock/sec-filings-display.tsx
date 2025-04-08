import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { SecFiling, formatSecFilings, categorizeSecFilings } from '../../lib/sec-filings-helper';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar, ExternalLink, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

interface SecFilingsResponse {
  success?: boolean;
  symbol?: string;
  filings?: any[];
  error?: string;
  message?: string;
}

interface SecFilingsDisplayProps {
  symbol: string;
  className?: string;
}

export function SecFilingsDisplay({ symbol, className = '' }: SecFilingsDisplayProps) {
  const [selectedTab, setSelectedTab] = useState('annual');

  const { data, isLoading, error } = useQuery<SecFilingsResponse>({
    queryKey: ['/api/yahoo-finance/sec-filings', symbol],
    staleTime: 5 * 60 * 1000, // 5 minutes caching
    enabled: !!symbol
  });

  const filings = React.useMemo(() => {
    if (!data || !Array.isArray(data?.filings) || data?.error) {
      return [];
    }
    return formatSecFilings(data.filings);
  }, [data]);

  const categorizedFilings = React.useMemo(() => {
    return categorizeSecFilings(filings);
  }, [filings]);

  if (isLoading) {
    return <SecFilingsLoadingSkeleton />;
  }

  if (error || !data || (data as any).error) {
    return (
      <Card className={`${className} overflow-hidden h-full`}>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">SEC Filings</CardTitle>
          <CardDescription>
            Unable to load SEC filings information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {error instanceof Error ? error.message : 'Could not retrieve SEC filings data.'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`${className} overflow-hidden h-full`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">SEC Filings</CardTitle>
        <CardDescription>
          Recent financial disclosures for {symbol}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="annual" value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="annual" disabled={categorizedFilings.annual.length === 0}>
              Annual
            </TabsTrigger>
            <TabsTrigger value="quarterly" disabled={categorizedFilings.quarterly.length === 0}>
              Quarterly
            </TabsTrigger>
            <TabsTrigger value="other" disabled={categorizedFilings.other.length === 0}>
              Others
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[350px]">
            <TabsContent value="annual" className="mt-0">
              <FilingsList filings={categorizedFilings.annual} />
            </TabsContent>
            <TabsContent value="quarterly" className="mt-0">
              <FilingsList filings={categorizedFilings.quarterly} />
            </TabsContent>
            <TabsContent value="other" className="mt-0">
              <FilingsList filings={categorizedFilings.other} />
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </CardContent>
    </Card>
  );
}

interface FilingsListProps {
  filings: SecFiling[];
}

function FilingsList({ filings }: FilingsListProps) {
  if (filings.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        <FileText className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
        <p>No filings available in this category.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {filings.map((filing, index) => (
        <FilingCard key={`${filing.type}-${filing.date}-${index}`} filing={filing} />
      ))}
    </div>
  );
}

interface FilingCardProps {
  filing: SecFiling;
}

function FilingCard({ filing }: FilingCardProps) {
  return (
    <Card className="border-muted bg-card/50">
      <CardContent className="pt-4 px-4 pb-4">
        <div className="flex items-start justify-between">
          <div>
            <h4 className="text-sm font-medium">{filing.title}</h4>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              <Calendar className="h-3.5 w-3.5 mr-1" />
              <span>{filing.formattedDate || filing.date}</span>
            </div>

            {filing.highlights && filing.highlights.length > 0 && (
              <div className="mt-3 space-y-2">
                {filing.highlights.map((highlight, idx) => (
                  <div key={idx} className="text-xs">
                    <Badge variant="outline" className="mb-1">
                      {highlight.category}
                    </Badge>
                    <p className="font-medium">{highlight.value}</p>
                    <p className="text-muted-foreground">{highlight.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col items-end">
            <Badge variant="outline" className="self-end">
              {filing.type}
            </Badge>
            <a 
              href={filing.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="mt-2 text-xs flex items-center text-primary hover:underline"
            >
              <span className="mr-1">View</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SecFilingsLoadingSkeleton() {
  return (
    <Card className="overflow-hidden h-full">
      <CardHeader className="pb-2">
        <Skeleton className="h-5 w-[120px]" />
        <Skeleton className="h-4 w-[200px] mt-1" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-[250px] mb-4" />
        <div className="space-y-4">
          {Array(3).fill(0).map((_, i) => (
            <div key={i} className="border rounded-md p-4">
              <div className="flex justify-between items-start">
                <div>
                  <Skeleton className="h-4 w-[200px]" />
                  <Skeleton className="h-3 w-[100px] mt-2" />
                </div>
                <Skeleton className="h-5 w-[60px]" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}