#!/bin/bash

# BJT产品系统 - 开发环境一键启动脚本

set -e

echo "🚀 BJT产品系统 - 开发环境启动"

# 给配置脚本执行权限
chmod +x scripts/setup-env.sh

# 自动配置环境并启动
./scripts/setup-env.sh --start 