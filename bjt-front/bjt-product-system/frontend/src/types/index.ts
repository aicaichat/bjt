// API响应类型
export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
}

// 分页响应类型
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// 用户类型
export interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'user';
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

// 产品线类型
export interface ProductLine {
  id: string;
  name: string;
  code: string;
  description?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

// 主机型号类型
export interface HostModel {
  id: string;
  name: string;
  code: string;
  productLineId: string;
  description?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

// 零件类型
export interface Part {
  id: string;
  name: string;
  code: string;
  type: 'standard' | 'custom';
  description?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
} 