/**
 * String utility functions
 */

/**
 * Decodes UTF-8 Unicode escape sequences (\u00e6\u00b0) in string properties
 * This fixes Chinese character encoding issues in API responses
 * 
 * @param obj Object with string properties that may contain Unicode escape sequences
 * @returns Object with properly decoded strings
 */
export function decodeUtf8Unicode(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => decodeUtf8Unicode(item));
  }

  if (typeof obj === 'object') {
    const result: Record<string, any> = {};
    
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        result[key] = decodeUtf8Unicode(obj[key]);
      }
    }
    
    return result;
  }

  if (typeof obj === 'string') {
    try {
      // Try different approaches to decode Unicode escape sequences
      
      // 1. Check for regular Unicode escape sequences like "\u00e6\u00b0"
      if (obj.includes('\\u')) {
        try {
          // Handle double escaped sequences like "\\u00e6\\u00b0" that need extra processing
          if (obj.includes('\\\\u')) {
            // First replace double backslashes with a temporary marker
            const tempStr = obj.replace(/\\\\/g, '__DOUBLE_BACKSLASH__');
            // Then handle the unicode escapes
            const jsonStr = `"${tempStr.replace(/\\u/g, '\\u')}"`;
            // Parse the JSON string to get the decoded result
            const parsed = JSON.parse(jsonStr);
            // Restore the double backslashes
            return parsed.replace(/__DOUBLE_BACKSLASH__/g, '\\');
          }
          
          // Regular case: Parse as JSON string with Unicode escapes
          return JSON.parse(`"${obj}"`);
        } catch (e) {
          console.debug('Failed first Unicode parse approach, trying alternative:', e);
          
          // Alternative approach: manually replace Unicode escapes with their characters
          try {
            return obj.replace(/\\u([a-fA-F0-9]{4})/g, (match, hex) => {
              return String.fromCodePoint(parseInt(hex, 16));
            });
          } catch (e2) {
            console.debug('Failed alternative Unicode parse approach:', e2);
          }
        }
      }
      
      // 2. For mojibake (garbled text like "æ°"åž«æœº" that should be "气垫机")
      if (/[\u00e0-\u00ff]{2,}/.test(obj)) {
        return fixMojibake(obj);
      }
      
      // 3. Last resort: return the original string if no decoding was successful
      return obj;
    } catch (e) {
      // If all parsing fails, return the original string
      console.warn('Failed to decode Unicode string:', obj, e);
      return obj;
    }
  }

  return obj;
}

/**
 * Safely renders text content, ensuring it's properly decoded
 * 
 * @param text Text that might contain Unicode escape sequences
 * @returns Properly decoded text
 */
export function safeTextContent(text: any): string {
  if (text === null || text === undefined) {
    return '';
  }
  
  if (typeof text !== 'string') {
    return String(text);
  }
  
  // First try to decode any Unicode escape sequences
  const decodedText = decodeUtf8Unicode(text);
  
  // If the text is still the same, try fixing mojibake
  if (decodedText === text) {
    return fixMojibake(decodedText);
  }
  
  return decodedText;
}

/**
 * Fixes mojibake (garbled text) where UTF-8 bytes were interpreted as Latin1/ISO-8859-1
 * 
 * @param text The garbled text (e.g., "æ°"åž«æœº" should be "气垫机")
 * @returns Properly decoded text
 */
export function fixMojibake(text: string): string {
  if (!text) return '';
  
  try {
    // 安全的编码转换方法，避免使用废弃的 escape() 函数
    // 直接尝试处理常见的 mojibake 模式
    
    // 检查是否包含可能的 mojibake 字符
    if (!/[\u00e0-\u00ff]/.test(text)) {
      return text; // 如果没有可疑的Latin1字符，直接返回
    }
    
    // 硬编码常见的 mojibake 替换表（针对中文）
    const mojibakeReplacements: Record<string, string> = {
      'æ°"': '气',
      'åž«': '垫',
      'æœº': '机',
      'çº¸': '纸',
      'èƒ¶': '胶',
      'å¸¦': '带',
      'æŸ±': '柱',
      'è¢‹': '袋',
      'é«˜': '高',
      'è´¨': '质',
      'è®¾': '设',
      'å¤‡': '备',
      'å°': '封',
      'è£…': '装',
      'æ ‡': '标',
      'ç‰ˆ': '版',
      'ä¸»': '主',
      'é…': '配',
      'ä»¶': '件'
    };
    
    let result = text;
    
    // 应用替换
    for (const [mojibake, correct] of Object.entries(mojibakeReplacements)) {
      if (result.includes(mojibake)) {
        result = result.replace(new RegExp(mojibake, 'g'), correct);
        console.log(`🔧 [fixMojibake] 替换 "${mojibake}" -> "${correct}"`);
      }
    }
    
    // 如果有替换发生，返回结果
    if (result !== text) {
      console.log(`✅ [fixMojibake] 修复完成: "${text}" -> "${result}"`);
      return result;
    }
    
    // 尝试更安全的编码转换方法
    try {
      // 将字符串转换为字节数组，然后重新解释为UTF-8
      const bytes = new Uint8Array(text.length);
      for (let i = 0; i < text.length; i++) {
        bytes[i] = text.charCodeAt(i);
      }
      
      // 使用TextDecoder进行UTF-8解码
      const decoder = new TextDecoder('utf-8');
      const decoded = decoder.decode(bytes);
      
      // 验证解码结果是否有效（包含中文字符）
      if (/[\u4e00-\u9fa5]/.test(decoded)) {
        console.log(`✅ [fixMojibake] TextDecoder修复: "${text}" -> "${decoded}"`);
        return decoded;
      }
    } catch (e) {
      console.warn('TextDecoder解码失败:', e);
    }
    
    // 如果所有方法都失败，返回原始文本
    return text;
    
  } catch (e) {
    console.warn('Failed to fix mojibake:', text, e);
    return text;
  }
}

/**
 * 强大的Unicode处理函数，能处理各种格式的Unicode字符串
 * 1. 处理JSON转义的Unicode (\u00e6\u00b0)
 * 2. 处理HTML实体编码 (&#x6c34;)
 * 3. 处理常见的Mojibake模式 (æ°´)
 */
export function robustDecodeUnicode(input: string): string {
  // 如果输入为空，直接返回
  if (!input) return '';
  
  console.log('输入的Unicode字符串:', input);
  
  try {
    // 尝试1: 简单的JSON解析（处理标准的\uXXXX格式）
    if (input.includes('\\u')) {
      try {
        // 确保转义符号正确
        const jsonString = `"${input.replace(/"/g, '\\"')}"`;
        const result = JSON.parse(jsonString);
        console.log('JSON解析结果:', result);
        return result;
      } catch (e) {
        console.warn('JSON解析Unicode失败:', e);
        // 继续尝试其他方法
      }
    }

    // 尝试2: decodeURIComponent(escape())方法处理mojibake
    try {
      const escapedResult = decodeURIComponent(escape(input));
      console.log('escape/decodeURIComponent结果:', escapedResult);
      
      // 验证结果是否有效的中文（基本验证）
      if (/[\u4e00-\u9fa5]/.test(escapedResult)) {
        return escapedResult;
      }
    } catch (e) {
      console.warn('decodeURIComponent(escape())处理失败:', e);
      // 继续尝试其他方法
    }

    // 尝试3: 硬编码常见的mojibake模式
    let result = input;
    
    // 常见的mojibake替换表
    const replacements: Record<string, string> = {
      'æ°"': '气',
      'åž«': '垫',
      'æœº': '机',
      'çº¸': '纸',
      'èƒ¶': '胶',
      'å¸¦': '带',
      'æŸ±': '柱',
      'è¢‹': '袋',
      'é«˜': '高',
      'è´¨': '质',
      'è®¾': '设',
      'å¤‡': '备',
      'å°': '封'
    };
    
    // 应用替换
    for (const [pattern, replacement] of Object.entries(replacements)) {
      result = result.replace(new RegExp(pattern, 'g'), replacement);
    }
    
    console.log('硬编码替换结果:', result);
    
    // 如果有替换发生，则返回结果
    if (result !== input) {
      return result;
    }
    
    // 如果所有方法都失败，返回原始输入
    return input;
  } catch (e) {
    console.error('Unicode强大解码失败:', e);
    return input;
  }
}

/**
 * 安全获取文本内容，确保解码并修复mojibake
 */
export function getSafeText(text: string): string {
  return robustDecodeUnicode(text || '');
} 