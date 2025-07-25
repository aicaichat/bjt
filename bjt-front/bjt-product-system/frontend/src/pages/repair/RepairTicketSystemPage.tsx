import React from 'react';
import { Card, Typography, Space } from 'antd';
import { ToolOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import RepairTicketForm from '../../components/Repair/RepairTicketForm';

const { Title, Paragraph } = Typography;

const RepairTicketSystemPage: React.FC = () => {
  const { t } = useTranslation('repair');
  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <div style={{ marginBottom: '24px' }}>
          <Typography.Title level={2}>
            <Space>
              <ToolOutlined style={{ color: '#1890ff' }} />
              <span>{t('pageTitle')}</span>
            </Space>
          </Typography.Title>
          <Typography.Paragraph>{t('pageDescription')}</Typography.Paragraph>
        </div>

        <RepairTicketForm 
          showSteps={false}
          onSuccess={() => {
            // 可以在这里添加提交成功后的处理逻辑
            console.log('工单提交成功');
          }}
        />
      </Card>
    </div>
  );
};

export default RepairTicketSystemPage; 