import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ChartType } from '@/lib/api';
import { MoreHorizontal, Maximize2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { D3Chart } from './D3Chart';

interface ChartProps {
  title: string;
  data: any[];
  chartType: ChartType;
  onChartTypeChange?: (type: ChartType) => void;
  onClick?: () => void;
  availableTypes?: ChartType[];
  xKey?: string;
  yKey?: string;
  description?: string;
}


export function Chart({ 
  title, 
  data, 
  chartType, 
  onChartTypeChange, 
  onClick, 
  availableTypes = ['bar', 'line', 'area', 'pie'],
  xKey = 'name',
  yKey = 'value',
  description
}: ChartProps) {
  const [selectedType, setSelectedType] = useState<ChartType>(chartType);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleTypeChange = (type: ChartType) => {
    setSelectedType(type);
    onChartTypeChange?.(type);
  };

  const renderChart = (height = 300) => {
    if (!data || data.length === 0) {
      return (
        <div className="h-64 flex items-center justify-center text-muted-foreground">
          No data available
        </div>
      );
    }

    return (
      <D3Chart
        data={data}
        chartType={selectedType}
        xKey={xKey}
        yKey={yKey}
        width={500}
        height={height}
        title=""
      />
    );
  };

  return (
    <Card 
      className={`transition-all duration-300 hover:shadow-elegant ${
        onClick ? 'cursor-pointer hover:scale-[1.02]' : ''
      }`}
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">{title}</CardTitle>
            {description && (
              <p className="text-sm text-muted-foreground mt-1">{description}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {onChartTypeChange && (
              <Select value={selectedType} onValueChange={handleTypeChange}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" onClick={(e) => e.stopPropagation()}>
                  <Maximize2 className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-6xl h-[80vh]">
                <DialogHeader>
                  <DialogTitle>{title} - Fullscreen View</DialogTitle>
                </DialogHeader>
                <div className="flex-1 overflow-hidden">
                  {renderChart(500)}
                </div>
              </DialogContent>
            </Dialog>
            {onClick && (
              <Button variant="ghost" size="sm" onClick={onClick}>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        <div className="flex gap-2 mt-2">
          <Badge variant="secondary">{data.length} data points</Badge>
          <Badge variant="outline">{selectedType}</Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        {renderChart()}
      </CardContent>
    </Card>
  );
}