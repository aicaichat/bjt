import axios, { AxiosError } from 'axios';

export interface LoginApiResponse {
  success: boolean;
  message?: string;
  data: {
    token: string;
    expires_in: number;
    user: {
      id: number;
      name: string;
      email: string;
      roles: string[];
    }
  }
}

export const login = async (email: string, password: string): Promise<LoginApiResponse> => {
  return mockLogin(email, password);
  try {
    
    const response = await axios.post<LoginApiResponse>('/wp-json/bjt/v1/auth/login', {
      username: email,
      password
    });
    
    if (!response.data) {
      throw new Error('Invalid response from server');
    }
    
    // 处理不同的响应结构
    if (response.data.success === false) {
      throw new Error(response.data.message || 'Authentication failed');
    }
    
    return response.data;
  } catch (error) {
    console.error('Login error:', error);
    
    // 处理错误情况
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      
      // 处理服务器错误
      if (axiosError.response?.status === 500) {
        throw new Error('Server error. Please try again later.');
      }
      
      // 处理特定的API错误
      if (axiosError.response?.data) {
        const errorData = axiosError.response.data as any;
        if (errorData.message) {
          throw new Error(errorData.message);
        }
      }
      
      // 处理网络错误
      if (axiosError.code === 'ECONNABORTED' || !axiosError.response) {
        throw new Error('Network error. Please check your connection.');
      }
    }
    
    // 默认错误信息
    throw error instanceof Error ? error : new Error('An unknown error occurred');
  }
};

// Mock implementation for development
export const mockLogin = async (email: string, password: string): Promise<LoginApiResponse> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Demo users for testing
  const users = [
    { email: 'admin@bjt.com', password: 'admin123', role: 'admin' },
    { email: 'sales@bjt.com', password: 'admin123', role: 'sales' },
    { email: 'eu-vip@customer.com', password: 'admin123', role: 'customer' },
    { email: 'au@customer.com', password: 'admin123', role: 'customer' },
    { email: 'northamerica@user.com', password: 'admin123', role: 'customer' }
  ];
  
  const user = users.find(u => u.email === email && u.password === password);
  
  if (user) {
    return {
      success: true,
      data: {
        token: 'mock-jwt-token-' + Math.random().toString(36).substr(2, 9),
        expires_in: 3600,
        user: {
          id: parseInt(Math.random().toString().substring(2, 8)),
          name: email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1),
          email: email,
          roles: [user.role]
        }
      }
    };
  } else {
    return {
      success: false,
      message: 'Invalid credentials',
      data: {
        token: '',
        expires_in: 0,
        user: {
          id: 0,
          name: '',
          email: '',
          roles: []
        }
      }
    };
  }
}; 