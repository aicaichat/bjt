import axios from 'axios';

interface LoginResponse {
  token: string;
  user: {
    id: string;
    username: string;
    name: string;
    email: string;
    role: string;
  };
  success: boolean;
  message?: string;
}

export const login = async (email: string, password: string): Promise<LoginResponse> => {
  try {
    // Replace with actual API endpoint when available
    const response = await axios.post('/wp-json/bjt/v1/auth/login', {
      username: email,
      password
    });
    
    return response.data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

// Mock implementation for development
export const mockLogin = async (email: string, password: string): Promise<LoginResponse> => {
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
      token: 'mock-jwt-token-' + Math.random().toString(36).substr(2, 9),
      user: {
        id: Math.random().toString(36).substr(2, 9),
        username: email.split('@')[0],
        name: email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1),
        email: email,
        role: user.role
      }
    };
  } else {
    return {
      success: false,
      message: 'Invalid credentials',
      token: '',
      user: {
        id: '',
        username: '',
        name: '',
        email: '',
        role: ''
      }
    };
  }
}; 