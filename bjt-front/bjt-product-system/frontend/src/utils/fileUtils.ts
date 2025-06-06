/**
 * 文件上传和URL处理工具函数
 */

/**
 * 清理文件URL，移除多余的路径前缀
 * @param url 原始URL
 * @returns 清理后的URL
 */
export const cleanFileUrl = (url: string): string => {
  if (!url) return '';
  
  // 移除多余的 frontend/public 前缀
  let cleanedUrl = url.replace('/frontend/public/', '/');
  
  // 确保以 / 开头
  if (!cleanedUrl.startsWith('/') && !cleanedUrl.startsWith('http')) {
    cleanedUrl = '/' + cleanedUrl;
  }
  
  return cleanedUrl;
};

/**
 * 获取完整的图片URL
 * @param relativePath 相对路径
 * @returns 完整的URL
 */
export const getFullImageUrl = (relativePath: string): string => {
  if (!relativePath) return '';
  
  // 如果已经是完整URL，直接返回
  if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) {
    return relativePath;
  }
  
  // 清理路径
  const cleanPath = cleanFileUrl(relativePath);
  
  // 构建完整URL
  return `${window.location.origin}${cleanPath}`;
};

/**
 * 检查文件类型
 * @param filename 文件名
 * @returns 文件类型
 */
export const getFileType = (filename: string): 'image' | 'pdf' | 'document' | 'unknown' => {
  if (!filename) return 'unknown';
  
  const extension = filename.split('.').pop()?.toLowerCase();
  
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '')) {
    return 'image';
  }
  
  if (extension === 'pdf') {
    return 'pdf';
  }
  
  if (['doc', 'docx', 'txt', 'xls', 'xlsx'].includes(extension || '')) {
    return 'document';
  }
  
  return 'unknown';
};

/**
 * 格式化文件大小
 * @param bytes 字节数
 * @returns 格式化后的文件大小
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * 验证文件类型
 * @param file 文件对象
 * @param allowedTypes 允许的文件类型
 * @returns 是否有效
 */
export const validateFileType = (file: File, allowedTypes: string[]): boolean => {
  const extension = file.name.split('.').pop()?.toLowerCase();
  return allowedTypes.includes(extension || '');
};

/**
 * 验证文件大小
 * @param file 文件对象
 * @param maxSizeMB 最大大小（MB）
 * @returns 是否有效
 */
export const validateFileSize = (file: File, maxSizeMB: number): boolean => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
};

/**
 * 生成文件预览URL
 * @param file 文件对象
 * @returns 预览URL
 */
export const generatePreviewUrl = (file: File): string => {
  return URL.createObjectURL(file);
};

/**
 * 清理预览URL
 * @param url 预览URL
 */
export const revokePreviewUrl = (url: string): void => {
  URL.revokeObjectURL(url);
};

/**
 * 检查URL是否可访问
 * @param url 要检查的URL
 * @returns Promise<boolean> 是否可访问
 */
export const checkUrlAccessible = async (url: string): Promise<boolean> => {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    console.warn('URL accessibility check failed:', url, error);
    return false;
  }
};

/**
 * 获取默认的占位符图片
 * @param type 类型
 * @returns 占位符图片URL
 */
export const getPlaceholderImage = (type: 'machine' | 'part' | 'accessory' | 'spare-part' = 'machine'): string => {
  // 这里可以根据类型返回不同的占位符图片
  return `data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTI4IiBoZWlnaHQ9IjEyOCIgdmlld0JveD0iMCAwIDEyOCAxMjgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMjgiIGhlaWdodD0iMTI4IiBmaWxsPSIjRjVGNUY1Ii8+CjxyZWN0IHg9IjMyIiB5PSIzMiIgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBzdHJva2U9IiM5N0EzQjMiIHN0cm9rZS13aWR0aD0iMiIvPgo8L3N2Zz4K`;
}; 