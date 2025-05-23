import re
from collections import OrderedDict

def parse_table_fields(init_sql):
    """
    解析init.sql，返回{表名: [字段1, 字段2, ...]}的字典
    """
    table_fields = {}
    table_pattern = re.compile(r'CREATE TABLE IF NOT EXISTS `(\w+)` \((.*?)\)\s*ENGINE', re.S)
    field_pattern = re.compile(r'`(\w+)`')
    for table_match in table_pattern.finditer(init_sql):
        table_name = table_match.group(1)
        fields_block = table_match.group(2)
        # 只保留字段定义行
        fields = []
        for line in fields_block.splitlines():
            m = field_pattern.match(line.strip())
            if m:
                fields.append(m.group(1))
        table_fields[table_name] = fields
    return table_fields

def parse_insert_fields(demo_sql):
    """
    解析demo SQL，返回{表名: [字段1, 字段2, ...]}的字典
    """
    insert_fields = {}
    insert_pattern = re.compile(r'INSERT INTO `(\w+)` \((.*?)\)\s*VALUES', re.S)
    for insert_match in insert_pattern.finditer(demo_sql):
        table_name = insert_match.group(1)
        fields_str = insert_match.group(2)
        fields = [f.strip(' `') for f in fields_str.split(',')]
        insert_fields[table_name] = fields
    return insert_fields

def compare_fields(init_fields, insert_fields):
    """
    对比字段，输出修正建议
    """
    for table, std_fields in init_fields.items():
        if table not in insert_fields:
            print(f"[{table}] 在demo SQL中未找到INSERT语句")
            continue
        demo_fields = insert_fields[table]
        if std_fields == demo_fields:
            print(f"[{table}] 字段顺序和数量完全一致。")
            continue
        print(f"\n[{table}] 字段不一致：")
        print(f"  init.sql字段:  {std_fields}")
        print(f"  demo SQL字段: {demo_fields}")
        # 缺失字段
        missing = [f for f in std_fields if f not in demo_fields]
        if missing:
            print(f"  缺失字段: {missing}")
        # 多余字段
        extra = [f for f in demo_fields if f not in std_fields]
        if extra:
            print(f"  多余字段: {extra}")
        # 顺序不一致
        if sorted(std_fields) == sorted(demo_fields) and std_fields != demo_fields:
            print("  字段顺序不一致，应调整为：")
            print(f"    ({', '.join(std_fields)})")
        print("  建议：将INSERT语句字段顺序和数量调整为init.sql定义。")

if __name__ == '__main__':
    with open('docker/dev/mysql/init.sql', encoding='utf-8') as f:
        init_sql = f.read()
    with open('docker/dev/mysql/demo_batch1_dict.sql', encoding='utf-8') as f:
        demo_sql = f.read()
    init_fields = parse_table_fields(init_sql)
    insert_fields = parse_insert_fields(demo_sql)
    compare_fields(init_fields, insert_fields)