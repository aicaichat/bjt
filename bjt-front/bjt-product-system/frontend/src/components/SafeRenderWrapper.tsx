import React, { ReactNode } from 'react';
import { SafeContent } from '../utils/renderUtils';

interface SafeRenderWrapperProps {
  children: ReactNode;
}

/**
 * 安全渲染包装器组件
 * 提供一个额外的安全层，确保内部所有内容都能安全渲染
 * 防止对象作为React子元素的错误
 */
const SafeRenderWrapper: React.FC<SafeRenderWrapperProps> = ({ children }) => {
  return (
    <React.Fragment>
      {/* 使用SafeContent处理可能的对象渲染问题 */}
      <SafeContent>
        {children}
      </SafeContent>
    </React.Fragment>
  );
};

export default SafeRenderWrapper; 