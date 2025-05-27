import re
import glob
from collections import OrderedDict

def parse_table_fields(init_sql):
    table_fields = {}
    table_pattern = re.compile(r'CREATE TABLE IF NOT EXISTS `(\w+)` \((.*?)\)\s*ENGINE', re.S)
    field_pattern = re.compile(r'`(\w+)`')
    for table_match in table_pattern.finditer(init_sql):
        table_name = table_match.group(1)
        fields_block = table_match.group(2)
        fields = []
        for line in fields_block.splitlines():
            m = field_pattern.match(line.strip())
            if m:
                fields.append(m.group(1))
        table_fields[table_name] = fields
    return table_fields

def parse_insert_blocks(sql):
    # 支持多行字段列表
    insert_pattern = re.compile(
        r'INSERT INTO `(\w+)`\s*\((.*?)\)\s*VALUES\s*(.*?);',
        re.S)
    blocks = []
    for m in insert_pattern.finditer(sql):
        table = m.group(1)
        fields = [f.strip(' `\n') for f in m.group(2).replace('\n', '').split(',')]
        values_block = m.group(3)
        # 拆分多条values
        values = []
        for v in re.findall(r'\([^\)]*\)', values_block, re.S):
            values.append(v.strip())
        blocks.append({'table': table, 'fields': fields, 'values': values, 'raw': m.group(0)})
    return blocks

def fix_insert_block(block, std_fields):
    # 生成修正后的字段顺序和values
    field_map = {f: i for i, f in enumerate(block['fields'])}
    fixed_values = []
    for v in block['values']:
        # 解析values内容
        items = []
        cur = ''
        in_str = False
        quote = ''
        for c in v[1:-1] + ',':
            if c in ("'", '"'):
                if not in_str:
                    in_str = True
                    quote = c
                elif quote == c:
                    in_str = False
                cur += c
            elif c == ',' and not in_str:
                items.append(cur.strip())
                cur = ''
            else:
                cur += c
        if cur: items.append(cur.strip())
        # 补全/重排
        fixed = []
        for f in std_fields:
            if f in field_map:
                idx = field_map[f]
                fixed.append(items[idx] if idx < len(items) else 'NULL')
            else:
                # 补NULL
                fixed.append('NULL')
        fixed_values.append('(' + ', '.join(fixed) + ')')
    return fixed_values

def process_demo_file(demo_path, std_fields_map):
    with open(demo_path, encoding='utf-8') as f:
        sql = f.read()
    blocks = parse_insert_blocks(sql)
    output_lines = []
    for block in blocks:
        table = block['table']
        if table not in std_fields_map:
            print(f'表 {table} 未在init.sql中定义，跳过。')
            continue
        std_fields = std_fields_map[table]
        # 检查是否一致
        if block['fields'] == std_fields:
            print(f'[{table}] 字段顺序和数量完全一致。')
            output_lines.append(block['raw'])
            continue
        print(f'[{table}] 字段不一致，自动修正...')
        print(f'  标准字段: {std_fields}')
        print(f'  当前字段: {block["fields"]}')
        fixed_values = fix_insert_block(block, std_fields)
        # 生成修正后的SQL
        fixed_sql = f'INSERT INTO `{table}` ({", ".join(std_fields)}) VALUES\n  ' + ',\n  '.join(fixed_values) + ';'
        output_lines.append(fixed_sql)
    return output_lines

if __name__ == '__main__':
    # 1. 解析init.sql
    with open('docker/dev/mysql/init.sql', encoding='utf-8') as f:
        init_sql = f.read()
    std_fields_map = parse_table_fields(init_sql)

    # 2. 处理所有demo_batch*.sql
    demo_files = sorted(glob.glob('docker/dev/mysql/demo_batch*.sql'))
    for demo_path in demo_files:
        print(f'\n==== 处理 {demo_path} ====')
        fixed_sqls = process_demo_file(demo_path, std_fields_map)
        # 输出修正后的SQL到新文件
        out_path = demo_path.replace('.sql', '_fixed.sql')
        with open(out_path, 'w', encoding='utf-8') as f:
            f.write('\n\n'.join(fixed_sqls))
        print(f'修正后的SQL已保存到: {out_path}')