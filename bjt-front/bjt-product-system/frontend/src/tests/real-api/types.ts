export interface TestResult {
  test: string;
  status: 'pass' | 'fail' | 'skip';
  error?: string;
  apiCall?: string;
  responseTime?: number;
  statusCode?: number;
}

export interface ApiMetrics {
  totalCalls: number;
  averageResponseTime: number;
  slowestCall: { endpoint: string; time: number } | null;
  fastestCall: { endpoint: string; time: number } | null;
  errorRate: number;
}

export interface ApiCall {
  endpoint: string;
  time: number;
  success: boolean;
} 