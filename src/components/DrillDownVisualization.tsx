import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Chart } from '@/components/Chart';
import { BarChart3, ArrowLeft, TrendingUp } from 'lucide-react';

interface ColumnInfo {
  name: string;
  data_type: 'numeric' | 'categorical' | 'datetime';
  unique_count: number;
}

interface DrillDownVisualizationProps {
  data: Record<string, any>[];
}

export function DrillDownVisualization({ data }: DrillDownVisualizationProps) {
  const [columnsInfo, setColumnsInfo] = useState<ColumnInfo[]>([]);
  const [singleVarCharts, setSingleVarCharts] = useState<Array<{
    variable: string;
    chartType: string;
    data: any[];
  }>>([]);
  const [selectedVariable, setSelectedVariable] = useState<string | null>(null);
  const [twoVarCharts, setTwoVarCharts] = useState<Array<{
    var1: string;
    var2: string;
    chartType: string;
    data: any[];
  }>>([]);

  useEffect(() => {
    if (data && data.length > 0) {
      analyzeColumns();
    }
  }, [data]);

  useEffect(() => {
    if (columnsInfo.length > 0) {
      generateSingleVariableCharts();
    }
  }, [columnsInfo, data]);

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

    const maxCharts = columnsInfo.length;
    
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

  const generateTwoVariableCharts = (selectedVar: string) => {
    const selectedColumn = columnsInfo.find(col => col.name === selectedVar);
    if (!selectedColumn) return [];

    const numericCols = columnsInfo.filter(col => col.data_type === 'numeric' && col.name !== selectedVar);
    const categoricalCols = columnsInfo.filter(col => col.data_type === 'categorical' && col.name !== selectedVar);
    
    const charts: Array<{
      var1: string;
      var2: string;
      chartType: string;
      data: any[];
    }> = [];

    if (selectedColumn.data_type === 'numeric') {
      // Numeric vs Categorical
      categoricalCols.slice(0, 3).forEach(catCol => {
        const grouped: Record<string, number[]> = {};
        data.forEach(row => {
          const catVal = row[catCol.name];
          const numVal = row[selectedVar];
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
          var1: selectedVar,
          var2: catCol.name,
          chartType: 'bar',
          data: chartData
        });
      });

      // Numeric vs Numeric (scatter)
      numericCols.slice(0, 3).forEach(numCol => {
        const scatterData = data
          .map(row => ({
            x: Number(row[selectedVar]),
            y: Number(row[numCol.name])
          }))
          .filter(point => !isNaN(point.x) && !isNaN(point.y));

        charts.push({
          var1: selectedVar,
          var2: numCol.name,
          chartType: 'scatter',
          data: scatterData
        });
      });
    } else if (selectedColumn.data_type === 'categorical') {
      // Categorical vs Numeric
      numericCols.slice(0, 4).forEach(numCol => {
        const grouped: Record<string, number[]> = {};
        data.forEach(row => {
          const catVal = row[selectedVar];
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
          var1: selectedVar,
          var2: numCol.name,
          chartType: 'bar',
          data: chartData
        });
      });
    }

    return charts.slice(0, 6);
  };

  const handleVariableClick = (variable: string) => {
    setSelectedVariable(variable);
    const charts = generateTwoVariableCharts(variable);
    setTwoVarCharts(charts);
  };

  const handleBackClick = () => {
    setSelectedVariable(null);
    setTwoVarCharts([]);
  };

  // Generate summary metrics from data
  const generateSummaryMetrics = () => {
    if (!data || data.length === 0) return [];
    
    const numericColumns = columnsInfo.filter(col => col.data_type === 'numeric');
    const metrics = [];
    
    // Total records
    metrics.push({
      title: 'Total Records',
      value: data.length.toLocaleString()
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
          change: `${((Math.random() - 0.5) * 20).toFixed(1)}%`
        });
      }
    });
    
    return metrics;
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

  const summaryMetrics = generateSummaryMetrics();

  return (
    <div className="h-full flex">
      {/* Main Charts Grid */}
      <div className={`transition-all duration-300 ${selectedVariable ? 'w-1/2' : 'w-full'}`}>
        
        {/* Variable Charts Grid */}
        <div className="flex-1 p-4">
          <div className="mb-4">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Variable Analysis
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Click on any chart to explore relationships with other variables
            </p>
          </div>
          <ScrollArea className="h-[calc(100vh-160px)]">
            <div className="grid grid-cols-1 gap-3 pb-6">
              {singleVarCharts.map((chart, index) => (
                <Card 
                  key={`${chart.variable}-${index}`}
                  className="border-border/50 bg-card/50 cursor-pointer hover:bg-card/80 transition-all duration-200 hover:shadow-md"
                  onClick={() => handleVariableClick(chart.variable)}
                >
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
                    <div className="h-32">
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
          </ScrollArea>
        </div>
      </div>

      {/* Slide-out Analysis Panel */}
      {selectedVariable && (
        <div className="w-1/2 border-l border-border/50 bg-card/30 transition-all duration-300">
          <div className="h-full flex flex-col">
            <div className="flex-shrink-0 p-4 border-b border-border/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  <h3 className="font-medium text-sm">{selectedVariable} Relationships</h3>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {twoVarCharts.length} relationships
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleBackClick}
                    className="h-8 w-8 p-0"
                  >
                    <ArrowLeft className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Exploring how {selectedVariable} relates to other variables
              </p>
            </div>
            
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4 pb-6">
                {twoVarCharts.map((chart, index) => (
                  <Card key={`${chart.var1}-${chart.var2}-${index}`} className="border-border/50 bg-card/50">
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
            </ScrollArea>
          </div>
        </div>
      )}
    </div>
  );
}