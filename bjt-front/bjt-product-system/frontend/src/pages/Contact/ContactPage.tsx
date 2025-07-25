import React, { useState } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Typography, 
  Form, 
  Input, 
  Button, 
  message,
  Space,
  Divider
} from 'antd';
import { 
  MailOutlined, 
  PhoneOutlined, 
  EnvironmentOutlined,
  GlobalOutlined,
  LinkOutlined,
  VideoCameraOutlined
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { contactService, ContactFormData } from '../../services/contact.service';
import './ContactPage.css';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const ContactPage: React.FC = () => {
  const { t } = useTranslation('contact'); // 只使用contact命名空间
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values: ContactFormData) => {
    setLoading(true);
    try {
      const response = await contactService.submitContactForm(values);
      if (response.success) {
        message.success(t('contact.form.submitSuccess'));
        form.resetFields();
      } else {
        message.error(t('contact.form.submitError'));
      }
    } catch (error) {
      message.error(t('contact.form.submitError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="contact-page">
      <div className="contact-container">
        <Row gutter={[32, 32]}>
          {/* 左侧 - 联系信息 */}
          <Col xs={24} lg={10}>
            <Card className="contact-info-card">
              <Title level={2} className="contact-title">
                {t('contact.title')}
              </Title>
              
              {/* 基本联系信息 */}
              <Space direction="vertical" size="middle" className="contact-basic-info">
                <div className="contact-item">
                  <MailOutlined className="contact-icon" />
                  <Text>{t('contact.info.email')}</Text>
                </div>
                <div className="contact-item">
                  <PhoneOutlined className="contact-icon" />
                  <Text>{t('contact.info.phone')}</Text>
                </div>
              </Space>

              {/* 社交媒体图标 */}
              <div className="social-icons">
                <GlobalOutlined className="social-icon" />
                <MailOutlined className="social-icon" />
                <LinkOutlined className="social-icon" />
                <VideoCameraOutlined className="social-icon" />
              </div>

              <Divider />

              {/* 全球办公室 */}
              <div className="offices-section">
                <Row gutter={[16, 16]}>
                  <Col span={12}>
                    <div className="office-item">
                      <Title level={4}>{t('contact.offices.australia.title')}</Title>
                      <div className="office-content">
                        <Text strong>{t('contact.offices.australia.company')}</Text><br />
                        {t('contact.offices.australia.address')}<br />
                        <PhoneOutlined /> {t('contact.offices.australia.phone')}
                      </div>
                    </div>
                  </Col>
                  
                  <Col span={12}>
                    <div className="office-item">
                      <Title level={4}>{t('contact.offices.usa.title')}</Title>
                      <div className="office-content">
                        <Text strong>{t('contact.offices.usa.company')}</Text><br />
                        {t('contact.offices.usa.address')}<br />
                        <PhoneOutlined /> {t('contact.offices.usa.phone')}
                      </div>
                    </div>
                  </Col>
                  
                  <Col span={12}>
                    <div className="office-item">
                      <Title level={4}>{t('contact.offices.germany.title')}</Title>
                      <div className="office-content">
                        <Text strong>{t('contact.offices.germany.company')}</Text><br />
                        {t('contact.offices.germany.address')}<br />
                        <PhoneOutlined /> {t('contact.offices.germany.phone')}
                      </div>
                    </div>
                  </Col>
                  
                  <Col span={12}>
                    <div className="office-item">
                      <Title level={4}>{t('contact.offices.japan.title')}</Title>
                      <div className="office-content">
                        <Text strong>{t('contact.offices.japan.company')}</Text><br />
                        {t('contact.offices.japan.address')}<br />
                        <PhoneOutlined /> {t('contact.offices.japan.phone')}
                      </div>
                    </div>
                  </Col>
                </Row>
              </div>
            </Card>
          </Col>

          {/* 右侧 - 留言表单 */}
          <Col xs={24} lg={14}>
            <Card className="contact-form-card">
              <Title level={3} className="form-title">
                {t('contact.leaveMessage')}
              </Title>
              
              <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
                className="contact-form"
              >
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      name="name"
                      rules={[{ required: true, message: t('contact.form.nameRequired') }]}
                    >
                      <Input
                        placeholder={t('contact.form.name')}
                        size="large"
                        className="form-input"
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name="email"
                      rules={[
                        { required: true, message: t('contact.form.emailRequired') },
                        { type: 'email', message: t('contact.form.emailInvalid') }
                      ]}
                    >
                      <Input
                        placeholder={t('contact.form.email')}
                        size="large"
                        className="form-input"
                      />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item name="phone">
                      <Input
                        placeholder={t('contact.form.phone')}
                        size="large"
                        className="form-input"
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="company">
                      <Input
                        placeholder={t('contact.form.company')}
                        size="large"
                        className="form-input"
                      />
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item
                  name="content"
                  rules={[{ required: true, message: t('contact.form.contentRequired') }]}
                >
                  <TextArea
                    placeholder={t('contact.form.content')}
                    rows={6}
                    className="form-textarea"
                  />
                </Form.Item>

                <Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading}
                    size="large"
                    className="submit-button"
                  >
                    {t('contact.form.submit')}
                  </Button>
                </Form.Item>
              </Form>
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default ContactPage; 