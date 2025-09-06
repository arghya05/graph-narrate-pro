import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Mic, Send, RotateCcw, Edit, Check, X, TrendingUp, ThumbsUp, ThumbsDown, ChevronDown, Brain } from 'lucide-react';
import { EditableMessage } from './EditableMessage';
import { SuggestedQuestions } from './SuggestedQuestions';
import { VoiceVisualizer } from './VoiceVisualizer';
import { useToast } from '@/hooks/use-toast';
import ReactMarkdown from 'react-markdown';
import { api, apiClient, ChatQuery, ChatResponse, DeepDiveResponse } from '@/lib/api';
import remarkGfm from 'remark-gfm';
import { DataPreviewModal } from './DataPreviewModal';
interface Message {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
  type: 'text' | 'voice';
  isEditing?: boolean;
  metadata?: {
    agent_type?: string;
    sql_data?: Record<string, any>[];
  };
  reasoning_content?: string;
}

interface ChatPanelProps {
  onPdfSelect?: (filename: string) => void;
  onDataReceived?: (data: Record<string, any>[]) => void;
}

export const ChatInterface: React.FC<ChatPanelProps> = ({ onPdfSelect, onDataReceived }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioData, setAudioData] = useState<number[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [selectedText, setSelectedText] = useState<string>('');
  const [showFollowUp, setShowFollowUp] = useState(false);
  const [isHindi, setIsHindi] = useState(false);
  const [followupQuestions, setFollowupQuestions] = useState<{[messageId: string]: string[]}>({});
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

// Agent personas mapping for retail analysis
const agentPersonas = {
    'sales': { name: 'Sales Analyst', color: 'bg-blue-500' },
    'inventory': { name: 'Inventory Manager', color: 'bg-green-500' },
    'marketing': { name: 'Marketing Analyst', color: 'bg-purple-500' },
    'customer': { name: 'Customer Insights', color: 'bg-pink-500' },
    'finance': { name: 'Financial Analyst', color: 'bg-teal-500' },
    'operations': { name: 'Operations Manager', color: 'bg-amber-500' },
    'default': { name: 'Retail Analyst', color: 'bg-gray-500' }
  };

  const getAgentPersona = (agentType?: string) => {
    return agentPersonas[agentType as keyof typeof agentPersonas] || agentPersonas.default;
  };

  const suggestedQuestions = [
    "Show me sales trends by category",
    "Analyze customer purchase patterns",
    "Which products have low inventory?", 
    "Compare monthly revenue growth",
    "Top performing sales regions",
    "Customer satisfaction analysis",
    "Seasonal sales performance"
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (content: string, type: 'text' | 'voice' = 'text', retryMessageId?: string) => {
    if (!content.trim()) return;

    // If this is a retry, remove the failed message and its response
    if (retryMessageId) {
      setMessages(prev => {
        const messageIndex = prev.findIndex(m => m.id === retryMessageId);
        if (messageIndex !== -1) {
          return prev.slice(0, messageIndex);
        }
        return prev;
      });
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      sender: 'user',
      timestamp: new Date(),
      type
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setInput('');

    // Create a placeholder assistant message that will be updated as we stream
    const assistantMessageId = (Date.now() + 1).toString();
    const assistantMessage: Message = {
      id: assistantMessageId,
      content: '',
      sender: 'assistant',
      timestamp: new Date(),
      type: 'text',
      metadata: undefined,
      reasoning_content: ''
    };

    setMessages(prev => [...prev, assistantMessage]);

    try {
      const response = await fetch(api.endpoints.chat, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: content,
          session_id: conversationId
        }),
      });

      if (!response.ok) throw new Error('Failed to send message');

      const data = await response.json();
      
      // Update the assistant message with response content
      setMessages(prev => prev.map(msg => {
        if (msg.id === assistantMessageId) {
          return {
            ...msg,
            content: data.analysis || msg.content,
            metadata: {
              ...msg.metadata,
              agent_type: 'chat'
            }
          };
        }
        return msg;
      }));

      // Update conversation ID
      if (data.session_id) {
        setConversationId(data.session_id);
      }

      // Pass sql_data to visualization component if available
      if (data.sql_data && onDataReceived) {
        onDataReceived(data.sql_data);
        
        // Add data preview modal instead of inline table
        setMessages(prev => prev.map(msg => {
          if (msg.id === assistantMessageId) {
            return {
              ...msg,
              content: msg.content + '\n\n**Data Retrieved:** ' + data.sql_data.length + ' rows',
              metadata: {
                ...msg.metadata,
                sql_data: data.sql_data
              }
            };
          }
          return msg;
        }));
      }

      // After streaming is complete, check for insights and followup questions
      if (conversationId) {
        checkCustomerInsights(conversationId);
        fetchFollowupQuestions(conversationId, assistantMessageId);
      }

    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Connection Error",
        description: "Cannot connect to the chat server. Please check if the backend service is running on localhost:9090",
        variant: "destructive",
      });
      
      // Remove the placeholder assistant message on error
      setMessages(prev => prev.filter(msg => msg.id !== assistantMessageId));
    } finally {
      setIsLoading(false);
    }
  };

  const checkCustomerInsights = async (convId: string) => {
    try {
      const response = await fetch(api.endpoints.session(convId));
      if (response.ok) {
        const insights = await response.json();
        if (insights.filenames && insights.filenames.length > 0) {
          // Auto-select the first PDF
          onPdfSelect(insights.filenames[0]);
        }
      }
    } catch (error) {
      console.error('Error checking insights:', error);
    }
  };

  const fetchFollowupQuestions = async (convId: string, messageId: string) => {
    try {
      const response = await fetch(api.endpoints.deepDiveQuestions, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_message: "Generate follow-up questions",
          dataframe_data: {},
          limit: 5
        }),
      });
      if (response.ok) {
        const result = await response.json();
        if (result.questions && Array.isArray(result.questions) && result.questions.length > 0) {
          setFollowupQuestions(prev => ({
            ...prev,
            [messageId]: result.questions
          }));
        }
      }
    } catch (error) {
      console.error('Error fetching followup questions:', error);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const audioChunks: Blob[] = [];

      recorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        await sendVoiceMessage(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      setMediaRecorder(recorder);
      recorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Error",
        description: "Could not access microphone",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      setAudioData([]);
    }
  };

  const sendVoiceMessage = async (audioBlob: Blob) => {
    // For now, convert to text placeholder since the API only accepts JSON
    const voiceText = "Voice message (audio transcription not available)";
    
    try {
      await sendMessage(voiceText, 'voice');

    } catch (error) {
      console.error('Error sending voice message:', error);
      toast({
        title: "Voice Error",
        description: "Could not process voice message",
        variant: "destructive",
      });
    }
  };

  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim()) {
      setSelectedText(selection.toString().trim());
      setShowFollowUp(true);
    }
  };

  const handleFollowUpQuestion = () => {
    const followUpPrompt = `Based on this text: "${selectedText}", can you provide more details or analysis?`;
    sendMessage(followUpPrompt);
    setShowFollowUp(false);
    setSelectedText('');
  };

  const handleEditMessage = (messageId: string, newContent: string) => {
    setMessages(prev =>
      prev.map(msg =>
        msg.id === messageId ? { ...msg, content: newContent, isEditing: false } : msg
      )
    );
    // Resend the edited message
    sendMessage(newContent, 'text', messageId);
  };

  const toggleEdit = (messageId: string) => {
    setMessages(prev =>
      prev.map(msg =>
        msg.id === messageId ? { ...msg, isEditing: !msg.isEditing } : msg
      )
    );
  };

  const generateDataTableMarkdown = (data: Record<string, any>[]) => {
    if (!data || data.length === 0) return '';
    
    const firstFiveRows = data.slice(0, 5);
    const headers = Object.keys(firstFiveRows[0]);
    
    let markdown = '\n## Data Sample (First 5 rows)\n\n';
    markdown += '| ' + headers.join(' | ') + ' |\n';
    markdown += '|' + headers.map(() => '---').join('|') + '|\n';
    
    firstFiveRows.forEach(row => {
      const values = headers.map(header => {
        const value = row[header];
        return value !== null && value !== undefined ? String(value) : '';
      });
      markdown += '| ' + values.join(' | ') + ' |\n';
    });
    
    markdown += `\n*Showing 5 of ${data.length} total rows*\n`;
    return markdown;
  };

  const sendFeedback = async (type: 'good' | 'bad') => {
    if (!conversationId) return;

    try {
      const conversationData = {
        data: messages,
        type
      };

      const response = await fetch(api.endpoints.session(conversationId), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(conversationData),
      });

      if (response.ok) {
        toast({
          title: "Feedback Sent",
          description: `Thank you for your ${type === 'good' ? 'positive' : 'negative'} feedback!`,
        });
      } else {
        throw new Error('Failed to send feedback');
      }
    } catch (error) {
      console.error('Error sending feedback:', error);
      toast({
        title: "Error",
        description: "Failed to send feedback. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4" onMouseUp={handleTextSelection}>
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] ${message.sender === 'user' ? 'order-1' : 'order-2'}`}>
              {message.isEditing ? (
                <EditableMessage
                  content={message.content}
                  onSave={(newContent) => handleEditMessage(message.id, newContent)}
                  onCancel={() => toggleEdit(message.id)}
                />
              ) : (
                <Card className={`p-3 ${
                  message.sender === 'user' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-card'
                }`}>
                  {/* Reasoning Steps Section - Above Response */}
                  {message.sender === 'assistant' && message.reasoning_content && (
                    <Collapsible className="mb-3">
                      <CollapsibleTrigger asChild>
                        <Button 
                          variant="ghost" 
                          className="w-full justify-start p-2 h-auto bg-slate-50/50 dark:bg-slate-900/20 hover:bg-slate-100/50 dark:hover:bg-slate-800/30 border border-slate-200/50 dark:border-slate-700/30 rounded-md"
                        >
                          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                            <Brain className="w-3 h-3" />
                            <span className="text-xs font-medium">Reasoning Steps</span>
                            <ChevronDown className="w-3 h-3 ml-auto transition-transform duration-200 group-data-[state=open]:rotate-180" />
                          </div>
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="mt-2">
                        <div className="text-sm prose prose-sm max-w-none dark:prose-invert bg-slate-50/50 dark:bg-slate-900/20 p-3 rounded border border-slate-200/50 dark:border-slate-700/30">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.reasoning_content}</ReactMarkdown>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  )}

                  {message.sender === 'assistant' && message.metadata?.agent_type && (
                    <div className="flex items-center gap-2 mb-2 pb-2 border-b border-border">
                      <div className={`w-2 h-2 rounded-full ${getAgentPersona(message.metadata.agent_type).color}`}></div>
                      <span className="text-xs font-medium text-muted-foreground">
                        {getAgentPersona(message.metadata.agent_type).name}
                      </span>
                    </div>
                  )}
                  
                   <div className="flex items-start justify-between gap-2">
                    {message.sender === 'assistant' ? (
                      <div className="text-sm prose prose-sm max-w-none dark:prose-invert">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
                        {/* Data preview modal for assistant messages with sql_data */}
                        {message.metadata?.sql_data && (
                          <div className="mt-3">
                            <DataPreviewModal data={message.metadata.sql_data} />
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm">{message.content}</p>
                    )}
                    {message.sender === 'user' && (
                      <div className="flex gap-1 ml-2 flex-shrink-0">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => toggleEdit(message.id)}
                          className="h-6 w-6 p-0"
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => sendMessage(message.content, 'text', message.id)}
                          className="h-6 w-6 p-0"
                        >
                          <RotateCcw className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  {/* Feedback buttons for assistant messages */}
                  {message.sender === 'assistant' && (
                    <div className="flex gap-2 mt-3 pt-2 border-t border-border">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => sendFeedback('good')}
                        className="h-8 px-3 text-xs"
                      >
                        <ThumbsUp className="w-3 h-3 mr-1" />
                        Like
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => sendFeedback('bad')}
                        className="h-8 px-3 text-xs"
                      >
                        <ThumbsDown className="w-3 h-3 mr-1" />
                        Dislike
                      </Button>
                    </div>
                  )}
                </Card>
              )}
              
              {/* Followup Questions for Assistant Messages */}
              {message.sender === 'assistant' && followupQuestions[message.id] && (
                <div className="mt-3">
                  <SuggestedQuestions
                    questions={followupQuestions[message.id]}
                    onQuestionSelect={sendMessage}
                  />
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <Card className="p-3 bg-card">
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                <span className="text-sm text-muted-foreground">Thinking...</span>
              </div>
            </Card>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Follow-up dialog */}
      {showFollowUp && (
        <div className="mx-4 mb-2">
          <Card className="p-3 bg-accent">
            <div className="flex items-center justify-between">
              <p className="text-sm">Ask a follow-up question about: "{selectedText.slice(0, 50)}..."</p>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleFollowUpQuestion}>
                  <Check className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShowFollowUp(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Suggested Questions */}
      <SuggestedQuestions
        questions={suggestedQuestions}
        onQuestionSelect={sendMessage}
      />

      {/* Voice Visualizer */}
      {isRecording && (
        <div className="mx-4 mb-2">
          <VoiceVisualizer isRecording={isRecording} audioData={audioData} />
        </div>
      )}

      {/* Input Area */}
      <div className="border-t border-border p-4">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about sales trends, customer insights, inventory analysis..."
            className="min-h-[60px] resize-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage(input);
              }
            }}
          />
          <div className="flex flex-col gap-2">
            <Button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isLoading}
              size="icon"
            >
              <Send className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isLoading}
              size="icon"
            >
              <Mic className={`w-4 h-4 ${isRecording ? 'text-destructive' : ''}`} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};