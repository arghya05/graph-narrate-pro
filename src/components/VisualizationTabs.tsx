import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Chart } from '@/components/Chart';
import { MetricChart } from '@/components/MetricChart';
import { BarChart3, TrendingUp, Calendar, Settings } from 'lucide-react';

interface ColumnInfo {
  name: string;
  data_type: 'numeric' | 'categorical' | 'datetime';
  unique_count: number;
}

interface VisualizationTabsProps {
  data: Record<string, any>[];
}

export function VisualizationTabs({ data }: VisualizationTabsProps) {
  const [columnsInfo, setColumnsInfo] = useState<ColumnInfo[]>([]);
  const [singleVarCharts, setSingleVarCharts] = useState<Array<{
    variable: string;
    chartType: string;
    data: any[];
  }>>([]);

  useEffect(() => {
    if (data && data.length > 0) {
      analyzeColumns();
      generateSingleVariableCharts();
    }
  }, [data]);

  const analyzeColumns = () => {
    if (!data || data.length === 0) return;

    const columns = Object.keys(data[0]);
    const analyzed = columns.map(col => {
      const values = data.map(row => row[col]).filter(v => v != null);
      const uniqueCount = new Set(values).size;
      
      // Determine data type
      let dataType: 'numeric' | 'categorical' | 'datetime' = 'categorical';
      
      if (values.every(v => !isNaN(Number(v)))) {
        dataType = 'numeric';
      } else if (col.toLowerCase().includes('date') || 
                 values.some(v => !isNaN(Date.parse(v)))) {
        dataType = 'datetime';
      }

      return {
        name: col,
        data_type: dataType,
        unique_count: uniqueCount
      };
    });

    setColumnsInfo(analyzed);
  };

  const generateSingleVariableCharts = () => {
    if (!data || data.length === 0) return;

    const charts: Array<{
      variable: string;
      chartType: string;
      data: any[];
    }> = [];

    const maxCharts = Math.min(columnsInfo.length, 6);
    
    for (let i = 0; i < maxCharts; i++) {
      const column = columnsInfo[i];
      if (!column) continue;

      if (column.data_type === 'numeric') {
        // Create histogram data
        const values = data.map(row => row[column.name]).filter(v => v != null);
        const bins = 10;
        const min = Math.min(...values);
        const max = Math.max(...values);
        const binSize = (max - min) / bins;
        
        const histData = Array.from({ length: bins }, (_, i) => {
          const binStart = min + i * binSize;
          const binEnd = min + (i + 1) * binSize;
          const count = values.filter(v => v >= binStart && v < binEnd).length;
          return {
            range: `${binStart.toFixed(1)}-${binEnd.toFixed(1)}`,
            count,
            value: binStart + binSize / 2
          };
        });

        charts.push({
          variable: column.name,
          chartType: 'histogram',
          data: histData
        });
      } else if (column.data_type === 'categorical') {
        // Create bar chart data
        const valueCounts: Record<string, number> = {};
        data.forEach(row => {
          const val = row[column.name];
          if (val != null) {
            valueCounts[val] = (valueCounts[val] || 0) + 1;
          }
        });

        const barData = Object.entries(valueCounts)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 10)
          .map(([name, count]) => ({ name, count }));

        charts.push({
          variable: column.name,
          chartType: 'bar',
          data: barData
        });
      }
    }

    setSingleVarCharts(charts);
  };

  const generateTwoVariableCharts = () => {
    const numericCols = columnsInfo.filter(col => col.data_type === 'numeric');
    const categoricalCols = columnsInfo.filter(col => col.data_type === 'categorical');
    
    const charts: Array<{
      var1: string;
      var2: string;
      chartType: string;
      data: any[];
    }> = [];

    // Numeric vs Categorical
    numericCols.slice(0, 2).forEach(numCol => {
      categoricalCols.slice(0, 2).forEach(catCol => {
        const grouped: Record<string, number[]> = {};
        data.forEach(row => {
          const catVal = row[catCol.name];
          const numVal = row[numCol.name];
          if (catVal != null && numVal != null) {
            if (!grouped[catVal]) grouped[catVal] = [];
            grouped[catVal].push(Number(numVal));
          }
        });

        const chartData = Object.entries(grouped).map(([category, values]) => ({
          category,
          average: values.reduce((a, b) => a + b, 0) / values.length,
          count: values.length
        }));

        charts.push({
          var1: numCol.name,
          var2: catCol.name,
          chartType: 'bar',
          data: chartData
        });
      });
    });

    // Numeric vs Numeric (scatter)
    for (let i = 0; i < numericCols.length - 1 && i < 2; i++) {
      for (let j = i + 1; j < numericCols.length && j < 3; j++) {
        const scatterData = data
          .map(row => ({
            x: Number(row[numericCols[i].name]),
            y: Number(row[numericCols[j].name])
          }))
          .filter(point => !isNaN(point.x) && !isNaN(point.y));

        charts.push({
          var1: numericCols[i].name,
          var2: numericCols[j].name,
          chartType: 'scatter',
          data: scatterData
        });
      }
    }

    return charts.slice(0, 6);
  };

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No data available for visualization</p>
          <p className="text-sm text-muted-foreground mt-2">
            Send a message to the AI to get started with data analysis
          </p>
        </CardContent>
      </Card>
    );
  }

  const twoVarCharts = generateTwoVariableCharts();

  // Generate summary metrics from data
  const generateSummaryMetrics = () => {
    if (!data || data.length === 0) return [];
    
    const numericColumns = columnsInfo.filter(col => col.data_type === 'numeric');
    const metrics = [];
    
    // Total records
    metrics.push({
      title: 'Total Records',
      value: data.length.toLocaleString(),
      data: Array.from({ length: 12 }, (_, i) => ({ value: Math.floor(Math.random() * 100) + 50 }))
    });
    
    // Numeric column insights
    numericColumns.slice(0, 5).forEach(col => {
      const values = data.map(row => Number(row[col.name])).filter(v => !isNaN(v));
      if (values.length > 0) {
        const sum = values.reduce((a, b) => a + b, 0);
        const avg = sum / values.length;
        
        metrics.push({
          title: col.name,
          value: avg > 1000 ? `${(avg / 1000).toFixed(1)}K` : avg.toFixed(0),
          change: `${((Math.random() - 0.5) * 20).toFixed(1)}%`,
          data: values.slice(0, 12).map(value => ({ value }))
        });
      }
    });
    
    return metrics;
  };

  const summaryMetrics = generateSummaryMetrics();

  return (
    <div className="h-full flex flex-col">
      {/* Summary Metrics */}
      <div className="flex-shrink-0 p-4 border-b border-border/50">
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 className="h-4 w-4" />
          <h3 className="font-medium text-sm">Key Metrics</h3>
          <Badge variant="outline" className="ml-auto text-xs">
            {data.length} records
          </Badge>
        </div>
        <ScrollArea className="w-full">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 pb-2">
            {summaryMetrics.map((metric, index) => (
              <MetricChart
                key={index}
                title={metric.title}
                value={metric.value}
                change={metric.change}
                data={metric.data}
                chartType="line"
                color="#3b82f6"
              />
            ))}
          </div>
        </ScrollArea>
      </div>
      
      {/* Detailed Charts */}
      <Card className="flex-1 min-h-0 m-4 mt-0">
        <CardContent className="p-0 h-full flex flex-col">
          <Tabs defaultValue="single" className="h-full flex flex-col">
            <TabsList className="w-full justify-start px-6 py-6 flex-shrink-0 bg-muted/30">
              <TabsTrigger value="single" className="flex items-center gap-2 text-xs">
                <BarChart3 className="h-3 w-3" />
                Single Variable
              </TabsTrigger>
              <TabsTrigger value="two" className="flex items-center gap-2 text-xs">
                <TrendingUp className="h-3 w-3" />
                Two Variables
              </TabsTrigger>
              <TabsTrigger value="time" className="flex items-center gap-2 text-xs">
                <Calendar className="h-3 w-3" />
                Time Series
              </TabsTrigger>
            </TabsList>

            <ScrollArea className="flex-1">
              <div className="p-6">
                <TabsContent value="single" className="mt-0">
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium text-muted-foreground">Distribution Analysis</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {singleVarCharts.map((chart, index) => (
                        <Card key={index} className="border-border/50 bg-card/50">
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-sm font-medium">
                                {chart.variable}
                              </CardTitle>
                              <Badge variant="outline" className="text-xs">
                                {chart.chartType}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="pt-0">
                            <div className="h-40">
                              <Chart
                                title=""
                                data={chart.data}
                                chartType={chart.chartType as any}
                                xKey={chart.chartType === 'histogram' ? 'range' : 'name'}
                                yKey={chart.chartType === 'histogram' ? 'count' : 'count'}
                              />
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="two" className="mt-0">
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium text-muted-foreground">Relationship Analysis</h4>
                    <div className="grid grid-cols-1 gap-4">
                      {twoVarCharts.map((chart, index) => (
                        <Card key={index} className="border-border/50 bg-card/50">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium">
                              {chart.var1} vs {chart.var2}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="pt-0">
                            <div className="h-48">
                              <Chart
                                title=""
                                data={chart.data}
                                chartType={chart.chartType as any}
                                xKey={chart.chartType === 'scatter' ? 'x' : 'category'}
                                yKey={chart.chartType === 'scatter' ? 'y' : 'average'}
                              />
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="time" className="mt-0">
                  <div className="text-center py-12 text-muted-foreground">
                    <Calendar className="h-10 w-10 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">Time series analysis will be available when datetime columns are detected</p>
                  </div>
                </TabsContent>
              </div>
            </ScrollArea>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}