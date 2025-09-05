// Centralized API configuration
const BASE_URL = 'http://localhost:9099';

export const api = {
  baseUrl: BASE_URL,
  
  endpoints: {
    chat: `${BASE_URL}/chat`,
    deepDiveQuestions: `${BASE_URL}/deep-dive-questions`,
    sessions: `${BASE_URL}/chat/sessions`,
    session: (id: string) => `${BASE_URL}/chat/sessions/${id}`,
    continueChat: (id: string) => `${BASE_URL}/chat/continue/${id}`,
    analyzeVariables: `${BASE_URL}/analyze-variables`,
    valueCounts: (variable: string) => `${BASE_URL}/value-counts/${variable}`,
    twoLevelAnalysis: `${BASE_URL}/two-level-analysis`,
    threeLevelAnalysis: `${BASE_URL}/three-level-analysis`,
    health: `${BASE_URL}/health`,
  }
};

// API Response Types
export interface ChatResponse {
  analysis: string;
  sql_data: Record<string, any>[];
  session_id: string;
  message_id: string;
}

export interface ChatQuery {
  message: string;
  session_id?: string;
}

export interface VariableAnalysis {
  columns: ColumnInfo[];
  chart_recommendations: Record<string, ChartRecommendation[]>;
}

export interface ColumnInfo {
  name: string;
  dtype: string;
  data_type: 'numeric' | 'categorical' | 'datetime' | 'boolean';
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

export type ChartType = 'bar' | 'line' | 'scatter' | 'pie' | 'histogram' | 'box' | 'heatmap' | 'area' | 'violin' | 'sunburst' | 'treemap';

export interface TwoLevelAnalysisResponse {
  var1: string;
  var2: string;
  analysis_type: string;
  data: Record<string, any>;
  chart_data: Record<string, any>;
}

export interface DeepDiveResponse {
  questions: string[];
  session_id: string;
}

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