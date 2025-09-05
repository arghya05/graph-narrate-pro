import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Chart } from './Chart';
import { MetricCard } from './MetricCard';
import { apiClient, api, ChartType, TwoLevelAnalysisResponse } from '@/lib/api';
import { Loader2, TrendingUp, BarChart3, PieChart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DetailedAnalysisProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: Record<string, any>[];
  title: string;
}

export function DetailedAnalysis({ open, onOpenChange, data, title }: DetailedAnalysisProps) {
  const [loading, setLoading] = useState(false);
  const [analysisData, setAnalysisData] = useState<TwoLevelAnalysisResponse | null>(null);
  const [selectedVar1, setSelectedVar1] = useState<string>('');
  const [selectedVar2, setSelectedVar2] = useState<string>('');
  const [availableColumns, setAvailableColumns] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (data && data.length > 0) {
      const columns = Object.keys(data[0]);
      setAvailableColumns(columns);
      if (columns.length >= 2) {
        setSelectedVar1(columns[0]);
        setSelectedVar2(columns[1]);
      }
    }
  }, [data]);

  const performAnalysis = async () => {
    if (!selectedVar1 || !selectedVar2) return;

    setLoading(true);
    try {
      const response: TwoLevelAnalysisResponse = await apiClient.post(
        api.endpoints.twoLevelAnalysis,
        {
          var1: selectedVar1,
          var2: selectedVar2
        }
      );
      setAnalysisData(response);
    } catch (error) {
      console.error('Analysis error:', error);
      toast({
        title: "Analysis failed",
        description: "Unable to perform detailed analysis. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedVar1 && selectedVar2 && data.length > 0) {
      performAnalysis();
    }
  }, [selectedVar1, selectedVar2]);

  const getMetrics = () => {
    if (!analysisData || !data) return [];

    const totalRecords = data.length;
    const uniqueVar1 = new Set(data.map(row => row[selectedVar1])).size;
    const uniqueVar2 = new Set(data.map(row => row[selectedVar2])).size;

    return [
      {
        title: 'Total Records',
        value: totalRecords.toLocaleString(),
        icon: <BarChart3 className="h-6 w-6" />
      },
      {
        title: `Unique ${selectedVar1}`,
        value: uniqueVar1.toLocaleString(),
        icon: <PieChart className="h-6 w-6" />
      },
      {
        title: `Unique ${selectedVar2}`,
        value: uniqueVar2.toLocaleString(),
        icon: <TrendingUp className="h-6 w-6" />
      }
    ];
  };

  const getLevel1Data = () => {
    if (!data || !selectedVar1) return [];
    
    const grouped = data.reduce((acc, row) => {
      const key = row[selectedVar1];
      if (!acc[key]) acc[key] = 0;
      acc[key]++;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(grouped).map(([name, value]) => ({ name, value }));
  };

  const getLevel2Data = () => {
    if (!data || !selectedVar1 || !selectedVar2) return [];
    
    const grouped = data.reduce((acc, row) => {
      const key = `${row[selectedVar1]} - ${row[selectedVar2]}`;
      if (!acc[key]) acc[key] = 0;
      acc[key]++;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(grouped)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 20); // Top 20 combinations
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Detailed Analysis: {title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Variable Selection */}
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Primary Variable</label>
              <Select value={selectedVar1} onValueChange={setSelectedVar1}>
                <SelectTrigger>
                  <SelectValue placeholder="Select primary variable" />
                </SelectTrigger>
                <SelectContent>
                  {availableColumns.map((col) => (
                    <SelectItem key={col} value={col}>{col}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Secondary Variable</label>
              <Select value={selectedVar2} onValueChange={setSelectedVar2}>
                <SelectTrigger>
                  <SelectValue placeholder="Select secondary variable" />
                </SelectTrigger>
                <SelectContent>
                  {availableColumns.map((col) => (
                    <SelectItem key={col} value={col}>{col}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button 
              onClick={performAnalysis} 
              disabled={loading || !selectedVar1 || !selectedVar2}
              className="mt-6"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                'Analyze'
              )}
            </Button>
          </div>

          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Performing detailed analysis...</span>
            </div>
          )}

          {analysisData && !loading && (
            <>
              {/* Metrics Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {getMetrics().map((metric, index) => (
                  <MetricCard
                    key={index}
                    title={metric.title}
                    value={metric.value}
                    icon={metric.icon}
                  />
                ))}
              </div>

              {/* Analysis Details */}
              <div className="flex gap-2 mb-4">
                <Badge variant="secondary">Analysis Type: {analysisData.analysis_type}</Badge>
                <Badge variant="outline">Variables: {selectedVar1} × {selectedVar2}</Badge>
              </div>

              {/* Two-Level Charts */}
              <Tabs defaultValue="level1" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="level1">Level 1: {selectedVar1}</TabsTrigger>
                  <TabsTrigger value="level2">Level 2: Combined Analysis</TabsTrigger>
                </TabsList>
                
                <TabsContent value="level1" className="space-y-4">
                  <Chart
                    title={`Distribution by ${selectedVar1}`}
                    data={getLevel1Data()}
                    chartType="bar"
                    onChartTypeChange={() => {}}
                    availableTypes={['bar', 'pie', 'line']}
                    description={`Analysis of ${selectedVar1} distribution`}
                  />
                </TabsContent>
                
                <TabsContent value="level2" className="space-y-4">
                  <Chart
                    title={`Combined Analysis: ${selectedVar1} × ${selectedVar2}`}
                    data={getLevel2Data()}
                    chartType="bar"
                    onChartTypeChange={() => {}}
                    availableTypes={['bar', 'area', 'line']}
                    description={`Top combinations of ${selectedVar1} and ${selectedVar2}`}
                  />
                </TabsContent>
              </Tabs>

              {/* Raw Data Preview */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-3">Data Preview</h3>
                <div className="border rounded-lg overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-secondary">
                      <tr>
                        {availableColumns.slice(0, 5).map((col) => (
                          <th key={col} className="p-3 text-left font-medium">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data.slice(0, 10).map((row, index) => (
                        <tr key={index} className="border-t">
                          {availableColumns.slice(0, 5).map((col) => (
                            <td key={col} className="p-3">
                              {String(row[col] || '')}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Showing first 10 rows of {data.length} total records
                </p>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}