import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { D3Chart } from '@/components/D3Chart';
import { BarChart3, ArrowLeft, TrendingUp, Filter, ChevronDown, MoreVertical, BarChart, LineChart, PieChart } from 'lucide-react';

interface ColumnInfo {
  name: string;
  data_type: 'numeric' | 'categorical' | 'datetime';
  unique_count: number;
}

interface DrillDownVisualizationProps {
  data: Record<string, any>[];
  onChartClick?: (chartTitle: string) => void;
}

export function DrillDownVisualization({ data, onChartClick }: DrillDownVisualizationProps) {
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
  const [selectedVariables, setSelectedVariables] = useState<string[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [chartTypes, setChartTypes] = useState<Record<string, string>>({});

  useEffect(() => {
    if (data && data.length > 0) {
      analyzeColumns();
    }
  }, [data]);

  useEffect(() => {
    if (columnsInfo.length > 0) {
      generateSingleVariableCharts();
      // Initialize with all variables selected
      setSelectedVariables(columnsInfo.map(col => col.name));
    }
  }, [columnsInfo, data, chartTypes]);

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

  // Helper function to smooth data by sampling points
  const smoothData = (data: any[], maxPoints: number = 100) => {
    if (data.length <= maxPoints) return data;
    
    const step = Math.floor(data.length / maxPoints);
    const smoothed = [];
    
    for (let i = 0; i < data.length; i += step) {
      if (smoothed.length >= maxPoints) break;
      smoothed.push(data[i]);
    }
    
    return smoothed;
  };

  const generateSingleVariableCharts = () => {
    // Skip single variable charts - user doesn't need distribution
    setSingleVarCharts([]);
  };

  const generateTwoVariableCharts = (selectedVar: string) => {
    const selectedColumn = columnsInfo.find(col => col.name === selectedVar);
    if (!selectedColumn || selectedColumn.data_type !== 'numeric') return [];

    // Only show categorical columns for numeric vs categorical relationships
    const categoricalCols = columnsInfo.filter(col => col.data_type === 'categorical');
    
    const charts: Array<{
      var1: string;
      var2: string;
      chartType: string;
      data: any[];
    }> = [];

    // Generate multi-line charts for each categorical column
    categoricalCols.forEach(catCol => {
      const key = `${selectedVar}_${catCol.name}`;
      const currentChartType = chartTypes[key] || 'line';
      
      // Group data by category and create time series
      const categoryGroups: Record<string, Array<{x: number, y: number}>> = {};
      
      data.forEach((row, index) => {
        const catVal = row[catCol.name];
        const numVal = row[selectedVar];
        if (catVal != null && numVal != null) {
          if (!categoryGroups[catVal]) categoryGroups[catVal] = [];
          categoryGroups[catVal].push({
            x: index,
            y: Number(numVal)
          });
        }
      });

      // Limit to top 8 categories by data points count (5-10 range)
      const sortedCategories = Object.entries(categoryGroups)
        .sort(([,a], [,b]) => b.length - a.length)
        .slice(0, 8);

      let chartData;
      
      // Always create multi-line chart data format with distinct colors
      const colorPalette = [
        'hsl(220, 70%, 50%)', // Blue
        'hsl(0, 70%, 50%)',   // Red
        'hsl(120, 70%, 40%)', // Green
        'hsl(280, 70%, 50%)', // Purple
        'hsl(35, 70%, 50%)',  // Orange
        'hsl(180, 70%, 45%)', // Cyan
        'hsl(60, 70%, 45%)',  // Yellow
        'hsl(320, 70%, 50%)', // Magenta
      ];
      
      // Ensure data has proper structure for multi-line chart
      chartData = sortedCategories.map(([category, points], index) => ({
        name: category,
        data: smoothData(points, 50).map(point => ({
          x: point.x,
          y: point.y
        })),
        color: colorPalette[index % colorPalette.length]
      }));

      charts.push({
        var1: selectedVar,
        var2: catCol.name,
        chartType: 'line', // Always use line for multi-line charts
        data: chartData
      });
    });

    return charts;
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

  const handleVariableToggle = (variableName: string) => {
    setSelectedVariables(prev => 
      prev.includes(variableName) 
        ? prev.filter(v => v !== variableName)
        : [...prev, variableName]
    );
  };

  const filteredCharts = singleVarCharts.filter(chart => 
    selectedVariables.includes(chart.variable)
  );

  const handleChartTypeChange = (variable: string, newChartType: string) => {
    setChartTypes(prev => ({
      ...prev,
      [variable]: newChartType
    }));
    // Force regeneration
    generateSingleVariableCharts();
  };

  const handleTwoVarChartTypeChange = (var1: string, var2: string, newChartType: string) => {
    // Not needed anymore since we only use line charts for two-variable analysis
    console.log('Two-variable charts are now fixed to line chart type');
  };

  const getChartIcon = (chartType: string) => {
    switch (chartType) {
      case 'bar':
      case 'histogram':
        return BarChart;
      case 'line':
        return LineChart;
      case 'pie':
        return PieChart;
      default:
        return BarChart;
    }
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
      <div className={`transition-all duration-300 ${selectedVariable ? 'w-1/3' : 'w-full'} min-h-0`}>
        
        {/* Show message to select variables for analysis */}
        <div className="flex-1 p-4">
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Variable Selection
              </h3>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Select a numeric variable below to explore its relationships with categorical variables
            </p>
            
            {/* Variable Selection Grid */}
            <div className="grid grid-cols-2 gap-3">
              {columnsInfo.filter(col => col.data_type === 'numeric').map((column) => (
                <Card 
                  key={column.name}
                  className="border border-border/30 bg-background/80 backdrop-blur-sm cursor-pointer hover:bg-background/90 transition-all duration-200 hover:shadow-lg hover:scale-[1.02] p-4"
                  onClick={() => handleVariableClick(column.name)}
                >
                  <div className="text-center">
                    <h4 className="font-medium text-sm mb-1">{column.name}</h4>
                    <Badge variant="secondary" className="text-xs">
                      {column.data_type}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-2">
                      {column.unique_count} unique values
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Slide-out Analysis Panel */}
      {selectedVariable && (
        <div className="w-2/3 border-l border-border/50 bg-card/30 transition-all duration-300">
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
                   <Card key={`${chart.var1}-${chart.var2}-${index}`} className="border border-border/30 bg-background/80 backdrop-blur-sm hover:shadow-lg transition-all duration-200">
                     <CardHeader className="pb-2">
                       <div className="flex items-center justify-between">
                         <CardTitle className="text-sm font-medium">
                           {chart.var1} vs {chart.var2}
                         </CardTitle>
                         <div className="flex items-center gap-2">
                           <Badge variant="outline" className="text-xs">
                             {chart.chartType}
                           </Badge>
                           <DropdownMenu>
                             <DropdownMenuTrigger asChild>
                               <Button 
                                 variant="ghost" 
                                 size="sm" 
                                 className="h-6 w-6 p-0"
                               >
                                 <MoreVertical className="h-3 w-3" />
                               </Button>
                             </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-36 bg-popover border border-border shadow-lg z-50">
                                <DropdownMenuItem 
                                  onClick={() => handleTwoVarChartTypeChange(chart.var1, chart.var2, 'line')}
                                  className="flex items-center gap-2 cursor-pointer"
                                >
                                  <LineChart className="h-3 w-3" />
                                  Line Chart
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                           </DropdownMenu>
                         </div>
                       </div>
                    </CardHeader>
                      <CardContent className="pt-0">
                       <div className="h-96 w-full overflow-hidden">
                            <D3Chart
                              key={`${chart.var1}-${chart.var2}-multi-line-${Date.now()}`}
                              data={chart.data}
                              chartType="multi-line"
                              xKey="x"
                              yKey="y"
                              width={1000}
                              height={350}
                              title={`${chart.var1} vs ${chart.var2}`}
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