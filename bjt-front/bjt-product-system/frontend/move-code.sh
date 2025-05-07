#!/bin/bash

# 创建必要的目录
mkdir -p src/{pages,components,services,contexts,utils,i18n,router,assets,styles,config,types,api,mock,translations}

# 移动源代码文件
cp -r ../../src/* src/

# 移动配置文件
cp ../../vite.config.ts .
cp ../../tsconfig.json .
cp ../../tsconfig.app.json .
cp ../../tsconfig.node.json .
cp ../../postcss.config.js .
cp ../../tailwind.config.js .
cp ../../eslint.config.js .
cp ../../.env.* .
cp ../../index.html .

# 移动package.json并更新
cp ../../package.json .
cp ../../package-lock.json .

# 移动public目录
cp -r ../../public .

# 移动构建脚本
cp ../../build.sh .
cp ../../deploy-to-wp.sh .
cp ../../start-dev.sh .

# 移动文档
mkdir -p docs
cp ../../README.md docs/
cp ../../PROJECT-STATUS.md docs/
cp ../../PROJECT-RULES.md docs/
cp ../../PAGINATION.md docs/

# 设置权限
chmod +x build.sh deploy-to-wp.sh start-dev.sh

echo "代码移动完成！" 