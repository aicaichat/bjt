#!/usr/bin/env python3

with open('src/pages/SpareParts/index.tsx', 'r') as f:
    content = f.read()

# 查找 SparePartsPage 函数的开始
start_pos = content.find('const SparePartsPage = () => {')
if start_pos == -1:
    print('SparePartsPage function not found')
    exit(1)

# 从函数开始位置计算括号匹配
brace_count = 0
pos = start_pos
lines = content[:start_pos].count('\n') + 1

for i, char in enumerate(content[start_pos:]):
    if char == '{':
        brace_count += 1
    elif char == '}':
        brace_count -= 1
        if brace_count == 0:
            end_pos = start_pos + i
            end_line = content[:end_pos].count('\n') + 1
            print(f'Function ends at line {end_line}')
            if end_line < 1620:
                print(f'ERROR: Function ends too early at line {end_line}!')
                # 查找可能的多余闭合括号
                problem_area = content[start_pos:end_pos]
                print('Problem area around the early end:')
                problem_lines = problem_area.split('\n')
                for j, line in enumerate(problem_lines[-10:]):
                    print(f'{end_line - 10 + j}: {line}')
            break
    if char == '\n':
        lines += 1 