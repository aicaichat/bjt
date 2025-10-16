#!/bin/bash
# 系统安全检查脚本 - 检查是否被黑

echo "========================================="
echo "   系统安全检查工具"
echo "========================================="
echo ""

# 生成报告文件
REPORT_FILE="/tmp/security-check-report-$(date +%Y%m%d-%H%M%S).txt"
echo "报告将保存到: $REPORT_FILE"
echo ""

# 函数：同时输出到屏幕和文件
log() {
    echo "$@" | tee -a "$REPORT_FILE"
}

log "检查时间: $(date)"
log "主机名: $(hostname)"
log "========================================="
log ""

# 1. 检查异常登录
log "1️⃣ 检查最近登录记录"
log "========================================="
log "最近10次成功登录:"
last -n 10 | tee -a "$REPORT_FILE"
log ""

log "最近失败的登录尝试:"
lastb -n 20 2>/dev/null | tee -a "$REPORT_FILE" || log "无法访问 lastb (需要 root 权限)"
log ""

# 2. 检查当前登录用户
log "2️⃣ 当前登录的用户"
log "========================================="
who | tee -a "$REPORT_FILE"
log ""

log "当前活动的 SSH 连接:"
ss -tnp | grep ssh | tee -a "$REPORT_FILE" || netstat -tnp | grep ssh | tee -a "$REPORT_FILE"
log ""

# 3. 检查异常进程
log "3️⃣ 检查可疑进程"
log "========================================="
log "高 CPU 使用的进程 (前10):"
ps aux --sort=-%cpu | head -11 | tee -a "$REPORT_FILE"
log ""

log "高内存使用的进程 (前10):"
ps aux --sort=-%mem | head -11 | tee -a "$REPORT_FILE"
log ""

log "检查挖矿相关进程:"
ps aux | grep -iE "xmrig|cpuminer|minerd|crypto|miner" | grep -v grep | tee -a "$REPORT_FILE" || log "✅ 未发现挖矿进程"
log ""

# 4. 检查网络连接
log "4️⃣ 检查异常网络连接"
log "========================================="
log "所有建立的外部连接:"
ss -tnp state established 2>/dev/null | tee -a "$REPORT_FILE" || netstat -tnp | grep ESTABLISHED | tee -a "$REPORT_FILE"
log ""

log "检查可疑端口监听:"
ss -tlnp | grep -E ":(4444|5555|6666|7777|8888|9999|31337)" | tee -a "$REPORT_FILE" || log "✅ 未发现常见后门端口"
log ""

# 5. 检查 cron 任务
log "5️⃣ 检查定时任务"
log "========================================="
log "Root 的 cron 任务:"
crontab -l 2>/dev/null | tee -a "$REPORT_FILE" || log "无 root cron 任务"
log ""

log "/etc/crontab:"
cat /etc/crontab | tee -a "$REPORT_FILE"
log ""

log "/etc/cron.d/ 目录:"
ls -la /etc/cron.d/ | tee -a "$REPORT_FILE"
log ""

# 6. 检查用户账号
log "6️⃣ 检查用户账号"
log "========================================="
log "所有用户账号:"
cat /etc/passwd | tee -a "$REPORT_FILE"
log ""

log "具有 shell 的用户:"
grep -v "/nologin\|/false" /etc/passwd | tee -a "$REPORT_FILE"
log ""

log "检查新增用户 (最近7天):"
find /home -maxdepth 1 -type d -mtime -7 -ls 2>/dev/null | tee -a "$REPORT_FILE"
log ""

# 7. 检查 SSH 配置
log "7️⃣ 检查 SSH 配置"
log "========================================="
log "SSH 配置关键项:"
grep -E "^PermitRootLogin|^PasswordAuthentication|^PubkeyAuthentication|^Port" /etc/ssh/sshd_config | tee -a "$REPORT_FILE"
log ""

log "检查 authorized_keys:"
for user_home in /root /home/*; do
    if [ -f "$user_home/.ssh/authorized_keys" ]; then
        log "--- $user_home/.ssh/authorized_keys ---"
        cat "$user_home/.ssh/authorized_keys" | tee -a "$REPORT_FILE"
    fi
done
log ""

# 8. 检查系统日志
log "8️⃣ 检查系统日志"
log "========================================="
log "Auth 日志中的异常 (最近50行):"
tail -50 /var/log/auth.log 2>/dev/null | grep -iE "failed|invalid|error|refused" | tee -a "$REPORT_FILE" || \
tail -50 /var/log/secure 2>/dev/null | grep -iE "failed|invalid|error|refused" | tee -a "$REPORT_FILE" || \
log "无法访问认证日志"
log ""

log "检查暴力破解尝试:"
grep "Failed password" /var/log/auth.log 2>/dev/null | tail -20 | tee -a "$REPORT_FILE" || \
grep "Failed password" /var/log/secure 2>/dev/null | tail -20 | tee -a "$REPORT_FILE" || \
log "无失败登录记录"
log ""

# 9. 检查文件完整性
log "9️⃣ 检查关键文件修改"
log "========================================="
log "最近24小时内修改的系统文件:"
find /etc /bin /sbin /usr/bin /usr/sbin -type f -mtime -1 -ls 2>/dev/null | head -20 | tee -a "$REPORT_FILE"
log ""

log "检查 /tmp 目录可疑文件:"
ls -la /tmp | grep -E "\.sh$|\.py$|\.pl$" | tee -a "$REPORT_FILE" || log "✅ /tmp 无可疑脚本"
log ""

# 10. 检查 Docker 容器
log "🔟 检查 Docker 容器"
log "========================================="
log "运行中的容器:"
docker ps --format "table {{.ID}}\t{{.Names}}\t{{.Image}}\t{{.Status}}" | tee -a "$REPORT_FILE"
log ""

log "容器资源使用:"
docker stats --no-stream | tee -a "$REPORT_FILE"
log ""

log "检查容器日志中的异常:"
for container in $(docker ps -q); do
    container_name=$(docker inspect --format='{{.Name}}' $container | sed 's/\///')
    log "--- $container_name 日志（最近20行）---"
    docker logs $container --tail=20 2>&1 | grep -iE "error|fail|attack|hack|unauthorized" | tee -a "$REPORT_FILE" || log "  无明显异常"
done
log ""

# 11. 检查磁盘空间和异常文件
log "1️⃣1️⃣ 检查磁盘和文件系统"
log "========================================="
log "磁盘使用情况:"
df -h | tee -a "$REPORT_FILE"
log ""

log "大文件检查 (>100MB):"
find / -type f -size +100M 2>/dev/null | head -20 | xargs ls -lh 2>/dev/null | tee -a "$REPORT_FILE"
log ""

# 12. 检查防火墙规则
log "1️⃣2️⃣ 检查防火墙规则"
log "========================================="
iptables -L -n -v 2>/dev/null | tee -a "$REPORT_FILE" || log "无法访问 iptables"
log ""

# 13. 检查最近安装的软件包
log "1️⃣3️⃣ 检查最近安装的软件"
log "========================================="
if command -v yum &> /dev/null; then
    log "最近安装的 RPM 包:"
    rpm -qa --last | head -20 | tee -a "$REPORT_FILE"
elif command -v apt &> /dev/null; then
    log "最近安装的 DEB 包:"
    grep " install " /var/log/dpkg.log 2>/dev/null | tail -20 | tee -a "$REPORT_FILE" || \
    grep " install " /var/log/apt/history.log 2>/dev/null | tail -20 | tee -a "$REPORT_FILE"
fi
log ""

# 14. 检查异常的环境变量
log "1️⃣4️⃣ 检查环境变量"
log "========================================="
env | grep -iE "LD_PRELOAD|LD_LIBRARY_PATH" | tee -a "$REPORT_FILE" || log "✅ 无异常环境变量"
log ""

# 15. 检查 Web 服务器日志
log "1️⃣5️⃣ 检查 Web 服务器日志"
log "========================================="
log "Nginx 访问日志中的可疑请求 (最近50行):"
docker logs prod_nginx_1 2>&1 | tail -50 | grep -iE "sql|union|select|exec|script|alert|eval|base64" | tee -a "$REPORT_FILE" || log "✅ 未发现明显的攻击请求"
log ""

# 16. 生成安全评分
log ""
log "========================================="
log "   安全评估总结"
log "========================================="
log ""

# 计算风险项
RISK_COUNT=0

# 检查关键指标
if lastb -n 1 &>/dev/null; then
    FAILED_LOGINS=$(lastb | wc -l)
    if [ $FAILED_LOGINS -gt 100 ]; then
        log "⚠️  警告: 检测到 $FAILED_LOGINS 次失败登录尝试"
        RISK_COUNT=$((RISK_COUNT + 1))
    fi
fi

if ps aux | grep -iE "xmrig|cpuminer|minerd" | grep -v grep &>/dev/null; then
    log "🔴 严重: 检测到挖矿进程！"
    RISK_COUNT=$((RISK_COUNT + 3))
fi

SUSPICIOUS_PORTS=$(ss -tlnp 2>/dev/null | grep -E ":(4444|5555|6666|7777|31337)" | wc -l)
if [ $SUSPICIOUS_PORTS -gt 0 ]; then
    log "⚠️  警告: 检测到 $SUSPICIOUS_PORTS 个可疑端口监听"
    RISK_COUNT=$((RISK_COUNT + 2))
fi

log ""
if [ $RISK_COUNT -eq 0 ]; then
    log "✅ 安全状态: 正常"
    log "   未检测到明显的安全威胁"
elif [ $RISK_COUNT -le 2 ]; then
    log "⚠️  安全状态: 需要关注"
    log "   检测到 $RISK_COUNT 个潜在风险项"
else
    log "🔴 安全状态: 高风险"
    log "   检测到 $RISK_COUNT 个风险项，建议立即处理"
fi

log ""
log "========================================="
log "完整报告已保存到: $REPORT_FILE"
log "========================================="
log ""

log "💡 建议操作:"
log "1. 仔细查看报告中标记为 ⚠️  或 🔴 的项目"
log "2. 检查所有未知的网络连接和进程"
log "3. 查看完整报告: cat $REPORT_FILE"
log "4. 如果发现异常，立即:"
log "   - 断开网络连接"
log "   - 停止可疑进程"
log "   - 修改所有密码"
log "   - 联系安全专家"

