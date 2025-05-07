import { User } from '../api';

// 用户模拟数据
export const mockUsers: User[] = [
  {
    id: 'usr-001',
    username: 'admin',
    name: '系统管理员',
    email: 'admin@bjt-packaging.com',
    role: 'admin'
  },
  {
    id: 'usr-002',
    username: 'user',
    name: '普通用户',
    email: 'user@bjt-packaging.com',
    role: 'customer'
  },
  {
    id: 'usr-003',
    username: 'partner',
    name: '合作伙伴',
    email: 'partner@bjt-packaging.com',
    role: 'partner'
  },
  {
    id: 'usr-004',
    username: 'sales',
    name: '销售代表',
    email: 'sales@bjt-packaging.com',
    role: 'sales'
  },
  {
    id: 'usr-005',
    username: 'eurouser',
    name: 'European User',
    email: 'eu-customer@bjt-packaging.com',
    role: 'customer'
  },
  {
    id: 'usr-006',
    username: 'ususer',
    name: 'US Customer',
    email: 'northamerica-customer@bjt-packaging.com',
    role: 'customer'
  },
  {
    id: 'usr-007',
    username: 'auuser',
    name: 'Australian User',
    email: 'au-customer@bjt-packaging.com',
    role: 'customer'
  }
]; 