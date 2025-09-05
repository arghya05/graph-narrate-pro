import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Mic, Send, RotateCcw, Edit, Check, X, TrendingUp, ThumbsUp, ThumbsDown, ChevronDown, Brain } from 'lucide-react';
import { EditableMessage } from './EditableMessage';
import { useToast } from '@/hooks/use-toast';
import ReactMarkdown from 'react-markdown';
import { buildApiUrl, API_ENDPOINTS } from '@/config/api';
import remarkGfm from 'remark-gfm'
interface Message {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
  type: 'text' | 'voice';
  isEditing?: boolean;
  metadata?: {
    agent_type?: string;
  };
  reasoning_content?: string;
}

interface ChatPanelProps {
  onPdfSelect: (filename: string) => void;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({ onPdfSelect }) => {
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

  // Agent personas mapping
const agentPersonas = {
    'dealership': { name: 'Dealership Sales', color: 'bg-blue-500' },
    'financing': { name: 'Finance Advisor', color: 'bg-green-500' },
    'technical': { name: 'Technical Specialist', color: 'bg-purple-500' },
    'guard_rail_blocked': { name: 'Question Blocked', color: 'bg-red-500' },
    'inventory': { name: 'Inventory Manager', color: 'bg-teal-500' },
    'supervisor': { name: 'Reasoning Steps', color: 'bg-amber-500' },
    'default': { name: 'Dealership Sales', color: 'bg-gray-500' }
  };

  const getAgentPersona = (agentType?: string) => {
    return agentPersonas[agentType as keyof typeof agentPersonas] || agentPersonas.default;
  };

  const suggestedQuestions = [
    "Tell me about Nexon car",
    "Harrier vs Safari comparison", 
    "Best electric vehicle",
    "CNG cars available",
    "Family SUV under 15 lakhs",
    "Test drive booking",
    "Financing options"
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
      const response = await fetch(buildApiUrl(API_ENDPOINTS.CHAT), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: content,
          conversation_id: conversationId,
          hindi_langauge: isHindi
        }),
      });

      if (!response.ok) throw new Error('Failed to send message');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error('Failed to get response reader');

      let buffer = '';
      
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        
        // Process complete lines
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer
        
        for (const line of lines) {
          if (line.trim() === '') continue;
          
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              // Update the assistant message with streaming content
              setMessages(prev => prev.map(msg => {
                if (msg.id === assistantMessageId) {
                  return {
                    ...msg,
                    content: data.message || msg.content,
                    metadata: data.meta_data || msg.metadata,
                    reasoning_content: data.reasoning_content || msg.reasoning_content
                  };
                }
                return msg;
              }));

              // Update conversation ID
              if (data.conversation_id) {
                setConversationId(data.conversation_id);
              }
              
            } catch (parseError) {
              console.error('Error parsing SSE data:', parseError);
            }
          }
        }
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
      const response = await fetch(buildApiUrl(API_ENDPOINTS.CONVERSATIONS_INSIGHTS(convId)));
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
      const response = await fetch(buildApiUrl(API_ENDPOINTS.CONVERSATIONS_FOLLOWUP(convId)));
      if (response.ok) {
        const questions = await response.json();
        if (questions && Array.isArray(questions) && questions.length > 0) {
          setFollowupQuestions(prev => ({
            ...prev,
            [messageId]: questions
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
    const formData = new FormData();
    formData.append('audio_file', audioBlob, 'audio.wav');
    formData.append('hindi_language', isHindi.toString());
    if (conversationId) {
      formData.append('conversation_id', conversationId);
    }

    try {
      const response = await fetch(buildApiUrl(API_ENDPOINTS.CHAT_VOICE), {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Failed to send voice message');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error('Failed to get response reader');

      let buffer = '';
      let userMessage: Message | null = null;
      let assistantMessageId: string | null = null;
      
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        
        // Process complete lines
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer
        
        for (const line of lines) {
          if (line.trim() === '') continue;
          
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              // Create user message if transcribed_text is available and not already created
              if (data.transcribed_text && !userMessage) {
                userMessage = {
                  id: Date.now().toString(),
                  content: data.transcribed_text,
                  sender: 'user',
                  timestamp: new Date(),
                  type: 'voice'
                };
                setMessages(prev => [...prev, userMessage!]);
              }

              // Create or update assistant message
              if (data.message && !assistantMessageId) {
                assistantMessageId = (Date.now() + 1).toString();
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
              }

              // Update assistant message with streaming content
              if (assistantMessageId) {
                setMessages(prev => prev.map(msg => {
                  if (msg.id === assistantMessageId) {
                    return {
                      ...msg,
                      content: data.message || msg.content,
                      metadata: data.meta_data || msg.metadata,
                      reasoning_content: data.reasoning_content || msg.reasoning_content
                    };
                  }
                  return msg;
                }));
              }

              // Update conversation ID
              if (data.conversation_id) {
                setConversationId(data.conversation_id);
              }
              
            } catch (parseError) {
              console.error('Error parsing voice SSE data:', parseError);
            }
          }
        }
      }

      // After streaming is complete, check for insights and followup questions
      if (conversationId && assistantMessageId) {
        checkCustomerInsights(conversationId);
        fetchFollowupQuestions(conversationId, assistantMessageId);
      }

    } catch (error) {
      console.error('Error sending voice message:', error);
      toast({
        title: "Connection Error",
        description: "Cannot connect to the chat server. Please check if the backend service is running on localhost:9090",
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

  const sendFeedback = async (type: 'good' | 'bad') => {
    if (!conversationId) return;

    try {
      const conversationData = {
        data: messages,
        type
      };

      const response = await fetch(buildApiUrl(API_ENDPOINTS.FAVOURABLE_CONVERSATIONS(conversationId)), {
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
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="border-b border-border p-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Car Sales & Financing Assistant</h2>
          <p className="text-sm text-muted-foreground">
            I can help you find the perfect car, explore financing options, and answer questions about our inventory.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={isHindi ? "default" : "outline"}
            size="sm"
            onClick={() => setIsHindi(!isHindi)}
          >
            {isHindi ? "Hindi" : "English"}
          </Button>
        </div>
      </div>

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
            placeholder="Ask about cars, financing, trade-ins, or our inventory..."
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