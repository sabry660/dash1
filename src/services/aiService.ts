import { apiService } from './api';

// AI Request Types
export interface AIRequest {
  query: string;
}

// Graph Types
export type GraphType = 'BAR' | 'PIE' | 'LINE';

export interface GraphDataset {
  label: string;
  data: number[];
  backgroundColor?: string[];
  borderColor?: string;
}

export interface Graph {
  type: GraphType;
  title: string;
  labels: string[];
  datasets: GraphDataset[];
}

// AI Response Types
export interface AIResponse {
  textSummary: string;
  showGraph: boolean;
  graph?: Graph;
}

// Message Types
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  graph?: Graph;
  isTyping?: boolean;
}

// AI Service Class
class AIService {
  private baseURL: string;

  constructor() {
    this.baseURL = 'https://lytc-hotel-backend.onrender.com';
  }

  /**
   * Ask AI Agent
   * POST /api/ai/ask
   */
  async askAgent(query: string): Promise<AIResponse> {
    const token = localStorage.getItem('auth_token');
    const tenantId = localStorage.getItem('tenant_id');
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept-Language': 'ar-SA',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (tenantId) {
      headers['X-Tenant-ID'] = tenantId;
    }

    const response = await fetch(`${this.baseURL}/api/ai/ask`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ query, language: 'ar' }),
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '');
      let errorMsg = `خطأ في الخادم (${response.status})`;
      try {
        const errorJson = JSON.parse(errorBody);
        errorMsg = errorJson.message || errorJson.error || errorJson.detail || errorMsg;
      } catch {}
      throw new Error(errorMsg);
    }

    return response.json();
  }
}

export const aiService = new AIService();
