import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Chart } from '@/components/Chart';
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

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3 flex-shrink-0">
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Data Visualizations
          <Badge variant="outline" className="ml-auto">
            {data.length} records
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-0 flex-1 min-h-0 flex flex-col">
        <Tabs defaultValue="single" className="h-full flex flex-col">
          <TabsList className="w-full justify-start px-6 mb-4 flex-shrink-0">
            <TabsTrigger value="single" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Single Variable
            </TabsTrigger>
            <TabsTrigger value="two" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Two Variables
            </TabsTrigger>
            <TabsTrigger value="time" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Time Series
            </TabsTrigger>
            <TabsTrigger value="custom" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Custom
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 min-h-0 overflow-auto px-6 pb-6">
            <TabsContent value="single" className="mt-0 h-full">
              <div className="space-y-4">
                <h4 className="text-sm font-medium">Single Variable Analysis</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {singleVarCharts.map((chart, index) => (
                    <Card key={index} className="border-border/50">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <Select defaultValue={chart.variable}>
                            <SelectTrigger className="w-32 h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {columnsInfo.map(col => (
                                <SelectItem key={col.name} value={col.name}>
                                  {col.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Select defaultValue={chart.chartType}>
                            <SelectTrigger className="w-20 h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="bar">Bar</SelectItem>
                              <SelectItem value="histogram">Histogram</SelectItem>
                              <SelectItem value="pie">Pie</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="h-48">
                          <Chart
                            title={`${chart.chartType === 'histogram' ? 'Distribution' : 'Count'} of ${chart.variable}`}
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

            <TabsContent value="two" className="mt-0 h-full">
              <div className="space-y-4">
                <h4 className="text-sm font-medium">Two Variable Analysis</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {twoVarCharts.map((chart, index) => (
                    <Card key={index} className="border-border/50">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">
                          {chart.var1} vs {chart.var2}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="h-64">
                          <Chart
                            title={`${chart.var1} ${chart.chartType === 'scatter' ? 'vs' : 'by'} ${chart.var2}`}
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

            <TabsContent value="time" className="mt-0 h-full">
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Time series analysis will be available when datetime columns are detected</p>
              </div>
            </TabsContent>

            <TabsContent value="custom" className="mt-0 h-full">
              <div className="text-center py-8 text-muted-foreground">
                <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Custom chart builder coming soon</p>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </CardContent>
    </Card>
  );
}