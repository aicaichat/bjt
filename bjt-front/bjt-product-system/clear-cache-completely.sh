#!/bin/bash

echo "🚨 完整缓存清理解决方案"
echo "=========================="

echo "📋 步骤1：服务器端添加缓存破坏符"
echo "在服务器上执行："
echo ""
echo "# 避免bash感叹号问题的修复版本"
echo 'timestamp=$(date +%s)'
echo 'sed -i.bak "s|<head>|<head><meta name=\"cache-buster\" content=\"${timestamp}\"><meta name=\"build-date\" content=\"$(date)\">|" frontend/dist/index.html'
echo 'echo "✅ 版本号: ${timestamp}"'
echo ""
echo "# 验证修改"
echo 'head -10 frontend/dist/index.html | grep -E "(cache-buster|build-date)"'
echo ""

echo "📋 步骤2：重启Web服务器"
echo "# 重启Nginx"
echo "sudo systemctl reload nginx"
echo ""

echo "📋 步骤3：浏览器端强制刷新"
echo "在浏览器中执行以下操作："
echo ""
echo "🔥 Chrome/Safari/Edge:"
echo "- 按 Ctrl+Shift+R (Windows) 或 Cmd+Shift+R (Mac) 硬刷新"
echo "- 或者按 F12 打开开发者工具 → 右键刷新按钮 → 选择'清空缓存并硬刷新'"
echo ""
echo "🔥 Firefox:"
echo "- 按 Ctrl+F5 (Windows) 或 Cmd+F5 (Mac) 硬刷新"
echo ""
echo "🔥 万能方法 - 清除浏览器缓存:"
echo "- Chrome: 设置 → 隐私设置和安全性 → 清除浏览数据"
echo "- Safari: 开发 → 清空缓存"
echo "- Firefox: 历史记录 → 清除最近的历史记录"
echo ""

echo "📋 步骤4：验证修复生效"
echo "刷新后检查以下修复是否生效："
echo ""
echo "✅ Logo变大了吗？(从40px变为72px)"
echo "✅ 购物车中的'Browse Categories'按钮消失了吗？"
echo "✅ 'Continue Shopping'按钮能正确导航吗？"
echo "✅ 管理后台下拉框显示最新数据吗？"
echo ""

echo "🔧 如果仍然不生效，使用终极方案："
echo "1. 打开无痕/隐私浏览模式"
echo "2. 或者换一个浏览器测试"
echo "3. 或者在URL后面加上 ?v=$(date +%s) 强制刷新"
echo ""

echo "📞 调试方法："
echo "1. 按F12打开开发者工具"
echo "2. 查看Network面板，确认资源重新加载"
echo "3. 查看Console面板，看是否有错误信息"
echo ""

echo "🎯 预期结果："
echo "- Logo尺寸：72px (大尺寸)"
echo "- 购物车：无 Browse Categories 按钮"
echo "- 导航：Continue Shopping 智能导航"
echo "- 管理后台：下拉框显示最新数据" 