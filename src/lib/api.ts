// Centralized API configuration
const BASE_URL = 'http://localhost:9090';

export const api = {
  baseUrl: BASE_URL,
  
  endpoints: {
    chat: `${BASE_URL}/chat`,
    deepDiveQuestions: `${BASE_URL}/deep-dive-questions`,
    sessions: `${BASE_URL}/chat/sessions`,
    session: (id: string) => `${BASE_URL}/chat/sessions/${id}`,
    continueChat: (id: string, message: string) => `${BASE_URL}/chat/continue/${id}?message=${encodeURIComponent(message)}`,
    analyzeVariables: `${BASE_URL}/analyze-variables`,
    valueCounts: (variable: string, topN?: number) => `${BASE_URL}/value-counts/${variable}${topN ? `?top_n=${topN}` : ''}`,
    twoLevelAnalysis: `${BASE_URL}/two-level-analysis`,
    threeLevelAnalysis: `${BASE_URL}/three-level-analysis`,
    health: `${BASE_URL}/health`,
    root: BASE_URL,
  }
};

// API Request Types
export interface ChatQuery {
  message: string;
  session_id?: string | null;
}

export interface DeepDiveRequest {
  user_message: string;
  dataframe_data: Record<string, any[]>;
  limit?: number | null;
}

// API Response Types
export interface ChatResponse {
  analysis: string;
  sql_data: Record<string, any>[];
  session_id: string;
  message_id: string;
}

export interface DeepDiveResponse {
  questions: string[];
  session_id: string;
}

export interface SessionsListResponse {
  sessions: Record<string, any>[];
  total_count: number;
}

export interface VariableAnalysis {
  columns: ColumnInfo[];
  chart_recommendations: Record<string, ChartRecommendation[]>;
}

export interface ColumnInfo {
  name: string;
  dtype: string;
  data_type: DataType;
  unique_count: number;
  null_count: number;
  sample_values: any[];
}

export interface ChartRecommendation {
  chart_type: ChartType;
  description: string;
  suitable_for: string;
  complexity_level: string;
}

export interface ValueCountsResponse {
  variable: string;
  counts: Record<string, any>;
  chart_data: Record<string, any>;
}

export interface TwoLevelAnalysisResponse {
  var1: string;
  var2: string;
  analysis_type: string;
  data: Record<string, any>;
  chart_data: Record<string, any>;
}

export interface ThreeLevelAnalysisResponse {
  var1: string;
  var2: string;
  period_var: string;
  analysis_type: string;
  data: Record<string, any>;
  chart_data: Record<string, any>;
}

export interface HTTPValidationError {
  detail: ValidationError[];
}

export interface ValidationError {
  loc: (string | number)[];
  msg: string;
  type: string;
}

// Enums
export type ChartType = 'bar' | 'line' | 'scatter' | 'pie' | 'histogram' | 'box' | 'heatmap' | 'area' | 'violin' | 'sunburst' | 'treemap';

export type DataType = 'numeric' | 'categorical' | 'datetime' | 'boolean';

// API Helper Functions
export const apiClient = {
  async post<T>(url: string, data: any): Promise<T> {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
  },

  async get<T>(url: string): Promise<T> {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
  },

  async delete<T>(url: string): Promise<T> {
    const response = await fetch(url, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
  }
};