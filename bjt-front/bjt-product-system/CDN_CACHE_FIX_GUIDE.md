# BJT系统CDN缓存问题修复指南

## 🚨 问题描述
API过滤功能正常，但CDN缓存导致所有API请求返回相同的缓存数据，忽略查询参数。

## 📋 检查清单

### 1. 验证问题存在
```bash
# 外部请求（通过CDN）- 应该返回不同数据但实际返回相同
curl "https://your-domain.com/wp-json/bjt/v1/relations?host_part_number=60A01113"
curl "https://your-domain.com/wp-json/bjt/v1/relations?host_part_number=NONEXISTENT123"

# 内部请求（绕过CDN）- 正常工作
docker exec -it bjt-wordpress bash
curl "localhost/wp-json/bjt/v1/relations?host_part_number=60A01113"
curl "localhost/wp-json/bjt/v1/relations?host_part_number=NONEXISTENT123"
```

### 2. 检查缓存头信息
```bash
curl -I "https://your-domain.com/wp-json/bjt/v1/relations?host_part_number=60A01113"
# 查看响应头中的缓存信息：
# - Age: 409 (缓存时间)
# - X-Cache: HIT TCP_MEM_HIT (缓存命中)
# - X-Swift-CacheTime: 2592000 (缓存时长)
```

## 🔧 阿里云CDN修复步骤

### 方案1：禁用API端点缓存（推荐）

1. **登录阿里云CDN控制台**
   - 进入CDN控制台
   - 选择对应的域名

2. **配置缓存规则**
   - 进入"缓存配置" → "缓存规则"
   - 添加新规则：
     ```
     路径：/wp-json/bjt/v1/*
     缓存时间：不缓存
     优先级：99（高优先级）
     ```

3. **配置Cache-Control**
   - 进入"缓存配置" → "HTTP头"
   - 添加响应头：
     ```
     Header名称：Cache-Control
     Header值：no-cache, no-store, must-revalidate
     匹配规则：/wp-json/bjt/v1/*
     ```

### 方案2：启用参数敏感缓存

1. **配置URL参数**
   - 进入"缓存配置" → "URL参数"
   - 设置参数保留规则：
     ```
     路径：/wp-json/bjt/v1/relations
     参数：host_part_number,parent_part_number,child_part_number,level
     规则：保留指定参数
     ```

2. **配置缓存KEY**
   - 进入"缓存配置" → "缓存KEY"
   - 启用"查询字符串"参数
   - 指定需要参与缓存KEY的参数

### 方案3：清理现有缓存

1. **URL刷新**
   - 进入"刷新缓存" → "URL刷新"
   - 添加需要刷新的URL：
     ```
     https://your-domain.com/wp-json/bjt/v1/relations
     https://your-domain.com/wp-json/bjt/v1/relations?*
     ```

2. **目录刷新**
   - 进入"刷新缓存" → "目录刷新"
   - 添加目录：
     ```
     https://your-domain.com/wp-json/bjt/v1/
     ```

## 🚀 部署后验证

### 1. 创建验证脚本
```bash
#!/bin/bash
# 验证CDN缓存修复

echo "=== 验证CDN缓存修复 ==="

# 测试不存在的host_part_number
echo "1. 测试不存在的主机料号..."
response1=$(curl -s "https://your-domain.com/wp-json/bjt/v1/relations?host_part_number=NONEXISTENT123")
echo "响应: $response1"

# 测试存在的host_part_number
echo "2. 测试存在的主机料号..."
response2=$(curl -s "https://your-domain.com/wp-json/bjt/v1/relations?host_part_number=60A01113")
echo "响应: $response2"

# 检查响应是否不同
if [ "$response1" = "$response2" ]; then
    echo "❌ 缓存问题未解决 - 响应相同"
    exit 1
else
    echo "✅ 缓存问题已解决 - 响应不同"
fi

# 检查缓存头
echo "3. 检查缓存头信息..."
curl -I "https://your-domain.com/wp-json/bjt/v1/relations?host_part_number=60A01113"
```

### 2. 前端验证
```javascript
// 在浏览器控制台执行
const testAPI = async () => {
    const response1 = await fetch('/wp-json/bjt/v1/relations?host_part_number=NONEXISTENT123');
    const data1 = await response1.json();
    
    const response2 = await fetch('/wp-json/bjt/v1/relations?host_part_number=60A01113');
    const data2 = await response2.json();
    
    console.log('不存在的主机:', data1);
    console.log('存在的主机:', data2);
    
    if (data1.items.length === 0 && data2.items.length > 0) {
        console.log('✅ API过滤正常工作');
    } else {
        console.log('❌ API过滤仍有问题');
    }
};

testAPI();
```

## 🔄 应急处理

如果CDN配置无法立即修改，可以临时绕过CDN：

```javascript
// 前端临时修复 - 添加随机参数绕过缓存
const fetchWithCacheBuster = (url) => {
    const separator = url.includes('?') ? '&' : '?';
    const cacheBuster = `_t=${Date.now()}&_r=${Math.random()}`;
    return fetch(`${url}${separator}${cacheBuster}`);
};

// 或者添加强制刷新头
const fetchWithNoCache = (url) => {
    return fetch(url, {
        headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        }
    });
};
```

## 📞 后续行动

1. **立即执行**：CDN配置修改（方案1最简单有效）
2. **验证修复**：使用验证脚本确认问题解决
3. **监控观察**：确保修复后API功能正常
4. **文档更新**：更新部署文档，避免未来类似问题

## 🎯 关键提醒

- ⚠️ **CDN缓存是根本原因**，API代码本身工作正常
- ⚠️ **禁用API缓存**是最简单有效的解决方案
- ⚠️ **清理缓存**是必要步骤，配置后要刷新
- ⚠️ **验证修复**很重要，确保问题真正解决 