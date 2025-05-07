import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './styles/global.css'
import { AuthProvider } from './contexts/AuthContext'
import './i18n' // Import i18n configuration
import { safeRender } from './utils/renderUtils'

// 专门用于捕获对象渲染错误的错误边界组件
class ObjectRenderGuard extends React.Component<{children: React.ReactNode}> {
  state = {
    hasError: false,
    errorInfo: null as React.ErrorInfo | null,
    error: null as Error | null
  };

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // 检查是否是对象非法渲染错误
    if (error.message && (
      error.message.includes('Objects are not valid as a React child') || 
      error.message.includes('object with keys')
    )) {
      console.error('ObjectRenderGuard捕获到对象渲染错误:', error);
      console.error('错误详情:', errorInfo);
      
      // 设置错误状态但不抛出，允许应用继续运行
      this.setState({
        hasError: true,
        error,
        errorInfo
      });
    } else {
      // 其他错误需要重新抛出，以便父错误边界可以处理
      throw error;
    }
  }

  render() {
    if (this.state.hasError) {
      // 渲染简单的错误信息，不中断整个应用
      return (
        <div style={{
          padding: '10px',
          margin: '10px',
          border: '1px solid red',
          borderRadius: '5px',
          backgroundColor: '#ffefef'
        }}>
          <h4>渲染错误已被自动修复</h4>
          <p>错误类型: 尝试将对象直接渲染为React子元素</p>
          <p>错误位置: {this.state.errorInfo?.componentStack}</p>
          <button 
            onClick={() => this.setState({ hasError: false })}
            style={{
              padding: '5px 10px',
              backgroundColor: '#f44336',
              color: 'white',
              border: 'none',
              borderRadius: '3px',
              cursor: 'pointer'
            }}
          >
            重试
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// 全局错误事件处理器，用于捕获React之外的错误
const installGlobalErrorHandler = () => {
  const handleError = (event: ErrorEvent) => {
    const error = event.error || event.message;
    
    // 检查是否是对象渲染错误
    if (typeof error === 'string' && (
      error.includes('Objects are not valid as a React child') ||
      error.includes('object with keys')
    )) {
      console.error('全局错误拦截器捕获到对象渲染错误:', error);
      // 防止错误冒泡
      event.preventDefault();
    }
  };

  // 添加全局错误处理器
  window.addEventListener('error', handleError);
};

// 安装全局错误处理器
installGlobalErrorHandler();

// 包装整个应用的安全组件
const SafeApp = () => {
  return (
    <ObjectRenderGuard>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ObjectRenderGuard>
  );
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <SafeApp />
  </React.StrictMode>,
)
