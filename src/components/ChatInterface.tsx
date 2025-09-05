import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Send, Bot, User, Loader2, Upload, Database, Sparkles, TrendingUp, ShoppingCart, Users, DollarSign } from 'lucide-react';
import { apiClient, api, ChatResponse, ChatQuery, DeepDiveResponse } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  type: 'user' | 'bot';
  content: string;
  sqlData?: Record<string, any>[];
  timestamp: Date;
  deepDiveQuestions?: string[];
}

interface ChatInterfaceProps {
  onDataReceived?: (data: Record<string, any>[]) => void;
  sessionId?: string;
}

// Retail Analysis Personas
const RETAIL_PERSONAS = [
  {
    id: 'sales-analyst',
    name: 'Sales Analyst',
    icon: TrendingUp,
    description: 'Focus on sales performance, revenue trends, and growth metrics',
    examples: [
      'Analyze monthly sales performance by product category',
      'Show top-selling products and their revenue contribution',
      'Compare sales trends across different store locations'
    ]
  },
  {
    id: 'customer-insights',
    name: 'Customer Analytics',
    icon: Users,
    description: 'Customer behavior, segmentation, and retention analysis',
    examples: [
      'Identify customer purchasing patterns and preferences',
      'Analyze customer lifetime value by segment',
      'Show customer retention rates over time'
    ]
  },
  {
    id: 'inventory-manager',
    name: 'Inventory Manager',
    icon: Database,
    description: 'Stock levels, turnover rates, and supply chain insights',
    examples: [
      'Analyze inventory turnover by product category',
      'Identify slow-moving and fast-moving inventory',
      'Show stockout patterns and seasonal demand'
    ]
  },
  {
    id: 'marketing-analyst',
    name: 'Marketing ROI',
    icon: DollarSign,
    description: 'Campaign performance, channel effectiveness, and attribution',
    examples: [
      'Analyze marketing campaign ROI by channel',
      'Show conversion rates across different channels',
      'Track customer acquisition costs and attribution'
    ]
  }
];

export function ChatInterface({ onDataReceived, sessionId }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | undefined>(sessionId);
  const [selectedPersona, setSelectedPersona] = useState<string>('sales-analyst');
  const [dataframeData, setDataframeData] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'chat' | 'dataframe'>('chat');
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setLoading(true);

    try {
      // Include dataframe data if available
      const queryData: any = {
        message: currentInput,
        ...(currentSessionId && { session_id: currentSessionId }),
        ...(dataframeData && { dataframe_data: JSON.parse(dataframeData) })
      };

      const response: ChatResponse = await apiClient.post(api.endpoints.chat, queryData);

      if (!currentSessionId) {
        setCurrentSessionId(response.session_id);
      }

      // Get deep dive questions if we have data
      let deepDiveQuestions: string[] = [];
      if (response.sql_data && response.sql_data.length > 0) {
        try {
          const deepDiveResponse: DeepDiveResponse = await apiClient.post(api.endpoints.deepDiveQuestions, {
            user_message: currentInput,
            dataframe_data: response.sql_data.reduce((acc, row, index) => {
              Object.keys(row).forEach(key => {
                if (!acc[key]) acc[key] = [];
                acc[key][index] = row[key];
              });
              return acc;
            }, {} as Record<string, any[]>),
            limit: 5
          });
          deepDiveQuestions = deepDiveResponse.questions;
        } catch (error) {
          console.warn('Failed to get deep dive questions:', error);
        }
      }

      const botMessage: Message = {
        id: response.message_id,
        type: 'bot',
        content: response.analysis,
        sqlData: response.sql_data,
        deepDiveQuestions,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, botMessage]);

      if (response.sql_data && response.sql_data.length > 0) {
        onDataReceived?.(response.sql_data);
      }

      toast({
        title: "Analysis complete",
        description: `Generated insights with ${response.sql_data?.length || 0} data points`,
      });
    } catch (error) {
      console.error('Chat error:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please check if the API server is running.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeepDiveClick = (question: string) => {
    setInput(question);
  };

  const handleExampleClick = (example: string) => {
    setInput(example);
  };

  const uploadDataframe = () => {
    try {
      const parsed = JSON.parse(dataframeData);
      toast({
        title: "Dataframe uploaded",
        description: `Ready to analyze ${Array.isArray(parsed) ? parsed.length : Object.keys(parsed).length} data points`,
      });
      setActiveTab('chat');
    } catch (error) {
      toast({
        title: "Invalid JSON",
        description: "Please check your dataframe format",
        variant: "destructive",
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const currentPersona = RETAIL_PERSONAS.find(p => p.id === selectedPersona) || RETAIL_PERSONAS[0];

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-primary" />
            Retail Analytics AI
          </CardTitle>
          {currentSessionId && (
            <Badge variant="outline" className="text-xs">
              Session: {currentSessionId.slice(0, 8)}...
            </Badge>
          )}
        </div>
        
        {/* Persona Selection */}
        <div className="mt-3">
          <Select value={selectedPersona} onValueChange={setSelectedPersona}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RETAIL_PERSONAS.map((persona) => (
                <SelectItem key={persona.id} value={persona.id}>
                  <div className="flex items-center gap-2">
                    <persona.icon className="h-4 w-4" />
                    <span>{persona.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground mt-1">
            {currentPersona.description}
          </p>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'chat' | 'dataframe')} className="flex-1 flex flex-col">
          <TabsList className="mx-6 mb-4">
            <TabsTrigger value="chat" className="flex items-center gap-2">
              <Bot className="h-4 w-4" />
              Chat Analysis
            </TabsTrigger>
            <TabsTrigger value="dataframe" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Data Upload
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chat" className="flex-1 flex flex-col mt-0">
            <ScrollArea className="flex-1 px-6" ref={scrollRef}>
              <div className="space-y-4 pb-4">
                {messages.length === 0 && (
                  <div className="text-center text-muted-foreground py-8">
                    <currentPersona.icon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <h3 className="font-medium mb-2">Ready for Retail Analytics</h3>
                    <p className="text-sm mb-4">Ask me about your retail data using natural language!</p>
                    
                    <div className="grid gap-2 max-w-md mx-auto">
                      <p className="text-xs font-medium">Try these examples:</p>
                      {currentPersona.examples.map((example, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          className="text-xs h-auto py-2 px-3 text-left whitespace-normal"
                          onClick={() => handleExampleClick(example)}
                        >
                          <Sparkles className="h-3 w-3 mr-2 flex-shrink-0" />
                          {example}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
                
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex gap-3 max-w-[85%] ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        message.type === 'user' 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-secondary text-secondary-foreground'
                      }`}>
                        {message.type === 'user' ? <User className="h-4 w-4" /> : <currentPersona.icon className="h-4 w-4" />}
                      </div>
                      
                      <div className={`rounded-lg p-3 ${
                        message.type === 'user'
                          ? 'bg-primary text-primary-foreground ml-auto'
                          : 'bg-secondary text-secondary-foreground'
                      }`}>
                        <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                        
                        {message.sqlData && message.sqlData.length > 0 && (
                          <div className="mt-2 p-2 bg-black/10 rounded text-xs">
                            <p className="font-medium mb-1">📊 Data Retrieved:</p>
                            <p>{message.sqlData.length} records • {Object.keys(message.sqlData[0] || {}).length} columns</p>
                          </div>
                        )}

                        {message.deepDiveQuestions && message.deepDiveQuestions.length > 0 && (
                          <div className="mt-3 space-y-1">
                            <p className="text-xs font-medium opacity-80">💡 Deep Dive Questions:</p>
                            {message.deepDiveQuestions.slice(0, 3).map((question, index) => (
                              <Button
                                key={index}
                                variant="ghost"
                                size="sm"
                                className="h-auto py-1 px-2 text-xs text-left whitespace-normal w-full justify-start"
                                onClick={() => handleDeepDiveClick(question)}
                              >
                                <span className="mr-2">→</span>
                                {question}
                              </Button>
                            ))}
                          </div>
                        )}
                        
                        <div className="text-xs opacity-70 mt-1">
                          {message.timestamp.toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {loading && (
                  <div className="flex gap-3 justify-start">
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                      <currentPersona.icon className="h-4 w-4" />
                    </div>
                    <div className="bg-secondary rounded-lg p-3 flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">Analyzing retail data...</span>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
            
            <div className="p-6 pt-4 border-t">
              <div className="flex gap-2">
                <Input
                  placeholder={`Ask ${currentPersona.name} about your retail data...`}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={loading}
                  className="flex-1"
                />
                <Button 
                  onClick={sendMessage} 
                  disabled={!input.trim() || loading}
                  size="icon"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="dataframe" className="flex-1 flex flex-col mt-0">
            <div className="flex-1 px-6 py-4">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Upload Dataframe (JSON format)
                  </label>
                  <Textarea
                    placeholder={`Paste your dataframe as JSON array:
[
  {"product": "Product A", "sales": 1200, "category": "Electronics"},
  {"product": "Product B", "sales": 800, "category": "Clothing"},
  ...
]`}
                    value={dataframeData}
                    onChange={(e) => setDataframeData(e.target.value)}
                    className="min-h-[200px] font-mono text-xs"
                  />
                </div>
                
                <div className="flex gap-2">
                  <Button onClick={uploadDataframe} disabled={!dataframeData.trim()}>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Data
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => setDataframeData('')}
                  >
                    Clear
                  </Button>
                </div>

                {dataframeData && (
                  <div className="text-xs text-muted-foreground">
                    <p>💡 Once uploaded, your data will be automatically included in chat analysis</p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}