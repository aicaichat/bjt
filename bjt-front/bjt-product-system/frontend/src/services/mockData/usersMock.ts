// 扩展用户接口，添加密码字段用于mock认证
interface MockUser {
  id: string;
  username: string;
  name: string;
  email: string;
  role: 'admin' | 'sales' | 'partner' | 'customer';
  password: string;
}

// 用户模拟数据 - 对应SQL文件中的测试用户
export const mockUsers: MockUser[] = [
  // 管理员用户
  {
    id: 'usr-001',
    username: 'admin',
    name: '系统管理员',
    email: 'admin@bjt.com',
    role: 'admin',
    password: 'password123'
  },
  // 销售用户
  {
    id: 'usr-002',
    username: 'sales_user',
    name: '销售代表',
    email: 'sales@bjt.com',
    role: 'sales',
    password: 'password123'
  },
  // 合作伙伴用户
  {
    id: 'usr-003',
    username: 'partner_user',
    name: '合作伙伴',
    email: 'partner@bjt.com',
    role: 'partner',
    password: 'password123'
  },
  // 客户用户
  {
    id: 'usr-004',
    username: 'customer_user',
    name: '客户用户',
    email: 'customer@bjt.com',
    role: 'customer',
    password: 'password123'
  },
  // 测试用户（英制单位）
  {
    id: 'usr-005',
    username: 'test_imperial',
    name: '英制测试用户',
    email: 'test.imperial@bjt.com',
    role: 'customer',
    password: 'password123'
  },
  // 销售经理
  {
    id: 'usr-006',
    username: 'sales_manager',
    name: '销售经理',
    email: 'sales.manager@bjt.com',
    role: 'sales',
    password: 'password123'
  },
  // 技术支持
  {
    id: 'usr-007',
    username: 'tech_support',
    name: '技术支持',
    email: 'tech.support@bjt.com',
    role: 'customer',
    password: 'password123'
  },
  // 代理商
  {
    id: 'usr-008',
    username: 'agent_user',
    name: '代理商',
    email: 'agent@bjt.com',
    role: 'partner',
    password: 'password123'
  },
  // 区域客户
  {
    id: 'usr-009',
    username: 'regional_customer',
    name: '区域客户',
    email: 'regional.customer@bjt.com',
    role: 'customer',
    password: 'password123'
  },
  // 企业客户
  {
    id: 'usr-010',
    username: 'enterprise_client',
    name: '企业客户',
    email: 'enterprise@bjt.com',
    role: 'customer',
    password: 'password123'
  }
]; 