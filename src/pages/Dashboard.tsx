import { useState, useEffect } from 'react';
import { MetricCard } from '@/components/MetricCard';
import { Chart } from '@/components/Chart';
import { ChatInterface } from '@/components/ChatInterface';
import { DetailedAnalysis } from '@/components/DetailedAnalysis';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { apiClient, api, VariableAnalysis } from '@/lib/api';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Eye, 
  MousePointer,
  RefreshCw,
  Filter
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Sample data that matches the analytics theme from the images
const sampleMetrics = [
  {
    title: 'Total Visits',
    value: '67.4k',
    change: 12.5,
    icon: <Eye className="h-6 w-6" />,
    sparkline: [20, 35, 25, 40, 30, 45, 35, 50]
  },
  {
    title: 'Transactions',
    value: '988',
    change: 8.2,
    icon: <DollarSign className="h-6 w-6" />,
    sparkline: [15, 25, 30, 20, 35, 25, 40, 30]
  },
  {
    title: 'Pageviews',
    value: '252k',
    change: -2.1,
    icon: <BarChart3 className="h-6 w-6" />,
    sparkline: [40, 35, 45, 30, 35, 40, 25, 30]
  },
  {
    title: 'Time on Site',
    value: '9.75m',
    change: 5.8,
    icon: <MousePointer className="h-6 w-6" />,
    sparkline: [30, 40, 35, 45, 40, 35, 45, 40]
  }
];

const sampleChartData = {
  visits: [
    { name: 'Google', value: 343 },
    { name: '(direct)', value: 625 },
    { name: 'Facebook', value: 1 },
    { name: 'Partners', value: 4 },
    { name: 'bing', value: 2 },
    { name: 'Yahoo', value: 3 }
  ],
  transactions: [
    { name: 'Jan', value: 400 },
    { name: 'Feb', value: 300 },
    { name: 'Mar', value: 600 },
    { name: 'Apr', value: 800 },
    { name: 'May', value: 500 },
    { name: 'Jun', value: 900 }
  ],
  revenue: [
    { name: 'Q1', value: 2400 },
    { name: 'Q2', value: 1398 },
    { name: 'Q3', value: 9800 },
    { name: 'Q4', value: 3908 }
  ]
};

export function Dashboard() {
  const [chatData, setChatData] = useState<Record<string, any>[]>([]);
  const [selectedChart, setSelectedChart] = useState<{
    data: Record<string, any>[];
    title: string;
  } | null>(null);
  const [variableAnalysis, setVariableAnalysis] = useState<VariableAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadVariableAnalysis();
  }, []);

  const loadVariableAnalysis = async () => {
    setLoading(true);
    try {
      const analysis = await apiClient.get<VariableAnalysis>(api.endpoints.analyzeVariables);
      setVariableAnalysis(analysis);
    } catch (error) {
      console.error('Failed to load variable analysis:', error);
      // Continue with sample data if API fails
    } finally {
      setLoading(false);
    }
  };

  const handleChartClick = (data: Record<string, any>[], title: string) => {
    setSelectedChart({ data, title });
  };

  const handleChatDataReceived = (data: Record<string, any>[]) => {
    setChatData(data);
    toast({
      title: "New data received",
      description: `${data.length} records loaded from chat analysis`,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Analytics Dashboard
              </h1>
              <p className="text-muted-foreground">
                Comprehensive data analysis and insights
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="font-medium">
                API: Connected
              </Badge>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={loadVariableAnalysis}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-6">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="analysis">Analysis</TabsTrigger>
            <TabsTrigger value="chat">AI Chat</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {sampleMetrics.map((metric, index) => (
                <MetricCard
                  key={index}
                  title={metric.title}
                  value={metric.value}
                  change={metric.change}
                  icon={metric.icon}
                  sparkline={metric.sparkline}
                />
              ))}
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Chart
                title="Total Visits - Source"
                data={sampleChartData.visits}
                chartType="bar"
                onClick={() => handleChartClick(sampleChartData.visits, "Visits by Source")}
                description="Website traffic by source"
              />
              
              <Chart
                title="Transactions Over Time"
                data={sampleChartData.transactions}
                chartType="line"
                onClick={() => handleChartClick(sampleChartData.transactions, "Transaction Timeline")}
                description="Monthly transaction trends"
              />
              
              <Chart
                title="Revenue Distribution"
                data={sampleChartData.revenue}
                chartType="area"
                onClick={() => handleChartClick(sampleChartData.revenue, "Revenue Analysis")}
                description="Quarterly revenue performance"
              />

              {chatData.length > 0 && (
                <Chart
                  title="Chat Analysis Data"
                  data={chatData.slice(0, 10).map((row, idx) => ({
                    name: Object.values(row)[0] || `Item ${idx + 1}`,
                    value: parseFloat(String(Object.values(row)[1] || 0)) || idx + 1
                  }))}
                  chartType="bar"
                  onClick={() => handleChartClick(chatData, "Chat Data Analysis")}
                  description="Data from AI chat analysis"
                />
              )}
            </div>
          </TabsContent>

          <TabsContent value="analysis" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Variable Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Loading variable analysis...
                  </div>
                ) : variableAnalysis ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {variableAnalysis.columns.slice(0, 6).map((column, index) => (
                        <Card key={index} className="p-4">
                          <h4 className="font-medium">{column.name}</h4>
                          <div className="flex gap-2 mt-2">
                            <Badge variant="outline">{column.data_type}</Badge>
                            <Badge variant="secondary">{column.unique_count} unique</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-2">
                            {column.sample_values.slice(0, 3).join(', ')}...
                          </p>
                        </Card>
                      ))}
                    </div>
                    
                    <div className="mt-6">
                      <h4 className="font-medium mb-3">Chart Recommendations</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.entries(variableAnalysis.chart_recommendations).slice(0, 4).map(([type, recommendations]) => (
                          <Card key={type} className="p-4">
                            <h5 className="font-medium capitalize">{type}</h5>
                            <div className="mt-2 space-y-1">
                              {recommendations.slice(0, 2).map((rec, idx) => (
                                <Badge key={idx} variant="outline" className="mr-2">
                                  {rec.chart_type}
                                </Badge>
                              ))}
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Filter className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No variable analysis data available</p>
                    <p className="text-sm">Connect to the API to load analysis data</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="chat" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <ChatInterface onDataReceived={handleChatDataReceived} />
              </div>
              
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Quick Insights</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-sm">
                      <strong>Total Data Points:</strong> {chatData.length}
                    </div>
                    {chatData.length > 0 && (
                      <div className="text-sm">
                        <strong>Columns:</strong> {Object.keys(chatData[0]).length}
                      </div>
                    )}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={() => chatData.length > 0 && handleChartClick(chatData, "Full Chat Dataset")}
                      disabled={chatData.length === 0}
                    >
                      View Detailed Analysis
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Detailed Analysis Modal */}
      {selectedChart && (
        <DetailedAnalysis
          open={!!selectedChart}
          onOpenChange={() => setSelectedChart(null)}
          data={selectedChart.data}
          title={selectedChart.title}
        />
      )}
    </div>
  );
}