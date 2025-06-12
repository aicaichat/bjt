import React, { useState, useRef } from 'react';

// 默认占位符图片 - 使用内联 base64 SVG，避免 404 请求
const DEFAULT_PLACEHOLDER = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTI4IiBoZWlnaHQ9IjEyOCIgdmlld0JveD0iMCAwIDEyOCAxMjgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMjgiIGhlaWdodD0iMTI4IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik00MCA0MEw4OCA4OE00MCA4OEw4OCA0MCIgc3Ryb2tlPSIjOTdBM0IzIiBzdHJva2Utd2lkdGg9IjIiLz4KPHN2Zz4K';

export interface SafeImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'onError'> {
  src?: string | null;
  fallbackSrc?: string;
  alt: string;
  onImageError?: (error: React.SyntheticEvent<HTMLImageElement>) => void;
}

/**
 * 安全的图片组件，自动处理图片加载错误，避免无限循环请求
 */
export const SafeImage: React.FC<SafeImageProps> = ({
  src,
  fallbackSrc = DEFAULT_PLACEHOLDER,
  alt,
  onImageError,
  ...props
}) => {
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(src || fallbackSrc);
  const hasTriedFallback = useRef(false);

  const handleError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    // 避免无限循环：如果已经尝试过fallback或者当前就是base64图片，则不再重试
    if (hasTriedFallback.current || currentSrc.startsWith('data:')) {
      console.warn('SafeImage: Both original and fallback images failed to load', {
        originalSrc: src,
        fallbackSrc,
        currentSrc
      });
      setHasError(true);
      return;
    }

    console.log('SafeImage: Original image failed, using fallback', {
      originalSrc: src,
      fallbackSrc
    });

    hasTriedFallback.current = true;
    setCurrentSrc(fallbackSrc);
    
    // 调用自定义错误处理函数
    if (onImageError) {
      onImageError(e);
    }
  };

  // 如果没有有效的src且fallback也失败了，显示占位符div
  if (hasError || (!src && !fallbackSrc)) {
    return (
      <div 
        className={`bg-gray-100 flex items-center justify-center ${props.className || ''}`}
        style={props.style}
      >
        <span className="text-gray-400 text-sm">No Image</span>
      </div>
    );
  }

  return (
    <img
      {...props}
      src={currentSrc}
      alt={alt}
      onError={handleError}
      onLoad={() => {
        // 图片成功加载后重置错误状态
        setHasError(false);
      }}
    />
  );
};

export default SafeImage; 