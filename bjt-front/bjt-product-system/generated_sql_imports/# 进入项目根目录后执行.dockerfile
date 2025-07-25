# 进入项目根目录后执行
docker-compose  --env-file .env  -f docker/prod/docker-compose.prod.yml \
  exec -T mysql sh -c '
    mysql -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE" \
      --batch --raw --execute "
        SELECT * FROM wp_bjt_relations
  WHERE  host_part_number = '60A01113'
  AND  part_number = '60A01108'
  AND  child_part_number = '60A04005';
      "
  '