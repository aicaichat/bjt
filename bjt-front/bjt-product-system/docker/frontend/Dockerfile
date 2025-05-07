# 使用 nginx 作为基础镜像
FROM nginx:alpine

# 复制 nginx 配置文件
COPY default.conf /etc/nginx/conf.d/default.conf

# 暴露端口
EXPOSE 80

# 启动 nginx
CMD ["nginx", "-g", "daemon off;"] 