# CDN缓存配置指导 - 修复购物车功能问题

## 🔍 问题描述

开启CDN缓存后，购物车的添加、删除、清空等动态操作不能正常工作。根本原因是CDN错误地缓存了本应动态生成的API响应。

## ✅ 解决方案

### 1. CDN配置规则

#### **需要绕过缓存的API路径**
```nginx
# 购物车相关API - 永不缓存
location ~* ^/wp-json/bjt/v1/cart {
    add_header Cache-Control "no-cache, no-store, must-revalidate";
    add_header Pragma "no-cache";
    add_header Expires "0";
    proxy_no_cache 1;
    proxy_cache_bypass 1;
}

# 用户认证相关API - 永不缓存
location ~* ^/wp-json/bjt/v1/(auth|login|logout|user) {
    add_header Cache-Control "no-cache, no-store, must-revalidate";
    add_header Pragma "no-cache";
    add_header Expires "0";
    proxy_no_cache 1;
    proxy_cache_bypass 1;
}

# 订单相关API - 永不缓存
location ~* ^/wp-json/bjt/v1/(orders|order) {
    add_header Cache-Control "no-cache, no-store, must-revalidate";
    add_header Pragma "no-cache";
    add_header Expires "0";
    proxy_no_cache 1;
    proxy_cache_bypass 1;
}
```

#### **短期缓存的API路径**
```nginx
# 产品数据API - 短期缓存（5分钟）
location ~* ^/wp-json/bjt/v1/(machines|accessories|spare-parts|consumables) {
    add_header Cache-Control "public, max-age=300";
    proxy_cache_valid 200 5m;
}

# 筛选选项API - 中期缓存（30分钟）
location ~* ^/wp-json/bjt/v1/.*/filter-options {
    add_header Cache-Control "public, max-age=1800";
    proxy_cache_valid 200 30m;
}
```

#### **长期缓存的静态资源**
```nginx
# 静态资源 - 长期缓存（1年）
location ~* \.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
    add_header Cache-Control "public, max-age=31536000";
    proxy_cache_valid 200 1y;
}
```

### 2. 阿里云CDN配置 🎯

#### **2.1 缓存规则配置**

登录阿里云CDN控制台，为域名 `eorder.lockedair.com` 配置以下缓存规则：

**购物车API - 不缓存规则**
```
规则类型: 目录
规则内容: /wp-json/bjt/v1/cart
缓存时间: 不缓存
优先级: 10 (最高)
```

**认证API - 不缓存规则**
```
规则类型: 目录  
规则内容: /wp-json/bjt/v1/auth
缓存时间: 不缓存
优先级: 9
```

**订单API - 不缓存规则**
```
规则类型: 目录
规则内容: /wp-json/bjt/v1/order
缓存时间: 不缓存  
优先级: 8
```

#### **2.2 HTTP头管理配置**

在"高级配置" > "HTTP头管理"中添加：

**购物车API响应头设置**
```
规则类型: 目录
规则内容: /wp-json/bjt/v1/cart
操作: 设置
响应头:
  - Cache-Control: no-cache, no-store, must-revalidate
  - Pragma: no-cache
  - Expires: Thu, 01 Jan 1970 00:00:00 GMT
```

#### **2.3 参数过滤配置**

在"性能优化" > "参数过滤"中配置：

**保留时间戳参数**
```
参数保留: 开启
保留参数: _t,_cb,_cache_buster
说明: 保留防缓存时间戳参数
```

#### **2.4 阿里云CDN控制台操作步骤**

1. **登录阿里云CDN控制台**
   ```
   https://cdn.console.aliyun.com/
   ```

2. **选择域名** → `eorder.lockedair.com`

3. **配置缓存规则**
   - 点击"缓存配置" → "缓存规则"
   - 点击"添加" → 选择"目录"
   - 输入目录: `/wp-json/bjt/v1/cart`
   - 缓存时间: 选择"不缓存"
   - 优先级: 设置为 10
   - 点击"确定"

4. **配置HTTP头管理**
   - 点击"高级配置" → "HTTP头管理"  
   - 点击"添加" → 选择"目录"
   - 输入目录: `/wp-json/bjt/v1/cart`
   - 操作: 选择"设置"
   - 响应头: `Cache-Control`
   - 值: `no-cache, no-store, must-revalidate`
   - 重复添加 `Pragma` 和 `Expires` 头

5. **刷新缓存**
   - 点击"刷新缓存" → "目录刷新"
   - 输入: `https://eorder.lockedair.com/wp-json/bjt/v1/cart`
   - 点击"提交"

#### **2.5 阿里云CDN API配置（可选）**

使用阿里云CLI批量配置：

```bash
# 安装阿里云CLI
wget https://aliyuncli.alicdn.com/aliyun-cli-linux-latest-amd64.tgz
tar xzvf aliyun-cli-linux-latest-amd64.tgz
sudo cp aliyun /usr/local/bin/

# 配置访问密钥
aliyun configure

# 添加购物车API不缓存规则
aliyun cdn AddCachingRule \
  --DomainName eorder.lockedair.com \
  --ConfigId cart-no-cache \
  --RuleType Directory \
  --RuleValue "/wp-json/bjt/v1/cart" \
  --TTL 0 \
  --Priority 10

# 刷新购物车API缓存
aliyun cdn RefreshObjectCaches \
  --ObjectPath "https://eorder.lockedair.com/wp-json/bjt/v1/cart" \
  --ObjectType Directory
```

### 3. Cloudflare配置（备选方案）

如果使用Cloudflare CDN，请设置以下页面规则：

#### **购物车API绕过缓存**
```
URL Pattern: *eorder.lockedair.com/wp-json/bjt/v1/cart*
Settings: 
  - Cache Level: Bypass
  - Browser Cache TTL: Respect Existing Headers
```

#### **认证API绕过缓存**
```
URL Pattern: *eorder.lockedair.com/wp-json/bjt/v1/auth*
Settings:
  - Cache Level: Bypass
  - Browser Cache TTL: Respect Existing Headers
```

#### **产品API短期缓存**
```
URL Pattern: *eorder.lockedair.com/wp-json/bjt/v1/machines*
Settings:
  - Cache Level: Standard
  - Browser Cache TTL: 5 minutes
  - Edge Cache TTL: 5 minutes
```

### 3. AWS CloudFront配置

如果使用AWS CloudFront，请配置以下行为：

#### **动态API行为配置**
```json
{
  "PathPattern": "/wp-json/bjt/v1/cart*",
  "TargetOriginId": "origin1",
  "ViewerProtocolPolicy": "redirect-to-https",
  "CachePolicyId": "4135ea2d-6df8-44a3-9df3-4b5a84be39ad", // CachingDisabled
  "OriginRequestPolicyId": "88a5eaf4-2fd4-4709-b370-b4c650ea3fcf", // CORS-S3Origin
  "ResponseHeadersPolicyId": "67f7725c-6f97-4210-82d7-5512b31e9d03" // SimpleCORS
}
```

### 4. 服务器端缓存控制

#### **WordPress后端配置**
在你的WordPress插件中添加以下代码：

```php
// 在 wp-json API响应中添加缓存控制头
add_filter('rest_pre_serve_request', function($served, $result, $request) {
    $uri = $request->get_route();
    
    // 购物车API - 禁用缓存
    if (strpos($uri, '/cart') !== false) {
        header('Cache-Control: no-cache, no-store, must-revalidate');
        header('Pragma: no-cache');
        header('Expires: 0');
    }
    
    // 认证API - 禁用缓存
    if (strpos($uri, '/auth') !== false || strpos($uri, '/login') !== false) {
        header('Cache-Control: no-cache, no-store, must-revalidate');
        header('Pragma: no-cache');
        header('Expires: 0');
    }
    
    // 产品API - 短期缓存
    if (preg_match('/\/(machines|accessories|spare-parts|consumables)/', $uri)) {
        header('Cache-Control: public, max-age=300');
    }
    
    return $served;
}, 10, 3);
```

### 5. 前端代码修复

前端代码已经添加了以下防缓存机制：

#### **HTTP请求头**
- `Cache-Control: no-cache, no-store, must-revalidate`
- `Pragma: no-cache`
- `Expires: 0`
- `X-Cache-Buster: timestamp_browser_info`

#### **URL参数**
- `_t=timestamp` - 时间戳参数
- `_cb=browser_info` - 浏览器信息参数

### 6. 测试验证

#### **验证缓存是否正确配置**
```bash
# 测试购物车API是否绕过缓存
curl -I "https://eorder.lockedair.com/wp-json/bjt/v1/cart"

# 应该返回：
# Cache-Control: no-cache, no-store, must-revalidate
# Pragma: no-cache
# Expires: 0

# 测试静态资源是否正确缓存
curl -I "https://eorder.lockedair.com/static/js/main.js"

# 应该返回：
# Cache-Control: public, max-age=31536000
```

#### **浏览器测试**
1. 打开开发者工具 > Network面板
2. 添加商品到购物车
3. 检查请求头是否包含防缓存参数
4. 检查响应头是否正确设置

### 7. 部署检查清单

- [ ] CDN配置了购物车API绕过缓存
- [ ] CDN配置了认证API绕过缓存  
- [ ] CDN配置了订单API绕过缓存
- [ ] 静态资源正确配置长期缓存
- [ ] 产品API配置短期缓存
- [ ] 服务器端添加了缓存控制头
- [ ] 前端代码包含防缓存机制
- [ ] 测试验证所有功能正常

### 8. 监控和故障排除

#### **常见问题**
1. **购物车商品数量不更新** - 检查购物车API是否被缓存
2. **用户登录状态不同步** - 检查认证API是否被缓存
3. **产品价格不更新** - 检查产品API缓存时间是否过长

#### **调试工具**
```javascript
// 在浏览器控制台运行，检查缓存状态
console.log('Cache headers check:');
fetch('/wp-json/bjt/v1/cart', {method: 'GET'})
  .then(response => {
    console.log('Cache-Control:', response.headers.get('cache-control'));
    console.log('Pragma:', response.headers.get('pragma'));
    console.log('Expires:', response.headers.get('expires'));
  });
```

## 🔧 紧急修复

如果问题仍然存在，可以临时使用以下方法：

### 前端强制刷新
```javascript
// 在购物车操作后强制页面刷新
window.location.reload(true);
```

### CDN缓存清除
```bash
# Cloudflare缓存清除
curl -X POST "https://api.cloudflare.com/client/v4/zones/{zone_id}/purge_cache" \
  -H "Authorization: Bearer {api_token}" \
  -H "Content-Type: application/json" \
  --data '{"files":["https://eorder.lockedair.com/wp-json/bjt/v1/cart"]}'
```

通过以上配置，可以彻底解决CDN缓存导致的购物车功能问题。 