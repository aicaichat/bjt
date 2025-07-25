import React, { useState } from 'react';
import { Card, Form, Input, Button, message, Select, Radio } from 'antd';
import { useTranslation } from 'react-i18next';
import CountrySelect from '../../components/common/CountrySelect';
import { register, RegisterPayload } from '../../services/registrationService';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const RegisterPage: React.FC = () => {
  const { t } = useTranslation('register');
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  if (user) {
    navigate('/');
  }

  const onFinish = async (values: any) => {
    if (values.password !== values.confirm) {
      message.error(t('passwordMismatch'));
      return;
    }
    setSubmitting(true);
    try {
      await register({
        first_name: values.first_name,
        last_name: values.last_name,
        email: values.email,
        password: values.password,
        role: values.role,
        country: values.country,
        preferred_unit: values.preferred_unit,
      } as RegisterPayload);
      message.success(t('submittedSuccess'));
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err: any) {
      message.error(err?.message || t('registerFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex justify-center mt-10">
      <Card title={t('createAccount')} style={{ width: 480 }}>
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item name="first_name" label={t('firstName')} rules={[{ required: true }]}> <Input /> </Form.Item>
          <Form.Item name="last_name" label={t('lastName')} rules={[{ required: true }]}> <Input /> </Form.Item>
          <Form.Item name="email" label={t('email')} rules={[{ required: true, type: 'email' }]}> <Input /> </Form.Item>
          <Form.Item name="password" label={t('password')} rules={[{ required: true, min: 8 }]}> <Input.Password /> </Form.Item>
          <Form.Item name="confirm" label={t('confirmPassword')} dependencies={["password"]} rules={[{ required: true }]}> <Input.Password /> </Form.Item>
          <Form.Item name="role" label={t('role')} rules={[{ required: true }]}> 
            <Select placeholder={t('rolePlaceholder', 'Select role')}>
              <Select.Option value="customer">{t('roles.customer')}</Select.Option>
              <Select.Option value="dealer">{t('roles.dealer')}</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="country" label={t('country')} rules={[{ required: true }]}> 
            <CountrySelect placeholder={t('countryPlaceholder')} />
          </Form.Item>
          <Form.Item name="preferred_unit" label={t('unitSystem')} initialValue="metric"> 
            <Radio.Group>
               <Radio value="metric">{t('unit.metric')}</Radio>
               <Radio value="imperial">{t('unit.imperial')}</Radio>
            </Radio.Group>
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={submitting} block>
              {t('register')}
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default RegisterPage; 