import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Alert, Button, Typography, Space, Divider } from 'antd';
import { safeRender } from '../utils/renderUtils';

const { Title, Paragraph, Text } = Typography;

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * 错误边界组件 - 捕获React渲染时的错误
 * 特别处理对象作为React children的错误
 */
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // 检测是否是对象作为React children的错误
    const isObjectAsChildError = 
      error.message.includes("Objects are not valid as a React child") ||
      error.message.includes("Object is not valid as React child");
    
    if (isObjectAsChildError) {
      console.warn("检测到对象被直接用作React子元素，请检查渲染的数据类型", error);
    }
    
    // 更新状态以展示错误UI
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // 记录错误
    console.error('ErrorBoundary捕获到错误:', error, errorInfo);
    
    // 如果是对象渲染错误，提供更具体的调试信息
    if (error.message.includes("Objects are not valid as a React child")) {
      console.warn("渲染对象错误的可能位置:", errorInfo.componentStack);
      console.warn("请确保所有渲染的值都是字符串、数字或有效的React元素");
    }
    
    this.setState({
      errorInfo
    });
  }

  // 分析错误类型并提供针对性的建议
  getErrorAnalysis(): string {
    const { error } = this.state;
    if (!error) return "";
    
    if (error.message.includes("Objects are not valid as a React child")) {
      return `
        检测到"对象作为React子元素"错误。这通常发生在以下情况：
        1. 直接在JSX中渲染一个JavaScript对象
        2. 在JSX中使用了未正确转换为字符串的值
        
        解决方案:
        - 使用safeRender()函数确保对象被转换为字符串
        - 在<SafeContent>组件中包装内容
        - 从渲染的数据中选择特定字段，如object.name而不是整个object
      `;
    }
    
    if (error.message.includes("Cannot read property")) {
      return "检测到属性访问错误。请确保在访问对象属性前检查对象是否存在。考虑使用可选链操作符(?.)。";
    }
    
    return "";
  }

  handleRetry = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // 自定义回退UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // 默认回退UI
      const errorAnalysis = this.getErrorAnalysis();
      const { error, errorInfo } = this.state;
      
      return (
        <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
          <Alert
            type="error"
            message="渲染错误"
            description="应用程序在尝试渲染时遇到了错误。这通常是由于数据类型问题导致的。"
            showIcon
            banner
          />
          
          <Divider />
          
          <Typography>
            <Title level={4}>错误详情</Title>
            <Paragraph>
              <Text strong>错误消息: </Text>
              <Text code>{safeRender(error?.message, '未知错误')}</Text>
            </Paragraph>
            
            {errorAnalysis && (
              <Paragraph>
                <Text strong>错误分析: </Text>
                <div style={{ 
                  background: '#fffbe6', 
                  padding: '12px', 
                  borderRadius: '4px',
                  border: '1px solid #ffe58f',
                  whiteSpace: 'pre-line'
                }}>
                  {errorAnalysis}
                </div>
              </Paragraph>
            )}
            
            {error?.stack && (
              <Paragraph>
                <Text strong>错误堆栈: </Text>
                <div style={{ 
                  maxHeight: '200px', 
                  overflow: 'auto', 
                  background: '#f5f5f5', 
                  padding: '12px',
                  borderRadius: '4px',
                  fontFamily: 'monospace',
                  fontSize: '12px',
                  whiteSpace: 'pre-wrap'
                }}>
                  {error.stack}
                </div>
              </Paragraph>
            )}
            
            {errorInfo?.componentStack && (
              <Paragraph>
                <Text strong>组件堆栈: </Text>
                <div style={{ 
                  maxHeight: '200px', 
                  overflow: 'auto', 
                  background: '#f5f5f5', 
                  padding: '12px',
                  borderRadius: '4px',
                  fontFamily: 'monospace',
                  fontSize: '12px',
                  whiteSpace: 'pre-wrap' 
                }}>
                  {errorInfo.componentStack}
                </div>
              </Paragraph>
            )}
          </Typography>
          
          <Space style={{ marginTop: '24px' }}>
            <Button 
              type="primary" 
              onClick={() => window.location.reload()}
            >
              刷新页面
            </Button>
            <Button 
              onClick={this.handleRetry}
            >
              尝试恢复
            </Button>
          </Space>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 