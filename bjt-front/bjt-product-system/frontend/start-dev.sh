#!/bin/bash
# BJT项目开发服务器启动脚本
# 使用方法: chmod +x start-dev.sh 然后运行 ./start-dev.sh

# 设置颜色变量
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # 恢复默认颜色

echo -e "${GREEN}=== BJT产品管理系统开发助手 ===${NC}"
echo ""

# 检查项目状态文件是否存在
if [ ! -f "PROJECT-STATUS.md" ]; then
  echo -e "${RED}错误: PROJECT-STATUS.md 文件不存在!${NC}"
  echo "请先创建项目状态文件。"
  exit 1
fi

# 显示最近更新
echo -e "${BLUE}最近更新:${NC}"
awk '/^## 最近更新/,/^##/{if(!/^## (最近更新|.*)/){print "  ",$0}}' PROJECT-STATUS.md
echo ""

# 显示当前问题
echo -e "${YELLOW}当前问题与解决计划:${NC}"
awk '/^## 当前问题与解决计划/,/^##/{if(!/^## (当前问题与解决计划|.*)/){print $0}}' PROJECT-STATUS.md
echo ""

# 显示优先工作项
echo -e "${GREEN}优先工作项:${NC}"
awk '/^## 优先工作项/,/^##/{if(!/^## (优先工作项|.*)/){print $0}}' PROJECT-STATUS.md
echo ""

# 显示检查清单
echo -e "${BLUE}执行命令前检查清单:${NC}"
awk '/^## 执行命令前检查清单/,/^##/{if(!/^## (执行命令前检查清单|.*)/){print $0}}' PROJECT-RULES.md
echo ""

# 确认继续
echo -e "${YELLOW}确保您已经查阅了项目状态和规则文件，了解当前工作重点。${NC}"
echo -e "按 ${GREEN}Enter${NC} 键继续启动开发服务器，或按 ${RED}Ctrl+C${NC} 取消..."
read

# 启动开发服务器
echo -e "${GREEN}启动开发服务器...${NC}"
npm run dev 