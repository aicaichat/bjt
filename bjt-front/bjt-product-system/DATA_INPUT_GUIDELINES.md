# BJT产品管理系统 - 数据输入规范指南

## 🎯 概述

本指南旨在规范数据输入，避免常见的数据质量问题，确保系统稳定运行和数据一致性。

## ⚠️ 严禁使用的字符

### 1. SQL注入风险字符
```
严禁输入：
' (单引号)
" (双引号) 
; (分号)
-- (双连字符)
/* */ (SQL注释)
\x00 (空字节)
```

### 2. 系统保留字符
```
避免使用：
\ (反斜杠) - 可能导致转义问题
` (反引号) - MySQL保留字符
| (管道符) - 系统命令分隔符
& (和号) - 在URL中有特殊含义
< > (尖括号) - HTML标签，XSS风险
```

### 3. 控制字符
```
严禁输入：
\n (换行符)
\r (回车符)
\t (制表符)
\0 (空字符)
```

## ✅ 推荐的数据格式规范

### 📝 文本字段

#### 产品名称/型号/品牌
```
✅ 推荐格式：
- 使用字母、数字、中文
- 连字符 (-) 和下划线 (_) 可以使用
- 空格使用单个空格分隔

❌ 避免：
- 开头或结尾的空格
- 连续多个空格
- 特殊符号：@#$%^&*()+=[]{}

示例：
✅ "HP LaserJet Pro M404n"
✅ "佳能 EOS-5D Mark IV"
❌ " HP LaserJet Pro M404n " (首尾空格)
❌ "HP  LaserJet  Pro" (多个空格)
❌ "HP@LaserJet#Pro" (特殊符号)
```

#### 规格参数
```
✅ 推荐格式：
- 使用标准单位符号
- 数字与单位之间用空格分隔
- 范围使用 ~ 或 -

示例：
✅ "A4, 1200 x 1200 dpi"
✅ "220V~240V 50Hz"
✅ "尺寸: 419 x 363 x 253 mm"
❌ "A4,1200x1200dpi" (缺少空格)
❌ "220V－240V" (使用全角连字符)
```

### 💰 价格字段
```
✅ 推荐格式：
- 仅输入数字和小数点
- 不要包含货币符号
- 小数位最多2位

示例：
✅ "2599.99"
✅ "1500"
❌ "￥2599.99" (包含货币符号)
❌ "2,599.99" (包含千位分隔符)
❌ "2599.999" (超过2位小数)
```

### 📱 联系方式
```
✅ 电话号码：
- 仅数字和连字符
- 格式：区号-号码 或 手机号

示例：
✅ "010-12345678"
✅ "13812345678"
❌ "+86 138-1234-5678" (包含特殊符号)
❌ "138 1234 5678" (空格分隔)

✅ 邮箱地址：
- 标准邮箱格式
- 不包含中文字符

示例：
✅ "user@example.com"
❌ "用户@example.com" (中文字符)
```

### 🔗 URL/链接
```
✅ 推荐格式：
- 完整的URL格式（绝对路径）
- 使用http://或https://开头
- 相对路径（以"/"开头）

示例：
✅ "https://www.example.com/product"        # 完整URL
✅ "http://localhost:8080/api/products"     # 本地完整URL
✅ "/products/detail/123"                   # 相对路径（推荐）
✅ "/api/upload"                            # API相对路径
✅ "/images/product.jpg"                    # 资源相对路径

❌ 避免：
❌ "www.example.com" (缺少协议)
❌ "example.com/产品" (包含中文)
❌ "../../../admin" (使用../可能有安全风险)
❌ "javascript:void(0)" (脚本协议)
```

## 🛡️ 安全注意事项

### 1. XSS防护
```
避免输入HTML/JavaScript代码：
❌ "<script>alert('xss')</script>"
❌ "<img src='x' onerror='alert(1)'>"
❌ "javascript:alert('xss')"
```

### 2. 路径遍历防护
```
避免输入文件路径：
❌ "../../../etc/passwd"
❌ "..\\..\\windows\\system32"
❌ "/etc/shadow"
```

### 3. 命令注入防护
```
避免输入系统命令：
❌ "rm -rf /"
❌ "cmd.exe"
❌ "&&ls -la"
```

## 📏 字段长度限制

### 常用字段长度规范
```
产品名称：1-100字符
产品型号：1-50字符
品牌名称：1-50字符
规格描述：1-500字符
价格：1-10字符（数字）
供应商名称：1-100字符
联系电话：1-20字符
邮箱地址：1-100字符
备注信息：1-1000字符
```

## 🔤 字符编码规范

### 推荐使用
```
✅ UTF-8编码字符
✅ 标准ASCII字符 (a-z, A-Z, 0-9)
✅ 常用中文字符
✅ 基本标点符号 (. , - _ )
```

### 避免使用
```
❌ 特殊Unicode字符
❌ Emoji表情符号
❌ 全角字符（除中文外）
❌ 控制字符
```

## 📊 Excel导入特殊注意事项

### 数据预处理
```bash
# 使用我们的Excel转换器前，确保：
1. 去除首尾空格
2. 统一日期格式
3. 检查特殊字符
4. 验证数字格式
```

### 常见Excel问题
```
❌ 科学计数法显示的数字
❌ 日期被转换为数字
❌ 长数字被截断
❌ 公式而不是值
❌ 合并单元格
```

## 🔍 数据验证工具

### 前端验证规则
```javascript
// 产品名称验证
function validateProductName(name) {
    const pattern = /^[a-zA-Z0-9\u4e00-\u9fa5\s\-_]+$/;
    return pattern.test(name) && name.length <= 100;
}

// 价格验证
function validatePrice(price) {
    const pattern = /^\d+(\.\d{1,2})?$/;
    return pattern.test(price);
}

// 电话验证
function validatePhone(phone) {
    const pattern = /^(\d{3,4}-\d{7,8}|\d{11})$/;
    return pattern.test(phone);
}

// URL验证（支持完整URL和相对路径）
function validateURL(url) {
    // 完整URL格式
    const fullUrlPattern = /^https?:\/\/[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(\/.*)?$/;
    // 相对路径格式（以/开头）
    const relativePathPattern = /^\/[a-zA-Z0-9.\/_-]*$/;
    // 检查危险协议
    const dangerousProtocol = /^(javascript|data|file|ftp):/i;
    
    if (dangerousProtocol.test(url)) {
        return false; // 危险协议
    }
    
    return fullUrlPattern.test(url) || relativePathPattern.test(url);
}
```

### 后端验证（WordPress）
```php
// 清理输入数据
function sanitize_product_input($input) {
    $input = trim($input);
    $input = stripslashes($input);
    $input = htmlspecialchars($input);
    return $input;
}

// 验证产品名称
function validate_product_name($name) {
    if (empty($name) || strlen($name) > 100) {
        return false;
    }
    if (preg_match('/[<>"\';&]/', $name)) {
        return false;
    }
    return true;
}
```

## 🚫 常见错误示例

### ❌ 错误的数据输入
```
产品名称: " HP打印机 " (首尾空格)
型号: "LaserJet'Pro" (包含单引号)
价格: "￥2,599.99" (包含货币符号和千位分隔符)
规格: "A4;彩色打印" (使用分号)
联系方式: "+86 138-1234-5678" (包含特殊符号)
描述: "<b>高质量打印机</b>" (包含HTML标签)
```

### ✅ 正确的数据输入
```
产品名称: "HP打印机"
型号: "LaserJet Pro"
价格: "2599.99"
规格: "A4 彩色打印"
联系方式: "138-1234-5678"
描述: "高质量打印机，适合办公使用"
```

## 🛠️ 数据清理工具

### 批量数据清理脚本
```bash
#!/bin/bash
# 创建数据清理脚本
cat > clean-data.sh << 'EOF'
#!/bin/bash

# 清理CSV文件中的常见问题
clean_csv_data() {
    local file=$1
    
    # 去除首尾空格
    sed -i 's/^[[:space:]]*//g; s/[[:space:]]*$//g' "$file"
    
    # 替换多个连续空格为单个空格
    sed -i 's/[[:space:]]\+/ /g' "$file"
    
    # 移除危险字符
    sed -i "s/['\";]//g" "$file"
    
    echo "数据清理完成: $file"
}

# 使用方法: ./clean-data.sh your-file.csv
clean_csv_data "$1"
EOF

chmod +x clean-data.sh
```

### Excel数据验证宏
```vba
' Excel VBA宏：验证数据质量
Sub ValidateProductData()
    Dim ws As Worksheet
    Dim lastRow As Long
    Dim i As Long
    
    Set ws = ActiveSheet
    lastRow = ws.Cells(ws.Rows.Count, 1).End(xlUp).Row
    
    For i = 2 To lastRow
        ' 检查产品名称
        If Len(Trim(ws.Cells(i, 1))) = 0 Then
            ws.Cells(i, 1).Interior.Color = vbRed
        End If
        
        ' 检查价格格式
        If Not IsNumeric(ws.Cells(i, 3)) Then
            ws.Cells(i, 3).Interior.Color = vbYellow
        End If
    Next i
    
    MsgBox "数据验证完成！红色为必填项，黄色为格式错误"
End Sub
```

## 📝 数据输入检查清单

### ✅ 输入前检查
- [ ] 数据不包含首尾空格
- [ ] 不包含特殊字符 (', ", ;, <, >, \)
- [ ] 价格为纯数字格式
- [ ] 联系方式格式正确
- [ ] 文本长度在限制范围内
- [ ] 不包含HTML标签或脚本代码

### ✅ 批量导入前检查
- [ ] Excel文件格式正确
- [ ] 没有合并单元格
- [ ] 数据类型一致
- [ ] 必填字段已填写
- [ ] 特殊字符已清理
- [ ] 数据已备份

## 🆘 问题排查

### 常见输入问题及解决方案

#### 1. 数据库插入失败
```
问题: SQL语法错误
原因: 包含单引号或特殊字符
解决: 使用prepared statements或转义字符
```

#### 2. 前端显示异常
```
问题: 页面显示乱码或布局破坏
原因: 包含HTML标签或特殊字符
解决: 进行HTML转义处理
```

#### 3. 搜索功能异常
```
问题: 搜索结果不准确
原因: 包含多余空格或特殊字符
解决: 标准化搜索字符串
```

#### 4. Excel导入错误
```
问题: 数据导入后格式错误
原因: Excel格式问题或编码问题
解决: 使用CSV格式并指定UTF-8编码
```

## 📞 技术支持

如果遇到数据输入相关问题：

1. **检查数据格式** - 参考本指南的格式要求
2. **使用验证工具** - 运行数据验证脚本
3. **查看错误日志** - 检查系统日志获取详细错误信息
4. **联系技术支持** - 提供具体的输入数据和错误信息

---

**重要提醒**: 遵循本指南可以显著减少数据相关问题，提高系统稳定性和数据质量。建议将此指南分享给所有数据录入人员。 