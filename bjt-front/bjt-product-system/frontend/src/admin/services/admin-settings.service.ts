import { BaseAdminService } from './base-admin.service';
import HttpAdminService from '../api/httpAdminService';

export interface SystemSettings {
  // 基础信息
  company_name: string;
  contact_info: string;
  logo_url: string;
  
  // 系统设置
  default_language: 'zh' | 'en';
  theme: string;
  timezone: string;
  date_format: string;
  
  // 邮件设置
  smtp_host: string;
  smtp_port: number;
  smtp_username: string;
  smtp_password: string;
  smtp_encryption: 'none' | 'ssl' | 'tls';
  mail_from_address: string;
  mail_from_name: string;
  
  // API设置
  payment_api: string;
  logistics_api: string;
  inventory_api: string;
  
  // 安全设置
  session_timeout: number;
  password_policy: {
    min_length: number;
    require_uppercase: boolean;
    require_lowercase: boolean;
    require_numbers: boolean;
    require_symbols: boolean;
  };
  login_attempts: number;
  lockout_duration: number;
}

class AdminSettingsService extends BaseAdminService<SystemSettings> {
  constructor() {
    super('settings');
  }

  /**
   * 获取系统设置
   */
  async getSettings(): Promise<{ data: SystemSettings }> {
    const response = await HttpAdminService.get<SystemSettings>('settings');
    
    if (!response.success) {
      throw new Error(response.message || '获取设置失败');
    }
    
    return { data: response.data };
  }

  /**
   * 更新系统设置
   */
  async updateSettings(data: Partial<SystemSettings>): Promise<{ data: SystemSettings }> {
    const response = await HttpAdminService.put<SystemSettings>('settings', data);
    
    if (!response.success) {
      throw new Error(response.message || '更新设置失败');
    }
    
    return { data: response.data };
  }

  /**
   * 测试邮件设置
   */
  async testEmailSettings(): Promise<{ data: { message: string } }> {
    const response = await HttpAdminService.post<{ message: string }>('settings/test-email');
    
    if (!response.success) {
      throw new Error(response.message || '邮件测试失败');
    }
    
    return { data: response.data };
  }

  /**
   * 重置为默认设置
   */
  async resetToDefault(): Promise<{ data: SystemSettings }> {
    const response = await HttpAdminService.post<SystemSettings>('settings/reset');
    
    if (!response.success) {
      throw new Error(response.message || '重置设置失败');
    }
    
    return { data: response.data };
  }

  /**
   * 备份设置
   */
  async backupSettings(): Promise<Blob> {
    const response = await HttpAdminService.get<any>('settings/backup');
    
    if (!response.success) {
      throw new Error(response.message || '备份失败');
    }
    
    // 返回设置数据的JSON blob
    return new Blob([JSON.stringify(response.data)], { type: 'application/json' });
  }

  /**
   * 恢复设置
   */
  async restoreSettings(file: File): Promise<{ data: { message: string } }> {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await HttpAdminService.post<{ message: string }>('settings/restore', formData);
    
    if (!response.success) {
      throw new Error(response.message || '恢复设置失败');
    }
    
    return { data: response.data };
  }
}

const adminSettingsService = new AdminSettingsService();
export default adminSettingsService; 