import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface MetricChartProps {
  title: string;
  value: string | number;
  change?: string;
  data?: any[];
  chartType?: 'line' | 'bar';
  color?: string;
}

export function MetricChart({ 
  title, 
  value, 
  change, 
  data = [], 
  chartType = 'line',
  color = '#3b82f6'
}: MetricChartProps) {
  return (
    <Card className="bg-card border-border/50">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          {change && (
            <span className={`text-xs px-1.5 py-0.5 rounded text-muted-foreground`}>
              {change}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-end justify-between">
          <div className="space-y-1">
            <div className="text-2xl font-bold">{value}</div>
          </div>
          {data.length > 0 && (
            <div className="h-12 w-24">
              <ResponsiveContainer width="100%" height="100%">
                {chartType === 'line' ? (
                  <LineChart data={data}>
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke={color}
                      strokeWidth={1.5}
                      dot={false}
                      activeDot={false}
                    />
                  </LineChart>
                ) : (
                  <BarChart data={data}>
                    <Bar dataKey="value" fill={color} />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}