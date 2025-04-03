import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Users, 
  Building2, 
  TrendingUp, 
  AlertTriangle, 
  Shield, 
  ClipboardCheck, 
  PieChart,
  Info,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

interface ManagementSectionProps {
  symbol: string;
  className?: string;
}

// Types for institutional and insider data
interface MajorHolders {
  insidersPercentHeld: number;
  institutionsPercentHeld: number;
  institutionsFloatPercentHeld: number;
  institutionsCount: number;
}

interface InstitutionalHolder {
  holder: string;
  shares: number;
  value: number;
  percentHeld: number;
  percentChange: number;
  dateReported: string;
}

// This function takes a large number and formats it with appropriate suffixes
function formatLargeNumber(num: number): string {
  if (num >= 1e12) {
    return (num / 1e12).toFixed(2) + 'T';
  } else if (num >= 1e9) {
    return (num / 1e9).toFixed(2) + 'B';
  } else if (num >= 1e6) {
    return (num / 1e6).toFixed(2) + 'M';
  } else if (num >= 1e3) {
    return (num / 1e3).toFixed(2) + 'K';
  }
  return num.toString();
}

export function ManagementSection({ symbol, className }: ManagementSectionProps) {
  const [selectedInstitution, setSelectedInstitution] = useState<InstitutionalHolder | null>(null);
  
  // Fetch major holders data
  const { data: majorHolders, isLoading: isMajorHoldersLoading } = useQuery({
    queryKey: ['/api/stock', symbol, 'major-holders'],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/pg/stock/${symbol}/major-holders`);
        if (!response.ok) throw new Error('Failed to fetch major holders');
        
        const data = await response.json();
        if (!data.success) throw new Error(data.message || 'Failed to fetch major holders');
        
        return data.data as MajorHolders;
      } catch (error) {
        console.error('Error fetching major holders:', error);
        return null;
      }
    },
    enabled: !!symbol,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
  
  // Fetch institutional holders data
  const { data: institutionalHolders, isLoading: isInstitutionalHoldersLoading } = useQuery({
    queryKey: ['/api/stock', symbol, 'institutional-holders'],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/pg/stock/${symbol}/institutional-holders`);
        if (!response.ok) throw new Error('Failed to fetch institutional holders');
        
        const data = await response.json();
        if (!data.success) throw new Error(data.message || 'Failed to fetch institutional holders');
        
        return data.data as InstitutionalHolder[];
      } catch (error) {
        console.error('Error fetching institutional holders:', error);
        return null;
      }
    },
    enabled: !!symbol,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Fetch ESG data for the stock
  const { data: esgData, isLoading: isEsgLoading } = useQuery({
    queryKey: ['/api/stock', symbol, 'esg-data'],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/pg/stock/${symbol}/esg-data`);
        if (!response.ok) throw new Error('Failed to fetch ESG data');
        
        const data = await response.json();
        if (!data.success) throw new Error(data.message || 'Failed to fetch ESG data');
        
        return data.data || {
          esgScore: 68,
          environmentalScore: 72,
          socialScore: 65,
          governanceScore: 71,
          controversyLevel: 2,
          managementRisk: 'Low',
          boardRisk: 'Medium',
          auditRisk: 'Low',
          compensationRisk: 'Medium',
        };
      } catch (error) {
        console.error('Error fetching ESG data:', error);
        // Fallback data in case of error
        return {
          esgScore: 68,
          environmentalScore: 72,
          socialScore: 65,
          governanceScore: 71,
          controversyLevel: 2,
          managementRisk: 'Low',
          boardRisk: 'Medium',
          auditRisk: 'Low',
          compensationRisk: 'Medium',
        };
      }
    },
    enabled: !!symbol,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
  
  const isLoading = isMajorHoldersLoading || isInstitutionalHoldersLoading || isEsgLoading;
  
  const renderHolderDescription = (holder: InstitutionalHolder) => {
    // Generate descriptions based on the institution
    const descriptions: {[key: string]: string} = {
      "Vanguard Group Inc": "Vanguard is known for its passive index fund investing strategy and typically holds long-term positions.",
      "Blackrock Inc.": "BlackRock is the world's largest asset manager, focusing on both active and passive investment strategies.",
      "State Street Corporation": "State Street is a major custodian bank and asset manager specializing in services for institutional investors.",
      "FMR, LLC": "FMR (Fidelity) combines active management with strong research capabilities across various asset classes.",
      "Geode Capital Management, LLC": "Geode serves as a sub-advisor to Fidelity, primarily managing index funds through quantitative methods.",
      "Berkshire Hathaway, Inc": "Warren Buffett's holding company known for long-term value investing in companies with strong fundamentals.",
      "Morgan Stanley": "Morgan Stanley combines investment banking expertise with wealth and asset management services.",
      "Price (T.Rowe) Associates Inc": "T. Rowe Price is known for its active management approach based on fundamental research.",
      "NORGES BANK": "Norway's central bank manages the Norwegian Government Pension Fund, one of the world's largest sovereign wealth funds.",
      "JPMORGAN CHASE & CO": "JPMorgan combines commercial banking with investment services and asset management capabilities."
    };
    
    return descriptions[holder.holder] || 
      `${holder.holder} holds ${formatLargeNumber(holder.shares)} shares representing ${(holder.percentHeld * 100).toFixed(2)}% of outstanding shares.`;
  };
  
  const getInstitutionChangeColor = (percentChange: number) => {
    if (percentChange > 0) return "text-green-600";
    if (percentChange < 0) return "text-red-600";
    return "text-gray-600";
  };
  
  const getInstitutionChangeIcon = (percentChange: number) => {
    if (percentChange > 0) return <ArrowUpRight className="h-3 w-3 text-green-600" />;
    if (percentChange < 0) return <ArrowDownRight className="h-3 w-3 text-red-600" />;
    return null;
  };
  
  const getScoreColor = (score: number) => {
    if (score >= 70) return "text-green-600";
    if (score >= 50) return "text-yellow-600";
    return "text-red-600";
  };
  
  const getRiskColor = (risk: string) => {
    switch (risk.toLowerCase()) {
      case 'low': return "text-green-600";
      case 'medium': return "text-yellow-600";
      case 'high': return "text-red-600";
      default: return "text-gray-600";
    }
  };
  
  const getRiskLevelClass = (risk: string) => {
    switch (risk.toLowerCase()) {
      case 'low': return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      case 'medium': return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
      case 'high': return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  };
  
  if (isLoading) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader>
          <CardTitle><Skeleton className="h-6 w-48" /></CardTitle>
          <CardDescription><Skeleton className="h-4 w-64" /></CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Skeleton className="h-40 w-full" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle>Management & Ownership</CardTitle>
        <CardDescription>Internal factors and ownership structure</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs defaultValue="management">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="management">
              <Shield className="h-4 w-4 mr-2" />
              ESG & Governance
            </TabsTrigger>
            <TabsTrigger value="ownership">
              <PieChart className="h-4 w-4 mr-2" />
              Ownership
            </TabsTrigger>
          </TabsList>
          
          {/* Ownership Tab */}
          <TabsContent value="ownership" className="pt-4 space-y-6">
            {/* Ownership Structure Section */}
            <div>
              <h3 className="text-sm font-semibold mb-3">Who Really Owns {symbol}?</h3>
              
              {majorHolders ? (
                <div className="space-y-6">
                  {/* Modern stacked bar representation for ownership */}
                  <div className="space-y-6">
                    {/* Note about percentages */}
                    {majorHolders.institutionsPercentHeld + majorHolders.insidersPercentHeld > 1.0 && (
                      <div className="rounded-md p-3 bg-blue-50 dark:bg-blue-950/50 text-sm">
                        <p className="text-blue-800 dark:text-blue-300 flex items-start">
                          <Info className="h-4 w-4 mr-2 flex-shrink-0 mt-0.5" />
                          <span>
                            Ownership totals may exceed 100% due to reporting differences 
                            and potential double-counting when institutions own shares controlled by insiders.
                          </span>
                        </p>
                      </div>
                    )}
                  
                    {/* Ownership Bars - new modern design */}
                    <div className="space-y-4">
                      {/* Insiders */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center">
                            <span className="inline-block w-3 h-3 rounded-sm bg-blue-500 mr-2"></span>
                            <span className="font-medium">Insiders</span>
                          </div>
                          <div className="text-sm font-bold">{(majorHolders.insidersPercentHeld * 100).toFixed(1)}%</div>
                        </div>
                        <div className="h-2.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-500 rounded-full" 
                            style={{ width: `${Math.min(majorHolders.insidersPercentHeld * 100, 100)}%` }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Shares held by company executives, board members, and major individual owners
                        </p>
                      </div>
                      
                      {/* Institutions */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center">
                            <span className="inline-block w-3 h-3 rounded-sm bg-green-500 mr-2"></span>
                            <span className="font-medium">Institutions</span>
                          </div>
                          <div className="text-sm font-bold">{(majorHolders.institutionsPercentHeld * 100).toFixed(1)}%</div>
                        </div>
                        <div className="h-2.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-green-500 rounded-full" 
                            style={{ width: `${Math.min(majorHolders.institutionsPercentHeld * 100, 100)}%` }}
                          />
                        </div>
                        <div className="flex justify-between">
                          <p className="text-xs text-muted-foreground">
                            {majorHolders.institutionsCount} institutional investors
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {(majorHolders.institutionsFloatPercentHeld * 100).toFixed(1)}% of float
                          </p>
                        </div>
                      </div>
                      
                      {/* Public */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center">
                            <span className="inline-block w-3 h-3 rounded-sm bg-gray-400 mr-2"></span>
                            <span className="font-medium">Public Float</span>
                          </div>
                          <div className="text-sm font-bold">
                            {(Math.max(0, 100 - (
                              (majorHolders.insidersPercentHeld * 100) + 
                              (majorHolders.institutionsPercentHeld * 100)))).toFixed(1)}%
                          </div>
                        </div>
                        <div className="h-2.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gray-400 rounded-full" 
                            style={{ 
                              width: `${Math.max(0, 100 - (
                                (majorHolders.insidersPercentHeld * 100) + 
                                (majorHolders.institutionsPercentHeld * 100)))}%` 
                            }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Shares available to the general public for trading
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Ownership data not available for {symbol}.
                </p>
              )}
            </div>
            
            {/* Top Institutional Investors */}
            <div className="pt-4 border-t">
              <h3 className="text-sm font-semibold mb-3">Top Institutional Investors</h3>
              
              {institutionalHolders && institutionalHolders.length > 0 ? (
                <div className="space-y-2">
                  {institutionalHolders.slice(0, 5).map((holder, index) => (
                    <Dialog key={index}>
                      <DialogTrigger asChild>
                        <div 
                          className="flex justify-between items-center p-2 rounded hover:bg-muted/50 cursor-pointer"
                          onClick={() => setSelectedInstitution(holder)}
                        >
                          <div className="flex flex-col">
                            <span className="font-medium">{holder.holder}</span>
                            <span className="text-xs text-muted-foreground">
                              {formatLargeNumber(holder.shares)} shares
                            </span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <span className={cn(
                              "text-sm font-medium",
                              getInstitutionChangeColor(holder.percentChange)
                            )}>
                              {(holder.percentHeld * 100).toFixed(2)}%
                            </span>
                            {getInstitutionChangeIcon(holder.percentChange)}
                          </div>
                        </div>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>{holder.holder}</DialogTitle>
                          <DialogDescription>
                            Investment profile and holdings information
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-2">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <div className="text-sm text-muted-foreground">Shares Held</div>
                              <div className="font-medium">{formatLargeNumber(holder.shares)}</div>
                            </div>
                            <div>
                              <div className="text-sm text-muted-foreground">Value ($)</div>
                              <div className="font-medium">${formatLargeNumber(holder.value)}</div>
                            </div>
                            <div>
                              <div className="text-sm text-muted-foreground">% of Shares</div>
                              <div className="font-medium">{(holder.percentHeld * 100).toFixed(2)}%</div>
                            </div>
                            <div>
                              <div className="text-sm text-muted-foreground">% Change</div>
                              <div className={cn("font-medium", getInstitutionChangeColor(holder.percentChange))}>
                                {(holder.percentChange * 100).toFixed(2)}%
                              </div>
                            </div>
                          </div>
                          
                          <div>
                            <div className="text-sm text-muted-foreground mb-1">Date Reported</div>
                            <div className="font-medium">{holder.dateReported}</div>
                          </div>
                          
                          <div className="pt-2 border-t">
                            <div className="text-sm text-muted-foreground mb-1">About</div>
                            <p className="text-sm">{renderHolderDescription(holder)}</p>
                          </div>
                          
                          <div className="pt-2 border-t">
                            <div className="text-sm text-muted-foreground mb-1">Investment Strategy</div>
                            <p className="text-sm">
                              {holder.percentChange > 0.05 ? 
                                "Recently increased stake significantly, indicating bullish outlook." :
                              holder.percentChange < -0.05 ?
                                "Recently decreased stake significantly, potentially rebalancing portfolio or bearish outlook." :
                                "Maintaining relatively stable position, suggesting confidence in current valuation."
                              }
                            </p>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  ))}
                  
                  <div className="text-xs text-muted-foreground mt-1">
                    Click on an institution for more details
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Institutional investor data not available for {symbol}.
                </p>
              )}
            </div>
          </TabsContent>
          
          {/* Management & ESG Tab */}
          <TabsContent value="management" className="pt-4 space-y-6">
            {/* ESG Score Summary */}
            <div>
              <h3 className="text-sm font-semibold mb-3">ESG Performance</h3>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                {/* Overall Score - Larger Card */}
                <div className="p-4 border rounded-lg shadow-sm bg-card hover:shadow-md transition-shadow">
                  <div className="text-sm text-muted-foreground mb-1">Overall</div>
                  <div className={cn("text-4xl font-bold", getScoreColor(esgData.esgScore))}>
                    {esgData.esgScore}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">Score out of 100</div>
                </div>
                
                <div className="grid grid-cols-1 gap-3">
                  {/* Environmental Score - Consistent Styling */}
                  <div className="p-3 border rounded-lg shadow-sm bg-card flex justify-between items-center hover:shadow-md transition-shadow">
                    <div>
                      <div className="text-sm text-muted-foreground">Environmental</div>
                      <div className={cn("text-xl font-bold", getScoreColor(esgData.environmentalScore))}>
                        {esgData.environmentalScore}
                      </div>
                    </div>
                    <div className={cn("w-12 h-12 rounded-full flex items-center justify-center text-white font-bold", 
                      esgData.environmentalScore >= 70 ? "bg-green-500" :
                      esgData.environmentalScore >= 50 ? "bg-yellow-500" : "bg-red-500")}>
                      {esgData.environmentalScore}
                    </div>
                  </div>
                  
                  {/* Social and Governance Scores - matching Environmental style */}
                  <div className="grid grid-cols-2 gap-3">
                    {/* Social score card */}
                    <div className="p-3 border rounded-lg shadow-sm bg-card flex justify-between items-center hover:shadow-md transition-shadow">
                      <div>
                        <div className="text-sm text-muted-foreground">Social</div>
                        <div className={cn("text-xl font-bold", getScoreColor(esgData.socialScore))}>
                          {esgData.socialScore}
                        </div>
                      </div>
                      <div className={cn("w-12 h-12 rounded-full flex items-center justify-center text-white font-bold", 
                        esgData.socialScore >= 70 ? "bg-green-500" :
                        esgData.socialScore >= 50 ? "bg-yellow-500" : "bg-red-500")}>
                        {esgData.socialScore}
                      </div>
                    </div>
                    
                    {/* Governance score card */}
                    <div className="p-3 border rounded-lg shadow-sm bg-card flex justify-between items-center hover:shadow-md transition-shadow">
                      <div>
                        <div className="text-sm text-muted-foreground">Governance</div>
                        <div className={cn("text-xl font-bold", getScoreColor(esgData.governanceScore))}>
                          {esgData.governanceScore}
                        </div>
                      </div>
                      <div className={cn("w-12 h-12 rounded-full flex items-center justify-center text-white font-bold", 
                        esgData.governanceScore >= 70 ? "bg-green-500" :
                        esgData.governanceScore >= 50 ? "bg-yellow-500" : "bg-red-500")}>
                        {esgData.governanceScore}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Governance & Risk Assessment */}
            <div className="pt-4 border-t">
              <h3 className="text-sm font-semibold mb-3">Governance & Risk Assessment</h3>
              
              <div className="grid grid-cols-2 gap-4">
                {/* Management risk card - improved spacing and smaller text */}
                <div className="p-3 border rounded-lg shadow-sm bg-card hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <AlertTriangle className="h-4 w-4 mr-1.5 text-muted-foreground" />
                      <span className="font-medium text-sm">Management</span>
                    </div>
                    <div className={cn("px-1.5 py-0.5 rounded text-xs font-medium", 
                      getRiskLevelClass(esgData.managementRisk))}>
                      {esgData.managementRisk}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground leading-tight">
                    Measures risk associated with management decisions and practices
                  </div>
                </div>
                
                {/* Board risk card - improved spacing and smaller text */}
                <div className="p-3 border rounded-lg shadow-sm bg-card hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-1.5 text-muted-foreground" />
                      <span className="font-medium text-sm">Board</span>
                    </div>
                    <div className={cn("px-1.5 py-0.5 rounded text-xs font-medium", 
                      getRiskLevelClass(esgData.boardRisk))}>
                      {esgData.boardRisk}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground leading-tight">
                    Evaluates board structure, independence, and oversight
                  </div>
                </div>
                
                {/* Audit risk card - improved spacing and smaller text */}
                <div className="p-3 border rounded-lg shadow-sm bg-card hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <ClipboardCheck className="h-4 w-4 mr-1.5 text-muted-foreground" />
                      <span className="font-medium text-sm">Audit</span>
                    </div>
                    <div className={cn("px-1.5 py-0.5 rounded text-xs font-medium", 
                      getRiskLevelClass(esgData.auditRisk))}>
                      {esgData.auditRisk}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground leading-tight">
                    Assesses financial reporting and internal controls
                  </div>
                </div>
                
                {/* Compensation risk card - improved spacing and smaller text */}
                <div className="p-3 border rounded-lg shadow-sm bg-card hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <Building2 className="h-4 w-4 mr-1.5 text-muted-foreground" />
                      <span className="font-medium text-sm">Compensation</span>
                    </div>
                    <div className={cn("px-1.5 py-0.5 rounded text-xs font-medium", 
                      getRiskLevelClass(esgData.compensationRisk))}>
                      {esgData.compensationRisk}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground leading-tight">
                    Reviews executive pay structure and alignment with performance
                  </div>
                </div>
              </div>
              
              <div className="flex items-start mt-3 p-2 bg-amber-50 dark:bg-amber-950 rounded-md">
                <Info className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 mr-2 flex-shrink-0" />
                <p className="text-xs text-amber-800 dark:text-amber-300">
                  Controversy Level: {esgData.controversyLevel}/5 
                  <span className="block mt-1">
                    {esgData.controversyLevel <= 2 ? 
                      "Low controversy level indicates minimal negative environmental or social impacts and good governance practices." :
                      "Moderate to high controversy level may indicate areas for improvement in corporate responsibility."
                    }
                  </span>
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}