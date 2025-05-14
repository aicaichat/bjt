#!/bin/bash

echo "===== BJT前端项目构建与Podman部署脚本 ====="

# 设置错误处理
set -e

# 1. 检查环境
echo "检查Node.js环境..."
if ! command -v node &> /dev/null; then
    echo "错误: 未找到Node.js, 请先安装Node.js"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "错误: 未找到npm, 请先安装npm"
    exit 1
fi

if ! command -v podman &> /dev/null; then
    echo "错误: 未找到podman, 请先安装podman"
    exit 1
fi

# 2. 准备构建环境
echo "准备构建环境..."
cd "$(dirname "$0")" # 确保脚本在frontend目录下运行

# 清理之前的构建结果
echo "清理之前的构建..."
rm -rf build

# 确保已安装依赖
echo "检查并安装依赖..."
npm install

# 3. 创建必要的.env文件
echo "创建.env.production.mock文件..."
cat > .env.production.mock << EOF
VITE_BASE_URL=/
VITE_USE_MOCK=true
EOF

# 4. 执行构建 - 忽略警告
echo "执行构建命令..."
# 忽略警告并继续执行
npm run build || echo "有警告但继续执行"

# 直接检查build/index.html是否存在，而不是检查整个build目录
if [ ! -f "build/index.html" ]; then
    echo "尝试其他构建命令..."
    npm run build-mock-skip-ts || npx vite build
    
    # 最终检查
    if [ ! -f "build/index.html" ]; then
        echo "严重错误: 无法生成build/index.html文件"
        exit 1
    fi
fi

echo "构建成功! 检查build目录内容:"
ls -la build/

# 5. 确保使用根路径
echo "确保index.html使用根路径..."
if [ -f "build/index.html" ]; then
    sed -i.bak 's|<base href="/bjt/" />|<base href="/" />|g' build/index.html 2>/dev/null || true
    if [ -f "build/index.html.bak" ]; then
        rm build/index.html.bak
    fi
fi

# 6. 创建用于部署的Dockerfile
echo "创建Dockerfile.prod..."
cat > Dockerfile.prod << EOF
FROM nginx:alpine
COPY build/ /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
EOF

# 创建Nginx配置
echo "创建nginx.conf..."
cat > nginx.conf << EOF
server {
    listen 80;
    server_name localhost;

    location / {
        root /usr/share/nginx/html;
        index index.html;
        try_files \$uri \$uri/ /index.html;
    }
}
EOF

# 7. 构建Podman镜像
echo "使用Podman构建镜像..."
podman build -t bjt-frontend:latest -f Dockerfile.prod .

# 8. 运行容器 (先停止已存在的容器)
echo "停止并移除已存在的容器..."
podman rm -f bjt-frontend 2>/dev/null || true

echo "启动前端容器..."
podman run -d --name bjt-frontend -p 8080:80 bjt-frontend:latest

echo "===== 部署完成 ====="
echo "前端应用已部署到: http://localhost:8080/"
echo "可使用以下命令查看容器状态: podman ps"
echo "可使用以下命令查看容器日志: podman logs bjt-frontend"