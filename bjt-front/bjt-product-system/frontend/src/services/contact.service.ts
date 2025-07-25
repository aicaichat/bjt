import apiService from './apiService';

export interface ContactFormData {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  content: string;
}

export interface ContactResponse {
  success: boolean;
  message: string;
}

class ContactService {
  private baseURL = '/contact';

  /**
   * 提交联系表单
   */
  async submitContactForm(data: ContactFormData): Promise<ContactResponse> {
    try {
      const response = await apiService.post<any>(`${this.baseURL}/submit`, data);
      return {
        success: true,
        message: 'Your message has been sent successfully!'
      };
    } catch (error) {
      console.error('Failed to submit contact form:', error);
      return {
        success: false,
        message: 'Failed to send message. Please try again.'
      };
    }
  }

  /**
   * 获取联系信息
   */
  async getContactInfo(): Promise<any> {
    try {
      const response = await apiService.get<any>(`${this.baseURL}/info`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch contact info:', error);
      return null;
    }
  }
}

export const contactService = new ContactService(); 