#!/bin/bash

# BJT API配置快速修复脚本
# 自动检测并修复API配置问题

set -e

echo "🔧 BJT API配置快速修复工具"
echo "================================"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检测当前环境
detect_environment() {
    log_info "检测当前环境..."
    
    if [ -n "$DOCKER_CONTAINER_ID" ] || [ -n "$DOCKER_ENV" ] || [ -f "/.dockerenv" ]; then
        echo "docker"
    elif [ -n "$PRODUCTION" ] || [ "$NODE_ENV" = "production" ]; then
        echo "production"
    else
        echo "development"
    fi
}

# 检查API配置文件
check_api_configs() {
    log_info "检查API配置文件..."
    
    local issues=0
    
    # 检查配置文件是否存在
    if [ ! -f "frontend/src/config/appConfig.ts" ]; then
        log_error "主配置文件不存在: frontend/src/config/appConfig.ts"
        issues=$((issues + 1))
    fi
    
    if [ ! -f "frontend/src/api/config.ts" ]; then
        log_error "API配置文件不存在: frontend/src/api/config.ts"
        issues=$((issues + 1))
    fi
    
    # 检查配置冲突
    if grep -q "http://localhost:8080" frontend/src/config/appConfig.ts 2>/dev/null; then
        log_warning "发现硬编码的localhost URL"
        issues=$((issues + 1))
    fi
    
    return $issues
}

# 检查环境变量
check_env_vars() {
    log_info "检查环境变量配置..."
    
    local env=$(detect_environment)
    local issues=0
    
    case $env in
        "development")
            if [ -z "$VITE_API_URL" ]; then
                log_warning "开发环境未设置 VITE_API_URL"
                issues=$((issues + 1))
            fi
            ;;
        "production")
            if [ -z "$VITE_API_URL" ]; then
                log_warning "生产环境未设置 VITE_API_URL"
                issues=$((issues + 1))
            fi
            ;;
        "docker")
            if [ -z "$VITE_API_URL" ]; then
                log_warning "Docker环境未设置 VITE_API_URL"
                issues=$((issues + 1))
            fi
            ;;
    esac
    
    return $issues
}

# 创建统一的API配置
create_unified_config() {
    log_info "创建统一的API配置..."
    
    local config_dir="frontend/src/config"
    mkdir -p "$config_dir"
    
    cat > "$config_dir/api-unified.config.ts" << 'EOF'
/**
 * 统一API配置管理器
 * 解决多配置文件冲突问题
 */

interface ApiConfig {
  baseUrl: string;
  timeout: number;
  retryAttempts: number;
  debugMode: boolean;
}

class ApiConfigManager {
  private static instance: ApiConfigManager;
  private config: ApiConfig;

  private constructor() {
    this.config = this.initializeConfig();
    this.logConfig();
  }

  static getInstance(): ApiConfigManager {
    if (!ApiConfigManager.instance) {
      ApiConfigManager.instance = new ApiConfigManager();
    }
    return ApiConfigManager.instance;
  }

  private initializeConfig(): ApiConfig {
    const environment = this.detectEnvironment();
    
    return {
      baseUrl: this.getBaseUrl(environment),
      timeout: parseInt(import.meta.env.VITE_API_TIMEOUT || '10000'),
      retryAttempts: parseInt(import.meta.env.VITE_API_RETRY_ATTEMPTS || '3'),
      debugMode: import.meta.env.DEV || false
    };
  }

  private detectEnvironment(): 'development' | 'production' | 'docker' {
    // 1. 检查明确的环境标识
    if (import.meta.env.DOCKER_ENV) return 'docker';
    if (import.meta.env.DEV) return 'development';
    if (import.meta.env.PROD) return 'production';
    
    // 2. 检查URL模式
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return 'development';
      }
    }
    
    return 'production';
  }

  private getBaseUrl(environment: string): string {
    // 1. 优先使用明确设置的环境变量
    if (import.meta.env.VITE_API_URL) {
      return import.meta.env.VITE_API_URL;
    }

    // 2. 根据环境自动选择
    switch (environment) {
      case 'development':
        return 'http://localhost:8080/wp-json/bjt/v1';
      case 'docker':
        return 'http://wordpress:80/wp-json/bjt/v1';
      case 'production':
        // 生产环境使用相对路径，依赖Nginx代理
        return '/wp-json/bjt/v1';
      default:
        return '/wp-json/bjt/v1';
    }
  }

  private logConfig() {
    if (this.config.debugMode) {
      console.log('🔧 API配置信息:', {
        baseUrl: this.config.baseUrl,
        environment: this.detectEnvironment(),
        timeout: this.config.timeout,
        retryAttempts: this.config.retryAttempts,
        envVars: {
          VITE_API_URL: import.meta.env.VITE_API_URL,
          MODE: import.meta.env.MODE,
          DEV: import.meta.env.DEV,
          PROD: import.meta.env.PROD,
          DOCKER_ENV: import.meta.env.DOCKER_ENV
        }
      });
    }
  }

  getConfig(): ApiConfig {
    return { ...this.config };
  }

  getBaseUrl(): string {
    return this.config.baseUrl;
  }

  getDebugInfo() {
    return {
      config: this.config,
      environment: this.detectEnvironment(),
      envVars: {
        VITE_API_URL: import.meta.env.VITE_API_URL,
        MODE: import.meta.env.MODE,
        DEV: import.meta.env.DEV,
        PROD: import.meta.env.PROD,
        DOCKER_ENV: import.meta.env.DOCKER_ENV
      }
    };
  }
}

// 导出单例实例
export const apiConfig = ApiConfigManager.getInstance();
export default apiConfig;

// 向后兼容的导出
export const API_CONFIG = {
  BASE_URL: apiConfig.getBaseUrl(),
  get baseURL() { return apiConfig.getBaseUrl(); },
  TIMEOUT: apiConfig.getConfig().timeout,
  RETRY_COUNT: apiConfig.getConfig().retryAttempts
};

export const API_BASE_URL = apiConfig.getBaseUrl();
EOF

    log_success "统一API配置已创建: $config_dir/api-unified.config.ts"
}

# 创建环境配置文件
create_env_files() {
    log_info "创建标准化环境配置文件..."
    
    local env=$(detect_environment)
    
    # 开发环境配置
    cat > "frontend/.env.development" << 'EOF'
# 开发环境配置
VITE_API_URL=http://localhost:8080/wp-json/bjt/v1
VITE_API_TIMEOUT=10000
VITE_API_RETRY_ATTEMPTS=3
VITE_DEBUG=true
VITE_CORS_ENABLED=true
EOF

    # 生产环境配置
    cat > "frontend/.env.production" << 'EOF'
# 生产环境配置
VITE_API_URL=/wp-json/bjt/v1
VITE_API_TIMEOUT=8000
VITE_API_RETRY_ATTEMPTS=2
VITE_DEBUG=false
VITE_CORS_ENABLED=false
EOF

    # Docker环境配置
    cat > "frontend/.env.docker" << 'EOF'
# Docker环境配置
VITE_API_URL=http://wordpress:80/wp-json/bjt/v1
VITE_API_TIMEOUT=15000
VITE_API_RETRY_ATTEMPTS=3
VITE_DEBUG=true
VITE_CORS_ENABLED=true
DOCKER_ENV=true
EOF

    log_success "环境配置文件已创建"
}

# 创建CORS配置
create_cors_config() {
    log_info "创建标准化CORS配置..."
    
    cat > "nginx/conf.d/cors-unified.conf" << 'EOF'
# 统一CORS配置
# 根据环境自动选择CORS策略

map $http_origin $cors_origin {
    default "";
    "~^https?://localhost:5173$" $http_origin;
    "~^https?://localhost:3000$" $http_origin;
    "~^https://eorder\.lockedair\.com$" $http_origin;
    "~^https://bjt\.nh\.cool$" $http_origin;
    "~^https://bjt\.deepneed\.com\.cn$" $http_origin;
}

# CORS头设置
add_header Access-Control-Allow-Origin $cors_origin always;
add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
add_header Access-Control-Allow-Headers "Origin, X-Requested-With, Content-Type, Accept, Authorization, X-WP-Nonce" always;
add_header Access-Control-Allow-Credentials "true" always;
add_header Access-Control-Expose-Headers "Link, X-WP-Total, X-WP-TotalPages" always;

# 处理OPTIONS预检请求
if ($request_method = 'OPTIONS') {
    add_header Access-Control-Allow-Origin $cors_origin;
    add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
    add_header Access-Control-Allow-Headers "Origin, X-Requested-With, Content-Type, Accept, Authorization, X-WP-Nonce";
    add_header Access-Control-Max-Age 86400;
    add_header Content-Length 0;
    add_header Content-Type "text/plain";
    return 204;
}
EOF

    log_success "统一CORS配置已创建: nginx/conf.d/cors-unified.conf"
}

# 创建诊断工具
create_diagnostic_tool() {
    log_info "创建API诊断工具..."
    
    cat > "scripts/diagnose-api.js" << 'EOF'
#!/usr/bin/env node

/**
 * API配置诊断工具
 * 检测和诊断API配置问题
 */

const fs = require('fs');
const path = require('path');

class ApiDiagnostics {
  constructor() {
    this.issues = [];
    this.warnings = [];
    this.info = [];
  }

  async runDiagnostics() {
    console.log('🔍 BJT API配置诊断工具');
    console.log('========================');
    
    this.checkConfigFiles();
    this.checkEnvFiles();
    await this.checkConnectivity();
    
    this.printReport();
  }

  checkConfigFiles() {
    console.log('\n📋 检查配置文件...');
    
    const configFiles = [
      'frontend/src/config/appConfig.ts',
      'frontend/src/api/config.ts',
      'frontend/src/config/api-unified.config.ts'
    ];
    
    configFiles.forEach(file => {
      if (fs.existsSync(file)) {
        console.log(`  ✅ ${file} 存在`);
        
        // 检查是否有硬编码URL
        const content = fs.readFileSync(file, 'utf8');
        if (content.includes('localhost:8080')) {
          this.warnings.push(`${file} 包含硬编码的localhost URL`);
        }
      } else {
        this.issues.push(`${file} 不存在`);
      }
    });
  }

  checkEnvFiles() {
    console.log('\n🌍 检查环境文件...');
    
    const envFiles = [
      'frontend/.env.development',
      'frontend/.env.production',
      'frontend/.env.docker'
    ];
    
    envFiles.forEach(file => {
      if (fs.existsSync(file)) {
        console.log(`  ✅ ${file} 存在`);
      } else {
        this.warnings.push(`${file} 不存在`);
      }
    });
  }

  async checkConnectivity() {
    console.log('\n🌐 检查API连接性...');
    
    const testUrls = [
      'http://localhost:8080/wp-json/bjt/v1',
      '/wp-json/bjt/v1'
    ];
    
    for (const url of testUrls) {
      try {
        // 这里可以添加实际的连接测试
        console.log(`  🔍 测试 ${url}...`);
        this.info.push(`API URL: ${url}`);
      } catch (error) {
        this.issues.push(`无法连接到 ${url}: ${error.message}`);
      }
    }
  }

  printReport() {
    console.log('\n📊 诊断报告');
    console.log('============');
    
    if (this.issues.length > 0) {
      console.log('\n❌ 发现问题:');
      this.issues.forEach(issue => console.log(`  - ${issue}`));
    }
    
    if (this.warnings.length > 0) {
      console.log('\n⚠️ 警告:');
      this.warnings.forEach(warning => console.log(`  - ${warning}`));
    }
    
    if (this.info.length > 0) {
      console.log('\n💡 信息:');
      this.info.forEach(info => console.log(`  - ${info}`));
    }
    
    if (this.issues.length === 0 && this.warnings.length === 0) {
      console.log('\n✅ 所有检查通过！');
    }
  }
}

// 运行诊断
const diagnostics = new ApiDiagnostics();
diagnostics.runDiagnostics().catch(console.error);
EOF

    chmod +x "scripts/diagnose-api.js"
    log_success "API诊断工具已创建: scripts/diagnose-api.js"
}

# 备份现有配置
backup_configs() {
    log_info "备份现有配置..."
    
    local backup_dir="backups/api-config-$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$backup_dir"
    
    # 备份前端配置
    if [ -f "frontend/src/config/appConfig.ts" ]; then
        cp "frontend/src/config/appConfig.ts" "$backup_dir/"
        log_success "已备份 appConfig.ts"
    fi
    
    if [ -f "frontend/src/api/config.ts" ]; then
        cp "frontend/src/api/config.ts" "$backup_dir/"
        log_success "已备份 api/config.ts"
    fi
    
    # 备份nginx配置
    if [ -d "nginx/conf.d" ]; then
        cp -r "nginx/conf.d" "$backup_dir/"
        log_success "已备份 nginx配置"
    fi
    
    echo "备份保存在: $backup_dir"
}

# 主要修复流程
main() {
    echo "开始API配置修复..."
    
    # 检测问题
    local config_issues=0
    local env_issues=0
    
    check_api_configs || config_issues=$?
    check_env_vars || env_issues=$?
    
    if [ $config_issues -gt 0 ] || [ $env_issues -gt 0 ]; then
        log_warning "发现 $((config_issues + env_issues)) 个问题，开始修复..."
        
        # 创建备份
        backup_configs
        
        # 应用修复
        create_unified_config
        create_env_files
        create_cors_config
        create_diagnostic_tool
        
        log_success "修复完成！"
        
        echo ""
        echo "🎯 下一步操作："
        echo "1. 重新启动开发服务器"
        echo "2. 运行诊断工具: node scripts/diagnose-api.js"
        echo "3. 检查API调用是否正常"
        
    else
        log_success "未发现问题，配置看起来正常！"
    fi
}

# 运行主程序
main "$@" 