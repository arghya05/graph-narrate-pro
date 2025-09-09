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
    if (!data || data.length === 0) return;

    const charts: Array<{
      variable: string;
      chartType: string;
      data: any[];
    }> = [];

    // Only include numeric columns for single variable charts
    const numericColumns = columnsInfo.filter(col => col.data_type === 'numeric');
    
    for (let i = 0; i < numericColumns.length; i++) {
      const column = numericColumns[i];
      if (!column) continue;

      // Set default chart type as line for numeric data
      if (!chartTypes[column.name]) {
        setChartTypes(prev => ({
          ...prev,
          [column.name]: 'line'
        }));
      }

      // Create line chart data for numeric columns
      const rawValues = data.map((row, index) => ({
        x: index,
        y: Number(row[column.name]),
        label: `Point ${index + 1}`
      })).filter(point => !isNaN(point.y));

      // Apply smoothing to reduce data points for performance
      const smoothedValues = smoothData(rawValues, 100);

      charts.push({
        variable: column.name,
        chartType: chartTypes[column.name] || 'line',
        data: smoothedValues
      });
    }

    setSingleVarCharts(charts);
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

      // Limit to top 6 categories by data points count
      const sortedCategories = Object.entries(categoryGroups)
        .sort(([,a], [,b]) => b.length - a.length)
        .slice(0, 6);

      // Create multi-line chart data format
      const multiLineData = sortedCategories.map(([category, points]) => ({
        name: category,
        data: smoothData(points, 50), // Smooth each line separately
        color: `hsl(${Math.abs(category.split('').reduce((a, b) => a + b.charCodeAt(0), 0)) % 360}, 70%, 50%)`
      }));

      charts.push({
        var1: selectedVar,
        var2: catCol.name,
        chartType: 'multi-line',
        data: multiLineData
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
    // Regenerate charts with new type
    setTimeout(() => generateSingleVariableCharts(), 0);
  };

  const handleTwoVarChartTypeChange = (var1: string, var2: string, newChartType: string) => {
    const key = `${var1}_${var2}`;
    setChartTypes(prev => ({
      ...prev,
      [key]: newChartType
    }));
    // Regenerate two-variable charts
    if (selectedVariable) {
      const charts = generateTwoVariableCharts(selectedVariable);
      setTwoVarCharts(charts);
    }
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
      <div className={`transition-all duration-300 ${selectedVariable ? 'w-1/4' : 'w-full'}`}>
        
        {/* Variable Charts Grid */}
        <div className="flex-1 p-4">
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Variable Analysis
              </h3>
              <Badge variant="outline" className="text-xs">
                {filteredCharts.length} of {singleVarCharts.length} charts
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Click on any chart to explore relationships with other variables
            </p>
            
            {/* Multi-select filter */}
            {columnsInfo.length > 0 && (
              <Collapsible open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                <CollapsibleTrigger asChild>
                  <Button variant="outline" className="w-full mb-4 justify-between h-auto p-3 bg-card/30 border-border/50 hover:bg-card hover:text-card-foreground">
                    <div className="flex items-center gap-2">
                      <Filter className="h-3 w-3" />
                      <span className="text-xs font-medium">Filter Variables ({selectedVariables.length}/{columnsInfo.length})</span>
                    </div>
                    <ChevronDown className={`h-3 w-3 transition-transform ${isFilterOpen ? 'rotate-180' : ''}`} />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <Card className="p-3 mb-4 bg-card/30 border-border/50">
                    <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                      {columnsInfo.map(column => (
                        <div key={column.name} className="flex items-center space-x-2">
                          <Checkbox
                            id={column.name}
                            checked={selectedVariables.includes(column.name)}
                            onCheckedChange={() => handleVariableToggle(column.name)}
                          />
                          <label
                            htmlFor={column.name}
                            className="text-xs cursor-pointer truncate flex-1"
                            title={column.name}
                          >
                            {column.name}
                          </label>
                          <Badge variant="secondary" className="text-[10px] px-1">
                            {column.data_type}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </Card>
                </CollapsibleContent>
              </Collapsible>
            )}
            
            {columnsInfo.length === 0 && (
              <Card className="p-3 mb-4 bg-muted/20 border-border/50">
                <p className="text-xs text-muted-foreground text-center">
                  Upload data to see variable filters
                </p>
              </Card>
            )}
          </div>
          <ScrollArea className="h-[calc(100vh-280px)]">
            <div className="space-y-4 pb-6">
              {filteredCharts.map((chart, index) => (
                  <Card 
                  key={`${chart.variable}-${index}`}
                  className="border-border/50 bg-card/50 cursor-pointer hover:bg-card/80 transition-all duration-200 hover:shadow-md flex-shrink-0"
                  onClick={() => onChartClick ? onChartClick(chart.variable) : handleVariableClick(chart.variable)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium">
                        {chart.variable}
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
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreVertical className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-36 bg-popover border border-border shadow-lg z-50">
                            <DropdownMenuItem 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleChartTypeChange(chart.variable, 'bar');
                              }}
                              className="flex items-center gap-2 cursor-pointer"
                            >
                              <BarChart className="h-3 w-3" />
                              Bar Chart
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleChartTypeChange(chart.variable, 'line');
                              }}
                              className="flex items-center gap-2 cursor-pointer"
                            >
                              <LineChart className="h-3 w-3" />
                              Line Chart
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleChartTypeChange(chart.variable, 'pie');
                              }}
                              className="flex items-center gap-2 cursor-pointer"
                            >
                              <PieChart className="h-3 w-3" />
                              Pie Chart
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 pb-4">
                     <div className="h-64 w-full">
                       <D3Chart
                         key={`${chart.variable}-${chart.chartType}-${chart.data.length}`}
                         data={chart.data}
                         chartType={chart.chartType as any}
                         xKey={chart.chartType === 'histogram' ? 'range' : 'name'}
                         yKey={chart.chartType === 'histogram' ? 'count' : 'count'}
                         width={500}
                         height={250}
                         title={chart.variable}
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
        <div className="w-3/4 border-l border-border/50 bg-card/30 transition-all duration-300">
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
                                 onClick={() => handleTwoVarChartTypeChange(chart.var1, chart.var2, 'bar')}
                                 className="flex items-center gap-2 cursor-pointer"
                               >
                                 <BarChart className="h-3 w-3" />
                                 Bar Chart
                               </DropdownMenuItem>
                               <DropdownMenuItem 
                                 onClick={() => handleTwoVarChartTypeChange(chart.var1, chart.var2, 'line')}
                                 className="flex items-center gap-2 cursor-pointer"
                               >
                                 <LineChart className="h-3 w-3" />
                                 Line Chart
                               </DropdownMenuItem>
                               {chart.chartType === 'scatter' && (
                                 <DropdownMenuItem 
                                   onClick={() => handleTwoVarChartTypeChange(chart.var1, chart.var2, 'scatter')}
                                   className="flex items-center gap-2 cursor-pointer"
                                 >
                                   <TrendingUp className="h-3 w-3" />
                                   Scatter Plot
                                 </DropdownMenuItem>
                               )}
                             </DropdownMenuContent>
                           </DropdownMenu>
                         </div>
                       </div>
                    </CardHeader>
                     <CardContent className="pt-0">
                      <div className="h-80">
                          <D3Chart
                            key={`${chart.var1}-${chart.var2}-${chart.chartType}-${chart.data.length}`}
                            data={chart.data}
                            chartType={chart.chartType as any}
                            xKey={chart.chartType === 'multi-line' ? 'x' : (chart.chartType === 'scatter' ? 'x' : 'category')}
                            yKey={chart.chartType === 'multi-line' ? 'y' : (chart.chartType === 'scatter' ? 'y' : 'average')}
                            width={600}
                            height={300}
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