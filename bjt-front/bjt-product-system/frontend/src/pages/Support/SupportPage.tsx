import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, Row, Col, Typography, Button, Space, Divider } from 'antd';
import { 
  FileTextOutlined, 
  QuestionCircleOutlined, 
  CustomerServiceOutlined,
  DownloadOutlined,
  RightOutlined
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import './SupportPage.css';

const { Title, Text, Paragraph } = Typography;

const SupportPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useTranslation(['common']);
  const type = searchParams.get('type');

  useEffect(() => {
    if (type === 'download') {
      window.open('https://www.lockedair.com/document-download/', '_blank');
      // 回到支持主页，避免停留在中转页
      navigate(-1);
    }
    if (type === 'faq') {
      window.open('https://www.lockedair.com/faq/', '_blank');
      navigate(-1);
    }
  }, [type, navigate]);

  // 如果因旧链接进入 ?type=download，会在 useEffect 中处理并跳转，渲染正常页面

  // 默认支持页面内容
  return (
    <div className="support-page">
      <div className="support-container">
        <Title level={2} className="support-title">
          客户支持
        </Title>
        
        <Row gutter={[24, 24]}>
          {/* 文档下载 */}
          <Col xs={24} md={8}>
            <Card 
              className="support-card"
              hoverable
              onClick={() => window.open('https://www.lockedair.com/document-download/', '_blank')}
            >
              <div className="support-card-content">
                <FileTextOutlined className="support-icon" />
                <Title level={4}>文档下载</Title>
                <Paragraph>
                  下载产品手册、技术文档、安装指南等相关资料
                </Paragraph>
                <Button type="primary" icon={<DownloadOutlined />}>
                  访问下载页面
                </Button>
              </div>
            </Card>
          </Col>

          {/* 售后服务 */}
          <Col xs={24} md={8}>
            <Card 
              className="support-card"
              hoverable
              onClick={() => navigate('/rma')}
            >
              <div className="support-card-content">
                <CustomerServiceOutlined className="support-icon" />
                <Title level={4}>售后服务</Title>
                <Paragraph>
                  提交售后服务申请，跟踪服务进度，获取技术支持
                </Paragraph>
                <Button type="primary" icon={<CustomerServiceOutlined />}>
                  申请售后服务
                </Button>
              </div>
            </Card>
          </Col>

          {/* 常见问题 */}
          <Col xs={24} md={8}>
            <Card 
              className="support-card" 
              hoverable 
              onClick={() => window.open('https://www.lockedair.com/faq/', '_blank')}
            >
              <div className="support-card-content">
                <QuestionCircleOutlined className="support-icon" />
                <Title level={4}>常见问题</Title>
                <Paragraph>
                  查看常见问题解答，快速解决使用中遇到的问题
                </Paragraph>
                <Button type="primary" icon={<QuestionCircleOutlined />}> 
                  查看FAQ
                </Button>
              </div>
            </Card>
          </Col>
        </Row>

        <Divider />

        {/* 联系信息 */}
        <Card className="contact-info-card">
          <Title level={4}>联系我们</Title>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Space direction="vertical">
                <Text strong>技术支持热线：</Text>
                <Text>+86(0)571 8616 9196</Text>
                <Text strong>邮箱：</Text>
                <Text>info@lockedair.com</Text>
              </Space>
            </Col>
            <Col xs={24} md={12}>
              <Space direction="vertical">
                <Text strong>工作时间：</Text>
                <Text>周一至周五 9:00-18:00</Text>
                <Text strong>响应时间：</Text>
                <Text>24小时内回复</Text>
              </Space>
            </Col>
          </Row>
        </Card>
      </div>
    </div>
  );
};

export default SupportPage; 