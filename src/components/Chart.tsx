import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Area, 
  AreaChart 
} from 'recharts';
import { ChartType } from '@/lib/api';
import { MoreHorizontal, Maximize2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

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

const COLORS = [
  'hsl(262, 83%, 58%)',
  'hsl(262, 83%, 70%)',
  'hsl(220, 14.3%, 95.9%)',
  'hsl(220, 8.9%, 46.1%)',
  'hsl(0, 84.2%, 60.2%)',
];

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

    switch (selectedType) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
              <XAxis dataKey={xKey} stroke="hsl(220, 8.9%, 46.1%)" interval="preserveStartEnd" tick={{ fontSize: 10 }} />
              <YAxis stroke="hsl(220, 8.9%, 46.1%)" tick={{ fontSize: 10 }} />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(0, 0%, 100%)',
                  border: '1px solid hsl(220, 13%, 91%)',
                  borderRadius: '0.75rem'
                }}
              />
              <Bar dataKey={yKey} fill="hsl(262, 83%, 58%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'line':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
              <XAxis dataKey={xKey} stroke="hsl(220, 8.9%, 46.1%)" interval="preserveStartEnd" tick={{ fontSize: 10 }} />
              <YAxis stroke="hsl(220, 8.9%, 46.1%)" tick={{ fontSize: 10 }} />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(0, 0%, 100%)',
                  border: '1px solid hsl(220, 13%, 91%)',
                  borderRadius: '0.75rem'
                }}
              />
              <Line 
                type="monotone" 
                dataKey={yKey} 
                stroke="hsl(262, 83%, 58%)" 
                strokeWidth={3}
                dot={{ fill: 'hsl(262, 83%, 58%)', strokeWidth: 2, r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'area':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
              <XAxis dataKey={xKey} stroke="hsl(220, 8.9%, 46.1%)" interval="preserveStartEnd" tick={{ fontSize: 10 }} />
              <YAxis stroke="hsl(220, 8.9%, 46.1%)" tick={{ fontSize: 10 }} />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(0, 0%, 100%)',
                  border: '1px solid hsl(220, 13%, 91%)',
                  borderRadius: '0.75rem'
                }}
              />
              <Area 
                type="monotone" 
                dataKey={yKey} 
                stroke="hsl(262, 83%, 58%)" 
                fill="hsl(262, 83%, 58%)"
                fillOpacity={0.2}
              />
            </AreaChart>
          </ResponsiveContainer>
        );

      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                outerRadius={100}
                fill="hsl(262, 83%, 58%)"
                dataKey={yKey}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(0, 0%, 100%)',
                  border: '1px solid hsl(220, 13%, 91%)',
                  borderRadius: '0.75rem'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        );

      default:
        return (
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            Chart type not supported
          </div>
        );
    }
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