import React, { useState } from 'react';
import { Input, Button, Space, Modal, Form, message } from 'antd';
import { EditOutlined, LinkOutlined } from '@ant-design/icons';
import MultilingualInput, { MultilingualValue } from './MultilingualInput';

interface SubItemLinkInputProps {
  value?: {
    zh: string;
    en: string;
    link?: string;
  };
  onChange?: (value: {
    zh: string;
    en: string;
    link?: string;
  }) => void;
  placeholder?: {
    zh: string;
    en: string;
  };
  disabled?: boolean;
}

const SubItemLinkInput: React.FC<SubItemLinkInputProps> = ({
  value = { zh: '', en: '', link: '' },
  onChange,
  placeholder = { zh: '请输入中文名称', en: 'Please enter English name' },
  disabled = false
}) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();

  const handleOpenModal = () => {
    form.setFieldsValue({
      name: {
        zh: value.zh,
        en: value.en
      },
      link: value.link || ''
    });
    setIsModalVisible(true);
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      const newValue = {
        zh: values.name.zh,
        en: values.name.en,
        link: values.link
      };
      
      onChange?.(newValue);
      setIsModalVisible(false);
      message.success('子项设置已保存');
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
  };

  const displayText = value.zh || value.en || '未设置';
  const hasLink = value.link && value.link.trim() !== '';

  return (
    <>
      <Input.Group compact style={{ width: '100%', display: 'flex' }}>
        <Input
          value={displayText}
          readOnly
          style={{ flex: 1 }}
          placeholder="点击编辑按钮设置子项"
          disabled={disabled}
        />
        <Button
          type="primary"
          icon={<EditOutlined />}
          onClick={handleOpenModal}
          disabled={disabled}
          style={{ 
            backgroundColor: hasLink ? '#52c41a' : '#1890ff',
            borderColor: hasLink ? '#52c41a' : '#1890ff'
          }}
        >
          {hasLink ? '编辑' : '设置'}
        </Button>
      </Input.Group>

      <Modal
        title="编辑子项设置"
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        width={600}
        okText="保存"
        cancelText="取消"
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            name: { zh: '', en: '' },
            link: ''
          }}
        >
          <Form.Item
            label="子项名称"
            name="name"
            rules={[
              {
                validator: (_, value) => {
                  if (!value?.zh || !value?.en) {
                    return Promise.reject('请输入中英文子项名称');
                  }
                  return Promise.resolve();
                }
              }
            ]}
          >
            <MultilingualInput
              type="input"
              placeholder={placeholder}
              required
            />
          </Form.Item>

          <Form.Item
            label="编辑链接"
            name="link"
            rules={[
              { required: true, message: '请输入编辑链接' },
              { 
                type: 'url', 
                message: '请输入有效的URL地址（支持http://、https://或相对路径）' 
              },
              {
                validator: (_, value) => {
                  if (!value) return Promise.resolve();
                  
                  // 支持的URL格式：
                  // 1. 完整URL: https://example.com/path
                  // 2. 完整URL: http://example.com/path  
                  // 3. 相对路径: /path/to/page
                  // 4. 相对路径: ./path/to/page
                  // 5. 相对路径: ../path/to/page
                  const urlPattern = /^(https?:\/\/[^\s]+|\/[^\s]*|\.\.?\/[^\s]*)$/;
                  
                  if (!urlPattern.test(value)) {
                    return Promise.reject('请输入有效的URL（如：https://example.com 或 /admin/page）');
                  }
                  
                  return Promise.resolve();
                }
              }
            ]}
            extra={
              <div>
                <div>支持的链接格式：</div>
                <div>• 完整URL：https://example.com/edit</div>
                <div>• 相对路径：/admin/products/edit</div>
                <div>• 点击子项时将跳转到此链接进行编辑</div>
              </div>
            }
          >
            <Input
              placeholder="https://example.com/edit 或 /admin/products/edit"
              prefix={<LinkOutlined />}
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default SubItemLinkInput; 