import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Separator } from "@/components/ui/separator";
import { ExternalLink, Database, FileJson } from "lucide-react";

// Define interfaces for API responses
interface DataSourceResponse {
  dataSource: string;
  postgresAvailable: boolean;
}

interface ToggleDataSourceResponse {
  success: boolean;
  dataSource: string;
}

const AdminSettingsPage = () => {
  const { toast } = useToast();
  const [usePostgres, setUsePostgres] = useState(true);

  // Fetch current data source
  const { data: dataSourceInfo, isLoading } = useQuery<DataSourceResponse>({
    queryKey: ['/api/system/data-source'],
    refetchOnWindowFocus: false
  });

  // Update state when we get the data
  useEffect(() => {
    if (dataSourceInfo) {
      setUsePostgres(dataSourceInfo.dataSource === 'postgresql');
    }
  }, [dataSourceInfo]);

  // Toggle data source mutation
  const toggleDataSourceMutation = useMutation<ToggleDataSourceResponse, Error, string>({
    mutationFn: async (source: string) => {
      const response = await fetch('/api/system/data-source', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ source }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update data source');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/system/data-source'] });
      const dataSourceName = data.dataSource === 'postgresql' ? 'PostgreSQL' : 'JSON';
      toast({
        title: "Data Source Updated",
        description: `Now using ${dataSourceName} as the data source.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update data source: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    },
  });

  const handleToggleChange = (checked: boolean) => {
    setUsePostgres(checked);
    toggleDataSourceMutation.mutate(checked ? 'postgresql' : 'json');
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Admin Settings</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Data Source Settings
          </CardTitle>
          <CardDescription>
            Control which data source the application uses for stock information.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex flex-col space-y-1">
                <Label htmlFor="postgres-toggle" className="font-medium">Use PostgreSQL Database</Label>
                <p className="text-sm text-muted-foreground">
                  Toggle between PostgreSQL database and JSON files for stock data
                </p>
              </div>
              <Switch 
                id="postgres-toggle" 
                checked={usePostgres}
                onCheckedChange={handleToggleChange}
                disabled={isLoading || toggleDataSourceMutation.isPending}
              />
            </div>
            
            <Separator className="my-4" />
            
            <div className="flex items-center space-x-2">
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  {usePostgres ? (
                    <Database className="h-5 w-5 text-green-500" />
                  ) : (
                    <FileJson className="h-5 w-5 text-amber-500" />
                  )}
                  <span className="font-medium">Current Data Source:</span> 
                </div>
                <p className="text-sm">
                  {isLoading ? "Loading..." : usePostgres ? "PostgreSQL Database" : "JSON Files"}
                </p>
              </div>
              <div className="text-sm text-muted-foreground">
                {dataSourceInfo?.postgresAvailable ? (
                  <span className="text-green-500">PostgreSQL Available</span>
                ) : (
                  <span className="text-red-500">PostgreSQL Unavailable</span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <p className="text-sm text-muted-foreground">
            Changes take effect immediately
          </p>
          <Button variant="outline" size="sm" asChild>
            <a href="/" className="flex items-center gap-1">
              Back to App <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default AdminSettingsPage;