#!/bin/bash
# BJT项目迭代脚本
# 自动执行开发流程、更新状态文件并进行Git提交
# 使用方法: chmod +x iterate.sh 然后运行 ./iterate.sh [迭代任务]

# 设置颜色变量
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # 恢复默认颜色

# 获取当前时间
TIMESTAMP=$(date +"%Y-%m-%d %H:%M")
DATE_ONLY=$(date +"%Y-%m-%d")

# 检查参数
if [ "$#" -eq 0 ]; then
  echo -e "${RED}错误: 缺少迭代任务参数${NC}"
  echo "用法: ./iterate.sh [迭代任务]"
  echo "示例: ./iterate.sh \"迁移购物车页面到正确位置\""
  exit 1
fi

TASK="$1"
BRANCH_NAME="task/$(echo $TASK | tr '[:upper:] ' '[:lower:]-' | tr -cd 'a-z0-9-')"

echo -e "${GREEN}=== BJT项目迭代管理 ===${NC}"
echo -e "${BLUE}任务:${NC} $TASK"
echo -e "${BLUE}分支:${NC} $BRANCH_NAME"
echo ""

# 检查项目状态文件是否存在
if [ ! -f "PROJECT-STATUS.md" ]; then
  echo -e "${RED}错误: PROJECT-STATUS.md 文件不存在!${NC}"
  echo "请先创建项目状态文件。"
  exit 1
fi

# 检查Git状态
if ! git rev-parse --is-inside-work-tree &>/dev/null; then
  echo -e "${RED}错误: 当前目录不是Git仓库!${NC}"
  echo "请确保您在Git项目根目录下运行此脚本。"
  exit 1
fi

# 检查是否有未提交的更改
if ! git diff --quiet HEAD; then
  echo -e "${YELLOW}警告: 您有未提交的更改${NC}"
  echo "建议先提交或存储(stash)当前更改，再开始新的迭代。"
  echo -e "是否继续? (y/n): ${NC}"
  read -r CONTINUE
  if [[ ! "$CONTINUE" =~ ^[Yy]$ ]]; then
    echo "已取消迭代。"
    exit 0
  fi
fi

# 显示项目状态摘要
echo -e "${PURPLE}项目状态摘要:${NC}"
echo "-----------------------"

# 显示当前问题
echo -e "${YELLOW}当前问题:${NC}"
awk '/^## 当前问题与解决计划/,/^##/{if(!/^## (当前问题与解决计划|.*)/){print $0}}' PROJECT-STATUS.md | sed 's/^/  /'
echo ""

# 显示优先工作项
echo -e "${GREEN}优先工作项:${NC}"
awk '/^## 优先工作项/,/^##/{if(!/^## (优先工作项|.*)/){print $0}}' PROJECT-STATUS.md | sed 's/^/  /'
echo ""

# 创建并切换到新分支
echo -e "${BLUE}创建迭代分支...${NC}"
git checkout -b "$BRANCH_NAME" 2>/dev/null || git checkout "$BRANCH_NAME"
echo ""

# 运行开发服务器
echo -e "${GREEN}启动开发服务器进行迭代工作...${NC}"
echo "请在开发完成后按 Ctrl+C 终止服务器，继续迭代流程。"
echo ""

# 运行开发服务器
./start-dev.sh

# 开发服务器终止后，提示用户更新状态文件
echo ""
echo -e "${YELLOW}开发服务器已终止.${NC}"
echo -e "${GREEN}您现在需要更新项目状态文件以反映本次迭代的更改。${NC}"
echo -e "是否立即编辑PROJECT-STATUS.md? (y/n): ${NC}"
read -r EDIT_STATUS

if [[ "$EDIT_STATUS" =~ ^[Yy]$ ]]; then
  ${EDITOR:-nano} PROJECT-STATUS.md
fi

# 提示用户添加提交信息
echo ""
echo -e "${BLUE}准备提交代码...${NC}"
echo -e "请添加详细的提交描述 (按Enter使用默认描述):"
echo -e "默认: \"${TASK} - ${DATE_ONLY}\""
read -r COMMIT_MSG

if [ -z "$COMMIT_MSG" ]; then
  COMMIT_MSG="${TASK} - ${DATE_ONLY}"
fi

# 添加所有更改
echo -e "${GREEN}添加文件更改...${NC}"
git add .

# 提交更改
echo -e "${GREEN}提交更改...${NC}"
git commit -m "$COMMIT_MSG"

# 提示用户是否要合并回主分支
echo ""
echo -e "${YELLOW}是否合并回主分支? (y/n): ${NC}"
read -r MERGE

if [[ "$MERGE" =~ ^[Yy]$ ]]; then
  # 获取主分支名
  MAIN_BRANCH=$(git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null | sed 's@^refs/remotes/origin/@@')
  if [ -z "$MAIN_BRANCH" ]; then
    echo -e "${YELLOW}无法自动确定主分支名称${NC}"
    echo -e "请输入主分支名称 (通常是main或master):"
    read -r MAIN_BRANCH
  fi
  
  echo -e "${GREEN}切换到${MAIN_BRANCH}分支...${NC}"
  git checkout "$MAIN_BRANCH"
  
  echo -e "${GREEN}合并${BRANCH_NAME}分支...${NC}"
  git merge --no-ff "$BRANCH_NAME" -m "合并迭代: $TASK"
  
  echo -e "${YELLOW}是否删除功能分支${BRANCH_NAME}? (y/n): ${NC}"
  read -r DELETE_BRANCH
  
  if [[ "$DELETE_BRANCH" =~ ^[Yy]$ ]]; then
    echo -e "${GREEN}删除分支${BRANCH_NAME}...${NC}"
    git branch -d "$BRANCH_NAME"
  fi
fi

# 更新执行日志
echo ""
echo -e "${GREEN}更新PROJECT-STATUS.md执行日志...${NC}"
# 使用sed在"执行日志"表格下添加新行
sed -i '' "/^## 执行日志/,/^#/{/^| 日期 | 操作 | 状态 | 备注 |/!{/^|---/!{/^$/!{/^#/!{/^| /!{s/^/| $DATE_ONLY | $TASK | ✅ | 完成并提交 |\n/;:a;n;ba}}}}}}' PROJECT-STATUS.md

echo ""
echo -e "${GREEN}迭代完成!${NC}"
echo -e "请查看PROJECT-STATUS.md文件了解最新的项目状态。" 